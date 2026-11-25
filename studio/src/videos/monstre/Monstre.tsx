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
import { Actor, CAST } from "./chars";
import { Monster } from "./monster";
import { SHOTS, TOTAL, FPS, shotAt, uOf, World, makeGuards, poseGuards, makeCivilians, poseCivilians } from "./shots";

export const MONSTRE_FRAMES = TOTAL;
export const MW = 2160, MH = 3840;
type Post = { shadow: boolean; smap: number };
const post = (): Post => ({ shadow: true, smap: 2048, ...((getInputProps() as { post?: Partial<Post> }).post ?? {}) });

const build = (on: Post): { w: World; root: THREE.Group } => {
  const root = new THREE.Group(), city = new City(), mon = new Monster(); root.add(city.root, mon.root);
  for (const t of city.towers) { t.spot.castShadow = on.shadow; t.spot.shadow.mapSize.set(on.smap, on.smap); }
  const { guards, beams } = makeGuards(root), { civ, pink } = makeCivilians(root);
  const hero = new Actor(CAST.hero, 0.36, 21), dad = new Actor(CAST.dad, 0.36, 22); hero.addTorch(); hero.root.position.set(8.55, 0.12, 19.9); dad.root.position.set(9.75, 0.12, 19.3); root.add(hero.root, dad.root);
  // lumière d'appoint du flashback (réverbère proche du groupe) et lune portant les ombres
  const fill = new THREE.PointLight("#ffb46a", 0, 30, 1.6); fill.position.set(-6, 6.5, 104); root.add(fill);
  const key = new THREE.SpotLight("#9fb2ff", 0, 400, 0.35, 0.6, 0); key.position.set(-60, 90, 150); key.target.position.set(0, 4, 60); root.add(key, key.target);
  key.castShadow = on.shadow; key.shadow.mapSize.set(on.smap, on.smap); key.shadow.camera.near = 50; key.shadow.camera.far = 300; key.shadow.bias = -0.0003;
  return { w: { city, mon, guards, gBeams: beams, civ, pink, hero, dad, fill, key }, root };
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
  const i = shotAt(f), s = SHOTS[i], u = Math.min(1, Math.max(0, uOf(f))), t = f / FPS;
  // ambiance
  const flash = s.mood === "flash";
  w.city.installs(!flash); for (const g of w.guards) g.root.visible = !flash; for (const b of w.gBeams) b.mesh.visible = !flash;
  for (const a of [...w.civ, w.pink]) a.root.visible = flash; w.hero.root.visible = w.dad.root.visible = false; w.key.angle = 0.35; w.key.position.set(-60, 90, 150); w.key.target.position.set(0, 4, 60);
  w.fill.intensity = flash ? 60 : 0; w.key.intensity = flash ? 1.6 : 0.0; w.city.moon.intensity = flash ? 1.4 : 0.35;
  for (const tw of w.city.towers) { tw.lens.emissiveIntensity = 9; tw.spot.intensity = 5.5; for (const b of tw.beams) b.set(t, 0.3); }
  w.city.hemi.intensity = flash ? 0.7 : 0.5;
  w.mon.pose(t, {});
  if (!flash) poseGuards(w, t); else poseCivilians(w, t);
  s.st?.(w, u, t);
  scene.fog = new THREE.FogExp2(flash ? "#141a38" : "#1a2046", flash ? 0.0042 : 0.0034);
  scene.background = new THREE.Color("#0b0e20"); scene.environment = env; scene.environmentIntensity = 0.22;
  const cam = camera as THREE.PerspectiveCamera, c = s.cam(w, u);
  cam.position.copy(c.P); cam.lookAt(c.T); cam.fov = c.fov; cam.near = 0.1; cam.far = 3000; cam.updateProjectionMatrix();
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
