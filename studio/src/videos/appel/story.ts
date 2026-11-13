// « L'appel » : 41 plans calés sur la voix réelle (words.json, voix décalée de VOICE_AT), lieux, caméras, flou, état des fenêtres.
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
const OLD_ANCH = [0, 1, 9, 14, 20, 27, 34, 37, 42, 45, 48, 53, 56, 66, 70, 74, 78, 83, 95, 101, 109, 118, 121, 129, 133, 136, 149, 157, 164, 170, 173, 181, 183, 191, 197, 202, 206, 211, 213, 218, 226];
/** affiches des règles tenues pendant toute la phrase (consigne du 2026-11-13) : on retire les plans 13, 26 et 31 de l'ancien découpage */
const PLAN: [number, number][] = OLD_ANCH.map((a, i) => [a, i + 1] as [number, number]).filter((p) => ![13, 26, 31].includes(p[1]));
const ANCH = PLAN.map((p) => p[0]);
export const ROLE: Record<number, number> = Object.fromEntries(PLAN.map((p, i) => [i + 1, p[1]]));
const starts = ANCH.map((wi, i) => (i === 0 ? 0 : WORDS[wi].s - 2 / FPS));
export const TITLE_DUR = 2.8;
export const END_T = WORDS[WORDS.length - 1].e + 0.35 + TITLE_DUR;   // blanc naturel avant le carton
export const TITLE_AT = END_T - TITLE_DUR;
export type ShotDef = { id: number; a: number; b: number };
export const SHOTS: ShotDef[] = starts.map((a, i) => ({ id: i + 1, a: Math.round(a * FPS), b: Math.round((i + 1 < starts.length ? starts[i + 1] : END_T) * FPS) }));
export const TOTAL = SHOTS[SHOTS.length - 1].b;
export const shotAt = (f: number) => SHOTS.find((s) => f >= s.a && f < s.b) ?? SHOTS[SHOTS.length - 1];
export const tW = (i: number) => WORDS[i].s;
export const uOf = (id: number, f: number) => { const s = SHOTS[id - 1]; return clamp01((f - s.a) / Math.max(1, s.b - s.a)); };

// ---------------- l'appel : fenêtres vertes étage par étage (du haut vers ton étage), rouges éparses ----------------
const T_CALL = tW(42), T_YOU = tW(197), DT_FLOOR = (T_YOU - T_CALL) / (FLOORS - 1 - MY_FLOOR);
/** 0 = noire, 1 = verte, 2 = rouge, 3 = lueur chaude (avant l'appel) */
export const winState = (face: number, c: number, fl: number, t: number) => {
  if (face === 0 && c === MY_COL && fl === MY_FLOOR) return 0;
  const k = (FLOORS - 1 - fl) * DT_FLOOR + T_CALL + (face ? (COLS - 1 - c) : c) / COLS * DT_FLOOR * 0.9;
  if (fl < MY_FLOOR || (fl === MY_FLOOR && face === 0 && c > MY_COL) || t < k) return hash(c * 131 + fl, face + 7) < 0.06 ? 3 : 0;
  return hash(c * 97 + fl * 13, face + 3) < 0.035 ? 2 : 1;
};
/** hauteur (m) du front vert à l'instant t */
export const waveY = (t: number) => Math.max(Y0, TOWER_H - Math.max(0, t - T_CALL) / DT_FLOOR * FLH);
/** lumière verte qui entre dans l'appartement (0..1) */
export const greenIn = (t: number) => smooth((t - tW(164)) / (T_YOU - tW(164))) * 0.8 + (t > tW(202) && t < tW(206) ? 0.2 : 0);

