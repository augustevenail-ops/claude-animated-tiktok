// Le Dernier Appel : décors (unités : mètres). Chaque décor est un groupe avec ses propres lumières, affiché seul selon le plan.
// LIV salon (téléphone rouge, horloge, photo du père) · BED chambre de Lucas · HALL couloir vers la chambre du fond
// DISP standard de la caserne · STR rue enneigée (maisons, maison de Lucas qui brûle, camions) · CEM cimetière · SCH cour d'école.
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { ctex, hash } from "./tex";
import { Phone } from "./phone";
import { Fire, Haze } from "./fx";

export const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
export const O = { LIV: V(0, 0, 0), BED: V(40, 0, 0), HALL: V(80, 0, 0), DISP: V(120, 0, 0), STR: V(0, 0, 300), CEM: V(400, 0, 300), SCH: V(-400, 0, 300) };

// ------------------------------------------------------------ matériaux et textures peintes
const mats = new Map<string, THREE.MeshStandardMaterial>();
export const M = (col: string, rough = 0.8, map?: THREE.Texture, extra: THREE.MeshStandardMaterialParameters = {}) => {
  const k = col + rough + (map ? map.uuid : "") + JSON.stringify(extra); let m = mats.get(k);
  if (!m) { m = new THREE.MeshStandardMaterial({ color: col, roughness: rough, map, ...extra }); mats.set(k, m); } return m;
};
const E = (col: string, i = 1.5) => new THREE.MeshStandardMaterial({ color: "#000", emissive: col, emissiveIntensity: i, roughness: 1 });
const noise = (g: CanvasRenderingContext2D, w: number, h: number, n: number, a: number, r: number, seed = 0) => {
  for (let i = 0; i < n; i++) { g.fillStyle = `rgba(${hash(i, seed + 1) < 0.5 ? "0,0,0" : "255,255,255"},${a * (0.3 + hash(i, seed + 2) * 0.7)})`; g.beginPath(); g.arc(hash(i, seed + 3) * w, hash(i, seed + 4) * h, r * (0.3 + hash(i, seed + 5)), 0, 7); g.fill(); } };
const rep = (t: THREE.Texture, x: number, y: number) => { const c = t.clone(); c.wrapS = c.wrapT = THREE.RepeatWrapping; c.repeat.set(x, y); c.needsUpdate = true; return c; };
const wallpaper = (a: string, b: string) => ctex(`wp_${a}_${b}`, 256, 256, (g) => { g.fillStyle = a; g.fillRect(0, 0, 256, 256);
  for (let x = 0; x < 256; x += 32) { g.fillStyle = b; g.fillRect(x, 0, 12, 256); }
  for (let y = 16; y < 256; y += 64) for (let x = 22; x < 256; x += 64) { g.fillStyle = b; g.beginPath(); for (let k = 0; k < 5; k++) { const an = k * 1.2566; g.ellipse(x + Math.cos(an) * 6, y + Math.sin(an) * 6, 5, 3, an, 0, 7); } g.fill(); }
  noise(g, 256, 256, 300, 0.035, 6); }, true);
const woodTex = (a: string) => ctex("wood_" + a, 256, 256, (g) => { g.fillStyle = a; g.fillRect(0, 0, 256, 256);
  for (let r = 0; r < 8; r++) { const y = r * 32; g.fillStyle = `rgba(0,0,0,${0.05 + hash(r, 1) * 0.1})`; g.fillRect(0, y, 256, 32); g.fillStyle = "rgba(0,0,0,0.35)"; g.fillRect(0, y, 256, 2);
    const off = hash(r, 2) * 256; g.fillRect(off, y, 2, 32);
    for (let k = 0; k < 9; k++) { g.strokeStyle = `rgba(60,30,10,${0.08 + hash(r * 9 + k, 3) * 0.1})`; g.lineWidth = 1; g.beginPath(); g.moveTo(0, y + 4 + k * 3); g.bezierCurveTo(80, y + 2 + k * 3 + hash(k, r) * 4, 170, y + 6 + k * 3, 256, y + 4 + k * 3); g.stroke(); } } }, true);
const rugTex = () => ctex("rug", 256, 256, (g) => { g.fillStyle = "#7a1f22"; g.fillRect(0, 0, 256, 256); g.strokeStyle = "#e3c890"; g.lineWidth = 8; g.strokeRect(14, 14, 228, 228); g.lineWidth = 3; g.strokeRect(30, 30, 196, 196);
  g.fillStyle = "#1f3550"; g.beginPath(); g.moveTo(128, 50); g.lineTo(206, 128); g.lineTo(128, 206); g.lineTo(50, 128); g.fill(); g.fillStyle = "#e3c890"; g.beginPath(); g.arc(128, 128, 26, 0, 7); g.fill(); noise(g, 256, 256, 900, 0.06, 2); });
const sidingTex = (col: string) => ctex("sid_" + col, 128, 128, (g) => { g.fillStyle = col; g.fillRect(0, 0, 128, 128);
  for (let y = 0; y < 128; y += 16) { g.fillStyle = "rgba(0,0,0,0.22)"; g.fillRect(0, y + 13, 128, 3); g.fillStyle = "rgba(255,255,255,0.1)"; g.fillRect(0, y, 128, 2); } noise(g, 128, 128, 120, 0.04, 3); }, true);
const shingleTex = (col: string) => ctex("sh_" + col, 128, 128, (g) => { g.fillStyle = col; g.fillRect(0, 0, 128, 128);
  for (let r = 0; r < 8; r++) for (let c = 0; c < 6; c++) { g.fillStyle = `rgba(0,0,0,${0.1 + hash(r * 6 + c, 1) * 0.2})`; g.fillRect(c * 22 + (r % 2) * 11, r * 16, 20, 14); } }, true);
const snowTex = () => ctex("snow", 256, 256, (g) => { g.fillStyle = "#e9eef6"; g.fillRect(0, 0, 256, 256); noise(g, 256, 256, 500, 0.05, 10); noise(g, 256, 256, 2000, 0.06, 1.5, 7); }, true);
const asphaltTex = () => ctex("asph", 256, 256, (g) => { g.fillStyle = "#3b3e46"; g.fillRect(0, 0, 256, 256); noise(g, 256, 256, 3000, 0.12, 1.5); noise(g, 256, 256, 60, 0.06, 20, 3); }, true);
const brickTex = () => ctex("brick2", 256, 256, (g) => { g.fillStyle = "#b9b0a6"; g.fillRect(0, 0, 256, 256);
  for (let r = 0; r < 16; r++) for (let c = 0; c < 8; c++) { g.fillStyle = `hsl(${8 + hash(r * 8 + c, 1) * 10},${45 + hash(r, c) * 15}%,${33 + hash(r * 8 + c, 2) * 12}%)`; g.fillRect(c * 32 + (r % 2) * 16 + 1, r * 16 + 1, 30, 14); } noise(g, 256, 256, 600, 0.05, 2); }, true);
const stoneTex = () => ctex("stone2", 256, 256, (g) => { g.fillStyle = "#8f9196"; g.fillRect(0, 0, 256, 256); noise(g, 256, 256, 2500, 0.1, 2); noise(g, 256, 256, 40, 0.08, 30, 5);
  g.strokeStyle = "rgba(40,40,45,0.35)"; g.lineWidth = 1; for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(hash(i, 1) * 256, 0); g.lineTo(hash(i, 2) * 256, 256); g.stroke(); } }, true);
export const clockTex = () => ctex("clock", 512, 512, (g) => { g.fillStyle = "#f1e9d8"; g.beginPath(); g.arc(256, 256, 250, 0, 7); g.fill();
  g.strokeStyle = "#2a1d16"; g.lineWidth = 10; g.beginPath(); g.arc(256, 256, 236, 0, 7); g.stroke();
  for (let i = 0; i < 60; i++) { const a = i * Math.PI / 30, r0 = i % 5 ? 214 : 196; g.lineWidth = i % 5 ? 3 : 9; g.beginPath(); g.moveTo(256 + Math.sin(a) * r0, 256 - Math.cos(a) * r0); g.lineTo(256 + Math.sin(a) * 226, 256 - Math.cos(a) * 226); g.stroke(); }
  g.fillStyle = "#2a1d16"; g.font = "bold 56px Georgia, serif"; g.textAlign = "center"; g.textBaseline = "middle";
  for (let n = 1; n <= 12; n++) { const a = n * Math.PI / 6; g.fillText(String(n), 256 + Math.sin(a) * 160, 256 - Math.cos(a) * 160); } });
