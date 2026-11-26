// Les Dessins : décors (mètres). Chaque décor est un groupe avec ses lumières, affiché seul selon le plan.
// TOWN ville joyeuse (maison du héros) · BED chambre · FRD bureau du meilleur ami · CLS salle de classe · YARD cour + façade de l'école
// HALL couloir (casiers, peinture murale, gomme géante) · ART salle d'arts plastiques · OTH l'autre monde (la foule aux carnets).
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { ctex, hash, signTex } from "./tex";
import { Drawn, Page, Crumbs, rect, line, circ, poly, Stroke } from "./magic";

export const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
export const O = { TOWN: V(0, 0, 300), BED: V(40, 0, 0), FRD: V(80, 0, 0), CLS: V(120, 0, 0), HALL: V(200, 0, 0), ART: V(260, 0, 0), YARD: V(-400, 0, 300), OTH: V(0, 0, -400) };
export type SetK = keyof typeof O;

// ------------------------------------------------------------ matériaux et textures peintes
const mats = new Map<string, THREE.MeshStandardMaterial>();
export const M = (col: string, rough = 0.8, map?: THREE.Texture, extra: THREE.MeshStandardMaterialParameters = {}) => {
  const k = col + rough + (map ? map.uuid : "") + JSON.stringify(extra); let m = mats.get(k);
  if (!m) { m = new THREE.MeshStandardMaterial({ color: col, roughness: rough, map, ...extra }); mats.set(k, m); } return m;
};
const P = (col: string, rough = 0.3) => new THREE.MeshPhysicalMaterial({ color: col, roughness: rough, clearcoat: 1, clearcoatRoughness: 0.12 });
const E = (col: string, i = 1.5) => new THREE.MeshStandardMaterial({ color: "#000", emissive: col, emissiveIntensity: i, roughness: 1 });
const noise = (g: CanvasRenderingContext2D, w: number, h: number, n: number, a: number, r: number, seed = 0) => {
  for (let i = 0; i < n; i++) { g.fillStyle = `rgba(${hash(i, seed + 1) < 0.5 ? "0,0,0" : "255,255,255"},${a * (0.3 + hash(i, seed + 2) * 0.7)})`; g.beginPath(); g.arc(hash(i, seed + 3) * w, hash(i, seed + 4) * h, r * (0.3 + hash(i, seed + 5)), 0, 7); g.fill(); } };
const rep = (t: THREE.Texture, x: number, y: number) => { const c = t.clone(); c.wrapS = c.wrapT = THREE.RepeatWrapping; c.repeat.set(x, y); c.needsUpdate = true; return c; };
const woodTex = (a: string) => ctex("wood_" + a, 256, 256, (g) => { g.fillStyle = a; g.fillRect(0, 0, 256, 256);
  for (let r = 0; r < 8; r++) { const y = r * 32; g.fillStyle = `rgba(0,0,0,${0.04 + hash(r, 1) * 0.08})`; g.fillRect(0, y, 256, 32); g.fillStyle = "rgba(0,0,0,0.3)"; g.fillRect(0, y, 256, 2); g.fillRect(hash(r, 2) * 256, y, 2, 32);
    for (let k = 0; k < 9; k++) { g.strokeStyle = `rgba(60,30,10,${0.06 + hash(r * 9 + k, 3) * 0.08})`; g.lineWidth = 1; g.beginPath(); g.moveTo(0, y + 4 + k * 3); g.bezierCurveTo(80, y + 2 + k * 3 + hash(k, r) * 4, 170, y + 6 + k * 3, 256, y + 4 + k * 3); g.stroke(); } } }, true);
const stripesTex = (a: string, b: string, n = 8) => ctex(`str_${a}_${b}_${n}`, 256, 256, (g) => { for (let i = 0; i < n; i++) { g.fillStyle = i % 2 ? b : a; g.fillRect(i * 256 / n, 0, 256 / n, 256); } noise(g, 256, 256, 300, 0.03, 5); }, true);
const dotsTex = (a: string, b: string) => ctex(`dots_${a}_${b}`, 256, 256, (g) => { g.fillStyle = a; g.fillRect(0, 0, 256, 256); g.fillStyle = b; for (let y = 0; y < 256; y += 32) for (let x = (y / 32) % 2 * 16; x < 256; x += 32) { g.beginPath(); g.arc(x + 8, y + 8, 5, 0, 7); g.fill(); } noise(g, 256, 256, 300, 0.03, 5); }, true);
const tileTex = (a: string, b: string, n = 8) => ctex(`tile_${a}_${b}_${n}`, 256, 256, (g) => { const s = 256 / n; for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { g.fillStyle = (x + y) % 2 ? a : b; g.fillRect(x * s, y * s, s, s); }
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
const kidArtTex = (k: number) => ctex("kidart" + k, 256, 320, (g) => { g.fillStyle = "#fffdf6"; g.fillRect(0, 0, 256, 320); const c = ["#e84a3a", "#2a7ae8", "#f2b51c", "#2fae7a", "#ff5fa4", "#9a5ad8"];
  g.lineWidth = 8; g.lineCap = "round"; g.fillStyle = c[k % 6]; g.beginPath(); g.arc(80 + hash(k, 1) * 100, 90, 40, 0, 7); g.fill();
  g.strokeStyle = c[(k + 2) % 6]; g.beginPath(); g.moveTo(20, 260); for (let x = 20; x < 240; x += 20) g.lineTo(x, 250 + Math.sin(x * 0.05 + k) * 20); g.stroke();
  g.fillStyle = c[(k + 3) % 6]; g.fillRect(70, 160, 110, 80); g.fillStyle = c[(k + 1) % 6]; g.beginPath(); g.moveTo(60, 160); g.lineTo(125, 110); g.lineTo(190, 160); g.fill(); g.strokeStyle = "#222"; g.lineWidth = 4; g.strokeRect(70, 160, 110, 80); });
const posterTex = (k: number) => ctex("poster" + k, 256, 360, (g) => { const bgc = ["#1a2a5a", "#5a1a3a", "#1a4a3a", "#3a1a5a"][k % 4]; g.fillStyle = bgc; g.fillRect(0, 0, 256, 360);
  const gr = g.createRadialGradient(128, 150, 10, 128, 150, 140); gr.addColorStop(0, ["#ffcf40", "#40e0ff", "#ff5fa4", "#9aff60"][k % 4]); gr.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = gr; g.fillRect(0, 0, 256, 360);
  g.fillStyle = "#fff"; g.font = "bold 40px Impact, sans-serif"; g.textAlign = "center"; g.fillText(["GALAXY", "RACER", "DRAGON", "PIXEL"][k % 4], 128, 320);
  g.fillStyle = "#111"; g.beginPath(); g.moveTo(128, 70); g.lineTo(190, 230); g.lineTo(66, 230); g.fill(); });

const rb = (w: number, h: number, d: number, r = 0.02) => new RoundedBoxGeometry(w, h, d, 2, Math.max(1e-3, Math.min(r, w / 2 - 1e-3, h / 2 - 1e-3, d / 2 - 1e-3)));
export const add = (p: THREE.Object3D, g: THREE.BufferGeometry, m: THREE.Material, x = 0, y = 0, z = 0, ry = 0, cast = true) => {
  const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.rotation.y = ry; o.castShadow = cast; o.receiveShadow = true; p.add(o); return o; };
const bx = (p: THREE.Object3D, w: number, h: number, d: number, m: THREE.Material, x: number, y: number, z: number, ry = 0, r = 0.015) => add(p, rb(w, h, d, r), m, x, y, z, ry);
const cyl = (p: THREE.Object3D, r0: number, r1: number, h: number, m: THREE.Material, x: number, y: number, z: number, seg = 20) => add(p, new THREE.CylinderGeometry(r0, r1, h, seg), m, x, y, z);
const plane = (p: THREE.Object3D, w: number, h: number, m: THREE.Material, x: number, y: number, z: number, rx = 0, ry = 0) => { const o = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); o.position.set(x, y, z); o.rotation.set(rx, ry, 0); o.receiveShadow = true; o.userData.noEdge = true; p.add(o); return o; };
const grp = (p: THREE.Object3D, x = 0, y = 0, z = 0, ry = 0) => { const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; p.add(g); return g; };

/** pièce : sol, plafond, 4 murs + plinthes */
const room = (p: THREE.Object3D, w: number, d: number, h: number, wall: THREE.Material, floor: THREE.Material, ceil = M("#d4eaf4", 0.9)) => {
  plane(p, w, d, floor, 0, 0, 0, -Math.PI / 2); plane(p, w, d, ceil, 0, h, 0, Math.PI / 2);
  plane(p, w, h, wall, 0, h / 2, -d / 2); plane(p, w, h, wall, 0, h / 2, d / 2, 0, Math.PI); plane(p, d, h, wall, -w / 2, h / 2, 0, 0, Math.PI / 2); plane(p, d, h, wall, w / 2, h / 2, 0, 0, -Math.PI / 2);
  for (const [x, z, ry, L] of [[0, -d / 2 + 0.01, 0, w], [0, d / 2 - 0.01, Math.PI, w], [-w / 2 + 0.01, 0, Math.PI / 2, d], [w / 2 - 0.01, 0, -Math.PI / 2, d]] as const) bx(p, L, 0.12, 0.02, M("#ffffff", 0.6), x, 0.06, z, ry, 0.005);
};
const windowAt = (p: THREE.Object3D, x: number, y: number, z: number, ry: number, w: number, h: number, col = "#ffffff") => {
  const g = grp(p, x, y, z, ry);
  plane(g, w, h, new THREE.MeshBasicMaterial({ map: viewTex() }), 0, 0, -0.06);
  const fm = M(col, 0.5); for (const [ww, hh, xx, yy] of [[w + 0.16, 0.08, 0, h / 2], [w + 0.16, 0.08, 0, -h / 2], [0.08, h, -w / 2, 0], [0.08, h, w / 2, 0], [0.05, h, 0, 0], [w, 0.05, 0, 0]] as const) bx(g, ww, hh, 0.08, fm, xx, yy, 0);
  bx(g, w + 0.3, 0.05, 0.22, fm, 0, -h / 2 - 0.04, 0.08); return g;
};
const frame = (p: THREE.Object3D, tex: THREE.Texture, w: number, h: number, x: number, y: number, z: number, ry = 0, col = "#ffffff") => {
  const g = grp(p, x, y, z, ry); bx(g, w + 0.06, h + 0.06, 0.03, M(col, 0.45), 0, 0, 0); const pic = plane(g, w, h, new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6 }), 0, 0, 0.017); pic.castShadow = false; return g; };
const desk = (p: THREE.Object3D, x: number, z: number, ry = 0, top = "#d9b98a", leg = "#4a6ad8") => { const g = grp(p, x, 0, z, ry);
  bx(g, 0.9, 0.04, 0.6, M(top, 0.5, rep(woodTex(top), 1, 1)), 0, 0.72, 0); for (const [a, b] of [[-0.4, -0.25], [0.4, -0.25], [-0.4, 0.25], [0.4, 0.25]]) cyl(g, 0.02, 0.02, 0.72, M(leg, 0.35, undefined, { metalness: 0.4 }), a, 0.36, b, 8);
  bx(g, 0.86, 0.12, 0.5, M(leg, 0.5), 0, 0.62, -0.02); return g; };
const chair = (p: THREE.Object3D, x: number, z: number, ry = 0, col = "#e8503a") => { const g = grp(p, x, 0, z, ry);
  bx(g, 0.42, 0.04, 0.4, M(col, 0.45), 0, 0.44, 0, 0, 0.02); bx(g, 0.42, 0.32, 0.03, M(col, 0.45), 0, 0.68, -0.2, 0, 0.02);
  for (const [a, b] of [[-0.18, -0.17], [0.18, -0.17], [-0.18, 0.17], [0.18, 0.17]]) cyl(g, 0.015, 0.015, 0.44, M("#c9ccd4", 0.3, undefined, { metalness: 0.8 }), a, 0.22, b, 6); return g; };
const tree = (p: THREE.Object3D, x: number, z: number, s: number, seed: number) => {
  const g = grp(p, x, 0, z); g.scale.setScalar(s); cyl(g, 0.16, 0.24, 2.4, M("#7a5232", 0.9), 0, 1.2, 0, 10);
  const lm = M(["#4aa848", "#5cb848", "#3e9a42"][seed % 3], 0.8); for (let i = 0; i < 6; i++) { const a = i * 1.1 + seed; add(g, new THREE.IcosahedronGeometry(0.9 + hash(i, seed) * 0.4, 1), lm, Math.cos(a) * 0.6, 2.8 + hash(i, seed + 2) * 0.9, Math.sin(a) * 0.6); }
  add(g, new THREE.IcosahedronGeometry(1.1, 1), lm, 0, 3.6, 0); return g; };
const pageMat = (pg: Page) => new THREE.MeshStandardMaterial({ map: pg.tex, roughness: 0.85 });
/** carnet ouvert (deux pages) posé, la page droite porte un dessin ; renvoie le groupe */
const notebook = (p: THREE.Object3D, pg: Page, x: number, y: number, z: number, ry = 0, s = 1) => { const g = grp(p, x, y, z, ry); g.scale.setScalar(s);
  bx(g, 0.46, 0.012, 0.32, M("#2a5cb8", 0.6), 0, 0.006, 0, 0, 0.004); bx(g, 0.44, 0.01, 0.3, M("#fbf8ef", 0.9), 0, 0.016, 0, 0, 0.003);
  const pl = plane(g, 0.21, 0.29, pageMat(pg), 0.11, 0.0225, 0, -Math.PI / 2); pl.castShadow = false;
  const pl2 = plane(g, 0.21, 0.29, M("#fbf8ef", 0.9, rep(ctex("linesP", 64, 64, (q) => { q.fillStyle = "#fbf8ef"; q.fillRect(0, 0, 64, 64); q.fillStyle = "rgba(90,130,200,0.4)"; q.fillRect(0, 30, 64, 2); }, true), 1, 9)), -0.11, 0.0225, 0, -Math.PI / 2); pl2.castShadow = false;
  return g; };

