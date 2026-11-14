# Séries — format commun et recette pour en lancer une nouvelle (2026-11-14)

Ce fichier est le point d'entrée pour **créer une nouvelle série** ou un nouvel épisode. Il résume ce qui a été validé
sur *L'appel* (ép. 1-3) et *Le Mur* (ép. 1, v6) ; le détail est dans `personnages.md`, `direction-artistique.md`, `audio.md`.

## Format commun (toutes les séries)
- Vidéo verticale 1080x1920, 30 fps, **60-90 s** (cible ~68 s), export TikTok + 2K (1440x2560).
- Fiction **angoissante / mystérieuse**, jamais comique ; histoire et personnages **originaux** (ambiance d'un film permise, jamais ses éléments).
- Narration à la **2ᵉ personne** (« tu »), voix off unique du narrateur (voix clonée de l'utilisateur, `audio.md`), en français.
- Structure : **accroche** (0-3 s, phrase-choc + image qui fait sursauter) → « Imagine. » → monde en une image → **règles numérotées**
  → règle enfreinte / révélation → montée de tension → **choix A/B** (« dis-le en commentaire », cartes vert/rouge) → carton final
  « TITRE — ÉPISODE n » qui bascule sur n+1 + « Abonne-toi pour l'épisode deux ».
- Sous-titres karaoké (blanc, mot prononcé orange #FF9A3C), HUD discret en haut (lieu, jour/nuit, compteur).
- ~59 sous-plans courts (1-2,5 s, ~1 s à la fin) : voir `direction-artistique.md`.

## Séries existantes
| Série | Concept | Code | Production |
|---|---|---|---|
| *L'appel* | huis clos, appels/règles (ép. 1-3 publiés ; code retiré le 2026-11-14, récupérable dans l'historique git) | — | — |
| *Le Mur* | labyrinthe infini, clairière, les « Longs » (géants pâles) la nuit | `studio/src/videos/mur/` | `productions/mur-ep01/` |
Idées de nouvelles histoires et règle suite / nouvelle série : `docs/STRATEGIE_SERIE.md`.

## Recette : nouvelle série
1. **Concept** (1 phrase) + **monstre / menace** signature + **décor** signature + 2-3 **règles** + un **chiffre** (compteur HUD).
2. Script (~190-210 mots, une phrase par ligne) → validation utilisateur.
3. Voix : `SCRIPT_FISH.md` (balises, `audio.md`) → `python3 tools/tts_ia.py productions/<ep> --wav` puis `--outro`
   → minutage `python3 tools/aligne_mots.py <voice.wav> <ref_words.json> <words.json>` → écoute validée → **verrouiller** `words.json`.
4. Code : copier `templates/bridge/` vers `studio/src/videos/<serie>/` (règle CLAUDE.md), puis reprendre les modules de `mur/`
   (`story.ts` ANCH/CUTS, `people.ts`, `longs.ts`, `world.ts`, `look.ts`, `MazeTop.tsx`) en les adaptant. Composition dans `src/Root.tsx`.
5. **Carton final propre à la série** : fond en référence au décor (ex. *Le Mur* : labyrinthe vu d'en haut, prop `bg` de `TitleCard`).
6. Planche des plans (stills 0.5) → validation → son (`tools/<serie>_mix.py` sur le modèle de `mur_mix.py`) → rendu → livraison.
7. Un pas à la fois : l'utilisateur valide chaque étape avant la suivante. Commit + push après chaque étape.

## Commandes clés
- Stills : `cd studio && REMOTION_TMP=<scratch> TEMP=<scratch> TMP=<scratch> node scripts/stills.mjs <Comp> <prefixe> <f1,f2,…> 0.5`
- Rendu : copier `studio/src` dans `studio/out/snap_<serie>/src`, écrire une file `out/queue_x.txt`
  (`<Comp> out/<dossier> <TOTAL images> out/snap_<serie>/src public/<serie>/mix.wav <nom>`),
  puis `bash scripts/render_parallel.sh out/queue_x.txt > out/<dossier>/render.log 2>&1` (morceaux de 300 images, ~15 min chacun, reprend les manquants).
- Son seul modifié : pas de re-rendu, remux `ffmpeg -i <video>.mp4 -i public/<serie>/mix.wav -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 192k -ar 48000 -shortest`.
- 2K allégé : `-c:v libx264 -preset slow -crf 23 -maxrate 9M -bufsize 18M`. Livrables copiés dans `archives_videos/` (non versionné).
