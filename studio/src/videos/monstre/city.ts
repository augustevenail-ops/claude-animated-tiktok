// Le Monstre : la place (dalles 3 m), routes, trottoirs, immeubles, gratte-ciel, lampadaires, 6 tours de projecteurs
// en treillis, enceinte circulaire, ciel. Unité : 1 = 1 m. Place centrée sur l'origine, rue d'accès vers +Z.
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { hash } from "./tex";
import { slabTex, slabBump, slabRough, asphaltTex, asphaltBump, sidewalkTex, hazardTex, concreteTex, steelTex, steelRough, facadeNight, towerNight, ledTex, nightSky, haloTex, rep } from "./mtex";
import { Beam } from "./beams";

export const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const msh = (g: THREE.BufferGeometry, m: THREE.Material | THREE.Material[], x = 0, y = 0, z = 0, cast = true) => { const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.castShadow = cast; o.receiveShadow = true; return o; };
const S = (p: THREE.MeshStandardMaterialParameters) => new THREE.MeshStandardMaterial({ roughness: 0.8, ...p });

export const HALF = 54;           // demi-côté de la place
export const ROAD = 14;           // largeur des routes
export const TOWER_R = 40, TOWER_H = 38, MON_TARGET = V(0, 19, 0);
export const STREET_X = 0;        // rue d'accès : x ∈ [-8, 8], z > HALF + ROAD

