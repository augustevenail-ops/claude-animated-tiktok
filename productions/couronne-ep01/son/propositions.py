# Trois propositions de bande son pour « La Couronne » ép. 1, avec la banque ElevenLabs (productions/sfx_lib_el, son/banque_el.py)
# et les synthèses de couronne_mix.py (oiseau, choc, bip, souffle des règles, papier, notes v6).
# Socle commun calé sur l'image (mêmes moments que la v6), puis chaque proposition change l'ambiance, la musique et les transitions :
#   A « Sci-fi sombre »   : nappe de drone + musique sci-fi lente, technologie du dôme, notes v6 (légères puis graves)
#   B « Mélancolique »    : piano au début, cordes dramatiques qui montent vers la fin, très peu de bruitages en plus
#   C « Bande-annonce »   : booms profonds, montées, souffles de transition, pulsation et cordes de fin, notes v6
# Voix toujours devant ; -15 LUFS.  Usage : python3 son/propositions.py [A B C]  -> son/propositions/<X>.wav et .mp3
import os, re, sys, json, subprocess
import numpy as np
HERE = os.path.dirname(os.path.abspath(__file__)); SRC = open(os.path.join(HERE, "couronne_mix.py"), encoding="utf-8").read()
HEAD = SRC.split("# ---------- plans (secondes)")[0]
def grab(name):                                                     # récupère une fonction de couronne_mix.py
    m = re.search(r"^def %s\(.*?(?=^\S)" % name, SRC, re.S | re.M); return m.group(0)
OUTD = os.path.join(HERE, "propositions"); os.makedirs(OUTD, exist_ok=True)
EL = os.path.join(HERE, "..", "..", "sfx_lib_el")

