// « Ne le regarde pas » : salon de nuit (murs, fenêtre sous la pluie, canapé, télé-miroir, lampadaire), les 3 personnages
// (toi, le faux père, le vrai père dehors), l'insert téléphone, les halos ambre. update(id, f, cam, scene) pose tout.
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { staticFile } from "remotion";
import { Batch, Kit, lam } from "../bridge/build";
import { ctex, rep } from "../bridge/paint";
import { TONE, CHAR, untone } from "../bridge/shade";
import { NOINK } from "../bridge/ink";
import { Pool, Actor } from "../bridge/cast";
import { Pen, bodyFront, Outfit, Expr } from "../bridge/toon";
import { FPS, YOU, FAKE, TV_Z, WINDOW, FATHER, LAMP, V3, shotAt, camAt, flashAt, phoneAt, smooth, clamp01 } from "./story";
import { NIGHT } from "./look";

const FONT = "DejaVu Sans, Liberation Sans, sans-serif";
const FURN = ["loungeSofa", "lampRoundFloor", "cabinetTelevision", "tableCoffee", "pottedPlant", "bookcaseClosed", "lampSquareTable", "books", "rugRectangle"];
let kitP: Promise<Kit> | null = null;
export const loadKit = () => {
  if (!kitP) {
    const l = new GLTFLoader();
    kitP = Promise.all(FURN.map((n) => l.loadAsync(staticFile(`arene/kenney/furniture/${n}.glb`)).then((g) => [n, g.scene] as const).catch(() => [n, null] as const)))
      .then((list) => { const rc = (n: string, col: string) => list.find((e) => e[0] === n)?.[1]?.traverse((o) => { const mm = (o as THREE.Mesh).material as THREE.Material | THREE.Material[] | undefined; if (!mm) return;
          for (const m of Array.isArray(mm) ? mm : [mm]) { const sm = m as THREE.MeshStandardMaterial; if (sm.color) { sm.color.set(col); sm.map = null; } } });
        rc("loungeSofa", "#4a3b33"); rc("cabinetTelevision", "#2b2420"); rc("rugRectangle", "#33292a"); return Object.fromEntries(list.filter((e) => e[1]).map(([n, s]) => [n, s!])) as Kit; });
  }
  return kitP;
};

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const M4 = (x: number, y: number, z: number, yaw = 0, s = 1) => new THREE.Matrix4().compose(V(x, y, z), new THREE.Quaternion().setFromAxisAngle(V(0, 1, 0), yaw), V(s, s, s));
const boxes = new Map<THREE.Object3D, THREE.Box3>();
const boxOf = (o: THREE.Object3D) => { let b = boxes.get(o); if (!b) { b = new THREE.Box3().setFromObject(o); boxes.set(o, b); } return b; };
/** pose un meuble du kit : base au sol, hauteur h, centré sur (x, z) */
const put = (b: Batch, kit: Kit, name: string, x: number, y: number, z: number, h: number, yaw = 0) => {
  const o = kit[name]; if (!o) return;
  const bx = boxOf(o), s = h / Math.max(0.01, bx.max.y - bx.min.y), cx = (bx.min.x + bx.max.x) / 2, cz = (bx.min.z + bx.max.z) / 2;
  const m = M4(x, y - bx.min.y * s, z, yaw, s); m.multiply(new THREE.Matrix4().makeTranslation(-cx, 0, -cz)); b.addObject(o, m);
};
const solid = (key: string, color: string, extra: THREE.MeshLambertMaterialParameters = {}) => lam("dr_" + key, () => ({ color, ...extra }));
const hash = (i: number, s = 0) => { const v = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return v - Math.floor(v); };

