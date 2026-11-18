// Scènes de contrôle : monde, personnages en positions, cadre avec HUD et sous-titres (palette du bible + PDF)
const W = 1080, H = 1920;
const ORANGE = "#FF9A3C", RED = "#E8453C", TEAL = "#3f8f8a", STEEL = "#4A6A8A", INKC = "#1A1816";
function vignette(g) {
  const v = g.createRadialGradient(W / 2, H / 2, H * 0.25, W / 2, H / 2, H * 0.75);
  v.addColorStop(0, "rgba(0,0,0,0)"); v.addColorStop(1, "rgba(0,0,0,0.75)");
  g.fillStyle = v; g.fillRect(0, 0, W, H);
}
function room(g, top, bot, lampX) {
  const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, top); bg.addColorStop(1, bot);
  g.fillStyle = bg; g.fillRect(0, 0, W, H);
  const lamp = g.createRadialGradient(lampX, 120, 40, lampX, 120, 900);
  lamp.addColorStop(0, "rgba(255,226,170,0.35)"); lampX !== null && (lamp.addColorStop(1, "rgba(0,0,0,0)"), g.fillStyle = lamp, g.fillRect(0, 0, W, H));
}
function hud(g, clock, places) {
  g.font = "bold 30px Arial, sans-serif"; g.fillStyle = RED; g.fillText("★ ÉPISODE 1", 60, 110);
  g.fillStyle = "#fff"; g.font = "900 64px Arial, sans-serif"; g.fillText(clock, 60, 190);
  g.font = "900 96px Arial, sans-serif"; g.textAlign = "right"; g.fillStyle = RED; g.fillText("72 H", W - 60, 200); g.textAlign = "left";
}
function caption(g, words, active) {                 // mots : tableau ; active : index du mot prononcé (orange)
  g.font = "900 60px Arial, sans-serif"; const gap = 16;
  const widths = words.map(w => g.measureText(w).width); const total = widths.reduce((a, b) => a + b, 0) + gap * (words.length - 1);
  let x = (W - total) / 2; const y = 1640;
  g.fillStyle = "rgba(10,8,6,0.72)"; g.beginPath(); g.roundRect(x - 40, y - 96, total + 80, 130, 65); g.fill();
  words.forEach((w, i) => { g.fillStyle = i === active ? ORANGE : "#fff"; g.fillText(w, x, y); x += widths[i] + gap; });
}
function floor(g, y, col) { g.fillStyle = col; g.fillRect(0, y, W, H - y); }
function hexWall(g, cx, cy, r, col, lw = 14) {
  g.beginPath(); for (let i = 0; i < 6; i++) { const a = Math.PI / 3 * i + Math.PI / 6; const x = cx + r * Math.cos(a), y = cy + r * Math.sin(a); i ? g.lineTo(x, y) : g.moveTo(x, y); }
  g.closePath(); g.strokeStyle = col; g.lineWidth = lw; g.stroke();
}
function hexFill(g, cx, cy, r, col) { g.beginPath(); for (let i = 0; i < 6; i++) { const a = Math.PI / 3 * i + Math.PI / 6; const x = cx + r * Math.cos(a), y = cy + r * Math.sin(a); i ? g.lineTo(x, y) : g.moveTo(x, y); } g.closePath(); g.fillStyle = col; g.fill(); }
function towers(g, x0, y0, n, s) {
  for (let i = 0; i < n; i++) { const h = (160 + (i * 73) % 180) * s, w = 46 * s, x = x0 + i * 62 * s;
    g.fillStyle = i % 2 ? "#f1e3b3" : "#e5c778"; g.strokeStyle = INKC; g.lineWidth = 6; g.fillRect(x, y0 - h, w, h); g.strokeRect(x, y0 - h, w, h);
    g.fillStyle = "#d9b35c"; g.fillRect(x - 6 * s, y0 - h - 22 * s, w + 12 * s, 22 * s); }
}
const SCENES = {};
SCENES.world_dome_aerial = g => {                                    // vue aérienne : dôme, centre, districts
  const sky = g.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, "#2e2620"); sky.addColorStop(0.5, "#8a6a4a"); sky.addColorStop(1, "#4a3a2c");
  g.fillStyle = sky; g.fillRect(0, 0, W, H);
  g.fillStyle = "#7c6a55"; g.fillRect(0, 1180, W, H - 1180);                         // désert
  // districts : grille de blocs autour du centre
  for (let r = 0; r < 4; r++) for (let c = 0; c < 6; c++) { const x = 90 + c * 160, y = 1000 + r * 110; g.fillStyle = (r + c) % 3 ? "#5f5850" : "#4b443d"; g.fillRect(x, y, 120, 80); }
  // dôme holographique
  hexFill(g, W / 2, 900, 470, "rgba(120,200,210,0.10)"); hexWall(g, W / 2, 900, 470, "rgba(150,220,230,0.85)", 10);
  hexWall(g, W / 2, 900, 470 * 1.02, "rgba(150,220,230,0.25)", 26);
  // second mur hexagonal et centre
  hexWall(g, W / 2, 900, 230, "#1A1816", 22); hexFill(g, W / 2, 900, 226, "#3e6b50");
  towers(g, W / 2 - 150, 1040, 6, 0.6);
  g.fillStyle = "rgba(60,110,80,0.9)"; g.fillRect(W / 2 - 200, 960, 400, 14);
  g.font = "bold 34px Arial"; g.fillStyle = "#fff"; g.textAlign = "center"; g.fillText("CENTRE", W / 2, 760); g.fillText("DISTRICTS", W / 2, 1640); g.textAlign = "left";
  vignette(g); hud(g, "17:40", "4 112");
};
SCENES.world_centre_gate = g => {                                    // au niveau du sol : mur hexagonal, tours dorées
  room(g, "#7e8f9a", "#2e3a40", null);
  g.fillStyle = "#4e6a58"; g.fillRect(0, 1180, W, 740);
  towers(g, 80, 1120, 9, 1.1);
  g.fillStyle = "#2b2b2b"; g.fillRect(0, 1120, W, 60);                 // second mur
  g.fillStyle = "rgba(160,230,235,0.2)"; g.fillRect(0, 0, W, 1000);
  vignette(g); hud(g, "17:41", "4 112");
};
SCENES.world_district_street = g => {                              // district : grille, foule grise et brune
  room(g, "#3a332c", "#120e0b", W / 2);
  g.fillStyle = "#5a524a"; g.fillRect(0, 1260, W, 300);
  for (let i = 0; i < 6; i++) { g.fillStyle = "#6b645c"; g.fillRect(40 + i * 180, 540, 140, 360); }
  g.strokeStyle = "#8f877c"; g.lineWidth = 8; for (let x = 0; x <= W; x += 90) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 1400); g.stroke(); }
  crowdRow(g, 1640, W, 26, 2, ["#4d4640", "#6a5a48", "#5f5a55", "#3d3832"]);
  figure(g, [W / 2, 1640], 760, { jacket: "#4A6A8A", pants: "#2b3440", headDx: 0, hair: "#1d1a17", face: "#e8e4dc" });
  vignette(g); hud(g, "17:42", "4 112");
};
SCENES.hero_front = g => { room(g, "#3a2f27", "#120e0b", W / 2); floor(g, 1700, "#241d18");
  figure(g, [W / 2, 1700], 980, { jacket: STEEL, hood: STEEL, hair: "#1d1a17", pants: "#2b3440", shoes: INKC, face: "#f0ece4", zip: true });
  vignette(g); hud(g, "17:40", "4 112"); };
