# 地図（まぜまぜおかし屋）

## ビルド
- `node tools/build.mjs` → `index.html`（遊ぶ人が開く1ファイル。自動で作る・手で直さない・コミットはする）
- `node tools/build.mjs --artifact <ファイル>` → アーティファクト用（doctype などなし）も書く
- JS は下の順に1つの `(() => { ... })()` にまとめる（どのファイルの名前も同じ場所で見える）

## ファイル
| ファイル | 役目 | 中の目安 |
| --- | --- | --- |
| src/shell.html | 画面の骨（#top・#screen・#toast） | 12行 |
| src/style.css | 見た目（木造のお菓子屋さんの色・青なし）。夜・朝・昼は .fit でスマホ1画面に収める | カード .pc・調理台のタイル .tiles/.tslot・説明 .callout・手札 .hand（--hh で高さ）・★3カットイン .cutin |
| src/js/core.js | 小さな道具・ドット絵（fromMap・outline・big）・セーブ（KEY・VER=4・newState・sanitize：いまはないカード・レシピを落とす）・toast | |
| src/data/cards.js | 生地と素材 MATS（cat）・道具 TOOLS・焦げ BURNT・火力 HEAT（1〜4）・焼き加減 COOK_MAX/cookMul/cookName・フィールド FIELDS・シェフ CHEFS（doughs＝ビルドの生地・common＝ほのか共通の素材と道具・fields）・★の倍率 STAR_MUL・DMG_CAP と計算の順番・レシピ（recipeOf・mergeFx）・カード（cardDef・attrsOf）・まぜる（mixable・mixCid）・fxText | 数字を変えるのはここ。仕様は claude/okashi-battle-spec.md |
| src/data/world.js | 食材モンスター MONSTERS・ノルマ quota（160×1.9^(ラウンド−1)）/nightHP・お客さん CUSTOMERS | 数字を変えるのはここ |
| assets/art/ | ハイグラの絵（webp）。ビルドが名前→dataURL の表 ART にして埋めこむ。もとの PNG は assets/art/raw/（埋めこまない）。一覧は docs/ART.md | |
| tools/prep_art.py | Codex の絵の緑を抜いて切り、webp にする（Python・PIL） | |
| src/js/art.js | ハイグラの絵を名前で引く hiArt・アイコン ICON_MAPS・お菓子の絵 CANDY_MAPS（名前の主役で形）・★3 specialCanvas・cardIconURL・人 personSprite（ほのか HONOKA）・モンスター MON_MAPS | |
| src/js/scene.js | 場面の絵（96×48）：夜 drawNight（火力でコンロの火・モンスターのゆれ）・昼 drawDay（棚・お客さん scn.cust） | |
| src/js/night.js | 夜のバトルのしくみ：仕入れ（poolList・rollShop・よびりん N.call・buy(i,at)・payNg/pay・placeHeld＝手持ちを調理台へ・sellAt/sellValue・reroll）・まぜる（cardAt＝shop/held/board のカード・mixResult：焼き加減は低いほう・mixPlan＝代金と行き先（調理台のカードとなら調理台・手札どうしなら手持ち N.held へ。HELD_MAX=3）・mixNg・doMix は mixFx の演出のあいだ busy）・ドラッグの決まり（dropPlan＝落としたら何が起きるか mix/buy/place/move/sell・dropCard）・moveTo＝入れかえ（バトルを押すまでいつでも）・タップ tapCard＝大きく見る（N.view）・バトル（cookStep・resolveRound＝はじめの焼き→左から発動・bake が1つずつ見せる。★3は先にカットイン）・finishRound/nextRound/endNight・nightOk（前の形のセーブは夜をはじめから・held がなければ足す） | |
| src/js/night-ui.js | 夜のバトルの画面：舞台（ほのか heroImg/heroFor・モンスター monURL・鉄板の火力 setHeat）・演出 showEvent（焼きは bakeCallout＋タイルがジュッ・発動はタイルがコン＋calloutHTML・updTile でタイルを描きなおす）・★3カットイン cutIn・まぜる演出 mixFx（2枚がシュッと飛び出す→まんなかでガキーン→できたカードがマスへ。cardSpot で動く前の場所）・タップで大きく見る viewerHTML・うる sellBtn/sellLabel・手札 handHTML（左に手持ち・右に仕入れ。扇形・重なり --ov・「まぜ」の目じるし）・下のボタン列 barHTML（ドラッグ中だけ出る「ここで うる」.sellzone）・renderNight（「場」＋5マスを1行。data-drag＝つかめる・data-drop＝落とせる・.mx-dot） | |
| src/js/drag.js | ドラッグ：dragInit（pointer のイベント）・dragBegin（つかんだカード .dragghost・行き先を光らせる put/swap/can/cant）・dragMove（上の札 .dragtip＝tipHTML：まぜるとできるカード）・dragFinish（dropCard。行き先がなければもどる）・dragEnd（直後のクリックを無視） | 置く・うごかす・まぜる・うるは、ぜんぶドラッグ。タップは大きく見る |
| src/js/cards-ui.js | カード（絵が主役・大きな数字・★のきらめき）：cardMini（手札）・cardTile（調理台のアイコン・生地は焼き加減のメーター）・cardBig・cardInfo（属性・効果・焼き加減）・効果の札 cardChips・cardDmg（焼き加減こみ） | 地の色は style.css の .pc.k-*（d 生地・m 素材・f ふしぎ・t 道具・b フィールド・k 焦げ・o ★2・s ★3） |
| src/js/morning.js | 朝の仕込み：bakeRecipe・toCard（S.pool へ）・toShelf（S.shelf へ）・renderMorning | |
| src/js/day.js | 昼の販売：serve（好みとハート）・runCustomers・renderDay／1日のまとめ renderResult | |
| src/js/main.js | 画面の切りかえ render・タイトル・タップの表 ACTS・boot（hot のつづき） | |

## データの形（S・セーブは localStorage `mazemaze-okashiya` の v:4）
- phase：title → night → morning → day → result → （day+1）night
- night：field（フィールドの id か null）・heat（鉄板の火力 1〜4・ラウンドをまたいで残る）・call（よびりん）・board（調理台5マス {cid, cook}・cook は生地の焼き加減 0〜9・①〜⑤の順）・shop・coins・round・score・met（ノルマたっせい数）・burnt・flashes・held（手持ち：手札どうしでまぜてできた自分のカード {cid, cook}・ラウンドをまたいで残る）・sel（大きく見るカード {where: shop/held/board/field, i}）・view・stage（field/shop/roundEnd/end）
- カードの id：`m:生地か素材`・`t:道具`・`b:フィールド`（★1）・`o:食材+食材`（生地・素材の★2）・`s:★2|★2`（★3）・`u:道具+道具`（道具の★2）・`w:★2|★2`（道具の★3）・`k:1〜3`（焦げの★1〜★3）
- recipes：{ 'a+b': ひらめいた日 }（0 は最初から）／stock：ふしぎな材料／shelf：[{key, n}]／pool：お菓子のカード
