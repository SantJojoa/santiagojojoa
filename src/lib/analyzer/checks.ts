import type { Category, CookieInfo, EvalInput, Finding, Status } from "./types.ts";

// ---------- utilidades ----------

function headerValue(headers: EvalInput["headers"], name: string): string | undefined {
    const v = headers[name];
    return Array.isArray(v) ? v.join(", ") : v;
}

/** pass = máximo, warn = mitad, fail = 0, info = sin penalización (o excluido si max = 0). */
function make(
    id: string,
    category: Category,
    status: Status,
    max: number,
    extra: { codes?: string[]; detail?: string; points?: number } = {},
): Finding {
    const points =
        extra.points ??
        (status === "pass" || status === "info" ? max : status === "warn" ? Math.floor(max / 2) : 0);
    return { id, category, status, points, max, codes: extra.codes, detail: extra.detail };
}

const clip = (s: string, n = 200) => (s.length > n ? `${s.slice(0, n)}…` : s);

// ---------- CSP ----------

export function parseCsp(value: string): Map<string, string[]> {
    const directives = new Map<string, string[]>();
    for (const part of value.split(";")) {
        const [name, ...values] = part.trim().split(/\s+/);
        if (name && !directives.has(name.toLowerCase())) {
            directives.set(name.toLowerCase(), values);
        }
    }
    return directives;
}

