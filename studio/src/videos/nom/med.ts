// « Le Nom qui rapporte » : ville méditerranéenne (crépi pastel saturé, toits plats ou en tuiles, arcades, palmiers),
// grande place avec mairie à arcades + manoir doré de Lamonnaie + chorale, classe chaude, bureau de la mairie, pièces qui tombent.
import * as THREE from "three";
import { ctex, hash, signTex, stoneTex } from "./tex";
import { V, M, P, E, rep, bx, cyl, plane, grp, room, desk, chair, add, tileTex, stripesTex, woodTex, kidArtTex, posterTex, Crowd } from "./sets";

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

/** pièces d'or instanciées (une source = cible, nombre, date de départ, rayon, reste au sol ?) */
export type CoinSrc = { p: THREE.Vector3; n: number; t0: number; r: number; dur?: number; stay?: boolean; h?: number };
export class Coins { im: THREE.InstancedMesh; private d = new THREE.Object3D(); constructor(parent: THREE.Object3D, n = 600) {
    this.im = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.11, 0.11, 0.03, 16), new THREE.MeshPhysicalMaterial({ color: "#ffc828", metalness: 0.9, roughness: 0.25, emissive: "#a86a00", emissiveIntensity: 0.35 }), n);
    this.im.castShadow = false; this.im.frustumCulled = false; this.im.userData.noEdge = true; this.im.count = 0; parent.add(this.im); }
  set(t: number, srcs: CoinSrc[], pile?: { p: THREE.Vector3; n: number; r: number; h: number }) { let k = 0; const d = this.d;
    if (pile) for (let i = 0; i < pile.n && k < this.im.instanceMatrix.count; i++) { const a = hash(i, 21) * Math.PI * 2, rr = pile.r * Math.sqrt(hash(i, 22)), y = pile.h * (1 - rr / pile.r) * (0.85 + 0.15 * hash(i, 23));
      d.position.set(pile.p.x + Math.cos(a) * rr, pile.p.y + y, pile.p.z + Math.sin(a) * rr); d.rotation.set((hash(i, 24) - 0.5) * 0.8, a, (hash(i, 25) - 0.5) * 0.8); d.scale.setScalar(1); d.updateMatrix(); this.im.setMatrixAt(k++, d.matrix); }
    for (const s of srcs) for (let i = 0; i < s.n && k < this.im.instanceMatrix.count; i++) { const ts = s.t0 + hash(i, 7) * (s.dur ?? 1.2), dt = t - ts, H = (s.h ?? 3.2) + hash(i, 8) * 1.5, fall = Math.sqrt(H / 4.9);
        if (dt < 0 || (!s.stay && dt > fall)) continue; const a = hash(i, 9) * Math.PI * 2, rr = s.r * Math.sqrt(hash(i, 10)), done = dt >= fall;
        d.position.set(s.p.x + Math.cos(a) * rr, done ? s.p.y + 0.02 + hash(i, 11) * 0.06 : s.p.y + H - 4.9 * dt * dt, s.p.z + Math.sin(a) * rr); d.rotation.set(done ? 0 : dt * 9 + i, done ? a : dt * 5, 0); d.scale.setScalar(1); d.updateMatrix(); this.im.setMatrixAt(k++, d.matrix); }
    this.im.count = k; this.im.instanceMatrix.needsUpdate = true; } }

