export type ErrorCode =
    | "invalid_url"
    | "unsupported_protocol"
    | "unsupported_port"
    | "blocked_host"
    | "dns_failed"
    | "connect_failed"
    | "timeout"
    | "too_many_redirects"
    | "rate_limited"
    | "forbidden_origin"
    | "bad_request"
    | "payload_too_large"
    | "internal";

/** Error con código estable: la API devuelve solo el código, la UI lo traduce. */
export class AnalyzerError extends Error {
    readonly code: ErrorCode;

    constructor(code: ErrorCode) {
        super(code);
        this.name = "AnalyzerError";
        this.code = code;
    }
}
