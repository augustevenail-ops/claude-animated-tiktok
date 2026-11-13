// Habillage commun des séries (décision utilisateur du 2026-11-13, d'après ses images de référence) :
// sous-titres gros, police grasse arrondie (Montserrat 900), contour noir fin + ombre douce, TOUT EN BLANC ;
// compteurs en haut (épisode + étage à gauche, compteur de l'épisode à droite) ; grandes cartes de choix A/B ;
// carton final (titre de la série + numéro d'épisode) pendant les ~2 dernières secondes.
import React, { useEffect, useState } from "react";
import { continueRender, delayRender, staticFile } from "remotion";

const FONTS: [string, string, string][] = [
  ["Montserrat", "fonts/montserrat-latin-900-normal.woff2", "900"], ["Montserrat", "fonts/montserrat-latin-ext-900-normal.woff2", "900"],
  ["Montserrat", "fonts/montserrat-latin-800-normal.woff2", "800"], ["Montserrat", "fonts/montserrat-latin-ext-800-normal.woff2", "800"],
  ["Bebas Neue", "fonts/bebas-neue-latin-400-normal.woff2", "400"],
];
let fontsReady: Promise<void> | null = null;
export const useFonts = () => {
  const [h] = useState(() => delayRender("polices"));
  useEffect(() => {
    fontsReady ??= Promise.all(FONTS.map(([fam, url, w]) => new FontFace(fam, `url(${staticFile(url)})`, { weight: w }).load().then((ff) => { (document.fonts as unknown as { add: (f: FontFace) => void }).add(ff); }))).then(() => undefined);
    fontsReady.then(() => continueRender(h)).catch(() => continueRender(h));
  }, [h]);
};
const MONT = "'Montserrat', 'Liberation Sans', sans-serif", BEBAS = "'Bebas Neue', 'Liberation Sans Narrow', sans-serif";

// ---------------- sous-titres ----------------
export type Word = { w: string; s: number; e: number; q?: number };
const clean = (w: string) => w.replace(/[«»"“”]/g, "").replace(/\.\.\.|…/g, "").replace(/[.,:;!?]+$/g, "").toUpperCase();
export const captionGroups = (words: Word[]) => {
  const out: { s: number; e: number; text: string }[] = []; let cur: Word[] = [];
  const flush = () => { if (cur.length) out.push({ s: cur[0].s, e: cur[cur.length - 1].e, text: cur.map((x) => clean(x.w)).join(" ") }); cur = []; };
  for (const w of words) {
    if (w.q) flush();
    cur.push(w);
    const len = cur.map((x) => clean(x.w)).join(" ").length;
    if (/[.,:;!?…»]$|\.\.\.$/.test(w.w) || cur.length >= 3 || len > 13) flush();
  }
  flush();
  for (let i = 0; i < out.length - 1; i++) out[i].e = Math.min(out[i + 1].s, out[i].e + 0.6);
  return out;
};
export const Captions: React.FC<{ t: number; groups: { s: number; e: number; text: string }[] }> = ({ t, groups }) => {
  const g = groups.find((x) => t >= x.s - 0.03 && t < x.e);
  if (!g) return null;
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: "64%", transform: "translateY(-50%)", textAlign: "center", padding: "0 120px" }}>
      <span style={{ fontFamily: MONT, fontWeight: 900, fontSize: 84, lineHeight: 1.05, letterSpacing: 0.5, color: "#ffffff",
        WebkitTextStroke: "5px #0b0b0d", paintOrder: "stroke fill", textShadow: "0 5px 12px rgba(0,0,0,0.65), 0 0 2px rgba(0,0,0,0.9)" }}>{g.text}</span>
    </div>
  );
};

// ---------------- compteurs du haut ----------------
// marges latérales de 120 px : TikTok remplit les écrans 19,5:9 en rognant ~9 % de chaque côté (retour utilisateur 2026-11-13)
export const Hud: React.FC<{ episode: number; place: string; of?: string; label: string; count: number; alert?: boolean }> = ({ episode, place, of, label, count, alert }) => (
  <>
    <div style={{ position: "absolute", left: 120, top: 150, color: "#fff", textShadow: "0 3px 8px rgba(0,0,0,0.7)" }}>
      <div style={{ fontFamily: MONT, fontWeight: 800, fontSize: 25, letterSpacing: 3.5, opacity: 0.92 }}>● ÉPISODE {episode}</div>
      <div style={{ fontFamily: BEBAS, fontSize: 104, lineHeight: 0.95, marginTop: 2 }}>{place}{of ? <span style={{ fontSize: 46, color: "#c9d2e6", marginLeft: 12 }}>/ {of}</span> : null}</div>
    </div>
    <div style={{ position: "absolute", right: 120, top: 150, textAlign: "right", textShadow: "0 3px 8px rgba(0,0,0,0.7)" }}>
      <div style={{ fontFamily: MONT, fontWeight: 800, fontSize: 25, letterSpacing: 3.5, color: alert ? "#ffb0a6" : "#dfe6f2" }}>{label}</div>
      <div style={{ fontFamily: BEBAS, fontSize: 104, lineHeight: 0.95, marginTop: 2, color: alert ? "#ff5a48" : "#ffffff" }}>{count}</div>
    </div>
  </>
);

