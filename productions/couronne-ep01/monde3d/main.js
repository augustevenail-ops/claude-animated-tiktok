import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { buildWorld, neonSign, MAP } from "./world.js";
import { addDetails } from "./details.js";
import { SHOTS } from "./shots.js";

const scene = new THREE.Scene();
const WD = buildWorld(scene), { r1, r2 } = WD;
addDetails(scene, WD);
const fog0 = scene.fog.clone(), bg0 = scene.background.clone();
// panneaux néon (règle 1 sur le pignon de district, règle 2 sur la face pleine de la tour)
const s1 = new THREE.Mesh(new THREE.PlaneGeometry(9, 4.5), new THREE.MeshBasicMaterial({ map: neonSign([["RÈGLE 1", "600 190px Oswald, Impact, sans-serif", 230], ["NE SORS JAMAIS DU DÔME.", "900 66px Montserrat, Arial Black, sans-serif", 380]]), transparent: true }));
s1.position.set(-17, 8.5, 295.15); scene.add(s1);
const s2 = new THREE.Mesh(new THREE.PlaneGeometry(0.84, 0.62), new THREE.MeshBasicMaterial({ map: neonSign([["RÈGLE 2", "600 210px Oswald, Impact, sans-serif", 260], ["TU NE VAS JAMAIS", "900 70px Montserrat, Arial Black, sans-serif", 400], ["AU CENTRE.", "900 70px Montserrat, Arial Black, sans-serif", 490]], 1024, 760), transparent: true }));
s2.position.set(0, 40, 61.02); scene.add(s2);


// ---------- hologramme de la carte (plans 8 et 27) : arêtes lumineuses, faces translucides, dôme filaire ----------
function holoScene(mode) {
  const hs = new THREE.Scene(); hs.background = new THREE.Color(0x000000);
  const CEN = 0x9fe8ff, DIS = mode === "27" ? 0xff4a3a : 0x3fa8ff, add = m => (hs.add(m), m);
  const edge = (geo, col, op) => new THREE.LineSegments(new THREE.EdgesGeometry(geo), new THREE.LineBasicMaterial({ color: col, transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false }));
  const fill = col => new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.035, blending: THREE.AdditiveBlending, depthWrite: false });
  const box = new THREE.BoxGeometry(1, 1, 1);
  WD.B.forEach(b => { const rich = b.kind === "rich", col = rich ? CEN : DIS;
    const m = new THREE.Mesh(box, fill(col)); m.scale.set(b.w, b.h, b.d); m.position.set(b.x, b.h / 2, b.z); add(m);
    const e = edge(box, col, rich ? 0.5 : 0.5); e.scale.copy(m.scale); e.position.copy(m.position); add(e);
    if (rich) for (let y = 24; y < b.h; y += 24) { const f = edge(new THREE.PlaneGeometry(b.w, b.d), col, 0.12); f.rotation.x = -Math.PI / 2; f.position.set(b.x, y, b.z); add(f); } });   // étages des tours
  const ring = (r, col, op, y = 0.2, seg = 256, dash) => { const pts = []; for (let i = 0; i <= seg; i++) { const a = i / seg * Math.PI * 2; pts.push(new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r)); }
    const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), dash ? new THREE.LineDashedMaterial({ color: col, dashSize: dash, gapSize: dash * 0.8, transparent: true, opacity: op }) : new THREE.LineBasicMaterial({ color: col, transparent: true, opacity: op, blending: THREE.AdditiveBlending }));
    if (dash) l.computeLineDistances(); return add(l); };
  for (let r = 40; r <= MAP.R_DOME + 120; r += 40) ring(r, 0x3fa8ff, r % 160 ? 0.12 : 0.3);                      // grille polaire au sol
  for (let k = 0; k < 24; k++) { const a = k / 24 * Math.PI * 2; add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(Math.cos(a) * 40, 0.2, Math.sin(a) * 40), new THREE.Vector3(Math.cos(a) * (MAP.R_DOME + 120), 0.2, Math.sin(a) * (MAP.R_DOME + 120))]), new THREE.LineBasicMaterial({ color: 0x3fa8ff, transparent: true, opacity: 0.12 }))); }
  ring(MAP.R_WALL, CEN, 1.0, 28); ring(MAP.R_WALL, CEN, 0.8, 0.5);                                                 // second mur
  for (let k = 0; k < 96; k++) { const a = k / 96 * Math.PI * 2; add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(Math.cos(a) * MAP.R_WALL, 0, Math.sin(a) * MAP.R_WALL), new THREE.Vector3(Math.cos(a) * MAP.R_WALL, 28, Math.sin(a) * MAP.R_WALL)]), new THREE.LineBasicMaterial({ color: CEN, transparent: true, opacity: 0.35 }))); }
  const dome = (R, col, op, dash) => { for (let k = 1; k < 9; k++) { const an = k / 9 * Math.PI / 2; ring(R * Math.cos(an), col, op, R * Math.sin(an) * 0.9, 128, dash); }
    for (let m = 0; m < 24; m++) { const a = m / 24 * Math.PI * 2, pts = []; for (let k = 0; k <= 30; k++) { const an = k / 30 * Math.PI / 2; pts.push(new THREE.Vector3(Math.cos(a) * R * Math.cos(an), R * Math.sin(an) * 0.9, Math.sin(a) * R * Math.cos(an))); }
      const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), dash ? new THREE.LineDashedMaterial({ color: col, dashSize: dash, gapSize: dash * 0.8, transparent: true, opacity: op }) : new THREE.LineBasicMaterial({ color: col, transparent: true, opacity: op, blending: THREE.AdditiveBlending })); if (dash) l.computeLineDistances(); add(l); }
    ring(R, col, Math.min(1, op * 2.5), 0.5, 256, dash); };
  if (mode === "27") { dome(MAP.R_DOME, 0xff4a3a, 0.35, 14); dome(MAP.R_WALL + 12, 0x9fe8ff, 0.7);
    add(new THREE.Mesh(new THREE.SphereGeometry(MAP.R_WALL + 12, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0x6fe0ff, transparent: true, opacity: 0.08, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }))).scale.y = 0.9; }
  else { dome(MAP.R_DOME, 0x6fe0ff, 0.28); add(new THREE.Mesh(new THREE.SphereGeometry(MAP.R_DOME, 64, 32, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0x3fa8ff, transparent: true, opacity: 0.04, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }))).scale.y = 0.9; }
  return hs;
}
const HOLO = {};
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.3;
document.body.appendChild(renderer.domElement);
window.render = (name, w, h) => {
  const s = SHOTS[name]; renderer.setSize(w, h, false);
  const cam = new THREE.PerspectiveCamera(s.fov, w / h, 0.05, 6000); cam.position.set(...s.pos); cam.lookAt(...s.look);
  scene.fog = s.fog ? new THREE.FogExp2(s.fog[0], s.fog[1]) : fog0; scene.background = s.bg ? new THREE.Color(s.bg) : bg0;
  const sc = s.holo ? (HOLO[s.holo] ||= holoScene(s.holo)) : scene;
  const comp = new EffectComposer(renderer); comp.setSize(w, h);
  comp.addPass(new RenderPass(sc, cam)); comp.addPass(s.holo ? new UnrealBloomPass(new THREE.Vector2(w, h), 0.55, 0.4, 0.2) : new UnrealBloomPass(new THREE.Vector2(w, h), 0.7, 0.5, 0.55)); comp.addPass(new OutputPass());
  comp.render(); return renderer.domElement.toDataURL("image/png");
};
window.READY = true;
