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
- シートの絵で、となりの絵のはしを手で消したら `python3 -I tools/center_art.py`（片がわだけ余白が残ると、カードの中で絵がずれる・11/20）。出た絵は `fix <名前…>` で置きなおす
- 取りこんだら `python3 -I tools/slim_art.py`（11/19・軽くした記録 assets/slim.json に入る。prep_art.py が同じ強さで保存するので、ほとんどは記録だけ）。art-stock から assets/art へ出した絵にもかける（ビルドが「まだ軽くしていない絵」で知らせる）

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

- ストックの置き場（11/18 夜）：まだゲームで使っていない絵（11/19 にみなもの分も、わかばのカード・戦闘ポーズ・デフォルメも assets/art へ。いまは立ち絵のストック〔3人に9ずつ〕・背景2）は assets/art-stock/ に置く。ビルドは assets/art だけを埋めこむので、index.html が重くならない。使うときに assets/art へ git mv する
## 依頼中（11/18）
- 依頼中：なし（11/19 12時半。minamo-fx・雑貨屋・H-033 の絵も入った）
- 11/18 17時10分 司令塔（art-irai PR #68・game-art-rule.md）：okashi の依頼中は4つまで・@codex は2本まで並べてよい（issue #3 にコメントを2つ別々に・それぞれ「@codex AGENTS.md の決まりで、次の依頼書だけ描いて、カギで送って PR を作って：requests/okashi/<名前1>.md・requests/okashi/<名前2>.md」・2つのコメントで同じ依頼書を書かない）。パスを書かないと依頼中をぜんぶ見る（多くて3つ）。GPT の利用上限が減ってきたら司令塔に教える（2つにもどす）
- 依頼中の取りこみ：なし
- 待ち：なし（11/19 1時。次に頼む絵は、遊んでからの感想と、4人目・5人目の設定が来てから）
- 11/18 しょーくん「ボタンや枠やフレームも妥協することなく全て絵を描き下ろしてほしい」：UI も A（Codex）に。素材は木と真ちゅう＋お菓子の飾り。字はコードで重ねる
- 11/18 司令塔の決まり（game-art-rule.md の okashi の例外）：大きさの変わる枠・ボタンは border-image（9分割）で使える形に描かせる（角・辺・まんなかがはっきり分かれる・辺はくり返しても切れ目が目立たない・まんなかは無地か小さな模様）。押したとき・使えないときの形がいる部品は同じ絵で描かせる（待ちの ui-* に入れた）

## これから頼む絵
- ★3：クッキー以外の形の「○○タワー」（サブレ・カステラ・ショコラ・ドロップ・ゼリー・シュー）と、ちがう形どうしの★3（いまはコードで描いた仮の絵）
- キャラ：あとで水の飴細工職人と草のパティシエ・ほかの食材モンスター

| ui-gingham・ui-gingham-hem・ui-gingham-tab（ギンガムの布の地〔敷きつめる〕・布のへりとステッチ〔9分割・まんなかは抜け〕・材料だなの右のつまみ「›」） | A | Codex | 2026-11-19 | art-irai `requests/okashi/ui-gingham.md`（PR #159）・もとの PNG は art-irai の art/okashi-ui-gingham の out/okashi/ | 共通の部品 .gingham（style.css）・つまみは昼の .mtray::before |
| fx-cutin-honoka・fx-cutin-minamo・fx-cutin-wakaba（スペシャルのカットインの帯：炎・水・若葉） | A | Codex | 2026-11-19 | art-irai `requests/okashi/fx-cutin.md`（PR #160） | night-ui.js の cutIn（.ci-band.art） |
| ui-badge・ui-tag-gold・ui-nametag・ui-hangsign・ui-empty-round・ui-empty-sq（数のバッジ・とくべつの金の札・名札・つるした看板の札・空きのしるし 丸と四角） | A | Codex | 2026-11-19 | art-irai `requests/okashi/ui-misc3.md`（PR #158） | 昼の画面（材料だなの数・とくべつ・陳列の名前と看板・オーブンと陳列の空き）＝昼のチャットが自分の CSS に入れる |

| fx-burst-honoka・fx-burst-minamo・fx-burst-wakaba・fx-slash-honoka・fx-slash-minamo・fx-slash-wakaba（一撃の衝撃と斬撃：炎・水・花びら） | A | Codex | 2026-11-19 | art-irai `requests/okashi/fx-impact.md`（PR #163）・黒い背景は取りこむときに明るさで すけに変えた（#fxl の中では screen が効かない） | battle-fx.js の impactFx（一撃の瞬間） |
| fx-wall-honoka-a・fx-wall-honoka-b・fx-wall-minamo・fx-crack-minamo・fx-shard-minamo-1〜6・fx-wall-wakaba-front・fx-wall-wakaba-back（大技の画面の下から：炎の壁2こま・氷の層とひびとかけら・若葉の前と奥） | A | Codex | 2026-11-20 | art-irai `requests/okashi/fx-wall-honoka.md`・`fx-wall-minamo.md`・`fx-wall-wakaba.md`（PR #167・#168・#166）・黒い背景は明るさで すけに（ほのか・みなも）・わかばは緑を --strict | battle-fx.js の fireWall・iceShatter |
| ui-coin-blank・ui-coin-ok（おなかゲージの左はしの丸・とったチェックの下地） | A | Codex（ui-coin を Claude がコードで加工） | 2026-11-20 | ui-coin の まんなかの泡立て器を けして、なめらかな金（blank）・みどり（ok）でぬった（金のふちはそのまま） | night-ui.js の quotaHTML・style-battle.css の .qd・.qmk.qok .qc |

