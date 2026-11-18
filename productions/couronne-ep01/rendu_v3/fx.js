// Couche « premium » : profondeur, lumière, atmosphère, étalonnage. L'identité graphique (personnages, contours,
// HUD, sous-titres) vient de draw_base.js (calée sur les références) et n'est pas modifiée.
function layer(g, draw, o = {}) {                     // calque hors-champ + flou de profondeur + opacité
  const c = mk(W, H), q = c.getContext("2d"); draw(q);
  g.save(); if (o.blur) g.filter = `blur(${o.blur}px)`; g.globalAlpha = o.alpha ?? 1; if (o.op) g.globalCompositeOperation = o.op; g.drawImage(c, 0, 0); g.restore(); return c;
}
function sky(g, stops) { const s = g.createLinearGradient(0, 0, 0, H); stops.forEach(([t, c]) => s.addColorStop(t, c)); g.fillStyle = s; g.fillRect(0, 0, W, H); }
function glow(g, x, y, r, col, a = 0.6) { const q = g.createRadialGradient(x, y, 0, x, y, r); q.addColorStop(0, rgba(col, a)); q.addColorStop(0.4, rgba(col, a * 0.35)); q.addColorStop(1, rgba(col, 0)); g.fillStyle = q; g.fillRect(x - r, y - r, 2 * r, 2 * r); }
function haze(g, y0, y1, col, a) { const q = g.createLinearGradient(0, y0, 0, y1); q.addColorStop(0, rgba(col, 0)); q.addColorStop(0.5, rgba(col, a)); q.addColorStop(1, rgba(col, 0)); g.fillStyle = q; g.fillRect(0, y0, W, y1 - y0); }
function rays(g, x, y, ang, spread, len, col, a = 0.18, n = 7) {    // rayons volumétriques
  layer(g, q => { for (let i = 0; i < n; i++) { const t = ang + (i / (n - 1) - 0.5) * spread, w = 30 + rnd(i * 9) * 70;
    const gr = q.createLinearGradient(x, y, x + Math.cos(t) * len, y + Math.sin(t) * len); gr.addColorStop(0, rgba(col, a * (0.6 + rnd(i) * 0.6))); gr.addColorStop(1, rgba(col, 0));
    q.fillStyle = gr; q.beginPath(); q.moveTo(x, y); q.lineTo(x + Math.cos(t - 0.02) * len - Math.sin(t) * w, y + Math.sin(t - 0.02) * len + Math.cos(t) * w); q.lineTo(x + Math.cos(t + 0.02) * len + Math.sin(t) * w, y + Math.sin(t + 0.02) * len - Math.cos(t) * w); q.closePath(); q.fill(); } }, { blur: 18, op: "screen" });
}
function dust(g, n, col, y0 = 0, y1 = H, seed = 1, size = 3) {   // poussière / particules en suspension, quelques bokeh
  for (let i = 0; i < n; i++) { const x = rnd(i * 13 + seed) * W, y = y0 + rnd(i * 7 + seed) * (y1 - y0), r = rnd(i * 3 + seed) < 0.08 ? 10 + rnd(i) * 22 : size * (0.4 + rnd(i * 5));
    g.fillStyle = rgba(col, r > 8 ? 0.06 + rnd(i) * 0.08 : 0.2 + rnd(i * 2) * 0.4); g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); }
}
function bloom(g, amt = 0.35, blur = 26) { const c = mk(W, H), q = c.getContext("2d"); q.filter = `blur(${blur}px) brightness(1.25) saturate(1.2)`; q.drawImage(g.canvas, 0, 0);
  g.save(); g.globalCompositeOperation = "screen"; g.globalAlpha = amt; g.drawImage(c, 0, 0); g.restore(); }
