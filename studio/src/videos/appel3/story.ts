// « L'appel » épisode 3 (« Le sous-sol ») : 38 plans calés sur la voix réelle (words.json, voix décalée de VOICE_AT), lieux, caméras, flou, état des fenêtres.
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
const ANCH = [0, 1, 8, 9, 13, 18, 24, 33, 40, 44, 46, 48, 54, 60, 71, 77, 81, 84, 89, 90, 97, 99, 104, 114, 123, 128, 133, 142, 151, 158, 163, 172, 178, 188, 197, 202, 208, 212];
const starts = ANCH.map((wi, i) => (i === 0 ? 0 : WORDS[wi].s - 2 / FPS));
export const END_T = WORDS[WORDS.length - 1].e + 1.6;
export type ShotDef = { id: number; a: number; b: number };
export const SHOTS: ShotDef[] = starts.map((a, i) => ({ id: i + 1, a: Math.round(a * FPS), b: Math.round((i + 1 < starts.length ? starts[i + 1] : END_T) * FPS) }));
export const TOTAL = SHOTS[SHOTS.length - 1].b;
export const shotAt = (f: number) => SHOTS.find((s) => f >= s.a && f < s.b) ?? SHOTS[SHOTS.length - 1];
export const tW = (i: number) => WORDS[i].s;
export const uOf = (id: number, f: number) => { const s = SHOTS[id - 1]; return clamp01((f - s.a) / Math.max(1, s.b - s.a)); };

// ---------------- fenêtres : la nuit (noir) ; plans 28-29 = l'appel (tout vert, quelques rouges) ----------------
export const winState = (face: number, c: number, fl: number, t: number) => {
  if (face === 0 && c === MY_COL && fl === MY_FLOOR) return 0;
  if (t >= tW(142) - 0.2) return hash(c * 97 + fl * 13, face + 3) < 0.035 ? 2 : 1;
  return hash(c * 131 + fl, face + 7) < 0.05 ? 3 : 0;
};
export const greenAt = (_id: number) => 0;
export const KNOCKS: number[] = [];

// ---------------- la salle souterraine ----------------
export const HY = -300;                                                  // sol de la salle
export const HALL = { x0: -36, x1: 36, z0: -150, z1: -60, h: 11 };
export const ENTRY: V3 = [0, HY, -60];                                   // porte de l'escalier dans le mur avant
export const GRILLE: V3 = [-8, HY, -60];                                 // grille d'aération au ras du sol (mur avant)
export const MOM: V3 = [3.0, HY, -99.2];
export const PALM: V3 = [20, HY + 1.2, -64];                             // plan de la paume (gros plan isolé)
export const STAGE_Z = -146;                                             // estrade des hommes en blanc (fond)

