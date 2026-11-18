// ---------- v7 : oiseau qui fonce dans la barrière + flash électrique + chute suivie par la caméra (plan 2),
// salle du Conseil (plan 6), vue aérienne du désert irradié (plan 10) ----------

// plan 2a : vol droit vers la barrière, ailes qui battent, corps aligné sur la trajectoire (aucune rotation parasite)
const B02 = { x0: -90, y0: 720, x1: 540, y1: 1062 }, B02_ROT = Math.atan2(B02.y1 - B02.y0, B02.x1 - B02.x0);
S.p02o2_vol_droit = g => {
  sky(g, [[0, "#05080a"], [0.6, "#0a1418"], [1, "#050607"]]);
  fieldSurface(g, 1500, 420);
  const u = TU(), x = B02.x0 + (B02.x1 - B02.x0) * u, y = B02.y0 + (B02.y1 - B02.y0) * u;
  for (let i = 1; i < 6; i++) { const d = i * 46; g.strokeStyle = rgba("#cfe9e6", 0.22 - i * 0.03); g.lineWidth = 5 - i * 0.6;                // traînées de vitesse derrière l'oiseau
    g.beginPath(); g.moveTo(x - Math.cos(B02_ROT) * (d + 60) - Math.sin(B02_ROT) * (i % 2 ? 14 : -14), y - Math.sin(B02_ROT) * (d + 60) + Math.cos(B02_ROT) * (i % 2 ? 14 : -14));
    g.lineTo(x - Math.cos(B02_ROT) * (d + 160), y - Math.sin(B02_ROT) * (d + 160)); g.stroke(); }
  birdFlap(g, x, y, 1.6, B02_ROT, Math.sin(TT() * 6.2832 * 6));
  hud(g); finish(g, { bloom: 0.3, grade: ["#06202a", "#c8f4ee", 0.16] });
};

