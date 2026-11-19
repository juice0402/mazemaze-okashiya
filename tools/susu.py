"""すすなしのほのか（-clean）を、もとの大きさの立ち絵から作りなおす（11/19 H-032 のあと・昼のチャット）
前の760の絵（すすあり・すすなし）のちがい＝すすの場所 → 2倍にして、新しい絵のその場所の灰色を見つけ、
まわりの肌の色でうめる（cv2.inpaint）。強さは slim_art の big_chara と同じ q88・アルファ85"""
import sys, numpy as np, cv2
from PIL import Image
# 使い方：python3 -I tools/susu.py <前の760の絵のフォルダ> assets/art assets/art
#   前の760の絵（すすあり <表情>.webp・すすなし <表情>-clean.webp）は git のコミット 14150e4 から：
#   for e in yaruki joy fuan kangaeru wakuwaku kandou; do git show 14150e4:assets/art/honoka-$e.webp > old/$e.webp; git show 14150e4:assets/art/honoka-$e-clean.webp > old/$e-clean.webp; done
#   できたら assets/slim.json の6行（honoka-<表情>-clean）を新しいバイト数に
old, art, out = sys.argv[1:4]
for e in 'yaruki joy fuan kangaeru wakuwaku kandou'.split():
    a = np.asarray(Image.open(f'{old}/{e}.webp').convert('RGBA')).astype(int)
    b = np.asarray(Image.open(f'{old}/{e}-clean.webp').convert('RGBA')).astype(int)
    n = Image.open(f'{art}/honoka-{e}.webp').convert('RGBA'); N = np.asarray(n).copy()
    s = n.size[0] / a.shape[1]
    diff = np.abs(a - b)[..., :3].sum(-1)
    ys, xs = np.nonzero((diff > 60) & (a[..., 3] > 200))   # すすの場所（ほっぺ）だけ
    d = np.zeros(diff.shape, bool); d[ys.min():ys.max() + 1, xs.min():xs.max() + 1] = (diff > 40)[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
    x0, y0, x1, y1 = [int(v * s) for v in (xs.min(), ys.min(), xs.max() + 1, ys.max() + 1)]
    pad = int(40 * s)   # まわりの肌を見る広さ
    X0, Y0, X1, Y1 = max(0, x0 - pad), max(0, y0 - pad), min(n.size[0], x1 + pad), min(n.size[1], y1 + pad)
    # 前のすすの形を2倍にして少し太らせる
    m0 = cv2.resize(d.astype(np.uint8) * 255, (n.size[0], n.size[1]), interpolation=cv2.INTER_NEAREST)
    m0 = cv2.dilate(m0, np.ones((5, 5), np.uint8))
    # 新しい絵の中の灰色（肌より色みがうすい・暗い）を、すすの近くだけで見つける（髪の赤は色みが強いので入らない）
    lab = cv2.cvtColor(N[..., :3], cv2.COLOR_RGB2LAB).astype(float)
    L, A, B = lab[..., 0], lab[..., 1] - 128, lab[..., 2] - 128; C = np.hypot(A, B)
    win = np.zeros(m0.shape, bool); win[Y0:Y1, X0:X1] = True
    near = (cv2.dilate(m0, np.ones((31, 31), np.uint8)) > 0) & win
    ring = win & ~(cv2.dilate(m0, np.ones((41, 41), np.uint8)) > 0) & (N[..., 3] > 250)
    skin = ring & (C < np.percentile(C[ring], 70)) & (L > np.percentile(L[ring], 30))
    Ls, Cs = np.median(L[skin]), np.median(C[skin])
    gray = near & (N[..., 3] > 200) & (C < Cs * 1.08) & ((L < Ls - 5) | (C < Cs * 0.80))
    m = (((m0 > 0) | gray) & win).astype(np.uint8) * 255
    m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, np.ones((7, 7), np.uint8))
    m = cv2.dilate(m, np.ones((5, 5), np.uint8)); m[~win] = 0
    # まわりの肌だけの平均でうめる（肌に近い色の所だけ重みをつけてぼかす＝ほっぺの赤みのグラデーションは残る）
    H = np.degrees(np.arctan2(B, A)); Hs = np.median(H[skin])
    okw = win & (m == 0) & (N[..., 3] > 250) & (np.abs(L - Ls) < 14) & (C > Cs * 0.82) & (C < Cs * 1.5) & (np.abs(H - Hs) < 12)
    w = okw.astype(np.float32)
    f = N[..., :3].astype(np.float32)
    sig = 9 * s / 2
    num = cv2.GaussianBlur(f * w[..., None], (0, 0), sig); den = cv2.GaussianBlur(w, (0, 0), sig)[..., None]
    num2 = cv2.GaussianBlur(f * w[..., None], (0, 0), sig * 2.5); den2 = cv2.GaussianBlur(w, (0, 0), sig * 2.5)[..., None]
    fill = np.where(den > 0.05, num / np.maximum(den, 1e-6), num2 / np.maximum(den2, 1e-6))
    # ふちをなじませる
    soft = cv2.GaussianBlur(m.astype(np.float32) / 255, (0, 0), 2.2)[..., None]
    N[..., :3] = (fill * soft + N[..., :3] * (1 - soft)).round().astype(np.uint8)
    Image.fromarray(N, 'RGBA').save(f'{out}/honoka-{e}-clean.webp', 'WEBP', quality=88, alpha_quality=85, method=6)
    print(e, n.size, 'すす', int((m > 0).sum()), 'px')
