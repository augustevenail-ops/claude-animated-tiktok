// « Le Nuage » : composition 4K verticale (2160 x 3840, 30 i/s). Un seul monde three.js, un décor visible par plan,
// bloom pour les lueurs, sous-titres jaunes mot à mot (style des références), voix + bruitages mixés (mix.wav).
import React, { useEffect, useMemo } from "react";
import * as THREE from "three";
import { AbsoluteFill, Audio, continueRender, delayRender, getInputProps, staticFile, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree, addAfterEffect } from "@react-three/fiber";
import { EffectComposer } from "@react-three/postprocessing";
import { BlendFunction, BloomEffect, ToneMappingEffect, ToneMappingMode, VignetteEffect, HueSaturationEffect, BrightnessContrastEffect } from "postprocessing";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { useFonts } from "../shared/overlay";
import { Town } from "./town";
import { Coupe } from "./under";
import { Sky, Cabin } from "./sky";
import { Lux } from "./lux";
import { Machine } from "./machine";
import { SHOTS, WORDS, TOTAL, FPS, shotAt, uOf, camAt, W } from "./shots";

export const BUNKER_FRAMES = TOTAL;
export const BW = 2160, BH = 3840;
type Post = { audio: boolean; shadow: boolean; smap: number; bloom: boolean };
const post = (): Post => ({ audio: true, shadow: true, smap: 4096, bloom: true, ...((getInputProps() as { post?: Partial<Post> }).post ?? {}) });
const BG: Record<string, string> = { town: "#0d0b14", coupe: "#0d0b14", sky: "#0d0b14", cabin: "#1a1f3a", lux: "#1a1410", machine: "#120e22" };

class World {
  w: W; roots: Record<string, THREE.Group>;
  constructor(shadow: boolean, smap: number) {
    this.w = { town: new Town(), coupe: new Coupe(), sky: new Sky(), cabin: new Cabin(), lux: new Lux(), machine: new Machine() };
    this.roots = Object.fromEntries(Object.entries(this.w).map(([k, v]) => [k, (v as { root: THREE.Group }).root]));
    for (const L of [this.w.town.sun, this.w.coupe.sun, this.w.sky.sun, this.w.lux.sun, this.w.machine.key]) { L.castShadow = shadow; L.shadow.mapSize.set(smap, smap); }
  }
  hideActors() { for (const a of [...Object.values(this.w.town.actors), ...this.w.town.crowd, ...Object.values(this.w.lux.actors), ...this.w.lux.extras]) a.root.visible = false; }
}

