import type { APIRoute } from "astro";
import { analyze } from "../../lib/analyzer/analyze";
import { AnalyzerError, type ErrorCode } from "../../lib/analyzer/errors";
import { hit } from "../../lib/analyzer/rate-limit";

// Función en servidor: el resto del sitio es estático.
export const prerender = false;

const STATUS: Record<ErrorCode, number> = {
    invalid_url: 400,
    unsupported_protocol: 400,
    unsupported_port: 400,
    blocked_host: 400,
    bad_request: 400,
    forbidden_origin: 403,
    payload_too_large: 413,
    rate_limited: 429,
    dns_failed: 422,
    connect_failed: 502,
    too_many_redirects: 422,
    timeout: 504,
    internal: 500,
};

const MAX_BODY_BYTES = 2048;
const PER_IP_PER_MINUTE = 6;
const GLOBAL_PER_MINUTE = 120;

const HEADERS = {
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
};

function fail(code: ErrorCode, extra: Record<string, unknown> = {}, headers: Record<string, string> = {}) {
    return Response.json({ error: code, ...extra }, { status: STATUS[code], headers: { ...HEADERS, ...headers } });
}

export const POST: APIRoute = async ({ request, clientAddress }) => {
    try {
        // Solo desde este mismo sitio (los navegadores envían Origin en POST). Frena que
        // otras páginas usen a los visitantes, o este servidor, como intermediario.
        const origin = request.headers.get("origin");
        if (origin && origin !== new URL(request.url).origin) return fail("forbidden_origin");

        if (!request.headers.get("content-type")?.toLowerCase().includes("application/json")) {
            return fail("bad_request");
        }

        const declared = Number(request.headers.get("content-length") ?? 0);
        if (declared > MAX_BODY_BYTES) return fail("payload_too_large");

        const ip = hit(`ip:${clientAddress}`, PER_IP_PER_MINUTE);
        if (!ip.ok) return fail("rate_limited", { retryAfter: ip.retryAfter }, { "retry-after": String(ip.retryAfter) });
        if (!hit("global", GLOBAL_PER_MINUTE).ok) return fail("rate_limited", { retryAfter: 30 }, { "retry-after": "30" });

        const text = await request.text();
        if (text.length > MAX_BODY_BYTES) return fail("payload_too_large");

        let body: unknown;
        try {
            body = JSON.parse(text);
        } catch {
            return fail("bad_request");
        }
        const url = (body as { url?: unknown } | null)?.url;

        const report = await analyze(url);
        return Response.json(report, { headers: HEADERS });
    } catch (err) {
        if (err instanceof AnalyzerError) {
            return fail(err.code, err.code === "rate_limited" ? { retryAfter: 60 } : {});
        }
        // Nunca se devuelven detalles internos al cliente.
        console.error("[analyzer] error inesperado:", err);
        return fail("internal");
    }
};

export const ALL: APIRoute = () =>
    new Response(null, { status: 405, headers: { ...HEADERS, allow: "POST" } });
