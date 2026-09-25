import { gsap } from "gsap";

/** Línea bajo el Nav que se llena según cuánto de la página se ha leído. */
export function initProgress() {
    const bar = document.querySelector<HTMLElement>("[data-progress]");
    if (!bar) return;

    gsap.to(bar, {
        scaleX: 1,
        ease: "none",
        scrollTrigger: {
            trigger: document.body,
            start: "top top",
            end: "bottom bottom",
            scrub: 0.3,
        },
    });
}
