"""声の最後の音（いちばんうしろの大きいかたまり）だけを短くする・語尾を下げる（11/21 しょーくん：ほのか「できたっ！」の「た」を短く・できた↓）
注意（11/21）：のびている母音を途中で切ると、しょーくんには「ノイズ」に聞こえた（加工なしの声はノイズなし）。ゲームの声は、koe-irai で言い方を変えて作りなおすほうがよい
使い方：python3 -I tools/koe/shorten_last.py <入力（trim.py のあと）> <出力.mp3> [--len 0.17] [--fall 430:355]
- 短くするのは「切る」：最後の音のはじまりから --len 秒だけ残して、うしろ 50ms をなめらかに消す
  （はじめは atempo で早送りしていたが、しょーくん「圧縮されたみたいなノイズ」→ 早送りはしない。rubberband も母音がへこむので使わない）
- --fall 始め:終わり（Hz）：語尾を下げる。最後の音を、はじめ 70ms は「始め」の高さ、130ms までに「終わり」の高さへ。
  テープをゆっくり回すのと同じしくみ（ゆっくり読むと低くなる）で、もとの高さを測って その時その時の はやさを決める。音を切ったりつないだりしないのでノイズが出ない
- 大きさもここでそろえて（voice_level.py と同じはかり方で -22.5dB・山は -3dB まで）、mp3 にするのは1回だけ（-q:a 2・11/21 しょーくん「まだノイズがある」→ mp3 にしなおす回数をへらす）。
  そろっているので、あとで voice_level.py をかけても さわらない
"""
import subprocess, sys, numpy as np
a = sys.argv[1:]
def opt(k, d):
    if k in a: i = a.index(k); v = a[i + 1]; del a[i:i + 2]; return v
    return d
L = float(opt('--len', '0.17')); fall = opt('--fall', '')
src, dst = a[0], a[1]
SR, FADE = 44100, 0.05
def pcm(p, sr, af=None):
    cmd = ['ffmpeg', '-v', 'error', '-i', p] + (['-af', af] if af else []) + ['-ac', '1', '-ar', str(sr), '-f', 'f32le', '-']
    return np.frombuffer(subprocess.run(cmd, capture_output=True).stdout, dtype=np.float32).astype(np.float64)
def f0at(x, s, sr=16000):   # 高さ（自己相関・40ms）
    c = int(s * sr); fr = x[c - 320:c + 320]
    if c < 320 or len(fr) < 640: return 0
    fr = fr - fr.mean(); ac = np.correlate(fr, fr, 'full')[639:]
    lo, hi = sr // 600, sr // 150; k = lo + np.argmax(ac[lo:hi])
    return sr / k if ac[k] > 0.3 * ac[0] else 0
x = pcm(src, SR)
n = int(SR * 0.02); fr = x[: len(x) // n * n].reshape(-1, n); db = 20 * np.log10(np.sqrt((fr ** 2).mean(1)) + 1e-9)
loud = db > db.max() - 12
i = len(loud) - 1
while i > 0 and not loud[i]: i -= 1
end = (i + 1) * 0.02
while i > 0 and loud[i - 1]: i -= 1
on = i * 0.02; cut = max(0.0, on - 0.015); tau0 = on - cut
nB = int((tau0 + L) * SR)
w = np.ones(nB); m = int(FADE * SR); w[-m:] = 0.5 * (1 + np.cos(np.linspace(0, np.pi, m)))
if not fall:
    B = x[int(cut * SR):int(cut * SR) + nB]
else:
    s0, s1 = (float(v) for v in fall.split(':'))
    x16 = pcm(src, 16000)
    ts = np.arange(on, min(end, on + 0.4), 0.005); F = np.array([f0at(x16, t) for t in ts])
    F[F < s1 * 0.8] = 0   # 子音の所の読みちがい（1オクターブ下など）
    v = F > 0; F = np.interp(ts, ts[v], F[v]); F = np.convolve(np.pad(F, 3, mode='edge'), np.ones(7) / 7, 'valid')
    x4 = pcm(src, SR * 4, 'aresample=resampler=soxr')
    pos = np.empty(nB); p = cut
    for k in range(nB):
        tau = k / SR
        r = 1.0 if tau < tau0 else float(np.clip(np.interp(tau - tau0, [0, 0.07, 0.13, 1], [s0, s0, s1, s1]) / np.interp(p, ts, F), 0.6, 1.1))
        pos[k] = p; p += r / SR
    B = np.interp(pos * SR * 4, np.arange(len(x4)), x4)
y = np.concatenate([x[:int(cut * SR)], B * w[:len(B)]])
n = 882; fr = y[: len(y) // n * n].reshape(-1, n); r = np.sqrt((fr ** 2).mean(1) + 1e-12); rd = 20 * np.log10(r)
act = 10 * np.log10((r[rd > rd.max() - 18] ** 2).mean()); pk = 20 * np.log10(np.abs(y).max() + 1e-9)
y = y * 10 ** (min(-22.5 - act, -3 - pk) / 20)
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '1', '-i', '-', '-codec:a', 'libmp3lame', '-q:a', '2', dst], input=y.astype(np.float32).tobytes(), check=True)
print(f'{dst}: 最後の音を {L} 秒に' + (f'・高さ {fall} Hz' if fall else ''))
