// « Les Mots Gentils » ép. 1 : les plans calés sur la voix (words.json) — chaque plan commence sur un fragment de phrase.
// Échelle : 1 unité ≈ 0,8 m ; adulte (taille 1) ≈ 2,2 u ≈ 1,75 m ; enfant (taille 1) ≈ 1,7 u.
import * as THREE from "three";
import WORDS from "./words.json";
import { Actor, CAST, Expr, Pose } from "./chars";
import { Sets, O, V, SetK } from "./sets";

export const FPS = 30;
const W = WORDS as { w: string; s: number; e: number }[];
const LAST = W.filter((w) => /[a-zà-ÿ]/i.test(w.w)).pop()!;
export const TOTAL = Math.round((LAST.e + 1.6) * FPS);
const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9' ]/g, "").replace(/’/g, "'").trim();
const WN = W.map((w) => norm(w.w));
const find = (frag: string, from: number) => { const f = norm(frag).split(/\s+/); for (let i = from; i < WN.length; i++) if (f.every((x, k) => WN[i + k] === x)) return i; throw new Error("fragment introuvable : " + frag); };

// ---------------- aides
const sm = (x: number) => { const t = Math.min(1, Math.max(0, x)); return t * t * t * (t * (t * 6 - 15) + 10); };
const gl = (x: number) => { const t = Math.min(1, Math.max(0, x)); return 0.45 * t + 0.55 * sm(t); };
const cl = (x: number) => Math.min(1, Math.max(0, x));
const L = (a: THREE.Vector3, b: THREE.Vector3, u: number) => a.clone().lerp(b, u);
type Cam = { P: THREE.Vector3; T: THREE.Vector3; fov: number };
const G = (P0: THREE.Vector3, P1: THREE.Vector3, T0: THREE.Vector3, T1: THREE.Vector3, fov: number, u: number, f1 = fov): Cam => { const e = gl(u); return { P: L(P0, P1, e), T: L(T0, T1, e), fov: fov + (f1 - fov) * e }; };
const at = (k: SetK, x: number, y: number, z: number) => O[k].clone().add(V(x, y, z));
/** caméra fixe-glissée dans un décor : (x0,y0,z0) → (x1,y1,z1), cible (tx,ty,tz) → (tx1,ty1,tz1) */
const C = (k: SetK, p0: number[], p1: number[], t0: number[], t1: number[] | null, fov: number, u: number, f1 = fov) => G(at(k, p0[0], p0[1], p0[2]), at(k, p1[0], p1[1], p1[2]), at(k, t0[0], t0[1], t0[2]), at(k, ...((t1 ?? t0) as [number, number, number])), fov, u, f1);
const headOf = (a: Actor) => { a.root.updateMatrixWorld(true); return a.neck.localToWorld(V(0, 0.7, 0)); };
/** caméra vers la tête d'un personnage depuis une position du décor */
const CH = (k: SetK, a: Actor, p0: number[], p1: number[], fov: number, u: number, dy = -0.1) => { const h = headOf(a).add(V(0, dy, 0)); return G(at(k, p0[0], p0[1], p0[2]), at(k, p1[0], p1[1], p1[2]), h, h, fov, u); };

export type World = { sets: Sets; actors: Record<string, Actor>; scene?: THREE.Scene; fill: THREE.PointLight; key: THREE.SpotLight };
export type Grade = { sat: number; con: number; bri: number; bloom: number; bg: string; fog: string; fogD: number; env: number; snow: boolean };
type Shot = { set: SetK; w: string; cam: (w: World, u: number, t: number) => Cam; st?: (w: World, u: number, t: number) => void; g?: Partial<Grade>; fr: string; dt?: number };

// ---------------- distribution (tailles de base)
const KS = ["hero", "mamie", "voisin", "maire", "prof", "boulanger", "factrice", "t1", "t2", "t3", "k1", "k2", "k3", "k4", "k6", "k7"];
const SZ: Record<string, number> = { hero: 0.82, mamie: 2.3, voisin: 0.34, maire: 5.1, prof: 1, boulanger: 1, factrice: 0.95, t1: 1.05, t2: 0.9, t3: 1.6, k1: 1, k2: 1.05, k3: 1.05, k4: 1.12, k6: 1.08, k7: 1.1 };
export const buildCast = (root: THREE.Object3D) => {
  const mk = (k: string, seed: number) => { const a = new Actor(CAST[k], 0.36, seed); root.add(a.root); a.root.visible = false; return a; };
  return { actors: Object.fromEntries(KS.map((k, i) => [k, mk(k, i + 1)])) as Record<string, Actor> };
};

// ---------------- ambiances
const DAY: Partial<Grade> = { bg: "#8cc4f2", fog: "#a8cdf0", fogD: 0.0022, sat: 0.58, con: 0.17, bri: -0.035, bloom: 0.95, env: 0.4 };
const IN: Partial<Grade> = { bg: "#000", fog: "#000", fogD: 0, sat: 0.55, con: 0.16, bri: -0.035, bloom: 0.95, env: 0.45 };
const DAWN: Partial<Grade> = { bg: "#3a4a8a", fog: "#5a6aa8", fogD: 0.006, sat: 0.55, con: 0.2, bri: -0.13, bloom: 1.3, env: 0.25 };
const SUN: Partial<Grade> = { ...DAY, sat: 0.62, bloom: 1.05 };

// ---------------- mises en place
const put = (w: World, k: string, set: SetK, x: number, y: number, z: number, yaw: number, s = SZ[k] ?? 1) => { const a = w.actors[k]; a.root.visible = true; a.root.position.copy(at(set, x, y, z)); a.root.rotation.set(0, yaw, 0); a.root.scale.setScalar(s); return a; };
const walk = (w: World, k: string, set: SetK, x0: number, z0: number, x1: number, z1: number, u: number, t: number, extra: Pose = {}, sp = 1.3) => { const a = put(w, k, set, x0 + (x1 - x0) * u, 0, z0 + (z1 - z0) * u, Math.atan2(x1 - x0, z1 - z0)); a.pose(t, { walk: sp, ...extra }); return a; };
const yawTo = (x0: number, z0: number, x1: number, z1: number) => Math.atan2(x1 - x0, z1 - z0);
/** étiquette « +1 cm » au-dessus de la tête, montée + fondu */
const tag = (w: World, key: string, a: Actor, u: number, size = 1) => { const s = w.sets.tags[key], h = headOf(a), sc = a.root.scale.x / (SZ[a.s.name] ?? 1);
  s.visible = u > 0.02; s.position.copy(h).add(V(0, (0.75 + u * 0.5) * Math.max(1, sc) * (a.s.name === "maire" ? 4 : 1), 0)); const k = size * (a.s.name === "maire" ? 3.2 : 1);
  s.scale.set(1.3 * k, 0.49 * k, 1); (s.material as THREE.SpriteMaterial).opacity = cl(u * 6) * cl((1 - u) * 5); };
const HB = (w: World) => w.actors.hero;
// grande place : premier rang
const FRONT: [string, number, number][] = [["voisin", 2.2, -8.7], ["k4", 3.6, -8.7], ["hero", 5.2, -8.9], ["mamie", 7.6, -9.2], ["t3", -4.0, -8.6], ["k1", -1.0, -8.7], ["boulanger", -6.6, -8.8], ["factrice", -9.0, -8.8]];
const front = (w: World, t: number, look: THREE.Vector3, e: Partial<Record<string, Pose>> = {}, skip: string[] = []) => { for (const [k, x, z] of FRONT) { if (skip.includes(k)) continue; const a = put(w, k, "PLACE", x, 0, z, Math.PI);
  const hy = Math.atan2(look.x - x, look.z - z) - Math.PI, d = Math.hypot(look.x - x, look.z - z), hp = -Math.atan2(look.y - 1.5 * a.root.scale.x, d) * 0.8;
  a.pose(t, { expr: "neutral", headYaw: Math.max(-0.8, Math.min(0.8, ((hy + Math.PI * 3) % (Math.PI * 2)) - Math.PI)), headPitch: Math.max(-0.7, hp), ...(e[k] ?? {}) }); } };
