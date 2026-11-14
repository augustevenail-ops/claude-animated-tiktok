// « L'hôpital » : cinq lumières (même modèle que mur/look.ts). 0 intérieur néon (blanc froid, accents chauds), 1 nuit dehors (bleu + gyrophares),
// 2 escalier béton + néons de secours (blanc bleuté puissant), 3 couloir noir (bleu nuit lisible + vert sortie), 4 couloir blanc aveuglant.
import type { GradeParams } from "../bridge/grade";
import type { Light } from "../mur/look";
export const LIGHTS: Light[] = [
  { lit: [1.25, 1.22, 1.12], shade: [0.34, 0.38, 0.44], lift: [0.02, 0.025, 0.03], sat: 1.08, charTint: [1.0, 0.98, 0.95], sunCol: "#f2f4ff", sunI: 1.4,
    hemiSky: "#dfe8f0", hemiI: 0.4, sunDir: [0.3, 0.85, 0.4], fogCol: "#6a7a84", fogNear: 25, fogFar: 140, skyTop: "#03050b", skyMid: "#0c1630", skyLow: "#1d2d4a", bg: "#0a0f18" },
  { lit: [0.78, 0.95, 1.5], shade: [0.2, 0.23, 0.38], lift: [0.018, 0.022, 0.04], sat: 1.14, charTint: [0.9, 0.95, 1.08], sunCol: "#9cc0ea", sunI: 1.25,
    hemiSky: "#6f8ec0", hemiI: 0.32, sunDir: [0.4, 0.7, -0.6], fogCol: "#141c34", fogNear: 70, fogFar: 1500, skyTop: "#03050b", skyMid: "#0c1630", skyLow: "#22304e", bg: "#070b16" },
  { lit: [1.1, 1.18, 1.32], shade: [0.22, 0.25, 0.32], lift: [0.015, 0.02, 0.03], sat: 1.06, charTint: [0.94, 0.98, 1.06], sunCol: "#e6f0ff", sunI: 1.3,
    hemiSky: "#b8c8e0", hemiI: 0.35, sunDir: [0.2, 0.9, 0.3], fogCol: "#3a4250", fogNear: 20, fogFar: 90, skyTop: "#03050b", skyMid: "#0c1630", skyLow: "#1d2d4a", bg: "#0b0e14" },
  { lit: [0.68, 0.86, 1.25], shade: [0.16, 0.19, 0.3], lift: [0.018, 0.024, 0.04], sat: 1.1, charTint: [0.82, 0.92, 1.02], sunCol: "#8fb0e0", sunI: 1.0,
    hemiSky: "#4a6a9a", hemiI: 0.32, sunDir: [0.2, 0.9, 0.3], fogCol: "#0a1220", fogNear: 10, fogFar: 70, skyTop: "#03050b", skyMid: "#0c1630", skyLow: "#1d2d4a", bg: "#04060c" },
  { lit: [1.55, 1.58, 1.65], shade: [0.62, 0.66, 0.74], lift: [0.06, 0.065, 0.08], sat: 0.98, charTint: [1.04, 1.04, 1.08], sunCol: "#ffffff", sunI: 1.8,
    hemiSky: "#ffffff", hemiI: 0.7, sunDir: [0.1, 0.95, 0.2], fogCol: "#e8eef8", fogNear: 8, fogFar: 60, skyTop: "#ffffff", skyMid: "#ffffff", skyLow: "#ffffff", bg: "#dfe6f0" },
];
export const GRADES: GradeParams[] = [
  { ky: [0.015, 0.07, 0.21, 0.5, 0.8, 0.95, 1], sat: [1.0, 1.1, 1.08], tintS: [-0.004, 0.016], tintM: [0.0, 0.0], tintH: [0.008, -0.004], vig: [0.36, 0.48] },
  { ky: [0.012, 0.06, 0.19, 0.47, 0.78, 0.94, 1], sat: [0.98, 1.16, 1.18], tintS: [0.008, 0.026], tintM: [0, 0.006], tintH: [-0.012, 0.016], vig: [0.4, 0.52] },
  { ky: [0.012, 0.065, 0.2, 0.48, 0.79, 0.95, 1], sat: [0.98, 1.08, 1.06], tintS: [0.0, 0.02], tintM: [-0.004, 0.008], tintH: [-0.006, 0.01], vig: [0.38, 0.5] },
  { ky: [0.01, 0.055, 0.18, 0.45, 0.76, 0.93, 1], sat: [0.96, 1.14, 1.16], tintS: [0.006, 0.03], tintM: [0, 0.01], tintH: [-0.01, 0.016], vig: [0.46, 0.58] },
  { ky: [0.04, 0.14, 0.32, 0.6, 0.86, 0.97, 1], sat: [1.0, 1.0, 0.95], tintS: [0.0, 0.012], tintM: [0, 0.004], tintH: [-0.004, 0.006], vig: [0.2, 0.3] },
];
