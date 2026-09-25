import { gsap } from "gsap";

/** Las palabras del texto se iluminan una a una mientras dura el scroll de la sección. */
export function initAbout() {
    const section = document.querySelector<HTMLElement>("#about");
    const words = gsap.utils.toArray<HTMLElement>("[data-scrub-word]");
    if (!section || !words.length) return;

    gsap.to(words, {
        opacity: 1,
        duration: 1,
        ease: "none",
        stagger: { each: 0.2 },
        scrollTrigger: {
            trigger: section,
            start: "top top",
            end: "bottom bottom",
            scrub: true,
        },
    });
}
