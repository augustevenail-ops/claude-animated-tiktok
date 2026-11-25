// Le Monstre : textures procédurales (Canvas2D, déterministes). Couleur (sRGB) + cartes de relief / rugosité (linéaires).
import * as THREE from "three";
import { hash } from "./tex";

const cache = new Map<string, THREE.CanvasTexture>();
/** texture Canvas ; lin = carte de données (relief, rugosité, émission) sans conversion sRGB */
export const tx = (key: string, w: number, h: number, draw: (g: CanvasRenderingContext2D) => void, rep = true, lin = false) => {
  const c = cache.get(key); if (c) return c;
  const cv = document.createElement("canvas"); cv.width = w; cv.height = h;
  draw(cv.getContext("2d")!);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = lin ? THREE.NoColorSpace : THREE.SRGBColorSpace; t.anisotropy = 16;
  if (rep) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  cache.set(key, t); return t;
};
export const rep = (t: THREE.Texture, x: number, y: number) => { const c = t.clone(); c.repeat.set(x, y); c.needsUpdate = true; return c; };
const speck = (g: CanvasRenderingContext2D, w: number, h: number, n: number, a: number, r: number, seed: number, light = "255,255,255", dark = "0,0,0") => {
  for (let i = 0; i < n; i++) { g.fillStyle = `rgba(${hash(i, seed) < 0.5 ? dark : light},${a * (0.3 + hash(i, seed + 1) * 0.7)})`; g.beginPath(); g.arc(hash(i, seed + 2) * w, hash(i, seed + 3) * h, r * (0.3 + hash(i, seed + 4)), 0, 7); g.fill(); }
};
const crackPath = (g: CanvasRenderingContext2D, x: number, y: number, len: number, a: number, seed: number, depth = 0) => {
  g.beginPath(); g.moveTo(x, y);
  for (let i = 0; i < 8; i++) { a += (hash(seed, i) - 0.5) * 0.9; x += Math.cos(a) * len / 8; y += Math.sin(a) * len / 8; g.lineTo(x, y);
    if (depth < 2 && hash(seed, i + 20) < 0.22) { g.stroke(); crackPath(g, x, y, len * 0.5, a + (hash(seed, i + 30) - 0.5) * 2, seed * 7 + i, depth + 1); g.beginPath(); g.moveTo(x, y); } }
  g.stroke();
};

/** dalle carrée de béton clair (1 répétition = 1 dalle de 3 m) : couleur, relief des joints, rugosité */
export const slabTex = (k = "") => tx("slab" + k, 512, 512, (g) => {
  g.fillStyle = "#b9bcc2"; g.fillRect(0, 0, 512, 512);
  const gr = g.createRadialGradient(256, 256, 40, 256, 256, 380); gr.addColorStop(0, "rgba(255,255,255,0.06)"); gr.addColorStop(1, "rgba(0,0,0,0.08)"); g.fillStyle = gr; g.fillRect(0, 0, 512, 512);
  speck(g, 512, 512, 2600, 0.07, 2.2, 3); speck(g, 512, 512, 30, 0.05, 40, 9, "255,255,255", "60,55,50");
  g.fillStyle = "#6c6f76"; g.fillRect(0, 0, 512, 7); g.fillRect(0, 0, 7, 512);
  g.fillStyle = "rgba(255,255,255,0.18)"; g.fillRect(7, 7, 505, 3); g.fillRect(7, 7, 3, 505);
});
export const slabBump = () => tx("slabB", 512, 512, (g) => {
  g.fillStyle = "#c8c8c8"; g.fillRect(0, 0, 512, 512); speck(g, 512, 512, 3000, 0.12, 1.8, 5);
  g.fillStyle = "#202020"; g.fillRect(0, 0, 8, 512); g.fillRect(0, 0, 512, 8);
}, true, true);
export const slabRough = () => tx("slabR", 256, 256, (g) => { g.fillStyle = "#d8d8d8"; g.fillRect(0, 0, 256, 256); speck(g, 256, 256, 60, 0.18, 30, 7); g.fillStyle = "#a0a0a0"; g.fillRect(0, 0, 4, 256); g.fillRect(0, 0, 256, 4); }, true, true);

