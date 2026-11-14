// « L'hôpital » — épisode 1 : 38 plans calés sur la voix (words.json = productions/hopital-ep01/voix_ia/words.json).
// Découpage : episodes/hopital-ep01-decoupage.md. Lieux (m) :
//  - CHAMBRE : x ∈ [-3 ; 3], z ∈ [-3 ; 3], fenêtre extérieure dans le mur z = -3, vitre intérieure + porte dans le mur z = +3 ;
//  - COULOIR : z ∈ [3,2 ; 6,4], x ∈ [-40 ; 60] (porte de la chambre en x = -1,6), brancard en x = 30, mur du fond x = 60 (RÈGLE 1) ;
//  - EXTÉRIEUR : façade en z = -3,3 (x ∈ [-70 ; 70], 6 étages), parking z < -4, police vers z = -34 ;
//  - ESCALIER : colimaçon de béton centré en (200, 0, 0), palier z ∈ [3,5 ; 9,2] avec néons de secours au seuil z = 3,5 ;
//    couloir noir (x > 206, sortie de secours en x = 242, à gauche de l'écran face au héros), couloir blanc (x < 194, impasse vitrée en x = 164).
export const FPS = 30;
export type V3 = [number, number, number];
export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => { const u = clamp01(x); return u * u * (3 - 2 * u); };
export const glide = (u: number) => { const x = clamp01(u); return x * x * x * (x * (6 * x - 15) + 10); };
export const lerp3 = (a: V3, b: V3, u: number): V3 => [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u];
export const hash = (i: number, s = 0) => { const v = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return v - Math.floor(v); };
const lp = (a: number, b: number, u: number) => a + (b - a) * u;
const snap = (u: number, k = 0.3) => 1 - Math.pow(1 - clamp01(u / k), 3);

export const CORR_Z = 4.8, STAIR: V3 = [200, 0, 0], LAND_Z = 6.4;

// ---------------- temps (voix) ----------------
import RAW from "./words.json";
export const VOICE_AT = 0.15;
export type W = { w: string; s: number; e: number };
export const WORDS: W[] = (RAW as W[]).map((w) => ({ ...w, s: w.s + VOICE_AT, e: w.e + VOICE_AT }));
/** plans : nom, premier mot (indice words.json), lumière (0 intérieur, 1 nuit dehors, 2 escalier/néons, 3 couloir noir, 4 couloir blanc) */
export const PLANS: [string, number, number][] = [
  ["01", 0, 0], ["02", 6, 0], ["03", 8, 0], ["04a", 13, 1], ["04b", 17, 0], ["05", 18, 1], ["06", 23, 1], ["07", 31, 0], ["08", 34, 0], ["09", 39, 0],
  ["10", 45, 0], ["11a", 49, 0], ["11b", 54, 0], ["12", 58, 0], ["13", 63, 0], ["14", 69, 0], ["15", 76, 0], ["16a", 86, 0], ["16b", 90, 0], ["17", 98, 0],
  ["18", 106, 0], ["19", 111, 0], ["20", 119, 1], ["21", 134, 2], ["22", 140, 2], ["23", 150, 2], ["24", 153, 2], ["25", 161, 2], ["26", 173, 2], ["27", 177, 3],
  ["28", 191, 3], ["29", 194, 4], ["30", 203, 4], ["31a", 208, 2], ["31b", 215, 3], ["31c", 223, 4], ["31d", 232, 2], ["32", 235, 1],
];
export const NAME = PLANS.map((p) => p[0]);
export const LIGHT = PLANS.map((p) => p[2]);
export const TITLE_DUR = 2.8;
export const TITLE_AT = WORDS[PLANS[PLANS.length - 1][1]].s - 0.15;
export const END_T = Math.max(WORDS[WORDS.length - 1].e + 0.9, TITLE_AT + TITLE_DUR);
const starts = PLANS.map(([, wi], i) => (i === 0 ? 0 : WORDS[wi].s - 2 / FPS));
export type ShotDef = { i: number; a: number; b: number };
export const SHOTS: ShotDef[] = starts.map((a, i) => ({ i, a: Math.round(a * FPS), b: Math.round((i + 1 < starts.length ? starts[i + 1] : END_T) * FPS) }));
export const TOTAL = SHOTS[SHOTS.length - 1].b;
export const shotAt = (f: number) => SHOTS.find((s) => f >= s.a && f < s.b) ?? SHOTS[SHOTS.length - 1];
export const uOf = (i: number, f: number) => { const s = SHOTS[i]; return clamp01((f - s.a) / Math.max(1, s.b - s.a)); };
export const tW = (i: number) => WORDS[i].s;
/** choix A/B : A sur « couloir noir », B sur « lumière » */
const findW = (a: number, b: number, w: string) => { for (let i = a; i < b; i++) if (WORDS[i].w.toLowerCase().startsWith(w)) return i; return a; };
export const CARD_A = tW(findW(215, 223, "noir")), CARD_B = tW(findW(223, 232, "lumi"));
/** compteur du HUD : paliers irréguliers 73 -> 126 */
const HUD_STEPS: [number, number][] = [[0, 73], [6.08, 74], [7.86, 79], [17.68, 80], [20.4, 81], [21.57, 82], [31.48, 89], [35.14, 97], [37.62, 103], [44.1, 104], [52.58, 112], [56.64, 119], [60.64, 126]];
export const hudCount = (t: number) => { let n = 73; for (const [s, v] of HUD_STEPS) if (t >= s + VOICE_AT) n = v; return n; };

