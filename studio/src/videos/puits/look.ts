// « Le Puits » — style VIDEO_01 (docs/STYLE_VIDEO01.md, décision utilisateur du 2026-11-19) : palette basse sépia, désaturée,
// fonds brun très sombre, lumière motivée par de petites lampes ambre, accents rouille / bleu-vert / rouge, vignettage fort.
// 0 = aube poussiéreuse (ciel brun-ocre voilé, soleil bas et pâle) ; 1 = nuit aux lanternes ; 2 = intérieur du puits.
import type { GradeParams } from "../bridge/grade";
type C3 = [number, number, number];
export type Light = { lit: C3; shade: C3; lift: C3; sat: number; charTint: C3; sunCol: string; sunI: number; hemiSky: string; hemiI: number;
  sunDir: C3; fogCol: string; fogNear: number; fogFar: number; skyTop: string; skyMid: string; skyLow: string; bg: string };
export const LIGHTS: Light[] = [
  { lit: [1.08, 0.92, 0.74], shade: [0.24, 0.26, 0.34], lift: [0.03, 0.025, 0.02], sat: 0.86, charTint: [1.04, 0.95, 0.84], sunCol: "#d8b48a", sunI: 1.25,
    hemiSky: "#8a7a68", hemiI: 0.32, sunDir: [-0.6, 0.22, 0.75], fogCol: "#4a3e32", fogNear: 25, fogFar: 520, skyTop: "#1e1a16", skyMid: "#5a4a3a", skyLow: "#a88866", bg: "#2e271f" },
  { lit: [0.74, 0.56, 0.4], shade: [0.09, 0.1, 0.14], lift: [0.02, 0.016, 0.012], sat: 0.86, charTint: [1.06, 0.92, 0.78], sunCol: "#8090a8", sunI: 0.6,
    hemiSky: "#4a3c30", hemiI: 0.26, sunDir: [0.35, 0.8, 0.45], fogCol: "#16120e", fogNear: 14, fogFar: 230, skyTop: "#0a0907", skyMid: "#18140f", skyLow: "#2e241b", bg: "#12100c" },
  { lit: [0.5, 0.6, 0.58], shade: [0.07, 0.08, 0.08], lift: [0.006, 0.008, 0.008], sat: 0.86, charTint: [0.95, 0.9, 0.82], sunCol: "#a8b0a0", sunI: 0.8,
    hemiSky: "#3a3a32", hemiI: 0.15, sunDir: [0.1, 1, 0.1], fogCol: "#030303", fogNear: 2, fogFar: 26, skyTop: "#030303", skyMid: "#080706", skyLow: "#141210", bg: "#030303" },
];
// étalonnage « premium » (retour utilisateur du 2026-11-19) : noirs plus profonds, courbe plus contrastée,
// ombres légèrement bleu-vert, hautes lumières ambrées (séparation chaud / froid), saturation un peu plus riche.
export const GRADES: GradeParams[] = [
  { ky: [0.01, 0.048, 0.16, 0.42, 0.75, 0.93, 0.99], sat: [0.96, 1.08, 1.04], tintS: [0.036, -0.026], tintM: [-0.004, 0.006], tintH: [-0.016, 0.018], vig: [0.55, 0.6] },
  { ky: [0.006, 0.038, 0.14, 0.4, 0.75, 0.93, 0.99], sat: [0.98, 1.1, 1.06], tintS: [0.044, -0.03], tintM: [0.002, 0.004], tintH: [-0.02, 0.024], vig: [0.58, 0.62] },
  { ky: [0.006, 0.04, 0.14, 0.4, 0.74, 0.92, 0.99], sat: [0.9, 1.02, 1.04], tintS: [0.03, -0.016], tintM: [0.004, 0.002], tintH: [-0.012, 0.014], vig: [0.6, 0.64] },
];
