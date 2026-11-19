#!/usr/bin/env python3
"""まぜまぜおかし屋：朝昼タイトルの曲とジングル（11/19 昼のチャット【okashi-hiru】）
make_bgm.py（司令塔の見本）と同じ作り方：楽譜 → MIDI → FluidSynth と FluidR3_GM（MIT）→ mp3（モノラル・64kbps）
- 曲（1ループぶん・くり返してもつながる）：title（タイトル）・asa（朝のキッチン）・matome（1日のまとめ）
- ジングル（1回だけ鳴る・余韻まで）：jg-hirameki（レシピひらめき）・jg-manzoku（大満足）・jg-nakama（仲間になった）
使い方：python3 tools/bgm/make_bgm_hiru.py [名前…]   （なしでぜんぶ。assets/bgm/ に作る）
準備は tools/bgm/README.md（fluidsynth・fluid-soundfont-gm・midiutil）
"""
import os, random, re, sys
from midiutil import MIDIFile
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from make_bgm import p, add_seq, chord, run, SF, OUT, TMP, KBPS

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
# 曲：名前 → (テンポ, 小節, 1小節の拍)
LOOPS = {'title': (100, 16, 3), 'asa': (120, 16, 4), 'matome': (72, 8, 4)}
JINGLES = ['jg-hirameki', 'jg-manzoku', 'jg-nakama']


def chord2(root, kind):
    iv = {'M': [0, 4, 7], 'm': [0, 3, 7], '7': [0, 4, 7, 10], 'm7': [0, 3, 7, 10], 'M7': [0, 4, 7, 11], 'sus4': [0, 5, 7]}[kind]
    r = p(root); return [r + i for i in iv]


def new_midi(tracks, bpm):
    m = MIDIFile(tracks, deinterleave=False)
    for t in range(tracks): m.addTempo(t, 0, bpm)
    return m


def vel(v): return max(1, min(127, v + random.randint(-5, 5)))


# ---- タイトル：夜のお店の前の、きらきらワルツ（ニ長調・3拍子・100BPM・16小節） ----
def title():
    bpm = 100; m = new_midi(7, bpm)
    prog = [('D3', 'M'), ('B2', 'm'), ('G2', 'M'), ('A2', 'M'), ('D3', 'M'), ('F#2', 'm'), ('G2', 'M'), ('A2', '7'),
            ('B2', 'm'), ('G2', 'M'), ('D3', 'M'), ('A2', 'M'), ('G2', 'M'), ('A2', 'M'), ('D3', 'M'), ('A2', '7')]
    mel = [[('A4', 1), ('D5', 1), ('F#5', 1)], [('A5', 2), ('F#5', 1)], [('G5', 1), ('F#5', .5), ('E5', .5), ('D5', 1)], [('E5', 3)],
           [('A4', 1), ('D5', 1), ('F#5', 1)], [('C#6', 2), ('A5', 1)], [('B5', 1), ('A5', .5), ('G5', .5), ('F#5', 1)], [('G5', 1), ('E5', 1.5), ('C#5', .5)],
           [('D5', 1), ('F#5', 1), ('B5', 1)], [('B5', 1.5), ('A5', .5), ('G5', 1)], [('F#5', 1), ('A5', 1), ('D6', 1)], [('C#6', 2), ('A5', 1)],
           [('B5', 1), ('G5', 1), ('D5', 1)], [('E5', 1), ('F#5', .5), ('G5', .5), ('A5', 1)], [('F#5', 1.5), ('E5', .5), ('D5', 1)], [('E5', 1), ('C#5', 1), ('A4', 1)]]
    # ch0 チェレスタ / ch1 ハープ / ch2 ストリングス / ch3 ピチカートのベース / ch4 グロッケン / ch5 フルート / ch9 トライアングル
    for ch, prg in ((0, 8), (1, 46), (2, 49), (3, 45), (4, 9), (5, 73)): m.addProgramChange(ch, ch, 0, prg)
    loops = 2; bar = 3
    for L in range(loops):
        base = L * 16 * bar
        for b in range(16):
            t = base + b * bar
            add_seq(m, 0, 0, t, mel[b], 76 if b < 8 else 70)
            if b >= 8: add_seq(m, 5, 5, t, mel[b], 64, oct=-1)
            c = chord2(*prog[b])
            for n in c: m.addNote(2, 2, n + 12, t, bar, 38)
            m.addNote(3, 3, c[0] - 12, t, .9, 84)
            m.addNote(3, 3, c[0] - 5, t + 1, .5, 52); m.addNote(3, 3, c[0] - 5, t + 2, .5, 48)
            arp = [c[0], c[1] + 12 if len(c) < 4 else c[3], c[2] + 12, c[1] + 24, c[2] + 12, c[1] + 12]
            for i, n in enumerate(arp): m.addNote(1, 1, n, t + i * .5, .9, vel(46 if i else 54))
            if b % 4 == 0: m.addNote(6, 9, 81, t, 2, 44)   # トライアングル（open）
            if b >= 8 and b % 2 == 0:
                top = mel[b][0][0]
                if top != 'r': m.addNote(4, 4, p(top) + 12, t, 1, 40)
    end = loops * 16 * bar
    for n in chord2('D3', 'M'): m.addNote(2, 2, n + 12, end, 3, 45); m.addNote(1, 1, n + 24, end, 3, 50)
    m.addNote(3, 3, p('D2'), end, 3, 80); m.addNote(0, 0, p('D5'), end, 3, 70)
    return m


