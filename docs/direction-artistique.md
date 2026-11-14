# Direction artistique — résumé validé (2026-11-14)

Valeurs chiffrées complètes : `docs/STYLE_ARTISTIQUE.md` ; référence n° 2 : `docs/REFERENCE_APOKALYPS.md`.

## Image
- three.js dans Remotion : décor 3D (props Kenney CC0 recolorés + géométrie procédurale), personnages en **cartes 2D**, contours encre,
  textures peintes Canvas2D (murs : fissures, griffures, lierre ; noms gravés), flou de profondeur, grain/étalonnage (`look.ts`).
- Couleurs : zones sombres désaturées + **accents saturés** (lumière chaude des feux, rouge sirène, bleu nuit) ; jamais gris terne.
  Ambiances par plan : jour orange / nuit bleue / crépuscule rouge (`LIGHT` dans `story.ts`).
- Décor « infini » : brouillard au loin, détails vivants à chaque plan (poussière, braises, oiseaux, fumée, linge, torches).

## Montage et caméra (v2 validée sur *Le Mur*)
- **~59 sous-plans** de 1 à 2,5 s (~1 s dans le final), coupes calées sur les mots (`CUTS` dans `story.ts`, coupe 2 images avant le mot).
- Caméras variées : zoom éclair (`snap`), drones rasants (`droneLow`) révélant plusieurs monstres, ras du sol, gros plans de détails,
  travellings latéraux, plongées ; tremblement léger aux moments de stress.
- **Accroche** : plan large du héros → zoom rapide sur la tête au 1er mot → dézoom qui révèle le monstre à la fin de la phrase.
- **Flashs** de 2 images seulement (noir/blanc) sur les mots-chocs, jamais longs.
- **Carton final** : fond propre à la série (*Le Mur* : labyrinthe vu d'en haut + sirène rouge pulsante, lente descente ; `mur/MazeTop.tsx`),
  titre Bebas Neue, « ÉPISODE n » qui bascule en rouge sur n+1.

## Texte à l'écran
Sous-titres karaoké Montserrat 900 (blanc, mot prononcé orange #FF9A3C), 1-3 mots ; HUD Bebas Neue en haut ; cartes A/B vert/rouge au choix final.

## Contrôle
Planche de stills à l'échelle 0.5 (un still par sous-plan) validée par l'utilisateur **avant** le rendu complet.