const MAYOR = V(0, 12.4, -23.5);
const mayorStage = (w: World, t: number, p: Pose = {}, yaw = 0, s = SZ.maire) => put(w, "maire", "PLACE", 0, 1.2, -23.5, yaw, s).pose(t, { expr: "smug", ...p });
const sunday = (w: World, t: number, look = MAYOR, amp = 0) => { w.sets.crowd.root.visible = true; w.sets.crowd.jump(t, amp, look); };
// classe
const SEATS: [string, number, number][] = [["k1", -2.6, -0.6], ["k3", -2.6, 0.75], ["k4", -1.1, -0.6], ["k2", -1.1, 0.75], ["k7", 0.4, 0.75], ["k6", -2.6, 2.1], ["hero", 0.4, 2.1]];
const seated = (w: World, t: number, skip: string[] = [], e: Expr = "smile") => { for (const [k, x, z] of SEATS) { if (skip.includes(k)) continue; put(w, k, "CLS", x, 0.4, z + 0.5, Math.PI).pose(t, { sit: true, expr: e, headYaw: Math.sin(t * 0.7 + x) * 0.2, headPitch: -0.05 }); } };
const profBoard = (w: World, t: number) => put(w, "prof", "CLS", -1.6, 0, -3.1, 0.35).pose(t, { expr: "happy", armR: -2.4 + Math.sin(t * 3) * 0.15, talk: true, headYaw: 0.3 });
// mamie à côté du micro, héros debout sur son épaule droite
const MAM = [9.3, -13.3];
const onShoulder = (w: World, t: number, he: Expr, me: Expr, hp: Pose = {}, mp: Pose = {}) => { put(w, "mamie", "PLACE", MAM[0], 0, MAM[1], 0).pose(t, { expr: me, headYaw: -0.45, headPitch: -0.35, armL: -0.4, armR: -0.2, ...mp });
  put(w, "hero", "PLACE", MAM[0] - 0.8, 3.31, MAM[1], 0, w.sets.heroS).pose(t, { expr: he, ...hp }); };
// croissance finale : du haut de l'épaule (fin « mamie ») jusqu'à 10,5 fois la taille, posé devant l'estrade
const GIANT = { x: 3.5, z: -14.2, s: 8.8 };
let TA = 0, TB = 1, TC = 2;
/** croissance : phase A (TA→TB) il s'élève de l'épaule en grandissant un peu ; phase B (TB→TC) il devient géant et se pose devant l'estrade */
const giant = (w: World, t: number, e: Expr, p: Pose = {}, yaw = 0) => { const a1 = sm((t - TA) / (TB - TA)), b = cl((t - TB) / (TC - TB)), mv = sm(b / 0.45), gb = sm(b);
  const s = t < TB ? 0.8 + 0.8 * a1 : 1.6 + (GIANT.s - 1.6) * gb, x0 = MAM[0] - 0.8 - 0.9 * a1, y0 = 3.31 + 1.3 * a1;
  const a = put(w, "hero", "PLACE", x0 + (GIANT.x - x0) * mv, y0 * (1 - mv), MAM[1] + (GIANT.z - MAM[1]) * mv, yaw, s);
  const fl = a1 * (1 - mv); a.pose(t, { expr: e, armL: -0.4 - fl * 1.2, armR: -0.4 - fl * 1.2, ...p });
  const mb = sm(b / 0.5); put(w, "mamie", "PLACE", MAM[0] + 0.5 * mb, 0, MAM[1] + 3.1 * mb, 0).pose(t, { expr: t > TA + 0.4 ? "happy" : "scared", headPitch: -0.6, headYaw: -0.3, walk: mb > 0 && mb < 1 ? 0.8 : 0 }); };

