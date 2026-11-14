// Fond du carton final « LE MUR » : le labyrinthe vu d'en haut (décor propre à la série), clairière et sirène rouge.
import React from "react";

const C = 13, R = 23, S = 1080 / C, W = 20;            // cellules, taille (px), épaisseur des murs
const CL = { c0: 5, c1: 7, r0: 6, r1: 8 };              // clairière (cellules), centre ≈ (540, 622)

function rng(seed: number) { return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

/** murs droite/bas de chaque cellule (labyrinthe parfait, backtracker), clairière ouverte */
const WALLS = (() => {
  const rnd = rng(1831), right = Array.from({ length: R }, () => Array(C).fill(true)), down = Array.from({ length: R }, () => Array(C).fill(true));
  const seen = Array.from({ length: R }, () => Array(C).fill(false)), st: [number, number][] = [[0, 0]]; seen[0][0] = true;
  while (st.length) {
    const [r, c] = st[st.length - 1];
    const nb = ([[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]] as [number, number][]).filter(([a, b]) => a >= 0 && a < R && b >= 0 && b < C && !seen[a][b]);
    if (!nb.length) { st.pop(); continue; }
    const [a, b] = nb[Math.floor(rnd() * nb.length)];
    if (a === r) right[r][Math.min(b, c)] = false; else down[Math.min(a, r)][c] = false;
    seen[a][b] = true; st.push([a, b]);
  }
  for (let r = CL.r0; r <= CL.r1; r++) for (let c = CL.c0; c <= CL.c1; c++) { if (c < CL.c1) right[r][c] = false; if (r < CL.r1) down[r][c] = false; }
  right[CL.r0 + 1][CL.c0 - 1] = false; right[CL.r0 + 1][CL.c1] = false; down[CL.r0 - 1][CL.c0 + 1] = false; down[CL.r1][CL.c0 + 1] = false;   // 4 entrées
  const seg: [number, number, number, number][] = [];
  for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) {
    if (right[r][c] && c < C - 1) seg.push([(c + 1) * S, r * S, (c + 1) * S, (r + 1) * S]);
    if (down[r][c] && r < R - 1) seg.push([c * S, (r + 1) * S, (c + 1) * S, (r + 1) * S]);
  }
  return seg;
})();

export const MazeTop: React.FC<{ t: number }> = ({ t }) => {
  const z = 1.1 - 0.1 * Math.min(1, t / 2.8);                         // lente descente du drone
  const blink = 0.75 + 0.25 * Math.sin(t * 9);
  const cx = (CL.c0 + 1.5) * S, cy = (CL.r0 + 1.5) * S;
  const line = (dx: number, dy: number, col: string, w: number) => WALLS.map(([x1, y1, x2, y2], i) =>
    <line key={i} x1={x1 + dx} y1={y1 + dy} x2={x2 + dx} y2={y2 + dy} stroke={col} strokeWidth={w} strokeLinecap="square" />);
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", background: "#17140f" }}>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, transform: `scale(${z})`, transformOrigin: `${cx}px ${cy}px` }}>
        <defs>
          <radialGradient id="mzGround" cx="50%" cy="33%" r="75%"><stop offset="0" stopColor="#4a3b29" /><stop offset="0.6" stopColor="#2a2219" /><stop offset="1" stopColor="#14110d" /></radialGradient>
          <radialGradient id="mzRed" cx="50%" cy="50%" r="50%"><stop offset="0" stopColor="rgba(255,60,40,0.55)" /><stop offset="1" stopColor="rgba(255,60,40,0)" /></radialGradient>
        </defs>
        <rect width={1080} height={1920} fill="url(#mzGround)" />
        <rect x={CL.c0 * S + 6} y={CL.r0 * S + 6} width={3 * S - 12} height={3 * S - 12} fill="#5b4a33" opacity={0.7} />
        <g>{line(9, 12, "rgba(0,0,0,0.55)", W + 6)}</g>
        <g>{line(0, 0, "#141210", W + 6)}</g>
        <g>{line(0, 0, "#8a7d69", W)}</g>
        <g>{line(-3, -3, "#a89a82", W * 0.35)}</g>
        <rect x={0} y={0} width={1080} height={1920} fill="none" stroke="#141210" strokeWidth={W * 2} />
        <circle cx={cx} cy={cy} r={260 * blink} fill="url(#mzRed)" />
        <circle cx={cx} cy={cy} r={14} fill="#ff4a3d" stroke="#141210" strokeWidth={5} />
      </svg>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 42%, rgba(0,0,0,0) 30%, rgba(0,0,0,0.55) 75%, rgba(0,0,0,0.85) 100%)" }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 720, height: 420, background: "linear-gradient(rgba(0,0,0,0), rgba(0,0,0,0.55) 30%, rgba(0,0,0,0.55) 70%, rgba(0,0,0,0))" }} />
    </div>
  );
};
