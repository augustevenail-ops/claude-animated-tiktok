# Le Mur — épisode 1 : script v2 « rétention » (2026-11-13)

Objectif chiffré (stats L'appel : 70 % à 1 s, 53 % à 2 s, 29 % à 10 s) : **> 65 % à 2 s, > 35 % à 10 s, > 25 % de durée moyenne**.
Leviers : 1ʳᵉ image = la plus forte (un Long, de nuit) + texte à l'écran dès 0 s ; voix dès 0,1 s ; une question nouvelle
toutes les 5-8 s ; boucle ouverte au début refermée au milieu (« ne bouge pas » → règle n° 2) ; compteur « VIVANTS » à l'écran
qui crée l'anomalie 21/20 ; révélation finale + choix A/B. Voix : enregistrée par l'utilisateur (docs/VOIX.md), aucune autre voix.
≈ 215 mots ≈ 75-80 s. Les « … » = petite pause voulue ; **gras** = mot appuyé.

## Script à lire
Surtout… ne bouge pas.
Imagine… Tu te réveilles au milieu d'un labyrinthe géant. Des murs de trente mètres. À perte de vue. Et **aucun** souvenir.
Sur ton bras, quelqu'un a écrit au marqueur : « Ne les crois pas. » Et c'est **ton** écriture.
Le jour, le labyrinthe dort. Mais la nuit… il change. Les murs glissent. Et les Longs sortent. Blancs. Dix mètres de haut. Sans visage.
Ils ne courent jamais. Ils attendent que tu **bouges**.
Au centre, une clairière. Vingt jeunes, sans souvenirs, eux aussi. Une fille, Ilse, te donne les règles.
Règle numéro un : rentre avant la sirène. Règle numéro deux : la nuit, ne bouge plus. Règle numéro trois : si un mur porte ton nom, ne le touche **pas**.
Sur le grand mur, des centaines de noms gravés. Tous ceux qui ne sont jamais rentrés.
Ce soir, autour du feu, tu comptes. Vingt et un. Ilse recompte… Vingt.
La sirène hurle. Tu ne bouges plus. Toute la nuit, quelque chose gratte contre la pierre. Juste derrière ta tête.
Au matin, un nouveau nom est gravé sur le grand mur… Le **tien**. Et Ilse te regarde… comme si elle ne t'avait jamais vu.
Alors, tu suis le message sur ton bras et tu fuis seul dans le labyrinthe, ou tu restes et tu leur montres ton nom ? Dis-le en commentaire.
(fin, sur le carton titre) Abonne-toi pour l'épisode deux.

## Découpage (temps estimés, recalés ensuite sur words.json)
| t | Voix | Image | Texte écran / son | Rôle rétention |
|---|---|---|---|---|
| 0,0-1,5 | Surtout… ne bouge pas. | **NUIT.** Plongée : toi minuscule entre deux murs ; derrière le mur, la tête d'un Long se lève lentement (fente blanche) | « NE BOUGE PAS » (blanc, haut) ; souffle grave + impact sourd | arrêter le défilement dès la 1ʳᵉ image |
| 1,5 | Imagine… | **TAC** → plein jour orange : gros plan au sol sur toi, yeux qui s'ouvrent | coupure sèche, silence ½ s puis nappe | rupture = curiosité |
| 2-9 | Tu te réveilles… aucun souvenir. | **Grand recul** : du visage, le long du mur de 30 m, puis très haut : labyrinthe sans fin jusqu'à l'horizon, brume | montée de la nappe, vent | échelle vertigineuse |
| 9-14 | Sur ton bras… ton écriture. | Gros plan bras : « NE LES CROIS PAS » au marqueur (texte diégétique) | grincement de feutre | 1ʳᵉ énigme |
| 14-17 | Le jour… Mais la nuit… | Vue du ciel, jour | — | annonce |
| 17 | il change. | **TAC** nuit bleue d'un coup | interrupteur géant + ½ s de silence | choc |
| 17-26 | Les murs glissent… sans visage. | Vu du ciel la nuit : blocs qui glissent ; silhouettes blanches qui marchent lentement entre les couloirs ; puis contre-plongée sur un Long (≥ 5 personnages) | grondement de pierre, pas lourds lointains | montrer le monstre tôt |
| 26-29 | Ils ne courent jamais… bouges. | Un Long penché par-dessus un mur, immobile, au-dessus d'un jeune figé | cœur qui ralentit | règle du monde |
| 29-35 | Au centre… les règles. | Clairière, feu, 20 jeunes ; Ilse s'approche | HUD : « NUIT 1 » / « VIVANTS 21 » | nouveaux personnages |
| 35-45 | Règles 1-3 | 3 plans courts : sirène sur un poteau ; jeune figé de nuit ; un nom gravé qu'une main évite | « RÈGLE 1/2/3 » à l'écran ; la règle 2 referme le « ne bouge pas » du début | boucle refermée |
| 45-50 | Sur le grand mur… jamais rentrés. | Travelling vertical sur un mur couvert de noms | gravures qui scintillent | poids |
| 50-56 | Ce soir… Vingt et un. Ilse recompte… Vingt. | Plan sur les visages autour du feu, comptés un par un ; le compteur HUD hésite **21 → 20** | tic de compteur ; silence avant « Vingt » | anomalie (pic d'attention) |
| 56-63 | La sirène… derrière ta tête. | Nuit : toi allongé, yeux ouverts ; ombre de longs doigts sur le mur derrière toi | sirène, puis grattement très proche (son spatialisé) | peur |
| 63-70 | Au matin… Le tien. | Le grand mur au matin, zoom lent sur un nom fraîchement gravé ; **ton prénom ne s'affiche qu'au mot « tien »** | silence total puis impact | révélation |
| 70-73 | Et Ilse te regarde… | Ilse, visage fermé, comme une inconnue | — | 2ᵉ retournement |
| 73-80 | Alors… Dis-le en commentaire. | Toi entre le bras écrit et le mur ; cartes A « FUIR SEUL » / B « MONTRER TON NOM » | montée de tension jusqu'à la question | engagement |
| fin | Abonne-toi pour l'épisode deux. | Carton titre « LE MUR » | — | abonnement |
