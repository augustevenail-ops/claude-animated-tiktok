// Les Dessins ép. 1 : les plans calés sur la voix (words.json) — chaque plan commence sur un fragment de phrase.
import * as THREE from "three";
import WORDS from "./words.json";
import { Actor, CAST, Expr, Pose } from "./chars";
import { Sets, O, V, SetK } from "./sets";
import { Drawn, Page, circ, poly } from "./magic";

export const FPS = 30;
const W = WORDS as { w: string; s: number; e: number }[];
const LAST = W.filter((w) => /[a-zà-ÿ]/i.test(w.w)).pop()!;
export const TOTAL = Math.round((LAST.e + 1.6) * FPS);
const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9' ]/g, "").replace(/’/g, "'").trim();
const WN = W.map((w) => norm(w.w));
/** index du premier mot de « frag » à partir de from */
const find = (frag: string, from: number) => { const f = norm(frag).split(/\s+/); for (let i = from; i < WN.length; i++) if (f.every((x, k) => WN[i + k] === x)) return i; throw new Error("fragment introuvable : " + frag); };

// ---------------- aides
const sm = (x: number) => { const t = Math.min(1, Math.max(0, x)); return t * t * t * (t * (t * 6 - 15) + 10); };
const gl = (x: number) => { const t = Math.min(1, Math.max(0, x)); return 0.45 * t + 0.55 * sm(t); };
const cl = (x: number) => Math.min(1, Math.max(0, x));
const L = (a: THREE.Vector3, b: THREE.Vector3, u: number) => a.clone().lerp(b, u);
type Cam = { P: THREE.Vector3; T: THREE.Vector3; fov: number };
const G = (P0: THREE.Vector3, P1: THREE.Vector3, T0: THREE.Vector3, T1: THREE.Vector3, fov: number, u: number, f1 = fov): Cam => { const e = gl(u); return { P: L(P0, P1, e), T: L(T0, T1, e), fov: fov + (f1 - fov) * e }; };
const at = (k: SetK, x: number, y: number, z: number) => O[k].clone().add(V(x, y, z));
const headOf = (a: Actor) => { a.root.updateMatrixWorld(true); return a.neck.localToWorld(V(0, 0.7, 0)); };
/** caméra face à un personnage : d = distance, side = décalage latéral, dy = hauteur relative (recul généreux) */
const faceCam = (a: Actor, d0: number, side: number, dy: number, u: number, push = 0.15, fov = 36, ty = -0.12): Cam => {
  const d = d0 * 2.2, h = headOf(a), y = a.root.rotation.y, f = V(Math.sin(y), 0, Math.cos(y)), r = V(Math.cos(y), 0, -Math.sin(y));
  const P0 = h.clone().addScaledVector(f, d).addScaledVector(r, side).add(V(0, dy, 0)), P1 = h.clone().addScaledVector(f, d - push).addScaledVector(r, side * 0.9).add(V(0, dy, 0));
  return G(P0, P1, h.clone().add(V(0, ty, 0)), h.clone().add(V(0, ty, 0)), Math.max(fov, 42), u); };
/** caméra tournée autour de la tête : ang = angle depuis l'axe du regard (rad) */
const sideCam = (a: Actor, ang: number, d0: number, dy: number, u: number, push = 0.12, fov = 36, ty = -0.1): Cam => { const d = d0 * 2.2, h = headOf(a), y = a.root.rotation.y + ang, f = V(Math.sin(y), 0, Math.cos(y));
  return G(h.clone().addScaledVector(f, d).add(V(0, dy, 0)), h.clone().addScaledVector(f, d - push).add(V(0, dy, 0)), h.clone().add(V(0, ty, 0)), h.clone().add(V(0, ty, 0)), Math.max(fov, 42), u); };
const place = (a: Actor, k: SetK, x: number, y: number, z: number, yaw: number) => { a.root.visible = true; a.root.position.copy(at(k, x, y, z)); a.root.rotation.set(0, yaw, 0); };
const SIT = 0.4;
const drawing = (t: number, e: Expr = "focus", extra: Pose = {}): Pose => ({ expr: e, armR: -1.0 + Math.sin(t * 13) * 0.1, armL: -0.75, headPitch: 0.42, ...extra });
const walkTo = (a: Actor, k: SetK, x0: number, z0: number, x1: number, z1: number, u: number, t: number, sp = 1.4, extra: Pose = {}) => {
  place(a, k, x0 + (x1 - x0) * u, 0, z0 + (z1 - z0) * u, Math.atan2(x1 - x0, z1 - z0)); a.pose(t, { walk: sp, ...extra }); };

export type World = { sets: Sets; actors: Record<string, Actor>; scene?: THREE.Scene; fill: THREE.PointLight; key: THREE.SpotLight; girlD?: Drawn };
export type Grade = { sat: number; con: number; bri: number; bloom: number; bg: string; fog: string; fogD: number; env: number; snow: boolean };
type Shot = { set: SetK; w: string; cam: (w: World, u: number, t: number) => Cam; st?: (w: World, u: number, t: number) => void; g?: Partial<Grade>; fr: string };

// ---------------- distribution
export const buildCast = (root: THREE.Object3D) => {
  const mk = (k: string, seed: number) => { const a = new Actor(CAST[k], 0.36, seed); root.add(a.root); a.root.visible = false; return a; };
  const ks = ["hero", "ami", "jaden", "k1", "k2", "k3", "k4", "k5", "k6", "k7", "k8", "prof", "girl", "boy", "t1", "t2", "t3"];
  const actors: Record<string, Actor> = Object.fromEntries(ks.map((k, i) => [k, mk(k, i + 1)]));
  for (const k of ["hero", "ami", "jaden", "k1", "k2", "k5"]) actors[k].addPencil();
  return { actors };
};

// ---------------- ambiances
const DAY: Partial<Grade> = { bg: "#8cc4f2", fog: "#a8cdf0", fogD: 0.0022, sat: 0.58, con: 0.17, bri: -0.035, bloom: 0.95, env: 0.4 };
const IN: Partial<Grade> = { bg: "#000", fog: "#000", fogD: 0, sat: 0.55, con: 0.16, bri: -0.035, bloom: 0.95, env: 0.45 };
const HALLG: Partial<Grade> = { ...IN, sat: 0.5, con: 0.17 };
const EMPTY: Partial<Grade> = { bg: "#b8bcc4", fog: "#c4c8d0", fogD: 0.007, sat: -0.12, con: 0.18, bri: -0.03, bloom: 0.8, env: 0.35 };
const OTHG: Partial<Grade> = { bg: "#d8d0c2", fog: "#d4ccbe", fogD: 0.004, sat: 0.45, con: 0.2, bri: -0.06, bloom: 0.6, env: 0.35 };

// ---------------- mises en place récurrentes
const HB = (w: World) => w.actors.hero;
const bookInHand = (a: Actor, book: THREE.Object3D, tilt = 0.9, sit = false) => { const y = a.root.rotation.y, f = V(Math.sin(y), 0, Math.cos(y)), h = (a.s.kid ? 0.82 : 1.1) - (sit ? 0.36 : 0);
  book.visible = true; book.position.copy(a.root.position).addScaledVector(f, 0.32).add(V(0, h, 0)); book.parent!.worldToLocal(book.position); book.rotation.set(0, 0, 0); book.rotateY(y + Math.PI); book.rotateX(tilt); };
const townCrowd = (w: World, t: number, on = true, clear = false) => { const ps: [string, number, number, number, number][] = [["t1", -14, -2.4, 1, 0.0], ["t2", 9, 6.4, -1, 0.3], ["t3", -4, 6.6, -1, 0.6], ["k3", 14, -2.5, -1, 0.2], ["k4", -8, -2.2, 1, 0.8], ["k6", 2.5, 6.2, 1, 0.5]];
  for (const [k, x, z, dir, ph] of ps) { const a = w.actors[k]; if (!on) { a.root.visible = false; continue; } const xx = x + dir * ((t * 1.1 + ph * 6) % 12); if (clear && Math.abs(xx - 1) < 5.5) { a.root.visible = false; continue; } place(a, "TOWN", xx, 0, z, dir > 0 ? Math.PI / 2 : -Math.PI / 2); a.pose(t, { walk: 1.2, expr: "smile" }); } };
/** gros plan sur le carnet tenu : au-dessus de l'épaule droite du personnage */
const bookCam = (a: Actor, book: THREE.Object3D, u: number, side = 0.22, fov = 34): Cam => { const b = book.getWorldPosition(V(0, 0, 0)), y = a.root.rotation.y, f = V(Math.sin(y), 0, Math.cos(y)), r = V(-Math.cos(y), 0, Math.sin(y));
  return G(b.clone().addScaledVector(f, 0.15).addScaledVector(r, side * 2.6).add(V(0, 0.75, 0)), b.clone().addScaledVector(f, 0.12).addScaledVector(r, side * 2.3).add(V(0, 0.68, 0)), b.clone().add(V(0, 0.1, 0)), b.clone().add(V(0, 0.1, 0)), fov + 8, u); };
const pcSet = (w: World, p: number, t: number) => w.sets.pc.set(p, t, 0.1);
const heroDeskBed = (w: World, t: number, e: Expr = "focus", draw = true) => { place(HB(w), "BED", 1.48, SIT, -1.4, Math.PI / 2); HB(w).pose(t, draw ? drawing(t, e, { sit: true }) : { sit: true, expr: e, headYaw: -0.5 }); };
const heroGamer = (w: World, t: number, e: Expr, type = 0) => { place(HB(w), "BED", 0.1, 0.42, 1.25, Math.PI); HB(w).pose(t, { sit: true, expr: e, armL: -1.25 + Math.sin(t * 16) * 0.06 * type, armR: -1.25 + Math.sin(t * 15 + 1) * 0.06 * type, headPitch: 0.3 }); };
const amiDesk = (w: World, t: number, e: Expr = "focus", draw = true) => { place(w.actors.ami, "FRD", 0, SIT, -1.32, 0); w.actors.ami.pose(t, draw ? drawing(t, e, { sit: true }) : { sit: true, expr: e, armL: -1.3, armR: -1.3, headPitch: 0.25 }); };
const classKids = (w: World, t: number, e: Expr = "focus", look = 0, prof = true) => { const seats: [string, number, number][] = [["k1", -2.6, -0.6], ["k3", -2.6, 0.75], ["k4", -1.1, -0.6], ["k2", -1.1, 0.75], ["k5", 0.4, 0.75], ["k6", -2.6, 2.1], ["hero", 0.4, 2.1], ["ami", -1.1, 2.1], ["jaden", 0.4, -0.6]];
  if (prof) { place(w.actors.prof, "CLS", -1.4, 0, -3.15, 0.25); w.actors.prof.pose(t, look ? { expr: e === "focus" ? "smile" : e, headYaw: look * 0.5 } : { expr: "smile", armR: -2.3 + Math.sin(t * 3) * 0.15, talk: true, headYaw: 0.4 }); }
  for (const [k, x, z] of seats) { place(w.actors[k], "CLS", x, SIT, z + 0.5, Math.PI); w.actors[k].pose(t, look ? { sit: true, expr: e, headYaw: look, headPitch: 0 } : drawing(t + x, e, { sit: true })); } };
