// Le Monstre : plans (essai des plans 1 à 5). Minutage provisoire (60 images par plan) en attendant la voix.
import * as THREE from "three";
import { City, V, MON_TARGET } from "./city";
import { Monster } from "./monster";
import { Actor, CAST, Expr } from "./chars";
import { Beam } from "./beams";

export const FPS = 30, PER = 60;
export type World = { city: City; mon: Monster; guards: Actor[]; gBeams: Beam[]; civ: Actor[]; pink: Actor; hero: Actor; dad: Actor; fill: THREE.PointLight; key: THREE.SpotLight };
type Cam = { P: THREE.Vector3; T: THREE.Vector3; fov: number };
export type Shot = { id: number; desc: string; mood: "night" | "flash"; cam: (w: World, u: number) => Cam; st?: (w: World, u: number, t: number) => void };

const sm = (x: number) => { const t = Math.min(1, Math.max(0, x)); return t * t * t * (t * (t * 6 - 15) + 10); };
const lerpV = (a: THREE.Vector3, b: THREE.Vector3, u: number) => a.clone().lerp(b, u);
const glide = (P0: THREE.Vector3, P1: THREE.Vector3, T0: THREE.Vector3, T1: THREE.Vector3, fov: number, u: number, e = sm(u)): Cam => ({ P: lerpV(P0, P1, e), T: lerpV(T0, T1, e), fov });

export const SHOTS: Shot[] = [
  { id: 1, desc: "Dans cette ville, il existe un monstre", mood: "night",
    cam: (_w, u) => { const e = sm(u); const P = new THREE.CatmullRomCurve3([V(-34, 80, 160), V(-20, 50, 100), V(-10, 24, 56)]).getPoint(e); return { P, T: lerpV(V(0, 6, 0), V(1, 19, 0), e), fov: 50 }; } },
  { id: 2, desc: "qui ne peut se déplacer que dans l'obscurité.", mood: "night",
    cam: (w, u) => { const H = w.mon.headWorld(V(0, 0.95, 0.2)); return glide(H.clone().add(V(0, -16, 55)), H.clone().add(V(0, -1.6, 11.5)), H.clone().add(V(0, -6, 0)), H, 42, u, Math.pow(u, 0.85)); } },
  { id: 3, desc: "Et si les lumières s'éteignent, ne serait-ce qu'une seconde,", mood: "night",
    cam: (w, u) => { const t = w.city.towers[1].root.position, top = V(t.x, 40.5, t.z), dir = top.clone().setY(0).normalize();
      const perp = V(-dir.z, 0, dir.x); const P0 = top.clone().sub(dir.clone().multiplyScalar(20)).add(perp.clone().multiplyScalar(4)).setY(24), P1 = top.clone().sub(dir.clone().multiplyScalar(17.5)).add(perp.clone().multiplyScalar(3.5)).setY(26);
      return glide(P0, P1, top.clone().add(V(0, 1.5, 0)), top.clone().add(V(0, 1.6, 0)), 50, u); },
    st: (w, u) => { const f = u > 0.45 && u < 0.62 ? 0.35 + 0.65 * Math.abs(Math.sin(u * 180)) : 1; const t = w.city.towers[1]; t.lens.emissiveIntensity = 9 * f; t.spot.intensity = 5.5 * f; for (const b of t.beams) b.set(0, 0.3 * f); } },
  { id: 4, desc: "c'est la fin pour nous tous.", mood: "night",
    cam: (_w, u) => glide(V(1, 1.5, 46), V(0.8, 1.6, 42), V(0, 17.5, 0), V(0, 17.8, 0), 58, u) },
  { id: 5, desc: "Il y a trois ans, cette chose est apparue en plein cœur de notre ville.", mood: "flash",
    cam: (w, u) => { const p = w.pink.root.position, e = sm(u);
      const P = new THREE.CatmullRomCurve3([V(3, 3.2, 150), V(1.8, 2.3, 118), p.clone().add(V(0.25, 1.55, 1.7))]).getPoint(e);
      const T = lerpV(V(0, 20, 0), p.clone().add(V(0, 1.5, 0)), Math.pow(e, 1.8)); return { P, T, fov: 46 - 8 * e }; } },
  { id: 6, desc: "test personnages", mood: "night",
    cam: (_w, u) => glide(V(9.6, 1.0, 26.5), V(9.55, 1.05, 26.2), V(9.15, 1.25, 19.6), V(9.15, 1.25, 19.6), 24, u),
    st: (w, _u, t) => { w.hero.root.visible = w.dad.root.visible = true; w.hero.pose(t, { yaw: 0.35, expr: "worried", point: 0.3, headPitch: -0.05 }); w.dad.pose(t, { yaw: -0.1, expr: "focus" });
      w.key.intensity = 4; w.key.position.set(16, 12, 6); w.key.target.position.set(9, 1, 20); w.key.angle = 0.4; w.fill.intensity = 14; w.fill.position.set(12.5, 2.5, 23); } },
];
export const TOTAL = SHOTS.length * PER;
export const shotAt = (f: number) => Math.min(SHOTS.length - 1, Math.floor(f / PER));
export const uOf = (f: number) => (f % PER) / (PER - 1);