/** une tour de projecteurs : treillis fusionné (4 montants, traverses, croix), socle béton à bandes, plateforme, 4 projecteurs */
export class Tower {
  root = new THREE.Group(); heads: THREE.Group[] = []; lens: THREE.MeshStandardMaterial; beams: Beam[] = []; spot: THREE.SpotLight; on = 1;
  constructor(steel: THREE.Material, base: THREE.Material[], plat: THREE.Material, idx: number) {
    const w = 3.0, H = TOWER_H, seg = 4.2, n = Math.floor((H - 2) / seg), parts: THREE.BufferGeometry[] = [];
    const strut = (a: THREE.Vector3, b: THREE.Vector3, t: number) => { const d = b.clone().sub(a), L = d.length(); const g = new THREE.BoxGeometry(t, L, t); const q = new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), d.normalize()); g.applyQuaternion(q); const m = a.clone().add(b).multiplyScalar(0.5); g.translate(m.x, m.y, m.z); parts.push(g); };
    const c = (sx: number, sz: number, y: number) => { const k = 1 - (y / H) * 0.28; return V(sx * w * k / 2, y, sz * w * k / 2); };
    const corners: [number, number][] = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
    for (const [sx, sz] of corners) strut(c(sx, sz, 1.5), c(sx, sz, H), 0.34);
    for (let i = 0; i <= n; i++) { const y = 1.5 + i * seg, y2 = Math.min(H, y + seg);
      for (let k = 0; k < 4; k++) { const [ax, az] = corners[k], [bx, bz] = corners[(k + 1) % 4]; strut(c(ax, az, y), c(bx, bz, y), 0.2);
        if (i < n) { strut(c(ax, az, y), c(bx, bz, y2), 0.14); strut(c(bx, bz, y), c(ax, az, y2), 0.14); } } }
    // échelle sur une face
    for (let y = 2; y < H; y += 0.5) strut(V(-0.35, y, w * (1 - y / H * 0.28) / 2 + 0.25), V(0.35, y, w * (1 - y / H * 0.28) / 2 + 0.25), 0.05);
    strut(V(-0.35, 1.5, w / 2 + 0.25), V(-0.35, H, w * 0.72 / 2 + 0.25), 0.07); strut(V(0.35, 1.5, w / 2 + 0.25), V(0.35, H, w * 0.72 / 2 + 0.25), 0.07);
    const lattice = msh(mergeGeometries(parts), steel); this.root.add(lattice);
    // socle béton + bandes jaune/noir
    this.root.add(msh(new RoundedBoxGeometry(5.6, 1.6, 5.6, 2, 0.12), base, 0, 0.8, 0));
    // plateforme
    const P = new THREE.Group(); P.position.y = H; this.root.add(P);
    P.add(msh(new THREE.BoxGeometry(6.4, 0.35, 6.4), plat, 0, 0, 0));
    const rail: THREE.BufferGeometry[] = [];
    for (const [x0, z0, x1, z1] of [[-3.1, -3.1, 3.1, -3.1], [3.1, -3.1, 3.1, 3.1], [3.1, 3.1, -3.1, 3.1], [-3.1, 3.1, -3.1, -3.1]]) {
      for (const y of [0.6, 1.15]) { const g = new THREE.BoxGeometry(Math.abs(x1 - x0) + 0.08, 0.07, Math.abs(z1 - z0) + 0.08); g.translate((x0 + x1) / 2, y, (z0 + z1) / 2); rail.push(g); }
      for (let t = 0; t <= 4; t++) { const g = new THREE.BoxGeometry(0.07, 1.15, 0.07); g.translate(x0 + (x1 - x0) * t / 4, 0.6, z0 + (z1 - z0) * t / 4); rail.push(g); } }
    P.add(msh(mergeGeometries(rail), steel));
    P.add(msh(new THREE.BoxGeometry(1.4, 1.2, 1.0), steel, 2.2, 0.75, -2.2)); // armoire électrique
    // 4 projecteurs rectangulaires orientables (2 x 2)
    this.lens = S({ color: "#ffffff", map: ledTex(), emissive: "#ffffff", emissiveMap: ledTex(), emissiveIntensity: 9, roughness: 0.3 });
    const housing = S({ color: "#1d1f24", map: steelTex(), roughness: 0.45, metalness: 0.7 });
    for (let k = 0; k < 4; k++) {
      const hd = new THREE.Group(); hd.position.set((k % 2 - 0.5) * 2.7, 1.45 + Math.floor(k / 2) * 1.7, 2.3 - Math.floor(k / 2) * 1.2); P.add(hd); this.heads.push(hd);
      const body = new THREE.Group(); hd.add(body);
      body.add(msh(new RoundedBoxGeometry(2.3, 1.45, 1.1, 2, 0.08), housing, 0, 0, -0.2));
      for (let f = 0; f < 5; f++) body.add(msh(new THREE.BoxGeometry(0.06, 1.3, 0.7), housing, -0.9 + f * 0.45, 0, -0.95)); // ailettes de refroidissement
      const lf = msh(new THREE.PlaneGeometry(2.05, 1.22), this.lens, 0, 0, 0.36, false); body.add(lf);
      body.add(msh(new THREE.BoxGeometry(2.4, 0.12, 0.5), housing, 0, 0.78, 0.25)); // visière
      hd.add(msh(new THREE.BoxGeometry(0.16, 0.9, 0.16), housing, -1.25, -0.4, -0.2)); hd.add(msh(new THREE.BoxGeometry(0.16, 0.9, 0.16), housing, 1.25, -0.4, -0.2)); // fourche
    }
    void idx;
    this.spot = new THREE.SpotLight("#f4f7ff", 0, 160, 0.32, 0.55, 0); this.spot.position.set(0, H + 2.3, 2.0); this.root.add(this.spot, this.spot.target);
  }
  aim(target: THREE.Vector3) {
    this.root.updateMatrixWorld(true);
    for (const h of this.heads) h.lookAt(target);
    this.spot.target.position.copy(this.root.worldToLocal(target.clone())); this.spot.target.updateMatrixWorld();
  }
}

