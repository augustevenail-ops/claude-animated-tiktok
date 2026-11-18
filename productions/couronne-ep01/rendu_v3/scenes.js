// Scènes v3 « premium » : univers du dôme (districts froids, dôme teal, centre doré, dehors irradié, conseil bordeaux).
const TEAL = "#6fe0d6", AMBER = "#f0b35a", GOLD = "#f2d48a", BORDEAUX = "#7a1f30", TOX = "#b9a84a";
const DISTRICT_SKY = [[0, "#070c10"], [0.35, "#122028"], [0.62, "#1a2328"], [1, "#0a0d0f"]];
const S = {};
function street(g, o = {}) {                          // rue de district : dôme au-dessus, immeubles, mur du centre au fond, lampes sodium, sol mouillé
  sky(g, DISTRICT_SKY);
  domeBarrier(g, o.domeY || 1150, 1150, o.domeRy || 980, 0.55);
  if (o.centre) { layer(g, q => { glow(q, W / 2, 1010, 360, GOLD, 0.35); towers(q, 1030, W / 2, 300, 7, { k: 0.42 }); }, { blur: 4, alpha: 0.7 }); haze(g, 900, 1100, "#3a4a52", 0.35); layer(g, q => wallHex(q, 1060, 120, "#15181a", GOLD), { blur: 2 }); }
  layer(g, q => { blocks(q, 1120, 9, { h: 520, col: "#20262a", seed: 3, lit: 0.12 }); }, { blur: 1.6 });
  haze(g, 820, 1250, "#5a7a82", 0.22);
  const gr = g.createLinearGradient(0, 1100, 0, H); gr.addColorStop(0, "#1a2024"); gr.addColorStop(1, "#07090a"); g.fillStyle = gr; g.fillRect(0, 1100, W, H - 1100);
  [[180, 760], [900, 720]].forEach(([x, y]) => { g.fillStyle = "#0c0f11"; g.fillRect(x - 5, y, 10, 1120 - y); g.fillRect(x - 40, y - 6, 80, 10); glow(g, x, y + 10, 320, AMBER, 0.55);
    layer(g, q => { q.fillStyle = rgba(AMBER, 0.35); q.fillRect(x - 18, 1120, 36, 700); }, { blur: 22 }); });   // reflets sur sol mouillé
  dust(g, 140, "#cfe9e6", 300, 1300, 4, 2.4);
}
// ---------- MONDE ----------
S.w1_infographie_dome = g => {
  sky(g, [[0, "#05080b"], [0.5, "#0c151a"], [1, "#06090b"]]);
  const cx = 540, cy = 1060, P = (r, a, h = 0) => [cx + r * Math.cos(a), cy + r * Math.sin(a) * 0.4 - h];
  const ring = (r, h, col, lw, fill) => { g.beginPath(); for (let i = 0; i <= 64; i++) { const p = P(r, i / 64 * 6.2832, h); i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]); } if (fill) { g.fillStyle = fill; g.fill(); } g.strokeStyle = col; g.lineWidth = lw; g.stroke(); };
  layer(g, q => { const d = q.createRadialGradient(cx, cy, 300, cx, cy, 900); d.addColorStop(0, rgba(TOX, 0.0)); d.addColorStop(0.55, rgba(TOX, 0.22)); d.addColorStop(1, rgba(TOX, 0)); q.fillStyle = d; q.fillRect(0, 0, W, H); }, { blur: 10 });   // désert irradié
  ring(470, 0, rgba(TEAL, 0.7), 3, "rgba(14,24,28,0.92)");
  const hexp = (r) => Array.from({ length: 6 }, (_, i) => P(r, Math.PI / 3 * i + Math.PI / 6));
  for (let i = 0; i < 6; i++) { const a = Math.PI / 3 * i; const p0 = P(205, a), p1 = P(470, a); g.strokeStyle = rgba(TEAL, 0.25); g.lineWidth = 2; g.beginPath(); g.moveTo(p0[0], p0[1]); g.lineTo(p1[0], p1[1]); g.stroke(); }
  for (let i = 0; i < 2200; i++) { const r = 215 + rnd(i) * 245, a = rnd(i * 3) * 6.2832, p = P(r, a); g.fillStyle = rgba(AMBER, 0.25 + rnd(i * 7) * 0.55); g.fillRect(p[0], p[1], 2.2, 2.2); }
  g.beginPath(); hexp(200).forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.closePath(); g.fillStyle = "rgba(60,52,30,0.95)"; g.fill(); g.strokeStyle = rgba(GOLD, 0.95); g.lineWidth = 4; g.stroke();
  layer(g, q => { glow(q, cx, cy - 30, 260, GOLD, 0.55); for (let i = 0; i < 14; i++) { const p = P(140 * rnd(i * 5), rnd(i * 9) * 6.28), h = 40 + rnd(i) * 90; q.fillStyle = rgba(GOLD, 0.85); q.fillRect(p[0] - 6, p[1] - h, 12, h); } }, { op: "screen" });
  for (let m = 0; m < 16; m++) { const a = Math.PI / 8 * m; g.strokeStyle = rgba(TEAL, 0.35); g.lineWidth = 1.6; g.beginPath(); for (let t = 0; t <= 1.0001; t += 0.04) { const an = t * Math.PI / 2, p = P(470 * Math.cos(an), a, 470 * Math.sin(an) * 0.95); t ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]); } g.stroke(); }
  for (let k = 1; k < 6; k++) { const an = k * Math.PI / 12; ring(470 * Math.cos(an), 470 * Math.sin(an) * 0.95, rgba(TEAL, 0.22), 1.4); }
  layer(g, q => { q.strokeStyle = rgba(TEAL, 0.8); q.lineWidth = 14; q.beginPath(); for (let t = 0; t <= Math.PI; t += 0.05) { const p = P(470 * Math.cos(t), 0, 470 * Math.sin(t) * 0.95); t ? q.lineTo(p[0], p[1]) : q.moveTo(p[0], p[1]); } q.stroke(); }, { blur: 26, op: "screen", alpha: 0.6 });
  const you = P(380, -Math.PI / 2 + 0.15); glow(g, you[0], you[1], 70, AMBER, 0.9);
  pill(g, "LE DÔME", 540, 560); pill(g, "LE CENTRE", cx + 300, cy - 240, [cx + 70, cy - 70]); pill(g, "LES DISTRICTS", cx - 300, cy + 280, [cx - 250, cy + 110]); pill(g, "TOI · DISTRICT NORD", you[0] + 40, you[1] - 110, you);
  hud(g, { alpha: 0.5 }); finish(g, { bloom: 0.4, grade: ["#0a2a2c", "#f3d28a", 0.15] }); caption(g, ["SOUS", "UN", "DÔME"], 2);
};
S.w2_compte_a_rebours = g => {
  street(g, { centre: false });
  g.fillStyle = "#08090a"; g.fillRect(150, 470, 780, 470); g.strokeStyle = "rgba(90,40,34,0.9)"; g.lineWidth = 6; g.strokeRect(150, 470, 780, 470);   // écran public
  layer(g, q => glow(q, 540, 700, 700, "#ff3b2a", 0.5), { op: "screen" });
  seg7(g, "72:00", 540, 690, 1.0); g.font = "800 28px Montserrat"; g.fillStyle = "#e9c9a8"; g.textAlign = "center"; g.fillText("COUPURE DU CHAMP · DISTRICTS", 540, 900); g.textAlign = "left";
  layer(g, q => { q.fillStyle = rgba("#ff3b2a", 0.35); q.fillRect(330, 1130, 420, 800); }, { blur: 40, op: "screen" });   // reflet rouge au sol
  crowd(g, 1180, 8, { blur: 1.4, backs: true, tint: "#5a3a36", body: "#140f0e" });
  hud(g, { valueRed: true }); finish(g, { bloom: 0.45, grade: ["#1a0606", "#ffb08a", 0.18] }); caption(g, ["D'ICI", "3", "JOURS,"], 2);
};
S.w3_regle_1 = g => {                                  // limite du dôme : barrière teal, dehors désert irradié
  sky(g, [[0, "#0b0d08"], [0.45, "#3a3a1c"], [0.62, "#6d6526"], [0.8, "#2a2814"], [1, "#0a0a06"]]);
  layer(g, q => { for (let i = 0; i < 6; i++) { q.fillStyle = rgba("#2a2612", 0.9); q.beginPath(); q.ellipse(rnd(i * 4) * W, 1180, 260 + rnd(i) * 200, 70, 0, Math.PI, 0); q.fill(); } }, { blur: 6 });   // dunes
  haze(g, 900, 1400, TOX, 0.35); dust(g, 260, "#e8dc8a", 600, 1500, 9, 2.2);
  layer(g, q => { q.fillStyle = rgba(TEAL, 0.10); q.fillRect(0, 380, W, 1000); }, { op: "screen" });
  domeBarrier(g, 2050, 1500, 1700, 0.8);
  g.fillStyle = "rgba(6,10,12,0.78)"; g.strokeStyle = rgba(TEAL, 0.5); g.lineWidth = 3; g.beginPath(); g.roundRect(90, 610, 900, 430, 10); g.fill(); g.stroke();
  neon(g, "RÈGLE 1", 540, 745, "600 108px Oswald", "#ff8a78", "rgba(255,90,70,0.9)");
  neon(g, "NE SORS JAMAIS", 540, 865, "900 62px Montserrat", "#f3e2b0", "rgba(255,220,150,0.6)");
  neon(g, "DU DÔME.", 540, 948, "900 62px Montserrat", "#e8786a", "rgba(255,90,70,0.7)");
  layer(g, q => { q.fillStyle = "#050607"; for (let x = -20; x < W + 40; x += 120) q.fillRect(x, 1250, 18, 700); q.fillRect(0, 1300, W, 22); q.fillRect(0, 1480, W, 22); }, { blur: 9 });   // grille au premier plan, floue
  hud(g); finish(g, { bloom: 0.45, grade: ["#071a1a", "#f0e6a0", 0.16] }); caption(g, ["NE", "SORS", "JAMAIS"], 1);
};
S.w4_feuille_lecture = g => {                         // plan subjectif : il vient de lire la feuille, tenue à deux mains, penchée vers lui
  sky(g, [[0, "#0a0f12"], [0.5, "#141c22"], [1, "#07090b"]]);
  layer(g, q => { q.fillStyle = "rgba(111,224,214,0.35)"; q.fillRect(620, 160, 360, 560); q.fillStyle = "#0a0e10"; q.fillRect(790, 160, 16, 560); q.fillRect(620, 430, 360, 16);
    glow(q, 200, 420, 260, AMBER, 0.7); glow(q, 330, 260, 120, AMBER, 0.5); }, { blur: 22 });
  const P = mk(720, 900), p = P.getContext("2d");                     // la feuille (texte au feutre, plis en croix)
  p.fillStyle = "#ece6d6"; p.fillRect(0, 0, 720, 900);
  const lg = p.createLinearGradient(0, 0, 720, 900); lg.addColorStop(0, "rgba(255,236,200,0.35)"); lg.addColorStop(1, "rgba(0,0,0,0.25)"); p.fillStyle = lg; p.fillRect(0, 0, 720, 900);
  [[0, 450, 720, 450], [360, 0, 360, 900]].forEach(([a, b, c, d]) => { p.strokeStyle = "rgba(0,0,0,0.18)"; p.lineWidth = 4; p.beginPath(); p.moveTo(a, b); p.lineTo(c, d); p.stroke(); p.strokeStyle = "rgba(255,255,255,0.4)"; p.lineWidth = 2; p.beginPath(); p.moveTo(a + 3, b + 3); p.lineTo(c + 3, d + 3); p.stroke(); });
  p.fillStyle = "#1c1a17"; p.font = "400 72px 'Permanent Marker'"; p.textAlign = "center"; p.fillText("IL RESTE", 360, 250); p.fillText("DE L'ÉNERGIE.", 360, 345); p.fillText("ILS NOUS", 360, 600); p.fillText("MENTENT.", 360, 695);
  g.save(); g.shadowColor = "rgba(0,0,0,0.65)"; g.shadowBlur = 50; g.shadowOffsetY = 30; g.fillStyle = "#000"; g.beginPath(); g.moveTo(300, 560); g.lineTo(820, 590); g.lineTo(980, 1430); g.lineTo(110, 1400); g.closePath(); g.fill(); g.restore();
  perspectiveImage(g, P, [[300, 560], [820, 590], [980, 1430], [110, 1400]]);
  g.save(); g.globalCompositeOperation = "multiply"; const sh = g.createLinearGradient(0, 560, 0, 1430); sh.addColorStop(0, "rgba(120,140,150,1)"); sh.addColorStop(1, "rgba(255,240,215,1)"); g.fillStyle = sh;   // lumière : haut de la feuille dans l'ombre
  g.beginPath(); g.moveTo(300, 560); g.lineTo(820, 590); g.lineTo(980, 1430); g.lineTo(110, 1400); g.closePath(); g.fill(); g.restore();
  [[[-140, 2100], [150, 1400]], [[1220, 2100], [940, 1420]]].forEach(([a, b]) => { tube(g, a, b, 170, "#4A6A8A", 3.2); g.save(); g.globalAlpha = 0.5; tube(g, [a[0], a[1] + 40], [b[0], b[1] + 60], 70, "#2c4256", 0.1); g.restore(); ball(g, b, 66, "#2c2a24", 3.2); });   // manches + mains (boules) qui tiennent les coins
  dust(g, 60, "#f2e3c0", 200, 1700, 13, 2.5);
  hud(g); finish(g, { bloom: 0.3, grade: ["#08202a", "#ffd9a0", 0.16] }); caption(g, ["ILS", "NOUS", "MENTENT."], 2, 1640);
};
S.c8_heros_feuille = g => {                            // il vient de lire : feuille dans la main, regard baissé
  sky(g, [[0, "#0a0f12"], [0.5, "#16202a"], [1, "#07090b"]]);
  layer(g, q => { q.fillStyle = "rgba(111,224,214,0.4)"; q.fillRect(80, 300, 340, 600); q.fillStyle = "#0a0e10"; q.fillRect(240, 300, 16, 600); glow(q, 860, 420, 300, AMBER, 0.6); }, { blur: 18 });
  actor(g, 540, 2650, 2.3, { ...HERO, eyeDy: 0.16, look: 0.05, arms: [[-1, 0], [1, -32]], handTo: [740, 1700], paper: true }, { rim: TEAL, rimAng: -2.5, rimW: 7, key: "#ffd9a0", shadow: false });
  dust(g, 50, "#cfe9e6", 0, 1500, 23, 3); hud(g); finish(g, { grade: ["#06202a", "#ffd9a0", 0.16] }); caption(g, ["IL", "RESTE", "DE L'ÉNERGIE."], 2);
};
S.w5_haut_parleur = g => {                             // annonce du conseil : haut-parleur de rue, lumière bordeaux, foule de dos
  street(g, { centre: false });
  layer(g, q => glow(q, 540, 520, 900, BORDEAUX, 0.55), { op: "screen" });
  g.fillStyle = "#0b0d0e"; g.fillRect(530, 280, 20, 900);
  [[-1, 0.35], [1, -0.35]].forEach(([k, r]) => { g.save(); g.translate(540 + k * 90, 420); g.rotate(r); g.fillStyle = "#15181a"; g.strokeStyle = "#5e6468"; g.lineWidth = 5;
    g.beginPath(); g.moveTo(0, -30); g.lineTo(k * 160, -90); g.lineTo(k * 160, 90); g.lineTo(0, 30); g.closePath(); g.fill(); g.stroke(); g.restore(); });
  [1, 2, 3].forEach(i => { g.strokeStyle = rgba("#ffd0c0", 0.42 - i * 0.1); g.lineWidth = 6; g.beginPath(); g.arc(540, 420, 230 + i * 60, -0.5, 0.5); g.stroke(); g.beginPath(); g.arc(540, 420, 230 + i * 60, Math.PI - 0.5, Math.PI + 0.5); g.stroke(); });
  glow(g, 540, 300, 60, "#ff3b2a", 0.95);
  pill(g, "LE CONSEIL · RADIO", 540, 760);
  crowd(g, 1150, 9, { blur: 1.3, backs: true, tint: "#4a3236", body: "#120d0e" });
  hud(g); finish(g, { bloom: 0.4, grade: ["#1a0610", "#ffc0b0", 0.18] }); caption(g, ["LE", "CONSEIL", "ANNONCE"], 1);
};
S.w6_district_rue = g => { street(g); crowd(g, 1260, 7, { blur: 1.2, backs: true, tint: "#3e4c54", body: "#0e1214" }); hud(g); finish(g, { bloom: 0.4, grade: ["#06202a", "#ffd9a0", 0.16] }); caption(g, ["TOUT", "AUTOUR,"], 1); };
S.w7_centre_mur = g => {                               // le second mur, le centre doré derrière
  sky(g, [[0, "#0c0f12"], [0.4, "#3a3222"], [0.6, "#6b5530"], [1, "#0a0b0c"]]);
  layer(g, q => { glow(q, 540, 980, 600, GOLD, 0.5); towers(q, 1060, 540, 820, 9, { k: 0.85 }); }, { blur: 2.5 }); haze(g, 900, 1150, "#c8a868", 0.18);
  rays(g, 540, 900, Math.PI / 2, 1.2, 1100, GOLD, 0.16);
  layer(g, q => { wallHex(q, 1330, 330, "#121416", GOLD); q.fillStyle = "#0a0b0c"; q.fillRect(410, 1060, 260, 270); q.strokeStyle = rgba(GOLD, 0.6); q.lineWidth = 4; q.strokeRect(410, 1060, 260, 270); }, {});
  haze(g, 1150, 1500, "#3a4a52", 0.3);
  const gr = g.createLinearGradient(0, 1330, 0, H); gr.addColorStop(0, "#1a1f22"); gr.addColorStop(1, "#060708"); g.fillStyle = gr; g.fillRect(0, 1330, W, H - 1330);
  dust(g, 160, "#ffe9b8", 500, 1400, 17, 2.2);
  hud(g); finish(g, { bloom: 0.45, grade: ["#08161c", "#ffd78a", 0.18] }); caption(g, ["LE", "CENTRE,"], 1);
};

