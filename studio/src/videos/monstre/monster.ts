// Le monstre (~10 m) : tête rectangulaire en céramique ivoire fissurée, yeux ovales noirs, bouche ronde à dents
// triangulaires, pièces de métal noir sur les côtés, pointes à l'arrière ; corps de plaques blanchâtres translucides
// anguleuses sur une ossature de métal noir ; jambes et bras très longs et fins ; mains géantes griffues.
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { hash } from "./tex";
import { ceramicTex, ceramicBump, plateTex, steelTex, steelRough } from "./mtex";

const msh = (g: THREE.BufferGeometry, m: THREE.Material, x = 0, y = 0, z = 0) => { const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.castShadow = true; o.receiveShadow = true; return o; };
const rb = (w: number, h: number, d: number, r = 0.06) => new RoundedBoxGeometry(w, h, d, 2, r);
/** prisme anguleux irrégulier (plaque) : boîte dont les sommets sont décalés */
const shard = (w: number, h: number, d: number, seed: number, taper = 0.75) => {
  const g = new THREE.BoxGeometry(w, h, d, 1, 1, 1), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const y = p.getY(i), k = y > 0 ? taper : 1; p.setX(i, p.getX(i) * k + (hash(seed, i) - 0.5) * w * 0.12); p.setZ(i, p.getZ(i) * k + (hash(seed, i + 9) - 0.5) * d * 0.15); p.setY(i, y + (hash(seed, i + 19) - 0.5) * h * 0.08); }
  const ng = g.toNonIndexed(); ng.computeVertexNormals(); return ng;
};

