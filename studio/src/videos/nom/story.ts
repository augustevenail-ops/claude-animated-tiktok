// « Le Nom qui rapporte » ép. 1 : plans calés sur la voix (words.json). Ville méditerranéenne (VILLE), grande place (PL),
// classe (CL2), bureau de la mairie (MAI). Échelle : adulte ≈ 2,2 u, enfant ≈ 1,7 u.
import * as THREE from "three";
import WORDS from "./words.json";
import { Actor, CAST, Expr, Pose } from "./chars";
import { Sets, O, V, SetK } from "./sets";
import { CoinSrc } from "./med";

export const FPS = 30;
const W = WORDS as { w: string; s: number; e: number }[];
const LAST = W.filter((w) => /[a-zà-ÿ]/i.test(w.w)).pop()!;
export const TOTAL = Math.round((LAST.e + 1.6) * FPS);
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
const C = (k: SetK, p0: number[], p1: number[], t0: number[], t1: number[] | null, fov: number, u: number, f1 = fov) => G(at(k, p0[0], p0[1], p0[2]), at(k, p1[0], p1[1], p1[2]), at(k, t0[0], t0[1], t0[2]), at(k, ...((t1 ?? t0) as [number, number, number])), fov, u, f1);
const headOf = (a: Actor) => { a.root.updateMatrixWorld(true); return a.neck.localToWorld(V(0, 0.7, 0)); };
const CH = (k: SetK, a: Actor, p0: number[], p1: number[], fov: number, u: number, dy = -0.1) => { const h = headOf(a).add(V(0, dy, 0)); return G(at(k, p0[0], p0[1], p0[2]), at(k, p1[0], p1[1], p1[2]), h, h, fov, u); };

export type World = { sets: Sets; actors: Record<string, Actor>; scene?: THREE.Scene; fill: THREE.PointLight; key: THREE.SpotLight };
export type Grade = { sat: number; con: number; bri: number; bloom: number; bg: string; fog: string; fogD: number; env: number; snow: boolean };
type Shot = { set: SetK; w: string; cam: (w: World, u: number, t: number) => Cam; st?: (w: World, u: number, t: number) => void; g?: Partial<Grade>; fr: string; dt?: number; sky?: string; sunK?: number };

const KS = ["bart", "maman", "pardon", "boulanger", "chauffeur", "lamonnaie", "maire2", "employe", "prof", "factrice", "t1", "t2", "t3", "k1", "k2", "k3", "k4", "k6", "k7"];
const SZ: Record<string, number> = { bart: 0.9, pardon: 0.62, lamonnaie: 1.08, t3: 1.05 };
export const buildCast = (root: THREE.Object3D) => {
  const mk = (k: string, seed: number) => { const a = new Actor(CAST[k], 0.36, seed); root.add(a.root); a.root.visible = false; return a; };
  return { actors: Object.fromEntries(KS.map((k, i) => [k, mk(k, i + 3)])) as Record<string, Actor> };
};

// ---------------- ambiances (soleil méditerranéen saturé ; soir doré ; nuit ; ville « froide »)
const DAY: Partial<Grade> = { bg: "#7cc4f2", fog: "#f0d8c0", fogD: 0.002, sat: 0.6, con: 0.17, bri: -0.035, bloom: 0.95, env: 0.42 };
const IN: Partial<Grade> = { bg: "#000", fog: "#000", fogD: 0, sat: 0.55, con: 0.16, bri: -0.035, bloom: 0.95, env: 0.45 };
const EVE: Partial<Grade> = { ...DAY, fog: "#ffb080", fogD: 0.004, sat: 0.66, bri: -0.07, bloom: 1.15 };
const NIGHT: Partial<Grade> = { bg: "#101830", fog: "#1a2448", fogD: 0.006, sat: 0.45, con: 0.2, bri: -0.16, bloom: 1.3, env: 0.18 };
const COLD: Partial<Grade> = { ...DAY, fog: "#a8b4c4", fogD: 0.006, sat: -0.25, con: 0.2, bri: -0.06, bloom: 0.7 };

const put = (w: World, k: string, set: SetK, x: number, y: number, z: number, yaw: number, s = SZ[k] ?? 1) => { const a = w.actors[k]; a.root.visible = true; a.root.position.copy(at(set, x, y, z)); a.root.rotation.set(0, yaw, 0); a.root.scale.setScalar(s); return a; };
const walk = (w: World, k: string, set: SetK, x0: number, z0: number, x1: number, z1: number, u: number, t: number, extra: Pose = {}, sp = 1.3) => { const a = put(w, k, set, x0 + (x1 - x0) * u, 0, z0 + (z1 - z0) * u, Math.atan2(x1 - x0, z1 - z0)); a.pose(t, { walk: sp, ...extra }); return a; };
const yawTo = (x0: number, z0: number, x1: number, z1: number) => Math.atan2(x1 - x0, z1 - z0);
/** étiquette au-dessus d'un personnage (montée + fondu) */
const lab = (w: World, key: string, a: Actor, u: number, size = 1, dy = 0.7) => { const s = w.sets.med.labels[key], h = headOf(a); s.visible = u > 0.02; s.position.copy(h).add(V(0, dy + u * 0.35, 0));
  const k0 = s.userData.k0 ?? (s.userData.k0 = s.scale.x); s.scale.set(k0 * size, k0 * size * 0.1875, 1); (s.material as THREE.SpriteMaterial).opacity = cl(u * 6) * cl((1 - u) * 6 + 0.4); };
const handOf = (a: Actor, y = 0.9) => a.root.position.clone().add(V(0, y * a.root.scale.x, 0));
const B = (w: World) => w.actors.bart;
const MED = (w: World) => w.sets.med;
/** pièces : sources en coordonnées monde */
const coins = (w: World, which: "V" | "P" | "C", t: number, srcs: CoinSrc[], pile?: { p: THREE.Vector3; n: number; r: number; h: number }) => { const m = MED(w); (which === "V" ? m.coinsV : which === "P" ? m.coinsP : m.coinsC).set(t, srcs, pile); };
const choirManor = (w: World, t: number) => { const m = MED(w); m.choir.root.visible = true; m.choir.set(t, -13.02, -2, -Math.PI / 2, 8); };
const choirSquare = (w: World, t: number) => { const m = MED(w); m.choir.root.visible = true; m.choirSteps[1].visible = true; m.choir.set(t, 0, -15.08, 0, 8); };
const lamoSteps = (w: World, t: number, p: Pose = {}) => put(w, "lamonnaie", "PL", -22.9, 1.4, -2, Math.PI / 2).pose(t, { expr: "smug", ...p });
// classe
const SEATS: [string, number, number][] = [["k1", -2.6, -0.6], ["k3", -2.6, 0.75], ["k4", -1.1, -0.6], ["k2", -1.1, 0.75], ["k7", 0.4, 0.75], ["k6", -2.6, 2.1], ["t2", 0.4, -0.6]];
const seated = (w: World, t: number, e: Expr = "smile", skip: string[] = [], stand = false) => { for (const [k, x, z] of SEATS) { if (skip.includes(k) || k === "t2") continue; const a = put(w, k, "CL2", x + (stand ? 0.45 : 0), stand ? 0 : 0.4, z + 0.5 + (stand ? 0.15 : 0), Math.PI);
  a.pose(t, stand ? { expr: e, cheer: true } : { sit: true, expr: e, headYaw: Math.sin(t * 0.7 + x) * 0.2 }); } };

