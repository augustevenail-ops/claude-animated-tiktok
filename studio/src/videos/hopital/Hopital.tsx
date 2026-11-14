// « L'hôpital » ép. 1 : monde (world.ts) + chaîne de post du style bridge/Mur + HUD « INFECTÉS », tags en pilules, sous-titres karaoké,
// cartes A/B (vert « COULOIR NOIR » / rouge « LUMIÈRE »), carton final sur la façade de nuit.
import React, { useEffect, useMemo } from "react";
import * as THREE from "three";
import { AbsoluteFill, Audio, continueRender, delayRender, getInputProps, staticFile, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree, addAfterEffect } from "@react-three/fiber";
import { EffectComposer } from "@react-three/postprocessing";
import { BlendFunction, BloomEffect, ToneMappingEffect, ToneMappingMode } from "postprocessing";
import { InkPass, noInkFallback } from "../bridge/ink";
import { GradeEffect } from "../bridge/grade";
import { World } from "./world";
import { TOTAL, FPS, WORDS, shotAt, LIGHT, NAME, TITLE_AT, CARD_A, CARD_B, TAGS, hudCount } from "./story";
import { Captions, captionGroups, useFonts, KARAOKE, FLIP_AFTER } from "../shared/overlay";
import { GRADES } from "./look";
const GROUPS = captionGroups(WORDS);
export const HOPITAL_FRAMES = TOTAL;
const MONT = "'Montserrat', 'Liberation Sans', sans-serif", BEBAS = "'Bebas Neue', 'Liberation Sans Narrow', sans-serif";
type Post = { ink: boolean; bloom: boolean; grade: boolean; audio: boolean; shadow: boolean; smap: number };
const post = (): Post => ({ ink: true, bloom: true, grade: true, audio: false, shadow: true, smap: 2048, ...((getInputProps() as { post?: Partial<Post> }).post ?? {}) });
const makeBloom = () => {
  const b = new BloomEffect({ blendFunction: BlendFunction.ADD, intensity: 0.85, luminanceThreshold: 0.82, luminanceSmoothing: 0.2, mipmapBlur: true, levels: 5, radius: 0.65 });
  const mip = b.mipmapBlurPass, setSize = mip.setSize.bind(mip);
  mip.setSize = (w: number, h: number) => setSize(Math.round((1920 * w) / Math.max(h, 1)), 1920);
  return b;
};

const Inner: React.FC = () => {
  const f = useCurrentFrame();
  const { camera, scene, invalidate } = useThree();
  const on = useMemo(post, []);
  const world = useMemo(() => { const w = new World(); w.sun.castShadow = on.shadow; w.sun.shadow.mapSize.set(on.smap, on.smap); return w; }, [on]);
  const fx = useMemo(() => ({ ink: new InkPass(scene, camera as THREE.PerspectiveCamera), bloom: makeBloom(), tone: new ToneMappingEffect({ mode: ToneMappingMode.NEUTRAL }), grade: new GradeEffect(GRADES[0], 1) }), [camera, scene]);
  useEffect(() => () => fx.ink.dispose(), [fx]);
  const chain = useMemo(() => (
    <EffectComposer multisampling={0}>
      {on.ink ? <primitive object={fx.ink} dispose={null} /> : <></>}
      {on.bloom ? <primitive object={fx.bloom} dispose={null} /> : <></>}
      <primitive object={fx.tone} dispose={null} />
      {on.grade ? <primitive object={fx.grade} dispose={null} /> : <></>}
    </EffectComposer>
  ), [fx, on]);
  const i = shotAt(f).i;
  world.update(i, f, camera as THREE.PerspectiveCamera, scene);
  noInkFallback(world.root);
  fx.grade.set(GRADES[LIGHT[i]]);
  useEffect(() => {
    const h = delayRender(`frame ${f}`); let done = false;
    const finish = () => { if (!done) { done = true; continueRender(h); } };
    const unsub = addAfterEffect(() => { unsub(); finish(); return true; });
    invalidate();
    return () => { unsub(); finish(); };
  }, [f, invalidate]);
  return (<><primitive object={world.root} dispose={null} />{chain}</>);
};

const GRAIN = "data:image/svg+xml;utf8," + encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' width='260' height='260'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 .5 0 0 0 0 .5 0 0 0 0 .5 0 0 0 1.4 -0.2'/></filter><rect width='100%' height='100%' filter='url(#n)'/></svg>");

