// Le Dernier Appel : le téléphone rouge (modèle à cadran), reconnaissable en très gros plan.
// Socle galbé extrudé, cadran rotatif à 10 trous sur plaque chiffrée, butée chromée, fourche, combiné galbé à deux écouteurs
// grillagés, cordon spiralé (deux états : raccroché / combiné posé à côté). Unités : mètres (socle ≈ 22 x 24 x 13 cm).
import * as THREE from "three";
import { ctex } from "./tex";

const plateTex = () => ctex("dialplate", 512, 512, (g) => {
  const c = 256; g.fillStyle = "#efe6d2"; g.fillRect(0, 0, 512, 512);
  const gr = g.createRadialGradient(c, c, 40, c, c, 256); gr.addColorStop(0, "rgba(255,255,255,0.0)"); gr.addColorStop(1, "rgba(120,100,70,0.25)"); g.fillStyle = gr; g.fillRect(0, 0, 512, 512);
  g.fillStyle = "#1a1412"; g.font = "bold 46px Georgia, serif"; g.textAlign = "center"; g.textBaseline = "middle";
  for (let n = 0; n < 10; n++) { const a = (-60 - n * 30) * Math.PI / 180; g.fillText(String((n + 1) % 10), c + Math.cos(a) * 187, c - Math.sin(a) * 187); }
  g.strokeStyle = "rgba(40,30,20,0.55)"; g.lineWidth = 3; g.beginPath(); g.arc(c, c, 112, 0, 7); g.stroke();
  g.fillStyle = "#b8121c"; g.beginPath(); g.arc(c, c, 106, 0, 7); g.fill();
  g.fillStyle = "#efe6d2"; g.beginPath(); g.arc(c, c, 82, 0, 7); g.fill();
  g.fillStyle = "#3a1a14"; g.font = "bold 30px Georgia, serif"; g.fillText("APPEL", c, c - 14); g.font = "22px Georgia, serif"; g.fillText("UNIQUE", c, c + 20);
});
const grillTex = () => ctex("grill", 128, 128, (g) => { g.fillStyle = "#1d0c0c"; g.fillRect(0, 0, 128, 128);
  g.fillStyle = "#050202"; for (let r = 10; r < 60; r += 12) for (let k = 0; k < Math.max(1, r / 2.2); k++) { const a = (k / Math.max(1, r / 2.2)) * Math.PI * 2; g.beginPath(); g.arc(64 + Math.cos(a) * r, 64 + Math.sin(a) * r, 3, 0, 7); g.fill(); }
  g.beginPath(); g.arc(64, 64, 4, 0, 7); g.fill(); });

