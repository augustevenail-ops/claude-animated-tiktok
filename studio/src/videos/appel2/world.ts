// « L'appel » : la tour en L (6 000 fenêtres en instances, vertes / rouges / noires selon l'appel), la cour et ses haut-parleurs,
// les hommes en blanc, la ville morte (rue, voitures, feu orange qui clignote, immeubles éteints), ton appartement derrière ta
// fenêtre, le couloir et la cage d'escalier du sous-sol (sous terre). update(id, f, cam, scene) pose tout pour une image.
import * as THREE from "three";
import { Batch, lam } from "../bridge/build";
import { ctex } from "../bridge/paint";
import { TONE, CHAR, untone } from "../bridge/shade";
import { NOINK } from "../bridge/ink";
import { Pool, Actor } from "../bridge/cast";
import type { Pen } from "../bridge/toon";
import { cityBlocks } from "../shared/opening";
import { drawChar, CharSpec } from "../shared/chars";
import { painted } from "../shared/painted";
import {
  FPS, V3, COLS, FLOORS, COLW, FLH, HALFW, B_X, TOWER_H, colX, MY_COL, MY_FLOOR, Y0, WIN, WIN_W, WIN_H, YOU, NOE, YOU_WIN, SPK_IN, SPK_OUT,
  CY, DOOR_Z, SHOTS, camAt, winState, greenAt, smooth, clamp01, hash, uOf, tW, KNOCKS, HANDLE, MY_DOOR_Z, ROLE, T_HANDLE, T_PUSH, T_NEIGH, T_RED, T_BOOTS, stairAt,
} from "./story";
import { NIGHT, FOG_IN, FOG_OUT } from "./look";

const FONT = "DejaVu Sans, Liberation Sans, sans-serif";
const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const solid = (key: string, color: string, extra: THREE.MeshLambertMaterialParameters = {}) => { const m = lam("ap_" + key, () => ({ color, ...extra })); m.name = "ap_" + key; return m; };
const basic = (color: string, extra: THREE.MeshBasicMaterialParameters = {}) => new THREE.MeshBasicMaterial({ color, ...extra });
const box = (b: Batch, m: THREE.Material, x0: number, y0: number, z0: number, x1: number, y1: number, z1: number) =>
  b.add(new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0).translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2), m);
/** rectangle plat dont les UV suivent le monde (1 UV = 1 module de façade) : la grille reste alignée d'un morceau à l'autre */
const facePlane = (axis: "z" | "x", p: number, a0: number, a1: number, y0: number, y1: number, mu: number, mv: number, flip = false) => {
  const g = new THREE.PlaneGeometry(1, 1), pos = g.attributes.position as THREE.BufferAttribute, uv = g.attributes.uv as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const s = pos.getX(i) + 0.5, t = pos.getY(i) + 0.5, a = a0 + (a1 - a0) * s, y = y0 + (y1 - y0) * t;
    if (axis === "z") pos.setXYZ(i, a, y, p); else pos.setXYZ(i, p, y, a);
    uv.setXY(i, (flip ? -a : a) / mu, y / mv);
  }
  g.computeVertexNormals(); return g;
};

