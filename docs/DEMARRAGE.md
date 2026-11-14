# Démarrage express (nouvelle session) — lire CE fichier seulement, le reste à la demande

Référence actuelle : *Le Mur* ép. 1 v6 (2026-11-14). Répondre en français, court. Un pas à la fois, validé par l'utilisateur.
Commit + push après chaque étape. Ne jamais supprimer/écraser sans accord. Pas de PR.

## Ce qu'on fait
Vidéos 3D verticales 1080x1920, ~68 s (60-90), fiction angoissante originale, narration « tu », voix off unique,
sous-titres karaoké (blanc, mot prononcé #FF9A3C), fin = choix A/B en commentaire + carton « TITRE — ÉPISODE n→n+1 ».
Structure : accroche-choc (0-3 s) → « Imagine. » → monde → 2-3 règles → règle enfreinte → révélation → tension → choix.

## Recette validée (détails : fichier entre parenthèses, à n'ouvrir que si besoin)
- **Voix** : voix clonée de l'utilisateur sur Fish Audio (s1), une balise par phrase : accroche `(scared)(whispering)`,
  tout le reste `(serious)(soft tone)`, vitesse 1.0. `tools/tts_ia.py` + `tools/aligne_mots.py` ; config à copier :
  `productions/mur-ep01/voix_ia/voix_ia.json` + `SCRIPT_FISH.md` (`docs/audio.md`). **Pas ElevenLabs.**
- **Personnages** : cartes 2D (`studio/src/videos/mur/people.ts`), peur = cernes violets + sourcils inversés ;
  un monstre signature lumineux, sans yeux, apparitions partielles (`longs.ts`, `docs/personnages.md`).
- **Image** : ~59 sous-plans de 1-2,5 s calés sur les mots (`CUTS` de `mur/story.ts`), drones rasants, zooms éclair,
  flashs de 2 images, sombre + accents saturés, carton final au décor de la série (`docs/direction-artistique.md`).
- **Son** : voix > bruitages > musique douce ; bruitages nombreux et discrets ; monstre = crac crac crac + note « tiiin » ;
  modèle `tools/mur_mix.py` (`docs/audio.md`).
- **Rendu / commandes** : `docs/serie.md` (stills 0.5, rendu par morceaux, remux si seul le son change).

## Nouvelle série
Code : copier `templates/bridge/` vers `studio/src/videos/<serie>/` puis reprendre les modules de `mur/`.
Idées : `docs/STRATEGIE_SERIE.md`. Suivi : `docs/episodes.md`. Brief : commande `/nouvel-episode <n> "<sujet>"`.
