// Style des personnages « références » (analyse des 13 images fournies par l'utilisateur le 2026-11-12) :
//  - contour épais et régulier, presque noir (#17161d), bouts arrondis ; mêmes épaisseurs partout (tête, bras, corps) ;
//  - tête = sphère blanc nacré : dégradé radial, cœur très lumineux, bord gris bleuté, léger halo ; cou blanc minuscule ;
//  - yeux = ovales noirs pleins, assez écartés, parfois un petit reflet ; sourcils fins et courts ; bouche minuscule ;
//    cernes violets en croissants sous les yeux (fatigue / stress) ;
//  - corps simples : torse en capsule, bras et jambes = tubes de largeur constante, mains = ronds blancs sans doigts ;
//  - vêtements en aplats saturés (rouge-orangé, bleu marine, gris-bleu) avec un dégradé doux (clair en haut, plus sombre en bas) ;
//  - cheveux = aplat avec contour, coupe simple. Aucun accessoire repris des références, personnages et coupes créés pour la série.
// Dessin dans l'espace 600 x 1000 (origine du sol à y = 975), compatible Pool/Actor de bridge/cast.ts.
import type { Pen } from "../bridge/toon";

const INK = "#17161d", OL = 7;
const hex = (c: string): [number, number, number] => { const n = parseInt(c.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const rgb = (a: number[]) => `rgb(${a.map((v) => Math.max(0, Math.min(255, Math.round(v)))).join(",")})`;
const shade = (c: string, k: number) => rgb(hex(c).map((v) => v * k));
const mix = (a: string, b: string, t: number) => { const x = hex(a), y = hex(b); return rgb(x.map((v, i) => v + (y[i] - v) * t)); };

export type CharSpec = {
  mode: "stand" | "sit"; expr: "calm" | "worry" | "smile_fixed" | "creepy" | "shadow"; blink?: boolean; look?: number; wave?: number;
  jacket: string; pants: string; shoes: string; skin?: string; hair?: "side" | "short" | "none"; hairColor?: string; hood?: boolean; shadow?: boolean;
};

const tube = (g: CanvasRenderingContext2D, pts: number[][], w: number, fill: string | CanvasGradient) => {
  g.lineCap = "round"; g.lineJoin = "round";
  const path = () => { g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); if (pts.length === 3) g.quadraticCurveTo(pts[1][0], pts[1][1], pts[2][0], pts[2][1]); else for (const q of pts.slice(1)) g.lineTo(q[0], q[1]); };
  path(); g.strokeStyle = INK; g.lineWidth = w + 2 * OL; g.stroke();
  path(); g.strokeStyle = fill; g.lineWidth = w; g.stroke();
};
const ball = (g: CanvasRenderingContext2D, x: number, y: number, r: number, fill: string) => { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fillStyle = fill; g.fill(); g.lineWidth = OL; g.strokeStyle = INK; g.stroke(); };
const vgrad = (g: CanvasRenderingContext2D, y0: number, y1: number, c: string) => { const k = g.createLinearGradient(0, y0, 0, y1); k.addColorStop(0, shade(c, 1.12)); k.addColorStop(1, shade(c, 0.78)); return k; };

/** cheveux : aplat + contour, coordonnées en unités de tête (rayon = 50u) */
const hairShape = (g: CanvasRenderingContext2D, X: (x: number) => number, Y: (y: number) => number, kind: "side" | "short", col: string, u: number) => {
  g.save(); g.lineJoin = "round"; g.beginPath();
  if (kind === "side") {
    g.moveTo(X(-49), Y(-2)); g.bezierCurveTo(X(-56), Y(-22), X(-52), Y(-44), X(-32), Y(-53)); g.bezierCurveTo(X(-14), Y(-61), X(16), Y(-62), X(35), Y(-54));
    g.bezierCurveTo(X(52), Y(-46), X(57), Y(-22), X(50), Y(-2)); g.lineTo(X(46), Y(-16)); g.bezierCurveTo(X(40), Y(-28), X(26), Y(-32), X(12), Y(-30));
    g.bezierCurveTo(X(-2), Y(-35), X(-18), Y(-33), X(-30), Y(-28)); g.bezierCurveTo(X(-40), Y(-24), X(-45), Y(-14), X(-46), Y(-4));
  } else {
    g.moveTo(X(-48), Y(-4)); g.bezierCurveTo(X(-53), Y(-22), X(-48), Y(-42), X(-30), Y(-50)); g.bezierCurveTo(X(-12), Y(-57), X(16), Y(-58), X(33), Y(-51));
    g.bezierCurveTo(X(48), Y(-44), X(53), Y(-22), X(48), Y(-4)); g.lineTo(X(43), Y(-18)); g.bezierCurveTo(X(38), Y(-30), X(28), Y(-38), X(14), Y(-41));
    g.bezierCurveTo(X(6), Y(-47), X(-4), Y(-46), X(-10), Y(-41)); g.bezierCurveTo(X(-20), Y(-38), X(-30), Y(-33), X(-40), Y(-24)); g.lineTo(X(-44), Y(-14));
  }
  g.closePath(); g.fillStyle = col; g.fill(); g.strokeStyle = INK; g.lineWidth = OL; g.stroke();
  g.strokeStyle = shade(col, 0.72); g.lineWidth = 2.2 * u; g.lineCap = "round";
  for (const [a, b, c, d, e, f] of kind === "side" ? [[-34, -46, -18, -54, -2, -50], [4, -52, 22, -54, 38, -46]] : [[-8, -42, -4, -50, 6, -55], [14, -42, 28, -50, 40, -44]])
    { g.beginPath(); g.moveTo(X(a), Y(b)); g.quadraticCurveTo(X(c), Y(d), X(e), Y(f)); g.stroke(); }
  g.restore();
};

/** grand sourire : croissant sombre à dents blanches pointues (creepy) ou croissant blanc à fentes noires (shadow) */
const grin = (g: CanvasRenderingContext2D, mx: number, my: number, u: number, white: boolean) => {
  const w = 24 * u, y0 = my - 7 * u, cu = my + 4 * u, cl = my + 17 * u;
  const up = (t: number) => (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * cu + t * t * y0, lo = (t: number) => (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * cl + t * t * y0;
  g.save(); g.lineJoin = "round"; g.beginPath(); g.moveTo(mx - w, y0); g.quadraticCurveTo(mx, cu, mx + w, y0); g.quadraticCurveTo(mx, cl, mx - w, y0); g.closePath();
  if (white) {
    g.shadowColor = "rgba(255,255,255,0.9)"; g.shadowBlur = 7 * u; g.fillStyle = "#ffffff"; g.fill(); g.shadowBlur = 0; g.strokeStyle = "#ffffff"; g.lineWidth = 2 * u; g.stroke();
    g.strokeStyle = INK; g.lineWidth = 1.4 * u; for (let i = -9; i <= 9; i++) { const t = (i + 9.5) / 19, x = mx - w + 2 * w * t; g.beginPath(); g.moveTo(x, up(t) + 1.2 * u); g.lineTo(x, lo(t) - 1.2 * u); g.stroke(); }
  } else {
    g.fillStyle = "#12060b"; g.fill(); g.strokeStyle = INK; g.lineWidth = 3.4 * u; g.stroke();
    g.fillStyle = "#ffffff"; for (let i = -8; i <= 8; i++) { const t = (i + 8.5) / 17, x = mx - w + 2 * w * t, yy = up(t), h = 4.6 * u * Math.pow(Math.sin(Math.PI * t), 0.6);
      g.beginPath(); g.moveTo(x - 1.6 * u, yy - 0.2 * u); g.lineTo(x + 1.6 * u, yy - 0.2 * u); g.lineTo(x, yy + h); g.closePath(); g.fill(); }
  }
  g.restore();
};

export const drawChar = (p: Pen, s: CharSpec) => {
  const g = p.g, cx = 300, sit = s.mode === "sit", R = 95, u = R / 50;
  const hip = sit ? 929 : 675, torsoTop = hip - 240, hy = torsoTop - 12 - R, jacket = s.shadow ? "#10101a" : s.jacket, pants = s.shadow ? "#0c0c14" : s.pants;
  g.save(); g.lineCap = "round"; g.lineJoin = "round";
  // jambes
  if (!sit) for (const sx of [-1, 1]) { tube(g, [[cx + sx * 30, hip - 10], [cx + sx * 34, 950]], 54, vgrad(g, hip, 950, pants)); g.beginPath(); g.ellipse(cx + sx * 36, 962, 40, 17, 0, 0, 7); g.fillStyle = s.shadow ? "#0a0a10" : s.shoes; g.fill(); g.lineWidth = OL; g.strokeStyle = INK; g.stroke(); }
  else for (const sx of [-1, 1]) tube(g, [[cx + sx * 34, hip - 6], [cx + sx * 42, 1000]], 56, vgrad(g, hip, 1000, pants));
  // capuche (derrière la tête) puis torse
  if (s.hood) { g.beginPath(); g.ellipse(cx, torsoTop - 4, 70, 26, 0, 0, 7); g.fillStyle = shade(jacket, 0.82); g.fill(); g.lineWidth = OL; g.strokeStyle = INK; g.stroke(); }
  const tw = 150, rr = 52; g.beginPath(); g.moveTo(cx - tw / 2, torsoTop + rr); g.quadraticCurveTo(cx - tw / 2, torsoTop, cx - tw / 2 + rr, torsoTop); g.lineTo(cx + tw / 2 - rr, torsoTop);
  g.quadraticCurveTo(cx + tw / 2, torsoTop, cx + tw / 2, torsoTop + rr); g.lineTo(cx + tw / 2, hip); g.lineTo(cx - tw / 2, hip); g.closePath();
  g.fillStyle = vgrad(g, torsoTop, hip, jacket); g.fill(); g.lineWidth = OL; g.strokeStyle = INK; g.stroke();
  if (!s.shadow) { g.fillStyle = "rgba(255,255,255,0.07)"; g.fillRect(cx - tw / 2 + 12, torsoTop + 20, 20, hip - torsoTop - 40); }
  if (s.hood && !s.shadow) { g.strokeStyle = "#aab2d0"; g.lineWidth = 3.4; g.lineCap = "round"; for (const sx of [-1, 1]) { g.beginPath(); g.moveTo(cx + sx * 12, torsoTop + 6); g.lineTo(cx + sx * 12, torsoTop + 66); g.stroke(); g.fillStyle = "#dfe4f4"; g.beginPath(); g.arc(cx + sx * 12, torsoTop + 70, 4.2, 0, 7); g.fill(); }
    g.strokeStyle = shade(jacket, 0.6); g.lineWidth = 3.2; g.beginPath(); g.moveTo(cx - 44, hip - 70); g.quadraticCurveTo(cx, hip - 52, cx + 44, hip - 70); g.stroke(); }
  // bras (tubes) + mains (ronds blancs)
  const hand = s.shadow ? "#0a0a10" : "#f4f4f7", wave = s.wave ?? 0;
  for (const sx of [-1, 1]) {
    const sh = [cx + sx * 80, torsoTop + 30];
    const raised = sx === 1 && wave > 0.4, end = raised ? [cx + 128, hy + 40] : sit ? [cx + sx * 74, hip - 8] : [cx + sx * 100, hip - 24], mid = raised ? [cx + 136, torsoTop + 90] : [cx + sx * 100, (sh[1] + end[1]) / 2];
    tube(g, [sh, mid, end], 46, vgrad(g, sh[1], end[1], jacket)); ball(g, end[0], end[1] + (raised ? -8 : 6), 27, hand);
  }
  // cou + tête (sphère nacrée)
  g.beginPath(); g.rect(cx - 16, torsoTop - 20, 32, 30); g.fillStyle = s.shadow ? "#0a0a10" : "#e9eaee"; g.fill(); g.lineWidth = OL; g.strokeStyle = INK; g.stroke();
  const skin = s.skin ?? "#bfc4d2";
  if (s.shadow) { g.beginPath(); g.arc(cx, hy, R, 0, 7); g.fillStyle = "#08080d"; g.fill(); g.lineWidth = OL; g.strokeStyle = INK; g.stroke(); }
  else {
    const rg = g.createRadialGradient(cx - 6, hy + 10, 6, cx, hy, R * 1.04); rg.addColorStop(0, "#ffffff"); rg.addColorStop(0.55, mix("#ffffff", skin, 0.12)); rg.addColorStop(0.86, mix("#ffffff", skin, 0.55)); rg.addColorStop(1, skin);
    g.beginPath(); g.arc(cx, hy, R, 0, 7); g.fillStyle = rg; g.fill(); g.lineWidth = OL; g.strokeStyle = INK; g.stroke();
  }
  if (s.hair && s.hair !== "none") hairShape(g, (x) => cx + x * u, (y) => hy + y * u, s.hair, s.hairColor ?? "#5a3a26", u);
  // visage
  const ex = 19 * u, ey = hy + 2 * u, look = (s.look ?? 0) * 2.4 * u;
  if (s.shadow) {
    g.save(); for (const sx of [-1, 1]) { g.shadowColor = "rgba(255,255,255,0.95)"; g.shadowBlur = 9 * u; g.fillStyle = "#ffffff"; g.beginPath(); g.ellipse(cx + sx * ex, ey, 10.5 * u, 5.6 * u, sx * 0.13, 0, 7); g.fill(); }
    g.restore(); g.fillStyle = INK; for (const sx of [-1, 1]) { g.beginPath(); g.arc(cx + sx * ex + look, ey + 0.5 * u, 1.5 * u, 0, 7); g.fill(); }
    grin(g, cx, hy + 22 * u, u, true);
  } else {
    for (const sx of [-1, 1]) {
      const x = cx + sx * ex, big = s.expr === "worry" ? 1.08 : 1;
      if (s.blink) { g.strokeStyle = INK; g.lineWidth = 2.6 * u; g.beginPath(); g.moveTo(x - 5 * u, ey); g.lineTo(x + 5 * u, ey + 0.6 * u); g.stroke(); }
      else { g.fillStyle = INK; g.beginPath(); g.ellipse(x + look, ey, 3.8 * u * big, 5.7 * u * big, 0, 0, 7); g.fill(); g.fillStyle = "#ffffff"; g.beginPath(); g.arc(x + look - 1.2 * u, ey - 2.2 * u, 1.25 * u, 0, 7); g.fill(); }
      g.strokeStyle = "rgba(112,96,142,0.62)"; g.lineWidth = 1.7 * u; g.beginPath(); g.arc(x, ey + 9.5 * u, 4.6 * u, 0.12 * Math.PI, 0.88 * Math.PI); g.stroke();            // cernes
      const inner = -sx, by = hy - 12 * u, dI = s.expr === "worry" ? -4.5 : s.expr === "creepy" ? -2.5 : 0, dO = s.expr === "worry" ? 1.4 : s.expr === "creepy" ? -2.5 : -1;
      g.strokeStyle = INK; g.lineWidth = 2 * u; g.beginPath(); g.moveTo(x + inner * 7 * u, by + dI * u); g.quadraticCurveTo(x, by + ((dI + dO) / 2 - 2) * u, x - inner * 7 * u, by + dO * u); g.stroke();
    }
    g.strokeStyle = INK; g.lineWidth = 2.3 * u; g.lineCap = "round";
    if (s.expr === "calm") { g.beginPath(); g.moveTo(cx - 5 * u, hy + 25 * u); g.lineTo(cx + 5 * u, hy + 24.4 * u); g.stroke(); }
    else if (s.expr === "worry") { g.beginPath(); g.arc(cx, hy + 31 * u, 6 * u, 1.18 * Math.PI, 1.82 * Math.PI); g.stroke(); }
    else if (s.expr === "smile_fixed") { g.beginPath(); g.ellipse(cx, hy + 18 * u, 15 * u, 8 * u, 0, 0.12 * Math.PI, 0.88 * Math.PI); g.stroke(); }
    else grin(g, cx, hy + 22 * u, u, false);
  }
  g.restore();
};
