// ---------- v8 : dôme triangulé façon hologramme + ciel extérieur vert de radiation (plan 2), plus de gyrophare pendant la chute
// (seule la lumière rouge de l'alarme clignote), foule qui marche puis se fige d'un coup (plan 4), prise unique façade + règle 2 (plans 20-21) ----------

// ciel extérieur au-dessus de la surface du dôme : vert de radiation, nuages toxiques qui dérivent, particules
function outsideSky(q, cy, rx, ry) {
  q.save(); q.beginPath(); q.rect(-50, cy - 4000, W + 100, 4000); q.ellipse(W / 2, cy, rx, ry, 0, 0, 2 * Math.PI); q.clip("evenodd");
  const gr = q.createLinearGradient(0, cy - ry - 1300, 0, cy - ry + 40);
  gr.addColorStop(0, "#0c1407"); gr.addColorStop(0.45, "#22330b"); gr.addColorStop(0.8, "#4c6a14"); gr.addColorStop(1, "#7fa21f");
  q.fillStyle = gr; q.fillRect(-50, cy - 4000, W + 100, 4000);
  layer(q, r => { for (let i = 0; i < 14; i++) { const x = (rnd(i * 3.1) * 1400 - 160 + TT() * (18 + rnd(i) * 26)) % 1400 - 160, y = cy - ry - 120 - rnd(i * 7.3) * 900;
    glow(r, x, y, 160 + rnd(i * 5) * 220, i % 3 ? "#9fe03a" : "#d8f25a", 0.1 + rnd(i * 9) * 0.12); } }, { op: "screen", blur: 26 });   // nappes de gaz radioactif
  for (let i = 0; i < 70; i++) { const x = (rnd(i * 2.3) * W + TT() * 30 * (0.5 + rnd(i))) % W, y = cy - ry - rnd(i * 4.1) * 1200 + Math.sin(TT() * 2 + i) * 6;
    q.fillStyle = rgba("#d9ff7a", 0.25 + rnd(i * 6) * 0.4); q.fillRect(x, y, 3, 3); }
  const hz = q.createLinearGradient(0, cy - ry - 140, 0, cy - ry + 20); hz.addColorStop(0, "rgba(170,220,60,0)"); hz.addColorStop(1, "rgba(170,220,60,0.35)"); q.fillStyle = hz; q.fillRect(-50, cy - ry - 140, W + 100, 180);   // brume au ras du dôme
  q.restore();
}
// surface du dôme : maillage de triangles (géodésique) en hologramme teal ; hit = temps depuis l'impact (onde de triangles allumés)
function geoDome(g, cy, rx, ry, a, hit = null, hx = 540, hy = 1062) {
  const d = 0.085, hgt = d * 0.866, P = (nx, ny) => { const r = Math.hypot(nx, ny) || 1e-6, f = Math.sin(Math.min(1, r) * Math.PI / 2); return [W / 2 + rx * f * nx / r, cy - ry * f * ny / r, r]; };
  const tris = [];
  for (let j = 0; j * hgt < 1.05; j++) for (let i = -14; i <= 14; i++) {
    const x0 = i * d + (j % 2 ? d / 2 : 0), y0 = j * hgt, x1 = x0 + d / 2 * (j % 2 ? 1 : 1), y1 = y0 + hgt;
    tris.push([[x0, y0], [x0 + d, y0], [x0 + d / 2, y1]], [[x0 + d / 2, y1], [x0 + d, y0], [x0 + d * 1.5, y1]]);
  }
  layer(g, q => {
    q.save(); q.beginPath(); q.ellipse(W / 2, cy, rx, ry, 0, Math.PI, 2 * Math.PI); q.closePath(); q.clip();
    const fill = q.createLinearGradient(0, cy - ry, 0, cy); fill.addColorStop(0, rgba("#6fe0d6", 0.10 * a)); fill.addColorStop(1, rgba("#6fe0d6", 0.02 * a)); q.fillStyle = fill; q.fillRect(0, cy - ry, W, ry);
    q.lineJoin = "round";
    for (const t of tris) {
      const p = t.map(([x, y]) => P(x, y)); if (p.every(v => v[2] > 1.03)) continue;
      const cx = (p[0][0] + p[1][0] + p[2][0]) / 3, cyy = (p[0][1] + p[1][1] + p[2][1]) / 3, rr = (p[0][2] + p[1][2] + p[2][2]) / 3;
      let lit = 0;
      if (hit != null) { const dd = Math.hypot(cx - hx, (cyy - hy) * 2.2), R = 60 + hit * 2300; lit = Math.exp(-Math.pow((dd - R) / 110, 2)) * Math.max(0, 1 - hit / 0.7) + Math.max(0, 1 - dd / 170) * Math.exp(-hit / 0.12); }
      const sh = 0.5 + 0.5 * Math.sin(TT() * 3 + cx * 0.02 + cyy * 0.05);                                                    // scintillement doux
      q.beginPath(); q.moveTo(p[0][0], p[0][1]); q.lineTo(p[1][0], p[1][1]); q.lineTo(p[2][0], p[2][1]); q.closePath();
      if (lit > 0.02) { q.fillStyle = rgba("#9ff7ec", Math.min(0.85, lit * 0.8)); q.fill(); }
      else if (rnd(Math.round(cx) * 3.1 + Math.round(cyy)) < 0.06) { q.fillStyle = rgba("#6fe0d6", 0.08 * a * sh); q.fill(); }       // quelques facettes plus pleines
      q.strokeStyle = rgba(lit > 0.02 ? "#e4fffb" : "#6fe0d6", Math.min(1, a * (0.22 + 0.55 * Math.pow(rr, 3)) + lit)); q.lineWidth = lit > 0.02 ? 3 : 1.6; q.stroke();
    }
    q.restore();
    q.strokeStyle = rgba("#9ff7ec", a); q.lineWidth = 5; q.beginPath(); q.ellipse(W / 2, cy, rx, ry, 0, Math.PI, 2 * Math.PI); q.stroke();   // bord net
  }, { op: "screen" });
  layer(g, q => { q.strokeStyle = rgba("#6fe0d6", 0.55); q.lineWidth = 30; q.beginPath(); q.ellipse(W / 2, cy, rx, ry, 0, Math.PI, 2 * Math.PI); q.stroke(); }, { blur: 30, op: "screen" });
}
const DOME2 = [1500, 1400, 420];