const hallKids = (w: World, t: number, z: number, e: Expr, run = 0, cheer = false) => { const ks: [string, number, number][] = [["hero", 0.2, 0], ["ami", -0.7, 0.5], ["jaden", 0.9, 0.6], ["k1", -0.2, 1.3], ["k2", 0.6, 1.5], ["k3", -1.1, 1.6], ["k4", 1.2, 1.9], ["k5", -0.5, 2.3], ["k6", 0.3, 2.6], ["k7", -1.0, 3.0], ["k8", 1.0, 3.2]];
  for (const [k, x, dz] of ks) { const a = w.actors[k]; place(a, "HALL", x, 0, z + dz + (run ? -run * 2 : 0), Math.PI); a.pose(t + x, cheer ? { cheer: true, expr: "happy" } : run ? { walk: 2.2, expr: e } : { expr: e, headPitch: -0.08 }); } };
const eraserAt = (w: World, z: number, t: number, cover = 0, stop = 0) => { const e = w.sets.eraser; e.root.visible = true; e.root.position.set(0, 1.25, z); e.set(t, cover, stop);
  // tout ce qui est dessiné et que la gomme a dépassé s'efface ; zone blanche derrière
  const front = z + 2.3, back = z - 2.3, endZ = -41.9;
  w.sets.lockers.forEach((d, i) => d.set(1 - cl((front - w.sets.lockerZ[i] + 1.2) / 2.4), t, 0.08)); w.sets.hallDesks.forEach((d, i) => d.set(1 - cl((front - w.sets.hallDeskZ[i] + 0.6) / 1.4), t, 0.08));
  const len = Math.max(0.01, back - endZ), mid = (back + endZ) / 2; w.sets.erased.forEach((m, k) => { m.visible = back > endZ + 0.05 && cover < 2; m.position.z = mid; if (k < 2) m.scale.y = len; else m.scale.x = len; });
  w.sets.crumbs.set(t, V(0, 0.2, back), 3.0, 1.0, 1.6); w.sets.crumbs.pts.visible = stop < 0.5; };
const hallReset = (w: World, t: number) => { for (const d of w.sets.lockers) d.set(1, t); for (const d of w.sets.hallDesks) d.set(1, t); for (const m of w.sets.erased) m.visible = false; w.sets.eraser.root.visible = false; w.sets.crumbs.pts.visible = false; };
const girlAt = (w: World, k: SetK, x: number, z: number, yaw: number, t: number, e: Expr, p = 1, extra: Pose = {}) => { const g = w.actors.girl; place(g, k, x, 0, z, yaw); g.pose(t, { expr: e, armL: 0.02, armR: -0.02, headYaw: 0, headPitch: 0, ...extra }); w.girlD!.set(p, t, 0.07); };
const benchHero = (w: World, t: number, e: Expr, draw = true) => { place(HB(w), "YARD", -4.5, 0.36, 0.55, 0.25); HB(w).pose(t, draw ? drawing(t, e, { sit: true }) : { sit: true, expr: e, headPitch: 0.05 }); if (draw) bookInHand(HB(w), w.sets.yardBook, 0.9, true); };
const dinoAt = (w: World, x: number, z: number, yaw: number, t: number, run: number, roar: number, p = 1) => { const d = w.sets.dino; d.root.position.set(x, 0, z); d.root.rotation.y = yaw; d.set(t, run, roar); w.sets.dinoD.set(p, t, 0.1); };
const houseState = (w: World, wins: number, roof: number, t: number) => { w.sets.home.dw!.set(wins, t, 0.12); w.sets.home.dr!.set(roof, t, 0.14); };
const othBoy = (w: World, t: number, e: Expr, pose: Pose = {}) => { place(w.actors.boy, "OTH", 0, 0, 3.0, Math.PI); w.actors.boy.pose(t, { expr: e, ...pose }); };
const othHero = (w: World, t: number, e: Expr, sk = 0, gone = 0, pose: Pose = {}) => { place(HB(w), "OTH", 0, 0, 0.9, 0); HB(w).pose(t, { expr: e, ...pose }); HB(w).setSketch(sk, gone); };