# ---- 朝のキッチン：ぽんぽん弾むマリンバ（ト長調・120BPM・16小節） ----
def asa():
    bpm = 120; m = new_midi(7, bpm)
    prog = [('G2', 'M'), ('E2', 'm'), ('C3', 'M'), ('D3', 'M'), ('G2', 'M'), ('B2', '7'), ('E2', 'm'), ('D3', 'M'),
            ('C3', 'M'), ('D3', 'M'), ('B2', 'm'), ('E2', 'm'), ('A2', 'm'), ('D3', 'M'), ('G2', 'M'), ('D3', '7')]
    mel = [[('B4', .5), ('D5', .5), ('G5', 1), ('F#5', .5), ('G5', .5), ('A5', 1)],
           [('G5', .5), ('E5', .5), ('B4', 1), ('r', .5), ('E5', .5), ('G5', 1)],
           [('E5', .5), ('G5', .5), ('C6', 1), ('B5', .5), ('A5', .5), ('G5', 1)],
           [('F#5', 1.5), ('E5', .5), ('D5', 2)],
           [('B4', .5), ('D5', .5), ('G5', 1), ('F#5', .5), ('G5', .5), ('B5', 1)],
           [('A5', .5), ('F#5', .5), ('D#5', 1), ('r', .5), ('F#5', .5), ('A5', 1)],
           [('G5', .5), ('F#5', .5), ('E5', .5), ('D5', .5), ('E5', 1), ('G5', 1)],
           [('F#5', 2), ('A5', 1), ('r', 1)],
           [('G5', .5), ('E5', .5), ('C5', 1), ('E5', .5), ('G5', .5), ('C6', 1)],
           [('A5', .5), ('F#5', .5), ('D5', 1), ('F#5', .5), ('A5', .5), ('D6', 1)],
           [('B5', 1), ('A5', .5), ('G5', .5), ('F#5', 1), ('D5', 1)],
           [('E5', .5), ('F#5', .5), ('G5', 1), ('B5', 2)],
           [('C6', .5), ('B5', .5), ('A5', 1), ('E5', .5), ('G5', .5), ('A5', 1)],
           [('F#5', .5), ('G5', .5), ('A5', 1), ('D6', 1), ('C6', 1)],
           [('B5', 1), ('G5', .5), ('D5', .5), ('B4', 1), ('D5', 1)],
           [('C5', .5), ('D5', .5), ('E5', .5), ('F#5', .5), ('A5', 1), ('r', 1)]]
    # ch0 マリンバ / ch1 クラリネット / ch2 ピチカート / ch3 ベース / ch4 シロフォン / ch5 ピアノ / ch9 打楽器
    for ch, prg in ((0, 12), (1, 71), (2, 45), (3, 32), (4, 13), (5, 0)): m.addProgramChange(ch, ch, 0, prg)
    loops = 2
    for L in range(loops):
        base = L * 64
        for b in range(16):
            t = base + b * 4
            add_seq(m, 0, 0, t, mel[b], 88)
            c = chord2(*prog[b])
            if b >= 8:
                # クラリネットはやわらかい2分音符の合いの手（和音の3度と5度）
                m.addNote(1, 1, c[1] + 12, t, 1.9, 56); m.addNote(1, 1, c[2] + 12, t + 2, 1.9, 54)
                for i, n in enumerate([c[0] + 24, c[1] + 24, c[2] + 24, c[1] + 24]):
                    m.addNote(5, 5, n, t + i, .4, vel(34))
            for k in (.5, 1.5, 2.5, 3.5):
                for n in c: m.addNote(2, 2, n + 12, t + k, .3, vel(48))
            nxt = chord2(*prog[(b + 1) % 16])[0]
            m.addNote(3, 3, c[0] - 12, t, .9, 86); m.addNote(3, 3, c[2] - 12, t + 2, .9, 76)
            m.addNote(3, 3, nxt - 12 + (1 if nxt < c[0] else -1), t + 3.5, .45, 66)
            for i in range(8): m.addNote(6, 9, 70, t + i * .5, .2, vel(30 if i % 2 else 38))
            for s in (1, 3): m.addNote(6, 9, 76, t + s, .2, vel(44))
            if b >= 8:
                for s in (1, 3): m.addNote(6, 9, 39, t + s, .2, vel(36))
            if b in (7, 15):
                for i, n in enumerate(['D5', 'E5', 'F#5', 'G5', 'A5', 'B5']): m.addNote(4, 4, p(n) + 12, t + 3 + i / 6, .2, vel(52))
    end = loops * 64
    for n in chord2('G2', 'M'): m.addNote(2, 2, n + 12, end, 1, 50)
    m.addNote(3, 3, p('G1'), end, 2, 80); m.addNote(0, 0, p('G5'), end, 2, 80)
    return m


