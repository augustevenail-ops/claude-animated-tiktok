// « Les Pouvoirs Nuls » : village de montagne (chalets en bois sombre, volets rouges, toits pentus, sapins, mélèzes d'automne, rivière),
// forêt de nuit (rivière + pont, vieux chêne, buissons), cuisine du héros, classe. Effets : mètre carré de soleil, pluie, pigeons,
// lanternes, oreilles lumineuses du maire, cuillère volante, gâteau d'anniversaire, chat.
import * as THREE from "three";
import { ctex, hash, signTex } from "./tex";
import { V, M, P, E, rep, bx, cyl, plane, grp, room, desk, chair, add, stripesTex, woodTex, kidArtTex } from "./sets";

const R = (seed: number, k: number, a: number, b: number) => a + (b - a) * hash(seed, k);
const WOOD = ["#5a3822", "#4a2e1c", "#6a4428", "#553420", "#3e2618"];
const SHUT = ["#c8282e", "#b82228", "#d8343a", "#2a6a3a", "#c8282e"];
const plankTex = (col: string) => ctex("plank_" + col, 256, 256, (q) => { q.fillStyle = col; q.fillRect(0, 0, 256, 256);
  for (let r = 0; r < 10; r++) { const y = r * 25.6; q.fillStyle = `rgba(0,0,0,${0.05 + hash(r, 7) * 0.12})`; q.fillRect(0, y, 256, 25.6); q.fillStyle = "rgba(0,0,0,0.45)"; q.fillRect(0, y, 256, 2.5); q.fillStyle = "rgba(255,220,180,0.08)"; q.fillRect(0, y + 3, 256, 2);
    for (let k = 0; k < 5; k++) { q.strokeStyle = `rgba(20,10,0,${0.1 + hash(r * 5 + k, 3) * 0.12})`; q.beginPath(); q.moveTo(0, y + 6 + k * 4); q.bezierCurveTo(90, y + 4 + k * 4 + hash(k, r) * 5, 170, y + 8 + k * 4, 256, y + 6 + k * 4); q.stroke(); } } }, true);
const stoneBase = () => ctex("stbase", 256, 128, (q) => { q.fillStyle = "#8a8478"; q.fillRect(0, 0, 256, 128); for (let y = 0; y < 4; y++) for (let x = 0; x < 6; x++) { q.fillStyle = ["#a09a8c", "#948e80", "#aaa496", "#86807a"][(x * 3 + y) % 4]; q.beginPath(); q.roundRect(x * 44 + (y % 2) * 22 - 10, y * 32 + 2, 40, 28, 8); q.fill(); } }, true);
const shingle = () => ctex("shingleA", 128, 128, (q) => { q.fillStyle = "#3a3438"; q.fillRect(0, 0, 128, 128); for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { q.fillStyle = ["#46404a", "#3c363e", "#504a52", "#342e36"][(x + y * 3) % 4]; q.fillRect(x * 16 + (y % 2) * 8, y * 16, 15, 14); } }, true);
const earthTex = () => ctex("earthA", 256, 256, (q) => { q.fillStyle = "#8a7258"; q.fillRect(0, 0, 256, 256); for (let i = 0; i < 2600; i++) { q.fillStyle = `rgba(${hash(i, 1) > 0.5 ? "255,240,220" : "40,25,10"},${0.05 + hash(i, 2) * 0.08})`; q.fillRect(hash(i, 3) * 256, hash(i, 4) * 256, 2 + hash(i, 5) * 4, 2 + hash(i, 6) * 3); } }, true);
const meadowTex = () => ctex("meadowA", 256, 256, (q) => { q.fillStyle = "#6a8a3a"; q.fillRect(0, 0, 256, 256); for (let i = 0; i < 2600; i++) { q.fillStyle = `hsl(${60 + hash(i, 1) * 40},${40 + hash(i, 2) * 25}%,${28 + hash(i, 3) * 22}%)`; q.fillRect(hash(i, 4) * 256, hash(i, 5) * 256, 2, 5); }
  for (let i = 0; i < 160; i++) { q.fillStyle = ["#e8902a", "#d8582a", "#f2c040"][i % 3]; q.fillRect(hash(i, 8) * 256, hash(i, 9) * 256, 4, 3); } }, true);
const mossTex = () => ctex("mossA", 256, 256, (q) => { q.fillStyle = "#2e3a24"; q.fillRect(0, 0, 256, 256); for (let i = 0; i < 2400; i++) { q.fillStyle = `hsl(${80 + hash(i, 1) * 50},${25 + hash(i, 2) * 20}%,${12 + hash(i, 3) * 16}%)`; q.fillRect(hash(i, 4) * 256, hash(i, 5) * 256, 3, 3); }
  for (let i = 0; i < 220; i++) { q.fillStyle = ["#a8581a", "#8a3a1a", "#c88a2a"][i % 3]; q.fillRect(hash(i, 8) * 256, hash(i, 9) * 256, 4, 3); } }, true);
const skyAlp = () => ctex("skyAlp", 64, 512, (g) => { const gr = g.createLinearGradient(0, 0, 0, 512); gr.addColorStop(0, "#3a6ab0"); gr.addColorStop(0.5, "#86b0d8"); gr.addColorStop(0.85, "#f0d8b8"); gr.addColorStop(1, "#e8c090"); g.fillStyle = gr; g.fillRect(0, 0, 64, 512); });
const beamTex = () => ctex("beamGrad", 64, 256, (g) => { const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, "rgba(255,240,200,0.95)"); gr.addColorStop(0.6, "rgba(255,220,140,0.55)"); gr.addColorStop(1, "rgba(255,200,110,0.35)"); g.fillStyle = gr; g.fillRect(0, 0, 64, 256);
  const h = g.createLinearGradient(0, 0, 64, 0); h.addColorStop(0, "rgba(0,0,0,0.5)"); h.addColorStop(0.15, "rgba(0,0,0,0)"); h.addColorStop(0.85, "rgba(0,0,0,0)"); h.addColorStop(1, "rgba(0,0,0,0.5)"); g.globalCompositeOperation = "destination-out"; g.fillStyle = h; g.fillRect(0, 0, 64, 256); });
