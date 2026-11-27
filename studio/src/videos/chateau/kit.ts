// Outils de construction partagés (repris de tort/sets.ts) : matériaux, boîtes arrondies, cylindres, plans, groupes.
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { ctex, hash, signTex, stoneTex } from "./tex";
export const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
// ------------------------------------------------------------ matériaux et textures peintes
const mats = new Map<string, THREE.MeshStandardMaterial>();
export const M = (col: string, rough = 0.8, map?: THREE.Texture, extra: THREE.MeshStandardMaterialParameters = {}) => {
  const k = col + rough + (map ? map.uuid : "") + JSON.stringify(extra); let m = mats.get(k);
  if (!m) { m = new THREE.MeshStandardMaterial({ color: col, roughness: rough, map, ...extra }); mats.set(k, m); } return m;
};
export const P = (col: string, rough = 0.3) => new THREE.MeshPhysicalMaterial({ color: col, roughness: rough, clearcoat: 1, clearcoatRoughness: 0.12 });
export const E = (col: string, i = 1.5) => new THREE.MeshStandardMaterial({ color: "#000", emissive: col, emissiveIntensity: i, roughness: 1 });
export const noise = (g: CanvasRenderingContext2D, w: number, h: number, n: number, a: number, r: number, seed = 0) => {
  for (let i = 0; i < n; i++) { g.fillStyle = `rgba(${hash(i, seed + 1) < 0.5 ? "0,0,0" : "255,255,255"},${a * (0.3 + hash(i, seed + 2) * 0.7)})`; g.beginPath(); g.arc(hash(i, seed + 3) * w, hash(i, seed + 4) * h, r * (0.3 + hash(i, seed + 5)), 0, 7); g.fill(); } };
export const rep = (t: THREE.Texture, x: number, y: number) => { const c = t.clone(); c.wrapS = c.wrapT = THREE.RepeatWrapping; c.repeat.set(x, y); c.needsUpdate = true; return c; };
export const woodTex = (a: string) => ctex("wood_" + a, 256, 256, (g) => { g.fillStyle = a; g.fillRect(0, 0, 256, 256);
  for (let r = 0; r < 8; r++) { const y = r * 32; g.fillStyle = `rgba(0,0,0,${0.04 + hash(r, 1) * 0.08})`; g.fillRect(0, y, 256, 32); g.fillStyle = "rgba(0,0,0,0.3)"; g.fillRect(0, y, 256, 2); g.fillRect(hash(r, 2) * 256, y, 2, 32);
    for (let k = 0; k < 9; k++) { g.strokeStyle = `rgba(60,30,10,${0.06 + hash(r * 9 + k, 3) * 0.08})`; g.lineWidth = 1; g.beginPath(); g.moveTo(0, y + 4 + k * 3); g.bezierCurveTo(80, y + 2 + k * 3 + hash(k, r) * 4, 170, y + 6 + k * 3, 256, y + 4 + k * 3); g.stroke(); } } }, true);
export const stripesTex = (a: string, b: string, n = 8) => ctex(`str_${a}_${b}_${n}`, 256, 256, (g) => { for (let i = 0; i < n; i++) { g.fillStyle = i % 2 ? b : a; g.fillRect(i * 256 / n, 0, 256 / n, 256); } noise(g, 256, 256, 300, 0.03, 5); }, true);
export const dotsTex = (a: string, b: string) => ctex(`dots_${a}_${b}`, 256, 256, (g) => { g.fillStyle = a; g.fillRect(0, 0, 256, 256); g.fillStyle = b; for (let y = 0; y < 256; y += 32) for (let x = (y / 32) % 2 * 16; x < 256; x += 32) { g.beginPath(); g.arc(x + 8, y + 8, 5, 0, 7); g.fill(); } noise(g, 256, 256, 300, 0.03, 5); }, true);
export const tileTex = (a: string, b: string, n = 8) => ctex(`tile_${a}_${b}_${n}`, 256, 256, (g) => { const s = 256 / n; for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { g.fillStyle = (x + y) % 2 ? a : b; g.fillRect(x * s, y * s, s, s); }
  g.strokeStyle = "rgba(0,0,0,0.12)"; for (let i = 0; i <= n; i++) { g.beginPath(); g.moveTo(i * s, 0); g.lineTo(i * s, 256); g.moveTo(0, i * s); g.lineTo(256, i * s); g.stroke(); } noise(g, 256, 256, 400, 0.025, 4); }, true);
const sidingTex = (col: string) => ctex("sid_" + col, 128, 128, (g) => { g.fillStyle = col; g.fillRect(0, 0, 128, 128);
  for (let y = 0; y < 128; y += 16) { g.fillStyle = "rgba(0,0,0,0.16)"; g.fillRect(0, y + 13, 128, 3); g.fillStyle = "rgba(255,255,255,0.14)"; g.fillRect(0, y, 128, 2); } noise(g, 128, 128, 120, 0.03, 3); }, true);