// ---------------- textures peintes ----------------
const module = () => ctex("ap_module", 256, 328, (g) => {            // un module de façade 2,5 x 3,2 m : béton taché, joints, encadrement sombre
  g.fillStyle = "#59616a"; g.fillRect(0, 0, 256, 328);
  for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(${hash(i) < 0.5 ? "0,0,0" : "255,255,255"},${0.03 + hash(i, 1) * 0.05})`; g.beginPath(); g.ellipse(hash(i, 2) * 256, hash(i, 3) * 328, 10 + hash(i, 4) * 40, 6 + hash(i, 5) * 30, 0, 0, 7); g.fill(); }
  for (let i = 0; i < 6; i++) { const x = 30 + hash(i, 6) * 200; const gr = g.createLinearGradient(0, 150, 0, 328); gr.addColorStop(0, "rgba(20,24,20,0.28)"); gr.addColorStop(1, "rgba(20,24,20,0)"); g.fillStyle = gr; g.fillRect(x, 150, 4 + hash(i, 7) * 8, 178); }   // coulures
  g.fillStyle = "#2a2f35"; g.fillRect(44, 86, 168, 196);              // encadrement de la fenêtre (sous l'instance)
  g.fillStyle = "rgba(0,0,0,0.45)"; g.fillRect(36, 280, 184, 10);     // appui
  g.strokeStyle = "rgba(0,0,0,0.4)"; g.lineWidth = 4; g.strokeRect(0, 0, 256, 328);
});
const concrete = () => ctex("ap_concrete", 256, 256, (g) => {
  g.fillStyle = "#4e555c"; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 60; i++) { g.fillStyle = `rgba(0,0,0,${0.04 + hash(i, 9) * 0.06})`; g.beginPath(); g.arc(hash(i, 1) * 256, hash(i, 2) * 256, 6 + hash(i, 3) * 26, 0, 7); g.fill(); }
  g.strokeStyle = "rgba(0,0,0,0.35)"; g.lineWidth = 3; for (let k = 0; k < 4; k++) { g.beginPath(); g.moveTo(0, k * 64); g.lineTo(256, k * 64); g.stroke(); }
});
const deadWin = () => ctex("ap_deadwin", 128, 128, (g) => {          // immeubles éteints de la ville : petites fenêtres noires
  g.fillStyle = "#3d4248"; g.fillRect(0, 0, 128, 128);
  for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) { g.fillStyle = hash(x * 7 + y, 4) < 0.15 ? "#14181b" : "#0b0d10"; g.fillRect(6 + x * 32, 8 + y * 32, 18, 18); }
});
const winTex = () => ctex("ap_win", 64, 80, (g) => {                 // vitre : clair au centre, croisillons sombres (multiplié par la couleur d'état)
  const r = g.createRadialGradient(32, 36, 4, 32, 40, 46); r.addColorStop(0, "#ffffff"); r.addColorStop(1, "#8a8a8a"); g.fillStyle = r; g.fillRect(0, 0, 64, 80);
  g.fillStyle = "#1a1d22"; g.fillRect(0, 0, 64, 4); g.fillRect(0, 76, 64, 4); g.fillRect(0, 0, 4, 80); g.fillRect(60, 0, 4, 80); g.fillRect(30, 0, 4, 80); g.fillRect(0, 34, 64, 4);
  g.fillStyle = "rgba(0,0,0,0.35)"; g.fillRect(4, 4, 26, 14);           // ombre du store
});
const lino = () => ctex("ap_lino", 256, 256, (g) => {
  g.fillStyle = "#3e4842"; g.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y += 64) for (let x = 0; x < 256; x += 64) { g.fillStyle = (x + y) % 128 ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.06)"; g.fillRect(x, y, 64, 64); }
  for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(0,0,0,${0.05 + hash(i, 3) * 0.08})`; g.beginPath(); g.ellipse(hash(i, 1) * 256, hash(i, 2) * 256, 8 + hash(i, 4) * 30, 4 + hash(i, 5) * 10, hash(i, 6) * 3, 0, 7); g.fill(); }
});
const tiles = () => ctex("ap_tiles", 256, 256, (g) => {              // mur du couloir : carrelage vert pâle en bas, peinture écaillée en haut
  g.fillStyle = "#7d8a74"; g.fillRect(0, 0, 256, 256); g.fillStyle = "#5b6b62"; g.fillRect(0, 140, 256, 116);
  g.strokeStyle = "rgba(0,0,0,0.25)"; g.lineWidth = 2; for (let x = 0; x <= 256; x += 32) { g.beginPath(); g.moveTo(x, 140); g.lineTo(x, 256); g.stroke(); } for (let y = 140; y <= 256; y += 29) { g.beginPath(); g.moveTo(0, y); g.lineTo(256, y); g.stroke(); }
  g.fillStyle = "#2e3631"; g.fillRect(0, 134, 256, 8);
  for (let i = 0; i < 26; i++) { g.fillStyle = `rgba(40,30,20,${0.08 + hash(i, 5) * 0.12})`; g.beginPath(); g.ellipse(hash(i, 1) * 256, hash(i, 2) * 130, 6 + hash(i, 3) * 20, 4 + hash(i, 4) * 12, 0, 0, 7); g.fill(); }
});
const roomWall = () => ctex("ap_roomwall", 256, 256, (g) => {
  g.fillStyle = "#53665d"; g.fillRect(0, 0, 256, 256);
  for (let x = 0; x < 256; x += 24) { g.fillStyle = "rgba(255,255,255,0.035)"; g.fillRect(x, 0, 10, 256); }
  for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(0,0,0,${0.03 + hash(i, 7) * 0.06})`; g.beginPath(); g.arc(hash(i, 1) * 256, hash(i, 2) * 256, 8 + hash(i, 3) * 24, 0, 7); g.fill(); }
});
const blanket = (col: string) => ctex("ap_blanket" + col, 128, 128, (g) => {
  g.fillStyle = col; g.fillRect(0, 0, 128, 128); g.strokeStyle = "rgba(255,255,255,0.12)"; g.lineWidth = 6;
  for (let k = 0; k < 128; k += 32) { g.beginPath(); g.moveTo(k, 0); g.lineTo(k, 128); g.stroke(); g.beginPath(); g.moveTo(0, k); g.lineTo(128, k); g.stroke(); }
});
const drawing = () => ctex("ap_drawing", 256, 320, (g) => {          // dessin d'enfant : la tour, les fenêtres vertes, deux bonshommes
  g.fillStyle = "#e9e3d2"; g.fillRect(0, 0, 256, 320);
  g.strokeStyle = "#2a2a33"; g.lineWidth = 4; g.strokeRect(70, 40, 116, 240);
  for (let y = 0; y < 8; y++) for (let x = 0; x < 3; x++) { g.fillStyle = y < 5 ? "#2fc76a" : (x === 1 && y === 6 ? "#d33" : "#333"); g.fillRect(82 + x * 34, 54 + y * 27, 22, 16); }
  g.fillStyle = "#2a2a33"; for (const [x, s] of [[30, 1], [214, 0.7]]) { g.beginPath(); g.arc(x, 250 - 30 * s, 12 * s, 0, 7); g.fill(); g.fillRect(x - 3, 250 - 18 * s, 6, 40 * s); }
  g.font = `bold 26px ${FONT}`; g.fillText("NOÉ", 18, 304);
});
const poster = (n: number, lines: string[]) => ctex("ap_poster" + n, 320, 420, (g) => {
  g.fillStyle = "#e6dfcc"; g.fillRect(0, 0, 320, 420); g.fillStyle = "#b8231f"; g.fillRect(0, 0, 320, 70);
  g.fillStyle = "#fff"; g.font = `bold 40px ${FONT}`; g.textAlign = "center"; g.fillText(`RÈGLE ${n}`, 160, 50);
  g.fillStyle = "#16161c"; g.font = `bold 30px ${FONT}`; lines.forEach((l, i) => g.fillText(l, 160, 130 + i * 44));
  g.strokeStyle = "rgba(0,0,0,0.15)"; g.lineWidth = 2; for (let i = 0; i < 8; i++) { g.beginPath(); g.moveTo(hash(i) * 320, 0); g.lineTo(hash(i, 1) * 320, 420); g.stroke(); }   // plis
  g.fillStyle = "rgba(90,70,40,0.18)"; g.beginPath(); g.ellipse(250, 360, 60, 40, 0, 0, 7); g.fill();
});
const plate = (txt: string, sub = "") => ctex("ap_plate" + txt, 256, 128, (g) => {
  g.fillStyle = "#c9c1a8"; g.fillRect(0, 0, 256, 128); g.strokeStyle = "#2a2a2a"; g.lineWidth = 8; g.strokeRect(4, 4, 248, 120);
  g.fillStyle = "#1a1a1a"; g.textAlign = "center"; g.font = `bold ${sub ? 46 : 58}px ${FONT}`; g.fillText(txt, 128, sub ? 60 : 82);
  if (sub) { g.font = `bold 30px ${FONT}`; g.fillText(sub, 128, 104); }
});
const sign = () => ctex("ap_sign", 512, 128, (g) => {
  g.fillStyle = "#121212"; g.fillRect(0, 0, 512, 128); g.fillStyle = "#ff3b2f"; g.font = `bold 64px ${FONT}`; g.textAlign = "center"; g.fillText("SOUS-SOL", 256, 70);
  g.font = `bold 26px ${FONT}`; g.fillStyle = "#ffb0a8"; g.fillText("ACCÈS RÉSERVÉ", 256, 110);
});
const grille = () => ctex("ap_grille", 128, 128, (g) => {
  g.fillStyle = "#6c7068"; g.fillRect(0, 0, 128, 128); g.fillStyle = "#15171a";
  for (let y = 10; y < 118; y += 12) for (let x = 10; x < 118; x += 12) { g.beginPath(); g.arc(x + (y % 24 ? 6 : 0), y, 3.6, 0, 7); g.fill(); }
});
const glowTex = (rgb: string) => ctex("ap_glow" + rgb, 128, 128, (g) => {
  const r = g.createRadialGradient(64, 64, 0, 64, 64, 64); r.addColorStop(0, `rgba(${rgb},0.95)`); r.addColorStop(0.35, `rgba(${rgb},0.35)`); r.addColorStop(1, `rgba(${rgb},0)`); g.fillStyle = r; g.fillRect(0, 0, 128, 128);
});
const skyTex = () => ctex("ap_sky", 64, 512, (g) => {
  const v = g.createLinearGradient(0, 0, 0, 512); v.addColorStop(0, "#05070b"); v.addColorStop(0.42, "#101820"); v.addColorStop(0.5, "#2a3a36"); v.addColorStop(0.54, "#1a2226"); v.addColorStop(1, "#0b0e11");
  g.fillStyle = v; g.fillRect(0, 0, 64, 512);
});
const fogTex = () => ctex("ap_fog", 256, 128, (g) => {
  for (let i = 0; i < 26; i++) { const r = g.createRadialGradient(0, 0, 0, 0, 0, 1); void r; const x = hash(i, 1) * 256, y = 40 + hash(i, 2) * 50, rr = 30 + hash(i, 3) * 50;
    const k = g.createRadialGradient(x, y, 0, x, y, rr); k.addColorStop(0, "rgba(200,215,210,0.16)"); k.addColorStop(1, "rgba(200,215,210,0)"); g.fillStyle = k; g.fillRect(0, 0, 256, 128); }
});

// ---------------- personnages ----------------
const LOOK: Record<string, Partial<CharSpec>> = {
  Y: { jacket: "#2b3f93", pants: "#2a2f4a", shoes: "#16151c", hair: "side", hairColor: "#5a3a26", hood: true },
  N: { jacket: "#e0902a", pants: "#3a3f5a", shoes: "#1b1a22", hair: "short", hairColor: "#6a4630" },
  M: { jacket: "#8a3b4f", pants: "#3a3348", shoes: "#1b1a22", hair: "long", hairColor: "#3b2a24" },
  H: { jacket: "#e4e8ec", pants: "#d5dbe1", shoes: "#2a2d33", mask: true, hair: "none" },
  A: { jacket: "#3f6f5a", pants: "#2e3040", shoes: "#1b1a22", hair: "short", hairColor: "#8d8d96" },
  B: { jacket: "#a0522d", pants: "#2e3040", shoes: "#1b1a22", hair: "short", hairColor: "#24201f" },
  C: { jacket: "#5b4f8a", pants: "#34304a", shoes: "#1b1a22", hair: "long", hairColor: "#c9c3b8" },
};
type Fo = { mode: "stand" | "sit"; expr: CharSpec["expr"]; blink?: boolean; look?: number; wave?: number; throat?: boolean; back?: boolean; side?: 1 | -1; reach?: number };
const tierOf = (d: number): [number, number, number] => (d < 3.5 ? [1080, 1800, 1.8] : d < 14 ? [600, 1000, 1] : [300, 500, 0.5]);
const MEN: V3[] = [[-3.2, 0, 10.5], [1.0, 0, 11], [4.6, 0, 9.8], [-1.2, 0, 14.2], [3.0, 0, 15], [-5.6, 0, 15.5], [7.0, 0, 13.5]];

class Screen {
  cv = document.createElement("canvas"); tex: THREE.CanvasTexture; mesh: THREE.Mesh; last = "";
  constructor(w: number, h: number, mw: number, mh: number) {
    this.cv.width = w; this.cv.height = h; this.tex = new THREE.CanvasTexture(this.cv); this.tex.colorSpace = THREE.SRGBColorSpace;
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(mw, mh), new THREE.MeshBasicMaterial({ map: this.tex, transparent: true, depthWrite: false })); this.mesh.layers.set(NOINK);
  }
  draw(key: string, fn: (g: CanvasRenderingContext2D, w: number, h: number) => void) { if (key === this.last) return; this.last = key; const g = this.cv.getContext("2d")!; g.clearRect(0, 0, this.cv.width, this.cv.height); fn(g, this.cv.width, this.cv.height); this.tex.needsUpdate = true; }
}

export class World {
  root = new THREE.Group();
  sun: THREE.DirectionalLight; private hemi: THREE.HemisphereLight; private fog = new THREE.Fog("#000", 10, 100);
  private pool = new Pool(); private actors: Actor[] = [];
  private wins: THREE.InstancedMesh; private winCol = new THREE.Color();
  private neons: THREE.Mesh[] = []; private neonGlow: THREE.Mesh[] = []; private lamps: { m: THREE.Mesh; side: number; z: number }[] = [];
  private greens: THREE.Mesh[] = []; private traffic!: THREE.Mesh; private ledIn!: THREE.Mesh; private spkOut!: THREE.Group; private door!: THREE.Group;
  private fogs: THREE.Mesh[] = []; private halo!: THREE.Mesh; private ash: THREE.Points; private ashBase: Float32Array; private stairRed!: THREE.Mesh; private sodium!: THREE.Mesh; private sodiumBulb!: THREE.Mesh;
  private rdoor!: THREE.Group; private handle!: THREE.Mesh; private rwall!: THREE.Mesh; private section!: THREE.Group; private bulb!: THREE.Group; private boots!: THREE.Group; private cdoors: { g: THREE.Group; side: number; z: number }[] = [];
  constructor() {
    const R = this.root;
    this.hemi = new THREE.HemisphereLight("#7f9ac0", "#20242a", 0.22); R.add(this.hemi);
    this.sun = new THREE.DirectionalLight(NIGHT.sunCol, NIGHT.sunI); this.sun.castShadow = true; R.add(this.sun, this.sun.target);
    const b = new Batch();
    // ---------- tour ----------
    const modA = module(); modA.wrapS = modA.wrapT = THREE.RepeatWrapping;
    const facade = solid("facade", "#ffffff", { map: modA });
    const wx0 = WIN[0] - WIN_W / 2, wx1 = WIN[0] + WIN_W / 2, wy0 = WIN[1] - WIN_H / 2, wy1 = WIN[1] + WIN_H / 2;
    const fA = (x0: number, x1: number, y0: number, y1: number) => b.add(facePlane("z", 0, x0, x1, y0, y1, COLW, FLH), facade);
    fA(-HALFW, wx0, 0, TOWER_H); fA(wx1, HALFW, 0, TOWER_H); fA(wx0, wx1, 0, wy0); fA(wx0, wx1, wy1, TOWER_H);
    b.add(facePlane("x", B_X, 0, 100, 0, TOWER_H, COLW, FLH, true), facade);
    const conc = solid("concrete", "#ffffff", { map: concrete() }), dead = solid("deadwin", "#ffffff", { map: deadWin() });
    (dead.map as THREE.Texture).wrapS = (dead.map as THREE.Texture).wrapT = THREE.RepeatWrapping; (conc.map as THREE.Texture).wrapS = (conc.map as THREE.Texture).wrapT = THREE.RepeatWrapping;
    const wallBox = (x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, m: THREE.Material, rep = 0.08) => {
      const g = new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0); const uv = g.attributes.uv as THREE.BufferAttribute;
      for (let i = 0; i < uv.count; i++) { const f = Math.floor(i / 4), w = [z1 - z0, z1 - z0, x1 - x0, x1 - x0, x1 - x0, x1 - x0][f], h = [y1 - y0, y1 - y0, z1 - z0, z1 - z0, y1 - y0, y1 - y0][f]; uv.setXY(i, uv.getX(i) * w * rep, uv.getY(i) * h * rep); }
      b.add(g.translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2), m);
    };
    wallBox(-HALFW, TOWER_H, -20, HALFW, TOWER_H + 2.4, 0, conc); wallBox(-HALFW - 0.4, 0, -20, -HALFW, TOWER_H + 2.4, 0, dead, 0.12); wallBox(-HALFW, 0, -20.4, HALFW + 20, TOWER_H, -20, dead, 0.12);
    wallBox(B_X, TOWER_H, -20, B_X + 20, TOWER_H + 2.4, 100, conc); wallBox(B_X, 0, 100, B_X + 20, TOWER_H, 100.4, dead, 0.12); wallBox(B_X + 20, 0, -20, B_X + 20.4, TOWER_H, 100, dead, 0.12);
    for (let k = 0; k < 6; k++) wallBox(-30 + k * 14, TOWER_H + 2.4, -14, -24 + k * 14, TOWER_H + 7 + hash(k) * 6, -6, conc);   // locaux techniques sur le toit
    for (let k = 0; k < 4; k++) b.add(new THREE.CylinderGeometry(0.15, 0.15, 22 + k * 6, 6).translate(-40 + k * 25, TOWER_H + 12 + k * 3, -10), solid("mast", "#2a2e33"));   // antennes
    // fenêtres (instances) : face A (z = 0) et face B (x = 50)
    const wg = new THREE.PlaneGeometry(1.4, 1.75);
    this.wins = new THREE.InstancedMesh(wg, new THREE.MeshBasicMaterial({ map: winTex(), color: "#ffffff", polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 }), 2 * COLS * FLOORS);
    const mm = new THREE.Matrix4(), q = new THREE.Quaternion().setFromAxisAngle(V(0, 1, 0), -Math.PI / 2);
    for (let face = 0; face < 2; face++) for (let fl = 0; fl < FLOORS; fl++) for (let c = 0; c < COLS; c++) {
      const i = (face * FLOORS + fl) * COLS + c, y = fl * FLH + 1.42;
      if (face === 0) mm.compose(V(colX(c), y, 0.04), new THREE.Quaternion(), V(1, 1, 1)); else mm.compose(V(B_X - 0.04, y, COLW * (c + 0.5)), q, V(1, 1, 1));
      if (face === 0 && c === MY_COL && fl === MY_FLOOR) mm.makeScale(0, 0, 0);
      this.wins.setMatrixAt(i, mm); this.wins.setColorAt(i, new THREE.Color(0, 0, 0));
    }
    this.wins.layers.set(NOINK); this.wins.frustumCulled = false; R.add(this.wins);
    // ta fenêtre : tableau, appui, rideau (vus de dehors comme de dedans)
    const frameM = solid("winframe", "#1c2024");
    box(b, frameM, wx0 - 0.08, wy0 - 0.12, -0.3, wx1 + 0.08, wy0, 0.12); box(b, frameM, wx0 - 0.08, wy1, -0.3, wx1 + 0.08, wy1 + 0.08, 0.05);
    box(b, frameM, wx0 - 0.08, wy0, -0.3, wx0, wy1, 0.05); box(b, frameM, wx1, wy0, -0.3, wx1 + 0.08, wy1, 0.05);
    box(b, solid("curtain", "#6a2f3a"), wx0 - 0.4, wy0 - 0.5, -0.42, wx0 - 0.05, wy1 + 0.3, -0.32);
    // haut-parleur à pavillon sur la façade + haut-parleurs sur mâts dans la cour
    const metal = solid("metal", "#868b84"), dark = solid("darkmetal", "#23262a");
    this.spkOut = new THREE.Group(); const horn = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.1, 0.7, 20, 1, true).rotateX(Math.PI / 2 + 0.35), metal); horn.material.side = THREE.DoubleSide;
    const back = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.3, 12).rotateX(Math.PI / 2 + 0.35).translate(0, 0.13, -0.38), dark);
    this.spkOut.add(horn, back); this.spkOut.position.set(...SPK_OUT); R.add(this.spkOut);
    box(b, dark, SPK_OUT[0] - 0.05, SPK_OUT[1] - 0.05, 0, SPK_OUT[0] + 0.05, SPK_OUT[1] + 0.3, SPK_OUT[2] - 0.3);
    b.add(new THREE.CylinderGeometry(0.012, 0.012, 6, 4).translate(SPK_OUT[0] + 0.2, SPK_OUT[1] - 3, 0.04), dark);           // câble
    for (const [x, z] of [[-14, 18], [0, 24], [14, 18], [26, 30]]) {
      b.add(new THREE.CylinderGeometry(0.09, 0.12, 9, 8).translate(x, 4.5, z), dark);
      for (const yaw of [0, Math.PI]) b.add(new THREE.CylinderGeometry(0.45, 0.1, 0.8, 16).rotateX(Math.PI / 2 - 0.25).rotateY(yaw).translate(x, 8.6, z + (yaw ? -0.35 : 0.35)), metal);
    }
    // ---------- sol, cour, rue, ville morte ----------
    const asph = solid("asphalt", "#2c3135"); b.add(new THREE.PlaneGeometry(9000, 9000).rotateX(-Math.PI / 2), asph);
    b.add(new THREE.PlaneGeometry(100, 100).rotateX(-Math.PI / 2).translate(0, 0.02, 50), solid("court", "#3b4144"));
    for (let i = 0; i < 14; i++) b.add(new THREE.CircleGeometry(0.8 + hash(i, 2) * 2.2, 18).rotateX(-Math.PI / 2).translate(-30 + hash(i) * 70, 0.04, 5 + hash(i, 1) * 40), solid("puddle", "#181c20"));   // flaques
    b.add(new THREE.PlaneGeometry(400, 14).rotateX(-Math.PI / 2).translate(-40, 0.03, 130), solid("road", "#24282c"));
    for (let k = 0; k < 40; k++) b.add(new THREE.PlaneGeometry(3, 0.25).rotateX(-Math.PI / 2).translate(-230 + k * 10, 0.05, 130), solid("roadline", "#8b8a70"));
    const carCols = ["#5a2f2f", "#2f4a5a", "#5f5f52", "#3a3550", "#6b5233", "#2f4f3c"];
    for (let k = 0; k < 9; k++) {
      const x = -120 + k * 19 + hash(k) * 8, z = 125 + (k % 2) * 9 + hash(k, 1) * 1.5, yaw = (hash(k, 2) - 0.5) * 0.6, m = solid("car" + (k % 6), carCols[k % 6]);
      const body = new THREE.BoxGeometry(4.2, 0.85, 1.8).translate(0, 0.75, 0), cab = new THREE.BoxGeometry(2.2, 0.7, 1.6).translate(-0.2, 1.5, 0);
      for (const g of [body, cab]) b.add(g.rotateY(yaw).translate(x, 0, z), m);
      b.add(new THREE.BoxGeometry(2.0, 0.55, 1.62).translate(-0.2, 1.52, 0).rotateY(yaw).translate(x, 0, z), solid("carglass", "#101418"));
      for (const [dx, dz] of [[-1.3, 0.85], [1.3, 0.85], [-1.3, -0.85], [1.3, -0.85]]) b.add(new THREE.CylinderGeometry(0.38, 0.38, 0.3, 12).rotateX(Math.PI / 2).translate(dx, 0.38, dz).rotateY(yaw).translate(x, 0, z), solid("tyre", "#111214"));
    }
    b.add(new THREE.CylinderGeometry(0.1, 0.1, 5, 8).translate(-60, 2.5, 138.5), dark); box(b, dark, -60.25, 4.2, 138.3, -59.75, 5.6, 138.8);
    this.traffic = new THREE.Mesh(new THREE.CircleGeometry(0.16, 16), basic("#ffaa30")); this.traffic.position.set(-60, 4.9, 138.82); this.traffic.layers.set(NOINK); R.add(this.traffic);
    // réverbères au sodium (un seul encore allumé, qui grésille) : halos additifs
    for (const [x, z] of [[-62, 121.5], [-110, 121.5]]) { b.add(new THREE.CylinderGeometry(0.09, 0.12, 7, 8).translate(x, 3.5, z), dark); box(b, dark, x - 0.1, 6.9, z, x + 0.1, 7.05, z + 1.6); }
    this.sodium = new THREE.Mesh(new THREE.PlaneGeometry(26, 26).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: glowTex("255,150,60"), transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false }));
    this.sodium.position.set(-62, 0.06, 123); this.sodium.layers.set(NOINK); R.add(this.sodium);
    const bulb = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 2.2), this.sodium.material); bulb.position.set(-62, 6.85, 122.9); bulb.layers.set(NOINK); R.add(bulb); this.sodiumBulb = bulb;
    // immeubles éteints : alignés le long de la rue + anneau lointain
    const bld = (x: number, z: number, w: number, d: number, h: number) => wallBox(x - w / 2, 0, z - d / 2, x + w / 2, h, z + d / 2, dead, 0.12);
    for (let k = 0; k < 18; k++) bld(-210 + k * 22, 152 + hash(k, 3) * 4, 16 + hash(k) * 4, 16, 14 + hash(k, 1) * 36);
    for (let k = 0; k < 8; k++) bld(-210 + k * 22, 108, 16, 14, 10 + hash(k, 5) * 24);
    cityBlocks(bld, hash);                                             // ville en îlots, bien plus basse que la tour
    // ---------- ton appartement (derrière ta fenêtre) : x ∈ [-0,85 ; 3,35], z ∈ [-4,5 ; -0,3] ----------
    const rw = solid("roomwall", "#ffffff", { map: roomWall() }); (rw.map as THREE.Texture).wrapS = (rw.map as THREE.Texture).wrapT = THREE.RepeatWrapping;
    const X0 = -0.85, X1 = 3.35, Z0 = -4.5;
    box(b, solid("roomfloor", "#ffffff", { map: lino() }), X0, Y0 - 0.1, Z0, X1, Y0, -0.3); box(b, solid("roomceil", "#2b3330"), X0, Y0 + 2.6, Z0, X1, Y0 + 2.7, -0.3);
    box(b, rw, X0 - 0.1, Y0, Z0, X0, Y0 + 2.6, -0.3); box(b, rw, X0, Y0, Z0 - 0.1, X1, Y0 + 2.6, Z0);
    box(b, rw, X0, Y0, -0.42, wx0, Y0 + 2.6, -0.3); box(b, rw, wx1, Y0, -0.42, X1, Y0 + 2.6, -0.3); box(b, rw, wx0, Y0, -0.42, wx1, wy0 - 0.12, -0.3); box(b, rw, wx0, wy1 + 0.08, -0.42, wx1, Y0 + 2.6, -0.3);
    const bedFrame = solid("bedframe", "#3b3f45"), mattress = solid("mattress", "#c9c6bb");
    box(b, bedFrame, 1.9, Y0, -3.4, 3.25, Y0 + 0.32, -1.6); box(b, mattress, 1.95, Y0 + 0.32, -3.35, 3.2, Y0 + 0.44, -1.65); box(b, solid("blanketA", "#ffffff", { map: blanket("#7a3b3b") }), 1.95, Y0 + 0.44, -2.9, 3.2, Y0 + 0.5, -1.62);
    box(b, bedFrame, 0.85, Y0, -3.4, 1.85, Y0 + 0.32, -1.6); box(b, mattress, 0.9, Y0 + 0.32, -3.35, 1.8, Y0 + 0.44, -1.65); box(b, solid("blanketB", "#ffffff", { map: blanket("#3b5a7a") }), 0.9, Y0 + 0.44, -2.9, 1.8, Y0 + 0.5, -1.62);
    box(b, solid("pillow", "#dcd8cc"), 2.1, Y0 + 0.44, -3.33, 3.05, Y0 + 0.58, -3.0); box(b, solid("pillow", "#dcd8cc"), 1.0, Y0 + 0.44, -3.33, 1.7, Y0 + 0.56, -3.02);
    const wood = solid("wood", "#4a3628"); box(b, wood, -0.7, Y0 + 0.72, -2.4, 0.3, Y0 + 0.77, -1.2); for (const [x, z] of [[-0.65, -2.35], [0.25, -2.35], [-0.65, -1.25], [0.25, -1.25]]) box(b, wood, x - 0.03, Y0, z - 0.03, x + 0.03, Y0 + 0.72, z + 0.03);
    b.add(new THREE.CylinderGeometry(0.04, 0.035, 0.1, 12).translate(-0.3, Y0 + 0.82, -1.8), solid("cup", "#c8ccd2"));
    this.rdoor = new THREE.Group(); this.rdoor.add(new THREE.Mesh(new THREE.BoxGeometry(0.9, 2.02, 0.05).translate(-0.45, 1.04, 0.04), solid("roomdoor", "#5a4a38")));
    const hd = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.035, 0.05).translate(0.05, 0, 0), solid("handle", "#b9b2a0")); hd.position.set(HANDLE[0] - 3.25, HANDLE[1] - Y0, 0.1); this.rdoor.add(hd); this.handle = hd;
    { const rose = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.02, 14).rotateX(Math.PI / 2), solid("handle", "#b9b2a0")); rose.position.set(HANDLE[0] - 3.25, HANDLE[1] - Y0, 0.075); this.rdoor.add(rose); }
    this.rwall = new THREE.Mesh(new THREE.BoxGeometry(0.1, 2.6, Z0 * -1 - 0.3).translate(X1 + 0.05, Y0 + 1.3, (Z0 - 0.3) / 2), rw); R.add(this.rwall);
    // décor en coupe : couloir derrière ta porte + tranches noires (vue « maison de poupée »)
    this.section = new THREE.Group(); R.add(this.section);
    { const sm = (w: number, h: number, d: number, x: number, y: number, z: number, m: THREE.Material) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); this.section.add(o); return o; };
      const til = solid("tiles", "#ffffff", { map: tiles() }), black = basic("#060608");
      sm(2.9, 0.1, 2.0, 1.95, Y0 - 0.05, Z0 - 1.1, solid("lino3", "#ffffff", { map: lino() })); sm(2.9, 0.1, 2.0, 1.95, Y0 + 2.65, Z0 - 1.1, solid("ceil2", "#2b302d")); sm(2.9, 2.6, 0.1, 1.95, Y0 + 1.3, Z0 - 2.15, til);
      sm(0.06, 3.05, 0.34, X1 + 0.13, Y0 + 1.3, Z0 - 0.04, black);                                                                   // mur coupé (porte) en noir
      sm(0.06, 0.45, 6.6, X1 + 0.13, Y0 - 0.22, Z0 + 2.0, black); sm(0.06, 0.45, 6.6, X1 + 0.13, Y0 + 2.82, Z0 + 2.0, black);              // dalles coupées
      const ng = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.05, 0.08), basic("#d9f2ff")); ng.position.set(1.9, Y0 + 2.57, Z0 - 1.2); ng.layers.set(NOINK); this.section.add(ng); }
    // ampoule qui pend (la nuit, dans la chambre)
    this.bulb = new THREE.Group(); R.add(this.bulb);
    { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.45, 4), basic("#111")); w.position.set(1.25, Y0 + 2.38, -2.4); this.bulb.add(w);
      const bl = new THREE.Mesh(new THREE.SphereGeometry(0.055, 14, 10), basic("#ffe2b0")); bl.position.set(1.25, Y0 + 2.12, -2.4); bl.layers.set(NOINK); this.bulb.add(bl);
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex("255,205,140"), transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false })); sp.scale.set(1.3, 1.3, 1); sp.position.copy(bl.position); sp.layers.set(NOINK); this.bulb.add(sp);
      const pool = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 3.2).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: glowTex("255,200,140"), transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false })); pool.position.set(1.25, Y0 + 0.012, -2.4); pool.layers.set(NOINK); this.bulb.add(pool); }
    this.rdoor.position.set(3.25, Y0, Z0); R.add(this.rdoor);
    { const st = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.7).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: glowTex("190,215,255"), transparent: true, opacity: 0.75, blending: THREE.AdditiveBlending, depthWrite: false }));
      st.position.set(2.8, Y0 + 0.006, Z0 + 0.05); st.layers.set(NOINK); R.add(st);
      const ln = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.02), basic("#cfe3ff")); ln.position.set(2.8, Y0 + 0.012, Z0 + 0.075); ln.layers.set(NOINK); R.add(ln);
      this.boots = new THREE.Group(); for (const dx of [-0.13, 0.13]) { const bt = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.5).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: "#000000", transparent: true, opacity: 0.85, depthWrite: false })); bt.position.set(2.8 + dx, Y0 + 0.009, Z0 + 0.2); bt.layers.set(NOINK); this.boots.add(bt); }
      R.add(this.boots); }
    const pinned = (tex: THREE.Texture, w: number, h: number, pos: V3, yaw: number) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), solid("tex_" + tex.uuid, "#ffffff", { map: tex })); m.position.set(...pos); m.rotation.y = yaw; R.add(m); return m; };
    pinned(drawing(), 0.36, 0.45, [0.3, Y0 + 1.5, Z0 + 0.03], 0);
    pinned(poster(4, ["APRÈS L'APPEL,", "ON N'OUVRE SA", "PORTE À", "PERSONNE."]), 0.36, 0.47, [1.7, Y0 + 1.38, Z0 + 0.03], 0);
    pinned(poster(2, ["ON NE RÉPOND", "JAMAIS POUR", "UN AUTRE.", "", "CELUI QUI MENT", "DESCEND AVEC LUI."]), 0.48, 0.63, [2.8, Y0 + 1.45, Z0 + 0.08], 0);
    pinned(poster(3, ["PENDANT", "L'APPEL, ON NE", "REGARDE JAMAIS", "EN BAS."]), 0.36, 0.47, [2.62, Y0 + 1.7, -0.44], Math.PI);
    pinned(plate("2417", "2418"), 0.32, 0.16, [2.8, Y0 + 2.2, Z0 + 0.07], 0);
    box(b, dark, SPK_IN[0] - 0.24, SPK_IN[1] - 0.18, Z0, SPK_IN[0] + 0.24, SPK_IN[1] + 0.18, Z0 + 0.08);
    pinned(grille(), 0.42, 0.3, [SPK_IN[0], SPK_IN[1], Z0 + 0.085], 0);
    this.ledIn = new THREE.Mesh(new THREE.CircleGeometry(0.018, 10), basic("#ff2a20")); this.ledIn.position.set(SPK_IN[0] + 0.19, SPK_IN[1] - 0.14, Z0 + 0.09); this.ledIn.layers.set(NOINK); R.add(this.ledIn);
    // ---------- couloir (sous terre, y = CY) : x ∈ [-1,3 ; 1,3], z ∈ [-30 ; 0] ----------
    const tw = solid("tiles", "#ffffff", { map: tiles() }); (tw.map as THREE.Texture).wrapS = (tw.map as THREE.Texture).wrapT = THREE.RepeatWrapping;
    const lin = solid("lino2", "#ffffff", { map: lino() }); (lin.map as THREE.Texture).wrapS = (lin.map as THREE.Texture).wrapT = THREE.RepeatWrapping;
    const cb = (x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, m: THREE.Material, rep = 0.6) => wallBox(x0, CY + y0, z0, x1, CY + y1, z1, m, rep);
    cb(-1.3, -0.1, -30, 1.3, 0, 1, lin, 0.7); cb(-1.3, 2.6, -30, 1.3, 2.7, 1, solid("ceil2", "#2b302d")); cb(-1.4, 0, 0, 1.4, 2.6, 1.1, tw);
    for (const sx of [-1, 1]) {
      let zPrev = 1;
      for (const dz of DOOR_Z) { cb(sx < 0 ? -1.4 : 1.3, 0, dz + 0.55, sx < 0 ? -1.3 : 1.4, 2.6, zPrev, tw); cb(sx < 0 ? -1.4 : 1.3, 2.1, dz - 0.55, sx < 0 ? -1.3 : 1.4, 2.6, dz + 0.55, tw);
        { const g = new THREE.Group(); g.add(new THREE.Mesh(new THREE.BoxGeometry(0.05, 2.08, 1.0).translate(0, 1.04, 0.5), solid("cdoor", "#4b4136"))); g.position.set(sx * 1.66, CY, dz - 0.5); R.add(g); this.cdoors.push({ g, side: sx, z: dz });
          const gw = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 2.1), new THREE.MeshBasicMaterial({ map: glowTex("255,205,140"), transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false }));
          gw.position.set(sx * 2.4, CY + 1.05, dz); gw.rotation.y = sx < 0 ? Math.PI / 2 : -Math.PI / 2; gw.layers.set(NOINK); R.add(gw);
          cb(sx < 0 ? -2.6 : 1.4, -0.02, dz - 0.5, sx < 0 ? -1.4 : 2.6, 0, dz + 0.5, lin); }                                  // seuil
        const pm = pinned(plate(String(2400 + Math.round(-dz * 2) + (sx > 0 ? 1 : 0))), 0.26, 0.13, [sx * 1.295, CY + 2.25, dz], sx < 0 ? Math.PI / 2 : -Math.PI / 2); void pm;
        const lp = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, 0.14), basic("#101010")); lp.position.set(sx * 1.27, CY + 2.42, dz + 0.3); lp.layers.set(NOINK); R.add(lp); this.lamps.push({ m: lp, side: sx, z: dz });
        zPrev = dz - 0.55; }
      cb(sx < 0 ? -1.4 : 1.3, 0, -30, sx < 0 ? -1.3 : 1.4, 2.6, zPrev, tw);
    }
    pinned(poster(1, ["QUAND ON APPELLE", "TON NUMÉRO,", "TU RÉPONDS.", "", "À VOIX HAUTE."]), 0.5, 0.66, [-1.285, CY + 1.5, -2.9], Math.PI / 2);
    for (let k = 0; k < 7; k++) {                                     // néons (certains grésillent)
      const n = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.05, 1.3), basic("#d9f2ff")); n.position.set(0, CY + 2.56, -2 - k * 4); n.layers.set(NOINK); R.add(n); this.neons.push(n);
      const gl = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 3.2).rotateX(Math.PI / 2), new THREE.MeshBasicMaterial({ map: glowTex("180,225,255"), transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false }));
      gl.position.set(0, CY + 2.58, -2 - k * 4); gl.layers.set(NOINK); R.add(gl); this.neonGlow.push(gl);
      const fl = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 3.2).rotateX(-Math.PI / 2), gl.material); fl.position.set(0, CY + 0.01, -2 - k * 4); fl.layers.set(NOINK); R.add(fl); this.neonGlow.push(fl);
    }
    // porte du sous-sol + panneau
    this.door = new THREE.Group(); const dm = new THREE.Mesh(new THREE.BoxGeometry(1.3, 2.1, 0.07).translate(0.65, 1.05, 0), solid("steeldoor", "#5d6466")); this.door.add(dm);
    this.door.position.set(-0.65, CY, -29.95); R.add(this.door);
    const sg = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.3), basic("#ffffff", { map: sign() })); sg.position.set(0, CY + 2.35, -29.85); sg.layers.set(NOINK); R.add(sg);
    // cage d'escalier : x ∈ [-2,2 ; 2,2], z ∈ [-34,4 ; -30], 12 niveaux vers le bas
    cb(-2.3, -40, -34.6, 2.3, 0, -34.4, tw, 0.4); cb(-2.4, -40, -34.6, -2.2, 2.6, -30, tw, 0.4); cb(2.2, -40, -34.6, 2.4, 2.6, -30, tw, 0.4); cb(-2.3, -40, -30.1, -0.7, 0, -29.95, tw, 0.4); cb(0.7, -40, -30.1, 2.3, 0, -29.95, tw, 0.4);
    cb(-2.2, -0.1, -30.1, 2.2, 0, -29.95, lin);
    const step = solid("step", "#59605c"), rail = solid("rail", "#1e2124");
    for (let lv = 0; lv < 12; lv++) {
      const y0 = -lv * 3;
      for (let s = 0; s < 4; s++) {                                    // 4 volées autour du vide central (1,6 x 1,6 m)
        for (let k = 0; k < 5; k++) { const yy = y0 - (s * 5 + k + 1) * 0.15, t = (k + 0.5) / 5;
          const [x, z] = s === 0 ? [1.5, -30.6 - t * 3.2] : s === 1 ? [1.5 - t * 3.0, -33.8] : s === 2 ? [-1.5, -33.8 + t * 3.2] : [-1.5 + t * 3.0, -30.6];
          const [w, d] = s % 2 === 0 ? [1.3, 0.64] : [0.6, 1.2]; cb(x - w / 2, yy - 0.1, z - d / 2, x + w / 2, yy, z + d / 2, step); }
        const ry = y0 - s * 0.75 - 0.4; if (s % 2 === 0) cb(s === 0 ? 0.82 : -0.86, ry, -33.4, s === 0 ? 0.86 : -0.82, ry + 0.9, -31, rail); else cb(-0.8, ry, s === 1 ? -33.0 : -31.2, 0.8, ry + 0.9, s === 1 ? -32.96 : -31.16, rail);
      }
    }
    this.stairRed = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 4.4).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: glowTex("255,40,30"), transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false }));
    this.stairRed.position.set(0, CY - 37, -32.2); this.stairRed.layers.set(NOINK); R.add(this.stairRed);
    for (let lv = 1; lv < 12; lv += 3) { const r = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 3.6).rotateX(-Math.PI / 2), this.stairRed.material); r.position.set(0, CY - lv * 3 - 0.3, -32.2); r.scale.setScalar(0.4 + lv * 0.05); r.layers.set(NOINK); R.add(r); }
    this.halo = new THREE.Mesh(new THREE.PlaneGeometry(420, 560), new THREE.MeshBasicMaterial({ map: glowTex("255,175,95"), transparent: true, opacity: 0.3, fog: false, blending: THREE.AdditiveBlending, depthWrite: false }));
    this.halo.position.set(25, 130, 45); this.halo.layers.set(NOINK); this.halo.visible = false; R.add(this.halo);   // halo chaud de la dernière tour (plan d'ouverture)
    b.build(R, true);
    const seenMat = new Set<THREE.Material>();
    R.traverse((o) => { const m = o as THREE.Mesh; if (!m.isMesh || Array.isArray(m.material) || seenMat.has(m.material)) return; seenMat.add(m.material); const mt = m.material as THREE.MeshLambertMaterial;   // textures fines peintes
      if (["ap_facade", "ap_deadwin", "ap_concrete"].includes(mt.name)) painted(mt, 0.18, 0.35, 0);
      else if (["ap_asphalt", "ap_court", "ap_road"].includes(mt.name)) painted(mt, 0.3, 0.6, 0);
      else if (["ap_roomwall", "ap_tiles", "ap_lino2", "ap_roomfloor"].includes(mt.name)) painted(mt, 0.16, 4, 0);
      else if (mt.name?.startsWith("ap_car")) painted(mt, 0.25, 3, 0);
    });
    // ciel, brume, cendres
    const sky = new THREE.Mesh(new THREE.SphereGeometry(5000, 24, 16), new THREE.MeshBasicMaterial({ map: skyTex(), side: THREE.BackSide, fog: false, depthWrite: false })); sky.layers.set(NOINK); sky.renderOrder = -1; R.add(sky);
    const moon = new THREE.Mesh(new THREE.PlaneGeometry(260, 260), new THREE.MeshBasicMaterial({ map: glowTex("210,235,230"), transparent: true, fog: false, blending: THREE.AdditiveBlending, depthWrite: false })); moon.position.set(-1400, 1900, 3200); moon.lookAt(0, 0, 0); moon.layers.set(NOINK); R.add(moon);
    const ft = fogTex();
    for (let i = 0; i < 10; i++) { const m = new THREE.Mesh(new THREE.PlaneGeometry(160, 50), new THREE.MeshBasicMaterial({ map: ft, color: "#7d8c8a", transparent: true, opacity: 0.18, depthWrite: false })); m.position.set(-40 + hash(i, 21) * 120, 20 + hash(i, 22) * 160, 20 + hash(i, 23) * 120); m.layers.set(NOINK); R.add(m); this.fogs.push(m); }
    const NA = 500, ap = new Float32Array(NA * 3); this.ashBase = Float32Array.from({ length: NA * 3 }, (_, i) => hash(i, 31));
    const ag = new THREE.BufferGeometry(); ag.setAttribute("position", new THREE.BufferAttribute(ap, 3));
    this.ash = new THREE.Points(ag, new THREE.PointsMaterial({ map: glowTex("220,225,215"), size: 0.05, transparent: true, opacity: 0.6, depthWrite: false, blending: THREE.AdditiveBlending })); this.ash.frustumCulled = false; this.ash.layers.set(NOINK); R.add(this.ash);
    // flaques de lumière froide sous les hommes en blanc (projecteurs de la cour)
    for (const p of [[-3.2, 10.5], [1.0, 11], [4.6, 9.8], [-1.2, 14.2], [3.0, 15], [-5.6, 15.5], [7.0, 13.5]]) { const m = new THREE.Mesh(new THREE.PlaneGeometry(5.5, 5.5).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: glowTex("190,225,255"), transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false })); m.position.set(p[0], 0.07, p[1]); m.layers.set(NOINK); R.add(m); }
    // lumière verte qui entre par la fenêtre
    for (const [w, h, pos, rot] of [[3.4, 2.6, [1.25, Y0 + 1.3, Z0 + 0.05], [0, 0, 0]], [3.4, 3.4, [1.25, Y0 + 2.58, -1.6], [Math.PI / 2, 0, 0]], [2.6, 2.6, [1.25, Y0 + 0.02, -1.4], [-Math.PI / 2, 0, 0]]] as [number, number, V3, [number, number, number]][]) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: glowTex("60,255,130"), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
      m.position.set(...pos); m.rotation.set(...rot); m.layers.set(NOINK); R.add(m); this.greens.push(m);
    }
    const roomNeon = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.05, 0.07), basic("#d9f2ff")); roomNeon.position.set(1.25, Y0 + 2.56, -2.5); roomNeon.layers.set(NOINK); R.add(roomNeon); this.neons.push(roomNeon);
    const rg = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 3.4).rotateX(Math.PI / 2), new THREE.MeshBasicMaterial({ map: glowTex("170,215,255"), transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending, depthWrite: false })); rg.position.set(1.25, Y0 + 2.58, -2.5); rg.layers.set(NOINK); R.add(rg); this.neonGlow.push(rg);
    for (let i = 0; i < 14; i++) this.actors.push(new Actor(R));
  }

  /** pose le monde pour le plan id à l'image f ; renvoie le point visé */
  update(sid: number, f: number, cam: THREE.PerspectiveCamera, scene: THREE.Scene) {
    const t = f / FPS, c = camAt(sid, f), u = uOf(sid, f), id = ROLE[sid];
    cam.position.set(...c.pos); cam.up.set(0, 1, 0); cam.lookAt(...c.look); cam.rotateZ(c.roll);
    if (cam.fov !== c.fov || cam.near !== c.near || cam.far !== c.far) { cam.fov = c.fov; cam.near = c.near; cam.far = c.far; cam.updateProjectionMatrix(); }
    cam.layers.enable(NOINK); cam.updateMatrixWorld();
    const outside = c.far > 1000, inside = !outside, focus = V(...c.look);
    // lumière : lune froide venant de la cour (+z), ombres portées autour du point visé
    const L = NIGHT, sunDir = V(-0.35, 0.62, 1).normalize();
    this.sun.color.set(L.sunCol); this.sun.intensity = L.sunI; this.hemi.intensity = L.hemiI;
    const span = outside && c.pos[1] > 30 ? 120 : outside ? 30 : 7;
    this.sun.position.copy(focus).addScaledVector(sunDir, span * 3); this.sun.target.position.copy(focus);
    const sc = this.sun.shadow.camera; sc.left = -span; sc.right = span; sc.top = span; sc.bottom = -span; sc.near = 1; sc.far = span * 7; sc.updateProjectionMatrix();
    this.sun.shadow.bias = -0.0004; this.sun.shadow.normalBias = 0.02 * (span / 7);
    const g = (c.pos[1] > 70 && c.pos[1] < 90 && c.pos[2] < 0.5) || id === 7 ? greenAt(id) : 0;           // vert dans l'appartement (rappel)
    TONE.uLitCol.value.set(L.lit[0] * (1 - 0.3 * g), L.lit[1] * (1 + 0.6 * g), L.lit[2] * (1 - 0.1 * g));
    TONE.uShadeCol.value.set(L.shade[0], L.shade[1] + 0.12 * g, L.shade[2]);
    TONE.uShadeLift.value.set(...L.lift); TONE.uLambert.value = 0.35; TONE.uSideK.value = 0.84; TONE.uTerm.value = 0.2; TONE.uBounce.value.set(0, 0, 0); TONE.uSat.value = L.sat;
    CHAR.uCharTint.value.set(L.charTint[0] * (1 - 0.25 * g), L.charTint[1] * (1 + 0.35 * g), L.charTint[2] * (1 - 0.1 * g)); CHAR.uCharShade.value = 0.72; CHAR.uGrad.value = 0.09; CHAR.uBodyGrad.value = 0.22; CHAR.uSideTint.value.set(0.8, 0.86, 1.0);
    const F = outside ? FOG_OUT : FOG_IN; untone(F.col, this.fog.color); this.fog.near = F.near; this.fog.far = id === 60 ? 5200 : id === 36 || id === 2 ? 4500 : F.far; scene.fog = this.fog; scene.background = new THREE.Color(outside ? "#0b1014" : "#05070a");
    if (id === 60) { this.fog.color.set("#0a1222"); this.fog.near = 260; scene.background = new THREE.Color("#060a14"); }
    this.halo.visible = id === 60; if (id === 60) { this.halo.lookAt(cam.position); (this.halo.material as THREE.MeshBasicMaterial).opacity = 0.13 * smooth(u * 2.5); }
    for (const m of this.greens) (m.material as THREE.MeshBasicMaterial).opacity = g * 0.9;
    // fenêtres de la tour
    if (outside || id === 4) {
      for (let face = 0; face < 2; face++) for (let fl = 0; fl < FLOORS; fl++) for (let cc = 0; cc < COLS; cc++) {
        const st = winState(face, cc, fl, t), h = hash(cc * 31 + fl, face);
        if (id === 60) { const r = hash(cc * 17 + fl * 7, face + 9); if (r < 0.36) this.winCol.setRGB(2.3 + 0.6 * h, 1.2 + 0.3 * h, 0.45); else if (r < 0.44) this.winCol.setRGB(0.45, 1.25, 2.3); else if (st === 2) this.winCol.setRGB(2.4, 0.2, 0.15); else this.winCol.setRGB(0.06, 0.07, 0.1);
          this.wins.setColorAt((face * FLOORS + fl) * COLS + cc, this.winCol); continue; }   // plan d'ouverture : la dernière tour habitée, allumée
        const far = id === 36 || id === 2 || id === 10 ? 1.8 : 1; if (st === 4) this.winCol.setRGB(1.7 * far, 1.15 * far, 0.6 * far); else if (st === 1) this.winCol.setRGB(0.25 * far, (1.5 + 0.25 * h) * far, 0.55 * far); else if (st === 2) this.winCol.setRGB(1.9 * far, 0.16, 0.12);
        else if (st === 3) this.winCol.setRGB(0.55, 0.3, 0.12); else this.winCol.setRGB(0.05 + 0.03 * h, 0.06 + 0.03 * h, 0.08 + 0.04 * h);
        this.wins.setColorAt((face * FLOORS + fl) * COLS + cc, this.winCol);
      }
      this.wins.instanceColor!.needsUpdate = true;
    }
    this.wins.visible = outside || id === 4;
    // petites choses qui bougent
    this.traffic.visible = Math.floor(t * 1.4) % 2 === 0;
    { const on = hash(Math.floor(f / 3), 5) > 0.12; (this.sodium.material as THREE.MeshBasicMaterial).opacity = on ? 0.55 : 0.15; this.sodiumBulb.lookAt(cam.position); }
    const spk = (id === 6 || id === 33) ? 1 : 0; this.spkOut.position.set(SPK_OUT[0] + spk * 0.006 * Math.sin(f * 2.1), SPK_OUT[1] + spk * 0.005 * Math.sin(f * 2.7), SPK_OUT[2]);
    this.ledIn.visible = id === 11 || (id === 112 && u > 0.4) || id === 12 || id === 13 || id === 110;
    this.neons.forEach((n, k) => { const fl = (k === 2 || k === 5 || k === 7) && hash(Math.floor(f / 2), k) < 0.18; const off = (t > tW(71) && k === 7) || fl; n.visible = !off; });
    this.neonGlow.forEach((n, k) => { const src = this.neons[Math.min(this.neons.length - 1, Math.floor(k / 2))]; n.visible = k === this.neonGlow.length - 1 ? this.neons[this.neons.length - 1].visible : src.visible; });
    for (const lp of this.lamps) { const neigh = lp.side < 0 && lp.z === -16; (lp.m.material as THREE.MeshBasicMaterial).color.set(neigh ? (t > T_RED + 0.2 ? "#ff2418" : "#28ff6a") : hash(lp.z * 7 + lp.side, 2) < 0.2 ? "#ff2418" : "#28ff6a"); }   // voyants (celui du voisin passe au rouge)
    this.door.rotation.y = id === 61 || id === 23 || id === 38 || id === 100 ? -1.35 : 0; this.stairRed.visible = true;
    { let dz = 0; for (const k of KNOCKS) { const d = t - k; if (d > 0 && d < 0.4) dz += 0.012 * Math.exp(-d * 20) * Math.sin(d * 110); }
      if (t > T_PUSH && t < T_PUSH + 1.6) dz += 0.008 * Math.sin((t - T_PUSH) * 14) * Math.sin(Math.PI * (t - T_PUSH) / 1.6);           // ça pousse
      this.rdoor.position.z = -4.5 + dz; this.rdoor.rotation.y = t > T_PUSH && t < T_PUSH + 1.6 ? 0.012 * Math.max(0, Math.sin((t - T_PUSH) * 14)) : 0;
      this.handle.rotation.z = t > T_HANDLE && t < T_PUSH + 1.6 ? -0.55 * smooth((t - T_HANDLE) / 2.0) : 0; }
    this.rwall.visible = id !== 106 && id !== 113; this.section.visible = id === 106 || id === 113; this.bulb.visible = t > tW(71) && c.pos[1] > 70 && c.pos[1] < 90;
    this.boots.visible = t > T_BOOTS;
    for (const d of this.cdoors) { const mine = d.side > 0 && d.z === MY_DOOR_Z, neigh = d.side < 0 && d.z === -16, to = tW(210) + hash(d.z * 3 + d.side, 9) * 2.2;
      const a = mine ? 0 : id === 34 ? smooth((t - to) / 0.7) * 1.35 : neigh && id === 107 ? smooth((t - T_NEIGH) / 0.8) * 1.2 : 0; d.g.rotation.y = d.side > 0 ? a : -a; }
    for (const m of this.fogs) { m.quaternion.copy(cam.quaternion); m.position.x += 0; }
    this.fogs.forEach((m, i) => { m.position.x = -40 + hash(i, 21) * 120 + 6 * Math.sin(t * 0.05 + i); m.visible = outside; });
    const pa = this.ash.geometry.attributes.position as THREE.BufferAttribute, box = outside ? (c.pos[1] > 150 || id === 36 || id === 2 ? 0 : id === 10 || id === 15 ? 60 : 14) : 0;
    this.ash.visible = box > 0;
    if (box > 0) { for (let i = 0; i < pa.count; i++) { const bx = this.ashBase[i * 3], by = this.ashBase[i * 3 + 1], bz = this.ashBase[i * 3 + 2];
      const wrap = (v: number) => ((v % 1) + 1) % 1 - 0.5;
      pa.setXYZ(i, c.pos[0] + wrap(bx + 0.003 * Math.sin(t + i)) * box, c.pos[1] + wrap(by - t * 0.02) * box, c.pos[2] + wrap(bz + t * 0.004) * box); }
      pa.needsUpdate = true; (this.ash.material as THREE.PointsMaterial).size = box * 0.004; }

    // ---------- personnages ----------
    const yaw = (p: V3) => Math.atan2(cam.position.x - p[0], cam.position.z - p[2]);
    let k = 0;
    const place = (key: string, p: V3, fo: Fo, scale = 1, lean = 0) => {
      const A = this.actors[k++]; if (!A) return;
      const d = cam.position.distanceTo(V(p[0], p[1] + 1.1 * scale, p[2])), [w, h, kk] = tierOf(d / scale);
      A.r = this.pool.req(`${key}|${JSON.stringify(fo)}`, w, h, kk, (pen: Pen) => drawChar(pen, { ...(LOOK[key] as CharSpec), ...fo, blink: !!fo.blink, look: fo.look ?? 0, wave: fo.wave ?? 0, throat: !!fo.throat }));
      A.mesh.position.set(...p); A.mesh.up.set(0, 1, 0); A.mesh.rotation.set(lean, yaw(p), 0);
      { const dy = cam.position.y - (p[1] + 1.0 * scale), hz = Math.hypot(cam.position.x - p[0], cam.position.z - p[2]);   // vue plongeante (de haut, 3/4) : la carte se tourne vers la caméra
        if (Math.atan2(dy, hz) > 0.55) { A.mesh.up.set(0, 1, 0).applyQuaternion(cam.quaternion); A.mesh.lookAt(cam.position); A.mesh.up.set(0, 1, 0); } } A.mesh.scale.setScalar(scale); A.mesh.visible = true;
    };
    const blink = (seed: number) => (f + seed * 37) % 97 < 4;
    const lerpV = (a: V3, b: V3, w: number): V3 => [a[0] + (b[0] - a[0]) * w, a[1] + (b[1] - a[1]) * w, a[2] + (b[2] - a[2]) * w];
    // chambre : assis sur les lits
    if ([1, 3, 12, 17, 20, 112].includes(id)) {
      place("Y", YOU, { mode: "sit", expr: "worry", blink: blink(1), look: id === 17 ? 0.9 : 0 });
      const nE: Fo["expr"] = id === 3 ? "mute" : id === 20 ? "talk" : id === 12 || id === 112 ? "calm" : "worry";
      place("N", NOE, { mode: "sit", expr: nE, blink: id === 12 || id === 112 ? (f % 60 < 40) : blink(2), throat: id === 3, look: id === 17 ? 0.9 : id === 20 ? 0.6 : 0 }, 0.72);
    }
    if (id === 4 || id === 5) { place("Y", YOU_WIN, { mode: "stand", expr: "talk", blink: blink(3) }); if (id === 5) place("N", NOE, { mode: "sit", expr: "mute", throat: true }, 0.72); }
    if (id === 113) { place("Y", [2.75, Y0, -3.8], { mode: "stand", expr: "worry", blink: blink(12), side: 1, reach: 0.25 }); place("N", [2.95, Y0, -3.4], { mode: "stand", expr: "mute", side: 1 }, 0.72);
      place("H", [2.7, Y0, -5.12], { mode: "stand", expr: "calm", side: -1 }); place("H", [1.9, Y0, -5.6], { mode: "stand", expr: "calm", side: -1 }); place("H", [3.0, Y0, -5.95], { mode: "stand", expr: "calm", side: -1 }); }
    if (id === 21 || id === 115) { const w = smooth(u * 1.5), w2 = smooth((u - 0.25) * 1.6);
      place("N", lerpV([1.6, Y0, -2.3], [2.62, Y0, -3.95], w), { mode: "stand", expr: "talk" }, 0.72); place("Y", lerpV([2.4, Y0, -2.2], [2.3, Y0, -3.6], w2), { mode: "stand", expr: "worry" }); }
    const onStair = (key: string, d: number, fo: Fo, sc = 1) => { place(key, stairAt(Math.max(0, d)), fo, sc); const m = this.actors[k - 1]?.mesh; if (m) { m.up.set(0, 1, 0).applyQuaternion(cam.quaternion); m.lookAt(cam.position); m.up.set(0, 1, 0); } };
    if (id === 100) { const lead = 2.6 + 2.4 * u; for (const [key, dd] of [["H", 0], ["B", 0.6], ["H", 1.2], ["H", 3.4], ["M", 4.1]] as [string, number][]) onStair(key, lead - dd + (dd > 2 ? 1.2 : 0), key === "H" ? { mode: "stand", expr: "calm" } : { mode: "stand", expr: "mute", throat: true }, key === "M" ? 0.98 : 1); }
    if (id === 102) { place("Y", [2.3, Y0, -3.75], { mode: "stand", expr: "worry", back: true }); place("N", [2.62, Y0, -3.98], { mode: "stand", expr: "talk", back: true }, 0.72); }
    if (id === 103) place("M", YOU_WIN, { mode: "stand", expr: "mute", throat: true }, 0.98);
    if (id === 105) { place("Y", [2.72, Y0, -4.3], { mode: "stand", expr: "worry", back: true }); place("N", [1.75, Y0, -3.0], { mode: "stand", expr: "mute", blink: blink(9) }, 0.72); }
    if (id === 106) { place("Y", [2.8, Y0, -4.08], { mode: "stand", expr: "worry", blink: blink(10), side: 1, reach: 0.85 }); place("H", [2.8, Y0, -5.02], { mode: "stand", expr: "calm", side: -1, reach: 0.85 }); }
    if (id === 107) place("H", [-0.55, CY, -16.6], { mode: "stand", expr: "calm" });
    if (id === 108) place("H", [0.25, CY, -23 - 3 * u], { mode: "stand", expr: "calm" });
    if (id === 111) { place("Y", [2.2, Y0, -3.55], { mode: "stand", expr: "worry", back: true }); place("N", [2.6, Y0, -3.72], { mode: "stand", expr: "mute", back: true }, 0.72); }
    if (id === 22) { place("Y", [2.3, Y0, -3.7], { mode: "stand", expr: "worry" }); place("N", [2.66, Y0, -4.02], { mode: "stand", expr: "talk", look: 0.8 }, 0.72); }
    if ([24, 27, 31].includes(id)) { place("Y", [1.6, Y0, -3.2], { mode: "stand", expr: "worry", blink: blink(4), look: id === 24 ? 0.6 : 0 }); place("N", [1.92, Y0, -3.28], { mode: "stand", expr: "mute", blink: blink(5) }, 0.72); }
    if (id === 40) { place("Y", [2.15, Y0, -3.55], { mode: "stand", expr: "worry", blink: blink(6) }); place("N", [2.5, Y0, -3.68], { mode: "stand", expr: "mute" }, 0.72); }
    // couloir : l'homme en blanc devant ta porte
    if ([19, 26, 28, 32, 114].includes(id)) place("H", [0.85, CY, MY_DOOR_Z + 0.15], { mode: "stand", expr: "calm" });
    if (id === 23) { const z = -26.6 - 2.2 * u; place("H", [-0.5, CY, z], { mode: "stand", expr: "calm" }); place("M", [0.02, CY, z - 0.5], { mode: "stand", expr: "mute", throat: true }); place("H", [0.52, CY, z - 0.2], { mode: "stand", expr: "calm" }); }
    if (id === 34) { if (u > 0.6) place("A", [1.0 - 0.4 * smooth((u - 0.6) * 2.5), CY, -10], { mode: "stand", expr: "calm" }); }
    if (id === 35) { place("A", [0.9 - 0.4 * u, CY, -16], { mode: "stand", expr: "calm" }); place("C", [-0.9 + 0.35 * u, CY, -19], { mode: "stand", expr: "calm" }); place("H", [0.1, CY, -24], { mode: "stand", expr: "calm" }); place("H", [-0.5, CY, -25], { mode: "stand", expr: "calm" }); }
    // cour : les hommes en blanc (rappel), ils repartent
    if (id === 2) MEN.forEach((p) => place("H", p, { mode: "stand", expr: "calm" }));
    if (id === 8) MEN.forEach((p, i) => place("H", [p[0] + (hash(i, 4) - 0.5) * 2 * u, 0, p[2] + 7 * smooth(u * 1.2 - hash(i, 3) * 0.2)], { mode: "stand", expr: "calm" }));
    if (id === 62) { place("Y", YOU, { mode: "sit", expr: "worry", blink: blink(1) }); place("N", NOE, { mode: "sit", expr: "mute" }, 0.72); }   // ouverture : toi sur le lit
    if (id === 60) MEN.forEach((p) => place("H", p, { mode: "stand", expr: "calm" }));
    for (; k < this.actors.length; k++) this.actors[k].mesh.visible = false;
    this.pool.flush();
    for (const a of this.actors) if (a.mesh.visible) a.bind();
    void Y0; void MY_FLOOR;
    return focus;
  }
}
