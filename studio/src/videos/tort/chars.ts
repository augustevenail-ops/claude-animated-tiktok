// Les Dessins : personnages en blocs (repris du Dernier Appel) + crayon en main, bouche sans dents, mode « traits de crayon ».
// Le Monstre : personnages en blocs, version « montée en gamme » (col, ceinture, poches, semelles, casquette, radio modélisés).
// Personnages en blocs (style des références : jambes/torse/bras/tête cubiques aux arêtes adoucies, visage dessiné sur la face avant).
// Nouveaux designs, identité fixe d'un plan à l'autre. Unité interne : 1 « bloc » = 0,36 m (hauteur totale 5,2 blocs ≈ 1,87 m).
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { ctex, hash } from "./tex";

export type Expr = "smile" | "happy" | "neutral" | "sad" | "worried" | "angry" | "scared" | "shout" | "smug" | "focus" | "gummy";
export type Spec = {
  name: string; skin: string; top: string; topDark: string; sleeve: string; pants: string; shoes: string;
  style: "hoodie" | "suit" | "plaid" | "tee" | "cardigan" | "dress" | "jacket" | "uniform" | "shirt"; radio?: boolean;
  inner?: string; hair: "messy" | "joel" | "short" | "long" | "bun" | "bald" | "cap" | "slick" | "curly"; hairCol: string; capCol?: string;
  beard?: string; mustache?: string; chain?: string; glasses?: boolean; backpack?: string; kid?: boolean; star?: string;
  helmet?: string; stripes?: string; headset?: boolean; scarf?: string; stubble?: string; grumpy?: boolean; belly?: number;
};

export const CAST0: Record<string, Spec> = {
  hero: { name: "hero", skin: "#f1c7a0", top: "#f2b51c", topDark: "#c98f10", sleeve: "#f2b51c", pants: "#2c3140", shoes: "#e9e9e9", style: "jacket", inner: "#2c3140", hair: "messy", hairCol: "#2a1d16", kid: true },
  dad: { name: "dad", skin: "#f1c7a0", top: "#2d4f8c", topDark: "#1f3866", sleeve: "#2d4f8c", pants: "#4a505c", shoes: "#1a1a1a", style: "uniform", hair: "cap", hairCol: "#1d1712", capCol: "#23407a", mustache: "#2a1d16", radio: true },
  guard: { name: "guard", skin: "#e0ac80", top: "#2a3f6a", topDark: "#1c2c4e", sleeve: "#2a3f6a", pants: "#3b404c", shoes: "#151515", style: "uniform", hair: "cap", hairCol: "#2a1d16", capCol: "#1f3460", radio: true },
  guard2: { name: "guard2", skin: "#8a5a3c", top: "#2a3f6a", topDark: "#1c2c4e", sleeve: "#2a3f6a", pants: "#3b404c", shoes: "#151515", style: "uniform", hair: "cap", hairCol: "#111", capCol: "#1f3460", radio: true },
  pink: { name: "pink", skin: "#f5d0b0", top: "#ff3fa4", topDark: "#d02a82", sleeve: "#ff3fa4", pants: "#33405e", shoes: "#f4f4f4", style: "hoodie", hair: "long", hairCol: "#3a2416" },
  c1: { name: "c1", skin: "#e0ac80", top: "#f08a2a", topDark: "#c46a18", sleeve: "#f08a2a", pants: "#4a4a52", shoes: "#2a2a2a", style: "jacket", inner: "#f4f1ea", hair: "curly", hairCol: "#3a2a1e" },
  c2: { name: "c2", skin: "#7a4a2e", top: "#2fae7a", topDark: "#1f8a5c", sleeve: "#2fae7a", pants: "#2a3a6a", shoes: "#f4f4f4", style: "hoodie", backpack: "#2a2f3a", hair: "short", hairCol: "#111111" },
  c3: { name: "c3", skin: "#c98a5c", top: "#9aa4b2", topDark: "#788292", sleeve: "#9aa4b2", pants: "#3a3f4a", shoes: "#2a2a2a", style: "jacket", inner: "#c4283a", hair: "bald", hairCol: "#3a2a1e", beard: "#3a2a1e" },
  c4: { name: "c4", skin: "#f5d6bc", top: "#5b6fd8", topDark: "#3f50b0", sleeve: "#5b6fd8", pants: "#262a33", shoes: "#c4283a", style: "jacket", inner: "#f4f1ea", hair: "bun", hairCol: "#c08a3a" },
};

