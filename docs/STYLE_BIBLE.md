# STYLE BIBLE — Référence centrale (série « Le Mur », ép. 1 — dépôt INSTRUCTIONS-VIDEO-STYLE)

Source unique : `augustevenail-ops/INSTRUCTIONS-VIDEO-STYLE` (commit `5113b0c`).
Analyse faite une fois. Les réponses futures doivent s'appuyer sur ce fichier ; les sources (images, planches, timecodes) ne sont relues que pour vérifier un détail.

Statuts utilisés :
- **[OBS]** observé directement dans un fichier source (image, tableau, fiche).
- **[DOC]** affirmé par un document de consignes du dépôt, non vérifié par moi.
- **[INT]** interprétation probable.
- **[?]** à vérifier ou contradictoire.

---

## 0. Périmètre de l'analyse

| Élément | Contenu | État de l'analyse |
|---|---|---|
| `00_MASTER_INSTRUCTIONS/00 Information_Directive_du_Projet.txt` | Directive globale : rôle de chaque section, hiérarchie, livrable en 5 parties | Lu en entier |
| `IMAGE/00 PROMPT_DIRECTEUR_SECTION_IMAGE.txt` | Méthode d'analyse des 41 premières images | Lu en entier |
| `IMAGE/Plan 1` à `Plan 41` (.jpg / .PNG, 41 fichiers) | Première image (ou image représentative) de chaque plan | Vues en planches de contact (montage 1-16, 17-32, 33-41) |
| `IMAGE/table_plans_claude.xlsx` | Feuille « Plans » (41 lignes) + feuille « Lisez-moi » | Lu en entier |
| `PLANCHES_CONTACT/00 prompt_directeur_planche_contact.txt` | Méthode d'analyse des planches (0,4 s entre images) | Lu en entier |
| `PLANCHES_CONTACT/Planche 1` à `Planche 27` (.zip, chacun un .TIF d'environ 16 Mo, 9 images) | Séquence temporelle | **Seule la Planche 1 a été ouverte** (réduite). Les planches 2-27 restent à analyser visuellement. |
| `SCRIPT/ 00 prompt_directeur_script.txt` | Méthode d'analyse narrative (« bible de style narratif ») | Lu en entier |
| `SCRIPT/VIDEO_01_SCRIPT_COMPLET_FINAL.txt` | Texte de référence | Lu en entier (**non recopié ici**, voir §5) |
| `SCRIPT/VIDEO_01_TIMECODES_PAR_MOT.csv` | Timecodes mot par mot | Lu en entier |
| `SCRIPT/VIDEO_01_FICHE_TECHNIQUE.txt` | Caractéristiques du fichier source | Lu en entier |

Hiérarchie (Directive §6) : script = référence du contenu ; prompts directeurs = méthodes de travail (ils ne remplacent pas les documents) ; 41 images = référence visuelle des plans ; planches = dynamique ; fiche technique = contraintes ; timecodes = référence temporelle.

---

## 1. Identité du projet

- **Format** : vidéo verticale 9:16, fiction angoissante en voix off, sous-titres incrustés, 41 plans.
- **Univers** : un bunker souterrain en forme de pyramide inversée, numéroté niveau 31, compteur de places « 4 112 / 4 112 » (passant à 4 113 après le premier tirage), horloge du HUD 17:40 → 18:00.
- **Ton** : tension et mystère, narration **à la deuxième personne** (« tu »), caméra subjective. Pas de musique ni de jeu sur le ton de la voix signalés dans les documents [?].
- **Intention** : faire vivre une règle après l'autre, provoquer une question ouverte, finir sur un choix.
- **Éléments de l'histoire (résumé abstrait, à ne pas recopier)** : un système de règles révélé progressivement, une loterie de départ, une trappe, une radio qui diffuse une voix, un spectateur qui regarde ou se tait. Les noms et répliques exacts restent dans le script de référence.

---

## 2. Identité visuelle

### 2.1 Style graphique [OBS]
- **Personnages** : cartoon 2D simplifié. Tête ronde blanc-gris, yeux noirs ponctuels, pas de traits de nez marqués, petites bouches. Silhouettes compactes, membres simples (bâtons articulés pour les figurants). Vêtements : bonnet teal côtelé, écharpe vert sauge, combinaison orange/brune, badge de matricule « 31-207 », « 31-208 ».
- **Personnages secondaires** : vieil homme à moustache/barbe grise et veste carreau (niveau 12, doigt sur la bouche = signe de silence) ; le père, figure grise à barbe blanche, mêmes proportions.
- **Foule** : centaines de petites silhouettes sombres et floues, rendues en profondeur (flou de champ) ; utilisées comme arrière-plan ou masse.
- **Décors** : salle de cantine (plateau gris, bol de soupe fumante, quart métallique, biscuit) au plan 1-3 ; gradins et rangées d'anneaux ; couloirs en perspective carrée/tunnel (spirale vers le centre, rivets) ; trappe circulaire à volant (roue à 8-12 repères) ; pyramide en fil de fer (wireframe) pour les plans de l'extérieur/bunker.
- **Encre / contours** : contours sombres et nets sur les personnages ; décors plus abstraits, traits fins (rivets, rails, lignes de perspective).
- **Aplats** : remplissage plat avec dégradés doux, légères lueurs ; pas de texture peinte visible [OBS, à confirmer sur planches].
- **Rendu** : 2D vectoriel / animation stylisée, avec flou de profondeur sur premier plan (visages flous en bord de cadre).

### 2.2 Palette [OBS, estimée à l'œil — pas de valeurs HEX mesurées]
- Dominante **brun chaud très sombre / noir**. Fond de salle : brun-charbon.
- Accents chauds : **orange sable** (sous-titres, combinaisons, tuyau de la louche), ambre (lumières de salle).
- Accent d'alerte : **rouge** (faisceaux d'alarme, numéros de places en rouge après le tirage, « RELÈVE – NE JAMAIS OUVRIR DU DEDANS »), **rouge sang** pour la sirène (plan 3-5).
- Froid : **teal/vert-bleu** (bonnet, écharpe), **cyan** ponctuel (trappe).
- Lumière blanche / gris clair : radio, trappe ouverte (plan 30-35), fin de séquence.
- Règle observée : zones sombres désaturées + accents saturés (rouge, orange, cyan). Jamais de gris terne uniforme.