export const asphaltTex = () => tx("asph", 512, 512, (g) => {
  g.fillStyle = "#3a3d44"; g.fillRect(0, 0, 512, 512); speck(g, 512, 512, 5000, 0.12, 1.6, 11); speck(g, 512, 512, 18, 0.07, 60, 13, "90,95,110", "10,10,14");
  g.strokeStyle = "rgba(15,15,18,0.5)"; g.lineWidth = 2; for (let i = 0; i < 4; i++) crackPath(g, hash(i, 2) * 512, hash(i, 3) * 512, 160, hash(i, 4) * 6, i + 40);
});
export const asphaltBump = () => tx("asphB", 256, 256, (g) => { g.fillStyle = "#808080"; g.fillRect(0, 0, 256, 256); speck(g, 256, 256, 4000, 0.3, 1.2, 15); }, true, true);
export const sidewalkTex = () => tx("walk", 256, 256, (g) => {
  g.fillStyle = "#9a9590"; g.fillRect(0, 0, 256, 256); speck(g, 256, 256, 900, 0.08, 2, 17);
  g.fillStyle = "#6e6a66"; for (let i = 0; i <= 4; i++) { g.fillRect(i * 64 - 1, 0, 3, 256); g.fillRect(0, i * 64 - 1, 256, 3); }
});

/** bandes de signalisation jaune / noir */
export const hazardTex = () => tx("haz", 256, 64, (g) => {
  g.fillStyle = "#151515"; g.fillRect(0, 0, 256, 64); g.fillStyle = "#f2c21b";
  for (let x = -64; x < 320; x += 64) { g.beginPath(); g.moveTo(x, 64); g.lineTo(x + 32, 64); g.lineTo(x + 64, 0); g.lineTo(x + 32, 0); g.fill(); }
  speck(g, 256, 64, 300, 0.12, 1.5, 19);
});
export const concreteTex = () => tx("conc", 256, 256, (g) => { g.fillStyle = "#8d8f93"; g.fillRect(0, 0, 256, 256); speck(g, 256, 256, 1500, 0.1, 1.8, 21); speck(g, 256, 256, 20, 0.07, 30, 23, "255,255,255", "40,40,40");
  g.fillStyle = "rgba(0,0,0,0.12)"; for (let i = 0; i < 6; i++) g.fillRect(hash(i, 5) * 256, 0, 2, 256); });
/** acier peint noir, rayé (couleur + rugosité) */
export const steelTex = () => tx("steel", 256, 256, (g) => { g.fillStyle = "#26282d"; g.fillRect(0, 0, 256, 256); speck(g, 256, 256, 800, 0.08, 1.5, 25);
  g.strokeStyle = "rgba(180,185,195,0.12)"; g.lineWidth = 1; for (let i = 0; i < 40; i++) { g.beginPath(); const x = hash(i, 1) * 256, y = hash(i, 2) * 256; g.moveTo(x, y); g.lineTo(x + (hash(i, 3) - 0.5) * 60, y + (hash(i, 4) - 0.5) * 20); g.stroke(); }
  g.fillStyle = "rgba(120,70,40,0.18)"; for (let i = 0; i < 8; i++) { g.beginPath(); g.arc(hash(i, 7) * 256, hash(i, 8) * 256, 4 + hash(i, 9) * 10, 0, 7); g.fill(); } });
export const steelRough = () => tx("steelR", 256, 256, (g) => { g.fillStyle = "#8a8a8a"; g.fillRect(0, 0, 256, 256); speck(g, 256, 256, 400, 0.25, 6, 27); }, true, true);