/** distribution des Dessins (ville joyeuse, couleurs vives) */
export const CAST: Record<string, Spec> = {
  hero: { name: "hero", skin: "#f7d6bd", top: "#f2b51c", topDark: "#c98f10", sleeve: "#f2b51c", pants: "#34508a", shoes: "#e9e9e9", style: "hoodie", hair: "messy", hairCol: "#6b4426", kid: true },
  ami: { name: "ami", skin: "#f5d0b0", top: "#2fae7a", topDark: "#1f8a5c", sleeve: "#2fae7a", pants: "#2a3a6a", shoes: "#f4f4f4", style: "hoodie", hair: "curly", hairCol: "#d8a650", kid: true, backpack: "#c4283a" },
  jaden: { name: "jaden", skin: "#f6d3b8", top: "#d8342c", topDark: "#a82620", sleeve: "#d8342c", pants: "#262a33", shoes: "#f4f4f4", style: "jacket", inner: "#f4f1ea", hair: "cap", hairCol: "#2a1d16", capCol: "#2a5cb8", kid: true },
  k1: { name: "k1", skin: "#f7d6bd", top: "#5b6fd8", topDark: "#3f50b0", sleeve: "#5b6fd8", pants: "#262a33", shoes: "#f4f4f4", style: "hoodie", hair: "short", hairCol: "#1d1712", kid: true, backpack: "#2fae7a" },
  k2: { name: "k2", skin: "#f5d0b0", top: "#f08a2a", topDark: "#c46a18", sleeve: "#f08a2a", pants: "#33405e", shoes: "#2a2a2a", style: "jacket", inner: "#f4f1ea", hair: "long", hairCol: "#3a2416", kid: true },
  k3: { name: "k3", skin: "#f2cbaa", top: "#e8c840", topDark: "#c4a420", sleeve: "#e8c840", pants: "#3a3f4a", shoes: "#c4283a", style: "tee", star: "#d8342c", hair: "bun", hairCol: "#c08a3a", kid: true },
  k4: { name: "k4", skin: "#f6d3b8", top: "#9a5ad8", topDark: "#7a40b0", sleeve: "#9a5ad8", pants: "#2a2e36", shoes: "#f4f4f4", style: "hoodie", hair: "messy", hairCol: "#2a1d16", kid: true },
  k5: { name: "k5", skin: "#f7d6bd", top: "#2ab4d8", topDark: "#1a8aac", sleeve: "#2ab4d8", pants: "#3a3f4a", shoes: "#2a2a2a", style: "tee", star: "#f4f4f4", hair: "curly", hairCol: "#5a3a22", kid: true },
  k6: { name: "k6", skin: "#f5d2b6", top: "#ff5fa4", topDark: "#d03a82", sleeve: "#ff5fa4", pants: "#33405e", shoes: "#f4f4f4", style: "hoodie", hair: "long", hairCol: "#c8a060", kid: true },
  k7: { name: "k7", skin: "#f6d3b8", top: "#e84a3a", topDark: "#b83a2a", sleeve: "#e84a3a", pants: "#2a3a6a", shoes: "#f4f4f4", style: "tee", star: "#ffffff", hair: "short", hairCol: "#c8a060", kid: true },
  k8: { name: "k8", skin: "#f5d0b0", top: "#40c8a0", topDark: "#2a9a78", sleeve: "#40c8a0", pants: "#33405e", shoes: "#2a2a2a", style: "cardigan", inner: "#f4f1ea", hair: "bun", hairCol: "#2a1d16", kid: true },
  prof: { name: "prof", skin: "#f6d3b8", top: "#2a8a8a", topDark: "#1c6666", sleeve: "#2a8a8a", pants: "#3a3f4a", shoes: "#5a2a24", style: "cardigan", inner: "#f4ecdc", hair: "bun", hairCol: "#8a5a32", glasses: true },
  girl: { name: "girl", skin: "#f8dcc6", top: "#ff8ec2", topDark: "#e46aa4", sleeve: "#ff8ec2", pants: "#ff8ec2", shoes: "#f4f4f4", style: "dress", hair: "long", hairCol: "#b8562a", kid: true },
  dir: { name: "dir", skin: "#f0c8a8", top: "#4a4f5c", topDark: "#363a44", sleeve: "#4a4f5c", pants: "#363a44", shoes: "#1a1a1a", style: "suit", hair: "bald", hairCol: "#8a8680", mustache: "#6a6660", glasses: true },
  boy: { name: "boy", skin: "#f7d6bd", top: "#3d6fb8", topDark: "#2c5490", sleeve: "#3d6fb8", pants: "#2c3140", shoes: "#e9e9e9", style: "tee", star: "#f2c230", hair: "short", hairCol: "#d8b060", kid: true },
  t1: { name: "t1", skin: "#f4cfb0", top: "#c4283a", topDark: "#9a1e2c", sleeve: "#c4283a", pants: "#2c3140", shoes: "#2a1d16", style: "jacket", inner: "#f4f1ea", hair: "short", hairCol: "#3b2a1e" },
  t2: { name: "t2", skin: "#f6d3b8", top: "#e8c840", topDark: "#c4a420", sleeve: "#e8c840", pants: "#33405e", shoes: "#f4f4f4", style: "cardigan", inner: "#f4f1ea", hair: "long", hairCol: "#2a1d16" },
  t3: { name: "t3", skin: "#f2cbaa", top: "#2a5cb8", topDark: "#1c4490", sleeve: "#2a5cb8", pants: "#3a3f4a", shoes: "#111111", style: "plaid", hair: "curly", hairCol: "#6b4426", beard: "#6b4426" },
  // « Le Nom qui rapporte »
  bart: { name: "bart", skin: "#f6d0b0", top: "#2fae7a", topDark: "#1f8a5c", sleeve: "#2fae7a", pants: "#2a3a6a", shoes: "#ffffff", style: "hoodie", hair: "curly", hairCol: "#c8582a", kid: true },
  maman: { name: "maman", skin: "#e8b890", top: "#ff8a3a", topDark: "#d86a1a", sleeve: "#ff8a3a", pants: "#33405e", shoes: "#f4f4f4", style: "cardigan", inner: "#fff4e0", hair: "long", hairCol: "#2a1d16" },
  pardon: { name: "pardon", skin: "#e8b890", top: "#ff6ab0", topDark: "#e04a90", sleeve: "#ff6ab0", pants: "#ff6ab0", shoes: "#ffffff", style: "dress", hair: "bun", hairCol: "#2a1d16", kid: true },
  chauffeur: { name: "chauffeur", skin: "#c98a5c", top: "#2ac8c0", topDark: "#1a9a94", sleeve: "#2ac8c0", pants: "#2a3a4a", shoes: "#111111", style: "uniform", hair: "cap", hairCol: "#111111", capCol: "#16202c", mustache: "#111111" },
  lamonnaie: { name: "lamonnaie", skin: "#f4cfb0", top: "#6a2a98", topDark: "#4a1a70", sleeve: "#6a2a98", pants: "#2a1a3a", shoes: "#111111", style: "suit", hair: "slick", hairCol: "#2a1d16", mustache: "#2a1d16", chain: "#f2c230", glasses: true },
  maire2: { name: "maire2", skin: "#e0ac80", top: "#2a5cb8", topDark: "#1c4490", sleeve: "#2a5cb8", pants: "#2a3a4a", shoes: "#111111", style: "suit", hair: "bald", hairCol: "#8a8680", beard: "#8a8680" },
  employe: { name: "employe", skin: "#f2cbaa", top: "#f4f0e8", topDark: "#d8d4cc", sleeve: "#f4f0e8", pants: "#3a3f4a", shoes: "#2a1d16", style: "cardigan", inner: "#9ae0c8", hair: "bun", hairCol: "#8a5a32", glasses: true },
  // « Les Mots Gentils » : grand-mère géante, voisin minuscule, maire, boulanger, factrice
  mamie: { name: "mamie", skin: "#f6d3b8", top: "#ff7aa8", topDark: "#d85a88", sleeve: "#ff7aa8", pants: "#7a5ad8", shoes: "#f4f4f4", style: "cardigan", inner: "#fff4e0", hair: "bun", hairCol: "#e8e4e0", glasses: true },
  voisin: { name: "voisin", skin: "#f0c8a8", top: "#8a6a3a", topDark: "#6a4e2a", sleeve: "#8a6a3a", pants: "#3a3f4a", shoes: "#2a1d16", style: "plaid", hair: "bald", hairCol: "#9a9690", mustache: "#9a9690" },
  maire: { name: "maire", skin: "#f4cfb0", top: "#1f2f5a", topDark: "#16223f", sleeve: "#1f2f5a", pants: "#1f2f5a", shoes: "#111111", style: "suit", hair: "slick", hairCol: "#c8c4bc", mustache: "#c8c4bc", chain: "#f2c230" },
  boulanger: { name: "boulanger", skin: "#f2cbaa", top: "#f8f6f0", topDark: "#d8d4cc", sleeve: "#f8f6f0", pants: "#4a5a7a", shoes: "#2a2a2a", style: "tee", hair: "short", hairCol: "#2a1d16", mustache: "#2a1d16" },
  factrice: { name: "factrice", skin: "#e8b890", top: "#2a5cb8", topDark: "#1c4490", sleeve: "#2a5cb8", pants: "#2a3a6a", shoes: "#111111", style: "uniform", hair: "cap", hairCol: "#3a2416", capCol: "#f2c230" },
  // « Tu as tort » : Joël (d'après l'avatar fourni : chemise blanche, barbe de trois jours, sourcils froncés), sa mère,
  // Madame Contraire (championne), présentateur météo, facteur
  joel: { name: "joel", skin: "#ecc19c", top: "#f6f6f4", topDark: "#d4d4d2", sleeve: "#f6f6f4", pants: "#17171b", shoes: "#111114", style: "shirt", hair: "joel", hairCol: "#1e140e", stubble: "#3a2a1e", grumpy: true },
  hutt: { name: "hutt", skin: "#ecc19c", top: "#f6f6f4", topDark: "#d4d4d2", sleeve: "#f6f6f4", pants: "#17171b", shoes: "#111114", style: "shirt", hair: "joel", hairCol: "#1e140e", stubble: "#3a2a1e", grumpy: true, belly: 0.75 },
  mere: { name: "mere", skin: "#f2c8a4", top: "#2ab4a0", topDark: "#1a8a7a", sleeve: "#2ab4a0", pants: "#3a3f5a", shoes: "#f4f4f4", style: "cardigan", inner: "#fff4e0", hair: "bun", hairCol: "#9a948c" },
  contraire: { name: "contraire", skin: "#f4d0b4", top: "#6a2a98", topDark: "#4a1a70", sleeve: "#6a2a98", pants: "#2a1a3a", shoes: "#c4283a", style: "cardigan", inner: "#f4ecdc", hair: "bun", hairCol: "#ecebe8", glasses: true, scarf: "#c4283a" },
  meteo: { name: "meteo", skin: "#f2cbaa", top: "#2a5cb8", topDark: "#1c4490", sleeve: "#2a5cb8", pants: "#1c2440", shoes: "#111111", style: "suit", hair: "slick", hairCol: "#c89a50" },
  facteur: { name: "facteur", skin: "#c98a5c", top: "#2a5cb8", topDark: "#1c4490", sleeve: "#2a5cb8", pants: "#2a3a6a", shoes: "#111111", style: "uniform", hair: "cap", hairCol: "#1d1712", capCol: "#f2c230", mustache: "#1d1712" },
};

