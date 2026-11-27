// « Notre Château » ép. 1 : un seul grand monde (unités ≈ mètres, adulte ≈ 2,2 u).
// Plateau du château au centre (hauteur PH), château évolutif en 5 étapes (tour de bois → grand château + bourg, palissade faible),
// collines au nord (z < 0), armée noire derrière les collines, trois villages brûlés, muraille-hologramme dorée (Drawn).
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { ctex, hash, stoneTex, roofTex } from "./tex";
import { M, E, rep } from "./kit";
import { Drawn } from "./magic";
import { Actor, Spec } from "./chars";

export const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const sm = (x: number) => { const t = Math.min(1, Math.max(0, x)); return t * t * (3 - 2 * t); };
const cl = (x: number) => Math.min(1, Math.max(0, x));
const back = (x: number) => { const t = cl(x), c = 1.9; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };

// ------------------------------------------------------------ terrain
export const PH = 12;            // hauteur du plateau
export const AZ = -560;          // premier rang de l'armée
export const RIDGE = -330;       // ligne des collines
// relief : plateau du château, collines roulantes, crête au nord (derrière laquelle arrive l'armée), plaine du nord plate,
// chaîne de montagnes enneigées à l'ouest, lac + rivière au sud-ouest, forêt à l'est, champs au sud.
const ridged = (x: number, z: number) => { let a = 0, f = 0.0045, w = 1; for (let o = 0; o < 4; o++) { a += w * (1 - Math.abs(Math.sin(x * f + o * 1.7) * Math.cos(z * f * 1.13 - o * 0.9))); f *= 2.03; w *= 0.48; } return a; };
export const MOUNT = (x: number, z: number) => sm((-x - 330) / 380) * (0.55 + 0.45 * sm((-x - 330) / 160));
export const LAKE = V(-210, 0, 260);
const riverD = (x: number, z: number) => { const rz = 260 + 90 * Math.sin((x + 210) * 0.008) - 0.1 * (x + 210); return x > -230 ? Math.abs(z - rz) : 1e9; };
export const H = (x: number, z: number) => {
  const r = Math.hypot(x, z);
  const plateau = PH * (1 - sm((r - 82) / 70));
  const far = sm((r - 150) / 120) * (z < -420 && Math.abs(x) < 420 ? 0.15 : 1);
  const roll = far * (4.5 * Math.sin(x * 0.013 + 1) * Math.cos(z * 0.011) + 2.5 * Math.sin(x * 0.031 + z * 0.027 + 2) + 1.2 * Math.sin(x * 0.07 - z * 0.05));
  const ridge = 17 * Math.exp(-(((z - RIDGE) / 48) ** 2)) * (0.72 + 0.28 * Math.sin(x * 0.017 + 0.6)) * sm((Math.abs(x) - 10) / 60 + 1);
  const mnt = MOUNT(x, z) * (110 + 210 * ridged(x, z) * (0.6 + 0.4 * Math.sin(z * 0.0021 + 1.3)));
  const hillsE = sm((x - 260) / 300) * 26 * (0.5 + 0.5 * Math.sin(z * 0.006 + x * 0.004));
  const lk = Math.hypot(x - LAKE.x, (z - LAKE.z) * 1.3), lm = 1 - sm((lk - 60) / 45);
  const rm = (1 - sm((riverD(x, z) - 6) / 12)) * sm((r - 120) / 30), wm = Math.max(lm, rm);
  return (plateau + roll + ridge + mnt + hillsE) * (1 - wm) + wm * (lm > rm ? -9 : -6);
};
export const SEA = -3.2;   // niveau de l'eau (lac, rivière)
export const forestD = (x: number, z: number) => sm((x - 150) / 120) * (z > -380 ? 1 : 0) * (0.55 + 0.45 * Math.sin(x * 0.02) * Math.cos(z * 0.017));

const fieldCol = (x: number, z: number) => {
  const gx = Math.floor((x + 1000) / 38), gz = Math.floor((z + 1000) / 30), k = hash(gx * 31 + gz * 7, 4);
  return ["#e0bc48", "#8fbc4a", "#c8d05a", "#6a9a3a", "#d09a44", "#7aac4a", "#b8763a"][Math.floor(k * 7)];
};
const terrain = () => {
  const S = 4400, N = 440, g = new THREE.PlaneGeometry(S, S, N, N); g.rotateX(-Math.PI / 2); g.translate(0, 0, -300);
  const p = g.attributes.position as THREE.BufferAttribute, col = new Float32Array(p.count * 3), c = new THREE.Color(), c2 = new THREE.Color();
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i); p.setY(i, H(x, z)); }
  g.computeVertexNormals(); const nr = g.attributes.normal as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i), y = p.getY(i), r = Math.hypot(x, z), slope = 1 - nr.getY(i);
    const n = 0.5 + 0.5 * Math.sin(x * 0.021 + Math.cos(z * 0.017) * 2) * Math.cos(z * 0.019 - x * 0.006);
    c.set("#5a9636").lerp(c2.set("#9cc452"), n);
    const fd = forestD(x, z); if (fd > 0.3) c.lerp(c2.set("#3a6a2a"), 0.6);                                        // sous-bois
    if (r < 79) c.set("#b49a6e").lerp(c2.set("#9a8460"), hash(i, 2) * 0.5);                                      // bourg : terre battue
    else if (r > 150 && r < 560 && z > 120 && x > -120 && x < 200 && hash(Math.floor(x / 90) * 13 + Math.floor(z / 90), 9) > 0.2) c.lerp(c2.set(fieldCol(x, z)), 0.8);   // champs au sud
    if (z < -420 && Math.abs(x) < 420) c.lerp(c2.set("#7a8a4a"), 0.5);                                           // plaine du nord
    if (Math.abs(x) < 3.5 && z > 76 && z < 700) c.set("#c8b088");                                                // chemin vers le sud
    if (y < SEA + 1.2) c.lerp(c2.set("#c8b890"), 0.8);                                                           // berges
    const m = MOUNT(x, z);
    if (m > 0.02) { c.lerp(c2.set(slope > 0.35 ? "#7a7470" : "#8a8a6a"), sm((y - 30) / 60) * 0.9 + sm(slope * 2.2 - 0.4) * 0.6);
      if (y > 175 - 30 * hash(i, 8)) c.lerp(c2.set("#f4f6fa"), sm((y - 170) / 40) * (slope > 0.6 ? 0.4 : 1)); }        // neige
    col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
  }
  g.setAttribute("color", new THREE.BufferAttribute(col, 3));
  const det = ctex("grassdet", 256, 256, (q) => { q.fillStyle = "#e8e8e8"; q.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 3000; i++) { q.fillStyle = `rgba(${hash(i, 1) < 0.5 ? "40,60,20" : "255,255,240"},${0.1 + hash(i, 2) * 0.15})`; q.fillRect(hash(i, 3) * 256, hash(i, 4) * 256, 2, 2 + hash(i, 5) * 4); } }, true);
  const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, map: rep(det, 440, 440) })); m.receiveShadow = true; return m;
};

