// « Le Puits » — épisode 1 : 20 scènes calées sur la voix (words.json, voix Fish générée le 2026-11-19), découpées en sous-plans (CUTS).
// Monde (mètres) : le puits au centre (0, 0, 0), margelle sur deux marches ; grande place pavée (rayon PLAZA) ; ville de terre en anneaux,
// 8 rues rayonnantes (dont la rue du marché vers +z) ; palmeraie et canaux turquoise ; dunes rouges au-delà de DUNE_R.
export const FPS = 30;
export type V3 = [number, number, number];
export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => { const u = clamp01(x); return u * u * (3 - 2 * u); };
export const glide = (u: number) => { const x = clamp01(u); return x * x * x * (x * (6 * x - 15) + 10); };
export const lerp3 = (a: V3, b: V3, u: number): V3 => [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u];
export const hash = (i: number, s = 0) => { const v = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return v - Math.floor(v); };

export const PLAZA = 24, CITY_R = 250, GROVE_R = 340, DUNE_R = 360;
export const STEP_H = 0.4, MARG_R = 1.55, MARG_H = 0.95, SHAFT_R = 1.05, SHAFT_D = 46;   // marches, margelle, puits
export const TOP_Y = STEP_H + MARG_H;                                                    // dessus de la margelle
export const TOWER: V3 = [8, 0, -7], TOWER_H = 11;                                       // tour du cor
export const FRESCO: V3 = [-9, 3.2, -15.4];                                              // fresque de Celui d'en bas (mur face +z)
export const ELDERS: V3[] = [[-1.4, STEP_H, -2.7], [0, STEP_H, -3.0], [1.4, STEP_H, -2.7]];
export const CHIEF: V3 = [0, 0, 4.0];                                                    // l'Ancien qui tient le sac du tirage
export const BAG: V3 = [0.26, 0.98, 4.32];
export const QUEUE_Z0 = 5.0;                                                             // file des enfants (x = 0, vers +z)
export const YOU: V3 = [2.3, 0, 6.6];                                                    // toi, au premier rang de la foule
export const BRO_STREET: V3 = [1.3, 0, 34];                                              // ton petit frère qui joue dans la rue du marché
export const RIM: V3 = [0.55, STEP_H, 2.0];
export const STELE: V3 = [-4.4, 0, -3.6];                                                 // stèle de la règle (texte diégétique)                                              // ton frère au bord du puits (scène 15)
/** hauteur des dunes (0 dans l'oasis) */
export const duneH = (x: number, z: number) => {
  const r = Math.hypot(x, z), k = smooth((r - DUNE_R) / 160);
  if (k <= 0) return 0;
  return k * (18 * (0.5 + 0.5 * Math.sin(0.012 * x + 0.005 * z)) * (0.6 + 0.4 * Math.sin(0.004 * x - 0.009 * z + 1)) + 8 * (0.5 + 0.5 * Math.sin(0.023 * z - 0.011 * x + 2)) + 2.5 * Math.sin(0.05 * x + 0.03 * z));
};

// ---------------- temps (voix) ----------------
import RAW from "./words.json";
export const VOICE_AT = 0.15;
export type W = { w: string; s: number; e: number; q?: number };
export const WORDS: W[] = (RAW as W[]).map((w) => ({ ...w, s: w.s + VOICE_AT, e: w.e + VOICE_AT }));
/** premier mot de chaque scène (indice dans words.json) */
const ANCH = [0, 1, 15, 23, 36, 45, 58, 67, 81, 89, 105, 114, 130, 134, 143, 168, 178, 179, 181, 192];
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
/** début de la musique du tirage (cor) : sur « retentit » */
export const HORN_AT = WORDS[14].s;

