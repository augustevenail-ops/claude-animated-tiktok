// « Le Téléphone rouge » : vidéo complète, 30 i/s, 1440 x 2560. Plans courts (2 à 4 s), mouvements de caméra,
// personnages animés (respiration, bras, parole), téléphone qui vibre, sous-titres mot par mot calés sur la voix.
// Flashbacks (nuit de l'incendie, chambre, vieux pompier) : léger effet ancien.
import React, { useEffect, useMemo } from "react";
import * as THREE from "three";
import { AbsoluteFill, continueRender, delayRender, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree, addAfterEffect } from "@react-three/fiber";
import { APPEL_W, APPEL_H, SCENES, REG, REGPHONE, resetReg } from "./Appel";
import WTS from "./words.json";
import { faceTex, Expr, Spec } from "../monstre/chars";

export const FPS = 30;
export const VIDEO_SEC = 76.0;
export const APPEL_VIDEO_FRAMES = Math.ceil(VIDEO_SEC * FPS);

// caméra : [px, py, pz, tx, ty, tz, fov] au début (a) et à la fin (b) du plan
type Cam = [number, number, number, number, number, number, number];
type Shot = { start: number; scene: string; a: Cam; b: Cam; m?: number[]; vib?: boolean; talk?: boolean; flash?: boolean; wave?: boolean; point?: boolean };

// préréglages de caméra : [px, py, pz, tx, ty, tz, fov]
const FW: Cam = [-2.6, 1.3, 4.3, 0.1, 1.1, -1.1, 46];   // famille, large de trois quarts
const FH: Cam = [0, 3.2, 4.8, 0, 0.9, -1.0, 50];        // famille, plongée
const PH: Cam = [0.3, 1.8, 2.9, 0, 0.98, -0.4, 40];     // téléphone
const FF: Cam = [-2.2, 1.2, 3.8, -0.6, 1.2, -1.8, 44];  // visages de la famille, contre-plongée légère
const CW: Cam = [1.5, 4.8, 8.5, 0, 0.9, -2.2, 44];      // cimetière, plongée large
const CM: Cam = [-0.3, 1.0, 1.8, -0.3, 1.2, -1.0, 40];  // cimetière, famille en contre-plongée
const B1: Cam = [1.4, 1.5, 3.4, 0.2, 1.1, -1.2, 50];    // chambre, Lucas
const B2: Cam = [0, 0.5, 1.2, 0.2, 1.6, -0.6, 50];      // chambre, contre-plongée basse
const B3: Cam = [1.6, 1.5, 3.4, 0.2, 1.3, -0.6, 42];    // chambre, Lucas parle
const BD: Cam = [-0.6, 1.4, 2.2, 0.9, 1.0, -2.3, 46];   // chambre, vers la porte
const IW: Cam = [0.6, 2.2, 10.5, -0.6, 2.8, -0.8, 50];  // incendie, large
const IL: Cam = [0.6, 0.9, 7.8, -0.6, 3.2, -1.0, 52];   // incendie, contre-plongée
const IT: Cam = [2.5, 1.4, 6.0, 3.0, 1.4, 2.0, 46];     // incendie, pompiers
const DL: Cam = [-1.6, 1.6, 4.8, -0.4, 1.3, -0.6, 46];  // entrée, Lucas
const DW: Cam = [-2.6, 1.6, 2.6, 0.3, 1.3, -1.0, 48];   // entrée, large
const DO: Cam = [0.2, 1.6, 4.2, 0.85, 1.3, -1.1, 42];   // entrée, vieux pompier

