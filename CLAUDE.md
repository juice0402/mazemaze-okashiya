# まぜまぜおかし屋（記号 okashi）

- 直すのは `src/game.html`（アーティファクトにそのまま出せる形）。直したら `python3 build.py` で `index.html` を作り、両方をコミットする
- 企画と決まったことは、ネット副業プロジェクトの `claude/okashi-game-idea.md`
- 絵はドット絵。画面は縦長、棚は 128×176 の小さな画面を整数倍で描く（棚の上の壁だけ高さに合わせてのびる）
- 時間はページを開いている間だけ進む（1秒で3分、9:00〜18:00）。セーブは localStorage の `mazemaze-okashiya`（v:1）。形を変えたら sanitize() で古いセーブを読めるようにする
- ゲームの画面に絵文字（✨🚀など）を入れない。決まりはプロジェクトの `claude/site-principles.md`
