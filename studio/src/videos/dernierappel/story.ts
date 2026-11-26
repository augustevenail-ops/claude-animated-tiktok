// Le Dernier Appel ép. 1 : les 55 plans calés sur la voix (words.json) — décor, ambiance, caméra et jeu des personnages.
import * as THREE from "three";
import WORDS from "./words.json";
import { Actor, CAST, Expr } from "./chars";
import { Sets, O, V, viewTex } from "./sets";
import { Beam } from "./beams";

export const FPS = 30;
const W = WORDS as { w: string; s: number; e: number }[];
const LAST = W.filter((w) => /[a-zà-ÿ]/i.test(w.w)).pop()!;
export const TOTAL = Math.round((LAST.e + 1.6) * FPS);
// premier mot de chaque plan (indices de words.json)
const STARTW = [0, 3, 6, 14, 16, 20, 26, 32, 38, 41, 48, 52, 56, 64, 71, 79, 83, 86, 89, 95, 98, 105, 108, 111, 120, 122, 124, 125, 128, 130, 131, 136, 141, 145, 148, 155, 160, 164, 168, 175, 181, 184, 191, 196, 200, 209, 214, 219, 223, 231, 233, 236, 242, 252, 265];
export const START = STARTW.map((wi, i) => (i === 0 ? 0 : Math.round(W[wi].s * FPS) - 2));
export const shotAt = (f: number) => { let i = 0; while (i + 1 < START.length && START[i + 1] <= f) i++; return i; };
export const uOf = (i: number, f: number) => { const a = START[i], b = i + 1 < START.length ? START[i + 1] : TOTAL; return Math.min(1, Math.max(0, (f - a) / Math.max(1, b - a - 1))); };

// ---------------- aides
const sm = (x: number) => { const t = Math.min(1, Math.max(0, x)); return t * t * t * (t * (t * 6 - 15) + 10); };
const gl = (x: number) => { const t = Math.min(1, Math.max(0, x)); return 0.45 * t + 0.55 * sm(t); };
const L = (a: THREE.Vector3, b: THREE.Vector3, u: number) => a.clone().lerp(b, u);
type Cam = { P: THREE.Vector3; T: THREE.Vector3; fov: number };
const G = (P0: THREE.Vector3, P1: THREE.Vector3, T0: THREE.Vector3, T1: THREE.Vector3, fov: number, u: number, f1 = fov): Cam => { const e = gl(u); return { P: L(P0, P1, e), T: L(T0, T1, e), fov: fov + (f1 - fov) * e }; };
type SetK = keyof typeof O;
const at = (k: SetK, x: number, y: number, z: number) => O[k].clone().add(V(x, y, z));
const headOf = (a: Actor) => { a.root.updateMatrixWorld(true); return a.neck.localToWorld(V(0, 0.7, 0)); };
/** caméra face à un personnage (gros plan) : d = distance, side = décalage latéral, dy = hauteur relative */
const faceCam = (a: Actor, d: number, side: number, dy: number, u: number, push = 0.12, fov = 34): Cam => {
  const h = headOf(a), y = a.root.rotation.y, f = V(Math.sin(y), 0, Math.cos(y)), r = V(Math.cos(y), 0, -Math.sin(y));
  const P0 = h.clone().addScaledVector(f, d).addScaledVector(r, side).add(V(0, dy, 0)), P1 = h.clone().addScaledVector(f, d - push).addScaledVector(r, side * 0.9).add(V(0, dy, 0));
  return G(P0, P1, h.clone().add(V(0, -0.02, 0)), h.clone().add(V(0, -0.02, 0)), fov, u); };
const place = (a: Actor, k: SetK, x: number, y: number, z: number, yaw: number) => { a.root.visible = true; a.root.position.copy(at(k, x, y, z)); a.root.rotation.set(0, yaw, 0); };

export type World = { sets: Sets; actors: Record<string, Actor>; beams: Beam[]; scene?: THREE.Scene; fill: THREE.PointLight; key: THREE.SpotLight };
export type Grade = { sat: number; con: number; bri: number; bloom: number; bg: string; fog: string; fogD: number; env: number; snow: boolean };
type Shot = { set: SetK; cam: (w: World, u: number, t: number) => Cam; st?: (w: World, u: number, t: number) => void; g?: Partial<Grade>; fr: string };

// ---------------- distribution
export const buildCast = (root: THREE.Object3D) => {
  const mk = (k: string, seed: number, name = k) => { const a = new Actor({ ...CAST[k], name }, 0.36, seed); root.add(a.root); a.root.visible = false; return a; };
  const actors: Record<string, Actor> = {
    dad: mk("dad", 1), dadF: mk("dadFire", 2, "dadF"), kid: mk("kid", 3), kidC: mk("kidCoat", 4), kidB: mk("kidBlack", 5), lucas: mk("lucas", 6), mom: mk("momBlack", 7), gran: mk("gran", 8),
    old: mk("oldFire", 9), r1: mk("rescuer", 10, "r1"), r2: mk("rescuer", 11, "r2"), disp: mk("disp", 12), n1: mk("n1", 13), n2: mk("n2", 14), n3: mk("n3", 15), n4: mk("n4", 16),
    k1: mk("k1", 17), k2: mk("k2", 18), k3: mk("k3", 19), k4: mk("k4", 20), m1: mk("m1", 21), m2: mk("m2", 22), m3: mk("m3", 23), m4: mk("m4", 24),
  };
  actors.disp.addHeadset(); actors.dadF.addTorch(); actors.r1.addTorch(); actors.r2.addTorch();
  const beams = [new Beam(0.9, 0.06, 0.32, "#fff1d6"), new Beam(0.9, 0.06, 0.32, "#fff1d6"), new Beam(0.9, 0.06, 0.32, "#fff1d6")]; for (const b of beams) { root.add(b.mesh); b.mesh.visible = false; }
  return { actors, beams };
};
const torchBeam = (w: World, i: number, a: Actor, tgt: THREE.Vector3, t: number, op = 0.32) => { a.root.updateMatrixWorld(true); const b = w.beams[i]; b.mesh.visible = true; b.place(a.torch!.localToWorld(V(0, 0, 1.6)), tgt, 7); b.set(t, op); };

