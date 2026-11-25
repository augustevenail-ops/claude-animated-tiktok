// Le Monstre ép. 1 : les 63 plans calés sur la voix (words.json), ambiances, caméras et animation de chaque plan.
import * as THREE from "three";
import WORDS from "./words.json";
import { City, V, Tower } from "./city";
import { Monster } from "./monster";
import { Actor, CAST, Expr } from "./chars";
import { Beam } from "./beams";
import { Props } from "./props";

export const FPS = 30;
const W = WORDS as { w: string; s: number; e: number }[];
const LAST = W.filter((w) => /[a-zà-ÿ]/i.test(w.w)).pop()!;
export const TOTAL = Math.round((LAST.e + 1.3) * FPS);
const STARTW = [0, 7, 15, 24, 30, 45, 51, 60, 70, 72, 82, 91, 103, 113, 117, 124, 136, 139, 143, 145, 150, 157, 166, 173, 187, 195, 199, 208, 215, 226, 233, 240, 246, 253, 258, 266, 269, 277, 280, 287, 294, 300, 304, 309, 320, 326, 330, 333, 339, 345, 358, 366, 376, 381, 392, 398, 408, 412, 419, 426, 432, 435, 443];
export const START = STARTW.map((wi, i) => (i === 0 ? 0 : Math.round(W[wi].s * FPS) - 2));
export const shotAt = (f: number) => { let i = 0; while (i + 1 < START.length && START[i + 1] <= f) i++; return i; };
export const uOf = (i: number, f: number) => { const a = START[i], b = i + 1 < START.length ? START[i + 1] : TOTAL; return Math.min(1, Math.max(0, (f - a) / Math.max(1, b - a - 1))); };

export type World = { city: City; mon: Monster; props: Props; guards: Actor[]; gBeams: Beam[]; civ: Actor[]; pink: Actor; hero: Actor; dad: Actor; tech: Actor; lev: Actor; slip: Actor; held: Actor; heroBeam: Beam;
  fill: THREE.PointLight; key: THREE.SpotLight; winBase: number[]; scene?: THREE.Scene };
type Cam = { P: THREE.Vector3; T: THREE.Vector3; fov: number; roll?: number };
type Env = "night" | "flash" | "dawn" | "day" | "dusk" | "black";
type Shot = { env: Env; cam: (w: World, u: number, t: number) => Cam; st?: (w: World, u: number, t: number) => void; fr: string; mv: string };

const sm = (x: number) => { const t = Math.min(1, Math.max(0, x)); return t * t * t * (t * (t * 6 - 15) + 10); };
const L = (a: THREE.Vector3, b: THREE.Vector3, u: number) => a.clone().lerp(b, u);
const G = (P0: THREE.Vector3, P1: THREE.Vector3, T0: THREE.Vector3, T1: THREE.Vector3, fov: number, u: number): Cam => { const e = sm(u); return { P: L(P0, P1, e), T: L(T0, T1, e), fov }; };
const add = (a: THREE.Vector3, x: number, y: number, z: number) => a.clone().add(V(x, y, z));
const orbit = (c: THREE.Vector3, r: number, y: number, a: number) => V(c.x + Math.cos(a) * r, y, c.z + Math.sin(a) * r);
const HERO = V(10, 0.12, 25), DAD = V(11.6, 0.12, 24.4), M1 = V(9, 0, 12.5);
const headOf = (a: Actor) => { a.root.updateMatrixWorld(true); return a.neck.localToWorld(V(0, 0.7, 0)); };
const T5 = 5; // tour qui explose

// ---------------- état global selon le plan ----------------
const S = (i: number) => i; // indices 0-based des plans (plan n = index n-1)
const P_BOOM = S(18), P_POLICE = S(28), P_CLIC = S(33), P_BLACK = S(34), P_RAIN = S(40), P_SLIP = S(41), P_CARDEAD = S(43), P_DARK = S(49), P_MOVED = S(51);

