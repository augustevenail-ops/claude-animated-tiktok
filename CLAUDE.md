# CLAUDE.md — instructions permanentes du projet

Ce fichier est lu automatiquement par Claude Code au début de chaque session.
Il fixe le cadre ; le détail technique est dans les fichiers de documentation listés plus bas.

## Objectif
Créer des **vidéos 3D verticales de 60 à 90 secondes** (TikTok / Shorts / Reels), **en français, sous-titrées** :
des **fictions angoissantes, stressantes, mystérieuses ou intrigantes** (jamais joviales ni comiques),
inventées ou inspirées de l'ambiance de films connus (ex. *La Plateforme*, *Hunger Games*), racontées en voix off,
avec des personnages cartoon dans un monde 3D (contours à l'encre, textures peintes, flou de profondeur,
caméras glissées, musique et bruitages synthétisés). Tout est rendu en local avec three.js dans Remotion,
**sans générateur vidéo IA**.

**Direction artistique (décision utilisateur du 2026-11-11)** : partir de la vidéo Apokalyps
(`docs/REFERENCE_APOKALYPS.md`) — couleurs parfois sombres, lumière motivée, ambiance intrigante et stressante —
tout en gardant de la **saturation** et la construction du style bridge (personnages, encre, caméra) :
zones sombres désaturées + accents saturés (lumières pratiques chaudes, rouge, cyan…), jamais une image grise et terne.

- Format : 1080x1920, 30 fps ; export final 2K 1440x2560 (`--scale 1.3333`).
- Durée : 60-90 s (français à ~4,5 syllabes/s ≈ 3 mots/s, soit ~180-270 mots). Cette fourchette prime sur
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
3. Histoire, personnages et voix sont **toujours originaux**. Une histoire peut reprendre l'**ambiance** ou le
   **concept général** d'un film connu (huis clos vertical, jeu de survie…), jamais ses noms, personnages, répliques,
   scènes ou visuels reconnaissables. Les références (`references/`, vidéo Apokalyps) servent à l'étude du style
   uniquement : ne jamais les publier, les envoyer ni copier leurs scripts, personnages ou plans ; ne jamais citer
   les chaînes étudiées.
4. **Français** uniquement ; **sous-titres karaoké** : blancs, et le mot en train d'être prononcé en **orange sable #FF9A3C** (toutes les séries, décision du 2026-11-13 ; `KARAOKE` dans `shared/overlay.tsx`) comme la vidéo Apokalyps (spec dans
   `docs/REFERENCE_APOKALYPS.md` §9) ; textes diégétiques autorisés (SMS, post-it, badges) ; voix au ton constant de
   conteur, la tension vient des mots et des pauses. Ces règles **priment sur** « English only » et « no captions »
   de `SKILL.md`/`STYLE_BIBLE.md` et sur la formule humoristique (« Luckily / Unluckily », faits réels).
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
- Ne pas relire un fichier qu'on vient de modifier ; ne pas reformuler ce qui est déjà établi.
- Réponses courtes : résultat, fichiers touchés, prochaine étape. Pas de récapitulatif exhaustif.
- Modifier par petites éditions (`Edit`) plutôt que réécrire des fichiers complets.
- Sous-agents uniquement quand c'est nécessaire (vérification de look, sandboxes) ;
  leur demander un message final ≤ 150-200 mots.
- Grouper les appels d'outils indépendants dans une même réponse.
- Les stills de contrôle se font à l'échelle 0.5 ; le rendu 2K complet seulement à la fin.

## Démarrage rapide (nouvelle session)
L'analyse complète du dépôt est faite (2026-11-11) : **ne pas la refaire**. Lire dans l'ordre, selon le besoin :
1. `docs/WORKFLOW.md` — étapes de production + checklist « première vidéo ».
2. `docs/STYLE_ARTISTIQUE.md` — toutes les valeurs de style chiffrées (personnages, couleurs, encre, DOF, caméra, son).
3. `docs/ARCHITECTURE_TECHNIQUE.md` — dépendances, rôle de chaque module, contrats, commandes.
4. `docs/INVENTAIRE.md` — ressources, ce qui a été analysé, ce qui manque.
6. `docs/VOIX.md` — réglages voix validés, à appliquer tels quels.
5. `docs/REFERENCE_APOKALYPS.md` — **référence officielle n° 2** (voix, suspense, nuit, montage) : règles §7, écarts à trancher §8.

