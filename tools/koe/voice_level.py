"""声の大きさを「声が出ている所だけ」でそろえる（11/21 リーダー・しょーくん「ボリュームも少し統一して整えたい」）
使い方：python3 -I tools/koe/voice_level.py assets/koe [--target -22.5] [--dry]
- level.sh（平均 -24dB）は無音もふくめた平均なので、短い声（ふっ・ほいっ・うふふ）ほど 声の所が大きくなっていた（+4dB くらい）
- ここでは 20ms ごとの大きさで、いちばん大きい所から 18dB 以内を「声の所」とし、その平均を target にそろえる（山は -3dB まで）
- 新しい声を入れたら、これをもう一度かける（そろっている声は ±0.8dB 以内なら さわらない＝mp3 の作りなおしで音がにごるのをふせぐ。作りなおすと 0.4dB ほど小さくなる）
"""
import sys, subprocess, pathlib, numpy as np
args = sys.argv[1:]
dry = '--dry' in args; args = [a for a in args if a != '--dry']
target = -22.5
if '--target' in args: i = args.index('--target'); target = float(args[i + 1]); del args[i:i + 2]
def pcm(f):
    b = subprocess.run(['ffmpeg', '-v', 'error', '-i', f, '-ac', '1', '-ar', '44100', '-f', 'f32le', '-'], capture_output=True).stdout
    return np.frombuffer(b, dtype=np.float32)
def measure(x):
    n = 882; fr = x[: len(x) // n * n].reshape(-1, n); r = np.sqrt((fr ** 2).mean(1) + 1e-12); db = 20 * np.log10(r)
    on = db > db.max() - 18
    return 10 * np.log10((r[on] ** 2).mean()), 20 * np.log10(np.abs(x).max() + 1e-9)
for f in sorted(pathlib.Path(args[0]).glob('*.mp3')):
    a, p = measure(pcm(str(f)))
    g = round(min(target - a, -3 - p), 1)
    if abs(g) <= 0.8: print(f'{f.stem:14s} {a:6.1f} dB そのまま'); continue
    print(f'{f.stem:14s} {a:6.1f} dB → {g:+.1f} dB')
    if dry: continue
    tmp = f.with_suffix('.tmp.mp3')
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(f), '-af', f'volume={g}dB', '-ac', '1', '-b:a', '96k', str(tmp)], check=True)
    tmp.replace(f)
