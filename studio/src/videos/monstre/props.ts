// Le Monstre : accessoires et effets de l'histoire (ciel jour/nuit, soleil, générateur, paratonnerre, téléphone, levier,
// affaires abandonnées, voitures de police, façade aux balcons, faisceaux des fenêtres, explosion, fumée, pluie, éclair).
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { hash } from "./tex";
import { nightSky, hazardTex, steelTex, rep } from "./mtex";
import { car, V } from "./city";
import { Beam } from "./beams";
import { Actor, CAST } from "./chars";

const msh = (g: THREE.BufferGeometry, m: THREE.Material, x = 0, y = 0, z = 0, cast = true) => { const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.castShadow = cast; o.receiveShadow = true; return o; };
const S = (p: THREE.MeshPhysicalMaterialParameters) => new THREE.MeshPhysicalMaterial({ roughness: 0.6, ...p });
const rb = (w: number, h: number, d: number, r = 0.05) => new RoundedBoxGeometry(w, h, d, 2, r);
const E = (c: string, i = 4) => new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: i });

/** ciel : dégradé (zénith / horizon) mêlé au ciel étoilé selon `night` ; `flash` pour l'éclair */
export const skyMaterial = () => new THREE.ShaderMaterial({
  side: THREE.BackSide, depthWrite: false, fog: false,
  uniforms: { tex: { value: nightSky() }, top: { value: new THREE.Color("#3f7fd8") }, hor: { value: new THREE.Color("#cfe3ff") }, night: { value: 1 }, flash: { value: 0 } },
  vertexShader: `varying vec2 vUv; varying vec3 vP; void main(){ vUv = uv; vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: `uniform sampler2D tex; uniform vec3 top, hor; uniform float night, flash; varying vec2 vUv; varying vec3 vP;
    void main(){ float h = clamp(vP.y, 0.0, 1.0); vec3 day = mix(hor, top, pow(h, 0.55)); vec3 n = texture2D(tex, vUv).rgb;
      vec3 c = mix(day, n, night) + flash * vec3(0.75, 0.72, 1.0) * (0.4 + h); gl_FragColor = vec4(c, 1.0);
      #include <colorspace_fragment>
    }`,
});

export class Props {
  root = new THREE.Group();
  sun = new THREE.DirectionalLight("#fff1d8", 0); gen = new THREE.Group(); genLed: THREE.MeshStandardMaterial; rod = new THREE.Group(); phone = new THREE.Group();
  panel = new THREE.Group(); lever = new THREE.Group(); panelLeds: THREE.MeshStandardMaterial[] = []; items = new THREE.Group();
  cars: { g: THREE.Group; bar: [THREE.MeshStandardMaterial, THREE.MeshStandardMaterial]; head: THREE.MeshStandardMaterial; beams: Beam[]; home: THREE.Vector3; from: THREE.Vector3; ry: number }[] = [];
  facade = new THREE.Group(); residents: Actor[] = []; winBeams: Beam[] = []; looseTorch = new THREE.Group(); looseBeam: Beam; debris = new THREE.Group();
  boom = new THREE.Group(); fire: THREE.Mesh[] = []; sparks: THREE.InstancedMesh; smoke: THREE.InstancedMesh; boomLight = new THREE.PointLight("#ff8a2a", 0, 80, 1.5);
  genSmoke: THREE.InstancedMesh; rain: THREE.InstancedMesh; bolt: THREE.Mesh; puddles = new THREE.Group(); cable: THREE.Mesh;
  ring: THREE.Mesh; chunks: THREE.InstancedMesh; batt = new THREE.Group(); battSparks: THREE.InstancedMesh; battLight = new THREE.PointLight("#bcd8ff", 0, 14, 1.6); battArcs: THREE.Mesh[] = [];
  resBeams: Beam[] = []; facadeWin!: THREE.MeshStandardMaterial;
  constructor() {
    const R = this.root, d = new THREE.Object3D();
    this.sun.position.set(-160, 140, 120); this.sun.castShadow = true; const sc = this.sun.shadow.camera; sc.left = -90; sc.right = 90; sc.top = 90; sc.bottom = -90; sc.near = 20; sc.far = 500;
    this.sun.shadow.mapSize.set(2048, 2048); this.sun.shadow.bias = -0.0004; R.add(this.sun, this.sun.target);
    // générateur de secours vert sur sa dalle blanche (près du héros)
    const green = S({ color: "#2f8a3e", roughness: 0.4, clearcoat: 0.6, map: steelTex() }), dark = S({ color: "#1a1c20", roughness: 0.4, metalness: 0.6 }), haz = S({ map: rep(hazardTex(), 2, 1) });
    this.gen.position.set(19, 0, 22); this.gen.rotation.y = -0.7; R.add(this.gen);
    this.gen.add(msh(new THREE.BoxGeometry(6, 0.3, 4), S({ color: "#e8e6e0", roughness: 0.8 }), 0, 0.15, 0));
    this.gen.add(msh(rb(4.6, 2.4, 2.4, 0.15), green, 0, 1.5, 0));
    this.gen.add(msh(new THREE.BoxGeometry(4.7, 0.3, 2.5), haz, 0, 0.45, 0));
    this.gen.add(msh(rb(1.2, 1.0, 0.1), dark, 1.2, 1.7, 1.22)); this.genLed = E("#2aff5a", 5); this.gen.add(msh(new THREE.SphereGeometry(0.09, 10, 8), this.genLed, 0.9, 2.0, 1.29, false));
    this.gen.add(msh(new THREE.SphereGeometry(0.08, 10, 8), E("#ff7a1a", 4), 1.2, 2.0, 1.29, false));
    for (let i = 0; i < 6; i++) this.gen.add(msh(new THREE.BoxGeometry(0.08, 1.2, 0.05), dark, -1.9 + i * 0.25, 1.6, 1.21));
    this.gen.add(msh(new THREE.CylinderGeometry(0.28, 0.3, 1.4, 16), S({ color: "#9aa0a8", metalness: 0.9, roughness: 0.3 }), -1.4, 3.3, -0.4)); // conduit
    // panneau de commande + levier (plan « clic »), à côté du générateur
    this.panel.position.set(15.5, 0, 22.5); this.panel.rotation.y = -0.5; R.add(this.panel);
    this.panel.add(msh(rb(1.6, 2.0, 0.6), S({ color: "#c9ccd0", roughness: 0.5 }), 0, 1.2, 0)); this.panel.add(msh(new THREE.BoxGeometry(1.62, 0.18, 0.62), haz, 0, 0.3, 0));
    for (let i = 0; i < 6; i++) { const m = E("#2aff5a", 5); this.panelLeds.push(m); this.panel.add(msh(new THREE.SphereGeometry(0.06, 10, 8), m, -0.55 + (i % 3) * 0.2, 1.75 - Math.floor(i / 3) * 0.22, 0.31, false)); }
    this.lever.position.set(0.4, 1.4, 0.32); this.panel.add(this.lever); this.lever.add(msh(rb(0.12, 0.7, 0.12), S({ color: "#6a6e74", metalness: 0.8, roughness: 0.3 }), 0, 0.35, 0)); this.lever.add(msh(new THREE.SphereGeometry(0.12, 12, 10), S({ color: "#c43a2a" }), 0, 0.72, 0));
    // paratonnerre au premier plan (plan 13)
    this.rod.position.set(-24, 0, 30); R.add(this.rod); const chrome = S({ color: "#dfe3ea", metalness: 1, roughness: 0.12 });
    this.rod.add(msh(rb(1.6, 1.4, 1.6, 0.1), S({ color: "#eceae4", roughness: 0.7 }), 0, 0.7, 0)); this.rod.add(msh(new THREE.CylinderGeometry(0.18, 0.25, 4, 12), chrome, 0, 3.4, 0));
    this.rod.add(msh(new THREE.SphereGeometry(0.7, 32, 20), chrome, 0, 5.9, 0)); this.rod.add(msh(new THREE.CylinderGeometry(0.03, 0.06, 3.5, 8), chrome, 0, 8.2, 0));
    // téléphone (2:13 AM)
    const cv = document.createElement("canvas"); cv.width = 512; cv.height = 1024; const g = cv.getContext("2d")!;
    const gr = g.createLinearGradient(0, 0, 0, 1024); gr.addColorStop(0, "#1b3d9a"); gr.addColorStop(1, "#08122e"); g.fillStyle = gr; g.fillRect(0, 0, 512, 1024);
    g.fillStyle = "#fff"; g.textAlign = "center"; g.font = "bold 150px Montserrat, Liberation Sans, sans-serif"; g.fillText("2:13", 256, 380); g.font = "bold 70px Montserrat, Liberation Sans, sans-serif"; g.fillText("AM", 256, 470);
    g.globalAlpha = 0.6; g.font = "40px Liberation Sans, sans-serif"; g.fillText("mardi 14", 256, 230); g.globalAlpha = 1;
    const st = new THREE.CanvasTexture(cv); st.colorSpace = THREE.SRGBColorSpace;
    this.phone.add(msh(rb(0.75, 1.5, 0.08, 0.08), S({ color: "#111317", metalness: 0.6, roughness: 0.25, clearcoat: 1 }), 0, 0, 0));
    this.phone.add(msh(new THREE.PlaneGeometry(0.68, 1.4), new THREE.MeshStandardMaterial({ map: st, emissive: "#ffffff", emissiveMap: st, emissiveIntensity: 1.4 }), 0, 0, 0.045, false));
    R.add(this.phone);
    // affaires abandonnées des disparus (sac rouge, chaussure rouge, chaussure bleue)
    this.items.position.set(0.5, 0, 112); R.add(this.items);
    this.items.add(msh(rb(0.9, 0.6, 0.45, 0.12), S({ color: "#c42a2a", sheen: 0.6 }), 0, 0.3, 0)); this.items.add(msh(rb(0.5, 0.06, 0.06), dark, 0, 0.68, 0));
    const shoe = (c: string, x: number, z: number, r: number) => { const s = new THREE.Group(); s.position.set(x, 0, z); s.rotation.y = r; this.items.add(s); s.add(msh(rb(0.32, 0.22, 0.75, 0.08), S({ color: c }), 0, 0.14, 0)); s.add(msh(rb(0.34, 0.06, 0.78, 0.03), S({ color: "#eeeeee" }), 0, 0.03, 0)); };
    shoe("#d62a2a", -1.3, 0.4, 0.6); shoe("#2a5ad6", 1.4, -0.3, 2.3);
    // voitures de police (8) : arrivent de partout et se garent en cercle, phares vers le monstre
    for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2 + Math.PI / 8 + (k === 1 ? 0.55 : 0), home = V(Math.cos(a) * 25, 0, Math.sin(a) * 25), from = V(Math.cos(a) * 75, 0, Math.sin(a) * 75), ry = Math.atan2(-home.x, -home.z);
      const gg = car(k % 2 ? "#f4f4f4" : "#1c2230", 0, 0, 0, k, true); gg.position.copy(home); gg.rotation.y = ry; R.add(gg);
      gg.add(msh(new THREE.BoxGeometry(1.75, 0.12, 0.7), dark, 0, 1.75, -0.2)); gg.add(msh(new THREE.BoxGeometry(2.02, 0.35, 1.6), S({ color: k % 2 ? "#1c2230" : "#f4f4f4", roughness: 0.4 }), 0, 0.95, 0.3));
      const red = E("#ff1a2a", 6), blue = E("#1a4aff", 6); gg.add(msh(new THREE.BoxGeometry(0.75, 0.2, 0.4), red, -0.45, 1.88, -0.2, false)); gg.add(msh(new THREE.BoxGeometry(0.75, 0.2, 0.4), blue, 0.45, 1.88, -0.2, false));
      const head = gg.children.find((c) => (c as THREE.Mesh).material && ((c as THREE.Mesh).material as THREE.MeshStandardMaterial).emissiveIntensity === 6) as THREE.Mesh | undefined;
      const hm = (head?.material as THREE.MeshStandardMaterial) ?? E("#fff", 6);
      const beams = [new Beam(4, 0.25, 0.22, "#fff4e0"), new Beam(4, 0.25, 0.22, "#fff4e0")]; for (const b of beams) R.add(b.mesh);
      this.cars.push({ g: gg, bar: [red, blue], head: hm, beams, home, from, ry }); }
    // façade aux balcons (habitants avec lampes), côté -Z de la place
    this.facade.position.set(-26, 0, -72.7); R.add(this.facade); const fm = S({ color: "#8b7a66", roughness: 0.85 }), metal = S({ color: "#2a2c30", metalness: 0.7, roughness: 0.4 });
    for (let fl = 1; fl < 7; fl++) for (let b = 0; b < 3; b++) { const x = -9 + b * 9, y = fl * 3.6;
      this.facade.add(msh(new THREE.BoxGeometry(5.2, 0.2, 1.6), fm, x, y, 0.8)); this.facade.add(msh(new THREE.BoxGeometry(5.2, 1.0, 0.06), metal, x, y + 0.6, 1.6));
      if (fl === 1) this.facade.add(msh(new THREE.BoxGeometry(5.4, 0.12, 2.2), S({ map: stripeTex() }), x, 3.1, 1.1));
      if (hash(fl * 3 + b, 7) < 0.55) { const a = new Actor({ ...CAST[["c1", "c2", "c3", "c4"][(fl + b) % 4]], name: `res${fl}${b}` }, 0.36, fl * 3 + b); a.root.position.set(x + (hash(fl, b) - 0.5) * 2, y + 0.1, 0.9); a.addTorch(); this.facade.add(a.root); this.residents.push(a); } }
    { const wt = facadeTex(); this.facadeWin = new THREE.MeshStandardMaterial({ map: wt.map, emissive: "#ffffff", emissiveMap: wt.em, emissiveIntensity: 1.6, roughness: 0.8 });
      const side = S({ color: "#7d6e5e", roughness: 0.9 }), mats = [side, side, S({ color: "#3a3a40", roughness: 0.9 }), side, this.facadeWin, side];
      { const wb = new THREE.Mesh(new THREE.BoxGeometry(34, 26.4, 12), mats); wb.position.set(2.5, 13.2, -6.02); wb.receiveShadow = true; this.facade.add(wb); } const trim = S({ color: "#d9d2c4", roughness: 0.7 });
      this.facade.add(msh(new THREE.BoxGeometry(35, 0.8, 12.8), trim, 2.5, 26.8, -6)); this.facade.add(msh(new THREE.BoxGeometry(34.4, 0.4, 0.5), trim, 2.5, 3.4, 0.2));
      for (const r of this.residents) { const b = new Beam(2.2, 0.16, 0.34, "#fff1d0"); R.add(b.mesh); this.resBeams.push(b); } }
    for (let fl = 0; fl < 6; fl++) { this.facade.add(msh(new THREE.BoxGeometry(5, 0.15, 1.2), metal, 14, 1.8 + fl * 3.6, 1)); const st2 = msh(new THREE.BoxGeometry(0.15, 4.4, 1.2), metal, 14 + (fl % 2 ? 2.4 : -2.4), 3.6 + fl * 3.6, 1); st2.rotation.z = fl % 2 ? 0.9 : -0.9; this.facade.add(st2); }
    // faisceaux des fenêtres (des centaines : ~70 cônes depuis les immeubles autour de la place)
    for (let i = 0; i < 70; i++) { const b = new Beam(2.4, 0.15, 0.12 + hash(i, 3) * 0.08, hash(i, 4) < 0.5 ? "#fff1d0" : "#e8f0ff"); R.add(b.mesh); this.winBeams.push(b);
      const a = hash(i, 5) * Math.PI * 2, r = 74 + hash(i, 6) * 10, y = 4 + hash(i, 7) * 30; b.place(V(Math.cos(a) * r, y, Math.sin(a) * r), V((hash(i, 8) - 0.5) * 6, 10 + hash(i, 9) * 18, (hash(i, 10) - 0.5) * 6)); }
    // lampe lâchée
    const tb = S({ color: "#202226", metalness: 0.6, roughness: 0.35 }); this.looseTorch.add(msh(new THREE.CylinderGeometry(0.07, 0.07, 0.5, 12).rotateX(Math.PI / 2), tb)); this.looseTorch.add(msh(new THREE.CircleGeometry(0.1, 16), E("#fff6e0", 6), 0, 0, 0.26, false)); R.add(this.looseTorch);
    this.looseBeam = new Beam(1.6, 0.08, 0.3, "#fff4dc"); R.add(this.looseBeam.mesh);
    // grilles arrachées
    const fenceM = S({ color: "#15161a", metalness: 0.7, roughness: 0.45 }); for (let i = 0; i < 4; i++) { const p = new THREE.Group(); p.position.set(4 + i * 2.6, 0.3, 11 + hash(i, 2) * 2); p.rotation.set(-1.2 + hash(i, 3) * 0.6, hash(i, 4) * 2, 0.4); this.debris.add(p);
      for (let b = 0; b < 7; b++) p.add(msh(new THREE.BoxGeometry(0.05, 2, 0.05), fenceM, -1.2 + b * 0.4, 0, 0)); p.add(msh(new THREE.BoxGeometry(2.8, 0.08, 0.08), fenceM, 0, 0.9, 0)); } R.add(this.debris);
    // explosion (au sommet d'une tour) : boules de feu, étincelles, fumée
    R.add(this.boom); this.boom.add(this.boomLight);
    for (let i = 0; i < 12; i++) { const f = msh(new THREE.IcosahedronGeometry(1, 3), new THREE.MeshBasicMaterial({ color: ["#fff6c8", "#ffe07a", "#ffb03a", "#ff7a1a", "#ff5a10", "#e83a0a"][i % 6], transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }), 0, 0, 0, false); this.boom.add(f); this.fire.push(f); }
    this.sparks = new THREE.InstancedMesh(new THREE.BoxGeometry(0.1, 0.1, 1.2), new THREE.MeshBasicMaterial({ color: "#ffd27a", fog: false }), 420); this.sparks.frustumCulled = false; this.boom.add(this.sparks);
    this.smoke = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 2), S({ color: "#2a2628", roughness: 1, transparent: true, opacity: 0.88, emissive: "#ff5a1a", emissiveIntensity: 0.25 }), 60); this.smoke.frustumCulled = false; this.boom.add(this.smoke);
    this.ring = msh(new THREE.TorusGeometry(1, 0.08, 8, 64).rotateX(Math.PI / 2), new THREE.MeshBasicMaterial({ color: "#ffd9a0", transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }), 0, 0, 0, false); this.boom.add(this.ring);
    this.chunks = new THREE.InstancedMesh(new THREE.BoxGeometry(0.9, 0.5, 0.7), S({ color: "#1c1d22", metalness: 0.7, roughness: 0.4, emissive: "#ff6a20", emissiveIntensity: 0.6 }), 40); this.chunks.frustumCulled = false; this.boom.add(this.chunks);
    // batteries de secours reliées par des câbles qui grésillent (plan « câble endommagé »)
    this.batt.position.set(4.0, 0.12, 28.0); this.batt.rotation.y = Math.atan2(0.675, 0.737); R.add(this.batt);
    const bcase = S({ color: "#2b2e34", roughness: 0.45, metalness: 0.3, map: steelTex() }), bcap = S({ color: "#e8b81a", roughness: 0.5 }), red = S({ color: "#c4221a", roughness: 0.35 }), blk = S({ color: "#0c0c0e", roughness: 0.3, clearcoat: 1 });
    const term: THREE.Vector3[] = [];
    for (let i = 0; i < 4; i++) { const x = -1.65 + i * 1.1; this.batt.add(msh(rb(0.95, 1.1, 0.75, 0.06), bcase, x, 0.55, 0)); this.batt.add(msh(new THREE.BoxGeometry(0.97, 0.16, 0.77), haz, x, 0.95, 0));
      this.batt.add(msh(new THREE.CylinderGeometry(0.07, 0.07, 0.16, 12), red, x - 0.25, 1.18, 0.15)); this.batt.add(msh(new THREE.CylinderGeometry(0.07, 0.07, 0.16, 12), blk, x + 0.25, 1.18, 0.15));
      this.batt.add(msh(rb(0.3, 0.08, 0.14, 0.02), bcap, x, 1.12, -0.2)); term.push(V(x - 0.25, 1.26, 0.15), V(x + 0.25, 1.26, 0.15)); }
    this.batt.add(msh(rb(1.1, 0.9, 0.5, 0.05), S({ color: "#9aa0a6", metalness: 0.8, roughness: 0.35 }), 0.2, 0.55, 1.3)); // boîte de jonction
    term.forEach((p, i) => { const end = V(-0.2 + (i % 4) * 0.13, 0.85, 1.05), mid = p.clone().lerp(end, 0.5).add(V(0, 0.45 + (i % 3) * 0.12, 0.1));
      this.batt.add(msh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([p, mid, end]), 24, 0.045, 8), i % 2 ? blk : red)); });
    const mc: THREE.Vector3[] = [V(0.6, 0.55, 1.55), V(1.4, 0.12, 2.2), V(3.0, 0.1, 2.6), V(6, 0.1, 3.4)]; this.batt.add(msh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(mc), 40, 0.09, 10), blk)); // câble principal
    this.batt.add(msh(new THREE.TorusGeometry(0.1, 0.03, 6, 12), S({ color: "#d06a2a", metalness: 0.9, roughness: 0.3 }), 1.4, 0.16, 2.2)); // gaine arrachée
    this.battSparks = new THREE.InstancedMesh(new THREE.BoxGeometry(0.035, 0.035, 0.28), new THREE.MeshBasicMaterial({ color: "#fff2b0", fog: false }), 260); this.battSparks.frustumCulled = false; this.batt.add(this.battSparks);
    for (let i = 0; i < 3; i++) { const arc = msh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([V(0, 0, 0), V(0.1, 0.1, 0), V(0.2, 0, 0)]), 8, 0.012, 4), new THREE.MeshBasicMaterial({ color: "#d8ecff", fog: false }), 0, 0, 0, false); this.batt.add(arc); this.battArcs.push(arc); }
    this.genSmoke = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), S({ color: "#8a8c90", roughness: 1, transparent: true, opacity: 0.6 }), 26); R.add(this.genSmoke);
    // pluie : traits fins autour de la caméra
    this.rain = new THREE.InstancedMesh(new THREE.BoxGeometry(0.018, 0.75, 0.018), new THREE.MeshBasicMaterial({ color: "#c8d4ff", transparent: true, opacity: 0.45, depthWrite: false }), 5000); this.rain.frustumCulled = false; R.add(this.rain);
    // éclair
    const pts: THREE.Vector3[] = []; let p = V(-60, 260, -260); for (let i = 0; i < 16; i++) { pts.push(p.clone()); p = p.add(V((hash(i, 31) - 0.5) * 40, -17, (hash(i, 32) - 0.5) * 20)); }
    this.bolt = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, false, "catmullrom", 0), 80, 0.9, 6), new THREE.MeshBasicMaterial({ color: "#f0eaff", fog: false })); R.add(this.bolt);
    // flaques
    const pm = S({ color: "#0a0c14", roughness: 0.04, metalness: 0.9, clearcoat: 1 });
    for (let i = 0; i < 30; i++) { const m = msh(new THREE.CircleGeometry(1 + hash(i, 41) * 2.5, 24).rotateX(-Math.PI / 2), pm, (hash(i, 42) - 0.3) * 50, 0.15, 5 + hash(i, 43) * 40, false); m.scale.set(1, 1, 0.6 + hash(i, 44)); this.puddles.add(m); } R.add(this.puddles);
    // câble au sol où le héros trébuche
    const cp: THREE.Vector3[] = []; for (let i = 0; i <= 10; i++) cp.push(V(6 + i * 1.2, 0.2, 25.4 + Math.sin(i * 1.3) * 0.5));
    this.cable = msh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(cp), 60, 0.09, 8), S({ color: "#0d0d10", roughness: 0.3, clearcoat: 1 })); R.add(this.cable);
    void d;
  }
  /** tout cacher (chaque plan rallume ce dont il a besoin) */
  reset() {
    for (const o of [this.gen, this.rod, this.phone, this.panel, this.items, this.facade, this.looseTorch, this.looseBeam.mesh, this.debris, this.boom, this.genSmoke, this.rain, this.bolt, this.puddles, this.batt]) o.visible = false;
    for (const b of this.resBeams) b.mesh.visible = false; this.battLight.intensity = 0;
    for (const c of this.cars) { c.g.visible = false; for (const b of c.beams) b.mesh.visible = false; }
    for (const b of this.winBeams) b.mesh.visible = false; this.sun.intensity = 0; this.boomLight.intensity = 0;
  }
  carsAt(t: number, arrive: number, lightsOn: boolean, dead = -1) {
    this.cars.forEach((c, k) => { const u = Math.min(1, Math.max(0, (arrive - k * 0.05))), e = 1 - Math.pow(1 - u, 3);
      c.g.visible = true; c.g.position.lerpVectors(c.from, c.home, e); c.g.rotation.y = c.ry;
      const blink = Math.sin(t * 14 + k) > 0; c.bar[0].emissiveIntensity = lightsOn ? (blink ? 9 : 0.6) : 0.3; c.bar[1].emissiveIntensity = lightsOn ? (blink ? 0.6 : 9) : 0.3;
      const on = lightsOn && k !== dead; c.head.emissiveIntensity = on ? 7 : 0.2;
      c.g.updateMatrixWorld(true); c.beams.forEach((b, j) => { b.mesh.visible = on && e > 0.95; const src = c.g.localToWorld(V(j ? 0.65 : -0.65, 0.9, 2.3)); b.place(src, V((j - 0.5) * 2, 12, 0), 26); b.set(t); }); });
  }
  /** explosion du projecteur : éclair, boule de feu multiple, onde de choc, gerbes d'étincelles, débris, colonne de fumée, puis feu persistant */
  boomAt(u: number, at: THREE.Vector3, t = 0) {
    this.boom.visible = true; this.boom.position.copy(at); const k = Math.max(0, u), grow = 1 - Math.pow(1 - Math.min(1, k * 3.2), 3);
    this.fire.forEach((f, i) => { const big = i < 7, fl = 0.85 + 0.15 * Math.sin(t * 23 + i * 2);
      const s = big ? (2.6 + i * 1.5) * grow * (1 + 0.35 * k) * (k > 0.55 ? Math.max(0.28, 1 - (k - 0.55) * 1.3) : 1) : (1.6 + (i - 7) * 0.5) * Math.min(1, k * 3) * fl;
      f.scale.setScalar(Math.max(0.01, s)); const r = big ? 2.2 * k * (1 + i * 0.25) : 0.6;
      f.position.set(Math.sin(i * 2.1) * r, (big ? Math.cos(i * 1.7) * r * 0.6 + k * 4 : -1 + Math.sin(t * 7 + i)), Math.sin(i * 3.3) * r);
      (f.material as THREE.MeshBasicMaterial).opacity = big ? Math.max(0.0, 0.98 - Math.max(0, k - 0.35) * 0.9) : Math.min(0.85, k * 3) * fl; });
    const d = new THREE.Object3D();
    for (let i = 0; i < 420; i++) { const dir = V(hash(i, 1) - 0.5, hash(i, 2) * 1.1 - 0.25, hash(i, 3) - 0.5).normalize(), sp = 14 + hash(i, 4) * 34, kk = Math.min(k, 0.4 + hash(i, 9) * 0.9);
      d.position.copy(dir.clone().multiplyScalar(sp * kk)).add(V(0, -14 * kk * kk, 0)); d.lookAt(d.position.clone().add(dir.clone().add(V(0, -kk, 0)))); d.scale.setScalar(k < 0.4 + hash(i, 9) * 0.9 ? 1 + hash(i, 5) : 0.01); d.updateMatrix(); this.sparks.setMatrixAt(i, d.matrix); }
    this.sparks.instanceMatrix.needsUpdate = true;
    for (let i = 0; i < 60; i++) { const h = hash(i, 6); d.position.set((hash(i, 5) - 0.5) * 7 * (0.3 + k), 2 + k * (4 + h * 22), (hash(i, 7) - 0.5) * 7 * (0.3 + k)); d.scale.setScalar(Math.max(0.01, (1.2 + hash(i, 8) * 2.4) * Math.min(1, k * 2.5) * (1 + k * 1.4))); d.rotation.set(i, i * 2 + t * 0.2, 0); d.updateMatrix(); this.smoke.setMatrixAt(i, d.matrix); }
    this.smoke.instanceMatrix.needsUpdate = true;
    for (let i = 0; i < 40; i++) { const dir = V(hash(i, 11) - 0.5, hash(i, 12) * 0.8, hash(i, 13) - 0.5).normalize(), sp = 10 + hash(i, 14) * 16;
      d.position.copy(dir.multiplyScalar(sp * k)).add(V(0, -20 * k * k, 0)); d.rotation.set(k * 9 + i, k * 7 + i * 2, 0); d.scale.setScalar(0.4 + hash(i, 15) * 1.2); d.updateMatrix(); this.chunks.setMatrixAt(i, d.matrix); }
    this.chunks.instanceMatrix.needsUpdate = true;
    this.ring.scale.setScalar(Math.max(0.01, 42 * Math.pow(Math.min(1, k * 1.6), 0.6))); (this.ring.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.9 - k * 1.4);
    this.boomLight.intensity = 1400 * Math.max(0, 1 - k * 1.6) + 160 * Math.min(1, k * 4) * (0.8 + 0.2 * Math.sin(t * 19)); this.boomLight.distance = 160;
  }
  /** batteries en court-circuit : gerbes d'étincelles par saccades, petits arcs électriques, lumière bleutée qui claque */
  battAt(t: number): number {
    this.batt.visible = true; const d = new THREE.Object3D(), src = [V(-1.1, 1.3, 0.15), V(0.75, 1.3, 0.15), V(0.4, 1.0, 1.3), V(1.4, 0.2, 2.2)];
    let flash = 0;
    for (let i = 0; i < 260; i++) { const s = i % 4, per = 0.45 + s * 0.13, ph = (t + hash(s, 7) * 3) / per, burst = Math.floor(ph), lt = (ph - burst) * per, live = hash(burst, s + 20) < 0.85;
      const dir = V(hash(i, burst + 1) - 0.5, 0.4 + hash(i, burst + 2) * 1.2, hash(i, burst + 3) - 0.5).normalize(), sp = 2 + hash(i, 4) * 3.5;
      if (live && lt < 0.4) { d.position.copy(src[s]).addScaledVector(dir, sp * lt).add(V(0, -4.9 * lt * lt, 0)); d.lookAt(d.position.clone().add(dir)); d.scale.setScalar(1 - lt * 2); if (lt < 0.06) flash = Math.max(flash, 1 - lt / 0.06); }
      else { d.position.set(0, -50, 0); d.scale.setScalar(0.001); }
      d.updateMatrix(); this.battSparks.setMatrixAt(i, d.matrix); }
    this.battSparks.instanceMatrix.needsUpdate = true;
    this.battArcs.forEach((a, i) => { const on = Math.sin(t * (31 + i * 7) + i) > 0.55; a.visible = on; a.position.copy(src[i]); a.rotation.set(t * 40 + i, t * 33, t * 27); a.scale.setScalar(1 + Math.sin(t * 90 + i) * 0.6); if (on) flash = Math.max(flash, 0.5); });
    return flash;
  }
  /** lampes des habitants de la façade braquées sur le monstre */
  resBeamsAt(t: number, tgt: THREE.Vector3, op = 0.34) {
    this.facade.updateMatrixWorld(true); this.residents.forEach((r, i) => { const b = this.resBeams[i]; if (!r.torch) return; b.mesh.visible = true;
      b.place(r.torch.localToWorld(V(0, 0, 1.6)), tgt.clone().add(V(Math.sin(i * 3) * 3, Math.cos(i * 2) * 4, 0))); b.set(t, op); });
  }
  genSmokeAt(t: number) {
    this.genSmoke.visible = true; const d = new THREE.Object3D(), base = this.gen.localToWorld(V(-1.4, 4, -0.4));
    for (let i = 0; i < 26; i++) { const ph = ((t * 0.35 + hash(i, 1)) % 1); d.position.copy(base).add(V(Math.sin(i + t) * 0.5 * ph + ph * 1.5, ph * 6, Math.cos(i) * 0.4 * ph)); d.scale.setScalar(0.3 + ph * 1.4); d.updateMatrix(); this.genSmoke.setMatrixAt(i, d.matrix); }
    this.genSmoke.instanceMatrix.needsUpdate = true;
  }
  rainAt(t: number, cam: THREE.Vector3, dir: THREE.Vector3) {
    this.rain.visible = true; const d = new THREE.Object3D(), c = cam.clone().add(dir.clone().setY(0).normalize().multiplyScalar(12));
    for (let i = 0; i < 5000; i++) { const x = c.x + (hash(i, 1) - 0.5) * 34, z = c.z + (hash(i, 2) - 0.5) * 34, y = cam.y + 14 - ((hash(i, 3) * 28 + t * 22) % 28);
      d.position.set(x + (y - cam.y) * 0.08, y, z); d.rotation.set(0, 0, 0.08); d.updateMatrix(); this.rain.setMatrixAt(i, d.matrix); }
    this.rain.instanceMatrix.needsUpdate = true;
  }
}
let _st: THREE.CanvasTexture | null = null;
const stripeTex = () => { if (_st) return _st; const cv = document.createElement("canvas"); cv.width = 128; cv.height = 16; const g = cv.getContext("2d")!; for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? "#f0eee8" : "#2a5fa8"; g.fillRect(i * 16, 0, 16, 16); } _st = new THREE.CanvasTexture(cv); _st.colorSpace = THREE.SRGBColorSpace; return _st; };

let _ft: { map: THREE.CanvasTexture; em: THREE.CanvasTexture } | null = null;
/** façade 34 x 26,4 m : 7 niveaux de 3,6 m, trois travées de balcons (x = -9, 0, 9) + cage d'escalier, rez-de-chaussée commerçant */
const facadeTex = () => { if (_ft) return _ft; const W = 1360, H = 1056, px = W / 34, py = H / 26.4;
  const mk = () => { const c = document.createElement("canvas"); c.width = W; c.height = H; return c; };
  const cm = mk(), ce = mk(), g = cm.getContext("2d")!, e = ce.getContext("2d")!;
  g.fillStyle = "#8a7966"; g.fillRect(0, 0, W, H); e.fillStyle = "#000"; e.fillRect(0, 0, W, H);
  for (let i = 0; i < 2600; i++) { g.fillStyle = `rgba(${hash(i, 1) < 0.5 ? "0,0,0" : "255,255,255"},${0.04 + hash(i, 2) * 0.05})`; g.fillRect(hash(i, 3) * W, hash(i, 4) * H, 2 + hash(i, 5) * 6, 2 + hash(i, 6) * 6); }
  const X = (m: number) => (m + 14.5) * px, Y = (m: number) => H - m * py;
  for (let fl = 0; fl < 7; fl++) { const y0 = fl * 3.6; g.fillStyle = "rgba(0,0,0,0.22)"; g.fillRect(0, Y(y0 + 0.25), W, 5); }
  const win = (x: number, y: number, w: number, h: number, seed: number, door = false) => { const lit = hash(seed, 3) < 0.82, warm = hash(seed, 4) < 0.7;
    g.fillStyle = "#e6e0d4"; g.fillRect(X(x - w / 2) - 5, Y(y + h) - 5, w * px + 10, h * py + 8); g.fillStyle = "#121722"; g.fillRect(X(x - w / 2), Y(y + h), w * px, h * py);
    if (lit) { const c = warm ? "#ffcf86" : "#cfe2ff"; for (const ctx of [g, e]) { ctx.fillStyle = c; ctx.fillRect(X(x - w / 2) + 3, Y(y + h) + 3, w * px - 6, h * py - 6); }
      if (hash(seed, 5) < 0.45) { for (const ctx of [g, e]) { ctx.fillStyle = "#1a1410"; const sx = X(x - w / 2 + w * (0.25 + hash(seed, 6) * 0.4)); ctx.fillRect(sx, Y(y + h * 0.78), w * px * 0.22, h * py * 0.78); ctx.beginPath(); ctx.arc(sx + w * px * 0.11, Y(y + h * 0.84), w * px * 0.12, 0, 7); ctx.fill(); } } }
    for (const ctx of [g, e]) { ctx.fillStyle = "#2a2f3a"; ctx.fillRect(X(x) - 2, Y(y + h), 4, h * py); if (!door) ctx.fillRect(X(x - w / 2), Y(y + h * 0.5) - 2, w * px, 4); } };
  for (let fl = 1; fl < 7; fl++) { const y = fl * 3.6 + 0.2;
    for (const bx of [-9, 0, 9]) { win(bx - 1.1, y, 1.4, 2.5, fl * 10 + bx + 30, true); win(bx + 1.2, y + 0.9, 1.2, 1.6, fl * 10 + bx + 31); }
    for (const sx of [-13.5, 4.5, -4.5, 18.5]) win(sx, y + 0.9, 1.0, 1.5, fl * 7 + sx + 90);
    win(14, y + 1.6, 0.8, 1.2, fl * 3 + 70); }
  g.fillStyle = "#24262c"; g.fillRect(0, Y(3.3), W, 3.3 * py);
  for (let i = 0; i < 6; i++) { const x = -12 + i * 5.5; for (const ctx of [g, e]) { ctx.fillStyle = i % 2 ? "#ffd9a0" : "#bfe0ff"; ctx.globalAlpha = i === 3 ? 0.15 : 0.75; ctx.fillRect(X(x - 2), Y(2.8), 4 * px, 2.4 * py); ctx.globalAlpha = 1; } }
  const tex = (c: HTMLCanvasElement) => { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; };
  _ft = { map: tex(cm), em: tex(ce) }; return _ft; };