# ---- 1日のまとめ：日記を読む、あたたかいオルゴール（ハ長調・72BPM・8小節） ----
def matome():
    bpm = 72; m = new_midi(6, bpm)
    prog = [('C3', 'M'), ('G2', 'M'), ('A2', 'm'), ('E2', 'm'), ('F2', 'M'), ('C3', 'M'), ('D3', 'm7'), ('G2', '7')]
    mel = [[('E5', 1.5), ('D5', .5), ('C5', 1), ('G4', 1)], [('D5', 2), ('B4', 1), ('G4', 1)],
           [('C5', 1), ('E5', 1), ('A5', 1.5), ('G5', .5)], [('G5', 2), ('E5', 2)],
           [('F5', 1), ('A5', 1), ('C6', 1), ('A5', 1)], [('G5', 1.5), ('E5', .5), ('C5', 2)],
           [('D5', 1), ('F5', 1), ('A5', 1), ('F5', 1)], [('D5', 1.5), ('C5', .5), ('B4', 1), ('D5', 1)]]
    # ch0 オルゴール / ch1 ピアノ / ch2 ストリングス / ch3 ベース / ch4 フルート
    for ch, prg in ((0, 10), (1, 0), (2, 49), (3, 32), (4, 73)): m.addProgramChange(ch, ch, 0, prg)
    loops = 2
    for L in range(loops):
        base = L * 32
        for b in range(8):
            t = base + b * 4
            add_seq(m, 0, 0, t, mel[b], 74)
            if b >= 4: add_seq(m, 4, 4, t, mel[b], 50, oct=-1)
            c = chord2(*prog[b])
            for n in c[:3]: m.addNote(2, 2, n + 12, t, 4, 34)
            arp = [c[0], c[2], c[1] + 12, c[2], c[0] + 12, c[2], c[1] + 12, c[2]]
            for i, n in enumerate(arp): m.addNote(1, 1, n + 12, t + i * .5, .9, vel(38 if i else 46))
            m.addNote(3, 3, c[0] - 12, t, 1.9, 62); m.addNote(3, 3, c[2] - 12, t + 2, 1.9, 54)
    end = loops * 32
    for n in chord2('C3', 'M'): m.addNote(2, 2, n + 12, end, 4, 40); m.addNote(1, 1, n + 12, end, 4, 44)
    m.addNote(3, 3, p('C2'), end, 4, 60); m.addNote(0, 0, p('C5'), end, 4, 66)
    return m


