# 絵と音の一覧（まぜまぜおかし屋）

決まりのもと：ネット副業プロジェクトの `claude/game-art-rule.md`

## 絵の道具
- ハイグラ版の絵は、最初から全部 Codex（絵の依頼箱 juice0402/art-irai）で描く（11/17 しょーくん）。理由：Canva の AI の枠を今月使い切ったのと、カードの画風をそろえたいため
- 画風：やわらかいアニメ調（なめらかな厚塗り・あたたかい光）。カードは物だけを大きく、背景は無地
- ほのか：元気な見習いパティシエ（10代後半くらい）。赤いポニーテールで毛先がオレンジ・白いコック帽とコート・赤いエプロン
- 立ち絵は、画風が変わらないうちにある程度作り置きする（11/17 しょーくん）。会話と戦闘は右向き

## 取りこみ方
- もとの PNG は main に入れない（11/18〜。毎回のダウンロードを軽くするため）。新しい絵のもとは art-irai の PR・枝にあるので、作業場所の /tmp に取ってきて使い、下の表に出どころ（依頼書と PR）を書く
- 11/18 までのもとの PNG（下の表の `assets/art/raw/…`）は、枝 `art-raw` にある。1まいだけ取り出す：`gh api -H 'Accept: application/vnd.github.raw' "repos/juice0402/mazemaze-okashiya/contents/assets/art/raw/<名前>.png?ref=art-raw" > /tmp/<名前>.png`（枝ごと取ってこない）
- `python3 tools/prep_art.py one|three <もとの PNG> <名前…> <上限>` で緑を抜いて `assets/art/<名前>.webp` に。ビルドが名前→絵の表（ART）にして埋めこむ。カードは `card-<材料>`・お菓子は `candy-<形>-<もう1つの材料>`（なければ `candy-<形>`）・★3 は `special-<形>-tower`・モンスターは `mon-<id>`

