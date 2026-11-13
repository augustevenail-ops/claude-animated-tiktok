// « Le Mur » — épisode 1 : 27 plans calés sur la voix (words.json ; provisoire = minutage estimé du script, remplacé par la voix réelle).
// Monde : labyrinthe sans fin (cases de 8 m, murs de H m), clairière au centre (carré de ±32 m, entrée côté +z), couloir principal
// x ∈ [-3 ; 3] de l'entrée (z = 32) jusqu'à z = 150, couloir du réveil z ∈ [217 ; 223], x ∈ [-60 ; 60].
export const FPS = 30;
export type V3 = [number, number, number];
export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => { const u = clamp01(x); return u * u * (3 - 2 * u); };
export const glide = (u: number) => { const x = clamp01(u); return x * x * x * (x * (6 * x - 15) + 10); };
export const lerp3 = (a: V3, b: V3, u: number): V3 => [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u];
export const hash = (i: number, s = 0) => { const v = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return v - Math.floor(v); };

export const CELL = 8, H = 8, TH = 1.2;                  // case, hauteur et épaisseur des murs
export const LONG_K = 5.1;                                // les Longs : carte agrandie 5,1x (≈ 11 m, ~5 personnages)
export const CLEAR = 32, ENTRY_Z = 32, ENTRY_W = 6;      // clairière ±32 m, entrée de 6 m côté +z
export const WAKE_Z = 220;                                // couloir du réveil
export const YOU_WAKE: V3 = [0, 0, WAKE_Z];
export const FIRE: V3 = [0, 0, -6];
export const SIREN: V3 = [12, 0, -16];
export const NAMES_Z = -CLEAR + TH / 2;                   // face intérieure du mur nord de la clairière
export const LONG_RUN: V3 = [0, 0, 50];                   // le Long qui barre le couloir principal (plans 23-27)
export const YOU_RUN_Z = 66;                              // là où tu t'arrêtes net

// ---------------- temps (voix) ----------------
import RAW from "./words.json";
export const VOICE_AT = 0.35;
export type W = { w: string; s: number; e: number; q?: number; role?: string };
export const WORDS: W[] = (RAW as W[]).map((w) => ({ ...w, s: w.s + VOICE_AT, e: w.e + VOICE_AT }));
/** premier mot de chaque plan (indice dans words.json) -> rôle (caméra + mise en place) */
const ANCH = [0, 4, 5, 13, 22, 31, 37, 40, 42, 45, 49, 57, 66, 70, 82, 95, 107, 120, 126, 138, 141, 152, 157, 167, 173, 179, 195];
export const ROLE: Record<number, number> = Object.fromEntries(ANCH.map((_, i) => [i + 1, i + 1]));
const starts = ANCH.map((wi, i) => (i === 0 ? 0 : WORDS[wi].s - 2 / FPS));
export const TITLE_DUR = 2.8;
export const END_T = WORDS[WORDS.length - 1].e + 0.35 + TITLE_DUR;
export const TITLE_AT = END_T - TITLE_DUR;
export type ShotDef = { id: number; a: number; b: number };
export const SHOTS: ShotDef[] = starts.map((a, i) => ({ id: i + 1, a: Math.round(a * FPS), b: Math.round((i + 1 < starts.length ? starts[i + 1] : END_T) * FPS) }));
export const TOTAL = SHOTS[SHOTS.length - 1].b;
export const shotAt = (f: number) => SHOTS.find((s) => f >= s.a && f < s.b) ?? SHOTS[SHOTS.length - 1];
export const tW = (i: number) => WORDS[i].s;
export const uOf = (id: number, f: number) => { const s = SHOTS[id - 1]; return clamp01((f - s.a) / Math.max(1, s.b - s.a)); };
export const CHOICE_AT = SHOTS[SHOTS.length - 1].a / FPS + 0.8;

/** lumière de chaque plan : 0 = jour orange, 1 = crépuscule rouge, 2 = nuit bleue */
export const LIGHT: Record<number, 0 | 1 | 2> = { 1: 2, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 2, 9: 2, 10: 2, 11: 2, 12: 2, 13: 0, 14: 0, 15: 1, 16: 2, 17: 2, 18: 0,
  19: 0, 20: 1, 21: 1, 22: 1, 23: 1, 24: 1, 25: 1, 26: 1, 27: 1 };