### 2.3 Lumière [OBS]
- **Lumière motivée** : suspensions au plafond (points lumineux), lumière de la louche / de la salle, faisceau de radio, rouge d'alarme. Les personnages sont éclairés par la source visible.
- Contre-jour fréquent sur les silhouettes de la foule.
- Trappe ouverte = source blanche qui éblouit (plan 30-31).
- Pas de lumière uniforme ; chaque plan a une source identifiable.

### 2.4 Typographie et HUD (fixe sur toute la vidéo) [OBS]
- Coin haut-gauche : « ★ ÉPISODE 1 », horloge (17:40 → 18:00), « NIVEAU 31 » (petit).
- Coin haut-droit : « PLACES » + compteur « 4 112 / 4 112 » (passe à **4 113** en rouge à partir du plan 10-12).
- Sous-titres : texte blanc MAJUSCULE, gras sans-serif arrondi, centré en bas (terçe inférieur). **Mot en cours en orange sable**. Mots du sous-titre affichés un par un (karaoké).
- Textes diégétiques autorisés et utilisés : panneau « RÈGLE 1 » (encadré), affiche « ILS SONT FOUS », relevé « TIRAGE : LE RELEVÉ », « RELÈVE – NE JAMAIS OUVRIR DU DEDANS » (rouge sous la trappe), gros « 3 » pour la règle 3, liste « ILS SONT MONTÉS ».
- Plan 1 : écran noir, seul le sous-titre « IMAGINE : » apparaît (ouverture à l'écran noir).

### 2.5 Cadrages et composition [OBS]
- Majoritairement **plans rapprochés et gros plans** du personnage, le visage occupe le tiers supérieur.
- Plans larges de salle (foule en bas du cadre, gradins), plans verticaux de tunnel (profondeur forte, perspective axiale).
- Personnage centré ou décentré à gauche/droite, souvent flou sur un bord (profondeur).
- Visage coupé par le bord : fréquent au début de plan (cohérent avec le zoom arrière, §3.2).
- Inclinaisons de caméra (plan 10 : tunnel incliné en diagonale ; plan 17 : cage en rotation).

### 2.6 Caméra et animation [OBS sur images fixes ; mouvement à vérifier sur vidéo]
- Travellings avant/arrière dans les tunnels et la salle (perspective qui se déforme).
- Rotations et inclinaisons du plan entier (plan 10 : tunnel en diagonale).
- Zoom avant/arrière sur visages (plan 20 : radio en premier plan flou ; plan 33-34 : visage flou en gros plan).
- Mouvements de personnages : pas courts, marche simple (escalier niveau 12, plan 26).
- Mouvement de la trappe : roue qui tourne (plans 8, 28).
- Mouvements exacts → **à vérifier sur la vidéo originale** (non fournie).

---

## 3. Grammaire de montage

### 3.1 Rythme [OBS + DOC]
- **41 plans** sur 96,9 s (fichier) — durée moyenne ≈ **2,34 s par plan** (repère, pas règle).
- Plans très courts : plan 1 (écran noir), plans 3-4 (sirène), plan 7 (flou).
- Plans plus longs : plans 8-10 (pyramide, tunnel), plans 27-32 (trappe, radio).
- Alternance : personnage / détail / environnement / personnage.
- Accélération ponctuelle autour du tirage (plans 12-16), décélération sur la radio et la trappe (plans 19-32).

### 3.2 Transition de début : zoom arrière [DOC, observé sur planches]
- Plan qui commence très serré, sujet parfois coupé par le bord.
- Zoom arrière fluide d'environ **1,2 s**, cadrage qui s'élargit.
- Le personnage finit à peu près à la moitié de la hauteur du cadre.
- À utiliser sur visages, personnages et détails ; moins sur les maquettes ; pas sur les lieux pleins.

### 3.3 Transition de fin : volet noir haut et bas [DOC]
- Image normale, puis noir en tiers supérieur et tiers inférieur (centre encore visible), noir complet, plan suivant.
- Durée ≈ **0,10 s** (2 à 3 images à 30 fps).
- Ce n'est **pas** un fondu : fermeture simultanée haut/bas, très rapide.
- Élément d'identité : à reproduire systématiquement en fin de plan.

### 3.4 Enchaînement type [DOC]
Début de plan (zoom arrière ~1,2 s si adapté) → développement (cadrage tenu ou mouvement) → fin (volet noir haut/bas) → plan suivant.

### 3.5 Exemple de plans clés (repères, vérifiés sur la planche 1 et les montages)
Repères de la planche de contact (numéros de plan vérifiés sur les montages `Plan 1`-`Plan 41`) :
- Plan 1 (00:00.00) : noir + « IMAGINE : ».
- Plan 2 (00:00.10) : bol de soupe, louche, cantine.
- Plans 3-4 (00:02.40 / 00:03.00) : sirène rouge (dôme) avec « ET CETTE » / « SIRÈNE VEUT ».
- Plan 5-6 : foule et visage en gros plan.
- Plan 8 (00:11.80) : pyramide en fil de fer (bunker).
- Plan 10 : compteur du puits en tunnel incliné.
- Plan 12 (00:21.00) : panneau « RÈGLE 1 » ; compteur passe à 4 113.
- Plan 13 (00:24.70) : « CE SOIR » ; plan 14 : « LE TIRAGE » (relevé).
- Plan 17 (00:31.00) : « TU AVANCES » ; plan 18 : trappe (cercle à volant).
- Plan 20 (00:37.40 env.) : radio (« UNE RADIO »).
- Plan 21 : affiche « ILS SONT MONTÉS » ; plan 22-23 : père / « RÈGLE 2 ».
- Plan 25 (00:47.80 env.) : « TOI, » en gros plan ; plan 26 : niveau 12, vieil homme.
- Plan 28 : trappe qui « S'OUVRE » ; plan 30 : radio en faisceau ; plan 31 : trappe.
- Plan 32 : « SE REFERME » (volet rouge).
- Plan 36 : « RÈGLE 3 » ; plan 38-39 : vieil homme, doigt sur la bouche ; plan 40 : « TU DIS ».
- Plan 41 : pyramide wireframe (fin).

Tableau complet des timecodes : voir §6.

---

## 4. Personnages — règles de cohérence [OBS]
- Tête blanche/grise ronde, yeux noirs, bouche minimale.
- Bonnet teal + écharpe vert sauge pour le personnage principal (en orange/brun pour les figurants en combinaison).
- Combinaison orange-brune + badge matricule (31-207, 31-208).
- Vieil homme (niveau 12) : costume carreau, moustache grise, doigt sur la bouche.
- Père : barbe blanche, gros plan (plan 25-27 et 34-35).
- Foule : silhouettes sombres, floues en profondeur.
- Ne pas supposer que deux personnages sont identiques parce qu'ils se ressemblent [DOC].

---

## 5. Narration et écriture (formule à conserver, pas l'histoire)

### 5.1 À conserver (formule) [DOC + OBS sur le script]
- **Première phrase** commence par « Imagine ».
- **Narration à la 2ᵉ personne** (« tu »), caméra subjective.
- **Voix du narrateur distincte** de toute autre voix ; le père à la radio est signalé comme locuteur distinct.
- **Système de règles numérotées** (« Règle numéro 1 », « 2 », « 3 ») révélées une à une, chacune plus lourde de conséquences.
- **Rythme** : phrases courtes, ruptures par des silences, révélations en fin de phrase.
- **Dilemme final** : un choix entre deux options, adressé au spectateur.
- **Appel à l'interaction** : demander la réponse en commentaire.
- **Phrase de clôture** (voir contradiction §8).

### 5.2 À renouveler (chaque nouvelle histoire)
- Univers, lieu, personnages, relations, règles de l'univers, obstacles, révélations, scènes, dilemme.
- Ne pas faire une simple transposition (nouveaux noms + même intrigue) [DOC].
- Ne pas reprendre le même type de personnage principal, le même lien familial, le même antagoniste.

### 5.3 Résumé structurel (sans copier le script) [DOC + OBS]
Accroche « Imagine » → installation immédiate (cantine / sirène) → présentation du personnage et de sa situation → univers et contraintes → règle 1 → tirage → règle 2 → révélation (la trappe s'ouvre, première fois qu'il voit le jour) → règle 3 → rappel du vieil homme → dilemme final → appel au commentaire → clôture.

### 5.4 Musique / voix [DOC]
- Voix du narrateur : ton constant, la tension vient des mots et des pauses (CLAUDE.md du dépôt de travail).
- Voix du père à la radio : **voix différente**, en gros plan audio.
- Pauses observées : 0,3 s avant « Puis » ; trou de 1,0 s après « s'ouvre » ; long silence (≈ 1 s) avant « Personne ne réagit » (à vérifier).

---

## 6. Rythme oral et timecodes (fichier `VIDEO_01_TIMECODES_PAR_MOT.csv`)

- Source du tableau : dictée et correction de l'utilisateur [DOC]. Plusieurs lignes sont signalées comme approximatives ou erronées dans le CSV lui-même.
- Lignes enregistrées : 246 (mot ou groupe), hors en-tête.
- Débit global : ~96 s pour ≈ 240 mots → **~2,5 mots/s en moyenne**, avec des silences (la fiche indique ~4,5 syll/s en parole pleine, non vérifié ici).
- Anomalies à signaler (non corrigées) :
  - « est » (00:34.0–00:34.0) : durée nulle, probablement erroné.
  - « la » (01:10.0–01:10.0) : durée nulle.
  - Chevauchements : « cette » / « sirène » (2,3–2,4 s), « sont » / « fous » (42,3–42,4 s), « bunker » / « ce » (01:31,1–01:31,2).
  - Trous : 0,3 s avant « dos » ; 0,2 s avant « se » ; 1,0 s après « s'ouvre » ; 0,3 s avant « Tu » ; 0,4 s après « jour ».
  - Tronçon « tout le monde arrête de bouger » : 1,3 s pour 6 mots, marqué comme anormal.
  - Intervalle sans mot à 01:16.4–01:16.6 (aucun mot dans la dictée).
- Tableau d'images (`table_plans_claude.xlsx`) : colonne « Timecode MM:SS:CC » contient des valeurs **invalides** (CC > 59 : 00:05:60, 00:07:75, 00:11:80, 00:14:20 peut passer, etc.). **Utiliser la colonne « Temps (secondes) »** (décimales correctes), qui est la référence.

---

## 7. Contraintes techniques [OBS, fiche technique]

| Paramètre | Valeur source |
|---|---|
| Durée | 1 min 36 s (96,917 s), audio ≈ 97 s |
| Image | 576 × 1024, vertical 9:16 |
| Cadence | 30 fps, CFR, progressif |
| Conteneur / codec | MPEG-4 / H.264 High, niveau 3.1 |
| Débit vidéo | 614 kb/s |
| Couleur | YUV 4:2:0, 8 bits, gamme limitée, BT.470 B/G |
| Audio | AAC LC SBR PS (HE-AACv2), 44,1 kHz, stéréo, 32 kb/s |
| Extraction des images | Photo Interval : 1 image / 12 frames → 0,4 s, 242 captures |

Notes :
- Les **timecodes du CSV sont théoriques** (première capture à 00:00, pas de 0,400 s) : ils ne sont pas dans les métadonnées des photos. Vérifier visuellement quelques captures (début, milieu, fin).
- **Contradiction de format** : la fiche indique 576 × 1024, le dépôt de travail (CLAUDE.md) impose 1080 × 1920 pour ses propres vidéos. Ce sont deux choses différentes (source vs production) — à ne pas confondre.
- Durée : le prompt directeur image vise des futures vidéos de 1 min à 1 min 40 ; CLAUDE.md du dépôt de travail impose 60-90 s. **Conflit à trancher par l'utilisateur.**

---

## 8. Contradictions et points à valider [?]

1. **Phrase finale** : la directive du script impose « Abonne-toi pour la partie 2. » ; le script de référence se termine par « Abonne-toi pour la suite. ». À trancher.
2. **Durée cible** : 1–1 min 40 (prompt image) vs 60–90 s (CLAUDE.md projet). À trancher.
3. **Timecodes xlsx** : colonne MM:SS:CC invalide ; seul « Temps (secondes) » est fiable.
4. **Planches 2-27** : non ouvertes. Analyse de mouvement (0,4 s d'intervalle) à compléter.
5. **Mouvement caméra** : estimé sur images fixes. Vérifier sur la vidéo originale (non fournie dans le dépôt).
6. **Couleurs** : valeurs estimées à l'œil, pas de HEX mesurés.
7. **Nombre de places** : 4 112 → 4 113 après le premier tirage ; pas de règle écrite de mise à jour dans les documents.

---

## 9. Checklist pour chaque nouvelle création (issue du prompt narratif, adaptée au style)

- [ ] Première phrase commence par « Imagine » ou équivalent validé.
- [ ] Narration à la 2ᵉ personne ; voix du narrateur distincte des autres locuteurs.
- [ ] Univers et règles **entièrement nouveaux** ; aucune reprise de noms, répliques, scènes ou visuels de la référence.
- [ ] Règles révélées une à une, numérotées, avec enjeu croissant.
- [ ] Dilemme final entre deux options, invitation à répondre en commentaire.
- [ ] Clôture conforme à la phrase validée (§8.1).
- [ ] HUD fixe, sous-titres blancs avec mot actif orange sable, textes diégétiques autorisés.
- [ ] Palette : sombre désaturée + accents saturés (rouge, orange, teal).
- [ ] Lumière motivée visible dans chaque plan.
- [ ] Début de plan : zoom arrière ~1,2 s si le sujet s'y prête ; fin : volet noir haut/bas ~0,10 s.
- [ ] Rythme moyen ~2,3 s par plan ; 41 plans pour ~96 s en référence (à adapter à la durée cible).
- [ ] Timecodes mot par mot verrouillés avant le son ; pas de timecode inventé.
- [ ] Format de production : 1080 × 1920, 30 fps (CLAUDE.md).

---

## 10. Règles de non-reproduction (rappel)

- Ne pas recopier le script, les répliques, les personnages, les plans ou les visuels de la référence dans une nouvelle création.
- Les sources (`references/`, vidéo et planches) servent à l'étude du style uniquement ; ne pas les publier.
- Le contenu peut changer ; le style doit rester fidèle.

---

## 11. Journal des mises à jour

- 2026-11-17 : création de ce fichier à partir du dépôt `INSTRUCTIONS-VIDEO-STYLE` (commit `5113b0c`). Planches 2-27 non analysées. Mettre à jour dès qu'une information validée arrive.
