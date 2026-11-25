// Le Monstre : personnages en blocs, version « montée en gamme » (col, ceinture, poches, semelles, casquette, radio modélisés).
// Personnages en blocs (style des références : jambes/torse/bras/tête cubiques aux arêtes adoucies, visage dessiné sur la face avant).
// Nouveaux designs, identité fixe d'un plan à l'autre. Unité interne : 1 « bloc » = 0,36 m (hauteur totale 5,2 blocs ≈ 1,87 m).
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { ctex, hash } from "./tex";

export type Expr = "smile" | "happy" | "neutral" | "sad" | "worried" | "angry" | "scared" | "shout" | "smug" | "focus";
export type Spec = {
  name: string; skin: string; top: string; topDark: string; sleeve: string; pants: string; shoes: string;
  style: "hoodie" | "suit" | "plaid" | "tee" | "cardigan" | "dress" | "jacket" | "uniform"; radio?: boolean;
  inner?: string; hair: "messy" | "short" | "long" | "bun" | "bald" | "cap" | "slick" | "curly"; hairCol: string; capCol?: string;
  beard?: string; mustache?: string; chain?: string; glasses?: boolean; backpack?: string; kid?: boolean; star?: string;
};

export const CAST: Record<string, Spec> = {
  hero: { name: "hero", skin: "#f1c7a0", top: "#f2b51c", topDark: "#c98f10", sleeve: "#f2b51c", pants: "#2c3140", shoes: "#e9e9e9", style: "jacket", inner: "#2c3140", hair: "messy", hairCol: "#2a1d16", kid: true },
  dad: { name: "dad", skin: "#c98a5c", top: "#2d4f8c", topDark: "#1f3866", sleeve: "#2d4f8c", pants: "#4a505c", shoes: "#1a1a1a", style: "uniform", hair: "cap", hairCol: "#1d1712", capCol: "#23407a", mustache: "#2a1d16", radio: true },
  guard: { name: "guard", skin: "#e0ac80", top: "#2a3f6a", topDark: "#1c2c4e", sleeve: "#2a3f6a", pants: "#3b404c", shoes: "#151515", style: "uniform", hair: "cap", hairCol: "#2a1d16", capCol: "#1f3460", radio: true },
  guard2: { name: "guard2", skin: "#8a5a3c", top: "#2a3f6a", topDark: "#1c2c4e", sleeve: "#2a3f6a", pants: "#3b404c", shoes: "#151515", style: "uniform", hair: "cap", hairCol: "#111", capCol: "#1f3460", radio: true },
  pink: { name: "pink", skin: "#f5d0b0", top: "#ff3fa4", topDark: "#d02a82", sleeve: "#ff3fa4", pants: "#33405e", shoes: "#f4f4f4", style: "hoodie", hair: "long", hairCol: "#3a2416" },
  c1: { name: "c1", skin: "#e0ac80", top: "#f08a2a", topDark: "#c46a18", sleeve: "#f08a2a", pants: "#4a4a52", shoes: "#2a2a2a", style: "jacket", inner: "#f4f1ea", hair: "curly", hairCol: "#3a2a1e" },
  c2: { name: "c2", skin: "#7a4a2e", top: "#2fae7a", topDark: "#1f8a5c", sleeve: "#2fae7a", pants: "#2a3a6a", shoes: "#f4f4f4", style: "tee", hair: "short", hairCol: "#111111" },
  c3: { name: "c3", skin: "#c98a5c", top: "#9aa4b2", topDark: "#788292", sleeve: "#9aa4b2", pants: "#3a3f4a", shoes: "#2a2a2a", style: "jacket", inner: "#c4283a", hair: "bald", hairCol: "#3a2a1e", beard: "#3a2a1e" },
  c4: { name: "c4", skin: "#f5d6bc", top: "#5b6fd8", topDark: "#3f50b0", sleeve: "#5b6fd8", pants: "#262a33", shoes: "#c4283a", style: "cardigan", inner: "#f4f1ea", hair: "bun", hairCol: "#c08a3a" },
};

