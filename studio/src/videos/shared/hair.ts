// Coupes de cheveux simples dessinées sur la tête (créées pour la série, pas de coupe « au bol ») : coupe d'homme courte
// avec raie sur le côté et tempes dégagées. À dessiner APRÈS bodyFront (avec hat: null).
import { Pen, INK } from "../bridge/toon";
import { headC } from "./head";

export const fatherHair = (p: Pen, mode: string, seed: number, col = "#8b8b96", dark = "#62626e") => {
  const { hc, u } = headC(mode, seed), g = p.g, X = (x: number) => 300 + x * u, Y = (y: number) => hc + y * u;
  g.save(); g.lineJoin = "round"; g.lineCap = "round";
  g.beginPath();
  g.moveTo(X(-48), Y(-4));
  g.bezierCurveTo(X(-53), Y(-22), X(-48), Y(-42), X(-30), Y(-50));          // tempe gauche -> haut du crâne (pas de volume en plus : coupe courte)
  g.bezierCurveTo(X(-12), Y(-57), X(16), Y(-58), X(33), Y(-51));
  g.bezierCurveTo(X(48), Y(-44), X(53), Y(-22), X(48), Y(-4));              // tempe droite
  g.lineTo(X(43), Y(-18));
  g.bezierCurveTo(X(38), Y(-30), X(28), Y(-38), X(14), Y(-41));             // lisière haute, mèche balayée vers la droite
  g.bezierCurveTo(X(6), Y(-47), X(-4), Y(-46), X(-10), Y(-41));             // raie
  g.bezierCurveTo(X(-20), Y(-38), X(-30), Y(-33), X(-40), Y(-24));
  g.lineTo(X(-44), Y(-14));
  g.closePath();
  g.fillStyle = col; g.fill(); g.strokeStyle = INK; g.lineWidth = 3.2 * u; g.stroke();
  g.strokeStyle = dark; g.lineWidth = 2 * u;
  for (const [a, b, c, d, e, f] of [[-10, -41, -6, -50, 4, -55], [-28, -46, -16, -52, -4, -55], [12, -42, 26, -50, 38, -46], [-46, -34, -48, -24, -46, -12], [46, -34, 49, -24, 47, -10]])
    { g.beginPath(); g.moveTo(X(a), Y(b)); g.quadraticCurveTo(X(c), Y(d), X(e), Y(f)); g.stroke(); }
  g.restore();
};