function grade(g, shadows, highlights, k = 0.18) {    // étalonnage : ombres teintées + hautes lumières teintées
  g.save(); g.globalCompositeOperation = "soft-light"; g.globalAlpha = k; const s = g.createLinearGradient(0, H, 0, 0); s.addColorStop(0, shadows); s.addColorStop(1, highlights); g.fillStyle = s; g.fillRect(0, 0, W, H); g.restore();
}
function finish(g, o = {}) { if (o.bloom !== 0) bloom(g, o.bloom ?? 0.32); if (o.grade) grade(g, ...o.grade); vignette(g, o.vig ?? 0.82); grain(g, 7); }
// acteur : personnage rendu hors-champ puis éclairé (dégradé clé, liseré de contre-jour coloré, ombre portée au sol)
function actor(g, x, F, s, outfit, o = {}) {
  const c = mk(W, H), q = c.getContext("2d"); figure(q, x, F, s, outfit);
  q.save(); q.globalCompositeOperation = "source-atop";                         // modelé : haut éclairé, bas plus sombre
  const kg = q.createLinearGradient(0, F - 900 * s, 0, F); kg.addColorStop(0, rgba(o.key || "#fff2d8", 0.10)); kg.addColorStop(1, "rgba(0,0,0,0.30)"); q.fillStyle = kg; q.fillRect(0, 0, W, H);
  if (o.ambient) { q.globalCompositeOperation = "source-atop"; q.globalAlpha = 0.16; q.fillStyle = o.ambient; q.fillRect(0, 0, W, H); q.globalAlpha = 1; }
  q.restore();
  if (o.rim) {                                                                    // contre-jour : croissant de lumière côté source
    const m = mk(W, H), r = m.getContext("2d"), d = (o.rimW || 9) * s, ang = o.rimAng ?? -0.5;
    r.drawImage(c, 0, 0); r.globalCompositeOperation = "destination-out"; r.drawImage(c, -Math.cos(ang) * d, -Math.sin(ang) * d);
    r.globalCompositeOperation = "source-in"; r.fillStyle = o.rim; r.fillRect(0, 0, W, H);
    const q2 = c.getContext("2d"); q2.save(); q2.globalCompositeOperation = "source-atop"; q2.filter = "blur(2px)"; q2.globalAlpha = o.rimA ?? 0.85; q2.drawImage(m, 0, 0); q2.restore();
  }
  if (o.shadow !== false) { g.save(); g.filter = "blur(14px)"; g.fillStyle = "rgba(0,0,0,0.55)"; g.beginPath(); g.ellipse(x + (o.shDx || 0), F + 4, 150 * s, 26 * s, 0, 0, 7); g.fill(); g.restore(); }
  // contour d'encre épais et régulier autour de la silhouette (dilatation du masque, réglable par o.ink en unités de scale)
  if (o.ink !== 0) { const ol = mk(W, H), oq = ol.getContext("2d"), w = (o.ink ?? 7) * s;
    for (let k = 0; k < 24; k++) { const an = k / 24 * 6.2832; oq.drawImage(c, Math.cos(an) * w, Math.sin(an) * w); }
    oq.globalCompositeOperation = "source-in"; oq.fillStyle = INK; oq.fillRect(0, 0, W, H);
    g.save(); if (o.blur) g.filter = `blur(${o.blur}px)`; g.drawImage(ol, 0, 0); g.restore(); }
  g.save(); if (o.blur) g.filter = `blur(${o.blur}px)`; g.drawImage(c, 0, 0); g.restore();
}
// décor du dôme
function domeBarrier(g, cy, rx, ry, a = 0.7) {        // bord du dôme : arc holographique teal avec maillage hexagonal
  layer(g, q => {
    q.strokeStyle = rgba("#6fe0d6", a); q.lineWidth = 4; q.beginPath(); q.ellipse(W / 2, cy, rx, ry, 0, Math.PI, 2 * Math.PI); q.stroke();
    q.save(); q.beginPath(); q.ellipse(W / 2, cy, rx, ry, 0, Math.PI, 2 * Math.PI); q.lineTo(W / 2 + rx, cy); q.closePath(); q.clip();
    const hs = 46; q.strokeStyle = rgba("#6fe0d6", a * 0.16); q.lineWidth = 1.5;
    for (let row = 0; row * hs * 0.86 < cy + 40; row++) for (let col = -1; col * hs * 1.5 < W + hs; col++) {
      const hx = col * hs * 1.5, hy = row * hs * 0.866 * 2 + (col % 2 ? hs * 0.866 : 0); q.beginPath();
      for (let i = 0; i < 6; i++) { const t = Math.PI / 3 * i; i ? q.lineTo(hx + hs * 0.5 * Math.cos(t), hy + hs * 0.5 * Math.sin(t)) : q.moveTo(hx + hs * 0.5 * Math.cos(t), hy + hs * 0.5 * Math.sin(t)); } q.closePath(); q.stroke(); }
    q.restore();
  }, { op: "screen" });
  layer(g, q => { q.strokeStyle = rgba("#6fe0d6", 0.5); q.lineWidth = 26; q.beginPath(); q.ellipse(W / 2, cy, rx, ry, 0, Math.PI, 2 * Math.PI); q.stroke(); }, { blur: 30, op: "screen" });
}
function blocks(g, y, n, o = {}) {                    // immeubles des districts : volumes gris/bruns, fenêtres ambre éparses
  for (let i = 0; i < n; i++) { const w = 120 + rnd(i * 3 + (o.seed || 0)) * 110, h = (o.h || 380) * (0.6 + rnd(i * 7 + (o.seed || 0)) * 0.7), x = (i / n) * W * 1.1 - 40 + rnd(i) * 30;
    const bg = g.createLinearGradient(x, 0, x + w, 0); bg.addColorStop(0, o.col || "#2a2c2e"); bg.addColorStop(1, mul(o.col || "#2a2c2e", 0.7)); g.fillStyle = bg; g.fillRect(x, y - h, w, h);
    g.fillStyle = rgba("#000000", 0.25); g.fillRect(x, y - h, w, 8);
    for (let wy = y - h + 30; wy < y - 30; wy += 46) for (let wx = x + 16; wx < x + w - 20; wx += 34) if (rnd(wx * 1.3 + wy) < (o.lit || 0.18)) { g.fillStyle = rgba(o.win || "#f0b35a", 0.75); g.fillRect(wx, wy, 14, 20); glow(g, wx + 7, wy + 10, 40, o.win || "#f0b35a", 0.18); }
  }
}
function towers(g, y, cx, spread, n, o = {}) {        // tours du centre : volumes crème à gradins, faces ombrées, fenêtres dorées, jardins
  const k = o.k || 1;
  for (let i = 0; i < n; i++) {
    const w = (60 + rnd(i * 5) * 70) * k, h = (220 + rnd(i * 11) * 380) * k, x = cx + (i / Math.max(n - 1, 1) - 0.5) * spread - w / 2, tiers = 2 + Math.floor(rnd(i * 3) * 3);
    let tw = w, ty = y, th = h / tiers;
    for (let t = 0; t < tiers; t++) {
      const tx = x + (w - tw) / 2;
      g.fillStyle = "#e9dcb8"; g.fillRect(tx, ty - th, tw * 0.62, th); g.fillStyle = "#a99470"; g.fillRect(tx + tw * 0.62, ty - th, tw * 0.38, th);   // face éclairée / face ombrée
      for (let wy = ty - th + 14 * k; wy < ty - 8 * k; wy += 22 * k) { g.fillStyle = rgba("#ffd98a", 0.75); g.fillRect(tx + 6 * k, wy, tw * 0.5, 4 * k); g.fillStyle = rgba("#c9963e", 0.6); g.fillRect(tx + tw * 0.66, wy, tw * 0.28, 4 * k); }
      g.fillStyle = "#c9a24e"; g.fillRect(tx - 3 * k, ty - th - 6 * k, tw + 6 * k, 6 * k);
      ty -= th; tw *= 0.72;
    }
    g.fillStyle = "#d8b45c"; g.beginPath(); g.moveTo(x + w / 2, ty - 40 * k); g.lineTo(x + w / 2 + 5 * k, ty); g.lineTo(x + w / 2 - 5 * k, ty); g.fill();
  }
  for (let i = 0; i < 30; i++) { const x = cx + (rnd(i * 4) - 0.5) * spread * 1.1, r = (18 + rnd(i) * 26) * k; g.fillStyle = i % 2 ? "#3c6a46" : "#2f5838"; g.beginPath(); g.arc(x, y - r * 0.3, r, 0, 7); g.fill(); }
}
function wallHex(g, y, h, col = "#1d1c1b", lit = "#8a7a5c") { g.fillStyle = col; g.fillRect(0, y - h, W, h); g.fillStyle = rgba(lit, 0.25); g.fillRect(0, y - h, W, 6);
  for (let x = 0; x < W; x += 140) { g.fillStyle = rgba("#000000", 0.35); g.fillRect(x, y - h, 6, h); } }
