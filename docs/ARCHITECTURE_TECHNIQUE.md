# Architecture technique — comment le code fabrique la vidéo

Tout est **déterministe** : chaque image est une fonction pure de `(plan, numéro d'image)`. Aucun générateur IA.

## 1. Pile et dépendances
Versions validées sur le bridge (references/reports/CONTEXT.md) :

| Outil | Version | Rôle |
|---|---|---|
| Node.js | ≥ 18 (testé 22 ici) | bundling, rendu |
| Remotion + `@remotion/three`, `@remotion/bundler`, `@remotion/renderer` | 4.0.290 | timeline, rendu image par image, MP4 |
| three | 0.175 | scène 3D, `GLTFLoader`, `BufferGeometryUtils` |
| @react-three/fiber | 9.1.2 | canvas React (`ThreeCanvas`) |
| @react-three/postprocessing | 3.0.4 | `<EffectComposer>` |
| postprocessing | 6.37.2 | `Pass`/`Effect`, Bloom, ToneMapping |
| React / TypeScript | versions requises par Remotion 4 | |
| Python 3 + numpy + scipy (+ Pillow pour les scripts) | numpy 2.x, scipy 1.x, PIL 12 | son, QA, planches |
| ffmpeg / ffprobe | toute version récente | mux, loudness `ebur128`, QA |
| Chrome/Chromium avec WebGL (ANGLE) | — | rendu Remotion |
| Kenney CC0 (Nature Kit + kit « town/fantasy » probable) | — | 26 modèles `.glb` (liste dans `world.ts` `KENNEY`) |
| Voix | enregistrement ou TTS au choix de l'utilisateur | `voice.wav` + `words.json` (timings mot à mot) |

**Absent du dépôt** (à recréer) : `package.json`, `tsconfig.json`, `src/index.ts`, `src/Root.tsx`, dossier `public/`
(modèles Kenney dans `public/bridge/kenney/*.glb`), voix, rendus. Les scripts contiennent des chemins à adapter :
`bridge-stills.mjs` (Chrome Windows codé en dur), `bridge_merge.py` (`ROOT = "your Remotion project"`), `bridge_shots.py`
(sortie `out/bridge/shots.json`).

## 2. Arborescence cible du projet Remotion
```
<projet>/
  package.json, tsconfig.json
  public/bridge/kenney/*.glb          (staticFile("bridge/kenney/<nom>.glb"))
  src/index.ts                         registerRoot(Root)
  src/Root.tsx                         <Composition id="…" component={…} durationInFrames={TOTAL} fps={30} width={1080} height={1920}/>
  src/videos/<nom>/                    copie de templates/bridge/
  src/sandboxes/<n>/index.tsx          (option) cf. templates/sandbox_index_example.tsx
  scripts/                             copie de templates/scripts/
  out/<nom>/                           stills, rendus, QA
~/<nom>-short/voice/voice.wav, words.json ; ~/<nom>-short/audio/ (copie de templates/audio/)
```

## 3. Modules de `templates/bridge/` (13 fichiers, ~4 300 lignes)
| Fichier | Rôle | Contrats exportés clés |
|---|---|---|
| `Bridge.tsx` | Composition : charge le kit (delayRender), 1 `ThreeCanvas` par couche (fondus = 2 canvas superposés), chaîne de post, flash blanc | `BridgeShort`, `BRIDGE_FRAMES` |
| `story.ts` | **Le scénario en code** : constantes, physique de l'histoire, `SHOTS`, `XFADE`, `FLASH_AT`, caméras `CAMS`, `KICKS`, `DOF`, `FOREGROUND` | `TOTAL`, `SHOTS`, `camAt`, `dofAt`, `layersAt`, `glide`, `smooth` |
| `world.ts` | Classe `World` : ciel shader, eau, berges, pont déformé, parc, nuages, fumée ; `update(id, f, cam, scene)` pose tout | `World`, `loadKit` |
| `build.ts` | Décor statique fusionné (`Batch`), tubes (`Strand`), maisons, ville, props Kenney, **culling des lignes de vue caméra** | `buildTown`, `house`, `prop`, `kitClone`, `lam` |
| `paint.ts` | Textures Canvas2D procédurales mises en cache (`ctex`) | `planksHD`, `stoneHD`, `facadeHD`, `roofHD`, `grassHD`, `cloudHD`, `waterNear/Far`… |
| `lights.ts` | Presets lumière `LIGHTS` + palette monde `LOOK` (day / golden) | `LIGHTS`, `LOOK` |
| `shade.ts` | Ombrage deux tons injecté dans les shaders Lambert (`onBeforeCompile`), `untone()` (inverse du tone map) | `twoTone`, `untone`, `TONE`, `CHAR`, `LFB` |
| `toon.ts` | API de dessin `Pen`, têtes `headBlob`, visages, chapeaux, corps face/profil, 14 expressions, effets 2D (notes, éclats, éclaboussures, étoiles, panneaux…) | `Pen`, `bodyFront`, `bodySide`, `Outfit`, `Expr`, `fx*` |
| `cast.ts` | Personnages en cartes 3D : pool de canevas, `Actor`, `Fx`, mise en scène par plan (`stage`), marche, clignements, foule | `stage`, `Pool`, `SU` |
| `cardshade.ts` | Éclairage des cartes par la scène (teinte, gradient latéral, plancher lumineux) | `cardShade`, `blobMaterial` |
| `ink.ts` | Passe d'encre écran (normales + profondeur du monde seul), largeur ∝ hauteur/1920 | `InkPass`, `NOINK = 3` |
| `lensblur.ts` | DOF à lentille mince, 2 passes gather déterministes (16 + 64 taps) ; grain (désactivé) | `LensBlur`, `GrainEffect` |
| `grade.ts` | Étalonnage final (courbe, saturation, split-tone, vignette) par lumière | `GradeEffect`, `GRADES`, `gradeFor` |

