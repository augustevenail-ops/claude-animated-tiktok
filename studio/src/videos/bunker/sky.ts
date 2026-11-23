// Ciel et montagnes (réf. 5, 6) : montagnes enneigées, lac, prairie, nuage noir ; avion de ligne qui se change en pierre
// du nez vers la queue ; nuée d'oiseaux pétrifiés qui tombent. Cabine (réf. 7) : allée bleu marine, sièges, passagers en pierre.
import * as THREE from "three";
import { box, col, glow, mesh, std, tiled, Cloud, V, petrifyObject, petrifyUniforms, Petrify } from "./common";
import { ctex, grassTex, hash, rockTex } from "./tex";
import { Actor, CAST } from "./chars";

const mountainTex = () => ctex("mountain", 512, 512, (g) => {
  g.fillStyle = "#9a9aa0"; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 12000; i++) { g.fillStyle = `rgba(${hash(i, 1) < 0.5 ? "70,70,78" : "220,220,226"},0.25)`; g.fillRect(hash(i, 2) * 512, hash(i, 3) * 512, 2, 2); }
}, true);
const fuselageTex = () => ctex("fuselage", 1024, 256, (g) => {
  g.fillStyle = "#f6f6f4"; g.fillRect(0, 0, 1024, 256);
  g.fillStyle = "#2f7fd0"; g.fillRect(0, 150, 1024, 22); g.fillStyle = "#f2c230"; g.fillRect(0, 140, 1024, 6);
  g.fillStyle = "#1c2430"; for (let x = 120; x < 940; x += 34) g.fillRect(x, 96, 16, 22);
  g.fillStyle = "#1c2430"; g.fillRect(70, 70, 28, 60);
});