/** gardes à l'intérieur de l'enceinte, lampes braquées sur le monstre */
export const makeGuards = (root: THREE.Object3D) => {
  const guards: Actor[] = [], beams: Beam[] = [];
  for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2 + 0.3, r = 8.2 + (i % 2) * 0.8; const g = new Actor(i % 3 === 1 ? CAST.guard2 : CAST.guard, 0.36, i);
    g.root.position.set(Math.cos(a) * r, 0.12, Math.sin(a) * r); g.root.lookAt(0, 0.12, 0); g.addTorch(); root.add(g.root); guards.push(g);
    const b = new Beam(1.4, 0.12, 0.22, "#fff4dc"); root.add(b.mesh); beams.push(b); }
  return { guards, beams };
};
export const poseGuards = (w: World, t: number) => w.guards.forEach((g, i) => {
  const q = g.root.position; g.pose(t, { point: 0.9, expr: "focus", headPitch: -0.35, yaw: Math.atan2(-q.x, -q.z) }); g.root.updateMatrixWorld(true);
  const tip = g.torch!.localToWorld(V(0, 0, 1.6)); w.gBeams[i].place(tip, MON_TARGET.clone().add(V(Math.sin(i) * 2, -6 + Math.cos(i * 2) * 3, 0)), 14); w.gBeams[i].set(t);
});
/** habitants du flashback dans la rue, la personne en rose face caméra */
export const makeCivilians = (root: THREE.Object3D) => {
  const specs = ["c1", "c2", "c3", "c4", "c1", "c2"], civ: Actor[] = [];
  const pos: [number, number][] = [[-2.2, 97], [1.8, 96.2], [-0.6, 94.5], [3.2, 98.5], [-3.6, 99.5], [0.2, 92.8]];
  specs.forEach((k, i) => { const a = new Actor({ ...CAST[k], name: k + i }, 0.36, i + 3); a.root.position.set(pos[i][0], 0, pos[i][1]); a.root.rotation.y = Math.PI + (i - 2) * 0.12; root.add(a.root); civ.push(a); });
  const pink = new Actor(CAST.pink, 0.36, 11); pink.root.position.set(0.6, 0, 100); root.add(pink.root);
  return { civ, pink };
};
export const poseCivilians = (w: World, t: number) => {
  w.civ.forEach((a, i) => a.pose(t, { yaw: Math.PI + (i - 2) * 0.12, expr: (["scared", "worried", "scared", "worried", "scared", "worried"] as Expr[])[i], headPitch: -0.25, point: i === 1 ? 0.6 : undefined }));
  w.pink.pose(t, { expr: "scared", headPitch: -0.04, yaw: 0.12 });
};