// ------------------------------------------------------------ dessins (objets qui prennent vie)
const S = (pts: [number, number][], w = 5): Stroke => poly(pts, "#26262c", w);
export const DRAW: Record<string, Stroke[]> = {
  bill: [rect(0.12, 0.34, 0.76, 0.32, undefined, 5), circ(0.5, 0.5, 0.1, undefined, 4, 18), S([[0.48, 0.44], [0.48, 0.56]]), S([[0.53, 0.45], [0.46, 0.47], [0.53, 0.53], [0.46, 0.55]]), S([[0.17, 0.39], [0.27, 0.39]]), S([[0.73, 0.61], [0.83, 0.61]]),
    { pts: [[0.18, 0.62], [0.2, 0.6]], w: 3 }, line(0.66, 0.4, 0.82, 0.4, undefined, 3)],
  pc: [rect(0.1, 0.22, 0.36, 0.26), rect(0.54, 0.22, 0.36, 0.26), line(0.28, 0.48, 0.28, 0.56), line(0.72, 0.48, 0.72, 0.56), line(0.06, 0.56, 0.94, 0.56), rect(0.74, 0.6, 0.16, 0.3), circ(0.82, 0.67, 0.03, undefined, 4, 12),
    rect(0.22, 0.62, 0.4, 0.08), ...[0, 1, 2, 3, 4, 5].map((i) => line(0.25 + i * 0.065, 0.64, 0.25 + i * 0.065, 0.68, undefined, 3)), S([[0.2, 0.75], [0.3, 0.75], [0.3, 0.9]]), S([[0.08, 0.92], [0.92, 0.92]])],
  car: [S([[0.08, 0.62], [0.14, 0.5], [0.34, 0.46], [0.46, 0.36], [0.66, 0.36], [0.78, 0.46], [0.92, 0.5], [0.94, 0.62], [0.08, 0.62]], 6), circ(0.26, 0.63, 0.07, undefined, 6), circ(0.76, 0.63, 0.07, undefined, 6),
    S([[0.48, 0.39], [0.64, 0.39], [0.72, 0.46], [0.42, 0.46], [0.48, 0.39]], 4), line(0.86, 0.52, 0.92, 0.52, undefined, 4)],
  pool: [rect(0.12, 0.42, 0.76, 0.32), ...[0, 1, 2, 3].map((i) => S([[0.16, 0.5 + i * 0.06], [0.3, 0.48 + i * 0.06], [0.44, 0.5 + i * 0.06], [0.58, 0.48 + i * 0.06], [0.72, 0.5 + i * 0.06], [0.84, 0.48 + i * 0.06]], 3)),
    line(0.8, 0.3, 0.8, 0.44), line(0.86, 0.3, 0.86, 0.44), line(0.8, 0.34, 0.86, 0.34, undefined, 3), line(0.8, 0.39, 0.86, 0.39, undefined, 3)],
  dino: [S([[0.1, 0.7], [0.3, 0.6], [0.42, 0.6], [0.52, 0.4], [0.58, 0.26], [0.78, 0.24], [0.86, 0.3], [0.78, 0.34], [0.66, 0.34], [0.62, 0.44], [0.6, 0.6], [0.56, 0.8], [0.5, 0.8], [0.48, 0.66], [0.38, 0.68], [0.36, 0.82], [0.3, 0.82], [0.3, 0.68], [0.1, 0.7]], 6),
    circ(0.72, 0.28, 0.015, undefined, 6, 8), S([[0.62, 0.42], [0.7, 0.46]], 4), ...[0, 1, 2, 3].map((i) => S([[0.4 + i * 0.05, 0.56 - i * 0.06], [0.43 + i * 0.05, 0.5 - i * 0.07]], 3))],
  girl: [circ(0.5, 0.3, 0.12, undefined, 5, 22), S([[0.38, 0.28], [0.34, 0.5], [0.4, 0.52]], 5), S([[0.62, 0.28], [0.66, 0.5], [0.6, 0.52]], 5), circ(0.46, 0.29, 0.012, undefined, 6, 8), circ(0.54, 0.29, 0.012, undefined, 6, 8),
    circ(0.5, 0.34, 0.04, undefined, 4, 10, 0.2, Math.PI - 0.2), S([[0.42, 0.44], [0.34, 0.8], [0.66, 0.8], [0.58, 0.44], [0.42, 0.44]], 5), S([[0.44, 0.8], [0.44, 0.92]]), S([[0.56, 0.8], [0.56, 0.92]]), S([[0.4, 0.5], [0.3, 0.64]]), S([[0.6, 0.5], [0.7, 0.64]]),
    circ(0.62, 0.2, 0.03, "#e85a8a", 4, 10)],
  cage: [rect(0.2, 0.2, 0.6, 0.66), ...[0, 1, 2, 3, 4, 5].map((i) => line(0.28 + i * 0.09, 0.2, 0.28 + i * 0.09, 0.86, undefined, 4)), line(0.2, 0.5, 0.8, 0.5, undefined, 3)],
  door: [rect(0.3, 0.14, 0.4, 0.76, undefined, 6), circ(0.62, 0.54, 0.025, undefined, 5, 10), rect(0.36, 0.2, 0.28, 0.24, undefined, 3), rect(0.36, 0.5, 0.28, 0.34, undefined, 3)],
  keyboard: [rect(0.14, 0.4, 0.72, 0.22), ...[0, 1, 2].map((r) => line(0.18, 0.46 + r * 0.06, 0.82, 0.46 + r * 0.06, undefined, 3)), ...[0, 1, 2, 3, 4, 5, 6, 7].map((i) => line(0.22 + i * 0.08, 0.42, 0.22 + i * 0.08, 0.6, undefined, 2))],
};

// ------------------------------------------------------------ objets modélisés (dessinés → réels)
const billM = () => M("#ffffff", 0.7, ctex("billtex", 512, 220, (g) => { g.fillStyle = "#d6e8c8"; g.fillRect(0, 0, 512, 220); g.strokeStyle = "#2f5a3a"; g.lineWidth = 8; g.strokeRect(10, 10, 492, 200); g.lineWidth = 3; g.strokeRect(24, 24, 464, 172);
  g.fillStyle = "#e8f2dc"; g.beginPath(); g.ellipse(256, 110, 62, 74, 0, 0, 7); g.fill(); g.strokeStyle = "#2f5a3a"; g.stroke(); g.fillStyle = "#2f5a3a"; g.beginPath(); g.ellipse(256, 100, 26, 32, 0, 0, 7); g.fill(); g.fillRect(222, 130, 68, 40);
  g.font = "bold 46px Georgia, serif"; g.fillText("100", 40, 70); g.fillText("100", 398, 190); g.font = "bold 20px Georgia, serif"; g.fillText("ONE HUNDRED DOLLARS", 150, 205); noise(g, 512, 220, 400, 0.04, 2); }));
export const mkBill = () => { const g = new THREE.Group(); bx(g, 0.156, 0.002, 0.066, billM(), 0, 0.001, 0, 0, 0.0005); return g; };
export const mkPC = () => { const g = new THREE.Group(), blk = P("#16181e", 0.35), rgb = (c: string) => E(c, 3);
  bx(g, 1.8, 0.05, 0.8, P("#1f2128", 0.3), 0, 0.76, 0); for (const x of [-0.85, 0.85]) bx(g, 0.06, 0.74, 0.7, P("#e8343a", 0.3), x, 0.37, 0);
  bx(g, 1.78, 0.012, 0.03, rgb("#40d8ff"), 0, 0.735, 0.39);
  for (const [x, ry] of [[-0.42, 0.18], [0.42, -0.18]] as const) { const m = grp(g, x, 0.78, -0.18, ry); bx(m, 0.78, 0.46, 0.03, blk, 0, 0.36, 0, 0, 0.01);
    plane(m, 0.74, 0.42, new THREE.MeshStandardMaterial({ color: "#000", emissive: "#ffffff", emissiveIntensity: 1.1, emissiveMap: ctex("game" + x, 256, 144, (q) => { const gr = q.createLinearGradient(0, 0, 256, 144); gr.addColorStop(0, "#3a1a8a"); gr.addColorStop(1, "#ff4a8a"); q.fillStyle = gr; q.fillRect(0, 0, 256, 144);
      q.fillStyle = "#ffd040"; q.beginPath(); q.arc(180, 50, 22, 0, 7); q.fill(); q.fillStyle = "#1a1040"; for (let i = 0; i < 8; i++) q.fillRect(i * 34, 100 - hash(i, 2) * 30, 30, 60); q.fillStyle = "#40ffb0"; q.fillRect(60, 84, 16, 16); q.fillStyle = "#fff"; q.font = "bold 14px sans-serif"; q.fillText("LEVEL 1", 8, 18); }) }), 0, 0.36, 0.017);
    bx(m, 0.08, 0.3, 0.06, blk, 0, 0.1, -0.05); bx(m, 0.3, 0.02, 0.2, blk, 0, -0.01, -0.02); }
  // tour vitrée RGB
  const tw = grp(g, 0.62, 0.78, 0.0); bx(tw, 0.24, 0.5, 0.48, blk, 0, 0.25, 0, 0, 0.01); plane(tw, 0.46, 0.46, new THREE.MeshPhysicalMaterial({ color: "#20283a", roughness: 0.05, transmission: 0, transparent: true, opacity: 0.45 }), -0.125, 0.25, 0, 0, -Math.PI / 2);
  for (let i = 0; i < 3; i++) { const f = add(tw, new THREE.TorusGeometry(0.06, 0.012, 8, 20), rgb(["#ff3a8a", "#40d8ff", "#9a5aff"][i]), -0.1, 0.12 + i * 0.13, 0.12); f.rotation.y = Math.PI / 2; }
  bx(tw, 0.02, 0.48, 0.02, rgb("#9a5aff"), -0.12, 0.25, 0.23);
  // clavier À L'ENVERS : les touches dessous, le fond (pieds, étiquette) au-dessus
  const kb = grp(g, -0.05, 0.79, 0.2); kb.rotation.z = Math.PI; kb.position.y = 0.815; bx(kb, 0.62, 0.025, 0.2, blk, 0, 0, 0, 0, 0.008);
  for (let r = 0; r < 4; r++) for (let c = 0; c < 13; c++) bx(kb, 0.038, 0.012, 0.038, M("#2a2c34", 0.5), -0.27 + c * 0.045, 0.018, -0.07 + r * 0.045, 0, 0.004);
  bx(kb, 0.6, 0.004, 0.012, rgb("#40d8ff"), 0, 0.012, 0.1); for (const x of [-0.26, 0.26]) bx(kb, 0.05, 0.012, 0.02, M("#555", 0.6), x, -0.018, -0.08);
  plane(kb, 0.12, 0.05, M("#e8e8e8", 0.6), 0, -0.0135, 0.02, Math.PI / 2);
  bx(g, 0.07, 0.03, 0.11, blk, 0.4, 0.79, 0.22, 0, 0.012); bx(g, 0.5, 0.004, 0.32, M("#1a1c22", 0.9), 0.4, 0.783, 0.22);
  // fauteuil gamer
  const ch = grp(g, 0, 0, 0.85, Math.PI); const red = P("#e8343a", 0.4); bx(ch, 0.56, 0.12, 0.52, blk, 0, 0.5, 0, 0, 0.05); bx(ch, 0.56, 0.86, 0.12, blk, 0, 0.98, -0.24, 0, 0.05); bx(ch, 0.24, 0.6, 0.13, red, 0, 1.0, -0.24, 0, 0.04);
  for (const x of [-0.3, 0.3]) bx(ch, 0.06, 0.06, 0.4, red, x, 0.72, 0, 0, 0.02); cyl(ch, 0.035, 0.035, 0.4, M("#c9ccd4", 0.3, undefined, { metalness: 0.9 }), 0, 0.26, 0, 10);
  for (let i = 0; i < 5; i++) { const a = i * 1.2566; bx(ch, 0.32, 0.04, 0.05, blk, Math.cos(a) * 0.16, 0.06, Math.sin(a) * 0.16, -a); }
  return g; };
export const mkCar = () => { const g = new THREE.Group(), red = P("#e8202a", 0.22), dark = M("#16181c", 0.6), glass = new THREE.MeshPhysicalMaterial({ color: "#10161f", roughness: 0.05, clearcoat: 1 }), chrome = M("#e0e4ea", 0.15, undefined, { metalness: 1 });
  const sh = new THREE.Shape(); sh.moveTo(-2.1, 0.25); sh.lineTo(-2.15, 0.7); sh.lineTo(-1.2, 0.85); sh.lineTo(-0.5, 1.2); sh.lineTo(0.6, 1.2); sh.lineTo(1.3, 0.85); sh.lineTo(2.15, 0.72); sh.lineTo(2.2, 0.3); sh.lineTo(-2.1, 0.25);
  const body = add(g, new THREE.ExtrudeGeometry(sh, { depth: 1.8, bevelEnabled: true, bevelSize: 0.08, bevelThickness: 0.08, bevelSegments: 3 }).translate(0, 0, -0.9), red, 0, 0, 0);
  body.rotation.y = 0; const ws = new THREE.Shape(); ws.moveTo(-0.45, 0.88); ws.lineTo(-0.38, 1.12); ws.lineTo(0.55, 1.12); ws.lineTo(1.1, 0.88); ws.lineTo(-0.45, 0.88);
  add(g, new THREE.ExtrudeGeometry(ws, { depth: 1.86, bevelEnabled: false }).translate(0, 0.02, -0.93), glass, 0, 0, 0);
  for (const [x, z] of [[-1.35, 0.92], [1.4, 0.92], [-1.35, -0.92], [1.4, -0.92]]) { add(g, new THREE.CylinderGeometry(0.36, 0.36, 0.28, 24).rotateX(Math.PI / 2), dark, x, 0.36, z); add(g, new THREE.CylinderGeometry(0.22, 0.22, 0.3, 10).rotateX(Math.PI / 2), chrome, x, 0.36, z); }
  for (const z of [-0.6, 0.6]) { bx(g, 0.06, 0.12, 0.3, E("#fff6e0", 2.5), 2.27, 0.6, z); bx(g, 0.06, 0.1, 0.34, E("#ff2a2a", 2), -2.22, 0.62, z); }
  bx(g, 0.3, 0.06, 1.7, dark, -2.0, 1.0, 0); for (const z of [-0.7, 0.7]) bx(g, 0.06, 0.18, 0.06, dark, -1.95, 0.9, z);
  bx(g, 1.2, 0.02, 0.5, M("#f4f4f4", 0.4), 0.2, 1.22, 0); return g; };
