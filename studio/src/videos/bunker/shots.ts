// Liste des plans (70), calée sur words.json : chaque coupe tombe 2 images avant le premier mot de sa phrase / de son accent.
// Pour chaque plan : décor, cadrage, mouvement de caméra (jamais deux fois de suite la même famille), image de référence,
// et l'état du décor / des personnages en fonction de u (0 → 1 dans le plan) et de t (temps global, s).
import * as THREE from "three";
import WORDS_RAW from "./words.json";
import { Town, ENTRANCE } from "./town";
import { Coupe, FAM, SHAFT } from "./under";
import { Sky, Cabin } from "./sky";
import { Lux, CINE_X, ZOO_X, CITY_Z } from "./lux";
import { Machine, TUN_X } from "./machine";
import { Actor, Pose } from "./chars";
import { smooth, clamp01, V } from "./common";

export type Word = { w: string; s: number; e: number };
export const WORDS = WORDS_RAW as Word[];
export const FPS = 30;
export const TOTAL = Math.round((WORDS[WORDS.length - 1].e + 1.4) * FPS);

export type SetId = "town" | "coupe" | "sky" | "cabin" | "lux" | "machine";
export type Framing = "PE" | "PM" | "PA" | "GP" | "TGP" | "PL" | "CPL" | "EP" | "SUB";
export type Move = "zoomIn" | "zoomOut" | "truckL" | "truckR" | "craneUp" | "craneDown" | "orbit" | "flyover" | "dive";
export const FAMILY: Record<Move, string> = { zoomIn: "zoomIn", zoomOut: "zoomOut", truckL: "truck", truckR: "truck", craneUp: "craneUp", craneDown: "craneDown", orbit: "drone", flyover: "drone", dive: "drone" };
export const FRAMING_FR: Record<Framing, string> = { PE: "Plan d'ensemble", PM: "Plan moyen", PA: "Plan américain", GP: "Gros plan", TGP: "Très gros plan", PL: "Plongée", CPL: "Contre-plongée", EP: "Plan épaule", SUB: "Plan subjectif" };
export const MOVE_FR: Record<Move, string> = { zoomIn: "Zoom avant", zoomOut: "Zoom arrière", truckL: "Travelling latéral gauche", truckR: "Travelling latéral droite", craneUp: "Montée verticale", craneDown: "Descente verticale", orbit: "Drone : orbite", flyover: "Drone : survol", dive: "Drone : plongée progressive" };

type Vec = [number, number, number];
type Cam = { t: Vec | ((u: number, t: number) => THREE.Vector3); p?: Vec | ((u: number, t: number) => THREE.Vector3); d?: number; az?: number; el?: number; fov?: number; amt?: number; t0?: Vec; d0?: number };
export type W = { town: Town; coupe: Coupe; sky: Sky; cabin: Cabin; lux: Lux; machine: Machine };
export type Shot = { w: number; set: SetId; fr: Framing; mv: Move; ref: number; desc: string; cam: Cam; st: (w: W, u: number, t: number) => void; shake?: (u: number) => number };

const put = (a: Actor, t: number, x: number, y: number, z: number, yaw: number, p: Pose = {}) => { a.root.visible = true; a.root.position.set(x, y, z); a.pose(t, { ...p, yaw }); };
const fam = (w: W, t: number, z: number, p: Pose = {}, yaw = 0, x0 = 0) => {
  const A = w.town.actors; put(A.dad, t, x0 - 2.5, 0, z, yaw, { expr: "worried", ...p }); put(A.narr, t, x0 - 0.8, 0, z + 0.3, yaw, { expr: "worried", ...p });
  put(A.bro, t, x0 + 0.7, 0, z + 0.4, yaw, { expr: "worried", ...p }); put(A.mom, t, x0 + 2.3, 0, z, yaw, { expr: "worried", ...p });
};
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const H = (u: number, a: number, b: number) => lerp(a, b, smooth(u));
// trajectoire de l'avion (vole vers +x en montant doucement)
const planeAt = (t: number) => V(-160 + (t - 15) * 38, 132 + (t - 15) * 2.4, 0);
const birdsAt = (t: number) => V(-40 + (t - 22) * 9, 128 + clamp01((t - 22.2) / 2.2) * 32, 60);
const tunnelNarr = (t: number) => V(TUN_X, 0, -6 - (t - 71.8) * 2.2);
const resto = (lx: number, lz: number) => V(-48 + lx, 0, CITY_Z + 100 + lz);