## Références officielles
1. Style « bridge » (`SKILL.md`, `references/`, `templates/bridge/`) : look, personnages 2D, caméra, son.
2. Vidéo Apokalyps (`docs/REFERENCE_APOKALYPS.md`) : **modèle de narration vocale** (voix grave proche, ~4,5 syll/s,
   micro-pauses avant les révélations), structure à retournements, lumière motivée de nuit, drone + basse pulsée.
   **Référence principale** depuis le 2026-11-11 pour la langue, les sous-titres, le ton, la structure et les couleurs.
   Décisions complètes (2026-11-11) : **toujours** finir par une question binaire A/B + « dis-le en commentaire »
   (étiquettes A/B à l'écran) ; narration à la **2ᵉ personne** (« tu », caméra subjective) ; personnages en
   **cartes 2D** du style bridge ; voix off par **synthèse vocale (TTS)** choisie par l'utilisateur, réglée selon la
   consigne voix du §7 (voix grave, ~4,5 syll/s, micro-pauses avant les révélations).
Ouvrir un rapport `references/reports/*.md` ou un fichier de `templates/` seulement pour le détail d'implémentation.

Points clés à retenir :
- Le dépôt contient le **code source** (templates) mais **pas** le projet Remotion (package.json, `src/Root.tsx`, `public/`),
  ni les modèles Kenney, ni voix, ni vidéos de référence : ils sont à créer/fournir (voir `docs/INVENTAIRE.md`).
- La grammaire caméra de `STYLE_BIBLE.md` (« ease-out bursts ») est obsolète : suivre `SKILL.md` / `story.ts` (glissés smootherstep).
- Le son reprend les timings d'image (`audio/timeline.py` miroir de `story.ts`) : verrouiller l'image avant le son.

- Ménage du 2026-11-13 : images de référence (`references/frames`, `sheets`), essais audio et rendus intermédiaires supprimés ;
  vidéos finales gardées dans `archives_videos/` (non versionnées).

## Documentation du projet
| Fichier | Contenu |
|---|---|
| `docs/serie.md` | **Point d'entrée nouvelle série / épisode** : format commun, recette, commandes clés |
| `docs/personnages.md` | Règles personnages et monstre signature (renvoie à `STYLE_PERSONNAGES.md`) |
| `docs/direction-artistique.md` | Image, montage en ~59 sous-plans, accroche, carton final propre à la série |
| `docs/audio.md` | **Voix (Fish Audio, voix clonée) et mix validés** : défaut actuel (remplace `VOIX.md`) |
| `docs/episodes.md` | Suivi des épisodes ; briefs dans `episodes/` (commande `/nouvel-episode`) |
| `docs/WORKFLOW.md` | Workflow complet et réutilisable de création vidéo |
| `docs/STYLE_ARTISTIQUE.md` | Fiche de style condensée et chiffrée |
| `docs/ARCHITECTURE_TECHNIQUE.md` | Pile technique, modules, chaîne de rendu et audio, commandes |
| `docs/INVENTAIRE.md` | Inventaire des ressources et statut d'analyse |
| `docs/REFERENCE_APOKALYPS.md` | Analyse de la vidéo de référence n° 2 et règles réutilisables |
| `docs/STRATEGIE_SERIE.md` | Règle de décision suite/nouvelle histoire selon les stats + idées d histoires angoissantes |
| `docs/VOIX.md` | Historique voix ElevenLabs (George) — remplacé par `docs/audio.md` |
| `README.md` | Présentation, installation, structure du dépôt |
| `SKILL.md` | Pipeline complet, valeurs de look finales, boucle d'ajustement, pièges connus |
| `references/STYLE_BIBLE.md` | Formule de script et de mise en image mesurée sur 20 shorts |
| `references/reports/CONTEXT.md` | Contexte partagé pour les agents d'analyse |
| `references/reports/{motion,depth,textures,characters,lighting,outlines,grade}.md` | Mesures chiffrées par thème |
| `templates/SCRIPT_example.md` | Exemple de script avec faits et sources |
| `templates/bridge/` | Code source complet de la vidéo exemple (monde, personnages, encre, flou, étalonnage, caméras) |
| `templates/audio/` (`cues.md`) | Synthèse des SFX, musique, mixage avec ducking et loudness |
| `templates/scripts/` | Stills, planches comparatives, fusion des sandboxes, QA image par image |
| `templates/sandbox_index_example.tsx` | Point d'entrée type pour une sandbox |
