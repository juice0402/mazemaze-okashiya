# まぜまぜおかし屋（記号 okashi）

- 企画と決まったことは、ネット副業プロジェクトの `claude/okashi-game-idea.md`
- 2つのチャットで作る（リーダー【okashi】＝夜・共通の所・main／昼【okashi-hiru】＝朝と昼の画面・枝 hiru/…）。決まりはプロジェクトの `claude/okashi-bunntan.md`。直してよいファイルは `docs/MAP.md` の「持ち主」、共通の部品の使い方は `docs/PARTS.md`
- 読み方（トークンの節約）：地図 `docs/MAP.md` → 検索 → その範囲だけ読む。`index.html`・`assets/` は検索から外してある（`.ignore`）ので読まない。もとの PNG は main になく枝 `art-raw`（要る1まいだけ取る・`docs/ART.md`）。見た目の確かめは `python3 -I tools/shot.py <PNG> <場面…>` で1まいに並べて撮る
- 地図は `docs/MAP.md`。直すのは `src/`（役目ごとのファイル・数字は `src/data/`）。直したら `node tools/build.mjs` で `index.html` を作り、両方をコミットする（index.html は手で直さない）
- 試しに遊ぶアーティファクトは `node tools/build.mjs --artifact <ファイル>` で作ったものを、同じ URL に出しなおす。絵はページに入れず、publish の root を `assets/art`・files を `node tools/art_files.mjs <前に出したコミット>` の出力（足した・変えた絵だけ。出さない絵は前のまま残る）
- 1日の流れ（11/18〜）：はじめだけプロローグ → 朝（材料をまぜてお菓子づくり・カードにはしない）→ 昼（棚で販売）→ 夕方〜夜（来店した食材モンスターを9ラウンドのカードでおもてなし。満足すると素材とコイン）→ まとめ（日記）。会話は src/js/talk.js、セリフは src/data/story.js（昼のチャット）
- 絵はハイグラ（11/17〜）：Codex（art-irai）で描いた絵を `python3 tools/prep_art.py` で `assets/art/*.webp` にし、ビルドは名前→ `assets/art/<ファイル>` の表 ART だけを入れる（絵は埋めこまない・使うときにブラウザが読む・11/19〜）。一覧は `docs/ART.md`。まだ絵のないものはドット絵の仮の絵（コードで描く C）
- 軽く描く決まり（ずっと動くアニメは transform と opacity だけ・絵は ART をそのまま・使わない物はけずる）は `docs/PARTS.md` の「軽く描く」
- 画面：木造のお菓子屋さんの色（青は使わない）・今どきの縦持ちカードゲームの形（絵が主役のカード・手札なし＝ショップ→調理台・タップで大きく見る）・スマホ1画面に収める
- 画面に出す数字はなるべく少なく（お店はお金だけ）。夜のスコアは倍々が気持ちいい所なので大きく見せてよい
- セーブは localStorage の `mazemaze-okashiya`（v:5。v:4 はその日の朝から・v:3 までの前の経営シミュレーションは読まずに新しく始める）。形を変えたら sanitize() で読めるようにする
- 前の経営シミュレーション（Version 12）は、git のコミット `bdc40b3`（11/17 の作り直しの1つ前）に残っている
- ゲームの画面に絵文字（✨🚀など）を入れない（ハートは `♥︎` の文字で）。決まりはプロジェクトの `claude/site-principles.md`
