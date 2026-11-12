# Style artistique — fiche de référence condensée

> **Direction actuelle (2026-11-11)** : français, sous-titres, fiction angoissante, couleurs plus sombres de
> `docs/REFERENCE_APOKALYPS.md` (§9 sous-titres, §10 palette) **priment** sur les §1 (« aucun sous-titre »),
> §3 (palette jour très claire) et §8 (script humoristique en anglais) ci-dessous. Le reste (personnages, encre,
> textures, DOF, caméra, son) reste la base technique.

Synthèse chiffrée de `references/STYLE_BIBLE.md`, des 7 rapports `references/reports/*.md`, de `SKILL.md`
et du code `templates/bridge/`. Les valeurs « **cible** » sont celles mesurées sur les 20 shorts de référence ;
les valeurs « **bridge** » sont celles réellement codées dans le template après 4 tours de vérification.
Pour le détail (méthode, tableaux complets, extraits GLSL/TS), ouvrir la section indiquée entre crochets.

> En cas de contradiction : `SKILL.md` et le code du template priment sur `STYLE_BIBLE.md`.
> En particulier, la grammaire caméra « ease-out burst » de STYLE_BIBLE est **fausse** (motion.md §0) :
> les mouvements sont des glissés symétriques (smootherstep).

## 1. Concept visuel
- Personnages **2D plats** (cartes Canvas2D) posés dans un **monde 3D toon** coloré.
- Monde : textures peintes à la main en aplats, **contours noirs à l'encre** sur la géométrie 3D, ciel saturé,
  brume de couleur horizon, flou de profondeur en gros plans, lumière chaude + ombres bleu-violet.
- Chaque phrase est illustrée littéralement ; les accessoires portent la blague.
- Aucun sous-titre dans nos vidéos (les références en ont : ne pas les imiter), anglais, pas d'intro/logo/outro/CTA.

