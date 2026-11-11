// L'Arène : la clairière (sol, herbes, forêt de pins, falaises), le dôme-ciel, la tour noire et son socle, le ravitaillement
// en éventail, les 24 disques et candidats (cartes 2D du style bridge), le haut-parleur, les drones, les écrans
// (ciel, tour) et l'insert « poignet + bracelet ». update(id, f, cam) pose tout pour le plan id à l'image f.
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { staticFile } from "remotion";
import { Batch, Kit, kitClone, lam } from "../bridge/build";
import { grassHD, rep, rng, ctex } from "../bridge/paint";
import { TONE, CHAR, untone } from "../bridge/shade";
import { NOINK } from "../bridge/ink";
import { Pool, Actor, Fx, SU } from "../bridge/cast";
import { Pen, bodyFront, Outfit, Expr, INK, SKINS } from "../bridge/toon";
import { FPS, RING, HERO, BOY, HERO_POSE, WAKE, discPos, dronePos, shotAt, camAt, counter, countdown, AT, SPEAKER, SKYSCREEN, TOWER_SCREEN, WATER, V3, smooth } from "./story";
import { DAWN } from "./look";

// ---------------- assets ----------------
const NATURE = ["tree_pineTallA", "tree_pineTallB", "tree_pineTallC", "tree_pineTallD", "tree_pineRoundA", "tree_pineRoundC", "tree_pineDefaultA",
  "tree_pineDefaultB", "rock_largeA", "rock_largeC", "rock_largeE", "cliff_large_rock", "stump_old", "stump_round", "log", "grass_large", "grass",
  "plant_bushLarge", "mushroom_red"];
const SURVIVAL = ["box", "box-open", "box-large", "box-large-open", "barrel", "barrel-open", "chest", "bedroll", "bedroll-packed", "bottle",
  "bottle-large", "bucket", "tool-axe", "tool-pickaxe", "tool-hammer", "tool-shovel", "resource-planks", "metal-panel-screws"];
/** couleurs de forêt sombre (remplace le turquoise des kits) */
const RECOL: Record<string, string> = { leafsDark: "#2f5f3f", leafs: "#3b6b45", woodBarkDark: "#5a3d2e", woodBark: "#6a4a34", grass: "#5c8a46", dirt: "#77706a" };
let kitP: Promise<Kit> | null = null;
export const loadKit = () => {
  if (!kitP) {
    const l = new GLTFLoader();
    const one = (dir: string, n: string) => l.loadAsync(staticFile(`arene/kenney/${dir}/${n}.glb`)).then((g) => [n, g.scene] as const).catch(() => [n, null] as const);
    kitP = Promise.all([...NATURE.map((n) => one("nature", n)), ...SURVIVAL.map((n) => one("survival", n))])
      .then((list) => {
        for (const [, sc] of list) sc?.traverse((o) => { const m = (o as THREE.Mesh).material as THREE.MeshStandardMaterial | undefined;
          if (m && !Array.isArray(m) && RECOL[m.name]) { m.color.set(RECOL[m.name]); m.name = "ar_" + m.name; } });
        return Object.fromEntries(list.filter((e) => e[1]).map(([n, s]) => [n, s!])) as Kit;
      });
  }
  return kitP;
};

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const M4 = (x: number, y: number, z: number, yaw = 0, s = 1, tilt = 0) =>
  new THREE.Matrix4().compose(V(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(tilt, yaw, 0, "YXZ")), V(s, s, s));
const boxes = new Map<THREE.Object3D, THREE.Box3>();
const boxOf = (o: THREE.Object3D) => { let b = boxes.get(o); if (!b) { b = new THREE.Box3().setFromObject(o); boxes.set(o, b); } return b; };
/** pose un modèle du kit dans un Batch, base au sol, hauteur h */
const put = (b: Batch, kit: Kit, name: string, x: number, y: number, z: number, h: number, yaw = 0, tilt = 0) => {
  const o = kit[name]; if (!o) return;
  const bx = boxOf(o), s = h / Math.max(0.01, bx.max.y - bx.min.y);
  b.addObject(o, M4(x, y - bx.min.y * s, z, yaw, s, tilt));
};
const solid = (key: string, color: string, extra: THREE.MeshLambertMaterialParameters = {}) => lam("ar_" + key, () => ({ color, ...extra }));
const glow = (r: number, g: number, b: number) => { const m = new THREE.MeshBasicMaterial({ color: new THREE.Color(r, g, b), toneMapped: true }); return m; };

// ---------------- texture peinte procédurale (bruit monde, aucun UV requis) ----------------
const NOISE_GLSL = `varying vec3 vWP;
float h3(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float vn(vec3 x){ vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(h3(i), h3(i + vec3(1,0,0)), f.x), mix(h3(i + vec3(0,1,0)), h3(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(h3(i + vec3(0,0,1)), h3(i + vec3(1,0,1)), f.x), mix(h3(i + vec3(0,1,1)), h3(i + vec3(1,1,1)), f.x), f.y), f.z); }`;
/** amp = force des taches, sc = taille (1/m), grad = assombrissement vers le pied (feuillages) */
const painted = (m: THREE.Material, amp: number, sc: number, grad: number, bands = 0) => {
  const prev = m.onBeforeCompile.bind(m);
  m.onBeforeCompile = (sh, r) => {
    prev(sh, r);
    sh.vertexShader = "varying vec3 vWP;\n" + sh.vertexShader.replace("#include <project_vertex>", "#include <project_vertex>\nvWP = (modelMatrix * vec4(transformed, 1.0)).xyz;");
    sh.fragmentShader = NOISE_GLSL + "\n" + sh.fragmentShader.replace("#include <color_fragment>", `#include <color_fragment>
      { float n = 0.6 * vn(vWP * ${sc.toFixed(3)}) + 0.4 * vn(vWP * ${(sc * 3.1).toFixed(3)});
        diffuseColor.rgb *= mix(1.0 - ${amp.toFixed(3)}, 1.0 + ${(amp * 0.6).toFixed(3)}, n) * mix(1.0 - ${grad.toFixed(3)}, 1.08, smoothstep(0.0, 12.0, vWP.y))
        * (1.0 - ${bands.toFixed(3)} * smoothstep(0.55, 0.95, fract(vWP.y * 0.85 + 0.3 * n))); }`);
  };
  m.customProgramCacheKey = () => `painted_${amp}_${sc}_${grad}_${bands}`;
  m.needsUpdate = true;
};