// plan 2a : l'oiseau vole dehors sous le ciel vert et fonce droit dans la barrière
S.p02o2_vol_droit = g => {
  sky(g, [[0, "#05080a"], [0.6, "#0a1418"], [1, "#050607"]]);
  outsideSky(g, ...DOME2); geoDome(g, ...DOME2, 0.85);
  const u = TU(), x = B02.x0 + (B02.x1 - B02.x0) * u, y = B02.y0 + (B02.y1 - B02.y0) * u;
  for (let i = 1; i < 6; i++) { const d = i * 46; g.strokeStyle = rgba("#e8f5d0", 0.22 - i * 0.03); g.lineWidth = 5 - i * 0.6;
    g.beginPath(); g.moveTo(x - Math.cos(B02_ROT) * (d + 60) - Math.sin(B02_ROT) * (i % 2 ? 14 : -14), y - Math.sin(B02_ROT) * (d + 60) + Math.cos(B02_ROT) * (i % 2 ? 14 : -14));
    g.lineTo(x - Math.cos(B02_ROT) * (d + 160), y - Math.sin(B02_ROT) * (d + 160)); g.stroke(); }
  birdFlap(g, x, y, 1.6, B02_ROT, Math.sin(TT() * 6.2832 * 6));
  hud(g); finish(g, { bloom: 0.3, grade: ["#0c1a08", "#e4f4c0", 0.12] });
};

// plan 2b-2d : impact (triangles qui s'allument en onde), chute suivie, arrêt sur les personnages ; alarme = lumière rouge seulement
S.b02_choc_chute = g => {
  const ts = TS(), { tf, yb, O, stopped } = fall02(ts), C = mk(W, H), q = C.getContext("2d");
  sky(q, [[0, "#05080a"], [0.6, "#0a1418"], [1, "#070b0d"]]);
  q.save(); q.translate(0, -O);
  outsideSky(q, ...DOME2); geoDome(q, ...DOME2, 0.9, ts);
  for (let i = 0; i < 9; i++) { const side = i % 2, x = side ? 850 + rnd(i) * 160 : 40 + rnd(i) * 150, y = 1500 + i * 230, w = 160 + rnd(i * 3) * 120;
    q.fillStyle = "#0b1114"; q.fillRect(x - w / 2, y, w, 900); for (let r = 0; r < 10; r++) for (let c = 0; c < 3; c++) if (rnd(i * 50 + r * 3 + c) < 0.35) { q.fillStyle = rgba("#ffcf7a", 0.55); q.fillRect(x - w / 2 + 20 + c * (w - 40) / 3, y + 40 + r * 80, 18, 26); } }
  q.restore();
  const top = DROP - O;
  if (top < H) { const P = mk(W, H), pq = P.getContext("2d"); chars02(pq); pq.globalCompositeOperation = "destination-in"; const m = pq.createLinearGradient(0, 0, 0, 700); m.addColorStop(0, "rgba(0,0,0,0)"); m.addColorStop(1, "rgba(0,0,0,1)"); pq.fillStyle = m; pq.fillRect(0, 0, W, H); q.drawImage(P, 0, top); }
  const v = tf > 0 && !stopped ? (300 + 12000 * tf) / 30 : 0;
  if (v > 4) { const n = 5; g.globalAlpha = 1; g.drawImage(C, 0, 0); for (let i = 1; i < n; i++) { g.globalAlpha = 1 / (i + 1); g.drawImage(C, 0, -v * i / n * 0.6); } g.globalAlpha = 1; } else g.drawImage(C, 0, 0);
  const by = yb - O, bx = B02.x1 + tf * 40;
  if (ts < 0.10) birdFlap(g, B02.x1, B02.y1, 1.6, B02_ROT, -0.6);
  else if (by < H + 200) { const kr = Math.min(1, tf / 0.3), rot = B02_ROT + 1.1 * kr * kr * (3 - 2 * kr);
    if (v > 4) for (let i = 1; i < 4; i++) { g.globalAlpha = 0.25 / i; birdFlap(g, bx, by - v * i * 0.5, 1.6, rot, -1); } g.globalAlpha = 1;
    birdFlap(g, bx, by, 1.6, rot, -1); }
  if (ts < 0.2) { const fa = ts < 1 / 30 ? 1 : Math.exp(-(ts - 1 / 30) / 0.045); g.fillStyle = rgba("#ffffff", fa); g.fillRect(0, 0, W, H);
    g.save(); g.translate(0, -O); g.lineCap = "round"; g.shadowColor = "#bff5ff"; g.shadowBlur = 24;
    for (let i = 0; i < 9; i++) { const sd = i * 7 + Math.floor(ts * 30) * 13, a0 = rnd(sd) * 6.283; let x = B02.x1, y = B02.y1; g.strokeStyle = rgba(i % 3 ? "#dffaff" : "#8fd8ff", Math.min(1, 1.6 - ts * 7)); g.lineWidth = 4 - (i % 3); g.beginPath(); g.moveTo(x, y);
      for (let s = 0; s < 6; s++) { x += Math.cos(a0) * 45 + (rnd(sd + s) - 0.5) * 70; y += Math.sin(a0) * 30 + (rnd(sd * 3 + s) - 0.5) * 60; g.lineTo(x, y); } g.stroke(); }
    g.restore(); }
  // alarme hors champ, en face des personnages : seule sa lumière rouge clignote (pas de gyrophare qui suivrait la caméra)
  if (ts >= 0.10) { const I = alarmWash(g, 0); layer(g, r => glow(r, 540, 380, 900, "#ff3b2a", 0.35 * I), { op: "screen", blur: 20 }); }
  hud(g); finish(g, { bloom: 0.15, grade: ["#000000", "#ffd9a0", 0.0], vig: 0.6 });
};

