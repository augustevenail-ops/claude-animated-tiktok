# Le Mur ép. 1 — narration balisée pour Fish Audio (modèle s1)
Règle : UNE balise d'émotion (..) en tête de CHAQUE phrase (vérifié par tools/tts_ia.py), éventuellement suivie
d'un ton : (whispering) (soft tone) (in a hurry tone) (shouting). Silences naturels : blancs ramenés à 0,3 s max (voix_ia.json : blanc_max), pauses imposées {pause X} en secondes. Vitesse 1,0 : vidéo nettement > 1 min (retour utilisateur ; 1,1 donnait 60,7 s, 1,05 donnait 62 s). Effets : (sighing) (panting).
Émotions s1 utilisées : scared, worried, nervous, serious, curious, interested, confident, sad, depressed, upset, surprised.


(scared)(whispering) Surtout… ne bouge pas.
{pause 0.2}
(curious)(soft tone) Imagine…
(confused) Tu te réveilles au milieu d'un labyrinthe géant.
(surprised) Des murs de trente mètres, à perte de vue.
(worried)(soft tone) Et aucun souvenir de comment tu es arrivé là.
(relaxed) Le jour, le labyrinthe est calme.
(serious)(soft tone) Mais la nuit… il change.
(nervous) Les murs bougent.
(scared)(soft tone) Et les Longs sortent.
(scared) Des créatures blanches de dix mètres, sans visage.
(nervous)(whispering) Ils ne voient rien.
(scared)(whispering) Ils sentent ce qui bouge.
(interested) Au centre, une clairière.
(sad)(soft tone) Vingt jeunes, perdus comme toi.
(serious) Ils t'expliquent les deux règles pour survivre.
(confident) Règle numéro un : avant la sirène, tout le monde rentre dans la clairière.
(serious) Règle numéro deux : la nuit, ne bouge plus.
(scared)(whispering) Même pas un doigt.
(depressed)(soft tone) Sur un mur, des centaines de noms gravés.
(sad)(whispering) Tous ceux qui ont bougé.
(confident) Mais toi, tu veux sortir d'ici.
(interested) Alors le lendemain, tu pars seul explorer le labyrinthe.
(worried) Loin.
(nervous)(soft tone) Trop loin.
(scared)(shouting) La sirène hurle.
(nervous)(in a hurry tone)(panting) Tu cours.
(nervous)(in a hurry tone) La clairière est au bout du couloir.
(scared)(panting) Cinquante mètres.
(upset)(in a hurry tone) L'entrée commence à se refermer.
(scared)(soft tone) Et entre toi et l'entrée… un Long se déplie lentement.
(scared)(whispering) Il tourne la tête vers toi.
(nervous)(soft tone) Si tu cours, il te sent.
(worried)(soft tone) Si tu restes immobile, l'entrée se ferme, et tu passes la nuit seul dans le labyrinthe.
(serious) Alors, tu cours vers l'entrée, ou tu restes immobile toute la nuit ?
(interested)(soft tone) Dis-le en commentaire.

## Carton final (fichier séparé outro)
OUTRO: (confident)(soft tone) Abonne-toi pour l'épisode deux.
