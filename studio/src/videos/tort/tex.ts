// Textures peintes en Canvas2D (déterministes) pour « Le Nuage » : façades vitrées, briques, herbe, terre, pierre, eau, visages.
import * as THREE from "three";

export const hash = (i: number, k = 0) => { const s = Math.sin(i * 127.1 + k * 311.7 + 0.5) * 43758.5453; return s - Math.floor(s); };
const cache = new Map<string, THREE.CanvasTexture>();
export const ctex = (key: string, w: number, h: number, draw: (g: CanvasRenderingContext2D) => void, rep = false) => {
  const c = cache.get(key); if (c) return c;
  const cv = document.createElement("canvas"); cv.width = w; cv.height = h;
  draw(cv.getContext("2d")!);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  if (rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; }
  cache.set(key, t); return t;
};
const noise = (g: CanvasRenderingContext2D, w: number, h: number, n: number, light: string, dark: string, a: number, r: number, seed = 0) => {
  for (let i = 0; i < n; i++) {
    g.fillStyle = `rgba(${hash(i, seed + 1) < 0.5 ? dark : light},${a * (0.4 + hash(i, seed + 2) * 0.6)})`;
    g.beginPath(); g.arc(hash(i, seed + 3) * w, hash(i, seed + 4) * h, r * (0.3 + hash(i, seed + 5)), 0, 7); g.fill();
  }
};

/** façade vitrée : verre dégradé + reflets obliques + montants clairs (+ lisérés dorés optionnels) */
export const glassTex = (glass: string, glass2: string, frame: string, cols: number, rows: number, trim?: string, key = "") =>
  ctex(`glass_${glass}_${frame}_${cols}_${rows}_${trim}_${key}`, 256, 512, (g) => {
    const gr = g.createLinearGradient(0, 0, 256, 512); gr.addColorStop(0, glass2); gr.addColorStop(0.5, glass); gr.addColorStop(1, glass2);
    g.fillStyle = gr; g.fillRect(0, 0, 256, 512);
    for (let i = 0; i < 6; i++) { g.fillStyle = `rgba(255,255,255,${0.08 + hash(i, 9) * 0.12})`; g.beginPath(); const x = hash(i, 8) * 300 - 40; g.moveTo(x, 0); g.lineTo(x + 40, 0); g.lineTo(x - 60, 512); g.lineTo(x - 100, 512); g.fill(); }
    const cw = 256 / cols, rh = 512 / rows;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) if (hash(r * 31 + c, 3) < 0.12) { g.fillStyle = "rgba(20,40,70,0.25)"; g.fillRect(c * cw, r * rh, cw, rh); }
    g.fillStyle = frame;
    for (let c = 0; c <= cols; c++) g.fillRect(c * cw - 3, 0, 6, 512);
    for (let r = 0; r <= rows; r++) g.fillRect(0, r * rh - (trim ? 5 : 3), 256, trim ? 10 : 6);
    if (trim) { g.fillStyle = trim; for (let r = 0; r <= rows; r += 2) g.fillRect(0, r * rh - 2, 256, 4); }
  }, true);

/** façade d'immeuble bas / maison : enduit + fenêtres bleues encadrées de blanc */
export const facadeTex = (wall: string, win: string, cols: number, rows: number, door = false, shutters?: string, key = "") =>
  ctex(`fac_${wall}_${win}_${cols}_${rows}_${door}_${shutters}_${key}`, 256, 256, (g) => {
    g.fillStyle = wall; g.fillRect(0, 0, 256, 256); noise(g, 256, 256, 60, "255,255,255", "0,0,0", 0.05, 14);
    const cw = 256 / cols, rh = 256 / rows;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      if (door && r === rows - 1 && c === Math.floor(cols / 2)) { g.fillStyle = "#f4f1ea"; g.fillRect(c * cw + cw * 0.2, r * rh + rh * 0.15, cw * 0.6, rh * 0.85); g.fillStyle = "#3d7a4a"; g.fillRect(c * cw + cw * 0.27, r * rh + rh * 0.22, cw * 0.46, rh * 0.78); continue; }
      const x = c * cw + cw * 0.22, y = r * rh + rh * 0.2, w = cw * 0.56, h = rh * 0.58;
      g.fillStyle = "#f6f4ee"; g.fillRect(x - 4, y - 4, w + 8, h + 8);
      const wg = g.createLinearGradient(x, y, x + w, y + h); wg.addColorStop(0, "#bfe6ff"); wg.addColorStop(0.5, win); wg.addColorStop(1, "#2c6fb8");
      g.fillStyle = wg; g.fillRect(x, y, w, h); g.fillStyle = "#f6f4ee"; g.fillRect(x + w / 2 - 2, y, 4, h); g.fillRect(x, y + h / 2 - 2, w, 4);
      if (shutters) { g.fillStyle = shutters; g.fillRect(x - 4 - w * 0.28, y - 4, w * 0.26, h + 8); g.fillRect(x + w + 6, y - 4, w * 0.26, h + 8); }
    }
  }, true);