// ---------------- positions fixes
const SOFA = (x: number) => [x, 0.25, 1.55] as const;
const KIDBED: [number, number, number] = [-1.35, 0.6, -1.5];
const sitSofa = (a: Actor, x: number, t: number, e: Expr, look = 0, kid = false) => { place(a, "LIV", x, kid ? 0.48 : 0.25, 1.52, Math.PI); a.pose(t, { sit: true, expr: e, headPitch: 0.12, headYaw: look }); };
const kidInBed = (w: World, t: number, e: Expr, look = 0.4) => { place(w.actors.kid, "BED", ...KIDBED, 0); w.actors.kid.pose(t, { sit: true, expr: e, headYaw: look, headPitch: 0.06 }); };
const dadOnBed = (w: World, t: number, talk: boolean, e: Expr = "smile") => { w.sets.stool.visible = true; place(w.actors.dad, "BED", -0.25, 0.11, -1.25, -Math.PI / 2 - 0.25); w.actors.dad.pose(t, { sit: true, expr: e, talk, headYaw: 0.0, headPitch: 0.12, armL: -0.25, armR: -0.2 }); };
const momGranKid = (w: World, t: number, e: Expr = "sad") => { sitSofa(w.actors.mom, -0.75, t, e, 0.05); sitSofa(w.actors.gran, 0.75, t, e, -0.05); sitSofa(w.actors.kidB, 0, t, e, 0, true); };
const photoWall = (w: World, k: number) => { const p = w.sets.photo; p.visible = k > 0; p.position.set(-1.5, 1.6, -2.66); p.rotation.set(0, 0, 0); };
const lucasAdult = (w: World, x: number, z: number, yaw: number, t: number, e: Expr, hold?: number) => { place(w.actors.lucas, "LIV", x, 0, z, yaw); w.actors.lucas.pose(t, { expr: e, armL: hold !== undefined ? -1.45 - 1.0 * hold : undefined, headPitch: hold !== undefined ? -0.1 : 0.05 }); };
const fam4 = (w: World, t: number) => { sitSofa(w.actors.m1, -0.75, t, "sad", 0.1); sitSofa(w.actors.m2, 0.75, t, "sad", -0.1); place(w.actors.m3, "LIV", -2.15, 0.27, 0.65, Math.PI * 0.82); w.actors.m3.pose(t, { sit: true, expr: "sad", headPitch: 0.15 });
  place(w.actors.m4, "LIV", -0.9, 0, -1.7, 0.4); w.actors.m4.pose(t, { expr: "worried", cover: 0.25, headPitch: 0.2 }); };
const mourners = (w: World, t: number) => { const ring: [string, number, number][] = [["m1", 3.6, 1.4], ["m2", 4.1, 2.1], ["m3", 6.4, 1.6], ["m4", 6.0, -1.8], ["n3", 3.7, -1.2], ["n2", 6.5, 0.1]];
  for (const [k, x, z] of ring) { const a = w.actors[k]; place(a, "CEM", x, 0, z, Math.atan2(5 - x, 0 - z)); a.pose(t, { expr: "sad", headPitch: 0.35, cover: k === "m2" ? 0.85 : undefined }); } };
const fireHouse = (w: World, t: number, cam: THREE.Camera, k = 1) => { w.sets.houseFire.set(t, cam, k, 60); w.sets.lucas.setLit(0); };
const trucksOn = (w: World, t: number, on: boolean) => { for (const tr of w.sets.trucks) { tr.root.visible = on; tr.set(t, on); } };

// ---------------- ambiances
const NIGHT: Partial<Grade> = { bg: "#070a18", fog: "#0c1228", fogD: 0.018, sat: 0.18, snow: true };
const NIGHT_IN: Partial<Grade> = { bg: "#000", fog: "#000000", fogD: 0, sat: 0.2 };
const DAY_IN: Partial<Grade> = { bg: "#000", fog: "#000000", fogD: 0, sat: 0.05, con: 0.08 };
const BACK: Partial<Grade> = { sat: -0.3, con: 0.14, bloom: 1.15 };            // souvenir de l'incendie
const FIREG: Partial<Grade> = { ...NIGHT, sat: 0.28, bloom: 1.4, fogD: 0.012 };

