// Monde extérieur (plan 10, vue aérienne) : désert irradié immense, cratères, ruines, arbres morts, mares toxiques,
// nuages de radiation qui dérivent autour du dôme, montagnes à l'horizon. Groupe visible seulement sur les plans « outside ».
import * as THREE from "three";
import { rnd, MAP } from "./world.js";

const cvTex = (w, h, f, rep) => { const c = document.createElement("canvas"); c.width = w; c.height = h; f(c.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; if (rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep, rep); } return t; };

export function addOutside(scene) {
  const G = new THREE.Group(); G.visible = false; scene.add(G); const add = m => (G.add(m), m);
  const R0 = MAP.R_DOME + 25;
  // sol : terre brûlée craquelée (tuile répétée) + grandes taches sombres et verdâtres (texture unique sur tout le disque)
  const crack = cvTex(512, 512, (g, w, h) => { g.fillStyle = "#4a4322"; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(${rnd(i) < 0.5 ? "30,26,12" : "110,100,52"},${0.08 + rnd(i * 3) * 0.12})`; g.fillRect(rnd(i * 5) * w, rnd(i * 7) * h, 2 + rnd(i * 9) * 8, 2 + rnd(i * 11) * 8); }
    g.strokeStyle = "rgba(20,16,8,0.75)"; g.lineWidth = 2; for (let i = 0; i < 70; i++) { let x = rnd(i * 13) * w, y = rnd(i * 17) * h; g.beginPath(); g.moveTo(x, y);
      for (let k = 0; k < 6; k++) { x += (rnd(i * 19 + k) - 0.5) * 90; y += (rnd(i * 23 + k) - 0.5) * 90; g.lineTo(x, y); } g.stroke(); } }, 90);
  const ground = add(new THREE.Mesh(new THREE.CircleGeometry(9000, 96), new THREE.MeshLambertMaterial({ map: crack, color: 0xb0a070 }))); ground.rotation.x = -Math.PI / 2; ground.position.y = -0.08;
  const stains = cvTex(1024, 1024, (g, w, h) => { g.clearRect(0, 0, w, h);
    for (let i = 0; i < 160; i++) { const x = rnd(i * 3) * w, y = rnd(i * 5) * h, r = 12 + rnd(i * 7) * 70, gr = g.createRadialGradient(x, y, 0, x, y, r), toxic = rnd(i * 9) < 0.45;
      gr.addColorStop(0, toxic ? "rgba(140,190,40,0.55)" : "rgba(14,12,6,0.6)"); gr.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = gr; g.fillRect(x - r, y - r, 2 * r, 2 * r); }
    g.save(); g.globalCompositeOperation = "destination-out"; const c = w / 2, gr = g.createRadialGradient(c, c, 0, c, c, w * 0.08); gr.addColorStop(0, "#000"); gr.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.restore(); });
  const st = add(new THREE.Mesh(new THREE.CircleGeometry(9000, 96), new THREE.MeshBasicMaterial({ map: stains, transparent: true, depthWrite: false }))); st.rotation.x = -Math.PI / 2; st.position.y = -0.04;

  // cratères (anneaux sombres + fond vert luisant), mares toxiques émissives
  const glowTex = cvTex(128, 128, (g) => { const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.45, "rgba(255,255,255,0.4)"); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); });
  const rimM = new THREE.MeshLambertMaterial({ color: 0x2a2512 }), poolM = new THREE.MeshBasicMaterial({ color: 0x9fe03a });
  for (let i = 0; i < 70; i++) { const a = rnd(i * 31) * 6.283, r = R0 + 60 + Math.pow(rnd(i * 37), 0.7) * 4200, x = Math.cos(a) * r, z = Math.sin(a) * r, s = 15 + rnd(i * 41) * 60;
    const ring = add(new THREE.Mesh(new THREE.TorusGeometry(s, s * 0.18, 6, 28), rimM)); ring.rotation.x = -Math.PI / 2; ring.scale.z = 0.35; ring.position.set(x, 0.5, z);
    if (rnd(i * 43) < 0.55) { const p = add(new THREE.Mesh(new THREE.CircleGeometry(s * 0.75, 24), poolM)); p.rotation.x = -Math.PI / 2; p.position.set(x, 0.3, z);
      const gl = add(new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0x9fe03a, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false }))); gl.scale.set(s * 4, s * 2, 1); gl.position.set(x, s * 0.4, z); } }

  // ruines d'anciennes villes (blocs cassés, penchés), arbres morts près du dôme
  const ruinM = [0x3a3528, 0x2c2a22, 0x4a4434].map(c => new THREE.MeshLambertMaterial({ color: c })), box = new THREE.BoxGeometry(1, 1, 1);
  for (let c = 0; c < 9; c++) { const a = rnd(c * 51) * 6.283, r = R0 + 250 + rnd(c * 53) * 2600, cx = Math.cos(a) * r, cz = Math.sin(a) * r;
    for (let k = 0; k < 26; k++) { const m = add(new THREE.Mesh(box, ruinM[k % 3])), h = 6 + rnd(c * 100 + k) * 45; m.scale.set(8 + rnd(k * 3 + c) * 18, h, 8 + rnd(k * 5 + c) * 18);
      m.position.set(cx + (rnd(c * 7 + k * 11) - 0.5) * 220, h / 2 - 2, cz + (rnd(c * 13 + k * 17) - 0.5) * 220); m.rotation.set((rnd(k * 19) - 0.5) * 0.3, rnd(k * 23) * 3, (rnd(k * 29) - 0.5) * 0.3); } }
  const treeM = new THREE.MeshLambertMaterial({ color: 0x15130a });
  for (let i = 0; i < 160; i++) { const a = rnd(i * 61) * 6.283, r = R0 + 15 + rnd(i * 67) * 260, t = new THREE.Group(), h = 4 + rnd(i * 71) * 7;
    const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.3, h, 5), treeM); tr.position.y = h / 2; t.add(tr);
    for (let b = 0; b < 4; b++) { const br = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.1, h * 0.4, 4), treeM); br.position.y = h * (0.5 + b * 0.12); br.rotation.z = (b % 2 ? 1 : -1) * (0.6 + rnd(i + b) * 0.5); br.rotation.y = b * 1.7; t.add(br); }
    t.position.set(Math.cos(a) * r, 0, Math.sin(a) * r); t.rotation.z = (rnd(i * 73) - 0.5) * 0.25; add(t); }
  // panneaux « danger radiations » le long du dôme (triangles jaunes)
  const signTex = cvTex(128, 128, (g) => { g.fillStyle = "#e8c22a"; g.strokeStyle = "#111"; g.lineWidth = 8; g.beginPath(); g.moveTo(64, 8); g.lineTo(122, 116); g.lineTo(6, 116); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = "#111"; g.beginPath(); g.arc(64, 78, 9, 0, 7); g.fill(); for (let k = 0; k < 3; k++) { const a = -Math.PI / 2 + k * 2.094; g.beginPath(); g.moveTo(64, 78); g.arc(64, 78, 30, a - 0.5, a + 0.5); g.closePath(); g.fill(); } });
  for (let i = 0; i < 48; i++) { const a = i / 48 * 6.283, r = R0 + 6, s = new THREE.Mesh(new THREE.PlaneGeometry(3, 3), new THREE.MeshBasicMaterial({ map: signTex, transparent: true, side: THREE.DoubleSide }));
    s.position.set(Math.cos(a) * r, 3.4, Math.sin(a) * r); s.lookAt(Math.cos(a) * (r + 10), 3.4, Math.sin(a) * (r + 10)); add(s);
    const p = add(new THREE.Mesh(new THREE.BoxGeometry(0.2, 2.2, 0.2), treeM)); p.position.set(Math.cos(a) * r, 1.1, Math.sin(a) * r); }
  // montagnes à l'horizon
  const mtM = new THREE.MeshLambertMaterial({ color: 0x2a2a18 });
  for (let i = 0; i < 46; i++) { const a = i / 46 * 6.283 + rnd(i) * 0.1, r = 5200 + rnd(i * 3) * 1600, h = 300 + rnd(i * 5) * 700, m = add(new THREE.Mesh(new THREE.ConeGeometry(500 + rnd(i * 7) * 600, h, 6), mtM)); m.position.set(Math.cos(a) * r, h / 2 - 20, Math.sin(a) * r); m.rotation.y = rnd(i * 9) * 3; }

  // nuages de radiation : grandes nappes vert-jaune additives qui dérivent et pulsent, uniquement hors du dôme
  const cloudTex = cvTex(256, 256, (g) => { for (let k = 0; k < 14; k++) { const x = 60 + rnd(k * 3) * 136, y = 70 + rnd(k * 5) * 116, r = 40 + rnd(k * 7) * 60, gr = g.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, "rgba(255,255,255,0.5)"); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.fillRect(0, 0, 256, 256); } });
  const clouds = [];
  for (let i = 0; i < 230; i++) { const a = rnd(i * 83) * 6.283, r = R0 + 40 + Math.pow(rnd(i * 89), 0.8) * 3600, s = 120 + rnd(i * 97) * 420 + r * 0.08, low = rnd(i * 101) < 0.6;
    const m = new THREE.SpriteMaterial({ map: cloudTex, color: rnd(i * 103) < 0.65 ? 0x9fdc3a : 0xd6d84a, transparent: true, opacity: 0.16 + rnd(i * 107) * 0.18, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
    const sp = add(new THREE.Sprite(m)); sp.scale.set(s, s * (low ? 0.35 : 0.55), 1); const y = low ? s * 0.12 : 40 + rnd(i * 109) * 380; sp.position.set(Math.cos(a) * r, y, Math.sin(a) * r);
    clouds.push({ sp, a, r, y, o: m.opacity, ph: rnd(i * 113) * 6.28, v: (rnd(i * 127) - 0.5) * 0.004 }); }
  // particules irradiées en suspension près du sol (points lumineux)
  const pts = []; for (let i = 0; i < 4000; i++) { const a = rnd(i * 131) * 6.283, r = R0 + 5 + Math.pow(rnd(i * 137), 1.4) * 1500; pts.push(Math.cos(a) * r, 1 + rnd(i * 139) * 60, Math.sin(a) * r); }
  const pg = new THREE.BufferGeometry(); pg.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
  add(new THREE.Points(pg, new THREE.PointsMaterial({ color: 0xc8f060, size: 1.4, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false })));
  const sun = add(new THREE.DirectionalLight(0xd8d070, 0.9)); sun.position.set(800, 600, 1500);
  return { group: G, animate(T) { clouds.forEach(c => { const a = c.a + c.v * T; c.sp.position.set(Math.cos(a) * c.r, c.y + Math.sin(T * 0.6 + c.ph) * 6, Math.sin(a) * c.r); c.sp.material.opacity = c.o * (0.75 + 0.25 * Math.sin(T * 1.3 + c.ph)); }); } };
}

// fenêtre éclairée de la salle du Conseil (plan 6) : verre chaud bordeaux et or, rideaux, lustre, silhouettes autour de la table
export function councilWindow(scene, x, y, z) {
  const t = cvTex(768, 512, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "#5a1420"); gr.addColorStop(0.5, "#b0502a"); gr.addColorStop(1, "#3a0c14"); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    const lg = g.createRadialGradient(w / 2, h * 0.3, 0, w / 2, h * 0.3, w * 0.45); lg.addColorStop(0, "rgba(255,226,150,1)"); lg.addColorStop(1, "rgba(255,200,120,0)"); g.fillStyle = lg; g.fillRect(0, 0, w, h);   // lustre
    g.fillStyle = "#6a0f1c"; g.fillRect(0, 0, 90, h); g.fillRect(w - 90, 0, 90, h);                                    // rideaux
    g.fillStyle = "#2a0c10"; g.beginPath(); g.ellipse(w / 2, h * 0.82, w * 0.36, h * 0.1, 0, 0, 7); g.fill();          // table
    for (let k = 0; k < 9; k++) { const a = Math.PI * (0.1 + k * 0.1), px = w / 2 - Math.cos(a) * w * 0.36, py = h * 0.78 - Math.sin(a) * h * 0.1;
      g.fillStyle = "#1c0a0c"; g.beginPath(); g.arc(px, py - 46, 18, 0, 7); g.fill(); g.fillRect(px - 22, py - 30, 44, 40); }               // silhouettes
    g.fillStyle = "#14080a"; const fw = 22; for (const fx of [0, w / 3, 2 * w / 3, w]) g.fillRect(fx - fw / 2, 0, fw, h); for (const fy of [0, h / 2, h]) g.fillRect(0, fy - fw / 2, w, fw);   // croisillons (3 x 2)
  });
  const grp = new THREE.Group();
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(9, 6), new THREE.MeshBasicMaterial({ map: t })); grp.add(glass);
  const frame = new THREE.Mesh(new THREE.BoxGeometry(9.8, 6.8, 0.3), new THREE.MeshLambertMaterial({ color: 0x1a1612 })); frame.position.z = -0.2; grp.add(frame);
  const sill = new THREE.Mesh(new THREE.BoxGeometry(10.4, 0.4, 0.9), new THREE.MeshLambertMaterial({ color: 0xc9b48a, emissive: 0x2a1e0a })); sill.position.set(0, -3.5, 0.2); grp.add(sill);
  const light = new THREE.PointLight(0xffb070, 3, 40, 1.5); light.position.set(0, 0, 4); grp.add(light);
  grp.position.set(x, y, z); grp.rotation.y = Math.PI / 2; scene.add(grp); return grp;
}
