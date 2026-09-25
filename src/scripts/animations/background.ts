import { gsap } from "gsap";

/** Parallax del fondo: las manchas de luz se rezagan respecto al contenido. */
export function initBackground() {
    gsap.to(document.body, {
        "--bg-shift": "420px",
        ease: "none",
        scrollTrigger: {
            trigger: document.body,
            start: "top top",
            end: "bottom bottom",
            scrub: true,
        },
    });
}