export const SHOTS: Shot[] = [
  // ——— 0 Dans cette ville, tout ce que tu dessines prend vie.
  { w: "Dans cette ville", set: "TOWN", fr: "Plongée aérienne descendante sur la ville colorée", g: DAY, cam: (_w, u) => G(at("TOWN", -26, 24, 34), at("TOWN", -11, 7, 17), at("TOWN", 2, 1, -6), at("TOWN", 2, 2.2, -8), 44, u),
    st: (w, _u, t) => townCrowd(w, t) },
  { w: "tout ce que tu dessines", set: "TOWN", fr: "Gros plan carnet : une enfant dessine un ballon (vue plongeante)", g: DAY, cam: (w, u) => bookCam(w.actors.k6, w.sets.townBook, u),
    st: (w, u, t) => { const a = w.actors.k6; place(a, "TOWN", 4.0, 0, 6.2, -0.4); a.pose(t, drawing(t, "focus", { headPitch: 0.5 })); w.sets.townBook.visible = true; bookInHand(a, w.sets.townBook, 1.0); (w.sets.townBook.children[2] as THREE.Mesh).material = pageOf(w, "balloon", cl(u * 1.2)); } },
  { w: "prend vie", set: "TOWN", fr: "Les ballons se tracent en or puis s'envolent, contre-plongée", g: DAY, cam: (_w, u) => G(at("TOWN", 3.2, 0.9, 9.6), at("TOWN", 3.4, 1.0, 9.3), at("TOWN", 4.5, 2.0, 7.0), at("TOWN", 4.5, 2.6, 7.0), 44, u),
    st: (w, u, t) => { const a = w.actors.k6; place(a, "TOWN", 4.0, 0, 6.2, -0.4); a.pose(t, { expr: "happy", armsUp: 0.4 }); w.sets.balloons.forEach((b, i) => { b.root.position.y = 1.6 + i * 0.25 + u * 0.9 + Math.sin(t * 2 + i) * 0.05; b.set(cl(u * 1.6 - i * 0.12), t, 0.08); }); } },
  // ——— 1 Et je ne parle pas d'un petit tour de magie.
  { w: "Et je ne parle pas", set: "TOWN", fr: "Le héros face caméra sur le trottoir, travelling arrière", g: DAY, cam: (w, u) => faceCam(HB(w), 2.2, -0.35, 0.05, 1 - u, -0.35, 34),
    st: (w, _u, t) => { place(HB(w), "TOWN", 0.6, 0, -2.3, 0.15); HB(w).pose(t, { expr: "smug", talk: true, headYaw: Math.sin(t * 5) * 0.25 }); townCrowd(w, t, true, true); } },
  // ——— 2 Je veux dire : absolument n'importe quoi.
  { w: "Je veux dire", set: "TOWN", fr: "Un garçon dessine une voiture sur le trottoir : elle se trace en or sur la rue", g: DAY, cam: (_w, u) => G(at("TOWN", -0.5, 1.5, -6.0), at("TOWN", 1.0, 1.6, -5.6), at("TOWN", 5, 0.8, -0.6), at("TOWN", 5.2, 0.8, -0.6), 40, u),
    st: (w, u, t) => { const a = w.actors.k5; place(a, "TOWN", 2.6, 0, -2.6, 0.9); a.pose(t, drawing(t, "focus", { headPitch: 0.3 })); w.sets.townCar.set(cl(u * 1.25), t, 0.12); } },
  { w: "absolument n'importe quoi", set: "TOWN", fr: "La voiture réelle, le garçon bondit de joie, travelling latéral", g: DAY, cam: (_w, u) => G(at("TOWN", 9.5, 1.1, 3.5), at("TOWN", 8.0, 1.2, 4.2), at("TOWN", 4.5, 0.8, -1.0), at("TOWN", 4.0, 0.9, -1.2), 42, u),
    st: (w, _u, t) => { const a = w.actors.k5; place(a, "TOWN", 2.6, 0, -2.6, 0.9); a.pose(t, { cheer: true, expr: "happy" }); w.sets.townCar.set(1, t); } },
  // ——— 3 Mon meilleur ami … billet … bureau.
  { w: "Mon meilleur ami", set: "FRD", fr: "Le meilleur ami à son bureau, plan large de trois quarts", g: IN, cam: (_w, u) => G(at("FRD", 1.4, 1.6, 2.6), at("FRD", 1.1, 1.5, 2.2), at("FRD", 0, 0.85, -1.0), at("FRD", 0, 0.85, -1.0), 48, u),
    st: (w, _u, t) => { amiDesk(w, t); w.sets.friendPage.draw(0.2); w.sets.bill.set(0, t); } },
  { w: "a dessiné un billet", set: "FRD", fr: "Plongée sur la feuille : le billet se dessine", g: IN, cam: (_w, u) => G(at("FRD", 0.75, 1.6, -1.75), at("FRD", 0.7, 1.5, -1.7), at("FRD", 0.0, 0.75, -0.8), at("FRD", 0.0, 0.75, -0.8), 42, u),
    st: (w, u, t) => { amiDesk(w, t); w.sets.friendPage.draw(0.2 + u * 0.8); w.sets.bill.set(0, t); } },
  { w: "sur son devoir", set: "FRD", fr: "Visage concentré du meilleur ami (contrechamp, recul)", g: IN, cam: (w, u) => sideCam(w.actors.ami, 0.5, 1.3, 0.12, u, 0.1, 40),
    st: (w, _u, t) => { amiDesk(w, t, "focus"); w.sets.friendPage.draw(1); w.sets.bill.set(0, t); } },
  { w: "et soudain", set: "FRD", fr: "Gros plan bureau : le billet se trace en or puis devient réel", g: IN, cam: (_w, u) => G(at("FRD", 0.5, 1.4, 1.0), at("FRD", 0.4, 1.35, 0.8), at("FRD", -0.3, 0.78, -0.75), at("FRD", -0.3, 0.78, -0.75), 44, u),
    st: (w, u, t) => { amiDesk(w, t, "scared", false); w.sets.friendPage.draw(1); w.sets.bill.set(cl(u * 1.15), t, 0.03); } },
  { w: "apparu sur son bureau", set: "FRD", fr: "L'ami brandit le billet, rire (plan taille)", g: IN, cam: (w, u) => sideCam(w.actors.ami, -0.4, 1.35, 0.05, u, 0.15, 40),
    st: (w, _u, t) => { place(w.actors.ami, "FRD", 0, SIT, -1.32, 0); w.actors.ami.pose(t, { sit: true, expr: "happy", armR: -2.6, armL: -0.3 }); w.sets.friendPage.draw(1); const b = w.sets.bill.root; w.sets.bill.set(1, t);
      w.actors.ami.rArm.updateMatrixWorld(true); const hp = w.actors.ami.rArm.localToWorld(V(0, -1.5, 0.6)); b.position.copy(b.parent!.worldToLocal(hp)); b.rotation.set(1.2, 0, 0.2); } },
  // ——— 4 Alors forcément, il fallait que j'essaie.
  { w: "Alors forcément", set: "BED", fr: "Chambre : le héros s'assoit au bureau, travelling avant", g: IN, cam: (_w, u) => G(at("BED", -1.2, 1.5, 1.8), at("BED", -0.2, 1.3, 0.6), at("BED", 1.8, 0.85, -1.4), at("BED", 1.9, 0.85, -1.4), 42, u),
    st: (w, _u, t) => { heroDeskBed(w, t, "smug", false); w.sets.bedPage.draw(0); pcSet(w, 0, t); } },
  // ——— 5 J'ai pris un crayon … PC de gamer flambant neuf.
  { w: "J'ai pris un crayon", set: "BED", fr: "Gros plan main et crayon sur le carnet (profil bas)", g: IN, cam: (_w, u) => G(at("BED", 1.3, 1.6, -0.3), at("BED", 1.35, 1.55, -0.45), at("BED", 1.95, 0.8, -1.35), at("BED", 1.95, 0.8, -1.35), 44, u),
    st: (w, u, t) => { heroDeskBed(w, t); w.sets.bedPage.draw(u * 0.3); pcSet(w, 0, t); } },
  { w: "dessiné un PC", set: "BED", fr: "Plongée verticale sur la page : le PC se dessine", g: IN, cam: (_w, u) => G(at("BED", 1.55, 1.55, -1.25), at("BED", 1.6, 1.45, -1.28), at("BED", 2.0, 0.75, -1.35), at("BED", 2.0, 0.75, -1.35), 36, u),
    st: (w, u, t) => { heroDeskBed(w, t); w.sets.bedPage.draw(0.3 + u * 0.7); pcSet(w, 0, t); w.sets.bedBook.rotation.set(0, -Math.PI / 2, 0); } },
  // ——— 6 Et boum ! Une installation de jeu géante …
  { w: "Et boum", set: "BED", fr: "Plan large : l'installation se trace en or au milieu de la chambre, travelling circulaire", g: IN, cam: (_w, u) => { const a = -0.75 + u * 0.5; return G(at("BED", Math.sin(a) * 2.1, 1.9, 0.6 + Math.cos(a) * 1.6), at("BED", Math.sin(a + 0.12) * 2.1, 1.85, 0.6 + Math.cos(a + 0.12) * 1.6), at("BED", 0.3, 0.75, -0.2), at("BED", 0.3, 0.75, -0.2), 62, u); },
    st: (w, u, t) => { place(HB(w), "BED", 1.6, 0, 1.4, -2.0); HB(w).pose(t, { expr: "scared", armsUp: 0.15 }); w.sets.bedPage.draw(1); pcSet(w, cl(u * 1.15), t); } },
  { w: "apparue au milieu", set: "BED", fr: "Le héros émerveillé, lumière RGB sur le visage", g: IN, cam: (w, u) => sideCam(HB(w), 0.6, 1.8, 0.15, u, 0.15, 40),
    st: (w, _u, t) => { place(HB(w), "BED", 1.6, 0, 1.4, -2.0); HB(w).pose(t, { expr: "happy", cheer: true }); pcSet(w, 1, t); } },
  // ——— 7 Seul petit souci : … clavier à l'envers.
  { w: "Seul petit souci", set: "BED", fr: "Retour sur la page : le clavier dessiné (gros plan)", g: { ...IN, sat: 0.38 }, cam: (_w, u) => G(at("BED", 1.6, 1.4, -1.2), at("BED", 1.65, 1.32, -1.25), at("BED", 2.02, 0.75, -1.35), at("BED", 2.02, 0.75, -1.35), 36, u),
    st: (w, _u, t) => { heroDeskBed(w, t, "worried", false); HB(w).root.visible = false; w.sets.bedPage.draw(1); pcSet(w, 1, t); } },
  { w: "j'avais dessiné le clavier", set: "BED", fr: "Gros plan du vrai clavier : retourné, touches dessous", g: IN, cam: (_w, u) => G(at("BED", 1.0, 1.75, 1.9), at("BED", 0.85, 1.65, 1.75), at("BED", 0.05, 0.85, 0.45), at("BED", 0.05, 0.85, 0.45), 44, u),
    st: (w, _u, t) => { pcSet(w, 1, t); } },
  // ——— 8 Alors le vrai clavier était, lui aussi, à l'envers.
  { w: "Alors le vrai clavier", set: "BED", fr: "Le héros dans le fauteuil tape sur le clavier à l'envers, perplexe (de dos puis de face)", g: IN, cam: (_w, u) => G(at("BED", 1.6, 1.6, 2.15), at("BED", 1.3, 1.5, 2.1), at("BED", 0.05, 0.9, 0.7), at("BED", 0.05, 0.9, 0.7), 48, u),
    st: (w, _u, t) => { heroGamer(w, t, "worried", 1); pcSet(w, 1, t); } },
  { w: "lui aussi", set: "BED", fr: "Plan serré : il retourne le clavier dans tous les sens, moue", g: IN, cam: (w, u) => sideCam(HB(w), 0.9, 1.2, 0.15, u, 0.1, 38),
    st: (w, _u, t) => { heroGamer(w, t, "sad", 0); pcSet(w, 1, t); } },
  // ——— 9 Le lendemain, à l'école …
  { w: "Le lendemain", set: "YARD", fr: "Façade de l'école au soleil, travelling avant au ras de la cour", g: DAY, cam: (_w, u) => G(at("YARD", -3, 0.6, 16), at("YARD", -1.5, 1.4, 9), at("YARD", 0, 4.5, -8), at("YARD", 0, 3.8, -8), 46, u),
    st: (w, u, t) => { const ks = ["k1", "k3", "k4", "k6", "ami", "jaden"]; ks.forEach((k, i) => walkTo(w.actors[k], "YARD", -6 + i * 2.2, 6 - (i % 2) * 2, -3 + i * 1.2, -5.5, cl(u * 0.8 + i * 0.05), t + i, 1.3, { expr: "smile" })); w.sets.car.set(0, t); } },
  { w: "tout le monde dessinait", set: "CLS", fr: "Classe : tous les élèves dessinent, travelling latéral au-dessus des tables", g: IN, cam: (_w, u) => G(at("CLS", -3.8, 2.6, 3.5), at("CLS", -1.0, 2.6, 3.5), at("CLS", -1.8, 0.9, -1.2), at("CLS", -0.6, 0.9, -1.4), 54, u),
    st: (w, _u, t) => { classKids(w, t); w.sets.pool.set(0, t); w.sets.poolPage.draw(0.3); } },
  // ——— 10 Un gamin a dessiné une voiture de sport …
  { w: "Un gamin a dessiné", set: "YARD", fr: "Dans la cour, un garçon dessine : la voiture de sport se trace en or", g: DAY, cam: (_w, u) => G(at("YARD", 1.0, 1.3, 9.5), at("YARD", 2.0, 1.5, 9.0), at("YARD", 5.0, 0.8, 3.0), at("YARD", 5.2, 0.8, 3.0), 42, u),
    st: (w, u, t) => { const a = w.actors.k1; place(a, "YARD", 2.0, 0, 5.8, 2.6); a.pose(t, drawing(t, "focus", { headPitch: 0.3 })); w.sets.car.set(cl(u * 1.25), t, 0.15); } },
  { w: "une voiture de sport", set: "YARD", fr: "La voiture rouge brille au soleil, travelling bas autour de la calandre", g: DAY, cam: (_w, u) => G(at("YARD", 16, 1.5, 12), at("YARD", 13, 1.5, 14), at("YARD", 5.0, 0.8, 3.4), at("YARD", 4.6, 0.8, 3.6), 44, u),
    st: (w, _u, t) => { const a = w.actors.k1; place(a, "YARD", 2.0, 0, 5.8, 2.6); a.pose(t, { cheer: true, expr: "happy" }); w.sets.car.set(1, t); } },
  { w: "un autre a fait apparaître", set: "CLS", fr: "Classe : une piscine se trace en or entre les tables", g: IN, cam: (_w, u) => G(at("CLS", -0.6, 2.4, -3.0), at("CLS", -0.2, 2.2, -2.6), at("CLS", 2.4, 0.4, 1.0), at("CLS", 2.4, 0.4, 1.2), 46, u),
    st: (w, u, t) => { classKids(w, t, "scared", 0.9); w.actors.k2.pose(t, drawing(t, "focus", { sit: true })); w.sets.pool.set(cl(u * 1.2), t, 0.12); w.sets.poolPage.draw(1); } },
  { w: "piscine dans la classe", set: "CLS", fr: "Les élèves debout autour de la piscine, eau qui ondule, plongée", g: IN, cam: (_w, u) => G(at("CLS", -3.6, 2.6, 3.4), at("CLS", -3.2, 2.4, 3.2), at("CLS", 1.6, 0.6, 0.6), at("CLS", 1.8, 0.6, 0.7), 52, u),
    st: (w, _u, t) => { const ks: [string, number, number, number][] = [["k2", 0.7, 0.6, Math.PI / 2], ["k5", 0.8, 1.9, Math.PI / 2], ["k6", 1.6, -1.3, 0.2], ["k3", 3.2, -1.25, -0.3]]; for (const [k, x, z, y] of ks) { place(w.actors[k], "CLS", x, 0, z, y); w.actors[k].pose(t + x, { expr: "happy", cheer: k === "k2" }); }
      w.sets.pool.set(1, t); const wm = w.sets.poolWater.material as THREE.MeshPhysicalMaterial; wm.normalMap!.offset.set(t * 0.03, t * 0.02); } },
  { w: "et mon pote Jaden", set: "HALL", fr: "Couloir : Jaden dessine contre un casier, gros plan carnet", g: HALLG, cam: (w, u) => faceCam(w.actors.jaden, 1.6, 0.6, 0.2, u, 0.15, 36),
    st: (w, u, t) => { hallReset(w, t); const a = w.actors.jaden; place(a, "HALL", -0.9, 0, -5.5, Math.PI - 0.4); a.pose(t, drawing(t, "smug", { headPitch: 0.4 })); bookInHand(a, w.sets.hallBook); (w.sets.hallBook.children[2] as THREE.Mesh).material = pageOf(w, "dino", cl(u * 1.1)); w.sets.dinoD.set(0, t); } },
  { w: "un dinosaure de compagnie", set: "HALL", fr: "Le dinosaure se trace en or dans le couloir, contre-plongée", g: HALLG, cam: (_w, u) => G(at("HALL", 0.9, 0.5, -2.8), at("HALL", 0.8, 0.6, -3.2), at("HALL", -0.1, 1.6, -10.5), at("HALL", -0.1, 1.5, -10.5), 52, u),
    st: (w, u, t) => { hallReset(w, t); const a = w.actors.jaden; place(a, "HALL", -1.1, 0, -6.5, Math.PI); a.pose(t, { expr: "happy", armsUp: 0.3 }); dinoAt(w, -0.2, -9.5, 0, t, 0, 0.2, cl(u * 1.2)); } },
  // ——— 11 Un dinosaure ! Il a poursuivi notre prof …
  { w: "Un dinosaure", set: "HALL", fr: "Le dinosaure rugit (gros plan de la tête, recul)", g: HALLG, cam: (_w, u) => G(at("HALL", 0.9, 1.5, -4.6), at("HALL", 0.8, 1.6, -5.0), at("HALL", -0.2, 1.9, -9.0), at("HALL", -0.2, 2.0, -9.0), 46, u),
    st: (w, _u, t) => { hallReset(w, t); dinoAt(w, -0.2, -9.5, 0, t, 0, 1); } },
  { w: "Il a poursuivi notre prof", set: "HALL", fr: "La prof court dans le couloir, le dinosaure derrière, travelling arrière rapide", g: HALLG, cam: (_w, u) => G(at("HALL", 1.1, 2.2, -6), at("HALL", 1.1, 2.2, -0.5), at("HALL", -0.2, 1.4, -14), at("HALL", -0.2, 1.4, -10), 50, u),
    st: (w, u, t) => { hallReset(w, t); const z = -9 - (1 - u) * 6 + u * 1; place(w.actors.prof, "HALL", 0.55, 0, z - 0, 0); w.actors.prof.pose(t, { walk: 2.6, expr: "scared", armsUp: 0.6 }); dinoAt(w, -0.1, z - 4.5, 0, t, 1, 0.6); } },
  // ——— 12 Mais là, j'ai eu une idée encore meilleure …
  { w: "Mais là", set: "YARD", fr: "Le héros dans la cour, sourire en coin : l'idée", g: DAY, cam: (w, u) => faceCam(HB(w), 1.8, 0.45, 0.05, u, 0.25, 36),
    st: (w, _u, t) => { place(HB(w), "YARD", -2.5, 0, 3.5, 0.4); HB(w).pose(t, { expr: "smug", point: 0.9, headPitch: -0.1 }); w.actors.girl.root.visible = false; } },
  { w: "et si je me dessinais", set: "YARD", fr: "Plan large : il regarde deux élèves main dans la main au loin", g: DAY, cam: (_w, u) => G(at("YARD", -4.6, 1.5, 6.5), at("YARD", -4.0, 1.4, 6.0), at("YARD", 1.5, 1.0, -2.5), at("YARD", 1.8, 1.0, -2.5), 40, u),
    st: (w, _u, t) => { place(HB(w), "YARD", -2.5, 0, 3.5, 2.6); HB(w).pose(t, { expr: "smug" }); for (const [k, x] of [["k4", 1.2], ["k6", 1.9]] as const) { place(w.actors[k], "YARD", x, 0, -3, 0.3); w.actors[k].pose(t, { expr: "happy", armL: k === "k6" ? -0.4 : undefined, armR: k === "k4" ? -0.4 : undefined }); } } },
  // ——— 13 pause déjeuner …
  { w: "J'ai passé toute la pause", set: "YARD", fr: "Sur le banc, sandwich à côté, il dessine (travelling latéral)", g: DAY, cam: (_w, u) => G(at("YARD", -7.2, 1.2, 3.6), at("YARD", -6.0, 1.2, 3.9), at("YARD", -4.6, 0.8, 0.6), at("YARD", -4.4, 0.8, 0.6), 40, u),
    st: (w, u, t) => { benchHero(w, t, "focus"); (w.sets.yardBook.children[2] as THREE.Mesh).material = pageOf(w, "girl", 0.2 + u * 0.4); w.actors.girl.root.visible = false; } },
  { w: "la plus jolie fille", set: "YARD", fr: "Gros plan carnet : le portrait de la fille se dessine", g: DAY, cam: (w, u) => bookCam(HB(w), w.sets.yardBook, u),
    st: (w, u, t) => { benchHero(w, t, "focus"); (w.sets.yardBook.children[2] as THREE.Mesh).material = pageOf(w, "girl", 0.6 + u * 0.4); w.actors.girl.root.visible = false; } },
  // ——— 14 Quand j'ai terminé, elle est apparue …
  { w: "Quand j'ai terminé", set: "YARD", fr: "Elle se trace en or devant le banc (plan large frontal)", g: DAY, cam: (_w, u) => G(at("YARD", -3.6, 1.1, 5.4), at("YARD", -3.8, 1.1, 5.0), at("YARD", -4.4, 0.8, 1.2), at("YARD", -4.4, 0.85, 1.2), 42, u),
    st: (w, u, t) => { benchHero(w, t, "scared", false); girlAt(w, "YARD", -4.1, 1.9, -2.9, t, "smile", cl(u * 1.15)); } },
  { w: "juste devant moi", set: "YARD", fr: "Contrechamp par-dessus l'épaule du héros : elle est réelle", g: DAY, cam: (_w, u) => G(at("YARD", -4.9, 1.25, 0.1), at("YARD", -4.85, 1.2, 0.25), at("YARD", -4.1, 1.05, 1.9), at("YARD", -4.1, 1.05, 1.9), 38, u),
    st: (w, _u, t) => { benchHero(w, t, "happy", false); girlAt(w, "YARD", -4.1, 1.9, -2.9, t, "smile"); } },
  // ——— 15 Elle m'a regardé, et elle a souri.
  { w: "Elle m'a regardé", set: "YARD", fr: "Plan rapproché de la fille, sourire bouche fermée", g: DAY, cam: (w, u) => faceCam(w.actors.girl, 1.6, -0.85, 0.0, u, 0.15, 34),
    st: (w, _u, t) => { benchHero(w, t, "happy", false); girlAt(w, "YARD", -4.1, 1.9, -2.9, t, "smile", 1, { headPitch: 0.15 }); } },
  { w: "et elle a souri", set: "YARD", fr: "Le héros rougit, sourire niais (plan rapproché)", g: DAY, cam: (w, u) => sideCam(HB(w), -0.9, 1.4, 0.1, u, 0.12, 40),
    st: (w, _u, t) => { benchHero(w, t, "happy", false); girlAt(w, "YARD", -4.1, 1.9, -2.9, t, "smile"); } },
  // ——— 16 J'étais plutôt bien parti, jusqu'à ce qu'elle ouvre la bouche.
  { w: "J'étais plutôt bien parti", set: "YARD", fr: "Plan à deux de profil : il se rapproche, fier", g: DAY, cam: (_w, u) => G(at("YARD", -1.6, 1.0, 1.0), at("YARD", -1.8, 1.0, 1.2), at("YARD", -4.3, 0.9, 1.2), at("YARD", -4.3, 0.9, 1.2), 38, u),
    st: (w, _u, t) => { benchHero(w, t, "smug", false); girlAt(w, "YARD", -4.1, 1.9, -2.9, t, "smile"); } },
  { w: "jusqu'à ce qu'elle ouvre", set: "YARD", fr: "Travelling avant lent sur la fille qui ouvre la bouche", g: DAY, cam: (w, u) => faceCam(w.actors.girl, 1.7, -0.9, 0.0, u, 0.3, 34),
    st: (w, u, t) => { benchHero(w, t, "smile", false); girlAt(w, "YARD", -4.1, 1.9, -2.9, t, u > 0.6 ? "gummy" : "smile"); } },
  // ——— 17 J'avais oublié de lui dessiner des dents.
  { w: "J'avais oublié", set: "YARD", fr: "Le grand sourire sans dents (plan rapproché, légère plongée)", g: DAY, cam: (w, u) => faceCam(w.actors.girl, 1.4, -0.8, 0.12, u, 0.08, 34),
    st: (w, _u, t) => { benchHero(w, t, "scared", false); girlAt(w, "YARD", -4.1, 1.9, -2.9, t, "gummy", 1, { headYaw: Math.sin(t * 3) * 0.08 }); } },
  { w: "des dents", set: "YARD", fr: "Réaction du héros : horreur", g: DAY, cam: (w, u) => sideCam(HB(w), -0.9, 1.4, 0.05, u, 0.18, 40),
    st: (w, _u, t) => { benchHero(w, t, "scared", false); girlAt(w, "YARD", -4.1, 1.9, -2.9, t, "gummy"); } },
  // ——— 18 J'ai essayé de corriger mon dessin, mais rien à faire …
  { w: "J'ai essayé de corriger", set: "YARD", fr: "Gros plan carnet : il ajoute des dents au dessin, vite", g: DAY, cam: (w, u) => bookCam(HB(w), w.sets.yardBook, u, -0.22),
    st: (w, u, t) => { benchHero(w, t, "worried"); (w.sets.yardBook.children[2] as THREE.Mesh).material = pageOf(w, "girlFix", 0.88 + u * 0.12); girlAt(w, "YARD", -4.1, 1.9, -2.9, t, "gummy"); } },
  { w: "rien à faire", set: "YARD", fr: "Elle sourit toujours sans dents ; lui, dépité (plan à deux large)", g: DAY, cam: (_w, u) => G(at("YARD", -2.4, 1.3, 5.2), at("YARD", -2.8, 1.25, 4.8), at("YARD", -4.3, 0.9, 1.3), at("YARD", -4.3, 0.9, 1.3), 40, u),
    st: (w, _u, t) => { benchHero(w, t, "sad"); girlAt(w, "YARD", -4.1, 1.9, -2.9, t, "gummy"); } },
  { w: "une fois qu'une chose", set: "YARD", fr: "La page corrigée en gros plan : rien ne change", g: { ...DAY, sat: 0.35 }, cam: (w, u) => bookCam(HB(w), w.sets.yardBook, u, 0.05, 30),
    st: (w, _u, t) => { benchHero(w, t, "sad"); (w.sets.yardBook.children[2] as THREE.Mesh).material = pageOf(w, "girlFix", 1); girlAt(w, "YARD", -4.1, 1.9, -2.9, t, "gummy"); } },
  // ——— 19 Puis, juste avant la sonnerie, un truc étrange s'est produit.
  { w: "Puis, juste avant", set: "HALL", fr: "L'horloge du couloir, l'aiguille avance (gros plan)", g: HALLG, cam: (_w, u) => G(at("HALL", 1.0, 2.45, 1.6), at("HALL", 1.1, 2.5, 1.8), at("HALL", 1.76, 2.6, 2.4), at("HALL", 1.76, 2.6, 2.4), 32, u),
    st: (w, u, t) => { hallReset(w, t); w.sets.clockM.rotation.z = -(5.5 + u * 0.4); w.sets.clockH.rotation.z = -(3.0 + u * 0.03); } },
  { w: "la sonnerie", set: "HALL", fr: "La sonnerie rouge vibre (contre-plongée)", g: HALLG, cam: (_w, u) => G(at("HALL", -0.8, 1.9, 2.6), at("HALL", -0.9, 2.0, 2.4), at("HALL", -1.75, 2.75, 1.5), at("HALL", -1.75, 2.75, 1.5), 36, u),
    st: (w, _u, t) => { hallReset(w, t); w.sets.bell.position.x = -1.75 + Math.sin(t * 60) * 0.006; } },
  { w: "un truc étrange", set: "CLS", fr: "Classe : les élèves lèvent la tête, inquiets (plan large)", g: { ...IN, sat: 0.35 }, cam: (_w, u) => G(at("CLS", 0.5, 1.6, -3.2), at("CLS", 0.3, 1.5, -2.8), at("CLS", -1.2, 0.95, 1.5), at("CLS", -1.2, 0.95, 1.5), 46, u),
    st: (w, _u, t) => { classKids(w, t, "worried", 0.3); w.sets.pool.set(1, t); } },
  // ——— 20 Tous les dessins de l'école ont commencé à disparaître.
  { w: "Tous les dessins", set: "CLS", fr: "La piscine se défait : traits dorés puis plus rien", g: { ...IN, sat: 0.35 }, cam: (_w, u) => G(at("CLS", -0.4, 2.0, 3.4), at("CLS", -0.1, 1.9, 3.1), at("CLS", 2.4, 0.4, 1.0), at("CLS", 2.4, 0.4, 0.9), 44, u),
    st: (w, u, t) => { classKids(w, t, "scared", 0.9); w.sets.pool.set(1 - cl(u * 1.1), t, 0.12); } },
  { w: "ont commencé à disparaître", set: "YARD", fr: "Dans la cour, la voiture de sport s'efface", g: { ...DAY, sat: 0.35 }, cam: (_w, u) => G(at("YARD", 9.5, 1.8, 7.5), at("YARD", 9.0, 1.7, 7.0), at("YARD", 5.2, 0.6, 3.2), at("YARD", 5.2, 0.6, 3.2), 40, u),
    st: (w, u, t) => { const a = w.actors.k1; place(a, "YARD", 2.0, 0, 5.8, 2.6); a.pose(t, { expr: "scared", cover: 0.6 }); w.sets.car.set(1 - cl(u * 1.1), t, 0.15); w.actors.girl.root.visible = false; } },
  // ——— 21 Mon PC s'est volatilisé. Le dinosaure a disparu. Même ma petite amie s'est évaporée.
  { w: "Mon PC", set: "BED", fr: "Chambre vide : le PC se volatilise en traits dorés", g: { ...IN, sat: 0.35 }, cam: (_w, u) => G(at("BED", -1.8, 1.4, 2.0), at("BED", -1.6, 1.35, 1.8), at("BED", 0.1, 0.8, 0.2), at("BED", 0.1, 0.8, 0.2), 44, u),
    st: (w, u, t) => { pcSet(w, 1 - cl(u * 1.15), t); } },
  { w: "Le dinosaure a disparu", set: "HALL", fr: "Le dinosaure s'efface, Jaden tend les bras vers lui", g: HALLG, cam: (_w, u) => G(at("HALL", 1.2, 1.1, -3.0), at("HALL", 1.1, 1.15, -3.4), at("HALL", -0.2, 1.4, -8.5), at("HALL", -0.2, 1.4, -8.5), 46, u),
    st: (w, u, t) => { hallReset(w, t); const a = w.actors.jaden; place(a, "HALL", -1.0, 0, -5.5, Math.PI); a.pose(t, { expr: "sad", reach: 0.8 }); dinoAt(w, -0.2, -9.5, 0, t, 0, 0, 1 - cl(u * 1.15)); } },
  { w: "Même ma petite amie", set: "YARD", fr: "La fille s'évapore devant le banc, le héros tend la main", g: { ...DAY, sat: 0.35 }, cam: (_w, u) => G(at("YARD", -6.8, 1.1, 3.8), at("YARD", -6.4, 1.1, 3.4), at("YARD", -4.2, 0.9, 1.5), at("YARD", -4.2, 0.9, 1.5), 40, u),
    st: (w, u, t) => { w.sets.car.set(0, t); benchHero(w, t, "sad", false); HB(w).pose(t, { sit: true, expr: "sad", reach: 0.7 }); girlAt(w, "YARD", -4.1, 1.9, -2.9, t, "gummy", 1 - cl(u * 1.15)); } },
  // ——— 22 Tout le monde s'est précipité dans le couloir, et là, on a compris.
  { w: "Tout le monde s'est précipité", set: "HALL", fr: "Les élèves déboulent dans le couloir (contre-plongée au sol)", g: HALLG, cam: (_w, u) => G(at("HALL", 0.6, 0.35, -10), at("HALL", 0.5, 0.4, -11), at("HALL", 0, 1.1, 0), at("HALL", 0, 1.0, -2), 48, u),
    st: (w, u, t) => { hallReset(w, t); hallKids(w, t, -1 - u * 4, "worried", 1); } },
  { w: "et là, on a compris", set: "HALL", fr: "Ils s'arrêtent net, visages tendus (plan de groupe)", g: HALLG, cam: (_w, u) => G(at("HALL", 0.2, 1.2, -9.5), at("HALL", 0.2, 1.2, -9.0), at("HALL", 0, 1.1, -5.5), at("HALL", 0, 1.1, -5.5), 44, u),
    st: (w, _u, t) => { hallReset(w, t); hallKids(w, t, -5.5, "scared"); } },
  // ——— 23 Quelqu'un avait dessiné une gomme géante sur le mur de l'école.
  { w: "Quelqu'un avait dessiné", set: "HALL", fr: "Au fond, la gomme dessinée au mur s'illumine et sort du mur", g: HALLG, cam: (_w, u) => G(at("HALL", 0.3, 1.5, -26), at("HALL", 0.2, 1.5, -29), at("HALL", 0, 1.5, -41), at("HALL", 0, 1.4, -41), 44, u),
    st: (w, u, t) => { hallReset(w, t); const e = w.sets.eraser; e.root.visible = u > 0.45; e.root.position.set(0, 1.25, -41.9 + 3.5 * cl((u - 0.45) / 0.55)); e.set(t, 0, 0);
      w.sets.muralM.map = w.sets.mural2; w.sets.muralM.emissive.set("#ffb040"); w.sets.muralM.emissiveIntensity = 0.5 * Math.max(0, 1 - Math.abs(u - 0.45) * 3); w.sets.muralM.needsUpdate = true; } },
  { w: "une gomme géante", set: "HALL", fr: "La gomme rose et bleue, aussi large que le couloir, flotte (contre-plongée)", g: HALLG, cam: (_w, u) => G(at("HALL", 1.3, 0.45, -25), at("HALL", 1.1, 0.5, -26), at("HALL", 0, 1.6, -37), at("HALL", 0, 1.5, -37), 52, u),
    st: (w, u, t) => { hallReset(w, t); eraserAt(w, -38 + u * 1.5, t); w.sets.muralM.emissiveIntensity = 0; } },
  // ——— 24 Elle avançait … les bureaux, les casiers, des salles de classe entières.
  { w: "Elle avançait", set: "HALL", fr: "La gomme avance vers la caméra, plan frontal dans l'axe", g: HALLG, cam: (_w, u) => G(at("HALL", 0, 1.2, -18), at("HALL", 0, 1.2, -17), at("HALL", 0, 1.3, -30), at("HALL", 0, 1.3, -30), 46, u),
    st: (w, u, t) => { eraserAt(w, -34 + u * 6, t); } },
  { w: "les bureaux", set: "HALL", fr: "Un bureau effacé au passage (latéral bas)", g: HALLG, cam: (_w, u) => G(at("HALL", 1.3, 0.8, -23), at("HALL", 1.3, 0.8, -24), at("HALL", -0.9, 0.7, -27), at("HALL", -0.9, 0.7, -27), 42, u),
    st: (w, u, t) => { eraserAt(w, -31.5 + u * 3.2, t); } },
  { w: "les casiers", set: "HALL", fr: "Les casiers disparaissent un à un, travelling latéral le long du mur", g: HALLG, cam: (_w, u) => G(at("HALL", 1.1, 1.3, -14), at("HALL", 1.1, 1.3, -16), at("HALL", -1.6, 1.1, -18), at("HALL", -1.6, 1.1, -21), 44, u),
    st: (w, u, t) => { eraserAt(w, -26 + u * 5, t); } },
  { w: "des salles de classe entières", set: "HALL", fr: "Derrière la gomme, tout est blanc : plan large de dos, vide de papier", g: HALLG, cam: (_w, u) => G(at("HALL", 0.6, 2.6, -36), at("HALL", 0.4, 2.4, -34), at("HALL", 0, 1.2, -16), at("HALL", 0, 1.2, -14), 50, u),
    st: (w, u, t) => { eraserAt(w, -20 + u * 3, t); } },
  // ——— 25 J'ai dessiné en vitesse une cage géante, mais la gomme l'a effacée …
  { w: "J'ai dessiné en vitesse", set: "HALL", fr: "Le héros dessine à toute vitesse, carnet en main (plan rapproché)", g: HALLG, cam: (w, u) => faceCam(HB(w), 1.6, -0.5, 0.2, u, 0.2, 38),
    st: (w, u, t) => { eraserAt(w, -17 + u, t); hallKids(w, t, -6, "scared"); place(HB(w), "HALL", 0.2, 0, -6, Math.PI); HB(w).pose(t * 1.8, drawing(t * 1.8, "angry", { headPitch: 0.35 })); bookInHand(HB(w), w.sets.hallBook); (w.sets.hallBook.children[2] as THREE.Mesh).material = pageOf(w, "cage", cl(u * 1.3)); w.sets.cage.set(0, t); } },
  { w: "une cage géante", set: "HALL", fr: "Les barreaux commencent à se tracer en or… la gomme passe dessus", g: HALLG, cam: (_w, u) => G(at("HALL", 1.0, 1.0, -8.5), at("HALL", 0.9, 1.0, -9.0), at("HALL", 0, 1.3, -15), at("HALL", 0, 1.3, -15), 48, u),
    st: (w, u, t) => { const z = -17 + u * 3; eraserAt(w, z, t); w.sets.cage.set(Math.min(0.42 * cl(u * 2), 0.42) * (u < 0.55 ? 1 : 1 - cl((u - 0.55) * 4)), t, 0.1); } },
  // ——— 26 C'est là que j'ai remarqué une chose …
  { w: "C'est là que j'ai remarqué", set: "HALL", fr: "Visage du héros : il comprend (travelling avant lent)", g: HALLG, cam: (w, u) => faceCam(HB(w), 1.8, 0.4, 0.05, u, 0.35, 36),
    st: (w, u, t) => { eraserAt(w, -13.5 + u * 0.5, t); hallKids(w, t, -6, "scared"); HB(w).pose(t, { expr: "focus", headPitch: -0.05 }); w.sets.hallBook.visible = false; } },
  { w: "la gomme n'effaçait que", set: "HALL", fr: "L'extincteur (réel) reste intact quand les casiers voisins s'effacent", g: HALLG, cam: (_w, u) => G(at("HALL", -1.0, 1.5, -27), at("HALL", -0.9, 1.45, -26), at("HALL", 1.2, 1.1, -19.5), at("HALL", 1.2, 1.1, -18.8), 46, u),
    st: (w, u, t) => { eraserAt(w, -13.5 + u * 0.5, t); } },
  // ——— 27 Alors j'ai couru en salle d'arts plastiques …
  { w: "Alors j'ai couru", set: "HALL", fr: "Il court dans le couloir, travelling d'accompagnement", g: HALLG, cam: (_w, u) => G(at("HALL", 0.9, 1.0, 1.0), at("HALL", 0.9, 1.0, 3.6), at("HALL", 0, 0.9, -4), at("HALL", 0, 0.9, -0.5), 46, u),
    st: (w, u, t) => { eraserAt(w, -13, t); walkTo(HB(w), "HALL", 0, -5, 0, 1.0, u, t, 2.4, { expr: "angry" }); } },
  { w: "j'ai pris un vrai seau", set: "ART", fr: "Salle d'arts : il attrape un seau de peinture jaune sur l'étagère", g: IN, cam: (_w, u) => G(at("ART", 0.2, 1.6, 1.4), at("ART", 0.1, 1.55, 1.1), at("ART", -1.2, 0.9, -2.6), at("ART", -1.2, 0.95, -2.6), 42, u),
    st: (w, u, t) => { place(HB(w), "ART", -1.25, 0, -2.0, Math.PI); HB(w).pose(t, { expr: "angry", reach: 0.6 + u * 0.4 }); const b = w.sets.bucket; b.position.y = 0.525 + u * 0.3; b.position.z = u * 0.35; } },
  { w: "je l'ai balancé", set: "HALL", fr: "Il lance la peinture : l'éclaboussure jaune vole vers la gomme", g: HALLG, cam: (_w, u) => G(at("HALL", 1.5, 1.4, -2.6), at("HALL", 1.3, 1.4, -3.3), at("HALL", -0.1, 1.2, -10.5), at("HALL", -0.1, 1.3, -11.5), 48, u),
    st: (w, u, t) => { eraserAt(w, -13.2, t); place(HB(w), "HALL", 0.1, 0, -7.2, Math.PI); HB(w).pose(t, { expr: "shout", armsUp: 0.55 - u * 0.4 });
      const hb = w.sets.bucketHeld; hb.visible = true; hb.position.copy(at("HALL", 0.1, 1.0 + (0.55 - u * 0.4) * 0.5, -7.55)).sub(O.HALL); hb.rotation.set(-u * 2.2, 0, 0);
      w.sets.splash.forEach((s, i) => { const k = cl(u * 1.6 - 0.25 - hash01(i) * 0.15); s.visible = k > 0 && k < 1; const tgt = V((hash01(i + 3) - 0.5) * 2.4, 1.0 + hash01(i + 5) * 1.4, -11.0); s.position.set(0.1 + (tgt.x - 0.1) * k, 1.1 + (tgt.y - 1.1) * k + Math.sin(k * Math.PI) * 0.8, -7.6 + (tgt.z + 7.6) * k); s.scale.setScalar(1 + k); }); } },
  // ——— 28 La peinture l'a recouverte, et d'un coup, elle ne pouvait plus rien effacer.
  { w: "La peinture l'a recouverte", set: "HALL", fr: "La gomme se couvre de peinture jaune dégoulinante (plan frontal)", g: HALLG, cam: (_w, u) => G(at("HALL", 0.7, 1.4, -3.0), at("HALL", 0.6, 1.4, -3.8), at("HALL", 0, 1.3, -13.2), at("HALL", 0, 1.3, -13.2), 50, u),
    st: (w, u, t) => { eraserAt(w, -13.2, t, cl(u * 1.4), cl(u * 1.4)); w.sets.splash.forEach((s) => (s.visible = false)); w.sets.bucketHeld.visible = false; } },
  { w: "et d'un coup", set: "HALL", fr: "Elle s'immobilise et retombe lourdement au sol (latéral bas)", g: HALLG, cam: (_w, u) => G(at("HALL", 1.4, 0.5, -5.5), at("HALL", 1.3, 0.55, -6.2), at("HALL", -0.2, 0.9, -13.4), at("HALL", -0.2, 0.9, -13.4), 48, u),
    st: (w, u, t) => { eraserAt(w, -13.2, t, 1, 1); w.sets.eraser.root.position.y = 1.25 - sm(u * 1.5) * 0.1; } },
  // ——— 29 Tout le monde a applaudi.
  { w: "Tout le monde a applaudi", set: "HALL", fr: "Les élèves applaudissent et sautent, le héros au centre", g: HALLG, cam: (_w, u) => G(at("HALL", 0.4, 1.3, -11.0), at("HALL", 0.3, 1.25, -10.5), at("HALL", 0, 1.0, -6.0), at("HALL", 0, 1.0, -6.0), 44, u),
    st: (w, _u, t) => { eraserAt(w, -13.2, t, 1, 1); w.sets.eraser.root.position.y = 1.15; hallKids(w, t, -6.5, "happy", 0, true); } },
  // ——— 30 Mais sur le mur, sous la zone effacée, il y avait un autre dessin.
  { w: "Mais sur le mur", set: "HALL", fr: "Long travelling avant dans le couloir blanc vers le mur du fond", g: { ...HALLG, sat: 0.2 }, cam: (_w, u) => G(at("HALL", 0, 1.5, -15.5), at("HALL", 0, 1.5, -33), at("HALL", 0, 1.5, -42), at("HALL", 0, 1.5, -42), 44, u),
    st: (w, _u, t) => { eraserAt(w, -13.2, t, 1, 1); w.sets.eraser.root.visible = false; w.sets.muralM.map = w.sets.mural2; w.sets.muralM.emissiveIntensity = 0; w.sets.muralM.needsUpdate = true; } },
  // ——— 31 Notre directeur, avec ces mots : « … »
  { w: "Notre directeur", set: "HALL", fr: "Le portrait du directeur au crayon (gros plan, travelling vertical)", g: { ...HALLG, sat: 0.2 }, cam: (_w, u) => G(at("HALL", 0, 2.1, -39.6), at("HALL", 0, 1.95, -39.4), at("HALL", 0, 2.1, -42), at("HALL", 0, 1.95, -42), 38, u),
    st: (w, _u, t) => { eraserAt(w, -13.2, t, 1, 1); w.sets.eraser.root.visible = false; w.sets.muralM.map = w.sets.mural2; } },
  { w: "Tout ce que vous dessinez", set: "HALL", fr: "Le message écrit sous le portrait, lent travelling arrière", g: { ...HALLG, sat: 0.1 }, cam: (_w, u) => G(at("HALL", 0, 1.15, -40.1), at("HALL", 0, 1.25, -38.8), at("HALL", 0, 1.2, -42), at("HALL", 0, 1.35, -42), 38, u),
    st: (w, _u, t) => { eraserAt(w, -13.2, t, 1, 1); w.sets.eraser.root.visible = false; w.sets.muralM.map = w.sets.mural2; } },
  // ——— 32 J'ai regardé dehors : les rues étaient totalement désertes.
  { w: "J'ai regardé dehors", set: "CLS", fr: "Le héros à la fenêtre de la classe, de dos", g: { ...IN, sat: 0.2 }, cam: (_w, u) => G(at("CLS", 0.6, 1.8, 2.2), at("CLS", 0.9, 1.75, 1.9), at("CLS", 4.0, 1.4, -0.3), at("CLS", 4.0, 1.4, -0.3), 44, u),
    st: (w, _u, t) => { w.sets.pool.set(0, t); classKids(w, t, "worried", 0); for (const k of ["k1", "k2", "k3", "k4", "k5", "k6", "ami"]) w.actors[k].root.visible = false; place(HB(w), "CLS", 3.6, 0, 0.0, Math.PI / 2); HB(w).pose(t, { expr: "worried" }); } },
  { w: "les rues étaient totalement désertes", set: "TOWN", fr: "La rue vide, sans personne ni voiture, plan large fixe puis léger travelling", g: EMPTY, cam: (_w, u) => G(at("TOWN", -16, 2.2, 3.2), at("TOWN", -13, 2.1, 3.0), at("TOWN", 10, 1.2, 1.0), at("TOWN", 10, 1.2, 1.2), 40, u),
    st: (w, _u, t) => { townCrowd(w, t, false); for (const c of w.sets.cars) c.visible = false; houseState(w, 1, 1, t); } },
  // ——— 33 Nous n'avions rien créé …
  { w: "Nous n'avions rien créé", set: "YARD", fr: "La cour déserte, balançoire vide de vie, plongée", g: EMPTY, cam: (_w, u) => G(at("YARD", 12, 9, 14), at("YARD", 10, 8, 12), at("YARD", 0, 0, 0), at("YARD", 0, 0, -1), 44, u),
    st: (w, _u, t) => { w.sets.car.set(0, t); w.actors.girl.root.visible = false; } },
  { w: "Nous ne faisions que tout voler", set: "TOWN", fr: "Le héros seul au milieu de la rue vide (plan large de face)", g: EMPTY, cam: (_w, u) => G(at("TOWN", 0.6, 1.3, 11), at("TOWN", 0.6, 1.3, 9.5), at("TOWN", 0.4, 1.0, 1.5), at("TOWN", 0.4, 1.0, 1.5), 40, u),
    st: (w, _u, t) => { townCrowd(w, t, false); for (const c of w.sets.cars) c.visible = false; houseState(w, 1, 1, t); place(HB(w), "TOWN", 0.4, 0, 1.5, 0.1); HB(w).pose(t, { expr: "sad", headPitch: 0.2 }); w.sets.doorD.set(0, t); } },
  // ——— 34 Mais il y avait pire : ma propre maison commençait à disparaître.
  { w: "Mais il y avait pire", set: "TOWN", fr: "Le héros devant sa maison, de dos (plan large)", g: EMPTY, cam: (_w, u) => G(at("TOWN", 3.2, 2.1, 7.0), at("TOWN", 2.6, 2.0, 6.0), at("TOWN", -0.2, 2.6, -10), at("TOWN", -0.2, 2.8, -10), 46, u),
    st: (w, u, t) => { townCrowd(w, t, false); for (const c of w.sets.cars) c.visible = false; houseState(w, 1, 1, t); place(HB(w), "TOWN", 0.3, 0, -1.6, Math.PI); HB(w).pose(t, { expr: "scared" }); w.sets.doorD.set(0, t); } },
  // ——— 35 D'abord les fenêtres, puis le toit.
  { w: "D'abord les fenêtres", set: "TOWN", fr: "Les fenêtres se changent en traits dorés et s'effacent", g: EMPTY, cam: (_w, u) => G(at("TOWN", -3.5, 1.5, -2.6), at("TOWN", -3.0, 1.5, -2.9), at("TOWN", 0, 1.8, -6.5), at("TOWN", 0, 1.8, -6.5), 42, u),
    st: (w, u, t) => { townCrowd(w, t, false); for (const c of w.sets.cars) c.visible = false; houseState(w, 1 - cl(u * 1.2), 1, t); } },
  { w: "puis le toit", set: "TOWN", fr: "Le toit se défait en lignes d'or (contre-plongée)", g: EMPTY, cam: (_w, u) => G(at("TOWN", 4.0, 0.6, -2.4), at("TOWN", 3.6, 0.7, -2.8), at("TOWN", 0, 4.2, -9), at("TOWN", 0, 4.4, -9), 48, u),
    st: (w, u, t) => { townCrowd(w, t, false); for (const c of w.sets.cars) c.visible = false; houseState(w, 0, 1 - cl(u * 1.2), t); } },
  // ——— 36 Quelqu'un, ailleurs, était en train de dessiner …
  { w: "Quelqu'un, ailleurs", set: "TOWN", fr: "Grue arrière : la maison sans toit ni fenêtres, le héros minuscule devant", g: EMPTY, cam: (_w, u) => G(at("TOWN", 1.0, 2.0, 2.0), at("TOWN", 2.0, 11, 12), at("TOWN", 0, 1.5, -6), at("TOWN", 0, 1.0, -6), 46, u),
    st: (w, _u, t) => { townCrowd(w, t, false); for (const c of w.sets.cars) c.visible = false; houseState(w, 0, 0, t); place(HB(w), "TOWN", 0.3, 0, -1.6, Math.PI); HB(w).pose(t, { expr: "sad" }); w.sets.doorD.set(0, t); } },
  // ——— 37 Il fallait que je sache qui.
  { w: "Il fallait que je sache", set: "TOWN", fr: "Visage du héros, déterminé (plan rapproché, contre-plongée légère)", g: EMPTY, cam: (w, u) => faceCam(HB(w), 1.6, 0.3, -0.15, u, 0.2, 36),
    st: (w, _u, t) => { townCrowd(w, t, false); for (const c of w.sets.cars) c.visible = false; houseState(w, 0, 0, t); place(HB(w), "TOWN", 0.3, 0, -1.6, 0.1); HB(w).pose(t, { expr: "angry" }); } },
  // ——— 38 Alors j'ai pris mon crayon, et j'ai tracé une dernière chose : une porte.
  { w: "Alors j'ai pris mon crayon", set: "TOWN", fr: "Gros plan : il trace une porte dans le carnet", g: EMPTY, cam: (w, u) => bookCam(HB(w), w.sets.townBook, u, 0.34),
    st: (w, u, t) => { townCrowd(w, t, false); for (const c of w.sets.cars) c.visible = false; houseState(w, 0, 0, t); place(HB(w), "TOWN", 0.3, 0, 1.5, Math.PI); HB(w).pose(t, drawing(t, "focus")); bookInHand(HB(w), w.sets.townBook); (w.sets.townBook.children[2] as THREE.Mesh).material = pageOf(w, "door", cl(u * 1.15)); w.sets.doorD.set(0, t); } },
  { w: "une porte", set: "TOWN", fr: "La porte se trace en or au milieu de la rue vide", g: EMPTY, cam: (_w, u) => G(at("TOWN", 1.8, 1.2, 8.8), at("TOWN", 1.4, 1.2, 8.2), at("TOWN", -1.2, 1.2, 4.2), at("TOWN", -1.2, 1.2, 4.2), 42, u),
    st: (w, u, t) => { townCrowd(w, t, false); for (const c of w.sets.cars) c.visible = false; houseState(w, 0, 0, t); place(HB(w), "TOWN", 0.6, 0, 1.6, -0.6); HB(w).pose(t, { expr: "focus" }); w.sets.townBook.visible = false; w.sets.doorD.set(cl(u * 1.2), t, 0.1); w.sets.door.set(0); } },
  // ——— 39 Une porte vers l'endroit d'où tout venait.
  { w: "Une porte vers l'endroit", set: "TOWN", fr: "Contre-plongée sur la porte jaune, lumière au bas de la porte", g: EMPTY, cam: (_w, u) => G(at("TOWN", 0.2, 0.3, 6.6), at("TOWN", -0.1, 0.35, 6.2), at("TOWN", -1.2, 1.6, 4.2), at("TOWN", -1.2, 1.7, 4.2), 46, u),
    st: (w, _u, t) => { townCrowd(w, t, false); for (const c of w.sets.cars) c.visible = false; w.sets.doorD.set(1, t); w.sets.door.set(0.02); place(HB(w), "TOWN", 0.6, 0, 1.6, -0.6); HB(w).pose(t, { expr: "focus" }); } },
  // ——— 40 Je l'ai ouverte, et de l'autre côté, des milliers de personnes me fixaient.
  { w: "Je l'ai ouverte", set: "TOWN", fr: "De dos : il ouvre la porte, lumière blanche éblouissante", g: { ...EMPTY, bloom: 1.4 }, cam: (_w, u) => G(at("TOWN", 0.4, 1.5, -1.6), at("TOWN", 0.0, 1.45, -0.8), at("TOWN", -1.3, 1.2, 4.6), at("TOWN", -1.3, 1.2, 4.6), 42, u),
    st: (w, u, t) => { townCrowd(w, t, false); for (const c of w.sets.cars) c.visible = false; w.sets.doorD.set(1, t); w.sets.door.set(sm(u * 1.3)); place(HB(w), "TOWN", -1.1, 0, 3.3, 0.08 * Math.PI); HB(w).pose(t, { expr: "focus", armR: -1.4 }); } },
  { w: "de l'autre côté", set: "OTH", fr: "Autre monde : le héros passe la porte (contrechamp, foule floue derrière)", g: OTHG, cam: (w, u) => faceCam(HB(w), 1.6, 1.0, 0.1, u, 0.3, 36),
    st: (w, _u, t) => { othHero(w, t, "scared"); w.actors.boy.root.visible = false; } },
  { w: "des milliers de personnes", set: "OTH", fr: "Révélation : des milliers de gens sur des gradins, travelling arrière en grue", g: OTHG, cam: (_w, u) => G(at("OTH", 0, 1.6, -0.5), at("OTH", 0, 4.5, -6.5), at("OTH", 0, 2.5, 12), at("OTH", 0, 5.0, 20), 44, u, 54),
    st: (w, _u, t) => { othHero(w, t, "scared"); w.actors.boy.root.visible = false; } },
  // ——— 41 Chacune tenait un carnet de croquis.
  { w: "Chacune tenait un carnet", set: "OTH", fr: "Travelling latéral le long des premiers rangs : carnets ouverts", g: OTHG, cam: (_w, u) => G(at("OTH", -3.2, 1.4, 3.2), at("OTH", 2.2, 1.4, 3.6), at("OTH", -2.0, 1.25, 7.2), at("OTH", 3.4, 1.25, 7.2), 38, u),
    st: (w, _u, t) => { othHero(w, t, "scared"); w.actors.boy.root.visible = false; } },
  // ——— 42 Un petit garçon, au premier rang, m'a pointé du doigt : « Attends, tu es l'un de nos dessins ! »
  { w: "Un petit garçon", set: "OTH", fr: "Un petit garçon sort du premier rang (plan moyen)", g: OTHG, cam: (w, u) => faceCam(w.actors.boy, 2.2, 1.7, 0.15, u, 0.4, 38),
    st: (w, u, t) => { othHero(w, t, "scared"); othBoy(w, t, "neutral"); place(w.actors.boy, "OTH", 0, 0, 4.4 - u * 1.4, Math.PI); w.actors.boy.pose(t, { walk: 1.2, expr: "neutral" }); } },
  { w: "m'a pointé du doigt", set: "OTH", fr: "Il pointe le héros du doigt (par-dessus l'épaule du héros)", g: OTHG, cam: (_w, u) => G(at("OTH", 0.8, 1.8, -1.4), at("OTH", 0.75, 1.75, -1.1), at("OTH", 0, 1.0, 3.0), at("OTH", 0, 1.0, 3.0), 42, u),
    st: (w, _u, t) => { othHero(w, t, "scared"); othBoy(w, t, "shout", { point: 0.3 }); } },
  { w: "Attends", set: "OTH", fr: "Le garçon, plan rapproché : « tu es l'un de nos dessins ! »", g: OTHG, cam: (w, u) => faceCam(w.actors.boy, 1.5, -1.25, 0.05, u, 0.15, 34),
    st: (w, _u, t) => { othHero(w, t, "scared"); othBoy(w, t, "happy", { point: 0.3, talk: true }); } },
  // ——— 43 J'ai baissé les yeux vers mes mains : elles se transformaient en traits de crayon.
  { w: "J'ai baissé les yeux", set: "OTH", fr: "Le héros baisse la tête vers ses mains (plan rapproché)", g: OTHG, cam: (w, u) => faceCam(HB(w), 1.6, 0.95, 0.2, u, 0.2, 36),
    st: (w, u, t) => { othBoy(w, t, "neutral"); othHero(w, t, "scared", 0.2 * u, 0, { headPitch: 0.5, armL: -1.2, armR: -1.2 }); } },
  { w: "elles se transformaient", set: "OTH", fr: "Vue subjective : ses mains deviennent des traits de crayon", g: OTHG, cam: (w, u) => { const h = headOf(HB(w)); return G(h.clone().add(V(0, 0.02, 0.05)), h.clone().add(V(0, 0.0, 0.08)), at("OTH", 0, 0.75, 1.35), at("OTH", 0, 0.72, 1.35), 46, u); },
    st: (w, u, t) => { othBoy(w, t, "neutral"); othHero(w, t, "scared", 0.2 + u * 0.8, 0, { headPitch: 0.6, armL: -1.25, armR: -1.25 }); } },
  // ——— 44 Le garçon a ouvert son carnet, et il a effacé un minuscule détail.
  { w: "Le garçon a ouvert", set: "OTH", fr: "Le garçon ouvre son carnet : le dessin du héros", g: OTHG, cam: (w, u) => faceCam(w.actors.boy, 1.4, 1.25, 0.3, u, 0.12, 36),
    st: (w, _u, t) => { othHero(w, t, "scared", 1); othBoy(w, t, "smug", { armL: -1.2, armR: -1.1, headPitch: 0.35 }); bookInHand(w.actors.boy, w.sets.boyBook, 0.6); w.sets.boyPage.draw(0); } },
  { w: "il a effacé un minuscule", set: "OTH", fr: "Gros plan carnet : la gomme du crayon efface la main gauche du dessin", g: OTHG, cam: (w, u) => bookCam(w.actors.boy, w.sets.boyBook, u, 0.25),
    st: (w, u, t) => { othHero(w, t, "scared", 1); othBoy(w, t, "smug", { armL: -1.2, armR: -1.3 + Math.sin(t * 20) * 0.12, headPitch: 0.4 }); bookInHand(w.actors.boy, w.sets.boyBook, 0.6); w.sets.boyPage.draw(cl(u * 1.1)); } },
  // ——— 45 Aussitôt, ma main gauche a disparu.
  { w: "Aussitôt", set: "OTH", fr: "La main gauche du héros disparaît dans une étincelle dorée", g: OTHG, cam: (w, u) => { const hd = headOf(HB(w)); return G(hd.clone().add(V(1.6, -0.1, 1.5)), hd.clone().add(V(1.45, -0.1, 1.35)), hd.clone().add(V(0.1, -0.55, 0.15)), hd.clone().add(V(0.1, -0.55, 0.15)), 38, u); },
    st: (w, u, t) => { othBoy(w, t, "smug"); othHero(w, t, "scared", 1, cl(u * 2 - 0.3), { armL: -1.0, armR: -0.3, headPitch: 0.4 }); w.sets.boyBook.visible = false; } },
  // ——— 46 Il m'a regardé, et il a souri : « Ne t'inquiète pas. Je corrige juste une erreur. »
  { w: "Il m'a regardé", set: "OTH", fr: "Le garçon relève les yeux et sourit (plan rapproché, travelling avant)", g: OTHG, cam: (w, u) => faceCam(w.actors.boy, 1.6, -1.3, 0.05, u, 0.3, 34),
    st: (w, _u, t) => { othHero(w, t, "scared", 1, 1); othBoy(w, t, "smile", { headPitch: -0.1 }); } },
  { w: "Ne t'inquiète pas", set: "OTH", fr: "Plan final : grue arrière, le héros minuscule face à la foule", g: OTHG, cam: (_w, u) => G(at("OTH", 0.8, 1.5, -2.4), at("OTH", 1.5, 7.5, -11), at("OTH", 0, 1.0, 2.0), at("OTH", 0, 2.5, 8), 40, u, 50),
    st: (w, _u, t) => { othHero(w, t, "sad", 1, 1); othBoy(w, t, "smile"); } },
];

