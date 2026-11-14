# Personnages — règles de reproduction (2026-11-14)

Fiche chiffrée complète (validée) : `docs/STYLE_PERSONNAGES.md`, section « Fiche de reproduction complète ». Code : `studio/src/videos/mur/people.ts`, `longs.ts`.

## Humains : cartes 2D Canvas2D dans le monde 3D
- Carte 600x1000, contour encre #221e1d 11 px, tête ronde blanche porcelaine (R 122), cheveux « casque-bol », yeux ovales noirs, bouche tiret.
- **Toi** (héros, vu de dos ou de face) : sweat rouge #d4533e, jean #4b5165, cheveux #3b2b25. Les figurants varient coupe et couleur de cheveux.
- Expressions (prop `expr`) : neutre, inquiet, **peur** (validée : cernes violets (112,84,150), sourcils épais inversés, petits yeux, bouche « o »),
  choc, soulagement. Les sourcils doivent rester visibles sous la frange.
- Toujours un geste vivant : respiration, tremblement (`jit`), regard, pas.

## Monstre : modèle des « Longs » (*Le Mur*)
- Silhouette unique très longiligne (~5 personnages de haut), lumineuse d'elle-même (blanc/lavande), halo, peau de porcelaine fissurée,
  tête-œuf **sans yeux**, bouche zigzag qui s'ouvre en fente, mains à 7 doigts. Apparitions partielles (main, tête, ombre) puis entières.
- Son signature : sifflement qui se balade + **craquements d'os « crac, crac, crac »** + note aiguë « tiiin » (`audio.md`).
- Pour une nouvelle série : créer **un** monstre signature avec la même logique (silhouette lisible en une image, un détail dérangeant,
  un son signature, comportements : se pencher, pivoter la tête, apparaître par morceaux).

## Voix
Un seul narrateur (voix clonée de l'utilisateur) ; pas de voix de personnages sauf demande (`audio.md`).
