// ---------- v10 : carton final « PARTIE 1 » qui devient « PARTIE 2 » (orange) quand la voix dit « partie 2 » ----------
S.fin_carte = g => {
  sky(g, [[0, "#06090b"], [1, "#020304"]]);
  const rot = 0.6 + TT() * 0.5;
  g.save(); g.translate(540, 960); g.strokeStyle = rgba(TEAL, 0.5); g.lineWidth = 2;
  for (let m = 0; m < 12; m++) { g.beginPath(); for (let t = 0; t <= Math.PI; t += 0.06) { const a = m / 12 * 6.2832 + rot, x = 420 * Math.cos(t) * Math.cos(a), y = 420 * Math.sin(t) * 0.4 * 2 - 420 * Math.cos(t) * 0.4; t ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); }
  for (let k = 1; k < 6; k++) { const r = 420 * k / 6; g.beginPath(); for (let i = 0; i <= 64; i++) { const a = i / 64 * 6.2832; i ? g.lineTo(r * Math.cos(a), r * Math.sin(a) * 0.4) : g.moveTo(r * Math.cos(a), r * Math.sin(a) * 0.4); } g.stroke(); }
  g.restore();
  const T2 = 69.93, k2 = Math.min(1, Math.max(0, (TT() - T2) / 0.3));                 // « partie » : 69,98 s
  glow(g, 540, 960, 300, k2 > 0 ? "#ff9a3c" : TEAL, 0.35 + 0.25 * k2 * (1 - k2) * 4);
  neon(g, "LA COURONNE", 540, 760, "600 118px Oswald", "#f3e2b0", "rgba(255,220,150,0.7)");
  if (TT() < T2) neon(g, "PARTIE 1", 540, 880, "800 64px Montserrat", "#9fe6df", "rgba(111,224,214,0.7)");
  else { const s = 1 + 0.45 * Math.pow(1 - k2, 3); g.save(); g.translate(540, 858); g.scale(s, s); g.translate(-540, -858);
    neon(g, "PARTIE 2", 540, 880, "800 64px Montserrat", "#FF9A3C", "rgba(255,154,60,0.85)"); g.restore(); }
  finish(g, { bloom: 0.35, grade: ["#06202a", "#f3e2b0", 0.12] });
};
