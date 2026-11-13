// « Le Mur » : labyrinthe sans fin (murs en instances jusqu'à ±640 m, puis sol peint du même motif jusqu'à l'horizon), clairière
// centrale (herbe, cabanes, feu, sirène sur pylône, mur des noms, entrée qui se referme), couloir principal, couloir du réveil,
// blocs de murs qui glissent la nuit, les Longs (cartes agrandies), les jeunes et toi. update(sid, f, cam, scene) pose une image.
import * as THREE from "three";
import { Batch, lam } from "../bridge/build";
import { ctex } from "../bridge/paint";
import { TONE, CHAR, untone } from "../bridge/shade";
import { NOINK } from "../bridge/ink";
import { Pool, Actor } from "../bridge/cast";
import type { Pen } from "../bridge/toon";
import { drawPerson, Person, Expr, Pose } from "./people";
import { painted } from "../shared/painted";
import { drawLong, LongSpec, PEEK_CUT } from "./longs";
import { FPS, V3, CELL, H, TH, LONG_K, CLEAR, ENTRY_Z, ENTRY_W, WAKE_Z, YOU_WAKE, FIRE, SIREN, NAMES_Z, LONG_RUN, YOU_RUN_Z, LIGHT,
  camAt, uOf, ROLE, hash, smooth, entryClose, tW } from "./story";
import { LIGHTS } from "./look";

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const solid = (key: string, color: string, extra: THREE.MeshLambertMaterialParameters = {}) => { const m = lam("mu_" + key, () => ({ color, ...extra })); m.name = "mu_" + key; return m; };
const box = (b: Batch, m: THREE.Material, x0: number, y0: number, z0: number, x1: number, y1: number, z1: number) =>
  b.add(new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0).translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2), m);
const FONT = "DejaVu Sans, Liberation Sans, sans-serif";

// ---------------- textures peintes ----------------
const wallTex = () => ctex("mu_wall", 256, 256, (g) => {             // béton ocre taché, blocs, coulures sombres, mousse au pied
  g.fillStyle = "#9a8a74"; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 70; i++) { g.fillStyle = `rgba(${hash(i) < 0.5 ? "40,30,25" : "255,240,220"},${0.04 + hash(i, 1) * 0.07})`; g.beginPath(); g.ellipse(hash(i, 2) * 256, hash(i, 3) * 256, 8 + hash(i, 4) * 34, 5 + hash(i, 5) * 22, 0, 0, 7); g.fill(); }
  g.strokeStyle = "rgba(40,30,25,0.35)"; g.lineWidth = 3; for (let k = 0; k < 4; k++) { g.beginPath(); g.moveTo(0, k * 64 + 2); g.lineTo(256, k * 64 + 2); g.stroke(); for (let j = 0; j < 3; j++) { const x = ((k % 2) * 42 + j * 86) % 256; g.beginPath(); g.moveTo(x, k * 64); g.lineTo(x, k * 64 + 64); g.stroke(); } }
  for (let i = 0; i < 9; i++) { const x = hash(i, 6) * 256; const gr = g.createLinearGradient(0, 0, 0, 200); gr.addColorStop(0, "rgba(30,24,20,0.3)"); gr.addColorStop(1, "rgba(30,24,20,0)"); g.fillStyle = gr; g.fillRect(x, 0, 3 + hash(i, 7) * 7, 120 + hash(i, 8) * 120); }
  const m = g.createLinearGradient(0, 200, 0, 256); m.addColorStop(0, "rgba(70,90,40,0)"); m.addColorStop(1, "rgba(70,90,40,0.45)"); g.fillStyle = m; g.fillRect(0, 200, 256, 56);
});
const dirtTex = () => ctex("mu_dirt", 256, 256, (g) => {
  g.fillStyle = "#7a6650"; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 90; i++) { g.fillStyle = `rgba(${hash(i, 11) < 0.5 ? "40,30,20" : "230,210,180"},${0.05 + hash(i, 12) * 0.08})`; g.beginPath(); g.arc(hash(i, 13) * 256, hash(i, 14) * 256, 3 + hash(i, 15) * 16, 0, 7); g.fill(); }
});
const grassTex = () => ctex("mu_grass", 256, 256, (g) => {
  g.fillStyle = "#4f6a34"; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 500; i++) { g.strokeStyle = `rgba(${hash(i, 21) < 0.5 ? "30,45,18" : "150,170,80"},${0.25 + hash(i, 22) * 0.3})`; g.lineWidth = 2; const x = hash(i, 23) * 256, y = hash(i, 24) * 256; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (hash(i, 25) - 0.5) * 6, y - 6 - hash(i, 26) * 8); g.stroke(); }
});
/** motif du labyrinthe vu de très haut (au-delà des murs en 3D) : couloirs clairs, murs sombres avec ombre portée */
const farTex = () => ctex("mu_far", 512, 512, (g) => {
  const n = 16, s = 512 / n; g.fillStyle = "#8a7660"; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i <= n; i++) for (let j = 0; j <= n; j++) {
    if (hash(i * 37 + j, 41) < 0.55) { g.fillStyle = "rgba(30,22,18,0.55)"; g.fillRect(i * s + 3, j * s, 8, s + 8); g.fillStyle = "#b5a286"; g.fillRect(i * s - 2, j * s, 6, s + 4); }
    if (hash(i * 53 + j, 42) < 0.55) { g.fillStyle = "rgba(30,22,18,0.55)"; g.fillRect(i * s, j * s + 3, s + 8, 8); g.fillStyle = "#b5a286"; g.fillRect(i * s, j * s - 2, s + 4, 6); }
  }
});
const NAMES = ["LÉO", "INÈS", "SACHA", "NOAH", "JADE", "TOM", "LINA", "HUGO", "ROSE", "ADAM", "ZOÉ", "NATHAN", "MILA", "ENZO", "LOU", "RAPHAËL", "EMMA", "THÉO", "ALMA", "LUCAS",
  "NINA", "GABRIEL", "LÉNA", "MAËL", "CHLOÉ", "SAMUEL", "ANNA", "YANIS", "CLARA", "AXEL", "ROMANE", "ILYES", "JULIA", "MALO", "ELSA", "NOÉ", "LOLA", "TIMÉO", "AMBRE", "ELIOTT"];
