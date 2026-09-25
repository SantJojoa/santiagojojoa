import { gsap } from "gsap";

/** El título de contacto crece y se aclara mientras la sección entra en pantalla. */
export function initContact() {
    const title = document.querySelector<HTMLElement>("[data-contact-title]");
    if (!title) return;

    gsap.fromTo(
        title,
        { scale: 0.78, opacity: 0.15 },
        {
            scale: 1,
            opacity: 1,
            ease: "none",
            scrollTrigger: {
                trigger: "#contact",
                start: "top 85%",
                end: "top 30%",
                scrub: true,
            },
        },
    );
}
