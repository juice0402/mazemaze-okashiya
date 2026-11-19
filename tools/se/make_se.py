#!/usr/bin/env python3
"""まぜまぜおかし屋の効果音（11/19 昼のチャット【okashi-hiru】）
音の高い・きれいな音は FluidSynth と FluidR3_GM（楽器の音・MIT）で鳴らし、
ぽこっ・しゅっ・ぼわっ などの音は numpy で作る（どちらもコードで作った音＝C）→ mp3（モノラル・64kbps）。
使い方：python3 tools/se/make_se.py [名前…]   （なしでぜんぶ。assets/se/<名前>.mp3 を作る）
準備は tools/bgm/README.md と同じ（fluidsynth・fluid-soundfont-gm・midiutil）＋ numpy・scipy
"""
import os, re, subprocess, sys, tempfile
import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfilt
from midiutil import MIDIFile

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(ROOT, 'assets', 'se')
SF = '/usr/share/sounds/sf2/FluidR3_GM.sf2'
TMP = tempfile.mkdtemp(prefix='se-')
SR = 44100
KBPS = 64
N = {'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 'E': 4, 'F': 5, 'F#': 6, 'G': 7, 'G#': 8, 'Ab': 8, 'A': 9, 'Bb': 10, 'B': 11}
rng = np.random.default_rng(19)


def p(s): return 12 * (int(s[-1]) + 1) + N[s[:-1]]


def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0: sys.exit(f"失敗：{' '.join(cmd[:2])}\n{r.stderr[-400:]}")
    return r


def gm(notes, length, bpm=120, prog=None):
    """notes：(楽器の番号 or 'drum', 音（'C6' か打楽器の番号）, 拍, 長さ, 強さ) → 波形。prog は使わない（notes に書く）"""
    progs = sorted({n[0] for n in notes if n[0] != 'drum'})
    m = MIDIFile(len(progs) + 1, deinterleave=False)
    for t in range(len(progs) + 1): m.addTempo(t, 0, bpm)
    for i, pg in enumerate(progs): m.addProgramChange(i, i, 0, pg)
    for pg, note, t, d, v in notes:
        if pg == 'drum': m.addNote(len(progs), 9, note, t, d, v)
        else:
            i = progs.index(pg); m.addNote(i, i, p(note) if isinstance(note, str) else note, t, d, v)
    mid = os.path.join(TMP, 'x.mid'); wav = os.path.join(TMP, 'x.wav')
    with open(mid, 'wb') as f: m.writeFile(f)
    run(['fluidsynth', '-ni', '-q', '-g', '0.7', '-r', str(SR), '-F', wav, SF, mid])
    sr, a = wavfile.read(wav)
    a = a.astype(np.float32) / 32768.0
    if a.ndim > 1: a = a.mean(1)
    return fit(a, length)


def fit(a, length):
    n = int(length * SR)
    return a[:n] if len(a) >= n else np.pad(a, (0, n - len(a)))


def t_(length): return np.arange(int(length * SR)) / SR


def env(length, a=0.003, d=None, curve=4.0):
    """立ち上がり a 秒・そのあと指数で減る"""
    t = t_(length); e = np.minimum(1, t / max(a, 1e-4))
    e *= np.exp(-curve * np.maximum(0, t - a) / (d or length))
    return e


def noise(length): return rng.standard_normal(int(length * SR)).astype(np.float32)


def bp(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo, hi], btype='band', fs=SR, output='sos'), x)


def lp(x, hz, order=2): return sosfilt(butter(order, hz, btype='low', fs=SR, output='sos'), x)


def hp(x, hz, order=2): return sosfilt(butter(order, hz, btype='high', fs=SR, output='sos'), x)


def sweep(f0, f1, length):
    t = t_(length); f = f0 * (f1 / f0) ** (t / length)
    return np.sin(2 * np.pi * np.cumsum(f) / SR)


def pop(f0=900, f1=300, length=0.09):
    """ぽこっ（泡がはじける音）"""
    return sweep(f0, f1, length) * env(length, 0.002, curve=5)


def whoosh(length, lo0, lo1, q=1.6, rise=0.4):
    """しゅっ・ふわっ（帯の動くノイズ）"""
    x = noise(length); out = np.zeros_like(x); seg = 256
    for i in range(0, len(x), seg):
        k = i / len(x); c = lo0 * (lo1 / lo0) ** k
        out[i:i + seg] = bp(x[max(0, i - 2048):i + seg], c / q, min(c * q, SR / 2 - 100))[-len(x[i:i + seg]):]
    t = t_(length); e = np.where(t < length * rise, t / (length * rise), np.exp(-4 * (t - length * rise) / length))
    return out * e


