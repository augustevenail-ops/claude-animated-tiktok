// Planche de validation des personnages du « Mur » (dessinés avec le même code que la vidéo) : les Longs dans leurs poses, toi, les jeunes.
import React, { useEffect, useRef } from "react";
import { AbsoluteFill, continueRender, delayRender } from "remotion";
import { Pen } from "../bridge/toon";
import { drawLong, LongSpec } from "./longs";
import { drawPerson, Person } from "./people";

const Y: Partial<Person> = { jacket: "#d4533e", pants: "#4b5165", shoes: "#3a2a24", hair: "bob", hairColor: "#3b2b25", hood: true };
const KIDS: Partial<Person>[] = [
  { jacket: "#5a7d6a", pants: "#3f4458", shoes: "#2a2a30", hair: "spiky", hairColor: "#2a2220" }, { jacket: "#c9b48e", pants: "#4a5066", shoes: "#2a2a30", hair: "ponytail", hairColor: "#a07850" },
  { jacket: "#8fa7c4", pants: "#3f4458", shoes: "#2a2a30", hair: "bun", hairColor: "#c9c3b8" }, { jacket: "#7b5a8a", pants: "#3a3348", shoes: "#2a2a30", hair: "fringe", hairColor: "#24201f" },
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
    g.fillStyle = "#a9adbf"; g.fillText("ÉCHELLE : UN LONG ≈ 5 PERSONNAGES", 110, 1370);
    g.save(); g.translate(40, 1380); g.scale(0.26, 0.5); drawLong(new Pen(g), { pose: "stand" }); g.restore();
    g.save(); g.translate(170, 1380 + 500 - 100); g.scale(0.052, 0.1); drawPerson(new Pen(g), { ...(KIDS[0] as Person), pose: "stand", expr: "worry" }); g.restore();
    // toi + les jeunes
    const cards: [string, Person][] = [
      ["TOI", { ...(Y as Person), pose: "stand", expr: "worry" }], ["TOI — PEUR", { ...(Y as Person), pose: "stand", expr: "fear" }], ["TOI — CHOC", { ...(Y as Person), pose: "handMouth", expr: "shock" }],
      ["TOI — COURSE", { ...(Y as Person), pose: "run", expr: "fear", step: 0.25 }], ["TOI — DE DOS", { ...(Y as Person), pose: "stand", expr: "calm", back: true }], ["TOI — ÉPUISÉ", { ...(Y as Person), pose: "stand", expr: "tired" }],
      ...KIDS.map((k, i) => [`JEUNE ${i + 1}`, { ...(k as Person), pose: i === 1 ? "reach" : i === 2 ? "armsUp" : "stand", expr: (["calm", "worry", "relief", "frown"] as const)[i] }] as [string, Person])];
    cards.forEach(([lab, s], i) => { const x = 220 + (i % 5) * 172, y = 1390 + Math.floor(i / 5) * 270; g.save(); g.translate(x, y); g.scale(0.25, 0.25); drawPerson(new Pen(g), s); g.restore(); g.fillStyle = "#e9e6dc"; g.font = "bold 17px DejaVu Sans"; g.fillText(lab, x + 81, y + 250); });
    continueRender(h);
  }, []);
  return <AbsoluteFill><canvas ref={ref} width={1080} height={1920} /></AbsoluteFill>;
};
