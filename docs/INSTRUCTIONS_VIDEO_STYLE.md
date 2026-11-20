# Instructions vidéo style — paramètres et règles de la série « Le Puits » (ép. 1 v2)

Document à coller comme « Instruction vidéo style » dans une nouvelle session. Il résume tout ce qui a été décidé et réglé
pour arriver à la v2 (65,7 s, 4K 2160x3840 et TikTok 1080x1920, 30 i/s). Les valeurs citées sont celles du code au 2026-11-20.
Les références externes servent à l'étude du style : ne jamais les publier, les copier ni citer leurs chaînes.

## 1. Format et livraison
- Durée : 60 à 90 s (ép. 1 : 65,66 s, 1970 images). Vertical 9:16, **30 i/s**, français uniquement.
- Livrables : `LePuits_epXX_vN_4K.mp4` (2160x3840, CRF 16, profil high, level 5.2, AAC 256 kbit/s) et
  `LePuits_epXX_vN_TikTok_1080.mp4` (1080x1920, CRF 18, AAC 192 kbit/s). Les deux dans `archives_videos/` (non versionné).
- Rendu : 2K natif (scale 1.3333 sur 1080x1920, soit 1440x2560) puis agrandissement lanczos en 4K à l'assemblage.
  Mesure : ~4,4 s/image en CPU (swangle, 4 cœurs), ~2 h pour 1970 images.
- Découpage obligatoire : chaque commande Bash en arrière-plan est limitée à 30 min. Rendu par morceaux de 60 images, 2 en
  parallèle, budget 1080 s par appel, relancé jusqu'à « complet » (`studio/scripts/render_puits4k.sh`, variables `OUTD` et `SNAP`).
- Avant tout rendu : figer une copie des sources (`out/snap_<nom>/src`) pour que les modifications en cours ne changent pas le rendu.
- Assemblage : concat des morceaux, puis `setpts=N/30/TB` avant l'agrandissement (sinon la durée dérive de 1,5 s), puis mux
  `-map 0:v:0 -map 1:a:0` avec le mix final. Contrôle : durée vidéo = durée son, nombre d'images = 1970, planche de contrôle, détection de noir.
- Rendu partiel : composition `PuitsPatch` (prop `frames` = liste d'images à rendre) + `scripts/patch_puits.sh` + recollage
  image par image (`scripts/splice_puits.py`). Ne jamais régénérer tout le film pour une petite correction.
  `Freeze` de Remotion ne marche pas ici : passer la liste par les props et la lire dans le composant.

## 2. Montage (plans)
- Une coupe = une image de texte ou d'action. Pas de plan de moins de ~1 s, pas de cadrage vide (rue sans personnage, détail
  illisible). Retirer ces plans et rallonger les voisins plutôt que les garder.