# ---- ジングル ----
def jg_hirameki():
    """レシピひらめき：ピロリロリン♪ ＋ キラーン（約2秒）"""
    m = new_midi(4, 120)
    for ch, prg in ((0, 8), (1, 46), (2, 9)): m.addProgramChange(ch, ch, 0, prg)
    for i, n in enumerate(['C6', 'E6', 'G6', 'C7']): m.addNote(0, 0, p(n), i * .25, .5, 92 - i * 3)
    for i, n in enumerate(['C5', 'E5', 'G5', 'C6', 'E6', 'G6', 'C7']): m.addNote(1, 1, p(n), .2 + i * .08, 2, 60)
    for n in ('C6', 'E6', 'G6'): m.addNote(2, 2, p(n), 1.0, 2.5, 74)
    m.addNote(3, 9, 81, 1.0, 2, 58)
    return m, 3.2


def jg_manzoku():
    """大満足：かわいいファンファーレ（約3秒）"""
    m = new_midi(6, 140)
    for ch, prg in ((0, 56), (1, 13), (2, 48), (3, 60)): m.addProgramChange(ch, ch, 0, prg)
    tri = 1 / 3
    seq = [('G4', tri), ('C5', tri), ('E5', tri), ('G5', 1), ('E5', .5), ('G5', 2.5)]
    add_seq(m, 0, 0, 0, seq, 96); add_seq(m, 1, 1, 0, seq, 80, oct=1)
    for n in chord2('C4', 'M'): m.addNote(3, 3, n, 1, .5, 76); m.addNote(3, 3, n, 2.5, 2.5, 82)
    for n in chord2('C3', 'M') + [p('C5')]: m.addNote(2, 2, n, 1, 4, 70)
    for i in range(6): m.addNote(4, 9, 38, i * (1 / 6), .1, 50 + i * 6)   # スネアの小さいロール
    m.addNote(4, 9, 49, 2.5, 2, 90); m.addNote(4, 9, 36, 2.5, .5, 100)
    return m, 4.4


def jg_nakama():
    """仲間になった：あたたかいファンファーレ（約4.5秒）"""
    m = new_midi(6, 100)
    for ch, prg in ((0, 10), (1, 73), (2, 48), (3, 46), (4, 32)): m.addProgramChange(ch, ch, 0, prg)
    seq = [('C5', .5), ('F5', .5), ('A5', .5), ('C6', 1.5), ('Bb5', .5), ('A5', .5), ('G5', .5), ('F5', 3)]
    add_seq(m, 0, 0, 0, seq, 86); add_seq(m, 1, 1, 0, seq, 70, oct=-1)
    for t, (r, k) in ((0, ('F3', 'M')), (1.5, ('F3', 'M')), (3, ('C3', '7')), (4.5, ('F3', 'M'))):
        d = 1.5 if t < 4.5 else 3
        for n in chord2(r, k): m.addNote(2, 2, n + 12, t, d, 62)
        m.addNote(4, 4, chord2(r, k)[0] - 12, t, d, 70)
    for i, n in enumerate(['F4', 'A4', 'C5', 'F5', 'A5', 'C6', 'F6']): m.addNote(3, 3, p(n), 4.5 + i * .07, 2.5, 58)
    m.addNote(5, 9, 81, 4.5, 2, 52)
    return m, 6.4