**Ordre de la chaîne de post** : Ink → lens pre → lens main → Bloom (seuil 1,0, ADD) → ToneMapping NEUTRAL → Grade ; MSAA 4.
Bascules de test via `inputProps` : `{ post: { ink:false, lens:false, bloom:false, grade:false, dpr:0.5 } }`.

## 4. Modèle de données du scénario (`story.ts`)
- `ShotDef = { id, a, b, light: "day"|"golden", crowd, tau: t => tempsHistoire, towns? }` (a/b en images).
- `CAMS[id] = Key[]`, `Key = { f, dur?, cut?, s: f => { pos, look, fov?, roll? } }` ; outils `dolly`, `zoom`, `rolled`, `pushK`.
- `KICKS = [[tempsSec, gain]]`, `DOF = [{ f, dur?, cInf, focus? }]`, `FOREGROUND = [{ a, b, kit, pos, s, yaw }]`.
- `XFADE = { idPlan: nbImages }`, `FLASH_AT = image`.
- Le son lit une copie en Python de ces constantes (`audio/timeline.py`) : **toute modification de timing ⇒ refaire le son**.

## 5. Chaîne audio (`templates/audio/`, Python, ~2 000 lignes)
| Fichier | Rôle |
|---|---|
| `dsp.py` | filtres, bruits, enveloppes, réverbe synthétique, loudness BS.1770-4, crête vraie, WAV 16/24 bits |
| `instruments.py` | cuivres, glockenspiel, vibraphone, boîte à musique, fifre, sifflement humain, caisse claire, cymbale, timbales, pad, cordes pincées, balais |
| `music.py` | partition originale par sections calées sur l'image |
| `sfx_gen.py` | bruitages procéduraux (pas, grincements, chaînes, rupture métal, éclaboussure, foule par formants, oiseaux, vent, swooshs…) |
| `sfx.py` | liste d'événements → stem SFX (niveau, distance caméra, pan, réverbe) |
| `timeline.py` | miroir Python de `story.ts`/`cast.ts` (plans, phases de marche, impacts, distance caméra) |
| `mix.py` | voix + musique (ducking) + SFX, limiteur look-ahead ×4, rapport `cues.md`, cache `_cache/` |

Entrées attendues : `<racine>/voice/voice.wav` et `<racine>/voice/words.json` = liste `[{ …, "s": début_s, "e": fin_s }]`.
Sorties : `mix.wav`, `stem_voice/music/sfx.wav`, `cues.md`. Durée fixée par `TOTAL` de `timeline.py` (2025 images = 67,5 s).

## 6. Scripts outils (`templates/scripts/`)
| Script | Usage |
|---|---|
| `bridge-stills.mjs` | `node scripts/bridge-stills.mjs out/<nom>/x_ 100,400 0.5` → stills JPEG (bundle unique) ; `BRIDGE_ENTRY=` pour une sandbox |
| `sbs_sheet.py` | planche côte à côte nos images / références |
| `bridge_shots.py` | extrait plans, fondus, flash, coupes et kicks de `story.ts` → `shots.json` |
| `short_qa.py` | QA image par image : specs, loudness, silences, images noires/blanches/gelées/sauts, stats par plan, planches 2 s |
| `bridge_merge.py` | fusionne les sandboxes par propriétaire de fichier (avec sauvegarde) |

## 7. Commandes clés
```bash
npx tsc --noEmit
node scripts/bridge-stills.mjs out/<nom>/x_ 100,400,900 0.5
npx remotion render src/index.ts <Comp> out/<nom>/video.mp4 --codec h264 --crf 16 --scale 1.3333
ffmpeg -i out/<nom>/video.mp4 -i <audio>/mix.wav -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 320k -shortest final.mp4
python scripts/bridge_shots.py src/videos/<nom>/story.ts && python scripts/short_qa.py final.mp4 out/<nom>/qa out/<nom>/shots.json
```
Performances bridge : stills 3-8 s après ~40 s de bundle ; rendu 2K ≈ 4 img/s (~10 min pour 67 s).
Disque : chaque bundle copie `public/` (~1,3 Go) dans le dossier temporaire ⇒ `REMOTION_TMP`/`TEMP`/`TMP` sur un grand disque.

## 8. Performance de rendu (machine cloud sans GPU, mesuré le 2026-11-11 sur L'Arène ép. 1)
- Pas de GPU (`/dev/dri` absent) : seul `--gl=swangle` (SwiftShader) fonctionne ; `angle`, `angle-egl`, `swiftshader` échouent.
- **`frameloop="demand"` + `invalidate()` + `delayRender`/`addAfterEffect`** (`studio/src/videos/arene/Arene.tsx`) : une seule passe
  par image au lieu d'un rendu continu (221 → 34 appels `gl.render` par still) ; pixels identiques.
- Coût d'une image isolée ≈ 7 s dont ~5,8 s fixes (page, GLB, décor, compilation des shaders) ; **en séquence : ~0,9 s/image
  (3D interne 720p) ou ~1,5 s/image (1080p natif)** → épisode de 2 100 images ≈ 32-55 min. `--concurrency 2` : aucun gain (CPU saturé).
- Outils : `scripts/stills.mjs <comp> <prefix> <frames> <scale> '<inputProps>'` (PNG, logs `[prof]` si `post.prof`),
  `scripts/imgdiff.py ref.png new.png`, `scripts/render.mjs <comp> <out> <scale> <a-b> <conc> '<inputProps>'`.
