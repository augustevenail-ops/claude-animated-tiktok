// Scènes de contrôle v2 : compositions calquées sur les plans de référence indiqués.
const S = {};
const interior = (g, light = [540, 260, 1000, "#a8864f"]) => { concrete(g, "#1c150d", light, 3); };
// --- MONDE ---
S.w1_infographie_dome = g => {      // réf. planches 4-5 (pyramide filaire + étiquettes en pilules)
  concrete(g, "#231d16", [540, 760, 900, "#c9a46a"], 7);
  g.fillStyle = "rgba(0,0,0,0.35)"; g.fillRect(0, 0, W, 610); g.strokeStyle = "rgba(201,164,106,0.35)"; g.lineWidth = 2; g.beginPath(); g.moveTo(0, 610); g.lineTo(W, 610); g.stroke();
  const cx = 540, cy = 1010, P = (r, a, h = 0) => [cx + r * Math.cos(a), cy + r * Math.sin(a) * 0.42 - h];
  const hexp = (r, h = 0) => Array.from({ length: 6 }, (_, i) => P(r, Math.PI / 3 * i + Math.PI / 6, h));
  const poly = (pts, col, lw, fill) => { g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.closePath(); if (fill) { g.fillStyle = fill; g.fill(); } g.strokeStyle = col; g.lineWidth = lw; g.stroke(); };
  poly(hexp(470), "rgba(225,200,150,0.75)", 3, "rgba(30,24,18,0.85)");                      // sol des districts
  for (let r = 0; r < 6; r++) { const a = Math.PI / 3 * r + Math.PI / 6; const p0 = P(200, a), p1 = P(470, a); g.strokeStyle = "rgba(225,200,150,0.35)"; g.lineWidth = 2; g.beginPath(); g.moveTo(p0[0], p0[1]); g.lineTo(p1[0], p1[1]); g.stroke(); }
  for (let i = 0; i < 1400; i++) { const r = 210 + rnd(i) * 250, a = rnd(i * 3) * Math.PI * 2, p = P(r, a); g.fillStyle = rgba("#e8c27a", 0.25 + rnd(i * 7) * 0.5); g.fillRect(p[0], p[1], 2.2, 2.2); }   // habitants (points)
  poly(hexp(200), "rgba(240,215,160,0.95)", 4, "rgba(40,34,22,0.9)");                        // second mur
  for (let i = 0; i < 9; i++) { const p = P(120 * rnd(i * 5), rnd(i * 9) * 6.28), h = 40 + rnd(i) * 70; g.strokeStyle = "rgba(240,215,160,0.8)"; g.lineWidth = 2; g.strokeRect(p[0] - 8, p[1] - h, 16, h); }  // tours du centre
  for (let m = 0; m < 12; m++) { const a = Math.PI / 6 * m; g.strokeStyle = "rgba(225,200,150,0.28)"; g.lineWidth = 1.5; g.beginPath();   // méridiens du dôme
    for (let t = 0; t <= 1.0001; t += 0.05) { const ang = t * Math.PI / 2, p = P(470 * Math.cos(ang), a, 470 * Math.sin(ang) * 0.9); t ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]); } g.stroke(); }
  for (let k = 1; k < 5; k++) { const ang = k * Math.PI / 10; poly(Array.from({ length: 48 }, (_, i) => P(470 * Math.cos(ang), i / 48 * 6.283, 470 * Math.sin(ang) * 0.9)), "rgba(225,200,150,0.22)", 1.5); }
  const top = P(0, 0, 423); const rg = g.createRadialGradient(top[0], top[1], 2, top[0], top[1], 70); rg.addColorStop(0, "rgba(232,69,60,0.9)"); rg.addColorStop(1, "rgba(232,69,60,0)"); g.fillStyle = rg; g.fillRect(top[0] - 80, top[1] - 80, 160, 160);
  const you = P(340, -Math.PI / 2 + 0.2); const yg = g.createRadialGradient(you[0], you[1], 2, you[0], you[1], 90); yg.addColorStop(0, "rgba(240,200,120,0.85)"); yg.addColorStop(1, "rgba(240,200,120,0)"); g.fillStyle = yg; g.fillRect(you[0] - 100, you[1] - 100, 200, 200);
  pill(g, "LE DÔME", top[0], top[1] - 70); pill(g, "LE CENTRE", cx + 250, cy - 120, [cx + 40, cy - 40]); pill(g, "TOI · DISTRICT NORD", you[0] - 60, you[1] - 90, you);
  hud(g, { alpha: 0.45 }); caption(g, ["LE", "DÔME"], 1); vignette(g, 0.75); grain(g, 8);
};
function pill(g, txt, x, y, to) {
  g.font = "800 24px Montserrat"; const w = g.measureText(txt).width + 36;
  if (to) { g.strokeStyle = "rgba(240,235,225,0.8)"; g.lineWidth = 2; g.beginPath(); g.moveTo(x, y + 18); g.lineTo(to[0], to[1]); g.stroke(); }
  g.fillStyle = "rgba(20,16,12,0.9)"; g.strokeStyle = "rgba(240,235,225,0.9)"; g.lineWidth = 2.5; g.beginPath(); g.roundRect(x - w / 2, y - 22, w, 44, 22); g.fill(); g.stroke();
  g.fillStyle = "#f3efe6"; g.textAlign = "center"; g.fillText(txt, x, y + 9); g.textAlign = "left";
}
S.w2_compte_a_rebours = g => {      // réf. planche 6 (compteur rouge 7 segments, ambiance rouge, foule en bas)
  concrete(g, "#2a0f0c", [540, 820, 900, "#d23a2a"], 11);
  g.fillStyle = "rgba(10,6,5,0.85)"; g.strokeStyle = "rgba(120,60,50,0.6)"; g.lineWidth = 3; g.beginPath(); g.roundRect(120, 640, 840, 420, 26); g.fill(); g.stroke();
  seg7(g, "72:00", 540, 850, 1.0);
  g.font = "800 26px Montserrat"; g.fillStyle = "#d9c3a1"; g.textAlign = "center"; g.fillText("COUPURE DU CHAMP · DISTRICTS", 540, 1110); g.textAlign = "left";
  crowd(g, 1450, 6, { blur: 1.2, tint: "#8a4a3a" }); hud(g, { valueRed: true }); caption(g, ["D'ICI", "3", "JOURS,"], 2, 1242); vignette(g, 0.7); grain(g, 8);
};
function seg7(g, str, cx, cy, k) {                    // chiffres 7 segments rouges lumineux
  const segs = { "0": "abcdef", "1": "bc", "2": "abged", "3": "abgcd", "4": "fgbc", "5": "afgcd", "6": "afgedc", "7": "abc", "8": "abcdefg", "9": "abcdfg" };
  const w = 120 * k, h = 220 * k, t = 22 * k; let x = cx - (str.length * (w + 40 * k)) / 2;
  const glow = (f) => { g.save(); g.shadowColor = "rgba(255,60,40,0.9)"; g.shadowBlur = 30 * k; g.fillStyle = "#ff4632"; f(); g.restore(); };
  for (const ch of str) {
    if (ch === ":") { glow(() => { g.fillRect(x + 10 * k, cy - 50 * k, t, t); g.fillRect(x + 10 * k, cy + 30 * k, t, t); }); x += 50 * k; continue; }
    g.fillStyle = "rgba(255,60,40,0.07)"; ["a", "b", "c", "d", "e", "f", "g"].forEach(sg => rectSeg(g, sg, x, cy, w, h, t, false));
    glow(() => [...segs[ch]].forEach(sg => rectSeg(g, sg, x, cy, w, h, t, true))); x += w + 40 * k;
  }
}
function rectSeg(g, sg, x, cy, w, h, t, on) {
  const y0 = cy - h / 2, R = { a: [x + t, y0, w - 2 * t, t], d: [x + t, y0 + h - t, w - 2 * t, t], g: [x + t, cy - t / 2, w - 2 * t, t],
    f: [x, y0 + t, t, h / 2 - 1.5 * t], b: [x + w - t, y0 + t, t, h / 2 - 1.5 * t], e: [x, cy + t / 2, t, h / 2 - 1.5 * t], c: [x + w - t, cy + t / 2, t, h / 2 - 1.5 * t] }[sg];
  if (!on) g.fillStyle = "rgba(255,60,40,0.07)"; g.fillRect(...R);
}
S.w3_regle_1 = g => {               // réf. planche 7 (panneau, titre néon rouge, texte crème, lampe, foule)
  concrete(g, "#241a14", [540, 520, 900, "#c46a4e"], 5); lamp(g, 540, 450, "#efd2a8", 1.1);
  g.fillStyle = "rgba(25,20,16,0.55)"; g.strokeStyle = "rgba(160,140,120,0.35)"; g.lineWidth = 3; g.beginPath(); g.roundRect(80, 660, 920, 420, 8); g.fill(); g.stroke();
  neon(g, "RÈGLE 1", 540, 790, "600 104px Oswald", "#ff8a78", "rgba(255,90,70,0.9)");
  neon(g, "NE SORS JAMAIS", 540, 905, "900 60px Montserrat", "#f3d9a0", "rgba(255,200,120,0.6)");
  neon(g, "DU DÔME.", 540, 985, "900 60px Montserrat", "#e8786a", "rgba(255,90,70,0.7)");
  crowd(g, 1460, 6, { blur: 1.5, tint: "#8a5a48" }); hud(g); caption(g, ["NE", "SORS", "JAMAIS"], 1); vignette(g, 0.75); grain(g, 8);
};
function neon(g, txt, x, y, font, col, glow) { g.save(); g.font = font; g.textAlign = "center"; g.shadowColor = glow; g.shadowBlur = 26; g.fillStyle = col; g.fillText(txt, x, y); g.shadowBlur = 8; g.fillText(txt, x, y); g.restore(); }
S.w4_feuille_pere = g => {          // réf. planche 5 (papier scotché, feutre noir, lampe, foule)
  concrete(g, "#211a12", [540, 420, 1000, "#b89a64"], 9); lamp(g, 540, 300, "#efe0b8");
  g.save(); g.translate(540, 830); g.rotate(-0.04);
  g.shadowColor = "rgba(0,0,0,0.5)"; g.shadowBlur = 30; g.shadowOffsetY = 12; g.fillStyle = "#e9e3d3"; g.fillRect(-380, -300, 760, 560); g.shadowColor = "transparent";
  const pg = g.createLinearGradient(-380, -300, 380, 260); pg.addColorStop(0, "rgba(255,255,255,0.15)"); pg.addColorStop(1, "rgba(0,0,0,0.12)"); g.fillStyle = pg; g.fillRect(-380, -300, 760, 560);
  g.strokeStyle = "rgba(0,0,0,0.12)"; g.lineWidth = 2; g.beginPath(); g.moveTo(-380, -20); g.lineTo(380, -20); g.stroke();   // pli
  g.fillStyle = "rgba(200,194,178,0.75)"; [[-330, -300, -0.3], [330, -300, 0.3]].forEach(([tx, ty, r]) => { g.save(); g.translate(tx, ty); g.rotate(r); g.fillRect(-70, -18, 140, 36); g.restore(); });
  g.fillStyle = "#1c1a17"; g.font = "400 64px 'Permanent Marker'"; g.textAlign = "center";
  g.fillText("IL RESTE", 0, -170); g.fillText("DE L'ÉNERGIE.", 0, -90); g.fillText("ILS NOUS", 0, 60); g.fillText("MENTENT.", 0, 140); g.restore();
  crowd(g, 1500, 5, { blur: 1.5, alpha: 0.9 }); hud(g); caption(g, ["ILS", "NOUS", "MENTENT."], 2); vignette(g, 0.75); grain(g, 8);
};
S.w5_haut_parleur = g => {          // réf. planches 19-20 (haut-parleur mural, faisceau vertical, foule dense)
  concrete(g, "#211c17", null, 13);
  g.fillStyle = "rgba(255,255,255,0.03)"; for (let x = 120; x < W; x += 210) g.fillRect(x, 0, 6, 1500);
  const bm = g.createLinearGradient(700, 0, 900, 0); bm.addColorStop(0, "rgba(255,255,255,0)"); bm.addColorStop(0.5, "rgba(240,235,225,0.5)"); bm.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = bm; g.fillRect(700, 0, 200, 1500);
  g.save(); g.translate(430, 650); g.rotate(-0.3); g.fillStyle = "#1a1612"; g.strokeStyle = "#8a8378"; g.lineWidth = 8; g.beginPath(); g.ellipse(0, 0, 190, 150, 0, 0, 7); g.fill(); g.stroke();
  g.fillStyle = "#3a352e"; g.beginPath(); g.arc(0, 0, 32, 0, 7); g.fill(); g.restore();
  g.strokeStyle = "#8a8378"; g.lineWidth = 6; g.beginPath(); g.arc(610, 520, 48, 0, 7); g.stroke(); g.beginPath(); g.moveTo(630, 470); g.lineTo(660, 260); g.stroke();
  [1, 2, 3].forEach(i => { g.strokeStyle = `rgba(240,225,200,${0.5 - i * 0.12})`; g.lineWidth = 5; g.beginPath(); g.arc(560, 700, 230 + i * 40, -0.6, 0.2); g.stroke(); });
  pill(g, "LE CONSEIL · À LA RADIO", 540, 1080);
  crowd(g, 1300, 9, { blur: 1.2, backs: true }); hud(g); caption(g, ["LE", "CONSEIL", "ANNONCE"], 1); vignette(g, 0.75); grain(g, 8);
};
S.w6_district = g => {              // district sous le dôme : foule, lampe, bord du dôme (accent teal)
  concrete(g, "#1e170f", [540, 300, 1000, "#a8864f"], 17); lamp(g, 540, 160);
  const dg = g.createLinearGradient(0, 0, 0, 520); dg.addColorStop(0, "rgba(70,140,150,0.35)"); dg.addColorStop(1, "rgba(70,140,150,0)"); g.fillStyle = dg; g.fillRect(0, 0, W, 520);
  g.strokeStyle = "rgba(120,200,210,0.6)"; g.lineWidth = 3; g.beginPath(); g.ellipse(540, 760, 900, 520, 0, Math.PI * 1.08, Math.PI * 1.92); g.stroke();
  g.fillStyle = "rgba(20,16,12,0.85)"; g.fillRect(0, 900, W, 26); for (let x = 30; x < W; x += 96) g.fillRect(x, 820, 10, 90);   // garde-corps
  crowd(g, 1020, 10, { blur: 1.4 }); hud(g); caption(g, ["TOUT", "AUTOUR,"], 1); vignette(g, 0.8); grain(g, 8);
};
// --- PERSONNAGES ---
S.c1_heros_pied = g => { interior(g); lamp(g, 540, 120); crowd(g, 1010, 4, { blur: 3.2, alpha: 0.75, big: 1.3 }); floorPlane(g, 1480); floorPool(g, 1700);
  figure(g, 540, 1730, 1.15, HERO); hud(g); caption(g, ["TOI,"], 0); vignette(g, 0.8); grain(g, 8); };