const glowTex = () => ctex("sqGlow", 128, 128, (g) => { const gr = g.createRadialGradient(64, 64, 10, 64, 64, 64); gr.addColorStop(0, "rgba(255,230,160,1)"); gr.addColorStop(0.6, "rgba(255,200,110,0.6)"); gr.addColorStop(1, "rgba(255,180,90,0)"); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); });

/** chalet : façade vers +z locale ; fenêtres = matériau lumineux partagé (allumé la nuit) */
const chalet = (p: THREE.Object3D, x: number, z: number, ry: number, w: number, floors: number, seed: number, winM: THREE.Material, sign?: { text: string; col: string }) => {
  const g = grp(p, x, 0, z, ry), D = 7, H = 1.1 + floors * 2.6, wc = WOOD[seed % WOOD.length], wm = M("#ffffff", 0.85, rep(plankTex(wc), w / 3, H / 3)), sm = M("#ffffff", 0.9, rep(stoneBase(), w / 3, 0.6));
  bx(g, w + 0.1, 1.1, D + 0.1, sm, 0, 0.55, 0, 0, 0.03); bx(g, w, H - 1.1, D, wm, 0, 1.1 + (H - 1.1) / 2, 0, 0, 0.02);
  // pignon + toit très pentu (débord)
  const rh = w * 0.62, sh = new THREE.Shape([new THREE.Vector2(-w / 2, 0), new THREE.Vector2(w / 2, 0), new THREE.Vector2(0, rh)]);
  const gab = add(g, new THREE.ExtrudeGeometry(sh, { depth: D, bevelEnabled: false }), wm, 0, H, -D / 2); gab.castShadow = true;
  const sl = Math.hypot(w / 2, rh) + 0.7, ang = Math.atan2(rh, w / 2), rm = M("#ffffff", 0.8, rep(shingle(), 3, 4));
  for (const s of [-1, 1]) { const r = bx(g, sl, 0.22, D + 1.4, rm, s * (w / 4 + 0.05), H + rh / 2 + 0.12, 0, 0, 0.04); r.rotation.z = -s * ang; }
  bx(g, 0.5, 1.6, 0.5, M("#8a8478", 0.9), w * 0.2, H + rh * 0.7, -1.2, 0, 0.03);
  // fenêtres + volets rouges, balcon à l'étage
  const shut = M(SHUT[seed % SHUT.length], 0.55), trim = M("#efe4cc", 0.7), nc = Math.max(2, Math.round(w / 2.6));
  for (let f = 0; f < floors; f++) for (let k = 0; k < nc; k++) { const cx = -w / 2 + (k + 0.5) * w / nc, cy = 1.1 + f * 2.6 + 1.35;
    if (f === 0 && k === Math.floor(nc / 2)) { bx(g, 1.2, 2.2, 0.12, P("#3a2216", 0.5), cx, 2.2, D / 2 + 0.02, 0, 0.03); bx(g, 1.5, 0.15, 0.2, trim, cx, 3.38, D / 2 + 0.06); add(g, new THREE.SphereGeometry(0.06, 8, 6), M("#d8b04a", 0.3, undefined, { metalness: 0.8 }), cx + 0.4, 2.1, D / 2 + 0.12);
      const lamp = add(g, new THREE.BoxGeometry(0.22, 0.3, 0.22), winM, cx + 0.95, 2.9, D / 2 + 0.2, 0, false); lamp.userData.noEdge = true; continue; }
    if (sign && f === 0) { plane(g, 1.9, 1.3, winM, cx, 2.1, D / 2 + 0.03); bx(g, 2.1, 0.1, 0.12, trim, cx, 1.42, D / 2 + 0.06); continue; }
    plane(g, 0.95, 1.2, winM, cx, cy, D / 2 + 0.03); bx(g, 1.15, 0.1, 0.22, trim, cx, cy - 0.65, D / 2 + 0.08); bx(g, 0.06, 1.2, 0.06, trim, cx, cy, D / 2 + 0.06); bx(g, 0.95, 0.06, 0.06, trim, cx, cy, D / 2 + 0.06);
    for (const s of [-1, 1]) bx(g, 0.5, 1.25, 0.06, shut, cx + s * 0.75, cy, D / 2 + 0.06, 0, 0.02);
    if (f >= 1) add(g, new THREE.BoxGeometry(0.9, 0.22, 0.25), M(["#e83a3a", "#ff6a8a", "#e8903a"][(seed + k) % 3], 0.7), cx, cy - 0.85, D / 2 + 0.2, 0, false); }
  if (floors >= 2) { const b = grp(g, 0, 1.1 + 2.6, D / 2); bx(b, w - 0.4, 0.14, 1.0, wm, 0, 0, 0.5); for (let i = 0; i < Math.round(w * 2.4); i++) bx(b, 0.12, 0.9, 0.05, M(wc, 0.8), -w / 2 + 0.4 + i / 2.4, 0.5, 0.98, 0, 0.01); bx(b, w - 0.4, 0.1, 0.12, M(wc, 0.8), 0, 0.98, 0.98); }
  if (sign) plane(g, Math.min(w - 1, 5), 0.8, M("#ffffff", 0.5, signTex("alp_" + sign.text, sign.text, sign.col, "#fff6e0", 1024, 160, 104)), 0, 3.6 + (floors >= 2 ? 0.0 : 0), D / 2 + 0.06 + (floors >= 2 ? 1.05 : 0));
  // bois empilé
  if (seed % 3 === 1) for (let i = 0; i < 12; i++) add(g, new THREE.CylinderGeometry(0.12, 0.12, 0.9, 8).rotateX(Math.PI / 2), M(["#a87a4a", "#8a5a32"][i % 2], 0.9), w / 2 + 0.25, 0.14 + Math.floor(i / 4) * 0.24, D / 2 - 1.2 - (i % 4) * 0.26);
  return g; };
