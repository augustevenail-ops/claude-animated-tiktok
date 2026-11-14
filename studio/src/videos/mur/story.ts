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
export const VOICE_AT = 0.15;   // voix dès 0,15 s (= OFF de tools/mur_mix.py)
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
  const k = 0.3 * u + 0.7 * glide(u), d = 9 * Math.pow(900 / 9, k), yaw = 0.35 + 0.7 * smooth(k);
  const pos: V3 = [YOU_WAKE[0] + d * Math.sin(yaw) * 0.55, 9 + d * 0.62, YOU_WAKE[2] + d * Math.cos(yaw) * 0.55];
  const look: V3 = lerp3([0, 4, WAKE_Z - 30], [0, 0, WAKE_Z - 120], smooth(k * 1.2));
  return XL(pos, look, 50 - 8 * smooth(k));
};
/** zoom « éclair » : arrivée rapide (k = part du plan où le mouvement est fini), puis quasi immobile */
const snap = (u: number, k = 0.3) => 1 - Math.pow(1 - clamp01(u / k), 3);
const lp = (a: number, b: number, u: number) => a + (b - a) * u;
const sh = (U: number, a: number, f = 90): V3 => [a * Math.sin(U * f), a * Math.sin(U * f * 1.37 + 1), a * Math.sin(U * f * 0.83 + 2)];   // tremblement
const add = (p: V3, d: V3): V3 => [p[0] + d[0], p[1] + d[1], p[2] + d[2]];
const LR = LONG_RUN[2], SX = SIREN[0], SZ = SIREN[2];
const yRun = (U: number) => 98 - 26 * U - 0.9, yWalk = (U: number) => 118 - 30 * U;
type Cf = (u: number, U: number) => Cam;
/** plan 1 : toi en entier -> zoom éclair sur ta tête (« Surtout ») -> dézoom (« ne bouge pas ») : le Long apparaît */
const hook: Cf = (u) => {
  const a = snap((u - 0.03) / 0.22, 1), b = snap((u - 0.36) / 0.16, 1), c = smooth((u - 0.52) / 0.48);
  const full: V3 = [0.1, 1.0, WAKE_Z - 2.9], head: V3 = [0.05, 1.5, WAKE_Z - 0.75], wide = lerp3([0.05, 0.7, WAKE_Z - 2.4], [0.0, 0.75, WAKE_Z - 2.0], c);
  const lf: V3 = [0, 0.95, WAKE_Z], lh: V3 = [0, 1.45, WAKE_Z], lw = lerp3([0, 5.5, WAKE_Z + 2.9], [0, 6.3, WAKE_Z + 2.9], c);
  return P(lerp3(lerp3(full, head, a), wide, b), lerp3(lerp3(lf, lh, a), lw, b), lp(lp(50, 40, a), 74, b));
};
/** drone au ras du sol dans le couloir du réveil (nuit) : on file entre les murs, des Longs passent */
const droneLow = (x0: number, x1: number, y: number, sway: number): Cf => (u, U) => {
  const x = lp(x0, x1, u), z = WAKE_Z + sway * Math.sin(u * 5 + U), d = Math.sign(x1 - x0);
  return P([x, y + 0.08 * Math.sin(u * 23), z], [x + d * 20, y + 2.2, WAKE_Z - sway * Math.sin(u * 5 + U + 0.6)], 66, 0.07 * Math.sin(u * 4));
};
/** chaque scène (rôle) découpée en sous-plans : [indice du premier mot (-1 = début de scène), caméra(u du sous-plan, U de la scène)] */
const CUTS: Record<number, [number, Cf][]> = {
  1: [[-1, hook]],
  2: [[-1, (u) => P(lerp3([0.02, 1.05, WAKE_Z - 1.25], [0.02, 0.95, WAKE_Z - 1.3], u), [0, 0, WAKE_Z - 1.42], 38)]],
  3: [[-1, (u) => P(lerp3([-0.4, 1.2, WAKE_Z - 1.0], [-3, H + 3.5, WAKE_Z + 0.4], glide(u)), lerp3([0, 0, WAKE_Z - 1.42], [30, H * 0.6, WAKE_Z], glide(u)), 50)],
      [9, (u) => { const x = lp(-2, -30, u); return P([x, 9.6 + 0.3 * Math.sin(u * 6), WAKE_Z + 0.3 * Math.sin(u * 4)], [x - 30, 3.5, WAKE_Z], 62, -0.05 + 0.1 * u); }]],   // drone au ras des murs
  4: [[-1, (u) => pullBack(Math.min(1, u * 1.1))]],
  5: [[-1, (u) => { const a = -0.6 + 2.0 * smooth(u); return P([YOU_WAKE[0] + 3.4 * Math.sin(a), 1.55, YOU_WAKE[2] + 3.4 * Math.cos(a)], yH(YOU_WAKE, 1.25), 36); }],
      [26, (u) => P(lerp3([0.05, 1.52, WAKE_Z - 0.95], [0.02, 1.5, WAKE_Z - 0.78], u), [0, 1.45, WAKE_Z], 38, 0.04)]],
  6: [[-1, (u) => { const p = lerp3([-40, 12, WAKE_Z - 18], [-14, 11, WAKE_Z - 58], u); return P(p, [p[0] + 14, 2, p[2] - 30], 60, 0.06); }],   // drone rapide au-dessus du labyrinthe
      [34, (u) => XL([-60 + 25 * u, 55, WAKE_Z + 70], [-8 + 12 * u, 0, WAKE_Z - 10], 46)]],
  7: [[-1, (u) => XL([-30 + 10 * u, 55, WAKE_Z + 70], [10 + 5 * u, 0, WAKE_Z - 10], 46 - 4 * u)]],
  8: [[-1, (u) => XL([0, 60, WAKE_Z + 30], [0, 0, WAKE_Z - 4], 52 - 10 * snap(u, 0.5))]],
  9: [[-1, (u) => P(lerp3([2.5, 0.45, WAKE_Z - 2.2], [2.0, 0.5, WAKE_Z - 2.0], u), [-8, 2.2, WAKE_Z + 0.5], 62, -0.07)]],   // au sol : un bloc glisse et ferme le couloir
  10: [[-1, droneLow(34, -6, 1.1, 1.2)]],                                                                                    // drone au ras du sol : les Longs sortent
  11: [[-1, (u) => P([4.5, 0.9, WAKE_Z - 1.6], lerp3([13, 1.5, WAKE_Z + 0.4], [12.5, 9.6, WAKE_Z + 0.4], glide(Math.min(1, u * 1.3))), 62)],
       [55, (u) => P(lerp3([9.0, 8.4, WAKE_Z - 3.0], [10.7, 9.2, WAKE_Z - 2.0], snap(u, 0.35)), [13, 9.5, WAKE_Z + 0.4], lp(50, 30, snap(u, 0.35)))]],   // zoom éclair sur la tête sans visage
  12: [[-1, droneLow(-58, -26, 0.6, 1.6)],
       [61, (u) => P(lerp3([-21.0, 1.25, WAKE_Z - 3.0], [-21.3, 1.3, WAKE_Z - 2.6], u), lerp3([-22, 1.55, WAKE_Z - 1.0], [-23.5, 5.5, WAKE_Z + 1], smooth(u)), 58, 0.05)]],   // un jeune figé, le Long penché derrière lui
  13: [[-1, (u) => XL(lerp3([0, 150, 110], [0, 42, 44], glide(Math.min(1, u * 1.15))), lerp3([0, 0, 10], [0, 0, -2], u), 50)]],
  14: [[-1, (u) => P(lerp3([-7, 0.9, 4], [-4, 1.0, 3.2], smooth(u)), yH(FIRE, 1.2), 46)],
       [72, (u) => P(lerp3([1.7, 0.55, -3.5], [1.3, 0.6, -3.9], u), [0, 0.6, -6], 46)],                                    // détail : le feu, les étincelles
       [75, (u) => P(lerp3([0.6, 1.7, 4.4], [0.5, 1.65, 3.0], smooth(u)), [0, 1.3, -6], 46)]],
  15: [[-1, (u) => P(lerp3([SX - 3, 0.4, SZ + 4], [SX - 2.6, 0.5, SZ + 3.6], u), [SX, 10.5, SZ], 62, 0.14)],                   // contre-plongée penchée sur le pylône
       [85, (u) => P(lerp3([SX - 4.5, 8.6, SZ + 5.5], [SX - 1.9, 10.2, SZ + 2.5], snap(u, 0.3)), [SX - 0.7, 10.6, SZ], 40)],   // zoom éclair sur le pavillon
       [88, (u) => P(lerp3([7, 1.1, -7], [8.4, 1.3, -10.5], smooth(u)), [SX, 10.5, SZ], 44 - 8 * smooth(u))]],
  16: [[-1, (u) => P(lerp3([-4, 1.4, 4], [-3, 1.3, 1.5], smooth(u)), [0, 1.0, -4], 40)],
       [100, (u) => P(lerp3([4.3, 1.52, -5.1], [4.0, 1.5, -5.2], u), [3.04, 1.48, -5.38], 36)],                          // gros plan : yeux ouverts, figé
       [103, (u) => P(lerp3([-0.62, 1.5, -1.6], [-0.55, 1.5, -1.9], u), [-0.39, 1.45, -2.93], 32, 0.06)]],                 // très gros plan : il tremble
  17: [[-1, (u) => P(lerp3([1.5, 1.5, NAMES_Z + 13], [0.8, 1.4, NAMES_Z + 10], smooth(u)), [0, 3, NAMES_Z], 52)],
       [110, (u) => P(lerp3([0, 1.1, NAMES_Z + 7], [0, 6.6, NAMES_Z + 7], glide(u)), lerp3([0, 1.2, NAMES_Z], [0, 7.4, NAMES_Z], glide(u)), 46)],
       [115, (u) => P(lerp3([-4.2, 0.65, NAMES_Z + 2.0], [-4.35, 0.6, NAMES_Z + 1.6], u), [-4.6, 0.6, NAMES_Z + 0.4], 40)]],   // la bougie s'éteint
  18: [[-1, (u) => P(lerp3([0.3, 1.66, 23.4], [0.1, 1.58, 21.8], snap(u, 0.3)), [0, 1.48, 20], lp(46, 32, snap(u, 0.3)))]],
  19: [[-1, (u, U) => P([0.4, 0.5, yWalk(U) + 2.2], [0, 1.2, yWalk(U) - 6], 58)],                                        // au ras du sol, derrière toi
       [129, (u, U) => P([2.3, 1.2, yWalk(U) + 0.5 - 1.5 * u], [0, 1.1, yWalk(U) - 1.5], 48)],                           // travelling latéral
       [135, (u, U) => XL(lerp3([14, 22, yWalk(U) + 22], [20, 34, yWalk(U) + 30], u), [0, 0, yWalk(U)], 46)],
       [136, (u) => XL(lerp3([40, 26, 128], [52, 70, 160], smooth(u)), lerp3([0, 0, 118], [0, 0, 80], smooth(u)), 46)]],
  20: [[-1, (u, U) => P(add([SX - 2.6, 9.2, SZ + 3.4], sh(U, 0.12)), [SX, 10.8, SZ], 34 - 6 * u, 0.1)],                   // la sirène hurle (secousse)
       [140, (u, U) => P(add([0.05, 1.55, 91.05], sh(U, 0.03, 140)), [0, 1.48, 90], lp(44, 32, snap(u, 0.25)), -0.06)]],   // ton sursaut
  21: [[-1, (u, U) => { const z = yRun(U) + 0.9; return P([0.25, 0.95 + 0.05 * Math.sin(u * 40), z + 3.4], [0, 1.4, z - 14], 56); }],
       [143, (u, U) => { const z = yRun(U); return P([0.1, 1.25 + 0.04 * Math.sin(u * 50), z - 3.2], [0, 1.2, z], 50); }],   // de face : tu cours vers nous
       [150, (u, U) => { const z = yRun(U); return P([0.15, 1.6 + 0.06 * Math.sin(u * 45), z - 0.6], [0, 2.2, ENTRY_Z], 50, 0.03 * Math.sin(u * 20)); }]],   // ton regard : l'entrée
  22: [[-1, (u) => P(lerp3([0, 2.2, 74], [0, 2.4, 70], smooth(u)), [0, 3.2, ENTRY_Z], 40)],
       [155, (u) => P(lerp3([0.6, 1.0, ENTRY_Z + 4.5], [0.4, 1.1, ENTRY_Z + 3.6], u), [-0.6, 1.4, ENTRY_Z], 38, 0.05)]],    // gros plan : les blocs qui se rejoignent
  23: [[-1, (u) => P([0.6, 1.45, YOU_RUN_Z + 0.4], lerp3([0, 2.5, LR], [0, 6.0, LR], smooth(u)), 62)],
       [162, (u) => P(lerp3([1.6, 0.45, LR + 5.5], [1.3, 0.5, LR + 4.8], u), [0, 3.4, LR], 64, -0.08)],                    // au ras du sol : le corps qui se déplie
       [165, (u) => P(lerp3([-4, 2, LR + 15], [-3.4, 2.1, LR + 13], u), [0, 5.2, LR], 48)]],
  24: [[-1, (u) => P(lerp3([0.8, 9.0, LR - 5.6], [0.6, 9.0, LR - 5.0], smooth(u)), [0, 9.1, LR], 36)],
       [170, (u) => P(lerp3([0.6, 9.0, LR - 4.8], [0.3, 9.05, LR - 2.8], snap(u, 0.25)), [0, 9.1, LR], lp(36, 24, snap(u, 0.25)))]],   // zoom éclair sur la fente
  25: [[-1, (u) => P(lerp3([-2.3, 4.5, 74], [-2.2, 4.8, 72], smooth(u)), [0.5, 3.4, 44], 52)],
       [176, (u) => P(lerp3([0.7, 0.25, YOU_RUN_Z - 1.0], [0.6, 0.25, YOU_RUN_Z - 0.9], u), [0, 0.2, YOU_RUN_Z], 46)]],     // tes pieds, figés
  26: [[-1, (u) => P(lerp3([0.25, 1.62, YOU_RUN_Z - 2.3], [0.2, 1.6, YOU_RUN_Z - 1.9], smooth(u)), [0, 1.46, YOU_RUN_Z], 34)],
       [183, (u) => P(lerp3([1.2, 1.6, YOU_RUN_Z + 1.5], [1.0, 1.6, YOU_RUN_Z + 1.2], u), [0, 2.5, ENTRY_Z], 34)],
       [187, (u) => XL(lerp3([6, 22, YOU_RUN_Z + 18], [8, 30, YOU_RUN_Z + 24], u), [0, 0, YOU_RUN_Z - 6], 48)],
       [190, (u) => P(lerp3([1.6, 4, YOU_RUN_Z + 6], [1.6, 3, YOU_RUN_Z - 8], u), [0, 3, ENTRY_Z], 54, 0.05)]],
  27: [[-1, (u) => P(lerp3([0.0, 1.7, YOU_RUN_Z + 3.4], [0.0, 1.8, YOU_RUN_Z + 2.8], smooth(u)), [0, 3.6, LR - 4], 54)],
       [198, (u) => P(lerp3([0.6, 1.0, ENTRY_Z + 4.5], [0.4, 1.1, ENTRY_Z + 3.8], u), [-0.3, 1.4, ENTRY_Z], 38, -0.05)],
       [200, (u) => P(lerp3([0.4, 9.0, LR - 3.4], [0.3, 9.05, LR - 2.8], u), [0, 9.1, LR], 26)],
       [202, (u) => P(lerp3([0.7, 0.25, YOU_RUN_Z - 1.0], [0.6, 0.25, YOU_RUN_Z - 0.9], u), [0, 0.2, YOU_RUN_Z], 46)],
       [204, (u) => P(lerp3([0.25, 1.6, YOU_RUN_Z - 1.6], [0.2, 1.58, YOU_RUN_Z - 1.3], u), [0, 1.46, YOU_RUN_Z], 32)],
       [207, (u) => XL(lerp3([4, 14, YOU_RUN_Z + 14], [6, 30, YOU_RUN_Z + 26], smooth(u)), [0, 2, (YOU_RUN_Z + LR) / 2], 50)]],
};
/** sous-plans (montage) : la scène donne le décor et ses animations (uOf), le sous-plan donne la caméra */
export type Cut = { sid: number; k: number; a: number; b: number };
export const CUTLIST: Cut[] = SHOTS.flatMap((s) => {
  const c = CUTS[ROLE[s.id]], st = c.map(([w], k) => (k === 0 || w < 0 ? s.a : Math.round((WORDS[w].s - 2 / FPS) * FPS)));
  return c.map((_, k) => ({ sid: s.id, k, a: st[k], b: k + 1 < c.length ? st[k + 1] : s.b }));
});
export const cutAt = (f: number) => CUTLIST.find((c) => f >= c.a && f < c.b) ?? CUTLIST[CUTLIST.length - 1];
export const camAt = (sid: number, f: number): Cam => {
  const ct = cutAt(f), cf = CUTS[ROLE[sid]][ct.sid === sid ? ct.k : 0][1];
  const c = cf(clamp01((f - ct.a) / Math.max(1, ct.b - ct.a)), uOf(sid, f)), a = c.far > 1000 ? 0.03 : 0.012, n = f * 0.021 + sid * 3.1;
  return { ...c, look: [c.look[0] + a * Math.sin(n * 2.3), c.look[1] + a * Math.sin(n * 1.7 + 1), c.look[2] + a * Math.sin(n * 1.1)] };
};
/** flou de profondeur (px à 1080 à l'infini) */
export type Dof = { cInf: number; focus?: V3 };
const DOFS: Record<number, number> = { 1: 6, 2: 14, 3: 6, 4: 1, 5: 12, 6: 2, 7: 2, 8: 2, 9: 2, 10: 3, 11: 8, 12: 10, 13: 2, 14: 12, 15: 10, 16: 12, 17: 8, 18: 14,
  19: 2, 20: 10, 21: 8, 22: 6, 23: 8, 24: 12, 25: 4, 26: 14, 27: 10 };
/** plan 1 : bascule de netteté de ton visage vers la tête du Long, juste avant « ne bouge pas » */
export const HOOK_RACK = (t: number) => smooth((t - (WORDS[1].s - 0.25)) / 0.35);   // calé sur « ne bouge pas »
/** plan 1 : le Long se penche au-dessus de toi en pivotant sur l'arête (rad) ; HOOK_M = agrandissement ; HOOK_HEAD = hauteur de la tête au-dessus de l'arête */
export const HOOK_M = 1.5, HOOK_HEAD = 245 * 0.00216 * LONG_K * HOOK_M;
export const hookLean = (t: number) => 0.22 + 0.36 * smooth(t / WORDS[4].s);
const hookHead = (t: number): V3 => [0.2, H + HOOK_HEAD * Math.cos(hookLean(t)), WAKE_Z + 2.93 - HOOK_HEAD * Math.sin(hookLean(t))];
export const dofAt = (sid: number, f = 0): Dof => ROLE[sid] === 1
  ? { cInf: 6, focus: lerp3([0, 1.48, WAKE_Z], hookHead(f / FPS), 0.35 * HOOK_RACK(f / FPS)) }
  : { cInf: DOFS[ROLE[sid]] ?? 8 };
