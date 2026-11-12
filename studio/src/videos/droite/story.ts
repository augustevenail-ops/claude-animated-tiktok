// « Ne le regarde pas » : 34 plans (docs : productions/droite-ep01/PLANS.md v2), temps ESTIMÉS (voix décalée de 1,8 s) ;
// à recaler sur words.json une fois la voix générée (règle n° 5 du projet).
export const FPS = 30;
export type V3 = [number, number, number];
export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => { const u = clamp01(x); return u * u * (3 - 2 * u); };
export const glide = (u: number) => { const x = clamp01(u); return x * x * x * (x * (6 * x - 15) + 10); };
export const lerp3 = (a: V3, b: V3, u: number): V3 => [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u];

// ---------------- lieu ----------------
export const SOFA_Z = 0.8;
export const YOU: V3 = [0.5, 0.35, 0.55];          // origine de la carte = ligne de semelle (assis sur le canapé)
export const FAKE: V3 = [-0.5, 0.35, 0.55];
export const TV_Z = -3.4;                            // plan de l'écran
export const WINDOW: V3 = [3.2, 1.4, 0.8];
export const FATHER: V3 = [5.0, 0, 0.8];             // le vrai père, dehors
export const LAMP: V3 = [-2.5, 0, 0.5];

// temps réels : chaque plan commence 2 images avant son premier mot (règle n° 5) ; la voix démarre à VOICE_AT (accroche muette avant)
import RAW from "./words.json";
import ANCH from "./anchors.json";
export const VOICE_AT = ANCH.voiceAt;
export type W = { w: string; s: number; e: number; q?: number; role?: string };
export const WORDS: W[] = (RAW as W[]).map((w) => ({ ...w, s: w.s + VOICE_AT, e: w.e + VOICE_AT }));
const A = ANCH.anchors as Record<string, number>;
const starts: number[] = [0, 0.9, ...Array.from({ length: 32 }, (_, i) => Math.max(1.8, WORDS[A[String(i + 3)]].s - 2 / FPS))];
const T: [number, number][] = starts.map((a, i) => [a, i + 1 < starts.length ? starts[i + 1] : WORDS[WORDS.length - 1].e + 0.9]);
export type ShotDef = { id: number; a: number; b: number };
export const SHOTS: ShotDef[] = T.map(([a, b], i) => ({ id: i + 1, a: Math.round(a * FPS), b: Math.round(b * FPS) }));
export const TOTAL = SHOTS[SHOTS.length - 1].b;
export const shotAt = (f: number) => SHOTS.find((s) => f >= s.a && f < s.b) ?? SHOTS[SHOTS.length - 1];