// m = [orbite en degrés, avancée(-)/recul(+), montée, zoom] : intensité propre à chaque plan
const sh = (start: number, scene: string, cam: Cam, m: number[], f: Partial<Shot> = {}): Shot => ({ start, scene, a: cam, b: cam, m, ...f });
const SHOTS: Shot[] = [                                               // calés sur words.json (voix 787591f6, texte final)
  sh(0.0, "family", FW, [6, -0.45, 0.2, -6], { vib: true }),          // accroche : poussée rapide
  sh(0.75, "cem", CW, [-10, -0.2, -1.2, 0]),                          // quelqu'un meurt : descente
  sh(1.65, "family", PH, [28, -0.1, 0, -4], { vib: true, point: true }), // il a droit à un seul appel : orbite rapide
  sh(3.2, "family", PH, [0, -0.5, 0, -10], { vib: true }),            // un seul : poussée forte
  sh(3.9, "cem", CM, [-14, 0.1, 0.3, 0]),                             // vingt-quatre heures, personne de son choix
  sh(6.4, "family", FH, [10, 0, 0.9, 0]),                             // chaque maison : montée
  sh(7.1, "family", PH, [-8, -0.3, 0, -8], { point: true }),          // téléphone rouge : zoom
  sh(8.2, "family", PH, [22, 0.05, 0.2, 0], { vib: true }),           // il ne sonne que pour ça
  sh(9.5, "cem", CW, [14, -0.15, 0.6, 0]),                            // après un enterrement
  sh(10.4, "family", FW, [-6, 0.3, 0.2, 4]),                          // toute la famille attend : recul lent
  sh(11.7, "family", FF, [4, -0.08, 0, -2]),                          // en silence : presque fixe
  sh(12.9, "bedCalm", B1, [-12, -0.3, 0.2, -4]),                      // Lucas a huit ans
  sh(15.2, "bedCalm", B2, [24, 0.05, 0.1, 0]),                        // chaque soir : orbite basse
  sh(17.2, "bedCalm", BD, [6, -0.35, 0, -4]),                         // s'il y a le feu, tu restes dans ta chambre
  sh(20.0, "bedCalm", B3, [-10, -0.2, 0, -6], { talk: true }),        // je viendrai te chercher
  sh(21.2, "bedCalm", B3, [18, 0.05, 0.3, 0], { talk: true }),        // Lucas répond toujours promis
  sh(23.0, "fire", IW, [-12, -0.25, -0.8, 0], { flash: true }),       // une nuit d'hiver
  sh(24.0, "fire", IL, [8, -0.35, 0, -6], { flash: true }),           // la maison brûle
  sh(25.1, "fire", IT, [30, -0.1, 0.4, 0], { flash: true, wave: true }), // son père fonce dans la fumée : orbite rapide
  sh(27.2, "bed", BD, [-6, -0.4, 0, -6], { flash: true }),            // les pompiers sortent Lucas : poussée vers la porte
  sh(29.3, "fire", IW, [6, 0.25, 1.0, 4], { flash: true }),           // ne ressort jamais : recul lent
  sh(31.3, "family", FW, [8, -0.35, 0, -4]),                          // le lendemain
  sh(32.7, "family", PH, [-16, 0.05, 0.2, 0]),                        // attend devant le téléphone rouge
  sh(34.0, "family", FF, [-10, -0.2, 0.2, -3]),                       // sa mère, sa grand-mère, Lucas
  sh(36.1, "family", PH, [0, -0.3, 0, -6]),                           // les heures passent
  sh(37.4, "family", PH, [0, -0.45, 0, -10]),                         // vingt-trois heures, minuit : plus serré
  sh(39.2, "family", FF, [3, -0.05, 0, -2]),                          // le téléphone ne sonne pas : immobile
  sh(40.9, "cem", CW, [-18, 0.2, 0.8, 0]),                            // le quartier chuchote
  sh(42.7, "family", FF, [-6, -0.35, 0, -6]),                         // il n'a appelé personne, il n'aimait personne
  sh(45.5, "bedCalm", B1, [14, -0.2, 0.3, -3]),                       // à l'école, on le répète à Lucas
  sh(47.3, "bedCalm", BD, [-8, -0.3, 0, -5]),                         // il arrête de pleurer
  sh(48.7, "bedCalm", B2, [4, 0.15, 0.5, 2]),                         // il arrête d'en parler : recul lent
  sh(50.1, "door", DL, [16, -0.2, 0.3, 0]),                           // dix ans plus tard
  sh(54.2, "door", DW, [-8, 0.15, 0.4, 2]),                           // le soir même
  sh(55.8, "door", DO, [0, -0.4, 0, -6]),                             // frappe à sa porte : poussée
  sh(57.2, "door", DO, [-14, -0.1, 0.2, 0], { flash: true, talk: true }), // la caserne a reçu un appel
  sh(61.4, "fire", IL, [-10, -0.25, 0.6, -4], { flash: true }),       // ton père était déjà mort
  sh(62.7, "family", PH, [12, -0.2, 0, -4], { flash: true }),         // sa voix était calme
  sh(64.0, "bed", BD, [4, -0.45, 0, -6], { flash: true }),            // la chambre du fond
  sh(66.1, "bed", B1, [-20, 0.05, 0.3, 0], { flash: true }),          // il attend, venez le chercher
  sh(68.2, "door", DL, [10, -0.25, 0, -4]),                           // il ne l'avait pas oublié
  sh(69.6, "family", PH, [-12, 0.3, 0.6, 4], { point: true }),        // son seul appel : recul lent
  sh(72.5, "door", DL, [8, 0.2, 1.0, 2]),                             // remet la photo au mur : montée finale
];

