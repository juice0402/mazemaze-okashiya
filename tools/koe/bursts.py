# 音のかたまり（声のある所）を、長さと大きさつきで並べる
# 使い方: python3 bursts.py <mp3> [しきいdB] [無音の秒]
import subprocess, sys, re
src = sys.argv[1]; db = float(sys.argv[2]) if len(sys.argv) > 2 else -40; d = float(sys.argv[3]) if len(sys.argv) > 3 else 0.08
dur = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', src], capture_output=True, text=True).stdout)
r = subprocess.run(['ffmpeg', '-hide_banner', '-i', src, '-af', f'silencedetect=noise={db}dB:d={d}', '-f', 'null', '-'], capture_output=True, text=True).stderr
st = [float(x) for x in re.findall(r'silence_start: ([0-9.]+)', r)]; en = [float(x) for x in re.findall(r'silence_end: ([0-9.]+)', r)]
sil = list(zip(st, en + [dur] * (len(st) - len(en))))
segs, t = [], 0.0
for a, b in sil:
    if a - t > 0.01: segs.append((t, a))
    t = b
if dur - t > 0.01: segs.append((t, dur))
for i, (a, b) in enumerate(segs):
    o = subprocess.run(['ffmpeg', '-hide_banner', '-ss', f'{a:.3f}', '-to', f'{b:.3f}', '-i', src, '-af', 'volumedetect', '-f', 'null', '-'], capture_output=True, text=True).stderr
    m = re.search(r'mean_volume: ([-0-9.]+)', o); x = re.search(r'max_volume: ([-0-9.]+)', o)
    gap = a - segs[i - 1][1] if i else a
    print(f'{i:2d} {a:6.2f}-{b:6.2f} 長さ{b - a:5.2f} 前の無音{gap:5.2f} 平均{m.group(1) if m else "?":>6} 山{x.group(1) if x else "?":>6}')
