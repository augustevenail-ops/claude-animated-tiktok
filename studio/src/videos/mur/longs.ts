// Les Longs (« Le Mur ») d'après la planche de référence de l'utilisateur (2026-11-13) : corps blanc-gris mat, contour encré,
// tête ovale lisse avec UNE fente horizontale sombre, cou fin, épaules étroites et tombantes, taille fine, jambes longues,
// bras encore plus longs (ils pendent jusqu'au sol), mains effilées à 3 pointes. Formes courbes, organiques (pas de bâtons),
// ombre douce d'un côté. Dessin dans l'espace 600 x 1000 (sol à y = 975), carte agrandie ~5x dans le monde (≈ 11 m).
import type { Pen } from "../bridge/toon";

const INK = "#3a3d58", OL = 2.4;
// style v2 : cel-shading 2 tons (clair blanc-lavande / ombre bleu-violet), contour fin, aucun trait intérieur
const BODY = "#cfd1f2", LIT = "#f8f9ff", DARK = "#9396d8";
export type LongPose = "stand" | "lean" | "crouch" | "walk" | "peek";
/** « peek » : vu de face, tête et épaules au-dessus du mur, bras qui pendent le long de la paroi ; le corps s'arrête net à PEEK_CUT (= arête du mur) */
export const PEEK_CUT = 385;
export type LongSpec = { pose: LongPose; unfold?: number; turn?: number; step?: number;
  /** bouche : 0 = trait, 1 = grande fente en zigzag ouverte ; tilt = tête penchée (rad) ; tap = phase des doigts qui tapotent (pose peek) ;
   *  shadow = silhouette noire seule (ombre projetée sur les murs) */ mouth?: number; tilt?: number; tap?: number; shadow?: boolean };
let SHADOW = false;

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
/** membre ou torse : chemin d'une courbe lisse dont la largeur suit ws (une largeur par point de contrôle), bouts arrondis */
const limbPath = (pts: P2[], ws: number[], tip = false) => {
  const n = 28, L: P2[] = [], Rr: P2[] = [], path = new Path2D();
  const wAt = (t: number) => { const s = Math.min(ws.length - 1 - 1e-6, t * (ws.length - 1)), i = Math.floor(s); return lerp(ws[i], ws[i + 1], s - i); };
  for (let j = 0; j <= n; j++) {
    const t = j / n, p = spline(pts, t), q = spline(pts, Math.min(1, t + 0.01)), r = spline(pts, Math.max(0, t - 0.01));
    const dx = q[0] - r[0], dy = q[1] - r[1], d = Math.hypot(dx, dy) || 1, w = wAt(t) / 2;
    L.push([p[0] - dy / d * w, p[1] + dx / d * w]); Rr.push([p[0] + dy / d * w, p[1] - dx / d * w]);
  }
  L.forEach((p, i) => (i ? path.lineTo(p[0], p[1]) : path.moveTo(p[0], p[1])));
  const e = spline(pts, 1), e2 = spline(pts, 0.97), f = tip ? 2.2 : 0.6;
  path.quadraticCurveTo(e[0] + (e[0] - e2[0]) * f, e[1] + (e[1] - e2[1]) * f, Rr[n][0], Rr[n][1]);
  for (let i = n; i >= 0; i--) path.lineTo(Rr[i][0], Rr[i][1]);
  const s0 = spline(pts, 0), s1 = spline(pts, 0.03); path.quadraticCurveTo(s0[0] - (s1[0] - s0[0]) * 0.6, s0[1] - (s1[1] - s0[1]) * 0.6, L[0][0], L[0][1]);
  path.closePath(); return path;
};
/** silhouette d'un seul tenant : toutes les formes d'abord en encre élargie (contour extérieur unique), puis remplies sans trait
 *  -> aucune ligne entre torse, bras et jambes (consigne utilisateur du 2026-11-13). Les formes « back » sont teintées plus sombres. */
