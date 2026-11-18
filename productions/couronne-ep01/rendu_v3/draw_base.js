// Moteur de dessin calqué sur les références (planches contact VIDEO_01) — mesures dans STYLE_BIBLE.md + relevés pixels.
// Unités : canvas 1080x1920. Facteur planche -> rendu : 1080/464 = 2.328.
const W = 1080, H = 1920;
const INK = "#050405";                                  // contour (relevé : bord de tête ~#151109)
const HUD_RED = "#D6514B", HUD_WHITE = "#F6F2EA", CAP_ORANGE = "#F3A633";
const TT = () => window.TT ?? 0, TU = () => window.TU ?? 0.5, TS = () => window.TS ?? 0;   // temps absolu, avancement du plan (0..1), temps depuis le début du plan
const mk = (w, h) => { const c = document.createElement("canvas"); c.width = w; c.height = h; return c; };
const hex2 = (c) => { const n = parseInt(c.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const rgba = (c, a) => { const [r, g, b] = hex2(c); return `rgba(${r},${g},${b},${a})`; };
const mul = (c, k) => { const [r, g, b] = hex2(c).map(v => Math.max(0, Math.min(255, Math.round(v * k)))); return `rgb(${r},${g},${b})`; };
function rnd(i) { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }

// ---------- fonds ----------
function concrete(g, base, light, seed = 1) {        // mur béton chaud, marbrures douces + grain (références : plans 7, 9, 12)
  g.fillStyle = base; g.fillRect(0, 0, W, H);
  const c = mk(W, H), q = c.getContext("2d"); q.filter = "blur(40px)";
  for (let i = 0; i < 90; i++) { q.fillStyle = rgba(rnd(i + seed) > 0.5 ? "#ffffff" : "#000000", 0.035 + rnd(i * 3 + seed) * 0.03);
    q.beginPath(); q.arc(rnd(i * 7 + seed) * W, rnd(i * 11 + seed) * H, 60 + rnd(i * 5) * 220, 0, 7); q.fill(); }
  g.drawImage(c, 0, 0);
  g.strokeStyle = "rgba(0,0,0,0.18)"; g.lineWidth = 2;                       // joints de panneaux
  for (let y = 380; y < H; y += 420) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
  if (light) { const r = g.createRadialGradient(light[0], light[1], 30, light[0], light[1], light[2]);
    r.addColorStop(0, rgba(light[3], 0.55)); r.addColorStop(0.5, rgba(light[3], 0.18)); r.addColorStop(1, rgba(light[3], 0)); g.fillStyle = r; g.fillRect(0, 0, W, H); }
}
function grain(g, amt = 10) {
  const id = g.getImageData(0, 0, W, H), d = id.data;
  for (let i = 0; i < d.length; i += 4) { const n = (Math.random() - 0.5) * amt; d[i] += n; d[i + 1] += n; d[i + 2] += n; }
  g.putImageData(id, 0, 0);
}
function vignette(g, k = 0.8) {
  const v = g.createRadialGradient(W / 2, H * 0.45, H * 0.18, W / 2, H * 0.5, H * 0.78);
  v.addColorStop(0, "rgba(0,0,0,0)"); v.addColorStop(1, `rgba(0,0,0,${k})`); g.fillStyle = v; g.fillRect(0, 0, W, H);
}
function lamp(g, x, y, warm = "#e9d6a4", s = 1) {   // abat-jour plat sombre + ellipse lumineuse (plans 7, 9, 26)
  const r = g.createRadialGradient(x, y + 20, 10, x, y + 200 * s, 1000 * s);
  r.addColorStop(0, rgba(warm, 0.30)); r.addColorStop(0.35, rgba(warm, 0.08)); r.addColorStop(1, rgba(warm, 0)); g.fillStyle = r; g.fillRect(0, 0, W, H);
  g.fillStyle = "#14110c"; g.beginPath(); g.moveTo(x - 46 * s, y - 14 * s); g.lineTo(x + 46 * s, y - 14 * s); g.lineTo(x + 72 * s, y + 16 * s); g.lineTo(x - 72 * s, y + 16 * s); g.closePath(); g.fill();
  g.fillStyle = warm; g.beginPath(); g.ellipse(x, y + 17 * s, 66 * s, 9 * s, 0, 0, 7); g.fill();
}
function floorPlane(g, y) {                         // sol éclairé sous les personnages (réf. planche 9 : #493b26 -> #2a2216)
  const f = g.createLinearGradient(0, y, 0, H); f.addColorStop(0, "#3d3020"); f.addColorStop(0.5, "#2a2216"); f.addColorStop(1, "#140f09"); g.fillStyle = f; g.fillRect(0, y, W, H - y);
}
function floorPool(g, y, col = "#4a3c27", rx = 520, ry = 120) {
  const r = g.createRadialGradient(W / 2, y, 10, W / 2, y, rx); r.addColorStop(0, rgba(col, 0.9)); r.addColorStop(1, rgba(col, 0));
  g.save(); g.scale(1, ry / rx); g.fillStyle = r; g.beginPath(); g.arc(W / 2, y * rx / ry, rx, 0, 7); g.fill(); g.restore();
}
// foule : rangées de petits personnages (tête claire, deux yeux, épaules sombres) — plans 7, 12, 22
function crowd(g, y0, rows, opt = {}) {          // foule (réf. planches 7, 9, 12) : silhouettes chaudes qui se chevauchent, têtes éclairées par le haut
  const c = mk(W, H), q = c.getContext("2d"), big = opt.big || 1, tint = opt.tint || "#4f4438";
  for (let r = 0; r < rows; r++) {
    const k = 0.72 + r * 0.07, y = y0 + r * 58 * k * big, hr = 24 * k * big, step = 64 * k * big;
    for (let x = -30 + (r % 2) * step / 2; x < W + 40; x += step) {
      const j = rnd(x * 0.37 + r * 13), j2 = rnd(x * 1.7 + r * 5), hx = x + (j - 0.5) * 26, hy = y + (j2 - 0.5) * 14, rr = hr * (0.85 + j * 0.3);
      q.fillStyle = mul(opt.body || "#231c15", 0.8 + j2 * 0.5); q.beginPath(); q.ellipse(hx, hy + rr * 2.1, rr * 1.75, rr * 1.35, 0, Math.PI, 0); q.lineTo(hx + rr * 1.75, hy + rr * 5); q.lineTo(hx - rr * 1.75, hy + rr * 5); q.fill();
      const hg = q.createRadialGradient(hx, hy - rr * 0.6, 1, hx, hy, rr * 1.05);
      const head = j2 > 0.85 ? "#3a3128" : (opt.head || tint); hg.addColorStop(0, mul(head, 1.25)); hg.addColorStop(0.55, head); hg.addColorStop(1, mul(head, 0.4));
      q.fillStyle = hg; q.beginPath(); q.arc(hx, hy, rr, 0, 7); q.fill();
      if (!opt.backs && r >= rows - 2 && j2 <= 0.85) { q.fillStyle = "rgba(20,16,12,0.7)"; q.beginPath(); q.arc(hx - rr * 0.32, hy + rr * 0.08, rr * 0.1, 0, 7); q.arc(hx + rr * 0.32, hy + rr * 0.08, rr * 0.1, 0, 7); q.fill(); }
    }
  }
  g.save(); g.filter = `blur(${opt.blur || 1.5}px)`; g.globalAlpha = opt.alpha || 1; g.drawImage(c, 0, 0); g.restore();
  const sh = g.createLinearGradient(0, y0, 0, H); sh.addColorStop(0, "rgba(0,0,0,0)"); sh.addColorStop(1, "rgba(0,0,0,0.6)"); g.fillStyle = sh; g.fillRect(0, y0, W, H - y0);
}
// ---------- HUD et sous-titres (relevés planche 9 : rouge #D6514B, blanc #F6F2EA, orange #F3A633) ----------
const SAFE_X = 160;                                       // marge latérale : TikTok rogne ~97 px de chaque côté sur un écran 19,5:9 (iPhone 17 Pro)
function hud(g, o = {}) {
  const L = SAFE_X, R = W - SAFE_X;
  g.save(); g.globalAlpha = o.alpha ?? 1;
  g.fillStyle = HUD_RED; g.beginPath(); g.arc(L + 4, 283, 5, 0, 7); g.fill();
  g.font = "800 22px Montserrat"; g.letterSpacing = "2px"; g.fillText("ÉPISODE 1", L + 14, 291);
  g.fillStyle = HUD_WHITE; g.font = "800 56px Montserrat"; g.letterSpacing = "0px"; g.fillText(o.clock || "06:12", L, 356);
  g.fillStyle = "rgba(246,242,234,0.35)"; g.fillRect(L + 2, 380, 210, 2);
  g.fillStyle = "rgba(246,242,234,0.55)"; g.font = "500 15px 'Roboto Mono'"; g.letterSpacing = "5px"; g.fillText(o.zone || "DISTRICT NORD", L + 4, 418);
  g.textAlign = "right"; g.fillStyle = HUD_RED; g.font = "800 22px Montserrat"; g.letterSpacing = "2px"; g.fillText(o.label || "COUPURE", R, 291);
  g.font = "600 74px Oswald"; g.letterSpacing = "1px"; g.fillStyle = o.valueRed ? HUD_RED : HUD_WHITE; g.fillText(o.value || "72 H", R, 358);
  g.restore(); g.letterSpacing = "0px"; g.textAlign = "left";
}
function caption(g, words, active, y = 1242) {         // Montserrat 900, blanc + ombre portée sombre, mot actif orange (sans pilule)
  g.save(); let fs = 88; g.font = `900 ${fs}px Montserrat`; let sp = 24;
  let ws = words.map(w => g.measureText(w).width), tot = ws.reduce((a, b) => a + b, 0) + sp * (words.length - 1);
  if (tot > W - 2 * SAFE_X) { const k = (W - 2 * SAFE_X) / tot; fs = Math.floor(fs * k); sp *= k; g.font = `900 ${fs}px Montserrat`; ws = words.map(w => g.measureText(w).width); tot = ws.reduce((a, b) => a + b, 0) + sp * (words.length - 1); }   // tient dans le cadre
  let x = (W - tot) / 2;
  words.forEach((w, i) => {
    g.shadowColor = "rgba(0,0,0,0.78)"; g.shadowBlur = 26; g.shadowOffsetX = 0; g.shadowOffsetY = 6;                 // halo sombre doux (lisibilité ; v9 plus marqué)
    g.fillStyle = i === active ? CAP_ORANGE : "#FFFFFF"; g.fillText(w, x, y);
    g.shadowColor = "rgba(0,0,0,0.75)"; g.shadowBlur = 4; g.shadowOffsetX = 4; g.shadowOffsetY = 8; g.fillText(w, x, y);   // ombre portée nette (v9 plus visible)
    x += ws[i] + sp; });
  g.restore();
}
// ---------- personnages (construction relevée planches 9, 13, 16, 17, 19) ----------
// s = 1 : personnage en pied comme planche 9 (tête R = 95, tronc 200 x 290, jambes 295, hauteur ~ 860 px)
function outline(g, s) { g.strokeStyle = INK; g.lineWidth = 8.1 * s; g.lineJoin = "round"; g.lineCap = "round"; }
function shadedBox(g, x, y, w, h, r, lit, dark, s, side = 1) {   // aplat + bande d'ombre côté opposé à la lumière
  g.save(); g.beginPath(); g.roundRect(x, y, w, h, r); g.fillStyle = lit; g.fill(); g.clip();
  const gr = g.createLinearGradient(side > 0 ? x + w * 0.55 : x + w * 0.45, 0, side > 0 ? x + w : x, 0);
  gr.addColorStop(0, rgba(dark, 0)); gr.addColorStop(0.35, rgba(dark, 0.85)); gr.addColorStop(1, rgba(dark, 1)); g.fillStyle = gr; g.fillRect(x, y, w, h);
  g.restore(); outline(g, s); g.beginPath(); g.roundRect(x, y, w, h, r); g.stroke();
}
function tube(g, a, b, w, col, s) {
  g.lineCap = "round"; g.strokeStyle = INK; g.lineWidth = w + 16 * s; g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke();
  g.strokeStyle = col; g.lineWidth = w; g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke();
}
function ball(g, c, r, col, s) { g.fillStyle = col; g.beginPath(); g.arc(c[0], c[1], r, 0, 7); g.fill(); outline(g, s); g.lineWidth = 6.75 * s; g.stroke(); }
function headShape(g, c, R, s, o) {                     // tête ronde claire, reflet radial haut-gauche, bord gris (#9d9a94)
  const gr = g.createRadialGradient(c[0] - R * 0.25, c[1] - R * 0.35, R * 0.05, c[0], c[1], R);
  gr.addColorStop(0, "#ffffff"); gr.addColorStop(0.7, "#fbfaf7"); gr.addColorStop(1, "#f1eee8");
  g.fillStyle = gr; g.beginPath(); g.arc(c[0], c[1], R, 0, 7); g.fill();
}
function eyes(g, c, R, o) {                              // yeux : ovales noirs verticaux, écart 0.62 R, légèrement au-dessus du centre
  const dx = o.look || 0, ey = c[1] - R * 0.02 + (o.eyeDy || 0) * R;
  g.fillStyle = "#14110d";
  if (o.closed) { g.strokeStyle = "#14110d"; g.lineWidth = R * 0.05; [-1, 1].forEach(k => { g.beginPath(); g.arc(c[0] + k * R * 0.31 + dx * R, ey, R * 0.09, 0.15 * Math.PI, 0.85 * Math.PI); g.stroke(); }); return; }
  [-1, 1].forEach(k => { g.beginPath(); g.ellipse(c[0] + k * R * 0.31 + dx * R, ey, R * 0.075, R * 0.105, 0, 0, 7); g.fill(); });
}
function figure(g, x, F, s, o) {
  const R = 95 * s, tw = (o.torsoW || 200) * s, th = 290 * s, L = 295 * s, hipY = F - L - 14 * s, top = hipY - th;
  const ring = [x, top + 4 * s], headC = [x + (o.headDx || 0) * s, top - R + 6 * s + (o.headDy || 0) * s];
  const side = o.side || 0;                         // 0 = face ; 1 = profil vers la droite (marche)
  // jambes
  const legs = o.legs || [[-0.22, 0], [0.22, 0]];   // [décalage x en largeur de tronc, angle en degrés]
  legs.forEach(([dx, ang]) => {
    const a = [x + dx * tw * (side ? 0.4 : 1), hipY - 20 * s], b = [a[0] + Math.sin(ang * Math.PI / 180) * L, a[1] + Math.cos(ang * Math.PI / 180) * L];
    tube(g, a, b, 42 * s, o.legs_col || mul(o.body, 0.65), s);
    g.fillStyle = o.shoes || "#13120c"; g.beginPath(); g.roundRect(b[0] - 26 * s + (side ? 10 * s : 0), b[1] - 14 * s, 58 * s, 30 * s, 14 * s); g.fill();
  });
  // bras arrière (profil)
  const shY = top + 34 * s, handY = hipY + 6 * s;
  const arms = o.arms || [[-1, 0], [1, 0]];          // [côté, angle en degrés]
  const armPts = arms.map(([k, ang]) => { const a = [x + k * (tw / 2 - 16 * s) * (side ? 0.3 : 1), shY], len = handY - shY;
    return [a, [a[0] + Math.sin(ang * Math.PI / 180) * len + k * 10 * s * (side ? 0 : 1), a[1] + Math.cos(ang * Math.PI / 180) * len]]; });
  if (o.handTo) armPts[1][1] = [o.handTo[0], o.handTo[1]];
  if (side) { tube(g, armPts[0][0], armPts[0][1], 36 * s, mul(o.body, 0.75), s); ball(g, armPts[0][1], 22 * s, o.hand || "#2c2a24", s); }
  // tronc
  const tws = side ? tw * 0.72 : tw;
  shadedBox(g, x - tws / 2, top, tws, th, 30 * s, o.body, o.bodyDark || mul(o.body, 0.62), s, 1);
  if (o.seam) { g.strokeStyle = rgba("#000000", 0.25); g.lineWidth = 4.05 * s; g.beginPath(); g.moveTo(x + (side ? 10 * s : 0), top + 40 * s); g.lineTo(x + (side ? 10 * s : 0), hipY - 6 * s); g.stroke(); }
  if (o.pocket) { g.strokeStyle = rgba("#000000", 0.28); g.lineWidth = 5.4 * s; g.beginPath(); g.roundRect(x - tws * 0.32, top + th * 0.55, tws * 0.64, th * 0.26, 10 * s); g.stroke(); }
  if (o.lapels) { g.fillStyle = mul(o.body, 0.78); [-1, 1].forEach(k => { g.beginPath(); g.moveTo(x, top + 70 * s); g.lineTo(x + k * 52 * s, top + 8 * s); g.lineTo(x + k * 16 * s, top + 8 * s); g.closePath(); g.fill(); }); }
  if (o.belt) { g.fillStyle = o.belt; g.fillRect(x - tws / 2 + 3 * s, hipY - 40 * s, tws - 6 * s, 22 * s); g.fillStyle = "#c9a24e"; g.fillRect(x - 12 * s, hipY - 38 * s, 24 * s, 18 * s); }
  if (o.holster) { g.fillStyle = "#1e2124"; outline(g, s); g.lineWidth = 5.4 * s; g.beginPath(); g.roundRect(x + tws * 0.22, hipY - 26 * s, 40 * s, 64 * s, 8 * s); g.fill(); g.stroke(); }
  if (o.epaulettes) { g.fillStyle = o.epaulettes; outline(g, s); g.lineWidth = 5.4 * s; [-1, 1].forEach(k => { g.beginPath(); g.roundRect(x + k * tws * 0.32 - 34 * s, top + 4 * s, 68 * s, 22 * s, 6 * s); g.fill(); g.stroke(); }); }
  if (o.armband) { g.fillStyle = o.armband; g.fillRect(x - tws / 2 - 2 * s, top + 120 * s, 0, 0); }
  if (o.insignia) { g.fillStyle = "#c9a24e"; g.beginPath(); g.moveTo(x - tws * 0.3, top + 70 * s); g.lineTo(x - tws * 0.3 + 18 * s, top + 92 * s); g.lineTo(x - tws * 0.3, top + 114 * s); g.lineTo(x - tws * 0.3 - 18 * s, top + 92 * s); g.closePath(); g.fill(); }
  if (o.badge) { g.fillStyle = "#c9c4b8"; g.fillRect(x - tws * 0.42, top + 70 * s, 84 * s, 30 * s); g.fillStyle = "#2a2620"; g.font = `500 ${20 * s}px 'Roboto Mono'`; g.fillText(o.badge, x - tws * 0.42 + 6 * s, top + 92 * s); }
  // col / capuche / écharpe : anneau plat (ellipse) — planche 9 : écharpe sauge #576150
  if (o.ring) { g.fillStyle = o.ring; g.beginPath(); g.ellipse(ring[0] + (side ? 8 * s : 0), ring[1], (side ? 92 : (o.ringW || 118)) * s, 34 * s, 0, 0, 7); g.fill(); outline(g, s); g.stroke(); }
  if (o.strings) { g.strokeStyle = "#d8dce0"; g.lineWidth = 5.4 * s; [-1, 1].forEach(k => { g.beginPath(); g.moveTo(x + k * 22 * s, ring[1] + 20 * s); g.lineTo(x + k * 26 * s, ring[1] + 90 * s); g.stroke(); }); }
  // tête
  headShape(g, headC, R, s, o);
  if (o.beard) { g.save(); g.beginPath(); g.arc(headC[0], headC[1], R, 0, 7); g.clip(); g.fillStyle = o.beard; g.beginPath(); g.ellipse(headC[0], headC[1] + R * 0.75, R * 1.05, R * 0.62, 0, 0, 7); g.fill(); g.restore(); }
  if (o.hair) { g.save(); g.beginPath(); g.arc(headC[0], headC[1], R, 0, 7); g.clip(); g.fillStyle = o.hair;
    g.beginPath(); g.moveTo(headC[0] - R * 1.1, headC[1] + R * 0.15);
    if (o.hairStyle === "swoosh") { g.lineTo(headC[0] - R * 1.1, headC[1] - R * 0.42); g.quadraticCurveTo(headC[0] - R * 0.2, headC[1] - R * 0.7, headC[0] + R * 0.6, headC[1] - R * 0.55); g.lineTo(headC[0] + R * 1.1, headC[1] - R * 0.3); }
    else { g.lineTo(headC[0] - R * 0.92, headC[1] - R * 0.25); g.quadraticCurveTo(headC[0] - R * 0.5, headC[1] - R * 0.5, headC[0] - R * 0.1, headC[1] - R * 0.42);
      g.quadraticCurveTo(headC[0] + R * 0.35, headC[1] - R * 0.52, headC[0] + R * 0.92, headC[1] - R * 0.25); g.lineTo(headC[0] + R * 1.1, headC[1] + R * 0.15); }
    g.lineTo(headC[0] + R * 1.1, headC[1] - R * 1.2); g.lineTo(headC[0] - R * 1.1, headC[1] - R * 1.2); g.closePath(); g.fill(); g.restore(); }
  if (o.helmet) { g.save(); g.beginPath(); g.arc(headC[0], headC[1], R * 1.04, 0, 7); g.clip();
    const hg = g.createRadialGradient(headC[0] - R * 0.35, headC[1] - R * 0.45, R * 0.05, headC[0], headC[1], R * 1.05); hg.addColorStop(0, "#4a4a4a"); hg.addColorStop(0.5, o.helmet); hg.addColorStop(1, "#0c0c0c");
    g.fillStyle = hg; g.fillRect(headC[0] - R * 1.1, headC[1] - R * 1.1, R * 2.2, R * 2.2);
    g.fillStyle = "#070707"; g.beginPath(); g.roundRect(headC[0] - R * 0.82, headC[1] - R * 0.22, R * 1.64, R * 0.5, R * 0.18); g.fill();
    g.strokeStyle = "rgba(160,175,190,0.55)"; g.lineWidth = 5.4 * s; g.beginPath(); g.moveTo(headC[0] - R * 0.6, headC[1] - R * 0.1); g.lineTo(headC[0] + R * 0.2, headC[1] - R * 0.1); g.stroke(); g.restore(); }
  if (o.cap) { g.save(); g.fillStyle = o.cap; outline(g, s);
    g.beginPath(); g.moveTo(headC[0] - R * 0.98, headC[1] - R * 0.28); g.quadraticCurveTo(headC[0] - R * 0.9, headC[1] - R * 1.18, headC[0], headC[1] - R * 1.2);
    g.quadraticCurveTo(headC[0] + R * 0.9, headC[1] - R * 1.18, headC[0] + R * 0.98, headC[1] - R * 0.28); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = "#14171a"; g.beginPath(); g.ellipse(headC[0] + R * 0.05, headC[1] - R * 0.26, R * 1.12, R * 0.17, 0, 0, Math.PI); g.fill(); g.stroke();       // visière
    g.fillStyle = "#c9a24e"; g.beginPath(); g.arc(headC[0], headC[1] - R * 0.66, R * 0.12, 0, 7); g.fill(); g.restore(); }       // insigne
  if (!o.helmet) eyes(g, headC, R, o);
  if (o.brows) { g.strokeStyle = "#2a241d"; g.lineWidth = R * 0.07; g.lineCap = "round"; [-1, 1].forEach(k => { g.beginPath(); g.moveTo(headC[0] + k * R * 0.45 + (o.look || 0) * R, headC[1] - R * 0.25); g.lineTo(headC[0] + k * R * 0.17 + (o.look || 0) * R, headC[1] - R * 0.18); g.stroke(); }); }
  if (o.glasses) { g.strokeStyle = INK; g.lineWidth = R * 0.04; [-1, 1].forEach(k => { g.beginPath(); g.arc(headC[0] + k * R * 0.31 + (o.look || 0) * R, headC[1] - R * 0.02, R * 0.2, 0, 7); g.stroke(); });
    g.beginPath(); g.moveTo(headC[0] - R * 0.11 + (o.look || 0) * R, headC[1] - R * 0.04); g.lineTo(headC[0] + R * 0.11 + (o.look || 0) * R, headC[1] - R * 0.04); g.stroke(); }
  if (o.moustache) { g.fillStyle = o.moustache; g.beginPath(); g.ellipse(headC[0] + (o.look || 0) * R, headC[1] + R * 0.36, R * 0.36, R * 0.13, 0, 0, 7); g.fill(); }
  outline(g, s); g.beginPath(); g.arc(headC[0], headC[1], o.helmet ? R * 1.04 : R, 0, 7); g.stroke();
  // bras avant + mains (boules sombres)
  armPts.forEach(([a, b], i) => { if (side && i === 0) return; tube(g, a, b, 36 * s, i === 0 ? o.body : mul(o.body, 0.85), s); ball(g, b, 22 * s, o.hand || "#2c2a24", s); });
  if (o.armbandCol) { const [a, b] = armPts[0]; const m = [a[0] + (b[0] - a[0]) * 0.3, a[1] + (b[1] - a[1]) * 0.3]; tube(g, [m[0], m[1] - 14 * s], [m[0], m[1] + 14 * s], 38 * s, o.armbandCol, s); }
  if (o.paper) { const b = armPts[1][1]; g.save(); g.translate(b[0], b[1] - 20 * s); g.rotate(-0.25); g.fillStyle = "#e9e3d3"; g.fillRect(-30 * s, -44 * s, 60 * s, 44 * s); outline(g, s); g.lineWidth = 5.4 * s; g.strokeRect(-30 * s, -44 * s, 60 * s, 44 * s);
    g.strokeStyle = "rgba(0,0,0,0.3)"; g.beginPath(); g.moveTo(-30 * s, -22 * s); g.lineTo(30 * s, -22 * s); g.stroke(); g.restore(); }
  if (o.baton) { const b = armPts[1][1]; tube(g, [b[0], b[1] - 10 * s], [b[0] + 10 * s, b[1] + 150 * s], 16 * s, "#1c1c1c", s); }
}
// personnages de l'épisode (palette du PDF ; construction des références)
const HERO = { body: "#6e2d5e", bodyDark: "#43193a", ring: "#6e2d5e", ringW: 80, torsoW: 165, beanie: true, strings: false, pocket: true, legs_col: "#2e3440", hair: "#2b211b", skin: "#ddd7cb" };
const PERE = { body: "#6e2d5e", bodyDark: "#43193a", ring: "#6e2d5e", ringW: 80, torsoW: 165, headRestroke: true, lapels: true, legs_col: "#3a3f4a", hair: "#9a9589", hairStyle: "swoosh", brows: true, glasses: true, moustache: "#8f8b84", skin: "#d9d2c5" };
const GARDE = { body: "#B8BEC4", bodyDark: "#7d848c", ring: "#8f969d", torsoW: 228, legs_col: "#5d646b", cap: "#2b3036", epaulettes: "#2b3036", armbandCol: "#7a1f30", belt: "#1e2124", holster: true, insignia: true, seam: true, brows: true, skin: "#d6cfc2", shoes: "#0f1011" };