// ---------------- caméras ----------------
export type Cam = { pos: V3; look: V3; fov: number; roll: number; near: number; far: number };
const P = (pos: V3, look: V3, fov = 40, roll = 0, near = 0.05, far = 400): Cam => ({ pos, look, fov, roll, near, far });
const X = (pos: V3, look: V3, fov = 45, roll = 0): Cam => P(pos, look, fov, roll, 0.6, 7000);
const C = (dz: number): V3 => [0, CY + 1.55, dz];
const yH = (p: V3, h: number): V3 => [p[0], p[1] + h, p[2]];
const ZD = -4.5;
export const HANDLE: V3 = [2.45, Y0 + 1.0, ZD + 0.1];
export const MY_DOOR_Z = -13;
const Hh = (x: number, y: number, z: number): V3 => [x, HY + y, z];
const CAMS: Record<number, (u: number, f: number) => Cam> = {
  1: (u) => P(lerp3([2.0, Y0 + 1.45, -2.0], [2.35, Y0 + 1.35, -3.0], glide(u)), [2.8, Y0 + 1.1, ZD - 1], 46),
  2: (u) => P(lerp3(C(-8.5), C(-10.2), smooth(u)), [1.0, CY + 1.2, -13], 44),
  3: (u) => P(lerp3(C(-0.8), C(-2.0), u), [0, CY + 1.4, -30], 30),
  4: (u) => P(lerp3([0.4, CY + 0.5, -3], [0.35, CY + 0.5, -9], u), [0, CY + 0.9, -30], 50),
  5: (u) => P(lerp3([-0.6, CY + 1.5, -5], [-0.6, CY + 1.5, -15], u), [1.6, CY + 1.2, -11 - 10 * u], 48),
  6: (u) => P(lerp3([0.15, Y0 + 1.7, -0.75], [0.35, Y0 + 1.6, -1.1], smooth(u)), [2.2, Y0 + 0.6, -3.0], 54),
  7: (u) => P(lerp3(C(-14), C(-22), u), [0, CY + 1.2, -32], 40),
  8: (u) => P([0.02, CY + 2.2, -32.2], [0.0, CY - 40, -32.21], 62, 0.9 * u),
  9: (u) => P(lerp3([0.25, CY + 1.4, -31.2], [0.2, CY + 1.42, -31.0], u), [-0.1, CY + 1.0, -29.3], 44),
  10: (u) => P(lerp3([-1.55, CY + 2.45, -30.35], [-0.6, CY + 1.4, -31.2], glide(u)), lerp3([1.2, CY - 2.5, -32.6], [0.6, CY - 5, -33.2], smooth(u)), 62),
  11: (u) => P(lerp3([0.1, CY + 0.5, -32.1], [0.0, CY - 30, -32.3], glide(u)), lerp3([0.2, CY - 6, -34.2], [0.0, CY - 37, -32.4], smooth(u)), 70, 0.6 * u),
  12: (u) => P(lerp3([1.2, CY - 11.0, -31.0], [0.9, CY - 11.3, -31.5], smooth(u)), [0, CY - 11.6, -34.4], 52),
  13: (u) => P(lerp3([0.5, CY - 5.3, -31.9], [0.3, CY - 5.45, -32.3], smooth(u)), [0, CY - 5.6, -34.4], 58),
  14: (u) => P(lerp3([0.0, CY - 8.6, -31.7], [0.0, CY - 8.6, -32.0], smooth(u)), [0, CY - 8.6, -34.4], 60),
  15: (u) => { const k = glide(u); return P(lerp3(Hh(0, 2.0, -61.5), Hh(4, 9.5, -63), k), lerp3(Hh(0, 1.6, -80), Hh(0, 0.5, -110), smooth(u)), 50 + 8 * k, 0, 0.05, 600); },
  16: (u) => P(lerp3(Hh(-14, 1.7, -86), Hh(-4, 1.7, -86), u), Hh(-6, 1.5, -100), 44, 0, 0.05, 600),
  17: (u) => P(lerp3(Hh(-1.5, 1.55, -91.2), Hh(-0.5, 1.55, -91.6), u), Hh(-1, 1.4, -96), 34, 0, 0.05, 600),
  18: (u) => { const k = glide(u); return P(lerp3(Hh(0, 10.2, -66), Hh(0, 10.6, -88), k), lerp3(Hh(0, 0, -96), Hh(0, 0, -112), k), 64, 0, 0.05, 600); },
  19: (u) => P(lerp3(Hh(-4.6, 1.5, -90.4), Hh(-4.5, 1.5, -90.7), u), Hh(-4.75, 1.45, -92.5), 30, 0, 0.05, 600),
  20: (u) => P(lerp3(Hh(1.5, 1.6, -88), Hh(2.6, 1.6, -95.5), glide(u)), Hh(3.0, 1.45, -99.2), 40, 0, 0.05, 600),
  21: (u) => P(lerp3(Hh(3.05, 1.55, -97.4), Hh(3.03, 1.55, -97.75), u), Hh(3.0, 1.5, -99.2), 32, 0, 0.05, 600),
  22: (u) => P(lerp3(Hh(2.4, 1.4, -96.4), Hh(2.5, 1.38, -96.9), u), Hh(2.65, 1.1, -98.9), 42, 0, 0.05, 600),
  23: (u) => P(lerp3([PALM[0], PALM[1] + 0.05, PALM[2] + 1.5], [PALM[0], PALM[1] + 0.04, PALM[2] + 1.32], u), PALM, 40, 0, 0.05, 600),
  24: (u) => P(lerp3([PALM[0], PALM[1], PALM[2] + 1.3], [PALM[0], PALM[1], PALM[2] + 1.12], u), PALM, 40, 0, 0.05, 600),
  25: (u) => X(lerp3([-40, 2, 128], [-46, 3.5, 120], glide(u)), lerp3([-20, 30, 60], [0, 120, 10], glide(u)), 58),
  26: (u) => X(lerp3([-10, 1.6, 27], [-11, 2.3, 24.5], smooth(u)), [-14, 8.4, 18.2], 40),
  27: (u) => P(lerp3(Hh(-1.5, 2.0, -139.5), Hh(-0.8, 2.3, -141.0), smooth(u)), Hh(0, 4.6, STAGE_Z), 70, 0, 0.05, 600),
  28: (u) => { const k = glide(u); return X(lerp3([10, 60, 160], [-95, 175, 640], k), lerp3([0, 90, 0], [0, 112, 30], smooth(u)), 44 + 6 * k); },
  29: (u) => X(lerp3([30, 127, 38], [31.5, 126, 40], u), [50, 123, 52], 44),
  30: (u) => P(lerp3([0.05, CY - 35.5, -32.2], [0.05, CY - 34.8, -32.2], u), [0.0, CY + 5, -32.25], 66, -0.6 * u),
  31: (u) => P(lerp3(Hh(-6.2, 1.4, -63.7), Hh(-6.4, 1.4, -63.45), u), Hh(-7.9, 1.2, -61.1), 50, 0, 0.05, 600),
  32: (u) => P(lerp3([0.6, CY - 34.2, -31.0], [0.5, CY - 34.0, -31.2], u), [-0.3, CY - 30.2, -33.8], 56, 0, 0.05, 400),
  33: (u) => P(lerp3(Hh(-7.0, 1.55, -63.3), Hh(-7.1, 1.55, -63.0), u), Hh(-7.4, 1.5, -61.6), 32, 0, 0.05, 600),
  34: (u) => P(lerp3(Hh(-6.0, 0.3, -64.5), Hh(-7.5, 0.2, -61.9), glide(u)), Hh(-8, 0.25, -60), 44, 0, 0.05, 600),
  35: (u) => P(lerp3(Hh(-8, 0.36, -61.6), Hh(-8, 0.33, -61.25), u), Hh(-8, 0.28, -59.9), 46, 0, 0.05, 600),
  36: (u) => P(lerp3(Hh(-7.3, 0.55, -62.6), Hh(-7.45, 0.55, -62.3), u), Hh(-8, 0.5, -60.4), 46, 0, 0.05, 600),
  37: (u) => P(lerp3([0.2, CY - 34.9, -31.4], [0.15, CY - 34.85, -31.6], u), [0.9, CY - 33.4, -33.8], 50, 0, 0.05, 400),
  38: (u) => P(lerp3(Hh(-5.6, 1.0, -63.8), Hh(-5.9, 1.05, -63.3), smooth(u)), Hh(-7.8, 0.8, -61), 46, 0, 0.05, 600),
};
const SHAKE: Record<number, number> = { 11: 0.003 };
export const camAt = (id: number, f: number): Cam => {
  const u = uOf(id, f), c = CAMS[id](u, f), a = SHAKE[id] ?? 0.0015, n = f * 0.9 + id * 3.1;
  const big = c.far > 1000 ? 30 : 1;
  const look: V3 = [c.look[0] + a * big * Math.sin(n * 2.3), c.look[1] + a * big * Math.sin(n * 1.7 + 1), c.look[2] + a * big * Math.sin(n * 1.1)];
  return { ...c, look, roll: c.roll + 0.002 * Math.sin(f * 0.045 + id) };
};
export type Dof = { cInf: number; focus?: V3 };
export const dofAt = (_id: number, _f: number): Dof => ({ cInf: 0 });
export const stairAt = (d: number): V3 => {
  const lv = Math.floor(d / 4), s = Math.floor(d) % 4, t = d - Math.floor(d);
  const [x, z] = s === 0 ? [1.5, -30.6 - t * 3.2] : s === 1 ? [1.5 - t * 3.0, -33.8] : s === 2 ? [-1.5, -33.8 + t * 3.2] : [-1.5 + t * 3.0, -30.6];
  return [x, CY - lv * 3 - (s * 5 + t * 5) * 0.15 + 0.02, z];
};
export const CHOICE_AT = SHOTS[37].a / FPS + 0.8;