export const terrainMesh = () => terrain();

/** nature : forêts (pins + feuillus instanciés), bosquets, rochers, eau (lac + rivière), nuages */
export class Nature { root = new THREE.Group(); clouds: THREE.Sprite[] = [];
  constructor() {
    const pine = mergeGeometries([new THREE.CylinderGeometry(0.35, 0.5, 3, 5).translate(0, 1.5, 0), new THREE.ConeGeometry(3.2, 6.5, 7).translate(0, 5.5, 0), new THREE.ConeGeometry(2.4, 5, 7).translate(0, 8.6, 0)]);
    const oak = mergeGeometries([new THREE.CylinderGeometry(0.4, 0.6, 3.4, 5).translate(0, 1.7, 0), new THREE.IcosahedronGeometry(3.6, 1).translate(0, 6.2, 0), new THREE.IcosahedronGeometry(2.6, 1).translate(1.8, 5.2, 1.2)]);
    // couleur par sommet : tronc brun, feuillage vert (la couleur d'instance module)
    for (const g of [pine, oak]) { const a = g.attributes.position as THREE.BufferAttribute, cc = new Float32Array(a.count * 3); for (let i = 0; i < a.count; i++) { const tr = a.getY(i) < 3.1; cc.set(tr ? [0.35, 0.22, 0.12] : [1, 1, 1], i * 3); } g.setAttribute("color", new THREE.BufferAttribute(cc, 3)); }
    const T: { x: number; z: number; s: number; k: number }[][] = [[], []], d = new THREE.Object3D();
    for (let i = 0; i < 26000 && T[0].length + T[1].length < 9000; i++) {
      const x = -900 + hash(i, 51) * 1900, z = -900 + hash(i, 52) * 1700, r = Math.hypot(x, z), fd = forestD(x, z), y = H(x, z);
      if (r < 100 || y < SEA + 1.5 || (Math.abs(x) < 8 && z > 70) || (z < -420 && Math.abs(x) < 420)) continue;
      const grove = 0.5 + 0.5 * Math.sin(x * 0.045 + 1) * Math.sin(z * 0.05 + 2), m = MOUNT(x, z);
      const keepP = fd > 0.25 ? fd : m > 0.05 ? (y < 150 ? 0.35 : 0) : (z > 120 && x > -120 && x < 200) ? 0.012 : grove > 0.82 ? 0.5 : 0.02;
      if (hash(i, 53) > keepP) continue;
      T[(m > 0.05 || fd > 0.5) && hash(i, 54) < 0.8 ? 0 : 1].push({ x, z, s: 0.8 + hash(i, 55) * 0.7, k: hash(i, 56) }); }
    const greens = ["#2f6a34", "#3a7a3a", "#4a8a3a", "#2a5a30", "#5a9a40"];
    [pine, oak].forEach((g, j) => { const im = new THREE.InstancedMesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, flatShading: true }), T[j].length);
      T[j].forEach((t, i) => { d.position.set(t.x, H(t.x, t.z) - 0.3, t.z); d.rotation.set(0, t.k * 6, 0); d.scale.setScalar(t.s * (j ? 1 : 1.15)); d.updateMatrix(); im.setMatrixAt(i, d.matrix);
        im.setColorAt(i, new THREE.Color(j && t.k > 0.85 ? "#d8a03a" : greens[Math.floor(t.k * 5)])); });
      im.castShadow = true; im.receiveShadow = true; this.root.add(im); });
    // rochers au pied des montagnes et dans les collines
    const rk = new THREE.IcosahedronGeometry(1, 0), rocks: THREE.Matrix4[] = [];
    for (let i = 0; i < 6000 && rocks.length < 1400; i++) { const x = -1100 + hash(i, 61) * 1500, z = -900 + hash(i, 62) * 1600, m = MOUNT(x, z) + 0.06 * (Math.hypot(x, z) > 160 ? 1 : 0);
      if (hash(i, 63) > m * 0.9 || H(x, z) < SEA + 1) continue; const s = 1 + hash(i, 64) * (m > 0.1 ? 9 : 2.5);
      d.position.set(x, H(x, z) - s * 0.25, z); d.rotation.set(hash(i, 65) * 3, hash(i, 66) * 6, hash(i, 67) * 3); d.scale.set(s, s * (0.5 + hash(i, 68) * 0.4), s * (0.7 + hash(i, 69) * 0.5)); d.updateMatrix(); rocks.push(d.matrix.clone()); }
    const ri = new THREE.InstancedMesh(rk, M("#9a948a", 0.95, rep(stoneTex(), 0.5, 0.5), { flatShading: true }), rocks.length); rocks.forEach((m, i) => ri.setMatrixAt(i, m)); ri.castShadow = ri.receiveShadow = true; this.root.add(ri);
    // eau : grande nappe au niveau SEA (n'apparaît que dans les creux : lac et rivière)
    const wt = ctex("lakewater", 256, 256, (q) => { q.fillStyle = "#3a7ab8"; q.fillRect(0, 0, 256, 256); for (let i = 0; i < 90; i++) { q.strokeStyle = `rgba(220,240,255,${0.15 + hash(i, 2) * 0.25})`; q.lineWidth = 1.5; const y = hash(i, 3) * 256, x = hash(i, 4) * 256; q.beginPath(); q.moveTo(x, y); q.lineTo(x + 10 + hash(i, 5) * 24, y); q.stroke(); } }, true);
    const water = new THREE.Mesh(new THREE.PlaneGeometry(1400, 900).rotateX(-Math.PI / 2), new THREE.MeshPhysicalMaterial({ color: "#7ab8e8", map: rep(wt, 60, 40), roughness: 0.08, clearcoat: 1, transparent: true, opacity: 0.88 }));
    water.position.set(-100, SEA, 300); water.receiveShadow = true; this.root.add(water);
    // nuages (sprites doux), surtout accrochés aux montagnes
    const ct = ctex("cloud", 256, 128, (q) => { for (let i = 0; i < 14; i++) { const x = 40 + hash(i, 71) * 176, y = 50 + hash(i, 72) * 40, r = 24 + hash(i, 73) * 30, gr = q.createRadialGradient(x, y, 0, x, y, r);
      gr.addColorStop(0, "rgba(255,255,255,0.9)"); gr.addColorStop(1, "rgba(255,255,255,0)"); q.fillStyle = gr; q.beginPath(); q.arc(x, y, r, 0, 7); q.fill(); } });
    for (let i = 0; i < 22; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: ct, transparent: true, opacity: 0.85, depthWrite: false, fog: true }));
      const west = i < 12, x = west ? -500 - hash(i, 81) * 500 : -600 + hash(i, 81) * 1400, z = -900 + hash(i, 82) * 1300; s.position.set(x, west ? 230 + hash(i, 83) * 90 : 260 + hash(i, 83) * 120, z);
      const k = 180 + hash(i, 84) * 220; s.scale.set(k, k * 0.45, 1); this.root.add(s); this.clouds.push(s); }
  }
}

