// Dans cette ville — « Les Ombres » (ép. 5) : plans calés sur la voix (words.json). Rue au soleil bas (RUE), classe (CL2), place de la fête (PL),
// cuisine (MAI), bus (BUS), cabinet médical (DOC). Chaque ombre « libre » est projetée par un double invisible du personnage (fantôme), posé à part.
import * as THREE from "three";
import WORDS from "./words.json";
import { Actor, CAST, Pose } from "./chars";
import { LAMPM } from "./med";
import { Sets, O, V, SetK } from "./sets";

export const FPS = 30;
const W = WORDS as { w: string; s: number; e: number }[];
const LAST = W.filter((w) => /[a-zà-ÿ]/i.test(w.w)).pop()!;
export const TOTAL = Math.round((LAST.e + 0.2) * FPS);   // pas de blanc final : la vidéo s’arrête net après la dernière syllabe (l’application la relance) (décision du 2026-11-27)
const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9' ]/g, "").replace(/’/g, "'").trim();
const WN = W.map((w) => norm(w.w));
const find = (frag: string, from: number) => { const f = norm(frag).split(/\s+/); for (let i = from; i < WN.length; i++) if (f.every((x, k) => WN[i + k] === x)) return i; throw new Error("fragment introuvable : " + frag); };
const TW = (frag: string) => W[find(frag, 0)].s;

const sm = (x: number) => { const t = Math.min(1, Math.max(0, x)); return t * t * t * (t * (t * 6 - 15) + 10); };
const gl = (x: number) => { const t = Math.min(1, Math.max(0, x)); return 0.45 * t + 0.55 * sm(t); };
const cl = (x: number) => Math.min(1, Math.max(0, x));
const L = (a: THREE.Vector3, b: THREE.Vector3, u: number) => a.clone().lerp(b, u);
type Cam = { P: THREE.Vector3; T: THREE.Vector3; fov: number };
const G = (P0: THREE.Vector3, P1: THREE.Vector3, T0: THREE.Vector3, T1: THREE.Vector3, fov: number, u: number, f1 = fov): Cam => { const e = gl(u); return { P: L(P0, P1, e), T: L(T0, T1, e), fov: fov + (f1 - fov) * e }; };
const at = (k: SetK, x: number, y: number, z: number) => O[k].clone().add(V(x, y, z));
/** plans « C » proches (< 5 u de la cible) : recul automatique ×1,7 (retour utilisateur : trop de plans trop serrés) */
const back = (P: THREE.Vector3, T: THREE.Vector3) => { const d = P.distanceTo(T); return d < 5 ? T.clone().add(P.clone().sub(T).multiplyScalar(Math.min(1.7, 6.5 / Math.max(d, 0.5)))) : P; };
const C = (k: SetK, p0: number[], p1: number[], t0: number[], t1: number[] | null, fov: number, u: number, f1 = fov) => { const T0 = at(k, t0[0], t0[1], t0[2]), T1 = at(k, ...((t1 ?? t0) as [number, number, number])); return G(back(at(k, p0[0], p0[1], p0[2]), T0), back(at(k, p1[0], p1[1], p1[2]), T1), T0, T1, fov, u, f1); };
const headOf = (a: Actor) => { a.root.updateMatrixWorld(true); return a.neck.localToWorld(V(0, 0.7, 0)); };
const CHK = 2.7;   // recul des plans rapprochés (les visages remplissaient l'écran)
const CH = (k: SetK, a: Actor, p0: number[], p1: number[], fov: number, u: number, dy = -0.1) => { const h = headOf(a).add(V(0, dy, 0)), far = (p: number[]) => h.clone().add(at(k, p[0], p[1], p[2]).sub(h).multiplyScalar(CHK)); return G(far(p0), far(p1), h, h, fov, u); };

export type World = { sets: Sets; actors: Record<string, Actor>; gh: Record<string, Actor>; sl: THREE.SpotLight; scene?: THREE.Scene; fill: THREE.PointLight; key: THREE.SpotLight; cam?: THREE.Camera };
export type Grade = { sat: number; con: number; bri: number; bloom: number; bg: string; fog: string; fogD: number; env: number; snow: boolean };
type Shot = { set: SetK; w: string; cam: (w: World, u: number, t: number) => Cam; st?: (w: World, u: number, t: number) => void; g?: Partial<Grade>; fr: string; dt?: number; sky?: string; sunK?: number; amb?: number; night?: boolean };

const KS = ["joel", "mere", "prof", "maire", "doc", "t1", "t2", "t3", "k1", "k2", "k3", "k4", "k6", "k7", "boulanger", "facteur", "meteo", "contraire"];
const GHK = ["joel", "mere", "prof", "maire", "t1", "t2", "t3", "k3"];
const SZ: Record<string, number> = { k1: 0.95, k2: 0.95, k3: 0.82, k4: 0.95, k6: 0.95, k7: 0.95 };
/** fantôme : invisible à la caméra, mais projette une ombre */
const GHOST = new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false });
const meshesOf = new WeakMap<Actor, THREE.Mesh[]>();
const listM = (a: Actor) => { let l = meshesOf.get(a); if (!l) { l = []; a.root.traverse((o) => { if ((o as THREE.Mesh).isMesh) l!.push(o as THREE.Mesh); }); meshesOf.set(a, l); } return l; };
const castOf = (a: Actor, on: boolean) => { for (const m of listM(a)) m.castShadow = on; };
export const buildCast = (root: THREE.Object3D) => {
  const mk = (k: string, seed: number) => { const a = new Actor(CAST[k], 0.36, seed); root.add(a.root); a.root.visible = false; return a; };
  const actors = Object.fromEntries(KS.map((k, i) => [k, mk(k, i + 3)])) as Record<string, Actor>;
  const gh = Object.fromEntries(GHK.map((k, i) => { const a = mk(k, i + 3); for (const m of listM(a)) { m.material = GHOST; m.castShadow = true; m.receiveShadow = false; } return [k, a]; })) as Record<string, Actor>;
  const sl = new THREE.SpotLight("#fff2dc", 0, 40, 0.75, 0.35, 1.0); sl.castShadow = true; sl.shadow.mapSize.set(2048, 2048); sl.shadow.bias = -0.0003; sl.shadow.radius = 3; sl.shadow.camera.near = 0.3; root.add(sl, sl.target);
  return { actors, gh, sl };
};

