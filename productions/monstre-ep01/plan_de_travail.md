# Le Monstre — épisode 1 : plan de travail (à valider avant toute génération)

## Décisions prises avec toi
- **Monstre** : version des plans. Tête rectangulaire en céramique blanc ivoire fissurée, grands yeux ovales noirs sans pupille, bouche ronde noire bordée de petites dents triangulaires, pièces de métal noir verticales sur les côtés, pointes métalliques à l'arrière du crâne. Corps de 9 m très allongé, fait de grandes plaques anguleuses blanchâtres et translucides, avec des jambes et des bras métalliques longs et fins et d'immenses mains griffues. C'est le « monstre blanc et noir ».
- **Moments** :
  - intro : nuit, projecteurs allumés ;
  - « Il y a trois ans… sept personnes » : nuit ;
  - « au lever du soleil… la lumière » : aube rose ;
  - « Le gouvernement… pas bougé d'un pouce » : pleine journée ;
  - « Jusqu'à la nuit dernière… tout semblait normal » : crépuscule ;
  - de « 2 h 13 » à la fin : nuit noire, puis pluie.
- **Format** : 4K 2160×3840, 30 i/s. Le rendu est découpé en morceaux en parallèle et relancé automatiquement. Le fichier envoyé est compressé sous 400 Mo.
- **Voix** : uniquement la voix du narrateur (Fish Audio, même voix que Le Nuage), dialogues compris, sans filtre radio.
- **Sous-titres** : un mot à la fois, jaune #FFE900, police sans-serif très grasse et arrondie, contour noir épais (9 % de la hauteur des lettres), petite ombre noire vers le bas, centrés, sans bandeau. Ils sont calés sur la voix par alignement forcé et rendus sur un calque séparé.
- **Musique** : celle du Nuage en boucle, **plus basse** (environ −6 dB de plus qu'avant). Bruitages : tonnerre, pluie, explosion, grésillements, sirènes, clic.
- **Pas de carte question à la fin.**
- **Durée** : 430 mots, soit environ 2 min 10.

## Montée en gamme du rendu : ce qui change dans le pipeline
D'après l'analyse de `studio/src/videos/bunker/` :

| Élément | Avant (Le Nuage) | Après (Le Monstre) |
|---|---|---|
| Anti-aliasing | aucun (`antialias:false`, `multisampling=0`) : contours en escalier | SMAA en post-traitement, plus un rendu interne légèrement suréchantillonné pour les gros plans |
| Personnages (`chars.ts`) | blocs arrondis, visage peint en 2D | même silhouette cubique, mais vêtements modélisés : col, poches, ceinture, casquette, gilet, talkie-walkie avec antenne et voyant. Doigts suggérés, biseaux plus marqués, tissus à relief (normal map de trame) |
| Matériaux | couleur unie + bruit léger | PBR complet : plastique légèrement brillant, béton mat à joints, acier peint et rayé, verre réfléchissant, asphalte mouillé (pluie). Normal maps et roughness maps générées en Canvas |
| Éclairage | soleil + ambiance | projecteurs SpotLight avec ombres douces, faisceaux volumétriques (cônes additifs avec bruit et poussière), lampadaires jaunes, gyrophares, éclairs. Lumière de rebond simulée (hemisphere + fill colorée) |
| Atmosphère | fond uni gris-violet | ciel dégradé avec étoiles ou nuages selon le moment, brume en profondeur (fog exponentiel teinté), gouttes de pluie et éclaboussures |
| Post-traitement | bloom, tone mapping, saturation, vignette | bloom maîtrisé (seuil plus haut, halos sur les projecteurs), SMAA, aberration chromatique très légère sur les bords, grain fin, étalonnage bleu / bleu-violet la nuit |
| Décor | maisons simples | place à dalles carrées et joints, routes, passages piétons, trottoirs avec bordures, immeubles détaillés (corniches, balcons, commerces avec enseignes sans texte lisible, auvents), gratte-ciel au loin, 6 tours en treillis réellement modélisées (4 montants, diagonales), socles béton à bandes jaune et noir, plateformes à 4 projecteurs, enceinte circulaire de 2 m, générateurs verts, câbles au sol, voitures de police |
| Sous-titres | jaune #F6F23C, contour moyen | #FFE900, contour 9 %, ombre décalée |

Nouveau dossier : `studio/src/videos/monstre/`. Les modules réutilisés (tex, common, chars) sont copiés et améliorés ; le dossier du Nuage n'est pas modifié.

## Personnages
- **Narrateur (l'enfant)** : veste jaune, pantalon foncé, lampe torche.
- **Le père, chef de la sécurité** : uniforme bleu et gris, casquette bleue, talkie-walkie à voyant rouge-orangé, expression sévère.
- **Gardes** : uniforme bleu sombre, casquette, lampe torche puissante.
- **Habitants du flashback** : dont une personne au haut rose vif.
- **Garde au levier** (plan « clic ») : un garde parmi les autres.
- **Habitants aux fenêtres et balcons.**

## Liste des plans
Les plans 1 à 37 suivent ton découpage. Les plans 38 à 63 sont les miens, construits sur le même principe :
- un mouvement léger par plan ;
- le point de vue change à chaque phrase ;
- jamais deux fois le même mouvement de suite ;
- au maximum 2 cadrages identiques de suite.

| # | Texte | Moment | Plan |
|---|---|---|---|
| 1 | Dans cette ville, il existe un monstre | nuit | Travelling avant descendant, depuis un toit jusqu'au centre de la place. Vue plongeante oblique. Les 6 tours encadrent la scène, les faisceaux convergent. Le plan finit serré sur la structure centrale, avec une tour à droite |
| 2 | qui ne peut se déplacer que dans l'obscurité. | nuit | Travelling avant lent, en légère contre-plongée frontale, jusqu'au très gros plan du visage |
| 3 | Et si les lumières s'éteignent, ne serait-ce qu'une seconde, | nuit | Contre-plongée sur un projecteur en haut de sa tour. Léger travelling avant. La lumière grésille brièvement puis revient |
| 4 | c'est la fin pour nous tous. | nuit | Contre-plongée sur le monstre en pied. Travelling avant très discret |
| 5 | Il y a trois ans, cette chose est apparue en plein cœur de notre ville. | nuit | Travelling avant rapide dans la rue vers un groupe d'habitants. Le plan finit en très gros plan sur la personne en rose ; le monstre est visible au loin pendant l'approche |
| 6 | Cette nuit-là, sept personnes ont disparu. | nuit | Travelling latéral droite au ras du sol, vers des affaires abandonnées : un sac rouge et deux chaussures (une rouge, une bleue). Le monstre est au loin à gauche |
| 7 | Mais au lever du soleil, le monstre s'est figé. | nuit → aube | Plan quasi fixe avec léger travelling avant. Le ciel passe du bleu nuit au rose et blanc |
| 8 | C'est là que nous avons découvert son point faible : | aube | Léger travelling avant vers le monstre, la lumière monte |
| 9 | la lumière. | aube | Travelling avant lent sur le visage (bouche et yeux), reflets du soleil sur la céramique |
| 10 | Le gouvernement a donc installé six projecteurs géants tout autour. | jour → nuit | Orbite de 360° autour du monstre ; les 6 tours s'allument une par une. Vue d'ensemble finale |
| 11 | Chacun est équipé de son propre générateur de secours. | jour | Travelling latéral gauche avec légère rotation autour du générateur vert : panneau, voyant vert, marquages jaune et noir |
| 12 | Et chaque nuit, douze gardes le surveillent, munis de puissantes lampes torches. | jour | Travelling circulaire d'un garde à l'autre ; les faisceaux sont pointés vers le monstre hors champ |
| 13 | Depuis trois ans, le monstre n'a pas bougé d'un pouce. | jour | Travelling avant en plongée, au-dessus d'un paratonnerre (socle, sphère métallique, tige) au premier plan. Le monstre et les gardes sont au fond |
| 14 | Jusqu'à la nuit dernière. | crépuscule | Travelling avant très serré sur un œil ovale noir et les fissures, avec de la fumée diffuse |
| 15 | Mon père est chef de la sécurité, | crépuscule | Le père marche vers la caméra ; travelling latéral gauche, du plan large au plan rapproché |
| 16 | et il a fini par m'autoriser à rejoindre son équipe de nuit. | crépuscule | Plan fixe à deux : le héros avec sa lampe, le père qui ferme brièvement les yeux. Le monstre à gauche |
| 17 | Tout semblait normal, | crépuscule | Plan large en plongée quasi fixe. La tête du monstre pivote très légèrement à droite |
| 18 | jusqu'à 2h13 du matin. | nuit | Zoom avant lent sur l'écran du téléphone « 2:13 AM » dans la main du héros |
| 19 | Boum ! | nuit | Caméra fixe en contre-plongée. Explosion jaune et orange en haut de la tour de droite, avec étincelles et fumée |
| 20 | L'un des projecteurs a explosé, | nuit | Léger travelling avant sur le héros, qui tourne la tête, surpris. L'explosion est en fond |
| 21 | mais mon père est resté calme. | nuit | Zoom avant lent sur le père avec léger travelling gauche |
| 22 | « Pas de panique, il nous en reste cinq. » | nuit | Contre-plongée, léger travelling avant. Le père est de dos et de profil au premier plan, le héros surpris en face |
| 23 | Soudain, sa radio a grésillé : | nuit | Zoom avant en très gros plan sur le talkie-walkie, dont le voyant clignote |
| 24 | « Chef, le câble d'alimentation principal est endommagé. On doit couper le système. » | nuit | Contre-plongée : les petites lumières au sol grésillent. Un garde en gilet orange est figé, penché, au premier plan à droite |
| 25 | « Et les générateurs de secours ? » | nuit | Léger travelling avant sur le père, inquiet ; le voyant clignote |
| 26 | « Ils surchauffent, monsieur. » | nuit | Léger travelling avant sur le générateur vert, d'où sort de la fumée grise |
| 27 | Mon père a aussitôt saisi sa radio : | nuit | Plan rapproché quasi fixe sur le père, sévère |
| 28 | « À tous, en position d'urgence ! » | nuit | Plan rapproché, léger mouvement. Le père parle dans la radio, bras levé |
| 29 | En quelques minutes, des voitures de police ont encerclé la place. | nuit | Plan large en plongée. Huit voitures de police arrivent de partout et allument leurs phares et leurs gyrophares |
| 30 | Leurs phares étaient braqués sur le monstre. | nuit | Contre-plongée et travelling avant sur le toit d'une voiture : la rampe rouge et bleue clignote, le monstre est au fond |
| 31 | Les gardes ont levé leurs lampes torches. | nuit | Léger travelling avant : deux gardes lèvent leur lampe, les faisceaux sont bien visibles |
| 32 | Même les habitants des immeubles voisins | nuit | Plongée sur une façade : habitants aux balcons, escalier métallique en zigzag, auvents rayés bleu et blanc |
| 33 | ont dirigé des lampes depuis leurs fenêtres. | nuit | Contre-plongée et travelling avant sur le monstre derrière les grilles ; les faisceaux vacillent |
| 34 | Puis, « clic » | nuit | Plan rapproché : un garde abaisse le levier gris, les voyants verts s'éteignent un à un |
| 35 | toute la ville a plongé dans le noir. | nuit noire | Plongée depuis un toit, léger travelling avant. Les fenêtres et les lampadaires s'éteignent de proche en proche ; seuls les faisceaux restent, convergeant sur le monstre |
| 36 | Sauf le monstre. | nuit noire | Même axe, plus proche. Travelling avant ; les gyrophares vacillent |
| 37 | Des centaines de faisceaux lumineux continuaient de l'éclairer, | nuit noire | **Drone : orbite** basse autour de l'enceinte. Des dizaines de faisceaux se croisent dans la brume au-dessus du monstre |
| 38 | l'empêchant de bouger. | nuit noire | **Très gros plan** sur une main griffue figée dans la lumière, avec un **zoom avant** lent. Un doigt frémit à peine |
| 39 | Je croyais que nous étions en sécurité, | nuit noire | **Plan épaule** derrière le héros, qui tient sa lampe vers le monstre. **Travelling latéral droite** |
| 40 | mais un coup de tonnerre a retenti | nuit noire | **Plan d'ensemble en contre-plongée** sur le ciel au-dessus des tours. Un éclair blanc-violet traverse l'image, flash sur toute la place. **Montée verticale** légère |
| 41 | et une pluie torrentielle s'est abattue. | pluie | **Plongée** sur les dalles : la pluie frappe le sol, des flaques se forment et reflètent les faisceaux. **Descente verticale** |
| 42 | Un garde a glissé, | pluie | **Plan moyen** : un garde glisse sur les dalles mouillées et tombe en arrière. **Travelling latéral gauche** |
| 43 | laissant échapper sa lampe torche. | pluie | **Gros plan au ras du sol** : la lampe roule dans une flaque, son faisceau balaie le sol puis s'éteint. **Zoom arrière** |
| 44 | Puis, les phares d'une voiture de police se sont éteints. | pluie | **Plan américain** de l'avant d'une voiture de police sous la pluie : les deux phares clignotent puis s'éteignent. **Zoom avant** |
| 45 | « Gardez-le sous la lumière ! » | pluie | **Contre-plongée** sur le père trempé qui crie, le bras tendu vers le monstre. **Montée verticale** |
| 46 | a crié mon père. | pluie | **Plan d'ensemble en plongée** sur les gardes qui courent sous la pluie, les faisceaux tremblent. **Drone : survol** |
| 47 | J'ai voulu intervenir, | pluie | **Plan moyen** : le héros avance d'un pas vers l'enceinte, lampe en avant. **Travelling latéral droite** |
| 48 | mais j'ai trébuché sur un câble. | pluie | **Très gros plan** sur le pied du héros qui accroche un câble noir dans une flaque, avec des éclaboussures. **Travelling latéral gauche** |
| 49 | Ma lampe m'a échappé des mains | pluie | **Plan subjectif** vers le sol : la lampe tombe en tournant, son faisceau balaie la pluie. **Descente verticale** |
| 50 | et, pendant une seconde, le monstre s'est retrouvé plongé dans une obscurité totale. | pluie | **Contre-plongée** sur le monstre. Tous les faisceaux vacillent et s'éteignent ; il ne reste que ses deux yeux noirs, et la silhouette se devine à la lueur d'un éclair. **Zoom avant** lent |
| 51 | Un cri terrifiant a retenti sur la place. | noir | **Plan d'ensemble** de la place plongée dans le noir, seulement des gyrophares qui tournent. Le cadre tremble au moment du cri. **Zoom arrière** |
| 52 | Tout le monde a immédiatement redirigé ses lumières vers lui, | pluie | **Plongée** : des dizaines de faisceaux se rallument d'un coup et convergent. **Drone : plongée progressive** |
| 53 | et le monstre s'est figé. | pluie | **Gros plan** sur le visage du monstre, figé en pleine lumière, la pluie ruisselant sur la céramique. **Travelling latéral droite** |
| 54 | Mais il ne se trouvait plus au centre de la place. | pluie | **Plan d'ensemble en plongée** : l'enceinte est vide, la grille est arrachée et pliée. **Montée verticale** |
| 55 | Il se tenait juste devant nous, | pluie | **Contre-plongée extrême** depuis le héros et le père : le monstre penché au-dessus d'eux, à quelques mètres, remplit le cadre. **Zoom arrière** qui révèle sa taille |
| 56 | et dans son immense main se trouvait l'un des gardes, | pluie | **Plan moyen** sur la main géante qui serre un garde au niveau de la taille, sous les faisceaux. **Travelling latéral gauche** |
| 57 | encore en vie. | pluie | **Gros plan** sur le visage terrifié du garde, qui bouge encore la tête. **Zoom avant** |
| 58 | « Papa, il faut le sauver ! » | pluie | **Plan épaule** du héros qui se tourne vers son père en criant. **Travelling latéral droite** |
| 59 | Mais papa m'a saisi le bras. | pluie | **Très gros plan** sur la main du père qui agrippe le bras du héros. **Descente verticale** |
| 60 | « Ne bouge pas ! » | pluie | **Gros plan** frontal sur le père, sévère, la pluie sur sa casquette. **Zoom avant** |
| 61 | « Pourquoi ? » | pluie | **Contre-plongée** sur le héros, perdu, le monstre flou derrière lui. **Montée verticale** |
| 62 | Il a désigné le monstre du doigt. | pluie | **Plan américain** de dos : le père pointe le monstre, avec le garde dans sa main. **Travelling latéral gauche** |
| 63 | « Parce que si ces lumières s'éteignent à nouveau, il est mort. » | pluie | **Drone : orbite** lente qui recule depuis le visage du monstre et le garde dans sa main jusqu'à la place entière : des centaines de faisceaux, la pluie, la ville éteinte. Un faisceau grésille sur le dernier mot, puis **coupe au noir** |

## Points interprétés (à corriger si besoin)
- Plan 6 : « petit objet cubique rouge et deux objets rouge et bleu » devient les **affaires abandonnées des disparus** (un sac et deux chaussures).
- Plan 13 : « structure blanche qui se transforme en socle avec sphère et tige » devient **un paratonnerre au premier plan**, sans transformation (une métamorphose d'objet ferait bug).
- Plan 14 : « forme ovale noire » devient **l'œil du monstre**.
- Plans 37 à 63 : un projecteur est en panne (plan 19), donc il en reste 5 allumés, plus les voitures, les gardes et les fenêtres.
- Le téléphone affiche « 2:13 AM » à l'écran. C'est un texte dans l'image, pas un texte superposé.