export const SHOTS: Shot[] = [
  { w: 0, set: "town", fr: "PE", mv: "flyover", ref: 1, desc: "La ville vue du ciel : maisons au premier plan, gratte-ciel derrière, nuage noir bas.",
    cam: { t: [0, 62, -90], d: 235, az: 0, el: 5, amt: 0.8 }, st: (w, u, t) => w.town.update(t, { cloudH: 150 }) },
  { w: 8, set: "coupe", fr: "PE", mv: "craneDown", ref: 2, desc: "Coupe du sol : sous la ville, les bunkers géants des riches (manoir, cinéma, ville souterraine).",
    cam: { t: [0, -50, 0], d: 150, az: 0, el: 3, amt: 0.6 }, st: (w, u, t) => w.coupe.update(t, { cloudH: 120, mach: 0.3 }) },
  { w: 12, set: "town", fr: "PM", mv: "truckR", ref: 3, desc: "La famille devant sa petite maison bleue, sous le nuage.",
    cam: { t: [0, 1.9, 33], d: 17, az: 0, el: 6, fov: 40 }, st: (w, u, t) => { w.town.update(t, { cloudH: 150 }); fam(w, t, 33, { expr: "sad" }); } },
  { w: 16, set: "coupe", fr: "PE", mv: "craneUp", ref: 4, desc: "Coupe : la cave minuscule de la famille, juste sous la maison ; au-dessus, la surface.",
    cam: { t: [0, -2.5, -4], d: 30, az: 0, el: 2, amt: 0.9 }, st: (w, u, t) => { w.coupe.update(t, { cloudH: 60, mach: 0.3 }); for (const a of Object.values(w.coupe.actors)) a.pose(t, { expr: "sad" }); } },
  { w: 21, set: "town", fr: "CPL", mv: "zoomOut", ref: 16, desc: "Il y a cinq ans : ciel bleu au-dessus des tours ; le nuage noir apparaît et envahit le ciel.",
    cam: { p: [26, 2, -62], t: [0, 95, -150], fov: 58 }, st: (w, u, t) => w.town.update(t, { cloudH: H(u, 700, 300), skyK: 1 - smooth(clamp01(u * 1.3)) }) },
  { w: 27, set: "town", fr: "TGP", mv: "orbit", ref: 1, desc: "Très gros plan sur le nuage : bouffées sombres aux reflets violets qui bouillonnent.",
    cam: { t: [0, 262, -150], d: 110, az: 20, el: -16, amt: 1.2 }, st: (w, u, t) => w.town.update(t, { cloudH: 300, boil: 0.6 }) },
  { w: 36, set: "town", fr: "PE", mv: "craneDown", ref: 1, desc: "Chaque jour, le nuage descend sur la ville.",
    cam: { t: [0, 70, -80], d: 260, az: 18, el: 12, amt: 0.8 }, st: (w, u, t) => w.town.update(t, { cloudH: H(u, 300, 235), cloudVit: 2 }) },
  { w: 44, set: "town", fr: "PA", mv: "zoomIn", ref: 3, desc: "Au début, les voisins et la famille regardent le nuage sans inquiétude.",
    cam: { t: [0, 1.6, 34], d: 12, az: -22, el: 3, fov: 40 }, st: (w, u, t) => { w.town.update(t, { cloudH: 235 }); fam(w, t, 33, { expr: "smile", headPitch: -0.35 });
      const A = w.town.actors; put(A.n1, t, 5, 0, 32, -0.4, { expr: "smile", headPitch: -0.3 }); put(A.n2, t, -5.2, 0, 32.5, 0.3, { expr: "happy", wave: "R" }); } },
  { w: 49, set: "sky", fr: "PE", mv: "truckL", ref: 5, desc: "Un avion de ligne survole les montagnes sous le nuage.",
    cam: { t: (u, t) => planeAt(t), d: 72, az: 10, el: 4, amt: 1.0 }, st: (w, u, t) => { w.sky.plane.position.copy(planeAt(t)); w.sky.plane.rotation.z = 0.06; w.sky.update(t, { cloudH: 175 }); } },
  { w: 55, set: "sky", fr: "CPL", mv: "zoomOut", ref: 5, desc: "Contre-plongée : l'avion grimpe et traverse le dessous du nuage par accident.",
    cam: { t: (u, t) => planeAt(t).add(V(0, 8, 0)), p: (u, t) => planeAt(16.6).add(V(30, -60, 70)), fov: 50 }, st: (w, u, t) => { const p = planeAt(t).add(V(0, u * 30, 0)); w.sky.plane.position.copy(p); w.sky.plane.rotation.z = 0.25; w.sky.update(t, { cloudH: 175 }); } },
  { w: 59, set: "sky", fr: "PM", mv: "orbit", ref: 6, desc: "L'avion se change en pierre, du nez jusqu'à la queue.",
    cam: { t: (u, t) => w0(t), d: 72, az: 40, el: 6, amt: 1.3 }, st: (w, u, t) => { w.sky.plane.position.copy(w0(t)); w.sky.plane.rotation.z = 0.32 - u * 0.25; w.sky.update(t, { cloudH: 205, stone: smooth(clamp01(u * 1.15)) }); } },
  { w: 66, set: "cabin", fr: "PL", mv: "zoomIn", ref: 7, desc: "Dans la cabine : tous les passagers sont devenus des statues de pierre.",
    cam: { t: [0, 1.0, 2], d: 13, az: 180, el: 10, fov: 55 }, st: (w, u, t) => w.cabin.update(t, { heroStone: 1, flicker: 1 }) },
  { w: 70, set: "cabin", fr: "TGP", mv: "truckR", ref: 7, desc: "Très gros plan : un passager se fige, la pierre lui monte jusqu'au visage.",
    cam: { t: [1.5, 1.25, -2.6], d: 1.7, az: 180, el: 2, fov: 40, amt: 0.6 }, st: (w, u, t) => w.cabin.update(t, { heroStone: H(u, 0.15, 1.05), flicker: 1 }) },
  { w: 71, set: "sky", fr: "PE", mv: "flyover", ref: 5, desc: "Une nuée d'oiseaux file vers le nuage.",
    cam: { t: (u, t) => birdsAt(t), d: 42, az: 120, el: 6, amt: 0.6 }, st: (w, u, t) => { w.sky.plane.position.set(0, -500, 0); w.sky.update(t, { cloudH: 160, birdsPos: birdsAt(t) }); } },
  { w: 77, set: "sky", fr: "CPL", mv: "craneUp", ref: 5, desc: "Contre-plongée : les oiseaux entrent dans le nuage.",
    cam: { t: (u, t) => birdsAt(t).add(V(0, 6, 0)), d: 55, az: 30, el: -28, amt: 0.5 }, st: (w, u, t) => { w.sky.plane.position.set(0, -500, 0); w.sky.update(t, { cloudH: 160, birdsPos: birdsAt(t) }); } },
  { w: 80, set: "sky", fr: "GP", mv: "zoomIn", ref: 6, desc: "Gros plan : les oiseaux se changent en pierre en plein vol.",
    cam: { t: (u, t) => birdsAt(t).add(V(0, -2, 0)), d: 26, az: -20, el: 2, fov: 42 }, st: (w, u, t) => { w.sky.plane.position.set(0, -500, 0); w.sky.update(t, { cloudH: 165, birdsPos: birdsAt(t), birdsStone: smooth(u * 1.1) }); } },
  { w: 87, set: "sky", fr: "PL", mv: "dive", ref: 6, desc: "Plongée : les oiseaux de pierre tombent du ciel vers la prairie.",
    cam: { t: (u) => birdsAt(26.3).add(V(0, -Math.min(150, (u * 1.15) ** 2 * 140) - 2, 0)), d: 50, az: 10, el: 9, amt: 1.0 }, st: (w, u, t) => { w.sky.plane.position.set(0, -500, 0); w.sky.update(t, { cloudH: 165, birdsPos: birdsAt(26.3), birdsStone: 1, birdsFall: u * 1.15 }); } },
  { w: 92, set: "coupe", fr: "PE", mv: "truckR", ref: 2, desc: "Coupe : sous chaque maison, on creuse un abri.",
    cam: { t: [0, -6, 0], d: 75, az: 0, el: 6, amt: 0.8 }, st: (w, u, t) => w.coupe.update(t, { cloudH: 200, mach: 0, dig: u }) },
  { w: 104, set: "lux", fr: "GP", mv: "zoomOut", ref: 9, desc: "Gros plan : un milliardaire en costume violet et chaîne en or, sûr de lui.",
    cam: { t: [4, 1.75, 12], d: 3.4, az: -15, el: 2, fov: 40 }, st: (w, u, t) => { w.lux.update(t, { power: 1 }); put(w.lux.actors.rich1, t, 4, 0, 12, 0, { expr: "smug", headYaw: -0.1 }); } },
  { w: 110, set: "coupe", fr: "PE", mv: "craneDown", ref: 2, desc: "Les abris les plus profonds : on descend le long de la coupe jusqu'à la ville souterraine.",
    cam: { t: (u) => V(0, lerp(-12, -70, smooth(u)), 0), d: 95, az: 0, el: 0, amt: 0 }, st: (w, u, t) => w.coupe.update(t, { cloudH: 190, mach: 0.3 }) },
  { w: 113, set: "lux", fr: "PE", mv: "flyover", ref: 8, desc: "Le manoir souterrain : villa blanche à baies dorées, piscine, faux ciel au plafond.",
    cam: { t: [-4, 6, -18], d: 70, az: 8, el: 20, amt: 0.6 }, st: (w, u, t) => { w.lux.update(t, { power: 1 }); const A = w.lux.actors; put(A.rich1, t, -4, 0, 10, 0.3, { expr: "happy", wave: "R" }); put(A.rich3, t, 6, 0, 12, -0.4, { expr: "smile" }); } },
  { w: 122, set: "lux", fr: "PM", mv: "truckL", ref: 8, desc: "La piscine, les transats, le parasol doré.",
    cam: { t: [-4, 1.4, 6], d: 24, az: -10, el: 12, amt: 0.9 }, st: (w, u, t) => { w.lux.update(t, { power: 1 }); const A = w.lux.actors; put(A.rich3, t, -9, 0, 15, 0.2, { expr: "happy" }); put(A.rich4, t, 1, 0, 11, 0.3, { expr: "smile", wave: "L" }); } },
  { w: 125, set: "lux", fr: "GP", mv: "zoomIn", ref: 9, desc: "La salle de cinéma privée : le milliardaire seul dans un fauteuil rouge.",
    cam: { t: [CINE_X + 1.5, 3.9, -1.6], d: 3.3, az: 195, el: 11, fov: 44 }, st: (w, u, t) => { w.lux.update(t, { power: 1 }); put(w.lux.actors.rich1, t, CINE_X + 1.5, 2.78, -1.6, Math.PI, { sit: true, expr: "happy", headYaw: 0.1 * Math.sin(t) }); } },
  { w: 129, set: "lux", fr: "PE", mv: "craneUp", ref: 13, desc: "Son zoo privé : girafe, lion, éléphant dans une grotte éclairée.",
    cam: { t: [ZOO_X + 3, 4, -3], d: 32, az: 0, el: 6, amt: 0.7 }, st: (w, u, t) => { w.lux.update(t, { power: 1 }); put(w.lux.actors.rich3, t, ZOO_X + 8, 0, 13, Math.PI - 0.4, { point: 0.3, expr: "happy" }); } },
  { w: 134, set: "lux", fr: "PL", mv: "orbit", ref: 10, desc: "Une ville entière sous terre, vue de haut, sous son soleil artificiel.",
    cam: { t: [0, 12, CITY_Z], d: 175, az: 0, el: 32, amt: 1.0 }, st: (w, u, t) => w.lux.update(t, { power: 1 }) },
  { w: 142, set: "lux", fr: "PM", mv: "truckR", ref: 13, desc: "Le restaurant : des riches attablés sous les parasols.",
    cam: { t: (u) => resto(-1, 14).add(V(0, 2, 0)), d: 17, az: 18, el: 9, amt: 0.8 }, st: (w, u, t) => { w.lux.update(t, { power: 1 }); const E = w.lux.extras; const p0 = resto(-10, 14.2), p1 = resto(-1, 14.2), p2 = resto(8, 14.2);
      put(E[0], t, p0.x + 1.9, 0, p0.z + 1.2, 0.6, { expr: "happy", talk: true }); put(E[1], t, p1.x + 1.9, 0, p1.z + 1.2, -0.5, { expr: "smile", wave: "R" }); put(E[2], t, p2.x - 1.9, 0, p2.z + 1.2, 0.4, { expr: "smug" }); } },
  { w: 145, set: "lux", fr: "PE", mv: "flyover", ref: 10, desc: "Le parc central, son étang et ses arbres.",
    cam: { t: [0, 3, CITY_Z + 10], d: 48, az: 15, el: 14, amt: 0.5 }, st: (w, u, t) => w.lux.update(t, { power: 1 }) },
  { w: 149, set: "lux", fr: "CPL", mv: "zoomOut", ref: 11, desc: "Contre-plongée : un milliardaire salue depuis sa terrasse, le soleil artificiel derrière lui.",
    cam: { t: [1.5, 29, CITY_Z + 111], d: 11, az: 10, el: -14, fov: 50 }, st: (w, u, t) => { w.lux.update(t, { power: 1 }); put(w.lux.extras[0], t, 3, 26, CITY_Z + 113, 0, { wave: "R", expr: "happy" }); } },
  { w: 151, set: "coupe", fr: "PM", mv: "zoomIn", ref: 4, desc: "Pendant ce temps, la famille serrée dans sa cave, sous une ampoule nue.",
    cam: { t: [0, -4.3, -9], d: 17, az: 0, el: 3, fov: 50 }, st: (w, u, t) => { w.coupe.update(t, { cloudH: 120, mach: 0.3 }); for (const a of Object.values(w.coupe.actors)) a.pose(t, { expr: "sad" }); } },
  { w: 156, set: "coupe", fr: "PE", mv: "zoomOut", ref: 2, desc: "Zoom arrière : la cave minuscule face aux bunkers géants.",
    cam: { t: [0, -55, 0], d: 150, t0: [0, -4, -6], d0: 18, az: 0, el: 1 }, st: (w, u, t) => { w.coupe.update(t, { cloudH: 120, mach: 0.3 }); for (const a of Object.values(w.coupe.actors)) a.pose(t, { expr: "sad" }); } },
  { w: 164, set: "town", fr: "EP", mv: "craneUp", ref: 3, desc: "Plan épaule : chaque matin, le garçon regarde le nuage au-dessus des toits.",
    cam: { p: [0.5, 1.95, 41.9], t: [-1.5, 13, 24], fov: 52, amt: 0.05 }, st: (w, u, t) => { w.town.update(t, { cloudH: 120 }); put(w.town.actors.narr, t, 0, 0, 41, Math.PI, { expr: "worried", headPitch: -0.45 }); } },
  { w: 167, set: "town", fr: "SUB", mv: "zoomIn", ref: 1, desc: "Plan subjectif : le nuage, vu d'en bas, se rapproche.",
    cam: { p: [0, 1.7, 40.6], t: [-4, 90, -40], fov: 62 }, st: (w, u, t) => w.town.update(t, { cloudH: H(u, 150, 128), boil: 0.4 }) },
  { w: 172, set: "town", fr: "CPL", mv: "truckL", ref: 1, desc: "Le plus haut gratte-ciel disparaît dans le nuage.",
    cam: { p: [36, 4, -88], t: [0, 175, -150], fov: 55, amt: 0.2 }, st: (w, u, t) => w.town.update(t, { cloudH: H(u, 270, 188), cloudVit: 2 }) },
  { w: 180, set: "sky", fr: "PE", mv: "flyover", ref: 5, desc: "Puis les montagnes : les sommets enneigés sont avalés.",
    cam: { p: [0, 90, 380], t: [0, 140, -600], fov: 55, amt: 0.15 }, st: (w, u, t) => { w.sky.plane.position.set(0, -500, 0); w.sky.update(t, { cloudH: H(u, 330, 240), birdsPos: V(0, -400, 0) }); } },
  { w: 183, set: "town", fr: "PE", mv: "craneDown", ref: 1, desc: "Le nuage n'est plus qu'à une centaine de mètres des maisons.",
    cam: { t: [0, 12, 0], d: 190, az: -15, el: 12, amt: 0.6 }, st: (w, u, t) => w.town.update(t, { cloudH: H(u, 110, 62) }) },
  { w: 193, set: "town", fr: "CPL", mv: "zoomOut", ref: 3, desc: "Contre-plongée : le nuage frôle le toit de la maison bleue.",
    cam: { p: [4, 1.1, 46], t: [0, 13, 26], fov: 52 }, st: (w, u, t) => { w.town.update(t, { cloudH: H(u, 52, 44) }); fam(w, t, 33.5, { expr: "scared", headPitch: -0.4 }); } },
  { w: 197, set: "town", fr: "PA", mv: "zoomIn", ref: 16, desc: "Les riches entrent dans le grand bunker ; les portes blindées se referment.",
    cam: { p: [2.6, 2.4, -1.2], t: [0, 2.6, -10], fov: 50 }, st: (w, u, t) => { w.town.update(t, { cloudH: 40, doors: 1 - smooth(clamp01((u - 0.25) / 0.75)) });
      const A = w.town.actors; put(A.rich1, t, -1.2, 0, lerp(-6.5, -11, u), Math.PI, { walk: 1 }); put(A.rich4, t, 1.3, 0, lerp(-5.5, -10.5, u), Math.PI, { walk: 1 }); } },
  { w: 205, set: "town", fr: "PM", mv: "truckR", ref: 16, desc: "La famille et les voisins frappent aux portes fermées et supplient.",
    cam: { p: [3.2, 2.5, -2.4], t: [-0.4, 2.1, -8.4], fov: 52, amt: 0.25 }, st: (w, u, t) => { w.town.update(t, { cloudH: 38, doors: 0 }); const A = w.town.actors;
      put(A.dad, t, -2.2, 0, -8.6, Math.PI, { bang: true }); put(A.narr, t, -0.6, 0, -8.5, Math.PI, { bang: true }); put(A.mom, t, 1.2, 0, -8.6, Math.PI, { bang: true }); put(A.bro, t, 2.6, 0, -8.2, Math.PI + 0.3, { armsUp: 0.6 });
      put(A.n1, t, -3.8, 0, -7.4, Math.PI - 0.3, { armsUp: 0.8 }); put(A.n3, t, 3.9, 0, -7.2, Math.PI + 0.4, { bang: true }); } },
  { w: 215, set: "lux", fr: "GP", mv: "orbit", ref: 9, desc: "Gros plan : à l'abri, le milliardaire refuse d'un signe de tête.",
    cam: { t: [-6, 1.75, 6], d: 3.2, az: 10, el: 2, fov: 40, amt: 0.8 }, st: (w, u, t) => { w.lux.update(t, { power: 1 }); put(w.lux.actors.rich1, t, -6, 0, 6, 0.1, { expr: "angry", headYaw: 0.45 * Math.sin(t * 7) }); } },
  { w: 218, set: "town", fr: "GP", mv: "zoomIn", ref: 3, desc: "Gros plan : le garçon remarque quelque chose d'étrange.",
    cam: { t: [3.8, 1.78, 36], d: 2.6, az: 25, el: 0, fov: 40 }, st: (w, u, t) => { w.town.update(t, { cloudH: 36 }); put(w.town.actors.narr, t, 3.8, 0, 36, 0.35, { expr: "focus", headYaw: -0.2 + 0.3 * smooth(u), headPitch: -0.1 }); } },
  { w: 226, set: "coupe", fr: "PE", mv: "craneUp", ref: 15, desc: "Coupe : les générateurs s'allument tout au fond, les câbles s'illuminent.",
    cam: { t: [0, -98, 0], d: 70, az: 0, el: 2, amt: 1.6 }, st: (w, u, t) => w.coupe.update(t, { cloudH: 40, mach: 0.25 + 0.75 * (Math.sin(t * 5) * 0.5 + 0.5) * smooth(u * 2) }) },
  { w: 236, set: "town", fr: "PL", mv: "dive", ref: 1, desc: "Plongée : à chaque impulsion, le nuage s'abat plus vite sur la ville.",
    cam: { t: [0, 4, 0], d: 110, az: 10, el: 8, amt: 0.6 }, st: (w, u, t) => w.town.update(t, { cloudH: H(u, 72, 42), boil: 1.2, cloudVit: 3 }) },
  { w: 241, set: "machine", fr: "PA", mv: "truckL", ref: 12, desc: "Le garçon, sac à dos et lampe, suit les câbles électriques.",
    cam: { t: (u, t) => tunnelNarr(t).add(V(0, 1.3, 0)), d: 6, az: 70, el: 4, fov: 46, amt: 0.6 }, st: (w, u, t) => { w.machine.update(t, { on: 0.6 }); const p = tunnelNarr(t); w.machine.narr.root.position.copy(p); w.machine.narr.pose(t, { walk: 1.1, yaw: Math.PI, expr: "worried" }); torch(w, p); } },
  { w: 250, set: "machine", fr: "PE", mv: "zoomIn", ref: 12, desc: "Le tunnel abandonné, interminable, aux lampes qui grésillent.",
    cam: { p: [TUN_X + 1.5, 2.2, 2], t: [TUN_X, 2.2, -70], fov: 50 }, st: (w, u, t) => { w.machine.update(t, { on: 0.6 }); const p = tunnelNarr(t).add(V(0, 0, -6)); w.machine.narr.root.position.copy(p); w.machine.narr.pose(t, { walk: 1.1, yaw: Math.PI }); torch(w, p); } },
  { w: 252, set: "machine", fr: "EP", mv: "craneUp", ref: 12, desc: "Plan épaule : une lueur violette au bout du tunnel.",
    cam: { p: [TUN_X + 0.7, 2.1, -146], t: [TUN_X - 0.6, 2.2, -205], fov: 48, amt: 0.03 }, st: (w, u, t) => { w.machine.update(t, { on: 0.8 }); const p = V(TUN_X, 0, -149 - u * 1.5); w.machine.narr.root.position.copy(p); w.machine.narr.pose(t, { walk: 0.6, yaw: Math.PI }); torch(w, p); } },
  { w: 259, set: "machine", fr: "CPL", mv: "zoomOut", ref: 12, desc: "Contre-plongée : la machine gigantesque, anneaux lumineux et colonnes violettes.",
    cam: { p: [-5, 4.2, 54], t: [0, 24, 0], fov: 55 }, st: (w, u, t) => { w.machine.update(t, { on: 1 }); w.machine.narr.root.position.set(-1.4, 3.6, 46); w.machine.narr.pose(t, { yaw: Math.PI, headPitch: -0.4, expr: "scared" }); torch(w, null); } },
  { w: 262, set: "coupe", fr: "PE", mv: "truckR", ref: 15, desc: "Coupe : la machine est reliée par des câbles à tous les bunkers de luxe.",
    cam: { t: [0, -55, 0], d: 150, az: 0, el: 2, amt: 0.5 }, st: (w, u, t) => w.coupe.update(t, { cloudH: 40, mach: 1 }) },
  { w: 272, set: "machine", fr: "PL", mv: "orbit", ref: 14, desc: "Plongée : vue de dessus de la machine et de ses tours de refroidissement.",
    cam: { t: [0, 6, 0], d: 66, az: 0, el: 62, amt: 1.2 }, st: (w, u, t) => { w.machine.update(t, { on: 1 }); w.machine.narr.root.position.set(0, 3.6, 30); w.machine.narr.pose(t, { yaw: Math.PI }); torch(w, null); } },
  { w: 279, set: "town", fr: "CPL", mv: "craneUp", ref: 14, desc: "Des colonnes d'énergie violettes montent de la ville et attirent le nuage.",
    cam: { p: [-14, 2, -36], t: [60, 42, -40], fov: 58, amt: 0.25 }, st: (w, u, t) => w.town.update(t, { cloudH: 36, beams: smooth(u * 2), boil: 0.8 }) },
  { w: 283, set: "machine", fr: "GP", mv: "truckL", ref: 14, desc: "Gros plan : les énormes tours de refroidissement crachent leur énergie.",
    cam: { t: [19, 16, 19], d: 19, az: 30, el: 6, amt: 0.6 }, st: (w, u, t) => { w.machine.update(t, { on: 1 }); torch(w, null); } },
  { w: 288, set: "town", fr: "PE", mv: "craneDown", ref: 1, desc: "L'énergie tire le nuage vers le sol.",
    cam: { t: [0, 14, -20], d: 125, az: -12, el: 8, amt: 0.6 }, st: (w, u, t) => w.town.update(t, { cloudH: H(u, 40, 28), beams: 1, boil: 1.2 }) },
  { w: 296, set: "lux", fr: "GP", mv: "zoomIn", ref: 13, desc: "Plus ils s'enrichissent : les piles de pièces d'or du milliardaire grandissent.",
    cam: { t: [22, 2.3, 19.6], d: 9, az: -24, el: 12, fov: 42 }, st: (w, u, t) => { w.lux.update(t, { power: 1, coins: smooth(u) }); put(w.lux.actors.rich1, t, 22, 0, 18.2, 0, { expr: "happy", armsUp: 0.15 }); } },
  { w: 301, set: "machine", fr: "TGP", mv: "orbit", ref: 12, desc: "Très gros plan : l'aiguille du cadran d'énergie grimpe dans le rouge.",
    cam: { t: [4.5, 6.0, 30], d: 1.9, az: -90, el: 4, fov: 40, amt: 0.7 }, st: (w, u, t) => { w.machine.update(t, { on: 1, needle: H(u, 0.45, 0.97) }); torch(w, null); } },
  { w: 305, set: "machine", fr: "GP", mv: "zoomIn", ref: 12, desc: "Gros plan : le garçon, décidé.",
    cam: { t: [2.6, 5.35, 31.6], d: 2.6, az: 55, el: 0, fov: 40 }, st: (w, u, t) => { w.machine.update(t, { on: 1, needle: 0.97 }); w.machine.narr.root.position.set(2.6, 3.6, 31.6); w.machine.narr.pose(t, { yaw: Math.PI / 2, expr: "focus", headYaw: -0.3 }); torch(w, null); } },
  { w: 312, set: "machine", fr: "TGP", mv: "craneDown", ref: 12, desc: "Très gros plan : il tire le levier d'urgence.",
    cam: { p: [1.0, 6.6, 33.6], t: [3.9, 5.8, 30.9], fov: 44, amt: 0.25 }, st: (w, u, t) => { const k = smooth(clamp01((u - 0.2) / 0.5)); w.machine.update(t, { on: 1, needle: 0.97, lever: k });
      w.machine.narr.root.position.set(3.0, 3.6, 30.9); w.machine.narr.pose(t, { yaw: Math.PI / 2, pull: k, expr: "shout" }); torch(w, null); } },
  { w: 317, set: "machine", fr: "PE", mv: "zoomOut", ref: 12, desc: "Boum ! La machine explose dans un éclair.",
    cam: { t: [0, 14, 0], d: 64, az: 12, el: 8, fov: 50 }, shake: (u) => 1.6 * Math.exp(-u * 4), st: (w, u, t) => { w.machine.update(t, { on: clamp01(1 - u * 3), boom: u * 1.1, lever: 1 }); torch(w, null); } },
  { w: 319, set: "coupe", fr: "PE", mv: "truckL", ref: 2, desc: "Coupe : les bunkers de luxe s'éteignent l'un après l'autre.",
    cam: { t: [0, -55, 0], d: 150, az: 0, el: 2, amt: 0.6 }, st: (w, u, t) => w.coupe.update(t, { cloudH: 32, mach: 0, power: 1 - smooth(clamp01(u * 1.4)) }) },
  { w: 328, set: "coupe", fr: "GP", mv: "craneUp", ref: 2, desc: "Gros plan : l'ascenseur doré s'arrête net entre deux étages, le milliardaire coincé.",
    cam: { t: (u) => V((SHAFT.x0 + SHAFT.x1) / 2, cabY(u) + 1.6, -6), d: 12, az: 0, el: 2, fov: 42, amt: 0.3 }, shake: (u) => (u > 0.35 && u < 0.45 ? 0.25 : 0),
    st: (w, u, t) => { w.coupe.update(t, { cloudH: 32, mach: 0, power: 0, cabY: cabY(u), cabOn: u < 0.4 ? 1 : (Math.sin(t * 40) > 0.3 && u < 0.6 ? 0.6 : 0.05) }); w.coupe.cabActor.pose(t, { expr: u < 0.4 ? "smug" : "scared", armsUp: u > 0.4 ? 0.5 : 0 }); } },
  { w: 331, set: "lux", fr: "PE", mv: "orbit", ref: 10, desc: "Le soleil artificiel s'éteint : la ville souterraine plonge dans le noir.",
    cam: { t: [0, 22, CITY_Z], d: 150, az: -20, el: 16, amt: 0.9 }, st: (w, u, t) => w.lux.update(t, { power: 1 - smooth(clamp01(u * 1.5)), alarm: clamp01(u * 2 - 1) * 0.3 }) },
  { w: 337, set: "lux", fr: "PM", mv: "zoomIn", ref: 13, desc: "Dans le manoir sans courant, sous la lumière rouge de secours, les milliardaires sont piégés.",
    cam: { t: [-2, 1.7, 8], d: 12, az: 8, el: 5, fov: 44 }, st: (w, u, t) => { w.lux.update(t, { power: 0, alarm: 1 }); const A = w.lux.actors;
      put(A.rich1, t, -4, 0, 9, 0.2, { expr: "scared", armsUp: 0.7 }); put(A.rich3, t, -1, 0, 8, -0.2, { expr: "scared" }); put(A.rich4, t, 1.8, 0, 9, -0.4, { expr: "worried", headYaw: 0.5 * Math.sin(t * 2) }); } },
  { w: 346, set: "town", fr: "CPL", mv: "craneUp", ref: 3, desc: "Contre-plongée : au-dessus de la famille, le nuage noir.",
    cam: { p: [0.5, 0.5, 41], t: [0, 4.5, 31], fov: 54, amt: 0.15 }, st: (w, u, t) => { w.town.update(t, { cloudH: 30 }); fam(w, t, 33.5, { expr: "worried", headPitch: -0.45 }); } },
  { w: 350, set: "town", fr: "GP", mv: "zoomOut", ref: 3, desc: "Gros plan : le visage du garçon s'éclaire.",
    cam: { t: [-0.8, 1.75, 33.8], d: 2.4, az: 12, el: 3, fov: 40 }, st: (w, u, t) => { w.town.update(t, { cloudH: 30 }); fam(w, t, 33.5, { expr: u < 0.5 ? "scared" : "happy", headPitch: -0.4 }); } },
  { w: 356, set: "town", fr: "PE", mv: "truckR", ref: 1, desc: "Le nuage noir s'immobilise au-dessus des toits.",
    cam: { t: [0, 12, 8], d: 95, az: 0, el: 10, amt: 0.5 }, st: (w, u, t) => w.town.update(t, { cloudH: 30, cloudVit: 0.15 }) },
  { w: 361, set: "town", fr: "PE", mv: "craneUp", ref: 1, desc: "Lentement, le nuage remonte, et la caméra monte avec lui.",
    cam: { t: (u) => V(0, lerp(25, 110, smooth(u)), -20), d: 150, az: 10, el: 6, amt: 0 }, st: (w, u, t) => w.town.update(t, { cloudH: H(u, 30, 160) }) },
  { w: 368, set: "town", fr: "PL", mv: "flyover", ref: 16, desc: "Plongée : le nuage s'ouvre, le ciel bleu revient sur la ville.",
    cam: { t: [0, 25, -60], d: 220, az: 0, el: 13, amt: 0.6 }, st: (w, u, t) => w.town.update(t, { cloudH: H(u, 170, 230), skyK: smooth(clamp01(u * 1.4)), hole: H(u, 40, 420) }) },
  { w: 381, set: "town", fr: "PM", mv: "truckL", ref: 16, desc: "La famille aide les riches à sortir de leur bunker.",
    cam: { t: [0, 2, -5], d: 14, az: 28, el: 9, amt: 0.6 }, st: (w, u, t) => { w.town.update(t, { cloudH: 240, skyK: 1, hole: 420, doors: 1 }); const A = w.town.actors;
      put(A.rich1, t, -0.8, 0, lerp(-9, -4, u), 0, { walk: 0.9, expr: "sad" }); put(A.rich4, t, 1.3, 0, lerp(-10, -5.5, u), 0, { walk: 0.9, expr: "worried" });
      put(A.dad, t, -2.6, 0, -2.5, -2.4, { point: 0.2, expr: "smile" }); put(A.mom, t, 3.4, 0, -2.6, 2.4, { point: 0.2, expr: "smile" }); put(A.narr, t, -4.2, 0, -1.2, -2.6, { wave: "R", expr: "happy" }); put(A.bro, t, 4.8, 0, -1.4, 2.7, { expr: "happy" }); } },
  { w: 391, set: "town", fr: "CPL", mv: "zoomIn", ref: 16, desc: "Contre-plongée : la nouvelle règle, « OUVERT À TOUS » au fronton de l'entrée dorée.",
    cam: { p: [0, 1.5, 20], t: [0, 12.5, -10], fov: 60 }, st: (w, u, t) => { w.town.update(t, { cloudH: 240, skyK: 1, hole: 420, doors: 1, banner: true }); crowd(w, t, 0.2); } },
  { w: 401, set: "town", fr: "PE", mv: "craneDown", ref: 16, desc: "Tout le monde, riches et pauvres, entre ensemble dans le bunker partagé.",
    cam: { t: [0, 3, -4], d: 24, az: 6, el: 16, amt: 0.5 }, st: (w, u, t) => { w.town.update(t, { cloudH: 240, skyK: 1, hole: 420, doors: 1, banner: true }); crowd(w, t, u); } },
  { w: 410, set: "town", fr: "PE", mv: "orbit", ref: 1, desc: "La ville au soleil : plus personne ne vit dans la peur.",
    cam: { t: [0, 40, -60], d: 240, az: -10, el: 10, amt: 1.0 }, st: (w, u, t) => w.town.update(t, { cloudH: 260, skyK: 1, hole: 480 }) },
  { w: 419, set: "lux", fr: "PM", mv: "zoomOut", ref: 8, desc: "La famille se baigne enfin dans une piscine souterraine, avec tout le monde.",
    cam: { t: [0, 1.0, -1], d: 17, az: 0, el: 12, fov: 44, d0: 8 }, st: (w, u, t) => { w.lux.update(t, { power: 1 }); const A = w.lux.actors;
      put(A.narr, t, -1.5, -1.15, -1, 0, { swim: true, expr: "happy" }); put(A.bro, t, 0.6, -0.6, 0, 0, { cheer: true, expr: "happy" }); put(A.dad, t, -4.5, -1.1, -3, 0.3, { swim: true, expr: "happy" }); put(A.mom, t, 3.4, -1.15, -2, -0.3, { wave: "L", expr: "happy" });
      put(A.n1, t, -8, 0.35, 7, 0.4, { cheer: true, expr: "happy" }); put(A.n2, t, 7.5, 0.35, 7.5, -0.3, { wave: "R", expr: "happy" }); put(A.rich1, t, 10.5, 0.35, 6, -0.6, { expr: "smile", wave: "R" }); } },
];
function w0(t: number) { return V(-40 + (t - 18) * 30, 160 + (t - 18) * 3, 0); }
function cabY(u: number) { return u < 0.4 ? lerp(-2, -9, u / 0.4) : -9 - 0.4 * Math.exp(-(u - 0.4) * 10) * Math.sin((u - 0.4) * 40); }
function torch(w: W, p: THREE.Vector3 | null) { const s = w.machine.torch; s.visible = !!p; if (p) { s.position.set(p.x + 0.4, 1.4, p.z - 0.4); s.target.position.set(p.x, 0.5, p.z - 12); } }
function crowd(w: W, t: number, u: number) {
  const A = w.town.actors, C = w.town.crowd, list = [A.dad, A.mom, A.narr, A.bro, A.rich1, A.rich2, A.rich3, A.n1, A.n2, A.n3, A.n4, ...C];
  list.forEach((a, i) => { const col = i % 8, row = Math.floor(i / 8), x = -9 + col * 2.6 + (row % 2) * 1.2, z0 = 0.5 + row * 2.2; const z = z0 - u * (row === 0 ? 5 : 3);
    put(a, t, x, 0, z, Math.PI * (u > 0.45 && row === 0 ? 1 : 0) + (i % 3 - 1) * 0.15, u > 0.45 && row === 0 ? { walk: 0.8 } : { cheer: i % 2 === 0, wave: i % 2 ? "R" : undefined, expr: "happy" }); });
}

