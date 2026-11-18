// Monde 3D de « La Couronne » : une seule carte (districts en anneau, second mur, centre riche, dôme, désert irradié).
// Chaque plan est une caméra posée dans cette carte (voir shots.js). Unités : mètres. Origine = centre du dôme.
import * as THREE from "three";

export const INK = 0x050405, TEAL = 0x6fe0d6, GOLD = 0xf2d48a, AMBER = 0xf0b35a;
const R_DOME = 520, R_WALL = 135, R_DIST_IN = 155, R_DIST_OUT = 470, R_CENTRE = 120;
export const MAP = { R_DOME, R_WALL, R_DIST_IN, R_DIST_OUT, R_CENTRE };

export function rnd(i) { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }

// ---------- textures de façade (canvas) ----------
function facadeTex(o) {
  const c = document.createElement("canvas"); c.width = 256; c.height = 512; const g = c.getContext("2d");
  const e = document.createElement("canvas"); e.width = 256; e.height = 512; const q = e.getContext("2d");
  g.fillStyle = o.wall; g.fillRect(0, 0, 256, 512); q.fillStyle = "#000"; q.fillRect(0, 0, 256, 512);
  for (let i = 0; i < 400; i++) { g.fillStyle = `rgba(${rnd(i + o.seed) > 0.5 ? "255,255,255" : "0,0,0"},0.04)`; g.fillRect(rnd(i * 3 + o.seed) * 256, rnd(i * 7 + o.seed) * 512, 18, 18); }
  const cols = o.cols, rows = o.rows, cw = 256 / cols, rh = 512 / rows;
  for (let r = 0; r < rows; r++) for (let k = 0; k < cols; k++) {
    const x = k * cw + cw * 0.22, y = r * rh + rh * 0.25, w = cw * 0.56, h = rh * 0.5, v = rnd(o.seed * 31 + r * 13 + k * 7);
    const lit = v < o.lit;
    g.fillStyle = lit ? o.warm : o.glass; g.fillRect(x, y, w, h);
    g.fillStyle = "rgba(0,0,0,0.45)"; g.fillRect(x, y + h - 3, w, 3);
    if (lit) { q.fillStyle = o.warm; q.fillRect(x, y, w, h); }
    if (o.dirty) {
      const d = rnd(o.seed * 7 + r * 5 + k * 11);
      if (!lit && d < 0.07) { g.fillStyle = "#4a3a28"; g.fillRect(x, y, w, h); g.strokeStyle = "#2a2016"; g.lineWidth = 2; for (let p = 1; p < 4; p++) { g.beginPath(); g.moveTo(x, y + h * p / 4); g.lineTo(x + w, y + h * p / 4 + 2); g.stroke(); } }   // fenêtre condamnée
      else if (d < 0.22) { g.strokeStyle = "rgba(220,225,225,0.75)"; g.lineWidth = 1.2; const cx0 = x + w * rnd(d * 91), cy0 = y + h * rnd(d * 53);   // vitre fissurée
        for (let p = 0; p < 5; p++) { const a = p * 1.3 + d * 9; g.beginPath(); g.moveTo(cx0, cy0); g.lineTo(cx0 + Math.cos(a) * w * 0.6, cy0 + Math.sin(a) * h * 0.6); g.stroke(); } }
      const sg = g.createLinearGradient(0, y + h, 0, y + h + rh * (0.5 + d)); sg.addColorStop(0, "rgba(10,8,5,0.45)"); sg.addColorStop(1, "rgba(10,8,5,0)");   // coulure sous la fenêtre
      g.fillStyle = sg; g.fillRect(x + w * 0.2, y + h, w * (0.25 + d * 0.5), rh * (0.5 + d));
    }
    if (o.trim) { g.fillStyle = o.trim; g.fillRect(0, r * rh + rh - 3, 256, 2); g.fillRect(x - 2, y - 2, w + 4, 2); }   // dorures du centre
  }
  if (o.dirty) { for (let i = 0; i < 18; i++) { const x = rnd(o.seed + i * 3) * 256, sw = 6 + rnd(i * 5 + o.seed) * 20; const sg = g.createLinearGradient(0, 0, 0, 512); sg.addColorStop(0, "rgba(20,16,10,0.0)"); sg.addColorStop(0.5, "rgba(20,16,10,0.22)"); sg.addColorStop(1, "rgba(20,16,10,0.05)"); g.fillStyle = sg; g.fillRect(x, 0, sw, 512); }
    for (let i = 0; i < 6; i++) { g.fillStyle = "rgba(60,70,40,0.18)"; g.beginPath(); g.ellipse(rnd(i * 17 + o.seed) * 256, rnd(i * 29 + o.seed) * 512, 30, 18, 0, 0, 7); g.fill(); } }   // moisissure, taches
  const t = new THREE.CanvasTexture(c), te = new THREE.CanvasTexture(e);
  [t, te].forEach(x => { x.colorSpace = THREE.SRGBColorSpace; x.wrapS = x.wrapT = THREE.RepeatWrapping; x.anisotropy = 4; });
  return [t, te];
}