def write(m, name):
    mid = os.path.join(TMP, name + '.mid')
    with open(mid, 'wb') as f: m.writeFile(f)
    return mid


def gain_to(wav, peak):
    vd = run(['ffmpeg', '-i', wav, '-af', 'volumedetect', '-f', 'null', '-'])
    return round(peak - float(re.search(r'max_volume: ([-0-9.]+)', vd.stderr).group(1)), 2)


def render_loop(name, m):
    bpm, bars, beats = LOOPS[name]
    loop = bars * beats * 60 / bpm
    mid = write(m, name); wav = os.path.join(TMP, name + '.wav'); cut = os.path.join(TMP, name + '_loop.wav')
    run(['fluidsynth', '-ni', '-q', '-g', '0.6', '-r', '44100', '-F', wav, SF, mid])
    run(['ffmpeg', '-y', '-loglevel', 'error', '-i', wav, '-ss', str(loop), '-t', str(loop), '-ac', '1', '-ar', '44100', cut])
    g = gain_to(cut, -1.5)
    out = os.path.join(OUT, name + '.mp3')
    run(['ffmpeg', '-y', '-loglevel', 'error', '-i', cut, '-af', f'volume={g}dB,afade=t=in:d=0.003,afade=t=out:st={loop - 0.003}:d=0.003',
         '-codec:a', 'libmp3lame', '-b:a', f'{KBPS}k', out])
    print(f'{name}: {loop:.1f}秒（1ループ）・{os.path.getsize(out) // 1024}KB')
    return loop


def render_once(name, m, length):
    mid = write(m, name); wav = os.path.join(TMP, name + '.wav'); cut = os.path.join(TMP, name + '_cut.wav')
    run(['fluidsynth', '-ni', '-q', '-g', '0.6', '-r', '44100', '-F', wav, SF, mid])
    run(['ffmpeg', '-y', '-loglevel', 'error', '-i', wav, '-t', str(length), '-ac', '1', '-ar', '44100',
         '-af', f'afade=t=out:st={length - 0.8}:d=0.8', cut])
    g = gain_to(cut, -2.0)
    out = os.path.join(OUT, name + '.mp3')
    run(['ffmpeg', '-y', '-loglevel', 'error', '-i', cut, '-af', f'volume={g}dB', '-codec:a', 'libmp3lame', '-b:a', f'{KBPS}k', out])
    print(f'{name}: {length:.1f}秒（1回）・{os.path.getsize(out) // 1024}KB')


SONGS = {'title': title, 'asa': asa, 'matome': matome}
JG = {'jg-hirameki': jg_hirameki, 'jg-manzoku': jg_manzoku, 'jg-nakama': jg_nakama}

if __name__ == '__main__':
    if not os.path.exists(SF): sys.exit('楽器の音がない：apt-get install -y fluidsynth fluid-soundfont-gm')
    os.makedirs(OUT, exist_ok=True)
    want = sys.argv[1:] or list(SONGS) + list(JG)
    for name in want:
        random.seed('okashi-' + name)   # 曲ごとに同じゆらぎで作りなおせるように
        if name in SONGS: render_loop(name, SONGS[name]())
        elif name in JG: mm, ln = JG[name](); render_once(name, mm, ln)
        else: sys.exit(f'知らない名前：{name}')
