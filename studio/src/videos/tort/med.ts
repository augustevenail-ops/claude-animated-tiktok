// « Tu as tort » : place du phare au bord de la mer (PL : championnat, foule, mouettes, coucher de soleil), maison de Joël (MAI : cuisine + salon
// avec canapé), classe (CL2), studio météo + boulangerie (VILLE). La rue colorée de jour (TOWN, reprise des Dessins) est dans sets.ts.
import * as THREE from "three";
import { ctex, hash, signTex, stoneTex } from "./tex";
import { V, M, P, E, rep, bx, cyl, plane, grp, room, desk, chair, add, tileTex, stripesTex, woodTex, kidArtTex, posterTex, Crowd, HouseD } from "./sets";

const WALL = ["#ff8a6a", "#3cc8c8", "#ffd04a", "#7ad8a0", "#b08ae8", "#f0a040", "#ff9ac0", "#5aa8f0", "#e8e05a", "#ff6a5a"];
const SHUT = ["#1f6ad8", "#e83a5a", "#2fae7a", "#ffffff", "#7a3ab8", "#f2b51c"];
/** façade peinte : crépi + fenêtres à volets + porte cintrée (une texture, peu de géométrie) */
const facadeMed = (w: number, h: number, seed: number, shop = false) => ctex(`medf_${w}_${h}_${seed}_${shop ? 1 : 0}`, Math.round(w * 64), Math.round(h * 64), (q) => {
  const W = q.canvas.width, H = q.canvas.height, c = WALL[seed % WALL.length], s = SHUT[(seed + 2) % SHUT.length], u = 64;
  q.fillStyle = c; q.fillRect(0, 0, W, H); for (let i = 0; i < W * H / 60; i++) { q.fillStyle = `rgba(${hash(i, seed) > 0.5 ? "255,255,255" : "0,0,0"},0.05)`; q.fillRect(hash(i, 1 + seed) * W, hash(i, 2 + seed) * H, 3, 3); }
  q.fillStyle = "rgba(0,0,0,0.12)"; q.fillRect(0, H - 0.5 * u, W, 0.5 * u); q.fillStyle = "rgba(255,255,255,0.35)"; q.fillRect(0, 0, W, 0.25 * u);
  const nc = Math.max(1, Math.round(w / 2.4)), floors = Math.floor(h / 3);
  for (let f = 0; f < floors; f++) for (let k = 0; k < nc; k++) { const cx = (k + 0.5) * W / nc, y0 = H - (f * 3 + (f === 0 ? 0 : 1.0)) * u;
    if (f === 0) { if (k === Math.floor(nc / 2)) { const dw = 1.1 * u, dh = 2.3 * u; q.fillStyle = s; q.beginPath(); q.moveTo(cx - dw / 2, H); q.lineTo(cx - dw / 2, H - dh + dw / 2); q.arc(cx, H - dh + dw / 2, dw / 2, Math.PI, 0); q.lineTo(cx + dw / 2, H); q.fill();
        q.strokeStyle = "rgba(255,255,255,0.7)"; q.lineWidth = 5; q.stroke(); q.fillStyle = "#d8b04a"; q.beginPath(); q.arc(cx + dw * 0.3, H - dh * 0.45, 5, 0, 7); q.fill(); continue; }
      if (shop) { q.fillStyle = "#bfe6f8"; q.fillRect(cx - 0.9 * u, H - 2.2 * u, 1.8 * u, 1.6 * u); q.strokeStyle = "#ffffff"; q.lineWidth = 8; q.strokeRect(cx - 0.9 * u, H - 2.2 * u, 1.8 * u, 1.6 * u); continue; } }
    const ww = 0.9 * u, wh = 1.3 * u, wy = y0 - 2.1 * u; q.fillStyle = "#2a4a6a"; q.beginPath(); q.moveTo(cx - ww / 2, wy + wh); q.lineTo(cx - ww / 2, wy + ww / 2); q.arc(cx, wy + ww / 2, ww / 2, Math.PI, 0); q.lineTo(cx + ww / 2, wy + wh); q.fill();
    q.fillStyle = "rgba(160,220,255,0.55)"; q.fillRect(cx - ww / 2 + 6, wy + ww / 2, ww - 12, wh - ww / 2 - 6); q.fillStyle = "#ffffff"; q.fillRect(cx - ww / 2 - 6, wy + wh, ww + 12, 8);
    q.fillStyle = s; for (const sx of [-1, 1]) { q.fillRect(cx + sx * (ww / 2 + 4) - (sx < 0 ? 0.45 * u : 0), wy + 6, 0.45 * u, wh - 6); q.fillStyle = "rgba(0,0,0,0.18)"; for (let l = 0; l < 6; l++) q.fillRect(cx + sx * (ww / 2 + 4) - (sx < 0 ? 0.45 * u : 0), wy + 12 + l * wh / 7, 0.45 * u, 3); q.fillStyle = s; } }
});
const skyMed = () => ctex("skyMed", 64, 512, (g) => { const gr = g.createLinearGradient(0, 0, 0, 512); gr.addColorStop(0, "#2a7ae0"); gr.addColorStop(0.5, "#6ab8f0"); gr.addColorStop(0.85, "#ffd8b0"); gr.addColorStop(1, "#ffc890"); g.fillStyle = gr; g.fillRect(0, 0, 64, 512); });
const cobbleTex = () => ctex("cobble", 256, 256, (q) => { q.fillStyle = "#b8a890"; q.fillRect(0, 0, 256, 256); for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { q.fillStyle = ["#d8c8a8", "#c8b898", "#e0d0b0", "#cdbd9e"][(x * 3 + y * 5) % 4]; q.beginPath(); q.roundRect(x * 32 + (y % 2) * 16 + 2, y * 32 + 2, 28, 28, 7); q.fill(); } }, true);
const terraTex = () => ctex("terra", 128, 128, (q) => { q.fillStyle = "#d8683a"; q.fillRect(0, 0, 128, 128); for (let y = 0; y < 8; y++) { q.fillStyle = y % 2 ? "#c85a2e" : "#e07848"; q.fillRect(0, y * 16, 128, 9); for (let x = 0; x < 8; x++) { q.fillStyle = "rgba(0,0,0,0.12)"; q.fillRect(x * 16 + (y % 2) * 8, y * 16, 2, 16); } } });
const R = (seed: number, k: number, a: number, b: number) => a + (b - a) * hash(seed, k);

/** maison méditerranéenne : façade vers +z locale */
const medHouse = (p: THREE.Object3D, x: number, z: number, ry: number, w: number, h: number, seed: number, shop?: { sign: string; col: string }) => {
  const g = grp(p, x, 0, z, ry), D = 7, c = WALL[seed % WALL.length], wallM = M(c, 0.85), front = M("#ffffff", 0.85, facadeMed(w, h, seed, !!shop));
  const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, D), [wallM, wallM, wallM, wallM, front, wallM]); body.position.set(0, h / 2, 0); body.castShadow = true; body.receiveShadow = true; g.add(body);
  if (seed % 3 === 0) { const roof = add(g, new THREE.CylinderGeometry(0.01, w * 0.66, 1.6, 4, 1).rotateY(Math.PI / 4), M("#ffffff", 0.8, rep(terraTex(), 3, 2)), 0, h + 0.8, 0); roof.scale.set(1, 1, D / w); }
  else { bx(g, w + 0.1, 0.5, D + 0.1, M("#ffffff", 0.7), 0, h + 0.25, 0); if (seed % 2) for (let i = 0; i < 3; i++) add(g, new THREE.SphereGeometry(0.35, 10, 8), M(["#3e9a42", "#4aa848"][i % 2], 0.8), -w / 2 + 0.8 + i * (w - 1.6) / 2, h + 0.75, D / 2 - 0.6, 0, false); }
  if (h > 5) { const bal = grp(g, R(seed, 3, -w / 4, w / 4), 3.9, D / 2); bx(bal, 2.0, 0.12, 0.7, M("#f4f0e8", 0.6), 0, 0, 0.35); for (let i = 0; i < 9; i++) bx(bal, 0.04, 0.8, 0.04, M("#1c1c22", 0.4, undefined, { metalness: 0.6 }), -0.96 + i * 0.24, 0.45, 0.68); bx(bal, 2.0, 0.05, 0.05, M("#1c1c22", 0.4, undefined, { metalness: 0.6 }), 0, 0.86, 0.68);
    for (let i = 0; i < 6; i++) add(bal, new THREE.SphereGeometry(0.16, 8, 6), M(["#ff3a8a", "#ff6ab0", "#3e9a42"][i % 3], 0.7), -0.8 + i * 0.32, 0.95, 0.5, 0, false); }
  if (shop) { const aw = add(g, new THREE.BoxGeometry(w - 0.6, 0.08, 1.5), M("#ffffff", 0.6, rep(stripesTex(shop.col, "#fff6e8", 8), 3, 1)), 0, 2.75, D / 2 + 0.65); aw.rotation.x = 0.35;
    plane(g, Math.min(w - 1, 5.6), 0.9, M("#ffffff", 0.5, signTex("med_" + shop.sign, shop.sign, shop.col, "#fff6e0", 1024, 176, 110)), 0, 3.5, D / 2 + 0.03); }
  else if (seed % 4 === 1) { for (const s of [-1, 1]) { const pot = grp(g, s * 1.0, 0, D / 2 + 0.35); cyl(pot, 0.28, 0.22, 0.5, M("#d8683a", 0.7), 0, 0.25, 0, 12); add(pot, new THREE.IcosahedronGeometry(0.42, 1), M("#3e9a42", 0.8), 0, 0.85, 0, 0, false); } }
  // bougainvillier grimpant sur certaines façades
  if (seed % 5 === 2) for (let i = 0; i < 9; i++) add(g, new THREE.SphereGeometry(R(seed, 10 + i, 0.3, 0.55), 8, 6), M(["#ff2a8a", "#ff5aa8", "#e81a7a"][i % 3], 0.75), w / 2 - 0.6 - hash(i, seed) * 1.4, 2.2 + i * 0.35, D / 2 + 0.2, 0, false);
  return g; };