export const SHOTS: Shot[] = [
  // ——— Dans cette ville, chaque fois que quelqu'un dit ton nom, tu gagnes un euro.
  { w: "Dans cette ville", set: "VILLE", fr: "Plongée aérienne : toits en tuiles et terrasses, façades pastel, palmiers", g: DAY, cam: (_w, u) => C("VILLE", [-34, 15, 0.4], [-20, 8.5, 0.6], [0, 1, 0], [2, 1.6, 0], 46, u),
    st: (w, u, t) => { walk(w, "t1", "VILLE", -6 + u * 2, -1.2, 10, -1.2, 0.5, t, { expr: "smile" }); walk(w, "t2", "VILLE", 8 - u * 2, 1.4, -8, 1.4, 0.5, t, { expr: "happy" }); walk(w, "k3", "VILLE", -12, 0.6, 2, 0.6, 0.4 + u * 0.3, t, { expr: "happy" }, 1.8); walk(w, "maman", "VILLE", 16, -1.0, 4, -1.0, 0.3 + u * 0.3, t, { expr: "smile" });
      coins(w, "V", t, [{ p: at("VILLE", -6.8, 0.9, 0.6), n: 6, t0: t - 0.5, r: 0.3, dur: 2 }, { p: at("VILLE", 1.6, 1.0, -1.2), n: 6, t0: t - 0.8, r: 0.3, dur: 2 }]); } },
  { w: "tu gagnes un euro", set: "VILLE", fr: "Une passante appelle une enfant : une pièce lui tombe dans les mains, « +1 € »", g: DAY, cam: (_w, u) => C("VILLE", [-5.0, 1.6, 7.3], [-5.3, 1.55, 6.6], [-6.4, 1.1, 0.4], null, 46, u),
    st: (w, u, t) => { const T0 = t - u * 1.4; put(w, "t2", "VILLE", -7.6, 0, 0.2, 0.9).pose(t, { expr: "happy", talk: u < 0.5, wave: "R" }); const k = put(w, "k3", "VILLE", -5.9, 0, 0.6, -2.0); k.pose(t, { expr: u > 0.45 ? "happy" : "smile", hold: 0.3 });
      coins(w, "V", t, [{ p: handOf(k, 0.85), n: 1, t0: T0 + 0.4, r: 0.01, dur: 0.01, stay: true, h: 2.5 }]); lab(w, "e1", k, cl((u - 0.45) * 1.8), 0.6); } },
  // ——— Ça a l'air de rien, mais ça change tout.
  { w: "Ça a l'air de rien", set: "VILLE", fr: "La rue animée : des pièces tombent sur les passants dès qu'on les appelle", g: DAY, cam: (_w, u) => C("VILLE", [12, 3.2, 2.6], [10, 3.0, 2.2], [-4, 1.2, -0.5], null, 50, u),
    st: (w, u, t) => { walk(w, "t1", "VILLE", 2, -1.8, -8, -1.0, u * 0.6, t, { expr: "smile" }); walk(w, "t3", "VILLE", -9, 1.6, 4, 1.2, u * 0.6, t, { expr: "happy" }); walk(w, "k1", "VILLE", -3, 2.6, 6, -2.2, u * 0.7, t, { expr: "happy" }, 1.8); put(w, "maman", "VILLE", 4.5, 0, -3.9, 2.6).pose(t, { expr: "happy", wave: "R", talk: true });
      coins(w, "V", t, [{ p: at("VILLE", -3 + 9 * u * 0.7, 1.2, 2.6 - 4.8 * u * 0.7), n: 8, t0: t - 1.5, r: 0.3, dur: 3 }, { p: at("VILLE", 2 - 10 * u * 0.6, 1.4, -1.8 + 0.8 * u * 0.6), n: 6, t0: t - 1, r: 0.3, dur: 3 }]); } },
  // ——— Les stars de la télé sont milliardaires.
  { w: "Les stars de la télé", set: "PL", fr: "Écran géant sur la place : « Jordy ! Jordy ! » et une pluie de pièces", g: DAY, cam: (_w, u) => C("PL", [10, 4.5, -2], [11.5, 5, -3], [27, 8.5, -8], null, 46, u),
    st: (w, _u, t) => { coins(w, "P", t, [{ p: at("PL", 25.5, 0, -8), n: 160, t0: t - 2, r: 3.2, dur: 4, h: 7 }]); for (const [k, x, z] of [["t1", 18, -4], ["k2", 19.5, -6], ["t2", 20, -2.6]] as [string, number, number][]) put(w, k, "PL", x, 0, z, Math.PI / 2 + 0.2).pose(t, { expr: "happy", cheer: true }); } },
  // ——— Les profs gagnent leur salaire rien qu'en faisant l'appel.
  { w: "Les profs gagnent", set: "CL2", fr: "La prof fait l'appel : une pièce tombe à chaque prénom", g: IN, cam: (_w, u) => C("CL2", [3.4, 2.2, 2.8], [3.2, 2.1, 2.5], [0.6, 1.2, -2.6], null, 54, u),
    st: (w, u, t) => { seated(w, t); const p = put(w, "prof", "CL2", 1.0, 0, -2.9, 0.3); p.pose(t, { expr: "happy", talk: true, armR: -1.2 }); coins(w, "C", t, [{ p: at("CL2", 2.2, 0.78, -2.6), n: 14, t0: t - u * 2.2, r: 0.5, dur: 2.2, stay: true }]); } },
  // ——— Et les parents choisissent des prénoms faciles à crier.
  { w: "Et les parents choisissent", set: "VILLE", fr: "Des parents crient le prénom de leurs enfants depuis le pas de la porte", g: DAY, cam: (_w, u) => C("VILLE", [-16, 2.2, 3.4], [-15.4, 2.1, 2.8], [-18, 1.4, -3.6], null, 48, u),
    st: (w, _u, t) => { put(w, "t1", "VILLE", -17.5, 0, -4.1, 0.3).pose(t, { expr: "shout", talk: true, armR: -2.0 }); put(w, "t2", "VILLE", -19.2, 0, -4.0, 0.5).pose(t, { expr: "happy", talk: true, wave: "L" }); walk(w, "k4", "VILLE", -21, 1.5, -18.5, -2.2, 0.6, t, { expr: "happy" }, 1.6); } },
  // ——— Ma voisine a appelé sa fille « Pardon ».
  { w: "Ma voisine a appelé", set: "VILLE", fr: "La voisine et sa petite fille Pardon devant leur maison", g: DAY, cam: (_w, u) => C("VILLE", [11.4, 1.5, 2.6], [11.2, 1.45, 2.0], [10.2, 1.0, -3.9], null, 46, u),
    st: (w, _u, t) => { put(w, "maman", "VILLE", 9.6, 0, -4.0, 0.4).pose(t, { expr: "happy", armR: -0.6 }); put(w, "pardon", "VILLE", 10.7, 0, -3.8, -0.2).pose(t, { expr: "happy", wave: "R" }); } },
  // ——— Elle a trois ans, et elle s'est déjà acheté un poney.
  { w: "Elle a trois ans", set: "VILLE", fr: "Pardon, fière, sur son poney au milieu de la rue", g: DAY, cam: (_w, u) => C("VILLE", [8.0, 1.1, 4.0], [8.5, 1.15, 3.4], [6.5, 1.1, 0.4], null, 46, u),
    st: (w, u, t) => { const pn = MED(w).pony; pn.visible = true; pn.position.set(6.2 + u * 0.6, 0, 0.4); pn.rotation.y = Math.PI / 2 - 0.5; put(w, "pardon", "VILLE", 6.2 + u * 0.6, 0.78, 0.4, Math.PI / 2 - 0.5).pose(t, { expr: "happy", sit: true, cheer: Math.sin(t * 2) > 0 }); } },
  // ——— Parce qu'au marché, tout le monde se bouscule.
  { w: "Parce qu'au marché", set: "VILLE", fr: "Devant l'épicerie, tout le monde se bouscule : « Pardon ! » — les pièces pleuvent sur la fillette", g: DAY, cam: (_w, u) => C("VILLE", [19, 2.4, -3.0], [19.6, 2.3, -2.4], [22.5, 1.0, 2.6], null, 50, u),
    st: (w, u, t) => { walk(w, "t1", "VILLE", 25, 3.2, 20, 2.0, u, t, { expr: "worried" }); walk(w, "t3", "VILLE", 20.5, 1.2, 25.5, 2.6, u, t, { expr: "worried" }); walk(w, "k2", "VILLE", 24.5, 1.0, 21, 3.4, u, t, { expr: "worried" }, 1.6); const p = put(w, "pardon", "VILLE", 22.6, 0, 2.3, -2.6); p.pose(t, { expr: "happy", hold: 0.6 });
      coins(w, "V", t, [{ p: at("VILLE", 22.6, 0.6, 2.3), n: 40, t0: t - u * 2.5 - 0.2, r: 0.35, dur: 2.5, stay: true }]); } },
  // ——— Moi, je m'appelle Barthélémy-Aurélien. C'est beaucoup trop long.
  { w: "Moi, je m'appelle", set: "VILLE", fr: "Le héros devant sa porte ; son interminable prénom s'affiche au-dessus de lui", g: DAY, cam: (_w, u) => C("VILLE", [4.6, 1.7, 3.2], [4.4, 1.65, 2.6], [3.0, 1.3, -3.9], null, 46, u),
    st: (w, u, t) => { put(w, "bart", "VILLE", 3.0, 0, -3.9, 0.2).pose(t, { expr: "smile", wave: "R" }); lab(w, "bart", B(w), cl(u * 1.5), 1.0, 0.8); } },
  { w: "C'est beaucoup trop long", set: "VILLE", fr: "Le prénom s'étire, il soupire", g: DAY, cam: (_w, u) => C("VILLE", [5.0, 2.2, 1.0], [4.6, 2.1, 0.6], [3.0, 1.6, -3.9], null, 50, u),
    st: (w, u, t) => { put(w, "bart", "VILLE", 3.0, 0, -3.9, 0.2).pose(t, { expr: "sad", headPitch: 0.15 }); lab(w, "bart", B(w), 0.5, 1.0 + u * 0.4, 0.8); } },
  // ——— Alors tout le monde m'appelle « toi ». Résultat : zéro euro. Depuis toujours.
  { w: "Alors tout le monde m'appelle", set: "VILLE", fr: "Des enfants le montrent du doigt : « toi »", g: DAY, cam: (_w, u) => C("VILLE", [0.6, 1.8, 3.4], [0.9, 1.75, 2.9], [2.6, 1.0, -2.6], null, 50, u),
    st: (w, u, t) => { put(w, "bart", "VILLE", 3.0, 0, -3.9, 0.6).pose(t, { expr: "sad" }); put(w, "k1", "VILLE", 1.0, 0, -1.6, 2.0).pose(t, { expr: "happy", point: 0.2, talk: true }); put(w, "k6", "VILLE", 4.9, 0, -1.4, -2.3).pose(t, { expr: "smile", point: 0.2 }); lab(w, "toi", B(w), cl(u * 1.4), 0.55, 0.7); } },
  { w: "Résultat", set: "VILLE", fr: "Il retourne ses poches vides : « 0 € »", g: DAY, cam: (_w, u) => C("VILLE", [4.4, 1.5, 0.6], [4.2, 1.45, 0.2], [3.0, 1.0, -3.9], null, 46, u),
    st: (w, u, t) => { put(w, "bart", "VILLE", 3.0, 0, -3.9, 0.35).pose(t, { expr: "sad", armL: -0.5, armR: -0.5 }); lab(w, "e0", B(w), cl(u * 1.6), 0.6, 0.7); } },
  // ——— Et puis, il y a Monsieur Lamonnaie. L'homme le plus riche de la ville.
  { w: "Et puis, il y a Monsieur", set: "PL", fr: "Le manoir blanc et or de Lamonnaie, sa grille dorée, la chorale devant", g: DAY, cam: (_w, u) => C("PL", [6, 5, 12], [3, 5.5, 10], [-20, 5, -2], null, 50, u),
    st: (w, _u, t) => { choirManor(w, t); lamoSteps(w, t, { armR: -0.4 }); } },
  { w: "L'homme le plus riche", set: "PL", fr: "Lamonnaie, chaîne en or, satisfait sur son perron", g: DAY, cam: (w, u) => CH("PL", w.actors.lamonnaie, [-17.2, 3.2, 1.8], [-17.6, 3.2, 1.4], 44, u),
    st: (w, _u, t) => { choirManor(w, t); lamoSteps(w, t, { headYaw: 0.25 }); lab(w, "lamo", w.actors.lamonnaie, 0.6, 0.6, 0.6); } },
  // ——— Il paie une chorale de deux cents personnes pour chanter son nom, jour et nuit, devant son manoir.
  { w: "Il paie une chorale", set: "PL", fr: "Travelling le long de la chorale en robes violettes", g: DAY, cam: (_w, u) => C("PL", [-19, 3.2, 10], [-19.5, 3.3, 7.5], [-12, 2.4, -2], [-12, 2.4, -5], 50, u),
    st: (w, _u, t) => { choirManor(w, t); lamoSteps(w, t); } },
  { w: "Lamonnaie Lamonnaie Lamonnaie", set: "PL", fr: "Les choristes chantent à pleine voix", g: DAY, cam: (_w, u) => C("PL", [-18.5, 2.6, -9], [-18.8, 2.7, -8.4], [-12, 2.6, -1], null, 46, u),
    st: (w, _u, t) => { choirManor(w, t); } },
  // ——— Plus personne ne dort dans le quartier.
  { w: "Plus personne ne dort", set: "VILLE", fr: "Nuit : les voisins en pyjama aux portes, épuisés", g: NIGHT, sky: "#2a3a6a", sunK: 0.25, cam: (_w, u) => C("VILLE", [-6, 1.8, 3.0], [-6.5, 1.75, 2.4], [-9, 1.4, -4], null, 48, u),
    st: (w, _u, t) => { put(w, "t1", "VILLE", -10.4, 0, -4.1, 0.35).pose(t, { expr: "sad", headPitch: 0.25 }); put(w, "maman", "VILLE", -7.4, 0, -4.0, -0.3).pose(t, { expr: "worried", cover: 0.5 }); w.fill.intensity = 5; w.fill.position.copy(at("VILLE", -8.5, 3.2, -2)); } },
  // ——— Un matin, j'ai eu une idée.
  { w: "Un matin", set: "VILLE", fr: "Le héros devant chez lui, l'idée lui vient", g: DAY, cam: (w, u) => CH("VILLE", B(w), [4.8, 1.6, -0.4], [4.6, 1.55, -0.8], 44, u),
    st: (w, u, t) => { put(w, "bart", "VILLE", 3.0, 0, -3.9, 0.4).pose(t, { expr: u > 0.4 ? "happy" : "focus", headPitch: -0.15, armR: u > 0.4 ? -2.6 : -0.2 }); lab(w, "idee", B(w), cl((u - 0.4) * 2), 0.4, 0.6); } },
  // ——— Je suis allé à la mairie, et j'ai changé de nom. Officiellement.
  { w: "Je suis allé à la mairie", set: "PL", fr: "Il monte les marches de la mairie à arcades", g: DAY, cam: (_w, u) => C("PL", [10, 2.2, -12], [9, 2.4, -13], [3, 2.0, -24.5], null, 50, u),
    st: (w, u, t) => { walk(w, "bart", "PL", 3.5, -16, 3.2, -23.8, u, t, { expr: "focus" }, 1.5); const b = B(w); b.root.position.y += cl((u - 0.75) * 4) * 0.6; } },
  { w: "et j'ai changé de nom", set: "MAI", fr: "Au guichet de l'état civil : l'employée tamponne le formulaire", g: IN, cam: (_w, u) => C("MAI", [3.2, 2.4, 2.8], [3.0, 2.35, 2.6], [0, 1.3, -0.5], null, 60, u),
    st: (w, u, t) => { put(w, "bart", "MAI", -0.3, 0, 0.35, Math.PI).pose(t, { expr: "focus", headPitch: 0.15 }); put(w, "employe", "MAI", 0.2, 0, -1.6, 0).pose(t, { expr: "neutral", armR: -1.2 - Math.max(0, Math.sin(u * 9)) * 0.4, headPitch: 0.3 });
      const s = MED(w).stamp; s.position.set(0.55, 1.3 - Math.max(0, Math.sin(u * 9)) * 0.1, -0.55); } },
  { w: "Officiellement", set: "MAI", fr: "Insert : « Nouveau nom : BONJOUR », tampon « validé »", g: IN, cam: (_w, u) => C("MAI", [0.3, 2.1, 0.35], [0.3, 2.0, 0.2], [0.3, 1.18, -0.5], null, 44, u),
    st: (w, _u, t) => { put(w, "employe", "MAI", 0.2, 0, -1.6, 0).pose(t, { expr: "smile", headPitch: 0.3 }); MED(w).stamp.position.set(0.8, 1.3, -0.75); } },
  // ——— Maintenant, je m'appelle Bonjour.
  { w: "Maintenant, je m'appelle Bonjour", set: "PL", fr: "Sur les marches de la mairie, fier : « BONJOUR » au-dessus de lui", g: DAY, cam: (_w, u) => C("PL", [6.2, 1.9, -17.5], [5.8, 1.9, -18.2], [3.2, 1.9, -23.6], null, 48, u),
    st: (w, u, t) => { const b = put(w, "bart", "PL", 3.2, 0.6, -24.1, 0.1); b.pose(t, { expr: "happy", armsUp: 0.8 * sm(u * 2) }); lab(w, "bonjour", b, cl(u * 1.6), 0.8, 0.8); } },
  // ——— Le lendemain, je suis sorti dans la rue.
  { w: "Le lendemain, je suis sorti", set: "VILLE", fr: "Il sort de chez lui, la rue est ensoleillée", g: DAY, cam: (_w, u) => C("VILLE", [-2.4, 2.4, 3.2], [-2.0, 2.3, 2.6], [3.0, 1.2, -3.4], [2.0, 1.1, -2.0], 50, u),
    st: (w, u, t) => { walk(w, "bart", "VILLE", 3.0, -4.3, 1.2, -1.6, u, t, { expr: "happy" }, 1.3); } },
  // ——— « Bonjour ! » a dit le boulanger. Un euro.
  { w: "Bonjour a dit le boulanger", set: "VILLE", fr: "Le boulanger le salue depuis sa porte : une pièce tombe", g: DAY, cam: (_w, u) => C("VILLE", [-8.2, 1.7, -2.2], [-8.6, 1.65, -1.6], [-10.2, 1.2, 4.0], null, 46, u),
    st: (w, u, t) => { put(w, "boulanger", "VILLE", -10.75, 0, 4.25, Math.PI + 0.4).pose(t, { expr: "happy", wave: "R", talk: u < 0.6 }); const b = put(w, "bart", "VILLE", -9.2, 0, 2.8, -0.8); b.pose(t, { expr: "happy", hold: 0.3 });
      coins(w, "V", t, [{ p: handOf(b, 0.85), n: 1, t0: t - u * 1.6 + 0.5, r: 0.01, dur: 0.01, stay: true, h: 2.6 }]); } },
  { w: "Un euro", set: "VILLE", fr: "La pièce dans sa main, « +1 € »", g: DAY, cam: (w, u) => CH("VILLE", B(w), [-6.6, 1.6, -0.4], [-6.9, 1.55, -0.1], 46, u, -0.4),
    st: (w, u, t) => { const b = put(w, "bart", "VILLE", -9.2, 0, 2.8, -0.8); b.pose(t, { expr: "happy", hold: 0.4, headPitch: 0.3 }); coins(w, "V", t, [{ p: handOf(b, 0.85), n: 1, t0: 0, r: 0.01, dur: 0.01, stay: true }]); lab(w, "e1", b, cl(u * 1.6), 0.6, 0.6); } },
  // ——— « Bonjour ! » a dit le chauffeur du bus. Un euro.
  { w: "Bonjour a dit le chauffeur", set: "VILLE", fr: "À l'arrêt, le chauffeur se penche par la porte du bus turquoise", g: DAY, cam: (_w, u) => C("VILLE", [7.5, 2.0, 4.4], [7.9, 1.95, 4.3], [14, 1.4, 3.4], null, 50, u),
    st: (w, u, t) => { const bs = MED(w).bus; bs.visible = true; bs.position.x = 17.6; put(w, "chauffeur", "VILLE", 14.0, 0.25, 3.05, 0).pose(t, { expr: "happy", wave: "R", talk: u < 0.6 }); const b = put(w, "bart", "VILLE", 14.0, 0, 3.95, Math.PI); b.pose(t, { expr: "happy", hold: 0.3 });
      coins(w, "V", t, [{ p: handOf(b, 0.85), n: 1, t0: t - u * 2.2 + 0.7, r: 0.01, dur: 0.01, stay: true, h: 2.6 }]); lab(w, "e1b", b, cl((u - 0.5) * 2), 0.6, 0.6); } },
  // ——— « Bonjour, bonjour, bonjour ! » a dit toute ma classe.
  { w: "Bonjour bonjour bonjour", set: "CL2", fr: "Toute la classe se lève pour le saluer : pluie de pièces", g: IN, cam: (_w, u) => C("CL2", [3.6, 2.85, 3.2], [3.4, 2.8, 2.9], [-0.6, 1.0, -1.8], null, 56, u),
    st: (w, u, t) => { seated(w, t, "happy", ["k7", "k6"], true); const b = put(w, "bart", "CL2", -0.6, 0, -2.0, 0.4); b.pose(t, { expr: "happy", armsUp: 0.6 }); put(w, "prof", "CL2", 1.6, 0, -3.0, -0.3).pose(t, { expr: "happy", wave: "R" });
      coins(w, "C", t, [{ p: at("CL2", -0.6, 0.02, -2.0), n: 70, t0: t - u * 2.6, r: 0.6, dur: 2.6, stay: true, h: 2.6 }]); } },
  // ——— À midi, mes poches débordaient.
  { w: "À midi", set: "VILLE", fr: "Il marche, les pièces débordent de ses poches et roulent derrière lui", g: DAY, cam: (_w, u) => C("VILLE", [-4, 1.5, 3.4], [-3, 1.5, 3.0], [-1, 0.8, 0.2], [1, 0.8, 0.2], 48, u),
    st: (w, u, t) => { const b = walk(w, "bart", "VILLE", -3, 0.2, 3, 0.2, u, t, { expr: "happy", hold: 0.2 }, 1.0); const srcs: CoinSrc[] = []; for (let i = 0; i < 8; i++) srcs.push({ p: at("VILLE", -3 + 6 * (i / 8), 0.0, 0.2), n: 3, t0: TW("À midi") + (i / 8) * 2.0, r: 0.4, dur: 0.3, stay: true, h: 0.9 }); coins(w, "V", t, srcs); void b; } },
  // ——— Le soir, j'étais plus riche que Monsieur Lamonnaie.
  { w: "Le soir", set: "VILLE", fr: "Soir doré : debout sur une montagne de pièces devant sa maison", g: EVE, sky: "#ffc8a0", sunK: 0.8, cam: (_w, u) => C("VILLE", [6.5, 1.6, 4.0], [6.0, 1.9, 3.4], [3.0, 1.9, -1.8], null, 50, u),
    st: (w, _u, t) => { put(w, "bart", "VILLE", 3.0, 1.15, -1.8, 0.3).pose(t, { expr: "happy", cheer: true }); coins(w, "V", t, [], { p: at("VILLE", 3.0, 0, -1.8), n: 520, r: 1.9, h: 1.2 }); } },
  // ——— Il n'a pas aimé ça du tout.
  { w: "Il n'a pas aimé", set: "PL", fr: "Lamonnaie, furieux, sur son perron au coucher du soleil", g: EVE, sky: "#ffc8a0", sunK: 0.8, cam: (w, u) => CH("PL", w.actors.lamonnaie, [-16.6, 3.0, 2.4], [-17.0, 3.0, 2.0], 44, u),
    st: (w, _u, t) => { choirManor(w, t); lamoSteps(w, t, { expr: "angry", bang: true }); } },
  // ——— Il a payé le maire, et le lendemain, une affiche était collée sur tous les murs.
  { w: "Il a payé le maire", set: "PL", fr: "Devant la mairie, Lamonnaie verse des pièces dans les mains du maire", g: EVE, sky: "#ffc8a0", sunK: 0.8, cam: (_w, u) => C("PL", [-1, 1.8, -17.5], [-0.6, 1.8, -18], [1.8, 1.3, -23.2], null, 46, u),
    st: (w, u, t) => { put(w, "lamonnaie", "PL", 1.0, 0, -22.4, 0.9).pose(t, { expr: "smug", reach: 0.7 }); const m = put(w, "maire2", "PL", 2.7, 0.3, -23.0, -1.9); m.pose(t, { expr: "smile", hold: 0.5 }); coins(w, "P", t, [{ p: handOf(m, 0.8), n: 25, t0: t - u * 1.5, r: 0.15, dur: 1.5, h: 0.5 }]); } },
  { w: "et le lendemain, une affiche", set: "VILLE", fr: "Travelling le long des façades : la même affiche rouge partout", g: DAY, cam: (_w, u) => C("VILLE", [-8, 2.0, -2.5], [8, 2.0, -2.5], [-4, 2.0, 5], [12, 2.0, 5], 50, u),
    st: (w) => { for (const p of MED(w).posters) p.visible = true; } },
  // ——— « Il est interdit de dire bonjour. »
  { w: "Il est interdit", set: "VILLE", fr: "L'affiche : « Il est interdit de dire bonjour — Le Maire »", g: DAY, cam: (_w, u) => C("VILLE", [5, 1.85, 0.6], [5, 1.88, 1.2], [5, 1.9, 4.96], null, 44, u),
    st: (w) => { for (const p of MED(w).posters) p.visible = true; } },
  // ——— Alors les gens ont arrêté de se saluer. Plus personne ne se regardait. La ville est devenue froide et silencieuse.
  { w: "Alors les gens ont arrêté", set: "VILLE", fr: "La rue devient grise : les passants se croisent tête basse", g: COLD, cam: (_w, u) => C("VILLE", [-12, 2.2, 3.4], [-10, 2.2, 3.0], [-2, 1.2, -1], null, 48, u),
    st: (w, u, t) => { for (const p of MED(w).posters) p.visible = true; walk(w, "t1", "VILLE", -9, -1.4, 2, -1.2, u * 0.6, t, { expr: "sad", headPitch: 0.4 }); walk(w, "t3", "VILLE", 1, 1.2, -9, 1.4, u * 0.6, t, { expr: "sad", headPitch: 0.4 }); walk(w, "bart", "VILLE", -5, 0.2, -1, 0.0, u * 0.5, t, { expr: "sad", headPitch: 0.3 }, 0.9); } },
  { w: "Plus personne ne se regardait", set: "VILLE", fr: "Deux voisins se croisent en détournant le regard", g: COLD, cam: (_w, u) => C("VILLE", [10.2, 1.8, 3.9], [9.8, 1.75, 3.6], [10, 1.2, -1.8], null, 46, u),
    st: (w, u, t) => { for (const p of MED(w).posters) p.visible = true; walk(w, "maman", "VILLE", 7.6, -1.2, 12, -1.2, 0.2 + u * 0.4, t, { expr: "sad", headYaw: 0.7 }); walk(w, "boulanger", "VILLE", 12.4, -2.4, 8, -2.4, 0.2 + u * 0.4, t, { expr: "neutral", headYaw: -0.7 }); } },
  { w: "La ville est devenue froide", set: "VILLE", fr: "Plan large : la rue vide et grise, les affiches", g: COLD, cam: (_w, u) => C("VILLE", [-20, 6, 4], [-22, 7, 4.5], [8, 1.5, -1], null, 48, u),
    st: (w) => { for (const p of MED(w).posters) p.visible = true; } },
  // ——— Il ne restait plus que la chorale. « Lamonnaie, Lamonnaie… »
  { w: "Il ne restait plus", set: "PL", fr: "Place grise et vide : seule la chorale chante devant le manoir", g: COLD, cam: (_w, u) => C("PL", [12, 7, 20], [8, 7.5, 18], [-12, 2, -2], null, 50, u),
    st: (w, _u, t) => { choirManor(w, t); for (const p of MED(w).posters) p.visible = true; } },
  { w: "Lamonnaie Lamonnaie", set: "PL", fr: "Lamonnaie sourit, satisfait, devant sa chorale", g: COLD, cam: (w, u) => CH("PL", w.actors.lamonnaie, [-17.0, 3.2, -5.6], [-17.4, 3.2, -5.2], 46, u),
    st: (w, _u, t) => { choirManor(w, t); lamoSteps(w, t, { expr: "smug", headYaw: -0.3 }); } },
  // ——— Alors j'ai pris tout mon argent. Et j'ai racheté le contrat de la chorale.
  { w: "Alors j'ai pris tout mon argent", set: "VILLE", fr: "Le héros remplit un grand sac de pièces", g: COLD, cam: (_w, u) => C("VILLE", [6.2, 1.8, 2.8], [5.8, 1.75, 2.4], [3.0, 1.0, -1.8], null, 48, u),
    st: (w, u, t) => { put(w, "bart", "VILLE", 3.0, 0, -0.4, Math.PI - 0.3).pose(t, { expr: "focus", reach: 0.8, lean: 0.25 }); coins(w, "V", t, [], { p: at("VILLE", 3.0, 0, -1.8), n: Math.round(520 * (1 - 0.6 * u)), r: 1.9, h: 1.2 * (1 - 0.5 * u) }); } },
  { w: "Et j'ai racheté", set: "PL", fr: "Devant la chorale, il tend le sac au chef de chœur", g: COLD, cam: (_w, u) => C("PL", [-2.2, 2.0, 6.0], [-2.6, 2.0, 5.4], [-5.0, 1.3, 0.6], null, 46, u),
    st: (w, u, t) => { choirManor(w, t); put(w, "bart", "PL", -3.6, 0, 1.6, -2.3).pose(t, { expr: "focus", reach: 0.8 }); put(w, "t3", "PL", -5.0, 0, 0.4, 0.9).pose(t, { expr: u > 0.5 ? "happy" : "neutral", hold: 0.5 }); coins(w, "P", t, [{ p: at("PL", -4.3, 1.0, 1.0), n: 30, t0: t - u * 1.6, r: 0.25, dur: 1.6, h: 0.4 }]); } },
  // ——— Le lendemain matin, les deux cents chanteurs étaient sur la grande place. Et ils ont commencé à chanter.
  { w: "Le lendemain matin", set: "PL", fr: "Matin : la chorale installée sur des gradins au centre de la place", g: DAY, cam: (_w, u) => C("PL", [14, 9, 20], [10, 8, 18], [0, 2, -16], null, 48, u),
    st: (w, _u, t) => { choirSquare(w, t); for (const p of MED(w).posters) p.visible = true; } },
  { w: "Et ils ont commencé", set: "PL", fr: "Face à la chorale qui entonne", g: DAY, cam: (_w, u) => C("PL", [2, 2.4, -6], [1.6, 2.6, -6.8], [0, 2.6, -17], null, 52, u),
    st: (w, _u, t) => { choirSquare(w, t); } },
  // ——— Pas « Lamonnaie ». Le prénom de chaque habitant. Un par un.
  { w: "Pas Lamonnaie", set: "PL", fr: "Sur son perron, Lamonnaie se fige", g: DAY, cam: (w, u) => CH("PL", w.actors.lamonnaie, [-16.6, 3.0, 2.2], [-17.0, 3.0, 1.8], 44, u),
    st: (w, _u, t) => { choirSquare(w, t); lamoSteps(w, t, { expr: "scared", headYaw: 0.4 }); } },
  { w: "Le prénom de chaque habitant", set: "PL", fr: "Les habitants arrivent sur la place, les pièces commencent à tomber", g: DAY, cam: (_w, u) => C("PL", [16, 5, 10], [14, 6, 8], [0, 1.5, -6], null, 52, u),
    st: (w, u, t) => { choirSquare(w, t); MED(w).crowd.root.visible = true; MED(w).crowd.jump(t, 0.2, V(0, 2, -16)); const srcs: CoinSrc[] = []; for (let i = 0; i < 10; i++) srcs.push({ p: at("PL", -10 + (i * 3.3) % 32, 1.6, -4 + (i * 7.1) % 30), n: 6, t0: t - 1.5 + i * 0.12, r: 0.25, dur: 2 }); coins(w, "P", t, srcs); void u; } },
  // ——— « Pardon. Lucas. Fatou. Madame Petit… »
  { w: "Pardon", set: "PL", fr: "« Pardon » : une pièce pour la fillette sur son poney", g: DAY, cam: (_w, u) => C("PL", [5.4, 1.4, -11.2], [5.6, 1.4, -10.8], [3.2, 1.2, -7.6], null, 46, u),
    st: (w, u, t) => { choirSquare(w, t); MED(w).crowd.root.visible = true; MED(w).crowd.jump(t, 0, V(0, 2, -16)); const p = put(w, "pardon", "PL", 3.2, 0, -7.6, Math.PI); p.pose(t, { expr: "happy", hold: 0.5 }); put(w, "maman", "PL", 1.8, 0, -7.7, Math.PI + 0.4).pose(t, { expr: "happy" });
      coins(w, "P", t, [{ p: handOf(p, 0.85), n: 1, t0: t - u * 0.9 + 0.1, r: 0.01, dur: 0.01, h: 2.5, stay: true }]); } },
  { w: "Lucas", set: "PL", fr: "« Lucas » : un garçon attrape sa pièce", g: DAY, cam: (_w, u) => C("PL", [9.4, 1.5, -11.0], [9.2, 1.5, -10.6], [8.0, 1.2, -7.6], null, 46, u),
    st: (w, u, t) => { choirSquare(w, t); MED(w).crowd.root.visible = true; MED(w).crowd.jump(t, 0, V(0, 2, -16)); const k = put(w, "k1", "PL", 8.0, 0, -7.6, Math.PI + 0.3); k.pose(t, { expr: "happy", hold: 0.5 }); coins(w, "P", t, [{ p: handOf(k, 0.85), n: 1, t0: t - u * 0.8, r: 0.01, dur: 0.01, h: 2.5, stay: true }]); } },
  { w: "Fatou", set: "PL", fr: "« Fatou » : une fillette rit", g: DAY, cam: (_w, u) => C("PL", [-3.6, 1.5, -11.0], [-3.4, 1.5, -10.6], [-2.4, 1.2, -7.6], null, 46, u),
    st: (w, u, t) => { choirSquare(w, t); MED(w).crowd.root.visible = true; MED(w).crowd.jump(t, 0, V(0, 2, -16)); const k = put(w, "k3", "PL", -2.4, 0, -7.6, Math.PI - 0.3); k.pose(t, { expr: "happy", hold: 0.5 }); coins(w, "P", t, [{ p: handOf(k, 0.85), n: 1, t0: t - u * 0.8, r: 0.01, dur: 0.01, h: 2.5, stay: true }]); } },
  { w: "Madame Petit", set: "PL", fr: "« Madame Petit » : une dame porte la main à son cœur", g: DAY, cam: (_w, u) => C("PL", [13.2, 1.8, -11.4], [13.0, 1.8, -11.0], [12.0, 1.5, -7.7], null, 46, u),
    st: (w, u, t) => { choirSquare(w, t); MED(w).crowd.root.visible = true; MED(w).crowd.jump(t, 0, V(0, 2, -16)); const k = put(w, "t2", "PL", 12.0, 0, -7.7, Math.PI); k.pose(t, { expr: "happy", hold: 0.6 }); coins(w, "P", t, [{ p: handOf(k, 0.8), n: 1, t0: t - u * 1.0, r: 0.01, dur: 0.01, h: 2.5, stay: true }]); } },
  // ——— Toute la journée, les pièces sont tombées sur la ville entière.
  { w: "Toute la journée", set: "PL", fr: "Grue : pluie de pièces sur toute la place en fête", g: DAY, cam: (_w, u) => C("PL", [-8, 6, 30], [-4, 14, 36], [2, 2, 2], [2, 0, -2], 50, u),
    st: (w, _u, t) => { choirSquare(w, t); MED(w).crowd.root.visible = true; MED(w).crowd.jump(t, 0.8); const srcs: CoinSrc[] = []; for (let i = 0; i < 24; i++) srcs.push({ p: at("PL", -10 + (i * 5.3) % 33, 1.6, -5 + (i * 7.7) % 38), n: 14, t0: t - 1.6 + (i % 5) * 0.2, r: 0.6, dur: 2.4, h: 5 }); coins(w, "P", t, srcs); } },
  // ——— Les gens sont sortis, ils se sont regardés, et ils ont souri.
  { w: "Les gens sont sortis", set: "VILLE", fr: "Dans la rue redevenue colorée, les voisins se saluent en souriant", g: DAY, cam: (_w, u) => C("VILLE", [4.5, 2.0, 3.8], [4.8, 2.0, 3.6], [10, 1.2, -1.6], null, 50, u),
    st: (w, u, t) => { for (const p of MED(w).posters) p.visible = true; put(w, "maman", "VILLE", 8.0, 0, -2.4, 1.2).pose(t, { expr: "happy", wave: "R" }); put(w, "boulanger", "VILLE", 10.2, 0, -2.0, -1.9).pose(t, { expr: "happy", wave: "L", talk: u < 0.5 }); put(w, "t1", "VILLE", 12.0, 0, -0.6, -2.4).pose(t, { expr: "smile" }); } },
  // ——— Et l'affiche a été arrachée.
  { w: "Et l'affiche a été arrachée", set: "VILLE", fr: "Le héros arrache l'affiche, qui tombe", g: DAY, cam: (_w, u) => C("VILLE", [2.4, 1.9, 1.6], [2.6, 1.9, 1.9], [5.4, 1.5, 4.4], null, 46, u),
    st: (w, u, t) => { const ps = MED(w).posters; for (const p of ps) p.visible = true; const pp = ps[1], k = sm(cl((u - 0.3) * 2.5)); pp.position.set(5 + k * 0.3, 1.9 - k * 1.85, 4.96 - k * 0.6); pp.rotation.set(-k * 1.5, Math.PI, k * 0.6);
      put(w, "bart", "VILLE", 6.0, 0, 4.0, -0.5).pose(t, { expr: "happy", armR: -2.2 + k * 1.6, reach: k < 0.2 ? 0.9 : undefined }); } },
  // ——— Monsieur Lamonnaie, lui, plus personne ne chantait son nom.
  { w: "Monsieur Lamonnaie, lui", set: "PL", fr: "Seul sur son perron vide, Lamonnaie a perdu sa chorale", g: DAY, cam: (_w, u) => C("PL", [-8, 3, 8], [-9, 3.2, 6], [-22, 2.6, -2], null, 46, u),
    st: (w, _u, t) => { choirSquare(w, t); MED(w).choirSteps[0].visible = true; lamoSteps(w, t, { expr: "sad", headPitch: 0.3 }); } },
  // ——— Alors il est allé à la mairie, lui aussi, et il a changé de nom.
  { w: "Alors il est allé à la mairie", set: "MAI", fr: "Lamonnaie au guichet, l'employée tamponne", g: IN, cam: (_w, u) => C("MAI", [-3.2, 2.4, 2.8], [-3.0, 2.35, 2.6], [0, 1.3, -0.5], null, 60, u),
    st: (w, u, t) => { put(w, "lamonnaie", "MAI", 0.2, 0, 0.4, Math.PI).pose(t, { expr: "worried", headPitch: 0.1 }); put(w, "employe", "MAI", 0.2, 0, -1.6, 0).pose(t, { expr: "smile", armR: -1.2 - Math.max(0, Math.sin(u * 9)) * 0.4, headPitch: 0.25 }); MED(w).stamp.position.set(0.55, 1.3 - Math.max(0, Math.sin(u * 9)) * 0.1, -0.55); } },
  // ——— Maintenant, il s'appelle Merci.
  { w: "Maintenant, il s'appelle Merci", set: "PL", fr: "Sur les marches de la mairie : « MERCI » au-dessus de Lamonnaie", g: DAY, cam: (_w, u) => C("PL", [7.0, 2.2, -17.0], [6.6, 2.2, -17.6], [3.4, 2.1, -23.6], null, 48, u),
    st: (w, u, t) => { const a = put(w, "lamonnaie", "PL", 3.4, 0.6, -24.1, 0.15); a.pose(t, { expr: "smug", armR: -1.0 }); lab(w, "merci", a, cl(u * 1.6), 0.8, 0.8); } },
  // ——— Et c'est de nouveau l'homme le plus riche de la ville.
  { w: "Et c'est de nouveau", set: "VILLE", fr: "Dans la rue, tout le monde se dit merci : les pièces pleuvent sur Lamonnaie", g: DAY, cam: (_w, u) => C("VILLE", [-6, 2.0, 3.4], [-5.4, 2.0, 2.9], [-9.5, 1.3, -1.0], null, 48, u),
    st: (w, u, t) => { const a = put(w, "lamonnaie", "VILLE", -9.5, 0, -1.0, 0.5); a.pose(t, { expr: "happy", hold: 0.5 }); put(w, "t2", "VILLE", -12.0, 0, 0.4, 2.0).pose(t, { expr: "happy", talk: true }); put(w, "t1", "VILLE", -7.4, 0, -2.4, -1.2).pose(t, { expr: "happy", talk: true });
      coins(w, "V", t, [{ p: at("VILLE", -9.5, 0.02, -1.0), n: 120, t0: t - u * 2.4, r: 0.8, dur: 2.4, stay: true, h: 3.5 }]); } },
  // ——— Mais au moins, tout le monde est devenu poli.
  { w: "Mais au moins", set: "PL", fr: "Final : la place en fête, tout le monde se salue ; la caméra s'élève", g: DAY, cam: (_w, u) => C("PL", [6, 2.4, 2], [10, 16, 24], [2, 1.5, -6], [0, 0, -4], 48, u, 52),
    st: (w, _u, t) => { choirSquare(w, t); MED(w).crowd.root.visible = true; MED(w).crowd.jump(t, 0.3); put(w, "bart", "PL", 2.0, 0, -8.6, 0.4).pose(t, { expr: "happy", wave: "R" }); put(w, "pardon", "PL", 3.4, 0, -8.4, -0.3).pose(t, { expr: "happy", wave: "L" }); put(w, "maman", "PL", 0.4, 0, -8.6, 0.3).pose(t, { expr: "happy" }); } },
];

