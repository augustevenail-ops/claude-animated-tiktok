// « Les Pouvoirs Nuls » ép. 1 : plans calés sur la voix (words.json). Village de montagne (VILLE), forêt de nuit (PL),
// classe (CL2), cuisine (MAI). Échelle : adulte ≈ 2,2 u, enfant ≈ 1,6 u.
import * as THREE from "three";
import WORDS from "./words.json";
import { Actor, CAST, Expr, Pose } from "./chars";
import { Sets, O, V, SetK } from "./sets";
import { Pig } from "./alp";

export const FPS = 30;
const W = WORDS as { w: string; s: number; e: number }[];
const LAST = W.filter((w) => /[a-zà-ÿ]/i.test(w.w)).pop()!;
export const TOTAL = Math.round((LAST.e + 1.6) * FPS);
const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9' ]/g, "").replace(/’/g, "'").trim();
const WN = W.map((w) => norm(w.w));
const find = (frag: string, from: number) => { const f = norm(frag).split(/\s+/); for (let i = from; i < WN.length; i++) if (f.every((x, k) => WN[i + k] === x)) return i; throw new Error("fragment introuvable : " + frag); };

const sm = (x: number) => { const t = Math.min(1, Math.max(0, x)); return t * t * t * (t * (t * 6 - 15) + 10); };
const gl = (x: number) => { const t = Math.min(1, Math.max(0, x)); return 0.45 * t + 0.55 * sm(t); };
const cl = (x: number) => Math.min(1, Math.max(0, x));
const L = (a: THREE.Vector3, b: THREE.Vector3, u: number) => a.clone().lerp(b, u);
type Cam = { P: THREE.Vector3; T: THREE.Vector3; fov: number };
const G = (P0: THREE.Vector3, P1: THREE.Vector3, T0: THREE.Vector3, T1: THREE.Vector3, fov: number, u: number, f1 = fov): Cam => { const e = gl(u); return { P: L(P0, P1, e), T: L(T0, T1, e), fov: fov + (f1 - fov) * e }; };
const at = (k: SetK, x: number, y: number, z: number) => O[k].clone().add(V(x, y, z));
const C = (k: SetK, p0: number[], p1: number[], t0: number[], t1: number[] | null, fov: number, u: number, f1 = fov) => G(at(k, p0[0], p0[1], p0[2]), at(k, p1[0], p1[1], p1[2]), at(k, t0[0], t0[1], t0[2]), at(k, ...((t1 ?? t0) as [number, number, number])), fov, u, f1);
const headOf = (a: Actor) => { a.root.updateMatrixWorld(true); return a.neck.localToWorld(V(0, 0.7, 0)); };
const CH = (k: SetK, a: Actor, p0: number[], p1: number[], fov: number, u: number, dy = -0.1) => { const h = headOf(a).add(V(0, dy, 0)); return G(at(k, p0[0], p0[1], p0[2]), at(k, p1[0], p1[1], p1[2]), h, h, fov, u); };

export type World = { sets: Sets; actors: Record<string, Actor>; scene?: THREE.Scene; fill: THREE.PointLight; key: THREE.SpotLight; ears?: { m: THREE.MeshStandardMaterial; l: THREE.PointLight } };
export type Grade = { sat: number; con: number; bri: number; bloom: number; bg: string; fog: string; fogD: number; env: number; snow: boolean };
type Shot = { set: SetK; w: string; cam: (w: World, u: number, t: number) => Cam; st?: (w: World, u: number, t: number) => void; g?: Partial<Grade>; fr: string; dt?: number; sky?: string; sunK?: number; moon?: boolean; win?: number; storm?: boolean; rain?: number };

const KS = ["lumi", "soeur", "rose", "lou", "maire", "boulanger", "maman", "prof", "t1", "t2", "t3", "k1", "k2", "k3", "k4", "k6", "k7"];
const SZ: Record<string, number> = { lumi: 0.9, lou: 0.62, soeur: 1.02, rose: 0.95, t3: 1.05 };
export const buildCast = (root: THREE.Object3D) => {
  const mk = (k: string, seed: number) => { const a = new Actor(CAST[k], 0.36, seed); root.add(a.root); a.root.visible = false; return a; };
  const actors = Object.fromEntries(KS.map((k, i) => [k, mk(k, i + 3)])) as Record<string, Actor>;
  // oreilles lumineuses du maire
  const m = new THREE.MeshStandardMaterial({ color: "#f4cfb0", emissive: "#ffd070", emissiveIntensity: 0, roughness: 0.4 }), n = actors.maire.neck;
  for (const x of [-0.74, 0.74]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.24, 14, 10), m); e.scale.set(0.5, 1, 0.8); e.position.set(x, 0.66, 0); n.add(e); }
  const l = new THREE.PointLight("#ffc860", 0, 9, 1.4); l.position.set(0, 0.66, 1.2); n.add(l);
  return { actors, ears: { m, l } };
};

// ---------------- ambiances : automne doré ; gris (le soleil personnel se voit) ; nuit calme ; tempête
const DAY: Partial<Grade> = { bg: "#86b0d8", fog: "#e8d0b0", fogD: 0.004, sat: 0.5, con: 0.16, bri: -0.04, bloom: 0.9, env: 0.4 };
const GREY: Partial<Grade> = { bg: "#a8acb4", fog: "#9a9a98", fogD: 0.012, sat: 0.3, con: 0.18, bri: -0.08, bloom: 1.05, env: 0.3 };
const IN: Partial<Grade> = { bg: "#000", fog: "#000", fogD: 0, sat: 0.5, con: 0.16, bri: -0.04, bloom: 0.95, env: 0.4 };
const EVE: Partial<Grade> = { ...DAY, fog: "#c87a5a", fogD: 0.01, sat: 0.55, bri: -0.1, bloom: 1.15 };
const NIGHT: Partial<Grade> = { bg: "#0c1220", fog: "#141c30", fogD: 0.012, sat: 0.5, con: 0.22, bri: -0.12, bloom: 1.4, env: 0.1 };
const STORM: Partial<Grade> = { ...NIGHT, fog: "#101828", fogD: 0.03, bri: -0.1, bloom: 1.45, env: 0.08 };
const GS = { sky: "#b0b0b0", sunK: 0.3, win: 0.7 };
const GN = { sky: "#1a2440", sunK: 0.35, moon: true, win: 2.2 };
const GT = { sky: "#141c30", sunK: 0.3, moon: true, win: 2.2, storm: true, rain: 1 };

const put = (w: World, k: string, set: SetK, x: number, y: number, z: number, yaw: number, s = SZ[k] ?? 1) => { const a = w.actors[k]; a.root.visible = true; a.root.position.copy(at(set, x, y, z)); a.root.rotation.set(0, yaw, 0); a.root.scale.setScalar(s); return a; };
const walk = (w: World, k: string, set: SetK, x0: number, z0: number, x1: number, z1: number, u: number, t: number, extra: Pose = {}, sp = 1.3, y = 0) => { const a = put(w, k, set, x0 + (x1 - x0) * u, y, z0 + (z1 - z0) * u, Math.atan2(x1 - x0, z1 - z0)); a.pose(t, { walk: sp, ...extra }); return a; };
const yawTo = (x0: number, z0: number, x1: number, z1: number) => Math.atan2(x1 - x0, z1 - z0);
/** étiquette au-dessus d'un personnage ou d'un point (montée + fondu) */
const lab = (w: World, key: string, a: Actor | THREE.Vector3, u: number, size = 1, dy = 0.7) => { const s = w.sets.med.labels[key], h = a instanceof THREE.Vector3 ? a.clone() : headOf(a); s.visible = u > 0.02; s.position.copy(h).add(V(0, dy + u * 0.35, 0));
  const k0 = s.userData.k0 ?? (s.userData.k0 = s.scale.x); s.scale.set(k0 * size, k0 * size * 0.1875, 1); (s.material as THREE.SpriteMaterial).opacity = cl(u * 6) * cl((1 - u) * 6 + 0.4); };
