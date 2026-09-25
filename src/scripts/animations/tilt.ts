import { gsap } from "gsap";

/**
 * Inclinación 3D suave + brillo especular que sigue al cursor.
 * Solo con ratón: en táctil no hay hover y no se activa.
 */
export function initTilt() {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    document.querySelectorAll<HTMLElement>("[data-tilt]").forEach((card) => {
        gsap.set(card, { transformPerspective: 900 });

        card.addEventListener("pointermove", (e) => {
            const r = card.getBoundingClientRect();
            const px = (e.clientX - r.left) / r.width;
            const py = (e.clientY - r.top) / r.height;

            gsap.to(card, {
                rotationY: (px - 0.5) * 8,
                rotationX: (0.5 - py) * 8,
                "--mx": `${px * 100}%`,
                "--my": `${py * 100}%`,
                duration: 0.5,
                ease: "power3.out",
                overwrite: "auto",
            });
        });

        card.addEventListener("pointerleave", () => {
            gsap.to(card, {
                rotationX: 0,
                rotationY: 0,
                "--mx": "15%",
                "--my": "-10%",
                duration: 0.9,
                ease: "expo.out",
                overwrite: "auto",
            });
        });
    });
}