export const SHOTS: Shot[] = [
  /* 1 */ { env: "night", fr: "Plongée", mv: "Travelling avant descendant", cam: (_w, u) => { const e = sm(u); return { P: new THREE.CatmullRomCurve3([V(-34, 80, 160), V(-20, 50, 100), V(-10, 24, 56)]).getPoint(e), T: L(V(0, 6, 0), V(1, 19, 0), e), fov: 50 }; } },
  /* 2 */ { env: "night", fr: "Contre-plongée frontale", mv: "Travelling avant", cam: (w, u) => { const H = w.mon.headWorld(V(0, 0.95, 0.2)); return G(add(H, 0, -16, 55), add(H, 0, -1.6, 11.5), add(H, 0, -6, 0), H, 42, Math.pow(u, 0.85)); } },
  /* 3 */ { env: "night", fr: "Contre-plongée", mv: "Léger travelling avant", cam: (w, u) => { const t = w.city.towers[1].root.position, top = V(t.x, 40.5, t.z), dir = top.clone().setY(0).normalize(), pp = V(-dir.z, 0, dir.x);
      return G(top.clone().sub(dir.clone().multiplyScalar(20)).add(pp.clone().multiplyScalar(4)).setY(24), top.clone().sub(dir.clone().multiplyScalar(17.5)).add(pp.clone().multiplyScalar(3.5)).setY(26), add(top, 0, 1.5, 0), add(top, 0, 1.6, 0), 50, u); },
    st: (w, u) => { const f = u > 0.45 && u < 0.62 ? 0.35 + 0.65 * Math.abs(Math.sin(u * 180)) : 1; towerLevel(w.city.towers[1], f); } },
  /* 4 */ { env: "night", fr: "Contre-plongée", mv: "Travelling avant discret", cam: (_w, u) => G(V(1, 1.5, 46), V(0.8, 1.6, 42), V(0, 17.5, 0), V(0, 17.8, 0), 58, u) },
  /* 5 */ { env: "flash", fr: "Plan moyen → très gros plan", mv: "Travelling avant rapide", cam: (w, u) => { const p = w.pink.root.position, e = sm(u);
      const P = new THREE.CatmullRomCurve3([V(3, 3.2, 150), V(1.8, 2.3, 118), add(p, 0.25, 1.55, 1.7)]).getPoint(e); return { P, T: L(V(0, 20, 0), add(p, 0, 1.5, 0), Math.pow(e, 1.8)), fov: 46 - 8 * e }; },
    st: (w, _u, t) => { vis([...w.civ, w.pink], true); poseCiv(w, t); } },
  /* 6 */ { env: "flash", fr: "Plan au ras du sol", mv: "Travelling latéral droite", cam: (_w, u) => G(V(-4, 0.6, 117.5), V(3.5, 0.6, 117.5), V(-6, 6, 0), V(6, 8, 0), 52, u), st: (w) => { w.props.items.visible = true; } },
  /* 7 */ { env: "dawn", fr: "Plan large", mv: "Plan quasi fixe, léger avant", cam: (_w, u) => G(V(6, 6, 95), V(5.6, 6.2, 89), V(0, 18, 0), V(0, 18.5, 0), 46, u) },
  /* 8 */ { env: "dawn", fr: "Plan large", mv: "Léger travelling avant", cam: (_w, u) => G(V(-24, 4, 72), V(-21, 4.6, 64), V(0, 20, 0), V(0, 21, 0), 48, u) },
  /* 9 */ { env: "dawn", fr: "Gros plan visage", mv: "Travelling avant lent", cam: (w, u) => { const H = w.mon.headWorld(V(0, 0.8, 0.6)); return G(add(H, 3, -4, 17), add(H, 1.4, -1.8, 10), H, H, 40, u); } },
  /* 10 */ { env: "dusk", fr: "Plan d'ensemble", mv: "Drone : orbite 360°", cam: (_w, u) => ({ P: orbit(V(0, 0, 0), 92 - 10 * u, 34 + 8 * u, 0.9 + u * Math.PI * 2), T: V(0, 16, 0), fov: 52 }),
    st: (w, u) => { w.city.installs(true); w.city.towers.forEach((tw, k) => towerLevel(tw, sm((u - 0.08 - k * 0.12) * 6))); vis(w.guards, false); } },
  /* 11 */ { env: "day", fr: "Plan rapproché", mv: "Travelling latéral gauche + rotation", cam: (w, u) => { const g = w.props.gen.position; const a = 1.25 - 0.55 * sm(u); return { P: orbit(g, 9, 2.8, a), T: add(g, 0, 1.6, 0), fov: 44 }; } },
  /* 12 */ { env: "day", fr: "Plan moyen", mv: "Travelling circulaire", cam: (_w, u) => { const a = 0.3 + (0.95 - 0.75 * sm(u)) - 0.6; return { P: orbit(V(0, 0, 0), 4.5, 1.4, a + 0.15), T: orbit(V(0, 0, 0), 9.5, 1.9, a + 0.4), fov: 46 }; } },
  /* 13 */ { env: "day", fr: "Plongée", mv: "Travelling avant en plongée", cam: (w, u) => { const r = w.props.rod.position; return G(add(r, -4, 14, 14), add(r, -2, 10.5, 7), add(r, 4, 3, -8), add(r, 8, 6, -14), 52, u); }, st: (w) => { w.props.rod.visible = true; } },
  /* 14 */ { env: "dusk", fr: "Très gros plan (œil)", mv: "Travelling avant serré", cam: (w, u) => { const e = w.mon.headWorld(V(-0.38, 1.15, 0.66)); return G(add(e, 0.3, 0.1, 7.5), add(e, 0.1, 0, 3.8), e, e, 36, u); }, st: (w, _u, t) => { w.props.genSmokeAt(t); } },
  /* 15 */ { env: "dusk", fr: "Plan large → rapproché", mv: "Travelling latéral gauche", cam: (w, u) => G(V(17, 1.7, 36), V(13.6, 1.6, 30.5), headOf(w.dad), headOf(w.dad), 40, u),
    st: (w, u, t) => { const e = sm(u); w.dad.root.position.lerpVectors(V(16, 0.12, 12), DAD, e); w.dad.pose(t, { walk: 1 - e * 0.8, yaw: Math.atan2(DAD.x - 16, DAD.z - 12), expr: "neutral" }); } },
  /* 16 */ { env: "dusk", fr: "Plan à deux", mv: "Plan fixe", cam: (_w, u) => G(V(13.4, 1.25, 31.2), V(13.3, 1.27, 31.0), V(10.4, 1.35, 24.7), V(10.4, 1.35, 24.7), 36, u),
    st: (w, u, t) => { w.hero.pose(t, { yaw: 0.45, expr: "smile", point: 0.2 }); w.dad.pose(t, { yaw: -0.3, expr: u > 0.35 && u < 0.75 ? "focus" : "neutral" }); torchOn(w, true); } },
  /* 17 */ { env: "dusk", fr: "Plan large en plongée", mv: "Quasi fixe", cam: (_w, u) => G(V(46, 34, 66), V(45, 34.5, 64), V(6, 10, 8), V(6, 10, 8), 50, u), st: (w, u, t) => { w.mon.pose(t, { headYaw: -0.12 * sm(u) }); } },
  /* 18 */ { env: "night", fr: "Très gros plan (téléphone)", mv: "Zoom avant lent", cam: (w, u) => { const p = w.props.phone.position; return G(add(p, 0.9, 2.3, 4.6), add(p, 0.05, 1.4, 2.3), add(p, 0, -0.25, 0), p, 40, u); },
    st: (w) => { const p = w.props.phone; p.visible = true; p.position.set(10.25, 1.05, 25.7); p.rotation.set(-0.55, 0.05, 0); } },
  /* 19 */ { env: "night", fr: "Contre-plongée", mv: "Caméra fixe", cam: (w) => { const t = w.city.towers[T5].root.position; return { P: V(8, 1.4, 27), T: V(t.x * 0.9, 30, t.z * 0.9), fov: 50 }; }, st: (w, u, t) => boom(w, (u - 0.12) * 0.9, t) },
  /* 20 */ { env: "night", fr: "Plan rapproché, explosion en arrière-plan", mv: "Léger travelling avant", cam: (w, u) => { const h = headOf(w.hero), E = boomPos(w), d = h.clone().sub(E).setY(0).normalize();
      const P = L(add(h.clone().addScaledVector(d, 3.1), 0, -0.6, 0), add(h.clone().addScaledVector(d, 2.6), 0, -0.55, 0), sm(u)); const T = P.clone().add(E.clone().sub(P).setY(0).normalize().multiplyScalar(Math.cos(0.36)).setY(Math.sin(0.36)));
      return { P, T, fov: 48 }; },
    st: (w, u, t) => { boom(w, 0.42 + u * 0.55, t); const E = boomPos(w); w.hero.pose(t, { yaw: Math.atan2(HERO.x - E.x, HERO.z - E.z), headYaw: Math.PI * 0.55 * sm(u * 2.2), headPitch: -0.25 * sm(u * 2.2), expr: "scared", point: 0.2 + 0.2 * Math.sin(u * 3) }); } },
  /* 21 */ { env: "night", fr: "Plan rapproché", mv: "Zoom avant + travelling gauche", cam: (w, u) => G(add(headOf(w.dad), 2.4, 0.1, 4.2), add(headOf(w.dad), 0.8, 0.05, 2.5), headOf(w.dad), headOf(w.dad), 38, u), st: (w, _u, t) => { boom(w, 1.3, t); w.dad.pose(t, { yaw: 0.2, expr: "focus" }); } },
  /* 22 */ { env: "night", fr: "Plan moyen (visage du père)", mv: "Léger travelling avant", cam: (w, u) => { const h = headOf(w.dad), f = fwdOf(w.dad), sd = V(f.z, 0, -f.x);
      return G(h.clone().addScaledVector(f, 2.9).addScaledVector(sd, 0.5).add(V(0, -0.15, 0)), h.clone().addScaledVector(f, 2.45).addScaledVector(sd, 0.4).add(V(0, -0.12, 0)), add(h, 0, -0.3, 0), add(h, 0, -0.25, 0), 40, u); },
    st: (w, _u, t) => { w.dad.pose(t, { yaw: 0.35, talk: true, expr: "neutral" }); w.hero.pose(t, { yaw: Math.atan2(DAD.x - HERO.x, DAD.z - HERO.z), expr: "scared" }); } },
  /* 23 */ { env: "night", fr: "Plan moyen → veste et radio", mv: "Zoom léger", cam: (w, u) => { w.dad.root.updateMatrixWorld(true); const r = w.dad.radio!.localToWorld(V(0, 0, 0)), h = headOf(w.dad), f = fwdOf(w.dad), sd = V(f.z, 0, -f.x);
      const T0 = h.clone().lerp(r, 0.45), T1 = h.clone().lerp(r, 0.72); return G(T0.clone().addScaledVector(f, 2.7).addScaledVector(sd, -0.45), T1.clone().addScaledVector(f, 2.0).addScaledVector(sd, -0.35), T0, T1, 40, u); },
    st: (w, u, t) => { blink(w, t, 9); w.dad.pose(t, { yaw: 0.35, expr: u > 0.3 ? "worried" : "focus", headPitch: 0.35 * sm((u - 0.2) * 3), headYaw: -0.25 * sm((u - 0.2) * 3) }); } },
  /* 24 */ { env: "night", fr: "Plan rapproché (batteries en court-circuit)", mv: "Léger travelling avant", cam: (w, u) => { const b = w.props.batt; b.updateMatrixWorld(true);
      return G(b.localToWorld(V(4.8, 2.5, 2.4)), b.localToWorld(V(3.9, 2.1, 2.0)), b.localToWorld(V(-0.2, 0.85, 0.8)), b.localToWorld(V(0, 0.9, 0.9)), 46, u); },
    st: (w, _u, t) => { const fl = w.props.battAt(t); w.props.batt.updateMatrixWorld(true); w.fill.color.set("#bcd8ff"); w.fill.intensity = 4 + 26 * fl; w.fill.position.copy(w.props.batt.localToWorld(V(0.3, 2.3, 1.4))); w.tech.root.visible = true; w.tech.root.position.set(5.2, 0.12, 29.4); w.tech.pose(t, { yaw: -2.4, expr: "worried", headPitch: 0.4 }); w.tech.body.rotation.x = 0.25; const f = flick(t); w.city.bulb.emissiveIntensity = 8 * f; for (const h of w.city.lampHalos) (h.material as THREE.MeshBasicMaterial).opacity = 0.38 * f; } },
  /* 25 */ { env: "night", fr: "Plan rapproché", mv: "Léger travelling avant", cam: (w, u) => G(add(headOf(w.dad), -0.6, -0.05, 3.2), add(headOf(w.dad), -0.4, -0.05, 2.3), headOf(w.dad), headOf(w.dad), 36, u), st: (w, _u, t) => { w.dad.pose(t, { yaw: -0.15, expr: "worried", talk: true }); blink(w, t, 6); } },
  /* 26 */ { env: "night", fr: "Plan rapproché", mv: "Léger travelling avant", cam: (w, u) => G(V(13, 2.4, 29.5), V(14.6, 2.6, 27.6), add(w.props.gen.position, 0, 2.6, 0), add(w.props.gen.position, 0, 2.8, 0), 44, u), st: (w, _u, t) => w.props.genSmokeAt(t) },
  /* 27 */ { env: "night", fr: "Plan rapproché", mv: "Quasi fixe", cam: (w, u) => G(add(headOf(w.dad), 0.9, -0.3, 2.9), add(headOf(w.dad), 0.85, -0.3, 2.75), headOf(w.dad), headOf(w.dad), 32, u), st: (w, u, t) => { w.dad.pose(t, { yaw: 0.2, expr: "angry", point: 0.4 * sm(u * 2) }); blink(w, t, 6); } },
  /* 28 */ { env: "night", fr: "Plan rapproché", mv: "Léger mouvement", cam: (w, u) => G(add(headOf(w.dad), -1.4, -0.25, 3.0), add(headOf(w.dad), -1.25, -0.2, 2.8), headOf(w.dad), headOf(w.dad), 38, u), st: (w, _u, t) => { w.dad.pose(t, { yaw: -0.3, expr: "shout", talk: true, point: 0.9, wave: "L" }); blink(w, t, 6); } },
  /* 29 */ { env: "night", fr: "Plan large en plongée", mv: "Léger mouvement", cam: (_w, u) => G(V(58, 48, 74), V(54, 46, 69), V(0, 4, 0), V(0, 5, 0), 52, u), st: (w, u, t) => w.props.carsAt(t, u * 1.6, true) },
  /* 30 */ { env: "night", fr: "Contre-plongée", mv: "Léger travelling avant", cam: (w, u) => { const h = w.props.cars[1].home; return G(add(h.clone().multiplyScalar(1.22), 0, 1.1, 0), add(h.clone().multiplyScalar(1.15), 0, 1.3, 0), V(0, 22, 0), V(0, 23, 0), 54, u); } },
  /* 31 */ { env: "night", fr: "Plan moyen", mv: "Léger travelling avant", cam: (_w, u) => { const a = 0.3 + (2 / 8) * Math.PI * 2 + 0.4; return G(orbit(V(0, 0, 0), 4.5, 1.2, a), orbit(V(0, 0, 0), 5.2, 1.25, a), orbit(V(0, 0, 0), 9, 2.0, a - 0.05), orbit(V(0, 0, 0), 9, 2.1, a - 0.05), 50, u); },
    st: (w, u, t) => { for (const i of [2, 3]) w.guards[i].pose(t, { point: 0.2 + 0.9 * sm(u * 1.5), expr: "focus", headPitch: -0.4, yaw: guardYaw(w.guards[i]) }); } },
  /* 32 */ { env: "night", fr: "Plongée sur façade", mv: "Léger mouvement", cam: (_w, u) => G(V(-12, 5, -44), V(-14, 6.5, -50), V(-24, 15, -72.7), V(-25, 15.5, -72.7), 52, u), st: (w, _u, t) => { const f = 0.8 + 0.2 * flick(t * 0.7); for (const m of w.city.winMats) m.emissiveIntensity *= f; w.props.facadeWin.emissiveIntensity = 1.6 * f; } },
  /* 33 */ { env: "night", fr: "Contre-plongée", mv: "Léger travelling avant", cam: (_w, u) => G(V(2.4, 1.2, 15.5), V(2.1, 1.35, 14), V(0, 24, 0), V(0, 25, 0), 56, u), st: (w, _u, t) => winBeams(w, t, 0.8 + 0.2 * flick(t)) },
  /* 34 */ { env: "night", fr: "Plan rapproché (levier)", mv: "Léger mouvement", cam: (w, u) => { w.props.panel.updateMatrixWorld(true); const c = w.props.panel.localToWorld(V(0.2, 1.5, 0.3)); return G(w.props.panel.localToWorld(V(1.4, 1.9, 2.4)), w.props.panel.localToWorld(V(1.2, 1.8, 2.1)), c, c, 42, u); },
    st: (w, u, t) => { const k = sm((u - 0.2) * 2.5); w.props.lever.rotation.x = 1.3 * k; w.props.panelLeds.forEach((m, i) => { m.emissiveIntensity = u > 0.45 + i * 0.07 ? 0.05 : 5; });
      w.lev.root.visible = true; w.props.panel.updateMatrixWorld(true); w.lev.root.position.copy(w.props.panel.localToWorld(V(0.9, 0, 1.1))); w.lev.pose(t, { yaw: w.props.panel.rotation.y + Math.PI + 0.6, point: 0.6 - 0.7 * k, expr: "worried" }); } },
  /* 35 */ { env: "black", fr: "Plongée depuis un toit", mv: "Léger travelling avant", cam: (_w, u) => G(V(-32, 44, 66), V(-29, 41, 60), V(0, 12, 0), V(0, 13, 0), 52, u), st: (w, u) => blackout(w, u) },
  /* 36 */ { env: "black", fr: "Plongée (plus proche)", mv: "Travelling avant", cam: (_w, u) => G(V(-19, 30, 42), V(-16, 27, 36), V(0, 14, 0), V(0, 15, 0), 50, u), st: (w, _u, t) => floodMonster(w, t) },
  /* 37 */ { env: "black", fr: "Plan d'ensemble bas", mv: "Drone : orbite", cam: (_w, u) => ({ P: orbit(V(0, 0, 0), 24, 6, 1.1 + 0.8 * sm(u)), T: V(0, 17, 0), fov: 58 }), st: (w, _u, t) => floodMonster(w, t) },
  /* 38 */ { env: "black", fr: "Très gros plan (main)", mv: "Zoom avant lent", cam: (w, u) => { w.mon.root.updateMatrixWorld(true); const h = w.mon.lHand.localToWorld(V(0, -0.9, 0.3)); return G(add(h, 1.5, 0.5, 7), add(h, 1, 0.3, 4.6), h, h, 40, u); }, st: (w, _u, t) => w.mon.pose(t, { twitch: 1 }) },
  /* 39 */ { env: "black", fr: "Plan épaule", mv: "Travelling latéral droite", cam: (w, u) => G(add(HERO, -0.9, 1.6, 1.8), add(HERO, -0.2, 1.6, 1.8), V(-4, 14, 0), V(-2, 14, 0), 48, u), st: (w, _u, t) => w.hero.pose(t, { yaw: Math.PI + 0.35, point: 0.6, expr: "worried" }) },
  /* 40 */ { env: "black", fr: "Plan d'ensemble contre-plongée", mv: "Montée verticale", cam: (_w, u) => G(V(14, 1.4, 34), V(14, 3.2, 34), V(-10, 50, -50), V(-10, 56, -50), 58, u), st: (w, u) => lightning(w, u, 0.32) },
  /* 41 */ { env: "black", fr: "Plongée sur les dalles", mv: "Descente verticale", cam: (_w, u) => G(V(8.6, 5, 30), V(8.6, 2.6, 29), V(8, 0, 25), V(8, 0, 24.5), 50, u) },
  /* 42 */ { env: "black", fr: "Plan moyen", mv: "Travelling latéral gauche", cam: (w, u) => G(V(9.8, 1.3, 26), V(8.4, 1.3, 26), add(w.slip.root.position, 0, 0.9, 0), add(w.slip.root.position, 0, 0.7, 0), 44, u),
    st: (w, u, t) => { slipGuard(w, t, sm((u - 0.15) * 2.2)); } },
  /* 43 */ { env: "black", fr: "Gros plan au ras du sol", mv: "Zoom arrière", cam: (_w, u) => G(V(7.9, 0.35, 22.4), V(8.6, 0.6, 23.6), V(6.6, 0.15, 21.3), V(6.6, 0.15, 21.3), 40, u), st: (w, u, t) => { slipGuard(w, t, 1); looseTorch(w, V(6.2 + u * 0.8, 0.12, 21.2 + u * 0.3), u * 7, u < 0.82 ? 1 : 0, t); } },
  /* 44 */ { env: "black", fr: "Plan américain (voiture)", mv: "Zoom avant", cam: (w, u) => { const h = w.props.cars[0].home; return G(add(h.clone().multiplyScalar(0.72), 1.5, 1.2, 0), add(h.clone().multiplyScalar(0.8), 1, 1.1, 0), add(h, 0, 0.9, 0), add(h, 0, 0.9, 0), 46, u); } },
  /* 45 */ { env: "black", fr: "Contre-plongée", mv: "Montée verticale", cam: (w, u) => G(add(DAD, -0.6, 0.5, 2.3), add(DAD, -0.6, 1.0, 2.3), headOf(w.dad), headOf(w.dad), 44, u), st: (w, _u, t) => w.dad.pose(t, { yaw: -0.4, expr: "shout", talk: true, point: 1 }) },
  /* 46 */ { env: "black", fr: "Plan d'ensemble en plongée", mv: "Drone : survol", cam: (_w, u) => G(V(-24, 26, 40), V(-6, 24, 40), V(0, 2, 6), V(4, 2, 6), 52, u), st: (w, _u, t) => w.guards.forEach((g, i) => { if (g !== w.guards[0]) g.pose(t, { walk: 1.6, yaw: guardYaw(g) + 1.2, point: 0.7, expr: "scared" }); g.root.position.add(V(Math.sin(t * 2 + i) * 0.02, 0, 0)); }) },
  /* 47 */ { env: "black", fr: "Plan moyen", mv: "Travelling latéral droite", cam: (w, u) => G(V(6.4, 1.2, 30), V(7.6, 1.2, 30), add(w.hero.root.position, 0, 0.9, 0), add(w.hero.root.position, 0, 0.9, 0), 42, u), st: (w, u, t) => { w.hero.root.position.lerpVectors(HERO, add(HERO, -0.6, 0, -0.6), u); w.hero.pose(t, { walk: 1, yaw: Math.PI + 0.7, point: 0.6, expr: "worried" }); } },
  /* 48 */ { env: "black", fr: "Très gros plan (pied)", mv: "Travelling latéral gauche", cam: (_w, u) => G(V(10.2, 0.4, 26.9), V(9.5, 0.4, 26.9), V(9.6, 0.15, 25.3), V(9.2, 0.15, 25.3), 40, u),
    st: (w, u, t) => { w.hero.root.position.copy(add(HERO, -0.6, 0, -0.1)); w.hero.pose(t, { walk: 1.2, yaw: Math.PI / 2 + 1.0, point: 0.6, expr: "scared" }); w.hero.body.rotation.x = 0.5 * sm(u); } },
  /* 49 */ { env: "black", fr: "Plan subjectif vers le sol", mv: "Descente verticale", cam: (_w, u) => G(add(HERO, -0.7, 1.4, 0.2), add(HERO, -0.7, 1.0, 0.2), add(HERO, -1.6, 0, -1.2), add(HERO, -1.8, 0, -1.4), 60, u),
    st: (w, u, t) => { torchOn(w, false); looseTorch(w, add(HERO, -1.2 - u * 0.6, Math.max(0.12, 1.1 - u * u * 1.4), -0.8 - u * 0.5), u * 9, 1, t); } },
  /* 50 */ { env: "black", fr: "Contre-plongée", mv: "Zoom avant lent", cam: (_w, u) => G(V(4, 1.5, 34), V(3.5, 1.7, 30), V(0, 24, 0), V(0, 25, 0), 50, u), st: (w, u) => { darkness(w, sm(u * 3)); lightning(w, u, 0.8); } },
  /* 51 */ { env: "black", fr: "Plan d'ensemble", mv: "Zoom arrière", cam: (_w, u, t) => { const c = G(V(-20, 14, 50), V(-26, 17, 62), V(0, 8, 0), V(0, 8, 0), 52, u); const sh = u > 0.25 ? 0.35 * Math.exp(-(u - 0.25) * 4) : 0; c.P.add(V(Math.sin(t * 61) * sh, Math.sin(t * 47) * sh, 0)); return c; }, st: (w) => darkness(w, 1) },
  /* 52 */ { env: "black", fr: "Plongée", mv: "Drone : plongée progressive", cam: (_w, u) => G(V(34, 62, 66), V(28, 46, 54), add(M1, 0, 12, 0), add(M1, 0, 14, 0), 50, u), st: (w, u) => { darkness(w, 1 - sm(u * 4)); } },
  /* 53 */ { env: "black", fr: "Gros plan visage", mv: "Travelling latéral droite", cam: (w, u) => { const H = w.mon.headWorld(V(0, 0.8, 0.6)); return G(add(H, -3, -1.2, 9), add(H, 0.5, -1.2, 9), H, H, 40, u); } },
  /* 54 */ { env: "black", fr: "Plan d'ensemble en plongée", mv: "Montée verticale", cam: (_w, u) => G(V(-2, 9, -24), V(-3, 22, -32), V(2, 0, 2), V(2, 0, 4), 54, u), st: (w) => { w.props.debris.visible = true; } },
  /* 55 */ { env: "black", fr: "Contre-plongée extrême", mv: "Zoom arrière", cam: (w, u) => ({ P: add(HERO, 0.4, 0.4, 1.8), T: w.mon.headWorld(V(0, 0.8, 0.6)), fov: 40 + 34 * sm(u) }), st: (w, _u, t) => { w.hero.pose(t, { yaw: Math.PI + 0.3, expr: "scared", headPitch: -0.6 }); w.dad.pose(t, { yaw: Math.PI - 0.2, expr: "scared", headPitch: -0.6 }); } },
  /* 56 */ { env: "black", fr: "Plan moyen (main)", mv: "Travelling latéral gauche", cam: (w, u) => { const h = headOf(w.held); return G(add(h, -2.6, -0.4, 7.2), add(h, -1.2, -0.3, 6.2), add(h, 0, -0.9, 0), add(h, 0, -0.8, 0), 42, u); } },
  /* 57 */ { env: "black", fr: "Gros plan", mv: "Zoom avant", cam: (w, u) => { const h = headOf(w.held); return G(add(h, 0.3, 0.1, 2.4), add(h, 0.15, 0.05, 1.5), h, h, 38, u); } },
  /* 58 */ { env: "black", fr: "Plan épaule", mv: "Travelling latéral droite", cam: (w, u) => G(add(DAD, 0.9, 1.55, -0.9), add(DAD, 1.1, 1.55, -0.4), headOf(w.hero), headOf(w.hero), 40, u),
    st: (w, u, t) => { w.hero.pose(t, { yaw: Math.atan2(DAD.x - HERO.x, DAD.z - HERO.z) * sm(u * 2) + (Math.PI + 0.3) * (1 - sm(u * 2)), expr: "shout", talk: true }); } },
  /* 59 */ { env: "black", fr: "Très gros plan (main)", mv: "Descente verticale", cam: (_w, u) => G(add(HERO, 1.1, 1.3, 1.0), add(HERO, 1.1, 1.0, 1.0), add(HERO, 0.4, 0.95, 0), add(HERO, 0.4, 0.8, 0), 40, u),
    st: (w, u, t) => { w.dad.root.position.copy(add(HERO, 1.3, 0, -0.2)); w.dad.pose(t, { yaw: -Math.PI / 2 - 0.3, point: 0.3 + 0.2 * sm(u * 3), expr: "angry" }); w.hero.pose(t, { yaw: Math.PI / 2 - 0.3, expr: "scared" }); } },
  /* 60 */ { env: "black", fr: "Gros plan frontal", mv: "Zoom avant", cam: (w, u) => G(add(headOf(w.dad), -0.8, 0, 2.2), add(headOf(w.dad), -0.55, 0, 1.6), headOf(w.dad), headOf(w.dad), 36, u), st: (w, _u, t) => w.dad.pose(t, { yaw: -0.35, expr: "angry", talk: true }) },
  /* 61 */ { env: "black", fr: "Contre-plongée", mv: "Montée verticale", cam: (w, u) => G(add(HERO, 0.5, 0.5, 1.5), add(HERO, 0.5, 0.8, 1.5), headOf(w.hero), headOf(w.hero), 46, u), st: (w, _u, t) => w.hero.pose(t, { yaw: 0.3, expr: "sad", headPitch: -0.2 }) },
  /* 62 */ { env: "black", fr: "Plan américain de dos", mv: "Travelling latéral gauche", cam: (w, u) => { const H = w.mon.headWorld(V(0, 0, 0.6)); return G(add(DAD, 1.6, 1.5, 3.4), add(DAD, 0.6, 1.5, 3.2), add(H, 0, -15, 0), add(H, 0, -14.5, 0), 62, u); }, st: (w, _u, t) => { w.dad.pose(t, { yaw: Math.PI + 0.25, point: 1.2, expr: "angry" }); w.fill.intensity = 12; w.fill.position.copy(add(DAD, 0.8, 2.6, 2.2)); } },
  /* 63 */ { env: "black", fr: "Plan d'ensemble", mv: "Drone : orbite en recul", cam: (w, u) => { const H = w.mon.headWorld(V(0, 0.4, 0.6)), e = sm(u); return { P: L(add(H, 6, -3, 14), V(60, 70, 110), e), T: L(add(H, -1, -4, 0), V(5, 8, 5), e), fov: 44 + 8 * e }; },
    st: (w, u, t) => { if (u > 0.82) w.city.towers.forEach((tw) => void tw); winBeams(w, t, u > 0.86 && u < 0.93 ? 0.3 + 0.7 * Math.abs(Math.sin(t * 90)) : 1); } },
];