/** portrait du père en tenue de feu (photo encadrée), dans le style des personnages en blocs */
export const portraitTex = () => ctex("portrait", 384, 480, (g) => {
  const gr = g.createLinearGradient(0, 0, 0, 480); gr.addColorStop(0, "#5a7aa0"); gr.addColorStop(1, "#2a3a52"); g.fillStyle = gr; g.fillRect(0, 0, 384, 480);
  g.fillStyle = "#1f2a44"; g.fillRect(60, 300, 264, 180); g.fillStyle = "#e8d23a"; g.fillRect(60, 400, 264, 16); g.fillRect(60, 430, 264, 16);
  g.fillStyle = "#151d30"; g.fillRect(150, 300, 84, 30);
  g.fillStyle = "#f4cfb0"; g.beginPath(); g.roundRect(112, 128, 160, 168, 22); g.fill();
  g.fillStyle = "#4a3526"; g.beginPath(); g.roundRect(112, 226, 160, 72, [0, 0, 22, 22]); g.fill();
  g.fillStyle = "#f4cfb0"; g.fillRect(150, 236, 84, 16);
  g.fillStyle = "#1b1410"; for (const x of [158, 226]) { g.beginPath(); g.ellipse(x, 196, 10, 13, 0, 0, 7); g.fill(); }
  g.lineWidth = 7; g.strokeStyle = "#1b1410"; g.beginPath(); g.arc(192, 222, 26, 0.25 * Math.PI, 0.75 * Math.PI); g.stroke();
  const hg = g.createLinearGradient(100, 70, 290, 150); hg.addColorStop(0, "#f2f4f6"); hg.addColorStop(1, "#9aa2ac"); g.fillStyle = hg;
  g.beginPath(); g.ellipse(192, 140, 104, 76, 0, Math.PI, 0); g.fill(); g.fillRect(84, 136, 216, 14); g.fillStyle = "#e0b84a"; g.beginPath(); g.moveTo(192, 86); g.lineTo(208, 98); g.lineTo(204, 118); g.lineTo(180, 118); g.lineTo(176, 98); g.fill();
  noise(g, 384, 480, 900, 0.05, 2); const v = g.createRadialGradient(192, 240, 120, 192, 240, 320); v.addColorStop(0, "rgba(0,0,0,0)"); v.addColorStop(1, "rgba(30,20,10,0.45)"); g.fillStyle = v; g.fillRect(0, 0, 384, 480); });
const posterTex = () => ctex("poster", 256, 360, (g) => { g.fillStyle = "#f3e7c9"; g.fillRect(0, 0, 256, 360); g.fillStyle = "#c4202a"; g.fillRect(28, 170, 200, 80); g.fillRect(150, 140, 78, 50);
  g.fillStyle = "#9cd0ff"; g.fillRect(170, 150, 44, 28); g.fillStyle = "#e8e8e8"; g.fillRect(28, 205, 200, 8); g.fillStyle = "#cfcfcf"; for (let i = 0; i < 7; i++) g.fillRect(36 + i * 16, 150, 4, 22); g.fillRect(36, 148, 110, 4);
  g.fillStyle = "#1a1a1a"; for (const x of [70, 190]) { g.beginPath(); g.arc(x, 252, 22, 0, 7); g.fill(); }
  g.fillStyle = "#c4202a"; g.font = "bold 40px sans-serif"; g.textAlign = "center"; g.fillText("POMPIERS", 128, 80); g.fillStyle = "#2a3f6a"; g.font = "bold 26px sans-serif"; g.fillText("brigade 18", 128, 320); });
const screenTex = (k: number) => ctex("screen" + k, 256, 192, (g) => { g.fillStyle = "#06201c"; g.fillRect(0, 0, 256, 192);
  g.strokeStyle = "rgba(80,220,180,0.35)"; g.lineWidth = 1; for (let i = 0; i < 14; i++) { g.beginPath(); g.moveTo(hash(i, k) * 256, 0); g.lineTo(hash(i, k + 1) * 256, 192); g.stroke(); g.beginPath(); g.moveTo(0, hash(i, k + 2) * 192); g.lineTo(256, hash(i, k + 3) * 192); g.stroke(); }
  g.fillStyle = "#4cf0c0"; g.font = "14px monospace"; for (let i = 0; i < 6; i++) g.fillText(["APPEL 18", "LIGNE 2  ACTIVE", "SECTEUR NORD", "VEHICULE FPT1", "ATTENTE", "03:12"][(i + k) % 6], 12, 24 + i * 26);
  g.fillStyle = "#ff3a2a"; g.beginPath(); g.arc(200, 120, 8, 0, 7); g.fill(); });
const tombTex = (hero: boolean) => ctex("tomb" + hero, 256, 320, (g) => { g.fillStyle = "#8a8c92"; g.fillRect(0, 0, 256, 320); noise(g, 256, 320, 2500, 0.1, 2);
  g.strokeStyle = "rgba(30,30,35,0.75)"; g.fillStyle = "rgba(30,30,35,0.75)"; g.lineWidth = 6;
  if (hero) { g.beginPath(); g.ellipse(128, 110, 56, 40, 0, Math.PI, 0); g.stroke(); g.beginPath(); g.moveTo(66, 112); g.lineTo(190, 112); g.stroke(); g.beginPath(); g.moveTo(128, 68); g.lineTo(140, 82); g.lineTo(128, 98); g.lineTo(116, 82); g.closePath(); g.stroke();
    g.font = "bold 30px Georgia, serif"; g.textAlign = "center"; g.fillText("PAPA", 128, 176); g.font = "20px Georgia, serif"; g.fillText("il a tenu sa promesse", 128, 214); }
  else { g.lineWidth = 4; for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(70, 120 + i * 34); g.lineTo(186, 120 + i * 34); g.stroke(); } g.beginPath(); g.moveTo(128, 40); g.lineTo(128, 96); g.moveTo(108, 60); g.lineTo(148, 60); g.stroke(); } });
export const viewTex = (night: boolean) => ctex("view" + night, 512, 512, (g) => { const gr = g.createLinearGradient(0, 0, 0, 512);
  if (night) { gr.addColorStop(0, "#0a1030"); gr.addColorStop(0.7, "#1c2a58"); gr.addColorStop(1, "#2a3456"); } else { gr.addColorStop(0, "#9aa8bc"); gr.addColorStop(0.7, "#c9d2de"); gr.addColorStop(1, "#dfe5ee"); }
  g.fillStyle = gr; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 6; i++) { const x = i * 92 - 20, w = 80, h = 90 + hash(i, 1) * 50, y = 512 - h - 40;
    g.fillStyle = night ? "#121830" : "#7a8290"; g.fillRect(x, y, w, h + 40); g.fillStyle = night ? "#2a3150" : "#eef2f8"; g.beginPath(); g.moveTo(x - 8, y + 4); g.lineTo(x + w / 2, y - 40); g.lineTo(x + w + 8, y + 4); g.fill();
    if (night && hash(i, 3) < 0.7) { g.fillStyle = "#ffb86a"; g.fillRect(x + 16, y + 30, 18, 20); g.fillStyle = hash(i, 4) < 0.5 ? "#ff3a3a" : "#ffb86a"; g.fillRect(x + 48, y + 30, 18, 20); } }
  g.fillStyle = night ? "#3a4466" : "#f4f7fb"; g.fillRect(0, 472, 512, 40); });

// ------------------------------------------------------------ géométrie
const rb = (w: number, h: number, d: number, r = 0.02) => new RoundedBoxGeometry(w, h, d, 2, Math.min(r, w / 2 - 1e-3, h / 2 - 1e-3, d / 2 - 1e-3));
export const add = (p: THREE.Object3D, g: THREE.BufferGeometry, m: THREE.Material, x = 0, y = 0, z = 0, ry = 0, cast = true) => {
  const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.rotation.y = ry; o.castShadow = cast; o.receiveShadow = true; p.add(o); return o; };
const bx = (p: THREE.Object3D, w: number, h: number, d: number, m: THREE.Material, x: number, y: number, z: number, ry = 0, r = 0.015) => add(p, rb(w, h, d, r), m, x, y, z, ry);
const plane = (p: THREE.Object3D, w: number, h: number, m: THREE.Material, x: number, y: number, z: number, rx = 0, ry = 0) => { const o = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); o.position.set(x, y, z); o.rotation.set(rx, ry, 0); o.receiveShadow = true; p.add(o); return o; };

/** pièce : sol, plafond, 4 murs (ouvertures gérées par des panneaux) */
const room = (p: THREE.Object3D, w: number, d: number, h: number, wall: THREE.Material, floor: THREE.Material, ceil = M("#e9e4da", 0.9)) => {
  plane(p, w, d, floor, 0, 0, 0, -Math.PI / 2); plane(p, w, d, ceil, 0, h, 0, Math.PI / 2);
  plane(p, w, h, wall, 0, h / 2, -d / 2); plane(p, w, h, wall, 0, h / 2, d / 2, 0, Math.PI); plane(p, d, h, wall, -w / 2, h / 2, 0, 0, Math.PI / 2); plane(p, d, h, wall, w / 2, h / 2, 0, 0, -Math.PI / 2);
  for (const [x, z, ry, L] of [[0, -d / 2 + 0.01, 0, w], [0, d / 2 - 0.01, Math.PI, w], [-w / 2 + 0.01, 0, Math.PI / 2, d], [w / 2 - 0.01, 0, -Math.PI / 2, d]] as const) bx(p, L, 0.12, 0.02, M("#f2ede4", 0.6), x, 0.06, z, ry, 0.005);
};
/** fenêtre sur un mur (vue extérieure peinte derrière la vitre) */
const windowAt = (p: THREE.Object3D, x: number, y: number, z: number, ry: number, w: number, h: number, night: boolean) => {
  const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; p.add(g);
  plane(g, w, h, new THREE.MeshBasicMaterial({ map: viewTex(night), color: night ? "#8090c0" : "#ffffff" }), 0, 0, -0.06);
  const fm = M("#efe9df", 0.5); for (const [ww, hh, xx, yy] of [[w + 0.16, 0.08, 0, h / 2], [w + 0.16, 0.08, 0, -h / 2], [0.08, h, -w / 2, 0], [0.08, h, w / 2, 0], [0.05, h, 0, 0], [w, 0.05, 0, 0]] as const) bx(g, ww, hh, 0.08, fm, xx, yy, 0);
  bx(g, w + 0.3, 0.05, 0.22, fm, 0, -h / 2 - 0.04, 0.08);
  return g;
};
const frame = (p: THREE.Object3D, tex: THREE.Texture, w: number, h: number, x: number, y: number, z: number, ry = 0, col = "#3a2414") => {
  const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; p.add(g);
  bx(g, w + 0.08, h + 0.08, 0.035, M(col, 0.45), 0, 0, 0); const pic = plane(g, w, h, new THREE.MeshPhysicalMaterial({ map: tex, roughness: 0.3, clearcoat: 0.6 }), 0, 0, 0.019); pic.castShadow = false;
  return g;
};
const lampShade = (p: THREE.Object3D, x: number, y: number, z: number, col = "#f3dcae") => {
  const sh = add(p, new THREE.CylinderGeometry(0.16, 0.24, 0.26, 24, 1, true), new THREE.MeshStandardMaterial({ color: col, emissive: "#ffb25a", emissiveIntensity: 0.9, side: THREE.DoubleSide, roughness: 0.9 }), x, y, z);
  add(p, new THREE.SphereGeometry(0.05, 10, 8), E("#fff0cf", 6), x, y - 0.04, z, 0, false); return sh; };