// ---------------- ambiances : soleil bas (vif, saturé), intérieur, nuit, temps gris
const DAY: Partial<Grade> = { bg: "#86b0d8", fog: "#f0dcc0", fogD: 0.003, sat: 0.62, con: 0.2, bri: -0.03, bloom: 0.9, env: 0.4 };
const IN: Partial<Grade> = { bg: "#000", fog: "#000", fogD: 0, sat: 0.56, con: 0.18, bri: -0.03, bloom: 0.9, env: 0.4 };
const NIGHT: Partial<Grade> = { bg: "#060a18", fog: "#0c1428", fogD: 0.02, sat: 0.55, con: 0.22, bri: -0.05, bloom: 1.4, env: 0.08 };
const GRAY: Partial<Grade> = { bg: "#9aa2ac", fog: "#a8b0b8", fogD: 0.012, sat: 0.3, con: 0.08, bri: 0.0, bloom: 0.6, env: 0.55 };
const NSKY = "#1a2448", GSKY = "#b0b6c0";

const put = (w: World, k: string, set: SetK, x: number, y: number, z: number, yaw: number, s = SZ[k] ?? 1) => { const a = w.actors[k]; a.root.visible = true; a.root.position.copy(at(set, x, y, z)); a.root.rotation.set(0, yaw, 0); a.root.scale.setScalar(s); return a; };
const walk = (w: World, k: string, set: SetK, x0: number, z0: number, x1: number, z1: number, u: number, t: number, extra: Pose = {}, sp = 1.3, y = 0) => { const a = put(w, k, set, x0 + (x1 - x0) * u, y, z0 + (z1 - z0) * u, Math.atan2(x1 - x0, z1 - z0)); a.pose(t, { walk: sp, ...extra }); return a; };
const yawTo = (x0: number, z0: number, x1: number, z1: number) => Math.atan2(x1 - x0, z1 - z0);
const MED = (w: World) => w.sets.med;
const handOf = (a: Actor, right = true) => { const tH = a.s.kid ? 2 * 0.72 + 0.3 : 2; a.root.updateMatrixWorld(true); return (right ? a.rArm : a.lArm).localToWorld(V(0, -tH * 0.85 + 0.3, 0.1)); };
const inHand = (w: World, k: string, a: Actor, right = true, rx = 0, ry = 0, rz = 0, off = V(0, 0, 0)) => { const p = MED(w).props[k]; p.visible = true; p.position.copy(handOf(a, right)).add(off); p.rotation.set(rx, a.root.rotation.y + ry, rz); return p; };
const J = (w: World) => w.actors.joel;
/** ombre libre : le double invisible de k prend la pose p (décalage dp, rotation propre, étirement vertical) et l'acteur ne projette plus rien */
const shade = (w: World, k: string, t: number, p: Pose, o: { dp?: THREE.Vector3; yaw?: number; sy?: number } = {}) => { const a = w.actors[k], g = w.gh[k]; castOf(a, false);
  g.root.visible = true; g.root.position.copy(a.root.position).add(o.dp ?? V(0, 0, 0)); g.root.rotation.set(0, o.yaw ?? a.root.rotation.y, 0); const s = a.root.scale.x; g.root.scale.set(s, s * (o.sy ?? 1), s); g.pose(t, p); return g; };
/** projecteur (spot) qui découpe une ombre nette sur un mur */
const spot = (w: World, set: SetK, p: number[], tg: number[], i: number, col = "#fff2dc", ang = 0.75) => { const l = w.sl; l.position.copy(at(set, p[0], p[1], p[2])); l.target.position.copy(at(set, tg[0], tg[1], tg[2])); l.target.updateMatrixWorld(); l.intensity = i; l.color.set(col); l.angle = ang; };
/** passants dans la rue (cachés près des personnages principaux et devant la caméra basse) */
const walkers = (w: World, t: number) => { const acts = Object.entries(w.actors).filter(([, a]) => a.root.visible).map(([k, a]) => [a.root.position.clone().sub(O.RUE), k === "joel" ? 1.7 : 1.3] as [THREE.Vector3, number]); const c = w.cam ? w.cam.position.clone().sub(O.RUE) : null, f = w.cam ? w.cam.getWorldDirection(V(0, 0, 0)).setY(0).normalize() : V(0, 0, 1);
  const front = (x: number, z: number) => { if (!c || c.y > 6) return false; const vx = x - c.x, vz = z - c.z, al = vx * f.x + vz * f.z, la = Math.abs(vx * f.z - vz * f.x); return Math.hypot(vx, vz) < 2.5 || (al > 0 && al < 9 && la < 1.2 + al * 0.12); };
  const skip = (x: number, z: number) => acts.some(([p, r]) => Math.hypot(p.x - x, p.z - z) < r) || front(x, z); MED(w).walk.set(t, skip); return skip; };
// ombres au sol des passants (décalques) : direction du soleil, puis elles se figent et se tournent vers Joël
const SUNYAW = Math.PI - 0.2754, SLEN = 6.2, JX = -6, JZ = 1.6;
const decals = (w: World, t: number, tFreeze: number, turn: number) => { const m = MED(w); m.walk.shadows(false); const P0 = m.walk.pos(tFreeze); void t;
  m.decals.set(P0.map((q, i) => { if (q.hide) return null as never; const d = Math.hypot(JX - q.x, JZ - q.z); if (d < 2.2 || d > 60) return null as never;
    const k = cl(turn * 1.6 - (hash01(i) * 0.6 + d / 100)) , ty = Math.atan2(-(JZ - q.z), JX - q.x); let dy = ty - SUNYAW; while (dy > Math.PI) dy -= 2 * Math.PI; while (dy < -Math.PI) dy += 2 * Math.PI;
    return { x: q.x, z: q.z, yaw: SUNYAW + dy * sm(k), len: SLEN * (1 + 0.25 * sm(k)), wid: 1.0 }; }).filter(Boolean)); };