export class City {
  root = new THREE.Group(); towers: Tower[] = []; towerGroup = new THREE.Group(); fence = new THREE.Group(); beams = new THREE.Group();
  sky: THREE.Mesh; hemi: THREE.HemisphereLight; moon: THREE.DirectionalLight; lampHalos: THREE.Mesh[] = []; winMats: THREE.MeshStandardMaterial[] = [];
  constructor() {
    const R = this.root;
    // ciel
    this.sky = new THREE.Mesh(new THREE.SphereGeometry(1500, 48, 24), new THREE.MeshBasicMaterial({ map: nightSky(), side: THREE.BackSide, fog: false, depthWrite: false }));
    this.sky.rotation.y = 1.2; R.add(this.sky);
    this.hemi = new THREE.HemisphereLight("#5868b8", "#1a1622", 0.55); R.add(this.hemi);
    this.moon = new THREE.DirectionalLight("#8fa0ff", 0.35); this.moon.position.set(-120, 200, -160); R.add(this.moon, this.moon.target);
    // sol : place en dalles
    const slab = S({ map: rep(slabTex(), 36, 36), bumpMap: rep(slabBump(), 36, 36), bumpScale: 1.4, roughnessMap: rep(slabRough(), 36, 36), roughness: 0.85 });
    const sq = new THREE.Shape(); const h = HALF, r = 6; sq.moveTo(-h + r, -h); sq.lineTo(h - r, -h); sq.quadraticCurveTo(h, -h, h, -h + r); sq.lineTo(h, h - r); sq.quadraticCurveTo(h, h, h - r, h); sq.lineTo(-h + r, h); sq.quadraticCurveTo(-h, h, -h, h - r); sq.lineTo(-h, -h + r); sq.quadraticCurveTo(-h, -h, -h + r, -h);
    const sg = new THREE.ShapeGeometry(sq, 8); sg.rotateX(-Math.PI / 2); const uv = sg.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, (uv.getX(i) + h) / (2 * h), (uv.getY(i) + h) / (2 * h));
    const square = msh(sg, slab, 0, 0.12, 0, false); R.add(square);
    // bordure de la place
    const curb = S({ map: concreteTex(), color: "#c9c9c9", roughness: 0.8 });
    for (const [x, z, w, d] of [[0, -h - 0.4, 2 * h, 0.8], [0, h + 0.4, 2 * h, 0.8], [-h - 0.4, 0, 0.8, 2 * h], [h + 0.4, 0, 0.8, 2 * h]] as const) R.add(msh(new THREE.BoxGeometry(w, 0.3, d), curb, x, 0.1, z));
    // asphalte (grand plan) + trottoirs autour des îlots
    const asph = S({ map: rep(asphaltTex(), 120, 120), bumpMap: rep(asphaltBump(), 160, 160), bumpScale: 0.8, roughness: 0.92, color: "#9aa0aa" });
    R.add(msh(new THREE.PlaneGeometry(1600, 1600).rotateX(-Math.PI / 2), asph, 0, 0, 0, false));
    const walk = S({ map: rep(sidewalkTex(), 1, 1), roughness: 0.85 });
    this.paint(R);
    // îlots d'immeubles autour de la place (laisser les rues : x=0 vers +Z et -Z, z=0 vers ±X)
    const inner = h + ROAD, rng = (i: number, k: number) => hash(i, k);
    const walls = ["#8b8a86", "#7a6a5c", "#a89a82", "#6f6a66", "#9b8670", "#5f5a58", "#b0a58e", "#7c7064"];
    let bi = 0;
    const block = (x0: number, z0: number, x1: number, z1: number, facing: THREE.Vector3) => {
      // trottoir
      const sw = msh(new THREE.BoxGeometry(x1 - x0 + 8, 0.25, z1 - z0 + 8), walk, (x0 + x1) / 2, 0.12, (z0 + z1) / 2, false); (sw.material as THREE.MeshStandardMaterial).map!.repeat.set(1, 1);
      const wm = walk.clone(); wm.map = rep(sidewalkTex(), (x1 - x0 + 8) / 4, (z1 - z0 + 8) / 4); sw.material = wm; R.add(sw);
      // immeubles le long de la face tournée vers la place
      const alongX = Math.abs(facing.z) > 0.5, len = alongX ? x1 - x0 : z1 - z0;
      let p = 0;
      while (p < len - 6) {
        const bw = Math.min(len - p, 12 + rng(bi, 1) * 14), bd = 16 + rng(bi, 2) * 10, bh = 16 + rng(bi, 3) * 34, floors = Math.max(4, Math.round(bh / 3.4));
        const cx = alongX ? x0 + p + bw / 2 : (facing.x > 0 ? x0 + bd / 2 + 1 : x1 - bd / 2 - 1), cz = alongX ? (facing.z > 0 ? z0 + bd / 2 + 1 : z1 - bd / 2 - 1) : z0 + p + bw / 2;
        this.building(R, cx, cz, alongX ? bw - 0.6 : bd, bh, alongX ? bd : bw - 0.6, facing, walls[bi % walls.length], floors, bi);
        p += bw; bi++;
      }
    };
    const far = inner + 60;
    block(-far, -far, -9, -inner - 4, V(0, 0, 1)); block(9, -far, far, -inner - 4, V(0, 0, 1));
    block(-far, inner + 4, -9, far, V(0, 0, -1)); block(9, inner + 4, far, far, V(0, 0, -1));
    block(-far, -inner + 6, -inner - 4, -9, V(1, 0, 0)); block(-far, 9, -inner - 4, inner - 6, V(1, 0, 0));
    block(inner + 4, -inner + 6, far, -9, V(-1, 0, 0)); block(inner + 4, 9, far, inner - 6, V(-1, 0, 0));
    // rue d'accès vers +Z : immeubles des deux côtés
    for (let z = far + 6, i = 0; z < far + 260; i++) { const bw = 14 + hash(i, 40) * 10;
      this.building(R, -8 - 4 - 9, z + bw / 2, 18, 18 + hash(i, 41) * 30, bw - 0.6, V(1, 0, 0), walls[(i + 3) % 8], 6 + (i % 5), 200 + i);
      this.building(R, 8 + 4 + 9, z + bw / 2, 18, 16 + hash(i, 42) * 30, bw - 0.6, V(-1, 0, 0), walls[(i + 5) % 8], 5 + (i % 6), 300 + i);
      const sw1 = msh(new THREE.BoxGeometry(5, 0.25, bw), walk, -10.5, 0.12, z + bw / 2, false), sw2 = sw1.clone(); sw2.position.x = 10.5; R.add(sw1, sw2);
      z += bw; }
    // gratte-ciel en couronne
    for (let i = 0; i < 46; i++) {
      const a = (i / 46) * Math.PI * 2 + hash(i, 50) * 0.08, d = 190 + hash(i, 51) * 260, H = 70 + hash(i, 52) * 170, W = 18 + hash(i, 53) * 26;
      const x = Math.cos(a) * d, z = Math.sin(a) * d; if (Math.abs(x) < 30 && z > 0) continue;
      const t = towerNight(i % 7, 10, Math.round(H / 4), 0.25 + hash(i, 54) * 0.25);
      const m = S({ map: t.map, emissive: "#ffffff", emissiveMap: t.em, emissiveIntensity: 1.6, roughness: 0.25, metalness: 0.6 }); this.winMats.push(m);
      const top = S({ color: "#1a1d26", roughness: 0.6 });
      const b = msh(new THREE.BoxGeometry(W, H, W), [m, m, top, top, m, m], x, H / 2, z, false); b.rotation.y = hash(i, 55) * 1.5; R.add(b);
      if (hash(i, 56) < 0.5) { const s = msh(new THREE.BoxGeometry(W * 0.6, H * 0.15, W * 0.6), [m, m, top, top, m, m], x, H + H * 0.075, z, false); s.rotation.y = b.rotation.y; R.add(s); }
      if (hash(i, 57) < 0.6) { const red = new THREE.Mesh(new THREE.SphereGeometry(0.8, 8, 6), new THREE.MeshBasicMaterial({ color: "#ff2a2a" })); red.position.set(x, H + (hash(i, 56) < 0.5 ? H * 0.15 : 0) + 1, z); R.add(red); }
    }
    // lampadaires (lueur jaune chaude, flaques de lumière au sol sans lumière réelle)
    const lampPost = S({ color: "#1e2026", roughness: 0.5, metalness: 0.6 }), bulb = new THREE.MeshStandardMaterial({ color: "#ffd49a", emissive: "#ffc47a", emissiveIntensity: 8 });
    const pool = new THREE.MeshBasicMaterial({ map: haloTex(), color: "#ffb35a", transparent: true, opacity: 0.38, blending: THREE.AdditiveBlending, depthWrite: false });
    const lamp = (x: number, z: number, ry: number) => { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; R.add(g);
      g.add(msh(new THREE.CylinderGeometry(0.12, 0.18, 7, 8), lampPost, 0, 3.5, 0)); g.add(msh(new THREE.BoxGeometry(0.12, 0.12, 1.8), lampPost, 0, 7, 0.8));
      g.add(msh(new THREE.BoxGeometry(0.5, 0.18, 0.9), lampPost, 0, 6.95, 1.6)); const b = msh(new THREE.BoxGeometry(0.4, 0.06, 0.75), bulb, 0, 6.84, 1.6, false); g.add(b);
      const p = new THREE.Mesh(new THREE.PlaneGeometry(9, 9).rotateX(-Math.PI / 2), pool); p.position.set(0, 0.3, 1.6); g.add(p); this.lampHalos.push(p); };
    for (let k = -2; k <= 2; k++) { const s = k * 24; lamp(s, -h - 3, 0); lamp(s, h + 3, Math.PI); lamp(-h - 3, s, Math.PI / 2); lamp(h + 3, s, -Math.PI / 2); }
    for (let z = h + 30; z < h + 280; z += 22) { lamp(-9.5, z, Math.PI / 2); lamp(9.5, z + 11, -Math.PI / 2); }
    // voitures garées et arbres cubiques le long de la rue d'accès
    const carCols = ["#b83a32", "#e8e6e0", "#2a4a7a", "#3a3d44", "#d9a62a", "#5a6b52"];
    for (let i = 0; i < 12; i++) { const z = h + 24 + i * 19 + hash(i, 90) * 6, side = i % 2 ? 1 : -1; if (hash(i, 91) < 0.25) continue;
      R.add(car(carCols[i % carCols.length], side * 6.2, z, side > 0 ? Math.PI : 0, i)); }
    const trunk = S({ color: "#5a3e2a", roughness: 0.9 }), leaf = S({ color: "#2f5a34", roughness: 0.85 }), leaf2 = S({ color: "#3d6e3f", roughness: 0.85 });
    for (let z = h + 34; z < h + 280; z += 16) for (const x of [-11.2, 11.2]) { const g = new THREE.Group(); g.position.set(x, 0.25, z + (x > 0 ? 8 : 0)); R.add(g);
      g.add(msh(new RoundedBoxGeometry(0.45, 3.2, 0.45, 2, 0.06), trunk, 0, 1.6, 0)); g.add(msh(new RoundedBoxGeometry(2.8, 2.2, 2.8, 2, 0.25), leaf, 0, 3.9, 0)); g.add(msh(new RoundedBoxGeometry(2.0, 1.4, 2.0, 2, 0.2), leaf2, 0.2, 5.3, -0.1));
      g.add(msh(new THREE.BoxGeometry(1.6, 0.1, 1.6), S({ color: "#2a2620" }), 0, 0.02, 0, false)); }
    // tours de projecteurs
    const steel = S({ map: steelTex(), roughnessMap: steelRough(), color: "#ffffff", roughness: 0.55, metalness: 0.65 });
    const conc = S({ map: concreteTex(), roughness: 0.9 }), haz = S({ map: rep(hazardTex(), 2, 1), roughness: 0.7 });
    const baseM = [haz, haz, conc, conc, haz, haz], plat = S({ map: steelTex(), roughness: 0.6, metalness: 0.5, color: "#bbbbbb" });
    R.add(this.towerGroup);
    for (let k = 0; k < 6; k++) { const a = (k * Math.PI) / 3; const t = new Tower(steel, baseM, plat, k);
      t.root.position.set(Math.cos(a) * TOWER_R, 0, Math.sin(a) * TOWER_R); t.root.lookAt(0, 0, 0); this.towerGroup.add(t.root); this.towers.push(t);
      t.aim(MON_TARGET);
      t.spot.castShadow = true; t.spot.shadow.mapSize.set(2048, 2048); t.spot.shadow.bias = -0.0002; t.spot.shadow.normalBias = 0.04; t.spot.shadow.camera.near = 10; t.spot.shadow.camera.far = 110; t.spot.intensity = 5.5;
      for (const hd of t.heads) { const b = new Beam(12, 1.2, 0.3); hd.updateMatrixWorld(true); this.beams.add(b.mesh); t.beams.push(b); b.place(hd.getWorldPosition(new THREE.Vector3()), MON_TARGET.clone().add(V((hash(k, 3) - 0.5) * 3, (hash(k, 4) - 0.5) * 3, 0))); } }
    R.add(this.beams);
    // enceinte circulaire : barrières noires de 2 m, poteaux, accès
    const fenceM = S({ color: "#15161a", roughness: 0.45, metalness: 0.7 }), bars: THREE.BufferGeometry[] = [], FR = 11.5, N = 64;
    for (let i = 0; i < N; i++) { const a0 = (i / N) * Math.PI * 2, a1 = ((i + 1) / N) * Math.PI * 2; if (i % 16 === 0) continue; // 4 accès
      const p0 = V(Math.cos(a0) * FR, 0, Math.sin(a0) * FR), p1 = V(Math.cos(a1) * FR, 0, Math.sin(a1) * FR), L = p0.distanceTo(p1), ang = -Math.atan2(p1.z - p0.z, p1.x - p0.x);
      const add = (g: THREE.BufferGeometry, x: number, y: number, z: number) => { g.rotateY(ang); g.translate(x, y, z); bars.push(g); };
      add(new THREE.BoxGeometry(0.16, 2.1, 0.16), p0.x, 1.05, p0.z);
      for (const y of [0.15, 1.0, 1.95]) add(new THREE.BoxGeometry(L, 0.08, 0.08), (p0.x + p1.x) / 2, y, (p0.z + p1.z) / 2);
      for (let b = 1; b < 6; b++) { const t = b / 6; add(new THREE.BoxGeometry(0.04, 1.8, 0.04), p0.x + (p1.x - p0.x) * t, 1.05, p0.z + (p1.z - p0.z) * t); } }
    this.fence.add(msh(mergeGeometries(bars), fenceM)); R.add(this.fence);
    // marquage jaune/noir au sol autour de l'enceinte
    const ring = new THREE.Mesh(new THREE.RingGeometry(FR + 0.3, FR + 1.1, 96).rotateX(-Math.PI / 2), S({ map: rep(hazardTex(), 40, 1), roughness: 0.7 })); ring.position.y = 0.14; ring.receiveShadow = true; R.add(ring);
    // câbles noirs au sol, des tours vers l'enceinte
    const cableM = S({ color: "#0d0d10", roughness: 0.35 });
    for (const t of this.towers) { const p = t.root.position, pts: THREE.Vector3[] = []; for (let s = 0; s <= 12; s++) { const u = s / 12; pts.push(V(p.x * (1 - u * 0.68) + Math.sin(u * 9 + p.x) * 0.8, 0.16, p.z * (1 - u * 0.68) + Math.cos(u * 7 + p.z) * 0.8)); }
      R.add(msh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, 0.09, 6), cableM, 0, 0, 0)); }
  }
  /** passages piétons et lignes de chaussée */
  private paint(R: THREE.Object3D) {
    const white = S({ color: "#d8d8d4", roughness: 0.7 }), h = HALF;
    const zebra = (cx: number, cz: number, alongX: boolean) => { for (let i = -3; i <= 3; i++) { const g = new THREE.PlaneGeometry(alongX ? 0.9 : 6, alongX ? 6 : 0.9).rotateX(-Math.PI / 2); R.add(msh(g, white, cx + (alongX ? i * 1.8 : 0), 0.03, cz + (alongX ? 0 : i * 1.8), false)); } };
    for (const s of [-1, 1]) { zebra(0, s * (h + ROAD / 2 + 1), true); zebra(s * (h + ROAD / 2 + 1), 0, false); zebra(s * 30, h + ROAD / 2 + 1, true); zebra(s * 30, -h - ROAD / 2 - 1, true); }
    for (let x = -h - 60; x < h + 60; x += 6) for (const z of [-h - ROAD / 2 - 1, h + ROAD / 2 + 1]) if (Math.abs(x) > 9 && Math.abs(Math.abs(x) - 30) > 7) R.add(msh(new THREE.PlaneGeometry(3, 0.18).rotateX(-Math.PI / 2), white, x, 0.03, z, false));
    for (let z = h + 30; z < h + 300; z += 6) R.add(msh(new THREE.PlaneGeometry(0.18, 3).rotateX(-Math.PI / 2), white, 0, 0.03, z, false));
  }
  /** immeuble : façade de nuit (fenêtres allumées), corniche, toit, auvent de commerce, balcons */
  private building(R: THREE.Object3D, x: number, z: number, w: number, hgt: number, d: number, facing: THREE.Vector3, wall: string, floors: number, seed: number) {
    const cols = Math.max(3, Math.round((Math.abs(facing.z) > 0.5 ? w : d) / 3.2));
    const f = facadeNight(wall, cols, floors, seed, 0.45 + hash(seed, 9) * 0.25);
    const fm = S({ map: f.map, emissive: "#ffffff", emissiveMap: f.em, emissiveIntensity: 1.5, roughness: 0.75 }); this.winMats.push(fm);
    const sideCols = Math.max(3, Math.round((Math.abs(facing.z) > 0.5 ? d : w) / 3.2)), fs = facadeNight(wall, sideCols, floors, seed + 1, 0.35, false);
    const sm = S({ map: fs.map, emissive: "#ffffff", emissiveMap: fs.em, emissiveIntensity: 1.3, roughness: 0.8 }); this.winMats.push(sm);
    const roof = S({ color: "#3a3a40", roughness: 0.9 });
    const front = Math.abs(facing.z) > 0.5 ? (facing.z > 0 ? 4 : 5) : (facing.x > 0 ? 0 : 1);
    const mats: THREE.Material[] = [sm, sm, roof, roof, sm, sm]; mats[front] = fm; mats[front ^ 1] = fm;
    const b = msh(new THREE.BoxGeometry(w, hgt, d), mats, x, hgt / 2, z); R.add(b);
    const trim = S({ color: "#d9d2c4", roughness: 0.7 });
    R.add(msh(new THREE.BoxGeometry(w + 0.8, 0.7, d + 0.8), trim, x, hgt + 0.35, z)); // corniche
    R.add(msh(new THREE.BoxGeometry(w + 0.3, 0.35, d + 0.3), trim, x, hgt / floors + 0.1, z)); // bandeau rez-de-chaussée
    if (hash(seed, 11) < 0.6) R.add(msh(new THREE.BoxGeometry(2.5, 1.6, 2.5), roof, x + (hash(seed, 12) - 0.5) * w * 0.5, hgt + 1.5, z)); // édicule de toit
    // auvent rayé côté place
    const fx = facing.x, fz = facing.z, off = (Math.abs(fz) > 0.5 ? d : w) / 2;
    if (hash(seed, 13) < 0.7) { const aw = S({ map: stripe(hash(seed, 14) < 0.5 ? "#2a5fa8" : "#a83a2a"), roughness: 0.8 });
      const a = msh(new THREE.BoxGeometry(Math.abs(fz) > 0.5 ? w * 0.8 : 1.6, 0.12, Math.abs(fz) > 0.5 ? 1.6 : d * 0.8), aw, x + fx * (off + 0.8), hgt / floors - 0.3, z + fz * (off + 0.8));
      a.rotation.set(fz * 0.25, 0, -fx * 0.25); R.add(a); }
    // balcons
    if (hash(seed, 15) < 0.5) for (let fl = 2; fl < floors; fl += 2) { const bm = S({ color: "#2a2c32", roughness: 0.5, metalness: 0.5 });
      R.add(msh(new THREE.BoxGeometry(Math.abs(fz) > 0.5 ? w * 0.7 : 1.2, 0.15, Math.abs(fz) > 0.5 ? 1.2 : d * 0.7), bm, x + fx * (off + 0.6), (fl * hgt) / floors, z + fz * (off + 0.6), false)); }
  }
  /** visibilité des installations (le flashback n'a ni tours ni enceinte) */
  installs(on: boolean) { this.towerGroup.visible = on; this.fence.visible = on; this.beams.visible = on; for (const t of this.towers) t.spot.visible = on; }
}
const stripes = new Map<string, THREE.CanvasTexture>();
const stripe = (c: string) => { let t = stripes.get(c); if (!t) { const cv = document.createElement("canvas"); cv.width = 128; cv.height = 16; const g = cv.getContext("2d")!; for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? "#f0eee8" : c; g.fillRect(i * 16, 0, 16, 16); } t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; stripes.set(c, t); } return t; };