// ------------------------------------------------------------ véhicule : camion de pompiers
export class Truck {
  root = new THREE.Group(); bar: THREE.MeshStandardMaterial[] = []; lights: THREE.PointLight[] = []; head!: THREE.MeshStandardMaterial;
  constructor() {
    const r = this.root, red = new THREE.MeshPhysicalMaterial({ color: "#b5121b", roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.1 }), chrome = M("#d8dde3", 0.15, undefined, { metalness: 1 }), dark = M("#16181c", 0.6), glass = new THREE.MeshPhysicalMaterial({ color: "#0e1620", roughness: 0.05, metalness: 0.2, clearcoat: 1 });
    bx(r, 2.5, 2.1, 6.2, red, 0, 1.75, -0.9, 0, 0.08); bx(r, 2.5, 2.4, 2.4, red, 0, 1.9, 3.3, 0, 0.12);
    bx(r, 2.3, 1.0, 0.05, glass, 0, 2.4, 4.51); for (const x of [-1.26, 1.26]) bx(r, 0.05, 0.9, 1.6, glass, x, 2.45, 3.4);
    bx(r, 2.52, 0.18, 8.6, M("#f2f2f2", 0.4), 0, 1.25, 0.25); bx(r, 2.52, 0.08, 8.6, M("#e8d23a", 0.3, undefined, { emissive: "#e8d23a", emissiveIntensity: 0.25 }), 0, 1.45, 0.25);
    bx(r, 2.6, 0.3, 0.25, chrome, 0, 0.75, 4.55); for (const x of [-0.85, 0.85]) { const hl = add(r, new THREE.CylinderGeometry(0.16, 0.16, 0.06, 18).rotateX(Math.PI / 2), E("#fff6e0", 3), x, 1.15, 4.53); this.head = hl.material as THREE.MeshStandardMaterial; }
    for (const [z, x] of [[3.2, -1.2], [3.2, 1.2], [-1.5, -1.2], [-1.5, 1.2], [-3.0, -1.2], [-3.0, 1.2]]) { add(r, new THREE.CylinderGeometry(0.52, 0.52, 0.42, 24).rotateZ(Math.PI / 2), dark, x, 0.52, z); add(r, new THREE.CylinderGeometry(0.28, 0.28, 0.44, 16).rotateZ(Math.PI / 2), chrome, x, 0.52, z); }
    for (const x of [-0.9, 0.9]) bx(r, 0.08, 0.1, 6.4, chrome, x, 2.95, -0.6); for (let i = 0; i < 13; i++) bx(r, 1.8, 0.05, 0.06, chrome, 0, 2.95, -3.6 + i * 0.5);
    for (let i = 0; i < 4; i++) { const red2 = i % 2 === 0, mm = new THREE.MeshStandardMaterial({ color: "#200", emissive: red2 ? "#ff1a1a" : "#2a5cff", emissiveIntensity: 0, roughness: 0.3 }); this.bar.push(mm); bx(r, 0.5, 0.16, 0.3, mm, -0.84 + i * 0.56, 3.18, 3.6); }
    for (const x of [-1.2, 1.2]) for (let i = 0; i < 3; i++) bx(r, 0.03, 0.7, 1.4, M("#9a0e15", 0.35), x, 1.8, -3 + i * 1.7);
    for (const c of ["#ff2a1a", "#2a5cff"]) { const l = new THREE.PointLight(c, 0, 22, 1.4); l.position.set(c === "#ff2a1a" ? -1.6 : 1.6, 3.6, 3.6); r.add(l); this.lights.push(l); }
  }
  set(t: number, on: boolean, k = 1) { this.bar.forEach((m, i) => { const ph = Math.sin(t * 9 + (i % 2) * Math.PI); m.emissiveIntensity = on ? (ph > 0 ? 6 : 0.2) : 0.2; });
    this.lights[0].intensity = on ? Math.max(0, Math.sin(t * 9)) * 22 * k : 0; this.lights[1].intensity = on ? Math.max(0, -Math.sin(t * 9)) * 22 * k : 0; }
}

