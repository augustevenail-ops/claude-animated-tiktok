// « L'appel » épisode 2 (« La voix derrière la porte ») : 40 plans calés sur la voix réelle (words.json, voix décalée de VOICE_AT), lieux, caméras, flou, état des fenêtres.
// Lieux (un seul monde) : la tour en L (façade A : plan z = 0 face +z ; aile B : plan x = 50 face -x, z ∈ [0 ; 100] ; 40 colonnes x 75 étages
// chacune = 6 000 fenêtres), la cour devant, la rue morte (z = 130), ton appartement derrière ta fenêtre (A, colonne 20, étage 24), le couloir et la cage
// d'escalier du sous-sol (sous terre, y = -200, invisibles de l'extérieur).
export const FPS = 30;
export type V3 = [number, number, number];
export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => { const u = clamp01(x); return u * u * (3 - 2 * u); };
export const glide = (u: number) => { const x = clamp01(u); return x * x * x * (x * (6 * x - 15) + 10); };
export const lerp3 = (a: V3, b: V3, u: number): V3 => [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u];
export const hash = (i: number, s = 0) => { const v = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return v - Math.floor(v); };

// ---------------- tour ----------------
export const COLS = 40, FLOORS = 75, COLW = 2.5, FLH = 3.2, HALFW = 50, B_X = 50, TOWER_H = FLOORS * FLH;
export const colX = (c: number) => -HALFW + COLW * (c + 0.5);
export const MY_COL = 20, MY_FLOOR = 24;
export const Y0 = MY_FLOOR * FLH;                                   // sol de ton appartement (76,8 m)
export const WIN: V3 = [colX(MY_COL), Y0 + 1.42, 0];                 // centre de ta fenêtre
export const WIN_W = 1.4, WIN_H = 1.75;
// appartement : x ∈ [-0,85 ; 3,35], z ∈ [-4,5 ; 0]
export const YOU: V3 = [2.25, Y0 + 0.42, -2.6];                      // assis sur le lit (origine de carte = ligne de semelle)
export const NOE: V3 = [1.7, Y0 + 0.42, -2.65];
export const YOU_WIN: V3 = [1.25, Y0, -0.75];                       // debout à la fenêtre
export const SPK_IN: V3 = [1.25, Y0 + 2.15, -4.42];                 // haut-parleur du mur (au-dessus de la porte)
export const SPK_OUT: V3 = [5.6, Y0 + 4.6, 0.55];                   // haut-parleur à pavillon sur la façade
// couloir (sous terre)
export const CY = -200;
export const DOOR_Z = [-4, -7, -10, -13, -16, -19, -22, -25];       // portes des deux côtés

// ---------------- temps (voix réelle) ----------------
import RAW from "./words.json";
export const VOICE_AT = 0.35;
export type W = { w: string; s: number; e: number; q?: number; role?: string };
export const WORDS: W[] = (RAW as W[]).map((w) => ({ ...w, s: w.s + VOICE_AT, e: w.e + VOICE_AT }));
/** premier mot de chaque plan (indice dans words.json) */
const ANCH = [0, 1, 5, 13, 20, 23, 28, 29, 32, 35, 38, 45, 50, 53, 61, 65, 67, 69, 75, 79, 81, 86, 93, 104, 110, 115, 119, 124, 128, 139, 143, 152, 158, 168, 175, 184, 191, 204, 205, 211];
const starts = ANCH.map((wi, i) => (i === 0 ? 0 : WORDS[wi].s - 2 / FPS));
export const END_T = WORDS[WORDS.length - 1].e + 1.6;
export type ShotDef = { id: number; a: number; b: number };
export const SHOTS: ShotDef[] = starts.map((a, i) => ({ id: i + 1, a: Math.round(a * FPS), b: Math.round((i + 1 < starts.length ? starts[i + 1] : END_T) * FPS) }));
export const TOTAL = SHOTS[SHOTS.length - 1].b;
export const shotAt = (f: number) => SHOTS.find((s) => f >= s.a && f < s.b) ?? SHOTS[SHOTS.length - 1];
export const tW = (i: number) => WORDS[i].s;
export const uOf = (id: number, f: number) => { const s = SHOTS[id - 1]; return clamp01((f - s.a) / Math.max(1, s.b - s.a)); };

