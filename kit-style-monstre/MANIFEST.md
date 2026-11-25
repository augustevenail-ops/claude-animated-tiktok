# MANIFEST — où est quoi

## Dans Git (ce dépôt)
- Code du monde, personnages, monstre, effets, plans : `studio/src/videos/monstre/` (`city.ts`, `monster.ts`, `chars.ts`, `props.ts`, `beams.ts`, `mtex.ts`, `story.ts`, `Monstre.tsx`).
- Entrée Remotion : `studio/src/Root.tsx` (composition `Monstre`).
- Sous-titres : `productions/monstre-ep01/caps.py`, `caps.ass`, `fonts/`.
- Son : `productions/monstre-ep01/audio/sound.py`, `voix/gen.py`, `voix/texte.txt`.
- Rendu : `productions/monstre-ep01/render/` (`sup.sh`, `watch.sh`).
- Plan de travail : `productions/monstre-ep01/plan_de_travail.md`.

## Pas dans Git : à copier à part
- `productions/monstre-ep01/voix/voix_off.wav` et `words.json` (les horaires des mots). `words.json` est aussi dans `studio/src/videos/monstre/`.
- `productions/bunker/musique/musique.wav` (musique de fond).
- `productions/monstre-ep01/audio/mix.wav`, `sfx.wav` (sorties audio, régénérables avec `sound.py`).
- Morceaux de rendu `render/chunks/` (plusieurs Go, régénérables).

## Dépendances
- Node, Remotion 4.0.290, three 0.175, @remotion/three, @react-three/postprocessing 3.0.4, postprocessing 6.37.2.
- Python : ffmpeg, torchaudio (alignement), fontTools (police).
- Service voix : Fish Audio, accès fourni par le proxy de la session (pas de clé dans le dépôt).

## Régénérer une vidéo identique
1. Copier les fichiers « pas dans Git ».
2. `npm install` dans `studio/`.
3. Lancer le rendu par morceaux (`render/sup.sh`), puis le montage final (concaténation, mise à l'échelle, sous-titres `caps.ass`, mux avec `mix.wav`).