const palm = (p: THREE.Object3D, x: number, z: number, s: number, seed: number) => { const g = grp(p, x, 0, z); g.scale.setScalar(s); const tm = M("#a87a4a", 0.9);
  cyl(g, 0.45, 0.5, 0.5, M("#e8dcc8", 0.8), 0, 0.25, 0, 14); for (let i = 0; i < 7; i++) { const seg = cyl(g, 0.15 - i * 0.008, 0.18 - i * 0.008, 0.62, tm, Math.sin(i * 0.25) * 0.15 * i * 0.3, 0.55 + i * 0.58, 0, 8); seg.castShadow = true; }
  const lm = M("#3eae4a", 0.75); for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2 + seed; const lf = add(g, new THREE.ConeGeometry(0.32, 2.4, 4).rotateZ(Math.PI / 2).translate(1.2, 0, 0).scale(1, 0.25, 1), lm, 0.3, 4.6, 0, 0, false); lf.rotation.set(0, a, -0.35); lf.castShadow = true; }
  return g; };


// ------------------------------------------------------------ ville « stylée » : immeubles de pierre claire, accents de couleur profonds
const STONE = ["#efe6d6", "#e6dccb", "#f4f0e8", "#d9cbb4", "#e9e2d8", "#d4cbbd", "#c9d6d8", "#e8cdbd", "#ddd6b8"];
const SHUTC = ["#1f3a5a", "#2e5a4a", "#6a2a2a", "#3a3f48", "#1f3a5a", "#5a6a3a"];
const DOORC = ["#8a1f2a", "#1f3a5a", "#2e5a4a", "#c8962a", "#2a2a30"];
const chicFacade = (w: number, h: number, seed: number, shop?: string) => ctex(`chic_${w}_${h}_${seed}_${shop ?? ""}`, Math.round(w * 64), Math.round(h * 64), (q) => {
  const W = q.canvas.width, H = q.canvas.height, u = 64, c = STONE[seed % STONE.length], sh = SHUTC[seed % SHUTC.length];
  q.fillStyle = c; q.fillRect(0, 0, W, H); for (let y = 0; y < H; y += 22) { q.fillStyle = "rgba(0,0,0,0.045)"; q.fillRect(0, y, W, 2); for (let x = (y / 22 % 2) * 40; x < W; x += 80) q.fillRect(x, y, 2, 22); }
  for (let i = 0; i < W * H / 50; i++) { q.fillStyle = `rgba(${hash(i, seed) > 0.5 ? "255,255,255" : "60,40,20"},0.035)`; q.fillRect(hash(i, 1 + seed) * W, hash(i, 2 + seed) * H, 3, 3); }
  const floors = Math.floor(h / 3.2), nc = Math.max(2, Math.round(w / 2.2));
  for (let f = 0; f < floors; f++) { const yb = H - f * 3.2 * u; q.fillStyle = "rgba(255,255,255,0.35)"; q.fillRect(0, yb - 3.2 * u, W, 8); q.fillStyle = "rgba(0,0,0,0.1)"; q.fillRect(0, yb - 3.2 * u + 8, W, 3);
    for (let k = 0; k < nc; k++) { const cx = (k + 0.5) * W / nc;
      if (f === 0) { if (shop) { q.fillStyle = "#1c2026"; q.fillRect(0, yb - 2.9 * u, W, 2.9 * u); q.fillStyle = "#cfe2ea"; q.fillRect(cx - 0.8 * u, yb - 2.5 * u, 1.6 * u, 2.1 * u); q.strokeStyle = "#e8e0d0"; q.lineWidth = 5; q.strokeRect(cx - 0.8 * u, yb - 2.5 * u, 1.6 * u, 2.1 * u); q.fillStyle = "rgba(255,220,150,0.35)"; q.fillRect(cx - 0.8 * u, yb - 2.5 * u, 1.6 * u, 2.1 * u); continue; }
        if (k === Math.floor(nc / 2)) { q.fillStyle = DOORC[seed % DOORC.length]; q.fillRect(cx - 0.6 * u, yb - 2.5 * u, 1.2 * u, 2.5 * u); q.strokeStyle = "rgba(255,255,255,0.5)"; q.lineWidth = 4; q.strokeRect(cx - 0.5 * u, yb - 2.4 * u, 1.0 * u, 1.0 * u); q.strokeRect(cx - 0.5 * u, yb - 1.25 * u, 1.0 * u, 1.1 * u); q.fillStyle = "#d8b04a"; q.beginPath(); q.arc(cx + 0.35 * u, yb - 1.3 * u, 5, 0, 7); q.fill(); continue; } }
      const ww = 0.95 * u, wh = 1.9 * u, wy = yb - 2.6 * u; q.fillStyle = "#f6f2ea"; q.fillRect(cx - ww / 2 - 8, wy - 8, ww + 16, wh + 16); q.fillStyle = "#26323e"; q.fillRect(cx - ww / 2, wy, ww, wh);
      q.fillStyle = "rgba(170,210,235,0.45)"; q.fillRect(cx - ww / 2 + 5, wy + 5, ww / 2 - 8, wh - 10); q.fillRect(cx + 3, wy + 5, ww / 2 - 8, wh - 10); q.fillStyle = "#f6f2ea"; q.fillRect(cx - 2, wy, 4, wh); q.fillRect(cx - ww / 2, wy + wh * 0.42, ww, 4);
      if ((seed + k + f) % 3 !== 0) { q.fillStyle = sh; for (const sx of [-1, 1]) { const x0 = sx < 0 ? cx - ww / 2 - 10 - 0.42 * u : cx + ww / 2 + 10; q.fillRect(x0, wy, 0.42 * u, wh); q.fillStyle = "rgba(0,0,0,0.2)"; for (let l = 0; l < 9; l++) q.fillRect(x0, wy + 8 + l * wh / 9, 0.42 * u, 3); q.fillStyle = sh; } } } }
});
export const chicHouse = (p: THREE.Object3D, x: number, z: number, ry: number, w: number, h: number, seed: number, shop?: { sign: string; col: string }) => {
  const g = grp(p, x, 0, z, ry), D = 8, c = STONE[seed % STONE.length], wallM = M(c, 0.85), front = M("#ffffff", 0.85, chicFacade(w, h, seed, shop?.sign));
  const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, D), [wallM, wallM, wallM, wallM, front, wallM]); body.position.set(0, h / 2, 0); body.castShadow = true; body.receiveShadow = true; g.add(body);
  const zinc = M("#5a6470", 0.45, undefined, { metalness: 0.4 }), trim = M("#f6f2ea", 0.6), iron = M("#16181c", 0.4, undefined, { metalness: 0.6 });
  bx(g, w + 0.3, 0.35, D + 0.3, trim, 0, h + 0.17, 0); const mans = add(g, new THREE.CylinderGeometry(0.62, 0.95, 2.4, 4, 1).rotateY(Math.PI / 4), zinc, 0, h + 1.55, 0); mans.scale.set(w * 0.98, 1, D * 0.98);
  const nd = Math.max(1, Math.round(w / 3)); for (let i = 0; i < nd; i++) { const dx = -w / 2 + (i + 0.5) * w / nd; bx(g, 0.9, 1.2, 0.7, zinc, dx, h + 1.4, D / 2 - 0.25); plane(g, 0.6, 0.8, M("#26323e", 0.2, undefined, { emissive: "#1a2a3a", emissiveIntensity: 0.3 }), dx, h + 1.35, D / 2 + 0.11); }
  for (let i = 0; i < 2; i++) cyl(g, 0.25, 0.25, 1.2, M("#b8644a", 0.8), -w / 2 + 0.8 + i * (w - 1.6), h + 2.9, -1, 8);
  const floors = Math.floor(h / 3.2); for (let f = 1; f < floors; f++) bx(g, w + 0.06, 0.18, 0.25, trim, 0, f * 3.2, D / 2 + 0.1);
  if (floors > 2) { const by = 3.2 * 1 + 0.05, bal = grp(g, 0, by, D / 2); bx(bal, w - 0.4, 0.12, 0.7, trim, 0, 0, 0.35); for (let i = 0; i <= Math.round((w - 0.4) / 0.2); i++) bx(bal, 0.03, 0.85, 0.03, iron, -(w - 0.4) / 2 + i * 0.2, 0.45, 0.68);
    bx(bal, w - 0.4, 0.05, 0.06, iron, 0, 0.88, 0.68); for (let i = 0; i < Math.round(w / 1.4); i++) add(bal, new THREE.SphereGeometry(0.17, 8, 6), M(["#c8283a", "#e85a8a", "#3e8a42"][(i + seed) % 3], 0.75), -w / 2 + 0.7 + i * 1.4, 0.98, 0.45, 0, false); }
  if (shop) { const aw = add(g, new THREE.BoxGeometry(w - 0.4, 0.06, 1.6), M("#ffffff", 0.6, rep(stripesTex(shop.col, "#f4ede0", 10), 3, 1)), 0, 2.95, D / 2 + 0.75); aw.rotation.x = 0.32;
    plane(g, Math.min(w - 1, 5), 0.6, M("#ffffff", 0.5, signTex("chic_" + shop.sign, shop.sign, "#1c2026", "#e8d6a8", 1024, 128, 80)), 0, 3.35, D / 2 + 0.02); }
  else for (const sx of [-1, 1]) { const pot = grp(g, sx * 1.1, 0, D / 2 + 0.4); bx(pot, 0.5, 0.5, 0.5, M("#2a2e36", 0.5), 0, 0.25, 0, 0, 0.04); add(pot, new THREE.SphereGeometry(0.38, 10, 8), M("#3e7a42", 0.8), 0, 0.8, 0, 0, false).scale.y = 1.4; }
  return g; };