const hash01 = (i: number) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
// classe
const SEATS: [string, number, number][] = [["k1", -2.6, -0.6], ["k3", -2.6, 0.75], ["k4", 0.4, -0.6], ["k2", 0.4, 0.75], ["k7", -2.6, 2.1], ["k6", 0.4, 2.1]];
const seated = (w: World, t: number) => { for (const [k, x, z] of SEATS) put(w, k, "CL2", x, 0.4, z + 0.5, Math.PI).pose(t, { sit: true, expr: "neutral", headPitch: 0.25 + 0.1 * Math.sin(t + x), headYaw: Math.sin(t * 0.5 + x) * 0.2 }); };
const prof = (w: World, t: number) => put(w, "prof", "CL2", -0.6, 0, -2.5, 0.35).pose(t, { expr: "happy", talk: true, wave: "R" });
const profShadow = (w: World, t: number) => { shade(w, "prof", t, { sit: true, lean: 0.95, reach: 0.55, headPitch: 0.6, expr: "neutral" }, { dp: at("CL2", 2.2, 0.12, -3.05).sub(w.actors.prof.root.position), yaw: 0 }); spot(w, "CL2", [0.6, 1.5, 1.6], [2.3, 1.1, -3.6], 60, "#fff0d8", 0.6); };
// place de la fête : le maire sur l'estrade
const maire = (w: World, t: number) => put(w, "maire", "PL", 0, 1.0, -12.3, 0).pose(t, { expr: "happy", wave: "R", talk: Math.sin(t * 1.3) > 0 });
const maireShadow = (w: World, t: number) => { shade(w, "maire", t, { expr: "angry", bang: true, lean: 0.12 }); spot(w, "PL", [1.2, 2.2, -6.5], [0, 3.2, -16], 90, "#ffe8c8", 0.55); };
// cuisine
const kitchen = (w: World, t: number, pm: Pose = {}) => { put(w, "joel", "MAI", -2.55, 0.4, -0.4, -Math.PI / 2).pose(t, { sit: true, expr: "neutral", headYaw: 0.5 }); const m = put(w, "mere", "MAI", -4.2, 0, 1.3, Math.PI / 2 + 0.3); m.pose(t, { expr: "happy", hold: 0.35, ...pm }); inHand(w, "dessin", m, true, -0.3, 0, 0, V(-0.05, 0.1, 0.1)); return m; };
const mereShadow = (w: World, t: number, u: number) => { const thr = u > 0.5; shade(w, "mere", t, thr ? { armR: -2.6 + 3.2 * sm((u - 0.5) * 4), armL: -0.3, lean: 0.15 * sm((u - 0.5) * 4), expr: "angry" } : { armL: -1.25 + 0.18 * Math.sin(t * 23), armR: -1.25 - 0.18 * Math.sin(t * 23 + 1), expr: "angry" }); spot(w, "MAI", [-1.4, 1.5, 1.3], [-6, 1.5, 1.4], 70, "#fff0dc", 0.7); };
// bus
const bus = (w: World, t: number) => { put(w, "joel", "BUS", 0, 0.45, 1.12, Math.PI / 2).pose(t, { sit: true, expr: "neutral", headYaw: -0.4 });
  for (const [k, x, z, yaw] of [["t1", 0.6, 0.15, -Math.PI / 2], ["t2", -0.7, 0.05, Math.PI / 2], ["t3", 1.7, -0.1, Math.PI], ["boulanger", -1.7, 0.1, 0.4], ["facteur", 2.8, 0.1, -2.2], ["meteo", -2.9, 0.0, 1.2]] as [string, number, number, number][])
    put(w, k, "BUS", x, 0, z, yaw).pose(t, { expr: "neutral", armR: -2.7, headYaw: Math.sin(t * 0.6 + x) * 0.25 });
  for (const [k, x, z] of [["k6", -2.3, 1.12], ["k7", 2.3, -1.12], ["k4", -3.45, -0.62], ["contraire", 3.45, 1.12]] as [string, number, number][]) put(w, k, "BUS", x, 0.45, z, Math.PI / 2).pose(t, { sit: true, expr: "neutral" }); };
// cabinet médical
const doc = (w: World, t: number, p: Pose = {}) => { put(w, "joel", "DOC", -0.7, 0, -2.0, 0.25).pose(t, { expr: "neutral" }); put(w, "doc", "DOC", 0.9, 0, -0.9, yawTo(0.9, -0.9, -0.7, -2.0)).pose(t, { expr: "smile", ...p }); spot(w, "DOC", [1.7, 1.75, 1.4], [-1.5, 1.3, -2.9], 70, "#ffffff", 0.7); };
// matin : Joël sort de chez lui (porte côté z < 0), le soleil bas dans le dos de la rue
const JOUT = (w: World, t: number, u: number, p: Pose = {}) => put(w, "joel", "RUE", JX, 0, JZ, 0).pose(t, { expr: "neutral", ...p });

