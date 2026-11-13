// Les Longs (« Le Mur ») d'après la planche de référence de l'utilisateur (2026-11-13) : corps blanc-gris mat, contour encré,
// tête ovale lisse avec UNE fente horizontale sombre, cou fin, épaules étroites et tombantes, taille fine, jambes longues,
// bras encore plus longs (ils pendent jusqu'au sol), mains effilées à 3 pointes. Formes courbes, organiques (pas de bâtons),
// ombre douce d'un côté. Dessin dans l'espace 600 x 1000 (sol à y = 975), carte agrandie ~5x dans le monde (≈ 11 m).
import type { Pen } from "../bridge/toon";

const INK = "#15141b", OL = 5;
const BODY = "#c9ccd8", LIT = "#e8eaf1", DARK = "#9094a8";
export type LongPose = "stand" | "lean" | "crouch" | "walk" | "peek";
/** « peek » : vu de face, tête et épaules au-dessus du mur, bras qui pendent le long de la paroi ; le corps s'arrête net à PEEK_CUT (= arête du mur) */
export const PEEK_CUT = 385;
export type LongSpec = { pose: LongPose; unfold?: number; turn?: number; step?: number };

type P2 = [number, number];
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const lp = (a: P2, b: P2, t: number): P2 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
const smoothT = (x: number) => { const u = Math.max(0, Math.min(1, x)); return u * u * (3 - 2 * u); };
/** Catmull-Rom à travers les points de contrôle (courbes souples) */
const spline = (pts: P2[], t: number): P2 => {
  const n = pts.length - 1, s = Math.min(n - 1e-6, t * n), i = Math.floor(s), k = s - i;
  const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(n, i + 2)];
  const c = (a: number, b: number, d: number, e: number) => 0.5 * (2 * b + (-a + d) * k + (2 * a - 5 * b + 4 * d - e) * k * k + (-a + 3 * b - 3 * d + e) * k * k * k);
  return [c(p0[0], p1[0], p2[0], p3[0]), c(p0[1], p1[1], p2[1], p3[1])];
};
/** membre ou torse : courbe lisse dont la largeur suit ws (une largeur par point de contrôle), bouts arrondis, contour encré */
const limb = (g: CanvasRenderingContext2D, pts: P2[], ws: number[], fill: string | CanvasGradient, tip = false) => {
  const n = 28, L: P2[] = [], Rr: P2[] = [];
  const wAt = (t: number) => { const s = Math.min(ws.length - 1 - 1e-6, t * (ws.length - 1)), i = Math.floor(s); return lerp(ws[i], ws[i + 1], s - i); };
  for (let j = 0; j <= n; j++) {
    const t = j / n, p = spline(pts, t), q = spline(pts, Math.min(1, t + 0.01)), r = spline(pts, Math.max(0, t - 0.01));
    const dx = q[0] - r[0], dy = q[1] - r[1], d = Math.hypot(dx, dy) || 1, w = wAt(t) / 2;
    L.push([p[0] - dy / d * w, p[1] + dx / d * w]); Rr.push([p[0] + dy / d * w, p[1] - dx / d * w]);
  }
  g.beginPath(); L.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])));
  const e = spline(pts, 1), e2 = spline(pts, 0.97), f = tip ? 2.2 : 0.6;
  g.quadraticCurveTo(e[0] + (e[0] - e2[0]) * f, e[1] + (e[1] - e2[1]) * f, Rr[n][0], Rr[n][1]);
  for (let i = n; i >= 0; i--) g.lineTo(Rr[i][0], Rr[i][1]);
  const s0 = spline(pts, 0), s1 = spline(pts, 0.03); g.quadraticCurveTo(s0[0] - (s1[0] - s0[0]) * 0.6, s0[1] - (s1[1] - s0[1]) * 0.6, L[0][0], L[0][1]);
  g.closePath(); g.fillStyle = fill; g.fill(); g.lineWidth = OL; g.strokeStyle = INK; g.lineJoin = "round"; g.stroke();
};
const hand = (g: CanvasRenderingContext2D, x: number, y: number, ang: number, len: number, col: string) => {
  for (const [da, k] of [[-0.32, 0.75], [0, 1], [0.34, 0.65]] as [number, number][]) {
    const a = ang + da;
    limb(g, [[x, y], [x + Math.cos(a) * len * k * 0.55, y + Math.sin(a) * len * k * 0.55], [x + Math.cos(a + da * 0.4) * len * k, y + Math.sin(a + da * 0.4) * len * k]], [12, 8, 2], col, true);
  }
};
const head = (g: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, tilt: number, turn: number) => {
  g.save(); g.translate(x, y); g.rotate(tilt);
  const gr = g.createRadialGradient(-rx * 0.35, -ry * 0.4, 2, 0, 0, Math.max(rx, ry) * 1.2); gr.addColorStop(0, LIT); gr.addColorStop(0.7, BODY); gr.addColorStop(1, DARK);
  g.beginPath(); g.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2); g.fillStyle = gr; g.fill(); g.lineWidth = OL; g.strokeStyle = INK; g.stroke();
  const sx = turn * rx * 0.45, sw = rx * (0.6 - 0.25 * Math.abs(turn));       // la fente se décale quand la tête tourne
  g.lineCap = "round"; g.strokeStyle = "#0d0c12"; g.lineWidth = 6.5; g.beginPath(); g.moveTo(sx - sw, ry * 0.08); g.lineTo(sx + sw, ry * 0.08); g.stroke();
  g.restore();
};
const shadeFill = (g: CanvasRenderingContext2D, x0: number, x1: number) => { const k = g.createLinearGradient(x0, 0, x1, 0); k.addColorStop(0, LIT); k.addColorStop(0.5, BODY); k.addColorStop(1, DARK); return k; };

