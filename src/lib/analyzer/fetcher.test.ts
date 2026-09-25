import { test } from "node:test";
import assert from "node:assert/strict";
import { requestOnce } from "./fetcher.ts";
import { AnalyzerError } from "./errors.ts";

const deadline = () => Date.now() + 8000;

const codeOf = async (fn: () => Promise<unknown>) => {
    try {
        await fn();
    } catch (e) {
        return e instanceof AnalyzerError ? e.code : `other:${(e as Error).message}`;
    }
    return "no-error";
};

// Estos casos usan DNS real: prueban la defensa que atrapa dominios "públicos"
// cuyo registro A apunta a una IP interna (el caso que la validación de texto no ve).
test("un dominio público que resuelve a 127.0.0.1 se bloquea al conectar", async () => {
    for (const host of ["localtest.me", "127.0.0.1.nip.io", "169.254.169.254.nip.io", "10.0.0.1.nip.io"]) {
        const code = await codeOf(() => requestOnce(new URL(`https://${host}/`), { deadline: deadline() }));
        assert.equal(code, "blocked_host", host);
    }
});

test("un host inexistente da dns_failed", async () => {
    const code = await codeOf(() => requestOnce(new URL("https://no-existe-santiago-test.example/"), { deadline: deadline() }));
    assert.ok(code === "dns_failed" || code === "connect_failed", code);
});

test("un sitio real responde con cabeceras y TLS", async () => {
    const res = await requestOnce(new URL("https://example.com/"), { deadline: deadline() });
    assert.ok(res.status >= 200 && res.status < 400);
    assert.ok(res.tls?.protocol?.startsWith("TLS"), "debe informar el protocolo TLS");
    assert.equal(res.tls?.authorized, true);
    assert.ok((res.tls?.daysLeft ?? -1) > 0);
});
