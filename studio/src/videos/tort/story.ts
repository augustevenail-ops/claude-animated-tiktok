// « Tu as tort » ép. 1 : plans calés sur la voix (words.json). Rue stylée (RUE), place du phare (PL), maison de Joël (MAI),
// classe (CL2), studio météo + boulangerie (VILLE). Échelle : adulte ≈ 2,2 u, enfant ≈ 1,7 u.
import * as THREE from "three";
import WORDS from "./words.json";
import { Actor, CAST, Expr, Pose } from "./chars";
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

export type World = { sets: Sets; actors: Record<string, Actor>; scene?: THREE.Scene; fill: THREE.PointLight; key: THREE.SpotLight; cam?: THREE.Camera };
export type Grade = { sat: number; con: number; bri: number; bloom: number; bg: string; fog: string; fogD: number; env: number; snow: boolean };
type Shot = { dusk?: number; set: SetK; w: string; cam: (w: World, u: number, t: number) => Cam; st?: (w: World, u: number, t: number) => void; g?: Partial<Grade>; fr: string; dt?: number; sky?: string; sunK?: number };

const KS = ["joel", "hutt", "mere", "contraire", "meteo", "facteur", "boulanger", "t1", "t2", "t3", "k1", "k2", "k3", "k4", "k6", "k7"];
const SZ: Record<string, number> = { k1: 0.95, k2: 0.95, k3: 0.95, k4: 0.95, k6: 0.95, k7: 0.95 };
export const buildCast = (root: THREE.Object3D) => {
  const mk = (k: string, seed: number) => { const a = new Actor(CAST[k], 0.36, seed); root.add(a.root); a.root.visible = false; return a; };
  const actors = Object.fromEntries(KS.map((k, i) => [k, mk(k, i + 3)])) as Record<string, Actor>;
  return { actors };
};

// ---------------- ambiances : jour lumineux, intérieur, coucher de soleil
const DAY: Partial<Grade> = { bg: "#86b0d8", fog: "#dfe8f0", fogD: 0.0035, sat: 0.62, con: 0.18, bri: -0.02, bloom: 0.85, env: 0.45 };
const IN: Partial<Grade> = { bg: "#000", fog: "#000", fogD: 0, sat: 0.56, con: 0.17, bri: -0.02, bloom: 0.9, env: 0.45 };
const LATE: Partial<Grade> = { ...DAY, fog: "#f0b890", fogD: 0.006, sat: 0.62, bri: -0.05, bloom: 1.05 };
const DUSK: Partial<Grade> = { bg: "#2a1a3a", fog: "#d88a5a", fogD: 0.006, sat: 0.38, con: 0.18, bri: -0.06, bloom: 1.0, env: 0.25 };

const put = (w: World, k: string, set: SetK, x: number, y: number, z: number, yaw: number, s = SZ[k] ?? 1) => { const a = w.actors[k]; a.root.visible = true; a.root.position.copy(at(set, x, y, z)); a.root.rotation.set(0, yaw, 0); a.root.scale.setScalar(s); return a; };
const walk = (w: World, k: string, set: SetK, x0: number, z0: number, x1: number, z1: number, u: number, t: number, extra: Pose = {}, sp = 1.3, y = 0) => { const a = put(w, k, set, x0 + (x1 - x0) * u, y, z0 + (z1 - z0) * u, Math.atan2(x1 - x0, z1 - z0)); a.pose(t, { walk: sp, ...extra }); return a; };
const yawTo = (x0: number, z0: number, x1: number, z1: number) => Math.atan2(x1 - x0, z1 - z0);
const MED = (w: World) => w.sets.med;
/** étiquette flottante (montée + fondu) au-dessus d'un personnage ou d'un point */
const KEEP = new Set(["tat1", "tat2", "tat3", "t_ch", "t_ciel"]);   // retour utilisateur : pas d'autre texte que les sous-titres, sauf quelques « TU AS TORT » rouges
const lab = (w: World, key: string, text: string, col: string, a: Actor | THREE.Vector3, u: number, size = 1, dy = 0.7) => { if (!KEEP.has(key)) return; const s = MED(w).lab(key, text, col), h = a instanceof THREE.Vector3 ? a.clone() : headOf(a); s.visible = u > 0.02; s.position.copy(h).add(V(0, dy + u * 0.25, 0));
  const k0 = 2.4; s.scale.set(k0 * size, k0 * size * 0.1875, 1); (s.material as THREE.SpriteMaterial).opacity = cl(u * 6) * cl((1 - u) * 8 + 0.5); };
const handOf = (a: Actor, right = true) => { const tH = a.s.kid ? 2 * 0.72 + 0.3 : 2; a.root.updateMatrixWorld(true); return (right ? a.rArm : a.lArm).localToWorld(V(0, -tH * 0.85 + 0.3, 0.1)); };
/** accessoire dans la main */
const inHand = (w: World, k: string, a: Actor, right = true, rx = 0, ry = 0, rz = 0, off = V(0, 0, 0)) => { const p = MED(w).props[k]; p.visible = true; p.position.copy(handOf(a, right)).add(off); p.rotation.set(rx, a.root.rotation.y + ry, rz); return p; };
const prop = (w: World, k: string, set: SetK, x: number, y: number, z: number, rx = 0, ry = 0, rz = 0) => { const p = MED(w).props[k]; p.visible = true; p.position.copy(at(set, x, y, z)); p.rotation.set(rx, ry, rz); return p; };
const crowd = (w: World, t: number, a = 0) => { const c = MED(w).crowd; c.root.visible = true; c.jump(t, a, at("PL", 0, 2, -13)); };
const gulls = (w: World, t: number, fly = 0) => { const m = MED(w); m.gulls.root.visible = true; m.gulls.set(t, m.gullBase.map((b) => at("PL", b.x, b.y, b.z)), fly); };
const score = (w: World, k: number) => { const m = MED(w); m.score.map = m.scores[k]; m.score.emissiveMap = m.scores[k]; m.score.needsUpdate = true; };
const J = (w: World) => w.actors.joel;
/** passants dans la rue (cachés près des personnages principaux pour ne pas les traverser) */
const walkers = (w: World, t: number) => { const acts = Object.entries(w.actors).filter(([, a]) => a.root.visible).map(([k, a]) => [a.root.position.clone().sub(O.RUE), k === "joel" ? 1.7 : 1.4] as [THREE.Vector3, number]); const c = w.cam ? w.cam.position.clone().sub(O.RUE) : null, f = w.cam ? w.cam.getWorldDirection(V(0, 0, 0)).setY(0).normalize() : V(0, 0, 1);
  const front = (x: number, z: number) => { if (!c || c.y > 6) return false; const vx = x - c.x, vz = z - c.z, al = vx * f.x + vz * f.z, la = Math.abs(vx * f.z - vz * f.x); return Math.hypot(vx, vz) < 2.5 || (al > 0 && al < 9 && la < 1.2 + al * 0.12); };
  MED(w).walk.set(t, (x, z) => acts.some(([p, r]) => Math.hypot(p.x - x, p.z - z) < r) || front(x, z)); };   // ni sur les personnages, ni devant la caméra   // un peu d'espace autour de Joël pour qu'il ressorte
