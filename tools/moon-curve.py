#!/usr/bin/env python3
# Home's moons (Nov 24, Judy chose "C"): curve a room photo onto a little sphere for Home/Play/pillar moons.
# Run in the site folder:  python3 tools/moon-curve.py pw/learn-reading-sm.jpg puzzles-orrery-sm.jpg ...
# Writes hm/<path with "/" as "-"> (240x240 JPEG, ~20 KB). The page's moonBg() finds it by that name;
# if it's missing the flat photo shows instead. Bump moonBg's ?v= when you remake one.
import sys, os
import numpy as np
from PIL import Image

N, SS = 240, 3
for f in sys.argv[1:]:
    im = np.asarray(Image.open(f).convert("RGB")).astype(np.float32); H, W, _ = im.shape
    side = min(W / 1.25, H); cx = W * .5; cy = min(max(H * .68, side / 2), H - side / 2)   # Home's crop: centre, 68% down, a little wider
    if W / H < 1.15: side = min(W, H) * .9; cy = min(max(H * .5, side / 2), H - side / 2)  # square cards: centre crop
    M = N * SS
    y, x = np.mgrid[0:M, 0:M]; u = (x + .5) / M * 2 - 1; v = (y + .5) / M * 2 - 1
    r = np.sqrt(u * u + v * v); k = np.minimum(1, .999 / np.maximum(r, 1e-6)); u = u * k; v = v * k
    z = np.sqrt(np.clip(1 - u * u - v * v, 0, 1)); lon = np.arctan2(u, z); lat = np.arcsin(np.clip(v, -1, 1))
    sx = np.clip(cx + lon / (np.pi / 2) * side / 2, 0, W - 1); sy = np.clip(cy + lat / (np.pi / 2) * side / 2, 0, H - 1)
    x0 = np.floor(sx).astype(int); y0 = np.floor(sy).astype(int); x1 = np.minimum(x0 + 1, W - 1); y1 = np.minimum(y0 + 1, H - 1)
    fx = (sx - x0)[..., None]; fy = (sy - y0)[..., None]
    out = im[y0, x0] * (1 - fx) * (1 - fy) + im[y0, x1] * fx * (1 - fy) + im[y1, x0] * (1 - fx) * fy + im[y1, x1] * fx * fy
    os.makedirs("hm", exist_ok=True)
    dest = "hm/" + f.replace("/", "-")
    Image.fromarray(np.clip(out, 0, 255).astype(np.uint8)).resize((N, N), Image.LANCZOS).save(dest, quality=84)
    print(dest, os.path.getsize(dest))
