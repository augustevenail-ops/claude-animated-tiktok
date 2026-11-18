#!/usr/bin/env python3
"""v9 = v7 (validée) avec : phrase « Le champ magnétique… districts » et radio remplacées par des prises sans creux
(plus aucune coupure dans ces phrases), dilemme plus interrogatif (prise dil_02), silence père -> « Tu demandes » ramené à 0,45 s.
  python3 build_v9.py"""
import json, subprocess
import numpy as np
SR = 44100
V = "../voix/"
def load(f): return np.frombuffer(subprocess.run(["ffmpeg","-v","quiet","-i",f,"-ac","1","-ar",str(SR),"-f","f32le","-"],capture_output=True).stdout,np.float32).copy()
def db(a): return 20*np.log10(np.sqrt(np.mean(a**2))+1e-9)
def sil(s): return np.zeros(int(s*SR),np.float32)
def ramp(n,up): return np.linspace(0,1,n,dtype=np.float32) if up else np.linspace(1,0,n,dtype=np.float32)
def ins(a,t,dur,f=0.02):
    i=int(t*SR); n=int(f*SR); L,R=a[:i].copy(),a[i:].copy(); L[-n:]*=ramp(n,0); R[:n]*=ramp(n,1)
    return np.concatenate([L,sil(dur),R])
def xcut(a,t0,t1,cf=0.025):
    i0,i1,n=int(t0*SR),int(t1*SR),int(cf*SR); w=np.linspace(0,np.pi/2,n,dtype=np.float32)
    return np.concatenate([a[:i0-n], a[i0-n:i0]*np.cos(w)+a[i1:i1+n]*np.sin(w), a[i1+n:]])
def runs_below(a,t0,t1,thr,hop=0.01,win=0.02):
    h,w=int(hop*SR),int(win*SR); out,s=[],None
    for i in range(int(t0*SR),int(min(t1,len(a)/SR)*SR),h):
        low=db(a[i:i+w])<thr
        if low and s is None: s=i
        if not low and s is not None: out.append((s/SR,i/SR)); s=None
    if s is not None: out.append((s/SR,min(t1,len(a)/SR)))
    return out
def trim(a,lead=0.04,tail=0.06,thr=-42):
    h=int(0.01*SR); e=[db(a[i:i+h]) for i in range(0,len(a)-h,h)]; act=[i for i,v in enumerate(e) if v>thr]
    s0=max(act[0]*h-int(lead*SR),0); s1=min((act[-1]+1)*h+int(tail*SR),len(a)); a=a[s0:s1].copy(); n=int(0.01*SR)
    a[:n]*=ramp(n,1); a[-n:]*=ramp(n,0); return a
# --- morceaux de la v7 (inchangés) ---
p1=load(V+"narrateur_part1_v4.mp3"); A=trim(p1[:int(6.60*SR)]); C=trim(p1[int(14.50*SR):])
p2=load(V+"narrateur_part2_v2.mp3"); i=int(13.98*SR); p2a,p2b=p2[:i],p2[i:]
p2a=trim(ins(p2a,5.60,0.35)); p2b=trim(p2b)
pere=trim(load(V+"pere_narrateur_v3.mp3"))
p3a=trim(ins(load(V+"narrateur_part3a_v4.mp3"),4.60,0.35))
tail=trim(load(V+"narrateur_part3b_v4.mp3")[int(5.38*SR):])
# --- prises corrigées ---
s04=trim(load("takes/s04_02.mp3")); radio=trim(load("takes/radio_08.mp3"))
d=load("takes/dil_02.mp3"); rs=[r for r in runs_below(d,3.5,4.9,-42) if r[1]-r[0]>0.3]      # pause à la virgule : 0,47 s -> 0,18 s
(r0,r1)=max(rs,key=lambda r:r[1]-r[0]); keep=0.18/2; d=xcut(d,r0+keep,r1-keep); dil=trim(d)
order=[("A",A,.23),("s04",s04,.38),("C",C,.46),("p2a",p2a,.42),("pere",pere,.45),("p2b",p2b,.60),("p3a",p3a,.56),("radio",radio,.61),("dil",dil,.66),("tail",tail,None)]   # silences réels calés sur ceux de la v7 (sauf père -> « Tu demandes » : 0,45 s)
parts,tl,t=[],[],0.0
for name,a,gap in order:
    tl.append({"id":name,"start":round(t,3),"end":round(t+len(a)/SR,3)}); parts.append(a); t+=len(a)/SR
    if gap is not None: g=max(gap-0.10,0.0); parts.append(sil(g)); t+=g       # 0,10 s = marges de rognage (0,04 + 0,06)
full=np.clip(np.nan_to_num(np.concatenate(parts)),-0.98,0.98).astype(np.float32)
subprocess.run(["ffmpeg","-v","error","-y","-f","f32le","-ar",str(SR),"-ac","1","-i","-","-codec:a","libmp3lame","-b:a","192k","voix_complete_v9.mp3"],input=full.tobytes(),check=True)
json.dump({"duree":round(len(full)/SR,2),"blocs":tl},open("timeline_v9.json","w"),indent=1)
print("durée",round(len(full)/SR,2),"pic",round(float(np.abs(full).max()),3)); [print(x) for x in tl]