type Shape = { path: Path2D; back?: boolean };
const paint = (g: CanvasRenderingContext2D, shapes: Shape[], _cx: number, band = 26) => {
  // UNE seule silhouette (consigne utilisateur) : toutes les formes fusionnées en un chemin, un seul contour extérieur,
  // ombrage d'un seul tenant : lumière blanche à gauche, lavande, grande ombre bleu-violet à droite ; halo lumineux.
  const U = new Path2D(); for (const sh of shapes) U.addPath(sh.path);
  if (SHADOW) { g.fillStyle = "#000"; g.fill(U); return; }
  const sh = (dx: number) => { const q = new Path2D(); q.addPath(U, new DOMMatrix().translate(dx, 0)); return q; };
  g.save(); g.lineJoin = "round"; g.lineCap = "round";
  g.shadowColor = "rgba(225,230,255,0.55)"; g.shadowBlur = 26; g.fillStyle = INK; g.fill(U);
  g.shadowBlur = 0; g.lineWidth = OL * 2; g.strokeStyle = INK; g.stroke(U);
  g.save(); g.clip(U); g.fillStyle = DARK; g.fill(U);
  g.save(); g.clip(sh(-band * 1.6)); g.fillStyle = LIT; g.fill(U); g.fillStyle = BODY; g.fill(sh(band * 0.9)); g.restore();
  // porcelaine : reflets brillants nets + fines fissures noires (poupée cassée)
  g.fillStyle = "rgba(255,255,255,0.45)"; for (const [x, y, rx, ry] of CRACK_GLOSS) { g.beginPath(); g.ellipse(x, y, rx, ry, -0.35, 0, 7); g.fill(); }
  g.strokeStyle = "#1a1828"; g.lineWidth = 1.6; g.lineJoin = "miter";
  for (const c of CRACKS) { g.beginPath(); c.forEach((q, i) => (i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]))); g.stroke(); }
  g.restore(); g.restore();
};
const CRACK_GLOSS: number[][] = [[262, 300, 9, 26], [212, 640, 5, 20], [268, 610, 6, 22]];
const CRACKS: P2[][] = [[[318, 286], [330, 314], [322, 330], [338, 362], [332, 380]], [[330, 314], [348, 322]], [[282, 470], [270, 492], [280, 506], [268, 530]],
  [[364, 600], [378, 622], [372, 640]], [[300, 700], [312, 724], [304, 742], [318, 770]], [[200, 420], [192, 446], [204, 462]]];
const hand = (x: number, y: number, ang: number, len: number, back = false): Shape[] =>
  ([[-0.3, 0.7], [0, 1], [0.3, 0.6]] as [number, number][]).map(([da, k]) => { const a = ang + da;
    return { back, path: limbPath([[x - Math.cos(ang) * 6, y - Math.sin(ang) * 6], [x + Math.cos(a) * len * k * 0.55, y + Math.sin(a) * len * k * 0.55], [x + Math.cos(a + da * 0.4) * len * k, y + Math.sin(a + da * 0.4) * len * k]], [24, 15, 4], true) }; });