const namesTex = () => ctex("mu_names", 1024, 512, (g) => {          // centaines de prénoms gravés (creux sombre + arête claire), traits de comptage
  g.clearRect(0, 0, 1024, 512); g.textAlign = "center";
  for (let i = 0; i < 260; i++) {
    const x = 30 + hash(i, 51) * 964, y = 24 + hash(i, 52) * 470, sz = 14 + hash(i, 53) * 14, nm = NAMES[Math.floor(hash(i, 54) * NAMES.length)];
    g.save(); g.translate(x, y); g.rotate((hash(i, 55) - 0.5) * 0.12); g.font = `bold ${sz}px ${FONT}`;
    g.fillStyle = "rgba(255,235,210,0.35)"; g.fillText(nm, 1, 1); g.fillStyle = "rgba(25,18,14,0.85)"; g.fillText(nm, 0, 0); g.restore();
  }
});
const skyTex = (k: number) => ctex("mu_sky" + k, 64, 512, (g) => {
  const L = LIGHTS[k], v = g.createLinearGradient(0, 0, 0, 512); v.addColorStop(0, L.skyTop); v.addColorStop(0.42, L.skyMid); v.addColorStop(0.5, L.skyLow); v.addColorStop(0.56, L.skyMid); v.addColorStop(1, L.skyTop);
  g.fillStyle = v; g.fillRect(0, 0, 64, 512);
});
const glowTex = (rgb: string) => ctex("mu_glow" + rgb, 128, 128, (g) => {
  const r = g.createRadialGradient(64, 64, 0, 64, 64, 64); r.addColorStop(0, `rgba(${rgb},0.95)`); r.addColorStop(0.35, `rgba(${rgb},0.35)`); r.addColorStop(1, `rgba(${rgb},0)`); g.fillStyle = r; g.fillRect(0, 0, 128, 128);
});