const mats = new Map<string, THREE.MeshPhysicalMaterial>();
const fabric = () => ctex("fabric", 128, 128, (g) => { g.fillStyle = "#f2f2f2"; g.fillRect(0, 0, 128, 128);
  for (let y = 0; y < 128; y += 2) { g.fillStyle = `rgba(0,0,0,${0.03 + hash(y, 1) * 0.04})`; g.fillRect(0, y, 128, 1); }
  for (let x = 0; x < 128; x += 2) { g.fillStyle = `rgba(255,255,255,${0.03 + hash(x, 2) * 0.05})`; g.fillRect(x, 0, 1, 128); }
  for (let i = 0; i < 300; i++) { g.fillStyle = `rgba(0,0,0,${hash(i, 3) * 0.06})`; g.fillRect(hash(i, 4) * 128, hash(i, 5) * 128, 3, 3); } }, true);
const refl = (c: string) => mat(c, { map: null, bumpMap: null, sheen: 0, roughness: 0.25, metalness: 0.3, emissive: c, emissiveIntensity: 0.35 }, "refl");
const mat = (col: string, extra: THREE.MeshPhysicalMaterialParameters = {}, key = "") => {
  const k = col + key; let m = mats.get(k);
  if (!m) { const fb = extra.metalness ? undefined : fabric(); m = new THREE.MeshPhysicalMaterial({ color: col, roughness: 0.6, metalness: 0, map: fb, bumpMap: fb, bumpScale: 2.5, sheen: 0.7, sheenRoughness: 0.45, sheenColor: new THREE.Color(col).lerp(new THREE.Color("#ffffff"), 0.5), ...extra }); mats.set(k, m); }
  return m;
};
const geos = new Map<string, THREE.BufferGeometry>();
const rbox = (w: number, h: number, d: number, r = 0.12) => { const k = `${w}_${h}_${d}_${r}`; let g = geos.get(k); if (!g) { g = new RoundedBoxGeometry(w, h, d, 2, r); geos.set(k, g); } return g; };
const mesh = (g: THREE.BufferGeometry, m: THREE.Material, x = 0, y = 0, z = 0) => { const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.castShadow = true; o.receiveShadow = true; return o; };

const hatchTex = () => ctex("hatch", 128, 128, (g) => { g.fillStyle = "#f6f4ee"; g.fillRect(0, 0, 128, 128); g.strokeStyle = "rgba(40,40,48,0.35)"; g.lineWidth = 1.5;
  for (let i = -128; i < 256; i += 9) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i + 128, 128); g.stroke(); } }, true);