export const mkPool = () => { const g = new THREE.Group(), side = P("#2a7ae8", 0.35), rim = M("#f4f4f4", 0.4);
  for (const [w, d, x, z] of [[2.4, 0.12, 0, -1.8], [2.4, 0.12, 0, 1.8], [0.12, 3.6, -1.2, 0], [0.12, 3.6, 1.2, 0]] as const) { bx(g, w, 0.7, d, side, x, 0.35, z, 0, 0.04); bx(g, w + 0.06, 0.06, d + 0.06, rim, x, 0.72, z, 0, 0.02); }
  const water = new THREE.MeshPhysicalMaterial({ color: "#3ac8f0", roughness: 0.05, transmission: 0, transparent: true, opacity: 0.85, clearcoat: 1, emissive: "#0a5a8a", emissiveIntensity: 0.25,
    normalMap: ctex("ripN", 256, 256, (q) => { q.fillStyle = "rgb(128,128,255)"; q.fillRect(0, 0, 256, 256); for (let i = 0; i < 60; i++) { q.strokeStyle = `rgba(${150 + hash(i, 1) * 60},${100 + hash(i, 2) * 60},255,0.5)`; q.lineWidth = 3; q.beginPath(); q.arc(hash(i, 3) * 256, hash(i, 4) * 256, 10 + hash(i, 5) * 30, 0, 7); q.stroke(); } }, true) });
  const wp = plane(g, 2.3, 3.5, water, 0, 0.6, 0, -Math.PI / 2); wp.userData.water = true; wp.userData.noEdge = true;
  plane(g, 2.3, 3.5, M("#6ad8f8", 0.6, rep(tileTex("#7ad8f8", "#5ac8f0", 8), 3, 4)), 0, 0.03, 0, -Math.PI / 2);
  for (const x of [-0.2, 0.2]) { const r = add(g, new THREE.TorusGeometry(0.4, 0.025, 8, 20, Math.PI), M("#d8dde3", 0.15, undefined, { metalness: 1 }), x, 0.75, 1.8); r.rotation.y = Math.PI / 2; }
  const ring = add(g, new THREE.TorusGeometry(0.28, 0.1, 10, 24), P("#ff5a3a", 0.3), -0.4, 0.64, -0.6); ring.rotation.x = Math.PI / 2; return g; };
export class Dino { root = new THREE.Group(); lL = new THREE.Group(); rL = new THREE.Group(); jaw = new THREE.Group(); tail = new THREE.Group(); head = new THREE.Group();
  constructor() { const g = this.root, gr = P("#4ab84a", 0.45), dk = M("#2e8a3a", 0.6), belly = M("#c8e88a", 0.6), wht = M("#ffffff", 0.4), ink = M("#111", 0.3);
    const body = grp(g, 0, 1.4, 0); body.rotation.x = -0.35; bx(body, 0.9, 1.2, 1.5, gr, 0, 0, 0, 0, 0.3); bx(body, 0.7, 0.9, 0.2, belly, 0, -0.1, 0.72, 0, 0.08);
    for (let i = 0; i < 5; i++) { const sp = add(body, new THREE.ConeGeometry(0.12, 0.3, 4), dk, 0, 0.62 - i * 0.02, 0.4 - i * 0.28); sp.rotation.x = -0.2; }
    this.head.position.set(0, 2.25, 0.85); g.add(this.head); bx(this.head, 0.8, 0.6, 1.0, gr, 0, 0, 0.2, 0, 0.18);
    for (const x of [-0.25, 0.25]) { add(this.head, new THREE.SphereGeometry(0.12, 12, 10), wht, x, 0.2, 0.55); add(this.head, new THREE.SphereGeometry(0.06, 10, 8), ink, x, 0.22, 0.65); }
    this.jaw.position.set(0, -0.25, 0); this.head.add(this.jaw); bx(this.jaw, 0.74, 0.22, 0.9, dk, 0, -0.05, 0.25, 0, 0.08);
    for (let i = 0; i < 6; i++) for (const s of [-1, 1]) { const t = add(this.head, new THREE.ConeGeometry(0.04, 0.12, 4), wht, s * 0.3, -0.33, 0.25 + i * 0.1); t.rotation.x = Math.PI; }
    for (const [L, x] of [[this.lL, -0.35], [this.rL, 0.35]] as const) { L.position.set(x, 1.1, -0.1); g.add(L); bx(L, 0.36, 0.7, 0.5, gr, 0, -0.3, 0, 0, 0.12); bx(L, 0.26, 0.5, 0.28, gr, 0, -0.8, 0.05, 0, 0.08); bx(L, 0.34, 0.12, 0.5, dk, 0, -1.05, 0.15, 0, 0.04); }
    for (const x of [-0.42, 0.42]) { const a = bx(g, 0.12, 0.35, 0.12, gr, x, 1.55, 0.75, 0, 0.04); a.rotation.x = 0.8; }
    this.tail.position.set(0, 1.3, -0.7); g.add(this.tail); let p: THREE.Object3D = this.tail;
    for (let i = 0; i < 4; i++) { const s = grp(p, 0, 0, i ? -0.45 : 0); bx(s, 0.6 - i * 0.12, 0.6 - i * 0.12, 0.55, gr, 0, 0, -0.25, 0, 0.12); p = s; this.segs.push(s); } }
  segs: THREE.Object3D[] = [];
  set(t: number, run: number, roar: number) { const w = Math.sin(t * 9) * run; this.lL.rotation.x = w * 0.7; this.rL.rotation.x = -w * 0.7; this.root.children[0].position.y = 1.4 + Math.abs(Math.cos(t * 9)) * 0.08 * run;
    this.jaw.rotation.x = 0.1 + roar * 0.55 + Math.max(0, Math.sin(t * 6)) * 0.08; this.head.rotation.x = -roar * 0.25 + Math.sin(t * 9) * 0.04 * run; this.segs.forEach((s, i) => { s.rotation.y = Math.sin(t * 4 - i * 0.7) * 0.18; s.rotation.x = 0.08; }); return this; } }
export const mkCage = () => { const g = new THREE.Group(), m = M("#8a9098", 0.3, undefined, { metalness: 0.9 });
  bx(g, 2.6, 0.1, 2.0, m, 0, 0.05, 0); bx(g, 2.6, 0.1, 2.0, m, 0, 2.5, 0);
  for (let i = 0; i <= 12; i++) { const x = -1.25 + i * 0.208; cyl(g, 0.03, 0.03, 2.45, m, x, 1.27, -0.95, 8); cyl(g, 0.03, 0.03, 2.45, m, x, 1.27, 0.95, 8); }
  for (let i = 0; i <= 8; i++) { const z = -0.95 + i * 0.237; cyl(g, 0.03, 0.03, 2.45, m, -1.25, 1.27, z, 8); cyl(g, 0.03, 0.03, 2.45, m, 1.25, 1.27, z, 8); } return g; };
export class Door { root = new THREE.Group(); leaf = new THREE.Group(); light: THREE.Mesh; glow: THREE.PointLight;
  constructor() { const g = this.root, wood = P("#f2b51c", 0.35), fr = M("#ffffff", 0.5);
    bx(g, 0.12, 2.3, 0.2, fr, -0.56, 1.15, 0); bx(g, 0.12, 2.3, 0.2, fr, 0.56, 1.15, 0); bx(g, 1.24, 0.12, 0.2, fr, 0, 2.36, 0); bx(g, 1.4, 0.06, 0.5, M("#d8d2c8", 0.7), 0, 0.03, 0);
    this.light = plane(g, 1.0, 2.24, new THREE.MeshBasicMaterial({ color: new THREE.Color(3, 2.8, 2.4) }), 0, 1.13, -0.02); this.light.visible = false;
    this.leaf.position.set(-0.5, 0, 0.05); g.add(this.leaf); bx(this.leaf, 1.0, 2.24, 0.06, wood, 0.5, 1.13, 0, 0, 0.01);
    for (const [y, h] of [[1.65, 0.7], [0.62, 0.9]] as const) bx(this.leaf, 0.72, h, 0.02, P("#e8a010", 0.4), 0.5, y, 0.035, 0, 0.01);
    add(this.leaf, new THREE.SphereGeometry(0.045, 12, 10), M("#c9ccd4", 0.2, undefined, { metalness: 1 }), 0.88, 1.08, 0.08);
    this.glow = new THREE.PointLight("#fff2d8", 0, 9, 1.4); this.glow.position.set(0, 1.2, 0.8); g.add(this.glow); }
  set(open: number) { this.leaf.rotation.y = -open * 1.9; this.light.visible = open > 0.01; this.glow.intensity = open * 14; } }
/** gomme géante : moitié rose, moitié bleue, étui en carton au milieu ; largeur du couloir */
export class Eraser { root = new THREE.Group(); body = new THREE.Group(); paint: THREE.Mesh; paintM: THREE.MeshPhysicalMaterial;
  constructor(w = 3.3, h = 2.3, L = 4.6) { const b = this.body; this.root.add(b);
    const pink = new THREE.MeshPhysicalMaterial({ color: "#ff8fa8", roughness: 0.55, sheen: 0.6, sheenColor: new THREE.Color("#ffd0dc") }), blue = new THREE.MeshPhysicalMaterial({ color: "#3a7ae8", roughness: 0.55, sheen: 0.6, sheenColor: new THREE.Color("#a8c8ff") });
    bx(b, w, h, L * 0.45, pink, 0, 0, L * 0.275, 0, 0.35); bx(b, w, h, L * 0.45, blue, 0, 0, -L * 0.275, 0, 0.35);
    const sleeve = M("#ffffff", 0.7, ctex("sleeve", 512, 256, (q) => { q.fillStyle = "#f4f1ea"; q.fillRect(0, 0, 512, 256); q.fillStyle = "#2a5cb8"; q.fillRect(0, 0, 512, 40); q.fillRect(0, 216, 512, 40); q.fillStyle = "#e8343a"; q.font = "bold 92px Impact, sans-serif"; q.textAlign = "center"; q.fillText("GOMME", 256, 160); q.fillStyle = "#2a2a30"; q.font = "bold 26px sans-serif"; q.fillText("EFFACE TOUT", 256, 198); }));
    bx(b, w + 0.06, h + 0.06, L * 0.32, sleeve, 0, 0, 0, 0, 0.06);
    // côté usé de la face avant (rose) : arrondi + traces grises
    plane(b, w * 0.8, h * 0.7, new THREE.MeshStandardMaterial({ color: "#555", transparent: true, opacity: 0.18 }), 0, 0, L * 0.5 + 0.005);
    this.paintM = new THREE.MeshPhysicalMaterial({ color: "#ffd21a", roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.05, transparent: true, opacity: 0,
      alphaMap: ctex("splat", 512, 512, (q) => { q.fillStyle = "#000"; q.fillRect(0, 0, 512, 512); q.fillStyle = "#fff"; for (let i = 0; i < 70; i++) { q.beginPath(); q.arc(256 + (hash(i, 1) - 0.5) * 420, 256 + (hash(i, 2) - 0.5) * 420, 30 + hash(i, 3) * 90, 0, 7); q.fill(); }
        for (let i = 0; i < 26; i++) { const x = hash(i, 4) * 512; q.fillRect(x, 300 + hash(i, 5) * 100, 10 + hash(i, 6) * 14, 200); q.beginPath(); q.arc(x + 10, 500, 14, 0, 7); q.fill(); } }) });
    this.paint = add(b, rb(w + 0.1, h + 0.1, L + 0.1, 0.38), this.paintM, 0, 0, 0); this.paint.userData.noEdge = true; this.paint.visible = false; }
  /** cover : 0→1 recouvrement par la peinture */
  set(t: number, cover: number, stop: number) { this.body.position.y = Math.sin(t * 2.2) * 0.06 * (1 - stop); this.body.rotation.z = Math.sin(t * 1.3) * 0.02 * (1 - stop); this.body.rotation.x = Math.sin(t * 3.1) * 0.015 * (1 - stop);
    this.paint.visible = cover > 0.01; this.paintM.opacity = Math.min(1, cover * 1.4); this.paint.scale.setScalar(0.98 + cover * 0.04); this.paintM.alphaTest = Math.max(0, 0.5 - cover * 0.5); this.paintM.needsUpdate = true; } }
/** seau de peinture (salle d'arts) */
export const mkBucket = (col = "#ffd21a") => { const g = new THREE.Group(); add(g, new THREE.CylinderGeometry(0.17, 0.14, 0.32, 24, 1, true), M("#d8dde3", 0.3, undefined, { metalness: 0.7, side: THREE.DoubleSide }), 0, 0.16, 0);
  cyl(g, 0.14, 0.14, 0.01, M("#b8bcc4", 0.4, undefined, { metalness: 0.7 }), 0, 0.005, 0); cyl(g, 0.165, 0.165, 0.01, P(col, 0.15), 0, 0.29, 0, 24);
  add(g, new THREE.CylinderGeometry(0.172, 0.172, 0.12, 24, 1, true), M("#ffffff", 0.6, ctex("lbl" + col, 256, 64, (q) => { q.fillStyle = col; q.fillRect(0, 0, 256, 64); q.fillStyle = "#fff"; q.font = "bold 30px sans-serif"; q.fillText("PEINTURE", 50, 44); }), { side: THREE.DoubleSide }), 0, 0.15, 0);
  const h = add(g, new THREE.TorusGeometry(0.17, 0.008, 6, 20, Math.PI), M("#888", 0.3, undefined, { metalness: 0.9 }), 0, 0.3, 0); h.rotation.y = Math.PI / 2; return g; };

