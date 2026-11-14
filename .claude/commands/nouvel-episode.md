---
description: Prépare le brief d'un nouvel épisode de la série puis ouvre une nouvelle session qui le réalise
argument-hint: [numéro] [sujet] (ex. 05 "un marchand de Kyoto")
---

Prépare le démarrage d'un nouvel épisode.

Arguments reçus : $ARGUMENTS

Le premier argument est le numéro de l'épisode, le reste est le sujet. Si le numéro ou le sujet manque, demande-le avant de continuer.

Lis dans cet ordre :
0. Vérifie que les fichiers de référence existent : CLAUDE.md, docs/serie.md, docs/personnages.md, docs/direction-artistique.md, docs/audio.md, docs/episodes.md. Ceux qui manquent, crée-les d'abord avec les informations disponibles dans le projet et dans cette conversation. Si une information indispensable manque (style, personnages, musique, voix off), pose-moi la question au lieu de l'inventer. Le dossier episodes/ doit aussi exister.
1. CLAUDE.md
2. docs/serie.md, docs/personnages.md, docs/direction-artistique.md, docs/audio.md
3. docs/episodes.md
4. Les épisodes précédents (episodes/ep*.md), uniquement pour la continuité : personnages présents, lieux, événements, fin de l'épisode précédent. Ne reprends pas leur découpage.

Crée ensuite le fichier episodes/ep[numéro]-brief.md contenant :
- Rappel du style visuel à respecter (couleurs, lumière, 2D/3D, modèles Kenney utilisés)
- Personnages présents, avec leur voix et leur tenue dans cet épisode
- Continuité : ce qui s'est passé avant, ce que le spectateur doit savoir
- Audio : musique, voix off, effets sonores attendus, avec le timing visé
- Découpage prévu en plans avec la durée de chacun (total entre 60 et 90 secondes)
- Points ouverts à me faire valider

Ajoute une ligne dans docs/episodes.md avec le statut « à faire ».
N'écris pas de code à cette étape.

## Ouverture de la nouvelle session

Une fois le brief écrit :

1. Commite le brief, docs/episodes.md et les fichiers de référence créés, avec le message « Brief épisode [numéro] : [sujet] ». Pousse la branche courante (`git push -u origin <branche>`).
2. Si l'outil `mcp__claude-code-remote__create_session` est disponible, ouvre une nouvelle session avec :
   - `title` : « Épisode [numéro] – [sujet] »
   - `source_url` : l'URL du dépôt (`git remote get-url origin`)
   - `source_revision` : la branche que tu viens de pousser
   - `prompt` : le texte du bloc ci-dessous, avec le numéro rempli
   Donne-moi ensuite l'identifiant ou le lien de la session créée.
3. Si l'outil n'est pas disponible (session locale), dis-le en une ligne et contente-toi du bloc ci-dessous.

Termine ta réponse par le bloc ci-dessous, prêt à copier dans une nouvelle session :

---
Lis CLAUDE.md puis episodes/ep[numéro]-brief.md et suis-le.
Commence par me proposer le découpage final en plans et attends ma validation avant de coder.
---