const headShape = (x: number, y: number, rx: number, ry: number, tilt: number): Shape => { const p = new Path2D(); p.ellipse(x, y, rx, ry, tilt, 0, Math.PI * 2); return { path: p }; };
const head = (g: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, tilt: number, turn: number, mouth = 0) => {
  g.save(); g.translate(x, y); g.rotate(tilt);
  g.beginPath(); g.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2); g.fillStyle = SHADOW ? "#000" : BODY; g.fill();
  if (SHADOW) { g.restore(); return; }
  g.save(); g.clip(); g.fillStyle = DARK; g.beginPath(); g.ellipse(rx * 0.45, ry * 0.2, rx * 0.75, ry, 0, 0, Math.PI * 2); g.fill(); g.restore();
  g.lineWidth = OL; g.strokeStyle = INK; g.beginPath(); g.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2); g.stroke();
  if (SHADOW) { g.restore(); return; }
  g.fillStyle = "rgba(255,255,255,0.9)"; g.beginPath(); g.ellipse(-rx * 0.38, -ry * 0.42, rx * 0.16, ry * 0.1, -0.5, 0, 7); g.fill();   // reflet de porcelaine
  g.strokeStyle = "#1a1828"; g.lineWidth = 1.6; g.beginPath(); g.moveTo(rx * 0.2, -ry * 0.98); g.lineTo(rx * 0.28, -ry * 0.7); g.lineTo(rx * 0.16, -ry * 0.55); g.lineTo(rx * 0.3, -ry * 0.36); g.stroke();
  { const op = Math.max(0, Math.min(1, mouth)), sx = turn * rx * 0.45, w = rx * (0.6 - 0.2 * Math.abs(turn)) * (1 + 0.55 * op), y0 = ry * 0.36, n = 9;   // zigzag ; s'ouvre en fente noire trop large
    let seed = 11; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    const top: P2[] = [], bot: P2[] = [];
    for (let i = 0; i <= n; i++) { const x = sx - w + (2 * w * i) / n + (i && i < n ? (rnd() - 0.5) * w * 0.12 : 0), z = (i % 2 ? 1 : -1) * ry * (0.03 + 0.09 * rnd());
      top.push([x, y0 + z - op * ry * 0.22 * Math.sin(Math.PI * i / n)]); bot.push([x, y0 - z * 0.8 + op * ry * 0.3 * Math.sin(Math.PI * i / n)]); }
    g.beginPath(); top.forEach((q, i) => (i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1])));
    if (op > 0.02) { for (let i = n; i >= 0; i--) g.lineTo(bot[i][0], bot[i][1]); g.closePath(); g.fillStyle = "#07060b"; g.fill(); }
    g.lineJoin = "miter"; g.lineCap = "butt"; g.lineWidth = Math.max(2, rx * 0.07); g.strokeStyle = "#0b0a10"; g.stroke(); }
  g.restore();
};
type Sk = { head: P2; neck: P2; chest: P2; waist: P2; hip: P2; shL: P2; elL: P2; haL: P2; shR: P2; elR: P2; haR: P2; knL: P2; ftL: P2; knR: P2; ftR: P2 };
const STAND: Sk = { head: [300, 100], neck: [300, 210], chest: [302, 300], waist: [300, 410], hip: [300, 510], shL: [222, 268], elL: [190, 560], haL: [196, 880], shR: [378, 268], elR: [410, 560], haR: [404, 880],
  knL: [262, 745], ftL: [262, 972], knR: [338, 745], ftR: [342, 972] };
const CROUCH: Sk = { head: [338, 640], neck: [320, 680], chest: [305, 730], waist: [292, 800], hip: [290, 860], shL: [282, 712], elL: [205, 840], haL: [160, 972], shR: [322, 712], elR: [405, 840], haR: [440, 972],
  knL: [240, 720], ftL: [235, 972], knR: [350, 715], ftR: [360, 972] };
const LEAN: Sk = { head: [478, 238], neck: [440, 262], chest: [390, 300], waist: [310, 400], hip: [262, 540], shL: [418, 272], elL: [478, 520], haL: [470, 840], shR: [440, 286], elR: [530, 470], haR: [565, 740],
  knL: [246, 760], ftL: [232, 972], knR: [274, 760], ftR: [288, 972] };
const mixSk = (a: Sk, b: Sk, t: number): Sk => Object.fromEntries(Object.keys(a).map((k) => [k, lp(a[k as keyof Sk], b[k as keyof Sk], t)])) as Sk;