// ---------------- textures peintes ----------------
const plank = () => ctex("dr_plank", 512, 512, (g) => {
  g.fillStyle = "#4a3426"; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 8; i++) { const y = i * 64; g.fillStyle = `hsl(24,${28 + hash(i) * 12}%,${16 + hash(i, 2) * 8}%)`; g.fillRect(0, y + 2, 512, 60);
    g.strokeStyle = "rgba(0,0,0,0.5)"; g.lineWidth = 3; g.beginPath(); g.moveTo(0, y); g.lineTo(512, y); g.stroke();
    for (let k = 0; k < 5; k++) { g.strokeStyle = "rgba(0,0,0,0.13)"; g.lineWidth = 2; g.beginPath(); const yy = y + 8 + hash(i, k + 5) * 48; g.moveTo(hash(i, k) * 200, yy); g.bezierCurveTo(150, yy + 6, 300, yy - 6, 512, yy + 2); g.stroke(); }
    const x0 = hash(i, 9) * 480; g.strokeStyle = "rgba(0,0,0,0.5)"; g.lineWidth = 3; g.beginPath(); g.moveTo(x0, y); g.lineTo(x0, y + 64); g.stroke(); }
});
const wallpaper = () => ctex("dr_wall", 256, 256, (g) => {
  g.fillStyle = "#39455c"; g.fillRect(0, 0, 256, 256);
  for (let x = 0; x < 256; x += 32) { g.fillStyle = "rgba(255,255,255,0.045)"; g.fillRect(x, 0, 16, 256); }
  for (let i = 0; i < 70; i++) { g.fillStyle = `rgba(0,0,0,${0.03 + hash(i) * 0.05})`; g.beginPath(); g.arc(hash(i, 1) * 256, hash(i, 2) * 256, 10 + hash(i, 3) * 26, 0, 7); g.fill(); }
});
const glowTex = (rgb: string) => ctex("dr_glow" + rgb, 256, 256, (g) => {
  const r = g.createRadialGradient(128, 128, 0, 128, 128, 128); r.addColorStop(0, `rgba(${rgb},0.95)`); r.addColorStop(0.35, `rgba(${rgb},0.38)`); r.addColorStop(1, `rgba(${rgb},0)`);
  g.fillStyle = r; g.fillRect(0, 0, 256, 256);
});
const cityTex = () => ctex("dr_city", 1024, 512, (g) => {
  const gr = g.createLinearGradient(0, 0, 0, 512); gr.addColorStop(0, "#1a2540"); gr.addColorStop(1, "#0b101c"); g.fillStyle = gr; g.fillRect(0, 0, 1024, 512);
  for (let i = 0; i < 70; i++) { const w = hash(i, 4) < 0.15; g.fillStyle = w ? "rgba(120,220,255,0.7)" : `rgba(255,${160 + hash(i, 6) * 60},${70 + hash(i, 7) * 50},${0.35 + hash(i, 8) * 0.4})`;
    g.beginPath(); g.arc(hash(i, 1) * 1024, 200 + hash(i, 2) * 300, 3 + hash(i, 3) * 9, 0, 7); g.fill(); }
});