/** visage (fond transparent) : yeux, sourcils, bouche, barbe, lunettes */
export const faceTex = (s: Spec, e: Expr) => ctex(`face_${s.name}_${e}`, 256, 256, (g) => {
  g.clearRect(0, 0, 256, 256);
  const ink = "#1b1410", ey = 108, lx = 82, rx = 174;
  if (s.beard) { g.fillStyle = s.beard; g.beginPath(); g.moveTo(20, 140); g.lineTo(236, 140); g.lineTo(236, 256); g.lineTo(20, 256); g.fill(); g.fillStyle = "rgba(0,0,0,0)"; }
  if (s.stubble) { for (let i = 0; i < 5200; i++) { const x = 6 + hash(i, 11) * 244, y = 120 + hash(i, 12) * 118, dx = Math.abs(x - 128) / 122;
      const top = 158 - 30 * dx * dx; if (y < top) continue; let k = Math.min(1, (y - top) / 22);
      if (Math.abs(x - 128) < 48 && y > 150 && y < 172) k *= 0.45; if (Math.abs(x - 128) < 30 && y > 170 && y < 186) k *= 0.25;
      if (hash(i, 13) > k * 0.5) continue; g.fillStyle = `rgba(48,32,20,${0.4 + hash(i, 14) * 0.45})`; g.beginPath(); g.arc(x, y, 0.9 + hash(i, 15) * 1.4, 0, 7); g.fill(); } }
  g.lineCap = "round"; g.strokeStyle = ink; g.fillStyle = ink;
  const dot = (x: number, r = s.grumpy ? 17 : 13) => { g.beginPath(); g.ellipse(x, ey, r * (s.grumpy ? 0.62 : 0.8), r, 0, 0, 7); g.fill(); if (s.grumpy) return; g.fillStyle = "#fff"; g.beginPath(); g.arc(x + 3, ey - 5, 3.5, 0, 7); g.fill(); g.fillStyle = ink; };
  const arcEye = (x: number) => { g.lineWidth = 9; g.beginPath(); g.arc(x, ey + 8, 16, Math.PI * 1.15, Math.PI * 1.85); g.stroke(); };
  const brow = (x: number, tilt: number, y = ey - 36) => { g.lineWidth = s.grumpy ? 12 : 9; g.beginPath(); g.moveTo(x - 18, y + tilt); g.lineTo(x + 18, y - tilt); g.stroke(); };
  const mouthY = s.beard ? 178 : 176;
  if (e === "happy") { arcEye(lx); arcEye(rx); }
  else if (e === "scared") { for (const x of [lx, rx]) { g.fillStyle = "#fff"; g.beginPath(); g.arc(x, ey, 20, 0, 7); g.fill(); g.lineWidth = 4; g.stroke(); g.fillStyle = ink; g.beginPath(); g.arc(x, ey + 2, 9, 0, 7); g.fill(); } }
  else if (e === "focus") { g.lineWidth = 10; g.beginPath(); g.moveTo(lx - 14, ey); g.lineTo(lx + 14, ey); g.moveTo(rx - 14, ey); g.lineTo(rx + 14, ey); g.stroke(); }
  else { dot(lx); dot(rx); }
  if (e === "sad" || e === "worried" || e === "scared") { brow(lx, 7); brow(rx, -7); }
  if (e === "angry" || e === "focus") { brow(lx, -8, ey - 30); brow(rx, 8, ey - 30); }
  if (e === "smug") { brow(lx, 0); brow(rx, -6); }
  if (s.grumpy && !["sad", "worried", "scared", "angry", "focus", "smug", "happy"].includes(e)) { brow(lx, -6, ey - 34); brow(rx, 6, ey - 34); }
  g.lineWidth = 8;
  const open = (w: number, h: number) => { g.fillStyle = "#5a1a1a"; g.beginPath(); g.ellipse(128, mouthY, w, h, 0, 0, Math.PI); g.fill(); g.fillStyle = "#e2707a"; g.beginPath(); g.ellipse(128, mouthY + h * 0.6, w * 0.6, h * 0.35, 0, 0, 7); g.fill(); g.fillStyle = "#fff"; g.fillRect(128 - w * 0.8, mouthY, w * 1.6, 7); g.fillStyle = ink; };
  if (e === "smile" || e === "smug") { g.beginPath(); g.arc(128, mouthY - 24, 30, Math.PI * 0.2, Math.PI * 0.8); g.stroke(); }
  else if (e === "happy") open(34, 30);
  else if (e === "neutral" || e === "focus") { if (s.grumpy) { g.lineWidth = 5; g.lineCap = "butt"; } g.beginPath(); g.moveTo(s.grumpy ? 104 : 108, mouthY); g.lineTo(s.grumpy ? 152 : 148, mouthY); g.stroke(); g.lineCap = "round"; }
  else if (e === "sad" || e === "angry") { g.beginPath(); g.arc(128, mouthY + 24, 24, Math.PI * 1.22, Math.PI * 1.78); g.stroke(); }
  else if (e === "worried") { g.beginPath(); g.moveTo(104, mouthY + 4); g.quadraticCurveTo(116, mouthY - 6, 128, mouthY + 2); g.quadraticCurveTo(140, mouthY + 8, 152, mouthY - 2); g.stroke(); }
  else if (e === "scared") { g.fillStyle = "#5a1a1a"; g.beginPath(); g.ellipse(128, mouthY + 6, 14, 20, 0, 0, 7); g.fill(); }
  else if (e === "shout") open(40, 44);
  else if (e === "gummy") { g.fillStyle = "#5a1a1a"; g.beginPath(); g.ellipse(128, mouthY - 4, 40, 34, 0, 0, Math.PI); g.fill(); g.fillStyle = "#f08a9a"; g.beginPath(); g.ellipse(128, mouthY - 2, 40, 9, 0, 0, Math.PI); g.fill(); g.fillStyle = "#e2707a"; g.beginPath(); g.ellipse(128, mouthY + 20, 22, 9, 0, 0, 7); g.fill(); g.fillStyle = ink; }
  if (s.mustache) { g.fillStyle = s.mustache; g.beginPath(); g.ellipse(108, mouthY - 16, 22, 9, -0.2, 0, 7); g.ellipse(148, mouthY - 16, 22, 9, 0.2, 0, 7); g.fill(); }
  if (s.glasses && s.name === "contraire") { g.strokeStyle = "#8a1a2a"; g.lineWidth = 7; g.beginPath(); g.roundRect(48, ey - 24, 68, 46, 12); g.roundRect(140, ey - 24, 68, 46, 12); g.moveTo(116, ey - 6); g.lineTo(140, ey - 6); g.stroke(); g.strokeStyle = ink; }
  else if (s.glasses) { g.fillStyle = "#121212"; g.beginPath(); g.roundRect(46, ey - 22, 70, 42, 10); g.roundRect(140, ey - 22, 70, 42, 10); g.fill(); g.fillRect(110, ey - 14, 36, 8);
    g.fillStyle = "rgba(255,255,255,0.35)"; g.fillRect(58, ey - 14, 16, 8); g.fillRect(152, ey - 14, 16, 8); }
  if (e === "smile" || e === "happy" || e === "gummy") { g.fillStyle = "rgba(240,110,110,0.28)"; g.beginPath(); g.arc(56, 150, 16, 0, 7); g.arc(200, 150, 16, 0, 7); g.fill(); }
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
  if (s.style === "shirt") { g.fillStyle = s.skin; g.beginPath(); g.moveTo(96, 0); g.lineTo(160, 0); g.lineTo(128, 70); g.fill();
    g.strokeStyle = "#8e8e94"; g.lineWidth = 3; g.beginPath(); g.moveTo(128, 70); g.lineTo(128, 256); g.stroke();
    g.fillStyle = "#f2f2f2"; g.strokeStyle = "#9a9aa0"; g.lineWidth = 3; g.lineJoin = "round";
    for (const sx of [-1, 1]) { g.beginPath(); g.moveTo(128 + sx * 32, 0); g.lineTo(128 + sx * 84, 0); g.lineTo(128 + sx * 70, 42); g.lineTo(128 + sx * 4, 66); g.closePath(); g.fill(); g.stroke(); }
    g.fillStyle = "#dcdce0"; g.strokeStyle = "#a0a0a6"; g.lineWidth = 2; for (const y of [104, 150, 196, 242]) { g.beginPath(); g.arc(136, y, 6, 0, 7); g.fill(); g.stroke(); }
    g.strokeStyle = "rgba(150,150,160,0.5)"; g.lineWidth = 5; g.lineCap = "round"; for (const [x0, y0, x1, y1] of [[14, 150, 66, 128], [22, 196, 92, 176], [242, 150, 190, 128], [234, 200, 168, 178], [70, 238, 112, 228], [186, 236, 150, 226]]) { g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo((x0 + x1) / 2, Math.min(y0, y1) - 6, x1, y1); g.stroke(); } }
  if (s.style === "dress") { g.fillStyle = s.topDark; g.fillRect(0, 150, 256, 10); g.fillStyle = "rgba(255,255,255,0.15)"; g.beginPath(); g.moveTo(80, 0); g.quadraticCurveTo(128, 70, 176, 0); g.fill(); }
});

