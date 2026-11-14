// Pantin articulé (même dessin que mur/people.ts : tête porcelaine, contour encre 11 px, tubes, mains rondes) avec articulations
// indépendantes — épaules, coudes, hanches, genoux, buste (lean) — et trois vues : face, dos, PROFIL (side). Carte 600 x 1000, sol y ≈ 975.
// Angles en radians, 0 = membre pendant à la verticale. Profil : angle > 0 = vers l'avant ; genou > 0 = plié vers l'arrière ; coude > 0 = plié vers l'avant.
// Face : épaule > 0 = bras écarté du corps ; hanche > 0 = jambe écartée.
import type { Pen } from "../bridge/toon";
import type { Person } from "../mur/people";

const INK = "#221e1d", OL = 11;
export const CX = 300, R = 122, HY = 196, TOP = 338, HIP = 612, TW = 150;
export const ARM = [140, 128], LEG = [176, 164];
export type View = "front" | "back" | "side";
export type Joints = { shL: number; elL: number; shR: number; elR: number; hipL: number; knL: number; hipR: number; knR: number; lean?: number; head?: number; bob?: number };
export const REST: Joints = { shL: 0.08, elL: 0.1, shR: 0.08, elR: 0.1, hipL: 0.04, knL: 0, hipR: 0.04, knR: 0 };