// personnages du plan 2 (sans l'oiseau), dessinés dans un calque pour la descente de caméra
function chars02(q) {
  sky(q, [[0, "#070b0d"], [0.6, "#0f1a1e"], [1, "#040506"]]);
  lifeDetails(q, 101); holoDome(q, 101);
  layer(q, r => { r.fillStyle = "#1b1510"; r.fillRect(0, 1700, W, H - 1700); }, { blur: 2 });
  crowdStanding(q);
  actor(q, 790, 2650, 1.8, { ...PERE, body: "#6e2d5e", bodyDark: "#43193a", ring: "#6e2d5e", ringW: 80, torsoW: 165, look: -0.12, arms: [[-1, 10], [1, 10]] }, { rim: "#cfe3ee", rimAng: -1.2, rimW: 7, key: "#dfe9ef", shadow: false, ink: 0 });
  actor(q, 290, 2650, 1.8, { ...HERO, body: "#6e2d5e", bodyDark: "#43193a", ring: "#6e2d5e", ringW: 80, strings: false, torsoW: 165, look: 0.0, arms: [[-1, 10], [1, 10]] }, { rim: TEAL, rimAng: -1.57, rimW: 7, key: "#ffd9a0", shadow: false, ink: 0 });
}
// plan 2b-2d (une seule prise depuis l'impact) : flash blanc + arcs électriques, l'oiseau inerte tombe vite,
// la caméra le suit vers le bas sans montrer les personnages, s'arrête net à leur hauteur, l'oiseau sort du champ par le bas
const DROP = 2600;                                            // distance (px) entre le cadre de l'impact et le cadre des personnages
function fall02(ts) {
  const tf = Math.max(0, ts - 0.10), yb = B02.y1 + 300 * tf + 6000 * tf * tf;     // chute libre très rapide
  const k = Math.min(1, tf / 0.25), ysc = B02.y1 - 260 * k * k * (3 - 2 * k);       // la caméra rattrape l'oiseau puis le garde vers le haut du cadre
  let O = Math.min(DROP, Math.max(0, yb - ysc)), stopped = O >= DROP;
  if (stopped) { const t0 = (() => { let a = 0, b = 2; for (let i = 0; i < 40; i++) { const m = (a + b) / 2, y = B02.y1 + 300 * m + 6000 * m * m, kk = Math.min(1, m / 0.25); (y - (B02.y1 - 260 * kk * kk * (3 - 2 * kk)) >= DROP) ? b = m : a = m; } return b; })();
    const d = tf - t0; O = DROP - 16 * Math.exp(-d * 18) * Math.sin(d * 40); }        // arrêt net, petite secousse amortie
  return { tf, yb, O, stopped };
}
S.b02_choc_chute = g => {
  const ts = TS(), { tf, yb, O, stopped } = fall02(ts), C = mk(W, H), q = C.getContext("2d");
  // 1. ciel commun + barrière (cadre de l'impact) qui file vers le haut
  sky(q, [[0, "#05080a"], [0.6, "#0a1418"], [1, "#070b0d"]]);
  q.save(); q.translate(0, -O); fieldSurface(q, 1500, 420);
  if (ts < 0.45) { const a = Math.max(0, 1 - ts / 0.45); [0, 1, 2, 3].forEach(i => { const r = 40 + ts * 1400 + i * 90; q.save(); q.translate(B02.x1, B02.y1 + 10); q.scale(1, 0.45); hexRing(q, 0, 0, r, "#bff5ef", a * (0.9 - i * 0.2), 5 - i); q.restore(); }); }   // onde du choc
  // façades de district qui défilent sur les côtés pendant la descente
  for (let i = 0; i < 9; i++) { const side = i % 2, x = side ? 850 + rnd(i) * 160 : 40 + rnd(i) * 150, y = 1500 + i * 230, w = 160 + rnd(i * 3) * 120;
    q.fillStyle = "#0b1114"; q.fillRect(x - w / 2, y, w, 900); for (let r = 0; r < 10; r++) for (let c = 0; c < 3; c++) if (rnd(i * 50 + r * 3 + c) < 0.35) { q.fillStyle = rgba("#ffcf7a", 0.55); q.fillRect(x - w / 2 + 20 + c * (w - 40) / 3, y + 40 + r * 80, 18, 26); } }
  q.restore();
  // 2. cadre des personnages, qui monte depuis le bas (haut fondu dans le ciel)
  const top = DROP - O;
  if (top < H) { const P = mk(W, H), pq = P.getContext("2d"); chars02(pq); pq.globalCompositeOperation = "destination-in"; const m = pq.createLinearGradient(0, 0, 0, 700); m.addColorStop(0, "rgba(0,0,0,0)"); m.addColorStop(1, "rgba(0,0,0,1)"); pq.fillStyle = m; pq.fillRect(0, 0, W, H); q.drawImage(P, 0, top); }
  // flou de bougé vertical pendant la descente rapide
  const v = tf > 0 && !stopped ? (300 + 12000 * tf) / 30 : 0;
  if (v > 4) { const n = 5; g.globalAlpha = 1; g.drawImage(C, 0, 0); for (let i = 1; i < n; i++) { g.globalAlpha = 1 / (i + 1); g.drawImage(C, 0, -v * i / n * 0.6); } g.globalAlpha = 1; } else g.drawImage(C, 0, 0);
  // 3. oiseau : collé à la barrière pendant le choc, puis inerte, ailes repliées, tête vers le bas
  const by = yb - O, bx = B02.x1 + tf * 40;
  if (ts < 0.10) birdFlap(g, B02.x1, B02.y1, 1.6, B02_ROT, -0.6);
  else if (by < H + 200) { const kr = Math.min(1, tf / 0.3), rot = B02_ROT + 1.1 * kr * kr * (3 - 2 * kr);
    if (v > 4) for (let i = 1; i < 4; i++) { g.globalAlpha = 0.25 / i; birdFlap(g, bx, by - v * i * 0.5, 1.6, rot, -1); } g.globalAlpha = 1;
    birdFlap(g, bx, by, 1.6, rot, -1); }
  // flash blanc électrique bref et intense + arcs
  if (ts < 0.2) { const fa = ts < 1 / 30 ? 1 : Math.exp(-(ts - 1 / 30) / 0.045); g.fillStyle = rgba("#ffffff", fa); g.fillRect(0, 0, W, H);
    g.save(); g.translate(0, -O); g.lineCap = "round"; g.shadowColor = "#bff5ff"; g.shadowBlur = 24;
    for (let i = 0; i < 9; i++) { const sd = i * 7 + Math.floor(ts * 30) * 13, a0 = rnd(sd) * 6.283; let x = B02.x1, y = B02.y1; g.strokeStyle = rgba(i % 3 ? "#dffaff" : "#8fd8ff", Math.min(1, 1.6 - ts * 7)); g.lineWidth = 4 - (i % 3); g.beginPath(); g.moveTo(x, y);
      for (let s = 0; s < 6; s++) { x += Math.cos(a0) * 45 + (rnd(sd + s) - 0.5) * 70; y += Math.sin(a0) * 30 + (rnd(sd * 3 + s) - 0.5) * 60; g.lineTo(x, y); } g.stroke(); }
    g.restore(); }
  // alarme : démarre quand l'oiseau commence à tomber
  if (ts >= 0.10) { alarmWash(g, 0); alarmAll(g, 540, 600, 0.9, 0); }
  hud(g); finish(g, { bloom: 0.15, grade: ["#000000", "#ffd9a0", 0.0], vig: 0.6 });
};

