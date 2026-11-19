// Habillage « Le Puits » au style VIDEO_01 (docs/STYLE_VIDEO01.md) : HUD (heure en grand, compteur à droite, petits libellés rouges),
// volet noir haut/bas en fin de plan, question finale en haut avec deux pastilles, carton final sombre avec schéma filaire du puits.
import React from "react";
const MONT = "'Montserrat', 'Liberation Sans', sans-serif", BEBAS = "'Bebas Neue', 'Liberation Sans Narrow', sans-serif";
const RED = "#e0483a", SH = "0 3px 10px rgba(0,0,0,0.75)";

export const PuitsHud: React.FC<{ clock: string; place: string; label: string; count: string; total?: string; alert?: boolean }> = ({ clock, place, label, count, total, alert }) => (
  <>
    <div style={{ position: "absolute", left: 130, top: 210, color: "#f2ece2", textShadow: SH }}>
      <div style={{ fontFamily: MONT, fontWeight: 800, fontSize: 19, letterSpacing: 3, color: RED }}>● ÉPISODE 1</div>
      <div style={{ fontFamily: BEBAS, fontSize: 92, lineHeight: 0.95, marginTop: 4 }}>{clock}</div>
      <div style={{ fontFamily: MONT, fontWeight: 700, fontSize: 15, letterSpacing: 3, color: "rgba(220,210,195,0.55)", marginTop: 2 }}>{place}</div>
    </div>
    <div style={{ position: "absolute", right: 130, top: 210, textAlign: "right", textShadow: SH }}>
      <div style={{ fontFamily: MONT, fontWeight: 800, fontSize: 19, letterSpacing: 3, color: RED }}>{label}</div>
      <div style={{ fontFamily: BEBAS, fontSize: 92, lineHeight: 0.95, marginTop: 4, color: "#f2ece2" }}>
        <span style={{ color: alert ? RED : "#f2ece2" }}>{count}</span>{total ? <span style={{ color: "#f2ece2" }}> / {total}</span> : null}</div>
    </div>
  </>
);

/** fin de chaque plan (VIDEO_01) : image -4 = tiers haut et bas noirs, puis 0,1 s (3 images) de noir complet */
export const BarWipe: React.FC<{ f: number; ends: number[] }> = ({ f, ends }) => {
  const e = ends.find((b) => f >= b - 4 && f < b); if (e === undefined) return null;
  if (f >= e - 3) return <div style={{ position: "absolute", inset: 0, background: "#000" }} />;
  return <><div style={{ position: "absolute", left: 0, right: 0, top: 0, height: "34%", background: "#000" }} /><div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: "34%", background: "#000" }} /></>;
};

const Pill: React.FC<{ text: string; col: string; k: number }> = ({ text, col, k }) => (
  <div style={{ display: "inline-block", margin: "0 10px", padding: "8px 22px", borderRadius: 40, border: `3px solid ${col}`, background: "rgba(10,8,6,0.72)", color: col === "#f2ece2" ? "#f2ece2" : RED,
    fontFamily: MONT, fontWeight: 900, fontSize: 30, letterSpacing: 2, opacity: k, transform: `scale(${0.85 + 0.15 * k})` }}>{text}</div>
);
/** question finale en haut (Bebas) + pastilles A / B qui apparaissent sur les mots */
export const Question: React.FC<{ t: number; at: number; q: string[]; a: string; b: string; ta: number; tb: number }> = ({ t, at, q, a, b, ta, tb }) => {
  if (t < at) return null;
  const k = Math.min(1, (t - at) / 0.25), ka = Math.max(0, Math.min(1, (t - ta) / 0.2)), kb = Math.max(0, Math.min(1, (t - tb) / 0.2));
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 420, textAlign: "center", opacity: k }}>
      {q.map((l, i) => <div key={i} style={{ fontFamily: BEBAS, fontSize: 96, lineHeight: 1.0, color: "#f2ece2", textShadow: "0 4px 14px rgba(0,0,0,0.85)" }}>{l}</div>)}
      <div style={{ marginTop: 26 }}><Pill text={a} col="#f2ece2" k={ka} /><Pill text={b} col={RED} k={kb} /></div>
    </div>
  );
};

/** carton final : fond brun-noir, puits en fil de fer (anneaux concentriques en perspective, point rouge au fond), titre, épisode, compteur, ABONNE-TOI */
export const PuitsTitle: React.FC<{ t: number; at: number; title: string; count: string }> = ({ t, at, title, count }) => {
  if (t < at) return null;
  const u = t - at, k = Math.min(1, u / 0.25), rings = Array.from({ length: 16 }, (_, i) => i);
  return (
    <div style={{ position: "absolute", inset: 0, opacity: k, background: "radial-gradient(ellipse at 50% 55%, #2a221a 0%, #15110d 55%, #080706 100%)" }}>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, transform: `scale(${1.06 - 0.04 * Math.min(1, u / 2.8)})`, transformOrigin: "540px 1150px" }}>
        {rings.map((i) => { const z = i / 15, y = 900 + 620 * z, rx = 330 * (1 - 0.78 * z), ry = 70 * (1 - 0.78 * z);
          return <ellipse key={i} cx={540} cy={y} rx={rx} ry={ry} fill="none" stroke="#a8784a" strokeOpacity={0.55 - 0.3 * z} strokeWidth={2} />; })}
        {Array.from({ length: 12 }, (_, i) => { const a = (i / 12) * Math.PI * 2; return <line key={i} x1={540 + 330 * Math.cos(a)} y1={900 + 70 * Math.sin(a)} x2={540 + 73 * Math.cos(a)} y2={1520 + 15 * Math.sin(a)} stroke="#a8784a" strokeOpacity={0.35} strokeWidth={1.5} />; })}
        <circle cx={540} cy={1520} r={7} fill="#ff3a2a" /><circle cx={540} cy={1520} r={26} fill="#ff3a2a" opacity={0.25 + 0.15 * Math.sin(u * 5)} />
      </svg>
      <div style={{ position: "absolute", left: 0, right: 0, top: 360, textAlign: "center", fontFamily: BEBAS, color: "#f2ece2", textShadow: "0 0 30px rgba(255,235,200,0.45)" }}>
        <div style={{ fontSize: 96, letterSpacing: 2 }}>{title}</div>
        <div style={{ fontSize: 210, lineHeight: 0.9 }}>ÉPISODE 1</div>
        <div style={{ fontFamily: MONT, fontWeight: 800, fontSize: 26, letterSpacing: 6, marginTop: 18, opacity: 0.75, textShadow: "none" }}>{count}</div>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 1640, textAlign: "center" }}>
        <div style={{ display: "inline-block", padding: "10px 30px", borderRadius: 40, border: `3px solid ${RED}`, color: "#f2ece2", fontFamily: MONT, fontWeight: 900, fontSize: 30, letterSpacing: 3, background: "rgba(10,8,6,0.6)" }}>ABONNE-TOI</div>
      </div>
    </div>
  );
};