// ---------------- caméras ----------------
export type Cam = { pos: V3; look: V3; fov: number; roll: number };
const P = (pos: V3, look: V3, fov = 40, roll = 0): Cam => ({ pos, look, fov, roll });
type Cf = (u: number, t: number) => Cam;
const BED: V3 = [-1.4, 0.62, -1.2];                           // tête du héros couché (oreiller côté x = -2,4)
const HEAD_BED: V3 = [-2.0, 0.66, -1.2];
const HERO_DOOR: V3 = [-1.6, 0, 2.6];
const CAMS: Record<string, Cf> = {
  "01": (u) => P([-2.05, 0.88, -0.35 + 0.05 * u], [-2.05, 0.88, -1.2], 32, Math.PI / 2),
  "02": (u) => P(lerp3([-1.2, 1.05, 0.9], [-0.9, 1.45, 2.0], glide(u)), [-1.3, 0.95, -1.2], 52),
  "03": (u) => P([-0.25, 1.55, -0.75], [-1.1, 1.5, -1.2], 30),
  "04a": (u) => P([0.4, 1.6, -2.2], lerp3([-6, 0.6, -22], [6, 0.6, -22], u), 40),
  "04b": (u) => P([1.55, 1.55, 0.9], lerp3([-2, 1.2, 6.0], [4, 1.2, 6.0], u), 46),
  "05": (u) => { const k = 0.25 * u + 0.75 * glide(u), d = 18 * Math.pow(420 / 18, k); return P([d * 0.28, 3 + d * 0.55, -8 - d * 0.82], lerp3([0, 9, -3.3], [0, 0, -120], smooth(k)), lp(56, 50, k)); },
  "06": (u) => P([2 + 1.0 * u, 3.4, -38.2 - 0.4 * u], [1, 1.2, -16], 54),
  "07": (u) => P([0.75 + 0.06 * u, 0.55, 1.45], [1.2, 0.05, 0.55], 40),
  "08": (u) => P([-0.5 - 0.04 * u, 1.55, -1.15], [-1.1, 1.5, -1.2], 24),
  "09": (u) => P([2.8, 1.1 + 0.1 * u, 1.5], [0.7, 0.85 + 0.2 * u, -0.2], 46),
  "10": (u) => P([1.2, 1.4, 6.0], [HERO_DOOR[0] - 0.3, 1.0, 3.2 + 1.2 * u], 54),
  "11a": (u) => P([-2 + 5 * glide(u), 1.55, CORR_Z + 0.2], [16, 1.0, CORR_Z], 46),
  "11b": (u) => P([9.3 + 0.2 * u, 1.05, 3.45], [9.4, 0.65 - 0.25 * u, 5.6], 62),
  "12": (u) => P([10.0 + 0.02 * u, 0.24, 4.75], [10.02, 0.22, 5.6], 26, Math.PI / 2),
  "13": (u) => P(lerp3([9.7, 0.35, 3.5], [10.2, 0.22, 4.55], snap(u, 0.3)), [10.24, 0.2, 5.6], lp(48, 30, snap(u, 0.3)), Math.PI / 2),
  "14": (u) => P([5.2 - 0.4 * u, 1.5, 3.5], [9.6, 1.0, CORR_Z + 0.4], 56),
  "15": (u) => { const a = lp(-0.9, 0, glide(u)); return P([44 + 6 * glide(u), 1.6, CORR_Z], [44 + 30 * Math.cos(a), 1.9, CORR_Z + 30 * Math.sin(a)], 44); },
  "16a": (u) => P([19 + 2.4 * u, 1.6, 3.6], [30, 1.0, CORR_Z + 0.4], 50),
  "16b": (u) => P([28.6 + 1.0 * u, 0.3, CORR_Z - 1.3], [30, 0.35, 5.8], 50),
  "17": (u) => P([30.5 - 0.3 * u, 1.05, CORR_Z - 1.3], [30.3, 0.95, 5.9], 50),
  "18": (u) => P([-14.45 - 0.04 * u, 1.62, CORR_Z], [-15.4, 1.62, CORR_Z], 30),
  "19": (u) => P([2 - 1.5 * u, 1.2, CORR_Z + 0.3], [-20, 1.2, CORR_Z], 58),
  "20": (u) => { const a = clamp01(u / 0.15), b = smooth((u - 0.15) / 0.35), c = smooth((u - 0.5) / 0.35);
    const p0: V3 = [0.6, 1.6, -0.5], p1: V3 = [0.6, 1.8, -6], p2: V3 = [-24, 4, -9], p3: V3 = [-0.6, 4.6, -22.5];
    return P(lerp3(lerp3(lerp3(p0, p1, a), p2, b), p3, c), lerp3(lerp3([0.6, 1.6, -10], [-40, 2, -9], b), [-0.8, 0.9, -33.5], c), lp(lp(60, 70, b), 56, c)); },
  "21": (u, t) => { const a = t * 2.2; return P([STAIR[0] + 0.6 * Math.cos(a), 13 - 1.5 * u, STAIR[2] + 0.6 * Math.sin(a)], [STAIR[0], 0, STAIR[2]], 70, a); },
  "22": (u) => P([198.0, 1.35, 7.4 - 0.1 * u], [198.0, 1.25, 9.2], 38),
  "23": (u) => P([199.9, 1.1, 7.6], [199.3, 1.08, 9.0], 32),
  "24": (u) => P([202.5 - 4 * u, 0.14, 8.6], [200, 0.55, 3.0], 56),
  "25": (u) => { const g = glide(u); return P(lerp3([198.4, 1.3, 7.9], [203.8, 1.5, 4.0], g), lerp3([198.0, 1.2, 9.2], [203.8, 1.65, 9.2], g), lp(40, 46, g)); },
  "26": (u) => P([198.5, 1.62, 7.95], [198.5, 1.55, 8.8], 22),
  "27": (u) => P([208 + 26 * glide(u), 1.5, LAND_Z], [244, 1.4, LAND_Z], 46),
  "28": (u) => P([236 + 0.6 * u, 2.2, LAND_Z], [242, 2.55, LAND_Z], 34),
  "29": (u) => P([192 - 22 * glide(u), 1.5, LAND_Z], [160, 1.3, LAND_Z], 50),
  "30": (u) => P([169.5 - 0.4 * u, 1.6, LAND_Z - 1.1], [164, 1.4, LAND_Z + 0.3], 46),
  "31a": (u) => P([200 + 0.3 * u, 1.45, 3.6], [200, 1.25, LAND_Z + 1.0], 40),
  "31b": (u) => P([203.5 + 0.4 * u, 1.45, 4.2], [200, 1.25, LAND_Z + 0.5], 42),
  "31c": (u) => P([196.5 - 0.4 * u, 1.45, 4.2], [200, 1.25, LAND_Z + 0.5], 42),
  "31d": (u) => P([200, 1.2, 3.1 - 0.5 * u], [200, 1.1, LAND_Z + 0.6], 44),
  "32": (u) => P([0 + 4 * u, 6 + 1.5 * u, -60], [0, 9, -3.3], 52),
};
export const camAt = (i: number, f: number): Cam => {
  const c = CAMS[NAME[i]](uOf(i, f), f / FPS), a = 0.008, n = f * 0.021 + i * 3.1;
  return { ...c, look: [c.look[0] + a * Math.sin(n * 2.3), c.look[1] + a * Math.sin(n * 1.7 + 1), c.look[2] + a * Math.sin(n * 1.1)] };
};

