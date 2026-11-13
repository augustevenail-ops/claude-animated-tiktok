// Personnages du « Mur », style v2 (docs/STYLE_PERSONNAGES.md) : tête = cercle blanc nacré à reflet, gros contour noir constant,
// 2 petits ovales noirs, bouche minuscule, cheveux = aplat-casque, torse rectangle arrondi en aplat, bras-tubes, mains = ronds blancs,
// jambes longues et fines, petits pieds ovales. Tête ≈ 1/4 de la hauteur. Dessin 600 x 1000, sol à y = 975 (compatible Pool/Actor).
import type { Pen } from "../bridge/toon";

const INK = "#141418", OL = 9;
export type Pose = "stand" | "reach" | "armsUp" | "handMouth" | "run";
export type Expr = "calm" | "worry" | "fear" | "shock" | "tired" | "relief" | "frown";
export type Person = {
  pose: Pose; expr: Expr; back?: boolean; blink?: boolean; look?: number; step?: number;
  jacket: string; pants: string; shoes: string; hair: "bob" | "fringe" | "spiky" | "bun" | "ponytail" | "bald"; hairColor: string; hood?: boolean;
};
const hex = (c: string) => { const n = parseInt(c.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const shade = (c: string, k: number) => `rgb(${hex(c).map((v) => Math.max(0, Math.min(255, Math.round(v * k)))).join(",")})`;
const tube = (g: CanvasRenderingContext2D, pts: number[][], w: number, fill: string) => {
  g.lineCap = "round"; g.lineJoin = "round";
  const path = () => { g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (const q of pts.slice(1)) g.lineTo(q[0], q[1]); };
  path(); g.strokeStyle = INK; g.lineWidth = w + 2 * OL; g.stroke(); path(); g.strokeStyle = fill; g.lineWidth = w; g.stroke();
};
const ball = (g: CanvasRenderingContext2D, x: number, y: number, r: number, fill: string) => { g.beginPath(); g.arc(x, y, r, 0, 7); g.fillStyle = fill; g.fill(); g.lineWidth = OL; g.strokeStyle = INK; g.stroke(); };

export const drawPerson = (p: Pen, s: Person) => {
  const g = p.g, cx = 300, R = 128, hy = 212, top = 362, hip = 650, tw = 168;
  g.save(); g.lineCap = "round"; g.lineJoin = "round";
  const pants = s.pants, jacket = s.jacket, stp = Math.sin((s.step ?? 0) * Math.PI * 2);
  // jambes + pieds
  const legs: [number, number][] = s.pose === "run" ? [[-70 - 20 * stp, 0], [70 + 20 * stp, 0]] : [[-34, 0], [34, 0]];
  for (const [dx] of legs) {
    tube(g, [[cx + Math.sign(dx) * 30, hip - 10], [cx + dx, 942]], 46, pants);
    g.beginPath(); g.ellipse(cx + dx + (s.back ? 0 : 4), 958, 34, 17, 0, 0, 7); g.fillStyle = s.shoes; g.fill(); g.lineWidth = OL; g.strokeStyle = INK; g.stroke();
  }
  // capuche dans le dos (vue de face : col ; de dos : grand demi-disque)
  if (s.hood && s.back) { g.beginPath(); g.ellipse(cx, top + 20, 104, 78, 0, 0, 7); g.fillStyle = shade(jacket, 0.82); g.fill(); g.lineWidth = OL; g.strokeStyle = INK; g.stroke(); }
  // bras du fond (derrière le torse) pour les poses où un bras se lève
  const shL = [cx - tw / 2 + 16, top + 26], shR = [cx + tw / 2 - 16, top + 26];
  const armL: number[][] = s.pose === "armsUp" ? [shL, [cx - 120, top - 120], [cx - 96, top - 250]] : s.pose === "run" ? [shL, [cx - 120, top + 150 - 40 * stp], [cx - 70, top + 240 - 60 * stp]] : [shL, [cx - tw / 2 - 4, top + 150], [cx - tw / 2 - 2, hip - 6]];
  const armR: number[][] = s.pose === "armsUp" ? [shR, [cx + 120, top - 120], [cx + 96, top - 250]] : s.pose === "reach" ? [shR, [cx + 190, top + 40], [cx + 270, top + 50]]
    : s.pose === "handMouth" ? [shR, [cx + tw / 2 + 30, top + 110], [cx + 34, hy + 74]] : s.pose === "run" ? [shR, [cx + 120, top + 150 + 40 * stp], [cx + 70, top + 240 + 60 * stp]] : [shR, [cx + tw / 2 + 4, top + 150], [cx + tw / 2 + 2, hip - 6]];
  // torse : rectangle aux coins arrondis, aplat + léger dégradé
  const rr = 34; g.beginPath(); g.moveTo(cx - tw / 2, hip); g.lineTo(cx - tw / 2, top + rr); g.quadraticCurveTo(cx - tw / 2, top, cx - tw / 2 + rr, top);
  g.lineTo(cx + tw / 2 - rr, top); g.quadraticCurveTo(cx + tw / 2, top, cx + tw / 2, top + rr); g.lineTo(cx + tw / 2, hip); g.closePath();
  const tg = g.createLinearGradient(0, top, 0, hip); tg.addColorStop(0, shade(jacket, 1.06)); tg.addColorStop(1, shade(jacket, 0.88)); g.fillStyle = tg; g.fill(); g.lineWidth = OL; g.strokeStyle = INK; g.stroke();
  if (!s.back) { g.strokeStyle = shade(jacket, 0.62); g.lineWidth = 4; g.beginPath(); g.moveTo(cx + 6, top + 18); g.lineTo(cx + 6, hip - 8); g.stroke(); }   // fermeture
  if (s.hood && !s.back) { g.beginPath(); g.ellipse(cx, top + 6, 70, 30, 0, Math.PI, 0); g.fillStyle = shade(jacket, 0.8); g.fill(); g.lineWidth = OL; g.strokeStyle = INK; g.stroke(); }
  // bras (tubes) + mains (ronds blancs)
  for (const a of [armL, armR]) { tube(g, a, 42, shade(jacket, 0.96)); const h = a[a.length - 1]; ball(g, h[0], h[1], 30, "#f4f4f6"); }
  // cou + tête (sphère nacrée)
  g.fillStyle = "#f3f3f5"; g.fillRect(cx - 18, hy + R - 12, 36, 30); g.lineWidth = OL; g.strokeStyle = INK; g.strokeRect(cx - 18, hy + R - 12, 36, 28);
  const hg = g.createRadialGradient(cx - 26, hy - 30, 6, cx, hy, R * 1.05); hg.addColorStop(0, "#ffffff"); hg.addColorStop(0.6, "#f0f0f2"); hg.addColorStop(1, "#c9cad2");
  g.beginPath(); g.arc(cx, hy, R, 0, 7); g.fillStyle = hg; g.fill(); g.lineWidth = OL; g.strokeStyle = INK; g.stroke();
  // cheveux (aplat-casque)
  const hc = s.hairColor; g.save(); g.beginPath(); g.arc(cx, hy, R - 1, 0, 7); g.clip(); g.fillStyle = hc; g.beginPath();
  if (s.back) { g.rect(cx - R, hy - R, 2 * R, R * (s.hair === "bald" ? 0.2 : 1.55)); }
  else if (s.hair === "bob" || s.hair === "fringe") { g.moveTo(cx - R, hy + 30); g.lineTo(cx - R, hy - R); g.lineTo(cx + R, hy - R); g.lineTo(cx + R, hy + 30); g.quadraticCurveTo(cx + R * 0.75, hy - 30, cx + 10, hy - 40); g.quadraticCurveTo(cx - 40, hy - 46, cx - R * 0.72, hy + 20); }
  else if (s.hair === "spiky" || s.hair === "ponytail" || s.hair === "bun") { g.moveTo(cx - R, hy - 10); g.lineTo(cx - R, hy - R); g.lineTo(cx + R, hy - R); g.lineTo(cx + R, hy - 10); g.quadraticCurveTo(cx, hy - 70, cx - R, hy - 10); }
  else { g.moveTo(cx - R, hy + 10); g.lineTo(cx - R, hy - 20); g.quadraticCurveTo(cx - R + 16, hy - 4, cx - R + 26, hy + 30); }
  g.fill(); g.restore();
  g.beginPath(); g.arc(cx, hy, R, 0, 7); g.lineWidth = OL; g.strokeStyle = INK; g.stroke();
  if (s.hair === "spiky") { g.fillStyle = hc; for (const dx of [-50, -10, 34]) { g.beginPath(); g.moveTo(cx + dx - 24, hy - R + 18); g.lineTo(cx + dx, hy - R - 34); g.lineTo(cx + dx + 22, hy - R + 18); g.closePath(); g.fill(); g.lineWidth = OL; g.strokeStyle = INK; g.stroke(); } }
  if (s.hair === "bun") ball(g, cx, hy - R - 18, 34, hc);
  if (s.hair === "ponytail") ball(g, cx + R - 4, hy - 30, 30, hc);
  // visage
  if (!s.back) {
    const lx = (s.look ?? 0) * 18, ey = hy + 30;
    if (s.expr === "tired") { g.strokeStyle = "rgba(110,80,140,0.75)"; g.lineWidth = 5; for (const sx of [-1, 1]) { g.beginPath(); g.arc(cx + sx * 40 + lx, ey + 10, 14, 0.2, Math.PI - 0.2); g.stroke(); } }
    g.fillStyle = INK; g.strokeStyle = INK; g.lineWidth = 5;
    for (const sx of [-1, 1]) {
      const x = cx + sx * 40 + lx;
      if (s.blink || s.expr === "relief") { g.beginPath(); g.arc(x, ey + 4, 10, Math.PI + 0.3, -0.3); g.stroke(); }
      else { g.beginPath(); g.ellipse(x, ey, s.expr === "fear" || s.expr === "shock" ? 8 : 9, s.expr === "fear" ? 11 : 13, 0, 0, 7); g.fill();
        g.fillStyle = "#ffffff"; g.beginPath(); g.arc(x - 3, ey - 5, 2.6, 0, 7); g.fill(); g.fillStyle = INK; }
      if (s.expr === "worry" || s.expr === "fear") { g.beginPath(); g.moveTo(x - sx * 14, ey - 30); g.lineTo(x + sx * 10, ey - 22); g.stroke(); }
      if (s.expr === "frown") { g.beginPath(); g.moveTo(x - sx * 14, ey - 22); g.lineTo(x + sx * 10, ey - 30); g.stroke(); }
    }
    const mx = cx + lx * 0.8, my = hy + 74;
    if (s.pose !== "handMouth") {
      if (s.expr === "shock" || s.expr === "fear") { g.beginPath(); g.ellipse(mx, my, 7, 10, 0, 0, 7); g.fill(); }
      else if (s.expr === "relief") { g.beginPath(); g.arc(mx, my - 6, 10, 0.3, Math.PI - 0.3); g.stroke(); }
      else { g.beginPath(); g.moveTo(mx - 7, my); g.lineTo(mx + 7, my); g.stroke(); }
    }
  }
  if (s.pose === "handMouth") ball(g, cx + 34, hy + 74, 30, "#f4f4f6");
  g.restore();
};
