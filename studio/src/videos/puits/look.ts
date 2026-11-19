// « Le Puits » : trois lumières, couleurs saturées (demande utilisateur : rendu premium, assez saturé).
// 0 = matin du désert (soleil doré bas, ciel cobalt, ombres bleu-violet) ; 1 = crépuscule rouge-orangé (tirage, descente) ;
// 2 = intérieur du puits (vert-bleu froid, presque noir). Zones sombres désaturées + accents saturés, jamais gris terne.
import type { GradeParams } from "../bridge/grade";
type C3 = [number, number, number];
export type Light = { lit: C3; shade: C3; lift: C3; sat: number; charTint: C3; sunCol: string; sunI: number; hemiSky: string; hemiI: number;
  sunDir: C3; fogCol: string; fogNear: number; fogFar: number; skyTop: string; skyMid: string; skyLow: string; bg: string };
export const LIGHTS: Light[] = [
  { lit: [1.45, 1.2, 0.92], shade: [0.34, 0.36, 0.66], lift: [0.02, 0.02, 0.04], sat: 1.28, charTint: [1.0, 0.95, 0.86], sunCol: "#ffc27a", sunI: 1.9,
    hemiSky: "#9cc4ff", hemiI: 0.32, sunDir: [-0.55, 0.42, 0.72], fogCol: "#e8a36a", fogNear: 260, fogFar: 3400, skyTop: "#1f4fa8", skyMid: "#4f8fd8", skyLow: "#ffc88a", bg: "#d9955f" },
  { lit: [1.55, 0.7, 0.42], shade: [0.3, 0.16, 0.34], lift: [0.02, 0.008, 0.02], sat: 1.3, charTint: [1.0, 0.76, 0.66], sunCol: "#ff7a3a", sunI: 1.6,
    hemiSky: "#ff8a6a", hemiI: 0.26, sunDir: [-0.8, 0.2, 0.55], fogCol: "#8a3a3a", fogNear: 120, fogFar: 2200, skyTop: "#2a0f3a", skyMid: "#b8323a", skyLow: "#ff9a3a", bg: "#5a2028" },
  { lit: [0.55, 0.85, 0.9], shade: [0.08, 0.14, 0.16], lift: [0.004, 0.012, 0.014], sat: 1.15, charTint: [0.8, 0.95, 0.95], sunCol: "#a8e0d8", sunI: 0.9,
    hemiSky: "#4a8a88", hemiI: 0.15, sunDir: [0.1, 1, 0.1], fogCol: "#02080a", fogNear: 2, fogFar: 26, skyTop: "#02060a", skyMid: "#04121a", skyLow: "#0a2a30", bg: "#010406" },
];
export const GRADES: GradeParams[] = [
  { ky: [0.015, 0.07, 0.22, 0.5, 0.8, 0.95, 1], sat: [1.04, 1.22, 1.16], tintS: [0.03, -0.012], tintM: [0.006, -0.008], tintH: [0.012, -0.014], vig: [0.32, 0.44] },
  { ky: [0.01, 0.05, 0.18, 0.45, 0.77, 0.94, 1], sat: [1.02, 1.26, 1.2], tintS: [0.024, 0.0], tintM: [0.014, -0.01], tintH: [0.012, -0.016], vig: [0.4, 0.54] },
  { ky: [0.008, 0.05, 0.18, 0.46, 0.78, 0.94, 1], sat: [0.98, 1.16, 1.18], tintS: [-0.01, -0.014], tintM: [-0.006, -0.004], tintH: [-0.01, 0.0], vig: [0.46, 0.6] },
];
