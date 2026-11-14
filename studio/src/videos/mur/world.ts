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
  camAt, uOf, ROLE, hash, smooth, entryClose, tW, HOOK_M, hookLean, cutAt } from "./story";
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
  g.strokeStyle = "rgba(25,18,14,0.5)"; g.lineWidth = 1.6;                       // fissures
  for (let i = 0; i < 5; i++) { let x = hash(i, 81) * 256, y = hash(i, 82) * 180; g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 6; k++) { x += (hash(i * 7 + k, 83) - 0.5) * 18; y += 6 + hash(i * 7 + k, 84) * 10; g.lineTo(x, y); } g.stroke(); }
  for (let i = 0; i < 2; i++) { const x = 30 + hash(i, 85) * 190, y = 60 + hash(i, 86) * 90;   // griffures des Longs : 3 entailles parallèles
    for (let k = 0; k < 3; k++) { g.strokeStyle = "rgba(20,14,12,0.6)"; g.lineWidth = 2.4; g.beginPath(); g.moveTo(x + k * 7, y); g.quadraticCurveTo(x + k * 7 + 6, y + 22, x + k * 7 + 2, y + 46); g.stroke();
      g.strokeStyle = "rgba(255,240,220,0.18)"; g.lineWidth = 1; g.beginPath(); g.moveTo(x + k * 7 + 1.5, y); g.quadraticCurveTo(x + k * 7 + 7.5, y + 22, x + k * 7 + 3.5, y + 46); g.stroke(); } }
  for (let i = 0; i < 3; i++) { const x0 = hash(i, 87) * 256;                           // lierre qui tombe du haut
    for (let k = 0; k < 26; k++) { const y = hash(i * 31 + k, 88) * (60 + hash(i, 89) * 100), x = x0 + Math.sin(y * 0.08 + i) * 6 + (hash(i * 31 + k, 90) - 0.5) * 14;
      g.fillStyle = `rgba(${40 + hash(k, 91) * 30},${70 + hash(k, 92) * 40},${30 + hash(k, 93) * 15},0.75)`; g.beginPath(); g.ellipse(x, y, 3 + hash(k, 94) * 3, 2 + hash(k, 95) * 2, hash(k, 96) * 3, 0, 7); g.fill(); } }
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
const namesTex = () => ctex("mu_names", 2048, 576, (g) => {          // prénoms gravés au couteau, en lignes serrées sans chevauchement (creux sombre, arête claire en bas)
  g.clearRect(0, 0, 2048, 576); g.textBaseline = "alphabetic";
  const carve = (txt: string, x: number, y: number, sz: number, rot: number) => {
    g.save(); g.translate(x, y); g.rotate(rot); g.font = `bold ${sz}px DejaVu Sans Condensed, DejaVu Sans, sans-serif`;
    g.fillStyle = "rgba(255,238,215,0.42)"; g.fillText(txt, 1.4, 1.8);              // arête éclairée (bas du creux)
    g.fillStyle = "rgba(28,20,15,0.92)"; g.fillText(txt, 0, 0);                    // creux
    g.fillStyle = "rgba(10,7,5,0.55)"; g.fillText(txt, -0.8, -0.9);               // ombre portée dans le creux (haut)
    g.restore();
  };
  let n = 0;
  for (let row = 0, y = 34; y < 560; row++) {
    const sz = 22 + Math.floor(hash(row, 56) * 8); let x = 14 + hash(row, 57) * 40;
    while (x < 2010) {
      const k = n++, nm = NAMES[Math.floor(hash(k, 54) * NAMES.length)].toUpperCase(), r = hash(k, 58);
      if (r < 0.06) {                                                              // traits de comptage
        g.strokeStyle = "rgba(28,20,15,0.85)"; g.lineWidth = 2.4; const c = 3 + Math.floor(hash(k, 59) * 3);
        for (let q = 0; q < c; q++) { g.beginPath(); g.moveTo(x + q * 7, y - sz * 0.8); g.lineTo(x + q * 7 + 1, y); g.stroke(); }
        if (c === 5) { g.beginPath(); g.moveTo(x - 3, y - 4); g.lineTo(x + 34, y - sz * 0.7); g.stroke(); }
        x += c * 7 + 26; continue;
      }
      g.font = `bold ${sz}px DejaVu Sans Condensed, DejaVu Sans, sans-serif`; const w = g.measureText(nm).width;
      if (x + w > 2034) break;
      const yy = y + (hash(k, 60) - 0.5) * 4, rot = (hash(k, 55) - 0.5) * 0.05;
      carve(nm, x, yy, sz, rot);
      if (r > 0.93) { g.strokeStyle = "rgba(28,20,15,0.8)"; g.lineWidth = 2; g.beginPath(); g.moveTo(x - 2, yy - sz * 0.35); g.lineTo(x + w + 2, yy - sz * 0.3); g.stroke(); }   // nom barré
      x += w + 18 + hash(k, 61) * 26;
    }
    y += sz + 9 + hash(row, 62) * 5;
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
const SX = SIREN[0], SZ = SIREN[2];
const RING: [string, number][] = [["A", 0.2], ["B", 0.95], ["C", 1.7], ["D", 2.45], ["E", 3.6], ["A", 4.3], ["C", 5.05], ["B", 5.6]];

export class World {
  root = new THREE.Group();
  sun: THREE.DirectionalLight; private hemi: THREE.HemisphereLight; private fog = new THREE.Fog("#000", 10, 100);
  private pool = new Pool(); private actors: Actor[] = []; private longs: Actor[] = []; private longMats: THREE.MeshBasicMaterial[] = []; private shadowMats: THREE.MeshBasicMaterial[] = []; private longShadow: boolean[] = [];
  private sky: THREE.Mesh; private skyMaps: THREE.Texture[]; private doors: THREE.Mesh[] = []; private slab!: THREE.Mesh; private torches: THREE.Mesh[] = []; private cloths: THREE.Mesh[] = []; private beams: THREE.Mesh[] = []; private movers: { m: THREE.Mesh; x: number; z: number; ax: "x" | "z" }[] = [];
  private fireGlow: THREE.Mesh; private sirenGlow: THREE.Mesh; private sirenLamp: THREE.Mesh; private candles: THREE.Mesh[] = []; private parts: Record<string, THREE.Points> = {}; private moon: THREE.Mesh; private sunDisc: THREE.Mesh;
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
    this.slab = new THREE.Mesh(new THREE.BoxGeometry(TH * 1.3, H, CELL).translate(0, H / 2, 0), wallM); this.slab.castShadow = this.slab.receiveShadow = true; this.slab.visible = false; R.add(this.slab);
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
    // ---------- détails de la clairière : tonneaux, caisses, torches, cordes à linge, touffes d'herbe ----------
    const barrel = solid("barrel", "#6a4a2e"), crate = solid("crate", "#8a6a44"), cloth = ["#b8a07a", "#8a5a4a", "#6a7a8a", "#a88a5a"], tuft = solid("tuft", "#4f6a2e");
    for (let i = 0; i < 9; i++) { const a = hash(i, 101) * 6.28, r = 9 + hash(i, 102) * 18, x = Math.cos(a) * r, z = Math.sin(a) * r; if (Math.abs(x) < 3 && z > 20) continue;
      if (i % 2) b.add(new THREE.CylinderGeometry(0.42, 0.38, 1.0, 10).translate(x, 0.5, z), barrel); else b.add(new THREE.BoxGeometry(0.9, 0.8, 0.9).rotateY(a).translate(x, 0.4, z), crate); }
    for (const [x, z] of [[-6, 2], [6, -12], [-12, -8], [10, 4], [-3, 14], [14, -4]] as [number, number][]) {
      b.add(new THREE.CylinderGeometry(0.06, 0.08, 2.2, 6).translate(x, 1.1, z), wood); b.add(new THREE.CylinderGeometry(0.14, 0.09, 0.3, 8).translate(x, 2.3, z), metal);
      const tg = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.6), new THREE.MeshBasicMaterial({ map: glowTex("255,160,70"), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
      tg.position.set(x, 2.55, z); tg.layers.set(NOINK); R.add(tg); this.torches.push(tg); }
    for (const [x0, z0, x1, z1] of [[-20, -14, -12, -18], [16, 6, 22, 14], [-18, 4, -24, 12]] as [number, number, number, number][]) {
      b.add(new THREE.CylinderGeometry(0.07, 0.07, 2.4, 6).translate(x0, 1.2, z0), wood); b.add(new THREE.CylinderGeometry(0.07, 0.07, 2.4, 6).translate(x1, 1.2, z1), wood);
      const L = Math.hypot(x1 - x0, z1 - z0), ang = Math.atan2(z1 - z0, x1 - x0);
      b.add(new THREE.CylinderGeometry(0.015, 0.015, L, 4).rotateZ(Math.PI / 2).rotateY(-ang).translate((x0 + x1) / 2, 2.3, (z0 + z1) / 2), metal);
      for (let k = 1; k < 4; k++) { const c = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 1.1).translate(0, -0.55, 0), solid("cloth" + k, cloth[k % 4]));
        (c.material as THREE.Material).side = THREE.DoubleSide; c.position.set(x0 + (x1 - x0) * k / 4, 2.3, z0 + (z1 - z0) * k / 4); c.rotation.y = -ang; c.castShadow = true; R.add(c); this.cloths.push(c); } }
    const tg2 = new THREE.ConeGeometry(0.18, 0.7, 4), tufts = new THREE.InstancedMesh(tg2, tuft, 260);
    for (let i = 0; i < 260; i++) { const x = (hash(i, 111) - 0.5) * 60, z = (hash(i, 112) - 0.5) * 60; if (Math.hypot(x - FIRE[0], z - FIRE[2]) < 5) { mm.compose(V(0, -5, 0), q.identity(), V(1, 1, 1)); tufts.setMatrixAt(i, mm); continue; }
      mm.compose(V(x, 0.3, z), q.setFromAxisAngle(V(hash(i, 113) - 0.5, 0, hash(i, 114) - 0.5).normalize(), 0.25), V(1, 0.6 + hash(i, 115) * 0.9, 1)); tufts.setMatrixAt(i, mm); }
    tufts.receiveShadow = true; R.add(tufts);
    for (const [ax, az] of [[-6, -3], [5, 4], [3, -6]] as [number, number][]) {                       // câbles qui tiennent le pylône
      const top = V(SX, 10.2, SZ), bot = V(SX + ax, 0, SZ + az), d = top.clone().sub(bot), L = d.length();
      const cg = new THREE.CylinderGeometry(0.025, 0.025, L, 4).translate(0, L / 2, 0); cg.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), d.normalize())); cg.translate(bot.x, bot.y, bot.z); b.add(cg, metal); }
    b.add(new THREE.BoxGeometry(1.2, 0.5, 0.6).translate(SX, 1.0, SZ + 0.4), rust); b.add(new THREE.BoxGeometry(0.4, 0.15, 0.15).translate(SX, 9.6, SZ), metal);
    for (const s of [-1, 1]) { const bm = new THREE.Mesh(new THREE.ConeGeometry(2.6, 14, 16, 1, true).translate(0, -7, 0).rotateZ(s * Math.PI / 2),
        new THREE.MeshBasicMaterial({ color: "#ff3020", transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
      bm.position.set(SX, 11.5, SZ); bm.layers.set(NOINK); R.add(bm); this.beams.push(bm); }                        // faisceaux rouges tournants
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
    // ---------- détails vivants : particules calculées à partir du temps seul (rendu par morceaux sûr) ----------
    const mk = (key: string, n: number, col: string, size: number, add: boolean, op = 1, fog = true) => { const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(n * 3), 3));
      const pt = new THREE.Points(g, new THREE.PointsMaterial({ map: glowTex(col), size, transparent: true, opacity: op, depthWrite: false, blending: add ? THREE.AdditiveBlending : THREE.NormalBlending, fog }));
      pt.layers.set(NOINK); pt.visible = false; pt.frustumCulled = false; R.add(pt); this.parts[key] = pt; };
    mk("dust", 160, "255,214,160", 0.05, true, 0.9); mk("spark", 90, "255,150,50", 0.2, true); mk("smoke", 70, "175,170,165", 8, false, 0.3);
    mk("bird", 24, "8,8,12", 0.5, false); mk("puff", 140, "210,170,140", 0.7, false, 0.4, false); mk("wisp", 30, "150,150,150", 0.12, false, 0.5);
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
    untone(L.fogCol, this.fog.color); this.fog.near = c.pos[1] > 25 ? 110 + c.pos[1] * 0.25 : L.fogNear; this.fog.far = c.pos[1] > 25 ? Math.min(L.fogFar, 560 + c.pos[1] * 0.9) : L.fogFar;   // brume : le labyrinthe se perd à l'horizon scene.fog = this.fog; scene.background = new THREE.Color(L.bg);
    (this.sky.material as THREE.MeshBasicMaterial).map = this.skyMaps[lk]; this.sky.position.copy(cam.position);
    this.moon.visible = lk === 2; this.moon.position.copy(cam.position).add(V(-0.45, 0.55, -1).normalize().multiplyScalar(5000)); this.moon.lookAt(cam.position);
    this.sunDisc.visible = lk !== 2; this.sunDisc.position.copy(cam.position).add(V(-L.sunDir[0], 0.08, -L.sunDir[2]).normalize().multiplyScalar(-5000)); this.sunDisc.lookAt(cam.position);
    // entrée, blocs mobiles, lueurs
    const close = id >= 22 ? entryClose(t) : 0;
    for (const d of this.doors) d.position.x = d.userData.s * (ENTRY_W / 2 + 1.6 - (ENTRY_W / 2 + 1.6 - (ENTRY_W / 4 + 0.05)) * close);
    this.movers.forEach((mv, i) => { mv.m.visible = id >= 8 && id <= 10; const s = smooth(u) * (hash(i, 64) < 0.5 ? -1 : 1) * CELL;
      mv.m.position.set(mv.x + (mv.ax === "x" ? s : 0), 0, mv.z + (mv.ax === "z" ? s : 0)); });
    const night = lk === 2; if (night) (this.root.getObjectByName("grass") as THREE.Mesh | undefined); const flick = 0.85 + 0.15 * Math.sin(t * 17) * Math.sin(t * 7.3);
    (this.fireGlow.material as THREE.MeshBasicMaterial).opacity = (night ? 1 : 0.55) * flick; this.fireGlow.lookAt(cam.position);
    const siren = id === 15 || id === 20 || id === 21 || id >= 22; const rot = 0.5 + 0.5 * Math.sin(t * 8);
    (this.sirenGlow.material as THREE.MeshBasicMaterial).opacity = siren ? 0.4 + 0.6 * rot : 0.08; this.sirenGlow.lookAt(cam.position); this.sirenLamp.visible = true;
    this.candles.forEach((cd, i) => { (cd.material as THREE.MeshBasicMaterial).opacity = (night ? 0.95 : 0.4) * (0.8 + 0.2 * Math.sin(t * 9 + i * 2)); cd.lookAt(cam.position); });

    const ct = cutAt(f), kc = ct.sid === sid ? ct.k : 0;                                     // sous-plan en cours
    this.torches.forEach((tg, i) => { (tg.material as THREE.MeshBasicMaterial).opacity = (night ? 1 : 0.5) * (0.75 + 0.25 * Math.sin(t * 13 + i * 2) * Math.sin(t * 5.3 + i)); tg.lookAt(cam.position); });
    this.cloths.forEach((c, i) => { c.rotation.x = 0.18 * Math.sin(t * 2.1 + i * 0.9) + 0.06 * Math.sin(t * 5.3 + i); });   // le linge bouge au vent
    this.beams.forEach((bm, i) => { bm.visible = siren; bm.rotation.y = t * 4.2 + i * Math.PI; });
    this.slab.visible = id === 9; this.slab.position.set(-8, 0, WAKE_Z + 8.6 - 8.0 * smooth(u * 1.2));   // 9 : un bloc sort du mur et ferme le couloir
    // ---------- détails vivants (un différent par plan) ----------
    if (id === 7) this.sun.intensity *= 1 - 0.55 * smooth(u);                               // la lumière baisse : la nuit approche
    this.candles.forEach((cd, i) => { if (id === 17 && i === 2) (cd.material as THREE.MeshBasicMaterial).opacity *= 1 - smooth((t - tW(116)) * 5); });   // une bougie s'éteint
    const fwd = new THREE.Vector3(); cam.getWorldDirection(fwd); const rgt = fwd.clone().cross(V(0, 1, 0)).normalize(), upv = rgt.clone().cross(fwd).normalize();
    const nearCam = (d: number, x: number, y: number): V3 => { const q = cam.position.clone().addScaledVector(fwd, d).addScaledVector(rgt, x).addScaledVector(upv, y); return [q.x, q.y, q.z]; };
    const fr = (x: number) => x - Math.floor(x);
    const setP = (key: string, on: boolean, fn?: (i: number, r: (k: number) => number) => V3 | null, size?: number) => { const pt = this.parts[key]; pt.visible = on; if (!on || !fn) return;
      if (size) (pt.material as THREE.PointsMaterial).size = size;
      const a = pt.geometry.getAttribute("position") as THREE.BufferAttribute;
      for (let i = 0; i < a.count; i++) { const v = fn(i, (kk) => hash(i, 300 + kk)) ?? [0, -999, 0]; a.setXYZ(i, v[0], v[1], v[2]); } a.needsUpdate = true; };
    setP("dust", id === 3 || id === 6, (i, r) => id === 3                                    // 3 : poussière qui tombe du mur ; 6 : poussière dorée en suspension
      ? nearCam(1.5 + r(0) * 5, (r(1) - 0.5) * 3, 2.5 - fr(r(2) + t * (0.12 + r(3) * 0.1)) * 5)
      : nearCam(3 + r(0) * 9, (r(1) - 0.5) * 6 + Math.sin(t * 0.6 + i) * 0.3 + t * 0.15, (r(2) - 0.5) * 10 + Math.sin(t * 0.8 + i * 2) * 0.25), id === 6 ? 0.13 : 0.06);
    setP("bird", id === 4 || id === 15, (i, r) => { if (id === 15) { const a = fr(r(0) * 0.3 + t * 0.25); return [SX + (r(1) - 0.5) * 3 + a * 30 * (r(2) - 0.3), 11 + a * 18 + Math.sin(t * 9 + i) * 0.4, SZ + a * 25 * (r(3) - 0.2)]; }   // 15 : oiseaux qui s'envolent du pylône
      const a = u + (r(0) - 0.5) * 0.12;                 // 4 : nuée d'oiseaux noirs qui traverse sous la caméra
      return nearCam(22 + r(1) * 14, -14 + a * 28 + r(2) * 3, -3 + (r(3) - 0.5) * 4 + Math.sin(t * 9 + i) * 0.4); }, 2.2);
    setP("smoke", id === 13, (i, r) => { const a = fr(r(0) + t * 0.08);                       // 13 : la fumée du feu monte au-dessus de la clairière
      return [FIRE[0] + (r(1) - 0.5) * (1 + a * 6) + a * 4, 1 + a * 22, FIRE[2] + (r(2) - 0.5) * (1 + a * 6)]; });
    setP("spark", id === 14, (i, r) => { const a = fr(r(0) + t * (0.5 + r(1) * 0.5));          // 14 : étincelles qui jaillissent du feu
      return [FIRE[0] + (r(2) - 0.5) * 0.6 + Math.sin(t * 3 + i) * a * 0.4, 0.4 + a * (2 + r(3) * 2.5), FIRE[2] + (r(4) - 0.5) * 0.6]; });
    setP("wisp", id === 17 && t > tW(116), (i, r) => { const c = this.candles[2]?.position; if (!c) return null; const a = fr(r(0) + t * 0.35);   // 17 : filet de fumée de la bougie éteinte
      return [c.x + Math.sin(a * 9 + t) * 0.06 * (1 + a * 3), c.y + 0.1 + a * 1.4, c.z]; });
    setP("puff", id === 21 || id === 22 || id === 9, (i, r) => { const a = fr(r(0) + t * (id === 21 ? 2.2 : 0.4));
      if (id === 9) return [-8 + (r(1) - 0.5) * 2.5 * (1 + a), 0.1 + a * 1.6, this.slab.position.z - 4 + r(2) * 8];   // 9 : poussière sous le bloc
      if (id === 21) { const zy = 98 - 26 * u - 0.9; return [(r(1) - 0.5) * 0.5, 0.04 + a * 0.25, zy + a * 0.6]; }   // 21 : poussière sous tes pas
      const sd = r(1) < 0.5 ? -1 : 1, ex = ENTRY_W / 2 + 1.6 - (ENTRY_W / 2 + 1.6 - (ENTRY_W / 4 + 0.05)) * close;          // 22 : poussière soulevée par les murs qui glissent
      return [sd * (ex - 1.2 + (r(2) - 0.5) * 2.5 * (1 + a)), 0.2 + a * 2.2, ENTRY_Z + (r(3) - 0.5) * 3 * (1 + a)]; }, id === 21 ? 0.12 : 2.4);
    const jit = (amp: number, seed: number) => amp * Math.sin(t * 41 + seed) * Math.sin(t * 13 + seed * 2);

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
    const long = (p: V3, s: LongSpec, face?: number, m = 1) => {
      const A = this.longs[kl++]; if (!A) return;
      const d = cam.position.distanceTo(V(p[0], p[1] + 5, p[2])), [w, h, kk] = tierOf(d / LONG_K * 0.6);
      A.r = this.pool.req(`L|${JSON.stringify(s)}`, w, h, kk, (pen: Pen) => drawLong(pen, s));
      A.mesh.position.set(...p); A.mesh.up.set(0, 1, 0); A.mesh.rotation.set(0, face ?? yaw(p), 0);
      { const dy = cam.position.y - (p[1] + 5), hz = Math.hypot(cam.position.x - p[0], cam.position.z - p[2]);          // vu de haut : la carte se tourne vers la caméra
        if (Math.atan2(dy, hz) > 0.95) { A.mesh.up.set(0, 1, 0).applyQuaternion(cam.quaternion); A.mesh.lookAt(cam.position); A.mesh.up.set(0, 1, 0); } }
      A.mesh.scale.setScalar(LONG_K * m); A.mesh.visible = true; this.longShadow[kl - 1] = !!s.shadow;
    };
    /** ombre immense couchée au sol du couloir : elle s'allonge vers toi avant que le Long n'apparaisse (lumière de la sirène derrière lui) */
    const floorShadow = (z: number, sc: number, s: LongSpec) => { long([0, 0.04, z], { ...s, shadow: true }, 0); const A = this.longs[kl - 1];
      if (A) { A.mesh.rotation.set(Math.PI / 2, 0, 0); A.mesh.scale.set(LONG_K * 1.1, LONG_K * sc, 1); } };
    const blink = (seed: number) => (f + seed * 37) % 97 < 4;
    const W2: V3 = [YOU_WAKE[0], 0.02, YOU_WAKE[2] + 0.0];
    if (id === 1) { place("Y", [YOU_WAKE[0], 0, YOU_WAKE[2]], { mode: "stand", expr: "fear", blink: false }, 1); long([0.2, 0, 0], { pose: "peek", turn: 0.35 - 0.35 * smooth(t / tW(1)), tilt: 0.38 * smooth(t / tW(2)), tap: t * 0.9, mouth: smooth((t - tW(2) + 0.05) / 0.3) }, Math.PI, HOOK_M);
      { const A = this.longs[kl - 1], lean = hookLean(t), hc = (975 - PEEK_CUT) * 0.00216 * LONG_K * HOOK_M;   // pivot sur l'arête : la coupe reste sur le mur, la tête vient au-dessus de toi
        if (A) { A.mesh.rotation.set(lean, Math.PI, 0, "YXZ"); A.mesh.position.set(0.2, H - hc * Math.cos(lean), WAKE_Z + 2.93 + hc * Math.sin(lean)); } } }   // accroche : la tête se penche, se tourne vers toi, la bouche s'ouvre sur « bouge pas »   // carte parallèle au mur : la main reste devant la paroi
    if (id === 2 || id === 3) place("Y", W2, { mode: "stand", expr: "worry", blink: id === 2 && u < 0.45 }, 1, true);
    if (id === 5) place("Y", [YOU_WAKE[0], 0, YOU_WAKE[2]], { mode: "stand", expr: "worry", blink: blink(1), look: Math.sin(u * 5) * 0.8 });
    if (id === 10 || id === 12) {                                                          // drones au ras du sol : des Longs dans le couloir et derrière les murs
      const P: [number, number][] = id === 10 ? [[14, 1.4], [6, -9], [-2, 9], [-8, -1.2], [-16, -9], [-24, 9], [-32, 1.0], [24, 9]] : [[-40, 1.2], [-48, 9], [-33, -9], [-55, -9], [-18, -9], [-12, 9]];
      P.forEach(([x, dz], i) => long([x + (i % 2 ? 1 : -1) * 2.5 * u, 0, WAKE_Z + dz], { pose: "walk", step: ((t * 0.45 + i * 0.3) % 1 + 1) % 1 }));
      if (id === 12) { place("C", [-22 + jit(0.03, 2), 0, WAKE_Z - 1.0], { mode: "stand", expr: "fear", blink: false });
        long([-24.5, 0, WAKE_Z + 1.6], { pose: "stand", tilt: 0.42 * smooth(u * 1.4), turn: 0.3 * Math.sin(u * 3), mouth: 0.4 * smooth((u - 0.6) * 3) }); }
    }
    if (id === 11) { long([13, 0, WAKE_Z + 0.4], { pose: "stand", tilt: 0.38 * smooth((u - 0.3) * 2.5) }); place("B", [10.6 + jit(0.035, 1), 0, WAKE_Z - 0.6], { mode: "stand", expr: "worry" }); }   // le jeune tremble
    if (id === 13 || id === 14) {
      RING.forEach(([key, a], i) => place(key, [FIRE[0] + Math.cos(a) * 3.1, 0, FIRE[2] + Math.sin(a) * 3.1], { mode: "stand", expr: i % 3 ? "worry" : "calm", blink: blink(i + 2) }));
      if (id === 14) place("Y", [0.4, 0, 1.2], { mode: "stand", expr: "worry", back: true });
    }
    if (id === 15) [[-3, 22], [-1, 24], [1.5, 23]].forEach(([x, z], i) => place(["A", "D", "E"][i], [x, 0, z - 6 * smooth(u)], { mode: "stand", expr: "worry", side: -1 }));
    if (id === 16) RING.slice(0, 6).forEach(([key, a], i) => place(key, [FIRE[0] + Math.cos(a) * 3.1 + (i === 2 ? jit(0.04, 3) * (1 - smooth(u * 1.6)) : 0), 0, FIRE[2] + Math.sin(a) * 3.1], { mode: "stand", expr: "mute" }));   // un jeune tremble puis se fige
    if (id === 18) place("Y", [0, 0, 20], { mode: "stand", expr: "calm", blink: blink(5) });
    if (id === 19) place("Y", [0, 0, 118 - 30 * u], { mode: "stand", expr: "calm" });
    if (id === 21) place("Y", [0, 0.06 * Math.abs(Math.sin(t * 9)), 98 - 26 * u - 0.9], { mode: "stand", expr: "worry", back: kc !== 1 });
    if (id === 20) place("Y", [0, 0, 90], { mode: "stand", expr: "shock", blink: false });
    if (id >= 22 && id <= 27) {
      const unfold = id === 23 ? smooth(u * 1.15) : id < 23 ? 0 : 1;
      if (id === 22) floorShadow(LONG_RUN[2], 0.4 + 1.6 * smooth(u), { pose: "crouch", unfold: 0.25 + 0.75 * smooth(u) });   // l'ombre arrive avant lui
      if (id === 23) floorShadow(LONG_RUN[2], 2.0, { pose: "crouch", unfold: smooth(u * 1.15) });
      if (id >= 23) long(LONG_RUN, unfold < 1 ? { pose: "crouch", unfold } : { pose: "stand",
        turn: id === 24 ? 0.85 * (1 - smooth(u * 1.6)) : 0, mouth: id === 24 ? smooth((u - 0.55) * 3) : id >= 26 ? 0.6 : 0, tilt: id === 24 ? 0.22 * smooth((u - 0.4) * 3) : id === 27 ? 0.18 : 0 }, 0);
      if (id !== 24) place("Y", [0, 0, YOU_RUN_Z - (id === 27 ? 0.35 * Math.max(0, Math.sin(u * Math.PI * 3)) * (1 - u) : 0)],   // 27 : tu hésites, un pas en avant, puis tu te retiens
        { mode: "stand", expr: "worry", back: id === 22 || id === 23 || id === 25 || (id === 26 && kc > 0) || (id === 27 && kc !== 4), blink: id === 26 && blink(6) });
    }
    void tW; void H;
    for (; k < this.actors.length; k++) this.actors[k].mesh.visible = false;
    for (; kl < this.longs.length; kl++) this.longs[kl].mesh.visible = false;
    this.pool.flush();
    for (const a of [...this.actors, ...this.longs]) if (a.mesh.visible) a.bind();
    this.longs.forEach((a, i) => { if (!a.mesh.visible) return;                 // les Longs brillent d'eux-mêmes (références : géants lumineux, non éclairés)
      const m = (this.longMats[i] ??= new THREE.MeshBasicMaterial({ alphaTest: 0.5, side: THREE.DoubleSide, fog: true }));
      if (this.longShadow[i]) { const sm = (this.shadowMats[i] ??= new THREE.MeshBasicMaterial({ alphaTest: 0.5, transparent: true, opacity: 0.85, color: "#000", depthWrite: false, side: THREE.DoubleSide }));
        sm.map = a.mat.map; a.mesh.material = sm; return; }
      m.map = a.mat.map; m.color.setRGB(1.05, 1.05, 1.1); a.mesh.material = m; });
    return focus;
  }
}