// ------------------------------------------------------------ géométries de base (origine au pied)
const box = (w: number, h: number, d: number, x = 0, y = 0, z = 0) => new THREE.BoxGeometry(w, h, d).translate(x, y + h / 2, z);
const prism = (w: number, h: number, d: number) => { const s = new THREE.Shape(); s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(0, h); s.lineTo(-w / 2, 0);
  return new THREE.ExtrudeGeometry(s, { depth: d, bevelEnabled: false }).translate(0, 0, -d / 2); };
const mesh = (p: THREE.Object3D, g: THREE.BufferGeometry, m: THREE.Material, x = 0, y = 0, z = 0, ry = 0) => { const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.rotation.y = ry; o.castShadow = true; o.receiveShadow = true; p.add(o); return o; };
const grp = (p: THREE.Object3D, x = 0, y = 0, z = 0, ry = 0) => { const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; p.add(g); return g; };

// matériaux
const stoneMap = () => rep(stoneTex(), 1.5, 1.5);
const STONE = () => M("#e2d6be", 0.92, stoneMap());
const STONED = () => M("#b8ab94", 0.92, stoneMap());
const woodT = () => ctex("woodplank", 128, 128, (q) => { q.fillStyle = "#9a6a3e"; q.fillRect(0, 0, 128, 128); for (let x = 0; x < 128; x += 16) { q.fillStyle = "rgba(40,20,5,0.35)"; q.fillRect(x, 0, 2, 128); }
  for (let i = 0; i < 300; i++) { q.fillStyle = `rgba(${hash(i, 1) < 0.5 ? "60,30,10" : "220,170,110"},0.15)`; q.fillRect(hash(i, 2) * 128, hash(i, 3) * 128, 1, 6 + hash(i, 4) * 14); } }, true);
const WOOD = () => M("#ffffff", 0.9, woodT());
const SLATE = () => M("#4a6aa8", 0.6, rep(roofTex("#4a6aa8"), 2, 2));
const TILE = () => M("#c4553a", 0.7, rep(roofTex("#c4553a"), 2, 2));
const flagTex = (key: string, bg: string, fg: string, mark: "lion" | "claw") => ctex("flag_" + key, 128, 192, (q) => {
  q.fillStyle = bg; q.fillRect(0, 0, 128, 192); q.fillStyle = fg;
  if (mark === "lion") { q.beginPath(); q.moveTo(64, 40); q.lineTo(96, 70); q.lineTo(86, 120); q.lineTo(64, 140); q.lineTo(42, 120); q.lineTo(32, 70); q.closePath(); q.fill(); q.fillStyle = bg; q.beginPath(); q.arc(64, 88, 14, 0, 7); q.fill(); }
  else { q.beginPath(); q.arc(64, 90, 40, 0, 7); q.fill(); q.strokeStyle = bg; q.lineWidth = 9; for (const dx of [-16, 0, 16]) { q.beginPath(); q.moveTo(64 + dx - 8, 60); q.lineTo(64 + dx + 8, 120); q.stroke(); } }
  q.fillStyle = "rgba(0,0,0,0.12)"; q.fillRect(0, 0, 128, 8); });

/** drapeau qui ondule (géométrie propre, mise à jour par image) */
class Flag { mesh: THREE.Mesh; private g: THREE.PlaneGeometry; private x0: Float32Array; ph: number;
  constructor(p: THREE.Object3D, w: number, h: number, map: THREE.Texture, x: number, y: number, z: number, ry = 0, ph = 0) {
    this.g = new THREE.PlaneGeometry(w, h, 8, 4).translate(w / 2, 0, 0); this.x0 = Float32Array.from((this.g.attributes.position as THREE.BufferAttribute).array as Float32Array);
    this.mesh = new THREE.Mesh(this.g, new THREE.MeshStandardMaterial({ map, side: THREE.DoubleSide, roughness: 0.85 })); this.mesh.position.set(x, y, z); this.mesh.rotation.y = ry; this.mesh.castShadow = true; p.add(this.mesh); this.ph = ph; }
  wave(t: number, amp = 1) { const a = this.g.attributes.position as THREE.BufferAttribute, w = this.x0;
    for (let i = 0; i < a.count; i++) { const x = w[i * 3]; a.setZ(i, Math.sin(x * 1.1 - t * 6 + this.ph) * 0.18 * x * amp); } a.needsUpdate = true; this.g.computeVertexNormals(); } }

// ------------------------------------------------------------ pièces du château
/** tour ronde en pierre, toit conique, drapeau */
const tower = (p: THREE.Object3D, r: number, h: number, roof: THREE.Material, flags: Flag[], ft: THREE.Texture, open = false) => {
  const g = new THREE.Group(); p.add(g);
  mesh(g, new THREE.CylinderGeometry(r, r * 1.08, h, 20).translate(0, h / 2, 0), STONE());
  mesh(g, new THREE.CylinderGeometry(r * 1.18, r * 1.18, 0.9, 20).translate(0, h + 0.45, 0), STONED());
  if (open) { for (let i = 0; i < 14; i++) { const b = i / 14 * Math.PI * 2; if (i % 2) mesh(g, box(1.2, 1.1, 0.5, 0, 0, 0), STONE(), Math.cos(b) * r * 1.1, h + 0.9, Math.sin(b) * r * 1.1, -b + Math.PI / 2); }
    for (let i = 0; i < 4; i++) { const b = i / 4 * Math.PI * 2 + Math.PI / 4; mesh(g, box(0.35, 5.6, 0.35), WOOD(), Math.cos(b) * r * 0.95, h + 0.9, Math.sin(b) * r * 0.95); }
    mesh(g, new THREE.ConeGeometry(r * 1.4, r * 1.5, 20).translate(0, h + 6.5 + r * 0.75, 0), roof); h += 5.6 - r * 1.1; }
  else mesh(g, new THREE.ConeGeometry(r * 1.32, r * 2.6, 20).translate(0, h + 0.9 + r * 1.3, 0), roof);
  for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + 0.4; mesh(g, box(0.7, 1.4, 0.3), E("#ffb24a", 0.6), Math.cos(a) * r * 1.0, h * 0.62, Math.sin(a) * r * 1.0, -a + Math.PI / 2); }
  mesh(g, new THREE.CylinderGeometry(0.08, 0.08, 4, 6).translate(0, h + 0.9 + r * 2.6 + 1.6, 0), M("#3a3026", 0.6));
  flags.push(new Flag(g, 2.6, 1.7, ft, 0.05, h + 0.9 + r * 2.6 + 2.6, 0, 0, hash(flags.length, 3) * 6));
  return g;
};
/** créneaux sur un rectangle */
const merlons = (w: number, d: number, y: number, s = 1.1) => { const gs: THREE.BufferGeometry[] = [];
  for (let x = -w / 2; x <= w / 2 + 0.01; x += s * 2) { gs.push(box(s, 1.2, 0.8, x, y, d / 2 - 0.4), box(s, 1.2, 0.8, x, y, -d / 2 + 0.4)); }
  for (let z = -d / 2 + s * 2; z <= d / 2 - s * 2 + 0.01; z += s * 2) { gs.push(box(0.8, 1.2, s, w / 2 - 0.4, y, z), box(0.8, 1.2, s, -w / 2 + 0.4, y, z)); }
  return mergeGeometries(gs); };
