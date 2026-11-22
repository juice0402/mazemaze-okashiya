"""光る演出の絵（黒い背景）を、マスに切って 明るさで すけにする（11/22・前は手で同じことをしていた：fx-burst・fx-numhit など）
使い方：python3 -I tools/glow_art.py <PNG> <列>x<行> <上限px> <名前…>（上の段から左→右。名前を - にしたマスは取らない）
- アルファ＝いちばん明るい色の明るさ（黒＝すける・白＝そのまま）。色はアルファで割りもどす（#fxl の中では screen が効かないため）
- マスの中の かたまりの外わくで切って、上限px（長いほうの辺）に。assets/art/<名前>.webp（quality 86・アルファ 90）
"""
import sys, numpy as np
from PIL import Image
src, grid, lim, names = sys.argv[1], sys.argv[2], int(sys.argv[3]), sys.argv[4:]
gc, gr = (int(v) for v in grid.split('x'))
im = np.asarray(Image.open(src).convert('RGB')).astype(np.float32) / 255
H, W = im.shape[:2]
for k, n in enumerate(names):
    if n == '-': continue
    r, c = divmod(k, gc)
    cell = im[H * r // gr:H * (r + 1) // gr, W * c // gc:W * (c + 1) // gc]
    a = cell.max(axis=2); a = np.clip((a - .04) / .96, 0, 1)   # ほんの少しの黒いノイズは すける
    rgb = np.where(a[..., None] > 0, np.clip(cell / np.maximum(a[..., None], 1e-3), 0, 1), 0)
    out = Image.fromarray((np.dstack([rgb, a]) * 255).astype(np.uint8), 'RGBA')
    bb = Image.fromarray((a > .03).astype(np.uint8) * 255).getbbox()
    if bb: out = out.crop((max(0, bb[0] - 4), max(0, bb[1] - 4), min(out.width, bb[2] + 4), min(out.height, bb[3] + 4)))
    sc = min(1, lim / max(out.size)); out = out.resize((round(out.width * sc), round(out.height * sc)), Image.LANCZOS)
    out.save(f'assets/art/{n}.webp', quality=86, alpha_quality=90, method=6); print(n, out.size)