## 一覧（A＝AI で言葉から作った絵・C＝コードで描いた絵）
| 名前 | 分類 | 道具 | 作った日 | 依頼書・出どころ | 使う所 |
| --- | --- | --- | --- | --- | --- |
| いまのドット絵ぜんぶ（材料・道具・お菓子・人・モンスター・場面） | C | コード | 2026-11-17 | src/js/art.js・scene.js | 仮の絵（ハイグラの絵が届いたら差しかえる） |
| honoka（立ち絵・画風のもと） | A | Codex | 2026-11-17 | art-irai `requests/okashi/honoka.md`・もとの PNG `assets/art/raw/honoka.png` | タイトル・会話・夜の場面（右向きで使う＝コードで左右反転） |
| cards1（小麦粉・クッキー・まき） | A | Codex | 2026-11-17 | art-irai `requests/okashi/cards1.md`・もとの PNG `assets/art/raw/cards1.png` | 画風の見本（クッキーは★2の形に使えるかも。小麦粉とまきはモンスター食材で描きなおす） |
| honoka-joy・honoka-surprise・honoka-oops（うれしい・びっくり・しょんぼり） | A | Codex | 2026-11-17 | art-irai `requests/okashi/honoka-faces.md`（step1〜3）・もとの PNG `assets/art/raw/honoka-faces_step1〜3.png` | 会話の立ち絵（左右反転で右向き）・夜の結果・焦げたとき |
| honoka-battle（右向きの戦闘ポーズ） | A | Codex | 2026-11-17 | art-irai `requests/okashi/honoka-faces.md`（step4）・もとの PNG `assets/art/raw/honoka-faces_step4.png` | 夜の舞台 |
| card-komugi・card-bata・card-maki（リーフフェアリーの粉・ゴーゴーヤギのバター・おばけ樹木のまき） | A | Codex | 2026-11-17 | art-irai `requests/okashi/cards2.md`・もとの PNG `assets/art/raw/cards2.png` | ★1のカード |
| candy-cookie（クッキー） | A | Codex | 2026-11-17 | cards1 のまんなか | ★2 の「〜クッキー」のカード |
| mon-slime・mon-hitsuji（ぷるぷるスライム・くもひつじ） | A | Codex | 2026-11-17 | art-irai `requests/okashi/monsters1.md`・もとの PNG `assets/art/raw/monsters1.png` | 夜の舞台のモンスター・タイトル |
| candy-cookie-bata・candy-cookie-sato（★2 バタークッキー・あまあまクッキー） | A | Codex | 2026-11-17 | art-irai `requests/okashi/cookies1.md`・もとの PNG `assets/art/raw/cookies1.png` | ★2 のカード |
| special-cookie-tower（★3 クッキータワー。11/17 夜に名前を「特製クッキータワー」から短く） | A | Codex | 2026-11-17 | 同上 | ★3 のカード |
| card-dosshiri・card-hinoko・card-ichiban（どっしり生地・ひのこ生地・いちばん生地） | A | Codex | 2026-11-17 | art-irai `requests/okashi/cards3.md`・もとの PNG `assets/art/raw/cards3.png` | ★1 の生地カード |
| card-shime・card-horoniga・card-komugi（しめくくり生地・ほろにが生地・クッキー生地。komugi は粉の袋から差しかえ） | A | Codex | 2026-11-17 | art-irai `requests/okashi/cards4.md`・もとの PNG `assets/art/raw/cards4.png` | ★1 の生地カード |
| card-sato・card-tamago・card-choco（トカゲ砂糖・ほのおたまご・ゴーレムチョコ） | A | Codex | 2026-11-17 | art-irai `requests/okashi/cards5.md`・もとの PNG `assets/art/raw/cards5.png` | ★1 の素材カード |
| card-mitsu・card-zeri・card-hoippu（はちみつ・スライムゼリー・ひつじホイップ） | A | Codex | 2026-11-17 | art-irai `requests/okashi/cards6.md`・もとの PNG `assets/art/raw/cards6.png` | ★1 の素材カード（ゼリーとホイップはふしぎな素材） |
| card-hiokoshi・card-mizu・card-yakigote（火種・クラゲの水・やきごて） | A | Codex | 2026-11-17 | art-irai `requests/okashi/cards7.md`・もとの PNG `assets/art/raw/cards7.png` | ★1 の道具カード |
| card-yobirin・field-teppan・field-ishigama（よびりん・ほのかの鉄板・ごうごう石窯） | A | Codex | 2026-11-17 | art-irai `requests/okashi/cards8.md`・もとの PNG `assets/art/raw/cards8.png` | 道具カードとフィールド（hiArt が b: を field-○○ で引く） |
| burnt-1・burnt-2・burnt-3（焦げクッキー・焦げ焦げクッキー・すみびクッキー） | A | Codex | 2026-11-17 | art-irai `requests/okashi/cards9.md`・もとの PNG `assets/art/raw/cards9.png` | 焦げのカード（hiArt が k: を burnt-★ で引く） |
| bg-night（夜のおかし屋さんの厨房） | A | Codex | 2026-11-17 | art-irai `requests/okashi/bg1.md`・もとの PNG `assets/art/raw/bg1.png`（緑は抜かず、横960の webp に） | 夜の舞台とタイトルの背景 |
| candy-sable・candy-castella・candy-brownie（★2 サブレ・カステラ・ショコラ） | A | Codex | 2026-11-17 | art-irai `requests/okashi/cards10.md`・もとの PNG `assets/art/raw/cards10.png` | ★2 のお菓子（形だけの絵。材料の絵がのった candy-形-材料 があればそちら） |
| candy-candy・candy-jelly・candy-puff（★2 ドロップ・ゼリー・シュー） | A | Codex | 2026-11-17 | art-irai `requests/okashi/cards11.md`・もとの PNG `assets/art/raw/cards11.png` | 同上 |

## 依頼中（11/18）
- art-irai `requests/okashi/ui-stage.md`（夜の舞台の額縁＋別の部品のメダル）・`op2.md`（オープニングの横長の森 op-forest の出しなおし。H-015）が依頼中（11/18 14:20 に issue #3 で @codex）。op1 の op-mix・op-shop-night は済
- 待ち（2つずつ依頼中に）：`ui-shop`（ショップの日よけと板）・`ui-board`（調理台・おなかの帯・マス・コイン・火力のメーター・値札）・`ui-cards`（カードのふち4つ）・`ui-parts`（紋章・星・まっすぐな帯・ハンコ）・`ui-day`（棚・オーブン・看板・びん）
- 11/18 しょーくん「ボタンや枠やフレームも妥協することなく全て絵を描き下ろしてほしい」：UI も A（Codex）に。素材は木と真ちゅう＋お菓子の飾り。字はコードで重ねる
- 11/18 司令塔の決まり（game-art-rule.md の okashi の例外）：大きさの変わる枠・ボタンは border-image（9分割）で使える形に描かせる（角・辺・まんなかがはっきり分かれる・辺はくり返しても切れ目が目立たない・まんなかは無地か小さな模様）。押したとき・使えないときの形がいる部品は同じ絵で描かせる（待ちの ui-* に入れた）