const keep = (p: THREE.Object3D, w: number, h: number, flags: Flag[], ft: THREE.Texture, turrets = true) => {
  const g = new THREE.Group(); p.add(g);
  mesh(g, box(w, h, w), STONE()); mesh(g, box(w + 0.8, 0.6, w + 0.8, 0, h, 0), STONED()); mesh(g, merlons(w + 0.6, w + 0.6, h + 0.6), STONE());
  for (let k = 0; k < 3; k++) for (let s = 0; s < 4; s++) { const a = s * Math.PI / 2; mesh(g, box(1.1, 2.0, 0.3), E("#ffb24a", 0.5), Math.sin(a) * (w / 2 + 0.02), h * (0.35 + k * 0.2), Math.cos(a) * (w / 2 + 0.02), a); }
  mesh(g, box(3, 4.5, 0.5, 0, 0, w / 2), WOOD());
  if (turrets) for (const [sx, sz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) { const t = tower(g, w * 0.16, h * 1.18, SLATE(), flags, ft); t.position.set(sx * w / 2, 0, sz * w / 2); }
  return g;
};
const woodTower = (p: THREE.Object3D, h: number) => { const g = new THREE.Group(); p.add(g); const wd = WOOD();
  for (const [x, z] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) mesh(g, new THREE.CylinderGeometry(0.22, 0.26, h, 6).translate(x * 1.4, h / 2, z * 1.4), wd);
  mesh(g, box(4.2, 0.35, 4.2, 0, h * 0.55, 0), wd); mesh(g, box(4.4, 0.35, 4.4, 0, h, 0), wd);
  for (const r of [0, 1, 2, 3]) mesh(g, box(4.4, 1.0, 0.15, 0, h + 0.35, 2.1), wd, 0, 0, 0, r * Math.PI / 2);
  mesh(g, new THREE.ConeGeometry(3.4, 2.6, 4).rotateY(Math.PI / 4).translate(0, h + 2.9, 0), M("#8a6a40", 0.9)); return g; };
const tent = (p: THREE.Object3D, x: number, z: number, col: string, ry: number) => { const g = grp(p, x, 0, z, ry); mesh(g, prism(3.2, 2.4, 3.6), M(col, 0.9)); return g; };
const hall = (p: THREE.Object3D, w: number, d: number, h: number, roof: THREE.Material) => { const g = new THREE.Group(); p.add(g);
  mesh(g, box(w, h, d), STONE()); const r = mesh(g, prism(w + 0.8, w * 0.45, d + 0.8), roof); r.position.y = h;
  for (let k = -2; k <= 2; k++) mesh(g, box(0.9, 1.8, 0.2), E("#ffb24a", 0.5), k * d * 0.17, h * 0.45, w / 2 + 0.05, Math.PI / 2).position.set(w / 2 + 0.05, h * 0.45, k * d * 0.17);
  return g; };
const chapel = (p: THREE.Object3D) => { const g = hall(p, 7, 12, 6, SLATE()); const b = new THREE.Group(); g.add(b); b.position.set(0, 0, -6);
  mesh(b, box(3.6, 13, 3.6), STONE()); mesh(b, new THREE.ConeGeometry(2.8, 7, 4).rotateY(Math.PI / 4).translate(0, 16.5, 0), SLATE()); return g; };

/** palissade de rondins (instanciée), rayon r, hauteur h ; weak = rondins penchés, trous */
const palisade = (p: THREE.Object3D, r: number, h: number, weak: boolean, gate = true) => {
  const n = Math.round(2 * Math.PI * r / 0.75), geo = new THREE.CylinderGeometry(0.36, 0.4, 1, 6).translate(0, 0.5, 0), tip = new THREE.ConeGeometry(0.38, 0.7, 6).translate(0, 0.35, 0);
  const im = new THREE.InstancedMesh(geo, M("#7a5232", 0.95, woodT()), n), it = new THREE.InstancedMesh(tip, M("#6a4428", 0.95), n), d = new THREE.Object3D(); let k = 0;
  for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2, x = Math.cos(a) * r, z = Math.sin(a) * r;
    if (gate && Math.abs(a - Math.PI / 2) < 0.045) continue;
    if (weak && hash(i, 11) < 0.05) continue;                                                     // trous
    const hh = h * (weak ? 0.65 + hash(i, 12) * 0.5 : 1); d.position.set(x, H(x, z) - PH - 0.3, z); d.rotation.set(weak ? (hash(i, 13) - 0.5) * 0.22 : 0, -a, weak ? (hash(i, 14) - 0.5) * 0.2 : 0); d.scale.set(1, hh, 1); d.updateMatrix(); im.setMatrixAt(k, d.matrix);
    d.position.y += hh * Math.cos(d.rotation.x); d.scale.set(1, 1, 1); d.updateMatrix(); it.setMatrixAt(k, d.matrix); k++; }
  im.count = it.count = k; im.castShadow = it.castShadow = true; im.receiveShadow = true;
  const g = new THREE.Group(); g.add(im, it); p.add(g);
  if (gate) { const gg = grp(g, 0, H(0, r) - PH, r, 0); const wd = WOOD(); mesh(gg, box(0.8, h + 3, 0.8, -3, 0, 0), wd); mesh(gg, box(0.8, h + 3, 0.8, 3, 0, 0), wd); mesh(gg, box(7.2, 0.8, 1, 0, h + 2.4, 0), wd);
    mesh(gg, box(2.6, h + 0.6, 0.3, -1.4, 0, 0.2), wd).rotation.y = weak ? -0.5 : 0; mesh(gg, box(2.6, h + 0.6, 0.3, 1.4, 0, 0.2), wd).rotation.y = weak ? 0.5 : 0; }
  return g; };

// ------------------------------------------------------------ éléments évolutifs
type Part = { o: THREE.Object3D; born: number; died: number; k: number };
const SPAN = 0.55;   // durée de pousse (en unités d'étape)