/** file d'attente à la boulangerie */
const queue = (w: World, t: number) => { put(w, "t2", "VILLE", 30.7, 0, 1.9, Math.PI + 0.1).pose(t, { expr: "neutral", headYaw: 0.3 }); put(w, "k6", "VILLE", 31.0, 0, 3.0, Math.PI - 0.2).pose(t, { expr: "smile" }); };
// scène du championnat : Joël au pupitre gauche (bleu), Contraire au pupitre droit (violet)
const JX = -3.9, CX = 3.9, LZ = -13.2;
const duel = (w: World, t: number, pj: Pose = {}, pc: Pose = {}) => { put(w, "joel", "PL", JX, 1.0, LZ, Math.PI / 2 - 0.35).pose(t, { expr: "neutral", ...pj }); put(w, "contraire", "PL", CX, 1.0, LZ, -Math.PI / 2 + 0.35).pose(t, { expr: "smug", ...pc }); };
// classe : places assises
const SEATS: [string, number, number][] = [["k1", -2.6, -0.6], ["k3", -2.6, 0.75], ["k4", 0.4, -0.6], ["k2", 0.4, 0.75], ["k7", -2.6, 2.1], ["k6", 0.4, 2.1]];
const seated = (w: World, t: number, e: Expr = "smile", laugh = false, look?: [number, number]) => { for (const [k, x, z] of SEATS) { const a = put(w, k, "CL2", x, 0.4, z + 0.5, Math.PI);
  a.pose(t, { sit: true, expr: e, talk: laugh && Math.sin(t * 3 + x * 2) > 0, headYaw: look ? yawTo(x, z + 0.5, look[0], look[1]) - Math.PI : Math.sin(t * 0.7 + x) * 0.15, point: laugh && z > 0 ? 0.1 : undefined }); } };
const joelDesk = (w: World, t: number, p: Pose = {}) => put(w, "joel", "CL2", -1.1, 0.12, 1.42, Math.PI).pose(t, { sit: true, expr: "neutral", ...p });
// cuisine
const kitchen = (w: World, t: number, pj: Pose = {}, pm: Pose = {}, momYaw = Math.PI) => { put(w, "joel", "MAI", -2.55, 0.4, -0.4, -Math.PI / 2).pose(t, { sit: true, expr: "neutral", ...pj }); put(w, "mere", "MAI", -4.3, 0, -2.0, momYaw).pose(t, { expr: "neutral", ...pm }); };
// boulangerie
const bakery = (w: World, t: number, pb: Pose = {}, pc: Pose = {}) => { const b = put(w, "boulanger", "VILLE", 30, 0, -1.35, 0.1); b.pose(t, { expr: "smile", reach: 0.75, ...pb }); inHand(w, "baguette", b, true, 0, Math.PI / 2, 0.2, V(-0.2, 0, 0.1)); put(w, "t1", "VILLE", 30.35, 0, 0.55, Math.PI - 0.1).pose(t, { expr: "neutral", ...pc }); };
// studio météo
const studio = (w: World, t: number, pm: Pose = {}, pc: Pose = {}) => { put(w, "meteo", "VILLE", 1.6, 0, -2.3, -0.25).pose(t, { expr: "happy", ...pm }); put(w, "t3", "VILLE", 2.1, 0, 4.0, Math.PI + 0.3).pose(t, { expr: "neutral", ...pc }); };
// salon final : Joël the Hutt allongé sur le canapé, la tête sur l'accoudoir droit, le ventre vers le plafond
const lying = (w: World, t: number) => { const a = put(w, "hutt", "MAI", 2.95, 0.8, 1.32, 0); a.pose(t, { expr: "neutral", armR: 0.05, armL: 0.05, headPitch: -0.25 });
  a.root.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(V(0, 0.89, 0.45), V(1, 0, 0), V(0, 0.45, -0.89))); a.lArm.rotation.z = -0.15; a.rArm.rotation.z = 0.15; return a; };

