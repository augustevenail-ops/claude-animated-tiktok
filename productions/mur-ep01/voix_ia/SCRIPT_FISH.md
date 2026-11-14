# Le Mur ép. 1 — narration balisée pour Fish Audio (modèle s1)
Règle : UNE balise d'émotion (..) en tête de CHAQUE phrase (vérifié par tools/tts_ia.py), éventuellement suivie
d'un ton : (whispering) (soft tone) (in a hurry tone) (shouting). Silences naturels : blancs ramenés à 0,3 s max (voix_ia.json : blanc_max), pauses imposées {pause X} en secondes. Vitesse 1,0 : vidéo nettement > 1 min (retour utilisateur ; 1,1 donnait 60,7 s, 1,05 donnait 62 s). Effets : (sighing) (panting).
Narrateur posé et grave (retour utilisateur 2026-11-14) : (serious)(soft tone) par défaut, (curious)(soft tone) pour les phrases intrigantes,
et (scared)(whispering) seulement pour l'accroche. Pas de cris, d'essoufflement ni de ton pressé.


(scared)(whispering) Surtout… (break) ne bouge pas.
{pause 0.2}
(curious)(soft tone) Imagine…
(serious)(soft tone) Tu te réveilles au milieu d'un labyrinthe géant.
(serious)(soft tone) Des murs de trente mètres, à perte de vue.
(serious)(soft tone) Et aucun souvenir de comment tu es arrivé là.
(serious)(soft tone) Le jour, le labyrinthe est calme.
(serious)(soft tone) Mais la nuit… il change.
(serious)(soft tone) Les murs bougent.
(serious)(soft tone) Et les Longs sortent.
(serious)(soft tone) Des créatures blanches de dix mètres, sans visage.
(serious)(soft tone) Ils ne voient rien.
(serious)(soft tone) Ils sentent ce qui bouge.
(curious)(soft tone) Au centre, une clairière.
(serious)(soft tone) Vingt jeunes, perdus comme toi.
(serious)(soft tone) Ils t'expliquent les deux règles pour survivre.
(serious)(soft tone) Règle numéro un : avant la sirène, tout le monde rentre dans la clairière.
(serious)(soft tone) Règle numéro deux : la nuit, ne bouge plus.
(serious)(soft tone) Même pas un doigt.
(serious)(soft tone) Sur un mur, des centaines de noms gravés.
(serious)(soft tone) Tous ceux qui ont bougé.
(curious)(soft tone) Mais toi, tu veux sortir d'ici.
(serious)(soft tone) Alors le lendemain, tu pars seul explorer le labyrinthe.
(serious)(soft tone) Loin.
(serious)(soft tone) Trop loin.
(serious)(soft tone) La sirène hurle.
(serious)(soft tone) Tu cours.
(serious)(soft tone) La clairière est au bout du couloir.
(serious)(soft tone) Cinquante mètres.
(serious)(soft tone) L'entrée commence à se refermer.
(serious)(soft tone) Et entre toi et l'entrée… un Long se déplie lentement.
(serious)(soft tone) Il tourne la tête vers toi.
(serious)(soft tone) Si tu cours, il te sent.
(serious)(soft tone) Si tu restes immobile, l'entrée se ferme, et tu passes la nuit seul dans le labyrinthe.
(curious)(soft tone) Alors, tu cours vers l'entrée, ou tu restes immobile toute la nuit ?
(curious)(soft tone) Dis-le en commentaire.

## Carton final (fichier séparé outro)
OUTRO: (serious)(soft tone) Abonne-toi pour l'épisode deux.