// ---------- plan 6 : salle du Conseil (le drone entre par la fenêtre) ----------
const ELDERS = [
  { x: 205, hair: "#d8d4ca", beard: "#a9a59d", body: "#1c1c22", glasses: true },
  { x: 372, hair: null, moustache: "#8a867e", body: "#3a1018" },
  { x: 540, hair: "#e6e2d8", beard: "#c4c0b8", body: "#140f12", chief: true },
  { x: 708, hair: "#a8a398", moustache: "#77736b", body: "#2b3036", glasses: true },
  { x: 875, hair: null, beard: "#8f8b84", body: "#2a2026" },
];
function elder(q, e, F, s, o = {}) {
  actor(q, e.x, F, s, { body: e.body, bodyDark: mul(e.body, 0.55), ring: "#d9d2c5", ringW: 60, torsoW: 190, lapels: true, legs_col: "#151518", skin: "#e2d6c8", brows: true,
    hair: e.hair || undefined, hairStyle: e.hair ? "swoosh" : undefined, beard: e.beard, moustache: e.moustache || (e.beard ? mul(e.beard, 0.92) : undefined), glasses: e.glasses, look: o.look || 0,
    arms: [[-1, 12], [1, 12]], ph: e.x * 0.01 }, { rim: "#ffb070", rimAng: -1.4, rimW: 8, key: "#ffd9a0", shadow: false, ink: 0, ...o.fx });
}
function councilRoom(g) {
  const T = TT();
  // mur du fond : boiseries bordeaux, trois hautes fenêtres sur la ville dorée, couronne en or
  sky(g, [[0, "#1a0608"], [0.5, "#2a0a10"], [1, "#12060a"]]);
  for (let i = 0; i < 3; i++) { const x = 150 + i * 300, w = 180;
    g.fillStyle = "#0a1018"; g.beginPath(); g.moveTo(x, 980); g.lineTo(x, 380); g.arc(x + w / 2, 380, w / 2, Math.PI, 0); g.lineTo(x + w, 980); g.closePath(); g.fill();
    g.save(); g.clip(); for (let k = 0; k < 7; k++) { const tx = x + rnd(i * 9 + k) * w, th = 160 + rnd(i * 5 + k) * 420; g.fillStyle = "#14202a"; g.fillRect(tx - 18, 980 - th, 36, th);
      for (let r = 0; r < th / 26; r++) if (rnd(i * 99 + k * 13 + r) < 0.4) { g.fillStyle = rgba("#ffd98a", 0.8); g.fillRect(tx - 10 + (r % 2) * 10, 990 - th + r * 26, 6, 9); } }
    glow(g, x + w / 2, 900, 220, GOLD, 0.25); g.restore();
    g.strokeStyle = "#c9a45a"; g.lineWidth = 6; g.beginPath(); g.moveTo(x, 980); g.lineTo(x, 380); g.arc(x + w / 2, 380, w / 2, Math.PI, 0); g.lineTo(x + w, 980); g.stroke();
    g.lineWidth = 4; g.beginPath(); g.moveTo(x + w / 2, 290); g.lineTo(x + w / 2, 980); g.moveTo(x, 640); g.lineTo(x + w, 640); g.stroke(); }
  for (const x of [105, 405, 675, 975]) { g.fillStyle = "#5a0e1c"; g.fillRect(x - 40, 300, 80, 560); g.fillStyle = "#3e0812"; g.fillRect(x + 10, 300, 30, 560);                // bannières bordeaux
    g.fillStyle = "#c9a45a"; g.beginPath(); g.moveTo(x - 40, 860); g.lineTo(x, 905); g.lineTo(x + 40, 860); g.closePath(); g.fill(); crownIcon(g, x, 520, 0.55); }
  crownIcon(g, 540, 235, 1.1);
  g.fillStyle = "#1e070b"; g.fillRect(0, 980, W, 60); g.fillStyle = "#c9a45a"; g.fillRect(0, 980, W, 5);                                // plinthe
  // sol : tapis rouge en perspective
  const fl = g.createLinearGradient(0, 1040, 0, H); fl.addColorStop(0, "#3a0c12"); fl.addColorStop(1, "#160406"); g.fillStyle = fl; g.fillRect(0, 1040, W, H - 1040);
  g.strokeStyle = "rgba(201,164,90,0.25)"; g.lineWidth = 3; for (let i = -6; i <= 6; i++) { g.beginPath(); g.moveTo(540 + i * 60, 1040); g.lineTo(540 + i * 260, H); g.stroke(); }
  // lustre (balancement léger) et sa lumière
  { const sw = Math.sin(T * 1.3) * 6; g.strokeStyle = "#8a6a2a"; g.lineWidth = 4; g.beginPath(); g.moveTo(540, 0); g.lineTo(540 + sw, 90); g.stroke();
    glow(g, 540 + sw, 150, 520, "#ffd9a0", 0.35); g.fillStyle = "#c9a45a"; g.beginPath(); g.ellipse(540 + sw, 140, 120, 26, 0, 0, 7); g.fill();
    for (let k = 0; k < 9; k++) { const x = 540 + sw - 110 + k * 27.5; g.fillStyle = "#fff2c8"; g.beginPath(); g.arc(x, 120, 7, 0, 7); g.fill(); g.strokeStyle = "rgba(255,240,200,0.6)"; g.lineWidth = 2; g.beginPath(); g.moveTo(x, 150); g.lineTo(x, 185 + (k % 3) * 12); g.stroke(); } }
}
function crownIcon(g, x, y, s) { g.save(); g.translate(x, y); g.scale(s, s); g.fillStyle = "#e0b85a"; g.strokeStyle = "#5a3a10"; g.lineWidth = 4;
  g.beginPath(); g.moveTo(-70, 40); g.lineTo(-80, -30); g.lineTo(-40, 5); g.lineTo(0, -50); g.lineTo(40, 5); g.lineTo(80, -30); g.lineTo(70, 40); g.closePath(); g.fill(); g.stroke();
  g.fillStyle = "#7a1f30"; [-40, 0, 40].forEach(dx => { g.beginPath(); g.arc(dx, 22, 9, 0, 7); g.fill(); }); g.restore(); }
