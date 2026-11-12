// Personnage principal de la série (« tu »), d'après l'avatar de l'utilisateur (assets/personnage_principal/ref_avatar.png) :
// cheveux châtains en mèches avec une mèche entre les yeux, regard mi-clos (expression « neutral » du style bridge),
// sweat à capuche bleu nuit, peau claire. Le corps est dessiné par bodyFront ; ce module ajoute la capuche (derrière),
// les cheveux et les cordons (devant). Utilisation : pen => { heroBehind(pen, mode, seed); bodyFront(pen, HERO_OUTFIT, fo); heroFront(pen, mode, seed); }
import { Pen, Outfit, INK } from "../bridge/toon";
import { headC } from "./head";

export const HERO_OUTFIT: Outfit = { jacket: "#1b2142", pants: "#1b1e2e", boots: "#15141a", hat: null, skin: "#e6c9a6", build: "adult", buttons: "#1b2142" };
const HAIR = "#4d2c1b", HAIR_D = "#2f190c";

/** capuche posée derrière la tête et sur les épaules (dessinée AVANT bodyFront) */
export const heroBehind = (p: Pen, mode: string, seed: number) => {
  const { chin, HH, u } = headC(mode, seed), g = p.g;
  g.save(); g.fillStyle = "#151a38"; g.strokeStyle = INK; g.lineWidth = 3.5 * u;
  g.beginPath(); g.ellipse(300, chin + 0.1 * HH, 56 * u, 19 * u, 0, 0, Math.PI * 2); g.fill(); g.stroke(); g.restore();
};
/** cheveux en mèches + cordons du sweat (dessinés APRÈS bodyFront) */
export const heroFront = (p: Pen, mode: string, seed: number) => {
  const { hc, chin, u } = headC(mode, seed), g = p.g, X = (x: number) => 300 + x * u, Y = (y: number) => hc + y * u;
  g.save(); g.lineJoin = "round"; g.lineCap = "round";
  g.beginPath();
  g.moveTo(X(-49), Y(-2));
  g.bezierCurveTo(X(-56), Y(-22), X(-52), Y(-44), X(-32), Y(-53));          // coupe courte classique : côtés nets, pas de pointes
  g.bezierCurveTo(X(-14), Y(-61), X(16), Y(-62), X(35), Y(-54));
  g.bezierCurveTo(X(52), Y(-46), X(57), Y(-22), X(50), Y(-2));
  g.lineTo(X(46), Y(-16));
  g.bezierCurveTo(X(40), Y(-28), X(26), Y(-32), X(12), Y(-30));             // frange balayée vers la droite, front dégagé
  g.bezierCurveTo(X(-2), Y(-35), X(-18), Y(-33), X(-30), Y(-28));
  g.bezierCurveTo(X(-40), Y(-24), X(-45), Y(-14), X(-46), Y(-4));
  g.closePath();
  g.fillStyle = HAIR; g.fill(); g.strokeStyle = INK; g.lineWidth = 3.4 * u; g.stroke();
  g.strokeStyle = HAIR_D; g.lineWidth = 2.2 * u;
  for (const [a, b, c, d, e, f] of [[-34, -46, -18, -54, -2, -50], [4, -52, 22, -54, 38, -46], [-6, -33, 6, -42, 20, -44]])
    { g.beginPath(); g.moveTo(X(a), Y(b)); g.quadraticCurveTo(X(c), Y(d), X(e), Y(f)); g.stroke(); }
  g.strokeStyle = "#8f98b8"; g.lineWidth = 2.2 * u;
  for (const s of [-1, 1]) { g.beginPath(); g.moveTo(X(s * 9), chin + 6 * u); g.lineTo(X(s * 9), chin + 38 * u); g.stroke(); g.fillStyle = "#c9d0e6"; g.beginPath(); g.arc(X(s * 9), chin + 40 * u, 2.3 * u, 0, 7); g.fill(); }
  g.restore();
};
