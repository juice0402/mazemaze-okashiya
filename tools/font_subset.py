"""Webフォント（Zen Maru Gothic 500/700・Dela Gothic One）を、ゲームで使う字だけに削って assets/font/web/*.woff2 にする。
元の TTF（OFL）は google/fonts の ofl/zenmarugothic/ と ofl/delagothicone/ にある（コミットしない）：
  git clone --depth 1 --filter=blob:none --sparse https://github.com/google/fonts <TTFの場所>
  git -C <TTFの場所> sparse-checkout set --no-cone /ofl/zenmarugothic/ /ofl/delagothicone/
使い方：python3 -I tools/font_subset.py <TTFの場所>/ofl [--no-jis]   （要 pip: fonttools brotli）
字：src/ の全文字 + ASCII + かな + 全角ASCII + 記号 + JIS第1水準漢字（--no-jis で外す）。字の一覧は assets/font/chars.txt に書く
（tools/build.mjs が src の字が足りないとき警告を出す）。"""
import sys, os, subprocess, glob
args = [a for a in sys.argv[1:] if not a.startswith('--')]
root = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
ttf = args[0]
chars = set()
for p in glob.glob(os.path.join(root, 'src/**/*'), recursive=True):
    if p.endswith(('.js', '.css', '.html')):
        chars |= set(open(p, encoding='utf8').read())
chars |= {chr(c) for c in range(0x20, 0x7f)}
chars |= {chr(c) for c in range(0x3041, 0x3097)} | {chr(c) for c in range(0x30a1, 0x30fb)} | set('ー・「」『』、。！？…〜～゛゜ヽヾゝゞ　―‐’”“‘（）【】〈〉《》♥︎')
chars |= {chr(c) for c in range(0xff01, 0xff5f)} | {chr(c) for c in range(0xff61, 0xffa0)}
if '--no-jis' not in sys.argv:
    for row in range(0xb0, 0xd0):
        for cell in range(0xa1, 0xff):
            try: chars.add(bytes([row, cell]).decode('euc_jp'))
            except Exception: pass
chars = {c for c in chars if ord(c) >= 0x20}
listing = os.path.join(root, 'assets/font/chars.txt')
open(listing, 'w', encoding='utf8').write(''.join(sorted(chars)) + '\n')
jobs = [('zenmarugothic/ZenMaruGothic-Medium.ttf', 'zen-maru-500'), ('zenmarugothic/ZenMaruGothic-Bold.ttf', 'zen-maru-700'), ('delagothicone/DelaGothicOne-Regular.ttf', 'dela-gothic')]
os.makedirs(os.path.join(root, 'assets/font/web'), exist_ok=True)
for src, name in jobs:
    out = os.path.join(root, 'assets/font/web', name + '.woff2')
    subprocess.check_call(['pyftsubset', os.path.join(ttf, src), '--text-file=' + listing, '--flavor=woff2', '--layout-features=*', '--no-hinting', '--desubroutinize', '--output-file=' + out])
    print(name, os.path.getsize(out))
