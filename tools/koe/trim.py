# 1つのことばの音の、前とうしろの無音を切る（声のかたまりの最初〜最後・小さい雑音はすてる）
# 使い方: python3 trim.py <入力.mp3> <出力.mp3>
import subprocess, sys, re
src, dst = sys.argv[1], sys.argv[2]
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
segs = [s for s, m in zip(segs, ms) if m > top - 25 and s[1] - s[0] >= 0.05]
a0, b0 = max(0, segs[0][0] - 0.03), min(dur, segs[-1][1] + 0.12)
subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-i', src, '-ss', f'{a0:.3f}', '-to', f'{b0:.3f}',
                '-af', 'afade=t=in:d=0.01,areverse,afade=t=in:d=0.03,areverse', '-ac', '1', '-b:a', '96k', dst], check=True)
print(f'{dst.split("/")[-1]}: {a0:.2f}-{b0:.2f}（{b0 - a0:.2f}秒・かたまり{len(segs)}こ）')
