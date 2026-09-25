import { es } from "./es";
import { en } from "./en";

export const languages = { es, en } as const;
export type Lang = keyof typeof languages;

export const defaultLang: Lang = "es";

export function useTranslations(lang: Lang) {
    return languages[lang];
}

/** Misma ruta, otro idioma: /es/proyectos -> /en/proyectos */
export function switchLangPath(pathname: string, target: Lang): string {
    const [, first, ...rest] = pathname.split("/");
    const tail = first in languages ? rest.join("/") : [first, ...rest].join("/");
    return `/${target}/${tail}`.replace(/\/+$/, "") || `/${target}`;
}