const shingleTex = (col: string) => ctex("sh_" + col, 128, 128, (g) => { g.fillStyle = col; g.fillRect(0, 0, 128, 128);
  for (let r = 0; r < 8; r++) for (let c = 0; c < 6; c++) { g.fillStyle = `rgba(0,0,0,${0.06 + hash(r * 6 + c, 1) * 0.16})`; g.fillRect(c * 22 + (r % 2) * 11, r * 16, 20, 14); } }, true);
const grassTex = () => ctex("grass", 256, 256, (g) => { g.fillStyle = "#5cb848"; g.fillRect(0, 0, 256, 256); for (let i = 0; i < 2600; i++) { g.fillStyle = `hsl(${95 + hash(i, 1) * 30},${50 + hash(i, 2) * 20}%,${36 + hash(i, 3) * 22}%)`; g.fillRect(hash(i, 4) * 256, hash(i, 5) * 256, 2, 5); } }, true);
const asphaltTex = () => ctex("asph", 256, 256, (g) => { g.fillStyle = "#5a5e68"; g.fillRect(0, 0, 256, 256); noise(g, 256, 256, 3000, 0.1, 1.5); noise(g, 256, 256, 60, 0.05, 20, 3); }, true);
const brickTex = () => ctex("brickS", 256, 256, (g) => { g.fillStyle = "#e8dccb"; g.fillRect(0, 0, 256, 256);
  for (let r = 0; r < 16; r++) for (let c = 0; c < 8; c++) { g.fillStyle = `hsl(${10 + hash(r * 8 + c, 1) * 12},${50 + hash(r, c) * 15}%,${46 + hash(r * 8 + c, 2) * 10}%)`; g.fillRect(c * 32 + (r % 2) * 16 + 1, r * 16 + 1, 30, 14); } noise(g, 256, 256, 600, 0.04, 2); }, true);
const paperTex = () => ctex("paperBlank", 256, 256, (g) => { g.fillStyle = "#fbfaf6"; g.fillRect(0, 0, 256, 256); noise(g, 256, 256, 500, 0.018, 3);
  g.strokeStyle = "rgba(120,120,130,0.10)"; g.lineWidth = 2; for (let i = 0; i < 14; i++) { g.beginPath(); const x = hash(i, 4) * 256, y = hash(i, 5) * 256; g.moveTo(x, y); g.lineTo(x + 40 + hash(i, 6) * 60, y + (hash(i, 7) - 0.5) * 20); g.stroke(); } }, true);
export const skyTex = () => ctex("skyDay", 64, 512, (g) => { const gr = g.createLinearGradient(0, 0, 0, 512); gr.addColorStop(0, "#3d8de0"); gr.addColorStop(0.55, "#8cc4f2"); gr.addColorStop(1, "#e6f4ff"); g.fillStyle = gr; g.fillRect(0, 0, 64, 512); });
const viewTex = () => ctex("viewDay", 512, 384, (g) => { const gr = g.createLinearGradient(0, 0, 0, 384); gr.addColorStop(0, "#4a9ae6"); gr.addColorStop(1, "#d8eeff"); g.fillStyle = gr; g.fillRect(0, 0, 512, 384);
  for (let i = 0; i < 5; i++) { g.fillStyle = "rgba(255,255,255,0.9)"; const x = hash(i, 1) * 512, y = 40 + hash(i, 2) * 90; for (let k = 0; k < 4; k++) { g.beginPath(); g.arc(x + k * 22, y + (k % 2) * 6, 18 + hash(i, k) * 10, 0, 7); g.fill(); } }
  for (let i = 0; i < 9; i++) { const x = i * 60 - 10 + hash(i, 3) * 20, w = 50 + hash(i, 4) * 30, h = 70 + hash(i, 5) * 90; g.fillStyle = ["#f2a65a", "#e86a5a", "#f4d35e", "#7ac0a0", "#e8e0d0", "#9ab8e8"][i % 6]; g.fillRect(x, 300 - h, w, h + 90);
    g.fillStyle = ["#a8423a", "#5a4a8a", "#3a6a8a"][i % 3]; g.beginPath(); g.moveTo(x - 6, 300 - h); g.lineTo(x + w / 2, 300 - h - 30); g.lineTo(x + w + 6, 300 - h); g.fill();
    g.fillStyle = "#fff8e0"; for (let r = 0; r < 2; r++) for (let c = 0; c < 2; c++) g.fillRect(x + 8 + c * (w / 2), 300 - h + 14 + r * 32, 12, 16); }
  g.fillStyle = "#4aa848"; for (let i = 0; i < 14; i++) { g.beginPath(); g.arc(i * 40 + hash(i, 6) * 20, 320, 26 + hash(i, 7) * 12, 0, 7); g.fill(); } g.fillStyle = "#6ac058"; g.fillRect(0, 330, 512, 60); });