// béton sombre à panneaux (face pleine de la tour de la règle 2) ; 1 tuile = toute la face
function panelTex() {                                   // tuile de 4 m : banches de 2 m, trous, grain, coulures, éclats
  const c = document.createElement("canvas"); c.width = 1024; c.height = 1024; const g = c.getContext("2d");
  g.fillStyle = "#4a433b"; g.fillRect(0, 0, 1024, 1024);
  for (let i = 0; i < 6000; i++) { g.fillStyle = `rgba(${rnd(i) > 0.5 ? "255,240,220" : "0,0,0"},${0.03 + rnd(i * 11) * 0.05})`; g.fillRect(rnd(i * 3) * 1024, rnd(i * 7) * 1024, 1 + rnd(i * 5) * 6, 1 + rnd(i * 9) * 6); }
  for (let i = 0; i < 14; i++) { const x = rnd(i * 13) * 1024, sg = g.createLinearGradient(0, 0, 0, 1024); sg.addColorStop(0, "rgba(10,8,6,0.35)"); sg.addColorStop(1, "rgba(10,8,6,0)"); g.fillStyle = sg; g.fillRect(x, 0, 6 + rnd(i * 3) * 26, 600 + rnd(i) * 424); }
  g.strokeStyle = "rgba(8,6,4,0.8)"; g.lineWidth = 5;
  [0, 512].forEach(y => { g.beginPath(); g.moveTo(0, y + 2); g.lineTo(1024, y + 2); g.stroke(); }); [0, 512].forEach(x => { g.beginPath(); g.moveTo(x + 2, 0); g.lineTo(x + 2, 1024); g.stroke(); });
  for (let y = 0; y < 1024; y += 512) for (let x = 0; x < 1024; x += 512) { g.fillStyle = "rgba(0,0,0,0.6)"; [[60, 60], [452, 60], [60, 452], [452, 452]].forEach(([a, b]) => { g.beginPath(); g.arc(x + a, y + b, 9, 0, 7); g.fill(); }); }
  g.strokeStyle = "rgba(8,6,4,0.7)"; g.lineWidth = 2; for (let k = 0; k < 3; k++) { let x = 200 + k * 260, y = 300 + k * 120; g.beginPath(); g.moveTo(x, y); for (let p = 0; p < 9; p++) { x += (rnd(k * 9 + p) - 0.5) * 50; y += 18 + rnd(p + k) * 20; g.lineTo(x, y); } g.stroke(); }   // fissures
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(26 / 4, 180 / 4); t.offset.set(0.1, 0.27); return t;
}