const mats = new Map<string, THREE.Material>();
const fabric = () => ctex("fabric", 128, 128, (g) => { g.fillStyle = "#f2f2f2"; g.fillRect(0, 0, 128, 128);
  for (let y = 0; y < 128; y += 2) { g.fillStyle = `rgba(0,0,0,${0.03 + hash(y, 1) * 0.04})`; g.fillRect(0, y, 128, 1); }
  for (let x = 0; x < 128; x += 2) { g.fillStyle = `rgba(255,255,255,${0.03 + hash(x, 2) * 0.05})`; g.fillRect(x, 0, 1, 128); }
  for (let i = 0; i < 300; i++) { g.fillStyle = `rgba(0,0,0,${hash(i, 3) * 0.06})`; g.fillRect(hash(i, 4) * 128, hash(i, 5) * 128, 3, 3); } }, true);
const mat = (col: string, extra: THREE.MeshStandardMaterialParameters = {}, key = "") => {
  const k = col + key; let m = mats.get(k);
  if (!m) { m = new THREE.MeshStandardMaterial({ color: col, roughness: 0.72, metalness: 0, map: extra.metalness ? undefined : fabric(), ...extra }); mats.set(k, m); }
  return m;
};
const geos = new Map<string, THREE.BufferGeometry>();
const rbox = (w: number, h: number, d: number, r = 0.12) => { const k = `${w}_${h}_${d}_${r}`; let g = geos.get(k); if (!g) { g = new RoundedBoxGeometry(w, h, d, 2, r); geos.set(k, g); } return g; };
const mesh = (g: THREE.BufferGeometry, m: THREE.Material, x = 0, y = 0, z = 0) => { const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.castShadow = true; o.receiveShadow = true; return o; };

/** visage (fond transparent) : yeux, sourcils, bouche, barbe, lunettes */
export const faceTex = (s: Spec, e: Expr) => ctex(`face_${s.name}_${e}`, 256, 256, (g) => {
  g.clearRect(0, 0, 256, 256);
  const ink = "#1b1410", ey = 108, lx = 82, rx = 174;
  if (s.beard) { g.fillStyle = s.beard; g.beginPath(); g.moveTo(20, 140); g.lineTo(236, 140); g.lineTo(236, 256); g.lineTo(20, 256); g.fill(); g.fillStyle = "rgba(0,0,0,0)"; }
  g.lineCap = "round"; g.strokeStyle = ink; g.fillStyle = ink;
  const dot = (x: number, r = 13) => { g.beginPath(); g.ellipse(x, ey, r * 0.8, r, 0, 0, 7); g.fill(); g.fillStyle = "#fff"; g.beginPath(); g.arc(x + 3, ey - 5, 3.5, 0, 7); g.fill(); g.fillStyle = ink; };
  const arcEye = (x: number) => { g.lineWidth = 9; g.beginPath(); g.arc(x, ey + 8, 16, Math.PI * 1.15, Math.PI * 1.85); g.stroke(); };
  const brow = (x: number, tilt: number, y = ey - 36) => { g.lineWidth = 9; g.beginPath(); g.moveTo(x - 18, y + tilt); g.lineTo(x + 18, y - tilt); g.stroke(); };
  const mouthY = s.beard ? 178 : 176;
  if (e === "happy") { arcEye(lx); arcEye(rx); }
  else if (e === "scared") { for (const x of [lx, rx]) { g.fillStyle = "#fff"; g.beginPath(); g.arc(x, ey, 20, 0, 7); g.fill(); g.lineWidth = 4; g.stroke(); g.fillStyle = ink; g.beginPath(); g.arc(x, ey + 2, 9, 0, 7); g.fill(); } }
  else if (e === "focus") { g.lineWidth = 10; g.beginPath(); g.moveTo(lx - 14, ey); g.lineTo(lx + 14, ey); g.moveTo(rx - 14, ey); g.lineTo(rx + 14, ey); g.stroke(); }
  else { dot(lx); dot(rx); }
  if (e === "sad" || e === "worried" || e === "scared") { brow(lx, 7); brow(rx, -7); }
  if (e === "angry" || e === "focus") { brow(lx, -8, ey - 30); brow(rx, 8, ey - 30); }
  if (e === "smug") { brow(lx, 0); brow(rx, -6); }
  g.lineWidth = 8;
  const open = (w: number, h: number) => { g.fillStyle = "#5a1a1a"; g.beginPath(); g.ellipse(128, mouthY, w, h, 0, 0, Math.PI); g.fill(); g.fillStyle = "#e2707a"; g.beginPath(); g.ellipse(128, mouthY + h * 0.6, w * 0.6, h * 0.35, 0, 0, 7); g.fill(); g.fillStyle = "#fff"; g.fillRect(128 - w * 0.8, mouthY, w * 1.6, 7); g.fillStyle = ink; };
  if (e === "smile" || e === "smug") { g.beginPath(); g.arc(128, mouthY - 24, 30, Math.PI * 0.2, Math.PI * 0.8); g.stroke(); }
  else if (e === "happy") open(34, 30);
  else if (e === "neutral" || e === "focus") { g.beginPath(); g.moveTo(108, mouthY); g.lineTo(148, mouthY); g.stroke(); }
  else if (e === "sad" || e === "angry") { g.beginPath(); g.arc(128, mouthY + 24, 24, Math.PI * 1.22, Math.PI * 1.78); g.stroke(); }
  else if (e === "worried") { g.beginPath(); g.moveTo(104, mouthY + 4); g.quadraticCurveTo(116, mouthY - 6, 128, mouthY + 2); g.quadraticCurveTo(140, mouthY + 8, 152, mouthY - 2); g.stroke(); }
  else if (e === "scared") { g.fillStyle = "#5a1a1a"; g.beginPath(); g.ellipse(128, mouthY + 6, 14, 20, 0, 0, 7); g.fill(); }
  else if (e === "shout") open(40, 44);
  if (s.mustache) { g.fillStyle = s.mustache; g.beginPath(); g.ellipse(108, mouthY - 16, 22, 9, -0.2, 0, 7); g.ellipse(148, mouthY - 16, 22, 9, 0.2, 0, 7); g.fill(); }
  if (s.glasses) { g.fillStyle = "#121212"; g.beginPath(); g.roundRect(46, ey - 22, 70, 42, 10); g.roundRect(140, ey - 22, 70, 42, 10); g.fill(); g.fillRect(110, ey - 14, 36, 8);
    g.fillStyle = "rgba(255,255,255,0.35)"; g.fillRect(58, ey - 14, 16, 8); g.fillRect(152, ey - 14, 16, 8); }
  if (e === "smile" || e === "happy") { g.fillStyle = "rgba(240,110,110,0.28)"; g.beginPath(); g.arc(56, 150, 16, 0, 7); g.arc(200, 150, 16, 0, 7); g.fill(); }
});

