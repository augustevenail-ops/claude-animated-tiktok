// Ville de nuit autour de l'hôpital : îlots d'immeubles (fenêtres allumées irrégulières), rues, lampadaires, voitures qui roulent au loin,
// fumées d'incendies, hélicoptère avec projecteur qui balaie, arbres du parvis. Rien n'est posé dans le parking x ∈ [-80 ; 80], z ∈ [-75 ; -3].
import * as THREE from "three";
import { ctex } from "../bridge/paint";
import { NOINK } from "../bridge/ink";
import { lam } from "../bridge/build";
import { hash } from "./story";

const glowTex = (rgb: string) => ctex("ci_glow" + rgb, 128, 128, (g) => {
  const r = g.createRadialGradient(64, 64, 0, 64, 64, 64); r.addColorStop(0, `rgba(${rgb},0.95)`); r.addColorStop(0.3, `rgba(${rgb},0.35)`); r.addColorStop(1, `rgba(${rgb},0)`); g.fillStyle = r; g.fillRect(0, 0, 128, 128);
});
/** façade d'immeuble : 6 x 12 fenêtres, murs variés (variante k) ; emissive = fenêtres allumées seulement */
const bldTex = (k: number, lit: boolean) => ctex(`ci_bld${k}${lit ? "L" : ""}`, 256, 512, (g) => {
  const walls = ["#6d7178", "#7a6f66", "#5d6670", "#8a8278", "#4f555e", "#75695f"];
  g.fillStyle = lit ? "#000" : walls[k % walls.length]; g.fillRect(0, 0, 256, 512);
  if (!lit) for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(${hash(i, k) < 0.5 ? "20,20,24" : "255,255,255"},${0.03 + hash(i, k + 9) * 0.05})`; g.fillRect(hash(i, k + 3) * 256, hash(i, k + 4) * 512, 20 + hash(i, k + 5) * 60, 8 + hash(i, k + 6) * 30); }
  for (let i = 0; i < 6; i++) for (let j = 0; j < 12; j++) {
    const x = 14 + i * 40, y = 14 + j * 41, h = hash(i * 13 + j * 7, 31 + k), on = h < 0.42;
    const col = h < 0.18 ? "#ffd08a" : h < 0.3 ? "#cfe4ff" : h < 0.36 ? "#ff9a5a" : h < 0.42 ? "#9fd0ff" : "#141a24";
    if (lit) { g.fillStyle = on ? col : "#000"; g.fillRect(x, y, 26, 28); if (on && hash(i, j + k) < 0.3) { g.fillStyle = "rgba(0,0,0,0.75)"; g.fillRect(x + 8, y + 10, 10, 18); } }   // silhouettes
    else { g.fillStyle = "#2a3038"; g.fillRect(x - 2, y - 2, 30, 32); g.fillStyle = on ? col : "#141a24"; g.fillRect(x, y, 26, 28); g.fillStyle = "rgba(255,255,255,0.12)"; g.fillRect(x, y, 26, 3); }
  }
});

export class City {
  root = new THREE.Group();
  private cars: THREE.Points; private carDat: { ax: "x" | "z"; c: number; v: number; o: number; red: boolean }[] = [];
  private smoke: THREE.Points; private heli: THREE.Group; private beam: THREE.Mesh; private heliLamp: THREE.Mesh; private lamps: THREE.Points;
  constructor() {
    const R = this.root, geo = new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0);
    // UV de la boîte : la texture couvre chaque face une fois ; la répétition suit la taille via instanceMatrix (approximation acceptable de loin)
    const mats = [0, 1, 2, 3, 4, 5].map((k) => { const m = lam("ci_bld" + k, () => ({ color: "#ffffff", map: bldTex(k, false), emissive: "#ffffff", emissiveIntensity: 1.4, emissiveMap: bldTex(k, true) })); m.name = "ci_bld"; return m; });
    const lists: THREE.Matrix4[][] = mats.map(() => []);
    const roofs: THREE.Matrix4[] = [];
    const STEP = 46, ST = 14;                                   // îlots de 46 m, rues de 14 m
    for (let i = -14; i <= 14; i++) for (let j = -16; j <= 4; j++) {
      const bx = i * STEP, bz = -40 + j * STEP;
      for (let q = 0; q < 4; q++) {                              // 4 immeubles par îlot (2 x 2)
        const w = (STEP - ST) / 2 - 1 - hash(i * 31 + j, q) * 3, d = (STEP - ST) / 2 - 1 - hash(i * 17 + j, q + 4) * 3;
        const x = bx + (q % 2 ? 1 : -1) * ((STEP - ST) / 4 + 0.3), z = bz + (q < 2 ? 1 : -1) * ((STEP - ST) / 4 + 0.3);
        if (Math.abs(x) < 95 && z > -95 && z < 45) continue;    // hôpital + parking + parvis
        const far = Math.hypot(x, z + 150) / 400, h = 9 + hash(i * 7 + j * 3, q + 8) ** 2 * (60 - 25 * Math.min(1, far)) + (hash(i, j + q) < 0.06 ? 50 : 0);
        const m = new THREE.Matrix4().compose(new THREE.Vector3(x, 0, z), new THREE.Quaternion(), new THREE.Vector3(w, h, d));
        lists[Math.floor(hash(i * 5 + j * 11, q + 2) * 6)].push(m);
        roofs.push(new THREE.Matrix4().compose(new THREE.Vector3(x + (hash(i, q) - 0.5) * w * 0.4, h, z + (hash(j, q) - 0.5) * d * 0.4), new THREE.Quaternion(), new THREE.Vector3(2 + hash(i + q, j) * 3, 1.2 + hash(i, j * q) * 2, 2 + hash(j + q, i) * 3)));   // édicules de toit
      }
    }
    mats.forEach((m, k) => { const im = new THREE.InstancedMesh(geo, m, lists[k].length); lists[k].forEach((mm, q) => im.setMatrixAt(q, mm)); im.castShadow = false; im.receiveShadow = true; R.add(im); });
    { const im = new THREE.InstancedMesh(geo, lam("ci_roof", () => ({ color: "#3a3e46" })), roofs.length); roofs.forEach((mm, q) => im.setMatrixAt(q, mm)); R.add(im); }
    // trottoirs (bordures claires le long des rues)
    { const pts: THREE.Matrix4[] = [];
      for (let i = -14; i <= 14; i++) for (let j = -16; j <= 4; j++) { const bx = i * STEP, bz = -40 + j * STEP; if (Math.abs(bx) < 95 && bz > -95 && bz < 45) continue;
        pts.push(new THREE.Matrix4().compose(new THREE.Vector3(bx, 0, bz), new THREE.Quaternion(), new THREE.Vector3(STEP - ST + 2, 0.15, STEP - ST + 2))); }
      const im = new THREE.InstancedMesh(geo, lam("ci_walk", () => ({ color: "#5a5e64" })), pts.length); pts.forEach((mm, q) => im.setMatrixAt(q, mm)); R.add(im); }
    // lampadaires des rues : halos orangés (points)
    { const n = 900, g = new THREE.BufferGeometry(), a = new Float32Array(n * 3);
      for (let q = 0; q < n; q++) { const alongX = q % 2 === 0, line = Math.floor(hash(q, 41) * 30) - 15, p = (hash(q, 42) - 0.5) * 1300;
        const c = alongX ? -40 + line * STEP + STEP / 2 : line * STEP + STEP / 2; a.set(alongX ? [p, 7, c + (hash(q, 43) < 0.5 ? -6 : 6)] : [c + (hash(q, 43) < 0.5 ? -6 : 6), 7, -300 + p * 0.55], q * 3); }
      g.setAttribute("position", new THREE.BufferAttribute(a, 3));
      this.lamps = new THREE.Points(g, new THREE.PointsMaterial({ map: glowTex("255,190,120"), size: 9, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: true }));
      this.lamps.layers.set(NOINK); this.lamps.frustumCulled = false; R.add(this.lamps); }
    // voitures qui roulent : phares blancs / feux rouges (points animés)
    { const n = 160, g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(n * 3), 3));
      for (let q = 0; q < n; q++) this.carDat.push({ ax: q % 2 ? "x" : "z", c: (Math.floor(hash(q, 51) * 28) - 14) * STEP + STEP / 2 + (q % 2 ? -40 : 0) + (hash(q, 52) < 0.5 ? -3 : 3), v: (6 + hash(q, 53) * 9) * (hash(q, 54) < 0.5 ? -1 : 1), o: hash(q, 55) * 1300, red: hash(q, 56) < 0.5 });
      this.cars = new THREE.Points(g, new THREE.PointsMaterial({ map: glowTex("255,245,225"), size: 3.2, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, vertexColors: true }));
      g.setAttribute("color", new THREE.BufferAttribute(new Float32Array(this.carDat.flatMap((c) => (c.red ? [1, 0.18, 0.12] : [1, 0.95, 0.85]))), 3));
      this.cars.layers.set(NOINK); this.cars.frustumCulled = false; R.add(this.cars); }
    // fumées d'incendies au loin (colonnes de points sombres + lueur orange au pied)
    { const n = 420, g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(n * 3), 3));
      this.smoke = new THREE.Points(g, new THREE.PointsMaterial({ map: glowTex("40,38,44"), size: 40, transparent: true, opacity: 0.55, depthWrite: false })); this.smoke.layers.set(NOINK); this.smoke.frustumCulled = false; R.add(this.smoke);
      for (const [x, z] of FIRES) { const f = new THREE.Mesh(new THREE.PlaneGeometry(70, 70), new THREE.MeshBasicMaterial({ map: glowTex("255,110,40"), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
        f.position.set(x, 12, z); f.layers.set(NOINK); f.userData.fire = true; R.add(f); } }
    // arbres du parvis et du parking (cônes sombres)
    { const trunk = lam("ci_trunk", () => ({ color: "#3a2e26" })), leaf = lam("ci_leaf", () => ({ color: "#2c3e34" }));
      const tg = new THREE.CylinderGeometry(0.2, 0.28, 3, 6).translate(0, 1.5, 0), lg = new THREE.IcosahedronGeometry(2.2, 0).translate(0, 4.3, 0);
      const spots: [number, number][] = []; for (let q = 0; q < 26; q++) spots.push([(q % 13 - 6) * 11 + (hash(q, 61) - 0.5) * 3, q < 13 ? -72 : -46 - (q % 2) * 4]);
      for (const [x, z] of [[-85, -20], [-85, -40], [85, -20], [85, -40], [-85, -60], [85, -60]] as [number, number][]) spots.push([x, z]);
      const it = new THREE.InstancedMesh(tg, trunk, spots.length), il = new THREE.InstancedMesh(lg, leaf, spots.length);
      spots.forEach(([x, z], q) => { const s = 0.8 + hash(q, 62) * 0.5, m = new THREE.Matrix4().compose(new THREE.Vector3(x, 0, z), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), hash(q, 63) * 6), new THREE.Vector3(s, s, s)); it.setMatrixAt(q, m); il.setMatrixAt(q, m); });
      it.castShadow = il.castShadow = true; R.add(it, il); }
    // hélicoptère + projecteur
    this.heli = new THREE.Group();
    { const body = new THREE.Mesh(new THREE.CapsuleGeometry(1.1, 3, 4, 8).rotateZ(Math.PI / 2), lam("ci_heli", () => ({ color: "#1c2028" })));
      const tail = new THREE.Mesh(new THREE.BoxGeometry(5, 0.35, 0.35).translate(-4, 0.3, 0), lam("ci_heli", () => ({ color: "#1c2028" })));
      this.heliLamp = new THREE.Mesh(new THREE.PlaneGeometry(6, 6), new THREE.MeshBasicMaterial({ map: glowTex("255,60,50"), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); this.heliLamp.layers.set(NOINK); this.heliLamp.position.set(0, -1, 0);
      this.beam = new THREE.Mesh(new THREE.ConeGeometry(9, 70, 24, 1, true).translate(0, -35, 0), new THREE.MeshBasicMaterial({ color: "#dfefff", transparent: true, opacity: 0.12, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
      this.beam.layers.set(NOINK); this.heli.add(body, tail, this.heliLamp, this.beam); R.add(this.heli); }
  }
  update(t: number, cam: THREE.Camera) {
    const a = this.cars.geometry.getAttribute("position") as THREE.BufferAttribute;
    this.carDat.forEach((c, q) => { const p = ((c.o + c.v * t) % 1300 + 1300) % 1300 - 650; if (c.ax === "x") a.setXYZ(q, p, 0.8, c.c); else a.setXYZ(q, c.c, 0.8, -300 + p * 0.55); }); a.needsUpdate = true;
    const s = this.smoke.geometry.getAttribute("position") as THREE.BufferAttribute;
    for (let q = 0; q < s.count; q++) { const [x, z] = FIRES[q % FIRES.length], k = ((hash(q, 71) + t * 0.05) % 1); s.setXYZ(q, x + (hash(q, 72) - 0.5) * 20 * (1 + k * 4) + k * 60, 10 + k * 160, z + (hash(q, 73) - 0.5) * 20 * (1 + k * 3)); } s.needsUpdate = true;
    this.root.children.forEach((o) => { if (o.userData.fire) { o.lookAt(cam.position); ((o as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = 0.7 + 0.3 * Math.sin(t * 7 + o.position.x); } });
    const ang = t * 0.25; this.heli.position.set(60 * Math.cos(ang) - 20, 70, -140 + 50 * Math.sin(ang)); this.heli.rotation.y = -ang;
    this.beam.rotation.set(0.35 * Math.sin(t * 0.7), 0, 0.3 * Math.cos(t * 0.5)); (this.heliLamp.material as THREE.MeshBasicMaterial).opacity = Math.sin(t * 6) > 0.6 ? 1 : 0.1; this.heliLamp.lookAt(cam.position);
  }
}
const FIRES: [number, number][] = [[-230, -380], [180, -520], [320, -210], [-400, -150]];