/** réverbère noir */
const lampPost = (p: THREE.Object3D, x: number, z: number) => { const l = grp(p, x, 0, z), iron = M("#16181c", 0.4, undefined, { metalness: 0.6 }); cyl(l, 0.12, 0.16, 0.5, iron, 0, 0.25, 0, 10); cyl(l, 0.05, 0.07, 3.6, iron, 0, 2.0, 0, 8);
  add(l, new THREE.CylinderGeometry(0.22, 0.12, 0.5, 6), M("#fff4d0", 0.4, undefined, { emissive: "#ffe0a0", emissiveIntensity: 0.6 }), 0, 4.0, 0); add(l, new THREE.ConeGeometry(0.3, 0.22, 6), iron, 0, 4.35, 0); return l; };
/** platane dans sa grille */
const plane2 = (p: THREE.Object3D, x: number, z: number, s: number, seed: number) => { const g = grp(p, x, 0, z); g.scale.setScalar(s); bx(g, 1.0, 0.04, 1.0, M("#2a2e36", 0.5), 0, 0.02, 0); cyl(g, 0.14, 0.2, 3.2, M("#b8a888", 0.8), 0, 1.6, 0, 8);
  const lm = M("#5a8a3a", 0.85); for (let i = 0; i < 5; i++) add(g, new THREE.IcosahedronGeometry(0.9 + hash(seed, i) * 0.4, 1), lm, (hash(seed, i + 5) - 0.5) * 1.6, 3.8 + hash(seed, i + 9) * 0.9, (hash(seed, i + 13) - 0.5) * 1.6); return g; };

export const label = (text: string, col: string, w = 2.4) => { const t = ctex("lab_" + text, 1024, 192, (q) => { q.clearRect(0, 0, 1024, 192); let fs = 120; q.font = `900 ${fs}px Montserrat, 'DejaVu Sans', sans-serif`; while (q.measureText(text).width > 960 && fs > 30) { fs -= 4; q.font = `900 ${fs}px Montserrat, 'DejaVu Sans', sans-serif`; }
    q.textAlign = "center"; q.textBaseline = "middle"; q.lineWidth = Math.max(8, fs * 0.15); q.lineJoin = "round"; q.strokeStyle = "#1a1420"; q.strokeText(text, 512, 100); q.fillStyle = col; q.fillText(text, 512, 100); });
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthTest: false, fog: false, toneMapped: false })); s.scale.set(w, w * 0.1875, 1); s.renderOrder = 20; s.visible = false; return s; };

const skyDay = () => ctex("skyJT", 64, 512, (g) => { const gr = g.createLinearGradient(0, 0, 0, 512); gr.addColorStop(0, "#2f86e8"); gr.addColorStop(0.55, "#86c6f4"); gr.addColorStop(1, "#e8f6ff"); g.fillStyle = gr; g.fillRect(0, 0, 64, 512); });
const skyDusk = () => ctex("skyJTd", 64, 512, (g) => { const gr = g.createLinearGradient(0, 0, 0, 512); gr.addColorStop(0, "#26346a"); gr.addColorStop(0.45, "#a8566a"); gr.addColorStop(0.72, "#f0864a"); gr.addColorStop(1, "#ffc870"); g.fillStyle = gr; g.fillRect(0, 0, 64, 512); });
const seaTex = () => ctex("seaJT", 256, 256, (q) => { q.fillStyle = "#1f8ad0"; q.fillRect(0, 0, 256, 256); for (let i = 0; i < 260; i++) { q.strokeStyle = `rgba(255,255,255,${0.15 + hash(i, 1) * 0.3})`; q.lineWidth = 2; const x = hash(i, 2) * 256, y = hash(i, 3) * 256; q.beginPath(); q.moveTo(x, y); q.quadraticCurveTo(x + 6, y - 3, x + 14, y); q.stroke(); } }, true);
const hstripe = () => ctex("phareS", 64, 512, (q) => { for (let i = 0; i < 6; i++) { q.fillStyle = i % 2 ? "#f6f2ec" : "#e2262e"; q.fillRect(0, i * 512 / 6, 64, 512 / 6); } });
const BOARD = (lines: string[], key: string) => ctex("board_" + key, 1024, 400, (q) => { q.fillStyle = "#24463a"; q.fillRect(0, 0, 1024, 400); for (let i = 0; i < 900; i++) { q.fillStyle = `rgba(255,255,255,${hash(i, 9) * 0.04})`; q.fillRect(hash(i, 1) * 1024, hash(i, 2) * 400, 4, 4); }
  q.fillStyle = "#f6f4ec"; q.textAlign = "center"; q.font = "bold 84px 'Comic Sans MS', 'DejaVu Sans', cursive"; lines.forEach((l, i) => q.fillText(l, 512, 130 + i * 110)); });

