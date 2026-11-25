// « Le Téléphone rouge » : images de contrôle du style (kit « Le Monstre »).
// Personnages cubiques (Actor de monstre/chars.ts). Moment de la journée selon le script :
//   1 famille au téléphone : fin d'après-midi, lumière chaude par la fenêtre
//   2 cimetière : jour couvert, lumière douce grise
//   3 maison en feu : nuit, feu réel (sprites de flammes, fumée, lumières)
//   4 chambre : nuit, lueur du feu sous la porte et par la fenêtre
//   5 vieux pompier : soir, lumière dorée par la porte
// Sous-titre jaune #FFE900, un mot à la fois, contour noir. Flashbacks 3-5 : léger effet ancien.
// Format still : 1440 x 2560 (2K vertical).
import React, { useEffect, useMemo } from "react";
import * as THREE from "three";
import { AbsoluteFill, continueRender, delayRender, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree, addAfterEffect } from "@react-three/fiber";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { Actor, CAST, Expr, Spec } from "../monstre/chars";
import { hash } from "../monstre/tex";

export const APPEL_W = 1440, APPEL_H = 2560;
const WORDS = ["dans", "meurt", "nuit", "attends", "vérité"];
// sous-titre : géométrique arrondi très gras, minuscules, jaune #F5FF3B, contour noir arrondi, dézoom 130 % -> 100 % en 6 images
const SUB_FONT = "Fredoka, Nunito, 'Varela Round', 'Arial Rounded MT Bold', Arial, sans-serif";
const SubWord: React.FC<{ word: string }> = ({ word }) => {
  const f = useCurrentFrame();
  const t = Math.min(1, f / 6);
  const s = 1.3 - 0.3 * (1 - Math.pow(1 - t, 3));
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 1715, transform: `translateY(-50%) scale(${s})`, transformOrigin: "50% 50%" }}>
      <svg width={APPEL_W} height={260} viewBox={`0 0 ${APPEL_W} 260`} style={{ overflow: "visible", display: "block" }}>
        <text x="50%" y="190" textAnchor="middle" fontFamily={SUB_FONT} fontWeight={900} fontSize={170} letterSpacing="-4"
          fill="#F5FF3B" stroke="#000000" strokeWidth={28} strokeLinejoin="round" strokeLinecap="round" paintOrder="stroke fill">{word}</text>
      </svg>
    </div>
  );
};
const FLASH = new Set([3, 4, 5]);

// ---------- helpers ----------
const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const mkc = (w: number, h: number) => { const c = document.createElement("canvas"); c.width = w; c.height = h; return c; };
const std = (c: string, rough = 0.8, metal = 0, emis = "#000000", ei = 0, extra: THREE.MeshStandardMaterialParameters = {}) =>
  new THREE.MeshStandardMaterial({ color: c, roughness: rough, metalness: metal, emissive: emis, emissiveIntensity: ei, ...extra });
const M = (g: THREE.BufferGeometry, m: THREE.Material, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) => {
  const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.rotation.set(rx, ry, rz); o.castShadow = true; o.receiveShadow = true; return o;
};
const B = (w: number, h: number, d: number, c: string, x: number, y: number, z: number, r = 0.02, rough = 0.8, metal = 0) =>
  M(new RoundedBoxGeometry(w, h, d, 2, Math.min(r, w / 2 - 0.001, h / 2 - 0.001, d / 2 - 0.001)), std(c, rough, metal), x, y, z);
const C = (rt: number, rb: number, h: number, c: string, x: number, y: number, z: number, rx = 0, ry = 0, rz = 0, rough = 0.6, metal = 0) =>
  M(new THREE.CylinderGeometry(rt, rb, h, 20), std(c, rough, metal), x, y, z, rx, ry, rz);
