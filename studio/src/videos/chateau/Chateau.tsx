// « Notre Château » ép. 1 : composition verticale 1080 x 1920 (agrandie en 2K au montage). Même chaîne d'image que la série
// (PBR, ombres douces, bloom, AgX, SMAA, aberration légère, vignette) ; étalonnage par plan ; compteur d'habitants en surimpression.
import React, { useEffect, useMemo } from "react";
import * as THREE from "three";
import { AbsoluteFill, continueRender, delayRender, getInputProps, staticFile, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree, addAfterEffect } from "@react-three/fiber";
import { EffectComposer } from "@react-three/postprocessing";
import { BlendFunction, BloomEffect, ToneMappingEffect, ToneMappingMode, VignetteEffect, HueSaturationEffect, BrightnessContrastEffect, SMAAEffect, SMAAPreset, ChromaticAberrationEffect } from "postprocessing";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { TOTAL, FPS, shotAt, uOf, buildWorld, applyShot, gradeOf, counterAt } from "./story";

export const CH_FRAMES = TOTAL;
export const CHW = 1080, CHH = 1920;

const Inner: React.FC = () => {
  const f = useCurrentFrame();
  const { camera, scene, invalidate, gl } = useThree();
  const { w, root } = useMemo(buildWorld, []);
  const fx = useMemo(() => {
    const bloom = new BloomEffect({ blendFunction: BlendFunction.ADD, intensity: 1.1, luminanceThreshold: 0.82, luminanceSmoothing: 0.3, mipmapBlur: true, radius: 0.75, levels: 8 });
    const mip = bloom.mipmapBlurPass, setSize = mip.setSize.bind(mip);
    mip.setSize = (ww: number, h: number) => setSize(Math.round((1920 * ww) / Math.max(h, 1)), 1920);
    return { bloom, tone: new ToneMappingEffect({ mode: ToneMappingMode.AGX }), sat: new HueSaturationEffect({ saturation: 0.15 }),
      bc: new BrightnessContrastEffect({ contrast: 0.1, brightness: 0.0 }), ca: new ChromaticAberrationEffect({ offset: new THREE.Vector2(0.0006, 0.0004), radialModulation: true, modulationOffset: 0.35 }),
      smaa: new SMAAEffect({ preset: SMAAPreset.ULTRA }), vig: new VignetteEffect({ offset: 0.28, darkness: 0.62 }) };
  }, []);
  const chain = useMemo(() => (
    <EffectComposer multisampling={0}>
      <primitive object={fx.bloom} dispose={null} />
      <primitive object={fx.tone} dispose={null} />
      <primitive object={fx.sat} dispose={null} />
      <primitive object={fx.bc} dispose={null} />
      <primitive object={fx.smaa} dispose={null} />
      <primitive object={fx.ca} dispose={null} />
      <primitive object={fx.vig} dispose={null} />
    </EffectComposer>
  ), [fx]);
  const env = useMemo(() => { const pm = new THREE.PMREMGenerator(gl); const e = pm.fromScene(new RoomEnvironment(), 0.04).texture; pm.dispose(); return e; }, [gl]);
  useEffect(() => { gl.shadowMap.type = THREE.PCFSoftShadowMap; }, [gl]);
  const i = shotAt(f), u = uOf(i, f), t = f / FPS, g = gradeOf(i);
  w.scene = scene;
  scene.background = new THREE.Color(g.bg); scene.environment = env; scene.environmentIntensity = g.env;
  scene.fog = g.fogD > 0 ? new THREE.FogExp2(g.fog, g.fogD) : null;
  fx.sat.saturation = g.sat; fx.bc.contrast = g.con; fx.bc.brightness = g.bri; fx.bloom.intensity = g.bloom;
  const cam = camera as THREE.PerspectiveCamera;
  const s = applyShot(w, i, u, t, f);
  const c = s.cam(w, u, t);
  cam.position.copy(c.P); cam.lookAt(c.T); cam.fov = c.fov; cam.near = 0.3; cam.far = 4000; cam.updateProjectionMatrix(); cam.updateMatrixWorld(true);
  // les panneaux (contours dorés, étincelles) suivent la caméra : second passage avec la caméra placée
  const dbg = (getInputProps() as { dbg?: number[] }).dbg; if (dbg) { cam.position.set(dbg[0], dbg[1], dbg[2]); cam.lookAt(dbg[3], dbg[4], dbg[5]); cam.updateMatrixWorld(true); }
  useEffect(() => {
    const h = delayRender(`frame ${f}`); let done = false;
    const finish = () => { if (!done) { done = true; continueRender(h); } };
    const unsub = addAfterEffect(() => { unsub(); finish(); return true; });
    invalidate();
    return () => { unsub(); finish(); };
  }, [f, invalidate]);
  return (<><primitive object={root} dispose={null} />{chain}</>);
};

const Counter: React.FC = () => {
  const f = useCurrentFrame(), c = counterAt(f); if (!c) return null;
  const n = Math.round(c.n).toLocaleString("fr-FR").replace(/\u202f|\u00a0/g, " ");
  return (<div style={{ position: "absolute", top: 250, width: "100%", display: "flex", flexDirection: "column", alignItems: "center", opacity: c.op, transform: `scale(${0.9 + 0.1 * c.op})` }}>
    <div style={{ fontFamily: "Montserrat", fontWeight: 900, fontSize: 112, color: "#fff", letterSpacing: 2, textShadow: "0 6px 0 rgba(0,0,0,0.55), 0 0 30px rgba(0,0,0,0.5)" }}>{n}{c.goal ? <span style={{ color: "#ffc860" }}> / {c.goal.toLocaleString("fr-FR").replace(/\u202f|\u00a0/g, " ")}</span> : null}</div>
    <div style={{ fontFamily: "Montserrat", fontWeight: 800, fontSize: 44, color: "#ffe6b0", letterSpacing: 6, marginTop: -6, textShadow: "0 4px 0 rgba(0,0,0,0.55)" }}>HABITANTS</div>
    {c.goal ? <div style={{ marginTop: 18, width: 640, height: 26, borderRadius: 13, background: "rgba(0,0,0,0.45)", border: "3px solid rgba(255,255,255,0.85)", overflow: "hidden" }}>
      <div style={{ width: `${(c.n / c.goal) * 100}%`, height: "100%", background: "linear-gradient(90deg,#ffb030,#ffd870)" }} /></div> : null}
  </div>);
};

export const Chateau: React.FC = () => (
  <AbsoluteFill style={{ background: "#05060a" }}>
    <style>{`@font-face{font-family:Montserrat;font-weight:900;src:url(${staticFile("fonts/montserrat-latin-900-normal.woff2")})}@font-face{font-family:Montserrat;font-weight:800;src:url(${staticFile("fonts/montserrat-latin-800-normal.woff2")})}`}</style>
    <ThreeCanvas width={CHW} height={CHH} frameloop="demand" shadows gl={{ antialias: false, stencil: false, powerPreference: "high-performance" }} camera={{ fov: 45, near: 0.3, far: 4000 }}>
      <Inner />
    </ThreeCanvas>
    <Counter />
  </AbsoluteFill>
);