// facteur de recul appliqué à chaque caméra (1 = réglage précédent, plus serré)
const ZOOM_OUT = 1.9;

// visage aux yeux fermés (même visage, paupières closes)
const blinkCache = new Map<string, THREE.Texture>();
const blinkTex = (s: Spec, e: Expr) => {
  const key = `${s.name}_${e}`; const hit = blinkCache.get(key); if (hit) return hit;
  const base = faceTex(s, e);
  const cv = document.createElement("canvas"); cv.width = 256; cv.height = 256; const g = cv.getContext("2d")!;
  g.drawImage(base.image as CanvasImageSource, 0, 0);
  g.clearRect(82 - 26, 108 - 22, 52, 44); g.clearRect(174 - 26, 108 - 22, 52, 44);
  g.strokeStyle = "#1b1410"; g.lineWidth = 8; g.lineCap = "round";
  for (const x of [82, 174]) { g.beginPath(); g.moveTo(x - 18, 110); g.quadraticCurveTo(x, 116, x + 18, 110); g.stroke(); }
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; blinkCache.set(key, t); return t;
};

// mouvement de caméra propre à chaque plan : orbite autour du sujet, avancée ou recul, montée, zoom
const motion = (k: number) => ({
  orb: (k % 2 ? -1 : 1) * (8 + (k % 4) * 2.5),
  dol: k % 3 === 0 ? -0.12 : 0.08,
  crane: k % 2 ? 0.45 : -0.35,
  zoom: k % 3 === 1 ? -4 : 3,
});

// limites intérieures des pièces [xmin, xmax, ymin, ymax, zmin, zmax] (murs, plafond, sol avec marge)
const ROOM_BED: number[] = [-1.75, 3.6, 0.3, 3.0, -2.15, 7.0];
const BOUNDS: Record<string, number[]> = {
  family: [-3.6, 3.6, 0.3, 3.0, -4.75, 7.0], bed: ROOM_BED, bedCalm: ROOM_BED, door: ROOM_BED,
};
const OUTDOOR: number[] = [-1e9, 1e9, 0.3, 1e9, -1e9, 1e9];

const shotIndex = (t: number) => { let k = 0; for (let i = 0; i < SHOTS.length; i++) if (SHOTS[i].start <= t) k = i; return k; };
const shotEnd = (k: number) => (k + 1 < SHOTS.length ? SHOTS[k + 1].start : VIDEO_SEC);
const ease = (u: number) => { const x = Math.min(1, Math.max(0, u)); return x * x * (3 - 2 * x); };

const GRAIN = "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")";
const SUB_FONT = "Fredoka, Nunito, 'Varela Round', 'Arial Rounded MT Bold', Arial, sans-serif";

