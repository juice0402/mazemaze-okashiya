# 地図（まぜまぜおかし屋）

## ビルド
- `node tools/build.mjs` → `index.html`（遊ぶ人が開く1ファイル。自動で作る・手で直さない・コミットはする）
- `node tools/build.mjs --artifact <ファイル>` → アーティファクト用（doctype などなし）も書く
- JS は下の順に1つの `(() => { ... })()` にまとめる（どのファイルの名前も同じ場所で見える）

## ファイル
| ファイル | 役目 | 中の目安 |
| --- | --- | --- |
| src/shell.html | 画面の骨（#top・#screen・#toast） | 12行 |
| src/style.css | 見た目（暗い色だけの1テーマ）。夜・朝・昼は .fit でスマホ1画面に収める（絵がのびちぢみ・リストだけ中でスクロール） | 夜 50〜140行・朝・昼・まとめ・タイトル |
| src/js/core.js | 小さな道具・ドット絵（fromMap・outline・big）・セーブ（KEY・VER=4・newState・sanitize）・toast | 88行 |
| src/data/cards.js | 材料 MATS・道具 TOOLS・火力 ZONES・フィールド FIELDS・シェフ CHEFS・★の倍率 STAR_MUL・レシピ（recipeOf・mergeFx）・カード（cardDef・specialName・fxText） | 数字を変えるのはここ |
| src/data/world.js | 食材モンスター MONSTERS・ノルマ quota/nightHP・お客さん CUSTOMERS | 数字を変えるのはここ |
| assets/art/ | ハイグラの絵（webp）。ビルドが名前→dataURL の表 ART にして埋めこむ。もとの PNG は assets/art/raw/（埋めこまない）。一覧は docs/ART.md | |
| tools/prep_art.py | Codex の絵の緑を抜いて切り、webp にする（Python・PIL） | |
| src/js/art.js | ハイグラの絵を名前で引く hiArt・アイコン ICON_MAPS・お菓子の絵 CANDY_MAPS（名前の主役で形）・★3 specialCanvas・cardIconURL・人 personSprite（ほのか HONOKA）・モンスター MON_MAPS | |
| src/js/scene.js | 場面の絵（96×48）：夜 drawNight（火力でコンロの火・モンスターのゆれ）・昼 drawDay（棚・お客さん scn.cust） | |
| src/js/night.js | 夜のバトルのしくみ：仕入れ（rollShop・buy・sell・reroll）・まぜる（canMix・mixResult・startMix・doMix）・タップ（tapCard・closeView・moveSel）・焼く（resolveRound が計算・bake）・finishRound/nextRound/endNight | 冷蔵庫はなし |
| src/js/night-ui.js | 夜のバトルの画面：舞台（ほのか heroImg/heroFor・モンスター monURL・火力の光 setHeat）・演出 showEvent・大きなカード viewerHTML・下のボタン列 barHTML・renderNight（調理台3×2・仕入れ） | |
| src/js/cards-ui.js | 紙のカード：cardMini（調理台・仕入れ）・cardBig（タップでひらく）・ステータスの札 cardChips・種類の行 typeLine | 枠の色は style.css の .pc.k-* |
| src/js/morning.js | 朝の仕込み：bakeRecipe・toCard（S.pool へ）・toShelf（S.shelf へ）・renderMorning | |
| src/js/day.js | 昼の販売：serve（好みとハート）・runCustomers・renderDay／1日のまとめ renderResult | |
| src/js/main.js | 画面の切りかえ render・タイトル・タップの表 ACTS・boot（hot のつづき） | |

## データの形（S・セーブは localStorage `mazemaze-okashiya` の v:4）
- phase：title → night → morning → day → result → （day+1）night
- night：board（調理台6マス {cid}・①〜⑥の順）・shop・coins・round・score・met（ノルマたっせい数）・burnt・flashes・sel・mixing・stage（field/shop/roundEnd/end）
- カードの id：`m:材料`・`t:道具`（★1）・`o:材料+材料`（★2 お菓子）・`s:お菓子|お菓子`（★3 スペシャル）
- recipes：{ 'a+b': ひらめいた日 }（0 は最初から）／stock：ふしぎな材料／shelf：[{key, n}]／pool：お菓子のカード
