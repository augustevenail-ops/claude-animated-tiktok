// « Le Téléphone rouge » : images de contrôle du style (kit « Le Monstre »).
// Personnages cubiques (Actor de monstre/chars.ts), lumière de nuit bleu/violet, accents chauds (feu, lampe, téléphone).
// Sous-titre jaune #FFE900, un mot à la fois, contour noir. Flashbacks : léger effet ancien (sépia, grain, vignette, rayures).
// Format still : 1440 x 2560 (2K vertical).
import React, { useEffect, useMemo } from "react";
import * as THREE from "three";
import { AbsoluteFill, continueRender, delayRender, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree, addAfterEffect } from "@react-three/fiber";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { Actor, CAST, Expr, Spec } from "../monstre/chars";

export const APPEL_W = 1440, APPEL_H = 2560;
// scène -> mot affiché ; scènes en flashback (effet ancien) : 3, 4, 5
const WORDS = ["Dans", "meurt", "nuit", "attends", "vérité"];
const FLASH = new Set([3, 4, 5]);

// ---------- helpers géométrie / matériaux ----------
const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
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
// texture de papier peint à rayures (canvas)
const stripeTex = (base: string, stripe: string) => {
  const cv = document.createElement("canvas"); cv.width = 256; cv.height = 256; const g = cv.getContext("2d")!;
  g.fillStyle = base; g.fillRect(0, 0, 256, 256); g.fillStyle = stripe; for (let x = 0; x < 256; x += 32) g.fillRect(x, 0, 12, 256);
  const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 2); t.colorSpace = THREE.SRGBColorSpace; return t;
};

// ---------- téléphone rouge à cadran (modèle) ----------
const telephone = (x: number, y: number, z: number, ry = 0, scale = 1.6) => {
  const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; g.scale.setScalar(scale);
  const R = "#b8212f", RD = "#7e1520", CR = "#efe8d6", K = "#141414";
  // socle arrondi
  g.add(B(0.34, 0.12, 0.26, R, 0, 0.06, 0, 0.035, 0.32, 0.08));
  // cadran (disque crème + 10 trous)
  g.add(C(0.075, 0.075, 0.012, CR, 0, 0.078, 0.131, Math.PI / 2, 0, 0, 0.5));
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 + 0.3;
    g.add(C(0.009, 0.009, 0.01, K, Math.cos(a) * 0.052, 0.078 + Math.sin(a) * 0.052, 0.138, Math.PI / 2, 0, 0, 0.9));
  }
  // deux crochets de fourche
  g.add(B(0.04, 0.07, 0.1, RD, -0.12, 0.155, 0, 0.012));
  g.add(B(0.04, 0.07, 0.1, RD, 0.12, 0.155, 0, 0.012));
  // combiné : corps en capsule couché + écouteur et micro
  const hs = new THREE.Group(); hs.position.set(0, 0.2, 0); g.add(hs);
  hs.add(M(new THREE.CapsuleGeometry(0.034, 0.26, 6, 14), std(R, 0.3, 0.05), 0, 0, 0, 0, 0, Math.PI / 2));
  for (const sx of [-1, 1]) hs.add(C(0.05, 0.058, 0.04, R, sx * 0.165, 0.012, 0, 0, 0, 0, 0.3));
  // cordon spiralé jusqu'au socle
  const cord: THREE.Vector3[] = [V(-0.165, 0.2, 0.0), V(-0.19, 0.19, 0.02), V(-0.2, 0.17, 0.06), V(-0.205, 0.15, 0.1), V(-0.2, 0.12, 0.14), V(-0.18, 0.09, 0.17), V(-0.16, 0.07, 0.15), V(-0.15, 0.06, 0.13)];
  g.add(M(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(cord), 80, 0.008, 6), std(K, 0.7)));
  return g;
};