export const SHOTS: Shot[] = [
  // ——— Dans cette ville, ton ombre fait ce que tu as vraiment envie de faire.
  { w: "Dans cette ville", set: "RUE", g: DAY, fr: "Grue qui descend sur la rue bondée au soleil bas : des centaines d'ombres longues", cam: (_w, u) => G(at("RUE", 6, 42, 26), at("RUE", -4, 10, 12), at("RUE", -14, 0, -4), at("RUE", -20, 1, -3), 46, u),
    st: (w, u, t) => { walk(w, "t3", "RUE", -10, -4.8, -16, -4.8, u, t, { expr: "neutral" }); shade(w, "t3", t, { cheer: true }); } },
  { w: "ton ombre fait", set: "RUE", g: DAY, fr: "Un homme en costume marche, raide ; sur la façade, son ombre danse", cam: (w, u) => { const a = w.actors.t3.root.position; return { P: a.clone().add(V(1.5 - 1.2 * u, 1.6, 6.2)), T: a.clone().add(V(-1.8, 1.4, -1.6)), fov: 44 }; },
    st: (w, u, t) => { walk(w, "t3", "RUE", -16, -4.8, -20.5, -4.8, u, t, { expr: "neutral" }); shade(w, "t3", t, { cheer: true, headPitch: -0.3 }); } },
  { w: "vraiment envie", set: "RUE", g: DAY, fr: "Plus près de l'ombre qui danse sur le mur", cam: (w, u) => { const a = w.actors.t3.root.position; return { P: a.clone().add(V(-0.4 - 0.6 * u, 1.5, 3.4)), T: a.clone().add(V(-2.6, 1.6, -1.9)), fov: 40 }; },
    st: (w, u, t) => { walk(w, "t3", "RUE", -20.5, -4.8, -22, -4.8, u, t, { expr: "neutral" }); shade(w, "t3", t, { cheer: true }); } },
  // ——— Pas ce que tu fais. Ce que tu veux.
  { w: "Pas ce que tu fais", set: "RUE", g: DAY, fr: "Une mère et son fils marchent sagement, main dans la main", cam: (w, u) => { const a = w.actors.t2.root.position; return { P: a.clone().add(V(2.5 - 1.5 * u, 1.1, 4.2)), T: a.clone().add(V(-0.5, 1.0, 0)), fov: 42 }; },
    st: (w, u, t) => { walk(w, "t2", "RUE", -2, 0.6, -4, 0.6, u, t, { expr: "neutral", armL: -0.25 }, 1.0); walk(w, "k3", "RUE", -2, 1.25, -4, 1.25, u, t, { expr: "neutral", armR: -0.25 }, 1.0); } },
  { w: "Ce que tu veux", set: "RUE", g: DAY, fr: "Vue d'en haut : l'ombre du petit lâche la main de sa mère et part en courant", cam: (w) => { const a = w.actors.t2.root.position; return { P: a.clone().add(V(0.5, 9, 4.5)), T: a.clone().add(V(-3.5, 0, -1.2)), fov: 46 }; },
    st: (w, u, t) => { walk(w, "t2", "RUE", -4, 0.6, -5.5, 0.6, u, t, { expr: "neutral", armL: -0.25 }, 1.0); const k = walk(w, "k3", "RUE", -4, 1.25, -5.5, 1.25, u, t, { expr: "neutral", armR: -0.25 }, 1.0);
      shade(w, "k3", t * 1.6, { walk: 2.2, armsUp: 0.5 * sm(u * 3) }, { dp: V(-0.2 - 4.5 * sm(u), 0, 1.0 + 1.5 * sm(u)), yaw: k.root.rotation.y + 0.5 }); } },
  // ——— Mon prof de maths parle des fractions avec passion. Son ombre, elle, dort sur le bureau.
  { w: "Mon prof de maths", set: "CL2", g: IN, fr: "Classe : la prof s'enflamme au tableau, les élèves s'ennuient", cam: (_w, u) => G(at("CL2", -1.6, 1.9, 3.3), at("CL2", -0.8, 1.7, 2.4), at("CL2", -0.3, 1.4, -2.8), at("CL2", 0.4, 1.4, -2.9), 48, u),
    st: (w, _u, t) => { seated(w, t); prof(w, t); MED(w).boardM.map = MED(w).boards.frac; profShadow(w, t); w.sl.intensity = 0; } },
  { w: "Son ombre, elle", set: "CL2", g: IN, fr: "Sur le mur derrière le bureau, l'ombre de la prof dort, affalée", cam: (_w, u) => G(at("CL2", -0.2, 1.6, 1.4), at("CL2", 0.5, 1.5, 0.6), at("CL2", 1.6, 1.3, -3.4), at("CL2", 1.9, 1.25, -3.5), 44, u),
    st: (w, _u, t) => { seated(w, t); prof(w, t); MED(w).boardM.map = MED(w).boards.frac; profShadow(w, t); } },
  // ——— Le maire sourit à tout le monde sur la place. Son ombre serre les poings.
  { w: "Le maire sourit", set: "PL", g: DAY, fr: "Fête de la ville : le maire salue la foule depuis l'estrade", cam: (_w, u) => G(at("PL", -6, 3.2, 4), at("PL", -3.5, 3.0, 0.5), at("PL", 0, 3.0, -12.3), at("PL", 0, 3.0, -12.3), 40, u),
    st: (w, _u, t) => { maire(w, t); MED(w).crowd.root.visible = true; MED(w).crowd.jump(t, 0.25, at("PL", 0, 2, -13)); maireShadow(w, t); w.sl.intensity = 0; } },
  { w: "Son ombre serre", set: "PL", g: DAY, fr: "Derrière lui, sur la toile, son ombre géante frappe du poing", cam: (_w, u) => G(at("PL", 2.4, 2.4, -7.6), at("PL", 1.6, 2.6, -8.6), at("PL", -0.4, 3.0, -14.5), at("PL", -0.3, 3.2, -15), 46, u),
    st: (w, _u, t) => { maire(w, t); maireShadow(w, t); } },
  // ——— Depuis, il ne fait ses discours que les jours de pluie. Et il a été réélu trois fois.
  { w: "Depuis, il ne fait", set: "PL", g: GRAY, sunK: 0.05, amb: 1.0, sky: GSKY, fr: "Ciel gris, plus d'ombre : le maire parle, sûr de lui", cam: (_w, u) => G(at("PL", 3.0, 2.8, -6.5), at("PL", 2.0, 2.9, -7.6), at("PL", 0, 2.9, -12.3), at("PL", 0, 3.0, -12.3), 40, u),
    st: (w, _u, t) => { put(w, "maire", "PL", 0, 1.0, -12.3, 0).pose(t, { expr: "smug", talk: true, point: 0.1 }); } },
  { w: "Et il a été réélu", set: "PL", g: GRAY, sunK: 0.05, amb: 1.0, sky: GSKY, fr: "La foule l'acclame sous le ciel gris", cam: (_w, u) => G(at("PL", -8, 5, 8), at("PL", -5, 6.5, 4), at("PL", 0, 2.5, -12), at("PL", 0, 2.6, -12.5), 46, u),
    st: (w, _u, t) => { put(w, "maire", "PL", 0, 1.0, -12.3, 0).pose(t, { expr: "happy", cheer: true }); MED(w).crowd.root.visible = true; MED(w).crowd.jump(t, 1.0, at("PL", 0, 2, -13)); } },
  // ——— Ma mère m'a dit qu'elle adorait mon dessin. Son ombre l'a froissé, et l'a jeté à la poubelle.
  { w: "Ma mère m'a dit", set: "MAI", g: IN, fr: "Cuisine : la mère de Joël tient son dessin, ravie", cam: (_w, u) => G(at("MAI", -1.2, 1.6, 2.4), at("MAI", -1.8, 1.55, 2.1), at("MAI", -4.0, 1.4, 1.1), at("MAI", -4.1, 1.45, 1.2), 44, u),
    st: (w, _u, t) => { kitchen(w, t, { talk: true }); mereShadow(w, t, 0); w.sl.intensity = 0; } },
  { w: "Son ombre l'a froissé", set: "MAI", g: IN, fr: "Sur le mur, son ombre froisse le dessin et le jette", cam: (_w, u) => G(at("MAI", -1.6, 1.6, 2.8), at("MAI", -2.0, 1.6, 2.6), at("MAI", -5.2, 1.5, 1.2), at("MAI", -5.4, 1.5, 1.3), 46, u),
    st: (w, u, t) => { kitchen(w, t); mereShadow(w, t, u); } },
  // ——— Ici, personne ne peut mentir. Enfin, pas en plein soleil.
  { w: "Ici, personne", set: "RUE", g: DAY, fr: "Deux voisins se serrent la main en souriant ; leurs ombres se tournent le dos", cam: (_w, u) => G(at("RUE", -9.8, 1.7, 3.5), at("RUE", -11, 1.6, 2.8), at("RUE", -11.5, 1.3, -4.6), at("RUE", -12, 1.3, -4.8), 42, u),
    st: (w, _u, t) => { const a = put(w, "t1", "RUE", -11.8, 0, -4.0, Math.PI / 2), b = put(w, "t3", "RUE", -10.9, 0, -4.0, -Math.PI / 2); a.pose(t, { expr: "happy", reach: 0.45 }); b.pose(t, { expr: "happy", reach: 0.45 });
      shade(w, "t1", t, { expr: "angry", armL: -0.2, armR: -0.2 }, { yaw: -Math.PI / 2 }); shade(w, "t3", t, { expr: "angry" }, { yaw: Math.PI / 2 }); } },
  { w: "Enfin, pas en plein soleil", set: "RUE", g: DAY, fr: "La caméra lève les yeux vers le soleil bas au bout de la rue", cam: (_w, u) => G(at("RUE", -16, 1.8, 1), at("RUE", -18, 2.4, 0.6), at("RUE", 10, 2, 0), at("RUE", 40, 16, 10), 46, u) },
  // ——— Alors les gens se parlent dos à la lumière.
  { w: "Alors les gens", set: "RUE", g: DAY, fr: "En terrasse, tout le monde tourne le dos au soleil ; leurs ombres s'étirent devant eux", cam: (_w, u) => G(at("RUE", -20, 1.3, -3.2), at("RUE", -19, 1.2, -3.6), at("RUE", -13, 1.0, -5.6), at("RUE", -13, 1.0, -5.6), 44, u),
    st: (w, _u, t) => { for (const [k, x, z] of [["t1", -13.4, -5.1], ["t2", -12.6, -6.1], ["k6", -11.4, -5.2], ["contraire", -10.6, -6.0]] as [string, number, number][]) put(w, k, "RUE", x, 0.32, z, -Math.PI / 2).pose(t, { sit: true, expr: "smile", talk: Math.sin(t * 2 + x) > 0.3, headYaw: (z < -5.5 ? 0.5 : -0.5) }); } },
  // ——— Les rendez-vous amoureux se font la nuit.
  { w: "Les rendez-vous", set: "RUE", g: NIGHT, night: true, sunK: 0, amb: 0.12, sky: NSKY, fr: "Nuit : un couple main dans la main, dans le noir entre deux réverbères", cam: (_w, u) => G(at("RUE", -4, 1.4, 1.5), at("RUE", -5, 1.4, 1.0), at("RUE", -8.5, 1.3, 4.3), at("RUE", -8.5, 1.3, 4.3), 44, u),
    st: (w, _u, t) => { put(w, "t1", "RUE", -8.9, 0, 4.4, 0.4).pose(t, { expr: "smile", armL: -0.5 }); put(w, "t2", "RUE", -8.1, 0, 4.4, -0.4).pose(t, { expr: "happy", armR: -0.5 }); spot(w, "RUE", [-13.8, 4.0, 4.1], [-13.8, 0, 4.1], 60, "#ffcf80", 0.9); } },
  // ——— Et quand il fait gris, tout le monde ment.
  { w: "Et quand il fait gris", set: "RUE", g: GRAY, sunK: 0.06, amb: 1.0, sky: GSKY, fr: "Temps gris, plus d'ombres : grands sourires et poignées de main partout", cam: (_w, u) => G(at("RUE", -2, 3.5, 3.5), at("RUE", -6, 3.0, 2.5), at("RUE", -14, 1.2, -2), at("RUE", -16, 1.2, -2.5), 46, u),
    st: (w, _u, t) => { const a = put(w, "t1", "RUE", -12.5, 0, -0.5, Math.PI / 2), b = put(w, "t2", "RUE", -11.6, 0, -0.5, -Math.PI / 2); a.pose(t, { expr: "happy", reach: 0.45, talk: true }); b.pose(t, { expr: "gummy", reach: 0.45 }); put(w, "k6", "RUE", -10, 0, 1.5, -1.2).pose(t, { expr: "happy", wave: "R" }); } },
  // ——— Les vendeurs de voitures, eux, adorent l'hiver.
  { w: "Les vendeurs de voitures", set: "TOWN", g: GRAY, fr: "Temps gris : un vendeur tout sourire vend une voiture cabossée", cam: (_w, u) => G(at("TOWN", 9.5, 1.9, 6.5), at("TOWN", 8.2, 1.8, 5.4), at("TOWN", 5, 1.0, 0.4), at("TOWN", 4.6, 1.0, 0.4), 44, u),
    st: (w, _u, t) => { const S2 = w.sets; S2.sun.TOWN.intensity = 0.15; S2.hemi.TOWN.intensity = 1.3; put(w, "facteur", "TOWN", 6.6, 0, 1.6, -1.2).pose(t, { expr: "gummy", reach: 0.45, talk: true }); put(w, "t3", "TOWN", 5.7, 0, 2.3, 2.0).pose(t, { expr: "smile", reach: 0.45 }); } },
  // ——— Moi, je n'ai jamais eu d'ombre.
  { w: "Moi, je n'ai jamais", set: "RUE", g: DAY, fr: "Au ras du sol : toutes les ombres s'étirent… sauf celle de Joël, qui n'en a pas", cam: (_w, u) => G(at("RUE", -1.8, 0.55, 3.8), at("RUE", -2.4, 0.7, 3.2), at("RUE", -8, 0.8, 0.8), at("RUE", -8, 1.0, 1.0), 44, u),
    st: (w, _u, t) => { JOUT(w, t, 0); MED(w).ring.set(t, (x, z) => Math.hypot(x - JX, z - JZ) < 1.8); } },
  { w: "Ni au soleil", set: "RUE", g: DAY, fr: "Plongée verticale : Joël au milieu de la foule, le seul sans ombre", cam: (_w, u) => G(at("RUE", JX + 0.6, 16, JZ + 0.4), at("RUE", JX + 0.3, 11, JZ + 0.25), at("RUE", JX - 1.5, 0, JZ - 0.3), at("RUE", JX - 1.2, 0, JZ - 0.2), 44, u),
    st: (w, _u, t) => { JOUT(w, t, 0, { headPitch: -0.6 }); MED(w).ring.set(t, (x, z) => Math.hypot(x - JX, z - JZ) < 1.8); } },
  { w: "ni sous les lampadaires", set: "RUE", g: NIGHT, night: true, sunK: 0, amb: 0.12, sky: NSKY, fr: "Nuit, sous un réverbère : le poteau projette son ombre, pas Joël", cam: (_w, u) => G(at("RUE", 1.5, 3.2, 0.2), at("RUE", 0.5, 2.6, 0.8), at("RUE", -2.6, 0.6, 3.6), at("RUE", -2.6, 0.8, 3.6), 42, u),
    st: (w, _u, t) => { put(w, "joel", "RUE", -2.3, 0, 3.3, 0.6).pose(t, { expr: "neutral" }); walk(w, "t3", "RUE", -5.5, 2.4, -4.2, 2.6, cl(t % 3 / 3), t, { expr: "neutral" }); spot(w, "RUE", [-2.8, 4.0, 4.1], [-2.6, 0, 3.4], 80, "#ffcf80", 0.85); } },
  // ——— Les médecins disent que c'est rare, mais que ce n'est pas grave.
  { w: "Les médecins", set: "DOC", g: IN, fr: "Cabinet médical : sous la lampe, l'ombre du médecin sur le mur… pas celle de Joël", cam: (_w, u) => G(at("DOC", 2.4, 1.7, 1.9), at("DOC", 2.0, 1.65, 1.4), at("DOC", -0.4, 1.3, -2.2), at("DOC", -0.5, 1.3, -2.3), 46, u),
    st: (w, _u, t) => { doc(w, t, { talk: true }); } },
  { w: "mais que ce n'est pas grave", set: "DOC", g: IN, fr: "Le médecin hausse les épaules, souriant", cam: (_w, u) => G(at("DOC", -0.1, 1.7, 0.6), at("DOC", 0.0, 1.7, 0.3), at("DOC", 0.9, 1.6, -0.9), at("DOC", 0.9, 1.6, -0.9), 40, u),
    st: (w, _u, t) => { doc(w, t, { expr: "happy", armL: -0.5, armR: -0.5, talk: true }); } },
  // ——— Les gens, eux, n'aiment pas ça. Ils ne savent jamais ce que je pense.
  { w: "Les gens, eux", set: "RUE", g: DAY, fr: "Dans la rue, les passants s'arrêtent et dévisagent Joël", cam: (w, u) => { const h = headOf(J(w)); return G(h.clone().add(V(3.4, 0.2, 3.2)), h.clone().add(V(2.4, 0.1, 2.6)), h.clone().add(V(-1.5, -0.4, -1.5)), h.clone().add(V(-1.2, -0.4, -1.2)), 46, u); },
    st: (w, u, t) => { walk(w, "joel", "RUE", -3, 1.4, -6, 1.4, u, t, { expr: "neutral" }, 1.0); for (const [k, x, z] of [["t1", -7.4, -0.6], ["t2", -8.2, 2.9], ["k6", -5.0, 3.4], ["boulanger", -9.4, 0.8]] as [string, number, number][]) put(w, k, "RUE", x, 0, z, yawTo(x, z, -4.5, 1.4)).pose(t, { expr: k === "k6" ? "worried" : "angry", headYaw: 0 }); } },
  { w: "Ils ne savent jamais", set: "RUE", g: DAY, fr: "Gros plan Joël, impassible ; autour, les ombres des autres, aucune à ses pieds", cam: (w, u) => { const h = headOf(J(w)); return G(h.clone().add(V(-2.4, -0.2, 1.6)), h.clone().add(V(-1.9, -0.15, 1.3)), h.clone().add(V(0, -0.15, 0)), h.clone().add(V(0, -0.15, 0)), 40, u); },
    st: (w, u, t) => { walk(w, "joel", "RUE", -6, 1.4, -7.2, 1.4, u, t, { expr: "neutral" }, 1.0); for (const [k, x, z] of [["t1", -9.0, -0.4], ["t2", -9.6, 3.0]] as [string, number, number][]) put(w, k, "RUE", x, 0, z, yawTo(x, z, -6.5, 1.4)).pose(t, { expr: "angry" }); } },
  // ——— Personne ne s'assoit à côté de moi dans le bus.
  { w: "Personne ne s'assoit", set: "BUS", g: IN, fr: "Bus bondé : tout le monde debout, les sièges autour de Joël restent vides", cam: (_w, u) => G(at("BUS", 4.8, 1.85, -0.9), at("BUS", 4.2, 1.8, -0.6), at("BUS", -0.5, 1.0, 0.6), at("BUS", -0.3, 1.0, 0.7), 50, u),
    st: (w, _u, t) => { bus(w, t); } },
  // ——— J'avais fini par m'y habituer.
  { w: "J'avais fini", set: "RUE", g: { ...DAY, fog: "#f0b890", fogD: 0.006, bri: -0.05, bloom: 1.05 }, fr: "Fin de journée : Joël seul en terrasse, les autres tables vides autour de lui", cam: (_w, u) => G(at("RUE", -9.5, 1.5, -1.5), at("RUE", -10.5, 1.4, -2.2), at("RUE", -13.4, 1.0, -5.1), at("RUE", -13.4, 1.0, -5.1), 42, u),
    st: (w, _u, t) => { put(w, "joel", "RUE", -13.4, 0.32, -5.1, Math.PI / 2 + 0.4).pose(t, { sit: true, expr: "neutral", headPitch: 0.15 }); } },
  // ——— Mais ce matin, en sortant de chez moi, il y avait quelque chose à mes pieds.
  { w: "Mais ce matin", set: "RUE", g: DAY, fr: "Matin : Joël sort de chez lui, soleil rasant", cam: (_w, u) => G(at("RUE", JX + 3.5, 1.6, 6.0), at("RUE", JX + 2.6, 1.5, 5.4), at("RUE", JX, 1.3, -4.0), at("RUE", JX, 1.2, -1.0), 44, u),
    st: (w, u, t) => { walk(w, "joel", "RUE", JX, -6.2, JX, JZ - 1.0, u, t, { expr: "neutral" }, 1.0); } },
  { w: "il y avait quelque chose", set: "RUE", g: DAY, fr: "Au ras du sol : quelque chose de sombre s'étire à ses pieds", cam: (_w, u) => G(at("RUE", JX - 1.0, 0.35, JZ + 2.2), at("RUE", JX - 1.4, 0.3, JZ + 1.9), at("RUE", JX - 2.2, 0.1, JZ - 0.4), at("RUE", JX - 2.4, 0.1, JZ - 0.5), 46, u),
    st: (w, u, t) => { JOUT(w, t, u, { headPitch: 0.5 * u }); shade(w, "joel", t, {}, { sy: 0.03 + 0.25 * sm(u) }); } },
  // ——— Une ombre. La mienne.
  { w: "Une ombre", set: "RUE", g: DAY, fr: "Son ombre pousse, longue, sur les pavés", cam: (_w, u) => G(at("RUE", JX + 1.5, 3.4, JZ + 3.0), at("RUE", JX + 1.0, 4.2, JZ + 2.4), at("RUE", JX - 3.0, 0, JZ - 0.9), at("RUE", JX - 3.6, 0, JZ - 1.0), 44, u),
    st: (w, u, t) => { JOUT(w, t, u, { headPitch: 0.5 }); shade(w, "joel", t, {}, { sy: 0.28 + 0.72 * sm(u * 1.3) }); } },
  { w: "La mienne", set: "RUE", g: DAY, fr: "Gros plan Joël, sidéré", cam: (w, u) => { const h = headOf(J(w)); return G(h.clone().add(V(0.6, -0.5, 2.6)), h.clone().add(V(0.5, -0.45, 2.2)), h.clone().add(V(0, -0.1, 0)), h.clone().add(V(0, -0.1, 0)), 40, u); },
    st: (w, _u, t) => { JOUT(w, t, 0, { expr: "worried", headPitch: 0.45 }); shade(w, "joel", t, {}); } },
  // ——— J'ai levé la main. Elle n'a pas bougé.
  { w: "J'ai levé la main", set: "RUE", g: DAY, fr: "Joël lève la main ; au sol, son ombre reste immobile", cam: (_w, u) => G(at("RUE", JX + 2.8, 2.6, JZ + 3.6), at("RUE", JX + 2.4, 2.8, JZ + 3.2), at("RUE", JX - 2.0, 0.6, JZ - 0.4), at("RUE", JX - 2.0, 0.6, JZ - 0.4), 46, u),
    st: (w, u, t) => { JOUT(w, t, u, { expr: "worried", armR: -2.7 * sm(u * 2.5), headPitch: 0.35 }); shade(w, "joel", t, {}); } },
  { w: "Elle n'a pas bougé", set: "RUE", g: DAY, fr: "Plus près de l'ombre : pas un geste", cam: (_w, u) => G(at("RUE", JX - 2.2, 2.6, JZ + 1.8), at("RUE", JX - 2.6, 2.3, JZ + 1.5), at("RUE", JX - 4.0, 0, JZ - 0.9), at("RUE", JX - 4.2, 0, JZ - 1.0), 44, u),
    st: (w, _u, t) => { JOUT(w, t, 0, { expr: "worried", armR: -2.7 }); shade(w, "joel", t, {}); } },
  // ——— Elle ne fait pas ce que je veux. Elle montre quelque chose du doigt. Derrière moi.
  { w: "Elle ne fait pas", set: "RUE", g: DAY, fr: "Joël baisse lentement la main, inquiet", cam: (w, u) => { const h = headOf(J(w)); return G(h.clone().add(V(-1.8, -0.3, 2.2)), h.clone().add(V(-1.5, -0.25, 1.9)), h.clone().add(V(0, -0.2, 0)), h.clone().add(V(0, -0.2, 0)), 42, u); },
    st: (w, u, t) => { JOUT(w, t, u, { expr: "scared", armR: -2.7 * (1 - sm(u)), headPitch: 0.3 }); shade(w, "joel", t, {}); } },
  { w: "Elle montre quelque chose", set: "RUE", g: DAY, fr: "Au sol, l'ombre se retourne et tend le bras vers l'arrière", cam: (_w, u) => G(at("RUE", JX - 1.2, 4.2, JZ + 2.8), at("RUE", JX - 1.6, 4.6, JZ + 2.4), at("RUE", JX - 3.6, 0, JZ - 1.0), at("RUE", JX - 3.6, 0, JZ - 1.4), 44, u),
    st: (w, u, t) => { JOUT(w, t, u, { expr: "scared" }); shade(w, "joel", t, { point: 0.15 - 0.15 * (1 - sm(u * 1.6)) * 0 }, { yaw: Math.PI * sm(u * 2) }); w.gh.joel.rArm.rotation.x = -1.6 * sm(u * 2 - 0.4); } },
  { w: "Derrière moi", set: "RUE", g: DAY, fr: "La caméra suit le doigt de l'ombre : derrière Joël, la porte de chez lui, entrouverte", cam: (_w, u) => G(at("RUE", JX + 0.8, 1.7, JZ + 1.6), at("RUE", JX + 0.6, 1.8, JZ + 0.6), at("RUE", JX, 1.5, -4), at("RUE", JX, 1.6, -7), 44, u),
    st: (w, _u, t) => { JOUT(w, t, 1, { expr: "scared" }); const g = shade(w, "joel", t, {}, { yaw: Math.PI }); g.rArm.rotation.x = -1.6; } },
  // ——— Je ne me suis pas retourné.
  { w: "Je ne me suis pas", set: "RUE", g: DAY, fr: "Très gros plan : Joël, figé, les yeux écarquillés", cam: (w, u) => { const h = headOf(J(w)); return G(h.clone().add(V(0.2, -0.1, 2.0)), h.clone().add(V(0.15, -0.1, 1.5)), h.clone().add(V(0, -0.05, 0)), h.clone().add(V(0, -0.05, 0)), 38, u); },
    st: (w, _u, t) => { JOUT(w, t, 1, { expr: "scared", headPitch: 0 }); const g = shade(w, "joel", t, {}, { yaw: Math.PI }); g.rArm.rotation.x = -1.6; } },
  // ——— Parce que dans toute la rue, les ombres des gens se sont arrêtées. Et une par une, elles se sont tournées vers moi.
  { w: "Parce que dans toute la rue", set: "RUE", g: DAY, fr: "Vue haute : la rue bondée, les passants marchent… mais leurs ombres ne les suivent plus", cam: (_w, u) => G(at("RUE", JX + 14, 20, JZ + 14), at("RUE", JX + 10, 17, JZ + 10), at("RUE", JX - 8, 0, JZ - 1), at("RUE", JX - 8, 0, JZ - 1.5), 46, u),
    st: (w, _u, t) => { JOUT(w, t, 1, { expr: "scared" }); const g = shade(w, "joel", t, {}, { yaw: Math.PI }); g.rArm.rotation.x = -1.6; } },
  { w: "les ombres des gens", set: "RUE", g: DAY, fr: "Au ras du sol : les gens sortent de leurs ombres, qui restent figées sur les pavés", cam: (_w, u) => G(at("RUE", JX - 6, 0.6, JZ + 3.5), at("RUE", JX - 8, 0.7, JZ + 3.0), at("RUE", JX - 16, 0.6, JZ - 1), at("RUE", JX - 18, 0.6, JZ - 1), 46, u),
    st: (w, _u, t) => { JOUT(w, t, 1, { expr: "scared" }); } },
  { w: "Et une par une", set: "RUE", g: DAY, fr: "Les ombres pivotent une à une, comme des aiguilles, vers Joël", cam: (_w, u) => G(at("RUE", JX + 6, 14, JZ + 8), at("RUE", JX + 3, 16, JZ + 5), at("RUE", JX - 4, 0, JZ - 0.5), at("RUE", JX - 2, 0, JZ), 46, u),
    st: (w, _u, t) => { JOUT(w, t, 1, { expr: "scared" }); } },
  { w: "elles se sont tournées", set: "RUE", g: DAY, fr: "Plongée sur Joël : toutes les ombres de la rue pointent vers lui", cam: (_w, u) => G(at("RUE", JX + 0.5, 9, JZ + 2), at("RUE", JX + 0.2, 6, JZ + 1.2), at("RUE", JX, 0.5, JZ), at("RUE", JX, 0.8, JZ), 48, u, 44),
    st: (w, _u, t) => { JOUT(w, t, 1, { expr: "scared", headPitch: -0.4 }); } },
];
const T_TURN0 = () => TW("Et une par une"), T_END = () => W[W.length - 1].e;

