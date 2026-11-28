// « Notre Château » ép. 1 : plans calés sur la voix (words.json). Plans larges et cinématiques (consigne utilisateur) :
// orbite pendant l'évolution du château, guetteur de dos, travelling très rapide vers l'armée, chef, muraille-hologramme dorée.
import * as THREE from "three";
import WORDS from "./words.json";
import { Actor } from "./chars";
import { V, H, PH, AZ, terrainMesh, Castle, Army, Ruins, Holo, Nature, VILLAGES, CHEF, GUET, SOLD, VIL, dressChef } from "./world";
import { ctex, hash } from "./tex";
import { M } from "./kit";

export const FPS = 30;
const W = WORDS as { w: string; s: number; e: number }[];
const LAST = W.filter((w) => /[a-zà-ÿ]/i.test(w.w)).pop()!;
export const TOTAL = Math.round((LAST.e + 0.2) * FPS);   // pas de blanc final : la vidéo s'arrête net après la dernière syllabe (décision du 2026-11-27)
const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9' ]/g, "").replace(/’/g, "'").trim();
const WN = W.map((w) => norm(w.w));
const find = (frag: string, from: number) => { const f = norm(frag).split(/\s+/); for (let i = from; i < WN.length; i++) if (f.every((x, k) => WN[i + k] === x)) return i; throw new Error("fragment introuvable : " + frag); };
const TW = (frag: string, from = 0) => W[find(frag, from)].s;
const TE = (frag: string, from = 0) => { const i = find(frag, from), n = norm(frag).split(/\s+/).length; return W[i + n - 1].e; };

const sm = (x: number) => { const t = Math.min(1, Math.max(0, x)); return t * t * t * (t * (t * 6 - 15) + 10); };
const gl = (x: number) => { const t = Math.min(1, Math.max(0, x)); return 0.45 * t + 0.55 * sm(t); };
const ex = (x: number) => { const t = Math.min(1, Math.max(0, x)); return t < 0.5 ? 0.5 * Math.pow(2, 20 * t - 10) : 1 - 0.5 * Math.pow(2, -20 * t + 10); };
const cl = (x: number) => Math.min(1, Math.max(0, x));
const L = (a: THREE.Vector3, b: THREE.Vector3, u: number) => a.clone().lerp(b, u);
type Cam = { P: THREE.Vector3; T: THREE.Vector3; fov: number };
const G = (P0: THREE.Vector3, P1: THREE.Vector3, T0: THREE.Vector3, T1: THREE.Vector3, fov: number, u: number, f1 = fov, e = gl): Cam => { const k = e(u); return { P: L(P0, P1, k), T: L(T0, T1, k), fov: fov + (f1 - fov) * k }; };
/** point au sol (+ hauteur) */
const g = (x: number, dy: number, z: number) => V(x, H(x, z) + dy, z);

export type World = { root: THREE.Group; castle: Castle; army: Army; ruins: Ruins; holo: Holo; nature: Nature; actors: Record<string, Actor>; sun: THREE.DirectionalLight; hemi: THREE.HemisphereLight;
  sky: THREE.Mesh; skies: Record<string, THREE.Texture>; glow: THREE.Sprite; torchL: THREE.PointLight[]; drums: THREE.Group[]; scene?: THREE.Scene; chefCape?: THREE.Mesh };
export type Grade = { sat: number; con: number; bri: number; bloom: number; bg: string; fog: string; fogD: number; env: number; sky: string; sun: number; sunCol: string; hemi: number; night: boolean };

const skyTex = (k: string, stops: [number, string][], stars = false) => ctex("sky_" + k, 64, 512, (q) => { const gr = q.createLinearGradient(0, 0, 0, 512); for (const [o, c] of stops) gr.addColorStop(o, c); q.fillStyle = gr; q.fillRect(0, 0, 64, 512);
  if (stars) for (let i = 0; i < 120; i++) { q.fillStyle = `rgba(255,255,255,${0.3 + hash(i, 2) * 0.7})`; q.fillRect(hash(i, 3) * 64, hash(i, 4) * 230, 1, 1); } });

