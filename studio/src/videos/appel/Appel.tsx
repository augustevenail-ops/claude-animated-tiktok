// « Le Téléphone rouge » : 5 images de contrôle du style (kit « Le Monstre »).
// Style : personnages cubiques (Actor de monstre/chars.ts), lumière de nuit bleu/violet, projecteur froid,
// accent chaud de lampe, téléphone rouge. Sous-titre jaune #FFE900, un mot à la fois, contour noir.
// Format still : 1440 x 2560 (2K vertical).
import React, { useEffect, useMemo } from "react";
import * as THREE from "three";
import { AbsoluteFill, continueRender, delayRender, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree, addAfterEffect } from "@react-three/fiber";
import { Actor, CAST, Expr, Spec } from "../monstre/chars";

export const APPEL_W = 1440, APPEL_H = 2560;
const WORDS = ["Dans", "monde", "meurt", "appel", "seul"];

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const box = (w: number, h: number, d: number, c: string, x: number, y: number, z: number, rough = 0.8) => {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshStandardMaterial({ color: c, roughness: rough }));
  m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; return m;
};
const person = (s: Spec, top: string, x: number, z: number, yaw: number, expr: Expr, seed: number, kid = false) => {
  const a = new Actor({ ...s, top, topDark: top, sleeve: top, pants: "#15151c", shoes: "#0c0c10", kid: kid || s.kid }, 0.36, seed);
  a.root.position.set(x, 0, z); a.pose(0, { yaw, expr }); return a;
};

const DARK = "#17171f";
const PHONE_Y = 0.94;

// Construit la scène d'une image. Retourne la racine, la caméra et le fond.
const build = (scene: number) => {
  const root = new THREE.Group();
  const cemetery = scene === 3;
  root.add(new THREE.HemisphereLight("#5868b8", "#1a1622", 0.9));
  const moon = new THREE.SpotLight("#9fb2ff", cemetery ? 60 : 45, 0, 0.5, 0.6, 1.5);
  moon.position.set(-4, 9, 5); moon.target.position.set(0, 0.5, -1.5); moon.castShadow = true; moon.shadow.mapSize.set(2048, 2048);
  const violet = new THREE.PointLight("#8a7cff", 9, 14, 1.4); violet.position.set(2.5, 2.4, 3.2);
  const lamp = new THREE.PointLight("#ffb46a", 4, 9, 1.6); lamp.position.set(1.4, 2.6, 0.6);
  const phoneGlow = new THREE.PointLight("#ff2a3a", 0.6, 3, 2); phoneGlow.position.set(0, 1.3, -0.2);
  root.add(moon, moon.target, violet, lamp, phoneGlow);
  let bg = "#0b0e20", fog: THREE.Scene["fog"] = null;

  const phone = (x: number, z: number) => {
    const g = new THREE.Group(); g.position.set(x, PHONE_Y + 0.11, z); g.scale.setScalar(1.8);
    g.add(box(0.5, 0.12, 0.4, "#c4283a", 0, 0, 0, 0.35));
    const h = box(0.62, 0.07, 0.12, "#d42c3e", 0, 0.1, 0, 0.3); g.add(h); g.userData.handset = h;
    g.add(box(0.08, 0.2, 0.2, "#1b1b22", 0.26, 0.04, 0, 0.6));
    root.add(g); return g;
  };

  if (cemetery) {
    bg = "#080b18"; fog = new THREE.FogExp2("#0c1222", 0.05);
    const ground = box(60, 0.1, 60, "#1e2a24", 0, -0.05, -4, 1); root.add(ground);
    const stones: [number, number, number][] = [[-3.6, -4.5, 0.2], [-1.6, -6.2, -0.1], [1.2, -5.0, 0.15], [3.5, -4.2, -0.2], [-4.8, -7.4, 0.1], [2.4, -8.2, -0.12], [0.2, -9.5, 0]];
    for (const [x, z, r] of stones) { const st = box(0.9, 1.3, 0.22, "#6e7280", x, 0.65, z, 0.9); st.rotation.y = r; root.add(st); root.add(box(0.94, 0.08, 0.26, "#585c68", x, 0.04, z, 0.9)); }
    // famille en deuil, debout, face à la caméra
    const mourn = "#1a1a24";
    const dad = person(CAST.hero, "#2a2d38", -0.85, -0.5, 0, "worried", 41, true);
    const mom = person(CAST.pink, mourn, 0.7, -0.5, 0, "sad", 42);
    const gma = person({ ...CAST.c2, hair: "bun", hairCol: "#d8d8d8" }, mourn, 0, -1.3, 0, "sad", 43);
    root.add(dad.root, mom.root, gma.root);
    moon.target.position.set(0, 1.0, -1.0);
    return { root, bg, fog, cam: { P: V(0.1, 1.45, 7.2), T: V(0, 1.05, -1.0), fov: 44 } };
  }

  // intérieur de nuit : sol, mur du fond, table basse
  root.add(box(12, 0.1, 12, "#2a2630", 0, -0.05, -2, 0.9));
  root.add(box(12, 6, 0.2, "#1d1f33", 0, 3, -5, 0.95));
  root.add(box(0.2, 6, 12, "#191b2e", -4.5, 3, -2, 0.95));
  root.add(box(1.7, 0.1, 0.9, "#3b2e2a", 0, 0.9, -0.4, 0.7));
  for (const [x, z] of [[-0.75, -0.8], [0.75, -0.8], [-0.75, 0], [0.75, 0]] as const) root.add(box(0.08, 0.86, 0.08, "#2a211e", x, 0.43, z));

  if (scene === 1) {
    phone(0, -0.4);
    root.add(person(CAST.hero, "#f2b51c", -0.7, -1.7, 0, "scared", 51, true).root);
    root.add(person(CAST.pink, "#6b5a86", 0.65, -1.7, 0, "worried", 52).root);
    root.add(person({ ...CAST.c2, hair: "bun", hairCol: "#d8d8d8" }, "#4a4f5e", 0, -2.5, 0, "sad", 53).root);
    return { root, bg, fog, cam: { P: V(0, 1.7, 3.6), T: V(0, 1.15, -1.1), fov: 48 } };
  }
  if (scene === 2) {
    const p = phone(0, -0.4); p.rotation.y = 0.04;
    return { root, bg, fog, cam: { P: V(0.0, 1.9, 2.8), T: V(0, PHONE_Y - 0.1, -0.4), fov: 42 } };
  }
  if (scene === 4) {
    const p = phone(0, -0.4); p.rotation.y = 0.04;
    return { root, bg, fog, cam: { P: V(0.5, 1.6, 2.0), T: V(0, PHONE_Y + 0.02, -0.4), fov: 40 } };
  }
  // scène 5 : Lucas seul, face caméra, téléphone rouge en arrière-plan
  phone(0.7, -2.8);
  root.add(person(CAST.hero, "#f2b51c", -0.1, -1.4, 0, "scared", 61, true).root);
  return { root, bg, fog, cam: { P: V(0, 1.15, 1.4), T: V(0, 0.95, -1.4), fov: 40 } };
};