export const SHOTS: Shot[] = [
  // ——— Dans cette ville, chaque fois que tu dis quelque chose de gentil, tu grandis d'un centimètre.
  { w: "Dans cette ville", set: "TOWN", fr: "Plongée aérienne descendante sur la rue colorée : habitants de toutes les tailles", g: DAY, cam: (_w, u) => C("TOWN", [-28, 24, 32], [-12, 7.5, 17], [0, 1, -4], [2, 2.4, 0], 44, u),
    st: (w, u, t) => { walk(w, "mamie", "TOWN", 12 - u * 3, 6.6, 0, 6.6, 0.6, t, { expr: "smile" }, 0.9); walk(w, "t1", "TOWN", -8 + u * 2, -2.4, 10, -2.4, 0.5, t, { expr: "smile" }); walk(w, "t3", "TOWN", 4 - u * 2, -2.4, -10, -2.4, 0.5, t, { expr: "smile" }); walk(w, "voisin", "TOWN", -2 + u, 6.6, 10, 6.6, 0.2, t, { expr: "angry" }, 1.6); walk(w, "k2", "TOWN", 16 - u * 2, -2.4, -4, -2.4, 0.5, t, { expr: "happy" }); } },
  { w: "tu grandis d'un centimètre", set: "TOWN", fr: "Une passante complimente un enfant : elle grandit, « +1 cm »", g: DAY, cam: (_w, u) => C("TOWN", [-13.6, 1.6, -0.6], [-13.7, 1.55, 0.2], [-13.9, 1.3, 6.6], null, 44, u),
    st: (w, u, t) => { put(w, "t2", "TOWN", -14.6, 0, 6.6, Math.PI / 2 + 0.75, 0.9 + 0.04 * sm(u * 1.5)).pose(t, { expr: "happy", talk: u < 0.5, armR: -1.2 }); put(w, "k3", "TOWN", -13.1, 0, 6.6, -Math.PI / 2 - 0.75).pose(t, { expr: "happy", headPitch: -0.25 }); tag(w, "p1", w.actors.t2, cl(u * 1.2)); } },
  // ——— Et chaque fois que tu dis quelque chose de méchant, tu en perds un.
  { w: "Et chaque fois que tu dis", set: "TOWN", fr: "Un homme insulte son voisin en le pointant : il rapetisse, « −1 cm »", g: DAY, cam: (_w, u) => C("TOWN", [11.2, 1.7, 4.8], [11.1, 1.6, 4.0], [11, 1.3, -2.4], null, 44, u),
    st: (w, u, t) => { const k = cl((u - 0.45) * 2); put(w, "t1", "TOWN", 10.2, 0, -2.4, Math.PI / 2 - 0.65, 1.05 - 0.05 * sm(k)).pose(t, { expr: "angry", talk: u < 0.6, point: 0.2 }); put(w, "t3", "TOWN", 11.9, 0, -2.4, -Math.PI / 2 + 0.65, 1.0).pose(t, { expr: "worried" }); tag(w, "m1", w.actors.t1, k); } },
  // ——— Ma grand-mère fait quatre mètres. Elle doit se baisser pour entrer dans la boulangerie.
  { w: "Ma grand-mère", set: "TOWN", fr: "Contre-plongée : mamie géante (4 m) devant les maisons, le héros minuscule à côté", g: DAY, cam: (_w, u) => C("TOWN", [1.8, 0.6, 5.2], [1.6, 0.75, 4.6], [1.3, 2.4, -2.4], [1.3, 2.7, -2.4], 50, u),
    st: (w, _u, t) => { put(w, "mamie", "TOWN", 0.5, 0, -2.4, 0.15).pose(t, { expr: "happy", wave: "R" }); put(w, "hero", "TOWN", 2.5, 0, -2.0, -0.4).pose(t, { expr: "smile", headPitch: -0.45, headYaw: -0.3 }); } },
  { w: "Elle doit se baisser", set: "PLACE", fr: "Mamie se plie en deux pour passer la porte de la boulangerie", g: DAY, cam: (_w, u) => C("PLACE", [-17.2, 2.6, -11.4], [-17.6, 2.7, -12.0], [-24.4, 3.0, -17.6], null, 52, u),
    st: (w, u, t) => { w.sets.crowd.root.visible = false; put(w, "mamie", "PLACE", -23.2 - u * 0.3, 0, -17.6, -Math.PI / 2).pose(t, { expr: "smile", lean: 0.2 + 0.25 * sm(u * 1.4), headPitch: 0.35, walk: 0.4 }); } },
  // ——— Mon voisin, lui, ne fait plus que soixante centimètres. Il râle tellement qu'il prend le bus debout sur un tabouret.
  { w: "Mon voisin, lui", set: "TOWN", fr: "À hauteur de genou : le voisin (60 cm), bras croisés, grognon", g: DAY, cam: (_w, u) => C("TOWN", [12.1, 0.42, 3.4], [12.4, 0.42, 3.9], [13, 0.55, 6.6], null, 46, u),
    st: (w, _u, t) => { put(w, "voisin", "TOWN", 13, 0, 6.6, Math.PI + 0.25).pose(t, { expr: "angry", talk: true, armL: -1.1, armR: -1.1 }); } },
  { w: "Il râle tellement", set: "TOWN", fr: "Arrêt de bus : le voisin debout sur un tabouret rouge, le bus arrive", g: DAY, cam: (_w, u) => C("TOWN", [-11.4, 1.6, 7.0], [-11.0, 1.6, 6.9], [-3.4, 1.1, 5.6], null, 48, u),
    st: (w, u, t) => { const S = w.sets; for (const c of S.cars) c.visible = false; S.bus.visible = true; S.bus.position.x = -0.6 + 16 * (1 - sm(cl(u * 1.4))); S.stool.visible = true;
      put(w, "voisin", "TOWN", -4.2, 0.63, 6.3, Math.PI).pose(t, { expr: "angry", talk: true }); put(w, "t1", "TOWN", -0.6, 0, 6.7, -Math.PI / 2 - 0.4).pose(t, { expr: "neutral" }); put(w, "t2", "TOWN", -2.4, 0, 6.6, -Math.PI / 2 - 0.2).pose(t, { expr: "worried", headYaw: 0.4 }); } },
  { w: "debout sur un tabouret", set: "TOWN", fr: "Plan moyen : le voisin sur son tabouret râle devant la porte du bus", g: DAY, cam: (_w, u) => C("TOWN", [-1.6, 1.15, 8.15], [-1.9, 1.1, 8.0], [-4.2, 1.0, 6.2], null, 46, u),
    st: (w, _u, t) => { const S = w.sets; for (const c of S.cars) c.visible = false; S.bus.visible = true; S.bus.position.x = -0.6; S.stool.visible = true;
      put(w, "voisin", "TOWN", -4.2, 0.63, 6.3, Math.PI + 0.5).pose(t, { expr: "angry", talk: true, point: 0.1 }); } },
  // ——— Ici, la taille, c'est tout : plus tu es grand, plus on t'écoute.
  { w: "Ici, la taille", set: "PLACE", fr: "Grue sur la grande place : géants et petits se croisent, guirlandes", g: DAY, cam: (_w, u) => C("PLACE", [18, 9, 30], [10, 6, 24], [0, 3, -8], [-2, 2.5, -10], 48, u),
    st: (w, u, t) => { walk(w, "mamie", "PLACE", -8, 6, 8, 12, 0.3 + u * 0.3, t, { expr: "smile" }, 0.8); walk(w, "t3", "PLACE", 10, -2, -10, 4, 0.2 + u * 0.4, t, { expr: "smug" }); walk(w, "voisin", "PLACE", 4, 14, 14, 8, 0.2 + u * 0.3, t, { expr: "angry" }, 1.6); walk(w, "k6", "PLACE", -12, 14, 6, 2, u * 0.5, t, { expr: "happy" }); walk(w, "t1", "PLACE", 14, 18, -4, 22, u * 0.5, t, { expr: "smile" }); } },
  { w: "plus tu es grand", set: "PLACE", fr: "Un grand parle, les petits l'écoutent en levant la tête", g: DAY, cam: (_w, u) => C("PLACE", [-5.6, 2.0, 10.5], [-5.8, 2.1, 9.6], [-6, 2.4, 0], null, 46, u),
    st: (w, _u, t) => { put(w, "t3", "PLACE", -6, 0, 0, 0).pose(t, { expr: "smug", talk: true, armR: -1.3 }); for (const [k, x, z] of [["k1", -8.3, 2.2], ["k6", -3.7, 2.2], ["t2", -4.4, 3.6], ["voisin", -7.2, 3.1]] as [string, number, number][]) put(w, k, "PLACE", x, 0, z, yawTo(x, z, -6, 0)).pose(t, { expr: "smile", headPitch: -0.45 }); } },
  // ——— À l'école, il y a même des cours de compliments.
  { w: "À l'école", set: "CLS", fr: "Classe vue du fond : « Cours de compliments » au tableau", g: IN, cam: (_w, u) => C("CLS", [3.4, 2.5, 3.2], [3.2, 2.45, 3.0], [-1, 1.3, -3], null, 56, u),
    st: (w, _u, t) => { seated(w, t); profBoard(w, t); } },
  // ——— On se lance des « t'as de beaux cheveux » pour gagner un centimètre avant la récré.
  { w: "On se lance des", set: "CLS", fr: "Deux élèves face à face : compliment, l'une grandit (« +1 cm »)", g: IN, cam: (_w, u) => C("CLS", [2.6, 1.6, 0.4], [2.5, 1.58, 0.1], [-1.4, 1.1, -2.0], null, 54, u),
    st: (w, u, t) => { seated(w, t, ["k6", "k2"]); profBoard(w, t); put(w, "k6", "CLS", -2.05, 0, -2.0, Math.PI / 2, SZ.k6 + 0.04 * sm(u * 1.6)).pose(t, { expr: "happy", talk: u < 0.5, armR: -1.0 }); put(w, "k2", "CLS", -0.75, 0, -2.0, -Math.PI / 2).pose(t, { expr: "happy" }); tag(w, "p1", w.actors.k6, cl(u * 1.3)); } },
  { w: "pour gagner un centimètre", set: "CLS", fr: "Un élève se mesure contre la toise du fond de classe", g: IN, cam: (_w, u) => C("CLS", [1.3, 1.6, -0.9], [1.25, 1.55, -0.5], [0.95, 1.0, 3.35], null, 50, u),
    st: (w, u, t) => { seated(w, t, ["k1", "hero", "k7"]); put(w, "k1", "CLS", 0.95, 0, 3.3, Math.PI, SZ.k1 + 0.03 * sm(u * 1.5)).pose(t, { expr: "happy", headPitch: -0.1 }); } },
  // ——— Moi, je suis le plus petit de ma classe. Un mètre dix.
  { w: "Moi, je suis le plus petit", set: "CLS", fr: "Rang d'élèves contre le mur du fond : le héros, le plus petit", g: IN, cam: (_w, u) => C("CLS", [3.6, 1.7, -1.5], [3.5, 1.65, -1.1], [-0.5, 1.0, 3.0], null, 58, u),
    st: (w, _u, t) => { for (const [k, x] of [["k4", -3.0], ["k6", -1.65], ["k3", -0.3], ["hero", 0.95], ["k7", 2.25]] as [string, number][]) put(w, k, "CLS", x, 0, 3.0, Math.PI).pose(t, { expr: k === "hero" ? "sad" : "smug", headYaw: k === "hero" ? 0 : 0.3 * Math.sign(0.95 - x) }); } },
  { w: "Un mètre dix", set: "CLS", fr: "Profil : le héros contre la toise, « 1,10 m »", g: IN, cam: (_w, u) => C("CLS", [3.4, 1.35, 0.0], [3.25, 1.3, 0.3], [0.95, 1.0, 3.3], null, 48, u),
    st: (w, u, t) => { put(w, "hero", "CLS", 0.95, 0, 3.32, Math.PI).pose(t, { expr: "sad", headPitch: 0.1 }); const s = w.sets.tags.h110; s.visible = true; s.position.copy(at("CLS", 0.95, 1.75 + u * 0.1, 3.2)); s.scale.set(0.8, 0.3, 1); (s.material as THREE.SpriteMaterial).opacity = cl(u * 5); } },
  // ——— Pas parce que je suis méchant : mes compliments sortent toujours de travers.
  { w: "Pas parce que je suis méchant", set: "CLS", fr: "Le héros, mains ouvertes, devant le tableau (plan moyen)", g: IN, cam: (w, u) => CH("CLS", HB(w), [2.7, 1.45, -0.4], [2.5, 1.42, -0.7], 44, u),
    st: (w, _u, t) => { seated(w, t, ["hero"]); put(w, "hero", "CLS", -0.9, 0, -1.9, Math.PI / 2 + 0.3).pose(t, { expr: "worried", armL: -0.7, armR: -0.7 }); } },
  { w: "mes compliments sortent", set: "CLS", fr: "Il parle à une camarade qui fronce les sourcils", g: IN, cam: (_w, u) => C("CLS", [2.3, 1.55, 1.2], [2.1, 1.5, 0.9], [-0.3, 1.0, -1.9], null, 52, u),
    st: (w, _u, t) => { seated(w, t, ["hero", "k3"]); put(w, "hero", "CLS", -1.3, 0, -1.9, Math.PI / 2 + 0.35).pose(t, { expr: "happy", talk: true }); put(w, "k3", "CLS", 0.6, 0, -1.9, -Math.PI / 2 + 0.45).pose(t, { expr: "angry" }); } },
  // ——— J'ai dit à ma prof : « Vous êtes beaucoup moins sévère que ce que tout le monde raconte. »
  { w: "J'ai dit à ma prof", set: "CLS", fr: "Le héros devant le bureau de la prof (profil)", g: IN, cam: (_w, u) => C("CLS", [-1.7, 1.7, -2.1], [-1.5, 1.68, -2.1], [2.1, 1.3, -2.3], null, 58, u),
    st: (w, _u, t) => { seated(w, t, ["hero", "k1", "k4"]); put(w, "prof", "CLS", 2.2, 0, -3.15, -0.3).pose(t, { expr: "smile" }); put(w, "hero", "CLS", 2.0, 0, -1.4, Math.PI - 0.5).pose(t, { expr: "happy", talk: true }); } },
  { w: "Vous êtes beaucoup moins", set: "CLS", fr: "Par-dessus l'épaule du héros : le sourire de la prof se fige", g: IN, cam: (w, u) => CH("CLS", w.actors.prof, [0.5, 1.8, 0.6], [0.6, 1.75, 0.3], 44, u),
    st: (w, u, t) => { seated(w, t, ["hero"]); put(w, "prof", "CLS", 2.2, 0, -3.15, 0).pose(t, { expr: u < 0.55 ? "smile" : "angry" }); put(w, "hero", "CLS", 2.0, 0, -1.5, Math.PI).pose(t, { expr: "happy", talk: true }); } },
  // ——— J'ai perdu deux centimètres.
  { w: "J'ai perdu deux centimètres", set: "CLS", fr: "Le héros rapetisse un peu, « −2 cm », la prof bras croisés", g: IN, cam: (_w, u) => C("CLS", [3.5, 1.6, 1.0], [3.4, 1.55, 0.7], [2.0, 1.1, -2.0], null, 50, u),
    st: (w, u, t) => { seated(w, t, ["hero"]); put(w, "prof", "CLS", 2.2, 0, -3.15, 0).pose(t, { expr: "angry", armL: -1.1, armR: -1.1 }); w.sets.heroS = 0.82 - 0.02 * sm(u * 1.6); put(w, "hero", "CLS", 2.0, 0, -1.4, 0.6, w.sets.heroS).pose(t, { expr: "sad", headPitch: 0.2 }); tag(w, "m2", HB(w), cl(u * 1.2)); } },
  // ——— Et puis, il y a le maire. Neuf mètres. Le plus grand de la ville.
  { w: "Et puis, il y a le maire", set: "PLACE", fr: "Contre-plongée : les jambes immenses du maire traversent la place", g: DAY, cam: (_w, u) => C("PLACE", [2, 0.6, 14], [1, 0.8, 13], [-6, 3, 5], [-6, 9, 5], 50, u),
    st: (w, u, t) => { walk(w, "maire", "PLACE", -12, 3, 2, 6, 0.3 + u * 0.25, t, { expr: "smug" }, 0.6); walk(w, "t2", "PLACE", -1, 1, -9, 2, u * 0.5, t, { expr: "smile", headPitch: -0.5 }); walk(w, "k4", "PLACE", -9, 0, -1, 1, u * 0.5, t, { expr: "happy" }); } },
  { w: "Neuf mètres", set: "PLACE", fr: "Plan large : le maire sur l'estrade, haut comme la mairie", g: DAY, cam: (_w, u) => C("PLACE", [6, 2, 8], [5, 2.2, 6.2], [0, 7, -24], null, 50, u),
    st: (w, _u, t) => { mayorStage(w, t, { headYaw: Math.sin(t) * 0.2 }); walk(w, "t1", "PLACE", 4, -4, -2, -6, 0.5, t, { expr: "smile", headPitch: -0.5 }); walk(w, "k6", "PLACE", -3, -3, 3, -5, 0.4, t, { expr: "happy" }); } },
  { w: "Le plus grand de la ville", set: "PLACE", fr: "À hauteur de son visage : le maire satisfait", g: DAY, cam: (w, u) => CH("PLACE", w.actors.maire, [10.5, 12.8, -14.5], [10.0, 12.8, -15.2], 42, u, -0.8),
    st: (w, _u, t) => { mayorStage(w, t, { headYaw: 0.15 }); } },
  // ——— Chaque dimanche, sur la grande place, il complimente les gens un par un. Mais seulement les grands.
  { w: "Chaque dimanche", set: "PLACE", fr: "Dimanche : la foule remplit la place, le maire au micro géant", g: SUN, cam: (_w, u) => C("PLACE", [12, 9, 34], [8, 8, 30], [0, 6, -20], null, 46, u),
    st: (w, _u, t) => { sunday(w, t); front(w, t, MAYOR); mayorStage(w, t, { talk: true, armR: -1.4 }); } },
  { w: "il complimente les gens", set: "PLACE", fr: "Il désigne un grand au premier rang : « +1 cm » pour le maire", g: SUN, cam: (_w, u) => C("PLACE", [-9.5, 4.2, -5.5], [-9.0, 4.4, -6.2], [-2.5, 5.5, -16], null, 54, u),
    st: (w, u, t) => { sunday(w, t); front(w, t, MAYOR, { t3: { expr: "happy" } }); mayorStage(w, t, { talk: u < 0.6, point: 0.4, expr: "happy" }, -0.2, SZ.maire + 0.04 * sm(u * 1.5)); tag(w, "p1", w.actors.maire, cl(u * 1.2)); } },
  { w: "Mais seulement les grands", set: "PLACE", fr: "Au premier rang, les petits lèvent la main : ignorés", g: SUN, cam: (_w, u) => C("PLACE", [3.4, 3.0, -16.2], [3.5, 2.9, -15.7], [3.6, 0.9, -8.7], null, 50, u),
    st: (w, _u, t) => { sunday(w, t); front(w, t, MAYOR, { voisin: { expr: "sad", armR: -2.8 }, k4: { expr: "worried", armR: -2.8, armL: -2.6 }, hero: { expr: "sad", armR: -2.6 } }); } },
  // ——— Le micro est accroché à trois mètres de haut : si tu es trop petit, tu ne parles pas.
  { w: "Le micro est accroché", set: "PLACE", fr: "Panoramique vertical sur le pied du micro public jusqu'à 3 m", g: SUN, cam: (_w, u) => C("PLACE", [11, 0.8, -7.9], [10.8, 1.7, -8.2], [8.5, 0.8, -11.9], [8.5, 3.7, -12.2], 46, u),
    st: (w, _u, t) => { sunday(w, t); } },
  { w: "si tu es trop petit", set: "PLACE", fr: "Un enfant saute sous le micro sans l'atteindre", g: SUN, cam: (_w, u) => C("PLACE", [13.4, 2.0, -9.2], [13.2, 2.0, -9.5], [8.6, 1.9, -11.6], null, 48, u),
    st: (w, _u, t) => { sunday(w, t); const a = put(w, "k4", "PLACE", 8.5, 0, -10.8, Math.PI); a.root.position.y += Math.abs(Math.sin(t * 6)) * 0.35; a.pose(t, { expr: "worried", armsUp: 0.95, headPitch: -0.5 }); } },
  // ——— Un dimanche, le maire a annoncé une nouvelle loi. « Les petits sont des gens méchants. »
  { w: "Un dimanche, le maire", set: "PLACE", fr: "Large : le maire, grave, au micro devant la foule", g: SUN, cam: (_w, u) => C("PLACE", [-14, 6, 6], [-12, 6.5, 4], [0, 7.5, -22], null, 46, u),
    st: (w, _u, t) => { sunday(w, t); front(w, t, MAYOR); mayorStage(w, t, { expr: "neutral", talk: true }); } },
  { w: "Les petits sont des gens", set: "PLACE", fr: "Contre-plongée : le maire pointe la foule, furieux", g: SUN, cam: (_w, u) => C("PLACE", [7, 5.5, -11], [6.6, 5.8, -11.6], [0, 10.6, -23], null, 48, u),
    st: (w, _u, t) => { sunday(w, t); front(w, t, MAYOR, { hero: { expr: "scared" } }); mayorStage(w, t, { expr: "angry", talk: true, point: 0.3 }); } },
  // ——— « À partir de demain, tous ceux qui mesurent moins d'un mètre cinquante devront quitter la ville. »
  { w: "À partir de demain", set: "PLACE", fr: "Par-dessus l'épaule du maire : la foule en contrebas", g: SUN, cam: (_w, u) => C("PLACE", [-3.2, 13.4, -27.2], [-2.8, 13, -26.8], [1, 2, 2], null, 50, u),
    st: (w, _u, t) => { sunday(w, t); front(w, t, MAYOR); mayorStage(w, t, { expr: "angry", talk: true, armR: -1.3 }); } },
  { w: "devront quitter la ville", set: "PLACE", fr: "Premier rang : les petits se regardent, inquiets", g: SUN, cam: (_w, u) => C("PLACE", [5.6, 2.3, -13.8], [5.4, 2.25, -13.4], [4.2, 0.9, -8.7], null, 50, u),
    st: (w, _u, t) => { sunday(w, t); front(w, t, MAYOR, { voisin: { expr: "scared", headYaw: 0.6 }, k4: { expr: "scared", headYaw: -0.6 }, hero: { expr: "scared", headYaw: 0.5 }, mamie: { expr: "worried", headYaw: 0.4, headPitch: 0.3 } }); } },
  // ——— Un énorme silence. Mon voisin a baissé la tête. Moi aussi.
  { w: "Un énorme silence", set: "PLACE", fr: "Plongée fixe : la place entière, immobile", g: SUN, cam: (_w, u) => C("PLACE", [0, 22, 20], [0, 22.3, 19.4], [0, 0, -6], null, 50, u),
    st: (w, _u, t) => { sunday(w, t); front(w, t, MAYOR); mayorStage(w, t, { expr: "smug" }); } },
  { w: "Mon voisin a baissé", set: "PLACE", fr: "Le voisin baisse la tête", g: SUN, cam: (_w, u) => C("PLACE", [1.2, 0.9, -11.4], [1.4, 0.85, -11.1], [2.2, 0.55, -8.7], null, 42, u),
    st: (w, _u, t) => { sunday(w, t); front(w, t, MAYOR, { voisin: { expr: "sad", headPitch: 0.55, headYaw: 0 } }); } },
  { w: "Moi aussi", set: "PLACE", fr: "Le héros baisse la tête à côté de sa grand-mère", g: SUN, cam: (_w, u) => C("PLACE", [5.4, 1.5, -12.6], [5.3, 1.45, -12.3], [5.6, 1.1, -8.9], null, 44, u),
    st: (w, _u, t) => { sunday(w, t); front(w, t, MAYOR, { hero: { expr: "sad", headPitch: 0.5, headYaw: 0 }, voisin: { expr: "sad", headPitch: 0.5, headYaw: 0 }, mamie: { expr: "sad", headPitch: 0.3, headYaw: -0.3 } }); } },
  // ——— Et puis, sans réfléchir, j'ai commencé à grimper.
  { w: "Et puis, sans réfléchir", set: "PLACE", fr: "Le héros relève la tête, décidé", g: SUN, cam: (w, u) => CH("PLACE", HB(w), [6.4, 1.6, -12.4], [6.2, 1.55, -12.1], 44, u),
    st: (w, _u, t) => { sunday(w, t); front(w, t, MAYOR, { hero: { expr: "angry", headPitch: -0.2, headYaw: 0.3 } }); } },
  { w: "j'ai commencé à grimper", set: "PLACE", fr: "Il court vers le banc près de la fontaine", g: SUN, cam: (_w, u) => C("PLACE", [11, 1.5, -15], [11.6, 1.5, -14.6], [10, 0.9, -9.8], [14, 0.9, -10.2], 46, u),
    st: (w, u, t) => { sunday(w, t); front(w, t, MAYOR, {}, ["hero"]); walk(w, "hero", "PLACE", 6.2, -9.6, 15.8, -10.0, sm(u), t, { expr: "focus" }, 2.0); w.actors.hero.root.scale.setScalar(w.sets.heroS); } },
  // ——— Sur le banc, puis sur la fontaine, puis sur les épaules de ma grand-mère, jusqu'au micro.
  { w: "Sur le banc", set: "PLACE", fr: "Il grimpe sur le banc", g: SUN, cam: (_w, u) => C("PLACE", [19.6, 1.4, -13.6], [19.3, 1.5, -13.9], [16.8, 0.9, -10.2], null, 44, u),
    st: (w, u, t) => { sunday(w, t); const a = put(w, "hero", "PLACE", 16.8, 0.47 * sm(u * 2.5), -10.2, -Math.PI / 2 - 0.4, w.sets.heroS); a.pose(t, { expr: "focus", walk: u < 0.4 ? 1.5 : 0, armR: -1.2 }); } },
  { w: "puis sur la fontaine", set: "PLACE", fr: "Il saute sur le rebord de la fontaine, mamie l'attend", g: SUN, cam: (_w, u) => C("PLACE", [16.5, 2.6, -19.0], [16.2, 2.7, -19.3], [10.6, 2.0, -13.5], null, 50, u),
    st: (w, _u, t) => { sunday(w, t); put(w, "hero", "PLACE", 11.65, 0.84, -13.45, yawTo(11.65, -13.45, MAM[0], MAM[1]), w.sets.heroS).pose(t, { expr: "focus", armL: -1.4, armR: -1.4 }); put(w, "mamie", "PLACE", MAM[0], 0, MAM[1], 0.5).pose(t, { expr: "smile", reach: 0.7 }); } },
  { w: "puis sur les épaules", set: "PLACE", fr: "Debout sur l'épaule de mamie, le micro devant lui", g: SUN, cam: (_w, u) => C("PLACE", [4.2, 3.0, -8.0], [4.5, 3.2, -8.3], [8.8, 3.6, -13.2], null, 48, u),
    st: (w, _u, t) => { sunday(w, t, V(8.5, 4, -13.3)); onShoulder(w, t, "focus", "happy"); } },
  { w: "jusqu'au micro", set: "PLACE", fr: "Il attrape le micro", g: SUN, cam: (_w, u) => C("PLACE", [6.0, 4.6, -8.4], [6.3, 4.6, -8.8], [8.5, 4.2, -12.9], null, 46, u),
    st: (w, u, t) => { sunday(w, t, V(8.5, 4, -13.3)); onShoulder(w, t, "focus", "happy", { armR: -1.4 * sm(u * 2), armL: -0.3 }); } },
  // ——— Le maire a ri : « Toi ? Et qu'est-ce que tu vas leur dire ? »
  { w: "Le maire a ri", set: "PLACE", fr: "Le maire éclate de rire", g: SUN, cam: (_w, u) => C("PLACE", [12, 12, -14], [11.5, 12.2, -14.6], [0, 11.8, -23.5], null, 44, u),
    st: (w, _u, t) => { sunday(w, t); mayorStage(w, t, { expr: "happy", talk: true, headPitch: 0.25, headYaw: 0.3 }, 0.4); } },
  { w: "Toi", set: "PLACE", fr: "Contrechamp par-dessus mamie : le maire le pointe du doigt", g: SUN, cam: (_w, u) => C("PLACE", [10.4, 5.2, -15.6], [10.2, 5.1, -15.9], [0, 10, -23.5], null, 46, u),
    st: (w, _u, t) => { sunday(w, t, V(8.5, 4, -13.3)); onShoulder(w, t, "worried", "worried"); mayorStage(w, t, { expr: "smug", talk: true, point: 0.6, headPitch: 0.3 }, yawTo(0, -23.5, 8.5, -13.3)); } },
  // ——— J'ai regardé la place. Des milliers de gens.
  { w: "J'ai regardé la place", set: "PLACE", fr: "Par-dessus son épaule : la foule immense", g: SUN, cam: (_w, u) => C("PLACE", [8.2, 5.4, -15.4], [8.0, 5.5, -15.1], [2, 0.5, 10], null, 52, u),
    st: (w, _u, t) => { sunday(w, t, V(8.5, 4, -13.3)); onShoulder(w, t, "worried", "smile"); } },
  { w: "Des milliers de gens", set: "PLACE", fr: "Grue au-dessus de la foule qui le regarde", g: SUN, cam: (_w, u) => C("PLACE", [9, 7, -15], [4, 12, -19], [0, 0, 15], null, 54, u),
    st: (w, _u, t) => { sunday(w, t, V(8.5, 4, -13.3)); onShoulder(w, t, "worried", "smile"); front(w, t, V(8.5, 4, -13.3), {}, ["hero", "mamie"]); mayorStage(w, t, { expr: "smug" }); } },
  // ——— Le boulanger qui se lève à quatre heures.
  { w: "Le boulanger", set: "PLACE", fr: "Aube : le boulanger sort de sa boutique avec ses pains", g: DAWN, cam: (_w, u) => C("PLACE", [-19, 1.6, -12], [-19.5, 1.6, -12.5], [-24.5, 1.5, -17.4], null, 44, u),
    st: (w, u, t) => { walk(w, "boulanger", "PLACE", -25.3, -17.6, -22.2, -16.4, 0.15 + u * 0.6, t, { expr: "smile", carry: true }, 0.9); } },
  // ——— La factrice qui connaît le nom de tous les chiens.
  { w: "La factrice", set: "TOWN", fr: "La factrice caresse un chien devant une clôture", g: DAY, cam: (_w, u) => C("TOWN", [7.4, 1.9, -0.4], [7.7, 1.85, 0.2], [8.6, 0.8, 7.3], null, 50, u),
    st: (w, _u, t) => { for (const c of w.sets.cars) c.visible = false; const d = w.sets.dog; d.visible = true; d.position.set(9.3, 0, 7.4); d.rotation.y = -Math.PI / 2; d.children[d.children.length - 2].rotation.y = Math.sin(t * 14) * 0.5;
      put(w, "factrice", "TOWN", 7.9, 0, 7.3, Math.PI / 2).pose(t, { expr: "happy", talk: true, reach: 0.55, lean: 0.25, headPitch: 0.3 }); } },
  // ——— Mon voisin grognon, qui arrose les fleurs de tout le monde quand personne ne le voit.
  { w: "Mon voisin grognon", set: "TOWN", fr: "Le voisin, sur son tabouret, arrose les fleurs par-dessus une clôture en regardant autour", g: DAY, cam: (_w, u) => C("TOWN", [-14.5, 1.0, 3.4], [-14.9, 1.0, 3.9], [-16.2, 0.95, 7.8], null, 44, u),
    st: (w, _u, t) => { const S = w.sets; S.stool.visible = true; S.stool.position.set(-16.3, 0, 7.6); put(w, "voisin", "TOWN", -16.3, 0.63, 7.6, 0).pose(t, { expr: "focus", reach: 0.8, headYaw: Math.sin(t * 1.6) * 0.7 });
      S.can.visible = true; S.can.position.set(-16.3, 1.08, 7.95); S.can.scale.setScalar(0.7); S.can.rotation.set(0.35, 0, 0); } },
  // ——— Alors j'ai dit : « Je ne connais pas tous vos prénoms. »
  { w: "Alors j'ai dit", set: "PLACE", fr: "Contre-plongée : le héros parle au micro, perché sur mamie", g: SUN, cam: (_w, u) => C("PLACE", [7.0, 2.0, -8.6], [7.2, 2.2, -8.9], [8.6, 4.1, -13.1], null, 46, u),
    st: (w, _u, t) => { sunday(w, t, V(8.5, 4, -13.3)); onShoulder(w, t, "neutral", "smile", { talk: true, armR: -1.4 }); } },
  { w: "Je ne connais pas", set: "PLACE", fr: "Le héros parle (plan moyen)", g: SUN, cam: (w, u) => CH("PLACE", HB(w), [7.6, 4.7, -9.0], [7.7, 4.7, -9.3], 44, u),
    st: (w, _u, t) => { sunday(w, t, V(8.5, 4, -13.3)); onShoulder(w, t, "smile", "smile", { talk: true, armR: -1.4 }); } },
  // ——— « Mais chacun de vous a déjà rendu cette ville plus belle, au moins une fois. Merci. »
  { w: "Mais chacun de vous", set: "PLACE", fr: "Les visages de la foule levés vers lui", g: SUN, cam: (_w, u) => C("PLACE", [6, 3.5, -11], [5.6, 3.4, -10.8], [1, 1.3, -2], null, 48, u),
    st: (w, _u, t) => { sunday(w, t, V(8.5, 4, -13.3)); front(w, t, V(8.5, 4, -13.3), { voisin: { expr: "smile" }, boulanger: { expr: "happy" }, factrice: { expr: "happy" }, k4: { expr: "happy" } }, ["hero", "mamie"]); } },
  { w: "au moins une fois", set: "PLACE", fr: "Mamie, émue, lève les yeux vers lui", g: SUN, cam: (w, u) => CH("PLACE", w.actors.mamie, [11.8, 4.0, -8.8], [11.6, 4.1, -9.1], 44, u),
    st: (w, _u, t) => { sunday(w, t, V(8.5, 4, -13.3)); onShoulder(w, t, "smile", "happy", { talk: true, armR: -1.4 }, { headPitch: -0.5, headYaw: -0.55 }); } },
  { w: "Merci", set: "PLACE", fr: "« Merci » : grand sourire du héros", g: SUN, cam: (w, u) => CH("PLACE", HB(w), [10.2, 4.5, -9.2], [10.1, 4.5, -9.5], 44, u),
    st: (w, _u, t) => { sunday(w, t, V(8.5, 4, -13.3)); onShoulder(w, t, "happy", "happy", { armR: -1.4 }); } },
  // ——— Une seule phrase. Mais pour toute la place à la fois.
  { w: "Une seule phrase", set: "PLACE", fr: "De dos, au-dessus de lui : la foule silencieuse", g: SUN, cam: (_w, u) => C("PLACE", [9.6, 7, -18.5], [9.4, 7.2, -18.1], [3, 1, 10], null, 52, u),
    st: (w, _u, t) => { sunday(w, t, V(8.5, 4, -13.3)); onShoulder(w, t, "smile", "happy"); } },
  { w: "Mais pour toute la place", set: "PLACE", fr: "Des « +1 cm » s'envolent de toute la foule vers lui", g: SUN, cam: (_w, u) => C("PLACE", [-6, 6, -12], [-4, 8, -14], [6, 3, -8], null, 54, u),
    st: (w, u, t) => { sunday(w, t, V(8.5, 4, -13.3)); onShoulder(w, t, "happy", "happy"); front(w, t, V(8.5, 4, -13.3), { voisin: { expr: "happy" }, k4: { expr: "happy" } }, ["hero", "mamie"]); rain(w, u * 0.6); } },
  // ——— Un centimètre par personne. Et il y avait trois mille personnes.
  { w: "Un centimètre par personne", set: "PLACE", fr: "Les « +1 cm » convergent vers le héros", g: SUN, cam: (_w, u) => C("PLACE", [3, 4, -9.3], [3.5, 4.4, -9.8], [8.5, 4, -13.3], null, 50, u),
    st: (w, u, t) => { sunday(w, t, V(8.5, 4, -13.3)); onShoulder(w, t, "happy", "happy"); rain(w, 0.4 + u * 0.6); } },
  { w: "Et il y avait trois mille", set: "PLACE", fr: "« +3000 cm » au-dessus de lui", g: SUN, cam: (_w, u) => C("PLACE", [14, 6, -4], [13.5, 6.3, -4.6], [8.5, 5.4, -13.3], null, 50, u),
    st: (w, u, t) => { sunday(w, t, V(8.5, 4, -13.3), 0.3); onShoulder(w, t, "happy", "happy"); rain(w, 0.8 + u * 0.4); const s = w.sets.tags.p3000; s.visible = true; s.position.copy(at("PLACE", 9.0, 6.2 + u * 0.6, -13.3)); s.scale.set(3.4, 1.27, 1); (s.material as THREE.SpriteMaterial).opacity = cl(u * 5); } },
  // ——— J'ai senti mes pieds quitter les épaules de ma grand-mère. Dix mètres. Vingt mètres. Trente mètres.
  { w: "J'ai senti mes pieds", set: "PLACE", fr: "Ses pieds quittent les épaules de mamie : il grandit et s'élève", g: SUN, cam: (_w, u) => C("PLACE", [13.4, 3.4, -8.3], [13.6, 3.8, -8.1], [8.2, 4.0, -13.3], [8.0, 4.8, -13.3], 46, u, 50),
    st: (w, _u, t) => { sunday(w, t, V(8.5, 5, -13.3), 0.2); giant(w, t, "happy"); } },
  { w: "Dix mètres", set: "PLACE", fr: "Il grandit encore, la caméra recule au-dessus de la foule", g: SUN, cam: (_w, u) => C("PLACE", [18, 7, -2], [19, 9, 1], [6, 5, -14], [5, 7, -14], 52, u),
    st: (w, _u, t) => { sunday(w, t, V(5, 8, -14), 0.3); giant(w, t, "happy"); mayorStage(w, t, { expr: "scared", headPitch: -0.3, headYaw: 0.4 }); } },
  { w: "Vingt mètres", set: "PLACE", fr: "Plus large : le géant dépasse les maisons", g: SUN, cam: (_w, u) => C("PLACE", [-12, 9, 4], [-15, 12, 8], [3, 8, -14], [3, 10, -14], 54, u),
    st: (w, _u, t) => { sunday(w, t, V(3.5, 10, -14.2), 0.3); giant(w, t, "happy"); mayorStage(w, t, { expr: "scared", headPitch: -0.5, headYaw: 0.3 }); } },
  { w: "Trente mètres", set: "PLACE", fr: "Contre-plongée vertigineuse depuis la foule", g: SUN, cam: (_w, u) => C("PLACE", [18, 3.5, -4], [18.2, 3.4, -3.6], [3.5, 9, -14.2], [3.5, 11, -14.2], 70, u),
    st: (w, _u, t) => { sunday(w, t, V(3.5, 14, -14.2), 0.4); giant(w, t, "happy"); } },
  // ——— Plus grand que le maire. Il me regardait d'en bas, la bouche ouverte.
  { w: "Plus grand que le maire", set: "PLACE", fr: "De profil : le héros géant domine le maire", g: SUN, cam: (_w, u) => C("PLACE", [25, 26, -16], [24.6, 26, -16.6], [1, 8, -19], null, 60, u),
    st: (w, _u, t) => { sunday(w, t, V(3.5, 14, -14.2)); giant(w, t, "smile", {}, Math.PI); mayorStage(w, t, { expr: "scared", headPitch: -0.6, headYaw: 0.2 }, 0.35); } },
  { w: "Il me regardait d'en bas", set: "PLACE", fr: "Plongée : le maire lève la tête, bouche bée", g: SUN, cam: (_w, u) => C("PLACE", [-6, 17, -16], [-5.6, 16.8, -16.4], [0, 12.4, -23.5], null, 46, u),
    st: (w, _u, t) => { sunday(w, t, V(3.5, 14, -14.2)); giant(w, t, "smile", {}, Math.PI); mayorStage(w, t, { expr: "shout", headPitch: -0.65 }, 0.3); } },
  // ——— Je me suis penché vers lui : « Vous aussi, vous pouvez encore être gentil. »
  { w: "Je me suis penché", set: "PLACE", fr: "De profil, large : le géant se penche vers le maire", g: SUN, cam: (_w, u) => C("PLACE", [25, 18, -26], [24.6, 18.2, -26.2], [1, 9, -19], null, 58, u),
    st: (w, u, t) => { sunday(w, t, V(3.5, 14, -14.2)); giant(w, t, "smile", { lean: 0.35 * sm(u * 1.4) }, Math.PI); mayorStage(w, t, { expr: "scared", headPitch: -0.6 }, 0.25); } },
  { w: "Vous aussi", set: "PLACE", fr: "Par-dessus l'épaule du géant : le maire, tout petit en dessous", g: SUN, cam: (_w, u) => C("PLACE", [-7, 10, -27.6], [-6.6, 10.3, -27.4], [3, 13, -17], null, 56, u),
    st: (w, _u, t) => { sunday(w, t, V(3.5, 14, -14.2)); giant(w, t, "smile", { lean: 0.35, talk: true }, Math.PI); mayorStage(w, t, { expr: "worried", headPitch: -0.6 }, 0.25); } },
  // ——— Il a grandi d'un centimètre. Le premier depuis des années.
  { w: "Il a grandi d'un centimètre", set: "PLACE", fr: "Le maire grandit d'un centimètre : « +1 cm »", g: SUN, cam: (_w, u) => C("PLACE", [-9, 10.5, -15], [-8.6, 10.7, -15.6], [0, 12, -23.5], null, 46, u),
    st: (w, u, t) => { sunday(w, t, V(3.5, 14, -14.2)); giant(w, t, "smile", { lean: 0.2 }, Math.PI); mayorStage(w, t, { expr: u < 0.4 ? "worried" : "happy", headPitch: -0.3 }, 0.25, SZ.maire + 0.03 * sm(u * 1.5)); tag(w, "p1", w.actors.maire, cl(u * 1.2)); } },
  { w: "Le premier depuis des années", set: "PLACE", fr: "Le maire sourit doucement", g: SUN, cam: (w, u) => CH("PLACE", w.actors.maire, [-7.5, 12.6, -17.5], [-7.0, 12.6, -18], 42, u, -0.6),
    st: (w, _u, t) => { sunday(w, t, V(3.5, 14, -14.2)); giant(w, t, "smile", { lean: 0.2 }, Math.PI); mayorStage(w, t, { expr: "smile", headPitch: -0.2 }, 0.25, SZ.maire + 0.03); } },
  // ——— La loi n'a jamais été votée.
  { w: "La loi n'a jamais", set: "PLACE", fr: "La foule saute de joie, le géant salue", g: SUN, cam: (_w, u) => C("PLACE", [-14, 10, 30], [-10, 14, 26], [2, 6, -14], null, 50, u),
    st: (w, _u, t) => { sunday(w, t, V(3.5, 14, -14.2), 1); giant(w, t, "happy", { wave: "R" }, 0); mayorStage(w, t, { expr: "happy" }, 0, SZ.maire + 0.03); } },
  // ——— Et depuis ce jour, le micro de la place est posé par terre. Pour que tout le monde puisse parler.
  { w: "Et depuis ce jour", set: "PLACE", fr: "Plus tard : le voisin parle dans le micro posé par terre", g: DAY, cam: (_w, u) => C("PLACE", [6.4, 1.1, -12.2], [6.1, 1.1, -12.5], [3, 0.7, -9.6], null, 44, u),
    st: (w, _u, t) => { const S = w.sets; S.pubMic.visible = false; S.floorMic.visible = true; sunday(w, t, V(3, 1, -9.9)); put(w, "voisin", "PLACE", 3, 0, -9.85, 0).pose(t, { expr: "smile", talk: true }); put(w, "mamie", "PLACE", 8.6, 0, -10.6, -0.7).pose(t, { expr: "happy", headPitch: 0.3 }); } },
  { w: "Pour que tout le monde", set: "PLACE", fr: "Une fillette prend la parole ; la caméra s'élève sur la place", g: DAY, cam: (_w, u) => C("PLACE", [5.4, 1.6, -13.6], [9, 17, -25], [3, 0.6, -9.6], [2, 0, 2], 46, u, 52),
    st: (w, _u, t) => { const S = w.sets; S.pubMic.visible = false; S.floorMic.visible = true; sunday(w, t, V(3, 1, -9.9), 0.15); put(w, "k6", "PLACE", 3, 0, -9.85, 0).pose(t, { expr: "happy", talk: true, lean: 0.25 }); put(w, "voisin", "PLACE", 4.4, 0, -10.3, -0.5).pose(t, { expr: "smile" }); mayorStage(w, t, { expr: "smile", headPitch: 0.3 }, 0, SZ.maire + 0.03); } },
];