const Inner: React.FC = () => {
  const f = useCurrentFrame();
  const { camera, scene, invalidate, gl } = useThree();
  const on = useMemo(post, []);
  const world = useMemo(() => new World(on.shadow, on.smap), [on]);
  const fx = useMemo(() => {
    const bloom = new BloomEffect({ blendFunction: BlendFunction.ADD, intensity: 0.85, luminanceThreshold: 0.82, luminanceSmoothing: 0.25, mipmapBlur: true, radius: 0.7, levels: 7 });
    const mip = bloom.mipmapBlurPass, setSize = mip.setSize.bind(mip);   // flou de bloom défini à l'échelle 1920 px de haut, quelle que soit la sortie
    mip.setSize = (w: number, h: number) => setSize(Math.round((1920 * w) / Math.max(h, 1)), 1920);
    return { bloom, tone: new ToneMappingEffect({ mode: ToneMappingMode.NEUTRAL }), vig: new VignetteEffect({ offset: 0.32, darkness: 0.45 }),
      sat: new HueSaturationEffect({ saturation: 0.14 }), bc: new BrightnessContrastEffect({ contrast: 0.09, brightness: 0.01 }) };
  }, []);
  const chain = useMemo(() => (
    <EffectComposer multisampling={0}>
      {on.bloom ? <primitive object={fx.bloom} dispose={null} /> : <></>}
      <primitive object={fx.tone} dispose={null} />
      <primitive object={fx.sat} dispose={null} />
      <primitive object={fx.bc} dispose={null} />
      <primitive object={fx.vig} dispose={null} />
    </EffectComposer>
  ), [fx, on]);
  const env = useMemo(() => { const pm = new THREE.PMREMGenerator(gl); const e = pm.fromScene(new RoomEnvironment(), 0.04).texture; pm.dispose(); return e; }, [gl]);
  useEffect(() => { gl.shadowMap.type = THREE.PCFSoftShadowMap; }, [gl]);
  const i = shotAt(f), s = SHOTS[i], u = Math.min(1, Math.max(0, uOf(i, f))), t = f / FPS;
  for (const [k, r] of Object.entries(world.roots)) r.visible = k === s.set;
  world.hideActors();
  s.st(world.w, u, t);
  scene.background = new THREE.Color(BG[s.set]); scene.environment = env;
  scene.environmentIntensity = ({ town: 0.45, coupe: 0.3, sky: 0.45, cabin: 0.35, lux: 0.4, machine: 0.25 } as Record<string, number>)[s.set];
  const cam = camera as THREE.PerspectiveCamera, c = camAt(i, f);
  cam.position.copy(c.P); cam.lookAt(c.T); cam.fov = c.fov; cam.near = 0.1; cam.far = 4000; cam.updateProjectionMatrix();
  useEffect(() => {
    const h = delayRender(`frame ${f}`); let done = false;
    const finish = () => { if (!done) { done = true; continueRender(h); } };
    const unsub = addAfterEffect(() => { unsub(); finish(); return true; });
    invalidate();
    return () => { unsub(); finish(); };
  }, [f, invalidate]);
  return (<><primitive object={world.roots.town} dispose={null} /><primitive object={world.roots.coupe} dispose={null} /><primitive object={world.roots.sky} dispose={null} />
    <primitive object={world.roots.cabin} dispose={null} /><primitive object={world.roots.lux} dispose={null} /><primitive object={world.roots.machine} dispose={null} />{chain}</>);
};

// ---------------- sous-titres : un mot à la fois, jaune, contour noir épais, ombre (réf. 1-16) ----------------
const clean = (w: string) => w.replace(/[«»"“”]/g, "").replace(/…/g, "").replace(/^[:;!?]+$/, "").replace(/[.,:;!?]+$/g, "").toLowerCase();
const CAPS = WORDS.map((w, i) => ({ t: clean(w.w), s: w.s, e: Math.min(WORDS[i + 1]?.s ?? w.e + 0.5, w.e + 0.45) })).filter((x) => x.t.length > 0);
const Caption: React.FC<{ t: number }> = ({ t }) => {
  const c = CAPS.find((x) => t >= x.s - 0.02 && t < x.e);
  if (!c) return null;
  const pop = 1 + 0.12 * Math.exp(-(t - c.s) * 14);
  const size = c.t.length > 12 ? 190 : 230;
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: "67%", transform: "translateY(-50%)", textAlign: "center", padding: "0 220px" }}>
      <span style={{ display: "inline-block", transform: `scale(${pop})`, fontFamily: "'Montserrat', 'Liberation Sans', sans-serif", fontWeight: 900, fontSize: size, lineHeight: 1, letterSpacing: 1,
        color: "#F6F23C", WebkitTextStroke: "22px #0a0a0a", paintOrder: "stroke fill", textShadow: "0 14px 0 rgba(0,0,0,0.55), 0 18px 34px rgba(0,0,0,0.55)" }}>{c.t}</span>
    </div>
  );
};

export const Bunker: React.FC = () => {
  useFonts();
  const f = useCurrentFrame(), t = f / FPS, on = post();
  return (
    <AbsoluteFill style={{ background: "#0d0b14" }}>
      <ThreeCanvas width={BW} height={BH} frameloop="demand" shadows gl={{ antialias: false, stencil: false, powerPreference: "high-performance" }} camera={{ fov: 45, near: 0.1, far: 4000 }}>
        <Inner />
      </ThreeCanvas>
      <Caption t={t} />
      {on.audio ? <Audio src={staticFile("bunker/mix.wav")} /> : null}
    </AbsoluteFill>
  );
};
