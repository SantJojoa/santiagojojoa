import {
    siAstro,
    siBurpsuite,
    siDocker,
    siGit,
    siGithubactions,
    siKalilinux,
    siLinux,
    siNestjs,
    siNodedotjs,
    siOwasp,
    siPostgresql,
    siPython,
    siReact,
    siTailwindcss,
    siTypescript,
    siVercel,
    siWireshark,
} from "simple-icons";

export interface TechIcon {
    /** Path SVG (viewBox 0 0 24 24). */
    path: string;
    /** Color de marca, sin #. */
    hex: string;
}

/** Terminal genérica para herramientas sin logo en simple-icons (Nmap). */
const terminal: TechIcon = {
    path: "M3 4h18a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Zm2.7 4.3 3.4 3.4-3.4 3.4 1.1 1.1 4.5-4.5-4.5-4.5-1.1 1.1ZM12 15.5v1.5h6v-1.5h-6Z",
    hex: "FFFFFF",
};

/** Base de datos genérica para "SQL" (no es una marca concreta). */
const database: TechIcon = {
    path: "M12 2C7.03 2 3 3.79 3 6v12c0 2.21 4.03 4 9 4s9-1.79 9-4V6c0-2.21-4.03-4-9-4Zm0 2c3.87 0 7 1.12 7 2s-3.13 2-7 2-7-1.12-7-2 3.13-2 7-2ZM5 9.2C6.7 10.3 9.16 11 12 11s5.3-.7 7-1.8V12c0 .88-3.13 2-7 2s-7-1.12-7-2V9.2Zm0 6C6.7 16.3 9.16 17 12 17s5.3-.7 7-1.8V18c0 .88-3.13 2-7 2s-7-1.12-7-2v-2.8Z",
    hex: "FFFFFF",
};

export const techIcons: Record<string, TechIcon> = {
    TypeScript: siTypescript,
    React: siReact,
    Astro: siAstro,
    NestJS: siNestjs,
    "Tailwind CSS": siTailwindcss,
    "Node.js": siNodedotjs,
    Python: siPython,
    SQL: database,
    "Burp Suite": siBurpsuite,
    Nmap: terminal,
    Wireshark: siWireshark,
    OWASP: siOwasp,
    "Kali Linux": siKalilinux,
    Linux: siLinux,
    Docker: siDocker,
    Git: siGit,
    "GitHub Actions": siGithubactions,
    Vercel: siVercel,
};

/** Las marcas muy oscuras (Vercel, Astro…) no se ven sobre fondo negro: se usa blanco. */
export function visibleColor(hex: string): string {
    const n = parseInt(hex, 16);
    const luminance = (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
    return `#${luminance < 0.25 ? "FFFFFF" : hex}`;
}
