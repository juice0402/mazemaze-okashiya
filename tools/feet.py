"""シェフの戦闘ポーズの足もとの表を作る（11/19 しょーくん「描写されてるものの位置で足元を合わせて欲しい」）
使い方：python3 -I tools/feet.py  → src/data/feet.js を書きなおす（自動で作るファイル・手で直さない）
- 絵ごとに、描かれた足のいちばん下（炎・しずく・光などのエフェクトはのぞく）を下からの割合 fp、
  足もとのまんなかを左からの割合 fx、絵の横÷たて ca、影の横の半分（絵の高さの割合）sw にする
  （11/19 しょーくん「絵によって、影とキャラクターの距離がバラバラ」→ 影の大きさも足のひらき方に合わせる）
- 足もとに道具（たき火の石・鉄板の脚）があって、まんなかがずれる絵は FIX で1まいずつ合わせる（目で見て決めた）
- night-ui.js の heroVars がこの表で、どのポーズでも足が同じ高さに立つように下げ、影を足もとに出す
- 新しいポーズの絵を足したら、POSES に名前を足して、もう一度かける
"""
import colorsys, json, pathlib
from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parent.parent
POSES = {
    'honoka': 'battle charge atk1 atk2 atk3 special win support heatup heatdown knead field burnt joy surprise oops',
    'minamo': 'battle charge atk atk2 atk3 heatup heatdown special win support shonbori bikkuri',
    'wakaba': 'battle charge atk atk2 atk3 grow jar special win support komari odoroki',
}
FIX = {   # 目で見て合わせた（11/19）：たき火の石・鉄板の脚が足もとの帯に入る絵
    'honoka-heatup': {'fx': .32, 'sw': .32},   # 足だけに影（たき火は石の上）
    'honoka-field': {'fx': .44, 'sw': .38},    # 足と鉄板の脚をいっしょに
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
    sw = min(.38, max(.16, (max(xs) - min(xs)) / 2 / h + .07)) if xs else .23
    return [round(1 - (foot + 1) / h, 4), round(fx, 3), round(w / h, 4), round(sw, 3)]


out = {}
for chef, names in POSES.items():
    for p in names.split():
        f = ROOT / 'assets/art' / f'{chef}-{p}.webp'
        if f.exists():
            v = measure(f); fix = FIX.get(f'{chef}-{p}', {})
            v[1] = fix.get('fx', v[1]); v[3] = fix.get('sw', v[3])
            out[f'{chef}-{p}'] = v
js = ('/* 自動で作るファイル（python3 -I tools/feet.py）・手で直さない\n'
      '   シェフの戦闘ポーズの足もと：名前 → [fp＝足の下のすき間（絵の高さの割合）, fx＝足もとのまんなか（横の割合）, ca＝横÷たて, sw＝影の横の半分（高さの割合）] */\n'
      'const FEET = ' + json.dumps(out, separators=(',', ':')) + ';\n')
(ROOT / 'src/data/feet.js').write_text(js)
print('src/data/feet.js', len(out))
