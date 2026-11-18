# Plan des plans — LA COURONNE, épisode 1

Voix : `voix_v9/voix_complete_v11.mp3` (70,55 s). Minutage mot à mot : `voix_v9/mots_v11.json`. Données machine : `plans_ep01.json`.

## Nombre de plans
- Référence VIDEO_01 : 41 plans pour 96,9 s, soit 2,36 s par plan en moyenne.
- Voix de l'épisode : 70,55 s, plus la carte de fin, soit **72,6 s au total**.
- **33 plans**, durée moyenne 2.27 s (hors noir d'ouverture), de 1,18 s à 3,61 s.

## Règles de coupe
- Chaque coupe tombe **2 images avant le premier mot du plan suivant** (réaction 0 à 3 images avant le mot).
- **Sortie de chaque plan** (3 dernières images, environ 0,1 s) : image normale, puis noir sur le tiers haut et le tiers bas (bande centrale visible), puis noir complet.
- **Entrée de chaque plan** : dézoom de 1,2 s (échelle 1,25 vers 1,0, ralenti en fin). Sur les plans FPV, le mouvement propre du plan continue après le dézoom.
- Plan 1 : noir avec « IMAGINE, » (0,1 s), comme le plan 1 de la référence.
- Plan 33 : la carte de fin arrive sur « Abonne-toi », comme dans la référence, puis fondu au noir.

## Diversité et cohérence
- personnage : plans 12, 15, 16, 17, 18, 19, 24, 29, 30, 31, 32
- détail / panneau / écran : plans 3, 10, 13, 22, 25, 26
- environnement : plans 5, 6, 8, 9, 21, 27
- FPV : plans 2, 4, 11, 14, 20, 23
- infographie : plans 7, 28
- noir / carte : plans 1, 33
- Jamais deux plans du même type de suite, sauf les plans 25-26 (même feuille, cadrage resserré, le texte devient lisible) et 15-16-17 (séquence du père).
- Motifs qui reviennent : haut-parleur du conseil (plans 6 et 27), panneaux de règle (10 et 22), infographie du dôme (7 et 28), foule vue d'en haut (4 et 30), garde (15, 19, 29).
- Lumière par moment du récit : nuit froide teal et ambre (annonce, districts) ; doré (centre) ; bordeaux (conseil) ; aube froide (arrestation) ; rouge (compte à rebours, exécution).

## Tableau
| # | Début | Fin | Durée | Voix | Plan | Scène | Caméra |
|---|---|---|---|---|---|---|---|
| 1 | 0.00 | 0.10 | 0.10 | (noir) « IMAGINE, » | Noir + « IMAGINE, » (accroche, réf. plan 1) | `noir` | fixe |
| 2 | 0.10 | 2.45 | 2.35 | tu vis sous un dôme magnétique | FPV : plongée à travers le dôme vers le centre | `f1_fpv_plongee_dome` | plongée continue + roulis |
| 3 | 2.45 | 4.81 | 2.36 | et d'ici 3 jours, il sera coupé. | Compte à rebours 72:00 sur l'écran public | `w2_compte_a_rebours` | push-in lent |
| 4 | 4.81 | 6.75 | 1.94 | 10 000 personnes arrêtent de bouger. | FPV vue de dessus : la foule s'immobilise, le héros au centre | `f3_fpv_foule_dessus` | descente verticale + rotation lente |
| 5 | 6.75 | 9.47 | 2.72 | Le champ magnétique vous protège des radiations extérieures, | Limite du dôme : barrière teal, désert irradié dehors | `a_creer:w8_barriere` | travelling latéral |
| 6 | 9.47 | 10.87 | 1.40 | mais le conseil vient d'annoncer | Haut-parleur du conseil (bordeaux) | `w5_haut_parleur` | contre-plongée fixe, ondes |
| 7 | 10.87 | 14.31 | 3.44 | qu'il n'y a plus assez d'énergie pour le maintenir sur les districts. | Infographie : l'énergie des districts s'éteint | `a_creer:w1b_infographie_districts` | rotation lente |
| 8 | 14.31 | 16.37 | 2.06 | Ici, les riches habitent au centre. | Le centre : tours dorées derrière le second mur | `w7_centre_mur` | push-in lent |
| 9 | 16.37 | 18.45 | 2.08 | Tout autour, il y a les districts. | Rue de district, foule | `w6_district_rue` | travelling latéral |
| 10 | 18.45 | 21.75 | 3.30 | Règle numéro 1. Ne sors jamais du dôme. | Panneau RÈGLE 1 (néon) | `w3_regle_1` | fixe, néon qui s'allume |
| 11 | 21.75 | 24.33 | 2.58 | Dehors, l'air tue en quelques minutes. | FPV : traversée de la barrière vers le désert irradié | `a_creer:f5_fpv_barriere` | avancée rapide |
| 12 | 24.33 | 25.97 | 1.64 | Ton père est ingénieur. | Le père, buste (présentation) | `c4_pere_buste (sans feuille)` | fixe |
| 13 | 25.97 | 28.55 | 2.58 | Le soir même, il demande à voir les dossiers sur le dôme. | Insert : ses mains ouvrent le dossier « DÔME » | `a_creer:d1_dossier` | plongée fixe |
| 14 | 28.55 | 30.35 | 1.80 | Le lendemain matin, | FPV : rue au petit matin vers le centre, « TOI » | `f2_fpv_rue` | avancée |
| 15 | 30.35 | 31.53 | 1.18 | des gardes l'emmènent, | Le père emmené par le garde (plan à deux) | `c5_pere_escorte` | fixe |
| 16 | 31.53 | 32.75 | 1.22 | il ne se débat pas, | Gros plan du père, calme | `a_creer:c4b_pere_gros_plan` | fixe |
| 17 | 32.75 | 35.77 | 3.02 | Prends ça, c'est la seule chose qui peut nous sauver. | Le père tend la feuille pliée (« Prends ça ») | `c4_pere_buste` | push-in très lent |
| 18 | 35.77 | 37.35 | 1.58 | Tu demandes où on l'emmène, | Le héros, buste, inquiet | `c2_heros_buste` | fixe |
| 19 | 37.35 | 39.37 | 2.02 | le garde répond : « Au centre. » | Le garde, contre-jour doré : « Au centre » | `c6_garde_centre` | fixe |
| 20 | 39.37 | 41.63 | 2.26 | le centre, où vivent les plus riches, | FPV : vers la porte du centre, tours dorées | `a_creer:f6_fpv_centre` | avancée |
| 21 | 41.63 | 43.11 | 1.48 | personne n'en revient. | La porte du centre se referme | `a_creer:w9_porte` | fixe, lumière qui se coupe |
| 22 | 43.11 | 46.31 | 3.20 | Règle numéro 2. Tu ne vas jamais au centre. | Panneau RÈGLE 2 (néon) | `a_creer:w3b_regle_2` | fixe, néon qui s'allume |
| 23 | 46.31 | 48.41 | 2.10 | un mur le sépare des districts. | FPV : montée le long du second mur | `f4_fpv_mur_montee` | montée continue + roulis |
| 24 | 48.41 | 49.81 | 1.40 | Tu déplies la feuille, | Le héros, feuille à la main, regard baissé | `c8_heros_feuille` | fixe |
| 25 | 49.81 | 51.55 | 1.74 | ton père a écrit une seule phrase : | Plan subjectif : la feuille dépliée | `w4_feuille_lecture` | fixe |
| 26 | 51.55 | 54.11 | 2.56 | « Il reste de l'énergie. Ils nous mentent. » | Plan subjectif : gros plan sur le texte | `w4_feuille_lecture (cadré serré)` | push-in |
| 27 | 54.11 | 56.23 | 2.12 | Le conseil annonce à la radio : | Foule de dos sous le haut-parleur | `a_creer:w5b_foule_haut_parleur` | contre-plongée |
| 28 | 56.23 | 59.81 | 3.58 | seul le centre restera protégé à cause du manque d'énergie, | Infographie : le champ se rétracte sur le centre | `a_creer:w1c_infographie_retraction` | rotation lente |
| 29 | 59.81 | 62.01 | 2.20 | les agitateurs seront exécutés. | Le garde, gros plan, lumière rouge | `a_creer:c6b_garde_gros_plan` | fixe |
| 30 | 62.01 | 64.03 | 2.02 | Tu révèles ce que tu sais à tout le dôme | Le héros dans la foule (vue haute) | `c7_heros_foule` | descente lente |
| 31 | 64.03 | 66.29 | 2.26 | et ton père risque d'être exécuté. | Le père enfermé, seul | `a_creer:c9_pere_cellule` | fixe |
| 32 | 66.29 | 68.99 | 2.70 | Ou tu te tais ? Choisis en commentaire. | Le héros face caméra + question + choix A/B | `a_creer:c10_heros_question` | fixe ; pilules au mot « Choisis » |
| 33 | 68.99 | 72.60 | 3.61 | Abonne-toi pour la partie 2. | Carte de fin : LA COURONNE · ÉPISODE 1 · ABONNE-TOI | `a_creer:fin_carte` | dôme filaire qui tourne |

## Scènes à créer avant le montage
- plan 5 : `w8_barriere`, Limite du dôme : barrière teal, désert irradié dehors
- plan 7 : `w1b_infographie_districts`, Infographie : l'énergie des districts s'éteint
- plan 11 : `f5_fpv_barriere`, FPV : traversée de la barrière vers le désert irradié
- plan 13 : `d1_dossier`, Insert : ses mains ouvrent le dossier « DÔME »
- plan 16 : `c4b_pere_gros_plan`, Gros plan du père, calme
- plan 20 : `f6_fpv_centre`, FPV : vers la porte du centre, tours dorées
- plan 21 : `w9_porte`, La porte du centre se referme
- plan 22 : `w3b_regle_2`, Panneau RÈGLE 2 (néon)
- plan 27 : `w5b_foule_haut_parleur`, Foule de dos sous le haut-parleur
- plan 28 : `w1c_infographie_retraction`, Infographie : le champ se rétracte sur le centre
- plan 29 : `c6b_garde_gros_plan`, Le garde, gros plan, lumière rouge
- plan 31 : `c9_pere_cellule`, Le père enfermé, seul
- plan 32 : `c10_heros_question`, Le héros face caméra + question + choix A/B
- plan 33 : `fin_carte`, Carte de fin : LA COURONNE · ÉPISODE 1 · ABONNE-TOI