export class Sky {
  root = new THREE.Group(); sun: THREE.DirectionalLight; hemi: THREE.HemisphereLight; cloud: Cloud;
  plane = new THREE.Group(); planeU: Petrify; birds: { g: THREE.Group; wl: THREE.Object3D; wr: THREE.Object3D; u: Petrify; seed: number }[] = [];
  constructor() {
    const r = this.root;
    this.hemi = new THREE.HemisphereLight("#d8ecff", "#6a9a4a", 1.25); r.add(this.hemi);
    this.sun = new THREE.DirectionalLight("#fff6e6", 2.6); this.sun.position.set(120, 260, 260); this.sun.castShadow = true;
    const sc = this.sun.shadow.camera; sc.left = -260; sc.right = 260; sc.top = 260; sc.bottom = -260; sc.near = 10; sc.far = 900; this.sun.shadow.bias = -0.0005;
    r.add(this.sun, this.sun.target);
    // horizon clair sous le nuage
    r.add(mesh(new THREE.CylinderGeometry(1500, 1500, 260, 48, 1, true), new THREE.MeshBasicMaterial({ color: "#f8f2d8", side: THREE.BackSide, fog: false }), 0, 80, 0, false));
    r.add(mesh(new THREE.CylinderGeometry(1490, 1490, 50, 48, 1, true), new THREE.MeshBasicMaterial({ color: "#9fd4f6", side: THREE.BackSide, fog: false }), 0, 200, 0, false));
    box(r, std("grass_s", { color: "#ffffff", map: tiled(grassTex(), 80, 80) }), -1500, -2, -1500, 1500, 0, 1500);
    r.add(mesh(new THREE.CircleGeometry(220, 48).rotateX(-Math.PI / 2), std("lake", { color: "#3f9ee0", roughness: 0.1, metalness: 0.1 }), 60, 0.3, 260, false));
    // montagnes enneigées
    const mt = std("mtn", { color: "#ffffff", map: tiled(mountainTex(), 3, 3), flatShading: true, roughness: 1 });
    const snow = std("snow", { color: "#f6f8fb", flatShading: true, roughness: 0.9 });
    for (let i = 0; i < 34; i++) {
      const a = (i / 34) * Math.PI * 2 + hash(i, 1) * 0.1, d = 520 + hash(i, 2) * 380, h = 160 + hash(i, 3) * 200, w = 120 + hash(i, 4) * 120;
      const g = new THREE.ConeGeometry(w, h, 7, 4); const p = g.attributes.position;
      for (let k = 0; k < p.count; k++) { const y = p.getY(k); if (y < h / 2 - 1) { p.setX(k, p.getX(k) * (0.85 + hash(k + i * 50, 5) * 0.3)); p.setZ(k, p.getZ(k) * (0.85 + hash(k + i * 50, 6) * 0.3)); p.setY(k, y + (hash(k + i * 50, 7) - 0.5) * 20); } }
      g.computeVertexNormals();
      const m = mesh(g, mt, Math.cos(a) * d, h / 2 - 10, Math.sin(a) * d); m.rotation.y = hash(i, 8) * 3; r.add(m);
      const cap = mesh(new THREE.ConeGeometry(w * 0.36, h * 0.34, 7, 1), snow, Math.cos(a) * d, h - 10 - h * 0.17 + 1, Math.sin(a) * d); cap.rotation.y = m.rotation.y; r.add(cap);
    }
    this.cloud = new Cloud(2600, 2600, 3000, 0, 0, 10, 24); r.add(this.cloud.group);
    this.buildPlane(); this.planeU = petrifyUniforms(V(-1, 0, 0)); petrifyObject(this.plane, this.planeU, "plane");
    for (let i = 0; i < 26; i++) {
      const g = new THREE.Group(), bm = col(i % 3 ? "#f2f2f6" : "#dcdce4"), u = petrifyUniforms(V(0, -1, 0));
      g.add(mesh(new THREE.SphereGeometry(0.5, 10, 8).scale(1.6, 0.8, 0.8), bm)); g.add(mesh(new THREE.ConeGeometry(0.18, 0.5, 6).rotateZ(-Math.PI / 2), col("#f2b230"), 1.0, 0.05, 0));
      const wl = new THREE.Group(), wr = new THREE.Group(); wl.add(mesh(new THREE.BoxGeometry(0.8, 0.06, 1.6).translate(0, 0, 0.8), bm)); wr.add(mesh(new THREE.BoxGeometry(0.8, 0.06, 1.6).translate(0, 0, -0.8), bm));
      g.add(wl, wr); petrifyObject(g, u, "bird" + i); r.add(g); this.birds.push({ g, wl, wr, u, seed: i });
    }
  }
  private buildPlane() {
    const p = this.plane, white = col("#f6f6f4"), grey = col("#c9ccd2");
    const fus = mesh(new THREE.CylinderGeometry(2.4, 2.4, 40, 24, 1).rotateZ(Math.PI / 2), [new THREE.MeshStandardMaterial({ map: fuselageTex(), roughness: 0.5 }), white, white]); p.add(fus);
    const nose = mesh(new THREE.SphereGeometry(2.4, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2).rotateZ(-Math.PI / 2).scale(1.9, 1, 1), white, 20, 0, 0); p.add(nose);
    p.add(mesh(new THREE.BoxGeometry(2.6, 0.9, 0.2).translate(0, 0, 0), glow("#1c2430", 0.05), 22.2, 0.9, 1.5));
    const tail = mesh(new THREE.ConeGeometry(2.4, 9, 24).rotateZ(Math.PI / 2).scale(1, 1, 1), white, -24.5, 0.4, 0); p.add(tail);
    const wingS = new THREE.Shape([V(0, 0, 0), V(-6, 0, 0), V(-14, 20, 0), V(-11, 20, 0)].map((v) => new THREE.Vector2(v.x, v.y)));
    for (const s of [1, -1]) {
      const wg = new THREE.ExtrudeGeometry(wingS, { depth: 0.5, bevelEnabled: false }); wg.rotateX(Math.PI / 2 * s); const w = mesh(wg, white, 4, -1, 0); p.add(w);
      const eng = mesh(new THREE.CylinderGeometry(1.2, 1.1, 4.5, 20).rotateZ(Math.PI / 2), grey, 1.8, -2.2, s * 7.5); p.add(eng);
      p.add(mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.2, 20).rotateZ(Math.PI / 2), col("#2f7fd0"), 4.1, -2.2, s * 7.5));
      const hs = new THREE.ExtrudeGeometry(new THREE.Shape([new THREE.Vector2(0, 0), new THREE.Vector2(-3, 0), new THREE.Vector2(-6, 7), new THREE.Vector2(-4.5, 7)]), { depth: 0.3, bevelEnabled: false }); hs.rotateX(Math.PI / 2 * s); p.add(mesh(hs, white, -22, 0.6, 0));
    }
    const fin = new THREE.ExtrudeGeometry(new THREE.Shape([new THREE.Vector2(0, 0), new THREE.Vector2(-6, 0), new THREE.Vector2(-9, 9), new THREE.Vector2(-6, 9)]), { depth: 0.4, bevelEnabled: false });
    p.add(mesh(fin, col("#2f7fd0"), -20, 1.5, -0.2));
    this.root.add(p);
  }
  update(t: number, p: { cloudH: number; stone?: number; birdsStone?: number; birdsFall?: number; birdsPos?: THREE.Vector3; boil?: number }) {
    this.cloud.update(p.cloudH, t, 1.6, p.boil ?? 0);
    this.planeU.thr.value = p.stone === undefined ? -1e9 : -(this.plane.position.x + 30 - p.stone * 62);   // du nez (x+) vers la queue
    const bp = p.birdsPos ?? V(0, 120, 0);
    for (const b of this.birds) {
      const s = b.seed, fall = Math.max(0, (p.birdsFall ?? 0) - hash(s, 9) * 0.25);
      const x = bp.x + (hash(s, 1) - 0.5) * 34, y = bp.y + (hash(s, 2) - 0.5) * 14 - fall * fall * 140, z = bp.z + (hash(s, 3) - 0.5) * 30;
      b.g.position.set(x, Math.max(1, y), z); b.g.scale.setScalar(2.2);
      const st = Math.max(0, (p.birdsStone ?? 0) - hash(s, 4) * 0.3) / 0.7; b.u.thr.value = st <= 0 ? -1e9 : -b.g.position.y + 4 - st * 8;
      const flap = st >= 1 ? 0.2 : Math.sin(t * 16 + s * 2) * 0.8 * (1 - Math.min(1, st));
      b.wl.rotation.x = flap; b.wr.rotation.x = -flap; b.g.rotation.z = fall > 0 ? -fall * 2.2 : 0.05 * Math.sin(t * 3 + s); b.g.rotation.y = fall * 1.3 * (s % 2 ? 1 : -1);
    }
  }
}