// ---------- pierre tombale (forme arrondie extrudée) ----------
const tombstone = (g: THREE.Group, x: number, z: number, ry: number, w: number, h: number, c: string) => {
  const s = new THREE.Shape(); s.moveTo(-w / 2, 0); s.lineTo(-w / 2, h - w / 2); s.absarc(0, h - w / 2, w / 2, Math.PI, 0, true); s.lineTo(w / 2, 0); s.lineTo(-w / 2, 0);
  const geo = new THREE.ExtrudeGeometry(s, { depth: 0.08, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02, bevelSegments: 2, curveSegments: 16 });
  g.add(M(geo, std(c, 0.92), x, 0, z, 0, ry, 0));
};
const tree = (g: THREE.Group, x: number, z: number, s = 1) => {
  g.add(C(0.12 * s, 0.18 * s, 1.8 * s, "#2b2019", x, 0.9 * s, z));
  g.add(M(new THREE.IcosahedronGeometry(0.95 * s, 0), std("#18281e", 1, 0, "#000", 0, { flatShading: true }), x, 2.1 * s, z));
  g.add(M(new THREE.IcosahedronGeometry(0.7 * s, 0), std("#1d2f23", 1, 0, "#000", 0, { flatShading: true }), x + 0.3 * s, 2.7 * s, z - 0.2 * s));
};

// ---------- scènes ----------
type Built = { root: THREE.Group; bg: string; fog: THREE.Scene["fog"]; cam: { P: THREE.Vector3; T: THREE.Vector3; fov: number } };

const interior = (root: THREE.Group, zBack: number, wallCol: string, floorCol: string) => {
  const wallTex = stripeTex(wallCol, "#00000022");
  root.add(M(new THREE.BoxGeometry(12, 0.1, 12), std(floorCol, 0.85), 0, -0.05, -2));
  root.add(M(new THREE.BoxGeometry(12, 6, 0.2), std(wallCol, 0.95, 0, "#000", 0, { map: wallTex }), 0, 3, zBack));
  root.add(M(new THREE.BoxGeometry(0.2, 6, 12), std(wallCol, 0.95), -4.5, 3, -2));
};

const buildFamily = (): Built => {
  const root = new THREE.Group(); const bg = "#0b0e20";
  interior(root, -5, "#2b2f4a", "#2a2630");
  root.add(new THREE.HemisphereLight("#5868b8", "#1a1622", 0.9));
  const moon = new THREE.SpotLight("#9fb2ff", 45, 0, 0.5, 0.6, 1.5); moon.position.set(-4, 9, 5); moon.target.position.set(0, 0.5, -1.5); moon.castShadow = true; moon.shadow.mapSize.set(2048, 2048);
  const violet = new THREE.PointLight("#8a7cff", 9, 14, 1.4); violet.position.set(2.5, 2.4, 3.2);
  const lamp = new THREE.PointLight("#ffb46a", 4, 9, 1.6); lamp.position.set(1.6, 2.4, -1.2);
  root.add(moon, moon.target, violet, lamp);
  // table de chevet en bois + téléphone
  root.add(B(1.7, 0.1, 0.9, "#4a3428", 0, 0.9, -0.4, 0.03, 0.6));
  for (const [x, z] of [[-0.75, -0.8], [0.75, -0.8], [-0.75, 0], [0.75, 0]] as const) root.add(B(0.08, 0.86, 0.08, "#2a211e", x, 0.43, z, 0.02));
  root.add(telephone(0, 0.95, -0.4, 0.05, 1.6));
  // cadre photo sur le mur
  root.add(B(0.5, 0.62, 0.04, "#6b4a2a", 1.9, 2.0, -4.85, 0.02));
  // lampe de chevet (abat-jour)
  root.add(C(0.1, 0.16, 0.3, "#f0d9a0", 1.6, 1.4, -1.2, 0, 0, 0, 0.9));
  // famille
  root.add(person(CAST.hero, -0.7, -1.7, "scared", 51, { top: "#f2b51c", topDark: "#c98f10" }, 0, ).root);
  root.add(person(CAST.pink, 0.65, -1.7, "worried", 52, { top: "#6b5a86", topDark: "#4a3d60", sleeve: "#6b5a86" }).root);
  root.add(person(CAST.c2, 0, -2.5, "sad", 53, { hair: "bun", hairCol: "#d8d8d8", top: "#4a4f5e", topDark: "#333845", sleeve: "#4a4f5e" }).root);
  return { root, bg, fog: null, cam: { P: V(0, 1.7, 3.6), T: V(0, 1.15, -1.1), fov: 48 } };
};

