# 共通の部品の使い方（まぜまぜおかし屋）

持ち主はリーダー【okashi】。昼のチャット【okashi-hiru】は、ここにある部品を**そのまま使う**（作り直さない・まねて別に作らない）。足りないときは claude/okashi-hiru.md の「リーダーへのお願い」へ。見た目とことばの決まりは、プロジェクトの claude/okashi-game-idea.md の「画面」「操作」と claude/okashi-battle-spec.md の「ことば」。

## 画面のわく
- 1つの画面は `$('screen').innerHTML = '<section class="morning fit">…</section>'` の形（昼は `day fit`）。`.fit` でスマホ1画面に収まる（ページはスクロールしない）。長いリストだけ、中でスクロールさせる：`flex:1;min-height:0;overflow-y:auto`
- 画面の切りかえの幕（ギンガムのタイル）は**自分で呼ばない**。ボタン（data-act）の中で S.phase が変わると main.js が出す。朝から昼へは `goDay()`、昼からまとめへは `goResult()`（flow.js）を呼ぶだけ
- 描きなおしは `render()`（いまの S.phase の画面）。状態を変えたら `save()`
- 中に入る物の数が変わる枠（札・リスト・名前）は、数が多くても・画面が低くても枠からはみ出さない形に（小さくする・中でスクロール）。例：夜の下のパネル（style.css の `@container` と night-ui.js の `fitPanel`）。いちばん長い名前・いちばん大きな数字・小さいスマホ（高さ600くらい）で確かめる

## 色と文字（src/style.css の :root）
- 色：`--wood` `--wood-2`（床と壁の板）・`--board` `--board-2`（棚板・パネル）・`--line`・`--cream` `--cream-2`（カードの紙）・`--milk` `--milk-soft`（板の上の文字）・`--ink` `--ink-soft`（紙の上の文字）・`--strawberry`・`--mint`・`--caramel`・`--gold`・`--ember`・真ちゅう `--brass` `--brass-hi` `--brass-lo`。**青は使わない**。新しい色がほしいときはお願いで
- 文字：ふつうは `var(--font)`（Zen Maru Gothic）。見出しと大きな数字は `font-family:var(--disp);font-weight:400`（Dela Gothic One）
- ゲームの画面に絵文字は入れない。ハートは `HEART`（core.js の ♥︎ の文字）

## ボタン（押すと白い輪は自動・11/18〜 絵のボタン）
- 絵は art-irai の ui-buttons（木と真ちゅう＋お菓子）。style.css のいちばん下の「UI の絵」が border-image（9分割）ではる。**背景・影・ふちの色を自分でつけない**（絵が消える・角が出る）。大きさは padding と高さで決める（絵は高さに合わせて小さくなる）
- `<button class="big" data-act="…">` …下の大きな赤いボタン（左にいちご・右にクッキー。画面に1つ・親指の届く下に）
- `class="sub"`（木の板のボタン）・`class="pill"`（クリームのまるい札）・`class="pill sub"`（チョコのまるい札）・`class="go2"`・`class="pill go2"`（赤＝買う・おわる）・`class="pill … on"`（えらんでいる札＝赤）
- タブ：`class="tab"`・えらんでいるのは `class="tab on"`（上にしましまの日よけ・えらんでいるタブは赤い布といちごのリボン）。朝の仕入れの市場／雑貨屋のタブはこれで
- まるいボタン：`class="round"`（44px のまる。とじる × など）。`class="sq"`（四角いアイコン）は絵なし
- 押したときの白い輪は、`.big .pill .go2 .sub` に data-act があれば main.js が出す。押せないときは `disabled`
- ボタンの動きは data-act の名前で：朝は morning.js の `MORNING_ACTS`、昼は day.js の `DAY_ACTS` に `名前: el => …` を足す（main.js の ACTS に入る）。ほかの名前とかぶらないように

## パネル・ならべ方・お知らせ
- `<div class="panel"><h2>見出し</h2><p>…</p></div>`（木の板・見出しは金の Dela Gothic One）。小さめは `panel tight`
- 横ならび `class="row"`（2つを同じ幅で `row two`）・うすい字 `class="muted"`・小さい説明 `class="hint"`
- ギンガムの布（前の夜の手札の布・11/18）：`class="gingham"`（いちごのしましまの布・内側に点線。大きさ・並べ方は使う側で）
- お知らせ：`toast('…')`（画面の上にしばらく出る）
- 数字は `fmt(n)`（3けた区切り）。文字を HTML に入れるときは `esc(t)`