export type Pose = {
  walk?: number; wave?: "L" | "R" | "both"; cheer?: boolean; armsUp?: number; point?: number; bang?: boolean; pull?: number;
  yaw?: number; headYaw?: number; headPitch?: number; expr?: Expr; talk?: boolean; sit?: boolean; swim?: boolean; look?: number;
  reach?: number; hold?: number; knock?: boolean; cover?: number; lean?: number; carry?: boolean; armL?: number; armR?: number;
};
export class Actor {
  root = new THREE.Group(); body = new THREE.Group(); s: Spec;
  lArm = new THREE.Group(); rArm = new THREE.Group(); lLeg = new THREE.Group(); rLeg = new THREE.Group(); neck = new THREE.Group(); torso: THREE.Mesh;
  face: THREE.Mesh; seed: number; belly?: THREE.Mesh; radio?: THREE.Group; led?: THREE.Mesh; torch?: THREE.Group;
  constructor(s: Spec, scale = 0.36, seed = 0) {
    this.s = s; this.seed = seed;
    const k = s.kid ? 0.72 : 1, legH = s.kid ? 1.3 : 2;
    this.root.add(this.body); this.body.scale.setScalar(scale * (s.kid ? 0.95 : 1));
    const skin = mat(s.skin, { map: null, bumpMap: null, sheen: 0, roughness: 0.38, clearcoat: 0.45, clearcoatRoughness: 0.3 }, "skin"), top = mat(s.top), pants = mat(s.style === "dress" ? s.top : s.pants), shoes = mat(s.shoes);
    // jambes (pivot à la hanche)
    for (const [leg, x] of [[this.lLeg, -0.5], [this.rLeg, 0.5]] as const) {
      leg.position.set(x, legH, 0); this.body.add(leg);
      if (s.style === "dress") { leg.add(mesh(rbox(0.9, legH * 0.55, 0.9, 0.1), skin, 0, -legH * 0.72, 0)); }
      else leg.add(mesh(rbox(0.98, legH * 0.85, 0.98, 0.1), pants, 0, -legH * 0.43, 0));
      leg.add(mesh(rbox(1.02, legH * 0.18, 1.12, 0.08), shoes, 0, -legH + legH * 0.09 + 0.05, 0.04));
      leg.add(mesh(rbox(1.08, 0.1, 1.2, 0.04), mat("#1a1a1a", { roughness: 0.9 }, "sole"), 0, -legH + 0.05, 0.05));
      if (s.stripes) for (const y of [-legH * 0.62, -legH * 0.74]) leg.add(mesh(rbox(1.03, 0.1, 1.03, 0.03), refl(s.stripes), 0, y, 0));
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
    if (s.belly) { this.belly = mesh(new THREE.SphereGeometry(1.15, 24, 18), top, 0, legH + tH * 0.42, 0.25); this.belly.scale.set(1.05 * s.belly, 0.95 * s.belly, 0.75 * s.belly); this.body.add(this.belly); }
    // cordons + poche ventrale (sweat), fermeture éclair (veste), coutures d'épaule, pouces
    if (s.style === "hoodie") { for (const x of [-0.25, 0.25]) { this.body.add(mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.7, 6), mat("#f4f4f4", { map: null, bumpMap: null }, "cord"), x, legH + tH - 0.45, 0.53)); this.body.add(mesh(new THREE.SphereGeometry(0.06, 8, 6), metal, x, legH + tH - 0.82, 0.54)); }
      this.body.add(mesh(rbox(1.3, 0.55, 0.08, 0.04), dark, 0, legH + 0.55, 0.52)); }
    if (s.style === "jacket") { this.body.add(mesh(rbox(0.06, tH - 0.1, 0.06, 0.02), metal, 0.02, legH + tH / 2, 0.53)); for (const x of [-0.6, 0.6]) this.body.add(mesh(rbox(0.55, 0.06, 0.08, 0.02), dark, x, legH + 0.6, 0.53)); }
    for (const [arm, sx] of [[this.lArm, 1], [this.rArm, -1]] as const) arm.add(mesh(rbox(0.32, 0.42, 0.36, 0.1), skin, sx * 0.4, -tH * 0.86 + 0.3, 0.42));
    if (s.radio) { const r = new THREE.Group(); r.position.set(0.62, legH + tH - 0.55, 0.56); this.body.add(r); this.radio = r;
      r.add(mesh(rbox(0.36, 0.56, 0.2, 0.05), mat("#1b1d22", { roughness: 0.5 }, "radio"), 0, 0, 0)); r.add(mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.5, 6), mat("#111", { roughness: 0.4 }, "ant"), 0.1, 0.5, 0));
      const led = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), new THREE.MeshStandardMaterial({ color: "#ff5a1e", emissive: "#ff5a1e", emissiveIntensity: 3 })); led.position.set(-0.1, 0.2, 0.11); r.add(led); this.led = led; }
    if (s.chain) { const ch = new THREE.Group(); const cm = mat(s.chain, { metalness: 0.8, roughness: 0.25, emissive: s.chain, emissiveIntensity: 0.12 }, "chain");
      for (let i = 0; i <= 12; i++) { const a = Math.PI * (0.1 + 0.8 * i / 12); ch.add(mesh(new THREE.SphereGeometry(0.09, 8, 6), cm, Math.cos(a) * 0.62, -Math.sin(a) * 0.75, 0)); }
      ch.add(mesh(new THREE.SphereGeometry(0.2, 12, 10), cm, 0, -0.92, 0.02)); ch.position.set(0, legH + tH - 0.05, 0.53); this.body.add(ch); }
    if (s.stripes) for (const y of [legH + 0.55, legH + 0.75]) this.body.add(mesh(rbox(2.07, 0.13, 1.07, 0.03), refl(s.stripes), 0, y, 0));
    if (s.scarf) { const sc = mat(s.scarf); this.body.add(mesh(rbox(1.5, 0.36, 1.2, 0.14), sc, 0, legH + tH + 0.02, 0)); this.body.add(mesh(rbox(0.36, 1.0, 0.14, 0.06), sc, 0.4, legH + tH - 0.55, 0.56)); }
    if (s.backpack) { this.body.add(mesh(rbox(1.6, 1.6, 0.6, 0.15), mat(s.backpack), 0, legH + tH * 0.5, -0.78)); }
    // bras (pivot à l'épaule)
    for (const [arm, x] of [[this.lArm, -1.5], [this.rArm, 1.5]] as const) {
      arm.position.set(x, legH + tH - 0.3, 0); this.body.add(arm);
      arm.add(mesh(rbox(0.98, tH * 0.72, 0.98, 0.1), mat(s.style === "dress" ? s.skin : s.sleeve), 0, -tH * 0.36 + 0.3, 0));
      arm.add(mesh(rbox(0.94, tH * 0.3, 0.94, 0.12), skin, 0, -tH * 0.85 + 0.3, 0));
      if (s.style === "shirt") { arm.add(mesh(rbox(1.02, 0.2, 1.02, 0.06), mat(s.top), 0, -tH * 0.72 + 0.3 + 0.1, 0)); arm.add(mesh(rbox(1.03, 0.025, 1.03, 0.01), mat("#a8a8ae", { map: null, bumpMap: null }, "cuffl"), 0, -tH * 0.72 + 0.3 + 0.04, 0)); }
      if (s.stripes) arm.add(mesh(rbox(1.0, 0.12, 1.0, 0.03), refl(s.stripes), 0, -tH * 0.55 + 0.3, 0));
    }
    // tête
    this.neck.position.set(0, legH + tH, 0); this.body.add(this.neck);
    const head = mesh(rbox(1.3, 1.25, 1.25, 0.22), skin, 0, 0.66, 0); this.neck.add(head);
    this.face = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.2), new THREE.MeshPhysicalMaterial({ map: faceTex(s, "smile"), transparent: true, roughness: 0.35, clearcoat: 0.6, clearcoatRoughness: 0.2, polygonOffset: true, polygonOffsetFactor: -2 }));
    this.face.position.set(0, 0.64, 0.63); this.neck.add(this.face);
    this.hair(s);
  }
  private hair(s: Spec) {
    const hm = mat(s.hairCol), h = this.neck;
    const b = (w: number, hh: number, d: number, x: number, y: number, z: number, r = 0.1, rx = 0, rz = 0, m = hm) => { const o = mesh(rbox(w, hh, d, r), m, x, y, z); o.rotation.set(rx, 0, rz); h.add(o); return o; };
    if (s.hair === "messy") { b(1.42, 0.45, 1.38, 0, 1.33, -0.02); b(1.42, 0.8, 0.3, 0, 0.95, -0.6); for (let i = 0; i < 5; i++) b(0.42, 0.34, 0.5, -0.5 + i * 0.25, 1.52 + hash(i, 3) * 0.08, 0.35 - hash(i, 4) * 0.3, 0.08, 0.3, (hash(i, 5) - 0.5) * 0.8); b(1.4, 0.24, 0.3, 0, 1.18, 0.6, 0.08); }
    if (s.hair === "joel") { const ht = mat("#ffffff", { map: ctex("hairJ", 256, 256, (q) => { q.fillStyle = s.hairCol; q.fillRect(0, 0, 256, 256); for (let i = 0; i < 900; i++) { q.strokeStyle = `rgba(${hash(i, 1) > 0.6 ? "90,60,40" : "0,0,0"},${0.2 + hash(i, 2) * 0.25})`; q.lineWidth = 1.5 + hash(i, 3) * 2; const x = hash(i, 4) * 256, y = hash(i, 5) * 256; q.beginPath(); q.moveTo(x, y); q.quadraticCurveTo(x + 6, y + 8, x + 2, y + 16 + hash(i, 6) * 10); q.stroke(); } }, true), bumpMap: null, sheen: 0.4, roughness: 0.75 }, "hairJ");
      b(1.37, 0.36, 1.33, 0, 1.33, -0.02, 0.17, 0, 0, ht);
      for (const sx of [-1, 1]) { b(0.1, 0.55, 1.1, sx * 0.66, 1.06, -0.1, 0.05, 0, 0, ht); b(0.08, 0.28, 0.3, sx * 0.665, 0.78, 0.18, 0.04, 0, 0, ht); }
      b(1.36, 0.7, 0.14, 0, 1.0, -0.6, 0.07, 0, 0, ht); }
    if (s.hair === "short") { b(1.4, 0.32, 1.36, 0, 1.36, -0.01); b(1.4, 0.6, 0.25, 0, 1.0, -0.6); b(0.12, 0.5, 1.2, -0.68, 1.05, -0.05); b(0.12, 0.5, 1.2, 0.68, 1.05, -0.05); }
    if (s.hair === "slick") { b(1.42, 0.4, 1.38, 0, 1.36, -0.03, 0.15); b(1.42, 0.7, 0.28, 0, 1.0, -0.6); b(1.0, 0.3, 0.5, 0.18, 1.55, 0.28, 0.12, 0.2); }
    if (s.hair === "long") { b(1.44, 0.4, 1.4, 0, 1.36, -0.02); b(1.5, 2.0, 0.42, 0, 0.45, -0.55); b(0.3, 1.7, 1.0, -0.7, 0.55, -0.12); b(0.3, 1.7, 1.0, 0.7, 0.55, -0.12); b(0.9, 0.3, 0.3, 0.25, 1.2, 0.6, 0.08, 0, -0.3); }
    if (s.hair === "bun") { b(1.42, 0.36, 1.38, 0, 1.36, -0.02); b(1.42, 0.7, 0.28, 0, 1.0, -0.6); const bun = mesh(new THREE.SphereGeometry(0.42, 14, 10), hm, 0, 1.6, -0.45); h.add(bun); }
    if (s.hair === "bald") { b(0.18, 0.5, 1.0, -0.7, 0.85, -0.12); b(0.18, 0.5, 1.0, 0.7, 0.85, -0.12); b(1.3, 0.5, 0.2, 0, 0.85, -0.62); }
    if (s.hair === "curly") { for (let i = 0; i < 14; i++) { const a = (i / 14) * Math.PI * 2; const o = mesh(new THREE.SphereGeometry(0.36, 10, 8), hm, Math.cos(a) * 0.5, 1.35 + hash(i, 2) * 0.15, Math.sin(a) * 0.45 - 0.1); h.add(o); } b(1.3, 0.6, 1.2, 0, 1.3, -0.08, 0.3); }
    if (s.helmet) { const hm2 = mat(s.helmet, { map: null, bumpMap: null, sheen: 0, roughness: 0.22, metalness: 0.55, clearcoat: 1, clearcoatRoughness: 0.08 }, "helm");
      const dome = mesh(new THREE.SphereGeometry(0.86, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2), hm2, 0, 1.22, -0.02); dome.scale.set(0.97, 0.78, 1.02); h.add(dome);
      const brim = mesh(new THREE.CylinderGeometry(1.0, 1.08, 0.07, 32), hm2, 0, 1.2, -0.18); brim.scale.set(1, 1, 1.18); h.add(brim);
      b(0.2, 0.2, 1.75, 0, 1.86, -0.05, 0.08, 0, 0, hm2);
      b(0.34, 0.36, 0.06, 0, 1.52, 0.83, 0.05, -0.25, 0, mat("#e0b84a", { map: null, bumpMap: null, metalness: 0.9, roughness: 0.25 }, "badge"));
      b(1.4, 0.5, 0.25, 0, 0.98, -0.6); return; }
    if (s.hair === "cap") { b(1.42, 0.4, 1.38, 0, 1.33, 0, 0.12, 0, 0, mat(s.capCol!)); b(1.3, 0.1, 0.7, 0, 1.18, 0.9, 0.04, 0, 0, mat(s.capCol!)); b(1.42, 0.4, 0.25, 0, 0.98, -0.6); }
  }
  /** casque-micro (opérateur de la caserne) */
  addHeadset() { const m = mat("#16181c", { map: null, bumpMap: null, roughness: 0.4 }, "hs");
    const band = mesh(new THREE.TorusGeometry(0.74, 0.06, 8, 24, Math.PI), m, 0, 0.75, 0); band.rotation.z = 0; this.neck.add(band);
    for (const x of [-0.72, 0.72]) this.neck.add(mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.16, 18).rotateZ(Math.PI / 2), m, x, 0.62, 0));
    const boom = mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.8, 6).rotateX(Math.PI / 2), m, 0.6, 0.38, 0.38); boom.rotation.y = -0.5; this.neck.add(boom);
    this.neck.add(mesh(new THREE.SphereGeometry(0.08, 10, 8), m, 0.42, 0.36, 0.72)); }
  pencil?: THREE.Group;
  /** crayon à papier dans la main droite */
  addPencil() {
    const g = new THREE.Group(), k = this.s.kid ? 0.72 : 1, tH = 2 * k + (this.s.kid ? 0.3 : 0);
    g.position.set(0, -tH * 0.95 + 0.3, 0.45); g.rotation.x = Math.PI / 2 + 0.35; this.rArm.add(g); this.pencil = g;
    g.add(mesh(new THREE.CylinderGeometry(0.12, 0.12, 1.5, 6).rotateX(Math.PI / 2), mat("#f2c230", { map: null, bumpMap: null, sheen: 0, roughness: 0.4 }, "pen"), 0, 0, 0.3));
    g.add(mesh(new THREE.CylinderGeometry(0.125, 0.125, 0.16, 12).rotateX(Math.PI / 2), mat("#c9ccd4", { metalness: 0.9, roughness: 0.3 }, "ferrule"), 0, 0, -0.5));
    g.add(mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.2, 12).rotateX(Math.PI / 2), mat("#f08a9a", { map: null, bumpMap: null, sheen: 0 }, "rub"), 0, 0, -0.66));
    g.add(mesh(new THREE.ConeGeometry(0.12, 0.34, 6).rotateX(Math.PI / 2), mat("#e8cfa0", { map: null, bumpMap: null, sheen: 0 }, "wood"), 0, 0, 1.22));
    g.add(mesh(new THREE.ConeGeometry(0.04, 0.12, 6).rotateX(Math.PI / 2), mat("#2a2a2e", { map: null, bumpMap: null, sheen: 0, roughness: 0.4 }, "lead"), 0, 0, 1.36));
    return g; }
  /** bras en traits de crayon (k : 0 → 1, de la main vers l'épaule) ; gone : la main gauche disparaît */
  private sk?: { meshes: THREE.Mesh[]; orig: THREE.Material[]; lines: THREE.LineSegments[]; y: number[] };
  setSketch(k: number, goneL = 0) {
    if (!this.sk) { const meshes: THREE.Mesh[] = [], orig: THREE.Material[] = [], lines: THREE.LineSegments[] = [], y: number[] = [];
      const lm = new THREE.LineBasicMaterial({ color: "#2a2a30" });
      for (const arm of [this.lArm, this.rArm]) arm.traverse((o) => { const m = o as THREE.Mesh; if (!m.isMesh || o.parent !== arm) return; meshes.push(m); orig.push(m.material as THREE.Material);
        const l = new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry, 20), lm); l.visible = false; m.add(l); lines.push(l); y.push(m.position.y); });
      this.sk = { meshes, orig, lines, y }; }
    const paper = mat("#f6f4ee", { map: hatchTex(), bumpMap: null, sheen: 0, roughness: 0.9 }, "paper");
    const ys = this.sk.y, lo = Math.min(...ys), hi = Math.max(...ys);
    this.sk.meshes.forEach((m, i) => { const f = 1 - (ys[i] - lo) / Math.max(1e-3, hi - lo), on = k > 0 && k * 1.2 >= f * 0.9; m.material = on ? paper : this.sk!.orig[i]; this.sk!.lines[i].visible = on; });
    const hand = this.lArm.children.filter((o) => (o as THREE.Mesh).isMesh).sort((a, b) => a.position.y - b.position.y)[0];
    if (hand) { hand.visible = goneL < 0.5; hand.scale.setScalar(1 - Math.min(1, goneL) * 0.3); }
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
    if (p.yaw !== undefined) this.root.rotation.y = p.yaw;
    let la = 0.05 * Math.sin(ph * 0.3), ra = -0.05 * Math.sin(ph * 0.3 + 1), lz = -0.06, rz = 0.06, ll = 0, rl = 0, by = 0;
    if (p.walk) { const w = Math.sin(t * p.walk * 6 + this.seed); la = w * 0.6; ra = -w * 0.6; ll = -w * 0.55; rl = w * 0.55; by = Math.abs(Math.cos(t * p.walk * 6 + this.seed)) * 0.12; }
    if (p.wave) { const w = Math.sin(t * 9 + this.seed) * 0.35; if (p.wave !== "L") { ra = -2.6; rz = 0.4 + w; } if (p.wave !== "R") { la = -2.6; lz = -0.4 - w; } }
    if (p.cheer) { const w = Math.abs(Math.sin(t * 5 + this.seed)); la = -2.7 - w * 0.3; ra = -2.7 - w * 0.3; lz = -0.35; rz = 0.35; by = w * 0.35; }
    if (p.armsUp) { la = ra = -p.armsUp * 2.9; lz = -0.15; rz = 0.15; }
    if (p.point !== undefined) { ra = -1.5 - p.point * 0.4; rz = 0.1; }
    if (p.bang) { const w = Math.max(0, Math.sin(t * 7 + this.seed)); ra = -1.9 + w * 0.6; la = -1.6 + Math.max(0, Math.sin(t * 7 + this.seed + 2)) * 0.6; by = 0; }
    if (p.pull !== undefined) { ra = la = -2.4 + p.pull * 2.0; rz = 0.12; lz = -0.12; by = -p.pull * 0.4; }
    if (p.sit) { ll = rl = -1.45; by = -1.05; }
    if (p.reach !== undefined) { la = ra = -1.45 * p.reach; lz = -0.05; rz = 0.05; }
    if (p.hold !== undefined) { la = ra = -1.2 - 0.9 * p.hold; lz = -0.28; rz = 0.28; }
    if (p.carry) { la = ra = -1.25; lz = -0.3; rz = 0.3; }
    if (p.knock) { const k = Math.max(0, Math.sin(t * 11 + this.seed)); ra = -1.55 - 0.35 * k; rz = 0.15; }
    if (p.cover !== undefined) { la = ra = -2.45 * p.cover; lz = -0.42 * p.cover; rz = 0.42 * p.cover; }
    if (p.armL !== undefined) la = p.armL; if (p.armR !== undefined) ra = p.armR;
    if (p.swim) { const w = Math.sin(t * 4 + this.seed); la = -2.2 + w * 0.6; ra = -2.2 - w * 0.6; lz = -0.3; rz = 0.3; }
    this.lArm.rotation.set(la, 0, lz); this.rArm.rotation.set(ra, 0, rz); this.lLeg.rotation.x = ll; this.rLeg.rotation.x = rl;
    this.body.position.y = by * this.body.scale.y; this.body.rotation.x = p.lean ?? 0;
    this.neck.rotation.set(p.headPitch ?? 0.03 * Math.sin(ph * 0.25), (p.headYaw ?? 0) + 0.08 * Math.sin(ph * 0.17 + 2), 0.03 * Math.sin(ph * 0.21));
    const e = p.talk && Math.sin(t * 14) > 0.2 ? "shout" : p.expr;
    if (e) { const m = this.face.material as THREE.MeshStandardMaterial, tx = faceTex(this.s, e); if (m.map !== tx) { m.map = tx; m.needsUpdate = true; } }
    return this;
  }
}