export class Phone {
  root = new THREE.Group(); handset = new THREE.Group(); dial = new THREE.Group(); body: THREE.MeshPhysicalMaterial; lamp?: THREE.Mesh;
  private cordOn: THREE.Mesh; private cordOff: THREE.Mesh;
  constructor(color = "#c3121c", lamp = false) {
    const body = this.body = new THREE.MeshPhysicalMaterial({ color, roughness: 0.2, metalness: 0.02, clearcoat: 1, clearcoatRoughness: 0.06, sheen: 0 });
    const chrome = new THREE.MeshStandardMaterial({ color: "#e8ecf0", metalness: 1, roughness: 0.12 });
    const rubber = new THREE.MeshStandardMaterial({ color: "#151515", roughness: 0.9 });
    const m = (g: THREE.BufferGeometry, mt: THREE.Material, x = 0, y = 0, z = 0, p: THREE.Object3D = this.root) => { const o = new THREE.Mesh(g, mt); o.position.set(x, y, z); o.castShadow = true; o.receiveShadow = true; p.add(o); return o; };
    // socle : profil latéral (z, y) extrudé sur la largeur
    const W = 0.19, sh = new THREE.Shape();
    sh.moveTo(-0.115, 0); sh.lineTo(0.112, 0); sh.lineTo(0.108, 0.042); sh.quadraticCurveTo(0.1, 0.052, 0.088, 0.057);
    sh.lineTo(-0.045, 0.106); sh.quadraticCurveTo(-0.062, 0.112, -0.08, 0.112); sh.lineTo(-0.105, 0.108); sh.quadraticCurveTo(-0.117, 0.104, -0.117, 0.09); sh.lineTo(-0.115, 0);
    const bg = new THREE.ExtrudeGeometry(sh, { depth: W, bevelEnabled: true, bevelThickness: 0.014, bevelSize: 0.012, bevelSegments: 6, curveSegments: 16 });
    bg.rotateY(-Math.PI / 2); bg.translate(W / 2, 0.012, 0); bg.computeVertexNormals();
    m(bg, body);
    // jonc sombre (joint entre socle et capot) + pieds + étiquette avant
    const seam = m(new THREE.BoxGeometry(W + 0.026, 0.004, 0.252), new THREE.MeshStandardMaterial({ color: "#3a0608", roughness: 0.6 }), 0, 0.03, -0.002);
    seam.castShadow = false;
    for (const [x, z] of [[-0.08, -0.09], [0.08, -0.09], [-0.08, 0.09], [0.08, 0.09]]) m(new THREE.CylinderGeometry(0.012, 0.014, 0.006, 12), rubber, x, 0.003, z);
    const lab = m(new THREE.PlaneGeometry(0.07, 0.022), new THREE.MeshStandardMaterial({ map: ctex("phonelab", 256, 80, (g) => { g.fillStyle = "#efe6d2"; g.fillRect(0, 0, 256, 80); g.strokeStyle = "#8a7a5a"; g.lineWidth = 4; g.strokeRect(4, 4, 248, 72); g.fillStyle = "#2a1a14"; g.font = "bold 34px Georgia, serif"; g.textAlign = "center"; g.fillText("1  APPEL", 128, 52); }), roughness: 0.5 }), 0, 0.03, 0.1245);
    lab.castShadow = false;
    // cadran sur la face inclinée
    const a = Math.atan2(0.049, 0.133), n = new THREE.Vector3(0, Math.cos(a), Math.sin(a));
    this.dial.position.set(0, 0.0815 + 0.012, 0.022).addScaledVector(n, 0.0145); this.dial.rotation.x = -(Math.PI / 2 - a); this.root.add(this.dial);
    const plate = m(new THREE.CircleGeometry(0.071, 64), new THREE.MeshPhysicalMaterial({ map: plateTex(), roughness: 0.35, clearcoat: 0.4 }), 0, 0, 0.0005, this.dial); plate.castShadow = false;
    const wheel = new THREE.Shape(); wheel.absarc(0, 0, 0.074, 0, Math.PI * 2, false);
    for (let k = 0; k < 10; k++) { const ang = (-60 - k * 30) * Math.PI / 180, h = new THREE.Path(); h.absarc(Math.cos(ang) * 0.0535, Math.sin(ang) * 0.0535, 0.0118, 0, Math.PI * 2, true); wheel.holes.push(h); }
    const inner = new THREE.Path(); inner.absarc(0, 0, 0.0305, 0, Math.PI * 2, true); wheel.holes.push(inner);
    const wg = new THREE.ExtrudeGeometry(wheel, { depth: 0.005, bevelEnabled: true, bevelThickness: 0.0018, bevelSize: 0.0015, bevelSegments: 3, curveSegments: 40 });
    m(wg, new THREE.MeshPhysicalMaterial({ color: "#f4f0ea", transmission: 0, roughness: 0.15, clearcoat: 1, transparent: true, opacity: 0.55 }), 0, 0, 0.002, this.dial);
    const ring = m(new THREE.TorusGeometry(0.0745, 0.0028, 10, 80), chrome, 0, 0, 0.004, this.dial); ring.castShadow = false;
    const stop = m(new THREE.TorusGeometry(0.009, 0.0022, 8, 16, Math.PI), chrome, Math.cos(-0.55) * 0.072, Math.sin(-0.55) * 0.072, 0.008, this.dial); stop.rotation.z = -0.55 - Math.PI / 2;
    // fourche
    for (const x of [-0.072, 0.072]) { const f = m(new THREE.BoxGeometry(0.03, 0.03, 0.05), body, x, 0.132, -0.075); f.geometry = new THREE.CylinderGeometry(0.016, 0.02, 0.035, 16); f.rotation.z = 0; }
    for (const x of [-0.072, 0.072]) m(new THREE.BoxGeometry(0.008, 0.012, 0.024), chrome, x, 0.152, -0.075);
    // combiné
    const hs = this.handset; this.root.add(hs);
    const path = new THREE.QuadraticBezierCurve3(new THREE.Vector3(-0.098, -0.012, 0), new THREE.Vector3(0, 0.03, 0), new THREE.Vector3(0.098, -0.012, 0));
    const handle = m(new THREE.TubeGeometry(path, 40, 0.0165, 18, false), body, 0, 0, 0, hs); handle.scale.set(1, 1, 1.25);
    for (const sx of [-1, 1]) {
      const cup = m(new THREE.CylinderGeometry(0.031, 0.02, 0.034, 32, 1, false), body, sx * 0.104, -0.03, 0, hs); cup.rotation.z = sx * 0.12;
      const lip = m(new THREE.TorusGeometry(0.029, 0.004, 10, 40), body, sx * 0.106, -0.047, 0, hs); lip.rotation.x = Math.PI / 2; lip.rotation.y = sx * 0.12;
      const gr = m(new THREE.CircleGeometry(0.027, 32), new THREE.MeshStandardMaterial({ map: grillTex(), roughness: 0.7 }), sx * 0.106, -0.0485, 0, hs); gr.rotation.x = Math.PI / 2; gr.castShadow = false;
      const cap = m(new THREE.SphereGeometry(0.021, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), body, sx * 0.1, -0.014, 0, hs); cap.scale.set(1, 0.6, 1.15);
    }
    hs.position.set(0, 0.168, -0.075);
    // cordon spiralé : raccroché / combiné posé à droite du téléphone
    const cm = new THREE.MeshPhysicalMaterial({ color, roughness: 0.3, clearcoat: 0.8 });
    this.cordOn = this.cord([[0.116, 0.14, -0.075], [0.17, 0.08, -0.02], [0.2, 0.012, 0.05], [0.25, 0.008, -0.05], [0.16, 0.01, -0.13], [0.1, 0.04, -0.118]], cm);
    this.cordOff = this.cord([[0.29, 0.03, 0.06], [0.3, 0.01, -0.02], [0.24, 0.008, -0.1], [0.15, 0.01, -0.14], [0.1, 0.04, -0.118]], cm);
    this.cordOff.visible = false;
    if (lamp) { this.lamp = m(new THREE.SphereGeometry(0.012, 16, 10), new THREE.MeshStandardMaterial({ color: "#ff2a1a", emissive: "#ff2a1a", emissiveIntensity: 0 }), -0.07, 0.07, 0.105); }
  }
  private cord(pts: number[][], mt: THREE.Material) {
    const path = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(p[0], p[1], p[2])));
    const N = 900, fr = path.computeFrenetFrames(N, false), L = path.getLength(), turns = L / 0.0065, out: THREE.Vector3[] = [];
    for (let i = 0; i <= N; i++) { const s = i / N, p = path.getPointAt(s), a = s * turns * Math.PI * 2;
      out.push(p.clone().addScaledVector(fr.normals[i], Math.cos(a) * 0.0065).addScaledVector(fr.binormals[i], Math.sin(a) * 0.0065)); }
    const o = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(out), N * 2, 0.0021, 6, false), mt); o.castShadow = true; this.root.add(o); return o;
  }
  /** combiné raccroché (0) ou posé à côté, décroché (1) ; vibration de sonnerie (ring > 0) */
  set(offHook: boolean, ring = 0, t = 0) {
    this.cordOn.visible = !offHook; this.cordOff.visible = offHook;
    if (offHook) { this.handset.position.set(0.25, 0.034, 0.03); this.handset.rotation.set(Math.PI / 2 - 0.2, 0.9, 0.15); }
    else { const j = ring > 0 ? Math.sin(t * 90) * 0.004 * ring : 0; this.handset.position.set(0, 0.168 + Math.abs(j), -0.075); this.handset.rotation.set(0, 0, j * 4); }
  }
}