export const SHOT_START = (() => { let from = 0; return SHOTS.map((s) => { const i = find(s.w, from); from = i + 1; return i; }); })();
export const START = SHOT_START.map((wi, i) => (i === 0 ? 0 : Math.round((W[wi].s + (SHOTS[i].dt ?? 0)) * FPS) - 2));
export const shotAt = (f: number) => { let i = 0; while (i + 1 < START.length && START[i + 1] <= f) i++; return i; };
export const uOf = (i: number, f: number) => { const a = START[i], b = i + 1 < START.length ? START[i + 1] : TOTAL; return Math.min(1, Math.max(0, (f - a) / Math.max(1, b - a - 1))); };

const DEF: Grade = { sat: 0.45, con: 0.06, bri: 0, bloom: 0.9, bg: "#000", fog: "#000", fogD: 0, env: 0.5, snow: false };
export const gradeOf = (i: number): Grade => ({ ...DEF, ...(SHOTS[i].g ?? {}) });

export const applyShot = (w: World, i: number, u: number, t: number, _cam: THREE.Camera) => {
  const s = SHOTS[i], S = w.sets, m = S.med; S.show(s.set);
  for (const a of Object.values(w.actors)) { a.root.visible = false; a.root.position.y = 0; }
  for (const x of Object.values(S.tags)) x.visible = false; for (const x of S.rain) x.visible = false; for (const x of Object.values(m.labels)) x.visible = false;
  for (const p of m.posters) p.visible = false; m.posters[1].position.set(5, 1.9, 4.96); m.posters[1].rotation.set(0, Math.PI, 0);
  m.choir.root.visible = false; m.choirSteps[0].visible = true; m.choirSteps[1].visible = false; m.crowd.root.visible = false; m.pony.visible = false; m.bus.visible = false;
  m.coinsV.set(t, []); m.coinsP.set(t, []); m.coinsC.set(t, []); m.stamp.position.set(0.7, 1.3, -0.6);
  for (const k of m.skies) k.color.set(s.sky ?? "#ffffff"); for (const [l, base] of m.suns) l.intensity = base * (s.sunK ?? 1);
  w.fill.intensity = 0; w.key.intensity = 0;
  s.st?.(w, u, t);
  if (m.crowd.root.visible) m.choirSteps[0].visible = false;
  return s;
};
