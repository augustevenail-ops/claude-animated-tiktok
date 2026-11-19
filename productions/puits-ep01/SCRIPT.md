# Le Puits — épisode 1 : script v2 (2026-11-19, à valider)

Série : *Le Puits*. Immense oasis (10 000 habitants) au milieu du désert rouge, un seul puits. Narration « tu », voix clonée Fish Audio.
≈ 200 mots ≈ 65-70 s. L'épisode 1 **présente l'univers** : le héros ne descend pas. v1 (descente du héros) : historique git.

## Fond de la série (non dit dans l'ép. 1)
- Les Anciens contrôlent le puits et coupent eux-mêmes l'eau (vanne au fond) : **un peuple qui dépend de l'eau obéit**.
  « Celui d'en bas » est leur mensonge ; le tirage entretient la peur. Révélé au fil des épisodes suivants.
- Ép. 1 : on montre seulement les Anciens comme gardiens respectés du puits ; le seul indice est le « toc toc ».

## Structure
Imagine → la musique du tirage (son diégétique : tambour lent + long cor depuis la tour du puits) → tout le monde se fige
→ l'oasis, 10 000 personnes, un puits → Celui d'en bas → règle (amenée dans le récit) → le seau de sable → tirage → le petit frère
→ promesse « toc toc » → descente, corde coupée → toc toc (rapide) → personne n'a compris, sauf toi → choix.

## Script à lire (une phrase par ligne)
```
Imagine.
Tu vis dans une oasis, au milieu du désert. Et quand cette musique retentit…
ça veut dire que quelqu'un va devoir descendre.
Tout le monde arrête de respirer. Même ton petit frère arrête de jouer.
Ton oasis est immense. Plus de dix mille personnes.
Pas de rivière. Pas de pluie. Toute la ville dépend d'un seul puits.
Personne ne sait ce qu'il y a au fond.
Les Anciens disent qu'il y vit Celui d'en bas. C'est lui qui donne l'eau.
Et quand l'eau baisse… c'est qu'il a faim.
Personne n'a le droit de regarder au fond du puits. Celui qui regarde descend le prochain.
Ce matin, le seau est remonté plein de sable.
Alors, sur la grande place, chaque enfant plonge la main dans un sac de pierres blanches.
Une seule est noire.
Ton petit frère plonge la main… Elle est noire.
Avant qu'on l'attache à la corde, il se penche vers toi et chuchote :
« S'il n'y a pas de monstre en bas… je toquerai deux fois. »
Il descend dans le noir. Les Anciens coupent la corde.
Silence.
Toc… toc.
Personne ne réagit. Personne n'a compris ce bruit… à part toi.
Alors, tu révèles à tout le monde ce que tu viens d'apprendre, ou tu te tais ? Dis-le en commentaire.
OUTRO: Abonne-toi pour l'épisode deux.
```
Balises Fish : « Imagine. » et la ligne 2-3 `(serious)(soft tone)` (pas d'accroche chuchotée : l'ouverture se fait sur « Imagine » + la musique) ;
chuchotement du frère `(whispering)` ; « Toc… toc. » `(whispering)` ; tout le reste `(serious)(soft tone)`.
Les « toc » sont doublés au mix par deux coups sourds sur la pierre, avec écho de puits.
Cartes A/B : **A « RÉVÉLER »** (vert) / **B « SE TAIRE »** (rouge).

