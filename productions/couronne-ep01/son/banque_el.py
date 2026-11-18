# Banque de bruitages cinéma générés par ElevenLabs (sound-generation ; clé injectée par le proxy), un fichier par son,
# dans productions/sfx_lib_el/. Un son déjà présent n'est pas regénéré.  Usage : python3 son/banque_el.py
import json, os, subprocess, sys
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "sfx_lib_el"); os.makedirs(OUT, exist_ok=True)
B = {  # nom : (durée s, description)
  # ambiances
  "drone_sombre": (15, "dark atmospheric cinematic drone, deep low sustained tone, slowly evolving, seamless loop, no melody"),
  "scifi_ambiance": (12, "sci-fi ambient background, soft electronic hum, distant machinery, spaceship interior, seamless loop"),
  "bourdon_industriel": (8, "industrial hum, large electrical transformer, low steady buzz, seamless loop"),
  "bunker": (8, "underground bunker ambience, concrete room tone, distant ventilation, faint metallic creaks, seamless loop"),
  "vent_apocalypse": (12, "apocalyptic wind over a desert wasteland, howling gusts, dust, ominous, seamless loop"),
  "vent_leger": (12, "soft night wind ambience in a city, gentle, calm, seamless loop"),
  "drone_suspense": (10, "suspense drone, low tense cinematic texture, slowly rising, dark, no melody"),
  "grondement": (6, "deep environmental rumble, distant earth rumble, sub bass, ominous"),
  # dôme et technologie
  "porte_metal": (4, "heavy metallic blast door slamming shut, deep echo, cinematic"),
  "porte_hydraulique": (3, "hydraulic sci-fi door opening, pneumatic hiss and mechanical slide"),
  "verrou": (2, "heavy mechanical locking mechanism, metal bolts clanking into place"),
  "bips": (2, "electronic beeps, futuristic computer interface, short soft"),
  "interface": (3, "digital holographic interface sounds, soft data chirps and glitches, sci-fi"),
  "panne": (3, "electrical malfunction, sparks crackling and buzzing, power fluctuation"),
  "generateur_baisse": (5, "power generator shutting down, electric whine winding down, lights going out"),
  "ventilation": (6, "air ventilation and oxygen filtration system, steady airflow hum, seamless loop"),
  # gaz, apocalypse
  "gaz": (6, "toxic gas leak, chemical hissing from a pipe, steady pressure hiss"),
  "explosions_loin": (6, "distant explosions rumbling far away, muffled, cinematic"),
  "effondrement": (4, "distant metallic structure collapse, groaning metal and crash, reverb"),
  # suspense
  "boom": (4, "deep cinematic boom, huge low impact with long reverb tail, trailer"),
  "sub_hit": (3, "sub bass hit, deep punchy low frequency drop, cinematic"),
  "impact_dramatique": (3, "dramatic cinematic impact hit, deep and powerful, short tail"),
  "riser": (5, "dark cinematic riser, tension building up, ends abruptly"),
  "reverse_swell": (3, "reverse swell, reversed cymbal and low boom sucking in, cinematic"),
  "stinger": (3, "dark cinematic stinger, low brass hit with dissonant strings, horror trailer, not cartoon"),
  "drop": (4, "cinematic bass drop, deep falling sub bass, trailer"),
  "pulse": (8, "tension pulse, low rhythmic synth heartbeat-like pulse, dark cinematic, seamless loop"),
  "coeur": (6, "slow heartbeat, deep and muffled, cinematic"),
  # humains
  "bottes": (6, "heavy military boots footsteps marching on concrete, two guards walking"),
  "pas_metal": (4, "footsteps on a metal floor grating, slow and heavy"),
  "respiration": (4, "nervous heavy breathing of a young man, close, frightened"),
  "vetements": (2, "clothing movement, jacket rustle, close"),
  "chaise": (2, "wooden chair moving on a floor, creak"),
  "foule": (8, "distant crowd murmuring nervously in a large open space, indistinct voices"),
  # alertes
  "alarme": (8, "slow emergency warning alarm, long wailing tone rising and falling slowly, distant, sci-fi, not police siren"),
  "radio": (5, "radio static and crackle, old transmission noise"),
  "transmission": (4, "distorted radio transmission, garbled signal, interference"),
  "annonce": (3, "emergency broadcast attention tone, two-tone chime before an announcement"),
  "surveillance": (2, "surveillance system beep, soft electronic ping"),
  # transitions
  "whoosh": (2, "cinematic whoosh, deep fast air pass, transition"),
  "whoosh_inverse": (2, "reverse whoosh, cinematic suck-in transition"),
  "hit_transition": (2, "deep transition hit, low thud with short metallic ring"),
  "impact_metal": (3, "heavy metallic impact, deep clang with reverb, cinematic"),
  "balayage": (3, "dark cinematic sweep, low airy swoosh with rumble"),
  # musiques (textures)
  "piano": (20, "slow melancholic emotional piano, sparse notes, minor key, cinematic, soft, reverb"),
  "cordes_tension": (18, "dramatic orchestral strings, dark tension, slow tremolo, building, cinematic"),
  "cordes_fin": (15, "dark orchestral strings crescendo, rising tension then sustained, cinematic trailer"),
  "scifi_musique": (18, "dark sci-fi soundtrack, slow synth pads, deep bass, post-apocalyptic, cinematic, no drums"),
  "oiseau": (2, "a single small bird softly whistling a short sweet song, gentle, natural"),
}
sel = sys.argv[1:] or list(B)
for k in sel:
    f = os.path.join(OUT, k + ".mp3")
    if os.path.exists(f) and os.path.getsize(f) > 1000: continue
    d, txt = B[k]
    body = json.dumps({"text": txt, "duration_seconds": d, "prompt_influence": 0.55})
    r = subprocess.run(["curl", "-s", "-o", f, "-w", "%{http_code}", "-X", "POST", "https://api.elevenlabs.io/v1/sound-generation",
                        "-H", "Content-Type: application/json", "-H", "xi-api-key: proxy", "-d", body, "--max-time", "300"], capture_output=True, text=True)
    print(k, r.stdout, os.path.getsize(f) if os.path.exists(f) else 0, flush=True)
    if r.stdout != "200": os.remove(f); print(open(f).read() if os.path.exists(f) else ""); break
