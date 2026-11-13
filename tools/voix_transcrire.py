# Transcription mot à mot d'une prise de voix (faster-whisper, local) -> JSON [{w,s,e,p}]
import sys, json, subprocess, numpy as np
from faster_whisper import WhisperModel
m = WhisperModel(sys.argv[3] if len(sys.argv) > 3 else "medium", device="cpu", compute_type="int8")
audio = np.frombuffer(subprocess.run(["ffmpeg", "-v", "quiet", "-i", sys.argv[1], "-ac", "1", "-ar", "16000", "-f", "f32le", "-"], capture_output=True).stdout, np.float32)
segs, _ = m.transcribe(audio, language="fr", word_timestamps=True, vad_filter=False, condition_on_previous_text=False,
                       initial_prompt="Imagine… Tu vis dans la dernière tour encore habitée. Erreur.")
out = []
for s in segs:
    for w in s.words: out.append({"w": w.word.strip(), "s": round(w.start, 3), "e": round(w.end, 3), "p": round(w.probability, 2)})
json.dump(out, open(sys.argv[2], "w"), ensure_ascii=False, indent=0)
print(" ".join(f"[{o['s']:.1f}]{o['w']}" for o in out))