// ---------------- minutage ----------------
export const START = SHOTS.map((s, i) => (i === 0 ? 0 : Math.round(WORDS[s.w].s * FPS) - 2));
export const shotAt = (f: number) => { let i = 0; while (i + 1 < SHOTS.length && START[i + 1] <= f) i++; return i; };
export const uOf = (i: number, f: number) => { const a = START[i], b = i + 1 < SHOTS.length ? START[i + 1] : TOTAL; return (f - a) / Math.max(1, b - a - 1); };

// ---------------- caméra ----------------
const vec = (x: Vec | ((u: number, t: number) => THREE.Vector3), u: number, t: number) => (typeof x === "function" ? x(u, t) : V(x[0], x[1], x[2]));
export const camAt = (i: number, f: number) => {
  const s = SHOTS[i], c = s.cam, u = uOf(i, f), t = f / FPS, k = 0.45 * u + 0.55 * smooth(u), amt = c.amt ?? 1;
  let T = vec(c.t, u, t), P: THREE.Vector3;
  let d: number, az: number, el: number;
  if (c.p) { const p = vec(c.p, u, t), o = p.clone().sub(T); d = o.length(); el = Math.asin(o.y / d) * 180 / Math.PI; az = Math.atan2(o.x, o.z) * 180 / Math.PI; }
  else { d = c.d!; az = c.az ?? 0; el = c.el ?? 0; }
  if (c.t0) T = V(c.t0[0], c.t0[1], c.t0[2]).lerp(T, k);
  if (c.d0 !== undefined) d = lerp(c.d0, d, k);
  let fov = c.fov ?? 45;
  const mv = s.mv, D = d * 0.3 * amt;
  if (mv === "zoomIn" && c.d0 === undefined) { d *= 1 - 0.32 * k * (c.p ? 0.6 : 1); fov *= 1 - 0.08 * k; }
  if (mv === "zoomOut" && c.d0 === undefined) { d *= 0.7 + 0.3 * k; fov *= 0.94 + 0.06 * k; }
  if (mv === "orbit") az += (k - 0.5) * 34 * amt;
  if (mv === "dive") { el += (k - 0.5) * 22 * amt; d *= 1 - 0.22 * k * amt; }
  const r = el * Math.PI / 180, a = az * Math.PI / 180;
  P = T.clone().add(V(Math.cos(r) * Math.sin(a), Math.sin(r), Math.cos(r) * Math.cos(a)).multiplyScalar(d));
  const fwd = T.clone().sub(P).normalize(), right = fwd.clone().cross(V(0, 1, 0)).normalize(), flat = V(fwd.x, 0, fwd.z).normalize();
  const off = V(0, 0, 0);
  if (mv === "truckL") off.addScaledVector(right, -(k - 0.5) * D);
  if (mv === "truckR") off.addScaledVector(right, (k - 0.5) * D);
  if (mv === "craneUp") off.y += (k - 0.5) * D;
  if (mv === "craneDown") off.y -= (k - 0.5) * D;
  if (mv === "flyover") off.addScaledVector(flat, (k - 0.5) * D * 1.4);
  P.add(off); T.add(off);
  // respiration de caméra (légère, à l'épaule) + secousse éventuelle
  const sh = (s.shake?.(u) ?? 0), n = 0.0025 * d + sh;
  P.add(V(Math.sin(t * 1.3) * n * 0.6, Math.sin(t * 1.7 + 1) * n * 0.4, 0)).add(V(Math.sin(t * 31) * sh, Math.cos(t * 27) * sh, 0));
  return { P, T, fov };
};

// contrôle des consignes (affiché au chargement et dans le rapport)
export const checkRules = () => {
  const errs: string[] = [];
  for (let i = 1; i < SHOTS.length; i++) if (FAMILY[SHOTS[i].mv] === FAMILY[SHOTS[i - 1].mv]) errs.push(`plans ${i} et ${i + 1} : même mouvement (${SHOTS[i].mv})`);
  for (let i = 3; i < SHOTS.length; i++) if ([0, 1, 2, 3].every((k) => SHOTS[i - k].fr === SHOTS[i].fr)) errs.push(`plans ${i - 2}-${i + 1} : 4 cadrages ${SHOTS[i].fr} de suite`);
  return errs;
};
export { FAM, ENTRANCE };
