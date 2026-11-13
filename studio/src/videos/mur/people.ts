// Personnages du « Mur » — style v2, calqué sur les références utilisateur du 2026-11-13 (docs/STYLE_PERSONNAGES.md) :
//  - tête = grand cercle blanc nacré (reflet net au centre, bord gris), gros contour noir constant (le même partout) ;
//  - cheveux = casque-bol en aplat (frange droite au-dessus des yeux, pans sur les joues), contour noir ;
//  - yeux = 2 petits ovales noirs verticaux (petit reflet), souvent des cernes violets ; bouche = tiret minuscule ;
//  - petit col blanc rectangulaire ; torse = rectangle arrondi plus étroit que la tête, capuche = gros bourrelet plus foncé autour du col ;
//  - bras = tubes de la couleur du sweat, mains = gros ronds blancs ; jambes longues et fines, chaussures = ovales brun foncé.
// Dessin 600 x 1000, sol à y = 975 (compatible Pool/Actor).
import type { Pen } from "../bridge/toon";

const INK = "#221e1d", OL = 11;
export type Pose = "stand" | "reach" | "armsUp" | "handMouth" | "run";
export type Expr = "calm" | "worry" | "fear" | "shock" | "tired" | "relief" | "frown";
export type Person = {
  pose: Pose; expr: Expr; back?: boolean; blink?: boolean; look?: number; step?: number;
  jacket: string; pants: string; shoes: string; hair: "bob" | "fringe" | "spiky" | "bun" | "ponytail" | "bald"; hairColor: string; hood?: boolean;
};
const hex = (c: string) => { const n = parseInt(c.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const shade = (c: string, k: number) => `rgb(${hex(c).map((v) => Math.max(0, Math.min(255, Math.round(v * k)))).join(",")})`;
const stroke = (g: CanvasRenderingContext2D) => { g.lineWidth = OL; g.strokeStyle = INK; g.stroke(); };
const tube = (g: CanvasRenderingContext2D, pts: number[][], w: number, fill: string) => {
  g.lineCap = "round"; g.lineJoin = "round";
  const path = () => { g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (const q of pts.slice(1)) g.lineTo(q[0], q[1]); };
  path(); g.strokeStyle = INK; g.lineWidth = w + 2 * OL; g.stroke(); path(); g.strokeStyle = fill; g.lineWidth = w; g.stroke();
};
const ball = (g: CanvasRenderingContext2D, x: number, y: number, r: number, fill: string) => { g.beginPath(); g.arc(x, y, r, 0, 7); g.fillStyle = fill; g.fill(); stroke(g); };
const rrect = (g: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number, r: number) => {
  g.beginPath(); g.moveTo(x0, y1); g.lineTo(x0, y0 + r); g.quadraticCurveTo(x0, y0, x0 + r, y0); g.lineTo(x1 - r, y0); g.quadraticCurveTo(x1, y0, x1, y0 + r); g.lineTo(x1, y1); g.closePath();
};

export const drawPerson = (p: Pen, s: Person) => {
  const g = p.g, cx = 300, R = 122, hy = 196, top = 338, hip = 612, tw = 150;
  g.save(); g.lineCap = "round"; g.lineJoin = "round";
  const J = s.jacket, stp = Math.sin((s.step ?? 0) * Math.PI * 2);
  // ---- jambes (tubes fins, longues) + chaussures
  const feet: number[] = s.pose === "run" ? [-78 - 18 * stp, 78 + 18 * stp] : [-30, 30];
  feet.forEach((fx, i) => {
    const hx = cx + (i ? 24 : -24);
    tube(g, [[hx, hip - 6], [cx + fx, 946]], 40, s.pants);
    g.beginPath(); g.ellipse(cx + fx + (s.back ? 0 : (i ? 6 : -6)), 958, 36, 18, 0, 0, 7); g.fillStyle = s.shoes; g.fill(); stroke(g);
  });
  // ---- bras : positions des épaules et des mains
  const shL = [cx - tw / 2 + 14, top + 30], shR = [cx + tw / 2 - 14, top + 30];
  const hang = (sh: number[], sx: number) => [sh, [sh[0] + sx * 22, top + 150], [sh[0] + sx * 26, hip - 4]];
  const armL = s.pose === "armsUp" ? [shL, [cx - 118, top - 110], [cx - 92, top - 236]] : s.pose === "run" ? [shL, [cx - 130, top + 120 - 40 * stp], [cx - 80, top + 220 - 50 * stp]] : hang(shL, -1);
  const armR = s.pose === "armsUp" ? [shR, [cx + 118, top - 110], [cx + 92, top - 236]] : s.pose === "reach" ? [shR, [cx + 180, top + 36], [cx + 266, top + 40]]
    : s.pose === "handMouth" ? [shR, [cx + tw / 2 + 34, top + 120], [cx + 30, hy + 66]] : s.pose === "run" ? [shR, [cx + 130, top + 120 + 40 * stp], [cx + 80, top + 220 + 50 * stp]] : hang(shR, 1);
  // ---- de dos : capuche = grand bourrelet sur le haut du dos (derrière la tête)
  if (s.hood && s.back) { g.beginPath(); g.ellipse(cx, top + 34, 98, 84, 0, 0, 7); g.fillStyle = shade(J, 0.8); g.fill(); stroke(g); }
  // ---- torse
  rrect(g, cx - tw / 2, top, cx + tw / 2, hip, 30);
  { const cg = g.createLinearGradient(cx - tw / 2, 0, cx + tw / 2, 0); cg.addColorStop(0, shade(J, 1.1)); cg.addColorStop(0.55, J); cg.addColorStop(1, shade(J, 0.78)); g.fillStyle = cg; g.fill();
    g.save(); g.clip(); g.fillStyle = shade(J, 0.72); g.globalAlpha = 0.28;                      // texture : taches d'usure, côtes du bas
    for (const [x, y, rx, ry] of [[-30, 120, 16, 22], [34, 200, 12, 16], [-10, 230, 9, 12], [40, 70, 10, 13], [-44, 190, 8, 10]]) { g.beginPath(); g.ellipse(cx + x, top + y, rx, ry, 0.3, 0, 7); g.fill(); }
    g.globalAlpha = 0.45; g.strokeStyle = shade(J, 0.62); g.lineWidth = 3; for (let k = 0; k < 12; k++) { const x = cx - tw / 2 + 8 + k * (tw - 16) / 11; g.beginPath(); g.moveTo(x, hip - 30); g.lineTo(x, hip); g.stroke(); }
    g.globalAlpha = 1; g.restore(); }
  g.beginPath(); g.moveTo(cx - tw / 2, hip - 32); g.lineTo(cx + tw / 2, hip - 32); g.strokeStyle = shade(J, 0.55); g.lineWidth = 4; g.stroke();
  rrect(g, cx - tw / 2, top, cx + tw / 2, hip, 30); stroke(g);
  if (!s.back) { g.strokeStyle = shade(J, 0.6); g.lineWidth = 5; g.beginPath(); g.moveTo(cx + 4, top + 40); g.lineTo(cx + 4, hip - 10); g.stroke(); }
  // ---- de face : capuche = bourrelet foncé en U autour du col
  if (s.hood && !s.back) { g.beginPath(); g.ellipse(cx, top + 14, 84, 46, 0, 0, 7); g.fillStyle = shade(J, 0.78); g.fill(); stroke(g);
    g.beginPath(); g.ellipse(cx, top + 4, 44, 22, 0, 0, Math.PI); g.fillStyle = shade(J, 0.62); g.fill(); }
  // ---- bras + mains (gros ronds blancs)
  for (const a of [armL, armR]) { tube(g, a, 40, J); const h = a[a.length - 1]; ball(g, h[0], h[1], 31, "#f2f2f4"); }
  // ---- col blanc
  rrect(g, cx - 22, hy + R - 18, cx + 22, top + 10, 4); g.fillStyle = "#f4f4f6"; g.fill(); stroke(g);
  // ---- tête : sphère nacrée (reflet net au centre, bord gris)
  const hg = g.createRadialGradient(cx - 10, hy - 6, 4, cx, hy, R); hg.addColorStop(0, "#ffffff"); hg.addColorStop(0.45, "#f6f6f7"); hg.addColorStop(0.85, "#dcdde2"); hg.addColorStop(1, "#b9bac3");
  g.beginPath(); g.arc(cx, hy, R, 0, 7); g.fillStyle = hg; g.fill();
  g.save(); g.beginPath(); g.arc(cx, hy, R, 0, 7); g.clip();
  g.fillStyle = "rgba(60,60,72,0.16)"; g.fillRect(cx - R, hy + R * 0.5, 2 * R, R);                  // bande d'ombre sous le visage (lumière du dessus)
  g.globalAlpha = 0.6; g.fillStyle = "#ffffff"; g.beginPath(); g.ellipse(cx - 8, hy + 2, R * 0.4, R * 0.32, 0, 0, 7); g.fill();
  g.globalAlpha = 0.9; g.beginPath(); g.ellipse(cx + R * 0.55, hy - R * 0.1, 5, 7, 0, 0, 7); g.fill(); g.globalAlpha = 1; g.restore();
  // ---- cheveux (casque-bol, aplat + léger reflet)
  const hc = s.hairColor;
  if (s.hair !== "bald") {
    g.save(); g.beginPath(); g.arc(cx, hy, R - 1, 0, 7); g.clip(); g.fillStyle = hc; g.beginPath();
    if (s.back) g.rect(cx - R, hy - R, 2 * R, R * 1.62);
    else if (s.hair === "bob" || s.hair === "fringe") {
      const fr = hy - 4, side = hy + (s.hair === "bob" ? 44 : 22);
      g.moveTo(cx - R, side); g.lineTo(cx - R, hy - R); g.lineTo(cx + R, hy - R); g.lineTo(cx + R, side);
      g.lineTo(cx + R * 0.86, side); g.quadraticCurveTo(cx + R * 0.8, fr + 4, cx + R * 0.55, fr); g.lineTo(cx - R * 0.55, fr);
      g.quadraticCurveTo(cx - R * 0.8, fr + 4, cx - R * 0.86, side); g.closePath();
    } else { g.moveTo(cx - R, hy - 18); g.lineTo(cx - R, hy - R); g.lineTo(cx + R, hy - R); g.lineTo(cx + R, hy - 18); g.quadraticCurveTo(cx, hy - 62, cx - R, hy - 18); }
    g.fill(); g.strokeStyle = INK; g.lineWidth = OL; g.stroke();
    { const gl = g.createRadialGradient(cx, hy - R * 0.55, 4, cx, hy - R * 0.45, R * 0.75); gl.addColorStop(0, "rgba(255,240,215,0.42)"); gl.addColorStop(1, "rgba(255,240,215,0)");
      g.fillStyle = gl; g.fill(); }                                                               // reflet doux sur le casque de cheveux
    g.restore();
  } else {                                                            // chauve : 2 touffes grises sur les côtés
    for (const sx of [-1, 1]) { g.beginPath(); g.ellipse(cx + sx * R * 0.86, hy - 4, 22, 34, sx * 0.3, 0, 7); g.fillStyle = hc; g.fill(); stroke(g); }
  }
  g.beginPath(); g.arc(cx, hy, R, 0, 7); stroke(g);
  if (s.hair === "spiky") { g.fillStyle = hc; for (const dx of [-54, -12, 32]) { g.beginPath(); g.moveTo(cx + dx - 26, hy - R + 22); g.lineTo(cx + dx, hy - R - 36); g.lineTo(cx + dx + 24, hy - R + 22); g.closePath(); g.fill(); stroke(g); } }
  if (s.hair === "bun") ball(g, cx, hy - R - 16, 36, hc);
  if (s.hair === "ponytail") ball(g, cx + R - 8, hy - 34, 32, hc);
  // ---- visage
  if (!s.back) {
    const lx = (s.look ?? 0) * 18, ey = hy + 30;
    if (s.expr === "tired" || s.expr === "worry" || s.expr === "fear") {   // cernes violets en croissant
      g.strokeStyle = "rgba(112,84,150,0.8)"; g.lineWidth = 5; for (const sx of [-1, 1]) { g.beginPath(); g.arc(cx + sx * 38 + lx, ey + 8, 15, 0.25, Math.PI - 0.25); g.stroke(); }
    }
    g.fillStyle = INK; g.strokeStyle = INK; g.lineWidth = 5.5;
    for (const sx of [-1, 1]) {
      const x = cx + sx * 38 + lx;
      if (s.blink || s.expr === "relief") { g.beginPath(); g.arc(x, ey + 4, 11, Math.PI + 0.35, -0.35); g.stroke(); continue; }
      const rx = s.expr === "fear" || s.expr === "shock" ? 7 : 9, ry = s.expr === "fear" ? 10 : 13;
      g.beginPath(); g.ellipse(x, ey, rx, ry, 0, 0, 7); g.fill();
      g.fillStyle = "#ffffff"; g.beginPath(); g.arc(x - 2.5, ey - 5, 2.4, 0, 7); g.fill(); g.fillStyle = INK;
      if (s.expr === "worry" || s.expr === "fear") { g.save(); g.lineWidth = 9; g.beginPath(); g.moveTo(x + sx * 16, ey - 24); g.lineTo(x - sx * 8, ey - 34); g.stroke(); g.restore(); }
      if (s.expr === "frown") { g.beginPath(); g.moveTo(x - sx * 16, ey - 24); g.lineTo(x + sx * 10, ey - 30); g.stroke(); }
    }
    const mx = cx + lx * 0.8, my = hy + 72;
    if (s.pose !== "handMouth") {
      if (s.expr === "shock" || s.expr === "fear") { g.beginPath(); g.ellipse(mx, my, 7, 10, 0, 0, 7); g.fill(); }
      else if (s.expr === "relief") { g.beginPath(); g.arc(mx, my - 6, 10, 0.3, Math.PI - 0.3); g.stroke(); }
      else { g.beginPath(); g.moveTo(mx - 6, my); g.lineTo(mx + 6, my); g.stroke(); }
    }
  }
  if (s.pose === "handMouth") ball(g, cx + 30, hy + 66, 31, "#f2f2f4");
  g.restore();
};
