"""シェフの戦闘ポーズの足もとの表を作る（11/19 しょーくん「描写されてるものの位置で足元を合わせて欲しい」）
使い方：python3 -I tools/feet.py  → src/data/feet.js を書きなおす（自動で作るファイル・手で直さない）
- 絵ごとに、描かれた足のいちばん下（炎・しずく・光などのエフェクトはのぞく）を下からの割合 fp、
  足もとのまんなかを左からの割合 fx、絵の横÷たて ca にする
- night-ui.js の heroVars がこの表で、どのポーズでも足が同じ高さに立つように下げ、影を足もとに出す
- 新しいポーズの絵を足したら、POSES に名前を足して、もう一度かける
"""
import colorsys, json, pathlib
from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parent.parent
POSES = {
    'honoka': 'battle charge atk1 atk2 atk3 special win support heatup heatdown knead field burnt joy surprise oops',
    'minamo': 'battle charge atk special win support shonbori bikkuri',
    'wakaba': 'battle charge atk special win support komari odoroki',
}


def effect(r, g, b):
    h, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
    if v > .75 and s > .45 and (h < .17 or h > .95): return True   # 炎（黄・オレンジ・明るい赤）
    if v > .7 and .45 < h < .6 and s > .15: return True             # 水色のしずく・氷
    if v > .6 and .15 < h < .35 and s > .35: return True            # 黄緑の光・葉
    if v > .92 and s < .12: return True                             # 白い光
    return False


def measure(path):
    im = Image.open(path).convert('RGBA'); w, h = im.size; px = im.load()
    foot = h - 1
    for y in range(h - 1, -1, -1):
        xs = [x for x in range(0, w, 2) if px[x, y][3] > 200 and not effect(*px[x, y][:3])]
        if len(xs) >= 6: foot = y; break
    top = max(0, foot - int(h * .06))   # 足もとのまんなか：足のいちばん下から上へ6%のあいだ
    xs = [x for y in range(top, foot + 1, 2) for x in range(0, w, 2) if px[x, y][3] > 200 and not effect(*px[x, y][:3])]
    fx = (min(xs) + max(xs)) / 2 / w if xs else .45
    return [round(1 - (foot + 1) / h, 4), round(fx, 3), round(w / h, 4)]


out = {}
for chef, names in POSES.items():
    for p in names.split():
        f = ROOT / 'assets/art' / f'{chef}-{p}.webp'
        if f.exists(): out[f'{chef}-{p}'] = measure(f)
js = ('/* 自動で作るファイル（python3 -I tools/feet.py）・手で直さない\n'
      '   シェフの戦闘ポーズの足もと：名前 → [fp＝足の下のすき間（絵の高さの割合）, fx＝足もとのまんなか（横の割合）, ca＝横÷たて] */\n'
      'const FEET = ' + json.dumps(out, separators=(',', ':')) + ';\n')
(ROOT / 'src/data/feet.js').write_text(js)
print('src/data/feet.js', len(out))