/** chorale : figures en robe violette, instanciées, deux dispositions (devant le manoir / sur la grande place) */
export class Choir { root = new THREE.Group(); meshes: THREE.InstancedMesh[] = []; private d = new THREE.Object3D(); n: number;
  constructor(n = 200) { this.n = n; const robe = (i: number) => ["#7a3ab8", "#8a4ac8", "#6a2aa8"][i % 3];
    const parts: [THREE.BufferGeometry, (i: number) => string][] = [[new THREE.CylinderGeometry(0.2, 0.36, 1.3, 8).translate(0, 0.65, 0), robe], [new THREE.BoxGeometry(0.62, 0.12, 0.34).translate(0, 1.28, 0), () => "#ffffff"],
      [new THREE.BoxGeometry(0.36, 0.34, 0.34).translate(0, 1.55, 0), (i) => ["#f7d6bd", "#f5d0b0", "#e8b890", "#c98a5c", "#8a5a3c"][i % 5]], [new THREE.BoxGeometry(0.38, 0.12, 0.36).translate(0, 1.76, -0.02), (i) => ["#2a1d16", "#6b4426", "#c8a060", "#d8d4cc"][i % 4]],
      [new THREE.BoxGeometry(0.3, 0.38, 0.06).translate(0, 1.02, 0.3), () => "#c4283a"]];
    for (const [g, c] of parts) { const im = new THREE.InstancedMesh(g, M("#ffffff", 0.7), n); im.castShadow = true; im.userData.noEdge = true; for (let i = 0; i < n; i++) im.setColorAt(i, new THREE.Color(c(i))); this.root.add(im); this.meshes.push(im); }
    const face = new THREE.MeshStandardMaterial({ map: ctex("choirFace", 64, 64, (q) => { q.clearRect(0, 0, 64, 64); q.fillStyle = "#1b1410"; q.beginPath(); q.ellipse(20, 26, 4, 5, 0, 0, 7); q.ellipse(44, 26, 4, 5, 0, 0, 7); q.fill(); q.beginPath(); q.ellipse(32, 44, 7, 8, 0, 0, 7); q.fill(); }), transparent: true, roughness: 0.6 });
    const fm = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.34, 0.34).translate(0, 1.55, 0.176), face, n); fm.userData.noEdge = true; this.root.add(fm); this.meshes.push(fm); }
  /** rows x cols sur des gradins ; origine (x,z), orientation yaw, sing = balancement */
  set(t: number, x: number, z: number, yaw: number, rows: number, sing = 1) { const d = this.d, cols = Math.ceil(this.n / rows), f = V(Math.sin(yaw), 0, Math.cos(yaw)), r = V(Math.cos(yaw), 0, -Math.sin(yaw));
    for (let i = 0; i < this.n; i++) { const row = Math.floor(i / cols), c = i % cols; const pz = -row * 0.85, px = (c - (cols - 1) / 2) * 0.7 + (row % 2) * 0.35;
      d.position.set(x + r.x * px + f.x * pz, (row + 1) * 0.38 + Math.max(0, Math.sin(t * 4 + i * 0.7)) * 0.05 * sing, z + r.z * px + f.z * pz); d.rotation.set(0, yaw + Math.sin(t * 2 + i) * 0.06 * sing, 0); d.updateMatrix(); for (const m of this.meshes) m.setMatrixAt(i, d.matrix); }
    for (const m of this.meshes) m.instanceMatrix.needsUpdate = true; } }

/** étiquette flottante dont la police s'adapte à la longueur du texte */
export const label = (text: string, col: string, w = 2.4) => { const t = ctex("lab_" + text, 1024, 192, (q) => { q.clearRect(0, 0, 1024, 192); let fs = 120; q.font = `900 ${fs}px Montserrat, 'DejaVu Sans', sans-serif`; while (q.measureText(text).width > 960 && fs > 30) { fs -= 4; q.font = `900 ${fs}px Montserrat, 'DejaVu Sans', sans-serif`; }
    q.textAlign = "center"; q.textBaseline = "middle"; q.lineWidth = Math.max(8, fs * 0.15); q.lineJoin = "round"; q.strokeStyle = "#1a1420"; q.strokeText(text, 512, 100); q.fillStyle = col; q.fillText(text, 512, 100); });
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthTest: false, fog: false, toneMapped: false })); s.scale.set(w, w * 0.1875, 1); s.renderOrder = 20; s.visible = false; return s; };