function councilTable(g) {
  const cx = 540, cy = 1330, rx = 430, ry = 165;
  g.fillStyle = "#0c0405"; g.beginPath(); g.ellipse(cx, cy + 26, rx, ry, 0, 0, 7); g.fill();                                            // chant
  const tg = g.createRadialGradient(cx, cy - 60, 20, cx, cy, rx); tg.addColorStop(0, "#5a2414"); tg.addColorStop(1, "#24090a"); g.fillStyle = tg; g.beginPath(); g.ellipse(cx, cy, rx, ry, 0, 0, 7); g.fill();
  g.strokeStyle = "#c9a45a"; g.lineWidth = 6; g.stroke();
  g.fillStyle = "rgba(255,217,160,0.12)"; g.beginPath(); g.ellipse(cx, cy - 40, 220, 50, 0, 0, 7); g.fill();                               // reflet du lustre
  g.fillStyle = "#2a0a0e"; g.beginPath(); g.ellipse(cx, cy, 250, 70, 0, 0, 7); g.fill(); g.strokeStyle = "rgba(201,164,90,0.6)"; g.lineWidth = 3; g.stroke();   // marqueterie
  crownIcon(g, cx, cy - 4, 0.45);
  for (let k = 0; k < 9; k++) { const a = Math.PI * (1.08 + k * 0.105), px = cx + Math.cos(a) * rx * 0.8, py = cy + Math.sin(a) * ry * 0.75;    // dossiers, verres, micros, plaques dorées
    g.save(); g.translate(px, py); g.rotate((rnd(k) - 0.5) * 0.4); g.fillStyle = "#e8dfc8"; g.fillRect(-26, -10, 52, 34); g.restore();
    g.fillStyle = "rgba(220,240,255,0.55)"; g.fillRect(px + 30, py - 18, 10, 22); g.fillStyle = "#c9a45a"; g.fillRect(px - 20, py + 28, 40, 8);
    g.strokeStyle = "#111"; g.lineWidth = 3; g.beginPath(); g.moveTo(px - 34, py + 10); g.lineTo(px - 46, py - 26); g.stroke(); g.fillStyle = "#222"; g.beginPath(); g.arc(px - 46, py - 28, 5, 0, 7); g.fill(); }
}
function nearChair(q, x, y, s, hair, bald) {                    // conseiller de dos au premier plan : dossier en cuir, épaules, arrière du crâne
  q.save(); q.translate(x, y); q.scale(s, s); q.lineJoin = "round";
  q.fillStyle = "#15090b"; q.beginPath(); q.roundRect(-150, -60, 300, 140, 40); q.fill(); q.strokeStyle = INK; q.lineWidth = 8; q.stroke();      // épaules
  q.fillStyle = bald ? "#7a6e64" : "#86796e"; q.beginPath(); q.arc(0, -120, 82, 0, 7); q.fill(); q.stroke();
  if (!bald) { q.fillStyle = hair; q.beginPath(); q.arc(0, -120, 82, Math.PI * 0.85, Math.PI * 2.15); q.fill(); } else { q.fillStyle = hair; q.beginPath(); q.ellipse(0, -80, 80, 30, 0, 0, Math.PI); q.fill(); }
  q.fillStyle = "#5a0e1c"; q.beginPath(); q.roundRect(-190, -10, 380, 330, 50); q.fill(); q.stroke();                                          // dossier
  q.fillStyle = "#c9a45a"; for (let i = 0; i < 7; i++) { q.beginPath(); q.arc(-160 + i * 53, 10, 7, 0, 7); q.fill(); } q.restore(); }