// ---------------- caméras ----------------
export type Cam = { pos: V3; look: V3; fov: number; roll: number };
const P = (pos: V3, look: V3, fov = 40, roll = 0): Cam => ({ pos, look, fov, roll });
/** point de l'écran de télé où l'on voit le reflet du point p (miroir : symétrique par rapport au plan z = TV_Z) */
export const reflPoint = (c: V3, p: V3): V3 => { const pz = 2 * TV_Z - p[2], t = (TV_Z - c[2]) / (pz - c[2]); return [c[0] + (p[0] - c[0]) * t, c[1] + (p[1] - c[1]) * t, TV_Z]; };
const headY = 1.21;
const tvLook: V3 = [0, 0.98, TV_Z];
const CAMS: Record<number, (u: number, f: number) => Cam> = {
  1: (u) => P(lerp3([0.5, 0.97, 0.18], [0.5, 0.88, 0.04], u), [0.5, 0.4, 0.55], 40, 0.04 * (1 - u)),                                                       // téléphone sur la cuisse
  2: (u) => P(lerp3([0.2, 1.05, 2.6], [0.1, 1.02, 0.5], smooth(u * 1.4)), tvLook, 38),                        // accroche : le reflet, zoom brusque
  3: (u) => P(lerp3([1.7, 0.95, 3.0], [0.9, 1.0, 2.0], smooth(u)), lerp3([-1.3, 0.85, 3.2], [0.0, 0.85, 0.7], smooth(u)), 42, 0.03),
  4: (u) => P(lerp3([0.35, 1.25, -1.55], [0.4, 1.25, -1.3], u), [YOU[0], 1.05, YOU[2]], 40, 0.02),
  5: (u) => P(lerp3([0.45, 2.0, -1.1], [0.5, 1.7, -0.9], smooth(u)), [0.5, 0.75, 0.6], 50, 0.06 * (1 - u)),
  6: (u) => P(lerp3([0.3, 1.0, 1.5], [0.1, 1.0, 0.5], smooth(u)), tvLook, 38),
  7: (u) => P(lerp3([0.15, 1.3, -3.0], [0.1, 1.25, -2.6], u), [0, 0.95, 0.6], 52),
  8: (u) => P(lerp3([FAKE[0], 1.08, -0.9], [FAKE[0], 1.08, -0.7], u), [FAKE[0], 1.06, 0.55], 17),
  9: (u) => P(lerp3([-1.7, 1.2, -1.3], [-1.45, 1.2, -1.15], u), [FAKE[0], 1.05, 0.55], 42, 0.04),
  10: (u) => P(lerp3([0.5, 1.25, -1.6], [0.5, 1.22, -1.35], u), [YOU[0], 1.15, YOU[2]], 36),
  11: (u) => P(lerp3([0.5, 0.97, 0.18], [0.5, 0.9, 0.06], u), [0.5, 0.4, 0.55], 40, -0.03 * u),
  12: (u) => P(lerp3([0.5, 0.95, 0.15], [0.5, 0.85, 0.05], u), [0.5, 0.4, 0.55], 38),
  13: (u) => P(lerp3([0.45, 1.22, -1.5], [0.48, 1.2, -1.2], u), [YOU[0], 1.17, YOU[2]], 32),
  14: (u) => P(lerp3([0.2, 1.25, -2.9], [0.1, 1.22, -2.6], u), [0.0, 1.1, 0.6], 50),
  15: (u) => P(lerp3([0.8, 1.2, -1.4], [0.7, 1.2, -1.2], u), [-0.3, 1.1, 0.55], 44, 0.05),
  16: (u) => P(lerp3([0.5, 1.2, -1.7], [0.5, 1.19, -1.4], u), [YOU[0], 1.19, YOU[2]], 34),
  17: (u) => P(lerp3([0.5, 0.96, 0.16], [0.5, 0.9, 0.06], u), [0.5, 0.4, 0.55], 40, 0.03 * u),
  18: (u) => P([0.5, 0.95, 0.2], lerp3([0.5, 0.4, 0.55], [3.2, 1.5, 0.8], glide(clamp01((u - 0.45) / 0.55))), 42),
  19: (u) => P(lerp3([0.2, 1.1, 0.2], [1.9, 1.15, 0.7], glide(u)), lerp3([2.6, 1.3, 0.7], [3.2, 1.45, 0.8], glide(u)), 42, 0.02),
  20: (u) => P(lerp3([2.1, 1.3, 0.7], [2.4, 1.32, 0.78], u), WINDOW, 34),
  21: (u) => P(lerp3([3.0, 1.55, 0.8], [3.3, 1.55, 0.8], u), [FATHER[0], 1.55, FATHER[2]], 18),
  22: (u) => P(lerp3([3.0, 1.5, 0.8], [3.6, 1.45, 0.8], u), [FATHER[0], 1.45, FATHER[2]], 24),
  23: (u) => P(lerp3([0.3, 1.25, -2.1], [0.0, 1.25, -1.85], u), [-0.4, 1.1, 0.55], 46, -0.02),
  24: (u) => P(lerp3([1.0, 1.25, -1.4], [0.9, 1.25, -1.2], u), [0.5, 1.2, 0.55], 40, 0.05),
  25: (u) => P(lerp3([0.5, 1.22, -1.55], [0.5, 1.2, -1.25], u), [YOU[0], 1.17, YOU[2]], 30),
  26: (u) => P(lerp3([0.2, 1.0, 1.5], [0.15, 1.0, 1.25], u), tvLook, 36),
  27: (u) => P(lerp3([0.15, 1.0, 1.25], [0.08, 1.0, 0.8], u), tvLook, 36),
  28: (u) => P(lerp3([0.08, 1.0, 0.8], [0.04, 1.0, 0.6], u), tvLook, 36),
  29: (u) => P(lerp3([0.5, 1.22, -1.5], [0.5, 1.2, -1.2], u), [YOU[0], 1.17, YOU[2]], 28),
  30: (u) => { const c: V3 = lerp3([0.02, 1.05, 0.45], [0.0, 1.1, 0.2], u); return P(c, reflPoint(c, [FAKE[0], headY, FAKE[2]]), 18); },
  31: (u) => P(lerp3([0.4, 1.15, -1.3], [0.4, 1.1, -1.0], u), [0.4, 1.0, 0.55], 34, 0.03),
  32: (u) => P(lerp3([0.5, 1.22, -1.5], [0.5, 1.2, -1.15], u), [YOU[0], 1.17, YOU[2]], 26),
  33: (u) => { const th = -Math.PI / 2 + 1.15 * Math.PI * Math.pow(u, 1.6); return P([Math.cos(th) * 2.3, 1.25, 0.8 + Math.sin(th) * 2.3], [0, 1.0, 0.8], 56, 0.04); },
  34: (u) => P(lerp3([0.12, 1.28, -2.6], [0.1, 1.25, -2.15], u), [0.0, 1.1, 0.6], 48),
};
/** secousses de caméra à main levée (amplitude en mètres sur le point visé) */
const SHAKE: Record<number, number> = { 3: 0.012, 4: 0.01, 5: 0.02, 12: 0.006, 31: 0.03, 32: 0.02, 33: 0.0 };
export const camAt = (id: number, f: number): Cam => {
  const s = SHOTS[id - 1], u = clamp01((f - s.a) / Math.max(1, s.b - s.a)), c = CAMS[id](u, f), a = SHAKE[id] ?? 0.003;
  const n = f * 0.9 + id * 3.1;
  return { ...c, roll: c.roll + 0.004 * Math.sin(f * 0.045 + id), look: [c.look[0] + a * Math.sin(n * 2.3), c.look[1] + a * Math.sin(n * 1.7 + 1), c.look[2] + a * Math.sin(n * 1.1)] };   // respiration de la caméra à l'épaule
};