SCENES.hero_look_back = g => { room(g, "#3a2f27", "#120e0b", W / 2); floor(g, 1700, "#241d18");
  figure(g, [W / 2, 1700], 980, { jacket: STEEL, hood: STEEL, hair: "#1d1a17", pants: "#2b3440", shoes: INKC, face: "#f0ece4", headDx: 14, arms: { l: [-14, 6], r: [14, 30] } });
  vignette(g); hud(g, "17:40", "4 112"); };
SCENES.hero_walk = g => { room(g, "#3a2f27", "#120e0b", W / 2); floor(g, 1700, "#241d18");
  figure(g, [W / 2, 1700], 980, { jacket: STEEL, hood: STEEL, hair: "#1d1a17", pants: "#2b3440", shoes: INKC, face: "#f0ece4", legs: { l: [-18, -4], r: [22, 6] }, arms: { l: [22, 14, 0], r: [-22, 14, 0] } });
  vignette(g); hud(g, "17:42", "4 112"); };
SCENES.father_whisper = g => { room(g, "#3a2f27", "#120e0b", W / 2); floor(g, 1700, "#241d18");
  figure(g, [W / 2, 1700], 980, { jacket: STEEL, pants: "#3a3f4a", shoes: INKC, face: "#efe9df", hair: "#b8b8b8", glasses: true, moustache: "#9b9b9b", handAtMouth: "r", arms: { l: [-14, 4, 0], r: [-20, 150, 0] } });
  vignette(g); hud(g, "17:44", "4 113"); };