// ------------------------------------------------------------ maison (extérieur)
export class House {
  root = new THREE.Group(); win: THREE.MeshStandardMaterial[] = []; litW: boolean[] = []; burnt = false; porch: THREE.PointLight; porchBulb: THREE.MeshStandardMaterial;
  private wallM: THREE.MeshStandardMaterial; private roofM: THREE.MeshStandardMaterial; private parts: THREE.Mesh[] = []; private wallCol: string;
  constructor(col: string, roofCol: string, seed: number, phone = true) {
    const r = this.root, W = 9, D = 8, H = 3.2; this.wallCol = col;
    this.wallM = new THREE.MeshStandardMaterial({ color: "#fff", map: rep(sidingTex(col), 3, 1.6), roughness: 0.85 }); this.roofM = new THREE.MeshStandardMaterial({ color: "#fff", map: rep(shingleTex(roofCol), 4, 3), roughness: 0.9 });
    this.parts.push(bx(r, W, H, D, this.wallM, 0, H / 2, 0, 0, 0.03));
    bx(r, W + 0.2, 0.3, D + 0.2, M("#6a6460", 0.9), 0, 0.15, 0);
    const tri = new THREE.Shape(); tri.moveTo(-W / 2 - 0.4, 0); tri.lineTo(0, 2.6); tri.lineTo(W / 2 + 0.4, 0); tri.lineTo(-W / 2 - 0.4, 0);
    const gab = new THREE.Shape(); gab.moveTo(-W / 2, 0); gab.lineTo(0, 2.4); gab.lineTo(W / 2, 0); gab.lineTo(-W / 2, 0);
    for (const z of [-D / 2, D / 2 - 0.2]) this.parts.push(add(r, new THREE.ExtrudeGeometry(gab, { depth: 0.2, bevelEnabled: false }), this.wallM, 0, H, z));
    const slope = Math.atan2(2.6, W / 2 + 0.4), L = Math.hypot(2.6, W / 2 + 0.4) + 0.1;
    for (const s of [-1, 1]) { const rf = bx(r, L, 0.16, D + 1.0, this.roofM, s * (W / 4 + 0.1), H + 1.3, 0, 0, 0.02); rf.rotation.z = -s * slope; this.parts.push(rf);
      const sn = bx(r, L - 0.2, 0.1, D + 0.9, M("#eef3fa", 0.95), s * (W / 4 + 0.1) + s * 0.0, H + 1.42, 0, 0, 0.05); sn.rotation.z = -s * slope; }
    bx(r, 0.8, 2.0, 0.8, new THREE.MeshStandardMaterial({ map: rep(brickTex(), 1, 2) }), W / 4, H + 2.6, -1.5);
    // fenêtres (vitre émissive chaude + croisillons + volets), porte, perron
    const winAt = (x: number, y: number, w: number, h: number, lit: boolean, red: boolean) => {
      const wm = new THREE.MeshStandardMaterial({ color: "#1a1a22", emissive: lit ? "#ffb064" : "#0a0e18", emissiveIntensity: lit ? 1.2 : 0.3, roughness: 0.2 }); this.win.push(wm); this.litW.push(lit);
      add(r, new THREE.PlaneGeometry(w, h), wm, x, y, D / 2 + 0.01, 0, false);
      if (red && lit) { bx(r, 0.7, 0.34, 0.3, E("#ff1a1a", 4), x + w * 0.15, y - h / 2 + 0.28, D / 2 - 0.1); bx(r, 0.78, 0.12, 0.12, E("#ff2a2a", 4), x + w * 0.15, y - h / 2 + 0.52, D / 2 - 0.1); }
      const fm = M("#f2efe8", 0.5); for (const [ww, hh, xx, yy] of [[w + 0.2, 0.1, 0, h / 2], [w + 0.3, 0.12, 0, -h / 2], [0.1, h, -w / 2, 0], [0.1, h, w / 2, 0], [0.06, h, 0, 0], [w, 0.06, 0, 0]] as const) bx(r, ww, hh, 0.12, fm, x + xx, y + yy, D / 2 + 0.04);
      for (const s of [-1, 1]) bx(r, 0.45, h + 0.1, 0.06, M(["#2a3f5a", "#4a5a3a", "#5a2a2a", "#3a3a3a"][seed % 4], 0.7), x + s * (w / 2 + 0.3), y, D / 2 + 0.05); };
    winAt(-2.7, 1.7, 1.5, 1.3, hash(seed, 1) < 0.95, phone); winAt(2.7, 1.7, 1.5, 1.3, hash(seed, 2) < 0.95, phone); winAt(0, H + 0.95, 0.9, 0.8, hash(seed, 3) < 0.6, false);
    bx(r, 1.1, 2.15, 0.08, M(["#5a2a24", "#2a3a5a", "#2f4a3a", "#3a2a1e"][seed % 4], 0.5), 0, 1.25, D / 2 + 0.03);
    add(r, new THREE.SphereGeometry(0.05, 8, 6), M("#d8b04a", 0.3, undefined, { metalness: 1 }), 0.4, 1.2, D / 2 + 0.1);
    bx(r, 2.2, 0.25, 1.2, M("#8a8480", 0.9), 0, 0.13, D / 2 + 0.6); bx(r, 2.4, 0.12, 1.3, M("#5a3a2a", 0.7), 0, 2.55, D / 2 + 0.6);
    for (const x of [-1.05, 1.05]) bx(r, 0.12, 2.3, 0.12, M("#f2efe8", 0.5), x, 1.4, D / 2 + 1.15);
    const pb = add(r, new THREE.SphereGeometry(0.09, 10, 8), E("#ffd9a0", 4), 0.8, 2.25, D / 2 + 0.15, 0, false); this.porchBulb = pb.material as THREE.MeshStandardMaterial;
    this.porch = new THREE.PointLight("#ffc890", 6, 9, 1.6); this.porch.position.set(0.8, 2.2, D / 2 + 0.7); r.add(this.porch);
    // jardin : clôture basse + buissons enneigés
    for (let i = 0; i < 9; i++) { if (i === 4) continue; bx(r, 0.08, 0.8, 0.08, M("#efeae0", 0.6), -4.2 + i * 1.05, 0.4, D / 2 + 5); }
    for (const x of [-4.2, 3.6]) bx(r, 2.4 - (x > 0 ? 0 : 0.1), 0.08, 0.06, M("#efeae0", 0.6), x > 0 ? 2.95 : -2.95, 0.6, D / 2 + 5);
    for (const x of [-3.6, 3.4]) { add(r, new THREE.SphereGeometry(0.7, 14, 10), M("#2a3a2a", 0.9), x, 0.5, D / 2 + 2); add(r, new THREE.SphereGeometry(0.62, 14, 8, 0, 7, 0, 1.2), M("#eef3fa", 0.9), x, 0.62, D / 2 + 2); }
  }
  /** état brûlé : façade noircie, vitres noires */
  setBurnt(b: boolean) { if (b === this.burnt) return; this.burnt = b;
    this.wallM.map = rep(sidingTex(b ? "#2a2422" : this.wallCol), 3, 1.6); this.wallM.needsUpdate = true; this.roofM.color.set(b ? "#3a3030" : "#ffffff");
    for (const w of this.win) { w.emissive.set(b ? "#000" : "#ffb064"); } }
  setLit(on: number) { this.win.forEach((w, k) => { if (this.burnt) return; w.emissive.set(this.litW[k] ? "#ffb064" : "#0a0e18"); w.emissiveIntensity = this.litW[k] ? 1.2 * on : 0.3; }); this.porch.intensity = 6 * on; this.porchBulb.emissiveIntensity = 4 * on; }
}

// ------------------------------------------------------------ arbre nu (hiver)
const tree = (p: THREE.Object3D, x: number, z: number, s: number, seed: number) => {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.scale.setScalar(s); p.add(g); const bark = M("#2a2420", 0.95);
  add(g, new THREE.CylinderGeometry(0.16, 0.3, 4, 8), bark, 0, 2, 0);
  for (let i = 0; i < 7; i++) { const a = i * 2.4 + seed, y = 2.4 + hash(i, seed) * 1.6, l = 1.6 + hash(i, seed + 1) * 1.4;
    const b = add(g, new THREE.CylinderGeometry(0.03, 0.1, l, 6), bark, Math.cos(a) * l * 0.3, y + l * 0.35, Math.sin(a) * l * 0.3); b.rotation.set(Math.sin(a) * 0.7, 0, -Math.cos(a) * 0.7);
    const c = add(g, new THREE.CylinderGeometry(0.01, 0.03, l * 0.6, 5), bark, Math.cos(a + 0.5) * l * 0.55, y + l * 0.7, Math.sin(a + 0.5) * l * 0.55); c.rotation.set(Math.sin(a + 0.5) * 1.0, 0, -Math.cos(a + 0.5) * 1.0); }
  return g; };

