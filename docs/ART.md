# 絵と音の一覧（まぜまぜおかし屋）

決まりのもと：ネット副業プロジェクトの `claude/game-art-rule.md`

## 絵の道具
- ハイグラ版の絵は、最初から全部 Codex（絵の依頼箱 juice0402/art-irai）で描く（11/17 しょーくん）。理由：Canva の AI の枠を今月使い切ったのと、カードの画風をそろえたいため
- 画風：やわらかいアニメ調（なめらかな厚塗り・あたたかい光）。カードは物だけを大きく、背景は無地
- ほのか：元気な見習いパティシエ（10代後半くらい）。赤いポニーテールで毛先がオレンジ・白いコック帽とコート・赤いエプロン
- 立ち絵は、画風が変わらないうちにある程度作り置きする（11/17 しょーくん）。会話と戦闘は右向き

## 取りこみ方
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

## これから頼む絵
- ★3：クッキー以外の形の「○○タワー」（サブレ・カステラ・ショコラ・ドロップ・ゼリー・シュー）と、ちがう形どうしの★3（いまはコードで描いた仮の絵）
- 朝と昼の画面の背景（いまはドットの場面）
- キャラ：あとで水の飴細工職人と草のパティシエ・ほかの食材モンスター

## 音
- 掛け声（「えいっ」「はっ」など）は、あとで声の依頼箱 juice0402/koe-irai（VOICEVOX）で作る。クレジット画面に「音声合成：VOICEVOX:…」の1行