// ---------------- tags (pilules) : [plan, texte, début s, fin s, couleur, x %, y %] ----------------
export const TAGS: [string, string, number, number, string, number, number][] = [
  ["01", "PATIENT 047", 0.3, 1.72, "#6fb6e6", 50, 64],
  ["05", "ZONE CONFINÉE", 6.2, 7.3, "#ff4a3d", 50, 40],
  ["06", "POLICE", 7.6, 9.36, "#4f8dff", 50, 60],
  ["07", "SIGNAL PERDU", 9.85, 10.7, "#ff9a3c", 56, 58],
  ["13", "INFECTÉ", 19.9, 20.72, "#c0121e", 60, 44],
  ["16b", "SURVIVANTE", 27.5, 28.86, "#f2c14e", 52, 56],
  ["19", "MENACE DÉTECTÉE", 33.12, 34.74, "#ff4a3d", 50, 40],
  ["20", "POLICE", 37.9, 39.7, "#4f8dff", 50, 46],
  ["28", "SORTIE DE SECOURS", 55.46, 56.36, "#3ddc84", 50, 60],
].map((x) => [x[0], x[1], (x[2] as number) + VOICE_AT, (x[3] as number) + VOICE_AT, x[4], x[5], x[6]] as [string, string, number, number, string, number, number]);