// ---------------- aides ----------------
const vis = (a: Actor[], on: boolean) => { for (const x of a) x.root.visible = on; };
const flick = (t: number) => 0.55 + 0.45 * Math.max(0, Math.sin(t * 37) * Math.sin(t * 13.3 + 1));
const guardYaw = (g: Actor) => Math.atan2(-g.root.position.x, -g.root.position.z);
export const towerLevel = (tw: Tower, k: number) => { tw.lens.emissiveIntensity = 0.3 + 8.7 * k; tw.spot.intensity = 5.5 * k; tw.spot.visible = k > 0.01; for (const b of tw.beams) { b.mesh.visible = k > 0.01; b.mat.uniforms.uOp.value = 0.3 * k; } };
const blink = (w: World, t: number, i: number) => { if (w.dad.led) (w.dad.led.material as THREE.MeshStandardMaterial).emissiveIntensity = Math.sin(t * 9) > 0 ? i : 0.4; };
const torchOn = (w: World, on: boolean) => { if (w.hero.torch) w.hero.torch.visible = on; w.heroBeam.mesh.visible = on; };
const boomPos = (w: World) => { const tw = w.city.towers[T5]; tw.root.updateMatrixWorld(true); return tw.root.localToWorld(V(0, 40, 2)); };
const boom = (w: World, k: number, t = 0) => { if (k <= 0) return; w.props.boomAt(Math.min(1.4, k), boomPos(w), t); };
const fwdOf = (a: Actor) => V(Math.sin(a.root.rotation.y), 0, Math.cos(a.root.rotation.y));
/** « sauf le monstre » : gardes, voitures, fenêtres et habitants l'inondent de lumière, projecteur blanc sur lui */
const floodMonster = (w: World, t: number) => { winBeams(w, t, 2.6); for (const b of w.gBeams) if (b.mesh.visible) b.mat.uniforms.uOp.value = 0.55;
  for (const c of w.props.cars) for (const b of c.beams) if (b.mesh.visible) b.mat.uniforms.uOp.value = 0.5;
  w.key.intensity = 14; w.key.position.set(-30, 45, 40); w.key.target.position.set(0, 14, 0); w.key.angle = 0.32; (w.mon.plate as THREE.MeshPhysicalMaterial).emissiveIntensity = 0.12; };