const buildCemetery = (): Built => {
  const root = new THREE.Group(); const bg = "#070a16";
  root.add(new THREE.HemisphereLight("#6878c8", "#2a3a2c", 1.8));
  const moon = new THREE.SpotLight("#a8b8ff", 160, 0, 0.45, 0.7, 1.5); moon.position.set(-6, 14, 6); moon.target.position.set(0, 0.5, -2); moon.castShadow = true; moon.shadow.mapSize.set(2048, 2048);
  root.add(moon, moon.target);
  for (const [x, z] of [[-3.2, -1.2], [3.4, -2.6]] as const) {
    const pole = C(0.03, 0.04, 2.4, "#101418", x, 1.2, z); root.add(pole);
    root.add(M(new THREE.SphereGeometry(0.12, 12, 8), glow("#ffb46a", 3), x, 2.45, z));
    const pl = new THREE.PointLight("#ffb46a", 5, 7, 1.6); pl.position.set(x, 2.4, z); root.add(pl);
  }
  // sol d'herbe, allée de gravier
  root.add(M(new THREE.PlaneGeometry(80, 80), std("#1d2a20", 1), 0, 0, -6, -Math.PI / 2));
  root.add(M(new THREE.PlaneGeometry(1.5, 30), std("#3b342c", 1), 0, 0.01, -8, -Math.PI / 2));
  // grille en fer au fond
  for (let i = 0; i <= 24; i++) root.add(B(0.05, 1.1, 0.05, "#101418", -6 + i * 0.5, 0.55, -10.5, 0.01, 0.5, 0.6));
  root.add(B(12.2, 0.05, 0.05, "#101418", 0, 1.0, -10.5, 0.01, 0.5, 0.6), B(12.2, 0.05, 0.05, "#101418", 0, 0.45, -10.5, 0.01, 0.5, 0.6));
  // arbres
  tree(root, -5.2, -8.2, 1.3); tree(root, 5.0, -9.0, 1.2); tree(root, -1.2, -11, 1.5);
  // rangées de tombes
  const stones: [number, number, number, number, number, string][] = [
    [-3.6, -4.5, 0.2, 0.7, 1.2, "#6e7280"], [-1.6, -5.4, -0.1, 0.6, 1.0, "#5d6170"], [1.2, -4.8, 0.15, 0.75, 1.3, "#6e7280"],
    [3.5, -4.2, -0.2, 0.65, 1.1, "#5d6170"], [-4.8, -7.4, 0.1, 0.7, 1.2, "#6a6e7c"], [2.6, -7.8, -0.12, 0.8, 1.35, "#6e7280"], [-1.0, -8.6, 0, 0.6, 1.0, "#5a5f6c"],
  ];
  for (const [x, z, r, w, h, c] of stones) {
    tombstone(root, x, z, r, w, h, c);
    root.add(B(w + 0.14, 0.1, 0.26, "#4a4e5a", x, 0.02, z, 0.02, 0.9));
  }
  // croix de pierre
  root.add(B(0.14, 1.3, 0.1, "#7a7f8c", 0.6, 0.65, -6.6, 0.02, 0.9)); root.add(B(0.6, 0.14, 0.1, "#7a7f8c", 0.6, 1.05, -6.6, 0.02, 0.9));
  // tombe fraîche : monticule de terre, couronne de fleurs, petite croix de bois
  root.add(B(1.0, 0.2, 1.8, "#2e2620", 0, 0.1, -2.1, 0.08, 1));
  root.add(M(new THREE.TorusGeometry(0.3, 0.035, 8, 28), std("#2f5a3a", 0.8), 0, 0.28, -2.1, Math.PI / 2));
  for (let i = 0; i < 9; i++) { const a = (i / 9) * Math.PI * 2; root.add(M(new THREE.SphereGeometry(0.05, 8, 6), std("#f4f1ea", 0.6), Math.cos(a) * 0.3, 0.3, -2.1 + Math.sin(a) * 0.3)); }
  root.add(B(0.05, 0.5, 0.05, "#5a4330", 0, 0.45, -2.5, 0.01)); root.add(B(0.3, 0.05, 0.05, "#5a4330", 0, 0.6, -2.5, 0.01));
  // famille en deuil devant la tombe
  const mourn = "#1a1a24";
  root.add(person(CAST.hero, -0.85, -0.7, "worried", 41, { top: mourn, topDark: "#101018", sleeve: mourn, pants: "#101018", hair: "messy", hairCol: "#2a1d16" }, 0, ).root);
  root.add(person(CAST.pink, 0.75, -0.7, "sad", 42, { top: mourn, topDark: "#101018", sleeve: mourn, pants: "#101018", hair: "long" }).root);
  root.add(person(CAST.c2, 0, -1.4, "sad", 43, { top: "#2a2d38", topDark: "#1c1f28", sleeve: "#2a2d38", pants: "#101018", hair: "bun", hairCol: "#d8d8d8" }).root);
  root.add(person(CAST.c3, -2.0, -1.0, "neutral", 44, { top: mourn, topDark: "#101018", sleeve: mourn, pants: "#101018", beard: "#d8d8d8" }).root);
  return { root, bg, fog: new THREE.FogExp2("#0c1222", 0.02), cam: { P: V(0, 2.0, 8.5), T: V(0, 1.3, -2.5), fov: 46 } };
};