const glow = (c: string, i: number) => std("#000000", 1, 0, c, i, { toneMapped: false });
const person = (spec: Spec, x: number, z: number, expr: Expr, seed: number, over: Partial<Spec> = {}, yaw = 0) => {
  const a = new Actor({ ...spec, ...over }, 0.36, seed);
  a.root.position.set(x, 0, z); a.pose(0, { yaw, expr }); return a;
};
const tex = (c: HTMLCanvasElement, rep?: [number, number]) => {
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  if (rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep[0], rep[1]); }
  return t;
};
const stripeTex = (base: string, stripe: string) => {
  const cv = mkc(256, 256); const g = cv.getContext("2d")!;
  g.fillStyle = base; g.fillRect(0, 0, 256, 256); g.fillStyle = stripe; for (let x = 0; x < 256; x += 32) g.fillRect(x, 0, 12, 256);
  return tex(cv, [3, 2]);
};
// herbe / sol : bruit déterministe
const groundTex = (base: string, dark: string, light: string) => {
  const cv = mkc(256, 256); const g = cv.getContext("2d")!; g.fillStyle = base; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 2600; i++) { g.fillStyle = hash(i, 1) > 0.5 ? light : dark; g.globalAlpha = 0.35 + hash(i, 2) * 0.4; g.fillRect(hash(i, 3) * 256, hash(i, 4) * 256, 2, 2 + hash(i, 5) * 3); }
  g.globalAlpha = 1; return tex(cv, [24, 24]);
};
// ciel en dégradé (non éclairé) : fenêtre, ciel de soir ou de nuit
const sky = (root: THREE.Group, top: string, bottom: string, x: number, y: number, z: number, w: number, h: number) => {
  const cv = mkc(8, 256); const g = cv.getContext("2d")!; const gr = g.createLinearGradient(0, 0, 0, 256);
  gr.addColorStop(0, top); gr.addColorStop(1, bottom); g.fillStyle = gr; g.fillRect(0, 0, 8, 256);
  root.add(M(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex(cv), toneMapped: false }), x, y, z));
};
// tache de lumière douce (sprites)
let _flame: THREE.CanvasTexture | null = null, _smoke: THREE.CanvasTexture | null = null;
const flameTex = () => {
  if (_flame) return _flame; const cv = mkc(128, 128); const g = cv.getContext("2d")!;
  const gr = g.createRadialGradient(64, 74, 3, 64, 64, 62);
  gr.addColorStop(0, "rgba(255,252,230,1)"); gr.addColorStop(0.22, "rgba(255,200,90,0.95)"); gr.addColorStop(0.5, "rgba(255,100,25,0.6)"); gr.addColorStop(1, "rgba(120,20,0,0)");
  g.fillStyle = gr; g.beginPath(); g.ellipse(64, 66, 46, 60, 0, 0, Math.PI * 2); g.fill();
  _flame = tex(cv); return _flame;
};
const smokeTex = () => {
  if (_smoke) return _smoke; const cv = mkc(128, 128); const g = cv.getContext("2d")!;
  const gr = g.createRadialGradient(64, 64, 6, 64, 64, 62); gr.addColorStop(0, "rgba(255,255,255,0.9)"); gr.addColorStop(0.5, "rgba(255,255,255,0.35)"); gr.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128); _smoke = tex(cv); return _smoke;
};
const spr = (map: THREE.Texture, color: string, x: number, y: number, z: number, s: number, op: number, additive: boolean) => {
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map, color, transparent: true, opacity: op, depthWrite: false, toneMapped: false,
    blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending }));
  sp.position.set(x, y, z); sp.scale.setScalar(s); return sp;
};
// feu : nuage de flammes superposées + fumée qui monte
const fire = (root: THREE.Group, cx: number, cy: number, cz: number, w: number, h: number, n: number, seed: number) => {
  for (let i = 0; i < n; i++) {
    const r1 = hash(i, seed), r2 = hash(i, seed + 1), r3 = hash(i, seed + 2);
    const x = cx + (r1 - 0.5) * w, y = cy + Math.pow(r2, 0.8) * h, z = cz + (r3 - 0.5) * 0.5;
    const up = (y - cy) / h; const s = (0.5 + hash(i, seed + 3) * 0.6) * (1.1 - up * 0.5);
    const col = hash(i, seed + 4) > 0.55 ? "#ffe39a" : hash(i, seed + 4) > 0.2 ? "#ffa040" : "#ff5a18";
    root.add(spr(flameTex(), col, x, y, z, s, 0.75 + 0.2 * hash(i, seed + 5), true));
  }
  for (let i = 0; i < 14; i++) {
    const x = cx + (hash(i, seed + 6) - 0.5) * w * 1.6, y = cy + h * 0.9 + hash(i, seed + 7) * 2.6, z = cz - 0.4 + hash(i, seed + 8) * 0.6;
    root.add(spr(smokeTex(), "#5a5e68", x, y, z, 1.6 + hash(i, seed + 9) * 2.4, 0.35, false));
  }
};
// fumée noire qui monte et s'étale (sprites sombres, éclairés par le feu en dessous)
const blackSmoke = (root: THREE.Group, cx: number, cy: number, cz: number, w: number, n: number, seed: number) => {
  for (let i = 0; i < n; i++) {
    const x = cx + (hash(i, seed) - 0.5) * w, y = cy + hash(i, seed + 1) * 6.5, z = cz + (hash(i, seed + 2) - 0.5) * 1.2;
    const s = 2.2 + hash(i, seed + 3) * 2.8 + (y - cy) * 0.35;
    root.add(spr(smokeTex(), hash(i, seed + 4) > 0.5 ? "#26272c" : "#1a1b20", x, y, z, s, 0.5 - (y - cy) * 0.04, false));
  }
};
// maison à deux étages, fenêtres allumées ou éteintes (face avant à z = cz + d/2)
const house = (root: THREE.Group, cx: number, cz: number, w: number, h: number, d: number, wall: string, roof: string, lit: boolean[][]) => {
  root.add(B(w, h, d, wall, cx, h / 2, cz, 0.03, 0.95));
  const rs = new THREE.Shape(); rs.moveTo(-w / 2 - 0.3, 0); rs.lineTo(0, 1.5); rs.lineTo(w / 2 + 0.3, 0); rs.lineTo(-w / 2 - 0.3, 0);
  root.add(M(new THREE.ExtrudeGeometry(rs, { depth: d + 0.3, bevelEnabled: false }), std(roof, 0.9), cx, h, cz - (d + 0.3) / 2));
  const fz = cz + d / 2 + 0.01;
  lit.forEach((row, r) => {
    const y = 0.75 + r * 1.5 + h * 0.4;
    row.forEach((on, c) => {
      const x = cx + (c - (row.length - 1) / 2) * 1.5;
      root.add(M(new THREE.PlaneGeometry(0.68, 0.9), std(on ? "#ffb46a" : "#161a26", 0.4, 0, on ? "#ffb46a" : "#000", on ? 1.3 : 0), x, y, fz));
      root.add(B(0.8, 0.06, 0.06, "#3a2a22", x, y - 0.5, fz + 0.01, 0.01), B(0.8, 0.06, 0.06, "#3a2a22", x, y + 0.5, fz + 0.01, 0.01));
    });
  });
  root.add(B(0.9, 1.7, 0.08, "#3a2216", cx, 0.85, fz, 0.02, 0.6));
};
const tree = (g: THREE.Group, x: number, z: number, s = 1, col = "#2f4a2c") => {
  g.add(C(0.12 * s, 0.18 * s, 1.8 * s, "#2b2019", x, 0.9 * s, z));
  g.add(M(new THREE.IcosahedronGeometry(0.95 * s, 0), std(col, 1, 0, "#000", 0, { flatShading: true }), x, 2.1 * s, z));
  g.add(M(new THREE.IcosahedronGeometry(0.7 * s, 0), std(col, 1, 0, "#000", 0, { flatShading: true }), x + 0.3 * s, 2.7 * s, z - 0.2 * s));
};
const tombstone = (g: THREE.Group, x: number, z: number, ry: number, w: number, h: number, c: string) => {
  const s = new THREE.Shape(); s.moveTo(-w / 2, 0); s.lineTo(-w / 2, h - w / 2); s.absarc(0, h - w / 2, w / 2, Math.PI, 0, true); s.lineTo(w / 2, 0); s.lineTo(-w / 2, 0);
  g.add(M(new THREE.ExtrudeGeometry(s, { depth: 0.09, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02, bevelSegments: 2, curveSegments: 16 }), std(c, 0.9), x, 0, z, 0, ry, 0));
};