S.c2_heros_buste = g => { interior(g, [540, 300, 900, "#e9d6a4"]);
  g.save(); g.filter = "blur(16px)"; for (let i = 0; i < 14; i++) { g.fillStyle = rgba(rnd(i) > 0.5 ? "#4a443c" : "#2e2a24", 0.95); g.beginPath(); g.arc(rnd(i * 3) * W, 900 + rnd(i * 5) * 1000, 120 + rnd(i * 7) * 90, 0, 7); g.fill(); } g.restore();
  figure(g, 540, 2650, 2.3, HERO); hud(g); caption(g, ["TU", "DÉPLIES"], 1); vignette(g, 0.8); grain(g, 8); };
S.c3_heros_marche = g => { interior(g); lamp(g, 540, 120); crowd(g, 1040, 4, { blur: 3.2, alpha: 0.75, big: 1.3 }); floorPlane(g, 1480); floorPool(g, 1700);
  figure(g, 540, 1730, 1.15, { ...HERO, side: 1, look: 0.28, headDx: 12, legs: [[-0.2, -24], [0.2, 22]], arms: [[-1, 22], [1, -22]] }); hud(g); caption(g, ["TU", "AVANCES."], 1); vignette(g, 0.8); grain(g, 8); };
S.c4_pere_buste = g => { interior(g, [600, 260, 900, "#e9d6a4"]);
  g.save(); g.filter = "blur(16px)"; for (let i = 0; i < 12; i++) { g.fillStyle = rgba(rnd(i + 4) > 0.5 ? "#4a443c" : "#2e2a24", 0.95); g.beginPath(); g.arc(rnd(i * 3 + 1) * W, 900 + rnd(i * 5 + 2) * 1000, 120 + rnd(i * 7) * 90, 0, 7); g.fill(); } g.restore();
  figure(g, 540, 2650, 2.3, { ...PERE, look: -0.08, arms: [[-1, 0], [1, -20]], handTo: [760, 1560], paper: true }); hud(g); caption(g, ["PRENDS", "ÇA."], 0); vignette(g, 0.8); grain(g, 8); };
