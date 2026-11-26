// Le Dernier Appel : effets animés déterministes (fonction du temps t) — flammes, fumée, braises, neige.
// Flammes et fumée = panneaux tournés vers la caméra (shader de bruit fractal), braises et neige = points.
import * as THREE from "three";
import { hash } from "./tex";

const NOISE = /* glsl */`
  float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f); return mix(mix(h(i), h(i+vec2(1,0)), f.x), mix(h(i+vec2(0,1)), h(i+vec2(1,1)), f.x), f.y); }
  float fbm(vec2 p){ float a = 0.5, s = 0.0; for (int i = 0; i < 5; i++) { s += a * n(p); p *= 2.03; a *= 0.5; } return s; }`;
const VS = /* glsl */`varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;

/** flamme : langue de feu qui monte, cœur jaune-blanc, bords orange-rouge, additif */
const flameMat = (seed: number) => new THREE.ShaderMaterial({
  transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false,
  uniforms: { uT: { value: 0 }, uSeed: { value: seed }, uK: { value: 1 } },
  vertexShader: VS,
  fragmentShader: NOISE + /* glsl */`
    uniform float uT, uSeed, uK; varying vec2 vUv;
    void main(){
      vec2 p = vUv; float y = p.y;
      float x = (p.x - 0.5) * 2.0;
      float turb = fbm(vec2(p.x * 3.0 + uSeed, y * 2.2 - uT * 2.4 + uSeed)) - 0.5;
      float w = (1.0 - y) * (0.85 + 0.3 * turb);
      float shape = smoothstep(w, w - 0.35, abs(x + turb * 0.6 * y));
      float lick = fbm(vec2(p.x * 5.0 - uSeed, y * 4.0 - uT * 3.5));
      float a = shape * smoothstep(0.0, 0.12, y) * (0.55 + 0.6 * lick) * smoothstep(1.0, 0.55, y + turb * 0.3);
      vec3 c = mix(vec3(1.0, 0.18, 0.02), vec3(1.0, 0.55, 0.08), smoothstep(0.1, 0.55, a));
      c = mix(c, vec3(1.0, 0.92, 0.6), smoothstep(0.65, 1.0, a));
      a *= uK; gl_FragColor = vec4(c * a * 2.2, a);
    }`,
});
/** fumée : volute sombre qui roule (fondu normal) */
const smokeMat = (seed: number, col: string) => new THREE.ShaderMaterial({
  transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: false,
  uniforms: { uT: { value: 0 }, uSeed: { value: seed }, uOp: { value: 0.8 }, uCol: { value: new THREE.Color(col) }, uGlow: { value: new THREE.Color("#000000") } },
  vertexShader: VS,
  fragmentShader: NOISE + /* glsl */`
    uniform float uT, uSeed, uOp; uniform vec3 uCol, uGlow; varying vec2 vUv;
    void main(){
      vec2 c = vUv - 0.5; float r = length(c) * 2.0;
      float d = fbm(vUv * 2.6 + vec2(uSeed, uSeed * 0.7 - uT * 0.12)) + 0.5 * fbm(vUv * 6.0 - vec2(uT * 0.08, uSeed));
      float a = smoothstep(1.0, 0.25, r + (0.6 - d) * 0.8) * uOp;
      vec3 col = uCol * (0.7 + 0.5 * d) + uGlow * (1.0 - vUv.y) * 0.9;
      gl_FragColor = vec4(col, a);
    }`,
});

type Bill = { m: THREE.Mesh; base: THREE.Vector3; size: number; seed: number };
export class Fire {
  root = new THREE.Group(); flames: Bill[] = []; smoke: Bill[] = []; embers: THREE.Points; lights: THREE.PointLight[] = [];
  private emPos: Float32Array; private emBase: { p: THREE.Vector3; r: number }[] = [];
  constructor(spots: { p: THREE.Vector3; s: number }[], smokeCol = "#1c1a1c", smokeN = 1.0, lightPos: THREE.Vector3[] = []) {
    const pl = new THREE.PlaneGeometry(1, 1);
    spots.forEach((sp, i) => {
      for (let k = 0; k < 3; k++) { const seed = i * 7.3 + k * 2.1, m = new THREE.Mesh(pl, flameMat(seed)); m.renderOrder = 12; m.frustumCulled = false;
        const s = sp.s * (0.75 + 0.5 * hash(i * 3 + k, 1)); this.root.add(m);
        this.flames.push({ m, base: sp.p.clone().add(new THREE.Vector3((hash(i, k + 2) - 0.5) * sp.s * 0.6, s * 0.45, (hash(i, k + 5) - 0.5) * sp.s * 0.3)), size: s, seed }); }
      const ns = Math.round(3 * smokeN);
      for (let k = 0; k < ns; k++) { const seed = i * 3.7 + k * 1.3, m = new THREE.Mesh(pl, smokeMat(seed, smokeCol)); m.renderOrder = 11; m.frustumCulled = false; this.root.add(m);
        this.smoke.push({ m, base: sp.p.clone(), size: sp.s * 2.4, seed }); }
      for (let k = 0; k < 18; k++) this.emBase.push({ p: sp.p.clone(), r: sp.s });
    });
    this.emPos = new Float32Array(this.emBase.length * 3);
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(this.emPos, 3));
    this.embers = new THREE.Points(g, new THREE.PointsMaterial({ color: "#ffb25a", size: 0.06, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false }));
    this.embers.frustumCulled = false; this.root.add(this.embers);
    for (const p of lightPos) { const l = new THREE.PointLight("#ff7a2a", 0, 14, 1.6); l.position.copy(p); this.root.add(l); this.lights.push(l); }
  }
  /** k : intensité 0-1 ; cam : caméra (panneaux tournés vers elle) */
  set(t: number, cam: THREE.Camera, k = 1, light = 30) {
    this.root.visible = k > 0.001; if (!this.root.visible) return;
    for (const f of this.flames) { const m = f.m.material as THREE.ShaderMaterial; m.uniforms.uT.value = t; m.uniforms.uK.value = k;
      const s = f.size * (0.92 + 0.1 * Math.sin(t * 7 + f.seed)); f.m.scale.set(s * 0.75, s * 1.35, 1); f.m.position.copy(f.base); f.m.quaternion.copy(cam.quaternion); }
    for (const s of this.smoke) { const ph = ((t * 0.18 + s.seed * 0.37) % 1 + 1) % 1, m = s.m.material as THREE.ShaderMaterial;
      m.uniforms.uT.value = t; m.uniforms.uOp.value = 0.85 * k * Math.sin(ph * Math.PI) ** 0.7;
      s.m.position.copy(s.base).add(new THREE.Vector3(Math.sin(s.seed) * 0.6 * ph * s.size * 0.4, s.size * (0.3 + ph * 1.6), Math.cos(s.seed) * 0.3 * ph));
      const sc = s.size * (0.7 + ph * 1.1); s.m.scale.set(sc, sc, 1); s.m.quaternion.copy(cam.quaternion); }
    this.emBase.forEach((e, i) => { const ph = ((t * (0.35 + hash(i, 3) * 0.3) + hash(i, 4)) % 1);
      this.emPos[i * 3] = e.p.x + (hash(i, 5) - 0.5) * e.r * 1.2 + Math.sin(t * 2 + i) * 0.15 * ph;
      this.emPos[i * 3 + 1] = e.p.y + ph * e.r * 4.5; this.emPos[i * 3 + 2] = e.p.z + (hash(i, 6) - 0.5) * e.r * 0.8 + Math.cos(t * 1.7 + i) * 0.15 * ph; });
    (this.embers.geometry.getAttribute("position") as THREE.BufferAttribute).needsUpdate = true;
    (this.embers.material as THREE.PointsMaterial).opacity = 0.95 * k;
    this.lights.forEach((l, i) => { l.intensity = light * k * (0.75 + 0.25 * Math.sin(t * 13 + i * 2.1) * Math.sin(t * 5.3 + i)); });
  }
}

/** fumée d'intérieur : nappes sous le plafond + volutes au sol, lueur orange par dessous */
export class Haze {
  root = new THREE.Group(); private b: Bill[] = [];
  constructor(box: THREE.Box3, n = 24, col = "#2a2624", seed = 0) {
    const pl = new THREE.PlaneGeometry(1, 1), sz = box.getSize(new THREE.Vector3());
    for (let i = 0; i < n; i++) { const m = new THREE.Mesh(pl, smokeMat(seed + i * 1.9, col)); m.renderOrder = 11; m.frustumCulled = false; this.root.add(m);
      const y = box.min.y + sz.y * (0.45 + 0.55 * hash(i, seed + 1));
      this.b.push({ m, base: new THREE.Vector3(box.min.x + sz.x * hash(i, seed + 2), y, box.min.z + sz.z * hash(i, seed + 3)), size: Math.max(sz.x, 1.2) * (0.9 + 0.8 * hash(i, seed + 4)), seed: seed + i }); }
  }
  set(t: number, cam: THREE.Camera, op: number, glow = "#000000") {
    this.root.visible = op > 0.001; if (!this.root.visible) return;
    for (const s of this.b) { const m = s.m.material as THREE.ShaderMaterial; m.uniforms.uT.value = t; m.uniforms.uOp.value = op * (0.6 + 0.4 * Math.sin(t * 0.4 + s.seed)); m.uniforms.uGlow.value.set(glow);
      s.m.position.copy(s.base).add(new THREE.Vector3(Math.sin(t * 0.25 + s.seed) * 0.4, Math.sin(t * 0.3 + s.seed * 2) * 0.08, Math.cos(t * 0.2 + s.seed) * 0.4));
      s.m.scale.set(s.size, s.size * 0.7, 1); s.m.quaternion.copy(cam.quaternion); }
  }
}

/** neige qui tombe autour de la caméra */
export class Snow {
  pts: THREE.Points; private pos: Float32Array; private n: number;
  constructor(n = 2600) {
    this.n = n; this.pos = new Float32Array(n * 3); const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(this.pos, 3));
    const sprite = (() => { const c = document.createElement("canvas"); c.width = c.height = 64; const x = c.getContext("2d")!; const gr = x.createRadialGradient(32, 32, 0, 32, 32, 32);
      gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.45, "rgba(255,255,255,0.7)"); gr.addColorStop(1, "rgba(255,255,255,0)"); x.fillStyle = gr; x.fillRect(0, 0, 64, 64);
      const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
    this.pts = new THREE.Points(g, new THREE.PointsMaterial({ map: sprite, size: 0.07, transparent: true, opacity: 0.85, depthWrite: false, color: "#e8eeff", sizeAttenuation: true }));
    this.pts.frustumCulled = false; this.pts.renderOrder = 13;
  }
  set(t: number, cam: THREE.Vector3, on: boolean, R = 9, fall = 0.9) {
    this.pts.visible = on; if (!on) return;
    for (let i = 0; i < this.n; i++) { const hx = hash(i, 11), hy = hash(i, 12), hz = hash(i, 13);
      const y = ((hy * 2 * R - t * fall * (0.7 + 0.6 * hash(i, 14))) % (2 * R) + 2 * R) % (2 * R) - R;
      this.pos[i * 3] = cam.x + (hx - 0.5) * 2 * R + Math.sin(t * 0.8 + i) * 0.25; this.pos[i * 3 + 1] = cam.y + y; this.pos[i * 3 + 2] = cam.z + (hz - 0.5) * 2 * R + Math.cos(t * 0.6 + i) * 0.25; }
    (this.pts.geometry.getAttribute("position") as THREE.BufferAttribute).needsUpdate = true;
  }
}