/** fermeture de l'entrée de la clairière (0 = ouverte, 1 = fermée) : commence au plan 22 et ne finit jamais avant la question */
export const entryClose = (t: number) => clamp01((t - tW(152)) / (TITLE_AT - tW(152) + 4)) * 0.85;

// ---------------- caméras ----------------
export type Cam = { pos: V3; look: V3; fov: number; roll: number; near: number; far: number };
const P = (pos: V3, look: V3, fov = 40, roll = 0, near = 0.05, far = 900): Cam => ({ pos, look, fov, roll, near, far });
const XL = (pos: V3, look: V3, fov = 45): Cam => P(pos, look, fov, 0, 0.5, 9000);
const yH = (p: V3, h: number): V3 => [p[0], p[1] + h, p[2]];
/** très grand recul (plan 4) : distance interpolée en log, montée, le regard glisse du mur vers l'horizon puis plonge sur le labyrinthe */
const pullBack = (u: number): Cam => {
  const k = 0.3 * u + 0.7 * glide(u), d = 9 * Math.pow(2600 / 9, k), yaw = 0.35 + 0.7 * smooth(k);
  const pos: V3 = [YOU_WAKE[0] + d * Math.sin(yaw) * 0.55, 9 + d * 0.62, YOU_WAKE[2] + d * Math.cos(yaw) * 0.55];
  const look: V3 = lerp3([0, 4, WAKE_Z - 30], [0, 0, WAKE_Z - 120], smooth(k * 1.2));
  return XL(pos, look, 50 - 8 * smooth(k));
};
const CAMS: Record<number, (u: number) => Cam> = {
  1: (u) => P(lerp3([-1, 27, WAKE_Z - 8.5], [-0.8, 23, WAKE_Z - 7], smooth(u)), [0.9, 3.4, WAKE_Z + 3.2], 50),                       // nuit, 3/4 haut : toi minuscule, le Long derrière le mur
  2: (u) => P(lerp3([0.02, 1.05, WAKE_Z - 1.25], [0.02, 0.95, WAKE_Z - 1.3], u), [0, 0, WAKE_Z - 1.42], 38),                 // gros plan visage au sol
  3: (u) => P(lerp3([-0.4, 1.2, WAKE_Z - 1.0], [-3, H + 3.5, WAKE_Z + 0.4], glide(u)), lerp3([0, 0, WAKE_Z - 1.42], [30, H * 0.6, WAKE_Z], glide(u)), 50),
  4: pullBack,
  5: (u) => { const a = -0.5 + 1.5 * smooth(u); return P([YOU_WAKE[0] + 3.4 * Math.sin(a), 1.55, YOU_WAKE[2] + 3.4 * Math.cos(a)], yH(YOU_WAKE, 1.25), 36); },
  6: (u) => XL([-70 + 40 * u, 55, WAKE_Z + 70], [-10 + 20 * u, 0, WAKE_Z - 10], 46),
  7: (u) => XL([-30 + 10 * u, 55, WAKE_Z + 70], [10 + 5 * u, 0, WAKE_Z - 10], 46),
  8: (u) => XL([-20 + 6 * u, 55, WAKE_Z + 70], [15 + 3 * u, 0, WAKE_Z - 10], 46),
  9: (u) => XL([0, 60, WAKE_Z + 30], [0, 0, WAKE_Z - 4], 52 - 8 * smooth(u)),
  10: (u) => XL(lerp3([20, 30, WAKE_Z + 22], [16, 22, WAKE_Z + 17], smooth(u)), [4, 3, WAKE_Z + 2], 48),
  11: (u) => P([4.5, 0.9, WAKE_Z - 1.6], lerp3([13, 1.5, WAKE_Z + 0.4], [12.5, 9.6, WAKE_Z + 0.4], glide(u)), 62),           // contre-plongée : pieds -> tête
  12: (u) => P(lerp3([-2.5, 1.3, WAKE_Z - 2.6], [-2.0, 1.4, WAKE_Z - 2.2], smooth(u)), [2.3, 6.4, WAKE_Z + 2.9], 62),           // le Long penché par-dessus le mur
  13: (u) => XL(lerp3([0, 150, 110], [0, 42, 44], glide(u)), lerp3([0, 0, 10], [0, 0, -2], u), 50),                           // plongée sur la clairière
  14: (u) => P(lerp3([-7, 1.75, 4], [6, 1.75, 4.5], smooth(u)), yH(FIRE, 1.0), 42),
  15: (u) => P(lerp3([7, 1.1, -7], [8.4, 1.3, -10.5], smooth(u)), [SIREN[0], 10.5, SIREN[2]], 44 - 8 * smooth(u)),
  16: (u) => P(lerp3([-4, 1.4, 4], [-3, 1.3, 1.5], smooth(u)), [0, 1.0, -4], 40),                                           // nuit : jeunes figés
  17: (u) => P(lerp3([0, 1.1, NAMES_Z + 7], [0, 6.6, NAMES_Z + 7], glide(u)), lerp3([0, 1.2, NAMES_Z], [0, 7.4, NAMES_Z], glide(u)), 46),
  18: (u) => P(lerp3([0.12, 1.47, 21.35], [0.08, 1.45, 21.1], smooth(u)), [0, 1.43, 20], 34),                                 // gros plan : ton visage décidé
  19: (u) => XL(lerp3([40, 26, 128], [52, 70, 160], smooth(u)), lerp3([0, 0, 118], [0, 0, 80], smooth(u)), 46),               // toi minuscule, loin de la clairière
  20: (u) => P([SIREN[0] - 2.6, 9.2, SIREN[2] + 3.4], [SIREN[0], 10.8, SIREN[2]], 40 - 4 * u),
  21: (u) => { const z = 98 - 26 * u; return P([0.25, 0.95 + 0.05 * Math.sin(u * 40), z + 3.4], [0, 1.4, z - 14], 56); },    // caméra basse qui te suit en courant
  22: (u) => P(lerp3([0, 2.2, 74], [0, 2.4, 70], smooth(u)), [0, 3.2, ENTRY_Z], 40),
  23: (u) => P([0.6, 1.45, YOU_RUN_Z + 0.4], lerp3([0, 2.5, LONG_RUN[2]], [0, 8.8, LONG_RUN[2]], smooth(u)), 62),
  24: (u) => P(lerp3([0.8, 9.0, LONG_RUN[2] - 5.6], [0.6, 9.0, LONG_RUN[2] - 5.0], smooth(u)), [0, 9.1, LONG_RUN[2]], 36),   // la tête qui pivote vers toi
  25: (u) => P(lerp3([-2.3, 4.5, 74], [-2.2, 4.8, 72], smooth(u)), [0.5, 3.4, 44], 52),
  26: (u) => P(lerp3([0.25, 1.5, YOU_RUN_Z + 1.2], [0.2, 1.48, YOU_RUN_Z + 1.0], smooth(u)), [0, 1.42, YOU_RUN_Z], 34),
  27: (u) => P(lerp3([0.0, 1.7, YOU_RUN_Z + 3.4], [0.0, 1.8, YOU_RUN_Z + 2.8], smooth(u)), [0, 3.6, LONG_RUN[2] - 4], 54),
};
export const camAt = (sid: number, f: number): Cam => {
  const c = CAMS[ROLE[sid]](uOf(sid, f)), a = c.far > 1000 ? 0.03 : 0.012, n = f * 0.021 + sid * 3.1;
  return { ...c, look: [c.look[0] + a * Math.sin(n * 2.3), c.look[1] + a * Math.sin(n * 1.7 + 1), c.look[2] + a * Math.sin(n * 1.1)] };
};
/** flou de profondeur (px à 1080 à l'infini) */
export type Dof = { cInf: number; focus?: V3 };
const DOFS: Record<number, number> = { 1: 6, 2: 14, 3: 6, 4: 1, 5: 12, 6: 2, 7: 2, 8: 2, 9: 2, 10: 3, 11: 8, 12: 10, 13: 2, 14: 12, 15: 10, 16: 12, 17: 8, 18: 14,
  19: 2, 20: 10, 21: 8, 22: 6, 23: 8, 24: 12, 25: 4, 26: 14, 27: 10 };
export const dofAt = (sid: number): Dof => ({ cInf: DOFS[ROLE[sid]] ?? 8 });
