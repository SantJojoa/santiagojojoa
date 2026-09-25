import dns from "node:dns";
import http from "node:http";
import https from "node:https";
import type { TLSSocket } from "node:tls";
import { AnalyzerError } from "./errors.ts";
import { isBlockedIp } from "./ip.ts";
import { assertAllowedUrl } from "./validate.ts";

const USER_AGENT =
    "SantiagoJojoa-HeaderAnalyzer/1.0 (+https://santiagojojoa.com; passive check: plain GET, headers only)";
const MAX_REDIRECTS = 5;
const PER_REQUEST_TIMEOUT_MS = 5000;

export interface TlsInfo {
    protocol: string | null;
    authorized: boolean;
    authError: string | null;
    issuer: string | null;
    subject: string | null;
    validFrom: string | null;
    validTo: string | null;
    daysLeft: number | null;
}

export interface RawResponse {
    url: URL;
    status: number;
    headers: http.IncomingHttpHeaders;
    setCookies: string[];
    tls?: TlsInfo;
    body: string;
}

export interface RequestOptions {
    /** Instante (ms epoch) en el que la operación completa debe haber terminado. */
    deadline: number;
    /** Bytes del cuerpo a leer (0 = solo cabeceras). */
    maxBody?: number;
}

type LookupCallback = (
    err: NodeJS.ErrnoException | null,
    address?: string | dns.LookupAddress[],
    family?: number,
) => void;

/**
 * DEFENSA SSRF PRINCIPAL. Sustituye a la resolución DNS normal de la conexión:
 *  1. resuelve el nombre,
 *  2. rechaza si CUALQUIERA de las IPs es privada/reservada,
 *  3. devuelve la IP validada, que es la única a la que se conecta el socket.
 * Al no haber una segunda resolución entre la validación y la conexión, no hay
 * ventana para un ataque de DNS rebinding.
 */
function safeLookup(
    hostname: string,
    options: dns.LookupOptions,
    callback: LookupCallback,
): void {
    dns.lookup(hostname, { all: true, verbatim: true }, (err, addresses) => {
        if (err) return callback(err);
        if (!addresses.length) return callback(new AnalyzerError("dns_failed") as never);

        if (addresses.some((a) => isBlockedIp(a.address))) {
            return callback(new AnalyzerError("blocked_host") as never);
        }

        const wanted = options.family === 4 || options.family === 6 ? options.family : 0;
        const usable = wanted ? addresses.filter((a) => a.family === wanted) : addresses;
        if (!usable.length) return callback(new AnalyzerError("dns_failed") as never);

        if (options.all) return callback(null, usable);
        callback(null, usable[0].address, usable[0].family);
    });
}

function mapError(err: unknown): AnalyzerError {
    if (err instanceof AnalyzerError) return err;
    const code = (err as NodeJS.ErrnoException)?.code;
    if (code === "ENOTFOUND" || code === "EAI_AGAIN" || code === "ENODATA") {
        return new AnalyzerError("dns_failed");
    }
    if (code === "ETIMEDOUT") return new AnalyzerError("timeout");
    return new AnalyzerError("connect_failed");
}

function daysUntil(dateString: string | undefined): number | null {
    if (!dateString) return null;
    const t = Date.parse(dateString);
    return Number.isNaN(t) ? null : Math.floor((t - Date.now()) / 86_400_000);
}

function readTls(res: http.IncomingMessage): TlsInfo | undefined {
    const socket = res.socket as TLSSocket;
    if (typeof socket.getPeerCertificate !== "function") return undefined;

    const cert = socket.getPeerCertificate();
    const empty = !cert || Object.keys(cert).length === 0;
    const issuer = empty ? null : (cert.issuer?.O ?? cert.issuer?.CN ?? null);
    const authError = socket.authorizationError;

    return {
        protocol: socket.getProtocol() ?? null,
        authorized: Boolean(socket.authorized),
        authError: authError ? String(authError) : null,
        issuer: Array.isArray(issuer) ? issuer[0] : issuer,
        subject: empty ? null : ((Array.isArray(cert.subject?.CN) ? cert.subject.CN[0] : cert.subject?.CN) ?? null),
        validFrom: empty ? null : cert.valid_from ?? null,
        validTo: empty ? null : cert.valid_to ?? null,
        daysLeft: empty ? null : daysUntil(cert.valid_to),
    };
}