export class Monster {
  root = new THREE.Group(); pelvis = new THREE.Group(); torso = new THREE.Group(); neck = new THREE.Group(); head = new THREE.Group();
  lArm = new THREE.Group(); rArm = new THREE.Group(); lFore = new THREE.Group(); rFore = new THREE.Group(); lHand = new THREE.Group(); rHand = new THREE.Group();
  lLeg = new THREE.Group(); rLeg = new THREE.Group(); lShin = new THREE.Group(); rShin = new THREE.Group();
  fingers: THREE.Group[][] = [[], []]; ceramic: THREE.MeshPhysicalMaterial; plate: THREE.MeshPhysicalMaterial; eyeMat: THREE.MeshPhysicalMaterial;
  constructor() {
    const metal = new THREE.MeshStandardMaterial({ color: "#ffffff", map: steelTex(), roughnessMap: steelRough(), roughness: 0.45, metalness: 0.85 });
    const joint = new THREE.MeshStandardMaterial({ color: "#0e0f12", roughness: 0.3, metalness: 0.9 });
    this.ceramic = new THREE.MeshPhysicalMaterial({ color: "#d6d0c4", map: ceramicTex(), bumpMap: ceramicBump(), bumpScale: 4, roughness: 0.32, clearcoat: 0.7, clearcoatRoughness: 0.25 });
    this.plate = new THREE.MeshPhysicalMaterial({ color: "#c9ced4", map: plateTex(), roughness: 0.28, metalness: 0, clearcoat: 0.5, transparent: true, opacity: 0.95, emissive: "#8fa4b8", emissiveIntensity: 0.0, sheen: 0.4, sheenColor: new THREE.Color("#ffffff") });
    this.eyeMat = new THREE.MeshPhysicalMaterial({ color: "#050506", roughness: 0.08, metalness: 0.2, clearcoat: 1, clearcoatRoughness: 0.05 });
    const R = this.root;
    // ---- jambes (hanche y = 5.4) ----
    this.pelvis.position.y = 5.4; R.add(this.pelvis);
    this.pelvis.add(msh(shard(1.9, 0.7, 1.0, 1, 0.9), this.plate, 0, 0.25, 0));
    for (const [leg, shin, x, s] of [[this.lLeg, this.lShin, -0.62, -1], [this.rLeg, this.rShin, 0.62, 1]] as const) {
      leg.position.set(x, 0, 0); this.pelvis.add(leg); leg.add(msh(new THREE.SphereGeometry(0.3, 16, 12), joint));
      leg.add(msh(rb(0.32, 2.7, 0.36), metal, 0, -1.35, 0)); leg.add(msh(shard(0.55, 1.4, 0.5, 3 + s, 0.7), this.plate, 0, -0.9, 0.05));
      shin.position.y = -2.75; leg.add(shin); shin.add(msh(new THREE.SphereGeometry(0.24, 14, 10), joint));
      shin.add(msh(rb(0.26, 2.55, 0.3), metal, 0, -1.3, 0)); shin.add(msh(rb(0.12, 1.6, 0.12, 0.04), joint, 0, -1.1, -0.22));
      const foot = msh(rb(0.5, 0.22, 1.25), metal, 0, -2.6, 0.3); shin.add(foot);
      for (let k = 0; k < 3; k++) shin.add(msh(new THREE.ConeGeometry(0.07, 0.45, 6).rotateX(Math.PI / 2), joint, -0.16 + k * 0.16, -2.65, 1.05));
    }
    // ---- torse étroit, osseux, penché vers l'avant ----
    this.torso.position.y = 0.55; this.pelvis.add(this.torso);
    this.torso.add(msh(rb(0.32, 2.6, 0.32), joint, 0, 1.25, -0.25)); // colonne
    for (let i = 0; i < 6; i++) { const y = 0.35 + i * 0.36, w = 0.9 + Math.sin((i / 5) * Math.PI) * 0.45; // côtes
      const rib = msh(new THREE.TorusGeometry(w * 0.5, 0.045, 6, 18, Math.PI * 1.4), joint, 0, y, -0.1); rib.rotation.set(Math.PI / 2, 0, Math.PI * 1.3); rib.scale.set(0.8, 0.5, 1); rib.position.z = -0.2; this.torso.add(rib); }
    const pl: [number, number, number, number, number, number, number][] = [[0, 1.85, 0.2, 1.55, 0.9, 0.45, 11], [-0.38, 1.05, 0.25, 0.7, 1.0, 0.36, 12], [0.38, 1.05, 0.25, 0.7, 1.0, 0.36, 13], [0, 0.4, 0.2, 0.75, 0.6, 0.38, 14], [0, 1.6, -0.45, 1.3, 1.5, 0.3, 15]];
    for (const [x, y, z, w, h, d, sd] of pl) { const m = msh(shard(w, h, d, sd), this.plate, x, y, z); m.rotation.set((hash(sd, 1) - 0.5) * 0.2, (hash(sd, 2) - 0.5) * 0.3, (hash(sd, 3) - 0.5) * 0.2); this.torso.add(m); }
    // épaules étroites et anguleuses
    for (const s of [-1, 1]) { const sh = msh(shard(0.85, 0.5, 0.7, 20 + s, 0.6), this.plate, s * 0.78, 2.45, -0.05); sh.rotation.z = -s * 0.35; this.torso.add(sh); }
    // ---- bras démesurés (épaule y torse 2.3) ----
    for (const [arm, fore, hand, s, fi] of [[this.lArm, this.lFore, this.lHand, -1, 0], [this.rArm, this.rFore, this.rHand, 1, 1]] as const) {
      arm.position.set(s * 1.05, 2.3, 0); this.torso.add(arm); arm.add(msh(new THREE.SphereGeometry(0.24, 14, 10), joint));
      arm.add(msh(rb(0.26, 2.5, 0.28), metal, 0, -1.25, 0)); arm.add(msh(shard(0.42, 1.0, 0.4, 30 + s, 0.8), this.plate, 0, -0.7, 0.02));
      fore.position.y = -2.55; arm.add(fore); fore.add(msh(new THREE.SphereGeometry(0.2, 12, 10), joint));
      fore.add(msh(rb(0.22, 2.4, 0.24), metal, 0, -1.2, 0)); fore.add(msh(rb(0.09, 1.9, 0.09, 0.03), joint, 0.13 * s, -1.1, -0.06));
      hand.position.y = -2.45; fore.add(hand);
      hand.add(msh(rb(0.75, 0.85, 0.24, 0.06), metal, 0, -0.42, 0));
      for (let k = 0; k < 5; k++) { const thumb = k === 4; const f = new THREE.Group();
        if (thumb) { f.position.set(-s * 0.42, -0.35, 0.08); f.rotation.set(0.2, 0, -s * 0.7); } else { f.position.set(-0.29 + k * 0.193, -0.82, 0); f.rotation.set(0.12, 0, (k - 1.5) * 0.06); }
        hand.add(f); this.fingers[fi].push(f);
        const L1 = thumb ? 0.6 : 0.85 + (k === 1 || k === 2 ? 0.2 : 0), L2 = thumb ? 0.5 : 0.75;
        f.add(msh(rb(0.12, L1, 0.13, 0.04), metal, 0, -L1 / 2, 0)); const f2 = new THREE.Group(); f2.position.y = -L1; f2.rotation.x = 0.25; f.add(f2);
        f2.add(msh(new THREE.SphereGeometry(0.075, 8, 6), joint)); f2.add(msh(rb(0.1, L2, 0.11, 0.035), metal, 0, -L2 / 2, 0));
        f2.add(msh(new THREE.ConeGeometry(0.06, 0.42, 6).rotateX(Math.PI), joint, 0, -L2 - 0.18, 0.02)); }
    }
    // ---- cou long ----
    this.neck.position.set(0, 2.5, 0.05); this.torso.add(this.neck);
    for (let i = 0; i < 5; i++) this.neck.add(msh(rb(0.3 - i * 0.015, 0.22, 0.3 - i * 0.015, 0.05), i % 2 ? joint : metal, 0, 0.12 + i * 0.24, 0));
    this.neck.add(msh(rb(0.12, 1.25, 0.12, 0.03), joint, 0, 0.62, -0.18));
    // ---- tête rectangulaire massive ----
    this.head.position.y = 1.25; this.neck.add(this.head);
    const H = this.head, HW = 1.55, HH = 1.85, HD = 1.3;
    H.add(msh(rb(HW, HH, HD, 0.14), this.ceramic, 0, HH / 2, 0));
    // yeux ovales noirs sans pupille, légèrement enfoncés
    for (const s of [-1, 1]) { const e = msh(new THREE.SphereGeometry(0.5, 32, 20), this.eyeMat, s * 0.38, HH * 0.62, HD / 2 - 0.05); e.scale.set(0.44, 0.62, 0.22); e.rotation.z = s * 0.12; H.add(e);
      const rim = msh(new THREE.TorusGeometry(0.5, 0.035, 8, 32), this.ceramic, s * 0.38, HH * 0.62, HD / 2 - 0.01); rim.scale.set(0.46, 0.64, 1); rim.rotation.z = s * 0.12; H.add(rim); }
    // bouche ronde noire + dents triangulaires en cercle
    const mouthY = HH * 0.25, mz = HD / 2 + 0.005;
    const hole = msh(new THREE.CircleGeometry(0.4, 40), new THREE.MeshStandardMaterial({ color: "#020203", roughness: 0.9 }), 0, mouthY, mz); H.add(hole);
    H.add(msh(new THREE.TorusGeometry(0.42, 0.045, 8, 40), this.ceramic, 0, mouthY, mz));
    const tooth = new THREE.MeshPhysicalMaterial({ color: "#f4efe2", roughness: 0.3, clearcoat: 0.6 });
    for (let i = 0; i < 18; i++) { const a = (i / 18) * Math.PI * 2, t = msh(new THREE.ConeGeometry(0.055, 0.17, 4), tooth, Math.cos(a) * 0.35, mouthY + Math.sin(a) * 0.35, mz + 0.01); t.rotation.z = a + Math.PI / 2; H.add(t); }
    for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2 + 0.2, t = msh(new THREE.ConeGeometry(0.04, 0.12, 4), tooth, Math.cos(a) * 0.22, mouthY + Math.sin(a) * 0.22, mz - 0.03); t.rotation.z = a + Math.PI / 2; H.add(t); }
    // pièces de métal noir verticales sur les côtés de la tête
    for (const s of [-1, 1]) { H.add(msh(rb(0.24, HH + 0.9, 0.95, 0.04), metal, s * (HW / 2 + 0.1), HH / 2 + 0.1, -0.05));
      for (const y of [0.15, HH * 0.5, HH - 0.1]) H.add(msh(new THREE.CylinderGeometry(0.06, 0.06, 0.1, 8).rotateZ(Math.PI / 2), joint, s * (HW / 2 + 0.24), y, 0.25)); }
    // pointes métalliques effilées à l'arrière du crâne
    const spk = new THREE.MeshStandardMaterial({ color: "#16171b", roughness: 0.25, metalness: 0.95 });
    for (let i = 0; i < 7; i++) { const L = 1.3 + hash(i, 81) * 1.4, sp = msh(new THREE.ConeGeometry(0.09 + hash(i, 82) * 0.06, L, 7), spk, (i - 3) * 0.2, HH * 0.45 + (hash(i, 83)) * HH * 0.55, -HD / 2);
      sp.rotation.set(-Math.PI / 2 - 0.5 - hash(i, 84) * 0.5, 0, (i - 3) * 0.12); sp.geometry = sp.geometry.clone().translate(0, L / 2, 0); H.add(sp); }
    R.scale.setScalar(3);
    this.pose(0);
  }
  /** posture immobile, bras légèrement écartés ; frisson très léger optionnel */
  pose(t: number, p: { headYaw?: number; headPitch?: number; twitch?: number; lean?: number; reach?: number } = {}) {
    const tw = p.twitch ?? 0, j = (k: number) => Math.sin(t * 23 + k) * tw * 0.02;
    this.torso.rotation.set(0.2 + (p.lean ?? 0), 0, 0);
    this.neck.rotation.set(0.16 + j(1), 0, 0); this.head.rotation.set(0.16 + (p.headPitch ?? 0) + j(2), p.headYaw ?? 0, j(3) - 0.04);
    this.lArm.rotation.set(-0.12, 0, -0.2); this.rArm.rotation.set(-0.12, 0, 0.2);
    this.lFore.rotation.set(-0.22 + j(4), 0, 0.06); this.rFore.rotation.set(-0.22 + j(5), 0, -0.06);
    this.lHand.rotation.set(-0.05, 0.25, 0.05); this.rHand.rotation.set(-0.05, -0.25, -0.05);
    this.lLeg.rotation.set(-0.06, 0, -0.05); this.rLeg.rotation.set(-0.06, 0, 0.05); this.lShin.rotation.set(0.1, 0, 0); this.rShin.rotation.set(0.1, 0, 0);
    this.fingers.forEach((h, s) => h.forEach((f, k) => { if (k < 4) f.rotation.x = 0.12 + 0.1 * k * 0 + j(6 + k + s * 5); }));
    const r = p.reach ?? 0;
    if (r > 0) { this.rArm.rotation.set(-0.12 - 1.25 * r, -0.2 * r, 0.2 + 0.1 * r); this.rFore.rotation.set(-0.22 - 0.75 * r, 0, -0.06); this.rHand.rotation.set(-0.05 - 0.3 * r, -0.25, -0.05);
      this.fingers[1].forEach((f, k) => { if (k < 4) f.rotation.x = 0.12 + 0.8 * r + j(9 + k); else f.rotation.z = -0.7 - 0.5 * r; }); }
  }
  /** point de la tête dans le monde (pour les cadrages) */
  headWorld(off = new THREE.Vector3(0, 1.0, 0.7)) { this.root.updateMatrixWorld(true); return this.head.localToWorld(off.clone()); }
}