const winBeams = (w: World, t: number, k: number) => w.props.winBeams.forEach((b, i) => { b.mesh.visible = k > 0.01; b.set(t, (0.12 + (i % 5) * 0.02) * k); });
const lightning = (w: World, u: number, at: number) => { const on = u > at && u < at + 0.12; w.props.bolt.visible = on; const f = on ? 1 - (u - at) / 0.12 : 0;
  (w.city.sky.material as THREE.ShaderMaterial).uniforms.flash.value = f * 0.9; w.city.hemi.intensity += f * 2.5; };
const slipGuard = (w: World, t: number, k: number) => { const g = w.slip; g.root.visible = true; g.root.position.set(6.4, 0.12, 21.4); g.pose(t, { yaw: -2.6, expr: "scared", armsUp: 0.5 * k, point: k < 0.2 ? 0.8 : undefined }); g.root.rotation.x = -1.35 * k; g.root.position.y = 0.12 + 0.35 * Math.sin(k * Math.PI) ; };
const looseTorch = (w: World, p: THREE.Vector3, spin: number, on: number, t: number) => { const lt = w.props.looseTorch; lt.visible = true; lt.position.copy(p); lt.rotation.set(0.2, spin, 0); lt.updateMatrixWorld(true);
  w.props.looseBeam.mesh.visible = on > 0; w.props.looseBeam.place(lt.localToWorld(V(0, 0, 0.27)), lt.localToWorld(V(0, 0, 4)), 7); w.props.looseBeam.set(t); };