export const SHOTS: Shot[] = [
  // ——— Dans cette ville, tout le monde joue à « Tu as tort ».
  { w: "Dans cette ville", set: "RUE", sunK: 1, g: { ...DAY, fogD: 0.0009 }, fr: "Plongée à 3 m au-dessus de Joël, qui regarde la caméra ; la caméra s'éloigne et monte en accélérant : toute la ville vue du ciel",
    cam: (w, u) => { const h = headOf(J(w)); const e = 0.06 * u + 0.94 * Math.pow(u, 2.3); const P = h.clone().add(V(0.9, 3.0, 1.3)).lerp(at("RUE", -70, 270, 45), e); return { P, T: h.clone().add(V(0, -0.6, 0)).lerp(at("RUE", -40, 0, -6), Math.min(1, e * 1.3)), fov: 46 + 4 * e }; },
    st: (w, u, t) => { put(w, "joel", "RUE", -6.0, 0, 0, 0.6).pose(t, { expr: "neutral", headPitch: -0.95 }); walkers(w, t); MED(w).ring.set(t, (x, z) => Math.hypot(x + 6, z) < 1.7);
      put(w, "t1", "RUE", -16.2, 0, 4.9, Math.PI / 2 + 0.6).pose(t, { expr: "smug", talk: u < 0.55 }); const b = put(w, "t2", "RUE", -14.6, 0, 4.9, -Math.PI / 2 - 0.6); b.pose(t, { expr: "angry", point: 0.3, talk: u > 0.55 });
      lab(w, "tat1", "TU AS TORT !", "#ff4a4a", b, cl((u - 0.6) * 2.5), 2.4, 0.9); } },
  // ——— La règle est simple : quelqu'un dit une phrase, et toi, tu dois lui prouver qu'elle est fausse.
  { w: "La règle est simple", set: "RUE", fr: "En terrasse, un homme affirme qu'il fait beau ; à côté, un enfant scrute le ciel à la loupe et trouve un nuage ; l'homme se décompose", g: DAY,
    cam: (_w, u) => G(at("RUE", -16.0, 2.2, -1.2), at("RUE", -15.0, 1.9, -2.4), at("RUE", -12.0, 1.5, -5.5), at("RUE", -11.9, 1.5, -5.5), 42, u),
    st: (w, u, t) => { walkers(w, t); const a = put(w, "t3", "RUE", -12.6, 0, -5.6, 0.4); const k2 = u > 0.35 && u < 0.75; a.pose(t, { expr: u < 0.72 ? "smile" : "sad", talk: u < 0.35, armR: u < 0.35 ? -1.0 : 0 });
      const k = put(w, "k1", "RUE", -11.2, 0, -5.4, k2 ? -0.3 : -1.0); k.pose(t, { expr: k2 ? "focus" : u > 0.72 ? "smug" : "neutral", armR: k2 ? -2.3 : 0, headPitch: k2 ? -0.45 : 0, point: u > 0.75 ? 0.4 : undefined }); if (k2) inHand(w, "loupe", k, true, -0.6, 0, 0, V(0, 0.1, 0.1)); } },
  // ——— Par tous les moyens. (montage rapide)
  { w: "Par tous", set: "RUE", fr: "Montage : une femme mesure un enfant à la règle", g: DAY, cam: (w, u) => CH("RUE", w.actors.k3, [7.6, 1.3, -2.6], [7.5, 1.3, -2.9], 40, u, -0.1),
    st: (w, _u, t) => { walkers(w, t); const k = put(w, "k3", "RUE", 7.4, 0, -5.0, 0.1); k.pose(t, { expr: "worried" }); put(w, "t2", "RUE", 8.3, 0, -5.3, -0.9).pose(t, { expr: "focus", armR: -1.9 }); prop(w, "regle", "RUE", 7.6, 1.72, -5.0, 0, 0.4, 0); } },
  { w: "les moyens", set: "RUE", fr: "Montage : un chronomètre brandi", g: DAY, cam: (w, u) => CH("RUE", w.actors.t1, [-4.0, 1.7, -2.8], [-4.1, 1.72, -3.1], 38, u, -0.3),
    st: (w, _u, t) => { walkers(w, t); const a = put(w, "t1", "RUE", -4.2, 0, -5.2, 0.2); a.pose(t, { expr: "smug", armR: -2.4 }); inHand(w, "chrono", a, true, 0, 0, 0, V(0, 0.15, 0.05)); } },
  { w: "moyens", dt: 0.3, set: "RUE", fr: "Montage : un dictionnaire claqué sous le nez", g: DAY, cam: (w, u) => CH("RUE", w.actors.mere, [8.2, 1.7, -2.9], [8.1, 1.7, -3.2], 38, u, -0.25),
    st: (w, _u, t) => { walkers(w, t); const a = put(w, "mere", "RUE", 8.0, 0, -5.3, 0.1); a.pose(t, { expr: "angry", hold: 0.4 }); inHand(w, "dico", a, true, -0.3, 0, 0, V(-0.25, 0.1, 0.2)); } },
  // ——— Le matin, j'ai dit à ma mère : « Tu es en train de respirer. »
  { w: "Le matin, j'ai dit à ma mère", set: "MAI", fr: "Cuisine au matin : Joël attablé, sa mère au plan de travail", g: IN, cam: (_w, u) => C("MAI", [-5.4, 1.9, 2.4], [-5.2, 1.85, 2.1], [-3.0, 1.1, -0.8], null, 52, u),
    st: (w, _u, t) => { kitchen(w, t, { expr: "neutral", armL: -1.3 }, { expr: "neutral", armR: -0.6 }); } },
  { w: "Tu es en train de respirer", set: "MAI", fr: "Gros plan Joël, fier, qui pointe sa mère", g: IN, cam: (w, u) => CH("MAI", J(w), [-3.5, 1.6, 0.4], [-3.4, 1.6, 0.25], 40, u, -0.15),
    st: (w, _u, t) => { kitchen(w, t, { expr: "smug", point: 0.2, talk: true }); } },
  // ——— Elle a répondu : « Tu as tort. Quand tu as dit ça, j'étais entre deux respirations. »
  { w: "Elle a répondu", set: "MAI", fr: "La mère se retourne, index levé : « Tu as tort. »", g: IN, cam: (w, u) => CH("MAI", w.actors.mere, [-3.4, 1.7, -0.6], [-3.55, 1.7, -0.8], 40, u, -0.2),
    st: (w, u, t) => { kitchen(w, t, { expr: "neutral" }, { expr: "smug", armR: -2.5, talk: u > 0.4 }, yawTo(-4.3, -2.0, -2.55, -0.4)); } },
  { w: "Quand tu as dit ça", set: "MAI", fr: "Elle retient son souffle, joues gonflées : « entre deux respirations »", g: IN, cam: (_w, u) => C("MAI", [-2.2, 1.6, 1.4], [-2.4, 1.6, 1.1], [-3.6, 1.4, -1.4], null, 46, u),
    st: (w, u, t) => { kitchen(w, t, { expr: "sad" }, { expr: u > 0.5 ? "focus" : "smug", armR: -2.5, talk: u < 0.5 }, yawTo(-4.3, -2.0, -2.55, -0.4)); lab(w, "resp", "entre deux respirations", "#ffffff", w.actors.mere, cl((u - 0.45) * 2.5), 1.0, 0.55); } },
  // ——— Le boulanger te tend ta baguette : « Votre pain, monsieur. » — « Tu as tort. Tant que je n'ai pas payé, c'est encore le vôtre. »
  { w: "Le boulanger te tend", set: "VILLE", fr: "Boulangerie : le boulanger tend une baguette au client", g: IN, cam: (_w, u) => C("VILLE", [32.4, 1.8, 2.6], [32.0, 1.75, 2.2], [30, 1.3, -0.8], null, 46, u),
    st: (w, _u, t) => { bakery(w, t); queue(w, t); } },
  { w: "Votre pain, monsieur", set: "VILLE", fr: "Gros plan boulanger souriant", g: IN, cam: (w, u) => CH("VILLE", w.actors.boulanger, [28.9, 1.85, -0.2], [28.95, 1.85, -0.3], 38, u, -0.2),
    st: (w, _u, t) => { bakery(w, t, { talk: true }); queue(w, t); } },
  { w: "Tu as tort. Tant que", set: "VILLE", fr: "Le client, malin, garde les mains dans le dos : « Tu as tort. »", g: IN, cam: (w, u) => CH("VILLE", w.actors.t1, [31.2, 1.8, -0.3], [31.15, 1.8, -0.2], 40, u, -0.2),
    st: (w, _u, t) => { bakery(w, t, { expr: "worried" }, { expr: "smug", talk: true, point: 0.3 }); queue(w, t); } },
  { w: "c'est encore le vôtre", set: "VILLE", fr: "Le boulanger reste avec sa baguette tendue, vexé", g: IN, cam: (w, u) => CH("VILLE", w.actors.boulanger, [29.0, 1.75, -0.1], [29.05, 1.75, -0.2], 40, u, -0.25),
    st: (w, _u, t) => { bakery(w, t, { expr: "angry" }, { expr: "smug" }); queue(w, t); } },
  // ——— Et le présentateur météo n'a jamais réussi à finir une phrase. « Demain, il fera beau… » — « Tu as tort ! Quand demain arrivera, ce sera aujourd'hui. »
  { w: "Et le présentateur météo", set: "VILLE", fr: "Studio météo : derrière la caméra, le présentateur devant la carte", g: IN, cam: (_w, u) => C("VILLE", [3.4, 2.0, 5.6], [3.0, 1.9, 4.9], [0.4, 1.6, -2.6], null, 48, u),
    st: (w, _u, t) => { studio(w, t); } },
  { w: "Demain, il fera beau", set: "VILLE", fr: "Il désigne la carte pleine de soleils", g: IN, cam: (w, u) => CH("VILLE", w.actors.meteo, [2.1, 1.9, 0.4], [2.0, 1.88, 0.0], 44, u, -0.3),
    st: (w, _u, t) => { studio(w, t, { talk: true, armL: -2.0 }); } },
  { w: "Tu as tort ! Quand", set: "VILLE", fr: "Le cadreur surgit de derrière sa caméra, doigt pointé", g: IN, cam: (w, u) => CH("VILLE", w.actors.t3, [0.9, 1.9, 2.6], [1.0, 1.9, 2.8], 42, u, -0.2),
    st: (w, _u, t) => { studio(w, t, { expr: "worried" }, { expr: "angry", point: 0.4, talk: true, yaw: Math.PI + 0.1 }); } },
  { w: "ce sera aujourd'hui", set: "VILLE", fr: "Le présentateur, dépité, phrase coupée", g: IN, cam: (w, u) => CH("VILLE", w.actors.meteo, [0.9, 1.9, -1.2], [0.95, 1.9, -1.3], 40, u, -0.2),
    st: (w, _u, t) => { studio(w, t, { expr: "sad", headPitch: 0.2 }); } },
  // ——— Moi, c'est Joël. Et je suis le pire joueur de toute l'histoire de la ville. Je n'ai jamais gagné. Pas une seule fois.
  { w: "Moi, c'est Joël", set: "RUE", fr: "Joël face caméra sur le trottoir, travelling avant", g: DAY, cam: (w, u) => CH("RUE", J(w), [4.0, 1.75, -0.6], [4.0, 1.7, -2.4], 40, u, -0.2),
    st: (w, u, t) => { const a = put(w, "joel", "RUE", 4.0, 0, -5.4, 0); a.pose(t, { expr: "neutral" }); lab(w, "joel", "JOËL", "#ffffff", a, cl((u - 0.2) * 2), 0.6, 0.55); } },
  { w: "Et je suis le pire joueur", set: "RUE", fr: "Joël marche, des passants se moquent et le pointent", g: DAY, cam: (_w, u) => C("RUE", [-2, 2.0, 1.4], [-1, 2.0, 1.0], [5, 1.3, -4.8], [8, 1.3, -4.8], 44, u),
    st: (w, u, t) => { walk(w, "joel", "RUE", 3 + u * 3, -4.9, 12, -4.9, 0, t, { expr: "sad" }, 1.0); put(w, "t1", "RUE", 9.6, 0, -5.6, -1.8).pose(t, { expr: "happy", point: 0.2, talk: true }); put(w, "t2", "RUE", 10.6, 0, -4.6, -2.3).pose(t, { expr: "happy", cheer: false, talk: true }); put(w, "k3", "RUE", 1.0, 0, -5.4, 1.5).pose(t, { expr: "happy", point: 0.1 }); } },
  { w: "Je n'ai jamais gagné", set: "RUE", fr: "Joël seul en terrasse de café, la tête basse : « 0 victoire »", g: DAY, cam: (w, u) => CH("RUE", J(w), [7.4, 1.4, -3.2], [7.2, 1.38, -3.6], 40, u, -0.1),
    st: (w, u, t) => { const a = put(w, "joel", "RUE", 6.0, 0.4, -5.6, 0.6); a.pose(t, { sit: true, expr: "sad", headPitch: 0.35, armL: -1.2, armR: -1.2 }); lab(w, "zero", "0 VICTOIRE", "#ff5a5a", a, cl((u - 0.3) * 2), 0.8, 0.55); } },
  // ——— J'ai dit : « Je m'appelle Joël. » — « Tu as tort. Sur ton cahier, tu as oublié les deux points sur le e. »
  { w: "J'ai dit : Je m'appelle Joël", set: "CL2", fr: "En classe, Joël (adulte au milieu des enfants) se présente", g: IN, cam: (w, u) => CH("CL2", J(w), [-0.7, 1.7, 0.2], [-0.75, 1.7, 0.3], 42, u, -0.15),
    st: (w, _u, t) => { MED(w).boardM.map = MED(w).boards.nom; seated(w, t, "neutral", false, [-1.1, 1.25]); joelDesk(w, t, { expr: "smile", talk: true }); prop(w, "cahier", "CL2", -1.1, 0.785, 0.75, 0, Math.PI, 0); } },
  { w: "Tu as tort. Sur ton cahier", set: "CL2", fr: "Plongée sur le cahier : « Joel », sans tréma, un doigt accusateur", g: IN, cam: (_w, u) => G(at("CL2", -0.75, 1.85, 0.35), at("CL2", -0.8, 1.7, 0.42), at("CL2", -1.1, 0.79, 0.75), at("CL2", -1.1, 0.79, 0.75), 40, u),
    st: (w, u, t) => { seated(w, t, "smug", false, [-1.1, 0.75]); joelDesk(w, t, { expr: "worried" }); prop(w, "cahier", "CL2", -1.1, 0.785, 0.75, 0, Math.PI, 0); lab(w, "trema", "ë ?", "#ff4a4a", at("CL2", -1.25, 0.95, 0.55), cl((u - 0.3) * 2), 0.3, 0.1); } },
  // ——— J'ai dit : « J'ai dix ans. » — « Tu as tort. Tu as dix ans, trois mois et quatre jours. »
  { w: "J'ai dit : J'ai dix ans", set: "CL2", fr: "Joël se lève, sûr de lui, au milieu des petits", g: IN, cam: (_w, u) => C("CL2", [1.6, 1.6, -2.2], [1.4, 1.6, -1.9], [-1.0, 1.4, 1.3], null, 46, u),
    st: (w, _u, t) => { MED(w).boardM.map = MED(w).boards.nom; seated(w, t, "neutral", false, [-0.5, 1.4]); put(w, "joel", "CL2", -0.5, 0, 1.45, Math.PI - 0.3).pose(t, { expr: "smile", talk: true, armR: -0.8 }); } },
  { w: "Tu as dix ans, trois mois", set: "CL2", fr: "Au tableau, une élève écrit : « 10 ans 3 mois 4 jours »", g: IN, cam: (_w, u) => C("CL2", [0.8, 1.6, 0.6], [0.6, 1.6, 0.3], [-0.3, 1.6, -3.6], null, 46, u),
    st: (w, u, t) => { MED(w).boardM.map = u > 0.3 ? MED(w).boards.age : MED(w).boards.nom; put(w, "k6", "CL2", 1.9, 0, -3.0, -0.6).pose(t, { expr: "smug", armL: -2.2, talk: true }); put(w, "joel", "CL2", -0.5, 0, 1.45, Math.PI - 0.3).pose(t, { expr: "worried" }); } },
  // ——— J'ai dit : « Mon cœur bat. » — « Tu as tort. Là, il était entre deux battements. »
  { w: "J'ai dit : Mon cœur bat", set: "CL2", fr: "Joël, la main sur le cœur", g: IN, cam: (w, u) => CH("CL2", J(w), [-0.4, 1.6, -0.2], [-0.45, 1.58, 0.1], 40, u, -0.3),
    st: (w, _u, t) => { MED(w).boardM.map = MED(w).boards.age; put(w, "joel", "CL2", -0.5, 0, 1.45, Math.PI - 0.1).pose(t, { expr: "smile", armL: -1.4, talk: true }); w.actors.joel.lArm.rotation.z = 0.9; } },
  { w: "Là, il était entre deux battements", set: "CL2", fr: "Un enfant ausculte Joël au stéthoscope : « BOUM … … BOUM »", g: IN, cam: (_w, u) => C("CL2", [-2.0, 1.6, 0.3], [-1.9, 1.6, 0.4], [-0.5, 1.3, 1.3], null, 42, u),
    st: (w, u, t) => { put(w, "joel", "CL2", -0.5, 0, 1.45, Math.PI - 0.1).pose(t, { expr: "worried" }); const k = put(w, "k1", "CL2", -0.25, 0, 0.75, -0.3); k.pose(t, { expr: "focus", armR: -1.5 }); inHand(w, "steth", k, true, 0, 0, 0, V(0, 0.25, 0.25)); lab(w, "boum", "BOUM …… BOUM", "#ff5a7a", at("CL2", -0.4, 1.7, 1.3), cl(u * 2), 0.8, 0.2); } },
  // ——— À l'école, on m'appelle « Joël-tu-as-tort ».
  { w: "À l'école, on m'appelle", set: "CL2", fr: "Toute la classe rit ; au tableau : « Joël-tu-as-tort »", g: IN, cam: (_w, u) => C("CL2", [2.8, 2.0, 3.0], [2.5, 2.0, 2.6], [-0.8, 1.3, -1.4], null, 50, u),
    st: (w, _u, t) => { MED(w).boardM.map = MED(w).boards.tort; seated(w, t, "happy", true, [-1.1, 1.25]); joelDesk(w, t, { expr: "sad", headPitch: 0.3 }); } },
  // ——— Et puis, il y a Madame Contraire. Championne de la ville depuis quarante ans.
  { w: "Et puis, il y a Madame Contraire", set: "RUE", fr: "Contre-plongée : Madame Contraire sort de chez elle", g: DAY, cam: (w, u) => CH("RUE", w.actors.contraire, [-19.4, 1.6, -3.4], [-19.6, 1.65, -3.8], 40, u, -0.1),
    st: (w, u, t) => { walk(w, "contraire", "RUE", -20, -6.4, -20, -5.4, u, t, { expr: "smug" }, 0.8); } },
  { w: "Championne de la ville", set: "RUE", fr: "Gros plan, sourire en coin : « CHAMPIONNE DEPUIS 40 ANS »", g: DAY, cam: (w, u) => CH("RUE", w.actors.contraire, [-19.6, 1.85, -3.6], [-19.7, 1.82, -3.9], 36, u, -0.15),
    st: (w, u, t) => { const a = put(w, "contraire", "RUE", -20, 0, -5.4, 0.15); a.pose(t, { expr: "smug" }); lab(w, "champ", "CHAMPIONNE DEPUIS 40 ANS", "#ffd21a", a, cl((u - 0.15) * 2), 0.9, 0.5); } },
  // ——— Un jour, le facteur lui a dit « Bonjour ». Elle a répondu : « Tu as tort. Il est midi deux. On dit bon après-midi. » Le facteur a déménagé.
  { w: "Un jour, le facteur", set: "RUE", fr: "Le facteur arrive, tout sourire, et la salue", g: DAY, cam: (_w, u) => C("RUE", [-16.0, 1.8, -1.2], [-16.6, 1.8, -1.6], [-19.2, 1.4, -5.2], null, 46, u),
    st: (w, u, t) => { put(w, "contraire", "RUE", -20, 0, -5.4, Math.PI / 2 - 0.2).pose(t, { expr: "neutral" }); const f = u < 0.55 ? walk(w, "facteur", "RUE", -15, -4.9, -18.6, -5.1, u / 0.55, t, { expr: "happy" }, 1.0) : put(w, "facteur", "RUE", -18.6, 0, -5.1, -Math.PI / 2 - 0.1); if (u >= 0.55) f.pose(t, { expr: "happy", wave: "R", talk: true }); } },
  { w: "Elle a répondu : Tu as tort. Il", set: "RUE", fr: "Elle lève l'index, puis désigne sa montre : « 12:02 »", g: DAY, cam: (w, u) => CH("RUE", w.actors.contraire, [-18.7, 1.75, -3.6], [-18.9, 1.75, -3.9], 38, u, -0.25),
    st: (w, u, t) => { const a = put(w, "contraire", "RUE", -20, 0, -5.4, Math.PI / 2 - 0.5); a.pose(t, { expr: "smug", armR: u < 0.4 ? -2.5 : -1.5, armL: u > 0.4 ? -1.5 : undefined, talk: true }); put(w, "facteur", "RUE", -18.6, 0, -5.1, -Math.PI / 2 - 0.1).pose(t, { expr: "worried" }); lab(w, "midi", "12:02", "#ffffff", a, cl((u - 0.4) * 2.5), 0.6, 0.45); } },
  { w: "Le facteur a déménagé", set: "RUE", fr: "Le facteur s'éloigne, valise à la main, la tête basse", g: DAY, cam: (_w, u) => C("RUE", [-24, 2.0, 1.2], [-24.6, 2.1, 1.0], [-15, 1.2, -4.9], [-11, 1.2, -4.9], 44, u),
    st: (w, u, t) => { const f = walk(w, "facteur", "RUE", -17 + u * 4, -4.9, 0, -4.9, 0, t, { expr: "sad", headPitch: 0.3 }, 1.0); inHand(w, "dico", f, true, 0, Math.PI / 2, 0, V(0, -0.1, 0)).scale.setScalar(1.3); put(w, "contraire", "RUE", -20, 0, -5.4, 0.8).pose(t, { expr: "smug" }); } },
  // ——— Chaque année, sous le phare, il y a le grand championnat.
  { w: "Chaque année, sous le phare", set: "PL", fr: "Grue arrière : la foule, la scène, la banderole, le phare", g: DAY, cam: (_w, u) => C("PL", [-10, 4, 34], [-6, 10, 38], [2, 4, -16], [3, 6, -20], 48, u),
    st: (w, _u, t) => { crowd(w, t, 0.15); gulls(w, t, 0); duel(w, t); } },
  // ——— Et cette année, au tirage au sort, j'ai pioché son nom.
  { w: "Et cette année", set: "PL", fr: "Sur scène, Joël tire un papier : « CONTRAIRE »", g: DAY, cam: (w, u) => CH("PL", J(w), [0.6, 2.6, -9.6], [0.5, 2.6, -10.0], 42, u, -0.3),
    st: (w, u, t) => { crowd(w, t, 0); const a = put(w, "joel", "PL", 0, 1.0, -12.0, 0); a.pose(t, { expr: u > 0.5 ? "scared" : "neutral", armR: -1.9 }); lab(w, "tirage", "CONTRAIRE", "#c88aff", handOf(a), cl((u - 0.45) * 2.5), 0.7, 0.25); } },
  // ——— Le pire joueur de la ville contre la meilleure. Toute la ville est venue voir.
  { w: "Le pire joueur de la ville", set: "PL", fr: "Face à face aux pupitres : JOËL contre CONTRAIRE", g: DAY, cam: (_w, u) => C("PL", [0, 5.2, 5], [0, 4.8, 3.5], [0, 2.2, -13.2], null, 36, u),
    st: (w, u, t) => { crowd(w, t, 0); duel(w, t, { expr: "worried" }); lab(w, "nj", "JOËL", "#5ac8ff", w.actors.joel, cl(u * 2), 0.6, 0.55); lab(w, "nc", "CONTRAIRE", "#c88aff", w.actors.contraire, cl(u * 2), 0.8, 0.55); } },
  { w: "Toute la ville est venue voir", set: "PL", fr: "Contrechamp depuis la scène : toute la ville sur la place", g: DAY, cam: (_w, u) => C("PL", [-1.5, 3.4, -10.5], [1.5, 3.8, -10.5], [0, 1.2, 10], null, 52, u),
    st: (w, _u, t) => { crowd(w, t, 0.5); duel(w, t); } },
  // ——— Elle a commencé. Elle a tout gagné.
  { w: "Elle a commencé", set: "PL", fr: "Madame Contraire au micro, sûre d'elle", g: DAY, cam: (w, u) => CH("PL", w.actors.contraire, [CX - 0.6, 2.9, LZ + 2.0], [CX - 0.5, 2.9, LZ + 1.8], 38, u, -0.25),
    st: (w, _u, t) => { crowd(w, t, 0); duel(w, t, {}, { expr: "smug", talk: true, point: 0.2 }); } },
  { w: "Elle a tout gagné", set: "PL", fr: "Le tableau des scores défile : 4 – 0", g: DAY, cam: (_w, u) => C("PL", [6.4, 4.4, -8.4], [6.8, 4.6, -8.9], [10.8, 5.2, -14.0], null, 40, u),
    st: (w, u, t) => { crowd(w, t, 0.2); duel(w, t); score(w, Math.min(4, 1 + Math.floor(u * 4))); } },
  // ——— Mes chaussures, mon nom, ma date de naissance, même la couleur du ciel.
  { w: "Mes chaussures", set: "PL", fr: "Plan serré sur les chaussures de Joël : « TORT ! »", g: DAY, cam: (_w, u) => G(at("PL", JX - 0.6, 2.1, LZ + 3.0), at("PL", JX - 0.5, 2.05, LZ + 2.8), at("PL", JX, 1.8, LZ), at("PL", JX, 1.7, LZ), 50, u),
    st: (w, u, t) => { crowd(w, t, 0); duel(w, t, { expr: "worried", headPitch: 0.5 }); lab(w, "t_ch", "TORT !", "#ff4a4a", at("PL", JX - 0.2, 1.25, LZ + 0.3), cl(u * 3), 0.5, 0.1); } },
  { w: "mon nom", set: "PL", fr: "Joël : « TORT ! » (le tréma, encore)", g: DAY, cam: (w, u) => CH("PL", J(w), [JX + 0.6, 2.9, LZ + 2.0], [JX + 0.5, 2.9, LZ + 1.8], 38, u, -0.2),
    st: (w, u, t) => { crowd(w, t, 0); duel(w, t, { expr: "sad" }); lab(w, "t_nom", "JOEL ? TORT !", "#ff4a4a", w.actors.joel, cl(u * 3), 0.7, 0.5); } },
  { w: "ma date de naissance", set: "PL", fr: "Contraire, implacable, compte sur ses doigts", g: DAY, cam: (w, u) => CH("PL", w.actors.contraire, [CX - 0.6, 2.9, LZ + 2.0], [CX - 0.5, 2.9, LZ + 1.8], 38, u, -0.2),
    st: (w, u, t) => { crowd(w, t, 0); duel(w, t, {}, { expr: "smug", talk: true, armR: -1.8 }); score(w, 4); lab(w, "t_dn", "TORT !", "#ff4a4a", w.actors.contraire, cl(u * 3), 0.6, 0.5); } },
  { w: "même la couleur du ciel", set: "PL", fr: "Contre-plongée vers le ciel bleu et le phare : « BLEU ? TORT ! »", g: DAY, cam: (_w, u) => C("PL", [-4, 1.8, 2], [-4, 1.9, 1.4], [5, 11, -36], [5, 14, -36], 46, u),
    st: (w, u, t) => { gulls(w, t, 0); duel(w, t); score(w, 4); lab(w, "t_ciel", "BLEU ? TORT !", "#ff4a4a", at("PL", 4, 13.5, -30), cl((u - 0.2) * 2.5), 3.4, 0); } },
  // ——— Il me restait une phrase. Une seule. J'ai pris une grande respiration. Et j'ai dit : « Tu vas me dire que j'ai tort. »
  { w: "Il me restait une phrase", set: "PL", fr: "Gros plan Joël, inquiet, la caméra se rapproche", g: LATE, cam: (w, u) => CH("PL", J(w), [JX + 1.0, 3.0, LZ + 2.4], [JX + 0.6, 2.95, LZ + 1.8], 38, u, -0.2), sky: "#fff0e0",
    st: (w, _u, t) => { crowd(w, t, 0); duel(w, t, { expr: "worried" }); score(w, 4); } },
  { w: "J'ai pris une grande respiration", set: "PL", fr: "Joël gonfle sa poitrine, les yeux fermés", g: LATE, cam: (w, u) => CH("PL", J(w), [JX + 0.6, 2.9, LZ + 1.8], [JX + 0.55, 2.88, LZ + 1.7], 36, u, -0.25), sky: "#fff0e0",
    st: (w, u, t) => { crowd(w, t, 0); duel(w, t, { expr: "focus", headPitch: -0.15 * sm(u * 2) }); const k = 1 + 0.08 * Math.sin(Math.min(1, u * 1.4) * Math.PI); w.actors.joel.torso.scale.set(k, k, k * 1.1); } },
  { w: "Et j'ai dit : Tu vas me dire", set: "PL", fr: "Contre-plongée héroïque : Joël au micro", g: LATE, cam: (w, u) => CH("PL", J(w), [JX + 0.4, 1.9, LZ + 2.0], [JX + 0.35, 1.95, LZ + 1.8], 44, u, -0.2), sky: "#fff0e0",
    st: (w, _u, t) => { crowd(w, t, 0); duel(w, t, { expr: "focus", talk: true }); } },
  // ——— Madame Contraire a ouvert la bouche. Puis elle l'a refermée.
  { w: "Madame Contraire a ouvert la bouche", set: "PL", fr: "Gros plan Contraire, bouche ouverte", g: LATE, cam: (w, u) => CH("PL", w.actors.contraire, [CX - 0.5, 2.95, LZ + 1.8], [CX - 0.45, 2.95, LZ + 1.7], 34, u, -0.2), sky: "#fff0e0",
    st: (w, _u, t) => { crowd(w, t, 0); duel(w, t, {}, { expr: "shout" }); } },
  { w: "Puis elle l'a refermée", set: "PL", fr: "Elle referme la bouche, déstabilisée", g: LATE, cam: (w, u) => CH("PL", w.actors.contraire, [CX - 0.45, 2.95, LZ + 1.7], [CX - 0.42, 2.95, LZ + 1.65], 34, u, -0.2), sky: "#fff0e0",
    st: (w, _u, t) => { crowd(w, t, 0); duel(w, t, {}, { expr: "worried" }); } },
  // ——— Si elle disait « Tu as tort »… alors j'avais raison. Et si elle ne disait rien… j'avais raison aussi.
  { w: "Si elle disait", set: "PL", fr: "Contraire réfléchit : « TU AS TORT » → Joël a RAISON", g: LATE, cam: (_w, u) => C("PL", [CX - 1.6, 3.0, LZ + 5.4], [CX - 1.4, 3.0, LZ + 5.0], [CX, 2.5, LZ], null, 42, u), sky: "#ffe8d0",
    st: (w, u, t) => { crowd(w, t, 0); duel(w, t, {}, { expr: "worried", armR: -1.6, headPitch: 0.15 }); lab(w, "si1", "« TU AS TORT » = RAISON", "#ffd21a", w.actors.contraire, cl((u - 0.2) * 2), 1.0, 0.55); } },
  { w: "Et si elle ne disait rien", set: "PL", fr: "« … » → RAISON AUSSI ; elle transpire", g: LATE, cam: (_w, u) => C("PL", [CX - 1.4, 3.0, LZ + 5.0], [CX - 1.2, 3.0, LZ + 4.6], [CX, 2.5, LZ], null, 40, u), sky: "#ffe8d0",
    st: (w, u, t) => { crowd(w, t, 0); duel(w, t, {}, { expr: "scared", armR: -1.6 }); lab(w, "si2", "« … » = RAISON AUSSI", "#ffd21a", w.actors.contraire, cl((u - 0.2) * 2), 1.0, 0.55); } },
  // ——— Elle a cherché. Une minute. Cinq minutes. Le soleil s'est couché derrière le phare.
  { w: "Elle a cherché", set: "PL", fr: "Elle se gratte la tête", g: LATE, cam: (w, u) => CH("PL", w.actors.contraire, [CX - 0.6, 2.9, LZ + 2.0], [CX - 0.55, 2.9, LZ + 1.9], 38, u, -0.2), sky: "#ffe0c0",
    st: (w, _u, t) => { crowd(w, t, 0); duel(w, t, {}, { expr: "worried", armR: -2.8 }); } },
  { w: "Une minute", set: "PL", fr: "La foule attend, silencieuse : « 1 MIN »", g: LATE, cam: (_w, u) => C("PL", [-8, 3.0, 14], [-7, 3.0, 13], [0, 2.4, -13], null, 46, u), sky: "#ffd8b0",
    st: (w, u, t) => { crowd(w, t, 0); duel(w, t, {}, { expr: "worried", armR: -2.8 }); lab(w, "m1", "1 MIN", "#ffffff", at("PL", 0, 6.0, -13), cl(u * 2.5), 1.4, 0); } },
  { w: "Cinq minutes", set: "PL", fr: "Le ciel rougit : « 5 MIN »", g: LATE, dusk: 0.5, cam: (_w, u) => C("PL", [6, 3.0, 14], [5, 3.0, 13], [0, 2.4, -13], null, 46, u), sky: "#ffb890",
    st: (w, u, t) => { crowd(w, t, 0); duel(w, t, {}, { expr: "worried", armR: -2.8 }); lab(w, "m5", "5 MIN", "#ffffff", at("PL", 0, 6.0, -13), cl(u * 2.5), 1.4, 0); } },
  { w: "Le soleil s'est couché", set: "PL", fr: "Coucher de soleil derrière le phare, qui s'allume", g: DUSK, dusk: 1, cam: (_w, u) => C("PL", [-2, 5, 6], [-1, 6, 4], [6, 12, -38], [6, 14, -38], 42, u),
    st: (w, _u, t) => { crowd(w, t, 0); duel(w, t, {}, { expr: "worried" }); gulls(w, t, 0); } },
  // ——— Et pour la première fois en quarante ans, Madame Contraire a dit : « Tu as raison. »
  { w: "Et pour la première fois", set: "PL", fr: "Contraire dans la lumière orange, vaincue", g: DUSK, dusk: 1, cam: (w, u) => CH("PL", w.actors.contraire, [CX - 0.9, 2.9, LZ + 2.4], [CX - 0.6, 2.9, LZ + 1.9], 38, u, -0.2),
    st: (w, _u, t) => { crowd(w, t, 0); duel(w, t, {}, { expr: "sad", headPitch: 0.2 }); } },
  { w: "Madame Contraire a dit", set: "PL", fr: "« Tu as raison. »", g: DUSK, dusk: 1, cam: (w, u) => CH("PL", w.actors.contraire, [CX - 0.5, 2.95, LZ + 1.8], [CX - 0.45, 2.95, LZ + 1.7], 34, u, -0.2),
    st: (w, u, t) => { crowd(w, t, 0); duel(w, t, {}, { expr: "sad", talk: u > 0.4 }); lab(w, "raison", "TU AS RAISON.", "#ffd21a", w.actors.contraire, cl((u - 0.45) * 2.5), 0.8, 0.5); } },
  // ——— Toute la place a hurlé. Les mouettes se sont envolées.
  { w: "Toute la place a hurlé", set: "PL", fr: "Explosion de joie : la foule saute, Joël lève les bras", g: DUSK, dusk: 1, cam: (_w, u) => C("PL", [-7, 2.8, -2], [-6, 3.6, 0], [JX, 2.4, LZ], null, 46, u),
    st: (w, _u, t) => { crowd(w, t, 1.0); duel(w, t, { expr: "happy", cheer: true }, { expr: "sad" }); score(w, 5); } },
  { w: "Les mouettes se sont envolées", set: "PL", fr: "Les mouettes s'envolent devant le phare allumé", g: DUSK, dusk: 1, cam: (_w, u) => C("PL", [-2, 3, 4], [-2, 4, 2], [4, 9, -32], [5, 14, -36], 46, u),
    st: (w, u, t) => { crowd(w, t, 0.6); gulls(w, t, 0.15 + u * 0.85); duel(w, t, { expr: "happy", cheer: true }); } },
  // ——— Depuis, on m'appelle Joël the Hutt. Et on me laisse tranquille, affalé sur mon canapé.
  { w: "Depuis, on m'appelle", set: "MAI", fr: "Joël, énorme, allongé sur son canapé de cuir : « JOËL THE HUTT »", g: IN, cam: (_w, u) => G(at("MAI", 3.7, 1.55, -2.6), at("MAI", 3.7, 1.5, -2.3), at("MAI", 3.9, 0.95, 1.3), at("MAI", 3.9, 0.95, 1.3), 50, u),
    st: (w, u, t) => { const a = lying(w, t); inHand(w, "baguette", a, true, 0, 0, 0.3).visible = false; lab(w, "hutt", "JOËL THE HUTT", "#ffd21a", at("MAI", 3.1, 1.9, 1.4), cl((u - 0.35) * 2), 1.0, 0); } },
  { w: "Et on me laisse tranquille", set: "MAI", fr: "Le salon aux murs blancs, la télé allumée ; la caméra recule", g: IN, cam: (_w, u) => C("MAI", [2.6, 1.7, -2.0], [0.2, 2.1, -2.9], [3.4, 0.9, 1.3], [3.4, 1.0, 1.0], 50, u),
    st: (w, _u, t) => { lying(w, t); } },
];