export const SHOT_START = (() => { let from = 0; return SHOTS.map((s) => { const i = find(s.w, from); from = i + 1; return i; }); })();
export const START = SHOT_START.map((wi, i) => (i === 0 ? 0 : Math.round((W[wi].s + (SHOTS[i].dt ?? 0)) * FPS) - 2));
export const shotAt = (f: number) => { let i = 0; while (i + 1 < START.length && START[i + 1] <= f) i++; return i; };
export const uOf = (i: number, f: number) => { const a = START[i], b = i + 1 < START.length ? START[i + 1] : TOTAL; return Math.min(1, Math.max(0, (f - a) / Math.max(1, b - a - 1))); };

const DEF: Grade = { sat: 0.45, con: 0.06, bri: 0, bloom: 0.9, bg: "#000", fog: "#000", fogD: 0, env: 0.5, snow: false };
export const gradeOf = (i: number): Grade => ({ ...DEF, ...(SHOTS[i].g ?? {}) });
const I_FREEZE = SHOTS.findIndex((s) => s.w === "Parce que dans toute la rue");

export const applyShot = (w: World, i: number, u: number, t: number, _cam: THREE.Camera) => {
  w.cam = _cam;
  const s = SHOTS[i], S = w.sets, m = S.med; S.show(s.set);
  for (const a of Object.values(w.actors)) { a.root.visible = false; a.root.position.y = 0; a.root.quaternion.identity(); a.torso.scale.set(1, 1, 1); castOf(a, true); }
  for (const g of Object.values(w.gh)) g.root.visible = false; castOf(w.actors.joel, false);   // Joël n'a pas d'ombre
  for (const x of Object.values(S.tags)) x.visible = false; for (const x of S.rain) x.visible = false; for (const x of Object.values(m.labels)) x.visible = false;
  for (const p of Object.values(m.props)) { p.visible = false; p.scale.setScalar(1); }
  m.crowd.root.visible = false; m.gulls.root.visible = false; m.walk.root.visible = false; m.walkPL.root.visible = false; m.ring.root.visible = false; m.decals.root.visible = false; m.walk.shadows(true); m.ring.shadows(true);
  m.boardM.map = m.boards.nom; w.sl.intensity = 0;
  for (const k of m.skies) { k.color.set(s.sky ?? "#ffffff"); k.map = m.day; }
  for (const [l, base] of m.suns) l.intensity = base * (s.sunK ?? 1);
  for (const [h, base] of m.hemis) h.intensity = base * (s.amb ?? 1);
  LAMPM.emissiveIntensity = s.night ? 4 : 0.25; m.lamp.emissiveIntensity = s.night ? 4 : 1.2; m.lampL.intensity = 0;
  w.fill.intensity = 0; w.key.intensity = 0;
  s.st?.(w, u, t);
  if (s.set === "RUE") { const skip = walkers(w, t); if (i >= I_FREEZE) { const tf = START[I_FREEZE] / FPS + 0.5; const tt = Math.max(0, (t - T_TURN0()) / Math.max(0.5, T_END() - T_TURN0()));
      if (t > tf) decals(w, t, tf, tt); void skip; } }
  if (s.set === "PL") m.walkPL.set(t, (x, z) => z < -2 && z > -20);
  return s;
};