// ------------------------------------------------------------ maison du héros (fenêtres et toit séparés : ils disparaissent)
export class HouseD { root = new THREE.Group(); wins = new THREE.Group(); roof = new THREE.Group(); dw?: Drawn; dr?: Drawn;
  constructor(col: string, roofCol: string, seed: number, trim = "#ffffff") { const r = this.root, W = 8, D = 7, H = 3.0; r.add(this.wins, this.roof);
    const wm = new THREE.MeshStandardMaterial({ color: "#fff", map: rep(sidingTex(col), 3, 1.6), roughness: 0.8 });
    bx(r, W, H, D, wm, 0, H / 2, 0, 0, 0.03); bx(r, W + 0.2, 0.3, D + 0.2, M("#b8b0a8", 0.9), 0, 0.15, 0);
    const gab = new THREE.Shape(); gab.moveTo(-W / 2, 0); gab.lineTo(0, 2.3); gab.lineTo(W / 2, 0); gab.lineTo(-W / 2, 0);
    for (const z of [-D / 2, D / 2 - 0.2]) add(r, new THREE.ExtrudeGeometry(gab, { depth: 0.2, bevelEnabled: false }), wm, 0, H, z);
    const rm = new THREE.MeshStandardMaterial({ color: "#fff", map: rep(shingleTex(roofCol), 4, 3), roughness: 0.85 }), slope = Math.atan2(2.5, W / 2 + 0.4), L = Math.hypot(2.5, W / 2 + 0.4) + 0.1;
    for (const s of [-1, 1]) { const rf = bx(this.roof, L, 0.16, D + 0.9, rm, s * (W / 4 + 0.1), H + 1.25, 0, 0, 0.02); rf.rotation.z = -s * slope; }
    bx(this.roof, 0.7, 1.6, 0.7, M("#b8584a", 0.8), W / 4, H + 2.4, -1.2);
    const winAt = (x: number, y: number, w: number, h: number) => { const g = grp(this.wins, x, y, D / 2 + 0.02);
      plane(g, w, h, new THREE.MeshPhysicalMaterial({ color: "#9ad0f0", roughness: 0.05, clearcoat: 1, emissive: "#2a5a7a", emissiveIntensity: 0.25 }), 0, 0, 0);
      const fm = M(trim, 0.5); for (const [ww, hh, xx, yy] of [[w + 0.2, 0.1, 0, h / 2], [w + 0.3, 0.12, 0, -h / 2], [0.1, h, -w / 2, 0], [0.1, h, w / 2, 0], [0.06, h, 0, 0], [w, 0.06, 0, 0]] as const) bx(g, ww, hh, 0.12, fm, xx, yy, 0.03);
      for (const s of [-1, 1]) bx(g, 0.42, h + 0.1, 0.06, M(["#2a7ae8", "#e8503a", "#2fae7a", "#9a5ad8"][seed % 4], 0.6), s * (w / 2 + 0.28), 0, 0.04);
      add(g, new THREE.BoxGeometry(w + 0.2, 0.22, 0.3), M("#7a4a2a", 0.8), 0, -h / 2 - 0.2, 0.15); for (let i = 0; i < 5; i++) add(g, new THREE.SphereGeometry(0.09, 8, 6), M(["#ff5a7a", "#ffd21a", "#ff8a3a"][i % 3], 0.6), -w / 2 + 0.05 + i * (w / 4.5), -h / 2 - 0.05, 0.15); };
    winAt(-2.4, 1.6, 1.4, 1.2); winAt(2.4, 1.6, 1.4, 1.2); winAt(0, H + 0.9, 0.9, 0.8);
    bx(r, 1.1, 2.15, 0.08, P(["#e8343a", "#2a5cb8", "#2fae7a", "#f2b51c"][seed % 4], 0.35), 0, 1.25, D / 2 + 0.03);
    add(r, new THREE.SphereGeometry(0.05, 8, 6), M("#d8b04a", 0.3, undefined, { metalness: 1 }), 0.4, 1.2, D / 2 + 0.1);
    bx(r, 2.2, 0.25, 1.2, M("#d8d2c8", 0.9), 0, 0.13, D / 2 + 0.6);
    for (let i = 0; i < 11; i++) { if (i === 5) continue; bx(r, 0.1, 0.8, 0.06, M("#ffffff", 0.6), -5 + i * 1.0, 0.4, D / 2 + 2.6); } for (const s of [-1, 1]) bx(r, 4.6, 0.08, 0.05, M("#ffffff", 0.6), s * 2.8, 0.68, D / 2 + 2.6);
    for (const x of [-3.4, 3.2]) { add(r, new THREE.IcosahedronGeometry(0.6, 1), M("#3e9a42", 0.8), x, 0.45, D / 2 + 1.6); for (let i = 0; i < 4; i++) add(r, new THREE.SphereGeometry(0.07, 6, 5), M(["#ff5a7a", "#ffd21a"][i % 2], 0.6), x + Math.cos(i * 1.6) * 0.45, 0.7 + hash(i, 2) * 0.3, D / 2 + 1.6 + Math.sin(i * 1.6) * 0.45); }
    const mb = grp(r, 1.6, 0, D / 2 + 2.9); cyl(mb, 0.04, 0.04, 1.0, M("#ffffff", 0.6), 0, 0.5, 0, 8); bx(mb, 0.25, 0.25, 0.45, P("#2a5cb8", 0.3), 0, 1.1, 0, 0, 0.1); }
  initFx() { this.dw = new Drawn(this.wins, 4, 28, 4); this.dr = new Drawn(this.roof, 4, 28, 6); } }


// ------------------------------------------------------------ quartier lointain (maisons simplifiées, arbres, immeubles, collines)
const HCOL: [string, string][] = [["#f4d35e", "#a8423a"], ["#f2a6b4", "#5a4a8a"], ["#9ad0e8", "#3a5a8a"], ["#b8e0a0", "#8a3a3a"], ["#f8c890", "#4a5a7a"], ["#e8e0ff", "#a8423a"], ["#ffb0a0", "#3a6a5a"], ["#fff0c8", "#2a6a8a"]];
const farHouse = (p: THREE.Object3D, x: number, z: number, ry: number, seed: number) => { const g = grp(p, x, 0, z, ry), c = HCOL[seed % HCOL.length], W = 7 + hash(seed, 1) * 2, H = 2.8 + (seed % 3 === 0 ? 2.6 : 0), D = 6.5;
  bx(g, W, H, D, M("#ffffff", 0.85, rep(sidingTex(c[0]), 3, 1.5)), 0, H / 2, 0, 0, 0.03).castShadow = false;
  const roof = add(g, new THREE.CylinderGeometry(0.01, W * 0.62, 2.2, 4, 1).rotateY(Math.PI / 4), M(c[1], 0.85), 0, H + 1.1, 0, 0, false); roof.scale.set(1, 1, D / W);
  const wm = M("#9ad0f0", 0.15, undefined, { emissive: "#2a5a7a", emissiveIntensity: 0.3 });
  for (const [wx, wy] of [[-W * 0.28, 1.5], [W * 0.28, 1.5], ...(H > 4 ? [[-W * 0.28, 4.0], [W * 0.28, 4.0]] : [])] as [number, number][]) { plane(g, 1.2, 1.0, wm, wx, wy, D / 2 + 0.02); bx(g, 1.36, 0.1, 0.1, M("#ffffff", 0.5), wx, wy - 0.55, D / 2 + 0.04); }
  bx(g, 1.0, 2.0, 0.06, M(["#e8343a", "#2a5cb8", "#2fae7a", "#f2b51c"][seed % 4], 0.4), 0, 1.0, D / 2 + 0.03);
  if (hash(seed, 3) < 0.5) bx(g, 0.6, 1.4, 0.6, M("#b8584a", 0.8), W * 0.25, H + 1.6, -1).castShadow = false; return g; };
const simpleTree = (p: THREE.Object3D, x: number, z: number, s: number, seed: number) => { const g = grp(p, x, 0, z); g.scale.setScalar(s); cyl(g, 0.15, 0.22, 2.2, M("#7a5232", 0.9), 0, 1.1, 0, 7).castShadow = false;
  const m = M(["#4aa848", "#5cb848", "#3e9a42", "#6ac058"][seed % 4], 0.8); add(g, new THREE.IcosahedronGeometry(1.4, 1), m, 0, 3.0, 0, 0, false); add(g, new THREE.IcosahedronGeometry(1.0, 1), m, 0.5, 3.8, 0.2, 0, false); return g; };
const street = (p: THREE.Object3D, zr: number, x0: number, x1: number, seed: number, skipNorth = false) => {
  plane(p, x1 - x0 + 20, 7, M("#ffffff", 0.85, rep(asphaltTex(), 30, 2)), (x0 + x1) / 2, 0.01, zr, -Math.PI / 2);
  for (let x = x0; x <= x1; x += 4) plane(p, 1.6, 0.14, M("#f4f4f4", 0.6), x, 0.015, zr, -Math.PI / 2);
  for (const dz of [-4.4, 4.4]) bx(p, x1 - x0 + 20, 0.16, 1.8, M("#d8d4cc", 0.85), (x0 + x1) / 2, 0.08, zr + dz, 0, 0.01).castShadow = false;
  let k = seed; for (let x = x0; x <= x1; x += 11) { if (!skipNorth) farHouse(p, x + hash(k, 5) * 1.5, zr - 12, 0, k++); farHouse(p, x + hash(k, 6) * 1.5, zr + 12, Math.PI, k++); simpleTree(p, x + 5.5, zr - 6.5, 0.9 + hash(k, 2) * 0.3, k); simpleTree(p, x + 5.5, zr + 6.5, 0.9 + hash(k, 4) * 0.3, k + 1); } };
const building = (p: THREE.Object3D, x: number, z: number, w: number, h: number, seed: number) => { const g = grp(p, x, 0, z, Math.atan2(-x, -z));
  const tex = ctex("bld" + (seed % 5), 128, 256, (q) => { q.fillStyle = ["#e8d8c0", "#c8d8e8", "#f0c8a8", "#d8e8d0", "#e8c8d8"][seed % 5]; q.fillRect(0, 0, 128, 256); q.fillStyle = "#7aa8d0"; for (let r = 0; r < 16; r++) for (let c = 0; c < 6; c++) q.fillRect(8 + c * 20, 8 + r * 15, 12, 9); });
  bx(g, w, h, w * 0.8, M("#ffffff", 0.8, rep(tex, 1, h / 16)), 0, h / 2, 0, 0, 0.1).castShadow = false; bx(g, w + 0.4, 0.5, w * 0.8 + 0.4, M("#a8a49c", 0.8), 0, h + 0.25, 0).castShadow = false; return g; };

// ------------------------------------------------------------ foule de l'autre monde (instanciée)
const crowd = (p: THREE.Object3D, n: number) => {
  const dummy = new THREE.Object3D(), parts: [THREE.BufferGeometry, string, (i: number) => string][] = [
    [rb(0.5, 0.62, 0.3, 0.06).translate(0, 1.05, 0), "body", (i) => ["#e84a3a", "#2a7ae8", "#f2b51c", "#2fae7a", "#ff5fa4", "#9a5ad8", "#f08a2a", "#34508a", "#e8e0d0"][i % 9]],
    [rb(0.2, 0.75, 0.24, 0.05).translate(-0.13, 0.38, 0), "legL", () => "#2c3140"], [rb(0.2, 0.75, 0.24, 0.05).translate(0.13, 0.38, 0), "legR", () => "#2c3140"],
    [rb(0.36, 0.34, 0.34, 0.08).translate(0, 1.56, 0), "head", (i) => ["#f7d6bd", "#f5d0b0", "#f2cbaa", "#f6d3b8"][i % 4]],
    [rb(0.38, 0.12, 0.36, 0.04).translate(0, 1.76, -0.02), "hair", (i) => ["#2a1d16", "#6b4426", "#c8a060", "#3a2416", "#d8b060", "#8a5a32"][Math.floor(i / 3) % 6]],
    [rb(0.36, 0.26, 0.03, 0.01).translate(0, 1.18, 0.26), "book", (i) => ["#fbf8ef", "#fbf8ef", "#f4ecd8"][i % 3]],
    [rb(0.12, 0.42, 0.12, 0.04).translate(-0.3, 1.1, 0.12), "armL", (i) => ["#e84a3a", "#2a7ae8", "#f2b51c", "#2fae7a", "#ff5fa4", "#9a5ad8", "#f08a2a", "#34508a", "#e8e0d0"][i % 9]],
    [rb(0.12, 0.42, 0.12, 0.04).translate(0.3, 1.1, 0.12), "armR", (i) => ["#e84a3a", "#2a7ae8", "#f2b51c", "#2fae7a", "#ff5fa4", "#9a5ad8", "#f08a2a", "#34508a", "#e8e0d0"][i % 9]],
  ];
  const face = new THREE.MeshStandardMaterial({ map: ctex("crowdFace", 64, 64, (q) => { q.clearRect(0, 0, 64, 64); q.fillStyle = "#1b1410"; q.beginPath(); q.ellipse(20, 28, 4, 5, 0, 0, 7); q.ellipse(44, 28, 4, 5, 0, 0, 7); q.fill(); q.fillRect(24, 44, 16, 3); }), transparent: true, roughness: 0.6 });
  const meshes = parts.map(([g, , c]) => { const im = new THREE.InstancedMesh(g, M("#ffffff", 0.65), n); im.castShadow = true; im.receiveShadow = true; for (let i = 0; i < n; i++) im.setColorAt(i, new THREE.Color(c(i))); p.add(im); return im; });
  const fm = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.34, 0.34).translate(0, 1.55, 0.176), face, n); p.add(fm);
  let i = 0;
  for (let row = 0; i < n; row++) { const R = 4.5 + row * 0.85, y = row * 0.32, cnt = Math.floor(R * Math.PI * 0.9 / 0.62);
    for (let k = 0; k < cnt && i < n; k++, i++) { const a = -Math.PI * 0.45 + (k + (row % 2) * 0.5) / cnt * Math.PI * 0.9; const x = Math.sin(a) * R, z = Math.cos(a) * R;
      dummy.position.set(x + (hash(i, 1) - 0.5) * 0.12, y, z); dummy.rotation.set(0, Math.atan2(-x, -z) + (hash(i, 2) - 0.5) * 0.2, 0); const s = 0.92 + hash(i, 3) * 0.16; dummy.scale.set(s, s, s); dummy.updateMatrix();
      for (const m of meshes) m.setMatrixAt(i, dummy.matrix); fm.setMatrixAt(i, dummy.matrix); } }
  // gradins : un seul profil en escalier tourné autour de l'axe (marches sous chaque rang)
  { const pts: THREE.Vector2[] = [new THREE.Vector2(4.05, 0)]; for (let row = 0; row < 33; row++) { const R = 4.5 + row * 0.85, y = row * 0.32; pts.push(new THREE.Vector2(R - 0.425, y), new THREE.Vector2(R + 0.425, y)); } pts.push(new THREE.Vector2(4.5 + 32 * 0.85 + 0.425, 0));
    const st = add(p, new THREE.LatheGeometry(pts, 120, -Math.PI * 0.47, Math.PI * 0.94), new THREE.MeshStandardMaterial({ color: "#7fc4e4", roughness: 0.8, side: THREE.DoubleSide }), 0, 0, 0, 0, false); st.receiveShadow = true; st.userData.noEdge = true; }
};

