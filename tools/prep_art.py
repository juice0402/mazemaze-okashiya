"""Codex の絵を、ゲームで使う形にする（緑を抜く・切る・小さくする・webp にする）。
使い方：
  python3 tools/prep_art.py one  <もとの PNG> <名前> <高さ or 幅の上限>      … 1枚の絵（立ち絵など）
  python3 tools/prep_art.py three <もとの PNG> <名前1> <名前2> <名前3> <上限> … 横に3つ並んだ絵（カード）
  python3 tools/prep_art.py two <もとの PNG> <名前1> <名前2> <上限>           … 横に2つ並んだ絵（モンスター）
  python3 tools/prep_art.py box <もとの PNG> <名前> <上限> <x0,y0,x1,y1>      … 決まった四角で切る（立ち絵のポーズちがいを、元の絵と同じ大きさ・位置に。ほのかは 162,4,830,1528・上限760）
  python3 tools/prep_art.py bg <もとの PNG> <名前>                             … 背景（緑は抜かない・16:9に切って横960）
  python3 tools/prep_art.py parts <もとの PNG> <幅の上限> <名前1> <名前2> …   … UI のシート（緑で区切られた部品を、上の段から左→右の順に1つずつ。'-' は飛ばす）
できた絵は assets/art/<名前>.webp。もとの PNG はリポジトリに入れない（作業場所の /tmp などに置いて使う。出どころは docs/ART.md に書く）。
11/18 までのもとの PNG は枝 art-raw にある（取り出し方は docs/ART.md の「取りこみ方」）
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
    if mode == 'box':
        x0, y0, x1, y1 = map(int, sys.argv[5].split(','))
        im = key_green(src).crop((x0, y0, x1, y1))
        lim = int(sys.argv[4]); sc = lim / max(im.size)
        save(im.resize((round(im.width * sc), round(im.height * sc)), Image.LANCZOS), sys.argv[3])
    elif mode == 'bg':
        im = src.convert('RGB'); w, h = im.size; th = round(w * 9 / 16)
        if th < h: im = im.crop((0, (h - th) // 2, w, (h - th) // 2 + th))
        else: tw = round(h * 16 / 9); im = im.crop(((w - tw) // 2, 0, (w - tw) // 2 + tw, h))
        save(im.resize((960, 540), Image.LANCZOS), sys.argv[3])
    elif mode == 'parts':
        im = key_green(src); lim = int(sys.argv[3]); names = sys.argv[4:]
        a = im.getchannel('A'); w, h = im.size; ap = a.load()

        def runs(flags, gap=6, small=12):
            out, s, e = [], None, -99
            for i, f in enumerate(flags):
                if f:
                    if s is None or i - e > gap: s is not None and out.append((s, e)); s = i
                    e = i
            if s is not None: out.append((s, e))
            return [r for r in out if r[1] - r[0] >= small]

        boxes = []
        for y0, y1 in runs([any(ap[x, y] > 40 for x in range(0, w, 2)) for y in range(h)]):
            for x0, x1 in runs([any(ap[x, y] > 40 for y in range(y0, y1 + 1, 2)) for x in range(w)]):
                boxes.append((x0, y0, x1 + 1, y1 + 1))
        print(len(boxes), 'parts')
        for b, n in zip(boxes, names):
            if n == '-': continue
            p = im.crop(b); bb = p.getbbox(); p = p.crop(bb) if bb else p
            sc = min(1.0, lim / p.width)
            save(p.resize((round(p.width * sc), round(p.height * sc)), Image.LANCZOS) if sc < 1 else p, n)
    elif mode == 'one':
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
