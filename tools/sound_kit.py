# Kit son des séries (décision utilisateur du 2026-11-13, réglages mesurés sur sa vidéo de référence, rien n'est copié) :
#  - densité : ~19 impacts graves / min, ~5 montées / min, un souffle à chaque coupe, des déclics sur chaque geste ;
#  - impacts ~5 dB sous la voix, souffles/déclics ~8 dB sous la voix ;
#  - musique très grave et sombre en si (nappe B1/F#2/B2, presque pas d'aigus), pulsation de basse lente (43 bpm),
#    coupée net juste avant chaque révélation (silence 0,3-0,6 s), graves de la musique ~12 dB sous la voix.
# Utilisation : from sound_kit import Kit ; k = Kit(N, SR, seed) ; k.whoosh(t0) ... ; k.music(dur, cuts, swells)
import numpy as np

class Kit:
    def __init__(self, n, sr=48000, seed=11):
        self.N, self.SR = n, sr; self.rng = np.random.default_rng(seed)
        self.hit = np.zeros(n); self.air = np.zeros(n)          # impacts (graves) / souffles, déclics, montées (aigus)
    # ---------- outils
    def _put(self, dst, sig, t0, g=1.0):
        i = int(t0 * self.SR); j = min(self.N, i + len(sig))
        if 0 <= i < self.N and j > i: dst[i:j] += sig[: j - i] * g
    def _x(self, d): return np.arange(int(d * self.SR)) / self.SR
    def _sm(self, x, n): return np.convolve(x, np.ones(n) / n, "same")
    def _noise(self, n): return self.rng.standard_normal(n)
    def _bp(self, x, lo, hi):          # passe-bande grossier par différence de moyennes glissantes
        a = max(1, int(self.SR / hi / 2)); b = max(a + 1, int(self.SR / lo / 2)); return self._sm(x, a) - self._sm(x, b)
    # ---------- sons
    def whoosh(self, t_cut, d=0.55, g=1.0):
        """souffle qui culmine sur la coupe (filtre qui s'ouvre puis se referme)"""
        x = self._x(d); n = self._noise(len(x)); env = np.sin(np.pi * np.clip(x / d, 0, 1)) ** 2
        lo = self._bp(n, 300, 2500); hi = self._bp(n, 1500, 7000); k = np.clip(x / d, 0, 1)
        s = (lo * (1 - k) + hi * k) * env * 2.2; self._put(self.air, s, t_cut - d * 0.6, g)
    def impact(self, t0, g=1.0, f0=48.0, tail=1.6):
        """coup sourd : sub qui descend + attaque bruitée + petite réverbe"""
        x = self._x(tail); f = f0 * (1.6 - 0.6 * np.minimum(x / 0.12, 1))
        sub = np.sin(2 * np.pi * np.cumsum(f) / self.SR) * np.exp(-x * 3.2)
        att = self._bp(self._noise(len(x)), 80, 1800) * np.exp(-x * 38) * 2.5
        rev = self._bp(self._noise(len(x)), 120, 900) * np.exp(-x * 4.5) * 0.25
        self._put(self.hit, (sub * 1.4 + att + rev), t0, g)
    def riser(self, t_end, d=2.2, g=1.0):
        """montée de tension (bruit qui s'ouvre + son qui monte), coupée net à t_end"""
        x = self._x(d); k = x / d; n = self._noise(len(x))
        nz = self._bp(n, 400 + 3000 * k.mean(), 6000) * (k ** 2.2) * 1.6
        tone = np.sin(2 * np.pi * np.cumsum(110 * 2 ** (2.2 * k)) / self.SR) * (k ** 2.5) * 0.5
        trem = 0.75 + 0.25 * np.sin(2 * np.pi * (4 + 10 * k) * x)
        self._put(self.air, (nz + tone) * trem, t_end - d, g)
    def click(self, t0, g=1.0, f=2400.0):
        x = self._x(0.06); s = (self._bp(self._noise(len(x)), 1500, 7000) * 1.6 + np.sin(2 * np.pi * f * x) * 0.6) * np.exp(-x * 110)
        self._put(self.air, s, t0, g)
    def tick(self, t0, g=1.0): self.click(t0, g * 0.6, 3800.0)
    def thud(self, t0, g=1.0, f0=70.0):
        x = self._x(0.3); s = np.sin(2 * np.pi * np.cumsum(f0 - 35 * x / 0.3) / self.SR) * np.exp(-x * 20) + self._bp(self._noise(len(x)), 100, 1200) * np.exp(-x * 40)
        self._put(self.hit, s, t0, g)
    def sub_drop(self, t0, g=1.0):
        x = self._x(2.4); s = np.sin(2 * np.pi * np.cumsum(70 * np.exp(-x * 0.9) + 28) / self.SR) * np.minimum(x / 0.02, 1) * np.exp(-x * 1.2)
        self._put(self.hit, s, t0, g)
    def reverse(self, t_end, d=1.2, g=1.0):
        """aspiration inversée (souffle qui monte jusqu'à t_end)"""
        x = self._x(d); n = self._bp(self._noise(len(x)), 200, 5000); env = (x / d) ** 3
        self._put(self.air, n * env * 2.0, t_end - d, g)
    def stinger(self, t0, g=1.0):
        """coup final (carton du titre) : impact + traîne grave"""
        self.impact(t0, g * 1.2, 42.0, 3.0); self.reverse(t0, 1.0, g * 0.8)
    # ---------- musique
    def music(self, dur, cuts=(), swells=(), quiet=(), bpm=43.0, seed=5):
        """nappe très grave en si + pulsation lente ; cuts = instants de coupure nette (silence avant révélation) ;
        swells = (t, durée) montées de la nappe ; quiet = (t0, t1) passages très bas"""
        SR, N = self.SR, self.N; t = np.arange(N) / SR; rng = np.random.default_rng(seed)
        def saw(f): return 2 * ((t * f) % 1) - 1
        nt = lambda m: 440 * 2 ** ((m - 69) / 12)
        pad = np.zeros(N)
        for m, a in ((35, 1.0), (42, 0.7), (47, 0.55), (50, 0.25)):          # B1, F#2, B2, D3 (si mineur, très grave)
            f = nt(m); pad += (saw(f) + saw(f * 1.003) + saw(f * 0.997)) * a
        pad = self._sm(self._sm(pad, 70), 70)                                    # coupe les aigus
        pad *= 0.75 + 0.25 * np.sin(2 * np.pi * 0.05 * t + 1) ** 2               # respiration lente
        ph = (t * bpm / 60) % 1; pulse = np.sin(2 * np.pi * nt(35) * t) * np.exp(-ph * 7) * 1.4 + np.sin(2 * np.pi * nt(23) * t) * np.exp(-ph * 4) * 1.2
        sh = np.zeros(N)                                                          # rares notes aiguës, très douces (inquiétantes)
        for k in range(int(dur / 6)):
            t0 = 3 + k * 6 + rng.random() * 2; f = nt([71, 74, 78, 73][k % 4]); x = np.arange(int(3 * SR)) / SR
            self._put(sh, np.sin(2 * np.pi * f * x) * np.exp(-x * 1.2) * np.minimum(x / 0.4, 1), t0, 0.12)
        lvl = np.ones(N)
        for (a, b) in quiet: lvl *= 1 - 0.75 * np.clip(np.minimum((t - a) / 0.3, (b - t) / 0.3), 0, 1)
        for (a, d) in swells: lvl *= 1 + 0.6 * np.clip(np.minimum((t - a) / d, 1), 0, 1) * (t < a + d + 1.5) * np.clip((a + d + 1.5 - t) / 1.5, 0, 1)
        for c in cuts: lvl *= np.clip(np.abs(t - c - 0.15) / 0.3, 0, 1) ** 0.5 * (1 - 0.95 * ((t > c - 0.05) & (t < c + 0.35)))
        fade = np.clip(t / 1.5, 0, 1) * np.clip((dur - t) / 1.2, 0, 1)
        return (pad / (np.abs(pad).max() + 1e-9) * 0.8 + pulse * 1.0 + sh) * lvl * fade

    # ---------- musique v2 (après écoute utilisateur du 2026-11-13 : la v1 était inaudible) ----------
    def music2(self, dur, cuts=(), swells=(), quiet=(), bpm=43.0, seed=5):
        """musique sombre et audible : accords lents en si mineur (Si m - Sol - Mi m - Fa#, 8 s chacun) en nappe de cordes
        (médiums présents), drone grave, motif de piano feutré lent (une note toutes les 1,4 s), pulsation de basse douce.
        cuts = coupures nettes avant les révélations ; swells = (t, durée) montées ; quiet = (t0, t1) passages très bas."""
        SR, N = self.SR, self.N; t = np.arange(N) / SR; rng = np.random.default_rng(seed)
        nt = lambda m: 440 * 2 ** ((m - 69) / 12)
        CH = [(47, 50, 54), (43, 47, 50), (40, 43, 47), (42, 46, 49)]        # Si m, Sol, Mi m, Fa# (graves, voix serrées)
        SEG = 8.0; pad = np.zeros(N); drone = np.zeros(N); pno = np.zeros(N)
        def put(dst, sig, t0, g=1.0):
            i = int(t0 * SR); j = min(N, i + len(sig))
            if 0 <= i < N and j > i: dst[i:j] += sig[: j - i] * g
        for c in range(int(dur / SEG) + 1):
            ch = CH[c % 4]; x = np.arange(int((SEG + 2.5) * SR)) / SR; e = np.clip(np.minimum(x / 2.0, (SEG + 2.5 - x) / 2.5), 0, 1)
            sig = np.zeros(len(x))
            for m in ch:
                for det in (0.998, 1.0, 1.003):
                    f = nt(m) * det; sig += (2 * ((x * f) % 1) - 1) * (1 + 0.15 * np.sin(2 * np.pi * 5.1 * x + m))   # cordes (dents de scie + vibrato léger)
            sig = self._sm(self._sm(sig, 22), 22)                               # filtre doux : garde les médiums, enlève l'aigre
            put(pad, sig * e, c * SEG)
            xd = np.arange(int((SEG + 2.5) * SR)) / SR; fd = nt(ch[0] - 12)
            put(drone, (np.sin(2 * np.pi * fd * xd) + 0.5 * np.sin(2 * np.pi * 2 * fd * xd)) * np.clip(np.minimum(xd / 2.0, (SEG + 2.5 - xd) / 2.5), 0, 1), c * SEG)
        per = 60 / bpm; motif = [0, 2, 1, 2, 0, 3, 1, 2]
        for q in range(int(dur / per)):
            ch = CH[int(q * per / SEG) % 4]; m = ch[motif[q % 8] % 3] + 12 + (12 if q % 8 == 5 else 0)
            x = np.arange(int(2.6 * SR)) / SR; f = nt(m)
            note = (np.sin(2 * np.pi * f * x) + 0.35 * np.sin(4 * np.pi * f * x) * np.exp(-x * 3) + 0.12 * np.sin(6 * np.pi * f * x) * np.exp(-x * 5)) * np.exp(-x * 1.6) * np.minimum(x / 0.006, 1)
            put(pno, note, q * per + 0.02 * rng.standard_normal(), 0.55 + 0.2 * (q % 4 == 0))
        ph = (t * bpm / 60) % 1; pulse = np.sin(2 * np.pi * nt(35) * t) * np.exp(-ph * 6)
        pad /= np.abs(pad).max() + 1e-9; drone /= np.abs(drone).max() + 1e-9; pno /= np.abs(pno).max() + 1e-9
        mus = pad * 0.7 + drone * 0.45 + pno * 0.4 + pulse * 0.35
        lvl = np.ones(N)
        for (a, b) in quiet: lvl *= 1 - 0.8 * np.clip(np.minimum((t - a) / 0.3, (b - t) / 0.3), 0, 1)
        for (a, d) in swells: lvl *= 1 + 0.5 * np.clip((t - a) / d, 0, 1) * np.clip((a + d + 2 - t) / 2, 0, 1)
        for c in cuts: lvl *= 1 - 0.97 * np.clip(1 - np.abs(t - (c + 0.15)) / 0.3, 0, 1) ** 0.3   # coupure nette avant la révélation
        fade = np.clip(t / 1.5, 0, 1) * np.clip((dur - t) / 1.2, 0, 1)
        return mus * lvl * fade

    # ---------- musique v3 (2026-11-13, calquée sur la vidéo de référence de l'utilisateur, analysée image + son) ----------
    # note aiguë tenue en continu (fa# ~740 Hz, doublée à l'octave grave, vibrato lent) ; montées d'accords (2-3 s) sur les moments
    # visuels forts ; glissandos de la note sur les grandes transitions ; silences nets avant les révélations ; cœur grave doux
    # (~75 bpm, ~85 Hz) pendant le suspense ; grondement sourd quand la menace est là ; accord final sur le titre.
    def music3(self, dur, silences=(), swells=(), glides=(), hearts=(), rumbles=(), title_at=None, seed=5):
        SR, N = self.SR, self.N; t = np.arange(N) / SR; rng = np.random.default_rng(seed)
        nt = lambda m: 440 * 2 ** ((m - 69) / 12)
        def put(dst, sig, t0, g=1.0):
            i = int(t0 * SR); j = min(N, i + len(sig))
            if 0 <= i < N and j > i: dst[i:j] += sig[: j - i] * g
        # note tenue (avec glissandos)
        bend = np.zeros(N)
        for (a, semis) in glides:                                              # glissando : la note glisse puis revient
            k = np.clip((t - a) / 0.6, 0, 1); back = np.clip((t - a - 1.4) / 1.2, 0, 1); bend += semis * (np.sin(np.pi / 2 * k) - back * np.sin(np.pi / 2 * k))
        f = nt(78) * 2 ** (bend / 12) * (1 + 0.004 * np.sin(2 * np.pi * 4.6 * t))
        ph = np.cumsum(f) / SR
        tone = np.sin(2 * np.pi * ph) + 0.08 * np.sin(4 * np.pi * ph) + 0.4 * np.sin(np.pi * ph) + 0.18 * np.sin(2 * np.pi * np.cumsum(nt(47) * np.ones(N)) / SR)
        tone *= 0.8 + 0.2 * np.sin(2 * np.pi * 0.07 * t + 1) ** 2
        # montées d'accords (si mineur, harmoniques 300-1500 Hz)
        sw = np.zeros(N)
        for (a, d) in swells:
            x = np.arange(int((d + 1.8) * SR)) / SR; e = np.clip(x / d, 0, 1) ** 1.6 * np.clip((d + 1.8 - x) / 1.8, 0, 1)
            sig = sum(np.sin(2 * np.pi * nt(m) * x * (1 + 0.003 * np.sin(2 * np.pi * 5 * x + m))) * w for m, w in ((59, 1), (62, 0.8), (66, 0.9), (71, 0.6), (74, 0.45), (78, 0.35)))
            put(sw, sig * e, a - d * 0.6)
        if title_at is not None:                                               # accord final (titre)
            x = np.arange(int(2.6 * SR)) / SR; e = np.minimum(x / 0.04, 1) * np.exp(-x * 1.1)
            put(sw, sum(np.sin(2 * np.pi * nt(m) * x) * w for m, w in ((47, 1), (54, 0.8), (59, 0.8), (62, 0.6), (66, 0.6), (71, 0.4))) * e, title_at, 1.6)
        # cœur grave doux
        hb = np.zeros(N)
        for (a, b) in hearts:
            tt = a
            while tt < b:
                x = np.arange(int(0.35 * SR)) / SR; beat = np.sin(2 * np.pi * np.cumsum(92 - 30 * x / 0.35) / SR) * np.exp(-x * 16) * np.minimum(x / 0.008, 1)
                put(hb, beat, tt); put(hb, beat, tt + 0.27, 0.6); tt += 0.8
        # grondement sourd
        ru = np.zeros(N)
        for (a, b) in rumbles:
            n = rng.standard_normal(int((b - a + 1.0) * SR)); n = self._sm(self._sm(n, 160), 160); x = np.arange(len(n)) / SR
            put(ru, n * np.clip(np.minimum(x / 0.8, (b - a + 1.0 - x) / 0.8), 0, 1), a - 0.3)
        tone /= np.abs(tone).max() + 1e-9; sw /= np.abs(sw).max() + 1e-9; hb /= np.abs(hb).max() + 1e-9; ru /= np.abs(ru).max() + 1e-9
        lvl = np.ones(N)
        for c in silences: lvl *= 1 - np.clip(1 - np.abs(t - c) / 0.28, 0, 1) ** 0.25 * 0.97             # silence net autour de c
        fade = np.clip(t / 1.2, 0, 1) * np.clip((dur - t) / 0.8, 0, 1)
        return tone * lvl * fade, sw * lvl, hb * lvl, ru * lvl

    # ---------- musique v4 (2026-11-13, consigne utilisateur : « inquiétante mais légère, quelques notes qui changent de temps en temps,
    # des notes assez longues, pas trop fortes ») ----------
    def music4(self, dur, dips=(), seed=4):
        """longues notes tenues (5-8 s) en si mineur, deux voix douces (sinus + triangle légèrement désaccordés, attaque lente),
        une note aiguë lointaine de temps en temps ; dips = instants où la musique s'efface brièvement (avant une révélation)."""
        SR, N = self.SR, self.N; t = np.arange(N) / SR; rng = np.random.default_rng(seed)
        nt = lambda m: 440 * 2 ** ((m - 69) / 12)
        def put(dst, sig, t0, g=1.0):
            i = int(t0 * SR); j = min(N, i + len(sig))
            if 0 <= i < N and j > i: dst[i:j] += sig[: j - i] * g
        def voice(m, d, a=1.6, r=2.4):
            x = np.arange(int((d + r) * SR)) / SR; f = nt(m)
            tri = lambda ff: 2 * np.abs(2 * ((x * ff) % 1) - 1) - 1
            s = np.sin(2 * np.pi * f * x) * 0.7 + tri(f * 1.002) * 0.25 + np.sin(2 * np.pi * f * 0.5 * x) * 0.25
            return s * np.clip(np.minimum(x / a, (d + r - x) / r), 0, 1) * (1 + 0.06 * np.sin(2 * np.pi * 0.3 * x))
        low = [47, 47, 43, 45, 47, 42, 43, 42]                                 # si, si, sol, la, si, fa#, sol, fa# (graves)
        up = [54, 50, 55, 52, 54, 49, 50, 54]                                  # tierces / quintes au-dessus
        mus = np.zeros(N); tt = 0.0; q = 0
        while tt < dur:
            d = 5.5 + 2.5 * rng.random()
            put(mus, voice(low[q % 8], d), tt, 0.8); put(mus, voice(up[q % 8], d * 0.9, 2.2, 2.6), tt + 0.8, 0.45)
            if q % 2 == 1: put(mus, voice(up[q % 8] + 12 + (3 if q % 4 == 3 else 0), 3.5, 1.2, 3.0), tt + 2.5, 0.22)   # note aiguë lointaine
            tt += d; q += 1
        lvl = np.ones(N)
        for c in dips: lvl *= 1 - 0.75 * np.clip(1 - np.abs(t - c) / 0.5, 0, 1)
        fade = np.clip(t / 2.0, 0, 1) * np.clip((dur - t) / 1.5, 0, 1)
        return mus / (np.abs(mus).max() + 1e-9) * lvl * fade