// ============================================================ décors
export class Sets {
  root = new THREE.Group(); g: Record<SetK, THREE.Group>;
  sun: Record<string, THREE.DirectionalLight> = {}; hemi: Record<string, THREE.HemisphereLight> = {};
  home!: HouseD; houses: HouseD[] = []; townPeople: THREE.Vector3[] = []; cars: THREE.Group[] = [];
  bedPage: Page; friendPage: Page; carPage: Page; poolPage: Page; dinoPage: Page; girlPage: Page; cagePage: Page; doorPage: Page; kbPage: Page;
  bedBook: THREE.Group; friendBook: THREE.Group; yardBook: THREE.Group; clsBook: THREE.Group; hallBook: THREE.Group; townBook: THREE.Group; boyBook: THREE.Group; boyPage: Page;
  bill: Drawn; pc: Drawn; car: Drawn; pool: Drawn; dino: Dino; dinoD: Drawn; cage: Drawn; door: Door; eraser: Eraser; bucket!: THREE.Group; bucketHeld: THREE.Group;
  lockers: Drawn[] = []; lockerZ: number[] = []; hallDesks: Drawn[] = []; hallDeskZ: number[] = []; erased: THREE.Mesh[] = []; mural: THREE.Mesh; muralM: THREE.MeshStandardMaterial; crumbs: Crumbs;
  splash: THREE.Mesh[] = []; poolWater!: THREE.Mesh; clsDesks: THREE.Group[] = []; artBuckets: THREE.Group[] = [];
  constructor() {
    this.g = Object.fromEntries((Object.keys(O) as SetK[]).map((k) => { const g = new THREE.Group(); g.position.copy(O[k]); this.root.add(g); return [k, g]; })) as Record<SetK, THREE.Group>;
    const sun = (k: SetK, pos: THREE.Vector3, tgt: THREE.Vector3, i: number, size: number, col = "#fff2dc", hs = "#cfe6ff", hg = "#a8c890", hi = 0.9) => {
      const s = new THREE.DirectionalLight(col, i); s.position.copy(pos); s.target.position.copy(tgt); s.castShadow = true; s.shadow.mapSize.set(2048, 2048);
      const c = s.shadow.camera; c.left = c.bottom = -size; c.right = c.top = size; c.near = 0.5; c.far = 120; s.shadow.bias = -0.0004; s.shadow.normalBias = 0.02; s.shadow.radius = 4;
      this.g[k].add(s, s.target); this.sun[k] = s; const h = new THREE.HemisphereLight(hs, hg, hi); this.g[k].add(h); this.hemi[k] = h; return s; };
    const pt = (k: SetK | THREE.Object3D, x: number, y: number, z: number, col: string, i: number, d = 10) => { const l = new THREE.PointLight(col, i, d, 1.6); l.position.set(x, y, z); (typeof k === "string" ? this.g[k] : k).add(l); return l; };

    // ---------------- pages de carnet (dessins tracés)
    this.bedPage = new Page(DRAW.pc); this.friendPage = new Page(DRAW.bill); this.carPage = new Page(DRAW.car); this.poolPage = new Page(DRAW.pool); this.dinoPage = new Page(DRAW.dino);
    this.girlPage = new Page(DRAW.girl); this.cagePage = new Page(DRAW.cage); this.doorPage = new Page(DRAW.door); this.kbPage = new Page(DRAW.keyboard);
    const fig: Stroke[] = [circ(0.5, 0.26, 0.1, undefined, 5), S([[0.42, 0.36], [0.38, 0.7], [0.62, 0.7], [0.58, 0.36], [0.42, 0.36]]), S([[0.42, 0.7], [0.42, 0.9]]), S([[0.58, 0.7], [0.58, 0.9]]),
      S([[0.6, 0.42], [0.72, 0.58]]), circ(0.46, 0.25, 0.012, undefined, 6, 8), circ(0.54, 0.25, 0.012, undefined, 6, 8), circ(0.5, 0.29, 0.03, undefined, 4, 10, 0.2, Math.PI - 0.2), S([[0.42, 0.18], [0.46, 0.13], [0.5, 0.17], [0.54, 0.12], [0.58, 0.18]], 4)];
    const figPage = new Page(fig, "#fbf8ef", false); const left: Stroke[] = [S([[0.4, 0.42], [0.28, 0.58]]), circ(0.27, 0.6, 0.025, undefined, 4, 10)];
    this.boyPage = new Page([], "#fbf8ef", false, 512, 512, (g, k) => { g.fillStyle = "#f2b51c"; g.globalAlpha = 0.5; g.fillRect(205, 190, 105, 165); g.globalAlpha = 1; g.drawImage(figPage.tex.image as HTMLCanvasElement, 0, 0);
      g.lineCap = "round"; g.lineWidth = 5; g.strokeStyle = "#26262c"; for (const st of left) { g.beginPath(); st.pts.forEach(([x, y], i) => (i ? g.lineTo(x * 512, y * 512) : g.moveTo(x * 512, y * 512))); g.stroke(); }
      if (k > 0) { g.fillStyle = "#fbf8ef"; g.globalAlpha = Math.min(1, k * 1.3); g.beginPath(); g.ellipse(0.27 * 512, 0.6 * 512, 30 * Math.min(1, k * 1.5), 26 * Math.min(1, k * 1.5), 0.3, 0, 7); g.fill(); g.globalAlpha = 1;
        g.fillStyle = "rgba(230,140,160,0.8)"; for (let i = 0; i < 9 * k; i++) { g.beginPath(); g.arc(0.27 * 512 + (hash(i, 1) - 0.5) * 70, 0.6 * 512 + 20 + hash(i, 2) * 40, 3, 0, 7); g.fill(); } } });
    this.boyPage.draw(0.0001); this.boyPage.draw(0);
    this.girlFix = new Page([...DRAW.girl, S([[0.47, 0.335], [0.48, 0.35], [0.49, 0.335], [0.5, 0.35], [0.51, 0.335], [0.52, 0.35], [0.53, 0.335]], 3)]);
    this.mural2 = ctex("muralD", 768, 512, (q) => { q.fillStyle = "#f4ecd8"; q.fillRect(0, 0, 768, 512); q.fillStyle = "#fdfcf8"; q.beginPath(); q.ellipse(384, 256, 360, 240, 0, 0, 7); q.fill();
      for (let i = 0; i < 30; i++) { q.fillStyle = "rgba(200,190,170,0.25)"; q.beginPath(); q.arc(384 + Math.cos(i) * 330, 256 + Math.sin(i * 1.3) * 210, 10 + hash(i, 1) * 20, 0, 7); q.fill(); }
      q.strokeStyle = "#3a3a42"; q.lineWidth = 5; q.lineCap = "round"; q.lineJoin = "round";
      q.beginPath(); q.roundRect(300, 70, 168, 168, 26); q.stroke(); q.beginPath(); q.roundRect(285, 120, 30, 60, 8); q.roundRect(453, 120, 30, 60, 8); q.stroke();
      q.lineWidth = 4; q.beginPath(); q.roundRect(318, 128, 58, 36, 8); q.roundRect(392, 128, 58, 36, 8); q.moveTo(376, 140); q.lineTo(392, 140); q.stroke(); q.fillStyle = "#3a3a42"; q.beginPath(); q.arc(347, 146, 7, 0, 7); q.arc(421, 146, 7, 0, 7); q.fill();
      q.beginPath(); q.ellipse(362, 190, 22, 8, -0.2, 0, 7); q.ellipse(406, 190, 22, 8, 0.2, 0, 7); q.fill(); q.lineWidth = 5; q.beginPath(); q.moveTo(364, 212); q.lineTo(404, 212); q.stroke();
      q.beginPath(); q.moveTo(330, 238); q.lineTo(300, 330); q.lineTo(468, 330); q.lineTo(438, 238); q.stroke(); q.beginPath(); q.moveTo(384, 238); q.lineTo(372, 290); q.lineTo(384, 310); q.lineTo(396, 290); q.closePath(); q.stroke();
      for (let i = 0; i < 40; i++) { q.strokeStyle = "rgba(60,60,70,0.25)"; q.lineWidth = 1.5; q.beginPath(); const x = 310 + hash(i, 4) * 140, y = 80 + hash(i, 5) * 150; q.moveTo(x, y); q.lineTo(x + 12, y + 12); q.stroke(); }
      q.fillStyle = "#2a2a30"; q.font = "bold 40px 'Comic Sans MS', cursive"; q.textAlign = "center"; q.fillText("Tout ce que vous dessinez", 384, 395); q.fillText("est volé ailleurs.", 384, 445); });


    // ---------------- ville (rue est-ouest, maisons colorées de chaque côté)
    { const p = this.g.TOWN; sun("TOWN", V(-30, 40, 25), V(0, 0, 0), 3.2, 40, "#fff0d8", "#bfe0ff", "#9ac878", 1.1);
      const sky = new THREE.Mesh(new THREE.SphereGeometry(300, 32, 16), new THREE.MeshBasicMaterial({ map: skyTex(), side: THREE.BackSide, fog: false })); sky.userData.noEdge = true; p.add(sky);
      plane(p, 400, 400, M("#ffffff", 0.95, rep(grassTex(), 120, 120)), 0, -0.01, 0, -Math.PI / 2);
      plane(p, 200, 7, M("#ffffff", 0.85, rep(asphaltTex(), 60, 2)), 0, 0.01, 2, -Math.PI / 2);
      for (let i = -20; i < 20; i++) plane(p, 1.6, 0.14, M("#f4f4f4", 0.6), i * 4, 0.015, 2, -Math.PI / 2);
      for (const z of [-2.4, 6.4]) { bx(p, 200, 0.16, 1.8, M("#d8d4cc", 0.85), 0, 0.08, z, 0, 0.01); bx(p, 200, 0.2, 0.14, M("#c8c4bc", 0.8), 0, 0.1, z + (z < 0 ? 0.9 : -0.9), 0, 0.01); }
      const cols: [string, string][] = [["#f4d35e", "#a8423a"], ["#f2a6b4", "#5a4a8a"], ["#9ad0e8", "#3a5a8a"], ["#b8e0a0", "#8a3a3a"], ["#f8c890", "#4a5a7a"], ["#e8e0ff", "#a8423a"], ["#ffb0a0", "#3a6a5a"]];
      for (let i = -3; i <= 3; i++) for (const side of [-1, 1]) { const c = cols[(i + 3 + (side > 0 ? 3 : 0)) % 7], h = new HouseD(c[0], c[1], i + 10 + side * 3); h.root.position.set(i * 13, 0, side < 0 ? -10 : 14.5); h.root.rotation.y = side < 0 ? 0 : Math.PI; p.add(h.root); this.houses.push(h); if (i === 0 && side < 0) this.home = h; }
      for (let i = -4; i <= 4; i++) { tree(p, i * 13 + 6.5, -5.2, 1.0, i + 4); tree(p, i * 13 + 6.5, 9.4, 0.95, i + 7); }
      for (const i of [-6, -5, -4, 4, 5, 6]) { farHouse(p, i * 13, -10, 0, 40 + i); farHouse(p, i * 13, 14.5, Math.PI, 60 + i); }
      for (const i of [-6, -5, 5, 6]) { simpleTree(p, i * 13 + 6.5, -5.2, 1.0, i + 9); simpleTree(p, i * 13 + 6.5, 9.4, 1.0, i + 3); }
      street(p, -34, -80, 80, 3); street(p, 38, -80, 80, 31); street(p, -64, -90, 90, 57); street(p, 68, -90, 90, 83);
      for (let x = -100; x <= 100; x += 9) for (const z of [-18.5, 23.5, -49, 53]) { bx(p, 0.08, 1.0, 0.08, M("#ffffff", 0.6), x, 0.5, z).castShadow = false; if (hash(x, z) < 0.45) simpleTree(p, x + 3, z, 0.8 + hash(x, 3) * 0.4, Math.abs(x)); }
      for (let i = 0; i < 26; i++) { const a = -Math.PI * 0.9 + i * 0.075 * Math.PI; building(p, Math.sin(a) * (125 + hash(i, 1) * 25), Math.cos(a) * -(125 + hash(i, 1) * 25) * -1, 10 + hash(i, 2) * 8, 18 + hash(i, 3) * 40, i); }
      for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2, r = 175 + hash(i, 7) * 30; const hl = add(p, new THREE.SphereGeometry(40 + hash(i, 8) * 30, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), M(["#7ac060", "#6ab858", "#8ac868"][i % 3], 0.95), Math.cos(a) * r, -6, Math.sin(a) * r, 0, false); hl.scale.y = 0.35 + hash(i, 9) * 0.25; }
      { const ch = grp(p, -38, 0, -92); bx(ch, 8, 10, 12, M("#f0e6d8", 0.8), 0, 5, 0).castShadow = false; bx(ch, 4, 22, 4, M("#f0e6d8", 0.8), 0, 11, 7).castShadow = false; add(ch, new THREE.ConeGeometry(3.2, 8, 4), M("#5a6a8a", 0.7), 0, 26, 7, Math.PI / 4, false); }
      for (let i = -4; i <= 4; i++) { const l = grp(p, i * 13 + 3, 0, -3.1); cyl(l, 0.06, 0.08, 4.2, M("#2a2e36", 0.5, undefined, { metalness: 0.6 }), 0, 2.1, 0, 8); bx(l, 0.5, 0.1, 0.2, M("#2a2e36", 0.5), 0.2, 4.2, 0); }
      const carCols = ["#2a7ae8", "#f2b51c", "#2fae7a", "#e8503a"]; for (let i = 0; i < 4; i++) { const c = mkCar(); c.scale.setScalar(0.92); c.position.set(-20 + i * 12.5, 0, i % 2 ? 4.6 : -0.6); c.rotation.y = i % 2 ? Math.PI : 0;
        c.traverse((o) => { const m = o as THREE.Mesh; if (m.isMesh && (m.material as THREE.MeshPhysicalMaterial).color?.getHexString() === "e8202a") m.material = P(carCols[i], 0.25); }); p.add(c); this.cars.push(c); }
      this.door = new Door(); this.door.root.position.set(-1.2, 0.16, 4.2); this.door.root.rotation.y = Math.PI * 0.08; p.add(this.door.root);
      this.townBook = notebook(p, this.doorPage, 0, 0, 0, 0, 1); this.townBook.visible = false;
      for (let i = 0; i < 3; i++) { const b = grp(p, 4.2 + i * 0.35, 0, 7.0 + (i % 2) * 0.3); const bm = P(["#ff3a5a", "#2a9af0", "#ffd21a"][i], 0.15); const sp = add(b, new THREE.SphereGeometry(0.28, 24, 18), bm, 0, 0, 0); sp.scale.set(1, 1.18, 1);
        add(b, new THREE.ConeGeometry(0.05, 0.08, 10), bm, 0, -0.34, 0).rotation.x = Math.PI; const str = add(b, new THREE.CylinderGeometry(0.004, 0.004, 1.1, 4), M("#f4f4f4", 0.6), 0, -0.92, 0, 0, false); str.userData.noEdge = true; this.balloons.push(new Drawn(b, 4, 25, 1.5)); }
      this.townCar = new Drawn(this.cars[2], 5, 30, 4);
      // objets du montage d'ouverture (« absolument n'importe quoi »)
      { const d = grp(p, -14, 1.45, 1.6); const dn = add(d, new THREE.TorusGeometry(0.95, 0.48, 24, 48), P("#e8b070", 0.4), 0, 0, 0); dn.userData.k = 1;
        const ic = add(d, new THREE.TorusGeometry(0.95, 0.5, 20, 48, Math.PI * 2), P("#ff6aa8", 0.2), 0, 0, -0.1); ic.scale.set(1, 1, 0.75);
        for (let i = 0; i < 40; i++) { const a = hash(i, 1) * Math.PI * 2, r = 0.95 + (hash(i, 2) - 0.5) * 0.7; const sp = add(d, new THREE.CapsuleGeometry(0.035, 0.12, 3, 6), P(["#ffffff", "#2a9af0", "#ffd21a", "#2fae7a", "#9a5ad8"][i % 5], 0.3), Math.cos(a) * r, Math.sin(a) * r, -0.5, 0, false); sp.rotation.z = hash(i, 3) * 3; sp.userData.noEdge = true; }
        this.fun.push(new Drawn(d, 5, 30, 3)); }
      { const r = grp(p, 14, 0, 1.8); cyl(r, 0.55, 0.55, 2.6, P("#f4f4f4", 0.25), 0, 1.7, 0, 32); add(r, new THREE.ConeGeometry(0.55, 1.1, 32), P("#e8202a", 0.2), 0, 3.55, 0);
        add(r, new THREE.CylinderGeometry(0.22, 0.22, 0.06, 24).rotateX(Math.PI / 2), P("#2a9af0", 0.05), 0, 2.4, 0.54); cyl(r, 0.4, 0.5, 0.4, M("#3a3e48", 0.4, undefined, { metalness: 0.7 }), 0, 0.2, 0, 24);
        for (let i = 0; i < 3; i++) { const f = grp(r, 0, 0, 0, i * Math.PI * 2 / 3); bx(f, 0.06, 0.9, 0.6, P("#e8202a", 0.2), 0, 0.75, 0.75); }
        this.fun.push(new Drawn(r, 5, 30, 3)); }
      { const c = grp(p, -26, 0, 1.8); const cone = add(c, new THREE.ConeGeometry(0.7, 1.8, 24), M("#e0a050", 0.7, rep(tileTex("#e8b060", "#c88a3a", 6), 2, 2)), 0, 0.9, 0); cone.rotation.x = Math.PI;
        for (const [y, col, rr] of [[1.95, "#fff4e0", 0.8], [2.65, "#ff8ab8", 0.72], [3.3, "#7ad0a0", 0.62]] as const) add(c, new THREE.SphereGeometry(rr, 28, 20), P(col, 0.35), 0, y, 0);
        add(c, new THREE.SphereGeometry(0.16, 16, 12), P("#e8202a", 0.1), 0, 3.95, 0); this.fun.push(new Drawn(c, 5, 30, 3)); }
      { const t = grp(p, 26, 0, 2.2); const fur = P("#c8884a", 0.75), lt = P("#f0d0a0", 0.7), blk = P("#1a1410", 0.2);
        const body = add(t, new THREE.SphereGeometry(0.85, 28, 20), fur, 0, 1.0, 0); body.scale.set(1, 1.15, 0.9); add(t, new THREE.SphereGeometry(0.5, 24, 16), lt, 0, 0.95, 0.45).scale.set(1, 1.2, 0.5);
        add(t, new THREE.SphereGeometry(0.62, 28, 20), fur, 0, 2.3, 0); for (const x of [-0.45, 0.45]) { add(t, new THREE.SphereGeometry(0.24, 16, 12), fur, x, 2.8, 0); add(t, new THREE.SphereGeometry(0.3, 16, 12), fur, x * 1.6, 1.4, 0.15).scale.set(0.8, 1.2, 0.8); add(t, new THREE.SphereGeometry(0.34, 16, 12), fur, x * 1.1, 0.25, 0.3); add(t, new THREE.SphereGeometry(0.07, 12, 10), blk, x * 0.45, 2.42, 0.55); }
        add(t, new THREE.SphereGeometry(0.24, 16, 12), lt, 0, 2.17, 0.52).scale.set(1, 0.8, 0.7); add(t, new THREE.SphereGeometry(0.08, 12, 10), blk, 0, 2.24, 0.69);
        const bow = grp(t, 0, 1.85, 0.5); for (const x of [-0.18, 0.18]) add(bow, new THREE.ConeGeometry(0.14, 0.3, 12), P("#e8202a", 0.2), x, 0, 0).rotation.z = x > 0 ? Math.PI / 2 : -Math.PI / 2;
        this.fun.push(new Drawn(t, 5, 30, 3)); }
      this.home.initFx(); this.doorD = new Drawn(this.door.root, 5, 30, 4); }