// pignon aveugle de la règle 1 : béton de district usé (banches, coulures, mousse, affiches arrachées, tags, ancienne réclame peinte)
function blindTex() {
  const c = document.createElement("canvas"); c.width = 1536; c.height = 1126; const g = c.getContext("2d"), pm = 1536 / 30;
  g.fillStyle = "#5e584c"; g.fillRect(0, 0, 1536, 1126);
  for (let i = 0; i < 9000; i++) { g.fillStyle = `rgba(${rnd(i) > 0.5 ? "255,240,220" : "0,0,0"},${0.03 + rnd(i * 11) * 0.06})`; g.fillRect(rnd(i * 3) * 1536, rnd(i * 7) * 1126, 1 + rnd(i * 5) * 7, 1 + rnd(i * 9) * 7); }
  g.strokeStyle = "rgba(20,16,12,0.3)"; g.lineWidth = 2; for (let y = 0; y < 1126; y += pm * 1.5) { g.beginPath(); g.moveTo(0, y); g.lineTo(1536, y + 2); g.stroke(); }
  for (let x = 0; x < 1536; x += pm * 3) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 1126); g.stroke(); }
  g.save(); g.globalAlpha = 0.22; g.fillStyle = "#c9b48a"; g.fillRect(260, 90, 1000, 230); g.fillStyle = "#7a1f30"; g.font = "900 120px Arial Black, sans-serif"; g.textAlign = "center"; g.fillText("ÉNERGIE POUR TOUS", 760, 250); g.restore();   // vieille réclame peinte, effacée
  for (let i = 0; i < 22; i++) { const x = rnd(i * 13) * 1536, y0 = rnd(i) * 500, hh = 200 + rnd(i * 5) * 500, ww = 6 + rnd(i * 3) * 26, sg = g.createLinearGradient(0, y0, 0, y0 + hh); sg.addColorStop(0, "rgba(14,10,6,0.3)"); sg.addColorStop(1, "rgba(14,10,6,0)"); g.fillStyle = sg; g.beginPath(); g.moveTo(x, y0); g.lineTo(x + ww, y0); g.lineTo(x + ww * 0.6, y0 + hh); g.lineTo(x + ww * 0.3, y0 + hh); g.fill(); }
  const mo = g.createLinearGradient(0, 1126, 0, 900); mo.addColorStop(0, "rgba(40,50,24,0.75)"); mo.addColorStop(1, "rgba(40,50,24,0)"); g.fillStyle = mo; g.fillRect(0, 900, 1536, 226);   // humidité et mousse en bas
  for (let i = 0; i < 26; i++) { const x = 40 + rnd(i * 7) * 1440, y = 950 + rnd(i * 9) * 90, w = 34 + rnd(i) * 20, h = w * 1.4;   // affiches arrachées
    g.fillStyle = ["#d8cfb8", "#c9c2ae", "#a89a80", "#e2d9c0"][i % 4]; g.save(); g.translate(x, y); g.rotate((rnd(i * 3) - 0.5) * 0.15); g.fillRect(0, 0, w, h);
    g.fillStyle = i % 3 ? "#7a1f30" : "#2a2a2a"; g.fillRect(4, 4, w - 8, h * 0.3); g.fillStyle = "rgba(40,30,20,0.6)"; for (let k = 0; k < 4; k++) g.fillRect(5, h * 0.42 + k * 7, w - 12, 3);
    g.fillStyle = "#5e584c"; g.beginPath(); g.moveTo(w, h * 0.5); g.lineTo(w, h); g.lineTo(w * 0.3, h); g.fill(); g.restore(); }
  g.lineCap = "round"; const cols = ["#c0392b", "#d9a441", "#3a8fb7", "#e8e4da", "#6fae5a"];   // tags
  for (let t = 0; t < 7; t++) { const bx = 80 + t * 210 + rnd(t) * 60, by = 1000 + rnd(t * 5) * 60; for (let k = 0; k < 6; k++) { g.strokeStyle = cols[(t + k) % 5]; g.lineWidth = 5 + rnd(t * 9 + k) * 7; g.beginPath(); let x = bx + rnd(t + k) * 80, y = by + rnd(t * 3 + k) * 50; g.moveTo(x, y);
    for (let p = 0; p < 4; p++) { x += (rnd(t * 7 + k + p) - 0.4) * 50; y += (rnd(t * 2 + k + p * 3) - 0.5) * 40; g.quadraticCurveTo(x - 14, y - 20, x, y); } g.stroke(); } }
  g.strokeStyle = "rgba(10,8,6,0.85)"; g.lineWidth = 2.5; for (let k = 0; k < 6; k++) { let x = 120 + rnd(k * 17) * 1300, y = 120 + rnd(k * 23) * 700; g.beginPath(); g.moveTo(x, y); for (let p = 0; p < 12; p++) { x += (rnd(k * 9 + p) - 0.5) * 40; y += 12 + rnd(p + k) * 18; g.lineTo(x, y); } g.stroke(); }   // fissures
  for (let k = 0; k < 5; k++) { g.fillStyle = "#4a443a"; const x = rnd(k * 31) * 1400, y = rnd(k * 37) * 800; g.beginPath(); g.ellipse(x, y, 30 + rnd(k) * 40, 16 + rnd(k * 2) * 20, rnd(k * 3), 0, 7); g.fill(); g.fillStyle = "rgba(160,150,130,0.4)"; g.fillRect(x - 10, y - 4, 16, 6); }   // éclats de béton
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}