const buildHouseFire = (): Built => {
  const root = new THREE.Group(); const bg = "#070a16";
  root.add(new THREE.HemisphereLight("#5868b8", "#1a1622", 0.55));
  const moon = new THREE.SpotLight("#9fb2ff", 40, 0, 0.5, 0.7, 1.5); moon.position.set(-6, 12, 8); moon.target.position.set(0, 2, -1); moon.castShadow = true; moon.shadow.mapSize.set(2048, 2048);
  root.add(moon, moon.target);
  // rue et trottoir
  root.add(M(new THREE.PlaneGeometry(40, 40), std("#23262e", 0.95), 0, 0, 0, -Math.PI / 2));
  root.add(B(14, 0.14, 2.4, "#6a6e78", 0, 0.07, 2.4, 0.02, 0.9));
  // maison deux étages
  root.add(B(5.2, 3.6, 2.6, "#7a5a47", 0, 1.8, -1.6, 0.03, 0.95));
  const roofShape = new THREE.Shape(); roofShape.moveTo(-3.0, 0); roofShape.lineTo(0, 1.5); roofShape.lineTo(3.0, 0); roofShape.lineTo(-3.0, 0);
  const roof = M(new THREE.ExtrudeGeometry(roofShape, { depth: 3.0, bevelEnabled: false }), std("#2f2a33", 0.9), 0, 3.6, -3.1);
  root.add(roof);
  // fenêtres : une au premier étage brûle, les autres sont éclairées
  const winGlow = (x: number, y: number, c: string, i: number) => {
    root.add(M(new THREE.PlaneGeometry(0.7, 0.9), std("#120e0c", 0.4, 0, c, i), x, y, -0.27));
    root.add(B(0.8, 0.06, 0.06, "#3a2a22", x, y - 0.5, -0.26, 0.01)); root.add(B(0.8, 0.06, 0.06, "#3a2a22", x, y + 0.5, -0.26, 0.01));
  };
  winGlow(-1.6, 2.5, "#ff5a14", 3.2);
  winGlow(1.6, 2.5, "#ffb46a", 0.6);
  winGlow(-1.6, 1.0, "#ffb46a", 0.9);
  winGlow(1.6, 1.0, "#ffb46a", 0.9);
  // porte d'entrée et perron
  root.add(B(0.9, 1.7, 0.08, "#3a2216", 0, 0.85, -0.25, 0.02, 0.6));
  root.add(B(1.5, 0.1, 0.8, "#55515a", 0, 0.05, 0.1, 0.02));
  // feu : flammes superposées (cônes) et fumée
  const flames: [number, number, number, number][] = [[-1.6, 2.5, 0.0, 0.7], [-1.9, 3.5, -0.2, 0.9], [-1.2, 3.2, 0.1, 0.6], [-0.6, 4.0, -0.4, 0.5], [-2.3, 4.2, -0.6, 0.45]];
  for (const [x, y, z, s] of flames) {
    root.add(M(new THREE.SphereGeometry(0.32 * s, 10, 8), std("#000", 1, 0, "#ff7a1a", 2.4, { toneMapped: false, transparent: true, opacity: 0.92 }), x, y, z));
    root.add(M(new THREE.SphereGeometry(0.17 * s, 10, 8), std("#000", 1, 0, "#ffd24a", 3, { toneMapped: false, transparent: true, opacity: 0.95 }), x, y - 0.1, z + 0.05));
  }
  const smoke: [number, number, number, number][] = [[-2.4, 5.2, -0.6, 0.9], [-1.4, 5.8, -0.9, 1.1], [-0.2, 6.0, -1.2, 1.0], [-3.2, 4.8, -0.4, 0.8]];
  for (const [x, y, z, s] of smoke) root.add(M(new THREE.SphereGeometry(s, 12, 9), std("#4a4d55", 1, 0, "#000", 0, { transparent: true, opacity: 0.38, flatShading: true }), x, y, z));
  const fire = new THREE.PointLight("#ff6a1a", 22, 14, 1.6); fire.position.set(-1.6, 2.6, 1.2); root.add(fire);
  const fire2 = new THREE.PointLight("#ff7a2a", 8, 10, 1.6); fire2.position.set(-0.6, 3.6, 0.6); root.add(fire2);
  // camion de pompiers rouge, gyrophares
  root.add(B(3.2, 1.5, 1.7, "#c81e2b", 4.6, 0.9, 2.6, 0.06, 0.4, 0.1));
  root.add(B(1.2, 1.1, 1.6, "#b01a26", 6.1, 0.75, 2.6, 0.06, 0.4, 0.1));
  root.add(B(0.9, 0.5, 1.2, "#7aa0c8", 6.1, 1.35, 2.6, 0.04, 0.2, 0.0));
  root.add(B(2.6, 0.08, 1.2, "#8a8f98", 4.3, 1.7, 2.6, 0.02, 0.4, 0.8));
  root.add(M(new THREE.SphereGeometry(0.12, 10, 8), glow("#ff2020", 6), 4.0, 1.82, 2.6));
  root.add(M(new THREE.SphereGeometry(0.12, 10, 8), glow("#3a8cff", 6), 5.0, 1.82, 2.6));
  const truckLight = new THREE.PointLight("#ff3030", 6, 8, 1.6); truckLight.position.set(4.5, 2.2, 2.4); root.add(truckLight);
  for (const x of [3.1, 3.6, 4.1]) root.add(M(new THREE.TorusGeometry(0.22, 0.05, 8, 18), std("#16181c", 0.5, 0.6), x, 0.22, 3.6, 0, Math.PI / 2));
  // tuyau d'incendie vers la porte
  const hose = new THREE.CatmullRomCurve3([V(2.9, 0.1, 3.0), V(1.9, 0.08, 2.3), V(0.9, 0.08, 1.6), V(0.2, 0.08, 1.0)]);
  root.add(M(new THREE.TubeGeometry(hose, 40, 0.06, 8), std("#c8a020", 0.5)));
  // pompiers en tenue jaune
  const coat = { top: "#e0a020", topDark: "#b07a10", sleeve: "#e0a020", pants: "#2a2a2a", capCol: "#e8b020" };
  root.add(person(CAST.guard, 1.6, 2.0, "focus", 71, coat, 0).root);
  root.add(person(CAST.guard2, 3.2, 2.6, "shout", 72, { ...coat, top: "#d89418", sleeve: "#d89418" }, 0).root);
  // lampadaire
  root.add(C(0.05, 0.07, 3.6, "#1a1d24", -4.2, 1.8, 2.4));
  root.add(M(new THREE.SphereGeometry(0.18, 12, 8), glow("#ffb46a", 4), -4.2, 3.7, 2.4));
  const lamp = new THREE.PointLight("#ffb46a", 6, 10, 1.6); lamp.position.set(-4.2, 3.5, 2.4); root.add(lamp);
  return { root, bg, fog: new THREE.FogExp2("#0a0d1c", 0.02), cam: { P: V(0.6, 3.0, 13), T: V(0.6, 2.4, -0.8), fov: 50 } };
};