// ---------------- textures peintes ----------------
const metalTex = () => ctex("ar_metal2", 512, 512, (g, r) => {
  g.fillStyle = "#15171d"; g.fillRect(0, 0, 512, 512);
  for (let y = 0; y < 512; y += 128) for (let x = 0; x < 512; x += 128) {
    const l = 13 + r() * 14; g.fillStyle = `hsl(222, 14%, ${l}%)`; g.fillRect(x + 4, y + 4, 120, 120);
    const gr = g.createLinearGradient(x, y, x, y + 128); gr.addColorStop(0, "rgba(255,255,255,0.10)"); gr.addColorStop(0.5, "rgba(0,0,0,0)"); gr.addColorStop(1, "rgba(0,0,0,0.25)"); g.fillStyle = gr; g.fillRect(x + 4, y + 4, 120, 120);
    g.fillStyle = "rgba(200,215,235,0.22)"; g.fillRect(x + 4, y + 4, 120, 3); g.fillStyle = "rgba(0,0,0,0.5)"; g.fillRect(x + 4, y + 121, 120, 3);
    for (let k = 0; k < 3; k++) { g.fillStyle = `rgba(120,40,30,${0.08 + r() * 0.1})`; g.fillRect(x + 10 + r() * 100, y + 20 + r() * 60, 2 + r() * 3, 20 + r() * 50); }
    g.fillStyle = "#14161c"; for (const [a, c] of [[10, 10], [114, 10], [10, 114], [114, 114]]) { g.beginPath(); g.arc(x + a, y + c, 4, 0, 7); g.fill(); }
  }
  g.strokeStyle = "rgba(255,255,255,0.05)"; for (let i = 0; i < 40; i++) { g.beginPath(); const x = r() * 512, y = r() * 512; g.moveTo(x, y); g.lineTo(x + 30 * r(), y + 3); g.stroke(); }
});
const discTex = (n: number) => ctex("ar_disc" + n, 256, 256, (g) => {
  g.fillStyle = "#eef0f4"; g.beginPath(); g.arc(128, 128, 124, 0, 7); g.fill();   // socles blancs (décision utilisateur)
  g.strokeStyle = "#8d939f"; g.lineWidth = 10; g.stroke();
  g.fillStyle = "#2a2e38"; g.font = "bold 92px DejaVu Sans, sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(String(n), 128, 134);
});
const speakerTex = () => ctex("ar_speaker", 256, 256, (g) => {
  g.fillStyle = "#1c1f26"; g.fillRect(0, 0, 256, 256);
  g.fillStyle = "#0b0c10"; for (let y = 30; y < 230; y += 18) for (let x = 30; x < 230; x += 18) { g.beginPath(); g.arc(x, y, 6, 0, 7); g.fill(); }
  g.strokeStyle = "#3a3f4c"; g.lineWidth = 8; g.strokeRect(8, 8, 240, 240);
});
/** dôme : dégradé d'aube + trame hexagonale très légère (le « plafond peint ») */
const skyMat = () => new THREE.ShaderMaterial({
  side: THREE.BackSide, depthWrite: false, fog: false,
  uniforms: { cTop: { value: untone(DAWN.top) }, cMid: { value: untone(DAWN.mid) }, cHor: { value: untone(DAWN.hor) }, cWarm: { value: untone(DAWN.warm) }, sunDir: { value: V(0, 0.2, -1).normalize() } },
  vertexShader: `varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); gl_Position.z = gl_Position.w; }`,
  fragmentShader: `uniform vec3 cTop,cMid,cHor,cWarm,sunDir; varying vec3 vD;
  float hexLine(vec2 p){ p *= 9.0; vec2 r = vec2(1.0,1.732); vec2 h = r*0.5; vec2 a = mod(p,r)-h; vec2 b = mod(p-h,r)-h; vec2 g = dot(a,a)<dot(b,b)?a:b;
    vec2 q = abs(g); float d = max(dot(q, normalize(vec2(1.0,1.732))), q.x); return smoothstep(0.47,0.5,d); }
  void main(){ float e = clamp(vD.y,0.0,1.0);
    vec3 c = mix(cHor, cMid, smoothstep(0.0,0.18,e)); c = mix(c, cTop, smoothstep(0.18,0.7,e));
    float w = pow(max(dot(normalize(vec3(vD.x,0.0,vD.z)), normalize(vec3(sunDir.x,0.0,sunDir.z))),0.0), 6.0) * (1.0-smoothstep(0.0,0.25,e));
    c = mix(c, cWarm, 0.75*w);
    vec2 uv = vec2(atan(vD.x,vD.z), asin(vD.y)*1.6);
    c += vec3(0.02,0.035,0.05) * hexLine(uv) * smoothstep(0.15,0.5,e);
    gl_FragColor = vec4(c,1.0); }`,
});

