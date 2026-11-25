// « Le Monstre » ép. 1 : composition 4K verticale (2160 x 3840, 30 i/s). Rendu 3D stylisé « jeu vidéo cinématique » :
// matériaux PBR (cartes de relief / rugosité), projecteurs à ombres douces, faisceaux volumétriques, brume, ciel étoilé,
// bloom maîtrisé, SMAA, légère aberration chromatique, grain fin, étalonnage bleu / bleu-violet.
import React, { useEffect, useMemo } from "react";
import * as THREE from "three";
import { AbsoluteFill, continueRender, delayRender, getInputProps, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree, addAfterEffect } from "@react-three/fiber";
import { EffectComposer } from "@react-three/postprocessing";
import { BlendFunction, BloomEffect, ToneMappingEffect, ToneMappingMode, VignetteEffect, HueSaturationEffect, BrightnessContrastEffect, SMAAEffect, SMAAPreset, ChromaticAberrationEffect, NoiseEffect } from "postprocessing";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { City } from "./city";
import { Monster } from "./monster";
import { TOTAL, FPS, shotAt, uOf, World, buildCast, applyShot, rainOn } from "./story";
import { Props, skyMaterial } from "./props";

export const MONSTRE_FRAMES = TOTAL;
export const MW = 2160, MH = 3840;
type Post = { shadow: boolean; smap: number };
const post = (): Post => ({ shadow: true, smap: 2048, ...((getInputProps() as { post?: Partial<Post> }).post ?? {}) });

const build = (on: Post): { w: World; root: THREE.Group } => {
  const root = new THREE.Group(), city = new City(), mon = new Monster(), props = new Props(); root.add(city.root, mon.root, props.root);
  city.sky.material = skyMaterial();
  for (const t of city.towers) { t.spot.castShadow = on.shadow; t.spot.shadow.mapSize.set(on.smap, on.smap); }
  props.sun.castShadow = on.shadow;
  const cast = buildCast(root, mon);
  const fill = new THREE.PointLight("#ffb46a", 0, 30, 1.6); root.add(fill);
  const key = new THREE.SpotLight("#9fb2ff", 0, 400, 0.35, 0.6, 0); root.add(key, key.target);
  key.castShadow = on.shadow; key.shadow.mapSize.set(on.smap, on.smap); key.shadow.camera.near = 2; key.shadow.camera.far = 300; key.shadow.bias = -0.0003;
  return { w: { city, mon, props, ...cast, fill, key, winBase: city.winMats.map((m) => m.emissiveIntensity) }, root };
};

const Inner: React.FC = () => {
  const f = useCurrentFrame();
  const { camera, scene, invalidate, gl } = useThree();
  const on = useMemo(post, []);
  const { w, root } = useMemo(() => build(on), [on]);
  const fx = useMemo(() => {
    const bloom = new BloomEffect({ blendFunction: BlendFunction.ADD, intensity: 1.15, luminanceThreshold: 0.95, luminanceSmoothing: 0.2, mipmapBlur: true, radius: 0.72, levels: 8 });
    const mip = bloom.mipmapBlurPass, setSize = mip.setSize.bind(mip);
    mip.setSize = (ww: number, h: number) => setSize(Math.round((1920 * ww) / Math.max(h, 1)), 1920);
    const noise = new NoiseEffect({ blendFunction: BlendFunction.SOFT_LIGHT, premultiply: false }); noise.blendMode.opacity.value = 0.18;
    return { bloom, tone: new ToneMappingEffect({ mode: ToneMappingMode.AGX }), sat: new HueSaturationEffect({ saturation: 0.2 }),
      bc: new BrightnessContrastEffect({ contrast: 0.12, brightness: 0.0 }), ca: new ChromaticAberrationEffect({ offset: new THREE.Vector2(0.0007, 0.0004), radialModulation: true, modulationOffset: 0.35 }),
      smaa: new SMAAEffect({ preset: SMAAPreset.ULTRA }), noise, vig: new VignetteEffect({ offset: 0.3, darkness: 0.55 }) };
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
  const i = shotAt(f), u = uOf(i, f), t = f / FPS;
  w.scene = scene;
  scene.background = new THREE.Color("#0b0e20"); scene.environment = env; scene.environmentIntensity = 0.22;
  const s = applyShot(w, i, u, t);
  const cam = camera as THREE.PerspectiveCamera, c = s.cam(w, u, t);
  const dbg = (getInputProps() as { dbg?: number[] }).dbg; // contrôle : caméra autour de la tête du garde tenu
  if (dbg) { w.held.root.updateMatrixWorld(true); const h = w.held.neck.localToWorld(new THREE.Vector3(0, 0.7, 0)); c.T = h; c.P = h.clone().add(new THREE.Vector3(dbg[0], dbg[1], dbg[2])); c.fov = 40; }
  cam.position.copy(c.P); cam.lookAt(c.T); cam.fov = c.fov; cam.near = 0.1; cam.far = 3000; cam.updateProjectionMatrix();
  if (rainOn(i)) w.props.rainAt(t, c.P, c.T.clone().sub(c.P));
  useEffect(() => {
    const h = delayRender(`frame ${f}`); let done = false;
    const finish = () => { if (!done) { done = true; continueRender(h); } };
    const unsub = addAfterEffect(() => { unsub(); finish(); return true; });
    invalidate();
    return () => { unsub(); finish(); };
  }, [f, invalidate]);
  return (<><primitive object={root} dispose={null} />{chain}</>);
};

export const Monstre: React.FC = () => (
  <AbsoluteFill style={{ background: "#05060c" }}>
    <ThreeCanvas width={MW} height={MH} frameloop="demand" shadows gl={{ antialias: false, stencil: false, powerPreference: "high-performance" }} camera={{ fov: 45, near: 0.1, far: 3000 }}>
      <Inner />
    </ThreeCanvas>
  </AbsoluteFill>
);
