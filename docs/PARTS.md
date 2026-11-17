# 共通の部品の使い方（まぜまぜおかし屋）

持ち主はリーダー【okashi】。昼のチャット【okashi-hiru】は、ここにある部品を**そのまま使う**（作り直さない・まねて別に作らない）。足りないときは claude/okashi-hiru.md の「リーダーへのお願い」へ。見た目とことばの決まりは、プロジェクトの claude/okashi-game-idea.md の「画面」「操作」と claude/okashi-battle-spec.md の「ことば」。

## 画面のわく
- 1つの画面は `$('screen').innerHTML = '<section class="morning fit">…</section>'` の形（昼は `day fit`）。`.fit` でスマホ1画面に収まる（ページはスクロールしない）。長いリストだけ、中でスクロールさせる：`flex:1;min-height:0;overflow-y:auto`
- 画面の切りかえの幕（ギンガムのタイル）は**自分で呼ばない**。ボタン（data-act）の中で S.phase が変わると main.js が出す。朝から昼へは `goDay()`、昼からまとめへは `goResult()`（flow.js）を呼ぶだけ
- 描きなおしは `render()`（いまの S.phase の画面）。状態を変えたら `save()`

## 色と文字（src/style.css の :root）
- 色：`--wood` `--wood-2`（床と壁の板）・`--board` `--board-2`（棚板・パネル）・`--line`・`--cream` `--cream-2`（カードの紙）・`--milk` `--milk-soft`（板の上の文字）・`--ink` `--ink-soft`（紙の上の文字）・`--strawberry`・`--mint`・`--caramel`・`--gold`・`--ember`・真ちゅう `--brass` `--brass-hi` `--brass-lo`。**青は使わない**。新しい色がほしいときはお願いで
- 文字：ふつうは `var(--font)`（Zen Maru Gothic）。見出しと大きな数字は `font-family:var(--disp);font-weight:400`（Dela Gothic One）
- ゲームの画面に絵文字は入れない。ハートは `HEART`（core.js の ♥︎ の文字）

## ボタン（押すと白い輪は自動）
- `<button class="big" data-act="…">` …下の大きなキャラメルのボタン（画面に1つ・親指の届く下に）
- `class="sub"`（板の色のひかえめなボタン）・`class="pill"`（まるい札）・`class="go2"`（いちご）・`class="sq"`（四角いアイコン）
- 押したときの白い輪は、`.big .pill .go2 .sub` に data-act があれば main.js が出す。押せないときは `disabled`
- ボタンの動きは data-act の名前で：朝は morning.js の `MORNING_ACTS`、昼は day.js の `DAY_ACTS` に `名前: el => …` を足す（main.js の ACTS に入る）。ほかの名前とかぶらないように

## パネル・ならべ方・お知らせ
- `<div class="panel"><h2>見出し</h2><p>…</p></div>`（木の板・見出しは金の Dela Gothic One）。小さめは `panel tight`
- 横ならび `class="row"`（2つを同じ幅で `row two`）・うすい字 `class="muted"`・小さい説明 `class="hint"`
- お知らせ：`toast('…')`（画面の上にしばらく出る）
- 数字は `fmt(n)`（3けた区切り）。文字を HTML に入れるときは `esc(t)`

## カード（src/js/cards-ui.js）
- カードの id：★1 の材料 `m:<材料>`・道具 `t:<道具>`・お菓子（★2）`o:<材料>+<材料>`（朝に作るお菓子は `'o:' + レシピの key`）・★3 `s:…`
- 小さいカード：`cardMini(cid, { cook })` → HTML。入れ物で大きさを決める（`aspect-ratio:5/7`・幅を決める。`.pc` は入れ物いっぱいに広がる）
- 大きく見るカード：`cardBig(cid, cook)` ＋ その下の説明 `cardInfo(cid)`（[いつ]の札と文。ことばはタップで説明）
- 調理台の形のカード：`cardTile(cid, { cook })`（夜の調理台用）
- 絵：お菓子 `candyURL(key)`・材料 `matURL(id)`・カードの絵だけ `artImg(cid)`・ハイグラの絵 `ART['名前']`（一覧は docs/ART.md。新しい絵はリーダーが art-irai にたのむ）
- 黄色いことば：文の中の `{ことば}` を `kwLong(文, true)` に通すと黄色くなって、タップで説明（data-act="kw"・説明の文は src/data/cards.js の KW）。新しいことばはお願いで

## 動き
- 動きは CSS の animation で。`REDUCED`（動きをへらす設定）のときは動かしすぎない
- 夜のバトルの速さ `T()`・はやおくりは夜だけのもの（昼は day.js の `scn.speed`）
