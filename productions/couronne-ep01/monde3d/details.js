// Détails de vie du monde : passants (sprites dans le style des personnages), saleté et objets des districts,
// mobilier et objets du centre riche, abords du second mur. Tout est déterministe (rnd).
import * as THREE from "three";
import { rnd, MAP, GOLD } from "./world.js";

const cv = (w, h, f) => { const c = document.createElement("canvas"); c.width = w; c.height = h; f(c.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; };
const INK = "#050405";

// ---------- passants : tête blanche cerclée de noir, deux points, corps de couleur, contour noir (comme les héros) ----------
function personTex(body, hat, seed, guard) {
  return cv(128, 320, (g) => {
    g.lineJoin = "round"; g.strokeStyle = INK; g.lineWidth = 6;
    const lean = (rnd(seed) - 0.5) * 6;
    g.fillStyle = "#1c1d20"; g.beginPath(); g.roundRect(44 + lean, 205, 16, 108, 6); g.fill(); g.stroke(); g.beginPath(); g.roundRect(68 + lean, 205, 16, 108, 6); g.fill(); g.stroke();   // jambes
    g.fillStyle = body; g.beginPath(); g.roundRect(30, 110, 68, 110, 20); g.fill(); g.stroke();                     // corps
    g.beginPath(); g.roundRect(18, 118, 16, 84, 8); g.fill(); g.stroke(); g.beginPath(); g.roundRect(94, 118, 16, 84, 8); g.fill(); g.stroke();   // bras
    g.fillStyle = "#f6f3ec"; g.beginPath(); g.arc(64, 66, 40, 0, 7); g.fill(); g.stroke();                      // tête
    g.fillStyle = INK; g.beginPath(); g.arc(50, 70, 4.5, 0, 7); g.arc(78, 70, 4.5, 0, 7); g.fill();
    if (guard) { g.fillStyle = "#15171a"; g.beginPath(); g.arc(64, 60, 41, Math.PI, 0); g.fill(); g.stroke(); g.fillRect(20, 54, 88, 8); }
    else if (hat === "hair") { g.fillStyle = ["#1a1612", "#3a2c20", "#6a6258"][Math.floor(rnd(seed * 3) * 3)]; g.beginPath(); g.arc(64, 62, 41, Math.PI * 1.05, Math.PI * 1.95); g.fill(); }
    else if (hat) { g.fillStyle = hat; g.beginPath(); g.arc(64, 60, 41, Math.PI, 0); g.closePath(); g.fill(); g.stroke(); g.fillRect(22, 52, 84, 12); g.strokeRect(22, 52, 84, 12); }
  });
}
const DIST_BODY = ["#3a3f44", "#4a4640", "#55524c", "#4a3e32", "#3d4848", "#5a5048", "#33373a"];
const DIST_HAT = ["hair", "hair", "#3a3a32", "#4a2e2a", null, "#2e3a3e"];
const RICH_BODY = ["#e8e2d4", "#c9b48a", "#2b4a5a", "#7a1f30", "#1a1a1c", "#d7c9a7", "#3c5566"];
const RICH_HAT = ["hair", "hair", null, "#c9b48a", "hair"];
function people(kind) {
  const body = kind === "rich" ? RICH_BODY : DIST_BODY, hat = kind === "rich" ? RICH_HAT : DIST_HAT, tint = kind === "rich" ? 0xe6dfd2 : 0xb8bcc0;
  return Array.from({ length: 10 }, (_, i) => new THREE.SpriteMaterial({ map: personTex(body[i % body.length], hat[i % hat.length], i + (kind === "rich" ? 50 : 0)), color: tint, alphaTest: 0.5, fog: true }));
}

// ---------- textures de décor ----------
const posterTex = (seed) => cv(128, 180, (g) => {
  g.fillStyle = ["#d8cfb8", "#c9c2ae", "#e2d9c0"][seed % 3]; g.fillRect(0, 0, 128, 180);
  g.fillStyle = seed % 2 ? "#7a1f30" : "#2a2a2a"; g.fillRect(10, 10, 108, 46);
  g.fillStyle = "#f3efe6"; g.font = "900 30px Arial Black, sans-serif"; g.textAlign = "center"; g.fillText(["72 H", "AVIS", "CONSEIL", "COUPURE"][seed % 4], 64, 44);
  g.fillStyle = "rgba(40,30,20,0.7)"; for (let k = 0; k < 7; k++) g.fillRect(16, 70 + k * 14, 96 - (k % 3) * 18, 6);
  g.fillStyle = "rgba(60,40,20,0.35)"; g.beginPath(); g.moveTo(128, 120); g.lineTo(128, 180); g.lineTo(70, 180); g.fill();   // coin arraché
});
const graffTex = (seed) => cv(256, 128, (g) => {
  g.lineCap = "round"; const cols = ["#c0392b", "#d9a441", "#3a8fb7", "#e8e4da", "#6fae5a"];
  for (let k = 0; k < 9; k++) { g.strokeStyle = cols[Math.floor(rnd(seed * 7 + k) * 5)]; g.lineWidth = 6 + rnd(seed + k) * 10; g.beginPath();
    let x = 20 + rnd(seed * 3 + k) * 200, y = 30 + rnd(seed * 5 + k) * 70; g.moveTo(x, y);
    for (let p = 0; p < 4; p++) { x += (rnd(seed + k * 9 + p) - 0.4) * 70; y += (rnd(seed * 2 + k + p * 3) - 0.5) * 60; g.quadraticCurveTo(x - 20, y - 30, x, y); } g.stroke(); }
});
const grimeTex = cv(64, 256, (g) => { const gr = g.createLinearGradient(0, 256, 0, 0); gr.addColorStop(0, "rgba(14,11,8,0.75)"); gr.addColorStop(0.4, "rgba(14,11,8,0.3)"); gr.addColorStop(1, "rgba(14,11,8,0)"); g.fillStyle = gr; g.fillRect(0, 0, 64, 256);
  for (let i = 0; i < 30; i++) { g.fillStyle = "rgba(14,11,8,0.25)"; g.fillRect(rnd(i) * 64, 120 + rnd(i * 3) * 136, 3, 40 + rnd(i * 5) * 80); } });
const crackTex = cv(256, 256, (g) => { g.strokeStyle = "rgba(10,8,6,0.85)"; g.lineWidth = 2.5;
  for (let k = 0; k < 4; k++) { let x = 128, y = 128; g.beginPath(); g.moveTo(x, y); for (let p = 0; p < 7; p++) { x += Math.cos(k * 1.7 + p * 0.5) * 18 + (rnd(k * 9 + p) - 0.5) * 20; y += Math.sin(k * 1.7 + p * 0.4) * 18; g.lineTo(x, y); } g.stroke(); } });
const adTex = (t1, t2, col) => cv(256, 512, (g) => { g.fillStyle = "#06090c"; g.fillRect(0, 0, 256, 512); g.strokeStyle = col; g.lineWidth = 8; g.strokeRect(10, 10, 236, 492);
  g.fillStyle = col; g.font = "900 54px Arial Black, sans-serif"; g.textAlign = "center"; g.fillText(t1, 128, 210); g.font = "700 30px Arial, sans-serif"; g.fillText(t2, 128, 270);
  g.beginPath(); g.moveTo(80, 380); g.lineTo(100, 330); g.lineTo(128, 370); g.lineTo(156, 330); g.lineTo(176, 380); g.closePath(); g.fill(); });   // couronne
const bannerTex = cv(64, 512, (g) => { g.fillStyle = "#6a1626"; g.fillRect(0, 0, 64, 512); g.fillStyle = "#f2d48a"; g.fillRect(0, 0, 64, 10); g.fillRect(0, 502, 64, 10);
  g.beginPath(); g.moveTo(14, 120); g.lineTo(20, 90); g.lineTo(32, 110); g.lineTo(44, 90); g.lineTo(50, 120); g.closePath(); g.fill(); });

export function addDetails(scene, W) {
  const add = m => (scene.add(m), m);
  const lam = c => new THREE.MeshLambertMaterial({ color: c });
  const { R_DIST_IN, R_DIST_OUT, R_CENTRE, R_WALL } = MAP;
  const pDist = people("dist"), pRich = people("rich"), pGuard = new THREE.SpriteMaterial({ map: personTex("#6c7076", null, 99, true), color: 0xb8bcc0, alphaTest: 0.5, fog: true });
  const walkers = [];
  const person = (x, z, mats, s, dir) => { if (Math.hypot(x + 17, z - 305) < 26) return null; /* rue de la règle 1 vide */ const sp = new THREE.Sprite(mats[Math.floor(rnd(s) * mats.length)]); sp.center.set(0.5, 0); const h = 1.65 + rnd(s * 3) * 0.25; sp.scale.set(h * 0.4, h, 1); sp.position.set(x, 0.05, z); add(sp);
    if (dir && rnd(s * 29) < 0.75) { const sg = rnd(s * 31) < 0.5 ? -1 : 1; walkers.push({ sp, x, z, dx: dir[0] * sg, dz: dir[1] * sg, v: 0.8 + rnd(s * 37) * 0.7, ph: rnd(s * 41) * 6.28, h }); }   // passant qui marche
    return sp; };
  const inDist = (x, z) => { const r = Math.hypot(x, z); return r > R_DIST_IN + 6 && r < R_DIST_OUT - 6; };
  const inCentre = (x, z) => Math.hypot(x, z) < R_CENTRE - 4;

  // ---------- passants ----------
  for (let k = -14; k <= 14; k++) for (let t = -470; t <= 470; t += 6) for (const side of [-5.5, 5.5]) for (const axis of [0, 1]) {
    const c = k * 34 + 17 + side + (rnd(k * 3 + t) - 0.5) * 2, x = axis ? c : t, z = axis ? t : c, s = k * 1000 + t * 7 + side * 3 + axis * 11;
    if (inDist(x, z) && rnd(s) < 0.45) { const d = axis ? [0, 1] : [1, 0]; person(x, z, pDist, s, d); if (rnd(s * 7) < 0.25) person(x + 0.7 * d[1], z + 0.7 * d[0], pDist, s + 1, d); }   // seuls ou par deux
    if (inDist(x, z) && side > 0 && rnd(s * 13) < 0.06) person(axis ? c - 5.5 + (rnd(s * 17) - 0.5) * 6 : x, axis ? z : c - 5.5 + (rnd(s * 17) - 0.5) * 6, pDist, s + 2, axis ? [1, 0] : [0, 1]);   // traverse la rue
  }
  for (let k = -4; k <= 4; k++) for (let t = -116; t <= 116; t += 4) for (const side of [-6, 6]) for (const axis of [0, 1]) {
    const base = k === 0 ? 0 : k * 30 - Math.sign(k) * 15, c = base + side + (rnd(k + t) - 0.5) * 2, x = axis ? c : t, z = axis ? t : c, s = 9000 + k * 500 + t * 7 + side + axis * 13;
    if (inCentre(x, z) && rnd(s) < 0.6) person(x, z, rnd(s * 5) < 0.06 ? [pGuard] : pRich, s, axis ? [0, 1] : [1, 0]);
  }

  // ---------- districts : saleté sur les façades, affiches, tags, climatiseurs, tuyaux, poubelles, épaves, flaques, câbles ----------
  const grimeM = new THREE.MeshBasicMaterial({ map: grimeTex, transparent: true, depthWrite: false, fog: true });
  const crackM = new THREE.MeshBasicMaterial({ map: crackTex, transparent: true, depthWrite: false, fog: true });
  const posterM = [0, 1, 2, 3, 4, 5].map(i => new THREE.MeshLambertMaterial({ map: posterTex(i), transparent: true }));
  const graffM = [0, 1, 2, 3, 4, 5, 6].map(i => new THREE.MeshLambertMaterial({ map: graffTex(i + 1), transparent: true, depthWrite: false }));
  const acM = lam(0x6a6a62), pipeM = lam(0x3a3630), binM = lam(0x2e3a2c), crateM = lam(0x5a4630), rustM = lam(0x5a3a28), carM = [lam(0x4a4a44), lam(0x5a3a30), lam(0x34404a)];
  const puddleM = new THREE.MeshBasicMaterial({ color: 0x2a3a44, transparent: true, opacity: 0.55 });
  const acG = new THREE.BoxGeometry(1, 0.7, 0.6), binG = new THREE.CylinderGeometry(0.4, 0.35, 1.1, 10), crateG = new THREE.BoxGeometry(0.9, 0.7, 0.9);
  const faces = (b) => [[0, b.d / 2, 0, b.w], [0, -b.d / 2, Math.PI, b.w], [b.w / 2, 0, Math.PI / 2, b.d], [-b.w / 2, 0, -Math.PI / 2, b.d]];
  const onFace = (b, f, u, y, geo, mat, off = 0.06) => { const [fx, fz, ry] = f, m = new THREE.Mesh(geo, mat), nx = Math.sin(ry), nz = Math.cos(ry);
    m.position.set(b.x + fx + nx * off + Math.cos(ry) * u, y, b.z + fz + nz * off - Math.sin(ry) * u); m.rotation.y = ry; add(m); return m; };
  const cables = [];
  W.B.filter(b => b.kind === "dist").forEach((b, i) => {
    const s = i * 37 + 3;
    faces(b).forEach((f, k) => {
      const len = f[3], ss = s + k * 101;
      onFace(b, f, (rnd(ss) - 0.5) * len * 0.6, Math.min(b.h, 14) / 2, new THREE.PlaneGeometry(len * (0.3 + rnd(ss + 1) * 0.4), Math.min(b.h, 14)), grimeM, 0.04);   // crasse depuis le sol
      if (rnd(ss + 2) < 0.55) onFace(b, f, (rnd(ss + 3) - 0.5) * len * 0.7, 1.6 + rnd(ss + 4) * 0.8, new THREE.PlaneGeometry(0.8, 1.15), posterM[Math.floor(rnd(ss + 5) * 6)], 0.07);
      if (rnd(ss + 6) < 0.5) onFace(b, f, (rnd(ss + 7) - 0.5) * len * 0.5, 1.3, new THREE.PlaneGeometry(3.4, 1.7), graffM[Math.floor(rnd(ss + 8) * 7)], 0.08);
      if (rnd(ss + 9) < 0.5) onFace(b, f, (rnd(ss + 10) - 0.5) * len * 0.6, 3 + rnd(ss + 11) * 6, new THREE.PlaneGeometry(4, 4), crackM, 0.09);
      for (let a = 0; a < 3; a++) if (rnd(ss + 20 + a) < 0.45) onFace(b, f, (rnd(ss + 30 + a) - 0.5) * len * 0.8, 4 + rnd(ss + 40 + a) * (b.h - 5), acG, acM, 0.35);
      if (rnd(ss + 12) < 0.4) { const m = onFace(b, f, len / 2 - 0.6, b.h / 2, new THREE.CylinderGeometry(0.12, 0.12, b.h, 6), pipeM, 0.2); }
    });
    const cx = b.x + b.w / 2 + 3, cz = b.z + b.d / 2 + 3;                                  // coin de rue
    if (rnd(s + 50) < 0.6) for (let k = 0; k < 2 + Math.floor(rnd(s + 51) * 3); k++) { const m = new THREE.Mesh(binG, binM); m.position.set(cx + k * 0.9, 0.55, cz - 1 + rnd(s + k) * 0.6); m.rotation.z = rnd(s + k * 3) < 0.15 ? 1.4 : 0; add(m); }
    if (rnd(s + 52) < 0.5) for (let k = 0; k < 3; k++) { const m = new THREE.Mesh(crateG, crateM); m.position.set(b.x - b.w / 2 - 2.5 + rnd(s + k) * 1.5, 0.35 + (k === 2 ? 0.7 : 0), b.z + b.d / 2 + 2 + k * 0.5); m.rotation.y = rnd(s + k * 7); add(m); }
    if (rnd(s + 53) < 0.35) { const car = new THREE.Group(), m = carM[Math.floor(rnd(s + 54) * 3)];                              // vieille voiture garée
      const body = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.8, 4.2), m); body.position.y = 0.6; const cab = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.6, 2.2), m); cab.position.set(0, 1.25, -0.2);
      car.add(body, cab); if (rnd(s + 55) < 0.4) { const r = new THREE.Mesh(new THREE.BoxGeometry(1.82, 0.3, 1.2), rustM); r.position.set(0, 0.55, 1.4); car.add(r); }
      car.position.set(b.x + b.w / 2 + 7.5, 0, b.z + (rnd(s + 56) - 0.5) * b.d); car.rotation.y = (rnd(s + 57) - 0.5) * 0.2; add(car); }
    if (rnd(s + 58) < 0.5) { const p = new THREE.Mesh(new THREE.CircleGeometry(1.5 + rnd(s + 59) * 2.5, 16), puddleM); p.rotation.x = -Math.PI / 2; p.scale.set(1.6, 1, 1); p.position.set(b.x + b.w / 2 + 3 + rnd(s + 60) * 10, 0.06, b.z + (rnd(s + 61) - 0.5) * b.d); add(p); }
    if (rnd(s + 62) < 0.45) { const y0 = Math.min(b.h, 12) * (0.6 + rnd(s + 63) * 0.3), z0 = b.z + (rnd(s + 64) - 0.5) * b.d;          // câbles en travers de la rue
      for (let p = 0; p < 12; p++) { const t0 = p / 12, t1 = (p + 1) / 12, sag = t => -Math.sin(t * Math.PI) * 1.4;
        cables.push(b.x + b.w / 2 + t0 * 14, y0 + sag(t0), z0, b.x + b.w / 2 + t1 * 14, y0 + sag(t1), z0 + 0.3); } }
  });
  const cg = new THREE.BufferGeometry(); cg.setAttribute("position", new THREE.Float32BufferAttribute(cables, 3));
  add(new THREE.LineSegments(cg, new THREE.LineBasicMaterial({ color: 0x050405 })));
  // lampadaires cassés / clignotants : déjà dans world (lamps) ; on ajoute des enseignes de boutiques au rez-de-chaussée
  const shopM = [0xb84a2a, 0x2a7a8a, 0x8a7a2a].map(c => new THREE.MeshBasicMaterial({ color: c }));
  W.B.filter(b => b.kind === "dist").forEach((b, i) => { if (rnd(i * 13 + 7) < 0.3) onFace(b, faces(b)[Math.floor(rnd(i * 5) * 4)], 0, 3.2, new THREE.PlaneGeometry(4, 0.7), shopM[i % 3], 0.1); });

  // ---------- centre : arbres en bac, bancs, lampadaires dorés, voitures de luxe, terrasses, bannières, publicités ----------
  const goldM = new THREE.MeshLambertMaterial({ color: 0xc9a65a, emissive: 0x4a3410 }), bulbM = new THREE.MeshBasicMaterial({ color: GOLD });
  const potM = lam(0xd8cfb8), leafM = lam(0x3f7a4a), benchM = lam(0x6a4a30), whiteM = lam(0xe8e4da), blackM = lam(0x141416), umbM = [lam(0xe8e2d4), lam(0x7a1f30)];
  const potG = new THREE.CylinderGeometry(0.9, 0.8, 0.9, 12), crownG = new THREE.SphereGeometry(1.8, 10, 8), trunkG = new THREE.CylinderGeometry(0.15, 0.2, 2.4, 6);
  for (let k = -4; k <= 4; k++) for (let t = -114; t <= 114; t += 10) for (const side of [-8.5, 8.5]) for (const axis of [0, 1]) {
    const base = k === 0 ? 0 : k * 30 - Math.sign(k) * 15, c = base + side, x = axis ? c : t, z = axis ? t : c, s = 20000 + k * 300 + t * 3 + side + axis * 17;
    if (!inCentre(x, z)) continue;
    const u = rnd(s);
    if (u < 0.35) { const p = new THREE.Mesh(potG, potM); p.position.set(x, 0.45, z); add(p); const tr = new THREE.Mesh(trunkG, benchM); tr.position.set(x, 1.6, z); add(tr); const cr = new THREE.Mesh(crownG, leafM); cr.position.set(x, 3.6, z); add(cr); }
    else if (u < 0.6) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 5, 6), goldM); p.position.set(x, 2.5, z); add(p); const bl = new THREE.Mesh(new THREE.SphereGeometry(0.35, 8, 6), bulbM); bl.position.set(x, 5.1, z); add(bl); }
    else if (u < 0.72) { const bn = new THREE.Mesh(new THREE.BoxGeometry(axis ? 0.6 : 2, 0.5, axis ? 2 : 0.6), benchM); bn.position.set(x, 0.45, z); add(bn); }
    else if (u < 0.82) { const tb = new THREE.Group(); const top = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.06, 12), whiteM); top.position.y = 0.75; const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.75, 6), blackM); leg.position.y = 0.37;
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.4, 6), blackM); pole.position.y = 1.2; const umb = new THREE.Mesh(new THREE.ConeGeometry(1.4, 0.6, 8), umbM[Math.floor(rnd(s * 3) * 2)]); umb.position.y = 2.5;
      tb.add(top, leg, pole, umb); tb.position.set(x, 0, z); add(tb); }
    else { const car = new THREE.Group(), m = [whiteM, blackM, goldM][Math.floor(rnd(s * 7) * 3)];
      const body = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.6, 4.8), m); body.position.y = 0.55; const cab = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.45, 2.2), blackM); cab.position.set(0, 1.05, -0.3);
      car.add(body, cab); car.position.set(axis ? x + Math.sign(side) * 2.5 : x, 0, axis ? z : z + Math.sign(side) * 2.5); car.rotation.y = axis ? 0 : Math.PI / 2; add(car); }
  }
  const banM = new THREE.MeshLambertMaterial({ map: bannerTex, emissive: 0x2a0a10 });
  const ads = [adTex("LA", "COURONNE", "#f2d48a"), adTex("72 H", "CENTRE PROTÉGÉ", "#6fe0d6"), adTex("CONSEIL", "ORDRE · ÉNERGIE", "#ff7a5a")].map(t => new THREE.MeshBasicMaterial({ map: t }));
  W.B.filter(b => b.kind === "rich").forEach((b, i) => {
    faces(b).forEach((f, k) => { const s = i * 71 + k * 13;
      if (rnd(s) < 0.3) for (const u of [-0.3, 0.3]) onFace(b, f, u * f[3], 12, new THREE.PlaneGeometry(1.6, 14), banM, 0.15);
      else if (rnd(s + 1) < 0.18) onFace(b, f, 0, 18 + rnd(s + 2) * 20, new THREE.PlaneGeometry(6, 12), ads[Math.floor(rnd(s + 3) * 3)], 0.15);
      onFace(b, f, 0, 4, new THREE.BoxGeometry(f[3] * 0.9, 0.3, 2.2), goldM, 1.1);                   // marquise dorée du rez-de-chaussée
    });
  });
  const fountain = new THREE.Group(); const basin = new THREE.Mesh(new THREE.CylinderGeometry(6, 6.4, 0.8, 24), potM); basin.position.y = 0.4;
  const water = new THREE.Mesh(new THREE.CircleGeometry(5.6, 24), new THREE.MeshBasicMaterial({ color: 0x6fc8d0 })); water.rotation.x = -Math.PI / 2; water.position.y = 0.82;
  const statue = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.9, 5, 10), goldM); statue.position.y = 3;
  fountain.add(basin, water, statue); fountain.position.set(0, 0, 70); add(fountain);

  // ---------- second mur, côté districts : tags, affiches, barbelés, guérites, gardes, projecteurs, file d'attente ----------
  const wallFace = (a, y, geo, mat, off = 2.2) => { const m = new THREE.Mesh(geo, mat); m.position.set(Math.cos(a) * (R_WALL + off), y, Math.sin(a) * (R_WALL + off)); m.rotation.y = Math.atan2(Math.cos(a), Math.sin(a)); add(m); return m; };
  for (let k = 0; k < 140; k++) { const a = Math.PI / 2 + (rnd(k) - 0.5) * 1.6; if (Math.abs(a - Math.PI / 2) < 0.08) continue;
    const u = rnd(k * 3);
    if (u < 0.45) wallFace(a, 1.4, new THREE.PlaneGeometry(3.4, 1.7), graffM[k % 7]);
    else if (u < 0.75) wallFace(a, 1.8 + rnd(k * 5), new THREE.PlaneGeometry(0.8, 1.15), posterM[k % 6], 2.15);
    else wallFace(a, 6 + rnd(k * 7) * 12, new THREE.PlaneGeometry(5, 5), crackM, 2.1); }
  for (let k = 0; k < 40; k++) { const a = Math.PI / 2 + (rnd(k * 9) - 0.5) * 1.6; wallFace(a, 7, new THREE.PlaneGeometry(4 + rnd(k) * 4, 14), grimeM, 2.12); }
  const wire = []; for (let k = 0; k < 2400; k++) { const a0 = k / 2400 * Math.PI * 2, a1 = (k + 1) / 2400 * Math.PI * 2, r = R_WALL + 1.5;   // barbelés en spirale
    wire.push(Math.cos(a0) * r, 29 + Math.sin(k * 1.9) * 0.6, Math.sin(a0) * r, Math.cos(a1) * r, 29 + Math.sin((k + 1) * 1.9) * 0.6, Math.sin(a1) * r); }
  const wg = new THREE.BufferGeometry(); wg.setAttribute("position", new THREE.Float32BufferAttribute(wire, 3)); add(new THREE.LineSegments(wg, new THREE.LineBasicMaterial({ color: 0x1a1a1a })));
  const boothM = lam(0x2a2c30), redM = new THREE.MeshBasicMaterial({ color: 0xff3b2a });
  for (const dx of [-14, 14]) { const bo = new THREE.Mesh(new THREE.BoxGeometry(4, 4, 4), boothM); bo.position.set(dx, 2, R_WALL + 6); add(bo);
    const win = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.2), new THREE.MeshBasicMaterial({ color: 0xffd98a })); win.position.set(dx, 2.6, R_WALL + 8.02); add(win);
    const lt = new THREE.Mesh(new THREE.SphereGeometry(0.35, 8, 6), redM); lt.position.set(dx, 4.4, R_WALL + 6); add(lt);
    for (let g = 0; g < 2; g++) person(dx + (g ? 3 : -3), R_WALL + 9, [pGuard], 777 + dx + g); }
  for (let k = 0; k < 30; k++) person(-4 + k * 1.15 + (rnd(k) - 0.5) * 0.6, R_WALL + 11 + rnd(k * 3) * 2.5 + (k > 12 ? (k - 12) * 0.25 : 0), pDist, 500 + k);                                     // file d'attente devant la porte
  const beamM = new THREE.MeshBasicMaterial({ color: 0xfff2c8, transparent: true, opacity: 0.06, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
  for (let k = 0; k < 7; k++) { if (k === 3) continue; const a = Math.PI / 2 + (k - 3) * 0.2;                                 // projecteurs sur le mur
    const head = new THREE.Vector3(Math.cos(a) * (R_WALL + 1.5), 30, Math.sin(a) * (R_WALL + 1.5)), tgt = new THREE.Vector3(Math.cos(a + 0.03) * (R_WALL + 12), 0, Math.sin(a + 0.03) * (R_WALL + 12));
    const L = head.distanceTo(tgt), beam = new THREE.Mesh(new THREE.ConeGeometry(3.5, L, 20, 1, true), beamM);
    beam.position.copy(head).add(tgt).multiplyScalar(0.5); beam.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), head.clone().sub(tgt).normalize()); add(beam);
    const hd = new THREE.Mesh(new THREE.SphereGeometry(0.8, 8, 6), new THREE.MeshBasicMaterial({ color: 0xfff2c8 })); hd.position.copy(head); add(hd); }
  // animation : les passants avancent le long de leur rue, petit rebond de pas
  return { animate(T) { walkers.forEach(w => { const d = w.v * T; w.sp.position.set(w.x + w.dx * d, 0.05 + Math.abs(Math.sin(T * w.v * 4 + w.ph)) * 0.06, w.z + w.dz * d); w.sp.scale.y = w.h * (1 - Math.abs(Math.sin(T * w.v * 4 + w.ph)) * 0.02); }); } };
}