/** cabine de l'avion : passagers changés en pierre */
export class Cabin {
  root = new THREE.Group(); hemi: THREE.HemisphereLight; u: Petrify; hero: Actor; heroU: Petrify; light: THREE.PointLight;
  constructor() {
    const r = this.root;
    this.hemi = new THREE.HemisphereLight("#ffffff", "#2a3a7a", 1.3); r.add(this.hemi);
    this.light = new THREE.PointLight("#fff8ee", 220, 60, 1.4); this.light.position.set(0, 3.2, -6); r.add(this.light);
    const L = 60;
    box(r, col("#1f2d6a"), -3.2, -0.2, -L, 3.2, 0, 4);
    box(r, col("#24307a"), -0.7, 0, -L, 0.7, 0.02, 4, false);
    box(r, col("#dfe2e8"), -3.3, 0, -L, -3.2, 3.6, 4); box(r, col("#dfe2e8"), 3.2, 0, -L, 3.3, 3.6, 4);
    for (const s of [-1, 1]) { const bin = box(r, col("#e8eaee"), s > 0 ? 1.9 : -3.2, 2.6, -L, s > 0 ? 3.2 : -1.9, 3.3, 4); bin.rotation.z = s * -0.25;
      box(r, glow("#fffbe8", 2.4), s > 0 ? 1.5 : -1.6, 3.35, -L, s > 0 ? 1.6 : -1.5, 3.4, 4, false); box(r, col("#1f2d6a"), s > 0 ? 1.85 : -1.95, 2.48, -L, s > 0 ? 1.95 : -1.85, 2.58, 4, false); }
    box(r, glow("#fffaf0", 1.6), -1.4, 3.6, -L, 1.4, 3.7, 4, false);
    const seat = col("#2c4aa8"), top = col("#f4f6f8");
    this.u = petrifyUniforms(V(0, 1, 0)); this.heroU = petrifyUniforms(V(0, 1, 0));
    const kinds = ["n1", "n2", "n3", "n4", "rich4", "rich3", "dad", "mom"];
    let n = 0; this.hero = null as unknown as Actor;
    for (let row = 0; row < 16; row++) for (const x of [-2.4, -1.5, 1.5, 2.4]) {
      const z = 1 - row * 3.2; box(r, seat, x - 0.42, 0.4, z - 0.4, x + 0.42, 0.75, z + 0.35); box(r, seat, x - 0.42, 0.75, z + 0.3, x + 0.42, 1.9, z + 0.55); box(r, top, x - 0.42, 1.6, z + 0.31, x + 0.42, 1.9, z + 0.56);
      if (hash(row * 4 + x, 3) < 0.25 && !(row === 1 && x === 1.5)) continue;
      const a = new Actor(CAST[kinds[n++ % kinds.length]], 0.3, n); a.root.position.set(x, 0.1, z - 0.1); a.pose(0, { sit: true, expr: "scared", yaw: Math.PI }); r.add(a.root);
      if (row === 1 && x === 1.5) { this.hero = a; petrifyObject(a.root, this.heroU, "cabhero"); } else petrifyObject(a.root, this.u, "cab");
    }
    this.u.thr.value = 1e9;
  }
  update(t: number, p: { heroStone: number; flicker?: number }) {
    this.heroU.thr.value = -0.2 + p.heroStone * 2.2;
    this.light.intensity = 220 * (p.flicker ? (Math.sin(t * 37) > 0.6 ? 0.4 : 1) : 1);
    this.hero.pose(t, { sit: true, expr: p.heroStone > 0.75 ? "scared" : "worried", headYaw: 0.25 * Math.sin(t * 2), headPitch: 0.1 });
    this.hero.root.rotation.y = Math.PI;
  }
}
export { rockTex };