S.c5_pere_escorte = g => { interior(g); lamp(g, 540, 120); crowd(g, 1010, 4, { blur: 3.2, alpha: 0.75, big: 1.3 }); floorPlane(g, 1480); floorPool(g, 1700, "#4a3c27", 620);
  figure(g, 370, 1730, 1.08, { ...PERE, eyeDy: 0.08, headDy: 12, arms: [[-1, 4], [1, 10]] });
  figure(g, 730, 1730, 1.18, { ...GARDE, arms: [[-1, -28], [1, 4]], handTo: [470, 1150], baton: false });
  hud(g, { clock: "07:05" }); caption(g, ["SE", "DÉBAT", "PAS."], 1); vignette(g, 0.8); grain(g, 8); };
S.c6_garde_pied = g => { concrete(g, "#24221f", [540, 120, 1000, "#d8dde2"], 21); lamp(g, 540, 120, "#e3e6ea"); crowd(g, 1010, 4, { blur: 3.2, alpha: 0.7, big: 1.3 }); floorPlane(g, 1480); floorPool(g, 1700, "#3d3b37");
  figure(g, 540, 1730, 1.18, { ...GARDE, baton: true }); hud(g, { clock: "07:05" }); caption(g, ["AU", "CENTRE."], 1); vignette(g, 0.8); grain(g, 8); };
S.c7_heros_foule = g => { interior(g, [540, 200, 1100, "#e9d6a4"]); crowd(g, 600, 14, { blur: 1.0 });
  figure(g, 540, 1420, 0.55, HERO); crowd(g, 1500, 4, { blur: 3, alpha: 0.95 }); hud(g); caption(g, ["PERSONNE", "N'EN"], 0); vignette(g, 0.8); grain(g, 8); };
window.SCENES = S;