// ---------------- écrans (canevas, émissifs) ----------------
class Screen {
  cv = document.createElement("canvas"); tex: THREE.CanvasTexture; mesh: THREE.Mesh; last = "";
  constructor(w: number, h: number, mw: number, mh: number, gain = 1.6) {
    this.cv.width = w; this.cv.height = h;
    this.tex = new THREE.CanvasTexture(this.cv); this.tex.colorSpace = THREE.SRGBColorSpace;
    const m = new THREE.MeshBasicMaterial({ map: this.tex, color: new THREE.Color(gain, gain, gain), transparent: true, fog: false });
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(mw, mh), m); this.mesh.layers.set(NOINK);
  }
  draw(key: string, fn: (g: CanvasRenderingContext2D, w: number, h: number) => void) {
    if (key === this.last) return;
    this.last = key; const g = this.cv.getContext("2d")!; g.clearRect(0, 0, this.cv.width, this.cv.height); fn(g, this.cv.width, this.cv.height); this.tex.needsUpdate = true;
  }
}
const FONT = "DejaVu Sans, Liberation Sans, sans-serif";

// ---------------- personnages ----------------
const SUITS = ["#4f5d4a", "#5b5148", "#46566b", "#6a4f4f", "#55604f", "#4a4a5a"];
const outfitOf = (i: number): Outfit => i === BOY
  ? { jacket: "#2f3a4f", pants: "#2b2f3a", boots: "#1d1a20", hat: "hair", hair: "#6b3a24", dress: "#34405a", skin: SKINS[2] } // la fille qui murmure
  : { jacket: SUITS[i % 6], pants: "#2e3036", boots: "#1d1a20", hat: i % 3 === 0 ? null : "hair", hair: ["#2a201a", "#5a3b2a", "#8a6a3a", "#1d1a20"][i % 4], skin: SKINS[i % 4], build: i % 7 === 3 ? "stout" : "adult" };
const HERO_OUTFIT: Outfit = { jacket: "#3a4458", pants: "#2b2f3a", boots: "#1d1a20", hat: "hair", hair: "#3a2a20", skin: "#f2c49c" }; // assorti à l'insert poignet
const EXPR: Expr[] = ["nervous", "stern", "shock", "neutral", "nervous", "dazed"];
const hh = (i: number, s = 0) => { const v = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return v - Math.floor(v); };
const tierOf = (d: number): [number, number, number] => (d < 3.5 ? [1080, 1800, 1.8] : d < 12 ? [600, 1000, 1] : [300, 500, 0.5]);

/** insert poignet + bracelet (POV), dessiné sur une carte tenue devant l'objectif */
const drawWrist = (g: CanvasRenderingContext2D, n: number, tug: number) => {
  const W = 1000, H = 1000; g.clearRect(0, 0, W, H);
  g.save(); g.translate(500 + tug * 40, 560); g.rotate(-0.38 + tug * 0.05);
  // manche
  g.fillStyle = "#3a4458"; g.strokeStyle = INK; g.lineWidth = 16;
  g.beginPath(); g.moveTo(-560, -150); g.lineTo(-140, -150); g.lineTo(-120, 150); g.lineTo(-560, 160); g.closePath(); g.fill(); g.stroke();
  // avant-bras + main
  g.fillStyle = "#f2c49c";
  g.beginPath(); g.moveTo(-150, -120); g.bezierCurveTo(120, -125, 300, -105, 390, -80); g.bezierCurveTo(470, -60, 470, 70, 390, 90);
  g.bezierCurveTo(300, 110, 120, 125, -150, 120); g.closePath(); g.fill(); g.stroke();
  g.fillStyle = "rgba(190,120,110,0.25)"; g.beginPath(); g.ellipse(120, 70, 220, 38, 0, 0, 7); g.fill();
  // bracelet
  g.fillStyle = "#59606e"; g.beginPath(); g.roundRect(-20, -150, 150, 300, 26); g.fill(); g.stroke();
  g.fillStyle = "#7c8494"; g.fillRect(-4, -146, 20, 292);
  g.fillStyle = "#0d1218"; g.beginPath(); g.roundRect(0, -95, 110, 190, 14); g.fill(); g.lineWidth = 8; g.stroke();
  g.save(); g.translate(55, 0); g.rotate(Math.PI / 2);
  g.shadowColor = "#4fe3f0"; g.shadowBlur = 30; g.fillStyle = "#7ff3ff"; g.font = `bold 118px ${FONT}`; g.textAlign = "center"; g.textBaseline = "middle";
  g.fillText(String(n), 0, 6); g.restore();
  g.fillStyle = "#d6dbe4"; for (const y of [-128, 128]) { g.beginPath(); g.arc(55, y, 8, 0, 7); g.fill(); }
  g.restore();
};

/** avant-bras du héros levé devant la poitrine, bracelet face caméra (espace 600 x 1000, personnage assis) */
const heroArm = (g: CanvasRenderingContext2D, k: number, lit: boolean) => {
  if (k <= 0) return;
  const y = 905 - 140 * k, x0 = 200, x1 = 352 + 10 * k, yy = y - 18 * k;
  g.save(); g.lineCap = "round"; g.lineJoin = "round";
  g.strokeStyle = INK; g.lineWidth = 62; g.beginPath(); g.moveTo(x0, y + 40); g.lineTo(x1, yy); g.stroke();
  g.strokeStyle = "#3a4458"; g.lineWidth = 48; g.beginPath(); g.moveTo(x0, y + 40); g.lineTo(x1 - 40, yy + 10); g.stroke();
  g.fillStyle = "#f2c49c"; g.strokeStyle = INK; g.lineWidth = 7; g.beginPath(); g.ellipse(x1 + 4, yy - 2, 30, 25, -0.3, 0, 7); g.fill(); g.stroke();
  // bracelet : boîtier métal + écran noir, « 24 » cyan quand il s'allume
  const bx = x1 - 52, by = yy + 4; g.save(); g.translate(bx, by); g.rotate(-0.25);
  g.fillStyle = "#59606e"; g.beginPath(); g.roundRect(-30, -38, 60, 76, 10); g.fill(); g.lineWidth = 6; g.stroke();
  g.fillStyle = "#0d1218"; g.beginPath(); g.roundRect(-22, -28, 44, 56, 6); g.fill(); g.lineWidth = 3; g.stroke();
  if (lit) { g.shadowColor = "#4fe3f0"; g.shadowBlur = 16; g.fillStyle = "#7ff3ff"; g.font = `bold 30px ${FONT}`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("24", 0, 2); }
  g.restore(); g.restore();
};