// ---------- FPV ----------
S.f1_fpv_plongee_dome = g => {                         // plongée à travers le dôme vers le centre (anneaux hexagonaux emboîtés)
  sky(g, [[0, "#06090b"], [1, "#06090b"]]);
  roll(g, 0.32, q => { shaft(q, { sides: 6, rot: 0, n: 13, f: 0.78, r0: 1500, wall: "#1b2429", line: TEAL, lamp: AMBER, core: GOLD, coreR: 300, people: 0.5, labels: { 2: "DISTRICT NORD", 6: "SECOND MUR", 10: "LE CENTRE" } }); });
  zoomBlur(g, 540, 960, 0.025);
  hud(g); finish(g, { bloom: 0.45, grade: ["#06202a", "#ffd78a", 0.16] }); caption(g, ["ICI,", "LES", "RICHES"], 2);
};
S.f2_fpv_rue = g => {                                   // vol bas le long de la rue vers le mur du centre
  sky(g, [[0, "#06090b"], [1, "#06090b"]]);
  roll(g, -0.2, q => { shaft(q, { sides: 4, rot: Math.PI / 4, n: 15, f: 0.8, r0: 1400, sy: 1.25, vy: 900, wall: "#20262a", line: "#9fb0b8", lamp: AMBER, core: GOLD, coreR: 220, people: 0.35, labels: { 3: "NORD", 9: "CENTRE" } });
    figure(q, 560, 1430, 0.17, HERO); pill(q, "TOI", 560, 1230); });
  zoomBlur(g, 540, 900, 0.03); hud(g, { clock: "07:05" }); finish(g, { bloom: 0.4, grade: ["#06202a", "#ffd78a", 0.16] }); caption(g, ["LE", "LENDEMAIN", "MATIN,"], 1);
};
S.f3_fpv_foule_dessus = g => {                          // vue de dessus, la foule immobile, le héros éclairé au centre
  sky(g, [[0, "#0b0f12"], [1, "#0b0f12"]]);
  roll(g, 0.18, q => {
    for (let y = -200; y < H + 200; y += 74) for (let x = -200; x < W + 200; x += 74) { const j = rnd(x * 1.3 + y), px = x + (j - 0.5) * 30 + (y / 74 % 2) * 37, py = y + (rnd(x + y * 3) - 0.5) * 24;
      if (Math.hypot(px - 540, py - 960) < 90) continue;
      q.fillStyle = mul("#1d2226", 0.8 + j * 0.5); q.beginPath(); q.ellipse(px, py + 6, 34, 22, j * 3, 0, 7); q.fill();
      const hg = q.createRadialGradient(px - 6, py - 6, 2, px, py, 22); hg.addColorStop(0, j > 0.7 ? "#3a2c22" : "#d8d2c6"); hg.addColorStop(1, j > 0.7 ? "#1d1611" : "#7f7a71"); q.fillStyle = hg; q.beginPath(); q.arc(px, py, 20, 0, 7); q.fill(); }
    glow(q, 540, 960, 260, TEAL, 0.45);
    q.fillStyle = "#2c4256"; q.beginPath(); q.ellipse(540, 966, 44, 28, 0.2, 0, 7); q.fill(); q.strokeStyle = INK; q.lineWidth = 4; q.stroke();
    const hg = q.createRadialGradient(532, 950, 2, 540, 958, 26); hg.addColorStop(0, "#f6f3ec"); hg.addColorStop(1, "#9d9a94"); q.fillStyle = "#2b211b"; q.beginPath(); q.arc(540, 958, 26, 0, 7); q.fill(); q.stroke();
    pill(q, "TOI", 540, 1060); });
  zoomBlur(g, 540, 960, 0.015); hud(g); finish(g, { bloom: 0.35, grade: ["#06202a", "#ffd9a0", 0.16] }); caption(g, ["ARRÊTENT", "DE", "BOUGER."], 0);
};
S.f4_fpv_mur_montee = g => {                            // contre-plongée le long du second mur, vers le sommet du dôme
  sky(g, [[0, "#06090b"], [1, "#06090b"]]);
  roll(g, -0.35, q => { shaft(q, { sides: 6, rot: Math.PI / 6, n: 12, f: 0.76, r0: 1500, wall: "#15191c", line: "#b9c4c8", lamp: TEAL, core: TEAL, coreR: 260, people: 0.2, labels: { 4: "SECOND MUR" } }); });
  rays(g, 540, 960, -Math.PI / 2, 6, 1300, TEAL, 0.1, 12); zoomBlur(g, 540, 960, 0.02);
  hud(g); finish(g, { bloom: 0.45, grade: ["#04161a", "#c8f4ee", 0.16] }); caption(g, ["UN", "MUR", "LE SÉPARE"], 1);
};
// ---------- PERSONNAGES ----------
S.c1_heros_pied = g => { street(g); crowd(g, 1280, 4, { blur: 4, alpha: 0.85, backs: false, tint: "#3e4c54", body: "#0e1214", big: 1.3 });
  actor(g, 540, 1730, 1.15, HERO, { rim: TEAL, rimAng: -2.2, key: "#ffd9a0" }); hud(g); finish(g, { grade: ["#06202a", "#ffd9a0", 0.16] }); caption(g, ["TOI,"], 0); };
S.c2_heros_buste = g => { sky(g, DISTRICT_SKY); layer(g, q => { blocks(q, 1100, 7, { h: 700, col: "#1c2226", seed: 5, lit: 0.3 }); [[200, 600], [880, 520], [640, 900]].forEach(([x, y]) => glow(q, x, y, 220, AMBER, 0.6)); }, { blur: 18 });
  domeBarrier(g, 1100, 1100, 900, 0.4); dust(g, 50, "#cfe9e6", 0, 1500, 21, 3);
  actor(g, 540, 2650, 2.3, HERO, { rim: TEAL, rimAng: -2.3, rimW: 7, key: "#ffd9a0", shadow: false }); hud(g); finish(g, { grade: ["#06202a", "#ffd9a0", 0.16] }); caption(g, ["TOI,"], 0); };
S.c3_heros_marche = g => { street(g); actor(g, 540, 1730, 1.15, { ...HERO, side: 1, look: 0.28, headDx: 12, legs: [[-0.2, -24], [0.2, 22]], arms: [[-1, 22], [1, -22]] }, { rim: AMBER, rimAng: 0.2, key: "#ffd9a0" });
  layer(g, q => crowd(q, 1550, 2, { backs: true, tint: "#2e3a40", body: "#07090a", big: 1.8 }), { blur: 10 }); hud(g); finish(g, { grade: ["#06202a", "#ffd9a0", 0.16] }); caption(g, ["TU", "AVANCES."], 1); };
S.c4_pere_buste = g => { sky(g, [[0, "#0e1418"], [0.5, "#2a3640"], [1, "#0b0e10"]]);   // petit matin froid, fenêtre
  layer(g, q => { q.fillStyle = "rgba(170,200,215,0.55)"; q.fillRect(620, 320, 340, 620); q.fillStyle = "#0c1013"; q.fillRect(780, 320, 14, 620); q.fillRect(620, 620, 340, 14); }, { blur: 14 });
  rays(g, 790, 600, 2.35, 0.5, 1300, "#bcd4e0", 0.14);
  actor(g, 540, 2650, 2.3, { ...PERE, look: -0.08, arms: [[-1, 0], [1, -20]], handTo: [760, 1560], paper: true }, { rim: "#cfe3ee", rimAng: -0.7, key: "#dfe9ef", shadow: false });
  dust(g, 70, "#dfeef5", 200, 1700, 31, 2.5); hud(g, { clock: "07:02" }); finish(g, { grade: ["#0a1a24", "#e6f0f5", 0.16] }); caption(g, ["PRENDS", "ÇA."], 0); };
S.c5_pere_escorte = g => { street(g); layer(g, q => { q.fillStyle = "rgba(190,210,220,0.10)"; q.fillRect(0, 0, W, H); }, { op: "screen" });
  actor(g, 370, 1730, 1.08, { ...PERE, eyeDy: 0.08, headDy: 12, arms: [[-1, 4], [1, 10]] }, { rim: "#cfe3ee", rimAng: -2.4, key: "#dfe9ef", shDx: 40 });
  actor(g, 730, 1730, 1.18, { ...GARDE, arms: [[-1, -28], [1, 4]], handTo: [470, 1150] }, { rim: "#cfe3ee", rimAng: -2.4, key: "#dfe9ef", shDx: 40 });
  hud(g, { clock: "07:05" }); finish(g, { grade: ["#0a1a24", "#e6f0f5", 0.16] }); caption(g, ["IL", "NE", "SE DÉBAT"], 2); };
S.c6_garde_centre = g => { window.SCENES_ALL.w7_centre_mur_bg(g); actor(g, 540, 1760, 1.2, { ...GARDE, baton: true }, { rim: GOLD, rimAng: -1.57, rimW: 11, key: "#ffe6b0" }); hud(g, { clock: "07:20" }); finish(g, { grade: ["#08161c", "#ffd78a", 0.18] }); caption(g, ["AU", "CENTRE."], 1); };
S.w7_centre_mur_bg = g => { sky(g, [[0, "#0c0f12"], [0.4, "#3a3222"], [0.6, "#6b5530"], [1, "#0a0b0c"]]); layer(g, q => { glow(q, 540, 980, 600, GOLD, 0.5); towers(q, 1060, 540, 820, 9, { k: 0.85 }); }, { blur: 6 }); haze(g, 900, 1150, "#c8a868", 0.18);
  rays(g, 540, 900, Math.PI / 2, 1.2, 1100, GOLD, 0.14); layer(g, q => { wallHex(q, 1330, 330, "#121416", GOLD); }, { blur: 3 });
  const gr = g.createLinearGradient(0, 1330, 0, H); gr.addColorStop(0, "#1a1f22"); gr.addColorStop(1, "#060708"); g.fillStyle = gr; g.fillRect(0, 1330, W, H - 1330); dust(g, 120, "#ffe9b8", 500, 1400, 19, 2.2); };
S.c7_heros_foule = g => { street(g, { centre: false }); crowd(g, 820, 13, { blur: 1.0, backs: true, tint: "#3e4c54", body: "#0e1214" });
  actor(g, 540, 1420, 0.55, HERO, { rim: TEAL, rimAng: -1.57, rimW: 6, key: "#ffd9a0" }); layer(g, q => crowd(q, 1500, 3, { backs: true, tint: "#2e3a40", body: "#07090a", big: 1.6 }), { blur: 8 });
  glow(g, 540, 1180, 220, TEAL, 0.25); hud(g); finish(g, { grade: ["#06202a", "#ffd9a0", 0.16] }); caption(g, ["PERSONNE", "N'EN", "REVIENT."], 0); };
