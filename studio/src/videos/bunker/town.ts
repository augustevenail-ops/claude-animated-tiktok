// Ville en surface (réf. 1, 3, 16) : centre de gratte-ciel vitrés, immeubles bas, rangées de maisons à toits rouges, maison
// bleue de la famille, place avec l'entrée dorée du grand bunker, nuage noir au-dessus, colonnes d'énergie violettes.
import * as THREE from "three";
import { box, col, glow, mesh, std, tiled, tree, Cloud, V } from "./common";
import { asphaltTex, brickTex, facadeTex, glassTex, grassTex, hash, roofTex, sidingTex, signTex, skyTex, energyTex } from "./tex";
import { Actor, CAST } from "./chars";

const GLASS: [string, string, string, string?][] = [
  ["#5fa8e0", "#a8d8f8", "#f2f4f6"], ["#3a9aa8", "#7fd0d4", "#f2f4f6"], ["#7cbcf0", "#cde8fb", "#ffffff", "#f2c542"],
  ["#4a78c8", "#8ab4ee", "#e8ecf2"], ["#86c8e8", "#d8f0fa", "#f6efe0", "#f2c542"], ["#2f8f7a", "#6fcab2", "#f4f4f0"],
];
export const TALLEST = V(0, 0, -150);
export const HERO_HOUSE = V(0, 0, 30);
export const ENTRANCE = V(0, 0, -14);

const gableRoof = (w: number, d: number, h: number, m: THREE.Material) => {
  const s = new THREE.Shape(); s.moveTo(-w / 2 - 0.4, 0); s.lineTo(0, h); s.lineTo(w / 2 + 0.4, 0); s.lineTo(-w / 2 - 0.4, 0);
  const g = new THREE.ExtrudeGeometry(s, { depth: d + 0.8, bevelEnabled: false }); g.translate(0, 0, -(d + 0.8) / 2);
  const o = mesh(g, m); return o;
};
const HOUSE_WALLS = ["#f3d9a6", "#ec9f7e", "#f6c0c4", "#f4efe4", "#e7b88a", "#f0e1b8", "#d98b6a"];
const ROOFS = ["#b9553a", "#a84a33", "#c2643f", "#8e3f2c"];