// pages partagées par plan (les livres « en main » sont réutilisés)
const hash01 = (i: number) => { const s = Math.sin(i * 127.1 + 0.5) * 43758.5453; return s - Math.floor(s); };
const pageMats = new Map<string, THREE.MeshStandardMaterial>();
const pageOf = (w: World, k: string, prog: number) => { const pg = ({ balloon: w.sets.carPage, dino: w.sets.dinoPage, girl: w.sets.girlPage, girlFix: w.sets.girlFix, cage: w.sets.cagePage, door: w.sets.doorPage } as Record<string, typeof w.sets.carPage>)[k];
  if (k === "balloon") return balloonMat(prog);
  let m = pageMats.get(k); if (!m) { m = new THREE.MeshStandardMaterial({ map: pg.tex, roughness: 0.85 }); pageMats.set(k, m); } pg.draw(prog); return m; };
let balloonPage: Page | null = null; let balloonM: THREE.MeshStandardMaterial | null = null;
const balloonMat = (k: number) => { if (!balloonPage) {
    balloonPage = new Page([circ(0.4, 0.34, 0.1, undefined, 5, 22, 0, Math.PI * 2, 0.12), poly([[0.4, 0.46], [0.42, 0.6], [0.38, 0.75], [0.4, 0.88]], "#26262c", 3), circ(0.6, 0.3, 0.1, undefined, 5, 22, 0, Math.PI * 2, 0.12), poly([[0.6, 0.42], [0.58, 0.6], [0.45, 0.88]], "#26262c", 3)]);
    balloonM = new THREE.MeshStandardMaterial({ map: balloonPage.tex, roughness: 0.85 }); }
  balloonPage.draw(k); return balloonM!; };

