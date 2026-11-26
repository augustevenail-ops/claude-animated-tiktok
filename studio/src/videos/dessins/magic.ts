// Les Dessins : apparition / disparition des dessins — contours dorés lumineux tracés, puis l'objet se matérialise
// (et l'inverse quand il est effacé). Pages de carnet dessinées progressivement (Canvas2D), étincelles dorées.
import * as THREE from "three";
import { LineSegments2 } from "three/examples/jsm/lines/LineSegments2.js";
import { LineSegmentsGeometry } from "three/examples/jsm/lines/LineSegmentsGeometry.js";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";
import { hash } from "./tex";

const sm = (x: number) => { const t = Math.min(1, Math.max(0, x)); return t * t * (3 - 2 * t); };
export const GOLD = new THREE.Color(1.0, 0.72, 0.22);

const sparkTex = (() => { let t: THREE.Texture | null = null; return () => { if (t) return t; const c = document.createElement("canvas"); c.width = c.height = 64; const g = c.getContext("2d")!;
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.25, "rgba(255,220,140,0.9)"); gr.addColorStop(1, "rgba(255,160,40,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64); g.fillStyle = "rgba(255,255,255,0.9)"; g.fillRect(30, 4, 4, 56); g.fillRect(4, 30, 56, 4); t = new THREE.CanvasTexture(c); return t; }; })();

/** objet dessiné : contours dorés (lignes épaisses) tracés progressivement, puis fondu de l'objet réel */
export class Drawn {
  root: THREE.Object3D; private lines: LineSegments2; private lm: LineMaterial; private n: number; private mats: THREE.Material[] = []; private meshes: THREE.Mesh[] = [];
  private spark: THREE.Points; private segs: Float32Array; private glow?: THREE.PointLight;
  constructor(obj: THREE.Object3D, width = 5, angle = 28, light = 0) {
    this.root = obj; obj.updateMatrixWorld(true);
    const inv = new THREE.Matrix4().copy(obj.matrixWorld).invert(), pos: number[] = [];
    obj.traverse((o) => { const m = o as THREE.Mesh; if (!m.isMesh || o.userData.noEdge) return; this.meshes.push(m);
      const e = new THREE.EdgesGeometry(m.geometry, angle), a = e.attributes.position, mm = new THREE.Matrix4().multiplyMatrices(inv, m.matrixWorld), v = new THREE.Vector3();
      for (let i = 0; i < a.count; i++) { v.fromBufferAttribute(a, i).applyMatrix4(mm); pos.push(v.x, v.y, v.z); } e.dispose();
      const cl = (x: THREE.Material) => { const c = x.clone(); c.transparent = false; this.mats.push(c); return c; };
      m.material = Array.isArray(m.material) ? m.material.map(cl) : cl(m.material); });
    // ordre de tracé : de bas en haut, avec un peu de désordre (comme un crayon)
    const n = pos.length / 6, idx = [...Array(n).keys()], key = (i: number) => Math.min(pos[i * 6 + 1], pos[i * 6 + 4]) + hash(i, 7) * 0.25;
    idx.sort((a, b) => key(a) - key(b)); const s = new Float32Array(pos.length); idx.forEach((j, k) => { for (let q = 0; q < 6; q++) s[k * 6 + q] = pos[j * 6 + q]; });
    this.segs = s; this.n = n;
    const g = new LineSegmentsGeometry(); g.setPositions(s);
    this.lm = new LineMaterial({ color: GOLD.clone().multiplyScalar(5), linewidth: width, transparent: true, depthWrite: false, toneMapped: true });
    this.lm.resolution.set(1440, 2560);
    this.lines = new LineSegments2(g, this.lm); this.lines.frustumCulled = false; this.lines.renderOrder = 5; obj.add(this.lines);
    const sp = new THREE.BufferGeometry(); sp.setAttribute("position", new THREE.BufferAttribute(new Float32Array(3 * 40), 3));
    this.spark = new THREE.Points(sp, new THREE.PointsMaterial({ map: sparkTex(), size: 0.12, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, color: new THREE.Color(3, 2.2, 1.1) }));
    this.spark.frustumCulled = false; obj.add(this.spark);
    if (light > 0) { this.glow = new THREE.PointLight("#ffc060", 0, light * 3, 1.5); obj.add(this.glow); const b = new THREE.Box3().setFromBufferAttribute(new THREE.BufferAttribute(s, 3)); b.getCenter(this.glow.position); }
  }
  /** p : 0 = rien, 0→0,5 tracé doré, 0,5→0,85 matérialisation, 1 = objet réel ; erase = disparition (traits qui s'effacent dans l'autre sens) */
  set(p: number, t: number, sparkSize = 0.12) {
    const on = p > 0.001; this.root.visible = on; if (!on) return this;
    const draw = sm(p / 0.5), solid = sm((p - 0.45) / 0.4), lineOp = p < 0.82 ? 1 : 1 - sm((p - 0.82) / 0.18);
    const cnt = Math.max(1, Math.round(this.n * draw)); (this.lines.geometry as LineSegmentsGeometry).instanceCount = cnt;
    this.lines.visible = lineOp > 0.01; this.lm.opacity = lineOp;
    for (const m of this.mats) { const tr = solid < 0.999; if (m.transparent !== tr) { m.transparent = tr; m.needsUpdate = true; } m.opacity = solid; (m as THREE.MeshStandardMaterial).depthWrite = solid > 0.5; }
    for (const m of this.meshes) { m.visible = solid > 0.005; m.castShadow = solid > 0.6; }
    // étincelles autour de la pointe du tracé
    const a = this.spark.geometry.attributes.position as THREE.BufferAttribute, live = draw < 0.999 || (p > 0.45 && p < 0.9);
    this.spark.visible = live; (this.spark.material as THREE.PointsMaterial).size = sparkSize;
    for (let i = 0; i < 40; i++) { const k = Math.max(0, Math.min(this.n - 1, cnt - 1 - Math.floor(hash(i, 3) * Math.min(cnt, 60)))), s = this.segs, f = hash(i, 5);
      const ph = t * 3 + i; a.setXYZ(i, s[k * 6] + (s[k * 6 + 3] - s[k * 6]) * f + Math.sin(ph) * 0.05, s[k * 6 + 1] + (s[k * 6 + 4] - s[k * 6 + 1]) * f + ((t * 0.6 + hash(i, 9)) % 1) * 0.25, s[k * 6 + 2] + (s[k * 6 + 5] - s[k * 6 + 2]) * f + Math.cos(ph) * 0.05); }
    a.needsUpdate = true;
    if (this.glow) this.glow.intensity = (draw * lineOp) * 6;
    return this;
  }
}

/** page de carnet : un dessin au crayon qui se trace (k : 0 → 1) ; strokes = polylignes en coordonnées 0..1 */
export type Stroke = { pts: [number, number][]; col?: string; w?: number; fill?: string };
export class Page {
  tex: THREE.CanvasTexture; private cv: HTMLCanvasElement; private last = -1;
  constructor(private strokes: Stroke[], private bg = "#fbf8ef", private lined = true, w = 512, h = 512, private extra?: (g: CanvasRenderingContext2D, k: number) => void) {
    this.cv = document.createElement("canvas"); this.cv.width = w; this.cv.height = h; this.tex = new THREE.CanvasTexture(this.cv); this.tex.colorSpace = THREE.SRGBColorSpace; this.tex.anisotropy = 8; this.draw(1);
  }
  draw(k: number) {
    const q = Math.round(Math.min(1, Math.max(0, k)) * 60) / 60; if (q === this.last) return this.tex; this.last = q;
    const g = this.cv.getContext("2d")!, W = this.cv.width, H = this.cv.height; g.fillStyle = this.bg; g.fillRect(0, 0, W, H);
    if (this.lined) { g.strokeStyle = "rgba(90,130,200,0.35)"; g.lineWidth = 2; for (let y = 40; y < H; y += 28) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); } g.strokeStyle = "rgba(220,80,80,0.45)"; g.beginPath(); g.moveTo(48, 0); g.lineTo(48, H); g.stroke(); }
    const total = this.strokes.reduce((s, st) => s + st.pts.length - 1, 0); let left = q * total;
    g.lineCap = "round"; g.lineJoin = "round";
    for (const st of this.strokes) { if (left <= 0) break; const n = st.pts.length - 1, m = Math.min(n, left); left -= n;
      if (st.fill && m >= n) { g.fillStyle = st.fill; g.beginPath(); st.pts.forEach(([x, y], i) => (i ? g.lineTo(x * W, y * H) : g.moveTo(x * W, y * H))); g.fill(); }
      g.strokeStyle = st.col ?? "#2a2a30"; g.lineWidth = (st.w ?? 4) * (W / 512); g.beginPath();
      for (let i = 0; i <= Math.floor(m); i++) { const [x, y] = st.pts[i]; i ? g.lineTo(x * W, y * H) : g.moveTo(x * W, y * H); }
      const fr = m - Math.floor(m); if (fr > 0 && Math.floor(m) < n) { const [x0, y0] = st.pts[Math.floor(m)], [x1, y1] = st.pts[Math.floor(m) + 1]; g.lineTo((x0 + (x1 - x0) * fr) * W, (y0 + (y1 - y0) * fr) * H); }
      g.stroke(); }
    if (this.extra) this.extra(g, q);
    this.tex.needsUpdate = true; return this.tex;
  }
  /** position (0..1) de la pointe du crayon pour k */
  tip(k: number): [number, number] { const total = this.strokes.reduce((s, st) => s + st.pts.length - 1, 0); let left = Math.min(1, Math.max(0, k)) * total;
    for (const st of this.strokes) { const n = st.pts.length - 1; if (left <= n) { const i = Math.min(n - 1, Math.floor(left)), f = left - i; const [x0, y0] = st.pts[i], [x1, y1] = st.pts[i + 1]; return [x0 + (x1 - x0) * f, y0 + (y1 - y0) * f]; } left -= n; }
    const l = this.strokes[this.strokes.length - 1].pts; return l[l.length - 1]; }
}

// formes de base pour les dessins (coordonnées 0..1)
export const rect = (x: number, y: number, w: number, h: number, col?: string, wd?: number, fill?: string): Stroke => ({ pts: [[x, y], [x + w, y], [x + w, y + h], [x, y + h], [x, y]], col, w: wd, fill });
export const line = (x0: number, y0: number, x1: number, y1: number, col?: string, wd?: number): Stroke => ({ pts: [[x0, y0], [x1, y1]], col, w: wd });
export const circ = (cx: number, cy: number, r: number, col?: string, wd?: number, n = 20, a0 = 0, a1 = Math.PI * 2, ry = r, fill?: string): Stroke =>
  ({ pts: [...Array(n + 1).keys()].map((i) => { const a = a0 + (a1 - a0) * i / n; return [cx + Math.cos(a) * r, cy + Math.sin(a) * ry] as [number, number]; }), col, w: wd, fill });
export const poly = (pts: [number, number][], col?: string, wd?: number, fill?: string): Stroke => ({ pts, col, w: wd, fill });

/** miettes de gomme / éclaboussures : points animés (t) */
export class Crumbs {
  pts: THREE.Points; private n: number;
  constructor(n: number, col: string, size: number) { this.n = n; const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    this.pts = new THREE.Points(g, new THREE.PointsMaterial({ color: col, size, sizeAttenuation: true })); this.pts.frustumCulled = false; }
  /** nuage qui tombe derrière un point d'émission (x, y, z), largeur w */
  set(t: number, o: THREE.Vector3, w: number, h: number, back: number) { const a = this.pts.geometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < this.n; i++) { const life = (t * 0.8 + hash(i, 1)) % 1; a.setXYZ(i, o.x + (hash(i, 2) - 0.5) * w, o.y + h * (1 - life * life) * hash(i, 3), o.z - back * (0.2 + life * 0.8) * hash(i, 4)); }
    a.needsUpdate = true; }
}