/** pluie d'étiquettes « +1 cm » de la foule vers le héros (k : 0 → 1) */
const rain = (w: World, k: number) => { const hd = headOf(HB(w)); w.sets.rain.forEach((s, i) => { const p = cl(k * 1.8 - (i / w.sets.rain.length) * 0.8); s.visible = p > 0 && p < 1;
  const a = at("PLACE", -18 + ((i * 7.3) % 36), 2.2, -4 + ((i * 4.9) % 24)); s.position.copy(a.lerp(hd, sm(p))).add(V(0, Math.sin(p * Math.PI) * 4, 0)); (s.material as THREE.SpriteMaterial).opacity = cl(p * 6) * cl((1 - p) * 4); }); };

export const SHOT_START = (() => { let from = 0; return SHOTS.map((s) => { const i = find(s.w, from); from = i + 1; return i; }); })();
export const START = SHOT_START.map((wi, i) => (i === 0 ? 0 : Math.round((W[wi].s + (SHOTS[i].dt ?? 0)) * FPS) - 2));
export const shotAt = (f: number) => { let i = 0; while (i + 1 < START.length && START[i + 1] <= f) i++; return i; };
export const uOf = (i: number, f: number) => { const a = START[i], b = i + 1 < START.length ? START[i + 1] : TOTAL; return Math.min(1, Math.max(0, (f - a) / Math.max(1, b - a - 1))); };
{ const ix = (k: string) => START[SHOTS.findIndex((s) => s.w === k)] / FPS; TA = ix("J'ai senti mes pieds"); TB = ix("Dix mètres"); TC = ix("Plus grand que le maire") - 0.2; }

