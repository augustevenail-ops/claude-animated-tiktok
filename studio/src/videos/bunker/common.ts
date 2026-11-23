// Briques communes : matériaux, boîtes, arbres boules, nuage noir (instances), matériau « pétrification » progressive.
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { hash, leafTex, stoneTex } from "./tex";

export const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const M = new Map<string, THREE.MeshStandardMaterial>();
export const std = (key: string, p: THREE.MeshStandardMaterialParameters) => { let m = M.get(key); if (!m) { m = new THREE.MeshStandardMaterial({ roughness: 0.8, metalness: 0, ...p }); M.set(key, m); } return m; };
export const col = (c: string, extra: THREE.MeshStandardMaterialParameters = {}) => std("c_" + c + JSON.stringify(extra), { color: c, ...extra });
export const glow = (c: string, i = 1.5) => std(`g_${c}_${i}`, { color: c, emissive: c, emissiveIntensity: i, roughness: 1 });
export const mesh = (g: THREE.BufferGeometry, m: THREE.Material | THREE.Material[], x = 0, y = 0, z = 0, shadow = true) => {
  const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.castShadow = shadow; o.receiveShadow = true; return o;
};
/** boîte posée par ses coins */
export const box = (p: THREE.Object3D, m: THREE.Material | THREE.Material[], x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, shadow = true) => {
  const o = mesh(new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0), m, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2, shadow); p.add(o); return o;
};
export const rbox = (p: THREE.Object3D, m: THREE.Material, w: number, h: number, d: number, x: number, y: number, z: number, r = 0.1) => { const o = mesh(new RoundedBoxGeometry(w, h, d, 2, r), m, x, y, z); p.add(o); return o; };
/** texture répétée selon la taille de la face */
export const tiled = (t: THREE.Texture, rx: number, ry: number) => { const c = t.clone(); c.repeat.set(rx, ry); c.needsUpdate = true; return c; };

/** arbre boule (tronc brun + 3 sphères de feuillage) */
const leafGeo = new THREE.IcosahedronGeometry(1, 2);
export const tree = (p: THREE.Object3D, x: number, z: number, s = 1, seed = 0, y = 0) => {
  const g = new THREE.Group(); g.position.set(x, y, z); g.scale.setScalar(s); p.add(g);
  g.add(mesh(new THREE.CylinderGeometry(0.18, 0.24, 2.2, 8), col("#7a4a2a"), 0, 1.1, 0));
  const lm = std("leaf", { color: "#ffffff", map: leafTex(), roughness: 0.9 });
  for (let i = 0; i < 3; i++) { const l = mesh(leafGeo, lm, (hash(seed, i) - 0.5) * 0.9, 2.6 + i * 0.35, (hash(seed, i + 5) - 0.5) * 0.9); l.scale.setScalar(0.9 - i * 0.15 + hash(seed, i + 9) * 0.2); g.add(l); }
  return g;
};
export const palm = (p: THREE.Object3D, x: number, z: number, s = 1, y = 0) => {
  const g = new THREE.Group(); g.position.set(x, y, z); g.scale.setScalar(s); p.add(g);
  g.add(mesh(new THREE.CylinderGeometry(0.16, 0.26, 4, 8), col("#8a6238"), 0, 2, 0));
  for (let i = 0; i < 7; i++) { const l = mesh(new THREE.ConeGeometry(0.35, 2.4, 4), col("#3fae3a"), 0, 4, 0); l.rotation.set(0, (i / 7) * Math.PI * 2, 0); l.geometry = l.geometry.clone().rotateZ(-Math.PI / 2 - 0.35).translate(1.1, 0, 0); g.add(l); }
  return g;
};

