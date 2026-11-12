# « Ne le regarde pas » — découpage détaillé v1 (à valider)

Script validé par l'utilisateur (2026-11-12) : voir `SCRIPT.md`. Montage **dynamique** : 24 plans, **1,7 à 4,9 s** (moyenne 2,5 s, jamais plus de 5 s),
coupes sèches, ambiance **sombre, peu de lumière**. Les temps ci-dessous sont **estimés** (voix ≈ 2,75 mots/s, ≈ 61 s) ;
ils seront **recalés sur `words.json`** après génération de la voix (règle n° 5 : chaque réaction visuelle 0-3 images avant son mot).

## Direction visuelle
- **Lieu** : un salon, la nuit, sous la pluie. Canapé au centre, télé éteinte en face, grande fenêtre sur le côté, un seul lampadaire.
- **Lumière (motivée, peu de lumière)** : lampadaire **ambre** bas et faible (clé chaude), **bleu froid** de la nuit/pluie par la fenêtre,
  **cyan** de l'écran du téléphone ; le reste est noir bouché. Éclairs = pic bref de lumière blanc-bleu (2-3 images).
- **Étalonnage** : noirs écrasés, zones sombres désaturées + **accents saturés** (ambre, cyan, bleu éclair), jamais gris et terne ; vignette forte.
- **Flou de profondeur** marqué sur les inserts ; grain léger ; pluie visible sur la vitre (traits Canvas2D animés).
- **Personnages (cartes 2D du style bridge)** : toi + le faux père (même dessin que le vrai : manteau sombre, cheveux gris),
  mais **visage figé, sourire fixe, jamais de clignement**, jamais en gros plan de face. Le vrai père n'apparaît que dehors, derrière la vitre,
  en contre-jour, blême.
- **Texte diégétique** : messages du téléphone (blanc sur écran sombre, bulles grises), tapés lettre par lettre.
- **Sous-titres** : tout en blanc, 56 px, comme les autres vidéos ; étiquettes **A · LE REGARDER** / **B · COURIR VERS LA PORTE** sur le dernier plan.