export const SHOT_START = (() => { let from = 0; return SHOTS.map((s) => { const i = find(s.w, from); from = i + 1; return i; }); })();
export const START = SHOT_START.map((wi, i) => (i === 0 ? 0 : Math.round(W[wi].s * FPS) - 2));
export const shotAt = (f: number) => { let i = 0; while (i + 1 < START.length && START[i + 1] <= f) i++; return i; };
export const uOf = (i: number, f: number) => { const a = START[i], b = i + 1 < START.length ? START[i + 1] : TOTAL; return Math.min(1, Math.max(0, (f - a) / Math.max(1, b - a - 1))); };

const ERI = SHOTS.findIndex((x) => x.w === "Quelqu'un avait dessiné");
const DEF: Grade = { sat: 0.45, con: 0.06, bri: 0, bloom: 0.9, bg: "#000", fog: "#000", fogD: 0, env: 0.5, snow: false };
export const gradeOf = (i: number): Grade => ({ ...DEF, ...(SHOTS[i].g ?? {}) });

/** remet le monde à zéro puis applique le plan i */
export const applyShot = (w: World, i: number, u: number, t: number, _cam: THREE.Camera) => {
  const s = SHOTS[i]; w.sets.show(s.set);
  for (const a of Object.values(w.actors)) { a.root.visible = false; a.setSketch(0, 0); }
  const S = w.sets;
  S.townBook.visible = false; S.hallBook.visible = false; S.yardBook.visible = false; S.boyBook.visible = false; S.bucketHeld.visible = false; for (const p of S.splash) p.visible = false;
  for (const c of S.cars) c.visible = true; S.door.set(0); S.bucket.position.set(-1.2 + 2 * 0.48, 0.525, 0);
  S.muralM.map = i >= ERI ? S.mural2 : S.mural1; S.muralM.emissiveIntensity = 0; S.muralM.needsUpdate = true;
  for (const d of [S.bill, S.pc, S.car, S.pool, S.dinoD, S.cage, S.doorD, S.townCar, ...S.balloons]) d.set(1, t);
  S.townCar.set(1, t); S.cage.set(0, t); S.doorD.set(0, t); S.dinoD.set(0, t); for (const b of S.balloons) b.set(0, t); S.girlFix.draw(0.9);
  houseState(w, 1, 1, t); w.girlD!.set(0, t);
  w.fill.intensity = 0; w.key.intensity = 0;
  s.st?.(w, u, t);
  return s;
};
