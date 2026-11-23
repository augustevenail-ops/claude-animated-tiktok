// Coupe du sol façon schéma (réf. 2, 4, 15) : maisons en surface, terre orangée qui fonce vers le gris en profondeur,
// cave minuscule de la famille, manoir-bunker avec piscine et ascenseur, cinéma, ville souterraine au soleil artificiel,
// machine tout au fond, reliée à chaque bunker de luxe par des câbles (violets quand elle tourne).
import * as THREE from "three";
import { box, col, glow, mesh, std, tiled, tree, palm, panel, Cloud, V } from "./common";
import { fakeSkyTex, grassTex, hash, soilTex, tileTex, waterTex, glassTex } from "./tex";
import { Actor, CAST } from "./chars";
import { Town, HERO_HOUSE } from "./town";

type Poly = [number, number][];
const rect = (x0: number, y0: number, x1: number, y1: number): Poly => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
export const FAM = { x0: -4.5, y0: -6.8, x1: 4.5, y1: -1.2 };
export const MANSION = { x0: -36, y0: -31, x1: -6, y1: -15 };
export const SHAFT = { x0: -22.5, x1: -18 };
export const CINEMA = { x0: 19, y0: -27, x1: 37, y1: -16 };
export const CITY = { x0: -34, y0: -82, x1: 34, y1: -48 };
export const CSHAFT = { x0: 10, x1: 14.5 };
export const MACH = { x0: -7, y0: -110, x1: 9, y1: -97 };
const SMALL = [-28.5, -9.5, 28.5, 38, -38, 47.5, -47.5, 57, -57].map((x) => ({ x0: x - 3, y0: -5.2, x1: x + 3, y1: -1.4 }));
const DEPTH = 26;

