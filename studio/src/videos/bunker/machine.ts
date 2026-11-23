// Tunnel abandonné (câbles au sol) et salle de la machine (réf. 12, 14) : cœur à anneaux lumineux, quatre tours de
// refroidissement crachant des colonnes d'énergie violettes, passerelle, pupitre avec levier d'urgence et cadran ; explosion.
import * as THREE from "three";
import { box, col, mesh, std, tiled, V } from "./common";
import { ctex, energyTex, hash, rockTex } from "./tex";
import { Actor, CAST } from "./chars";

export const TUN_X = 400;
const dialTex = () => ctex("dial", 256, 256, (g) => {
  g.fillStyle = "#f4f1ea"; g.beginPath(); g.arc(128, 128, 120, 0, 7); g.fill(); g.lineWidth = 10; g.strokeStyle = "#2a2a30"; g.stroke();
  const arc = (a0: number, a1: number, c: string) => { g.strokeStyle = c; g.lineWidth = 22; g.beginPath(); g.arc(128, 128, 92, a0, a1); g.stroke(); };
  arc(Math.PI * 0.75, Math.PI * 1.35, "#3fbf5a"); arc(Math.PI * 1.35, Math.PI * 1.85, "#f2c230"); arc(Math.PI * 1.85, Math.PI * 2.25, "#e8483a");
  g.fillStyle = "#2a2a30"; for (let i = 0; i <= 10; i++) { const a = Math.PI * 0.75 + i * Math.PI * 1.5 / 10; g.save(); g.translate(128 + Math.cos(a) * 70, 128 + Math.sin(a) * 70); g.rotate(a); g.fillRect(-10, -3, 20, 6); g.restore(); }
  g.font = "900 34px Montserrat, sans-serif"; g.textAlign = "center"; g.fillText("ÉNERGIE", 128, 200);
});
const hazardTex = () => ctex("hazard", 128, 128, (g) => { g.fillStyle = "#f2c230"; g.fillRect(0, 0, 128, 128); g.fillStyle = "#1a1a1a"; for (let i = -4; i < 8; i++) { g.beginPath(); g.moveTo(i * 32, 0); g.lineTo(i * 32 + 16, 0); g.lineTo(i * 32 + 16 + 128, 128); g.lineTo(i * 32 + 128, 128); g.fill(); } }, true);

