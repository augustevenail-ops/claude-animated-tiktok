# STYLE BIBLE — Référence centrale du style et de la formule

Source unique : `augustevenail-ops/INSTRUCTIONS-VIDEO-STYLE` (commit `5113b0c`, vidéo 1 de la série « Le Mur » — dans ce dépôt, le *contenu* est appelé « Le Bunker »).

**Règle d'usage** : cette bible sert à reproduire le **style** (graphisme, caméra, couleur, lumière, montage, HUD, rythme, forme narrative) avec **un contenu entièrement nouveau** : autre histoire, autres personnages, autres lieux, autres règles. Ne pas reprendre bunker, pyramide, trappe, radio, compteur, tirage, père, vieil homme, matricules, ni les répliques.

Statuts :
- **[OBS]** observé dans les fichiers source (images, planches, tableaux).
- **[DOC]** affirmé par les consignes du dépôt, non vérifié par moi.
- **[INT]** interprétation probable.
- **[?]** à vérifier ou contradictoire.

---

## 0. Périmètre et méthode

| Élément | Traitement |
|---|---|
| `00_MASTER_INSTRUCTIONS/00 Information_Directive_du_Projet.txt` | Lu en entier |
| `IMAGE/00 PROMPT_DIRECTEUR_SECTION_IMAGE.txt` | Lu en entier |
| `IMAGE/Plan 1` à `Plan 41` (41 images, première image de plan) | Vues en 3 montages (1-16, 17-32, 33-41) |
| `IMAGE/table_plans_claude.xlsx` (feuilles « Plans » et « Lisez-moi ») | Lu en entier |
| `PLANCHES_CONTACT/00 prompt_directeur_planche_contact.txt` | Lu en entier |
| `PLANCHES_CONTACT/Planche 1` à `Planche 27` (27 × 9 images, 0,4 s entre images) | **Toutes les 27 planches analysées** (extraites, réduites, vues une par une). Total : 243 images ≈ 96,9 s. |
| `SCRIPT/ 00 prompt_directeur_script.txt` | Lu en entier |
| `SCRIPT/VIDEO_01_SCRIPT_COMPLET_FINAL.txt` | Lu en entier (non recopié ici) |
| `SCRIPT/VIDEO_01_TIMECODES_PAR_MOT.csv` | Lu en entier |
| `SCRIPT/VIDEO_01_FICHE_TECHNIQUE.txt` | Lu en entier |

Limites : les planches sont des captures de 0,4 s en réduction ; le mouvement entre deux captures est déduit, pas mesuré. Les vidéos originales ne sont pas dans le dépôt : vitesses et easings sont estimés.

Hiérarchie [DOC] : script = contenu narratif ; prompts = méthodes ; 41 images = référence visuelle des plans ; planches = dynamique et montage ; fiche technique = contraintes ; timecodes = référence temporelle.

---

## 1. Ce qui reste fixe / ce qui change

