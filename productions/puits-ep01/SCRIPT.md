# Le Puits — épisode 1 : script v1 (2026-11-19, à valider)

Série : *Le Puits*. Oasis au milieu du désert rouge, cercle de pierres blanches, un puits. Narration « tu », voix clonée Fish Audio.
≈ 230 mots ≈ 75 s. Règles amenées une par une dans le récit (jamais listées d'affilée). Les Anciens ne sont **pas nommés** :
on ne voit que trois silhouettes à lanternes, puis une voix âgée à la toute fin.

## Mystère et logique
- Ce qu'on croit : l'eau vient de « Celui d'en bas », un monstre au fond du puits ; quand l'eau baisse, un enfant tiré au sort lui est offert.
- Le signal : ton petit frère (8 ans) promet de toquer deux fois s'il n'y a pas de monstre. Il toque deux fois.
- Ce qu'on découvre : au fond, pas de monstre, une vanne rouillée encore mouillée (quelqu'un coupe et rend l'eau) et les petites traces
  de ton frère qui partent dans un tunnel vers des lumières lointaines. Qui sont les trois silhouettes, et où mène le tunnel : épisode 2.
- Règles (amenées au fil de l'histoire) : 1. personne ne franchit le cercle de pierres ; 2. quand l'eau baisse, la pierre noire désigne qui descend ;
  3. une fois la corde coupée, on ne prononce plus jamais son nom.
- Choix : remonter dire la vérité au village (le couvercle vient d'être refermé) / suivre ton frère dans le tunnel.
- « Celui d'en bas » n'existe peut-être pas, mais on le **montre** comme le village l'imagine : fresques sur les murs de terre, ombre dans le puits
  dans les plans d'accroche et de légende (silhouette lumineuse, sans yeux, bras trop longs). Le spectateur doute jusqu'au « toc toc ».

## Script à lire (une phrase par ligne)
```
Toc… toc.
Ton petit frère est au fond du puits. Et il vient de te dire que le monstre n'existe pas.
Imagine.
Tu vis dans une oasis perdue au milieu du désert rouge.
Quelques maisons de terre, des palmiers, et au centre, un puits.
Tout autour, un cercle de pierres blanches. Personne ne le franchit. On dit qu'au-delà, le désert rend fou.
L'eau du puits, on la doit à Celui d'en bas.
Et cette année, le seau remonte plein de sable.
Alors, comme chaque fois que l'eau baisse, on tire une pierre dans un sac.
La pierre noire désigne celui qui descendra porter l'offrande.
Ton petit frère plonge la main dans le sac… Elle est noire.
Cette nuit-là, il te chuchote : « S'il n'y a pas de monstre en bas… je toquerai deux fois. »
À l'aube, on l'attache à la corde. Il descend dans le noir. Puis on coupe la corde.
Ici, quand la corde est coupée, plus personne ne prononce son nom.
Tu restes penché au bord. Une minute. Dix.
Toc… toc.
Le soir même, l'eau revient. Claire. Fraîche.
Et cette nuit-là, tu vois trois silhouettes, lanternes à la main, se glisser jusqu'au puits.
Tu attends qu'elles repartent… et tu descends.
Au fond, pas de monstre.
Juste une grosse vanne rouillée. Encore mouillée.
Et des petites traces de pas qui s'enfoncent dans un tunnel.
Sur la paroi, à la craie : une flèche. Et deux traits.
Au bout du tunnel, très loin, des lumières.
Au-dessus de toi, une voix âgée murmure : « Encore un. » Et on referme le couvercle.
Alors, tu remontes dire la vérité au village, ou tu suis ton frère dans le tunnel ? Dis-le en commentaire.
OUTRO: Abonne-toi pour l'épisode deux.
```
Balises Fish : accroche (« Toc… toc. » + phrase 2) `(scared)(whispering)` ; chuchotement du frère `(whispering)` ; tout le reste `(serious)(soft tone)`.
Les « toc » de l'accroche et de la ligne 16 sont aussi des bruitages (deux coups sourds sur la pierre, avec écho de puits).
Cartes A/B : **A « REMONTER »** (vert) / **B « LE TUNNEL »** (rouge).

## Plans (temps indicatifs, recalés sur `words.json` ; ~59 sous-plans au montage)
Palette : désert rouge-orangé saturé le jour, nuit bleu profond, lanternes et feux ambre, eau turquoise, craie blanche, fond du puits vert-bleu froid.
HUD : `OASIS · JOUR 1` puis `NUIT`, compteur `EAU : 12 %` qui tombe, puis remonte à `100 %`.
| # | ≈ s | Phrase | Image / caméra / son |
|---|---|---|---|
| 1 | 0-1,5 | Toc… toc. | Nuit. **Plongée verticale** dans le puits, cercle de lune au bout ; deux coups sourds qui résonnent ; la caméra tombe d'un cran à chaque « toc ». |
| 2 | 1,5-5 | Ton petit frère est au fond… le monstre n'existe pas. | Toi penché au bord, lanterne, visage éclairé par en dessous ; **zoom éclair** sur tes yeux ; dézoom : au fond, l'ombre d'une longue main… puis plus rien. Flash 2 images. |
| 3 | 5-6 | Imagine. | Noir → lever de soleil rouge sur les dunes. |
| 4 | 6-9 | Une oasis perdue au milieu du désert rouge. | **Drone** très haut qui descend vers une tache verte minuscule au milieu de dunes infinies, brume de chaleur. |
| 5 | 9-12 | Maisons de terre, palmiers, et au centre, un puits. | **Drone rasant** entre les palmiers et les toits de terre, linge qui sèche, chèvres ; finit en orbite autour du puits en pierre. |
| 6 | 12-17 | Un cercle de pierres blanches… le désert rend fou. | Plongée : l'anneau parfait de pierres blanches autour du village ; ras du sol sur une pierre, un enfant qui recule le pied ; au-delà, dunes et mirage. Texte léger « RÈGLE 1 ». |
| 7 | 17-19,5 | L'eau du puits, on la doit à Celui d'en bas. | Fresque peinte sur un mur de terre : silhouette blanche géante, sans yeux, bras trop longs, enfants à ses pieds ; travelling lent. Note « tiiin ». |
| 8 | 19,5-22 | Le seau remonte plein de sable. | Gros plan de la poulie qui grince, seau qui monte… sable qui coule. HUD `EAU : 12 %`. |
| 9 | 22-25 | On tire une pierre dans un sac. | Place du village au crépuscule rouge, enfants en ligne, sac de toile ; visages inquiets (cernes violets). |
| 10 | 25-28 | La pierre noire désigne celui qui descendra. | Gros plan d'une main d'adulte qui tient le sac ouvert ; dans le noir du sac, des pierres blanches et une noire. Texte « RÈGLE 2 ». |
| 11 | 28-31,5 | Ton petit frère plonge la main… Elle est noire. | Gros plan de sa petite main ; **snap** sur le poing qui s'ouvre : pierre noire. Flash + impact. Puis ton visage, choc. |
| 12 | 31,5-36 | « S'il n'y a pas de monstre… je toquerai deux fois. » | Nuit, intérieur de maison de terre, bougie ; ton frère et toi sur une natte ; il frappe doucement deux fois sur le sol pour montrer ; lent push-in. |
| 13 | 36-40,5 | À l'aube… on coupe la corde. | Aube orange : on l'attache, il descend (plongée dans le puits, sa lanterne rapetisse) ; gros plan d'un couteau qui tranche la corde. |
| 14 | 40,5-43,5 | Plus personne ne prononce son nom. | Les villageois qui tournent le dos un par un ; sa natte roulée. Texte « RÈGLE 3 ». |
| 15 | 43,5-46 | Tu restes penché au bord. Une minute. Dix. | Toi seul au bord du puits ; ombre qui tourne au sol (temps qui passe) ; vent, sable. |
| 16 | 46-48 | Toc… toc. | Silence total ; **zoom très lent** dans le noir du puits ; deux coups sourds. Ton visage s'illumine. |
| 17 | 48-50,5 | L'eau revient. Claire. Fraîche. | Seau qui remonte plein d'eau turquoise ; villageois qui boivent ; HUD `EAU : 100 %`. |
| 18 | 50,5-54,5 | Trois silhouettes, lanternes à la main. | Nuit bleue, **drone** au-dessus des toits : trois lanternes ambre qui glissent vers le puits ; toi caché derrière un mur. |
| 19 | 54,5-57 | …et tu descends. | Tu enjambes la margelle ; descente le long de la paroi (caméra qui te suit vers le bas). |
| 20 | 57-58,5 | Au fond, pas de monstre. | Fond du puits vert-bleu, flaque, ta lanterne ; panoramique 360° rapide : rien. |
| 21 | 58,5-61 | Une grosse vanne rouillée. Encore mouillée. | Gros plan de la vanne, gouttes qui tombent, symbole gravé dessus. |
| 22 | 61-64 | Des petites traces de pas… un tunnel. | Ras du sol : petites empreintes dans la boue qui partent vers une arche noire. |
| 23 | 64-67 | Une flèche. Et deux traits. | Craie blanche sur la pierre : flèche + deux traits ; push-in. |
| 24 | 67-69,5 | Au bout du tunnel, des lumières. | Travelling avant dans le tunnel, au loin des points de lumière dorée. |
| 25 | 69,5-74 | « Encore un. » Et on referme le couvercle. | **Contre-plongée** depuis le fond : en haut, le cercle de ciel, une lanterne, une silhouette penchée ; le couvercle glisse, le cercle se réduit à un croissant. Crac sourd. |
| 26 | 74-79 | Tu remontes… ou tu suis ton frère ? | Toi au fond, entre le rai de lumière en haut et le tunnel ; cartes A « REMONTER » / B « LE TUNNEL ». |
| 27 | 79-82 | Abonne-toi pour l'épisode deux. | Carton final : l'oasis vue du ciel la nuit, cercle de pierres blanches, puits au centre qui luit faiblement ; « LE PUITS — ÉPISODE 1 → 2 ». |

## Points ouverts
1. Durée ≈ 75-80 s (cible 68 s) : coupes possibles « Le soir même, l'eau revient. Claire. Fraîche. » ou « Ici, quand la corde… ».
2. « Encore un. » à la fin : garder (indice sur les Anciens) ou finir seulement sur le couvercle ?
3. Montrer « Celui d'en bas » en fresque et ombre au début (on doute), ou ne jamais le montrer ?
