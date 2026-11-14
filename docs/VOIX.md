# Voix off — réglages validés (utilisateur, 2026-11-11, épisode « L'Arène » 1)

> **HISTORIQUE — ne plus appliquer.** Depuis le 2026-11-14 (*Le Mur* ép. 1), la voix est la voix clonée de l'utilisateur sur **Fish Audio** :
> voir `docs/audio.md`. Ce fichier décrit l'ancienne voix ElevenLabs (George) des premières vidéos.

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
- **Narrateur validé (2026-11-11, « B »)** : George, stability 0.6, similarity 0.85, style 0.2 (phrasé posé, fins de phrase graves) +
  timbre plus plein `equalizer=f=140:t=q:w=1.1:g=4,equalizer=f=320:t=q:w=1.4:g=1.5,highshelf=f=6500:g=-2.5`, tempo 0,975, sans changement de hauteur.
- Musique d'ambiance : **~6 dB sous la voix** (relevée trois fois à la demande).
- Crédits ElevenLabs (forfait gratuit 10 000/mois) : une narration de 70 s ≈ 1 100 crédits ; prévoir le quota avant les itérations.
- **Musique validée ép. 1 (2026-11-11) : « J – Tambours lointains »** (`productions/arene-ep01/audio/bandes3.py`, `make_audio_v7.py 69.73 J`) :
  toms sourds réverbérés en motif régulier + cuivres graves tenus ; tension qui monte par couches, silence net sur « vingt-trois ».
  Leçon : pour ce type de scène, viser « l'attente avant le déclenchement » (pulsation, montée par couches), pas l'épique ni l'ouverture de film.
- Correction de texte isolée sans tout régénérer : `python tools/voice_patch.py productions/<ep> <i_premier_mot> <i_dernier_mot> "<phrase>"`
  (même créneau, durée totale inchangée).
- **« Ne le regarde pas » (2026-11-12)** : narrateur = George réglage « B » (inchangé) ; faux père = **Daniel** (`onwK4e9ZLuTAKqWW03F9`, stability 0,55 / similarity 0,8 / style 0,2, tempo 0,975) ;
  `productions/droite-ep01/voices.json`, pauses : fin de phrase 0,3 s, virgule 0,1 s, mots liés (≤ 0,06 s), tension 0,5 s avant « Ce », « Presque », « glacée ».
  Règle d'économie : générer la voix **une seule fois** (les segments sont mis en cache dans `voice/_seg`) ; proposer **1 à 2** voix au plus pour un nouveau personnage.

## Registre des voix (décision utilisateur 2026-11-12) — à réutiliser pour tous les futurs personnages du même type
| Rôle | Voix | ID | Réglages |
|---|---|---|---|
| Narrateur (toujours) | George | `JBFqnCBsd6RMkjVDRZzb` | réglage « B » : stability 0.6 / similarity 0.85 / style 0.2, tempo 0.975, fins de phrase graves (`tools/voice_fall.py`) |
| Homme adulte / père / « âgé » | Daniel | `onwK4e9ZLuTAKqWW03F9` | stability 0.55 / similarity 0.8 / style 0.2, tempo 0.975 |
| Fille / femme | Jessica | `cgSgspJ2msm6clMCkdW9` | `eleven_v3`, préfixe `[whispers] ` si chuchotée |
| Haut-parleur / annonces | George −1,5 demi-ton + effet haut-parleur | — | voir ci-dessus |
Ne proposer une nouvelle voix que pour un type de personnage absent de ce tableau (monstre, enfant…), puis l'ajouter ici.

## Voix enregistrée par l'utilisateur — réglages validés (2026-11-13, « L'appel » ép. 1) — défaut des voix perso
Prise : iPhone Dictaphone, **Sans perte**, **Mono**, « Améliorer l'enregistrement » désactivé ; une prise par épisode ;
code erreur = **clap + « erreur » + 1 s de silence + reprise de la phrase depuis son début**. Les répliques des autres rôles
(haut-parleur, mère…) ne sont pas lues : elles gardent la voix ElevenLabs de `voice/_seg`.