const fir = (p: THREE.Object3D, x: number, z: number, s: number, seed: number, dark = false) => { const g = grp(p, x, 0, z); g.scale.setScalar(s); cyl(g, 0.12, 0.18, 1.2, M("#4a3222", 0.9), 0, 0.6, 0, 6);
  const c = dark ? ["#1a3a2a", "#20442e", "#163224"] : ["#2a5a3a", "#2e6440", "#244e34"]; for (let i = 0; i < 4; i++) { const k = add(g, new THREE.ConeGeometry(1.5 - i * 0.3, 1.9, 8), M(c[(i + seed) % 3], 0.85), 0, 1.5 + i * 1.0, 0, hash(seed, i) * 3); k.castShadow = true; } return g; };
const autumnTree = (p: THREE.Object3D, x: number, z: number, s: number, seed: number) => { const g = grp(p, x, 0, z); g.scale.setScalar(s); cyl(g, 0.14, 0.22, 2.2, M("#5a3e2a", 0.9), 0, 1.1, 0, 8);
  const col = ["#e8902a", "#d8582a", "#f2b030", "#c8402a"]; for (let i = 0; i < 5; i++) add(g, new THREE.IcosahedronGeometry(R(seed, i, 0.7, 1.1), 1), M(col[(i + seed) % 4], 0.8), R(seed, i + 9, -0.7, 0.7), 2.6 + R(seed, i + 19, 0, 1.2), R(seed, i + 29, -0.7, 0.7)); return g; };
const mountains = (p: THREE.Object3D, n: number, r0: number, seed: number) => { for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2 + hash(i, seed) * 0.3, r = r0 + hash(i, seed + 1) * 60, h = 60 + hash(i, seed + 2) * 70, rr = 45 + hash(i, seed + 3) * 30;
  const m = add(p, new THREE.ConeGeometry(rr, h, 7), M(["#5a6a88", "#66789a", "#4e5e7c"][i % 3], 0.95), Math.cos(a) * r, h / 2 - 6, Math.sin(a) * r, hash(i, 4), false); m.receiveShadow = false;
  add(p, new THREE.ConeGeometry(rr * 0.33, h * 0.33, 7), M("#f4f6fa", 0.7), Math.cos(a) * r, h - 6 - h * 0.165 + 0.5, Math.sin(a) * r, hash(i, 4), false); } };

/** mètre carré de soleil : petit nuage + colonne de lumière + carré lumineux au sol + projecteur */
export class Beam { root = new THREE.Group(); cloud = new THREE.Group(); col: THREE.Mesh; floor: THREE.Mesh; spot: THREE.SpotLight; pt: THREE.PointLight; colM: THREE.MeshBasicMaterial; floorM: THREE.MeshBasicMaterial; H = 3.2;
  constructor() { const g = this.root; g.add(this.cloud); const cm = M("#ffffff", 0.9, undefined, { emissive: "#c8d0e0", emissiveIntensity: 0.25 });
    for (let i = 0; i < 7; i++) add(this.cloud, new THREE.SphereGeometry(R(i, 1, 0.35, 0.55), 14, 10), cm, R(i, 2, -0.8, 0.8), R(i, 3, -0.1, 0.15), R(i, 4, -0.5, 0.5), 0, false);
    this.colM = new THREE.MeshBasicMaterial({ map: beamTex(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false, color: "#ffd890" });
    this.col = new THREE.Mesh(new THREE.BoxGeometry(1.25, 1, 1.25, 1, 1, 1).translate(0, -0.5, 0), this.colM); this.col.userData.noEdge = true; g.add(this.col);
    this.floorM = new THREE.MeshBasicMaterial({ map: glowTex(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, color: "#ffc870" });
    this.floor = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 2.2).rotateX(-Math.PI / 2), this.floorM); this.floor.userData.noEdge = true; g.add(this.floor);
    this.spot = new THREE.SpotLight("#ffd890", 0, 12, 0.32, 0.5, 1.2); this.spot.castShadow = true; this.spot.shadow.mapSize.set(1024, 1024); this.spot.shadow.bias = -0.0005; g.add(this.spot, this.spot.target);
    this.pt = new THREE.PointLight("#ffc070", 0, 5, 1.6); g.add(this.pt); g.visible = false; }
  /** p = point au sol (monde), k = ouverture 0..1, cloudK = nuage 0..1, H = hauteur du nuage, power = intensité */
  set(p: THREE.Vector3, k: number, t: number, H = 3.2, cloudK = 1, power = 1) { const g = this.root; g.visible = cloudK > 0.01 || k > 0.01; g.position.copy(p);
    this.cloud.position.set(Math.sin(t * 0.8) * 0.04, H + 0.15, 0); this.cloud.scale.setScalar(Math.max(0.001, cloudK)); this.cloud.rotation.y = t * 0.1;
    const kk = Math.max(0.001, k); this.col.position.y = H; this.col.scale.set(1, H * kk, 1); this.col.visible = k > 0.01; this.colM.opacity = 0.5 * Math.min(1, k * 1.5) * power;
    this.floor.position.y = 0.02; this.floor.visible = k > 0.5; this.floorM.opacity = Math.min(1, (k - 0.5) * 2) * 0.8 * power;
    this.spot.position.set(0, H, 0); this.spot.target.position.set(0, 0, 0); this.spot.intensity = 70 * Math.min(1, k * 1.2) * power; this.spot.distance = H + 3;
    this.pt.position.set(0, 1.0, 0); this.pt.intensity = 3.5 * k * power; } }

/** pluie : traits instanciés autour d'un centre, avec une zone sèche (le carré de soleil) */
export class Rain { im: THREE.InstancedMesh; private d = new THREE.Object3D(); n: number;
  constructor(parent: THREE.Object3D, n = 3200) { this.n = n; this.im = new THREE.InstancedMesh(new THREE.BoxGeometry(0.012, 0.55, 0.012), new THREE.MeshBasicMaterial({ color: "#b8cce8", transparent: true, opacity: 0.4, depthWrite: false }), n);
    this.im.frustumCulled = false; this.im.userData.noEdge = true; this.im.castShadow = false; this.im.count = 0; parent.add(this.im); }
  set(t: number, c: THREE.Vector3 | null, size = 14, dry?: { p: THREE.Vector3; r: number }, dens = 1) { if (!c) { this.im.count = 0; return; } const d = this.d, H = 9; let k = 0;
    for (let i = 0; i < this.n * dens; i++) { const x = c.x + (hash(i, 1) - 0.5) * size * 2, z = c.z + (hash(i, 2) - 0.5) * size * 2, y = c.y - 2 + ((H - ((t * 13 + hash(i, 3) * H) % H)) );
      if (dry && Math.abs(x - dry.p.x) < dry.r && Math.abs(z - dry.p.z) < dry.r && y < dry.p.y + 3.6) continue;
      if (y < 0) continue; d.position.set(x, y, z); d.rotation.set(0.12, 0, 0.05); d.updateMatrix(); this.im.setMatrixAt(k++, d.matrix); }
    this.im.count = k; this.im.instanceMatrix.needsUpdate = true; } }

