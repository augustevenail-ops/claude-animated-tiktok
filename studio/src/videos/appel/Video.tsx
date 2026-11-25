// « Le Téléphone rouge » : vidéo complète, 30 i/s, 1440 x 2560. Plans courts (2 à 4 s), mouvements de caméra,
// personnages animés (respiration, bras, parole), téléphone qui vibre, sous-titres mot par mot calés sur la voix.
// Flashbacks (nuit de l'incendie, chambre, vieux pompier) : léger effet ancien.
import React, { useEffect, useMemo } from "react";
import * as THREE from "three";
import { AbsoluteFill, continueRender, delayRender, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree, addAfterEffect } from "@react-three/fiber";
import { APPEL_W, APPEL_H, SCENES, REG, REGPHONE, resetReg } from "./Appel";
import WTS from "./words.json";

export const FPS = 30;
export const VIDEO_SEC = 71.1;
export const APPEL_VIDEO_FRAMES = Math.ceil(VIDEO_SEC * FPS);

// caméra : [px, py, pz, tx, ty, tz, fov] au début (a) et à la fin (b) du plan
type Cam = [number, number, number, number, number, number, number];
type Shot = { start: number; scene: string; a: Cam; b: Cam; vib?: boolean; talk?: boolean; flash?: boolean; wave?: boolean };

const SHOTS: Shot[] = [
  { start: 0.0, scene: "family", a: [-2.6, 1.3, 4.3, 0.1, 1.1, -1.1, 46], b: [-2.2, 1.35, 3.6, 0.1, 1.1, -1.1, 44] },
  { start: 3.6, scene: "family", vib: true, a: [0.3, 1.8, 2.9, 0, 0.98, -0.4, 40], b: [0.2, 1.7, 2.6, 0, 0.98, -0.4, 38] },
  { start: 6.1, scene: "family", a: [0, 3.2, 4.8, 0, 0.9, -1.0, 50], b: [0, 3.4, 4.2, 0, 0.9, -1.0, 50] },
  { start: 9.6, scene: "cem", a: [1.5, 4.8, 8.5, 0, 0.9, -2.2, 44], b: [1.2, 3.6, 7.0, 0, 1.1, -2.2, 44] },
  { start: 12.3, scene: "cem", a: [-0.3, 1.0, 1.8, -0.3, 1.2, -1.0, 40], b: [-0.3, 1.1, 1.5, -0.3, 1.2, -1.0, 40] },
  { start: 13.4, scene: "bedCalm", a: [1.4, 1.5, 3.4, 0.2, 1.1, -1.2, 50], b: [1.0, 1.5, 2.8, 0.2, 1.1, -1.2, 48] },
  { start: 16.0, scene: "bedCalm", a: [0, 0.5, 1.2, 0.2, 1.6, -0.6, 50], b: [0, 0.5, 1.4, 0.2, 1.6, -0.6, 46] },
  { start: 20.7, scene: "bedCalm", talk: true, a: [1.6, 1.5, 3.4, 0.2, 1.3, -0.6, 42], b: [1.5, 1.5, 3.2, 0.2, 1.3, -0.6, 40] },
  { start: 24.5, scene: "fire", flash: true, a: [0.6, 2.2, 10.5, -0.6, 2.8, -0.8, 50], b: [0.3, 2.4, 9.5, -0.6, 2.8, -0.8, 50] },
  { start: 27.7, scene: "fire", flash: true, a: [0.6, 0.9, 7.8, -0.6, 3.2, -1.0, 52], b: [0.8, 0.9, 7.2, -0.6, 3.2, -1.0, 54] },
  { start: 30.7, scene: "fire", flash: true, wave: true, a: [2.5, 1.4, 6.0, 3.0, 1.4, 2.0, 46], b: [2.0, 1.4, 5.0, 3.0, 1.4, 2.0, 46] },
  { start: 33.1, scene: "family", a: [-2.6, 1.3, 4.3, 0.1, 1.1, -1.1, 46], b: [-2.8, 1.4, 4.6, 0.1, 1.1, -1.1, 46] },
  { start: 36.3, scene: "family", a: [0, 1.9, 3.2, 0, 0.98, -0.4, 40], b: [0, 1.8, 3.0, 0, 0.98, -0.4, 40] },
  { start: 38.5, scene: "family", a: [1.4, 1.7, 3.6, 0, 0.98, -0.4, 42], b: [1.2, 1.7, 3.3, 0, 0.98, -0.4, 42] },
  { start: 42.5, scene: "family", a: [-2.2, 1.2, 3.8, -0.6, 1.2, -1.8, 44], b: [-2.0, 1.2, 3.6, -0.6, 1.2, -1.8, 44] },
  { start: 44.2, scene: "door", a: [-1.6, 1.6, 4.8, -0.4, 1.3, -0.6, 46], b: [-1.2, 1.6, 4.2, -0.4, 1.3, -0.6, 46] },
  { start: 49.3, scene: "door", flash: true, a: [-2.6, 1.6, 2.6, 0.3, 1.3, -1.0, 48], b: [-2.2, 1.6, 3.0, 0.3, 1.3, -1.0, 48] },
  { start: 50.0, scene: "door", flash: true, talk: true, a: [0.2, 1.6, 4.2, 0.85, 1.3, -1.1, 42], b: [0.2, 1.6, 4.0, 0.85, 1.3, -1.1, 42] },
  { start: 60.0, scene: "bed", flash: true, a: [1.4, 1.5, 3.4, 0.2, 1.1, -1.2, 50], b: [1.4, 1.5, 3.0, 0.2, 1.1, -1.2, 50] },
  { start: 63.6, scene: "fire", flash: true, a: [0.6, 2.2, 10.5, -0.6, 2.8, -0.8, 50], b: [0.4, 2.3, 10.0, -0.6, 2.8, -0.8, 50] },
  { start: 65.7, scene: "family", flash: true, a: [0.8, 1.7, 3.2, 0, 0.98, -0.4, 40], b: [0.7, 1.7, 3.0, 0, 0.98, -0.4, 40] },
  { start: 68.7, scene: "door", flash: true, a: [-1.2, 1.6, 3.6, -0.4, 1.3, -0.6, 44], b: [-1.0, 1.6, 3.2, -0.4, 1.3, -0.6, 44] },
  { start: 70.6, scene: "family", a: [0, 1.9, 3.2, 0, 0.98, -0.4, 40], b: [0, 1.9, 3.2, 0, 0.98, -0.4, 40] },
];