const hex = (c: string) => { const n = parseInt(c.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
export const shade = (c: string, k: number) => c.startsWith("#") ? `rgb(${hex(c).map((v) => Math.max(0, Math.min(255, Math.round(v * k)))).join(",")})` : c;
const stroke = (g: CanvasRenderingContext2D, w = OL) => { g.lineWidth = w; g.strokeStyle = INK; g.stroke(); };
const tube = (g: CanvasRenderingContext2D, pts: number[][], w: number, fill: string) => {
  g.lineCap = "round"; g.lineJoin = "round";
  const path = () => { g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (const q of pts.slice(1)) g.lineTo(q[0], q[1]); };
  path(); g.strokeStyle = INK; g.lineWidth = w + 2 * OL; g.stroke(); path(); g.strokeStyle = fill; g.lineWidth = w; g.stroke();
};
const ball = (g: CanvasRenderingContext2D, x: number, y: number, r: number, fill: string) => { g.beginPath(); g.arc(x, y, r, 0, 7); g.fillStyle = fill; g.fill(); stroke(g); };
const rrect = (g: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number, r: number) => {
  g.beginPath(); g.moveTo(x0, y1); g.lineTo(x0, y0 + r); g.quadraticCurveTo(x0, y0, x0 + r, y0); g.lineTo(x1 - r, y0); g.quadraticCurveTo(x1, y0, x1, y0 + r); g.lineTo(x1, y1); g.closePath();
};
/** chaîne à 2 segments : départ, angle du 1er segment (depuis la verticale descendante, sens dir), pli au milieu */
const limb = (x: number, y: number, a: number, bend: number, L: number[], dir: number) => {
  const k = [x + dir * Math.sin(a) * L[0], y + Math.cos(a) * L[0]], a2 = a + bend;
  return [[x, y], k, [k[0] + dir * Math.sin(a2) * L[1], k[1] + Math.cos(a2) * L[1]]];
};
/** cycles prêts à l'emploi (phase 0..1) */
export const walkJ = (ph: number, amp = 1): Joints => { const s = Math.sin(ph * Math.PI * 2), c = Math.cos(ph * Math.PI * 2);
  return { shL: -0.35 * s * amp, elL: 0.25 + 0.1 * amp, shR: 0.35 * s * amp, elR: 0.25 + 0.1 * amp, hipL: 0.4 * s * amp, knL: Math.max(0, -c) * 0.55 * amp, hipR: -0.4 * s * amp, knR: Math.max(0, c) * 0.55 * amp, lean: 0.05 * amp, bob: Math.abs(c) * 8 * amp }; };
export const runJ = (ph: number): Joints => { const s = Math.sin(ph * Math.PI * 2), c = Math.cos(ph * Math.PI * 2);
  return { shL: -0.9 * s, elL: 1.4, shR: 0.9 * s, elR: 1.4, hipL: 0.75 * s, knL: 0.25 + Math.max(0, -c) * 1.3, hipR: -0.75 * s, knR: 0.25 + Math.max(0, c) * 1.3, lean: 0.22, bob: Math.abs(s) * 16 }; };
export const mixJ = (a: Joints, b: Joints, u: number): Joints => { const o = {} as Record<string, number>;
  for (const k of Object.keys({ ...REST, lean: 0, head: 0, bob: 0 })) o[k] = ((a as Record<string, number>)[k] ?? 0) * (1 - u) + ((b as Record<string, number>)[k] ?? 0) * u; return o as Joints; };

export const drawBody = (p: Pen, s: Person, J: Joints, view: View) => {
  const g = p.g, cx = CX, side = view === "side", back = view === "back", J2 = { ...REST, ...J };
  const bob = J2.bob ?? 0, lean = J2.lean ?? 0, hip = HIP + bob, top = TOP + bob, hy = HY + bob, Jk = s.jacket;
  g.save(); g.lineCap = "round"; g.lineJoin = "round";
  // ---------- jambes ----------
  const legs = side ? [[J2.hipR, J2.knR, 0.82], [J2.hipL, J2.knL, 1]] : [[-J2.hipL, J2.knL, 1], [J2.hipR, J2.knR, 1]];
  legs.forEach(([a, kn, k], i) => {
    const x0 = side ? cx : cx + (i ? 24 : -24), dir = side ? 1 : i ? 1 : -1;
    const pts = side ? limb(x0, hip - 6, a, -kn, LEG, 1) : limb(x0, hip - 6, Math.abs(a) * 0.6, 0, LEG, a >= 0 ? (i ? 1 : -1) * Math.sign(a || 1) : -dir);
    if (!side) { const sx = i ? 1 : -1; pts[1] = [x0 + sx * Math.sin(Math.max(0, a * sx)) * LEG[0], hip - 6 + LEG[0] - 22 * kn]; pts[2] = [pts[1][0] + sx * Math.sin(Math.max(0, a * sx)) * LEG[1] * 0.6, pts[1][1] + LEG[1] - 40 * kn]; }
    tube(g, pts, 40, shade(s.pants, k)); const f = pts[2];
    g.beginPath(); g.ellipse(f[0] + (side ? 14 : (i ? 6 : -6)), f[1] + 10, side ? 44 : 36, 18, 0, 0, 7); g.fillStyle = shade(s.shoes, k); g.fill(); stroke(g);
  });
  // ---------- buste, bras, tête : pivotent autour des hanches (lean) ----------
  g.save(); g.translate(cx, hip - 6); g.rotate(lean); g.translate(-cx, -(hip - 6));
  const tw = side ? 112 : TW;
  const armPts = (sh: number[], a: number, el: number, dir: number) => limb(sh[0], sh[1], a, side ? el : -el, ARM, dir);
  const shL = side ? [cx - 6, top + 36] : [cx - tw / 2 + 14, top + 30], shR = side ? [cx + 6, top + 36] : [cx + tw / 2 - 14, top + 30];
  const aFar = side ? armPts(shL, J2.shL, J2.elL, 1) : null;
  if (aFar) { tube(g, aFar, 38, shade(Jk, 0.8)); const h = aFar[2]; ball(g, h[0], h[1], 29, "#dcdce2"); }
  if (s.hood && back) { g.beginPath(); g.ellipse(cx, top + 34, 98, 84, 0, 0, 7); g.fillStyle = shade(Jk, 0.8); g.fill(); stroke(g); }
  rrect(g, cx - tw / 2, top, cx + tw / 2, hip, 30);
  { const cg = g.createLinearGradient(cx - tw / 2, 0, cx + tw / 2, 0); cg.addColorStop(0, shade(Jk, 1.1)); cg.addColorStop(0.55, Jk); cg.addColorStop(1, shade(Jk, 0.78)); g.fillStyle = cg; g.fill();
    g.save(); g.clip(); g.globalAlpha = 0.45; g.strokeStyle = shade(Jk, 0.62); g.lineWidth = 3; for (let k2 = 0; k2 < 10; k2++) { const x = cx - tw / 2 + 8 + k2 * (tw - 16) / 9; g.beginPath(); g.moveTo(x, hip - 30); g.lineTo(x, hip); g.stroke(); } g.globalAlpha = 1; g.restore(); }
  rrect(g, cx - tw / 2, top, cx + tw / 2, hip, 30); stroke(g);
  if (!back && !side) { g.strokeStyle = shade(Jk, 0.6); g.lineWidth = 5; g.beginPath(); g.moveTo(cx + 4, top + 40); g.lineTo(cx + 4, hip - 10); g.stroke(); }
  if (side) { g.strokeStyle = shade(Jk, 0.6); g.lineWidth = 5; g.beginPath(); g.moveTo(cx + tw / 2 - 18, top + 40); g.lineTo(cx + tw / 2 - 18, hip - 10); g.stroke(); }
  const arms = side ? [armPts(shR, J2.shR, J2.elR, 1)] : [armPts(shL, J2.shL, J2.elL, -1), armPts(shR, J2.shR, J2.elR, 1)];
  for (const a of arms) { tube(g, a, 40, Jk); const h = a[2]; ball(g, h[0], h[1], 31, "#f2f2f4"); }
  // col + tête (inclinaison propre de la tête)
  g.save(); g.translate(cx, hy + R); g.rotate(J2.head ?? 0); g.translate(-cx, -(hy + R));
  rrect(g, cx - 22, hy + R - 18, cx + 22, top + 10, 4); g.fillStyle = "#f4f4f6"; g.fill(); stroke(g);
  const hg = g.createRadialGradient(cx - 10, hy - 6, 4, cx, hy, R); hg.addColorStop(0, "#ffffff"); hg.addColorStop(0.45, "#f6f6f7"); hg.addColorStop(0.85, "#dcdde2"); hg.addColorStop(1, "#b9bac3");
  g.beginPath(); g.arc(cx, hy, R, 0, 7); g.fillStyle = hg; g.fill();
  g.save(); g.beginPath(); g.arc(cx, hy, R, 0, 7); g.clip(); g.globalAlpha = 0.6; g.fillStyle = "#ffffff"; g.beginPath(); g.ellipse(cx - 8 + (side ? 24 : 0), hy + 2, R * 0.4, R * 0.32, 0, 0, 7); g.fill(); g.globalAlpha = 1; g.restore();
  // cheveux
  if (s.hair !== "bald") {
    g.save(); g.beginPath(); g.arc(cx, hy, R - 1, 0, 7); g.clip(); g.fillStyle = s.hairColor; g.beginPath();
    if (back) g.rect(cx - R, hy - R, 2 * R, R * 1.62);
    else if (side) { g.moveTo(cx - R, hy + 40); g.lineTo(cx - R, hy - R); g.lineTo(cx + R, hy - R); g.lineTo(cx + R, hy - 40); g.quadraticCurveTo(cx + R * 0.5, hy - 18, cx + R * 0.1, hy - 26); g.quadraticCurveTo(cx - R * 0.1, hy + 20, cx - R * 0.35, hy + 50); g.lineTo(cx - R, hy + 60); }
    else if (s.hair === "bob" || s.hair === "fringe") { const fr = hy - 4, sd = hy + (s.hair === "bob" ? 44 : 22);
      g.moveTo(cx - R, sd); g.lineTo(cx - R, hy - R); g.lineTo(cx + R, hy - R); g.lineTo(cx + R, sd); g.lineTo(cx + R * 0.86, sd); g.quadraticCurveTo(cx + R * 0.8, fr + 4, cx + R * 0.55, fr); g.lineTo(cx - R * 0.55, fr); g.quadraticCurveTo(cx - R * 0.8, fr + 4, cx - R * 0.86, sd); g.closePath(); }
    else { g.moveTo(cx - R, hy - 18); g.lineTo(cx - R, hy - R); g.lineTo(cx + R, hy - R); g.lineTo(cx + R, hy - 18); g.quadraticCurveTo(cx, hy - 62, cx - R, hy - 18); }
    g.fill(); g.strokeStyle = INK; g.lineWidth = OL; g.stroke(); g.restore();
  }
  g.beginPath(); g.arc(cx, hy, R, 0, 7); stroke(g);
  if (s.hair === "spiky") { g.fillStyle = s.hairColor; for (const dx of side ? [-60, -20, 18] : [-54, -12, 32]) { g.beginPath(); g.moveTo(cx + dx - 26, hy - R + 22); g.lineTo(cx + dx - (side ? 14 : 0), hy - R - 36); g.lineTo(cx + dx + 24, hy - R + 22); g.closePath(); g.fill(); stroke(g); } }
  if (s.hair === "bun") ball(g, cx - (side ? 70 : 0), hy - R - (side ? 4 : 16), 36, s.hairColor);
  if (s.hair === "ponytail") ball(g, cx - (side ? R - 4 : -(R - 8)), hy - 34, 32, s.hairColor);
  // visage (face : 2 yeux ; profil : 1 œil vers l'avant + bouche)
  if (!back) {
    const ey = hy + 30, eyes = side ? [cx + 58] : [cx - 38 + (s.look ?? 0) * 18, cx + 38 + (s.look ?? 0) * 18];
    if (s.expr === "tired" || s.expr === "worry" || s.expr === "fear") { g.strokeStyle = "rgba(112,84,150,0.8)"; g.lineWidth = 5; for (const x of eyes) { g.beginPath(); g.arc(x, ey + 8, 15, 0.25, Math.PI - 0.25); g.stroke(); } }
    g.fillStyle = INK; g.strokeStyle = INK; g.lineWidth = 5.5;
    for (const x of eyes) {
      if (s.blink || s.expr === "relief") { g.beginPath(); g.arc(x, ey + 4, 11, Math.PI + 0.35, -0.35); g.stroke(); continue; }
      const rx = s.expr === "fear" || s.expr === "shock" ? 7 : 9, ry = s.expr === "fear" ? 10 : 13;
      g.beginPath(); g.ellipse(x, ey, rx * (side ? 0.8 : 1), ry, 0, 0, 7); g.fill(); g.fillStyle = "#ffffff"; g.beginPath(); g.arc(x - 2.5 + (side ? 4 : 0), ey - 5, 2.4, 0, 7); g.fill(); g.fillStyle = INK;
      if (s.expr === "worry" || s.expr === "fear") { const b = s.expr === "fear" ? 9 : 0, sx = side ? 1 : x < cx ? -1 : 1; g.save(); g.lineWidth = 9; g.beginPath(); g.moveTo(x + sx * 16, ey - 24 + b); g.lineTo(x - sx * 8, ey - 34 + b); g.stroke(); g.restore(); }
    }
    const mx = side ? cx + 82 : cx + (s.look ?? 0) * 14, my = hy + 72;
    if (s.expr === "shock" || s.expr === "fear") { g.beginPath(); g.ellipse(mx, my, 7, 10, 0, 0, 7); g.fill(); }
    else if (s.expr === "relief") { g.beginPath(); g.arc(mx, my - 6, 10, 0.3, Math.PI - 0.3); g.stroke(); }
    else { g.beginPath(); g.moveTo(mx - 6, my); g.lineTo(mx + 6, my); g.stroke(); }
  }
  g.restore(); g.restore(); g.restore();
};
