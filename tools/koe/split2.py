# 1本にまとめた掛け声を、声のかたまりで切り分ける（11/21 その2）
# 1) 声のかたまりを出す（-42dB・無音 0.08 秒）
# 2) 小さすぎるかたまり（いちばん大きいかたまりより 25dB 小さい・0.08 秒より短い）は、息や雑音としてすてる
# 3) かたまりが多いときは、すき間のいちばん短い2つをつなぐ（やっ・た の「っ」のすき間など）。少ないときは止める
# 使い方: python3 split2.py <入力.mp3> <出力フォルダ> <id1> <id2> ...
import subprocess, sys, re, pathlib
src, out, ids = sys.argv[1], pathlib.Path(sys.argv[2]), sys.argv[3:]
DROP = 25
if ids and ids[0].startswith("--drop="): DROP = float(ids[0][7:]); ids = ids[1:]
out.mkdir(parents=True, exist_ok=True); n = len(ids)
dur = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', src], capture_output=True, text=True).stdout)
r = subprocess.run(['ffmpeg', '-hide_banner', '-i', src, '-af', 'silencedetect=noise=-42dB:d=0.08', '-f', 'null', '-'], capture_output=True, text=True).stderr
st = [float(x) for x in re.findall(r'silence_start: ([0-9.]+)', r)]; en = [float(x) for x in re.findall(r'silence_end: ([0-9.]+)', r)]
segs, t = [], 0.0
for a, b in zip(st, en + [dur] * (len(st) - len(en))):
    if a - t > 0.01: segs.append([t, a])
    t = b
if dur - t > 0.01: segs.append([t, dur])
def mean(a, b):
    o = subprocess.run(['ffmpeg', '-hide_banner', '-ss', f'{a:.3f}', '-to', f'{b:.3f}', '-i', src, '-af', 'volumedetect', '-f', 'null', '-'], capture_output=True, text=True).stderr
    m = re.search(r'mean_volume: ([-0-9.]+)', o); return float(m.group(1)) if m else -99
ms = [mean(a, b) for a, b in segs]; top = max(ms)
segs = [s for s, m in zip(segs, ms) if m > top - DROP and s[1] - s[0] >= 0.08]
while len(segs) > n:
    k = min(range(1, len(segs)), key=lambda i: segs[i][0] - segs[i - 1][1])
    segs[k - 1][1] = segs[k][1]; del segs[k]
if len(segs) < n: sys.exit(f'かたまりが {len(segs)} こしかない（{n} こいる）→ 作りなおす')
PRE, POST = 0.03, 0.12
for id_, (a, b) in zip(ids, segs):
    a0, b0 = max(0, a - PRE), min(dur, b + POST)
    subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-i', src, '-ss', f'{a0:.3f}', '-to', f'{b0:.3f}',
                    '-af', 'afade=t=in:d=0.01,areverse,afade=t=in:d=0.03,areverse', '-ac', '1', '-b:a', '96k', str(out / f'{id_}.mp3')], check=True)
    print(f'{id_}: {a0:.2f}-{b0:.2f}')
