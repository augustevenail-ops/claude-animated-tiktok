// « L'appel » : la tour, la cour, le couloir, l'appartement (world.ts) + chaîne de post du style bridge + sous-titres blancs,
// étiquettes A/B finales. Temps calés sur la voix réelle.
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

import { World } from "./world";
import { TOTAL, FPS, WORDS, shotAt, dofAt, CHOICE_AT, TITLE_AT, camAt, CY, RED_TIMES } from "./story";
import { Captions, captionGroups, Hud, ChoiceCards, TitleCard, useFonts } from "../shared/overlay";
const GROUPS = captionGroups(WORDS);
import { GRADE_NIGHT } from "./look";

export const APPEL_FRAMES = TOTAL;
type Post = { ink: boolean; lens: boolean; bloom: boolean; grade: boolean; audio: boolean; shadow: boolean; smap: number; dpr?: number; lensTaps: number; lensNear: number };
const post = (): Post => ({ ink: true, lens: false, bloom: true, grade: true, audio: true, shadow: true, smap: 2048, lensTaps: 32, lensNear: 16, ...((getInputProps() as { post?: Partial<Post> }).post ?? {}) });
const makeBloom = () => {
  const b = new BloomEffect({ blendFunction: BlendFunction.ADD, intensity: 0.7, luminanceThreshold: 0.9, luminanceSmoothing: 0.2, mipmapBlur: true, levels: 5, radius: 0.6 });
  const mip = b.mipmapBlurPass, setSize = mip.setSize.bind(mip);
  mip.setSize = (w: number, h: number) => setSize(Math.round((1920 * w) / Math.max(h, 1)), 1920);
  return b;
};
const fwd = new THREE.Vector3(), fpt = new THREE.Vector3();

const Inner: React.FC = () => {
  const f = useCurrentFrame();
  const { camera, scene, invalidate } = useThree();
  const on = useMemo(post, []);
  const world = useMemo(() => { const w = new World(); w.sun.castShadow = on.shadow; w.sun.shadow.mapSize.set(on.smap, on.smap); return w; }, [on]);
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

const GRAIN = "data:image/svg+xml;utf8," + encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' width='260' height='260'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 .5 0 0 0 0 .5 0 0 0 0 .5 0 0 0 1.4 -0.2'/></filter><rect width='100%' height='100%' filter='url(#n)'/></svg>");

const redsAt = (t: number) => RED_TIMES.filter((x) => x < t).length;
const placeOf = (f: number) => { const y = camAt(shotAt(f).id, f).pos[1]; return y < CY - 1.5 ? { place: `SOUS-SOL -${Math.min(12, Math.max(1, Math.ceil((CY - y) / 3)))}`, of: undefined } : { place: "ÉTAGE 24", of: "75" }; };
export const AppelEp1: React.FC = () => {
  useFonts();
  const f = useCurrentFrame(), t = f / FPS;
  const on = post();
  return (
    <AbsoluteFill style={{ background: "#04050a" }}>
      <ThreeCanvas width={1080} height={1920} frameloop="demand" {...(on.dpr ? { dpr: on.dpr } : {})} shadows gl={{ antialias: false, stencil: false, powerPreference: "high-performance" }} camera={{ fov: 44, near: 0.05, far: 400 }}>
        <Inner />
      </ThreeCanvas>
      <div style={{ position: "absolute", inset: 0, mixBlendMode: "overlay", opacity: 0.13, backgroundImage: `url("${GRAIN}")`, backgroundSize: "260px 260px", backgroundPosition: `${(f * 53) % 260}px ${(f * 97) % 260}px` }} />
      {t < TITLE_AT ? <Hud episode={1} {...placeOf(f)} label="SILENCES CE SOIR" count={redsAt(t)} alert={redsAt(t) > 0} /> : null}
      {t < TITLE_AT ? <ChoiceCards t={t} at={CHOICE_AT} a="IMITER SA VOIX" b="TE TAIRE" /> : null}
      {t < CHOICE_AT ? <Captions t={t} groups={GROUPS} /> : null}
      <TitleCard t={t} at={TITLE_AT} title="L'APPEL" episode={1} />
      {on.audio ? <Audio src={staticFile("appel/mix.wav")} /> : null}
    </AbsoluteFill>
  );
};