export const buildWorld = () => {
  const root = new THREE.Group();
  const nature = new Nature(), castle = new Castle(), army = new Army(), ruins = new Ruins();
  root.add(terrainMesh(), nature.root, castle.root, army.root, ruins.root);
  const holo = new Holo(root);
  const skies = { morn: skyTex("morn", [[0, "#3a78c8"], [0.38, "#86b8e8"], [0.5, "#f4d8b4"], [0.56, "#f2c496"], [1, "#f2c496"]]),
    night: skyTex("night", [[0, "#04060e"], [0.4, "#0e1a36"], [0.5, "#3a2a3a"], [0.53, "#6a3a2a"], [1, "#1a1418"]], true),
    dusk: skyTex("dusk", [[0, "#2a3a7a"], [0.35, "#8a5a8a"], [0.47, "#f2905a"], [0.52, "#ffc87a"], [1, "#ffc87a"]]) };
  const sky = new THREE.Mesh(new THREE.SphereGeometry(3800, 32, 16), new THREE.MeshBasicMaterial({ map: skies.morn, side: THREE.BackSide, fog: false, depthWrite: false })); sky.renderOrder = -1; root.add(sky);
  const sun = new THREE.DirectionalLight("#ffe2b8", 3); sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096); const sc = sun.shadow.camera; sc.left = sc.bottom = -170; sc.right = sc.top = 170; sc.near = 1; sc.far = 1600;
  sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.8; root.add(sun, sun.target);
  const hemi = new THREE.HemisphereLight("#cfe2ff", "#6a7a4a", 0.9); root.add(hemi);
  // lueur des torches de l'armée derrière les collines (nuit)
  const gt = ctex("hglow2", 256, 64, (q) => { q.save(); q.scale(1, 0.25); const gr = q.createRadialGradient(128, 256, 0, 128, 256, 128); gr.addColorStop(0, "rgba(255,150,60,0.9)"); gr.addColorStop(1, "rgba(255,90,20,0)"); q.fillStyle = gr; q.fillRect(0, 0, 256, 256); q.restore(); });
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: gt, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false })); glow.scale.set(1100, 160, 1); glow.position.set(0, 40, AZ - 40); glow.visible = false; root.add(glow);
  const torchL = [0, 1, 2].map(() => { const l = new THREE.PointLight("#ff8a3a", 0, 40, 1.4); root.add(l); return l; });
  // personnages
  const mk = (k: string, s: typeof CHEF, seed: number) => { const a = new Actor(s, 0.36, seed); root.add(a.root); a.root.visible = false; return [k, a] as const; };
  const actors = Object.fromEntries([mk("guet", GUET, 3), mk("chef", CHEF, 4), mk("s1", SOLD, 5), mk("s2", SOLD, 6), mk("s3", SOLD, 7), mk("s4", SOLD, 8), ...VIL.map((s, i) => mk("v" + (i + 1), s, 10 + i))]) as Record<string, Actor>;
  const chefCape = dressChef(actors.chef);
  const drums = ["s1", "s2"].map((k) => { const d = new THREE.Group(); d.add(new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 1.0, 18), M("#8a2a1c", 0.7))); const top = new THREE.Mesh(new THREE.CylinderGeometry(0.76, 0.76, 0.06, 18), M("#e8dcc0", 0.8)); top.position.y = 0.52; d.add(top);
    d.position.set(0, 0.95, 0.65); d.rotation.x = 0.5; actors[k].root.add(d); return d; });
  const w: World = { root, castle, army, ruins, holo, nature, actors, sun, hemi, sky, skies, glow, torchL, drums, chefCape };
  return { w, root };
};