// ---------- téléphone rouge à cadran ----------
const telephone = (x: number, y: number, z: number, ry = 0, scale = 1.6) => {
  const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; g.scale.setScalar(scale);
  const R = "#b8212f", RD = "#7e1520", CR = "#efe8d6", K = "#141414";
  g.add(B(0.34, 0.12, 0.26, R, 0, 0.06, 0, 0.035, 0.32, 0.08));
  g.add(C(0.075, 0.075, 0.012, CR, 0, 0.078, 0.131, Math.PI / 2, 0, 0, 0.5));
  for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2 + 0.3; g.add(C(0.009, 0.009, 0.01, K, Math.cos(a) * 0.052, 0.078 + Math.sin(a) * 0.052, 0.138, Math.PI / 2, 0, 0, 0.9)); }
  g.add(B(0.04, 0.07, 0.1, RD, -0.12, 0.155, 0, 0.012), B(0.04, 0.07, 0.1, RD, 0.12, 0.155, 0, 0.012));
  const hs = new THREE.Group(); hs.position.set(0, 0.2, 0); g.add(hs);
  hs.add(M(new THREE.CapsuleGeometry(0.034, 0.26, 6, 14), std(R, 0.3, 0.05), 0, 0, 0, 0, 0, Math.PI / 2));
  for (const sx of [-1, 1]) hs.add(C(0.05, 0.058, 0.04, R, sx * 0.165, 0.012, 0, 0, 0, 0, 0.3));
  const cord = [V(-0.165, 0.2, 0), V(-0.19, 0.19, 0.02), V(-0.2, 0.17, 0.06), V(-0.205, 0.15, 0.1), V(-0.2, 0.12, 0.14), V(-0.18, 0.09, 0.17), V(-0.16, 0.07, 0.15), V(-0.15, 0.06, 0.13)];
  g.add(M(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(cord), 80, 0.008, 6), std(K, 0.7)));
  return g;
};

// ---------- scènes ----------
type Built = { root: THREE.Group; bg: string; fog: THREE.Scene["fog"]; cam: { P: THREE.Vector3; T: THREE.Vector3; fov: number } };
const sun = (root: THREE.Group, c: string, i: number, x: number, y: number, z: number) => {
  const d = new THREE.DirectionalLight(c, i); d.position.set(x, y, z); d.target.position.set(0, 0.8, -1);
  d.castShadow = true; d.shadow.mapSize.set(4096, 4096); d.shadow.bias = -0.0005; Object.assign(d.shadow.camera, { left: -14, right: 14, top: 14, bottom: -14, far: 60 });
  root.add(d, d.target);
};

// 1. fin d'après-midi, intérieur chaud, fenêtre sur le ciel du soir
const buildFamily = (): Built => {
  const root = new THREE.Group(); const bg = "#4a3f50";
  root.add(new THREE.HemisphereLight("#ffd6b0", "#3a2a24", 1.4));
  sun(root, "#ffc890", 2.4, -5, 3.5, 2.5);
  // pièce
  root.add(M(new THREE.BoxGeometry(12, 0.1, 12), std("#9a7458", 0.7), 0, -0.05, -2));
  root.add(M(new THREE.BoxGeometry(12, 6, 0.2), std("#c09482", 0.95, 0, "#000", 0, { map: stripeTex("#c09482", "#ffffff22") }), 0, 3, -5));
  root.add(M(new THREE.BoxGeometry(0.2, 6, 12), std("#b08878", 0.95), -4.5, 3, -2));
  // fenêtre avec ciel du soir et cadre
  sky(root, "#3a3f78", "#f0a070", -1.6, 2.0, -4.85, 2.4, 2.0);
  root.add(B(2.6, 0.1, 0.1, "#f2e6d0", -1.6, 3.05, -4.82), B(2.6, 0.1, 0.1, "#f2e6d0", -1.6, 0.95, -4.82), B(0.1, 2.2, 0.1, "#f2e6d0", -1.6, 2.0, -4.82), B(0.1, 2.2, 0.1, "#f2e6d0", -0.3, 2.0, -4.82), B(0.1, 2.2, 0.1, "#f2e6d0", -2.9, 2.0, -4.82));
  // tapis, meuble, cadre, lampe
  root.add(M(new THREE.CircleGeometry(1.8, 32), std("#b04a4a", 1), 0, 0.01, -0.8, -Math.PI / 2));
  root.add(B(1.2, 1.4, 0.5, "#8a6448", 2.2, 0.7, -2.6, 0.03, 0.6));
  root.add(B(0.45, 0.6, 0.04, "#c8a060", 2.2, 2.0, -4.8, 0.02));
  root.add(C(0.1, 0.16, 0.3, "#f0d9a0", 2.2, 1.6, -2.6, 0, 0, 0, 0.9), C(0.02, 0.02, 0.55, "#2a211e", 2.2, 1.25, -2.6));
  // table basse et téléphone
  root.add(B(1.7, 0.1, 0.9, "#8a6448", 0, 0.9, -0.4, 0.03, 0.6));
  for (const [x, z] of [[-0.75, -0.8], [0.75, -0.8], [-0.75, 0], [0.75, 0]] as const) root.add(B(0.08, 0.86, 0.08, "#2a211e", x, 0.43, z, 0.02));
  root.add(telephone(0, 0.95, -0.4, 0.05, 1.6));
  // famille
  root.add(person(CAST.hero, -0.7, -1.7, "scared", 51, { top: "#f2b51c", topDark: "#c98f10" }).root);
  root.add(person(CAST.pink, 0.65, -1.7, "worried", 52, { skin: "#f1c7a0", top: "#6b5a86", topDark: "#4a3d60", sleeve: "#6b5a86" }).root);
  root.add(person(CAST.c2, 0, -2.5, "sad", 53, { skin: "#f1c7a0", hair: "bun", hairCol: "#d8d8d8", top: "#4a4f5e", topDark: "#333845", sleeve: "#4a4f5e" }).root);
  // détails de salon : plante, étagère avec livres, pouf
  root.add(C(0.2, 0.15, 0.4, "#8a4a2a", -3.2, 0.2, -3.8));
  for (let i = 0; i < 4; i++) root.add(M(new THREE.SphereGeometry(0.28 + hash(i, 11) * 0.1, 10, 8), std("#2f6a3a", 0.9, 0, "#000", 0, { flatShading: true }), -3.2 + (hash(i, 12) - 0.5) * 0.4, 0.8 + hash(i, 13) * 0.5, -3.8 + (hash(i, 14) - 0.5) * 0.4));
  root.add(B(1.6, 2.2, 0.35, "#3a2a20", -3.4, 1.1, -4.8, 0.02, 0.6));
  for (let s = 0; s < 4; s++) for (let b = 0; b < 5; b++) root.add(B(0.2, 0.36, 0.22, ["#c0392b", "#2e86ab", "#e0b030", "#5a7a46", "#8e5ab0"][b], -3.9 + b * 0.22, 0.4 + s * 0.5, -4.6, 0.01));
  root.add(M(new THREE.CylinderGeometry(0.45, 0.45, 0.3, 20), std("#5a3a6a", 0.9), 0.6, 0.15, -0.2));
  // plan de trois quarts, légèrement en contre-plongée
  return { root, bg, fog: null, cam: { P: V(-2.6, 1.3, 4.3), T: V(0.1, 1.1, -1.1), fov: 46 } };
};

