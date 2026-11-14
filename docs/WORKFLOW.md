# Workflow de création d'une vidéo (60-90 s, 9:16)

Version opérationnelle de `SKILL.md` adaptée à notre objectif. Cocher chaque étape ; **sauvegarder/committer après chacune**.
Valeurs de style : `docs/STYLE_ARTISTIQUE.md`. Code : `docs/ARCHITECTURE_TECHNIQUE.md`.

## Étape 0 — Mise en place (une seule fois)
1. Créer le projet Remotion (TypeScript) et installer les versions de ARCHITECTURE_TECHNIQUE §1
   (`remotion`, `@remotion/three`, `@remotion/bundler`, `@remotion/renderer`, `@remotion/cli`, `three`, `@types/three`,
   `@react-three/fiber`, `@react-three/postprocessing`, `postprocessing`, `react`, `react-dom`).
2. Python : `numpy`, `scipy`, `Pillow` ; ffmpeg dans le PATH ; Chrome/Chromium avec WebGL.
3. Télécharger les kits Kenney CC0 ; copier les 26 `.glb` listés dans `world.ts` (`KENNEY`) vers `public/<nom>/kenney/`.
4. Copier `templates/scripts/` → `scripts/` ; corriger le chemin Chrome de `bridge-stills.mjs`, `ROOT` de `bridge_merge.py`,
   le chemin de sortie de `bridge_shots.py`.
5. Définir `REMOTION_TMP` sur un disque spacieux.
6. Validation : rendre quelques stills du bridge non modifié (copie de `templates/bridge/`) pour vérifier la pile.

## Étape 1 — Concept (fiction)
- Fiction **angoissante / mystérieuse / stressante**, inventée ou inspirée de l'**ambiance** d'un film connu
  (sans reprendre noms, personnages, scènes). Un lieu fort, une règle ou une menace claire, des objets-preuves visuels.
- En tête de `SCRIPT.md` : pitch en 2 lignes, inspiration éventuelle, lieu(x), personnages, objets-preuves.

## Étape 2 — Script en français (validation utilisateur obligatoire)
- 180-270 mots (~3 mots/s, ~4,5 syllabes/s). Formule (REFERENCE_APOKALYPS §1 et §7) : accroche anormale en une phrase →
  indices rassurants → contradiction prouvée par un objet → approche → retournement 1 → règle/test →
  retournement 2 plus fort → **question finale A/B + « dis-le en commentaire »** (toujours). Narration à la 2ᵉ personne (« tu »).
- Ne jamais décrire ce que l'image montre déjà. Sous-titres tout en blanc (pas de mot coloré). Après validation : « just do it ».

## Étape 3 — Voix
- `voice.wav` par **TTS français** (voix grave, ~4,5 syll/s, micro-pauses : REFERENCE_APOKALYPS §7) + `words.json` `[{ "w": "word", "s": 0.12, "e": 0.40 }, …]` (s/e obligatoires) via
  n'importe quel outil de reconnaissance vocale avec horodatage par mot ; **corriger les timings à la main**.
- `TOTAL` = ceil(durée voix × 30) + quelques images de fin.

## Étape 4 — Plan des plans (`story.ts`)
1. Copier `templates/bridge/` → `src/videos/<nom>/`, renommer composant/composition, l'enregistrer dans `src/Root.tsx`.
2. Découper en ~12-22 plans (`SHOTS`) alignés sur les phrases ; `light` day/golden selon le temps de l'histoire.
3. `CAMS` : coupe sur chaque grand saut, glissés 18-40 images centrés sur le mot, poussée continue, rolls 4-5° sur les temps forts.
4. `KICKS` aux impacts, `XFADE` aux changements de lieu, `FLASH_AT` après l'accroche, `DOF` par plan, `FOREGROUND` dans ~1/3 des plans.
5. Règle d'or : chaque réaction visuelle 0-3 images **avant** son mot.
6. **Plans spectaculaires** : 1-2 par épisode sur les moments clés (révélation du lieu, retournement) : envolée
   POV → plongée aérienne, orbite, survol (courbe de Bézier comme `S15c` du bridge, 90-120 images, glide).
   La caméra subjective « tu » reste la base, entrecoupée de plans larges cinéma.

## Étape 5 — Monde
- `lights.ts` (presets/palette), `build.ts` (lieu, maisons, props Kenney recolorés, culling des lignes de vue),
  `paint.ts` (nouvelles textures peintes si besoin), `world.ts` (ciel, sol/eau, objets animés, pose par image).
- Remplacer la géométrie spécifique du pont par celle du nouveau décor ; garder shade/ink/lens/grade tels quels.