/** mouettes instanciées : posées (fly = 0) ou envolées (fly → 1) */
export class Gulls { root = new THREE.Group(); body: THREE.InstancedMesh; wl: THREE.InstancedMesh; wr: THREE.InstancedMesh; private d = new THREE.Object3D(); n: number;
  constructor(n = 40) { this.n = n; const wm = M("#f8f8f6", 0.6), gm = M("#9aa0aa", 0.6);
    this.body = new THREE.InstancedMesh(new THREE.CapsuleGeometry(0.11, 0.3, 4, 8).rotateX(Math.PI / 2), wm, n); this.wl = new THREE.InstancedMesh(new THREE.BoxGeometry(0.5, 0.02, 0.2).translate(-0.27, 0, 0), gm, n); this.wr = new THREE.InstancedMesh(new THREE.BoxGeometry(0.5, 0.02, 0.2).translate(0.27, 0, 0), gm, n);
    for (const m of [this.body, this.wl, this.wr]) { m.userData.noEdge = true; m.castShadow = true; this.root.add(m); } }
  /** base : positions posées ; fly : 0 → 1 ; t : temps */
  set(t: number, base: THREE.Vector3[], fly: number, dir = V(0, 0.6, -1)) { const d = this.d;
    for (let i = 0; i < this.n; i++) { const b = base[i % base.length], h = (k: number) => hash(i, k), f = Math.max(0, Math.min(1, fly * 1.4 - h(1) * 0.4));
      d.position.copy(b).add(dir.clone().multiplyScalar(f * f * (14 + h(2) * 10))).add(V((h(3) - 0.5) * f * 8, f * Math.sin(t * 2 + i) * 0.4, 0));
      d.rotation.set(-f * 0.3, Math.atan2(dir.x, dir.z) + (1 - f) * h(4) * 6, 0); d.scale.setScalar(1.6); d.updateMatrix(); this.body.setMatrixAt(i, d.matrix);
      const flap = f > 0.02 ? Math.sin(t * 16 + i) * 0.7 : -0.15; d.rotation.z = flap; d.updateMatrix(); this.wl.setMatrixAt(i, d.matrix); d.rotation.z = -flap; d.updateMatrix(); this.wr.setMatrixAt(i, d.matrix); }
    for (const m of [this.body, this.wl, this.wr]) m.instanceMatrix.needsUpdate = true; } }

/** accessoires tenus en main ou posés */
export const mkBaguette = () => { const g = new THREE.Group(); const b = add(g, new THREE.CapsuleGeometry(0.06, 0.7, 6, 12).rotateZ(Math.PI / 2), M("#d8963a", 0.6), 0, 0, 0); b.scale.set(1, 1, 0.8);
  for (let i = 0; i < 4; i++) bx(g, 0.08, 0.012, 0.03, M("#f4dca0", 0.7), -0.24 + i * 0.16, 0.055, 0, 0.5, 0.005); return g; };
export const mkNotebook = (text: string) => { const g = new THREE.Group(); bx(g, 0.5, 0.03, 0.36, M("#2a7ae8", 0.6), 0, 0, 0, 0, 0.01);
  plane(g, 0.3, 0.12, M("#ffffff", 0.7, ctex("nb_" + text, 400, 160, (q) => { q.fillStyle = "#fffdf4"; q.fillRect(0, 0, 400, 160); q.strokeStyle = "#2a2a30"; q.lineWidth = 3; q.strokeRect(4, 4, 392, 152); q.fillStyle = "#1a2a6a"; q.font = "bold 74px 'Comic Sans MS', 'DejaVu Sans', cursive"; q.textAlign = "center"; q.fillText(text, 200, 106); })), 0, 0.017, -0.02, -Math.PI / 2); return g; };
export const mkLoupe = () => { const g = new THREE.Group(); add(g, new THREE.TorusGeometry(0.22, 0.03, 10, 28), M("#1a1a1e", 0.3, undefined, { metalness: 0.6 }), 0, 0, 0);
  add(g, new THREE.CircleGeometry(0.21, 28), new THREE.MeshPhysicalMaterial({ color: "#cfeaff", roughness: 0.02, transmission: 0.6, transparent: true, opacity: 0.45 }), 0, 0, 0, 0, false); add(g, new THREE.CylinderGeometry(0.03, 0.035, 0.36, 10), M("#8a4a1a", 0.5), 0, -0.4, 0); return g; };
export const mkRuler = () => { const g = new THREE.Group(); bx(g, 1.4, 0.04, 0.12, M("#ffffff", 0.5, ctex("ruler", 512, 48, (q) => { q.fillStyle = "#ffd21a"; q.fillRect(0, 0, 512, 48); q.fillStyle = "#1a1a1e"; for (let i = 0; i < 64; i++) q.fillRect(i * 8, 0, 2, i % 5 ? 14 : 26); })), 0, 0, 0, 0, 0.01); return g; };
export const mkChrono = () => { const g = new THREE.Group(); add(g, new THREE.CylinderGeometry(0.18, 0.18, 0.06, 28).rotateX(Math.PI / 2), M("#d8dce4", 0.25, undefined, { metalness: 0.8 }), 0, 0, 0);
  add(g, new THREE.CircleGeometry(0.15, 28), M("#ffffff", 0.5, ctex("chronoF", 128, 128, (q) => { q.fillStyle = "#fff"; q.fillRect(0, 0, 128, 128); q.strokeStyle = "#1a1a1e"; for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; q.lineWidth = 4; q.beginPath(); q.moveTo(64 + Math.cos(a) * 50, 64 + Math.sin(a) * 50); q.lineTo(64 + Math.cos(a) * 60, 64 + Math.sin(a) * 60); q.stroke(); } q.lineWidth = 5; q.strokeStyle = "#e2262e"; q.beginPath(); q.moveTo(64, 64); q.lineTo(64, 14); q.stroke(); })), 0, 0, 0.031, 0, false);
  cyl(g, 0.03, 0.03, 0.1, M("#d8dce4", 0.25, undefined, { metalness: 0.8 }), 0, 0.23, 0, 10); return g; };
export const mkBook = () => { const g = new THREE.Group(); bx(g, 0.5, 0.65, 0.18, M("#c4283a", 0.5), 0, 0, 0, 0, 0.02); bx(g, 0.47, 0.62, 0.16, M("#fbf6e8", 0.8), 0.02, 0, 0, 0, 0.01);
  plane(g, 0.42, 0.18, M("#ffffff", 0.5, signTex("dico", "DICTIONNAIRE", "#c4283a", "#ffd21a", 512, 128, 60)), 0, 0.12, 0.092); return g; };
export const mkSteth = () => { const g = new THREE.Group(), k = M("#2a2e36", 0.4); add(g, new THREE.TorusGeometry(0.2, 0.015, 8, 24, Math.PI), k, 0, 0, 0).rotation.z = Math.PI;
  add(g, new THREE.CylinderGeometry(0.06, 0.06, 0.03, 20).rotateX(Math.PI / 2), M("#d8dce4", 0.2, undefined, { metalness: 0.9 }), 0, -0.45, 0.05); add(g, new THREE.CylinderGeometry(0.012, 0.012, 0.3, 6), k, 0, -0.3, 0); return g; };

