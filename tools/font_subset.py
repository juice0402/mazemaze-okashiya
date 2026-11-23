"""Webフォント（Zen Maru Gothic 500/700・Dela Gothic One）を、ゲームで使う字だけに削って assets/font/web/*.woff2 にする。
元の TTF（OFL）は google/fonts の ofl/zenmarugothic/ と ofl/delagothicone/ にある（コミットしない）：
  git clone --depth 1 --filter=blob:none --sparse https://github.com/google/fonts <TTFの場所>
  git -C <TTFの場所> sparse-checkout set --no-cone /ofl/zenmarugothic/ /ofl/delagothicone/
使い方：python3 -I tools/font_subset.py <TTFの場所>/ofl [--no-jis]   （要 pip: fonttools brotli）
11/23 夜 総デバッグ（遊ぶ人の index.html のタイトルが 2.5秒 → 4.6秒・字の3つで1.8MB を先に読んでいた）：2つに分ける
  - <名前>.woff2＝いま使う字（src/ の全文字 + ASCII + かな + 全角ASCII + 記号）。字の一覧は assets/font/chars-core.txt
    （tools/build.mjs が @font-face の unicode-range にする＝この字だけ この字のファイルで出す）
  - <名前>-ext.woff2＝JIS第1水準漢字のうち 上にない字（--no-jis で作らない）。unicode-range なしで先に書く＝ふだんは読まない・
    この字が出たときだけ読む（あとで文が足されて、まだ削りなおしていないとき）
  - assets/font/chars.txt＝両方の字（tools/build.mjs が src の字が足りないとき警告を出す・いま使う字にない字も知らせる）"""
import sys, os, subprocess, glob
args = [a for a in sys.argv[1:] if not a.startswith('--')]
root = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
ttf = args[0]
core = set()
for p in glob.glob(os.path.join(root, 'src/**/*'), recursive=True):
    if p.endswith(('.js', '.css', '.html')):
        core |= set(open(p, encoding='utf8').read())
core |= {chr(c) for c in range(0x20, 0x7f)}
core |= {chr(c) for c in range(0x3041, 0x3097)} | {chr(c) for c in range(0x30a1, 0x30fb)} | set('ー・「」『』、。！？…〜～゛゜ヽヾゝゞ　―‐’”“‘（）【】〈〉《》♥︎')
core |= {chr(c) for c in range(0xff01, 0xff5f)} | {chr(c) for c in range(0xff61, 0xffa0)}
core = {c for c in core if ord(c) >= 0x20}
ext = set()
if '--no-jis' not in sys.argv:
    for row in range(0xb0, 0xd0):
        for cell in range(0xa1, 0xff):
            try: ext.add(bytes([row, cell]).decode('euc_jp'))
            except Exception: pass
ext = {c for c in ext if ord(c) >= 0x20} - core
fdir = os.path.join(root, 'assets/font')
open(os.path.join(fdir, 'chars.txt'), 'w', encoding='utf8').write(''.join(sorted(core | ext)) + '\n')
open(os.path.join(fdir, 'chars-core.txt'), 'w', encoding='utf8').write(''.join(sorted(core)) + '\n')
open(os.path.join(fdir, '_ext.txt'), 'w', encoding='utf8').write(''.join(sorted(ext)) + '\n')
jobs = [('zenmarugothic/ZenMaruGothic-Medium.ttf', 'zen-maru-500'), ('zenmarugothic/ZenMaruGothic-Bold.ttf', 'zen-maru-700'), ('delagothicone/DelaGothicOne-Regular.ttf', 'dela-gothic')]
os.makedirs(os.path.join(fdir, 'web'), exist_ok=True)
for src, name in jobs:
    for part, listing in [('', 'chars-core.txt'), ('-ext', '_ext.txt')]:
        out = os.path.join(fdir, 'web', name + part + '.woff2')
        if part and not ext:
            if os.path.exists(out): os.remove(out)
            continue
        subprocess.check_call(['pyftsubset', os.path.join(ttf, src), '--text-file=' + os.path.join(fdir, listing), '--flavor=woff2', '--layout-features=*', '--no-hinting', '--desubroutinize', '--output-file=' + out])
        print(name + part, os.path.getsize(out))
os.remove(os.path.join(fdir, '_ext.txt'))