// plan 4 : la foule marche (vue de dessus) puis se fige d'un coup sur « arrêtent »
const FREEZE4 = 0.85;
S.p04c_foule_discrete = g => {
  const ts = TS(), tm = Math.min(ts, FREEZE4), moving = ts < FREEZE4;
  sky(g, [[0, "#07090b"], [1, "#07090b"]]);
  roll(g, 0.18, q => {
    for (let y = -200; y < H + 200; y += 58) for (let x = -200; x < W + 200; x += 58) {
      const j = rnd(x * 1.3 + y), px = x + (j - 0.5) * 26 + (y / 58 % 2) * 29, py = y + (rnd(x + y * 3) - 0.5) * 20;
      const dc = Math.hypot(px - 540, py - 960);
      if (dc < 110) continue;
      const seed = x * 0.37 + y * 1.91 + 5, ang = rnd(seed * 5) * 6.2832, wx = -Math.sin(ang), wy = Math.cos(ang), sp = (45 + rnd(seed * 2.7) * 45) * Math.min(1, (dc - 110) / 160);
      const off = (tm - FREEZE4) * sp, st = moving ? Math.sin(ts * 25 + seed) * 3.5 : 0;           // ils arrivent à leur place au moment de se figer ; balancement de la marche
      const qx = px + wx * off + Math.cos(ang) * st, qy = py + wy * off + Math.sin(ang) * st;
      if (dc > 540 && rnd(x * 2 + y) > 0.6) { q.strokeStyle = rgba("#aab4b8", 0.22); q.lineWidth = 6; q.beginPath(); q.moveTo(qx, qy); q.lineTo(qx + (qx - 540) * 0.14, qy + (qy - 960) * 0.14); q.stroke(); }
      topPersonMuted(q, qx, qy, j, seed);
    }
  });
  layer(g, q => { const r = q.createRadialGradient(540, 960, 40, 540, 960, 620); r.addColorStop(0, "rgba(255,236,200,0.22)"); r.addColorStop(0.45, "rgba(255,220,170,0.07)"); r.addColorStop(1, "rgba(0,0,0,0)"); q.fillStyle = r; q.fillRect(0, 0, W, H); }, { op: "screen", blur: 6 });
  const v = g.createRadialGradient(540, 960, 260, 540, 960, 1000); v.addColorStop(0, "rgba(0,0,0,0)"); v.addColorStop(1, "rgba(0,0,0,0.6)"); g.fillStyle = v; g.fillRect(0, 0, W, H);
  zoomBlur(g, 540, 960, 0.012); hud(g, { alpha: 0.7 }); finish(g, { bloom: 0.5, grade: ["#1a0a0a", "#ffe2b0", 0.14] });
};

// plans 20-21 : une seule prise, le drone fonce vers la tour puis zoome sur la façade jusqu'à la règle 2
S.m20_regle2_un = g => { bg3d(g, "d20r21_facade"); hud(g, { zone: "LE CENTRE" }); fin3d(g); };
