# Reprise de session (2026-11-13) — à lire en premier, rien d'autre sauf besoin

## État
- *L'appel* ép. 1-3 : terminés, publiés (vidéos dans `archives_videos/`, non versionnées).
- *Le Mur* ép. 1 (en cours) : script validé (`productions/mur-ep01/SCRIPT.md`, 27 plans décrits), voix perso faite et validée
  (`productions/mur-ep01/voix_perso/`, réglages F3), mix validé (`python3 tools/mur_mix.py` -> `studio/public/mur/mix.wav`),
  code `studio/src/videos/mur/` (story.ts, world.ts, people.ts, longs.ts, look.ts, Mur.tsx, Planche.tsx), composition `MurEp1`.
- Style complet : `docs/STYLE_PERSONNAGES.md` (section « Fiche de reproduction complète ») ; voix : `docs/VOIX.md`.

## Reste à faire (dans l'ordre)
1. Plan 1 : rapprocher la caméra pour voir en grand la main à 7 doigts posée sur l'arête du mur.
2. Détails vivants **différents** dans chaque plan (liste dans le dernier échange : doigts qui tapotent, yeux qui s'ouvrent, tête qui tourne,
   jeune qui tisonne le feu + étincelles, bougie qui s'éteint, lumière rouge qui balaie le visage, poussière sous tes pas,
   **ombre de l'entrée qui monte du bas vers le haut sur ton visage** aux plans 25-26, main qui hésite au plan 27…).
3. UNE planche des 27 plans (stills échelle 0.5, `node scripts/stills.mjs MurEp1 ...`) à faire valider par l'utilisateur.
4. Rendu final : `studio/scripts/render_parallel.sh <queue>` (ligne : `MurEp1 out/v1_mur <TOTAL> out/snap_mur/src public/mur/mix.wav le_mur_ep1`,
   copier d'abord `src` dans `out/snap_mur/`), puis version 2K allégée (`ffmpeg -crf 23 -maxrate 9M`) et envoi TikTok + 2K en pièces jointes.

## Règles de travail (économie de tokens)
- Ne pas relire de gros fichiers ; utiliser grep/sed. Une seule planche d'images par étape ; ne pas ouvrir d'images inutiles.
- Rendus : les tâches de fond s'arrêtent après 2 h -> relancer (reprise automatique des morceaux).
- Commit + push après chaque étape sur `claude/create-claude-md-ifff0x`. Réponses courtes, en français.