export const SHOT_START = (() => { let from = 0; return SHOTS.map((s) => { const i = find(s.w, from); from = i + 1; return i; }); })();
export const START = SHOT_START.map((wi, i) => (i === 0 ? 0 : Math.round((W[wi].s + (SHOTS[i].dt ?? 0)) * FPS) - 2));
export const shotAt = (f: number) => { let i = 0; while (i + 1 < START.length && START[i + 1] <= f) i++; return i; };
export const uOf = (i: number, f: number) => { const a = START[i], b = i + 1 < START.length ? START[i + 1] : TOTAL; return Math.min(1, Math.max(0, (f - a) / Math.max(1, b - a - 1))); };

const DEF: Grade = { sat: 0.45, con: 0.06, bri: 0, bloom: 0.9, bg: "#000", fog: "#000", fogD: 0, env: 0.5, snow: false };
export const gradeOf = (i: number): Grade => ({ ...DEF, ...(SHOTS[i].g ?? {}) });

export const applyShot = (w: World, i: number, u: number, t: number, _cam: THREE.Camera) => {
  w.cam = _cam;
  const s = SHOTS[i], S = w.sets, m = S.med; S.show(s.set);
  for (const a of Object.values(w.actors)) { a.root.visible = false; a.root.position.y = 0; a.root.quaternion.identity(); a.torso.scale.set(1, 1, 1); }
  for (const x of Object.values(S.tags)) x.visible = false; for (const x of S.rain) x.visible = false; for (const x of Object.values(m.labels)) x.visible = false;
  for (const p of Object.values(m.props)) { p.visible = false; p.scale.setScalar(1); }
  m.crowd.root.visible = false; m.gulls.root.visible = false; m.walk.root.visible = false; m.walkPL.root.visible = false; m.ring.root.visible = false; score(w, 0); m.boardM.map = m.boards.nom;
  const d = s.dusk ?? 0, sun0 = m.suns[0][0];
  for (const k of m.skies) { k.color.set(s.sky ?? "#ffffff"); k.map = d >= 1 ? m.dusk : m.day; }
  for (const [l, base] of m.suns) l.intensity = base * (s.sunK ?? 1);
  sun0.position.set(-30 + d * 36, 44 - d * 38, 26 - d * 90); sun0.color.set(d >= 1 ? "#ff9050" : d > 0 ? "#ffc890" : "#fff0d8"); if (d >= 1) sun0.intensity = 1.5;
  m.lamp.emissiveIntensity = 1.2 + d * 4; m.lampL.intensity = d >= 1 ? 40 : 0;
  w.fill.intensity = 0; w.key.intensity = 0;
  s.st?.(w, u, t);
  if (s.set === "RUE") walkers(w, t);   // la rue vit dans tous les plans
  if (s.set === "PL") m.walkPL.set(t, (x, z) => z < -2 && z > -20);   // et la place du phare aussi
  return s;
};