## Étape 6 — Personnages
- Nouvelles tenues `Outfit` dans `toon.ts` (respecter proportions et couleurs), nouvelles expressions/props si nécessaire.
- `cast.ts` : rôles, positions, marches, clignements, effets 2D par plan (`stage`).

## Étape 6 bis — Sous-titres
- Composant React au-dessus des canvas, groupes de 1-3 mots en majuscules, tout en blanc, ~46 px à 1920 (REFERENCE_APOKALYPS §9).

## Étape 7 — Post
- Ne pas toucher la chaîne (Ink → lens → bloom → tone map → grade) sauf besoin ; ajuster `GRADES` si nouvelle lumière (nuit…).

## Étape 8 — Son (après verrouillage des timings image)
- Copier `templates/audio/` ; mettre à jour `timeline.py` (TOTAL, plans, événements), réécrire la partition (`music.py`)
  et la liste d'événements (`sfx.py`) pour la nouvelle histoire ; lancer `python mix.py`.
- Cible : musique +3 dB / SFX −6 dB / voix inchangée ; −15 LUFS, ≤ −1 dBTP ; durée exacte = TOTAL/30.

## Étape 9 — Contrôle du look
- Stills à 0,5 : `node scripts/bridge-stills.mjs out/<nom>/x_ <images> 0.5`.
- Planches comparatives : images de référence supprimées le 2026-11-13 (comparer aux vidéos de `archives_videos/`).
- Vérificateur (sous-agent, 1-3 images, verdict ≤ 200 mots) : notes /10 couleur jour/golden, lumière, encre, textures,
  personnages, profondeur, composition + liste de corrections avec numéros d'image.
- Option : sandboxes par propriétaire de fichiers (SKILL.md §Look-match loop) puis `bridge_merge.py`.

## Étape 10 — Rendu final et QA
1. `npx tsc --noEmit`.
2. `npx remotion render src/index.ts <Comp> out/<nom>/video.mp4 --codec h264 --crf 16 --scale 1.3333` (1440×2560).
3. Mux : `-map 0:v:0 -map 1:a:0` (Remotion écrit une piste audio muette).
4. `bridge_shots.py` puis `short_qa.py` : aucune image noire, blanche non prévue, gelée ≥ 12 images, ni saut ; loudness OK.
5. Corriger, re-rendre, audit final.

## Étape 11 — Livraison
- Envoyer le MP4 final, consigner les notes (valeurs modifiées, scores, problèmes) dans `docs/` ou `out/<nom>/NOTES.md`.

## Checklist « première vidéo »
- [ ] Sujet + faits sourcés validés
- [ ] Script 220-330 mots validé
- [ ] `voice.wav` + `words.json` corrigé
- [ ] Projet Remotion + dépendances + Kenney + chemins des scripts
- [ ] Stills du bridge OK (pile validée)
- [ ] `story.ts` (plans, caméras, DOF, kicks) calé sur les mots
- [ ] Décor + personnages + effets
- [ ] Stills vérifiés vs références
- [ ] Son mixé sur timings verrouillés
- [ ] Rendu 2K + mux + QA propre

## Grammaire d'ouverture (exemple utilisateur, 2026-11-12) — 10 plans en ~20 s
1. Héros : geste brusque, 1 s. 2. Lieu entier (plan large, hauteur/échelle), 2 s. 3. Menace entrevue, 1 s. 4. Détail du lieu (façade), 1 s.
5. Héros de profil, 1 s. 6. Fenêtre + menace qui passe, puis son œil arrive (même plan), 2 s. 7. Enjeu intime (proche qui allume la lampe), 2-3 s.
8. Proche + menace qui tremble, 2 s. 9. **Plan monumental** : dézoom immense, tout le décor dans l'écran, menaces minuscules, une seule lumière allumée, 3-4 s.
10. Panneau diégétique des règles, 1,5 s.
Principe : plusieurs plans courts, puis UN grand plan qui explose l'échelle. Règles numérotées, chiffre, signal secret, règle enfreinte, dilemme.

## Mouvement de caméra et vie dans l'image (retour utilisateur 2026-11-12)
- Gros mouvements de caméra, surtout de **grands dézooms** (de la fenêtre à toute la ville), mais **3-4 par vidéo au plus** pour rester crédible.
- **Toujours du mouvement dans l'image**, même sans action : lampe qui se balance, poussière qui tombe, vitre qui craque, plafond qui tremble, rideau, flamme, pluie.
- Tremblements de caméra eux-mêmes : légers (voir docs/STYLE_ARTISTIQUE.md).
