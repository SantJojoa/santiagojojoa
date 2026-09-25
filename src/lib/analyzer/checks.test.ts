import { test } from "node:test";
import assert from "node:assert/strict";
import { cspIssues, evaluate, parseCookies, parseCsp } from "./checks.ts";
import { computeScore } from "./score.ts";
import type { EvalInput, Finding } from "./types.ts";

const goodTls = { protocol: "TLSv1.3", authorized: true, authError: null, issuer: "X", subject: "x", validFrom: "", validTo: "", daysLeft: 80 };

const strong: EvalInput = {
    finalUrl: new URL("https://ejemplo.com/"),
    headers: {
        "strict-transport-security": "max-age=63072000; includeSubDomains; preload",
        "content-security-policy": "default-src 'self'; script-src 'self' 'nonce-abc'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'",
        "x-content-type-options": "nosniff",
        "referrer-policy": "strict-origin-when-cross-origin",
        "permissions-policy": "camera=()",
        "cross-origin-opener-policy": "same-origin",
        "cross-origin-resource-policy": "same-origin",
    },
    setCookies: ["sid=abc; Secure; HttpOnly; SameSite=Lax; Path=/"],
    tls: goodTls,
    redirectChain: [{ url: "https://ejemplo.com/", status: 200 }],
    httpProbe: { reachable: true, redirectsToHttps: true },
    securityTxt: true,
};

const by = (f: Finding[], id: string) => f.find((x) => x.id === id)!;

test("un sitio bien configurado obtiene A+", () => {
    const f = evaluate(strong);
    const { score, grade } = computeScore(f);
    assert.equal(score, 100);
    assert.equal(grade, "A+");
    assert.ok(f.every((x) => x.status === "pass"), JSON.stringify(f.filter((x) => x.status !== "pass")));
});

test("un sitio sin ninguna protección obtiene F/D y marca lo importante", () => {
    const f = evaluate({ ...strong, headers: { server: "Apache/2.4.41 (Ubuntu)", "x-powered-by": "PHP/7.4" }, setCookies: ["PHPSESSID=1; path=/"], httpProbe: { reachable: true, redirectsToHttps: false }, securityTxt: false });
    assert.equal(by(f, "csp").status, "fail");
    assert.equal(by(f, "hsts").status, "fail");
    assert.equal(by(f, "http_redirect").status, "fail");
    assert.equal(by(f, "server_header").status, "warn");
    assert.equal(by(f, "tech_disclosure").status, "warn");
    assert.equal(by(f, "cookies").status, "fail");
    assert.match(by(f, "cookies").detail!, /PHPSESSID: Secure, HttpOnly, SameSite/);
    const { grade } = computeScore(f);
    assert.ok(["D", "F"].includes(grade), grade);
});

test("sitio en HTTP: falla https y la nota máxima es F aunque el resto sea perfecto", () => {
    const f = evaluate({ ...strong, finalUrl: new URL("http://ejemplo.com/"), tls: undefined, httpProbe: undefined });
    assert.equal(by(f, "https").status, "fail");
    assert.equal(by(f, "hsts").status, "fail");
    assert.equal(computeScore(f).grade, "F");
});

test("redirección de https a http se detecta como degradación", () => {
    const f = evaluate({ ...strong, redirectChain: [{ url: "https://ejemplo.com/", status: 301 }, { url: "http://ejemplo.com/", status: 200 }] });
    assert.deepEqual(by(f, "https").codes, ["downgrade"]);
});

test("certificado inválido limita la nota a C", () => {
    const f = evaluate({ ...strong, tls: { ...goodTls, authorized: false, authError: "CERT_HAS_EXPIRED" } });
    assert.equal(by(f, "certificate").status, "fail");
    assert.ok(["C", "D", "F"].includes(computeScore(f).grade));
});

test("certificado por vencer da aviso", () => {
    const f = evaluate({ ...strong, tls: { ...goodTls, daysLeft: 5 } });
    assert.equal(by(f, "certificate").status, "warn");
});

test("TLS antiguo falla, TLS 1.2 pasa", () => {
    assert.equal(by(evaluate({ ...strong, tls: { ...goodTls, protocol: "TLSv1.1" } }), "tls_version").status, "fail");
    assert.equal(by(evaluate({ ...strong, tls: { ...goodTls, protocol: "TLSv1.2" } }), "tls_version").status, "pass");
});

test("HSTS con max-age corto es aviso", () => {
    const f = evaluate({ ...strong, headers: { ...strong.headers, "strict-transport-security": "max-age=300" } });
    assert.equal(by(f, "hsts").status, "warn");
});

test("CSP débil: unsafe-inline, unsafe-eval, comodines", () => {
    assert.deepEqual(cspIssues(parseCsp("default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' *; object-src 'none'; base-uri 'self'")).sort(), ["unsafe-eval", "unsafe-inline", "wildcard-source"]);
    // con nonce, 'unsafe-inline' lo ignoran los navegadores modernos: no es un problema
    assert.deepEqual(cspIssues(parseCsp("script-src 'unsafe-inline' 'nonce-x'; object-src 'none'; base-uri 'self'")), []);
    assert.ok(cspIssues(parseCsp("img-src 'self'")).includes("no-script-src"));
});

test("CSP solo en modo report-only no cuenta como protección", () => {
    const { "content-security-policy": _drop, ...rest } = strong.headers;
    const f = evaluate({ ...strong, headers: { ...rest, "content-security-policy-report-only": "default-src 'self'" } });
    assert.equal(by(f, "csp").status, "warn");
    assert.deepEqual(by(f, "csp").codes, ["report-only"]);
});

test("frame_protection: X-Frame-Options o frame-ancestors", () => {
    const { "content-security-policy": _d, ...rest } = strong.headers;
    assert.equal(by(evaluate({ ...strong, headers: { ...rest, "x-frame-options": "DENY" } }), "frame_protection").status, "pass");
    assert.equal(by(evaluate({ ...strong, headers: { ...rest } }), "frame_protection").status, "fail");
});

test("CORS: comodín + credenciales es fallo; comodín solo es informativo", () => {
    const bad = evaluate({ ...strong, headers: { ...strong.headers, "access-control-allow-origin": "*", "access-control-allow-credentials": "true" } });
    assert.equal(by(bad, "cors").status, "fail");
    const ok = evaluate({ ...strong, headers: { ...strong.headers, "access-control-allow-origin": "*" } });
    assert.equal(by(ok, "cors").status, "info");
});

test("cookies: se listan solo los nombres con banderas que faltan; sin cookies no cuenta", () => {
    const c = parseCookies(["a=1; Secure; HttpOnly; SameSite=Strict", "b=2; HttpOnly", "c=3"]);
    assert.deepEqual(c.map((x) => [x.name, x.secure, x.httpOnly, x.sameSite]), [["a", true, true, "strict"], ["b", false, true, null], ["c", false, false, null]]);
    const none = evaluate({ ...strong, setCookies: [] });
    assert.equal(by(none, "cookies").max, 0);
    assert.equal(computeScore(none).score, 100, "sin cookies no penaliza");
});

test("los valores de cookies nunca se copian al resultado", () => {
    const [c] = parseCookies(["session=SECRETO123; Secure"]);
    assert.equal(JSON.stringify(c).includes("SECRETO123"), false);
});

test("los detalles largos se recortan (los valores vienen del sitio analizado)", () => {
    const f = evaluate({ ...strong, headers: { ...strong.headers, server: "Apache/2.4.1 " + "x".repeat(500) } });
    assert.ok(by(f, "server_header").detail!.length <= 101);
});
