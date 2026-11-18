# Plan des plans — LA COURONNE, épisode 1 (v2)

Voix : `voix_v9/voix_complete_v11.mp3` (70,55 s). Minutage mot à mot : `voix_v9/mots_v11.json`. Données machine : `plans_ep01.json`.

## Nombre de plans
- Référence VIDEO_01 : 41 plans pour 96,9 s (2,36 s par plan).
- Épisode : 70,55 s de voix + carte de fin = **72,6 s**, **32 plans**, moyenne 2.34 s (hors noir d'ouverture).

## Règles de coupe et transitions
- Chaque coupe tombe **2 images avant le premier mot du plan suivant** (réaction 0 à 3 images avant le mot).
- **Sortie de chaque plan** (3 dernières images, ≈ 0,1 s) : image normale, puis noir sur le tiers haut et le tiers bas (bande centrale visible), puis noir complet.
- **Entrée de chaque plan** : dézoom de 1,2 s (échelle 1,25 vers 1,0, ralenti en fin). Sur les plans FPV et la vue aérienne, le mouvement propre continue après le dézoom.
- Plan 1 : noir avec « IMAGINE, » (0,1 s), comme le plan 1 de la référence. Dernier plan : carte de fin sur « Abonne-toi », puis fondu au noir.

## Plan 2 : accroche (même logique que la soupe de la référence : objet du quotidien, puis le personnage apparaît)
- 0.10 s : très gros plan : boussole, l'aiguille tremble et oscille (le champ magnétique perturbe le nord) ; tasse fumante floue au premier plan
- 1.07 s : « tu vis » : recul continu, les mains du père et du héros entrent dans le cadre, la table apparaît
- 1.99 s : « dôme magnétique » : plan à deux révélé, héros au centre, père à côté ; en haut, un segment du dôme grésille en rouge
- Pourquoi une boussole : objet ordinaire de la table, mais son aiguille affolée montre tout de suite que le monde est sous un champ magnétique ; elle annonce le sujet sans le dire.

## Plan 8 : vue aérienne avec étiquettes (une seule prise, caméra calée sur la voix)
- 14.31 s : vue d'ensemble du dôme vu de haut (3/4), lent glissement
- 14.31 s : la caméra pousse vers le centre
- 15.05 s : étiquette « LES RICHES » sur les tours
- 15.67 s : étiquette « LE CENTRE » sur l'hexagone doré
- 16.45 s : recul + rotation : l'anneau des districts entre dans le cadre
- 17.41 s : étiquettes des 6 districts en cascade (0,08 s d'écart) : NORD, NORD-EST, SUD-EST, SUD, SUD-OUEST, OUEST
- Étiquettes : pilules sombres à bord clair et trait de liaison (grammaire des planches 4-5) ; chaque étiquette apparaît 2 images avant son mot.

## Diversité et cohérence
- personnage : plans 2, 11, 14, 15, 16, 17, 18, 23, 28, 29, 30, 31
- détail / panneau / écran : plans 3, 9, 12, 21, 24, 25
- environnement : plans 6, 7, 20, 26
- FPV : plans 4, 5, 10, 13, 19, 22
- infographie / vue aérienne : plans 8, 27
- noir / carte : plans 1, 32
- Plans 4 et 5 : deux FPV de suite mais opposés (vue verticale immobile sur la foule, puis plongée à travers le dôme) ; gardés tels quels.
- Motifs qui reviennent : haut-parleur du conseil, panneaux de règle, foule vue d'en haut, garde, dôme (plongée, vue aérienne, rétraction).
- Lumière par moment du récit : nuit teal et ambre (annonce, districts) ; doré (centre) ; bordeaux (conseil) ; aube froide (arrestation) ; rouge (compte à rebours, exécution).

## Tableau
| # | Début | Fin | Durée | Voix | Plan | Scène | Caméra |
|---|---|---|---|---|---|---|---|
| 1 | 0.00 | 0.10 | 0.10 | (noir) « IMAGINE, » | Noir + « IMAGINE, » (accroche, réf. plan 1) | `noir` | fixe |
| 2 | 0.10 | 2.45 | 2.35 | tu vis sous un dôme magnétique | Accroche : très gros plan sur une boussole posée sur la table, aiguille qui tremble sous le champ du dôme (reflet teal dans le verre, tasse fumante à côté) ; recul continu qui révèle le héros au centre et son père à côté, le bord du dôme qui grésille au-dessus | `a_creer:c11_boussole_table` | voir « cles » : départ très serré sur la boussole, recul continu jusqu'au plan à deux |
| 3 | 2.45 | 4.81 | 2.36 | et d'ici 3 jours, il sera coupé. | Compte à rebours 72:00 sur l'écran public | `w2_compte_a_rebours` | push-in lent |
| 4 | 4.81 | 6.75 | 1.94 | 10 000 personnes arrêtent de bouger. | FPV vue de dessus : la foule s'immobilise, le héros au centre | `f3_fpv_foule_dessus` | descente verticale + rotation lente |
| 5 | 6.75 | 9.47 | 2.72 | Le champ magnétique vous protège des radiations extérieures, | FPV : plongée à travers le dôme | `f1_fpv_plongee_dome` | plongée continue + roulis |
| 6 | 9.47 | 10.87 | 1.40 | mais le conseil vient d'annoncer | Haut-parleur du conseil (bordeaux) | `w5_haut_parleur` | contre-plongée fixe, ondes |
| 7 | 10.87 | 14.31 | 3.44 | qu'il n'y a plus assez d'énergie pour le maintenir sur les districts. | Rue de district : les lampadaires s'éteignent un à un | `a_creer:w10_lampes_eteintes` | travelling latéral lent |
| 8 | 14.31 | 18.45 | 4.14 | Ici, les riches habitent au centre. Tout autour, il y a les districts. | Vue aérienne du dôme : la caméra va au centre puis recule sur l'anneau des districts ; étiquettes qui apparaissent avec la voix | `a_creer:w1d_vue_aerienne_tags` | voir « cles » : poussée vers le centre, puis recul + rotation sur les districts |
| 9 | 18.45 | 21.75 | 3.30 | Règle numéro 1. Ne sors jamais du dôme. | Panneau RÈGLE 1 (néon) | `w3_regle_1` | fixe, néon qui s'allume |
| 10 | 21.75 | 24.33 | 2.58 | Dehors, l'air tue en quelques minutes. | FPV : traversée de la barrière vers le désert irradié | `a_creer:f5_fpv_barriere` | avancée rapide |
| 11 | 24.33 | 25.97 | 1.64 | Ton père est ingénieur. | Le père, buste (présentation) | `c4_pere_buste (sans feuille)` | fixe |
| 12 | 25.97 | 28.55 | 2.58 | Le soir même, il demande à voir les dossiers sur le dôme. | Insert : ses mains ouvrent le dossier « DÔME » | `a_creer:d1_dossier` | plongée fixe |
| 13 | 28.55 | 30.35 | 1.80 | Le lendemain matin, | FPV : rue au petit matin vers le centre, « TOI » | `f2_fpv_rue` | avancée |
| 14 | 30.35 | 31.53 | 1.18 | des gardes l'emmènent, | Le père emmené par le garde (plan à deux) | `c5_pere_escorte` | fixe |
| 15 | 31.53 | 32.75 | 1.22 | il ne se débat pas, | Gros plan du père, calme | `a_creer:c4b_pere_gros_plan` | fixe |
| 16 | 32.75 | 35.77 | 3.02 | Prends ça, c'est la seule chose qui peut nous sauver. | Le père tend la feuille pliée (« Prends ça ») | `c4_pere_buste` | push-in très lent |
| 17 | 35.77 | 37.35 | 1.58 | Tu demandes où on l'emmène, | Le héros, buste, inquiet | `c2_heros_buste` | fixe |
| 18 | 37.35 | 39.37 | 2.02 | le garde répond : « Au centre. » | Le garde, contre-jour doré : « Au centre » | `c6_garde_centre` | fixe |
| 19 | 39.37 | 41.63 | 2.26 | le centre, où vivent les plus riches, | FPV : vers la porte du centre, tours dorées | `a_creer:f6_fpv_centre` | avancée |
| 20 | 41.63 | 43.11 | 1.48 | personne n'en revient. | La porte du centre se referme | `a_creer:w9_porte` | fixe, lumière qui se coupe |
| 21 | 43.11 | 46.31 | 3.20 | Règle numéro 2. Tu ne vas jamais au centre. | Panneau RÈGLE 2 (néon) | `a_creer:w3b_regle_2` | fixe, néon qui s'allume |
| 22 | 46.31 | 48.41 | 2.10 | un mur le sépare des districts. | FPV : montée le long du second mur | `f4_fpv_mur_montee` | montée continue + roulis |
| 23 | 48.41 | 49.81 | 1.40 | Tu déplies la feuille, | Le héros, feuille à la main, regard baissé | `c8_heros_feuille` | fixe |
| 24 | 49.81 | 51.55 | 1.74 | ton père a écrit une seule phrase : | Plan subjectif : la feuille dépliée | `w4_feuille_lecture` | fixe |
| 25 | 51.55 | 54.11 | 2.56 | « Il reste de l'énergie. Ils nous mentent. » | Plan subjectif : gros plan sur le texte | `w4_feuille_lecture (cadré serré)` | push-in |
| 26 | 54.11 | 56.23 | 2.12 | Le conseil annonce à la radio : | Foule de dos sous le haut-parleur | `a_creer:w5b_foule_haut_parleur` | contre-plongée |
| 27 | 56.23 | 59.81 | 3.58 | seul le centre restera protégé à cause du manque d'énergie, | Infographie : le champ se rétracte sur le centre | `a_creer:w1c_infographie_retraction` | rotation lente |
| 28 | 59.81 | 62.01 | 2.20 | les agitateurs seront exécutés. | Le garde, gros plan, lumière rouge | `a_creer:c6b_garde_gros_plan` | fixe |
| 29 | 62.01 | 64.03 | 2.02 | Tu révèles ce que tu sais à tout le dôme | Le héros dans la foule (vue haute) | `c7_heros_foule` | descente lente |
| 30 | 64.03 | 66.29 | 2.26 | et ton père risque d'être exécuté. | Le père enfermé, seul | `a_creer:c9_pere_cellule` | fixe |
| 31 | 66.29 | 68.99 | 2.70 | Ou tu te tais ? Choisis en commentaire. | Le héros face caméra + question + choix A/B | `a_creer:c10_heros_question` | fixe ; pilules au mot « Choisis » |
| 32 | 68.99 | 72.60 | 3.61 | Abonne-toi pour la partie 2. | Carte de fin : LA COURONNE · ÉPISODE 1 · ABONNE-TOI | `a_creer:fin_carte` | dôme filaire qui tourne |

## Scènes à créer avant le montage
- plan 2 : `c11_boussole_table`, boussole à l'aiguille affolée en très gros plan, puis recul sur le héros et son père à table
- plan 7 : `w10_lampes_eteintes`, Rue de district : les lampadaires s'éteignent un à un
- plan 8 : `w1d_vue_aerienne_tags`, Vue aérienne du dôme : la caméra va au centre puis recule sur l'anneau des districts ; étiquettes qui apparaissent avec la voix
- plan 10 : `f5_fpv_barriere`, FPV : traversée de la barrière vers le désert irradié
- plan 12 : `d1_dossier`, Insert : ses mains ouvrent le dossier « DÔME »
- plan 15 : `c4b_pere_gros_plan`, Gros plan du père, calme
- plan 19 : `f6_fpv_centre`, FPV : vers la porte du centre, tours dorées
- plan 20 : `w9_porte`, La porte du centre se referme
- plan 21 : `w3b_regle_2`, Panneau RÈGLE 2 (néon)
- plan 26 : `w5b_foule_haut_parleur`, Foule de dos sous le haut-parleur
- plan 27 : `w1c_infographie_retraction`, Infographie : le champ se rétracte sur le centre
- plan 28 : `c6b_garde_gros_plan`, Le garde, gros plan, lumière rouge
- plan 30 : `c9_pere_cellule`, Le père enfermé, seul
- plan 31 : `c10_heros_question`, Le héros face caméra + question + choix A/B
- plan 32 : `fin_carte`, Carte de fin : LA COURONNE · ÉPISODE 1 · ABONNE-TOI