## 音
| 名前 | 分類 | 道具 | 作った日 | 出どころ | 使う所 |
| --- | --- | --- | --- | --- | --- |
| assets/bgm/hiru.mp3・hiru-2.mp3（昼のお店・2本・どちらも57.6秒の1ループ） | Lyria の曲（AI で作った曲・人の演奏ではない） | koe-irai・Lyria:lyria-3.5（2026-11-21）＝ループ版 <id>_loop.mp3（44.1kHz ステレオ 96kbps・SynthID 入り） | 2026-11-21 | 司令塔（koe-irai の out/_test/lyria-okashi-full・聞きくらべ https://claude.ai/artifact/NKqhQFiuWkcxNZVc31WwNh）・しょーくん「音楽全て完璧すぎ」 | 昼（日ごとに交代・偶数の日が -2・src/js/sound.js の bgmTake）。前のコードの曲（11/19 司令塔）は使っていない |
| assets/bgm/yoru-honoka.mp3・-2（57.6秒・64秒）・yoru-minamo.mp3・-2（105.9秒・54.9秒）・yoru-wakaba.mp3・-2（54.9秒・72.3秒） | Lyria の曲（AI で作った曲・人の演奏ではない） | koe-irai・Lyria:lyria-3.5（2026-11-21）＝ループ版（ほのか＝A 四角い音のリード・みなも＝C エレクトロポップ・わかば＝B かわいいオーケストラ） | 2026-11-21 | 司令塔（同じ所）。わかばの2本めは manifest のつなぎ目の点数が低い（score 0.61・seam 0.63）が、しょーくんが聞いて「問題なし」（11/21） | 夜（その夜のシェフの曲・日ごとに交代・sound.js の bgmNight）。ためしのページでは大きい曲（400KB より上）は snd-pack.mp3 に入れず bgm/ のまま（build.mjs の BIG_BGM・BGM_BIG） |
| assets/bgm/title.mp3・asa.mp3・matome.mp3（タイトル28.8秒・朝32秒・まとめ26.7秒・1ループ）と jg-hirameki・jg-manzoku・jg-nakama（ジングル・1回） | C・コードで作った曲 | tools/bgm/make_bgm_hiru.py（make_bgm.py の部品）・楽器の音 FluidR3_GM（MIT） | 2026-11-19 | 昼のチャット（PR #20・H-034） | 曲はタイトルとプロローグ・朝・まとめ（sound.js の bgmName）・ジングルは se.js の jgPlay（新しいお菓子・大満足・仲間の来店） |
| assets/se/*.mp3（効果音25こ：tap・wipe・card・buy・reroll・serve・hit・mult・star・manzoku・coin・fire・burnt と朝昼の pick・drop・bake・done・place・kanban・soroi・door・heart・sale・soldout・close）と ジングル jg-hirameki・jg-manzoku・jg-nakama・jg-dame | 効果音集（buy だけ C） | 11/21〜 koe-irai・sfx:<id>（Wyzowl SFX Kit・Kenney＝CC0／Oculus Audio Pack 01＝CC BY 4.0）。buy だけ tools/se/make_se.py のまま。音ごとの出どころは下の「効果音の出どころ」 | 2026-11-21 | 昼の PR #30（しょーくんが聞きくらべでえらんだ28こ・koe-irai の sfx/picks/okashi.json）・se.js で残響 | se.js の sePlay・jgPlay（夜のだめだった＝night.js の jg-dame） |
| assets/koe/*.mp3（掛け声35こ：ほのか hono-・みなも mina-・わかば waka-。11/21 わぁ hono-waa・あらあら waka-araara をなくした・みなもの mina-n は「ん」→「うん」） | 音声合成 | koe-irai・Gemini TTS:Leda・Despina・Achernar（gemini-3.8-flash-tts）＝ほのか Leda・みなも Despina・わかば Achernar（11/21〜。前は VOICEVOX） | 2026-11-21 | 声の依頼箱 juice0402/koe-irai の out/okashi/kakegoe-gemini（昼の PR #25・切り分けは tools/koe/） | se.js の koePlay（夜の攻撃・大満足・だめだったとき＝night-ui.js の KOE_ATK・KOE_END／★3・おなか満タン・必殺技・焦げた／冷えた／熟した＝KOE_MORE〔11/21 koe-irai の kakegoe-night2・しょーくんがえらんだ。hono-dekita は「できたっ。」（語尾を下げて短く止める言い方）の1本め。加工で「た」を切ると不自然な音になったので、声の言い方で作りなおした〕／夜のショップで考えている「んー」＝KOE_THINK・waka-maa は使っていない）と朝の mKoe |

### クレジット（クレジットの画面・ストアの説明に入れる）
- 効果音："Oculus Audio Pack 01" by Oculus VR, LLC (https://developers.meta.com/vr/downloads/package/oculus-audio-pack-1/), licensed under CC BY 4.0（11/21〜・Wyzowl と Kenney は CC0 でクレジットの義務なし）
- 楽器の音：FluidR3_GM（Frank Wen・MIT ライセンス）
- 声（Gemini TTS）はクレジットの義務なし（11/21〜。VOICEVOX はもう使っていないので消した）
- ゲームの中では、タイトルとまとめの画面の「せってい」の窓に出す（main.js の optHTML・11/19）

### 効果音の出どころ（11/21 昼の PR #30）
- docs/ART.md の音の行：assets/se の行を「koe-irai・sfx:<id>（集・ライセンス）」に（buy だけは C・tools/se/make_se.py のまま）・ジングルの行も同じ。音ごとの出どころ：
- tap：koe-irai・sfx:wyzowl/foley/foley-wood-touch（Wyzowl SFX Kit・CC0）
- wipe：koe-irai・sfx:wyzowl/whooshes/whoosh-medium-soft（Wyzowl SFX Kit・CC0）
- pick：koe-irai・sfx:wyzowl/pops/pop-medium-in（Wyzowl SFX Kit・CC0）
- drop：koe-irai・sfx:wyzowl/pops/pop-large-bubble（Wyzowl SFX Kit・CC0）
- bake：koe-irai・sfx:wyzowl/whooshes/whoosh-slow-medium（Wyzowl SFX Kit・CC0）
- done：koe-irai・sfx:wyzowl/tones/tone-ding-high（Wyzowl SFX Kit・CC0）
- burnt：koe-irai・sfx:wyzowl/notifications/notification-failure-deflate（Wyzowl SFX Kit・CC0）
- place：koe-irai・sfx:wyzowl/impacts/impact-light-firm（Wyzowl SFX Kit・CC0）
- kanban：koe-irai・sfx:wyzowl/shimmers/shimmer-short-bright（Wyzowl SFX Kit・CC0）
- soroi：koe-irai・sfx:wyzowl/shimmers/shimmer-medium-sparkle（Wyzowl SFX Kit・CC0）
- door：koe-irai・sfx:wyzowl/everyday-props/props-shop-bell（Wyzowl SFX Kit・CC0）
- sale：koe-irai・sfx:wyzowl/money/money-register（Wyzowl SFX Kit・CC0）
- heart：koe-irai・sfx:wyzowl/notifications/notification-success-bubble（Wyzowl SFX Kit・CC0）
- soldout：koe-irai・sfx:wyzowl/notifications/notification-alert-clear（Wyzowl SFX Kit・CC0）
- close：koe-irai・sfx:wyzowl/everyday-props/props-shop-bell（Wyzowl SFX Kit・CC0）・高さ 0.85
- card：koe-irai・sfx:wyzowl/appear-and-vanish/appear-flip-quick（Wyzowl SFX Kit・CC0）
- serve：koe-irai・sfx:oculus/user-interface/UIClick_MagicalOpen_OS_01（Oculus Audio Pack 01・CC BY 4.0）
- hit：koe-irai・sfx:wyzowl/tones/tone-step-1（Wyzowl SFX Kit・CC0）
- mult：koe-irai・sfx:oculus/user-interface/UIMisc_Powerup_OS_01（Oculus Audio Pack 01・CC BY 4.0）
- star：koe-irai・sfx:wyzowl/shimmers/shimmer-medium-bright（Wyzowl SFX Kit・CC0）
- coin：koe-irai・sfx:kenney/rpg/handleCoins（Kenney・CC0）
- reroll：koe-irai・sfx:wyzowl/swipes/swipe-medium-firm（Wyzowl SFX Kit・CC0）
- manzoku：koe-irai・sfx:wyzowl/notifications/notification-success-flourish（Wyzowl SFX Kit・CC0）
- fire：koe-irai・sfx:wyzowl/risers-and-fallers/riser-1s-strong（Wyzowl SFX Kit・CC0）
- jg-hirameki：koe-irai・sfx:oculus/musical/MUSCStngr_LevelUpMallet_OS_01（Oculus Audio Pack 01・CC BY 4.0）
- jg-nakama：koe-irai・sfx:oculus/musical/MUSCStngr_LevelUpOrchestral_OS_02（Oculus Audio Pack 01・CC BY 4.0）
- jg-manzoku：koe-irai・sfx:oculus/musical/MUSCStngr_VictoryMallet_OS_01（Oculus Audio Pack 01・CC BY 4.0）
- jg-dame：koe-irai・sfx:oculus/musical/MUSCStngr_LossMallet_OS_01（Oculus Audio Pack 01・CC BY 4.0）
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
| ui-cook0〜3・ui-finger・ui-bubble・ui-bubble-tail（焼き加減の炎4つ・ヒントの指〔11/21〜 使っていない〕・吹き出しと しっぽ） | A | Codex | 2026-11-18 | art-irai `requests/okashi/ui-icons.md`（PR #64・1536×1024 の2段）・`prep_art.py parts` を上限ちがいで3回（128＝炎としっぽ・160＝指・480＝吹き出し） | 炎 `.ck`（::after に絵・::before で穴に色・数字はコード）・指 `.tipf`（指先は左上のすみ・tips.js の at）・吹き出し `#tipb`／`.cu-bub`（9分割 34・幅15px）・しっぽ `#tipb::before`（左向きは回す）／`.tipb.down::before`／`.cu-bub::after` |
| deco-<8テーマ>-<5か所>（お店のかざり40・テーマ＝妖精のお花畑・ふわもこ・冒険者の山小屋・魔女のアンティーク・飴細工のきらきら・ハーブガーデン・ほかほかベーカリー・モンスターのなかま／場所＝窓べ・天井・壁・床・カウンター） | A | Codex | 2026-11-21 | art-irai `requests/okashi/deco-*.md`（PR #170・#175・しょーくんの OK で昼のチャットが直接たのんだ）・prep_art.py parts 384 --strict（ame・mon は one で1まいずつ）・slim 済み | 昼のお店のかざり（day-scene.js の dDecoHTML）・雑貨屋の一覧の左40px（morning.js の mDecoRows） |
| minamo-atk2・-atk3・-heatup・-heatdown／wakaba-atk2・-atk3・-grow・-jar（みなも・わかばの追加の戦闘ポーズ4ずつ：強い攻撃・とどめ・温める／冷やす・育てる／びんに入れる） | A | Codex | 2026-11-21 | art-irai `requests/okashi/minamo-battle2.md`・`wakaba-battle2.md`（PR #192・#193）。みなもは前と同じ四角 10,24,1019,1530・わかばは 16,34,1010,1508（grow・jar は帽子と足が出るので 0,13,1024,1531 を 994×1474 に）。--strict・はしをぼかす・みなもは すきとおった光にうつった緑だけとった（g−max(r,b) が 34 より上。髪のミント色は 31 まで） | night-ui.js の POSE_MINAMO・POSE_WAKABA（絵がないときは POSE_ALT）・feet.js |
| bg-night-minamo・bg-night-wakaba（夜の舞台の背景：飴の工房・温室のキッチン） | A | Codex | 2026-11-21 | art-irai `requests/okashi/bg-night2.md`（PR #189）・参考 sources/okashi/bg-night.png・`prep_art.py bg` | night-ui.js の NBG（その夜のシェフの背景・なければ bg-night） |
| mon-<7体>-sad（夜のお客さんの しょんぼり顔） | A | Codex | 2026-11-21 | art-irai `requests/okashi/monfaces-sad.md`（PR #190）・元の絵 sources/okashi/mons-all.png（いまの7体を並べた）から1体ずつ切って mon-<id> と同じ大きさに・トカゲ・にじいろクラゲ・ミントうさぎは --strict | おなかの半分にもとどかなかったラウンドの結果・ちょっと満足の夜（night-ui.js の renderNight） |
| mon-mogura・mon-pengin・mon-kaeru・mon-risu（新しい夜のお客さん4体：チョコもぐら・プリンペンギン・まっちゃガエル・ポップコーンりす・まだゲームに出していない） | A | Codex | 2026-11-21 | art-irai `requests/okashi/monsters4.md`（PR #198）・4等分して trim_fit 520・カエルは --strict | 夜のお客さん（world.js の MONSTERS に足すのは、素材と朝のお菓子の絵がそろってから） |
| cust-elf・-2・-3／cust-vamp・-2・-3／cust-tanuki・-2・-3（新しいお客さん：エルフのうたうたい・日傘の吸血鬼のお嬢さま・行商のたぬき）とその うれしい・ざんねんの顔（18まい） | A | Codex | 2026-11-21 | art-irai `requests/okashi/new-elf.md`・`new-vamp.md`・`new-tanuki.md`（PR #183〜#185・step1〜3）・表情は new-*-face・`prep_art.py one … 480`（cust-tanuki は 525） | 昼のお客さん（昼の PR #29・hiru.js の CUST_NEW） |
| ui-aisho・ui-series・ui-aisho-book・ui-forecast・ui-bell（陳列パズルの札・相性帳・予報・呼びこみのベル）／fc-hare・fc-rain・fc-matsuri・fc-ensoku・fc-kotori・fc-kaze・fc-majo（あしたの予報）／chibi-call・chibi-carry（ほのかのちび：呼びこみ・補充） | A | Codex | 2026-11-21 | art-irai `requests/okashi/hiru-ui4.md`（PR #211）・`hiru-forecast.md`（#213）・`honoka-chibi-call.md`（#212） | 昼のパズル・予報・呼びこみ（昼の PR #31） |
| ui-buff-gold・-ember・-pink・-mint・-koge（効果の札：宝石と矢じりのリボン型） | A | Codex | 2026-11-21 | art-irai `requests/okashi/ui-buffchip.md`（PR #195）・`prep_art.py parts … 400`。ミントは緑の背景といっしょに抜けたので、ピンクの札の色を回して作った | カードにかかる札 .buff と計算の札 .fchip（style.css・9分割 49% 11% 49% 20%）。前の ui-chip-* は ほかの札でそのまま |
| fx-numhit-honoka・-minamo・-wakaba・fx-scatter-honoka・-minamo・-wakaba（数字が当たった瞬間の衝撃とかけらの輪） | A | Codex | 2026-11-21 | art-irai `requests/okashi/fx-numhit.md`（PR #196）・黒は明るさで すけに | battle-fx.js の impactFx |
| cg-open・cg-night1・cg-minamo（物語の一枚絵：開店の朝・はじめての夜・みなもが仲間に） | A | Codex | 2026-11-21 | art-irai `requests/okashi/cg-story1.md`（PR #197）・`prep_art.py bg` | 会話の「［絵:cg-open］」の行（talk.js の talkCg・どの会話で出すかは昼の story.js） |
| cg-wakaba・cg-niji・cg-three（物語の一枚絵：わかばが仲間に・にじいろクラゲの夜・3人そろったお店） | A | Codex | 2026-11-21 | art-irai `requests/okashi/cg-story2.md`（PR #204）・`prep_art.py bg` | 会話の「［絵:cg-…］」の行 |
| card-kakao・card-custard・card-maccha・card-popcorn（新しいお客さんがくれる素材のカード・まだゲームに出していない） | A | Codex | 2026-11-21 | art-irai `requests/okashi/cards-newmon.md`（PR #205）・4等分して trim_fit 400・抹茶は --strict・id は仮 | 夜の素材のカード（MATS に足すのは昼のチャットと素材を合わせてから） |
| fx-ame-flower・-ribbon・fx-ice-flower・fx-ame-drops・-swan・-ring／fx-bloom・fx-vine・fx-fruitrain・fx-seed・fx-petalwind・fx-flowerring（みなも・わかばの一撃のかざり） | A | Codex | 2026-11-21 | art-irai `requests/okashi/fx-minamo2.md`・`fx-wakaba2.md`（PR #202・#203）・黒は明るさで すけに・上限320 | battle-fx.js の chefFlourish（ふつうの一撃は1つ・大きい一撃は輪と3つ）・chefFlourishAt（熟した＝fx-bloom・冷えた＝fx-ice-flower） |
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
| ui-flame-tall・ui-flame-mid・ui-flame-wide（鉄板の炎・11/20 黒い背景を明るさで すけに変えた＝screen なしで重ねる） | A | Codex | 2026-11-18 | art-irai `requests/okashi/ui-flame.md`・黒い背景のまま3つに切って上限240の webp（アルファなし） | 鉄板の炎 .tf（.tfire の mix-blend-mode: screen・style.css の「UI の絵 その7」） |（11/20 黒をすけに変えた・screen なし）
| ui-label・ui-strip・ui-tray・ui-tile・ui-ovenslot・ui-purse（こげ茶の木の札・紙の行・木のトレー・木のマス・オーブンの受け皿・がまぐち） | A | Codex | 2026-11-18 | art-irai `requests/okashi/ui-misc1.md`・マス目ごとに切った（scratchpad の gridcut・上限 320・480・480・160・160・128） | 札＝.ov-top>span・.sh-ttl・.sh-coin・.mo-hint・.md-tip・.d-tip・.m-wallet（9分割 49% 15%）／行＝.ms-good・.dragtip・#toast／トレー＝.m-baked・.panel.sum／マス＝.mt・.mw／受け皿＝.mo-slot／がまぐち＝.m-wallet と .mz-wallet の ::before（style.css の「UI の絵 その8」） |
| ui-card-bronze・ui-card-silver・ui-card-gold・ui-card-field（カードのふち 224×360） | A | Codex | 2026-11-18 | art-irai `requests/okashi/ui-cards.md`・4つにマス目で切った（上限360） | カード .pc（調理台のタイルとカットインは前のふち）。窓・リボン・紙の位置に .pc-win・.pc-name・.pc-attr・.pc-text を合わせた（style.css の「UI の絵 その9」） |
| card-amedai・hakucho・oshiro・hanakago・tsuya・nobashi・korodrop・hajike・peroc・ichidrop・candybin・mintame（みなもの主役12・ストック） | A | Codex | 2026-11-18 | art-irai `requests/okashi/cards-minamo1.md`・`cards-minamo2.md`・マス目で切って --strict・ガラスの物は緑のすけを消した（上限300） | 大作の6まい（amedai〜nobashi）は assets/art（11/19・cards.js の MATS）。キャンディの6まい（korodrop〜mintame）は art-stock のまま。11/19 キャンディの6まいと field-dairiseki・yatai も assets/art へ（みなも②） |
| field-oonabe・field-kobo・field-dairiseki・field-yatai・card-yusen・pot・korimizu・amebasami・amebell・shioame・korizato・urokoto・pearl・mizuchi（みなものフィールド4・道具5・素材5・ストック） | A | Codex | 2026-11-18 | art-irai `requests/okashi/cards-minamo3.md`〜`cards-minamo5.md`・マス目で切って --strict（ガラスの物は --despill）・上限300 | oonabe・kobo・道具5・素材5は assets/art（11/19・FIELDS・TOOLS・MATS）。dairiseki・yatai は art-stock のまま（ちいさなキャンディ）。11/19 キャンディの6まいと field-dairiseki・yatai も assets/art へ（みなも②） |
| card-niji・card-minto（レアの素材：にじいろの水あめ・きらきらミント） | A | Codex | 2026-11-18 | art-irai `requests/okashi/cards-minamo5.md`・同上 | 朝の材料・倉庫（MATS の niji・minto。art.js が ART["card-<id>"] を先に使う） |
| special-sable-tower・castella・brownie・candy・jelly・puff（★3 のタワー6） | A | Codex | 2026-11-18 | art-irai `requests/okashi/sweets3.md`・マス目で切った・上限300 | ★3 のカード（同じ形どうし・ちがう形は主役の形のタワー） |
| special-melonpan-tower・creampan・roll・anpan・koronet・pan（菓子パンの★3 のタワー6） | A | Codex | 2026-11-18 | art-irai `requests/okashi/pan3.md`・マス目で切った・上限300 | こね生地の★3（art.js の NOUN_ID にパンの形） |
| minamo-battle・-charge・-atk・-special・-win・-support（みなもの戦闘ポーズ6・ストック） | A | Codex | 2026-11-18 | art-irai `requests/okashi/minamo-battle.md`・minamo と同じ四角（174,13,775,1528・strict・はみ出しははしをぼかす・上限760。scratchpad の gen/posebox.py） | assets/art（11/19・night-ui.js の POSE_MINAMO：攻撃は★のちがいなく atk・温度や台は support） |
| minamo-chibi-think・-cheer・-sit（みなものデフォルメ3・ストック） | A | Codex | 2026-11-18 | art-irai `requests/okashi/minamo-chibi.md`・`three … 320 --strict` | assets/art（11/19・みなもの夜のショップとバトルの舞台・battle-fx.js の chibiName） |
| wakaba（わかばの立ち姿・栗色の三つ編み・庭師風） | A | Codex | 2026-11-18 | art-irai `requests/okashi/wakaba.md`（PR #99）・`one … 760 --strict`。もとの PNG は sources/okashi/wakaba.png | 会話（TALKERS.wakaba のふつう）・あとでタイトル・夜 |
| wakaba-ara・-ufufu・-odoroki・-komari・-wakuwaku・-makasete・-shinmiri・-yorokobi・-naisho（わかばの立ち絵9） | A | Codex | 2026-11-19 | art-irai `requests/okashi/wakaba-poses.md`（PR #103）・gen/posebox.py で wakaba と同じ四角 | 会話（TALKERS.wakaba の faces：あらあら・うふふ・おどろき・こまり顔・わくわく・まかせて・しんみり・よろこび・ないしょ） |
| title-wakaba（タイトルのわかば：くだもののかご） | A | Codex | 2026-11-19 | art-irai `requests/okashi/title-wakaba.md`（PR #104）・one … 760 --strict | タイトル（昼のチャットの LG_CAST） |
| wakaba-battle・-charge・-atk・-special・-win・-support・wakaba-chibi-think・-cheer・-sit（わかばの戦闘ポーズ6・デフォルメ3・ストック） | A | Codex | 2026-11-19 | art-irai `requests/okashi/wakaba-battle.md`・`wakaba-chibi.md`（PR #101・#102） | assets/art（11/19 わかばの夜：HEROES・POSE_WAKABA・デフォルメ） |
| card-sponge・tart・roll・deco・chiffon・hachiroll・garabin・ookibin・ichijam・shimejam・torojam・kirakira・field-hatake・terrace・jamnabe・card-joro・hiryo・kakashi・card-apple-0〜2・card-berry-0〜2（わかばのカード24・ストック） | A | Codex | 2026-11-19 | art-irai `requests/okashi/cards-wakaba1.md`〜`cards-wakaba4.md`（PR #105〜#108）・gen/gridcut.py 3×2・--strict（空のびんは --despill）・上限300 | assets/art-stock/（わかばのビルドを作るとき） |
| card-peach-0〜2・card-grape-0〜2・card-mikan-0〜2・card-kago・card-hatabell（わかばのくだもの3段の残りと道具2・ストック） | A | Codex | 2026-11-19 | art-irai `requests/okashi/cards-wakaba5.md`・`cards-wakaba6.md`（PR #109・#110）・gridcut 3×2・--strict・上限300 | assets/art（11/19 わかばのビルドで使う） |
| honoka-peko・-tsumami・-nemui・-okori・-warai・-tefuri・-hashiru・-yubisashi・-nakiwarai（ほのかの立ち絵ストック9） | A | Codex | 2026-11-19 | art-irai `requests/okashi/honoka-poses2.md`（PR #111）・gen/posebox.py で立ち姿 honoka と同じ四角（162,4,824,1528・上限760） | assets/art-stock/（会話で使うときは assets/art へ・TALKERS.honoka の faces：おなかぺこぺこ・つまみ食い・ねむい・ぷんぷん・大わらい・手をふる・走る・びしっ・うれし泣き） |
| minamo-hohoemi・-mutt・-sashidasu・-yomu・-akubi・-shiteki・-tobinoku・-udemakuri・-tefuri（みなもの立ち絵ストック9） | A | Codex | 2026-11-19 | art-irai `requests/okashi/minamo-poses2.md`（PR #112）・posebox で minamo と同じ四角 | assets/art-stock/（faces：ほほえみ・むっ・飴をどうぞ・レシピを読む・あくび・してき・とびのく・うでまくり・小さく手をふる） |
| wakaba-nemui・-mazeru・-okoru・-ase・-tefuri・-mizuyari・-ajimi・-kangae・-tehe（わかばの立ち絵ストック9） | A | Codex | 2026-11-19 | art-irai `requests/okashi/wakaba-poses2.md`（PR #115）・posebox で wakaba と同じ四角 | assets/art-stock/（faces：ねむそう・まぜまぜ・にこにこ怒り・こまった汗・手をふる・水やり・味見・考えごと・てへっ） |
| bg-farm・bg-candyworks（背景：わかばの森の奥の畑・みなもの飴細工の工房） | A | Codex | 2026-11-19 | art-irai `requests/okashi/bg4.md`・`bg5.md`（PR #113・#114）・まんなかを 16:9 に切って 960×540 | assets/art-stock/（物語やビルドの舞台に） |
| title-bg・title-honoka・title-mon-slime・-hitsuji・-kurage・-tokage・-hiyoko・title-fore（タイトル画面：夜のお店の前・泡立て器のほのか・見上げるモンスター5体・手前のランタンと花） | A | Codex | 2026-11-18 | art-irai `requests/okashi/title-bg.md`・`title-honoka.md`・`title-mons.md`・`title-fore.md`（PR #78・#80・#77・#79）。title-bg は抜かずに 720×1080・title-fore は `--strict` で抜いて大きさはそのまま 720×1080（位置がずれないよう切らない）・title-honoka は one … 760・title-mons は parts … 300。op-mix・op-forest・op-shop-night（前のオープニング）はけずった | タイトル画面（昼のチャットの logo.js の lgTitleHTML。位置は LG_BG・LG_CAST・LG_MONS） |
| mon-tokage・mon-hiyoko・mon-kurage（こんぺいトカゲ・ほのお鳥のひよこ・しずくクラゲの大きい立ち姿・左向き） | A | Codex | 2026-11-18 | art-irai `requests/okashi/monsters2.md`（PR #63・1536×1024）。トカゲのしっぽが3等分の線をこえるので、すき間（x=543・1040）で切って trim_fit 520。トカゲは緑の星を残すため --strict | 夜の舞台のお客さん（monURL が mon-<id> を見る） |
| card-kanten・card-hoshi・card-karamel（しずく寒天・ほしくずシュガー・ほのおカラメル） | A | Codex | 2026-11-18 | art-irai `requests/okashi/cards12.md`（PR #62）・`prep_art.py three … 300` | 夜のふしぎな素材のカード（MATS の alt より先） |
| field-nobi・field-suku・field-decodai（わかばのフィールド：のびのび肥料・すくすく肥料・デコレーション台） | A | Codex | 2026-11-19 | art-irai `requests/okashi/fields-wakaba.md`（PR #118）・`prep_art.py three … 300 --strict` | FIELDS の alt より先 |
| jam-apple・-berry・-peach・-mikan・-grape・-mix（飴ジャムで生まれる★3のジャム） | A | Codex | 2026-11-19 | art-irai `requests/okashi/jams.md`（PR #119）・`prep_art.py parts … 300` | art.js の 'j:'（ぜんぶちがう実は jam-mix） |
| special-sponge・-tart・-roll・-deco・-chiffon・-hachiroll（★3のくだものケーキ） | A | Codex | 2026-11-19 | art-irai `requests/okashi/special-cake.md`（PR #117・cards-wakaba1 を編集）・`prep_art.py parts … 300 --strict` | art.js の 'c:' と ★3 |
| special-amedai・-hakucho・-oshiro・-hanakago・-tsuya・-nobashi（★3の大作の飴細工） | A | Codex | 2026-11-19 | art-irai `requests/okashi/special-taisaku.md`（PR #120・cards-minamo1 を編集）・`prep_art.py parts … 300 --strict` | art.js の ★3 |
| mat-mugi・-hachimitsu・-milk・-egg・-ichigo・-mizuame・-herb・sweet-parfait（朝の素材7とまぜまぜパフェ） | A | Codex | 2026-11-19 | art-irai `requests/okashi/hiru-mats.md`（PR #123）・`prep_art.py parts … 192 --strict` | 昼の matIcon・candyIcon（H-027） |
| sweet-<素材>-<素材>（朝のお菓子・id を abc 順。基本どうし1の8つ） | A | Codex | 2026-11-19 | art-irai `requests/okashi/hiru-sweets1.md`（PR #125）・`prep_art.py parts … 192` | 昼の candyIcon（H-027）。hiru-sweets2〜4・hiru-mon-* も同じ形 |
| special-korodrop・-hajike・-peroc・-ichidrop・-candybin・-mintame（★3のちいさなキャンディ） | A | Codex | 2026-11-19 | art-irai `requests/okashi/special-candy.md`（PR #124・cards-minamo2 を編集）・`prep_art.py parts … 300 --strict` | art.js の ★3 |
| special-garabin・-jamnabe・-ichijam・-shimejam・-torojam・-kirakira（★3の飴ジャムのカード） | A | Codex | 2026-11-19 | art-irai `requests/okashi/special-jam.md`（PR #126・cards-wakaba2 を編集）・`prep_art.py parts … 300 --strict` | art.js の ★3 |
| minamo-battle〜-support・wakaba-battle〜-support（戦闘ポーズ6ずつを切りなおし） | A | Codex | 2026-11-19 | もとの `art/okashi-minamo-battle`・`art/okashi-wakaba-battle` の _step1〜6 を、6まいぜんぶが入る四角（みなも 10,24,1019,1530・わかば 16,34,1010,1508）で `prep_art.py box … 760 --strict` | 11/19 しょーくん「みなもの足が切れてる」（立ち絵と同じ四角では足が出ていた） |
| mon-<id>-eat・mon-<id>-happy（スライム・くもひつじ・こんぺいトカゲ・ひよこ・しずくクラゲの食べる顔とまんぞく顔） | A | Codex | 2026-11-19 | art-irai `requests/okashi/monfaces1.md`・`monfaces2.md`（PR #131・#132・元の絵を編集）・元の mon-<id> と同じ四角で `prep_art.py box … 520` | battle-fx.js の monFace（当たると -eat）・night-ui.js（まんぞく！と結果で -happy） |
| sweet-…（朝のお菓子：基本どうし2の7つ・水あめ6つ） | A | Codex | 2026-11-19 | art-irai `requests/okashi/hiru-sweets2.md`・`hiru-sweets3.md`（PR #129・#130）・`prep_art.py parts … 192` | 昼の candyIcon（H-027） |
| sweet-…（朝のお菓子：ハーブ7つ） | A | Codex | 2026-11-19 | art-irai `requests/okashi/hiru-sweets4.md`（PR #134）・`prep_art.py parts … 192 --strict` | 昼の candyIcon（H-027） |
| ui-pow-minamo・ui-pow-wakaba・ui-medal-minamo・ui-medal-wakaba（みなも＝飴・わかば＝若葉の味パワーの紋章と舞台のメダル） | A | Codex | 2026-11-19 | art-irai `requests/okashi/ui-chefmarks.md`（PR #135）・`prep_art.py parts … 180 --strict` | cards-ui.js の powBadge（pw-<シェフ>）・style-battle.css の .dc-medal（炎はほのかだけ） |
| ui-frost・ui-steam・ui-drop0〜3・ui-drop-ice・ui-soroi（みなもの飴の台の霜と湯気・大作の大きさのしずく・昼のおそろいのリボン） | A | Codex | 2026-11-19 | art-irai `requests/okashi/ui-minamo.md`（PR #136）・`prep_art.py parts … 320 - - - - ui-drop0 …`（湯気が3つに分かれる）・霜と湯気は明るさで透けを作りなおし | style-battle.css の .tcold::after・.tst・.ck.am／style.css の .d-soroi |
| mon-nijikurage-eat・-happy・mon-mintousagi-eat・-happy（レアの食べる顔とまんぞく顔） | A | Codex | 2026-11-19 | art-irai `requests/okashi/monfaces3.md`（PR #137）・元の mon-<id> と同じ四角で `box … 520 --strict` | monFace・happy の顔 |
| fx-sprout・fx-sprout-bloom・fx-leafband・fx-leaf・fx-petal・fx-flower（わかばの夜：マスの下からのびる植物・調理台の若葉・舞う葉と花） | A | Codex | 2026-11-19 | art-irai `requests/okashi/fx-wakaba.md`（PR #139）・`prep_art.py parts … 320 --strict` | battle-fx.js の sproutFx・vineHTML |
| sweet-<モンスター素材>-<形の素材>（朝のお菓子：スライムゼリー・ひつじホイップ・にじいろ水あめ×7つずつ） | A | Codex | 2026-11-19 | art-irai `requests/okashi/hiru-mon-zeri.md`・`-hoippu`・`-niji`（PR #140〜#142）・`prep_art.py parts … 192` | 昼の candyIcon（H-027） |
| キャラが大きく出る絵 honoka*・minamo*・wakaba*（立ち絵・表情・戦闘ポーズ 58まい＋ストック 27まい・chibi と -clean はのぞく）を作りなおし | A | Codex | 2026-11-19 | H-032：上の行と同じもとの PNG（art-raw・art-irai の art/okashi-<名前> の枝）・同じ四角・同じ抜き方で、上限1520（＝もとの大きさ・box は大きくしない）・quality 88・アルファ85（slim_art.py の big_chara）。はみ出しをぼかすのは honoka の charge・atk2・atk3・special・win・heatup・field・burnt と minamo-tobinoku だけ（いまの絵とくらべて合わせた） | 会話の立ち絵がぼやけないように（11/19 しょーくん「圧縮しすぎて画質荒く」）。-clean の6まいは昼のチャットの絵なので、まだ760 |
| sweet-<モンスター素材>-<形の素材>（朝のお菓子：ミント・ほしぞら・こんがり・ひんやり×7つずつ） | A | Codex | 2026-11-19 | art-irai `requests/okashi/hiru-mon-minto.md`・`-hoshi`・`-karamel`・`-kanten`（PR #144〜#147）・`prep_art.py parts … 192`（ミントは --strict） | 昼の candyIcon（H-027 の残り。これで朝昼のお菓子はぜんぶ描き下ろし） |
| good-tatekanban・showcase・hana・cushion・lamp・garland・plant／tool-oven・sand・doll・bell（雑貨屋のグッズ7・べんり道具4） | A | Codex | 2026-11-19 | art-irai `requests/okashi/hiru-goods1.md`・`hiru-goods2.md`（PR #149・#152）・`prep_art.py parts … 128 --strict` | 雑貨屋の一覧の左 40px（mGoodIco・H-027 の残り） |
| ui-book・ui-mada・ui-sold・fx-bird・fx-butterfly（レシピ帳の本・まだのお菓子のふた・売れた！の札・窓の外の小鳥とちょうちょ） | A | Codex | 2026-11-19 | art-irai `requests/okashi/hiru-ui1.md`（PR #150）・`parts … 240` | H-033 の入口（昼のチャットのコード）。字はコード |
| ui-garland（お祭りの日の旗・横にくりかえす） | A | Codex | 2026-11-19 | art-irai `requests/okashi/hiru-garland.md`（PR #151）・`parts … 640`（ひもは左右のはしの同じ高さ＝つながる） | H-033：お祭りの日の舞台の上（.dstage.ev-matsuri.has-garland） |
| fx-snow・fx-bubble・fx-iceshard・fx-frost（みなもの夜の空気：雪の結晶・飴の泡・氷のかけら・霜のすみ） | A | Codex | 2026-11-19 | art-irai `requests/okashi/minamo-fx.md`（PR #155）・4つのます目で切って、緑のすけは明るさで作りなおした（白くすける絵の決まり）・上限320 | battle-fx.js の aquaHTML（.aqua.art の雪・泡・4すみの霜 .aq-fc）・aquaShards（冷えた瞬間のかけら） |
