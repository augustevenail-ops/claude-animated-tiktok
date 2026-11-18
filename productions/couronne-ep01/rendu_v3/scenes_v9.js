// v9 : plan 4 (vue de dessus) : ton père à côté de toi ; plan 18 : le garde posé au sol (ombre de contact, pieds sur le trottoir)

S.a04_foule_dessus = g => {
  bare("p04c_foule_discrete", g);
  const top = (x, y, ang) => { g.fillStyle = "#6e2d5e"; g.strokeStyle = INK; g.lineWidth = 5; g.beginPath(); g.ellipse(x, y + 10, 50, 30, ang, 0, 7); g.fill(); g.stroke(); };
  // toi : épaules prune, bonnet kaki à côtes rayonnantes
  const hx = 488, hy = 958; top(hx, hy, 0.15);
  g.fillStyle = "#6e7650"; g.beginPath(); g.arc(hx, hy, 27, 0, 7); g.fill();
  g.strokeStyle = "#5f6842"; g.lineWidth = 3; for (let k = 0; k < 11; k++) { const b = k / 11 * 6.2832; g.beginPath(); g.moveTo(hx + Math.cos(b) * 6, hy + Math.sin(b) * 6); g.lineTo(hx + Math.cos(b) * 25, hy + Math.sin(b) * 25); g.stroke(); }
  g.strokeStyle = INK; g.lineWidth = 5; g.beginPath(); g.arc(hx, hy, 27, 0, 7); g.stroke();
  // ton père : épaules prune, crâne clair, couronne de cheveux gris, branches de lunettes
  const px = 596, py = 950; top(px, py, -0.1);
  g.fillStyle = PERE.skin; g.beginPath(); g.arc(px, py, 28, 0, 7); g.fill();
  g.strokeStyle = PERE.hair; g.lineWidth = 9; g.beginPath(); g.arc(px, py, 22, 0.35, Math.PI - 0.35); g.stroke();
  g.fillStyle = "rgba(255,255,255,0.35)"; g.beginPath(); g.ellipse(px - 7, py - 9, 9, 6, -0.5, 0, 7); g.fill();
  g.strokeStyle = "#2a2622"; g.lineWidth = 2.5; g.beginPath(); g.moveTo(px - 27, py - 4); g.lineTo(px - 18, py - 12); g.moveTo(px + 27, py - 4); g.lineTo(px + 18, py - 12); g.stroke();
  g.strokeStyle = INK; g.lineWidth = 5; g.beginPath(); g.arc(px, py, 28, 0, 7); g.stroke();
  pill(g, "TOI", hx, 1060); pill(g, "TON PÈRE", px + 30, 850);
  alarmWash(g, 0.5); alarmBeams(g, 540, 560, 0.5, 1700); beacon(g, 540, 560, 0.75, 0.5, true);
  hud(g, { alpha: 0.7 }); finish(g, { bloom: 0.4, grade: ["#1a0a0a", "#ffe2b0", 0.1] });
};

S.v18_garde_vivant = g => { bg3d(g, "s18_centre_avenue"); layer(g, q => q.drawImage(window.IMG3D.s18_centre_avenue, 0, 0, W, H), { blur: 4 });
  const gr = g.createRadialGradient(540, 1805, 10, 540, 1805, 190); gr.addColorStop(0, "rgba(0,0,0,0.6)"); gr.addColorStop(1, "rgba(0,0,0,0)");
  g.save(); g.translate(540, 1805); g.scale(1, 0.22); g.translate(-540, -1805); g.fillStyle = gr; g.beginPath(); g.arc(540, 1805, 190, 0, 7); g.fill(); g.restore();   // ombre de contact
  actor(g, 540, 1800, 1.2, { ...GARDE, baton: true }, { rim: GOLD, rimAng: -1.57, rimW: 11, key: "#ffe6b0" });
  hud(g, { clock: "07:20", zone: "LE CENTRE" }); fin3d(g); };

// plans 19-21 : une seule prise (le drone plonge entre les immeubles jusqu'à la règle 2)
S.m20_regle2_un = g => { bg3d(g, "d19r21_plonge"); hud(g, { zone: "LE CENTRE" }); fin3d(g); };
