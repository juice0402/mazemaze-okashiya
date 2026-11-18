# 地図（まぜまぜおかし屋）

## 持ち主（11/18 しょーくん・決まりはプロジェクトの claude/okashi-bunntan.md）
2つのチャットで作る。**同じファイルを2人で直さない。** 昼のチャットが直してよいのは「昼」のファイルだけ。ほかを変えたいときは claude/okashi-hiru.md の「リーダーへのお願い」（H-001…）に書く。
| 持ち主 | ファイル |
| --- | --- |
| 昼【okashi-hiru】（朝と昼の画面） | src/js/morning.js（朝のお菓子づくり）・src/js/day.js（昼の販売）・src/js/day-scene.js（昼の場面の絵）・src/data/hiru.js（朝と昼の数字・お客さんのすきな味）・src/style-hiru.css（朝と昼の見た目） |
| リーダー【okashi】（ほかぜんぶ） | 共通の部品：src/shell.html・src/style.css（色・文字・ボタン・パネル・カード）・src/js/core.js（道具・セーブ・toast・HEART）・src/js/cards-ui.js（カードの見た目・ことば）・src/js/art.js（絵）・src/js/scene.js（場面の絵を動かすしくみ）／1日の流れと画面の切りかえ：src/js/flow.js（goMorning・goDay・goResult・nextDay・1日のまとめ・デッキの入口 deckAddCandy）・src/js/main.js（render・ACTS・幕 wipe・押したときの光）／カード・数字：src/data/cards.js・src/data/world.js（モンスター・ノルマ・お客さんの名前と見た目）／夜：src/js/night.js・night-ui.js・battle-fx.js・drag.js・src/style-battle.css／ビルド tools/・assets/・docs/・index.html・README.md・CLAUDE.md |

- 昼のファイルとリーダーのつなぎ目（ここの名前と形を変えるときは、お願いで相談）：朝は flow.js の goMorning → morning.js の **startMorning()**（S.morning を用意）。昼は goDay → day.js の **startDay()**（S.dayRun を用意）、まとめへは goResult → **stopDay()**。カードにするのは **deckAddCandy(key)**（リーダーの入口）。画面は render() が **renderMorning()**・**renderDay()** を呼ぶ。ボタンは morning.js の **MORNING_ACTS**・day.js の **DAY_ACTS** に足すと main.js の ACTS に入る（data-act の名前は、ほかとかぶらないように m-・d- などで始めてもよい）
- セーブの形（S の中身）を変える・足すのはリーダー（sanitize と VER）。昼のチャットは S.morning・S.dayRun・S.shelf の中で今ある形を使う。新しい項目がほしいときはお願いで
- 共通の部品の使い方は docs/PARTS.md

## ビルド
- `node tools/build.mjs` → `index.html`（CSS は STYLES の順・JS は ORDER の順）（遊ぶ人が開く1ファイル。自動で作る・手で直さない・コミットはする）
- `node tools/build.mjs --artifact <ファイル>` → アーティファクト用（doctype などなし）も書く
- JS は下の順に1つの `(() => { ... })()` にまとめる（どのファイルの名前も同じ場所で見える）
- index.html では、CSS のコメントと空白・JS の1行まるごとのコメントと行の頭の空白を消す（src はそのまま）。だから src の文字列やテンプレートの中で、行を `//` や `/*` で始めない
- 軽く描く決まり（どちらのチャットも）は docs/PARTS.md の「軽く描く」