/** devant du torse : capuche + poche, costume + chemise, carreaux, t-shirt étoile, gilet, robe */
const torsoTex = (s: Spec) => ctex(`torso_${s.name}`, 256, 256, (g) => {
  g.fillStyle = s.top; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 400; i++) { g.fillStyle = `rgba(${hash(i, 1) < 0.5 ? "0,0,0" : "255,255,255"},0.04)`; g.fillRect(hash(i, 2) * 256, hash(i, 3) * 256, 3, 3); }
  if (s.style === "hoodie") { g.fillStyle = s.topDark; g.beginPath(); g.roundRect(48, 150, 160, 80, 14); g.fill(); g.fillStyle = s.top; g.fillRect(60, 162, 136, 60);
    g.strokeStyle = "#f4f4f4"; g.lineWidth = 6; g.beginPath(); g.moveTo(104, 0); g.lineTo(100, 80); g.moveTo(152, 0); g.lineTo(156, 80); g.stroke();
    g.fillStyle = s.topDark; g.fillRect(0, 0, 256, 20); }
  if (s.style === "suit" || s.style === "jacket") { const inner = s.inner ?? "#fff"; g.fillStyle = inner; g.beginPath(); g.moveTo(84, 0); g.lineTo(172, 0); g.lineTo(128, s.style === "suit" ? 150 : 256); g.fill();
    if (s.style === "suit") { g.fillStyle = s.name === "rich1" ? "#f2c230" : "#1a1a1a"; g.beginPath(); g.moveTo(120, 20); g.lineTo(136, 20); g.lineTo(140, 130); g.lineTo(128, 146); g.lineTo(116, 130); g.fill(); }
    g.fillStyle = s.topDark; g.beginPath(); g.moveTo(84, 0); g.lineTo(108, 100); g.lineTo(96, 110); g.lineTo(62, 0); g.fill(); g.beginPath(); g.moveTo(172, 0); g.lineTo(148, 100); g.lineTo(160, 110); g.lineTo(194, 0); g.fill();
    g.fillStyle = "#e8e8e8"; for (const y of [170, 210]) { g.beginPath(); g.arc(140, y, 5, 0, 7); g.fill(); } }
  if (s.style === "uniform") { g.fillStyle = s.topDark; g.fillRect(126, 0, 5, 256); g.fillStyle = "#c9ccd4"; for (const y of [60, 110, 160, 210]) { g.beginPath(); g.arc(138, y, 5, 0, 7); g.fill(); }
    g.fillStyle = s.topDark; g.fillRect(30, 70, 70, 52); g.fillRect(156, 70, 70, 52); g.fillStyle = s.top; g.fillRect(30, 70, 70, 10); g.fillRect(156, 70, 70, 10);
    g.fillStyle = "#d9b23a"; g.beginPath(); g.moveTo(190, 30); g.lineTo(206, 40); g.lineTo(200, 58); g.lineTo(180, 58); g.lineTo(174, 40); g.fill(); }
  if (s.style === "plaid") { for (let x = 0; x < 256; x += 42) { g.fillStyle = "rgba(30,40,10,0.35)"; g.fillRect(x, 0, 16, 256); } for (let y = 0; y < 256; y += 42) { g.fillStyle = "rgba(30,40,10,0.3)"; g.fillRect(0, y, 256, 16); }
    for (let x = 20; x < 256; x += 42) { g.fillStyle = "rgba(255,230,160,0.25)"; g.fillRect(x, 0, 3, 256); } g.fillStyle = "#e8e2d0"; for (const y of [60, 120, 180, 230]) { g.beginPath(); g.arc(128, y, 5, 0, 7); g.fill(); } }
  if (s.style === "tee" && s.star) { g.fillStyle = s.star; g.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 22 : 50; g.lineTo(128 + Math.cos(a) * r, 110 + Math.sin(a) * r); } g.fill(); }
  if (s.style === "tee") { g.fillStyle = s.topDark; g.fillRect(0, 0, 256, 14); }
  if (s.style === "cardigan") { g.fillStyle = s.inner ?? "#fff"; g.fillRect(96, 0, 64, 256); g.fillStyle = s.topDark; g.fillRect(90, 0, 8, 256); g.fillRect(158, 0, 8, 256); }
  if (s.style === "dress") { g.fillStyle = s.topDark; g.fillRect(0, 150, 256, 10); g.fillStyle = "rgba(255,255,255,0.15)"; g.beginPath(); g.moveTo(80, 0); g.quadraticCurveTo(128, 70, 176, 0); g.fill(); }
});

