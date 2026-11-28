# Sous-titres ASS (libass) : un mot à la fois, jaune #FFE900, Montserrat Black, contour noir épais, ombre vers le bas, centrés.
import json, re
W = json.load(open("voix/words_v2.json", encoding="utf-8"))
clean = lambda w: re.sub(r"[.,:;!?]+$", "", w.replace("«", "").replace("»", "").replace("…", "").replace('"', "")).strip().lower()
CW = [dict(t=clean(w["w"]), s=w["s"], e=w["e"], p=bool(re.search(r"[.,:;!?…]$", w["w"].strip()))) for w in W]
CW = [c for c in CW if c["t"]]
C = []; i = 0
while i < len(CW):
    g = dict(CW[i]); i += 1
    while i < len(CW) and not g["p"] and CW[i]["s"] - g["s"] < 0.22 and len(g["t"] + " " + CW[i]["t"]) <= 16:
        g["t"] += " " + CW[i]["t"]; g["e"] = CW[i]["e"]; g["p"] = CW[i]["p"]; i += 1
    C.append(g)
for k, c in enumerate(C):
    n = C[k + 1] if k + 1 < len(C) else None; c["s"] -= 0.03
    c["e"] = n["s"] - 0.03 if n and n["s"] - 0.03 - c["e"] < 0.25 else c["e"] + 0.22
ts = lambda x: f"{int(x // 3600)}:{int(x % 3600 // 60):02d}:{x % 60:05.2f}"
head = """[Script Info]
ScriptType: v4.00+
PlayResX: 2160
PlayResY: 3840
WrapStyle: 2
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Cap,MonstreCaps,230,&H0000E9FF,&H0000E9FF,&H000A0A0A,&H60000000,0,0,0,0,100,100,2,0,1,22,11,5,100,100,0,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
with open("caps_v2.ass", "w", encoding="utf-8") as f:
    f.write(head)
    for c in C:
        size = 150 if len(c["t"]) > 14 else 175 if len(c["t"]) > 11 else 230
        f.write(f"Dialogue: 0,{ts(max(0, c['s']))},{ts(c['e'])},Cap,,0,0,0,,{{\\pos(1080,2573)\\fs{size}\\fscx135\\fscy135\\t(0,180,\\fscx100\\fscy100)}}{c['t']}\n")
print(len(C))