export const SHOTS: Shot[] = [
  /* 1 Dans ce monde */ { set: "STR", fr: "Plongée aérienne, travelling avant descendant", g: NIGHT, cam: (_w, u) => G(at("STR", -34, 34, 38), at("STR", -14, 13, 16), at("STR", 0, 2, -10), at("STR", 0, 3, -12), 46, u) },
  /* 2 quand quelqu'un meurt */ { set: "CEM", fr: "Plan rasant entre les tombes, travelling latéral", g: { bg: "#0a1024", fog: "#121a38", fogD: 0.012, sat: 0.1, snow: true },
    cam: (_w, u) => G(at("CEM", -12.5, 0.85, -7.5), at("CEM", -9, 0.9, -7.7), at("CEM", -7.5, 0.6, -12), at("CEM", -4.5, 0.6, -12), 42, u),
    st: (w) => { w.sets.cemSun.color.set("#8aa0ff"); w.sets.cemSun.intensity = 0.7; w.sets.cemHemi.intensity = 0.35; w.sets.cemHemi.color.set("#4a5a90"); } },
  /* 3 il a le droit à un seul appel */ { set: "LIV", fr: "Révélation du téléphone : travelling avant", g: NIGHT_IN, cam: (_w, u) => G(at("LIV", 1.1, 1.35, 1.3), at("LIV", 0.42, 1.0, 0.0), at("LIV", 0, 0.78, -0.6), at("LIV", 0, 0.8, -0.62), 40, u, 36) },
  /* 4 Un seul */ { set: "LIV", fr: "Très gros plan du cadran", g: NIGHT_IN, cam: (w, u) => { const d = w.sets.phone.dial.getWorldPosition(V(0, 0, 0)); return G(d.clone().add(V(0.12, 0.3, 0.26)), d.clone().add(V(0.05, 0.22, 0.18)), d, d, 32, u); } },
  /* 5 dans les vingt-quatre heures */ { set: "LIV", fr: "Très gros plan de l'horloge", g: NIGHT_IN, cam: (_w, u) => G(at("LIV", 1.35, 1.9, -1.75), at("LIV", 1.2, 1.93, -1.95), at("LIV", 1.1, 1.95, -2.66), at("LIV", 1.1, 1.95, -2.66), 34, u), st: (w, u) => w.sets.clock(21.78 + u * 0.0003) },
  /* 6 à la personne de son choix */ { set: "LIV", fr: "Gros plan du combiné et du cordon", g: NIGHT_IN, cam: (w, u) => { const h = w.sets.phone.handset.getWorldPosition(V(0, 0, 0)); return G(h.clone().add(V(0.5, 0.12, 0.3)), h.clone().add(V(0.36, 0.08, 0.18)), h.clone().add(V(0, -0.06, 0)), h.clone().add(V(0.04, -0.07, 0)), 34, u); } },
  /* 7 Chaque maison a son téléphone rouge */ { set: "STR", fr: "Travelling latéral devant les maisons (téléphones rouges aux fenêtres)", g: { ...NIGHT, fogD: 0.012 },
    cam: (_w, u) => { const x = -42 + 10 * gl(u); return { P: at("STR", x, 2.4, 2.5), T: at("STR", x + 7, 1.6, -10), fov: 44 }; } },
  /* 8 Il ne sonne que pour ça */ { set: "LIV", fr: "Contre-plongée sur le téléphone", g: { ...NIGHT_IN, sat: 0.26 }, cam: (_w, u) => G(at("LIV", -0.55, 0.8, 0.2), at("LIV", -0.42, 0.8, 0.05), at("LIV", 0, 0.84, -0.6), at("LIV", 0, 0.85, -0.6), 38, u) },
  /* 9 Après un enterrement */ { set: "CEM", fr: "Plongée sur l'enterrement", g: { bg: "#5a6478", fog: "#8a92a8", fogD: 0.02, sat: -0.05, snow: true },
    cam: (_w, u) => G(at("CEM", 12, 6.5, 8), at("CEM", 10.5, 5.6, 6.4), at("CEM", 5, 0.4, 0), at("CEM", 5, 0.5, 0), 42, u),
    st: (w, _u, t) => { w.sets.cemSun.color.set("#d8dcef"); w.sets.cemSun.intensity = 0.6; w.sets.cemHemi.intensity = 1.1; w.sets.cemHemi.color.set("#b8c0d8"); w.sets.grave.visible = true; mourners(w, t); } },
  /* 10 toute la famille attend autour en silence */ { set: "LIV", fr: "Plongée depuis l'angle du plafond", g: NIGHT_IN, cam: (_w, u) => G(at("LIV", 2.95, 2.5, -2.3), at("LIV", 2.8, 2.45, -1.9), at("LIV", -0.2, 0.4, 0.7), at("LIV", -0.3, 0.45, 0.6), 54, u), st: (w, _u, t) => fam4(w, t) },
  /* 11 Lucas a huit ans */ { set: "BED", fr: "Plan moyen : Lucas joue avec son camion", g: { ...NIGHT_IN, sat: 0.3 }, cam: (w, u) => faceCam(w.actors.kid, 2.60, 0.45, 0.15, u, 0.2, 42),
    st: (w, _u, t) => { place(w.actors.kid, "BED", 0.05, -0.08, -0.15, 0.5); w.actors.kid.pose(t, { sit: true, expr: "happy", headPitch: 0.35, reach: 0.55 }); w.sets.toy.position.set(0.32, 0, 0.32); w.sets.toy.rotation.y = -0.6 + Math.sin(t * 1.5) * 0.15; } },
  /* 12 son père est pompier */ { set: "STR", fr: "Contre-plongée héroïque devant le camion", g: { ...NIGHT, sat: 0.3 }, cam: (_w, u) => G(at("STR", -3.3, 0.45, 4.6), at("STR", -3.6, 0.5, 3.9), at("STR", -4.2, 1.7, 0.6), at("STR", -4.2, 1.75, 0.6), 42, u),
    st: (w, _u, t) => { place(w.actors.dadF, "STR", -4.2, 0, 0.55, 0.15); w.actors.dadF.pose(t, { expr: "smile", headPitch: -0.05 }); if (w.actors.dadF.torch) w.actors.dadF.torch.visible = false; trucksOn(w, t, true); w.sets.trucks[1].root.visible = false; } },
  /* 13 Chaque soir il lui répète la même chose */ { set: "BED", fr: "Plan à deux au bord du lit", g: NIGHT_IN, cam: (_w, u) => G(at("BED", 1.85, 1.75, 0.6), at("BED", 1.7, 1.7, 0.35), at("BED", -1.2, 0.95, -1.45), at("BED", -1.2, 0.95, -1.45), 50, u),
    st: (w, _u, t) => { kidInBed(w, t, "smile", 0.55); dadOnBed(w, t, true); } },
  /* 14 S'il y a le feu un jour */ { set: "BED", fr: "Gros plan du père", g: NIGHT_IN, cam: (w, u) => { const h = headOf(w.actors.dad); return G(at("BED", -1.3, 1.5, 0.5), at("BED", -1.25, 1.48, 0.35), h, h, 50, u); }, st: (w, _u, t) => { kidInBed(w, t, "worried", 0.55); dadOnBed(w, t, true, "focus"); w.actors.dad.root.rotation.y = -Math.PI / 2 + 0.55; w.actors.dad.neck.rotation.y = -0.35; } },
  /* 15 tu restes dans ta chambre et tu attends */ { set: "BED", fr: "Gros plan de Lucas dans son lit", g: NIGHT_IN, cam: (w, u) => faceCam(w.actors.kid, 2.64, 0.15, 0.03, u, 0.08, 40),
    st: (w, u, t) => { kidInBed(w, t, "worried", 0.5 + 0.05 * Math.sin(u * 6)); dadOnBed(w, t, true, "focus"); w.actors.kid.neck.rotation.x = 0.06 + 0.12 * Math.max(0, Math.sin(u * 9)); } },
  /* 16 je viendrai te chercher */ { set: "BED", fr: "Plan subjectif de Lucas vers la porte", g: NIGHT_IN, cam: (_w, u) => G(at("BED", -1.25, 0.98, -1.35), at("BED", -1.15, 0.98, -1.1), at("BED", 1.1, 1.45, 1.9), at("BED", 1.1, 1.4, 1.9), 46, u),
    st: (w, u, t) => { kidInBed(w, t, "smile"); place(w.actors.dad, "BED", 1.0, 0, 1.75, Math.PI + 0.5); w.actors.dad.pose(t, { expr: "smile", wave: u < 0.6 ? "R" : undefined, headYaw: 0.3 }); w.sets.bedLamp.intensity = 5 * (1 - sm((u - 0.7) * 5)); } },
  /* 17 Une nuit d'hiver */ { set: "STR", fr: "Plan large de la maison sous la neige", g: NIGHT, cam: (_w, u) => G(at("STR", 7, 2.0, 5), at("STR", 5.2, 2.0, 3.6), at("STR", 0, 2.6, -12), at("STR", 0, 2.7, -12), 44, u),
    st: (w) => { w.sets.lucas.setLit(0.15); } },
  /* 18 la maison brûle */ { set: "STR", fr: "La maison en flammes, travelling avant", g: FIREG, cam: (_w, u) => G(at("STR", 6, 2.3, 6), at("STR", 3.8, 2.1, 4), at("STR", 0, 3.0, -12), at("STR", 0, 3.0, -12), 44, u) },
  /* 19 Son père fonce dans la fumée */ { set: "STR", fr: "Travelling de dos : le père court vers la porte", g: FIREG,
    cam: (w, u) => { const p = w.actors.dadF.root.position; return { P: p.clone().add(V(0.9, 1.7, 3.2 - u * 0.6)), T: p.clone().add(V(0, 1.2, -3)), fov: 46 }; },
    st: (w, u, t) => { place(w.actors.dadF, "STR", -0.3, 0, -3.0 - 5.4 * u, Math.PI); w.actors.dadF.pose(t, { walk: 3.2, expr: "focus" }); if (w.actors.dadF.torch) w.actors.dadF.torch.visible = true; trucksOn(w, t, true); } },
  /* 20 pour le trouver */ { set: "HALL", fr: "Couloir enfumé : le père avance", g: { ...BACK, sat: 0.1 }, cam: (_w, u) => G(at("HALL", 0.15, 1.5, 0.2), at("HALL", 0.1, 1.45, -0.8), at("HALL", 0, 1.2, -5), at("HALL", 0, 1.2, -5.5), 52, u),
    st: (w, u, t) => { place(w.actors.dadF, "HALL", 0.05, 0, -1.4 - 1.8 * u, Math.PI); w.actors.dadF.pose(t, { walk: 2.4, expr: "focus", point: 0.3 }); if (w.actors.dadF.torch) w.actors.dadF.torch.visible = true; torchBeam(w, 0, w.actors.dadF, at("HALL", 0, 0.6, -7), t, 0.4); } },
  /* 21 Les pompiers sortent Lucas de sa chambre */ { set: "STR", fr: "Un pompier sort avec Lucas dans les bras", g: FIREG,
    cam: (w, u) => { const p = w.actors.r1.root.position; return G(p.clone().add(V(0.9, 1.4, 3.6)), p.clone().add(V(0.8, 1.35, 3.1)), p.clone().add(V(0, 1.1, 0)), p.clone().add(V(0, 1.1, 0)), 44, u); },
    st: (w, u, t) => { place(w.actors.r1, "STR", 0.6, 0, -8.6 + 3.2 * u, 0); w.actors.r1.pose(t, { walk: 2.0, carry: true, expr: "focus" }); if (w.actors.r1.torch) w.actors.r1.torch.visible = false;
      const k = w.actors.kid, rp = w.actors.r1.root.position; k.root.visible = true; k.root.position.copy(rp).add(V(0.05, 0.62, 0.38)); k.root.rotation.set(0, -Math.PI / 2 - 0.4, 0); k.pose(t, { expr: "scared", armsUp: 0.45, headYaw: 0.5 }); trucksOn(w, t, true); } },
  /* 22 Son père, lui */ { set: "STR", fr: "Par-dessus l'épaule de Lucas, vers la maison", g: FIREG, cam: (w, u) => { const h = headOf(w.actors.kidC); return G(h.clone().add(V(0.45, 0.12, 1.1)), h.clone().add(V(0.38, 0.1, 0.85)), at("STR", 0, 2.2, -10), at("STR", 0, 2.0, -10), 42, u); },
    st: (w, _u, t) => { place(w.actors.kidC, "STR", -1.6, 0, -3.2, Math.PI + 0.12); w.actors.kidC.pose(t, { expr: "scared", headPitch: -0.15 }); trucksOn(w, t, true); } },
  /* 23 ne ressort jamais */ { set: "STR", fr: "La porte en flammes, travelling avant lent", g: FIREG, cam: (_w, u) => G(at("STR", 0.6, 1.5, -5.6), at("STR", 0.35, 1.45, -6.8), at("STR", 0, 1.3, -10), at("STR", 0, 1.3, -10), 40, u), st: (w, _u, t) => trucksOn(w, t, true) },
  /* 24 Le lendemain, la famille attend devant le téléphone rouge */ { set: "LIV", fr: "Plan large derrière le téléphone", g: DAY_IN, cam: (_w, u) => G(at("LIV", 0.5, 1.15, -2.0), at("LIV", 0.35, 1.1, -1.7), at("LIV", 0, 0.85, 1.4), at("LIV", 0, 0.85, 1.4), 46, u), st: (w, _u, t) => momGranKid(w, t) },
  /* 25 Sa mère */ { set: "LIV", fr: "Gros plan de la mère", g: DAY_IN, cam: (w, u) => faceCam(w.actors.mom, 2.88, 0.1, 0.0, u, 0.08, 38), st: (w, _u, t) => momGranKid(w, t) },
  /* 26 sa grand-mère */ { set: "LIV", fr: "Gros plan de la grand-mère", g: DAY_IN, cam: (w, u) => faceCam(w.actors.gran, 2.88, -0.1, 0.0, u, 0.08, 38), st: (w, _u, t) => momGranKid(w, t) },
  /* 27 Lucas */ { set: "LIV", fr: "Gros plan de Lucas", g: DAY_IN, cam: (w, u) => faceCam(w.actors.kidB, 2.52, 0.05, 0.02, u, 0.08, 38), st: (w, _u, t) => momGranKid(w, t) },
  /* 28 Les heures passent */ { set: "LIV", fr: "L'horloge s'emballe, la lumière baisse", g: DAY_IN, cam: (_w, u) => G(at("LIV", 1.65, 1.7, -1.2), at("LIV", 1.4, 1.8, -1.6), at("LIV", 1.1, 1.85, -2.66), at("LIV", 1.1, 1.9, -2.66), 44, u),
    st: (w, u, t) => { w.sets.clock(14.3 + 8.4 * sm(u)); momGranKid(w, t); dusk(w, u); } },
  /* 29 Vingt-trois heures */ { set: "LIV", fr: "Très gros plan : 23 h", g: NIGHT_IN, cam: (_w, u) => G(at("LIV", 0.85, 1.92, -1.5), at("LIV", 0.95, 1.94, -1.7), at("LIV", 1.1, 1.95, -2.66), at("LIV", 1.1, 1.95, -2.66), 30, u), st: (w, u) => w.sets.clock(23.0 + u * 0.0004) },
  /* 30 minuit */ { set: "LIV", fr: "Très gros plan : minuit", g: { ...NIGHT_IN, sat: 0.1 }, cam: (_w, u) => G(at("LIV", 1.4, 1.88, -1.55), at("LIV", 1.25, 1.92, -1.8), at("LIV", 1.1, 1.95, -2.66), at("LIV", 1.1, 1.95, -2.66), 30, u), st: (w, u) => w.sets.clock(23.9997 + u * 0.0004) },
  /* 31 Le téléphone ne sonne pas */ { set: "LIV", fr: "Téléphone au premier plan, la famille derrière", g: NIGHT_IN, cam: (_w, u) => G(at("LIV", 0.38, 0.98, -1.3), at("LIV", 0.3, 0.95, -1.12), at("LIV", 0, 0.85, 0.6), at("LIV", 0, 0.84, 0.5), 40, u), st: (w, _u, t) => { w.sets.clock(0.02); momGranKid(w, t); } },
  /* 32 Dans le quartier, on chuchote */ { set: "STR", fr: "Plan large : les voisins devant la maison brûlée", g: { bg: "#8a94a8", fog: "#b8c0d0", fogD: 0.016, sat: -0.05, snow: false },
    cam: (_w, u) => G(at("STR", 7.5, 1.9, 5.2), at("STR", 6.3, 1.8, 4.4), at("STR", 0.6, 1.2, -3.5), at("STR", 0.6, 1.2, -3.5), 46, u), st: (w, _u, t) => neighbours(w, t) },
  /* 33 Il n'a appelé personne */ { set: "STR", fr: "Deux voisins chuchotent", g: { bg: "#8a94a8", fog: "#b8c0d0", fogD: 0.016, sat: -0.05 },
    cam: (_w, u) => G(at("STR", 2.6, 1.65, -1.6), at("STR", 2.8, 1.63, -1.3), at("STR", 3.9, 1.6, 0.85), at("STR", 3.9, 1.6, 0.85), 40, u), st: (w, _u, t) => neighbours(w, t) },
  /* 34 Il n'aimait personne */ { set: "STR", fr: "Deux autres voisins secouent la tête", g: { bg: "#8a94a8", fog: "#b8c0d0", fogD: 0.016, sat: -0.05 },
    cam: (_w, u) => G(at("STR", -1.2, 1.65, -1.6), at("STR", -1.4, 1.63, -1.3), at("STR", -2.4, 1.6, 1.05), at("STR", -2.4, 1.6, 1.05), 40, u), st: (w, _u, t) => neighbours(w, t, true) },
  /* 35 À l'école, on le répète à Lucas */ { set: "SCH", fr: "Cour d'école : on montre Lucas du doigt", g: { bg: "#a8b4c8", fog: "#c8d0dc", fogD: 0.012, sat: 0.05 },
    cam: (_w, u) => G(at("SCH", -4.2, 1.5, 5.6), at("SCH", -3.4, 1.45, 4.8), at("SCH", 0.8, 0.9, -1.4), at("SCH", 0.9, 0.9, -1.4), 44, u), st: (w, _u, t) => school(w, t, false) },
  /* 36 Alors il arrête de pleurer */ { set: "SCH", fr: "Gros plan de Lucas", g: { bg: "#a8b4c8", fog: "#c8d0dc", fogD: 0.012, sat: 0.0 }, cam: (w, u) => faceCam(w.actors.kidC, 2.64, 0.12, 0.02, u, 0.1, 38), st: (w, _u, t) => school(w, t, false, true) },
  /* 37 Il arrête d'en parler */ { set: "SCH", fr: "Plan large : Lucas seul sur le banc", g: { bg: "#a8b4c8", fog: "#c8d0dc", fogD: 0.012, sat: -0.05 },
    cam: (_w, u) => G(at("SCH", 2.2, 1.4, 2.6), at("SCH", 2.9, 1.3, 1.8), at("SCH", 6, 0.7, -4.5), at("SCH", 6, 0.7, -4.5), 42, u), st: (w, _u, t) => school(w, t, true) },
  /* 38 Dix ans plus tard */ { set: "LIV", fr: "Travelling avant vers la photo du père", g: NIGHT_IN, cam: (_w, u) => G(at("LIV", -1.3, 1.62, -0.3), at("LIV", -1.45, 1.6, -1.3), at("LIV", -1.5, 1.6, -2.66), at("LIV", -1.5, 1.6, -2.66), 40, u),
    st: (w, u, t) => { lucasAdult(w, -0.9 + 0.5 * u, -1.6 - 0.5 * u, Math.PI + 0.6, t, "neutral"); } },
  /* 39 Lucas décroche la photo de son père */ { set: "LIV", fr: "Plan rapproché : il décroche le cadre", g: NIGHT_IN, cam: (_w, u) => G(at("LIV", 1.9, 1.62, -1.75), at("LIV", 1.6, 1.6, -1.85), at("LIV", -1.45, 1.42, -2.3), at("LIV", -1.45, 1.42, -2.5), 44, u),
    st: (w, u, t) => { const k = sm((u - 0.15) / 0.6); lucasAdult(w, -1.5, -1.95, Math.PI, t, "angry", 0.7 - 0.35 * k); const p = w.sets.photo; p.position.set(-1.5 + 0.35 * k, 1.6 - 0.3 * k, -2.66 + 0.36 * k); p.rotation.set(-0.3 * k, 0, 0.05 * k); } },
  /* 40 et la jette à la poubelle */ { set: "LIV", fr: "Contre-plongée : le cadre tombe dans la poubelle", g: NIGHT_IN, cam: (_w, u) => G(at("LIV", 2.75, 0.28, 1.7), at("LIV", 2.6, 0.3, 1.5), at("LIV", 2.2, 0.55, 0.9), at("LIV", 2.2, 0.5, 0.9), 44, u),
    st: (w, u, t) => { lucasAdult(w, 2.0, 0.35, 0.4, t, "angry", u < 0.3 ? 0.3 : undefined); w.sets.photo.visible = false; const b = w.sets.photoBin; b.visible = true; const k = sm((u - 0.15) / 0.35);
      b.position.set(2.15 + 0.05 * k, 1.15 - 0.72 * k, 0.78 + 0.1 * k); b.rotation.set(-1.2 * k, 0.4, 0.5 * k); } },
  /* 41 Le soir même */ { set: "STR", fr: "Plan large : la porte de Lucas, le soir", g: NIGHT, cam: (_w, u) => G(at("STR", 30, 1.9, -2.5), at("STR", 29, 1.9, -3.6), at("STR", 26, 1.5, -10), at("STR", 26, 1.5, -10), 42, u),
    st: (w, u, t) => { place(w.actors.old, "STR", 27.6 - 1.4 * u, 0, -6.2 - 2.2 * u, Math.PI - 0.5); w.actors.old.pose(t, { walk: 1.4, expr: "sad" }); } },
  /* 42 un vieux pompier frappe à sa porte */ { set: "STR", fr: "Plan moyen de profil : il frappe", g: NIGHT, cam: (_w, u) => G(at("STR", 29.4, 1.6, -6.4), at("STR", 29.0, 1.6, -6.7), at("STR", 26.0, 1.5, -9.2), at("STR", 26.0, 1.5, -9.3), 40, u),
    st: (w, _u, t) => { place(w.actors.old, "STR", 26.1, 0, -8.85, Math.PI); w.actors.old.pose(t, { knock: true, expr: "sad", headPitch: 0.05 }); } },
  /* 43 Il faut que tu saches */ { set: "STR", fr: "Gros plan du vieux pompier, depuis l'entrée", g: { ...NIGHT, snow: true }, cam: (w, u) => faceCam(w.actors.old, 3.12, 0.12, 0.02, u, 0.1, 40),
    st: (w, _u, t) => { place(w.actors.old, "STR", 26.0, 0, -8.6, 0); w.actors.old.pose(t, { expr: "sad", talk: true, headPitch: 0.04 }); w.fill.intensity = 3; w.fill.color.set("#ffc890"); w.fill.position.copy(at("STR", 26, 1.9, -9.6)); } },
  /* 44 la nuit de l'incendie */ { set: "STR", fr: "Souvenir : la maison en flammes", g: { ...FIREG, ...BACK }, cam: (_w, u) => G(at("STR", -7, 3.2, 1.5), at("STR", -5.6, 2.9, 0.4), at("STR", 0, 3.0, -12), at("STR", 0, 3.0, -12), 42, u), st: (w, _u, t) => trucksOn(w, t, false) },
  /* 45 la caserne a reçu un appel depuis ta maison */ { set: "DISP", fr: "Standard : le téléphone sonne, voyant rouge", g: { ...NIGHT_IN, ...BACK, sat: -0.1 },
    cam: (w, u) => { const p = w.sets.dPhone.root.getWorldPosition(V(0, 0, 0)); return G(p.clone().add(V(0.6, 0.4, 0.55)), p.clone().add(V(0.42, 0.3, 0.4)), p.clone().add(V(0, 0.08, 0)), p.clone().add(V(0, 0.08, 0)), 38, u); },
    st: (w, u, t) => { const ph = w.sets.dPhone; ph.set(false, u < 0.55 ? 1 : 0, t); if (ph.lamp) (ph.lamp.material as THREE.MeshStandardMaterial).emissiveIntensity = Math.sin(t * 12) > 0 ? 6 : 0.3; dispatcher(w, t, u > 0.5); } },
  /* 46 Ton père était déjà mort */ { set: "HALL", fr: "Le casque du père au sol, dans la fumée", g: { ...BACK }, cam: (_w, u) => G(at("HALL", 0.45, 0.55, -3.0), at("HALL", 0.35, 0.42, -3.55), at("HALL", 0.2, 0.08, -4.4), at("HALL", 0.2, 0.08, -4.4), 38, u) },
  /* 47 mais sa voix était calme */ { set: "DISP", fr: "Gros plan de l'opérateur qui écoute", g: { ...NIGHT_IN, ...BACK, sat: -0.1 }, cam: (w, u) => { const h = headOf(w.actors.disp); return G(at("DISP", 1.05, 1.5, -1.6), at("DISP", 1.0, 1.48, -1.5), h, h, 66, u); }, st: (w, _u, t) => dispatcher(w, t, true) },
  /* 48 Il a dit */ { set: "LIV", fr: "Le téléphone rouge décroché, dans la fumée", g: { ...BACK, sat: -0.05 }, cam: (_w, u) => G(at("LIV", 0.62, 0.98, 0.2), at("LIV", 0.48, 0.92, -0.02), at("LIV", 0.08, 0.76, -0.6), at("LIV", 0.1, 0.76, -0.6), 40, u),
    st: (w, _u, t) => { w.sets.phone.set(true); } },
  /* 49 Mon fils est dans la chambre du fond */ { set: "HALL", fr: "Travelling avant vers la chambre du fond", g: { ...BACK }, cam: (_w, u) => G(at("HALL", 0, 1.5, -1.6), at("HALL", 0, 1.45, -5.6), at("HALL", 0, 1.35, -7.5), at("HALL", 0, 1.35, -7.5), 46, u) },
  /* 50 il attend */ { set: "BED", fr: "Lucas attend sur son lit, la fumée passe sous la porte", g: { ...BACK }, cam: (w, u) => faceCam(w.actors.kid, 2.40, 0.4, 0.12, u, 0.15, 40),
    st: (w, _u, t) => { kidInBed(w, t, "scared", 0.7); w.actors.kid.pose(t, { sit: true, expr: "scared", headYaw: 0.75, cover: 0.0, reach: 0.25 }); } },
  /* 51 venez le chercher */ { set: "HALL", fr: "Les pompiers foncent vers la chambre, lampes allumées", g: { ...BACK },
    cam: (_w, u) => G(at("HALL", 0.1, 1.35, -7.0), at("HALL", 0.05, 1.3, -6.8), at("HALL", 0, 1.3, -1.5), at("HALL", 0, 1.3, -2.5), 50, u),
    st: (w, u, t) => { place(w.actors.r1, "HALL", -0.25, 0, -1.2 - 3.2 * u, Math.PI); place(w.actors.r2, "HALL", 0.3, 0, -0.4 - 3.0 * u, Math.PI);
      for (const [i, a] of [[0, w.actors.r1], [1, w.actors.r2]] as const) { a.pose(t, { walk: 3.0, point: 0.2, expr: "focus" }); if (a.torch) a.torch.visible = true; torchBeam(w, i, a, at("HALL", 0, 1.0, -7.5), t, 0.42); } } },
  /* 52 Son père ne l'avait pas oublié */ { set: "LIV", fr: "Gros plan de Lucas, bouleversé", g: { ...NIGHT_IN, sat: 0.12 }, cam: (w, u) => faceCam(w.actors.lucas, 2.10, -0.12, 0.02, u, 0.12, 42),
    st: (w, _u, t) => { lucasAdult(w, 1.3, 0.6, -0.5, t, "sad"); w.fill.intensity = 2.5; w.fill.color.set("#ffc890"); w.fill.position.copy(at("LIV", 2.2, 1.9, 1.6)); } },
  /* 53 il avait utilisé son seul appel pour tenir sa promesse */ { set: "BED", fr: "Souvenir chaleureux : le père au bord du lit", g: { ...NIGHT_IN, sat: 0.12, bloom: 1.6, con: 0.04 },
    cam: (_w, u) => G(at("BED", 1.85, 1.8, 0.9), at("BED", 1.6, 1.7, 0.45), at("BED", -1.2, 0.95, -1.45), at("BED", -1.2, 0.95, -1.45), 50, u), st: (w, _u, t) => { kidInBed(w, t, "happy", 0.55); dadOnBed(w, t, false, "smile"); w.sets.bedLamp.intensity = 7; } },
  /* 54 Depuis ce jour, Lucas a remis la photo de son père au mur */ { set: "LIV", fr: "Lucas raccroche la photo au mur", g: { ...NIGHT_IN, sat: 0.22 },
    cam: (_w, u) => G(at("LIV", 1.9, 1.62, -1.75), at("LIV", 1.6, 1.6, -1.85), at("LIV", -1.45, 1.42, -2.3), at("LIV", -1.45, 1.55, -2.6), 44, u),
    st: (w, u, t) => { const k = sm((u - 0.1) / 0.55); lucasAdult(w, -1.5, -1.95, Math.PI, t, "smile", 0.35 + 0.35 * k); const p = w.sets.photo; p.visible = true; p.position.set(-1.15 - 0.35 * k, 1.3 + 0.3 * k, -2.3 - 0.36 * k); p.rotation.set(-0.3 * (1 - k), 0, 0); } },
  /* 55 et dépose des fleurs sur sa tombe tous les jours */ { set: "CEM", fr: "Aube au cimetière : les fleurs, puis grue vers le ciel", g: { bg: "#e8b8a0", fog: "#e8c0b0", fogD: 0.018, sat: 0.25, bloom: 1.5, snow: false },
    cam: (_w, u) => { const e = sm(u); return { P: L(at("CEM", -3.2, 0.9, 1.4), at("CEM", -1.2, 6.5, 9), e), T: L(at("CEM", -4.8, 0.55, -1.2), at("CEM", -4.8, 0.6, -1.6), e), fov: 40 + 8 * e }; },
    st: (w, u, t) => { w.sets.cemSun.color.set("#ffc8a0"); w.sets.cemSun.intensity = 2.2; w.sets.cemSun.position.set(25, 6, 10); w.sets.cemHemi.intensity = 1.0; w.sets.cemHemi.color.set("#ffd8c8");
      place(w.actors.lucas, "CEM", -4.75, -0.3, 0.3, Math.PI); w.actors.lucas.pose(t, { sit: true, lean: 0.25, reach: 0.55 * (1 - sm((u - 0.3) / 0.3)) + 0.1, expr: "smile", headPitch: 0.3 });
      const k = sm(u / 0.35), f = w.sets.flowers; f.position.copy(at("CEM", -4.8, 0.55 - 0.38 * k, 0.0 - 0.6 * k)); f.rotation.set(-0.5 - 0.85 * k, 0, 0); } },
];

