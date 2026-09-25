import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * Scroll horizontal controlado por el scroll vertical.
 * La sección se alarga lo que mide el recorrido y el contenido queda en
 * position: sticky mientras la pista se desplaza. Nada de position: fixed.
 */
export function initProjects() {
    const section = document.querySelector<HTMLElement>("[data-projects]");
    const sticky = section?.querySelector<HTMLElement>("[data-projects-sticky]");
    const track = section?.querySelector<HTMLElement>("[data-projects-track]");
    if (!section || !sticky || !track) return;

    Object.assign(sticky.style, {
        position: "sticky",
        top: "0",
        height: "100vh",
        overflow: "hidden",
        paddingBlock: "0",
    });
    Object.assign(track.style, { overflowX: "visible", scrollSnapType: "none" });

    let distance = 0;
    const measure = () => {
        distance = Math.max(0, track.scrollWidth - window.innerWidth);
        section.style.height = `${window.innerHeight + distance}px`;
    };
    measure();
    ScrollTrigger.addEventListener("refreshInit", measure);

    gsap.to(track, {
        x: () => -distance,
        ease: "none",
        scrollTrigger: {
            trigger: section,
            start: "top top",
            end: "bottom bottom",
            scrub: true,
            invalidateOnRefresh: true,
        },
    });
}