// ---------------- écrans canevas (pluie, téléphone) ----------------
class Screen {
  cv = document.createElement("canvas"); tex: THREE.CanvasTexture; mesh: THREE.Mesh; last = "";
  constructor(w: number, h: number, mw: number, mh: number, gain = 1) {
    this.cv.width = w; this.cv.height = h;
    this.tex = new THREE.CanvasTexture(this.cv); this.tex.colorSpace = THREE.SRGBColorSpace;
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(mw, mh), new THREE.MeshBasicMaterial({ map: this.tex, color: new THREE.Color(gain, gain, gain), transparent: true, fog: false, depthWrite: false }));
    this.mesh.layers.set(NOINK);
  }
  draw(key: string, fn: (g: CanvasRenderingContext2D, w: number, h: number) => void) {
    if (key === this.last) return;
    this.last = key; const g = this.cv.getContext("2d")!; g.clearRect(0, 0, this.cv.width, this.cv.height); fn(g, this.cv.width, this.cv.height); this.tex.needsUpdate = true;
  }
}
const drawRain = (g: CanvasRenderingContext2D, w: number, h: number, f: number, flash: number) => {
  g.fillStyle = `rgba(20,34,64,${0.18 + flash * 0.1})`; g.fillRect(0, 0, w, h);
  g.lineCap = "round";
  for (let i = 0; i < 90; i++) { // gouttes qui coulent (traits fins, légèrement obliques)
    const x = hash(i, 1) * w, sp = 0.004 + hash(i, 2) * 0.012, y = ((hash(i, 3) + f * sp) % 1) * h, len = 18 + hash(i, 4) * 60;
    g.strokeStyle = `rgba(190,215,255,${0.08 + hash(i, 5) * 0.2 + flash * 0.3})`; g.lineWidth = 1.2 + hash(i, 6) * 1.6;
    g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 4 * Math.sin(y * 0.03 + i), y + len * 0.5, x + 2 * Math.sin(y * 0.02 + i), y + len); g.stroke();
  }
  for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(210,228,255,${0.1 + hash(i, 8) * 0.15 + flash * 0.25})`; g.beginPath(); g.ellipse(hash(i, 9) * w, hash(i, 10) * h, 2.2 + hash(i, 11) * 2.5, 3 + hash(i, 11) * 4, 0, 0, 7); g.fill(); }
};
const drawPhone = (g: CanvasRenderingContext2D, w: number, h: number, p: ReturnType<typeof phoneAt>) => {
  g.clearRect(0, 0, w, h);
  g.fillStyle = "#07090d"; g.strokeStyle = "#1c222e"; g.lineWidth = 10; g.beginPath(); g.roundRect(20, 20, w - 40, h - 40, 70); g.fill(); g.stroke();
  g.fillStyle = "#0f1520"; g.beginPath(); g.roundRect(46, 46, w - 92, h - 92, 52); g.fill();
  g.fillStyle = "#e9fbff"; g.textBaseline = "middle"; g.textAlign = "left";
  g.fillStyle = "#1b2433"; g.fillRect(46, 90, w - 92, 120); g.fillStyle = "#e9fbff"; g.font = `bold 46px ${FONT}`; g.fillText("‹  Papa", 80, 150);
  g.fillStyle = "#4fe3f0"; g.beginPath(); g.arc(w - 110, 150, 30, 0, 7); g.fill();
  const wrap = (txt: string, x: number, y: number, maxW: number, color: string, bg: string) => {
    g.font = `38px ${FONT}`; const words = txt.split(" "), lines: string[] = []; let cur = "";
    for (const wd of words) { const t = cur ? cur + " " + wd : wd; if (g.measureText(t).width > maxW && cur) { lines.push(cur); cur = wd; } else cur = t; } lines.push(cur);
    const bh = lines.length * 52 + 36, bw = Math.min(maxW + 44, Math.max(...lines.map((l) => g.measureText(l).width)) + 44);
    g.fillStyle = bg; g.beginPath(); g.roundRect(x, y, bw, bh, 34); g.fill(); g.fillStyle = color; lines.forEach((l, i) => g.fillText(l, x + 22, y + 44 + i * 52)); return y + bh + 24;
  };
  let y = 260;
  if (p.first) y = wrap(p.first, 70, y, w - 230, "#ffffff", "#2a3142");
  if (p.mode === "bubble" || p.mode === "typing") { const t = p.text.slice(0, p.chars); if (t) wrap(t, 70, y, w - 230, "#ffffff", "#2a3142"); }
  if (p.mode === "typing" && p.chars < p.text.length) { g.fillStyle = "#4fe3f0"; g.fillRect(70, h - 190, 6, 50); }
  if (p.mode === "notif") {
    g.fillStyle = "rgba(240,246,255,0.92)"; g.beginPath(); g.roundRect(64, 300, w - 128, 190, 40); g.fill();
    g.fillStyle = "#101826"; g.font = `bold 48px ${FONT}`; g.fillText("Papa", 170, 360); g.font = `38px ${FONT}`; g.fillStyle = "#4a5668"; g.fillText("Nouveau message", 170, 420);
    g.fillStyle = "#4fe3f0"; g.beginPath(); g.arc(120, 395, 34, 0, 7); g.fill();
  }
};

// ---------------- personnages ----------------
const FATHER_OUTFIT: Outfit = { jacket: "#5b4a3b", pants: "#2a2d36", boots: "#1c1a1f", hat: "hair", hair: "#a3a3a3", skin: "#e6c29e", build: "adult" };
const FATHER_PALE: Outfit = { ...FATHER_OUTFIT, jacket: "#46505c", skin: "#cdd3d6" };
const YOU_OUTFIT: Outfit = { jacket: "#3a4458", pants: "#2b2f3a", boots: "#1d1a20", hat: "hair", hair: "#3a2a20", skin: "#f2c49c" };
const tierOf = (d: number): [number, number, number] => (d < 3.5 ? [1080, 1800, 1.8] : d < 12 ? [600, 1000, 1] : [300, 500, 0.5]);

export class World {
  root = new THREE.Group();
  sun: THREE.DirectionalLight; private hemi: THREE.HemisphereLight; private fog: THREE.Fog;
  private pool = new Pool(); private you: Actor; private fake: Actor; private dad: Actor; private rYou: Actor; private rFake: Actor;
  private rain: Screen; private phone: Screen; private hand: Screen; private glows: THREE.Mesh[] = []; private mirror: THREE.Mesh[] = [];
  constructor(kit: Kit) {
    const R = this.root;
    this.hemi = new THREE.HemisphereLight("#6f86c8", "#2a2020", 0.2); R.add(this.hemi);
    this.sun = new THREE.DirectionalLight(NIGHT.sunCol, NIGHT.sunI);
    this.sun.castShadow = true; this.sun.shadow.mapSize.set(2048, 2048); R.add(this.sun, this.sun.target);
    this.fog = new THREE.Fog(NIGHT.fog, NIGHT.fogNear, NIGHT.fogFar);

    const b = new Batch(), wallMat = solid("wall", "#ffffff", { map: rep(wallpaper(), 5, 2) });
    // pièce : 6,4 x 7,2 x 2,6 m (x : -3,2..3,2 ; z : -3,6..3,6) ; la fenêtre est dans le mur est (x = +3,2)
    b.add(new THREE.PlaneGeometry(6.4, 7.2).rotateX(-Math.PI / 2), solid("floor", "#ffffff", { map: rep(plank(), 3, 3.4) }));
    b.add(new THREE.PlaneGeometry(6.4, 7.2).rotateX(Math.PI / 2).translate(0, 2.6, 0), solid("ceil", "#1b2030"));
    const wall = (w: number, h: number, d: number, x: number, y: number, z: number) => b.add(new THREE.BoxGeometry(w, h, d).translate(x, y, z), wallMat);
    wall(6.8, 2.6, 0.2, 0, 1.3, -3.7); wall(6.8, 2.6, 0.2, 0, 1.3, 3.7); wall(0.2, 2.6, 7.2, -3.3, 1.3, 0);
    wall(0.2, 0.75, 7.2, 3.3, 0.375, 0); wall(0.2, 0.55, 7.2, 3.3, 2.325, 0); wall(0.2, 1.3, 3.4, 3.3, 1.4, -1.9); wall(0.2, 1.3, 1.8, 3.3, 1.4, 2.7);
    const dark = solid("frame", "#14161c"), curt = solid("curtain", "#4a2430");
    for (const [w, h, d, x, y, z] of [[0.08, 1.4, 0.08, 3.18, 1.4, -0.2], [0.08, 1.4, 0.08, 3.18, 1.4, 1.8], [0.08, 0.08, 2.1, 3.18, 0.75, 0.8], [0.08, 0.08, 2.1, 3.18, 2.05, 0.8]] as number[][])
      b.add(new THREE.BoxGeometry(w, h, d).translate(x, y, z), dark);
    for (const z of [-0.5, 2.1]) b.add(new THREE.BoxGeometry(0.16, 2.3, 0.42).translate(3.08, 1.3, z), curt);
    // tapis, meubles
    b.add(new THREE.PlaneGeometry(2.8, 2.0).rotateX(-Math.PI / 2).translate(0, 0.012, -0.5), solid("rug", "#33292a"));
    put(b, kit, "loungeSofa", 0, 0, 0.9, 0.82, Math.PI);
    put(b, kit, "tableCoffee", 0, 0, -1.0, 0.42, 0);
    put(b, kit, "cabinetTelevision", 0, 0, -3.3, 0.55, 0);
    put(b, kit, "lampRoundFloor", LAMP[0], 0, LAMP[2], 1.6, 0);
    put(b, kit, "bookcaseClosed", -3.0, 0, -1.6, 1.9, Math.PI / 2);
    put(b, kit, "pottedPlant", 2.7, 0, -3.0, 1.2, 0);
    b.add(new THREE.BoxGeometry(1.0, 0.05, 0.38).translate(-1.4, 0.82, 3.3), solid("console", "#2c2018"));
    for (const x of [-1.8, -1.0]) for (const z of [3.15, 3.45]) b.add(new THREE.BoxGeometry(0.05, 0.8, 0.05).translate(x, 0.4, z), solid("console", "#2c2018"));
    put(b, kit, "lampSquareTable", -1.7, 0.85, 3.3, 0.45, 0);
    b.add(new THREE.BoxGeometry(0.07, 0.015, 0.025).translate(-1.15, 0.86, 3.3), solid("keys", "#c9a24a"));
    // télé : cadre sombre + écran noir (le reflet est simulé par des cartes projetées sur le plan de l'écran)
    b.add(new THREE.BoxGeometry(1.28, 0.76, 0.07).translate(0, 1.0, TV_Z - 0.05), solid("tv", "#0c0d11"));
    b.build(R, true);
    const scr = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.68), new THREE.MeshBasicMaterial({ color: "#05060a", fog: false })); scr.position.set(0, 1.0, TV_Z); scr.layers.set(NOINK); R.add(scr);
    // halos ambre du lampadaire (additifs) : mur, sol, ampoule ; halo cyan faible de la fenêtre
    const addGlow = (rgb: string, w: number, h: number, pos: V3, rot: [number, number, number], op: number) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: glowTex(rgb), transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
      m.position.set(...pos); m.rotation.set(...rot); m.layers.set(NOINK); R.add(m); this.glows.push(m); return m;
    };
    addGlow("255,150,60", 3.6, 3.6, [-3.18, 1.55, LAMP[2]], [0, Math.PI / 2, 0], 0.85);
    addGlow("255,150,60", 3.6, 3.6, [LAMP[0] + 0.4, 0.02, LAMP[2]], [-Math.PI / 2, 0, 0], 0.45);
    addGlow("255,190,110", 0.9, 0.9, [LAMP[0], 1.5, LAMP[2]], [0, 0, 0], 0.9);
    addGlow("255,170,80", 1.2, 1.2, [-1.7, 1.15, 3.3], [0, 0, 0], 0.7);
    // dehors : ville floue derrière, pluie derrière le père et sur la vitre
    const city = new THREE.Mesh(new THREE.PlaneGeometry(16, 8), new THREE.MeshBasicMaterial({ map: cityTex(), fog: false })); city.position.set(8.5, 2.2, 0.8); city.rotation.y = -Math.PI / 2; city.layers.set(NOINK); R.add(city);
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(14, 16).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: "#0b111d", fog: false })); ground.position.set(10, -0.01, 0); ground.layers.set(NOINK); R.add(ground);
    this.rain = new Screen(512, 512, 2.2, 1.5); this.rain.mesh.position.set(3.14, 1.4, 0.8); this.rain.mesh.rotation.y = -Math.PI / 2; R.add(this.rain.mesh);
    this.phone = new Screen(720, 1280, 1, 1.78); (this.phone.mesh.material as THREE.MeshBasicMaterial).depthTest = false; this.phone.mesh.renderOrder = 10; R.add(this.phone.mesh);
    this.hand = new Screen(512, 512, 0.5, 0.5); R.add(this.hand.mesh);
    this.hand.draw("hand", (g) => { g.lineCap = "round"; g.strokeStyle = "#0b0c10"; g.lineWidth = 78; g.beginPath(); g.moveTo(40, 60); g.lineTo(250, 230); g.stroke();
      g.strokeStyle = "#5b4a3b"; g.lineWidth = 62; g.beginPath(); g.moveTo(40, 60); g.lineTo(230, 215); g.stroke();
      g.fillStyle = "#e6c29e"; g.strokeStyle = "#0b0c10"; g.lineWidth = 12; g.beginPath(); g.ellipse(310, 275, 80, 50, 0.7, 0, 7); g.fill(); g.stroke();
      for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(340 + i * 14, 300 + i * 6); g.lineTo(390 + i * 16, 360 + i * 8); g.stroke(); } });
    this.hand.mesh.visible = false;
    // miroir de la télé : fond du canapé reflété (quad sombre) ; les cartes reflétées sont des Actors
    const sofaRef = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ color: "#150d0b", transparent: true, opacity: 0.55, fog: false, depthWrite: false })); sofaRef.layers.set(NOINK); sofaRef.renderOrder = 0; R.add(sofaRef); this.mirror.push(sofaRef);
    this.you = new Actor(R); this.fake = new Actor(R); this.dad = new Actor(R); this.rYou = new Actor(R); this.rFake = new Actor(R);
    for (const a of [this.rYou, this.rFake]) { a.mesh.renderOrder = 2; a.mat.depthWrite = false; }
  }

  /** pose le monde pour le plan id à l'image f ; renvoie le point visé */
  update(id: number, f: number, cam: THREE.PerspectiveCamera, scene: THREE.Scene) {
    const t = f / FPS, c = camAt(id, f), flash = flashAt(f);
    cam.position.set(...c.pos); cam.up.set(0, 1, 0); cam.lookAt(...c.look); cam.rotateZ(c.roll);
    if (cam.fov !== c.fov) { cam.fov = c.fov; cam.updateProjectionMatrix(); }
    cam.layers.enable(NOINK); cam.updateMatrixWorld();
    const L = NIGHT, focus = V(...c.look), sunDir = V(18, 7, 3).normalize();
    this.sun.color.set(L.sunCol); this.sun.intensity = L.sunI; this.hemi.intensity = L.hemiI;
    this.sun.position.set(0.5, 0.5, 0.5).addScaledVector(sunDir, 30); this.sun.target.position.set(0.5, 0.5, 0.5);
    const sc = this.sun.shadow.camera; sc.left = -6; sc.right = 6; sc.top = 6; sc.bottom = -6; sc.near = 5; sc.far = 60; sc.updateProjectionMatrix();
    this.sun.shadow.bias = -0.0004; this.sun.shadow.normalBias = 0.02;
    TONE.uLitCol.value.set(L.lit[0] * (1 + flash * 2.2), L.lit[1] * (1 + flash * 2.2), L.lit[2] * (1 + flash * 1.8));
    TONE.uShadeCol.value.set(L.shade[0] + flash * 0.2, L.shade[1] + flash * 0.25, L.shade[2] + flash * 0.4);
    TONE.uShadeLift.value.set(...L.lift); TONE.uLambert.value = 0.35; TONE.uSideK.value = 0.84; TONE.uTerm.value = 0.2; TONE.uBounce.value.set(0, 0, 0); TONE.uSat.value = L.sat;
    CHAR.uCharTint.value.set(L.charTint[0] * (1 + flash), L.charTint[1] * (1 + flash), L.charTint[2] * (1 + flash)); CHAR.uCharShade.value = 0.72; CHAR.uGrad.value = 0.09; CHAR.uBodyGrad.value = 0.22; CHAR.uSideTint.value.set(0.8, 0.82, 1.0);
    untone(L.fog, this.fog.color); this.fog.near = L.fogNear; this.fog.far = L.fogFar; scene.fog = this.fog; scene.background = new THREE.Color("#04050a");
    for (const g of this.glows) (g.material as THREE.MeshBasicMaterial).opacity = Math.min(1, ((g.material as THREE.MeshBasicMaterial).userData.base ??= (g.material as THREE.MeshBasicMaterial).opacity) * (1 - 0.35 * flash) + 0 * t);
    this.rain.draw("r" + f, (g, w, h) => drawRain(g, w, h, f, flash));

    // téléphone (insert devant l'objectif, comme l'insert du bracelet de l'épisode 1)
    const ph = phoneAt(id, f);
    this.phone.mesh.visible = ph.mode !== "none";
    if (ph.mode !== "none") {
      this.phone.draw(`p|${ph.mode}|${ph.text}|${ph.chars}|${ph.first ?? ""}`, (g, w, h) => drawPhone(g, w, h, ph));
      const fwd = V(0, 0, -1).applyQuaternion(cam.quaternion), dist = 0.5, hgt = 2 * dist * Math.tan((cam.fov * Math.PI) / 360), jit = ph.shake * 0.012 * (f % 2 ? 1 : -1);
      this.phone.mesh.position.copy(cam.position).addScaledVector(fwd, dist).add(V(jit, -jit * 0.6, 0));
      this.phone.mesh.quaternion.copy(cam.quaternion); this.phone.mesh.rotateZ(-0.1); this.phone.mesh.scale.setScalar((hgt * 0.78) / 1.78);
    }
    // personnages (cartes face à la caméra)
    const yaw = (p: V3) => Math.atan2(cam.position.x - p[0], cam.position.z - p[2]);
    const place = (A: Actor, key: string, o: Outfit, p: V3, fo: object, extra = 0, visible = true) => {
      const d = cam.position.distanceTo(V(p[0], 1.1, p[2])), [w, h, k] = tierOf(d);
      A.r = this.pool.req(`${key}|${JSON.stringify(fo)}`, w, h, k, (pen: Pen) => bodyFront(pen, o, fo as never));
      A.mesh.position.set(p[0], p[1], p[2]); A.mesh.rotation.set(0, yaw(p) + extra, 0); A.mesh.visible = visible; A.mesh.scale.setScalar(1);
    };
    const slump = id === 5 ? smooth((f - SHOT_A(5)) / 20) : 1, youP: V3 = [YOU[0], YOU[1] + 0.1 * (1 - slump), YOU[2]];
    const youVisible = ![1, 2, 3, 11, 12, 17].includes(id), nervous = id >= 13 && id !== 18;
    const youFo = { mode: "sit", expr: (nervous ? "nervous" : "neutral") as Expr, blink: (f % 95) < 4, light: -2.4, seed: 3, facing: 0 as const, look: id >= 18 && id <= 22 ? 0.9 : 0 };
    const fakeFo = { mode: "sit", expr: "smile" as Expr, blink: false, light: -2.4, seed: 5, facing: 0 as const, look: 0 };
    const turn = id === 23 ? 0.55 * smooth((f - SHOT_A(23)) / 60) : id >= 24 && id <= 34 ? 0.55 : 0;
    place(this.you, "Y", YOU_OUTFIT, youP, youFo, 0, youVisible);
    place(this.fake, "F", FATHER_OUTFIT, FAKE, fakeFo, turn, ![1, 2, 3, 6, 11, 12, 17].includes(id) && !(id >= 26 && id <= 30) && id !== 5 ? true : id === 5);
    place(this.dad, "D", FATHER_PALE, FATHER, { mode: "stand", expr: "stern" as Expr, blink: false, light: -2.4, seed: 8, facing: 0 as const, look: 0, wave: id >= 22 && id <= 22 ? 0.7 : 0.1 }, 0, id >= 19 && id <= 22 || id >= 33);
    // reflet dans la télé : copies des cartes projetées sur le plan de l'écran (miroir de profondeur)
    const reflOn = [2, 6, 26, 27, 28, 29, 30].includes(id);
    const proj = (p: V3, dimY = 0): { q: V3; s: number } => { const pz = 2 * TV_Z - p[2], tt = (TV_Z - cam.position.z) / (pz - cam.position.z); return { q: [cam.position.x + (p[0] - cam.position.x) * tt, cam.position.y + (p[1] + dimY - cam.position.y) * tt, TV_Z + 0.012], s: tt }; };
    const reflect = (A: Actor, src: Actor, p: V3, dim: number, show: boolean) => {
      A.r = src.r; const { q, s } = proj(p); A.mesh.position.set(q[0], q[1], q[2]); A.mesh.rotation.set(0, 0, 0); A.mesh.scale.setScalar(s);
      A.mat.color.setScalar(dim); A.mesh.visible = reflOn && show;
    };
    const dimYou = id === 2 ? 0.55 : id === 6 ? 0.4 : 0.5, dimFake = id === 2 ? 0.85 : id === 6 ? 0.1 : id === 26 ? 0.12 + 0.45 * smooth((f - SHOT_A(26)) / 40) : 0.7;
    // les reflets n'ont besoin d'une carte réelle que pour la texture : on force sa demande même si la carte réelle est cachée
    if (!this.you.r) place(this.you, "Y", YOU_OUTFIT, youP, youFo, 0, false);
    reflect(this.rYou, this.you, YOU, dimYou, id !== 29 || true);
    reflect(this.rFake, this.fake, FAKE, dimFake, true);
    const sp = proj([0, 0.45, SOFA_Z_()]); const m0 = this.mirror[0]; m0.visible = reflOn; m0.position.set(sp.q[0], sp.q[1], TV_Z + 0.006); m0.scale.set(2.1 * sp.s, 0.85 * sp.s, 1);
    // main sur ton épaule (plans 31-33)
    this.hand.mesh.visible = id >= 31 && id <= 33; if (this.hand.mesh.visible) { this.hand.mesh.position.set(YOU[0] - 0.22, 1.0, YOU[2] - 0.05); this.hand.mesh.quaternion.copy(cam.quaternion); this.hand.mesh.scale.setScalar(0.9); }
    const tP = performance.now(); this.pool.flush(); void tP;
    for (const a of [this.you, this.fake, this.dad]) a.bind();
    for (const a of [this.rYou, this.rFake]) { const tx = a.r?.tex; if (tx) { a.mat.map = tx; a.dmat.map = tx; } }
    void clamp01; void WINDOW; void shotAt; void smooth;
    return focus;
  }
}
const SHOT_A = (id: number) => shotStart(id);
import { SHOTS } from "./story";
const shotStart = (id: number) => SHOTS[id - 1].a;
const SOFA_Z_ = () => 0.9;