/** fin d'après-midi -> soir (plan 28) */
const dusk = (w: World, u: number) => { const s = w.sets, k = sm(u); s.livWin.intensity = 14 * (1 - k) + 2; s.livWin.color.set(k < 0.5 ? "#dfe8ff" : "#8090d0"); s.livLamp.intensity = 7 * sm((u - 0.5) * 2);
  s.livView.map = viewTex(k > 0.6); s.livView.color.set(k > 0.6 ? "#8090c0" : "#ffffff"); };
const neighbours = (w: World, t: number, shake = false) => {
  const A = w.actors; place(A.n1, "STR", 3.6, 0, 1.0, -2.6); place(A.n2, "STR", 4.2, 0, 0.7, -2.2); place(A.n3, "STR", -2.0, 0, 0.9, 2.7); place(A.n4, "STR", -2.8, 0, 1.2, 2.3);
  A.n1.pose(t, { expr: "worried", headYaw: 0.6, headPitch: 0.1 }); A.n2.pose(t, { expr: "smug", talk: true, headYaw: -0.7, lean: 0.1, armR: -1.3 });
  A.n3.pose(t, { expr: "angry", headYaw: shake ? 0.35 * Math.sin(t * 5) : 0.5 }); A.n4.pose(t, { expr: "worried", talk: true, headYaw: -0.5 });
  w.sets.lucas.setBurnt(true); w.sets.moon.color.set("#e8ecf4"); w.sets.moon.intensity = 1.4; w.sets.strHemi.intensity = 1.5; w.sets.strHemi.color.set("#c8d0e0"); for (const h of w.sets.houses) if (h !== w.sets.lucas) h.setLit(0); for (const l of w.sets.lamps) l.intensity = 0; for (const b of w.sets.lampBulbs) b.emissiveIntensity = 0.3; };