// ---------------- ambiances
const MORN: Partial<Grade> = { bg: "#9cc4e8", fog: "#f0d8bc", fogD: 0.00075, sat: 0.42, con: 0.12, bri: -0.02, bloom: 0.85, env: 0.45, sky: "morn", sun: 3.2, sunCol: "#ffe0b0", hemi: 0.95 };
const NIGHT: Partial<Grade> = { bg: "#0a1020", fog: "#16203a", fogD: 0.0011, sat: 0.5, con: 0.2, bri: -0.03, bloom: 1.35, env: 0.1, sky: "night", sun: 0.35, sunCol: "#8aa8ff", hemi: 0.22, night: true };
const DUSK: Partial<Grade> = { bg: "#3a2a4a", fog: "#e8a070", fogD: 0.0009, sat: 0.46, con: 0.16, bri: -0.04, bloom: 1.1, env: 0.3, sky: "dusk", sun: 2.6, sunCol: "#ff9a50", hemi: 0.55 };
const DEF: Grade = { sat: 0.42, con: 0.12, bri: 0, bloom: 0.9, bg: "#000", fog: "#000", fogD: 0, env: 0.45, sky: "morn", sun: 3, sunCol: "#ffe0b0", hemi: 0.9, night: false };

// ---------------- repères temporels
const T_CH = TW("Chaque abonné"), T_HAB = TW("habitant"), T_ET = TW("Et chaque habitant"), T_GR = TW("grandir"), T_AUJ = TW("Aujourd'hui"), T_400 = TE("quatre cents");
/** étape du château (0 → 5,2) en fonction du temps : 4 transformations pendant la première phrase-clé */
const KEYS: [number, number][] = [[0, 0.75], [T_CH - 0.35, 0.75], [T_CH + 0.55, 1.9], [T_HAB - 0.1, 1.9], [T_HAB + 0.8, 2.9], [T_ET, 2.9], [T_ET + 0.8, 3.9], [T_GR - 0.25, 3.9], [T_GR + 0.9, 5.2]];
const stageAt = (t: number) => { if (t <= KEYS[0][0]) return KEYS[0][1]; for (let i = 1; i < KEYS.length; i++) if (t <= KEYS[i][0]) { const [a, sa] = KEYS[i - 1], [b, sb] = KEYS[i]; return sa + (sb - sa) * sm((t - a) / Math.max(1e-3, b - a)); } return 5.2; };
const COUNT: [number, number][] = [[0, 100], [1.9, 1000], [2.9, 3000], [3.9, 6000], [5.2, 9800]];
const countAt = (s: number) => { for (let i = 1; i < COUNT.length; i++) if (s <= COUNT[i][0]) { const [a, na] = COUNT[i - 1], [b, nb] = COUNT[i]; return na + (nb - na) * (s - a) / (b - a); } return 9800; };
const T_MANQ = TW("Il nous manque");
/** compteur d'habitants en surimpression */
export const counterAt = (f: number) => { const t = f / FPS;
  if (t < T_400 + 0.9) { const s = stageAt(t); let n = countAt(s); if (t > T_AUJ - 0.2) n = 9800 + 1600 * sm((t - T_AUJ + 0.2) / Math.max(0.3, T_400 - T_AUJ)); return { n: Math.round(n / 100) * 100, op: cl(t * 4) * cl((T_400 + 0.9 - t) * 4) }; }
  if (t > T_MANQ - 0.15) return { n: 11400, goal: 12000, op: cl((t - T_MANQ + 0.15) * 4) };
  return null; };

// ---------------- personnages
const put = (w: World, k: string, P: THREE.Vector3, yaw: number) => { const a = w.actors[k]; a.root.visible = true; a.root.position.copy(P); a.root.rotation.set(0, yaw, 0); return a; };
const headOf = (a: Actor) => { a.root.updateMatrixWorld(true); return a.neck.localToWorld(V(0, 0.7, 0)); };
const MARCH = 1.4;                                       // vitesse de l'armée (u/s)
const marchAt = (t: number) => t * MARCH;
const guet = (w: World, t: number, ring = 0) => { const c = w.castle, top = c.bellTop; const a = put(w, "guet", ring > 0 ? V(top.x - 0.3, top.y, top.z + 0.2) : V(top.x + 0.5, top.y, top.z - 2.2), Math.PI - (ring > 0 ? 0.6 : 0.05));
  a.pose(t, ring > 0 ? { expr: "shout", armR: -2.6 + 0.35 * Math.sin(t * 7), headPitch: -0.1 } : { expr: "scared", headPitch: 0.05 }); c.bell.rotation.z = ring * 0.55 * Math.sin(t * 7); return a; };