const VideoInner: React.FC<{ t: number }> = ({ t }) => {
  const f = useCurrentFrame();
  const { camera, scene: three, invalidate, gl } = useThree();
  const k = shotIndex(t), sh = SHOTS[k];
  const u = (t - sh.start) / (shotEnd(k) - sh.start);
  // décor, acteurs et téléphone : reconstruits seulement quand le décor change
  const built = useMemo(() => {
    resetReg();
    const b = SCENES[sh.scene]();
    return { b, actors: [...REG], phone: REGPHONE };
  }, [sh.scene]);

  gl.shadowMap.type = THREE.PCFSoftShadowMap;
  const b = built.b;
  three.background = new THREE.Color(b.bg);
  three.fog = b.fog;
  three.environmentIntensity = 0.2;
  const e = u;
  const c = sh.a.map((v, i) => v + (sh.b[i] - v) * e);
  const hx = Math.sin(t * 2.3) * 0.04, hy = Math.sin(t * 1.7 + 1) * 0.03;
  // recul de caméra : tous les plans sont plus larges, sujets dans la zone centrale (marges TikTok)
  const zo = ZOOM_OUT;
  const px = c[3] + (c[0] - c[3]) * zo, py = c[4] + (c[1] - c[4]) * zo, pz = c[5] + (c[2] - c[5]) * zo;
  // orbite autour du sujet, avancée/recul et montée sur le plan
  const mo = sh.m ? { orb: sh.m[0], dol: sh.m[1], crane: sh.m[2], zoom: sh.m[3] } : motion(k);
  const ang = mo.orb * (u - 0.5) * Math.PI / 180, ca = Math.cos(ang), sa = Math.sin(ang);
  const ox0 = px - c[3], oz0 = pz - c[5], dl = 1 + mo.dol * u;
  const ox = (ox0 * ca - oz0 * sa) * dl, oz = (ox0 * sa + oz0 * ca) * dl;
  const oy = (py - c[4]) + mo.crane * u;
  // collision caméra : rayon du sujet vers la caméra ; si un mur ou un objet est sur le trajet,
  // la caméra s'arrête devant et l'angle s'élargit pour garder le même cadrage
  const tgt = new THREE.Vector3(c[3] + hx * 0.5, c[4] + hy * 0.5, c[5]);
  const want = new THREE.Vector3(c[3] + ox + hx, c[4] + oy + hy, c[5] + oz);
  const dir = want.clone().sub(tgt); const dist = dir.length(); dir.normalize();
  let fov = c[6] + mo.zoom * u;
  // limites intérieures du décor : la caméra reste dans la pièce (ou au-dessus du sol dehors)
  const bx = BOUNDS[sh.scene] ?? OUTDOOR;
  let tmax = dist;
  for (let a = 0; a < 3; a++) {
    const p0 = [tgt.x, tgt.y, tgt.z][a], dv = [dir.x, dir.y, dir.z][a], lo = bx[a * 2], hi = bx[a * 2 + 1];
    if (dv > 1e-6) tmax = Math.min(tmax, (hi - p0) / dv); else if (dv < -1e-6) tmax = Math.min(tmax, (lo - p0) / dv);
  }
  {
    const d = Math.max(0.8, tmax);
    if (d < dist) {
      want.copy(tgt).addScaledVector(dir, d);
      fov = Math.min(78, (2 * Math.atan(Math.tan((fov * Math.PI) / 360) * dist / d) * 180) / Math.PI);
    }
  }
  const cm = camera as THREE.PerspectiveCamera;
  cm.position.copy(want); cm.lookAt(tgt);
  cm.fov = fov; cm.near = 0.05; cm.far = 200; cm.updateProjectionMatrix();
  // animation des personnages : respiration, bras levés (plans marqués), parole du vieux pompier
  for (const r of built.actors) {
    let w: "L" | "R" | "both" | undefined = sh.wave && (r.name === "guard" || r.name === "guard2") ? "both" : undefined;
    if (sh.talk && r.name === "hero") w = "R";
    if (sh.talk && r.name === "c3") w = "L";
    r.a.pose(t, { expr: r.expr, talk: !!sh.talk && r.name === "c3", wave: w, point: sh.point && r.name === "hero" ? 0.9 : undefined, headYaw: Math.sin(t * 0.9 + r.a.seed) * 0.35 });
    const m = r.a.face.material as THREE.MeshStandardMaterial;
    const ph = (t + r.a.seed * 0.37) % 3.2;
    const target = ph < 0.13 ? blinkTex(r.a.s, r.expr) : faceTex(r.a.s, r.expr);
    if (m.map !== target) { m.map = target; m.needsUpdate = true; }
  }
  // téléphone : vibration rapide pendant les plans marqués
  if (built.phone) {
    built.phone.rotation.z = sh.vib ? Math.sin(t * 2 * Math.PI * 11) * 0.012 : 0;
    built.phone.position.x = sh.vib ? Math.sin(t * 2 * Math.PI * 17) * 0.004 : 0;
  }
  useEffect(() => {
    const h = delayRender(`frame ${f}`); let done = false;
    const finish = () => { if (!done) { done = true; continueRender(h); } };
    const unsub = addAfterEffect(() => { unsub(); finish(); return true; });
    invalidate();
    return () => { unsub(); finish(); };
  }, [f, invalidate]);
  return <primitive object={b.root} dispose={null} />;
};