const DEF: Grade = { sat: 0.45, con: 0.06, bri: 0, bloom: 0.9, bg: "#000", fog: "#000", fogD: 0, env: 0.5, snow: false };
export const gradeOf = (i: number): Grade => ({ ...DEF, ...(SHOTS[i].g ?? {}) });

/** remet le monde à zéro puis applique le plan i */
export const applyShot = (w: World, i: number, u: number, t: number, _cam: THREE.Camera) => {
  const s = SHOTS[i], S = w.sets; S.show(s.set);
  for (const a of Object.values(w.actors)) { a.root.visible = false; a.root.position.y = 0; }
  // décor des Dessins resté dans la rue : objets « dessinés » cachés, maison complète
  for (const f of S.fun) f.set(0, t); S.townCar.set(1, t); for (const b of S.balloons) b.set(0, t); S.doorD.set(0, t); S.door.set(0); S.townBook.visible = false; S.home.dw!.set(1, t, 0.12); S.home.dr!.set(1, t, 0.14);
  for (const c of S.cars) c.visible = true; S.bus.visible = false; S.stool.visible = false; S.stool.position.set(-4.2, 0, 6.3); S.can.visible = false; S.dog.visible = false;
  S.pool.set(0, t); S.floorMic.visible = false; S.pubMic.visible = true; S.mayorMic.visible = true; S.crowd.root.visible = false;
  for (const x of Object.values(S.tags)) x.visible = false; for (const x of S.rain) x.visible = false;
  S.heroS = i > SHOTS.findIndex((x) => x.w === "J'ai perdu deux centimètres") ? 0.8 : 0.82;
  w.fill.intensity = 0; w.key.intensity = 0;
  s.st?.(w, u, t);
  return s;
};
