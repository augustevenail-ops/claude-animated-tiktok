// Planche de validation des personnages de « L'hôpital » (même code de dessin que la vidéo).
import React, { useEffect, useRef } from "react";
import { AbsoluteFill, continueRender, delayRender } from "remotion";
import { Pen } from "../bridge/toon";
import { drawPerso, Perso } from "./persos";

const TOI: Perso = { role: "patient", pose: "stand", expr: "worry", jacket: "#a9cfe0", pants: "#a9cfe0", shoes: "#f2f2f4", hair: "bald", hairColor: "#3b2b25", bandage: true };
const FLIC: Perso = { role: "police", pose: "stand", expr: "frown", jacket: "#26324f", pants: "#1f2638", shoes: "#15181f", hair: "fringe", hairColor: "#2a2220" };
const DOC: Perso = { role: "medecin", pose: "stand", expr: "worry", jacket: "#eef0f2", pants: "#3f8a8c", shoes: "#e9e9ec", hair: "fringe", hairColor: "#6b4a32" };
const SOIGNANT: Perso = { role: "medecin", pose: "stand", expr: "calm", jacket: "#eef0f2", pants: "#4e7fa8", shoes: "#e9e9ec", hair: "spiky", hairColor: "#24201f" };
const FILLE: Perso = { role: "fille", pose: "stand", expr: "fear", jacket: "#e8b64a", pants: "#7a5a8a", shoes: "#c0392b", hair: "fringe", hairColor: "#a0603a" };

type Row = [string, [string, Perso, number?][]];
const ROWS: Row[] = [
  ["TOI — PATIENT (blouse + bandage)", [["CALME", TOI], ["PEUR", { ...TOI, expr: "fear" }], ["CHOC", { ...TOI, pose: "handMouth", expr: "shock" }],
    ["COURSE", { ...TOI, pose: "run", expr: "fear", step: 0.25 }], ["DE DOS", { ...TOI, back: true, expr: "calm" }]]],
  ["POLICIERS · MÉDECINS QUI FUIENT", [["POLICIER", FLIC], ["POLICIER — TIR", { ...FLIC, pose: "reach", gun: true }], ["POLICIÈRE", { ...FLIC, hair: "bun", hairColor: "#a07850", expr: "worry" }],
    ["MÉDECIN — FUITE", { ...DOC, pose: "run", expr: "fear", step: 0.25 }], ["CHIRURGIENNE", { ...DOC, pants: "#4e7fa8", hair: "bun", hairColor: "#c9c3b8", mask: true, pose: "run", expr: "fear", step: 0.7 }]]],
  ["LE SOIGNANT DU COULOIR — TRANSFORMATION", [["NORMAL", SOIGNANT], ["MORDU", { ...SOIGNANT, bite: true, expr: "shock", pose: "handMouth" }],
    ["VEINES", { ...SOIGNANT, bite: true, infect: 0.45, expr: "fear", blood: 1 }], ["INFECTÉ", { ...SOIGNANT, bite: true, infect: 1, blood: 2 }], ["ATTAQUE", { ...SOIGNANT, bite: true, infect: 1, blood: 3, pose: "reach" }]]],
  ["LA PETITE FILLE", [["PEUR", FILLE, 0.68], ["CACHÉE", { ...FILLE, pose: "handMouth", expr: "fear" }, 0.68], ["COURSE", { ...FILLE, pose: "run", expr: "worry", step: 0.25 }, 0.68],
    ["SOULAGÉE", { ...FILLE, expr: "relief" }, 0.68], ["AVEC TOI", { ...TOI, pose: "reach", expr: "worry" }]]],
  ["LES INFECTÉS", [["PATIENT", { ...TOI, jacket: "#9cb8c4", pants: "#9cb8c4", hair: "bald", hairColor: "#9a9a9a", bandage: false, infect: 1, blood: 2, pose: "reach" }],
    ["INFIRMIÈRE", { ...DOC, pants: "#c97a9a", hair: "ponytail", hairColor: "#24201f", infect: 1, blood: 3, pose: "armsUp" }],
    ["CIVIL", { role: "civil", pose: "run", step: 0.25, expr: "shock", jacket: "#5a7d6a", pants: "#3f4458", shoes: "#2a2a30", hair: "spiky", hairColor: "#2a2220", infect: 1, blood: 2 }],
    ["CIVILE", { role: "civil", pose: "reach", expr: "shock", jacket: "#7b5a8a", pants: "#3a3348", shoes: "#2a2a30", hair: "bob", hairColor: "#c9b48e", infect: 1, blood: 1 }]]]
];

export const HopitalPlanche: React.FC = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const h = delayRender("planche"); const g = ref.current!.getContext("2d")!;
    const bg = g.createLinearGradient(0, 0, 0, 1920); bg.addColorStop(0, "#152024"); bg.addColorStop(1, "#0d1216"); g.fillStyle = bg; g.fillRect(0, 0, 1080, 1920);
    g.textAlign = "center"; g.fillStyle = "#e9e6dc"; g.font = "bold 44px DejaVu Sans"; g.fillText("L'HÔPITAL — PERSONNAGES", 540, 66);
    ROWS.forEach(([title, cards], r) => {
      const y0 = 100 + r * 362;
      g.fillStyle = "#FF9A3C"; g.font = "bold 24px DejaVu Sans"; g.textAlign = "left"; g.fillText(title, 30, y0 + 22);
      g.strokeStyle = "rgba(255,154,60,0.35)"; g.lineWidth = 2; g.beginPath(); g.moveTo(30, y0 + 34); g.lineTo(1050, y0 + 34); g.stroke();
      cards.forEach(([lab, s, sc = 1], i) => {
        const S = 0.3 * sc, x = 30 + i * 206 + (206 - 600 * S) / 2, base = y0 + 340;
        g.fillStyle = "rgba(0,0,0,0.35)"; g.beginPath(); g.ellipse(30 + i * 206 + 103, base - 8, 62 * sc, 9, 0, 0, 7); g.fill();
        g.save(); g.translate(x, base - 1000 * S); g.scale(S, S); drawPerso(new Pen(g), s); g.restore();
        g.textAlign = "center"; g.fillStyle = "#e9e6dc"; g.font = "bold 18px DejaVu Sans"; g.fillText(lab, 30 + i * 206 + 103, base + 14);
      });
    });
    continueRender(h);
  }, []);
  return <AbsoluteFill><canvas ref={ref} width={1080} height={1920} /></AbsoluteFill>;
};