export class Med {
  suns: [THREE.DirectionalLight, number][] = []; skies: THREE.MeshBasicMaterial[] = []; labels: Record<string, THREE.Sprite> = {}; parent!: THREE.Object3D;
  posters: THREE.Mesh[] = []; coinsV!: Coins; coinsP!: Coins; coinsC!: Coins; choir!: Choir; choirSteps: THREE.Group[] = []; crowd!: Crowd; bus!: THREE.Group; pony!: THREE.Group; tv!: THREE.MeshStandardMaterial;
  stamp!: THREE.Mesh; doc!: THREE.Mesh; board!: THREE.Mesh; boardM!: THREE.MeshStandardMaterial;
  constructor(g: Record<string, THREE.Group>, root: THREE.Object3D) {
    for (const [k, t, c] of [["bart", "Barthélémy-Aurélien", "#ffffff"], ["toi", "« toi »", "#ffffff"], ["e0", "0 €", "#ff5a5a"], ["e1", "+1 €", "#ffd21a"], ["e1b", "+1 €", "#ffd21a"], ["bonjour", "BONJOUR", "#ffd21a"], ["merci", "MERCI", "#7cf07a"], ["lamo", "Lamonnaie", "#ffd21a"], ["idee", "!", "#ffd21a"]] as [string, string, string][]) { const l = label(t, c); root.add(l); this.labels[k] = l; }
    const sun = (p: THREE.Group, pos: THREE.Vector3, i: number, size: number, hi = 1.15, col = "#fff0d8") => { const s = new THREE.DirectionalLight(col, i); this.suns.push([s, i]); s.position.copy(pos); s.target.position.set(0, 0, 0); s.castShadow = true; s.shadow.mapSize.set(2048, 2048);
      const c = s.shadow.camera; c.left = c.bottom = -size; c.right = c.top = size; c.near = 0.5; c.far = 140; s.shadow.bias = -0.0004; s.shadow.normalBias = 0.02; s.shadow.radius = 4; p.add(s, s.target); p.add(new THREE.HemisphereLight("#cfe6ff", "#e8c8a0", hi)); };
    const sky = (p: THREE.Group) => { const mm = new THREE.MeshBasicMaterial({ map: skyMed(), side: THREE.BackSide, fog: false }); this.skies.push(mm); const m = new THREE.Mesh(new THREE.SphereGeometry(300, 32, 16), mm); m.userData.noEdge = true; p.add(m); };
    const poster = (p: THREE.Object3D, x: number, y: number, z: number, ry: number) => { const m = plane(p, 1.4, 1.9, M("#ffffff", 0.8, ctex("interdit", 280, 380, (q) => { q.fillStyle = "#fff6e0"; q.fillRect(0, 0, 280, 380); q.strokeStyle = "#c4283a"; q.lineWidth = 14; q.strokeRect(10, 10, 260, 360);
      q.fillStyle = "#c4283a"; q.font = "900 46px Montserrat, 'DejaVu Sans', sans-serif"; q.textAlign = "center"; ["IL EST", "INTERDIT", "DE DIRE"].forEach((l, i) => q.fillText(l, 140, 80 + i * 56)); q.font = "900 52px Montserrat, 'DejaVu Sans', sans-serif"; q.fillText("BONJOUR", 140, 270); q.lineWidth = 10; q.beginPath(); q.moveTo(30, 300); q.lineTo(250, 240); q.stroke();
      q.fillStyle = "#2a2a30"; q.font = "bold 22px sans-serif"; q.fillText("— Le Maire", 140, 345); })), x, y, z, 0, ry); m.visible = false; this.posters.push(m); return m; };

    // ================= rue
    { const p = g.VILLE; sun(p, V(25, 40, 22), 3.3, 42); sky(p);
      plane(p, 400, 400, M("#e8d8b8", 0.95), 0, -0.02, 0, -Math.PI / 2);
      plane(p, 140, 7, M("#ffffff", 0.9, rep(cobbleTex(), 40, 2)), 0, 0.005, 0, -Math.PI / 2);
      for (const s of [-1, 1]) bx(p, 140, 0.16, 1.5, M("#f0e4cc", 0.85), 0, 0.08, s * 4.25, 0, 0.02);
      const ws = [7, 6, 8, 6.5, 7.5, 6, 7];
      for (const side of [-1, 1]) { let x = -62, k = side > 0 ? 3 : 0; while (x < 62) { const w = ws[k % ws.length], h = [6.2, 9.2, 6.2, 9.2, 12.2][(k * 3 + (side > 0 ? 1 : 0)) % 5];
          const shop = side > 0 && Math.abs(x + w / 2 + 10) < 3.5 ? { sign: "BOULANGERIE", col: "#c4283a" } : side > 0 && Math.abs(x + w / 2 - 22) < 3.5 ? { sign: "ÉPICERIE", col: "#2a8a4a" } : side < 0 && Math.abs(x + w / 2 + 24) < 3.5 ? { sign: "CAFÉ", col: "#1f6ad8" } : undefined;
          medHouse(p, x + w / 2, side * 8.5, side < 0 ? 0 : Math.PI, w - 0.06, h, k * 7 + (side > 0 ? 3 : 1), shop); x += w; k++; } }
      for (let x = -56; x <= 56; x += 14) { palm(p, x, -4.3, 1.0, x); palm(p, x + 7, 4.3, 0.95, x + 3); }
      for (let i = 0; i < 18; i++) { const a = -Math.PI * 0.95 + i * 0.11 * Math.PI, r = 70 + hash(i, 1) * 30; medHouse(p, Math.sin(a) * r, Math.cos(a) * r, Math.atan2(-Math.sin(a), -Math.cos(a)), 9, 9 + (i % 3) * 3, 40 + i); }
      for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2, r = 150; const hl = add(p, new THREE.SphereGeometry(45, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), M(["#c8b070", "#b8a868", "#a8b870"][i % 3], 0.95), Math.cos(a) * r, -8, Math.sin(a) * r, 0, false); hl.scale.y = 0.4; }
      // arrêt de bus + bus turquoise
      { const sh = grp(p, 14, 0, 4.6); for (const x of [-1.4, 1.4]) cyl(sh, 0.05, 0.05, 2.4, M("#e83a5a", 0.4), x, 1.2, 0.35, 8); bx(sh, 3.1, 0.12, 1.0, M("#e83a5a", 0.4), 0, 2.45, 0); bx(sh, 2.2, 0.08, 0.36, M("#f2b51c", 0.6), 0, 0.48, 0.2); }
      const b = grp(p, 6, 0, 1.7, -Math.PI / 2); this.bus = b; const y = P("#2ac8c0", 0.3), dk = new THREE.MeshPhysicalMaterial({ color: "#16202c", roughness: 0.05, clearcoat: 1 });
      bx(b, 2.5, 2.5, 10, y, 0, 1.75, 0, 0, 0.25); bx(b, 2.52, 0.9, 9.2, dk, 0, 2.15, -0.3, 0, 0.05).castShadow = false; bx(b, 2.2, 1.0, 0.06, dk, 0, 2.1, 5.0, 0, 0.03); bx(b, 2.54, 0.2, 10.02, M("#ffffff", 0.5), 0, 1.35, 0, 0, 0.03); bx(b, 0.06, 1.9, 1.1, dk, 1.27, 1.5, 3.6, 0, 0.02);
      for (const [x, z] of [[-1.15, 3.2], [1.15, 3.2], [-1.15, -3.2], [1.15, -3.2]]) add(b, new THREE.CylinderGeometry(0.5, 0.5, 0.35, 20).rotateZ(Math.PI / 2), M("#1a1a1e", 0.8), x, 0.5, z);
      for (const x of [-0.8, 0.8]) add(b, new THREE.SphereGeometry(0.13, 12, 8), E("#fff6d0", 2), x, 1.0, 5.02); plane(b, 1.6, 0.36, M("#ffffff", 0.5, signTex("bus7", "7  PORT", "#16202c", "#ffd21a", 512, 128, 70)), 0, 2.78, 5.04);
      // affiches « interdit de dire bonjour »
      for (const [x, s] of [[-3, -1], [5, 1], [-15, 1], [12, -1], [19, 1], [-8, -1]] as [number, number][]) poster(p, x, 1.9, s * 5.02, s < 0 ? 0 : Math.PI);
      // poney de Pardon
      { const pn = grp(p, 0, 0, 0); this.pony = pn; const fur = M("#f4e8d8", 0.75), mane = M("#ff7ab0", 0.7); bx(pn, 0.55, 0.55, 1.2, fur, 0, 0.85, 0, 0, 0.15); bx(pn, 0.36, 0.7, 0.36, fur, 0, 1.35, 0.6, 0, 0.1); bx(pn, 0.34, 0.32, 0.55, fur, 0, 1.65, 0.85, 0, 0.1);
        for (const [x, zz] of [[-0.18, 0.42], [0.18, 0.42], [-0.18, -0.42], [0.18, -0.42]]) bx(pn, 0.14, 0.6, 0.14, fur, x, 0.3, zz, 0, 0.04); bx(pn, 0.12, 0.7, 0.5, mane, 0, 1.55, 0.45, 0, 0.05); bx(pn, 0.12, 0.5, 0.12, mane, 0, 0.85, -0.65, 0, 0.04);
        for (const x of [-0.12, 0.12]) add(pn, new THREE.SphereGeometry(0.035, 8, 6), M("#1a1410", 0.3), x, 1.72, 1.13); bx(pn, 0.6, 0.06, 0.5, M("#e83a5a", 0.5), 0, 1.15, -0.05, 0, 0.02); pn.visible = false; }
      this.coinsV = new Coins(p); }

