// Plans communs aux trois épisodes (consigne utilisateur du 2026-11-13) :
//  - CITY (rôle 60) : contre-plongée au pied de la tour, la caméra monte puis recule très loin jusqu'à l'échelle de la ville :
//    ville sombre, beaucoup plus basse, et l'immense tour éclairée au milieu ;
//  - DIVE (rôle 61) : on part du couloir du sous-sol (~9 m avant le fond), la caméra file vite entre les portes, passe la porte,
//    bascule vers le bas et descend au centre de la cage d'escalier, étage après étage, vers la lueur rouge.
export const ROLE_CITY = 60, ROLE_DIVE = 61;
type V3 = [number, number, number];
export type OpenCam = { pos: V3; look: V3; fov: number; roll: number; near: number; far: number };
const c01 = (x: number) => Math.max(0, Math.min(1, x));
const sm = (x: number) => { const u = c01(x); return u * u * (3 - 2 * u); };
const gl = (x: number) => { const u = c01(x); return u * u * u * (u * (6 * u - 15) + 10); };
const mixv = (a: V3, b: V3, u: number): V3 => [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u];

/** grand recul : distance interpolée en log (vitesse perçue constante), hauteur qui monte d'abord le long de la façade */
export const cityCam = (u: number): OpenCam => {
  const k = 0.35 * u + 0.65 * gl(u);
  const d = 24 * Math.pow(950 / 24, k), yaw = -0.1 - 0.5 * sm(k), y = 1.6 + 430 * Math.pow(k, 0.8);
  const C: V3 = [12, 0, 32];
  const pos: V3 = [C[0] + d * Math.sin(yaw), y, C[2] + d * Math.cos(yaw)];
  const look = mixv([2, 190, 2], [14, 70, 26], sm(k * 1.15));
  return { pos, look, fov: 52 - 8 * sm(k), roll: 0, near: 0.6, far: 9000 };
};

/** couloir -> porte -> plongée au centre de la cage (vide central x ∈ ±0,8, z ∈ [-33,2 ; -31,2]) : courbe de Bézier cubique */
export const diveCam = (u: number, CY: number): OpenCam => {
  const P0: V3 = [0.05, CY + 1.55, -21.5], P1: V3 = [0, CY + 1.5, -34.5], P2: V3 = [0, CY + 1.3, -32.2], P3: V3 = [0, CY - 27, -32.2];
  const t = 0.45 * u + 0.55 * sm(u);
  const b = (a: number, p1: number, p2: number, d: number, s: number) => { const r = 1 - s; return r * r * r * a + 3 * r * r * s * p1 + 3 * r * s * s * p2 + s * s * s * d; };
  const db = (a: number, p1: number, p2: number, d: number, s: number) => { const r = 1 - s; return 3 * r * r * (p1 - a) + 6 * r * s * (p2 - p1) + 3 * s * s * (d - p2); };
  const pos: V3 = [0, 0, 0], tg: V3 = [0, 0, 0];
  for (let i = 0; i < 3; i++) { pos[i] = b(P0[i], P1[i], P2[i], P3[i], t); tg[i] = db(P0[i], P1[i], P2[i], P3[i], t); }
  const n = Math.hypot(...tg) || 1, down = sm((t - 0.35) / 0.4);
  // regard : le long de la trajectoire, puis franchement vers le bas (léger biais -z : le haut de l'image reste « devant »)
  const dir: V3 = [tg[0] / n * (1 - down), tg[1] / n * (1 - down) - down, tg[2] / n * (1 - down) - 0.04];
  const look: V3 = [pos[0] + dir[0] * 4, pos[1] + dir[1] * 4, pos[2] + dir[2] * 4];
  return { pos, look, fov: 64, roll: 0.7 * sm((t - 0.55) / 0.45), near: 0.05, far: 400 };
};

/** ville : îlots réguliers autour de la tour, tous bien plus bas qu'elle (≤ ~70 m pour une tour de 240 m) */
export const cityBlocks = (bld: (x: number, z: number, w: number, d: number, h: number) => void, hash: (i: number, s?: number) => number) => {
  const S = 62;
  for (let gx = -40; gx <= 40; gx++) for (let gz = -40; gz <= 40; gz++) {
    const x = gx * S + 12, z = gz * S + 32, r = Math.hypot(x - 12, z - 32);
    if (r < 190 || r > 2500 || (z > 90 && z < 180 && x > -240 && x < 170)) continue;   // rue existante devant la tour
    const i = (gx + 50) * 131 + gz + 50;
    if (hash(i, 31) < 0.18) continue;                                   // places, terrains vagues
    const h = 8 + Math.pow(hash(i, 32), 3) * 62 + (r < 600 ? 8 : 0);
    bld(x + (hash(i, 33) - 0.5) * 8, z + (hash(i, 34) - 0.5) * 8, 24 + hash(i, 35) * 22, 24 + hash(i, 36) * 22, h);
  }
};

/** ROOM (rôle 62) : plan rapide et calme sur toi, assis sur le lit (même cadre que l'ouverture de l'épisode 1) */
export const ROLE_ROOM = 62;
export const roomCam = (u: number, YOU: V3): OpenCam => ({
  pos: mixv([YOU[0] + 0.05, YOU[1] + 0.63, YOU[2] + 1.35], [YOU[0] + 0.03, YOU[1] + 0.78, YOU[2] + 1.25], sm(u * 3)),
  look: [YOU[0], YOU[1] + 0.82 + 0.06 * sm(u * 4), YOU[2]], fov: 36, roll: 0, near: 0.05, far: 400,
});
