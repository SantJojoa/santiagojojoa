import { gsap } from "gsap";

/** Botones que se inclinan hacia el cursor cuando está cerca. */
export function initMagnetic() {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    document.querySelectorAll<HTMLElement>("[data-magnetic]").forEach((el) => {
        const x = gsap.quickTo(el, "x", { duration: 0.5, ease: "power3.out" });
        const y = gsap.quickTo(el, "y", { duration: 0.5, ease: "power3.out" });

        el.addEventListener("pointermove", (e) => {
            const r = el.getBoundingClientRect();
            x((e.clientX - (r.left + r.width / 2)) * 0.3);
            y((e.clientY - (r.top + r.height / 2)) * 0.3);
        });
        el.addEventListener("pointerleave", () => {
            x(0);
            y(0);
        });
    });
}