// 1 (version maison) : salon d'une maison normale, murs crème, sofa gris-bleu, table en bois ;
// le téléphone rouge et les vêtements vifs ressortent sur les teintes neutres, avec une flaque de lumière sur la table
const buildFamilyHouse = (): Built => {
  const root = new THREE.Group(); const bg = "#5a6470";
  root.add(new THREE.HemisphereLight("#ffd6b0", "#3a2a24", 1.4));
  sun(root, "#ffc890", 2.4, -5, 3.5, 2.5);
  const spot = new THREE.SpotLight("#fff0d8", 40, 0, 0.45, 0.7, 1.5);
  spot.position.set(0.8, 4.0, 1.6); spot.target.position.set(0, 0.9, -0.4); spot.castShadow = true; spot.shadow.mapSize.set(1024, 1024);
  root.add(spot, spot.target);
  // pièce : parquet clair, murs crème, plinthe
  root.add(M(new THREE.BoxGeometry(12, 0.1, 12), std("#b8926e", 0.6), 0, -0.05, -2));
  root.add(M(new THREE.BoxGeometry(12, 6, 0.2), std("#e6dccb", 0.9), 0, 3, -5));
  root.add(M(new THREE.BoxGeometry(0.2, 6, 12), std("#d9cfbd", 0.9), -4.5, 3, -2));
  root.add(B(12, 0.25, 0.06, "#f4efe6", 0, 0.12, -4.95, 0.01));
  // fenêtre sur ciel du soir, rideaux, cadre
  sky(root, "#6a7aa8", "#e8b890", -1.6, 2.0, -4.85, 2.4, 2.0);
  root.add(B(2.6, 0.1, 0.1, "#f4efe6", -1.6, 3.05, -4.82), B(2.6, 0.1, 0.1, "#f4efe6", -1.6, 0.95, -4.82), B(0.1, 2.2, 0.1, "#f4efe6", -1.6, 2.0, -4.82), B(0.1, 2.2, 0.1, "#f4efe6", -0.3, 2.0, -4.82), B(0.1, 2.2, 0.1, "#f4efe6", -2.9, 2.0, -4.82));
  root.add(B(0.5, 2.6, 0.08, "#8a9bb0", -3.2, 2.0, -4.75, 0.03), B(0.5, 2.6, 0.08, "#8a9bb0", 0.0, 2.0, -4.75, 0.03));
  // canapé gris-bleu, coussins, table basse en bois
  root.add(B(2.6, 0.5, 0.95, "#6d7c93", -1.0, 0.3, -3.5, 0.08, 0.9), B(2.6, 0.75, 0.25, "#6d7c93", -1.0, 0.75, -3.9, 0.08, 0.9));
  root.add(B(0.25, 0.7, 0.95, "#5a687e", -2.4, 0.5, -3.5, 0.08, 0.9), B(0.25, 0.7, 0.95, "#5a687e", 0.4, 0.5, -3.5, 0.08, 0.9));
  root.add(B(0.5, 0.15, 0.4, "#c9a88a", -1.6, 0.6, -3.4, 0.06, 0.9), B(0.5, 0.15, 0.4, "#c9a88a", -0.5, 0.6, -3.4, 0.06, 0.9));
  root.add(M(new THREE.CircleGeometry(1.8, 32), std("#cdbfa8", 1), 0, 0.01, -0.8, -Math.PI / 2));
  root.add(B(1.7, 0.1, 0.9, "#9a7a5a", 0, 0.9, -0.4, 0.03, 0.6));
  for (const [x, z] of [[-0.75, -0.8], [0.75, -0.8], [-0.75, 0], [0.75, 0]] as const) root.add(B(0.08, 0.86, 0.08, "#6a5040", x, 0.43, z, 0.02));
  root.add(telephone(0, 0.95, -0.4, 0.05, 1.6));
  // cadre mural et lampadaire d'angle
  root.add(B(0.6, 0.75, 0.04, "#c8b08a", 2.0, 2.0, -4.85, 0.02), M(new THREE.PlaneGeometry(0.5, 0.65), std("#a8b8c8", 0.8), 2.0, 2.0, -4.82));
  root.add(C(0.03, 0.03, 1.8, "#3a3a40", 2.6, 0.9, -2.8));
  root.add(C(0.22, 0.28, 0.35, "#f4ead8", 2.6, 1.9, -2.8, 0, 0, 0, 0.9));
  // famille (mêmes personnages, tenues vives pour ressortir)
  root.add(person(CAST.hero, -0.7, -1.7, "scared", 51, { top: "#f2b51c", topDark: "#c98f10" }).root);
  root.add(person(CAST.pink, 0.65, -1.7, "worried", 52, { skin: "#f1c7a0", top: "#2a9d8f", topDark: "#1d6f66", sleeve: "#2a9d8f" }).root);
  root.add(person(CAST.c2, 0, -2.5, "sad", 53, { skin: "#f1c7a0", hair: "bun", hairCol: "#d8d8d8", top: "#2e6fa8", topDark: "#1f4a78", sleeve: "#2e6fa8" }).root);
  return { root, bg, fog: null, cam: { P: V(-2.6, 1.3, 4.3), T: V(0.1, 1.1, -1.1), fov: 46 } };
};