## Plans (temps indicatifs, recalés sur `words.json` ; ~59 sous-plans au montage)
Palette : désert rouge-orangé saturé, ciel cobalt, palmiers vert vif, tissus colorés (indigo, safran, grenat), eau turquoise,
nuit bleu profond, lanternes ambre ; puits = pierre ocre et gouffre noir-vert. HUD : `OASIS · 10 000 HABITANTS`, compteur `EAU : 12 %`.
| # | ≈ s | Phrase | Image / caméra / son |
|---|---|---|---|
| 1 | 0-1,2 | Imagine. | **Drone** au ras des dunes rouges au lever du soleil, qui file vers l'horizon. |
| 2 | 1,2-4,5 | Tu vis dans une oasis… Et quand cette musique retentit… | Le drone passe la crête : l'oasis apparaît, immense ; **la musique démarre** (tambour + cor) ; coupe sur le cor soufflé en haut de la tour du puits. |
| 3 | 4,5-7 | …quelqu'un va devoir descendre. | **Zoom éclair** sur la bouche noire du puits ; flash 2 images. |
| 4 | 7-10,5 | Tout le monde arrête de respirer. Même ton petit frère arrête de jouer. | Marché figé : marchands, porteurs d'eau, têtes qui se tournent ; gros plan de ton petit frère, sa toupie qui tombe et roule. |
| 5 | 10,5-13,5 | Ton oasis est immense. Plus de dix mille personnes. | **Grand drone** qui monte : toits plats, ruelles, voiles colorées, palmeraie à perte de vue ; HUD `10 000 HABITANTS`. |
| 6 | 13,5-17 | Pas de rivière. Pas de pluie. Un seul puits. | Plongée : toutes les ruelles convergent vers la grande place et le puits au centre ; files de gens avec des jarres. |
| 7 | 17-19 | Personne ne sait ce qu'il y a au fond. | **Plongée verticale** dans le puits, la lumière disparaît dans le noir. |
| 8 | 19-23 | Les Anciens disent… Celui d'en bas. C'est lui qui donne l'eau. | Trois Anciens en robes blanches, barbe, bâtons, sur les marches du puits (contre-plongée, dignes) ; fresque d'une silhouette blanche géante, sans yeux, bras trop longs. Note « tiiin ». |
| 9 | 23-26 | Quand l'eau baisse… c'est qu'il a faim. | Gros plan de la margelle : trait d'eau sec sur la pierre ; ombre d'une longue main dans le noir du puits (une seule image). Crac sourd. |
| 10 | 26-30,5 | Personne n'a le droit de regarder au fond… descend le prochain. | Un enfant s'approche du bord, sa mère le tire en arrière ; ras du sol sur les pieds qui reculent. Texte « RÈGLE ». |
| 11 | 30,5-33 | Le seau est remonté plein de sable. | Poulie qui grince, seau qui monte, sable qui coule ; HUD `EAU : 12 %`. |
| 12 | 33-37 | Sur la grande place, chaque enfant plonge la main… | Crépuscule rouge ; **drone** latéral le long de la file d'enfants ; un Ancien tient le sac ; foule silencieuse autour. |
| 13 | 37-38,5 | Une seule est noire. | Gros plan dans le sac : pierres blanches, une noire. |
| 14 | 38,5-42 | Ton petit frère plonge la main… Elle est noire. | Sa petite main ; **snap** sur le poing qui s'ouvre : pierre noire ; flash + impact ; ton visage, choc (cernes, sourcils inversés). |
| 15 | 42-47,5 | Avant qu'on l'attache… « je toquerai deux fois. » | Gros plan à deux : il se penche à ton oreille, lanterne ; il tapote deux fois sur ta main ; push-in lent. |
| 16 | 47,5-51 | Il descend dans le noir. Les Anciens coupent la corde. | Plongée : sa lanterne qui rapetisse dans le puits ; gros plan du couteau de l'Ancien qui tranche la corde ; la corde tombe. |
| 17 | 51-52,5 | Silence. | Plan large figé de la foule autour du puits ; plus aucun son, juste le vent. |
| 18 | 52,5-54,5 | Toc… toc. | **Zoom lent** dans le noir du puits ; deux coups sourds qui résonnent. |
| 19 | 54,5-59 | Personne ne réagit… à part toi. | Travelling latéral sur les visages neutres de la foule ; la caméra s'arrête sur toi, yeux grands ouverts ; puis les Anciens qui échangent un regard (indice). |
| 20 | 59-65 | Tu révèles… ou tu te tais ? | Toi au premier plan, la foule et les Anciens derrière, le puits au centre ; cartes A « RÉVÉLER » / B « SE TAIRE ». |
| 21 | 65-68 | Abonne-toi pour l'épisode deux. | Carton final : l'oasis vue du ciel la nuit, lanternes, le puits au centre comme un œil noir ; « LE PUITS — ÉPISODE 1 → 2 ». |

## Points ouverts
1. La musique du tirage : tambour lent + long cor (proposition), ou autre instrument (flûte, chant) ?
2. Les Anciens échangent un regard après le « toc toc » (plan 19) : garder cet indice, ou ne rien laisser voir ?