// facteur de recul appliqué à chaque caméra (1 = réglage précédent, plus serré)
const ZOOM_OUT = 1.9;

const shotIndex = (t: number) => { let k = 0; for (let i = 0; i < SHOTS.length; i++) if (SHOTS[i].start <= t) k = i; return k; };
const shotEnd = (k: number) => (k + 1 < SHOTS.length ? SHOTS[k + 1].start : VIDEO_SEC);
const ease = (u: number) => { const x = Math.min(1, Math.max(0, u)); return x * x * (3 - 2 * x); };

const GRAIN = "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")";
const SUB_FONT = "Fredoka, Nunito, 'Varela Round', 'Arial Rounded MT Bold', Arial, sans-serif";

const VideoInner: React.FC<{ t: number }> = ({ t }) => {
  const f = useCurrentFrame();
  const { camera, scene: three, invalidate, gl } = useThree();
  const k = shotIndex(t), sh = SHOTS[k];
  const u = (t - sh.start) / (shotEnd(k) - sh.start);
  // décor, acteurs et téléphone : reconstruits seulement quand le décor change
  const built = useMemo(() => {
    resetReg();
    const b = SCENES[sh.scene]();
    return { b, actors: [...REG], phone: REGPHONE };
  }, [sh.scene]);
  gl.shadowMap.type = THREE.PCFSoftShadowMap;
  const b = built.b;
  three.background = new THREE.Color(b.bg);
  three.fog = b.fog;
  three.environmentIntensity = 0.2;
  const e = ease(u);
  const c = sh.a.map((v, i) => v + (sh.b[i] - v) * e);
  // recul de caméra : tous les plans sont plus larges, sujets dans la zone centrale (marges TikTok)
  const zo = ZOOM_OUT;
  const px = c[3] + (c[0] - c[3]) * zo, py = c[4] + (c[1] - c[4]) * zo, pz = c[5] + (c[2] - c[5]) * zo;
  const cm = camera as THREE.PerspectiveCamera;
  cm.position.set(px, py, pz); cm.lookAt(c[3], c[4], c[5]); cm.fov = c[6]; cm.near = 0.05; cm.far = 200; cm.updateProjectionMatrix();
  // animation des personnages : respiration, bras levés (plans marqués), parole du vieux pompier
  for (const r of built.actors) {
    const w = sh.wave && (r.name === "guard" || r.name === "guard2") ? "both" : undefined;
    r.a.pose(t, { expr: r.expr, talk: !!sh.talk && r.name === "c3", wave: w });
  }
  // téléphone : vibration rapide pendant les plans marqués
  if (built.phone) {
    built.phone.rotation.z = sh.vib ? Math.sin(t * 2 * Math.PI * 11) * 0.012 : 0;
    built.phone.position.x = sh.vib ? Math.sin(t * 2 * Math.PI * 17) * 0.004 : 0;
  }
  useEffect(() => {
    const h = delayRender(`frame ${f}`); let done = false;
    const finish = () => { if (!done) { done = true; continueRender(h); } };
    const unsub = addAfterEffect(() => { unsub(); finish(); return true; });
    invalidate();
    return () => { unsub(); finish(); };
  }, [f, invalidate]);
  return <primitive object={b.root} dispose={null} />;
};

