# Kit de style « Le Monstre » — à lire en premier

Ce dossier est la **source de vérité unique** pour le style visuel, le son et les sous-titres de la série « Le Monstre ».
Pour tout ce qui concerne ce projet, il **prime sur** `CLAUDE.md`, `docs/`, `templates/bridge/` et les autres projets (Le Mur, Le Nuage).
En cas de contradiction, suivre ce kit.

## Règles de priorité (à appliquer sans les rediscuter)
1. Look 3D cubique stylisé, lumière de nuit bleu/violet, projecteurs et faisceaux : voir `STYLE.md` §1 à §5.
2. Sous-titres **jaunes**, un mot à la fois, contour épais : voir `STYLE.md` §7. Pas de sous-titres orange ni de karaoké.
3. Format de sortie : 1440×2560 (2K), 30 images/s. Pas de question finale A/B, pas de carton de fin.
4. Son : voix off du narrateur seule (pas de filtre radio), musique de fond plus basse que la voix.

## Démarrer une nouvelle session
1. Attacher ce dépôt à la session (`add_repo`) : il contient le code du monde 3D, des personnages et des plans.
2. Premier message : « Lis uniquement `kit-style-monstre/README.md` puis `STYLE.md`. Ils priment sur tout autre document. »
3. Ne pas relancer de rendu sans demander : un rendu complet prend plusieurs heures.

## Fichiers du kit
- `STYLE.md` : valeurs chiffrées (lumières, ombres, couleurs, caméra, effets, sous-titres, son).
- `MANIFEST.md` : où se trouve le code, et ce qui n'est **pas** dans Git (voix, musique, police) et doit être copié à part.

## Limite à connaître
Si la session attachée contient aussi le `CLAUDE.md` racine, celui-ci est lu au démarrage. La priorité de ce kit reste écrite ci-dessus, mais le plus sûr est un dépôt dédié au kit, qui ne contient que Le Monstre.