/** cheveux longs dessinés derrière la tête et les épaules (la fille), dans l'espace 600 x 1000 du dessin */
const longHair = (p: Pen, col: string) => {
  const g = p.g; g.save();
  g.beginPath(); g.moveTo(300, 170); g.bezierCurveTo(470, 175, 460, 420, 440, 600); g.quadraticCurveTo(372, 640, 300, 612);
  g.quadraticCurveTo(228, 640, 160, 600); g.bezierCurveTo(140, 420, 130, 175, 300, 170); g.closePath();
  g.fillStyle = col; g.fill(); g.lineWidth = 12; g.strokeStyle = INK; g.stroke();
  g.strokeStyle = "rgba(0,0,0,0.18)"; g.lineWidth = 6; for (const x of [200, 250, 350, 400]) { g.beginPath(); g.moveTo(x, 330); g.quadraticCurveTo(x + (x < 300 ? -12 : 12), 470, x, 590); g.stroke(); }
  g.restore();
};

export class World {
  root = new THREE.Group();
  sun: THREE.DirectionalLight; private hemi: THREE.HemisphereLight; private fog: THREE.Fog;
  private pool = new Pool(); private actors: Actor[] = []; private blobs: Fx[] = [];
  private sky: THREE.Mesh; private skyScreen: Screen; private towerScreen: Screen; private wrist: Screen;
  private ringTop = new THREE.Group(); private drones: THREE.Group[] = []; private grassFg: THREE.Group;
  private slitMats: THREE.MeshBasicMaterial[] = [];
  constructor(kit: Kit) {
    const R = this.root, r = rng(7);
    this.hemi = new THREE.HemisphereLight("#9fb3d9", "#3b3a3a", 0.5); R.add(this.hemi);
    this.sun = new THREE.DirectionalLight("#ffd2a8", 2.4);
    this.sun.castShadow = true; this.sun.shadow.mapSize.set(2048, 2048); R.add(this.sun, this.sun.target);
    this.fog = new THREE.Fog("#5a6b84", 30, 220);
    this.sky = new THREE.Mesh(new THREE.SphereGeometry(900, 48, 24), skyMat()); this.sky.layers.set(NOINK); this.sky.renderOrder = -1; R.add(this.sky);

    const b = new Batch();
    // sol : herbe peinte assombrie, cercle de terre battue autour de la tour
    const gm = solid("ground", "#7d8f5c", { map: rep(grassHD(), 60, 60) });
    b.add(new THREE.CircleGeometry(420, 64).rotateX(-Math.PI / 2), gm);
    b.add(new THREE.CircleGeometry(15, 48).rotateX(-Math.PI / 2).translate(0, 0.01, 0), solid("dirt", "#6f5f4a"));
    // forêt : anneau de pins + falaises
    const pines = ["tree_pineTallA", "tree_pineTallB", "tree_pineTallC", "tree_pineTallD", "tree_pineRoundA", "tree_pineRoundC", "tree_pineDefaultA", "tree_pineDefaultB"];
    // forêt en secteurs (culling par la caméra) : anneau proche avec ombres, anneau lointain sans ombres
    const SECT = 16, near = Array.from({ length: SECT }, () => new Batch()), far = Array.from({ length: SECT }, () => new Batch());
    const sectOf = (a: number) => Math.floor((((a % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)) / (2 * Math.PI) * SECT) % SECT;
    for (let i = 0; i < 340; i++) {
      const a = r() * Math.PI * 2, d = 40 + Math.pow(r(), 0.8) * 115, isNear = d < 72;
      put((isNear ? near : far)[sectOf(a)], kit, pines[i % pines.length], Math.sin(a) * d, 0, Math.cos(a) * d, 9 + r() * 9, r() * 6);
    }
    const grassB = Array.from({ length: SECT }, () => new Batch());
    // rochers, souches, buissons dans la clairière
    for (let i = 0; i < 60; i++) {
      const a = r() * Math.PI * 2, d = 26 + r() * 16, n = ["rock_largeA", "rock_largeC", "rock_largeE", "stump_old", "stump_round", "log", "plant_bushLarge"][i % 7];
      if (Math.hypot(Math.sin(a) * d - HERO[0], Math.cos(a) * d - HERO[2]) < 9 || (Math.sin(a) * d > -9 && Math.sin(a) * d < 5 && Math.cos(a) * d > 26 && Math.cos(a) * d < 36)) continue;
      put(b, kit, n, Math.sin(a) * d, 0, Math.cos(a) * d, n.startsWith("rock") ? 0.8 + r() * 1.6 : 0.5 + r() * 0.6, r() * 6);
    }
    for (let i = 0; i < 520; i++) { const a = r() * Math.PI * 2, d = 6 + r() * 40; put(grassB[sectOf(a)], kit, i % 3 ? "grass_large" : "grass", Math.sin(a) * d, 0, Math.cos(a) * d, 0.35 + r() * 0.4, r() * 6); }
    // socle octogonal à trois marches + tour en plaques décalées
    const mtx = rep(metalTex(), 1, 1);
    const met = solid("metal", "#6a7388", { map: mtx, emissive: new THREE.Color("#5a6a8c"), emissiveMap: mtx, emissiveIntensity: 0.9 }), dark = solid("dark", "#363c4a", { emissive: new THREE.Color("#141a26"), emissiveIntensity: 1 });
    [[7.5, 0], [6.2, 0.35], [5.0, 0.7]].forEach(([rad, y]) => b.add(new THREE.CylinderGeometry(rad, rad, 0.35, 8).translate(0, y + 0.175, 0), met));
    let y = 1.05, w = 3.8;
    for (let k = 0; k < 7; k++) {
      const h = 1.9 - k * 0.12;
      b.add(new THREE.BoxGeometry(w, h, w * 0.8).rotateY(k * 0.11).translate(0, y + h / 2, 0), k % 2 ? dark : met);
      y += h; w *= 0.82;
    }
    b.add(new THREE.ConeGeometry(w * 0.7, 2.2, 4).rotateY(Math.PI / 4).translate(0, y + 1.1, 0), dark);
    this.ringTop.position.set(0, y + 0.4, 0);
    // fente rouge (émissive, au-dessus du seuil de bloom) sur les quatre faces
    const slit = glow(3.2, 0.25, 0.2); this.slitMats.push(slit);
    for (let k = 0; k < 4; k++) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(0.16, y - 1.4, 0.05), slit);
      const a = (k * Math.PI) / 2; m.position.set(Math.sin(a) * 1.6, 1.2 + (y - 1.4) / 2, Math.cos(a) * 1.6); m.rotation.y = a; m.layers.set(NOINK); R.add(m);
    }
    // anneau de caméras au sommet
    const ringM = new THREE.Mesh(new THREE.TorusGeometry(1.4, 0.12, 8, 32).rotateX(Math.PI / 2), dark); this.ringTop.add(ringM);
    for (let k = 0; k < 8; k++) { const c = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.3, 0.45), met); const a = (k / 8) * Math.PI * 2; c.position.set(Math.sin(a) * 1.4, -0.2, Math.cos(a) * 1.4); c.rotation.y = a; this.ringTop.add(c);
      const led = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), slit); led.position.set(Math.sin(a) * 1.62, -0.2, Math.cos(a) * 1.62); led.layers.set(NOINK); this.ringTop.add(led); }
    R.add(this.ringTop);
    // ravitaillement en éventail (gradient de valeur = gradient de danger), seed fixe, rien d'aligné
    const items = ["box", "box-open", "box-large", "box-large-open", "barrel", "barrel-open", "chest", "bedroll", "bedroll-packed", "bottle", "bottle-large", "bucket", "tool-axe", "tool-pickaxe", "tool-hammer", "tool-shovel", "resource-planks"];
    const H: Record<string, number> = { "box": 0.55, "box-open": 0.5, "box-large": 0.9, "box-large-open": 0.85, "barrel": 0.95, "barrel-open": 0.9, "chest": 0.6, "bedroll": 0.25, "bedroll-packed": 0.45, "bottle": 0.3, "bottle-large": 0.42, "bucket": 0.35, "tool-axe": 0.75, "tool-pickaxe": 0.8, "tool-hammer": 0.45, "tool-shovel": 1.0, "resource-planks": 0.35 };
    const sp = solid("spear", "#6b4a2e"), tip = solid("steel", "#a9b0bd"), bowM = solid("bow", "#5a3b22");
    for (let i = 0; i < 230; i++) {
      const u = Math.pow(r(), 1.7), d = 5.6 + u * 17, a = r() * Math.PI * 2, x = Math.sin(a) * d, z = Math.cos(a) * d;
      if (Math.hypot(x - WATER[0], z - WATER[2]) < 1.8 || (Math.abs(x - 1.6) < 1.2 && z > WATER[2] && z < WATER[2] + 3)) continue;
      const n = d < 9 ? items[Math.floor(r() * 7)] : items[Math.floor(r() * items.length)];
      const pile = d < 9 && r() < 0.35 ? H[n] * 0.8 : 0;
      put(b, kit, n, x, pile, z, H[n] * (0.9 + r() * 0.3), r() * 6, n.startsWith("tool") && r() < 0.5 ? 1.45 : (r() < 0.15 ? 0.5 : 0));
    }
    // lances plantées, arcs, râteliers au pied de la tour
    for (let i = 0; i < 46; i++) {
      const d = 5.8 + Math.pow(r(), 1.4) * 10, a = r() * Math.PI * 2, x = Math.sin(a) * d, z = Math.cos(a) * d, tl = (r() - 0.5) * 0.6;
      const m = M4(x, 0, z, r() * 6, 1, tl);
      b.add(new THREE.CylinderGeometry(0.025, 0.03, 2.1, 5).translate(0, 1.05, 0), sp, m);
      b.add(new THREE.ConeGeometry(0.06, 0.28, 4).translate(0, 2.24, 0), tip, m);
    }
    for (let i = 0; i < 14; i++) {
      const d = 6 + r() * 6, a = r() * Math.PI * 2, m = M4(Math.sin(a) * d, 0.05, Math.cos(a) * d, r() * 6, 1, Math.PI / 2 - 0.05);
      b.add(new THREE.TorusGeometry(0.62, 0.025, 4, 16, Math.PI * 0.9).rotateZ(Math.PI * 0.05), bowM, m);
    }
    for (let k = 0; k < 4; k++) {
      const a = k * (Math.PI / 2) + 0.4, x = Math.sin(a) * 6.2, z = Math.cos(a) * 6.2, m = M4(x, 1.05, z, a);
      b.add(new THREE.BoxGeometry(2.4, 0.08, 0.08).translate(0, 0.5, 0), sp, m); b.add(new THREE.BoxGeometry(2.4, 0.08, 0.08).translate(0, -0.4, 0), sp, m);
      for (let j = 0; j < 6; j++) { const mm = M4(x, 1.05, z, a); mm.multiply(M4(-1.0 + j * 0.4, -1.0, 0.05, 0, 1, 0.12)); b.add(new THREE.CylinderGeometry(0.022, 0.022, 2.2, 5).translate(0, 1.1, 0), sp, mm); b.add(new THREE.ConeGeometry(0.05, 0.25, 4).translate(0, 2.3, 0), tip, mm); }
    }
    // caisses d'eau sous la lumière rouge (insert)
    for (let k = 0; k < 6; k++) put(b, kit, k % 2 ? "bottle-large" : "bottle", WATER[0] + (k % 3) * 0.32 - 0.3, 0.5, WATER[2] + Math.floor(k / 3) * 0.3 - 0.1, 0.4, k);
    put(b, kit, "box-large-open", WATER[0], 0, WATER[2], 0.5, 0.3);
    // disques numérotés
    for (let i = 0; i < 24; i++) {
      const p = discPos(i), m = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.8, 0.08, 24), new THREE.MeshLambertMaterial({ map: discTex(i + 1) }));
      m.position.set(p[0], 0.04, p[2]); m.rotation.y = Math.atan2(p[0], p[2]); m.receiveShadow = true; R.add(m);
    }
    // haut-parleur sur un tronc derrière le héros
    put(b, kit, "tree_pineTallA", SPEAKER[0], 0, SPEAKER[2] + 0.45, 14, 0.3);
    const spk = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.55, 0.22), [dark, dark, dark, dark, new THREE.MeshLambertMaterial({ map: speakerTex() }), dark]);
    spk.position.set(...SPEAKER); spk.rotation.y = Math.PI; R.add(spk);
    const led = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 6), slit); led.position.set(SPEAKER[0] + 0.2, SPEAKER[1] + 0.2, SPEAKER[2] - 0.12); led.layers.set(NOINK); R.add(led);
    b.build(R, true);
    const sub = (bs: Batch[], cast: boolean) => bs.forEach((x) => { const g = new THREE.Group(); x.build(g, cast); g.traverse((o) => { const m = o as THREE.Mesh; if (m.isMesh) { m.geometry.computeBoundingSphere(); m.frustumCulled = true; } }); R.add(g); });
    sub(near, true); sub(far, false); sub(grassB, false);
    R.traverse((o) => { const m = o as THREE.Mesh; if (m.isMesh && !m.layers.isEnabled(NOINK)) m.receiveShadow = true; });
    // texture peinte : feuillages / écorces / herbe (taches + pied plus sombre), métal de la tour (taches fines)
    const done = new Set<THREE.Material>();
    R.traverse((o) => { const m = o as THREE.Mesh; if (!m.isMesh || Array.isArray(m.material)) return; const mt = m.material as THREE.MeshLambertMaterial;
      if (done.has(mt) || !(mt as THREE.MeshLambertMaterial).isMeshLambertMaterial) return; done.add(mt);
      const hex = "#" + mt.color.getHexString();
      if ((globalThis as { __noPaint?: boolean }).__noPaint) return;
      if (["#2f5f3f", "#3b6b45"].includes(hex)) painted(mt, 0.55, 0.9, 0.55, 0.35);
      else if (["#5a3d2e", "#6a4a34"].includes(hex)) painted(mt, 0.45, 2.4, 0.15);
      else if (hex === "#5c8a46" || hex === "#7d8f5c") painted(mt, 0.3, 0.35, 0);
      else if (hex === "#6a7388" || hex === "#363c4a") painted(mt, 0.4, 3.0, 0.25, 0.2); });
    // drones
    for (let k = 0; k < 5; k++) {
      const g = new THREE.Group(), body = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.22, 0.7), dark); g.add(body);
      for (const [dx, dz] of [[0.55, 0.55], [-0.55, 0.55], [0.55, -0.55], [-0.55, -0.55]]) { const rr = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.03, 12), met); rr.position.set(dx, 0.14, dz); g.add(rr); }
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6), slit); eye.position.set(0, -0.12, 0.33); eye.layers.set(NOINK); g.add(eye);
      R.add(g); this.drones.push(g);
    }
    // herbes de premier plan pour le réveil (floues)
    this.grassFg = new THREE.Group();
    for (let i = 0; i < 14; i++) { const c = kitClone(kit, i % 2 ? "grass_large" : "grass", 0.35 + r() * 0.3); if (c) { c.position.set(-0.6 + r() * 1.8, 0, HERO[2] - 0.6 - r() * 1.8); c.rotation.y = r() * 6; this.grassFg.add(c); } }
    R.add(this.grassFg);
    // écrans
    this.skyScreen = new Screen(1600, 800, 120, 60, 1.25); this.skyScreen.mesh.position.set(...SKYSCREEN); R.add(this.skyScreen.mesh);
    this.towerScreen = new Screen(512, 512, 1.5, 1.5, 2.2); this.towerScreen.mesh.position.set(...TOWER_SCREEN); R.add(this.towerScreen.mesh);
    this.wrist = new Screen(1000, 1000, 1, 1, 1.0); (this.wrist.mesh.material as THREE.MeshBasicMaterial).depthTest = false; this.wrist.mesh.renderOrder = 10; R.add(this.wrist.mesh);
    for (let i = 0; i < 24; i++) { this.actors.push(new Actor(R)); this.blobs.push(new Fx(R)); }
  }

  /** pose le monde pour le plan id à l'image f ; renvoie le point visé */
  update(id: number, f: number, cam: THREE.PerspectiveCamera, scene: THREE.Scene) {
    const t = f / FPS, c = camAt(id, f), s = shotAt(f);
    cam.position.set(...c.pos); cam.up.set(0, 1, 0); cam.lookAt(...c.look); cam.rotateZ(c.roll);
    if (cam.fov !== c.fov) { cam.fov = c.fov; cam.updateProjectionMatrix(); }
    cam.layers.enable(NOINK); cam.updateMatrixWorld();
    // lumière d'aube : soleil bas derrière la forêt, figé
    const L = DAWN, sunDir = V(Math.sin(L.az), Math.sin(L.el), -Math.cos(L.az)).normalize();
    const focus = V(...c.look);
    this.sun.color.set(L.sunCol); this.sun.intensity = L.sunI; this.hemi.intensity = L.hemiI;
    this.sun.position.copy(focus).addScaledVector(sunDir, 200); this.sun.target.position.copy(focus);
    const Rr = Math.min(90, Math.max(18, cam.position.distanceTo(focus) * 1.3 + 10)), sc = this.sun.shadow.camera;
    sc.left = -Rr; sc.right = Rr; sc.top = Rr; sc.bottom = -Rr; sc.near = 20; sc.far = 420; sc.updateProjectionMatrix();
    this.sun.shadow.bias = -0.0004; this.sun.shadow.normalBias = 0.02 * (Rr / 12);
    TONE.uLitCol.value.set(...L.lit); TONE.uShadeCol.value.set(...L.shade); TONE.uShadeLift.value.set(...L.lift);
    TONE.uLambert.value = 0.35; TONE.uSideK.value = 0.84; TONE.uTerm.value = 0.15; TONE.uBounce.value.set(0, 0, 0); TONE.uSat.value = L.sat;
    CHAR.uCharTint.value.set(...L.charTint); CHAR.uCharShade.value = 0.82; CHAR.uGrad.value = 0.09; CHAR.uBodyGrad.value = 0.22; CHAR.uSideTint.value.set(0.82, 0.84, 0.98);
    (this.sky.material as THREE.ShaderMaterial).uniforms.sunDir.value.copy(sunDir);
    this.sky.position.copy(cam.position);
    untone(L.fog, this.fog.color); this.fog.near = L.fogNear; this.fog.far = L.fogFar; scene.fog = this.fog; scene.background = null;
    // fente rouge qui pulse légèrement ; anneau qui tourne
    const pulse = 0.85 + 0.15 * Math.sin(t * 2.2) + (t > AT.beep0 ? 0.35 * Math.max(0, 1 - ((t - AT.beep0) % 1) * 4) : 0);
    for (const m of this.slitMats) m.color.setRGB(3.2 * pulse, 0.25 * pulse, 0.2 * pulse);
    this.ringTop.rotation.y = t * 0.25;
    this.drones.forEach((g, k) => { g.position.set(...dronePos(k, t)); g.rotation.y = -(k * 1.3 + t * 0.12); });
    this.grassFg.visible = id === 21;
    // écran du ciel (visible du réveil à la fin des paris)
    this.skyScreen.mesh.visible = [4, 5, 6, 7, 23, 24, 25].includes(id);
    this.skyScreen.mesh.lookAt(cam.position.x, SKYSCREEN[1], cam.position.z);
    const skyMode = t < AT.welcome ? "logo" : t < AT.count24 ? "welcome" : t < AT.bets ? "24" : "bets";
    this.skyScreen.draw(skyMode + (skyMode === "bets" ? Math.floor(t * 2) : ""), (g, w, h) => {
      g.fillStyle = "rgba(8,14,24,0.82)"; g.fillRect(0, 0, w, h); g.strokeStyle = "#4fe3f0"; g.lineWidth = 10; g.strokeRect(14, 14, w - 28, h - 28);
      g.fillStyle = "#e9fbff"; g.textAlign = "center"; g.textBaseline = "middle";
      if (skyMode === "logo" || skyMode === "welcome") { g.font = `bold 120px ${FONT}`; g.fillText(skyMode === "logo" ? "L'ARÈNE" : "BIENVENUE", w / 2, h / 2 - 70); g.font = `bold 70px ${FONT}`; g.fillText(skyMode === "logo" ? "ÉDITION 37" : "DANS L'ARÈNE", w / 2, h / 2 + 80); }
      else if (skyMode === "24") { g.font = `bold 360px ${FONT}`; g.fillText("24", w / 2, h / 2 + 20); }
      else { g.font = `bold 70px ${FONT}`; g.fillText("PARIS EN COURS", w / 2, 110); g.font = `bold 54px ${FONT}`; g.textAlign = "left";
        for (let k = 0; k < 6; k++) { const n = (k * 7 + 3) % 24 + 1, odd = (2 + ((k * 13 + Math.floor(t * 2)) % 37) / 4).toFixed(1); g.fillText(`N° ${n}`, w / 2 - 300, 230 + k * 92); g.textAlign = "right"; g.fillText(`× ${odd}`, w / 2 + 300, 230 + k * 92); g.textAlign = "left"; } }
    });
    // écran de la tour : compte à rebours
    const cd = countdown(t);
    this.towerScreen.draw("cd" + cd, (g, w, h) => {
      g.fillStyle = "#0a0b0f"; g.fillRect(0, 0, w, h); g.fillStyle = "#ff4a3d"; g.shadowColor = "#ff2a20"; g.shadowBlur = 40;
      g.font = `bold 300px ${FONT}`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(String(cd), w / 2, h / 2 + 10);
    });
    // insert poignet
    const wristOn = s.insert === "wrist";
    this.wrist.mesh.visible = wristOn;
    if (wristOn) {
      const tug = id === 27 ? smooth((t - AT.tug) / 0.25) * (1 - smooth((t - AT.tug - 0.6) / 0.3)) : 0;
      this.wrist.draw(`w${counter(t)}_${tug.toFixed(2)}`, (g) => drawWrist(g, counter(t), tug));
      const fwd = V(0, 0, -1).applyQuaternion(cam.quaternion), up = V(0, 1, 0).applyQuaternion(cam.quaternion);
      const dist = 0.5, hgt = 2 * dist * Math.tan((cam.fov * Math.PI) / 360);
      this.wrist.mesh.position.copy(cam.position).addScaledVector(fwd, dist).addScaledVector(up, -hgt * 0.12);
      this.wrist.mesh.quaternion.copy(cam.quaternion); this.wrist.mesh.scale.setScalar(hgt * 0.95);
    }
    // candidats
    const right = V(1, 0, 0).applyQuaternion(cam.quaternion);
    for (let i = 0; i < 24; i++) {
      const A = this.actors[i], Bl = this.blobs[i];
      if (id === 1) { // vue du ciel : tout le monde est couché à plat, tête vers le centre ; toi, tu ouvres les yeux
        const p0 = discPos(i), d0 = cam.position.distanceTo(V(p0[0], 0.1, p0[2])), [w0, h0, k0] = tierOf(d0), o0 = i === 0 ? HERO_OUTFIT : outfitOf(i);
        const eyes = i === 0 ? (f >= WAKE.open ? 0 : f >= WAKE.half ? 0.5 : 1) : 1;
        const lf = { mode: "stand", expr: (i === 0 && f >= WAKE.open ? "shock" : "neutral") as Expr, blink: eyes, light: -2.4, seed: i === 0 ? 3 : (i % 7) + 1, facing: 0 as const, look: 0 };
        A.r = this.pool.req(`L|${i}|${JSON.stringify(lf)}`, w0, h0, k0, (pen: Pen) => { if (i === BOY) longHair(pen, o0.hair!); bodyFront(pen, o0, lf as never); });
        A.mesh.position.set(p0[0], 0.16, p0[2]); A.mesh.rotation.set(-Math.PI / 2, (i / 24) * Math.PI * 2, 0, "YXZ"); A.mesh.visible = true;
        Bl.mesh.visible = false; continue;
      }
      if (i === 0 && id !== 29) { A.mesh.visible = false; Bl.mesh.visible = false; continue; } // le héros (« tu ») : caméra subjective, sauf au plan 29
      const p = discPos(i), d = cam.position.distanceTo(V(p[0], 1.2, p[2])), [w, h, k] = tierOf(d);
      const st = AT.stand0 + hh(i, 4) * 3, standing = t > st || f >= 445 || (id === 22 && i === 21);
      const ex = f >= 1765 ? (i % 2 ? "nervous" : "stern") : t < 20 ? (i % 3 ? "dazed" : "shock") : EXPR[i % 6];
      const blink = (Math.floor(t * FPS) + Math.floor(hh(i, 9) * 60)) % Math.floor(40 + hh(i, 2) * 30) < 4;
      const o = outfitOf(i), look = id === 11 && i === BOY ? -0.6 : 0;
      const fo = { mode: standing ? "stand" : "sit", expr: (i === BOY && id === 11 ? "nervous" : ex) as Expr, blink, light: -2.4, seed: (i % 7) + 1, facing: 0 as const, look };
      if (i === 0) { // toi, vu de face : regard droit devant, puis tête baissée vers le bracelet levé
        const dn = Math.round(smooth((f - HERO_POSE.down[0]) / (HERO_POSE.down[1] - HERO_POSE.down[0])) * 6) / 6;
        const ar = Math.round(smooth((f - HERO_POSE.arm[0]) / (HERO_POSE.arm[1] - HERO_POSE.arm[0])) * 8) / 8, lit = f >= HERO_POSE.lit;
        const hf = { mode: "sit", expr: (dn > 0.5 ? "nervous" : "neutral") as Expr, blink: dn > 0 ? false : blink, light: -2.4, seed: 3, facing: 0 as const, look: 0, faceDown: dn };
        A.r = this.pool.req(`H|${JSON.stringify(hf)}|${ar}|${lit}`, w, h, k, (pen: Pen) => { bodyFront(pen, HERO_OUTFIT, hf as never); heroArm(pen.g, ar, lit); });
      } else
      A.r = this.pool.req(`F|${i}|${JSON.stringify(fo)}`, w, h, k, (pen: Pen) => { if (i === BOY) longHair(pen, o.hair!); bodyFront(pen, o, fo as never); });
      const yaw = Math.atan2(cam.position.x - p[0], cam.position.z - p[2]);
      A.mesh.position.set(p[0], 0.08 - (standing ? 0 : 0.02), p[2]); A.mesh.rotation.set(0, yaw, 0); A.mesh.visible = true;
      Bl.r = this.pool.req("blob|c", 128, 128, 1, (pen: Pen) => { const g = pen.g; const gr = g.createRadialGradient(64, 64, 4, 64, 64, 62); gr.addColorStop(0, "rgba(40,40,70,0.55)"); gr.addColorStop(1, "rgba(40,40,70,0)"); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); });
      Bl.mesh.position.set(p[0], 0.09, p[2]); Bl.mesh.rotation.set(-Math.PI / 2, 0, 0); Bl.mesh.scale.set(0.9, 0.6, 1); Bl.use(true); Bl.mesh.visible = true;
      void right;
    }
    const tP = performance.now(); const nNew = (this.pool as unknown as { live: Map<string, unknown> }).live.size;
    this.pool.flush();
    if ((globalThis as { __prof?: boolean }).__prof) console.warn(`[prof] pool flush ${(performance.now() - tP).toFixed(0)} ms, live ${nNew}`);
    for (const a of this.actors) a.bind();
    for (const bl of this.blobs) { const tx = bl.r?.tex; if (tx) { bl.soft.map = tx; bl.mesh.material = bl.soft; } }
    void SU; void RING;
    return focus;
  }
}