S.k06_conseil = g => {
  const u = TU(), SW = 0.42;
  if (u < SW) { bg3d(g, "d06_conseil"); hud(g, { zone: "CENTRE · TOUR DU CONSEIL" }); fin3d(g); return; }                  // drone qui s'approche de la tour (rendu 3D)
  const v = (u - SW) / (1 - SW), push = 1.16 - 0.1 * (1 - Math.pow(1 - v, 3));        // on entre : la salle se découvre en reculant légèrement
  const C = mk(W, H), q = C.getContext("2d");
  councilRoom(q);
  layer(q, r => { [[105, 1500, 0.5, ELDERS[3], 0.25], [975, 1500, 0.5, ELDERS[1], -0.25]].forEach(([x, F, s, e, lk]) => elder(r, { ...e, x }, F, s, { look: lk })); }, { blur: 1.5 });   // bouts de table
  ELDERS.forEach(e => { const yE = 1330 - 165 * Math.sqrt(Math.max(0, 1 - Math.pow((e.x - 540) / 430, 2))); if (e.chief) { q.fillStyle = "#5a0e1c"; q.beginPath(); q.roundRect(e.x - 120, yE - 380, 240, 360, 60); q.fill(); q.strokeStyle = "#c9a45a"; q.lineWidth = 6; q.stroke(); crownIcon(q, e.x, yE - 330, 0.5); }
    else { q.fillStyle = "#3e0812"; q.beginPath(); q.roundRect(e.x - 95, yE - 300, 190, 280, 50); q.fill(); }
    elder(q, e, yE + 255, e.chief ? 0.58 : 0.53, { look: (540 - e.x) / 1600 }); });
  councilTable(q);
  layer(q, r => { nearChair(r, 260, 1760, 0.95, "#6a665e", false); nearChair(r, 820, 1780, 1.0, "#55524c", true); }, { blur: 6 });
  g.save(); g.translate(W / 2, H / 2); g.scale(push, push); g.translate(-W / 2, -H / 2); g.drawImage(C, 0, 0); g.restore();
  // fenêtre traversée : croisillons et façade qui sortent du cadre (raccord avec la fin du plan 3D)
  if (v < 0.3) { const k = 1 + Math.pow(v / 0.3, 2) * 3.2, a = 1 - v / 0.3, bw = 36 * k, fx = 520 * k, fy = 640 * k;
    g.save(); g.globalAlpha = Math.min(1, a * 1.6); g.fillStyle = "#6e6450";                                                                   // façade autour de la fenêtre
    g.fillRect(0, 0, W, Math.max(0, 960 - fy - bw)); g.fillRect(0, 960 + fy + bw, W, H); g.fillRect(0, 0, Math.max(0, 540 - fx - bw), H); g.fillRect(540 + fx + bw, 0, W, H);
    g.fillStyle = "#14080a"; for (const dx of [-fx, 0, fx]) g.fillRect(540 + dx - bw / 2, 960 - fy - bw / 2, bw, 2 * fy + bw);                // cadre + croisillon en croix
    for (const dy of [-fy, 0, fy]) g.fillRect(540 - fx - bw / 2, 960 + dy - bw / 2, 2 * fx + bw, bw);
    g.globalAlpha = a * 0.5; g.fillStyle = "#ffe0b0"; g.fillRect(0, 0, W, H); g.restore(); }                          // reflet du verre qui s'efface
  if (v > 0.25) { const a = Math.min(1, (v - 0.25) / 0.15), sc = 1 + 0.25 * Math.pow(1 - a, 3); g.save(); g.globalAlpha = a; g.translate(540, 830); g.scale(sc, sc); g.translate(-540, -830);
    holoTag(g, "CONSEIL", 540, 700, [540, 900], "#ffd98a"); g.restore(); }                                           // étiquette au-dessus du président
  hud(g, { zone: "CENTRE · TOUR DU CONSEIL" }); finish(g, { bloom: 0.3, grade: ["#1a0608", "#ffcf9a", 0.12] });
};

// ---------- plan 10 : le drone monte et s'éloigne, le dôme apparaît au milieu du désert irradié ----------
S.g10_aerien = g => {
  bg3d(g, "o10_aerien");
  const u = TU(), low = Math.max(0, 1 - u / 0.35);
  if (low > 0) layer(g, q => { for (let i = 0; i < 12; i++) { const x = ((rnd(i * 5) * W + TT() * (30 + i * 4)) % (W + 400)) - 200, y = 1500 + rnd(i * 9) * 500 + u * 900, r = 260 + rnd(i) * 200;
    const gr = q.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, rgba("#c9d65a", 0.5 * low)); gr.addColorStop(1, rgba("#3e4616", 0)); q.fillStyle = gr; q.fillRect(x - r, y - r, 2 * r, 2 * r); } }, { blur: 10 });   // gaz au ras du sol, qui reste en bas quand on monte
  dust(g, 120, "#e8f09a", 0, 1900, 63, 2.2);
  hud(g, { zone: "HORS DU DÔME", label: "AIR", value: "TOXIQUE", valueRed: true }); finish(g, { bloom: 0.25, grade: ["#141a04", "#e8ec9a", 0.12] });
};