export class Med {
  suns: [THREE.DirectionalLight, number][] = []; skies: THREE.MeshBasicMaterial[] = []; labels: Record<string, THREE.Sprite> = {}; parent!: THREE.Object3D; root!: THREE.Object3D;
  crowd!: Crowd; gulls!: Gulls; gullBase: THREE.Vector3[] = []; lamp!: THREE.MeshStandardMaterial; lampL!: THREE.PointLight; dusk!: THREE.Texture; day!: THREE.Texture;
  boardM!: THREE.MeshStandardMaterial; boards: Record<string, THREE.Texture> = {}; tvScreen!: THREE.MeshStandardMaterial; chips: THREE.Group[] = []; sofa!: THREE.Group;
  props: Record<string, THREE.Group> = {}; score!: THREE.MeshStandardMaterial; scores: THREE.Texture[] = []; stage!: THREE.Group; mics: THREE.Group[] = [];
  /** étiquette (texte flottant) créée à la demande */
  lab(key: string, text: string, col = "#ffffff", w = 2.4) { let s = this.labels[key]; if (!s) { s = label(text, col, w); this.root.add(s); this.labels[key] = s; } return s; }
  constructor(g: Record<string, THREE.Group>, root: THREE.Object3D) {
    this.root = root; this.day = skyDay(); this.dusk = skyDusk();
    const sun = (p: THREE.Group, pos: THREE.Vector3, i: number, size: number, hi = 1.15, col = "#fff0d8") => { const s = new THREE.DirectionalLight(col, i); this.suns.push([s, i]); s.position.copy(pos); s.target.position.set(0, 0, 0); s.castShadow = true; s.shadow.mapSize.set(2048, 2048);
      const c = s.shadow.camera; c.left = c.bottom = -size; c.right = c.top = size; c.near = 0.5; c.far = 160; s.shadow.bias = -0.0004; s.shadow.normalBias = 0.02; s.shadow.radius = 4; p.add(s, s.target); p.add(new THREE.HemisphereLight("#cfe6ff", "#e8c8a0", hi)); return s; };
    const sky = (p: THREE.Group) => { const mm = new THREE.MeshBasicMaterial({ map: this.day, side: THREE.BackSide, fog: false }); this.skies.push(mm); const m = new THREE.Mesh(new THREE.SphereGeometry(300, 32, 16), mm); m.userData.noEdge = true; p.add(m); };
    const prop = (k: string, o: THREE.Group) => { o.visible = false; root.add(o); this.props[k] = o; return o; };
    prop("baguette", mkBaguette()); prop("cahier", mkNotebook("Joel")); prop("loupe", mkLoupe()); prop("regle", mkRuler()); prop("chrono", mkChrono()); prop("dico", mkBook()); prop("steth", mkSteth()); prop("chrono2", mkChrono());

    // ================= place du phare (championnat), au bord de la mer
    { const p = g.PL; sun(p, V(-30, 44, 26), 3.3, 48); sky(p);
      plane(p, 400, 220, M("#e8d8b8", 0.95), 0, -0.02, 84, -Math.PI / 2);
      plane(p, 80, 64, M("#ffffff", 0.8, rep(cobbleTex(), 26, 20)), 0, 0, 8, -Math.PI / 2);
      // quai + mer + phare sur sa jetée
      bx(p, 120, 1.2, 2.2, M("#c8bca8", 0.85, rep(stoneTex(), 30, 1)), 0, -0.45, -25, 0, 0.05); for (let x = -50; x <= 50; x += 6) cyl(p, 0.25, 0.3, 0.7, M("#2a2e36", 0.5), x, 0.35, -24.4, 10);
      const sea = new THREE.MeshPhysicalMaterial({ map: rep(seaTex(), 60, 30), roughness: 0.15, clearcoat: 1, clearcoatRoughness: 0.1, color: "#ffffff" }); plane(p, 600, 300, sea, 0, -0.9, -176, -Math.PI / 2);
      { const j = grp(p, 6, 0, -38); bx(j, 7, 1.6, 22, M("#b8ac98", 0.85, rep(stoneTex(), 2, 6)), 0, -0.2, 9, 0, 0.1); cyl(j, 4.5, 5.2, 2.2, M("#a89c88", 0.9, rep(stoneTex(), 3, 1)), 0, 0.2, 0, 24);
        const t = add(j, new THREE.CylinderGeometry(1.7, 2.4, 20, 32, 1), M("#ffffff", 0.5, hstripe()), 0, 11.3, 0); t.castShadow = true;
        add(j, new THREE.CylinderGeometry(2.6, 2.6, 0.35, 32), M("#2a2e36", 0.5, undefined, { metalness: 0.5 }), 0, 21.4, 0); for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2; cyl(j, 0.04, 0.04, 1.0, M("#2a2e36", 0.5), Math.cos(a) * 2.5, 22.0, Math.sin(a) * 2.5, 6); }
        this.lamp = new THREE.MeshStandardMaterial({ color: "#fff4c0", emissive: "#ffd870", emissiveIntensity: 1.2, transparent: true, opacity: 0.9 }); add(j, new THREE.CylinderGeometry(1.25, 1.25, 2.4, 24), this.lamp, 0, 22.8, 0, 0, false);
        add(j, new THREE.SphereGeometry(1.45, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), M("#e2262e", 0.4), 0, 24.0, 0); cyl(j, 0.1, 0.1, 1.2, M("#2a2e36", 0.4), 0, 25.6, 0, 8);
        this.lampL = new THREE.PointLight("#ffd27a", 0, 60, 1.2); this.lampL.position.set(0, 22.8, 0); j.add(this.lampL);
        bx(j, 1.2, 2.0, 0.1, P("#2a5cb8", 0.4), 0, 2.4, 2.38).rotation.y = 0; }
      // bateaux
      for (let i = 0; i < 6; i++) { const b = grp(p, -40 + i * 16 + hash(i, 1) * 6, -0.8, -45 - hash(i, 2) * 40, hash(i, 3) * 3); bx(b, 1.8, 0.9, 5, P(["#e2262e", "#2a7ae8", "#f2b51c", "#2fae7a", "#ffffff", "#ff8a3a"][i], 0.3), 0, 0.4, 0, 0, 0.3); bx(b, 1.2, 1.0, 1.6, M("#ffffff", 0.6), 0, 1.3, -0.6);
        cyl(b, 0.06, 0.06, 4, M("#8a6a4a", 0.6), 0, 2.8, 0.8, 6); }
      // scène + pupitres face à face + banderole
      { const st = grp(p, 0, 0, -13); this.stage = st; bx(st, 16, 1.0, 7, M("#a8784a", 0.6, rep(woodTex("#a8784a"), 4, 2)), 0, 0.5, 0, 0, 0.04); bx(st, 16.1, 0.9, 0.08, M("#ffffff", 0.6, rep(stripesTex("#e2262e", "#fff4e0", 16), 4, 1)), 0, 0.45, 3.52);
        for (let i = 0; i < 3; i++) bx(st, 3, 0.33, 0.6, M("#a8784a", 0.6), 0, 0.17 + i * 0.33 - 0.33 * i * 0, 4.2 - i * 0.0 + 0.6 * (2 - i) - 1.2).scale.y = 1 + i;
        for (const sx of [-1, 1]) { const l = grp(st, sx * 3.2, 1.0, 0.3, sx * -1.0); bx(l, 1.1, 1.2, 0.7, P(sx < 0 ? "#2a7ae8" : "#9a3ac8", 0.35), 0, 0.6, 0, 0, 0.06); bx(l, 1.3, 0.08, 0.9, M("#f4ecdc", 0.5), 0, 1.24, 0);
          const mic = grp(l, 0, 1.28, 0.2); cyl(mic, 0.015, 0.015, 0.5, M("#1a1a1e", 0.4), 0, 0.25, 0, 6).rotation.x = 0.4; add(mic, new THREE.SphereGeometry(0.06, 12, 10), M("#2a2e36", 0.3, undefined, { metalness: 0.6 }), 0, 0.48, 0.18); this.mics.push(l); }
        for (const x of [-7.6, 7.6]) cyl(st, 0.12, 0.12, 8, M("#2a2e36", 0.4, undefined, { metalness: 0.5 }), x, 4, -2.8, 10);
        plane(st, 15, 2.2, M("#ffffff", 0.6, ctex("banner", 1536, 224, (q) => { q.fillStyle = "#e2262e"; q.fillRect(0, 0, 1536, 224); q.strokeStyle = "#ffd21a"; q.lineWidth = 12; q.strokeRect(12, 12, 1512, 200); q.fillStyle = "#ffffff"; q.textAlign = "center"; q.font = "900 80px Montserrat, 'DejaVu Sans', sans-serif"; q.fillText("GRAND CHAMPIONNAT", 768, 100); q.fillStyle = "#ffd21a"; q.font = "900 70px Montserrat, 'DejaVu Sans', sans-serif"; q.fillText("DU « TU AS TORT »", 768, 182); }), { side: THREE.DoubleSide }), 0, 6.8, -2.8);
        // tableau des scores
        this.scores = [0, 1, 2, 3, 4, 5].map((k) => ctex("score" + k, 512, 256, (q) => { q.fillStyle = "#16181e"; q.fillRect(0, 0, 512, 256); q.fillStyle = "#ffd21a"; q.font = "900 46px Montserrat, 'DejaVu Sans', sans-serif"; q.textAlign = "center"; q.fillText("CONTRAIRE", 140, 70); q.fillText("JOËL", 384, 70); q.font = "900 130px Montserrat, 'DejaVu Sans', sans-serif"; q.fillStyle = "#ff5a5a"; q.fillText(String(k), 140, 210); q.fillStyle = "#5ac8ff"; q.fillText(k === 5 ? "1" : "0", 384, 210); q.fillStyle = "#ffffff"; q.fillText("–", 256, 200); }));
        this.score = new THREE.MeshStandardMaterial({ map: this.scores[0], emissive: "#ffffff", emissiveMap: this.scores[0], emissiveIntensity: 0.9 }); const sb = grp(st, 10.8, 0, -1, -0.5); bx(sb, 4.6, 2.5, 0.3, M("#2a2e36", 0.4), 0, 5.2, 0); plane(sb, 4.3, 2.15, this.score, 0, 5.2, 0.16); for (const x of [-1.8, 1.8]) cyl(sb, 0.1, 0.1, 4, M("#2a2e36", 0.4), x, 2, 0, 8); }
      // maisons colorées autour (style de la rue), guirlandes de fanions
      for (let i = 0; i < 6; i++) for (const side of [-1, 1]) chicHouse(p, side * 34, -14 + i * 9.5, -side * Math.PI / 2, 9.4, [12.8, 9.6, 16, 12.8][(i + (side > 0 ? 1 : 0)) % 4], 20 + i * 2 + (side > 0 ? 1 : 0), i === 2 && side < 0 ? { sign: "CAFÉ DU PORT", col: "#1f3a5a" } : undefined);
      for (let i = 0; i < 7; i++) chicHouse(p, -28 + i * 9.4, 44, Math.PI, 9.3, [12.8, 16, 9.6][i % 3], 40 + i);
      for (const z of [2, 14]) for (let i = 0; i < 30; i++) { const x = -28 + i * 1.95, y = 7.6 - Math.sin((i + 0.5) / 30 * Math.PI) * 1.5; const f = add(p, new THREE.ConeGeometry(0.28, 0.6, 3), M(["#1f3a5a", "#f4ede0", "#c8283a"][i % 3], 0.6, undefined, { side: THREE.DoubleSide }), x, y - 0.3, z, 0, false); f.rotation.x = Math.PI; }
      for (const [x, z] of [[-24, -18], [24, -18]] as [number, number][]) { lampPost(p, x, z); }
      for (let i = 0; i < 6; i++) { lampPost(p, -28, -12 + i * 9.5); lampPost(p, 28, -12 + i * 9.5); }
      this.crowd = new Crowd(1100, -20, 20, -6, 26); p.add(this.crowd.root);
      this.gulls = new Gulls(46); p.add(this.gulls.root);
      for (let i = 0; i < 46; i++) this.gullBase.push(i < 18 ? V(-30 + i * 3.4 + hash(i, 1), 0.3, -24.6 - hash(i, 2) * 0.6) : i < 30 ? V(-7.4 + (i - 18) * 1.25, 8.0, -15.8) : V(6 + Math.cos(i) * 2.6, 21.7, -38 + Math.sin(i) * 2.6)); }