// 2. cimetière, jour couvert, plongée depuis la hauteur
const buildCemetery = (): Built => {
  const root = new THREE.Group(); const bg = "#aeb8c6";
  sky(root, "#c8d0dc", "#8e9aa8", 0, 14, -30, 120, 60);
  root.add(new THREE.HemisphereLight("#dfe8f4", "#4a5a40", 1.5));
  sun(root, "#fff4e0", 2.6, 4, 7, 6);
  root.add(M(new THREE.PlaneGeometry(90, 90), std("#7a8a6a", 1, 0, "#000", 0, { map: groundTex("#7a8a6a", "#4a5a40", "#a0b088") }), 0, 0, -6, -Math.PI / 2));
  root.add(M(new THREE.PlaneGeometry(1.6, 30), std("#a09480", 1), 0, 0.01, -8, -Math.PI / 2));
  // grille du fond
  for (let i = 0; i <= 24; i++) root.add(B(0.05, 1.1, 0.05, "#2a3038", -6 + i * 0.5, 0.55, -10.5, 0.01, 0.5, 0.6));
  root.add(B(12.2, 0.05, 0.05, "#2a3038", 0, 1.0, -10.5, 0.01, 0.5, 0.6), B(12.2, 0.05, 0.05, "#2a3038", 0, 0.45, -10.5, 0.01, 0.5, 0.6));
  // arbres (feuillage plus clair, jour)
  tree(root, -5.2, -8.2, 1.3, "#4a6a3a"); tree(root, 5.0, -9.0, 1.2, "#5a7a46"); tree(root, -1.2, -11, 1.5, "#4a6a3a");
  // colline et arbres du fond (pas de plaine vide)
  root.add(M(new THREE.SphereGeometry(14, 16, 10), std("#2c3e2c", 1, 0, "#000", 0, { flatShading: true }), 0, -6, -26));
  for (const [x, z, s] of [[-9, -20, 1.6], [-4, -22, 1.9], [2, -21, 1.7], [8, -19, 1.8], [12, -15, 1.4], [-13, -16, 1.5]] as const) tree(root, x, z, s, "#3a5a36");
  // terre fraîche, gravier, pierres au sol, buissons
  for (let i = 0; i < 6; i++) root.add(B(1.0 + hash(i, 40) * 0.6, 0.2, 1.4, "#4a3a2a", -6 + i * 2.4 + hash(i, 41), 0.1, -5.5 - hash(i, 42) * 3, 0.08, 1));
  for (let i = 0; i < 90; i++) root.add(M(new THREE.DodecahedronGeometry(0.025 + hash(i, 43) * 0.03, 0), std("#8a8478", 1), -7 + hash(i, 44) * 14, 0.02, -1 - hash(i, 45) * 10));
  for (let i = 0; i < 8; i++) root.add(B(0.9, 0.7, 0.8, "#2c4a2c", -6.5 + i * 1.8, 0.35, -1.2 - (i % 2) * 0.6, 0.3, 1));
  // pierres tombales variées : arrondies, plates, croix, rochers
  for (let i = 0; i < 26; i++) {
    const x = -7 + hash(i, 61) * 14, z = -2 - hash(i, 62) * 9;
    if (Math.abs(x) < 1.6 && z > -4.5) continue;
    const kind = Math.floor(hash(i, 63) * 4); const c = ["#cfcac0", "#bdb8ae", "#d8d2c6", "#a9a59c"][i % 4];
    const h = 0.7 + hash(i, 64) * 0.9, w = 0.5 + hash(i, 65) * 0.3, ry = (hash(i, 66) - 0.5) * 0.6;
    if (kind === 0) tombstone(root, x, z, ry, w, h, c);
    else if (kind === 1) root.add(B(w + 0.1, 0.12, 0.6, c, x, 0.06, z, 0.03, 0.9));
    else if (kind === 2) { root.add(B(0.12, h, 0.1, "#9a958b", x, h / 2, z, 0.02, 0.9), B(0.42, 0.1, 0.1, "#9a958b", x, h * 0.8, z, 0.02, 0.9)); }
    else root.add(M(new THREE.DodecahedronGeometry(0.22 + hash(i, 67) * 0.12, 0), std("#8c8880", 1), x, 0.12, z));
  }
  // fleurs sur quelques tombes
  for (let i = 0; i < 10; i++) root.add(M(new THREE.SphereGeometry(0.06, 8, 6), std(["#f4f1ea", "#e8a0b0", "#f0d070"][i % 3], 0.6), -4 + hash(i, 68) * 8, 0.15, -3 - hash(i, 69) * 3));
  // rangées de tombes
  const stones: [number, number, number, number, number, string][] = [
    [-3.6, -4.5, 0.2, 0.7, 1.2, "#d8d4cc"], [-1.6, -5.4, -0.1, 0.6, 1.0, "#c8c4bc"], [1.2, -4.8, 0.15, 0.75, 1.3, "#dcd8d0"],
    [3.5, -4.2, -0.2, 0.65, 1.1, "#c8c4bc"], [-4.8, -7.4, 0.1, 0.7, 1.2, "#d0ccc4"], [2.6, -7.8, -0.12, 0.8, 1.35, "#dcd8d0"], [-1.0, -8.6, 0, 0.6, 1.0, "#c0bcb4"],
  ];
  for (const [x, z, r, w, h, c] of stones) { tombstone(root, x, z, r, w, h, c); root.add(B(w + 0.14, 0.1, 0.26, "#8a8a84", x, 0.02, z, 0.02, 0.9)); }
  root.add(B(0.14, 1.3, 0.1, "#d0ccc4", 0.6, 0.65, -6.6, 0.02, 0.9), B(0.6, 0.14, 0.1, "#d0ccc4", 0.6, 1.05, -6.6, 0.02, 0.9));
  // tombe fraîche avec couronne
  root.add(B(1.0, 0.2, 1.8, "#4a3a2c", 0, 0.1, -2.1, 0.08, 1));
  root.add(M(new THREE.TorusGeometry(0.3, 0.035, 8, 28), std("#2f5a3a", 0.8), 0, 0.28, -2.1, Math.PI / 2));
  root.add(B(0.05, 0.5, 0.05, "#6a5340", 0, 0.45, -2.5, 0.01), B(0.3, 0.05, 0.05, "#6a5340", 0, 0.6, -2.5, 0.01));
  // famille en noir, debout devant la tombe
  const mourn = "#1e1e28";
  root.add(person(CAST.hero, -0.85, -0.7, "worried", 41, { top: mourn, topDark: "#14141c", sleeve: mourn, pants: "#14141c", hair: "messy", hairCol: "#2a1d16" }).root);
  root.add(person(CAST.pink, 0.75, -0.7, "sad", 42, { top: mourn, topDark: "#14141c", sleeve: mourn, pants: "#14141c", hair: "long" }).root);
  root.add(person(CAST.c2, 0, -1.4, "sad", 43, { top: "#2a2d38", topDark: "#1c1f28", sleeve: "#2a2d38", pants: "#14141c", hair: "bun", hairCol: "#d8d8d8" }).root);
  root.add(person(CAST.c3, -2.0, -1.0, "neutral", 44, { top: mourn, topDark: "#14141c", sleeve: mourn, pants: "#14141c", beard: "#d8d8d8" }).root);
  return { root, bg, fog: new THREE.FogExp2("#b8c2d0", 0.018), cam: { P: V(1.5, 4.8, 8.5), T: V(0, 0.9, -2.2), fov: 44 } };
};