const school = (w: World, t: number, bench: boolean, close = false) => {
  const A = w.actors; if (bench) { place(A.kidC, "SCH", 6, 0.26, -4.4, 0); A.kidC.pose(t, { sit: true, expr: "neutral", headPitch: 0.35 }); }
  else { place(A.kidC, "SCH", 0.9, 0, -1.6, close ? -0.4 : -0.59); A.kidC.pose(t, { expr: close ? "sad" : "sad", headPitch: close ? 0.05 : 0.25, headYaw: close ? 0.4 : 0 }); }
  const spots: [string, number, number][] = bench ? [["k1", -8, -2], ["k2", -7, -1], ["k3", -6.2, -2.4], ["k4", -9, -3]] : [["k1", -1.8, 0.8], ["k2", -2.6, -0.2], ["k3", -0.6, 1.6], ["k4", -2.2, 1.7]];
  for (const [k, x, z] of spots) { const a = A[k], c = bench ? V(-7.5, 0, -2) : at("SCH", 0.9, 0, -1.6).sub(O.SCH); place(a, "SCH", x, 0, z, Math.atan2(c.x - x, c.z - z));
    a.pose(t, bench ? { walk: 0, expr: "happy", wave: k === "k2" ? "R" : undefined } : { point: k === "k1" || k === "k3" ? 0.3 : undefined, expr: k === "k2" ? "smug" : "happy", talk: k === "k4" }); } };