    // ================= rue stylée (axe x) : pierre claire, auvents, réverbères, platanes ; la mer et le phare au bout (x > 62)
    { const p = g.RUE; sun(p, V(30, 40, 24), 3.2, 46); sky(p);
      plane(p, 404, 400, M("#d8ccb8", 0.95), -150, -0.02, 0, -Math.PI / 2); plane(p, 140, 7, M("#ffffff", 0.85, rep(cobbleTex(), 46, 2.4)), -8, 0.005, 0, -Math.PI / 2);
      for (const s of [-1, 1]) { bx(p, 140, 0.16, 3.2, M("#e2d8c6", 0.85, rep(stoneTex(), 40, 1)), -8, 0.08, s * 5.1, 0, 0.02); bx(p, 140, 0.18, 0.2, M("#c8bca8", 0.8), -8, 0.09, s * 3.55, 0, 0.01); }
      const ws = [9.4, 8.6, 10, 9, 8.8];
      for (const side of [-1, 1]) { let x = -72, k = side > 0 ? 2 : 0; while (x < 54) { const w = ws[k % ws.length], h = [12.8, 16, 9.6, 12.8, 16, 12.8][(k * 3 + (side > 0 ? 1 : 0)) % 6];
          const shop = side > 0 && k % 4 === 1 ? { sign: ["BOULANGERIE", "LIBRAIRIE", "FLEURISTE", "ÉPICERIE FINE"][(k >> 2) % 4], col: ["#8a1f2a", "#1f3a5a", "#2e5a4a", "#c8962a"][(k >> 2) % 4] } : side < 0 && k % 5 === 2 ? { sign: "CAFÉ", col: "#1f3a5a" } : undefined;
          chicHouse(p, x + w / 2, side * 10.7, side < 0 ? 0 : Math.PI, w - 0.05, h, k * 5 + (side > 0 ? 3 : 1), shop); x += w; k++; } }
      for (let x = -66; x <= 50; x += 11) { plane2(p, x, -5.3, 1.0, x + 100); plane2(p, x + 5.5, 5.3, 0.95, x + 300); lampPost(p, x + 2.7, -4.1); lampPost(p, x + 8.2, 4.1); }
      for (const [x, s] of [[-14, -1], [6, -1], [22, 1]] as [number, number][]) { for (let i = 0; i < 3; i++) { const t = grp(p, x + i * 1.3, 0, s * 5.6); cyl(t, 0.35, 0.35, 0.04, M("#f4f0e8", 0.4), 0, 0.74, 0, 16); cyl(t, 0.03, 0.03, 0.74, M("#16181c", 0.4), 0, 0.37, 0, 6);
          for (const d of [-0.5, 0.5]) { const c = grp(t, d, 0, 0, d > 0 ? -Math.PI / 2 : Math.PI / 2); bx(c, 0.4, 0.04, 0.4, M("#c8962a", 0.6), 0, 0.45, 0); bx(c, 0.4, 0.4, 0.04, M("#c8962a", 0.6), 0, 0.67, -0.19); } } }
      // le bout de la rue : quai, mer, phare au loin
      bx(p, 30, 0.6, 30, M("#c8bca8", 0.85, rep(stoneTex(), 6, 6)), 66, -0.3, 0); const sea = new THREE.MeshPhysicalMaterial({ map: rep(seaTex(), 40, 60), roughness: 0.15, clearcoat: 1 }); plane(p, 300, 400, sea, 230, -0.9, 0, -Math.PI / 2);
      { const j = grp(p, 120, 0, -14); cyl(j, 3, 3.6, 2, M("#a89c88", 0.9), 0, 0, 0, 20); add(j, new THREE.CylinderGeometry(1.4, 2.0, 16, 24), M("#ffffff", 0.5, hstripe()), 0, 8.8, 0); add(j, new THREE.CylinderGeometry(1.0, 1.0, 2, 16), M("#fff4c0", 0.3, undefined, { emissive: "#ffd870", emissiveIntensity: 1 }), 0, 17.8, 0); add(j, new THREE.SphereGeometry(1.2, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), M("#e2262e", 0.4), 0, 18.8, 0); }
      for (let i = 0; i < 4; i++) { const b = grp(p, 90 + i * 18, -0.8, 18 - i * 14, i); bx(b, 1.8, 0.9, 5, P(["#f4f0e8", "#1f3a5a", "#8a1f2a", "#f4f0e8"][i], 0.3), 0, 0.4, 0, 0, 0.3); cyl(b, 0.06, 0.06, 5, M("#8a6a4a", 0.6), 0, 3, 0.6, 6); } }