def build(P):
    g = {"__file__": os.path.join(HERE, "couronne_mix.py"), "__name__": "prop"}
    exec(HEAD, g)
    for f in ["wind", "zap", "air_fall", "paper", "steps", "crowd_steps", "swell", "thump", "bip", "keys", "melody", "ph", "birdsong"]: exec(grab(f), g)
    exec("CUTS = [0.1, 0.52, 2.453, 4.813, 6.753, 9.473, 11.6, 14.313, 18.453, 21.753, 24.333, 25.973, 28.553, 30.353, 31.533, 32.753, 35.773,"
         " 37.353, 39.373, 46.313, 48.413, 49.813, 51.553, 54.113, 56.233, 59.813, 62.013, 64.033, 66.293, 68.993]\nHIT = 0.52; FALL0 = 0.62; LAND = 1.22; FREEZE = 4.813 + 0.85", g)
    SR, N, DUR, W, put, dec, rng = g["SR"], g["N"], g["DUR"], g["W"], g["put"], g["dec"], g["rng"]
    _c = {}
    def el(name, t0, g_db, dur=None, fade=0.05, pan=0.0, off=0.0):
        if name not in _c: _c[name] = dec(os.path.join(EL, name + ".mp3"))
        x = _c[name][int(off * SR):]
        if dur is not None: x = x[: int(dur * SR)]
        put(x.copy(), t0, g_db, fade, pan)
    def el_loop(name, t0, t1, g_db, fade=1.5, xf=1.5):
        if name not in _c: _c[name] = dec(os.path.join(EL, name + ".mp3"))
        x = _c[name]; n = int((t1 - t0) * SR); out = np.zeros(n); m = int(xf * SR); p = 0; seg = len(x)
        while p < n:
            y = x.copy(); y[:m] *= np.linspace(0, 1, m); y[-m:] *= np.linspace(1, 0, m); j = min(n, p + seg); out[p:j] += y[: j - p]; p += seg - m
        put(np.stack([out, np.roll(out, int(0.011 * SR))]), t0, g_db, fade)
    def env_loop(name, t0, t1, g_db, pts):                             # nappe bouclée avec courbe de volume (pts = [(t, gain)])
        if name not in _c: _c[name] = dec(os.path.join(EL, name + ".mp3"))
        x = _c[name]; n = int((t1 - t0) * SR); out = np.zeros(n); m = int(1.5 * SR); p = 0
        while p < n:
            y = x.copy(); y[:m] *= np.linspace(0, 1, m); y[-m:] *= np.linspace(1, 0, m); j = min(n, p + len(y)); out[p:j] += y[: j - p]; p += len(y) - m
        a = np.abs(out) > 1e-5; ref = g["rms"](out[a]); out *= np.interp(t0 + np.arange(n) / SR, *zip(*pts))
        put(np.stack([out, np.roll(out, int(0.011 * SR))]), t0, g_db, 1.0, ref=ref)
    G = g
    # ================= socle commun (moments de l'image) =================
    G["birdsong"](0.02, -27)                                                          # l'oiseau siffle (synthèse douce validée)
    G["zap"](G["HIT"], -18); el("sub_hit", G["HIT"], -27, 1.5)                         # il touche le dôme
    G["air_fall"](G["FALL0"], G["LAND"], -33); el("hit_transition", G["LAND"], -27)    # il tombe, touche le sol
    env_loop("alarme", 0.67, 8.8, -30, [(0, 0), (0.67, 0), (1.3, 1), (6.75, 1), (8.6, 0.0), (DUR, 0)])   # alarme lente (s'éloigne au plan 5)
    G["bip"](2.453 + 0.55, -20)                                                        # compteur 72:00 -> 71:59
    G["crowd_steps"](4.813, 5.8, -30, G["FREEZE"], seed=5)                             # la foule marche puis se fige
    env_loop("vent_apocalypse", 7.4, 9.8, -31, [(0, 0), (7.4, 0), (8.2, 1), (9.4, 1), (9.8, 0), (DUR, 0)])   # dehors
    env_loop("vent_apocalypse", 21.6, 24.5, -26, [(0, 1), (DUR, 1)]); el("gaz", 22.0, -33, 2.4, 0.4)         # 10 : l'air tue
    el("generateur_baisse", W(43) - 0.15, -27)                                         # 7 : plus assez d'énergie
    el("interface", 14.33, -31)                                                        # 8 : la carte s'allume
    G["swell"](W(63) - 0.45, 1.5, -21, seed=61); G["swell"](W(138) - 0.45, 1.5, -21, seed=62)   # les règles
    el("chaise", 26.1, -33); G["paper"](27.6, 0.8, -27, seed=22)                       # 12 : il s'assoit, ouvre le dossier
    el("bottes", 28.95, -36, 1.3, 0.4, -0.4); el("bottes", 30.4, -29, 5.2, 0.3)       # 13-16 : les gardes l'emmènent
    G["steps"](31.6, 35.6, 0.52, -34, pan=0.05, seed=29, rate=1.05)
    for t_ in (30.6, 31.9, 33.4, 34.9): G["keys"](t_, -34, seed=int(t_ * 10))
    G["paper"](32.85, 0.6, -28, seed=27); el("vetements", 34.3, -30)
    el("vetements", 37.5, -30); G["steps"](37.45, 38.0, 0.45, -31, seed=30, rate=0.85)  # 18 : le garde se tourne
    el("balayage", 46.2, -29)                                                          # 22 : par-dessus le mur
    G["paper"](48.6, 1.0, -24, dens=180, seed=35)                                      # 23 : la feuille
    el("annonce", 54.12, -27); el("radio", 54.6, -35, 1.7, 0.3)                        # 26 : la radio du Conseil
    el("foule", 54.3, -31, 2.0, 0.4)
    el("generateur_baisse", 57.3, -29)                                                 # 27 : le champ se rétracte
    el("impact_dramatique", W(192) - 0.03, -25)                                        # 28 : « exécutés »
    el("foule", 62.1, -32, 1.9, 0.4)                                                   # 29 : la foule
    el("porte_metal", 64.1, -28, pan=0.4); el("verrou", 65.0, -31)                     # 30 : la cellule
    env_loop("vent_leger", 0.0, DUR, -37, [(0, 1.6), (6, 1.0), (DUR, 1.0)])            # vent léger permanent (plus présent au début)

    mus = np.zeros(N)
    def music_from(fn):                                                                # musique dans un bus à part (baisse sous la voix)
        global_L, global_R = G["L"].copy(), G["R"].copy(); fn()
        m = (G["L"] - global_L + G["R"] - global_R) / 2; G["L"][:] = global_L; G["R"][:] = global_R; return m
    def notes_v6():
        B4, Cs5, D5, E5, Fs5, G5, A5, B5 = 71, 73, 74, 76, 78, 79, 81, 83; D4, E4, Fs4 = 62, 64, 66
        mel, ph = G["melody"], G["ph"]
        mel(ph(9.6, [(Fs5, 2), (E5, 1), (D5, 1), (Cs5, 2), (D5, 2), (B4, 4)], 0.55), -26, 81)
        mel(ph(14.4, [(D5, 2), (Fs5, 2), (A5, 3), (G5, 1), (Fs5, 4)], 0.5), -27, 83)
        mel(ph(24.4, [(m - 5, k) for m, k in [(B4, 2), (D5, 1), (E5, 1), (Fs5, 3), (E5, 1), (D5, 2), (Cs5, 2), (D5, 4)]], 0.5), -25, 85)
        mel(ph(32.8, [(m - 7, k) for m, k in [(Fs5, 2), (A5, 2), (G5, 2), (Fs5, 1), (E5, 1), (Fs5, 4)]], 0.55), -26, 87)
        mel(ph(49.8, [(m - 12, k) for m, k in [(D5, 2), (E5, 2), (Fs5, 2), (G5, 3), (Fs5, 1), (E5, 4)]], 0.5), -25, 89)
        CH = [(56.3, [35, 42, 50]), (59.2, [31, 38, 47]), (62.0, [28, 40, 47, 54]), (64.0, [31, 38, 47]), (66.3, [30, 37, 46, 49]), (68.4, [35, 42, 50, 54])]
        for (t_, ch), nx in zip(CH, [c[0] for c in CH[1:]] + [DUR - 0.2]): mel([(t_, m + 12, nx - t_) for m in ch], -26, int(t_ * 10))
        mel(ph(62.1, [(Fs4, 2), (E4, 1), (D4, 1), (61, 2), (D4, 2), (59, 3), (61, 1), (D4, 2), (61, 4), (54, 6)], 0.42), -25, 91)

    if P == "A":   # ---------- Sci-fi sombre
        env_loop("drone_sombre", 0.0, DUR, -31, [(0, 0.8), (20, 1.0), (56, 1.3), (69, 1.5), (DUR, 0.8)])
        env_loop("bourdon_industriel", 18.4, 21.8, -35, [(0, 1), (DUR, 1)])               # district
        env_loop("ventilation", 24.3, 28.6, -36, [(0, 1), (DUR, 1)]); env_loop("ventilation", 48.4, 54.1, -37, [(0, 1), (DUR, 1)])   # intérieurs
        env_loop("bunker", 64.0, 66.3, -30, [(0, 1), (DUR, 1)])                           # la cellule
        el("bips", 8.9, -33); el("surveillance", 37.36, -31); el("surveillance", 59.85, -31)
        mus = music_from(lambda: (env_loop("scifi_musique", 0.0, DUR, -24, [(0, 0), (1.5, 0.7), (9.5, 0.9), (56, 1.0), (DUR - 2, 1.0), (DUR, 0)]), notes_v6()))
        env_loop("drone_suspense", 56.0, 69.2, -31, [(0, 0), (56, 0), (60, 1), (69.2, 1.4), (DUR, 0)])
        el("boom", 68.99, -22)
    if P == "B":   # ---------- Mélancolique : piano au début, cordes qui montent vers la fin
        def m():
            env_loop("piano", 0.3, 40.0, -22, [(0, 0), (0.3, 0), (2.5, 0.8), (9.5, 1.0), (36, 1.0), (40.0, 0)])
            env_loop("cordes_tension", 38.0, 62.5, -24, [(0, 0), (38, 0), (41, 0.8), (54, 1.0), (60, 1.1), (62.5, 0)])
            el("cordes_fin", 60.5, -22, None, 1.5)
        mus = music_from(m)
        env_loop("drone_sombre", 0.0, DUR, -36, [(0, 1), (DUR, 1)])
        el("coeur", 62.2, -30); el("boom", 68.99, -24)
    if P == "C":   # ---------- Bande-annonce
        env_loop("drone_suspense", 0.0, DUR, -32, [(0, 0.8), (40, 1.0), (60, 1.3), (69, 1.5), (DUR, 0.7)])
        el("boom", 0.0, -20)                                                               # ouverture
        el("boom", W(63) - 0.03, -23); el("boom", W(138) - 0.03, -23)                     # sous les règles (avec le souffle)
        el("riser", W(138) - 5.0, -30)                                                     # montée vers la règle 2
        for t_ in (W(14), W(74), W(170)): el("sub_hit", t_ - 0.03, -27, 2.0)              # « coupé », « tue », « mentent »
        for c in (6.753, 14.313, 24.333, 28.553, 39.373, 54.113, 62.013): el("whoosh", c - 0.6, -31)   # souffles sur les grandes coupes
        el("whoosh_inverse", 18.45 - 1.8, -31); el("impact_metal", 46.35, -29)
        el("explosions_loin", 21.9, -33); el("effondrement", 57.5, -33)
        mus = music_from(lambda: (notes_v6(), env_loop("cordes_tension", 54.0, 66.5, -25, [(0, 0), (54, 0), (57, 0.8), (66, 1.1), (66.5, 0)]), el("cordes_fin", 62.0, -23, None, 1.5)))
        env_loop("pulse", 56.2, 68.9, -30, [(0, 0), (56.2, 0), (58, 0.8), (68.6, 1.4), (68.9, 0), (DUR, 0)])
        el("riser", 68.99 - 5.0, -27); el("stinger", 68.99, -22); el("drop", 68.99, -26)

    # ---------- musique sous la voix (-2 dB), mix, -15 LUFS
    words = G["words"]; duck = np.ones(N)
    for w in words: duck[int(max(0, w["s"] - 0.08) * SR):int(min(DUR, w["e"] + 0.12) * SR)] = 10 ** (-2.5 / 20)
    mus = mus * np.convolve(duck, np.ones(2000) / 2000, "same")
    mix = np.stack([G["voice"] + mus + G["L"], G["voice"] + mus + G["R"]], 1)
    out = os.path.join(OUTD, P + ".wav"); pre = os.path.join(OUTD, "_pre_" + P + ".wav")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f64le", "-ar", str(SR), "-ac", "2", "-i", "-", pre], input=mix.tobytes(), check=True)
    m = subprocess.run(["ffmpeg", "-i", pre, "-af", "loudnorm=I=-15:TP=-1.2:LRA=9:print_format=json", "-f", "null", "-"], capture_output=True, text=True).stderr
    j = json.loads(m[m.rfind("{"):])
    af = f"loudnorm=I=-15:TP=-1.2:LRA=9:measured_I={j['input_i']}:measured_TP={j['input_tp']}:measured_LRA={j['input_lra']}:measured_thresh={j['input_thresh']}:offset={j['target_offset']}:linear=true,aresample=48000"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", pre, "-af", af, "-c:a", "pcm_s24le", out], check=True); os.remove(pre)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", out, "-b:a", "192k", os.path.join(OUTD, P + ".mp3")], check=True)
    print("proposition", P, "ok")

for P in (sys.argv[1:] or ["A", "B", "C"]): build(P)