## 2. Personnages [characters.md §2, toon.ts, cast.ts, cardshade.ts]
| Élément | Valeur |
|---|---|
| Canevas de dessin | 600 × 1000 unités, semelles à y = 975 ; 1000 u = 2,16 m (`SU = 0.00216`) |
| Proportions adulte | **3,5 hauteurs de tête** ; tête a/b = 118/111 ; jambes 1,40 HH ; torse 1,10 HH, largeur 0,80 W |
| Trapu (officier) | 3,47 HH, torse 0,92 W, ventre rond |
| Enfant | 2,85 HH, tête presque adulte (112/108), corps court |
| Tête « haricot » | superellipse H/W ≈ 0,94 ; sommet 1,75 (légèrement pointu), mâchoire 2,3 ; menton −0,12 ; asymétrie 6-10 % vers le côté regardé ; inclinaison ±4° ; bruit 0,8 % |
| Contour | prune **#241726**, épaisseur w0 = 5u (u = 1 % de W), ×(1 + 0,45 cos) : ~3:1, épais du côté opposé à la lumière/bas |
| Membres | traits simples : jambes 5,8u (couleur pantalon mêlée d'encre 55 %), bras 5,2u, **mains = points d'encre** r 5,5u, pieds 7,5u × 16u |
| Visage | yeux à 26u d'écart, sourcils effilés 20u au-dessus, bouche 20u dessous, décalés vers le côté regardé ; **pas de blush, pas de reflet dans l'œil** ; œil par défaut = paupière mi-close pince-sans-rire |
| Expressions codées | neutral, stern, grin, laugh, whistle, nervous (goutte #9fd4ff), shock, relief, relief_open, dazed, pained, smile, smile_closed, lick |
| Peaux | #ffe2c2, #f5c9a0, #ecd0b6, #c99067 ; luma visage à l'écran ≈ 0,93 |
| Ombrage | croissant peint doux (peau ×[.96,.86,.84], tissu ×[.64,.66,.74]) + teinte de la scène via `cardShade` (jamais d'émissif « collé ») |
| Ombre au sol | blob de contact serré (~0,5) + traîne dans la direction du soleil le jour ; vraies ombres de cartes en golden |
| Rim golden | intérieur uniquement, tête/torse (jamais une copie décalée extérieure) |
| Rendu 3D | billboards orientés caméra (yaw seul) sur le layer `NOINK` ; pool de canevas partagés (7 formes de tête × 4 tenues) |

**Animation des personnages** [motion.md §3, §5.2-5.3]
- Dessinés **« en uns »** (chaque image change), aucune déformation squash/stretch, pas de tremblement de trait.
- Marche : 9-12 images par pas, rebond 3-7 % de la hauteur (le plus bas au contact), inclinaison 1→7°, pied d'appui
  **planté** (pas de glisse), foulée ~0,8 m.
- Clignements toutes les 0,5-2,3 s, 4 images (mi / fermé / fermé / mi), plus un clignement à chaque changement d'expression.
- Pas d'idle continu : seuls des gestes motivés. Changement d'expression instantané, **0-3 images avant le mot**.
- Impact : anticipation tenue ~6 images, frappe en 1 image, éclat + anneau 4-5 images.

## 3. Couleur et étalonnage [grade.md, lighting.md, lights.ts, grade.ts]
| Mesure (jour) | Cible |
|---|---|
| Luma médiane | ~0,57 |
| p5 hors encre | ~0,23 (pas de noirs écrasés ; noirs chauds relevés ~(35,19,20)) |
| p99 | ~0,97 (vrais quasi-blancs) |
| Chroma C* éclairé | p50 34, p90 ~55 |
| Vignette | coins ≈ 0,86 du centre |
| Ciel jour | haut #3e7fd2 → horizon #b8d0ec (horizon 1,28× plus lumineux) |
| Golden | horizon pêche #ffd08a / #ffc47c, haut #8a6f8a, **ombres violet-bleu** (façade ≈ #444380), jamais brunes ; contre-jour bas |

Presets `LIGHTS` (lights.ts) — soleil **relatif à la caméra** et figé par plan :
- **day** : az 75°, él 48° ; lit [1.58,1.5,1.33], shade [.30,.29,.36], lift [.05,.06,.11] ; brouillard = horizon 25→300 m ; uSat 1,08.
- **golden** : az 6°, él 7° (contre-jour) ; key #ffab5e ×5,5 ; brouillard pêche après 50 m ; disque solaire #ffcf9e + bloom.
- Grade (grade.ts) : courbe RGB à 7 nœuds, saturation par zone, split-tone 3 voies, vignette ; preset par lumière du plan.

## 4. Matières, textures, décors [textures.md, paint.ts, build.ts]
- Chaque surface = quelques **aplats** ; joints peints fins (3-5 px à 1080p) en teinte sombre, pas en noir.
- Textures Canvas2D procédurales HD (planches 2048², pierre, pavés, toits, herbe, façades avec fenêtres/volets/portes,
  chaînes, eau proche/lointaine, nuages 3 tons à dessous lavande).
- Maisons : brique / crème / ocre / terre cuite atténués, socle, corniche, appuis, cheminée ; hauteurs 7 / 8,4 / 9,8 m.
- Pierre gris-beige chaud (−35 % de saturation), bois ocre C* 51-58 à joints quasi noirs, fer sombre désaturé.
- Interdits : jaune citron, faces éclairées lavande, surfaces trop sombres (jamais sous L* 19).
- Props Kenney CC0 (arbres, buissons, lanternes, étals, charrette…) **recolorés** (les kits nature sont turquoise).

## 5. Encre (contours du monde) [outlines.md, ink.ts]
- ~74 % des arêtes portent un trait : silhouettes, sauts de profondeur, plis convexes, contacts objet/sol.
- Bridge : **#030303**, 5,1 px proche (6 m) → 3,3 px loin (90 m) à 1080×1920 ; plis ×0,8 au-delà de 35° ;
  teinte brouillard 0,3 au loin. Pas de trait aux jonctions mur/sol ni sur l'horizon.
- Passe dédiée **avant** le flou de profondeur ; les cartes personnages sont exclues (layer `NOINK`, elles ont leur propre encre prune).

## 6. Profondeur, lumière d'ambiance [depth.md, lensblur.ts]
- DOF sur ~1/3 du temps d'écran : `cInf` (px à 1080) : accroche/rivière 15-16, gros plans 12-14, plans moyens 10-12,
  parc 7, golden 5, larges/aériens **0**. Mise au point sur les yeux du premier rang.
- Objets de premier plan flous dans ~1/3 des plans (MS/CU), jamais sur un visage, coupant 10-25 % d'un bord.
- Bloom seulement sur l'émissif HDR (seuil 1,0) ; pas de grain.
- Cadrage cible : MS 27 %, FS 28 %, inserts 22 %, WS 12 %, EWS 8 %, CU 3 % ; horizon à y ≈ 0,45 ;
  caméra ≈ 0,79 × la hauteur du personnage (82 % à hauteur d'yeux) ; fov 34-46°.

## 7. Caméra et montage [motion.md, story.ts]
- **Coupes franches** seulement sur les grands sauts (> ½ largeur d'image ou > 40 % de zoom).
- Sinon **glissé smootherstep 18-40 images**, pic ≤ 25 px/image à 720p, centré sur le mot.
- **Aucun plan fixe** : chaque tenue « pousse » de 0,15-0,35 %/image, 0,6 %/image ~35 images sur les mots-clés
  (QA : un gel ≥ 12 images est une erreur).
- Rolls 4-5° sur les temps forts ; secousses d'impact qui changent de signe à chaque image et s'amortissent en 7 images ;
  aucun flottement caméra à l'épaule.
- Fondus enchaînés 6-8 images aux changements de lieu/heure ; **flash blanc de 4 images** après l'accroche.

## 8. Script et rythme [STYLE_BIBLE.md, SKILL.md §Pipeline 2, templates/SCRIPT_example.md]
- Voix dès l'image 1-4, débit ~3,7 mots/s, quasi sans pause ; phrases ~13,5 mots ; anglais parlé simple.
- Formule : **accroche** paradoxale (10-16 mots) → **cadre** (année, lieu, fierté) → **escalade** 3-6 temps
  → **rupture** → **double réplique pince-sans-rire** (« Luckily… / Unluckily… ») → **« You see, »** + analogie du quotidien
  → **conséquence** → **chute ironique / rappel**. La vidéo s'arrête sur le dernier mot.
- Pour 60-90 s : 220-330 mots, ~12-22 plans (bridge : 15 plans / 67,5 s, coupe toutes les ~2-4 s).

## 9. Son [templates/audio/*, cues.md]
- 100 % synthétisé en numpy/scipy : bruitages procéduraux, partition originale (marche Si♭, 120 bpm calée sur les pas),
  ambiances, voix de foule par formants.
- Musique **coupée net** sur le temps de rupture (« Then, ») et silencieuse pendant la chute et la blague.
- Mix : voix inchangée ; musique sous la voix ~−10 LU avec ducking −3 dB piloté par `words.json` ; SFX −6 dB ;
  master −15 LUFS intégré, crête vraie ≤ −1,2 dBTP, LRA ~2,6 ; 48 kHz stéréo 24 bits, longueur exacte.
- Les références mesurent −14 LUFS et un LRA ~2,4 LU.

## 10. Pièges de lisibilité (à vérifier sur chaque nouveau plan) [SKILL.md §Readability traps]
Balançoire = deux cordes ; aucun prop à < 2 m de l'objectif ; buisson coupé au bord = « boule verte » ;
drapeaux d'époque ; panneaux en matériau non éclairé ; garde-corps qui traversent les jambes, pas les torses.

## Visages « pâles, yeux luisants » (références utilisateur du 2026-11-12, droite-ep01 et suivants)
- **Personnages normaux** : peau **beige pour tout le monde** (décision 2026-11-12), coupes de cheveux basiques, grands yeux noirs ovales avec 2 reflets blancs (`gloss`), sourcils fins, bouche en trait ; expressions
  `calm` (regard normal), `worry` (inquiet, jamais en colère), `smile_fixed` (sourire trop figé). Plus de regards énervés (`stern`, `neutral` à paupières).
- **Faux père / menace** : `creepy` = très large sourire à dents pointues ; `shadow` = silhouette noire, yeux blancs lumineux, grand sourire blanc
  à fentes noires (utilisée pour le reflet dans la télé).
- **Cheveux** : coupes simples dessinées par le projet (`shared/hair.ts`, `shared/hero.ts`), jamais de coupe au bol ; aucun accessoire repris des références.
- **Couleurs** : nuit bleu-violet (ombres violacées, clair bleuté), accents ambre / cyan ; visages clairs.
- Personnage principal (« tu ») : avatar de l'utilisateur, `studio/src/videos/shared/hero.ts` (peau claire chaude, cheveux châtains en mèches, sweat bleu nuit).
