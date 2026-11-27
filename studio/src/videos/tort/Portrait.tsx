// « Tu as tort » : planche de contrôle d'un personnage (face / trois-quarts) sur fond uni, pour comparer à l'image de référence.
import React, { useEffect, useMemo } from "react";
import * as THREE from "three";
import { AbsoluteFill, continueRender, delayRender, getInputProps } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree, addAfterEffect } from "@react-three/fiber";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { Actor, CAST, Expr } from "./chars";

const Inner: React.FC = () => {
  const { camera, scene, gl, invalidate } = useThree();
  const p = getInputProps() as { who?: string; expr?: Expr; yaw?: number; full?: number };
  const a = useMemo(() => new Actor(CAST[p.who ?? "joel"], 0.36, 1), [p.who]);
  const env = useMemo(() => { const pm = new THREE.PMREMGenerator(gl); const e = pm.fromScene(new RoomEnvironment(), 0.04).texture; pm.dispose(); return e; }, [gl]);
  const lights = useMemo(() => { const g = new THREE.Group(); const d = new THREE.DirectionalLight("#fff4e8", 2.6); d.position.set(2, 4, 5); g.add(d, new THREE.HemisphereLight("#ffffff", "#c8a060", 1.2)); return g; }, []);
  scene.background = new THREE.Color("#ffe000"); scene.environment = env; scene.environmentIntensity = 0.5; gl.toneMapping = THREE.ACESFilmicToneMapping;
  a.pose(0.3, { expr: p.expr ?? "neutral", yaw: p.yaw ?? 0, headYaw: 0 });
  const c = camera as THREE.PerspectiveCamera, full = p.full ?? 0;
  c.position.set(0, full ? 1.1 : 1.55, full ? 6 : 3.2); c.lookAt(0, full ? 1.0 : 1.45, 0); c.fov = 30; c.updateProjectionMatrix();
  useEffect(() => { const h = delayRender("p"); const u = addAfterEffect(() => { u(); continueRender(h); return true; }); invalidate(); }, [invalidate]);
  return (<><primitive object={a.root} /><primitive object={lights} /></>);
};
export const Portrait: React.FC = () => (
  <AbsoluteFill><ThreeCanvas width={1080} height={1080} frameloop="demand" gl={{ antialias: true }} camera={{ fov: 30 }}><Inner /></ThreeCanvas></AbsoluteFill>
);