// ---------- ÉPISODE 1 : scènes ajoutées (PLAN_DES_PLANS.md) ----------
S.c11_boussole_table = g => {                         // plan 2 : très gros plan sur la boussole, aiguille affolée, tasse floue au premier plan
  sky(g, [[0, "#0d1114"], [1, "#07090a"]]);
  layer(g, q => { q.fillStyle = "#1c1712"; q.fillRect(0, 1180, W, H - 1180); q.fillStyle = "rgba(111,224,214,0.18)"; q.beginPath(); q.ellipse(540, 1000, 520, 380, 0, 0, 7); q.fill(); }, { blur: 3 });
  glow(g, 540, 1000, 720, TEAL, 0.22);
  g.beginPath(); g.arc(540, 1000, 420, 0, 7); const bz = g.createRadialGradient(480, 900, 60, 540, 1000, 420); bz.addColorStop(0, "#c9ccd0"); bz.addColorStop(0.85, "#5d646b"); bz.addColorStop(1, "#2a2e33"); g.fillStyle = bz; g.fill(); outline(g, 1.4); g.stroke();
  g.beginPath(); g.arc(540, 1000, 350, 0, 7); g.fillStyle = "#e7f2ef"; g.fill(); g.strokeStyle = rgba(TEAL, 0.9); g.lineWidth = 6; g.stroke();
  for (let i = 0; i < 36; i++) { const a = i / 36 * 6.2832, r0 = i % 3 ? 318 : 300; g.strokeStyle = "#2b2f33"; g.lineWidth = i % 3 ? 3 : 6; g.beginPath(); g.moveTo(540 + Math.cos(a) * r0, 1000 + Math.sin(a) * r0); g.lineTo(540 + Math.cos(a) * 340, 1000 + Math.sin(a) * 340); g.stroke(); }
  g.font = "900 60px Montserrat"; g.fillStyle = "#2b2f33"; g.textAlign = "center"; ["N", "E", "S", "O"].forEach((t, i) => { const a = -Math.PI / 2 + i * Math.PI / 2; g.fillText(t, 540 + Math.cos(a) * 250, 1000 + Math.sin(a) * 250 + 22); }); g.textAlign = "left";
  const tr = Math.sin(3.3) * 0.12, na = 1.1 + tr;   // aiguille qui tremble (champ magnétique)
  g.save(); g.translate(540, 1000); g.rotate(na); g.fillStyle = "#c83a2c"; g.beginPath(); g.moveTo(0, -250); g.lineTo(38, 0); g.lineTo(0, 20); g.closePath(); g.fill();
  g.fillStyle = "#e8e4dc"; g.beginPath(); g.moveTo(0, 250); g.lineTo(38, 0); g.lineTo(0, 20); g.closePath(); g.fill(); g.restore();
  g.beginPath(); g.arc(540, 1000, 26, 0, 7); g.fillStyle = "#1a1d20"; g.fill(); outline(g, 1); g.stroke();
  glow(g, 540, 1000, 180, TEAL, 0.35);
  g.beginPath(); g.ellipse(960, 1560, 260, 120, 0, 0, 7); g.fillStyle = "rgba(20,15,10,0.9)"; g.filter = "blur(14px)"; g.fill(); g.filter = "none";
  for (let i = 0; i < 4; i++) { g.strokeStyle = rgba("#dfe9ef", 0.12 - i * 0.02); g.lineWidth = 16; g.beginPath(); for (let t = 0; t <= 1; t += 0.05) { const x = 880 + Math.sin(t * 9 + i) * 40 + i * 20, y = 1400 - t * 360; t ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); }
  dust(g, 60, "#cfe9e6", 300, 1500, 37, 2.4);
  hud(g); finish(g, { bloom: 0.4, grade: ["#06202a", "#ffd9a0", 0.16] }); caption(g, ["TU", "VIS"], 0);
};
S.w10_lampes_eteintes = g => {                        // rue de district : les lampadaires s'éteignent un à un
  street(g);
  lamp(g, 330, 780, "#e9d6a4", 0.9); lamp(g, 700, 780, "#4a4a48", 0.9);
  layer(g, q => { q.fillStyle = "rgba(4,6,8,0.55)"; q.fillRect(600, 640, 220, 560); }, { blur: 6 });
  rays(g, 330, 760, Math.PI / 2, 0.4, 900, AMBER, 0.08, 4);
  hud(g, { clock: "21:40", zone: "DISTRICT SUD" }); finish(g, { bloom: 0.35, grade: ["#06202a", "#ffd78a", 0.16] }); caption(g, ["PLUS", "D'ÉNERGIE."], 1);
};
S.w1d_vue_aerienne_tags = g => {                     // vue du dôme de haut, étiquettes des riches et des six districts
  sky(g, [[0, "#05080b"], [0.5, "#0c151a"], [1, "#06090b"]]);
  const cx = 540, cy = 1000, P = (r, a, h = 0) => [cx + r * Math.cos(a), cy + r * Math.sin(a) * 0.4 - h];
  const ring = (r, col, lw, fill) => { g.beginPath(); for (let i = 0; i <= 64; i++) { const p = P(r, i / 64 * 6.2832); i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]); } if (fill) { g.fillStyle = fill; g.fill(); } g.strokeStyle = col; g.lineWidth = lw; g.stroke(); };
  ring(620, rgba(TEAL, 0.7), 3, "rgba(14,24,28,0.92)");
  for (let i = 0; i < 1400; i++) { const r = 250 + rnd(i) * 360, a = rnd(i * 3) * 6.2832, p = P(r, a); g.fillStyle = rgba(AMBER, 0.2 + rnd(i * 7) * 0.5); g.fillRect(p[0], p[1], 2.2, 2.2); }
  for (let m = 0; m < 12; m++) { const a = Math.PI / 6 * m; g.strokeStyle = rgba(TEAL, 0.3); g.lineWidth = 1.6; g.beginPath(); const p0 = P(230, a), p1 = P(620, a); g.moveTo(p0[0], p0[1]); g.lineTo(p1[0], p1[1]); g.stroke(); }
  g.beginPath(); for (let i = 0; i < 6; i++) { const a = Math.PI / 3 * i + Math.PI / 6, p = P(230, a); i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]); } g.closePath(); g.fillStyle = "rgba(60,52,30,0.95)"; g.fill(); g.strokeStyle = rgba(GOLD, 0.95); g.lineWidth = 4; g.stroke();
  layer(g, q => { glow(q, cx, cy, 240, GOLD, 0.5); for (let i = 0; i < 12; i++) { const p = P(140 * rnd(i * 5), rnd(i * 9) * 6.28), h = 60 + rnd(i) * 120; q.fillStyle = rgba(GOLD, 0.9); q.fillRect(p[0] - 9, p[1] - h, 18, h); } }, { op: "screen" });
  layer(g, q => { q.strokeStyle = rgba(TEAL, 0.8); q.lineWidth = 14; q.beginPath(); for (let t = 0; t <= Math.PI; t += 0.05) { const p = P(620 * Math.cos(t), 0, 620 * Math.sin(t) * 0.95); t ? q.lineTo(p[0], p[1]) : q.moveTo(p[0], p[1]); } q.stroke(); }, { blur: 22, op: "screen", alpha: 0.6 });
  pill(g, "LES RICHES", cx + 210, cy - 250, [cx + 90, cy - 90]);
  pill(g, "LE CENTRE", cx - 220, cy - 150, [cx - 110, cy - 50]);
  [["NORD", -Math.PI / 2], ["NORD-EST", -Math.PI / 6], ["SUD-EST", Math.PI / 6], ["SUD", Math.PI / 2], ["SUD-OUEST", 5 * Math.PI / 6], ["OUEST", 7 * Math.PI / 6]].forEach(([t, a]) => { const p = P(420, a); pill(g, t, p[0], p[1]); });
  hud(g, { alpha: 0.5 }); finish(g, { bloom: 0.4, grade: ["#0a2a2c", "#f3d28a", 0.15] }); caption(g, ["LES", "RICHES", "AU", "CENTRE"], 1);
};
S.f5_fpv_barriere = g => {                           // FPV : traversée de la barrière vers le désert irradié
  sky(g, [[0, "#1a1d0a"], [0.5, "#4a4a1e"], [0.7, "#3a3a18"], [1, "#0a0a06"]]);
  roll(g, 0.08, q => {
    layer(q, z => { for (let i = 0; i < 8; i++) { z.fillStyle = rgba("#2a2612", 0.9); z.beginPath(); z.ellipse(rnd(i * 4) * W, 1200, 300 + rnd(i) * 220, 90, 0, Math.PI, 0); z.fill(); } }, { blur: 5 });
    haze(q, 700, 1400, TOX, 0.4); dust(q, 320, "#e8dc8a", 500, 1600, 41, 2.6);
    domeBarrier(q, 1000, 1000, 1000, 0.7);
    glow(q, 540, 980, 420, TOX, 0.35);
  });
  zoomBlur(g, 540, 960, 0.035);
  hud(g, { zone: "HORS DU DÔME", value: "03 %", label: "RADIATION" }); finish(g, { bloom: 0.35, grade: ["#1a1a06", "#e8dc8a", 0.18] }); caption(g, ["DEHORS,", "L'AIR", "TUE."], 1);
};
S.d1_dossier = g => {                                // insert : ses mains ouvrent le dossier « DÔME »
  g.fillStyle = "#16110c"; g.fillRect(0, 0, W, H);
  layer(g, q => { q.fillStyle = "#2b2016"; q.fillRect(0, 900, W, 1020); for (let i = 0; i < 40; i++) { q.fillStyle = "rgba(0,0,0,0.12)"; q.fillRect(0, 900 + i * 26, W, 2); } }, { blur: 2 });
  lamp(g, 540, 300, "#f0d9a6", 1.1);
  g.save(); g.translate(540, 1000); g.rotate(-0.03);
  g.fillStyle = "#d9c9a4"; g.fillRect(-340, -420, 680, 840); g.strokeStyle = INK; g.lineWidth = 6; g.strokeRect(-340, -420, 680, 840);
  g.fillStyle = "#c9b68e"; g.fillRect(-340, -470, 220, 60); g.strokeRect(-340, -470, 220, 60);
  g.fillStyle = "#f4ecd9"; g.fillRect(-300, -380, 600, 720); g.strokeStyle = "rgba(60,50,40,0.5)"; g.lineWidth = 3;
  for (let y = -330; y < 300; y += 44) { g.beginPath(); g.moveTo(-260, y); g.lineTo(260 - (y % 3) * 40, y); g.stroke(); }
  g.save(); g.rotate(0.12); g.strokeStyle = HUD_RED; g.lineWidth = 14; g.strokeRect(-220, -80, 440, 130); g.font = "600 120px Oswald"; g.fillStyle = HUD_RED; g.textAlign = "center"; g.fillText("DÔME", 0, 20); g.restore();
  g.restore();
  g.save(); g.filter = "blur(4px)"; g.fillStyle = "#e0b99a"; g.beginPath(); g.ellipse(230, 1650, 150, 240, -0.45, 0, 7); g.fill(); g.beginPath(); g.ellipse(850, 1620, 150, 240, 0.4, 0, 7); g.fill(); g.restore();
  glow(g, 540, 900, 420, AMBER, 0.35);
  hud(g, { clock: "21:10", zone: "APPARTEMENT" }); finish(g, { bloom: 0.35, grade: ["#1a1008", "#ffd9a0", 0.16] }); caption(g, ["LES", "DOSSIERS"], 1);
};
S.c4b_pere_gros_plan = g => {                        // gros plan du père, calme
  sky(g, [[0, "#0e1418"], [0.5, "#2a3640"], [1, "#0b0e10"]]);
  rays(g, 540, 300, Math.PI / 2, 0.8, 1300, "#bcd4e0", 0.1, 5);
  actor(g, 540, 2900, 3.0, { ...PERE, look: -0.04, arms: [[-1, 40], [1, 40]] }, { rim: "#cfe3ee", rimAng: -0.9, key: "#dfe9ef", shadow: false });
  dust(g, 70, "#dfeef5", 200, 1700, 47, 2.5); hud(g, { clock: "07:04" }); finish(g, { grade: ["#0a1a24", "#e6f0f5", 0.16] }); caption(g, ["IL", "NE", "SE", "DÉBAT", "PAS"], 3);
};
S.f6_fpv_centre = g => {                             // FPV vers la porte du centre, tours dorées
  sky(g, [[0, "#06090b"], [1, "#06090b"]]);
  roll(g, 0.1, q => { shaft(q, { sides: 4, rot: Math.PI / 4, n: 14, f: 0.8, r0: 1400, sy: 1.1, vy: 700, wall: "#2a2a24", line: GOLD, lamp: GOLD, core: GOLD, coreR: 300, people: 0.2, labels: { 7: "CENTRE" } }); });
  layer(g, q => { glow(q, 540, 900, 500, GOLD, 0.5); towers(q, 1000, 540, 700, 7, { k: 0.8 }); }, { blur: 3 });
  zoomBlur(g, 540, 900, 0.03); hud(g, { zone: "LE CENTRE" }); finish(g, { bloom: 0.45, grade: ["#08161c", "#ffd78a", 0.18] }); caption(g, ["LE", "CENTRE,"], 1);
};
S.w9_porte = g => {                                  // la porte du centre se referme, lumière qui se coupe
  sky(g, [[0, "#0c0f12"], [0.4, "#3a3222"], [0.6, "#6b5530"], [1, "#0a0b0c"]]);
  layer(g, q => { glow(q, 540, 960, 600, GOLD, 0.45); towers(q, 1060, 540, 820, 9, { k: 0.85 }); }, { blur: 3 });
  layer(g, q => { wallHex(q, 1330, 330, "#121416", GOLD); }, { blur: 2 });
  const gap = 16; g.fillStyle = "#050506"; g.fillRect(400, 1040, 280, 290);
  g.fillStyle = "#1b1c1e"; g.fillRect(400, 1040, 140 - gap, 290); g.fillRect(540 + gap, 1040, 140 - gap, 290);
  g.strokeStyle = rgba(GOLD, 0.7); g.lineWidth = 4; g.strokeRect(400, 1040, 280, 290);
  g.fillStyle = rgba(GOLD, 0.95); g.fillRect(540 - gap / 2, 1050, gap, 270);
  glow(g, 540, 1180, 260, GOLD, 0.6);
  const gr = g.createLinearGradient(0, 1330, 0, H); gr.addColorStop(0, "#1a1f22"); gr.addColorStop(1, "#060708"); g.fillStyle = gr; g.fillRect(0, 1330, W, H - 1330);
  dust(g, 120, "#ffe9b8", 500, 1400, 53, 2.2);
  hud(g, { clock: "08:15", zone: "LE CENTRE" }); finish(g, { bloom: 0.4, grade: ["#08161c", "#ffd78a", 0.18] }); caption(g, ["N'EN", "REVIENT."], 1);
};
S.w3b_regle_2 = g => {                               // panneau RÈGLE 2 (néon), même grammaire que la règle 1
  street(g, { centre: true });
  g.fillStyle = "rgba(6,10,12,0.78)"; g.strokeStyle = rgba(GOLD, 0.5); g.lineWidth = 3; g.beginPath(); g.roundRect(90, 610, 900, 430, 10); g.fill(); g.stroke();
  neon(g, "RÈGLE 2", 540, 745, "600 108px Oswald", "#ffd78a", "rgba(255,200,90,0.9)");
  neon(g, "TU NE VAS JAMAIS", 540, 865, "900 62px Montserrat", "#f3e2b0", "rgba(255,220,150,0.6)");
  neon(g, "AU CENTRE.", 540, 948, "900 62px Montserrat", "#f2c46a", "rgba(255,190,80,0.7)");
  layer(g, q => { q.fillStyle = "#050607"; for (let x = -20; x < W + 40; x += 120) q.fillRect(x, 1250, 18, 700); q.fillRect(0, 1300, W, 22); }, { blur: 9 });
  hud(g); finish(g, { bloom: 0.45, grade: ["#071a1a", "#f0e6a0", 0.16] }); caption(g, ["NE", "VAS", "JAMAIS"], 1);
};
S.w5b_foule_haut_parleur = g => {                    // foule de dos sous le haut-parleur, contre-plongée
  street(g, { centre: false });
  layer(g, q => glow(q, 540, 200, 900, BORDEAUX, 0.6), { op: "screen" });
  g.fillStyle = "#0b0d0e"; g.fillRect(0, 60, W, 14);
  [[-1, 0.35], [1, -0.35]].forEach(([k, r]) => { g.save(); g.translate(540 + k * 120, 120); g.rotate(r); g.fillStyle = "#15181a"; g.strokeStyle = "#5e6468"; g.lineWidth = 5;
    g.beginPath(); g.moveTo(0, -30); g.lineTo(k * 170, -90); g.lineTo(k * 170, 90); g.lineTo(0, 30); g.closePath(); g.fill(); g.stroke(); g.restore(); });
  crowd(g, 1000, 12, { blur: 0.8, backs: true, tint: "#4a3236", body: "#100b0c", big: 1.4 });
  layer(g, q => crowd(q, 1560, 3, { backs: true, tint: "#2a1c20", body: "#070405", big: 2.0 }), { blur: 8 });
  hud(g, { label: "RADIO", value: "LIVE" }); finish(g, { bloom: 0.4, grade: ["#1a0610", "#ffc0b0", 0.18] }); caption(g, ["À", "LA", "RADIO"], 2);
};
S.w1c_infographie_retraction = g => {                // le champ se rétracte sur le centre
  sky(g, [[0, "#05080b"], [0.5, "#0c151a"], [1, "#06090b"]]);
  const cx = 540, cy = 1000, P = (r, a) => [cx + r * Math.cos(a), cy + r * Math.sin(a) * 0.4];
  const ring = (r, col, lw, dash) => { g.setLineDash(dash || []); g.beginPath(); for (let i = 0; i <= 64; i++) { const p = P(r, i / 64 * 6.2832); i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]); } g.strokeStyle = col; g.lineWidth = lw; g.stroke(); g.setLineDash([]); };
  ring(640, rgba("#ff5a48", 0.5), 3, [14, 12]);   // ancien champ, en retrait
  ring(420, rgba(TEAL, 0.25), 2);
  layer(g, q => { q.fillStyle = rgba(TEAL, 0.10); q.beginPath(); for (let i = 0; i <= 64; i++) { const p = P(640, i / 64 * 6.2832); i ? q.lineTo(p[0], p[1]) : q.moveTo(p[0], p[1]); } q.fill(); }, { blur: 4 });
  ring(230, rgba(TEAL, 0.95), 8);
  glow(g, cx, cy, 320, TEAL, 0.5);
  const hx = Array.from({ length: 6 }, (_, i) => P(200, Math.PI / 3 * i + Math.PI / 6)); g.beginPath(); hx.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.closePath(); g.fillStyle = "rgba(60,52,30,0.95)"; g.fill(); g.strokeStyle = rgba(GOLD, 0.95); g.lineWidth = 4; g.stroke();
  pill(g, "CHAMP ACTUEL", cx, cy - 300);
  pill(g, "CENTRE SEUL", cx, cy + 40);
  hud(g, { alpha: 0.5, label: "CHAMP", value: "-70 %" }); finish(g, { bloom: 0.4, grade: ["#0a2a2c", "#f3d28a", 0.15] }); caption(g, ["SEUL", "LE", "CENTRE"], 2);
};
S.c6b_garde_gros_plan = g => {                      // le garde, gros plan, lumière rouge
  sky(g, [[0, "#140406"], [0.6, "#2a0a0c"], [1, "#060304"]]);
  glow(g, 540, 700, 900, "#ff3b2a", 0.55);
  actor(g, 540, 2900, 2.9, { ...GARDE, arms: [[-1, 10], [1, 10]] }, { rim: "#ff6a58", rimAng: -1.57, rimW: 12, key: "#ffb0a0" });
  hud(g, { clock: "07:26", label: "EXÉCUTION", value: "08:00", valueRed: true }); finish(g, { bloom: 0.4, grade: ["#2a0406", "#ff6a58", 0.2] }); caption(g, ["SERONT", "EXÉCUTÉS."], 1);
};
S.c9_pere_cellule = g => {                          // le père enfermé, seul
  sky(g, [[0, "#0a0c0e"], [1, "#050607"]]);
  layer(g, q => { q.fillStyle = "rgba(190,210,220,0.22)"; q.fillRect(420, 0, 240, 260); }, { blur: 10 });
  actor(g, 540, 2700, 2.2, { ...PERE, look: -0.1, arms: [[-1, 14], [1, 14]] }, { rim: "#cfe3ee", rimAng: -1.0, key: "#dfe9ef", shadow: false });
  g.fillStyle = "#0a0b0c"; for (let x = 150; x < W; x += 150) g.fillRect(x, 0, 22, H);
  g.fillStyle = "#0a0b0c"; g.fillRect(0, 1400, W, 30);
  glow(g, 540, 400, 420, "#cfe3ee", 0.25);
  hud(g, { clock: "23:50", zone: "CELLULE" }); finish(g, { bloom: 0.25, grade: ["#0a1a24", "#e6f0f5", 0.16] }); caption(g, ["ET", "TON", "PÈRE"], 2);
};
S.c10_heros_question = g => {                        // le héros face caméra : question, choix A/B
  sky(g, [[0, "#0a0f12"], [0.5, "#16202a"], [1, "#07090b"]]);
  layer(g, q => { glow(q, 200, 500, 300, TEAL, 0.5); glow(q, 880, 420, 280, AMBER, 0.55); }, { blur: 18 });
  domeBarrier(g, 1150, 1100, 900, 0.35);
  actor(g, 540, 2650, 2.3, { ...HERO, look: 0.0, eyeDy: 0.0 }, { rim: TEAL, rimAng: -1.57, rimW: 7, key: "#ffd9a0", shadow: false });
  pill(g, "A · TE TAIS", 300, 470); pill(g, "B · PARLE", 780, 470);
  dust(g, 50, "#cfe9e6", 0, 1500, 59, 3); hud(g); finish(g, { grade: ["#06202a", "#ffd9a0", 0.16] }); caption(g, ["CHOISIS", "EN", "COMMENTAIRE"], 0);
};
S.fin_carte = g => {                                // carte de fin : dôme filaire qui tourne, « Abonne-toi »
  sky(g, [[0, "#06090b"], [1, "#020304"]]);
  const rot = 0.6;
  g.save(); g.translate(540, 960); g.strokeStyle = rgba(TEAL, 0.5); g.lineWidth = 2;
  for (let m = 0; m < 12; m++) { g.beginPath(); for (let t = 0; t <= Math.PI; t += 0.06) { const a = m / 12 * 6.2832 + rot, x = 420 * Math.cos(t) * Math.cos(a), y = 420 * Math.sin(t) * 0.4 * 2 - 420 * Math.cos(t) * 0.4 + 0 * Math.sin(a); t ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); }
  for (let k = 1; k < 6; k++) { const r = 420 * k / 6; g.beginPath(); for (let i = 0; i <= 64; i++) { const a = i / 64 * 6.2832; i ? g.lineTo(r * Math.cos(a), r * Math.sin(a) * 0.4) : g.moveTo(r * Math.cos(a), r * Math.sin(a) * 0.4); } g.stroke(); }
  g.restore();
  glow(g, 540, 960, 300, TEAL, 0.35);
  neon(g, "LA COURONNE", 540, 760, "600 118px Oswald", "#f3e2b0", "rgba(255,220,150,0.7)");
  neon(g, "ÉPISODE 1", 540, 870, "800 56px Montserrat", "#9fe6df", "rgba(111,224,214,0.7)");
  caption(g, ["ABONNE-TOI"], 0, 1242);
  finish(g, { bloom: 0.35, grade: ["#06202a", "#f3e2b0", 0.12] });
};
// ---------- planche de validation : plan 1 (noir), plan 11 (père sans feuille) ----------
S.p01_noir_imagine = g => { g.fillStyle = "#000"; g.fillRect(0, 0, W, H); caption(g, ["IMAGINE,"], 0); };
S.p11_pere_buste_sans_feuille = g => { sky(g, [[0, "#0e1418"], [0.5, "#2a3640"], [1, "#0b0e10"]]);
  layer(g, q => { q.fillStyle = "rgba(170,200,215,0.55)"; q.fillRect(620, 320, 340, 620); q.fillStyle = "#0c1013"; q.fillRect(780, 320, 14, 620); q.fillRect(620, 620, 340, 14); }, { blur: 14 });
  rays(g, 790, 600, 2.35, 0.5, 1300, "#bcd4e0", 0.14);
  actor(g, 540, 2650, 2.3, { ...PERE, look: -0.08, arms: [[-1, 0], [1, -20]] }, { rim: "#cfe3ee", rimAng: -0.7, key: "#dfe9ef", shadow: false });
  dust(g, 70, "#dfeef5", 200, 1700, 31, 2.5); hud(g, { clock: "07:02" }); finish(g, { grade: ["#0a1a24", "#e6f0f5", 0.16] }); caption(g, ["TON", "PÈRE", "EST", "INGÉNIEUR."], 1); };