// ---------------- fenêtres de la tour ----------------
// rappel (avant « Mais cette nuit ») : l'appel d'hier fini, tout est vert, quelques rouges ; puis la nuit (noir, quelques lueurs) ;
// « des portes s'ouvrent » : des fenêtres s'allument (voisins qui ouvrent) ; « s'éteignent, une à une » : elles s'éteignent dans le désordre.
const T_NIGHT = tW(35), T_OPEN = tW(170), T_OFF0 = tW(186), T_OFF1 = tW(204);
/** 0 = noire, 1 = verte, 2 = rouge, 3 = lueur chaude faible, 4 = lumière vive (porte ouverte) */
export const winState = (face: number, c: number, fl: number, t: number) => {
  if (face === 0 && c === MY_COL && fl === MY_FLOOR) return 0;
  if (t < T_NIGHT) return hash(c * 97 + fl * 13, face + 3) < 0.035 ? 2 : 1;
  const h = hash(c * 17 + fl * 7, face + 11);
  if (h < 0.32) { const on = T_OPEN + hash(c * 5 + fl, face + 2) * 2.6, off = T_OFF0 + hash(c * 3 + fl * 11, face + 5) * (T_OFF1 - T_OFF0); if (t > on && t < off) return 4; }
  return hash(c * 131 + fl, face + 7) < 0.05 ? 3 : 0;
};
/** lumière verte dans l'appartement (rappel de l'appel d'hier) */
export const greenAt = (id: number) => (id === 7 ? 1 : [1, 3, 4, 5].includes(id) ? 0.8 : 0);
export const KNOCKS = [tW(66) - 0.25, tW(66) + 0.1, tW(68) - 0.15];

