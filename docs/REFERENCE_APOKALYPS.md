# Référence officielle n° 2 — vidéo « Apokalyps » (analyse du 2026-11-11)

Source : `Apokalyps_video_no_watermark.mp4` fourni par l'utilisateur (non versionné : le fichier d'upload est
éphémère ; pour le garder, le déposer dans `references/videos/` — étude privée, ne jamais republier).
Étude **de style uniquement** : ne copier ni l'histoire, ni les personnages, ni les plans (règle 3 de CLAUDE.md).

## 0. Fiche technique (mesurée)
| Élément | Valeur |
|---|---|
| Image | H.264 576×1024 (9:16), 30 fps, 75,0 s annoncés, ~2 211 images décodables (fin du fichier tronquée) |
| Son | AAC 44,1 kHz stéréo 32 kb/s (faible qualité : analyse fine du timbre limitée), 73,7 s décodables |
| Loudness | **−14,3 LUFS** intégré, **LRA 3,5 LU** ; canal latéral −33,8 LUFS vs centre −17,3 ⇒ quasi mono (voix au centre) |
| Langue / genre | **Français**, fiction d'angoisse en **caméra subjective à la 2ᵉ personne** (« tu »), dilemme final interactif |

Méthode : ffmpeg (ebur128, silencedetect, spectrogrammes) + numpy (stats image par image, coupes, enveloppes, F0
par autocorrélation, débit syllabique), planches 1 image / 0,5 s et 6 images pleine taille vues.
**Non analysable ici** : transcription automatique (aucun moteur de reconnaissance vocale installé) — le texte
ci-dessous vient des sous-titres incrustés, donc partiel ; émotions perçues « à l'oreille » (je n'écoute pas l'audio,
je mesure) ; identité exacte de la voix (humaine ou synthèse).

## 1. Récit et structure (reconstruit depuis les sous-titres)
| Temps | Temps fort |
|---|---|
| 0-2 s | **Accroche** : « Quelqu'un fait des crêpes dans ta cuisine en pleine nuit. » |
| 2-6 s | Indices rassurants : « On dirait maman. Elle fredonne sa chanson. » |
| 6-11 s | **Contradiction** : maman travaille de nuit à l'hôpital, ne rentre jamais avant le lever du soleil (post-it en preuve) |
| 11-19 s | Approche : tu te glisses en haut de l'escalier ; elle est aux fourneaux, de dos ; « Tu es encore debout, mon cœur ? » |
| 19-32 s | **Retournement 1** : le téléphone vibre, SMS de maman « Je suis au travail. Quelqu'un est dans la maison. Cache-toi » ; détail qui sème le doute (maman écrit sans majuscules ni ponctuation, ce message est parfait) |
| 32-46 s | Règle du mot de passe ; la femme répond juste (« Myrtille ») ; elle ne se retourne toujours pas |
| 46-53 s | Détails sensoriels : la poêle grésille, « tes crêpes vont refroidir » |
| 53-66 s | **Retournement 2** : nouveaux SMS « Ne descends pas cet escalier » ; dernier message = **une photo de toi, prise juste derrière toi** |
| 66-73 s | « Descends », dit maman. **Question finale** : « Tu fais confiance à qui ? » → A Cuisine / B Téléphone, « dis-le en commentaire » |

