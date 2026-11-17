# 地図（まぜまぜおかし屋）

## ビルド
- `node tools/build.mjs` → `index.html`（遊ぶ人が開く1ファイル。自動で作る・手で直さない・コミットはする）
- `node tools/build.mjs --artifact <ファイル>` → アーティファクト用（doctype などなし）も書く
- JS は下の順に1つの `(() => { ... })()` にまとめる（どのファイルの名前も同じ場所で見える）

## ファイル
| ファイル | 役目 | 中の目安 |
| --- | --- | --- |
| src/shell.html | 画面の骨（#top・#screen・#toast） | 12行 |
| src/style.css | 見た目（暗い色だけの1テーマ） | 夜 30〜120行・朝 120〜140・昼 140〜150・まとめ・タイトル |
| src/js/core.js | 小さな道具・ドット絵（fromMap・outline・big）・セーブ（KEY・VER=4・newState・sanitize）・toast | 88行 |
| src/data/cards.js | 材料 MATS・道具 TOOLS・火力 ZONES・フィールド FIELDS・シェフ CHEFS・レシピ（recipeOf・mergeFx）・カード（cardDef・fxText） | 数字を変えるのはここ |
| src/data/world.js | 食材モンスター MONSTERS・ノルマ quota/nightHP・お客さん CUSTOMERS | 数字を変えるのはここ |
| src/js/art.js | アイコン ICON_MAPS・お菓子の絵 CANDY_MAPS（名前の主役で形）・cardIconURL・人 personSprite（ほのか HONOKA）・モンスター MON_MAPS | |
| src/js/scene.js | 場面の絵（96×48）：夜 drawNight（火力でコンロの火・モンスターのゆれ）・昼 drawDay（棚・お客さん scn.cust） | |
| src/js/night.js | 夜のバトル：仕入れ（rollShop・buy・sell・tapSlot）・焼く（resolveRound が計算、bake/showEvent が演出）・finishRound/nextRound/endNight・renderNight | resolveRound 100行目あたり |
| src/js/morning.js | 朝の仕込み：bakeRecipe・toCard（S.pool へ）・toShelf（S.shelf へ）・renderMorning | |
| src/js/day.js | 昼の販売：serve（好みとハート）・runCustomers・renderDay／1日のまとめ renderResult | |
| src/js/main.js | 画面の切りかえ render・タイトル・タップの表 ACTS・boot（hot のつづき） | |

## データの形（S・セーブは localStorage `mazemaze-okashiya` の v:4）
- phase：title → night → morning → day → result → （day+1）night
- night：board（6マス {cid, rank}）・shop・coins・round・score・met（ノルマたっせい数）・burnt・flashes・stage（field/shop/roundEnd/end）
- カードの id：`m:材料`・`t:道具`・`o:材料+材料`（お菓子）
- recipes：{ 'a+b': ひらめいた日 }（0 は最初から）／stock：ふしぎな材料／shelf：[{key, n}]／pool：お菓子のカード
