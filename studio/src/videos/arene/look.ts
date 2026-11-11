// Aube froide de l'Arène (direction Apokalyps : sombre, intrigant) + accents saturés (rouge de la tour, cyan des écrans).
import type { GradeParams } from "../bridge/grade";
type C3 = [number, number, number];
export const DAWN = {
  az: 0.55, el: 0.16,                        // radians : soleil bas, devant-gauche de la caméra héros (contre-jour partiel)
  lit: [1.45, 1.18, 0.92] as C3, shade: [0.3, 0.31, 0.44] as C3, lift: [0.025, 0.03, 0.06] as C3, sat: 1.2,
  charTint: [0.9, 0.9, 1.0] as C3,
  sunCol: "#ffc08a", sunI: 2.6, hemiI: 0.4,
  top: "#1b2a4d", mid: "#3c5576", hor: "#8aa0b6", warm: "#e39a6c",
  fog: "#6d7b8f", fogNear: 45, fogFar: 260,
};
export const GRADE_DAWN: GradeParams = {
  ky: [0.015, 0.08, 0.235, 0.54, 0.82, 0.95, 1],
  sat: [0.92, 1.08, 1.12],
  tintS: [0.02, -0.002], tintM: [0, 0.004], tintH: [-0.012, 0.012],
  vig: [0.32, 0.38],
};