const buildBedroom = (): Built => {
  const root = new THREE.Group(); const bg = "#07080f";
  root.add(new THREE.HemisphereLight("#4a5490", "#1a1622", 0.4));
  const moon = new THREE.SpotLight("#8fa0ff", 10, 0, 0.5, 0.8, 1.5); moon.position.set(-3, 5, 4); moon.target.position.set(-0.5, 1, -1); moon.castShadow = true; moon.shadow.mapSize.set(2048, 2048);
  root.add(moon, moon.target);
  // chambre : sol, mur du fond avec porte, mur gauche avec fenêtre
  root.add(M(new THREE.BoxGeometry(6, 0.1, 6), std("#3a2e28", 0.85), 0, -0.05, -1.5));
  root.add(M(new THREE.BoxGeometry(6, 3.2, 0.15), std("#38405e", 0.95, 0, "#000", 0, { map: stripeTex("#38405e", "#00000026") }), 0, 1.6, -2.4));
  root.add(M(new THREE.BoxGeometry(0.15, 3.2, 6), std("#303a58", 0.95), -2.6, 1.6, -1.5));
  // porte fermée, lueur du feu sous la porte, fumée entre les lattes
  root.add(B(0.95, 2.1, 0.1, "#5a3a24", 0.9, 1.05, -2.3, 0.02, 0.6));
  root.add(M(new THREE.PlaneGeometry(0.95, 0.05), glow("#ff7a2a", 6), 0.9, 0.04, -2.28));
  root.add(M(new THREE.PlaneGeometry(0.9, 0.04), glow("#ffb46a", 2.5), 0.9, 2.12, -2.28));
  for (const y of [0.4, 1.0, 1.6]) root.add(M(new THREE.PlaneGeometry(0.9, 0.02), std("#ff5a14", 1, 0, "#ff5a14", 1.5, { transparent: true, opacity: 0.6 }), 0.9, y, -2.27));
  const fireL = new THREE.PointLight("#ff7a2a", 9, 8, 1.6); fireL.position.set(0.9, 0.5, -2.0); root.add(fireL);
  // fenêtre : lueur orange de l'extérieur
  root.add(M(new THREE.PlaneGeometry(1.1, 1.3), std("#120806", 0.5, 0, "#ff6a1a", 2.6), -2.5, 1.7, -0.9, 0, Math.PI / 2, 0));
  root.add(B(0.06, 1.3, 0.08, "#2a211e", -2.46, 1.7, -0.9, 0.01));
  const winL = new THREE.PointLight("#ff6a1a", 10, 7, 1.5); winL.position.set(-2.0, 1.6, -0.9); root.add(winL);
  // lit à une place, couvre-lit bleu, oreiller
  root.add(B(1.2, 0.4, 2.0, "#3c4d7a", -1.0, 0.2, -1.2, 0.05, 0.95));
  root.add(B(1.25, 0.12, 0.9, "#4b5f92", -1.0, 0.45, -1.4, 0.05, 0.95));
  root.add(B(0.6, 0.14, 0.3, "#e8e4da", -1.0, 0.56, -2.0, 0.05, 0.9));
  // petit placard et une chaise
  root.add(B(0.6, 1.0, 0.5, "#5a4330", 1.9, 0.5, -2.0, 0.02));
  // Lucas, debout, face à la porte
  root.add(person(CAST.hero, 0.2, -0.6, "scared", 81, { top: "#f2b51c", topDark: "#c98f10", hair: "messy" }).root);
  return { root, bg, fog: new THREE.FogExp2("#07080f", 0.04), cam: { P: V(0.15, 1.6, 4.2), T: V(0.0, 1.2, -1.4), fov: 50 } };
};

