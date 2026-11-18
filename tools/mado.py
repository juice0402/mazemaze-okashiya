# 昼の舞台の窓の外の型（bg-day-mado）と、にじむ光の型（bg-day-mado-glow）を bg-day から作る（ぽぽち・11/18）
import sys, os
from PIL import Image, ImageFilter
import numpy as np
from scipy import ndimage
src, out = sys.argv[1], sys.argv[2]
im = Image.open(src).convert('RGB'); a = np.asarray(im).astype(int); r, g, b = a[..., 0], a[..., 1], a[..., 2]
H, W = r.shape; m = np.zeros((H, W), bool)
WR = [(78, 125), (131, 177), (184, 236)]
# ガラスの四角（桟の位置は、列・行ごとの木の色の多さから求めた）・鉢植えのある所
panes = [([(230, 295), (300, 359)], WR, 'L', (230, 305)), ([(426, 476), (482, 532)], [(94, 145), (152, 212)], '', None), ([(600, 659), (666, 734)], WR, 'R', (675, 734))]
cream = (r > 200) & (g > 182) & (b > 150) & ((r - b) < 80)
wood = (r - b > 62) & (g < 168) & (r > 140)
mx, mn = np.maximum(np.maximum(r, g), b), np.minimum(np.minimum(r, g), b)
flower = ((mn > 205) & ((mx - mn) < 45)) | ((r > 200) & (b > 140) & (g < 185))
for cols, rows, side, pot in panes:
    wm = np.zeros((H, W), bool)
    for c0, c1 in cols:
        for r0, r1 in rows: wm[r0:r1 + 1, c0:c1 + 1] = True
    x0 = min(c for c, _ in cols); x1 = max(c for _, c in cols)
    if side:   # カーテン：外がわのふちにつながるクリーム色
        sub = cream[60:240, x0:x1 + 1]; lab, k = ndimage.label(sub); col = 0 if side == 'L' else -1
        ids = list(set(np.unique(lab[:, col])) - {0}); cur = np.zeros((H, W), bool)
        cur[60:240, x0:x1 + 1] = ndimage.binary_dilation(np.isin(lab, ids), iterations=2); wm &= ~cur
    if pot:    # 鉢植え：白・ピンクの花と鉢
        low = np.zeros((H, W), bool); low[196:238, pot[0]:pot[1] + 1] = True
        wm &= ~(low & (ndimage.binary_dilation(flower, iterations=1) | wood))
    m |= wm
mi = Image.fromarray((m * 255).astype('uint8'))
rgba = Image.new('RGBA', im.size, (255, 255, 255, 0)); rgba.putalpha(mi.filter(ImageFilter.GaussianBlur(0.5)))
rgba.save(os.path.join(out, 'bg-day-mado.webp'), lossless=True, method=6)
glow = mi.filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.GaussianBlur(9)); ga = np.clip(np.asarray(glow).astype(float) * 1.6, 0, 255)
# ガラスの上はほとんど光らせない（窓のまわりの木にだけにじむ）＝ガラスは夕焼けの色のまま
ga = (ga * (1 - 0.85 * np.asarray(mi.filter(ImageFilter.GaussianBlur(1.5))).astype(float) / 255)).astype('uint8')
rg = Image.new('RGBA', im.size, (255, 255, 255, 0)); rg.putalpha(Image.fromarray(ga)); rg.save(os.path.join(out, 'bg-day-mado-glow.webp'), quality=70, method=6)
