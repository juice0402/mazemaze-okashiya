"""カードの絵が まんなかにあるかの点検と直し（11/20 しょーくん「絵を追加した時にまたずれないように」）
きっかけ：シートで頼んだ絵の「となりの絵のはし」を手で消すと、片がわだけ余白が残って、カードの中で絵が左にずれた
（バター・しずく寒天・大きなびん・あまあまクッキー・焦げ焦げクッキー・すくすく肥料）。

使い方：
  python3 -I tools/center_art.py                 … カードに出る絵（card- candy- special- burnt- field- jam- sweet-）をぜんぶ点検。ずれ・はしの切れはしがあれば名前を出して 1 で終わる
  python3 -I tools/center_art.py <名前…>         … えらんだ絵だけ点検
  python3 -I tools/center_art.py fix <名前…>     … はしの切れはしを消して、まわりの余白を6pxにそろえて置きなおす（保存の強さは slim_art.py の opts・assets/slim.json の記録も直す）

決まり：
  ずれ＝絵のある所（すけない所）のまんなかが、横 3%・たて 5% より はなれている
  はしの切れはし＝絵のふちにくっついた、細い（4px 以下）すじ（となりの絵のはし。キラキラの粒はふつう太いので出ない）
  スプーンや持ち手が横にのびた絵（とろとろジャム・カラメルなど）は、のびた所までふくめて まんなかなら よい（11/20 しょーくん OK）
取りこみの流れ：prep_art.py → （となりの絵のはしを消す）→ この点検 → slim_art.py（slim_art.py も最後にこの点検を出す）
"""
import sys, os, json
import numpy as np
from PIL import Image

ART = 'assets/art'
TABLE = 'assets/slim.json'
KINDS = ('card-', 'candy-', 'special-', 'burnt-', 'field-', 'jam-', 'sweet-')
DX, DY, PAD = 0.03, 0.05, 6


def slivers(a):
    """ふちにくっついた細いすじ（[x0, y0, x1, y1] のならび）"""
    from scipy import ndimage
    lab, n = ndimage.label(a > 20)
    H, W = a.shape
    out = []
    for s in ndimage.find_objects(lab):
        y0, y1, x0, x1 = s[0].start, s[0].stop, s[1].start, s[1].stop
        w, h = x1 - x0, y1 - y0
        side = (x0 == 0 or x1 == W) and w <= 4 and h >= 3
        topb = (y0 == 0 or y1 == H) and h <= 4 and w >= 3
        if side or topb:
            out.append([x0, y0, x1, y1])
    return out


def check(name):
    """[ずれの横, たて, 切れはし] ・ 絵がなければ None"""
    a = np.asarray(Image.open(f'{ART}/{name}.webp').convert('RGBA'))[:, :, 3]
    H, W = a.shape
    ys, xs = np.nonzero(a > 24)
    if not len(xs):
        return None
    dx = (xs.min() + xs.max() + 1) / 2 / W - .5
    dy = (ys.min() + ys.max() + 1) / 2 / H - .5
    return dx, dy, slivers(a)


def bad(r):
    return r and (abs(r[0]) > DX or abs(r[1]) > DY or r[2])


def fix(name):
    sys.dont_write_bytecode = True
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    from slim_art import opts
    p = f'{ART}/{name}.webp'
    im = Image.open(p).convert('RGBA')
    a = np.array(im)
    for x0, y0, x1, y1 in slivers(a[:, :, 3]):
        a[y0:y1, x0:x1, 3] = 0
    a[a[:, :, 3] < 8, 3] = 0   # ふちのうすいノイズ
    ys, xs = np.nonzero(a[:, :, 3] > 24)
    l, t, r, b = xs.min(), ys.min(), xs.max() + 1, ys.max() + 1
    im = Image.fromarray(a)
    body = im.crop((max(0, l - 2), max(0, t - 2), min(im.width, r + 2), min(im.height, b + 2)))
    out = Image.new('RGBA', (body.width + 2 * PAD, body.height + 2 * PAD), (0, 0, 0, 0))
    out.paste(body, (PAD, PAD))
    w0, h0 = im.size
    out.save(p, 'WEBP', **opts(name))
    if os.path.exists(TABLE):   # slim_art.py がもう一度かけないように、大きさの記録を直す（同じ絵に2回かけない）
        table = json.load(open(TABLE, encoding='utf-8'))
        table[name] = os.path.getsize(p)
        with open(TABLE, 'w', encoding='utf-8') as fh:
            json.dump(dict(sorted(table.items())), fh, ensure_ascii=False, indent=0)
    print(f'{name} {w0}x{h0} → {out.width}x{out.height}')


def report(names):
    """ずれている絵の行（なければ空）"""
    rows = []
    for n in names:
        r = check(n)
        if bad(r):
            s = f'{n} 横{r[0]:+.1%} たて{r[1]:+.1%}'
            if r[2]:
                s += f' はしの切れはし{len(r[2])}つ'
            rows.append(s)
    return rows


def card_names():
    return sorted(f[:-5] for f in os.listdir(ART) if f.endswith('.webp') and f.startswith(KINDS))


def main():
    args = sys.argv[1:]
    if args[:1] == ['fix']:
        for n in args[1:]:
            fix(n)
        args = args[1:]
    rows = report(args or card_names())
    if rows:
        print('まんなかにない絵（python3 -I tools/center_art.py fix <名前…> で直す）:')
        print('\n'.join('  ' + r for r in rows))
        sys.exit(1)
    print('カードの絵：ぜんぶ まんなか')


if __name__ == '__main__':
    main()
