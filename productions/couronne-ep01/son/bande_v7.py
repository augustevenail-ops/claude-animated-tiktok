# Bande son v7 de « La Couronne » ép. 1 (retour utilisateur sur les 3 propositions) :
#  - plus de musique de fond : seulement des notes selon les moments (légères au début, de plus en plus graves) ;
#  - chute de l'oiseau : léger souffle de vent pendant la chute libre, petit bruit sourd léger au sol ;
#  - souffles (whoosh / vent) sur tous les grands mouvements de caméra (plans drone) ;
#  - notes longues et graves (sol 2, etc., nappe de violoncelle/synthé, pas de piano) sur les moments de tension et les révélations ;
#  - sirène de caserne de pompiers : une longue montée, tenue, puis lente descente (pas de changement de note chaque seconde) ;
#  - ambiances et bruitages de la banque ElevenLabs (productions/sfx_lib_el) ; vent léger permanent ; voix toujours devant ; -15 LUFS.
# Usage : python3 son/bande_v7.py  -> son/mix_v7.wav et son/mix_ecoute_v7.mp3
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
    for f in ["wind", "zap", "air_fall", "paper", "steps", "crowd_steps", "swell", "thump", "bip", "keys", "melody", "ph", "birdsong", "note"]: exec(grab(f), g)
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
    nt = lambda m: 440 * 2 ** ((m - 69) / 12); fft_filt, reverb = g["fft_filt"], g["reverb"]
    def fire_siren(t0, t1, g_db, rise=2.9, hold=2.2):
        """sirène de caserne (moteur) : une seule longue montée, tenue, puis lente descente du moteur ; lointaine, réverbérée"""
        n = int((t1 - t0) * SR); t = np.arange(n) / SR; d = t1 - t0; fall = d - rise - hold
        u1 = np.clip(t / rise, 0, 1); u3 = np.clip((t - rise - hold) / fall, 0, 1)
        f = 150 + 430 * (1 - (1 - u1) ** 2.2) - 380 * u3 ** 1.3                      # 150 Hz -> 580 Hz, tenue, puis retombe vers 200 Hz
        f *= 1 + 0.004 * np.sin(2 * np.pi * 5.3 * t)                                 # léger tremblement du rotor
        p = 2 * np.pi * np.cumsum(f) / SR
        x = np.sin(p) + 0.55 * np.sin(2 * p + 0.4) + 0.32 * np.sin(3 * p + 1.1) + 0.16 * np.sin(4 * p) + 0.08 * np.sin(5 * p + 0.7)
        x *= 1 + 0.12 * np.sin(2 * np.pi * f * 0.25 * t / 4)                          # souffle des pales
        env = np.minimum(1, t / 0.6) * (1 - 0.65 * u3 ** 1.6) * np.minimum(1, (d - t) / 0.8)
        x = fft_filt(x * env, 140, 2800)
        y = reverb(x, 2.4, 0.6, 3); y2 = reverb(np.roll(x, int(0.017 * SR)), 2.4, 0.6, 4)
        put(np.stack([y, y2]), t0, g_db, 0.3)
    def drone_note(t0, d, midis, g_db, att=1.2, seed=0):
        """note longue et grave tenue (violoncelle/synthé, pas de piano) : scie filtrée + sous-octave, attaque lente, légère vibration"""
        n = int((d + 2.5) * SR); t = np.arange(n) / SR; r = np.random.default_rng(seed); x = np.zeros(n)
        for m in midis:
            for det in (-0.06, 0.0, 0.07):
                f = nt(m) * 2 ** (det / 12) * (1 + 0.003 * np.sin(2 * np.pi * (4.6 + r.random()) * t + r.random() * 6))
                p = 2 * np.pi * np.cumsum(f) / SR + r.random() * 6
                x += sum(np.sin(k * p) / k ** 1.25 for k in range(1, 9))
            x += 0.6 * np.sin(np.pi * np.cumsum(np.full(n, nt(m))) / SR)       # sous-octave douce
        env = np.minimum(1, t / att) ** 1.5 * np.where(t < d, 1.0, np.exp(-(t - d) / 0.9))
        x = fft_filt(x * env, 30, 1400)
        put(np.stack([reverb(x, 2.6, 0.45, seed), reverb(np.roll(x, int(0.012 * SR)), 2.6, 0.45, seed + 1)]), t0, g_db, 0.0)
    def whoosh_wind(t0, t1, g_db, seed=0, peak=0.55):
        """souffle de vent qui suit un grand mouvement de caméra : monte, culmine, retombe"""
        n = int((t1 - t0) * SR); u = np.arange(n) / n; r = np.random.default_rng(seed)
        env = np.where(u < peak, np.sin(np.pi / 2 * u / peak) ** 2, np.maximum(np.cos(np.pi / 2 * np.clip((u - peak) / (1 - peak), 0, 1)), 0) ** 1.6)
        st = np.stack([fft_filt(r.standard_normal(n), 140, 1300) + 0.3 * fft_filt(r.standard_normal(n), 1300, 3600) * env for _ in range(2)]) * env
        put(st, t0, g_db, 0.05)

    # ================= 1-4 : l'oiseau, la sirène, le compteur, la foule =================
    G["birdsong"](0.02, -27)                                                          # l'oiseau siffle
    G["zap"](G["HIT"], -18); el("sub_hit", G["HIT"], -29, 1.2)                         # il touche le dôme
    whoosh_wind(G["FALL0"] - 0.05, G["LAND"] + 0.12, -27, seed=3, peak=0.8)            # chute libre : léger vent qui s'ouvre
    G["air_fall"](G["FALL0"], G["LAND"], -31)
    G["thump"](G["LAND"], -23, 58, 0.55)                                               # petit bruit sourd léger au sol
    fire_siren(0.67, 9.2, -29)                                                         # sirène de caserne : une longue montée, tenue, descente
    G["bip"](2.453 + 0.55, -20)                                                        # compteur 72:00 -> 71:59
    G["crowd_steps"](4.813, 5.8, -30, G["FREEZE"], seed=5)                             # la foule marche puis se fige
    el("respiration", 5.75, -36, 1.0, 0.2)                                             # une respiration retenue dans le silence

    # ================= grands mouvements de caméra (drones) : souffles / vent =================
    for a_, b_, gdb, sd in [(0.12, 0.62, -31, 40),        # 2 : vol de l'oiseau
                            (6.45, 8.6, -27, 41),         # 5 : plongée / vue large du district
                            (9.47, 10.6, -31, 42),        # 6 : approche de la salle du Conseil
                            (10.75, 12.6, -29, 43),       # 7 : à travers le champ
                            (14.1, 16.2, -30, 44),        # 8 : vue aérienne, la carte
                            (18.25, 20.0, -29, 45),       # 9 : règle 1 sur le mur
                            (21.55, 23.4, -28, 46),       # 10 : vue aérienne dehors
                            (28.4, 29.9, -32, 47),        # 13 : la rue au matin
                            (46.1, 48.4, -26, 49)]:       # 22 : par-dessus le mur
        whoosh_wind(a_, b_, gdb, seed=sd)
    for c in (6.753, 10.873, 14.313, 18.453, 21.753, 39.373, 46.313): el("whoosh", c - 0.55, -31)
    whoosh_wind(39.2, 43.3, -27, seed=48, peak=0.45)                                   # 19-21 : la longue plongée entre les immeubles
    env_loop("vent_leger", 39.4, 46.3, -34, [(0, 0), (39.4, 0), (40.5, 1.2), (44.5, 1.0), (46.3, 0.3), (DUR, 0)])
    el("whoosh_inverse", 43.13 - 1.6, -32)                                             # aspiration vers la règle 2

    # ================= ambiances =================
    env_loop("vent_leger", 0.0, DUR, -37, [(0, 1.6), (6, 1.0), (DUR, 1.0)])            # vent léger permanent (plus présent au début)
    env_loop("drone_sombre", 0.0, DUR, -40, [(0, 0.7), (40, 1.0), (60, 1.25), (69, 1.4), (DUR, 0.7)])   # grondement sourd très bas, sans mélodie
    env_loop("vent_apocalypse", 7.4, 9.8, -32, [(0, 0), (7.4, 0), (8.2, 1), (9.4, 1), (9.8, 0), (DUR, 0)])   # dehors
    el("transmission", 9.5, -35, 1.3, 0.2)                                             # 6 : le haut-parleur du Conseil s'ouvre
    el("generateur_baisse", W(43) - 0.15, -27); el("panne", 12.55, -35, 1.6, 0.3)      # 7 : plus assez d'énergie, les lumières grésillent
    el("interface", 14.33, -31); el("bips", 15.6, -37)                                  # 8 : la carte s'allume
    env_loop("bourdon_industriel", 16.3, 18.45, -37, [(0, 1), (DUR, 1)])                # les districts
    G["swell"](W(63) - 0.45, 1.5, -21, seed=61); G["swell"](W(138) - 0.45, 1.5, -21, seed=62)   # les règles
    env_loop("vent_apocalypse", 21.6, 24.5, -26, [(0, 1), (DUR, 1)]); el("gaz", 22.0, -33, 2.4, 0.4)   # 10 : l'air tue
    el("explosions_loin", 22.3, -36, 2.0, 0.6)
    env_loop("ventilation", 24.3, 28.6, -37, [(0, 1), (DUR, 1)])                       # 11-12 : la maison, le soir
    el("chaise", 26.1, -33); G["paper"](27.6, 0.8, -27, seed=22)                       # il s'assoit, ouvre le dossier
    el("bottes", 28.95, -36, 1.3, 0.4, -0.4); el("bottes", 30.4, -29, 5.2, 0.3)       # 13-16 : les gardes l'emmènent
    G["steps"](31.6, 35.6, 0.52, -34, pan=0.05, seed=29, rate=1.05)
    for t_ in (30.6, 31.9, 33.4, 34.9): G["keys"](t_, -34, seed=int(t_ * 10))
    G["paper"](32.85, 0.6, -28, seed=27); el("vetements", 34.3, -30)
    el("respiration", 35.85, -35, 1.4, 0.3)                                            # 17 : toi, inquiet
    el("vetements", 37.5, -30); G["steps"](37.45, 38.0, 0.45, -31, seed=30, rate=0.85)  # 18 : le garde se tourne
    el("surveillance", 37.36, -33)
    G["paper"](48.6, 1.0, -24, dens=180, seed=35)                                      # 23 : la feuille
    env_loop("ventilation", 48.4, 54.1, -38, [(0, 1), (DUR, 1)])
    el("annonce", 54.12, -27); el("radio", 54.6, -35, 1.7, 0.3); el("foule", 54.3, -31, 2.0, 0.4)   # 26 : la radio du Conseil
    el("generateur_baisse", 57.3, -29); el("interface", 56.3, -34)                     # 27 : le champ se rétracte
    el("surveillance", 59.85, -33)
    el("impact_dramatique", W(192) - 0.03, -25)                                        # 28 : « exécutés »
    el("foule", 62.1, -32, 1.9, 0.4)                                                   # 29 : la foule
    env_loop("bunker", 64.0, 66.3, -31, [(0, 1), (DUR, 1)])                            # 30 : la cellule
    el("porte_metal", 64.1, -28, pan=0.4); el("verrou", 65.0, -31)
    el("coeur", 66.3, -33, 2.7, 0.4)                                                   # 31 : le choix
    el("boom", 68.99, -23)                                                             # carton final

    mus = np.zeros(N)
    def music_from(fn):
        global_L, global_R = G["L"].copy(), G["R"].copy(); fn()
        m = (G["L"] - global_L + G["R"] - global_R) / 2; G["L"][:] = global_L; G["R"][:] = global_R; return m
    def notes():
        B4, Cs5, D5, E5, Fs5, G5, A5, B5 = 71, 73, 74, 76, 78, 79, 81, 83
        mel, ph = G["melody"], G["ph"]
        # petites notes légères au début, de plus en plus graves (arc v6)
        mel(ph(14.4, [(D5, 2), (Fs5, 2), (A5, 3), (G5, 1), (Fs5, 4)], 0.5), -28, 83)
        mel(ph(24.4, [(m - 5, k) for m, k in [(B4, 2), (D5, 1), (E5, 1), (Fs5, 3), (E5, 1), (D5, 2), (Cs5, 2), (D5, 4)]], 0.5), -26, 85)
        mel(ph(32.8, [(m - 7, k) for m, k in [(Fs5, 2), (A5, 2), (G5, 2), (Fs5, 1), (E5, 1), (Fs5, 4)]], 0.55), -27, 87)
        mel(ph(49.8, [(m - 12, k) for m, k in [(D5, 2), (E5, 2), (Fs5, 2), (G5, 3), (Fs5, 1), (E5, 4)]], 0.5), -26, 89)
        # notes longues et graves sur les moments de tension / révélations (de plus en plus graves vers la fin)
        for t_, d_, ch, gdb in [(W(14) + 0.1, 3.0, [47], -27),            # « coupé »                      si 2
                                (W(43) + 0.35, 3.6, [43], -25),           # « plus assez d'énergie »       sol 2
                                (W(74) + 0.05, 3.2, [42], -26),           # « l'air tue »                  fa# 2
                                (W(137) + 0.2, 3.2, [40], -25),           # « personne n'en revient »      mi 2
                                (W(171) + 0.15, 2.9, [43, 50], -25),      # « ils nous mentent »           sol 2 + ré 3
                                (W(182) + 0.1, 2.4, [40, 47], -26),       # « seul le centre restera protégé »  mi 2 + si 2
                                (W(192) + 0.1, 3.2, [36], -24),           # « exécutés »                   do 2 (le plus sombre)
                                (W(209) + 0.05, 1.6, [42], -25),          # ton père « exécuté »           fa# 2
                                (W(213) + 0.05, 2.0, [43, 47], -25),      # « tu te tais ? »               sol 2 + si 2 (suspens)
                                (68.99, 3.3, [35, 42], -24)]:             # carton final                   si 1 + fa# 2
            drone_note(t_, d_, ch, gdb, seed=int(t_ * 7))
        # fin : petit motif grave qui descend (sans accompagnement continu), finit en suspens
        mel(ph(62.1, [(66, 2), (64, 1), (62, 1), (61, 2), (62, 2), (59, 3), (61, 1), (62, 2), (61, 4)], 0.42), -27, 91)
    mus = music_from(notes)
    # ---------- notes sous la voix (-2,5 dB), mix, -15 LUFS
    words = G["words"]; duck = np.ones(N)
    for w in words: duck[int(max(0, w["s"] - 0.08) * SR):int(min(DUR, w["e"] + 0.12) * SR)] = 10 ** (-2.5 / 20)
    mus = mus * np.convolve(duck, np.ones(2000) / 2000, "same")
    mix = np.stack([G["voice"] + mus + G["L"], G["voice"] + mus + G["R"]], 1)
    out = os.path.join(HERE, "mix_v7.wav"); pre = os.path.join(HERE, "_pre_v7.wav")
    assert not os.path.exists(out), "mix_v7.wav existe déjà"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f64le", "-ar", str(SR), "-ac", "2", "-i", "-", pre], input=mix.tobytes(), check=True)
    m = subprocess.run(["ffmpeg", "-i", pre, "-af", "loudnorm=I=-15:TP=-1.2:LRA=9:print_format=json", "-f", "null", "-"], capture_output=True, text=True).stderr
    j = json.loads(m[m.rfind("{"):])
    af = f"loudnorm=I=-15:TP=-1.2:LRA=9:measured_I={j['input_i']}:measured_TP={j['input_tp']}:measured_LRA={j['input_lra']}:measured_thresh={j['input_thresh']}:offset={j['target_offset']}:linear=true,aresample=48000"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", pre, "-af", af, "-c:a", "pcm_s24le", out], check=True); os.remove(pre)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", out, "-b:a", "192k", os.path.join(HERE, "mix_ecoute_v7.mp3")], check=True)
    print("mix v7 ok", out)

build("v7")
