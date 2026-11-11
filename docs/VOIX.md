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