const buildDoor = (): Built => {
  const root = new THREE.Group(); const bg = "#0a0d1c";
  root.add(new THREE.HemisphereLight("#6f86c8", "#1a1622", 0.5));
  // couloir intérieur chaud, porte d'entrée ouverte sur la nuit bleue
  root.add(M(new THREE.BoxGeometry(6, 0.1, 6), std("#3a2e28", 0.85), 0, -0.05, -1.5));
  root.add(M(new THREE.BoxGeometry(6, 3.2, 0.15), std("#2b2f44", 0.95), 0, 1.6, -2.4));
  root.add(M(new THREE.BoxGeometry(0.15, 3.2, 6), std("#26293d", 0.95), -2.6, 1.6, -1.5));
  // porte ouverte : ouverture bleu nuit au centre
  root.add(M(new THREE.PlaneGeometry(1.4, 2.4), std("#0a1230", 0.9, 0, "#4f6cc0", 1.2), 0.9, 1.2, -2.3));
  root.add(B(0.12, 2.5, 0.12, "#4a3a2c", 0.1, 1.25, -2.28, 0.02)); root.add(B(0.12, 2.5, 0.12, "#4a3a2c", 1.6, 1.25, -2.28, 0.02));
  const moonDoor = new THREE.SpotLight("#8fa0ff", 22, 0, 0.5, 0.9, 1.5); moonDoor.position.set(3.0, 4.0, 2.5); moonDoor.target.position.set(0.5, 1.2, -1.5); moonDoor.castShadow = true; moonDoor.shadow.mapSize.set(2048, 2048);
  root.add(moonDoor, moonDoor.target);
  // cadre photo : le père en uniforme
  const pc = document.createElement("canvas"); pc.width = 128; pc.height = 160; const g = pc.getContext("2d")!;
  g.fillStyle = "#c8c0a8"; g.fillRect(0, 0, 128, 160); g.fillStyle = "#2d4f8c"; g.fillRect(34, 80, 60, 80); g.fillStyle = "#f1c7a0"; g.beginPath(); g.arc(64, 56, 22, 0, Math.PI * 2); g.fill();
  g.fillStyle = "#23407a"; g.fillRect(40, 26, 48, 14);
  const pt = new THREE.CanvasTexture(pc); pt.colorSpace = THREE.SRGBColorSpace;
  root.add(B(0.56, 0.7, 0.04, "#5a4330", -1.2, 1.75, -2.28, 0.02));
  root.add(M(new THREE.PlaneGeometry(0.46, 0.58), std("#ffffff", 0.7, 0, "#000", 0, { map: pt }), -1.2, 1.75, -2.25));
  // lampe chaude du couloir
  const lamp = new THREE.PointLight("#ffb46a", 6, 9, 1.6); lamp.position.set(-1.0, 2.6, -0.8); root.add(lamp);
  // vieux pompier (dans l'encadrement) et Lucas adulte
  const oldFire = person(CAST.c3, 0.85, -1.1, "sad", 91, { top: "#2d3b5c", topDark: "#1e2a44", sleeve: "#2d3b5c", pants: "#2a2e38", hair: "cap", hairCol: "#d8d8d8", capCol: "#1f3460", beard: "#d8d8d8", mustache: "#d8d8d8", radio: true }, 0);
  root.add(oldFire.root);
  root.add(person(CAST.hero, -0.4, -0.6, "worried", 92, { kid: false, top: "#2c3140", topDark: "#1c1f2a", sleeve: "#2c3140", hair: "messy" }).root);
  return { root, bg, fog: null, cam: { P: V(0.1, 1.6, 5.0), T: V(0.3, 1.25, -1.0), fov: 50 } };
};

const BUILD: Record<number, () => Built> = { 1: buildFamily, 2: buildCemetery, 3: buildHouseFire, 4: buildBedroom, 5: buildDoor };

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

// grain (bruit SVG), vignette chaude et rayures : léger, uniquement sur les flashbacks
const GRAIN = "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")";

export const AppelStill: React.FC<{ scene: number }> = ({ scene }) => {
  const old = FLASH.has(scene);
  return (
    <AbsoluteFill style={{ background: "#05060c" }}>
      <AbsoluteFill style={old ? { filter: "sepia(0.22) saturate(0.8) contrast(1.05) brightness(0.97)" } : {}}>
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
      <div style={{
        position: "absolute", left: 0, right: 0, top: 1715, transform: "translateY(-50%)", textAlign: "center",
        fontFamily: "Montserrat, 'Arial Black', Arial, sans-serif", fontWeight: 900, fontSize: 150, lineHeight: 1,
        color: "#FFE900", WebkitTextStroke: "16px #0A0A0A", paintOrder: "stroke fill", textShadow: "0 8px 0 #0A0A0A", textTransform: "uppercase",
      }}>{WORDS[scene - 1]}</div>
    </AbsoluteFill>
  );
};
