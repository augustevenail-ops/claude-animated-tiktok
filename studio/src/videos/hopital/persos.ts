// Personnages de « L'hôpital » : même dessin que le Mur (mur/people.ts, carte 600 x 1000, sol y = 975),
// avec des accessoires par rôle : blouse de patient, policier, médecin, petite fille, infectés (veines noires, yeux blancs, sang).
import type { Pen } from "../bridge/toon";
import { drawPerson, Person } from "../mur/people";

const INK = "#221e1d", OL = 11;
const cx = 300, R = 122, hy = 196, top = 338, hip = 612, tw = 150;
export type Role = "patient" | "police" | "medecin" | "fille" | "civil";
export type Perso = Person & { role: Role; infect?: number; bite?: boolean; mask?: boolean; gun?: boolean; blood?: number; bandage?: boolean };

const stroke = (g: CanvasRenderingContext2D, w = OL) => { g.lineWidth = w; g.strokeStyle = INK; g.stroke(); };
const rrect = (g: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number, r: number) => {
  g.beginPath(); g.moveTo(x0 + r, y0); g.lineTo(x1 - r, y0); g.quadraticCurveTo(x1, y0, x1, y0 + r); g.lineTo(x1, y1 - r); g.quadraticCurveTo(x1, y1, x1 - r, y1);
  g.lineTo(x0 + r, y1); g.quadraticCurveTo(x0, y1, x0, y1 - r); g.lineTo(x0, y0 + r); g.quadraticCurveTo(x0, y0, x0 + r, y0); g.closePath();
};
// tache de sang irrégulière (rouge sombre saturé, accent de la DA)
const blot = (g: CanvasRenderingContext2D, x: number, y: number, r: number, seed: number) => {
  g.beginPath(); for (let k = 0; k <= 14; k++) { const a = (k / 14) * Math.PI * 2, rr = r * (0.7 + 0.3 * Math.sin(seed * 7.3 + k * 2.1)); g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
  g.closePath(); g.fillStyle = "rgba(150,18,24,0.85)"; g.fill();
  g.beginPath(); g.ellipse(x + r * 0.3, y + r * 1.25, r * 0.16, r * 0.4, 0, 0, 7); g.fill();          // coulure
};

// ---- réseau de veines noires : arbre ramifié qui part du cou et monte sur tout le visage.
//      grow (0..1) = avancement : chaque segment a son instant d'apparition (distance depuis la racine), à animer progressivement.
type Seg = { x0: number; y0: number; x1: number; y1: number; t0: number; t1: number; w: number };
const NETS = new Map<string, Seg[]>();
const rng = (seed: number) => () => { seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const veinNet = (seed: number, neck: boolean): Seg[] => {
  const key = `${seed}${neck}`; if (NETS.has(key)) return NETS.get(key)!;
  const r = rng(seed * 977 + 13), segs: Seg[] = [], L = neck ? 120 : 300;
  const grow = (x: number, y: number, a: number, w: number, d: number, depth: number) => {   // réglages de la 1re version (validée)
    for (let i = 0; i < 40 && segs.length < 700; i++) {
      const len = 9 + r() * 9; a += (r() - 0.5) * 0.7;
      const nx = x + Math.cos(a) * len, ny = y + Math.sin(a) * len;
      if (!neck && Math.hypot(nx - cx, ny - hy) > R - 4) return;
      if (neck && ny < hy + R - 40) return;
      segs.push({ x0: x, y0: y, x1: nx, y1: ny, t0: d / L, t1: (d + len) / L, w }); d += len; x = nx; y = ny; w = Math.max(1.4, w * 0.93);
      if (r() < 0.2 && depth < 4) grow(x, y, a + (r() < 0.5 ? -1 : 1) * (0.5 + r() * 0.5), w * 0.75, d, depth + 1);
      if (d > L) return;
    }
  };
  if (neck) for (const x0 of [-40, -14, 12, 36]) grow(cx + x0, top + 10, -Math.PI / 2 + (r() - 0.5) * 0.5, 5.5, 0, 1);
  else for (const x0 of [-96, -70, -44, -18, 8, 34, 60, 88]) { const y0 = hy + Math.sqrt(R * R - x0 * x0) - 6;
    grow(cx + x0, y0, -Math.PI / 2 + x0 / R * 0.55 + (r() - 0.5) * 0.4, 6, 0, 0); }
  NETS.set(key, segs); return segs;
};
const drawVeins = (g: CanvasRenderingContext2D, grow: number, seed: number, neck = false) => {
  const segs = veinNet(seed, neck); g.save(); g.lineCap = "round";
  for (const pass of [0, 1]) for (const sg of segs) {                                  // passe 0 : halo sombre diffus ; passe 1 : veine nette
    if (grow <= sg.t0) continue;
    const f = Math.min(1, (grow - sg.t0) / (sg.t1 - sg.t0)), age = Math.min(1, (grow - sg.t0) * 4);
    g.beginPath(); g.moveTo(sg.x0, sg.y0); g.lineTo(sg.x0 + (sg.x1 - sg.x0) * f, sg.y0 + (sg.y1 - sg.y0) * f);
    if (pass === 0) { g.strokeStyle = `rgba(60,20,50,${0.18 * age})`; g.lineWidth = sg.w * 3.2; }
    else { g.strokeStyle = `rgba(22,10,26,${0.55 + 0.4 * age})`; g.lineWidth = sg.w; }
    g.stroke();
  }
  g.restore();
};

// contour des cheveux vus de face (même géométrie que mur/people.ts) : sert à arrêter les veines sous les cheveux
const hairPath = (g: CanvasRenderingContext2D, s: Person) => {
  if (s.hair === "bald") return false;
  g.beginPath();
  if (s.hair === "bob" || s.hair === "fringe") {
    const fr = hy - 4, side = hy + (s.hair === "bob" ? 44 : 22);
    g.moveTo(cx - R, side); g.lineTo(cx - R, hy - R); g.lineTo(cx + R, hy - R); g.lineTo(cx + R, side);
    g.lineTo(cx + R * 0.86, side); g.quadraticCurveTo(cx + R * 0.8, fr + 4, cx + R * 0.55, fr); g.lineTo(cx - R * 0.55, fr);
    g.quadraticCurveTo(cx - R * 0.8, fr + 4, cx - R * 0.86, side); g.closePath();
  } else { g.moveTo(cx - R, hy - 18); g.lineTo(cx - R, hy - R); g.lineTo(cx + R, hy - R); g.lineTo(cx + R, hy - 18); g.quadraticCurveTo(cx, hy - 62, cx - R, hy - 18); g.closePath(); }
  return true;
};

export const drawPerso = (p: Pen, s: Perso) => {
  const g = p.g; g.save(); g.lineCap = "round"; g.lineJoin = "round";
  // ---- derrière le corps : pans de blouse (médecin) / jupe de blouse (patient) qui dépassent sous la taille
  if (s.role === "medecin" || s.role === "patient") {
    const w = s.role === "medecin" ? tw / 2 + 22 : tw / 2 + 12, b = s.role === "medecin" ? hip + 170 : hip + 110;
    g.beginPath(); g.moveTo(cx - tw / 2, top + 60); g.lineTo(cx + tw / 2, top + 60); g.lineTo(cx + w, b); g.lineTo(cx - w, b); g.closePath();
    g.fillStyle = s.jacket; g.fill(); stroke(g);
  }
  const noTufts = s.bandage ? ({ g: new Proxy(g, {
    get: (t, k) => k === "ellipse" ? (...a: number[]) => { if (a[2] === 22 && a[3] === 34) return; (t.ellipse as unknown as (...b: number[]) => void)(...a); }
      : typeof (t as never)[k] === "function" ? ((t as never)[k] as (...b: unknown[]) => unknown).bind(t) : (t as never)[k],
    set: (t, k, v) => { (t as unknown as Record<string | symbol, unknown>)[k] = v; return true; } }) } as unknown as Pen) : p;
  drawPerson(noTufts, { ...s, expr: s.infect && s.infect > 0.5 ? "shock" : s.expr });
  const front = !s.back;
  // ---- détails de tenue
  if (s.role === "patient" && front) {                                   // blouse à petits motifs + bracelet d'hôpital
    g.fillStyle = "rgba(60,90,120,0.35)"; for (let i = 0; i < 18; i++) { g.beginPath(); g.arc(cx - 58 + (i % 4) * 38 + (Math.floor(i / 4) % 2) * 18, top + 60 + Math.floor(i / 4) * 52, 5, 0, 7); g.fill(); }
    rrect(g, cx - 104, hip - 52, cx - 72, hip - 38, 4); g.fillStyle = "#f4f4f6"; g.fill(); stroke(g, 4);
  }
  if (s.role === "police") {
    if (front) {
      rrect(g, cx - tw / 2 + 6, top + 92, cx + tw / 2 - 6, top + 128, 6); g.fillStyle = "#e9e6dc"; g.fill();         // bande « POLICE »
      g.fillStyle = "#26324f"; g.font = "bold 26px DejaVu Sans"; g.textAlign = "center"; g.fillText("POLICE", cx, top + 120);
      g.beginPath(); g.moveTo(cx - 44, top + 50); g.lineTo(cx - 30, top + 44); g.lineTo(cx - 16, top + 50); g.lineTo(cx - 20, top + 72); g.lineTo(cx - 40, top + 72); g.closePath();
      g.fillStyle = "#e3b23c"; g.fill(); stroke(g, 4);                                                                  // écusson doré
    }
    rrect(g, cx - tw / 2, hip - 44, cx + tw / 2, hip - 22, 4); g.fillStyle = "#15181f"; g.fill(); stroke(g, 5);   // ceinturon
    rrect(g, cx + tw / 2 - 30, hip - 36, cx + tw / 2 + 4, hip + 22, 6); g.fillStyle = "#15181f"; g.fill(); stroke(g, 5); // étui
    // casquette (couvre le haut du crâne)
    g.beginPath(); g.arc(cx, hy, R + 6, Math.PI + 0.32, -0.32); g.closePath(); g.fillStyle = "#1f2840"; g.fill(); stroke(g);
    g.beginPath(); g.ellipse(cx, hy - R * 0.42, R * 0.98, 15, 0, 0, Math.PI); g.fillStyle = "#11141c"; g.fill(); stroke(g, 7);
    if (front) { g.beginPath(); g.arc(cx, hy - R * 0.72, 12, 0, 7); g.fillStyle = "#e3b23c"; g.fill(); stroke(g, 4); }
    if (s.gun) {                                                                                        // arme dans la main tendue (pose reach)
      g.save(); g.translate(cx + 266, top + 40); rrect(g, -8, -30, 96, -6, 4); g.fillStyle = "#15181f"; g.fill(); stroke(g, 5);
      rrect(g, -6, -10, 18, 36, 4); g.fill(); stroke(g, 5); g.restore();
      g.beginPath(); g.arc(cx + 266, top + 40, 31, 0, 7); g.fillStyle = "#f2f2f4"; g.fill(); stroke(g);
    }
  }
  if (s.role === "medecin" && front) {
    g.strokeStyle = "#c9ccd2"; g.lineWidth = 5;                                                         // revers en V
    g.beginPath(); g.moveTo(cx - 34, top + 6); g.lineTo(cx - 6, top + 120); g.lineTo(cx + 22, top + 6); g.stroke();
    rrect(g, cx + 22, top + 150, cx + 64, top + 200, 5); g.fillStyle = "#e1e4e8"; g.fill(); stroke(g, 4);                // poche
    g.fillStyle = "#3a6ea5"; g.fillRect(cx + 30, top + 140, 6, 26); g.fillStyle = "#c0392b"; g.fillRect(cx + 42, top + 142, 6, 24); // stylos
    rrect(g, cx - 64, top + 150, cx - 22, top + 176, 4); g.fillStyle = "#3a6ea5"; g.fill(); stroke(g, 4);                // badge
    g.strokeStyle = "#5d6168"; g.lineWidth = 7; g.beginPath(); g.moveTo(cx - 40, top + 4); g.quadraticCurveTo(cx - 64, top + 120, cx - 18, top + 190); g.stroke(); // stéthoscope
    g.beginPath(); g.moveTo(cx + 40, top + 4); g.quadraticCurveTo(cx + 30, top + 80, cx - 18, top + 190); g.stroke();
    g.beginPath(); g.arc(cx - 18, top + 200, 13, 0, 7); g.fillStyle = "#9aa0a8"; g.fill(); stroke(g, 4);
  }
  if (s.role === "fille") {                                                                            // robe évasée + 2 couettes
    g.beginPath(); g.moveTo(cx - tw / 2, hip - 70); g.lineTo(cx + tw / 2, hip - 70); g.lineTo(cx + tw / 2 + 40, hip + 70); g.lineTo(cx - tw / 2 - 40, hip + 70); g.closePath();
    g.fillStyle = s.jacket; g.fill(); stroke(g);
    g.strokeStyle = "rgba(255,255,255,0.55)"; g.lineWidth = 6; g.beginPath(); g.moveTo(cx - tw / 2 - 30, hip + 52); g.lineTo(cx + tw / 2 + 30, hip + 52); g.stroke();
    for (const sx of [-1, 1]) { g.beginPath(); g.arc(cx + sx * (R + 6), hy + 10, 30, 0, 7); g.fillStyle = s.hairColor; g.fill(); stroke(g);
      g.beginPath(); g.arc(cx + sx * (R - 14), hy - 18, 10, 0, 7); g.fillStyle = "#d4533e"; g.fill(); stroke(g, 4); }      // élastiques rouges
  }
  if (s.mask && front) { rrect(g, cx - 64, hy + 44, cx + 64, hy + 106, 16); g.fillStyle = "#a8cfe0"; g.fill(); stroke(g, 6);
    g.strokeStyle = "#7fa9bd"; g.lineWidth = 3; for (const y of [hy + 62, hy + 78, hy + 94]) { g.beginPath(); g.moveTo(cx - 50, y); g.lineTo(cx + 50, y); g.stroke(); } }
  // ---- bandage : couvre tout le haut du crâne (bandes croisées, pas lisses) ; la bande basse est de travers
  //      (gauche de l'image : mange la moitié du sourcil ; droite : au-dessus du sourcil) ; mèches qui dépassent sur les côtés
  if (s.bandage) {
    const RB = R + 6, edge = (l: number, r: number) => (x: number) => l + (r - l) * (x - (cx - RB)) / (2 * RB);
    const above = (f: (x: number) => number) => { g.beginPath(); g.moveTo(cx - RB - 20, hy - RB - 30); g.lineTo(cx + RB + 20, hy - RB - 30);
      g.lineTo(cx + RB + 20, f(cx + RB + 20)); g.lineTo(cx - RB - 20, f(cx - RB - 20)); g.closePath(); };
    const strip = (tl: number, bl: number, tr: number, br: number, c0: string, c1: string, fib: number) => {
      const T = edge(tl, tr), B = edge(bl, br);
      g.beginPath(); g.moveTo(cx - RB - 20, T(cx - RB - 20)); g.lineTo(cx + RB + 20, T(cx + RB + 20)); g.lineTo(cx + RB + 20, B(cx + RB + 20)); g.lineTo(cx - RB - 20, B(cx - RB - 20)); g.closePath();
      const gr = g.createLinearGradient(0, Math.min(tl, tr), 0, Math.max(bl, br)); gr.addColorStop(0, c0); gr.addColorStop(1, c1); g.fillStyle = gr; g.fill();
      g.save(); g.clip(); g.strokeStyle = "rgba(150,140,120,0.42)"; g.lineWidth = 3;
      for (let k = -12; k < 26; k++) { const x = cx - RB + k * 15; g.beginPath(); g.moveTo(x, hy - RB - 20); g.lineTo(x + fib, hy + 40); g.stroke(); }
      g.fillStyle = "rgba(90,70,50,0.16)"; g.beginPath(); g.moveTo(cx - RB - 20, B(cx - RB - 20) - 9); g.lineTo(cx + RB + 20, B(cx + RB + 20) - 9);  // ombre du pli
      g.lineTo(cx + RB + 20, B(cx + RB + 20)); g.lineTo(cx - RB - 20, B(cx - RB - 20)); g.closePath(); g.fill(); g.restore();
      g.beginPath(); g.moveTo(cx - RB - 20, T(cx - RB - 20)); g.lineTo(cx + RB + 20, T(cx + RB + 20)); g.lineCap = "butt"; stroke(g, 6);
      g.beginPath(); g.moveTo(cx - RB - 20, B(cx - RB - 20)); g.lineTo(cx + RB + 20, B(cx + RB + 20)); stroke(g, 6); g.lineCap = "round";
    };
    // mèches sur les côtés, sous la bande (rien au-dessus des yeux)
    g.save(); g.beginPath(); g.arc(cx, hy, R - 1, 0, 7); g.clip();
    for (const sx of [-1, 1]) { g.beginPath(); g.moveTo(cx + sx * (R + 4), hy - 80); g.lineTo(cx + sx * R * 0.66, hy - 80);
      g.quadraticCurveTo(cx + sx * R * 0.6, hy - 24, cx + sx * R * 0.8, hy + (sx < 0 ? 38 : 2)); g.lineTo(cx + sx * (R + 4), hy + (sx < 0 ? 42 : 6));   // bas des mèches = hauteur des sourcils g.closePath();
      g.fillStyle = s.hairColor; g.fill(); stroke(g, 7); }
    g.restore();
    const main = [hy - 17, hy + 27, hy - 81, hy - 37];                                    // bande basse [haut G, bas G, haut D, bas D]
    g.save(); above(edge(main[0] + 2, main[2] + 2)); g.clip();                            // dôme de bandage au-dessus de la bande basse
    g.beginPath(); g.arc(cx, hy, RB, 0, 7); g.fillStyle = "#ebe4d4"; g.fill(); g.save(); g.clip();
    strip(hy - 190, hy - 128, hy - 150, hy - 108, "#f3eee3", "#ddd5c3", 22);              // couronne
    strip(hy - 132, hy - 84, hy - 104, hy - 62, "#efe8da", "#d9d1bf", -30);               // bande inclinée dans l'autre sens
    strip(hy - 92, hy - 50, hy - 128, hy - 88, "#f5f0e6", "#dcd4c2", 30);                 // bande dans le sens de la bande basse
    g.fillStyle = "rgba(150,18,24,0.55)"; g.beginPath(); g.ellipse(cx - 46, hy - 96, 11, 8, -0.3, 0, 7); g.fill();   // sang qui a traversé
    g.restore(); g.beginPath(); g.arc(cx, hy, RB, 0, 7); stroke(g); g.restore();
    // bande basse de travers (par-dessus), dépasse un peu du crâne
    g.save(); g.beginPath(); g.arc(cx, hy, RB + 6, 0, 7); g.clip();
    strip(main[0], main[1], main[2], main[3], "#f6f1e6", "#d8d1c0", 26);
    g.fillStyle = "rgba(150,18,24,0.9)"; g.beginPath(); g.ellipse(cx + 54, hy - 44, 15, 19, 0.2, 0, 7); g.fill();     // tache de sang + coulure
    g.beginPath(); g.ellipse(cx + 49, hy - 24, 3.5, 8, 0, 0, 7); g.fill();
    g.restore();
  }
  // ---- sang (taches sur la tenue)
  for (let i = 0; i < (s.blood ?? 0); i++) blot(g, cx - 40 + ((i * 53) % 90), top + 70 + ((i * 97) % 200), 14 + (i % 3) * 6, i + 1);
  // ---- morsure au cou
  if (s.bite) { g.beginPath(); g.ellipse(cx + 34, hy + R - 2, 24, 16, 0.3, 0, 7); g.fillStyle = "#7a0d14"; g.fill(); stroke(g, 5);
    blot(g, cx + 30, hy + R + 30, 16, 3); g.fillStyle = "#f4f4f6"; for (const dx of [-12, 0, 12]) { g.beginPath(); g.arc(cx + 34 + dx, hy + R - 10, 3, 0, 7); g.fill(); } }
  // ---- infection : peau verdâtre, veines noires qui montent du cou, yeux blancs vides, bouche ouverte
  const k = s.infect ?? 0;
  if (k > 0 && front) {
    g.save(); g.beginPath(); g.arc(cx, hy, R - 5, 0, 7); g.clip();
    g.fillStyle = `rgba(120,140,110,${0.42 * k})`; g.fillRect(cx - R, hy - R, 2 * R, 2 * R);
    { const hasHair = hairPath(g, s);                                                    // peau = tête moins cheveux (evenodd)
      if (hasHair) { g.arc(cx, hy, R - 5, 0, 7); g.clip("evenodd"); }
      drawVeins(g, Math.min(1, k / 0.7), 1); }
    g.restore(); g.save(); g.beginPath(); g.arc(cx, hy, R, 0, 7); g.clip();
    if (hairPath(g, s)) { g.lineWidth = OL; g.strokeStyle = INK; g.stroke(); }             // contour des cheveux redessiné par-dessus
    g.restore();
    if (k > 0.5) {
      for (const sx of [-1, 1]) { g.beginPath(); g.ellipse(cx + sx * 38, hy + 30, 15, 17, 0, 0, 7); g.fillStyle = "#e9e7d6"; g.fill(); stroke(g, 5);
        g.fillStyle = "rgba(160,20,30,0.85)"; g.beginPath(); g.arc(cx + sx * 38, hy + 32, 3.5, 0, 7); g.fill();
        g.strokeStyle = INK; g.lineWidth = 9; g.beginPath(); g.moveTo(cx + sx * 58, hy - 2); g.lineTo(cx + sx * 20, hy + 6); g.stroke(); }   // sourcils froncés
      g.beginPath(); g.moveTo(cx - 30, hy + 64); for (let i = 0; i <= 6; i++) g.lineTo(cx - 30 + i * 10, hy + 64 + (i % 2 ? 8 : 0));      // bouche en zigzag ouverte
      for (let i = 6; i >= 0; i--) g.lineTo(cx - 30 + i * 10, hy + 96 - (i % 2 ? 8 : 0)); g.closePath(); g.fillStyle = "#3a0a10"; g.fill(); stroke(g, 5);
      blot(g, cx + 8, hy + 104, 9, 5);
    }
    g.save(); g.beginPath(); g.rect(cx - 70, hy + R - 30, 140, top - hy - R + 40); g.clip(); drawVeins(g, Math.min(1, k / 0.7), 2, true); g.restore();   // cou
  }
  g.restore();
};