// ---------- v5 : retouches après revue de la planche (clés p02, p08, p09, p13, p19, p20, p21 ; anciennes clés conservées) ----------
const stencil = (g, lines, x, y, col, glowCol) => {   // texte peint sur un mur (bombe), légère dérive de perspective
  g.save(); g.setTransform(1, 0, -0.10, 1, 0, 0);
  lines.forEach(([t, font, dy]) => { g.font = font; g.textAlign = "center"; g.fillStyle = rgba(glowCol, 0.45); g.filter = "blur(6px)"; g.fillText(t, x, y + dy); g.filter = "none"; g.fillStyle = col; g.fillText(t, x, y + dy); });
  g.restore(); g.textAlign = "left";
};
S.p02_boussole_dome = g => {                         // plan 2 : le dôme visible, la boussole au premier plan, aiguille affolée
  sky(g, [[0, "#070b0d"], [0.6, "#101a1e"], [1, "#050607"]]);
  domeBarrier(g, 760, 1100, 700, 0.9);
  layer(g, q => { q.fillStyle = "#1b1510"; q.fillRect(0, 1240, W, H - 1240); }, { blur: 2 });
  g.beginPath(); g.ellipse(540, 1560, 420, 60, 0, 0, 7); g.fillStyle = "rgba(0,0,0,0.5)"; g.fill();
  const cx = 540, cy = 1420, R = 250;
  g.beginPath(); g.arc(cx, cy, R, 0, 7); const bz = g.createRadialGradient(cx - 80, cy - 80, 40, cx, cy, R); bz.addColorStop(0, "#d6d9dd"); bz.addColorStop(0.9, "#5d646b"); bz.addColorStop(1, "#2a2e33"); g.fillStyle = bz; g.fill(); outline(g, 1.2); g.stroke();
  g.beginPath(); g.arc(cx, cy, R - 26, 0, 7); g.fillStyle = "#e7f2ef"; g.fill();
  const na = 0.9 + Math.sin(2.7) * 0.25;                 // aiguille qui tremble
  g.save(); g.translate(cx, cy); g.rotate(na); g.fillStyle = "#c83a2c"; g.beginPath(); g.moveTo(0, -180); g.lineTo(26, 0); g.lineTo(0, 14); g.closePath(); g.fill();
  g.fillStyle = "#e8e4dc"; g.beginPath(); g.moveTo(0, 180); g.lineTo(26, 0); g.lineTo(0, 14); g.closePath(); g.fill(); g.restore();
  g.beginPath(); g.arc(cx, cy, 18, 0, 7); g.fillStyle = "#1a1d20"; g.fill();
  g.font = "900 40px Montserrat"; g.fillStyle = "#2b2f33"; g.textAlign = "center"; ["N", "E", "S", "O"].forEach((t, i) => { const a = -Math.PI / 2 + i * Math.PI / 2; g.fillText(t, cx + Math.cos(a) * 205, cy + Math.sin(a) * 205 + 14); }); g.textAlign = "left";
  glow(g, cx, cy, 300, TEAL, 0.25);
  dust(g, 60, "#cfe9e6", 300, 1500, 71, 2.4);
  hud(g); finish(g, { bloom: 0.4, grade: ["#06202a", "#ffd9a0", 0.16] }); caption(g, ["SOUS", "UN", "DÔME"], 1);
};
S.p08_vue_aerienne = g => {                          // plan 8 : seulement CENTRE et DISTRICTS
  sky(g, [[0, "#05080b"], [0.5, "#0c151a"], [1, "#06090b"]]);
  const cx = 540, cy = 1000, P = (r, a, h = 0) => [cx + r * Math.cos(a), cy + r * Math.sin(a) * 0.4 - h];
  const ring = (r, col, lw, fill) => { g.beginPath(); for (let i = 0; i <= 64; i++) { const p = P(r, i / 64 * 6.2832); i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]); } if (fill) { g.fillStyle = fill; g.fill(); } g.strokeStyle = col; g.lineWidth = lw; g.stroke(); };
  ring(620, rgba(TEAL, 0.7), 3, "rgba(14,24,28,0.92)");
  for (let i = 0; i < 1400; i++) { const r = 250 + rnd(i) * 360, a = rnd(i * 3) * 6.2832, p = P(r, a); g.fillStyle = rgba(AMBER, 0.2 + rnd(i * 7) * 0.5); g.fillRect(p[0], p[1], 2.2, 2.2); }
  g.beginPath(); for (let i = 0; i < 6; i++) { const a = Math.PI / 3 * i + Math.PI / 6, p = P(230, a); i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]); } g.closePath(); g.fillStyle = "rgba(60,52,30,0.95)"; g.fill(); g.strokeStyle = rgba(GOLD, 0.95); g.lineWidth = 4; g.stroke();
  layer(g, q => { glow(q, cx, cy, 240, GOLD, 0.5); for (let i = 0; i < 12; i++) { const p = P(140 * rnd(i * 5), rnd(i * 9) * 6.28), h = 60 + rnd(i) * 120; q.fillStyle = rgba(GOLD, 0.9); q.fillRect(p[0] - 9, p[1] - h, 18, h); } }, { op: "screen" });
  layer(g, q => { q.strokeStyle = rgba(TEAL, 0.8); q.lineWidth = 14; q.beginPath(); for (let t = 0; t <= Math.PI; t += 0.05) { const p = P(620 * Math.cos(t), 0, 620 * Math.sin(t) * 0.95); t ? q.lineTo(p[0], p[1]) : q.moveTo(p[0], p[1]); } q.stroke(); }, { blur: 22, op: "screen", alpha: 0.6 });
  pill(g, "LE CENTRE", cx - 220, cy - 150, [cx - 110, cy - 50]);
  pill(g, "LES DISTRICTS", 840, 1110, [900, 1050]);
  hud(g, { alpha: 0.5 }); finish(g, { bloom: 0.4, grade: ["#0a2a2c", "#f3d28a", 0.15] }); caption(g, ["LE", "CENTRE,"], 0);
};
S.p09_regle_1_mur = g => {                           // plan 9 : la règle peinte sur le mur qui borde le dôme
  concrete(g, "#3a342c", [540, 700, 900, "#f0d9a6"], 3);
  layer(g, q => { q.fillStyle = "#050607"; q.fillRect(0, 1480, W, H - 1480); }, { blur: 0 });
  glow(g, 540, 1180, 700, TEAL, 0.25);
  g.fillStyle = rgba(TEAL, 0.9); g.fillRect(0, 1150, W, 8); g.fillStyle = rgba(TEAL, 0.25); g.fillRect(0, 1130, W, 48);
  stencil(g, [["RÈGLE 1", "600 170px Oswald", 0]], 540, 720, "#c83a2c", "#ff8a78");
  stencil(g, [["NE SORS JAMAIS", "900 80px Montserrat", 0], ["DU DÔME.", "900 80px Montserrat", 96]], 540, 860, "#e9dccb", "#ffd9a0");
  g.fillStyle = "rgba(0,0,0,0.25)"; for (let i = 0; i < 6; i++) g.fillRect(rnd(i * 13) * W, 200 + rnd(i * 7) * 1000, 3, 3);
  hud(g); finish(g, { bloom: 0.3, grade: ["#071a1a", "#f0e6a0", 0.16] }); caption(g, ["NE", "SORS", "JAMAIS"], 1);
};
S.p13_heros_matin = g => {                           // plan 13 : le héros marche seul vers le centre, matin brumeux
  street(g, { centre: true });
  haze(g, 1000, 1500, "#c9c3b0", 0.25);
  actor(g, 540, 1730, 1.0, { ...HERO, side: 1, look: 0.2 }, { rim: GOLD, rimAng: -1.7, key: "#ffe6b0" });
  hud(g, { clock: "07:05" }); finish(g, { bloom: 0.4, grade: ["#06202a", "#ffd78a", 0.16] }); caption(g, ["LE", "LENDEMAIN", "MATIN,"], 1);
};
S.p19_centre_lointain = g => {                       // plan 19 : vue basse vers le centre, tours dorées au bout de la rue
  sky(g, [[0, "#0a0c0e"], [0.45, "#3a3222"], [0.62, "#6b5530"], [1, "#0a0b0c"]]);
  layer(g, q => { glow(q, 540, 900, 700, GOLD, 0.45); towers(q, 1020, 540, 760, 9, { k: 0.9 }); }, { blur: 3 });
  haze(g, 880, 1150, "#c8a868", 0.2);
  g.fillStyle = "#16130e"; g.beginPath(); g.moveTo(0, H); g.lineTo(W, H); g.lineTo(600, 1020); g.lineTo(480, 1020); g.closePath(); g.fill();   // route qui fuit vers le centre
  for (let i = 0; i < 6; i++) { const t = i / 6, y = 1020 + t * t * 900; lamp(g, 540 + (i % 2 ? 40 : -40) * (1 - t), y, "#ffd78a", 0.25 + t * 0.7); }
  dust(g, 110, "#ffe9b8", 500, 1400, 73, 2.2);
  hud(g, { zone: "LE CENTRE" }); finish(g, { bloom: 0.45, grade: ["#08161c", "#ffd78a", 0.18] }); caption(g, ["LES", "PLUS", "RICHES."], 1);
};
S.p20_drone_porte = g => {                           // plan 20 : plan drone au-dessus du mur du centre, la porte se referme
  sky(g, [[0, "#06080a"], [1, "#050607"]]);
  const cx = 540, cy = 1000, P = (r, a) => [cx + r * Math.cos(a), cy + r * Math.sin(a) * 0.62];
  g.beginPath(); for (let i = 0; i <= 72; i++) { const p = P(560, i / 72 * 6.2832); i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]); } g.fillStyle = "#14130f"; g.fill();
  g.beginPath(); for (let i = 0; i <= 72; i++) { const p = P(520, i / 72 * 6.2832); i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]); } g.fillStyle = "#3a3222"; g.fill();
  layer(g, q => { glow(q, cx, cy, 380, GOLD, 0.55); for (let i = 0; i < 40; i++) { const a = rnd(i) * 6.28, r = 120 + rnd(i * 3) * 260, p = P(r, a), h = 40 + rnd(i * 5) * 120; q.fillStyle = rgba(GOLD, 0.9); q.fillRect(p[0] - 10, p[1] - 10, 20, 20 + h * 0.3); } }, { op: "screen" });
  // porte au sud du mur : deux vantaux qui se referment, lumière qui se coupe
  const gate = P(520, Math.PI / 2), gap = 10;
  g.fillStyle = "#050506"; g.fillRect(gate[0] - 60, gate[1] - 46, 120, 92);
  g.fillStyle = "#1b1c1e"; g.fillRect(gate[0] - 60, gate[1] - 46, 60 - gap, 92); g.fillRect(gate[0] + gap, gate[1] - 46, 60 - gap, 92);
  g.fillStyle = rgba(GOLD, 0.95); g.fillRect(gate[0] - gap / 2, gate[1] - 40, gap, 80);
  glow(g, gate[0], gate[1] + 30, 200, GOLD, 0.6);
  layer(g, q => { q.fillStyle = "rgba(30,36,40,0.6)"; q.fillRect(0, 0, W, 240); }, { blur: 12 });
  hud(g, { clock: "08:14", zone: "LE CENTRE" }); finish(g, { bloom: 0.35, grade: ["#08161c", "#ffd78a", 0.18] }); caption(g, ["N'EN", "REVIENT."], 1);
};
S.p21_regle_2_porte = g => {                         // plan 21 : la règle gravée dans la pierre de l'arche de la porte
  concrete(g, "#2a2620", [540, 760, 900, "#f0c878"], 9);
  g.beginPath(); g.moveTo(180, H); g.lineTo(180, 900); g.quadraticCurveTo(180, 560, 540, 560); g.quadraticCurveTo(900, 560, 900, 900); g.lineTo(900, H); g.closePath(); g.fillStyle = "#0b0c0d"; g.fill();
  g.strokeStyle = rgba(GOLD, 0.7); g.lineWidth = 8; g.stroke();
  glow(g, 540, 1100, 500, GOLD, 0.35);
  stencil(g, [["RÈGLE 2", "600 150px Oswald", 0]], 540, 720, "#f2c46a", "#ffd78a");
  stencil(g, [["TU NE VAS JAMAIS", "900 70px Montserrat", 0], ["AU CENTRE.", "900 70px Montserrat", 90]], 540, 880, "#f3e2b0", "#ffd78a");
  hud(g); finish(g, { bloom: 0.35, grade: ["#1a1206", "#ffd78a", 0.18] }); caption(g, ["UN", "MUR", "LE", "SÉPARE"], 1);
};
// ---------- v6 : ville construite (immeubles à fenêtres, rues, îlots), plan drone, plans 4, 5, 9 retravaillés ----------
const CITY_WARM = "#ffd78a", CITY_COOL = "#9fe6df";
function towerFacade(g, x, y, w, h, col, seed) {       // façade vitrée : fenêtres en grille, reflet vertical, corniche sombre
  const gr = g.createLinearGradient(x, 0, x + w, 0); gr.addColorStop(0, mul(col, 1.18)); gr.addColorStop(1, mul(col, 0.72));
  g.fillStyle = gr; g.fillRect(x, y, w, h);
  const cw = Math.max(7, w / 8), ch = Math.max(9, cw * 1.25);
  for (let r = 0; y + (r + 1) * ch < y + h; r++) for (let c = 0; (c + 1) * cw < w; c++) {
    const k = rnd(seed * 97 + r * 13 + c * 7);
    g.fillStyle = k > 0.8 ? rgba(CITY_WARM, 0.9) : k > 0.62 ? rgba(CITY_COOL, 0.38) : "rgba(8,14,18,0.5)";
    g.fillRect(x + c * cw + cw * 0.2, y + r * ch + ch * 0.28, cw * 0.6, ch * 0.45);
  }
  g.fillStyle = "rgba(255,255,255,0.08)"; g.fillRect(x + w * 0.1, y, w * 0.07, h);
  g.fillStyle = "rgba(0,0,0,0.4)"; g.fillRect(x, y, w, 5);
}
function richSkyline(g, baseY, x0, x1, seed, o = {}) {   // rangée de tours : hauteurs variées, gradins, antennes
  let x = x0, i = 0; const cols = o.cols || ["#2a3a44", "#34444e", "#24323a", "#3d4c52", "#4a4032"];
  while (x < x1) {
    const w = (o.wmin || 60) + rnd(seed + i) * (o.wvar || 110), h = (o.hmin || 160) + rnd(seed * 3 + i) * (o.hvar || 520);
    towerFacade(g, x, baseY - h, w, h, cols[Math.floor(rnd(seed * 5 + i) * cols.length)], seed + i);
    if (rnd(i + seed * 2) > 0.55) towerFacade(g, x + w * 0.2, baseY - h - 90, w * 0.6, 90, "#31434c", seed + 40 + i);
    if (rnd(i + seed * 7) > 0.7) { g.strokeStyle = "rgba(200,220,225,0.5)"; g.lineWidth = 3; g.beginPath(); g.moveTo(x + w / 2, baseY - h); g.lineTo(x + w / 2, baseY - h - 120); g.stroke(); }
    x += w + 4 + rnd(i * 9) * 14; i++;
  }
}
function isoBlock(g, cx, cy, k, gx, gy, w, d, h, col) {  // volume isométrique : dessus, face gauche, face droite, fenêtres
  const P = (x, y, z) => [cx + (x - y) * k, cy + (x + y) * k * 0.5 - z];
  const poly = (pts, f) => { g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.closePath(); g.fillStyle = f; g.fill(); };
  poly([P(gx, gy + d, 0), P(gx + w, gy + d, 0), P(gx + w, gy + d, h), P(gx, gy + d, h)], mul(col, 0.62));
  poly([P(gx + w, gy, 0), P(gx + w, gy + d, 0), P(gx + w, gy + d, h), P(gx + w, gy, h)], mul(col, 0.82));
  poly([P(gx, gy, h), P(gx + w, gy, h), P(gx + w, gy + d, h), P(gx, gy + d, h)], mul(col, 1.12));
  const n = Math.floor(h / 20);
  for (let r = 0; r < n; r++) for (let c = 0; c < 3; c++) { const kk = rnd(gx * 31 + gy * 7 + r * 5 + c);
    if (kk < 0.45) continue; const a = P(gx + w, gy + d * (0.15 + c * 0.28), 12 + r * 20), b = P(gx + w, gy + d * (0.15 + c * 0.28 + 0.16), 12 + r * 20 + 9);
    g.fillStyle = kk > 0.85 ? rgba(CITY_WARM, 0.9) : rgba(CITY_COOL, 0.35); g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.lineTo(b[0], b[1] - 9); g.lineTo(a[0], a[1] - 9); g.closePath(); g.fill(); }
}
function isoCity(g, o) {                                // îlots en grille, rues entre les îlots, tri arrière -> avant
  const items = [];
  for (let i = 0; i < o.n; i++) for (let j = 0; j < o.n; j++) {
    if (i % o.street === o.street - 1 || j % o.street === o.street - 1) continue;
    items.push({ i, j, h: o.hmin + rnd(i * 13 + j * 29 + o.seed) * (o.hmax - o.hmin), col: o.cols[Math.floor(rnd(i * 5 + j * 3 + o.seed) * o.cols.length)] });
  }
  items.sort((a, b) => (a.i + a.j) - (b.i + b.j));
  items.forEach(it => { const x = it.i * o.pitch, y = it.j * o.pitch, s = o.pitch * 0.8;
    if (o.park && rnd(it.i * 3 + it.j * 11) > 0.8) { g.fillStyle = "#1d3a2a"; g.beginPath(); const p = [o.cx + (x - y) * o.k, o.cy + (x + y) * o.k * 0.5]; g.ellipse(p[0], p[1], s * o.k * 0.9, s * o.k * 0.45, 0, 0, 7); g.fill(); return; }
    isoBlock(g, o.cx, o.cy, o.k, x, y, s, s, it.h, it.col); });
}
const DIST_CITY = { n: 11, street: 3, pitch: 60, k: 0.9, cx: 540, cy: 300, hmin: 30, hmax: 120, cols: ["#4a4a44", "#5a5040", "#3c4046", "#66604f", "#505a5c"], seed: 3 };
const RICH_CITY = { n: 10, street: 3, pitch: 72, k: 0.8, cx: 540, cy: 360, hmin: 150, hmax: 640, cols: ["#2b4a5a", "#35606e", "#213a46", "#7a8f94", "#c9b48a", "#3c5566"], seed: 11, park: true };
S.p05_fpv_plongee_district = g => {                   // plan 5 : même plongée, fond = vrai district construit
  sky(g, [[0, "#06090b"], [1, "#06090b"]]);
  roll(g, 0.32, q => {
    isoCity(q, { ...DIST_CITY, cy: 1080, cx: 540, k: 0.9 });
    haze(q, 900, 1400, "#4a6a72", 0.25);
    shaft(q, { sides: 6, rot: 0, n: 13, f: 0.78, r0: 1500, wall: "#1b2429", line: TEAL, lamp: AMBER, core: GOLD, coreR: 300, people: 0.5, labels: { 2: "DISTRICT NORD", 6: "SECOND MUR", 10: "LE CENTRE" } });
  });
  zoomBlur(g, 540, 960, 0.025);
  hud(g); finish(g, { bloom: 0.45, grade: ["#06202a", "#ffd78a", 0.16] }); caption(g, ["ICI,", "LES", "RICHES"], 2);
};
S.p04_fpv_foule_mouv = g => {                          // plan 4 : la foule se fige, quelques corps bougent encore en bord de cadre
  sky(g, [[0, "#0b0f12"], [1, "#0b0f12"]]);
  roll(g, 0.18, q => {
    for (let y = -200; y < H + 200; y += 74) for (let x = -200; x < W + 200; x += 74) { const j = rnd(x * 1.3 + y), px = x + (j - 0.5) * 30 + (y / 74 % 2) * 37, py = y + (rnd(x + y * 3) - 0.5) * 24;
      const dc = Math.hypot(px - 540, py - 960);
      if (dc < 90) continue;
      if (dc > 520 && rnd(x + y) > 0.7) { q.strokeStyle = rgba("#cfd8dc", 0.35); q.lineWidth = 5; q.beginPath(); q.moveTo(px, py); q.lineTo(px + (px - 540) * 0.12, py + (py - 960) * 0.12); q.stroke(); }  // traînées : ceux qui bougent encore
      q.fillStyle = mul("#1d2226", 0.8 + j * 0.5); q.beginPath(); q.ellipse(px, py + 6, 34, 22, j * 3, 0, 7); q.fill();
      const hg = q.createRadialGradient(px - 6, py - 6, 2, px, py, 22); hg.addColorStop(0, j > 0.7 ? "#3a2c22" : "#d8d2c6"); hg.addColorStop(1, j > 0.7 ? "#1d1611" : "#7f7a71"); q.fillStyle = hg; q.beginPath(); q.arc(px, py, 20, 0, 7); q.fill(); }
    glow(q, 540, 960, 260, TEAL, 0.45);
    q.fillStyle = "#2c4256"; q.beginPath(); q.ellipse(540, 966, 44, 28, 0.2, 0, 7); q.fill(); q.strokeStyle = INK; q.lineWidth = 4; q.stroke();
    const hg = q.createRadialGradient(532, 950, 2, 540, 958, 26); hg.addColorStop(0, "#f6f3ec"); hg.addColorStop(1, "#9d9a94"); q.fillStyle = "#2b211b"; q.beginPath(); q.arc(540, 958, 26, 0, 7); q.fill(); q.stroke();
    pill(q, "TOI", 540, 1060); });
  zoomBlur(g, 540, 960, 0.02); hud(g); finish(g, { bloom: 0.35, grade: ["#06202a", "#ffd9a0", 0.16] }); caption(g, ["ARRÊTENT", "DE", "BOUGER."], 0);
};
// plan 6 + 7 : un seul plan drone, trois images clés. 1) au-dessus du district  2) à 1 m au-dessus du mur  3) de l'autre côté, la ville riche
S.p06a_drone_district = g => {
  sky(g, [[0, "#1a1c1e"], [0.6, "#2a2c2a"], [1, "#0c0e0e"]]);
  isoCity(g, { ...DIST_CITY, cx: 480, cy: 430, k: 1.0, hmin: 30, hmax: 110 });
  haze(g, 1400, 1920, "#3a4a4e", 0.3);
  hud(g, { zone: "DISTRICT NORD", clock: "21:40" }); finish(g, { bloom: 0.2, grade: ["#0a1418", "#f0d9a6", 0.14] }); caption(g, ["LES", "DISTRICTS"], 1);
};
S.p06b_drone_mur = g => {                             // le mur passe à un mètre sous la caméra
  sky(g, [[0, "#0a1a1e"], [0.55, "#1a3a40"], [1, "#081012"]]);
  richSkyline(g, 1180, -20, W + 20, 17, { hmin: 260, hvar: 540, wmin: 80, wvar: 140, cols: ["#2a4450", "#355866", "#3c4a50"] });
  g.fillStyle = "#15191b"; g.fillRect(0, 1180, W, 60);
  g.strokeStyle = rgba(TEAL, 0.9); g.lineWidth = 6; g.beginPath(); g.ellipse(540, 1180, 1100, 260, 0, Math.PI, 0); g.stroke();
  glow(g, 540, 1180, 600, TEAL, 0.25);
  g.fillStyle = "#101416"; g.fillRect(0, 1240, W, H - 1240);
  hud(g, { alpha: 0.6 }); finish(g, { bloom: 0.35, grade: ["#04161a", "#c8f4ee", 0.16] }); caption(g, ["UN", "MUR"], 0);
};
S.p06c_drone_ville_riche = g => {                     // de l'autre côté : tours vitrées, avenues, jardins
  sky(g, [[0, "#1c2a36"], [0.5, "#2c4252"], [1, "#0c1216"]]);
  isoCity(g, { ...RICH_CITY, cx: 470, cy: 520, k: 0.85 });
  glow(g, 540, 1000, 500, GOLD, 0.2);
  hud(g, { zone: "LE CENTRE", clock: "07:40" }); finish(g, { bloom: 0.4, grade: ["#08161c", "#ffd78a", 0.16] }); caption(g, ["LE", "CENTRE"], 1);
};
S.p09_regle_1_neon = g => {                          // plan 9 : enseigne RÈGLE 1 en néon rouge, fixée sur un pylône de la limite
  sky(g, [[0, "#06080a"], [1, "#050607"]]);
  glow(g, 540, 700, 800, TEAL, 0.15);
  g.fillStyle = "#0b0d0e"; g.fillRect(500, 760, 80, 1100);                  // pylône
  g.fillStyle = "#15181a"; g.fillRect(380, 1100, 320, 26);
  // enseigne : cadre noir + tubes néon rouges
  g.fillStyle = "rgba(10,6,6,0.92)"; g.beginPath(); g.roundRect(120, 480, 840, 400, 14); g.fill();
  g.save(); g.shadowColor = "rgba(255,40,30,0.95)"; g.shadowBlur = 36; g.strokeStyle = "#ff3b2a"; g.lineWidth = 10; g.beginPath(); g.roundRect(136, 496, 808, 368, 12); g.stroke(); g.restore();
  neon(g, "RÈGLE 1", 540, 660, "600 150px Oswald", "#ff5a48", "rgba(255,40,30,1)");
  neon(g, "NE SORS JAMAIS", 540, 770, "900 62px Montserrat", "#ff7a66", "rgba(255,40,30,0.95)");
  neon(g, "DU DÔME.", 540, 848, "900 62px Montserrat", "#ff7a66", "rgba(255,40,30,0.95)");
  layer(g, q => { q.fillStyle = "rgba(255,60,40,0.45)"; q.fillRect(120, 900, 840, 260); }, { blur: 40, op: "screen" });   // reflet sur le sol mouillé
  g.fillStyle = "#0a0b0c"; g.fillRect(0, 1360, W, H - 1360);
  dust(g, 80, "#ffb0a0", 400, 1300, 81, 2.2);
  hud(g); finish(g, { bloom: 0.6, grade: ["#1a0404", "#ffb0a0", 0.2] }); caption(g, ["NE", "SORS", "JAMAIS"], 1);
};
// ---------- v7 : plan 2 en deux images clés (objet très proche -> dézoom sur les personnages) ----------
function compassBig(g, cx, cy, R, na) {
  g.beginPath(); g.arc(cx, cy, R, 0, 7); const bz = g.createRadialGradient(cx - R * 0.3, cy - R * 0.3, R * 0.1, cx, cy, R); bz.addColorStop(0, "#d6d9dd"); bz.addColorStop(0.9, "#5d646b"); bz.addColorStop(1, "#2a2e33"); g.fillStyle = bz; g.fill(); outline(g, R / 200); g.stroke();
  g.beginPath(); g.arc(cx, cy, R * 0.9, 0, 7); g.fillStyle = "#e7f2ef"; g.fill();
  for (let i = 0; i < 36; i++) { const a = i / 36 * 6.2832; g.strokeStyle = "#2b2f33"; g.lineWidth = i % 3 ? R * 0.01 : R * 0.02; g.beginPath(); g.moveTo(cx + Math.cos(a) * R * 0.78, cy + Math.sin(a) * R * 0.78); g.lineTo(cx + Math.cos(a) * R * 0.88, cy + Math.sin(a) * R * 0.88); g.stroke(); }
  g.font = `900 ${Math.round(R * 0.16)}px Montserrat`; g.fillStyle = "#2b2f33"; g.textAlign = "center"; ["N", "E", "S", "O"].forEach((t, k) => { const a = -Math.PI / 2 + k * Math.PI / 2; g.fillText(t, cx + Math.cos(a) * R * 0.55, cy + Math.sin(a) * R * 0.55 + R * 0.06); }); g.textAlign = "left";
  g.save(); g.translate(cx, cy); g.rotate(na); g.fillStyle = "#c83a2c"; g.beginPath(); g.moveTo(0, -R * 0.72); g.lineTo(R * 0.11, 0); g.lineTo(0, R * 0.06); g.closePath(); g.fill();
  g.fillStyle = "#e8e4dc"; g.beginPath(); g.moveTo(0, R * 0.72); g.lineTo(R * 0.11, 0); g.lineTo(0, R * 0.06); g.closePath(); g.fill(); g.restore();
  g.beginPath(); g.arc(cx, cy, R * 0.07, 0, 7); g.fillStyle = "#1a1d20"; g.fill();
}
S.p02a_boussole_proche = g => {                      // image 1 : boussole remplit le cadre, aiguille affolée, reflet teal dans le verre
  sky(g, [[0, "#0c1012"], [1, "#07090a"]]);
  glow(g, 300, 500, 500, TEAL, 0.25);
  compassBig(g, 540, 820, 480, 1.05 + Math.sin(2.7) * 0.22);
  layer(g, q => { q.fillStyle = "rgba(111,224,214,0.25)"; q.beginPath(); q.ellipse(380, 720, 240, 60, -0.4, 0, 7); q.fill(); }, { blur: 16, op: "screen" });
  hud(g); finish(g, { bloom: 0.4, grade: ["#06202a", "#ffd9a0", 0.16] }); caption(g, ["TU", "VIS"], 0);
};
S.p02b_dezoom_personnages = g => {                   // image 2 : dézoom, la boussole sur la table, le dôme au-dessus, le héros et son père
  sky(g, [[0, "#070b0d"], [0.6, "#101a1e"], [1, "#050607"]]);
  domeBarrier(g, 520, 1100, 760, 0.9);
  layer(g, q => { q.fillStyle = "#1b1510"; q.fillRect(0, 1380, W, H - 1380); }, { blur: 2 });
  g.fillStyle = "#3a2a1c"; g.fillRect(60, 1470, 960, 40); g.fillStyle = "#24190f"; g.fillRect(60, 1510, 960, 30);   // table
  compassBig(g, 540, 1470, 70, 1.0 + Math.sin(2.7) * 0.22);
  actor(g, 360, 1720, 1.0, { ...HERO, look: 0.2, arms: [[-1, 30], [1, -20]] }, { rim: TEAL, rimAng: -2.2, key: "#ffd9a0", shadow: false });
  actor(g, 720, 1720, 1.0, { ...PERE, look: -0.1, arms: [[-1, -20], [1, 30]] }, { rim: "#cfe3ee", rimAng: -0.8, key: "#dfe9ef", shadow: false });
  glow(g, 540, 1100, 500, TEAL, 0.15);
  dust(g, 50, "#cfe9e6", 0, 1500, 83, 3);
  hud(g); finish(g, { bloom: 0.35, grade: ["#06202a", "#ffd9a0", 0.16] }); caption(g, ["SOUS", "UN", "DÔME"], 1);
};
// ---------- v8 : foule détaillée vue de haut (plan 4), plan 2 avec fond de district ----------
function topPerson(q, px, py, j, seed) {              // personne vue de dessus : ombre, épaules, tête, cheveux, sac parfois
  const pal = ["#2f4b5a", "#7a3b32", "#d0c7b0", "#3b3f2e", "#5b4a7a", "#a8752f", "#1f2a33", "#c9a36a", "#4d6b4a", "#8c8c8c"];
  const hairs = ["#15110d", "#3a2a1c", "#8a6a3c", "#c9c2b0", "#24201c", "#5a2a1a"];
  const cloth = pal[Math.floor(rnd(seed) * pal.length)], hair = hairs[Math.floor(rnd(seed * 3) * hairs.length)];
  const ang = rnd(seed * 5) * 6.2832, dx = Math.cos(ang), dy = Math.sin(ang);
  q.fillStyle = "rgba(0,0,0,0.38)"; q.beginPath(); q.ellipse(px + 9, py + 11, 33, 21, ang, 0, 7); q.fill();                 // ombre portée
  q.fillStyle = mul(cloth, 0.75 + j * 0.45); q.beginPath(); q.ellipse(px, py, 31, 17, ang, 0, 7); q.fill();                  // épaules
  q.strokeStyle = "rgba(0,0,0,0.35)"; q.lineWidth = 2; q.beginPath(); q.ellipse(px, py, 31, 17, ang, 0, 7); q.stroke();
  q.fillStyle = mul(cloth, 1.2); q.beginPath(); q.ellipse(px - dx * 6, py - dy * 6, 14, 8, ang, 0, 7); q.fill();              // col / haut du dos
  if (rnd(seed * 7) > 0.6) { q.fillStyle = "#2a2620"; q.beginPath(); q.ellipse(px - dx * 20, py - dy * 20, 8, 6, ang, 0, 7); q.fill(); }   // sac à dos
  const skin = rnd(seed * 11) > 0.5 ? "#e6c9a8" : (rnd(seed * 13) > 0.5 ? "#b98a62" : "#6b4a33");
  const hg = q.createRadialGradient(px - 4, py - 4, 2, px, py, 13); hg.addColorStop(0, skin); hg.addColorStop(1, mul(skin, 0.55));
  q.fillStyle = hg; q.beginPath(); q.arc(px + dx * 3, py + dy * 3, 12, 0, 7); q.fill();
  q.fillStyle = hair; q.beginPath(); q.arc(px + dx * 3, py + dy * 3, 12.5, ang + Math.PI * 0.8, ang + Math.PI * 2.0); q.fill();      // cheveux côté opposé
}
S.p04b_foule_detaillee = g => {                       // plan 4 : foule vue de haut, personnes détaillées, quelques-unes encore en mouvement
  sky(g, [[0, "#0b0f12"], [1, "#0b0f12"]]);
  roll(g, 0.18, q => {
    for (let y = -200; y < H + 200; y += 58) for (let x = -200; x < W + 200; x += 58) {
      const j = rnd(x * 1.3 + y), px = x + (j - 0.5) * 26 + (y / 58 % 2) * 29, py = y + (rnd(x + y * 3) - 0.5) * 20;
      const dc = Math.hypot(px - 540, py - 960);
      if (dc < 110) continue;
      if (dc > 540 && rnd(x * 2 + y) > 0.6) { q.strokeStyle = rgba("#cfd8dc", 0.3); q.lineWidth = 6; q.beginPath(); q.moveTo(px, py); q.lineTo(px + (px - 540) * 0.14, py + (py - 960) * 0.14); q.stroke(); }
      topPerson(q, px, py, j, x * 0.37 + y * 1.91 + 5);
    }
    glow(q, 540, 960, 260, TEAL, 0.4);
    q.fillStyle = "#2c4256"; q.beginPath(); q.ellipse(540, 966, 44, 28, 0.2, 0, 7); q.fill(); q.strokeStyle = INK; q.lineWidth = 4; q.stroke();
    const hg = q.createRadialGradient(532, 950, 2, 540, 958, 26); hg.addColorStop(0, "#f6f3ec"); hg.addColorStop(1, "#9d9a94"); q.fillStyle = "#2b211b"; q.beginPath(); q.arc(540, 958, 26, 0, 7); q.fill(); q.stroke();
    pill(q, "TOI", 540, 1060); });
  zoomBlur(g, 540, 960, 0.02); hud(g); finish(g, { bloom: 0.35, grade: ["#06202a", "#ffd9a0", 0.16] }); caption(g, ["ARRÊTENT", "DE", "BOUGER."], 0);
};
S.p02c_fond_district = g => {                         // plan 2 : même plan, fond = district construit, dôme au-dessus
  sky(g, [[0, "#0a1216"], [0.55, "#16242a"], [1, "#07090a"]]);
  richSkyline(g, 1330, -20, W + 20, 41, { hmin: 120, hvar: 260, wmin: 70, wvar: 90, cols: ["#2a2a26", "#3a3428", "#2c3134", "#443c30", "#33302a"] });
  layer(g, q => { q.fillStyle = "rgba(20,30,34,0.5)"; q.fillRect(0, 1000, W, 400); }, { blur: 2 });
  domeBarrier(g, 620, 1100, 800, 0.95);
  layer(g, q => { q.fillStyle = "#1b1510"; q.fillRect(0, 1380, W, H - 1380); }, { blur: 2 });
  g.fillStyle = "#3a2a1c"; g.fillRect(60, 1470, 960, 40); g.fillStyle = "#24190f"; g.fillRect(60, 1510, 960, 30);
  compassBig(g, 540, 1470, 70, 1.0 + Math.sin(2.7) * 0.22);
  actor(g, 360, 1720, 1.0, { ...HERO, look: 0.2, arms: [[-1, 30], [1, -20]] }, { rim: TEAL, rimAng: -2.2, key: "#ffd9a0", shadow: false });
  actor(g, 720, 1720, 1.0, { ...PERE, look: -0.1, arms: [[-1, -20], [1, 30]] }, { rim: "#cfe3ee", rimAng: -0.8, key: "#dfe9ef", shadow: false });
  glow(g, 540, 1100, 500, TEAL, 0.15);
  // lumières des fenêtres du district, éparses
  for (let i = 0; i < 60; i++) { g.fillStyle = rgba(rnd(i) > 0.5 ? AMBER : CITY_COOL, 0.5 + rnd(i * 3) * 0.4); g.fillRect(rnd(i * 7) * W, 900 + rnd(i * 11) * 380, 6, 8); }
  dust(g, 50, "#cfe9e6", 0, 1500, 83, 3);
  hud(g); finish(g, { bloom: 0.35, grade: ["#06202a", "#ffd9a0", 0.16] }); caption(g, ["SOUS", "UN", "DÔME"], 1);
};
// ---------- v9 : figurants sobres, héros en lumière de scène (plan 4) ; fond chaud magenta et spot diffus (plan 2) ----------
function topPersonMuted(q, px, py, j, seed) {        // figurant sobre : gris, bruns froids, peu de couleur
  const pal = ["#3a3f44", "#4a4640", "#2e3134", "#55524c", "#3d3a36", "#5a5f63", "#2a2c2e"];
  const hairs = ["#121010", "#2a2420", "#4a4036", "#6a6258"];
  const cloth = pal[Math.floor(rnd(seed) * pal.length)], hair = hairs[Math.floor(rnd(seed * 3) * hairs.length)];
  const ang = rnd(seed * 5) * 6.2832, dx = Math.cos(ang), dy = Math.sin(ang);
  q.fillStyle = "rgba(0,0,0,0.42)"; q.beginPath(); q.ellipse(px + 9, py + 11, 33, 21, ang, 0, 7); q.fill();
  q.fillStyle = mul(cloth, 0.7 + j * 0.4); q.beginPath(); q.ellipse(px, py, 31, 17, ang, 0, 7); q.fill();
  q.strokeStyle = "rgba(0,0,0,0.4)"; q.lineWidth = 2; q.stroke();
  const skin = rnd(seed * 11) > 0.5 ? "#8a7564" : "#5e4c3e";
  const hg = q.createRadialGradient(px - 4, py - 4, 2, px, py, 13); hg.addColorStop(0, skin); hg.addColorStop(1, mul(skin, 0.5));
  q.fillStyle = hg; q.beginPath(); q.arc(px + dx * 3, py + dy * 3, 12, 0, 7); q.fill();
  q.fillStyle = hair; q.beginPath(); q.arc(px + dx * 3, py + dy * 3, 12.5, ang + Math.PI * 0.8, ang + Math.PI * 2.0); q.fill();
}
S.p04c_foule_discrete = g => {                       // plan 4 : foule grise, héros éclairé comme sur scène
  sky(g, [[0, "#07090b"], [1, "#07090b"]]);
  roll(g, 0.18, q => {
    for (let y = -200; y < H + 200; y += 58) for (let x = -200; x < W + 200; x += 58) {
      const j = rnd(x * 1.3 + y), px = x + (j - 0.5) * 26 + (y / 58 % 2) * 29, py = y + (rnd(x + y * 3) - 0.5) * 20;
      const dc = Math.hypot(px - 540, py - 960);
      if (dc < 110) continue;
      if (dc > 540 && rnd(x * 2 + y) > 0.6) { q.strokeStyle = rgba("#aab4b8", 0.22); q.lineWidth = 6; q.beginPath(); q.moveTo(px, py); q.lineTo(px + (px - 540) * 0.14, py + (py - 960) * 0.14); q.stroke(); }
      topPersonMuted(q, px, py, j, x * 0.37 + y * 1.91 + 5);
    }
  });
  // cône de lumière de scène, pool diffus au centre, bord sombre
  layer(g, q => { const r = q.createRadialGradient(540, 960, 40, 540, 960, 620); r.addColorStop(0, "rgba(255,236,200,0.22)"); r.addColorStop(0.45, "rgba(255,220,170,0.07)"); r.addColorStop(1, "rgba(0,0,0,0)"); q.fillStyle = r; q.fillRect(0, 0, W, H); }, { op: "screen", blur: 6 });
  roll(g, 0, q => { });
  const v = g.createRadialGradient(540, 960, 260, 540, 960, 1000); v.addColorStop(0, "rgba(0,0,0,0)"); v.addColorStop(1, "rgba(0,0,0,0.6)"); g.fillStyle = v; g.fillRect(0, 0, W, H);
  // héros
  g.fillStyle = "#2c4256"; g.beginPath(); g.ellipse(540, 966, 44, 28, 0.2, 0, 7); g.fill(); g.strokeStyle = INK; g.lineWidth = 4; g.stroke();
  const hg = g.createRadialGradient(532, 950, 2, 540, 958, 26); hg.addColorStop(0, "#f6f3ec"); hg.addColorStop(1, "#9d9a94"); g.fillStyle = "#2b211b"; g.beginPath(); g.arc(540, 958, 26, 0, 7); g.fill(); g.stroke();
  pill(g, "TOI", 540, 1060);
  zoomBlur(g, 540, 960, 0.012); hud(g, { alpha: 0.7 }); finish(g, { bloom: 0.5, grade: ["#1a0a0a", "#ffe2b0", 0.14] }); caption(g, ["ARRÊTENT", "DE", "BOUGER."], 0);
};
S.p02d_fond_magenta_spot = g => {                    // plan 2 : fond magenta-rouge flashy, spot chaud diffus sur le héros
  sky(g, [[0, "#2a0418"], [0.5, "#5a0c2c"], [1, "#12020a"]]);
  richSkyline(g, 1330, -20, W + 20, 41, { hmin: 120, hvar: 260, wmin: 70, wvar: 90, cols: ["#3a0c24", "#430f2b", "#2e0a1e", "#4a1230", "#33081c"] });
  layer(g, q => { q.fillStyle = "rgba(60,8,30,0.5)"; q.fillRect(0, 1000, W, 400); }, { blur: 2 });
  g.fillStyle = "#14030a"; g.fillRect(0, 1380, W, H - 1380);
  // faisceau de spot depuis le haut, diffus
  layer(g, q => { const cone = q.createLinearGradient(0, 0, 0, 1700); cone.addColorStop(0, "rgba(255,170,90,0.55)"); cone.addColorStop(1, "rgba(255,150,80,0.05)");
    q.fillStyle = cone; q.beginPath(); q.moveTo(470, 0); q.lineTo(610, 0); q.lineTo(860, 1700); q.lineTo(220, 1700); q.closePath(); q.fill(); }, { op: "screen", blur: 26 });
  layer(g, q => { const p = q.createRadialGradient(540, 1560, 10, 540, 1560, 420); p.addColorStop(0, "rgba(255,190,110,0.6)"); p.addColorStop(1, "rgba(255,120,60,0)"); q.fillStyle = p; q.fillRect(0, 1100, W, 900); }, { op: "screen" });
  g.fillStyle = "#3a0a1e"; g.fillRect(60, 1470, 960, 40); g.fillStyle = "#1e0610"; g.fillRect(60, 1510, 960, 30);   // table
  compassBig(g, 540, 1470, 70, 1.0 + Math.sin(2.7) * 0.22);
  actor(g, 360, 1720, 1.0, { ...HERO, look: 0.2, arms: [[-1, 30], [1, -20]] }, { rim: "#ffd0a0", rimAng: -2.0, key: "#ffe2b0", shadow: false });
  actor(g, 720, 1720, 1.0, { ...PERE, look: -0.1, arms: [[-1, -20], [1, 30]] }, { rim: "#ffd0a0", rimAng: -0.8, key: "#ffe2b0", shadow: false });
  dust(g, 60, "#ffd0a0", 0, 1500, 91, 3);
  hud(g); finish(g, { bloom: 0.45, grade: ["#2a0418", "#ffb080", 0.16] }); caption(g, ["SOUS", "UN", "DÔME"], 1);
};
// ---------- v10 : plan 2 « oiseau qui tombe » en 3 images (suivi caméra -> caméra calée sur le héros -> sol) ----------
function deadBird(g, x, y, s, rot, blur = 0) {       // oiseau mort : corps sombre à reflet teal, ailes repliées, tête pendante, pattes raides
  g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s); if (blur) g.filter = `blur(${blur}px)`;
  g.fillStyle = "#2a2d30"; g.beginPath(); g.ellipse(0, 0, 58, 26, 0, 0, 7); g.fill();                              // corps
  g.fillStyle = "#3d4a4f"; g.beginPath(); g.ellipse(-8, -6, 40, 13, 0.1, 0, 7); g.fill();                         // reflet
  g.fillStyle = "#1c1f22"; g.beginPath(); g.moveTo(-10, -4); g.lineTo(-74, -58); g.lineTo(-58, 2); g.closePath(); g.fill();   // aile haute
  g.beginPath(); g.moveTo(-10, 6); g.lineTo(-70, 48); g.lineTo(-40, 14); g.closePath(); g.fill();                  // aile basse
  g.fillStyle = "#24272a"; g.beginPath(); g.arc(56, -6, 17, 0, 7); g.fill();                                       // tête
  g.fillStyle = "#c9a040"; g.beginPath(); g.moveTo(70, -6); g.lineTo(88, 0); g.lineTo(70, 4); g.closePath(); g.fill(); // bec
  g.strokeStyle = "#0c0d0e"; g.lineWidth = 3; g.beginPath(); g.moveTo(60, -4); g.lineTo(68, -2); g.moveTo(60, -10); g.lineTo(68, -12); g.stroke();   // œil fermé
  g.strokeStyle = "#1c1f22"; g.lineWidth = 5; g.beginPath(); g.moveTo(-14, 22); g.lineTo(-20, 44); g.moveTo(-2, 22); g.lineTo(-6, 46); g.stroke();   // pattes
  g.restore();
}
function domeNight(g) {
  sky(g, [[0, "#070c10"], [0.5, "#0c1a20"], [1, "#050708"]]);
  domeBarrier(g, 700, 1100, 800, 0.8);
}
S.p02e1_oiseau_chute = g => {                        // image 1 : la caméra suit l'oiseau, le fond file en traînées
  domeNight(g);
  for (let i = 0; i < 40; i++) { g.strokeStyle = rgba("#cfe9e6", 0.05 + rnd(i) * 0.12); g.lineWidth = 2 + rnd(i * 3) * 3; const x = rnd(i * 7) * W; g.beginPath(); g.moveTo(x, 0); g.lineTo(x + (x - 540) * 0.02, H); g.stroke(); }
  layer(g, q => deadBird(q, 540, 880, 1.7, 0.5, 0), { blur: 0 });
  deadBird(g, 540, 880, 1.7, 0.5);
  hud(g); finish(g, { bloom: 0.35, grade: ["#06202a", "#ffd9a0", 0.16] }); caption(g, ["SOUS", "UN", "DÔME"], 1);
};
S.p02e2_oiseau_devant_heros = g => {                 // image 2 : caméra calée sur le buste, l'oiseau passe devant
  domeNight(g);
  layer(g, q => crowd(q, 1480, 4, { backs: true, tint: "#2e3a40", body: "#07090a", big: 1.5 }), { blur: 5 });
  actor(g, 540, 2650, 2.3, { ...HERO, look: 0.0, arms: [[-1, 10], [1, 10]] }, { rim: TEAL, rimAng: -1.57, rimW: 7, key: "#ffd9a0", shadow: false });
  deadBird(g, 540, 1420, 1.8, 1.2, 2.5);
  deadBird(g, 540, 1420, 1.8, 1.2);
  hud(g); finish(g, { bloom: 0.35, grade: ["#06202a", "#ffd9a0", 0.16] }); caption(g, ["SOUS", "UN", "DÔME"], 1);
};
S.p02e3_oiseau_sol = g => {                          // image 3 : l'oiseau atteint le sol devant les pieds du héros
  sky(g, [[0, "#070c10"], [0.6, "#101a1e"], [1, "#050607"]]);
  domeBarrier(g, 700, 1100, 800, 0.8);
  layer(g, q => { q.fillStyle = "#1b1510"; q.fillRect(0, 1480, W, H - 1480); }, { blur: 2 });
  layer(g, q => crowd(q, 1560, 3, { backs: true, tint: "#2e3a40", body: "#07090a", big: 1.6 }), { blur: 6 });
  actor(g, 540, 1720, 1.0, { ...HERO, look: 0.0, arms: [[-1, 10], [1, 10]] }, { rim: TEAL, rimAng: -1.57, key: "#ffd9a0", shadow: true });
  deadBird(g, 400, 1760, 1.5, 1.5);
  g.fillStyle = "rgba(0,0,0,0.4)"; g.beginPath(); g.ellipse(400, 1772, 100, 14, 0, 0, 7); g.fill();
  hud(g); finish(g, { bloom: 0.35, grade: ["#06202a", "#ffd9a0", 0.16] }); caption(g, ["SOUS", "UN", "DÔME"], 1);
};
// ---------- v12 : plan 2 oiseau — cadrage du buste conservé, détails d'ambiance, l'oiseau tombe jusqu'au sol visible ----------
function detailBG(g, seed) {
  g.strokeStyle = "rgba(120,170,180,0.07)"; g.lineWidth = 2;                                     // joints de panneaux du mur
  for (let x = 0; x <= W; x += 180) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 1500); g.stroke(); }
  for (let k = 0; k < 3; k++) {                                                                   // grésillement rouge sur le bord du dôme
    g.save(); g.shadowColor = "rgba(255,70,50,0.9)"; g.shadowBlur = 18; g.strokeStyle = "rgba(255,90,70,0.85)"; g.lineWidth = 3; g.beginPath();
    for (let i = 0; i <= 24; i++) { const a = -2.3 + (k * 0.12) + i / 24 * 1.45, r = 1 + (rnd(seed + k * 40 + i) - 0.5) * 0.04; const x = 1100 + 0 + Math.cos(a) * 760 * r - 560, y = 1250 + Math.sin(a) * 640 * r;
      i ? g.lineTo(x, y) : g.moveTo(x, y); }
    g.stroke(); g.restore();
  }
  dust(g, 110, "#cfe9e6", 0, 1700, seed, 2.2);                                                    // poussière en suspension
  g.save(); g.filter = "blur(10px)"; g.fillStyle = "rgba(0,0,0,0.7)"; g.beginPath(); g.ellipse(120, 1840, 90, 70, 0, 0, 7); g.fill(); g.restore();   // verre au premier plan, flou
  g.fillStyle = "rgba(255,200,120,0.35)"; g.beginPath(); g.arc(930, 300, 6, 0, 7); g.fill();     // petit voyant
}
S.p02f_oiseau_buste = g => {                          // image 2 : même cadrage que p02e2, avec détails
  domeNight(g);
  detailBG(g, 91);
  layer(g, q => crowd(q, 1480, 4, { backs: true, tint: "#2e3a40", body: "#07090a", big: 1.5 }), { blur: 5 });
  actor(g, 540, 2650, 2.3, { ...HERO, look: 0.0, arms: [[-1, 10], [1, 10]] }, { rim: TEAL, rimAng: -1.57, rimW: 7, key: "#ffd9a0", shadow: false });
  deadBird(g, 540, 1420, 1.8, 1.2, 2.5);
  deadBird(g, 540, 1420, 1.8, 1.2);
  hud(g); finish(g, { bloom: 0.35, grade: ["#06202a", "#ffd9a0", 0.16] }); caption(g, ["SOUS", "UN", "DÔME"], 1);
};
S.p02g_oiseau_au_sol = g => {                         // image 3 : même cadrage, l'oiseau atteint le sol à côté du héros
  domeNight(g);
  detailBG(g, 93);
  layer(g, q => { q.fillStyle = "#1b1510"; q.fillRect(0, 1700, W, H - 1700); }, { blur: 2 });
  layer(g, q => crowd(q, 1480, 4, { backs: true, tint: "#2e3a40", body: "#07090a", big: 1.5 }), { blur: 5 });
  actor(g, 540, 2650, 2.3, { ...HERO, look: 0.0, arms: [[-1, 10], [1, 10]] }, { rim: TEAL, rimAng: -1.57, rimW: 7, key: "#ffd9a0", shadow: false });
  g.fillStyle = "rgba(0,0,0,0.45)"; g.beginPath(); g.ellipse(930, 1850, 120, 16, 0, 0, 7); g.fill();
  deadBird(g, 930, 1838, 1.3, 1.5);
  hud(g); finish(g, { bloom: 0.35, grade: ["#06202a", "#ffd9a0", 0.16] }); caption(g, ["SOUS", "UN", "DÔME"], 1);
};
// ---------- v13 : plan 2 oiseau — dôme en hologramme teal à hauteur de la tête, foule debout et dispersée, détails vivants ----------
function standSil(g, x, feet, h, col, blur = 0) {       // silhouette debout vue de dos : tête, épaules, bras, jambes
  g.save(); if (blur) g.filter = `blur(${blur}px)`; g.fillStyle = col;
  g.fillRect(x - h * 0.05, feet - h * 0.45, h * 0.04, h * 0.45); g.fillRect(x + h * 0.01, feet - h * 0.45, h * 0.04, h * 0.45);
  g.beginPath(); g.roundRect(x - h * 0.09, feet - h * 0.78, h * 0.18, h * 0.36, h * 0.05); g.fill();
  g.fillRect(x - h * 0.12, feet - h * 0.74, h * 0.03, h * 0.3); g.fillRect(x + h * 0.09, feet - h * 0.74, h * 0.03, h * 0.3);
  g.beginPath(); g.arc(x, feet - h * 0.86, h * 0.07, 0, 7); g.fill();
  g.restore();
}
function crowdStanding(g) {
  const far = [[120, 1520, 300], [260, 1500, 280], [420, 1530, 300], [660, 1510, 290], [820, 1525, 310], [960, 1505, 280]];
  far.forEach(([x, f, h], i) => standSil(g, x, f, h, `rgba(${20 + i * 3},${32 + i * 3},${38 + i * 3},1)`, 3));
  const near = [[70, 1880, 640, "#1d2629"], [230, 1900, 700, "#222c30"], [880, 1860, 620, "#1b2427"], [1010, 1890, 690, "#202a2e"]];
  near.forEach(([x, f, h, c]) => standSil(g, x, f, h, c, 0));
}
function holoRain(g, seed) {                             // pluie fine derrière la vitre
  g.strokeStyle = "rgba(150,200,210,0.14)"; g.lineWidth = 1.5;
  for (let i = 0; i < 90; i++) { const x = rnd(seed + i) * W, y = rnd(seed * 3 + i) * H, l = 30 + rnd(i * 5) * 50; g.beginPath(); g.moveTo(x, y); g.lineTo(x - 6, y + l); g.stroke(); }
}
function holoDome(g, seed) {                             // dôme : hologramme teal, bord bas près de la tête, scanlines qui défilent, grésillement rouge localisé
  domeBarrier(g, 1300, 640, 500, 0.85);
  layer(g, q => { q.fillStyle = "rgba(111,224,214,0.05)"; for (let y = 0; y < 900; y += 6) q.fillRect(0, y, W, 2); }, { op: "screen" });
  g.save(); g.shadowColor = "rgba(255,70,50,0.9)"; g.shadowBlur = 14; g.strokeStyle = "rgba(255,90,70,0.9)"; g.lineWidth = 3; g.beginPath();
  for (let i = 0; i <= 10; i++) { const a = -2.0 + i * 0.03, x = 540 + Math.cos(a) * 640 + (rnd(seed + i) - 0.5) * 16, y = 1300 + Math.sin(a) * 500 + (rnd(seed * 2 + i) - 0.5) * 16; i ? g.lineTo(x, y) : g.moveTo(x, y); }
  g.stroke(); g.restore();
}
function lifeDetails(g, seed) {
  holoRain(g, seed);
  for (let i = 0; i < 6; i++) { g.fillStyle = rgba("#ff3b2a", 0.5 + 0.5 * Math.sin(i * 1.7)); g.beginPath(); g.arc(120 + i * 180, 1330 + rnd(i) * 40, 3, 0, 7); g.fill(); }   // voyants lointains
  g.fillStyle = "rgba(255,200,120,0.25)"; g.beginPath(); g.ellipse(170, 1790, 22, 40, 0, 0, 7); g.fill();           // reflet tasse fumante
  dust(g, 80, "#cfe9e6", 0, 1700, seed + 7, 2.2);
}
function paperSheet(g, x, y, s, rot, blur = 0) {       // feuille pliée du père, tombe en tournant
  g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s); if (blur) g.filter = `blur(${blur}px)`;
  g.fillStyle = "#e9dfc6"; g.strokeStyle = INK; g.lineWidth = 4; g.beginPath(); g.rect(-62, -84, 124, 168); g.fill(); g.stroke();
  g.fillStyle = "#c9bc9c"; g.beginPath(); g.moveTo(62, -84); g.lineTo(62, -54); g.lineTo(32, -84); g.closePath(); g.fill();   // coin replié
  g.strokeStyle = "rgba(90,80,60,0.5)"; g.lineWidth = 2; g.beginPath(); g.moveTo(-62, 0); g.lineTo(62, 0); g.stroke();   // pli central
  for (let k = 0; k < 6; k++) { g.beginPath(); g.moveTo(-40, -50 + k * 16); g.lineTo(40 - (k % 2) * 20, -50 + k * 16); g.stroke(); }
  g.restore();
}
S.p02h_buste_vivant = g => {                              // image 2 v13
  sky(g, [[0, "#070b0d"], [0.6, "#0f1a1e"], [1, "#040506"]]);
  lifeDetails(g, 101);
  holoDome(g, 101);
  layer(g, q => { q.fillStyle = "#1b1510"; q.fillRect(0, 1700, W, H - 1700); }, { blur: 2 });
  crowdStanding(g);
  actor(g, 790, 2650, 1.8, { ...PERE, look: -0.12, arms: [[-1, 10], [1, 10]] }, { rim: "#cfe3ee", rimAng: -1.2, rimW: 7, key: "#dfe9ef", shadow: false });   // père, côté droit
  actor(g, 290, 2650, 1.8, { ...HERO, look: 0.0, arms: [[-1, 10], [1, 10]] }, { rim: TEAL, rimAng: -1.57, rimW: 7, key: "#ffd9a0", shadow: false });
  pigeon(g, 540, 1400, 2.8, 1.2, 3);
  pigeon(g, 540, 1400, 2.8, 1.2, 0);
  hud(g); finish(g, { bloom: 0.35, grade: ["#06202a", "#ffd9a0", 0.16] }); caption(g, ["SOUS", "UN", "DÔME"], 1);
};
S.p02i_sol_vivant = g => {                                // image 3 v13
  sky(g, [[0, "#070b0d"], [0.6, "#0f1a1e"], [1, "#040506"]]);
  lifeDetails(g, 103);
  holoDome(g, 103);
  layer(g, q => { q.fillStyle = "#1b1510"; q.fillRect(0, 1700, W, H - 1700); }, { blur: 2 });
  crowdStanding(g);
  actor(g, 790, 2650, 1.8, { ...PERE, look: -0.12, arms: [[-1, 10], [1, 10]] }, { rim: "#cfe3ee", rimAng: -1.2, rimW: 7, key: "#dfe9ef", shadow: false });   // père, côté droit
  actor(g, 290, 2650, 1.8, { ...HERO, look: 0.0, arms: [[-1, 10], [1, 10]] }, { rim: TEAL, rimAng: -1.57, rimW: 7, key: "#ffd9a0", shadow: false });
  g.fillStyle = "rgba(0,0,0,0.4)"; g.beginPath(); g.ellipse(880, 1852, 90, 12, 0, 0, 7); g.fill();
  pigeon(g, 560, 1860, 2.0, 1.45, 0);
  hud(g); finish(g, { bloom: 0.35, grade: ["#06202a", "#ffd9a0", 0.16] }); caption(g, ["SOUS", "UN", "DÔME"], 1);
};
// ---------- v17 : plan 2 — ouverture sur l'objet (feuille pliée qui tombe, gros plan, traînée de mouvement) ----------
S.p02j_objet_debut = g => {
  domeNight(g);
  for (let i = 0; i < 50; i++) { g.strokeStyle = rgba("#cfe9e6", 0.05 + rnd(i) * 0.1); g.lineWidth = 2 + rnd(i * 3) * 3; const x = rnd(i * 7) * W; g.beginPath(); g.moveTo(x, 0); g.lineTo(x + 4, H); g.stroke(); }   // chute : traînées verticales
  paperSheet(g, 540, 560, 2.4, 0.3, 10);
  paperSheet(g, 540, 700, 2.4, 0.3, 4);
  paperSheet(g, 540, 820, 2.4, 0.3, 0);
  hud(g); finish(g, { bloom: 0.35, grade: ["#06202a", "#ffd9a0", 0.16] }); caption(g, ["SOUS", "UN", "DÔME"], 1);
};
// ---------- v18 : retour de l'oiseau, en contraste (plumage crème, bec et pattes orangés), plus gros ----------
function pigeon(g, x, y, s, rot, blur = 0) {         // oiseau mort : plumage crème et gris, bec et pattes orange
  g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s); if (blur) g.filter = `blur(${blur}px)`;
  g.fillStyle = "#ece4d2"; g.beginPath(); g.ellipse(0, 0, 58, 28, 0, 0, 7); g.fill(); g.strokeStyle = INK; g.lineWidth = 3; g.stroke();   // corps
  g.fillStyle = "#c8bfa8"; g.beginPath(); g.ellipse(-6, -8, 40, 12, 0.1, 0, 7); g.fill();                                              // dos ombré
  g.fillStyle = "#4a4d52"; g.beginPath(); g.moveTo(-10, -4); g.lineTo(-78, -62); g.lineTo(-58, 4); g.closePath(); g.fill(); g.stroke();  // aile haute grise
  g.beginPath(); g.moveTo(-10, 6); g.lineTo(-72, 50); g.lineTo(-40, 14); g.closePath(); g.fill(); g.stroke();                       // aile basse
  g.fillStyle = "#ece4d2"; g.beginPath(); g.arc(56, -6, 18, 0, 7); g.fill(); g.stroke();                                              // tête
  g.fillStyle = "#e0701e"; g.beginPath(); g.moveTo(70, -8); g.lineTo(92, 0); g.lineTo(70, 4); g.closePath(); g.fill();                  // bec orange
  g.strokeStyle = "#17130e"; g.lineWidth = 3; g.beginPath(); g.moveTo(60, -4); g.lineTo(68, -2); g.moveTo(60, -12); g.lineTo(68, -14); g.stroke();   // œil fermé
  g.strokeStyle = "#e0701e"; g.lineWidth = 5; g.beginPath(); g.moveTo(-14, 24); g.lineTo(-22, 46); g.moveTo(-2, 24); g.lineTo(-8, 48); g.stroke();   // pattes orange
  g.restore();
}
S.p02k_oiseau_debut = g => {                         // ouverture : oiseau énorme qui tombe, traînée verticale
  domeNight(g);
  for (let i = 0; i < 50; i++) { g.strokeStyle = rgba("#cfe9e6", 0.05 + rnd(i) * 0.1); g.lineWidth = 2 + rnd(i * 3) * 3; const x = rnd(i * 7) * W; g.beginPath(); g.moveTo(x, 0); g.lineTo(x + 4, H); g.stroke(); }
  pigeon(g, 540, 640, 2.6, 0.5, 10);
  pigeon(g, 540, 780, 2.6, 0.5, 0);
  hud(g); finish(g, { bloom: 0.35, grade: ["#06202a", "#ffd9a0", 0.16] }); caption(g, ["SOUS", "UN", "DÔME"], 1);
};
window.SCENES = Object.fromEntries(Object.entries(S).filter(([k]) => !k.endsWith("_bg")));
window.SCENES_ALL = S;