// ---------------- caméras ----------------
export type Cam = { pos: V3; look: V3; fov: number; roll: number; near: number; far: number };
const P = (pos: V3, look: V3, fov = 40, roll = 0, near = 0.05, far = 400): Cam => ({ pos, look, fov, roll, near, far });
const X = (pos: V3, look: V3, fov = 45, roll = 0): Cam => P(pos, look, fov, roll, 0.6, 7000);
const C = (dz: number): V3 => [0, CY + 1.55, dz];
const yH = (p: V3, h: number): V3 => [p[0], p[1] + h, p[2]];
const ZD = -4.5;                                                       // mur de la porte de la chambre
export const DOOR_IN: V3 = [2.8, Y0, ZD];                               // porte de ta chambre (vue de l'intérieur)
export const HANDLE: V3 = [2.45, Y0 + 1.0, ZD + 0.1];
export const MY_DOOR_Z = -13;                                           // ta porte, côté couloir (x > 0)
const CAMS: Record<number, (u: number, f: number) => Cam> = {
  1: (u) => P(lerp3([YOU[0] + 0.05, YOU[1] + 0.82, YOU[2] + 1.35], [YOU[0] + 0.03, YOU[1] + 0.84, YOU[2] + 1.1], smooth(u)), yH(YOU, 0.84), 36),
  2: (u) => X(lerp3([-95, 175, 640], [-38, 118, 320], glide(u)), lerp3([0, 112, 30], [0, 92, 0], smooth(u)), 46),
  3: (u) => P(lerp3([NOE[0] - 0.03, NOE[1] + 0.58, NOE[2] + 1.05], [NOE[0] - 0.01, NOE[1] + 0.58, NOE[2] + 0.82], smooth(u)), yH(NOE, 0.6), 28),
  4: (u) => P(lerp3([1.0, Y0 + 1.5, 3.2], [1.1, Y0 + 1.5, 2.3], smooth(u)), yH(YOU_WIN, 1.42), 40, 0, 0.1, 3000),
  5: (u) => P(lerp3([2.1, Y0 + 1.55, -1.75], [2.0, Y0 + 1.55, -1.5], smooth(u)), yH(YOU_WIN, 1.42), 34),
  6: (u) => X(lerp3([7.9, Y0 + 4.1, 4.2], [7.2, Y0 + 4.3, 3.0], smooth(u)), SPK_OUT, 38),
  7: (u) => X(lerp3([5, Y0 + 4, 18], [2.6, Y0 + 2.2, 7], glide(u)), WIN, 34),
  8: (u) => X(lerp3([8, 1.3, 32], [7, 1.5, 29], smooth(u)), [1, 4, 14], 36),
  9: (u) => P(lerp3(C(-1.5), C(-5.5), u), [0, CY + 1.45, -30], 52),
  10: (u) => X(lerp3([-60, 6, 150], [-34, 26, 118], glide(u)), lerp3([0, 50, 0], [0, 150, 0], smooth(u)), 56),
  11: (u) => P(lerp3([1.65, Y0 + 1.6, -2.4], [1.45, Y0 + 1.8, -3.1], smooth(u)), SPK_IN, 40),
  12: (u) => P(lerp3([0.15, Y0 + 1.65, -0.85], [0.3, Y0 + 1.6, -1.15], smooth(u)), [2.0, Y0 + 0.85, -2.9], 50),
  13: (u) => P(lerp3([1.62, Y0 + 1.42, -3.55], [1.65, Y0 + 1.4, -3.9], smooth(u)), [1.7, Y0 + 1.38, ZD], 36),
  14: (u) => P(lerp3([1.5, Y0 + 1.25, -1.3], [2.2, Y0 + 1.15, -2.6], glide(u)), [2.8, Y0 + 0.95, ZD], 46),
  15: (u) => X(lerp3([12, Y0 - 8, 34], [7, Y0 + 1, 22], glide(u)), lerp3([2, Y0 - 2, 0], WIN, smooth(u)), 42),
  16: (u) => P(lerp3([2.7, Y0 + 1.3, -2.75], [2.75, Y0 + 1.25, -3.05], smooth(u)), [2.8, Y0 + 1.05, ZD], 52),
  17: (u) => P(lerp3([2.95, Y0 + 1.65, -4.15], [2.85, Y0 + 1.6, -3.95], smooth(u)), [1.9, Y0 + 0.85, -2.3], 54),
  18: (u) => P(lerp3([2.8, Y0 + 0.36, -3.25], [2.8, Y0 + 0.32, -3.85], glide(u)), [2.8, Y0 + 0.7, ZD], 52),
  19: (u) => P(lerp3([-0.55, CY + 1.6, -8.4], [-0.3, CY + 1.55, -10.4], smooth(u)), [1.2, CY + 1.25, -13], 42),
  20: (u) => P(lerp3([NOE[0] - 0.12, NOE[1] + 0.56, NOE[2] + 1.25], [NOE[0] - 0.1, NOE[1] + 0.56, NOE[2] + 1.05], u), yH(NOE, 0.6), 32),
  21: (u) => P(lerp3([0.0, Y0 + 1.7, -0.7], [0.2, Y0 + 1.65, -0.95], smooth(u)), [2.4, Y0 + 0.8, -3.6], 52),
  22: (u) => P(lerp3([1.3, Y0 + 1.3, -2.6], [1.42, Y0 + 1.25, -2.85], smooth(u)), [2.5, Y0 + 0.9, -3.9], 48),
  23: (u) => P(lerp3([0.95, CY + 1.5, -6.4], [0.9, CY + 1.5, -6.9], u), [0, CY + 1.0, -27], 28),
  24: (u) => P(lerp3([1.8, Y0 + 1.6, -1.7], [1.78, Y0 + 1.6, -1.95], u), [1.6, Y0 + 1.45, -3.2], 40),
  25: (u) => P(lerp3([2.8, Y0 + 0.13, -3.0], [2.8, Y0 + 0.11, -3.65], smooth(u)), [2.8, Y0 + 0.04, ZD], 42),
  26: (u) => P(lerp3([0.15, CY + 0.28, -11.3], [0.3, CY + 0.24, -11.85], smooth(u)), [1.0, CY + 0.2, -13], 40),
  27: (u) => P(lerp3([2.3, Y0 + 1.35, -1.5], [2.2, Y0 + 1.3, -1.85], u), [1.7, Y0 + 1.0, -3.3], 40),
  28: (u) => P(lerp3(C(-1.0), C(-4.2), u), [0.5, CY + 1.2, -13], 34),
  29: (u) => P(lerp3([0.3, Y0 + 1.5, -3.6], [0.3, Y0 + 1.5, -3.95], smooth(u)), [0.3, Y0 + 1.5, ZD], 34),
  30: (u) => P(lerp3([2.25, Y0 + 1.0, -2.0], [2.35, Y0 + 0.97, -2.25], u), [2.8, Y0 + 0.7, ZD], 42),
  31: (u) => P(lerp3([1.8, Y0 + 1.6, -1.75], [1.78, Y0 + 1.6, -2.0], u), [1.6, Y0 + 1.45, -3.2], 38),
  32: (u) => P(lerp3([0.0, CY + 1.7, -11.1], [0.15, CY + 1.68, -11.55], smooth(u)), [0.9, CY + 1.6, -13], 40),
  33: (u) => X(lerp3([7.5, Y0 + 3.2, 6.5], [14, Y0 + 12, 46], glide(u)), lerp3(SPK_OUT, [0, Y0 + 95, 0], smooth(u)), 46),
  34: (u) => P(lerp3(C(-2), C(-8.5), u), [0, CY + 1.3, -30], 58),
  35: (u) => P(lerp3(C(-10.5), C(-12.3), u), [0, CY + 1.2, -22], 42),
  36: (u) => { const k = glide(u); return X(lerp3([18, 92, 130], [-95, 175, 640], k), lerp3([0, 92, 0], [0, 112, 30], smooth(u)), 44 + 6 * k); },
  37: (u) => P(lerp3([2.0, Y0 + 1.3, -1.4], [2.5, Y0 + 1.2, -2.8], glide(u)), [2.8, Y0 + 1.0, ZD], 44),
  38: (u) => P([0.02, CY + 2.2, -32.2], [0.0, CY - 40, -32.21], 62, 0.9 * u),
  39: (u) => P(lerp3([2.1, Y0 + 1.12, -3.4], [2.25, Y0 + 1.07, -3.8], smooth(u)), HANDLE, 42),
  40: (u) => P(lerp3([1.15, Y0 + 1.5, -1.5], [1.4, Y0 + 1.45, -2.05], smooth(u)), [2.6, Y0 + 1.0, -4.2], 46),
};
const SHAKE: Record<number, number> = { 16: 0.004, 17: 0.004 };
export const camAt = (id: number, f: number): Cam => {
  const u = uOf(id, f), c = CAMS[id](u, f), a = SHAKE[id] ?? 0.0015, n = f * 0.9 + id * 3.1;
  const big = c.far > 1000 && !(id === 4) ? 30 : 1;
  let look: V3 = [c.look[0] + a * big * Math.sin(n * 2.3), c.look[1] + a * big * Math.sin(n * 1.7 + 1), c.look[2] + a * big * Math.sin(n * 1.1)];
  const t = f / FPS; for (const k of KNOCKS) { const d = t - k; if (d > 0 && d < 0.25 && [16, 17, 18].includes(id)) look = [look[0], look[1] + 0.012 * Math.exp(-d * 18) * Math.sin(d * 90), look[2]]; }
  return { ...c, look, roll: c.roll + 0.002 * Math.sin(f * 0.045 + id) };
};
export type Dof = { cInf: number; focus?: V3 };
export const dofAt = (_id: number, _f: number): Dof => ({ cInf: 0 });
/** point sur l'escalier en colimaçon carré, d = nombre de volées descendues depuis la porte */
export const stairAt = (d: number): V3 => {
  const lv = Math.floor(d / 4), s = Math.floor(d) % 4, t = d - Math.floor(d);
  const [x, z] = s === 0 ? [1.5, -30.6 - t * 3.2] : s === 1 ? [1.5 - t * 3.0, -33.8] : s === 2 ? [-1.5, -33.8 + t * 3.2] : [-1.5 + t * 3.0, -30.6];
  return [x, CY - lv * 3 - (s * 5 + t * 5) * 0.15 + 0.02, z];
};
export const CHOICE_AT = SHOTS[39].a / FPS + 0.8;
