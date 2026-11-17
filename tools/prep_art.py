"""Codex の絵を、ゲームで使う形にする（緑を抜く・切る・小さくする・webp にする）。
使い方：
  python3 tools/prep_art.py one  <もとの PNG> <名前> <高さ or 幅の上限>      … 1枚の絵（立ち絵など）
  python3 tools/prep_art.py three <もとの PNG> <名前1> <名前2> <名前3> <上限> … 横に3つ並んだ絵（カード）
  python3 tools/prep_art.py two <もとの PNG> <名前1> <名前2> <上限>           … 横に2つ並んだ絵（モンスター）
できた絵は assets/art/<名前>.webp。もとの PNG は assets/art/raw/ に残しておく（docs/ART.md に書く）
"""
import sys
from PIL import Image

OUT = 'assets/art/'


def key_green(im):
    """背景の緑 #00FF00 を透明にし、ふちに残る緑みを消す"""
    im = im.convert('RGBA')
    px = im.load()
    w, h = im.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            m = max(r, b)
            if g > 140 and g - m > 60:
                px[x, y] = (0, 0, 0, 0)
            elif g > m + 10:
                # ふちの緑みをおさえて、半分すきとおらせる
                k = min(1.0, (g - m) / 80)
                px[x, y] = (r, m, b, int(a * (1 - 0.6 * k)))
    return im


def trim_fit(im, limit, pad=6):
    bb = im.getbbox()
    if bb:
        im = im.crop((max(0, bb[0] - pad), max(0, bb[1] - pad), min(im.width, bb[2] + pad), min(im.height, bb[3] + pad)))
    s = min(1.0, limit / max(im.width, im.height))
    if s < 1:
        im = im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)
    return im


def save(im, name):
    im.save(OUT + name + '.webp', 'WEBP', quality=86, method=6)
    print(name, im.size)


if __name__ == '__main__':
    mode = sys.argv[1]
    src = Image.open(sys.argv[2])
    if mode == 'one':
        save(trim_fit(key_green(src), int(sys.argv[4])), sys.argv[3])
    elif mode in ('two', 'three'):
        n = 2 if mode == 'two' else 3
        names, limit = sys.argv[3:3 + n], int(sys.argv[3 + n])
        w3 = src.width // n
        for i, n in enumerate(names):
            if n == '-':
                continue
            part = src.crop((i * w3, 0, (i + 1) * w3, src.height))
            save(trim_fit(key_green(part), limit), n)