/** pigeons instanciés (corps, tête, deux ailes battantes) */
export type Pig = { p: THREE.Vector3; yaw: number; fly: number };
export class Pigeons { meshes: THREE.InstancedMesh[] = []; private d = new THREE.Object3D(); n: number;
  constructor(parent: THREE.Object3D, n = 110) { this.n = n; const grey = M("#8a94aa", 0.7), dark = M("#5a6278", 0.7);
    const body = new THREE.SphereGeometry(0.11, 10, 8).scale(0.85, 0.8, 1.5), head = new THREE.SphereGeometry(0.065, 8, 6).translate(0, 0.1, 0.15), beak = new THREE.ConeGeometry(0.02, 0.06, 5).rotateX(Math.PI / 2).translate(0, 0.095, 0.24);
    const wL = new THREE.BoxGeometry(0.26, 0.015, 0.14).translate(-0.13, 0, 0), wR = new THREE.BoxGeometry(0.26, 0.015, 0.14).translate(0.13, 0, 0);
    for (const [g, m] of [[body, grey], [head, dark], [beak, M("#e8a83a", 0.5)], [wL, dark], [wR, dark]] as [THREE.BufferGeometry, THREE.Material][]) { const im = new THREE.InstancedMesh(g, m, n); im.frustumCulled = false; im.userData.noEdge = true; im.castShadow = true; im.count = 0; parent.add(im); this.meshes.push(im); } }
  set(t: number, arr: Pig[]) { const d = this.d, n = Math.min(arr.length, this.n);
    for (let i = 0; i < n; i++) { const a = arr[i], fl = a.fly, flap = fl > 0 ? Math.sin(t * 26 + i) * 0.9 * fl : 0, hop = fl > 0 ? 0 : Math.max(0, Math.sin(t * 3 + i * 1.7)) * 0.03, peck = fl > 0 ? 0 : Math.max(0, Math.sin(t * 2.3 + i)) * 0.4;
      for (let m = 0; m < 5; m++) { d.position.set(a.p.x, a.p.y + 0.09 + hop, a.p.z); const fold = fl > 0 ? 0 : 1.5; d.rotation.set(m === 1 || m === 2 ? peck : 0, a.yaw + (m === 3 ? -fold : m === 4 ? fold : 0), m === 3 ? -flap : m === 4 ? flap : 0, "YXZ"); d.scale.setScalar(0.8); d.updateMatrix(); this.meshes[m].setMatrixAt(i, d.matrix); } }
    for (const m of this.meshes) { m.count = n; m.instanceMatrix.needsUpdate = true; } } }

/** étiquette flottante (police adaptée à la longueur) */
export const label = (text: string, col: string, w = 2.4) => { const t = ctex("lab_" + text, 1024, 192, (q) => { q.clearRect(0, 0, 1024, 192); let fs = 120; q.font = `900 ${fs}px Montserrat, 'DejaVu Sans', sans-serif`; while (q.measureText(text).width > 960 && fs > 30) { fs -= 4; q.font = `900 ${fs}px Montserrat, 'DejaVu Sans', sans-serif`; }
    q.textAlign = "center"; q.textBaseline = "middle"; q.lineWidth = Math.max(8, fs * 0.15); q.lineJoin = "round"; q.strokeStyle = "#1a1420"; q.strokeText(text, 512, 100); q.fillStyle = col; q.fillText(text, 512, 100); });
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthTest: false, fog: false, toneMapped: false })); s.scale.set(w, w * 0.1875, 1); s.renderOrder = 20; s.visible = false; return s; };

