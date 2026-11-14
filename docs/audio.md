# Audio — réglages validés (2026-11-14, *Le Mur* ép. 1 v6) : défaut de toutes les nouvelles vidéos

Remplace `docs/VOIX.md` (ElevenLabs/George, historique) pour la voix.

## Voix off
- **Fish Audio**, modèle `s1`, voix clonée de l'utilisateur « Narrateur Dramatique et Captivant » (`reference_id` dans
  `productions/mur-ep01/voix_ia/voix_ia.json` — copier ce fichier pour un nouvel épisode). Clé injectée par le proxy (aucune clé à saisir).
- Script `SCRIPT_FISH.md` : **une phrase par ligne, chaque phrase précédée de sa balise** (vérifié par `--check`).
  - Accroche : `(scared)(whispering)` (ex. « Surtout… (break) ne bouge pas. »), puis `{pause 0.2}`.
  - Tout le reste : `(serious)(soft tone)` — narrateur posé, grave, intrigant, prononcé comme « Imagine. » (fin qui retombe).
  - Vitesse 1.0 ; `blanc_max` 0.3 s (silences courts et naturels) ; `{pause X}` pour une pause voulue.
  - Ligne `OUTRO:` « Abonne-toi pour l'épisode deux. » : générée par `--outro` dans la continuité du récit (intonation affirmative).
- Commandes : `python3 tools/tts_ia.py productions/<ep> --check | --test N | --wav | --outro` ;
  minutage `python3 tools/aligne_mots.py voix_ia/voice.wav <words_modele.json> voix_ia/words.json` (faster-whisper + alignement caractères).

## Mix (`tools/mur_mix.py`, modèle à copier)
- Hiérarchie : **voix la plus forte > bruitages > musique**. Musique douce (notes tenues, `Kit.music4`, `vref - 7 dB`, duck −3 dB sous la voix)
  + couche de tension ; pulsation grave qui **accélère** aux moments de stress (`pulse`). Loudness finale −15 LUFS, TP −1.2.
- Bruitages nombreux mais discrets, calés sur les plans (« qu'on entend mais pas beaucoup ») :
  - Monstre : sifflement `long_hiss`, **craquements d'os `crac3`** (3 « crac » secs, audibles, `vref − 9 dB`), **note « tiiin »** (`tiin` : aiguë,
    demi-ton frottant, trémolo, ~2,6 s, `−15 dB`) à chaque apparition qui fait peur.
  - Coupes : souffles `whoosh` (gain ×2/3 depuis la v3 : ils frottaient trop), zoom éclair plus marqué, impacts sur les flashs.
  - Vie : feu de camp `fire` + braises `pops`, foule (`crowd_shuffle`, `crowd_breath`), pas dans la terre (`steps`), terre/poussière `sand`,
    grillons de nuit `crickets`, vent `wind_city`, oiseaux `wings`, bougie `puff`.
  - Course : pas continus (`steps`, 0,29 s) puis marche (0,5 s) — jamais un seul échantillon de 1 s.
  - Final : stinger + « clic » + sting au passage épisode n → n+1.
- Banque d'échantillons : `productions/sfx_lib/*.mp3` ; synthèses : `tools/sound_kit.py` (Kit) et fonctions de `mur_mix.py`.
- Le son suit les timings image : verrouiller l'image (CUTS) avant le mix. Son seul modifié → remux sans re-rendu (`serie.md`).
