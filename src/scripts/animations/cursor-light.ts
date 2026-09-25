import { gsap } from "gsap";

/**
 * Una luz suave sigue al cursor sobre el fondo y cambia de color según la
 * posición horizontal (cian → violeta). Se pinta como una capa más del
 * background del body (ver global.css): sin elementos extra ni position: fixed.
 * Solo con ratón.
 */
export function initCursorLight() {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    const body = document.body;
    const target = { x: 0, y: 0, h: 190, a: 0 };
    const current = { x: 0, y: 0, h: 190, a: 0 };
    let clientX = 0;
    let clientY = 0;
    let seen = false;

    // El fondo pertenece al documento, no al viewport: hay que sumar el scroll.
    const retarget = () => {
        target.x = clientX;
        target.y = clientY + window.scrollY;
        target.h = 185 + (clientX / window.innerWidth) * 85;
    };

    window.addEventListener(
        "pointermove",
        (e) => {
            clientX = e.clientX;
            clientY = e.clientY;
            target.a = 1;
            if (!seen) {
                seen = true;
                retarget();
                Object.assign(current, target, { a: 0 });
            }
            retarget();
        },
        { passive: true },
    );
    window.addEventListener("scroll", retarget, { passive: true });
    document.documentElement.addEventListener("pointerleave", () => (target.a = 0));

    gsap.ticker.add(() => {
        if (!seen) return;

        const dx = target.x - current.x;
        const dy = target.y - current.y;
        const dh = target.h - current.h;
        const da = target.a - current.a;
        if (Math.abs(dx) + Math.abs(dy) + Math.abs(dh) + Math.abs(da) < 0.05) return;

        current.x += dx * 0.14;
        current.y += dy * 0.14;
        current.h += dh * 0.08;
        current.a += da * 0.08;

        body.style.setProperty("--cx", `${current.x.toFixed(1)}px`);
        body.style.setProperty("--cy", `${current.y.toFixed(1)}px`);
        body.style.setProperty("--light-h", current.h.toFixed(1));
        body.style.setProperty("--light-a", current.a.toFixed(3));
    });
}
