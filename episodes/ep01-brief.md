# Le Quai 9 — épisode 01 : brief (2026-11-19)

Nouvelle série. Statut : **script à valider** (l'utilisateur veut valider le script avant voix et vidéo).
Production : `productions/quai9-ep01/` (à créer à l'étape voix). Code : `studio/src/videos/quai9/` (copie de `templates/bridge/` + modules de `mur/`).

## Concept
Tu te réveilles dans une station de métro qui n'existe sur aucun plan. Les rames passent toutes les neuf minutes sans s'arrêter.
Dans chacune, derrière les vitres, voyage quelque chose. Personne n'est jamais reparti du Quai 9.
- **Menace signature** : la Voyageuse.
- **Décor signature** : le quai 9, souterrain, carrelage blanc fêlé, néons, écran d'affichage LED orange.
- **Chiffre HUD** : `QUAI 9 · 23:14` (horloge bloquée) + compte à rebours `PROCHAINE RAME 08:59`, qui devient `PORTES 00:09` à la fin.

## Script v1 (à valider) — ~235 mots ≈ 75-80 s
Une phrase par ligne (format `SCRIPT_FISH.md` à l'étape voix : accroche `(scared)(whispering)`, le reste `(serious)(soft tone)`).

```
Ne réponds pas… Ce n'est pas ta mère.
Imagine.
Tu t'endors dans le dernier métro.
Quand tu rouvres les yeux, la rame est vide.
Elle s'arrête à une station qui n'existe sur aucun plan.
Quai 9.
L'horloge est bloquée sur vingt-trois heures quatorze.
Les escaliers remontent… et te ramènent sur le même quai.
Ici, une dizaine de personnes attendent. Certaines depuis des années.
Toutes les neuf minutes, une rame passe sans s'arrêter. Vide. Presque.
Une agente en gilet orange te montre un pilier couvert de post-it. Les règles.
Règle numéro un : quand la rame passe, baisse les yeux.
Derrière les vitres, il y a la Voyageuse. Si tu la regardes, elle te voit.
Règle numéro deux : si on t'appelle par ton prénom, ne réponds jamais.
Elle connaît la voix de tous ceux que tu aimes.
Cette nuit-là, un homme en costume relève la tête. Une seule seconde.
À la rame suivante, son banc est vide.
Et contre une vitre… son visage, écrasé sur le verre.
Puis l'écran du quai change. Prochain départ : toi.
La rame arrive. Et pour la première fois… elle s'arrête.
Les portes s'ouvrent. Sur le plan, une seule station allumée : la tienne.
Derrière toi, les néons s'éteignent un par un.
Une voix douce prononce ton prénom. La voix de ta mère.
Les portes se ferment dans neuf secondes.
Alors, tu montes dans la rame… ou tu restes sur le quai, sans te retourner ? Dis-le en commentaire.
OUTRO: Abonne-toi pour l'épisode deux.
```

Logique : l'accroche (règle 2) annonce la fin ; les escaliers en boucle expliquent pourquoi on ne part pas ; l'homme en costume
prouve la règle 1 ; « Prochain départ : toi » est la révélation ; le choix final oppose deux risques réels
(la rame = territoire de la Voyageuse mais elle mène chez toi / le quai = elle est maintenant derrière toi).
Cartes A/B : **A « MONTER »** (vert) / **B « RESTER »** (rouge).

## Style visuel à respecter
- three.js dans Remotion, personnages en **cartes 2D** Canvas2D (`mur/people.ts`), contours encre #221e1d, textures peintes
  (carrelage fêlé, affiches déchirées, post-it, graffitis, plan de ligne), flou de profondeur, grain et étalonnage (`look.ts`).
- **Couleurs premium, saturées** (demande utilisateur) : ombres bleu nuit désaturées ; accents saturés —
  néons **cyan** froid, lampes au sodium **ambre**, écran LED **orange** #FF8A1E, signal **rouge** de fin de quai,
  intérieur de rame **jaune chaud** (tentation), Voyageuse **blanc laiteux + halo cyan pâle**. Jamais gris terne.
- Lumière motivée : chaque source visible à l'image (néons qui grésillent, phares de la rame qui balaient le quai, reflets sur le carrelage mouillé).
- Décor « infini » : tunnel noir des deux côtés, poussière dans les phares, gouttes du plafond, papiers qui volent au passage de la rame.
- **Modèles Kenney** : aucun kit ne couvre le métro, et `assets/kenney/` n'est **pas présent** dans ce conteneur.
  Décor en **géométrie procédurale** (quai, voies, tunnel, rame, bancs, piliers, escaliers) ; Survival Kit (caisses, sacs) et
  Furniture Kit (bancs, poubelles) en appoint seulement si l'utilisateur les fournit.
- Rendu final **4K vertical 2160x3840** (`--scale 2`) ; les paramètres en pixels du post s'échelonnent avec la hauteur / 1920.

## Personnages (aucune voix de personnage : narrateur seul)
| Personnage | Tenue / look | Rôle |
|---|---|---|
| **Toi** | sweat rouge #d4533e, jean #4b5165, cheveux #3b2b25, sac à dos | héros, caméra subjective et vu de dos |
| **L'agente** | gilet orange fluo à bandes réfléchissantes, chignon gris, lampe torche | donne les règles, regard fatigué |
| **L'homme en costume** | costume anthracite, cravate dénouée, attaché-case | enfreint la règle 1, disparaît |
| Figurants (6-8) | étudiante (bonnet jaune), vieil homme (imperméable), ado (capuche verte), mère et bébé, livreur (sac isotherme) | vie du quai, peur (cernes violets, sourcils inversés) |
| **La Voyageuse** (monstre) | très grande (pliée sous le plafond de la rame), lumineuse d'elle-même, peau de porcelaine fissurée, **tête lisse sans visage inclinée à l'horizontale**, cou trop long, **manteau de voyage ancien bleu nuit** à boutons dorés, mains à 7 doigts plaquées sur les vitres | apparitions partielles : main sur la vitre, reflet, silhouette entre deux wagons ; entière seulement à la fin, derrière toi |
| **Ta mère** (voix seule) | jamais montrée | appât de la Voyageuse |

Comportements de la Voyageuse : se pencher, pivoter la tête par à-coups, glisser d'une vitre à l'autre au rythme de la rame, éteindre les néons en approchant.

## Continuité
Premier épisode : aucun antécédent. À savoir pour la suite : l'horloge bloquée sur 23 h 14, la rame toutes les 9 minutes,
l'agente (qui semble en savoir plus), l'écran « PROCHAIN DÉPART : TOI », le choix du public décidera de l'ouverture de l'ép. 2.

## Audio (recette `docs/audio.md`, mix sur le modèle `tools/mur_mix.py`)
- **Voix** : voix clonée Fish Audio (`voix_ia.json` copié de `mur-ep01`), vitesse 1.0, micro-pauses avant « Presque », « son visage », « elle s'arrête », « la voix de ta mère ».
- **Musique** : drone grave doux + notes tenues ; **pulsation grave** qui accélère à partir de « Prochain départ : toi » (~58 s) jusqu'au choix.
- **Bruitages** (discrets, nombreux) : grésillement de néons, gouttes, ronflement lointain du tunnel ; **passage de rame** (grondement qui monte,
  souffle d'air, crissement des rails, cliquetis des roues) à chaque rame ; carillon de quai déformé ; bip de l'écran LED ;
  freins et soupir pneumatique des portes à l'arrêt (~62 s) ; claquement des néons qui s'éteignent un par un (~68 s).
- **Signature Voyageuse** : craquements d'os « crac, crac, crac » + note « tiiin » à chaque apparition qui fait peur (accroche, ~38 s, ~54 s, ~68 s) ;
  sa voix (prénom) = murmure filtré, très bas, sous le narrateur.
- Final : stinger + « clic » + sting au passage ÉPISODE 1 → 2.

## Découpage prévu (≈ 78 s ; chaque plan sera recoupé en ~59 sous-plans de 1-2,5 s calés sur `words.json`)
| # | Temps visé | Phrase | Image / caméra |
|---|---|---|---|
| 1 | 0,0-2,8 | Ne réponds pas… Ce n'est pas ta mère. | Quai désert, néons cyan. Plan large de toi de dos → **zoom éclair** sur ta nuque au 1er mot → dézoom : derrière toi, dans le noir du tunnel, la tête lisse de la Voyageuse s'incline. Crac + tiiin. Flash 2 images. |
| 2 | 2,8-4,0 | Imagine. | Noir → gros plan de ton visage endormi contre une vitre, reflets de lumières qui défilent. |
| 3 | 4,0-6,2 | Tu t'endors dans le dernier métro. | **Drone** extérieur : rame jaune dans un tunnel noir, la caméra la suit en rasant le toit. |
| 4 | 6,2-9,0 | Quand tu rouvres les yeux, la rame est vide. | Intérieur : travelling lent le long des sièges vides, poignées qui se balancent ; tu te redresses au fond. |
| 5 | 9,0-12,2 | …une station qui n'existe sur aucun plan. | Gros plan sur le plan de ligne : 8 stations… une 9ᵉ pâle, griffonnée. Freins, la rame ralentit. |
| 6 | 12,2-13,5 | Quai 9. | **Contre-plongée** sur le panneau émaillé « QUAI 9 » qui grésille ; titre HUD apparaît. |
| 7 | 13,5-16,1 | L'horloge est bloquée sur 23 h 14. | Gros plan de l'horloge de quai, trotteuse qui tressaute sans avancer. |
| 8 | 16,1-19,3 | Les escaliers remontent… et te ramènent sur le même quai. | Plongée verticale sur toi qui montes l'escalier ; **raccord** : tu ressors en bas du même quai (même affiche déchirée). |
| 9 | 19,3-22,9 | Une dizaine de personnes attendent. Certaines depuis des années. | **Drone** lent le long du quai à hauteur de plafond : figurants sur les bancs, couvertures, barbe du vieil homme, poussière. |
| 10 | 22,9-26,9 | Toutes les neuf minutes, une rame passe… Vide. Presque. | Phares dans le tunnel, rame qui passe à pleine vitesse (flou de mouvement), papiers qui volent ; sur « Presque », **une main à 7 doigts** glisse sur une vitre. |
| 11 | 26,9-31,3 | Une agente en gilet orange… Les règles. | Plan moyen de l'agente à la lampe torche ; push-in sur un pilier couvert de post-it jaunes. |
| 12 | 31,3-34,5 | Règle numéro un : baisse les yeux. | Texte « RÈGLE 1 ». Ras du sol : rangée de pieds sur le quai, toutes les têtes baissées pendant que la rame passe. |
| 13 | 34,5-38,9 | Derrière les vitres, la Voyageuse… elle te voit. | **Reflet** dans le carrelage mouillé : silhouette penchée derrière une vitre qui défile ; sa tête pivote vers la caméra. Crac + tiiin. |
| 14 | 38,9-42,5 | Règle numéro deux : ne réponds jamais. | Texte « RÈGLE 2 ». Gros plan d'un post-it « NE RÉPONDS JAMAIS », écrit plusieurs fois, de mains différentes. |
| 15 | 42,5-45,5 | Elle connaît la voix de tous ceux que tu aimes. | L'étudiante qui se bouche les oreilles, yeux fermés, cernes violets ; travelling latéral lent. |
| 16 | 45,5-49,3 | Un homme en costume relève la tête. | Phares qui balaient le quai ; gros plan sur ses yeux qui montent ; **zoom éclair** dans son regard (reflet de la Voyageuse). |
| 17 | 49,3-51,7 | À la rame suivante, son banc est vide. | Même cadre, banc vide, attaché-case renversé. |
| 18 | 51,7-54,9 | Et contre une vitre… son visage, écrasé sur le verre. | Rame qui passe au ralenti : son visage collé à la vitre, bouche « o ». Flash 2 images. Crac + tiiin. |
| 19 | 54,9-58,1 | Puis l'écran change. Prochain départ : toi. | Écran LED orange qui défile ; lettres « PROCHAIN DÉPART : TOI » ; plan sur toi, peur. Pulsation démarre. |
| 20 | 58,1-61,5 | La rame arrive… elle s'arrête. | Phares en pleine face, **drone** reculant devant la rame qui freine, étincelles sur les rails. |
| 21 | 61,5-65,3 | Les portes s'ouvrent… une seule station allumée : la tienne. | Portes qui coulissent, intérieur jaune chaud et vide ; gros plan du plan de ligne, un point allumé : « CHEZ TOI ». |
| 22 | 65,3-68,1 | Derrière toi, les néons s'éteignent un par un. | **Grand plan large** du quai : les néons claquent du fond vers toi, le noir avance. |
| 23 | 68,1-71,5 | Une voix douce… La voix de ta mère. | Gros plan sur toi, figé ; **dézoom** : la Voyageuse entière dans ton dos, penchée, sans visage, à quelques centimètres. Crac + tiiin. |
| 24 | 71,5-73,8 | Les portes se ferment dans neuf secondes. | HUD `PORTES 00:09` en rouge ; voyant des portes qui clignote, carillon. |
| 25 | 73,8-79,4 | Tu montes dans la rame… ou tu restes sur le quai ? Dis-le en commentaire. | Profil serré : toi entre la rame jaune (droite) et le noir du quai (gauche) ; cartes A « MONTER » / B « RESTER ». |
| 26 | 79,4-83,0 | Abonne-toi pour l'épisode deux. | **Carton final** : vue plongeante du quai et des rails, écran LED « QUAI 9 », néon qui clignote ; « LE QUAI 9 — ÉPISODE 1 → 2 ». |

## Points ouverts à valider
1. **Script v1** : texte, ton, logique, fin. Il fait ~235 mots (≈ 78-80 s, dans la fourchette 60-90 s mais au-dessus de la cible ~68 s).
   Coupes possibles si tu veux plus court : « Une seule seconde. », « Les escaliers remontent… », « Elle connaît la voix… ».
2. Accroche « Ne réponds pas… Ce n'est pas ta mère. » — d'accord, ou une variante (« Ne te retourne pas. Elle est juste derrière toi. ») ?
3. Look de la Voyageuse (manteau de voyage bleu nuit, tête inclinée à l'horizontale) — d'accord ?
4. **Rendu 4K 2160x3840** : ~2,5x plus long que le 2K (rendu par morceaux) ; on garde aussi une version TikTok 1080x1920 ?
5. Décor procédural sans kit Kenney (aucun kit métro ; `assets/kenney/` absent du conteneur) — OK, ou tu fournis des modèles ?
