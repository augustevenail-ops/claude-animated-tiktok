# Mélodie de fin de phrase (autocorrélation) : pente positive = intonation interrogative. Usage : python3 tools/f0_fin.py a.wav b.wav ...
import sys, subprocess, numpy as np
def f0_track(path, sr=16000):
    x = np.frombuffer(subprocess.run(["ffmpeg","-v","quiet","-i",path,"-ac","1","-ar",str(sr),"-f","f32le","-"],capture_output=True).stdout,np.float32)
    n=int(0.04*sr); h=int(0.01*sr); out=[]
    for i in range(0,len(x)-n,h):
        f=x[i:i+n]*np.hanning(n)
        if np.sqrt(np.mean(f**2))<0.01: out.append(np.nan); continue
        ac=np.correlate(f,f,"full")[n-1:]; lo,hi=int(sr/300),int(sr/60)
        k=lo+np.argmax(ac[lo:hi]); out.append(sr/k if ac[k]>0.3*ac[0] else np.nan)
    return np.array(out)
for p in sys.argv[1:]:
    f=f0_track(p); v=np.flatnonzero(~np.isnan(f)); last=f[v[-25:]]; mid=f[v[-80:-30]]
    print(p.split('/')[-1], "F0 milieu %.0f Hz, fin %.0f Hz, pente fin %.0f Hz" % (np.nanmedian(mid), np.nanmedian(last[-10:]), np.nanmedian(last[-10:])-np.nanmedian(last[:10])))
