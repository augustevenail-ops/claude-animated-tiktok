// « Le Puits » : dunes rouges à l'infini, palmeraie et canaux turquoise, ville de terre en anneaux (maisons en instances, auvents colorés),
// 8 rues rayonnantes, grande place pavée, le puits (margelle sur deux marches, portique, poulie, seau, puits profond et noir),
// tour du cor, fresque de « Celui d'en bas », marché, foule, Anciens, toi et ton petit frère. update(sid, f, cam, scene) pose une image.
import * as THREE from "three";
import { Batch, lam } from "../bridge/build";
import { ctex } from "../bridge/paint";
import { TONE, CHAR, untone } from "../bridge/shade";
import { NOINK } from "../bridge/ink";
import { Pool, Actor } from "../bridge/cast";
import type { Pen } from "../bridge/toon";
import { drawPerson, Person, Expr, Pose } from "./people";
import { painted } from "../shared/painted";
import { STELE, FPS, V3, PLAZA, CITY_R, GROVE_R, DUNE_R, STEP_H, MARG_R, MARG_H, SHAFT_R, SHAFT_D, TOP_Y, TOWER, TOWER_H, FRESCO, ELDERS, CHIEF, BAG,
  QUEUE_Z0, YOU, BRO_STREET, RIM, LIGHT, camAt, uOf, ROLE, hash, smooth, tW, cutAt, duneH } from "./story";
import { LIGHTS } from "./look";

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const solid = (key: string, color: string, extra: THREE.MeshLambertMaterialParameters = {}) => { const m = lam("pu_" + key, () => ({ color, ...extra })); m.name = "pu_" + key; return m; };
const STREETS = 8, STREET_W = 3.2;
const streetDist = (x: number, z: number) => {                       // distance à la rue rayonnante la plus proche
  const a = Math.atan2(x, z), r = Math.hypot(x, z), k = Math.round(a / (Math.PI * 2 / STREETS)) * (Math.PI * 2 / STREETS);
  return Math.abs(r * Math.sin(a - k));
};

