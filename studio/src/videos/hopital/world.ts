// « L'hôpital » : chambre, couloir, façade de nuit + police, escalier en colimaçon (béton), palier aux néons de secours,
// couloir noir (sortie de secours) et couloir blanc (impasse vitrée). update(i, f, cam, scene) pose une image.
import * as THREE from "three";
import { Batch, lam } from "../bridge/build";
import { ctex } from "../bridge/paint";
import { TONE, CHAR, untone } from "../bridge/shade";
import { NOINK } from "../bridge/ink";
import { Pool, Actor } from "../bridge/cast";
import type { Pen } from "../bridge/toon";
import { painted } from "../shared/painted";
import { drawPerso, Perso } from "./persos";
import { FPS, V3, NAME, LIGHT, CORR_Z, STAIR, LAND_Z, camAt, uOf, hash, smooth, clamp01, tW } from "./story";
import { LIGHTS } from "./look";

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const solid = (key: string, color: string, extra: THREE.MeshLambertMaterialParameters = {}) => { const m = lam("ho_" + key, () => ({ color, ...extra })); m.name = "ho_" + key; return m; };
const glow = (color: string, op = 1) => new THREE.MeshBasicMaterial({ color, transparent: op < 1, opacity: op, fog: false });
const box = (b: Batch, m: THREE.Material, x0: number, y0: number, z0: number, x1: number, y1: number, z1: number) =>
  b.add(new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0).translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2), m);
const FONT = "DejaVu Sans, Liberation Sans, sans-serif";
const SU = 0.00216, HIP = (975 - 612) * SU, HEAD = (975 - 196) * SU, NECK = (975 - 318) * SU;

