// L'Arène, épisode 1 : monde 3D (world.ts) + chaîne de post du style bridge, allégée pour un rendu CPU
// (pas de MSAA, flou en une passe), + sous-titres blancs (docs/REFERENCE_APOKALYPS.md §9), badge, étiquettes A/B, voix.
import React, { useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { AbsoluteFill, Audio, continueRender, delayRender, getInputProps, staticFile, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree, addAfterEffect } from "@react-three/fiber";
import { EffectComposer } from "@react-three/postprocessing";
import { BlendFunction, BloomEffect, ToneMappingEffect, ToneMappingMode } from "postprocessing";
import { InkPass, noInkFallback } from "../bridge/ink";
import { LensBlurEffect } from "../bridge/lensblur";
import { GradeEffect } from "../bridge/grade";
import { Kit } from "../bridge/build";
import { World, loadKit } from "./world";
import { TOTAL, FPS, shotAt, dofAt, AT, oldFrame } from "./story";
import { GRADE_DAWN } from "./look";
import WORDS from "./words.json";

export const ARENE_FRAMES = TOTAL;
type Post = { ink: boolean; lens: boolean; bloom: boolean; grade: boolean; audio: boolean; shadow: boolean; smap: number; dpr?: number; prof?: boolean; lensTaps: number; lensNear: number };
const post = (): Post => ({ ink: true, lens: true, bloom: true, grade: true, audio: true, shadow: true, smap: 2048, lensTaps: 64, lensNear: 32, ...((getInputProps() as { post?: Partial<Post> }).post ?? {}) });

const makeBloom = () => {
  const b = new BloomEffect({ blendFunction: BlendFunction.ADD, intensity: 0.6, luminanceThreshold: 1.0, luminanceSmoothing: 0.2, mipmapBlur: true, levels: 5, radius: 0.6 });
  const mip = b.mipmapBlurPass, setSize = mip.setSize.bind(mip);
  mip.setSize = (w: number, h: number) => setSize(Math.round((1920 * w) / Math.max(h, 1)), 1920);
  return b;
};
const fwd = new THREE.Vector3(), fpt = new THREE.Vector3();

const Inner: React.FC<{ kit: Kit }> = ({ kit }) => {
  const f = useCurrentFrame();
  const { camera, scene, gl, invalidate } = useThree();
  const on = useMemo(post, []);
  (globalThis as { __prof?: boolean }).__prof = !!on.prof;
  (globalThis as { __noPaint?: boolean }).__noPaint = !!(on as { noPaint?: boolean }).noPaint;
  const world = useMemo(() => { const t0 = performance.now(); const w = new World(kit); if (on.prof) console.warn(`[prof] world build ${(performance.now() - t0).toFixed(0)} ms`); w.sun.castShadow = on.shadow; w.sun.shadow.mapSize.set(on.smap, on.smap); return w; }, [kit, on]);
  const fx = useMemo(() => ({
    ink: new InkPass(scene, camera as THREE.PerspectiveCamera),
    // flou de profondeur : seule la passe principale ; nombre d'échantillons réglable (lensTaps / lensNear)
    lens: new LensBlurEffect({ maxCoC: 22, nearScale: 1.2, stage: { taps: on.lensTaps, spread: 0.958, nearTaps: on.lensNear, rot: 0 } }),
    bloom: makeBloom(),
    tone: new ToneMappingEffect({ mode: ToneMappingMode.NEUTRAL }),
    grade: (() => { const g = new GradeEffect(GRADE_DAWN, 1); return g; })(),
  }), [camera, scene, on]);
  useEffect(() => () => fx.ink.dispose(), [fx]);
  const chain = useMemo(() => (
    <EffectComposer multisampling={0}>
      {on.ink ? <primitive object={fx.ink} dispose={null} /> : <></>}
      {on.lens ? <primitive object={fx.lens} dispose={null} /> : <></>}
      {on.bloom ? <primitive object={fx.bloom} dispose={null} /> : <></>}
      <primitive object={fx.tone} dispose={null} />
      {on.grade ? <primitive object={fx.grade} dispose={null} /> : <></>}
    </EffectComposer>
  ), [fx, on]);
  useMemo(() => { // profilage : temps GPU (logiciel) de chaque gl.render, forcé par gl.finish()
    if (!on.prof) return;
    const ctx = gl.getContext(), orig = gl.render.bind(gl); let n = 0, acc = 0, last = performance.now();
    gl.render = (sc: THREE.Object3D, c: THREE.Camera) => { const t0 = performance.now(); orig(sc, c); ctx.finish(); const dt = performance.now() - t0; acc += dt; n++;
      const rt = gl.getRenderTarget(); console.warn(`[prof] render#${n} ${rt ? rt.width + "x" + rt.height : "screen"} ${dt.toFixed(0)} ms (sum ${acc.toFixed(0)}, since frame start ${(performance.now() - last).toFixed(0)})`); };
  }, [gl, on]);
  const cam = camera as THREE.PerspectiveCamera;
  const fo = oldFrame(f);
  const id = shotAt(fo).id;
  const tU = performance.now();
  const target = world.update(id, fo, cam, scene);
  if (on.prof) console.warn(`[prof] frame ${f} world.update ${(performance.now() - tU).toFixed(0)} ms`);
  noInkFallback(world.root);
  const d = dofAt(fo);
  cam.getWorldDirection(fwd);
  if (d.focus) fpt.set(...d.focus); else fpt.copy(target);
  fx.lens.focus = Math.max(0.3, fpt.sub(cam.position).dot(fwd));
  fx.lens.cInf = d.cInf;
  // rendu à la demande : une seule passe complète par image Remotion, capture après la fin du rendu
  useEffect(() => {
    const h = delayRender(`frame ${f}`);
    let done = false;
    const finish = () => { if (!done) { done = true; continueRender(h); } };
    const unsub = addAfterEffect(() => { unsub(); finish(); return true; });
    invalidate();
    return () => { unsub(); finish(); };
  }, [f, invalidate]);
  return (<><primitive object={world.root} dispose={null} />{chain}</>);
};

// ---------------- sous-titres : 1-3 mots, MAJUSCULES, blanc, contour noir, ~46 px à 1920, centre à 73 % ----------------
type W = { w: string; s: number; e: number; q?: number };
const clean = (w: string) => w.replace(/[«»"“”]/g, "").replace(/\.\.\.|…/g, "").replace(/[.,:;!?]+$/g, "").toUpperCase();
const GROUPS: { s: number; e: number; text: string }[] = (() => {
  const out: { s: number; e: number; text: string }[] = [];
  let cur: W[] = [];
  const flush = () => { if (cur.length) out.push({ s: cur[0].s, e: cur[cur.length - 1].e, text: cur.map((x) => clean(x.w)).join(" ") }); cur = []; };
  for (const w of WORDS as W[]) {
    if (w.q) flush();
    cur.push(w);
    const len = cur.map((x) => clean(x.w)).join(" ").length;
    if (/[.,:;!?…»]$|\.\.\.$/.test(w.w) || cur.length >= 3 || len > 14) flush();
  }
  flush();
  for (let i = 0; i < out.length - 1; i++) out[i].e = out[i + 1].s; // remplacement sec, pas de trou
  return out;
})();
const Captions: React.FC<{ t: number }> = ({ t }) => {
  const g = GROUPS.find((x) => t >= x.s - 0.03 && t < x.e);
  if (!g) return null;
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: "73%", transform: "translateY(-50%)", textAlign: "center", padding: "0 90px" }}>
      <span style={{ fontFamily: "'Liberation Sans', 'DejaVu Sans', Arial, sans-serif", fontWeight: 900, fontSize: 56, letterSpacing: 0.5, color: "#ffffff",
        WebkitTextStroke: "8px #000", paintOrder: "stroke fill", textShadow: "0 3px 6px rgba(0,0,0,0.55)" }}>{g.text}</span>
    </div>
  );
};
const Badge: React.FC = () => (
  <div style={{ position: "absolute", left: 54, top: 190, padding: "8px 16px", borderRadius: 10, background: "rgba(10,10,14,0.78)",
    fontFamily: "'Liberation Sans', 'DejaVu Sans', sans-serif", fontWeight: 900, fontSize: 26, color: "#ff4a3d", letterSpacing: 2 }}>ARÈNE · JOUR 1</div>
);
const Choice: React.FC<{ t: number }> = ({ t }) => {
  if (t < AT.choice) return null;
  const k = Math.min(1, (t - AT.choice) / 0.25);
  const pill = (txt: string, col: string, x: number, y: number) => (
    <div style={{ position: "absolute", left: x, top: y, transform: `scale(${0.8 + 0.2 * k})`, opacity: k, padding: "10px 20px", borderRadius: 12,
      background: "rgba(10,10,14,0.82)", border: `4px solid ${col}`, fontFamily: "'Liberation Sans', 'DejaVu Sans', sans-serif", fontWeight: 900, fontSize: 34, color: "#fff" }}>{txt}</div>
  );
  return <>{pill("A · MONOLITHE", "#ff4a3d", 330, 560)}{pill("B · FORÊT", "#7ee08a", 60, 780)}</>;
};

const useKit = () => {
  const [kit, setKit] = useState<Kit | null>(null);
  const [handle] = useState(() => delayRender("arene kit"));
  useEffect(() => { loadKit().then((k) => { setKit(k); continueRender(handle); }); }, [handle]);
  return kit;
};

export const AreneEp1: React.FC = () => {
  const f = useCurrentFrame(), t = f / FPS;
  const kit = useKit();
  const on = post();
  if (!kit) return null;
  return (
    <AbsoluteFill style={{ background: "#0d1320" }}>
      <ThreeCanvas width={1080} height={1920} frameloop="demand" {...(on.dpr ? { dpr: on.dpr } : {})} shadows gl={{ antialias: false, stencil: false, powerPreference: "high-performance" }} camera={{ fov: 44, near: 0.1, far: 2000 }}>
        <Inner kit={kit} />
      </ThreeCanvas>
      <Badge />
      <Choice t={oldFrame(f) / FPS} />
      <Captions t={t} />
      {on.audio ? <Audio src={staticFile("arene/mix.wav")} /> : null}
    </AbsoluteFill>
  );
};
