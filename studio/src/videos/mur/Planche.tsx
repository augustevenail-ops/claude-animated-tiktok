// Planche de validation des personnages du « Mur » (dessinés avec le même code que la vidéo) : les Longs dans leurs poses, toi, les jeunes.
import React, { useEffect, useRef } from "react";
import { AbsoluteFill, continueRender, delayRender } from "remotion";
import { Pen } from "../bridge/toon";
import { drawLong, LongSpec } from "./longs";
import { drawChar, CharSpec } from "../shared/chars";

const Y: Partial<CharSpec> = { jacket: "#2b3f93", pants: "#2a2f4a", shoes: "#16151c", hair: "side", hairColor: "#5a3a26", hood: true };
const KIDS: Partial<CharSpec>[] = [
  { jacket: "#3f6f5a", pants: "#2e3040", shoes: "#1b1a22", hair: "short", hairColor: "#24201f" }, { jacket: "#a0522d", pants: "#2e3040", shoes: "#1b1a22", hair: "short", hairColor: "#6a4630" },
  { jacket: "#5b4f8a", pants: "#34304a", shoes: "#1b1a22", hair: "long", hairColor: "#c9c3b8" }, { jacket: "#8a3b4f", pants: "#3a3348", shoes: "#1b1a22", hair: "long", hairColor: "#3b2a24" },
];
export const MurPlanche: React.FC = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const h = delayRender("planche"); const g = ref.current!.getContext("2d")!;
    g.fillStyle = "#1a1d2a"; g.fillRect(0, 0, 1080, 1920);
    g.fillStyle = "#e9e6dc"; g.font = "bold 44px DejaVu Sans"; g.textAlign = "center"; g.fillText("LE MUR — PERSONNAGES", 540, 70);
    g.font = "bold 24px DejaVu Sans";
    const longs: [string, LongSpec][] = [["DEBOUT", { pose: "stand" }], ["MARCHE", { pose: "walk", step: 0.25 }], ["PENCHÉ", { pose: "lean", turn: 0.3 }], ["SE DÉPLIE", { pose: "crouch", unfold: 0.45 }], ["RECROQUEVILLÉ", { pose: "crouch", unfold: 0 }], ["TÊTE TOURNÉE", { pose: "stand", turn: 0.8 }]];
    longs.forEach(([lab, s], i) => {
      const x = (i % 3) * 360, y = 100 + Math.floor(i / 3) * 620; g.save(); g.translate(x + 30, y); g.scale(0.5, 0.58); drawLong(new Pen(g), s); g.restore();
      g.fillStyle = "#e9e6dc"; g.fillText(lab, x + 180, y + 600);
    });
    // échelle : un jeune à côté d'un Long debout
    g.fillStyle = "#a9adbf"; g.fillText("ÉCHELLE : UN LONG ≈ 5 PERSONNAGES", 540, 1370);
    g.save(); g.translate(40, 1380); g.scale(0.26, 0.5); drawLong(new Pen(g), { pose: "stand" }); g.restore();
    g.save(); g.translate(170, 1380 + 500 - 100); g.scale(0.052, 0.1); drawChar(new Pen(g), { ...(KIDS[0] as CharSpec), mode: "stand", expr: "worry" }); g.restore();
    // toi + les jeunes
    const cards: [string, CharSpec][] = [["TOI", { ...(Y as CharSpec), mode: "stand", expr: "worry" }], ["TOI (DOS)", { ...(Y as CharSpec), mode: "stand", expr: "worry", back: true }],
      ...KIDS.map((k, i) => [`JEUNE ${i + 1}`, { ...(k as CharSpec), mode: "stand", expr: i % 2 ? "worry" : "calm" }] as [string, CharSpec])];
    cards.forEach(([lab, s], i) => { const x = 270 + (i % 3) * 270, y = 1390 + Math.floor(i / 3) * 260; g.save(); g.translate(x + 50, y); g.scale(0.28, 0.22); drawChar(new Pen(g), s); g.restore(); g.fillStyle = "#e9e6dc"; g.fillText(lab, x + 135, y + 250); });
    continueRender(h);
  }, []);
  return <AbsoluteFill><canvas ref={ref} width={1080} height={1920} /></AbsoluteFill>;
};