// ---------------- textures peintes ----------------
const tileTex = () => ctex("ho_tile", 256, 256, (g) => {                 // lino d'hôpital : carreaux clairs, joints, taches
  g.fillStyle = "#b9c2bd"; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { g.fillStyle = `rgba(${hash(i * 4 + j, 1) < 0.5 ? "255,255,255" : "60,70,70"},${0.04 + hash(i * 4 + j, 2) * 0.05})`; g.fillRect(i * 64 + 2, j * 64 + 2, 60, 60); }
  g.strokeStyle = "rgba(60,70,68,0.35)"; g.lineWidth = 2; for (let k = 0; k <= 4; k++) { g.beginPath(); g.moveTo(k * 64, 0); g.lineTo(k * 64, 256); g.stroke(); g.beginPath(); g.moveTo(0, k * 64); g.lineTo(256, k * 64); g.stroke(); }
  for (let i = 0; i < 26; i++) { g.fillStyle = `rgba(70,60,50,${0.04 + hash(i, 3) * 0.06})`; g.beginPath(); g.ellipse(hash(i, 4) * 256, hash(i, 5) * 256, 6 + hash(i, 6) * 20, 4 + hash(i, 7) * 12, hash(i, 8) * 3, 0, 7); g.fill(); }
});
const wallTex = () => ctex("ho_wall", 256, 256, (g) => {                 // peinture vert d'eau, soubassement plus foncé, éraflures
  g.fillStyle = "#c6d6cf"; g.fillRect(0, 0, 256, 256);
  g.fillStyle = "#7f9c94"; g.fillRect(0, 168, 256, 88); g.fillStyle = "#5f7a72"; g.fillRect(0, 164, 256, 6);
  for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(${hash(i, 11) < 0.5 ? "60,70,70" : "255,255,255"},${0.03 + hash(i, 12) * 0.05})`; g.beginPath(); g.ellipse(hash(i, 13) * 256, hash(i, 14) * 256, 10 + hash(i, 15) * 30, 6 + hash(i, 16) * 18, 0, 0, 7); g.fill(); }
  g.strokeStyle = "rgba(60,50,45,0.3)"; g.lineWidth = 1.5; for (let i = 0; i < 8; i++) { const x = hash(i, 17) * 256, y = 120 + hash(i, 18) * 120; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 10 + hash(i, 19) * 30, y + (hash(i, 20) - 0.5) * 6); g.stroke(); }
});
const concreteTex = () => ctex("ho_beton", 256, 256, (g) => {            // béton brut : banches, trous de coffrage, coulures
  g.fillStyle = "#8d8f90"; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 90; i++) { g.fillStyle = `rgba(${hash(i, 21) < 0.5 ? "40,42,44" : "230,230,225"},${0.04 + hash(i, 22) * 0.07})`; g.beginPath(); g.ellipse(hash(i, 23) * 256, hash(i, 24) * 256, 6 + hash(i, 25) * 26, 4 + hash(i, 26) * 16, 0, 0, 7); g.fill(); }
  g.strokeStyle = "rgba(40,42,44,0.35)"; g.lineWidth = 2; for (let k = 1; k < 4; k++) { g.beginPath(); g.moveTo(0, k * 64); g.lineTo(256, k * 64); g.stroke(); }
  g.fillStyle = "rgba(30,30,32,0.6)"; for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { g.beginPath(); g.arc(32 + i * 64, 32 + j * 64, 3, 0, 7); g.fill(); }
  for (let i = 0; i < 7; i++) { const x = hash(i, 27) * 256, gr = g.createLinearGradient(0, 0, 0, 200); gr.addColorStop(0, "rgba(30,28,26,0.28)"); gr.addColorStop(1, "rgba(30,28,26,0)"); g.fillStyle = gr; g.fillRect(x, 0, 2 + hash(i, 28) * 6, 100 + hash(i, 29) * 120); }
});
const asphaltTex = () => ctex("ho_asphalt", 256, 256, (g) => {
  g.fillStyle = "#2e3136"; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 160; i++) { g.fillStyle = `rgba(${hash(i, 31) < 0.5 ? "10,10,12" : "120,120,125"},${0.05 + hash(i, 32) * 0.08})`; g.beginPath(); g.arc(hash(i, 33) * 256, hash(i, 34) * 256, 1 + hash(i, 35) * 7, 0, 7); g.fill(); }
  g.fillStyle = "rgba(220,220,210,0.55)"; g.fillRect(0, 124, 256, 6);
});
const facadeTex = () => ctex("ho_facade", 512, 512, (g) => {             // 4 x 4 fenêtres : allumées (froid / chaud), éteintes, stores ; silhouettes
  g.fillStyle = "#9aa3a8"; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 60; i++) { g.fillStyle = `rgba(${hash(i, 41) < 0.5 ? "50,55,60" : "240,240,235"},${0.04 + hash(i, 42) * 0.06})`; g.fillRect(hash(i, 43) * 512, hash(i, 44) * 512, 30 + hash(i, 45) * 80, 10 + hash(i, 46) * 40); }
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
    const x = i * 128 + 22, y = j * 128 + 28, k = hash(i * 4 + j, 47);
    g.fillStyle = "#3a4046"; g.fillRect(x - 6, y - 6, 96, 82);
    g.fillStyle = k < 0.35 ? "#cfe6ff" : k < 0.55 ? "#ffd59a" : k < 0.75 ? "#1a2230" : "#8fb4d8"; g.fillRect(x, y, 84, 70);
    if (k > 0.55 && k < 0.75) { g.fillStyle = "#27303c"; g.fillRect(x, y, 84, 70); }
    if (hash(i * 4 + j, 48) < 0.35) { g.fillStyle = "rgba(20,24,30,0.85)"; g.beginPath(); g.ellipse(x + 30 + hash(i, 49) * 30, y + 26, 9, 9, 0, 0, 7); g.fill(); g.fillRect(x + 22 + hash(i, 49) * 30, y + 36, 18, 34); }   // silhouette derrière la vitre
    g.fillStyle = "rgba(255,255,255,0.18)"; g.fillRect(x, y, 84, 6); g.fillStyle = "#565d64"; g.fillRect(x + 40, y, 4, 70);
  }
});
const glowTex = (rgb: string) => ctex("ho_glow" + rgb, 128, 128, (g) => {
  const r = g.createRadialGradient(64, 64, 0, 64, 64, 64); r.addColorStop(0, `rgba(${rgb},0.95)`); r.addColorStop(0.35, `rgba(${rgb},0.35)`); r.addColorStop(1, `rgba(${rgb},0)`); g.fillStyle = r; g.fillRect(0, 0, 128, 128);
});
const exitTex = () => ctex("ho_exit", 256, 128, (g) => {                   // panneau vert « SORTIE » + pictogramme
  g.fillStyle = "#0fa94f"; g.fillRect(0, 0, 256, 128); g.fillStyle = "#e9fff2";
  g.font = `bold 44px ${FONT}`; g.textAlign = "left"; g.fillText("SORTIE", 96, 80);
  g.beginPath(); g.arc(48, 30, 11, 0, 7); g.fill(); g.lineWidth = 9; g.strokeStyle = "#e9fff2"; g.lineCap = "round";
  g.beginPath(); g.moveTo(46, 44); g.lineTo(40, 76); g.lineTo(60, 102); g.moveTo(40, 76); g.lineTo(22, 100); g.moveTo(44, 54); g.lineTo(66, 62); g.moveTo(44, 54); g.lineTo(24, 66); g.stroke();
});
/** texte lumineux d'une règle, révélé lettre par lettre (canvas redessiné quand n change) */
class RuleText {
  cv = document.createElement("canvas"); tex: THREE.CanvasTexture; mesh: THREE.Mesh; private n = -1;
  constructor(private lines: string[], private col: string, w: number, h: number) {
    this.cv.width = 1024; this.cv.height = Math.round(1024 * h / w); this.tex = new THREE.CanvasTexture(this.cv); this.tex.colorSpace = THREE.SRGBColorSpace;
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: this.tex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
    this.mesh.layers.set(NOINK);
  }
  set(n: number, pulse: number) {
    n = Math.floor(n); if (n === this.n) { (this.mesh.material as THREE.MeshBasicMaterial).opacity = pulse; return; } this.n = n;
    const g = this.cv.getContext("2d")!, W = this.cv.width, H = this.cv.height; g.clearRect(0, 0, W, H);
    let k = 0; const lh = H / (this.lines.length + 0.6);
    this.lines.forEach((line, li) => {
      let sz = li === 0 ? lh * 0.62 : lh * 0.5; g.font = `900 ${sz}px Montserrat, ${FONT}`; const mw = g.measureText(line).width; if (mw > W * 0.9) { sz *= W * 0.9 / mw; g.font = `900 ${sz}px Montserrat, ${FONT}`; } g.textAlign = "left";
      const wTot = g.measureText(line).width; let x = (W - wTot) / 2; const y = lh * (li + 0.95);
      for (const ch of line) { if (k++ >= n) break; g.shadowColor = this.col; g.shadowBlur = 38; g.fillStyle = this.col; g.fillText(ch, x, y); g.shadowBlur = 8; g.fillStyle = "#ffffff"; g.globalAlpha = 0.55; g.fillText(ch, x, y); g.globalAlpha = 1; x += g.measureText(ch).width; }
    });
    this.tex.needsUpdate = true; (this.mesh.material as THREE.MeshBasicMaterial).opacity = pulse;
  }
  get count() { return this.lines.join("").length; }
}

// ---------------- personnages ----------------
const HERO: Perso = { role: "patient", pose: "stand", expr: "worry", jacket: "#a9cfe0", pants: "#a9cfe0", shoes: "#f2f2f4", hair: "bald", hairColor: "#3b2b25", bandage: true };
const FLIC: Perso = { role: "police", pose: "stand", expr: "frown", jacket: "#26324f", pants: "#1f2638", shoes: "#15181f", hair: "fringe", hairColor: "#2a2220" };
const DOC: Perso = { role: "medecin", pose: "run", expr: "fear", jacket: "#eef0f2", pants: "#3f8a8c", shoes: "#e9e9ec", hair: "fringe", hairColor: "#6b4a32" };
const SOIGNANT: Perso = { role: "medecin", pose: "stand", expr: "worry", jacket: "#eef0f2", pants: "#4e7fa8", shoes: "#e9e9ec", hair: "spiky", hairColor: "#24201f" };
const FILLE: Perso = { role: "fille", pose: "stand", expr: "fear", jacket: "#e8b64a", pants: "#7a5a8a", shoes: "#c0392b", hair: "fringe", hairColor: "#a0603a" };
const CIVIL: Perso = { role: "civil", pose: "run", expr: "fear", jacket: "#c9b48e", pants: "#3f4458", shoes: "#2a2a30", hair: "ponytail", hairColor: "#a07850" };
const INF: Perso[] = [
  { ...HERO, jacket: "#9cb8c4", pants: "#9cb8c4", hair: "bald", hairColor: "#9a9a9a", bandage: false, infect: 1, blood: 2, pose: "reach" },
  { ...SOIGNANT, pants: "#c97a9a", hair: "ponytail", hairColor: "#24201f", infect: 1, blood: 3, pose: "armsUp" },
  { role: "civil", pose: "run", expr: "shock", jacket: "#5a7d6a", pants: "#3f4458", shoes: "#2a2a30", hair: "spiky", hairColor: "#2a2220", infect: 1, blood: 2 },
  { role: "civil", pose: "reach", expr: "shock", jacket: "#7b5a8a", pants: "#3a3348", shoes: "#2a2a30", hair: "bob", hairColor: "#c9b48e", infect: 1, blood: 1 },
];
const tierOf = (d: number): [number, number, number] => (d < 1.6 ? [1800, 3000, 3] : d < 3.5 ? [1080, 1800, 1.8] : d < 14 ? [600, 1000, 1] : [300, 500, 0.5]);
type Place = { p: V3; s: Perso; yaw?: number; tilt?: number; scale?: number; mirror?: boolean; key?: string };

export class World {
  root = new THREE.Group();
  sun: THREE.DirectionalLight; private hemi: THREE.HemisphereLight; private fog = new THREE.Fog("#000", 10, 100);
  private pool = new Pool(); private actors: Actor[] = [];
  private gyros: { m: THREE.Mesh; col: string; ph: number }[] = []; private neons: THREE.Mesh[] = []; private exit: THREE.Mesh; private exitGlow: THREE.Mesh;
  private sheet: THREE.Mesh; private door: THREE.Mesh; private talkie: THREE.Group; private led: THREE.Mesh; private curtain: THREE.Mesh;
  private rule1: RuleText; private rule2: RuleText; private parts: Record<string, THREE.Points> = {}; private moon: THREE.Mesh; private sky: THREE.Mesh;
  constructor() {
    const R = this.root, b = new Batch();
    this.hemi = new THREE.HemisphereLight("#ffffff", "#3a3a40", 0.3); R.add(this.hemi);
    this.sun = new THREE.DirectionalLight("#ffffff", 1.4); this.sun.castShadow = true; R.add(this.sun, this.sun.target);
    const rep = (t: THREE.Texture, x: number, y: number) => { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(x, y); return t; };
    const tile = solid("tile", "#ffffff", { map: rep(tileTex(), 1, 1) }), wall = solid("wall", "#ffffff", { map: rep(wallTex(), 1, 1) });
    const beton = solid("beton", "#ffffff", { map: rep(concreteTex(), 1, 1) }), white = solid("white", "#e8ecef"), ceil = solid("ceil", "#d9dedf");
    const metal = solid("metal", "#9aa2aa"), dark = solid("dark", "#2a2e34"), mattress = solid("mattress", "#eef2f5"), wood = solid("wood", "#8a6a4a");
    // UV monde : les textures se répètent tous les 2,5 m (murs) / 2 m (sols)
    const plane = (m: THREE.Material, w: number, h: number, rx: number, ry: number, pos: V3, rot: V3, repU = 2.5) => {
      const g = new THREE.PlaneGeometry(w, h); const uv = g.attributes.uv as THREE.BufferAttribute; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * w / repU, uv.getY(i) * h / repU);
      g.rotateX(rot[0]).rotateY(rot[1]).rotateZ(rot[2]).translate(...pos); b.add(g, m); void rx; void ry; };
    const wallX = (m: THREE.Material, x: number, z0: number, z1: number, h: number, face: 1 | -1, y0 = 0) => plane(m, z1 - z0, h, 0, 0, [x, y0 + h / 2, (z0 + z1) / 2], [0, face * Math.PI / 2, 0]);
    const wallZ = (m: THREE.Material, z: number, x0: number, x1: number, h: number, face: 1 | -1, y0 = 0) => plane(m, x1 - x0, h, 0, 0, [(x0 + x1) / 2, y0 + h / 2, z], [0, face > 0 ? 0 : Math.PI, 0]);
    const floor = (m: THREE.Material, x0: number, x1: number, z0: number, z1: number, y = 0, rep = 2) => plane(m, x1 - x0, z1 - z0, 0, 0, [(x0 + x1) / 2, y, (z0 + z1) / 2], [-Math.PI / 2, 0, 0], rep);
    const ceiling = (m: THREE.Material, x0: number, x1: number, z0: number, z1: number, y: number) => plane(m, x1 - x0, z1 - z0, 0, 0, [(x0 + x1) / 2, y, (z0 + z1) / 2], [Math.PI / 2, 0, 0]);
    const neon = (x: number, y: number, z: number, w: number, d: number, col = "#f4fbff") => { const n = new THREE.Mesh(new THREE.BoxGeometry(w, 0.05, d), glow(col)); n.position.set(x, y, z); n.layers.set(NOINK); R.add(n); this.neons.push(n); return n; };
    const HC = 3.0;                                                                 // hauteur sous plafond
    // ---------- CHAMBRE ----------
    floor(tile, -3, 3, -3, 3); ceiling(ceil, -3, 3, -3, 3, HC);
    wallX(wall, -3, -3, 3, HC, 1); wallX(wall, 3, -3, 3, HC, -1);
    wallZ(wall, -3, -3, -1, HC, 1); wallZ(wall, -3, 2.4, 3, HC, 1); wallZ(wall, -3, -1, 2.4, 0.9, 1); wallZ(wall, -3, -1, 2.4, HC - 2.4, 1, 2.4);   // fenêtre extérieure x ∈ [-1 ; 2,4], y ∈ [0,9 ; 2,4]
    wallZ(wall, 3, -3, -2.15, HC, -1); wallZ(wall, 3, -1.05, 0.5, HC, -1); wallZ(wall, 3, 2.6, 3, HC, -1); wallZ(wall, 3, -2.15, -1.05, HC - 2.15, -1, 2.15);   // porte x ∈ [-2,15 ; -1,05]
    wallZ(wall, 3, 0.5, 2.6, 1.0, -1); wallZ(wall, 3, 0.5, 2.6, HC - 2.2, -1, 2.2);                                           // vitre intérieure x ∈ [0,5 ; 2,6], y ∈ [1 ; 2,2]
    for (const [x0, x1, y0, y1, z] of [[-1, 2.4, 0.9, 2.4, -3], [0.5, 2.6, 1.0, 2.2, 3]] as number[][]) {               // vitres + cadres
      const gl = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, y1 - y0), new THREE.MeshBasicMaterial({ color: "#9fc3e0", transparent: true, opacity: 0.12, depthWrite: false }));
      gl.position.set((x0 + x1) / 2, (y0 + y1) / 2, z); gl.layers.set(NOINK); R.add(gl);
      box(b, metal, x0 - 0.06, y0 - 0.06, z - 0.08, x1 + 0.06, y0, z + 0.08); box(b, metal, x0 - 0.06, y1, z - 0.08, x1 + 0.06, y1 + 0.06, z + 0.08);
      box(b, metal, x0 - 0.06, y0, z - 0.08, x0, y1, z + 0.08); box(b, metal, x1, y0, z - 0.08, x1 + 0.06, y1, z + 0.08); box(b, metal, (x0 + x1) / 2 - 0.03, y0, z - 0.06, (x0 + x1) / 2 + 0.03, y1, z + 0.06);
    }
    box(b, metal, -2.7, 0.0, -1.75, -0.3, 0.45, -0.65); box(b, mattress, -2.65, 0.45, -1.7, -0.35, 0.6, -0.7);         // lit
    box(b, metal, -2.8, 0.0, -1.8, -2.7, 1.1, -0.6); box(b, metal, -0.3, 0.0, -1.8, -0.2, 0.8, -0.6);
    box(b, white, -2.55, 0.6, -1.5, -2.15, 0.72, -0.9);                                                                    // oreiller
    box(b, wood, -2.9, 0, -0.45, -2.35, 0.75, 0.1); box(b, metal, -2.85, 0.75, -0.35, -2.55, 0.78, -0.05);                // table de chevet
    box(b, metal, -2.6, 0, -2.4, -2.55, 1.9, -2.35); box(b, white, -2.7, 1.6, -2.42, -2.45, 1.85, -2.33);                 // pied à perfusion + poche
    box(b, dark, -2.95, 1.5, -2.6, -2.85, 2.0, -1.9);                                                                      // moniteur (écran vert dessous)
    { const sc = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.42), glow("#2fd47a")); sc.position.set(-2.84, 1.75, -2.25); sc.rotation.y = Math.PI / 2; sc.layers.set(NOINK); R.add(sc); }
    this.sheet = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 1.25).rotateX(-Math.PI / 2), solid("sheet", "#dfe9ef", { side: THREE.DoubleSide })); this.sheet.castShadow = true; R.add(this.sheet);
    this.door = new THREE.Mesh(new THREE.BoxGeometry(1.1, 2.15, 0.05).translate(0.55, 1.075, 0), solid("door", "#8fa9b8")); this.door.position.set(-2.15, 0, 3); this.door.castShadow = true; R.add(this.door);
    this.talkie = new THREE.Group(); { const t = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.2, 0.04).translate(0, 0.1, 0), solid("talkie", "#1d2024")); const a = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.16).translate(0.02, 0.28, 0), solid("talkie", "#1d2024"));
      this.led = new THREE.Mesh(new THREE.SphereGeometry(0.009, 8, 6), glow("#ff3a2a")); this.led.position.set(-0.02, 0.19, 0.022); this.led.layers.set(NOINK);
      this.talkie.add(t, a, this.led); this.talkie.rotation.set(-Math.PI / 2 + 0.08, 0.6, 0); this.talkie.position.set(1.2, 0.025, 0.55); R.add(this.talkie); }
    neon(0, HC - 0.03, 0, 1.4, 0.3);
    // ---------- COULOIR ----------
    floor(tile, -40, 60, 3.2, 6.4); ceiling(ceil, -40, 60, 3.2, 6.4, HC);
    wallZ(wall, 3.2, -40, -2.15, HC, 1); wallZ(wall, 3.2, -1.05, 0.5, HC, 1); wallZ(wall, 3.2, 2.6, 60, HC, 1); wallZ(wall, 3.2, -2.15, -1.05, HC - 2.15, 1, 2.15); wallZ(wall, 3.2, 0.5, 2.6, 1.0, 1); wallZ(wall, 3.2, 0.5, 2.6, HC - 2.2, 1, 2.2);
    wallZ(wall, 6.4, -40, 60, HC, -1); wallX(wall, 60, 3.2, 6.4, HC, -1); wallX(wall, -40, 3.2, 6.4, HC, 1);
    for (let x = -36; x < 58; x += 4) neon(x, HC - 0.03, CORR_Z, 1.2, 0.3);
    for (let x = -34; x < 58; x += 7) { if (Math.abs(x + 1.6) < 1.5) continue; box(b, solid("door2", "#8fa9b8"), x, 0, 6.34, x + 1.1, 2.15, 6.4); box(b, metal, x + 0.9, 1.0, 6.3, x + 1.0, 1.05, 6.34); }   // portes en face
    box(b, metal, -40, 0.9, 6.3, 60, 0.95, 6.36); box(b, metal, -40, 0.9, 3.24, 60, 0.95, 3.3);                         // mains courantes
    // brancard (fillette dessous) + chariots
    box(b, metal, 28.9, 0.85, 5.3, 31.1, 0.92, 6.1); box(b, mattress, 28.95, 0.92, 5.35, 31.05, 1.0, 6.05);
    for (const x of [29.0, 31.0]) for (const z of [5.35, 6.05]) { box(b, metal, x - 0.02, 0.12, z - 0.02, x + 0.02, 0.85, z + 0.02); box(b, dark, x - 0.06, 0, z - 0.06, x + 0.06, 0.12, z + 0.06); }
    for (const x of [14, -8, 40]) { box(b, metal, x, 0.1, 5.7, x + 0.8, 0.9, 6.25); box(b, white, x + 0.05, 0.9, 5.75, x + 0.75, 0.98, 6.2); }
    this.rule1 = new RuleText(["RÈGLE 1", "LE VIRUS PASSE", "PAR LE SANG"], "#ff2a2a", 2.8, 1.9); this.rule1.mesh.position.set(59.97, 1.7, CORR_Z); this.rule1.mesh.rotation.y = -Math.PI / 2; R.add(this.rule1.mesh);
    // ---------- EXTÉRIEUR ----------
    const fac = rep(facadeTex(), 1, 1);
    { const g = new THREE.PlaneGeometry(140, 24); const uv = g.attributes.uv as THREE.BufferAttribute; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 140 / 16, uv.getY(i) * 24 / 16 * 1.5);
      g.rotateY(Math.PI).translate(0, 12, -3.3); b.add(g, solid("facade", "#ffffff", { map: fac })); }
    box(b, solid("roof", "#3a3f46"), -71, 24, -3.6, 71, 24.6, 30); box(b, solid("auvent", "#d8dde2"), -6, 3.0, -7, 6, 3.3, -3.3);      // corniche, auvent de l'entrée
    for (const x of [-5.6, 5.6]) box(b, metal, x - 0.1, 0, -6.9, x + 0.1, 3.0, -6.7);
    { const sg = new THREE.Mesh(new THREE.PlaneGeometry(10, 1.6), new THREE.MeshBasicMaterial({ map: ctex("ho_sign", 512, 82, (g) => { g.fillStyle = "#c0121e"; g.fillRect(0, 0, 512, 82); g.fillStyle = "#fff"; g.font = `bold 58px ${FONT}`; g.textAlign = "center"; g.fillText("HÔPITAL", 256, 62); }) }));
      sg.position.set(0, 21.5, -3.35); sg.rotation.y = Math.PI; sg.layers.set(NOINK); R.add(sg); }
    floor(solid("asphalt", "#ffffff", { map: rep(asphaltTex(), 1, 1) }), -120, 120, -160, -3.3, 0, 6);
    for (const x of [-30, -14, 14, 30]) { box(b, metal, x - 0.08, 0, -12, x + 0.08, 7, -11.8); const l = new THREE.Mesh(new THREE.PlaneGeometry(3, 3), new THREE.MeshBasicMaterial({ map: glowTex("255,200,140"), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); l.position.set(x, 7, -11.9); l.layers.set(NOINK); R.add(l); this.neons.push(l); }   // lampadaires
    // voitures de police (de travers : une de profil, une de face) + rampes lumineuses
    const car = (x: number, z: number, yaw: number) => { const m = new THREE.Matrix4().makeRotationY(yaw).setPosition(x, 0, z);
      const add = (g: THREE.BufferGeometry, mt: THREE.Material) => b.add(g, mt, m);
      add(new THREE.BoxGeometry(4.4, 0.75, 1.8).translate(0, 0.65, 0), solid("carbody", "#e9edf2")); add(new THREE.BoxGeometry(2.3, 0.6, 1.7).translate(-0.2, 1.3, 0), solid("carwin", "#1a2230"));
      add(new THREE.BoxGeometry(4.42, 0.22, 1.82).translate(0, 0.62, 0), solid("carband", "#1f3f9a")); for (const [wx, wz] of [[-1.4, 0.85], [1.4, 0.85], [-1.4, -0.85], [1.4, -0.85]]) add(new THREE.CylinderGeometry(0.34, 0.34, 0.24, 14).rotateX(Math.PI / 2).translate(wx, 0.34, wz), dark);
      for (const [dz, col, ph] of [[-0.35, "#ff2a2a", 0], [0.35, "#2a6bff", Math.PI]] as [number, string, number][]) { const g = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 4.2), new THREE.MeshBasicMaterial({ map: glowTex(col === "#ff2a2a" ? "255,42,42" : "42,107,255"), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
        const p = V(-0.2, 1.72, dz).applyMatrix4(m); g.position.copy(p); g.layers.set(NOINK); R.add(g); this.gyros.push({ m: g, col, ph: ph + x });
        add(new THREE.BoxGeometry(0.3, 0.12, 0.3).translate(-0.2, 1.66, dz), glow(col)); } };
    car(-3.4, -30.6, 0.22); car(3.2, -31.0, Math.PI / 2 - 0.35); car(12, -33, -0.5);
    // ---------- ESCALIER EN COLIMAÇON + PALIER ----------
    const [SX, , SZ] = STAIR;
    { const g = new THREE.CylinderGeometry(3.7, 3.7, 12, 40, 1, true, 0.95, Math.PI * 2 - 1.9); const uv = g.attributes.uv as THREE.BufferAttribute; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 9, uv.getY(i) * 4.8);
      g.translate(SX, 6, SZ); b.add(g, beton); const m = beton.clone(); m.side = THREE.BackSide; }
    { const g = new THREE.CylinderGeometry(3.72, 3.72, 12, 40, 1, true, 0.95, Math.PI * 2 - 1.9); g.translate(SX, 6, SZ); const m = solid("beton_in", "#ffffff", { map: rep(concreteTex(), 9, 4.8), side: THREE.BackSide }); b.add(g, m); }
    b.add(new THREE.CylinderGeometry(0.45, 0.45, 12, 16).translate(SX, 6, SZ), beton);                                         // noyau
    for (let k = 0; k < 44; k++) { const a = k * 0.32, y = k * 0.25; const g = new THREE.BoxGeometry(3.1, 0.25, 0.75).translate(2.05, y + 0.125, 0).rotateY(-a + Math.PI / 2).translate(SX, 0, SZ); b.add(g, solid("step", "#a3a5a6")); }
    floor(beton, SX - 3.7, SX + 3.7, SZ - 3.7, SZ + 3.7, 0.001, 2.5);
    // palier z ∈ [3,5 ; 9,2], x ∈ [194 ; 206] ; ouvertures des couloirs z ∈ [4,6 ; 8,2]
    floor(beton, 150, 250, 3.5, 9.2, 0, 2.5); ceiling(beton, 150, 250, 3.5, 9.2, HC);
    wallZ(beton, 9.2, 194, 206, HC, -1); wallZ(beton, 3.5, 194, SX - 2.9, HC, 1); wallZ(beton, 3.5, SX + 2.9, 206, HC, 1);
    wallX(beton, 194, 3.5, 4.6, HC, 1); wallX(beton, 194, 8.2, 9.2, HC, 1); wallX(beton, 206, 3.5, 4.6, HC, -1); wallX(beton, 206, 8.2, 9.2, HC, -1);
    for (let x = SX - 2.6; x <= SX + 2.6; x += 1.3) neon(x, HC - 0.05, 3.6, 1.2, 0.12, "#eaf4ff");                         // néons de secours puissants au seuil
    this.curtain = new THREE.Mesh(new THREE.PlaneGeometry(6.2, HC), new THREE.MeshBasicMaterial({ map: ctex("ho_curtain", 64, 256, (g) => { const v = g.createLinearGradient(0, 0, 0, 256); v.addColorStop(0, "rgba(235,245,255,0.75)"); v.addColorStop(0.5, "rgba(220,235,255,0.28)"); v.addColorStop(1, "rgba(220,235,255,0.08)"); g.fillStyle = v; g.fillRect(0, 0, 64, 256); }),
      transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false })); this.curtain.position.set(SX, HC / 2, 3.6); this.curtain.layers.set(NOINK); R.add(this.curtain);   // rideau de lumière
    this.rule2 = new RuleText(["RÈGLE 2", "LA LUMIÈRE PUISSANTE", "LES AVEUGLE ET LES BLOQUE"], "#cfe6ff", 2.2, 1.25); this.rule2.mesh.position.set(203.8, 1.65, 9.18); this.rule2.mesh.rotation.y = Math.PI; R.add(this.rule2.mesh);
    // couloir noir (x ∈ [206 ; 242]) : sortie de secours au bout
    wallZ(beton, 4.6, 206, 242, HC, 1); wallZ(beton, 8.2, 206, 242, HC, -1); wallX(beton, 242, 4.6, 8.2, HC, -1);
    box(b, solid("exitdoor", "#5d6b62"), 241.9, 0, 5.6, 242, 2.2, 7.2); box(b, metal, 241.8, 1.0, 5.8, 241.9, 1.06, 7.0);
    this.exit = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.45), new THREE.MeshBasicMaterial({ map: exitTex() })); this.exit.position.set(241.88, 2.55, LAND_Z); this.exit.rotation.y = -Math.PI / 2; this.exit.layers.set(NOINK); R.add(this.exit);
    this.exitGlow = new THREE.Mesh(new THREE.PlaneGeometry(4, 4), new THREE.MeshBasicMaterial({ map: glowTex("40,230,120"), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })); this.exitGlow.position.set(241.7, 2.5, LAND_Z); this.exitGlow.rotation.y = -Math.PI / 2; this.exitGlow.layers.set(NOINK); R.add(this.exitGlow);
    for (let x = 212; x < 240; x += 7) { const n = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.04, 0.2), glow("#1a2a44")); n.position.set(x, HC - 0.03, LAND_Z); R.add(n); }   // néons éteints
    // couloir blanc (x ∈ [164 ; 194]) : impasse vitrée au bout
    const whiteW = solid("whitewall", "#f2f5f8");
    wallZ(whiteW, 4.6, 164, 194, HC, 1); wallZ(whiteW, 8.2, 164, 194, HC, -1); floor(solid("whitefloor", "#e6ebef"), 164, 194, 4.6, 8.2, 0.002);
    for (let x = 166; x < 194; x += 1.6) neon(x, HC - 0.04, LAND_Z, 1.3, 1.6, "#ffffff");
    for (let k = 0; k < 4; k++) { const z0 = 4.6 + k * 0.9; const gl = new THREE.Mesh(new THREE.PlaneGeometry(0.88, HC - 0.1), new THREE.MeshBasicMaterial({ color: "#bcd8f0", transparent: true, opacity: 0.35, depthWrite: false }));
      gl.position.set(164, HC / 2, z0 + 0.45); gl.rotation.y = Math.PI / 2; gl.layers.set(NOINK); R.add(gl); box(b, metal, 163.95, 0, z0 - 0.03, 164.05, HC, z0 + 0.03); }
    box(b, metal, 163.95, 0, 8.17, 164.05, HC, 8.2); box(b, metal, 163.95, HC / 2 - 0.03, 4.6, 164.05, HC / 2 + 0.03, 8.2);
    { const night = new THREE.Mesh(new THREE.PlaneGeometry(12, 8), glow("#0c1630")); night.position.set(158, 2, LAND_Z); night.rotation.y = Math.PI / 2; R.add(night); }   // nuit derrière la vitre
    b.build(R, true);
    const done = new Set<THREE.Material>();
    R.traverse((o) => { const m = o as THREE.Mesh; if (!m.isMesh || Array.isArray(m.material) || done.has(m.material)) return; const mt = m.material as THREE.MeshLambertMaterial; done.add(mt);
      if (mt.name === "ho_wall" || mt.name === "ho_beton" || mt.name === "ho_beton_in") painted(mt, 0.16, 0.5, 0.12); else if (mt.name === "ho_tile" || mt.name === "ho_asphalt") painted(mt, 0.2, 0.3, 0); });
    // ciel + lune
    this.sky = new THREE.Mesh(new THREE.SphereGeometry(900, 24, 16), new THREE.MeshBasicMaterial({ map: ctex("ho_sky", 64, 512, (g) => { const v = g.createLinearGradient(0, 0, 0, 512); v.addColorStop(0, "#03050b"); v.addColorStop(0.45, "#0c1630"); v.addColorStop(0.5, "#22304e"); v.addColorStop(0.56, "#0c1630"); v.addColorStop(1, "#03050b"); g.fillStyle = v; g.fillRect(0, 0, 64, 512); }), side: THREE.BackSide, fog: false, depthWrite: false }));
    this.sky.layers.set(NOINK); this.sky.renderOrder = -1; R.add(this.sky);
    this.moon = new THREE.Mesh(new THREE.PlaneGeometry(90, 90), new THREE.MeshBasicMaterial({ map: glowTex("215,235,255"), transparent: true, fog: false, blending: THREE.AdditiveBlending, depthWrite: false })); this.moon.layers.set(NOINK); R.add(this.moon);
    for (let i = 0; i < 20; i++) this.actors.push(new Actor(R));
    const mk = (key: string, n: number, col: string, size: number, add: boolean, op = 1) => { const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(n * 3), 3));
      const pt = new THREE.Points(g, new THREE.PointsMaterial({ map: glowTex(col), size, transparent: true, opacity: op, depthWrite: false, blending: add ? THREE.AdditiveBlending : THREE.NormalBlending })); pt.layers.set(NOINK); pt.visible = false; pt.frustumCulled = false; R.add(pt); this.parts[key] = pt; };
    mk("dust", 140, "255,240,220", 0.03, true, 0.8); mk("glass", 90, "200,230,255", 0.06, true); mk("blood", 40, "150,10,20", 0.05, false); mk("sweat", 1, "220,240,255", 0.02, true);
  }

  update(i: number, f: number, cam: THREE.PerspectiveCamera, scene: THREE.Scene) {
    const t = f / FPS, c = camAt(i, f), u = uOf(i, f), id = NAME[i], lk = LIGHT[i], L = LIGHTS[lk];
    cam.position.set(...c.pos); cam.up.set(0, 1, 0); cam.lookAt(...c.look); cam.rotateZ(c.roll);
    if (cam.fov !== c.fov || cam.near !== 0.02 || cam.far !== 1200) { cam.fov = c.fov; cam.near = 0.02; cam.far = 1200; cam.updateProjectionMatrix(); }
    cam.layers.enable(NOINK); cam.updateMatrixWorld();
    const focus = V(...c.look), outside = lk === 1;
    // lumière
    const sunDir = V(...L.sunDir).normalize();
    this.sun.color.set(L.sunCol); this.sun.intensity = L.sunI; this.hemi.color.set(L.hemiSky); this.hemi.intensity = L.hemiI;
    const span = outside ? 40 : 10;
    this.sun.position.copy(focus).addScaledVector(sunDir, span * 3); this.sun.target.position.copy(focus);
    const sc = this.sun.shadow.camera; sc.left = -span; sc.right = span; sc.top = span; sc.bottom = -span; sc.near = 0.5; sc.far = span * 7; sc.updateProjectionMatrix();
    this.sun.shadow.bias = -0.0005; this.sun.shadow.normalBias = 0.02 * (span / 7);
    TONE.uLitCol.value.set(...L.lit); TONE.uShadeCol.value.set(...L.shade); TONE.uShadeLift.value.set(...L.lift);
    TONE.uLambert.value = 0.35; TONE.uSideK.value = 0.84; TONE.uTerm.value = 0.2; TONE.uBounce.value.set(0, 0, 0); TONE.uSat.value = L.sat;
    CHAR.uCharTint.value.set(...L.charTint); CHAR.uCharShade.value = 0.72; CHAR.uGrad.value = 0.09; CHAR.uBodyGrad.value = 0.22; CHAR.uSideTint.value.set(0.8, 0.86, 1.0);
    untone(L.fogCol, this.fog.color); this.fog.near = L.fogNear; this.fog.far = L.fogFar; scene.fog = this.fog; scene.background = new THREE.Color(L.bg);
    this.sky.position.copy(cam.position); this.moon.position.copy(cam.position).add(V(0.5, 0.45, -1).normalize().multiplyScalar(700)); this.moon.lookAt(cam.position);
    // lueurs animées
    this.gyros.forEach((g) => { const k = 0.5 + 0.5 * Math.sin(t * 9 + g.ph); (g.m.material as THREE.MeshBasicMaterial).opacity = 0.25 + 0.75 * k * k; g.m.lookAt(cam.position); g.m.scale.setScalar(0.8 + 0.5 * k); });
    this.neons.forEach((n, k) => { if ((n.material as THREE.MeshBasicMaterial).map) n.lookAt(cam.position); const fl = id === "11a" || id === "19" ? (hash(Math.floor(t * 14) + k, 7) < 0.12 ? 0.25 : 1) : 1; (n.material as THREE.MeshBasicMaterial).color.setScalar(fl); });
    const buzz = hash(Math.floor(t * 18), 3), on = id === "28" ? (buzz < 0.3 ? 0.15 : buzz < 0.5 ? 0.55 : 1) : 0.6 + 0.4 * (buzz > 0.2 ? 1 : 0.3);   // panneau vert qui grésille
    (this.exit.material as THREE.MeshBasicMaterial).color.setScalar(0.35 + 0.65 * on); (this.exitGlow.material as THREE.MeshBasicMaterial).opacity = 0.9 * on;
    (this.led.material as THREE.MeshBasicMaterial).color.set(hash(Math.floor(t * 11), 5) < 0.5 ? "#ff3a2a" : "#3a0806");
    this.talkie.position.set(1.2 + (id === "07" ? 0.004 * Math.sin(t * 90) : 0), 0.025, 0.55);
    (this.curtain.material as THREE.MeshBasicMaterial).opacity = 0.85 + 0.15 * Math.sin(t * 31) * Math.sin(t * 7);
    // drap : sur le héros couché (01), glisse et tombe (02), puis au sol
    const fall = id === "01" ? 0 : id === "02" ? smooth((u - 0.25) / 0.6) : 1;
    this.sheet.position.set(-1.0 + 0.9 * fall, 0.66 - 0.6 * fall, -1.2 + 0.25 * fall); this.sheet.rotation.set(0, 0, -1.2 * Math.sin(Math.PI * Math.min(fall, 1)) * (1 - fall) - 0.05 * fall);
    this.door.rotation.y = id === "10" ? -1.4 * smooth(u * 2) + 0.12 * Math.sin(u * 14) * smooth(u * 2 - 1) : id === "07" || id === "09" || id === "08" ? 0 : -1.3;
    // règles
    const r1 = id === "15" ? clamp01((t - tW(76) + 0.1) / 1.6) : 0, r2 = id === "25" ? clamp01((t - tW(161) + 0.05) / 1.7) : 0;
    this.rule1.mesh.visible = id === "15"; this.rule1.set(r1 * this.rule1.count, 0.85 + 0.15 * Math.sin(t * 6));
    this.rule2.mesh.visible = id === "25"; this.rule2.set(r2 * this.rule2.count, 0.85 + 0.15 * Math.sin(t * 22) * (hash(Math.floor(t * 10), 2) < 0.2 ? 1 : 0.2));
    // particules
    const fwd = new THREE.Vector3(); cam.getWorldDirection(fwd); const rgt = fwd.clone().cross(V(0, 1, 0)).normalize(), upv = rgt.clone().cross(fwd).normalize();
    const nearCam = (d: number, x: number, y: number): V3 => { const q = cam.position.clone().addScaledVector(fwd, d).addScaledVector(rgt, x).addScaledVector(upv, y); return [q.x, q.y, q.z]; };
    const fr = (x: number) => x - Math.floor(x);
    const setP = (key: string, on: boolean, fn?: (i: number, r: (k: number) => number) => V3 | null, size?: number) => { const pt = this.parts[key]; pt.visible = on; if (!on || !fn) return;
      if (size) (pt.material as THREE.PointsMaterial).size = size; const a = pt.geometry.getAttribute("position") as THREE.BufferAttribute;
      for (let k = 0; k < a.count; k++) { const v = fn(k, (kk) => hash(k, 300 + kk)) ?? [0, -999, 0]; a.setXYZ(k, v[0], v[1], v[2]); } a.needsUpdate = true; };
    setP("dust", !outside && lk !== 4, (k, r) => nearCam(0.6 + r(0) * 4, (r(1) - 0.5) * 2.4 + Math.sin(t * 0.5 + k) * 0.15, (r(2) - 0.5) * 3.2 + Math.sin(t * 0.7 + k * 2) * 0.12), 0.025);
    setP("glass", id === "20" && u < 0.4, (k, r) => { const a = clamp01((u - 0.08) / 0.3) * (0.6 + r(0)); return [-1 + r(1) * 3.4 + (r(2) - 0.5) * a * 4, 0.9 + r(3) * 1.5 - a * a * 2.5, -3 - a * (2 + r(4) * 5)]; }, 0.07);
    setP("blood", id === "12", (k, r) => { const a = fr(r(0) + t * 1.8 + Math.floor(t * 2.2) * 0.3); return [10.2 + (r(1) - 0.5) * 0.1 - a * 0.25, 0.04 + a * 0.35 * (1 - a) * 2.2, CORR_Z - 0.05 - a * 0.3 * r(2)]; }, 0.03);
    setP("sweat", id === "08", () => [-1.15, 1.42 - 0.12 * smooth(u), -1.07], 0.035);

    // ---------- personnages ----------
    let k = 0;
    const yawTo = (p: V3) => Math.atan2(cam.position.x - p[0], cam.position.z - p[2]);
    const place = (o: Place) => {
      const A = this.actors[k++]; if (!A) return; const sc = o.scale ?? 1;
      const d = cam.position.distanceTo(V(o.p[0], o.p[1] + 1.2 * sc, o.p[2])), [w, h, kk] = tierOf(d / sc);
      A.r = this.pool.req(o.key ?? JSON.stringify(o.s), w, h, kk, (pen: Pen) => drawPerso(pen, o.s));
      A.mesh.position.set(...o.p); A.mesh.up.set(0, 1, 0); A.mesh.rotation.set(o.tilt ?? 0, o.yaw ?? yawTo(o.p), 0, "YXZ");
      A.mesh.scale.set(o.mirror ? -sc : sc, sc, sc); A.mesh.visible = true;
    };
    /** personnage qui bascule autour de ses hanches (se redresse) ou de ses pieds (tombe) : a = 0 debout, -π/2 couché sur le dos */
    const pivotHip = (hip: V3, a: number, yaw: number): V3 => [hip[0] - HIP * Math.sin(a) * Math.sin(yaw), hip[1] - HIP * Math.cos(a), hip[2] - HIP * Math.sin(a) * Math.cos(yaw)];
    const jit = (amp: number, seed: number) => amp * Math.sin(t * 41 + seed) * Math.sin(t * 13 + seed * 2);
    const blink = (seed: number) => (f + seed * 37) % 97 < 4;
    const H = HERO, G = FILLE;
    const heroBed = (a: number, s: Partial<Perso>, yawExtra = 0) => { const yaw = Math.PI / 2 + yawExtra, hip: V3 = [-1.15, 0.62, -1.2];
      place({ p: pivotHip(hip, a, yaw), s: { ...H, ...s } as Perso, yaw, tilt: a }); };
    if (id === "01") heroBed(-Math.PI / 2, { expr: "fear", look: Math.sin(t * 13) * 0.9 * (hash(Math.floor(t * 6), 1) < 0.7 ? 1 : -1), blink: blink(1) });
    if (id === "02") heroBed(-Math.PI / 2 * (1 - smooth(u * 1.6)), { expr: "worry", blink: u < 0.15 });
    if (id === "03") heroBed(0, { expr: "worry", look: -0.9 * smooth(u * 3) }, -0.55 * (1 - Math.pow(1 - clamp01(u / 0.18), 3)) + jit(0.02, 2) * (u > 0.18 ? 1 : 0));
    if (id === "08") heroBed(0, { expr: "fear", look: Math.sin(u * 7) * 0.5 }, -0.15);
    if (id === "09") place({ p: [0.7, 0.03 * Math.sin(u * 9), -0.2], s: { ...H, expr: "worry" } });
    if (id === "10") place({ p: [-1.6 + 0.1 * u, 0, 2.2 + 2.2 * u], s: { ...H, pose: "run", expr: "fear", step: (t * 1.7) % 1 } });
    if (id === "04a") [0, 1, 2].forEach((n) => place({ p: [-6 + 12 * u + n * 2.1 - 2, 0, -18 - n * 2.5], s: { ...DOC, step: (t * 1.6 + n * 0.3) % 1, hair: n === 1 ? "bun" : "fringe", pants: n === 2 ? "#4e7fa8" : DOC.pants } }));
    if (id === "04b") [0, 1].forEach((n) => place({ p: [-3 + 8 * u - n * 1.6, 0, 5.9 - 0.4 * n], s: { ...DOC, step: (t * 1.7 + n * 0.5) % 1, hair: n ? "bun" : "spiky", mask: n === 1 } }));
    // dehors : infectés qui avancent vers la police, policiers de dos / de face
    const outsideInf = (n: number, z0: number) => { for (let q = 0; q < n; q++) place({ p: [-12 + q * 4.1 + hash(q, 9) * 2, 0, z0 - q % 3 * 1.4 - 2 * u], s: { ...INF[q % 4], pose: q % 2 ? "reach" : "armsUp", step: 0 } }); };
    const POL: [number, number, Partial<Perso>, number][] = [[-4.6, -33.6, { pose: "handMouth", expr: "worry" }, 0], [-2.9, -32.0, { pose: "reach", gun: true }, -0.62], [-1.4, -33.2, { pose: "reach", gun: true, hair: "bun", hairColor: "#a07850" }, 0],
      [0.2, -34.4, { pose: "stand", expr: "worry" }, 0], [1.6, -32.9, { pose: "armsUp", expr: "shock" }, 0], [3.4, -33.3, { pose: "reach", gun: true }, 0], [-6.2, -35.2, { pose: "run", step: 0.25, expr: "fear" }, 0], [4.9, -34.8, { pose: "stand", expr: "frown" }, 0]];
    if (id === "05") { outsideInf(6, -13); POL.slice(1, 7).forEach(([x, z, s]) => place({ p: [x, 0, z], s: { ...FLIC, ...s } as Perso })); }
    if (id === "06") { outsideInf(7, -14); POL.slice(1, 7).forEach(([x, z, s], q) => place({ p: [x, jit(0.01, q), z], s: { ...FLIC, ...s, back: true } as Perso, yaw: Math.PI })); }
    if (id === "20" || id === "32") { if (id === "20") { outsideInf(4, -12); POL.forEach(([x, z, s, dy]) => place({ p: [x, dy, z], s: { ...FLIC, ...s } as Perso })); } }
    // couloir : le soignant
    const SO: V3 = [8.8, 0, CORR_Z];
    if (id === "11a") { place({ p: [SO[0] + 1.5 - 1.2 * u, 0, SO[2] + 0.2 * Math.sin(u * 5)], s: { ...SOIGNANT, bite: true, expr: "shock", pose: "handMouth" }, yaw: -Math.PI / 2 + 0.3 * Math.sin(t * 3) }); }
    if (id === "11b") { const a = -Math.PI / 2 * smooth((u - 0.15) / 0.55); place({ p: [SO[0] + 0.3, 0, SO[2]], s: { ...SOIGNANT, bite: true, expr: "shock" }, yaw: -Math.PI / 2, tilt: a }); }
    if (id === "12" || id === "13") place({ p: [SO[0] + 0.3, 0.012, SO[2]], s: { ...SOIGNANT, bite: true, expr: id === "12" ? "fear" : "shock", infect: id === "13" ? clamp01(u * 1.15) : 0, blood: 1 }, yaw: -Math.PI / 2, tilt: -Math.PI / 2 });
    if (id === "14") { const lp2 = smooth(u * 2.2); place({ p: [10.8 - 1.6 * lp2, 0.35 * Math.sin(Math.PI * clamp01(u * 2.2)), CORR_Z + 0.2], s: { ...SOIGNANT, bite: true, infect: 1, blood: 2, pose: "reach" } });
      const fl = smooth((u - 0.4) / 0.4); place({ p: [8.4 - 0.4 * fl, 0.01, CORR_Z - 0.3], s: { ...CIVIL, pose: fl > 0.5 ? "stand" : "run", expr: "shock", step: 0.25 }, yaw: -Math.PI / 2 - 0.4, tilt: -Math.PI / 2 * fl }); }
    if (id === "16a") place({ p: [23 + 2.2 * u, 0.04 * Math.abs(Math.sin(t * 6)), CORR_Z + 0.3], s: { ...H, back: true, expr: "worry" }, yaw: Math.PI / 2 + Math.PI });
    if (id === "16b") place({ p: [30 + jit(0.012, 4), -0.42, 5.8], s: { ...G, pose: "handMouth", expr: "fear" }, scale: 0.6 });
    if (id === "17") { const hx = 30.6; place({ p: [hx, 0, 5.9], s: { ...H, expr: "worry", look: -0.6 } }); place({ p: [hx - 0.58, 0, 5.9], s: { ...G, pose: "reach", expr: "worry", look: 0.6 }, scale: 0.68, mirror: true }); }
    if (id === "18") place({ p: [-15.4 + jit(0.006, 5), 0, CORR_Z], s: { ...INF[3], pose: "stand", look: Math.sin(t * 23) * 0.6 } });
    if (id === "19") INF.forEach((s, q) => place({ p: [-22 + 14 * u + q * 1.3 + hash(q, 2) * 1.5, 0.05 * Math.abs(Math.sin(t * 7 + q)), CORR_Z + (q % 2 ? 0.7 : -0.6)], s: { ...s, pose: q % 2 ? "run" : "reach", step: (t * 1.9 + q * 0.3) % 1 } }));
    // escalier, palier
    if (id === "21") [0, 1].forEach((q) => { const a = t * 2.4 - q * 0.45, y = Math.max(0, 9 - (t - tW(134)) * 4.6) + q * 0.4; place({ p: [STAIR[0] + 2.1 * Math.sin(a), y, STAIR[2] + 2.1 * Math.cos(a)], s: q ? { ...G, pose: "run", step: (t * 2) % 1 } : { ...H, pose: "run", step: (t * 2) % 1 }, scale: q ? 0.68 : 1 }); });
    const breathe = 1 + 0.025 * Math.sin(t * 9);
    if (id === "22" || id === "26") place({ p: [id === "26" ? 198.5 : 198.0, 0, 9.0], s: { ...H, expr: id === "26" ? "worry" : "fear", look: id === "26" ? Math.sin(u * 9) : 0, blink: id === "22" && blink(2) }, yaw: Math.PI, scale: breathe });
    if (id === "22" || id === "23") place({ p: [199.3, 0, 9.0], s: { ...G, expr: "fear", look: id === "23" ? -0.6 + 0.4 * Math.sin(u * 6) : 0 }, yaw: Math.PI, scale: 0.68 });
    if (id === "23") place({ p: [198.0, 0, 9.0], s: { ...H, expr: "fear" }, yaw: Math.PI });
    if (id === "24") INF.forEach((s, q) => place({ p: [197.4 + q * 1.5, 0, 2.9 - 0.25 * Math.abs(Math.sin(t * 3 + q))], s: { ...s, pose: q % 2 ? "reach" : "stand", look: Math.sin(t * 5 + q) * 0.5 } }));
    if (id === "25") { place({ p: [198.0, 0, 9.0], s: { ...H, expr: "worry" }, yaw: Math.PI }); place({ p: [199.3, 0, 9.0], s: { ...G, expr: "fear" }, yaw: Math.PI, scale: 0.68 }); }
    if (id === "30") place({ p: [166.2 + 0.6 * (1 - smooth(u * 2)), 0, LAND_Z + 0.2], s: { ...H, back: true, expr: "worry" }, yaw: -Math.PI / 2 });
    if (id.startsWith("31")) { const look = id === "31b" ? -1 : id === "31c" ? 1 : Math.sin(u * 6) * 0.8;
      place({ p: [200, 0, LAND_Z + 0.9], s: { ...H, expr: "worry", look, blink: blink(4) } }); place({ p: [200.75, 0, LAND_Z + 1.1], s: { ...G, expr: "fear", look: look * 0.7 }, scale: 0.68 }); }
    for (; k < this.actors.length; k++) this.actors[k].mesh.visible = false;
    this.pool.flush();
    for (const a of this.actors) if (a.mesh.visible) a.bind();
    void HEAD; void NECK; void smooth;
    return focus;
  }
}
