// « Ne le regarde pas » : salon de nuit. Éclairage à deux tons (voir bridge/shade.ts) : clair = lune froide par la fenêtre,
// ombre = brun chaud très sombre (le lampadaire ambre est simulé par des halos additifs, pas par une vraie lumière).
import type { GradeParams } from "../bridge/grade";
type C3 = [number, number, number];
export const NIGHT = {
  lit: [0.74, 0.8, 1.6] as C3, shade: [0.3, 0.24, 0.34] as C3, lift: [0.012, 0.012, 0.03] as C3, sat: 1.15,
  charTint: [0.82, 0.82, 1.0] as C3,
  sunCol: "#7da0ff", sunI: 1.6, hemiI: 0.2,
  fog: "#0a0d16", fogNear: 5, fogFar: 20,
};
export const GRADE_NIGHT: GradeParams = {
  ky: [0.012, 0.06, 0.19, 0.47, 0.78, 0.94, 1],
  sat: [0.95, 1.12, 1.15],
  tintS: [0.014, 0.024], tintM: [0, 0.004], tintH: [-0.01, 0.012],
  vig: [0.42, 0.45],
};
