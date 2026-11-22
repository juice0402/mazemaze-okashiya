"""絵を軽くする（11/19 しょーくん「ファイルを開くのが重くなってきた」）：assets/art の webp を、見た目が変わらない強さで保存しなおす
使い方：
  python3 -I tools/slim_art.py          … まだ軽くしていない絵を軽くして、assets/slim.json に書く
  python3 -I tools/slim_art.py --check  … まだ軽くしていない絵の名前を出すだけ（何も書かない）
決まり：
- 強さは opts()：ふつうの絵は quality 78・すける所（アルファ）も alpha_quality 60。ui-* は枠のふちと字のための形なので quality 82・アルファはそのまま
  キャラが大きく出る絵（honoka*・minamo*・wakaba* の立ち絵・表情・戦闘ポーズ・chibi はのぞく）は quality 88・アルファ 85（11/19 H-032・もとの大きさで取りこむ）
  （11/19 に q86 の絵と2倍に拡大してくらべて、ちがいが見えない強さ。ほのかの必殺技の立ち絵 207KB → 128KB）
- 一度軽くした絵は assets/slim.json に「名前：バイト数」を残して、二度と保存しなおさない（くり返すと少しずつ画質が落ちるため）
- 新しい絵は tools/prep_art.py が同じ強さで保存する。取りこんだあとにこの道具をかけると、表に入るだけ（ほとんど小さくならない絵はそのまま）
- tools/build.mjs は、表にない絵があると「slim_art.py をかけてね」と出す
"""
import sys, os, io, json

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
ART = os.path.join(ROOT, 'assets', 'art')
TABLE = os.path.join(ROOT, 'assets', 'slim.json')


def big_chara(name):
    """キャラが大きく出る絵（立ち絵・表情・戦闘ポーズ。デフォルメ chibi はのぞく）"""
    return name.split('-')[0] in ('honoka', 'minamo', 'wakaba', 'dwarf') and 'chibi' not in name   # dwarf＝夜市の行商人（11/22 夜）


def opts(name):
    """絵の名前 → WebP で保存するときの強さ（prep_art.py もこれを使う）"""
    if big_chara(name):   # 11/19 H-032：会話で大きく出るので、もとの大きさ（prep_art の上限1520）で quality 88・アルファ85
        return dict(quality=88, alpha_quality=85, method=6)
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
        center_note()
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
    center_note()


def center_note():
    """カードの絵が まんなかにあるか（11/20・となりの絵のはしを消すと片がわだけ余白が残る）。くわしくは tools/center_art.py"""
    sys.dont_write_bytecode = True
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    from center_art import report, card_names
    rows = report(card_names())
    if rows:
        print('まんなかにない絵（python3 -I tools/center_art.py fix <名前…> で直す）:')
        print('\n'.join('  ' + r for r in rows))


if __name__ == '__main__':
    main()
