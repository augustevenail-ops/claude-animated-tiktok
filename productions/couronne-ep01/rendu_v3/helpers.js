function pill(g, txt, x, y, to) {
  g.font = "800 24px Montserrat"; const w = g.measureText(txt).width + 36;
  if (to) { g.strokeStyle = "rgba(240,235,225,0.8)"; g.lineWidth = 2; g.beginPath(); g.moveTo(x, y + 18); g.lineTo(to[0], to[1]); g.stroke(); }
  g.fillStyle = "rgba(20,16,12,0.9)"; g.strokeStyle = "rgba(240,235,225,0.9)"; g.lineWidth = 2.5; g.beginPath(); g.roundRect(x - w / 2, y - 22, w, 44, 22); g.fill(); g.stroke();
  g.fillStyle = "#f3efe6"; g.textAlign = "center"; g.fillText(txt, x, y + 9); g.textAlign = "left";
}
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
function neon(g, txt, x, y, font, col, glow) { g.save(); g.font = font; g.textAlign = "center"; g.shadowColor = glow; g.shadowBlur = 26; g.fillStyle = col; g.fillText(txt, x, y); g.shadowBlur = 8; g.fillText(txt, x, y); g.restore(); }
