import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { buildWorld, neonSign } from "./world.js";
import { SHOTS } from "./shots.js";

const scene = new THREE.Scene();
const { r1, r2 } = buildWorld(scene);
const fog0 = scene.fog.clone(), bg0 = scene.background.clone();
// panneaux néon (règle 1 sur le pignon de district, règle 2 sur la face pleine de la tour)
const s1 = new THREE.Mesh(new THREE.PlaneGeometry(9, 4.5), new THREE.MeshBasicMaterial({ map: neonSign([["RÈGLE 1", "600 190px Oswald, Impact, sans-serif", 230], ["NE SORS JAMAIS DU DÔME.", "900 66px Montserrat, Arial Black, sans-serif", 380]]), transparent: true }));
s1.position.set(-17, 8.5, 295.15); scene.add(s1);
const s2 = new THREE.Mesh(new THREE.PlaneGeometry(0.84, 0.62), new THREE.MeshBasicMaterial({ map: neonSign([["RÈGLE 2", "600 210px Oswald, Impact, sans-serif", 260], ["TU NE VAS JAMAIS", "900 70px Montserrat, Arial Black, sans-serif", 400], ["AU CENTRE.", "900 70px Montserrat, Arial Black, sans-serif", 490]], 1024, 760), transparent: true }));
s2.position.set(0, 40, 61.02); scene.add(s2);

const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.3;
document.body.appendChild(renderer.domElement);
window.render = (name, w, h) => {
  const s = SHOTS[name]; renderer.setSize(w, h, false);
  const cam = new THREE.PerspectiveCamera(s.fov, w / h, 0.05, 6000); cam.position.set(...s.pos); cam.lookAt(...s.look);
  scene.fog = s.fog ? new THREE.FogExp2(s.fog[0], s.fog[1]) : fog0; scene.background = s.bg ? new THREE.Color(s.bg) : bg0;
  const comp = new EffectComposer(renderer); comp.setSize(w, h);
  comp.addPass(new RenderPass(scene, cam)); comp.addPass(new UnrealBloomPass(new THREE.Vector2(w, h), 0.7, 0.5, 0.55)); comp.addPass(new OutputPass());
  comp.render(); return renderer.domElement.toDataURL("image/png");
};
window.READY = true;
