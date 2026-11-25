# STYLE.md — valeurs de référence « Le Monstre »

Les valeurs ci-dessous sont celles du code en place (`studio/src/videos/monstre/`). Le code reste la référence exacte ; ce fichier sert à le comprendre et à le vérifier.

## 1. Personnages
- Style **cubique stylisé**, formes simples, contours nets, matériaux à reflets (MeshPhysicalMaterial : sheen 0,7 pour les tissus, clearcoat 0,45 pour la peau).
- Peau : couleur claire et uniforme pour tous les personnages, y compris le père (`#f1c7a0` pour le père, teint blanc comme le fils).
- Vêtements : textures de tissu (map + bump), détails modélisés (cols, ceintures, poches, fermetures, semelles).
- Visages : expressions `scared`, `worried`, `focus` ; personnages qui fuient : pose de course, regard latéral, tête tournée.
- Source : `chars.ts`.

## 2. Monstre
- Tête en céramique ivoire fissurée, yeux noirs ovales, bouche ronde dentée, côtés en métal noir, pics dorsaux, corps blanc translucide anguleux.
- Taille : environ 34 m (3× la taille initiale). Échelle appliquée : `R.scale.setScalar(3)`.
- Couleurs : céramique `#d6d0c4`, plaques `#c9ced4`, opacité des plaques 0,95, émissif des plaques 0.
- Source : `monster.ts`.

## 3. Ville et environnement
- Nuit : ciel bleu nuit dégradé avec étoiles (`nightSky`), lumière de lune `#8fa0ff` (intensité 0,35), lumière ambiante hémisphérique `#5868b8` / `#1a1622` (intensité 0,55).
- Bâtiments : façades à fenêtres allumées (émissif 1,3 à 1,6), toits `#3a3a40`, tours métalliques.
- Sol : asphalte et trottoirs en béton, texturés avec bump.
- Lampadaires : halo additif `#ffb35a`, opacité 0,38.
- Véhicules : couleurs variées ; voitures de police avec gyrophares et phares.
- Source : `city.ts`, `props.ts`, `mtex.ts`.

## 4. Lumières et ombres
- **Projecteurs des tours** : SpotLight `#f4f7ff`, angle 0,42, pénombre 0,55 ; intensité de base 5,5 ; ombres PCFSoft 2048×2048 (sauf plans où `on.shadow` est coupé).
- **Lumière clé** (plans spécifiques) : SpotLight `#9fb2ff`, intensité 4 à 14.
- **Lumière de remplissage** : PointLight `#ffb46a`.
- **Soleil** (scène de jour) : DirectionalLight `#fff1d8`, ombres 2048.
- **Feu / explosion** : PointLight `#ff8a2a`.
- **Faisceaux lumineux** : cylindres additifs à shader (bord doux, poussière, fondu près de la caméra). Largeur : rayon 18 à la base de 1,8 pour les tours ; faisceaux des gardes 1,4 / 0,12.

## 5. Caméra et plans
- Format de sortie : 2K 1440×2560 ; 4K 2160×3840 pour les premiers morceaux déjà rendus.
- Mouvements : glissés en smootherstep, travellings, orbites de drone, plongées et contre-plongées.
- Focale : 24 à 58 selon le plan (fov).
- Liste complète : 63 plans dans `story.ts` (avec le plan de travail).

## 6. Effets (chaîne de post-traitement)
Ordre : Bloom → AgX (tone mapping) → teinte/saturation → contraste/luminosité → SMAA ULTRA → aberration chromatique légère → vignette.
- Bloom : seuil 0,95, intensité 1,15, rayon 0,72, 8 niveaux.
- Teinte/saturation : saturation 0,2 ; contraste 0,12 ; vignette 0,3 / 0,55.
- Pas de grain (le bruit a été retiré car il créait des halos).

## 7. Sous-titres
- Police : MonstreCaps (Montserrat Black renommée), fichier dans `productions/monstre-ep01/fonts/`.
- Couleur : **jaune `#FFE900`**, contour noir `#0A0A0A` (épaisseur 22), légère ombre portée noire.
- **Un mot à la fois**, centré, en bas (`\pos(1080,2573)` sur une référence 2160×3840).
- Apparition : le mot démarre à 135 % et revient à 100 % en 0,18 s.
- Alignement : mot par mot, à partir de la voix (`words.json`).
- Pas de bandeau de fond.
- Source : `caps.py` → `caps.ass`.

## 8. Son
- Voix : narrateur, voix off unique ; TTS Fish Audio, référence `15ba126e214c4eae9c69d5a01bbbf53c`, modèle s1.
- Musique : boucle de `productions/bunker/musique/musique.wav`, gain 0,0375 (−6 dB par rapport au projet Le Nuage), fondus de 0,4 s.
- Bruitages : tonnerre, explosion, crépitement, sirènes, coupure de courant, cri, pluie à partir du plan 41.
- Mix : voix > bruitages > musique ; normalisation −14 LUFS.
- Source : `productions/monstre-ep01/audio/sound.py`.