/** Una sola petición GET. No sigue redirecciones. */
export function requestOnce(url: URL, { deadline, maxBody = 0 }: RequestOptions): Promise<RawResponse> {
    return new Promise((resolve, reject) => {
        const remaining = deadline - Date.now();
        if (remaining <= 0) return reject(new AnalyzerError("timeout"));
        const timeoutMs = Math.min(PER_REQUEST_TIMEOUT_MS, remaining);

        const isHttps = url.protocol === "https:";
        const lib = isHttps ? https : http;
        let settled = false;

        const finish = (fn: () => void) => {
            if (settled) return;
            settled = true;
            clearTimeout(timer);
            fn();
        };

        const req = lib.request(
            {
                hostname: url.hostname.replace(/^\[|\]$/g, ""),
                port: url.port || (isHttps ? 443 : 80),
                path: `${url.pathname}${url.search}`,
                method: "GET",
                headers: {
                    "user-agent": USER_AGENT,
                    accept: "*/*",
                    "accept-encoding": "identity", // sin compresión: el cuerpo, si se lee, es texto plano
                    connection: "close",
                },
                agent: false, // conexión nueva, sin reutilizar sockets entre destinos
                lookup: safeLookup as never,
                maxHeaderSize: 32 * 1024,
                // Solo se LEEN cabeceras y certificado, nunca se envían datos del usuario:
                // aceptar certificados inválidos permite informar del problema en vez de fallar.
                rejectUnauthorized: false,
            },
            (res) => {
                const tls = isHttps ? readTls(res) : undefined;
                const chunks: Buffer[] = [];
                let size = 0;

                const done = () => {
                    finish(() =>
                        resolve({
                            url,
                            status: res.statusCode ?? 0,
                            headers: res.headers,
                            setCookies: res.headers["set-cookie"] ?? [],
                            tls,
                            body: Buffer.concat(chunks).toString("utf8"),
                        }),
                    );
                    res.destroy();
                };

                res.on("error", () => {}); // tras destroy() pueden llegar ECONNRESET: se ignoran

                if (maxBody <= 0) return done();

                res.on("data", (chunk: Buffer) => {
                    size += chunk.length;
                    chunks.push(size > maxBody ? chunk.subarray(0, chunk.length - (size - maxBody)) : chunk);
                    if (size >= maxBody) done();
                });
                res.on("end", done);
            },
        );

        const timer = setTimeout(() => req.destroy(new AnalyzerError("timeout")), timeoutMs);

        req.on("error", (err) => finish(() => reject(mapError(err))));
        req.end();
    });
}

export interface RedirectHop {
    url: string;
    status: number;
}

/**
 * GET siguiendo redirecciones a mano: cada salto se vuelve a validar (esquema,
 * puerto, host) y su DNS se valida de nuevo al conectar. Un redirect a
 * http://169.254.169.254 o a localhost se rechaza igual que la petición inicial.
 */
export async function fetchFollowing(
    start: URL,
    deadline: number,
): Promise<{ response: RawResponse; chain: RedirectHop[] }> {
    const chain: RedirectHop[] = [];
    let url = start;

    for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
        assertAllowedUrl(url);
        const response = await requestOnce(url, { deadline });
        chain.push({ url: url.href, status: response.status });

        const location = response.headers.location;
        if (response.status >= 300 && response.status < 400 && location) {
            try {
                url = new URL(location, url);
            } catch {
                throw new AnalyzerError("invalid_url");
            }
            continue;
        }
        return { response, chain };
    }
    throw new AnalyzerError("too_many_redirects");
}
