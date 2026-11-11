// L'Arène, épisode 1 « Vingt-quatre » : plans, caméras, flou, secousses, calés sur productions/arene-ep01/voice/words.json.
// Monde : sol y = 0, tour au centre (0, 0, 0), 24 candidats en cercle (rayon RING), le héros (« tu ») sur le disque 0 en +z.
export const FPS = 30;
import WARP from "./warp.json";
export const TOTAL = 2092; // 69,7 s (voix v5 : narrateur B posé, 69,3 s)
/** la mise en scène a été réglée sur la voix v3 : chaque instant de la nouvelle voix est ramené au même mot de l'ancienne
 *  (interpolation linéaire entre débuts de mots) ; tout le reste (plans, caméras, flou, écrans) lit cette image « ancienne ». */
const WP = WARP as [number, number][];
export const oldTime = (t: number) => {
  if (t <= WP[0][0]) return t - WP[0][0] + WP[0][1];
  for (let i = 1; i < WP.length; i++) if (t <= WP[i][0]) { const [a0, b0] = WP[i - 1], [a1, b1] = WP[i]; return b0 + ((t - a0) * (b1 - b0)) / Math.max(1e-6, a1 - a0); }
  const [a, b] = WP[WP.length - 1]; return b + (t - a);
};
export const oldFrame = (f: number) => Math.min(2099, oldTime(f / 30) * 30);
export const RING = 22;
export type V3 = [number, number, number];
export const HERO: V3 = [0, 0, RING];
export const discPos = (i: number): V3 => { const a = (i / 24) * Math.PI * 2; return [Math.sin(a) * RING, 0, Math.cos(a) * RING]; };
export const BOY = 1; // disque du garçon (à droite du héros)

export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => { const u = clamp01(x); return u * u * (3 - 2 * u); };
export const glide = (u: number) => { const x = clamp01(u); return x * x * x * (x * (6 * x - 15) + 10); };
export const T = (f: number) => f / FPS;

export type Insert = "none" | "wrist";
export type ShotDef = { id: number; a: number; b: number; insert?: Insert };
// montage v2 (retours utilisateur) : inserts poignet raccourcis, plans 3/4/7 raccourcis, plan 9 réduit au mouvement,
// nouveaux plans (ids 21-28) : redressement POV, visage, grue dans la forêt, drone, écran des paris, travelling circulaire, ravitaillement
export const SHOTS: ShotDef[] = [
  { id: 1, a: 0, b: 108 },          // réveil au ras de l'herbe
  { id: 29, a: 108, b: 262 },       // depuis le centre, poussée rapide vers toi : tu regardes devant, puis baisses la tête vers ton bracelet
  { id: 3, a: 262, b: 370 },        // les autres se relèvent (travelling latéral)
  { id: 22, a: 370, b: 445 },       // visage d'un candidat perdu (arc lent)
  { id: 4, a: 445, b: 530 },        // le ciel trop lisse (contre-plongée)
  { id: 23, a: 530, b: 606 },       // grue à travers les pins : le plafond peint au-dessus de la forêt
  { id: 5, a: 606, b: 660 },        // haut-parleur dans un tronc
  { id: 6, a: 660, b: 798 },        // écran du ciel : bienvenue / 24
  { id: 7, a: 798, b: 900 },        // orbite haute : tirage au sort
  { id: 24, a: 900, b: 975 },       // derrière un drone qui filme les candidats
  { id: 25, a: 975, b: 1015 },      // écran du ciel : paris en cours
  { id: 8, a: 1015, b: 1090, insert: "wrist" }, // ton bracelet, ton compteur
  { id: 26, a: 1090, b: 1172 },     // travelling circulaire face aux candidats : combien sont encore en vie
  { id: 27, a: 1172, b: 1218, insert: "wrist" }, // il ne s'enlève pas (arrachage)
  { id: 9, a: 1218, b: 1338 },      // PLAN SIGNATURE : envolée POV -> plongée (mouvement seul)
  { id: 28, a: 1338, b: 1430 },     // glissé bas dans le ravitaillement : caisses, eau, armes, sacs
  { id: 10, a: 1430, b: 1500 },     // compte à rebours 60 sur la tour
  { id: 11, a: 1500, b: 1680 },     // la fille murmure
  { id: 12, a: 1680, b: 1765 },     // l'eau sous la lumière rouge
  { id: 13, a: 1765, b: 1845 },     // compte à rebours, visages figés
  { id: 14, a: 1845, b: 1902, insert: "wrist" }, // 24 -> 23
  { id: 15, a: 1902, b: 1960 },     // personne n'a bougé
  { id: 16, a: 1960, b: TOTAL },    // le choix : monolithe ou forêt
];
export const shotAt = (f: number) => SHOTS.find((s) => f >= s.a && f < s.b) ?? SHOTS[SHOTS.length - 1];