## これから頼む絵
- ★3：クッキー以外の形の「○○タワー」（サブレ・カステラ・ショコラ・ドロップ・ゼリー・シュー）と、ちがう形どうしの★3（いまはコードで描いた仮の絵）
- キャラ：あとで水の飴細工職人と草のパティシエ・ほかの食材モンスター

## 音
- 掛け声（「えいっ」「はっ」など）は、あとで声の依頼箱 juice0402/koe-irai（VOICEVOX）で作る。クレジット画面に「音声合成：VOICEVOX:…」の1行
| chibi-think・chibi-cheer・chibi-sit（ほのかのデフォルメ：考える・応援・すわってクッキー） | A | Codex | 2026-11-18 | art-irai `requests/okashi/honoka-chibi.md`（step1〜3）・もとの PNG `assets/art/raw/honoka-chibi_step1〜3.png` | 舞台の賑やかし（ショップ＝考える・バトル＝すわって・大きな一撃と勝ち＝応援） |
| mob-slime・mob-hitsuji（スライム・くもひつじのデフォルメ） | A | Codex | 2026-11-18 | art-irai `requests/okashi/mobs-chibi.md`（step1）・もとの PNG `assets/art/raw/mobs-chibi_step1.png` | 舞台の賑やかしのモブ |
| mob-tokage・mob-hiyoko・mob-kurage（こんぺいトカゲ・ほのお鳥のひよこ・しずくクラゲ） | A | Codex | 2026-11-18 | art-irai `requests/okashi/mobs-chibi.md`（step2）・もとの PNG `assets/art/raw/mobs-chibi_step2.png` | 舞台の賑やかしのモブ（あとで敵にしてもよい） |
| 舞台の木の額縁・手前の段と草（SVG）・オーラ・光の輪・木くず | C | コード | 2026-11-18 | src/js/battle-fx.js・src/style-battle.css | バトルとショップの舞台 |
| honoka-yaruki・honoka-achaa・honoka-fuan・honoka-kuyashii・honoka-wakuwaku・honoka-uttori・honoka-kangaeru・honoka-kandou・honoka-doya（ほのかの立ち絵：やる気・あちゃー・不安・くやしい・わくわく・うっとり・考える・感動・ドヤ） | A | Codex | 2026-11-18 | art-irai `requests/okashi/honoka-poses.md`（step1〜9）・`prep_art.py box … 760 162,4,830,1528`（元の絵 honoka と同じ四角で切る） | 会話の部品の立ち絵（talk.js の TALKERS） |
| bg-day・bg-morning・bg-shop-out（昼のお店の中・朝のキッチン・お店の外） | A | Codex | 2026-11-18 | art-irai `requests/okashi/bg2.md`（step1〜3）・`prep_art.py bg`（16:9 の横960） | 昼と朝の画面（昼のチャット）・プロローグ（看板の字はコードで重ねる） |
| cust-kodomo・cust-gakusei・cust-otona・cust-obaachan（お客さん：こども・学生さん・おとなの人・おばあちゃんの正面・胸から上・ふつう） | A | Codex | 2026-11-18 | art-irai `requests/okashi/customers1.md`（step1〜4・PR #43）・`prep_art.py one … 480`（4まいとも高さ480。こどもを小さく見せるのはコードで） | 昼のカウンターの前のお客さん（昼のチャット）・会話の部品（こどもは⑬） |
| cust-<id>-happy・cust-<id>-sad（お客さん4人の うれしい・ざんねん。id＝kodomo・gakusei・otona・obaachan） | A | Codex | 2026-11-18 | art-irai `requests/okashi/customers2.md`（step1〜8・PR #45・cust-* のもとの絵から編集）・`prep_art.py one … 480`（ふつうの絵と同じ大きさ） | 昼のお客さん（すきな味があった・なかった） |
| honoka-<表情>-clean（すすなしの立ち絵6まい：yaruki・joy・fuan・kangaeru・wakuwaku・kandou） | A | Codex（のち色合わせで、すすを消した） | 2026-11-18 | もとの立ち絵（honoka-poses・honoka-faces）から、ほっぺのすすを消した（昼のチャット・枝 hiru/susu） | はじめて焼くまで（1日目の朝・プロローグ）の会話の立ち絵（morning.js の mSusuOn が TALKERS.honoka.faces を -clean に読みかえる） |
| bg-market・bg-zakka（朝の仕入れの背景：外の朝市・店の中の雑貨屋） | A | Codex | 2026-11-18 | art-irai `requests/okashi/bg3.md`（step1＝市場・step2＝雑貨屋・PR #48）・`prep_art.py bg`（16:9 の横960） | 朝の仕入れのタブの背景（昼のチャット） |
| ui-btn-red・ui-btn-wood・ui-pill-cream・ui-pill-choco・ui-tab-on・ui-tab-off・ui-round（全画面のボタン） | A | Codex | 2026-11-18 | art-irai `requests/okashi/ui-buttons.md`（PR #49）・`prep_art.py parts … 640`（緑で区切られた7つを上の段から順に） | 共通のボタン .big・.bake・.go2（赤）・.sub（木）・.pill（クリーム）・.pill.sub（チョコ）・.tab・.round（style.css の「UI の絵」・border-image） |
| ui-tab-bow（えらんだタブのいちごのリボン） | A | Codex（切りわけ） | 2026-11-18 | ui-tab-on のまんなかのリボンを切りわけた（9分割でのびないように）。タブの面のリボンの下は、日よけを左からうつしてつないだ | .tab.on の上のまんなか（::before） |
| ui-<部品>-down・ui-<部品>-off（7つのボタンの押した形・使えない形。部品＝btn-red・btn-wood・pill-cream・pill-choco・tab-on・tab-off・round） | A | Codex | 2026-11-18 | art-irai `requests/okashi/ui-buttons2.md`（PR #51・ui-buttons の絵を編集して2段：step1＝押した・step2＝使えない）・`prep_art.py parts … 640`（ui-buttons と同じ順）。tab-on の2つはリボンを消して下を日よけでつないだ（ui-tab-on と同じ高さ161） | 全部のボタンの :active と disabled（style.css の「UI の絵」の --ufd・--ufo） |
| ui-panel・ui-window・ui-nameplate・ui-diary（紙のパネル・会話の窓・名前の札・日記の紙） | A | Codex | 2026-11-18 | art-irai `requests/okashi/ui-panels.md`（PR #52）・`prep_art.py parts … 640`（上の段から） | ラウンドの結果・おもてなしの結果（ui-panel）／会話の窓・大きく見る画面の説明（ui-window）／会話の名前の札／日記の紙（すべて border-image の9分割） |
| ui-diary-tape（日記の紙のマスキングテープ） | A | Codex（切りわけ） | 2026-11-18 | ui-diary の左上のテープを切りわけた（9分割でのびないように）。紙のテープの下は、右の紙をうつしてつないだ | .diary の左上（::before） |
| logo-ma・logo-ze・logo-o・logo-ka・logo-shi・logo-ya・logo-san・logo-ma-g・logo-ze-g（タイトルロゴの文字・-g は残像と光の型） | C | フォントで描いた文字（Mochiy Pop One・OFL）。AI の絵ではない | 2026-11-18 | 昼のチャット（枝 hiru/logo-tab・H-014）。3倍の大きさの絵（フォントのファイルはビルドが埋めこめないので絵にした） | タイトルのロゴ（src/js/logo.js の logoHTML） |
| op-mix・op-shop-night（オープニング：朝の厨房でまぜるほのか・夜のお店の外観） | A | Codex | 2026-11-18 | art-irai `requests/okashi/op1.md`（step1・step3・PR #54）・`prep_art.py bg`（16:9 の横960）。op-shop-night は bg-shop-out と同じお店を夜に。op-forest（step2）は不合格で op2 に出しなおし | オープニング（昼のチャット・H-015） |