export const drawLong = (p: Pen, s: LongSpec) => {
  const g = p.g, turn = s.turn ?? 0, mo = s.mouth ?? 0, xt = s.tilt ?? 0; g.save(); SHADOW = !!s.shadow;
  const bend = (a: P2, b: P2, out: number): P2 => { const m = lp(a, b, 0.5), dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1; return [m[0] - dy / d * out, m[1] + dx / d * out]; };
  if (s.pose === "peek") {                                            // vu de face par-dessus le mur : le corps s'arrête net à l'arête
    const C = PEEK_CUT;                                               // une seule silhouette : torse coupé net à l'arête, 2 bras qui retombent le long du mur
    const tp = s.tap ?? 0;
    const fingers: Shape[] = [0, 1, 2, 3].map((i) => { const x = 372 + i * 22, lift = Math.max(0, Math.sin(tp * Math.PI * 2 - i * 0.9)) * 26;   // doigts posés sur l'arête, qui tapotent
      return { path: limbPath([[x, C - 22], [x + 4, C - 4 - lift * 0.4], [x + 6, C + 44 - lift]], [20, 16, 6], true) }; });
    paint(g, [
      { path: limbPath([[300, 175], [300, 225], [302, 262], [302, 320], [300, C]], [20, 36, 150, 190, 200]) }, headShape(300, 140, 38, 50, 0.12 + xt),
      { path: limbPath([[236, 282], [196, C - 10], [190, 560], [198, 760], [206, 850]], [74, 60, 48, 38, 30]) }, ...hand(206, 850, 1.52, 80),
      { path: limbPath([[364, 282], [400, 300], [410, C - 26], [398, C - 18]], [70, 60, 50, 44]) }, ...fingers,
    ], 300);
    head(g, 300, 140, 38, 50, 0.12 + xt, turn, mo); g.restore(); SHADOW = false; return;
  }
  let k: Sk = STAND;
  if (s.pose === "crouch" || s.unfold !== undefined) k = mixSk(CROUCH, STAND, smoothT(s.unfold ?? 0));
  if (s.pose === "lean") k = LEAN;
  if (s.pose === "walk") { const sw = Math.sin((s.step ?? 0) * Math.PI * 2);
    k = { ...STAND, knL: [282 + 24 * sw, 745], ftL: [278 + 50 * sw, 972], knR: [318 - 24 * sw, 745], ftR: [324 - 50 * sw, 972], elL: [236 - 16 * sw, 560], haL: [226 - 44 * sw, 905], elR: [366 + 16 * sw, 560], haR: [376 + 44 * sw, 905] }; }
  const hR: P2 = [k.hip[0] + 44, k.hip[1] - 10], hL: P2 = [k.hip[0] - 44, k.hip[1] - 10];
  const tilt = Math.atan2(k.head[1] - k.neck[1], k.head[0] - k.neck[0]) + Math.PI / 2, ht = s.pose === "lean" ? tilt * 0.55 : tilt * 0.3;
  // membres du fond (plus sombres), puis le corps d'un seul tenant : cou + torse + bassin + jambe avant + bras avant + tête
  paint(g, [
    { back: true, path: limbPath([k.shR, bend(k.shR, k.elR, -10), k.elR, bend(k.elR, k.haR, -14), k.haR], [70, 54, 44, 36, 28]) }, ...hand(k.haR[0], k.haR[1], Math.atan2(k.haR[1] - k.elR[1], k.haR[0] - k.elR[0]), 80, true),
    { back: true, path: limbPath([hR, bend(hR, k.knR, -8), k.knR, k.ftR], [112, 86, 52, 30], true) },

    { path: limbPath([lp(k.neck, k.head, 0.7), k.neck, lp(k.neck, k.chest, 0.45), k.chest, lp(k.chest, k.waist, 0.5), k.waist, k.hip, [k.hip[0], k.hip[1] + 40]], [20, 34, 130, 196, 176, 150, 190, 150]) },
    { path: limbPath([hL, bend(hL, k.knL, 8), k.knL, k.ftL], [122, 92, 56, 30], true) },
    { path: limbPath([k.shL, bend(k.shL, k.elL, 10), k.elL, bend(k.elL, k.haL, 14), k.haL], [78, 60, 48, 40, 30]) }, ...hand(k.haL[0], k.haL[1], Math.atan2(k.haL[1] - k.elL[1], k.haL[0] - k.elL[0]), 84),
    headShape(k.head[0], k.head[1], 38, 50, ht + xt),
  ], k.chest[0]);
  head(g, k.head[0], k.head[1], 38, 50, ht + xt, turn, mo);
  g.restore(); SHADOW = false;
};
