# Reprise de session (2026-11-14) — à lire en premier, rien d'autre sauf besoin

## En cours : *L'hôpital* ép. 1 (nouvelle série, même univers que *Le Mur*)
- Branche de travail : `claude/affectionate-pascal-ztsueb`.
- Découpage validé (38 plans recalés sur la voix, tags, HUD, sound design) : `episodes/hopital-ep01-decoupage.md`.
- Voix **validée** : `productions/hopital-ep01/voix_ia/voice.wav` (69,3 s) + `words.json` ; réglages dans `docs/audio.md`.
- Personnages validés : `studio/src/videos/hopital/persos.ts`, planche `HopitalPlanche` (`productions/hopital-ep01/planche_persos.png`) :
  héros patient + bandage de travers sur tout le crâne (mèches sur les côtés, pas de frange), policiers, médecins, soignant (normal → infecté,
  veines en réseau qui poussent avec `grow`), fillette, 4 infectés. Lumière/reflets réalistes à ajouter au rendu des plans (pas au design).
- Étapes suivantes : images de référence des 38 plans (validation utilisateur avant toute animation) ; bande son (bruitages + musique) ;
  puis animation, rendu.


## État
- *L'appel* ép. 1-3 : terminés, publiés (vidéos dans `archives_videos/`, non versionnées).
- *Le Mur* ép. 1 (en cours) : script validé (`productions/mur-ep01/SCRIPT.md`, 27 plans décrits), voix perso faite et validée
  (`productions/mur-ep01/voix_perso/`, réglages F3), mix validé (`python3 tools/mur_mix.py` -> `studio/public/mur/mix.wav`),
  code `studio/src/videos/mur/` (story.ts, world.ts, people.ts, longs.ts, look.ts, Mur.tsx, Planche.tsx), composition `MurEp1`.
- Style complet : `docs/STYLE_PERSONNAGES.md` (section « Fiche de reproduction complète ») ; voix : `docs/VOIX.md`.

## Reste à faire
- **Prochaine session : chercher une nouvelle série** (lire `docs/serie.md`, puis `/nouvel-episode 01 "<sujet>"`). *Le Mur* ép. 1 terminé (v6).
- *Le Mur* ép. 1 : **rendu final fait (2026-11-14)**, 68,2 s : `archives_videos/le_mur_ep1_tiktok.mp4` (62 Mo) et `le_mur_ep1_2K.mp4` (44 Mo),
  puis **v2 rendue (2026-11-14)** après retours : 59 sous-plans courts (CUTS dans story.ts), accroche zoom/dézoom, drones ras du sol, mur des noms gravés,
  flashs 2 images, SFX enrichis : `archives_videos/le_mur_ep1_v2_tiktok.mp4` (64 Mo) et `le_mur_ep1_v2_2K.mp4` (49 Mo) ; **v3** (souffles des coupes −1/3, carton final sur labyrinthe vu d'en haut `mur/MazeTop.tsx`) :
  `archives_videos/le_mur_ep1_v3_tiktok.mp4` / `_v3_2K.mp4` ; **v5** (son seul, remuxé sur l'image v3/v4 : craquements d'os crac3, pas de course continus puis marche,
  note « tiiin » aux apparitions ; musique actuelle gardée) : `archives_videos/le_mur_ep1_v5_tiktok.mp4` / `_v5_2K.mp4`, en attente du retour. Règle : le fond du carton final est propre à chaque série (prop `bg` de TitleCard). Voix IA = voix clonée de l'utilisateur sur Fish Audio (`tools/tts_ia.py`, `productions/mur-ep01/voix_ia/`),
  minutage `tools/aligne_mots.py`, mix `tools/mur_mix.py` (MUR_VOIX=voix_ia par défaut). Narration « comme Imagine. » : grave, doux, vitesse 1 ; accroche en peur chuchotée.
- Rendu : copier `studio/src` dans `studio/out/snap_mur/src`, puis `bash scripts/render_parallel.sh out/queue_mur2.txt` (v2, sortie `out/v2_mur`) (~16 min / 300 images, ~2 h 10 au total).

## Règles de travail (économie de tokens)
- Ne pas relire de gros fichiers ; utiliser grep/sed. Une seule planche d'images par étape ; ne pas ouvrir d'images inutiles.
- Rendus : les tâches de fond s'arrêtent après 2 h -> relancer (reprise automatique des morceaux).
- Commit + push après chaque étape sur `claude/create-claude-md-ifff0x`. Réponses courtes, en français.