/** Devuelve los problemas que debilitan la política (códigos traducibles). */
export function cspIssues(csp: Map<string, string[]>): string[] {
    const issues: string[] = [];
    const script = csp.get("script-src") ?? csp.get("default-src");

    if (!script) {
        issues.push("no-script-src");
    } else {
        const has = (t: string) => script.some((v) => v.toLowerCase() === t);
        const protectedByNonce = script.some((v) => /^'(nonce-|sha(256|384|512)-)/i.test(v)) || has("'strict-dynamic'");

        if (has("'unsafe-inline'") && !protectedByNonce) issues.push("unsafe-inline");
        if (has("'unsafe-eval'")) issues.push("unsafe-eval");
        if (script.some((v) => v === "*" || v === "http:" || v === "https:" || v === "data:")) {
            issues.push("wildcard-source");
        }
    }

    const objectSrc = csp.get("object-src") ?? csp.get("default-src");
    if (!objectSrc || !objectSrc.some((v) => v.toLowerCase() === "'none'")) issues.push("object-src-open");

    if (!csp.has("base-uri")) issues.push("no-base-uri");
    return issues;
}

// ---------- cookies ----------

export function parseCookies(setCookies: string[]): CookieInfo[] {
    return setCookies.map((raw) => {
        const [pair, ...attrs] = raw.split(";").map((s) => s.trim());
        const name = clip(pair.split("=")[0] ?? "", 60);
        const lower = attrs.map((a) => a.toLowerCase());
        const same = lower.find((a) => a.startsWith("samesite="));
        return {
            name,
            secure: lower.includes("secure"),
            httpOnly: lower.includes("httponly"),
            sameSite: same ? same.split("=")[1] : null,
        };
    });
}

// ---------- evaluación ----------

export function evaluate(input: EvalInput): Finding[] {
    const { finalUrl, headers, tls, httpProbe } = input;
    const isHttps = finalUrl.protocol === "https:";
    const out: Finding[] = [];
    const h = (n: string) => headerValue(headers, n);

    // ===== Transporte =====
    const downgraded = input.redirectChain.some((hop, i) => {
        const next = input.redirectChain[i + 1];
        return next && hop.url.startsWith("https:") && next.url.startsWith("http:");
    });
    out.push(
        isHttps && !downgraded
            ? make("https", "transport", "pass", 10)
            : make("https", "transport", "fail", 10, { codes: [downgraded ? "downgrade" : "plain-http"] }),
    );

    if (!isHttps) {
        out.push(make("http_redirect", "transport", "fail", 5, { codes: ["plain-http"] }));
    } else if (httpProbe?.reachable && httpProbe.redirectsToHttps) {
        out.push(make("http_redirect", "transport", "pass", 5));
    } else if (httpProbe?.reachable) {
        out.push(make("http_redirect", "transport", "fail", 5, { codes: ["serves-plain-http"] }));
    } else {
        out.push(make("http_redirect", "transport", "warn", 5, { codes: ["port-80-closed"] }));
    }

    const hsts = h("strict-transport-security");
    if (!hsts || !isHttps) {
        out.push(make("hsts", "transport", "fail", 5, { codes: ["absent"] }));
    } else {
        const maxAge = Number(/max-age=(\d+)/i.exec(hsts)?.[1] ?? 0);
        const codes: string[] = [];
        if (/includesubdomains/i.test(hsts)) codes.push("include-subdomains");
        if (/preload/i.test(hsts)) codes.push("preload");
        out.push(
            maxAge >= 15_552_000 // 180 días
                ? make("hsts", "transport", "pass", 5, { codes, detail: clip(hsts) })
                : make("hsts", "transport", "warn", 5, { codes: ["short-max-age", ...codes], detail: clip(hsts) }),
        );
    }

    if (!tls?.protocol) {
        out.push(make("tls_version", "transport", "fail", 5, { codes: ["no-tls"] }));
    } else if (tls.protocol === "TLSv1.3" || tls.protocol === "TLSv1.2") {
        out.push(make("tls_version", "transport", "pass", 5, { detail: tls.protocol }));
    } else {
        out.push(make("tls_version", "transport", "fail", 5, { codes: ["legacy-tls"], detail: tls.protocol }));
    }

    if (!tls) {
        out.push(make("certificate", "transport", "fail", 5, { codes: ["no-tls"] }));
    } else if (!tls.authorized) {
        out.push(make("certificate", "transport", "fail", 5, { codes: ["invalid-cert"], detail: tls.authError ?? undefined }));
    } else if (tls.daysLeft !== null && tls.daysLeft <= 14) {
        out.push(make("certificate", "transport", "warn", 5, { codes: ["expiring-soon"], detail: `${tls.daysLeft}` }));
    } else {
        out.push(make("certificate", "transport", "pass", 5, { detail: tls.daysLeft !== null ? `${tls.daysLeft}` : undefined }));
    }

    // ===== Cabeceras =====
    const csp = h("content-security-policy");
    if (!csp) {
        out.push(
            h("content-security-policy-report-only")
                ? make("csp", "headers", "warn", 15, { codes: ["report-only"], points: 4 })
                : make("csp", "headers", "fail", 15, { codes: ["absent"] }),
        );
    } else {
        const parsed = parseCsp(csp);
        const issues = cspIssues(parsed);
        out.push(
            issues.length === 0
                ? make("csp", "headers", "pass", 15, { detail: clip(csp, 400) })
                : make("csp", "headers", "warn", 15, { codes: issues, detail: clip(csp, 400), points: 7 }),
        );
    }

    const xfo = h("x-frame-options")?.toLowerCase();
    const frameAncestors = csp ? parseCsp(csp).has("frame-ancestors") : false;
    if (frameAncestors || xfo === "deny" || xfo === "sameorigin") {
        out.push(make("frame_protection", "headers", "pass", 5, { detail: frameAncestors ? "frame-ancestors" : xfo }));
    } else {
        out.push(make("frame_protection", "headers", "fail", 5, { codes: [xfo ? "weak-value" : "absent"], detail: xfo }));
    }

    out.push(
        h("x-content-type-options")?.toLowerCase().includes("nosniff")
            ? make("nosniff", "headers", "pass", 5)
            : make("nosniff", "headers", "fail", 5, { codes: ["absent"] }),
    );

    const referrer = h("referrer-policy")?.toLowerCase();
    if (!referrer) {
        out.push(make("referrer_policy", "headers", "warn", 5, { codes: ["absent"] }));
    } else {
        // Puede traer varios valores separados por coma; vale el último que entienda el navegador.
        const last = referrer.split(",").map((s) => s.trim()).filter(Boolean).pop() ?? "";
        const safe = ["no-referrer", "same-origin", "strict-origin", "strict-origin-when-cross-origin"];
        out.push(
            safe.includes(last)
                ? make("referrer_policy", "headers", "pass", 5, { detail: last })
                : make("referrer_policy", "headers", "warn", 5, { codes: ["leaky-value"], detail: last }),
        );
    }

    out.push(
        h("permissions-policy")
            ? make("permissions_policy", "headers", "pass", 5)
            : make("permissions_policy", "headers", "warn", 5, { codes: ["absent"] }),
    );

    const coop = h("cross-origin-opener-policy");
    const corp = h("cross-origin-resource-policy");
    out.push(
        coop && corp
            ? make("cross_origin", "headers", "pass", 5, { detail: `COOP: ${clip(coop, 40)} · CORP: ${clip(corp, 40)}` })
            : make("cross_origin", "headers", "warn", 5, {
                  codes: [coop ? "no-corp" : corp ? "no-coop" : "absent"],
                  points: coop || corp ? 3 : 0,
              }),
    );

    // ===== Cookies =====
    const cookies = parseCookies(input.setCookies);
    if (cookies.length === 0) {
        out.push(make("cookies", "cookies", "info", 0, { codes: ["no-cookies"] }));
    } else {
        const problems = cookies
            .map((c) => {
                const missing = [!c.secure && isHttps ? "Secure" : "", !c.httpOnly ? "HttpOnly" : "", !c.sameSite ? "SameSite" : ""].filter(Boolean);
                return missing.length ? `${c.name}: ${missing.join(", ")}` : "";
            })
            .filter(Boolean);
        const okCount = cookies.length - problems.length;
        const detail = problems.slice(0, 5).join(" · ");
        out.push(
            problems.length === 0
                ? make("cookies", "cookies", "pass", 10)
                : okCount === 0
                  ? make("cookies", "cookies", "fail", 10, { detail })
                  : make("cookies", "cookies", "warn", 10, { detail }),
        );
    }

    // ===== Divulgación de información =====
    const server = h("server");
    out.push(
        server && /\d+(\.\d+)+/.test(server)
            ? make("server_header", "disclosure", "warn", 4, { codes: ["version-exposed"], detail: clip(server, 100) })
            : make("server_header", "disclosure", "pass", 4),
    );

    const leaks = ["x-powered-by", "x-aspnet-version", "x-aspnetmvc-version", "x-generator"]
        .map((n) => (h(n) ? `${n}: ${clip(h(n)!, 60)}` : ""))
        .filter(Boolean);
    out.push(
        leaks.length
            ? make("tech_disclosure", "disclosure", "warn", 4, { codes: ["exposed"], detail: leaks.join(" · ") })
            : make("tech_disclosure", "disclosure", "pass", 4),
    );

    // ===== Otros =====
    out.push(
        input.securityTxt
            ? make("security_txt", "other", "pass", 3)
            : make("security_txt", "other", "warn", 3, { codes: ["absent"] }),
    );

    const acao = h("access-control-allow-origin");
    const acac = h("access-control-allow-credentials")?.toLowerCase() === "true";
    if (acao === "*" && acac) {
        out.push(make("cors", "other", "fail", 4, { codes: ["wildcard-credentials"], detail: "ACAO: * · ACAC: true" }));
    } else if (acao === "*") {
        out.push(make("cors", "other", "info", 4, { codes: ["wildcard"], detail: "ACAO: *" }));
    } else {
        out.push(make("cors", "other", "pass", 4, acao ? { detail: `ACAO: ${clip(acao, 80)}` } : {}));
    }

    return out;
}
