// « Ne le regarde pas » : salon de nuit (world.ts) + chaîne de post du style bridge (allégée, flou léger) + sous-titres blancs,
// étiquettes A/B finales. Temps ESTIMÉS (words.json provisoire) jusqu'à la génération de la voix.
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
import { TOTAL, FPS, SHOTS, WORDS, shotAt, dofAt } from "./story";
import { GRADE_NIGHT } from "./look";

export const DROITE_FRAMES = TOTAL;
type Post = { ink: boolean; lens: boolean; bloom: boolean; grade: boolean; audio: boolean; shadow: boolean; smap: number; dpr?: number; lensTaps: number; lensNear: number };
const post = (): Post => ({ ink: true, lens: true, bloom: true, grade: true, audio: true, shadow: true, smap: 2048, lensTaps: 32, lensNear: 16, ...((getInputProps() as { post?: Partial<Post> }).post ?? {}) });
const makeBloom = () => {
  const b = new BloomEffect({ blendFunction: BlendFunction.ADD, intensity: 0.7, luminanceThreshold: 0.9, luminanceSmoothing: 0.2, mipmapBlur: true, levels: 5, radius: 0.6 });
  const mip = b.mipmapBlurPass, setSize = mip.setSize.bind(mip);
  mip.setSize = (w: number, h: number) => setSize(Math.round((1920 * w) / Math.max(h, 1)), 1920);
  return b;
};
const fwd = new THREE.Vector3(), fpt = new THREE.Vector3();

const Inner: React.FC<{ kit: Kit }> = ({ kit }) => {
  const f = useCurrentFrame();
  const { camera, scene, invalidate } = useThree();
  const on = useMemo(post, []);
  const world = useMemo(() => { const w = new World(kit); w.sun.castShadow = on.shadow; w.sun.shadow.mapSize.set(on.smap, on.smap); return w; }, [kit, on]);
  const fx = useMemo(() => ({
    ink: new InkPass(scene, camera as THREE.PerspectiveCamera),
    lens: new LensBlurEffect({ maxCoC: 22, nearScale: 1.2, stage: { taps: on.lensTaps, spread: 0.958, nearTaps: on.lensNear, rot: 0 } }),
    bloom: makeBloom(), tone: new ToneMappingEffect({ mode: ToneMappingMode.NEUTRAL }), grade: new GradeEffect(GRADE_NIGHT, 1),
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
  const cam = camera as THREE.PerspectiveCamera;
  const id = shotAt(f).id;
  const target = world.update(id, f, cam, scene);
  noInkFallback(world.root);
  const d = dofAt(id, f);
  cam.getWorldDirection(fwd);
  if (d.focus) fpt.set(...d.focus); else fpt.copy(target);
  fx.lens.focus = Math.max(0.3, fpt.sub(cam.position).dot(fwd));
  fx.lens.cInf = d.cInf;
  useEffect(() => { // rendu à la demande : une seule passe complète par image
    const h = delayRender(`frame ${f}`); let done = false;
    const finish = () => { if (!done) { done = true; continueRender(h); } };
    const unsub = addAfterEffect(() => { unsub(); finish(); return true; });
    invalidate();
    return () => { unsub(); finish(); };
  }, [f, invalidate]);
  return (<><primitive object={world.root} dispose={null} />{chain}</>);
};

// ---------------- sous-titres : 1-3 mots, MAJUSCULES, tout en blanc, contour noir, 56 px, centre à 73 % ----------------
type W = { w: string; s: number; e: number; q?: number };
const clean = (w: string) => w.replace(/[«»"“”]/g, "").replace(/\.\.\.|…/g, "").replace(/[.,:;!?]+$/g, "").toUpperCase();
const GROUPS: { s: number; e: number; text: string }[] = (() => {
  const out: { s: number; e: number; text: string }[] = []; let cur: W[] = [];
  const flush = () => { if (cur.length) out.push({ s: cur[0].s, e: cur[cur.length - 1].e, text: cur.map((x) => clean(x.w)).join(" ") }); cur = []; };
  for (const w of WORDS as W[]) {
    if (w.q) flush();
    cur.push(w);
    const len = cur.map((x) => clean(x.w)).join(" ").length;
    if (/[.,:;!?…»]$|\.\.\.$/.test(w.w) || cur.length >= 3 || len > 14) flush();
  }
  flush();
  for (let i = 0; i < out.length - 1; i++) out[i].e = out[i + 1].s;
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
const CHOICE_AT = SHOTS[33].a / FPS + 1.0;
const Choice: React.FC<{ t: number }> = ({ t }) => {
  if (t < CHOICE_AT) return null;
  const k = Math.min(1, (t - CHOICE_AT) / 0.25);
  const pill = (txt: string, col: string, x: number, y: number) => (
    <div style={{ position: "absolute", left: x, top: y, transform: `scale(${0.8 + 0.2 * k})`, opacity: k, padding: "10px 20px", borderRadius: 12, background: "rgba(10,10,14,0.82)",
      border: `4px solid ${col}`, fontFamily: "'Liberation Sans', 'DejaVu Sans', sans-serif", fontWeight: 900, fontSize: 32, color: "#fff" }}>{txt}</div>
  );
  return <>{pill("A · LE REGARDER", "#ff4a3d", 70, 330)}{pill("B · COURIR VERS LA PORTE", "#7ee08a", 70, 440)}</>;
};

const useKit = () => {
  const [kit, setKit] = useState<Kit | null>(null);
  const [handle] = useState(() => delayRender("droite kit"));
  useEffect(() => { loadKit().then((k) => { setKit(k); continueRender(handle); }); }, [handle]);
  return kit;
};

export const DroiteEp1: React.FC = () => {
  const f = useCurrentFrame(), t = f / FPS;
  const kit = useKit(); const on = post();
  if (!kit) return null;
  return (
    <AbsoluteFill style={{ background: "#04050a" }}>
      <ThreeCanvas width={1080} height={1920} frameloop="demand" {...(on.dpr ? { dpr: on.dpr } : {})} shadows gl={{ antialias: false, stencil: false, powerPreference: "high-performance" }} camera={{ fov: 44, near: 0.05, far: 200 }}>
        <Inner kit={kit} />
      </ThreeCanvas>
      <Choice t={t} />
      <Captions t={t} />
      {on.audio ? <Audio src={staticFile("droite/mix.wav")} /> : null}
    </AbsoluteFill>
  );
};
