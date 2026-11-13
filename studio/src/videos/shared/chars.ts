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
  mode: "stand" | "sit"; expr: "calm" | "worry" | "smile_fixed" | "creepy" | "shadow" | "mute" | "talk" | "laugh"; blink?: boolean; look?: number; wave?: number;
  /** main sur la gorge (ne peut plus parler) ; masque intégral à visière (hommes en blanc) */ throat?: boolean; mask?: boolean;
  /** vu de dos (tête = cheveux / capuche, pas de visage) */ back?: boolean;
  jacket: string; pants: string; shoes: string; skin?: string; hair?: "side" | "short" | "long" | "none"; hairColor?: string; hood?: boolean; shadow?: boolean;
};

const tube = (g: CanvasRenderingContext2D, pts: number[][], w: number, fill: string | CanvasGradient) => {
  g.lineCap = "round"; g.lineJoin = "round";
  const path = () => { g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); if (pts.length === 3) g.quadraticCurveTo(pts[1][0], pts[1][1], pts[2][0], pts[2][1]); else for (const q of pts.slice(1)) g.lineTo(q[0], q[1]); };
  path(); g.strokeStyle = INK; g.lineWidth = w + 2 * OL; g.stroke();
  path(); g.strokeStyle = fill; g.lineWidth = w; g.stroke();
};
const ball = (g: CanvasRenderingContext2D, x: number, y: number, r: number, fill: string) => { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fillStyle = fill; g.fill(); g.lineWidth = OL; g.strokeStyle = INK; g.stroke(); };
/** hachures fines (texture de tissu) dans le rectangle donné, à clipper avant l'appel */
const hatch = (g: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number, col: string, sp: number, dir: number) => { g.save(); g.lineWidth = 1.5; g.strokeStyle = col; const h = y1 - y0; for (let k = -h; k < x1 - x0 + h; k += sp) { g.beginPath(); if (dir > 0) { g.moveTo(x0 + k, y1); g.lineTo(x0 + k + h, y0); } else { g.moveTo(x0 + k, y0); g.lineTo(x0 + k + h, y1); } g.stroke(); } g.restore(); };
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
  for (const [a, b, c, d, e, f] of kind === "side" ? [[-34, -46, -18, -54, -2, -50], [4, -52, 22, -54, 38, -46], [-44, -30, -36, -42, -22, -48], [8, -34, 20, -44, 34, -42], [-18, -32, -8, -42, 4, -46]] : [[-8, -42, -4, -50, 6, -55], [14, -42, 28, -50, 40, -44], [-34, -34, -26, -44, -12, -50], [22, -38, 34, -42, 44, -34]])
    { g.beginPath(); g.moveTo(X(a), Y(b)); g.quadraticCurveTo(X(c), Y(d), X(e), Y(f)); g.stroke(); }
  g.strokeStyle = shade(col, 1.45); g.globalAlpha = 0.45; g.lineWidth = 3.4 * u; g.beginPath(); g.moveTo(X(-26), Y(-50)); g.quadraticCurveTo(X(-6), Y(-60), X(18), Y(-56)); g.stroke(); g.globalAlpha = 1;
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
  g.fillStyle = vgrad(g, torsoTop, hip, jacket); g.fill();
  if (!s.shadow) { g.save(); g.clip(); hatch(g, cx - tw / 2, torsoTop, cx + tw / 2, hip, "rgba(255,255,255,0.05)", 10, 1); hatch(g, cx - tw / 2, torsoTop, cx + tw / 2, hip, "rgba(0,0,0,0.08)", 16, -1);
    g.strokeStyle = "rgba(0,0,0,0.16)"; g.lineWidth = 3; g.lineCap = "round"; for (const [x0, y0, x1, y1] of [[-58, 170, -20, 210], [50, 120, 18, 170], [-40, 60, -62, 100]]) { g.beginPath(); g.moveTo(cx + x0, torsoTop + y0 * 0.6); g.quadraticCurveTo(cx + (x0 + x1) / 2, torsoTop + (y0 + y1) / 2 * 0.62 + 6, cx + x1, torsoTop + y1 * 0.6); g.stroke(); }
    const rim = g.createLinearGradient(cx - tw / 2, 0, cx + tw / 2, 0); rim.addColorStop(0, "rgba(160,185,255,0.36)"); rim.addColorStop(0.16, "rgba(160,185,255,0)"); rim.addColorStop(0.86, "rgba(255,170,100,0)"); rim.addColorStop(1, "rgba(255,170,100,0.26)");
    g.fillStyle = rim; g.fillRect(cx - tw / 2, torsoTop, tw, hip - torsoTop); g.restore(); }
  g.lineWidth = OL; g.strokeStyle = INK; g.stroke();
  if (s.hood && !s.shadow && !s.back) { g.strokeStyle = "#aab2d0"; g.lineWidth = 3.4; g.lineCap = "round"; for (const sx of [-1, 1]) { g.beginPath(); g.moveTo(cx + sx * 12, torsoTop + 6); g.lineTo(cx + sx * 12, torsoTop + 66); g.stroke(); g.fillStyle = "#dfe4f4"; g.beginPath(); g.arc(cx + sx * 12, torsoTop + 70, 4.2, 0, 7); g.fill(); }
    g.strokeStyle = shade(jacket, 0.6); g.lineWidth = 3.2; g.beginPath(); g.moveTo(cx - 44, hip - 70); g.quadraticCurveTo(cx, hip - 52, cx + 44, hip - 70); g.stroke(); }
  // bras (tubes) + mains (ronds blancs)
  const hand = s.shadow ? "#0a0a10" : "#f4f4f7", wave = s.wave ?? 0;
  for (const sx of [-1, 1]) {
    const sh = [cx + sx * 80, torsoTop + 30];
    const raised = sx === 1 && wave > 0.4, thr = sx === 1 && !!s.throat, end = thr ? [cx + 26, torsoTop - 4] : raised ? [cx + 128, hy + 40] : sit ? [cx + sx * 74, hip - 8] : [cx + sx * 100, hip - 24], mid = thr ? [cx + 118, torsoTop + 95] : raised ? [cx + 136, torsoTop + 90] : [cx + sx * 100, (sh[1] + end[1]) / 2];
    tube(g, [sh, mid, end], 46, vgrad(g, sh[1], end[1], jacket));
    if (!s.shadow) { g.save(); g.strokeStyle = sx < 0 ? "rgba(170,195,255,0.22)" : "rgba(255,185,120,0.16)"; g.lineWidth = 6; g.lineCap = "round"; g.beginPath(); g.moveTo(sh[0] + sx * 14, sh[1] + 8); g.quadraticCurveTo(mid[0] + sx * 14, mid[1], end[0] + sx * 14, end[1] - 12); g.stroke(); g.restore(); }
    if (!thr) ball(g, end[0], end[1] + (raised ? -8 : 6), 27, hand);
  }
  if (s.hair === "long") { const hc = s.hairColor ?? "#3a2a22"; g.beginPath(); g.moveTo(cx - 98, torsoTop - 110); g.bezierCurveTo(cx - 118, torsoTop + 10, cx - 96, torsoTop + 70, cx - 70, torsoTop + 78); g.lineTo(cx + 70, torsoTop + 78);
    g.bezierCurveTo(cx + 96, torsoTop + 70, cx + 118, torsoTop + 10, cx + 98, torsoTop - 110); g.closePath(); g.fillStyle = shade(hc, 0.85); g.fill(); g.lineWidth = OL; g.strokeStyle = INK; g.stroke(); }
  // cou + tête (sphère nacrée)
  g.beginPath(); g.rect(cx - 16, torsoTop - 20, 32, 30); g.fillStyle = s.shadow ? "#0a0a10" : "#e9eaee"; g.fill(); g.lineWidth = OL; g.strokeStyle = INK; g.stroke();
  const skin = s.skin ?? "#bfc4d2";
  if (s.shadow) { g.beginPath(); g.arc(cx, hy, R, 0, 7); g.fillStyle = "#08080d"; g.fill(); g.lineWidth = OL; g.strokeStyle = INK; g.stroke(); }
  else {
    const rg = g.createRadialGradient(cx - 6, hy + 10, 6, cx, hy, R * 1.04); rg.addColorStop(0, "#ffffff"); rg.addColorStop(0.55, mix("#ffffff", skin, 0.12)); rg.addColorStop(0.86, mix("#ffffff", skin, 0.55)); rg.addColorStop(1, skin);
    g.beginPath(); g.arc(cx, hy, R, 0, 7); g.fillStyle = rg; g.fill(); g.lineWidth = OL; g.strokeStyle = INK; g.stroke();
  }
  if (!s.shadow && !s.back) { g.save(); g.lineCap = "round"; g.strokeStyle = "rgba(255,150,160,0.13)"; g.lineWidth = 1; g.fillStyle = "rgba(255,150,160,0.12)";
    for (const sx of [-1, 1]) { g.beginPath(); g.ellipse(cx + sx * 27 * u, hy + 15 * u, 9 * u, 5 * u, 0, 0, 7); g.fill(); }
    g.beginPath(); g.arc(cx, hy, R - 4.5, 0.78 * Math.PI, 1.3 * Math.PI); g.strokeStyle = "rgba(165,190,255,0.62)"; g.lineWidth = 5; g.stroke();            // lumière de contour froide (fenêtre)
    g.beginPath(); g.arc(cx, hy, R - 4.5, -0.28 * Math.PI, 0.3 * Math.PI); g.strokeStyle = "rgba(255,175,105,0.42)"; g.lineWidth = 4.5; g.stroke(); g.restore(); }
  if (s.back && !s.mask) { const hc = s.hair && s.hair !== "none" ? s.hairColor ?? "#5a3a26" : "#c9ccd6"; g.beginPath(); g.arc(cx, hy, R + 2, 0, 7); g.fillStyle = vgrad(g, hy - R, hy + R, hc); g.fill(); g.lineWidth = OL; g.strokeStyle = INK; g.stroke();
    g.strokeStyle = "rgba(0,0,0,0.18)"; g.lineWidth = 3; for (const k of [-1, 0, 1]) { g.beginPath(); g.moveTo(cx + k * 30, hy - R + 20); g.quadraticCurveTo(cx + k * 38, hy, cx + k * 26, hy + R - 10); g.stroke(); } }
  else if (s.hair && s.hair !== "none" && !s.mask) hairShape(g, (x) => cx + x * u, (y) => hy + y * u, s.hair === "long" ? "side" : s.hair, s.hairColor ?? "#5a3a26", u);
  // visage
  const ex = 19 * u, ey = hy + 2 * u, look = (s.look ?? 0) * 2.4 * u;
  if (s.back) { /* de dos : pas de visage */ }
  else if (s.shadow) {
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
    else if (s.expr === "mute") { g.beginPath(); g.ellipse(cx, hy + 28 * u, 7.5 * u, 10 * u, 0, 0, 7); g.fillStyle = "#1a0c12"; g.fill(); g.stroke();
      g.strokeStyle = "rgba(23,22,29,0.55)"; g.lineWidth = 1.4 * u; for (const sx of [-1, 1]) { g.beginPath(); g.moveTo(cx + sx * 12 * u, hy + 22 * u); g.lineTo(cx + sx * 15 * u, hy + 34 * u); g.stroke(); } }
    else if (s.expr === "talk") { g.beginPath(); g.ellipse(cx, hy + 26 * u, 5.5 * u, 4 * u, 0, 0, 7); g.fillStyle = "#1a0c12"; g.fill(); g.stroke(); }
    else if (s.expr === "laugh") { g.beginPath(); g.moveTo(cx - 11 * u, hy + 21 * u); g.quadraticCurveTo(cx, hy + 23 * u, cx + 11 * u, hy + 21 * u); g.quadraticCurveTo(cx, hy + 38 * u, cx - 11 * u, hy + 21 * u); g.closePath(); g.fillStyle = "#3a1220"; g.fill(); g.stroke(); }
    else grin(g, cx, hy + 22 * u, u, false);
  }
  if (s.mask) {   // capuche de combinaison + visière sombre + filtres
    const hood = g.createRadialGradient(cx - 20, hy - 30, 10, cx, hy, R * 1.2); hood.addColorStop(0, "#ffffff"); hood.addColorStop(1, "#b9c0cc");
    g.beginPath(); g.ellipse(cx, hy + 6, R * 1.1, R * 1.12, 0, 0, 7); g.fillStyle = hood; g.fill(); g.lineWidth = OL; g.strokeStyle = INK; g.stroke();
    if (!s.back) {
    g.beginPath(); g.roundRect(cx - 64, hy - 34, 128, 70, 30); const vz = g.createLinearGradient(0, hy - 34, 0, hy + 36); vz.addColorStop(0, "#1d2b33"); vz.addColorStop(1, "#05080b"); g.fillStyle = vz; g.fill(); g.lineWidth = OL; g.stroke();
    g.strokeStyle = "rgba(150,255,210,0.45)"; g.lineWidth = 5; g.beginPath(); g.moveTo(cx - 44, hy - 18); g.quadraticCurveTo(cx - 10, hy - 28, cx + 30, hy - 22); g.stroke();
    for (const sx of [-1, 1]) ball(g, cx + sx * 34, hy + 62, 17, "#6d7480");
    }
  }
  if (s.throat && !s.back) { ball(g, cx + 26, torsoTop - 6, 27, s.shadow ? "#0a0a10" : "#f4f4f7"); }
  g.restore();
};
