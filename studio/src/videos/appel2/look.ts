// « L'appel » : nuit froide, ville morte. Clair = lune bleu-vert ; ombre = gris-violet très sombre ; accents saturés :
// vert de l'appel, rouge des refus, néons froids, ambre rare. Même étalonnage que « Ne le regarde pas » (validé), légèrement plus vert.
import type { GradeParams } from "../bridge/grade";
type C3 = [number, number, number];
export const NIGHT = {
  lit: [0.66, 0.82, 1.35] as C3, shade: [0.24, 0.24, 0.32] as C3, lift: [0.012, 0.016, 0.026] as C3, sat: 1.12,
  charTint: [0.84, 0.9, 1.0] as C3,
  sunCol: "#8fb4d8", sunI: 1.5, hemiI: 0.22,
};
export const FOG_IN = { col: "#0a0d12", near: 6, far: 40 };
export const FOG_OUT = { col: "#1c262c", near: 40, far: 1500 };
export const GRADE_NIGHT: GradeParams = {
  ky: [0.012, 0.06, 0.19, 0.47, 0.78, 0.94, 1],
  sat: [0.98, 1.16, 1.18],
  tintS: [0.008, 0.026], tintM: [0, 0.006], tintH: [-0.012, 0.016],
  vig: [0.38, 0.5],
};
