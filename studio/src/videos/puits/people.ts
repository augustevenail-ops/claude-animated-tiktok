// Personnages du « Puits » : copie de mur/people.ts (style v2 validé) + tenues du désert : robe longue (Anciens, marchands),
// barbe blanche, foulard / turban, accessoires (jarre sur la tête, bâton, cor, lanterne, sac du tirage).
// Style v2, calqué sur les références utilisateur du 2026-11-13 (docs/STYLE_PERSONNAGES.md) :
//  - tête = grand cercle blanc nacré (reflet net au centre, bord gris), gros contour noir constant (le même partout) ;
//  - cheveux = casque-bol en aplat (frange droite au-dessus des yeux, pans sur les joues), contour noir ;
//  - yeux = 2 petits ovales noirs verticaux (petit reflet), souvent des cernes violets ; bouche = tiret minuscule ;
//  - petit col blanc rectangulaire ; torse = rectangle arrondi plus étroit que la tête, capuche = gros bourrelet plus foncé autour du col ;
//  - bras = tubes de la couleur du sweat, mains = gros ronds blancs ; jambes longues et fines, chaussures = ovales brun foncé.
// Dessin 600 x 1000, sol à y = 975 (compatible Pool/Actor).
import type { Pen } from "../bridge/toon";

const INK = "#221e1d", OL = 11;
export type Pose = "stand" | "reach" | "armsUp" | "handMouth" | "run";
export type Expr = "calm" | "worry" | "fear" | "shock" | "tired" | "relief" | "frown";
export type Person = {
  pose: Pose; expr: Expr; back?: boolean; blink?: boolean; look?: number; step?: number;
  jacket: string; pants: string; shoes: string; hair: "bob" | "fringe" | "spiky" | "bun" | "ponytail" | "bald"; hairColor: string; hood?: boolean;
  /** robe jusqu'aux chevilles (couleur du torse) ; beard = couleur de la barbe ; scarf = foulard qui couvre les cheveux (couleur) ;
   *  sash = ceinture de tissu ; prop = accessoire */
  robe?: boolean; beard?: string; scarf?: string; sash?: string; prop?: "jar" | "staff" | "horn" | "lantern" | "bag";
  /** style VIDEO_01 (héros) : grosse tête ronde lumineuse, corps carré, bonnet / écharpe, badge numéroté */
  ref?: boolean; cap?: string; wrap?: string; badge?: string; turban?: string;
};
const hex = (c: string) => { const n = parseInt(c.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const shade = (c: string, k: number) => `rgb(${hex(c).map((v) => Math.max(0, Math.min(255, Math.round(v * k)))).join(",")})`;
const stroke = (g: CanvasRenderingContext2D) => { g.lineWidth = OL; g.strokeStyle = INK; g.stroke(); };
const tube = (g: CanvasRenderingContext2D, pts: number[][], w: number, fill: string) => {
  g.lineCap = "round"; g.lineJoin = "round";
  const path = () => { g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (const q of pts.slice(1)) g.lineTo(q[0], q[1]); };
  path(); g.strokeStyle = INK; g.lineWidth = w + 2 * OL; g.stroke(); path(); g.strokeStyle = fill; g.lineWidth = w; g.stroke();
};
const ball = (g: CanvasRenderingContext2D, x: number, y: number, r: number, fill: string) => { g.beginPath(); g.arc(x, y, r, 0, 7); g.fillStyle = fill; g.fill(); stroke(g); };
const rrect = (g: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number, r: number) => {
  g.beginPath(); g.moveTo(x0, y1); g.lineTo(x0, y0 + r); g.quadraticCurveTo(x0, y0, x0 + r, y0); g.lineTo(x1 - r, y0); g.quadraticCurveTo(x1, y0, x1, y0 + r); g.lineTo(x1, y1); g.closePath();
};

// ---- style VIDEO_01 (docs/STYLE_VIDEO01.md) pour toi et ton frère : grosse tête ronde blanche lumineuse avec halo,
// 2 petits yeux ovales noirs très écartés, pas de bouche (petit « o » si peur), frange droite, bonnet côtelé, corps carré
// d'une seule couleur, écharpe qui pend, badge crème numéroté ; bras fins, mains rondes sombres ; contour fin.
const RL = "#2a2420", ROL = 6;
const drawRef = (p: Pen, s: Person) => {
  const g = p.g, cx = 300, R = 150, hy = 196, top = 352, hip = 668, tw = 214, J = s.jacket;
  const stp = Math.sin((s.step ?? 0) * Math.PI * 2);
  const line = (w = ROL) => { g.lineWidth = w; g.strokeStyle = RL; g.stroke(); };
  const limb = (pts: number[][], w: number, c: string) => { g.lineCap = "round"; g.lineJoin = "round";
    const path = () => { g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (const q of pts.slice(1)) g.lineTo(q[0], q[1]); };
    path(); g.strokeStyle = RL; g.lineWidth = w + 2 * ROL; g.stroke(); path(); g.strokeStyle = c; g.lineWidth = w; g.stroke(); };
  g.save();
  // jambes fines + chaussures
  const feet = s.pose === "run" ? [-70 - 16 * stp, 70 + 16 * stp] : [-38, 38];
  feet.forEach((fx, i) => { const hx = cx + (i ? 44 : -44); limb([[hx, hip - 10], [cx + fx, 940]], 34, shade(s.pants, 1));
    g.beginPath(); g.ellipse(cx + fx + (i ? 8 : -8), 954, 34, 17, 0, 0, 7); g.fillStyle = s.shoes; g.fill(); line(); });
  // bras
  const shL = [cx - tw / 2 + 8, top + 34], shR = [cx + tw / 2 - 8, top + 34];
  const hang = (sh: number[], sx: number) => [sh, [sh[0] + sx * 18, top + 170], [sh[0] + sx * 14, hip - 20]];
  const armL = s.pose === "armsUp" ? [shL, [cx - 150, top - 90], [cx - 120, top - 230]] : s.pose === "run" ? [shL, [cx - 150, top + 130 - 40 * stp], [cx - 100, top + 230 - 50 * stp]] : hang(shL, -1);
  const armR = s.pose === "armsUp" ? [shR, [cx + 150, top - 90], [cx + 120, top - 230]] : s.pose === "reach" ? [shR, [cx + 190, top + 40], [cx + 276, top + 44]]
    : s.pose === "handMouth" ? [shR, [cx + tw / 2 + 40, top + 130], [cx + 40, hy + 80]] : s.pose === "run" ? [shR, [cx + 150, top + 130 + 40 * stp], [cx + 100, top + 230 + 50 * stp]] : hang(shR, 1);
  // torse carré (aplat + côté ombré)
  rrect(g, cx - tw / 2, top, cx + tw / 2, hip, 26);
  { const cg = g.createLinearGradient(cx - tw / 2, 0, cx + tw / 2, 0); cg.addColorStop(0, shade(J, 1.06)); cg.addColorStop(0.62, J); cg.addColorStop(0.63, shade(J, 0.84)); cg.addColorStop(1, shade(J, 0.8)); g.fillStyle = cg; g.fill(); line(); }
  if (!s.back) { g.beginPath(); g.moveTo(cx, top + 30); g.lineTo(cx, hip - 6); g.strokeStyle = shade(J, 0.66); g.lineWidth = 5; g.stroke(); }   // fermeture
  g.beginPath(); g.moveTo(cx - tw / 2 + 4, hip - 40); g.lineTo(cx + tw / 2 - 4, hip - 40); g.strokeStyle = shade(J, 0.66); g.lineWidth = 5; g.stroke();   // ceinture
  // col (anneau plus sombre)
  g.beginPath(); g.ellipse(cx, top + 6, 74, 26, 0, 0, 7); g.fillStyle = shade(J, 0.7); g.fill(); line();
  // écharpe : tour du cou + pan qui pend sur la poitrine
  if (s.wrap) { const w = s.wrap; g.beginPath(); g.ellipse(cx, top + 4, 90, 32, 0, 0, 7); g.fillStyle = w; g.fill(); line();
    if (!s.back) { rrect(g, cx + 18, top + 14, cx + 62, top + 214, 6); g.fillStyle = shade(w, 0.9); g.fill(); line();
      g.strokeStyle = shade(w, 0.7); g.lineWidth = 4; for (const y of [top + 196, top + 204]) { g.beginPath(); g.moveTo(cx + 22, y); g.lineTo(cx + 58, y); g.stroke(); } } }
  // badge crème numéroté
  if (s.badge && !s.back) { rrect(g, cx - 92, top + 120, cx - 12, top + 156, 4); g.fillStyle = "#d8cdb4"; g.fill(); g.lineWidth = 3; g.strokeStyle = RL; g.stroke();
    g.fillStyle = "#3a302a"; g.font = "bold 24px monospace"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(s.badge, cx - 52, top + 139); }
  // bras + mains rondes sombres
  for (const a of [armL, armR]) { limb(a, 30, shade(J, 0.92)); const h = a[a.length - 1]; g.beginPath(); g.arc(h[0], h[1], 25, 0, 7); g.fillStyle = "#3a2a22"; g.fill(); line(); }
  // halo autour de la tête
  { const hl = g.createRadialGradient(cx, hy, R * 0.92, cx, hy, R * 1.6); hl.addColorStop(0, "rgba(255,244,222,0.6)"); hl.addColorStop(1, "rgba(255,244,222,0)");
    g.fillStyle = hl; g.beginPath(); g.arc(cx, hy, R * 1.6, 0, 7); g.fill(); }
  // tête : sphère blanche lisse et parfaitement ronde (comme les modèles et les Anciens) : reflet au centre-haut, bord gris chaud
  const hg = g.createRadialGradient(cx - R * 0.12, hy - R * 0.22, 6, cx, hy, R); hg.addColorStop(0, "#ffffff"); hg.addColorStop(0.5, "#f5f2ec"); hg.addColorStop(0.85, "#d9d4ca"); hg.addColorStop(1, "#bcb5a8");
  g.beginPath(); g.arc(cx, hy, R, 0, 7); g.fillStyle = hg; g.fill();
  g.save(); g.beginPath(); g.arc(cx, hy, R, 0, 7); g.clip();
  g.globalAlpha = 0.55; g.fillStyle = "#ffffff"; g.beginPath(); g.ellipse(cx - R * 0.08, hy - R * 0.12, R * 0.42, R * 0.34, 0, 0, 7); g.fill(); g.globalAlpha = 1;
  // turban rouge discret : calotte qui épouse le haut de la sphère + 2 plis
  if (s.turban) { const t = s.turban, ty = hy - R * 0.42;
    g.beginPath(); g.moveTo(cx - R, ty + 16); g.quadraticCurveTo(cx, ty - 22, cx + R, ty + 16); g.lineTo(cx + R, hy - R); g.lineTo(cx - R, hy - R); g.closePath();
    const tg = g.createLinearGradient(0, hy - R, 0, ty + 16); tg.addColorStop(0, shade(t, 1.1)); tg.addColorStop(1, shade(t, 0.85)); g.fillStyle = tg; g.fill();
    g.strokeStyle = RL; g.lineWidth = ROL; g.beginPath(); g.moveTo(cx - R, ty + 16); g.quadraticCurveTo(cx, ty - 22, cx + R, ty + 16); g.stroke();
    g.strokeStyle = shade(t, 0.62); g.lineWidth = 5; g.beginPath(); g.moveTo(cx - R * 0.8, ty - 6); g.quadraticCurveTo(cx - R * 0.1, hy - R * 0.98, cx + R * 0.7, hy - R * 0.72); g.stroke();
    g.beginPath(); g.moveTo(cx - R * 0.55, ty - 22); g.quadraticCurveTo(cx + R * 0.15, hy - R * 0.7, cx + R * 0.9, ty - 4); g.stroke(); }
  g.restore();
  g.beginPath(); g.arc(cx, hy, R, 0, 7); line();
  // bonnet côtelé
  if (s.cap) { const c = s.cap, by = hy - R * 0.36;
    g.beginPath(); g.moveTo(cx - R * 0.98, by); g.bezierCurveTo(cx - R * 0.98, hy - R * 1.32, cx + R * 0.98, hy - R * 1.32, cx + R * 0.98, by); g.closePath();
    const cg = g.createLinearGradient(0, hy - R * 1.2, 0, by); cg.addColorStop(0, shade(c, 1.12)); cg.addColorStop(1, shade(c, 0.86)); g.fillStyle = cg; g.fill(); line();
    rrect(g, cx - R * 1.04, by - 6, cx + R * 1.04, by + 50, 22); g.closePath(); g.fillStyle = shade(c, 0.95); g.fill(); line();
    g.strokeStyle = shade(c, 0.7); g.lineWidth = 4; for (let k = 1; k < 16; k++) { const x = cx - R * 1.04 + k * (R * 2.08) / 16; g.beginPath(); g.moveTo(x, by + 2); g.lineTo(x, by + 42); g.stroke(); } }
  // visage : 2 petits ovales noirs très écartés, pas de bouche
  if (!s.back) { const lx = (s.look ?? 0) * 20, ey = hy + R * 0.18;
    g.fillStyle = RL; g.strokeStyle = RL; g.lineWidth = 6;
    for (const sx of [-1, 1]) { const x = cx + sx * 52 + lx;
      if (s.blink || s.expr === "relief") { g.beginPath(); g.arc(x, ey + 4, 12, Math.PI + 0.4, -0.4); g.stroke(); continue; }
      const ry = s.expr === "fear" ? 15 : s.expr === "shock" ? 18 : 16, rx = s.expr === "shock" ? 8 : 10;
      g.beginPath(); g.ellipse(x, ey, rx, ry, 0, 0, 7); g.fill();
      if (s.expr === "worry" || s.expr === "fear" || s.expr === "frown") { const d = s.expr === "frown" ? -1 : 1; g.beginPath(); g.moveTo(x + sx * 18, ey - 30 + (d > 0 ? 0 : -6)); g.lineTo(x - sx * 10, ey - 30 - 8 * d); g.stroke(); } }
    if ((s.expr === "shock" || s.expr === "fear") && s.pose !== "handMouth") { g.beginPath(); g.ellipse(cx + lx * 0.8, hy + R * 0.58, 8, 12, 0, 0, 7); g.fillStyle = "#4a3a34"; g.fill(); } }
  if (s.pose === "handMouth") { g.beginPath(); g.arc(cx + 40, hy + 80, 25, 0, 7); g.fillStyle = "#3a2a22"; g.fill(); line(); }
  g.restore();
};

export const drawPerson = (p: Pen, s: Person) => {
  if (s.ref) return drawRef(p, s);
  const g = p.g, cx = 300, R = 122, hy = 196, top = 338, hip = 612, tw = 150;
  g.save(); g.lineCap = "round"; g.lineJoin = "round";
  const J = s.jacket, stp = Math.sin((s.step ?? 0) * Math.PI * 2);
  // ---- jambes (tubes fins, longues) + chaussures
  const feet: number[] = s.pose === "run" ? [-78 - 18 * stp, 78 + 18 * stp] : [-30, 30];
  feet.forEach((fx, i) => {
    const hx = cx + (i ? 24 : -24);
    if (!s.robe) tube(g, [[hx, hip - 6], [cx + fx, 946]], 40, s.pants);
    g.beginPath(); g.ellipse(cx + fx + (s.back ? 0 : (i ? 6 : -6)), 958, 36, 18, 0, 0, 7); g.fillStyle = s.shoes; g.fill(); stroke(g);
  });
  // ---- bras : positions des épaules et des mains
  const shL = [cx - tw / 2 + 14, top + 30], shR = [cx + tw / 2 - 14, top + 30];
  const hang = (sh: number[], sx: number) => [sh, [sh[0] + sx * 22, top + 150], [sh[0] + sx * 26, hip - 4]];
  const armL = s.prop === "jar" ? [shL, [cx - 120, top - 60], [cx - 70, hy - R - 20]] : s.prop === "horn" ? [shL, [cx - 90, top + 60], [cx + 30, hy + 80]] : s.pose === "armsUp" ? [shL, [cx - 118, top - 110], [cx - 92, top - 236]] : s.pose === "run" ? [shL, [cx - 130, top + 120 - 40 * stp], [cx - 80, top + 220 - 50 * stp]] : hang(shL, -1);
  const armR = s.prop === "horn" ? [shR, [cx + 120, top + 40], [cx + 66, hy + 70]] : s.prop === "lantern" || s.prop === "bag" ? [shR, [cx + 110, top + 110], [cx + 150, top + 170]] : s.pose === "armsUp" ? [shR, [cx + 118, top - 110], [cx + 92, top - 236]] : s.pose === "reach" ? [shR, [cx + 180, top + 36], [cx + 266, top + 40]]
    : s.pose === "handMouth" ? [shR, [cx + tw / 2 + 34, top + 120], [cx + 30, hy + 66]] : s.pose === "run" ? [shR, [cx + 130, top + 120 + 40 * stp], [cx + 80, top + 220 + 50 * stp]] : hang(shR, 1);
  // ---- de dos : capuche = grand bourrelet sur le haut du dos (derrière la tête)
  if (s.hood && s.back) { g.beginPath(); g.ellipse(cx, top + 34, 98, 84, 0, 0, 7); g.fillStyle = shade(J, 0.8); g.fill(); stroke(g); }
  // ---- robe longue : trapèze qui s'évase jusqu'aux chevilles, derrière le torse
  if (s.robe) { g.beginPath(); g.moveTo(cx - tw / 2, hip - 40); g.lineTo(cx - tw / 2 - 34, 944); g.quadraticCurveTo(cx, 958, cx + tw / 2 + 34, 944); g.lineTo(cx + tw / 2, hip - 40); g.closePath();
    const rg = g.createLinearGradient(cx - tw / 2 - 34, 0, cx + tw / 2 + 34, 0); rg.addColorStop(0, shade(J, 1.08)); rg.addColorStop(0.55, J); rg.addColorStop(1, shade(J, 0.74)); g.fillStyle = rg; g.fill(); stroke(g);
    g.strokeStyle = shade(J, 0.66); g.lineWidth = 4; for (const dx of [-40, 6, 48]) { g.beginPath(); g.moveTo(cx + dx * 0.6, hip); g.lineTo(cx + dx, 930); g.stroke(); } }   // plis
  // ---- torse
  rrect(g, cx - tw / 2, top, cx + tw / 2, hip, 30);
  { const cg = g.createLinearGradient(cx - tw / 2, 0, cx + tw / 2, 0); cg.addColorStop(0, shade(J, 1.1)); cg.addColorStop(0.55, J); cg.addColorStop(1, shade(J, 0.78)); g.fillStyle = cg; g.fill();
    g.save(); g.clip(); g.fillStyle = shade(J, 0.72); g.globalAlpha = 0.28;                      // texture : taches d'usure, côtes du bas
    for (const [x, y, rx, ry] of [[-30, 120, 16, 22], [34, 200, 12, 16], [-10, 230, 9, 12], [40, 70, 10, 13], [-44, 190, 8, 10]]) { g.beginPath(); g.ellipse(cx + x, top + y, rx, ry, 0.3, 0, 7); g.fill(); }
    g.globalAlpha = 0.45; g.strokeStyle = shade(J, 0.62); g.lineWidth = 3; for (let k = 0; k < 12; k++) { const x = cx - tw / 2 + 8 + k * (tw - 16) / 11; g.beginPath(); g.moveTo(x, hip - 30); g.lineTo(x, hip); g.stroke(); }
    g.globalAlpha = 1; g.restore(); }
  g.beginPath(); g.moveTo(cx - tw / 2, hip - 32); g.lineTo(cx + tw / 2, hip - 32); g.strokeStyle = shade(J, 0.55); g.lineWidth = 4; g.stroke();
  rrect(g, cx - tw / 2, top, cx + tw / 2, hip, 30); stroke(g);
  if (!s.back && !s.robe) { g.strokeStyle = shade(J, 0.6); g.lineWidth = 5; g.beginPath(); g.moveTo(cx + 4, top + 40); g.lineTo(cx + 4, hip - 10); g.stroke(); }
  if (s.sash) { g.beginPath(); g.rect(cx - tw / 2, hip - 70, tw, 30); g.fillStyle = s.sash; g.fill(); stroke(g); }
  // ---- de face : capuche = bourrelet foncé en U autour du col
  if (s.hood && !s.back) { g.beginPath(); g.ellipse(cx, top + 14, 84, 46, 0, 0, 7); g.fillStyle = shade(J, 0.78); g.fill(); stroke(g);
    g.beginPath(); g.ellipse(cx, top + 4, 44, 22, 0, 0, Math.PI); g.fillStyle = shade(J, 0.62); g.fill(); }
  // ---- accessoires tenus (derrière les mains)
  if (s.prop === "staff") { g.beginPath(); g.moveTo(cx + 104, 150); g.lineTo(cx + 104, 965); g.lineCap = "round"; g.strokeStyle = INK; g.lineWidth = 22 + 2 * OL; g.stroke(); g.strokeStyle = "#8a5a32"; g.lineWidth = 20; g.stroke();
    g.beginPath(); g.arc(cx + 92, 150, 22, Math.PI * 0.1, Math.PI * 1.3, true); g.strokeStyle = INK; g.lineWidth = 22 + 2 * OL; g.stroke(); g.strokeStyle = "#8a5a32"; g.lineWidth = 20; g.stroke(); }
  if (s.prop === "lantern") { g.beginPath(); g.moveTo(cx + 150, top + 170); g.lineTo(cx + 150, top + 200); g.strokeStyle = INK; g.lineWidth = 5; g.stroke();
    const lg = g.createRadialGradient(cx + 150, top + 250, 4, cx + 150, top + 250, 90); lg.addColorStop(0, "rgba(255,210,120,0.85)"); lg.addColorStop(1, "rgba(255,170,60,0)"); g.fillStyle = lg; g.fillRect(cx + 50, top + 150, 200, 200);
    rrect(g, cx + 126, top + 200, cx + 174, top + 290, 10); g.fillStyle = "#ffd27a"; g.fill(); stroke(g); g.strokeStyle = INK; g.lineWidth = 5; for (const dx of [-12, 12]) { g.beginPath(); g.moveTo(cx + 150 + dx, top + 204); g.lineTo(cx + 150 + dx, top + 288); g.stroke(); } }
  if (s.prop === "bag") { g.beginPath(); g.moveTo(cx + 120, top + 190); g.quadraticCurveTo(cx + 96, top + 300, cx + 150, top + 330); g.quadraticCurveTo(cx + 206, top + 300, cx + 180, top + 190); g.closePath();
    g.fillStyle = "#b08a5a"; g.fill(); stroke(g); g.strokeStyle = "#6a4a2a"; g.lineWidth = 6; g.beginPath(); g.moveTo(cx + 124, top + 204); g.lineTo(cx + 176, top + 204); g.stroke(); }
  // ---- bras + mains (gros ronds blancs)
  for (const a of [armL, armR]) { tube(g, a, 40, J); const h = a[a.length - 1]; ball(g, h[0], h[1], 31, "#f2f2f4"); }
  // ---- col blanc
  rrect(g, cx - 22, hy + R - 18, cx + 22, top + 10, 4); g.fillStyle = "#f4f4f6"; g.fill(); stroke(g);
  // ---- tête : sphère nacrée (reflet net au centre, bord gris)
  const hg = g.createRadialGradient(cx - 10, hy - 6, 4, cx, hy, R); hg.addColorStop(0, "#ffffff"); hg.addColorStop(0.45, "#f6f6f7"); hg.addColorStop(0.85, "#dcdde2"); hg.addColorStop(1, "#b9bac3");
  g.beginPath(); g.arc(cx, hy, R, 0, 7); g.fillStyle = hg; g.fill();
  g.save(); g.beginPath(); g.arc(cx, hy, R, 0, 7); g.clip();
  g.globalAlpha = 0.6; g.fillStyle = "#ffffff"; g.beginPath(); g.ellipse(cx - 8, hy + 2, R * 0.4, R * 0.32, 0, 0, 7); g.fill();
  g.globalAlpha = 0.9; g.beginPath(); g.ellipse(cx + R * 0.55, hy - R * 0.1, 5, 7, 0, 0, 7); g.fill(); g.globalAlpha = 1; g.restore();
  // ---- cheveux (casque-bol, aplat + léger reflet)
  const hc = s.hairColor;
  if (s.hair !== "bald") {
    g.save(); g.beginPath(); g.arc(cx, hy, R - 1, 0, 7); g.clip(); g.fillStyle = hc; g.beginPath();
    if (s.back) g.rect(cx - R, hy - R, 2 * R, R * 1.62);
    else if (s.hair === "bob" || s.hair === "fringe") {
      const fr = hy - 4, side = hy + (s.hair === "bob" ? 44 : 22);
      g.moveTo(cx - R, side); g.lineTo(cx - R, hy - R); g.lineTo(cx + R, hy - R); g.lineTo(cx + R, side);
      g.lineTo(cx + R * 0.86, side); g.quadraticCurveTo(cx + R * 0.8, fr + 4, cx + R * 0.55, fr); g.lineTo(cx - R * 0.55, fr);
      g.quadraticCurveTo(cx - R * 0.8, fr + 4, cx - R * 0.86, side); g.closePath();
    } else { g.moveTo(cx - R, hy - 18); g.lineTo(cx - R, hy - R); g.lineTo(cx + R, hy - R); g.lineTo(cx + R, hy - 18); g.quadraticCurveTo(cx, hy - 62, cx - R, hy - 18); }
    g.fill(); g.strokeStyle = INK; g.lineWidth = OL; g.stroke();
    { const gl = g.createRadialGradient(cx, hy - R * 0.55, 4, cx, hy - R * 0.45, R * 0.75); gl.addColorStop(0, "rgba(255,240,215,0.42)"); gl.addColorStop(1, "rgba(255,240,215,0)");
      g.fillStyle = gl; g.fill(); }                                                               // reflet doux sur le casque de cheveux
    g.restore();
  } else {                                                            // chauve : 2 touffes grises sur les côtés
    for (const sx of [-1, 1]) { g.beginPath(); g.ellipse(cx + sx * R * 0.86, hy - 4, 22, 34, sx * 0.3, 0, 7); g.fillStyle = hc; g.fill(); stroke(g); }
  }
  g.beginPath(); g.arc(cx, hy, R, 0, 7); stroke(g);
  if (s.hair === "spiky") { g.fillStyle = hc; for (const dx of [-54, -12, 32]) { g.beginPath(); g.moveTo(cx + dx - 26, hy - R + 22); g.lineTo(cx + dx, hy - R - 36); g.lineTo(cx + dx + 24, hy - R + 22); g.closePath(); g.fill(); stroke(g); } }
  if (s.hair === "bun") ball(g, cx, hy - R - 16, 36, hc);
  if (s.hair === "ponytail") ball(g, cx + R - 8, hy - 34, 32, hc);
  // ---- visage
  if (!s.back) {
    const lx = (s.look ?? 0) * 18, ey = hy + 30;
    if (s.expr === "tired" || s.expr === "worry" || s.expr === "fear") {   // cernes violets en croissant
      g.strokeStyle = "rgba(112,84,150,0.8)"; g.lineWidth = 5; for (const sx of [-1, 1]) { g.beginPath(); g.arc(cx + sx * 38 + lx, ey + 8, 15, 0.25, Math.PI - 0.25); g.stroke(); }
    }
    g.fillStyle = INK; g.strokeStyle = INK; g.lineWidth = 5.5;
    for (const sx of [-1, 1]) {
      const x = cx + sx * 38 + lx;
      if (s.blink || s.expr === "relief") { g.beginPath(); g.arc(x, ey + 4, 11, Math.PI + 0.35, -0.35); g.stroke(); continue; }
      const rx = s.expr === "fear" || s.expr === "shock" ? 7 : 9, ry = s.expr === "fear" ? 10 : 13;
      g.beginPath(); g.ellipse(x, ey, rx, ry, 0, 0, 7); g.fill();
      g.fillStyle = "#ffffff"; g.beginPath(); g.arc(x - 2.5, ey - 5, 2.4, 0, 7); g.fill(); g.fillStyle = INK;
      if (s.expr === "worry" || s.expr === "fear") { const b = s.expr === "fear" ? 9 : 0; g.save(); g.lineWidth = 9; g.beginPath(); g.moveTo(x + sx * 16, ey - 24 + b); g.lineTo(x - sx * 8, ey - 34 + b); g.stroke(); g.restore(); }   // peur : sourcils plus bas, sur la peau (lisibles sous la frange)
      if (s.expr === "frown") { g.beginPath(); g.moveTo(x - sx * 16, ey - 24); g.lineTo(x + sx * 10, ey - 30); g.stroke(); }
    }
    const mx = cx + lx * 0.8, my = hy + 72;
    if (s.pose !== "handMouth") {
      if (s.expr === "shock" || s.expr === "fear") { g.beginPath(); g.ellipse(mx, my, 7, 10, 0, 0, 7); g.fill(); }
      else if (s.expr === "relief") { g.beginPath(); g.arc(mx, my - 6, 10, 0.3, Math.PI - 0.3); g.stroke(); }
      else { g.beginPath(); g.moveTo(mx - 6, my); g.lineTo(mx + 6, my); g.stroke(); }
    }
  }
  if (s.pose === "handMouth") ball(g, cx + 30, hy + 66, 31, "#f2f2f4");
  // ---- barbe blanche (sous la bouche, pointe vers le bas)
  if (s.beard && !s.back) { g.beginPath(); g.moveTo(cx - R * 0.78, hy + 40); g.quadraticCurveTo(cx - R * 0.7, hy + R + 70, cx, hy + R + 110); g.quadraticCurveTo(cx + R * 0.7, hy + R + 70, cx + R * 0.78, hy + 40);
    g.quadraticCurveTo(cx + 40, hy + 92, cx, hy + 88); g.quadraticCurveTo(cx - 40, hy + 92, cx - R * 0.78, hy + 40); g.closePath(); g.fillStyle = s.beard; g.fill(); stroke(g);
    g.strokeStyle = shade(s.beard, 0.8); g.lineWidth = 3; for (const dx of [-30, 0, 30]) { g.beginPath(); g.moveTo(cx + dx, hy + 104); g.lineTo(cx + dx * 0.7, hy + R + 80); g.stroke(); }
    g.fillStyle = INK; g.beginPath(); g.ellipse(cx, hy + 80, 9, 4, 0, 0, 7); g.fill(); }
  // ---- foulard : capuche de tissu sur le haut de la tête, pans sur les épaules
  if (s.scarf) { const sc = s.scarf; g.beginPath(); g.moveTo(cx - R - 14, hy + 70); g.lineTo(cx - R - 16, hy - 10); g.arc(cx, hy - 6, R + 16, Math.PI, 0); g.lineTo(cx + R + 14, hy + 70);
    g.quadraticCurveTo(cx + R + 30, top + 40, cx + R - 6, top + 60); g.lineTo(cx + R * 0.86, hy + 20); g.quadraticCurveTo(cx + R * 0.7, hy - R * (s.back ? -0.4 : 0.62), cx, hy - R * (s.back ? -0.6 : 0.68));
    g.quadraticCurveTo(cx - R * 0.7, hy - R * (s.back ? -0.4 : 0.62), cx - R * 0.86, hy + 20); g.lineTo(cx - R + 6, top + 60); g.quadraticCurveTo(cx - R - 30, top + 40, cx - R - 14, hy + 70); g.closePath();
    const sg = g.createLinearGradient(cx - R, 0, cx + R, 0); sg.addColorStop(0, shade(sc, 1.12)); sg.addColorStop(0.6, sc); sg.addColorStop(1, shade(sc, 0.72)); g.fillStyle = sg; g.fill(); stroke(g);
    g.strokeStyle = shade(sc, 0.65); g.lineWidth = 4; g.beginPath(); g.arc(cx, hy - 6, R + 4, Math.PI * 1.15, Math.PI * 1.85); g.stroke(); }
  // ---- cor (long, doré, du bout des lèvres vers le haut à droite)
  if (s.prop === "horn") { g.beginPath(); g.moveTo(cx + 20, hy + 72); g.lineTo(cx + 290, hy - 190); g.lineCap = "round"; g.strokeStyle = INK; g.lineWidth = 26 + 2 * OL; g.stroke(); g.strokeStyle = "#e0a83a"; g.lineWidth = 26; g.stroke();
    g.beginPath(); g.ellipse(cx + 300, hy - 200, 52, 30, -0.76, 0, 7); g.fillStyle = "#f2c25a"; g.fill(); stroke(g); g.beginPath(); g.ellipse(cx + 304, hy - 204, 30, 14, -0.76, 0, 7); g.fillStyle = "#5a3a12"; g.fill();
    for (const a of [armL, armR]) { const h = a[a.length - 1]; ball(g, h[0], h[1], 31, "#f2f2f4"); } }
  // ---- jarre en terre sur la tête
  if (s.prop === "jar") { const jy = hy - R - 50; g.beginPath(); g.ellipse(cx, jy, 70, 58, 0, 0, 7); g.fillStyle = "#c46a3a"; g.fill(); stroke(g); rrect(g, cx - 28, jy - 92, cx + 28, jy - 48, 8); g.fillStyle = "#b25a30"; g.fill(); stroke(g);
    g.strokeStyle = "#f0d0a0"; g.lineWidth = 6; g.beginPath(); g.ellipse(cx, jy - 4, 62, 14, 0, 0.2, Math.PI - 0.2); g.stroke(); const h = armL[armL.length - 1]; ball(g, h[0], h[1], 31, "#f2f2f4"); }
  g.restore();
};