const MED = (w: World) => w.sets.med;
const H = (w: World) => w.actors.lumi;
/** soleil personnel au-dessus de (x, z) */
const sun = (w: World, set: SetK, x: number, z: number, k: number, t: number, Hc = 3.4, cloud = 1, power = 1) => MED(w).beam.set(at(set, x, 0, z), k, t, Hc, cloud, power);
/** lanterne dans la main droite */
const lant = (w: World, i: number, a: Actor) => { const l = MED(w).lanterns[i], kid = a.s.kid, tH = kid ? 2 * 0.72 + 0.3 : 2; a.root.updateMatrixWorld(true); l.visible = true; l.position.copy(a.rArm.localToWorld(V(0, -tH * 0.85 + 0.3, 0.2))).add(V(0, -0.2, 0)); l.rotation.set(0, a.root.rotation.y, 0); };
const LP: Pose = { armR: -0.35 };
const ears = (w: World, k: number) => { if (!w.ears) return; w.ears.m.emissiveIntensity = 4 * k; w.ears.l.intensity = 14 * k; };
const pigsGround = (cx: number, cz: number, set: SetK, n: number, r: number, seed = 0): Pig[] => Array.from({ length: n }, (_, i) => { const a = i * 2.4 + seed, rr = r * Math.sqrt(((i * 0.618 + seed) % 1)); return { p: at(set, cx + Math.cos(a) * rr, 0, cz + Math.sin(a) * rr), yaw: a * 1.7, fly: 0 }; });
const flock = (cx: number, cy: number, cz: number, set: SetK, n: number, t: number, spread: number, dir: THREE.Vector3, k: number): Pig[] => Array.from({ length: n }, (_, i) => { const h = (j: number) => Math.sin(i * 12.9898 + j * 78.233) * 43758.5453 % 1;
  const o = V(h(1) * spread, Math.abs(h(2)) * spread * 0.5, h(3) * spread), p = at(set, cx, cy, cz).add(o).add(dir.clone().multiplyScalar(k * (0.7 + 0.3 * Math.abs(h(4))))).add(V(0, Math.sin(t * 3 + i) * 0.15, 0));
  return { p, yaw: Math.atan2(dir.x, dir.z) + h(5) * 0.4, fly: 1 }; });
// classe
const SEATS: [string, number, number][] = [["k1", -2.6, -0.6], ["k3", -2.6, 0.75], ["k4", -1.1, -0.6], ["k2", -1.1, 0.75], ["k7", 0.4, 0.75], ["k6", -2.6, 2.1], ["t2", 0.4, -0.6]];
const seated = (w: World, t: number, e: Expr = "smile", laugh = false) => { for (const [k, x, z] of SEATS) { if (k === "t2") continue; const a = put(w, k, "CL2", x, 0.4, z + 0.5, Math.PI);
  a.pose(t, { sit: true, expr: e, talk: laugh && Math.sin(t * 3 + x * 2) > 0, headYaw: Math.sin(t * 0.7 + x) * 0.2, point: laugh && z < 0 ? 0.1 : undefined }); } };
// chercheurs dans la forêt (lanternes)
const SEARCH: [string, number, number][] = [["boulanger", -0.6, 0], ["t1", 0.7, -0.6], ["t3", -0.2, 1.1], ["maman", 0.9, 1.4], ["t2", -1.0, 1.9], ["k1", 0.3, 2.4], ["lumi", -0.7, 0.9]];
const searchers = (w: World, set: SetK, x0: number, z0: number, x1: number, z1: number, u: number, t: number, skip: string[] = []) => { let i = 0;
  for (const [k, dx, dz] of SEARCH) { if (skip.includes(k)) continue; const a = walk(w, k, set, x0 + dx, z0 + dz, x1 + dx, z1 + dz, u, t, { expr: "worried", ...LP }, 1.1); if (i < 6) lant(w, i, a); i++; } };