// ---------- plans FPV (réf. planches 4, 6, 9, 11, 15, 16, 20, 24, 25) : cadres emboîtés en perspective, roulis, flou de vitesse ----------
function shaft(g, o) {                                 // puits / couloir : polygones emboîtés vers un point de fuite
  const vx = o.vx ?? W / 2, vy = o.vy ?? H / 2, n = o.n || 14, f = o.f || 0.8, sides = o.sides || 4, r0 = o.r0 || 1400, rot0 = o.rot ?? Math.PI / 4;
  const ringPts = (k) => { const r = r0 * Math.pow(f, k); return Array.from({ length: sides }, (_, i) => { const a = rot0 + i * 2 * Math.PI / sides; return [vx + r * Math.cos(a) * (o.sx || 1), vy + r * Math.sin(a) * (o.sy || 1)]; }); };
  for (let k = 0; k < n; k++) {
    const A = ringPts(k), B = ringPts(k + 1), t = k / n;
    for (let i = 0; i < sides; i++) {                // faces entre deux niveaux (plus sombres au loin, lumière au fond)
      const a = A[i], b = A[(i + 1) % sides], c = B[(i + 1) % sides], d = B[i];
      g.fillStyle = mul(o.wall || "#1d2226", 0.35 + 0.75 * (i % 2 ? 0.6 : 1) * (1 - t * 0.7)); g.beginPath(); g.moveTo(...a); g.lineTo(...b); g.lineTo(...c); g.lineTo(...d); g.closePath(); g.fill();
    }
    g.strokeStyle = rgba(o.line || "#c9b48a", 0.75 * (1 - t * 0.6)); g.lineWidth = Math.max(1.4, 7 * Math.pow(f, k)); g.beginPath(); A.forEach((p, i) => i ? g.lineTo(...p) : g.moveTo(...p)); g.closePath(); g.stroke();
    const Lp = A.map(p => [p[0] + (vx - p[0]) * 0.06, p[1] + (vy - p[1]) * 0.06]);      // garde-corps : main courante + montants
    g.strokeStyle = rgba(o.line || "#c9b48a", 0.45 * (1 - t * 0.6)); g.lineWidth = Math.max(1, 3 * Math.pow(f, k)); g.beginPath(); Lp.forEach((p, i) => i ? g.lineTo(...p) : g.moveTo(...p)); g.closePath(); g.stroke();
    for (let i = 0; i < sides; i++) for (let j = 0; j <= 18; j++) { const u = j / 18, a = A[i], b = A[(i + 1) % sides], la = Lp[i], lb = Lp[(i + 1) % sides];
      g.beginPath(); g.moveTo(a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u); g.lineTo(la[0] + (lb[0] - la[0]) * u, la[1] + (lb[1] - la[1]) * u); g.stroke(); }
    const m = 14 + k * 2;                             // garde-corps + habitants (têtes claires) + lumières le long de chaque niveau
    for (let i = 0; i < sides; i++) for (let j = 0; j < m; j++) { const a = A[i], b = A[(i + 1) % sides], u = (j + 0.5) / m, p = [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u], sz = Math.max(1.5, 13 * Math.pow(f, k));
      const q = [p[0] + (vx - p[0]) * 0.035, p[1] + (vy - p[1]) * 0.035];
      if (rnd(k * 97 + i * 13 + j) < (o.people ?? 0.55)) { const q2 = [p[0] + (vx - p[0]) * 0.09, p[1] + (vy - p[1]) * 0.09];   // habitant derrière la rambarde : épaules sombres + tête claire
        g.fillStyle = rgba("#0e1113", 0.9); g.beginPath(); g.arc(q2[0], q2[1] + sz * 0.9, sz * 1.4, 0, 7); g.fill();
        const hg = g.createRadialGradient(q2[0] - sz * 0.3, q2[1] - sz * 0.4, 0.5, q2[0], q2[1], sz); hg.addColorStop(0, "#efeae0"); hg.addColorStop(1, "#8f8a80"); g.fillStyle = hg; g.beginPath(); g.arc(q2[0], q2[1], sz, 0, 7); g.fill(); }
      else if (rnd(k * 31 + j) < 0.25) glow(g, q[0], q[1], sz * 4, o.lamp || AMBER, 0.6 * (1 - t * 0.5)); }
    if (o.labels && o.labels[k]) { const p = A[o.labelSide || 0]; g.font = `700 ${Math.max(14, 34 * Math.pow(f, k))}px Montserrat`; g.fillStyle = rgba("#e9e1cf", 0.7); g.fillText(o.labels[k], p[0] + (vx - p[0]) * 0.12, p[1] + (vy - p[1]) * 0.12); }
  }
  if (o.core) glow(g, vx, vy, o.coreR || 240, o.core, 0.9);
}
function roll(g, ang, draw) {                         // roulis caméra : la scène est dessinée puis tournée autour du centre
  const c = mk(W, H), q = c.getContext("2d"); draw(q);
  g.save(); g.translate(W / 2, H / 2); g.rotate(ang); g.scale(1.22, 1.22); g.translate(-W / 2, -H / 2); g.drawImage(c, 0, 0); g.restore();
}
function zoomBlur(g, vx, vy, amt = 0.06, steps = 6) { // flou de vitesse radial vers le point de fuite
  const c = mk(W, H); c.getContext("2d").drawImage(g.canvas, 0, 0);
  for (let i = 1; i <= steps; i++) { const k = 1 + amt * i / steps; g.save(); g.globalAlpha = 0.09; g.translate(vx, vy); g.scale(k, k); g.translate(-vx, -vy); g.drawImage(c, 0, 0); g.restore(); }
}
function perspectiveImage(g, src, quad) {            // image plane -> trapèze (haut, bas), tranche par tranche (feuille tenue et inclinée)
  const [tl, tr, br, bl] = quad, h = src.height, n = 260;
  for (let i = 0; i < n; i++) { const u = i / n, u2 = (i + 1) / n, L = [tl[0] + (bl[0] - tl[0]) * u, tl[1] + (bl[1] - tl[1]) * u], Rr = [tr[0] + (br[0] - tr[0]) * u, tr[1] + (br[1] - tr[1]) * u];
    const y2 = tl[1] + (bl[1] - tl[1]) * u2; g.drawImage(src, 0, u * h, src.width, h / n + 1, L[0], L[1], Rr[0] - L[0], y2 - L[1] + 1); }
}
