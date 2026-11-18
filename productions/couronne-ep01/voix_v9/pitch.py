import subprocess, numpy as np
SR = 44100
def load(f): return np.frombuffer(subprocess.run(["ffmpeg","-v","quiet","-i",f,"-ac","1","-ar",str(SR),"-f","f32le","-"],capture_output=True).stdout,np.float32).copy()
def db(a): return 20*np.log10(np.sqrt(np.mean(a**2))+1e-9)
def track(a, fmin=75, fmax=210, thr_db=-40, peak=0.5):
    fr, hop = int(0.04*SR), int(0.01*SR); lag = np.arange(int(SR/fmax), int(SR/fmin)); out = []
    for i in range(0, len(a)-fr, hop):
        x = a[i:i+fr] - np.mean(a[i:i+fr])
        if db(x) < thr_db: out.append((i/SR, 0)); continue
        ac = np.correlate(x, x, "full")[fr-1:]; ac /= (ac[0]+1e-9); p = lag[np.argmax(ac[lag])]
        out.append((i/SR, SR/p if ac[p] > peak else 0))
    return out
def speech_end(a):
    h = int(0.01*SR); e = [db(a[i:i+h]) for i in range(0, len(a)-h, h)]; return (max(i for i, v in enumerate(e) if v > -40)+1)/100
def rise(f, last=0.22, ref=(0.9, 0.35)):
    a = load(f); te = speech_end(a); tr = track(a)
    vf = [(t, f0) for t, f0 in tr if f0 and te-last-0.04 <= t <= te-0.04]
    vr = [f0 for t, f0 in tr if f0 and te-ref[0] <= t <= te-ref[1]]
    if len(vf) < 3 or len(vr) < 5: return None
    return round(12*np.log2(np.median([f for _, f in vf])/np.median(vr)), 1), round(float(np.median([f for _, f in vf]))), round(float(np.median(vr)))
if __name__ == "__main__":
    import glob, sys
    for f in sys.argv[1:]: print(f, rise(f))