def mix(*parts):
    n = max(len(x) for x in parts); o = np.zeros(n, np.float32)
    for x in parts: o[:len(x)] += x
    return o


def at(x, sec): return np.pad(x, (int(sec * SR), 0))


# ---- 効果音（名前 → (波形, ねらいの山の高さ dB)） ----
def se_tap():        # ボタン：コッ（木のブロック）
    return gm([('drum', 76, 0, .2, 100)], .16), -4


def se_wipe():       # 画面の切りかえの幕：ふわっ
    return whoosh(.55, 500, 2600, rise=.45) * .9, -9


def se_pick():       # 材料を持つ：ぽこっ
    return pop(700, 1300, .08), -8


def se_drop():       # 材料をかまどへ：ぽとん
    return mix(pop(900, 260, .12), gm([(12, 'G4', 0, .3, 90)], .35) * .8), -6


def se_buy():        # その場で買う・ショップで買う：チャリン
    return gm([(9, 'B6', 0, .3, 100), (9, 'E7', .14, .6, 105)], .9, bpm=120), -5


def se_bake():       # 焼きはじめ：ぼわっ（火の音）
    x = whoosh(1.0, 180, 700, q=2.2, rise=.12)
    crack = np.zeros(int(SR * 1.0), np.float32)
    for s in rng.uniform(.1, .85, 10):
        c = hp(noise(.012), 2500) * env(.012, .0005, curve=6); i = int(s * SR); crack[i:i + len(c)] += c * .25
    return mix(lp(x, 1600) * 1.6, crack), -4


def se_done():       # 焼き上がり：チーン
    return gm([(9, 'E7', 0, 1.2, 108), ('drum', 81, 0, 1.2, 70)], 1.4), -5


def se_burnt():      # 焦げた：ぷしゅ〜（くすっとなる音）
    x = lp(whoosh(.7, 2400, 600, rise=.1), 3000) * .5
    return mix(x, at(gm([(59, 'E4', 0, .25, 90), (59, 'C4', .5, .5, 85)], .75), .15) * .9), -7


def se_place():      # 棚に置く：コトッ
    return mix(gm([('drum', 77, 0, .2, 95)], .2), gm([(12, 'C5', 0, .2, 70)], .2) * .5), -6


def se_kanban():     # 看板にする：キラン
    return gm([(8, 'G6', 0, .3, 95), (8, 'D7', .25, .9, 100), (9, 'D7', .25, .9, 70)], 1.0), -6


def se_soroi():      # おそろい：シャラーン
    notes = [(46, n, i * .07, 1.5, 70) for i, n in enumerate(['C5', 'E5', 'G5', 'C6', 'E6', 'G6', 'C7'])]
    notes += [(9, n, .5, 1.2, 80) for n in ('C7', 'E7')]
    return gm(notes, 1.7), -6


def se_door():       # お店を開ける・お客さんが来る：カランコロン（ドアの鈴）
    notes = [(112, n, i * .11, .5, 100 - i * 9) for i, n in enumerate(['E6', 'C6', 'E6', 'C6', 'E6'])]
    return gm(notes, 1.2), -6


def se_sale():       # 売れた：チャリーン
    return gm([(9, 'G6', 0, .3, 95), (9, 'C7', .1, .3, 100), (9, 'E7', .2, 1.0, 105), (10, 'C6', .2, 1.0, 70)], 1.3), -5


def se_heart():      # すきな味でハート：ポワン♪
    return gm([(10, 'D6', 0, .5, 95), (10, 'A6', .22, 1.0, 100), (46, 'D6', .22, 1.0, 55), (46, 'F#6', .26, 1.0, 50)], 1.3), -6


def se_soldout():    # うりきれ：ポン！（ハンコ）＋チリン
    th = lp(noise(.12), 300) * env(.12, .002, curve=6) * 2.5 + sweep(160, 70, .12) * env(.12, .002, curve=5)
    return mix(th, at(gm([(9, 'C7', 0, .8, 85)], .8), .05) * .7), -5