/** nuage noir : bouffées low-poly gris anthracite aux creux violets, plafond continu au-dessus ; dérive lente */
export class Cloud {
  mesh: THREE.InstancedMesh; cap: THREE.Mesh; group = new THREE.Group(); n: number; base: { x: number; y: number; z: number; s: number; sp: number }[] = [];
  w: number; d: number; t = 0;
  constructor(w: number, d: number, n = 700, cx = 0, cz = 0, smin = 6, smax = 15) {
    this.n = n; this.w = w; this.d = d;
    const g = new THREE.IcosahedronGeometry(1, 2);
    const m = new THREE.ShaderMaterial({ uniforms: { uL: { value: new THREE.Vector3(0.35, -0.45, 0.82).normalize() } },
      vertexShader: `varying vec3 vN; varying vec3 vC; varying float vY;
        void main() { mat4 im = modelMatrix * instanceMatrix; vec4 wp = im * vec4(position, 1.0); vN = normalize(mat3(im) * normal); vC = instanceColor; vY = position.y;
          gl_Position = projectionMatrix * viewMatrix * wp; }`,
      fragmentShader: `uniform vec3 uL; varying vec3 vN; varying vec3 vC; varying float vY;
        void main() { float l = 0.38 + 0.62 * max(dot(vN, uL), 0.0); float top = max(vN.y, 0.0) * 0.25; float rim = pow(1.0 - abs(vN.z), 3.0) * 0.12;
          vec3 shadow = vec3(0.12, 0.11, 0.18);
          vec3 c = mix(shadow * vC * 2.2, vC, l) + top * vC + rim * vec3(0.55, 0.45, 0.85);
          gl_FragColor = vec4(c, 1.0);
          #include <colorspace_fragment>
        }` });
    this.mesh = new THREE.InstancedMesh(g, m, n); this.mesh.castShadow = false; this.mesh.receiveShadow = false;
    const c = new THREE.Color();
    for (let i = 0; i < n; i++) {
      const s = smin + hash(i, 4) * (smax - smin);
      this.base.push({ x: cx + (hash(i, 1) - 0.5) * w, y: hash(i, 3) * 18, z: cz + (hash(i, 2) - 0.5) * d, s, sp: 0.6 + hash(i, 6) * 1.2 });
      const k = hash(i, 5); c.set(k < 0.12 ? "#463e5c" : k < 0.5 ? "#36343c" : k < 0.85 ? "#44424b" : "#545160"); this.mesh.setColorAt(i, c);
    }
    this.cap = mesh(new THREE.PlaneGeometry(w * 1.3, d * 1.3).rotateX(Math.PI / 2), col("#14121a", { side: THREE.DoubleSide }), cx, 18, cz, false);
    this.group.add(this.mesh, this.cap);
  }
  private q = new THREE.Quaternion(); private e = new THREE.Euler(); private mtx = new THREE.Matrix4(); private v = new THREE.Vector3(); private sc = new THREE.Vector3();
  /** h : altitude du dessous du nuage ; t : temps (s) ; vit : vitesse de dérive */
  update(h: number, t: number, vit = 1, boil = 0, hole = 0, hx = 0, hz = 0) {
    this.group.position.y = h;
    for (let i = 0; i < this.n; i++) {
      const b = this.base[i]; let x = b.x + t * vit * b.sp * 1.4; const half = this.w / 2; x = ((x + half) % this.w + this.w) % this.w - half;
      const wob = Math.sin(t * 0.5 * b.sp + i) * 0.6 + boil * Math.sin(t * 3 + i * 1.3) * 2;
      this.v.set(x, b.y + wob, b.z + Math.sin(t * 0.2 + i) * 0.8);
      this.e.set(i * 0.7 + t * 0.03 * b.sp, i * 1.3, 0); this.q.setFromEuler(this.e);
      let s = b.s * (1 + 0.04 * Math.sin(t * 0.7 + i));
      if (hole > 0) { const dd = Math.hypot(this.v.x - hx, this.v.z - hz); s *= Math.min(1, Math.max(0, (dd - hole) / 120)); }
      this.sc.set(s, s * 0.62, s);
      this.mtx.compose(this.v, this.q, this.sc); this.mesh.setMatrixAt(i, this.mtx);
    }
    this.mesh.instanceMatrix.needsUpdate = true; this.cap.visible = hole <= 0;
  }
}

/** matériau pétrifié progressif : la pierre gagne là où dot(pos monde, axe) < seuil (liseré sombre au front) */
export type Petrify = { thr: { value: number }; axis: { value: THREE.Vector3 } };
export const petrifyUniforms = (axis = V(1, 0, 0)): Petrify => ({ thr: { value: -1e9 }, axis: { value: axis.normalize() } });
const stoneMats = new Map<string, THREE.Material>();
export const petrified = (m: THREE.Material, u: Petrify, key: string) => {
  const k = key + "_" + m.uuid; let s = stoneMats.get(k); if (s) return s;
  const c = (m as THREE.MeshStandardMaterial).clone();
  c.onBeforeCompile = (sh) => {
    sh.uniforms.uThr = u.thr; sh.uniforms.uAxis = u.axis; sh.uniforms.uStone = { value: stoneTex() };
    sh.vertexShader = sh.vertexShader.replace("#include <common>", "#include <common>\nvarying vec3 vWp; varying vec3 vWn;")
      .replace("#include <project_vertex>", "#include <project_vertex>\nvWp = (modelMatrix * vec4(transformed, 1.0)).xyz; vWn = normalize(mat3(modelMatrix) * objectNormal);");
    sh.fragmentShader = sh.fragmentShader.replace("#include <common>", "#include <common>\nvarying vec3 vWp; varying vec3 vWn; uniform float uThr; uniform vec3 uAxis; uniform sampler2D uStone;")
      .replace("#include <map_fragment>", `#include <map_fragment>
        { vec3 an = abs(vWn); an /= (an.x + an.y + an.z);
          vec3 st = texture2D(uStone, vWp.yz * 0.35).rgb * an.x + texture2D(uStone, vWp.xz * 0.35).rgb * an.y + texture2D(uStone, vWp.xy * 0.35).rgb * an.z;
          float d = dot(vWp, uAxis) - uThr;
          float k = 1.0 - smoothstep(-0.05, 0.05, d);
          float edge = (1.0 - smoothstep(0.0, 0.35, abs(d))) * 0.55;
          diffuseColor.rgb = mix(diffuseColor.rgb, st, k) * (1.0 - edge); }`);
  };
  c.customProgramCacheKey = () => "petrify_" + key;
  stoneMats.set(k, c); return c;
};
/** applique la pétrification à tout un objet (matériaux clonés) */
export const petrifyObject = (o: THREE.Object3D, u: Petrify, key: string) => o.traverse((x) => {
  const m = x as THREE.Mesh; if (!m.isMesh) return;
  m.material = Array.isArray(m.material) ? m.material.map((mm) => petrified(mm, u, key)) : petrified(m.material, u, key);
});

/** dalle de lumière (« faux ciel ») au plafond */
export const panel = (p: THREE.Object3D, tex: THREE.Texture, w: number, d: number, x: number, y: number, z: number, i = 1.1) => {
  const m = new THREE.MeshStandardMaterial({ map: tex, emissiveMap: tex, emissive: "#ffffff", emissiveIntensity: i, roughness: 1, side: THREE.DoubleSide });
  const o = mesh(new THREE.PlaneGeometry(w, d).rotateX(Math.PI / 2), m, x, y, z, false); p.add(o); return o;
};
export const smooth = (x: number) => { const t = Math.min(1, Math.max(0, x)); return t * t * t * (t * (t * 6 - 15) + 10); };
export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
