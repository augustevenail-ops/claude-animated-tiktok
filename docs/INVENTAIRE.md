# Inventaire des ressources du dépôt

Statut : ✅ analysé en entier · 🔎 analysé par échantillon / sections clés · ⛔ non analysable (absent du dépôt).

## Racine
| Chemin | Utilité | Statut |
|---|---|---|
| `CLAUDE.md` | Instructions permanentes, point d'entrée de chaque session | ✅ |
| `README.md` | Présentation, installation, structure | ✅ |
| `SKILL.md` | Skill Claude « cartoon-3d-short » : pipeline en 11 étapes, valeurs finales du look, boucle d'ajustement, pièges | ✅ |
| `LICENSE` | MIT (code + docs) ; images de référence pour étude uniquement | ✅ |
| `docs/` | Cette documentation (style, architecture, inventaire, workflow) | — |

## `references/` (étude privée, ne jamais publier)
| Chemin | Contenu | Utilité | Statut |
|---|---|---|---|
| `STYLE_BIBLE.md` | Format, formule de script, image, caméra, effets mesurés sur 20 shorts | Règles de script ; ⚠ grammaire caméra corrigée par motion.md | ✅ |
| `reports/CONTEXT.md` | Brief commun des agents d'analyse, pile technique | Versions des dépendances | ✅ |
| `reports/motion.md` (435 l.) | Caméra + animation des personnages, recette | Glissés, poussées, kicks, marche, clignements | 🔎 verdict, §3, top 5 |
| `reports/depth.md` (556 l.) | DOF, brume, bloom, composition | Table `cInf`, cadrages, hauteurs caméra | 🔎 §0, §4 |
| `reports/textures.md` (978 l.) | Peinture des surfaces, recette `paint.ts` | Valeurs L*/C*, joints, eau, ciel, nuages | 🔎 §0, plan |
| `reports/characters.md` (728 l.) | Construction des personnages, spec de dessin | Proportions, traits, couleurs, visages | 🔎 §0, §1.6, §2.1-2.4 |
| `reports/lighting.md` (603 l.) | Lumière clé, ombres, cartes éclairées | Presets jour/golden, ombres violettes | 🔎 §0, plan |
| `reports/outlines.md` (624 l.) | Encre sur la géométrie 3D | Largeurs, types d'arêtes, passe dédiée | 🔎 §1, plan |
| `reports/grade.md` (380 l.) | Étalonnage | Courbes, noirs relevés, vignette | 🔎 §0, plan |
| `frames/` | 38 JPEG 540×960 (`shortNN_0060/0180`, NN = 01-20 ; manquent 15_0180 et 17_0180) | Comparaison côte à côte avec `sbs_sheet.py` | 🔎 montage de 19 images + 1 plein format vus |
| `sheets/` | 20 planches 1800×1920 (60 images = 2 s chacune) | Rythme, mouvement, expressions | 🔎 dimensions vérifiées ; contenu non parcouru en détail (16 Mo) |

Observé sur les images : personnages à tête blanche/pêche en haricot, contour noir-prune, membres en trait,
décors 3D très saturés (saloon, bateau, ville western, cuisine, salle de jeux, champ, tour), DOF marqué en gros plan,
sous-titres d'un mot (à **ne pas** reproduire).

⛔ Cités par les rapports mais **absents** : `references/vids/` (20 vidéos), `measure/`, `tx/` (transcriptions),
dossiers de crops `references/<thème>/` (scripts de mesure, `sbs_*.jpg`, `proto/`, `recipe/`), `refs_sheet.jpg`.
Les chiffres des rapports restent la source de vérité ; on ne peut pas refaire les mesures depuis ce dépôt.

## `templates/`
| Chemin | Utilité | Statut |
|---|---|---|
| `SCRIPT_example.md` | Script complet du bridge + faits sourcés (modèle de format) | ✅ |
| `sandbox_index_example.tsx` | Entrée Remotion d'une sandbox | ✅ |
| `bridge/*.ts(x)` (13 fichiers) | Code source complet de la vidéo exemple (cf. ARCHITECTURE_TECHNIQUE.md §3) | ✅ `Bridge.tsx`, `story.ts`, `lights.ts` ; 🔎 autres (en-têtes, exports, sections clés) |
| `audio/*.py` (7 fichiers) | Synthèse et mix du son | 🔎 en-têtes, constantes, structure, E/S |
| `audio/cues.md` | Rapport du mix bridge : loudness, carte musicale, 100+ événements SFX | 🔎 loudness + carte musicale |
| `scripts/*` (5 fichiers) | Stills, planches, plans, QA, fusion | ✅ |

## Références externes fournies par l'utilisateur
| Ressource | Utilité | Statut |
|---|---|---|
| `Apokalyps_video_no_watermark.mp4` (upload, non versionné) | Référence n° 2 : voix, suspense, nuit, montage → `docs/REFERENCE_APOKALYPS.md` | 🔎 image entière (planches 0,5 s), audio mesuré ; transcription automatique impossible |

## ⛔ Ressources non présentes (à fournir/créer pour produire)
- Projet Remotion (package.json, `src/index.ts`, `src/Root.tsx`, tsconfig).
- Modèles Kenney `.glb` (26 noms dans `world.ts`) → `public/bridge/kenney/`.
- Voix (`voice.wav`) et timings (`words.json`) — ni enregistrement ni TTS dans le dépôt.
- Aucun fichier son, vidéo ou modèle 3D n'est versionné ; aucun rendu du bridge n'est disponible pour comparaison.
