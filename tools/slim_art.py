"""絵を軽くする（11/19 しょーくん「ファイルを開くのが重くなってきた」）：assets/art の webp を、見た目が変わらない強さで保存しなおす
使い方：
  python3 -I tools/slim_art.py          … まだ軽くしていない絵を軽くして、assets/slim.json に書く
  python3 -I tools/slim_art.py --check  … まだ軽くしていない絵の名前を出すだけ（何も書かない）
決まり：
- 強さは opts()：ふつうの絵は quality 78・すける所（アルファ）も alpha_quality 60。ui-* は枠のふちと字のための形なので quality 82・アルファはそのまま
  （11/19 に q86 の絵と2倍に拡大してくらべて、ちがいが見えない強さ。ほのかの必殺技の立ち絵 207KB → 128KB）
- 一度軽くした絵は assets/slim.json に「名前：バイト数」を残して、二度と保存しなおさない（くり返すと少しずつ画質が落ちるため）
- 新しい絵は tools/prep_art.py が同じ強さで保存する。取りこんだあとにこの道具をかけると、表に入るだけ（ほとんど小さくならない絵はそのまま）
- tools/build.mjs は、表にない絵があると「slim_art.py をかけてね」と出す
"""
import sys, os, io, json

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
ART = os.path.join(ROOT, 'assets', 'art')
TABLE = os.path.join(ROOT, 'assets', 'slim.json')


def opts(name):
    """絵の名前 → WebP で保存するときの強さ（prep_art.py もこれを使う）"""
    if name.startswith('ui-'):
        return dict(quality=82, method=6)
    return dict(quality=78, alpha_quality=60, method=6)


def main():
    from PIL import Image
    check = '--check' in sys.argv
    table = json.load(open(TABLE, encoding='utf-8')) if os.path.exists(TABLE) else {}
    todo = []
    for f in sorted(os.listdir(ART)):
        name, ext = os.path.splitext(f)
        if ext not in ('.webp', '.png'):
            continue
        p = os.path.join(ART, f)
        if ext == '.webp' and table.get(name) == os.path.getsize(p):
            continue
        todo.append((name, ext, p))
    if check:
        print('まだ軽くしていない絵', len(todo), ' '.join(n for n, _, _ in todo))
        return
    before = after = 0
    for name, ext, p in todo:
        n0 = os.path.getsize(p)
        im = Image.open(p); im.load()
        b = io.BytesIO(); im.save(b, 'WEBP', **opts(name)); data = b.getvalue()
        out = os.path.join(ART, name + '.webp')
        if ext == '.png' or len(data) < n0 * 0.95:   # 5% より小さくならないときは、もとのまま（もう軽い）
            with open(out, 'wb') as fh: fh.write(data)
            if ext == '.png': os.remove(p)
        before += n0; after += os.path.getsize(out)
        table[name] = os.path.getsize(out)
    for k in [k for k in table if not os.path.exists(os.path.join(ART, k + '.webp'))]:
        del table[k]   # 消した絵・art-stock へもどした絵は表からも消す
    with open(TABLE, 'w', encoding='utf-8') as fh:
        json.dump(dict(sorted(table.items())), fh, ensure_ascii=False, indent=0)
    print(f'{len(todo)}まい {before / 1e6:.2f}MB → {after / 1e6:.2f}MB')


if __name__ == '__main__':
    main()