    // ================= grande place
    { const p = g.PL; sun(p, V(-28, 46, 18), 3.3, 46); sky(p);
      plane(p, 400, 400, M("#e8d8b8", 0.95), 0, -0.02, 0, -Math.PI / 2);
      plane(p, 76, 96, M("#ffffff", 0.8, rep(tileTex("#f0dcb8", "#d86a3a", 6), 20, 26)), 0, 0, 4, -Math.PI / 2);
      // mairie à arcades + campanile
      { const m = grp(p, 4, 0, -32), wall = M("#f0b860", 0.85), trim = M("#fff4e0", 0.6), tm = M("#ffffff", 0.8, rep(terraTex(), 8, 3));
        bx(m, 30, 13, 12, wall, 0, 6.5, 0, 0, 0.05); bx(m, 30.6, 0.6, 12.6, trim, 0, 13.2, 0); const rf = add(m, new THREE.CylinderGeometry(0.01, 30 * 0.66, 4, 4, 1).rotateY(Math.PI / 4), tm, 0, 15.5, 0); rf.scale.set(1, 1, 12 / 30);
        for (let i = 0; i < 7; i++) { const x = -12 + i * 4; bx(m, 0.9, 5, 0.9, trim, x - 2, 2.5, 6.4); const arch = add(m, new THREE.TorusGeometry(1.55, 0.35, 8, 20, Math.PI), trim, x, 5, 6.4); arch.castShadow = true; plane(m, 3.1, 5, M("#5a3a2a", 0.9), x, 2.5, 5.98); }
        bx(m, 0.9, 5, 0.9, trim, 14, 2.5, 6.4); bx(m, 30, 0.5, 1.4, trim, 0, 6.8, 6.3);
        const gm = new THREE.MeshPhysicalMaterial({ color: "#8ac4ec", roughness: 0.05, clearcoat: 1, emissive: "#2a5a7a", emissiveIntensity: 0.25 });
        for (let c = 0; c < 7; c++) { const x = -12 + c * 4; plane(m, 1.8, 3.0, gm, x, 9.8, 6.03); bx(m, 2.4, 0.2, 0.5, trim, x, 8.2, 6.2); for (const s of [-1, 1]) bx(m, 0.8, 3.0, 0.08, M("#1f6ad8", 0.5), x + s * 1.35, 9.8, 6.06); }
        plane(m, 9, 1.4, M("#ffffff", 0.5, signTex("mairie2", "MAIRIE", "#7a2a1a", "#ffe8b0", 1024, 160, 110)), 0, 12.0, 6.08);
        const t = grp(m, 17.5, 0, 0); bx(t, 6, 24, 6, wall, 0, 12, 0, 0, 0.05); bx(t, 6.6, 0.5, 6.6, trim, 0, 24.2, 0); for (const s of [-1, 1]) { plane(t, 2.4, 3.5, M("#3a2a20", 0.9), 0, 20.5, s * 3.02, 0, s < 0 ? Math.PI : 0); plane(t, 2.4, 3.5, M("#3a2a20", 0.9), s * 3.02, 20.5, 0, 0, s * Math.PI / 2); }
        add(t, new THREE.SphereGeometry(0.9, 16, 12), M("#d8a830", 0.3, undefined, { metalness: 0.9 }), 0, 20.2, 0); add(t, new THREE.ConeGeometry(4.5, 4.5, 4).rotateY(Math.PI / 4), tm, 0, 26.7, 0);
        const ck = grp(t, 0, 16.5, 3.05); add(ck, new THREE.CylinderGeometry(1.6, 1.6, 0.15, 32).rotateX(Math.PI / 2), M("#fffaf0", 0.4), 0, 0, 0); add(ck, new THREE.TorusGeometry(1.6, 0.14, 8, 32), P("#7a2a1a", 0.3), 0, 0, 0.08); bx(ck, 0.1, 1.0, 0.04, M("#2a2a30", 0.5), 0, 0.42, 0.12, 0, 0.02); const hh = bx(ck, 0.12, 0.8, 0.04, M("#2a2a30", 0.5), 0.28, 0.2, 0.13, 0, 0.02); hh.rotation.z = -1.2;
        for (let s = 0; s < 3; s++) bx(m, 18 - s * 1.5, 0.3, 1.2, M("#e8dcc8", 0.8), 0, 0.15 + s * 0.3, 7.6 + (2 - s) * 0.6 - 1.2); }
      // manoir de Lamonnaie (côté gauche, façade vers +x) + grille dorée
      { const m = grp(p, -30, 0, -2, Math.PI / 2), wall = M("#fbf6ee", 0.6), gold = M("#f2c230", 0.25, undefined, { metalness: 0.9, emissive: "#8a5a00", emissiveIntensity: 0.25 });
        bx(m, 22, 14, 10, wall, 0, 7, 0, 0, 0.05); bx(m, 22.8, 0.8, 10.6, gold, 0, 14.4, 0); bx(m, 14, 4, 9, wall, 0, 16.8, 0, 0, 0.05); add(m, new THREE.CylinderGeometry(0.01, 9, 4, 3, 1).rotateZ(Math.PI / 2).rotateY(Math.PI / 2), wall, 0, 16.6, 5.4).scale.set(1, 0.6, 0.15);
        for (let i = 0; i < 6; i++) { const x = -7.5 + i * 3; cyl(m, 0.55, 0.6, 10, wall, x, 5, 6.2, 20); bx(m, 1.5, 0.5, 1.5, gold, x, 10.2, 6.2); bx(m, 1.5, 0.5, 1.5, M("#e8e0d0", 0.6), x, 0.25, 6.2); }
        bx(m, 20, 1.2, 2.4, wall, 0, 11, 6.2); const gm = new THREE.MeshPhysicalMaterial({ color: "#8ac4ec", roughness: 0.05, clearcoat: 1, emissive: "#2a5a7a", emissiveIntensity: 0.3 });
        for (let r = 0; r < 2; r++) for (let c = 0; c < 6; c++) { if (r === 0 && (c === 2 || c === 3)) continue; plane(m, 1.6, 2.8, gm, -8 + c * 3.2, 3 + r * 5.5, 5.03); bx(m, 2.0, 0.25, 0.3, gold, -8 + c * 3.2, 4.55 + r * 5.5, 5.1); }
        bx(m, 3.2, 5.5, 0.12, P("#2a1a10", 0.35), 0, 2.75, 5.06); add(m, new THREE.TorusGeometry(1.4, 0.18, 10, 30), gold, 0, 12.4, 7.45);
        plane(m, 2.0, 2.0, M("#ffffff", 0.4, ctex("Lgold", 128, 128, (q) => { q.clearRect(0, 0, 128, 128); q.fillStyle = "#f2c230"; q.font = "900 110px serif"; q.textAlign = "center"; q.textBaseline = "middle"; q.fillText("L", 64, 70); }), { transparent: true, emissive: "#8a5a00", emissiveIntensity: 0.4 }), 0, 12.4, 7.5);
        for (let i = 0; i < 4; i++) bx(m, 24 - i * 1.6, 0.35, 1.0, M("#f0ece4", 0.6), 0, 0.17 + i * 0.35, 9.5 - i * 0.8);
        const gate = grp(m, 0, 0, 16); for (let i = 0; i < 31; i++) { const x = -15 + i; if (Math.abs(x) < 2.2) continue; cyl(gate, 0.05, 0.05, 2.6, gold, x, 1.3, 0, 6); add(gate, new THREE.ConeGeometry(0.1, 0.25, 6), gold, x, 2.7, 0); } bx(gate, 30, 0.1, 0.1, gold, 0, 2.3, 0); bx(gate, 30, 0.1, 0.1, gold, 0, 0.4, 0);
        for (const x of [-2.6, 2.6]) { bx(gate, 0.6, 3.4, 0.6, wall, x, 1.7, 0); add(gate, new THREE.SphereGeometry(0.4, 14, 10), gold, x, 3.7, 0); } }
      // gradins de la chorale devant le manoir (3 marches) + gradins mobiles sur la place
      const steps = (x: number, z: number, yaw: number) => { const s = grp(p, x, 0, z, yaw); for (let r = 0; r < 8; r++) bx(s, 18, 0.38 * (r + 1), 0.85, M(["#e8dcc8", "#d8ccb8"][r % 2], 0.8), 0, 0.19 * (r + 1), -r * 0.85 + 0.42); this.choirSteps.push(s); return s; };
      steps(-12.6, -2, -Math.PI / 2); steps(0, -15.5, 0);
      this.choir = new Choir(200); p.add(this.choir.root);
      // fontaine obélisque, terrasses de café, palmiers, guirlandes lumineuses
      { const f = grp(p, 15, 0, -12); const st = M("#f4ecdc", 0.6); add(f, new THREE.CylinderGeometry(2.4, 2.5, 0.6, 8), st, 0, 0.3, 0); add(f, new THREE.CylinderGeometry(2.1, 2.1, 0.1, 8), new THREE.MeshPhysicalMaterial({ color: "#3cc8e8", roughness: 0.05, clearcoat: 1, emissive: "#1a6a8a", emissiveIntensity: 0.3 }), 0, 0.58, 0, 0, false);
        bx(f, 0.9, 1.0, 0.9, st, 0, 1.1, 0, 0, 0.05); add(f, new THREE.CylinderGeometry(0.15, 0.4, 5, 4).rotateY(Math.PI / 4), st, 0, 4.1, 0); add(f, new THREE.SphereGeometry(0.3, 12, 8), M("#f2c230", 0.3, undefined, { metalness: 0.9 }), 0, 6.8, 0); }
      for (const [x, z] of [[26, 6], [26, 14], [-20, 40], [26, 26]] as [number, number][]) { const c = grp(p, x, 0, z); cyl(c, 0.5, 0.5, 0.06, M("#ffffff", 0.5), 0, 0.75, 0, 16); cyl(c, 0.05, 0.05, 0.75, M("#2a2e36", 0.4), 0, 0.37, 0, 6); cyl(c, 0.04, 0.04, 2.3, M("#ffffff", 0.5), 0, 1.15, 0, 6);
        add(c, new THREE.ConeGeometry(1.5, 0.6, 8, 1, true), M(["#e83a5a", "#1f6ad8", "#2fae7a"][Math.abs(x + z) % 3], 0.6, undefined, { side: THREE.DoubleSide }), 0, 2.4, 0); }
      for (const [x, z] of [[-24, -20], [26, -22], [-26, 34], [27, 36], [27, -2], [-25, 12]] as [number, number][]) palm(p, x, z, 1.25, x * z);
      for (const z of [0, 14, 28]) for (let i = 0; i < 26; i++) { const x = -26 + i * 2.1, y = 8 - Math.sin((i + 0.5) / 26 * Math.PI) * 1.4; add(p, new THREE.SphereGeometry(0.16, 8, 6), E(["#fff2b0", "#ffd080", "#ffb8d0"][i % 3], 1.6), x, y, z, 0, false); }
      // maisons autour
      for (let i = 0; i < 5; i++) medHouse(p, 32, 10 + i * 8, -Math.PI / 2, 8, [9.2, 12.2, 6.2][i % 3], 60 + i);
      for (let i = 0; i < 3; i++) medHouse(p, 32, -24 + i * 8, -Math.PI / 2, 8, [12.2, 9.2, 6.2][i % 3], 70 + i);
      for (let i = 0; i < 4; i++) medHouse(p, -32, 20 + i * 8, Math.PI / 2, 8, [9.2, 6.2, 12.2][i % 3], 75 + i);
      for (let i = 0; i < 7; i++) medHouse(p, -24 + i * 8, 50, Math.PI, 8, [9.2, 12.2, 6.2, 9.2][i % 4], 80 + i);
      // écran géant (star de la télé)
      { const s = grp(p, 31.2, 0, -8, -Math.PI / 2); bx(s, 9, 5.4, 0.4, M("#16181e", 0.4), 0, 9.5, 3.8); this.tv = new THREE.MeshStandardMaterial({ map: ctex("tvstar", 512, 300, (q) => { const gr = q.createLinearGradient(0, 0, 512, 300); gr.addColorStop(0, "#ff3a8a"); gr.addColorStop(1, "#7a3ab8"); q.fillStyle = gr; q.fillRect(0, 0, 512, 300);
          q.fillStyle = "#ffd21a"; q.font = "900 64px Montserrat, 'DejaVu Sans', sans-serif"; q.textAlign = "center"; q.fillText("★ JORDY ★", 256, 110); q.fillStyle = "#ffffff"; q.font = "bold 40px sans-serif"; q.fillText("« JORDY ! JORDY ! »", 256, 180); q.fillStyle = "#ffd21a"; q.font = "900 46px sans-serif"; q.fillText("+ 1 000 000 €", 256, 250); }), emissive: "#ffffff", emissiveIntensity: 0.0, emissiveMap: null, roughness: 0.4 });
        this.tv.emissiveMap = this.tv.map; this.tv.emissiveIntensity = 0.9; plane(s, 8.4, 4.9, this.tv, 0, 9.5, 4.02); for (const x of [-3.5, 3.5]) cyl(s, 0.15, 0.15, 7, M("#2a2e36", 0.5), x, 3.5, 3.8, 8); }
      for (const [x, z, ry] of [[31.9, 18, -Math.PI / 2], [31.9, 34, -Math.PI / 2], [-31.9, 26, Math.PI / 2], [8, -25.9, 0], [-8, 46.4, Math.PI]] as [number, number, number][]) poster(p, x, 1.9, z, ry);
      this.crowd = new Crowd(1700, -12, 23.5, -6.5, 34); p.add(this.crowd.root); this.coinsP = new Coins(p, 700); }