// ---------------- caméras ----------------
export type Cam = { pos: V3; look: V3; fov: number; roll: number; near: number; far: number };
const P = (pos: V3, look: V3, fov = 40, roll = 0, near = 0.05, far = 400): Cam => ({ pos, look, fov, roll, near, far });
const X = (pos: V3, look: V3, fov = 45, roll = 0): Cam => P(pos, look, fov, roll, 0.6, 7000);       // extérieur (grandes distances)
const C = (dz: number): V3 => [0, CY + 1.55, dz];
const yH = (p: V3, h: number): V3 => [p[0], p[1] + h, p[2]];
const OLD: Record<number, (u: number, f: number) => Cam> = {
  1: (u) => P(lerp3([YOU[0] + 0.05, YOU[1] + 0.63, YOU[2] + 1.35] as V3, [YOU[0] + 0.03, YOU[1] + 0.78, YOU[2] + 1.25] as V3, smooth(u * 3)), yH(YOU, 0.82 + 0.06 * smooth(u * 4)), 36),
  2: (u) => X(lerp3([30, 1.6, 178], [27, 3, 170], glide(u)), lerp3([12, 8, 130], [0, 220, 10], glide(u)), 60),
  3: (u) => X(lerp3([7.9, Y0 + 4.1, 4.2], [7.2, Y0 + 4.3, 3.0], smooth(u)), SPK_OUT, 38),
  4: (u) => X([8, 2, 9], lerp3([50, 70, 12], [50, 104, 52], smooth(u)), 52, 0.02),
  5: (u) => X(lerp3([-20, 1.3, 132], [-21, 7, 135], glide(u)), lerp3([-70, 3, 129], [-80, 14, 128], glide(u)), 50),
  6: (u) => P(lerp3([-0.95, CY + 2.45, -1.6], [-0.85, CY + 2.4, -4.6], u), [0.3, CY + 0.4, -12], 50),   // couloir vu d'en haut (3/4)
  7: (u) => P(lerp3([0.35, CY + 1.42, -8.6], [0.22, CY + 1.42, -9.05], smooth(u)), [-0.95, CY + 1.42, -10], 34),
  8: (u) => P(lerp3([1.65, Y0 + 1.6, -2.4], [1.45, Y0 + 1.8, -3.1], smooth(u)), SPK_IN, 40),
  9: (u) => X(lerp3([-42, 5, 62], [-36, 8, 56], u), [30, 150, 22], 58),
  10: (u) => X(lerp3([30, 128, 18], [30, 124, 42], u), lerp3([50, 133, 20], [50, 131, 44], u), 46),
  11: (u) => P(lerp3([2.55, Y0 + 1.95, -3.55], [2.7, Y0 + 2.02, -3.9], smooth(u)), [2.8, Y0 + 2.2, -4.43], 30),
  12: (u) => P(lerp3([0.45, CY + 1.42, -2.0], [0.3, CY + 1.42, -2.3], smooth(u)), [-1.29, CY + 1.3, -2.9], 46),   // affiche 1 : cadre large, tenue toute la règle, au-dessus du sous-titre
  13: (u) => P(lerp3([-0.25, CY + 1.42, -11.6], [-0.15, CY + 1.42, -11.9], u), [0.95, CY + 1.42, -13], 36),
  14: (u) => P(lerp3([0.35, CY + 1.42, -14.5], [0.22, CY + 1.42, -15.0], smooth(u)), [-0.95, CY + 1.42, -16], 32),
  15: (u) => P(lerp3(C(-11.5), C(-12.5), u), [0, CY + 1.2, -26], 30),
  16: (u) => P(lerp3([-1.55, CY + 2.45, -30.35], [-0.35, CY + 0.6, -31.5], glide(u)), lerp3([1.0, CY - 5.5, -33.0], [0.05, CY - 36, -32.3], smooth(u * 1.1)), 66, 0.25 * u),   // plongée depuis le palier : on voit la file descendre, puis on bascule à la verticale vers le rouge
  17: (u) => P([0.02, CY + 2.2, -32.2], [0.0, CY - 40, -32.21], 62, 0.9 * u),
  18: (u) => P(lerp3([2.1, Y0 + 1.42, -3.3], [1.95, Y0 + 1.42, -2.9], smooth(u)), yH(YOU_WIN, 1.38), 38),
  19: (u) => P(lerp3([0.95, CY + 1.5, -6.4], [0.9, CY + 1.5, -6.9], u), [0, CY + 1.0, -27], 28),
  20: (u) => P(lerp3([1.98, Y0 + 1.1, -0.6], [1.98, Y0 + 1.08, -0.78], u), [1.98, Y0 + 0.98, -2.62], 60),
  21: (u) => P(lerp3([YOU[0] + 0.18, YOU[1] + 0.83, YOU[2] + 1.5] as V3, [YOU[0] + 0.14, YOU[1] + 0.83, YOU[2] + 1.3] as V3, u), yH(YOU, 0.84), 34),
  22: (u) => P(lerp3([NOE[0] + -0.12, NOE[1] + 0.56, NOE[2] + 1.25] as V3, [NOE[0] + -0.1, NOE[1] + 0.56, NOE[2] + 1.1] as V3, u), yH(NOE, 0.6), 32),
  23: (u) => P(lerp3([NOE[0] + -0.03, NOE[1] + 0.58, NOE[2] + 1.05] as V3, [NOE[0] + -0.01, NOE[1] + 0.58, NOE[2] + 0.8] as V3, smooth(u)), yH(NOE, 0.6), 28),
  24: (u) => P(lerp3([NOE[0] + 0, NOE[1] + 0.56, NOE[2] + 0.5] as V3, [NOE[0] + 0, NOE[1] + 0.56, NOE[2] + 0.38] as V3, u), yH(NOE, 0.55), 22),
  25: (u) => P(lerp3([2.78, Y0 + 1.42, -2.55], [2.79, Y0 + 1.41, -2.75], smooth(u)), [2.8, Y0 + 1.28, -4.47], 46),
  26: (u) => P(lerp3([0.55, CY + 1.4, -23.6], [0.45, CY + 1.4, -24.4], u), [0, CY + 1.2, -30], 42),
  27: (_u, f) => { const y = waveY(f / FPS) + 6; return X([31, y + 2, 28], [50, y - 7, 33], 50, 0.02); },
  28: (u) => X(lerp3([30, 127, 38], [31.5, 126, 40], u), [50, 123, 52], 44),
  29: (u) => P(lerp3([0.5, Y0 + 1.6, -1.1], [0.62, Y0 + 1.62, -0.6], smooth(u)), [50, Y0 + 6, 45], 52, 0, 0.05, 3000),
  30: (u) => P(lerp3([2.62, Y0 + 1.66, -2.15], [2.62, Y0 + 1.66, -2.0], smooth(u)), [2.62, Y0 + 1.5, -0.32], 46),
  31: (u) => P(lerp3([1.0, Y0 + 1.5, 3.2], [1.12, Y0 + 1.5, 2.2], smooth(u)), yH(YOU_WIN, 1.42), 40, 0, 0.1, 3000),
  32: (u) => P([1.25, Y0 + 2.2, 0.6], lerp3([1.25, Y0 - 30, 3.5], [1.15, 0, 9.5], glide(u)), 55, 0, 0.1, 3000),
  33: (u) => X(lerp3([8, 1.3, 32], [7, 1.4, 30], smooth(u)), [1, 5, 12], 36),
  34: (u) => P(lerp3([1.55, 1.15, 12.7], [1.45, 1.2, 12.35], smooth(u)), [1.0, 1.44, 11], 30, 0, 0.05, 3000),
  35: (u) => P(lerp3([1.35, Y0 + 1.85, -3.2], [1.3, Y0 + 1.9, -3.45], u), SPK_IN, 32),
  36: (u) => P(lerp3([YOU[0] + 0.12, YOU[1] + 0.83, YOU[2] + 1.4] as V3, [YOU[0] + 0.1, YOU[1] + 0.83, YOU[2] + 1.2] as V3, u), yH(YOU, 0.84), 32),
  37: (u) => P(lerp3([NOE[0] + -0.06, NOE[1] + 0.58, NOE[2] + 1.15] as V3, [NOE[0] + -0.04, NOE[1] + 0.58, NOE[2] + 0.95] as V3, u), yH(NOE, 0.6), 30),
  38: (u) => P(lerp3([1.98, Y0 + 1.12, -0.62], [1.98, Y0 + 1.1, -0.74], u), [1.98, Y0 + 1.0, -2.62], 58),
  39: (u) => P([1.25, Y0 + 2.3, 0.35], lerp3([1.0, 1.0, 12.0], [1.0, 1.3, 11.6], u), 10, 0, 0.1, 3000),
  40: (u) => { const k = glide(u); return X(lerp3([1.25, Y0 + 1.9, 3.5], [-95, 175, 640], k), lerp3(WIN, [0, 112, 30], smooth(u * 1.4)), 40 + 8 * k); },
  41: (u) => P(lerp3([YOU[0] + -0.04, YOU[1] + 0.84, YOU[2] + 1.1] as V3, [YOU[0] + -0.02, YOU[1] + 0.84, YOU[2] + 0.8] as V3, u), yH(YOU, 0.84), 38),
};
const CAMS: Record<number, (u: number, f: number) => Cam> = Object.fromEntries(PLAN.map((p, i) => [i + 1, OLD[p[1]]]));
/** légère respiration de caméra (tremblements réduits : consigne utilisateur du 2026-11-12) */
const SHAKE: Record<number, number> = { 1: 0.006, 14: 0.004, 24: 0.002, 36: 0.003 };
export const camAt = (id: number, f: number): Cam => {
  const u = uOf(id, f), c = CAMS[id](u, f), role = ROLE[id], a = SHAKE[role] ?? 0.0015, n = f * 0.9 + id * 3.1;
  const big = c.far > 1000 && !(role === 29 || role === 31 || role === 32 || role === 34 || role === 39) ? 30 : 1;      // en extérieur lointain, la même respiration en proportion
  let look: V3 = [c.look[0] + a * big * Math.sin(n * 2.3), c.look[1] + a * big * Math.sin(n * 1.7 + 1), c.look[2] + a * big * Math.sin(n * 1.1)];
  return { ...c, look, roll: c.roll + 0.002 * Math.sin(f * 0.045 + id) };
};