const Inner: React.FC<{ scene: number }> = ({ scene }) => {
  const f = useCurrentFrame();
  const { camera, scene: three, invalidate, gl } = useThree();
  const built = useMemo(() => build(scene), [scene]);
  gl.shadowMap.type = THREE.PCFSoftShadowMap;
  three.background = new THREE.Color(built.bg);
  three.fog = built.fog;
  three.environmentIntensity = 0.2;
  const cm = camera as THREE.PerspectiveCamera;
  cm.position.copy(built.cam.P); cm.lookAt(built.cam.T); cm.fov = built.cam.fov; cm.near = 0.05; cm.far = 200; cm.updateProjectionMatrix();
  useEffect(() => {
    const h = delayRender(`frame ${f}`); let done = false;
    const finish = () => { if (!done) { done = true; continueRender(h); } };
    const unsub = addAfterEffect(() => { unsub(); finish(); return true; });
    invalidate();
    return () => { unsub(); finish(); };
  }, [f, invalidate]);
  return <primitive object={built.root} dispose={null} />;
};

export const AppelStill: React.FC<{ scene: number }> = ({ scene }) => (
  <AbsoluteFill style={{ background: "#05060c" }}>
    <ThreeCanvas width={APPEL_W} height={APPEL_H} frameloop="demand" shadows gl={{ antialias: true, stencil: false, powerPreference: "high-performance" }} camera={{ fov: 45, near: 0.05, far: 200 }}>
      <Inner scene={scene} />
    </ThreeCanvas>
    <div style={{
      position: "absolute", left: 0, right: 0, top: 1715, transform: "translateY(-50%)", textAlign: "center",
      fontFamily: "Montserrat, 'Arial Black', Arial, sans-serif", fontWeight: 900, fontSize: 150, lineHeight: 1,
      color: "#FFE900", WebkitTextStroke: "16px #0A0A0A", paintOrder: "stroke fill", textShadow: "0 8px 0 #0A0A0A", textTransform: "uppercase",
    }}>{WORDS[scene - 1]}</div>
  </AbsoluteFill>
);