    // ================= classe (couleurs chaudes)
    { const p = g.CL2; sun(p, V(8, 6, 2), 2.5, 7, 0.8, "#fff2dc");
      room(p, 8.4, 7.4, 3.0, new THREE.MeshStandardMaterial({ map: rep(stripesTex("#ffcf8a", "#ffbf6a", 16), 4, 1), roughness: 0.9 }), new THREE.MeshStandardMaterial({ map: rep(woodTex("#d8a060"), 4, 4), roughness: 0.6 }), M("#fff0d8", 0.9));
      bx(p, 8.4, 1.0, 0.03, M("#e8603a", 0.6), 0, 0.5, -3.69); bx(p, 0.03, 1.0, 7.4, M("#e8603a", 0.6), -4.19, 0.5, 0);
      this.boardM = M("#ffffff", 0.9, ctex("appel", 1024, 400, (q) => { q.fillStyle = "#1f3a5a"; q.fillRect(0, 0, 1024, 400); q.fillStyle = "#f6f4ec"; q.font = "bold 80px 'Comic Sans MS', 'DejaVu Sans', cursive"; q.textAlign = "center"; q.fillText("L'appel", 512, 100);
        q.font = "bold 56px 'Comic Sans MS', 'DejaVu Sans', cursive"; q.textAlign = "left"; ["Lucas  ✓", "Fatou  ✓", "Inès  ✓"].forEach((n, i) => q.fillText(n, 120, 190 + i * 70)); ["Noah  ✓", "Pardon  ✓", "Toi  ?"].forEach((n, i) => q.fillText(n, 600, 190 + i * 70)); }));
      this.board = plane(p, 4.2, 1.6, this.boardM, -0.3, 1.75, -3.67); bx(p, 4.4, 1.8, 0.04, M("#8a5a3a", 0.5), -0.3, 1.75, -3.7);
      const win = new THREE.MeshPhysicalMaterial({ color: "#bfe6f8", roughness: 0.05, emissive: "#8ac8f0", emissiveIntensity: 0.6 }); for (let i = 0; i < 3; i++) { plane(p, 1.6, 1.4, win, 4.18, 1.7, -2.2 + i * 2.2, 0, -Math.PI / 2); bx(p, 0.1, 1.5, 1.7, M("#ffffff", 0.5), 4.16, 1.7, -2.2 + i * 2.2).visible = false; }
      for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) { const x = -2.6 + c * 1.5, z = -0.6 + r * 1.35; desk(p, x, z, 0, "#f4d8a8", ["#1f6ad8", "#e83a5a", "#2fae7a"][(r + c) % 3]); chair(p, x, z + 0.48, Math.PI, ["#2ac8c0", "#ff8a3a", "#b08ae8"][(r + c) % 3]); }
      const td = desk(p, 2.2, -2.6, 0, "#a8784a", "#5a3a2a"); td.scale.set(1.6, 1, 1.2); chair(p, 2.2, -3.1, 0, "#5a3a2a");
      for (let i = 0; i < 6; i++) plane(p, 0.42, 0.52, M("#ffffff", 0.7, kidArtTex(i + 7)), -3.2 + i * 1.15, 2.3, 3.68, 0, Math.PI);
      plane(p, 0.6, 0.85, M("#ffffff", 0.7, posterTex(3)), -4.17, 1.8, -1.6, 0, Math.PI / 2);
      for (const [x, z] of [[-1.5, -1.5], [1.5, -1.5], [-1.5, 1.5], [1.5, 1.5]]) plane(p, 1.2, 0.5, E("#fffaf0", 1.4), x, 2.99, z, Math.PI / 2);
      const l1 = new THREE.PointLight("#fff2e0", 6, 10, 1.6); l1.position.set(-1, 2.8, 0); p.add(l1); this.coinsC = new Coins(p, 300); }

    // ================= bureau de la mairie (changement de nom)
    { const p = g.MAI; sun(p, V(-5, 6, 5), 2.2, 7, 0.85);
      room(p, 7, 6, 3.2, new THREE.MeshStandardMaterial({ map: rep(stripesTex("#9ae0c8", "#86d4bc", 14), 3, 1), roughness: 0.9 }), new THREE.MeshStandardMaterial({ map: rep(tileTex("#f4e4c8", "#d8c4a0", 6), 4, 4), roughness: 0.5 }), M("#fff6e8", 0.9));
      bx(p, 4.6, 1.1, 0.8, M("#a8784a", 0.6, rep(woodTex("#a8784a"), 2, 1)), 0, 0.55, -0.6, 0, 0.04); bx(p, 4.8, 0.08, 1.0, M("#f4ecdc", 0.5), 0, 1.14, -0.6, 0, 0.02);
      this.doc = plane(p, 0.5, 0.36, M("#ffffff", 0.6, ctex("docnom", 300, 216, (q) => { q.fillStyle = "#fffdf6"; q.fillRect(0, 0, 300, 216); q.fillStyle = "#2a2a30"; q.font = "bold 20px sans-serif"; q.textAlign = "center"; q.fillText("CHANGEMENT DE NOM", 150, 36);
        q.font = "16px sans-serif"; q.fillText("Ancien : Barthélémy-Aurélien", 150, 80); q.font = "bold 26px sans-serif"; q.fillText("Nouveau : BONJOUR", 150, 125); q.strokeStyle = "#c4283a"; q.lineWidth = 5; q.beginPath(); q.arc(230, 175, 30, 0, 7); q.stroke(); q.fillStyle = "#c4283a"; q.font = "bold 14px sans-serif"; q.fillText("VALIDÉ", 230, 180); })), 0.3, 1.185, -0.5, -Math.PI / 2, 0);
      this.stamp = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.22, 12), M("#c4283a", 0.4)); this.stamp.position.set(0.7, 1.3, -0.6); p.add(this.stamp);
      for (let i = 0; i < 3; i++) { bx(p, 0.9, 1.6, 0.6, M("#c8ccd4", 0.4, undefined, { metalness: 0.5 }), -3.0 + i * 0.95, 0.8, -2.65); for (let k = 0; k < 3; k++) bx(p, 0.4, 0.06, 0.04, M("#2a2e36", 0.4), -3.0 + i * 0.95, 0.4 + k * 0.5, -2.33); }
      plane(p, 1.6, 1.0, M("#ffffff", 0.5, signTex("etat", "ÉTAT CIVIL", "#1f6ad8", "#ffffff", 512, 160, 80)), 1.6, 2.3, -2.98);
      { const pl = grp(p, 2.9, 0, -2.4); cyl(pl, 0.25, 0.2, 0.5, M("#d8683a", 0.7), 0, 0.25, 0, 12); add(pl, new THREE.IcosahedronGeometry(0.55, 1), M("#3e9a42", 0.8), 0, 1.0, 0); }
      const l = new THREE.PointLight("#fff2e0", 5, 9, 1.6); l.position.set(0, 2.8, 0.5); p.add(l); }
  }
}