export class Med {
  suns: [THREE.DirectionalLight, number][] = []; hemis: [THREE.HemisphereLight, number][] = []; skies: THREE.MeshBasicMaterial[] = []; labels: Record<string, THREE.Sprite> = {};
  winM!: THREE.MeshStandardMaterial; beam = new Beam(); rain!: Rain; pigs!: Pigeons; lanterns: THREE.Group[] = []; cat!: THREE.Group; catTail!: THREE.Group; spoon!: THREE.Group; flames: THREE.Mesh[] = []; cakeL!: THREE.PointLight;
  sparks!: THREE.InstancedMesh; bushLou!: THREE.Group; step!: THREE.Mesh; boardM!: THREE.MeshStandardMaterial;
  constructor(g: Record<string, THREE.Group>, root: THREE.Object3D) {
    for (const [k, t, c] of [["dix", "10 ans", "#ffd21a"], ["nul", "pouvoir : NUL", "#ff5a5a"], ["atch", "ATCHOUM !", "#ffffff"], ["atch2", "ATCHOUM !", "#ffffff"], ["rrou", "« Rrrou. »", "#ffffff"], ["lampa", "« LAMPADAIRE »", "#ffd21a"],
      ["chene", "« Le vieux chêne. »", "#ffffff"], ["riv", "« Derrière la rivière. »", "#ffffff"], ["ronron", "rrrrr…", "#ffd890"]] as [string, string, string][]) { const l = label(t, c); root.add(l); this.labels[k] = l; }
    root.add(this.beam.root); this.rain = new Rain(root); this.pigs = new Pigeons(root);
    this.winM = new THREE.MeshStandardMaterial({ color: "#2a2018", emissive: "#ffb456", emissiveIntensity: 0.3, roughness: 0.3 });
    const sun = (p: THREE.Group, pos: THREE.Vector3, i: number, size: number, hi = 1.0, col = "#fff0d8", hs = "#cfe0ff", hg = "#c8a878") => { const s = new THREE.DirectionalLight(col, i); this.suns.push([s, i]); s.position.copy(pos); s.target.position.set(0, 0, 0); s.castShadow = true; s.shadow.mapSize.set(2048, 2048);
      const c = s.shadow.camera; c.left = c.bottom = -size; c.right = c.top = size; c.near = 0.5; c.far = 160; s.shadow.bias = -0.0004; s.shadow.normalBias = 0.02; s.shadow.radius = 4; p.add(s, s.target); const h = new THREE.HemisphereLight(hs, hg, hi); this.hemis.push([h, hi]); p.add(h); };
    const sky = (p: THREE.Group) => { const mm = new THREE.MeshBasicMaterial({ map: skyAlp(), side: THREE.BackSide, fog: false }); this.skies.push(mm); const m = new THREE.Mesh(new THREE.SphereGeometry(300, 32, 16), mm); m.userData.noEdge = true; p.add(m); };
    // lanternes (portées par les chercheurs)
    for (let i = 0; i < 10; i++) { const l = new THREE.Group(); root.add(l); const fr = M("#2a2420", 0.5, undefined, { metalness: 0.5 }); bx(l, 0.22, 0.04, 0.22, fr, 0, 0.17, 0); bx(l, 0.22, 0.04, 0.22, fr, 0, -0.17, 0);
      add(l, new THREE.BoxGeometry(0.17, 0.3, 0.17), E("#ffb040", 3.2), 0, 0, 0, 0, false).userData.noEdge = true; add(l, new THREE.TorusGeometry(0.07, 0.012, 6, 12, Math.PI), fr, 0, 0.22, 0);
      if (i < 6) { const pl = new THREE.PointLight("#ffa040", 4, 7, 1.6); l.add(pl); } l.visible = false; this.lanterns.push(l); }
    // chat roux
    { const c = new THREE.Group(); root.add(c); this.cat = c; const fur = M("#e8862a", 0.75), wh = M("#fff4e8", 0.75); bx(c, 0.22, 0.2, 0.46, fur, 0, 0.24, 0, 0, 0.08); bx(c, 0.22, 0.2, 0.2, fur, 0, 0.4, 0.26, 0, 0.07); bx(c, 0.12, 0.08, 0.04, wh, 0, 0.36, 0.37, 0, 0.02);
      for (const x of [-0.07, 0.07]) { add(c, new THREE.ConeGeometry(0.045, 0.1, 4), fur, x, 0.54, 0.26); add(c, new THREE.SphereGeometry(0.022, 6, 5), M("#2a3a1a", 0.3, undefined, { emissive: "#7ad83a", emissiveIntensity: 0.6 }), x, 0.43, 0.365); }
      for (const [x, z] of [[-0.07, 0.16], [0.07, 0.16], [-0.07, -0.16], [0.07, -0.16]]) bx(c, 0.06, 0.16, 0.06, fur, x, 0.08, z, 0, 0.02);
      const tl = new THREE.Group(); tl.position.set(0, 0.3, -0.22); c.add(tl); this.catTail = tl; add(tl, new THREE.CylinderGeometry(0.025, 0.03, 0.4, 6).translate(0, 0.2, 0), fur, 0, 0, 0); tl.rotation.x = -0.6; c.visible = false; }
    // étincelles (pouvoir reçu)
    { this.sparks = new THREE.InstancedMesh(new THREE.OctahedronGeometry(0.05), E("#ffe08a", 4), 60); this.sparks.frustumCulled = false; this.sparks.userData.noEdge = true; this.sparks.count = 0; root.add(this.sparks); }

    // ================= village de montagne (rue est-ouest)
    { const p = g.VILLE; sun(p, V(-30, 34, 26), 2.6, 46, 0.9, "#ffe4c0"); sky(p); mountains(p, 14, 170, 3);
      plane(p, 420, 420, M("#ffffff", 0.95, rep(meadowTex(), 90, 90)), 0, -0.02, 0, -Math.PI / 2);
      plane(p, 150, 7.5, M("#ffffff", 0.95, rep(earthTex(), 40, 2)), -40, 0.005, 0, -Math.PI / 2);
      for (const s of [-1, 1]) bx(p, 110, 0.14, 1.4, M("#a09888", 0.85), -20, 0.07, s * 4.4, 0, 0.02);
      const ws = [7.5, 8, 7, 9, 7.5, 8.5];
      for (const side of [-1, 1]) { let x = -56, k = side > 0 ? 2 : 0; while (x < 30) { const w = ws[k % ws.length], cx = x + w / 2;
          const sign = side > 0 && Math.abs(cx + 12.5) < 1 ? { text: "BOULANGERIE", col: "#8a2a1a" } : side > 0 && Math.abs(cx - 19.25) < 1 ? { text: "MAIRIE", col: "#1f3a6a" } : undefined;
          chalet(p, cx, side * 9.2, side < 0 ? 0 : Math.PI, w - 0.3, sign?.text === "MAIRIE" ? 3 : 1 + ((k + (side > 0 ? 1 : 0)) % 3 === 0 ? 0 : 1), k * 5 + (side > 0 ? 3 : 1), this.winM, sign); x += w; k++; } }
      // marche devant la porte du héros (x -4) + horloge de la mairie
      this.step = bx(p, 1.6, 0.34, 0.9, M("#9a9488", 0.9), -4.75, 0.17, -5.15, 0, 0.03);
      { const ck = grp(p, 19.25, 9.4, 5.78); add(ck, new THREE.CylinderGeometry(0.7, 0.7, 0.12, 28).rotateX(Math.PI / 2), M("#fffaf0", 0.4), 0, 0, 0); add(ck, new THREE.TorusGeometry(0.7, 0.08, 8, 28), P("#1f3a6a", 0.3), 0, 0, 0.05); bx(ck, 0.06, 0.5, 0.03, M("#222", 0.5), 0, 0.2, 0.08, 0, 0.01); }
      // banc + fontaine en bois (Madame Rose)
      { const b = grp(p, -8, 0, 5.2, Math.PI); const wd = M("#7a4a2a", 0.8); bx(b, 2.0, 0.08, 0.5, wd, 0, 0.48, 0); bx(b, 2.0, 0.45, 0.06, wd, 0, 0.78, -0.24); for (const x of [-0.85, 0.85]) bx(b, 0.08, 0.48, 0.45, M("#2a2a30", 0.5), x, 0.24, 0); }
      { const f = grp(p, -1, 0, 4.8); bx(f, 2.2, 0.7, 1.0, M("#6a4428", 0.85, rep(plankTex("#6a4428"), 1, 0.4)), 0, 0.35, 0, 0, 0.04); plane(f, 2.0, 0.85, new THREE.MeshPhysicalMaterial({ color: "#5a9ac8", roughness: 0.05, clearcoat: 1 }), 0, 0.68, 0, -Math.PI / 2); cyl(f, 0.08, 0.1, 1.4, M("#5a3a24", 0.8), 0.9, 1.0, 0, 8); }
      // arbres : mélèzes dorés et érables le long de la rue, sapins derrière les chalets
      for (let x = -52; x <= 26; x += 11) { autumnTree(p, x + 2, 4.9, 0.95, x + 100); if (Math.abs(x + 7.5 - 10.5) > 2 && Math.abs(x + 7.5 + 4.75) > 2) autumnTree(p, x + 7.5, -4.9, 0.9, x + 200); }
      for (let i = 0; i < 70; i++) { const x = -70 + hash(i, 1) * 110, zs = hash(i, 2) > 0.5 ? 1 : -1, z = zs * (15 + hash(i, 3) * 30); fir(p, x, z, 1.6 + hash(i, 4) * 1.4, i); }
      // rivière + pont de bois, forêt au-delà
      plane(p, 7, 300, new THREE.MeshPhysicalMaterial({ color: "#3a6a98", roughness: 0.08, clearcoat: 1, emissive: "#0a1a2a", emissiveIntensity: 0.3 }), 38, 0.02, 0, -Math.PI / 2);
      for (const s of [-1, 1]) bx(p, 1.2, 0.5, 300, M("#7a7468", 0.9), 38 + s * 4.1, 0.15, 0, 0, 0.05);
      { const b = grp(p, 38, 0, 0); const wd = M("#6a4428", 0.85, rep(plankTex("#6a4428"), 2, 1)); bx(b, 9.6, 0.25, 3.4, wd, 0, 0.55, 0, 0, 0.03); for (const s of [-1, 1]) { bx(b, 9.6, 0.12, 0.12, wd, 0, 1.45, s * 1.6); for (let i = 0; i < 9; i++) bx(b, 0.14, 0.95, 0.14, wd, -4.4 + i * 1.1, 1.0, s * 1.6, 0, 0.02); } }
      for (let i = 0; i < 80; i++) { const x = 46 + hash(i, 5) * 50, z = (hash(i, 6) - 0.5) * 120; if (Math.abs(z) < 4) continue; fir(p, x, z, 1.8 + hash(i, 7) * 1.6, i + 300, true); }
      // lampadaires anciens (lumière chaude la nuit)
      for (let x = -48; x <= 28; x += 16) { const l = grp(p, x, 0, -4.4); cyl(l, 0.06, 0.08, 3.4, M("#1c1c22", 0.5, undefined, { metalness: 0.6 }), 0, 1.7, 0, 8); add(l, new THREE.BoxGeometry(0.3, 0.4, 0.3), this.winM, 0, 3.5, 0, 0, false).userData.noEdge = true; }
    }

    // ================= forêt de nuit : rivière + pont (z = 0), sentier, vieux chêne (0, -16), buissons
    { const p = g.PL; sun(p, V(20, 40, -10), 1.0, 40, 0.5, "#8aa0d8", "#5a6a9a", "#2a2a24");
      sky(p); mountains(p, 12, 170, 9);
      plane(p, 420, 420, M("#ffffff", 0.95, rep(mossTex(), 80, 80)), 0, -0.02, 0, -Math.PI / 2);
      plane(p, 3.2, 50, M("#ffffff", 0.95, rep(earthTex(), 1, 14)), 0, 0.008, 9, -Math.PI / 2);
      plane(p, 3.2, 9, M("#ffffff", 0.95, rep(earthTex(), 1, 3)), 0, 0.008, -7.5, -Math.PI / 2);
      plane(p, 300, 4.5, new THREE.MeshPhysicalMaterial({ color: "#1a3048", roughness: 0.06, clearcoat: 1, emissive: "#0a1420", emissiveIntensity: 0.4 }), 0, 0.02, 0, -Math.PI / 2);
      for (const s of [-1, 1]) for (let i = 0; i < 40; i++) add(p, new THREE.DodecahedronGeometry(R(i, s + 3, 0.3, 0.7), 0), M("#5a5a58", 0.9), -40 + i * 2 + hash(i, s) * 1.5, 0.1, s * (2.5 + hash(i, s + 7) * 0.6));
      { const b = grp(p, 0, 0, 0, Math.PI / 2); const wd = M("#5a3a24", 0.85, rep(plankTex("#5a3a24"), 2, 1)); bx(b, 7, 0.22, 2.4, wd, 0, 0.45, 0, 0, 0.03); for (const s of [-1, 1]) { bx(b, 7, 0.1, 0.1, wd, 0, 1.3, s * 1.15); for (let i = 0; i < 7; i++) bx(b, 0.12, 0.9, 0.12, wd, -3 + i * 1.0, 0.85, s * 1.15, 0, 0.02); } }
      // vieux chêne
      { const o = grp(p, 0, 0, -16); const bark = M("#3e2c20", 0.95); cyl(o, 0.75, 1.1, 5.2, bark, 0, 2.6, 0, 12);
        for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2, br = add(o, new THREE.CylinderGeometry(0.22, 0.38, 4, 8).translate(0, 2, 0), bark, Math.cos(a) * 0.5, 4.6, Math.sin(a) * 0.5); br.rotation.set(Math.sin(a) * 0.8, 0, -Math.cos(a) * 0.8); }
        for (const [x, z] of [[1.4, 0], [-1.4, 0], [0, 1.4], [0, -1.4]]) { const r = add(o, new THREE.CylinderGeometry(0.15, 0.35, 2.2, 6).translate(0, 1.1, 0), bark, x * 0.5, 0, z * 0.5); r.rotation.set(z * 0.9, 0, -x * 0.9); }
        for (let i = 0; i < 16; i++) add(o, new THREE.IcosahedronGeometry(R(i, 1, 1.6, 2.6), 1), M(["#3a4a24", "#5a5a22", "#7a5a1e", "#4a3a1a"][i % 4], 0.85), R(i, 2, -4.5, 4.5), R(i, 3, 6.5, 9.5), R(i, 4, -4.5, 4.5)); }
      // buissons autour du chêne (Lou dans celui en (2.4, -12.6))
      const bush = (x: number, z: number, s: number, seed: number) => { const b = grp(p, x, 0, z); b.scale.setScalar(s); for (let i = 0; i < 6; i++) add(b, new THREE.IcosahedronGeometry(R(seed, i, 0.45, 0.75), 1), M(["#24361e", "#2c4024", "#3a3a1c"][(i + seed) % 3], 0.85), R(seed, i + 5, -0.7, 0.7), R(seed, i + 9, 0.3, 0.8), R(seed, i + 13, -0.6, 0.6)); return b; };
      for (let i = 0; i < 18; i++) { const a = -Math.PI * 0.05 - i / 18 * Math.PI * 1.1, r = 3.6 + hash(i, 3) * 1.6, x = Math.cos(a) * r, z = -16 - Math.sin(a) * r; if (Math.hypot(x - 2.4, z + 12.6) < 1.4) continue; bush(x, z, 0.9 + hash(i, 4) * 0.5, i); }
      { const b = grp(p, 2.4, 0, -12.6); this.bushLou = b; for (let i = 0; i < 5; i++) { const a = -0.6 + i * 0.55; add(b, new THREE.IcosahedronGeometry(0.55, 1), M(["#24361e", "#2c4024"][i % 2], 0.85), Math.sin(a) * 0.75, 0.45 + (i % 2) * 0.2, -Math.cos(a) * 0.75 + 0.05); } }
      // sapins (hors sentier, rivière et clairière)
      for (let i = 0; i < 260; i++) { const x = (hash(i, 11) - 0.5) * 80, z = -50 + hash(i, 12) * 90; if (Math.abs(x) < 3.4 && z > -12) continue; if (Math.hypot(x, z + 16) < 8.5) continue; if (Math.abs(z) < 3.4) continue; if (z > 30 && Math.abs(x) < 14) continue; fir(p, x, z, 1.4 + hash(i, 13) * 1.6, i + 500, true); }
      // lisière : chalets éclairés du village (z ≈ 44)
      for (let i = 0; i < 4; i++) chalet(p, -12 + i * 8.5, 46, Math.PI, 7.5, 2, 40 + i, this.winM);
      plane(p, 40, 8, M("#ffffff", 0.95, rep(earthTex(), 10, 2)), 0, 0.006, 40, -Math.PI / 2);
    }

