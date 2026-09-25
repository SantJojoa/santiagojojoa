import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { es } from "../i18n/es";
import type { Finding, Grade, Report, Status } from "../lib/analyzer/types";

type Dict = (typeof es)["analyzer"];

const root = document.querySelector<HTMLElement>("[data-analyzer-tool]");
const dictNode = document.getElementById("analyzer-i18n");

if (root && dictNode) {
    const t: Dict = JSON.parse(dictNode.textContent ?? "{}");
    const form = root.querySelector<HTMLFormElement>("[data-form]")!;
    const input = root.querySelector<HTMLInputElement>("#analyzer-url")!;
    const button = root.querySelector<HTMLButtonElement>("[data-submit]")!;
    const errorBox = root.querySelector<HTMLElement>("[data-error]")!;
    const loading = root.querySelector<HTMLElement>("[data-loading]")!;
    const results = root.querySelector<HTMLElement>("[data-results]")!;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Todo lo que viene del sitio analizado se inserta con textContent, nunca como HTML.
    const el = (tag: string, cls = "", text?: string) => {
        const node = document.createElement(tag);
        if (cls) node.className = cls;
        if (text !== undefined) node.textContent = text;
        return node;
    };

    const STATUS_DOT: Record<Status, string> = {
        pass: "bg-success",
        warn: "bg-warning",
        fail: "bg-danger",
        info: "bg-accent-blue",
    };
    const STATUS_TEXT: Record<Status, string> = {
        pass: "text-success",
        warn: "text-warning",
        fail: "text-danger",
        info: "text-accent-blue",
    };
    const STATUS_ORDER: Record<Status, number> = { fail: 0, warn: 1, info: 2, pass: 3 };
    const CATEGORIES = ["transport", "headers", "cookies", "disclosure", "other"] as const;

    const gradeColor = (g: Grade) =>
        g === "A+" || g === "A" ? "#22c55e" : g === "B" ? "#22d3ee" : g === "C" ? "#f59e0b" : "#ef4444";

    const setLoading = (on: boolean) => {
        button.disabled = on;
        input.disabled = on;
        button.textContent = on ? t.form.submitting : t.form.submit;
        loading.hidden = !on;
    };

    const showError = (code: string, retryAfter?: number) => {
        const known = t.errors as Record<string, string>;
        let msg = known[code] ?? t.errors.internal;
        if (code === "rate_limited" && retryAfter) msg += ` (${retryAfter} s)`;
        errorBox.textContent = msg;
        errorBox.hidden = false;
    };

    // ---------- resultados ----------

    function summary(r: Report): HTMLElement {
        const card = el("div", "glass-1 p-8 md:p-10");
        const wrap = el("div", "flex flex-col gap-8 sm:flex-row sm:items-center");

        const C = 2 * Math.PI * 52;
        const ring = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        ring.setAttribute("viewBox", "0 0 120 120");
        ring.setAttribute("class", "h-full w-full -rotate-90");
        ring.setAttribute("aria-hidden", "true");
        const track = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        const arc = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        for (const c of [track, arc]) {
            c.setAttribute("cx", "60");
            c.setAttribute("cy", "60");
            c.setAttribute("r", "52");
            c.setAttribute("fill", "none");
            c.setAttribute("stroke-width", "8");
        }
        track.setAttribute("stroke", "rgba(255,255,255,0.10)");
        arc.setAttribute("stroke", gradeColor(r.grade));
        arc.setAttribute("stroke-linecap", "round");
        arc.setAttribute("stroke-dasharray", String(C));
        const target = C * (1 - r.score / 100);
        arc.setAttribute("stroke-dashoffset", String(reduceMotion ? target : C));
        arc.dataset.target = String(target);
        arc.dataset.ring = "";
        ring.append(track, arc);

        const gauge = el("div", "relative h-40 w-40 shrink-0");
        const center = el("div", "absolute inset-0 flex flex-col items-center justify-center");
        const letter = el("span", "text-5xl font-semibold", r.grade);
        letter.style.color = gradeColor(r.grade);
        center.append(letter, el("span", "mt-1 text-xs text-white/50", `${r.score} ${t.results.outOf}`));
        gauge.append(ring, center);

        const info = el("div", "min-w-0 flex-1");
        info.append(
            el("p", "text-sm font-medium uppercase tracking-[0.22em] text-accent", t.results.title),
            el("p", "mt-2 text-2xl font-semibold tracking-[-0.02em]", t.results.grades[r.grade]),
            el("p", "mt-4 text-xs text-white/40", t.results.analyzed),
            el("p", "mt-1 break-all font-mono text-sm text-white/80", r.finalUrl),
        );

        const chips = el("ul", "mt-5 flex flex-wrap gap-2");
        const chip = (text: string) =>
            chips.append(el("li", "rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-white/80", text));
        chip(`${t.results.httpStatus}: ${r.status}`);
        chip(r.tls?.protocol ? `${t.results.tls}: ${r.tls.protocol}` : t.results.noTls);
        if (r.tls?.issuer) chip(`${t.results.issuer}: ${r.tls.issuer}`);
        if (r.tls?.daysLeft != null) chip(`${r.tls.daysLeft} ${t.results.daysLeft}`);
        chip(`${t.results.redirects}: ${Math.max(0, r.redirects.length - 1)}`);
        chip(`${t.results.duration}: ${(r.durationMs / 1000).toFixed(1)} s`);
        info.append(chips);

        wrap.append(gauge, info);
        card.append(wrap);
        return card;
    }

    function findingRow(f: Finding): HTMLElement {
        const d = t.findings as Record<string, { title: string; why: string; fix: string }>;
        const text = d[f.id] ?? { title: f.id, why: "", fix: "" };
        const codes = t.codes as Record<string, string>;

        const row = el("details", "group border-t border-white/10 first:border-t-0");
        const head = el("summary", "flex cursor-pointer list-none items-center gap-3 px-5 py-4 marker:hidden [&::-webkit-details-marker]:hidden");
        head.append(el("span", `h-2.5 w-2.5 shrink-0 rounded-full ${STATUS_DOT[f.status]}`));
        head.append(el("span", "min-w-0 flex-1 font-medium", text.title));
        head.append(el("span", `text-xs font-medium ${STATUS_TEXT[f.status]}`, t.results.statusLabels[f.status]));
        if (f.max > 0) head.append(el("span", "w-12 shrink-0 text-right font-mono text-xs text-white/40", `${f.points}/${f.max}`));
        head.append(el("span", "text-white/40 transition-transform group-open:rotate-90", "›"));
        row.append(head);

        const body = el("div", "space-y-3 px-5 pb-5 pl-10 text-sm leading-relaxed text-white/70");
        if (f.codes?.length) {
            const ul = el("ul", "list-inside list-disc text-white/85");
            for (const c of f.codes) ul.append(el("li", "", codes[c] ?? c));
            body.append(ul);
        }
        if (f.detail) body.append(el("code", "block break-all rounded-xl bg-black/40 px-3 py-2 font-mono text-xs text-white/70", f.detail));
        if (text.why) {
            const p = el("p");
            p.append(el("strong", "text-white", `${t.results.why}: `), document.createTextNode(text.why));
            body.append(p);
        }
        if (text.fix && f.status !== "pass") {
            const p = el("p");
            p.append(el("strong", "text-accent", `${t.results.fix}: `), document.createTextNode(text.fix));
            body.append(p);
        }
        row.append(body);
        return row;
    }

    function group(cat: (typeof CATEGORIES)[number], list: Finding[]): HTMLElement {
        const sec = el("section", "mt-10");
        const bad = list.filter((f) => f.status === "fail" || f.status === "warn").length;
        const title = el("h3", "mb-3 flex items-baseline gap-3 text-lg font-semibold tracking-[-0.01em]", t.results.categories[cat]);
        if (bad) title.append(el("span", "text-xs font-medium text-warning", String(bad)));
        const box = el("div", "glass-1 overflow-hidden");
        list.sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]).forEach((f) => box.append(findingRow(f)));
        sec.append(title, box);
        return sec;
    }

    function extras(r: Report): HTMLElement {
        const wrap = el("div", "mt-10 space-y-3");

        const headers = el("details", "glass-1 group px-5 py-4");
        headers.append(el("summary", "cursor-pointer list-none font-medium marker:hidden [&::-webkit-details-marker]:hidden", t.results.rawHeaders));
        const entries = Object.entries(r.headers);
        const pre = el("div", "mt-4 space-y-2 font-mono text-xs text-white/70");
        if (!entries.length) pre.append(el("p", "", t.results.noHeaders));
        for (const [k, v] of entries) {
            const line = el("p", "break-all");
            line.append(el("span", "text-accent", `${k}: `), document.createTextNode(v));
            pre.append(line);
        }
        headers.append(pre);
        wrap.append(headers);

        if (r.cookies.length) {
            const cookies = el("details", "glass-1 group px-5 py-4");
            cookies.append(el("summary", "cursor-pointer list-none font-medium marker:hidden [&::-webkit-details-marker]:hidden", `${t.results.cookies} (${r.cookies.length})`));
            const list = el("ul", "mt-4 space-y-2 font-mono text-xs text-white/70");
            for (const c of r.cookies) {
                const flags = [c.secure ? "Secure" : "—", c.httpOnly ? "HttpOnly" : "—", c.sameSite ? `SameSite=${c.sameSite}` : "—"].join(" · ");
                list.append(el("li", "break-all", `${c.name}  →  ${flags}`));
            }
            cookies.append(list, el("p", "mt-3 text-xs text-white/40", t.results.cookieFlags));
            wrap.append(cookies);
        }
        return wrap;
    }

    function render(r: Report) {
        results.replaceChildren();
        results.append(summary(r));

        const byCat = new Map<string, Finding[]>();
        for (const f of r.findings) byCat.set(f.category, [...(byCat.get(f.category) ?? []), f]);
        for (const cat of CATEGORIES) {
            const list = byCat.get(cat);
            if (list?.length) results.append(group(cat, list));
        }
        results.append(extras(r));

        const foot = el("div", "mt-10 flex flex-col items-start gap-4");
        const again = el("button", "rounded-full border border-white/20 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-white/10", t.results.analyzeAnother);
        again.type = "button";
        again.addEventListener("click", () => {
            results.replaceChildren();
            input.value = "";
            input.focus();
            ScrollTrigger.refresh();
        });
        foot.append(again, el("p", "max-w-2xl text-xs leading-relaxed text-white/40", t.results.disclaimer));
        results.append(foot);

        if (!reduceMotion) {
            const arc = results.querySelector<SVGCircleElement>("[data-ring]");
            gsap.fromTo(results.children, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.9, ease: "expo.out", stagger: 0.08 });
            if (arc) {
                gsap.to(arc, { attr: { "stroke-dashoffset": Number(arc.dataset.target) }, duration: 1.6, ease: "expo.out", delay: 0.2 });
            }
        }
        ScrollTrigger.refresh(); // la sección creció: recalcular posiciones de las animaciones de más abajo
        results.focus({ preventScroll: true });
        results.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    }

    // ---------- envío ----------

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const value = input.value.trim();
        if (!value) return;

        errorBox.hidden = true;
        results.replaceChildren();
        ScrollTrigger.refresh();
        setLoading(true);

        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 15000);
        try {
            const res = await fetch("/api/analyze", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ url: value }),
                signal: ctrl.signal,
            });
            const data = await res.json().catch(() => null);
            if (!res.ok || !data || data.error) {
                showError(data?.error ?? "internal", data?.retryAfter);
            } else {
                render(data as Report);
            }
        } catch {
            showError("network");
        } finally {
            clearTimeout(timer);
            setLoading(false);
        }
    });
}