def se_close():      # 閉店：カラン…
    notes = [(112, n, i * .16, .9, 95 - i * 12) for i, n in enumerate(['E6', 'C6', 'A5'])]
    return gm(notes, 1.5), -7


def se_card():       # 夜：カードを置く：シュッ・パタ
    sh = whoosh(.13, 1200, 5000, rise=.6) * .8
    tap = hp(noise(.03), 800) * env(.03, .001, curve=7) * .9
    return mix(sh, at(tap, .11)), -5


def se_serve():      # 夜：おもてなし（カードの発動）：ポンッ＋キラ
    return mix(pop(500, 1400, .07) * 1.6, at(gm([(8, 'A6', 0, .4, 90)], .45) * .8, .04)), -4


def se_hit():        # 夜：味パワーの数字：ピコ（playbackRate を上げると高くなる＝倍々に使える）
    return gm([(13, 'C6', 0, .15, 105)], .25), -6


def se_mult():       # 夜：倍々：キュイーン
    t = t_(.55); f = 500 * (2400 / 500) ** (t / .55)
    sq = np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * .25 + np.sin(2 * np.pi * np.cumsum(f) / SR) * .5
    e = np.minimum(1, t / .02) * np.where(t < .45, 1, np.exp(-(t - .45) * 30))
    return mix(lp(sq * e, 5000), at(gm([(9, 'C7', 0, .6, 80)], .7) * .6, .42)), -8


def se_star():       # 夜：★アップ（合成）：キラキラーン
    notes = [(8, n, i * .09, .5, 90) for i, n in enumerate(['C6', 'E6', 'G6', 'C7', 'E7'])]
    notes += [(46, n, .1 + i * .05, 1.4, 60) for i, n in enumerate(['C5', 'G5', 'C6', 'E6', 'G6'])]
    return gm(notes, 1.6), -6


def se_coin():       # 夜：お礼のコイン：ジャラジャラ
    notes = []
    for i in range(7):
        n = ['B6', 'E7', 'G6', 'C7', 'A6', 'D7', 'F#6'][i]
        notes.append((9, n, i * .11 + rng.uniform(0, .03), .35, 92 - i * 4))
    return gm(notes, 1.4), -6


def se_reroll():     # 夜：ショップの入れかえ：シャシャッ
    x = mix(*[at(whoosh(.09, 1500, 6000, rise=.5) * .7, s) for s in (0, .07, .14)])
    return x, -9


def se_manzoku():    # 夜：まんぞく！のハンコ：ポン！＋シャラン
    th = lp(noise(.12), 300) * env(.12, .002, curve=6) * 2.5 + sweep(170, 70, .12) * env(.12, .002, curve=5)
    return mix(th, at(gm([(9, n, 0, 1, 85) for n in ('C7', 'E7', 'G7')], 1.1) * .7, .05)), -5


def se_fire():       # 夜：大技（画面いっぱい）：ゴォォッ
    x = lp(whoosh(1.2, 120, 900, q=1.4, rise=.2), 1800)
    return mix(x * 1.2, gm([('drum', 49, 0, 1, 90), ('drum', 36, 0, .5, 110)], 1.0) * .6), -5


SES = {k[3:]: v for k, v in globals().items() if k.startswith('se_')}


def write(name, x, peak_db):
    x = x.astype(np.float32)
    x -= np.mean(x[:64]) if len(x) > 64 else 0
    pk = np.max(np.abs(x)) or 1
    x = x / pk * (10 ** (peak_db / 20))
    fade = min(len(x), int(.02 * SR)); x[-fade:] *= np.linspace(1, 0, fade)
    wav = os.path.join(TMP, name + '.wav'); wavfile.write(wav, SR, (x * 32767).astype(np.int16))
    out = os.path.join(OUT, name + '.mp3')
    run(['ffmpeg', '-y', '-loglevel', 'error', '-i', wav, '-codec:a', 'libmp3lame', '-b:a', f'{KBPS}k', out])
    print(f'{name}: {len(x) / SR:.2f}秒・{os.path.getsize(out) // 1024}KB')


if __name__ == '__main__':
    if not os.path.exists(SF): sys.exit('楽器の音がない：apt-get install -y fluidsynth fluid-soundfont-gm')
    os.makedirs(OUT, exist_ok=True)
    for name in sys.argv[1:] or list(SES):
        if name not in SES: sys.exit(f'知らない名前：{name}')
        x, pk = SES[name](); write(name, x, pk)
