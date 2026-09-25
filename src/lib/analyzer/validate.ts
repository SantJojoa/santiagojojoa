import { isIP } from "node:net";
import { AnalyzerError } from "./errors.ts";
import { isBlockedIp } from "./ip.ts";

const MAX_INPUT_LENGTH = 2048;

/** Sufijos que solo existen en redes internas. */
const INTERNAL_SUFFIXES = [
    "localhost",
    "local",
    "localdomain",
    "internal",
    "intranet",
    "lan",
    "home",
    "corp",
    "home.arpa",
];

/** Solo web estándar: nada de escanear otros puertos a través de este servidor. */
const ALLOWED_PORTS = new Set(["", "80", "443"]);

function assertPublicHostname(rawHost: string): void {
    const host = rawHost.toLowerCase().replace(/\.$/, "");
    if (!host) throw new AnalyzerError("invalid_url");

    // IPv6 literal: [2001:db8::1]
    const bare = host.startsWith("[") && host.endsWith("]") ? host.slice(1, -1) : host;

    if (isIP(bare)) {
        if (isBlockedIp(bare)) throw new AnalyzerError("blocked_host");
        return;
    }

    // Un nombre sin punto no es un dominio público (p. ej. "intranet", "metadata").
    if (!bare.includes(".")) throw new AnalyzerError("blocked_host");
    if (INTERNAL_SUFFIXES.some((s) => bare === s || bare.endsWith(`.${s}`))) {
        throw new AnalyzerError("blocked_host");
    }
}

/**
 * Comprueba una URL ya parseada (también se usa en cada redirección).
 * Esto es la primera barrera; la definitiva es la resolución DNS validada
 * en fetcher.ts, que también atrapa dominios que apuntan a IPs internas.
 */
export function assertAllowedUrl(url: URL): void {
    if (url.protocol !== "http:" && url.protocol !== "https:") {
        throw new AnalyzerError("unsupported_protocol");
    }
    if (url.username || url.password) throw new AnalyzerError("invalid_url");
    if (!ALLOWED_PORTS.has(url.port)) throw new AnalyzerError("unsupported_port");
    assertPublicHostname(url.hostname);
}

/** Convierte la entrada del usuario en una URL http(s) permitida. */
export function parseTarget(input: unknown): URL {
    if (typeof input !== "string") throw new AnalyzerError("invalid_url");

    let raw = input.trim();
    if (!raw || raw.length > MAX_INPUT_LENGTH) throw new AnalyzerError("invalid_url");

    // "ejemplo.com" -> "https://ejemplo.com". Otros esquemas (file://, ftp://…) se rechazan abajo.
    if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(raw)) raw = `https://${raw}`;

    let url: URL;
    try {
        url = new URL(raw);
    } catch {
        throw new AnalyzerError("invalid_url");
    }

    assertAllowedUrl(url);
    return url;
}