// 3. maison en feu, nuit, contre-plongée depuis la rue
const buildHouseFire = (): Built => {
  const root = new THREE.Group(); const bg = "#070a16";
  sky(root, "#060a1e", "#1b2140", 0, 14, -30, 120, 60);
  root.add(new THREE.HemisphereLight("#5868b8", "#1a1622", 0.9));
  const moon = new THREE.SpotLight("#9fb2ff", 60, 0, 0.5, 0.7, 1.5); moon.position.set(-6, 12, 8); moon.target.position.set(0, 2, -1); moon.castShadow = true; moon.shadow.mapSize.set(2048, 2048);
  root.add(moon, moon.target);
  // rue, trottoir, pelouse
  root.add(M(new THREE.PlaneGeometry(60, 40), std("#2a2d36", 0.95), 0, 0, 0, -Math.PI / 2));
  root.add(M(new THREE.PlaneGeometry(60, 30), std("#3a4a32", 1, 0, "#000", 0, { map: groundTex("#3a4a32", "#243020", "#50683a") }), -12, 0.005, -12, -Math.PI / 2));
  root.add(B(40, 0.14, 2.4, "#5a5e68", 0, 0.07, 2.4, 0.02, 0.9));
  // maison brûlante (centre) et voisine sombre (gauche)
  house(root, -0.2, -1.6, 5.2, 3.6, 2.6, "#7a5a47", "#2f2a33", [[false, false, false], [false, false, false]]);
  house(root, -7.2, -1.2, 4.2, 3.2, 2.4, "#5f6b78", "#23262e", [[false, false], [false, false]]);
  // lumière de la maison voisine éteinte, haie et clôture devant
  for (let i = 0; i <= 11; i++) root.add(B(0.07, 0.9, 0.07, "#1a1d24", -12 + i * 0.55, 0.45, 1.8, 0.01, 0.5, 0.6));
  tree(root, -10.5, -4.5, 1.4); tree(root, 4.5, -6.0, 1.1, "#243a2a");
  // fenêtres du premier étage (cadre cassé) et lueur sur la façade
  // feu : fenêtres du premier étage, fenêtre du rez-de-chaussée, toit ; fumée noire au-dessus
  fire(root, -1.6, 2.2, -0.2, 3.0, 3.4, 45, 11);
  fire(root, 1.6, 1.0, 0.1, 1.6, 1.8, 20, 13);
  fire(root, -1.0, 4.0, -0.6, 3.8, 1.2, 22, 17);
  blackSmoke(root, -1.2, 4.6, -0.6, 4.8, 28, 23);
  const fireL = new THREE.PointLight("#ff6a1a", 26, 14, 1.4); fireL.position.set(-1.6, 2.6, 1.0); root.add(fireL);
  const fireL2 = new THREE.PointLight("#ff8a2a", 12, 10, 1.4); fireL2.position.set(0.8, 3.8, 0.4); root.add(fireL2);
  // camion de pompiers avec échelle, gyrophares
  root.add(B(3.6, 1.7, 1.9, "#c81e2b", 4.9, 1.0, 2.7, 0.06, 0.4, 0.1));
  root.add(B(1.3, 1.2, 1.8, "#b01a26", 6.9, 0.85, 2.7, 0.06, 0.4, 0.1));
  root.add(B(1.0, 0.55, 1.3, "#7aa0c8", 6.9, 1.5, 2.7, 0.04, 0.2));
  root.add(B(3.2, 0.1, 0.12, "#9aa0aa", 4.6, 2.0, 2.2, 0.01, 0.4, 0.8), B(3.2, 0.1, 0.12, "#9aa0aa", 4.6, 2.0, 3.2, 0.01, 0.4, 0.8));
  root.add(M(new THREE.SphereGeometry(0.13, 10, 8), glow("#ff2020", 8), 4.4, 2.05, 2.7), M(new THREE.SphereGeometry(0.13, 10, 8), glow("#3a8cff", 8), 5.4, 2.05, 2.7));
  const tl = new THREE.PointLight("#ff3030", 8, 9, 1.5); tl.position.set(4.6, 2.4, 2.4); root.add(tl);
  for (const x of [3.8, 4.4, 5.9, 7.2]) root.add(M(new THREE.TorusGeometry(0.24, 0.05, 8, 18), std("#16181c", 0.5, 0.6), x, 0.24, 3.7, 0, Math.PI / 2));
  // tuyau d'incendie qui court vers la porte
  const hose = new THREE.CatmullRomCurve3([V(3.0, 0.1, 3.1), V(2.0, 0.08, 2.5), V(1.0, 0.08, 1.8), V(0.1, 0.08, 1.0)]);
  root.add(M(new THREE.TubeGeometry(hose, 40, 0.06, 8), std("#c8a020", 0.5)));
  // voiture garée à droite
  root.add(B(2.2, 0.7, 1.1, "#5f6f88", -4.2, 0.5, 4.2, 0.1, 0.4, 0.2), B(1.2, 0.55, 0.95, "#4a5a72", -4.0, 1.1, 4.2, 0.1, 0.3, 0.2));
  for (const x of [-5.0, -3.4]) for (const z of [3.8, 4.6]) root.add(M(new THREE.CylinderGeometry(0.22, 0.22, 0.2, 14), std("#111", 0.8), x, 0.22, z, 0, 0, Math.PI / 2));
  // pompiers en tenue jaune
  // tenue de pompier : veste rouge, pantalon sombre, casque noir
  const coat = { top: "#c81e2b", topDark: "#961520", sleeve: "#c81e2b", pants: "#2a2a2e", capCol: "#141414" };
  root.add(person(CAST.guard, 1.9, 2.0, "focus", 71, coat).root);
  root.add(person(CAST.guard2, 3.0, 2.6, "shout", 72, { ...coat, top: "#a8161f", sleeve: "#a8161f" }).root);
  // lampadaire
  root.add(C(0.05, 0.07, 3.6, "#1a1d24", -4.2, 1.8, 2.4));
  root.add(M(new THREE.SphereGeometry(0.18, 12, 8), glow("#ffb46a", 4), -4.2, 3.7, 2.4));
  const lamp = new THREE.PointLight("#ffb46a", 6, 10, 1.6); lamp.position.set(-4.2, 3.5, 2.4); root.add(lamp);
  return { root, bg, fog: new THREE.FogExp2("#0a0d1c", 0.012), cam: { P: V(0.6, 2.2, 10.5), T: V(-0.6, 2.8, -0.8), fov: 50 } };
};

