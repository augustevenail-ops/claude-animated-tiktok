// Personnage principal de la série (« tu »), d'après l'avatar de l'utilisateur (assets/personnage_principal/ref_avatar.png) :
// cheveux châtains en mèches avec une mèche entre les yeux, regard mi-clos (expression « neutral » du style bridge),
// sweat à capuche bleu nuit, peau claire. Le corps est dessiné par bodyFront ; ce module ajoute la capuche (derrière),
// les cheveux et les cordons (devant). Utilisation : pen => { heroBehind(pen, mode, seed); bodyFront(pen, HERO_OUTFIT, fo); heroFront(pen, mode, seed); }
import { Pen, Outfit, INK } from "../bridge/toon";
import { headC } from "./head";

export const HERO_OUTFIT: Outfit = { jacket: "#1b2142", pants: "#1b1e2e", boots: "#15141a", hat: null, skin: "#f7c9a2", build: "adult", buttons: "#1b2142" };
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
  g.moveTo(X(-52), Y(12));
  g.lineTo(X(-60), Y(-2));                                           // pointe de mèche à gauche
  g.bezierCurveTo(X(-62), Y(-18), X(-55), Y(-38), X(-34), Y(-51));
  g.bezierCurveTo(X(-20), Y(-64), X(-2), Y(-61), X(8), Y(-57));
  g.bezierCurveTo(X(24), Y(-64), X(46), Y(-58), X(53), Y(-40));
  g.bezierCurveTo(X(62), Y(-26), X(65), Y(-14), X(64), Y(-3));       // pointe de mèche à droite (courte)
  g.lineTo(X(57), Y(-4));
  g.lineTo(X(55), Y(6));
  g.lineTo(X(49), Y(-10));
  g.bezierCurveTo(X(42), Y(-22), X(35), Y(-27), X(26), Y(-26));
  g.bezierCurveTo(X(21), Y(-21), X(17), Y(-10), X(11), Y(-1));       // mèche qui tombe entre les yeux
  g.bezierCurveTo(X(8), Y(-15), X(4), Y(-24), X(-4), Y(-28));
  g.bezierCurveTo(X(-14), Y(-31), X(-31), Y(-26), X(-41), Y(-13));
  g.lineTo(X(-46), Y(14));
  g.closePath();
  g.fillStyle = HAIR; g.fill(); g.strokeStyle = INK; g.lineWidth = 3.4 * u; g.stroke();
  g.strokeStyle = HAIR_D; g.lineWidth = 2.2 * u;
  for (const [a, b, c, d, e, f] of [[-36, -44, -22, -52, -8, -46], [-4, -50, 14, -56, 30, -48], [30, -48, 42, -44, 49, -32], [-44, -26, -40, -18, -36, -6], [18, -36, 22, -26, 24, -16]])
    { g.beginPath(); g.moveTo(X(a), Y(b)); g.quadraticCurveTo(X(c), Y(d), X(e), Y(f)); g.stroke(); }
  g.strokeStyle = "#8f98b8"; g.lineWidth = 2.2 * u;
  for (const s of [-1, 1]) { g.beginPath(); g.moveTo(X(s * 9), chin + 6 * u); g.lineTo(X(s * 9), chin + 38 * u); g.stroke(); g.fillStyle = "#c9d0e6"; g.beginPath(); g.arc(X(s * 9), chin + 40 * u, 2.3 * u, 0, 7); g.fill(); }
  g.restore();
};