export const brickTex = () => ctex("brick", 256, 256, (g) => {
  g.fillStyle = "#e9e1d6"; g.fillRect(0, 0, 256, 256);
  const bh = 16, bw = 42;
  for (let r = 0; r < 256 / bh; r++) for (let c = -1; c < 256 / bw + 1; c++) {
    const x = c * bw + (r % 2) * bw / 2, k = hash(r * 17 + c, 1);
    g.fillStyle = `rgb(${190 + k * 30},${70 + k * 25},${55 + k * 18})`; g.fillRect(x + 2, r * bh + 2, bw - 4, bh - 4);
  }
}, true);
export const sidingTex = (col: string) => ctex("siding_" + col, 128, 128, (g) => {
  g.fillStyle = col; g.fillRect(0, 0, 128, 128);
  for (let y = 0; y < 128; y += 16) { g.fillStyle = "rgba(0,0,30,0.12)"; g.fillRect(0, y + 13, 128, 3); g.fillStyle = "rgba(255,255,255,0.18)"; g.fillRect(0, y, 128, 2); }
}, true);
export const roofTex = (col: string) => ctex("roof_" + col, 128, 128, (g) => {
  g.fillStyle = col; g.fillRect(0, 0, 128, 128);
  for (let y = 0; y < 128; y += 12) { g.fillStyle = "rgba(0,0,0,0.16)"; g.fillRect(0, y + 9, 128, 3); for (let x = (y / 12) % 2 * 8; x < 128; x += 16) g.fillRect(x, y, 2, 12); }
}, true);
export const grassTex = () => ctex("grass", 256, 256, (g) => {
  g.fillStyle = "#56c93a"; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 2500; i++) { g.fillStyle = `rgba(${hash(i, 1) < 0.5 ? "30,120,20" : "150,230,90"},${0.18 + hash(i, 2) * 0.25})`; g.fillRect(hash(i, 3) * 256, hash(i, 4) * 256, 2, 2 + hash(i, 5) * 3); }
}, true);
export const asphaltTex = () => ctex("asphalt", 128, 128, (g) => { g.fillStyle = "#53565e"; g.fillRect(0, 0, 128, 128); noise(g, 128, 128, 300, "255,255,255", "0,0,0", 0.08, 2); }, true);
export const tileTex = (a: string, line: string, n = 4) => ctex(`tile_${a}_${n}`, 256, 256, (g) => {
  g.fillStyle = a; g.fillRect(0, 0, 256, 256); noise(g, 256, 256, 80, "255,255,255", "120,90,60", 0.06, 10);
  g.strokeStyle = line; g.lineWidth = 3; for (let i = 0; i <= n; i++) { g.beginPath(); g.moveTo(i * 256 / n, 0); g.lineTo(i * 256 / n, 256); g.stroke(); g.beginPath(); g.moveTo(0, i * 256 / n); g.lineTo(256, i * 256 / n); g.stroke(); }
}, true);
/** terre de la coupe : grain fin orangé */
export const soilTex = () => ctex("soil", 256, 256, (g) => {
  g.fillStyle = "#ffffff"; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 3000; i++) { g.fillStyle = `rgba(${hash(i, 7) < 0.5 ? "120,80,40" : "255,240,220"},${0.05 + hash(i, 8) * 0.07})`; g.fillRect(hash(i, 9) * 256, hash(i, 10) * 256, 2, 2); }
}, true);
/** roche rugueuse (plafond des bunkers, parois des grottes) */
export const rockTex = () => ctex("rock", 512, 512, (g) => {
  g.fillStyle = "#d8cdb8"; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 260; i++) { const k = hash(i, 1); g.fillStyle = `rgba(${k < 0.5 ? "110,95,75" : "255,250,240"},${0.06 + hash(i, 2) * 0.08})`; g.beginPath(); g.ellipse(hash(i, 3) * 512, hash(i, 4) * 512, 20 + hash(i, 5) * 60, 14 + hash(i, 6) * 40, hash(i, 7) * 3, 0, 7); g.fill(); }
  for (let i = 0; i < 9000; i++) { g.fillStyle = `rgba(${hash(i, 11) < 0.5 ? "90,75,60" : "255,255,255"},0.12)`; g.fillRect(hash(i, 12) * 512, hash(i, 13) * 512, 2, 2); }
}, true);
/** pierre craquelée (avion, passagers, oiseaux pétrifiés) : dalles irrégulières + fissures noires */
export const stoneTex = () => ctex("stone", 512, 512, (g) => {
  g.fillStyle = "#c9bfae"; g.fillRect(0, 0, 512, 512);
  const P: [number, number][] = []; for (let i = 0; i < 70; i++) P.push([hash(i, 21) * 512, hash(i, 22) * 512]);
  const img = g.getImageData(0, 0, 512, 512), d = img.data;
  for (let y = 0; y < 512; y++) for (let x = 0; x < 512; x++) {
    let a = 1e9, b = 1e9, ai = 0;
    for (let i = 0; i < P.length; i++) for (const ox of [-512, 0, 512]) for (const oy of [-512, 0, 512]) {
      const dx = x - P[i][0] - ox, dy = y - P[i][1] - oy, q = dx * dx + dy * dy; if (q < a) { b = a; a = q; ai = i; } else if (q < b) b = q; }
    const edge = Math.sqrt(b) - Math.sqrt(a), k = (y * 512 + x) * 4, sh = 0.82 + hash(ai, 30) * 0.3 + (hash(x * 7 + y * 13, 31) - 0.5) * 0.12;
    const crack = edge < 2.2 ? 0.25 : edge < 4 ? 0.7 : 1;
    d[k] = 201 * sh * crack; d[k + 1] = 191 * sh * crack; d[k + 2] = 174 * sh * crack;
  }
  g.putImageData(img, 0, 0);
  for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(70,60,50,${0.08 + hash(i, 40) * 0.1})`; g.beginPath(); g.arc(hash(i, 41) * 512, hash(i, 42) * 512, 10 + hash(i, 43) * 40, 0, 7); g.fill(); }
}, true);
/** eau de piscine : bleu clair + vaguelettes blanches */
export const waterTex = () => ctex("water", 256, 256, (g) => {
  g.fillStyle = "#3fb4ea"; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 60; i++) { g.strokeStyle = `rgba(255,255,255,${0.35 + hash(i, 2) * 0.4})`; g.lineWidth = 3 + hash(i, 5) * 4; const y = hash(i, 3) * 256, x = hash(i, 4) * 256, w = 30 + hash(i, 6) * 60;
    g.beginPath(); g.moveTo(x, y); g.bezierCurveTo(x + w * 0.3, y - 8, x + w * 0.6, y + 8, x + w, y); g.stroke(); }
}, true);
/** colonne d'énergie violette (refroidissement) : grain vertical scintillant */
export const energyTex = () => ctex("energy", 128, 512, (g) => {
  g.fillStyle = "#3a1a80"; g.fillRect(0, 0, 128, 512);
  for (let i = 0; i < 1600; i++) { const k = hash(i, 1); g.fillStyle = k < 0.4 ? "rgba(255,255,255,0.8)" : k < 0.75 ? "rgba(190,140,255,0.8)" : "rgba(110,60,220,0.8)"; g.fillRect(hash(i, 2) * 128, hash(i, 3) * 512, 1 + hash(i, 4) * 2, 4 + hash(i, 5) * 14); }
}, true);
export const leafTex = () => ctex("leaf", 128, 128, (g) => {
  g.fillStyle = "#5cbf3c"; g.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 500; i++) { g.fillStyle = `rgba(${hash(i, 1) < 0.5 ? "40,120,30" : "170,240,110"},0.35)`; g.beginPath(); g.arc(hash(i, 2) * 128, hash(i, 3) * 128, 2 + hash(i, 4) * 3, 0, 7); g.fill(); }
}, true);
export const skyTex = () => ctex("sky", 64, 512, (g) => {
  const gr = g.createLinearGradient(0, 0, 0, 512); gr.addColorStop(0, "#3d9df0"); gr.addColorStop(0.6, "#7cc4fa"); gr.addColorStop(1, "#cfeaff"); g.fillStyle = gr; g.fillRect(0, 0, 64, 512);
});
/** panneau de plafond « faux ciel » (manoir) */
export const fakeSkyTex = () => ctex("fakesky", 512, 256, (g) => {
  g.fillStyle = "#9fdcf6"; g.fillRect(0, 0, 512, 256);
  for (let i = 0; i < 14; i++) { g.fillStyle = "rgba(255,255,255,0.85)"; const x = hash(i, 1) * 512, y = hash(i, 2) * 256;
    for (let k = 0; k < 5; k++) { g.beginPath(); g.ellipse(x + k * 16, y + Math.sin(k) * 6, 26, 14, 0, 0, 7); g.fill(); } }
});
/** texte peint sur un panneau */
export const signTex = (key: string, text: string, bg: string, fg: string, w = 1024, h = 192, size = 110) => ctex("sign_" + key, w, h, (g) => {
  g.fillStyle = bg; g.fillRect(0, 0, w, h); g.fillStyle = "rgba(0,0,0,0.12)"; g.fillRect(0, h - 14, w, 14);
  g.font = `900 ${size}px Montserrat, 'DejaVu Sans', sans-serif`; g.textAlign = "center"; g.textBaseline = "middle";
  g.fillStyle = "rgba(0,0,0,0.25)"; g.fillText(text, w / 2 + 5, h / 2 + 7); g.fillStyle = fg; g.fillText(text, w / 2, h / 2);
});
