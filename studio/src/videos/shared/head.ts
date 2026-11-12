// Repères de la tête dans l'espace de dessin 600 x 1000 (mêmes formules que bodyFront, constitution « adult »).
import { headBlob } from "../bridge/toon";
export const headC = (mode: string, seed: number) => {
  const H = headBlob(seed, 118, 0), HH = 2 * H.b, sole = 975;
  const torsoBot = mode === "sit" ? sole - 0.2 * HH : sole - 1.4 * HH, chin = torsoBot - 1.1 * HH;
  return { hc: chin - H.b, chin, HH, u: (2 * H.a) / 100 };
};