/** céramique ivoire fissurée (tête du monstre) : couleur + relief des fissures */
const crackSet = (g: CanvasRenderingContext2D, col: string, w: number) => {
  g.strokeStyle = col; g.lineCap = "round"; g.lineJoin = "round";
  for (let i = 0; i < 16; i++) { g.lineWidth = w * (0.5 + hash(i, 61) * 0.9); crackPath(g, hash(i, 62) * 1024, hash(i, 63) * 1024, 180 + hash(i, 64) * 320, hash(i, 65) * 6.3, 100 + i); }
};
export const ceramicTex = () => tx("ceram", 1024, 1024, (g) => {
  g.fillStyle = "#e9e1cf"; g.fillRect(0, 0, 1024, 1024);
  speck(g, 1024, 1024, 60, 0.07, 90, 31, "255,250,240", "150,135,110"); speck(g, 1024, 1024, 3000, 0.05, 2, 33, "255,255,255", "120,105,90");
  g.globalAlpha = 0.35; crackSet(g, "#8a7a62", 9); g.globalAlpha = 1; crackSet(g, "#2a2218", 3.2);
}, false);
export const ceramicBump = () => tx("ceramB", 1024, 1024, (g) => { g.fillStyle = "#c0c0c0"; g.fillRect(0, 0, 1024, 1024); speck(g, 1024, 1024, 2500, 0.08, 3, 35); crackSet(g, "#101010", 6); }, false, true);
/** plaques blanchâtres translucides du corps : veines grises, couleur + relief */
export const plateTex = () => tx("plate", 512, 512, (g) => {
  const gr = g.createLinearGradient(0, 0, 512, 512); gr.addColorStop(0, "#dfe3e6"); gr.addColorStop(1, "#c3c8cd"); g.fillStyle = gr; g.fillRect(0, 0, 512, 512);
  speck(g, 512, 512, 40, 0.08, 60, 41, "255,255,255", "90,100,110");
  g.strokeStyle = "rgba(70,78,90,0.45)"; g.lineWidth = 2; for (let i = 0; i < 8; i++) crackPath(g, hash(i, 42) * 512, hash(i, 43) * 512, 200, hash(i, 44) * 6, 200 + i);
});

/** fenêtres de nuit : couleur de façade + carte d'émission (fenêtres allumées blanc / jaune, certaines éteintes) */
export const facadeNight = (wall: string, cols: number, rows: number, seed: number, lit = 0.55, shop = true) => {
  const key = `fac_${wall}_${cols}_${rows}_${seed}_${lit}_${shop}`;
  const W = 512, H = 1024, cw = W / cols, rh = H / rows;
  const map = tx(key, W, H, (g) => {
    g.fillStyle = wall; g.fillRect(0, 0, W, H); speck(g, W, H, 900, 0.06, 3, seed);
    for (let r = 0; r < rows; r++) { g.fillStyle = "rgba(0,0,0,0.18)"; g.fillRect(0, r * rh + rh - 6, W, 6); g.fillStyle = "rgba(255,255,255,0.08)"; g.fillRect(0, r * rh, W, 3); }
    for (let r = shop ? 1 : 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const x = c * cw + cw * 0.2, y = r * rh + rh * 0.22, w = cw * 0.6, h = rh * 0.56;
      g.fillStyle = "#e8e4dc"; g.fillRect(x - 4, y - 4, w + 8, h + 10);
      g.fillStyle = "#151a26"; g.fillRect(x, y, w, h);
      g.fillStyle = "#2a3348"; g.fillRect(x + w / 2 - 1.5, y, 3, h);
    }
    if (shop) { g.fillStyle = "#2a2a30"; g.fillRect(0, 0, W, rh); for (let c = 0; c < cols; c += 2) { g.fillStyle = "#1a2030"; g.fillRect(c * cw + 8, rh * 0.25, cw * 2 - 16, rh * 0.72); } }
  }, false);
  const em = tx(key + "_e", W, H, (g) => {
    g.fillStyle = "#000"; g.fillRect(0, 0, W, H);
    for (let r = shop ? 1 : 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const hv = hash(r * 97 + c * 13, seed); if (hv > lit) continue;
      const x = c * cw + cw * 0.2, y = r * rh + rh * 0.22, w = cw * 0.6, h = rh * 0.56;
      const warm = hash(r * 7 + c, seed + 3) < 0.7;
      const gr = g.createLinearGradient(0, y, 0, y + h); gr.addColorStop(0, warm ? "#ffd27a" : "#e8f0ff"); gr.addColorStop(1, warm ? "#ff9e3a" : "#a8c0ff");
      g.globalAlpha = 0.55 + hash(r, c + seed) * 0.45; g.fillStyle = gr; g.fillRect(x, y, w, h);
      if (hash(c, r + seed) < 0.4) { g.fillStyle = "rgba(0,0,0,0.6)"; g.fillRect(x + w * (0.1 + hash(c, r) * 0.5), y + h * 0.3, w * 0.25, h * 0.7); } // silhouette / meuble
      g.globalAlpha = 1;
    }
    if (shop) for (let c = 0; c < cols; c += 2) { if (hash(c, seed + 9) < 0.35) continue; g.fillStyle = hash(c, seed + 5) < 0.5 ? "#ffe0a0" : "#c8e8ff"; g.globalAlpha = 0.85; g.fillRect(c * cw + 8, rh * 0.25, cw * 2 - 16, rh * 0.72); g.globalAlpha = 1; }
  }, false);
  return { map, em };
};
/** tour de verre : bandes de vitres sombres réfléchissantes + étages allumés */
export const towerNight = (seed: number, cols = 10, rows = 40, lit = 0.35) => {
  const key = `tw_${seed}_${cols}_${rows}_${lit}`, W = 256, H = 1024, cw = W / cols, rh = H / rows;
  const map = tx(key, W, H, (g) => { const gr = g.createLinearGradient(0, 0, W, H); gr.addColorStop(0, "#1c2740"); gr.addColorStop(1, "#0e1424"); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    g.fillStyle = "#3a4458"; for (let c = 0; c <= cols; c++) g.fillRect(c * cw - 1.5, 0, 3, H); for (let r = 0; r <= rows; r++) g.fillRect(0, r * rh - 1.5, W, 4); }, false);
  const em = tx(key + "_e", W, H, (g) => { g.fillStyle = "#000"; g.fillRect(0, 0, W, H);
    for (let r = 0; r < rows; r++) { const floorOn = hash(r, seed) < lit; for (let c = 0; c < cols; c++) { if (!(floorOn ? hash(r * 31 + c, seed + 1) < 0.85 : hash(r * 31 + c, seed + 2) < 0.12)) continue;
      g.fillStyle = hash(r + c, seed + 4) < 0.6 ? "#ffd896" : "#dfe8ff"; g.globalAlpha = 0.5 + hash(c, r + seed) * 0.5; g.fillRect(c * cw + 2, r * rh + 3, cw - 4, rh - 6); g.globalAlpha = 1; } } }, false);
  return { map, em };
};
/** panneau de projecteur : grille de cellules LED blanches */
export const ledTex = () => tx("led", 256, 128, (g) => { g.fillStyle = "#1a1a1a"; g.fillRect(0, 0, 256, 128);
  for (let y = 0; y < 3; y++) for (let x = 0; x < 6; x++) { const gr = g.createRadialGradient(22 + x * 42, 22 + y * 42, 2, 22 + x * 42, 22 + y * 42, 20); gr.addColorStop(0, "#ffffff"); gr.addColorStop(0.7, "#eef4ff"); gr.addColorStop(1, "#8890a0"); g.fillStyle = gr; g.fillRect(4 + x * 42, 4 + y * 42, 36, 36); } }, false);
