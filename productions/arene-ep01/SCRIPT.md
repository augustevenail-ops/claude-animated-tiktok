# L'Arène — épisode 1 « Vingt-quatre » (brouillon v1, à valider)

## Concept de la série (original, ambiance inspirée des jeux de survie télévisés)
- Chaque année, un pays tire au sort 24 personnes et les lâche dans une **Arène** : une forêt sous un **dôme** dont
  le ciel est un écran. Le jeu est filmé, diffusé partout, les spectateurs parient. **Un seul ressort.**
- Objet signature : un **bracelet de métal soudé au poignet** qui affiche le nombre de joueurs encore en vie.
- Au centre : un **monolithe noir** entouré de caisses de ravitaillement (eau, couteaux, sacs, cartes).
- Narration à la 2ᵉ personne ; chaque épisode finit sur un **choix A/B** ; l'épisode suivant suit le choix majoritaire.
- À éviter (originalité) : noms, lieux, symboles et scènes du film d'inspiration (pas de « tributs », « districts »,
  corne dorée, plateformes de départ, oiseau emblème).

## Script (≈ 240 mots, ~68-72 s ; blancs ramenés à ~0,2 s par `tools/voice_tighten.py`) — voix : George (ElevenLabs), réglage expressif à choisir
Imagine… Tu te réveilles dans une forêt que tu n'as jamais vue. Avec un bracelet de métal… soudé à ton poignet.
Il affiche un seul chiffre : **vingt-quatre**.
Autour de toi, d'autres gens se relèvent dans l'herbe. Personne ne sait comment il est arrivé là.
Ton dernier souvenir, c'est ta chambre. Et une lumière blanche.
Au-dessus des arbres, le ciel a quelque chose de bizarre. Il est trop lisse. Comme un **plafond** peint.
Puis une voix sort des haut-parleurs cachés dans les troncs.
« Bienvenue dans l'**Arène**. Vous êtes vingt-quatre. Un seul ressortira. »
Chaque année, le pays tire au sort vingt-quatre personnes. Le jeu est **filmé**, diffusé partout, et les gens parient
sur qui tiendra le plus longtemps.
Ton bracelet, c'est ton **compteur**. Il montre combien de joueurs sont encore en vie. Et il ne s'enlève pas. Tu as déjà essayé.
Au centre de la clairière, un **monolithe** noir. À ses pieds, des caisses : de l'eau, des couteaux, des sacs, des cartes.
« Le jeu commence dans **soixante** secondes. »
Le garçon à côté de toi te murmure : « Ne cours pas au **centre**. L'an dernier, la moitié est tombée là-bas. »
Mais sans **eau**, tu ne tiendras pas trois jours. Et la rivière la plus proche, personne ne sait où elle est.
Le compte à rebours démarre.
Et ton bracelet passe à… **vingt-trois**.
Personne n'a encore bougé.
Alors, tu cours vers le **monolithe**, ou vers la **forêt** ? Dis-le en commentaire.

(Mots en gras = mots appuyés par la voix ; sous-titres tout en blanc. Micro-pauses voulues avant « vingt-trois » et « Personne n'a encore bougé ».)

## Découpage visuel prévu (≈ 16 plans)
1. POV au sol, herbe floue au premier plan, mains + bracelet « 24 » (insert lumineux cyan).
2. Plan large en lent travelling latéral : silhouettes qui se relèvent dans une clairière brumeuse, aube froide.
3. Contre-plongée sur le ciel : légère trame/hexagones du dôme visible (le « plafond »).
4. Insert haut-parleur dans un tronc ; la voix résonne (sous-titres entre « »).
5. Écran géant dans le ciel : logo de l'Arène, chiffre 24 (texte diégétique).
6. Plan des caméras-drones dans les arbres (« filmé ») + chiffres de paris défilant sur l'écran du ciel.
7. Insert bracelet (« compteur »).
8. **Plan signature** (« Au centre de la clairière… », ~4 s) : la caméra part du POV, s'élève d'une traite au-dessus des
   arbres et bascule en plongée : le monolithe noir et les caisses au centre, les 24 candidats en cercle tout autour,
   la forêt et le bord du dôme au loin. Lumière rouge d'alerte en haut du monolithe.
9. Écran du ciel : 60 → compte à rebours rouge.
10. Le garçon (carte 2D, capuche, visage inquiet) en plan moyen, flou d'arrière-plan.
11. Insert gourde/caisse d'eau sous la lumière rouge.
12. Plans serrés alternés des joueurs immobiles, compte à rebours, kick caméra au bip.
13. Insert bracelet : 24 → 23 (micro-pause, silence musical).
14. Plan large : personne ne bouge, le vent dans les herbes.
15. Fin : POV, étiquettes à l'écran « A - MONOLITHE » / « B - FORÊT ».

## Design du centre de l'Arène (« le Monolithe ») — original, aussi riche qu'une arène de film
Pas un rocher : une **structure fabriquée**, imposante et pleine de détails.
- **La tour** : flèche noire anguleuse de ~12 m, faite de plaques de métal empilées et décalées (rivets, panneaux
  `metal-panel*` du Survival Kit), fendue de haut en bas par une **fente lumineuse rouge** ; au sommet, un anneau
  d'écrans/caméras qui tourne lentement. Le compte à rebours s'affiche sur ses faces.
- **Le socle** : plateforme octogonale à trois marches, grilles de sol métal (`structure-metal-floor`), rampes
  d'où « débordent » les caisses, comme si la tour venait de les vomir.
- **Le ravitaillement, disposé en éventail** (gradient de valeur = gradient de danger) :
  - au pied de la tour (0-6 m) : le meilleur matériel en tas désordonné : coffres ouverts (`chest`, `box-large-open`),
    sacs à dos, gourdes, trousses de soin, **râteliers d'armes** (lances, arcs, carquois, machettes, haches,
    couteaux plantés dans les caisses), tonneaux, rouleaux de corde ;
  - à mi-distance (6-18 m) : caisses isolées, sacs renversés, outils (`tool-axe`, `tool-pickaxe`, `tool-hammer`,
    `tool-shovel`), bâches, couchages (`bedroll`), seaux, bouteilles, objets tombés dans l'herbe ;
  - en périphérie (18-30 m) : quelques objets épars, à portée des plus prudents.
  - Placement procédural (code) : seed fixe, densité décroissante, rotations aléatoires, objets renversés/entrouverts,
    rien d'aligné ; armes à modéliser en code si absentes des kits (arc, lance, carquois, couteau).
- **Les 24 candidats** en cercle à ~35 m, chacun sur un marquage au sol (disque métal + numéro), séparés de ~9 m.
- **Autour** : herbe haute, souches, rochers, puis la ceinture de pins et les falaises ; au loin, le bord du dôme.
- Couleurs : métal noir bleuté, fente et voyants rouges saturés, caisses ocre/vert militaire, bâches orange délavé,
  lumière d'aube froide ; accents cyan des écrans et bracelets.

## Ambiance
- Aube bleu-gris (nouveau preset `dawn` / `night` désaturé) + accents saturés : rouge #F53C38 (monolithe, compte à rebours),
  cyan des écrans et du bracelet. Badge permanent en haut à gauche : « ARÈNE · JOUR 1 ».
- Son : drone grave + basse pulsée, bip de compte à rebours, vent, oiseaux qui se taisent ; silence total sur « vingt-trois ».
- Kits : Nature (pins, rochers, falaises, herbes, souches), Survie (caisses, tonneaux, sacs, outils, bâches).
