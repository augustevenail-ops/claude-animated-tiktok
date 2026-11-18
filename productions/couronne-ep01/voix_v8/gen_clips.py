#!/usr/bin/env python3
"""Génère les clips voix de l'épisode 1 (Fish Audio REST, clé injectée par le proxy). Un clip = une phrase.
  python3 gen_clips.py [id ...]   (sans argument : tous les clips absents du dossier clips/)"""
import json, sys, urllib.request, urllib.error
from pathlib import Path

NARR = "15ba126e214c4eae9c69d5a01bbbf53c"   # Narrateur Expressif et Profond (narrateur + radio)
PERE = "cc364efb6d70451f90c3ea4f870c9482"   # Narrateur Mystérieux et Calme (père)
T = "[serious][soft tone] "
CLIPS = [  # (id, voix, modèle, texte)
 ("s01", NARR, "s2.1-pro", T + "Imagine."),
 ("s02", NARR, "s2.1-pro", T + "Tu vis sous un dôme magnétique, et d'ici 3 jours, il sera coupé."),
 ("s03", NARR, "s2.1-pro", T + "10 000 personnes arrêtent de bouger."),
 ("s04", NARR, "s2.1-pro", T + "Le champ magnétique vous protège des radiations extérieures, mais le conseil vient d'annoncer qu'il n'y a plus assez d'énergie pour le maintenir sur les districts."),
 ("s05", NARR, "s2.1-pro", T + "Ici, les riches habitent au centre."),
 ("s06", NARR, "s2.1-pro", T + "Tout autour, il y a les districts."),
 ("s07", NARR, "s2.1-pro", T + "Règle numéro 1."),
 ("s08", NARR, "s2.1-pro", T + "Ne sors jamais du dôme."),
 ("s09", NARR, "s2.1-pro", T + "Dehors, l'air tue en quelques minutes."),
 ("s10", NARR, "s2.1-pro", T + "Ton père est ingénieur."),
 ("s11", NARR, "s2.1-pro", T + "Le soir même, il demande à voir les dossiers sur le dôme."),
 ("s12", NARR, "s2.1-pro", T + "Le lendemain matin, des gardes l'emmènent."),
 ("s13", NARR, "s2.1-pro", T + "Il ne se débat pas."),
 ("pere", PERE, "drama-3", "[whispering] <fast>Prends ça. C'est la seule chose qui peut nous sauver.</fast>"),
 ("s14", NARR, "s2.1-pro", T + "Tu demandes où on l'emmène."),
 ("s15", NARR, "s2.1-pro", T + "Le garde répond : « Au centre. »"),
 ("s16", NARR, "s2.1-pro", T + "Le centre, où vivent les plus riches."),
 ("s17", NARR, "s2.1-pro", T + "Personne n'en revient."),
 ("s18", NARR, "s2.1-pro", T + "Règle numéro 2."),
 ("s19", NARR, "s2.1-pro", T + "Tu ne vas jamais au centre."),
 ("s20", NARR, "s2.1-pro", T + "Un second mur sépare les districts."),
 ("s21", NARR, "s2.1-pro", T + "Tu déplies la feuille."),
 ("s22", NARR, "s2.1-pro", T + "Ton père a écrit une seule phrase : « Il reste de l'énergie. Ils nous mentent. »"),
 ("radio", NARR, "s2.1-pro", "[serious] Le conseil annonce à la radio : seul le centre restera protégé à cause du manque d'énergie, les agitateurs seront exécutés."),
 ("s23", NARR, "s2.1-pro", T + "Tu révèles ce que tu sais à tout le dôme et ton père risque d'être exécuté, ou tu te tais ?"),
 ("s24", NARR, "s2.1-pro", T + "Choisis en commentaire."),
 ("s25", NARR, "s2.1-pro", T + "Abonne-toi pour la partie 2."),
]
def gen(cid, ref, model, text):
    body = {"text": text, "reference_id": ref, "format": "mp3", "mp3_bitrate": 192, "normalize": True, "latency": "normal"}
    body["prosody"] = {"speed": 1.1 if cid == "pere" else 1.08, "volume": 0}   # père ~2,9 s ; narrateur/radio calés sur le débit de la v7 validée
    req = urllib.request.Request("https://api.fish.audio/v1/tts", json.dumps(body).encode(),
        {"Content-Type": "application/json", "Authorization": "Bearer proxy-injected", "model": model})
    try:
        with urllib.request.urlopen(req, timeout=600) as r: data = r.read()
    except urllib.error.HTTPError as e:
        sys.exit(f"{cid}: Fish {e.code}: {e.read().decode()[:300]}")
    Path("clips").joinpath(cid + ".mp3").write_bytes(data); print(cid, len(data), "octets")
if __name__ == "__main__":
    want = set(sys.argv[1:])
    for c in CLIPS:
        if (want and c[0] in want) or (not want and not Path("clips", c[0] + ".mp3").exists()): gen(*c)
