// Bunkers de luxe : manoir souterrain (réf. 8, 13 : villa blanche à baies dorées, piscine, transats, parasol doré, faux ciel),
// salle de cinéma (réf. 9), zoo privé, ville souterraine au soleil artificiel (réf. 10, 11) avec parc, restaurant, terrasse.
import * as THREE from "three";
import { box, col, glow, mesh, std, tiled, tree, palm, panel, V } from "./common";
import { ctex, fakeSkyTex, glassTex, grassTex, hash, rockTex, signTex, tileTex, waterTex, facadeTex, asphaltTex } from "./tex";
import { Actor, CAST } from "./chars";
import { Town } from "./town";

export const ZOO_X = -220, CINE_X = 220, CITY_Z = -500;
const spotTex = () => ctex("giraffe", 128, 128, (g) => { g.fillStyle = "#f2c24a"; g.fillRect(0, 0, 128, 128); g.fillStyle = "#a8642a";
  for (let i = 0; i < 16; i++) { g.beginPath(); g.ellipse(hash(i, 1) * 128, hash(i, 2) * 128, 9 + hash(i, 3) * 6, 7 + hash(i, 4) * 5, hash(i, 5) * 3, 0, 7); g.fill(); } }, true);

export class Lux {
  root = new THREE.Group(); hemi: THREE.HemisphereLight; sun: THREE.DirectionalLight;
  pw: { o: { intensity: number } | THREE.MeshStandardMaterial; base: number; emissive?: boolean }[] = [];
  actors: Record<string, Actor> = {}; extras: Actor[] = []; water: THREE.Texture[] = []; coins: THREE.Mesh[] = []; artSun!: THREE.Group; sunRings: THREE.Mesh[] = [];
  red: THREE.PointLight[] = []; animals: { g: THREE.Group; k: string; head?: THREE.Object3D }[] = []; screen!: THREE.MeshStandardMaterial;
  constructor() {
    const r = this.root;
    this.hemi = new THREE.HemisphereLight("#fff4e4", "#8a6a4a", 1.1); r.add(this.hemi);
    this.sun = new THREE.DirectionalLight("#fff6e8", 2.0); this.sun.position.set(40, 90, 80); this.sun.castShadow = true;
    const sc = this.sun.shadow.camera; sc.left = -90; sc.right = 90; sc.top = 90; sc.bottom = -90; sc.near = 5; sc.far = 300; this.sun.shadow.bias = -0.0004;
    this.sun.target.position.set(0, 0, -10); r.add(this.sun, this.sun.target);
    this.pw.push({ o: this.hemi, base: 1.1 }, { o: this.sun, base: 2.0 });
    this.mansion(); this.cinema(); this.zoo(); this.city();
    for (let i = 0; i < 3; i++) { const l = new THREE.PointLight("#ff3a2a", 0, 70, 1.4); this.red.push(l); r.add(l); }
    this.red[0].position.set(0, 20, 10); this.red[1].position.set(CINE_X, 10, 0); this.red[2].position.set(0, 40, CITY_Z);
  }
  private pm(c: string, i: number) { const m = new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: i, roughness: 1 }); this.pw.push({ o: m, base: i, emissive: true }); return m; }
  private cave(cx: number, cz: number, w: number, d: number, h: number, sky = true) {
    const r = this.root, rock = std("rock_w", { color: "#ffffff", map: tiled(rockTex(), 3, 1.5), roughness: 1 });
    box(r, rock, cx - w / 2 - 2, 0, cz - d / 2 - 2, cx + w / 2 + 2, h, cz - d / 2, false); box(r, rock, cx - w / 2 - 2, 0, cz - d / 2, cx - w / 2, h, cz + d / 2, false);
    box(r, rock, cx + w / 2, 0, cz - d / 2, cx + w / 2 + 2, h, cz + d / 2, false);
    box(r, std("rock_c", { color: "#ffffff", map: tiled(rockTex(), 4, 3), roughness: 1 }), cx - w / 2 - 2, h, cz - d / 2 - 2, cx + w / 2 + 2, h + 2, cz + d / 2 + 2, false);
    if (sky) { const tex = fakeSkyTex(); for (let k = 0; k < 3; k++) { const p = panel(r, tex, w * 0.26, d * 0.7, cx - w * 0.3 + k * w * 0.3, h - 0.05, cz, 1.0); this.pw.push({ o: p.material as THREE.MeshStandardMaterial, base: 1.0, emissive: true });
      box(r, col("#f2c542", { metalness: 0.6, roughness: 0.3 }), cx - w * 0.3 + k * w * 0.3 - w * 0.13 - 0.3, h - 0.4, cz - d * 0.35, cx - w * 0.3 + k * w * 0.3 - w * 0.13, h, cz + d * 0.35, false); } }
  }
  private mansion() {
    const r = this.root;
    this.cave(0, -10, 130, 90, 30);
    box(r, std("tile_p", { color: "#ffffff", map: tiled(tileTex("#efe0c4", "#d9c6a2"), 24, 18) }), -65, -0.5, -55, 65, 0, 35);
    // villa à trois niveaux
    const v = new THREE.Group(); v.position.set(-6, 0, -36); r.add(v);
    const gm = std("villa_glass", { color: "#ffffff", map: tiled(glassTex("#fff8e4", "#ffffff", "#c89a2a", 8, 1), 3, 1), emissive: "#fff1cc", emissiveIntensity: 0.35, roughness: 0.1, metalness: 0.2 });
    this.pw.push({ o: gm, base: 0.35, emissive: true });
    for (let k = 0; k < 3; k++) { const w = 64 - k * 9, y = k * 5.2, x = k * 4;
      box(v, gm, x - w / 2, y, -6, x + w / 2, y + 4.6, 6); box(v, col("#f4f6f8"), x - w / 2 - 1, y + 4.6, -7, x + w / 2 + 1, y + 5.2, 7);
      box(v, col("#cfe6f2", { transparent: true, opacity: 0.5 }), x - w / 2, y + 5.2, 6.4, x + w / 2, y + 6.3, 6.6, false); }
    box(v, col("#f4f1ea"), -10, 0, 6, 10, 0.4, 10); for (let k = 0; k < 4; k++) box(v, col("#f4f1ea"), -6, 0, 10 + k * 0.6, 6, 0.4 - k * 0.1, 10.6 + k * 0.6);
    // piscine
    box(r, col("#f6f4ee"), -36, 0, -12, 36, 0.35, 8);
    const wt = tiled(waterTex(), 6, 2); this.water.push(wt);
    r.add(mesh(new THREE.PlaneGeometry(70, 18).rotateX(-Math.PI / 2), std("pool", { color: "#ffffff", map: wt, roughness: 0.04, metalness: 0.25, envMapIntensity: 1.5, emissive: "#1a6aa0", emissiveIntensity: 0.2 }), 0, 0.38, -2, false));
    for (let x = -34; x <= 34; x += 2) box(r, col("#ffffff"), x - 0.5, 0.35, -11.6, x + 0.5, 0.42, -11.2, false);
    // transats, parasol doré, arbres
    for (let k = 0; k < 6; k++) { const x = -30 + k * 7, z = 14; const l = new THREE.Group(); l.position.set(x, 0, z); r.add(l);
      box(l, col(k % 2 ? "#f2c542" : "#f4f6f8"), -0.8, 0.4, -2, 0.8, 0.6, 1.2); const back = box(l, col(k % 2 ? "#f2c542" : "#f4f6f8"), -0.8, 0.5, 1.0, 0.8, 0.7, 2.6); back.rotation.x = -0.6; back.position.y = 1.0;
      for (const sx of [-0.7, 0.7]) box(l, col("#d8d4cc"), sx - 0.06, 0, -1.8, sx + 0.06, 0.4, 2.2); }
    const umb = new THREE.Group(); umb.position.set(-12, 0, 20); r.add(umb);
    umb.add(mesh(new THREE.CylinderGeometry(0.12, 0.12, 4.4, 8), col("#d9a21a", { metalness: 0.6, roughness: 0.3 }), 0, 2.2, 0));
    umb.add(mesh(new THREE.SphereGeometry(2.6, 32, 12, 0, Math.PI * 2, 0, Math.PI / 2.3).scale(1, 0.55, 1), col("#e8b22a", { metalness: 0.9, roughness: 0.2 }), 0, 3.9, 0));
    umb.add(mesh(new THREE.CylinderGeometry(1.6, 1.6, 0.1, 24), col("#f4f1ea"), 0, 1.4, 0)); umb.add(mesh(new THREE.CylinderGeometry(0.1, 0.1, 1.4, 6), col("#d9a21a"), 0, 0.7, 0));
    tree(r, -44, -20, 2.2, 1); tree(r, 30, -20, 2.2, 2); palm(r, 46, -16, 2.0); palm(r, -52, 10, 2.0); tree(r, 50, 16, 2, 4);
    for (const [x, z] of [[-20, -18], [20, -18], [-8, 6], [8, 6]] as const) { r.add(mesh(new THREE.CylinderGeometry(0.03, 0.03, 9, 4), col("#c89a2a"), x, 25.5, z, false));
      r.add(mesh(new THREE.SphereGeometry(0.9, 16, 12), this.pm("#fff6dc", 2.2), x, 20.5, z, false)); }
    // entrée du cinéma (marquise violette)
    const mq = new THREE.Group(); mq.position.set(50, 0, -30); r.add(mq);
    box(mq, col("#4a2a7a"), -6, 0, -3, 6, 9, 3); box(mq, col("#f6b8d8"), -4, 0, 3, 4, 6, 3.2);
    box(mq, std("cine_sign", { color: "#ffffff", map: signTex("cine", "CINÉMA", "#2a1a4a", "#ffd84a", 1024, 192, 120), emissive: "#ffffff", emissiveMap: signTex("cine", "CINÉMA", "#2a1a4a", "#ffd84a", 1024, 192, 120), emissiveIntensity: 0.6 }), -5.5, 6.5, 3, 5.5, 8.5, 3.3);
    for (let k = 0; k < 14; k++) mq.add(mesh(new THREE.SphereGeometry(0.16, 8, 6), this.pm("#fff2b0", 2.5), -5.2 + k * 0.8, 8.8, 3.4, false));
    // table aux pièces d'or
    const tb = new THREE.Group(); tb.position.set(22, 0, 20); r.add(tb);
    box(tb, col("#f4f1ea"), -2.4, 1.6, -1.4, 2.4, 1.8, 1.4); tb.add(mesh(new THREE.CylinderGeometry(0.2, 0.3, 1.6, 8), col("#c89a2a"), 0, 0.8, 0));
    const gold = col("#f2c230", { metalness: 0.75, roughness: 0.25, emissive: "#6a4a00", emissiveIntensity: 0.25 });
    for (let k = 0; k < 9; k++) { const c = mesh(new THREE.CylinderGeometry(0.32, 0.32, 1, 18), gold, -1.6 + (k % 3) * 0.9 + (hash(k, 1) - 0.5) * 0.2, 1.8, -0.7 + Math.floor(k / 3) * 0.7); this.coins.push(c); tb.add(c); }
    // personnages du manoir
    for (const k of ["rich1", "rich3", "rich4", "narr", "dad", "mom", "bro", "n1", "n2", "n3", "n4"]) { const a = new Actor(CAST[k], 0.36, Object.keys(this.actors).length + 50); a.root.visible = false; this.actors[k] = a; r.add(a.root); }
  }
  private cinema() {
    const r = this.root, X = CINE_X;
    box(r, col("#1c1014"), X - 30, -0.5, -40, X + 30, 0, 30); box(r, col("#150c10"), X - 32, 0, -42, X + 32, 22, -40); box(r, col("#241418"), X - 32, 0, -40, X - 30, 22, 30); box(r, col("#241418"), X + 30, 0, -40, X + 32, 22, 30);
    box(r, col("#120a0c"), X - 32, 22, -42, X + 32, 24, 30);
    this.screen = this.pm("#dfe8ff", 1.2) as THREE.MeshStandardMaterial; r.add(mesh(new THREE.PlaneGeometry(40, 16), this.screen, X, 12, -39.8, false));
    const red = col("#c4283a"), dark = col("#8a1424"), goldM = col("#e8b22a", { metalness: 0.6, roughness: 0.3 });
    for (let row = 0; row < 8; row++) for (let k = 0; k < 14; k++) { const x = X - 19.5 + k * 3, z = -14 + row * 4, y = row * 0.7;
      box(r, col("#2a1418"), x - 1.6, 0, z - 2, x + 1.6, y, z + 2, false);
      box(r, red, x - 1.2, y, z - 0.9, x + 1.2, y + 1.0, z + 0.9); box(r, dark, x - 1.2, y + 1.0, z + 0.6, x + 1.2, y + 3.0, z + 1.2);
      box(r, goldM, x - 1.4, y + 1.0, z - 0.8, x - 1.2, y + 1.5, z + 0.9, false); }
    for (const z of [-20, 0, 20]) { const s = mesh(new THREE.SphereGeometry(0.6, 12, 8), this.pm("#ffae4a", 2.5), X + 29.5, 8, z, false); r.add(s);
      const l = new THREE.PointLight("#ff9a3c", 60, 30, 1.6); l.position.set(X + 27, 8, z); r.add(l); this.pw.push({ o: l, base: 60 }); }
    const sl = new THREE.PointLight("#bcd0ff", 140, 70, 1.4); sl.position.set(X, 12, -30); r.add(sl); this.pw.push({ o: sl, base: 140 });
  }
  private zoo() {
    const r = this.root, X = ZOO_X;
    this.cave(X, -10, 120, 90, 30);
    box(r, std("grass_z", { color: "#ffffff", map: tiled(grassTex(), 20, 16) }), X - 62, -0.5, -57, X + 62, 0, 37);
    const fence = col("#e8e2d2"); for (let x = X - 40; x <= X + 40; x += 2.5) box(r, fence, x - 0.15, 0, 9.85, x + 0.15, 2.4, 10.15); box(r, fence, X - 40, 1.9, 9.9, X + 40, 2.2, 10.1); box(r, fence, X - 40, 0.9, 9.9, X + 40, 1.2, 10.1);
    for (let i = 0; i < 10; i++) tree(r, X - 50 + i * 11, -38 + hash(i, 3) * 10, 2 + hash(i, 4), i + 30);
    const rk = std("rock_b", { color: "#ffffff", map: tiled(rockTex(), 1, 1), flatShading: true }); for (let i = 0; i < 7; i++) { const b = mesh(new THREE.DodecahedronGeometry(2 + hash(i, 6) * 2), rk, X - 30 + i * 10, 1, -14 - hash(i, 7) * 10); r.add(b); }
    // girafe
    const gi = new THREE.Group(); gi.position.set(X - 6, 0, -4); r.add(gi); const gs = std("giraffe", { color: "#ffffff", map: spotTex() });
    box(gi, gs, -2, 4, -1, 2, 6.2, 1); for (const [x, z] of [[-1.6, -0.6], [1.6, -0.6], [-1.6, 0.6], [1.6, 0.6]]) box(gi, gs, x - 0.3, 0, z - 0.3, x + 0.3, 4.1, z + 0.3);
    const neck = new THREE.Group(); neck.position.set(1.6, 6, 0); gi.add(neck); box(neck, gs, -0.5, 0, -0.5, 0.5, 5.5, 0.5); box(neck, gs, -0.4, 5.2, -0.7, 1.9, 6.4, 0.7);
    box(neck, col("#a8642a"), -0.1, 6.4, -0.4, 0.2, 7, -0.2); box(neck, col("#a8642a"), -0.1, 6.4, 0.2, 0.2, 7, 0.4);
    for (const z of [-0.72, 0.72]) neck.add(mesh(new THREE.SphereGeometry(0.15, 8, 6), col("#111"), 1.3, 6.1, z));
    this.animals.push({ g: gi, k: "giraffe", head: neck });
    // lion
    const li = new THREE.Group(); li.position.set(X + 5, 0, 1); li.rotation.y = 0.5; r.add(li); const lb = col("#e8a640"), mane = col("#9a4a1a");
    box(li, lb, -2.2, 1.4, -1, 2.2, 3, 1); for (const [x, z] of [[-1.7, -0.6], [1.7, -0.6], [-1.7, 0.6], [1.7, 0.6]]) box(li, lb, x - 0.35, 0, z - 0.35, x + 0.35, 1.5, z + 0.35);
    const lh = new THREE.Group(); lh.position.set(2.4, 3.1, 0); li.add(lh); box(lh, mane, -0.6, -1.2, -1.4, 0.6, 1.2, 1.4); box(lh, lb, 0.3, -0.8, -0.9, 1.6, 0.8, 0.9);
    for (const z of [-0.45, 0.45]) lh.add(mesh(new THREE.SphereGeometry(0.14, 8, 6), col("#111"), 1.62, 0.25, z)); box(lh, col("#5a2a14"), 1.55, -0.3, -0.25, 1.7, 0, 0.25);
    const tail = box(li, lb, -3.8, 2.4, -0.12, -2.2, 2.6, 0.12); this.animals.push({ g: li, k: "lion", head: lh }); this.animals.push({ g: tail as unknown as THREE.Group, k: "tail" });
    // éléphant
    const el = new THREE.Group(); el.position.set(X + 14, 0, -10); el.rotation.y = -0.6; r.add(el); const eg = col("#9aa0aa");
    box(el, eg, -3, 2.2, -1.8, 3, 6, 1.8); for (const [x, z] of [[-2.2, -1.1], [2.2, -1.1], [-2.2, 1.1], [2.2, 1.1]]) box(el, eg, x - 0.6, 0, z - 0.6, x + 0.6, 2.4, z + 0.6);
    const eh = new THREE.Group(); eh.position.set(3.4, 5, 0); el.add(eh); box(eh, eg, -0.6, -1.4, -1.3, 1.4, 1.2, 1.3); box(eh, eg, 1.0, -3.4, -0.35, 1.6, -0.8, 0.35);
    box(eh, col("#8a909a"), -0.3, -1.2, -2.6, 0.2, 1.0, -1.3); box(eh, col("#8a909a"), -0.3, -1.2, 1.3, 0.2, 1.0, 2.6);
    this.animals.push({ g: el, k: "elephant", head: eh });
  }
  private city() {
    const r = this.root, Z = CITY_Z;
    const dome = mesh(new THREE.SphereGeometry(190, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2), std("dome", { color: "#ffffff", map: tiled(rockTex(), 6, 3), side: THREE.BackSide, roughness: 1 }), 0, -2, Z, false);
    dome.scale.set(1, 0.42, 1); r.add(dome);
    r.add(mesh(new THREE.CircleGeometry(190, 64).rotateX(-Math.PI / 2), std("grass_cz", { color: "#ffffff", map: tiled(grassTex(), 50, 50) }), 0, 0, Z, false));
    const asph = std("asph_c", { color: "#ffffff", map: tiled(asphaltTex(), 30, 1) });
    for (let k = -4; k <= 4; k++) { box(r, asph, -180, 0.02, Z + k * 30 - 2.2, 180, 0.08, Z + k * 30 + 2.2, false); box(r, asph, k * 30 - 2.2, 0.02, Z - 180, k * 30 + 2.2, 0.08, Z + 180, false); }
    r.add(mesh(new THREE.CircleGeometry(26, 40).rotateX(-Math.PI / 2).scale(1.4, 1, 1), std("pond", { color: "#8fd0f0", roughness: 0.1, emissive: "#3a8ab0", emissiveIntensity: 0.2 }), 0, 0.15, Z + 10, false));
    for (let i = 0; i < 36; i++) { const a = (i / 36) * Math.PI * 2, d = 40 + hash(i, 5) * 14; tree(r, Math.cos(a) * d * 1.3, Z + 10 + Math.sin(a) * d * 0.8, 2.4 + hash(i, 6), i + 60); }
    const fake = Object.assign(Object.create(Town.prototype), { root: r }) as Town;
    const GL: [string, string, string, string?][] = [["#7cbcf0", "#cde8fb", "#ffffff", "#f2c542"], ["#3a9aa8", "#7fd0d4", "#f2f4f6"], ["#5fa8e0", "#a8d8f8", "#f2f4f6"], ["#86c8e8", "#d8f0fa", "#f6efe0", "#f2c542"], ["#2f3a5a", "#5a6a8a", "#9aa4b8"]];
    for (let i = 0; i < 60; i++) { const a = (i / 60) * Math.PI * 2 + hash(i, 1) * 0.05, d = 95 + hash(i, 2) * 60; const x = Math.cos(a) * d, z = Z + Math.sin(a) * d * 0.9;
      if (z > Z + 60 && Math.abs(x) < 50) continue; const g = fake.tower(x, z, 40 + hash(i, 3) * 60, Math.floor(hash(i, 4) * 5), GL[i % 5], i + 900); g.scale.y = 1; }
    // immeubles bas au premier plan
    for (let i = 0; i < 7; i++) { const x = -70 + (i % 7) * 22, z = Z + 70, h = 14 + hash(i, 8) * 8; if (x > -60 && x < -36) continue;
      const m = std(`ap_${i % 3}_${Math.round(h)}`, { color: "#ffffff", map: tiled(facadeTex(["#d8b48a", "#e8d8c0", "#c8a878"][i % 3], "#5a8ae0", 4, 5, i % 7 === 3), 1, 1) });
      box(r, m, x - 8, 0, z - 7, x + 8, h, z + 7); box(r, col("#9a9aa0"), x - 8.3, h, z - 7.3, x + 8.3, h + 0.6, z + 7.3); }
    // soleil artificiel
    this.artSun = new THREE.Group(); this.artSun.position.set(0, 58, Z + 10); r.add(this.artSun);
    this.artSun.add(mesh(new THREE.SphereGeometry(11, 32, 20), this.pm("#fff6d0", 1.8), 0, 0, 0, false));
    for (let k = 0; k < 3; k++) { const ring = mesh(new THREE.TorusGeometry(15, 0.7, 8, 64), this.pm("#ffc850", 1.6), 0, 0, 0, false); ring.rotation.set(Math.PI / 2 + k * 0.7, k * 0.9, 0); this.artSun.add(ring); this.sunRings.push(ring); }
    for (const a of [0.4, 2.5, 4.6]) { const rod = mesh(new THREE.CylinderGeometry(0.6, 0.6, 40, 8), col("#9aa0a8", { metalness: 0.5 }), Math.cos(a) * 14, 22, Math.sin(a) * 14, false); rod.rotation.set(Math.sin(a) * 0.5, 0, -Math.cos(a) * 0.5); this.artSun.add(rod); }
    const sl = new THREE.PointLight("#fff2cc", 1300, 400, 1.3); sl.position.set(0, 50, Z + 10); r.add(sl); this.pw.push({ o: sl, base: 1300 });
    // terrasse (réf. 11) : carrelage, garde-corps vitré
    const te = new THREE.Group(); te.position.set(0, 26, Z + 120); r.add(te);
    box(te, std("tile_t", { color: "#ffffff", map: tiled(tileTex("#e8dcc8", "#cdbfa6"), 6, 4) }), -20, -1, -14, 20, 0, 8);
    box(te, col("#cfeaf6", { transparent: true, opacity: 0.55 }), -20, 0, -14.2, 20, 2.2, -13.8, false); box(te, col("#c89a2a", { metalness: 0.6 }), -20, 2.2, -14.3, 20, 2.5, -13.7);
    box(te, col("#d8c8a8"), -20, -26, -14, 20, -1, 8);
    // restaurant : façade, auvent rayé, tables, parasols
    const re = new THREE.Group(); re.position.set(-48, 0, Z + 100); r.add(re);
    const fm = std("resto_f", { color: "#ffffff", map: facadeTex("#f4e8d8", "#ffd88a", 4, 2, true) }); box(re, fm, -12, 0, -6, 12, 9, 6);
    box(re, std("resto_sign", { color: "#ffffff", map: signTex("resto", "RESTAURANT", "#8a1a2a", "#ffd84a", 1024, 160, 104) }), -9, 9, 6, 9, 11, 6.3);
    const aw = ctex("awning", 128, 32, (g) => { for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? "#ffffff" : "#d8283a"; g.fillRect(i * 16, 0, 16, 32); } }, true);
    const awn = mesh(new THREE.BoxGeometry(24, 0.3, 4), std("awn", { color: "#ffffff", map: tiled(aw, 3, 1) }), 0, 6.5, 8); awn.rotation.x = 0.35; re.add(awn);
    for (let k = 0; k < 6; k++) { const x = -10 + (k % 3) * 9, z = 13 + Math.floor(k / 3) * 7; re.add(mesh(new THREE.CylinderGeometry(1.4, 1.4, 0.15, 20), col("#f4f4f4"), x, 1.6, z)); re.add(mesh(new THREE.CylinderGeometry(0.12, 0.12, 1.6, 6), col("#c89a2a"), x, 0.8, z));
      re.add(mesh(new THREE.CylinderGeometry(0.05, 0.05, 4, 6), col("#c89a2a"), x, 2, z)); re.add(mesh(new THREE.ConeGeometry(2.6, 1.2, 16), col(k % 2 ? "#f4f4f4" : "#f2c542"), x, 4.4, z));
      re.add(mesh(new THREE.CylinderGeometry(0.25, 0.2, 0.4, 10), col("#c4283a"), x + 0.3, 1.88, z)); }
    for (const k of ["rich2", "rich3", "rich4", "rich1"]) { const a = new Actor(CAST[k], 0.36, 70 + this.extras.length); a.root.visible = false; this.extras.push(a); r.add(a.root); }
  }
  update(t: number, p: { power?: number; coins?: number; alarm?: number }) {
    const pw = p.power ?? 1;
    for (const L of this.pw) { if (L.emissive) (L.o as THREE.MeshStandardMaterial).emissiveIntensity = L.base * pw; else (L.o as { intensity: number }).intensity = L.base * (0.12 + 0.88 * pw); }
    const al = p.alarm ?? 0; for (const l of this.red) l.intensity = al * (160 + 90 * Math.sin(t * 6)) * (l === this.red[2] ? 20 : 1);
    this.screen.emissiveIntensity = pw * (1.1 + 0.25 * Math.sin(t * 5) * Math.sin(t * 1.7));
    for (const w of this.water) w.offset.set(t * 0.04, Math.sin(t * 0.6) * 0.04);
    this.coins.forEach((c, i) => { const h = 0.3 + (p.coins ?? 0.5) * (1.2 + hash(i, 4) * 1.6); c.scale.y = h; c.position.y = 1.8 + h / 2; });
    this.sunRings.forEach((rg, i) => { rg.rotation.z = t * (0.25 + i * 0.12); });
    for (const a of this.animals) { if (a.k === "giraffe" && a.head) a.head.rotation.z = -0.15 + 0.1 * Math.sin(t * 0.9); if (a.k === "lion" && a.head) a.head.rotation.y = 0.3 * Math.sin(t * 0.7); if (a.k === "tail") a.g.rotation.y = 0.4 * Math.sin(t * 3);
      if (a.k === "elephant" && a.head) a.head.rotation.z = 0.08 * Math.sin(t * 1.3); }
  }
}
