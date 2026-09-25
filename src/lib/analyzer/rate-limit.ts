/**
 * Límite de peticiones en memoria (ventana deslizante).
 * Limitación honesta: en serverless cada instancia tiene su propio contador,
 * así que esto es una primera defensa. La definitiva debe ir en el borde
 * (Vercel Firewall / WAF) o en un almacén compartido (Redis).
 */
const WINDOW_MS = 60_000;
const buckets = new Map<string, number[]>();

export interface RateResult {
    ok: boolean;
    retryAfter: number;
}

export function hit(key: string, limit: number, now = Date.now()): RateResult {
    const recent = (buckets.get(key) ?? []).filter((t) => now - t < WINDOW_MS);

    if (recent.length >= limit) {
        buckets.set(key, recent);
        return { ok: false, retryAfter: Math.ceil((WINDOW_MS - (now - recent[0])) / 1000) };
    }

    recent.push(now);
    buckets.set(key, recent);

    // Limpieza ocasional para que el mapa no crezca sin límite.
    if (buckets.size > 2000) {
        for (const [k, times] of buckets) {
            if (times.every((t) => now - t >= WINDOW_MS)) buckets.delete(k);
        }
    }
    return { ok: true, retryAfter: 0 };
}

/** Solo para pruebas. */
export function resetRateLimits() {
    buckets.clear();
}
