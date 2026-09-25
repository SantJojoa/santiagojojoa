import { test } from "node:test";
import assert from "node:assert/strict";
import { isBlockedIp } from "./ip.ts";
import { parseTarget } from "./validate.ts";
import { hit, resetRateLimits } from "./rate-limit.ts";
import { AnalyzerError } from "./errors.ts";

const codeOf = (fn: () => unknown) => {
    try {
        fn();
    } catch (e) {
        return e instanceof AnalyzerError ? e.code : `other:${e}`;
    }
    return "no-error";
};

test("IPs privadas, reservadas y de metadatos se bloquean", () => {
    for (const ip of [
        "127.0.0.1", "127.255.255.254", "10.0.0.1", "10.255.255.255",
        "172.16.0.1", "172.31.255.255", "192.168.1.1", "169.254.169.254",
        "100.64.0.1", "0.0.0.0", "224.0.0.1", "255.255.255.255", "198.18.0.1",
        "::1", "::", "fe80::1", "fc00::1", "fd12:3456::1", "ff02::1",
        "::ffff:127.0.0.1", "::ffff:10.0.0.1", "::ffff:169.254.169.254", "::ffff:7f00:1", // mapped privadas
        "64:ff9b::7f00:1", "2002:7f00:1::1", "2001:db8::1",
    ]) {
        assert.equal(isBlockedIp(ip), true, `${ip} debería estar bloqueada`);
    }
});

test("IPs públicas se permiten", () => {
    for (const ip of ["8.8.8.8", "1.1.1.1", "93.184.216.34", "172.32.0.1", "172.15.255.255", "11.0.0.1", "2606:4700:4700::1111", "2001:4860:4860::8888", "::ffff:8.8.8.8"]) {
        assert.equal(isBlockedIp(ip), false, `${ip} debería permitirse`);
    }
});

test("cosas que no son IP se bloquean por seguridad", () => {
    for (const v of ["", "abc", "1.2.3", "999.1.1.1", "fe80::1%eth0"]) {
        assert.equal(isBlockedIp(v), true, v);
    }
});

test("parseTarget añade https:// y normaliza", () => {
    assert.equal(parseTarget("example.com").href, "https://example.com/");
    assert.equal(parseTarget("  http://example.com/a?b=1 ").href, "http://example.com/a?b=1");
    assert.equal(parseTarget("https://EXAMPLE.com:443/").hostname, "example.com");
});

test("esquemas no http(s) se rechazan", () => {
    for (const u of ["file:///etc/passwd", "ftp://example.com", "gopher://example.com", "data:text/html,hi", "javascript:alert(1)"]) {
        assert.notEqual(codeOf(() => parseTarget(u)), "no-error", u);
    }
    assert.equal(codeOf(() => parseTarget("ftp://example.com")), "unsupported_protocol");
});

test("hosts internos y literales de IP privada se bloquean", () => {
    for (const u of [
        "http://localhost", "https://localhost:443", "http://foo.localhost", "http://intranet",
        "http://metadata", "http://printer.local", "http://db.internal", "http://x.home.arpa",
        "http://127.0.0.1", "http://10.1.2.3", "http://192.168.0.1", "http://169.254.169.254/latest/meta-data",
        "http://[::1]", "http://[::ffff:7f00:1]", "http://[fe80::1]",
        // formas alternativas de escribir 127.0.0.1 (el parser WHATWG las normaliza)
        "http://2130706433", "http://0x7f000001", "http://0177.0.0.1", "http://127.1", "http://0",
    ]) {
        assert.equal(codeOf(() => parseTarget(u)), "blocked_host", u);
    }
});

test("solo puertos 80 y 443", () => {
    for (const u of ["https://example.com:22", "http://example.com:8080", "https://example.com:3306", "http://example.com:6379"]) {
        assert.equal(codeOf(() => parseTarget(u)), "unsupported_port", u);
    }
    assert.equal(codeOf(() => parseTarget("http://example.com:80")), "no-error");
    assert.equal(codeOf(() => parseTarget("https://example.com:443")), "no-error");
});

test("credenciales en la URL se rechazan", () => {
    assert.equal(codeOf(() => parseTarget("https://user:pass@example.com")), "invalid_url");
    assert.equal(codeOf(() => parseTarget("https://user@example.com")), "invalid_url");
});

test("entradas inválidas", () => {
    for (const v of [undefined, null, 42, {}, "", "   ", "a".repeat(3000), "http://", "https://exa mple.com"]) {
        assert.equal(codeOf(() => parseTarget(v)), "invalid_url", String(v).slice(0, 30));
    }
});

test("rate limit: bloquea al superar el límite y libera al pasar la ventana", () => {
    resetRateLimits();
    const t0 = 1_000_000;
    for (let i = 0; i < 3; i++) assert.equal(hit("ip:a", 3, t0 + i).ok, true);
    const blocked = hit("ip:a", 3, t0 + 10);
    assert.equal(blocked.ok, false);
    assert.ok(blocked.retryAfter > 0 && blocked.retryAfter <= 60);
    assert.equal(hit("ip:b", 3, t0 + 10).ok, true, "otra clave no se ve afectada");
    assert.equal(hit("ip:a", 3, t0 + 61_000).ok, true, "tras la ventana vuelve a permitir");
});