    // ================= classe (couleurs chaudes)
    { const p = g.CL2; sun(p, V(8, 6, 2), 2.5, 7, 0.8, "#fff2dc");
      room(p, 8.4, 7.4, 3.0, new THREE.MeshStandardMaterial({ map: rep(stripesTex("#ffcf8a", "#ffbf6a", 16), 4, 1), roughness: 0.9 }), new THREE.MeshStandardMaterial({ map: rep(woodTex("#d8a060"), 4, 4), roughness: 0.6 }), M("#fff0d8", 0.9));
      bx(p, 8.4, 1.0, 0.03, M("#e8603a", 0.6), 0, 0.5, -3.69); bx(p, 0.03, 1.0, 7.4, M("#e8603a", 0.6), -4.19, 0.5, 0);
      this.boards.nom = BOARD(["Joël"], "nom"); this.boards.tort = BOARD(["Joël-tu-as-tort", "😂"], "tort"); this.boards.age = BOARD(["10 ans 3 mois 4 jours"], "age");
      this.boardM = M("#ffffff", 0.9, this.boards.nom); plane(p, 4.2, 1.6, this.boardM, -0.3, 1.75, -3.67); bx(p, 4.4, 1.8, 0.04, M("#8a5a3a", 0.5), -0.3, 1.75, -3.7);
      const win = new THREE.MeshPhysicalMaterial({ color: "#bfe6f8", roughness: 0.05, emissive: "#8ac8f0", emissiveIntensity: 0.6 }); for (let i = 0; i < 3; i++) plane(p, 1.6, 1.4, win, 4.18, 1.7, -2.2 + i * 2.2, 0, -Math.PI / 2);
      for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) { const x = -2.6 + c * 1.5, z = -0.6 + r * 1.35; desk(p, x, z, 0, "#f4d8a8", ["#1f6ad8", "#e83a5a", "#2fae7a"][(r + c) % 3]); chair(p, x, z + 0.48, Math.PI, ["#2ac8c0", "#ff8a3a", "#b08ae8"][(r + c) % 3]); }
      const td = desk(p, 2.2, -2.6, 0, "#a8784a", "#5a3a2a"); td.scale.set(1.6, 1, 1.2); chair(p, 2.2, -3.1, 0, "#5a3a2a");
      for (let i = 0; i < 6; i++) plane(p, 0.42, 0.52, M("#ffffff", 0.7, kidArtTex(i + 7)), -3.2 + i * 1.15, 2.3, 3.68, 0, Math.PI);
      plane(p, 0.6, 0.85, M("#ffffff", 0.7, posterTex(3)), -4.17, 1.8, -1.6, 0, Math.PI / 2);
      for (const [x, z] of [[-1.5, -1.5], [1.5, -1.5], [-1.5, 1.5], [1.5, 1.5]]) plane(p, 1.2, 0.5, E("#fffaf0", 1.4), x, 2.99, z, Math.PI / 2);
      const l1 = new THREE.PointLight("#fff2e0", 6, 10, 1.6); l1.position.set(-1, 2.8, 0); p.add(l1); }

    // ================= maison de Joël : cuisine (x < 0) + salon avec canapé et télé (x > 0)
    { const p = g.MAI; sun(p, V(-6, 7, 6), 2.2, 9, 0.9);
      room(p, 12, 6.4, 2.9, M("#f6f5f2", 0.9), new THREE.MeshStandardMaterial({ map: rep(woodTex("#c8945a"), 5, 3), roughness: 0.55 }), M("#fff6e8", 0.9));
      // cuisine : plan de travail, frigo, table, fenêtre sur la mer
      bx(p, 4.4, 0.95, 0.65, M("#3a4a5a", 0.5), -3.6, 0.47, -2.85, 0, 0.03); bx(p, 4.5, 0.06, 0.72, M("#f4ecdc", 0.4), -3.6, 0.97, -2.85); bx(p, 4.4, 0.8, 0.4, M("#3a4a5a", 0.5), -3.6, 2.1, -3.0, 0, 0.03);
      bx(p, 0.9, 2.0, 0.75, P("#f4f4f4", 0.25), -1.0, 1.0, -2.8, 0, 0.06); bx(p, 0.04, 0.5, 0.04, M("#b8bcc4", 0.2, undefined, { metalness: 0.9 }), -0.62, 1.3, -2.4);
      for (let i = 0; i < 3; i++) cyl(p, 0.1, 0.1, 0.22, M(["#e2262e", "#ffd21a", "#2a7ae8"][i], 0.4), -4.8 + i * 0.4, 1.11, -2.85, 14);
      { const t = grp(p, -3.4, 0, -0.4); cyl(t, 0.75, 0.75, 0.05, M("#ffffff", 0.6, rep(woodTex("#e8c898"), 1, 1)), 0, 0.76, 0, 28); cyl(t, 0.06, 0.25, 0.74, M("#5a3a2a", 0.5), 0, 0.37, 0, 10);
        add(t, new THREE.CylinderGeometry(0.06, 0.05, 0.12, 14), M("#ff8a3a", 0.4), 0.25, 0.85, 0.1); add(t, new THREE.CylinderGeometry(0.22, 0.22, 0.02, 20), M("#ffffff", 0.4), -0.2, 0.79, 0.15); }
      chair(p, -4.25, -0.4, Math.PI / 2, "#ff8a3a"); chair(p, -2.55, -0.4, -Math.PI / 2, "#2a7ae8");
      plane(p, 1.6, 1.2, new THREE.MeshBasicMaterial({ map: ctex("seaView", 320, 240, (q) => { const gr = q.createLinearGradient(0, 0, 0, 240); gr.addColorStop(0, "#5ab0f0"); gr.addColorStop(0.55, "#bfe6ff"); gr.addColorStop(0.56, "#1f8ad0"); gr.addColorStop(1, "#2a9ae0"); q.fillStyle = gr; q.fillRect(0, 0, 320, 240);
        q.fillStyle = "#f6f2ec"; q.fillRect(230, 60, 22, 74); q.fillStyle = "#e2262e"; for (let i = 0; i < 3; i++) q.fillRect(230, 60 + i * 25, 22, 12); q.fillStyle = "#ffd870"; q.fillRect(232, 48, 18, 12); }) }), -5.98, 1.75, -0.4, 0, Math.PI / 2);
      bx(p, 0.08, 1.35, 1.75, M("#ffffff", 0.5), -5.97, 1.75, -0.4).visible = false;
      // salon : canapé orange affaissé, table basse, sachets de chips, télé
      { const s = grp(p, 3.2, 0, 1.4, Math.PI); this.sofa = s; const so = new THREE.MeshPhysicalMaterial({ color: "#6e2a1c", roughness: 0.42, clearcoat: 0.5, clearcoatRoughness: 0.35, sheen: 0.3, sheenColor: new THREE.Color("#c8805a") }), sd = new THREE.MeshPhysicalMaterial({ color: "#7e3220", roughness: 0.38, clearcoat: 0.6, clearcoatRoughness: 0.3 });
        bx(s, 3.8, 0.42, 1.15, so, 0, 0.3, 0, 0, 0.12); bx(s, 3.8, 0.8, 0.32, so, 0, 0.8, -0.5, 0, 0.14); for (const x of [-2.05, 2.05]) { const ar = add(s, new THREE.CylinderGeometry(0.26, 0.26, 1.15, 20).rotateX(Math.PI / 2), so, x, 0.72, 0); ar.scale.x = 1.15; bx(s, 0.5, 0.5, 1.15, so, x, 0.35, 0, 0, 0.1); }
        for (const x of [-1.25, 0, 1.25]) { bx(s, 1.24, 0.2, 0.98, sd, x, 0.6, 0.06, 0, 0.09); bx(s, 1.2, 0.5, 0.2, sd, x, 0.98, -0.3, 0, 0.09); for (const [bx2, by] of [[-0.3, 1.05], [0.3, 1.05], [0, 0.88]]) add(s, new THREE.SphereGeometry(0.025, 8, 6), M("#3a140c", 0.4), x + bx2, by, -0.19); }
        for (const x of [-1.8, 1.8]) for (const z of [-0.45, 0.45]) cyl(s, 0.04, 0.03, 0.1, M("#2a1a10", 0.4), x, 0.05, z, 8);
        add(s, new THREE.BoxGeometry(0.5, 0.42, 0.14), M("#e8dcc8", 0.85), -1.5, 0.9, -0.25, 0.3).rotation.z = 0.2; }
      bx(p, 1.4, 0.4, 0.7, M("#ffffff", 0.6, rep(woodTex("#e8c898"), 1, 1)), 3.2, 0.2, 0.0, 0, 0.03);
      for (let i = 0; i < 4; i++) { const c = grp(p, 2.8 + i * 0.28, 0.42, -0.05 + (i % 2) * 0.15, i); bx(c, 0.24, 0.32, 0.06, M(["#e2262e", "#ffd21a", "#2a7ae8", "#2fae7a"][i], 0.4), 0, 0.16, 0, 0, 0.02).rotation.x = -1.2; this.chips.push(c); }
      bx(p, 2.2, 0.5, 0.5, M("#3a2a1e", 0.6), 3.2, 0.25, -2.85); bx(p, 2.0, 1.15, 0.08, M("#16181e", 0.35), 3.2, 1.2, -2.8);
      this.tvScreen = new THREE.MeshStandardMaterial({ color: "#000000", emissive: "#ffffff", emissiveIntensity: 0.8, map: null }); plane(p, 1.86, 1.02, this.tvScreen, 3.2, 1.2, -2.75);
      this.tvScreen.emissiveMap = ctex("tvFoot", 372, 204, (q) => { q.fillStyle = "#2fae5a"; q.fillRect(0, 0, 372, 204); q.strokeStyle = "#ffffff"; q.lineWidth = 3; q.strokeRect(20, 20, 332, 164); q.beginPath(); q.moveTo(186, 20); q.lineTo(186, 184); q.stroke(); q.beginPath(); q.arc(186, 102, 30, 0, 7); q.stroke(); q.fillStyle = "#ffffff"; q.font = "bold 22px sans-serif"; q.fillText("2 - 1", 20, 16); });
      add(p, new THREE.PlaneGeometry(3.2, 2.2).rotateX(-Math.PI / 2), M("#ffffff", 0.95, ctex("rugJ", 256, 176, (q) => { q.fillStyle = "#c8b8a0"; q.fillRect(0, 0, 256, 176); q.strokeStyle = "#8a6a4a"; q.lineWidth = 10; q.strokeRect(14, 14, 228, 148); })), 3.2, 0.006, 0.4, 0, false);
      { const l = grp(p, 5.3, 0, 1.6); cyl(l, 0.03, 0.03, 1.6, M("#2a2e36", 0.4), 0, 0.8, 0, 8); add(l, new THREE.CylinderGeometry(0.22, 0.32, 0.36, 18, 1, true), M("#fff2c8", 0.6, undefined, { side: THREE.DoubleSide, emissive: "#ffcf80", emissiveIntensity: 0.6 }), 0, 1.72, 0); }
      plane(p, 1.0, 0.7, M("#ffffff", 0.6, ctex("cadreP", 200, 140, (q) => { q.fillStyle = "#86c6f4"; q.fillRect(0, 0, 200, 140); q.fillStyle = "#1f8ad0"; q.fillRect(0, 90, 200, 50); q.fillStyle = "#f6f2ec"; q.fillRect(140, 30, 16, 60); q.fillStyle = "#e2262e"; q.fillRect(140, 45, 16, 10); q.fillRect(140, 70, 16, 10); q.strokeStyle = "#8a5a32"; q.lineWidth = 10; q.strokeRect(0, 0, 200, 140); })), 1.2, 1.8, -3.18);
      const l = new THREE.PointLight("#fff2e0", 5, 12, 1.6); l.position.set(0, 2.7, 0.5); p.add(l); }

    // ================= studio météo (x ~ 0) + boulangerie (x ~ 30)
    { const p = g.VILLE; sun(p, V(-4, 8, 10), 1.4, 12, 0.8);
      plane(p, 14, 10, M("#2a2e3a", 0.5), 0, 0, 0, -Math.PI / 2);
      { const mt = ctex("meteo", 1024, 492, (q) => { const gr = q.createLinearGradient(0, 0, 0, 492); gr.addColorStop(0, "#1a6ad8"); gr.addColorStop(1, "#5ab8f8"); q.fillStyle = gr; q.fillRect(0, 0, 1024, 492);
        q.fillStyle = "#5ac85a"; q.beginPath(); q.moveTo(300, 60); q.bezierCurveTo(520, 20, 700, 80, 720, 200); q.bezierCurveTo(760, 300, 690, 440, 520, 460); q.bezierCurveTo(380, 470, 300, 380, 260, 300); q.bezierCurveTo(220, 200, 230, 100, 300, 60); q.fill(); q.strokeStyle = "#ffffff"; q.lineWidth = 6; q.stroke();
        const sunI = (x: number, y: number, r: number) => { q.fillStyle = "#ffd21a"; q.beginPath(); q.arc(x, y, r, 0, 7); q.fill(); q.strokeStyle = "#ffd21a"; q.lineWidth = 8; for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; q.beginPath(); q.moveTo(x + Math.cos(a) * r * 1.3, y + Math.sin(a) * r * 1.3); q.lineTo(x + Math.cos(a) * r * 1.7, y + Math.sin(a) * r * 1.7); q.stroke(); } };
        sunI(420, 180, 40); sunI(600, 330, 34); sunI(380, 380, 30); q.fillStyle = "#ffffff"; q.font = "900 64px Montserrat, 'DejaVu Sans', sans-serif"; q.fillText("DEMAIN", 770, 110); q.font = "900 90px Montserrat, 'DejaVu Sans', sans-serif"; q.fillText("24°", 800, 230); }); plane(p, 7.5, 3.6, new THREE.MeshStandardMaterial({ map: mt, emissive: "#ffffff", emissiveMap: mt, emissiveIntensity: 0.6, roughness: 0.4 }), 0, 2.3, -3.5); }
      bx(p, 8, 4.2, 0.2, M("#16181e", 0.4), 0, 2.3, -3.65); plane(p, 14, 5, M("#1c2030", 0.8), 0, 2.5, -3.8);
      { const d = grp(p, -2.6, 0, -0.6, 0.4); bx(d, 1.6, 1.0, 0.6, P("#2a5cb8", 0.3), 0, 0.5, 0, 0, 0.05); plane(d, 1.3, 0.3, M("#ffffff", 0.5, signTex("m6", "MÉTÉO", "#ffd21a", "#16181e", 512, 128, 80)), 0, 0.65, 0.31); }
      { const c = grp(p, 1.8, 0, 3.2, Math.PI + 0.3); for (let i = 0; i < 3; i++) { const a = i / 3 * Math.PI * 2; const lg = cyl(c, 0.03, 0.03, 1.5, M("#2a2e36", 0.4), Math.cos(a) * 0.35, 0.7, Math.sin(a) * 0.35, 6); lg.rotation.set(Math.sin(a) * 0.3, 0, -Math.cos(a) * 0.3); }
        bx(c, 0.5, 0.45, 0.8, M("#2a2e36", 0.35), 0, 1.6, 0, 0, 0.05); cyl(c, 0.15, 0.15, 0.3, M("#16181e", 0.3), 0, 1.6, 0.5, 14).rotation.x = Math.PI / 2; add(c, new THREE.SphereGeometry(0.04, 8, 6), E("#ff2a2a", 3), 0.15, 1.85, 0.2); }
      for (const x of [-4.5, 4.5]) { const l = grp(p, x, 0, 2.2); cyl(l, 0.04, 0.04, 2.8, M("#2a2e36", 0.4), 0, 1.4, 0, 8); bx(l, 0.6, 0.5, 0.4, M("#2a2e36", 0.4), 0, 2.9, 0); add(l, new THREE.CircleGeometry(0.2, 16), E("#fff6e0", 3), 0, 2.9, 0.21); const sl = new THREE.PointLight("#fff4e0", 5, 9, 1.5); sl.position.set(0, 2.8, -0.5); l.add(sl); }
      // boulangerie
      const b = grp(p, 30, 0, 0); room(b, 7, 5.4, 3.1, new THREE.MeshStandardMaterial({ map: rep(stripesTex("#fff0d0", "#ffe4b8", 14), 3, 1), roughness: 0.9 }), new THREE.MeshStandardMaterial({ map: rep(tileTex("#f4e4c8", "#c8462e", 6), 4, 3), roughness: 0.5 }), M("#fff6e8", 0.9));
      bx(b, 4.6, 1.05, 0.8, M("#a8784a", 0.6, rep(woodTex("#a8784a"), 2, 1)), 0, 0.52, -0.6, 0, 0.04); bx(b, 4.6, 0.3, 0.8, new THREE.MeshPhysicalMaterial({ color: "#dff2ff", roughness: 0.05, transparent: true, opacity: 0.18 }), 0, 1.2, -0.6, 0, 0.02);
      for (let i = 0; i < 14; i++) add(b, new THREE.SphereGeometry(0.1, 12, 10), M(["#e8a050", "#ff8ab8", "#7a4a2a", "#ffd27a", "#f4f0e8"][i % 5], 0.5), -2.0 + i * 0.3, 1.16, -0.6 + (i % 2) * 0.18).scale.y = 0.6;
      for (let r = 0; r < 3; r++) { bx(b, 4.4, 0.06, 0.45, M("#a8784a", 0.6), 0, 1.0 + r * 0.6, -2.45); for (let k = 0; k < 8; k++) { const bg = mkBaguette(); bg.position.set(-1.9 + k * 0.54, 1.1 + r * 0.6, -2.45); bg.rotation.set(0, Math.PI / 2, 0.4); bg.scale.setScalar(1.0); b.add(bg); } }
      plane(b, 3.6, 0.7, M("#ffffff", 0.5, signTex("boul", "BOULANGERIE", "#c4283a", "#fff6e0", 1024, 200, 120)), 0, 2.75, -2.68);
      bx(b, 0.5, 0.35, 0.4, M("#2a2e36", 0.35), 1.6, 1.25, -0.6, 0, 0.04); const l = new THREE.PointLight("#fff0d8", 6, 10, 1.5); l.position.set(0, 2.8, 0.5); b.add(l); }
  }
}
