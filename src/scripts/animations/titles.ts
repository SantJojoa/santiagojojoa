import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/** Títulos de sección: cada palabra sube desde su máscara al entrar en pantalla. */
export function initTitles() {
    gsap.utils.toArray<HTMLElement>("[data-split-title]").forEach((title) => {
        const words = title.querySelectorAll("[data-split-word]");

        ScrollTrigger.create({
            trigger: title,
            start: "top 88%",
            once: true,
            onEnter: () =>
                gsap.fromTo(
                    words,
                    { yPercent: 110, y: 0 }, // y: 0 anula los 110 % del CSS inicial
                    {
                        yPercent: 0,
                        y: 0,
                        duration: 1.2,
                        ease: "expo.out",
                        stagger: 0.07,
                    },
                ),
        });
    });
}