    // ---------------- chambre du héros
    { const p = this.g.BED; sun("BED", V(-3, 5, -6), V(0, 0, 0), 1.6, 6, "#fff2dc", "#ffffff", "#c8a888", 0.7);
      room(p, 5.2, 4.6, 2.6, new THREE.MeshStandardMaterial({ map: rep(stripesTex("#9ad0f0", "#b4dcf4"), 6, 1), roughness: 0.9 }), new THREE.MeshStandardMaterial({ map: rep(woodTex("#c89a6a"), 3, 3), roughness: 0.5 }));
      windowAt(p, -0.8, 1.5, -2.29, 0, 1.4, 1.1); add(p, new THREE.PlaneGeometry(2.4, 1.8).rotateX(-Math.PI / 2), M("#ffffff", 0.95, ctex("rugB", 256, 256, (q) => { q.fillStyle = "#f2b51c"; q.fillRect(0, 0, 256, 256); q.fillStyle = "#e8503a"; for (let i = 0; i < 6; i++) { q.beginPath(); q.arc(128, 128, 120 - i * 20, 0, 7); q.fillStyle = i % 2 ? "#f2b51c" : "#e8503a"; q.fill(); } })), 0, 0.005, 0.3, 0, false);
      // lit
      bx(p, 1.1, 0.4, 2.1, M("#ffffff", 0.6, rep(woodTex("#e8d8b8"), 1, 1)), -2.0, 0.2, -1.1); bx(p, 1.0, 0.18, 2.0, M("#2a5cb8", 0.8, rep(dotsTex("#2a5cb8", "#f2b51c"), 2, 4)), -2.0, 0.48, -1.0, 0, 0.06); bx(p, 0.7, 0.14, 0.4, M("#ffffff", 0.8), -2.0, 0.62, -1.85, 0, 0.06); bx(p, 1.1, 0.9, 0.08, M("#ffffff", 0.6, rep(woodTex("#e8d8b8"), 1, 1)), -2.0, 0.65, -2.17);
      // petit bureau d'origine (côté droit) avec carnet
      desk(p, 2.0, -1.4, -Math.PI / 2, "#f4f1ea", "#e8503a"); chair(p, 1.5, -1.4, Math.PI / 2, "#2a7ae8");
      this.bedBook = notebook(p, this.bedPage, 2.0, 0.745, -1.35, -Math.PI / 2, 1.0); notebook(p, this.kbPage, 0, 0, 0).visible = false;
      frame(p, posterTex(0), 0.6, 0.85, 0.9, 1.6, -2.28); frame(p, posterTex(1), 0.6, 0.85, 2.58, 1.6, -0.3, -Math.PI / 2); frame(p, posterTex(3), 0.6, 0.85, -2.58, 1.6, 0.6, Math.PI / 2);
      bx(p, 1.0, 0.04, 0.25, M("#ffffff", 0.6), 1.6, 1.9, -2.15); for (let i = 0; i < 6; i++) bx(p, 0.05, 0.22 + hash(i, 3) * 0.06, 0.18, M(["#e8503a", "#2a7ae8", "#f2b51c", "#2fae7a"][i % 4], 0.6), 1.25 + i * 0.07, 2.04, -2.15);
      const pc = mkPC(); pc.position.set(0.1, 0, 0.35); p.add(pc); this.pc = new Drawn(pc, 5, 30, 3);
      pt("BED", 0, 2.4, 0, "#fff2dc", 4, 8); }

    // ---------------- bureau du meilleur ami
    { const p = this.g.FRD; sun("FRD", V(-4, 5, -5), V(0, 0, 0), 1.5, 5, "#fff2dc", "#ffffff", "#c8a888", 0.7);
      room(grp(p, 0, 0, 0.8), 6, 5.6, 2.6, new THREE.MeshStandardMaterial({ map: rep(dotsTex("#b8e0a0", "#a0d088"), 6, 2), roughness: 0.9 }), new THREE.MeshStandardMaterial({ map: rep(woodTex("#b88a5a"), 3, 3), roughness: 0.5 }));
      windowAt(p, -0.9, 1.55, -1.99, 0, 1.2, 1.0); const d = desk(p, 0, -0.75, 0, "#f4f1ea", "#2fae7a"); d.scale.set(1.4, 1, 1.2); chair(p, 0, -1.35, 0, "#f2b51c");
      this.friendBook = grp(p, 0.0, 0.745, -0.8, Math.PI); bx(this.friendBook, 0.3, 0.004, 0.42, M("#fbf8ef", 0.9), 0, 0.002, 0); const pl = plane(this.friendBook, 0.29, 0.41, pageMat(this.friendPage), 0, 0.005, 0, -Math.PI / 2); pl.castShadow = false;
      const b = mkBill(); b.position.set(-0.36, 0.745, -0.72); b.rotation.y = 0.3; b.scale.setScalar(1.15); p.add(b); this.bill = new Drawn(b, 3, 20, 1.2);
      const lamp = grp(p, 0.5, 0.745, -0.95); cyl(lamp, 0.08, 0.1, 0.03, M("#2fae7a", 0.4), 0, 0.015, 0); const arm = cyl(lamp, 0.012, 0.012, 0.45, M("#2fae7a", 0.4), 0, 0.24, 0, 8); arm.rotation.z = 0.3;
      add(lamp, new THREE.ConeGeometry(0.1, 0.14, 16, 1, true), M("#2fae7a", 0.4, undefined, { side: THREE.DoubleSide }), -0.1, 0.46, 0.05); pt(lamp, -0.1, 0.4, 0.05, "#ffe0b0", 2.5, 3);
      frame(p, kidArtTex(2), 0.4, 0.5, 0.9, 1.6, -1.98); bx(p, 0.9, 0.9, 0.35, M("#ffffff", 0.6), 1.5, 0.45, -1.8);
      bx(p, 1.0, 0.4, 2.0, M("#ffffff", 0.6, rep(woodTex("#e8d8b8"), 1, 1)), 2.4, 0.2, 1.2); bx(p, 0.95, 0.18, 1.9, M("#2fae7a", 0.8, rep(dotsTex("#2fae7a", "#ffffff"), 2, 4)), 2.4, 0.48, 1.25, 0, 0.06); bx(p, 0.6, 0.14, 0.35, M("#ffffff", 0.8), 2.4, 0.62, 0.45, 0, 0.06);
      frame(p, posterTex(1), 0.6, 0.85, 2.98, 1.6, -0.6, -Math.PI / 2); frame(p, posterTex(2), 0.6, 0.85, -2.98, 1.6, 0.4, Math.PI / 2);
      { const sh = grp(p, -2.6, 0, -1.2, Math.PI / 2); for (let r = 0; r < 4; r++) { bx(sh, 1.2, 0.04, 0.35, M("#ffffff", 0.6), 0, 0.3 + r * 0.45, 0); for (let i = 0; i < 9; i++) bx(sh, 0.09, 0.26 + hash(i, r) * 0.08, 0.24, M(["#e84a3a", "#2a7ae8", "#f2b51c", "#9a5ad8"][(i + r) % 4], 0.6), -0.5 + i * 0.125, 0.46 + r * 0.45, 0).castShadow = false; } }
      add(p, new THREE.PlaneGeometry(2.0, 1.4).rotateX(-Math.PI / 2), M("#ffffff", 0.95, dotsTex("#40b8f0", "#ffffff")), 0.6, 0.005, 0.6, 0, false);
      add(p, new THREE.SphereGeometry(0.2, 20, 14), M("#ffffff", 0.5, ctex("ball", 128, 64, (q) => { q.fillStyle = "#ffffff"; q.fillRect(0, 0, 128, 64); q.fillStyle = "#222"; for (let i = 0; i < 6; i++) { q.beginPath(); q.arc(i * 24, 20 + (i % 2) * 24, 9, 0, 7); q.fill(); } })), 1.3, 0.2, 1.4);
      pt("FRD", 0, 2.4, 0, "#fff2dc", 3, 7); }