export const SHOTS: Shot[] = [
  // ——— Dans cette ville, le jour de tes dix ans, tu reçois un pouvoir. Mais toujours un pouvoir nul.
  { w: "Dans cette ville", set: "VILLE", fr: "Plongée sur le village : chalets sombres, volets rouges, mélèzes dorés, montagnes", g: DAY, cam: (_w, u) => C("VILLE", [-34, 14, 12], [-24, 9, 9], [0, 1.5, 0], [4, 1.5, 0], 46, u),
    st: (w, u, t) => { walk(w, "t1", "VILLE", -8 + u * 2, -1.2, 10, -1.2, 0.4, t, { expr: "smile" }); walk(w, "t2", "VILLE", 6 - u * 2, 1.4, -10, 1.4, 0.4, t, { expr: "smile" }); walk(w, "k3", "VILLE", -14, 0.4, 4, 0.4, 0.4 + u * 0.3, t, { expr: "happy" }, 1.8); } },
  { w: "le jour de tes dix ans", set: "VILLE", fr: "Une enfant devant chez elle : des étincelles dorées tourbillonnent, « 10 ans »", g: DAY, cam: (_w, u) => C("VILLE", [-11.2, 1.3, -1.4], [-11.5, 1.3, -1.9], [-12.8, 1.0, -4.3], null, 46, u),
    st: (w, u, t) => { const k = put(w, "k3", "VILLE", -12.8, 0, -4.6, 0.5); k.pose(t, { expr: "happy", armsUp: 0.5 + 0.3 * sm(u * 2) }); MED(w).setSparks(t, at("VILLE", -12.8, 0.1, -4.6), cl(u * 3)); lab(w, "dix", k, cl(u * 1.6), 0.5, 0.6); } },
  { w: "Mais toujours un pouvoir nul", set: "VILLE", fr: "Les étincelles retombent : elle fait juste pousser… un radis. « pouvoir : NUL »", g: DAY, cam: (_w, u) => C("VILLE", [-11.4, 1.2, -2.2], [-11.6, 1.15, -2.6], [-12.8, 0.9, -4.5], null, 44, u),
    st: (w, u, t) => { const k = put(w, "k3", "VILLE", -12.8, 0, -4.6, 0.5); k.pose(t, { expr: u > 0.3 ? "sad" : "worried", armL: -0.3, armR: -0.3, headPitch: 0.25 }); MED(w).setSparks(t, at("VILLE", -12.8, 0.1, -4.6), cl(1 - u * 3) * 0.6); lab(w, "nul", k, cl((u - 0.25) * 2), 0.7, 0.55); } },
  // ——— Le boulanger peut faire éternuer n'importe qui, juste en le regardant.
  { w: "Le boulanger peut faire", set: "VILLE", fr: "Le boulanger, sur le pas de sa boutique, fixe un passant", g: DAY, cam: (_w, u) => C("VILLE", [-9.4, 1.8, 0.4], [-9.8, 1.75, 0.9], [-12.5, 1.6, 4.8], null, 46, u),
    st: (w, u, t) => { put(w, "boulanger", "VILLE", -12.5, 0, 5.1, Math.PI + 0.5).pose(t, { expr: "focus", headYaw: 0.25 }); walk(w, "t1", "VILLE", -15, 2.4, -11.4, 2.6, 0.2 + u * 0.4, t, { expr: "smile" }, 1.1); } },
  { w: "juste en le regardant", set: "VILLE", fr: "Le passant éternue d'un coup : « ATCHOUM ! »", g: DAY, cam: (w, u) => CH("VILLE", w.actors.t1, [-11.0, 1.9, 0.2], [-11.2, 1.9, 0.5], 46, u, -0.2),
    st: (w, u, t) => { const s = cl((u - 0.35) * 5), j = Math.sin(s * Math.PI); put(w, "boulanger", "VILLE", -12.5, 0, 5.1, Math.PI + 0.5).pose(t, { expr: "focus" }); const a = put(w, "t1", "VILLE", -13.0, 0, 2.6, -2.3);
      a.pose(t, { expr: s > 0.05 && s < 0.9 ? "shout" : "worried", headPitch: -0.4 + j * 0.8, lean: j * 0.35, cover: s < 0.05 ? 0.5 : undefined }); lab(w, "atch", a, cl((u - 0.4) * 2), 0.65, 0.6); } },
  // ——— Madame Rose parle aux pigeons. Mais les pigeons ne disent jamais rien d'intéressant.
  { w: "Madame Rose parle", set: "VILLE", fr: "Madame Rose sur son banc, entourée de pigeons, leur parle", g: DAY, cam: (_w, u) => C("VILLE", [-6.0, 1.3, 1.6], [-6.4, 1.25, 2.0], [-8, 0.9, 4.6], null, 46, u),
    st: (w, _u, t) => { put(w, "rose", "VILLE", -8, 0.4, 5.2, Math.PI).pose(t, { sit: true, expr: "happy", talk: true, armR: -1.0 }); MED(w).pigs.set(t, pigsGround(-8, 3.9, "VILLE", 14, 1.3)); } },
  { w: "Mais les pigeons ne disent", set: "VILLE", fr: "Au ras du sol : les pigeons picorent. « Rrrou. »", g: DAY, cam: (_w, u) => C("VILLE", [-7.2, 0.45, 2.2], [-7.4, 0.45, 2.5], [-8.1, 0.3, 3.9], null, 42, u),
    st: (w, u, t) => { put(w, "rose", "VILLE", -8, 0.4, 5.2, Math.PI).pose(t, { sit: true, expr: "smile" }); const ps = pigsGround(-8, 3.9, "VILLE", 14, 1.3); MED(w).pigs.set(t, ps); lab(w, "rrou", ps[0].p.clone().add(V(0, 0.1, 0)), cl((u - 0.3) * 2), 0.45, 0.25); } },
  // ——— Le maire brille dans le noir. Enfin… seulement les oreilles.
  { w: "Le maire brille", set: "VILLE", fr: "Nuit : le maire devant la mairie, une lueur dorée autour de sa tête", g: NIGHT, ...GN, cam: (_w, u) => C("VILLE", [17.6, 1.9, 0.6], [17.9, 1.85, 1.2], [19.25, 1.9, 5.0], null, 46, u),
    st: (w, _u, t) => { put(w, "maire", "VILLE", 19.25, 0, 4.9, Math.PI + 0.3).pose(t, { expr: "smug" }); ears(w, 1); } },
  { w: "Enfin seulement les oreilles", set: "VILLE", fr: "Gros plan : ses deux oreilles brillent comme des ampoules", g: NIGHT, ...GN, cam: (w, u) => CH("VILLE", w.actors.maire, [18.6, 2.15, 3.4], [18.7, 2.12, 3.6], 40, u, -0.15),
    st: (w, _u, t) => { put(w, "maire", "VILLE", 19.25, 0, 4.9, Math.PI + 0.3).pose(t, { expr: "neutral", headYaw: -0.2 }); ears(w, 1); } },
  // ——— Et ma grande sœur peut faire voler une cuillère. Une seule. La petite.
  { w: "Et ma grande sœur", set: "MAI", fr: "Cuisine : la grande sœur, concentrée, fait léviter une cuillère", g: IN, cam: (_w, u) => C("MAI", [1.6, 1.6, 1.8], [1.4, 1.55, 1.5], [-0.8, 1.15, -1.0], null, 52, u),
    st: (w, u, t) => { put(w, "soeur", "MAI", -1.1, 0, -1.7, 0.45).pose(t, { expr: "focus", point: 0.2 }); MED(w).spoon.position.set(-0.55, 0.95 + 0.25 * sm(u * 2) + Math.sin(t * 3) * 0.03, -0.5); MED(w).spoon.rotation.set(0, t * 0.6, Math.sin(t * 2) * 0.2); } },
  { w: "Une seule", set: "MAI", fr: "Gros plan : une toute petite cuillère qui flotte", g: IN, cam: (_w, u) => C("MAI", [-0.15, 1.3, 0.5], [-0.25, 1.28, 0.3], [-0.55, 1.2, -0.5], null, 38, u),
    st: (w, _u, t) => { put(w, "soeur", "MAI", -1.1, 0, -1.7, 0.45).pose(t, { expr: "smug", point: 0.2 }); MED(w).spoon.position.set(-0.55, 1.2 + Math.sin(t * 3) * 0.03, -0.5); MED(w).spoon.rotation.set(0, t * 0.6, Math.sin(t * 2) * 0.2); } },
  // ——— Moi, j'attendais mes dix ans depuis toujours.
  { w: "Moi, j'attendais", set: "VILLE", fr: "Le héros assis sur la marche de sa maison, menton dans les mains, attend", g: DAY, cam: (_w, u) => C("VILLE", [-3.2, 1.1, -2.2], [-3.4, 1.1, -2.6], [-4.75, 0.85, -5.0], null, 46, u),
    st: (w, _u, t) => { put(w, "lumi", "VILLE", -4.75, 0.3, -5.0, 0.15).pose(t, { sit: true, expr: "neutral", armL: -1.6, armR: -1.6, headPitch: 0.1 }); } },
  // ——— Le matin de mon anniversaire, j'ai soufflé les bougies…
  { w: "Le matin de mon anniversaire", set: "MAI", fr: "Le gâteau aux dix bougies, la famille autour du héros", g: IN, cam: (_w, u) => C("MAI", [0.1, 1.75, 2.4], [0.05, 1.65, 2.0], [0, 1.1, -1.0], null, 50, u),
    st: (w, _u, t) => { put(w, "lumi", "MAI", 0, 0, -1.6, 0).pose(t, { expr: "happy" }); put(w, "soeur", "MAI", -1.1, 0, -1.7, 0.35).pose(t, { expr: "happy", cheer: true }); put(w, "maman", "MAI", 1.25, 0, -1.8, -0.35).pose(t, { expr: "happy", wave: "R" }); } },
  { w: "j'ai soufflé les bougies", set: "MAI", fr: "Il souffle : les flammes s'éteignent", g: IN, cam: (_w, u) => C("MAI", [0.45, 1.25, 0.6], [0.35, 1.22, 0.4], [0, 1.15, -1.2], null, 44, u),
    st: (w, u, t) => { put(w, "lumi", "MAI", 0, 0, -1.6, 0).pose(t, { expr: "focus", lean: 0.2 * sm(u * 3) }); put(w, "soeur", "MAI", -1.1, 0, -1.7, 0.35).pose(t, { expr: "happy" }); const on = u < 0.45; for (const f of MED(w).flames) f.visible = on; MED(w).cakeL.intensity = on ? 2.5 : 0; } },
  // ——— et au-dessus de ma tête, un petit nuage s'est ouvert, et un rayon de soleil est tombé.
  { w: "et au-dessus de ma tête", set: "MAI", fr: "Contre-plongée : un petit nuage se forme sous le plafond, au-dessus de lui", g: IN, cam: (_w, u) => C("MAI", [0.7, 0.95, 1.1], [0.6, 0.95, 0.9], [0, 2.0, -1.6], null, 52, u),
    st: (w, u, t) => { for (const f of MED(w).flames) f.visible = false; MED(w).cakeL.intensity = 0; put(w, "lumi", "MAI", 0, 0, -1.6, 0).pose(t, { expr: "worried", headPitch: -0.45 }); put(w, "soeur", "MAI", -1.1, 0, -1.7, 0.35).pose(t, { expr: "scared", headPitch: -0.3 }); sun(w, "MAI", 0, -1.6, 0, t, 2.5, sm(u * 1.6)); } },
  { w: "et un rayon de soleil", set: "MAI", fr: "Un rayon de soleil tombe du nuage sur lui", g: IN, cam: (_w, u) => C("MAI", [1.6, 1.6, 1.9], [1.4, 1.6, 1.6], [0, 1.4, -1.6], null, 52, u),
    st: (w, u, t) => { for (const f of MED(w).flames) f.visible = false; MED(w).cakeL.intensity = 0; put(w, "lumi", "MAI", 0, 0, -1.6, 0).pose(t, { expr: u > 0.5 ? "happy" : "worried", headPitch: -0.4 }); put(w, "soeur", "MAI", -1.1, 0, -1.7, 0.35).pose(t, { expr: "happy" }); put(w, "maman", "MAI", 1.25, 0, -1.8, -0.35).pose(t, { expr: "smile", cover: 0.3 }); sun(w, "MAI", 0, -1.6, sm(u * 2), t, 2.5); } },
  // ——— Un mètre carré de soleil. Rien que pour moi.
  { w: "Un mètre carré de soleil", set: "VILLE", fr: "Dehors, sous un ciel gris : lui seul est au soleil", g: GREY, ...GS, cam: (_w, u) => C("VILLE", [4.6, 1.7, 3.2], [4.2, 1.7, 2.8], [2, 1.3, -0.4], null, 46, u),
    st: (w, _u, t) => { put(w, "lumi", "VILLE", 2, 0, -0.4, 0.4).pose(t, { expr: "happy", armsUp: 0.3 }); sun(w, "VILLE", 2, -0.4, 1, t); walk(w, "t2", "VILLE", -4, 1.8, 8, 1.8, 0.3, t, { expr: "neutral" }, 1.1); } },
  { w: "Rien que pour moi", set: "VILLE", fr: "Il lève la tête vers son petit nuage, ébloui", g: GREY, ...GS, cam: (w, u) => CH("VILLE", H(w), [3.0, 1.15, 0.6], [2.9, 1.15, 0.45], 44, u, -0.05),
    st: (w, _u, t) => { put(w, "lumi", "VILLE", 2, 0, -0.4, 0.5).pose(t, { expr: "happy", headPitch: -0.35 }); sun(w, "VILLE", 2, -0.4, 1, t); } },
  // ——— Il me suit partout. Quand je marche, il marche. Quand je cours, il court.
  { w: "Il me suit partout", set: "VILLE", fr: "Il marche dans la rue : le carré de soleil le suit", g: GREY, ...GS, cam: (_w, u) => C("VILLE", [-7, 1.7, 3.4], [1, 1.7, 3.4], [-5, 1.0, -0.4], [3, 1.0, -0.4], 48, u),
    st: (w, u, t) => { const x = -6 + 8 * u; walk(w, "lumi", "VILLE", -6, -0.4, 2, -0.4, u, t, { expr: "smile" }, 1.2); sun(w, "VILLE", x, -0.4, 1, t); } },
  { w: "Quand je cours", set: "VILLE", fr: "Il court : le soleil court avec lui", g: GREY, ...GS, cam: (_w, u) => C("VILLE", [3, 1.4, 3.0], [11, 1.6, 3.0], [4, 0.9, -0.4], [14, 0.9, -0.4], 50, u),
    st: (w, u, t) => { const x = 2 + 12 * u; walk(w, "lumi", "VILLE", 2, -0.4, 14, -0.4, u, t, { expr: "happy" }, 2.6); sun(w, "VILLE", x - 0.15, -0.4, 1, t); } },
  // ——— À l'école, tout le monde a ri. On m'a appelé « Lampadaire ».
  { w: "À l'école", set: "CL2", fr: "En classe, toute la classe éclate de rire devant le héros sous son rayon", g: IN, cam: (_w, u) => C("CL2", [3.4, 2.3, -2.0], [3.2, 2.25, -1.7], [-1.0, 1.0, 0.4], null, 56, u),
    st: (w, _u, t) => { seated(w, t, "happy", true); put(w, "lumi", "CL2", 0.9, 0, -2.6, -0.3).pose(t, { expr: "sad" }); sun(w, "CL2", 0.9, -2.6, 1, t, 2.6); put(w, "prof", "CL2", 2.6, 0, -3.0, -0.6).pose(t, { expr: "smile", cover: 0.4 }); } },
  { w: "On m'a appelé", set: "CL2", fr: "« LAMPADAIRE » au-dessus de sa tête", g: IN, cam: (w, u) => CH("CL2", H(w), [0.2, 1.55, 0.2], [0.25, 1.5, -0.05], 46, u, 0.1),
    st: (w, u, t) => { seated(w, t, "happy", true); const h = put(w, "lumi", "CL2", 0.9, 0, -2.6, -0.3); h.pose(t, { expr: "sad", headPitch: 0.2 }); sun(w, "CL2", 0.9, -2.6, 1, t, 2.6); lab(w, "lampa", h, cl(u * 1.6), 0.75, 0.55); } },
  // ——— Le pire pouvoir de toute l'histoire de la ville.
  { w: "Le pire pouvoir", set: "VILLE", fr: "Seul sur le banc, sous son petit soleil, dans la rue grise", g: GREY, ...GS, cam: (_w, u) => C("VILLE", [-5.2, 1.6, 0.6], [-5.6, 1.55, 1.1], [-8, 1.0, 4.9], null, 46, u),
    st: (w, _u, t) => { put(w, "lumi", "VILLE", -8, 0.4, 5.2, Math.PI).pose(t, { sit: true, expr: "sad", headPitch: 0.3 }); sun(w, "VILLE", -8, 5.0, 1, t, 3.6); walk(w, "k1", "VILLE", -14, 1.6, 0, 1.6, 0.4, t, { expr: "happy" }, 1.4); walk(w, "k2", "VILLE", -15, 2.4, 0, 2.4, 0.4, t, { expr: "happy", talk: true }, 1.4); } },
  // ——— Et puis, un soir d'automne, la plus grosse tempête qu'on ait jamais vue est arrivée.
  { w: "Et puis, un soir d'automne", set: "VILLE", fr: "Soir : le ciel s'assombrit, les fenêtres s'allument une à une", g: EVE, sky: "#d88a6a", sunK: 0.45, win: 1.4, cam: (_w, u) => C("VILLE", [-34, 5, 3.0], [-31, 5.6, 2.6], [6, 2.4, 0], null, 48, u) },
  { w: "la plus grosse tempête", set: "VILLE", fr: "La tempête frappe le village : pluie battante, éclairs", g: STORM, ...GT, cam: (_w, u) => C("VILLE", [33, 3.2, 3.6], [31, 3.6, 3.0], [0, 3, 0], null, 50, u) },
  // ——— Et la petite Lou, trois ans, la fille des voisins, avait disparu. Elle avait suivi son chat dans la forêt.
  { w: "Et la petite Lou", set: "VILLE", fr: "La petite Lou, en ciré jaune, et son chat roux sur le perron", g: STORM, ...GT, cam: (_w, u) => C("VILLE", [11.8, 0.95, -2.4], [11.6, 0.95, -2.7], [10.3, 0.65, -4.7], null, 44, u),
    st: (w, _u, t) => { put(w, "lou", "VILLE", 10.3, 0, -4.8, 0.4).pose(t, { expr: "smile", hold: 0.1 }); const c = MED(w).cat; c.visible = true; c.position.copy(at("VILLE", 11.0, 0, -4.4)); c.rotation.y = 1.2; MED(w).catTail.rotation.z = Math.sin(t * 2) * 0.4; } },
  { w: "la fille des voisins", set: "VILLE", fr: "La porte ouverte, sa mère crie son prénom sous la pluie", g: STORM, ...GT, cam: (_w, u) => C("VILLE", [8.2, 1.6, -1.2], [8.5, 1.6, -1.6], [10.5, 1.5, -5.2], null, 46, u),
    st: (w, _u, t) => { put(w, "maman", "VILLE", 10.5, 0, -5.0, 0.3).pose(t, { expr: "scared", talk: true, armR: -1.3, headYaw: 0.4 }); } },
  { w: "Elle avait suivi son chat", set: "PL", fr: "Lisière : la petite silhouette jaune suit le chat vers la forêt noire", g: STORM, ...GT, cam: (_w, u) => C("PL", [1.6, 1.1, 39.8], [1.4, 1.1, 39.2], [0, 0.7, 30], null, 46, u),
    st: (w, u, t) => { walk(w, "lou", "PL", 0.5, 37.5, 0.2, 34.6, u, t, { expr: "smile" }, 1.0); const c = MED(w).cat; c.visible = true; c.position.copy(at("PL", 0.2, 0, 33.6 - u * 2.2)); c.rotation.y = Math.PI; MED(w).catTail.rotation.z = Math.sin(t * 2) * 0.4; } },
  // ——— Toute la ville est sortie la chercher. Mais il faisait noir. Il pleuvait si fort qu'on ne voyait pas à deux mètres.
  { w: "Toute la ville est sortie", set: "VILLE", fr: "Sous l'orage, les habitants sortent avec des lanternes", g: STORM, ...GT, cam: (_w, u) => C("VILLE", [24, 2.2, 3.0], [25.5, 2.3, 2.6], [14, 1.4, -0.2], null, 48, u),
    st: (w, u, t) => { searchers(w, "VILLE", 12, -0.6, 22, -0.6, u * 0.6, t); for (let i = 0; i < 6; i++) { const a = SEARCH[i]; const ac = w.actors[a[0]]; ac.root.rotation.y = Math.PI / 2; } } },
  { w: "Mais il faisait noir", set: "PL", fr: "Dans la forêt, les lanternes ne sont que de petits points", g: STORM, ...GT, cam: (_w, u) => C("PL", [-5.5, 2.6, 4.6], [-4.8, 2.6, 5.4], [0, 1.2, 13], null, 48, u),
    st: (w, u, t) => { searchers(w, "PL", 0, 17, 0, 11, u, t); } },
  { w: "Il pleuvait si fort", set: "PL", fr: "Gros plan sous la pluie battante : le héros et le boulanger, trempés", g: STORM, ...GT, rain: 1.6, cam: (_w, u) => C("PL", [1.4, 1.5, 7.6], [1.2, 1.5, 7.9], [-0.2, 1.3, 10.6], null, 44, u),
    st: (w, u, t) => { searchers(w, "PL", 0, 10.6, 0, 10.0, u, t, ["t2", "k1", "maman", "t3"]); } },
  // ——— Alors Madame Rose a sifflé. Cent pigeons sont partis dans la nuit.
  { w: "Alors Madame Rose", set: "PL", fr: "Madame Rose, deux doigts dans la bouche, siffle", g: STORM, ...GT, cam: (w, u) => CH("PL", w.actors.rose, [0.35, 1.75, 3.4], [0.4, 1.75, 3.6], 42, u, -0.1),
    st: (w, _u, t) => { const r = put(w, "rose", "PL", 0.6, 0, 5.0, Math.PI - 0.15); r.pose(t, { expr: "focus", armR: -2.5, headPitch: -0.1 }); lant(w, 0, put(w, "boulanger", "PL", -0.6, 0, 5.8, Math.PI).pose(t, { expr: "worried", ...LP })); MED(w).pigs.set(t, pigsGround(0.6, 4.2, "PL", 18, 1.0)); } },
  { w: "Cent pigeons sont partis", set: "PL", fr: "Une nuée de pigeons s'envole dans l'orage", g: STORM, ...GT, cam: (_w, u) => C("PL", [2.6, 0.9, 7.6], [2.8, 1.1, 8.0], [0, 3.2, 1], null, 52, u),
    st: (w, u, t) => { put(w, "rose", "PL", 0.6, 0, 5.0, Math.PI - 0.15).pose(t, { expr: "smile", armsUp: 0.5 }); lant(w, 0, put(w, "boulanger", "PL", -0.6, 0, 5.8, Math.PI).pose(t, { expr: "worried", ...LP })); MED(w).pigs.set(t, flock(0.6, 0.4 + u * 4, 4.2 - u * 4, "PL", 100, t, 1.2 + u * 5, V(0, 2, -8), u)); } },
  // ——— Et pour la première fois de leur vie, ils ont dit un truc intéressant : « Le vieux chêne. Derrière la rivière. »
  { w: "Et pour la première fois", set: "PL", fr: "Les pigeons reviennent et se posent autour de Rose", g: STORM, ...GT, cam: (_w, u) => C("PL", [2.2, 1.5, 7.2], [2.0, 1.45, 6.9], [0.6, 0.9, 4.6], null, 46, u),
    st: (w, u, t) => { put(w, "rose", "PL", 0.6, 0, 5.0, Math.PI - 0.15).pose(t, { expr: "happy", armR: -1.0 }); lant(w, 0, put(w, "boulanger", "PL", -0.6, 0, 5.8, Math.PI).pose(t, { expr: "neutral", ...LP }));
      const g = pigsGround(0.6, 4.0, "PL", 18, 1.1); const k = sm(u * 1.6); MED(w).pigs.set(t, g.map((p, i) => ({ p: p.p.clone().add(V(0, (1 - k) * (2 + (i % 4)), 0)), yaw: p.yaw, fly: k < 0.98 ? 1 : 0 }))); } },
  { w: "Le vieux chêne", set: "PL", fr: "Un pigeon, la tête levée : « Le vieux chêne. »", g: STORM, ...GT, cam: (_w, u) => C("PL", [1.5, 0.55, 3.0], [1.4, 0.55, 3.2], [0.6, 0.35, 4.0], null, 42, u),
    st: (w, u, t) => { put(w, "rose", "PL", 0.6, 0, 5.0, Math.PI - 0.15).pose(t, { expr: "scared" }); const g = pigsGround(0.6, 4.0, "PL", 18, 1.1); MED(w).pigs.set(t, g); lab(w, "chene", g[0].p.clone().add(V(0, 0.15, 0)), cl(u * 1.6), 0.6, 0.25); } },
  { w: "Derrière la rivière", set: "PL", fr: "Un éclair découpe le vieux chêne, de l'autre côté de la rivière", g: STORM, ...GT, cam: (_w, u) => C("PL", [0.8, 2.0, 6.4], [0.6, 2.5, 5.6], [0, 4.5, -16], null, 50, u),
    st: (w, u, t) => { const g = pigsGround(0.6, 4.0, "PL", 6, 0.6); MED(w).pigs.set(t, g); lab(w, "riv", at("PL", 0.4, 1.2, 3.0), cl(u * 1.6), 0.7, 0.2); } },
  // ——— Le maire est passé devant. Ses oreilles éclairaient le chemin comme deux lanternes.
  { w: "Le maire est passé devant", set: "PL", fr: "Le maire traverse le pont en tête, les oreilles allumées", g: STORM, ...GT, cam: (_w, u) => C("PL", [3.6, 1.7, -5.2], [3.2, 1.7, -5.6], [0, 1.5, 0.5], null, 46, u),
    st: (w, u, t) => { const z = 3.4 - 6 * u; const m = walk(w, "maire", "PL", 0, 3.4, 0, -2.6, u, t, { expr: "focus" }, 1.1, Math.abs(z) < 3.4 ? 0.56 : 0); void m; ears(w, 1);
      for (const [k, dz, dx] of [["rose", 2.2, 0.5], ["boulanger", 3.4, -0.5], ["lumi", 4.4, 0.4]] as [string, number, number][]) { const zz = z + dz; const a = walk(w, k, "PL", dx, 3.4 + dz, dx, -2.6 + dz, u, t, { expr: "worried", ...LP }, 1.1, Math.abs(zz) < 3.4 ? 0.56 : 0); if (k !== "rose") lant(w, k === "lumi" ? 1 : 0, a); } } },
  { w: "Ses oreilles éclairaient", set: "PL", fr: "De face : les oreilles du maire éclairent le sentier comme deux lanternes", g: STORM, ...GT, cam: (w, u) => CH("PL", w.actors.maire, [0.6, 1.9, -9.4], [0.55, 1.88, -9.0], 44, u, -0.2),
    st: (w, u, t) => { walk(w, "maire", "PL", 0, -5.4, 0, -7.6, u, t, { expr: "focus" }, 1.0); ears(w, 1.1); walk(w, "rose", "PL", 0.6, -3.6, 0.6, -5.8, u, t, { expr: "worried" }, 1.0); } },
  // ——— Arrivés au chêne : personne. Juste des buissons, partout.
  { w: "Arrivés au chêne", set: "PL", fr: "Le groupe arrive au pied du chêne : personne", g: STORM, ...GT, cam: (_w, u) => C("PL", [-3.2, 1.8, -6.4], [-2.8, 1.9, -7.2], [0.6, 2.2, -16], null, 50, u),
    st: (w, _u, t) => { put(w, "maire", "PL", -0.4, 0, -10.0, Math.PI - 0.2).pose(t, { expr: "worried", headYaw: 0.4 }); ears(w, 1); let i = 0;
      for (const [k, x, z] of [["rose", 0.6, -9.4], ["boulanger", -1.5, -9.0], ["lumi", 0.2, -8.4], ["t1", 1.4, -8.6], ["maman", -0.8, -8.2]] as [string, number, number][]) { const a = put(w, k, "PL", x, 0, z, Math.PI + x * 0.1); a.pose(t, { expr: "worried", ...LP }); if (k !== "rose") lant(w, i++, a); } } },
  { w: "Juste des buissons", set: "PL", fr: "Panoramique sur les buissons trempés autour du chêne", g: STORM, ...GT, cam: (_w, u) => C("PL", [-3.6, 1.3, -9.4], [3.6, 1.3, -9.6], [-3.4, 0.6, -13.2], [3.6, 0.6, -13.4], 46, u),
    st: (w, _u, t) => { const b = put(w, "boulanger", "PL", 0.4, 0, -9.0, Math.PI); b.pose(t, { expr: "worried", ...LP }); lant(w, 0, b); ears(w, 1); put(w, "maire", "PL", -1.4, 0, -9.6, Math.PI + 0.3).pose(t, { expr: "worried" }); } },
  // ——— Alors le boulanger a fixé les buissons, très fort. Et on a entendu : « Atchoum ! »
  { w: "Alors le boulanger a fixé", set: "PL", fr: "Le boulanger plisse les yeux et fixe les buissons", g: STORM, ...GT, cam: (w, u) => CH("PL", w.actors.boulanger, [1.4, 1.95, -12.0], [1.3, 1.93, -11.8], 40, u, -0.15),
    st: (w, _u, t) => { const b = put(w, "boulanger", "PL", 0.9, 0, -10.2, yawTo(0.9, -10.2, 2.4, -12.6)); b.pose(t, { expr: "angry", lean: 0.15, ...LP }); lant(w, 0, b); ears(w, 0.8); put(w, "maire", "PL", -0.2, 0, -9.8, yawTo(-0.2, -9.8, 2.4, -12.6)).pose(t, { expr: "worried" }); } },
  { w: "Et on a entendu", set: "PL", fr: "Un buisson tremble : « ATCHOUM ! »", g: STORM, ...GT, cam: (_w, u) => C("PL", [3.3, 1.1, -10.0], [3.15, 1.05, -10.4], [2.4, 0.6, -12.6], null, 44, u),
    st: (w, u, t) => { const s = cl((u - 0.45) * 4); const b = MED(w).bushLou; b.rotation.z = Math.sin(t * 40) * 0.06 * Math.sin(s * Math.PI); b.scale.setScalar(1 + 0.05 * Math.sin(s * Math.PI)); lab(w, "atch2", at("PL", 2.4, 1.0, -12.6), cl((u - 0.4) * 2), 0.65, 0.2); ears(w, 0.8); } },
  // ——— Lou était là, roulée en boule, trempée, gelée, avec son chat.
  { w: "Lou était là", set: "PL", fr: "Lou recroquevillée dans le buisson, trempée, son chat contre elle", g: STORM, ...GT, cam: (_w, u) => C("PL", [3.0, 0.75, -11.2], [2.9, 0.72, -11.5], [2.4, 0.42, -12.6], null, 40, u),
    st: (w, _u, t) => { const l = put(w, "lou", "PL", 2.4, 0.04, -12.5, 0.4); l.root.position.x += Math.sin(t * 30) * 0.006; l.pose(t, { sit: true, expr: "sad", cover: 0.45, headPitch: 0.25 }); const c = MED(w).cat; c.visible = true; c.position.copy(at("PL", 2.05, 0, -12.3)); c.rotation.y = 0.9; MED(w).catTail.rotation.z = 0; ears(w, 0.6); } },
  // ——— Je me suis approché. Et au-dessus de nous, mon mètre carré de soleil s'est allumé.
  { w: "Je me suis approché", set: "PL", fr: "Le héros s'approche, la pluie lui fouette le visage", g: STORM, ...GT, cam: (_w, u) => C("PL", [1.3, 1.0, -13.8], [1.45, 1.0, -13.6], [2.8, 0.95, -10.6], null, 46, u),
    st: (w, u, t) => { const h = walk(w, "lumi", "PL", 3.4, -9.4, 2.9, -11.5, u, t, { expr: "focus", ...LP }, 1.0); lant(w, 0, h); const l = put(w, "lou", "PL", 2.4, 0.04, -12.5, 0.4); l.pose(t, { sit: true, expr: "sad", cover: 0.45 }); const c = MED(w).cat; c.visible = true; c.position.copy(at("PL", 2.05, 0, -12.3)); c.rotation.y = 0.9; } },
  { w: "Et au-dessus de nous", set: "PL", fr: "Le petit nuage s'ouvre : un carré de soleil doré au milieu de l'orage", g: STORM, ...GT, cam: (_w, u) => C("PL", [5.6, 2.2, -8.4], [5.2, 2.0, -8.8], [2.6, 1.2, -12.2], null, 48, u),
    st: (w, u, t) => { put(w, "lumi", "PL", 2.85, 0, -11.6, Math.PI + 0.3).pose(t, { expr: "focus", headPitch: -0.3 }); const l = put(w, "lou", "PL", 2.4, 0.04, -12.5, 0.4); l.pose(t, { sit: true, expr: "worried", headPitch: -0.3 }); const c = MED(w).cat; c.visible = true; c.position.copy(at("PL", 2.05, 0, -12.3)); c.rotation.y = 0.9;
      const k = sm(cl((u - 0.25) * 2.2)); sun(w, "PL", 2.65, -12.05, k, t, 3.4, sm(u * 3)); } },
  // ——— Au milieu de la tempête, il faisait chaud. C'était sec. Lou a arrêté de trembler. Son chat s'est mis à ronronner.
  { w: "Au milieu de la tempête", set: "PL", fr: "Il pleut partout… sauf dans le carré de soleil", g: STORM, ...GT, cam: (_w, u) => C("PL", [5.4, 1.5, -10.4], [5.1, 1.5, -10.8], [2.6, 1.0, -12.2], null, 46, u),
    st: (w, _u, t) => { put(w, "lumi", "PL", 2.85, 0, -11.6, Math.PI + 0.3).pose(t, { expr: "smile", reach: 0.4 }); put(w, "lou", "PL", 2.4, 0.04, -12.5, 0.4).pose(t, { sit: true, expr: "smile", headPitch: -0.2 }); const c = MED(w).cat; c.visible = true; c.position.copy(at("PL", 2.05, 0, -12.3)); c.rotation.y = 0.9; sun(w, "PL", 2.65, -12.05, 1, t); } },
  { w: "Lou a arrêté de trembler", set: "PL", fr: "Lou, réchauffée, sourit dans la lumière dorée", g: STORM, ...GT, cam: (w, u) => CH("PL", w.actors.lou, [3.0, 0.75, -11.4], [2.95, 0.74, -11.6], 40, u, -0.05),
    st: (w, _u, t) => { put(w, "lumi", "PL", 2.85, 0, -11.6, Math.PI + 0.3).pose(t, { expr: "smile" }); put(w, "lou", "PL", 2.4, 0.04, -12.5, 0.5).pose(t, { sit: true, expr: "happy", headPitch: -0.15 }); const c = MED(w).cat; c.visible = true; c.position.copy(at("PL", 2.05, 0, -12.3)); c.rotation.y = 0.9; sun(w, "PL", 2.65, -12.05, 1, t); } },
  { w: "Son chat s'est mis", set: "PL", fr: "Le chat roux ferme les yeux et ronronne", g: STORM, ...GT, cam: (_w, u) => C("PL", [2.3, 0.45, -11.6], [2.25, 0.44, -11.75], [2.05, 0.35, -12.3], null, 38, u),
    st: (w, u, t) => { put(w, "lou", "PL", 2.4, 0.04, -12.5, 0.5).pose(t, { sit: true, expr: "happy" }); const c = MED(w).cat; c.visible = true; c.position.copy(at("PL", 2.05, 0, -12.3)); c.rotation.y = 0.9; MED(w).catTail.rotation.z = Math.sin(t * 1.5) * 0.5; sun(w, "PL", 2.65, -12.05, 1, t); lab(w, "ronron", at("PL", 2.05, 0.5, -12.3), cl((u - 0.2) * 2), 0.4, 0.1); } },
  // ——— On est rentrés comme ça, tous les deux sous mon soleil, derrière les oreilles du maire, jusqu'à la maison de Lou.
  { w: "On est rentrés comme ça", set: "PL", fr: "Retour sur le pont : les deux enfants sous le soleil, le maire devant", g: STORM, ...GT, cam: (_w, u) => C("PL", [1.9, 1.5, 6.2], [1.7, 1.5, 5.8], [0, 1.1, -1], null, 46, u),
    st: (w, u, t) => { const z = -3.2 + 4 * u, y = Math.abs(z) < 3.4 ? 0.56 : 0; walk(w, "lumi", "PL", 0.3, -3.2, 0.3, 0.8, u, t, { expr: "smile", armL: -0.4 }, 0.9, y); walk(w, "lou", "PL", -0.25, -3.2, -0.25, 0.8, u, t, { expr: "happy", armR: -0.5 }, 1.2, y); sun(w, "PL", 0.02, z, 1, t, 3.4 + y);
      const mz = z + 2.6; walk(w, "maire", "PL", 0, -0.6, 0, 3.4, u, t, { expr: "smile" }, 1.0, Math.abs(mz) < 3.4 ? 0.56 : 0); ears(w, 1); } },
  { w: "jusqu'à la maison de Lou", set: "VILLE", fr: "Devant chez Lou, sa mère la serre dans ses bras, sous le petit soleil", g: STORM, ...GT, cam: (_w, u) => C("VILLE", [12.2, 1.4, -1.5], [12.0, 1.4, -1.8], [10.4, 1.0, -4.4], null, 46, u),
    st: (w, _u, t) => { put(w, "maman", "VILLE", 10.4, 0, -5.0, 0.2).pose(t, { expr: "happy", reach: 0.8, lean: 0.25 }); put(w, "lou", "VILLE", 10.5, 0, -4.4, Math.PI).pose(t, { expr: "happy", armsUp: 0.6 }); put(w, "lumi", "VILLE", 11.4, 0, -4.0, -2.4).pose(t, { expr: "smile" }); sun(w, "VILLE", 10.9, -4.4, 1, t, 3.6);
      put(w, "maire", "VILLE", 8.6, 0, -2.8, 1.8).pose(t, { expr: "happy" }); ears(w, 0.8); } },
  // ——— Depuis, plus personne ne m'appelle Lampadaire.
  { w: "Depuis, plus personne", set: "VILLE", fr: "Jour gris : les habitants saluent le héros avec le sourire", g: GREY, ...GS, cam: (_w, u) => C("VILLE", [4.4, 1.7, 3.0], [4.0, 1.7, 2.6], [0, 1.2, -0.4], null, 48, u),
    st: (w, u, t) => { walk(w, "lumi", "VILLE", -2, -0.4, 2, -0.4, u, t, { expr: "happy" }, 1.1); sun(w, "VILLE", -2 + 4 * u, -0.4, 1, t); put(w, "boulanger", "VILLE", -1.0, 0, 2.6, Math.PI + 0.4).pose(t, { expr: "happy", wave: "R" }); put(w, "rose", "VILLE", 1.6, 0, 2.8, Math.PI - 0.3).pose(t, { expr: "happy", wave: "L" }); MED(w).pigs.set(t, pigsGround(2.2, 2.0, "VILLE", 6, 0.6)); } },
  // ——— Et quand il pleut, dans cette ville, tout le monde marche très, très près de moi.
  { w: "Et quand il pleut", set: "VILLE", fr: "Il pleut : les habitants courent vers le carré de soleil", g: GREY, ...GS, rain: 0.8, cam: (_w, u) => C("VILLE", [9, 2.4, 3.4], [8.4, 2.6, 3.0], [0, 1.0, -0.4], null, 48, u),
    st: (w, u, t) => { put(w, "lumi", "VILLE", 0, 0, -0.4, 0.4).pose(t, { expr: "smile" }); sun(w, "VILLE", 0, -0.4, 1, t);
      for (const [k, x0, z0] of [["boulanger", -5, 2.6], ["rose", 5, 2.2], ["t1", -4, -2.8], ["t2", 6, -2.4], ["k1", -6, 0.8], ["maire", 4.6, 0.6]] as [string, number, number][]) { const dx = x0 * 0.12, dz = (z0 + 0.4) * 0.12; walk(w, k, "VILLE", x0, z0, dx, -0.4 + dz, sm(u * 1.4) * 0.9, t, { expr: "happy" }, 1.6); } ears(w, 0.5) } },
  { w: "tout le monde marche très", set: "VILLE", fr: "Tout le village serré sous son mètre carré de soleil ; la caméra s'élève", g: GREY, ...GS, rain: 0.8, cam: (_w, u) => C("VILLE", [3.2, 1.7, 3.0], [7, 11, 9], [0, 1.1, -0.4], [0, 0.4, -0.4], 46, u, 50),
    st: (w, _u, t) => { put(w, "lumi", "VILLE", 0, 0, -0.4, 0.5).pose(t, { expr: "happy" }); sun(w, "VILLE", 0, -0.4, 1, t, 3.8); let i = 0;
      for (const k of ["boulanger", "rose", "t1", "t2", "k1", "maire", "soeur", "maman", "lou"]) { const a = i * 0.7 + 0.3, r = 0.55 + (i % 2) * 0.12; const ac = put(w, k, "VILLE", Math.cos(a) * r, 0, -0.4 + Math.sin(a) * r, Math.atan2(-Math.cos(a), -Math.sin(a)) + Math.PI); ac.pose(t, { expr: "happy", cheer: k === "lou" }); i++; } ears(w, 0.5); } },
];