const chalkTex = () => ctex("board", 1024, 512, (g) => { g.fillStyle = "#2a4a3a"; g.fillRect(0, 0, 1024, 512); noise(g, 1024, 512, 900, 0.05, 6);
  g.strokeStyle = "rgba(255,255,255,0.85)"; g.fillStyle = "rgba(255,255,255,0.88)"; g.font = "bold 64px 'Comic Sans MS', cursive"; g.fillText("Arts : dessine ton rêve !", 90, 110);
  g.lineWidth = 6; g.beginPath(); g.arc(780, 330, 90, 0, 7); g.stroke(); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; g.beginPath(); g.moveTo(780 + Math.cos(a) * 110, 330 + Math.sin(a) * 110); g.lineTo(780 + Math.cos(a) * 150, 330 + Math.sin(a) * 150); g.stroke(); }
  g.beginPath(); g.moveTo(120, 420); g.lineTo(220, 300); g.lineTo(320, 420); g.closePath(); g.stroke(); g.strokeRect(150, 420, 140, 0.1); g.font = "48px 'Comic Sans MS', cursive"; g.fillText("1 + 1 = 2", 380, 280); g.fillText("lundi 14", 420, 400);
  g.fillStyle = "rgba(255,255,255,0.15)"; for (let i = 0; i < 6; i++) g.fillRect(hash(i, 1) * 900, hash(i, 2) * 450, 120, 30); });
export const kidArtTex = (k: number) => ctex("kidart" + k, 256, 320, (g) => { g.fillStyle = "#fffdf6"; g.fillRect(0, 0, 256, 320); const c = ["#e84a3a", "#2a7ae8", "#f2b51c", "#2fae7a", "#ff5fa4", "#9a5ad8"];
  g.lineWidth = 8; g.lineCap = "round"; g.fillStyle = c[k % 6]; g.beginPath(); g.arc(80 + hash(k, 1) * 100, 90, 40, 0, 7); g.fill();
  g.strokeStyle = c[(k + 2) % 6]; g.beginPath(); g.moveTo(20, 260); for (let x = 20; x < 240; x += 20) g.lineTo(x, 250 + Math.sin(x * 0.05 + k) * 20); g.stroke();
  g.fillStyle = c[(k + 3) % 6]; g.fillRect(70, 160, 110, 80); g.fillStyle = c[(k + 1) % 6]; g.beginPath(); g.moveTo(60, 160); g.lineTo(125, 110); g.lineTo(190, 160); g.fill(); g.strokeStyle = "#222"; g.lineWidth = 4; g.strokeRect(70, 160, 110, 80); });
export const posterTex = (k: number) => ctex("poster" + k, 256, 360, (g) => { const bgc = ["#1a2a5a", "#5a1a3a", "#1a4a3a", "#3a1a5a"][k % 4]; g.fillStyle = bgc; g.fillRect(0, 0, 256, 360);
  const gr = g.createRadialGradient(128, 150, 10, 128, 150, 140); gr.addColorStop(0, ["#ffcf40", "#40e0ff", "#ff5fa4", "#9aff60"][k % 4]); gr.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = gr; g.fillRect(0, 0, 256, 360);
  g.fillStyle = "#fff"; g.font = "bold 40px Impact, sans-serif"; g.textAlign = "center"; g.fillText(["GALAXY", "RACER", "DRAGON", "PIXEL"][k % 4], 128, 320);
  g.fillStyle = "#111"; g.beginPath(); g.moveTo(128, 70); g.lineTo(190, 230); g.lineTo(66, 230); g.fill(); });

export const rb = (w: number, h: number, d: number, r = 0.02) => new RoundedBoxGeometry(w, h, d, 2, Math.max(1e-3, Math.min(r, w / 2 - 1e-3, h / 2 - 1e-3, d / 2 - 1e-3)));
export const add = (p: THREE.Object3D, g: THREE.BufferGeometry, m: THREE.Material, x = 0, y = 0, z = 0, ry = 0, cast = true) => {
  const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.rotation.y = ry; o.castShadow = cast; o.receiveShadow = true; p.add(o); return o; };
export const bx = (p: THREE.Object3D, w: number, h: number, d: number, m: THREE.Material, x: number, y: number, z: number, ry = 0, r = 0.015) => add(p, rb(w, h, d, r), m, x, y, z, ry);
export const cyl = (p: THREE.Object3D, r0: number, r1: number, h: number, m: THREE.Material, x: number, y: number, z: number, seg = 20) => add(p, new THREE.CylinderGeometry(r0, r1, h, seg), m, x, y, z);
export const plane = (p: THREE.Object3D, w: number, h: number, m: THREE.Material, x: number, y: number, z: number, rx = 0, ry = 0) => { const o = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); o.position.set(x, y, z); o.rotation.set(rx, ry, 0); o.receiveShadow = true; o.userData.noEdge = true; p.add(o); return o; };
export const grp = (p: THREE.Object3D, x = 0, y = 0, z = 0, ry = 0) => { const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; p.add(g); return g; };