const chefAt = (t: number) => g(0, 0, AZ + 16 + marchAt(t));
const chef = (w: World, t: number, extra = {}) => { const p = chefAt(t); const a = put(w, "chef", p, 0); a.pose(t, { walk: 1.0, expr: "angry", ...extra });
  if (w.chefCape) w.chefCape.rotation.x = 0.25 + 0.1 * Math.sin(t * 5); // porte-étendards et tambours derrière lui
  for (const [k, dx] of [["s3", -3.2], ["s4", 3.2]] as [string, number][]) { const s = put(w, k, g(dx, 0, AZ + 12 + marchAt(t)), 0); s.pose(t + dx, { walk: 1.0, expr: "angry", armR: -2.8 }); }
  return a; };
const villagers = (w: World, t: number, P: THREE.Vector3, yaw: number, pose: (i: number) => object) => { for (let i = 0; i < 4; i++) { const dx = (i - 1.5) * 1.9, x = P.x + Math.cos(yaw) * dx, z = P.z - Math.sin(yaw) * dx;
  put(w, "v" + (i + 1), g(x, 0, z + (i % 2) * 0.7), yaw).pose(t + i, pose(i)); } };

type HK = "wall" | "cats" | "gate" | "fire" | "cell";
const ALL: Partial<Record<HK, number>> = { wall: 1, cats: 1, gate: 1, fire: 1 }, NOGATE: Partial<Record<HK, number>> = { wall: 1, cats: 1, fire: 1 };
type Shot = { w: string; dt?: number; g?: Partial<Grade>; fr: string; cam: (w: World, u: number, t: number) => Cam; st?: (w: World, u: number, t: number) => void; holo?: Partial<Record<HK, number>>; sunAt?: THREE.Vector3 };
const C0 = V(0, PH, 0), TOP = () => V(-14, PH + 44.9, -36);
const orbit = (t: number): Cam => { const s = stageAt(t), e = sm(s / 5.2), a = 0.55 + t * 0.3, R = 46 + 150 * e, y = PH + 16 + 62 * e;
  return { P: V(Math.sin(a) * R, y, Math.cos(a) * R), T: V(0, PH + 5 + 7 * e, 0), fov: 40 }; };
const holoOrbit = (a0: number, a1: number, R: number, y: number, u: number, ty = PH + 8): Cam => { const a = a0 + (a1 - a0) * gl(u); return { P: V(Math.sin(a) * R, y, Math.cos(a) * R), T: V(0, ty, 0), fov: 42 }; };