export class Machine {
  root = new THREE.Group(); hemi: THREE.HemisphereLight; key: THREE.DirectionalLight;
  rings: THREE.MeshStandardMaterial[] = []; columns: THREE.Mesh[] = []; tops: THREE.MeshStandardMaterial[] = []; lever!: THREE.Group; needle!: THREE.Object3D;
  sparks: THREE.Points; flash: THREE.Mesh; smoke: THREE.Mesh[] = []; coreLight: THREE.PointLight; purple: THREE.PointLight[] = [];
  narr: Actor; tunLamps: { m: THREE.MeshStandardMaterial; l: THREE.PointLight; f: number }[] = []; torch: THREE.SpotLight; cableM: THREE.MeshStandardMaterial;
  constructor() {
    const r = this.root;
    this.hemi = new THREE.HemisphereLight("#b8a8ff", "#2a2440", 0.9); r.add(this.hemi);
    this.key = new THREE.DirectionalLight("#d8d0ff", 1.0); this.key.position.set(40, 80, 60); this.key.castShadow = true;
    const sc = this.key.shadow.camera; sc.left = -60; sc.right = 60; sc.top = 60; sc.bottom = -60; sc.far = 300; r.add(this.key, this.key.target);
    // salle
    const wall = mesh(new THREE.CylinderGeometry(46, 46, 90, 48, 1, true), std("mach_wall", { color: "#5a4f8a", map: tiled(rockTex(), 6, 2), side: THREE.BackSide, roughness: 1 }), 0, 40, 0, false); r.add(wall);
    r.add(mesh(new THREE.CircleGeometry(46, 48).rotateX(Math.PI / 2), col("#2a2440"), 0, 85, 0, false));
    r.add(mesh(new THREE.CircleGeometry(46, 48).rotateX(-Math.PI / 2), col("#3a3f5a", { metalness: 0.3, roughness: 0.6 }), 0, -6, 0, false));
    for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; const s = mesh(new THREE.BoxGeometry(0.6, 140, 0.6), col("#4a4a5a"), Math.cos(a) * 28, -4 + 0.1, Math.sin(a) * 28, false); s.rotation.set(Math.PI / 2, 0, a); r.add(s); }
    // cœur de la machine
    const steel = col("#8a96b4", { metalness: 0.55, roughness: 0.35 }), dark = col("#4a5068", { metalness: 0.5, roughness: 0.4 });
    r.add(mesh(new THREE.CylinderGeometry(16, 17, 2, 48), dark, 0, -1, 0));
    r.add(mesh(new THREE.CylinderGeometry(9, 10, 26, 40), steel, 0, 13, 0));
    for (let k = 0; k < 7; k++) { const m = new THREE.MeshStandardMaterial({ color: "#e8f6ff", emissive: "#d8f0ff", emissiveIntensity: 3, roughness: 1 }); this.rings.push(m);
      const ring = mesh(new THREE.CylinderGeometry(10.2 - k * 0.05, 10.2, 1.1, 40, 1, true), m, 0, 2.5 + k * 3.4, 0, false); r.add(ring); }
    r.add(mesh(new THREE.ConeGeometry(9, 8, 40), steel, 0, 30, 0)); r.add(mesh(new THREE.CylinderGeometry(1.4, 1.4, 60, 16), dark, 0, 60, 0));
    // tours de refroidissement + colonnes d'énergie
    const em = new THREE.MeshBasicMaterial({ map: tiled(energyTex(), 2, 3), transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false, color: "#c8a0ff", side: THREE.DoubleSide });
    for (let k = 0; k < 4; k++) { const a = Math.PI / 4 + k * Math.PI / 2, x = Math.cos(a) * 27, z = Math.sin(a) * 27;
      r.add(mesh(new THREE.CylinderGeometry(5.5, 6, 14, 32), steel, x, 6, z)); r.add(mesh(new THREE.CylinderGeometry(5.8, 5.8, 1, 32), dark, x, 13.2, z));
      const tm = new THREE.MeshStandardMaterial({ color: "#f0e0ff", emissive: "#c89aff", emissiveIntensity: 3, roughness: 1 }); this.tops.push(tm);
      r.add(mesh(new THREE.CircleGeometry(5.2, 32).rotateX(-Math.PI / 2), tm, x, 13.75, z, false));
      const c = mesh(new THREE.CylinderGeometry(4.6, 5.2, 72, 32, 1, true), em.clone(), x, 50, z, false); (c.material as THREE.MeshBasicMaterial).map = tiled(energyTex(), 2, 3); this.columns.push(c); r.add(c);
      const pipe = mesh(new THREE.CylinderGeometry(1.1, 1.1, 18, 16), steel, x * 0.6, 8, z * 0.6); pipe.rotation.set(0, -a, Math.PI / 2); r.add(pipe);
      const pipe2 = mesh(new THREE.CylinderGeometry(0.8, 0.8, 18, 16), steel, x * 0.6, 3.5, z * 0.6); pipe2.rotation.set(0, -a, Math.PI / 2); r.add(pipe2);
      const pl = new THREE.PointLight("#b07cff", 900, 80, 1.5); pl.position.set(x * 0.8, 30, z * 0.8); r.add(pl); this.purple.push(pl); }
    this.coreLight = new THREE.PointLight("#dff2ff", 1600, 90, 1.5); this.coreLight.position.set(0, 14, 18); r.add(this.coreLight);
    // passerelle + garde-corps jaunes
    box(r, col("#c9ced8", { metalness: 0.3 }), -2.6, 3, 9.6, 2.6, 3.6, 46); const yel = col("#f2c230");
    for (const s of [-1, 1]) { box(r, yel, s * 2.4 - 0.1, 3.6, 9.6, s * 2.4 + 0.1, 5.2, 46); for (let z = 11; z < 46; z += 3) box(r, col("#9aa0aa"), s * 2.4 - 0.08, 3.6, z - 0.08, s * 2.4 + 0.08, 5.2, z + 0.08); }
    // pupitre, levier, cadran
    box(r, col("#c9ced8", { metalness: 0.3 }), 2.6, 3, 27, 7, 3.6, 34);
    const desk = new THREE.Group(); desk.position.set(4.2, 3.6, 30); desk.rotation.y = -Math.PI / 2; desk.scale.setScalar(0.55); r.add(desk);
    box(desk, col("#e86a3a"), -2, 0, -1, 2, 2.6, 1); const top = box(desk, col("#3a3f4a"), -2, 2.6, -1, 2, 2.9, 1.3); top.rotation.x = 0.3;
    for (let k = 0; k < 6; k++) desk.add(mesh(new THREE.SphereGeometry(0.15, 8, 6), new THREE.MeshStandardMaterial({ color: ["#e8483a", "#3fbf5a", "#f2c230"][k % 3], emissive: ["#e8483a", "#3fbf5a", "#f2c230"][k % 3], emissiveIntensity: 1.5 }), -1.4 + k * 0.5, 3.0, 0.2, false));
    const dial = new THREE.Group(); dial.position.set(0, 4.4, -0.6); desk.add(dial); box(dial, col("#3a3f4a"), -1.4, -1.4, -0.2, 1.4, 1.4, 0);
    dial.add(mesh(new THREE.CircleGeometry(1.25, 32), new THREE.MeshStandardMaterial({ map: dialTex(), roughness: 0.6 }), 0, 0, 0.02, false));
    this.needle = new THREE.Group(); this.needle.position.z = 0.06; dial.add(this.needle); box(this.needle, col("#e8483a"), -0.04, 0, -0.02, 0.04, 1.0, 0.02, false);
    this.lever = new THREE.Group(); this.lever.position.set(1.6, 3.0, 0.4); desk.add(this.lever);
    box(desk, std("hazard", { color: "#ffffff", map: hazardTex() }), 1.0, 2.8, -0.2, 2.2, 3.1, 1.0);
    this.lever.add(mesh(new THREE.CylinderGeometry(0.1, 0.1, 2.2, 8), col("#c9ced8", { metalness: 0.7 }), 0, 1.1, 0)); this.lever.add(mesh(new THREE.SphereGeometry(0.32, 14, 10), col("#e8302a", { roughness: 0.3 }), 0, 2.25, 0));
    // explosion
    const N = 600, pos = new Float32Array(N * 3); this.sparks = new THREE.Points(new THREE.BufferGeometry().setAttribute("position", new THREE.BufferAttribute(pos, 3)),
      new THREE.PointsMaterial({ color: "#ffd88a", size: 0.6, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); this.sparks.visible = false; r.add(this.sparks);
    this.flash = mesh(new THREE.SphereGeometry(1, 24, 16), new THREE.MeshBasicMaterial({ color: "#fff4d8", transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }), 0, 14, 0, false); this.flash.visible = false; r.add(this.flash);
    for (let i = 0; i < 18; i++) { const s = mesh(new THREE.IcosahedronGeometry(1, 1), col("#3a3640", { transparent: true, opacity: 0.85, flatShading: true }), 0, 0, 0, false); s.visible = false; this.smoke.push(s); r.add(s); }
    // tunnel abandonné
    const T = new THREE.Group(); T.position.set(TUN_X, 0, 0); r.add(T);
    const arch = mesh(new THREE.CylinderGeometry(5, 5, 220, 24, 1, true, Math.PI / 2, Math.PI).rotateX(Math.PI / 2), std("tun", { color: "#9a8a76", map: tiled(rockTex(), 3, 20), side: THREE.BackSide, roughness: 1 }), 0, 0, -100, false); T.add(arch);
    T.add(mesh(new THREE.CircleGeometry(5, 24, 0, Math.PI), new THREE.MeshBasicMaterial({ color: "#e8d8ff" }), 0, 0, -209, false));
    const endL = new THREE.PointLight("#c8a0ff", 400, 60, 1.4); endL.position.set(0, 2.5, -200); T.add(endL);
    box(T, col("#5a4e42"), -5, -0.5, -210, 5, 0, 10); for (const x of [-1.2, 1.2]) box(T, col("#6a6a72", { metalness: 0.5 }), x - 0.1, 0, -210, x + 0.1, 0.18, 10);
    for (let z = 8; z > -210; z -= 1.6) box(T, col("#4a3a2a"), -1.8, 0, z - 0.3, 1.8, 0.1, z + 0.3, false);
    this.cableM = new THREE.MeshStandardMaterial({ color: "#1e1c24", emissive: "#a060ff", emissiveIntensity: 0.6, roughness: 0.6 });
    for (let k = 0; k < 4; k++) { const c = mesh(new THREE.CylinderGeometry(0.16, 0.16, 220, 8).rotateX(Math.PI / 2), this.cableM, -3.6 + (k % 2) * 0.4, 0.25 + k * 0.3, -100); T.add(c); }
    for (let k = 0; k < 14; k++) { const z = -k * 15; const m = new THREE.MeshStandardMaterial({ color: "#ffe2a0", emissive: "#ffd080", emissiveIntensity: 2.5 }); T.add(mesh(new THREE.SphereGeometry(0.3, 10, 8), m, 2.6, 3.9, z, false));
      const l = new THREE.PointLight("#ffc880", 45, 18, 1.6); l.position.set(2.2, 3.6, z); T.add(l); this.tunLamps.push({ m, l, f: hash(k, 3) }); }
    this.narr = new Actor({ ...CAST.narr, name: "narrbag", backpack: "#e8783a" }, 0.36, 90); r.add(this.narr.root);
    this.torch = new THREE.SpotLight("#fff4dc", 300, 40, 0.45, 0.5, 1.4); r.add(this.torch, this.torch.target);
  }
  update(t: number, p: { on?: number; boom?: number; needle?: number; lever?: number; dark?: number }) {
    const on = p.on ?? 1, dk = 1 - (p.dark ?? 0);
    this.rings.forEach((m, i) => { m.emissiveIntensity = on * (2.2 + 1.2 * Math.sin(t * 6 - i * 0.8)) * dk + 0.02; });
    this.tops.forEach((m) => { m.emissiveIntensity = (on * 3 + 0.05) * dk; });
    this.columns.forEach((c, i) => { const m = c.material as THREE.MeshBasicMaterial; m.opacity = 0.85 * on * dk; c.visible = on * dk > 0.02; if (m.map) m.map.offset.y = -t * 1.1 - i * 0.37; });
    this.purple.forEach((l) => { l.intensity = 900 * on * dk; }); this.coreLight.intensity = 1600 * on * dk + 30;
    this.hemi.intensity = 0.9 * (0.25 + 0.75 * on * dk); this.key.intensity = 1.0 * (0.3 + 0.7 * dk);
    this.cableM.emissiveIntensity = 0.6 * on * (0.7 + 0.3 * Math.sin(t * 9)) * dk;
    this.needle.rotation.z = Math.PI * 0.75 - (p.needle ?? 0.3) * Math.PI * 1.5 + Math.PI / 2 * -1 + 0.02 * Math.sin(t * 30);
    this.lever.rotation.x = -0.5 + (p.lever ?? 0) * 1.3;
    for (const L of this.tunLamps) { const fl = L.f < 0.3 ? (Math.sin(t * 23 + L.f * 50) > 0.2 ? 1 : 0.15) : 1; L.m.emissiveIntensity = 2.5 * fl; L.l.intensity = 45 * fl; }
    const b = p.boom ?? -1; this.sparks.visible = b >= 0; this.flash.visible = b >= 0 && b < 0.5;
    if (b >= 0) {
      const a = this.sparks.geometry.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < a.count; i++) { const th = hash(i, 1) * Math.PI * 2, ph = hash(i, 2) * Math.PI, v = 20 + hash(i, 3) * 40;
        a.setXYZ(i, Math.cos(th) * Math.sin(ph) * v * b, 14 + Math.cos(ph) * v * b - 30 * b * b, Math.sin(th) * Math.sin(ph) * v * b); }
      a.needsUpdate = true; (this.sparks.material as THREE.PointsMaterial).opacity = Math.max(0, 1 - b);
      this.flash.scale.setScalar(8 + b * 60); (this.flash.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 1 - b * 2);
      this.smoke.forEach((s, i) => { s.visible = true; const k = Math.min(1, b * 1.2); s.position.set(Math.cos(i) * (6 + k * 18), 14 + (hash(i, 5) - 0.3) * 20 * k + k * 10, Math.sin(i * 1.7) * (6 + k * 18)); s.scale.setScalar(2 + k * (4 + hash(i, 6) * 5)); });
    } else this.smoke.forEach((s) => { s.visible = false; });
  }
}