/** voiture stylisée : carrosserie arrondie, vitres sombres réfléchissantes, roues, phares et feux */
export const car = (color: string, x: number, z: number, ry: number, seed = 0, police = false) => {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry;
  const paint = new THREE.MeshPhysicalMaterial({ color, roughness: 0.32, metalness: 0.35, clearcoat: 1, clearcoatRoughness: 0.12 });
  const glass = new THREE.MeshStandardMaterial({ color: "#0c1220", roughness: 0.08, metalness: 0.9 }), tire = new THREE.MeshStandardMaterial({ color: "#121214", roughness: 0.85 }), rim = new THREE.MeshStandardMaterial({ color: "#b8bcc4", roughness: 0.3, metalness: 0.9 });
  g.add(msh(new RoundedBoxGeometry(2.0, 0.75, 4.4, 3, 0.22), paint, 0, 0.78, 0));
  g.add(msh(new RoundedBoxGeometry(1.75, 0.62, 2.3, 3, 0.2), paint, 0, 1.38, -0.25));
  g.add(msh(new RoundedBoxGeometry(1.8, 0.5, 2.1, 2, 0.12), glass, 0, 1.4, -0.25));
  for (const [wx, wz] of [[-0.95, 1.4], [0.95, 1.4], [-0.95, -1.4], [0.95, -1.4]]) { const w = msh(new THREE.CylinderGeometry(0.38, 0.38, 0.3, 18).rotateZ(Math.PI / 2), tire, wx, 0.38, wz); g.add(w); g.add(msh(new THREE.CylinderGeometry(0.2, 0.2, 0.32, 12).rotateZ(Math.PI / 2), rim, wx, 0.38, wz)); }
  const hl = new THREE.MeshStandardMaterial({ color: "#fff", emissive: "#fff2d6", emissiveIntensity: police ? 6 : 0.3 }), tl = new THREE.MeshStandardMaterial({ color: "#7a1010", emissive: "#ff2020", emissiveIntensity: 0.6 });
  for (const sx of [-0.65, 0.65]) { g.add(msh(new THREE.BoxGeometry(0.45, 0.16, 0.06), hl, sx, 0.9, 2.21, false)); g.add(msh(new THREE.BoxGeometry(0.42, 0.14, 0.06), tl, sx, 0.92, -2.21, false)); }
  g.add(msh(new THREE.BoxGeometry(1.9, 0.18, 0.12), new THREE.MeshStandardMaterial({ color: "#1a1a1c", roughness: 0.5 }), 0, 0.5, 2.22));
  void seed; return g;
};
