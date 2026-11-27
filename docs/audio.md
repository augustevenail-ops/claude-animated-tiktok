# Audio — réglages validés (2026-11-14, *Le Mur* ép. 1 v6) : défaut de toutes les nouvelles vidéos

Seule voix utilisée : plus d'ElevenLabs (ancienne doc retirée le 2026-11-14).

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

## Charabia TTS : contrôle obligatoire (incident du 2026-11-27)
- **Symptôme** : dans *Les Mots Gentils*, *Le Nom qui rapporte* et *Les Pouvoirs Nuls* (ép. 1), 0,3 à 2 s de mots inventés
  (« tu manges et rendes des mampars », « chcon chcon », « Pré-Nantin »…) ou un bruit de bouche entre deux phrases.
- **Cause 1 — Fish Audio** (`s2.1-pro-free`, `temperature 0.9`, passages de 3 phrases + phrase factice « Voilà ») : le modèle improvise
  parfois une suite de syllabes dans la pause entre deux phrases, surtout après un mot final tenu (« mètres. », « tête. », « court. »).
- **Cause 2 — notre filtre ne pouvait pas le voir** : le choix de prise se fait par alignement forcé CTC (MMS_FA) sur le texte attendu.
  L'aligneur ne connaît que les mots du script : il **étire le dernier mot de la phrase** sur tout le charabia (ex. « tête. » 1,34 s,
  « méchants. » 2,04 s) et le score moyen reste bon. La coupe de fin de phrase (`en[w1]` + silence) garde donc le charabia.
- **Règle désormais** (avant de verrouiller l'image) : `python3 tools/verif_charabia.py voix/voix_off_vN.wav voix/words_vN.json`
  doit répondre « OK ». Il croise trois signaux : mots entendus par faster-whisper absents du script, mot aligné trop long,
  son dans une pause. Chaque passage signalé : écouter, puis **régénérer la phrase** (autre prise) ou la couper.
  Dans les scripts `gen_v*.py`, écarter aussi toute prise dont le dernier mot d'une phrase dure plus de 0,9 s.
- **Réparation sans re-rendu** (vidéo déjà rendue) : `tools/coupe_charabia.py` retire le passage de la voix et la même durée d'image
  juste avant le plan suivant (coupure invisible), puis `sound_v2.py` (musique remise à neuf en boucle, bruitages recalés sur
  `words_v2.json` réaligné), `caps_v2.py` et `tools/assemble_v2.sh` (réassemblage des morceaux déjà rendus).
