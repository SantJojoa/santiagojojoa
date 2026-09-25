import { ScrollTrigger } from "gsap/ScrollTrigger";
import { initBackground } from "./background";
import { initHero } from "./hero";
import { initReveal } from "./reveal";
import { initTitles } from "./titles";
import { initAbout } from "./about";
import { initProjects } from "./projects";
import { initContact } from "./contact";
import { initProgress } from "./progress";
import { initTilt } from "./tilt";
import { initMagnetic } from "./magnetic";
import { initCursorLight } from "./cursor-light";

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (!reduceMotion) {
    // projects primero: cambia la altura de la página y el resto se mide después.
    initProjects();
    initBackground();
    initProgress();
    initHero();
    initReveal();
    initTitles();
    initAbout();
    initContact();
    initTilt();
    initMagnetic();
    initCursorLight();

    ScrollTrigger.refresh();
    document.fonts.ready.then(() => ScrollTrigger.refresh());
}
