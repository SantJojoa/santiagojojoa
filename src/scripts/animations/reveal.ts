import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/** Todo elemento con [data-reveal] entra suave al llegar al viewport. */
export function initReveal() {
    ScrollTrigger.batch("[data-reveal]", {
        start: "top 88%",
        once: true,
        onEnter: (elements) =>
            gsap.fromTo(
                elements,
                { opacity: 0, y: 40 },
                {
                    opacity: 1,
                    y: 0,
                    duration: 1.2,
                    ease: "expo.out",
                    stagger: 0.12,
                    overwrite: true,
                },
            ),
    });
}