export const SHOT_START = (() => { let from = 0; return SHOTS.map((s) => { const i = find(s.w, from); from = i + 1; return i; }); })();
export const START = SHOT_START.map((wi, i) => (i === 0 ? 0 : Math.round((W[wi].s + (SHOTS[i].dt ?? 0)) * FPS) - 2));
export const shotAt = (f: number) => { let i = 0; while (i + 1 < START.length && START[i + 1] <= f) i++; return i; };
export const uOf = (i: number, f: number) => { const a = START[i], b = i + 1 < START.length ? START[i + 1] : TOTAL; return Math.min(1, Math.max(0, (f - a) / Math.max(1, b - a - 1))); };

const DEF: Grade = { sat: 0.45, con: 0.06, bri: 0, bloom: 0.9, bg: "#000", fog: "#000", fogD: 0, env: 0.5, snow: false };
export const gradeOf = (i: number): Grade => ({ ...DEF, ...(SHOTS[i].g ?? {}) });
/** éclairs : impulsions brèves et irrégulières */
export const flash = (t: number) => { let f = 0; for (const [p, o] of [[4.3, 0.3], [6.7, 2.1], [9.1, 5.0]] as [number, number][]) { const x = ((t + o) % p); f = Math.max(f, Math.max(0, 1 - x * 9), x > 0.18 && x < 0.3 ? 0.6 : 0); } return f; };