## カード（src/js/cards-ui.js）
- カードの id：★1 の材料 `m:<材料>`・道具 `t:<道具>`・お菓子（★2）`o:<材料>+<材料>`（朝に作るお菓子は `'o:' + レシピの key`）・★3 `s:…`
- 小さいカード：`cardMini(cid, { cook })` → HTML。入れ物で大きさを決める（`aspect-ratio:5/7`・幅を決める。`.pc` は入れ物いっぱいに広がる）
- 大きく見るカード：`cardBig(cid, cook)` ＋ その下の説明 `cardInfo(cid)`（[いつ]の札と文。ことばはタップで説明）
- 調理台の形のカード：`cardTile(cid, { cook })`（夜の調理台用）
- 絵：お菓子 `candyURL(key)`・材料 `matURL(id)`・カードの絵だけ `artImg(cid)`・ハイグラの絵 `ART['名前']`（一覧は docs/ART.md。新しい絵はリーダーが art-irai にたのむ）
- 黄色いことば：文の中の `{ことば}` を `kwLong(文, true)` に通すと黄色くなって、タップで説明（data-act="kw"・説明の文は src/data/cards.js の KW）。新しいことばはお願いで

## 会話の部品（src/js/talk.js・11/18 H-005）
- `talk(lines, done)`：立ち絵＋名前＋セリフの窓を画面にかぶせる。タップで次・右上にスキップ。さいごまで読むと done（中で S.phase を変えると幕が出る）。場面を見せたいときは `talk(lines, done, { dim: false })`
- lines は文字の並び（src/data/story.js）：`'ほのか：セリフ'`・`'ほのか【びっくり】：セリフ'`・`'（地の文）'`。`'→ …'` は読まない。1つのセリフはスマホで2行まで（24文字くらい）
- 表情の名前（ほのか）：ふつう・うれしい・びっくり・しょんぼり・やる気・あちゃー・不安・くやしい・わくわく・うっとり・考える・感動・ドヤ（絵がまだの表情は、ふつうの絵で出る）。話す人と表情を足したいときはお願いで（TALKERS）
- 会話を開いているかは `talking()`

## ことば（11/18 しょーくん：夜は「おもてなし」）
- バトル！→ おもてなし！・ダメージとスコア → 味パワー・ノルマ → おなか（まんぞく！／まだ たりない…）・たいりょく → おなかいっぱい・撃退 → おもてなし・役目の攻撃 → 主役（帯「主役・生地」・次の主役×2）。満足は ちょっと満足・満足・大満足

## 動き
- 動きは CSS の animation で。`REDUCED`（動きをへらす設定）のときは動かしすぎない

## 軽く描く（11/18 しょーくん「描写ルールを見直して軽量化」・どちらのチャットも）
- 絵は `ART['名前']`・`artImg(cid)`・`cardIconURL(cid)` をそのまま使う（起動のときに短い blob URL になっている）。dataURL を自分で作って innerHTML に入れない。canvas で描いた絵は、作ったら Map に入れて使いまわす（cardIconURL の形）
- ずっと動く（infinite）アニメは **transform と opacity だけ**。box-shadow・filter・left/top・width・background-position・color は動かさない（スマホが毎フレームぬりなおす）。光らせたいときは、光った形を ::before/::after に重ねて opacity だけ動かす（例：`.pc.tile.best::before`・`.ck.c3::after`）。光の帯は帯の物を transform で動かす（`.pc-gl`）
- 1回だけの短い演出（0.6秒くらいまで）は、filter で明るくしてもよい
- requestAnimationFrame のループは、描く物がない画面では止める（scene.js の sceneLoop の形）
- 描きなおしは `render()` でまるごと。指に合わせて毎フレーム動く物（ドラッグなど）は style の transform だけ変える（innerHTML を作りなおさない）
- 使わなくなったクラス・関数・絵はけずる（コメントで残さない）。src のコメントはビルドで消えるので、説明は書いてよい
- 夜のバトルの速さ `T()`・はやおくりは夜だけのもの（昼は day.js の `scn.speed`）