// 4. chambre de Lucas, nuit, contre-plongée basse depuis le sol
const buildBedroom = (): Built => {
  const root = new THREE.Group(); const bg = "#07080f";
  root.add(new THREE.HemisphereLight("#5a64a8", "#2a2030", 1.1));
  const moon = new THREE.SpotLight("#8fa0ff", 26, 0, 0.5, 0.8, 1.5); moon.position.set(-3, 5, 4); moon.target.position.set(-0.5, 1, -1); moon.castShadow = true; moon.shadow.mapSize.set(2048, 2048);
  root.add(moon, moon.target);
  root.add(M(new THREE.BoxGeometry(6, 0.1, 6), std("#5a4030", 0.8), 0, -0.05, -1.5));
  root.add(M(new THREE.BoxGeometry(6, 3.2, 0.15), std("#38405e", 0.95, 0, "#000", 0, { map: stripeTex("#38405e", "#00000026") }), 0, 1.6, -2.4));
  root.add(M(new THREE.BoxGeometry(0.15, 3.2, 6), std("#303a58", 0.95), -2.6, 1.6, -1.5));
  // porte fermée, lueur du feu dessous et fumée au niveau du plafond
  root.add(B(0.95, 2.1, 0.1, "#5a3a24", 0.9, 1.05, -2.3, 0.02, 0.6));
  root.add(M(new THREE.PlaneGeometry(0.95, 0.06), glow("#ff7a2a", 6), 0.9, 0.04, -2.28));
  root.add(M(new THREE.PlaneGeometry(0.9, 0.04), glow("#ffb46a", 2.5), 0.9, 2.12, -2.28));
  fire(root, 0.9, 0.9, -2.9, 1.8, 1.4, 16, 31);
  const fireL = new THREE.PointLight("#ff7a2a", 12, 8, 1.6); fireL.position.set(0.9, 0.6, -2.0); root.add(fireL);
  // fenêtre : lueur orange de l'incendie
  root.add(M(new THREE.PlaneGeometry(1.1, 1.3), std("#120806", 0.5, 0, "#ff6a1a", 2.6), -2.5, 1.7, -0.9, 0, Math.PI / 2, 0));
  root.add(B(0.06, 1.3, 0.08, "#2a211e", -2.46, 1.7, -0.9, 0.01));
  const winL = new THREE.PointLight("#ff6a1a", 10, 7, 1.5); winL.position.set(-2.0, 1.6, -0.9); root.add(winL);
  // table de nuit avec lampe éteinte, pile de livres, tapis
  root.add(B(0.5, 0.6, 0.5, "#4a3428", -1.9, 0.3, -0.9, 0.03, 0.6));
  root.add(C(0.08, 0.12, 0.25, "#d8c8a0", -1.9, 0.72, -0.9, 0, 0, 0, 0.9), C(0.02, 0.02, 0.2, "#2a211e", -1.9, 0.6, -0.9));
  root.add(B(0.3, 0.06, 0.22, "#c0392b", -1.9, 0.63, -0.6, 0.01), B(0.28, 0.06, 0.2, "#2e86ab", -1.9, 0.69, -0.62, 0.01));
  root.add(M(new THREE.PlaneGeometry(2.0, 1.4), std("#2a2028", 1), 0.4, 0.01, -0.6, -Math.PI / 2));
  // lit, couvre-lit bleu, oreiller
  root.add(B(1.2, 0.4, 2.0, "#3c4d7a", -1.0, 0.2, -1.2, 0.05, 0.95));
  root.add(B(1.25, 0.12, 0.9, "#4b5f92", -1.0, 0.45, -1.4, 0.05, 0.95));
  root.add(B(0.6, 0.14, 0.3, "#e8e4da", -1.0, 0.56, -2.0, 0.05, 0.9));
  root.add(person(CAST.hero, 0.2, -0.6, "scared", 81, { top: "#f2b51c", topDark: "#c98f10", hair: "messy" }).root);
  return { root, bg, fog: new THREE.FogExp2("#07080f", 0.04), cam: { P: V(1.4, 1.5, 3.4), T: V(0.2, 1.1, -1.2), fov: 50 } };
};

