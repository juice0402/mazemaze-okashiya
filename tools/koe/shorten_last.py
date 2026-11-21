"""声の最後の音（いちばんうしろの大きいかたまり）だけを短くする（11/21 しょーくん：ほのか「できたっ！」の最後の「た」だけ短く）
使い方：python3 -I tools/koe/shorten_last.py <入力（trim.py のあと）> <出力.mp3> [はやさ=2.0]
- 前の音はそのまま。最後のかたまりの少し前（すき間）で切り、そこから先を atempo（高さは変えない）で はやさ 倍に
  （rubberband は母音のまんなかで 7dB ほど へこんだので使わない）
- このあと voice_level.py で大きさをそろえる
"""
import subprocess, sys, numpy as np
src, dst = sys.argv[1], sys.argv[2]
T = float(sys.argv[3]) if len(sys.argv) > 3 else 2.0
b = subprocess.run(['ffmpeg', '-v', 'error', '-i', src, '-ac', '1', '-ar', '16000', '-f', 'f32le', '-'], capture_output=True).stdout
x = np.frombuffer(b, dtype=np.float32); n = 320
fr = x[: len(x) // n * n].reshape(-1, n); db = 20 * np.log10(np.sqrt((fr ** 2).mean(1)) + 1e-9)
loud = db > db.max() - 12
i = len(loud) - 1
while i > 0 and not loud[i]: i -= 1
end = (i + 1) * 0.02
while i > 0 and loud[i - 1]: i -= 1
cut = max(0.0, i * 0.02 - 0.015)
fc = (f"[0:a]asplit[x][y];[x]atrim=0:{cut},asetpts=PTS-STARTPTS[a];"
      f"[y]atempo={T},atrim={cut / T}:{(end + 0.12) / T},asetpts=PTS-STARTPTS,areverse,afade=t=in:d=0.05,areverse[b];"
      f"[a][b]acrossfade=d=0.008[o]")
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', src, '-filter_complex', fc, '-map', '[o]', '-ar', '44100', '-ac', '1', '-b:a', '96k', dst], check=True)
print(f'{dst}: {cut:.3f} 秒から先を {T} 倍')
