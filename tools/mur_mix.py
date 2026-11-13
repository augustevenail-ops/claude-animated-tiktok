# Mix de « Le Mur » ép. 1 (mêmes règles que series_mix.py : voix perso, musique douce -1/4, couche de tension, accroche D, -15 LUFS).
# Indices de mots = words.json de productions/mur-ep01/voix_perso (même découpage que le script). Usage : python3 tools/mur_mix.py
import json, os, shutil, subprocess, sys
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from sound_kit import Kit

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
EP = os.path.join(ROOT, "productions", "mur-ep01"); VD = os.path.join(EP, "voix_perso")
SR = 48000; OFF = 0.35; TITLE = 2.8
words = json.load(open(os.path.join(VD, "words.json"), encoding="utf-8"))
DUR = round(words[-1]["e"] + OFF + 0.35 + TITLE, 2); N = int(DUR * SR); TITLE_AT = DUR - TITLE
W = lambda i: words[i]["s"] + OFF
E = lambda i: words[i]["e"] + OFF
db = lambda v: 10 ** (v / 20)
dec = lambda p: np.frombuffer(subprocess.run(["ffmpeg", "-v", "error", "-i", p, "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True).stdout, np.float32).astype(float)
v = dec(os.path.join(VD, "voice.wav")); voice = np.zeros(N); i0 = int(OFF * SR); voice[i0:i0 + len(v)] = v[: N - i0]
sp = np.zeros(N, bool)
for w in words: sp[int((w["s"] + OFF) * SR):min(N, int((w["e"] + OFF) * SR))] = True
rms = lambda x: 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-9); vref = rms(voice[sp])
def lvl(x, target): a = np.abs(x) > 1e-5; return x * db(target - rms(x[a])) if a.any() else x
k = Kit(N, SR, seed=21); sfx = np.zeros(N); LIB = os.path.join(ROOT, "productions", "sfx_lib"); _c = {}
def cue(name, t0, g=-10.0, dur=None):
    if name not in _c: _c[name] = dec(os.path.join(LIB, name + ".mp3"))
    x = _c[name] if dur is None else _c[name][: int(dur * SR)]
    a = np.abs(x) > 1e-3
    if not a.any(): return
    x = x * db(vref + g - rms(x[a])); i = int(t0 * SR); j = min(N, i + len(x))
    if 0 <= i < N: sfx[i:j] += x[: j - i]
# ---- accroche D (validée) : note qui monte jusqu'à « Imagine », chute grave ; + coup sourd sur « ne bouge pas »
T1 = W(4) - 2 / 30
cue("sting_soft", 0.0, -5); k.riser(T1, T1, 0.9); k.sub_drop(T1, 1.0); k.impact(W(2), 0.7, 44.0, 2.0); cue("breath_nervous", W(1) - 0.2, -14)
# ---- monde
cue("wind_city", W(4), -20); cue("wind_city", W(13), -22)
cue("light_off", W(41) - 0.05, -2); k.impact(W(41), 0.8, 40.0, 2.4)                    # TAC : la nuit tombe d'un coup
cue("tower_groan", W(42), -8); cue("metal_creak_far", W(43) + 0.3, -12)                 # les murs glissent
for e in range(5): k.thud(W(47) + e * 0.9, 0.55, 48)                                    # pas lourds des Longs
cue("crowd_breath", W(66), -18); cue("cloth_rustle", W(70), -16)                        # la clairière, le feu
cue("sting_hit", W(82) - 0.05, -10); cue("sting_hit", W(95) - 0.05, -10)                 # règle 1 / règle 2
cue("heartbeat", W(100), -10, 3.0)                                                       # « ne bouge plus »
cue("whisper_voice", W(113), -18)                                                        # les noms gravés
cue("footstep_one", W(129), -14); cue("footstep_one", W(131), -15); cue("wind_city", W(134), -18)
cue("siren_far", W(138) - 0.1, -1)                                                       # la sirène hurle
cue("run_steps_room", W(141), -8); cue("heart_fast", W(143), -9)
cue("tower_groan", W(152), -6); cue("steel_door", W(155), -10)                           # l'entrée se referme
cue("metal_creak_far", W(162), -8); k.impact(W(163), 0.7, 42.0, 2.0)                     # un Long se déplie
cue("breath_nervous", W(167), -10); cue("sting_hit", W(170), -8)                          # il tourne la tête
cue("heartbeat", W(179), -9, 6.0); cue("tower_groan", W(183), -10)
k.stinger(TITLE_AT, 0.5)
# ---- musique douce (-1/4) + tension qui suit l'histoire
REVEAL = [2, 41, 47, 102, 119, 140, 163, 172, 194]
mus = k.music4(DUR, dips=[W(i) - 0.25 for i in REVEAL], transpose=12)
mus = lvl(mus, vref - 6) * 0.75
ten, _ = Kit(N, SR, seed=5).tension_layer(DUR, [W(i) for i in REVEAL], W(len(words) - 1) - 14, TITLE_AT)
a = np.abs(ten) > 1e-4
if a.any(): mus = mus + ten * db(vref - 5 - rms(ten[a])) * 0.75
duck = np.ones(N)
for i in range(len(words)): duck[int(max(0, W(i) - 0.08) * SR):int(min(DUR, E(i) + 0.12) * SR)] = db(-2.5)
mus *= np.convolve(duck, np.ones(2000) / 2000, "same")
hs = k.hit + 0.8 * k.air; hit = lvl(hs, vref - 9)
o = dec(os.path.join(VD, "outro.wav")); j0 = int((TITLE_AT + 0.05) * SR); voice[j0:j0 + len(o)] += o[: max(0, N - j0)] * db(vref - rms(o[np.abs(o) > 1e-3]))
mix = np.stack([voice + mus + hit + sfx, voice + mus * 0.97 + hit + sfx * 0.92], 1)
pre = os.path.join(VD, "_pre.wav")
subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f64le", "-ar", str(SR), "-ac", "2", "-i", "-", pre], input=mix.tobytes(), check=True)
m = subprocess.run(["ffmpeg", "-i", pre, "-af", "loudnorm=I=-15:TP=-1.2:LRA=7:print_format=json", "-f", "null", "-"], capture_output=True, text=True).stderr
j = json.loads(m[m.rfind("{"):])
af = f"loudnorm=I=-15:TP=-1.2:LRA=7:measured_I={j['input_i']}:measured_TP={j['input_tp']}:measured_LRA={j['input_lra']}:measured_thresh={j['input_thresh']}:offset={j['target_offset']}:linear=true,aresample=48000"
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", pre, "-af", af, "-c:a", "pcm_s24le", os.path.join(VD, "mix.wav")], check=True); os.remove(pre)
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", os.path.join(VD, "mix.wav"), "-b:a", "192k", os.path.join(VD, "mix_ecoute.mp3")])
pub = os.path.join(ROOT, "studio", "public", "mur"); os.makedirs(pub, exist_ok=True); shutil.copy(os.path.join(VD, "mix.wav"), os.path.join(pub, "mix.wav"))
print(f"Le Mur ép. 1 : durée {DUR} s")
