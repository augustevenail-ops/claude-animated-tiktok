# Voix off — réglages validés (utilisateur, 2026-11-11, épisode « L'Arène » 1)

Réglages **par défaut pour toutes les vidéos**. Ne les changer que sur demande de l'utilisateur.

## Génération (ElevenLabs, clé injectée par le proxy de l'environnement `claude-animated-tiktok`)
| Réglage | Valeur |
|---|---|
| Voix | **George** — `JBFqnCBsd6RMkjVDRZzb` (premade, conteur) |
| Modèle | `eleven_multilingual_v2`, `language_code: "fr"` |
| voice_settings | stability **0.32**, similarity_boost **0.8**, style **0.45**, use_speaker_boost **true** (« v2 expressif ») |
| Endpoint | `/v1/text-to-speech/{voice}/with-timestamps` (audio + minutage caractère → mots) |
| Outil | `python tools/tts_episode.py productions/<ep>/SCRIPT.md productions/<ep>/voice` |

## Montage de la voix (`tools/voice_edit.py`, défauts = réglages validés)
| Réglage | Valeur |
|---|---|
| Pause fin de phrase (. ? ! … ») | **0,27 s** |
| Pause virgule / deux-points | **0,10 s** |
| Blanc entre deux mots | ≤ 0,06 s (aucune pause au milieu d'une phrase) |
| Pause de tension (avant 1-2 mots-clés, `--tension "mot"`) | **0,55 s** |
| Hauteur | **−1,5 demi-ton** (ffmpeg rubberband, plus grave) |
| Tempo | **0,975** (légèrement plus lent) |
| Sortie | `voice.wav` 48 kHz, `words.json` recalé, `voice_ecoute.mp3` |
Commande : `python tools/voice_edit.py productions/<ep>/voice --tension "<mot>"`

## Écriture pour la voix
- Débit résultant ≈ **2,75 mots/s** ⇒ **~190-200 mots pour 70 s** ; durée cible **60-70 s** (max 70 s demandé).
- Commencer par « **Imagine…** » ; phrases courtes ; points de suspension seulement là où une pause est voulue ;
  pas de « … » au milieu d'un groupe qui doit s'enchaîner (ex. « un bracelet de métal soudé à ton poignet »).
- Après génération : faire écouter `voice_ecoute.mp3`, puis verrouiller avant toute animation (tout est calé sur `words.json`).

## Mise à jour 2026-11-11 : voix par rôle (prime sur les réglages ci-dessus)
- **Narrateur (voix off, toujours la même)** : George, réglages « v2 expressif », **sans grave ajouté** (pitch 0), tempo 0,975.
- **Haut-parleur / annonces de l'Arène** : George −1,5 demi-ton + effet haut-parleur (passe-haut 280 Hz, passe-bas 4,2 kHz, compression, écho de forêt).
- **Personnages** : une voix par personnage ; ex. la fille = Jessica (`cgSgspJ2msm6clMCkdW9`), modèle `eleven_v3`, préfixe `[whispers] ` (chuchotement).
  Forfait gratuit : pas de création de voix par l'API ; pas de voix d'ado masculin français satisfaisante → préférer des personnages féminins/adultes.
- Configuration : `productions/<ep>/voices.json` ; répliques balisées `{role}« … »` dans SCRIPT.md ; outil : `python tools/tts_roles.py productions/<ep>`.
- Blancs : fin de phrase 0,27 s, virgule 0,10 s, **mots liés dans la phrase** (≤ 0,06 s), tension 0,55 s, avant réplique 0,12 s.
- Musique : `productions/<ep>/audio/ambient.py` (nappe mineure + cloches lointaines), ~9 dB sous la voix (validé) ; bruitages réduits à l'essentiel (`make_audio_v2.py`).