    // ---------------- salle de classe
    { const p = this.g.CLS; sun("CLS", V(8, 6, 2), V(0, 0, 0), 2.6, 7, "#fff2dc", "#ffffff", "#c8b498", 0.75);
      room(p, 8.4, 7.4, 3.0, new THREE.MeshStandardMaterial({ map: rep(stripesTex("#bfe6c2", "#aedcb2", 16), 4, 1), roughness: 0.9 }), new THREE.MeshStandardMaterial({ map: rep(tileTex("#bcdcf2", "#9ccaea", 8), 5, 5), roughness: 0.45 }));
      bx(p, 8.4, 1.0, 0.03, M("#3a8ad8", 0.6), 0, 0.5, -3.69); bx(p, 0.03, 1.0, 7.4, M("#3a8ad8", 0.6), -4.19, 0.5, 0);
      plane(p, 4.2, 1.6, M("#ffffff", 0.9, chalkTex()), -0.3, 1.75, -3.67); bx(p, 4.4, 0.08, 0.08, M("#b8956a", 0.5), -0.3, 0.92, -3.64); bx(p, 4.4, 1.8, 0.04, M("#b8956a", 0.5), -0.3, 1.75, -3.7);
      for (let i = 0; i < 3; i++) windowAt(p, 4.18, 1.7, -2.2 + i * 2.2, -Math.PI / 2, 1.6, 1.4);
      for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) { const x = -2.6 + c * 1.5, z = -0.6 + r * 1.35; this.clsDesks.push(desk(p, x, z, 0, "#d9b98a", ["#2a7ae8", "#e8503a", "#2fae7a"][(r + c) % 3])); chair(p, x, z + 0.48, Math.PI, ["#f2b51c", "#2a7ae8", "#e8503a"][(r + c) % 3]); }
      const td = desk(p, 2.2, -2.6, 0, "#a8784a", "#5a3a2a"); td.scale.set(1.6, 1, 1.2); chair(p, 2.2, -3.1, 0, "#5a3a2a");
      for (let i = 0; i < 6; i++) frame(p, kidArtTex(i), 0.42, 0.52, -3.2 + i * 1.15, 2.35, 3.68, Math.PI);
      const doorC = grp(p, -4.18, 0, 2.2, Math.PI / 2); bx(doorC, 1.0, 2.2, 0.06, P("#2a5cb8", 0.4), 0, 1.1, 0);
      this.clsBook = notebook(p, this.poolPage, -1.1, 0.745, 0.75, 0, 1.0);
      const pool = mkPool(); pool.position.set(2.4, 0, 1.0); p.add(pool); this.pool = new Drawn(pool, 5, 30, 4); pool.traverse((o) => { if (o.userData.water) this.poolWater = o as THREE.Mesh; });
      // détails de classe : frise alphabet, horloge, carte, étagères, casiers à sacs, plantes, guirlande, plafonniers, affaires sur les tables
      for (let i = 0; i < 13; i++) { const L = "ABCDEFGHIJKLM"[i]; plane(p, 0.3, 0.34, M("#ffffff", 0.7, ctex("abc" + L, 64, 72, (q) => { q.fillStyle = ["#ff5a7a", "#ffd21a", "#40b8f0", "#2fae7a", "#ff8a3a"][i % 5]; q.fillRect(0, 0, 64, 72); q.fillStyle = "#fff"; q.font = "bold 50px sans-serif"; q.textAlign = "center"; q.fillText(L, 32, 55); })), -2.2 + i * 0.34, 2.75, -3.67).castShadow = false; }
      { const ck = grp(p, 2.3, 2.3, -3.66); add(ck, new THREE.CylinderGeometry(0.22, 0.22, 0.05, 32).rotateX(Math.PI / 2), M("#ffffff", 0.4), 0, 0, 0); add(ck, new THREE.TorusGeometry(0.22, 0.025, 8, 32), P("#e8343a", 0.3), 0, 0, 0.02); bx(ck, 0.015, 0.12, 0.01, M("#222", 0.5), 0, 0.05, 0.035); const mh = bx(ck, 0.012, 0.17, 0.01, M("#222", 0.5), 0.05, 0.03, 0.04); mh.rotation.z = -1.2; }
      frame(p, ctex("map", 512, 320, (q) => { q.fillStyle = "#7ac8f0"; q.fillRect(0, 0, 512, 320); q.fillStyle = "#8ad068"; for (let i = 0; i < 9; i++) { q.beginPath(); q.ellipse(60 + hash(i, 1) * 400, 50 + hash(i, 2) * 220, 30 + hash(i, 3) * 60, 20 + hash(i, 4) * 40, hash(i, 5) * 3, 0, 7); q.fill(); } q.strokeStyle = "rgba(255,255,255,0.5)"; for (let i = 1; i < 6; i++) { q.beginPath(); q.moveTo(0, i * 53); q.lineTo(512, i * 53); q.stroke(); } }), 1.8, 1.1, -4.17, 1.7, 0.4, Math.PI / 2, "#b8956a");
      frame(p, kidArtTex(20), 0.5, 0.65, -4.17, 1.8, -2.2, Math.PI / 2); frame(p, posterTex(2), 0.5, 0.7, -4.17, 1.8, 2.6, Math.PI / 2);
      { const sh = grp(p, -1.6, 0, 3.45); for (let r = 0; r < 3; r++) bx(sh, 3.4, 0.04, 0.4, M("#ffffff", 0.6), 0, 0.35 + r * 0.45, 0); for (const x of [-1.7, -0.56, 0.56, 1.7]) bx(sh, 0.04, 1.3, 0.4, M("#ffffff", 0.6), x, 0.65, 0);
        for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) { const bg = bx(sh, 0.5, 0.36, 0.3, M(["#e8503a", "#2a7ae8", "#2fae7a", "#f2b51c", "#9a5ad8", "#ff5fa4"][(r * 3 + c) % 6], 0.6), -1.13 + c * 1.13, 0.55 + r * 0.45, 0.02, 0, 0.08); bg.castShadow = false; } }
      { const bk = grp(p, 2.6, 0, 3.45); for (let r = 0; r < 4; r++) { bx(bk, 1.6, 0.04, 0.35, M("#e8d0a8", 0.6), 0, 0.3 + r * 0.45, 0); for (let i = 0; i < 12; i++) bx(bk, 0.08, 0.28 + hash(i, r) * 0.08, 0.24, M(["#e84a3a", "#2a7ae8", "#f2b51c", "#2fae7a", "#9a5ad8", "#ff8a3a"][(i + r) % 6], 0.6), -0.7 + i * 0.125, 0.47 + r * 0.45, 0).castShadow = false; } }
      for (let i = 0; i < 3; i++) { const pl = grp(p, 4.0, 0.96, -2.2 + i * 2.2 + 0.6); cyl(pl, 0.1, 0.08, 0.18, M("#d86a3a", 0.7), 0, 0.09, 0, 12); add(pl, new THREE.IcosahedronGeometry(0.17, 1), M("#3e9a42", 0.8), 0, 0.3, 0); }
      for (let i = 0; i < 16; i++) { const tri = add(p, new THREE.ConeGeometry(0.1, 0.2, 3).rotateX(Math.PI), M(["#ff5a7a", "#ffd21a", "#40b8f0", "#2fae7a"][i % 4], 0.7), -3.8 + i * 0.5, 2.78 - Math.sin(i / 15 * Math.PI) * 0.15, 0.8, 0, false); tri.rotation.y = 0.3; }
      for (const [x, z] of [[-1.5, -1.5], [1.5, -1.5], [-1.5, 1.5], [1.5, 1.5]]) plane(p, 1.2, 0.5, E("#fffaf0", 1.4), x, 2.99, z, Math.PI / 2);
      this.clsDesks.forEach((d, i) => { bx(d, 0.24, 0.03, 0.3, M(["#e8503a", "#2a7ae8", "#2fae7a", "#f2b51c"][i % 4], 0.6), -0.25, 0.75, -0.08, 0.2, 0.01); bx(d, 0.2, 0.05, 0.06, M(["#9a5ad8", "#ff5fa4", "#40b8f0"][i % 3], 0.5), 0.3, 0.765, -0.15, -0.3, 0.02);
        if (i % 2 === 0) bx(d, 0.32, 0.36, 0.16, M(["#2a5cb8", "#e8343a", "#2fae7a"][i % 3], 0.6), 0.5, 0.18, 0.35, 0, 0.06); });
      { const td = grp(p, 2.2, 0.76, -2.6); add(td, new THREE.SphereGeometry(0.16, 24, 16), M("#ffffff", 0.5, ctex("globe", 256, 128, (q) => { q.fillStyle = "#3a8ad8"; q.fillRect(0, 0, 256, 128); q.fillStyle = "#6ac058"; for (let i = 0; i < 8; i++) { q.beginPath(); q.ellipse(hash(i, 1) * 256, 20 + hash(i, 2) * 90, 20 + hash(i, 3) * 25, 12 + hash(i, 4) * 18, 0, 0, 7); q.fill(); } })), -0.45, 0.3, 0); cyl(td, 0.08, 0.1, 0.12, M("#b8956a", 0.6), -0.45, 0.06, 0, 12);
        add(td, new THREE.SphereGeometry(0.06, 16, 12), P("#e8202a", 0.25), 0.4, 0.06, 0.1); for (let i = 0; i < 3; i++) bx(td, 0.3, 0.05, 0.22, M(["#2a5cb8", "#2fae7a", "#f2b51c"][i], 0.6), 0.05, 0.03 + i * 0.05, -0.05, i * 0.2, 0.01); }
      { const bin = grp(p, 3.6, 0, -3.2); add(bin, new THREE.CylinderGeometry(0.18, 0.15, 0.4, 16, 1, true), M("#2a7ae8", 0.5, undefined, { side: THREE.DoubleSide }), 0, 0.2, 0); }
      pt("CLS", -1, 2.8, 0, "#fff6e8", 6, 10); pt("CLS", 2, 2.8, 1, "#fff6e8", 4, 10); }

    // ---------------- cour + façade de l'école
    { const p = this.g.YARD; sun("YARD", V(25, 35, 30), V(0, 0, -4), 3.2, 30, "#fff0d8", "#bfe0ff", "#a8c890", 1.1);
      const sky = new THREE.Mesh(new THREE.SphereGeometry(250, 32, 16), new THREE.MeshBasicMaterial({ map: skyTex(), side: THREE.BackSide, fog: false })); sky.userData.noEdge = true; p.add(sky);
      plane(p, 300, 300, M("#ffffff", 0.95, rep(grassTex(), 90, 90)), 0, -0.01, 0, -Math.PI / 2); plane(p, 34, 20, M("#ffffff", 0.85, rep(asphaltTex(), 10, 6)), 0, 0.01, 0, -Math.PI / 2);
      for (const [x, z, r] of [[-6, 3, 1.6], [6, 3, 1.6]] as const) { const c = new THREE.Mesh(new THREE.RingGeometry(r - 0.06, r, 40), M("#f4f4f4", 0.6)); c.rotation.x = -Math.PI / 2; c.position.set(x, 0.02, z); c.userData.noEdge = true; p.add(c); }
      for (let i = 0; i < 8; i++) { const sq = plane(p, 0.7, 0.7, M(["#ff5a7a", "#ffd21a", "#40b8f0", "#2fae7a"][i % 4], 0.7), -2 + (i % 2) * 0.8, 0.02, 1 + Math.floor(i / 2) * 0.8, -Math.PI / 2); sq.castShadow = false; }
      const sch = grp(p, 0, 0, -10); bx(sch, 30, 7.4, 6, M("#ffffff", 0.85, rep(brickTex(), 8, 2.5)), 0, 3.7, 0, 0, 0.05); bx(sch, 30.4, 0.4, 6.4, M("#f4f1ea", 0.6), 0, 7.5, 0); bx(sch, 30.4, 0.5, 6.4, M("#c8c0b4", 0.8), 0, 0.25, 0);
      for (let f = 0; f < 2; f++) for (let i = 0; i < 10; i++) { if (f === 0 && (i === 4 || i === 5)) continue; const g = grp(sch, -13 + i * 2.9, 2.0 + f * 3.3, 3.02);
        plane(g, 1.6, 1.5, new THREE.MeshPhysicalMaterial({ color: "#8ac8f0", roughness: 0.05, clearcoat: 1, emissive: "#2a5a7a", emissiveIntensity: 0.2 }), 0, 0, 0); bx(g, 1.8, 0.12, 0.15, M("#ffffff", 0.5), 0, -0.8, 0.05); bx(g, 0.08, 1.5, 0.1, M("#ffffff", 0.5), 0, 0, 0.03); bx(g, 1.7, 0.08, 0.1, M("#ffffff", 0.5), 0, 0.75, 0.03); }
      bx(sch, 3.2, 2.8, 0.2, P("#2a5cb8", 0.4), 0, 1.4, 3.0); bx(sch, 4.4, 0.25, 1.6, M("#f4f1ea", 0.6), 0, 3.0, 3.6); for (const x of [-2, 2]) cyl(sch, 0.1, 0.1, 3.0, M("#f4f1ea", 0.6), x, 1.5, 4.2, 12);
      plane(sch, 6, 1.0, new THREE.MeshStandardMaterial({ map: signTex("ecole", "ÉCOLE DES ARTS", "#f2b51c", "#2a2a30"), roughness: 0.5 }), 0, 4.0, 3.03);
      for (let i = 0; i < 14; i++) frame(sch, kidArtTex(i + 3), 0.5, 0.62, -13 + i * 2.0, 0.95, 3.02);
      const bench = grp(p, -4.5, 0, 0.5, 0.25); for (let i = 0; i < 3; i++) bx(bench, 2.0, 0.05, 0.12, M("#e8503a", 0.5), 0, 0.48, -0.15 + i * 0.15); for (let i = 0; i < 3; i++) bx(bench, 2.0, 0.1, 0.04, M("#e8503a", 0.5), 0, 0.68 + i * 0.13, -0.3);
      for (const x of [-0.85, 0.85]) { bx(bench, 0.06, 0.48, 0.5, M("#2a2e36", 0.4, undefined, { metalness: 0.6 }), x, 0.24, 0); }
      this.yardBook = notebook(p, this.carPage, 0, 0, 0); this.yardBook.visible = false;
      const hoop = grp(p, 11, 0, -2, -0.5); cyl(hoop, 0.08, 0.08, 3.2, M("#2a2e36", 0.5, undefined, { metalness: 0.6 }), 0, 1.6, 0, 10); bx(hoop, 1.4, 0.9, 0.06, M("#ffffff", 0.5), 0, 3.3, 0.3); const rr = add(hoop, new THREE.TorusGeometry(0.24, 0.02, 8, 20), M("#e8503a", 0.4), 0, 3.0, 0.6); rr.rotation.x = Math.PI / 2;
      tree(p, -14, -2, 1.3, 1); tree(p, 15, 4, 1.2, 2); tree(p, -16, 7, 1.1, 0);
      const car = mkCar(); car.position.set(5.2, 0, 3.2); car.rotation.y = -0.5; p.add(car); this.car = new Drawn(car, 5, 30, 5); }

    // ---------------- couloir de l'école (axe -z), largeur 3,6 m
    { const p = this.g.HALL; sun("HALL", V(6, 10, -10), V(0, 0, -16), 0.0, 25); this.sun.HALL.castShadow = false; this.hemi.HALL.intensity = 0.8;
      const Lh = 46, z0 = 4, zc = z0 - Lh / 2, wall = new THREE.MeshStandardMaterial({ map: rep(stripesTex("#b4dcf4", "#a2d0ee", 16), 10, 1), roughness: 0.85 });
      plane(p, 3.6, Lh, M("#ffffff", 0.3, rep(tileTex("#e8e2d4", "#ff8a6a", 2), 2, Lh / 1.8)), 0, 0, zc, -Math.PI / 2); plane(p, 3.6, Lh, M("#d4eaf4", 0.9), 0, 3.2, zc, Math.PI / 2);
      plane(p, Lh, 3.2, wall, -1.8, 1.6, zc, 0, Math.PI / 2); plane(p, Lh, 3.2, wall, 1.8, 1.6, zc, 0, -Math.PI / 2); plane(p, 3.6, 3.2, wall, 0, 1.6, z0, 0, Math.PI); plane(p, 3.6, 3.2, wall, 0, 1.6, z0 - Lh);
      for (let i = 0; i < 11; i++) { const z = z0 - 2 - i * 4; plane(p, 0.6, 2.4, E("#fffaf0", 1.6), 0, 3.19, z, Math.PI / 2); if (i % 2 === 0) pt("HALL", 0, 2.9, z, "#fff6e8", 5, 9); }
      bx(p, 0.04, 1.0, Lh, M("#2fae7a", 0.6), -1.78, 0.5, zc); bx(p, 0.04, 1.0, Lh, M("#2fae7a", 0.6), 1.78, 0.5, zc);
      // casiers par blocs de 4 (effaçables), portes de classe
      const lockCol = ["#2a7ae8", "#e8503a", "#f2b51c", "#2fae7a"];
      for (const side of [-1, 1]) for (let b = 0; b < 9; b++) { const z = -1 - b * 4; if (b % 2 === 1 && side > 0) { const dg = grp(p, side * 1.79, 0, z, -side * Math.PI / 2); bx(dg, 1.1, 2.3, 0.08, P("#2a5cb8", 0.4), 0, 1.15, 0); plane(dg, 0.5, 0.4, M("#bfe0ff", 0.1), 0, 1.65, 0.045); add(dg, new THREE.SphereGeometry(0.04, 8, 6), M("#d8d8d8", 0.2, undefined, { metalness: 1 }), 0.4, 1.05, 0.08); continue; }
        const lg = grp(p, side * 1.6, 0, z, -side * Math.PI / 2); const col = lockCol[(b + (side > 0 ? 1 : 0)) % 4];
        for (let k = 0; k < 4; k++) { const x = -0.72 + k * 0.48; bx(lg, 0.46, 1.9, 0.36, P(col, 0.35), x, 0.95, 0, 0, 0.02); for (let s = 0; s < 4; s++) bx(lg, 0.26, 0.02, 0.02, M("#1a1a1a", 0.6), x, 1.65 - s * 0.05, 0.18); bx(lg, 0.04, 0.12, 0.03, M("#d8d8d8", 0.2, undefined, { metalness: 1 }), x + 0.15, 1.0, 0.19); }
        this.lockers.push(new Drawn(lg, 4, 30, 0)); this.lockerZ.push(z); }
      { const bl = grp(p, -1.75, 2.75, 1.5, Math.PI / 2); this.bell = bl; add(bl, new THREE.SphereGeometry(0.16, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), P("#e8343a", 0.25), 0, 0, 0.05).rotation.x = Math.PI / 2; bx(bl, 0.12, 0.12, 0.06, M("#c9ccd4", 0.3, undefined, { metalness: 0.8 }), 0, 0, 0.02);
        const ck = grp(p, 1.76, 2.6, 2.4, -Math.PI / 2); add(ck, new THREE.CylinderGeometry(0.24, 0.24, 0.05, 32).rotateX(Math.PI / 2), M("#ffffff", 0.4), 0, 0, 0); add(ck, new THREE.TorusGeometry(0.24, 0.025, 8, 32), P("#2a5cb8", 0.3), 0, 0, 0.02);
        for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; bx(ck, 0.012, 0.04, 0.01, M("#222", 0.5), Math.sin(a) * 0.19, Math.cos(a) * 0.19, 0.03); }
        this.clockH = grp(ck, 0, 0, 0.035); bx(this.clockH, 0.02, 0.12, 0.01, M("#222", 0.5), 0, 0.05, 0); this.clockM = grp(ck, 0, 0, 0.04); bx(this.clockM, 0.014, 0.18, 0.01, M("#222", 0.5), 0, 0.08, 0);
        const ex = grp(p, 1.72, 0, -20.4, -Math.PI / 2); cyl(ex, 0.09, 0.09, 0.5, P("#e8202a", 0.25), 0, 1.25, 0, 18); cyl(ex, 0.03, 0.04, 0.08, M("#222", 0.4), 0, 1.54, 0, 10); bx(ex, 0.3, 0.02, 0.02, M("#222", 0.4), 0, 1.0, -0.1); }
      for (let i = 0; i < 4; i++) { const z = -3 - i * 8; const d = desk(p, -0.9, z, 0.2, "#d9b98a", "#e8503a"); this.hallDesks.push(new Drawn(d, 4, 30, 0)); this.hallDeskZ.push(z); }
      // peinture murale du fond : d'abord la gomme dessinée au mur, puis (zone effacée) le directeur + le message
      this.muralM = new THREE.MeshStandardMaterial({ map: ctex("muralE", 768, 512, (q) => { q.fillStyle = "#f4ecd8"; q.fillRect(0, 0, 768, 512); q.lineWidth = 9; q.strokeStyle = "#2a2a30"; q.fillStyle = "#ff8fa8"; q.beginPath(); q.moveTo(170, 300); q.lineTo(330, 160); q.lineTo(610, 160); q.lineTo(450, 300); q.closePath(); q.fill(); q.stroke();
        q.fillStyle = "#3a7ae8"; q.beginPath(); q.moveTo(330, 300); q.lineTo(450, 300); q.lineTo(610, 160); q.lineTo(500, 160); q.closePath(); q.fill(); q.stroke(); q.beginPath(); q.moveTo(170, 300); q.lineTo(170, 380); q.lineTo(450, 380); q.lineTo(610, 240); q.lineTo(610, 160); q.stroke(); q.beginPath(); q.moveTo(450, 300); q.lineTo(450, 380); q.stroke(); }), roughness: 0.85 });
      this.mural = plane(p, 3.4, 2.3, this.muralM, 0, 1.6, z0 - Lh + 0.02); this.mural1 = this.muralM.map!;
      // zone effacée (papier blanc) qui grandit derrière la gomme
      const em = M("#ffffff", 0.95, rep(paperTex(), 2, 2), { emissive: "#ffffff", emissiveIntensity: 0.12 });
      for (const [rx, ry, x, y] of [[-Math.PI / 2, 0, 0, 0.004], [Math.PI / 2, 0, 0, 3.19]] as const) { const m = plane(p, 3.58, 1, em, x, y, 0, rx, ry); this.erased.push(m); }
      for (const s of [-1, 1]) { const m = plane(p, 1, 3.18, em, s * 1.795, 1.6, 0, 0, -s * Math.PI / 2); this.erased.push(m); }
      for (const m of this.erased) m.visible = false;
      this.eraser = new Eraser(3.3, 2.3, 4.6); this.eraser.root.position.set(0, 1.4, -38); p.add(this.eraser.root);
      this.crumbs = new Crumbs(220, "#d88a9a", 0.05); p.add(this.crumbs.pts);
      this.dino = new Dino(); this.dino.root.scale.setScalar(0.95); p.add(this.dino.root); this.dinoD = new Drawn(this.dino.root, 5, 30, 4);
      const cage = mkCage(); cage.position.set(0, 0, -14); p.add(cage); this.cage = new Drawn(cage, 5, 30, 4);
      this.hallBook = notebook(p, this.cagePage, 0, 0, 0); this.hallBook.visible = false;
      this.bucketHeld = mkBucket(); p.add(this.bucketHeld); this.bucketHeld.visible = false;
      for (let i = 0; i < 14; i++) { const s = add(p, new THREE.SphereGeometry(0.12 + hash(i, 1) * 0.12, 12, 10), P("#ffd21a", 0.15), 0, 0, 0, 0, false); s.visible = false; this.splash.push(s); } }

    // ---------------- salle d'arts plastiques
    { const p = this.g.ART; sun("ART", V(6, 6, 3), V(0, 0, 0), 2.4, 7, "#fff2dc", "#ffffff", "#c8b498", 0.8);
      room(p, 7, 6, 3, new THREE.MeshStandardMaterial({ map: rep(dotsTex("#b4ecd6", "#8edcc0"), 6, 3), roughness: 0.9 }), new THREE.MeshStandardMaterial({ map: rep(tileTex("#f6cfa8", "#eab48a", 6), 4, 4), roughness: 0.5 }));
      for (let i = 0; i < 2; i++) windowAt(p, 3.48, 1.7, -1.4 + i * 2.6, -Math.PI / 2, 1.6, 1.4);
      bx(p, 3.2, 0.06, 1.4, M("#ffffff", 0.5, rep(woodTex("#e8d0a8"), 2, 1)), -0.4, 0.78, 0.6); for (const [a, b] of [[-1.9, 0], [1.1, 0], [-1.9, 1.2], [1.1, 1.2]]) bx(p, 0.08, 0.78, 0.08, M("#5a3a2a", 0.6), a, 0.39, b);
      for (let i = 0; i < 8; i++) { const sp = plane(p, 0.2 + hash(i, 1) * 0.2, 0.2 + hash(i, 2) * 0.2, M(["#e84a3a", "#2a7ae8", "#f2b51c", "#2fae7a", "#ff5fa4"][i % 5], 0.4), -1.6 + hash(i, 3) * 2.4, 0.815, 0.1 + hash(i, 4) * 1.0, -Math.PI / 2); sp.castShadow = false; }
      // étagère de seaux de peinture
      const sh = grp(p, -1.0, 0, -2.75); for (let s = 0; s < 3; s++) bx(sh, 3.0, 0.05, 0.45, M("#ffffff", 0.6), 0, 0.5 + s * 0.6, 0); for (const x of [-1.5, 1.5]) bx(sh, 0.05, 1.8, 0.45, M("#ffffff", 0.6), x, 0.9, 0);
      const bc = ["#e84a3a", "#2a7ae8", "#ffd21a", "#2fae7a", "#ff5fa4", "#9a5ad8"]; for (let s = 0; s < 3; s++) for (let i = 0; i < 6; i++) { const b = mkBucket(bc[(i + s * 2) % 6]); b.position.set(-1.2 + i * 0.48, 0.525 + s * 0.6, 0); sh.add(b); if (s === 0 && i === 2) this.bucket = b; this.artBuckets.push(b); }
      for (let i = 0; i < 3; i++) { const e = grp(p, -2.5 + i * 1.3, 0, -1.2 + (i % 2) * 0.4, 0.3 - i * 0.2); for (const [x, rz] of [[-0.3, 0.12], [0.3, -0.12]] as const) { const l = bx(e, 0.05, 1.8, 0.05, M("#b8956a", 0.6), x, 0.9, 0); l.rotation.z = rz; }
        const bl = bx(e, 0.05, 1.7, 0.05, M("#b8956a", 0.6), 0, 0.85, -0.35); bl.rotation.x = -0.2; bx(e, 0.7, 0.9, 0.02, M("#ffffff", 0.8, kidArtTex(i + 7)), 0, 1.3, 0.04); }
      for (let i = 0; i < 5; i++) frame(p, kidArtTex(i + 11), 0.5, 0.62, -2.6 + i * 1.2, 2.2, 2.98, Math.PI);
      const sink = grp(p, 2.6, 0, 2.4); bx(sink, 1.2, 0.85, 0.6, M("#ffffff", 0.5), 0, 0.42, 0); bx(sink, 0.8, 0.1, 0.4, M("#c8ccd2", 0.2, undefined, { metalness: 0.8 }), 0, 0.82, 0);
      pt("ART", 0, 2.8, 0, "#fff6e8", 6, 10); }

    // ---------------- l'autre monde : foule sur des gradins, chacun un carnet à la main
    { const p = this.g.OTH; sun("OTH", V(-20, 30, 30), V(0, 0, 10), 2.3, 40, "#fff4e4", "#f0f4ff", "#d8d0c4", 1.2);
      const sky = new THREE.Mesh(new THREE.SphereGeometry(300, 32, 16), new THREE.MeshBasicMaterial({ color: "#bfe0f4", side: THREE.BackSide, fog: false })); sky.userData.noEdge = true; p.add(sky);
      plane(p, 400, 400, M("#c4e6c8", 0.95, rep(paperTex(), 80, 80)), 0, 0, 0, -Math.PI / 2);
      const c = grp(p, 0, 0, 1.2); crowd(c, 2600);
      const dd = new Door(); dd.root.position.set(0, 0, 0); dd.root.rotation.y = 0; dd.set(1); dd.light.visible = false; p.add(dd.root); this.othDoor = dd;
      this.boyBook = notebook(p, this.boyPage, 0, 0, 0, 0, 1.4); this.boyBook.visible = false; }
  }
  othDoor!: Door; doorD!: Drawn; girlFix!: Page; mural2!: THREE.Texture; mural1!: THREE.Texture; balloons: Drawn[] = []; bell!: THREE.Group; clockH!: THREE.Object3D; clockM!: THREE.Object3D; townCar!: Drawn; fun: Drawn[] = [];
  show(k: SetK) { for (const key of Object.keys(this.g) as SetK[]) this.g[key].visible = key === k; }
}
