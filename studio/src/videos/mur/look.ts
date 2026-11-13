// « Le Mur » : trois lumières. Jour = soleil orange bas, ombres violettes ; crépuscule = rouge sang (la sirène) ; nuit = bleu froid, lune.
// Zones sombres désaturées + accents saturés (orange, rouge, blanc des Longs), jamais gris terne.
import type { GradeParams } from "../bridge/grade";
type C3 = [number, number, number];
export type Light = { lit: C3; shade: C3; lift: C3; sat: number; charTint: C3; sunCol: string; sunI: number; hemiSky: string; hemiI: number;
  sunDir: C3; fogCol: string; fogNear: number; fogFar: number; skyTop: string; skyMid: string; skyLow: string; bg: string };
export const LIGHTS: Light[] = [
  { lit: [1.42, 1.0, 0.66], shade: [0.42, 0.3, 0.38], lift: [0.03, 0.02, 0.03], sat: 1.1, charTint: [1.0, 0.92, 0.84], sunCol: "#ffb36b", sunI: 1.8,
    hemiSky: "#ffcf9a", hemiI: 0.35, sunDir: [-0.6, 0.38, 0.7], fogCol: "#d88a5a", fogNear: 120, fogFar: 2600, skyTop: "#3d2a4a", skyMid: "#e0844c", skyLow: "#ffc183", bg: "#c27a52" },
  { lit: [1.45, 0.55, 0.42], shade: [0.26, 0.12, 0.18], lift: [0.02, 0.008, 0.012], sat: 1.15, charTint: [1.0, 0.7, 0.66], sunCol: "#ff5a3a", sunI: 1.5,
    hemiSky: "#ff7a5a", hemiI: 0.25, sunDir: [-0.75, 0.22, 0.6], fogCol: "#5a2028", fogNear: 60, fogFar: 1400, skyTop: "#14080e", skyMid: "#6a1a20", skyLow: "#d0452e", bg: "#3a1418" },
  { lit: [0.58, 0.76, 1.3], shade: [0.13, 0.15, 0.25], lift: [0.008, 0.012, 0.024], sat: 1.12, charTint: [0.82, 0.9, 1.05], sunCol: "#9cc0ea", sunI: 0.95,
    hemiSky: "#6f8ec0", hemiI: 0.2, sunDir: [0.4, 0.7, -0.6], fogCol: "#0b1324", fogNear: 40, fogFar: 1600, skyTop: "#03050b", skyMid: "#0c1630", skyLow: "#1d2d4a", bg: "#070b16" },
];
export const GRADES: GradeParams[] = [
  { ky: [0.02, 0.08, 0.22, 0.5, 0.8, 0.95, 1], sat: [1.02, 1.12, 1.1], tintS: [0.02, 0.0], tintM: [0.008, -0.004], tintH: [0.012, -0.01], vig: [0.34, 0.45] },
  { ky: [0.01, 0.05, 0.17, 0.44, 0.76, 0.93, 1], sat: [1.0, 1.2, 1.18], tintS: [0.016, -0.006], tintM: [0.012, -0.008], tintH: [0.01, -0.012], vig: [0.42, 0.55] },
  { ky: [0.012, 0.06, 0.19, 0.47, 0.78, 0.94, 1], sat: [0.98, 1.16, 1.18], tintS: [0.008, 0.026], tintM: [0, 0.006], tintH: [-0.012, 0.016], vig: [0.4, 0.52] },
];