Règles tirées : accroche = situation anormale en 1 phrase ; alternance indice rassurant / contradiction ;
deux retournements de plus en plus forts ; détail concret qui « prouve » (post-it, fautes d'orthographe, photo) ;
pas de résolution : la fin renvoie la décision au spectateur.

## 2. Visuel
**Personnages**
- Mère : vrai modèle **3D** stylisé (chignon texturé, blouse bleue, contour d'encre sur la silhouette, bras plats
  couleur chair), **toujours vue de dos** : l'absence de visage est le moteur du suspense.
- Enfant (le « tu ») : apparaît sur photo/écran ; tête ronde blanche, yeux points, petit sourire, **bonnet rouge**,
  sweat sombre — proche de notre construction 2D (tête haricot, traits simples).
- Mains du spectateur au premier plan (manches bleues) tenant le téléphone : ancrage subjectif.

**Décors, matières, lumière**
- Maison de nuit : couloir étroit, escalier moquetté, cuisine (placards bois, crédence carrelée, plaque, hotte),
  post-it manuscrit, interface SMS réaliste, sol damier orangé.
- Textures plus réalistes que les nôtres (bois veiné, carrelage) mais formes simplifiées.
- **Luma médiane 0,18**, p2 0,07, p98 0,58, saturation moyenne 0,33 : image sombre et contrastée.
- Opposition **lumière pratique chaude** (plafonnier, hotte, cuisine éclairée) / **pénombre froide gris-bleu** (couloir).
- Composition en **cadre dans le cadre** : la cuisine lumineuse vue au bout du couloir noir, à travers l'embrasure.
- Habillage permanent : badge « NUIT » rouge en haut à gauche ; sous-titres blancs gras, mot-clé en **rouge**,
  1-3 mots, centrés (~73 % de la hauteur, ~87 % sur les plans téléphone) ; étiquettes A/B à la fin.

## 3. Animation
- Peu d'action physique : la mère cuisine de dos (petits gestes de bras), le reste est **tension statique**.
- Animation portée par la caméra, les écrans (bulles SMS qui apparaissent, chargement de photo, vibration) et les objets
  (poêle qui grésille, porte qui s'ouvre).
- 47 % des images quasi immobiles (différence < 0,5 niveau) : beaucoup plus calme que le bridge (65 % en mouvement).

## 4. Caméra et montage
- ~28 plans détectés (coupes à 2,1 / 3,3 / 4,5 / 6,2 / 8,7 / 11,3 / 13,8 / 16,2 / 18,1-18,6 / 20,4 / 31,5 / 38,0 /
  40,5 / 42,3 / 43,4 / 48,0 / 50,0 / 52,8 / 54,5 / 56,4 / 58,9 / 61,5 / 63,7 / 65,4 / 66,9 / 67,8 s).
- **Rythme en accordéon** : coupes toutes les 1,2-2,6 s pendant l'exposition (0-20 s), **long plan de 11 s** sur la
  lecture des SMS (20,4-31,5 s), puis coupes toutes les 1,5-3 s dans la montée finale.
- Caméra subjective à hauteur d'enfant en haut de l'escalier ; **lents travellings avant** dans le couloir ;
  **poussées** sur la cuisine/la mère ; inserts serrés (poêle, post-it, porte, écran).
- Transitions : coupes franches ; entrée rapide du téléphone par le bas (18,1-18,6 s) ; aucun flash blanc.

## 5. Audio
**Voix (mesures, à reproduire au plus près)**
| Paramètre | Mesure | Fiabilité |
|---|---|---|
| Registre | voix **grave** : harmoniques espacées de ~105-130 Hz sur le spectrogramme, F0 majoritairement **90-150 Hz** (médiane ≈ 115-125 Hz) ⇒ voix masculine probable | moyenne (musique tonale superposée) |
| Débit | **~4,5 syllabes/s** (≈ 3 mots/s en français), régulier | ±15 % |
| Pauses 0-45 s | quasi aucune (1 seule ≥ 0,12 s : 0,25 s à 14,6 s) : narration **enchaînée** | bonne |
| Pauses 45-73 s | 20 micro-pauses de **0,12-0,43 s** (46, 47,6, 52,5, 56, 58,5, 60,2, 62, 63,5, 69,1, 70,7, 72,2 s…) : le débit se **découpe** à l'approche des révélations | bonne |
| Intonation | contours mélodiques amples (montées/descentes de plusieurs demi-tons visibles) ; ton précis non qualifiable par mesure | faible |
| Timbre | voix proche et sèche, pas de réverbération perceptible sur le spectrogramme ; centroïde global 1,9 kHz | moyenne |
| Niveau | voix stable (±3 dB par tranche de 5 s), toujours au-dessus du fond | bonne |

**Musique**
- **Nappe/drone tenue** sur hauteurs fixes (raies continues ~385-400 Hz et ~640 Hz) + basse grave pulsée
  (bandes 90-190 Hz avec battement/trémolo) : ambiance sombre, sans mélodie.
- Évolution : basse (20-150 Hz) à −9 dB sous la voix jusqu'à 15 s, **retirée** pendant l'approche/les SMS
  (−15 à −19 dB, 15-45 s), puis **remontée** à −6/−8 dB dans le dernier tiers (55-73 s) : la tension monte par le grave.

**Bruitages** (repérés sur le spectrogramme, identification partielle)
- Bip tonal net ~3,1 kHz vers 41 s (notification probable) ; glissando ~1,3-1,5 kHz vers 68-70 s ;
  transitoires larges bande nombreux (consonnes + bruits de scène). Vibration / grésillement : cohérents avec l'image
  mais non isolables proprement à 32 kb/s.

## 6. Reproduction avec notre pile (code uniquement)
| Caractéristique | Implémentation |
|---|---|
| Nuit + pratiques chaudes | nouveau preset `night` dans `lights.ts` (ambiance gris-bleu basse, sun ≈ 0) + `THREE.PointLight`/`SpotLight` chaudes (#ffd9a0) pour plafonnier/hotte ; grade `night` dans `grade.ts` (luma médiane ~0,2, noirs relevés bleutés, vignette forte) |
| Cadre dans le cadre | décor intérieur modulaire dans `build.ts` (couloir, embrasure, escalier) ; caméra au bout du couloir ; DOF faible (`cInf` 4-8) pour garder la profondeur lisible |
| Caméra subjective enfant | `CAMS` à ~1,2-1,4 m, `pushK` 0,15-0,3 %/image, travellings `dolly` lents ; inserts = keys `cut: true` |
| Mains + téléphone | carte Canvas2D au premier plan (layer `NOINK`) : mains (`Pen`) + écran SMS dessiné (bulles, heure, avatar) mis à jour par image ; vibration = kick de 4-6 images sur la carte |
| Post-it, photo, écran | `ctex` (paint.ts) : texte manuscrit Canvas2D sur carte ; photo = rendu de la scène dans une `WebGLRenderTarget` affichée sur l'écran |
| Personnage de dos | vue arrière dans `toon.ts` (`bodyBack` à ajouter : chignon, blouse, bras) ou modèle 3D simple (capsules + contour encre) ; ne jamais montrer le visage |
| Voix | **pas de synthèse vocale dans le dépôt** : enregistrement ou TTS externe choisi par l'utilisateur, avec la consigne du §7 ; `words.json` pilote tout |
| Drone + basse pulsée | `instruments.py` (pad tenu + basse avec trémolo 4-6 Hz) dans un nouveau `music.py` ; automation de niveau par section dans `mix.py` (`section_db`) : grave retiré au milieu, remonté à la fin ; arrêts nets avant les révélations |
| Vibration, notification, grésillement | `sfx_gen.py` : buzz 150-200 Hz pulsé 2×0,4 s ; bip sinus ~3 kHz 80 ms enveloppe rapide ; grésillement = bruit filtré passe-haut 2-6 kHz + crépitements aléatoires |
| Loudness | cible −14 LUFS (référence) ou notre standard −15 LUFS ; LRA ≤ 3,5 |

## 7. Règles réutilisables (tirées de cette vidéo)
**Narration / voix** (à donner au comédien ou au TTS)
1. Voix masculine grave (F0 ~100-130 Hz), proche, sèche, sans effet, centrée.
2. ~4,5 syllabes/s, phrases enchaînées sans respiration audible pendant l'exposition.
3. Dès la première révélation, insérer des micro-pauses de 0,15-0,45 s **avant** les mots-clés (« une photo », « toi »).
4. Ton constant de conteur, la tension vient des mots et des pauses, pas d'effets théâtraux.
5. 2ᵉ personne (« tu/you ») pour l'immersion ; répliques des personnages entre guillemets, même voix.

**Écriture**
6. Accroche = situation anormale du quotidien en une phrase ; contradiction prouvée par un détail concret dans les 10 s.
7. Deux retournements croissants ; chaque preuve est un **objet montré** (post-it, SMS, photo).
8. Option fin interactive : question binaire A/B (à valider, voir §8).

**Image / montage**
9. Rythme en accordéon : coupes ~1,5-2,5 s, puis un plan long (8-12 s) quand le spectateur lit/écoute une information clé.
10. Lumière motivée : zones chaudes = sécurité apparente, pénombre froide = menace ; cadre dans le cadre.
11. Le danger reste hors champ ou de dos.

**Son**
12. Fond = drone tonal tenu + basse pulsée ; la tension se règle par le niveau du grave ; silence/retrait avant les chocs.
13. Bruitages d'interface (vibration, notification) synchronisés à l'image, 0-3 images avant le mot correspondant.

## 8. Écarts avec nos règles d'origine — décisions

**Tranché le 2026-11-11 (utilisateur)** : français ✅, sous-titres comme cette vidéo ✅, fiction angoissante /
mystérieuse, inventée ou inspirée de l'ambiance de films connus (*La Plateforme*, *Hunger Games*…) ✅, ton non comique ✅,
couleurs : base de cette vidéo (sombre, intrigant) en gardant des accents saturés ✅.
Aussi tranché : question finale A/B + appel à commenter **à chaque vidéo** ✅ ; narration à la 2ᵉ personne ✅ ;
personnages en **cartes 2D** (style bridge) ✅ ; voix par **TTS** ✅ (service au choix de l'utilisateur ; cible : consigne §7).

Tableau d'origine (pour mémoire) :
| Sujet | Cette référence | Nos règles (CLAUDE.md) |
|---|---|---|
| Langue | français | anglais uniquement |
| Sous-titres / textes | sous-titres mot à mot + badge + étiquettes | aucun texte à l'écran |
| Contenu | fiction d'angoisse | histoires vraies, blagues factuelles |
| Fin | question + appel à commenter | pas de CTA (bible) |
| Ton | suspense / peur | humour pince-sans-rire |
| Rendu | personnages partiellement 3D, textures réalistes, nuit sombre | cartes 2D, textures peintes, couleurs saturées |
Tant que l'utilisateur n'a pas tranché, ces règles restent en vigueur ; seules les règles du §7 compatibles
(voix, rythme, lumière motivée, audio) s'appliquent d'office.

## 9. Spécification des sous-titres (mesurée, à reproduire)
- Mots-groupes de **1 à 3 mots**, remplacement sec (pas de fondu, pas d'animation d'entrée), calés sur `words.json`.
- **MAJUSCULES**, sans-serif très gras (police exacte non identifiable ; équivalent libre proposé : Montserrat Black
  ou Anton via `@remotion/google-fonts`), blanc #FFFFFF, contour noir fin + légère ombre portée.
- Référence Apokalyps : un mot-clé par groupe en rouge #F53C38. **Décision utilisateur (2026-11-11) : tout en blanc, aucun mot coloré.**
- Taille : référence ≈ 2 % de hauteur de capitale ; **décision : un peu plus petit, ≈ 1,7 % (≈ 33 px de capitale à 1920, police ~46 px)**, à valider sur les premiers stills ; centré horizontalement ;
  centre vertical à **~73 %** de la hauteur, remonté à ~71 % ou au-dessus des mains quand le téléphone occupe le bas.
- Citations entre guillemets français « … » quand un personnage parle ou qu'un SMS est lu.
- Badge contextuel permanent possible (ex. « NUIT », rouge sur pastille sombre, haut gauche, ~10 % de la hauteur).
- Implémentation : composant React DOM (`AbsoluteFill`) au-dessus des `ThreeCanvas` dans le composant principal,
  lisant `words.json` + une table `KEYWORDS`/`GROUPS` dans `story.ts` ; taille en px × (hauteur/1920).

## 10. Palette cible (direction actuelle)
- Base Apokalyps : luma médiane ~0,18-0,30, p98 ~0,6-0,8, noirs bleutés relevés (jamais 0), vignette marquée.
- Accents **saturés** issus du style bridge : sources pratiques chaudes (#FFB36B-#FFD9A0), rouge d'alerte #F53C38,
  cyan/bleu froid des écrans et de la nuit (#3E7FD2, #22A7B6), un accent de couleur par plan maximum.
- Ombres violet-bleu (jamais brunes ni grises), comme le preset golden du bridge.
- Encre, personnages (tête haricot, contour prune), DOF et grammaire caméra du bridge restent valables.