- Les coupes sont calées sur `words.json` : chaque plan commence 2 images avant le mot qui le déclenche (`WORDS[w].s - 2/FPS`).
- Plan qui accompagne une phrase : il tient jusqu'à la fin de la phrase (ex. la stèle reste jusqu'à « au fond du puits »).
- Début de plan : cadrage très serré, puis dézoom vers le cadrage final en 1 s maximum (`fov *= 0.3 + 0.7·zk`, zk = 1-(1-x)^4
  sur min(1 s, 0,85 de la durée du plan).
- Pas de volet noir ni de fondu entre les plans : **coupe franche**. Le volet noir de fin de plan a été supprimé (v2).
- Mouvement permanent : travelling avant de 10 % (sauf plan 20), orbite lente de ±0,07 rad, caméra portée (0,02 à 0,05 de
  décalage). Pas de roulis sur le plan d'ouverture.
- Ouverture (drone FPV) : ligne droite, sans tremblement ni roulis, entre deux murs de dunes. Position = Catmull-Rom sur
  des points fixes (`FPV_K`) ; hauteur des dunes ~80 m (`duneH`), crêtes nettes. Plongée finale dans le puits ; fond noir.
- Profondeur de champ (`DOFS`) : flou fort seulement sur les plans de personnages (cInf 6 à 22). Plans aériens et ouverture : 0.
  Le flou ne doit jamais grossir les têtes au premier plan pendant le dézoom.
- Sous-titres : un groupe à la fois, 1 à 3 mots, avec un léger « pop » de 5 % à chaque nouveau groupe.

## 3. Image et étalonnage
- Illustration 2D vectorielle douce : aplats, contours encre, peu de texture, flou de profondeur. Jamais de rendu 3D brillant.
- Lumière motivée : lampes ambrées, faisceaux, flaques au sol ; halo de lampe renforcé (bloom threshold 0,84, intensité 0,95,
  rayon 0,72). Ciel d'aube orangé (`skyLow #f0b47c`), nuit bleu-noir (`#030303` au puits).
- Saturation : les teintes restent chaudes mais plus riches (étalonnage « premium ») : `sat` ombres/médiums/hautes lumières
  autour de 0,96 / 1,08 / 1,04 en jour ; ombres légèrement froides (tint Cb +0,036 en ombres), hautes lumières ambrées (Cb -0,016).
- Noirs profonds : courbe `ky` de départ à 0,01. Vignettage fort (0,55 à 0,62 selon la scène).
- Dunes : lumière cuite dans les sommets (face soleil chaude, face ombre violacée) : `bakeDune`.
- Végétation : palmiers 14 palmes + régimes de dattes, buissons courts (0,5 à 1 m), herbe vert olive `#5a6a34`,
  canaux turquoise `#4a9c94`. Maisons de terre avec poutres saillantes et quelques coupoles blanches.
- Pas de « reflets » calculés : l'éclairage est simulé par les lampes, le halo et l'étalonnage.

## 4. Personnages
- Style « VIDEO_01 » (`drawRef` dans `puits/people.ts`) : grande tête ronde blanche nacrée (R 150, centre y 196), petits yeux
  ovales noirs, pas de bouche (un petit « o » pour la peur), contour fin sombre (ROL 6, `#221e1d`).
- Corps : tunique classique (haut 352, taille 640, ourlet 790 ; robe 936), V de col, ceinture, mains rondes sombres `#3a2a22`.
  **Aucune tunique orange.**
- Personnage principal (« toi ») : turban rouge qui tombe un peu sur le côté ; tunique bleu-gris `#4e6a6e`.
- Frère : bandeau violet noué sur le côté ; tunique sable `#b8a27a`.
- Anciens : robe longue, barbe blanc cassé `#bfb6a6`, tempes grises.
- Badges numérotés (`9-112`, `9-113`) sur la poitrine.
- Balancement léger (roulis 0,022 · sin) et respiration (échelle verticale 1,2 %).

## 5. Habillage (HUD et écritures)
- HUD haut gauche : « • ÉPISODE 1 » rouge, heure en gros (Bebas blanc), lieu minuscule. Haut droite : libellé rouge et compteur
  (le compteur passe en rouge au-dessus d'un seuil).
- Marges TikTok : 130 px à gauche et à droite, 210 px en haut ; tout texte à l'intérieur de ces marges.
- Sous-titres : Montserrat 900 blanc, mot prononcé en `#FF9A3C`, ombre portée x2 (`shadow={2}`), à 64 % de la hauteur ;
  **87 % sur un plan qui montre un texte diégétique** (stèle « RÈGLE »), pour ne jamais les superposer.
- Question finale en Bebas en haut (420 px) + deux pastilles A / B. Carton final : fond sombre, puits en fil de fer, titre, compteur.

## 6. Histoire et voix
- Narration à la 2ᵉ personne, phrase d'ouverture « Imagine ». Dilemme final binaire + « Dis-le en commentaire ».
- Voix du narrateur : Fish Audio, modèle `15ba126e214c4eae9c69d5a01bbbf53c`, environ 4,5 syllabes/s, micro-pauses avant les révélations.
- Voix de l'enfant : clone « Auguste Chuchoteur Créatif » (`4866bf1f1a8c4891bf4a715c49d843d1`), voix basse et chuchotée,
  **pitch +2 demi-teintes**, passe-haut 220 Hz, compression douce (ratio 3), fin complète (ne jamais la couper), niveau -3 dB
  sous le narrateur. Placée dans sa propre fenêtre temporelle (`tools/puits_enfant.py`).
- Le « Toc… toc » n'est pas lu : ce sont de vrais coups, saturés, forts (+14 dB), et le mot correspondant est retiré de la voix.

## 7. Son
- Mix dans `tools/puits_mix.py`, `loudnorm` -15 LUFS, true peak -1,2 dBTP. Priorité : voix > bruitages > musique.
- Ambiance légère : vent du désert, frottement de sable, grillons la nuit, foule en bruit de fond.
- Ouverture : souffle d'air à -17 dB, un seul souffle à l'entrée dans le puits, impact sur le noir.
- Règles : petit coup sec à l'annonce de chaque règle, rafale de vent (W(67), W(81), W(89), W(130)).
- **Pas de whoosh fort** sur les coupes. Notes de tension « tiiin » discrètes (-16 à -19 dB) sur les moments de tension.
- Musique du tirage : motif de cor en mode Hijaz sur ré, tambour sur cadre, drone grave, reprise lente.
- Silence avant les coups : bruitages atténués de -20 dB.
- Musique sous la voix : ducking, et porte autour du cor et des coups.

## 8. Méthode de travail
- Ordre : faits → script → voix → alignement mots → plan des coupes (`story.ts`) → monde → personnages → post → son →
  contrôles visuels → rendu → assemblage → livraison.
- Contrôles d'image : rendre quelques images à l'échelle 0,5 (`stills`), les assembler en planche, les lire avant de lancer le rendu complet.
- Après chaque modification de code : `npx tsc --noEmit`. Les erreurs de `bridge/Bridge.tsx` existaient avant : les ignorer.
- Pièges connus :
  - un commentaire `//` placé avant du code le désactive : toujours le mettre en fin de ligne ;
  - réordonner les coupes décale les index `k` utilisés dans `world.ts`, `story.ts` (DOFS, focus) : les vérifier tous ;
  - les plans FPV et le premier sous-plan de la scène 2 ne reçoivent ni volet ni dézoom.
- Git : branche `claude/vibrant-rubin-gp3487`, commit et push après chaque étape, pas de PR sans demande, rien supprimé
  ni écrasé sans accord. Les fichiers de référence (dépôt `INSTRUCTIONS-VIDEO-STYLE`) ne sont pas copiés dans ce dépôt.
