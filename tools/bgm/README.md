# BGM の作り方（tools/bgm）

11/19 司令塔が見本を2曲作った（しょーくん「BGM完璧だね」「もうこのまま採用できるレベル」→ 64kbps で）。

## いまある曲（assets/bgm/）
| ファイル | 曲 | 調・テンポ | 1ループ | 大きさ |
| --- | --- | --- | --- | --- |
| hiru.mp3 | 昼のお店（オルゴール・ピチカート・フルート・ピアノ・ベース・マラカス） | ヘ長調・100BPM・16小節 | 38.4秒 | 約300KB |
| yoru.mp3 | 夜のバトル（四角い音のリード・ブラス・ストリングス・ベース・シロフォン・ドラム） | イ短調・150BPM・16小節 | 25.6秒 | 約200KB |

どちらも1ループぶんだけ・モノラル・64kbps。ゲームの中でくり返して鳴らす。

## 作り方
1. 楽譜を `make_bgm.py` に書く（音の高さと長さ・コード進行・楽器の番号＝GM の番号）
2. `python3 tools/bgm/make_bgm.py` で assets/bgm/ の mp3 を作りなおす
   - MIDI → FluidSynth と FluidR3_GM（楽器の音）で鳴らす → 2回まわした2回目から1ループぶんを切り出す（はじめに1回目の余韻が入るので、くり返してもつながる）→ 音量を一定に上げて、64kbps の mp3
- 準備（はじめの1回）：`apt-get install -y fluidsynth fluid-soundfont-gm` ／ `pip install --break-system-packages midiutil`
- 新しい曲は、関数を1つ足して `SONGS` に（名前・テンポ・小節）を足す
- Claude は耳で聞けない。しょーくんに聞いてもらって直す

## ゲームで鳴らすとき
- mp3 は頭とおしりに少しすき間が入るので、`<audio loop>` だとつなぎ目でプツッとなることがある。Web Audio（decodeAudioData → AudioBufferSourceNode の loop）で鳴らし、遊んで確かめる。すき間が気になるときは loopStart・loopEnd で外す
- スマホは、さわる前に音を鳴らせない（はじめのタップのあとで鳴らしはじめる）

## 権利（claude/game-art-rule.md の「音」）
- 曲はコードで作った音（C）。楽器の音 FluidR3_GM は MIT ライセンス（Frank Wen）
- 音の一覧（出どころ）に「C・コードで作った曲（tools/bgm/make_bgm.py）・楽器の音 FluidR3_GM（MIT）」、クレジットに「楽器の音：FluidR3_GM（Frank Wen・MIT ライセンス）」と書いておくと安心