/** ciel nocturne : dégradé indigo -> bleu-violet + étoiles (équirectangulaire) */
export const nightSky = () => tx("nsky", 2048, 1024, (g) => {
  const gr = g.createLinearGradient(0, 0, 0, 1024);
  gr.addColorStop(0, "#03040c"); gr.addColorStop(0.3, "#0a0f2a"); gr.addColorStop(0.46, "#1d2456"); gr.addColorStop(0.5, "#3b3a78"); gr.addColorStop(0.53, "#252a55"); gr.addColorStop(1, "#0c0e1c");
  g.fillStyle = gr; g.fillRect(0, 0, 2048, 1024);
  for (let i = 0; i < 1400; i++) { const y = hash(i, 71) * 460; g.fillStyle = `rgba(255,255,255,${0.2 + hash(i, 72) * 0.7 * (1 - y / 520)})`; g.fillRect(hash(i, 73) * 2048, y, hash(i, 74) < 0.06 ? 2.5 : 1.3, hash(i, 74) < 0.06 ? 2.5 : 1.3); }
  for (let i = 0; i < 14; i++) { const x = hash(i, 75) * 2048, y = 240 + hash(i, 76) * 220; const c = g.createRadialGradient(x, y, 10, x, y, 220); c.addColorStop(0, "rgba(70,70,130,0.18)"); c.addColorStop(1, "rgba(70,70,130,0)"); g.fillStyle = c; g.fillRect(x - 240, y - 240, 480, 480); }
}, true);
/** halo radial doux (flaque de lumière au sol, lueur) */
export const haloTex = () => tx("halo", 256, 256, (g) => { const c = g.createRadialGradient(128, 128, 0, 128, 128, 128); c.addColorStop(0, "rgba(255,255,255,1)"); c.addColorStop(0.35, "rgba(255,255,255,0.45)"); c.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = c; g.fillRect(0, 0, 256, 256); }, false);