/** coupure : fenêtres, lampadaires et tours s'éteignent (k : progression) */
const blackout = (w: World, k: number) => { const f = 1 - sm(k * 1.6); for (let i = 0; i < w.city.winMats.length; i++) w.city.winMats[i].emissiveIntensity = w.winBase[i] * (hash01(i) < f ? 1 : 0.02);
  w.city.bulb.emissiveIntensity = 8 * f; for (const h of w.city.lampHalos) (h.material as THREE.MeshBasicMaterial).opacity = 0.38 * f; for (const tw of w.city.towers) towerLevel(tw, f); };
const hash01 = (i: number) => { const s = Math.sin(i * 91.7 + 3.1) * 43758.5; return s - Math.floor(s); };
/** obscurité totale autour du monstre : tous les faisceaux tombent */
const darkness = (w: World, k: number) => { const f = 1 - k; for (const b of [...w.gBeams, ...w.props.winBeams]) b.mat.uniforms.uOp.value *= f; for (const c of w.props.cars) { for (const b of c.beams) b.mat.uniforms.uOp.value *= f; c.head.emissiveIntensity *= f; }
  w.heroBeam.mat.uniforms.uOp.value *= f; for (const g of w.guards) if (g.torch) g.torch.visible = f > 0.3; w.key.intensity *= f; };
