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
  building(0, 0, 30, 30, 260, richMats[2], { x: 10, y: 24 }, 0, "rich");

  // ---------- mur de la règle 1 : pignon aveugle dans un district (face à une rue, z+) ----------
  const blind = new THREE.MeshLambertMaterial({ color: 0x5a554a });
  const r1 = new THREE.Mesh(new THREE.BoxGeometry(30, 22, 18), [distMats[1], distMats[1], roofMat, roofMat, blind, distMats[1]]);
  r1.position.set(-17, 11, 286); add(r1); add(inked(r1));

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
