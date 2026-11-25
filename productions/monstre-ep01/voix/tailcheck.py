import subprocess, numpy as np, sys, pathlib
SR = 48000
def tail_db(p):
    a = np.frombuffer(subprocess.run(["ffmpeg", "-v", "quiet", "-i", str(p), "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True).stdout, np.float32)
    n = int(0.02 * SR); return max(20 * np.log10(np.sqrt((a[-n * (k + 1): len(a) - n * k] ** 2).mean()) + 1e-9) for k in range(3))
if __name__ == "__main__":
    for f in sorted(pathlib.Path("phrases").glob("*.wav")): print(f.name, round(tail_db(f), 1))
