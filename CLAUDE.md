# CLAUDE.md — instructions permanentes du projet

Ce fichier est lu automatiquement par Claude Code au début de chaque session.
Il fixe le cadre ; le détail technique est dans les fichiers de documentation listés plus bas.

## Objectif
Créer des **vidéos 3D verticales de 60 à 90 secondes** (TikTok / Shorts / Reels) :
des histoires vraies et surprenantes racontées en voix off, avec des personnages cartoon 2D
dans un monde 3D coloré (contours à l'encre, textures peintes, flou de profondeur, caméras glissées,
musique et bruitages synthétisés). Tout est rendu en local avec three.js dans Remotion,
**sans générateur vidéo IA**.

- Format : 1080x1920, 30 fps ; export final 2K 1440x2560 (`--scale 1.3333`).
- Durée : 60-90 s (script à ~3,7 mots/s, soit ~220-330 mots). Cette fourchette prime sur
  les « 55-70 s » mentionnés dans `SKILL.md`.
- Exemple de référence : *The Bridge That Fell for a Song* (pont de Broughton, 1831), source dans `templates/bridge/`.

## Technologies
- **Remotion** 4 + `@remotion/three`, **three.js**, `@react-three/fiber`, `@react-three/postprocessing` (TypeScript / React).
- **Canvas2D** pour les personnages (`toon.ts`) et les textures peintes (`paint.ts`).
- **Python 3** pour le son (synthèse SFX, musique, mixage) et les scripts de QA.
- **Node** pour les stills (`bridge-stills.mjs`), **ffmpeg** pour le mux et les contrôles.
- Props 3D : kits Kenney CC0, recolorés.

## Règles de développement
1. Suivre le pipeline de `SKILL.md` dans l'ordre : faits → script → voix → plan des plans (`story.ts`)
   → monde → personnages → post → son → vérifications de look → rendu final → livraison.
2. Toute nouvelle vidéo part d'une **copie** de `templates/bridge/` vers `src/videos/<nom>/` ;
   ne jamais modifier les templates pour un projet donné.
3. Histoire, personnages et voix sont **toujours originaux**. Les références (`references/`)
   servent à l'étude du style uniquement : ne jamais les publier, les envoyer ni copier leurs scripts,
   personnages ou plans ; ne jamais citer la chaîne étudiée.
4. Pas de sous-titres ni de textes à l'écran, anglais uniquement, voix au ton constant,
   blagues = faits réels vérifiés (source en tête de `SCRIPT.md`).
5. Tout est calé sur `words.json` : chaque réaction visuelle tombe 0-3 images avant son mot.
   Verrouiller les timings image **avant** de produire le son.
6. Mix standard : musique +3 dB, SFX -6 dB, voix inchangée. Mux avec `-map 0:v:0 -map 1:a:0`.
7. Les paramètres en pixels du post-traitement s'échelonnent avec la hauteur de sortie / 1920.
8. Après chaque modification de code : `npx tsc --noEmit` ; pas de fichiers `.ts` temporaires dans `out/`.
9. Rendus : définir `REMOTION_TMP` / `TEMP` / `TMP` sur un disque spacieux (chaque bundle copie ~1,3 Go).
10. Ne jamais supprimer ni écraser un fichier existant sans accord explicite ; sauvegarder après chaque étape.
11. Commits clairs et ciblés, sur la branche de travail indiquée ; pas de PR sans demande.

## Économie de tokens
- Lire d'abord ce fichier, puis **seulement** la section utile de `SKILL.md` ou du rapport concerné ;
  utiliser `offset`/`limit` ou `grep` plutôt que de lire des fichiers entiers.
- Ne pas ouvrir les images de `references/frames/` et `references/sheets/` sauf pour une comparaison
  visuelle explicite ; préférer 1-3 images bien choisies.
- Ne pas relire un fichier qu'on vient de modifier ; ne pas reformuler ce qui est déjà établi.
- Réponses courtes : résultat, fichiers touchés, prochaine étape. Pas de récapitulatif exhaustif.
- Modifier par petites éditions (`Edit`) plutôt que réécrire des fichiers complets.
- Sous-agents uniquement quand c'est nécessaire (vérification de look, sandboxes) ;
  leur demander un message final ≤ 150-200 mots.
- Grouper les appels d'outils indépendants dans une même réponse.
- Les stills de contrôle se font à l'échelle 0.5 ; le rendu 2K complet seulement à la fin.

## Documentation du projet
| Fichier | Contenu |
|---|---|
| `README.md` | Présentation, installation, structure du dépôt |
| `SKILL.md` | Pipeline complet, valeurs de look finales, boucle d'ajustement, pièges connus |
| `references/STYLE_BIBLE.md` | Formule de script et de mise en image mesurée sur 20 shorts |
| `references/reports/CONTEXT.md` | Contexte partagé pour les agents d'analyse |
| `references/reports/{motion,depth,textures,characters,lighting,outlines,grade}.md` | Mesures chiffrées par thème |
| `references/frames/`, `references/sheets/` | Images de référence (étude privée uniquement) |
| `templates/SCRIPT_example.md` | Exemple de script avec faits et sources |
| `templates/bridge/` | Code source complet de la vidéo exemple (monde, personnages, encre, flou, étalonnage, caméras) |
| `templates/audio/` (`cues.md`) | Synthèse des SFX, musique, mixage avec ducking et loudness |
| `templates/scripts/` | Stills, planches comparatives, fusion des sandboxes, QA image par image |
| `templates/sandbox_index_example.tsx` | Point d'entrée type pour une sandbox |