export class Town {
  root = new THREE.Group(); sun: THREE.DirectionalLight; hemi: THREE.HemisphereLight; cloud: Cloud; sky: THREE.Mesh; tallest!: THREE.Group;
  beams: THREE.Mesh[] = []; doorL!: THREE.Mesh; doorR!: THREE.Mesh; banner!: THREE.Group; doorGlow!: THREE.Mesh; flags!: THREE.Group;
  actors: Record<string, Actor> = {}; crowd: Actor[] = []; bus!: THREE.Group; cars: THREE.Group[] = []; houseLight!: THREE.Mesh;
  constructor() {
    const r = this.root;
    this.hemi = new THREE.HemisphereLight("#cfe6ff", "#5a8a3a", 1.3); r.add(this.hemi);
    this.sun = new THREE.DirectionalLight("#fff4e2", 2.6); this.sun.position.set(70, 140, 110); this.sun.castShadow = true;
    const sc = this.sun.shadow.camera; sc.left = -170; sc.right = 170; sc.top = 170; sc.bottom = -170; sc.near = 10; sc.far = 500; this.sun.shadow.bias = -0.0004; this.sun.shadow.normalBias = 0.05;
    this.sun.target.position.set(0, 0, -40); r.add(this.sun, this.sun.target);
    this.sky = mesh(new THREE.SphereGeometry(900, 32, 16), new THREE.MeshBasicMaterial({ map: skyTex(), side: THREE.BackSide, fog: false, transparent: true }), 0, 0, 0, false); r.add(this.sky);
    // sol
    box(r, std("grass_t", { color: "#ffffff", map: tiled(grassTex(), 60, 60) }), -700, -1, -700, 700, 0, 700);
    const asph = std("asph", { color: "#ffffff", map: tiled(asphaltTex(), 40, 2) });
    for (const z of [-58, -36, -4, 18, 46]) box(r, asph, -400, 0, z - 3, 400, 0.06, z + 3, false);
    for (const x of [-96, -48, 0.01, 48, 96]) box(r, asph, x - 3, 0, -260, x + 3, 0.07, -4, false);
    const walk = col("#c9c6bf"); for (const z of [-58, -36, -4, 18, 46]) { box(r, walk, -400, 0, z - 4.2, 400, 0.12, z - 3, false); box(r, walk, -400, 0, z + 3, 400, 0.12, z + 4.2, false); }
    this.downtown(); this.midrise(); this.houses(); this.plaza(); this.heroHouse(); this.vehicles();
    for (let i = 0; i < 90; i++) { const x = (hash(i, 61) - 0.5) * 330, z = -50 + hash(i, 62) * 120; if (Math.abs(x) < 9 && z > 20) continue; if (Math.abs(((x % 48) + 48) % 48 - 24) < 20 && hash(i, 63) < 0.5) tree(r, x, z, 1.1 + hash(i, 64) * 0.6, i); }
    // nuage
    this.cloud = new Cloud(1000, 900, 3600, 0, -150, 5, 15); r.add(this.cloud.group);
    // colonnes d'énergie (attirent le nuage)
    const em = new THREE.MeshBasicMaterial({ map: energyTex(), transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false, color: "#b48cff", side: THREE.DoubleSide });
    for (const [x, z] of [[-70, -30], [60, -40], [-20, -110], [110, -120]]) { const b = mesh(new THREE.CylinderGeometry(5, 7, 1, 20, 1, true), em.clone(), x, 0, z, false); b.visible = false; this.beams.push(b); r.add(b); }
    // personnages
    for (const k of ["narr", "dad", "mom", "bro", "rich1", "rich2", "rich3", "rich4", "n1", "n2", "n3", "n4"]) { const a = new Actor(CAST[k], 0.36, Object.keys(this.actors).length); a.root.visible = false; this.actors[k] = a; r.add(a.root); }
    const extra = ["n1", "n2", "n3", "n4", "rich3", "rich4", "n2", "n1", "n3", "n4"];
    for (let i = 0; i < extra.length; i++) { const a = new Actor(CAST[extra[i]], 0.36, 20 + i); a.root.visible = false; this.crowd.push(a); r.add(a.root); }
  }
  private downtown() {
    const r = this.root;
    for (let gx = -4; gx <= 4; gx++) for (let gz = 0; gz < 8; gz++) {
      const i = gx * 13 + gz * 7 + 100, x = gx * 24 + (hash(i, 1) - 0.5) * 6, z = -78 - gz * 24 + (hash(i, 2) - 0.5) * 6;
      if (Math.abs(x) < 10 && Math.abs(z - TALLEST.z) < 14) continue;
      const h = 45 + hash(i, 3) * 70 + (4 - Math.abs(gx)) * 9 + gz * 4, t = Math.floor(hash(i, 4) * 5), gl = GLASS[Math.floor(hash(i, 5) * GLASS.length)];
      this.tower(x, z, h, t, gl, i);
    }
    this.tallest = this.tower(TALLEST.x, TALLEST.z, 205, 0, GLASS[2], 7, true);
  }
  tower(x: number, z: number, h: number, type: number, gl: [string, string, string, string?], i: number, spire = false) {
    const g = new THREE.Group(); g.position.set(x, 0, z); this.root.add(g);
    const tex = glassTex(gl[0], gl[1], gl[2], 4, 12, gl[3]), w = 13 + hash(i, 6) * 5;
    const gm = (rep: number) => std(`gl_${gl[0]}_${gl[3]}_${rep}`, { color: "#ffffff", map: tiled(tex, 1, rep), roughness: 0.08, metalness: 0.35, envMapIntensity: 1.4 });
    const cap = col("#f2f4f6");
    box(g, cap, -w / 2 - 1, 0, -w / 2 - 1, w / 2 + 1, 2.5, w / 2 + 1);
    if (type === 1) { g.add(mesh(new THREE.CylinderGeometry(w / 2, w / 2, h, 28), gm(Math.round(h / 30)), 0, h / 2, 0)); g.add(mesh(new THREE.CylinderGeometry(w / 2 + 0.4, w / 2 + 0.4, 1.5, 28), cap, 0, h + 0.75, 0)); }
    else if (type === 2) { const o = mesh(new THREE.CylinderGeometry(w * 0.32, w * 0.75, h, 4), gm(Math.round(h / 30)), 0, h / 2, 0); o.rotation.y = Math.PI / 4; g.add(o); }
    else if (type === 3) { let y = 0, ww = w; for (let k = 0; k < 3; k++) { const hh = h * [0.5, 0.3, 0.2][k]; box(g, gm(Math.max(1, Math.round(hh / 30))), -ww / 2, y, -ww / 2, ww / 2, y + hh, ww / 2); box(g, cap, -ww / 2 - 0.4, y + hh, -ww / 2 - 0.4, ww / 2 + 0.4, y + hh + 1, ww / 2 + 0.4); y += hh + 1; ww *= 0.72; } }
    else { box(g, gm(Math.round(h / 30)), -w / 2, 0, -w / 2, w / 2, h, w / 2); box(g, cap, -w / 2 - 0.4, h, -w / 2 - 0.4, w / 2 + 0.4, h + 1.4, w / 2 + 0.4);
      if (type === 4) box(g, col("#9aa0a8"), -2, h + 1.4, -2, 2, h + 5, 2); }
    if (spire || hash(i, 8) < 0.35) { const sh = spire ? 40 : 10 + hash(i, 9) * 12; g.add(mesh(new THREE.CylinderGeometry(0.25, 0.6, sh, 8), col("#e8ecf0", { metalness: 0.5, roughness: 0.3 }), 0, h + sh / 2 + 1, 0)); }
    return g;
  }
  private midrise() {
    const r = this.root;
    for (let i = 0; i < 26; i++) {
      const x = -150 + i * 12 + (hash(i, 21) - 0.5) * 3, z = -47 + (hash(i, 22) - 0.5) * 3; if (Math.abs(x) < 16) continue;
      const h = 12 + hash(i, 23) * 14, w = 9 + hash(i, 24) * 2.5, wall = HOUSE_WALLS[Math.floor(hash(i, 25) * HOUSE_WALLS.length)];
      const ft = facadeTex(wall, "#5aa8e6", 3, 4, false, hash(i, 26) < 0.3 ? "#b8553a" : undefined);
      const m = std(`mr_${wall}_${Math.round(h)}`, { color: "#ffffff", map: tiled(ft, 1, Math.round(h / 8)) });
      box(r, m, x - w / 2, 0, z - 5, x + w / 2, h, z + 5); box(r, col("#f4f1ea"), x - w / 2 - 0.3, h, z - 5.3, x + w / 2 + 0.3, h + 0.8, z + 5.3);
      if (hash(i, 27) < 0.6) { const ro = gableRoof(w, 10, 3, std("roof_" + ROOFS[i % 4], { color: "#ffffff", map: roofTex(ROOFS[i % 4]) })); ro.position.set(x, h + 0.8, z); r.add(ro); }
    }
  }
  house(x: number, z: number, wall: string, roof: string, two: boolean, i: number, rot = 0) {
    const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rot; this.root.add(g);
    const w = 6.5 + hash(i, 31) * 1.5, d = 6.5, h = two ? 6.4 : 3.6;
    const ft = facadeTex(wall, "#4f9fe0", 2, two ? 2 : 1, true, hash(i, 32) < 0.35 ? "#2f6a9a" : undefined, two ? "2" : "1");
    const side = facadeTex(wall, "#4f9fe0", 2, two ? 2 : 1, false, undefined, two ? "2" : "1");
    const fm = std(`hf_${wall}_${two}`, { color: "#ffffff", map: ft }), sm = std(`hs_${wall}_${two}`, { color: "#ffffff", map: side });
    box(g, [sm, sm, col(wall), col(wall), fm, sm], -w / 2, 0, -d / 2, w / 2, h, d / 2);
    const ro = gableRoof(w, d, 2.6, std("roof_" + roof, { color: "#ffffff", map: roofTex(roof) })); ro.position.y = h; g.add(ro);
    if (hash(i, 33) < 0.4) box(g, col("#8a8f98"), w / 4, h + 1, -1, w / 4 + 1.2, h + 3.2, 0.2);
    if (hash(i, 34) < 0.3) { g.add(mesh(new THREE.CylinderGeometry(0.7, 0.7, 1.4, 10), col("#6b5a4a"), -w / 4, h + 2.4, 0.5)); }
    return g;
  }
  private houses() {
    let i = 0;
    for (const z of [10, 26, 54]) for (let x = -160; x <= 160; x += 9.5) {
      i++; if (z === 26 && Math.abs(x - HERO_HOUSE.x) < 6) continue; if (z === 10 && Math.abs(x) < 17) continue;
      this.house(x + (hash(i, 41) - 0.5) * 1.5, z, HOUSE_WALLS[Math.floor(hash(i, 42) * HOUSE_WALLS.length)], ROOFS[Math.floor(hash(i, 43) * 4)], hash(i, 44) < 0.55, i, z === 54 ? Math.PI : 0);
    }
  }
  private heroHouse() {
    const g = new THREE.Group(); g.position.copy(HERO_HOUSE).setZ(26); this.root.add(g);
    const sid = std("hero_siding", { color: "#ffffff", map: tiled(sidingTex("#a9cbe8"), 3, 3) }), trim = col("#f6f4ee");
    box(g, sid, -4.2, 0, -3.6, 4.2, 7.2, 3.6); box(g, trim, -4.3, 3.5, -3.7, 4.3, 3.8, 3.7);
    const roofM = std("roof_hero", { color: "#ffffff", map: roofTex("#8e3f2c") });
    const ro = gableRoof(8.4, 7.2, 2.8, roofM); ro.position.y = 7.2; g.add(ro);
    box(g, trim, -1.2, 0, 3.6, 1.2, 2.9, 3.75); box(g, col("#3f8f5a"), -0.95, 0, 3.7, 0.95, 2.65, 3.85);
    g.add(mesh(new THREE.SphereGeometry(0.1, 8, 6), col("#f2c230", { metalness: 0.7 }), 0.65, 1.3, 3.9));
    this.houseLight = mesh(new THREE.SphereGeometry(0.35, 12, 8), glow("#fff2c8", 2.2), 2.6, 2.9, 3.9, false); g.add(this.houseLight);
    for (const [x, y] of [[-2.6, 5.4], [2.6, 5.4], [-2.8, 1.6]] as const) {
      box(g, trim, x - 1, y - 1.1, 3.6, x + 1, y + 1.1, 3.75); box(g, glow("#6fb4ef", 0.15), x - 0.8, y - 0.9, 3.7, x + 0.8, y + 0.9, 3.8);
      box(g, trim, x - 0.06, y - 0.9, 3.8, x + 0.06, y + 0.9, 3.85); box(g, trim, x - 0.8, y - 0.06, 3.8, x + 0.8, y + 0.06, 3.85);
      box(g, col("#2f6a9a"), x - 1.6, y - 1.1, 3.62, x - 1.08, y + 1.1, 3.8); box(g, col("#2f6a9a"), x + 1.08, y - 1.1, 3.62, x + 1.6, y + 1.1, 3.8);
    }
    box(g, col("#e9e1d6"), -1.4, 0, 3.6, 1.4, 0.3, 5); // perron
    const bk = std("brick_n", { color: "#ffffff", map: tiled(brickTex(), 2, 2) });
    box(g, bk, 4.4, 0, -3, 9, 4.4, 3); const r2 = gableRoof(4.6, 6, 1.6, roofM); r2.position.set(6.7, 4.4, 0); g.add(r2);
    box(this.root, col("#e8e4da"), -0.8, 0.02, 29.6, 0.8, 0.14, 43); // allée
  }
  private plaza() {
    const r = this.root, e = ENTRANCE;
    box(r, col("#e9e6df"), e.x - 22, 0, e.z - 12, e.x + 22, 0.15, e.z + 10, false);
    const g = new THREE.Group(); g.position.copy(e); r.add(g);
    box(g, col("#f2f4f6"), -9, 0, -6, 9, 11, 4);
    box(g, col("#f2c542"), -9.3, 11, -6.3, 9.3, 11.8, 4.3);
    box(g, col("#f2c542"), -6.3, 0, 4, -5.3, 10, 4.6); box(g, col("#f2c542"), 5.3, 0, 4, 6.3, 10, 4.6);
    const dome = mesh(new THREE.SphereGeometry(6.2, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2), col("#f2c230", { metalness: 0.9, roughness: 0.2, envMapIntensity: 1.6 }), 0, 11.8, -2.5); g.add(dome);
    for (let k = 0; k < 10; k++) { const a = (k / 10) * Math.PI; const rib = mesh(new THREE.TorusGeometry(6.25, 0.12, 6, 40, Math.PI), col("#d9a21a", { metalness: 0.7, roughness: 0.3 }), 0, 11.8, -2.5); rib.rotation.y = a; g.add(rib); }
    this.doorGlow = mesh(new THREE.PlaneGeometry(10, 9.4), glow("#fff1d0", 0.55), 0, 4.7, 4.02, false); g.add(this.doorGlow);
    const steel = col("#8c939c", { metalness: 0.6, roughness: 0.35 });
    this.doorL = mesh(new THREE.BoxGeometry(5, 9.4, 0.5), steel, -2.5, 4.7, 4.3); this.doorR = mesh(new THREE.BoxGeometry(5, 9.4, 0.5), steel, 2.5, 4.7, 4.3); g.add(this.doorL, this.doorR);
    for (const d of [this.doorL, this.doorR]) { for (let k = 0; k < 4; k++) box(d, col("#f2c542", { metalness: 0.6 }), -2.4, -4.5 + k * 3, 0.26, 2.4, -4.2 + k * 3, 0.32); }
    this.banner = new THREE.Group(); this.banner.position.set(0, 12.6, 4.8); g.add(this.banner);
    box(this.banner, col("#f2c542"), -8.4, -1.7, -0.25, 8.4, 1.7, 0.2);
    const sign = new THREE.MeshStandardMaterial({ map: signTex("open", "OUVERT À TOUS", "#3fbf7f", "#ffffff", 1024, 160, 104), roughness: 0.6 });
    this.banner.add(mesh(new THREE.PlaneGeometry(16, 2.6), sign, 0, 0, 0.23, false));
    this.flags = new THREE.Group(); g.add(this.flags);
    const fc = ["#e8483a", "#f2c230", "#3fbf7f", "#3f8fe8", "#e86ab0", "#f08a2a"];
    for (let k = 0; k < 26; k++) { const x = -12 + k * 0.96, y = 16.6 - Math.sin((k / 25) * Math.PI) * 1.8; const f = mesh(new THREE.ConeGeometry(0.42, 0.9, 3), col(fc[k % 6]), x, y, 5.2, false); f.rotation.z = Math.PI; this.flags.add(f); }
    this.banner.visible = false; this.flags.visible = false;
  }
  private vehicles() {
    const bus = new THREE.Group(); box(bus, col("#f2c230"), -1.3, 0.5, -5, 1.3, 3.2, 5); box(bus, glow("#9fd4f6", 0.1), -1.32, 2, -4.6, 1.32, 2.9, 4.6);
    for (const z of [-3.4, 3.4]) for (const x of [-1.3, 1.3]) { const w = mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.4, 14).rotateZ(Math.PI / 2), col("#222"), x, 0.55, z); bus.add(w); }
    bus.position.set(48, 0, -20); this.root.add(bus); this.bus = bus;
    const cc = ["#e8483a", "#3f8fe8", "#f4f4f4", "#8a4fc4", "#f2c230"];
    for (let i = 0; i < 10; i++) { const c = new THREE.Group(); box(c, col(cc[i % 5]), -0.9, 0.35, -2, 0.9, 1.2, 2); box(c, col(cc[i % 5]), -0.85, 1.2, -1, 0.85, 1.9, 1.1); box(c, glow("#9fd4f6", 0.1), -0.87, 1.25, -0.9, 0.87, 1.8, 1.0);
      c.position.set(i % 2 ? 1.5 : -1.5, 0, 0); this.root.add(c); this.cars.push(c); }
  }
  /** état du décor à l'instant t */
  update(t: number, p: { cloudH: number; cloudVit?: number; boil?: number; beams?: number; skyK?: number; doors?: number; banner?: boolean; hole?: number }) {
    this.cloud.update(p.cloudH, t, p.cloudVit ?? 1, p.boil ?? 0, p.hole ?? 0, 0, -60);
    const sk = p.skyK ?? 0; (this.sky.material as THREE.MeshBasicMaterial).opacity = sk; this.sky.visible = sk > 0.01;
    this.hemi.intensity = 1.3 + sk * 0.3; this.sun.intensity = 2.6 + sk * 0.6;
    const b = p.beams ?? 0;
    for (let i = 0; i < this.beams.length; i++) { const m = this.beams[i]; m.visible = b > 0.01; const hh = Math.max(1, p.cloudH - 2);
      m.scale.y = hh; m.position.y = hh / 2; const mt = m.material as THREE.MeshBasicMaterial; mt.opacity = 0.55 * b; if (mt.map) { mt.map.offset.y = -t * 0.8 - i * 0.3; } }
    const dk = p.doors ?? 0; this.doorL.position.x = -2.5 - dk * 4.6; this.doorR.position.x = 2.5 + dk * 4.6;
    this.banner.visible = !!p.banner; this.flags.visible = !!p.banner;
    this.flags.children.forEach((f, k) => { f.rotation.x = Math.sin(t * 4 + k) * 0.25; });
    this.bus.position.z = -20 + ((t * 6) % 80) - 40;
    this.cars.forEach((c, i) => { const lane = [-36, -4, 18, 46][i % 4]; c.rotation.y = Math.PI / 2; c.position.set(((t * (5 + i) + i * 47) % 360) - 180, 0, lane + (i % 2 ? 1.5 : -1.5)); });
  }
}
