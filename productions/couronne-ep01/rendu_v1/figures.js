// Personnages et décors 2D (Canvas2D), style des références Le Mur : contour anthracite épais, aplats, tête claire
// à reflet radial, corps en bean, membres en traits avec contour. Unités = pixels du canvas 1080x1920.
export const INK = "#1A1816";
const rad = d => d * Math.PI / 180;
const P = (x, y) => [x, y];
function limb(g, pts, color, w) {                       // membre : contour sombre puis aplat
  g.lineCap = "round"; g.lineJoin = "round";
  g.strokeStyle = INK; g.lineWidth = w + 12; g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.stroke();
  g.strokeStyle = color; g.lineWidth = w; g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.stroke();
}
function seg(p, ang, len) { return [p[0] + Math.sin(rad(ang)) * len, p[1] + Math.cos(rad(ang)) * len]; }
function outlined(g, path, fill, lw = 12) {               // forme fermée : contour + aplat
  g.fillStyle = fill; g.strokeStyle = INK; g.lineWidth = lw; g.lineJoin = "round";
  g.beginPath(); path(); g.fill(); g.stroke();
}
function head(g, c, r, o) {
  const grd = g.createRadialGradient(c[0] - r * 0.35, c[1] - r * 0.4, r * 0.1, c[0], c[1], r * 1.1);
  grd.addColorStop(0, "#ffffff"); grd.addColorStop(0.55, o.face || "#eeeae2"); grd.addColorStop(1, "#b9b2a6");
  g.fillStyle = grd; g.strokeStyle = INK; g.lineWidth = 12;
  g.beginPath(); g.ellipse(c[0], c[1], r * 0.92, r, o.tilt || 0, 0, Math.PI * 2); g.fill(); g.stroke();
  // yeux : deux points, paupières lourdes si o.closed
  const ey = c[1] + r * 0.05, ex = r * 0.36;
  g.fillStyle = INK;
  if (o.closed) { g.lineWidth = 6; g.beginPath(); g.moveTo(c[0] - ex - 9, ey); g.lineTo(c[0] - ex + 9, ey); g.moveTo(c[0] + ex - 9, ey); g.lineTo(c[0] + ex + 9, ey); g.stroke(); }
  else { g.beginPath(); g.arc(c[0] - ex, ey, 8, 0, 7); g.arc(c[0] + ex, ey, 8, 0, 7); g.fill(); }
  if (o.glasses) { g.lineWidth = 4; g.strokeStyle = INK; [-1, 1].forEach(s => { g.beginPath(); g.arc(c[0] + s * ex, ey, 22, 0, 7); g.stroke(); }); g.beginPath(); g.moveTo(c[0] - ex + 22, ey); g.lineTo(c[0] + ex - 22, ey); g.stroke(); }
  if (o.moustache) { g.fillStyle = o.moustache; g.beginPath(); g.ellipse(c[0], c[1] + r * 0.42, r * 0.34, 9, 0, 0, 7); g.fill(); }
  // petite bouche
  g.strokeStyle = INK; g.lineWidth = 5; g.beginPath(); g.moveTo(c[0] - 12, c[1] + r * 0.55); g.quadraticCurveTo(c[0], c[1] + r * 0.6, c[0] + 12, c[1] + r * 0.55); g.stroke();
}
/** figure debout/en mouvement : feet = (x, y du sol), H = hauteur totale */
export function figure(g, feet, H, o) {
  const k = H / 520, x = feet[0], y = feet[1];
  const hipY = y - 300 * k, neckY = y - 455 * k, headR = 70 * k, headC = [x + (o.headDx || 0) * k, y - 470 * k];
  const legW = 46 * k, armW = 36 * k;
  // jambes
  const hipL = [x - 34 * k, hipY], hipR = [x + 34 * k, hipY];
  const legs = o.legs || { l: [-4, 0], r: [4, 0] };
  const footL = seg(seg(hipL, legs.l[0], 170 * k), legs.l[1], 170 * k), footR = seg(seg(hipR, legs.r[0], 170 * k), legs.r[1], 170 * k);
  limb(g, [hipL, [footL[0], footL[1] - 0]], o.pants, legW); limb(g, [hipR, [footR[0], footR[1]]], o.pants, legW);
  [footL, footR].forEach(f => outlined(g, () => g.ellipse(f[0] + 14 * k, f[1] - 6, 42 * k, 20 * k, 0, 0, 7), o.shoes || INK, 10));
  // bras arrière
  const arms = o.arms || { l: [-18, 20, 0], r: [18, 20, 0] };   // [angle épaule, angle coude, angle main]
  const shL = [x - 92 * k, neckY + 40 * k], shR = [x + 92 * k, neckY + 40 * k];
  const elL = seg(shL, arms.l[0], 130 * k), elR = seg(shR, arms.r[0], 130 * k);
  const handL = seg(elL, arms.l[1], 120 * k), handR = seg(elR, arms.r[1], 120 * k);
  if (o.handAtMouth === "r") { handR[0] = headC[0] + 40 * k; handR[1] = headC[1] + 45 * k; }
  if (o.handAtMouth === "l") { handL[0] = headC[0] - 40 * k; handL[1] = headC[1] + 45 * k; }
  limb(g, [shL, elL, handL], o.sleeve || o.jacket, armW); limb(g, [shR, elR, handR], o.sleeve || o.jacket, armW);
  // tronc (bean) : épaules larges, taille
  outlined(g, () => {
    g.moveTo(x - 90 * k, neckY + 20 * k);
    g.quadraticCurveTo(x - 118 * k, y - 380 * k, x - 80 * k, hipY + 20 * k);
    g.lineTo(x + 80 * k, hipY + 20 * k);
    g.quadraticCurveTo(x + 118 * k, y - 380 * k, x + 90 * k, neckY + 20 * k);
    g.quadraticCurveTo(x, neckY - 16 * k, x - 90 * k, neckY + 20 * k); g.closePath();
  }, o.jacket, 12);
  if (o.hood) outlined(g, () => { g.ellipse(headC[0], headC[1] + 40 * k, headR * 1.45, headR * 1.2, 0, 0, 7); }, o.hood, 10);
  if (o.zip) { g.strokeStyle = "rgba(0,0,0,.35)"; g.lineWidth = 4; g.beginPath(); g.moveTo(x, neckY + 30 * k); g.lineTo(x, hipY); g.stroke(); }
  // bras avant (par-dessus le tronc)
  // col ou écharpe
  if (o.scarf) outlined(g, () => g.ellipse(x, neckY + 30 * k, 52 * k, 20 * k, 0, 0, 7), o.scarf, 10);
  // tête
  if (o.beanie) { head(g, headC, headR, o); outlined(g, () => g.ellipse(headC[0], headC[1] - headR * 0.55, headR * 0.98, headR * 0.5, 0, Math.PI, 0), o.beanie, 10); }
  else if (o.helmet) { head(g, headC, headR, o); outlined(g, () => { g.ellipse(headC[0], headC[1] - 4, headR * 1.02, headR * 1.02, 0, Math.PI, 0); }, o.helmet, 10); g.fillStyle = "#2b2b2b"; g.fillRect(headC[0] - headR * 0.8, headC[1] - 8, headR * 1.6, headR * 0.5); }
  else if (o.hair) { outlined(g, () => g.ellipse(headC[0], headC[1] - headR * 0.6, headR * 1.02, headR * 0.7, 0, Math.PI, 0), o.hair, 10); head(g, headC, headR, o); }
  else head(g, headC, headR, o);
  if (o.hood) { /* capuche ouverte autour du visage : bord bleu */ }
  if (o.visorGlow) { g.strokeStyle = "#8fd3ff"; g.lineWidth = 3; g.beginPath(); g.moveTo(headC[0] - headR * 0.7, headC[1] + 2); g.lineTo(headC[0] + headR * 0.7, headC[1] + 2); g.stroke(); }
  if (o.belt) { g.fillStyle = o.belt; g.fillRect(x - 84 * k, hipY - 8 * k, 168 * k, 18 * k); }
  if (o.badge) { g.fillStyle = "#d8d2c4"; g.strokeStyle = INK; g.lineWidth = 6; g.fillRect(x - 30 * k, neckY + 110 * k, 60 * k, 34 * k); g.strokeRect(x - 30 * k, neckY + 110 * k, 60 * k, 34 * k); }
}
export function crowdRow(g, y, w, n, seed, colors) {      // rangée de silhouettes floues
  for (let i = 0; i < n; i++) {
    const s = Math.sin(seed * 91.7 + i * 17.3) * 0.5 + 0.5, cx = (i + 0.5) * (w / n) + Math.sin(i * 3.1 + seed) * 10;
    const r = 26 + s * 14, c = colors[i % colors.length];
    g.fillStyle = c; g.beginPath(); g.arc(cx, y - r * 0.5, r, Math.PI, 0); g.lineTo(cx + r * 1.35, y + 260); g.lineTo(cx - r * 1.35, y + 260); g.closePath(); g.fill();
    g.beginPath(); g.arc(cx, y - r * 0.4, r * 0.55, 0, 7); g.fill();
  }
}