// ---------------- personnages ----------------
const LOOK: Record<string, Partial<Person>> = {
  Y: { jacket: "#d4533e", pants: "#4b5165", shoes: "#3a2a24", hair: "bob", hairColor: "#3b2b25", hood: true },      // toi : sweat rouge brique, capuche
  A: { jacket: "#5a7d6a", pants: "#3f4458", shoes: "#2a2a30", hair: "spiky", hairColor: "#2a2220" },
  B: { jacket: "#c9b48e", pants: "#4a5066", shoes: "#2a2a30", hair: "ponytail", hairColor: "#a07850" },
  C: { jacket: "#8fa7c4", pants: "#3f4458", shoes: "#2a2a30", hair: "bun", hairColor: "#c9c3b8" },
  D: { jacket: "#7b5a8a", pants: "#3a3348", shoes: "#2a2a30", hair: "fringe", hairColor: "#24201f" },
  E: { jacket: "#d08a3a", pants: "#3f4458", shoes: "#2a2a30", hair: "bob", hairColor: "#6a4630" },
};
type Fo = { mode?: "stand"; pose?: Pose; expr: Expr | "mute"; blink?: boolean; look?: number; back?: boolean; side?: 1 | -1; reach?: number; step?: number };
const tierOf = (d: number): [number, number, number] => (d < 3.5 ? [1080, 1800, 1.8] : d < 14 ? [600, 1000, 1] : [300, 500, 0.5]);
/** cercle autour du feu (jeunes de la clairière) */
const RING: [string, number][] = [["A", 0.2], ["B", 0.95], ["C", 1.7], ["D", 2.45], ["E", 3.6], ["A", 4.3], ["C", 5.05], ["B", 5.6]];