// ============================================================ décors
export class Sets {
  root = new THREE.Group(); liv = new THREE.Group(); bed = new THREE.Group(); hall = new THREE.Group(); disp = new THREE.Group(); str = new THREE.Group(); cem = new THREE.Group(); sch = new THREE.Group();
  phone: Phone; dPhone: Phone; clockH: THREE.Object3D; clockM: THREE.Object3D; clockS: THREE.Object3D; photo: THREE.Group; photoBin: THREE.Group; bin: THREE.Group;
  livLamp: THREE.PointLight; livView: THREE.MeshBasicMaterial; livWin: THREE.SpotLight; livKey: THREE.SpotLight; livFire: Fire; livHaze: Haze;
  bedLamp: THREE.PointLight; bedLampShade: THREE.Mesh; bedDoorGlow: THREE.PointLight; bedUnder: THREE.MeshStandardMaterial; bedHaze: Haze; toy: THREE.Group; blanket: THREE.Mesh; stool!: THREE.Mesh; bedDoor: THREE.Group;
  hallHaze: Haze; hallFire: Fire; hallLight: THREE.PointLight; hallFlicker: THREE.PointLight; helmet: THREE.Group; endDoor: THREE.Group;
  dispLamp: THREE.PointLight; dispScreens: THREE.MeshStandardMaterial[] = [];
  houses: House[] = []; lucas!: House; adult!: House; trucks: Truck[] = []; houseFire: Fire; moon: THREE.DirectionalLight; strHemi: THREE.HemisphereLight; lamps: THREE.PointLight[] = []; lampBulbs: THREE.MeshStandardMaterial[] = [];
  grave: THREE.Group; tomb: THREE.Group; flowers: THREE.Group; cemSun: THREE.DirectionalLight; cemHemi: THREE.HemisphereLight; coffin: THREE.Mesh;
  schSun: THREE.DirectionalLight; schHemi: THREE.HemisphereLight;
  constructor() {
    this.root.add(this.liv, this.bed, this.hall, this.disp, this.str, this.cem, this.sch);
    this.liv.position.copy(O.LIV); this.bed.position.copy(O.BED); this.hall.position.copy(O.HALL); this.disp.position.copy(O.DISP); this.str.position.copy(O.STR); this.cem.position.copy(O.CEM); this.sch.position.copy(O.SCH);
    // ---------------- salon
    { const p = this.liv; room(p, 6.4, 5.4, 2.6, new THREE.MeshStandardMaterial({ map: rep(wallpaper("#5f6e5a", "#55634f"), 4, 2), roughness: 0.9 }), new THREE.MeshStandardMaterial({ map: rep(woodTex("#6a4428"), 3, 3), roughness: 0.55 }));
      bx(p, 6.4, 0.9, 0.03, M("#3e2a1c", 0.6), 0, 0.45, -2.68); // lambris bas du mur du fond
      add(p, new THREE.PlaneGeometry(3.2, 2.4).rotateX(-Math.PI / 2), M("#ffffff", 0.95, rugTex()), 0, 0.005, -0.1, 0, false);
      // guéridon + téléphone rouge (au centre)
      const wood = M("#4a2c18", 0.45, undefined, { metalness: 0.05 });
      add(p, new THREE.CylinderGeometry(0.34, 0.34, 0.04, 40), wood, 0, 0.7, -0.6); add(p, new THREE.CylinderGeometry(0.035, 0.05, 0.66, 12), wood, 0, 0.36, -0.6);
      for (let i = 0; i < 3; i++) { const a = i * 2.094; const l = add(p, new THREE.BoxGeometry(0.05, 0.04, 0.34), wood, Math.sin(a) * 0.15, 0.04, -0.6 + Math.cos(a) * 0.15, a); l.rotation.y = a; }
      add(p, new THREE.CylinderGeometry(0.26, 0.26, 0.004, 40), M("#efe6d2", 0.8), 0, 0.722, -0.6, 0, false);
      this.phone = new Phone("#c3121c"); this.phone.root.position.set(0, 0.724, -0.6); this.phone.root.rotation.y = 0.35; p.add(this.phone.root);
      // canapé face au téléphone
      const fab = M("#3c4a6a", 0.95), fab2 = M("#33405c", 0.95);
      bx(p, 2.4, 0.42, 0.95, fab, 0, 0.21 + 0.02, 1.45, 0, 0.08); bx(p, 2.4, 0.75, 0.25, fab2, 0, 0.6, 1.92, 0, 0.1); for (const x of [-1.25, 1.25]) bx(p, 0.25, 0.62, 0.95, fab2, x, 0.32, 1.45, 0, 0.1);
      for (const x of [-0.6, 0.6]) bx(p, 1.12, 0.14, 0.82, fab, x, 0.5, 1.4, 0, 0.06);
      // fauteuil, buffet, lampadaire, étagère
      bx(p, 0.9, 0.42, 0.85, M("#7a3a2a", 0.95), -2.2, 0.23, 0.6, 0.6, 0.08); bx(p, 0.9, 0.8, 0.22, M("#6a3224", 0.95), -2.45, 0.62, 0.95, 0.6, 0.08);
      bx(p, 1.8, 0.85, 0.45, wood, -1.6, 0.43, -2.45); for (let i = 0; i < 3; i++) bx(p, 0.5, 0.3, 0.02, M("#3a2210", 0.5), -2.2 + i * 0.6, 0.55, -2.22);
      frame(p, ctex("fam", 64, 48, (g) => { g.fillStyle = "#c9b89a"; g.fillRect(0, 0, 64, 48); g.fillStyle = "#6a5a4a"; g.fillRect(10, 18, 12, 24); g.fillRect(28, 14, 12, 28); g.fillRect(46, 24, 8, 18); }), 0.24, 0.18, -2.0, 0.98, -2.42, 0.2, "#c9a24a");
      bx(p, 0.04, 1.5, 0.04, M("#2a2a2a", 0.4, undefined, { metalness: 0.6 }), 2.4, 0.75, -2.2); lampShade(p, 2.4, 1.55, -2.2);
      this.livLamp = new THREE.PointLight("#ffb46a", 7, 9, 1.4); this.livLamp.position.set(2.4, 1.48, -2.2); this.livLamp.castShadow = false; p.add(this.livLamp);
      // horloge murale
      const ck = new THREE.Group(); ck.position.set(1.1, 1.95, -2.66); p.add(ck);
      add(ck, new THREE.CylinderGeometry(0.27, 0.27, 0.05, 48).rotateX(Math.PI / 2), M("#3a2414", 0.4), 0, 0, 0);
      const face = add(ck, new THREE.CircleGeometry(0.24, 48), new THREE.MeshPhysicalMaterial({ map: clockTex(), roughness: 0.4, clearcoat: 0.8 }), 0, 0, 0.026, 0, false);
      const hand = (L: number, w: number, z: number, col = "#1a1410") => { const h = new THREE.Group(); h.position.z = z; ck.add(h); add(h, new THREE.BoxGeometry(w, L, 0.006), M(col, 0.5), 0, L / 2 - 0.02, 0, 0, false); return h; };
      this.clockH = hand(0.13, 0.016, 0.032); this.clockM = hand(0.19, 0.011, 0.036); this.clockS = hand(0.2, 0.004, 0.04, "#a01818"); add(ck, new THREE.CylinderGeometry(0.012, 0.012, 0.02, 12).rotateX(Math.PI / 2), M("#a01818", 0.4), 0, 0, 0.042);
      void face;
      // photo du père (au-dessus du buffet) + poubelle
      this.photo = frame(p, portraitTex(), 0.36, 0.45, -1.5, 1.6, -2.66); this.photoBin = frame(p, portraitTex(), 0.36, 0.45, 0, 0, 0); this.photoBin.visible = false;
      this.bin = new THREE.Group(); this.bin.position.set(2.2, 0, 0.9); p.add(this.bin);
      add(this.bin, new THREE.CylinderGeometry(0.2, 0.16, 0.45, 28, 1, true), new THREE.MeshStandardMaterial({ color: "#8a9096", metalness: 0.8, roughness: 0.35, side: THREE.DoubleSide }), 0, 0.225, 0);
      add(this.bin, new THREE.CylinderGeometry(0.16, 0.16, 0.01, 28), M("#2a2a2a", 0.8), 0, 0.01, 0); add(this.bin, new THREE.TorusGeometry(0.2, 0.01, 8, 32).rotateX(Math.PI / 2), M("#8a9096", 0.3, undefined, { metalness: 0.9 }), 0, 0.45, 0);
      for (let i = 0; i < 5; i++) add(this.bin, new THREE.IcosahedronGeometry(0.06, 0), M(["#e8e2d0", "#c9c2b0", "#d8d0bc"][i % 3], 0.9), (hash(i, 1) - 0.5) * 0.18, 0.06 + i * 0.03, (hash(i, 2) - 0.5) * 0.18);
      // fenêtre (mur de droite), rideaux
      const wv = windowAt(p, 3.19, 1.45, -0.2, -Math.PI / 2, 1.4, 1.3, true); this.livView = (wv.children[0] as THREE.Mesh).material as THREE.MeshBasicMaterial;
      for (const z of [-1.15, 0.75]) bx(p, 0.06, 2.1, 0.5, M("#8a2a2a", 0.95), 3.12, 1.4, z, 0, 0.05);
      // porte (mur avant)
      bx(p, 0.95, 2.1, 0.05, M("#5a3a24", 0.6), -2.0, 1.05, 2.68);
      this.livWin = new THREE.SpotLight("#9fb6ff", 6, 14, 0.7, 0.6, 1.2); this.livWin.position.set(4.6, 2.3, -0.2); this.livWin.target.position.set(0, 0.4, -0.2); p.add(this.livWin, this.livWin.target);
      this.livKey = new THREE.SpotLight("#ffd0a0", 10, 12, 0.6, 0.7, 1.4); this.livKey.position.set(1.4, 2.5, 0.8); this.livKey.target.position.set(0, 0.7, -0.6); this.livKey.castShadow = true; this.livKey.shadow.mapSize.set(2048, 2048); this.livKey.shadow.bias = -0.0004; this.livKey.shadow.radius = 4; p.add(this.livKey, this.livKey.target);
      add(p, new THREE.CylinderGeometry(0.3, 0.3, 0.06, 24), M("#efe6d2", 0.6, undefined, { emissive: "#ffe0b0", emissiveIntensity: 0.15 }), 0, 2.57, 0.3);
      this.livFire = new Fire([{ p: V(3.0, 0.4, -0.2), s: 1.1 }, { p: V(3.0, 0.6, 0.8), s: 1.0 }, { p: V(2.6, 0.2, -1.6), s: 0.8 }, { p: V(-2.0, 0.6, -2.3), s: 0.9 }], "#1a1716", 1, [V(2.2, 1.0, -0.4), V(-1.6, 1.0, -1.8)]); p.add(this.livFire.root);
      this.livHaze = new Haze(new THREE.Box3(V(-3, 1.2, -2.6), V(3, 2.6, 2.6)), 22, "#2c2826", 3); p.add(this.livHaze.root);
    }
    // ---------------- chambre de Lucas
    { const p = this.bed; room(p, 4.0, 4.4, 2.5, new THREE.MeshStandardMaterial({ map: rep(wallpaper("#5a7898", "#52708e"), 3, 2), roughness: 0.9 }), new THREE.MeshStandardMaterial({ map: rep(woodTex("#8a6040"), 2, 2), roughness: 0.6 }));
      const w = M("#d8c8a8", 0.6); bx(p, 1.1, 0.3, 2.1, w, -1.35, 0.35, -0.9); bx(p, 1.1, 0.9, 0.08, w, -1.35, 0.6, -1.96);
      bx(p, 1.0, 0.18, 1.95, M("#f2f2ee", 0.9), -1.35, 0.58, -0.9, 0, 0.06); bx(p, 0.6, 0.14, 0.38, M("#f4f4f0", 0.95), -1.35, 0.72, -1.7, 0, 0.06);
      this.blanket = bx(p, 1.06, 0.12, 1.35, M("#2f5a9a", 0.95, ctex("quilt", 128, 128, (g) => { g.fillStyle = "#2f5a9a"; g.fillRect(0, 0, 128, 128); g.fillStyle = "#f2c230"; for (let i = 0; i < 12; i++) { const x = hash(i, 1) * 128, y = hash(i, 2) * 128; g.beginPath(); for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, r = k % 2 ? 3 : 7; g.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } g.fill(); } })), -1.35, 0.7, -0.5, 0, 0.05);
      bx(p, 0.5, 0.55, 0.45, w, -1.6, 0.28, 0.65); this.stool = bx(p, 0.42, 0.06, 0.42, M("#6a4a2a", 0.6), -0.2, 0.44, -1.25); for (const [x, z] of [[-0.38, -1.42], [-0.02, -1.42], [-0.38, -1.08], [-0.02, -1.08]]) this.stool.add(add(new THREE.Group(), rb(0.04, 0.42, 0.04), M("#5a3a1a", 0.6), x + 0.2, -0.22, z + 1.25)); lampShade(p, -1.6, 0.82, 0.65, "#f6d890"); this.bedLampShade = p.children[p.children.length - 2] as THREE.Mesh;
      this.bedLamp = new THREE.PointLight("#ffb46a", 5, 7, 1.5); this.bedLamp.position.set(-1.55, 0.95, 0.6); this.bedLamp.castShadow = true; this.bedLamp.shadow.mapSize.set(1024, 1024); this.bedLamp.shadow.bias = -0.002; p.add(this.bedLamp);
      frame(p, posterTex(), 0.6, 0.84, 0.2, 1.55, -2.18, 0, "#c4202a");
      windowAt(p, 1.99, 1.4, -0.9, -Math.PI / 2, 1.0, 1.1, true);
      // camion jouet
      this.toy = new THREE.Group(); this.toy.position.set(0.4, 0, 0.2); this.toy.rotation.y = -0.6; this.toy.scale.setScalar(0.09); p.add(this.toy); const tr = new Truck(); this.toy.add(tr.root); tr.lights.forEach((l) => (l.visible = false));
      // porte vers le couloir (mur avant droit) + lueur sous la porte
      this.bedDoor = new THREE.Group(); this.bedDoor.position.set(1.2, 0, 2.18); p.add(this.bedDoor); bx(this.bedDoor, 0.9, 2.05, 0.05, M("#efe9df", 0.6), 0, 1.04, 0); add(this.bedDoor, new THREE.SphereGeometry(0.035, 8, 6), M("#d8b04a", 0.3, undefined, { metalness: 1 }), -0.35, 1.0, -0.04);
      this.bedUnder = new THREE.MeshStandardMaterial({ color: "#000", emissive: "#ff7a2a", emissiveIntensity: 0 }); add(p, new THREE.PlaneGeometry(0.9, 0.02), this.bedUnder, 1.2, 0.012, 2.15, Math.PI, false);
      this.bedDoorGlow = new THREE.PointLight("#ff6a20", 0, 4, 1.6); this.bedDoorGlow.position.set(1.2, 0.1, 1.9); p.add(this.bedDoorGlow);
      bx(p, 0.9, 0.9, 0.5, M("#7a5a3a", 0.7), 1.4, 0.45, -1.9); for (let i = 0; i < 4; i++) bx(p, 0.18, 0.24, 0.16, M(["#c4283a", "#2fae7a", "#f2c230", "#5b6fd8"][i], 0.6), 1.1 + i * 0.2, 1.02, -1.9);
      this.bedHaze = new Haze(new THREE.Box3(V(-1.9, 0.0, -2.0), V(1.9, 2.5, 2.0)), 12, "#3a3430", 9); p.add(this.bedHaze.root);
    }
    // ---------------- couloir (vers la chambre du fond)
    { const p = this.hall; const Lh = 8, Wh = 1.5;
      plane(p, Wh, Lh, new THREE.MeshStandardMaterial({ map: rep(woodTex("#6a4a30"), 1, 4), roughness: 0.6 }), 0, 0, -Lh / 2 + 0.5, -Math.PI / 2); plane(p, Wh, Lh, M("#e6e0d4", 0.9), 0, 2.5, -Lh / 2 + 0.5, Math.PI / 2);
      const wm = new THREE.MeshStandardMaterial({ map: rep(wallpaper("#8a7a62", "#827258"), 6, 2), roughness: 0.9 });
      for (const s of [-1, 1]) plane(p, Lh, 2.5, wm, s * Wh / 2, 1.25, -Lh / 2 + 0.5, 0, -s * Math.PI / 2);
      plane(p, Wh, 2.5, wm, 0, 1.25, 0.5, 0, Math.PI);
      for (const [s, z] of [[-1, -1.5], [1, -3.2], [-1, -5.2]] as const) { bx(p, 0.05, 2.05, 0.9, M("#efe9df", 0.6), s * (Wh / 2 - 0.02), 1.03, z); }
      for (const [s, z] of [[1, -1.0], [-1, -3.4], [1, -5.6]] as const) frame(p, ctex("hf" + z, 64, 64, (g) => { g.fillStyle = `hsl(${hash(z, 1) * 360},20%,55%)`; g.fillRect(0, 0, 64, 64); g.fillStyle = "rgba(0,0,0,0.3)"; g.fillRect(16, 20, 32, 36); }), 0.4, 0.4, s * (Wh / 2 - 0.03), 1.55, z, -s * Math.PI / 2, "#2a1a10");
      this.endDoor = new THREE.Group(); this.endDoor.position.set(0, 0, -Lh + 0.52); p.add(this.endDoor); bx(this.endDoor, 0.9, 2.05, 0.05, M("#efe9df", 0.6), 0, 1.03, 0);
      add(this.endDoor, new THREE.SphereGeometry(0.035, 8, 6), M("#d8b04a", 0.3, undefined, { metalness: 1 }), 0.35, 1.0, 0.05);
      frame(this.endDoor, ctex("doorsign", 128, 48, (g) => { g.fillStyle = "#f2c230"; g.fillRect(0, 0, 128, 48); g.fillStyle = "#2a3f6a"; g.font = "bold 30px sans-serif"; g.textAlign = "center"; g.fillText("LUCAS", 64, 35); }), 0.3, 0.11, 0, 1.6, 0.04, 0, "#2a3f6a");
      plane(p, Wh, 2.5, wm, 0, 1.25, -Lh + 0.5);
      this.hallLight = new THREE.PointLight("#ffd8a0", 2.5, 8, 1.6); this.hallLight.position.set(0, 2.3, -2.5); p.add(this.hallLight);
      this.hallFlicker = new THREE.PointLight("#ff6a20", 0, 9, 1.4); this.hallFlicker.position.set(0.6, 0.8, -3.2); this.hallFlicker.castShadow = true; this.hallFlicker.shadow.mapSize.set(1024, 1024); this.hallFlicker.shadow.bias = -0.002; p.add(this.hallFlicker);
      this.hallHaze = new Haze(new THREE.Box3(V(-0.75, 0.6, -7.4), V(0.75, 2.5, 0.4)), 26, "#2e2a28", 5); p.add(this.hallHaze.root);
      this.hallFire = new Fire([{ p: V(0.72, 0.1, -3.2), s: 0.7 }, { p: V(-0.72, 0.2, -1.5), s: 0.5 }], "#1a1716", 0.6, []); p.add(this.hallFire.root);
      // casque du père, au sol
      this.helmet = new THREE.Group(); this.helmet.position.set(0.2, 0.0, -4.4); p.add(this.helmet);
      const hm = new THREE.MeshPhysicalMaterial({ color: "#cfd5dc", metalness: 0.6, roughness: 0.25, clearcoat: 1 });
      const dome = add(this.helmet, new THREE.SphereGeometry(0.17, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2), hm, 0, 0.03, 0); dome.scale.set(1, 0.85, 1.1);
      add(this.helmet, new THREE.CylinderGeometry(0.2, 0.22, 0.015, 32), hm, 0, 0.035, -0.03); bx(this.helmet, 0.035, 0.035, 0.33, hm, 0, 0.17, 0, 0, 0.01);
      bx(this.helmet, 0.07, 0.07, 0.01, M("#e0b84a", 0.25, undefined, { metalness: 0.9 }), 0, 0.12, 0.18, 0, 0.004);
      this.helmet.rotation.set(0.25, 0.7, 0.18);
    }
    // ---------------- standard de la caserne
    { const p = this.disp; room(p, 5, 4.4, 2.7, M("#3a4656", 0.85), M("#2a2e34", 0.7), M("#2a3038", 0.9));
      const desk = M("#5a5e66", 0.5); bx(p, 3.2, 0.06, 1.0, desk, 0, 0.76, -1.4); for (const x of [-1.5, 1.5]) bx(p, 0.06, 0.74, 0.9, desk, x, 0.38, -1.4);
      for (let i = 0; i < 3; i++) { const sm = new THREE.MeshStandardMaterial({ color: "#000", emissive: "#ffffff", emissiveMap: screenTex(i), emissiveIntensity: 1.2, map: screenTex(i) }); this.dispScreens.push(sm);
        const sg = new THREE.Group(); sg.position.set(-1.0 + i * 1.0, 1.15, -1.75); sg.rotation.y = (1 - i) * 0.3; p.add(sg); bx(sg, 0.8, 0.52, 0.05, M("#15171a", 0.4), 0, 0, 0); add(sg, new THREE.PlaneGeometry(0.74, 0.46), sm, 0, 0, 0.027, 0, false); bx(sg, 0.06, 0.3, 0.06, M("#15171a", 0.4), 0, -0.36, -0.02); }
      frame(p, ctex("citymap", 256, 192, (g) => { g.fillStyle = "#d8d2be"; g.fillRect(0, 0, 256, 192); g.strokeStyle = "#8a8270"; for (let i = 0; i < 20; i++) { g.lineWidth = 1 + (i % 4 === 0 ? 3 : 0); g.beginPath(); g.moveTo(0, hash(i, 1) * 192); g.lineTo(256, hash(i, 2) * 192); g.stroke(); }
        g.fillStyle = "#c4202a"; for (let i = 0; i < 9; i++) { g.beginPath(); g.arc(hash(i, 3) * 256, hash(i, 4) * 192, 4, 0, 7); g.fill(); } }), 1.6, 1.1, 0, 1.85, -2.17, 0, "#1a1a1a");
      this.dPhone = new Phone("#18191c", true); this.dPhone.root.position.set(0.85, 0.79, -1.15); this.dPhone.root.rotation.y = -0.4; p.add(this.dPhone.root);
      bx(p, 0.03, 0.5, 0.03, M("#2a2a2a", 0.4, undefined, { metalness: 0.6 }), -1.3, 1.04, -1.6); lampShade(p, -1.3, 1.3, -1.6, "#3a4a3a");
      this.dispLamp = new THREE.PointLight("#ffd29a", 4, 6, 1.5); this.dispLamp.position.set(-1.2, 1.25, -1.4); this.dispLamp.castShadow = true; this.dispLamp.shadow.mapSize.set(1024, 1024); this.dispLamp.shadow.bias = -0.002; p.add(this.dispLamp);
      const scr = new THREE.PointLight("#58f0c8", 0.9, 4, 1.6); scr.position.set(0, 1.2, -1.2); p.add(scr);
      bx(p, 0.55, 0.08, 0.55, M("#22252a", 0.6), 0.1, 0.48, -0.5, 0, 0.03); bx(p, 0.55, 0.6, 0.08, M("#22252a", 0.6), 0.1, 0.8, -0.2, 0, 0.03); add(p, new THREE.CylinderGeometry(0.04, 0.04, 0.44, 8), M("#555", 0.4, undefined, { metalness: 0.8 }), 0.1, 0.24, -0.5);
      windowAt(p, 2.49, 1.5, 0.2, -Math.PI / 2, 1.2, 1.0, true);
      add(p, new THREE.PlaneGeometry(0.8, 0.2), new THREE.MeshStandardMaterial({ color: "#000", emissive: "#ff2a1a", emissiveIntensity: 2, map: ctex("appelsign", 256, 64, (g) => { g.fillStyle = "#300"; g.fillRect(0, 0, 256, 64); g.fillStyle = "#fff"; g.font = "bold 40px sans-serif"; g.textAlign = "center"; g.fillText("APPEL 18", 128, 46); }), emissiveMap: ctex("appelsign", 256, 64, () => {}) }), 0, 2.45, -2.18, 0, false);
    }
    // ---------------- rue enneigée
    { const p = this.str; const snow = new THREE.MeshStandardMaterial({ map: rep(snowTex(), 30, 30), roughness: 0.92, color: "#ffffff" });
      add(p, new THREE.PlaneGeometry(260, 260).rotateX(-Math.PI / 2), snow, 0, 0, 0, 0, false);
      add(p, new THREE.PlaneGeometry(260, 8).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ map: rep(asphaltTex(), 60, 2), roughness: 0.45, color: "#c8ccd4" }), 0, 0.02, 0, 0, false);
      for (const z of [-4.6, 4.6]) add(p, new THREE.PlaneGeometry(260, 1.6).rotateX(-Math.PI / 2), M("#9aa0a8", 0.8), 0, 0.04, z * 1.12, 0, false);
      for (let i = 0; i < 40; i++) add(p, new THREE.PlaneGeometry(1.5, 0.15).rotateX(-Math.PI / 2), M("#d8dce0", 0.6), -130 + i * 6.5, 0.03, 0, 0, false);
      const cols = ["#c8b89a", "#9ab0c0", "#d8cfc0", "#a8b89a", "#e0d0b8", "#b8a0a0", "#c0c8d0"], roofs = ["#4a3a3a", "#3a4050", "#4a4440", "#3a3a3a"];
      for (let i = -4; i <= 4; i++) for (const north of [true, false]) { if (!north && Math.abs(i) > 3) continue;
        const h = new House(cols[(i + 8 + (north ? 0 : 3)) % cols.length], roofs[(i + 8) % 4], i + 4 + (north ? 0 : 9)); h.root.position.set(i * 13, 0, north ? -14 : 14); h.root.rotation.y = north ? 0 : Math.PI; p.add(h.root); this.houses.push(h);
        if (north && i === 0) this.lucas = h; if (north && i === 2) this.adult = h; }
      for (let i = -5; i <= 5; i++) { const x = i * 13 + 6.5; for (const side of [-1, 1]) { if ((i + (side > 0 ? 1 : 0)) % 2) continue; const z = side * 6.2;
        add(p, new THREE.CylinderGeometry(0.07, 0.1, 4.6, 10), M("#2a2e36", 0.5, undefined, { metalness: 0.6 }), x, 2.3, z); bx(p, 0.12, 0.08, 1.0, M("#2a2e36", 0.5), x, 4.6, z - side * 0.45);
        const bm = E("#ffd29a", 5); add(p, new THREE.CylinderGeometry(0.22, 0.32, 0.22, 14), M("#2a2e36", 0.5), x, 4.5, z - side * 0.9); add(p, new THREE.SphereGeometry(0.13, 10, 8), bm, x, 4.38, z - side * 0.9, 0, false); this.lampBulbs.push(bm);
        if (Math.abs(i) <= 2) { const l = new THREE.PointLight("#ffc890", 25, 16, 1.6); l.position.set(x, 4.2, z - side * 0.9); p.add(l); this.lamps.push(l); } } }
      for (let i = 0; i < 14; i++) tree(p, -80 + i * 12.5 + hash(i, 1) * 4, (i % 2 ? 1 : -1) * (24 + hash(i, 2) * 8), 1.1 + hash(i, 3) * 0.4, i);
      for (const x of [-60, 60]) for (let i = 0; i < 4; i++) bx(p, 4.5, 1.6, 2, M(["#3a4a5a", "#5a3a3a", "#4a4a4a", "#e0e0e0"][i], 0.4, undefined, { metalness: 0.4 }), x + i * 6, 0.9, (i % 2 ? 3.2 : -3.2), 0, 0.3);
      for (const x of [-6, 4]) { const tr = new Truck(); tr.root.position.set(x, 0, -1.6 + (x > 0 ? 0 : 0.1)); tr.root.rotation.y = x > 0 ? -Math.PI / 2 - 0.12 : Math.PI / 2 + 0.1; p.add(tr.root); this.trucks.push(tr); }
      this.houseFire = new Fire([{ p: V(-2.7, 1.0, -9.8), s: 1.6 }, { p: V(2.7, 1.0, -9.8), s: 1.7 }, { p: V(0, 3.6, -9.8), s: 1.3 }, { p: V(-2.5, 4.2, -14), s: 2.4 }, { p: V(2.0, 4.6, -15), s: 2.6 }, { p: V(0, 0.9, -9.6), s: 1.2 }, { p: V(0, 6.2, -14), s: 2.2 }],
        "#151315", 1.4, [V(0, 2, -8.2), V(-3, 2.5, -8.5), V(3, 2.5, -8.5)]); p.add(this.houseFire.root);
      this.moon = new THREE.DirectionalLight("#a8b8ff", 0.9); this.moon.position.set(-30, 40, 30); this.moon.target.position.set(0, 0, -6); this.moon.castShadow = true; this.moon.shadow.mapSize.set(2048, 2048);
      Object.assign(this.moon.shadow.camera, { left: -30, right: 30, top: 30, bottom: -30, near: 1, far: 140 }); this.moon.shadow.bias = -0.0005; p.add(this.moon, this.moon.target);
      this.strHemi = new THREE.HemisphereLight("#5a6aa8", "#2a2a3a", 0.6); p.add(this.strHemi);
    }
    // ---------------- cimetière
    { const p = this.cem; add(p, new THREE.PlaneGeometry(200, 200).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ map: rep(snowTex(), 25, 25), roughness: 0.95 }), 0, 0, 0, 0, false);
      add(p, new THREE.PlaneGeometry(2.4, 120).rotateX(-Math.PI / 2), M("#7a7470", 0.9), 0, 0.01, 0, 0, false);
      const st = new THREE.MeshStandardMaterial({ map: rep(stoneTex(), 1, 1), roughness: 0.85, color: "#c8cad0" });
      const headstone = (x: number, z: number, k: number, tex?: THREE.Texture) => { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = (hash(k, 9) - 0.5) * 0.12; p.add(g);
        const sh = new THREE.Shape(), w = 0.36 + hash(k, 1) * 0.12, h = 0.7 + hash(k, 2) * 0.4; sh.moveTo(-w, 0); sh.lineTo(-w, h); sh.absarc(0, h, w, Math.PI, 0, true); sh.lineTo(w, 0); sh.lineTo(-w, 0);
        add(g, new THREE.ExtrudeGeometry(sh, { depth: 0.14, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 2 }), st, 0, 0.12, -0.07);
        if (tex) add(g, new THREE.PlaneGeometry(w * 1.6, h * 1.25), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.85, transparent: true, opacity: 0.95 }), 0, 0.12 + (h + w) * 0.5, 0.1, 0, false);
        bx(g, w * 2 + 0.3, 0.12, 1.9, M("#8a8c92", 0.9), 0, 0.06, 0.9); add(g, new THREE.PlaneGeometry(w * 2 + 0.1, 1.7).rotateX(-Math.PI / 2), M("#eef3fa", 0.95), 0, 0.125, 0.92, 0, false); return g; };
      for (let r = 0; r < 6; r++) for (let c = 0; c < 10; c++) { const x = (c < 5 ? -1 : 1) * (2.6 + (c % 5) * 2.2) + (hash(r * 10 + c, 4) - 0.5) * 0.3, z = -14 + r * 4.2; if (r === 2 && c === 6) continue; if (r === 3 && c === 1) continue;
        if (hash(r * 10 + c, 5) < 0.2) { const g = new THREE.Group(); g.position.set(x, 0, z); p.add(g); bx(g, 0.14, 1.3, 0.14, st, 0, 0.65, 0); bx(g, 0.7, 0.14, 0.14, st, 0, 0.95, 0); } else headstone(x, z, r * 10 + c, tombTex(false)); }
      this.tomb = headstone(-4.8, -1.4, 99, tombTex(true));
      this.flowers = new THREE.Group(); this.flowers.position.set(-4.8, 0.14, -0.6); p.add(this.flowers);
      for (let i = 0; i < 9; i++) { const a = i * 0.7, st2 = add(this.flowers, new THREE.CylinderGeometry(0.006, 0.006, 0.34, 4), M("#2a5a2a", 0.8), Math.cos(a) * 0.04, 0.17, Math.sin(a) * 0.04, 0, false); st2.rotation.set(Math.sin(a) * 0.25, 0, Math.cos(a) * 0.25);
        add(this.flowers, new THREE.SphereGeometry(0.045, 10, 8), M(["#e8243a", "#f4f2ee", "#e8243a"][i % 3], 0.6), Math.cos(a) * 0.1, 0.34 + hash(i, 1) * 0.04, Math.sin(a) * 0.1, 0, false); }
      this.flowers.rotation.x = -1.35; this.flowers.position.y = 0.2;
      this.grave = new THREE.Group(); this.grave.position.set(5.0, 0, 0.0); p.add(this.grave);
      bx(this.grave, 1.2, 0.05, 2.4, M("#2a1e16", 1), 0, 0.01, 0); add(this.grave, new THREE.SphereGeometry(1, 20, 10, 0, 7, 0, 1.2), M("#4a3626", 1), 1.6, -0.55, 0).scale.set(0.8, 0.9, 1.6);
      this.coffin = bx(this.grave, 0.75, 0.5, 2.1, new THREE.MeshPhysicalMaterial({ color: "#4a2a18", roughness: 0.35, clearcoat: 0.8 }), 0, 0.3, 0, 0, 0.04);
      for (const z of [-0.8, 0, 0.8]) bx(this.grave, 0.8, 0.04, 0.06, M("#c9a24a", 0.3, undefined, { metalness: 0.9 }), 0, 0.42, z, 0, 0.01);
      for (let i = 0; i < 5; i++) add(this.grave, new THREE.SphereGeometry(0.06, 8, 6), M(["#f4f2ee", "#e8243a"][i % 2], 0.6), (hash(i, 1) - 0.5) * 0.4, 0.58, -0.3 + i * 0.15, 0, false);
      const iron = M("#1a1a1e", 0.5, undefined, { metalness: 0.6 }); for (let i = 0; i < 70; i++) bx(p, 0.04, 1.6, 0.04, iron, -35 + i, 0.8, -20, 0, 0.01); bx(p, 70, 0.06, 0.06, iron, 0, 1.4, -20); bx(p, 70, 0.06, 0.06, iron, 0, 0.3, -20);
      for (let i = 0; i < 9; i++) tree(p, (i % 2 ? 1 : -1) * (15 + hash(i, 1) * 8), -18 + i * 5, 1.3 + hash(i, 2) * 0.5, i + 20);
      add(p, new THREE.PlaneGeometry(400, 60), new THREE.MeshBasicMaterial({ color: "#6a7290", fog: true }), 0, 20, -70, 0, false);
      this.cemSun = new THREE.DirectionalLight("#ffe2c0", 1.0); this.cemSun.position.set(-20, 18, 25); this.cemSun.target.position.set(0, 0, -2); this.cemSun.castShadow = true; this.cemSun.shadow.mapSize.set(2048, 2048);
      Object.assign(this.cemSun.shadow.camera, { left: -20, right: 20, top: 20, bottom: -20, near: 1, far: 100 }); this.cemSun.shadow.bias = -0.0005; p.add(this.cemSun, this.cemSun.target);
      this.cemHemi = new THREE.HemisphereLight("#a8b4d0", "#3a3a44", 0.9); p.add(this.cemHemi);
    }
    // ---------------- cour d'école
    { const p = this.sch; add(p, new THREE.PlaneGeometry(200, 200).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ map: rep(snowTex(), 25, 25), roughness: 0.95 }), 0, 0, 0, 0, false);
      add(p, new THREE.PlaneGeometry(30, 18).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ map: rep(asphaltTex(), 8, 5), roughness: 0.6, color: "#c0c4cc" }), 0, 0.01, 0, 0, false);
      for (let i = 0; i < 4; i++) add(p, new THREE.RingGeometry(1.4 + i * 0.01, 1.5 + i * 0.01, 40).rotateX(-Math.PI / 2), M("#e8e2d0", 0.7), -6 + i * 4.5, 0.02, 2, 0, false);
      const bm = new THREE.MeshStandardMaterial({ map: rep(brickTex(), 8, 3), roughness: 0.9 }); bx(p, 32, 7, 6, bm, 0, 3.5, -12, 0, 0.05); bx(p, 32.6, 0.4, 6.6, M("#6a6060", 0.8), 0, 7.2, -12);
      for (let r = 0; r < 2; r++) for (let c = 0; c < 10; c++) { const x = -13.5 + c * 3, y = 1.8 + r * 3.1; add(p, new THREE.PlaneGeometry(1.8, 1.6), new THREE.MeshStandardMaterial({ color: "#1a2030", emissive: "#ffe0b0", emissiveIntensity: hash(r * 10 + c, 1) < 0.5 ? 0.5 : 0.1, roughness: 0.2 }), x, y, -8.98, 0, false);
        for (const [ww, hh, xx, yy] of [[2.0, 0.1, 0, 0.85], [2.0, 0.14, 0, -0.85], [0.1, 1.7, -0.95, 0], [0.1, 1.7, 0.95, 0], [0.06, 1.6, 0, 0]] as const) bx(p, ww, hh, 0.1, M("#e8e2d0", 0.5), x + xx, y + yy, -8.95); }
      bx(p, 2.2, 2.6, 0.1, M("#2a4a6a", 0.6), 0, 1.3, -8.95); frame(p, ctex("ecole", 256, 64, (g) => { g.fillStyle = "#e8e2d0"; g.fillRect(0, 0, 256, 64); g.fillStyle = "#2a3f6a"; g.font = "bold 44px Georgia, serif"; g.textAlign = "center"; g.fillText("ÉCOLE", 128, 48); }), 3, 0.7, 0, 5.4, -8.9, 0, "#5a4a3a");
      const bw = M("#6a4a2a", 0.7); bx(p, 2.2, 0.08, 0.5, bw, 6, 0.48, -4.5); bx(p, 2.2, 0.45, 0.06, bw, 6, 0.75, -4.75); for (const x of [5.1, 6.9]) bx(p, 0.08, 0.45, 0.45, M("#2a2a2e", 0.5, undefined, { metalness: 0.6 }), x, 0.22, -4.5);
      add(p, new THREE.PlaneGeometry(2, 0.4).rotateX(-Math.PI / 2), M("#eef3fa", 0.95), 6, 0.53, -4.5, 0, false);
      tree(p, 9.5, -5, 1.3, 31); tree(p, -10, -4, 1.2, 32);
      const iron = M("#2a3a2a", 0.5, undefined, { metalness: 0.5 }); for (let i = 0; i < 40; i++) bx(p, 0.05, 1.8, 0.05, iron, -20 + i, 0.9, 9, 0, 0.01); bx(p, 40, 0.06, 0.06, iron, 0, 1.6, 9);
      add(p, new THREE.CylinderGeometry(0.07, 0.07, 3.2, 10), M("#8a8e94", 0.4, undefined, { metalness: 0.7 }), -11, 1.6, -3); bx(p, 1.1, 0.75, 0.05, M("#f4f4f4", 0.4), -11, 3.1, -2.9); add(p, new THREE.TorusGeometry(0.22, 0.015, 8, 24).rotateX(Math.PI / 2), M("#d8402a", 0.4), -11, 2.85, -2.62);
      this.schSun = new THREE.DirectionalLight("#fff0dc", 1.4); this.schSun.position.set(18, 22, 20); this.schSun.target.position.set(2, 0, -3); this.schSun.castShadow = true; this.schSun.shadow.mapSize.set(2048, 2048);
      Object.assign(this.schSun.shadow.camera, { left: -20, right: 20, top: 20, bottom: -20, near: 1, far: 100 }); this.schSun.shadow.bias = -0.0005; p.add(this.schSun, this.schSun.target);
      this.schHemi = new THREE.HemisphereLight("#c8d4e8", "#5a5a60", 1.0); p.add(this.schHemi);
    }
  }
  show(set: keyof typeof O) { const map = { LIV: this.liv, BED: this.bed, HALL: this.hall, DISP: this.disp, STR: this.str, CEM: this.cem, SCH: this.sch }; for (const [k, g] of Object.entries(map)) g.visible = k === set; }
  /** horloge : heure décimale (ex. 23.0) */
  clock(h: number) { const m = (h % 1) * 60, s = (m % 1) * 60; this.clockH.rotation.z = -((h % 12) / 12) * Math.PI * 2; this.clockM.rotation.z = -(m / 60) * Math.PI * 2; this.clockS.rotation.z = -(Math.floor(s) / 60) * Math.PI * 2; }
}
