# Recolle les images rendues par scripts/patch_puits.sh dans le rendu complet 2K de Le Puits (sans toucher à l'original).
# Entrées : out/puits4k/puits_2k_muet.mp4, out/puits_patch/frames.json + p_XXXX.mp4 ; sortie : out/puits4k/puits_2k_muet_v2.mp4
import glob, json, os, subprocess, sys
os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
W, H = 1440, 2560; FS = W * H * 3 // 2   # yuv420p
frames = json.load(open("out/puits_patch/frames.json")); parts = sorted(glob.glob("out/puits_patch/p_*.mp4"))
C = int(sys.argv[1]) if len(sys.argv) > 1 else 57
assert len(parts) == (len(frames) + C - 1) // C, f"{len(parts)} morceaux trouvés"
rd = lambda p: subprocess.Popen(["ffmpeg", "-v", "error", "-i", p, "-f", "rawvideo", "-pix_fmt", "yuv420p", "-"], stdout=subprocess.PIPE)
src = rd("out/puits4k/puits_2k_muet.mp4")
enc = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "yuv420p", "-s", f"{W}x{H}", "-r", "30", "-i", "-",
                        "-c:v", "libx264", "-preset", "medium", "-crf", "14", "-pix_fmt", "yuv420p", "out/puits4k/puits_2k_muet_v2.mp4"], stdin=subprocess.PIPE)
want = {f: i for i, f in enumerate(frames)}; pi = 0; pp = None; got = 0; n = 0
while True:
    b = src.stdout.read(FS)
    if len(b) < FS: break
    if n in want:
        k = want[n]
        if pp is None or k // C != pi: pi = k // C; pp = rd(parts[pi])
        b = pp.stdout.read(FS); assert len(b) == FS, f"image {n} manquante"; got += 1
    enc.stdin.write(b); n += 1
enc.stdin.close(); enc.wait(); print(f"{n} images, {got} remplacées sur {len(frames)}")