export class World {
  root = new THREE.Group();
  sun: THREE.DirectionalLight; private hemi: THREE.HemisphereLight; private fog = new THREE.Fog("#000", 10, 100);
  private pool = new Pool(); private actors: Actor[] = []; private longs: Actor[] = [];
  private sky: THREE.Mesh; private skyMaps: THREE.Texture[]; private doors: THREE.Mesh[] = []; private movers: { m: THREE.Mesh; x: number; z: number; ax: "x" | "z" }[] = [];
  private fireGlow: THREE.Mesh; private sirenGlow: THREE.Mesh; private sirenLamp: THREE.Mesh; private candles: THREE.Mesh[] = []; private moon: THREE.Mesh; private sunDisc: THREE.Mesh;
  constructor() {
    const R = this.root;
    this.hemi = new THREE.HemisphereLight("#ffcf9a", "#3a2a2a", 0.3); R.add(this.hemi);
    this.sun = new THREE.DirectionalLight("#ffb36b", 1.8); this.sun.castShadow = true; R.add(this.sun, this.sun.target);
    const b = new Batch();
    const wt = wallTex(); wt.wrapS = wt.wrapT = THREE.RepeatWrapping;
    const wallM = solid("wall", "#ffffff", { map: wt });
    // ---------- labyrinthe en instances ----------
    const N = 80, cells: [number, number, number][] = [];   // [x, z, orientation 0 = mur le long de x, 1 = le long de z]
    const busy = (x: number, z: number) => (Math.abs(x) < CLEAR + 6 && Math.abs(z) < CLEAR + 6) || (Math.abs(x) < 9 && z > ENTRY_Z - 2 && z < 156) || (Math.abs(z - WAKE_Z) < 9 && Math.abs(x) < 66);
    for (let i = -N; i < N; i++) for (let j = -N; j < N; j++) {
      const x = i * CELL, z = j * CELL;
      if (hash(i * 211 + j, 1) < 0.5 && !busy(x + CELL / 2, z)) cells.push([x + CELL / 2, z, 0]);
      if (hash(i * 193 + j, 2) < 0.5 && !busy(x, z + CELL / 2)) cells.push([x, z + CELL / 2, 1]);
    }
    const wallGeo = new THREE.BoxGeometry(CELL + TH, H, TH).translate(0, H / 2, 0);
    const inst = new THREE.InstancedMesh(wallGeo, wallM, cells.length), mm = new THREE.Matrix4(), q = new THREE.Quaternion(), yUp = V(0, 1, 0);
    cells.forEach(([x, z, o], i) => { q.setFromAxisAngle(yUp, o ? Math.PI / 2 : 0); mm.compose(V(x, 0, z), q, V(1, 0.94 + 0.12 * hash(i, 3), 1)); inst.setMatrixAt(i, mm); });
    inst.castShadow = true; inst.receiveShadow = true; R.add(inst);
    // ---------- murs particuliers ----------
    const wallAt = (x0: number, z0: number, x1: number, z1: number) => box(b, wallM, Math.min(x0, x1) - (x0 === x1 ? TH / 2 : 0), 0, Math.min(z0, z1) - (z0 === z1 ? TH / 2 : 0), Math.max(x0, x1) + (x0 === x1 ? TH / 2 : 0), H, Math.max(z0, z1) + (z0 === z1 ? TH / 2 : 0));
    wallAt(-CLEAR, -CLEAR, CLEAR, -CLEAR); wallAt(-CLEAR, -CLEAR, -CLEAR, CLEAR); wallAt(CLEAR, -CLEAR, CLEAR, CLEAR);           // clairière
    wallAt(-CLEAR, CLEAR, -ENTRY_W / 2, CLEAR); wallAt(ENTRY_W / 2, CLEAR, CLEAR, CLEAR);
    wallAt(-ENTRY_W / 2, CLEAR, -ENTRY_W / 2, 150); wallAt(ENTRY_W / 2, CLEAR, ENTRY_W / 2, 150);                                   // couloir principal
    for (const [z0, z1] of [[64, 66], [104, 106]] as [number, number][]) { void z0; void z1; }
    wallAt(-60, WAKE_Z - 3.6, 60, WAKE_Z - 3.6); wallAt(-60, WAKE_Z + 3.6, 60, WAKE_Z + 3.6);                                     // couloir du réveil
    for (const s of [-1, 1]) {                                        // portes de l'entrée : deux blocs qui glissent l'un vers l'autre
      const d = new THREE.Mesh(new THREE.BoxGeometry(ENTRY_W / 2 + 0.2, H, TH * 1.4).translate(0, H / 2, 0), wallM); d.castShadow = d.receiveShadow = true;
      d.userData.s = s; d.position.set(s * (ENTRY_W / 2 + 1.6), 0, CLEAR); R.add(d); this.doors.push(d);
    }
    for (let i = 0; i < 8; i++) {                                     // blocs qui glissent la nuit (vue du ciel, plan 9)
      const ax = hash(i, 61) < 0.5 ? "x" : "z", x = (Math.round((hash(i, 62) - 0.5) * 10)) * CELL, z = WAKE_Z - 40 + Math.round(hash(i, 63) * 10) * CELL;
      const m = new THREE.Mesh(new THREE.BoxGeometry(ax === "x" ? CELL * 1.5 : TH * 1.3, H * 1.02, ax === "x" ? TH * 1.3 : CELL * 1.5).translate(0, H * 0.51, 0), wallM);
      m.castShadow = m.receiveShadow = true; m.position.set(x, 0, z); m.visible = false; R.add(m); this.movers.push({ m, x, z, ax });
    }
    // ---------- sol ----------
    const dt = dirtTex(); dt.wrapS = dt.wrapT = THREE.RepeatWrapping; dt.repeat.set(160, 160);
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(1300, 1300).rotateX(-Math.PI / 2), solid("dirt", "#ffffff", { map: dt })); ground.receiveShadow = true; R.add(ground);
    const ft = farTex(); ft.wrapS = ft.wrapT = THREE.RepeatWrapping; ft.repeat.set(70, 70);
    const far = new THREE.Mesh(new THREE.PlaneGeometry(9000, 9000).rotateX(-Math.PI / 2), solid("far", "#ffffff", { map: ft })); far.position.y = -0.3; R.add(far);
    const gt = grassTex(); gt.wrapS = gt.wrapT = THREE.RepeatWrapping; gt.repeat.set(12, 12);
    const grass = new THREE.Mesh(new THREE.PlaneGeometry(CLEAR * 2, CLEAR * 2).rotateX(-Math.PI / 2), solid("grass", "#ffffff", { map: gt })); grass.position.y = 0.03; grass.receiveShadow = true; R.add(grass);
    // ---------- clairière : cabanes, feu, sirène, mur des noms ----------
    const wood = solid("wood", "#7a5232"), roof = solid("roof", "#5a3a2a"), metal = solid("metal", "#4a4f57"), rust = solid("rust", "#8a4a2a");
    for (const [x, z, r] of [[-20, -18, 0.2], [-22, 8, -0.4], [19, 10, 0.5], [-8, -22, 0], [8, 22, 0.1]] as [number, number, number][]) {
      const g = new THREE.BoxGeometry(5, 2.6, 4).translate(0, 1.3, 0).rotateY(r).translate(x, 0, z); b.add(g, wood);
      b.add(new THREE.ConeGeometry(3.8, 1.8, 4).rotateY(Math.PI / 4 + r).translate(x, 3.5, z), roof);
    }
    for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI; b.add(new THREE.CylinderGeometry(0.12, 0.12, 1.6, 6).rotateZ(Math.PI / 2).rotateY(a).translate(FIRE[0], 0.15, FIRE[2]), wood); }
    for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; b.add(new THREE.SphereGeometry(0.22, 6, 4).translate(FIRE[0] + Math.cos(a) * 0.95, 0.12, FIRE[2] + Math.sin(a) * 0.95), metal); }
    b.add(new THREE.CylinderGeometry(0.18, 0.3, 11, 8).translate(SIREN[0], 5.5, SIREN[2]), rust);                                   // pylône + pavillon de la sirène
    b.add(new THREE.CylinderGeometry(0.75, 0.32, 1.4, 12).rotateZ(Math.PI / 2).translate(SIREN[0] - 0.7, 10.6, SIREN[2]), metal);
    b.add(new THREE.CylinderGeometry(0.75, 0.32, 1.4, 12).rotateZ(-Math.PI / 2).translate(SIREN[0] + 0.7, 10.6, SIREN[2]), metal);
    this.sirenLamp = new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 8), new THREE.MeshBasicMaterial({ color: "#ff2a1a" })); this.sirenLamp.position.set(SIREN[0], 11.5, SIREN[2]); this.sirenLamp.layers.set(NOINK); R.add(this.sirenLamp);
    this.sirenGlow = new THREE.Mesh(new THREE.PlaneGeometry(9, 9), new THREE.MeshBasicMaterial({ map: glowTex("255,40,25"), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); this.sirenGlow.position.copy(this.sirenLamp.position); this.sirenGlow.layers.set(NOINK); R.add(this.sirenGlow);
    const names = new THREE.Mesh(new THREE.PlaneGeometry(26, 7.2), new THREE.MeshBasicMaterial({ map: namesTex(), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }));
    names.position.set(0, 4.2, NAMES_Z + 0.02); R.add(names);
    for (let i = 0; i < 9; i++) {                                     // bougies au pied du mur des noms
      const x = -9 + i * 2.2 + (hash(i, 71) - 0.5); b.add(new THREE.CylinderGeometry(0.07, 0.07, 0.25 + hash(i, 72) * 0.2, 6).translate(x, 0.15, NAMES_Z + 0.5), solid("candle", "#efe6d2"));
      const c = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.9), new THREE.MeshBasicMaterial({ map: glowTex("255,190,110"), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); c.position.set(x, 0.42, NAMES_Z + 0.52); c.layers.set(NOINK); R.add(c); this.candles.push(c);
    }
    this.fireGlow = new THREE.Mesh(new THREE.PlaneGeometry(5, 5), new THREE.MeshBasicMaterial({ map: glowTex("255,150,60"), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); this.fireGlow.position.set(FIRE[0], 0.8, FIRE[2]); this.fireGlow.layers.set(NOINK); R.add(this.fireGlow);
    b.build(R, true);
    const done = new Set<THREE.Material>();
    R.traverse((o) => { const m = o as THREE.Mesh; if (!m.isMesh || Array.isArray(m.material) || done.has(m.material)) return; const mt = m.material as THREE.MeshLambertMaterial; done.add(mt);
      if (mt.name === "mu_wall") painted(mt, 0.2, 0.4, 0.25); else if (mt.name === "mu_dirt" || mt.name === "mu_grass") painted(mt, 0.28, 0.25, 0); });
    // ---------- ciel, lune, soleil ----------
    this.skyMaps = [0, 1, 2].map(skyTex);
    this.sky = new THREE.Mesh(new THREE.SphereGeometry(6000, 24, 16), new THREE.MeshBasicMaterial({ map: this.skyMaps[0], side: THREE.BackSide, fog: false, depthWrite: false })); this.sky.layers.set(NOINK); this.sky.renderOrder = -1; R.add(this.sky);
    this.moon = new THREE.Mesh(new THREE.PlaneGeometry(420, 420), new THREE.MeshBasicMaterial({ map: glowTex("215,235,255"), transparent: true, fog: false, blending: THREE.AdditiveBlending, depthWrite: false })); this.moon.layers.set(NOINK); R.add(this.moon);
    this.sunDisc = new THREE.Mesh(new THREE.PlaneGeometry(900, 900), new THREE.MeshBasicMaterial({ map: glowTex("255,190,120"), transparent: true, fog: false, blending: THREE.AdditiveBlending, depthWrite: false })); this.sunDisc.layers.set(NOINK); R.add(this.sunDisc);
    for (let i = 0; i < 16; i++) this.actors.push(new Actor(R));
    for (let i = 0; i < 8; i++) this.longs.push(new Actor(R));
  }

  update(sid: number, f: number, cam: THREE.PerspectiveCamera, scene: THREE.Scene) {
    const t = f / FPS, c = camAt(sid, f), u = uOf(sid, f), id = ROLE[sid], lk = LIGHT[id], L = LIGHTS[lk];
    cam.position.set(...c.pos); cam.up.set(0, 1, 0); cam.lookAt(...c.look); cam.rotateZ(c.roll);
    if (cam.fov !== c.fov || cam.near !== c.near || cam.far !== c.far) { cam.fov = c.fov; cam.near = c.near; cam.far = c.far; cam.updateProjectionMatrix(); }
    cam.layers.enable(NOINK); cam.updateMatrixWorld();
    const focus = V(...c.look), outside = c.pos[1] > 25;
    // lumière
    const sunDir = V(...L.sunDir).normalize();
    this.sun.color.set(L.sunCol); this.sun.intensity = L.sunI; this.hemi.color.set(L.hemiSky); this.hemi.intensity = L.hemiI;
    const span = c.pos[1] > 300 ? 600 : outside ? 90 : 18;
    this.sun.position.copy(focus).addScaledVector(sunDir, span * 3); this.sun.target.position.copy(focus);
    const sc = this.sun.shadow.camera; sc.left = -span; sc.right = span; sc.top = span; sc.bottom = -span; sc.near = 1; sc.far = span * 7; sc.updateProjectionMatrix();
    this.sun.shadow.bias = -0.0005; this.sun.shadow.normalBias = 0.02 * (span / 7);
    TONE.uLitCol.value.set(...L.lit); TONE.uShadeCol.value.set(...L.shade); TONE.uShadeLift.value.set(...L.lift);
    TONE.uLambert.value = 0.35; TONE.uSideK.value = 0.84; TONE.uTerm.value = 0.2; TONE.uBounce.value.set(0, 0, 0); TONE.uSat.value = L.sat;
    CHAR.uCharTint.value.set(...L.charTint); CHAR.uCharShade.value = 0.72; CHAR.uGrad.value = 0.09; CHAR.uBodyGrad.value = 0.22; CHAR.uSideTint.value.set(0.8, 0.86, 1.0);
    untone(L.fogCol, this.fog.color); this.fog.near = L.fogNear; this.fog.far = c.pos[1] > 300 ? 9000 : L.fogFar; scene.fog = this.fog; scene.background = new THREE.Color(L.bg);
    (this.sky.material as THREE.MeshBasicMaterial).map = this.skyMaps[lk]; this.sky.position.copy(cam.position);
    this.moon.visible = lk === 2; this.moon.position.copy(cam.position).add(V(-0.45, 0.55, -1).normalize().multiplyScalar(5000)); this.moon.lookAt(cam.position);
    this.sunDisc.visible = lk !== 2; this.sunDisc.position.copy(cam.position).add(V(-L.sunDir[0], 0.08, -L.sunDir[2]).normalize().multiplyScalar(-5000)); this.sunDisc.lookAt(cam.position);
    // entrée, blocs mobiles, lueurs
    const close = id >= 22 ? entryClose(t) : 0;
    for (const d of this.doors) d.position.x = d.userData.s * (ENTRY_W / 2 + 1.6 - (ENTRY_W / 2 + 1.6 - (ENTRY_W / 4 + 0.05)) * close);
    this.movers.forEach((mv, i) => { mv.m.visible = id === 9 || id === 10; const s = smooth(u) * (hash(i, 64) < 0.5 ? -1 : 1) * CELL;
      mv.m.position.set(mv.x + (mv.ax === "x" ? s : 0), 0, mv.z + (mv.ax === "z" ? s : 0)); });
    const night = lk === 2; if (night) (this.root.getObjectByName("grass") as THREE.Mesh | undefined); const flick = 0.85 + 0.15 * Math.sin(t * 17) * Math.sin(t * 7.3);
    (this.fireGlow.material as THREE.MeshBasicMaterial).opacity = (night ? 1 : 0.55) * flick; this.fireGlow.lookAt(cam.position);
    const siren = id === 20 || id === 21 || id >= 22; const rot = 0.5 + 0.5 * Math.sin(t * 8);
    (this.sirenGlow.material as THREE.MeshBasicMaterial).opacity = siren ? 0.4 + 0.6 * rot : 0.08; this.sirenGlow.lookAt(cam.position); this.sirenLamp.visible = true;
    this.candles.forEach((cd, i) => { (cd.material as THREE.MeshBasicMaterial).opacity = (night ? 0.95 : 0.4) * (0.8 + 0.2 * Math.sin(t * 9 + i * 2)); cd.lookAt(cam.position); });

    // ---------- personnages ----------
    const yaw = (p: V3) => Math.atan2(cam.position.x - p[0], cam.position.z - p[2]);
    let k = 0, kl = 0;
    const place = (key: string, p: V3, fo: Fo, scale = 1, lie = false) => {
      const A = this.actors[k++]; if (!A) return;
      const d = cam.position.distanceTo(V(p[0], p[1] + 1.1 * scale, p[2])), [w, h, kk] = tierOf(d / scale);
      A.r = this.pool.req(`${key}|${JSON.stringify(fo)}`, w, h, kk, (pen: Pen) => drawPerson(pen, { ...(LOOK[key] as Person), pose: fo.pose ?? "stand", expr: (fo.expr === "mute" ? "fear" : fo.expr) as Expr, back: fo.back, blink: !!fo.blink, look: fo.look ?? 0, step: fo.step }));
      A.mesh.position.set(...p); A.mesh.up.set(0, 1, 0);
      if (lie) A.mesh.rotation.set(-Math.PI / 2, 0, 0, "YXZ"); else {
        A.mesh.rotation.set(0, yaw(p), 0);
        const dy = cam.position.y - (p[1] + 1.0 * scale), hz = Math.hypot(cam.position.x - p[0], cam.position.z - p[2]);
        if (Math.atan2(dy, hz) > 0.55) { A.mesh.up.set(0, 1, 0).applyQuaternion(cam.quaternion); A.mesh.lookAt(cam.position); A.mesh.up.set(0, 1, 0); }
      }
      A.mesh.scale.setScalar(scale); A.mesh.visible = true;
    };
    const long = (p: V3, s: LongSpec, face?: number) => {
      const A = this.longs[kl++]; if (!A) return;
      const d = cam.position.distanceTo(V(p[0], p[1] + 5, p[2])), [w, h, kk] = tierOf(d / LONG_K * 0.6);
      A.r = this.pool.req(`L|${JSON.stringify(s)}`, w, h, kk, (pen: Pen) => drawLong(pen, s));
      A.mesh.position.set(...p); A.mesh.up.set(0, 1, 0); A.mesh.rotation.set(0, face ?? yaw(p), 0);
      { const dy = cam.position.y - (p[1] + 5), hz = Math.hypot(cam.position.x - p[0], cam.position.z - p[2]);          // vu de haut : la carte se tourne vers la caméra
        if (Math.atan2(dy, hz) > 0.95) { A.mesh.up.set(0, 1, 0).applyQuaternion(cam.quaternion); A.mesh.lookAt(cam.position); A.mesh.up.set(0, 1, 0); } }
      A.mesh.scale.setScalar(LONG_K); A.mesh.visible = true;
    };
    const blink = (seed: number) => (f + seed * 37) % 97 < 4;
    const W2: V3 = [YOU_WAKE[0], 0.02, YOU_WAKE[2] + 0.0];
    if (id === 1) { place("Y", [YOU_WAKE[0], 0, YOU_WAKE[2]], { mode: "stand", expr: "worry" }, 1); long([2.5, H - (975 - PEEK_CUT) * 0.00216 * LONG_K, WAKE_Z + 3.0], { pose: "peek", turn: 0.25 }); }
    if (id === 2 || id === 3) place("Y", W2, { mode: "stand", expr: "worry", blink: id === 2 && u < 0.45 }, 1, true);
    if (id === 5) place("Y", [YOU_WAKE[0], 0, YOU_WAKE[2]], { mode: "stand", expr: "worry", blink: blink(1), look: Math.sin(u * 5) * 0.8 });
    if (id === 9 || id === 10) {
      const P: V3[] = [[6, 0, WAKE_Z + 1], [-28, 0, WAKE_Z - 12], [36, 0, WAKE_Z + 20], [-12, 0, WAKE_Z + 28], [22, 0, WAKE_Z - 28], [-44, 0, WAKE_Z + 6]];
      P.forEach((p, i) => { if (id === 9 && i > 2) return; const e = id === 10 ? smooth(u * 1.6 - i * 0.12) : 1; long([p[0] + (i % 2 ? 1 : -1) * 3 * u, 0, p[2]], { pose: "walk", step: ((t * 0.35 + i * 0.3) % 1 + 1) % 1 }); void e; });
    }
    if (id === 11) { long([13, 0, WAKE_Z + 0.4], { pose: "stand" }); place("B", [10.6, 0, WAKE_Z - 0.6], { mode: "stand", expr: "worry" }); }
    if (id === 12) { long([2.5, H - (975 - PEEK_CUT) * 0.00216 * LONG_K, WAKE_Z + 3.0], { pose: "peek", turn: Math.sin(u * 3) * 0.6 }); place("C", [2.0, 0, WAKE_Z - 0.4], { mode: "stand", expr: "mute", blink: false }); }
    if (id === 13 || id === 14) {
      RING.forEach(([key, a], i) => place(key, [FIRE[0] + Math.cos(a) * 3.1, 0, FIRE[2] + Math.sin(a) * 3.1], { mode: "stand", expr: i % 3 ? "worry" : "calm", blink: blink(i + 2) }));
      if (id === 14) place("Y", [0.4, 0, 1.2], { mode: "stand", expr: "worry", back: true });
    }
    if (id === 15) [[-3, 22], [-1, 24], [1.5, 23]].forEach(([x, z], i) => place(["A", "D", "E"][i], [x, 0, z - 6 * smooth(u)], { mode: "stand", expr: "worry", side: -1 }));
    if (id === 16) RING.slice(0, 6).forEach(([key, a], i) => place(key, [FIRE[0] + Math.cos(a) * 3.1, 0, FIRE[2] + Math.sin(a) * 3.1], { mode: "stand", expr: "mute" }));
    if (id === 18) place("Y", [0, 0, 20], { mode: "stand", expr: "calm", blink: blink(5) });
    if (id === 19) place("Y", [0, 0, 118 - 30 * u], { mode: "stand", expr: "calm" });
    if (id === 21) place("Y", [0, 0.06 * Math.abs(Math.sin(t * 9)), 98 - 26 * u - 0.9], { mode: "stand", expr: "worry", back: true });
    if (id >= 22 && id <= 27) {
      const unfold = id === 23 ? smooth(u * 1.15) : id < 23 ? 0 : 1;
      if (id >= 23) long(LONG_RUN, unfold < 1 ? { pose: "crouch", unfold } : { pose: "stand", turn: id === 24 ? 0.85 * (1 - smooth(u * 1.3)) : 0 }, 0);
      if (id !== 24) place("Y", [0, 0, YOU_RUN_Z], { mode: "stand", expr: "worry", back: id === 23 || id === 25 || id === 27, blink: id === 26 && blink(6) });
    }
    void tW; void H;
    for (; k < this.actors.length; k++) this.actors[k].mesh.visible = false;
    for (; kl < this.longs.length; kl++) this.longs[kl].mesh.visible = false;
    this.pool.flush();
    for (const a of [...this.actors, ...this.longs]) if (a.mesh.visible) a.bind();
    return focus;
  }
}