type Sk = { head: P2; neck: P2; chest: P2; waist: P2; hip: P2; shL: P2; elL: P2; haL: P2; shR: P2; elR: P2; haR: P2; knL: P2; ftL: P2; knR: P2; ftR: P2 };
const STAND: Sk = { head: [300, 150], neck: [300, 215], chest: [302, 300], waist: [300, 420], hip: [300, 520], shL: [266, 262], elL: [236, 560], haL: [226, 905], shR: [334, 262], elR: [366, 560], haR: [376, 905],
  knL: [282, 745], ftL: [278, 972], knR: [318, 745], ftR: [324, 972] };
const CROUCH: Sk = { head: [338, 640], neck: [320, 680], chest: [305, 730], waist: [292, 800], hip: [290, 860], shL: [282, 712], elL: [205, 840], haL: [160, 972], shR: [322, 712], elR: [405, 840], haR: [440, 972],
  knL: [240, 720], ftL: [235, 972], knR: [350, 715], ftR: [360, 972] };
const LEAN: Sk = { head: [478, 238], neck: [440, 262], chest: [390, 300], waist: [310, 400], hip: [262, 540], shL: [418, 272], elL: [478, 520], haL: [470, 840], shR: [440, 286], elR: [530, 470], haR: [565, 740],
  knL: [246, 760], ftL: [232, 972], knR: [274, 760], ftR: [288, 972] };
const mixSk = (a: Sk, b: Sk, t: number): Sk => Object.fromEntries(Object.keys(a).map((k) => [k, lp(a[k as keyof Sk], b[k as keyof Sk], t)])) as Sk;

export const drawLong = (p: Pen, s: LongSpec) => {
  const g = p.g, turn = s.turn ?? 0; g.save(); g.lineCap = "round"; g.lineJoin = "round";
  if (s.pose === "peek") {
    const C = PEEK_CUT;
    limb(g, [[352, 300], [392, C - 6], [404, 560], [396, 760], [388, 830]], [34, 28, 22, 18, 13], DARK); hand(g, 388, 830, 1.62, 46, DARK);
    g.save(); g.beginPath(); g.rect(0, 0, 600, C); g.clip();
    limb(g, [[300, 232], [303, 300], [300, 380], [300, 470]], [40, 100, 70, 70], shadeFill(g, 240, 360));
    g.restore();
    limb(g, [[300, 232], [300, 190]], [20, 16], BODY); head(g, 300, 160, 40, 54, 0.12, turn);
    limb(g, [[248, 300], [206, C - 6], [196, 560], [204, 760], [212, 840]], [36, 28, 23, 19, 14], shadeFill(g, 170, 250)); hand(g, 212, 840, 1.52, 48, BODY);
    g.restore(); return;
  }
  let k: Sk = STAND;
  if (s.pose === "crouch" || s.unfold !== undefined) k = mixSk(CROUCH, STAND, smoothT(s.unfold ?? 0));
  if (s.pose === "lean") k = LEAN;
  if (s.pose === "walk") { const sw = Math.sin((s.step ?? 0) * Math.PI * 2);
    k = { ...STAND, knL: [282 + 24 * sw, 745], ftL: [278 + 50 * sw, 972], knR: [318 - 24 * sw, 745], ftR: [324 - 50 * sw, 972], elL: [236 - 16 * sw, 560], haL: [226 - 44 * sw, 905], elR: [366 + 16 * sw, 560], haR: [376 + 44 * sw, 905] }; }
  const bend = (a: P2, b: P2, out: number): P2 => { const m = lp(a, b, 0.5), dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1; return [m[0] - dy / d * out, m[1] + dx / d * out]; };
  const hR: P2 = [k.hip[0] + 16, k.hip[1]], hL: P2 = [k.hip[0] - 16, k.hip[1]];
  // bras et jambe du fond (plus sombres)
  limb(g, [k.shR, bend(k.shR, k.elR, -10), k.elR, bend(k.elR, k.haR, -14), k.haR], [34, 26, 22, 18, 13], DARK);
  hand(g, k.haR[0], k.haR[1], Math.atan2(k.haR[1] - k.elR[1], k.haR[0] - k.elR[0]), 46, DARK);
  limb(g, [hR, bend(hR, k.knR, -8), k.knR, k.ftR], [52, 44, 32, 22], DARK, true);
  // jambe avant
  limb(g, [hL, bend(hL, k.knL, 8), k.knL, k.ftL], [54, 46, 33, 22], BODY, true);
  // torse organique : nuque -> poitrine -> taille -> bassin
  const xs = [k.neck[0], k.chest[0], k.waist[0], k.hip[0]];
  limb(g, [k.neck, k.chest, k.waist, k.hip], [40, 96, 62, 84], shadeFill(g, Math.min(...xs) - 50, Math.max(...xs) + 50));
  // cou + tête
  limb(g, [k.neck, lp(k.neck, k.head, 0.6)], [20, 16], BODY);
  const tilt = Math.atan2(k.head[1] - k.neck[1], k.head[0] - k.neck[0]) + Math.PI / 2;
  head(g, k.head[0], k.head[1], 40, 54, s.pose === "lean" ? tilt * 0.55 : tilt * 0.3, turn);
  // bras avant, légèrement arqué vers l'extérieur
  limb(g, [k.shL, bend(k.shL, k.elL, 10), k.elL, bend(k.elL, k.haL, 14), k.haL], [36, 28, 23, 19, 14], shadeFill(g, k.elL[0] - 40, k.elL[0] + 40));
  hand(g, k.haL[0], k.haL[1], Math.atan2(k.haL[1] - k.elL[1], k.haL[0] - k.elL[0]), 48, BODY);
  g.restore();
};
