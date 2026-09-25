import type { Finding, Grade } from "./types.ts";

const GRADES: Array<[number, Grade]> = [
    [95, "A+"],
    [85, "A"],
    [70, "B"],
    [55, "C"],
    [40, "D"],
    [0, "F"],
];

const ORDER: Grade[] = ["A+", "A", "B", "C", "D", "F"];

/** Devuelve la peor de las dos notas. */
function cap(grade: Grade, ceiling: Grade): Grade {
    return ORDER.indexOf(grade) < ORDER.indexOf(ceiling) ? ceiling : grade;
}

/**
 * Nota sobre los controles aplicables (max > 0), normalizada a 100.
 * Reglas duras: sin HTTPS nunca pasa de F; con certificado inválido, de C.
 */
export function computeScore(findings: Finding[]): { score: number; grade: Grade } {
    const applicable = findings.filter((f) => f.max > 0);
    const possible = applicable.reduce((sum, f) => sum + f.max, 0);
    const earned = applicable.reduce((sum, f) => sum + f.points, 0);
    const score = possible === 0 ? 0 : Math.round((earned / possible) * 100);

    let grade = GRADES.find(([min]) => score >= min)![1];

    const failed = (id: string) => findings.find((f) => f.id === id)?.status === "fail";
    if (failed("https")) grade = cap(grade, "F");
    else if (findings.find((f) => f.id === "certificate")?.codes?.includes("invalid-cert")) grade = cap(grade, "C");

    return { score, grade };
}