const SHOTS: Shot[] = [
  // ——— Voici notre château. Chaque abonné, c'est un habitant. Et chaque habitant le fait grandir.
  { w: "Voici notre château", fr: "Orbite continue : tour de bois → donjon → château pavoisé (chaque forme pousse du sol)", g: MORN, cam: (_w, _u, t) => orbit(t), st: (w, _u, t) => w.castle.set(stageAt(t), t) },
  // ——— Aujourd'hui, nous sommes onze mille quatre cents.
  { w: "Aujourd'hui", fr: "Grue au-dessus du bourg vivant, rues pleines ; compteur 11 400", g: MORN, cam: (_w, u) => G(V(95, PH + 92, 150), V(52, PH + 46, 88), V(0, PH + 4, 0), V(-4, PH + 8, -6), 42, u), st: (w, _u, t) => w.castle.set(5.2, t) },
  // ——— Mais ce matin, le guetteur de la plus haute tour a sonné la cloche.
  { w: "Mais ce matin", fr: "Contre-plongée le long de la plus haute tour, soleil du matin", g: MORN, cam: (_w, u) => G(V(-2, PH + 3, -14), V(-3, PH + 6, -17), V(-14, PH + 30, -36), V(-14, PH + 50, -36), 52, u), st: (w, _u, t) => { w.castle.set(5.2, t); guet(w, t, 0); } },
  { w: "a sonné la cloche", fr: "Le guetteur sonne la cloche, la ville en contrebas", g: MORN, cam: (_w, u) => { const T = TOP(); return G(T.clone().add(V(17, 1.0, -9)), T.clone().add(V(14.5, 1.2, -7.5)), T.clone().add(V(-0.8, 2.6, 0.8)), T.clone().add(V(-0.8, 2.4, 0.8)), 34, u); },
    st: (w, _u, t) => { w.castle.set(5.2, t); guet(w, t, 1); } },
  // ——— À l'horizon, derrière les collines, il y avait une ligne noire. Et elle avançait.
  { w: "À l'horizon", fr: "Guetteur de dos, les collines du nord", g: MORN, cam: (_w, u) => { const T = TOP(); return G(T.clone().add(V(1.2, 3.1, 2.6)), T.clone().add(V(1.1, 3.0, 2.2)), V(-30, 26, -330), V(-24, 22, -360), 42, u); },
    st: (w, _u, t) => { w.castle.set(5.2, t); guet(w, t, 0); } },
  { w: "il y avait une ligne noire", fr: "Téléobjectif : une ligne noire sur la crête", g: MORN, cam: (_w, u) => { const T = TOP(); return G(T.clone().add(V(1.1, 3.0, 2.2)), T.clone().add(V(1.05, 3.0, 1.9)), V(0, 10, AZ - 70), V(0, 8, AZ - 60), 26, u, 11); },
    st: (w, _u, t) => { w.castle.set(5.2, t); guet(w, t, 0); } },
  { w: "Et elle avançait", fr: "Plus serré : la ligne avance", g: MORN, cam: (_w, u, t) => { const T = TOP(); return G(T.clone().add(V(1.05, 3.0, 1.9)), T.clone().add(V(1.0, 3.0, 1.7)), V(-10, 7, AZ - 50 + marchAt(t)), V(-10, 6, AZ - 45 + marchAt(t)), 7, u, 5); },
    st: (w, _u, t) => { w.castle.set(5.2, t); guet(w, t, 0); } },
  // ——— C'était une armée.
  { w: "C'était une armée", fr: "Travelling très rapide de la tour au-dessus des collines jusqu'à l'armée", g: MORN, cam: (_w, u, t) => { const T = TOP(); const m = marchAt(t);
      return G(T.clone().add(V(1.0, 3.0, 1.7)), V(30, 34, AZ + 95 + m), V(-10, 7, AZ - 45 + m), V(0, 2, AZ - 60 + m), 30, u, 55, ex); } },
  // ——— Des milliers de soldats en armure sombre, des étendards rouges, des tours de siège plus hautes que nos remparts.
  { w: "Des milliers de soldats", fr: "Survol bas des régiments jusqu'à l'horizon", g: MORN, cam: (_w, u, t) => { const m = marchAt(t); return G(V(-40, 26, AZ + 40 + m), V(-90, 20, AZ - 20 + m), V(10, 0, AZ - 120 + m), V(-40, 0, AZ - 200 + m), 55, u); } },
  { w: "des étendards rouges", fr: "Travelling latéral au ras des étendards", g: MORN, cam: (_w, u, t) => { const m = marchAt(t); return G(V(-150, 10, AZ + 10 + m), V(-112, 10.5, AZ + 8 + m), V(-120, 7, AZ - 30 + m), V(-82, 7, AZ - 30 + m), 46, u); } },
  { w: "des tours de siège", fr: "Contre-plongée sur une tour de siège qui roule", g: MORN, cam: (w, u, t) => { const tw = w.army.towers[3]; tw.updateMatrixWorld(true); const p = tw.getWorldPosition(V(0, 0, 0)); const m = marchAt(t) * 0;
      return G(p.clone().add(V(30, 8, 30 + m)), p.clone().add(V(24, 7, 25)), p.clone().add(V(0, 18, 0)), p.clone().add(V(0, 26, 0)), 50, u); } },
  // ——— Et des tambours qu'on entend d'ici, même la nuit.
  { w: "Et des tambours", fr: "Nuit : deux tambours devant l'armée aux torches", g: NIGHT, cam: (_w, u, t) => { const m = marchAt(t); return G(g(3.0, 2.6, AZ + 27 + m), g(2.2, 2.6, AZ + 23 + m), g(0, 2.2, AZ + 6 + m), g(0, 2.6, AZ + 6 + m), 42, u); },
    st: (w, _u, t) => { const m = marchAt(t); for (const [k, dx] of [["s1", -1.8], ["s2", 1.8]] as [string, number][]) put(w, k, g(dx, 0, AZ + 7 + m), 0).pose(t, { expr: "angry", armR: -1.2 - 0.9 * Math.abs(Math.sin(t * 5.2 + dx)), armL: -1.2 - 0.9 * Math.abs(Math.sin(t * 5.2 + dx + 1.6)) });
      w.army.torches.visible = true; w.torchL.forEach((l, i) => { l.position.copy(g((i - 1) * 6, 4, AZ + 2 + m)); l.intensity = 260 * (0.8 + 0.2 * Math.sin(t * 11 + i)); }); } },
  { w: "même la nuit", fr: "Nuit au château : les habitants regardent la lueur derrière les collines", g: NIGHT, cam: (_w, u) => G(V(0.2, PH + 4.6, -53), V(0, PH + 4.6, -56), V(0, PH + 8, -260), V(0, PH + 10, -260), 40, u),
    st: (w, _u, t) => { w.castle.set(5.2, t); w.glow.visible = true; villagers(w, t, V(0, 0, -64), Math.PI, (i) => ({ expr: i % 2 ? "scared" : "worried", headPitch: -0.08 })); } },
  // ——— Ils ont déjà pris trois villages. Ils ne laissent rien debout.
  { w: "Ils ont déjà pris", fr: "Vue aérienne : trois colonnes de fumée sur les villages", g: MORN, cam: (_w, u) => G(V(30, PH + 62, -70), V(22, PH + 58, -86), V(0, 10, -245), V(-5, 10, -250), 46, u), st: (w, _u, t) => w.castle.set(5.2, t) },
  { w: "Ils ne laissent rien debout", fr: "Ruines calcinées et fumée, la caméra glisse", g: MORN, cam: (_w, u) => { const c = VILLAGES[0]; return G(g(c.x + 26, 5, c.z + 22), g(c.x + 12, 4, c.z + 26), g(c.x, 2, c.z), g(c.x - 4, 2, c.z), 46, u); } },
  // ——— Et au rythme où ils marchent… ils seront à nos portes demain.
  { w: "Et au rythme où ils marchent", fr: "Plongée rapide depuis le ciel au-dessus de l'armée jusqu'au chef", g: MORN, cam: (w, u, t) => { const h = headOf(w.actors.chef); return G(h.clone().add(V(30, 60, -70)), h.clone().add(V(3.0, 0.4, 7.5)), V(0, 0, AZ - 40 + marchAt(t)), h, 50, u, 40); },
    st: (w, _u, t) => { chef(w, t); } },
  { w: "ils seront à nos portes demain", fr: "Le chef, en contre-plongée, pointe vers le château", g: MORN, cam: (w, u) => { const h = headOf(w.actors.chef); return G(h.clone().add(V(2.0, -1.2, 6.0)), h.clone().add(V(1.6, -1.1, 5.0)), h.clone().add(V(0, -0.2, 0)), h.clone().add(V(0, 0, 0)), 42, u); },
    st: (w, u, t) => { chef(w, t, { point: sm(u * 3), talk: u > 0.3 }); } },
  // ——— Nos murs ne tiendront pas.
  { w: "Nos murs ne tiendront pas", fr: "La palissade de bois, penchée et trouée", g: MORN, cam: (_w, u) => G(g(-34, 3.0, -86), g(-14, 3.2, -88), g(-24, 2.2, -74), g(-6, 2.4, -74), 44, u),
    st: (w, _u, t) => { w.castle.set(5.2, t); villagers(w, t, V(-12, 0, -68), Math.PI, () => ({ expr: "worried" })); } },
  // ——— À douze mille habitants, on pourra construire une grande muraille de pierre, avec des catapultes sur chaque tour.
  { w: "À douze mille habitants", fr: "Travelling autour du château : la muraille se dessine en hologramme doré", g: MORN, cam: (_w, u) => holoOrbit(2.5, 3.5, 175, PH + 62, u), holo: { wall: -1 }, st: (w, _u, t) => w.castle.set(5.2, t) },
  { w: "avec des catapultes", fr: "Plus près d'une tour : les catapultes apparaissent", g: MORN, cam: (_w, u) => holoOrbit(3.6, 4.1, 128, PH + 46, u, PH + 22), holo: { wall: 1, cats: -1 }, st: (w, _u, t) => w.castle.set(5.2, t) },
  // ——— Les forgerons couleront des portes en fer… Au sommet de chaque tour, on allumera un grand feu… Et sous le château, on creusera des réserves…
  { w: "Les forgerons couleront", fr: "Face à la porte sud : les grandes portes de fer se dessinent", g: MORN, cam: (_w, u) => G(V(-6, PH + 7, 158), V(4, PH + 9, 132), V(0, PH + 10, 86), V(0, PH + 12, 86), 44, u), holo: { wall: 1, cats: 1, gate: -1 }, st: (w, _u, t) => w.castle.set(5.2, t) },
  { w: "Au sommet de chaque tour", fr: "Nuit : un grand feu s'allume au sommet de chaque tour", g: NIGHT, cam: (_w, u) => holoOrbit(4.3, 4.95, 150, PH + 46, u, PH + 22), holo: { wall: 1, cats: 1, gate: 1, fire: -1 }, st: (w, _u, t) => { w.castle.set(5.2, t); } },
  { w: "Et sous le château", fr: "Vue à travers le sol : réserves voûtées pleines de blé", g: MORN, cam: (_w, u) => G(V(78, PH + 34, 96), V(60, PH + 24, 74), V(0, PH - 10, 0), V(0, PH - 13, 0), 44, u), holo: { wall: 1, cats: 1, gate: 1, fire: 1, cell: -1 }, st: (w, _u, t) => w.castle.set(5.2, t) },
  // ——— Aucune armée ne pourra entrer.
  { w: "Aucune armée ne pourra entrer", fr: "Plan large : la muraille complète, l'armée au loin", g: MORN, cam: (_w, u) => G(V(-170, PH + 150, 230), V(-150, PH + 132, 200), V(0, PH, -60), V(0, PH, -80), 42, u), holo: ALL, st: (w, _u, t) => w.castle.set(5.2, t) },
  // ——— Il nous manque six cents habitants. Abonne-toi. Viens défendre le château. Avant demain.
  { w: "Il nous manque", fr: "Le château et sa muraille fantôme ; compteur 11 400 / 12 000", g: MORN, cam: (_w, u) => G(V(60, PH + 46, 200), V(50, PH + 40, 176), V(0, PH + 12, 0), V(0, PH + 12, 0), 42, u), holo: ALL, st: (w, _u, t) => w.castle.set(5.2, t) },
  { w: "Abonne-toi", fr: "À la porte, les habitants font signe d'entrer", g: MORN, cam: (_w, u) => G(V(1.5, PH + 3.0, 92), V(1.0, PH + 2.8, 88), V(0, PH + 2.4, 78), V(0, PH + 2.4, 78), 44, u), holo: NOGATE,
    st: (w, _u, t) => { w.castle.set(5.2, t); w.castle.people.visible = false; villagers(w, t, V(0, 0, 79.5), 0, (i) => ({ expr: "happy", wave: i % 2 ? "R" : "L" })); } },
  { w: "Viens défendre le château", fr: "La caméra entre par la porte, vers le donjon", g: MORN, cam: (_w, u) => G(V(1.0, PH + 2.8, 88), V(0, PH + 12, 66), V(0, PH + 2.4, 78), V(0, PH + 14, 0), 46, u), holo: NOGATE,
    st: (w, _u, t) => { w.castle.set(5.2, t); w.castle.people.visible = false; villagers(w, t, V(0, 0, 79.5), 0, () => ({ expr: "happy", cheer: true })); } },
  { w: "Avant demain", fr: "Crépuscule : le château, et la ligne de torches à l'horizon", g: DUSK, cam: (_w, u) => G(V(60, PH + 70, 190), V(48, PH + 64, 168), V(0, PH + 10, -200), V(0, PH + 8, -220), 40, u), holo: ALL,
    st: (w, _u, t) => { w.castle.set(5.2, t); w.army.torches.visible = true; } },
];