// sous-titre : mot par mot, minuscules, jaune #F5FF3B, contour noir arrondi, dézoom 130 % -> 100 % sur 0,2 s
const Caption: React.FC<{ t: number }> = ({ t }) => {
  let idx = -1;
  for (let i = 0; i < WTS.length; i++) if (WTS[i].s <= t) idx = i;
  if (idx < 0 || t > WTS[idx].e + 0.25) return null;
  const word = WTS[idx].w.replace(/[.,;:!?«»]/g, "").toLowerCase();
  const dt = t - WTS[idx].s;
  const s = dt < 0.2 ? 1.3 - 0.3 * (1 - Math.pow(1 - dt / 0.2, 3)) : 1;
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 1715, transform: `translateY(-50%) scale(${s})`, transformOrigin: "50% 50%" }}>
      <svg width={APPEL_W} height={260} viewBox={`0 0 ${APPEL_W} 260`} style={{ overflow: "visible", display: "block" }}>
        <text x="50%" y="190" textAnchor="middle" fontFamily={SUB_FONT} fontWeight={900} fontSize={170} letterSpacing="-4"
          fill="#F5FF3B" stroke="#000000" strokeWidth={28} strokeLinejoin="round" strokeLinecap="round" paintOrder="stroke fill">{word}</text>
      </svg>
    </div>
  );
};

export const AppelVideo: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const sh = SHOTS[shotIndex(t)];
  return (
    <AbsoluteFill style={{ background: "#05060c" }}>
      <AbsoluteFill style={sh.flash ? { filter: "sepia(0.22) saturate(0.8) contrast(1.05) brightness(0.97)" } : { filter: "saturate(1.4) brightness(1.06) contrast(1.04)" }}>
        <ThreeCanvas width={APPEL_W} height={APPEL_H} frameloop="demand" shadows gl={{ antialias: true, stencil: false, powerPreference: "high-performance" }} camera={{ fov: 45, near: 0.05, far: 200 }}>
          <VideoInner t={t} />
        </ThreeCanvas>
      </AbsoluteFill>
      {sh.flash && <>
        <AbsoluteFill style={{ backgroundImage: GRAIN, opacity: 0.1, mixBlendMode: "overlay" }} />
        <AbsoluteFill style={{ background: "#c89a5a", opacity: 0.07, mixBlendMode: "multiply" }} />
        <AbsoluteFill style={{ background: "radial-gradient(ellipse at center, rgba(0,0,0,0) 55%, rgba(30,18,6,0.5) 100%)" }} />
      </>}
      <Caption t={t} />
    </AbsoluteFill>
  );
};