// ---------------- cartes de choix ----------------
const Card: React.FC<{ tag: string; text: string; top: string; bot: string; edge: string; glow: string; x: number; k: number }> = ({ tag, text, top, bot, edge, glow, x, k }) => (
  <div style={{ position: "absolute", left: x, top: 455, width: 410, height: 290, borderRadius: 26, background: `linear-gradient(180deg, ${top} 0%, ${bot} 100%)`,
    border: `5px solid ${edge}`, boxShadow: `0 0 34px ${glow}, inset 0 2px 0 rgba(255,255,255,0.25)`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
    transform: `scale(${0.85 + 0.15 * k})`, opacity: k }}>
    <div style={{ fontFamily: MONT, fontWeight: 800, fontSize: 30, letterSpacing: 6, color: "rgba(255,255,255,0.8)", marginBottom: 6 }}>{tag}</div>
    <div style={{ fontFamily: MONT, fontWeight: 900, fontSize: 62, lineHeight: 1.06, color: "#fff", textAlign: "center", padding: "0 14px", textShadow: "0 4px 10px rgba(0,0,0,0.45)" }}>{text}</div>
  </div>
);
export const ChoiceCards: React.FC<{ t: number; at: number; a: string; b: string }> = ({ t, at, a, b }) => {
  if (t < at) return null;
  const ka = Math.min(1, (t - at) / 0.25), kb = Math.min(1, (t - at - 0.15) / 0.25);
  return (<>
    <Card tag="A" text={a} top="#2f8a5e" bot="#15422d" edge="#9af5bd" glow="rgba(120,255,170,0.55)" x={120} k={Math.max(0, ka)} />
    <Card tag="B" text={b} top="#9a3030" bot="#4a1414" edge="#ff9a8a" glow="rgba(255,90,70,0.5)" x={550} k={Math.max(0, kb)} />
  </>);
};

// ---------------- carton final ----------------
export const TITLE_DUR = 2.8;
/** instant (après le début du carton) où « ÉPISODE N » devient « ÉPISODE N+1 » en rouge, calé sur le mot « épisode » de la phrase de fin */
export const FLIP_AFTER = 0.9;
export const TitleCard: React.FC<{ t: number; at: number; title: string; episode: number }> = ({ t, at, title, episode }) => {
  if (t < at) return null;
  const k = Math.min(1, (t - at) / 0.2);
  const cells: React.ReactNode[] = [];
  for (let r = 0; r < 18; r++) for (let c = 0; c < 9; c++) { const h = Math.sin((r * 9 + c) * 127.1) * 43758.5453 % 1;
    cells.push(<div key={`${r}-${c}`} style={{ position: "absolute", left: 18 + c * 118, top: 20 + r * 108, width: 54, height: 66, background: `rgba(0,0,0,${0.18 + Math.abs(h) * 0.22})` }} />); }
  return (
    <div style={{ position: "absolute", inset: 0, opacity: k, background: "radial-gradient(ellipse at 50% 40%, #2b3038 0%, #181b21 55%, #101216 100%)" }}>
      {cells}
      <div style={{ position: "absolute", left: 513, top: 640, width: 54, height: 66, background: "#8ff0b0", boxShadow: "0 0 60px 30px rgba(110,240,160,0.35), 0 0 12px rgba(200,255,220,0.9)" }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 760, textAlign: "center", fontFamily: BEBAS, fontSize: 250, lineHeight: 1, color: "#ece6da", letterSpacing: 2,
        textShadow: "0 8px 0 rgba(0,0,0,0.35), 0 12px 30px rgba(0,0,0,0.6)" }}>{title}</div>
      {(() => { const fl = t - at - FLIP_AFTER, on = fl >= 0, pop = on ? 1 + 0.18 * Math.exp(-fl * 9) : 1;
        return <div style={{ position: "absolute", left: 0, right: 0, top: 1030, textAlign: "center", fontFamily: MONT, fontWeight: 800, fontSize: 52, letterSpacing: 16,
          color: on ? "#ff4a3d" : "#b9bdd8", transform: `scale(${pop})`, textShadow: on ? "0 0 24px rgba(255,74,61,0.55)" : "none" }}>ÉPISODE {on ? episode + 1 : episode}</div>; })()}
    </div>
  );
};