/** moments clés (s) */
/** plan 29 (images anciennes) : regard baissé, bras levé, écran du bracelet allumé (« Il affiche ») */
/** plan 1 (images anciennes) : tu ouvres les yeux sur « réveilles » */
export const WAKE = { half: 44, open: 48 };
/** plan 1 : pieds décalés vers l'extérieur de 0,84 m pour que le milieu du corps couché (1,7 m) soit au centre du socle */
export const LIE_SHIFT = 0.84;
export const HERO_POSE = { down: [170, 184], arm: [176, 192], lit: 206 };
export const AT = { stand0: 9.4, welcome: 22.2, count24: 23.7, bets: 32.7, tug: 39.6, sixty: 48.6, beep0: 59.0, drop23: 62.4, choice: 65.4 };
/** nombre affiché par le bracelet */
export const counter = (t: number) => (t >= AT.drop23 ? 23 : 24);
/** secondes restantes sur la tour (le compte démarre sur « démarre », 59,8 s) */
export const countdown = (t: number) => (t < 59.0 ? 60 : Math.max(0, 60 - Math.floor(t - 59.0)));

// ---------------- caméra ----------------
export type Cam = { pos: V3; look: V3; fov: number; roll: number };
type Shot = Partial<Cam> & { pos: V3; look: V3 };
type Key = { f: number; dur?: number; cut?: boolean; s: (f: number) => Shot };
const full = (c: Shot): Cam => ({ fov: 40, roll: 0, ...c });
const mixC = (a: Cam, b: Cam, k: number): Cam => ({
  pos: a.pos.map((v, i) => v + (b.pos[i] - v) * k) as V3, look: a.look.map((v, i) => v + (b.look[i] - v) * k) as V3,
  fov: a.fov + (b.fov - a.fov) * k, roll: a.roll + (b.roll - a.roll) * k,
});
const run = (keys: Key[], f: number) => {
  let cur = full(keys[0].s(f));
  for (let i = 1; i < keys.length; i++) {
    const k = keys[i];
    if (f < k.f) break;
    cur = k.cut ? full(k.s(f)) : mixC(cur, full(k.s(f)), glide((f - k.f) / (k.dur ?? 24)));
  }
  return cur;
};
/** poussée continue : la caméra glisse vers le point visé (0,2 %/image par défaut) — aucun plan figé */
const push = (f: number, f0: number, rate = 0.002) => Math.exp(-rate * Math.max(0, f - f0));
const dolly = (pos: V3, look: V3, k: number, rest: Partial<Cam> = {}): Shot =>
  ({ pos: [look[0] + (pos[0] - look[0]) * k, look[1] + (pos[1] - look[1]) * k, look[2] + (pos[2] - look[2]) * k], look, ...rest });
const lerp3 = (a: V3, b: V3, u: number): V3 => [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u];
const bez = (a: V3, c: V3, b: V3, s: number): V3 => { const r = 1 - s; return [0, 1, 2].map((i) => r * r * a[i] + 2 * r * s * c[i] + s * s * b[i]) as V3; };

