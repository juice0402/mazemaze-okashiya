# 地図（まぜまぜおかし屋）

## ビルド
- `node tools/build.mjs` → `index.html`（遊ぶ人が開く1ファイル。自動で作る・手で直さない・コミットはする）
- `node tools/build.mjs --artifact <ファイル>` → アーティファクト用（doctype などなし）も書く
- JS は下の順に1つの `(() => { ... })()` にまとめる（どのファイルの名前も同じ場所で見える）

## ファイル
| ファイル | 役目 | 中の目安 |
| --- | --- | --- |
| src/shell.html | 画面の骨（#top・#screen・#toast） | 12行 |
| src/style.css | 見た目（木造のお菓子屋さんの色・青なし）。夜・朝・昼は .fit でスマホ1画面に収める。いちばん下の「今どきのゲームの見た目」が上書きの皮（見出しと数字は Dela Gothic One・真ちゅうのふち・ショップの日よけ・手札のギンガム・ボタンの光沢・バトルの火の玉 .fx-*） | カード .pc・調理台のタイル .tiles/.tslot・説明 .callout・手札 .hand（--hh で高さ）・★3カットイン .cutin |
| src/js/core.js | 小さな道具・ドット絵（fromMap・outline・big）・セーブ（KEY・VER=4・newState・sanitize：いまはないカード・レシピを落とす）・toast | |
| src/data/cards.js | 生地と素材 MATS（cat）・道具 TOOLS・焦げ BURNT・火力 HEAT（1〜4）・焼き加減 COOK_MAX/cookMul/cookName・フィールド FIELDS・シェフ CHEFS（doughs＝ビルドの生地・common＝ほのか共通の素材と道具・fields）・★の倍率 STAR_MUL・DMG_CAP と計算の順番・名前は8文字まで（NAME_MAX・nounName：シュークリーム→シュー など・specialName・toolSetName は道具の mini）・レシピ（recipeOf・mergeFx）・カード（cardDef・attrsOf）・まぜる（mixable・mixCid）・fxList・fxText（カードの効果のことば。大事な順・短く・ビルドの前提は書かない。カードの紙は大事な2つ。いちばん左＝スタート・いちばん右＝アンカー）・fxLong（大きく見る画面の効果の文。「」のことばは黄色でタップすると説明）・KW（ことばの説明：スタート・アンカー・サイコー・焦げ・焼き加減・火力・場） | 数字を変えるのはここ。仕様は claude/okashi-battle-spec.md |
| src/data/world.js | 食材モンスター MONSTERS・ノルマ quota（160×1.9^(ラウンド−1)）/nightHP・お客さん CUSTOMERS | 数字を変えるのはここ |
| assets/art/ | ハイグラの絵（webp）。ビルドが名前→dataURL の表 ART にして埋めこむ。もとの PNG は assets/art/raw/（埋めこまない）。一覧は docs/ART.md | |
| tools/prep_art.py | Codex の絵の緑を抜いて切り、webp にする（Python・PIL） | |
| src/js/art.js | ハイグラの絵を名前で引く hiArt・アイコン ICON_MAPS・お菓子の絵 CANDY_MAPS（名前の主役で形）・★3 specialCanvas・cardIconURL・人 personSprite（ほのか HONOKA）・モンスター MON_MAPS | |
| src/js/scene.js | 場面の絵（96×48）：夜 drawNight（火力でコンロの火・モンスターのゆれ）・昼 drawDay（棚・お客さん scn.cust） | |
| src/js/night.js | 夜のバトルのしくみ：仕入れ（poolList・rollShop・よびりん N.call・buy(i,at)・payNg/pay・placeHeld＝手持ちを調理台へ・sellAt/sellValue・reroll）・まぜる（cardAt＝shop/held/board のカード・mixResult：焼き加減は低いほう・mixPlan＝代金と行き先（調理台のカードとなら調理台・手札どうしなら手持ち N.held へ。HELD_MAX=3）・mixNg・doMix は mixFx の演出のあいだ busy）・ドラッグの決まり（dropPlan＝落としたら何が起きるか mix/buy/place/move/sell・dropCard）・moveTo＝入れかえ（バトルを押すまでいつでも）・タップ tapCard＝大きく見る（N.view）・手札へもどす takeBack・バトル中は fighting（ショップをとじる）・バトル（cookStep・resolveRound＝はじめの焼き→左から発動・bake が1つずつ見せる。★3は先にカットイン）・finishRound/nextRound/endNight・nightOk（前の形のセーブは夜をはじめから・held がなければ足す） | |
| src/js/night-ui.js | 夜のバトルの画面：舞台（ほのか heroImg/heroFor・モンスター monURL・鉄板の火力 setHeat）・バトルの一撃 hitFx（火の玉→光の輪と火花→数字。ノルマにくらべて big・huge）・演出 showEvent（焼きは bakeCallout＋タイルがジュッ・発動はタイルがコン＋calloutHTML・updTile でタイルを描きなおす）・★3カットイン cutIn・まぜる演出 mixFx（約1.5秒：暗く→2枚がシュッと飛び出す→ヒットストップ→ガキーン・火花 sparks・光→できたカードがくるっと出て名前の札→マスへ。cardSpot で動く前の場所）・タップで大きく見る viewerHTML・うる sellBtn/sellLabel・手札 handHTML（自分のカードだけ5まいまで・扇形・空いている所は data-w="hand"＝手札へ）・ショップ shopHTML（準備のあいだ舞台にかぶせる .shopov・3まい／1ラウンド目は無料5まい・コインと入れかえ・値札・自分のカードを持ってくると「はなすと うる」）・下のボタン列 barHTML（バトル！だけ）・renderNight（「場」＋5マスを1行。data-drag＝つかめる・data-drop＝落とせる・.mx-dot） | |
| src/js/drag.js | ドラッグ：dragInit（pointer のイベント）・dragBegin（つかんだカード .dragghost・行き先を光らせる put/swap/can/cant）・dragMove（つかんだカードはまっすぐ持って translate で動かし、調理台の上では scale で指の所を中心に小さくなるだけ・札 .dragtip＝tipHTML：まぜるとできるカード。置き場は指から遠いほう＝指がショップの上なら下のボタンの所・調理台や手札の上ならノルマの帯の所）・dragFinish（dropCard。行き先がなければもどる）・dragEnd（直後のクリックを無視） | 置く・うごかす・まぜる・うるは、ぜんぶドラッグ。タップは大きく見る |
| src/js/cards-ui.js | カードの形：cardFace（ふち＝レア度の金属・絵の窓・名前のリボン・効果の紙・コストの宝石・ダメージの紋章 powBadge（炎の形・左上。コストの宝石はその下・調理台のタイルは右上）・★）→ cardMini（手札・ドラッグ・演出）／cardBig（大きく見る）・cardTile（調理台：絵と数字と焼き加減のメーター）・属性の帯 attrBar（名前の下・左が役目・右が種類・色 ATTR_C）・cardInfo（大きく見る下：名前は出さず、効果の文 fxLong → ダメージ・焼き加減 → 材料）・cardChips（効果のことば＝fxList）・黄色いことば kwShort（紙）/kwLong（文の「」）/kwTag・説明の吹き出し showKw/hideKw（main.js の ACTS.kw） | 見た目は style.css の「カード」。文字の大きさはカードの幅（cqw） |
| src/js/morning.js | 朝の仕込み：bakeRecipe・toCard（S.pool へ）・toShelf（S.shelf へ）・renderMorning | |
| src/js/day.js | 昼の販売：serve（好みとハート）・runCustomers・renderDay／1日のまとめ renderResult | |
| src/js/main.js | 画面の切りかえ render・タイトル・タップの表 ACTS・boot（hot のつづき） | |

## データの形（S・セーブは localStorage `mazemaze-okashiya` の v:4）
- phase：title → night → morning → day → result → （day+1）night
- night：field（フィールドの id か null）・heat（鉄板の火力 1〜4・ラウンドをまたいで残る）・call（よびりん）・board（調理台5マス {cid, cook}・cook は生地の焼き加減 0〜9・①〜⑤の順）・shop・coins・round・score・met（ノルマたっせい数）・burnt・flashes・held（手持ち：手札どうしでまぜてできた自分のカード {cid, cook}・ラウンドをまたいで残る）・sel（大きく見るカード {where: shop/held/board/field, i}）・view・stage（field/shop/roundEnd/end）
- カードの id：`m:生地か素材`・`t:道具`・`b:フィールド`（★1）・`o:食材+食材`（生地・素材の★2）・`s:★2|★2`（★3）・`u:道具+道具`（道具の★2）・`w:★2|★2`（道具の★3）・`k:1〜3`（焦げの★1〜★3）
- recipes：{ 'a+b': ひらめいた日 }（0 は最初から）／stock：ふしぎな材料／shelf：[{key, n}]／pool：お菓子のカード
