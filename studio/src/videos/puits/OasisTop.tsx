// Fond du carton final « LE PUITS » : l'oasis vue du ciel la nuit (décor propre à la série) : anneaux de maisons aux lanternes,
// rues rayonnantes, palmeraie sombre, canaux turquoise, et le puits au centre comme un œil noir cerclé de lueur ; lente descente.
import React from "react";

const hash = (i: number, s = 0) => { const v = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return v - Math.floor(v); };
const CX = 540, CY = 640;
const DOTS = (() => { const out: { x: number; y: number; r: number; o: number }[] = [];
  for (let k = 0; k < 900; k++) { const a = hash(k, 1) * Math.PI * 2, d = 110 + Math.sqrt(hash(k, 2)) * 440, sa = Math.round(a / (Math.PI / 4)) * (Math.PI / 4);
    if (Math.abs(d * Math.sin(a - sa)) < 16) continue;
    out.push({ x: CX + d * Math.sin(a), y: CY + d * Math.cos(a) * 0.92, r: 2 + hash(k, 3) * 3.5, o: 0.35 + hash(k, 4) * 0.65 }); }
  return out; })();

export const OasisTop: React.FC<{ t: number }> = ({ t }) => {
  const s = 1.18 - 0.1 * Math.min(1, t / 2.8);
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", background: "radial-gradient(ellipse at 50% 34%, #3a1c2a 0%, #1a0e1c 50%, #090610 100%)" }}>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, transform: `scale(${s})`, transformOrigin: `${CX}px ${CY}px` }}>
        <defs>
          <radialGradient id="well" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#000" /><stop offset="62%" stopColor="#020606" /><stop offset="80%" stopColor="#1fb0a0" stopOpacity="0.55" /><stop offset="100%" stopColor="#1fb0a0" stopOpacity="0" /></radialGradient>
          <radialGradient id="city" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#6a3a2a" /><stop offset="70%" stopColor="#3a2026" /><stop offset="100%" stopColor="#1a1018" /></radialGradient>
        </defs>
        <ellipse cx={CX} cy={CY} rx={640} ry={590} fill="#0f2418" />
        <ellipse cx={CX} cy={CY} rx={600} ry={552} fill="none" stroke="#1fb0a8" strokeWidth={5} opacity={0.7} />
        <ellipse cx={CX} cy={CY} rx={560} ry={516} fill="url(#city)" />
        {Array.from({ length: 8 }, (_, k) => { const a = k * Math.PI / 4; return <line key={k} x1={CX} y1={CY} x2={CX + 560 * Math.sin(a)} y2={CY + 516 * Math.cos(a)} stroke="#140a10" strokeWidth={22} />; })}
        {DOTS.map((d, i) => <circle key={i} cx={d.x} cy={d.y} r={d.r} fill="#ffb24a" opacity={d.o * (0.8 + 0.2 * Math.sin(t * 3 + i))} />)}
        <circle cx={CX} cy={CY} r={96} fill="#5a3a2a" opacity={0.85} />
        <circle cx={CX} cy={CY} r={58} fill="url(#well)" />
      </svg>
    </div>
  );
};