// ---------------- flou de profondeur (px à 1080 à l'infini) ----------------
export type Dof = { cInf: number; focus?: V3 };
const DOFS: Record<number, number> = { 1: 14, 2: 3, 3: 10, 4: 4, 5: 5, 6: 10, 7: 14, 8: 12, 9: 2, 10: 3, 11: 14, 12: 14, 13: 14, 14: 14, 15: 8, 16: 10, 17: 8, 18: 12, 19: 8,
  20: 12, 21: 14, 22: 14, 23: 14, 24: 14, 25: 14, 26: 10, 27: 3, 28: 4, 29: 6, 30: 14, 31: 10, 32: 4, 33: 6, 34: 14, 35: 14, 36: 14, 37: 14, 38: 12, 39: 6, 40: 1, 41: 14 };
export const dofAt = (sid: number, f: number): Dof => {
  const u = uOf(sid, f), id = ROLE[sid];
  if (id === 29) return { cInf: DOFS[29], focus: lerp3([1.3, Y0 + 1.8, 0], [50, Y0 + 6, 45], smooth(u * 1.5)) };   // la mise au point passe de la vitre à la façade d'en face
  if (id === 38) return { cInf: DOFS[38], focus: lerp3(yH(YOU, 0.84), yH(NOE, 0.6), smooth(u * 1.6)) };
  return { cInf: DOFS[id] ?? 10 };
};
/** point sur l'escalier en colimaçon carré, d = nombre de volées descendues depuis la porte (4 volées par niveau de 3 m) */
export const stairAt = (d: number): V3 => {
  const lv = Math.floor(d / 4), s = Math.floor(d) % 4, t = d - Math.floor(d);
  const [x, z] = s === 0 ? [1.5, -30.6 - t * 3.2] : s === 1 ? [1.5 - t * 3.0, -33.8] : s === 2 ? [-1.5, -33.8 + t * 3.2] : [-1.5 + t * 3.0, -30.6];
  return [x, CY - lv * 3 - (s * 5 + t * 5) * 0.15 + 0.02, z];
};
export const CHOICE_AT = SHOTS[SHOTS.length - 1].a / FPS + 0.8;
/** instants où une fenêtre devient rouge (compteur « SILENCES CE SOIR ») */
export const RED_TIMES: number[] = (() => { const o: number[] = []; for (let face = 0; face < 2; face++) for (let fl = MY_FLOOR; fl < FLOORS; fl++) for (let c = 0; c < COLS; c++) {
  if (hash(c * 97 + fl * 13, face + 3) >= 0.035 || (face === 0 && c === MY_COL && fl === MY_FLOOR)) continue; o.push((FLOORS - 1 - fl) * DT_FLOOR + T_CALL + (face ? (COLS - 1 - c) : c) / COLS * DT_FLOOR * 0.9); } return o.sort((a, b) => a - b); })();