// ---------------- textures peintes ----------------
const mudTex = () => ctex("pu_mud", 256, 256, (g) => {               // façade de terre : enduit clair (teinté par instance), taches, fissures, porte et fenêtres
  g.fillStyle = "#f4e6d2"; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 60; i++) { g.fillStyle = `rgba(${hash(i) < 0.5 ? "120,70,40" : "255,250,240"},${0.05 + hash(i, 1) * 0.08})`; g.beginPath(); g.ellipse(hash(i, 2) * 256, hash(i, 3) * 256, 8 + hash(i, 4) * 30, 5 + hash(i, 5) * 18, 0, 0, 7); g.fill(); }
  g.strokeStyle = "rgba(90,50,30,0.35)"; g.lineWidth = 1.4;
  for (let i = 0; i < 4; i++) { let x = hash(i, 81) * 256, y = hash(i, 82) * 120; g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 6; k++) { x += (hash(i * 7 + k, 83) - 0.5) * 16; y += 5 + hash(i * 7 + k, 84) * 9; g.lineTo(x, y); } g.stroke(); }
  const win = (x: number, y: number, w: number, h: number) => { g.fillStyle = "#3a2216"; g.beginPath(); g.moveTo(x, y + h); g.lineTo(x, y + w / 2); g.arc(x + w / 2, y + w / 2, w / 2, Math.PI, 0); g.lineTo(x + w, y + h); g.closePath(); g.fill();
    g.strokeStyle = "rgba(60,30,15,0.8)"; g.lineWidth = 3; g.stroke(); g.fillStyle = "#7a4a26"; g.fillRect(x - 4, y + h, w + 8, 5); };
  win(36, 70, 34, 46); win(186, 70, 34, 46);
  g.fillStyle = "#4a2c1a"; g.beginPath(); g.moveTo(104, 256); g.lineTo(104, 172); g.arc(128, 172, 24, Math.PI, 0); g.lineTo(152, 256); g.closePath(); g.fill();
  g.fillStyle = "#6a3e22"; g.fillRect(108, 176, 40, 80); g.strokeStyle = "rgba(30,15,8,0.7)"; g.lineWidth = 2; for (let k = 0; k < 4; k++) { g.beginPath(); g.moveTo(112 + k * 10, 180); g.lineTo(112 + k * 10, 256); g.stroke(); }
  const b = g.createLinearGradient(0, 210, 0, 256); b.addColorStop(0, "rgba(120,60,30,0)"); b.addColorStop(1, "rgba(120,60,30,0.35)"); g.fillStyle = b; g.fillRect(0, 210, 256, 46);   // pied de mur
});
const roofTex = () => ctex("pu_roof", 128, 128, (g) => {
  g.fillStyle = "#efe0c8"; g.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 30; i++) { g.fillStyle = `rgba(110,70,40,${0.05 + hash(i, 31) * 0.1})`; g.beginPath(); g.arc(hash(i, 32) * 128, hash(i, 33) * 128, 4 + hash(i, 34) * 14, 0, 7); g.fill(); }
  g.strokeStyle = "rgba(120,70,40,0.5)"; g.lineWidth = 6; g.strokeRect(3, 3, 122, 122);                    // parapet
});
const sandTex = () => ctex("pu_sand", 512, 512, (g) => {             // sable rouge-orangé, rides du vent
  g.fillStyle = "#9c7656"; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 140; i++) { g.fillStyle = `rgba(${hash(i, 41) < 0.5 ? "170,70,40" : "255,190,130"},${0.06 + hash(i, 42) * 0.08})`; g.beginPath(); g.ellipse(hash(i, 43) * 512, hash(i, 44) * 512, 20 + hash(i, 45) * 60, 8 + hash(i, 46) * 20, 0.2, 0, 7); g.fill(); }
  for (let k = 0; k < 46; k++) { const y0 = k * 11.2 + hash(k, 47) * 4; g.strokeStyle = k % 2 ? "rgba(150,60,30,0.28)" : "rgba(255,200,150,0.3)"; g.lineWidth = 2;
    g.beginPath(); for (let x = 0; x <= 512; x += 16) { const y = y0 + 4 * Math.sin(x * 0.03 + k) + 2 * Math.sin(x * 0.09 + k * 2); x ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); }
});
const earthTex = () => ctex("pu_earth", 256, 256, (g) => {
  g.fillStyle = "#86694e"; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 90; i++) { g.fillStyle = `rgba(${hash(i, 11) < 0.5 ? "120,70,40" : "250,220,180"},${0.05 + hash(i, 12) * 0.08})`; g.beginPath(); g.arc(hash(i, 13) * 256, hash(i, 14) * 256, 3 + hash(i, 15) * 14, 0, 7); g.fill(); }
});
const paveTex = () => ctex("pu_pave", 256, 256, (g) => {             // dalles de grès de la place
  g.fillStyle = "#6a5644"; g.fillRect(0, 0, 256, 256);
  for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) { const x = c * 64 + (r % 2) * 32, y = r * 64, h = hash(r * 4 + c, 51);
    g.fillStyle = `rgb(${150 + h * 16},${130 + h * 14},${108 + h * 12})`; g.fillRect(x + 3, y + 3, 58, 58); g.fillRect(x - 256 + 3, y + 3, 58, 58);
    g.fillStyle = "rgba(120,70,40,0.12)"; g.beginPath(); g.ellipse(x + 20 + h * 20, y + 30, 14, 9, 0, 0, 7); g.fill(); }
});
const stoneTex = () => ctex("pu_stone", 256, 256, (g) => {           // pierres de la margelle et du puits
  g.fillStyle = "#4e4034"; g.fillRect(0, 0, 256, 256);
  for (let r = 0; r < 6; r++) for (let c = 0; c < 4; c++) { const x = c * 64 + (r % 2) * 32, y = r * 43, h = hash(r * 4 + c, 61);
    g.fillStyle = `rgb(${156 + h * 18},${138 + h * 16},${114 + h * 14})`; g.beginPath(); g.roundRect(x + 3, y + 3, 58, 37, 8); g.fill(); g.beginPath(); g.roundRect(x - 256 + 3, y + 3, 58, 37, 8); g.fill(); }
});
const grassTex = () => ctex("pu_grass", 256, 256, (g) => {
  g.fillStyle = "#3e4a2e"; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 400; i++) { g.strokeStyle = `rgba(${hash(i, 21) < 0.5 ? "30,70,20" : "170,200,80"},${0.25 + hash(i, 22) * 0.3})`; g.lineWidth = 2; const x = hash(i, 23) * 256, y = hash(i, 24) * 256; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (hash(i, 25) - 0.5) * 6, y - 6 - hash(i, 26) * 8); g.stroke(); }
});
/** fresque naïve sur un mur de terre : Celui d'en bas, immense, blanc, sans yeux, bras jusqu'au sol, au-dessus du puits ; enfants minuscules ; vagues bleues */
const frescoTex = () => ctex("pu_fresco", 1024, 600, (g) => {
  g.fillStyle = "#d7a873"; g.fillRect(0, 0, 1024, 600);
  for (let i = 0; i < 80; i++) { g.fillStyle = `rgba(${hash(i, 71) < 0.5 ? "120,70,40" : "255,240,220"},${0.05 + hash(i, 72) * 0.08})`; g.beginPath(); g.ellipse(hash(i, 73) * 1024, hash(i, 74) * 600, 20 + hash(i, 75) * 60, 10 + hash(i, 76) * 30, 0, 0, 7); g.fill(); }
  g.fillStyle = "#c8452e"; g.fillRect(0, 0, 1024, 26); g.fillRect(0, 574, 1024, 26);                    // frises
  g.fillStyle = "#1f5aa8"; for (let x = 0; x < 1024; x += 40) { g.beginPath(); g.moveTo(x, 26); g.lineTo(x + 20, 46); g.lineTo(x + 40, 26); g.fill(); }
  for (let k = 0; k < 3; k++) { g.strokeStyle = ["#1f6fb8", "#2aa0c0", "#1f5aa8"][k]; g.lineWidth = 9; g.beginPath();                // l'eau, en bas
    for (let x = 0; x <= 1024; x += 8) { const y = 520 + k * 16 + 8 * Math.sin(x * 0.03 + k * 2); x ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); }
  g.fillStyle = "#6a4a3a"; g.beginPath(); g.ellipse(512, 470, 90, 26, 0, 0, 7); g.fill(); g.fillStyle = "#1a0e0a"; g.beginPath(); g.ellipse(512, 466, 64, 16, 0, 0, 7); g.fill();   // le puits
  // Celui d'en bas : torse qui sort du puits, bras immenses, tête-œuf sans yeux, bouche fente
  g.save(); g.lineJoin = "round"; g.lineCap = "round"; g.strokeStyle = "#2a1a14"; g.lineWidth = 7; g.fillStyle = "#f4f2ea";
  g.beginPath(); g.moveTo(452, 466); g.bezierCurveTo(440, 360, 470, 250, 512, 236); g.bezierCurveTo(554, 250, 584, 360, 572, 466); g.closePath(); g.fill(); g.stroke();
  for (const s of [-1, 1]) { g.beginPath(); g.moveTo(512 + s * 40, 270); g.bezierCurveTo(512 + s * 160, 230, 512 + s * 300, 300, 512 + s * 330, 470);
    g.lineTo(512 + s * 300, 470); g.bezierCurveTo(512 + s * 280, 330, 512 + s * 170, 280, 512 + s * 50, 310); g.closePath(); g.fill(); g.stroke();
    for (let q = 0; q < 7; q++) { g.beginPath(); g.moveTo(512 + s * (300 + q * 5), 468); g.lineTo(512 + s * (286 + q * 9), 520 + (q % 2) * 10); g.stroke(); } }   // sept doigts
  g.beginPath(); g.ellipse(512, 186, 46, 62, 0, 0, 7); g.fill(); g.stroke();
  g.strokeStyle = "#2a1a14"; g.lineWidth = 5; g.beginPath(); g.moveTo(488, 214); g.lineTo(500, 220); g.lineTo(512, 212); g.lineTo(524, 220); g.lineTo(536, 214); g.stroke();
  g.globalAlpha = 0.35; g.fillStyle = "#ffffff"; g.beginPath(); g.arc(512, 186, 120, 0, 7); g.fill(); g.globalAlpha = 1;   // auréole
  g.restore();
  // enfants minuscules qui tendent des offrandes, soleil
  for (let i = 0; i < 9; i++) { const x = 140 + i * 90 + (i > 3 ? 120 : 0), y = 500; if (x > 900) continue;
    g.fillStyle = ["#c8452e", "#1f5aa8", "#e0a020", "#2a8a5a"][i % 4]; g.fillRect(x - 9, y - 30, 18, 30); g.fillStyle = "#f4f2ea"; g.beginPath(); g.arc(x, y - 40, 10, 0, 7); g.fill();
    g.strokeStyle = "#2a1a14"; g.lineWidth = 3; g.stroke(); }
  g.fillStyle = "#f0b030"; g.beginPath(); g.arc(150, 120, 46, 0, 7); g.fill(); g.strokeStyle = "#c8452e"; g.lineWidth = 6; for (let k = 0; k < 12; k++) { const a = k * Math.PI / 6; g.beginPath(); g.moveTo(150 + 56 * Math.cos(a), 120 + 56 * Math.sin(a)); g.lineTo(150 + 76 * Math.cos(a), 120 + 76 * Math.sin(a)); g.stroke(); }
  // usure : écailles et fissures
  for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(200,150,100,${0.4 + hash(i, 77) * 0.4})`; g.beginPath(); g.ellipse(hash(i, 78) * 1024, hash(i, 79) * 600, 6 + hash(i, 80) * 18, 4 + hash(i, 81) * 10, hash(i, 82) * 3, 0, 7); g.fill(); }
  g.strokeStyle = "rgba(60,30,20,0.55)"; g.lineWidth = 2; for (let i = 0; i < 6; i++) { let x = hash(i, 83) * 1024, y = 0; g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 10; k++) { x += (hash(i * 9 + k, 84) - 0.5) * 40; y += 30 + hash(i * 9 + k, 85) * 30; g.lineTo(x, y); } g.stroke(); }
});
/** stèle de la règle (texte diégétique, comme les plaques « RÈGLE 1 » de VIDEO_01) */
const steleTex = () => ctex("pu_stele", 512, 640, (g) => {
  g.fillStyle = "#3a322a"; g.fillRect(0, 0, 512, 640);
  for (let i = 0; i < 50; i++) { g.fillStyle = `rgba(${hash(i, 91) < 0.5 ? "20,16,12" : "120,105,90"},${0.08 + hash(i, 92) * 0.1})`; g.beginPath(); g.ellipse(hash(i, 93) * 512, hash(i, 94) * 640, 10 + hash(i, 95) * 40, 6 + hash(i, 96) * 20, 0, 0, 7); g.fill(); }
  g.strokeStyle = "rgba(20,16,12,0.8)"; g.lineWidth = 10; g.strokeRect(22, 22, 468, 596);
  g.textAlign = "center"; g.font = "bold 92px DejaVu Sans Condensed, DejaVu Sans, sans-serif"; g.shadowColor = "rgba(230,60,40,0.9)"; g.shadowBlur = 24; g.fillStyle = "#e0503a"; g.fillText("RÈGLE", 256, 170);
  g.font = "bold 44px DejaVu Sans Condensed, DejaVu Sans, sans-serif"; g.shadowBlur = 14; g.fillStyle = "#e8b8a0";
  ["PERSONNE NE", "REGARDE AU FOND", "DU PUITS."].forEach((l, k) => g.fillText(l, 256, 290 + k * 62));
  g.shadowBlur = 0; g.font = "bold 30px DejaVu Sans Condensed, DejaVu Sans, sans-serif"; g.fillStyle = "rgba(200,180,150,0.6)"; g.fillText("CELUI QUI REGARDE DESCEND", 256, 520);
});
const skyTex = (k: number) => ctex("pu_sky" + k, 64, 512, (g) => {
  const L = LIGHTS[k], v = g.createLinearGradient(0, 0, 0, 512); v.addColorStop(0, L.skyTop); v.addColorStop(0.36, L.skyMid); v.addColorStop(0.5, L.skyLow); v.addColorStop(0.56, L.skyMid); v.addColorStop(1, L.skyTop);
  g.fillStyle = v; g.fillRect(0, 0, 64, 512);
});
const glowTex = (rgb: string) => ctex("pu_glow" + rgb, 128, 128, (g) => {
  const r = g.createRadialGradient(64, 64, 0, 64, 64, 64); r.addColorStop(0, `rgba(${rgb},0.95)`); r.addColorStop(0.35, `rgba(${rgb},0.35)`); r.addColorStop(1, `rgba(${rgb},0)`); g.fillStyle = r; g.fillRect(0, 0, 128, 128);
});

// ---------------- cartes spéciales (gros plans) ----------------
const INK = "#221e1d";
/** main de ton petit frère : « dip » = elle plonge dans le sac ; « open » = paume ouverte, la pierre noire */
const drawHand = (p: Pen, open: boolean) => {
  const g = p.g; g.save(); g.lineCap = "round"; g.lineJoin = "round";
  g.beginPath(); g.moveTo(80, 1000); g.lineTo(260, open ? 560 : 520); g.strokeStyle = INK; g.lineWidth = 150 + 22; g.stroke(); g.strokeStyle = "#b8a27a"; g.lineWidth = 150; g.stroke();   // manche : tunique sable du frère
  g.beginPath(); g.ellipse(300, open ? 470 : 430, 150, 130, -0.4, 0, 7); g.fillStyle = "#3a2a22"; g.fill(); g.lineWidth = 11; g.strokeStyle = INK; g.stroke();
  if (open) { for (let k = 0; k < 4; k++) { const a = -1.5 + k * 0.42; g.beginPath(); g.moveTo(300 + 110 * Math.cos(a), 470 + 100 * Math.sin(a)); g.lineTo(300 + 190 * Math.cos(a), 470 + 175 * Math.sin(a));
      g.strokeStyle = INK; g.lineWidth = 64 + 22; g.stroke(); g.strokeStyle = "#f2f2f4"; g.lineWidth = 64; g.stroke(); }
    const sg = g.createRadialGradient(285, 450, 6, 300, 470, 80); sg.addColorStop(0, "#4a4a58"); sg.addColorStop(0.5, "#15151c"); sg.addColorStop(1, "#050508");
    g.beginPath(); g.ellipse(300, 470, 78, 62, 0.3, 0, 7); g.fillStyle = sg; g.fill(); g.lineWidth = 9; g.strokeStyle = INK; g.stroke();
    g.fillStyle = "rgba(255,255,255,0.7)"; g.beginPath(); g.ellipse(276, 446, 16, 9, -0.5, 0, 7); g.fill(); }
  g.restore();
};
/** main d'un Ancien qui tranche la corde au couteau */
const drawKnife = (p: Pen) => {
  const g = p.g; g.save(); g.lineCap = "round"; g.lineJoin = "round";
  g.beginPath(); g.moveTo(600, 1000); g.lineTo(380, 640); g.strokeStyle = INK; g.lineWidth = 170 + 22; g.stroke(); g.strokeStyle = "#efe9dc"; g.lineWidth = 170; g.stroke();   // manche blanche
  g.beginPath(); g.moveTo(330, 560); g.lineTo(60, 470); g.lineTo(70, 430); g.lineTo(330, 500); g.closePath(); const bg = g.createLinearGradient(0, 430, 0, 560); bg.addColorStop(0, "#f4f6fa"); bg.addColorStop(1, "#8a92a0"); g.fillStyle = bg; g.fill(); g.lineWidth = 9; g.strokeStyle = INK; g.stroke();
  g.beginPath(); g.roundRect(310, 480, 110, 90, 20); g.fillStyle = "#5a3a22"; g.fill(); g.stroke();
  g.beginPath(); g.ellipse(390, 560, 120, 105, 0.5, 0, 7); g.fillStyle = "#f2f2f4"; g.fill(); g.lineWidth = 11; g.stroke();
  g.restore();
};
/** longue main pâle aux sept doigts qui monte dans le noir du puits (lumineuse, sans contour dur) */
const drawDeepHand = (p: Pen) => {
  const g = p.g; g.save(); g.lineCap = "round";
  g.shadowColor = "rgba(200,255,240,0.8)"; g.shadowBlur = 40;
  g.strokeStyle = "#dff6f0"; g.lineWidth = 70; g.beginPath(); g.moveTo(300, 1000); g.bezierCurveTo(290, 800, 310, 700, 300, 560); g.stroke();
  g.fillStyle = "#e8fbf6"; g.beginPath(); g.ellipse(300, 520, 70, 60, 0, 0, 7); g.fill();
  g.lineWidth = 16; for (let k = 0; k < 7; k++) { const a = -Math.PI / 2 + (k - 3) * 0.24; g.beginPath(); g.moveTo(300 + 50 * Math.cos(a), 520 + 50 * Math.sin(a));
    g.quadraticCurveTo(300 + 200 * Math.cos(a) + (k - 3) * 6, 520 + 200 * Math.sin(a), 300 + 330 * Math.cos(a), 520 + 360 * Math.sin(a)); g.stroke(); }
  g.restore();
};

// ---------------- personnages ----------------
const LOOK: Record<string, Partial<Person>> = {
  // toi et ton frère : style VIDEO_01 (drawRef) — tenue unie + un accessoire de couleur + badge de ration numéroté
  Y: { jacket: "#4e6a6e", pants: "#3a3430", shoes: "#2a201a", hair: "bald", hairColor: "#2a201a", sash: "#6a5a44", turban: "#a8382c", badge: "9-112" },   // toi : tunique bleu-gris, turban rouge (pan sur le côté)
  BRO: { jacket: "#b8a27a", pants: "#4a3a30", shoes: "#2a201a", hair: "bald", hairColor: "#2a1c16", sash: "#5a4a3a", band: "#4a3a5a", badge: "9-113" },   // ton petit frère : tunique sable, bandeau noué
  EL: { jacket: "#cfc4ae", pants: "#cfc4ae", shoes: "#4a3a2a", hair: "bald", hairColor: "#bdb6aa", robe: true, beard: "#bfb6a6", prop: "staff" },   // les Anciens
  CH: { jacket: "#d8cfbc", pants: "#d8cfbc", shoes: "#4a3a2a", hair: "bald", hairColor: "#c8c2b8", robe: true, beard: "#c6bdae", sash: "#8a2e26", prop: "bag" },
  H: { jacket: "#6a2e28", pants: "#3a2a24", shoes: "#2a201a", hair: "bald", hairColor: "#2a2220", robe: true, scarf: "#b8ab92", prop: "horn" },
  K: { jacket: "#3e6a6a", pants: "#3a3430", shoes: "#2a201a", hair: "spiky", hairColor: "#1a1412" },
  M: { jacket: "#5a4a3e", pants: "#5a4a3e", shoes: "#2a201a", hair: "bun", hairColor: "#1a1412", robe: true, scarf: "#8a2e26" },
};
const CROWD: Partial<Person>[] = ([
  { jacket: "#5a4436", pants: "#5a4436", hair: "bun", hairColor: "#1a1412", robe: true, scarf: "#7a2e26" },
  { jacket: "#6e3a2e", pants: "#3a2e28", hair: "spiky", hairColor: "#24180f", sash: "#8a6a2a" },
  { jacket: "#3e5656", pants: "#3e5656", hair: "bald", hairColor: "#2a2220", robe: true, scarf: "#b8ab92" },
  { jacket: "#8a6a44", pants: "#3e3430", hair: "fringe", hairColor: "#2a1c16" },
  { jacket: "#4a3a3a", pants: "#4a3a3a", hair: "ponytail", hairColor: "#1a1412", robe: true, scarf: "#3e5f60" },
  { jacket: "#5a5e42", pants: "#3a3a2a", hair: "bob", hairColor: "#3a2416", sash: "#7a2e26" },
  { jacket: "#a89c84", pants: "#a89c84", hair: "bald", hairColor: "#2a2220", robe: true, scarf: "#5a4436" },
  { jacket: "#2e3238", pants: "#2e3238", hair: "bun", hairColor: "#24180f", robe: true, scarf: "#8a6a2a" },
  { jacket: "#a0562e", pants: "#3a3430", hair: "spiky", hairColor: "#1a1412" },
  { jacket: "#4e3a46", pants: "#4e3a46", hair: "bob", hairColor: "#1a1412", robe: true, scarf: "#a89c84" },
] as Partial<Person>[]).map((c) => ({ shoes: "#2a201a", ...c }));
const KIDS: Partial<Person>[] = ([
  { jacket: "#8a3a2e", pants: "#3a3430", hair: "bob", hairColor: "#2a1c16" }, { jacket: "#3e5f60", pants: "#4a3a30", hair: "spiky", hairColor: "#1a1412" },
  { jacket: "#a08040", pants: "#3a3430", hair: "ponytail", hairColor: "#3a2416" }, { jacket: "#4a4a42", pants: "#3a3a2a", hair: "fringe", hairColor: "#1a1412" },
  { jacket: "#6a4a5a", pants: "#3a3430", hair: "bun", hairColor: "#24180f" }, { jacket: "#5a5e42", pants: "#4a3a30", hair: "bob", hairColor: "#1a1412" },
] as Partial<Person>[]).map((c) => ({ shoes: "#2a201a", ...c }));
const KID_S = 0.7;
type Fo = { pose?: Pose; expr: Expr; blink?: boolean; look?: number; back?: boolean; step?: number; prop?: Person["prop"] | null; sil?: boolean };
const tierOf = (d: number): [number, number, number] => (d < 3.5 ? [1080, 1800, 1.8] : d < 14 ? [600, 1000, 1] : [300, 500, 0.5]);
/** foule en anneau autour du puits (pas dans la file des enfants, ni devant toi) */
const crowdRing = (n: number, r0: number, r1: number, seed: number) => {
  const out: { p: V3; c: number; kid: boolean }[] = [];
  for (let i = 0; out.length < n && i < n * 12; i++) {
    const a = hash(i, seed) * Math.PI * 2, r = r0 + hash(i, seed + 1) * (r1 - r0), x = r * Math.sin(a), z = r * Math.cos(a);
    if (Math.abs(x) < 1.3 && z > 3) continue;                                         // file des enfants
    if (Math.hypot(x - YOU[0], z - YOU[2]) < 1.1) continue;
    if (out.some((o) => Math.hypot(o.p[0] - x, o.p[2] - z) < 0.62)) continue;
    out.push({ p: [x, 0, z], c: Math.floor(hash(i, seed + 2) * CROWD.length), kid: hash(i, seed + 3) < 0.18 });
  }
  return out;
};
const RING_A = crowdRing(96, 4.6, 11, 401), RING_PLAZA = crowdRing(34, 9, 21, 433);
const STALLS: [number, number, string][] = [[-3.8, 30, "#3a3aa8"], [3.8, 33, "#c8452e"], [-3.8, 37, "#f0a020"], [3.8, 40, "#1f9a96"], [-3.8, 44, "#a83a7a"], [3.8, 47, "#e0602a"], [-3.8, 51, "#2a8a5a"], [3.8, 54, "#3a3aa8"]];

export class World {
  root = new THREE.Group();
  sun: THREE.DirectionalLight; private hemi: THREE.HemisphereLight; private fog = new THREE.Fog("#000", 10, 100);
  private pool = new Pool(); private actors: Actor[] = []; private glows: Actor[] = []; private glowMats: THREE.MeshBasicMaterial[] = [];
  private sky: THREE.Mesh; private skyMaps: THREE.Texture[]; private sunDisc: THREE.Mesh; private parts: Record<string, THREE.Points> = {};
  private bucket: THREE.Group; private rope: THREE.Mesh; private bag: THREE.Group; private top: THREE.Group; private lamps: THREE.Mesh[] = []; private lantern: THREE.Mesh;
  private awnings: THREE.Mesh[] = []; private deepGlow: THREE.Mesh; private pools: THREE.Mesh[] = []; private bulbs: THREE.Mesh[] = []; private cones: THREE.Mesh[] = [];
  private silMats: THREE.MeshBasicMaterial[] = []; private silOn: boolean[] = [];
  constructor() {
    const R = this.root;
    this.hemi = new THREE.HemisphereLight("#9cc4ff", "#a8603a", 0.3); R.add(this.hemi);
    this.sun = new THREE.DirectionalLight("#ffc27a", 1.9); this.sun.castShadow = true; R.add(this.sun, this.sun.target);
    const b = new Batch(), mm = new THREE.Matrix4(), q = new THREE.Quaternion(), yUp = V(0, 1, 0);
    // ---------- sol : dunes (plan déformé), terre de la ville, palmeraie, canaux, place ----------
    const st = sandTex(); st.repeat.set(220, 220);
    const dg = new THREE.PlaneGeometry(9000, 9000, 360, 360).rotateX(-Math.PI / 2), dp = dg.getAttribute("position") as THREE.BufferAttribute;
    for (let i = 0; i < dp.count; i++) dp.setY(i, duneH(dp.getX(i), dp.getZ(i)) - 0.05);
    dg.computeVertexNormals();
    { const ix = dg.getIndex()!, keep: number[] = [];                                  // pas de sol de dunes sous l'oasis (le trou du puits reste ouvert)
      for (let i = 0; i < ix.count; i += 3) { const a = ix.getX(i), cx = dp.getX(a), cz = dp.getZ(a); if (Math.hypot(cx, cz) > 60) keep.push(a, ix.getX(i + 1), ix.getX(i + 2)); }
      dg.setIndex(keep); }
    const dunes = new THREE.Mesh(dg, solid("sand", "#ffffff", { map: st })); dunes.receiveShadow = true; R.add(dunes);
    const et = earthTex(); et.repeat.set(90, 90);
    const city = new THREE.Mesh(new THREE.RingGeometry(SHAFT_R - 0.02, CITY_R + 14, 96, 2).rotateX(-Math.PI / 2), solid("earth", "#ffffff", { map: et })); city.position.y = 0.02; city.receiveShadow = true; R.add(city);
    const gt = grassTex(); gt.repeat.set(60, 60);
    const grove = new THREE.Mesh(new THREE.RingGeometry(CITY_R + 10, GROVE_R + 6, 128, 1).rotateX(-Math.PI / 2), solid("grass", "#ffffff", { map: gt })); grove.position.y = 0.03; grove.receiveShadow = true; R.add(grove);
    const waterM = new THREE.MeshBasicMaterial({ color: "#2c5a56" });
    for (const r of [CITY_R + 24, CITY_R + 58, GROVE_R - 6]) { const w = new THREE.Mesh(new THREE.RingGeometry(r, r + 2.6, 160, 1).rotateX(-Math.PI / 2), waterM); w.position.y = 0.06; R.add(w); }
    for (let k = 0; k < STREETS; k++) { const a = k * Math.PI * 2 / STREETS + Math.PI / STREETS, w = new THREE.Mesh(new THREE.PlaneGeometry(2.2, GROVE_R - CITY_R).rotateX(-Math.PI / 2), waterM);
      w.position.set(Math.sin(a) * (CITY_R + GROVE_R) / 2, 0.06, Math.cos(a) * (CITY_R + GROVE_R) / 2); w.rotation.y = a; R.add(w); }
    const pt = paveTex(); pt.repeat.set(14, 14);
    const plaza = new THREE.Mesh(new THREE.RingGeometry(SHAFT_R - 0.02, PLAZA, 96, 2).rotateX(-Math.PI / 2), solid("pave", "#ffffff", { map: pt })); plaza.position.y = 0.04; plaza.receiveShadow = true; R.add(plaza);
    // ---------- le puits : marches, margelle, puits, portique, poulie ----------
    const stt = stoneTex(); stt.repeat.set(16, 3); const stoneM = solid("stone", "#ffffff", { map: stt });
    { const sp = [[SHAFT_R - 0.01, STEP_H], [2.6, STEP_H], [2.68, STEP_H - 0.2], [3.5, STEP_H - 0.2], [3.6, 0]].map(([x, y]) => new THREE.Vector2(x, y));   // deux marches en anneau
      const steps = new THREE.Mesh(new THREE.LatheGeometry(sp.reverse(), 64), stoneM); steps.castShadow = steps.receiveShadow = true; R.add(steps); }
    const prof = [new THREE.Vector2(SHAFT_R, STEP_H - 0.2), new THREE.Vector2(SHAFT_R, STEP_H + MARG_H), new THREE.Vector2(MARG_R - 0.05, STEP_H + MARG_H + 0.04), new THREE.Vector2(MARG_R + 0.05, STEP_H + MARG_H - 0.06), new THREE.Vector2(MARG_R + 0.08, STEP_H)];
    const marg = new THREE.Mesh(new THREE.LatheGeometry(prof, 48), stoneM); marg.castShadow = marg.receiveShadow = true; R.add(marg);
    { const sg = new THREE.CylinderGeometry(SHAFT_R, SHAFT_R, SHAFT_D, 40, 30, true).translate(0, STEP_H - SHAFT_D / 2, 0), sp = sg.getAttribute("position") as THREE.BufferAttribute, col: number[] = [];
      for (let i = 0; i < sp.count; i++) { const d = clamp((STEP_H + 0.2 - sp.getY(i)) / 4.5, 0, 1), dry = Math.abs(sp.getY(i) - (STEP_H - 0.55)) < 0.06 ? 0.45 : 1;   // trait d'eau sec ; noir dès 4-5 m
        const k = Math.pow(1 - d, 2.4) * dry; col.push(0.62 * k + 0.008, 0.5 * k + 0.016, 0.4 * k + 0.02); }
      sg.setAttribute("color", new THREE.Float32BufferAttribute(col, 3)); const st2 = stoneTex().clone(); st2.repeat.set(9, 60); st2.needsUpdate = true;
      const shaft = new THREE.Mesh(sg, new THREE.MeshBasicMaterial({ map: st2, vertexColors: true, side: THREE.BackSide })); R.add(shaft);
      const bot = new THREE.Mesh(new THREE.CircleGeometry(SHAFT_R, 32).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: "#010303" })); bot.position.y = STEP_H - SHAFT_D + 0.1; R.add(bot); }
    this.deepGlow = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.4).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: glowTex("120,230,210"), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.4 }));
    this.deepGlow.position.y = STEP_H - SHAFT_D + 0.3; this.deepGlow.layers.set(NOINK); R.add(this.deepGlow);
    const wood = solid("wood", "#8a5a32"), dark = solid("darkwood", "#5a3a22"), rope = solid("rope", "#c9a46a"), metal = solid("metal", "#6a6f7a"), clay = solid("clay", "#c46a3a");
    for (const s of [-1, 1]) { b.add(new THREE.BoxGeometry(0.24, 3.1, 0.24).translate(s * 1.95, STEP_H + 1.55, 0), wood); b.add(new THREE.BoxGeometry(0.5, 0.25, 0.5).translate(s * 1.95, STEP_H + 0.12, 0), stoneM); }
    b.add(new THREE.BoxGeometry(4.3, 0.26, 0.3).translate(0, STEP_H + 3.1, 0), wood);
    b.add(new THREE.TorusGeometry(0.24, 0.06, 8, 20).translate(0, STEP_H + 2.7, 0), dark); b.add(new THREE.BoxGeometry(0.06, 0.4, 0.06).translate(0, STEP_H + 2.9, 0), metal);
    this.rope = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 1, 6).translate(0, -0.5, 0), rope); R.add(this.rope);
    this.bucket = new THREE.Group(); { const bm = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.19, 0.34, 16, 1, true).translate(0, -0.17, 0), dark); bm.material = solid("bucket", "#a8703e", { side: THREE.DoubleSide });
      const bo = new THREE.Mesh(new THREE.CircleGeometry(0.19, 16).rotateX(-Math.PI / 2).translate(0, -0.33, 0), dark); const hd = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.015, 6, 20, Math.PI), metal);
      const sand = new THREE.Mesh(new THREE.CircleGeometry(0.23, 16).rotateX(-Math.PI / 2).translate(0, -0.05, 0), solid("sandfill", "#e8904a")); sand.name = "fill";
      this.bucket.add(bm, bo, hd, sand); } R.add(this.bucket);
    // ---------- tour du cor ----------
    const mud = mudTex(), roofT = roofTex(); const mudM = solid("mud", "#ffffff", { map: mud }), roofM = solid("roofm", "#ffffff", { map: roofT });
    b.add(new THREE.CylinderGeometry(1.7, 2.3, TOWER_H, 4).rotateY(Math.PI / 4).translate(TOWER[0], TOWER_H / 2, TOWER[2]), solid("tower", "#e8b07a"));
    b.add(new THREE.BoxGeometry(3.4, 0.4, 3.4).translate(TOWER[0], TOWER_H + 0.0, TOWER[2]), solid("tower2", "#d89a62"));
    for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4, x = TOWER[0] + Math.round(Math.cos(a) * 1.5 * 10) / 10, z = TOWER[2] + Math.round(Math.sin(a) * 1.5 * 10) / 10; b.add(new THREE.BoxGeometry(0.5, 0.55, 0.5).translate(x, TOWER_H + 0.47, z), solid("tower2", "#d89a62")); }
    b.add(new THREE.BoxGeometry(0.9, 1.8, 0.1).translate(TOWER[0], 0.9, TOWER[2] + 2.0), dark);
    // ---------- mur de la fresque ----------
    b.add(new THREE.BoxGeometry(12, 6.6, 0.8).translate(FRESCO[0], 3.3, FRESCO[2] - 0.45), solid("frescowall", "#e0b07a"));
    const fr = new THREE.Mesh(new THREE.PlaneGeometry(10.2, 6.0), solid("fresco", "#ffffff", { map: frescoTex() })); fr.position.set(FRESCO[0], 3.3, FRESCO[2] - 0.04); fr.receiveShadow = true; R.add(fr);
    // ---------- maisons de terre en anneaux (instances, une teinte par maison) ----------
    const hs: { x: number; z: number; w: number; d: number; h: number; a: number; c: THREE.Color }[] = [];
    const MUD = ["#8e7a60", "#7c664e", "#9c8a70", "#6e5c48", "#a49276", "#5e4e3e", "#b0a088", "#807462"].map((c) => new THREE.Color(c));
    for (let r = PLAZA + 4; r < CITY_R; r += 8.5 + (r > 120 ? 2 : 0)) {
      const n = Math.floor((Math.PI * 2 * r) / 8.2);
      for (let i = 0; i < n; i++) { const a = (i + hash(i, Math.floor(r)) * 0.4) / n * Math.PI * 2, rr = r + (hash(i, r + 1) - 0.5) * 2, x = rr * Math.sin(a), z = rr * Math.cos(a);
        const w = 5 + hash(i, r + 3) * 3, dd = 5 + hash(i, r + 4) * 3;
        if (streetDist(x, z) < STREET_W + 1.5 + Math.max(w, dd) * 0.62) continue;
        if (Math.hypot(x - FRESCO[0], z - FRESCO[2]) < 9 || Math.hypot(x - TOWER[0], z - TOWER[2]) < 5) continue;
        if (Math.abs(x) < 6.5 + Math.max(w, dd) * 0.62 && z > 22 && z < 64) continue;                     // la rue du marché reste large
        const hh = 3 + hash(i, r + 2) * (r < 60 ? 5 : 3.5) + (hash(i, r + 7) < 0.08 ? 4 : 0);
        hs.push({ x, z, w, d: dd, h: hh, a, c: MUD[Math.floor(hash(i, r + 5) * MUD.length)] }); }
    }
    { const hg = new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0);                // groupes : +x -x +y -y +z -z
      const inst = new THREE.InstancedMesh(hg, [mudM, mudM, roofM, roofM, mudM, mudM], hs.length);
      hs.forEach((h, i) => { q.setFromAxisAngle(yUp, h.a); mm.compose(V(h.x, 0, h.z), q, V(h.w, h.h, h.d)); inst.setMatrixAt(i, mm); inst.setColorAt(i, h.c); });
      inst.castShadow = inst.receiveShadow = true; R.add(inst);
      // parapets et petits volumes sur les toits
      const pg = new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0), sel = hs.filter((_, i) => hash(i, 501) < 0.45), pi = new THREE.InstancedMesh(pg, solid("roofbox", "#f0d2a8"), sel.length);
      sel.forEach((h, i) => { q.setFromAxisAngle(yUp, h.a); const o = V((hash(i, 502) - 0.5) * h.w * 0.5, 0, (hash(i, 503) - 0.5) * h.d * 0.5).applyQuaternion(q);
        mm.compose(V(h.x + o.x, h.h, h.z + o.z), q, V(1.6 + hash(i, 504) * 1.4, 1.2 + hash(i, 505), 1.6 + hash(i, 506) * 1.4)); pi.setMatrixAt(i, mm); });
      pi.castShadow = pi.receiveShadow = true; R.add(pi);
      // auvents de tissu saturés sur les façades côté rue / place
      const AW = ["#7a2e26", "#3e5f60", "#8a6a2a", "#5a2a30", "#6a4a2e", "#3a4a3a"].map((c) => new THREE.Color(c));
      const ag = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2 + 0.35).translate(0, 0, 0.5), sel2 = hs.filter((h, i) => Math.hypot(h.x, h.z) < 120 && hash(i, 511) < 0.5);
      const am = solid("awning", "#ffffff", { side: THREE.DoubleSide }); const ai = new THREE.InstancedMesh(ag, am, sel2.length);
      sel2.forEach((h, i) => { q.setFromAxisAngle(yUp, h.a + Math.PI); const fw = V(0, 0, h.d / 2).applyQuaternion(q);
        mm.compose(V(h.x + fw.x, 2.4, h.z + fw.z), q, V(2.4 + hash(i, 512) * 1.6, 1, 1.4)); ai.setMatrixAt(i, mm); ai.setColorAt(i, AW[Math.floor(hash(i, 513) * AW.length)]); });
      ai.castShadow = true; R.add(ai); }
    // ---------- palmiers (palmeraie + jardins + place) ----------
    { const pos: [number, number, number][] = [];
      for (let i = 0; i < 1700; i++) { const a = hash(i, 601) * Math.PI * 2, r = CITY_R + 8 + Math.sqrt(hash(i, 602)) * (GROVE_R - CITY_R - 4); pos.push([r * Math.sin(a), r * Math.cos(a), 6 + hash(i, 603) * 6]); }
      for (let i = 0; i < 140; i++) { const a = hash(i, 611) * Math.PI * 2, r = PLAZA + 6 + hash(i, 612) * (CITY_R - PLAZA - 10), x = r * Math.sin(a), z = r * Math.cos(a); if (streetDist(x, z) < 2) continue; pos.push([x, z, 9 + hash(i, 613) * 5]); }
      for (let k = 0; k < 10; k++) { const a = k / 10 * Math.PI * 2 + 0.3; pos.push([(PLAZA - 2) * Math.sin(a), (PLAZA - 2) * Math.cos(a), 8 + hash(k, 621) * 3]); }
      const tg = new THREE.CylinderGeometry(0.16, 0.26, 1, 7, 6).translate(0, 0.5, 0); { const tp = tg.getAttribute("position") as THREE.BufferAttribute; for (let i = 0; i < tp.count; i++) { const y = tp.getY(i); tp.setX(i, tp.getX(i) * (1 + 0.12 * Math.abs(Math.sin(y * 30)))); tp.setZ(i, tp.getZ(i) * (1 + 0.12 * Math.abs(Math.sin(y * 30)))); } tg.computeVertexNormals(); }
      const fronds: THREE.BufferGeometry[] = [];
      for (let k = 0; k < 9; k++) { const f = new THREE.PlaneGeometry(0.7, 3.4, 1, 6).translate(0, 1.7, 0), fp = f.getAttribute("position") as THREE.BufferAttribute;
        for (let i = 0; i < fp.count; i++) { const y = fp.getY(i), s = y / 3.4; fp.setX(i, fp.getX(i) * Math.sin(Math.PI * Math.min(1, s * 1.15)) * 1.2); fp.setZ(i, -1.6 * s * s); fp.setY(i, y * 0.85); }
        f.rotateX(-0.9 - 0.25 * (k % 2)); f.rotateY(k / 9 * Math.PI * 2); fronds.push(f); }
      const cg = mergeGeos(fronds);
      const ti = new THREE.InstancedMesh(tg, solid("trunk", "#4e3a2a"), pos.length), ci = new THREE.InstancedMesh(cg, solid("palm", "#ffffff", { side: THREE.DoubleSide }), pos.length);
      const lean = new THREE.Quaternion();
      pos.forEach(([x, z, h], i) => { lean.setFromAxisAngle(V(hash(i, 631) - 0.5, 0, hash(i, 632) - 0.5).normalize(), 0.05 + hash(i, 633) * 0.16);
        mm.compose(V(x, 0, z), lean, V(1, h, 1)); ti.setMatrixAt(i, mm);
        const top = V(0, h, 0).applyQuaternion(lean); q.setFromAxisAngle(yUp, hash(i, 634) * 6.28).premultiply(lean); mm.compose(V(x + top.x, top.y, z + top.z), q, V(1, 1, 1).multiplyScalar(0.9 + hash(i, 635) * 0.5)); ci.setMatrixAt(i, mm);
        ci.setColorAt(i, new THREE.Color().setHSL(0.2 + hash(i, 636) * 0.05, 0.28, 0.22 + hash(i, 637) * 0.06)); });
      ti.castShadow = ci.castShadow = true; ti.receiveShadow = ci.receiveShadow = true; R.add(ti, ci); }
    // ---------- marché (rue +z) ----------
    for (const [x, z, col] of STALLS) { const s = Math.sign(x);
      for (const [dx, dz] of [[-1, -1.1], [1, -1.1], [-1, 1.1], [1, 1.1]]) b.add(new THREE.CylinderGeometry(0.05, 0.05, 2.4, 6).translate(x + dx * 1.0, 1.2, z + dz), wood);
      b.add(new THREE.BoxGeometry(2.2, 0.8, 2.0).translate(x, 0.4, z), dark);
      const roofc = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.06, 2.8), new THREE.MeshLambertMaterial({ color: col })); roofc.position.set(x, 2.45, z); roofc.rotation.z = -s * 0.18; roofc.castShadow = true; R.add(roofc); this.awnings.push(roofc);
      for (let k = 0; k < 5; k++) { const fx = x + (k - 2) * 0.38, fc = ["#f07a1a", "#c8202a", "#f0c020", "#6a3a1a", "#2a8a3a"][(k + Math.round(z)) % 5];
        b.add(new THREE.CylinderGeometry(0.17, 0.14, 0.14, 10).translate(fx, 0.87, z), solid("basket", "#b88a4a"));
        for (let j = 0; j < 3; j++) b.add(new THREE.SphereGeometry(0.07, 6, 5).translate(fx + (j - 1) * 0.06, 0.97, z + (j % 2) * 0.05), solid("fruit" + fc, fc)); }
      for (let k = 0; k < 3; k++) b.add(new THREE.SphereGeometry(0.32, 10, 8).scale(1, 1.3, 1).translate(x + s * 1.5, 0.4, z - 0.8 + k * 0.8), clay); }
    for (let i = 0; i < 14; i++) { const a = hash(i, 701) * 6.28, r = 4.2 + hash(i, 702) * 3; const x = r * Math.sin(a), z = r * Math.cos(a); if (Math.abs(x) < 1.5 && z > 3) continue;   // jarres près du puits
      b.add(new THREE.SphereGeometry(0.28, 10, 8).scale(1, 1.25, 1).translate(x, 0.33, z), clay); b.add(new THREE.CylinderGeometry(0.1, 0.13, 0.16, 8).translate(x, 0.74, z), clay); }
    // ---------- lanternes autour de la place (allumées au crépuscule) ----------
    for (let k = 0; k < 20; k++) { const a = k / 20 * Math.PI * 2, x = (PLAZA - 4) * Math.sin(a), z = (PLAZA - 4) * Math.cos(a); if (streetDist(x, z) < 1.6) continue;
      b.add(new THREE.CylinderGeometry(0.05, 0.07, 2.6, 6).translate(x, 1.3, z), dark); b.add(new THREE.BoxGeometry(0.26, 0.34, 0.26).translate(x, 2.7, z), solid("lamp", "#f0c060"));
      const lg = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.8), new THREE.MeshBasicMaterial({ map: glowTex("255,170,70"), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); lg.position.set(x, 2.7, z); lg.layers.set(NOINK); R.add(lg); this.lamps.push(lg); }
    // ---------- petites lampes suspendues (disque ambre, halo, cône dans la brume, flaque de lumière au sol) ----------
    const lampAt = (x: number, y: number, z: number, pool = 3.2) => {
      b.add(new THREE.CylinderGeometry(0.012, 0.012, 2.5, 4).translate(x, y + 1.35, z), dark);
      b.add(new THREE.ConeGeometry(0.26, 0.18, 16, 1, true).translate(x, y + 0.08, z), solid("shade", "#2a2420", { side: THREE.DoubleSide }));
      const bu = new THREE.Mesh(new THREE.CircleGeometry(0.15, 16).rotateX(Math.PI / 2), new THREE.MeshBasicMaterial({ color: "#ffd890", side: THREE.DoubleSide })); bu.position.set(x, y, z); bu.layers.set(NOINK); R.add(bu); this.bulbs.push(bu);
      const gl = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.6), new THREE.MeshBasicMaterial({ map: glowTex("255,200,120"), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); gl.position.set(x, y - 0.05, z); gl.layers.set(NOINK); R.add(gl); this.lamps.push(gl);
      const cn = new THREE.Mesh(new THREE.ConeGeometry(pool * 0.75, y, 24, 1, true).translate(0, -y / 2, 0), new THREE.MeshBasicMaterial({ color: "#ffcf8a", transparent: true, opacity: 0.05, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
      cn.position.set(x, y, z); cn.layers.set(NOINK); R.add(cn); this.cones.push(cn);
      const po = new THREE.Mesh(new THREE.PlaneGeometry(pool * 2, pool * 2).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: glowTex("255,190,110"), transparent: true, opacity: 0.32, blending: THREE.AdditiveBlending, depthWrite: false }));
      po.position.set(x, 0.07, z); po.layers.set(NOINK); R.add(po); this.pools.push(po); };
    for (let k = 0; k < 9; k++) { const a = k / 9 * Math.PI * 2 + 0.35; lampAt(6.8 * Math.sin(a), 4.4, 6.8 * Math.cos(a)); }
    lampAt(1.62, STEP_H + 2.7, 0.0, 2.4);                                                 // la lampe du portique, au-dessus du puits
    for (const z of [30, 38, 46, 54]) lampAt(0, 3.8, z, 3);                                   // rue du marché
    lampAt(STELE[0], 3.3, STELE[2] + 1.0, 2.2);
    { const st = new THREE.Mesh(new THREE.BoxGeometry(1.5, 2.1, 0.28).translate(0, 1.05, 0), stoneM); st.position.set(...STELE); st.castShadow = st.receiveShadow = true; R.add(st);
      const pl = new THREE.Mesh(new THREE.PlaneGeometry(1.36, 1.7), new THREE.MeshBasicMaterial({ map: steleTex() })); pl.position.set(STELE[0], 1.08, STELE[2] + 0.15); R.add(pl); }
    // ---------- sac du tirage (gros plan) : toile, pierres blanches et une noire ----------
    this.bag = new THREE.Group(); { const pr = [V(0.0, 0, 0), V(0.16, 0.01, 0), V(0.21, 0.08, 0), V(0.19, 0.2, 0), V(0.15, 0.27, 0), V(0.18, 0.3, 0)].map((v) => new THREE.Vector2(v.x, v.y));
      const sack = new THREE.Mesh(new THREE.LatheGeometry(pr, 20), solid("sack", "#c89a62", { side: THREE.DoubleSide })); this.bag.add(sack);
      const wS = new THREE.MeshBasicMaterial({ color: "#fff4e4" }), bS = new THREE.MeshBasicMaterial({ color: "#0a0a0e" });
      for (let i = 0; i < 16; i++) { const a = hash(i, 801) * 6.28, r = hash(i, 802) * 0.13, s = new THREE.Mesh(new THREE.SphereGeometry(0.045, 12, 10).scale(1, 0.75, 1.1), i === 5 ? bS : wS);
        s.position.set(r * Math.cos(a), 0.17 + hash(i, 803) * 0.04, r * Math.sin(a)); s.rotation.y = a; this.bag.add(s); } }
    this.bag.position.set(...BAG); this.bag.position.y -= 0.3; R.add(this.bag);
    // ---------- toupie de ton petit frère ----------
    this.top = new THREE.Group(); { const c1 = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.1, 14).rotateX(Math.PI).translate(0, 0.05, 0), solid("topred", "#d8302a"));
      const c2 = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.03, 14).translate(0, 0.11, 0), solid("topyel", "#f0c020")); const c3 = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.06, 6).translate(0, 0.15, 0), dark);
      this.top.add(c1, c2, c3); } R.add(this.top);
    // ---------- lanterne de ton frère (descente) ----------
    this.lantern = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 2.2), new THREE.MeshBasicMaterial({ map: glowTex("255,200,110"), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); this.lantern.layers.set(NOINK); R.add(this.lantern);
    b.build(R, true);
    const done = new Set<THREE.Material>();
    R.traverse((o) => { const m = o as THREE.Mesh; if (!m.isMesh) return; for (const mt of (Array.isArray(m.material) ? m.material : [m.material]) as THREE.MeshLambertMaterial[]) { if (done.has(mt)) continue; done.add(mt);
      if (mt.name === "pu_mud" || mt.name === "pu_tower" || mt.name === "pu_frescowall") painted(mt, 0.16, 0.5, 0.2); else if (mt.name === "pu_sand") painted(mt, 0.22, 0.02, 0); else if (mt.name === "pu_earth" || mt.name === "pu_grass") painted(mt, 0.25, 0.08, 0); } });
    // ---------- ciel, soleil ----------
    this.skyMaps = [0, 1, 2].map(skyTex);
    this.sky = new THREE.Mesh(new THREE.SphereGeometry(7000, 24, 16), new THREE.MeshBasicMaterial({ map: this.skyMaps[0], side: THREE.BackSide, fog: false, depthWrite: false })); this.sky.layers.set(NOINK); this.sky.renderOrder = -1; R.add(this.sky);
    this.sunDisc = new THREE.Mesh(new THREE.PlaneGeometry(1100, 1100), new THREE.MeshBasicMaterial({ map: glowTex("255,210,140"), transparent: true, fog: false, blending: THREE.AdditiveBlending, depthWrite: false })); this.sunDisc.layers.set(NOINK); R.add(this.sunDisc);
    for (let i = 0; i < 140; i++) this.actors.push(new Actor(R));
    for (let i = 0; i < 3; i++) this.glows.push(new Actor(R));
    // ---------- détails vivants (particules calculées à partir du temps seul) ----------
    const mk = (key: string, n: number, col: string, size: number, addB: boolean, op = 1, fog = true) => { const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(n * 3), 3));
      const p = new THREE.Points(g, new THREE.PointsMaterial({ map: glowTex(col), size, transparent: true, opacity: op, depthWrite: false, blending: addB ? THREE.AdditiveBlending : THREE.NormalBlending, fog }));
      p.layers.set(NOINK); p.visible = false; p.frustumCulled = false; R.add(p); this.parts[key] = p; };
    mk("dust", 160, "255,214,160", 0.06, true, 0.9); mk("blow", 220, "240,150,90", 2.2, false, 0.35); mk("bird", 30, "20,14,12", 0.6, false);
    mk("pour", 120, "235,150,80", 0.05, false, 1); mk("mote", 80, "255,190,100", 0.05, true, 0.9); mk("smoke", 60, "200,170,150", 5, false, 0.25);
  }

  update(sid: number, f: number, cam: THREE.PerspectiveCamera, scene: THREE.Scene) {
    const t = f / FPS, c = camAt(sid, f), u = uOf(sid, f), id = ROLE[sid], lk = c.pos[1] < STEP_H - 0.3 ? 2 : LIGHT[id], L = LIGHTS[lk];
    cam.position.set(...c.pos); cam.up.set(0, 1, 0); if (Math.abs(c.pos[0] - c.look[0]) + Math.abs(c.pos[2] - c.look[2]) < 0.3) cam.up.set(0, 0, -1);
    cam.lookAt(...c.look); cam.rotateZ(c.roll);
    if (cam.fov !== c.fov || cam.near !== c.near || cam.far !== c.far) { cam.fov = c.fov; cam.near = c.near; cam.far = c.far; cam.updateProjectionMatrix(); }
    cam.layers.enable(NOINK); cam.updateMatrixWorld();
    const focus = V(...c.look), alt = c.pos[1];
    // lumière
    const sunDir = V(...L.sunDir).normalize();
    this.sun.color.set(L.sunCol); this.sun.intensity = L.sunI; this.hemi.color.set(L.hemiSky); this.hemi.intensity = L.hemiI;
    const span = alt > 150 ? 700 : alt > 25 ? 160 : 22;
    const sf = alt > 25 ? V(c.look[0], 0, c.look[2]) : focus;
    this.sun.position.copy(sf).addScaledVector(sunDir, span * 3); this.sun.target.position.copy(sf);
    const sc = this.sun.shadow.camera; sc.left = -span; sc.right = span; sc.top = span; sc.bottom = -span; sc.near = 1; sc.far = span * 7; sc.updateProjectionMatrix();
    this.sun.shadow.bias = -0.0005; this.sun.shadow.normalBias = 0.02 * (span / 7);
    TONE.uLitCol.value.set(...L.lit); TONE.uShadeCol.value.set(...L.shade); TONE.uShadeLift.value.set(...L.lift);
    TONE.uLambert.value = 0.35; TONE.uSideK.value = 0.84; TONE.uTerm.value = 0.2; TONE.uBounce.value.set(0, 0, 0); TONE.uSat.value = L.sat;
    CHAR.uCharTint.value.set(...L.charTint); CHAR.uCharShade.value = 0.72; CHAR.uGrad.value = 0.09; CHAR.uBodyGrad.value = 0.22; CHAR.uSideTint.value.set(0.8, 0.86, 1.0);
    untone(L.fogCol, this.fog.color);
    this.fog.near = alt > 25 ? 300 + alt * 0.4 : L.fogNear; this.fog.far = alt > 25 ? Math.min(L.fogFar + alt, 1800 + alt * 3) : L.fogFar;
    scene.fog = this.fog; scene.background = new THREE.Color(L.bg);
    (this.sky.material as THREE.MeshBasicMaterial).map = this.skyMaps[lk]; this.sky.position.copy(cam.position); this.sky.visible = lk !== 2;
    this.sunDisc.visible = lk === 0; this.sunDisc.position.copy(cam.position).add(V(-L.sunDir[0], L.sunDir[1] * 0.35, -L.sunDir[2]).normalize().multiplyScalar(-6000)); this.sunDisc.lookAt(cam.position);
    const ct = cutAt(f), kc = ct.sid === sid ? ct.k : 0, cu = Math.max(0, Math.min(1, (f - ct.a) / Math.max(1, ct.b - ct.a)));
    const dusk = lk === 1, flick = (i: number) => 0.8 + 0.2 * Math.sin(t * 13 + i * 2) * Math.sin(t * 5.3 + i);
    const lampK = dusk ? 1 : 0.75;
    this.lamps.forEach((lg, i) => { (lg.material as THREE.MeshBasicMaterial).opacity = lampK * flick(i); lg.lookAt(cam.position); });
    this.pools.forEach((po, i) => { (po.material as THREE.MeshBasicMaterial).opacity = (dusk ? 0.42 : 0.24) * (0.9 + 0.1 * flick(i)); });
    this.cones.forEach((cn) => { (cn.material as THREE.MeshBasicMaterial).opacity = dusk ? 0.06 : 0.035; });
    this.awnings.forEach((a, i) => { a.rotation.x = 0.03 * Math.sin(t * 2.3 + i); });
    (this.deepGlow.material as THREE.MeshBasicMaterial).opacity = id === 18 ? 0.25 + 0.15 * Math.sin(t * 3) : 0.12;
    // seau et corde
    const pul = V(0, STEP_H + 2.46, 0);
    let ropeEnd = V(0, TOP_Y + 0.55, 0); this.bucket.visible = true; let rest = true;
    if (id === 11) { rest = false; const yb = -1.6 + 3.4 * smooth(u * 1.25); ropeEnd = V(0, yb, 0); this.bucket.rotation.z = kc === 1 ? 0.5 * smooth(cu * 3) : 0; }
    else this.bucket.rotation.z = 0;
    if (id >= 15 && id <= 20) this.bucket.visible = false;
    if (rest) { this.bucket.position.set(-1.25, TOP_Y + 0.38, 0.2); ropeEnd = V(-1.1, TOP_Y + 0.38, 0.2); } else this.bucket.position.copy(ropeEnd);
    (this.bucket.getObjectByName("fill") as THREE.Mesh).visible = id === 11;
    // ---------- particules ----------
    const fwd = new THREE.Vector3(); cam.getWorldDirection(fwd); const rgt = fwd.clone().cross(V(0, 1, 0)).normalize(), upv = rgt.clone().cross(fwd).normalize();
    const nearCam = (d: number, x: number, y: number): V3 => { const p = cam.position.clone().addScaledVector(fwd, d).addScaledVector(rgt, x).addScaledVector(upv, y); return [p.x, p.y, p.z]; };
    const frc = (x: number) => x - Math.floor(x);
    const setP = (key: string, on: boolean, fn?: (i: number, r: (k: number) => number) => V3 | null, size?: number) => { const p = this.parts[key]; p.visible = on; if (!on || !fn) return;
      if (size) (p.material as THREE.PointsMaterial).size = size;
      const a = p.geometry.getAttribute("position") as THREE.BufferAttribute;
      for (let i = 0; i < a.count; i++) { const v = fn(i, (kk) => hash(i, 300 + kk)) ?? [0, -999, 0]; a.setXYZ(i, v[0], v[1], v[2]); } a.needsUpdate = true; };
    setP("dust", [3, 4, 6, 8, 9, 10, 11, 12, 13, 14, 15, 17, 19, 20].includes(id), (i, r) => nearCam(1.5 + r(0) * 7, (r(1) - 0.5) * 5 + Math.sin(t * 0.6 + i) * 0.3 + t * 0.12, (r(2) - 0.5) * 7 + Math.sin(t * 0.8 + i * 2) * 0.2), 0.06);
    setP("blow", id === 1 || id === 2, (i, r) => { const a = frc(r(0) + t * (0.3 + r(1) * 0.2)); return nearCam(14 + r(2) * 60, -30 + a * 60, -6 + r(3) * 4 + Math.sin(a * 6 + i) * 1.5); }, 3);   // le vent soulève le sable
    setP("bird", id === 2 || id === 5 || id === 6, (i, r) => { const a = frc(r(0) * 0.4 + t * 0.06); return [-80 + a * 200 + r(1) * 20, 60 + r(2) * 30 + Math.sin(t * 8 + i) * 0.8, -40 + r(3) * 60 + a * 30]; }, 2.2);
    setP("pour", id === 11 && kc === 1, (i, r) => { const a = frc(r(0) + t * 1.6), bx = this.bucket.position.x + 0.16, by = this.bucket.position.y - 0.05;   // le sable coule du seau
      return [bx + (r(1) - 0.5) * 0.06 + a * 0.08, by - a * 2.2, this.bucket.position.z + (r(2) - 0.5) * 0.06]; });
    setP("mote", dusk && id !== 16 && id !== 18, (i, r) => nearCam(1.2 + r(0) * 6, (r(1) - 0.5) * 4 + Math.sin(t * 0.9 + i) * 0.2, (r(2) - 0.5) * 6 + frc(r(3) + t * 0.05) * 1.5));
    setP("smoke", id === 5 || id === 6, (i, r) => { const a = frc(r(0) + t * 0.05), k = Math.floor(r(1) * 6); const x0 = Math.sin(k * 1.7) * (40 + k * 25), z0 = Math.cos(k * 1.7) * (40 + k * 25);
      return [x0 + a * 6, 8 + a * 30, z0 + (r(2) - 0.5) * 3]; });
    // ---------- toupie ----------
    this.top.visible = id === 4;
    if (id === 4) { const fall = kc === 3 ? smooth(cu * 1.6) : 0, roll = kc === 3 ? smooth((cu - 0.4) * 2) * 0.5 : 0;
      this.top.position.set(BRO_STREET[0] + 0.5 + roll, 0, BRO_STREET[2] + 0.35 + roll * 0.4); this.top.rotation.set(0, t * (kc === 3 ? 22 * (1 - fall) : 22), fall * 1.45, "YXZ"); }
    // ---------- sac ----------
    this.bag.visible = id === 13 || (id === 14 && kc > 0);
    // ---------- personnages ----------
    const yaw = (p: V3) => Math.atan2(cam.position.x - p[0], cam.position.z - p[2]);
    let k = 0; this.silOn.fill(false);
    const place = (key: string, look: Partial<Person>, p: V3, fo: Fo, scale = 1, roll = 0) => {
      const A = this.actors[k++]; if (!A) return;
      const d = cam.position.distanceTo(V(p[0], p[1] + 1.1 * scale, p[2])), [w, h, kk] = tierOf(d / scale);
      const spec: Person = { ref: true, ...(look as Person), pose: fo.pose ?? "stand", expr: fo.expr, back: fo.back, blink: !!fo.blink, look: fo.look ?? 0, step: fo.step, ...(fo.prop !== undefined ? { prop: fo.prop ?? undefined } : {}) };
      A.r = this.pool.req(`${key}|${JSON.stringify(fo)}`, w, h, kk, (pen: Pen) => drawPerson(pen, spec));
      A.mesh.position.set(...p); A.mesh.up.set(0, 1, 0); A.mesh.rotation.set(0, yaw(p), roll + (fo.sil ? 0 : 0.022 * Math.sin(f * 0.11 + k * 1.7)), "YXZ");   // léger balancement (vie à l'écran)
      const dy = cam.position.y - (p[1] + 1.0 * scale), hz = Math.hypot(cam.position.x - p[0], cam.position.z - p[2]);
      if (Math.atan2(dy, hz) > 0.55) { A.mesh.up.set(0, 1, 0).applyQuaternion(cam.quaternion); A.mesh.lookAt(cam.position); A.mesh.up.set(0, 1, 0); }
      A.mesh.scale.set(scale, scale * (1 + 0.012 * Math.sin(f * 0.19 + k * 2.3)), scale); A.mesh.visible = true; this.silOn[k - 1] = !!fo.sil;   // respiration
    };
    /** silhouettes noires au premier plan, très près de la caméra (floues) : elles encadrent le sujet, comme dans VIDEO_01 */
    const fgSil = (xs: number[], d = 1.1) => xs.forEach((x, i) => { const q = cam.position.clone().addScaledVector(fwd, d + 0.15 * i).addScaledVector(rgt, x);
      place(`sil${i % 3}`, CROWD[(i * 3) % CROWD.length], [q.x, Math.max(0, cam.position.y - 2.05 + 0.1 * (i % 2)), q.z], { expr: "calm", back: true, sil: true }); });
    let kg = 0;
    /** carte spéciale (main, couteau, main des profondeurs) : face caméra */
    const card = (key: string, draw: (p: Pen) => void, p: V3, scale: number, glow = false) => {
      const A = glow ? this.glows[kg++] : this.actors[k++]; if (!A) return;
      A.r = this.pool.req(key, 1080, 1800, 1.8, draw); A.mesh.position.set(...p); A.mesh.up.set(0, 1, 0).applyQuaternion(cam.quaternion); A.mesh.lookAt(cam.position); A.mesh.up.set(0, 1, 0);
      A.mesh.scale.set(scale, scale * (1 + 0.012 * Math.sin(f * 0.19 + k * 2.3)), scale); A.mesh.visible = true;   // respiration
    };
    const blink = (seed: number) => (f + seed * 37) % 97 < 4;
    const jit = (amp: number, seed: number) => amp * Math.sin(t * 41 + seed) * Math.sin(t * 13 + seed * 2);
    const crowd = (list: typeof RING_A, expr: Expr, n = list.length, frozen = false) => list.slice(0, n).forEach((o, i) =>
      place(o.kid ? `kid${i % KIDS.length}` : `c${o.c}`, o.kid ? KIDS[i % KIDS.length] : CROWD[o.c], o.p, { expr: i % 4 === 1 && !frozen ? "calm" : expr, blink: !frozen && blink(i), look: frozen ? 0 : Math.sin(i * 1.7) * 0.6 }, o.kid ? KID_S : 1));
    const elders = (look = [0, 0, 0], expr: Expr = "frown") => ELDERS.forEach((p, i) => place("EL", LOOK.EL, p, { expr, look: look[i] }));
    if (id === 2) place("H", LOOK.H, [TOWER[0], TOWER_H + 0.2, TOWER[2]], { expr: "calm", blink: false });
    if (id === 3) { crowd(RING_PLAZA, kc === 1 ? "worry" : "calm", 34, kc === 1); }
    if (id === 4) {                                                                       // le marché figé : marchands, porteuses de jarres, ton frère
      STALLS.forEach(([x, z], i) => place(`m${i}`, CROWD[(i * 3) % CROWD.length], [x + Math.sign(x) * -0.2, 0, z + 1.6], { expr: kc === 0 ? "worry" : "calm", look: -Math.sign(x) * 0.8 }));
      [[-1.2, 42], [1.0, 38.5], [-0.8, 31], [2.2, 44.5], [-2.0, 35.6]].forEach(([x, z], i) => place(`p${i}`, { ...CROWD[(i * 7 + 2) % CROWD.length], prop: i % 2 ? undefined : "jar" }, [x, 0, z], { expr: "worry", look: Math.sin(i) * 0.7 }));
      place("BRO", LOOK.BRO, BRO_STREET, { expr: kc >= 2 ? "worry" : "calm", look: kc >= 2 ? -0.6 : 0.4, blink: false }, KID_S);
      place("kid0", KIDS[0], [BRO_STREET[0] - 0.9, 0, BRO_STREET[2] + 0.6], { expr: "worry", look: 0.5 }, KID_S * 0.95);
    }
    if (id === 6 && kc === 2) [[-0.9, 1], [0.9, -1]].forEach(([x, s]) => { for (let j = 0; j < 7; j++) place(`q${j}`, { ...CROWD[(j * 3 + (s > 0 ? 1 : 4)) % CROWD.length], prop: "jar" }, [x, 0, 8.5 + j * 2.1], { expr: "calm", look: s * 0.3 }); });
    if (id === 8 && kc === 0) elders([0.3, 0, -0.3], "frown");
    if (id === 9 && kc === 1 && u > 0.55 && u < 0.78) card("deephand", drawDeepHand, [0, -7.5 + 1.5 * smooth((u - 0.55) * 4), 0], 1.4, true);
    if (id === 10) { const back = kc === 1 ? smooth(cu * 2) * 0.6 : 0; place("K", LOOK.K, [0.95 + back * 0.4, STEP_H, 1.85 + back], { expr: kc === 1 ? "fear" : "calm", look: -0.8 }, KID_S);
      place("M", LOOK.M, [-0.5, 0.2, 3.1], { pose: "reach", expr: "fear", look: 0.7 }); }
    if (id === 12 || id === 14 || id === 17 || id === 19 || id === 20) {               // la place au crépuscule : foule, Anciens, toi
      if (!(id === 14 && kc > 0)) {
        crowd(RING_A, id === 17 ? "worry" : id >= 19 ? "calm" : "worry", 96, id === 17 || id === 19);
        elders(id === 19 && kc === 1 ? [0.9, -0.9 * smooth(cu * 3), -0.9] : [0, 0, 0], id === 19 ? "calm" : "frown");
        place("Y", LOOK.Y, YOU, { expr: id === 20 ? "fear" : id === 19 ? "shock" : "worry", blink: id === 12 && blink(3), look: id === 20 ? -0.4 : 0 });
        if (id === 12 || id === 14) { place("CH", LOOK.CH, CHIEF, { expr: "frown" });
          for (let j = 0; j < 6; j++) { const isBro = j === 0, z = QUEUE_Z0 + j * 0.85 + (id === 14 && isBro ? -0.45 * smooth(u * 3) : 0);
            if (isBro && id === 12 && u < 0.4) continue;
            place(isBro ? "BRO" : `kid${j}`, isBro ? LOOK.BRO : KIDS[j % KIDS.length], [0, 0, z], { expr: isBro ? "worry" : "fear", back: id === 12 && kc === 0, step: 0 }, KID_S); } }
      }
    }
    if (id === 13) place("CH", LOOK.CH, CHIEF, { expr: "frown", prop: null });
    if ((id === 12 && kc === 1) || (id === 15 && kc === 0) || (id === 19 && kc !== 1) || id === 20 || (id === 3 && kc === 1)) fgSil(id === 20 ? [-0.75, 0.8] : [-0.62, 0.66]);
    if (id === 14 && kc === 1) card("hand_dip", (p) => drawHand(p, false), [BAG[0] + 0.02, BAG[1] - 1.177 * 0.3 + 0.1 - 0.16 * smooth(cu * 2), BAG[2] + 0.1], 0.3);
    if (id === 14 && kc === 2) card("hand_open", (p) => drawHand(p, true), [BAG[0], BAG[1] - 1.09 * 0.24 + 0.1, BAG[2] + 0.3], 0.24);
    if (id === 15) {
      if (kc === 0) { crowd(RING_A, "worry", 96); place("Y", LOOK.Y, YOU, { expr: "shock", blink: false }); }
      else { const lean = kc >= 1 ? 0.12 * smooth(cu * 2) : 0;
        place("BRO", LOOK.BRO, RIM, { expr: "worry", look: 0.8, blink: kc === 2 && blink(2) }, KID_S, -lean);
        place("Y", LOOK.Y, [RIM[0] + 0.62, STEP_H, RIM[2] + 0.28], { expr: "fear", look: -0.6 });
        elders([0, 0, 0], "frown"); }
    }
    if (id === 16 && kc === 0) { const y = STEP_H - 0.4 - 13 * smooth(u * 1.3); place("BRO", LOOK.BRO, [0.05, y - 1.2, 0.05], { expr: "fear", look: 0 }, KID_S);
      ropeEnd = V(0.05, y, 0.05); this.lantern.visible = true; this.lantern.position.set(0.3, y - 0.6, 0.2); this.lantern.lookAt(cam.position); }
    else this.lantern.visible = false;
    if (id === 16 && kc === 1) card("knife", drawKnife, [0.12, STEP_H + 2.2 - 1.03 * 0.3, 0.2], 0.3);
    if (id >= 16) { if (!(id === 16 && kc === 0)) ropeEnd = V(0, id === 16 ? STEP_H + 2.0 - 1.2 * smooth(cu * 3) : STEP_H + 1.1, 0); }
    // corde
    const L2 = pul.distanceTo(ropeEnd); this.rope.position.copy(pul); this.rope.scale.set(1, L2, 1); this.rope.quaternion.setFromUnitVectors(V(0, -1, 0), ropeEnd.clone().sub(pul).normalize());
    void jit; void hash; void DUNE_R; void tW;
    for (; k < this.actors.length; k++) this.actors[k].mesh.visible = false;
    for (; kg < this.glows.length; kg++) this.glows[kg].mesh.visible = false;
    this.pool.flush();
    for (const a of [...this.actors, ...this.glows]) if (a.mesh.visible) { a.bind(); a.mesh.material = a.mat; }
    this.actors.forEach((a, i) => { if (!a.mesh.visible || !this.silOn[i]) return;
      const m = (this.silMats[i] ??= new THREE.MeshBasicMaterial({ color: "#0c0a08", alphaTest: 0.5, side: THREE.DoubleSide, fog: false })); m.map = a.mat.map; a.mesh.material = m; });
    this.glows.forEach((a, i) => { if (!a.mesh.visible) return;                       // main des profondeurs : lumineuse, non éclairée
      const m = (this.glowMats[i] ??= new THREE.MeshBasicMaterial({ transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }));
      m.map = a.mat.map; m.opacity = 0.75; a.mesh.material = m; });
    return focus;
  }
}
const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));
function mergeGeos(list: THREE.BufferGeometry[]) {
  const n = list.reduce((s, g) => s + (g.index ? g.index.count : g.getAttribute("position").count), 0), pos = new Float32Array(n * 3), nor = new Float32Array(n * 3); let o = 0;
  for (const g0 of list) { const g = g0.index ? g0.toNonIndexed() : g0; g.computeVertexNormals(); const p = g.getAttribute("position") as THREE.BufferAttribute, nn = g.getAttribute("normal") as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) { pos.set([p.getX(i), p.getY(i), p.getZ(i)], (o + i) * 3); nor.set([nn.getX(i), nn.getY(i), nn.getZ(i)], (o + i) * 3); } o += p.count; }
  const m = new THREE.BufferGeometry(); m.setAttribute("position", new THREE.BufferAttribute(pos, 3)); m.setAttribute("normal", new THREE.BufferAttribute(nor, 3)); return m;
}