const dispatcher = (w: World, t: number, talk: boolean) => { const a = w.actors.disp; place(a, "DISP", 0.1, 0.18, -0.55, Math.PI); a.pose(t, { sit: true, expr: talk ? "worried" : "focus", headPitch: 0.08, armR: -1.2, armL: -0.9, talk: false });
  for (const s of w.sets.dispScreens) s.emissiveIntensity = 1.1 + 0.1 * Math.sin(t * 3); };

// ---------------- état par plan
export const applyShot = (w: World, i: number, u: number, t: number, cam: THREE.Camera) => {
  const s = SHOTS[i], S = w.sets;
  S.show(s.set); for (const a of Object.values(w.actors)) a.root.visible = false; for (const b of w.beams) b.mesh.visible = false;
  w.fill.intensity = 0; w.key.intensity = 0;
  // valeurs par défaut des décors
  S.phone.set(false); S.dPhone.set(false); if (S.dPhone.lamp) (S.dPhone.lamp.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.3;
  S.clock(21.78 + t / 3600); photoWall(w, i < 39 || i > 53 ? 1 : 0); S.photoBin.visible = false; S.grave.visible = i === 8;
  S.livLamp.intensity = 7; S.livWin.intensity = 4; S.livWin.color.set("#8a9cff"); S.livView.map = viewTex(true); S.livView.color.set("#8090c0"); S.livKey.intensity = 9;
  S.livFire.set(t, cam, 0); S.livHaze.set(t, cam, 0);
  S.bedLamp.intensity = 5; S.bedUnder.emissiveIntensity = 0; S.bedDoorGlow.intensity = 0; S.bedHaze.set(t, cam, 0);
  S.hallHaze.set(t, cam, 0); S.hallFire.set(t, cam, 0); S.hallLight.intensity = 2.5; S.hallFlicker.intensity = 0; S.helmet.visible = false;
  S.lucas.setBurnt(false); for (const h of S.houses) h.setLit(1); S.houseFire.set(t, cam, 0); trucksOn(w, t, false);
  S.moon.color.set("#a8b8ff"); S.moon.intensity = 0.9; S.strHemi.intensity = 0.6; S.strHemi.color.set("#5a6aa8"); for (const l of S.lamps) l.intensity = 25; for (const b of S.lampBulbs) b.emissiveIntensity = 5;
  S.cemSun.color.set("#ffe2c0"); S.cemSun.intensity = 1.0; S.cemSun.position.set(-20, 18, 25); S.cemHemi.intensity = 0.9; S.cemHemi.color.set("#a8b4d0");
  S.flowers.position.copy(at("CEM", -4.8, 0.17, -0.6)); S.flowers.rotation.set(-1.35, 0, 0); S.flowers.visible = i >= 54;
  // jours après la mort : intérieur en lumière du jour
  if (i >= 23 && i <= 27) { S.livLamp.intensity = 0; S.livWin.intensity = 16; S.livWin.color.set("#dfe8ff"); S.livView.map = viewTex(false); S.livView.color.set("#ffffff"); S.livKey.intensity = 3; }
  // incendie (maison, couloir, chambre, salon)
  if (s.set === "STR" && ((i >= 17 && i <= 22) || i === 43)) { fireHouse(w, t, cam, i === 20 ? 0.75 : 1); S.lucas.setBurnt(false); S.lucas.win.forEach((m) => { m.emissive.set("#ff7a2a"); m.emissiveIntensity = 2.5 + Math.sin(t * 11) * 0.6; }); }
  else if (!S.lucas.burnt) S.lucas.setLit(1);
  if (i >= 31 && i <= 33) S.lucas.setBurnt(true);
  if (s.set === "HALL" && i >= 19) { S.hallHaze.set(t, cam, 0.28, "#ff5a1a"); S.hallFire.set(t, cam, 1, 0); S.hallLight.intensity = 0.4; S.hallFlicker.intensity = 14 * (0.75 + 0.25 * Math.sin(t * 13) * Math.sin(t * 5.1)); S.helmet.visible = i === 45; }
  if (s.set === "BED" && i === 49) { S.bedHaze.set(t, cam, 0.22, "#ff5a1a"); S.bedUnder.emissiveIntensity = 4 + Math.sin(t * 12); S.bedDoorGlow.intensity = 3 + Math.sin(t * 9); S.bedLamp.intensity = 0.8; }
  if (s.set === "LIV" && i === 47) { S.livFire.set(t, cam, 1, 14); S.livHaze.set(t, cam, 0.3, "#ff5a1a"); S.livLamp.intensity = 0; S.livWin.intensity = 0; S.livKey.intensity = 2; }
  if (s.set === "LIV" && i >= 37 && i !== 47) { S.livLamp.intensity = 5; S.livKey.intensity = 6; S.livKey.color.set("#ffc890"); } else S.livKey.color.set("#ffd0a0");
  s.st?.(w, u, t);
  return s;
};
export const gradeOf = (i: number): Grade => ({ sat: 0.15, con: 0.1, bri: 0, bloom: 1.1, bg: "#05060a", fog: "#000000", fogD: 0, env: 0.22, snow: false, ...SHOTS[i].g });