const SUNC = new THREE.Color("#ffe4c0"), MOONC = new THREE.Color("#7a90c8");
export const applyShot = (w: World, i: number, u: number, t: number, cam: THREE.Camera) => {
  const s = SHOTS[i], S = w.sets, m = S.med; S.show(s.set);
  for (const a of Object.values(w.actors)) { a.root.visible = false; a.root.position.y = 0; }
  for (const x of Object.values(S.tags)) x.visible = false; for (const x of S.rain) x.visible = false; for (const x of Object.values(m.labels)) x.visible = false;
  for (const l of m.lanterns) l.visible = false; m.cat.visible = false; m.beam.set(V(0, -50, 0), 0, t, 3, 0); m.pigs.set(t, []); m.setSparks(t, null);
  m.bushLou.rotation.set(0, 0, 0); m.bushLou.scale.setScalar(1); for (const f of m.flames) f.visible = true; m.cakeL.intensity = 2.5; m.spoon.position.set(-0.55, 0.88, -0.5); m.spoon.rotation.set(0, 0, 0);
  const fl = s.storm ? flash(t) : 0;
  m.winM.emissiveIntensity = s.win ?? (s.set === "VILLE" || s.set === "PL" ? 0.25 : 0.6);
  for (const k of m.skies) { k.color.set(s.sky ?? "#ffffff"); if (fl > 0) k.color.lerp(new THREE.Color("#a8b8f0"), fl * 0.8); }
  for (const [l, base] of m.suns) { l.intensity = base * (s.sunK ?? 1) * (1 + fl * 6); l.color.copy(s.moon ? MOONC : SUNC); }
  for (const [h, base] of m.hemis) h.intensity = base * (s.moon ? 0.35 : s.sunK !== undefined ? Math.max(0.5, s.sunK) : 1) * (1 + fl * 2);
  w.fill.intensity = 0; w.key.intensity = 0; ears(w, 0);
  s.st?.(w, u, t);
  // pluie autour de la caméra (zone sèche sous le soleil personnel)
  if (s.rain) { const f = new THREE.Vector3(); cam.getWorldDirection(f); f.y = 0; f.normalize(); const c = cam.position.clone().add(f.multiplyScalar(5)); c.y = O[s.set].y;
    const b = m.beam.root; m.rain.set(t, c, 12, b.visible && m.beam.col.visible ? { p: b.position, r: 0.66 } : undefined, s.rain); } else m.rain.set(t, null);
  return s;
};
