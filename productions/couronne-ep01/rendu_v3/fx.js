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