const CIV0: [number, number][] = [[-3.2, 95], [2.8, 94.2], [-1.4, 91.5], [4.4, 96.5], [-4.8, 97.5], [1.2, 90.8]];
const poseCiv = (w: World, t: number) => { w.civ.forEach((a, i) => { const ph = t - START[4] / FPS; a.root.position.set(CIV0[i][0], 0, CIV0[i][1] + ph * (0.9 + (i % 3) * 0.3)); a.pose(t, { walk: 2.2, yaw: (i - 2.5) * 0.12, headYaw: i % 2 ? 0.9 : -0.9, expr: "scared" }); }); w.pink.pose(t, { expr: "scared", headPitch: -0.04, yaw: 0.12 }); };

// ---------------- construction ----------------
export const buildCast = (root: THREE.Object3D, mon: Monster) => {
  const guards: Actor[] = [], gBeams: Beam[] = [];
  for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2 + 0.3, r = 8.2 + (i % 2) * 0.8; const g = new Actor({ ...(i % 3 === 1 ? CAST.guard2 : CAST.guard), name: `g${i}` }, 0.36, i);
    g.root.position.set(Math.cos(a) * r, 0.12, Math.sin(a) * r); g.addTorch(); root.add(g.root); guards.push(g); const b = new Beam(1.6, 0.12, 0.22, "#fff4dc"); root.add(b.mesh); gBeams.push(b); }
  const specs = ["c1", "c2", "c3", "c4", "c1", "c2"], civ: Actor[] = [], pos: [number, number][] = [[-2.2, 97], [1.8, 96.2], [-0.6, 94.5], [3.2, 98.5], [-3.6, 99.5], [0.2, 92.8]];
  specs.forEach((k, i) => { const a = new Actor({ ...CAST[k], name: k + i }, 0.36, i + 3); a.root.position.set(pos[i][0], 0, pos[i][1]); root.add(a.root); civ.push(a); });
  const pink = new Actor(CAST.pink, 0.36, 11); pink.root.position.set(0.6, 0, 100); root.add(pink.root);
  const hero = new Actor(CAST.hero, 0.36, 21), dad = new Actor(CAST.dad, 0.36, 22); hero.addTorch(); root.add(hero.root, dad.root);
  const tech = new Actor({ ...CAST.guard, name: "tech", top: "#f07a1a", topDark: "#c45a10", sleeve: "#f07a1a" }, 0.36, 31); root.add(tech.root);
  const lev = new Actor({ ...CAST.guard2, name: "lev" }, 0.36, 32); root.add(lev.root);
  const slip = new Actor({ ...CAST.guard, name: "slip" }, 0.36, 33); root.add(slip.root);
  const held = new Actor({ ...CAST.guard2, name: "held" }, 0.36, 34); mon.rHand.add(held.root); held.root.scale.setScalar(1 / 3);
  held.root.position.set(-0.12, -0.6, -0.47); held.root.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(V(0, 0, -1), V(1, 0, 0), V(0, -1, 0)));
  const heroBeam = new Beam(1.2, 0.1, 0.3, "#fff4dc"); root.add(heroBeam.mesh);
  return { guards, gBeams, civ, pink, hero, dad, tech, lev, slip, held, heroBeam };
};