// boîte avec UV à l'échelle du bâtiment (1 tuile de texture = tile mètres)
function boxUV(w, h, d, tile) {
  const geo = new THREE.BoxGeometry(w, h, d), uv = geo.attributes.uv, n = geo.attributes.normal;
  for (let i = 0; i < uv.count; i++) {
    const nx = Math.abs(n.getX(i)), ny = Math.abs(n.getY(i));
    const sx = ny > 0.5 ? w : (nx > 0.5 ? d : w), sy = ny > 0.5 ? d : h;
    uv.setXY(i, uv.getX(i) * sx / tile.x, uv.getY(i) * sy / tile.y);
  }
  return geo;
}

// contour d'encre : coque inversée légèrement agrandie, noire, faces arrière
const inkMat = new THREE.MeshBasicMaterial({ color: INK, side: THREE.BackSide });
function inked(mesh, pad = 0.45) {
  const p = mesh.geometry.parameters, o = new THREE.Mesh(new THREE.BoxGeometry(p.width + pad, p.height + pad, p.depth + pad), inkMat);
  o.position.copy(mesh.position); o.rotation.copy(mesh.rotation); return o;
}

export function buildWorld(scene) {
  const add = m => (scene.add(m), m);
  // ---------- sol ----------
  const ground = new THREE.Mesh(new THREE.CircleGeometry(R_DOME + 600, 128), new THREE.MeshLambertMaterial({ color: 0x3a3518 }));
  ground.rotation.x = -Math.PI / 2; add(ground);
  const city = new THREE.Mesh(new THREE.CircleGeometry(R_DOME - 4, 128), new THREE.MeshLambertMaterial({ color: 0x2c3033 }));
  city.rotation.x = -Math.PI / 2; city.position.y = 0.02; add(city);
  const plaza = new THREE.Mesh(new THREE.CircleGeometry(R_WALL, 96), new THREE.MeshLambertMaterial({ color: 0x3a3428 }));
  plaza.rotation.x = -Math.PI / 2; plaza.position.y = 0.04; add(plaza);

  // ---------- matériaux de façade ----------
  const distTex = [0, 1, 2, 3].map(k => facadeTex({ seed: 10 + k, wall: ["#4a4640", "#57503f", "#3f4347", "#5f5a4c"][k], glass: "#1a1d1f", warm: "#f0b35a", cols: 6, rows: 10, lit: 0.18, dirty: true }));
  const richTex = [0, 1, 2].map(k => facadeTex({ seed: 40 + k, wall: ["#3a5262", "#4c6676", "#c9b48a"][k], glass: ["#2b5566", "#365f70", "#6f8a94"][k], warm: "#ffd98a", cols: 6, rows: 12, lit: 0.1, trim: "rgba(242,212,138,0.7)" }));
  const distMats = distTex.map(([t, e]) => new THREE.MeshLambertMaterial({ map: t, emissiveMap: e, emissive: 0xffc070, emissiveIntensity: 1.4 }));
  const richMats = richTex.map(([t, e]) => new THREE.MeshLambertMaterial({ map: t, emissiveMap: e, emissive: 0xffd98a, emissiveIntensity: 1.1 }));
  const roofMat = new THREE.MeshLambertMaterial({ color: 0x2a2c2e });
  const B = [];
  const building = (x, z, w, d, h, mats, tile, rotY = 0, kind = "dist") => {
    B.push({ x, z, w, d, h, kind });
    const geo = boxUV(w, h, d, tile), m = new THREE.Mesh(geo, [mats, mats, roofMat, roofMat, mats, mats]);
    m.position.set(x, h / 2, z); m.rotation.y = rotY; add(m); add(inked(m)); return m;
  };

  // ---------- districts : grille de rues, immeubles bas ----------
  const pitch = 34, lamps = [];
  for (let i = -15; i <= 15; i++) for (let j = -15; j <= 15; j++) {
    const x = i * pitch, z = j * pitch, r = Math.hypot(x, z);
    if (r < R_DIST_IN || r > R_DIST_OUT) continue;
    const s = i * 97 + j * 13, w = 18 + rnd(s) * 7, d = 18 + rnd(s + 1) * 7, h = 9 + rnd(s + 2) * 26;
    if (rnd(s + 5) < 0.06) continue;                                   // terrain vague
    building(x, z, w, d, h, distMats[Math.floor(rnd(s + 3) * 4)], { x: 12, y: 18 });
    if (rnd(s + 7) > 0.8) { const t = new THREE.Mesh(new THREE.CylinderGeometry(2, 2, 4, 10), roofMat); t.position.set(x + 3, h + 2, z - 3); add(t); }
    if (rnd(s + 9) > 0.55) lamps.push([x + pitch / 2, z + (rnd(s) - 0.5) * 20]);
  }

  // ---------- second mur (anneau) avec porte au sud (z+) ----------
  const wallMat = new THREE.MeshLambertMaterial({ color: 0x6a6456 });
  const nSeg = 96;
  for (let k = 0; k < nSeg; k++) {
    const a = k / nSeg * Math.PI * 2;
    if (Math.abs(((a - Math.PI / 2 + Math.PI * 3) % (Math.PI * 2)) - Math.PI) < 0.07) continue;      // ouverture de la porte (angle π/2 = z+)
    const len = 2 * Math.PI * R_WALL / nSeg + 0.6, m = new THREE.Mesh(new THREE.BoxGeometry(len, 28, 4), wallMat);
    m.position.set(Math.cos(a) * R_WALL, 14, Math.sin(a) * R_WALL); m.rotation.y = -a + Math.PI / 2; add(m); add(inked(m, 0.5));
  }
  const topRing = new THREE.Mesh(new THREE.TorusGeometry(R_WALL, 0.5, 6, 160), new THREE.MeshBasicMaterial({ color: 0x9a7e46 }));
  topRing.rotation.x = Math.PI / 2; topRing.position.y = 28.3; add(topRing);
  const gate = new THREE.Mesh(new THREE.BoxGeometry(18, 26, 1.2), new THREE.MeshLambertMaterial({ color: 0x2c2a26 })); gate.position.set(0, 13, R_WALL - 0.5); add(gate); add(inked(gate));   // porte blindée
  for (const dx of [-9.4, 9.4]) { const f = new THREE.Mesh(new THREE.BoxGeometry(0.8, 27, 1.6), new THREE.MeshLambertMaterial({ color: 0x9a7e46, emissive: 0x3a2a10 })); f.position.set(dx, 13.5, R_WALL); add(f); }
  const slit = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 25), new THREE.MeshBasicMaterial({ color: GOLD })); slit.position.set(0, 12.5, R_WALL + 0.15); add(slit);   // fente de lumière dorée
  for (let k = 0; k < 6; k++) { const b = new THREE.Mesh(new THREE.BoxGeometry(17, 0.5, 0.4), new THREE.MeshLambertMaterial({ color: 0x45413a })); b.position.set(0, 3 + k * 4, R_WALL + 0.2); add(b); }

  // ---------- centre : tours riches, jardins, avenues ----------
  const parkMat = new THREE.MeshLambertMaterial({ color: 0x2f5a3a });
  const cp = 30;
  for (let i = -4; i <= 4; i++) for (let j = -4; j <= 4; j++) {
    const x = i * cp, z = j * cp, r = Math.hypot(x, z);
    if (r > R_CENTRE) continue;
    const s = 500 + i * 31 + j * 17;
    if (i === 0 || j === 0) continue;                                  // avenues en croix
    if (rnd(s) < 0.15) { const p = new THREE.Mesh(new THREE.BoxGeometry(24, 0.6, 24), parkMat); p.position.set(x, 0.3, z); add(p);
      for (let t = 0; t < 5; t++) { const tr = new THREE.Mesh(new THREE.SphereGeometry(2.6, 8, 6), new THREE.MeshLambertMaterial({ color: 0x3f7a4a })); tr.position.set(x + (rnd(s + t) - 0.5) * 18, 3.5, z + (rnd(s + t + 9) - 0.5) * 18); add(tr); } continue; }
    const h = 50 + (1 - r / R_CENTRE) * 160 + rnd(s + 1) * 50, w = 15 + rnd(s + 2) * 7;
    const m = building(x, z, w, w, h, richMats[Math.floor(rnd(s + 3) * 3)], { x: 10, y: 24 }, 0, "rich");
    if (rnd(s + 4) > 0.5) { const top = new THREE.Mesh(new THREE.BoxGeometry(w * 0.6, 14, w * 0.6), richMats[2]); top.position.set(x, h + 7, z); add(top); add(inked(top)); }
  }
  // tour de la règle 2 : grande face pleine (pierre claire, sans fenêtre) tournée vers l'avenue sud
  const stone = new THREE.MeshLambertMaterial({ map: panelTex() });
  const r2 = new THREE.Mesh(new THREE.BoxGeometry(26, 180, 26), [richMats[0], richMats[0], roofMat, roofMat, stone, richMats[0]]);
  r2.position.set(0, 90, 48); add(r2); add(inked(r2));
  const glowR2 = new THREE.PointLight(0xff3b2a, 1.6, 7, 1.6); glowR2.position.set(0, 40, 62.5); add(glowR2);   // lueur rouge du néon sur le béton
  // tour centrale
  // tour centrale : grandes baies toutes identiques (4,4 x 5,4 m, croisillon en croix), 5 par face et par étage, étages de 7,8 m
  const bigWin = (emis) => { const c = document.createElement("canvas"); c.width = 600; c.height = 624; const g = c.getContext("2d");
    g.fillStyle = emis ? "#000" : "#b8a888"; g.fillRect(0, 0, 600, 624);
    if (!emis) { g.fillStyle = "#c9b48a"; for (let f = 0; f < 4; f++) g.fillRect(0, f * 156 + 150, 600, 6); }                           // corniches dorées d'étage
    for (let f = 0; f < 4; f++) for (let b = 0; b < 5; b++) { const x = b * 120 + 16, y = f * 156 + 24, lit = rnd(f * 17 + b * 5 + 3) < 0.35;
      if (emis) { if (lit) { g.fillStyle = "#ffd98a"; g.fillRect(x + 6, y + 6, 76, 96); } continue; }
      const gr = g.createLinearGradient(x, y, x + 88, y + 108); if (lit) { gr.addColorStop(0, "#ffe2a0"); gr.addColorStop(1, "#c07a3a"); } else { gr.addColorStop(0, "#3a5a6a"); gr.addColorStop(1, "#14242e"); }
      g.fillStyle = gr; g.fillRect(x, y, 88, 108);
      if (lit) { g.fillStyle = "#6a0f1c"; g.fillRect(x + 4, y + 4, 10, 100); g.fillRect(x + 74, y + 4, 10, 100); }
      g.strokeStyle = "#1a1612"; g.lineWidth = 6; g.strokeRect(x, y, 88, 108); g.lineWidth = 4; g.beginPath(); g.moveTo(x + 44, y); g.lineTo(x + 44, y + 108); g.moveTo(x, y + 54); g.lineTo(x + 88, y + 54); g.stroke(); }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; return t; };
  const towerMat = new THREE.MeshLambertMaterial({ map: bigWin(false), emissiveMap: bigWin(true), emissive: 0xffd98a, emissiveIntensity: 0.55 });
  building(0, 0, 30, 30, 260, towerMat, { x: 30, y: 31.2 }, 0, "rich");

  // ---------- mur de la règle 1 : pignon aveugle dans un district (face à une rue, z+) ----------
  const blind = new THREE.MeshLambertMaterial({ map: blindTex() });
  const r1 = new THREE.Mesh(new THREE.BoxGeometry(30, 22, 18), [distMats[1], distMats[1], roofMat, roofMat, blind, distMats[1]]);
  r1.position.set(-17, 11, 286); add(r1); add(inked(r1));
  // détails autour de la règle 1 : gouttière, applique lumineuse, climatiseurs, escalier de secours, câbles
  const zF = 295, dark = new THREE.MeshLambertMaterial({ color: 0x2a2724 }), rust = new THREE.MeshLambertMaterial({ color: 0x5a3a26 });
  const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 22, 8), rust); pipe.position.set(-17 - 12.5, 11, zF + 0.25); add(pipe);
  for (let y = 2; y < 22; y += 3) { const c = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.12, 0.4), dark); c.position.set(-17 - 12.5, y, zF + 0.15); add(c); }
  const lampArm = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 1.2), dark); lampArm.position.set(-17, 12.6, zF + 0.6); add(lampArm);
  const lampHead = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.55, 0.4, 12), dark); lampHead.position.set(-17, 12.5, zF + 1.2); add(lampHead);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffd9a0 })); bulb.position.set(-17, 12.25, zF + 1.2); add(bulb);
  const wl = new THREE.SpotLight(0xffc890, 40, 16, 0.9, 0.6, 1.2); wl.position.set(-17, 12.2, zF + 1.2); wl.target.position.set(-17, 4, zF); add(wl); add(wl.target);   // applique au-dessus de la règle
  for (const [x, y] of [[-17 + 8.5, 15.5], [-17 + 10.5, 15.5], [-17 - 8, 17.5]]) { const ac = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1, 0.8), new THREE.MeshLambertMaterial({ color: 0x77736a })); ac.position.set(x, y, zF + 0.4); add(ac); add(inked(ac, 0.12));
    const grill = new THREE.Mesh(new THREE.CircleGeometry(0.35, 14), dark); grill.position.set(x, y, zF + 0.81); add(grill);
    const drip = new THREE.Mesh(new THREE.PlaneGeometry(0.25, y - 1), new THREE.MeshBasicMaterial({ color: 0x1a1612, transparent: true, opacity: 0.35 })); drip.position.set(x, (y - 0.5) / 2, zF + 0.03); add(drip); }
  // escalier de secours métallique sur la gauche
  for (let k = 0; k < 4; k++) { const y = 4 + k * 4.5, pl = new THREE.Mesh(new THREE.BoxGeometry(4, 0.12, 1.4), dark); pl.position.set(-17 - 8.5, y, zF + 0.75); add(pl);
    const rail = new THREE.Mesh(new THREE.BoxGeometry(4, 0.06, 0.06), dark); rail.position.set(-17 - 8.5, y + 1, zF + 1.45); add(rail);
    for (const dx of [-2, 0, 2]) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1, 0.06), dark); b.position.set(-17 - 8.5 + dx, y + 0.5, zF + 1.45); add(b); }
    if (k < 3) { const st = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.08, 5.6), dark); st.position.set(-17 - 8.5 + (k % 2 ? 1.2 : -1.2), y + 2.25, zF + 0.75); st.rotation.x = Math.PI / 2 - 0.9; st.rotation.z = 0; add(st); } }
  const cab = []; for (let k = 0; k < 3; k++) { const y0 = 18 + k * 0.9; for (let p = 0; p < 16; p++) { const t0 = p / 16, t1 = (p + 1) / 16, sag = t => -Math.sin(t * Math.PI) * (1.2 + k * 0.3);
    cab.push(-17 - 15 + t0 * 30, y0 + sag(t0), zF + 0.5 + t0 * 10, -17 - 15 + t1 * 30, y0 + sag(t1), zF + 0.5 + t1 * 10); } }
  const cg = new THREE.BufferGeometry(); cg.setAttribute("position", new THREE.Float32BufferAttribute(cab, 3)); add(new THREE.LineSegments(cg, new THREE.LineBasicMaterial({ color: 0x050405 })));

  // ---------- lampadaires (points lumineux) ----------
  const lampMat = new THREE.MeshBasicMaterial({ color: AMBER });
  lamps.forEach(([x, z]) => { const p = new THREE.Mesh(new THREE.BoxGeometry(0.4, 7, 0.4), roofMat); p.position.set(x, 3.5, z); add(p);
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.7, 8, 6), lampMat); b.position.set(x, 7.2, z); add(b); });

  // ---------- dôme holographique ----------
  const domeGeo = new THREE.SphereGeometry(R_DOME, 96, 48, 0, Math.PI * 2, 0, Math.PI / 2);
  add(new THREE.Mesh(domeGeo, new THREE.MeshBasicMaterial({ color: TEAL, transparent: true, opacity: 0.05, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending })));
  const hex = new THREE.IcosahedronGeometry(R_DOME + 1, 12), pos = hex.attributes.position;
  for (let i = 0; i < pos.count; i++) if (pos.getY(i) < -2) pos.setY(i, -2);
  add(new THREE.LineSegments(new THREE.WireframeGeometry(hex), new THREE.LineBasicMaterial({ color: TEAL, transparent: true, opacity: 0.28, blending: THREE.AdditiveBlending, depthWrite: false })));
  const rim = new THREE.Mesh(new THREE.TorusGeometry(R_DOME, 1.6, 8, 160), new THREE.MeshBasicMaterial({ color: TEAL }));
  rim.rotation.x = Math.PI / 2; rim.position.y = 1; add(rim);

  // ---------- lumière ----------
  add(new THREE.HemisphereLight(0x8fb0c0, 0x2a2018, 2.4));
  add(new THREE.AmbientLight(0x4a5560, 1.0));
  const moon = new THREE.DirectionalLight(0xa9cad6, 1.8); moon.position.set(-300, 500, 200); add(moon);
  const gold = new THREE.PointLight(0xffc870, 1.2, 400, 1.2); gold.position.set(0, 120, 0); add(gold);
  scene.background = new THREE.Color(0x070b0e);
  scene.fog = new THREE.FogExp2(0x0b1418, 0.0014);
  return { r1, r2, B, lamps, distMats, richMats, roofMat };
}

// panneau néon rouge (texture) posé sur une face plate
export function neonSign(lines, w = 1024, h = 512) {
  const c = document.createElement("canvas"); c.width = w; c.height = h; const g = c.getContext("2d");
  g.fillStyle = "rgba(10,6,6,0.0)"; g.fillRect(0, 0, w, h);
  g.strokeStyle = "#ff3b2a"; g.lineWidth = 14; g.shadowColor = "rgba(255,40,30,1)"; g.shadowBlur = 40; g.strokeRect(30, 30, w - 60, h - 60);
  lines.forEach(([t, font, y]) => { g.font = font; g.textAlign = "center"; g.fillStyle = "#ff6a58"; g.shadowBlur = 50; g.fillText(t, w / 2, y); g.shadowBlur = 12; g.fillText(t, w / 2, y); });
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