## ファイル
| ファイル | 役目 | 中の目安 |
| --- | --- | --- |
| src/shell.html | 画面の骨（#top・#screen・#toast） | 12行 |
| src/style-hiru.css | 朝と昼の画面の見た目（昼のチャット）：.stockline・.recipes/.recipe・.candy・.made・.scene-wrap・.shelf・#shelfList・.log | |
| src/style.css | 見た目（木造のお菓子屋さんの色・青なし）。夜・朝・昼は .fit でスマホ1画面に収める。いちばん下の「今どきのゲームの見た目」が上書きの皮（見出しと数字は Dela Gothic One・真ちゅうのふち・ショップの日よけ・手札のギンガム・ボタンの光沢・バトルの火の玉 .fx-*） | カード .pc・調理台のタイル .tiles/.tslot・説明 .callout・手札 .hand（--hh で高さ）・★3カットイン .cutin |
| src/js/core.js | 小さな道具・絵を blob URL にする artBlobs（boot の前に1回）・ドット絵（fromMap・outline・big）・セーブ（KEY・VER=4・newState・sanitize：いまはないカード・レシピを落とす）・toast | |
| src/style-battle.css | バトルの演出と舞台の賑やかしの見た目（style.css のあとに読む）：舞台の木の額縁 .dc-frame・手前の段と草・デフォルメ .dc（ぴょこぴょこ・hop/jump/scare）・タイルの跳ね方 pon1/pon2/pon3（★3 は縦に1回転してズドン）・下のパネルの札（.cur が光る・› でつながる）・オーラ .aura・光の輪 .aring・マスの札 .buff・ほのかの炎（鉄板 .tglow/.tfire/.tf/.tsp・火の粉 .embers・モンスターの --idle jelly/fluff と gunya/roar・#fxl の .fspark/.pillar/.steam/.fwall/.fx-dmg） | |
| src/data/cards.js | 生地と素材 MATS（cat）・道具 TOOLS・焦げ BURNT・火力 HEAT（1〜4）・焼き加減 COOK_MAX/cookMul・フィールド FIELDS・シェフ CHEFS（doughs＝ビルドの生地・common＝ほのか共通の素材と道具・fields）・★の倍率 STAR_MUL・DMG_CAP と計算の順番・名前は8文字まで（NAME_MAX・nounName：シュークリーム→シュー など・specialName・toolSetName は道具の mini）・レシピ（recipeOf・mergeFx）・カード（cardDef・attrsOf）・まぜる（mixable・mixCid）・fxList・fxText（カードの紙：1つの効果を1行で短く「スタート：×3」。大事な順・紙は上の2つ。ことばは 次・発動・焼き加減・焦げ（状態）・ショップ にそろえる）・fxLong（大きく見る画面：[いつ, 文]。いつ＝スタート・アンカー・発動時・常時・バトル開始時・焼かれるとき・焦げたとき・置いたとき。文の {ことば} は黄色でタップすると説明。状態は「○○状態にならない」）・KW（ことばといつの説明）・FIELDS の long | 数字を変えるのはここ。仕様は claude/okashi-battle-spec.md |
| src/data/world.js | 食材モンスター MONSTERS・ノルマ quota（160×1.9^(ラウンド−1)）/nightHP・お客さん CUSTOMERS（名前と見た目）・HEARTS_REGULAR | 数字を変えるのはここ |
| src/data/hiru.js | 朝と昼の数字（昼のチャット）：OVENS・BATCH・CUST_BASE・LIKE_MUL・OTHER_BUY・お客さんのすきな味 CUST_LIKES／likesOf | |
| assets/art/ | ハイグラの絵（webp）。ビルドが名前→dataURL の表 ART にして埋めこむ。もとの PNG は main に置かない（11/18 までの分は枝 art-raw・取り出し方は docs/ART.md）。一覧は docs/ART.md | |
| tools/prep_art.py | Codex の絵の緑を抜いて切り、webp にする（Python・PIL） | |
| tools/shot.py | 見た目の確かめ：index.html をスマホの大きさで開き、場面（title・shop・board・battle・panel・morning・day・result・js:…）を撮って1まいに並べる | |
| .ignore | 検索（ripgrep）から index.html・assets/ を外す（1行が大きすぎるため） | |
| src/js/art.js | ハイグラの絵を名前で引く hiArt・アイコン ICON_MAPS・お菓子の絵 CANDY_MAPS（名前の主役で形）・★3 specialCanvas・cardIconURL・人 personSprite（ほのか HONOKA）・モンスター MON_MAPS | |
| src/js/scene.js | 場面の絵のしくみ（96×48）：mountScene・sceneLoop（絵の canvas がない画面では止まる）・painter。いまは昼だけ | |
| src/js/day-scene.js | 昼の場面の絵（昼のチャット）：dayBg・drawDay（棚・お客さん scn.cust） | |
| src/js/night.js | 夜のバトルのしくみ：仕入れ（poolList・rollShop・よびりん N.call・buy(i,at)・payNg/pay・placeHeld＝手持ちを調理台へ・sellAt/sellValue・reroll）・まぜる（cardAt＝shop/held/board のカード・mixResult：焼き加減は低いほう・mixPlan＝代金と行き先（調理台のカードとなら調理台・手札どうしなら手持ち N.held へ。HELD_MAX=3）・mixNg・doMix は mixFx の演出のあいだ busy）・ドラッグの決まり（dropPlan＝落としたら何が起きるか mix/buy/place/move/sell・dropCard）・moveTo＝入れかえ（バトルを押すまでいつでも）・タップ tapCard＝大きく見る（N.view）・手札へもどす takeBack・バトル中は fighting（ショップをとじる）・バトルの速さ bSpeed/T()/toggleSpd（はやおくり ×2・この端末に覚える）・バトル（cookStep・resolveRound＝はじめの焼き→左から発動。ダメージの計算の中身を e.base/e.parts/e.fin に残す（parts の4つめ＝効果の元のマス・e.out＝ほかのカードへ飛ばす効果 rally/nb/heat/sear/next/again/fin・焼きの e.stop）・bake＝shopOut→battleIntro→showEvent を1つずつ（かかる時間は showEvent が返す）。★3は先にカットイン）・dealAnim（新しいラウンドでショップが下りて配る）・resultAnim（結果をかぞえ上げる）・finishRound/nextRound/endNight・nightOk（前の形のセーブは夜をはじめから・held がなければ足す） | |
| src/js/night-ui.js | 夜のバトルの画面：舞台（ほのか heroImg/heroFor・モンスター monURL・鉄板の火力 setHeat）・バトルの一撃 hitFx（火の玉と火の粉の尾→ぐにゃっ・光の輪と火花→数字。ぜんぶ #fxl で額縁の外へ。ノルマにくらべて big＝舞台がゆれる・huge＝画面いっぱいの炎。大きさのクラスは s-big・s-huge＝.big はボタンなので使わない）・countUp（数字のかぞえ上げ）・バトルの流れ：shopOut（ショップのカードが上へはけて、のれんのように上がる）→ battleIntro（ななめの帯「ラウンド・バトル！・ノルマ」）→ showEvent（焼きは bakePanel＋生地のタイルが左から順にジュッ・発動はタイルが★で跳ねる＋actPanel＝下のパネル（左にカード・右に名前と札・右下に大きな数字。札の数で chipsCls、数字の幅は numLen、入りきらないときは fitPanel で小さく）にカードと計算の札 .f-chip を chipStep で1つずつ（札の data-v＝その札のあとの数字・data-src＝元のマス・data-out＝飛ばす先）→ ダメージ → 火の玉。かかる ms を返す）・updTile でタイルを描きなおす・★3カットイン cutIn・まぜる演出 mixFx（約1.5秒：暗く→2枚がシュッと飛び出す→ヒットストップ→ガキーン・火花 sparks・光→できたカードがくるっと出て名前の札→マスへ。cardSpot で動く前の場所）・タップで大きく見る viewerHTML・うる sellBtn/sellLabel・手札 handHTML（自分のカードだけ5まいまで・扇形・空いている所は data-w="hand"＝手札へ）・ショップ shopHTML（準備のあいだ舞台にかぶせる .shopov・3まい／1ラウンド目は無料5まい・コインと入れかえ・値札・自分のカードを持ってくると「はなすと うる」）・下のボタン列 barHTML（バトル！だけ）・renderNight（「場」＋5マスを1行。data-drag＝つかめる・data-drop＝落とせる・.mx-dot） | |
| src/js/battle-fx.js | バトルの演出（11/18）：actBounce（★で跳ね方・★3 は slamFx＝ゆれ・衝撃の輪・木くず・ズドン！）・オーラ aura（from→to のマス・'heat'・'score'）・auraIn/auraOut（resolveRound の parts の4つめ＝元のマス・e.out＝飛ばす先）・マスの札 addBuff/takeBuff・舞台の賑やかし decoHTML（額縁・草 grassSVG・デフォルメのほのか chibi-think/sit/cheer・モブ DECO_MOBS。絵がないときは仮の絵）・decoChibi・decoReact／4. ほのかの炎（Version 38）：鉄板の炎 boardFireHTML（.tiles の data-z＝0 場なし・1〜4 火力）・舞台の火の粉 embersHTML・火力が変わったとき heatFx（上がる＝炎の柱 pillars・場を置くとボッ！・下がる＝湯気 steam）・火花 sparkBurst・画面いっぱいの炎 fireWall（大技だけ）・モンスターのもにもに monIdle（MON_IDLE）とぐにゃっ monReact・ダメージの数字 dmgNum | 絵の名前は docs/ART.md |
| src/js/drag.js | ドラッグ：dragInit（pointer のイベント）・dragBegin（つかんだカード .dragghost・行き先を光らせる put/swap/can/cant）・dragMove（つかんだカードはまっすぐ持って translate で動かし、調理台の上では scale で指の所を中心に小さくなるだけ・札 .dragtip＝tipHTML：まぜるとできるカード。置き場は指から遠いほう＝指がショップの上なら下のボタンの所・調理台や手札の上ならノルマの帯の所）・dragFinish（dropCard。行き先がなければもどる）・dragEnd（直後のクリックを無視） | 置く・うごかす・まぜる・うるは、ぜんぶドラッグ。タップは大きく見る |
| src/js/cards-ui.js | カードの形：cardFace（ふち＝レア度の金属・絵の窓・名前のリボン・効果の紙・★2★3の光 shineI/glossI・コストの宝石・ダメージの紋章 powBadge（炎の形・左上。コストの宝石はその下・調理台のタイルは右上）・★）→ cardMini（手札・ドラッグ・演出）／cardBig（大きく見る）・cardTile（調理台：絵と数字と焼き加減のメーター）・属性の帯 attrBar（名前の下・左が役目・右が種類・色 ATTR_C）・焼き加減の炎 cookIcon（生地の紙の左とタイルの左下。色＝生/半焼け/こんがり/サイコー・数字）・紙の字は fitFs で1行に収める・cardInfo（大きく見る下：[いつの札] 文 だけ。名前・属性・焼き加減・材料は出さない）・cardChips（効果のことば＝fxList）・黄色いことば kwShort（紙）/kwLong（文の {}）/kwTag・説明の吹き出し showKw/hideKw（main.js の ACTS.kw） | 見た目は style.css の「カード」。文字の大きさはカードの幅（cqw） |
| src/js/morning.js | 朝の仕込み（昼のチャット）：startMorning・bakeRecipe・toCard（deckAddCandy を呼ぶ）・toShelf（S.shelf へ）・renderMorning・MORNING_ACTS | |
| src/js/day.js | 昼の販売（昼のチャット）：startDay・stopDay・serve（好みとハート）・runCustomers・renderDay・DAY_ACTS | |
| src/js/flow.js | 1日の流れ：goMorning・goDay・goResult・nextDay・1日のまとめ renderResult・朝から呼ぶデッキの入口 deckAddCandy | |
| src/js/main.js | 画面の切りかえ render・タイトル・タップの表 ACTS（朝と昼のボタンは MORNING_ACTS・DAY_ACTS をまぜる）・boot（hot のつづき）・押したときの光 pressFx・夜/朝/昼/まとめの切りかえの幕 wipe（ギンガムのタイル・ぜんぶのせシップの pixWipe の形） | |

## データの形（S・セーブは localStorage `mazemaze-okashiya` の v:4）
- phase：title → night → morning → day → result → （day+1）night
- night：field（フィールドの id か null）・heat（鉄板の火力 1〜4・ラウンドをまたいで残る）・call（よびりん）・board（調理台5マス {cid, cook}・cook は生地の焼き加減 0〜9・①〜⑤の順）・shop・coins・round・score・met（ノルマたっせい数）・burnt・flashes・held（手持ち：手札どうしでまぜてできた自分のカード {cid, cook}・ラウンドをまたいで残る）・sel（大きく見るカード {where: shop/held/board/field, i}）・view・stage（field/shop/roundEnd/end）
- カードの id：`m:生地か素材`・`t:道具`・`b:フィールド`（★1）・`o:食材+食材`（生地・素材の★2）・`s:★2|★2`（★3）・`u:道具+道具`（道具の★2）・`w:★2|★2`（道具の★3）・`k:1〜3`（焦げの★1〜★3）
- recipes：{ 'a+b': ひらめいた日 }（0 は最初から）／stock：ふしぎな材料／shelf：[{key, n}]／pool：お菓子のカード