/** HUD discret en haut : compteur d'infectés */
const HudInf: React.FC<{ t: number }> = ({ t }) => {
  const n = hudCount(t), alert = t > 7.5;
  return (<div style={{ position: "absolute", right: 110, top: 150, textAlign: "right", textShadow: "0 3px 8px rgba(0,0,0,0.75)" }}>
    <div style={{ fontFamily: MONT, fontWeight: 800, fontSize: 25, letterSpacing: 3.5, color: alert ? "#ffb0a6" : "#dfe6f2" }}>● INFECTÉS</div>
    <div style={{ fontFamily: BEBAS, fontSize: 104, lineHeight: 0.95, marginTop: 2, color: alert ? "#ff5a48" : "#ffffff" }}>{n}</div>
  </div>);
};
/** tag en pilule : coins très arrondis, fond sombre, contour fin, texte court en majuscules ; apparition sobre, fondu de sortie */
const Tag: React.FC<{ t: number; text: string; a: number; b: number; col: string; x: number; y: number }> = ({ t, text, a, b, col, x, y }) => {
  if (t < a || t > b) return null;
  const kin = Math.min(1, (t - a) / 0.18), kout = Math.min(1, (b - t) / 0.3), k = Math.min(kin, kout);
  return (<div style={{ position: "absolute", left: `${x}%`, top: `${y}%`, transform: `translate(-50%, -50%) translateY(${(1 - kin) * 10}px) scale(${0.94 + 0.06 * kin})`, opacity: k,
    padding: "10px 26px", borderRadius: 999, background: "rgba(10,12,18,0.78)", border: `2px solid ${col}`, boxShadow: `0 0 18px ${col}55`,
    fontFamily: MONT, fontWeight: 900, fontSize: 30, letterSpacing: 3, color: "#fff", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 12 }}>
    <span style={{ width: 12, height: 12, borderRadius: 6, background: col, boxShadow: `0 0 10px ${col}` }} />{text}</div>);
};
const Card: React.FC<{ tag: string; text: string; top: string; bot: string; edge: string; glow: string; x: number; k: number }> = ({ tag, text, top, bot, edge, glow, x, k }) => (
  <div style={{ position: "absolute", left: x, top: 455, width: 410, height: 290, borderRadius: 26, background: `linear-gradient(180deg, ${top} 0%, ${bot} 100%)`,
    border: `5px solid ${edge}`, boxShadow: `0 0 34px ${glow}, inset 0 2px 0 rgba(255,255,255,0.25)`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
    transform: `scale(${0.85 + 0.15 * k})`, opacity: k }}>
    <div style={{ fontFamily: MONT, fontWeight: 800, fontSize: 30, letterSpacing: 6, color: "rgba(255,255,255,0.8)", marginBottom: 6 }}>{tag}</div>
    <div style={{ fontFamily: MONT, fontWeight: 900, fontSize: 60, lineHeight: 1.06, color: "#fff", textAlign: "center", padding: "0 14px", textShadow: "0 4px 10px rgba(0,0,0,0.45)" }}>{text}</div>
  </div>);
const Title: React.FC<{ t: number }> = ({ t }) => {
  if (t < TITLE_AT) return null;
  const k = Math.min(1, (t - TITLE_AT) / 0.3), fl = t - TITLE_AT - FLIP_AFTER - 0.4, onF = fl >= 0, pop = onF ? 1 + 0.18 * Math.exp(-fl * 9) : 1;
  return (<div style={{ position: "absolute", inset: 0, opacity: k, background: "linear-gradient(180deg, rgba(3,5,11,0.35) 0%, rgba(3,5,11,0.15) 40%, rgba(3,5,11,0.6) 100%)" }}>
    <div style={{ position: "absolute", left: 0, right: 0, top: 760, textAlign: "center", fontFamily: BEBAS, fontSize: 230, lineHeight: 1, color: "#ece6da", letterSpacing: 2, textShadow: "0 8px 0 rgba(0,0,0,0.35), 0 12px 30px rgba(0,0,0,0.7)" }}>L'HÔPITAL</div>
    <div style={{ position: "absolute", left: 0, right: 0, top: 1010, textAlign: "center", fontFamily: MONT, fontWeight: 800, fontSize: 52, letterSpacing: 16, color: onF ? "#ff4a3d" : "#b9bdd8", transform: `scale(${pop})`,
      textShadow: onF ? "0 0 24px rgba(255,74,61,0.55)" : "0 3px 10px rgba(0,0,0,0.7)" }}>ÉPISODE {onF ? 2 : 1}</div>
  </div>);
};

export const HopitalEp1: React.FC = () => {
  useFonts();
  const f = useCurrentFrame(), t = f / FPS, i = shotAt(f).i, on = post();
  const ka = Math.max(0, Math.min(1, (t - CARD_A) / 0.25)), kb = Math.max(0, Math.min(1, (t - CARD_B) / 0.25));
  return (
    <AbsoluteFill style={{ background: "#04050a" }}>
      <ThreeCanvas width={1080} height={1920} frameloop="demand" shadows gl={{ antialias: false, stencil: false, powerPreference: "high-performance" }} camera={{ fov: 44, near: 0.02, far: 1200 }}>
        <Inner />
      </ThreeCanvas>
      <div style={{ position: "absolute", inset: 0, mixBlendMode: "overlay", opacity: 0.12, backgroundImage: `url("${GRAIN}")`, backgroundSize: "260px 260px", backgroundPosition: `${(f * 53) % 260}px ${(f * 97) % 260}px` }} />
      {t < TITLE_AT ? <HudInf t={t} /> : null}
      {TAGS.filter((g) => g[0] === NAME[i]).map((g) => <Tag key={g[1] + g[2]} t={t} text={g[1]} a={g[2]} b={g[3]} col={g[4]} x={g[5]} y={g[6]} />)}
      {t < TITLE_AT && t >= CARD_A ? <><Card tag="A" text="COULOIR NOIR" top="#2f8a5e" bot="#15422d" edge="#9af5bd" glow="rgba(120,255,170,0.55)" x={120} k={ka} />
        {t >= CARD_B ? <Card tag="B" text="LUMIÈRE" top="#9a3030" bot="#4a1414" edge="#ff9a8a" glow="rgba(255,90,70,0.5)" x={550} k={kb} /> : null}</> : null}
      {t < TITLE_AT ? <Captions t={t} groups={GROUPS} karaoke={KARAOKE} /> : null}
      <Title t={t} />
      {on.audio ? <Audio src={staticFile("hopital/mix.wav")} /> : null}
    </AbsoluteFill>
  );
};
