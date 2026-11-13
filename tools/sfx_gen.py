# Bibliothèque de bruitages de la série « L'appel » générés par l'API d'effets sonores ElevenLabs (clé injectée par le proxy).
# Chaque son est mis en cache dans productions/sfx_lib/<nom>.mp3 (pas de nouvelle génération s'il existe déjà).
# Usage : python tools/sfx_gen.py
import json, os, urllib.request
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "productions", "sfx_lib"); os.makedirs(OUT, exist_ok=True)
LIB = {
    "gasp_boy": ("young boy short frightened gasp, quick sharp intake of breath, close, dry", 1.0),
    "gasp_teen": ("teenage boy waking up startled, short sharp gasp, close", 1.0),
    "knock3": ("three slow heavy knocks on a wooden apartment door, night, close, dry room", 2.0),
    "handle_turn": ("metal door handle turning very slowly, creaking latch, close", 2.0),
    "door_slam_body": ("person throwing body against a closed wooden door, heavy thud and rattle", 1.0),
    "door_push": ("wooden door being forced and pushed from the other side, frame creaking and straining, rattling", 2.5),
    "door_open_creak": ("old apartment door opening slowly, long creak", 2.5),
    "door_slam_far": ("door slamming shut far away down a concrete hallway, reverb", 1.5),
    "door_slam_close": ("heavy door slamming shut close by, strong impact", 1.0),
    "steel_door": ("heavy steel door slowly opening, deep metal groan", 3.0),
    "pa_static": ("old public address loudspeaker static crackle burst", 1.5),
    "pa_click": ("loudspeaker switching on, click and short hum", 1.0),
    "pa_chime": ("old public address announcement chime, two notes, slightly distorted", 1.5),
    "buzzer": ("short low electric alarm buzzer", 1.0),
    "beep_ok": ("short soft electronic confirmation beep", 0.5),
    "light_on": ("electrical relay click of a light turning on, faint hum", 0.5),
    "lights_cascade": ("many windows lights switching on one after another far away, series of clicks", 4.0),
    "neon_flicker": ("fluorescent tube flickering and buzzing", 3.0),
    "steps_stairs": ("two people walking down concrete stairs, echoing stairwell", 4.0),
    "boots_approach": ("heavy boots slowly walking on concrete, getting closer, echo", 5.0),
    "sting_soft": ("short soft eerie horror sting, low strings swell", 2.0),
    "sting_hit": ("horror jump scare hit, deep and short, not too loud", 1.5),
    "boom_low": ("deep cinematic low boom, soft", 2.5),
    "wind_city": ("cold wind over an empty dead city at night, distant", 6.0),
    "hall_ambience": ("huge underground concrete hall ambience, low hum, distant water drips", 6.0),
    "heartbeat": ("slow heartbeat, low and muffled", 4.0),
    "finger_skin": ("finger slowly tracing on the palm of a hand, soft skin rubbing", 2.5),
    "vent_air": ("night air blowing through a metal vent grate, soft whistle", 4.0),
    "crowd_breath": ("hundreds of people standing silently, soft breathing, shuffling, huge hall", 5.0),
    "whisper_voice": ("faint muffled whisper behind a door", 2.0),
    "bed_creak": ("old metal bed creaking as someone sits up quickly", 1.5),
    "cloth_rustle": ("clothes rustling, quick nervous movement, close", 1.0),
    "breath_nervous": ("nervous shaky breathing of a teenager, close, quiet", 3.0),
    "run_steps_room": ("child running three quick steps on a linoleum floor", 1.2),
    "struggle": ("child struggling in someone's arms, cloth rustle and small thuds", 1.5),
    "curtain": ("thin curtain moving softly in a draft", 2.0),
    "glass_rattle": ("window glass rattling softly from a distant vibration", 1.5),
    "metal_creak_far": ("distant metal structure creaking in the wind, empty city", 3.0),
    "siren_far": ("very distant faint air raid siren, empty city at night", 5.0),
    "drip": ("single water drip echoing in a concrete room", 1.0),
    "elec_hum": ("electrical transformer hum, steady", 4.0),
    "pa_feedback": ("old loudspeaker short feedback whine", 1.2),
    "lock_click": ("door lock bolt clicking", 0.6),
    "tower_groan": ("huge concrete building groaning, deep structural creak", 3.0),
    "mask_breath": ("slow breathing through a gas mask respirator, close", 3.0),
    "suit_rustle": ("plastic hazmat suit rustling while walking", 2.0),
    "light_off": ("light switching off, single click", 0.5),
    "door_close_soft": ("apartment door closing softly with latch click", 1.2),
    "footstep_one": ("single heavy footstep on concrete, close", 0.6),
    "mic_tap": ("microphone tap and a breath through speaker", 1.0),
    "crowd_shuffle": ("large silent crowd shuffling feet softly on concrete", 4.0),
    "heart_fast": ("fast heartbeat, muffled, close", 3.0),
}
for name, (txt, d) in LIB.items():
    p = os.path.join(OUT, name + ".mp3")
    if os.path.exists(p): continue
    req = urllib.request.Request("https://api.elevenlabs.io/v1/sound-generation", data=json.dumps({"text": txt, "duration_seconds": d, "prompt_influence": 0.55}).encode(),
                                 headers={"Content-Type": "application/json", "xi-api-key": os.environ.get("XI_API_KEY", "proxy-injected")})
    open(p, "wb").write(urllib.request.urlopen(req, timeout=180).read()); print("ok", name)
print(len(os.listdir(OUT)), "sons")
