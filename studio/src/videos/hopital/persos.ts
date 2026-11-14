// Personnages de « L'hôpital » : même dessin que le Mur (mur/people.ts, carte 600 x 1000, sol y = 975),
// avec des accessoires par rôle : blouse de patient, policier, médecin, petite fille, infectés (veines noires, yeux blancs, sang).
import type { Pen } from "../bridge/toon";
import { drawPerson, Person } from "../mur/people";

const INK = "#221e1d", OL = 11;
const cx = 300, R = 122, hy = 196, top = 338, hip = 612, tw = 150;
export type Role = "patient" | "police" | "medecin" | "fille" | "civil";
export type Perso = Person & { role: Role; infect?: number; bite?: boolean; mask?: boolean; gun?: boolean; blood?: number };

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

export const drawPerso = (p: Pen, s: Perso) => {
  const g = p.g; g.save(); g.lineCap = "round"; g.lineJoin = "round";
  // ---- derrière le corps : pans de blouse (médecin) / jupe de blouse (patient) qui dépassent sous la taille
  if (s.role === "medecin" || s.role === "patient") {
    const w = s.role === "medecin" ? tw / 2 + 22 : tw / 2 + 12, b = s.role === "medecin" ? hip + 170 : hip + 110;
    g.beginPath(); g.moveTo(cx - tw / 2, top + 60); g.lineTo(cx + tw / 2, top + 60); g.lineTo(cx + w, b); g.lineTo(cx - w, b); g.closePath();
    g.fillStyle = s.jacket; g.fill(); stroke(g);
  }
  drawPerson(p, { ...s, expr: s.infect && s.infect > 0.5 ? "shock" : s.expr });
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
    g.strokeStyle = `rgba(28,14,34,${0.9 * k})`; g.lineWidth = 4.5;
    const vein = (x: number, y: number, dx: number, dy: number, n: number) => { g.beginPath(); g.moveTo(x, y); let px = x, py = y;
      for (let i = 0; i < n; i++) { px += dx + Math.sin(i * 2.7 + x) * 9; py += dy; g.lineTo(px, py); if (i === 1) { g.moveTo(px, py); g.lineTo(px + dx * 1.6, py + dy * 0.4); g.moveTo(px, py); } } g.stroke(); };
    const h = Math.round(4 * k);
    vein(cx - 70, hy + R, -6, -26, h); vein(cx + 66, hy + R, 6, -26, h); vein(cx - 20, hy + R, -4, -30, h); vein(cx + 24, hy + R, 3, -28, h);
    g.restore();
    if (k > 0.5) {
      for (const sx of [-1, 1]) { g.beginPath(); g.ellipse(cx + sx * 38, hy + 30, 15, 17, 0, 0, 7); g.fillStyle = "#e9e7d6"; g.fill(); stroke(g, 5);
        g.fillStyle = "rgba(160,20,30,0.85)"; g.beginPath(); g.arc(cx + sx * 38, hy + 32, 3.5, 0, 7); g.fill();
        g.strokeStyle = INK; g.lineWidth = 9; g.beginPath(); g.moveTo(cx + sx * 58, hy - 2); g.lineTo(cx + sx * 20, hy + 6); g.stroke(); }   // sourcils froncés
      g.beginPath(); g.moveTo(cx - 30, hy + 64); for (let i = 0; i <= 6; i++) g.lineTo(cx - 30 + i * 10, hy + 64 + (i % 2 ? 8 : 0));      // bouche en zigzag ouverte
      for (let i = 6; i >= 0; i--) g.lineTo(cx - 30 + i * 10, hy + 96 - (i % 2 ? 8 : 0)); g.closePath(); g.fillStyle = "#3a0a10"; g.fill(); stroke(g, 5);
      blot(g, cx + 8, hy + 104, 9, 5);
    }
    // veines sur le cou / col
    g.strokeStyle = `rgba(28,14,34,${0.9 * k})`; g.lineWidth = 4; for (const dx of [-12, 10]) { g.beginPath(); g.moveTo(cx + dx, top + 8); g.lineTo(cx + dx * 1.5, hy + R - 10); g.stroke(); }
  }
  g.restore();
};