/** ambiance + état par défaut du plan i */
export const applyShot = (w: World, i: number, u: number, t: number) => {
  const s = SHOTS[i], c = w.city, p = w.props, sky = c.sky.material as THREE.ShaderMaterial;
  p.reset(); vis([...w.civ, w.pink, w.hero, w.dad, w.tech, w.lev, w.slip], false); w.held.root.visible = false;
  for (let k = 0; k < c.winMats.length; k++) c.winMats[k].emissiveIntensity = w.winBase[k];
  c.bulb.emissiveIntensity = 8; for (const h of c.lampHalos) (h.material as THREE.MeshBasicMaterial).opacity = 0.38;
  sky.uniforms.flash.value = 0; w.fill.intensity = 0; w.fill.color.set("#ffb46a"); w.key.intensity = 0; c.moon.intensity = 0.35;
  for (const tw of c.towers) towerLevel(tw, 1);
  const flash = s.env === "flash"; c.installs(!flash); vis(w.guards, !flash); for (const b of w.gBeams) { b.mesh.visible = !flash; b.mat.uniforms.uOp.value = 0.22; }
  for (const g of w.guards) if (g.torch) g.torch.visible = true;
  // ambiance
  let night = 1, top = "#3f7fd8", hor = "#cfe3ff", fogC = "#1a2046", fogD = 0.0034, hemi = 0.5, hemiSky = "#5868b8", win = 1, lamps = 1, towers = 1, sun = 0, sunC = "#fff1d8";
  if (flash) { fogC = "#141a38"; fogD = 0.0042; hemi = 0.7; c.moon.intensity = 1.4; w.fill.intensity = 60; w.fill.position.set(-6, 6.5, 104); w.key.intensity = 1.6; w.key.position.set(-60, 90, 150); w.key.target.position.set(0, 4, 60); }
  if (s.env === "dawn") { const k = i === 6 ? sm(u) : 1; night = 1 - 0.85 * k; top = "#6a84cf"; hor = "#ffb49a"; fogC = mixC("#141a38", "#c9a8b8", k); fogD = 0.0042 - 0.002 * k; hemi = 0.7 + 0.6 * k; hemiSky = mixC("#5868b8", "#ffd0c0", k); win = 1 - 0.7 * k; lamps = 1 - k; sun = 2.2 * k; sunC = "#ffc49a"; towers = 0; c.installs(false); vis(w.guards, false); for (const b of w.gBeams) b.mesh.visible = false; }
  if (s.env === "day") { night = 0; top = "#3f7fd8"; hor = "#d8e8ff"; fogC = "#b8c8e0"; fogD = 0.0016; hemi = 1.1; hemiSky = "#cfe0ff"; win = 0.12; lamps = 0; towers = 0; sun = 3.4; for (const b of w.gBeams) b.mat.uniforms.uOp.value = 0.06; }
  if (s.env === "dusk") { night = i === 9 ? 0.35 + 0.65 * sm(u) : 0.45; top = "#26346e"; hor = "#ff8f62"; fogC = "#3a3058"; fogD = 0.003; hemi = 0.65; hemiSky = "#8a7ab8"; win = 1.1; sun = i === 9 ? 1.2 * (1 - u) : 1.0; sunC = "#ff9a5a"; }
  if (s.env === "black") { fogC = "#0e1230"; fogD = 0.0045; hemi = 0.32; c.moon.intensity = 0.2; }
  sky.uniforms.night.value = night; sky.uniforms.top.value.set(top); sky.uniforms.hor.value.set(hor);
  for (let k = 0; k < c.winMats.length; k++) c.winMats[k].emissiveIntensity = w.winBase[k] * win;
  c.bulb.emissiveIntensity = 8 * lamps; for (const h of c.lampHalos) (h.material as THREE.MeshBasicMaterial).opacity = 0.38 * lamps;
  if (!towers) for (const tw of c.towers) towerLevel(tw, 0);
  c.hemi.intensity = hemi; c.hemi.color.set(hemiSky); p.sun.intensity = sun; p.sun.color.set(sunC);
  if (s.env === "dawn") p.sun.position.set(-120, 30, 160);
  if (s.env === "dusk") p.sun.position.set(160, 25, 90);
  if (s.env === "day") p.sun.position.set(-100, 140, 120);
  w.scene!.fog = new THREE.FogExp2(fogC, fogD);
  // éléments selon l'avancée de l'histoire
  const lead = i >= 14, installs = i >= 10;
  if (installs && !flash) { p.gen.visible = true; p.panel.visible = true; }
  if (lead) { vis([w.hero, w.dad], true); w.hero.root.position.copy(HERO); w.dad.root.position.copy(DAD); w.hero.body.rotation.x = 0; w.hero.pose(t, { yaw: Math.PI + 0.4, point: 0.35, expr: "worried" }); w.dad.pose(t, { yaw: Math.PI + 0.2, expr: "focus" }); torchOn(w, i >= 15 && i < 48); }
  else torchOn(w, false);
  if (i >= P_BOOM + 1) towerLevel(c.towers[T5], 0); else if (i === P_BOOM) towerLevel(c.towers[T5], u < 0.13 ? 1 : 0);
  if (i >= P_POLICE + 1) p.carsAt(t, 2, true, i > P_CARDEAD || (i === P_CARDEAD && u > 0.55 && Math.sin(u * 60) < 0.5) ? 0 : -1);
  if (i >= S(31)) { p.facade.visible = true; for (const r of p.residents) r.pose(t, { point: 0.8, yaw: Math.atan2(-r.root.position.x - p.facade.position.x, -p.facade.position.z), expr: "scared" }); if (i < P_DARK) p.resBeamsAt(t, V(0, 14, 0), i > P_CLIC ? 0.5 : 0.34); }
  if (i >= S(32)) winBeams(w, t, 1);
  if (i > P_CLIC) { blackout(w, 1); for (const tw of c.towers) towerLevel(tw, 0); }
  if (i >= P_RAIN) { p.puddles.visible = true; c.slab.roughness = 0.35; } else c.slab.roughness = 0.85;
  if (i > P_SLIP) { slipGuard(w, t, 1); w.guards[0].root.visible = false; w.gBeams[0].mesh.visible = false; }
  // monstre : centre de la place, puis devant les héros
  const moved = i >= P_MOVED;
  w.mon.root.position.copy(moved ? M1 : V(0, 0, 0)); w.mon.root.rotation.y = moved ? Math.atan2(HERO.x - M1.x, HERO.z - M1.z) : 0;
  w.mon.pose(t, moved ? { lean: 0.3, headPitch: 0.25, reach: 1 } : {}); (w.mon.plate as THREE.MeshPhysicalMaterial).emissiveIntensity = 0; if (moved) w.mon.grip(HERO.clone().sub(M1)); w.held.root.visible = moved; if (moved) w.held.pose(t, { expr: "scared", wave: "both", headPitch: 0.3 });
  const tgt = moved ? add(M1, 0, 18, 2) : V(0, 19, 0);
  for (const tw of c.towers) aimTower(tw, moved ? tgt : V(0, 19, 0));
  // gardes : lampes braquées sur le monstre
  w.guards.forEach((g, k) => { if (!g.root.visible) return; g.pose(t, { point: 0.9, expr: "focus", headPitch: -0.35, yaw: moved ? Math.atan2(tgt.x - g.root.position.x, tgt.z - g.root.position.z) : guardYaw(g) }); g.root.updateMatrixWorld(true);
    w.gBeams[k].place(g.torch!.localToWorld(V(0, 0, 1.6)), add(tgt, Math.sin(k) * 2, -6 + Math.cos(k * 2) * 3, 0), 16); w.gBeams[k].set(t); });
  // lampe du héros
  if (w.heroBeam.mesh.visible) { w.hero.root.updateMatrixWorld(true); w.heroBeam.place(w.hero.torch!.localToWorld(V(0, 0, 1.6)), add(tgt, 0, -8, 0), 14); w.heroBeam.set(t); }
  // éclairage des personnages (hors des cônes des tours)
  if (lead && !flash) { w.key.intensity = s.env === "day" ? 0 : 4; w.key.position.set(16, 14, 8); w.key.target.position.set(10, 1, 25); w.key.angle = 0.45; w.fill.intensity = s.env === "day" ? 0 : 14; w.fill.position.set(12.5, 2.6, 28); }
  s.st?.(w, u, t);
  if (i >= P_RAIN - 1 && i < P_DARK) { /* éclairs lointains réguliers */ }
  return s;
};
const aimed = new WeakMap<Tower, string>();
const aimTower = (tw: Tower, tgt: THREE.Vector3) => { const k = tgt.toArray().join(); if (aimed.get(tw) === k) return; aimed.set(tw, k); tw.aim(tgt); tw.root.updateMatrixWorld(true);
  tw.heads.forEach((hd, j) => tw.beams[j].place(hd.getWorldPosition(new THREE.Vector3()), tgt)); };
const mixC = (a: string, b: string, k: number) => "#" + new THREE.Color(a).lerp(new THREE.Color(b), k).getHexString();
export const rainOn = (i: number) => i >= P_RAIN;
