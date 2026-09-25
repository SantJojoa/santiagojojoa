import type { TlsInfo, RedirectHop } from "./fetcher.ts";

export type Status = "pass" | "warn" | "fail" | "info";
export type Category = "transport" | "headers" | "cookies" | "disclosure" | "other";

/**
 * Hallazgo neutral en idioma: la API no devuelve texto, solo identificadores.
 * La interfaz traduce `id` (título, por qué importa, cómo corregirlo) y `codes`.
 */
export interface Finding {
    id: string;
    category: Category;
    status: Status;
    points: number;
    /** Peso máximo del control. 0 = no aplica y no cuenta para la nota. */
    max: number;
    /** Códigos traducibles por la interfaz (p. ej. "absent", "unsafe-inline"). */
    codes?: string[];
    /** Valor técnico tal cual (cabecera, versión…). Se muestra como texto, nunca como HTML. */
    detail?: string;
}

export interface CookieInfo {
    name: string;
    secure: boolean;
    httpOnly: boolean;
    sameSite: string | null;
}

export type Grade = "A+" | "A" | "B" | "C" | "D" | "F";

export interface Report {
    inputUrl: string;
    finalUrl: string;
    status: number;
    redirects: RedirectHop[];
    score: number;
    grade: Grade;
    findings: Finding[];
    headers: Record<string, string>;
    cookies: CookieInfo[];
    tls?: TlsInfo;
    checkedAt: string;
    durationMs: number;
}

export interface EvalInput {
    finalUrl: URL;
    headers: Record<string, string | string[] | undefined>;
    setCookies: string[];
    tls?: TlsInfo;
    redirectChain: RedirectHop[];
    /** Resultado de probar http:// (solo si el sitio final es https). */
    httpProbe?: { reachable: boolean; redirectsToHttps: boolean };
    securityTxt: boolean;
}