export class Coupe {
  root = new THREE.Group(); sun: THREE.DirectionalLight; hemi: THREE.HemisphereLight; cloud: Cloud;
  lights: { l: THREE.PointLight; base: number; grp: string }[] = []; glows: { m: THREE.MeshStandardMaterial; base: number; grp: string }[] = [];
  fills: THREE.Mesh[] = []; cables: THREE.MeshStandardMaterial; cab!: THREE.Group; artSun!: THREE.Group; rings: THREE.Mesh[] = [];
  actors: Record<string, Actor> = {}; water!: THREE.Texture; cabActor: Actor;
  constructor() {
    const r = this.root;
    this.hemi = new THREE.HemisphereLight("#fff0dc", "#7a5a3a", 1.2); r.add(this.hemi);
    this.sun = new THREE.DirectionalLight("#fff2e0", 2.2); this.sun.position.set(-50, 90, 140); this.sun.castShadow = true;
    const sc = this.sun.shadow.camera; sc.left = -140; sc.right = 140; sc.top = 150; sc.bottom = -150; sc.near = 10; sc.far = 400; this.sun.shadow.bias = -0.0004;
    this.sun.target.position.set(0, -50, 0); r.add(this.sun, this.sun.target);
    // terre : pavage de boîtes autour des pièces (ouvertes vers la caméra)
    const holes: Poly[] = [
      rect(FAM.x0, FAM.y0, FAM.x1, FAM.y1), rect(MANSION.x0, MANSION.y0, MANSION.x1, MANSION.y1), rect(SHAFT.x0, MANSION.y1, SHAFT.x1, -0.8),
      rect(CINEMA.x0, CINEMA.y0, CINEMA.x1, CINEMA.y1), rect(CITY.x0, CITY.y0, CITY.x1, CITY.y1), rect(CSHAFT.x0, CITY.y1, CSHAFT.x1, -0.8),
      rect(MACH.x0, MACH.y0, MACH.x1, MACH.y1), ...SMALL.map((q) => rect(q.x0, q.y0, q.x1, q.y1)),
    ];
    const soilCol = (y: number, inner: boolean) => {
      const a = new THREE.Color("#f2a552"), b = new THREE.Color("#dca66c"), c = new THREE.Color("#b9ad9e");
      const k = Math.min(1, -y / 55), k2 = Math.min(1, Math.max(0, (-y - 55) / 70));
      const o = a.clone().lerp(b, k).lerp(c, k2); if (inner) o.multiplyScalar(0.78); return o;
    };
    const XS = [...new Set([-150, 150, ...holes.flatMap((h) => [h[0][0], h[1][0]])])].sort((p, q) => p - q);
    const YS = [...new Set([-150, 0, ...holes.flatMap((h) => [h[0][1], h[2][1]]), ...Array.from({ length: 16 }, (_, i) => -i * 10)])].sort((p, q) => p - q);
    const inHole = (x: number, y: number) => holes.some((h) => x > h[0][0] && x < h[1][0] && y > h[0][1] && y < h[2][1]);
    const geos: THREE.BufferGeometry[] = [];
    for (let j = 0; j + 1 < YS.length; j++) { let i = 0;
      while (i + 1 < XS.length) { const cy = (YS[j] + YS[j + 1]) / 2; if (inHole((XS[i] + XS[i + 1]) / 2, cy)) { i++; continue; }
        let k = i + 1; while (k + 1 < XS.length && !inHole((XS[k] + XS[k + 1]) / 2, cy)) k++;
        const g = new THREE.BoxGeometry(XS[k] - XS[i], YS[j + 1] - YS[j], DEPTH).translate((XS[i] + XS[k]) / 2, cy, -DEPTH / 2);
        const pos = g.attributes.position, nrm = g.attributes.normal, cc = new Float32Array(pos.count * 3);
        for (let v = 0; v < pos.count; v++) { const o = soilCol(pos.getY(v), Math.abs(nrm.getZ(v)) < 0.5); cc.set([o.r, o.g, o.b], v * 3); }
        g.setAttribute("color", new THREE.BufferAttribute(cc, 3)); geos.push(g); i = k; } }
    const soilM = new THREE.MeshStandardMaterial({ vertexColors: true, map: tiled(soilTex(), 30, 30), roughness: 0.95 });
    for (const g of geos) r.add(mesh(g, soilM));
    // fond des pièces
    const bg = new THREE.PlaneGeometry(300, 150, 1, 30).translate(0, -75, -DEPTH + 0.01);
    const bp = bg.attributes.position, bc = new Float32Array(bp.count * 3);
    for (let i = 0; i < bp.count; i++) { const o = soilCol(bp.getY(i), true).multiplyScalar(0.9); bc.set([o.r, o.g, o.b], i * 3); }
    bg.setAttribute("color", new THREE.BufferAttribute(bc, 3)); r.add(mesh(bg, soilM, 0, 0, 0, false));
    // surface : herbe + maisons + gratte-ciel en fond
    box(r, std("grass_c", { color: "#ffffff", map: tiled(grassTex(), 40, 6) }), -150, 0, -260, 150, 0.6, 0);
    const fake = Object.assign(Object.create(Town.prototype), { root: r }) as Town;
    const walls = ["#f3d9a6", "#ec9f7e", "#f6c0c4", "#f4efe4", "#e7b88a", "#f0e1b8", "#d98b6a"], roofs = ["#b9553a", "#a84a33", "#c2643f", "#8e3f2c"];
    for (let x = -142.5, i = 0; x <= 142.5; x += 9.5, i++) { if (Math.abs(x) < 5) continue; if ((x > SHAFT.x0 - 4 && x < SHAFT.x1 + 4) || (x > CSHAFT.x0 - 4 && x < CSHAFT.x1 + 4)) continue; const g = fake.house(x, -10, walls[i % 7], roofs[i % 4], hash(i, 5) < 0.4, i + 300); g.position.y = 0.6; }
    const hero = fake.house(HERO_HOUSE.x, -10, "#a9cbe8", "#8e3f2c", true, 999); hero.position.y = 0.6;
    for (const sx of [SHAFT, CSHAFT]) { const kiosk = new THREE.Group(); kiosk.position.set((sx.x0 + sx.x1) / 2, 0.6, -6); r.add(kiosk);
      box(kiosk, col("#f2f4f6"), -3.6, 0, -4, 3.6, 4.5, 0); box(kiosk, col("#f2c542", { metalness: 0.6, roughness: 0.3 }), -3.8, 4.5, -4.2, 3.8, 5.1, 0.2);
      kiosk.add(mesh(new THREE.SphereGeometry(2.6, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), col("#f2c230", { metalness: 0.65, roughness: 0.25 }), 0, 5.1, -2)); }
    const GL: [string, string, string, string?][] = [["#5fa8e0", "#a8d8f8", "#f2f4f6"], ["#3a9aa8", "#7fd0d4", "#f2f4f6"], ["#7cbcf0", "#cde8fb", "#ffffff", "#f2c542"], ["#4a78c8", "#8ab4ee", "#e8ecf2"]];
    for (let i = 0; i < 26; i++) fake.tower(-140 + i * 11 + (hash(i, 71) - 0.5) * 4, -70 - hash(i, 72) * 60, 40 + hash(i, 73) * 70, Math.floor(hash(i, 74) * 5), GL[i % 4], i + 500);
    // petites caves des voisins (creusées pendant « tout le monde a commencé à construire »)
    for (const s of SMALL) { const f = box(r, soilM, s.x0, s.y0, -DEPTH, s.x1, s.y1, 0); this.fills.push(f);
      const b = mesh(new THREE.SphereGeometry(0.22, 10, 8), glow("#ffe6a8", 2), (s.x0 + s.x1) / 2, s.y1 - 0.5, -10, false); r.add(b); }
    this.family(); this.mansion(); this.cinema(); this.city(); this.machine();
    // câbles
    this.cables = new THREE.MeshStandardMaterial({ color: "#2a2730", emissive: "#a060ff", emissiveIntensity: 0, roughness: 0.6 });
    const from = V((MACH.x0 + MACH.x1) / 2, MACH.y1 - 9, 0.4);
    const ends = [V(-26, MANSION.y0, 0.4), V(30, CINEMA.y0, 0.4), V(-22, CITY.y0, 0.4), V(22, CITY.y0, 0.4), V(0, CITY.y0, 0.4), V(-40, -40, 0.4), V(42, -40, 0.4)];
    for (const e of ends) { const c = new THREE.LineCurve3(from, e); r.add(mesh(new THREE.TubeGeometry(c, 2, 0.35, 6), this.cables, 0, 0, 0, false)); }
    this.cloud = new Cloud(500, 400, 900, 0, -110, 6, 13); r.add(this.cloud.group);
    for (const k of ["narr", "dad", "mom", "bro"]) { const a = new Actor(CAST[k], 0.36, Object.keys(this.actors).length); this.actors[k] = a; r.add(a.root); }
    const fx = [-2.8, -0.8, 1.0, 2.9]; ["dad", "narr", "bro", "mom"].forEach((k, i) => { this.actors[k].root.position.set(fx[i], FAM.y0, -9); });
    this.cabActor = new Actor(CAST.rich1, 0.36, 40); this.cab.add(this.cabActor.root); this.cabActor.root.position.set(0, 0.25, -1);
  }
  private addLight(c: string, i: number, d: number, x: number, y: number, z: number, grp: string) { const l = new THREE.PointLight(c, i, d, 1.6); l.position.set(x, y, z); this.root.add(l); this.lights.push({ l, base: i, grp }); }
  private glowM(c: string, i: number, grp: string) { const m = new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: i, roughness: 1 }); this.glows.push({ m, base: i, grp }); return m; }
  private family() {
    const r = this.root;
    box(r, col("#9a7a5a"), FAM.x0, FAM.y0, -DEPTH, FAM.x1, FAM.y0 + 0.2, 0);
    r.add(mesh(new THREE.SphereGeometry(0.28, 12, 8), glow("#fff1c4", 3), 0, FAM.y1 - 0.7, -10, false));
    r.add(mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.5, 4), col("#222"), 0, FAM.y1 - 0.3, -10, false));
    this.addLight("#ffd9a0", 26, 14, 0, FAM.y1 - 1, -8, "fam");
    box(r, col("#c9b9a0"), FAM.x0 + 0.4, FAM.y0 + 0.2, -16, FAM.x0 + 3.2, FAM.y0 + 0.7, -12); // matelas
    box(r, col("#a8865e"), FAM.x1 - 1.6, FAM.y0 + 0.2, -14, FAM.x1 - 0.3, FAM.y0 + 1.4, -12.6); box(r, col("#a8865e"), FAM.x1 - 1.4, FAM.y0 + 1.4, -13.8, FAM.x1 - 0.5, FAM.y0 + 2.2, -12.9);
  }
  private mansion() {
    const r = this.root, m = MANSION, fy = m.y0;
    box(r, std("tile_m", { color: "#ffffff", map: tiled(tileTex("#efe2c8", "#d8c8a8"), 12, 4) }), m.x0, fy, -DEPTH, m.x1, fy + 0.4, 0);
    panel(r, fakeSkyTex(), m.x1 - m.x0 - 4, DEPTH - 4, (m.x0 + m.x1) / 2, m.y1 - 0.2, -DEPTH / 2, 1.0);
    const v = new THREE.Group(); v.position.set(-22, fy + 0.4, -18); v.scale.setScalar(0.85); r.add(v);
    const glassM = std("villa_gl", { color: "#ffffff", map: tiled(glassTex("#fff6dc", "#ffffff", "#c89a2a", 6, 1), 2, 1), emissive: "#fff2d0", emissiveIntensity: 0.4 });
    for (let k = 0; k < 3; k++) { const w = 26 - k * 5, y = k * 3.4; box(v, glassM, -w / 2, y, -3, w / 2, y + 3, 3); box(v, col("#f4f6f8"), -w / 2 - 0.6, y + 3, -3.6, w / 2 + 0.6, y + 3.4, 3.6); }
    const pool = new THREE.Group(); pool.position.set(-20, fy + 0.4, -6); r.add(pool);
    box(pool, col("#f4f1ea"), -10, 0, -4, 10, 0.5, 4);
    this.water = tiled(waterTex(), 4, 1.2);
    pool.add(mesh(new THREE.PlaneGeometry(18.5, 6.5).rotateX(-Math.PI / 2), std("pool_w", { color: "#ffffff", map: this.water, roughness: 0.15, emissive: "#1a6aa0", emissiveIntensity: 0.25 }), 0, 0.52, 0, false));
    palm(r, -33, -16, 1.3, fy + 0.4); tree(r, -9, -16, 1.1, 3, fy + 0.4);
    const umb = new THREE.Group(); umb.position.set(-9, fy + 0.4, -4); r.add(umb);
    umb.add(mesh(new THREE.CylinderGeometry(0.08, 0.08, 3, 6), col("#d9a21a", { metalness: 0.6 }), 0, 1.5, 0));
    umb.add(mesh(new THREE.SphereGeometry(1.8, 20, 8, 0, Math.PI * 2, 0, Math.PI / 2.4), col("#f2c230", { metalness: 0.3, roughness: 0.4 }), 0, 2.4, 0));
    for (const x of [-31, -29]) { box(r, col("#f2c542"), x - 0.6, fy + 0.4, -10, x + 0.6, fy + 0.9, -6.5); }
    this.addLight("#fff2dc", 120, 60, -21, m.y1 - 3, -8, "lux");
    // ascenseur
    box(r, col("#5a5f68", { metalness: 0.5 }), SHAFT.x0 + 0.2, MANSION.y1, -10.5, SHAFT.x1 - 0.2, -0.8, -10);
    this.cab = new THREE.Group(); this.cab.position.set((SHAFT.x0 + SHAFT.x1) / 2, -8, -6); r.add(this.cab);
    box(this.cab, col("#d9a21a", { metalness: 0.6, roughness: 0.3 }), -2.6, -0.1, -2.5, 2.6, 0.25, 1); box(this.cab, col("#d9a21a", { metalness: 0.6, roughness: 0.3 }), -2.6, 3.4, -2.5, 2.6, 3.7, 1);
    box(this.cab, col("#3a3a40", { metalness: 0.4 }), -2.6, 0, -2.6, 2.6, 3.6, -2.3);
    this.cab.add(mesh(new THREE.BoxGeometry(4.6, 0.12, 0.6), this.glowM("#fff6dc", 2.5, "cab"), 0, 3.3, -0.8, false));
    this.cab.add(mesh(new THREE.CylinderGeometry(0.05, 0.05, 40, 4), col("#222"), 0, 23.6, -1, false));
    const cl = new THREE.PointLight("#fff2dc", 10, 8, 1.6); cl.position.set(0, 3, 0.5); this.cab.add(cl); this.lights.push({ l: cl, base: 10, grp: "cab" });
  }
  private cinema() {
    const r = this.root, c = CINEMA;
    box(r, col("#2a1418"), c.x0, c.y0, -DEPTH, c.x1, c.y0 + 0.3, 0);
    box(r, col("#1a0e10"), c.x0, c.y0, -DEPTH + 0.1, c.x1, c.y1, -DEPTH + 0.3);
    r.add(mesh(new THREE.PlaneGeometry(14, 6), this.glowM("#cfe2ff", 1.4, "lux"), (c.x0 + c.x1) / 2, c.y0 + 6.5, -DEPTH + 0.5, false));
    const red = col("#c4283a"), dark = col("#7a1420");
    for (let row = 0; row < 5; row++) for (let k = 0; k < 6; k++) { const x = c.x0 + 3 + k * 2.4, z = -18 + row * 3.2, y = c.y0 + 0.3 + row * 0.5;
      box(r, red, x - 0.9, y, z - 0.6, x + 0.9, y + 0.8, z + 0.6); box(r, dark, x - 0.9, y + 0.8, z + 0.4, x + 0.9, y + 2.1, z + 0.8); }
    this.addLight("#ff8a7a", 40, 40, (c.x0 + c.x1) / 2, c.y1 - 2, -6, "lux");
  }
  private city() {
    const r = this.root, c = CITY;
    box(r, std("grass_city", { color: "#ffffff", map: tiled(grassTex(), 20, 4) }), c.x0, c.y0, -DEPTH, c.x1, c.y0 + 0.5, 0);
    const fake = Object.assign(Object.create(Town.prototype), { root: new THREE.Group() }) as Town;
    fake.root.position.set(0, c.y0 + 0.5, 0); fake.root.scale.setScalar(0.17); r.add(fake.root);
    const GL: [string, string, string, string?][] = [["#7cbcf0", "#cde8fb", "#ffffff", "#f2c542"], ["#3a9aa8", "#7fd0d4", "#f2f4f6"], ["#5fa8e0", "#a8d8f8", "#f2f4f6"], ["#86c8e8", "#d8f0fa", "#f6efe0", "#f2c542"]];
    for (let i = 0; i < 36; i++) { const x = (-31 + (i % 12) * 5.4 + (hash(i, 81) - 0.5) * 2) / 0.17, z = (-6 - Math.floor(i / 12) * 6 - hash(i, 82) * 3) / 0.17;
      if (Math.abs(x * 0.17 - (CSHAFT.x0 + CSHAFT.x1) / 2) < 4) continue;
      fake.tower(x, z, 80 + hash(i, 83) * 110, Math.floor(hash(i, 84) * 5), GL[i % 4], i + 700); }
    this.artSun = new THREE.Group(); this.artSun.position.set(0, c.y1 - 9, -12); r.add(this.artSun);
    this.artSun.add(mesh(new THREE.SphereGeometry(3, 28, 18), this.glowM("#fff3c0", 4, "sun"), 0, 0, 0, false));
    for (let k = 0; k < 2; k++) { const ring = mesh(new THREE.TorusGeometry(4.2, 0.22, 8, 48), this.glowM("#ffd26a", 2.5, "sun"), 0, 0, 0, false); ring.rotation.set(Math.PI / 2 + k * 0.9, k * 0.6, 0); this.artSun.add(ring); this.rings.push(ring); }
    for (const a of [0, 2.1, 4.2]) { const rod = mesh(new THREE.CylinderGeometry(0.15, 0.15, 7, 6), col("#9aa0a8"), Math.cos(a) * 3, 5.5, Math.sin(a) * 3, false); rod.rotation.set(Math.sin(a) * 0.4, 0, -Math.cos(a) * 0.4); this.artSun.add(rod); }
    this.addLight("#fff0c8", 900, 120, 0, c.y1 - 9, -8, "sun");
    box(r, col("#5a5f68", { metalness: 0.5 }), CSHAFT.x0 + 0.2, CITY.y1, -10.5, CSHAFT.x1 - 0.2, -0.8, -10);
  }
  private machine() {
    const r = this.root, m = MACH, cx = (m.x0 + m.x1) / 2;
    box(r, col("#2c2a34"), m.x0, m.y0, -DEPTH, m.x1, m.y0 + 0.4, 0);
    const base = mesh(new THREE.CylinderGeometry(4, 8, 7, 4), col("#3a3848", { metalness: 0.3 }), cx, m.y0 + 3.9, -10); base.rotation.y = Math.PI / 4; r.add(base);
    for (let k = 0; k < 4; k++) { const ring = mesh(new THREE.TorusGeometry(2.6, 0.32, 8, 32), this.glowM("#c48cff", 3, "mach"), cx, m.y0 + 8 + k * 1.1, -10, false); ring.rotation.x = Math.PI / 2; r.add(ring); }
    r.add(mesh(new THREE.CylinderGeometry(2.2, 2.2, 5, 24), col("#4a4858", { metalness: 0.5 }), cx, m.y0 + 9.6, -10));
    this.addLight("#b07cff", 60, 30, cx, m.y0 + 10, -4, "mach");
  }
  /** état : power (bunkers de luxe allumés), mach (machine/câbles), dig (caves des voisins), cab (y de l'ascenseur), famLight */
  update(t: number, p: { cloudH: number; power?: number; mach?: number; dig?: number; cabY?: number; cabOn?: number; boil?: number }) {
    this.cloud.update(p.cloudH, t, 1, p.boil ?? 0);
    const pw = p.power ?? 1, mc = p.mach ?? 0.5, cb = p.cabOn ?? pw;
    const k = (g: string) => (g === "lux" || g === "sun" ? pw : g === "mach" ? mc : g === "cab" ? cb : 1);
    for (const L of this.lights) L.l.intensity = L.base * k(L.grp);
    for (const G of this.glows) G.m.emissiveIntensity = G.base * k(G.grp);
    this.cables.emissiveIntensity = mc * (1.2 + 0.6 * Math.sin(t * 8));
    const d = p.dig ?? 1; this.fills.forEach((f, i) => { const kk = Math.min(1, Math.max(0, d * 1.6 - i * 0.1)); f.scale.z = Math.max(0.001, 1 - kk); f.position.z = -DEPTH * (1 - kk) / 2 - DEPTH * kk; f.visible = kk < 0.999; });
    if (p.cabY !== undefined) this.cab.position.y = p.cabY;
    this.water.offset.set(t * 0.05, Math.sin(t * 0.7) * 0.03);
    this.rings.forEach((rg, i) => { rg.rotation.z = t * (0.4 + i * 0.25); });
  }
}
