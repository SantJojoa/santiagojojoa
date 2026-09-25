import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export function initHero() {
    const hero = document.querySelector<HTMLElement>("#top");
    if (!hero) return;

    // Entrada: cada línea del título sube desde una máscara, luego el resto aparece.
    gsap.timeline({ defaults: { ease: "expo.out" }, delay: 0.15 })
        .fromTo(
            "[data-hero-line]",
            { yPercent: 115, y: 0 }, // y: 0 anula los 115 % que trae el CSS inicial
            { yPercent: 0, y: 0, duration: 1.4, stagger: 0.12 },
        )
        .fromTo(
            "[data-hero-fade]",
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, duration: 1.1, stagger: 0.1 },
            "-=0.9",
        );

    // Salida: el bloque se desvanece y se aleja al hacer scroll.
    gsap.to("[data-hero-content]", {
        yPercent: -10,
        scale: 0.94,
        opacity: 0,
        ease: "none",
        scrollTrigger: {
            trigger: hero,
            start: "top top",
            end: "bottom 25%",
            scrub: true,
        },
    });

    gsap.to("[data-scroll-cue]", {
        opacity: 0,
        y: 12,
        ease: "none",
        scrollTrigger: { start: 0, end: 220, scrub: true },
    });

    ScrollTrigger.refresh();
}