// 5. vieux pompier à la porte, soir : lumière dorée par l'entrée
const buildDoor = (): Built => {
  const root = new THREE.Group(); const bg = "#2a2a40";
  sky(root, "#3a3f78", "#f4a070", 0, 4, -6, 16, 10);
  root.add(new THREE.HemisphereLight("#8898d8", "#3a2a24", 1.0));
  sun(root, "#ffb070", 3.2, -3.5, 2.6, -5.5);
  root.add(M(new THREE.BoxGeometry(6, 0.1, 6), std("#5a4030", 0.8), 0, -0.05, -1.5));
  root.add(M(new THREE.BoxGeometry(6, 3.2, 0.15), std("#2b2f44", 0.95), 0, 1.6, -2.4));
  root.add(M(new THREE.BoxGeometry(0.15, 3.2, 6), std("#26293d", 0.95), -2.6, 1.6, -1.5));
  // porte ouverte : ciel du soir au centre
  sky(root, "#3a3f78", "#f4a070", 0.9, 1.2, -2.25, 1.4, 2.4);
  root.add(B(0.12, 2.5, 0.12, "#4a3a2c", 0.1, 1.25, -2.22, 0.02), B(0.12, 2.5, 0.12, "#4a3a2c", 1.6, 1.25, -2.22, 0.02));
  // cadre photo : le père en uniforme
  const pc = mkc(128, 160); const g = pc.getContext("2d")!;
  g.fillStyle = "#c8c0a8"; g.fillRect(0, 0, 128, 160); g.fillStyle = "#2d4f8c"; g.fillRect(34, 80, 60, 80); g.fillStyle = "#f1c7a0"; g.beginPath(); g.arc(64, 56, 22, 0, Math.PI * 2); g.fill();
  g.fillStyle = "#23407a"; g.fillRect(40, 26, 48, 14);
  root.add(B(0.56, 0.7, 0.04, "#5a4330", -1.2, 1.75, -2.28, 0.02));
  root.add(M(new THREE.PlaneGeometry(0.46, 0.58), std("#ffffff", 0.7, 0, "#000", 0, { map: tex(pc) }), -1.2, 1.75, -2.25));
  const lamp = new THREE.PointLight("#ffb46a", 14, 9, 1.6); lamp.position.set(-1.0, 2.6, -0.8); root.add(lamp);
  // vieux pompier dans l'encadrement, Lucas adulte à gauche
  root.add(person(CAST.c3, 0.85, -1.1, "sad", 91, { top: "#2d3b5c", topDark: "#1e2a44", sleeve: "#2d3b5c", pants: "#2a2e38", hair: "cap", hairCol: "#d8d8d8", capCol: "#1f3460", beard: "#d8d8d8", mustache: "#d8d8d8", radio: true }).root);
  root.add(person(CAST.hero, -0.4, -0.6, "worried", 92, { kid: false, top: "#2c3140", topDark: "#1c1f2a", sleeve: "#2c3140", hair: "messy" }).root);
  // porte-manteau, tapis d'entrée, chaussures
  root.add(C(0.04, 0.04, 1.9, "#2a211e", -1.9, 0.95, -1.8), B(0.5, 0.06, 0.06, "#2a211e", -1.9, 1.8, -1.8, 0.01));
  root.add(B(0.5, 0.9, 0.04, "#3a4a6a", -1.9, 0.9, -1.85, 0.02, 0.9), B(0.4, 0.9, 0.04, "#5a3a2a", -1.5, 0.9, -1.85, 0.02, 0.9));
  root.add(M(new THREE.PlaneGeometry(1.2, 0.7), std("#5a2a2a", 1), 0.2, 0.01, 0.2, -Math.PI / 2));
  root.add(B(0.3, 0.1, 0.1, "#1a1a1e", -1.4, 0.05, -0.1, 0.02), B(0.3, 0.1, 0.1, "#1a1a1e", -1.1, 0.05, -0.1, 0.02));
  // plan de trois quarts, travelling latéral
  return { root, bg, fog: null, cam: { P: V(-2.6, 1.6, 2.6), T: V(0.3, 1.3, -1.0), fov: 48 } };
};

const BUILD: Record<number, () => Built> = { 1: buildFamilyHouse, 2: buildCemetery, 3: buildHouseFire, 4: buildBedroom, 5: buildDoor };

const Inner: React.FC<{ scene: number }> = ({ scene }) => {
  const f = useCurrentFrame();
  const { camera, scene: three, invalidate, gl } = useThree();
  const built = useMemo(() => BUILD[scene](), [scene]);
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

// grain, sépia léger et vignette : uniquement sur les flashbacks
const GRAIN = "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")";

// étalonnage par image (saturation et luminosité) : seule l'image 1 est modifiée pour l'instant
const GRADE: Record<number, string> = { 1: "saturate(1.35) brightness(1.1) contrast(1.04)" };

export const AppelStill: React.FC<{ scene: number }> = ({ scene }) => {
  const old = FLASH.has(scene);
  return (
    <AbsoluteFill style={{ background: "#05060c" }}>
      <AbsoluteFill style={old ? { filter: "sepia(0.22) saturate(0.8) contrast(1.05) brightness(0.97)" } : GRADE[scene] ? { filter: GRADE[scene] } : {}}>
        <ThreeCanvas width={APPEL_W} height={APPEL_H} frameloop="demand" shadows gl={{ antialias: true, stencil: false, powerPreference: "high-performance" }} camera={{ fov: 45, near: 0.05, far: 200 }}>
          <Inner scene={scene} />
        </ThreeCanvas>
      </AbsoluteFill>
      {old && <>
        <AbsoluteFill style={{ backgroundImage: GRAIN, opacity: 0.1, mixBlendMode: "overlay" }} />
        <AbsoluteFill style={{ background: "#c89a5a", opacity: 0.07, mixBlendMode: "multiply" }} />
        <AbsoluteFill style={{ background: "radial-gradient(ellipse at center, rgba(0,0,0,0) 55%, rgba(30,18,6,0.5) 100%)" }} />
        <div style={{ position: "absolute", left: 412, top: 300, width: 1, height: 620, background: "rgba(255,246,220,0.12)" }} />
        <div style={{ position: "absolute", left: 1010, top: 1400, width: 1, height: 420, background: "rgba(255,246,220,0.09)" }} />
      </>}
      <SubWord word={WORDS[scene - 1]} />
    </AbsoluteFill>
  );
};