### 1.1 À reproduire (style, forme) [OBS + DOC]
- Format 9:16, 30 fps, HUD permanent, sous-titres mot par mot, mot actif en orange.
- Personnages en cartes 2D à contour sombre, tête ronde claire, petits traits, bonnet ou coiffure de couleur froide, tenue orange/brune.
- Foule en silhouettes sombres floues en profondeur.
- Palette sombre désaturée + accents saturés (rouge alarme, orange, cyan/teal).
- Lumière motivée par une source visible (suspension, faisceau, lampe, lumière blanche d'ouverture).
- Caméra : glissés et zooms lents, rotations/inclinaisons de tunnels, focus qui se fait et défait, transitions par noir ou flash blanc.
- Cartouches diégétiques (affiches, panneaux, compteurs, relevés) avec le même traitement typographique.
- Narration à la 2ᵉ personne (« tu »), voix du narrateur distincte des autres voix, règles numérotées révélées une à une, dilemme final A/B, clôture unique.
- Découpage : ouverture en plan rapproché sur un détail, puis élargissement ; alternance personnage / détail / environnement ; fins de plan par noir.

### 1.2 À renouveler (contenu) [DOC]
- Univers, lieu, personnages, relations, règles, obstacles, révélations, scènes, dilemme, mots exacts.
- Pas de transposition superficielle (noms changés, même intrigue).
- Pas de répétition des éléments de contenu listés en §5.2 ci-dessous (formes d'objets, lieux, noms de niveau, numéros de matricule).

---

## 2. Identité visuelle

### 2.1 Style graphique [OBS]
- **Rendu** : 2D vectoriel stylisé, aplats avec dégradés doux et lueurs ; contour sombre épais sur les personnages (plus fin sur les décors) ; légère granularité / particules en suspension sur les plans sombres.
- **Décors** : formes géométriques répétées (couloirs carrés en spirale, rivets, rails, lignes de perspective), traits fins, peu de textures peintes.
- **Profondeur** : premier plan flou (bokeh, visages flous en bord de cadre), plan moyen net, arrière-plan foule sombre.
- **Vignettage** fort sur la plupart des plans ; bords assombris.

### 2.2 Personnages (règles de conception) [OBS]
- Tête ronde, claire, dégradé radial (highlight haut-gauche), yeux = deux points noirs ou traits fermés, bouche minimale.
- Corps simple : tronc trapu avec col ou écharpe, bras en pièces articulées, pieds en roues/semelles simples.
- Coiffure = un volume de couleur froide (bonnet côtelé) ; personnages âgés : cheveux gris et tenue à carreaux.
- Tenue de travail en couleur chaude saturée (orange) avec un détail de contraste (écharpe couleur sauge, badge).
- Sur-ajout d'identifiants graphiques (matricule, badge) pour distinguer les figurants.
- Ne pas supposer que deux personnages sont identiques parce qu'ils se ressemblent [DOC].

### 2.3 Décors (règles de construction) [OBS]
- Salles en gradins : rangées de silhouettes, plans de niveau numérotés sur les paliers.
- Couloirs/puits : carrés concentriques en perspective axiale ; le centre est une source lumineuse ou une porte.
- Infographie : schéma 3D en fil de fer, étiquettes en pilules (« LA SURFACE », « TOI », « LA POINTE ») — trait fin, or/ambre.
- Objets : cadrans, compteurs à chiffres rouges, panneaux encadrés, roue de verrou, radio.

### 2.4 Palette [OBS, estimée à l'œil]
- **Dominante** : brun très sombre / noir charbon (fonds).
- **Ambre / orange sable** : éclairages intérieurs, vêtements, mot actif des sous-titres.
- **Rouge** : alarme et gyrophare (dôme), chiffres de compteur, mentions d'alerte, lumières verticales.
- **Teal / vert-bleu** : bonnet, écharpe (personnage principal).
- **Blanc crème / gris clair** : lumières d'ouverture, flashs, papier des affiches.
- **Cyan / froid** : rares, pour les interfaces et les infographies.
- Règle : zones sombres désaturées + accents saturés ; jamais un gris uniforme terne.

### 2.5 Lumière [OBS]
- Lumière **motivée** : suspension au plafond, lampe de couloir, faisceau vertical, dôme rouge.
- **Contre-jour** sur silhouettes de foule ; **flash** blanc à l'ouverture.
- Chaque plan a une source visible.

### 2.6 HUD, typographie, sous-titres [OBS]
- **HUD fixe** coin haut-gauche : étiquette série, horloge qui avance (17:40 au début, 18:00 à la fin), sous-étiquette de niveau.
- **HUD fixe** coin haut-droit : compteur (blanc, passe au rouge après la première altération du compteur).
- **Sous-titres** : sans-serif gras arrondi, MAJUSCULES, blanc, centrés bas-tiers ; **le mot prononcé passe en orange sable** (`#FF9A3C`, règle du projet). 1 à 4 mots par cadre.
- **Titres de séquence** : sans-serif condensé gras, blanc, avec un mot en orange ; pas d'animation d'entrée notée.
- **Cartouches diégétiques** : encadré fin, texte en rouge néon pour les règles, papier pour les affiches, compteur à chiffres en rouge ou à rouleaux (style compteur mécanique), cartouche « relevé ».
- **Choix final** : deux pilules (A : fond sombre, bord orange ; B : bord rouge) affichées au-dessus de la question.
- **Carte finale** : titre de série en condensé, numéro d'épisode, compteur, pilule d'appel à l'abonnement.

### 2.7 Texture et grain [OBS]
- Pas de texture peinte visible ; grain léger sur les plans sombres ; particules de poussière en suspension dans les faisceaux.
- Flou gaussien fort sur premiers plans et transitions.

---

## 3. Cadrages et types de plans [OBS, planches 1-27]

| Type | Usage observé | Planches |
|---|---|---|
| Plan d'ensemble / très large (salle, gradins, foule en bas de cadre) | Installation du lieu | P2, P3, P9, P13, P14, P22 |
| Plan moyen à deux personnages (face caméra, un pied coupé) | Dialogue, scène d'exposition | P1, P2, P9, P13, P14 |
| Plan rapproché (buste, bonnet en haut de cadre) | Personnage qui parle | P18, P19, P21, P22, P26, P27 |
| Gros plan visage / cut-in | Révélation, réaction | P3, P17, P21 |
| Très gros plan détail (roue, chiffre, affiche, cadran) | Insertion d'information | P6, P8, P10, P18, P21 |
| Vue en plongée / contre-plongée | Puits et escalier | P4, P16, P24, P25 |
| Vue en tunnel (perspective axiale, centre lumineux) | Descente, progression | P4, P6, P9, P15, P18, P24, P25 |
| Plan de suivi (personnage qui marche, caméra latérale) | Progression, marche | P14, P15, P16, P17 |
| Plan infographie (schéma 3D, étiquettes) | Explication spatiale | P4 |
| Plan fixe à écran noir | Ponctuation | P1, P3, P13, P17, P20, P23, P27 |

---

## 4. Caméra et mouvements [OBS sur planches ; vitesses estimées]

| Mouvement | Où | Description |
|---|---|---|
| Glissé avant (dolly-in) lent sur personnage | P9, P14, P19 | Rapprochement doux sur le visage, sans saut. |
| Zoom arrière (pull-back) sur visage | P3-P4, P16 | Démarre en cadrage serré, s'élargit ; repris en ~1,2 s. |
| Recul latéral sur foule | P9 | Caméra recule au travers des silhouettes floues. |
| Rotation / roulis de tunnel | P6, P15, P24, P25 | Tunnel tourne de ~15–25° ; effet de vertige. |
| Descente en plongée | P4 | Chute verticale vers le fond du puits. |
| Orbite au-dessus d'un schéma | P4 | Caméra tourne lentement autour de la pyramide. |
| Panoramique horizontal sur affiches | P5 | Balayage de gauche à droite sur des papiers alignés. |
| Mise au point / flou qui se fait | P2, P10, P19 | Premier plan net ou flou, transition de netteté. |
| Suivi latéral de personnage | P14-P17 | Caméra à hauteur de personnage, léger décalage. |
| Montée/vers le haut | P18 | Regard vers la source lumineuse. |
| Plan fixe | P1, P3, P13, P21 | Pas de mouvement, sujet seul bouge. |

Règle [OBS] : le mouvement est lent et continu ; les changements de vitesse sont rares et associés à une révélation.

---

## 5. Personnages, décors et objets : rôles (à renouveler)

### 5.1 Procédés de présentation à conserver [OBS]
- Un personnage est présenté d'abord en plan moyen, puis en gros plan au moment de la réaction.
- Les objets importants sont montrés en très gros plan avec texte diégétique.
- Les personnages secondaires sont flous en premier plan pour créer de la profondeur.

### 5.2 Contenu propre à la vidéo 1 — NE PAS REPRENDRE
- Bol de soupe et cantine ; sirène en dôme ; bunker en pyramide inversée ; numéros de niveau ; compteur de places ; tirage au sort et relevé ; trappe à volant ; radio ; affiches « ils sont fous » ; règles 1 à 3 ; père, vieil homme au doigt sur la bouche ; matricules 31-xxx ; dilemme « tu le dis ou tu te tais ».

---

## 6. Structure temporelle : 27 planches (9 images, 0,4 s, 3,6 s par planche) [OBS]

Planche n couvre `[3,6·(n−1) ; 3,6·n[` secondes ; temps approximatif de l'image 1 de la planche.

| Pl. | Temps | Contenu visuel (fonction) | Caméra | Couleurs / lumière | Transition |
|---|---|---|---|---|---|
| 1 | 0,0 | Ouverture noire, vue cantine, sirène en dôme, deux personnages à table | fixe, zoom lent sur la louche | noir, ambre, rouge (dôme) | noir → image |
| 2 | 3,6 | Deux personnages à table ; foule floue ; plan large | fixe, léger dolly-in | rouge, brun | flou dissolve sur foule |
| 3 | 7,2 | Foule rouge, puis gros plan visage (père) ; tableau du niveau | pull-back sur visage | rouge saturé, brun | cut |
| 4 | 10,8 | Plongée dans le puits (niveaux), pyramide en fil de fer, étiquettes, « enterrée / la pointe » | descente en plongée, orbite lente | brun, or, fil de fer | noir court |
| 5 | 14,4 | Affiches en papier alignées sur un mur (texte d'alerte, dessins) | panoramique horizontal, léger zoom | brun sombre, papier crème | cut |
| 6 | 18,0 | Tunnel tourné, compteur rouge, affichage des chiffres | roulis, dolly-in | rouge, brun | cut sur chiffre |
| 7 | 21,6 | Panneau de règle, relevé mécanique, rouleaux de chiffres | fixe, zoom | brun, rouge, cadran | fondu sur noir |
| 8 | 25,2 | Relevé, personnage et visage en contre-plan, foule bokeh | dolly-in, suivi | brun chaud | cut |
| 9 | 28,8 | Recul sur foule, personnages debout, tunnel | recul, suivi | brun, lumière ambrée | cut |
| 10 | 32,4 | Gros plan roue de verrou, flou → net, panneau | mise au point | gris, ambre | cut |
| 11 | 36,0 | Radio, cadre de panneau, puis tunnel en lumière | fixe, puis travelling | ambre, gris | cut |
| 12 | 39,6 | Liste défilante de textes ; lignes rouges et blanches | défilement vertical | noir, rouge, blanc | fondu |
| 13 | 43,2 | Fond noir, personnages, texte « fermez » | fixe | noir, personnages ocre | noir |
| 14 | 46,8 | Personnage en escalier, marche, panneau de règle | suivi latéral | brun, faisceau | cut |
| 15 | 50,4 | Personnage qui monte, foule en bas, vue en plongée | suivi, roulis | brun, faisceau | cut |
| 16 | 54,0 | Balcons et escaliers vus de haut ; personnage ; gros plan | plongée, dolly-in | brun, gris | cut |
| 17 | 57,6 | Vieil homme en contre-plan, gestuelle (doigt), noir | fixe | ambre, carreaux | noir |
| 18 | 61,2 | Roue et levier, ouverture, flash blanc, visage | fixe → push-in, flash | blanc, gris clair | flash blanc |
| 19 | 64,8 | Gros plan personnage (yeux qui s'ouvrent), haut-parleur | fixe, dolly-in | gris, teal | cut |
| 20 | 68,4 | Faisceau vertical, tunnel, panneaux | fixe → zoom | blanc, sombre | cut |
| 21 | 72,0 | Chiffre rouge, haut-parleur, personnage flou | fixe, flou | rouge, noir | noir |
| 22 | 75,6 | Crowd, personnage au premier plan, ondes | fixe | noir, brun | cut |
| 23 | 79,2 | Noir, panneau de règle grand format | fixe | noir, brun | noir |
| 24 | 82,8 | Tunnel qui descend, plongée, cadre central lumineux | dolly-down, roulis | brun, or | cut |
| 25 | 86,4 | Tunnel en rotation, vue sur palier | roulis | brun, or | cut |
| 26 | 90,0 | Personnage âgé en plan fixe, gestuelle lente | fixe, léger zoom | ambre, gris | fondu |
| 27 | 93,6 | Question à deux choix, personnage, carte finale | fixe, puis plan du schéma | brun, noir, ambre | fondu noir |

Note [?] : les temps des planches sont approximatifs au niveau de l'image ; ils découlent de l'hypothèse 0,4 s.

---

## 7. Transitions et montage [OBS + DOC]

### 7.1 Transitions observées [OBS]
- **Noir complet** entre plans (planches 1, 3, 13, 17, 23, 27) : utilisé en fin de séquence.
- **Volet noir haut et bas** : fermeture très rapide (~0,10 s, 2 à 3 images) puis noir, puis plan suivant [DOC].
- **Zoom arrière** en début de plan sur visage : ~1,2 s [DOC].
- **Flash blanc** (planche 18-19) : sert de révélation.
- **Dissolution floue** (planche 2) : transition entre deux plans de foule.
- **Fondu de texte** (planche 12) : liste qui s'efface.

### 7.2 Enchaînement type [DOC + OBS]
Début de plan (zoom arrière ou dolly-in) → développement (cadrage tenu ou mouvement lent) → fin (noir haut/bas, ~0,1 s) → plan suivant.

### 7.3 Rythme [OBS + DOC]
- 41 plans en 96,9 s : moyenne 2,34 s / plan [DOC].
- Accélération sur les moments de tension (planches 6-8, 13-17), ralentissement sur révélation (18-19, 27).
- Les plans très courts (≈ 0,4–0,8 s) servent à ponctuer.

---

## 8. Narration et écriture (formule à conserver)

### 8.1 À conserver [DOC + OBS]
- Mot d'ouverture qui introduit immédiatement le spectateur dans une situation.
- Narration à la 2ᵉ personne ; le spectateur est le personnage.
- Voix du narrateur distincte de toute autre voix (les autres locuteurs sont signalés et identifiés).
- Système de règles numérotées, révélées une à une, de plus en plus lourdes.
- Escalade : chaque règle augmente l'enjeu ; une révélation change la compréhension.
- Dilemme final entre deux choix ; invitation à répondre en commentaire.
- Clôture unique.

### 8.2 Clôture obligatoire [DÉCISION UTILISATEUR]
La dernière phrase est exactement : **« Abonne-toi pour la partie 2. »** (remplace « Abonne-toi pour la suite. » du script de référence).

### 8.3 Durée [DÉCISION UTILISATEUR]
Futures vidéos : **1 min à 1 min 40**.

---

## 9. Rythme oral et timecodes (`VIDEO_01_TIMECODES_PAR_MOT.csv`)

- Lignes : 246 (mot ou groupe). Débit moyen ≈ 2,5 mots/s sur ~96 s avec silences.
- Anomalies signalées, non corrigées :
  - durée nulle sur deux lignes ;
  - chevauchements (« cette »/« sirène », « sont »/« fous », « bunker »/« ce ») ;
  - trous (0,2 à 1,0 s) à plusieurs endroits ; une phrase de 6 mots tenue sur 1,3 s ;
  - intervalle sans mot à 76,4 s.
- Le fichier `table_plans_claude.xlsx` a une colonne « Timecode MM:SS:CC » invalide (centièmes > 59). **Utiliser la colonne « Temps (secondes) »**.

---

## 10. Fiche technique (`VIDEO_01_FICHE_TECHNIQUE.txt`) [OBS]

| Paramètre | Valeur source |
|---|---|
| Durée | 1 min 36 s (96,917 s) ; audio ≈ 97 s |
| Image | 576 × 1024, 9:16 |
| Cadence | 30 fps CFR, progressif |
| Conteneur / codec | MPEG-4 / H.264 High, niveau 3.1 |
| Débit vidéo | 614 kb/s |
| Couleur | YUV 4:2:0, 8 bits, gamme limitée, BT.470 B/G |
| Audio | AAC LC SBR PS (HE-AACv2), 44,1 kHz, stéréo, 32 kb/s |
| Extraction | 1 image / 12 frames → 0,4 s, 242 captures |

Notes :
- Les timecodes des planches sont **théoriques** (pas dans les métadonnées).
- Format source 576×1024 ≠ format de production du projet 1080×1920 (CLAUDE.md) : ne pas confondre.

---

## 11. Contradictions et points restants [?]

1. **Durée** : CLAUDE.md du dépôt de travail = 60–90 s ; décision utilisateur = 1 min à 1 min 40 pour cette série. À aligner dans CLAUDE.md.
2. **Mouvements** : estimés sur planches de 0,4 s ; vérifier sur la vidéo originale si elle est fournie.
3. **Couleurs** : valeurs estimées, pas de HEX mesurés (HEX orange sable imposé par le projet).
4. **Timecodes planches** : l'hypothèse 0,4 s est théorique.

---

## 12. Checklist pour chaque nouvelle création

- [ ] Première phrase d'ouverture immédiate, à la 2ᵉ personne.
- [ ] Voix du narrateur distincte ; autres voix signalées.
- [ ] Univers, personnages, règles et dilemme **entièrement nouveaux** ; aucun élément de §5.2.
- [ ] Règles numérotées, révélées une à une, enjeu croissant.
- [ ] HUD fixe (étiquette + horloge + compteur), sous-titres mot par mot, mot actif en orange sable `#FF9A3C`.
- [ ] Palette : sombre désaturé + accents rouge/ambre/teal ; lumière motivée visible.
- [ ] Personnages : tête ronde claire, traits minimaux, coiffure froide, tenue chaude saturée.
- [ ] Au moins un plan par type de §3 ; alternance personnage / détail / environnement.
- [ ] Caméra : glissés lents, pull-back sur visages, rotation de tunnel, focus qui se fait ; pas de mouvement brusque hors révélation.
- [ ] Transitions : noir haut/bas ~0,1 s en fin de plan ; flash blanc pour une révélation ; zoom arrière ~1,2 s en début de plan si le sujet s'y prête.
- [ ] Dilemme A/B en pilules à l'écran ; invitation à répondre en commentaire.
- [ ] Dernière phrase exacte : « Abonne-toi pour la partie 2. »
- [ ] Durée finale 1 min 00 à 1 min 40 ; rythme moyen ~2,3 s / plan à adapter.
- [ ] Timecodes mot par mot verrouillés avant le son.
- [ ] Format de production 1080×1920, 30 fps (CLAUDE.md).

---

## 13. Règles de non-reproduction

- Ne pas recopier le script, les répliques, les personnages, les plans, les visuels ni les noms de lieux de la référence.
- Les sources (`PLANCHES_CONTACT/`, `IMAGE/`, `SCRIPT/`) servent à l'étude du style uniquement ; ne pas les publier.
- Le contenu peut changer ; le style doit rester fidèle.

---

## 14. Journal

- 2026-11-17 : création à partir du dépôt `INSTRUCTIONS-VIDEO-STYLE` (commit `5113b0c`). Planches 1 à 27 analysées (version précédente : seule la planche 1 était ouverte).
- 2026-11-17 : validé par l'utilisateur — clôture « Abonne-toi pour la partie 2. » ; durée 1 min à 1 min 40.