Chaîne (`tools/voix_transcrire.py` puis `tools/voix_perso.py`, défauts = réglages validés) :
1. Transcription locale **faster-whisper medium** (int8, CPU, `HF_HUB_DISABLE_XET=1`) ; passages douteux re-transcrits isolément
   (Whisper avale parfois un mot : « autre », « les »… — vérifier avant de corriger le script).
2. Prises ratées retirées avec `--cut a-b` (du début de la phrase ratée jusqu'à juste avant la reprise ; garder la **reprise**).
   Attention : un mot est retiré si son milieu tombe dans la coupe → borne de fin juste avant le mot repris.
3. Alignement texte du script ↔ transcription (les sous-titres gardent l'orthographe du script).
4. Nettoyage : passe-haut 75 Hz, anti-clics de bouche, débruitage léger ; **tout ce qui n'est pas un mot devient silence**
   (inspirations, salive, clap) ; toute voix/sifflante à < 0,25 s d'un mot est gardée (Whisper se trompe de 0,1-0,2 s).
5. **Erreurs corrigées, à ne pas refaire** :
   - début de « Imagine… » coupé : Whisper place le 1er mot trop tard → l'attaque est cherchée **en arrière** sur l'énergie ;
   - phrases collées sans silence : on cherche le **vrai silence** entre deux phrases (≥ 0,1 s) au lieu des temps Whisper ;
   - mini-coupure dans « chaque » : on ne raccourcit une pause **que dans un vrai silence** (< −55 dB), jamais dans un mot ;
   - grésillement sur les « ch »/« s » : adoucisseur de sifflantes (bande > 3,2 kHz, seuil −30 dB, 4:1, phase nulle) ;
   - **pas de changement de hauteur** (−1 demi-ton jugé robotique, même formants préservés).
6. Pauses : **fin de phrase 0,42 s**, **virgule / deux-points 0,14 s**, mots liés ≤ 0,06 s, tension (`voices.json`) gardée.
7. Timbre **« B + D »** (chaud/proche + sombre/dense) : `equalizer=f=110:g=2, lowshelf=f=160:g=2.5, equalizer=f=260:g=-1.5,
   equalizer=f=2800:g=1.2, highshelf=f=6500:g=-2.5, acompressor=threshold=-27dB:ratio=3.5:attack=5:release=130:makeup=2.5,
   +3 dB → asoftclip tanh → −3 dB` ; volume narrateur **−22,5 LUFS** (= voix ElevenLabs d'origine).
8. Phrase de fin (« Abonne-toi pour l'épisode N+1. ») lue à la fin de la prise → `--outro "<texte>"` → `outro.wav/json`.
9. Mix : `VOICE_DIR=<dossier> python3 tools/series_mix.py N` → **musique −1/4** (×0,75) pour les voix perso, bruitages inchangés.
Commande type : `python3 tools/voix_perso.py productions/appel-ep0N <prise.wav> <transcription.json> productions/appel-ep0N/voix_perso --cut a-b --outro "Abonne-toi pour l'épisode trois."`
Puis vidéo : copier `words.json` dans `studio/src/videos/<ep>/` et `mix.wav` dans `studio/public/<dir>/` (anciens gardés en `*_elevenlabs.*`), rerendre.
- **Décision finale (2026-11-13)** : on garde le timbre **B + D sans aucun abaissement** (réglage des ép. 1 et 2 de *L'appel*).
  Essais rejetés : −1 demi-ton rubberband (robotique), PSOLA −0,7 demi-ton ± formants, intonation « conteur » (--range/--enddrop),
  variantes lissées. Les options `--st --formant --range --enddrop --slow --onepass --soft --body` restent dans l'outil, **désactivées par défaut**.

> Ménage 2026-11-13 : outils de l'ancienne chaîne ElevenLabs (`tts_episode`, `voice_edit/fall/gap/patch/splice/tighten`) et planches d'essai
> (`voix_grave/effets/variantes`) supprimés ; les réglages décrits plus haut restent la référence. Chaîne actuelle : `voix_transcrire.py`
> → `voix_perso.py` → `series_mix.py` (répliques d'autres rôles : `tts_roles.py`/`tts_outro.py`, cache `voice/_seg`).
> **Voix des ép. 2-3 de L'appel (finale)** : F3 = `--st -0.7 --formant 0.97 --body --sat 1.5` ; musique : couche de tension (`TENSION=1`, défaut).