/** lumière : 0 = aube poussiéreuse, 1 = nuit aux lanternes (tirage, descente, toc toc) — style VIDEO_01 */
export const LIGHT: Record<number, 0 | 1 | 2> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11: 0, 12: 1, 13: 1, 14: 1, 15: 1, 16: 1, 17: 1, 18: 1, 19: 1, 20: 1 };
/** heure affichée dans le HUD (comme VIDEO_01) */
export const clockAt = (t: number) => { const m = t < tW(114) ? 5 * 60 + 41 + Math.floor(t / 9) : 21 * 60 + 12 + Math.floor((t - tW(114)) / 6);
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`; };
/** réserve d'eau affichée dans le HUD (%) */
export const waterAt = (t: number) => (t < tW(105) ? 34 : 12);

// ---------------- caméras ----------------
export type Cam = { pos: V3; look: V3; fov: number; roll: number; near: number; far: number };
const P = (pos: V3, look: V3, fov = 40, roll = 0, near = 0.05, far = 1500): Cam => ({ pos, look, fov, roll, near, far });
const XL = (pos: V3, look: V3, fov = 45): Cam => P(pos, look, fov, 0, 0.5, 9000);
const snap = (u: number, k = 0.3) => 1 - Math.pow(1 - clamp01(u / k), 3);
const lp = (a: number, b: number, u: number) => a + (b - a) * u;
const add = (p: V3, d: V3): V3 => [p[0] + d[0], p[1] + d[1], p[2] + d[2]];
const ring = (a: number, r: number, y: number): V3 => [r * Math.sin(a), y, r * Math.cos(a)];   // a = 0 : côté +z
type Cf = (u: number, U: number) => Cam;
const T = TOWER, F = FRESCO;
/** drone au ras des dunes (scène 1) : il suit le relief */
const duneDrone: Cf = (u) => { const x = lp(60, 24, u), z = lp(1620, 1260, u), y = duneH(x, z) + 4.5 + 2 * u;
  return XL([x, y, z], [x * 0.6, duneH(x, z - 200) + 8, z - 260], 58); };
/** passage de la crête : l'oasis apparaît (scène 2) */
const crest: Cf = (u) => { const k = glide(u), z = lp(1180, 560, k), x = lp(22, 8, k), y = Math.max(duneH(x, z) + 6, lp(14, 120, k * k));
  return XL([x, y, z], lerp3([0, 18, 600], [0, 0, 0], smooth(u * 1.4)), 52 - 6 * k); };
/** chaque scène découpée en sous-plans : [indice du premier mot (-1 = début de scène), caméra(u du sous-plan, U de la scène)] */
const CUTS: Record<number, [number, Cf][]> = {
  1: [[-1, duneDrone]],
  2: [[-1, crest],
      [10, (u) => P(lerp3(add(T, [-5.5, TOWER_H + 0.6, 6.5]), add(T, [-3.6, TOWER_H + 1.2, 4.2]), smooth(u)), add(T, [0, TOWER_H + 1.6, 0]), 44, 0.05)]],   // le joueur de cor en haut de la tour
  3: [[-1, (u) => P(lerp3([0.4, 7, 10], [0.05, 3.4, 2.6], snap(u, 0.35)), [0, STEP_H + 0.4, 0], lp(50, 38, snap(u, 0.35)))],                       // zoom éclair sur la bouche noire du puits
      [19, (u) => P(lerp3([2.4, 2.6, 23], [2.0, 2.4, 21], u), [0, 1.2, 0], 40, -0.03)]],                                                                // la place, le puits au loin, les gens se figent
  4: [[-1, (u) => P([lp(0.9, 0.4, u), 1.7, lp(52, 49, u)], [0, 1.3, 30], 48)],                                                         // le marché figé
      [26, (u) => P(lerp3([-1.6, 1.7, 30.8], [-1.3, 1.65, 31.4], u), [1.6, 1.5, 28.6], 40)],                                                           // un marchand, une porteuse d'eau qui tournent la tête
      [29, (u) => P(lerp3([2.9, 1.25, 36.6], [2.6, 1.15, 36.1], u), add(BRO_STREET, [0, 0.8, 0]), 42)],                                                   // ton petit frère
      [33, (u) => P(lerp3([1.9, 0.35, 35.2], [1.85, 0.3, 35.0], u), add(BRO_STREET, [0.55, 0.1, 0.35]), 44, 0.06)]],                                     // la toupie qui tombe et roule
  5: [[-1, (u) => XL(lerp3([26, 18, 90], [190, 240, 420], glide(u)), lerp3([0, 4, 10], [0, 0, -30], u), 50)],
      [40, (u) => XL(lerp3([-260, 210, 300], [-200, 300, 380], u), [0, 0, -40], 46)]],                                                                  // dix mille personnes : la ville entière
  6: [[-1, (u) => XL([4, lp(260, 190, smooth(u)), 26], [0, 0, 0], 48)],                                                                               // toutes les rues convergent vers le puits
      [48, (u) => XL(lerp3([-34, 26, 74], [-28, 22, 64], u), [0, 2, 0], 44)],
      [51, (u) => P(lerp3([-4.6, 2.4, 19], [-4.1, 2.3, 16], u), [0, 1.2, 5], 46)]],                                                                    // les files de porteurs de jarres vers le puits
  7: [[-1, (u) => P([0.02, lp(6.5, -4, glide(u)), 0.03], [0, -40, 0], lp(62, 54, u))]],                                                              // plongée verticale dans le puits
  8: [[-1, (u) => P(lerp3([3.6, 0.55, -0.2], [3.2, 0.6, -0.6], smooth(u)), [0, 1.95, -2.9], 50)],                                                          // les trois Anciens, contre-plongée
      [73, (u) => P(lerp3(add(F, [-3.2, -1.2, 7.5]), add(F, [2.2, -1.0, 7.0]), smooth(u)), add(F, [lp(-1.2, 0.8, u), 0, 0]), 48)],                         // la fresque
      [76, (u) => P(lerp3(add(F, [0.4, 0.6, 4.2]), add(F, [0.3, 0.7, 3.4]), u), add(F, [0.2, 0.7, 0]), 40)]],
  9: [[-1, (u) => P(lerp3([0.1, TOP_Y + 1.0, 2.0], [0.05, TOP_Y + 0.8, 1.7], u), [0, TOP_Y - 0.9, 0.4], 44)],                                           // la margelle : trait d'eau sec
      [85, (u) => P([0.03, TOP_Y + 0.6 - 0.3 * u, 0.25], [0, -12, -0.2], lp(48, 40, u))]],                                                              // ombre d'une longue main au fond
  10: [[-1, (u) => P(lerp3(add(STELE, [0.4, 1.3, 4.6]), add(STELE, [0.35, 1.25, 4.0]), smooth(u)), add(STELE, [0, 1.25, 0]), 40)],          // la stèle : RÈGLE
       [94, (u) => P(lerp3([3.2, 1.2, 3.4], [2.9, 1.15, 3.1], u), [0.4, 0.95, 2.1], 46)],                                                                // un enfant s'approche du bord
       [99, (u) => P(lerp3([1.9, 0.28, 3.9], [1.8, 0.26, 3.7], u), [0.7, 0.45, 2.3], 50, 0.05)]],                                                        // ses pieds qui reculent
  11: [[-1, (u) => P(lerp3([0.5, 2.0, 2.6], [0.45, 2.05, 2.3], u), [0, 1.5, 0], 44)],                                                                    // la poulie, le seau qui remonte
       [110, (u) => P(lerp3([0.6, 2.1, 1.6], [0.55, 2.05, 1.4], u), [0.1, 1.8, 0], 40, 0.04)]],                                                         // le sable qui coule du seau
  12: [[-1, (u) => P(lerp3([-6.5, 3.4, 18], [-5.2, 3.0, 9], glide(u)), [0, 1.0, lp(8, 5, u)], 50, 0.04)],                                              // crépuscule : la file d'enfants
       [119, (u) => P(lerp3([-2.6, 1.3, 7.2], [-2.3, 1.25, 6.6], u), [0.2, 1.1, 4.4], 44)]],                                                          // l'Ancien et le sac
  13: [[-1, (u) => P(lerp3(add(BAG, [0.03, 0.42, 0.62]), add(BAG, [0.02, 0.32, 0.48]), u), add(BAG, [0, -0.16, 0]), 40)]],                                                    // dans le sac : pierres blanches, une noire
  14: [[-1, (u) => P(lerp3([-1.6, 1.0, 7.0], [-1.3, 0.95, 6.3], u), [0, 0.8, 4.6], 44)],                                                               // ton petit frère s'avance
       [137, (u) => P(lerp3(add(BAG, [-0.05, 0.62, 1.05]), add(BAG, [-0.04, 0.52, 0.9]), u), add(BAG, [0, -0.1, 0]), 42)],                                 // sa main plonge dans le sac
       [140, (u) => P(lerp3(add(BAG, [0, 0.2, 1.0]), add(BAG, [0, 0.16, 0.75]), snap(u, 0.3)), add(BAG, [0, 0.08, 0.3]), lp(44, 34, snap(u, 0.3)))]],   // zoom éclair : la pierre noire
  15: [[-1, (u) => P(lerp3(add(YOU, [0.15, 1.55, 1.9]), add(YOU, [0.12, 1.5, 1.4]), snap(u, 0.3)), add(YOU, [0, 1.4, 0]), lp(46, 38, snap(u, 0.3)))],     // ton visage : le choc
       [149, (u) => P(lerp3(add(RIM, [0.5, 1.25, 3.9]), add(RIM, [0.45, 1.22, 3.5]), smooth(u)), add(RIM, [0.35, 1.1, 0]), 40)],                         // il se penche vers toi
       [156, (u) => P(lerp3(add(RIM, [0.4, 1.1, 2.3]), add(RIM, [0.36, 1.08, 2.0]), u), add(RIM, [0.3, 1.05, 0]), 36)]],                            // « je toquerai deux fois »
  16: [[-1, (u) => P([0.05, TOP_Y + 1.5, 0.45], [0, -30, 0], 56)],                                                                                       // plongée : sa lanterne qui rapetisse
       [173, (u) => P(lerp3([0.25, 2.75, 1.2], [0.22, 2.72, 1.0], u), [0, 2.6, 0], 40, 0.05)]],                                                          // le couteau tranche la corde
  17: [[-1, (u) => XL(lerp3([9, 4.5, 15], [8.6, 4.6, 14.2], u), [0, 1.2, 0], 44)]],                                                                    // silence : la foule figée autour du puits
  18: [[-1, (u) => P([0.03, TOP_Y + 1.4 - 0.5 * u, 0.42], [0, -30, 0], lp(50, 32, smooth(u)))]],                                                        // zoom lent dans le noir du puits
  19: [[-1, (u) => { const a = lp(-1.1, -0.3, u); return P(ring(a, 3.6, 1.55), ring(a + 0.1, 6.5, 1.4), 46); }],                                          // les visages : personne ne réagit
       [184, (u) => P(lerp3([0.3, 2.35, 1.3], [0.25, 2.3, 1.05], u), [0, 1.75, -2.9], 40)],                                                              // les Anciens échangent un regard
       [189, (u) => P(lerp3(add(YOU, [-0.2, 1.52, -1.3]), add(YOU, [-0.15, 1.5, -1.0]), snap(u, 0.35)), add(YOU, [0, 1.46, 0]), lp(40, 30, snap(u, 0.35)))]],   // à part toi
  20: [[-1, (u) => P(lerp3(add(YOU, [0.8, 1.55, 2.6]), add(YOU, [0.7, 1.52, 2.2]), smooth(u)), add(YOU, [-1.0, 1.35, -3]), 46)],                        // toi au premier plan, la foule, le puits, les Anciens
       [208, (u) => XL(lerp3([5, 6, 16], [4, 9, 20], u), [0, 1, 0], 44)]],
};
/** sous-plans (montage) */
export type Cut = { sid: number; k: number; a: number; b: number };
export const CUTLIST: Cut[] = SHOTS.flatMap((s) => {
  const c = CUTS[ROLE[s.id]], st = c.map(([w], k) => (k === 0 || w < 0 ? s.a : Math.round((WORDS[w].s - 2 / FPS) * FPS)));
  return c.map((_, k) => ({ sid: s.id, k, a: st[k], b: k + 1 < c.length ? st[k + 1] : s.b }));
});
export const cutAt = (f: number) => CUTLIST.find((c) => f >= c.a && f < c.b) ?? CUTLIST[CUTLIST.length - 1];
export const camAt = (sid: number, f: number): Cam => {
  const ct = cutAt(f), cf = CUTS[ROLE[sid]][ct.sid === sid ? ct.k : 0][1];
  const c0 = cf(clamp01((f - ct.a) / Math.max(1, ct.b - ct.a)), uOf(sid, f)), a = c0.far > 2000 ? 0.03 : 0.012, n = f * 0.021 + sid * 3.1;
  const close = c0.far < 2000 && Math.hypot(c0.pos[0] - c0.look[0], c0.pos[1] - c0.look[1], c0.pos[2] - c0.look[2]) < 7 && c0.pos[1] > STEP_H;
  const zd = Math.min(1.2 * FPS, 0.75 * (ct.b - ct.a)), zk = close ? 1 - Math.pow(1 - clamp01((f - ct.a) / Math.max(1, zd)), 3) : 1;
  const c = { ...c0, fov: c0.fov * (0.55 + 0.45 * zk) };                                   // VIDEO_01 : départ très serré, zoom arrière fluide
  return { ...c, look: [c.look[0] + a * Math.sin(n * 2.3), c.look[1] + a * Math.sin(n * 1.7 + 1), c.look[2] + a * Math.sin(n * 1.1)] };
};
/** flou de profondeur (px à 1080 à l'infini) */
export type Dof = { cInf: number; focus?: V3 };
const DOFS: Record<number, number> = { 1: 3, 2: 3, 3: 12, 4: 18, 5: 2, 6: 3, 7: 6, 8: 18, 9: 12, 10: 18, 11: 18, 12: 16, 13: 22, 14: 20, 15: 22, 16: 8, 17: 10, 18: 6, 19: 22, 20: 20 };
/** point de netteté sur le sujet des plans rapprochés (sinon : le point visé par la caméra) */
export const dofAt = (sid: number, f = 0): Dof => {
  const id = ROLE[sid], ct = cutAt(f), k = ct.sid === sid ? ct.k : 0, head = (p: V3, h = 1.45): V3 => [p[0], p[1] + h, p[2]];
  const focus: V3 | undefined = id === 20 && k === 0 ? head(YOU) : id === 15 ? (k === 0 ? head(YOU) : [RIM[0] + 0.3, RIM[1] + 1.0, RIM[2] + 0.1]) : id === 19 && k === 2 ? head(YOU)
    : id === 14 && k === 0 ? [0, 0.85, QUEUE_Z0 - 0.3] : id === 12 && k === 1 ? head(CHIEF, 1.5) : id === 4 && k === 2 ? head(BRO_STREET, 1.0) : id === 10 && k === 1 ? [0.95, STEP_H + 1.0, 1.85] : undefined;
  return { cInf: DOFS[id] ?? 8, focus };
};
