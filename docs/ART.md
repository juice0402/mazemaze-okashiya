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
- 依頼中（11/18 22時45分〜・4つまで）：art-irai `requests/okashi/ui-misc1.md`・`ui-cards.md`（@codex 1本目）と `cards-minamo1.md`・`cards-minamo2.md`（@codex 2本目）。minamo-poses・title-minamo・cards15・ui-flame とそれより前の依頼は済
- 11/18 17時10分 司令塔（art-irai PR #68・game-art-rule.md）：okashi の依頼中は4つまで・@codex は2本まで並べてよい（issue #3 にコメントを2つ別々に・それぞれ「@codex AGENTS.md の決まりで、次の依頼書だけ描いて、カギで送って PR を作って：requests/okashi/<名前1>.md・requests/okashi/<名前2>.md」・2つのコメントで同じ依頼書を書かない）。パスを書かないと依頼中をぜんぶ見る（多くて3つ）。GPT の利用上限が減ってきたら司令塔に教える（2つにもどす）
- 依頼中の取りこみ：`ui-misc1`（parts・上限ちがい・皮は style.css の「UI の絵」）／`ui-cards`（カードのふち）／`cards-minamo1`・`cards-minamo2`（parts … --strict・上限300・名前は依頼書）
- 待ち（この順・11/18 22時半 しょーくん「夜のうちに作れる絵・必要になるかもしれない絵・ボタン・作り込んでない所も全部」「ほのか・みなも・わかばの立ち絵も増産してストック」「おすすめで進めて」）：`cards-minamo3`〜`cards-minamo5` → `sweets3`・`pan3`（★3のタワー）→ `minamo-battle`・`minamo-chibi` → `wakaba` → `wakaba-poses`・`title-wakaba`・`wakaba-battle`・`wakaba-chibi`（wakaba.png を置いてから）→ `cards-wakaba1`〜`cards-wakaba6` → `honoka-poses2`・`minamo-poses2`・`wakaba-poses2`（立ち絵のストック）。カードの名前と id はぽぽちの仮
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
| bg-day-mado・bg-day-mado-glow（昼のお店の3つの窓のガラスだけの型・窓のまわりの光） | A（bg-day から切り抜いた型。決まりでは切り抜いただけも A）・glow はその型をぼかしたもの | ぽぽち【okashi-hiru】が tools/mado.py で bg-day から作った（新しく AI で描いた絵ではない） | 2026-11-18 | bg-day・`tools/mado.py` | 昼の外の明るさ（day-scene.js の .ds-mado・.ds-glow・style-hiru.css の .dstage の --p・H-021） |
| cust-kodomo・cust-gakusei・cust-otona・cust-obaachan（お客さん：妖精の子・けもみみの子・冒険者・魔女のおばあちゃんの正面・胸から上・ふつう） | A | Codex | 2026-11-18 | art-irai `requests/okashi/customers3.md`（step1〜4・PR #71。11/18 18時すぎに前の町の人〔customers1・PR #43〕から入れかえ）・`prep_art.py one … 480`（4まいとも高さ480。こどもを小さく見せるのはコード） | 昼のカウンター（-happy・-sad はまだ前の町の人＝customers4 待ち） |
| cust-<id>-happy・cust-<id>-sad（お客さん4人の うれしい・ざんねん。id＝kodomo・gakusei・otona・obaachan） | A | Codex | 2026-11-18 | art-irai `requests/okashi/customers2.md`（step1〜8・PR #45・cust-* のもとの絵から編集）・`prep_art.py one … 480`（ふつうの絵と同じ大きさ） | 昼のお客さん（すきな味があった・なかった） |
| honoka-<表情>-clean（すすなしの立ち絵6まい：yaruki・joy・fuan・kangaeru・wakuwaku・kandou） | A | Codex（のち色合わせで、すすを消した） | 2026-11-18 | もとの立ち絵（honoka-poses・honoka-faces）から、ほっぺのすすを消した（昼のチャット・枝 hiru/susu） | はじめて焼くまで（1日目の朝・プロローグ）の会話の立ち絵（morning.js の mSusuOn が TALKERS.honoka.faces を -clean に読みかえる） |
| bg-zakka（雑貨屋の背景：店の中）。bg-market（外の朝市）は 11/18 H-018 で朝の仕入れの画面がなくなり使わないので、けずった（もとの絵は art-irai の bg3 の PR の枝） | A | Codex | 2026-11-18 | art-irai `requests/okashi/bg3.md`（step1＝市場・step2＝雑貨屋・PR #48）・`prep_art.py bg`（16:9 の横960） | 朝の仕入れのタブの背景（昼のチャット） |
| ui-btn-red・ui-btn-wood・ui-pill-cream・ui-pill-choco・ui-tab-on・ui-tab-off・ui-round（全画面のボタン） | A | Codex | 2026-11-18 | art-irai `requests/okashi/ui-buttons.md`（PR #49）・`prep_art.py parts … 640`（緑で区切られた7つを上の段から順に） | 共通のボタン .big・.bake・.go2（赤）・.sub（木）・.pill（クリーム）・.pill.sub（チョコ）・.tab・.round（style.css の「UI の絵」・border-image） |
| ui-tab-bow（えらんだタブのいちごのリボン） | A | Codex（切りわけ） | 2026-11-18 | ui-tab-on のまんなかのリボンを切りわけた（9分割でのびないように）。タブの面のリボンの下は、日よけを左からうつしてつないだ | .tab.on の上のまんなか（::before） |
| ui-<部品>-down・ui-<部品>-off（7つのボタンの押した形・使えない形。部品＝btn-red・btn-wood・pill-cream・pill-choco・tab-on・tab-off・round） | A | Codex | 2026-11-18 | art-irai `requests/okashi/ui-buttons2.md`（PR #51・ui-buttons の絵を編集して2段：step1＝押した・step2＝使えない）・`prep_art.py parts … 640`（ui-buttons と同じ順）。tab-on の2つはリボンを消して下を日よけでつないだ（ui-tab-on と同じ高さ161） | 全部のボタンの :active と disabled（style.css の「UI の絵」の --ufd・--ufo） |
| ui-panel・ui-window・ui-nameplate・ui-diary（紙のパネル・会話の窓・名前の札・日記の紙） | A | Codex | 2026-11-18 | art-irai `requests/okashi/ui-panels.md`（PR #52）・`prep_art.py parts … 640`（上の段から） | ラウンドの結果・おもてなしの結果（ui-panel）／会話の窓・大きく見る画面の説明（ui-window）／会話の名前の札／日記の紙（すべて border-image の9分割） |
| ui-diary-tape（日記の紙のマスキングテープ） | A | Codex（切りわけ） | 2026-11-18 | ui-diary の左上のテープを切りわけた（9分割でのびないように）。紙のテープの下は、右の紙をうつしてつないだ | .diary の左上（::before） |
| ui-stage-frame・ui-stage-medal（夜の舞台の額縁・上のまんなかのメダル） | A | Codex | 2026-11-18 | art-irai `requests/okashi/ui-stage.md`（PR #56・1086×1448 のたて長）・`prep_art.py parts … 400 ui-stage-frame -` と `parts … 150 - ui-stage-medal`。額縁は9分割（角74px・木のふち37px・辺は round）・メダルはコードで重ねる |
| ui-shop（夜のショップの板：しましまの日よけ＋木の板・ふちなし） | A | Codex | 2026-11-18 | art-irai `requests/okashi/ui-shop.md`（PR #61・1024×1536）・`prep_art.py parts … 400 ui-shop`（緑なし＝まるごと）。上52px の日よけは border-image の上のふち（高さは画面のはばに合わせる）・板はまんなかでのばす | 夜のショップ `.night .shopov`（朝の仕入れ .mshop はまだ前の形・昼のチャットと相談） |
| ui-board-tray・ui-quota・ui-slot・ui-fslot・ui-coin・ui-heat・ui-price・ui-ribbon（調理台・おなかの帯・空きマス・場のマス・コイン・火力のメーター・値札・ミントのリボン） | A | Codex | 2026-11-18 | art-irai `requests/okashi/ui-board.md`（PR #60・1536×1024 の4段）・`prep_art.py parts` を上限ちがいで4回（640＝調理台と帯・220＝マス2つ・96＝コイン・300＝メーターと値札とリボン）。リボンはミントが緑に近いので `--strict` | 調理台 `.tiles`（9分割 30）・おなかの帯 `.qbar`（左右19）・空きマス `.tslot`／場のマス `.fslot`（まるごと）・コイン `.sh-coin i`／`.sh-price i`／`.sh-roll .cn`・火力のメーター `.heat-bar`（まるごと・マスに火の色）・値札 `.sh-price`（左62）・まぜの札 `.mixmark`／`.tslot.can::before`（左右28） |
| ui-cook0〜3・ui-finger・ui-bubble・ui-bubble-tail（焼き加減の炎4つ・ヒントの指・吹き出しと しっぽ） | A | Codex | 2026-11-18 | art-irai `requests/okashi/ui-icons.md`（PR #64・1536×1024 の2段）・`prep_art.py parts` を上限ちがいで3回（128＝炎としっぽ・160＝指・480＝吹き出し） | 炎 `.ck`（::after に絵・::before で穴に色・数字はコード）・指 `.tipf`（指先は左上のすみ・tips.js の at）・吹き出し `#tipb`／`.cu-bub`（9分割 34・幅15px）・しっぽ `#tipb::before`（左向きは回す）／`.tipb.down::before`／`.cu-bub::after` |
| ui-pow・ui-star・ui-band・ui-stamp（味パワーの紋章・★・はじめの帯・まんぞく！のハンコ） | A | Codex | 2026-11-18 | art-irai `requests/okashi/ui-parts.md`（PR #65・1536×1024 の2×2）・`prep_art.py parts` を上限ちがいで4回（160＝紋章・96＝星・640＝帯・240＝ハンコ） | 紋章 `.pc-pow::before`・★ `.pc-star i`・帯 `.bi-band`（左右120を9分割・-5度に回す・字も同じ角度）・ハンコ `.vbox.result.ok .r-msg` |
| ui-chip-gold・ui-chip-ember・ui-chip-pink・ui-chip-mint・ui-chip-koge・ui-medal-ring（計算の札4色＋こげ茶・発動のメダルのふち） | A | Codex | 2026-11-18 | art-irai `requests/okashi/ui-chips.md`（PR #66・1536×1024 の2段）・`prep_art.py parts … --strict` を上限ちがいで2回（240＝札・160＝メダル）。ミントの札は緑に近く下半分が抜けたので、外の緑だけを「つながっている所」で抜いて切りなおした | 札 `.fchip.fchip`（9分割 49% 18%〔こげ茶は 13%〕・幅19px 20px・色は c-*）・メダル `.fh-ico.fh-ico::after`（穴を54pxの丸に合わせる） |
| ui-cabinet・ui-shelf-board・ui-basket・ui-kanban（飾り棚の外わく・棚板・カゴ・看板） | A | Codex | 2026-11-18 | art-irai `requests/okashi/ui-day.md`（PR #67・1536×1024 の3×2）・`prep_art.py parts` を上限ちがいで2回（640＝外わくと棚板・240＝カゴと看板）。4 オーブンは朝のキッチンの背景に描いてあるので使わない・5 びんはガラスに緑がすけるので ui-day2 の ui-jar を使う（どちらも取りこまない） | 外わく `.dcase.dcase::after`（9分割 90・幅34px・四すみのお菓子がマスの角にかかる）・棚板は段の左はしのマスの `::before`（段のはばいっぱい・はし60・z-index:-1）・カゴ `.dslot:not(.kan)::after`・看板 `.dslot.kan` の背景（style.css の「UI の絵 その5」） |
| honoka-charge・atk1・atk2・atk3・special・win・support・heatup・heatdown・knead・field・burnt（ほのかの戦闘ポーズ12・右向き・木のヘラ） | A | Codex | 2026-11-18 | art-irai `requests/okashi/honoka-battle2.md`（PR #69・step1〜6）・`honoka-battle3.md`（PR #70・step1〜6）。元の絵 sources/okashi/honoka-battle.png を編集。honoka-battle と同じ四角（42,168,991,1341・高さ760）で切った。四角からはみ出す絵（攻撃★3の炎・必殺技のうずなど）は、上と左右のはし12pxをぼかした | 夜の舞台の大きいほのか（night-ui.js の POSE・heroPose） |
| ui-sign・ui-jar・ui-think・ui-think-tail（営業中の札・評判のびん〔中がぬける〕・思っている吹き出しと小さな丸2つ） | A | Codex | 2026-11-18 | art-irai `requests/okashi/ui-day2.md`（PR #72・2×2）・`prep_art.py parts` を上限ちがいで4回（320＝札・240＝びん・480＝吹き出し・128＝丸2つ） | 札 `.ds-sign.ds-sign`（板は縦51%から下・字はコード）・びん `.jar.jar::after`（ハートとたまった色は胴 `.jar-in` の中＝びんのうしろ）・吹き出し `.cu-bub.cu-bub.think`（9分割 70・幅21px）としっぽ `::after`（左右反転）（style.css の「UI の絵 その6」） |
| cust-<id>-happy・cust-<id>-sad（ファンタジーのお客さん4人のうれしい・ざんねん） | A | Codex | 2026-11-18 | art-irai `requests/okashi/customers4.md`（PR #75・step1〜8・奇数＝happy）・元の絵 sources/okashi/cust2-<id>.png・`prep_art.py one … 480` | 昼のカウンター |
| cust-kodomo-2・-3・cust-gakusei-2・-3・cust-otona-2・-3・cust-obaachan-2・-3（見た目ちがいの8人） | A | Codex | 2026-11-18 | art-irai `requests/okashi/customers5.md`（PR #76・step1〜8）・`prep_art.py one … 480`。表情は customers6・7（待ち） | 昼のカウンター（day-scene.js の custVariants） |
| card-melonpan・card-creampan・card-cinnamon・card-anpan・card-koronet・card-tanebin（こね生地の菓子パン6） | A | Codex | 2026-11-18 | art-irai `requests/okashi/cards13.md`・`cards14.md`（PR #73・#74）・`prep_art.py three … 300` | 夜のカード（art.js が ART["card-<id>"] を先に使う） |
| cust-<id>-2-happy・-sad・cust-<id>-3-happy・-sad（見た目ちがいの8人の うれしい・ざんねん） | A | Codex | 2026-11-18 | art-irai `requests/okashi/customers6.md`・`customers7.md`（PR #83・#84・奇数＝happy）・元の絵 sources/okashi/cust5-<id>-<n>.png・`prep_art.py one … 480` | 昼のカウンター（custVariants） |
| minamo（みなもの立ち姿・水色のひとつ結び・作務衣） | A | Codex | 2026-11-18 | art-irai `requests/okashi/minamo.md`（PR #81）・`prep_art.py one … 760 --strict`（ふつうの抜き方だと水色の髪がくすむ）。もとの PNG は sources/okashi/minamo.png（ポーズの元の絵） | 会話（talk.js の TALKERS.minamo ふつう）・あとでタイトル・夜 |
| mon-nijikurage・mon-mintousagi（レアモンスター：にじいろクラゲ・ミントうさぎ） | A | Codex | 2026-11-18 | art-irai `requests/okashi/monsters3.md`（PR #82）・`prep_art.py two … 520 --strict` | 夜の舞台・会話（monURL が ART["mon-<id>"] を先に使う） |
| minamo-sumashi・-jito・-tameiki・-tere・-shinken・-bikkuri・-soppo・-kangae・-shonbori（みなもの立ち絵9） | A | Codex | 2026-11-18 | art-irai `requests/okashi/minamo-poses.md`・`prep_art` の key_green_strict で minamo と同じ四角（174,13,775,1528・上限760）。はみ出す絵ははし12pxをぼかした | 会話（talk.js の TALKERS.minamo の faces：すまし・ジト目・ためいき・照れ・真剣・びっくり・そっぽ・考える・しょんぼり） |
| title-minamo（タイトルのみなも：指先に飴細工の小鳥） | A | Codex | 2026-11-18 | art-irai `requests/okashi/title-minamo.md`・`one … 760 --strict` | タイトル（昼のチャットの LG_CAST） |
| card-panetane・field-menbo・field-karumenbo（パン種・力のめん棒・軽量めん棒） | A | Codex | 2026-11-18 | art-irai `requests/okashi/cards15.md`・`three … 300` | こね生地のカード |
| ui-flame-tall・ui-flame-mid・ui-flame-wide（鉄板の炎・黒い背景のまま） | A | Codex | 2026-11-18 | art-irai `requests/okashi/ui-flame.md`・黒い背景のまま3つに切って上限240の webp（アルファなし） | 鉄板の炎 .tf（.tfire の mix-blend-mode: screen・style.css の「UI の絵 その7」） |
| title-bg・title-honoka・title-mon-slime・-hitsuji・-kurage・-tokage・-hiyoko・title-fore（タイトル画面：夜のお店の前・泡立て器のほのか・見上げるモンスター5体・手前のランタンと花） | A | Codex | 2026-11-18 | art-irai `requests/okashi/title-bg.md`・`title-honoka.md`・`title-mons.md`・`title-fore.md`（PR #78・#80・#77・#79）。title-bg は抜かずに 720×1080・title-fore は `--strict` で抜いて大きさはそのまま 720×1080（位置がずれないよう切らない）・title-honoka は one … 760・title-mons は parts … 300。op-mix・op-forest・op-shop-night（前のオープニング）はけずった | タイトル画面（昼のチャットの logo.js の lgTitleHTML。位置は LG_BG・LG_CAST・LG_MONS） |
| mon-tokage・mon-hiyoko・mon-kurage（こんぺいトカゲ・ほのお鳥のひよこ・しずくクラゲの大きい立ち姿・左向き） | A | Codex | 2026-11-18 | art-irai `requests/okashi/monsters2.md`（PR #63・1536×1024）。トカゲのしっぽが3等分の線をこえるので、すき間（x=543・1040）で切って trim_fit 520。トカゲは緑の星を残すため --strict | 夜の舞台のお客さん（monURL が mon-<id> を見る） |
| card-kanten・card-hoshi・card-karamel（しずく寒天・ほしくずシュガー・ほのおカラメル） | A | Codex | 2026-11-18 | art-irai `requests/okashi/cards12.md`（PR #62）・`prep_art.py three … 300` | 夜のふしぎな素材のカード（MATS の alt より先） |