// ---------------- flou de profondeur (px à 1080 pour l'infini ; focus par défaut = point visé) ----------------
export type Dof = { cInf: number; focus?: V3 };
const DOFS: Record<number, number> = { 1: 14, 2: 6, 3: 12, 4: 10, 5: 8, 6: 8, 7: 10, 8: 14, 9: 12, 10: 14, 11: 14, 12: 14, 13: 12, 14: 12, 15: 14, 16: 12, 17: 14, 18: 12,
  19: 8, 20: 8, 21: 14, 22: 12, 23: 10, 24: 14, 25: 12, 26: 10, 27: 8, 28: 8, 29: 14, 30: 10, 31: 12, 32: 12, 33: 6, 34: 10 };
export const dofAt = (id: number, f: number): Dof => {
  const s = SHOTS[id - 1], u = clamp01((f - s.a) / Math.max(1, s.b - s.a));
  if (id === 14) return { cInf: DOFS[14], focus: lerp3([YOU[0], 1.15, YOU[2]], [FAKE[0], 1.15, FAKE[2]], smooth(u * 1.6)) };      // changement de point : toi -> lui
  if (id === 26) return { cInf: DOFS[26], focus: lerp3([0, 1.0, TV_Z + 0.4], tvLook, smooth(u)) };
  return { cInf: DOFS[id] ?? 10 };
};

// ---------------- événements ----------------
/** éclairs (0..1) : tonnerre de l'accroche, éclair sur le vrai père, stroboscope du tour à 360° */
export const flashAt = (f: number) => {
  const t = f / FPS, k = (t0: number, d: number, g: number) => { const x = (t - t0) * FPS; return x >= 0 && x < d ? g * (1 - x / d) : 0; };
  const s20 = SHOTS[19].a / FPS, s33 = SHOTS[32].a / FPS;
  let v = k(0.0, 4, 0.7) + k(s20, 4, 1) + k(s20 - 0.5, 2, 0.4);
  for (let q = 0; q < 6; q++) v += k(s33 + 0.3 + q * 0.4, 3, 0.8);
  return Math.min(1, v);
};
export type Phone = { mode: "none" | "bubble" | "notif" | "typing"; text: string; chars: number; shake: number; first?: string };
export const phoneAt = (id: number, f: number): Phone => {
  const s = SHOTS[id - 1], u = clamp01((f - s.a) / Math.max(1, s.b - s.a));
  const M1 = "Ce n'est pas moi. Ne le regarde surtout pas.", M2 = "Je suis dehors. Devant la fenêtre.";
  switch (id) {
    case 1: return { mode: "bubble", text: "Ne le regarde surtout pas.", chars: 99, shake: 0.3 };
    case 11: return { mode: "notif", text: "Papa", chars: 0, shake: 1 };
    case 12: return { mode: "typing", text: M1, chars: Math.round(M1.length * smooth(u * 1.15)), shake: 0.1 };
    case 17: return { mode: "notif", text: "Papa", chars: 0, shake: 1, first: M1 };
    case 18: return u < 0.5 ? { mode: "typing", text: M2, chars: Math.round(M2.length * smooth(u * 2.2)), shake: 0.1, first: M1 } : { mode: "none", text: "", chars: 0, shake: 0 };
    default: return { mode: "none", text: "", chars: 0, shake: 0 };
  }
};
