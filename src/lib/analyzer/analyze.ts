import { evaluate, parseCookies } from "./checks.ts";
import { AnalyzerError } from "./errors.ts";
import { fetchFollowing, requestOnce } from "./fetcher.ts";
import { hit } from "./rate-limit.ts";
import { computeScore } from "./score.ts";
import type { Report } from "./types.ts";
import { assertAllowedUrl, parseTarget } from "./validate.ts";

/** Tiempo total máximo de un análisis (las funciones serverless tienen tope). */
const OVERALL_MS = 9000;

/** Cabeceras que se devuelven a la interfaz, recortadas: vienen del sitio analizado. */
const SHOWN_HEADERS = [
    "strict-transport-security",
    "content-security-policy",
    "x-frame-options",
    "x-content-type-options",
    "referrer-policy",
    "permissions-policy",
    "cross-origin-opener-policy",
    "cross-origin-resource-policy",
    "cross-origin-embedder-policy",
    "access-control-allow-origin",
    "server",
    "x-powered-by",
];

async function probeHttp(finalUrl: URL, deadline: number) {
    try {
        const url = new URL(`http://${finalUrl.hostname}/`);
        assertAllowedUrl(url);
        const res = await requestOnce(url, { deadline });
        const location = res.headers.location;
        const redirectsToHttps =
            res.status >= 300 && res.status < 400 && !!location && new URL(location, url).protocol === "https:";
        return { reachable: true, redirectsToHttps };
    } catch {
        return { reachable: false, redirectsToHttps: false };
    }
}

async function hasSecurityTxt(finalUrl: URL, deadline: number): Promise<boolean> {
    try {
        const url = new URL("/.well-known/security.txt", finalUrl.origin);
        assertAllowedUrl(url);
        const res = await requestOnce(url, { deadline, maxBody: 8192 });
        // Muchos sitios devuelven 200 con su HTML para cualquier ruta: se exige un campo Contact: real.
        return res.status === 200 && /^\s*contact\s*:/im.test(res.body);
    } catch {
        return false;
    }
}

export async function analyze(input: unknown): Promise<Report> {
    const started = Date.now();
    const start = parseTarget(input);

    // No usar esta herramienta como martillo contra un mismo sitio.
    if (!hit(`host:${start.hostname}`, 4).ok) throw new AnalyzerError("rate_limited");

    const deadline = started + OVERALL_MS;
    const { response, chain } = await fetchFollowing(start, deadline);
    const finalUrl = response.url;
    const isHttps = finalUrl.protocol === "https:";

    const [httpProbe, securityTxt] = await Promise.all([
        isHttps ? probeHttp(finalUrl, deadline) : Promise.resolve(undefined),
        hasSecurityTxt(finalUrl, deadline),
    ]);

    const findings = evaluate({
        finalUrl,
        headers: response.headers,
        setCookies: response.setCookies,
        tls: response.tls,
        redirectChain: chain,
        httpProbe,
        securityTxt,
    });
    const { score, grade } = computeScore(findings);

    const headers: Record<string, string> = {};
    for (const name of SHOWN_HEADERS) {
        const v = response.headers[name];
        if (v) headers[name] = String(Array.isArray(v) ? v.join(", ") : v).slice(0, 500);
    }

    return {
        inputUrl: start.href,
        finalUrl: finalUrl.href,
        status: response.status,
        redirects: chain,
        score,
        grade,
        findings,
        headers,
        cookies: parseCookies(response.setCookies), // solo nombre y banderas, nunca el valor
        tls: response.tls,
        checkedAt: new Date().toISOString(),
        durationMs: Date.now() - started,
    };
}