const B = discPos(BOY);
/** trajectoire des drones (partagée avec world.ts) */
export const dronePos = (k: number, t: number): V3 => { const a = k * 1.3 + t * 0.12; return [Math.sin(a) * (14 + k * 3), 12 + k * 1.5 + Math.sin(t * 1.3 + k) * 0.3, Math.cos(a) * (14 + k * 3)]; };
const ringAt = (a: number, r: number, y: number): V3 => [Math.sin(a) * r, y, Math.cos(a) * r];
const C22 = discPos(21);
export const SPEAKER: V3 = [2.6, 2.3, RING + 6.4];
export const SKYSCREEN: V3 = [-70, 60, -130];
export const TOWER_SCREEN: V3 = [0, 5.2, 2.05];
export const WATER: V3 = [2.0, 0.4, 8.6];

const CAMS: Record<number, Key[]> = {
  // plan 1 : vue du ciel, plongée verticale rapide vers toi, allongé dans l'herbe (les candidats sont couchés, tête vers le centre)
  1: [{ f: 0, s: (f) => { const u = glide(f / 74), zc = RING + LIE_SHIFT - 1.25, h = 95 * Math.pow(2.4 / 95, u) - 0.35 * smooth((f - 74) / 34);
    return { pos: [0, h, zc + 0.05 * h], look: [0, 0, zc], fov: 40, roll: 0.7 * (1 - u) }; } }],
  29: [{ f: 108, s: (f) => { const u = glide((f - 108) / 58), v = smooth((f - 166) / 96);
    const far: V3 = [0.6, 4.2, 8.5], near: V3 = [0.12, 1.3, RING - 2.3], close: V3 = [0.08, 1.22, RING - 2.05];
    return { pos: lerp3(lerp3(far, near, u), close, v), look: lerp3([0, 1.0, RING], [0, 1.0, RING], v), fov: 40, roll: 0.02 * (1 - u) }; } }],
  2: [{ f: 108, s: (f) => dolly([0, 1.45, RING + 0.15], [0.05, 0.75, RING - 0.55], push(f, 108, 0.0012), { fov: 44 }) }],
  3: [
    { f: 262, s: (f) => { const u = (f - 262) / 108; return { pos: [-7 + 7 * u, 1.55, RING + 9], look: [-3 + 4.2 * u, 1.0, RING - 4], fov: 40 }; } },
  ],
  22: [{ f: 370, s: (f) => { const u = (f - 370) / 75, a0 = Math.atan2(C22[0], C22[2]) + 0.9 - 0.5 * u, d = 2.6 - 0.5 * u;
    const c: V3 = [C22[0], 1.45, C22[2]]; return { pos: [c[0] + Math.sin(a0) * d, 1.6, c[2] + Math.cos(a0) * d], look: c, fov: 36, roll: -0.03 }; } }],
  4: [{ f: 445, s: (f) => { const u = (f - 445) / 120; return { pos: [0, 1.4, RING + 0.3], look: [6 * Math.sin(0.5 + 0.4 * u), 40, RING - 30 - 8 * u], fov: 52, roll: 0.05 - 0.08 * u }; } }],
  23: [{ f: 530, s: (f) => { const u = glide((f - 530) / 76); return { pos: [36.5, 3.5 + 11 * u, 5 - 2 * u], look: [120, 9 + 7 * u, -12], fov: 48, roll: 0.03 }; } }],
  5: [{ f: 606, s: (f) => dolly([SPEAKER[0] - 0.6, SPEAKER[1] - 0.15, SPEAKER[2] - 1.5], SPEAKER, push(f, 606, 0.004), { fov: 38, roll: -0.04 }) }],
  6: [{ f: 660, s: (f) => { const u = (f - 660) / 138; return { pos: [0.4, 1.5, RING + 1], look: lerp3([-30, 26, -50], [-36, 31, -62], u), fov: 44 - 4 * u }; } }],
  7: [{ f: 798, s: (f) => { const a = 0.9 + (f - 798) * 0.0016; return { pos: [Math.sin(a) * 34, 8, Math.cos(a) * 34], look: [0, 9, 0], fov: 42 }; } }],
  24: [{ f: 900, s: (f) => { const t = f / FPS, d = dronePos(2, t), d2 = dronePos(2, t + 0.4), tx = d2[0] - d[0], tz = d2[2] - d[2], L = Math.hypot(tx, tz) || 1, R0 = Math.hypot(d[0], d[2]) || 1;
    const hx = (tx / L) * 0.35 - (d[0] / R0) * 0.95, hz = (tz / L) * 0.35 - (d[2] / R0) * 0.95, H = Math.hypot(hx, hz);
    const pos: V3 = [d[0] - (hx / H) * 6.5, d[1] + 2.4, d[2] - (hz / H) * 6.5];
    return { pos, look: [pos[0] + (hx / H) * 14, pos[1] - 6.5, pos[2] + (hz / H) * 14], fov: 42, roll: 0.05 * Math.sin(t * 0.9) }; } }],
  25: [{ f: 975, s: (f) => { const u = (f - 975) / 40; return { pos: [-0.6, 1.5, RING + 0.8], look: [SKYSCREEN[0] + 1 - 2 * u, SKYSCREEN[1] - 3, SKYSCREEN[2]], fov: 36 - 3 * u, roll: 0.02 }; } }],
  8: [{ f: 1015, s: (f) => dolly([0.05, 1.42, RING + 0.12], [0.08, 0.75, RING - 0.55], push(f, 1015, 0.0015), { fov: 42, roll: 0.02 }) }],
  // travelling circulaire : part face au candidat n° 3 puis glisse le long du cercle (2-3 candidats toujours dans le cadre)
  26: [{ f: 1090, s: (f) => { const u = clamp01((f - 1090) / 82), x = 4.4 * (0.15 * u + 0.85 * smooth(u)), th = 0.785 + (Math.PI / 12) * (x - (0.35 * Math.sin(2 * Math.PI * x)) / (2 * Math.PI)), a = th - 0.3; // ralentit sur chaque visage, jamais à l'arrêt
    return { pos: ringAt(a, 19.2, 1.55), look: ringAt(th, RING, 1.35), fov: 42, roll: -0.03 }; } }],
  27: [{ f: 1172, s: (f) => dolly([0.05, 1.42, RING + 0.12], [0.08, 0.75, RING - 0.55], push(f, 1015, 0.0015), { fov: 42, roll: 0.02 }) }],
  28: [{ f: 1338, s: (f) => { const u = (f - 1338) / 92, a = 2.2 + 0.55 * u; return { pos: ringAt(a, 10.5 - 0.6 * u, 1.75), look: ringAt(a + 0.35, 6.4, 0.55), fov: 40, roll: 0.03 }; } }],
  9: [{ f: 1218, s: (f) => {
    const a: V3 = [0, 1.6, RING + 0.4], la: V3 = [0, 3.5, 0];
    const s = glide((f - 1218) / 120), pos = bez(a, [0, 22, RING + 4], [0.5, 40, 2.5], s);
    return { pos, look: lerp3(la, [0, 0, 0], s), fov: 44 + 8 * s, roll: 0.5 * s * 0.1 + Math.max(0, f - 1360) * 0.0012 };
  } }],
  10: [{ f: 1430, s: (f) => dolly([0.8, 4.6, TOWER_SCREEN[2] + 4.2], TOWER_SCREEN, push(f, 1430, 0.004), { fov: 40, roll: 0.04 }) }],
  11: [
    { f: 1500, s: (f) => dolly([B[0] - 2.6, 1.55, B[2] + 1.2], [B[0], 1.45, B[2]], push(f, 1500, 0.0022), { fov: 38 }) },
    { f: 1590, dur: 30, s: (f) => dolly([B[0] - 1.9, 1.5, B[2] + 0.8], [B[0], 1.5, B[2]], push(f, 1590, 0.0025), { fov: 36, roll: -0.04 }) },
  ],
  12: [{ f: 1680, s: (f) => dolly([WATER[0] - 0.9, 1.7, WATER[2] + 2.8], [WATER[0], WATER[1] + 0.1, WATER[2]], push(f, 1680, 0.004), { fov: 38, roll: 0.04 }) }],
  13: [
    { f: 1765, s: (f) => { const p = discPos(23); return dolly([p[0] * 0.9, 1.6, p[2] * 0.9], [p[0], 1.55, p[2]], push(f, 1765, 0.005), { fov: 36 }); } },
    { f: 1792, cut: true, s: (f) => dolly([3, 2, 12], [0, 11, 0], push(f, 1792, 0.004), { fov: 40, roll: -0.05 }) },
    { f: 1818, cut: true, s: (f) => { const p = discPos(3); return dolly([p[0] * 0.9, 1.55, p[2] * 0.9], [p[0], 1.5, p[2]], push(f, 1818, 0.005), { fov: 36, roll: 0.04 }); } },
  ],
  14: [{ f: 1845, s: (f) => dolly([0.03, 1.4, RING + 0.12], [0.06, 0.75, RING - 0.52], push(f, 1845, 0.003), { fov: 40 }) }],
  15: [{ f: 1902, s: (f) => dolly([10, 9, RING + 16], [0, 1, 4], push(f, 1902, 0.0015), { fov: 46 }) }],
  16: [{ f: 1960, s: (f) => dolly([0, 1.6, RING + 1.5], [0, 3.2, 0], push(f, 1960, 0.0018), { fov: 50 }) }],
};