SCENES.father_escorted = g => { room(g, "#3a2f27", "#120e0b", W / 2); floor(g, 1700, "#241d18");
  figure(g, [W * 0.4, 1700], 960, { jacket: STEEL, pants: "#3a3f4a", shoes: INKC, face: "#efe9df", hair: "#b8b8b8", glasses: true, moustache: "#9b9b9b", headDx: -6 });
  figure(g, [W * 0.66, 1700], 1020, { jacket: "#B8BEC4", pants: "#7d848c", shoes: INKC, helmet: "#1E1E1E", face: "#dedede", visorGlow: true, belt: "#2a2a2a", arms: { l: [-20, 6], r: [16, 14] } });
  vignette(g); hud(g, "17:46", "4 113"); };
SCENES.guard = g => { room(g, "#3a3a3a", "#141414", W / 2); floor(g, 1700, "#252525");
  figure(g, [W / 2, 1700], 1040, { jacket: "#B8BEC4", pants: "#7d848c", shoes: INKC, helmet: "#1E1E1E", face: "#dedede", visorGlow: true, belt: "#2a2a2a" });
  vignette(g); hud(g, "17:46", "4 113"); };
SCENES.radio_porte_parole = g => { room(g, "#2a1a1e", "#0f0a0b", W / 2); floor(g, 1700, "#1c1214");
  g.fillStyle = "#3b2a2e"; g.fillRect(W / 2 - 230, 980, 460, 260); g.strokeStyle = INKC; g.lineWidth = 10; g.strokeRect(W / 2 - 230, 980, 460, 260);
  g.fillStyle = "#1a1416"; g.beginPath(); g.arc(W / 2 - 60, 1110, 90, 0, 7); g.fill(); g.strokeStyle = "#6a5a5e"; g.lineWidth = 6; g.stroke();
  figure(g, [W / 2, 1700], 1000, { jacket: "#6e1f2e", pants: "#2a1a1e", shoes: INKC, hair: "#2b2b2b", face: "#efe9df", glasses: true, arms: { l: [-18, 2], r: [18, 6] } });
  vignette(g); hud(g, "17:55", "4 113"); };
SCENES.crowd_back = g => { room(g, "#2a231d", "#0d0a08", W / 2); crowdRow(g, 1500, W, 22, 5, ["#4d4640", "#3a342e", "#5b4e44", "#2b2622"]); floor(g, 1500, "#0d0a08");
  vignette(g); hud(g, "17:44", "4 113"); };
SCENES.frame_sample = g => { room(g, "#3a2f27", "#120e0b", W / 2); floor(g, 1700, "#241d18");
  figure(g, [W / 2, 1700], 980, { jacket: STEEL, hood: STEEL, hair: "#1d1a17", pants: "#2b3440", shoes: INKC, face: "#f0ece4", zip: true });
  vignette(g); hud(g, "17:40", "4 112"); caption(g, ["TU", "RÉVÈLES", "CE", "QUE", "TU", "SAIS"], 1); };
window.SCENES = SCENES;