export const SHOT_START = (() => { let from = 0; return SHOTS.map((s) => { const i = find(s.w, from); from = i + 1; return i; }); })();
export const START = SHOT_START.map((wi, i) => (i === 0 ? 0 : Math.round((W[wi].s + (SHOTS[i].dt ?? 0)) * FPS) - 2));
export const shotAt = (f: number) => { let i = 0; while (i + 1 < START.length && START[i + 1] <= f) i++; return i; };
export const uOf = (i: number, f: number) => { const a = START[i], b = i + 1 < START.length ? START[i + 1] : TOTAL; return Math.min(1, Math.max(0, (f - a) / Math.max(1, b - a - 1))); };
export const gradeOf = (i: number): Grade => ({ ...DEF, ...(SHOTS[i].g ?? {}) });
const SUN_DIR = V(0.45, 0.32, -0.83).normalize();

export const applyShot = (w: World, i: number, u: number, t: number, _f: number) => {
  const s = SHOTS[i], gr = gradeOf(i);
  for (const a of Object.values(w.actors)) a.root.visible = false;
  w.army.torches.visible = false; w.glow.visible = false; w.torchL.forEach((l) => (l.intensity = 0));
  w.castle.set(5.2, t); w.army.set(t, marchAt(t)); w.ruins.set(t);
  (w.sky.material as THREE.MeshBasicMaterial).map = w.skies[gr.sky]; w.sun.intensity = gr.sun; w.sun.color.set(gr.sunCol); w.hemi.intensity = gr.hemi;
  // hologramme : [muraille, catapultes] : 0 = rien, -1 = se dessine pendant le plan, 1 = déjà là
  const hp = (k = 0) => (k === -1 ? 0.62 * cl(u * 1.3) : k === 0 ? 0 : 0.62), ho = s.holo ?? {};
  (["wall", "cats", "gate", "fire", "cell"] as HK[]).forEach((k) => w.holo[k === "cell" ? "cell" : k].set(hp(ho[k]), t));
  const fp = hp(ho.fire); w.holo.flames.forEach((fl, i) => { fl.visible = fp > 0.4; const k = cl((fp - 0.4) / 0.2) * (0.85 + 0.15 * Math.sin(t * 13 + i * 2)); fl.scale.set(4 * k, 6 * k, 1); });
  s.st?.(w, u, t);
  return { cam: (ww: World, uu: number, tt: number) => { const c = s.cam(ww, uu, tt); const foc = c.T.clone().lerp(c.P, 0.35); foc.y = H(foc.x, foc.z);
    ww.sun.target.position.copy(foc); ww.sun.position.copy(foc).addScaledVector(SUN_DIR, 700); ww.sun.target.updateMatrixWorld(); return c; } };
};