export class Castle {
  root = new THREE.Group(); parts: Part[] = []; flags: Flag[] = []; bell = new THREE.Group(); bellTop = V(0, 0, 0);
  private hw: THREE.InstancedMesh; private hr: THREE.InstancedMesh; private houses: { x: number; z: number; ry: number; w: number; d: number; h: number; born: number; k: number; c: THREE.Color; rc: THREE.Color }[] = [];
  private dust: THREE.Points; private dustP: { x: number; z: number; st: number }[] = []; private d = new THREE.Object3D(); private last = -1;
  people: THREE.InstancedMesh; private ppl: { x: number; z: number; a: number; sp: number }[] = [];
  watch = V(-14, PH, -36); gateZ = 76;
  constructor() {
    this.root.position.y = PH; const R = this.root, ft = flagTex("ours", "#1f3f8a", "#f2c230", "lion");
    const P = (o: THREE.Object3D, born: number, died = 99, x = 0, z = 0, ry = 0) => { o.position.set(x, o.position.y, z); o.rotation.y = ry; this.parts.push({ o, born, died, k: hash(this.parts.length, 5) * 0.12 }); return o; };
    // étape 0 : tour de bois + tentes
    P(woodTower(R, 7), 0, 1.2); [["#c8b090", -6, 4, 0.4], ["#b8865a", 5, 6, -0.6], ["#d8c8a0", 4, -6, 1.2]].forEach(([c, x, z, r]) => P(tent(R, 0, 0, c as string, 0), 0, 1.2, x as number, z as number, r as number));
    P(palisade(R, 12, 2.6, false), 0.3, 1.2);
    // étape 1 : petit donjon de pierre + palissade
    P(keep(R, 9, 13, this.flags, ft, false), 1, 3); P(palisade(R, 24, 3, false), 1.1, 2.2);
    // étape 2 : deuxième tour, chapelle, palissade plus large
    P(tower(R, 3.6, 19, SLATE(), this.flags, ft), 2, 99, 17, -12); P(chapel(R), 2.15, 99, -18, 10, 0.3); P(palisade(R, 48, 3.2, false), 2.1, 3.2);
    // étape 3 : grand donjon pavoisé (4 tourelles), grande salle
    P(keep(R, 15, 22, this.flags, ft, true), 3); P(hall(R, 9, 18, 7, TILE()), 3.15, 99, 16, 10, 0.2); P(palisade(R, 66, 3.4, false), 3.1, 4.2);
    P(tower(R, 3.0, 16, SLATE(), this.flags, ft), 3.2, 99, -22, -14);
    // étape 4 : la plus haute tour (guet + cloche), tours de quartier, palissade finale faible
    const wt = tower(R, 3.4, 44, SLATE(), this.flags, ft, true); P(wt, 4, 99, this.watch.x, this.watch.z);
    const plat = new THREE.Group(); wt.add(plat); plat.position.y = 44.9;
    this.bell.position.set(0, 4.2, 0); plat.add(this.bell); mesh(this.bell, new THREE.CylinderGeometry(0.5, 1.0, 1.5, 16, 1, true).translate(0, -0.9, 0), M("#c8962a", 0.3, undefined, { metalness: 0.9, side: THREE.DoubleSide }));
    mesh(plat, box(4.2, 0.3, 0.4, 0, 4.4, 0), WOOD());
    this.bellTop.set(this.watch.x, PH + 44.9, this.watch.z);
    P(tower(R, 2.6, 14, TILE(), this.flags, ft), 4.1, 99, 34, 30); P(tower(R, 2.6, 14, TILE(), this.flags, ft), 4.15, 99, -36, 26); P(tower(R, 2.6, 13, SLATE(), this.flags, ft), 4.2, 99, 40, -22);
    P(palisade(R, 76, 3.6, true), 4.0);
    // maisons (instanciées)
    const wallT = ctex("halftimber", 128, 128, (q) => { q.fillStyle = "#ffffff"; q.fillRect(0, 0, 128, 128); q.fillStyle = "#5a3a22"; q.fillRect(0, 0, 128, 6); q.fillRect(0, 60, 128, 6); q.fillRect(0, 122, 128, 6);
      for (const x of [0, 40, 84, 122]) q.fillRect(x, 0, 6, 128); q.save(); q.lineWidth = 5; q.strokeStyle = "#5a3a22"; q.beginPath(); q.moveTo(6, 66); q.lineTo(40, 122); q.moveTo(84, 66); q.lineTo(122, 122); q.stroke(); q.restore();
      q.fillStyle = "#3a5a7a"; q.fillRect(52, 18, 22, 28); q.fillStyle = "#e8b04a"; q.fillRect(55, 21, 16, 22); q.fillStyle = "#3a2618"; q.fillRect(50, 80, 26, 42); });
    const cream = ["#f2e6cc", "#efd9b0", "#f4e2d0", "#e8dcc4", "#f0d8b8", "#e4e0d4"], roofs = ["#b8452e", "#c4553a", "#4a6aa8", "#8a4a34", "#a85a3a", "#5a6a8a"];
    for (let gx = -12; gx <= 12; gx++) for (let gz = -12; gz <= 12; gz++) {
      const x = gx * 6.4 + (hash(gx * 37 + gz, 1) - 0.5) * 2.2, z = gz * 6.4 + (hash(gx * 37 + gz, 2) - 0.5) * 2.2, r = Math.hypot(x, z);
      if (r > 72 || Math.abs(x) < 3.6 || Math.abs(z - 2) < 3.2 || (Math.abs(x) < 14 && Math.abs(z) < 14)) continue;
      if (Math.hypot(x - 16, z - 10) < 12 || Math.hypot(x + 18, z - 10) < 10 || Math.hypot(x - 17, z + 12) < 7 || Math.hypot(x + 22, z + 14) < 6 || Math.hypot(x - this.watch.x, z - this.watch.z) < 7) continue;
      if (Math.hypot(x - 34, z - 30) < 6 || Math.hypot(x + 36, z - 26) < 6 || Math.hypot(x - 40, z + 22) < 6) continue;
      const born = r < 23 ? 1.2 : r < 47 ? 2.3 : r < 65 ? 3.3 : 4.25, i = this.houses.length;
      this.houses.push({ x, z, ry: Math.atan2(x, z) + (hash(i, 3) - 0.5) * 0.4, w: 3.8 + hash(i, 4) * 1.6, d: 4.2 + hash(i, 5) * 1.8, h: 3.2 + hash(i, 6) * 2.6, born: born + hash(i, 7) * 0.3, k: 0,
        c: new THREE.Color(cream[Math.floor(hash(i, 8) * 6)]), rc: new THREE.Color(roofs[Math.floor(hash(i, 9) * 6)]) });
    }
    const n = this.houses.length;
    this.hw = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0), M("#ffffff", 0.9, wallT), n);
    this.hr = new THREE.InstancedMesh(prism(1, 1, 1), M("#ffffff", 0.7, rep(roofTex("#d8d8d8"), 1, 1)), n);
    this.houses.forEach((h, i) => { this.hw.setColorAt(i, h.c); this.hr.setColorAt(i, h.rc); });
    for (const m of [this.hw, this.hr]) { m.castShadow = m.receiveShadow = true; R.add(m); }
    // habitants (silhouettes minuscules, instanciées) dans les rues
    const pg = mergeGeometries([box(0.55, 1.1, 0.4), box(0.45, 0.45, 0.45, 0, 1.1, 0)]);
    for (let i = 0; i < 700; i++) { const along = (hash(i, 21) - 0.5) * 140, side = (hash(i, 22) - 0.5) * 5.5, ax = hash(i, 23) < 0.5;
      const x = ax ? side : along, z = ax ? along : side + 2; if (Math.hypot(x, z) > 72 || (Math.abs(x) < 9 && Math.abs(z) < 9)) continue; this.ppl.push({ x, z, a: ax ? 0 : Math.PI / 2, sp: (hash(i, 24) - 0.5) * 2.4 }); }
    this.people = new THREE.InstancedMesh(pg, M("#ffffff", 0.8), this.ppl.length); const pc = ["#c4383a", "#2a5cb8", "#e8b030", "#2fae7a", "#f4f0e8", "#8a5ad8", "#6a4428"];
    this.ppl.forEach((_, i) => this.people.setColorAt(i, new THREE.Color(pc[Math.floor(hash(i, 25) * pc.length)]))); this.people.castShadow = true; R.add(this.people);
    // poussière de construction
    const dg = new THREE.BufferGeometry(); dg.setAttribute("position", new THREE.BufferAttribute(new Float32Array(900 * 3), 3));
    for (let i = 0; i < 900; i++) { const st = 1 + Math.floor(hash(i, 31) * 4), r = st === 1 ? hash(i, 32) * 24 : st === 2 ? 20 + hash(i, 32) * 28 : st === 3 ? 10 + hash(i, 32) * 56 : 40 + hash(i, 32) * 36, a = hash(i, 33) * 7;
      this.dustP.push({ x: Math.cos(a) * r, z: Math.sin(a) * r, st }); }
    this.dust = new THREE.Points(dg, new THREE.PointsMaterial({ color: "#e8d8b8", size: 1.6, transparent: true, opacity: 0.55, depthWrite: false, map: puff() })); this.dust.frustumCulled = false; R.add(this.dust);
  }
  /** s : étape continue 0 → 4 (les éléments poussent du sol avec un léger rebond) */
  set(s: number, t: number) {
    for (const p of this.parts) { const a = back((s - p.born - p.k) / SPAN), b = p.died < 99 ? sm((s - p.died) / 0.35) : 0, k = Math.max(0, a * (1 - b));
      p.o.visible = k > 0.002; p.o.scale.set(0.75 + 0.25 * Math.min(1, k), k, 0.75 + 0.25 * Math.min(1, k)); }
    if (s !== this.last) { this.last = s; const d = this.d;
      this.houses.forEach((h, i) => { const k = Math.max(0, back((s - h.born) / SPAN)); d.position.set(h.x, 0, h.z); d.rotation.set(0, h.ry, 0); d.scale.set(h.w * (0.7 + 0.3 * Math.min(1, k)), h.h * k + 1e-4, h.d * (0.7 + 0.3 * Math.min(1, k))); d.updateMatrix(); this.hw.setMatrixAt(i, d.matrix);
        d.position.y = h.h * k; d.scale.set(h.w + 0.6, 2.4 * k + 1e-4, h.d + 0.6); d.updateMatrix(); this.hr.setMatrixAt(i, d.matrix); });
      this.hw.instanceMatrix.needsUpdate = true; this.hr.instanceMatrix.needsUpdate = true; }
    const vis = s >= 3.9; this.people.visible = vis;
    if (vis) { const d = this.d; this.ppl.forEach((p, i) => { const off = ((t * p.sp) % 20); d.position.set(p.a === 0 ? p.x : p.x + off, Math.abs(Math.sin(t * 8 + i)) * 0.12, p.a === 0 ? p.z + off : p.z); d.rotation.set(0, p.a + (p.sp < 0 ? Math.PI : 0), 0); d.scale.setScalar(1); d.updateMatrix(); this.people.setMatrixAt(i, d.matrix); }); this.people.instanceMatrix.needsUpdate = true; }
    // poussière : nuage autour des éléments de l'étape qui pousse
    const a = this.dust.geometry.attributes.position as THREE.BufferAttribute; let any = false;
    this.dustP.forEach((p, i) => { const q = (s - p.st + 0.05) / 0.8; const on = q > 0 && q < 1; if (on) any = true;
      a.setXYZ(i, on ? p.x * (1 + q * 0.15) : 0, on ? 0.5 + q * (3 + hash(i, 34) * 5) : -999, on ? p.z * (1 + q * 0.15) : 0); });
    a.needsUpdate = true; this.dust.visible = any; (this.dust.material as THREE.PointsMaterial).opacity = 0.5;
    for (const f of this.flags) f.wave(t);
  }
}
const puff = () => ctex("puff", 64, 64, (q) => { const g = q.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, "rgba(255,255,255,1)"); g.addColorStop(1, "rgba(255,255,255,0)"); q.fillStyle = g; q.fillRect(0, 0, 64, 64); });

