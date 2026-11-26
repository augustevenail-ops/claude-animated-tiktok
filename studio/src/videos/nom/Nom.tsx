// « Le Nom qui rapporte » ép. 1 : composition verticale rendue en 1080 x 1920 (agrandie en 2K au montage, rendu ~2x plus rapide). Même chaîne d'image que Le Monstre
// (PBR, ombres douces, bloom, AgX, SMAA, aberration légère, vignette) ; étalonnage par plan (ville vive, autre monde laiteux).
import React, { useEffect, useMemo } from "react";
import * as THREE from "three";
import { AbsoluteFill, continueRender, delayRender, getInputProps, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree, addAfterEffect } from "@react-three/fiber";
import { EffectComposer } from "@react-three/postprocessing";
import { BlendFunction, BloomEffect, ToneMappingEffect, ToneMappingMode, VignetteEffect, HueSaturationEffect, BrightnessContrastEffect, SMAAEffect, SMAAPreset, ChromaticAberrationEffect } from "postprocessing";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { Sets } from "./sets";
import { TOTAL, FPS, shotAt, uOf, World, buildCast, applyShot, gradeOf } from "./story";

export const NM_FRAMES = TOTAL;
export const NMW = 1080, NMH = 1920;

const build = () => {
  const root = new THREE.Group(), sets = new Sets(); root.add(sets.root);
  const { actors } = buildCast(root);
  const fill = new THREE.PointLight("#ffc890", 0, 8, 1.6); root.add(fill);
  const key = new THREE.SpotLight("#ffd0a0", 0, 30, 0.5, 0.6, 1.2); root.add(key, key.target);
  const w: World = { sets, actors, fill, key };
  return { w, root };
};

const Inner: React.FC = () => {
  const f = useCurrentFrame();
  const { camera, scene, invalidate, gl } = useThree();
  const { w, root } = useMemo(build, []);
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
  const s = applyShot(w, i, u, t, cam);
  const c = s.cam(w, u, t);
  cam.position.copy(c.P); cam.lookAt(c.T); cam.fov = c.fov; cam.near = 0.03; cam.far = 600; cam.updateProjectionMatrix(); cam.updateMatrixWorld(true);
  // les panneaux (contours dorés, étincelles) suivent la caméra : second passage avec la caméra placée
  applyShot(w, i, u, t, cam);
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

export const Nom: React.FC = () => (
  <AbsoluteFill style={{ background: "#05060a" }}>
    <ThreeCanvas width={NMW} height={NMH} frameloop="demand" shadows gl={{ antialias: false, stencil: false, powerPreference: "high-performance" }} camera={{ fov: 45, near: 0.03, far: 600 }}>
      <Inner />
    </ThreeCanvas>
  </AbsoluteFill>
);