// sous-titre : mot par mot, minuscules, jaune #F5FF3B, contour noir arrondi, dézoom 130 % -> 100 % sur 0,2 s
const Caption: React.FC<{ t: number }> = ({ t }) => {
  let idx = -1;
  for (let i = 0; i < WTS.length; i++) if (WTS[i].s <= t) idx = i;
  if (idx < 0 || t > WTS[idx].e + 0.25) return null;
  const word = WTS[idx].w.replace(/[.,;:!?«»]/g, "").toLowerCase();
  const dt = t - WTS[idx].s;
  const s = dt < 0.2 ? 1.3 - 0.3 * (1 - Math.pow(1 - dt / 0.2, 3)) : 1;
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 1715, transform: `translateY(-50%) scale(${s})`, transformOrigin: "50% 50%" }}>
      <svg width={APPEL_W} height={260} viewBox={`0 0 ${APPEL_W} 260`} style={{ overflow: "visible", display: "block" }}>
        <text x="50%" y="190" textAnchor="middle" fontFamily={SUB_FONT} fontWeight={900} fontSize={170} letterSpacing="-4"
          fill="#F5FF3B" stroke="#000000" strokeWidth={28} strokeLinejoin="round" strokeLinecap="round" paintOrder="stroke fill">{word}</text>
      </svg>
    </div>
  );
};

export const AppelVideo: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const sh = SHOTS[shotIndex(t)];
  return (
    <AbsoluteFill style={{ background: "#05060c" }}>
      <AbsoluteFill style={sh.flash ? { filter: "sepia(0.22) saturate(0.8) contrast(1.05) brightness(0.97)" } : {}}>
        <ThreeCanvas width={APPEL_W} height={APPEL_H} frameloop="demand" shadows gl={{ antialias: true, stencil: false, powerPreference: "high-performance" }} camera={{ fov: 45, near: 0.05, far: 200 }}>
          <VideoInner t={t} />
        </ThreeCanvas>
      </AbsoluteFill>
      {sh.flash && <>
        <AbsoluteFill style={{ backgroundImage: GRAIN, opacity: 0.1, mixBlendMode: "overlay" }} />
        <AbsoluteFill style={{ background: "#c89a5a", opacity: 0.07, mixBlendMode: "multiply" }} />
        <AbsoluteFill style={{ background: "radial-gradient(ellipse at center, rgba(0,0,0,0) 55%, rgba(30,18,6,0.5) 100%)" }} />
      </>}
      <Caption t={t} />
    </AbsoluteFill>
  );
};