/** secousses : signe alterné à chaque image, amorties en 7 images (bips du compte à rebours, 23, arrachage) */
const KICKS: [number, number][] = [[AT.tug, 0.6], [59.0, 0.5], [60.0, 0.5], [61.0, 0.5], [AT.drop23, 0.9]];
export const kickAt = (t: number) => {
  let a = 0;
  for (const [t0, g] of KICKS) { const n = Math.floor((t - t0) * FPS + 1e-6); if (n >= 0 && n < 7) a += g * (n % 2 ? -1 : 1) * (1 - n / 7) ** 1.5; }
  return a;
};
export const camAt = (id: number, f: number): Cam => {
  const c = run(CAMS[id], f), a = kickAt(T(f));
  if (!a) return c;
  const d: V3 = [c.look[0] - c.pos[0], c.look[1] - c.pos[1], c.look[2] - c.pos[2]];
  const L = Math.hypot(...d), h = Math.hypot(d[0], d[2]) || 1, m = (3 / 640) * Math.tan((c.fov * Math.PI) / 360) * L * a;
  return { ...c, look: [c.look[0] - (d[2] / h) * m, c.look[1] + 0.6 * m, c.look[2] + (d[0] / h) * m], roll: c.roll + a * 0.004 };
};

// ---------------- flou de profondeur (px à 1080 pour l'infini ; 0 = net) ----------------
export type Dof = { f: number; cInf: number; focus?: V3 };
export const DOF: Dof[] = [
  { f: 0, cInf: 5 },                  // plongée du ciel : focus = point visé
  { f: 108, cInf: 9 },                // poussée vers toi : focus = point visé
  { f: 262, cInf: 6, focus: [0, 1.2, RING - 3] },
  { f: 370, cInf: 14 },               // visage
  { f: 445, cInf: 0 },
  { f: 606, cInf: 14 },
  { f: 660, cInf: 0 },
  { f: 900, cInf: 0 },                // drone
  { f: 975, cInf: 0 },
  { f: 1015, cInf: 16 },
  { f: 1090, cInf: 10 },              // travelling circulaire
  { f: 1172, cInf: 16 },
  { f: 1218, cInf: 0 },
  { f: 1338, cInf: 9 },               // ravitaillement
  { f: 1430, cInf: 10 },
  { f: 1500, cInf: 13 },
  { f: 1680, cInf: 14 },
  { f: 1765, cInf: 12 },
  { f: 1792, cInf: 0 },
  { f: 1818, cInf: 12 },
  { f: 1845, cInf: 16 },
  { f: 1902, cInf: 0 },
  { f: 1960, cInf: 5 },
];
export const dofAt = (f: number) => { let d = DOF[0]; for (const x of DOF) if (f >= x.f) d = x; return d; };
