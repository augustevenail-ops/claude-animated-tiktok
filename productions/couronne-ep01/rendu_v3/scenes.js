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
window.SCENES = Object.fromEntries(Object.entries(S).filter(([k]) => !k.endsWith("_bg")));
window.SCENES_ALL = S;