    // ================= cuisine du héros (gâteau, cuillère)
    { const p = g.MAI; sun(p, V(-4, 6, 6), 1.6, 7, 0.75, "#ffe8c8");
      room(p, 7, 6, 3.0, M("#ffffff", 0.85, rep(plankTex("#b07a48"), 3, 1.3)), M("#ffffff", 0.7, rep(woodTex("#8a5a32"), 4, 4)), M("#e8d4b4", 0.9));
      bx(p, 2.8, 0.08, 1.3, M("#ffffff", 0.6, rep(woodTex("#a8784a"), 2, 1)), 0, 0.8, -0.6, 0, 0.02); for (const [x, z] of [[-1.25, -1.1], [1.25, -1.1], [-1.25, -0.1], [1.25, -0.1]]) bx(p, 0.1, 0.8, 0.1, M("#6a4428", 0.7), x, 0.4, z, 0, 0.02);
      plane(p, 2.6, 1.1, M("#ffffff", 0.7, rep(stripesTex("#e84a3a", "#fff4e8", 10), 2, 1)), 0, 0.845, -0.6, -Math.PI / 2);
      // gâteau + bougies
      { const c = grp(p, 0, 0.85, -0.6); cyl(c, 0.32, 0.32, 0.22, M("#fff0e0", 0.6), 0, 0.11, 0, 28); cyl(c, 0.33, 0.33, 0.05, M("#ff7aa8", 0.5), 0, 0.2, 0, 28); cyl(c, 0.42, 0.42, 0.02, M("#f4f4f4", 0.4), 0, 0.01, 0, 28);
        for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2, x = Math.cos(a) * 0.22, z = Math.sin(a) * 0.22; cyl(c, 0.012, 0.012, 0.12, M(["#40b8f0", "#ffd21a", "#ff5a7a"][i % 3], 0.5), x, 0.28, z, 6); const f = add(c, new THREE.ConeGeometry(0.02, 0.06, 6), E("#ffb040", 4), x, 0.37, z, 0, false); f.userData.noEdge = true; this.flames.push(f); }
        this.cakeL = new THREE.PointLight("#ffa040", 2.5, 4, 1.6); this.cakeL.position.set(0, 0.6, 0); c.add(this.cakeL); }
      // cuillère (pouvoir de la sœur)
      { const s = grp(p, -0.6, 1.2, -0.5); this.spoon = s; const st = M("#d8dce4", 0.18, undefined, { metalness: 1 }); add(s, new THREE.SphereGeometry(0.035, 12, 8).scale(1, 0.35, 1.4), st, 0, 0, 0.06); bx(s, 0.012, 0.008, 0.13, st, 0, 0.004, -0.04, 0, 0.003); }
      // fenêtre (vue montagne), étagères, bocaux, guirlande d'anniversaire
      const view = ctex("alpView", 512, 320, (q) => { const gr = q.createLinearGradient(0, 0, 0, 320); gr.addColorStop(0, "#5a8ac8"); gr.addColorStop(1, "#f0d8b0"); q.fillStyle = gr; q.fillRect(0, 0, 512, 320); q.fillStyle = "#6a7a98"; q.beginPath(); q.moveTo(0, 260); q.lineTo(120, 90); q.lineTo(230, 220); q.lineTo(340, 60); q.lineTo(512, 240); q.lineTo(512, 320); q.lineTo(0, 320); q.fill();
        q.fillStyle = "#f4f6fa"; q.beginPath(); q.moveTo(95, 120); q.lineTo(120, 90); q.lineTo(145, 120); q.fill(); q.beginPath(); q.moveTo(310, 100); q.lineTo(340, 60); q.lineTo(372, 100); q.fill(); q.fillStyle = "#2a5a3a"; for (let i = 0; i < 18; i++) { const x = i * 30, h = 40 + hash(i, 2) * 30; q.beginPath(); q.moveTo(x, 320); q.lineTo(x + 14, 320 - h); q.lineTo(x + 28, 320); q.fill(); } });
      plane(p, 2.0, 1.3, new THREE.MeshBasicMaterial({ map: view }), 2.0, 1.8, -2.97); for (const s of [-1, 1]) bx(p, 0.55, 1.4, 0.06, M("#c8282e", 0.5), 2.0 + s * 1.3, 1.8, -2.94, 0, 0.02); bx(p, 2.2, 0.1, 0.25, M("#efe4cc", 0.6), 2.0, 1.1, -2.9);
      bx(p, 2.4, 0.06, 0.35, M("#6a4428", 0.7), -2.0, 1.9, -2.8, 0, 0.02); for (let i = 0; i < 5; i++) cyl(p, 0.1, 0.1, 0.26, M(["#e8902a", "#c8282e", "#f2c040", "#7aa84a", "#e8e0d0"][i], 0.4), -2.8 + i * 0.4, 2.06, -2.8, 12);
      for (let i = 0; i < 14; i++) { const x = -3.0 + i * 0.46, y = 2.75 - Math.sin((i + 0.5) / 14 * Math.PI) * 0.35; const fl = add(p, new THREE.ConeGeometry(0.1, 0.2, 3).rotateX(Math.PI), M(["#ff5a7a", "#ffd21a", "#40b8f0", "#7cd87a"][i % 4], 0.6), x, y, -2.92, 0, false); fl.scale.z = 0.2; }
      const l = new THREE.PointLight("#ffe0b0", 4, 9, 1.6); l.position.set(0, 2.7, 0.4); p.add(l); }

    // ================= classe (bois clair, tableau « nos pouvoirs »)
    { const p = g.CL2; sun(p, V(8, 6, 2), 1.8, 7, 0.7, "#e8ecf4");
      room(p, 8.4, 7.4, 3.0, M("#ffffff", 0.9, rep(plankTex("#c8a070"), 4, 1.3)), M("#ffffff", 0.6, rep(woodTex("#a87a4a"), 4, 4)), M("#efe0c8", 0.9));
      this.boardM = M("#ffffff", 0.9, ctex("pouvBoard", 1024, 400, (q) => { q.fillStyle = "#1f3a2a"; q.fillRect(0, 0, 1024, 400); q.fillStyle = "#f6f4ec"; q.font = "bold 76px 'Comic Sans MS', 'DejaVu Sans', cursive"; q.textAlign = "center"; q.fillText("Nos pouvoirs", 512, 96);
        q.font = "bold 50px 'Comic Sans MS', 'DejaVu Sans', cursive"; q.textAlign = "left"; ["Éternuer  ✓", "Pigeons  ✓", "Cuillère  ✓"].forEach((n, i) => q.fillText(n, 110, 190 + i * 70)); ["Oreilles  ✓", "Soleil  ???"].forEach((n, i) => q.fillText(n, 600, 190 + i * 70)); }));
      plane(p, 4.2, 1.6, this.boardM, -0.3, 1.75, -3.67); bx(p, 4.4, 1.8, 0.04, M("#6a4428", 0.5), -0.3, 1.75, -3.7);
      const win = new THREE.MeshPhysicalMaterial({ color: "#c8d8e8", roughness: 0.05, emissive: "#a8b8d0", emissiveIntensity: 0.55 }); for (let i = 0; i < 3; i++) plane(p, 1.6, 1.4, win, 4.18, 1.7, -2.2 + i * 2.2, 0, -Math.PI / 2);
      for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) { const x = -2.6 + c * 1.5, z = -0.6 + r * 1.35; desk(p, x, z, 0, "#d8b888", "#8a5a32"); chair(p, x, z + 0.48, Math.PI, ["#c8282e", "#2a6a3a", "#e8902a"][(r + c) % 3]); }
      const td = desk(p, 2.2, -2.6, 0, "#a8784a", "#5a3a2a"); td.scale.set(1.6, 1, 1.2);
      for (let i = 0; i < 6; i++) plane(p, 0.42, 0.52, M("#ffffff", 0.7, kidArtTex(i + 7)), -3.2 + i * 1.15, 2.3, 3.68, 0, Math.PI);
      for (const [x, z] of [[-1.5, -1.5], [1.5, -1.5], [-1.5, 1.5], [1.5, 1.5]]) plane(p, 1.2, 0.5, E("#fff6e8", 1.2), x, 2.99, z, Math.PI / 2);
      const l1 = new THREE.PointLight("#fff2e0", 4, 10, 1.6); l1.position.set(-1, 2.8, 0); p.add(l1); }
  }
  /** étincelles autour d'un point */
  setSparks(t: number, c: THREE.Vector3 | null, k = 1) { const im = this.sparks; if (!c || k <= 0) { im.count = 0; return; } const d = new THREE.Object3D();
    for (let i = 0; i < 60; i++) { const a = t * (1.5 + hash(i, 1)) + hash(i, 2) * 6.28, r = 0.4 + hash(i, 3) * 0.5, y = ((t * 0.6 + hash(i, 4)) % 1) * 1.8;
      d.position.set(c.x + Math.cos(a) * r, c.y + y, c.z + Math.sin(a) * r); d.rotation.set(t * 3 + i, t * 2, 0); d.scale.setScalar(k * (0.6 + 0.6 * Math.sin(t * 9 + i) ** 2)); d.updateMatrix(); im.setMatrixAt(i, d.matrix); }
    im.count = 60; im.instanceMatrix.needsUpdate = true; }
}
