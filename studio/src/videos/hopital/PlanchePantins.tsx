// Planche de contrôle des pantins articulés (profil, cycles, couché / assis, chute) — même code que la vidéo.
import React, { useEffect, useRef } from "react";
import { AbsoluteFill, continueRender, delayRender } from "remotion";
import { Pen } from "../bridge/toon";
import { drawPerso, Perso, BIG } from "./persos";
import { runJ, walkJ, REST } from "./pantin";

const TOI: Perso = { role: "patient", pose: "stand", expr: "worry", jacket: "#a9cfe0", pants: "#a9cfe0", shoes: "#f2f2f4", hair: "bald", hairColor: "#3b2b25", bandage: true };
const SO: Perso = { role: "medecin", pose: "stand", expr: "shock", jacket: "#eef0f2", pants: "#4e7fa8", shoes: "#e9e9ec", hair: "spiky", hairColor: "#24201f", bite: true };
const DOC: Perso = { role: "medecin", pose: "stand", expr: "fear", jacket: "#eef0f2", pants: "#3f8a8c", shoes: "#e9e9ec", hair: "fringe", hairColor: "#6b4a32" };
const CELLS: [string, Perso][] = [
  ["PROFIL", { ...TOI, view: "side", j: REST }], ["MARCHE", { ...TOI, view: "side", j: walkJ(0.25) }], ["COURSE", { ...TOI, view: "side", j: runJ(0.25), expr: "fear" }],
  ["MAIN LEVÉE", { ...TOI, view: "front", j: { ...REST, shR: 2.6, elR: 0.5 } }], ["COUCHÉ", { ...TOI, view: "side", spin: -Math.PI / 2, expr: "fear" }],
  ["ASSIS", { ...TOI, view: "side", spin: -Math.PI / 2, j: { ...REST, lean: Math.PI / 2, shR: 0.3, elR: 0.6, shL: 0.2, elL: 0.5 } }],
  ["SE REDRESSE", { ...TOI, view: "side", spin: -Math.PI / 2, j: { ...REST, lean: 0.8, shR: -0.4, elR: 0.3, shL: -0.5, elL: 0.3 } }],
  ["CHUTE 1", { ...SO, view: "side", j: { ...REST, knL: 0.9, knR: 1.1, hipL: 0.5, hipR: 0.6, lean: -0.15, shR: 0.9, elR: 1.2, shL: 0.6, elL: 1 } }],
  ["CHUTE 2", { ...SO, view: "side", spin: 0.9, j: { ...REST, knL: 0.7, knR: 0.6, hipL: 0.4, hipR: 0.3, shR: 1.5, shL: 1.2 } }],
  ["AU SOL", { ...SO, view: "side", spin: Math.PI / 2, j: { ...REST, shR: 0.3, shL: 0.2, knL: 0.2 } }],
  ["MÉDECIN COURT", { ...DOC, view: "side", j: runJ(0.1) }], ["MÉDECIN COURT 2", { ...DOC, view: "side", j: runJ(0.6), hair: "bun", mask: true }],
];
export const HopitalPantins: React.FC = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const h = delayRender("pantins"); const g = ref.current!.getContext("2d")!;
    g.fillStyle = "#162026"; g.fillRect(0, 0, 1080, 1920); g.fillStyle = "#e9e6dc"; g.font = "bold 40px DejaVu Sans"; g.textAlign = "center"; g.fillText("PANTINS ARTICULÉS", 540, 60);
    CELLS.forEach(([lab, s], i) => { const x = (i % 3) * 360, y = 90 + Math.floor(i / 3) * 455, S = 340 / BIG;
      g.save(); g.translate(x + 10, y); g.scale(S, S); drawPerso(new Pen(g), s); g.restore(); g.fillStyle = "#FF9A3C"; g.font = "bold 24px DejaVu Sans"; g.fillText(lab, x + 180, y + 440); });
    continueRender(h);
  }, []);
  return <AbsoluteFill><canvas ref={ref} width={1080} height={1920} /></AbsoluteFill>;
};