## Plan par plan
| # | Temps (est.) | Durée | Texte dit | Plan et caméra | Lumière / flou | Son |
|---|---|---|---|---|---|---|
| 1 | 0,0-2,6 | 2,6 s | « Imagine… Tu rentres chez toi, épuisé. » | **Accroche** : porte d'entrée vue de l'intérieur, contre-plongée sur une main qui pose les clés sur un meuble ; la caméra glisse vers l'arrière-plan sombre du salon | Lampadaire ambre au fond, flou fort au premier plan | Pluie, clés, verrou |
| 2 | 2,6-4,7 | 2,1 s | « Tu t'écroules sur le canapé. » | Plongée haute sur le canapé : tu t'effondres dedans, léger tremblé | Ambre + bleu pluie sur les épaules | Soupir, coussins |
| 3 | 4,7-6,4 | 1,7 s | « La télé est éteinte. » | Plan fixe sur l'écran noir de la télé, **poussée lente** ; dans le reflet : toi, et **une forme sombre à côté de toi** (à peine visible) | Presque noir, reflet ambre | Bourdonnement grave, pluie |
| 4 | 6,4-9,0 | 2,6 s | « Ton père est assis à côté de toi. Il sourit. » | Plan moyen frontal du canapé : le faux père, sourire fixe, toi à côté ; travelling arrière très lent | Lampadaire en bas-côté, visage mi-ombre | Silence tendu |
| 5 | 9,0-10,9 | 1,9 s | « Tu rentres tard, aujourd'hui. » | Plan moyen **de trois-quarts** sur lui, bouche fermée (voix off-screen), jamais de gros plan | Contre-jour ambre, silhouette | Voix du faux père (légère réverb) |
| 6 | 10,9-12,9 | 2,0 s | « Tu réponds sans l'écouter. » | Gros plan sur toi, regard vide ; la lueur bleue de la pluie glisse sur ton visage | Bleu froid, flou arrière | Pluie, souffle |
| 7 | 12,9-15,1 | 2,2 s | « Ton téléphone vibre. Un message. De Papa. » | **Insert** : écran du téléphone sur ta cuisse, seule lumière cyan ; notification « Papa » qui vibre | Cyan sur noir, DOF très faible | Vibration + bip |
| 8 | 15,1-18,6 | 3,5 s | « Ce n'est pas moi. Ne le regarde surtout pas. » | Insert écran : le message se tape lettre par lettre ; **poussée lente**, léger tremblé | Cyan pur | Battement de cœur (démarre) |
| 9 | 18,6-21,0 | 2,4 s | « Tu ne comprends pas. » | Toi de face, immobile ; **changement de point** vers l'arrière-plan : une forme floue à côté | Flou qui s'inverse | Drone grave |
| 10 | 21,0-23,5 | 2,5 s | « Ton père est juste là, à côté de toi. » | Plan épaule : le faux père flou au bord du cadre, sourire visible, immobile | Ambre, bord de cadre noir | Silence + battement |
| 11 | 23,5-27,4 | 3,9 s | « Un deuxième message arrive : “Je suis dehors. Devant la fenêtre.” » | Insert écran : second message ; **tilt vers le haut** : tes yeux montent vers la fenêtre | Cyan, puis bleu | Bip, pluie qui monte |
| 12 | 27,4-31,0 | 3,6 s | « Tu lèves les yeux, lentement. » | **Plan signature n° 1** : travelling latéral très lent vers la fenêtre, rideau, pluie ruisselante | Bleu nuit, noirs profonds | Pluie, tonnerre lointain |
| 13 | 31,0-33,4 | 2,4 s | « Dehors, sous la pluie… ton vrai père. » | La fenêtre : silhouette de ton vrai père en contre-jour, **éclair** (2-3 images) qui le révèle | Éclair blanc-bleu, puis noir | Coup de tonnerre |
| 14 | 33,4-35,2 | 1,8 s | « Blême. Il te fait signe de ne pas bouger. » | Plan serré sur le vrai père derrière la vitre ruisselante, visage blême, main levée | Contre-jour bleu, vitre floue | Pluie, souffle |
| 15 | 35,2-37,3 | 2,1 s | « À côté de toi, l'autre continue de sourire. » | Plan moyen : le faux père, sourire fixe ; **il tourne lentement la tête vers toi** | Ambre bas | Grincement léger |
| 16 | 37,3-39,1 | 1,8 s | « Qui t'écrit ? » | Plan sur toi, le faux père en amorce floue (on ne voit que le contour de la tête) | Flou prononcé | Voix du faux père |
| 17 | 39,1-41,4 | 2,3 s | « Sa voix est la sienne. Presque. » | Gros plan sur ton visage : goutte de sueur, pupilles tremblantes ; la voix est filtrée, légèrement décalée | Cyan résiduel sur la joue | Voix ralentie, silence sur « Presque » |
| 18 | 41,4-44,5 | 3,1 s | « Dans l'écran noir de la télé, tu regardes son reflet. » | L'écran noir : reflet du canapé ; **changement de point** pour faire apparaître le faux père immobile | Reflet ambre tamisé | Drone |
| 19 | 44,5-47,5 | 3,0 s | « Il n'a pas bougé depuis que tu t'es assis. » | Reflet fixe, **plans qui se resserrent** (zoom doux) sur lui : toujours le même sourire | Reflet très sombre | Battement de cœur accélère |
| 20 | 47,5-50,0 | 2,5 s | « Pas un seul clignement. » | Gros plan sur ses yeux dans le reflet : grands ouverts, **aucun clignement** ; la caméra ne bouge plus | Presque noir, reflets des yeux | Silence presque total |
| 21 | 50,0-52,0 | 2,0 s | « Sa main se pose sur ton épaule. » | **Insert** : main pâle sur ta manche, la caméra tressaute | Ambre, peau pâle | Frottement tissu |
| 22 | 52,0-53,8 | 1,8 s | « Elle est glacée. » | Gros plan sur ton visage qui frémit ; **musique coupée net**, seul le souffle | Noir autour, joue éclairée | **Silence** |
| 23 | 53,8-56,2 | 2,4 s | « Tu ne regardes plus ton père ? » | **Plan signature n° 2** : tour à 360° autour du canapé, de plus en plus rapide, passe devant la fenêtre où le vrai père frappe à la vitre ; jamais le visage du faux père de face | Éclairs en stroboscope léger | Voix du faux père, coups sur la vitre |
| 24 | 56,2-61,1 | 4,9 s | « Alors, tu le regardes, ou tu cours vers la porte ? Dis-le en commentaire. » | Toi de face, fixe ; **poussée lente** ; derrière toi, la fenêtre avec le vrai père qui frappe, flou | Ambre faible, bleu derrière | Musique en suspens, pluie |
| — | 57,2 | — | (étiquettes) | **A · LE REGARDER** / **B · COURIR VERS LA PORTE** apparaissent à gauche et à droite du cadre | — | Petit bip |

(24 plans + étiquettes ; le plan 24 est le plus long à 4,9 s.)

## Mouvements marquants (2)
1. **Plan 12** : travelling latéral lent vers la fenêtre (3,6 s), qui révèle le vrai père au plan 13 avec l'éclair.
2. **Plan 23** : tour à 360° de plus en plus rapide autour du canapé (2,4 s), jusqu'au choix final.

## Musique et son (à fabriquer ensuite)
- **Musique** : drone grave + battements discrets, sans mélodie rythmée ; **silence net sur « glacée »** (plan 22), reprise en suspens au plan 24.
- **Sons** : pluie continue, vibration du téléphone, tonnerre (plans 12-14), voix du faux père légèrement réverbérée, coups sur la vitre (plan 23).
- Mix standard : musique ~6 dB sous la voix, loudness −15 LUFS (comme l'épisode 1).

## À fabriquer (un seul décor)
- **Décor** : kit Kenney `furniture` (canapé, lampadaire, télé, table basse) recolorés sombres ; fenêtre avec pluie en texture animée ; sol/plafond simples.
- **Télé-miroir** : écran noir dessiné en Canvas2D, qui renvoie le canapé, toi et le faux père (reflet atténué).
- **Éclair** : pic d'intensité de la lumière froide sur 2-3 images.
- **Personnages** : toi, le faux père, le vrai père (3 cartes) ; messages du téléphone en insert Canvas2D (comme l'insert du bracelet).
- **Voix** : narrateur George « B » + voix du faux père (à choisir) ; quota ElevenLabs épuisé ce mois-ci (~800 crédits nécessaires).