// ------------------------------------------------------------ armée
export class Army {
  root = new THREE.Group(); private ims: THREE.InstancedMesh[] = []; private pos: { x: number; z: number; y: number; ph: number }[] = []; private d = new THREE.Object3D();
  flags: Flag[] = []; flagPoles: THREE.Group[] = []; towers: THREE.Group[] = []; torches: THREE.Points; march = 0;
  constructor() {
    const RW = 22, RD = 26, SP = 2.3;    // régiment : 22 x 26 soldats
    for (let rx = -5; rx < 5; rx++) for (let rz = 0; rz < 3; rz++) { const x0 = rx * (RW * SP + 9) + 4.5, z0 = AZ - rz * (RD * SP + 12) - 6;
      for (let i = 0; i < RW; i++) for (let j = 0; j < RD; j++) { const x = x0 + i * SP + (hash(i * 97 + j, rx + 9) - 0.5) * 0.5, z = z0 - j * SP; this.pos.push({ x, z, y: H(x, z), ph: hash(i + j * 31, rx * 3 + rz) * 6 }); }
      const ft = flagTex("enemy", "#b8141e", "#141418", "claw");
      for (const fx of [x0 + 2, x0 + RW * SP - 4]) { const g = grp(this.root, fx, H(fx, z0 + 1), z0 + 1); this.flagPoles.push(g); mesh(g, new THREE.CylinderGeometry(0.1, 0.12, 9, 6).translate(0, 4.5, 0), M("#2a2420", 0.7));
        this.flags.push(new Flag(g, 4.2, 3, ft, 0.1, 7.3, 0, -Math.PI / 2, hash(this.flags.length, 2) * 6)); } }
    const n = this.pos.length, armor = M("#25272e", 0.45, undefined, { metalness: 0.6 });
    const body = mergeGeometries([box(0.38, 0.9, 0.42, -0.24), box(0.38, 0.9, 0.42, 0.24), box(1.0, 1.0, 0.6, 0, 0.9), box(0.3, 0.9, 0.34, -0.66, 1.0), box(0.3, 0.9, 0.34, 0.66, 1.0)]);
    const helm = mergeGeometries([box(0.72, 0.7, 0.72, 0, 1.9), box(0.12, 0.42, 0.7, 0, 2.6)]);
    const shield = box(0.12, 1.0, 0.8, -0.86, 0.85);
    const spear = mergeGeometries([new THREE.CylinderGeometry(0.05, 0.05, 4.2, 5).translate(0.72, 2.0, 0.1), new THREE.ConeGeometry(0.12, 0.5, 5).translate(0.72, 4.35, 0.1)]);
    for (const [g, m] of [[body, armor], [helm, M("#1a1b20", 0.3, undefined, { metalness: 0.8 })], [shield, M("#8a1018", 0.6)], [spear, M("#4a3a2a", 0.6)]] as [THREE.BufferGeometry, THREE.Material][]) {
      const im = new THREE.InstancedMesh(g, m, n); im.castShadow = true; im.frustumCulled = false; this.ims.push(im); this.root.add(im); }
    // tours de siège (plus hautes que nos remparts)
    for (let k = 0; k < 8; k++) { const x = -230 + k * 66 + (hash(k, 1) - 0.5) * 16, z = AZ - 40 - hash(k, 2) * 60; const g = grp(this.root, x, H(x, z), z); this.towers.push(g); siege(g, k); }
    // torches (nuit)
    const tg = new THREE.BufferGeometry(), tp = new Float32Array(Math.ceil(n / 6) * 3); for (let i = 0, k = 0; i < n; i += 6, k++) { const p = this.pos[i]; tp.set([p.x + 0.7, p.y + 3.2, p.z], k * 3); }
    tg.setAttribute("position", new THREE.BufferAttribute(tp, 3)); this.torches = new THREE.Points(tg, new THREE.PointsMaterial({ color: new THREE.Color(4, 1.6, 0.4), size: 1.4, map: puff(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    this.torches.visible = false; this.torches.frustumCulled = false; this.root.add(this.torches);
  }
  /** m : avancée (u) ; t : temps (pas de marche) */
  set(t: number, m: number, step = 1) {
    this.root.position.z = m; const d = this.d;
    this.pos.forEach((p, i) => { const b = Math.abs(Math.sin(t * 4.2 * step + p.ph * 0.15)) * 0.16 * step; d.position.set(p.x, p.y + b, p.z); d.rotation.set(0, 0, Math.sin(t * 4.2 * step + p.ph * 0.15) * 0.03 * step); d.updateMatrix();
      for (const im of this.ims) im.setMatrixAt(i, d.matrix); });
    for (const im of this.ims) im.instanceMatrix.needsUpdate = true;
    for (const f of this.flags) f.wave(t, 0.8);
  }
}
const siege = (g: THREE.Group, k: number) => { const wd = M("#6a4a2e", 0.95, woodT()), hide = M("#5a3424", 0.95), h = 30;
  const geo = new THREE.CylinderGeometry(4.2 / Math.SQRT2, 6.2 / Math.SQRT2, h, 4).rotateY(Math.PI / 4).translate(0, h / 2 + 1.2, 0); mesh(g, geo, wd);
  mesh(g, box(6.2, h * 0.75, 0.3, 0, 3, 3.0), hide).rotation.x = 0.05;
  mesh(g, box(5.2, 1.2, 5.2, 0, h + 1.2, 0), wd); for (const s of [-1, 1]) for (const z of [-2, 2]) mesh(g, new THREE.CylinderGeometry(1.2, 1.2, 0.5, 14).rotateZ(Math.PI / 2).translate(s * 3.2, 1.2, z), M("#3a2a1e", 0.9));
  const ft = flagTex("enemy", "#b8141e", "#141418", "claw"); mesh(g, new THREE.CylinderGeometry(0.1, 0.1, 6, 6).translate(0, h + 4.8, 0), M("#2a2420", 0.7));
  const f = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 2.4).translate(1.8, 0, 0), new THREE.MeshStandardMaterial({ map: ft, side: THREE.DoubleSide })); f.position.set(0, h + 6.4, 0); f.rotation.y = -Math.PI / 2 + hash(k, 4) * 0.4; g.add(f); };

// ------------------------------------------------------------ villages brûlés
export const VILLAGES = [V(-70, 0, -190), V(65, 0, -245), V(-25, 0, -300)];
export class Ruins { root = new THREE.Group(); smoke: THREE.Points[] = []; private sp: { b: THREE.Vector3; ph: number }[][] = []; embers: THREE.PointLight[] = [];
  constructor() {
    const black = M("#2a2420", 0.98), char = M("#4a3a30", 0.98, stoneMap());
    VILLAGES.forEach((c, vi) => { c.y = H(c.x, c.z); const g = grp(this.root, c.x, c.y, c.z);
      for (let i = 0; i < 14; i++) { const a = hash(i, vi + 1) * 7, r = 4 + hash(i, vi + 2) * 18, x = Math.cos(a) * r, z = Math.sin(a) * r, y = H(c.x + x, c.z + z) - c.y, w = 4 + hash(i, 3) * 2, h = 1.2 + hash(i, 4) * 3.2;
        const hg = grp(g, x, y, z, a); mesh(hg, box(w, h, 0.4, 0, 0, 2), char); mesh(hg, box(0.4, h * 0.7, 4, w / 2, 0, 0), char); mesh(hg, box(w * 0.6, h * 0.5, 0.4, -w * 0.2, 0, -2), black);
        mesh(hg, box(0.3, 0.3, 5, 0, 0.1, 0), black).rotation.set(0.3, 0.6, 0.2); }
      const n = 160, pg = new THREE.BufferGeometry(); pg.setAttribute("position", new THREE.BufferAttribute(new Float32Array(n * 3), 3));
      const pts = new THREE.Points(pg, new THREE.PointsMaterial({ color: "#3a3634", size: 16, map: puff(), transparent: true, opacity: 0.55, depthWrite: false })); pts.frustumCulled = false; this.root.add(pts); this.smoke.push(pts);
      this.sp.push([...Array(n).keys()].map((i) => ({ b: c.clone().add(V((hash(i, 41) - 0.5) * 22, 0, (hash(i, 42) - 0.5) * 22)), ph: hash(i, 43) })));
      const l = new THREE.PointLight("#ff6a1a", 0, 60, 1.6); l.position.copy(c).add(V(0, 3, 0)); this.root.add(l); this.embers.push(l); });
  }
  set(t: number) { this.smoke.forEach((pts, v) => { const a = pts.geometry.attributes.position as THREE.BufferAttribute;
      this.sp[v].forEach((p, i) => { const life = (t * 0.06 + p.ph) % 1; a.setXYZ(i, p.b.x + Math.sin(life * 3 + i) * 4 + life * 30, p.b.y + 2 + life * 110, p.b.z + life * 8); }); a.needsUpdate = true; });
    this.embers.forEach((l, i) => (l.intensity = 120 * (0.7 + 0.3 * Math.sin(t * 9 + i * 2)))); }
}

// ------------------------------------------------------------ muraille + catapultes (hologramme doré)
export const WALL_R = 86;
export class Holo { wall: Drawn; cats: Drawn; wallG = new THREE.Group(); catG = new THREE.Group();
  constructor(root: THREE.Object3D) {
    const m = M("#f4e4c0", 0.6, undefined, { emissive: "#ffb040", emissiveIntensity: 0.35 }), N = 10;
    root.add(this.wallG, this.catG);
    for (let k = 0; k < N; k++) { const a = k / N * Math.PI * 2 + Math.PI / 2, x = Math.cos(a) * WALL_R, z = Math.sin(a) * WALL_R, y = H(x, z) - 1;
      const t = grp(this.wallG, x, y, z, -a); mesh(t, new THREE.CylinderGeometry(6, 6.6, 24, 12).translate(0, 12, 0), m); mesh(t, new THREE.CylinderGeometry(7, 7, 1.4, 12).translate(0, 24.7, 0), m);
      for (let i = 0; i < 8; i++) { const b = i / 8 * Math.PI * 2; mesh(t, box(1.6, 1.6, 1.0, Math.cos(b) * 6.4, 25.4, Math.sin(b) * 6.4), m).rotation.y = -b; }
      const a2 = (k + 1) / N * Math.PI * 2 + Math.PI / 2, x2 = Math.cos(a2) * WALL_R, z2 = Math.sin(a2) * WALL_R, len = Math.hypot(x2 - x, z2 - z) - 11, mx = (x + x2) / 2, mz = (z + z2) / 2, ang = Math.atan2(z2 - z, x2 - x);
      const s = grp(this.wallG, mx, Math.min(y, H(x2, z2) - 1), mz, -ang); mesh(s, box(len, 16, 4.2), m); mesh(s, box(len, 1, 5.2, 0, 16, 0), m);
      for (let i = -len / 2 + 1.2; i < len / 2; i += 2.6) { mesh(s, box(1.3, 1.6, 0.9, i, 17, 2.1), m); mesh(s, box(1.3, 1.6, 0.9, i, 17, -2.1), m); }
      // catapulte sur la tour
      const c = grp(this.catG, x, y + 26, z, -a + Math.PI / 2); mesh(c, box(4.2, 0.6, 2.6), m); for (const sz of [-1.1, 1.1]) { mesh(c, box(0.4, 2.8, 0.4, 0.4, 0.6, sz), m); }
      const arm = mesh(c, box(6.4, 0.35, 0.35, 0, 0, 0), m); arm.position.set(0.4, 3.0, 0); arm.rotation.z = 0.55; mesh(c, new THREE.SphereGeometry(0.7, 10, 8).translate(-3.0, 0, 0), m).position.copy(arm.position).add(V(-2.6, -1.4, 0));
    }
    this.wall = new Drawn(this.wallG, 3.2, 28, 0, (x, _y, z) => (Math.atan2(z, x) - Math.PI / 2 + Math.PI * 4) % (Math.PI * 2)); this.cats = new Drawn(this.catG, 3.2, 28, 0);
  }
}

// ------------------------------------------------------------ personnages (blocs, même style que la série)
export const CHEF: Spec = { name: "chef", skin: "#e2b894", top: "#2a2c33", topDark: "#1c1e24", sleeve: "#2a2c33", pants: "#1c1e24", shoes: "#111114", style: "uniform", hair: "short", hairCol: "#111111", beard: "#111111", helmet: "#24262c" };
export const GUET: Spec = { name: "guet", skin: "#f0c8a6", top: "#2a4f9a", topDark: "#1f3a72", sleeve: "#2a4f9a", pants: "#5a4430", shoes: "#3a2618", style: "jacket", inner: "#f2c230", hair: "messy", hairCol: "#7a4a26" };
export const SOLD: Spec = { name: "sold", skin: "#d8ac88", top: "#2a2c33", topDark: "#1c1e24", sleeve: "#2a2c33", pants: "#1c1e24", shoes: "#111114", style: "uniform", hair: "short", hairCol: "#111111", helmet: "#24262c" };
export const VIL: Spec[] = [
  { name: "v1", skin: "#f2cbaa", top: "#c4383a", topDark: "#9a2a2c", sleeve: "#c4383a", pants: "#5a4430", shoes: "#3a2618", style: "tee", hair: "short", hairCol: "#3a2416", mustache: "#3a2416" },
  { name: "v2", skin: "#f5d0b0", top: "#2fae7a", topDark: "#1f8a5c", sleeve: "#2fae7a", pants: "#3a3f4a", shoes: "#3a2618", style: "cardigan", inner: "#f4ecdc", hair: "bun", hairCol: "#8a5a32" },
  { name: "v3", skin: "#c98a5c", top: "#e8b030", topDark: "#c49018", sleeve: "#e8b030", pants: "#3a2a1e", shoes: "#2a1a10", style: "tee", hair: "curly", hairCol: "#1d1712" },
  { name: "v4", skin: "#f6d3b8", top: "#8a5ad8", topDark: "#6a40b0", sleeve: "#8a5ad8", pants: "#2a2e36", shoes: "#3a2618", style: "dress", hair: "long", hairCol: "#c8803a" },
];
/** casque à cornes + cape rouge pour le chef */
export const dressChef = (a: Actor) => { const horn = M("#e8dcc4", 0.5), cape = new THREE.MeshStandardMaterial({ color: "#a8121c", roughness: 0.8, side: THREE.DoubleSide });
  for (const s of [-1, 1]) { const h = new THREE.Mesh(new THREE.ConeGeometry(0.22, 1.3, 10).translate(0, 0.65, 0), horn); h.position.set(s * 0.72, 1.15, 0); h.rotation.z = -s * 0.9; a.neck.add(h); }
  const c = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 4.0, 4, 6).translate(0, -2.0, 0), cape); c.position.set(0, -0.05, -0.75); c.rotation.x = 0.12; a.neck.add(c); return c; };