export type Pose = {
  walk?: number; wave?: "L" | "R" | "both"; cheer?: boolean; armsUp?: number; point?: number; bang?: boolean; pull?: number;
  yaw?: number; headYaw?: number; headPitch?: number; expr?: Expr; talk?: boolean; sit?: boolean; swim?: boolean; look?: number;
};
export class Actor {
  root = new THREE.Group(); body = new THREE.Group(); s: Spec;
  lArm = new THREE.Group(); rArm = new THREE.Group(); lLeg = new THREE.Group(); rLeg = new THREE.Group(); neck = new THREE.Group(); torso: THREE.Mesh;
  face: THREE.Mesh; seed: number; radio?: THREE.Group; led?: THREE.Mesh; torch?: THREE.Group;
  constructor(s: Spec, scale = 0.36, seed = 0) {
    this.s = s; this.seed = seed;
    const k = s.kid ? 0.72 : 1, legH = s.kid ? 1.3 : 2;
    this.root.add(this.body); this.body.scale.setScalar(scale * (s.kid ? 0.95 : 1));
    const skin = mat(s.skin), top = mat(s.top), pants = mat(s.style === "dress" ? s.top : s.pants), shoes = mat(s.shoes);
    // jambes (pivot à la hanche)
    for (const [leg, x] of [[this.lLeg, -0.5], [this.rLeg, 0.5]] as const) {
      leg.position.set(x, legH, 0); this.body.add(leg);
      if (s.style === "dress") { leg.add(mesh(rbox(0.9, legH * 0.55, 0.9, 0.1), skin, 0, -legH * 0.72, 0)); }
      else leg.add(mesh(rbox(0.98, legH * 0.85, 0.98, 0.1), pants, 0, -legH * 0.43, 0));
      leg.add(mesh(rbox(1.02, legH * 0.18, 1.12, 0.08), shoes, 0, -legH + legH * 0.09 + 0.05, 0.04));
      leg.add(mesh(rbox(1.08, 0.1, 1.2, 0.04), mat("#1a1a1a", { roughness: 0.9 }, "sole"), 0, -legH + 0.05, 0.05));
    }
    if (s.style === "dress") { const sk = mesh(new THREE.CylinderGeometry(1.05, 1.35, legH * 0.55, 4, 1).rotateY(Math.PI / 4), top, 0, legH * 0.72, 0); this.body.add(sk); }
    // torse
    const tm = [top, top, top, top, new THREE.MeshStandardMaterial({ map: torsoTex(s), roughness: 0.72 }), top];
    this.torso = new THREE.Mesh(new THREE.BoxGeometry(2, 2 * k + (s.kid ? 0.3 : 0), 1), tm); this.torso.castShadow = true; this.torso.receiveShadow = true;
    const tH = 2 * k + (s.kid ? 0.3 : 0); this.torso.position.y = legH + tH / 2; this.body.add(this.torso);
    // détails modélisés : col, ceinture + boucle, poches, semelles
    const dark = mat(s.topDark), belt = mat("#1c1c20", { roughness: 0.45, metalness: 0.1 }, "belt"), metal = mat("#c9ccd4", { metalness: 0.9, roughness: 0.3 }, "buckle");
    if (s.style !== "dress") { this.body.add(mesh(rbox(2.06, 0.26, 1.08, 0.06), s.style === "uniform" ? belt : dark, 0, legH + 0.13, 0)); }
    if (s.style === "uniform") { this.body.add(mesh(rbox(0.34, 0.2, 0.08, 0.03), metal, 0, legH + 0.13, 0.55));
      for (const x of [-0.55, 0.55]) this.body.add(mesh(rbox(0.5, 0.14, 0.4, 0.05), dark, x, legH + tH - 0.06, 0.3)); }
    if (s.style === "jacket" || s.style === "uniform" || s.style === "hoodie") { const c = mesh(rbox(1.3, 0.3, 1.1, 0.1), dark, 0, legH + tH + 0.05, 0); this.body.add(c); }
    if (s.radio) { const r = new THREE.Group(); r.position.set(0.62, legH + tH - 0.55, 0.56); this.body.add(r); this.radio = r;
      r.add(mesh(rbox(0.36, 0.56, 0.2, 0.05), mat("#1b1d22", { roughness: 0.5 }, "radio"), 0, 0, 0)); r.add(mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.5, 6), mat("#111", { roughness: 0.4 }, "ant"), 0.1, 0.5, 0));
      const led = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), new THREE.MeshStandardMaterial({ color: "#ff5a1e", emissive: "#ff5a1e", emissiveIntensity: 3 })); led.position.set(-0.1, 0.2, 0.11); r.add(led); this.led = led; }
    if (s.chain) { const ch = new THREE.Group(); const cm = mat(s.chain, { metalness: 0.8, roughness: 0.25, emissive: s.chain, emissiveIntensity: 0.12 }, "chain");
      for (let i = 0; i <= 12; i++) { const a = Math.PI * (0.1 + 0.8 * i / 12); ch.add(mesh(new THREE.SphereGeometry(0.09, 8, 6), cm, Math.cos(a) * 0.62, -Math.sin(a) * 0.75, 0)); }
      ch.add(mesh(new THREE.SphereGeometry(0.2, 12, 10), cm, 0, -0.92, 0.02)); ch.position.set(0, legH + tH - 0.05, 0.53); this.body.add(ch); }
    if (s.backpack) { this.body.add(mesh(rbox(1.6, 1.6, 0.6, 0.15), mat(s.backpack), 0, legH + tH * 0.5, -0.78)); }
    // bras (pivot à l'épaule)
    for (const [arm, x] of [[this.lArm, -1.5], [this.rArm, 1.5]] as const) {
      arm.position.set(x, legH + tH - 0.3, 0); this.body.add(arm);
      arm.add(mesh(rbox(0.98, tH * 0.72, 0.98, 0.1), mat(s.style === "dress" ? s.skin : s.sleeve), 0, -tH * 0.36 + 0.3, 0));
      arm.add(mesh(rbox(0.94, tH * 0.3, 0.94, 0.12), skin, 0, -tH * 0.85 + 0.3, 0));
    }
    // tête
    this.neck.position.set(0, legH + tH, 0); this.body.add(this.neck);
    const head = mesh(rbox(1.3, 1.25, 1.25, 0.22), skin, 0, 0.66, 0); this.neck.add(head);
    this.face = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.2), new THREE.MeshStandardMaterial({ map: faceTex(s, "smile"), transparent: true, roughness: 0.8, polygonOffset: true, polygonOffsetFactor: -2 }));
    this.face.position.set(0, 0.64, 0.63); this.neck.add(this.face);
    this.hair(s);
  }
  private hair(s: Spec) {
    const hm = mat(s.hairCol), h = this.neck;
    const b = (w: number, hh: number, d: number, x: number, y: number, z: number, r = 0.1, rx = 0, rz = 0, m = hm) => { const o = mesh(rbox(w, hh, d, r), m, x, y, z); o.rotation.set(rx, 0, rz); h.add(o); return o; };
    if (s.hair === "messy") { b(1.42, 0.45, 1.38, 0, 1.33, -0.02); b(1.42, 0.8, 0.3, 0, 0.95, -0.6); for (let i = 0; i < 5; i++) b(0.42, 0.34, 0.5, -0.5 + i * 0.25, 1.52 + hash(i, 3) * 0.08, 0.35 - hash(i, 4) * 0.3, 0.08, 0.3, (hash(i, 5) - 0.5) * 0.8); b(1.4, 0.24, 0.3, 0, 1.18, 0.6, 0.08); }
    if (s.hair === "short") { b(1.4, 0.32, 1.36, 0, 1.36, -0.01); b(1.4, 0.6, 0.25, 0, 1.0, -0.6); b(0.12, 0.5, 1.2, -0.68, 1.05, -0.05); b(0.12, 0.5, 1.2, 0.68, 1.05, -0.05); }
    if (s.hair === "slick") { b(1.42, 0.4, 1.38, 0, 1.36, -0.03, 0.15); b(1.42, 0.7, 0.28, 0, 1.0, -0.6); b(1.0, 0.3, 0.5, 0.18, 1.55, 0.28, 0.12, 0.2); }
    if (s.hair === "long") { b(1.44, 0.4, 1.4, 0, 1.36, -0.02); b(1.5, 2.0, 0.42, 0, 0.45, -0.55); b(0.3, 1.7, 1.0, -0.7, 0.55, -0.12); b(0.3, 1.7, 1.0, 0.7, 0.55, -0.12); b(0.9, 0.3, 0.3, 0.25, 1.2, 0.6, 0.08, 0, -0.3); }
    if (s.hair === "bun") { b(1.42, 0.36, 1.38, 0, 1.36, -0.02); b(1.42, 0.7, 0.28, 0, 1.0, -0.6); const bun = mesh(new THREE.SphereGeometry(0.42, 14, 10), hm, 0, 1.6, -0.45); h.add(bun); }
    if (s.hair === "bald") { b(0.18, 0.5, 1.0, -0.7, 0.85, -0.12); b(0.18, 0.5, 1.0, 0.7, 0.85, -0.12); b(1.3, 0.5, 0.2, 0, 0.85, -0.62); }
    if (s.hair === "curly") { for (let i = 0; i < 14; i++) { const a = (i / 14) * Math.PI * 2; const o = mesh(new THREE.SphereGeometry(0.36, 10, 8), hm, Math.cos(a) * 0.5, 1.35 + hash(i, 2) * 0.15, Math.sin(a) * 0.45 - 0.1); h.add(o); } b(1.3, 0.6, 1.2, 0, 1.3, -0.08, 0.3); }
    if (s.hair === "cap") { b(1.42, 0.4, 1.38, 0, 1.33, 0, 0.12, 0, 0, mat(s.capCol!)); b(1.3, 0.1, 0.7, 0, 1.18, 0.9, 0.04, 0, 0, mat(s.capCol!)); b(1.42, 0.4, 0.25, 0, 0.98, -0.6); }
  }
  /** lampe torche dans la main droite (le faisceau est géré par la scène) ; renvoie le bout de la lampe */
  addTorch() {
    const g = new THREE.Group(), k = this.s.kid ? 0.72 : 1, tH = 2 * k + (this.s.kid ? 0.3 : 0);
    g.position.set(0, -tH * 0.85 + 0.3, 0.5); g.rotation.x = Math.PI / 2; this.rArm.add(g); this.torch = g;
    const body = mat("#202226", { roughness: 0.35, metalness: 0.6 }, "torch");
    const c = mesh(new THREE.CylinderGeometry(0.2, 0.2, 1.3, 12).rotateX(Math.PI / 2), body, 0, 0, 0.5); g.add(c);
    g.add(mesh(new THREE.CylinderGeometry(0.32, 0.22, 0.4, 14).rotateX(Math.PI / 2), body, 0, 0, 1.3));
    const lens = new THREE.Mesh(new THREE.CircleGeometry(0.29, 18), new THREE.MeshStandardMaterial({ color: "#fff", emissive: "#fff6e0", emissiveIntensity: 6 })); lens.position.set(0, 0, 1.51); g.add(lens);
    return g;
  }
  /** pose à l'instant t (s) */
  pose(t: number, p: Pose = {}) {
    const ph = t * 2 * Math.PI + this.seed * 1.7, br = Math.sin(ph * 0.33);
    this.torso.scale.set(1 + br * 0.012, 1 + br * 0.018, 1 + br * 0.015);
    this.root.rotation.y = p.yaw ?? 0;
    let la = 0.05 * Math.sin(ph * 0.3), ra = -0.05 * Math.sin(ph * 0.3 + 1), lz = -0.06, rz = 0.06, ll = 0, rl = 0, by = 0;
    if (p.walk) { const w = Math.sin(t * p.walk * 6 + this.seed); la = w * 0.6; ra = -w * 0.6; ll = -w * 0.55; rl = w * 0.55; by = Math.abs(Math.cos(t * p.walk * 6 + this.seed)) * 0.12; }
    if (p.wave) { const w = Math.sin(t * 9 + this.seed) * 0.35; if (p.wave !== "L") { ra = -2.6; rz = 0.4 + w; } if (p.wave !== "R") { la = -2.6; lz = -0.4 - w; } }
    if (p.cheer) { const w = Math.abs(Math.sin(t * 5 + this.seed)); la = -2.7 - w * 0.3; ra = -2.7 - w * 0.3; lz = -0.35; rz = 0.35; by = w * 0.35; }
    if (p.armsUp) { la = ra = -p.armsUp * 2.9; lz = -0.15; rz = 0.15; }
    if (p.point !== undefined) { ra = -1.5 - p.point * 0.4; rz = 0.1; }
    if (p.bang) { const w = Math.max(0, Math.sin(t * 7 + this.seed)); ra = -1.9 + w * 0.6; la = -1.6 + Math.max(0, Math.sin(t * 7 + this.seed + 2)) * 0.6; by = 0; }
    if (p.pull !== undefined) { ra = la = -2.4 + p.pull * 2.0; rz = 0.12; lz = -0.12; by = -p.pull * 0.4; }
    if (p.sit) { ll = rl = -1.45; by = -1.05; }
    if (p.swim) { const w = Math.sin(t * 4 + this.seed); la = -2.2 + w * 0.6; ra = -2.2 - w * 0.6; lz = -0.3; rz = 0.3; }
    this.lArm.rotation.set(la, 0, lz); this.rArm.rotation.set(ra, 0, rz); this.lLeg.rotation.x = ll; this.rLeg.rotation.x = rl;
    this.body.position.y = by * this.body.scale.y;
    this.neck.rotation.set(p.headPitch ?? 0.03 * Math.sin(ph * 0.25), (p.headYaw ?? 0) + 0.08 * Math.sin(ph * 0.17 + 2), 0.03 * Math.sin(ph * 0.21));
    const e = p.talk && Math.sin(t * 14) > 0.2 ? "shout" : p.expr;
    if (e) { const m = this.face.material as THREE.MeshStandardMaterial, tx = faceTex(this.s, e); if (m.map !== tx) { m.map = tx; m.needsUpdate = true; } }
    return this;
  }
}
