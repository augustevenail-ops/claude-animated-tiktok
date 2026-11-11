# python scripts/imgdiff.py ref.png new.png -> moyenne |diff| (0-255), % pixels > 8, max
import sys
import numpy as np
from PIL import Image
a = np.asarray(Image.open(sys.argv[1]).convert("RGB")).astype(int); b = np.asarray(Image.open(sys.argv[2]).convert("RGB")).astype(int)
d = np.abs(a - b).max(-1)
print(f"{sys.argv[2].split('/')[-1]}: moy {d.mean():.2f}  >8: {(d > 8).mean() * 100:.2f} %  max {d.max()}")
