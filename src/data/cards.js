/* ==== データ：カード・フィールド・シェフ・レシピ（ほのかの火力クッキーのビルド・11/17 夕方の仕様 claude/okashi-battle-spec.md） ====
   種類（cat）：dough 生地／mat 素材／tool 道具／burnt 焦げ／field フィールド。役目（role）：攻撃・支援・火力・仕入れ
   生地はビルドごと（いまはクッキー）。素材と道具は、ほのかのビルドどうしで共通（ほかのシェフは、素材も道具も別）
   fx（カードの動き）：
     dmg ダメージ／spd 焼けるはやさ（+1 はやい・−1 おそい）／lead 先頭にあるとダメージ×lead
     sai いちばん最後にあると、焼き加減サイコーの生地1枚につきダメージ×sai（★2は+0.5・★3は+1）／bitter 焦げると★2の焦げ焦げクッキーになる
     nb となりのカードのダメージ+nb／next つぎにダメージを出すカード×next／fin いちばん最後にあると、このラウンドのダメージ合計×fin
     rally 先頭にあると、このラウンドの攻撃カードぜんぶダメージ+rally／again 右どなりがもう again 回うごく
     heat 発動すると鉄板の火力が heat 段階かわる／sear 発動すると右どなりの生地の焼き加減+sear／call つぎの仕入れにフィールドが1枚出る
     noburn 焦げない（★3の生地）／stop 置いているあいだ、ほかの生地は焼き加減サイコーで止まる
   ★：★1どうし→★2、★2どうし→★3（STAR_MUL 倍）。★3は完成形でまぜられない */

/* 食材（生地と素材）：ぜんぶモンスター食材。朝はレシピの材料にもなる
   name はくわしい所で出すフルの名前、short はカードに出す短い名前。taste は昼のお客さんの好み、adj・noun はお菓子の名前、nr は名前の主役になる強さ */
const MATS = {
  /* クッキーのビルドの生地（攻撃） */
  komugi:   { cat: 'dough', name: 'フェアリー粉のクッキー生地', short: 'クッキー生地', taste: 'さくさく', adj: 'さくさく', noun: 'クッキー', nr: 9, value: 20, col: '#e4c58a', fx: { dmg: 30 } },
  dosshiri: { cat: 'dough', name: 'ゴーレム粉のどっしり生地', short: 'どっしり生地', taste: 'こくまろ', adj: 'どっしり', noun: 'クッキー', nr: 9, value: 25, col: '#a8743c', fx: { dmg: 60, spd: -1 } },
  hinoko:   { cat: 'dough', name: 'サラマンダーのひのこ生地', short: 'ひのこ生地', taste: 'こんがり', adj: 'ひのこ', noun: 'クッキー', nr: 9, value: 20, col: '#f0702a', fx: { dmg: 20, spd: 1 } },
  ichiban:  { cat: 'dough', name: 'いちばんのりクッキー生地', short: 'いちばん生地', taste: 'さくさく', adj: 'いちばん', noun: 'クッキー', nr: 9, value: 20, col: '#f6d36b', fx: { dmg: 30, lead: 2 } },
  shime:    { cat: 'dough', name: 'しめくくりクッキー生地', short: 'しめくくり生地', taste: 'さくさく', adj: 'しめの', noun: 'クッキー', nr: 9, value: 20, col: '#e8a0b0', fx: { dmg: 20, sai: 1.4 } },
  horoniga: { cat: 'dough', name: 'ほろにがココア生地', short: 'ほろにが生地', taste: 'こんがり', adj: 'ほろにが', noun: 'クッキー', nr: 9, value: 20, col: '#6b3a1e', fx: { dmg: 30, bitter: 1 } },
  /* こね生地のビルドの生地（主役・菓子パン。11/18 H-012・名前と数字はぽぽちの仮）。pan＝パン生地（パン生地どうしをまぜると「こねる」）・tane＝パン種（ショップに出ない・うっても0コイン）
     nr はお菓子の素材（いちばん大きいのは 6）より大きくして、まぜた名前の主役がいつもパンになるように。nshort は名前が8文字をこえるときの短い形。alt はカードの絵が届くまでの仮の絵 */
  melonpan: { cat: 'dough', pan: 1, name: 'さくさく皮のメロンパン生地', short: 'メロンパン生地', nshort: 'メロン', taste: 'さくさく', adj: 'さくさく', noun: 'メロンパン', nr: 8.5, value: 20, col: '#f2cf6e', alt: 'candy-sable', fx: { dmg: 15, perKone: 3 } },
  creampan: { cat: 'dough', pan: 1, name: 'とろーりクリームパン', short: 'クリームパン', nshort: 'クリーム', taste: 'とろーり', adj: 'とろり', noun: 'クリームパン', nr: 8, value: 20, col: '#f6e0a8', alt: 'candy-puff', fx: { dmg: 10, tane2: 1 } },
  cinnamon: { cat: 'dough', pan: 1, name: 'うずまきシナモンロール', short: 'シナモンロール', taste: 'こくまろ', adj: 'くるくる', noun: 'ロール', nr: 9.5, value: 20, col: '#c98a4b', alt: 'candy-castella', fx: { dmg: 10, koneUp: 1 } },
  anpan:    { cat: 'dough', pan: 1, name: 'いちばんのりあんパン', short: 'いちばんあんパン', taste: 'あまい', adj: 'いちばん', noun: 'あんパン', nr: 9, value: 20, col: '#b8743c', alt: 'candy-brownie', fx: { dmg: 15, koneRally: 2 } },
  koronet:  { cat: 'dough', pan: 1, name: 'しめくくりチョココロネ', short: 'しめのコロネ', taste: 'とろーり', adj: 'しめの', noun: 'コロネ', nr: 10, value: 20, col: '#7a4424', alt: 'card-choco', fx: { dmg: 10, koneFin: 0.12 } },
  tanebin:  { cat: 'dough', pan: 1, name: 'パン種のびん', short: 'パン種のびん', taste: 'ふわふわ', adj: 'ふっくら', noun: 'パン', nr: 7.5, value: 15, col: '#f6ead0', alt: 'card-mizu', fx: { dmg: 5, taneSpawn: 1 } },
  panetane: { cat: 'dough', pan: 1, tane: 1, name: 'パン種', short: 'パン種', taste: 'ふわふわ', adj: 'ふわふわ', noun: 'パン', nr: 7, value: 0, col: '#fff2dc', alt: 'card-komugi', fx: { dmg: 5 } },
  /* ほのかの素材（支援・ほのかのビルドどうしで共通） */
  bata:   { cat: 'mat', name: 'ゴーゴーヤギのバター', short: 'ヤギバター', taste: 'こくまろ', adj: 'バター', noun: 'サブレ', nr: 2, value: 20, col: '#f6d36b', fx: { nb: 30 } },
  sato:   { cat: 'mat', name: 'こんぺいトカゲの砂糖', short: 'トカゲ砂糖', taste: 'あまい', adj: 'あまあま', noun: 'キャンディ', nr: 1, value: 15, col: '#f28cab', fx: { next: 2 } },
  tamago: { cat: 'mat', name: 'ほのお鳥のたまご', short: 'ほのおたまご', taste: 'ふわふわ', adj: 'ふわふわ', noun: 'カステラ', nr: 4, value: 20, col: '#ffd75e', fx: { fin: 1.5 } },
  choco:  { cat: 'mat', name: 'カカオゴーレムのかけら', short: 'ゴーレムチョコ', twin: 'ガトーショコラ', taste: 'とろーり', adj: 'チョコ', noun: 'ブラウニー', nr: 5, value: 25, col: '#7a4424', fx: { rally: 20 } },
  mitsu:  { cat: 'mat', name: 'ハチドラゴンのはちみつ', short: 'はちみつ', taste: 'あまい', adj: 'はちみつ', noun: 'キャンディ', nr: 1, value: 20, col: '#f2b33a', fx: { again: 1 } },
  /* ふしぎな材料（食材モンスターが落とす素材） */
  zeri:   { cat: 'mat', name: 'ぷるぷるスライムのゼリー', short: 'スライムゼリー', fushigi: true, taste: 'ぷるぷる', adj: 'ぷるぷる', noun: 'ゼリー', nr: 6, value: 60, col: '#7fd6e0', fx: { again: 1, nb: 20 } },
  hoippu: { cat: 'mat', name: 'くもひつじのホイップ', short: 'ひつじホイップ', fushigi: true, taste: 'ふわふわ', adj: 'ふわっと', noun: 'シュークリーム', nr: 6, value: 60, col: '#fff4f8', fx: { next: 3 } },
  /* レアモンスターがくれる素材（11/18 H-009）。朝のお菓子の材料だけ（fx がないので夜のショップには出ない。夜のカードにするかは、あとでしょーくんと） */
  niji:   { cat: 'mat', name: 'にじいろの水あめ', short: 'にじいろ水あめ', fushigi: true, rare: true, taste: 'あまい', adj: 'にじいろ', noun: 'キャンディ', nr: 1, value: 90, col: '#f6a8d8' },
  minto:  { cat: 'mat', name: 'きらきらミント', short: 'きらきらミント', fushigi: true, rare: true, taste: 'さわやか', adj: 'ミント', noun: 'ゼリー', nr: 6, value: 90, col: '#8fe0a8' },
  /* モブ3体がくれる素材（11/18 H-016 しょーくん「キャラらしく」）。夜のデッキのトカゲ砂糖・ほのおたまご・クラゲの水とはべつの物。alt は素材の絵が届くまでの仮の絵（その子のデフォルメ） */
  hoshi:   { cat: 'mat', name: 'こんぺいトカゲのほしくずシュガー', short: 'ほしくずシュガー', fushigi: true, taste: 'ほしぞら', adj: 'ほしぞら', noun: 'キャンディ', nr: 1, value: 60, col: '#ffe9a0', alt: 'mob-tokage', fx: { rally: 40 } },
  karamel: { cat: 'mat', name: 'ひよこのほのおカラメル', short: 'ほのおカラメル', fushigi: true, taste: 'こんがり', adj: 'こんがり', noun: 'サブレ', nr: 2, value: 60, col: '#d9822b', alt: 'mob-hiyoko', fx: { fin: 2 } },
  kanten:  { cat: 'mat', name: 'しずくクラゲの寒天', short: 'しずく寒天', fushigi: true, taste: 'ひんやり', adj: 'ひんやり', noun: 'ゼリー', nr: 6, value: 60, col: '#cdeee4', alt: 'mob-kurage', fx: { nb: 40, heat: -1 } },
  /* 新しい夜のお客さん4体がくれる素材（11/22・名前はしょーくん OK）。カカオゴーレムのかけら（choco）とはべつの物
     数字は 11/22 夜に合わせた（しょーくん「新しい4体のバランス」）：夜市で1まい足した夜の合計の まんなか が、素材なしより 平均 +11〜16%（前は ポップコーン〔もう2回〕+50%・カカオ −8%・まっちゃ −12%）。
     はかり方 `ICHI=kakao TOT=1 HEARTS=10 node tools/bot.mjs 700 all 10`。まっちゃは ほのか（火力）でいちばん効く（寒天の反対） */
  kakao:   { cat: 'mat', name: 'チョコもぐらのほりたてカカオ', short: 'ほりたてカカオ', fushigi: true, taste: 'ほろにが', adj: 'カカオ', noun: 'トリュフ', nr: 5, value: 60, col: '#6b3a24', fx: { rally: 40, next: 2 } },
  custard: { cat: 'mat', name: 'プリンペンギンのカスタード', short: 'とろりカスタード', fushigi: true, taste: 'とろーり', adj: 'カスタード', noun: 'プリン', nr: 4, value: 60, col: '#f6d77a', fx: { next: 2, nb: 30 } },
  maccha:  { cat: 'mat', name: 'まっちゃガエルのまっちゃ', short: 'カエルまっちゃ', fushigi: true, taste: 'ほろにが', adj: 'まっちゃ', noun: 'ゼリー', nr: 6, value: 60, col: '#8cb860', fx: { fin: 1.8, heat: 1 } },
  popcorn: { cat: 'mat', name: 'ポップコーンりすのポップコーン', short: 'りすポップコーン', fushigi: true, taste: 'しょっぱあま', adj: 'ぽんぽん', noun: 'ポップコーン', nr: 2, value: 60, col: '#f3d58c', fx: { again: 1, rally: 40 } },
  /* みなもの大作の飴細工（11/19・名前と数字はぽぽちの仮）。cat ame＝飴細工（主役）。taisaku＝大作（バトル開始時、飴の温度で大きさが育つ・9で完成）・done＝完成の倍率・spd＝育つはやさ
     doneRally＝スタート：完成した大作があれば主役ぜんぶ+・doneFin＝アンカー：合計×(1＋doneFin×完成した大作の数)・grow＝発動すると右どなりの大作の大きさ+。nr はみなもの素材より大きく（名前の主役がいつも飴細工） */
  amedai:   { cat: 'ame', name: '飴細工の台', short: '飴細工の台', taste: 'あまい', adj: 'つやつや', noun: '飴細工', nr: 9, value: 20, col: '#bfe6f0', fx: { dmg: 55, taisaku: 1, done: 5 } },
  hakucho:  { cat: 'ame', name: 'あめの白鳥', short: 'あめの白鳥', taste: 'ひんやり', adj: 'すきとおる', noun: '白鳥', nr: 9.5, value: 20, col: '#e8f6ff', fx: { dmg: 40, taisaku: 1, done: 5, spd: 1 } },
  oshiro:   { cat: 'ame', name: 'あめのお城', short: 'あめのお城', taste: 'あまい', adj: 'きらめく', noun: 'お城', nr: 10, value: 25, col: '#c9d8ff', fx: { dmg: 110, taisaku: 1, done: 7.5, spd: -1 } },
  hanakago: { cat: 'ame', name: 'あめの花かご', short: 'あめの花かご', taste: 'さわやか', adj: 'はなやか', noun: '花かご', nr: 8.5, value: 20, col: '#ffd0e0', fx: { dmg: 25, doneRally: 40 } },
  tsuya:    { cat: 'ame', name: 'しあげのつや', short: 'しあげのつや', taste: 'とろーり', adj: 'しあげの', noun: 'つや飴', nr: 8, value: 20, col: '#fff0c0', fx: { dmg: 25, doneFin: 0.5 } },
  nobashi:  { cat: 'ame', name: 'のばし飴', short: 'のばし飴', taste: 'あまい', adj: 'のびのび', noun: 'のばし飴', nr: 7.5, value: 15, col: '#ffe8b0', fx: { dmg: 15, grow: 2 } },
  /* みなも②ちいさなキャンディ（11/19・名前は絵の依頼のとおり・数字はぽぽちの仮）。cat candy＝キャンディ（主役）。candy＝キャンディのしるし
     （発動すると れんさ+1〔11/21 夜〜 温度で強さは変わらない〕。キャンディでないカードが発動すると れんさは0）
     perChain＝れんさ1につき+・petit＝ちいさなキャンディを飛ばす数・link＝両どなりがキャンディなら れんさ+・candyLead＝スタート：キャンディぜんぶ×
     chainFin＝アンカー：合計×(1＋chainFin×れんさ)・coldAgain＝もう1回（11/21 夜〜 温度なし）。twin＝同じカードどうしの★2の名前 */
  korodrop: { cat: 'candy', name: 'ころころドロップ', short: 'ころころドロップ', twin: 'ごろごろドロップ', taste: 'あまい', adj: 'ころころ', noun: 'ドロップ', nr: 9, value: 20, col: '#ffb8c8', fx: { dmg: 20, candy: 1, perChain: 10 } },
  hajike:   { cat: 'candy', name: 'はじけキャンディ', short: 'はじけキャンディ', twin: 'ぱちぱちはじけ飴', taste: 'しゅわしゅわ', adj: 'はじける', noun: 'はじけ飴', nr: 8.5, value: 20, col: '#ffe070', fx: { dmg: 10, candy: 1, petit: 2 } },
  peroc:    { cat: 'candy', name: 'つなぎペロキャン', short: 'つなぎペロキャン', twin: 'ダブルペロキャン', taste: 'あまい', adj: 'つなぎの', noun: 'ペロキャン', nr: 8, value: 20, col: '#c8e8ff', fx: { dmg: 20, candy: 1, link: 2 } },
  ichidrop: { cat: 'candy', name: 'いちばんドロップ', short: 'いちばんドロップ', twin: 'はじまりドロップ', taste: 'あまい', adj: 'いちばん', noun: 'ドロップ', nr: 9, value: 20, col: '#ffd0a0', fx: { dmg: 20, candy: 1, candyLead: 1.4 } },
  candybin: { cat: 'candy', name: 'キャンディのびん', short: 'キャンディのびん', twin: '大びんキャンディ', taste: 'あまい', adj: 'びんづめ', noun: 'びん飴', nr: 9.5, value: 20, col: '#f0e0ff', fx: { dmg: 10, candy: 1, chainFin: 0.025 } },
  mintame:  { cat: 'candy', name: 'ひえひえミント飴', short: 'ひえひえミント飴', twin: 'こちこちミント飴', taste: 'さわやか', adj: 'ひえひえ', noun: 'ミント飴', nr: 8, value: 20, col: '#c8f4dc', fx: { dmg: 20, candy: 1, coldAgain: 1 } },
  /* みなもの素材（支援・みなもの2ビルドで共通・11/19 名前は絵の依頼 cards-minamo4・5 のとおり）。役目は ほのかの素材と同じ形 */
  shioame:  { cat: 'mat', name: 'うみヘビのしお飴', short: 'しお飴', taste: 'さわやか', adj: 'うみの', noun: 'しお飴', nr: 2, value: 20, col: '#eef6f8', fx: { nb: 30 } },
  korizato: { cat: 'mat', name: 'こおりウサギの氷砂糖', short: 'ウサギ氷砂糖', taste: 'ひんやり', adj: 'きらきら', noun: '氷砂糖', nr: 1, value: 15, col: '#dff4ff', fx: { next: 2 } },
  urokoto:  { cat: 'mat', name: 'にじサカナのうろこ糖', short: 'うろこ糖', taste: 'あまい', adj: 'にじいろ', noun: 'うろこ糖', nr: 4, value: 20, col: '#ffd8f0', fx: { fin: 1.5 } },
  pearl:    { cat: 'mat', name: 'しんじゅ貝のパール糖', short: 'パール糖', taste: 'あまい', adj: 'しんじゅ', noun: 'パール糖', nr: 5, value: 25, col: '#fdf6ec', fx: { rally: 20 } },
  mizuchi:  { cat: 'mat', name: 'あまミズチのシロップ', short: 'ミズチシロップ', taste: 'とろーり', adj: 'とろり', noun: 'シロップ', nr: 1, value: 20, col: '#cfeee8', fx: { again: 1 } },
  /* わかば①くだものケーキ（11/19・名前は絵の依頼のとおり・数字はぽぽちの仮）。cat cake＝ケーキ（主役）。★2のケーキに熟した実をはなすと★3のくだものケーキ（'c:'・11/19 しょーくん）
     tartFruit＝となりがくだものなら×・rollGrow＝スタート：バトル開始時 くだものぜんぶ1段育つ・ripeFin＝アンカー：熟した実1つにつき×・perGrow＝くだものが育つたびに ずっと+（board の plus）・fruitAgain＝右どなりがくだものなら もう1回 */
  sponge:    { cat: 'cake', name: 'ふんわりスポンジ生地', short: 'スポンジ生地', taste: 'ふわふわ', adj: 'ふわふわ', noun: 'ケーキ', nr: 9, value: 20, col: '#f6d890', fx: { dmg: 60 } },
  tart:      { cat: 'cake', name: 'さくさくタルト生地', short: 'タルト生地', taste: 'さくさく', adj: 'さくさく', noun: 'タルト', nr: 9.2, value: 20, col: '#e8b060', fx: { dmg: 50, tartFruit: 2 } },
  roll:      { cat: 'cake', name: 'くるくるロール生地', short: 'ロール生地', taste: 'ふわふわ', adj: 'くるくる', noun: 'ロール', nr: 8.8, value: 20, col: '#f8e0b0', fx: { dmg: 30, rollGrow: 1 } },
  deco:      { cat: 'cake', name: 'しめくくりデコ生地', short: 'しめのデコ生地', taste: 'とろーり', adj: 'しめの', noun: 'デコケーキ', nshort: 'デコ', nr: 9.6, value: 20, col: '#fff0e0', fx: { dmg: 30, ripeFin: 1.4 } },
  chiffon:   { cat: 'cake', name: 'もりのシフォン生地', short: 'もりのシフォン', taste: 'ふわふわ', adj: 'もりの', noun: 'シフォン', nr: 9.4, value: 20, col: '#f4e4a8', fx: { dmg: 40, perGrow: 15 } },
  hachiroll: { cat: 'cake', name: 'はちみつロール', short: 'はちみつロール', taste: 'あまい', adj: 'はちみつ', noun: 'ロール', nr: 8.6, value: 20, col: '#f2b33a', fx: { dmg: 40, fruitAgain: 1 } },
  /* わかば②飴ジャム（11/19・名前と数字はぽぽちの仮）。cat jam＝ジャム（主役）。場はいつも大きなびん（FIELDS.oobin・フィールドは出ない）：くだものを3つ入れると★3のジャム（'j:'）が調理台に生まれ、びんは空に
     binNow＝大きなびんの実1つにつき+・jamLead＝スタート：ジャムぜんぶ×・jamFin＝アンカー：合計×(1＋jamFin×この夜に作ったジャムの数)・toro＝熟した実は2つ分で入る・shine＝右どなりのジャム×・perJam＝作ったジャム1つにつき+ */
  garabin:  { cat: 'jam', name: 'こもれびのガラスびん', short: 'ガラスのびん', taste: 'あまい', adj: 'すきとおる', noun: 'ジャム', nr: 9, value: 20, col: '#e8f4f0', fx: { dmg: 20, binNow: 100 } },
  ichijam:  { cat: 'jam', name: 'いちばんのりジャム', short: 'いちばんジャム', taste: 'あまい', adj: 'あさいち', noun: 'ジャム', nr: 9.2, value: 20, col: '#e04a5a', fx: { dmg: 20, jamLead: 1.8 } },
  shimejam: { cat: 'jam', name: 'しめくくりジャム', short: 'しめのジャム', taste: 'とろーり', adj: 'しめの', noun: 'ジャム', nr: 9.6, value: 20, col: '#f5a030', fx: { dmg: 20, jamFin: 1.5 } },
  torojam:  { cat: 'jam', name: 'とろとろジャム', short: 'とろとろジャム', taste: 'とろーり', adj: 'とろり', noun: 'ジャム', nr: 9.4, value: 20, col: '#d83a4a', fx: { dmg: 20, toro: 1 } },
  kirakira: { cat: 'jam', name: 'きらきら水あめ', short: 'きらきら水あめ', taste: 'あまい', adj: 'きらきら', noun: '水あめ', nr: 8.6, value: 15, col: '#f8f0c0', fx: { dmg: 10, shine: 2 } },
  jamnabe:  { cat: 'jam', name: 'ジャムの大鍋', short: 'ジャムの大鍋', taste: 'あまい', adj: 'ぐつぐつ', noun: 'ジャム', nr: 8.8, value: 20, col: '#c84a2a', alt: 'field-jamnabe', fx: { dmg: 20, perJam: 120 } },
};
/* わかばのくだもの（11/19・素材〔支援・くだもの〕・わかばの2ビルドで共通・名前と数字はぽぽちの仮）。調理台に置くと、ラウンドの終わりに 花(0)→青い実(1)→熟した実(2) と育つ（わかばの特性）。熟したらそのまま（11/19 しょーくん）
   育つとカードが入れかわる（m:apple0 → m:apple1）。効果は段で強くなる・役目は ほのかの素材と同じ形。まぜられない（育てて使う）。絵は card-<実>-<段>（alt） */
const FRUITS = {
  apple: { kana: 'りんご', name: 'こもれび木のりんご', taste: 'あまい', col: '#e8524a', st: [{ nb: 15 }, { nb: 40 }, { nb: 100 }] },
  berry: { kana: 'きいちご', name: 'もりクマのきいちご', taste: 'あまずっぱい', col: '#c8325a', st: [{ next: 1.1 }, { next: 1.25 }, { next: 1.6 }] },   // 11/21 夜 最終スコアをそろえる（前は 1.25・1.5・2.5）
  peach: { kana: 'もも', name: 'ほっぺモモンガのもも', taste: 'とろーり', col: '#f8a0a0', st: [{ fin: 1.1 }, { fin: 1.3 }, { fin: 1.8 }] },
  mikan: { kana: 'みかん', name: 'おひさまリスのみかん', taste: 'さわやか', col: '#f59a2a', st: [{ rally: 15 }, { rally: 40 }, { rally: 100 }] },
  grape: { kana: 'ぶどう', name: 'ゆめみ鳥のぶどう', taste: 'あまい', col: '#8a4ab0', st: [{ soon: 1 }, { again: 1 }, { again: 1, nb: 40 }] },   // 11/21 夜（前は 熟した実で もう2回）
};
const FRUIT_IDS = Object.keys(FRUITS), RIPE = 2;
for (const f of FRUIT_IDS) for (let s = 0; s <= RIPE; s++) {
  const F = FRUITS[f];
  MATS[f + s] = { cat: 'fruit', fruit: f, stage: s, name: s === 0 ? F.name + 'の花' : s === 1 ? F.name + '（青い実）' : F.name + '（熟した実）', short: s === 0 ? F.kana + 'の花' : (s === 1 ? '青い' : '熟した') + F.kana,
    taste: F.taste, adj: F.kana, noun: F.kana, nr: 2, value: 15, col: F.col, alt: `card-${f}-${s}`, fx: F.st[s] };
}
/* くだものの効果を m 倍（のびのび肥料×2・かかし×1.5）：足す数は m 倍・「×」は（1＋(×−1)×m）・もう1回は m 倍（3まで） */
function scaleFx(fx, m) {
  if (m === 1) return fx;
  const o = { ...fx };
  for (const k of ['nb', 'rally']) if (o[k]) o[k] = o[k] * m;
  for (const k of ['next', 'fin']) if (o[k]) o[k] = Math.round((1 + (o[k] - 1) * m) * 100) / 100;
  if (o.again) o.again = Math.min(3, Math.floor(o.again * m));
  return o;
}
/* わかば②のジャム（'j:実+実+実'）：熟した実ほど強い（★3なので×3）。名前は いちばん多い実で（ぜんぶちがえばミックス） */
const JAM_DMG = [60, 120, 240];
const jamTop = fr => { const c = {}; for (const m of fr) c[MATS[m].fruit] = (c[MATS[m].fruit] || 0) + 1; const top = Object.keys(c).sort((a, b) => c[b] - c[a])[0]; return { top, n: c[top] }; };
const jamName = fr => { const { top, n } = jamTop(fr); return n >= 2 || fr.length === 1 ? FRUITS[top].kana + 'ジャム' : 'ミックスジャム'; };

/* ほのかの道具（ほのかのビルドどうしで共通） */
const TOOLS = {
  maki:     { name: 'おばけ樹木のまき', short: 'おばけまき', mini: 'まき', role: '火力', fx: { heat: 1 } },
  hiokoshi: { name: 'ひだねサラマンダーの火種', short: '火種', mini: '火種', role: '火力', fx: { heat: 2 } },
  mizu:     { name: 'しずくクラゲの水', short: 'クラゲの水', mini: '水', role: '火力', fx: { heat: -2 } },
  yakigote: { name: 'サラマンダーのやきごて', short: 'やきごて', mini: 'こて', role: '火力', fx: { sear: 3 } },
  yobirin:  { name: 'かまど職人のよびりん', short: 'よびりん', mini: 'よびりん', role: '仕入れ', fx: { call: 1 } },
  /* こね生地だけの道具（11/21 夜 しょーくん「火力のカードがぬけた分、こね回数を増やせるカードがあると面白い」・名前と数字はぽぽちの仮・絵は Codex を待つ） */
  konedai:  { name: 'ずっしりこね台', short: 'こね台', mini: 'こね台', role: 'こね', fx: { koneUp: 2 } },
  hakko:    { name: 'ふっくら発酵かご', short: '発酵かご', mini: 'かご', role: 'こね', fx: { koneUp: 1, next: 1.5 } },
  /* みなもの道具（みなもの2ビルドで共通・11/19）。heat はみなもの夜では飴の温度 */
  yusen:     { name: 'ゆせん鍋', short: 'ゆせん鍋', mini: 'ゆせん', role: '温度', fx: { heat: 1 } },
  pot:       { name: 'お湯のポット', short: 'お湯ポット', mini: 'ポット', role: '温度', fx: { heat: 2 } },
  korimizu:  { name: 'こおり水', short: 'こおり水', mini: 'こおり水', role: '温度', fx: { heat: -2 } },
  amebasami: { name: 'ガラスの飴ばさみ', short: '飴ばさみ', mini: 'はさみ', role: '支援', fx: { grow: 2, chainUp: 1 } },   // キャンディの夜は れんさ+1（れんさを切らない）
  amebell:   { name: '飴職人のベル', short: '職人のベル', mini: 'ベル', role: '仕入れ', fx: { call: 1 } },
  /* ちいさなキャンディだけの道具（11/21 夜 しょーくん「れんさ回数を増やせるカードがあると面白い」・名前と数字はぽぽちの仮・絵は Codex を待つ） */
  ameito:    { name: 'きらめく飴の糸', short: '飴の糸', mini: '糸', role: 'れんさ', fx: { chainUp: 2 } },
  amering:   { name: 'くるくる飴のわっか', short: '飴のわっか', mini: 'わっか', role: 'れんさ', fx: { chainUp: 1, again: 1 } },
  /* わかばの道具（わかばの2ビルドで共通・11/19・名前は絵の依頼のとおり）。water＝発動すると右どなりのくだものが育つ・fert＝このラウンドの終わりに くだものぜんぶ もう1段
     scare＝右2枚のくだものの効果×（11/19 前は両どなり）・basket＝次のショップに くだもの（花）が多く出る・call＝畑のベル（飴ジャムの夜はフィールドがないので、熟した実を1枚） */
  joro:     { name: '森のじょうろ', short: 'じょうろ', mini: 'じょうろ', role: '支援', fx: { water: 1 } },
  hiryo:    { name: 'ふかふかひりょう', short: 'ひりょう', mini: 'ひりょう', role: '支援', fx: { fert: 1 } },
  kakashi:  { name: 'にこにこかかし', short: 'かかし', mini: 'かかし', role: '支援', fx: { scare: 1.5 } },
  kago:     { name: '収穫かご', short: '収穫かご', mini: 'かご', role: '仕入れ', fx: { basket: 2 } },
  hatabell: { name: '畑のベル', short: '畑のベル', mini: 'ベル', role: '仕入れ', fx: { call: 1 } },
};

/* 焼きすぎでできるカード（仕入れには出ない）。焦げどうしでまぜて育てる */
const BURNT = [null,
  { name: '焦げクッキー', fx: { dmg: 20 } },
  { name: '焦げ焦げクッキー', fx: { dmg: 60 } },
  { name: 'すみびクッキー', fx: { dmg: 300, stop: 1 } },
];

/* カードのフレーバーテキスト（大きなカードの下に出す） */
const FLAVOR = {
  teppan: 'ほのか愛用の、使いこんだ天板。5つの生地をいっぺんに焼ける。',   // 11/22 しょーくん「クッキーって鉄板で焼くもの？」→ 天板に
  ishigama: '石を積んだ大きなかまど。熱がこもって、焼きあがりがひと味ちがう。',
  komugi: '葉っぱの妖精の粉でこねた、基本のクッキー生地。',
  dosshiri: 'ゴーレムの粉でこねた、ずっしり重い生地。焼けるのに時間がかかる。',
  hinoko: 'サラマンダーの火の粉をまぜた生地。あっという間に焼ける。',
  ichiban: 'いちばん最初に焼くと、いちばんおいしい。',
  shime: '最後に焼くと、サイコーに焼けたクッキーの香りをぜんぶ吸いこむ。',
  horoniga: 'もともと少しにがい生地。焦げると、とても焦げる。',
  bata: '走りまわるゴーゴーヤギのミルクから。となりのカードを元気にする。',
  sato: 'しっぽが金平糖のトカゲが落としていく、あまい結晶。次の一撃をあまくする。',
  tamago: 'ほんのりあったかい、ほのお鳥のたまご。最後にぬると、ぜんぶがつやつや。',
  choco: 'チョコでできたゴーレムのかけら。いちばん最初にとかすと、みんなに行きわたる。',
  mitsu: 'ハチドラゴンの巣からとれた、とろとろのはちみつ。右どなりがもう一度。',
  zeri: '夜にあらわれたスライムのゼリー。ぷるんとはねて、となりをもう一度。',
  hoippu: '雲のようなひつじの毛のホイップ。次の一撃をふわっと大きく。',
  hoshi: '金平糖のしっぽからこぼれた、星くずの砂糖。いちばん最初にふりかけると、みんながきらきら。',
  karamel: 'ほのお鳥のひよこが焦がした、こんがりカラメル。最後にかけると、ぜんぶがつやつや倍に。',
  kanten: 'しずくクラゲのひんやり寒天。となりをおいしくして、火をひとつ弱める。',
  kakao: 'チョコもぐらが森の土からほり当てたカカオ。いちばん最初にとかすと、みんながほろにが。',
  custard: 'プリンペンギンのおなかから、とろりとすくったカスタード。次の一撃をなめらかに。',
  maccha: 'まっちゃガエルの、ほろにがのお茶っ葉。右の2まいをおいしくして、火をひとつ強める。',
  popcorn: 'ポップコーンりすのしっぽから はじけた粒。右どなりが、ぽんぽん もう二度。',
  maki: 'おばけ樹木の枝。くべると、火がひとつ強くなる。',
  hiokoshi: 'サラマンダーの火種。火が一気にふたつ強くなる。',
  mizu: 'しずくクラゲに分けてもらった水。熱すぎたら、これ。',
  yakigote: '真っ赤に焼けたこて。右どなりの生地を、じゅっと焼く。',
  yobirin: 'かまど職人を呼ぶ鈴。次のショップで、フィールドを持ってきてくれる。',
  k: 'ほのかがまた焦がしたクッキー。焦げどうしをまぜると、なにかが起きる。',
  o: 'ほのかがまぜて作ったお菓子。朝にはレシピとしてお店にも並ぶ。',
  s: 'ほのか特製のスペシャル。ひと口で、お店じゅうが元気になる。',
  u: 'ふたつの道具をひとつにした、ほのかの工夫。',
};

/* 火力：ほのかの固有特性。5マス共通の火力（0〜4）。バトルのはじめの焼きで、生地の焼き加減が段階のぶん進む（0なら焼けない）
   11/20 しょーくん：はじめは0（火なし）・場がなくても まきや火種で焼ける・火力のカードが1まいも発動しなかったラウンドの終わりに1さがる（CHEFS の down）・場の鉄板や石窯の火（start）より下がらない */
const HEAT = ['火なし', '弱火', '中火', '強火', '火力マックス'];
const HEAT_MAX = 4;
/* 焼き加減：9段階。9で焼き加減サイコー。サイコーのまま次に焼かれると焦げる */
const COOK_MAX = 9;
const cookMul = c => c >= COOK_MAX ? 5 : 1 + c / 3;
/* 飴の温度：みなもの固有特性（11/19 しょーくん：夜のはじめはいつも あたたか・ラウンドの終わりに1段さがる）。場がまるごと飴の台で、5マス共通
   大作はバトル開始時、温度で大きさが育つ（GROW）。ひえひえで固まり、あたたか以上でとけて また育つ（11/19 しょーくん）。大きさ9で完成 */
const TEMP = ['', 'ひえひえ', 'ひんやり', 'あたたか', 'とろとろ'];
const GROW = [0, 0, 1, 2, 3];
const SIZE_MAX = 9;
const SOFT_MUL = 0.3;   // 固まる前（あたたか・とろとろ）の大作は味パワー3割（11/19 しょーくん：ひえひえで固めると本気）
const sizeMul = (c, fx) => c >= SIZE_MAX ? fx.done || 5 : 1 + c / 3;   // 完成は ほのかのサイコーと同じ×5（11/19 ボットで火力クッキーに近づけた・仮）
/* ちいさなキャンディは1こ味パワー10（11/21 夜〜 キャンディは温度で強さが変わらない＝前の COLD_MUL はなくした） */
const PETIT_DMG = 10;

/* フィールド：ショップにまざって出てくる。買うと調理台の左の「場」に入る。
   ほのか：火力が start より下がらない（11/20・置いたとき start より弱ければ start に）。みなも：飴の温度が start になる */
const FIELDS = {
  teppan:   { name: 'ほのかの天板', start: 2, chips: ['火力が 中火より下がらない'], long: [['', '{火力}が 中火より下がらない']] },
  ishigama: { name: 'ごうごう石窯', start: 3, best: 1.3, chips: ['火力が 強火より下がらない', 'サイコーの生地 ×1.3'], long: [['', '{火力}が 強火より下がらない'], ['', '{サイコー}の生地×1.3']] },
  /* こね生地のフィールド（11/18 名前はしょーくん・効果はぽぽちの仮）。kone＝1回こねると数える回数・tane＝こねると多く生まれるパン種。alt はカードの絵が届くまでの仮の絵 */
  menbo:     { name: '力のめん棒', kone: 2, alt: 'field-ishigama', chips: ['こねると 2回分'], long: [['', '1回{こね}ると 2回分']] },   // 11/21 夜 こね生地は火力なし
  karumenbo: { name: '軽量めん棒', tane: 1, alt: 'field-teppan', chips: ['こねると パン種+1こ'], long: [['', '{こね}ると {パン種}が1こ多く生まれる']] },
  /* みなもの大作の飴細工のフィールド（11/19・ぽぽちの仮）。start＝置いたときの飴の温度・slow＝温度が2ラウンドに1回しかさがらない */
  oonabe: { name: '飴の大鍋', start: 4, chips: ['とろとろにする'], long: [['', '飴の{温度}が とろとろ になる']] },
  kobo:   { name: 'ガラスの工房', start: 3, slow: 1, chips: ['あたたかにする', '冷めにくい'], long: [['', '飴の{温度}が あたたか になる'], ['', '2ラウンドに1回しか冷めない']] },
  /* みなも②ちいさなキャンディのフィールド（11/19・ぽぽちの仮）。chain0＝ラウンドのはじめの れんさ・petit＝ちいさなキャンディが多い */
  dairiseki: { name: '大理石の台', chain0: 1, chips: ['れんさが 1から始まる'], long: [['', '{れんさ}が1から始まる']] },   // 11/21 夜 キャンディは温度なし
  yatai:     { name: 'キャンディの屋台', petit: 1, chips: ['小さな飴 +1こ'], long: [['', '小さな飴を1こ多く飛ばす']] },
  /* わかば①くだものケーキのフィールド（11/19 しょーくん：のびのび肥料・すくすく肥料・ケーキの味パワーのデコ）。start がない＝温度も火力も変えない。alt は絵が届くまでの仮の絵
     slowGrow＝くだものが育つのは2ラウンドに1回・fruitMul＝くだものの効果×（ripeMul＝熟した実・11/19 しょーくん「成長しきったら3倍くらい」）・growAdd＝ラウンドの終わりに多く育つ段
     decoHits＝ケーキが発動すると、デコの連撃 [ふつうのケーキ, 熟した実をのせた★3] 回・decoRate＝1回の味パワー（そのケーキの1割・11/19 しょーくん「連続で大量にヒットする爽快感」） */
  nobi:    { name: 'のびのび肥料', slowGrow: 1, fruitMul: 2, ripeMul: 2.5, alt: 'field-hatake', chips: ['実が育つのは 2回に1回', '熟した実の 効果×2.5'], long: [['', '{くだもの}が育つのは 2ラウンドに1回'], ['', '{くだもの}の効果×2・{熟した実}は×2.5']] },
  suku:    { name: 'すくすく肥料', growAdd: 1, alt: 'card-hiryo', chips: ['実が 1ラウンド はやく熟す'], long: [['', '{くだもの}が1ラウンドに2段育つ']] },
  decodai: { name: 'デコレーション台', decoHits: [5, 10], decoRate: 0.1, alt: 'field-terrace', chips: ['ケーキが デコ5連撃', '実のケーキは 10連撃'], long: [['', 'ケーキの発動で デコの5連撃（実のケーキは10連撃）']] },
  /* わかば②飴ジャムの場（11/19 しょーくん：フィールドを持たず、場がいつも大きなびん）。fixed＝買えない・うれない・入れかわらない */
  oobin:   { name: '大きなびん', fixed: 1, alt: 'card-ookibin', chips: ['実を3つ 入れると ジャム'], long: [['', '{くだもの}を3つ入れると★3の{ジャム}が生まれる'], ['', 'ずっと場にある（うれない）']] },
};

/* シェフ：特性と、シェフの2ビルドで共通の素材と道具。草のパティシエは、あとで常連さんから仲間になる（素材も道具も別）
   heat＝特性のメーター（word＝ことば・of＝何の・names＝段の名前・start＝夜のはじめ・field＝場がないと効かない・cool＝ラウンドの終わりにさがる段）。art＝絵の名前の頭 */
const CHEFS = {
  honoka: {
    name: 'ほのか', job: '炎のシェフ', trait: '火力', art: 'honoka', heat: { word: '火力', of: '', names: HEAT, start: 0, down: 1, field: 1 },
    common: ['m:bata', 'm:sato', 'm:tamago', 'm:choco', 'm:mitsu', 't:maki', 't:hiokoshi', 't:mizu', 't:yakigote', 't:yobirin'],   // ほのか共通
  },
  minamo: {
    name: 'みなも', job: '水の飴細工職人', trait: '飴の温度', art: 'minamo', heat: { word: '温度', of: '飴の', names: TEMP, start: 3, cool: 1 },
    common: ['m:shioame', 'm:korizato', 'm:urokoto', 'm:pearl', 'm:mizuchi', 't:yusen', 't:pot', 't:korimizu', 't:amebasami', 't:amebell'],   // みなも共通（11/19）
  },
  /* わかば（11/19）：特性は くだものが育つ（メーターはない＝none・くだものはカードの絵で育つ）。ショップのくだものは花 */
  wakaba: {
    name: 'わかば', job: '草のパティシエ', trait: 'くだものが育つ', art: 'wakaba', heat: { word: '育ち', of: '', names: ['', '', '', '', ''], start: 1, none: 1 },
    common: ['m:apple0', 'm:berry0', 'm:peach0', 'm:mikan0', 'm:grape0', 't:joro', 't:hiryo', 't:kakashi', 't:kago', 't:hatabell'],
  },
};
/* 今夜のシェフ（夜の画面の外や、夜がまだないときは ほのか） */
function chefNow() { try { return CHEFS[BUILDS[(N && N.build) || 'cookie'].chef] || CHEFS.honoka; } catch (e) { return CHEFS.honoka; } }
/* ビルドの特性（11/21 夜 しょーくん「パンビルドに火力ゲージは必要ない・パン種とこね回数で手数を爆増させるビルド」「れんさ飴ビルドも温度は関係ない」・えらぶ質問で しくみごと なくす）：
   BUILDS の heat があれば シェフの heat に重ねる。off＝そのビルドはメーターを使わない（右上はこね・れんさの数だけ・火力や温度のカードは出さない・変わらない） */
const HEAT_B = {};
const heatOf = () => { let b = 'cookie'; try { b = (N && N.build) || 'cookie'; } catch (e) {} const B = BUILDS[b]; if (!B || !B.heat) return chefNow().heat; return HEAT_B[b] || (HEAT_B[b] = Object.assign({}, chefNow().heat, { down: 0, cool: 0, field: 0 }, B.heat)); };
/* ビルド（11/18 しょーくん）：夕方にシェフとビルドを1つえらぶ（使えるのが1つのうちは出さない）。主役6種（そのビルドだけ）＋シェフの共通＋フィールド2
   from＝使えるようになる日（11/18 しょーくん：こね生地は8日目から）。pic＝えらぶ画面の絵・show＝えらぶ画面に出すカード3まい・text＝ひとこと */
const BUILDS = {
  cookie: {
    chef: 'honoka', name: '火力クッキー', from: 1, pic: 'honoka-battle', text: '天板で焼いて サイコーに。アンカーで倍々',
    bal: [1.13, 1.155], r1: 310, doughs: ['m:komugi', 'm:dosshiri', 'm:hinoko', 'm:ichiban', 'm:shime', 'm:horoniga'], fields: ['teppan', 'ishigama'], show: ['m:ichiban', 'm:shime', 'b:ishigama'],
  },
  kone: {
    chef: 'honoka', name: 'こね生地', from: 8, seen: 'm9', pic: 'honoka-yaruki', text: '生地をこねて パン種をふやす。こねた回数で爆発',
    trait: 'こね', heat: { off: 1, start: 0 }, drop: ['t:maki', 't:hiokoshi', 't:mizu', 't:yakigote'], extra: ['t:konedai', 't:hakko'],   // 火力なし（パンは焼かない・焦げない）
    bal: [0.58, 1.51], r1: 490, doughs: ['m:melonpan', 'm:creampan', 'm:cinnamon', 'm:anpan', 'm:koronet', 'm:tanebin'], fields: ['menbo', 'karumenbo'], show: ['m:koronet', 'm:creampan', 'm:panetane'],
  },
  /* みなも①（11/19）：mate＝その仲間が来てから（昼の⑧で S.seen['mate:minamo']） */
  taisaku: {
    chef: 'minamo', name: '大作の飴細工', from: 5, mate: 'minamo', pic: 'minamo-battle', text: 'あたためて育て、冷えたら本気。★3を冷やせば最強',
    bal: [2.97, 1.123], r1: 190, doughs: ['m:amedai', 'm:hakucho', 'm:oshiro', 'm:hanakago', 'm:tsuya', 'm:nobashi'], fields: ['oonabe', 'kobo'], show: ['m:oshiro', 'm:tsuya', 'b:oonabe'],
  },
  /* みなも②（11/19）：キャンディどうしの れんさ（11/21 夜〜 温度は関係ない） */
  candy: {
    chef: 'minamo', name: 'ちいさなキャンディ', from: 14, mate: 'minamo', seen: 'm13', pic: 'minamo-charge', text: 'キャンディを続けて並べて れんさ。つなぐほど強い',
    trait: 'れんさ', heat: { off: 1, start: 2 }, drop: ['t:yusen', 't:pot', 't:korimizu'], extra: ['t:ameito', 't:amering'],   // 温度なし（見た目は ひんやり のまま変わらない）
    bal: [1.10, 1.186], r1: 260, doughs: ['m:korodrop', 'm:hajike', 'm:peroc', 'm:ichidrop', 'm:candybin', 'm:mintame'], fields: ['dairiseki', 'yatai'], show: ['m:candybin', 'm:hajike', 'b:dairiseki'],
  },
  /* わかば①（11/19）：くだものを育てて、熟した実を★2のケーキにのせて★3。フィールドは3つ（11/19 しょーくん） */
  fruitcake: {
    chef: 'wakaba', name: 'くだものケーキ', from: 11, mate: 'wakaba', pic: 'wakaba-battle', text: 'くだものを育てて、熟した実を★2のケーキにのせると★3',
    bal: [1.13, 1.235], r1: 300, doughs: ['m:sponge', 'm:tart', 'm:roll', 'm:deco', 'm:chiffon', 'm:hachiroll'], fields: ['nobi', 'suku', 'decodai'], show: ['m:tart', 'm:apple2', 'b:suku'],
  },
  /* わかば②（11/19）：bin＝場がいつも大きなびん（フィールドは出ない）。くだもの3つで★3のジャムが生まれる */
  jam: {
    chef: 'wakaba', name: '飴ジャム', from: 17, mate: 'wakaba', seen: 'm14', pic: 'wakaba-support', text: '場はいつも大きなびん。実3つで★3のジャムに',
    bal: [1.64, 1.10], r1: 210, doughs: ['m:garabin', 'm:ichijam', 'm:shimejam', 'm:torojam', 'm:kirakira', 'm:jamnabe'], fields: [], bin: 'oobin', show: ['m:shimejam', 'm:berry2', 'b:oobin'],
  },
};
/* キャンディの夜か（飴ばさみの紙を れんさ にする） */
const candyNight = () => { try { return !!N && N.build === 'candy'; } catch (e) { return false; } };
/* 場がいつも大きなびんの夜か（わかば②・畑のベルの紙を 熟した実 にする） */
const binNight = () => { try { return !!N && !!BUILDS[N.build].bin; } catch (e) { return false; } };
/* その日に使えるビルド（ためしのページ＝TRIAL では、ぜんぶ）
   mate＝仲間になった次の日から（STORY.mate）・seen＝その場面を見た日から（こね生地は⑨の朝 S.seen.m9・H-025） */
const openBuilds = () => Object.keys(BUILDS).filter(id => {
  const b = BUILDS[id];
  return TRIAL || (S.day >= b.from && (!b.mate || STORY.mate(b.mate)) && (!b.seen || (S.seen[b.seen] && S.day >= S.seen[b.seen])));
});

const STAR_MUL = [0, 1, 1.5, 3];   // ★1・★2・★3 の強さの倍率（まぜるほど倍々）
const DMG_CAP = 9999999;           // 1回のダメージとスコアの上限
/* ダメージの計算の順番（ゼンゼロの分析の「計算の順番を決めておく」）：
   ① 基本ダメージ×★の倍率 ② ×焼き加減（生地）×フィールド（サイコー）③ ×先頭 ④ ×サイコーの数（最後）
   ⑤ ＋となり＋攻撃ぜんぶ（★の倍率こみ）⑥ ×「つぎ」の倍率 ⑦ 切りすて ⑧ 最後の「合計×」は、そのカードまでの合計にかける */

/* ---------- レシピ（生地・素材の★2＝お菓子。朝に作って昼に売れる） ---------- */
const recipeKey = (a, b) => [a, b].sort().join('+');
/* カードの名前は8文字まで（11/17 しょーくん）。長い形の名前は、名前のときだけ短く（noun は絵をさがす名前なのでそのまま） */
const NAME_MAX = 8;
const NOUN_NAME = { 'シュークリーム': 'シュー', 'ブラウニー': 'ショコラ', 'キャンディ': 'ドロップ' };
const nounName = n => NOUN_NAME[n] || n;
const nlen = s => [...s].length;
/* ようす＋形。8文字をこえるときは、形の短い名前（nshort・メロンパン→メロン）で */
const adjName = (adj, M) => { const n = adj + nounName(M.noun); return nlen(n) > NAME_MAX && M.nshort ? adj + M.nshort : n; };
function recipeOf(key) {
  const [a, b] = key.split('+'), A = MATS[a], B = MATS[b];
  const main = B.nr > A.nr ? B : A, other = main === A ? B : A;
  return {
    key, mats: [a, b],
    name: a === b ? A.twin || adjName(A.adj, A) : adjName(other.adj, main), noun: main.noun, ns: main.nshort, nr: main.nr,
    tastes: [...new Set([A.taste, B.taste])],
    price: Math.round((A.value + B.value) * YEN_PER_VALUE / 10) * 10,   // 1この売値（円）。ふつう200〜300円・モンスター素材入り400〜600円
    needs: [a, b].filter(m => MATS[m].fushigi),
  };
}
/* まぜた効果：数は合計、倍率はかけ算（上限あり）、しるしはどちらかにあれば */
function mergeFx(a, b) {
  const o = {};
  for (const k of ['dmg', 'spd', 'nb', 'rally', 'heat', 'sear', 'perKone', 'koneRally', 'koneUp', 'tane2', 'taneSpawn', 'grow', 'doneRally', 'perChain', 'petit', 'link', 'chainUp', 'water', 'perGrow', 'binNow', 'perJam', 'basket']) { const v = (a[k] || 0) + (b[k] || 0); if (v) o[k] = v; }
  for (const k of ['done', 'doneFin', 'chainFin', 'tartFruit', 'ripeFin', 'jamFin', 'scare', 'shine']) { const v = Math.max(a[k] || 0, b[k] || 0); if (v) o[k] = v; }   // 大作の完成の倍率・しあげのつや・キャンディのびん・わかば（大きいほう）
  if (a.taisaku || b.taisaku) o.taisaku = 1;
  for (const k of ['candy', 'coldAgain', 'rollGrow', 'fruitAgain', 'toro', 'fert']) if (a[k] || b[k]) o[k] = 1;   // soon（ぶどうの花）は、まぜた物にはのせない
  const cl = Math.max(a.candyLead || 0, b.candyLead || 0) + (a.candyLead && b.candyLead ? 1 : 0); if (cl) o.candyLead = cl;   // いちばんドロップ（いちばん生地と同じ形）
  const jl = Math.max(a.jamLead || 0, b.jamLead || 0) + (a.jamLead && b.jamLead ? 1 : 0); if (jl) o.jamLead = jl;           // いちばんジャム
  const kf = Math.max(a.koneFin || 0, b.koneFin || 0) + (a.koneFin && b.koneFin ? 0.25 : 0); if (kf) o.koneFin = kf;
  const nx = (a.next || 1) * (b.next || 1); if (nx > 1) o.next = Math.min(6, nx);
  const ld = Math.max(a.lead || 0, b.lead || 0) + (a.lead && b.lead ? 1 : 0); if (ld) o.lead = ld;
  const fn = (a.fin || 1) * (b.fin || 1); if (fn > 1) o.fin = Math.min(3, fn);
  const sa = Math.max(a.sai || 0, b.sai || 0); if (sa) o.sai = sa;
  const ag = (a.again || 0) + (b.again || 0); if (ag) o.again = Math.min(3, ag);
  for (const k of ['call', 'bitter', 'noburn', 'stop']) if (a[k] || b[k]) o[k] = 1;
  return o;
}

/* ---------- カード ----------
   'm:食材'（生地・素材 ★1）・'t:道具'（★1）・'b:フィールド'・'k:★'（焦げ）
   'o:食材+食材'（生地・素材の★2）・'s:★2|★2'（★3）・'u:道具+道具'（道具の★2）・'w:★2|★2'（道具の★3） */
const CAT_NAME = { dough: '生地', ame: '飴細工', candy: 'キャンディ', cake: 'ケーキ', jam: 'ジャム', mat: '素材', fruit: 'くだもの', tool: '道具', burnt: '焦げ', field: 'フィールド' };
const ROLE = { dough: '主役', ame: '主役', candy: '主役', cake: '主役', jam: '主役', mat: '支援', fruit: '支援', burnt: '主役' };   // 11/18 しょーくん：攻撃→主役・ダメージ/スコア→味パワー
const MAIN_CATS = ['ame', 'candy', 'cake', 'jam', 'dough'];   // 主役の種類（まぜた物の種類は、この順で先にあるもの）
const foodCat = mats => MAIN_CATS.find(k => mats.some(m => MATS[m].cat === k)) || 'mat';
/* みなもの★3（11/19 ぽぽちの仮）：同じ形どうしは「きわみの○○」、ちがう形どうしは「○○の△△」（主役の形をうしろに） */
function ameSpecialName(r1, r2) {
  const [x, y] = r1.nr > r2.nr || (r1.nr === r2.nr && r1.noun > r2.noun) ? [r2, r1] : [r1, r2], n = x.noun + 'の' + y.noun;
  return r1.noun !== r2.noun && nlen(n) <= NAME_MAX ? n : 'きわみの' + y.noun;
}
/* ★3：同じ形どうしは「○○タワー」、ちがう形どうしは2つの形をつなげる（主役の形をうしろに） */
function specialName(r1, r2) {
  const nn = r => nounName(r.noun), ns = r => r.ns || nn(r), fit = (...c) => c.find(n => nlen(n) <= NAME_MAX) || [...c[c.length - 1]].slice(0, NAME_MAX).join('');
  if (r1.noun === r2.noun) return fit(nn(r1) + 'タワー', ns(r1) + 'タワー');
  const [x, y] = r1.nr > r2.nr || (r1.nr === r2.nr && r1.noun > r2.noun) ? [r2, r1] : [r1, r2];
  return fit(nn(x) + nn(y), ns(x) + nn(y), ns(x) + ns(y));   // 菓子パンは形の名前が長いので、8文字をこえたら短い形で（クリームパン→クリーム）
}
/* わかばの★3のくだものケーキ：実の名前＋ケーキの形（りんごタルト・きいちごシフォン）。8文字をこえたら形の短い名前で */
const fruitCakeName = (r, F) => { const k = FRUITS[F.fruit].kana, n = k + nounName(r.noun); return nlen(n) <= NAME_MAX ? n : r.ns && nlen(k + r.ns) <= NAME_MAX ? k + r.ns : [...n].slice(0, NAME_MAX).join(''); };
function toolSetName(a, b) { return a === b ? 'ダブル' + TOOLS[a].short : TOOLS[a].mini + '＆' + TOOLS[b].mini; }
const DEFS = new Map();
function cardDef(cid) {
  if (DEFS.has(cid)) return DEFS.get(cid);
  const k = cid[0], id = cid.slice(2);
  let d;
  const pairFx = r => mergeFx(MATS[r.mats[0]].fx, MATS[r.mats[1]].fx);
  if (k === 'm') { const m = MATS[id]; d = { kind: MAIN_CATS.includes(m.cat) ? 'd' : m.fushigi ? 'f' : 'm', cat: m.cat, star: 1, name: m.name, short: m.short, fx: m.fx, mats: [id], cost: m.fushigi ? 4 : 3 }; }
  else if (k === 'c') {   // わかば①：★2のケーキ＋熟した実＝★3のくだものケーキ（実の効果ものる・11/19 しょーくん）
    const [ck, fr] = id.split('|'), r = recipeOf(ck), fx = mergeFx(pairFx(r), MATS[fr].fx); fx.fruitCake = 1;
    d = { kind: 's', cat: 'cake', star: 3, name: fruitCakeName(r, MATS[fr]), fx, mats: [...r.mats, fr], keys: [r.key], cost: 0 };
  }
  else if (k === 'j') {   // わかば②：大きなびんに くだもの3つ＝★3のジャム（入れた実の効果がのる・熟した実ほど強い・11/19 しょーくん）
    const fr = id.split('+'), fx = fr.reduce((o, m) => mergeFx(o, MATS[m].fx), {});
    fx.dmg = fr.reduce((t, m) => t + JAM_DMG[MATS[m].stage], 0); fx.madeJam = 1;
    d = { kind: 's', cat: 'jam', star: 3, name: jamName(fr), fx, mats: fr, cost: 0 };
  }
  else if (k === 't') { const t = TOOLS[id]; d = { kind: 't', cat: 'tool', role: t.role, star: 1, name: t.name, short: t.short, fx: t.fx, mats: [], parts: [id], cost: 3 }; }
  else if (k === 'b') { const f = FIELDS[id]; d = { kind: 'b', cat: 'field', star: 1, name: f.name, fx: {}, mats: [], cost: 5 }; }
  else if (k === 'k') { const n = +id; d = { kind: 'k', cat: 'burnt', star: n, name: BURNT[n].name, fx: BURNT[n].fx, mats: [], cost: 0 }; }
  else if (k === 'o') { const r = recipeOf(id); d = { kind: 'o', cat: foodCat(r.mats), star: 2, name: r.name, fx: pairFx(r), mats: r.mats, cost: 6 }; }
  else if (k === 's') {
    const [r1, r2] = id.split('|').map(recipeOf), mats = [...r1.mats, ...r2.mats], cat = foodCat(mats);
    const fx = mergeFx(pairFx(r1), pairFx(r2)); if (cat === 'dough' && !mats.some(m => MATS[m].pan)) fx.noburn = 1;   // パンは焼かないので「焦げない」もつけない（11/21 夜）
    d = { kind: 's', cat, star: 3, name: cat === 'ame' || cat === 'candy' || cat === 'jam' ? ameSpecialName(r1, r2) : specialName(r1, r2), fx, mats, keys: [r1.key, r2.key], cost: 0 };
  }
  else if (k === 'u') { const [a, b] = id.split('+'); d = { kind: 't', cat: 'tool', role: TOOLS[a].role, star: 2, name: toolSetName(a, b), fx: mergeFx(TOOLS[a].fx, TOOLS[b].fx), mats: [], parts: [a, b], cost: 0 }; }
  else { const [p, q] = id.split('|').map(x => cardDef('u:' + x)); d = { kind: 't', cat: 'tool', role: p.role, star: 3, name: '特製道具セット', fx: mergeFx(p.fx, q.fx), mats: [], parts: [...p.parts, ...q.parts], cost: 0 }; }
  d.cid = cid;
  d.role = d.role || ROLE[d.cat] || '';
  d.food = d.cat === 'dough' || d.cat === 'mat';
  d.dough = d.cat === 'dough';
  d.grow = d.cat === 'ame' && !!d.fx.taisaku;                        // みなもの大作（バトル開始時に、飴の温度で大きさが育つ）
  d.candy = d.cat === 'candy';                                      // みなものキャンディ（れんさ）
  d.fruit = d.cat === 'fruit';                                      // わかばのくだもの（ラウンドの終わりに育つ・stage＝0 花・1 青い実・2 熟した実）
  if (d.fruit) d.stage = MATS[d.mats[0]].stage;
  d.pan = d.dough && d.mats.some(m => MATS[m].pan);                 // パン生地（パン生地どうしをまぜると「こねる」・11/21 夜〜 焼かない）
  d.meter = (d.dough && !d.pan) || d.grow;                          // 調理台で数字を持つ（生地＝焼き加減・大作＝大きさ。どちらも board の cook）
  d.tane = d.mats.length > 0 && d.mats.every(m => MATS[m].tane);    // パン種だけでできたカード（うっても0コイン）
  d.short = d.short || d.name;
  DEFS.set(cid, d);
  return d;
}
/* カードの属性（最大2つ）：種類・役目 */
const attrsOf = d => d.cat === 'field' ? ['フィールド'] : [CAT_NAME[d.cat], d.role].filter(Boolean);

/* まぜられる組み合わせ（属性で決まる）：生地＋生地・生地＋素材・素材＋素材・道具＋道具・焦げ＋焦げ。同じ★どうしで、★3はまぜられない */
const MIX_OK = { 'dough+dough': 1, 'dough+mat': 1, 'mat+mat': 1, 'tool+tool': 1, 'burnt+burnt': 1, 'ame+ame': 1, 'ame+mat': 1, 'candy+candy': 1, 'candy+mat': 1, 'cake+cake': 1, 'cake+mat': 1, 'jam+jam': 1, 'jam+mat': 1 };
/* わかばのくだものは まぜない（育てて使う）。ただし熟した実は★2のケーキにはなすと★3（★のちがいをこえる・11/19 しょーくん） */
const fruitCake = (A, B) => { const [c, f] = A.fruit ? [B, A] : [A, B]; return !!f.fruit && f.stage === RIPE && c.cat === 'cake' && c.star === 2 && c.kind === 'o'; };
function mixable(A, B) { return fruitCake(A, B) || (A.star === B.star && A.star < 3 && !!MIX_OK[[A.cat, B.cat].sort().join('+')]); }
function mixCid(a, b) {
  const A = cardDef(a), B = cardDef(b), ids = [a.slice(2), b.slice(2)].sort();
  if (fruitCake(A, B)) { const [c, f] = A.fruit ? [B, A] : [A, B]; return 'c:' + c.cid.slice(2) + '|' + f.mats[0]; }
  if (A.cat === 'burnt') return 'k:' + (A.star + 1);
  if (A.cat === 'tool') return A.star === 1 ? 'u:' + ids.join('+') : 'w:' + ids.join('|');
  return A.star === 1 ? 'o:' + recipeKey(A.mats[0], B.mats[0]) : 's:' + ids.join('|');
}

/* ことばをそろえる（11/18 しょーくん「表記ブレが気になる」）：次（漢字）・発動・焼き加減・焦げ（状態のひとつ）・ショップ・スタート・アンカー・サイコー */
/* カードの紙：1つの効果を1行で短く（「スタート：×3」の形）。大事な順で、紙には上の2つまで。焦げない★3には「焦げると」は出さない */
/* 倍率の数は小数2けたまでに丸める（11/22 しょーくん「×1.7999999999999998 → 1.8 のように」） */
const nx = v => String(Math.round(v * 100) / 100);
function fxList(fx, star = 1) {
  const m = STAR_MUL[star] || 1, f = v => Math.floor(v * m * 10) / 10, p = [];
  if (fx.taisaku) p.push(`完成×${nx(fx.done)}`);
  if (fx.lead) p.push(`スタート：×${nx(fx.lead)}`);
  if (fx.candyLead) p.push(`スタート：キャンディ×${nx(fx.candyLead)}`);
  if (fx.sai) p.push(`アンカー：サイコー毎×${nx(fx.sai + FIN_STAR.sai * (star - 1))}`);
  if (fx.fin) p.push(`アンカー：合計×${nx(fx.fin)}`);
  if (fx.chainFin) p.push(`アンカー：れんさ毎 合計+${pct(chainFinOf(fx, star))}`);
  if (fx.doneFin) p.push(`アンカー：完成×+${doneFinOf(fx, star)}`);
  if (fx.koneFin) p.push(`アンカー：こね毎 合計+${pct(koneFinOf(fx, star))}`);
  if (fx.ripeFin) p.push(`アンカー：熟した実毎×${nx(ripeFinOf(fx, star))}`);
  if (fx.jamFin) p.push(`アンカー：ジャム毎 合計+${pct(jamFinOf(fx, star))}`);
  if (fx.jamLead) p.push(`スタート：ジャム×${nx(fx.jamLead)}`);
  if (fx.rollGrow) p.push('スタート：実ぜんぶ育つ');
  if (fx.tartFruit) p.push(`となりが実で×${nx(fx.tartFruit)}`);
  if (fx.fruitAgain) p.push('右が実なら2回');
  if (fx.perGrow) p.push(`実が育つと+${f(fx.perGrow)}`);
  if (fx.binNow) p.push(`びんの実毎に+${f(fx.binNow)}`);
  if (fx.perJam) p.push(`ジャム毎に+${f(fx.perJam)}`);
  if (fx.shine) p.push(`右のジャム×${nx(fx.shine)}`);
  if (fx.toro) p.push('熟した実は2つ分');
  if (fx.rally) p.push(`スタート：主役ぜんぶ+${f(fx.rally)}`);
  if (fx.doneRally) p.push(`スタート：主役+${f(fx.doneRally)}`);
  if (fx.koneRally) p.push(`スタート：パン+${f(fx.koneRally)}×こね`);
  if (fx.perKone) p.push(`こね毎に+${f(fx.perKone)}`);
  if (fx.perChain) p.push(`れんさ毎に+${f(fx.perChain)}`);
  if (fx.petit) p.push(`ちいさな飴${fx.petit}こ`);
  if (fx.link) p.push(`両どなり飴で れんさ+${fx.link}`);
  if (fx.coldAgain) p.push('2回発動');
  if (fx.next) p.push(`次の主役×${nx(fx.next)}`);
  if (fx.nb) p.push(`右2枚+${f(fx.nb)}`);
  if (fx.again) p.push(`右がもう${fx.again}回`);
  if (fx.koneUp) p.push(`発動：こね+${fx.koneUp}`);
  if (fx.tane2) p.push(`こねるとパン種+${fx.tane2}`);
  if (fx.taneSpawn) p.push(`置くとパン種+${fx.taneSpawn}`);
  if (fx.stop) p.push('全生地：焦げ無効');
  if (fx.noburn) p.push('焦げ無効');
  if (fx.sear) p.push(`右の生地：焼き+${fx.sear}`);
  if (fx.grow && !(fx.chainUp && candyNight())) p.push(`右の大作：大きさ+${fx.grow}`);
  if (fx.chainUp && candyNight()) p.push(`れんさ+${fx.chainUp}`);
  if (fx.water) p.push(`右の実：育つ+${fx.water}`);
  if (fx.fert) p.push('実ぜんぶ もう1段');
  if (fx.scare) p.push(`右2枚の実×${nx(fx.scare)}`);
  if (fx.basket) p.push(`次に実が${fx.basket}枚`);
  if (fx.soon) p.push('育つと右がもう1回');
  if (fx.heat && !heatOf().off) p.push(`${heatOf().word}${fx.heat > 0 ? '+' : '−'}${Math.abs(fx.heat)}`);
  if (fx.call) p.push(binNight() ? '熟した実を呼ぶ' : 'フィールドを呼ぶ');
  if (fx.bitter && !fx.noburn) p.push('焦げると★2');
  if (fx.spd) p.push(fx.taisaku ? (fx.spd > 0 ? '育ちやすい' : '育ちにくい') : fx.spd > 0 ? '焼けやすい' : '焼けにくい');
  return p;
}
function fxText(fx, star = 1) { return fxList(fx, star).join('・'); }
/* しめのコロネの「こね1回ごと」の倍率（★2・★3で +0.25 ずつ） */
/* ★2・★3で ふえる分（11/21 夜：数字合わせで動かしやすいように表に） */
const FIN_STAR = { kone: 0.03, done: 0.25, chain: 0.01, ripe: 0.2, jam: 0.25, sai: 0.2 };   // 11/21 夜 しょーくん「上手な夜の最終スコアが どのビルドも50万くらい」（前は chain 0.125・ripe 0.5）
const koneFinOf = (fx, star = 1) => fx.koneFin + FIN_STAR.kone * (star - 1);
/* しあげのつやの「完成した大作1つごと」の倍率（★2・★3で +0.25 ずつ） */
const doneFinOf = (fx, star = 1) => fx.doneFin + FIN_STAR.done * (star - 1);
/* キャンディのびんの「れんさ1つごと」の倍率（★2・★3で +0.125 ずつ・11/19 くらべて ×れんさ から下げた） */
const chainFinOf = (fx, star = 1) => fx.chainFin + FIN_STAR.chain * (star - 1);
/* わかば：しめのデコ生地の「熟した実1つごと」（★2・★3で +0.5 ずつ・しめくくり生地と同じ形）・しめのジャムの「作ったジャム1つごと」（+0.25 ずつ） */
const ripeFinOf = (fx, star = 1) => fx.ripeFin + FIN_STAR.ripe * (star - 1);
const jamFinOf = (fx, star = 1) => fx.jamFin + FIN_STAR.jam * (star - 1);

/* 大きく見る画面の効果：[いつ, なにが起きる]（ゼンゼロの形）。いつ＝スタート・アンカー（置く場所）か、発動時・常時・バトル開始時・焼かれるとき・焦げたとき・置いたとき
   文の {ことば} は黄色で、タップすると KW の説明。状態（いまは焦げ）は「○○状態にならない」の形で、ほかの状態がふえても同じ書き方 */
/* カードの効果の文（11/19 しょーくん「ゼンゼロみたいに究極にシンプルに」「1つの文にそろえる」「言いかえもふくめてカード全体を見直して」）：
   カードの紙に出す文はこれだけ（大きく見ても同じ）。[いつ, 文]。いつはスタート・アンカーだけ（紙では「スタート：…」）。
   決まり：何が・どうなるかを書く（「育ちにくい」のように何がか わからない言い方はしない）・数は「味パワー×2」「合計+50%」・くだものは「実」とよぶ・
   半角スペースと「：」のあとだけで折り返す（ことばの とちゅうで切らない）。{ことば} は黄色でタップすると説明 */
const pct = v => `${Math.round(v * 1000) / 10}%`;   // 2.5% のような小数1けたも（11/22）
function fxLong(fx, star = 1) {
  const m = STAR_MUL[star] || 1, f = v => Math.floor(v * m * 10) / 10, p = [];
  if (fx.taisaku) p.push(['', `{完成}して 冷えたら 味パワー×${nx(fx.done)}`]);
  if (fx.lead) p.push(['スタート', `味パワー×${nx(fx.lead)}`]);
  if (fx.candyLead) p.push(['スタート', `キャンディ ぜんぶ×${nx(fx.candyLead)}`]);
  if (fx.sai) p.push(['アンカー', `{サイコー}の生地 1枚ごとに×${nx(fx.sai + FIN_STAR.sai * (star - 1))}`]);
  if (fx.fin) p.push(['アンカー', `味パワーの 合計×${nx(fx.fin)}`]);
  if (fx.chainFin) p.push(['アンカー', `{れんさ}1につき 合計+${pct(chainFinOf(fx, star))}`]);
  if (fx.doneFin) p.push(['アンカー', `{完成}1つにつき 合計+${pct(doneFinOf(fx, star))}`]);
  if (fx.koneFin) p.push(['アンカー', `{こね}1回につき 合計+${pct(koneFinOf(fx, star))}`]);
  if (fx.ripeFin) p.push(['アンカー', `{熟した実}1つにつき ×${nx(ripeFinOf(fx, star))}`]);
  if (fx.jamFin) p.push(['アンカー', `{ジャム}1つにつき 合計+${pct(jamFinOf(fx, star))}`]);
  if (fx.jamLead) p.push(['スタート', `ジャム ぜんぶ×${nx(fx.jamLead)}`]);
  if (fx.rollGrow) p.push(['スタート', '{実}が ぜんぶ1段育つ']);
  if (fx.tartFruit) p.push(['', `となりが{実}なら 味パワー×${nx(fx.tartFruit)}`]);
  if (fx.fruitAgain) p.push(['', '右が{実}なら もう1回発動']);
  if (fx.perGrow) p.push(['', `{実}が育つ たびに+${f(fx.perGrow)}`]);
  if (fx.binNow) p.push(['', `びんの実 1つにつき+${f(fx.binNow)}`]);
  if (fx.perJam) p.push(['', `作った{ジャム} 1つにつき+${f(fx.perJam)}`]);
  if (fx.shine) p.push(['', `右のジャムの 味パワー×${nx(fx.shine)}`]);
  if (fx.toro) p.push(['', '{熟した実}は びんに2つ分']);
  if (fx.madeJam) p.push(['', '入れた実の 効果がのる']);
  if (fx.fruitCake) p.push(['', '{熟した実}の 効果がのる']);
  if (fx.rally) p.push(['スタート', `主役ぜんぶ +${f(fx.rally)}`]);
  if (fx.doneRally) p.push(['スタート', `{完成}があれば 主役ぜんぶ+${f(fx.doneRally)}`]);
  if (fx.koneRally) p.push(['スタート', `パンぜんぶ +${f(fx.koneRally)}×{こね}`]);
  if (fx.perKone) p.push(['', `{こね}1回 につき+${f(fx.perKone)}`]);
  if (fx.perChain) p.push(['', `{れんさ}1 につき+${f(fx.perChain)}`]);
  if (fx.petit) p.push(['', `小さな飴を ${fx.petit}こ飛ばす`]);
  if (fx.link) p.push(['', `両どなりが キャンディなら {れんさ}+${fx.link}`]);
  if (fx.coldAgain) p.push(['', 'もう1回発動する']);   // 11/21 夜〜 キャンディは温度なし（前は ひんやり以下なら）
  if (fx.next) p.push(['', `次の主役の 味パワー×${nx(fx.next)}`]);
  if (fx.nb) p.push(['', `右2枚の 味パワー+${f(fx.nb)}`]);
  if (fx.again) p.push(['', `右を もう${fx.again}回発動`]);
  if (fx.koneUp) p.push(['', `{こね}た回数+${fx.koneUp}`]);
  if (fx.tane2) p.push(['', `こねると {パン種}+${fx.tane2}こ`]);
  if (fx.taneSpawn) p.push(['', `置くと {パン種}が${fx.taneSpawn}こ`]);
  if (fx.stop) p.push(['', 'ぜんぶの生地が {焦げ}ない']);
  if (fx.noburn && star < 3) p.push(['', '{焦げ}ない']);   // ★3の生地は みんな焦げない（きまり＝大きく見たときの下の札に書く）
  if (fx.sear) p.push(['', `右の生地の {焼き加減}+${fx.sear}`]);
  if (fx.grow && !(fx.chainUp && candyNight())) p.push(['', `右の大作の 大きさ+${fx.grow}`]);
  if (fx.chainUp && candyNight()) p.push(['', `{れんさ}+${fx.chainUp}（ここで 切れない）`]);
  if (fx.water) p.push(['', `右の{実}が ${fx.water}段育つ`]);
  if (fx.fert) p.push(['', 'ラウンドの終わりに {実}がぜんぶ 1段育つ']);
  if (fx.scare) p.push(['', `右2枚の {実}の効果×${nx(fx.scare)}`]);
  if (fx.basket) p.push(['', `次のショップに 花が${fx.basket}枚`]);
  if (fx.soon) p.push(['', '{青い実}になると 右をもう1回発動']);
  if (fx.heat) { const H = heatOf(); if (!H.none && !H.off) p.push(['', `${H.of ? H.of + ' ' : ''}{${H.word}}${fx.heat > 0 ? '+' : '−'}${Math.abs(fx.heat)}段`]); }   // ほのかは「火力+1段」（11/21：火力は鉄板がなくても上がる＝「鉄板の」をつけない）
  if (fx.call) p.push(['', binNight() ? '次のショップに {熟した実}が出る' : '次のショップに フィールドが出る']);
  if (fx.bitter && !fx.noburn) p.push(['', '焦げると ★2の 焦げクッキーになる']);
  if (fx.spd) p.push(['', fx.taisaku ? `大きくなる量 ${fx.spd > 0 ? '+' : '−'}${Math.abs(fx.spd)}` : `{焼き加減}が ${Math.abs(fx.spd)}段${fx.spd > 0 ? '多く' : '少なく'}進む`]);
  if (fx.candy && !p.length) p.push(['', '{れんさ}+1']);   // キャンディのきまり（れんさ）は、ほかの効果がないカードだけに書く（ことばの説明にもある）
  return p;
}
/* ことばの説明（黄色いことばと、いつの札をタップすると出る） */
const KW = {   // 11/19 しょーくん「長くても2行」：説明の吹き出しで2行（40字くらい）まで
  スタート: 'いちばん左のカード。いちばん先に発動する',
  アンカー: 'いちばん右のカード。いちばん最後に発動する',
  発動時: 'バトルで、このカードの番がきたとき',
  常時: '調理台にあるあいだ、ずっと',
  バトル開始時: 'バトルのはじめ（カードが発動する前）',
  置いたとき: 'ショップから調理台に置いたとき',
  こねたとき: 'ほかのパン生地と こねたとき',
  こね: 'パン生地どうしを まぜること。こねるたびにパン種が生まれる',
  パン種: 'こねると生まれる小さなパン生地（味パワー10）',
  焼かれるとき: 'この生地が焼かれるとき',
  焦げたとき: 'この生地が焦げたとき',
  サイコー: '焼き加減9。味パワー×5。もう一度焼かれると焦げる',
  焦げ: 'サイコーの生地が もう一度焼かれると焦げて、弱くなる',
  焼き加減: '生地の焼け具合（0〜9）。焼けるほど強い（9で×5）',
  火力: '火の強さ。バトル開始時に、生地が火力の分だけ焼ける。火力のカードがないと1ずつ弱まる',
  場: 'いちばん左の、フィールドのカードを置く所',
  /* みなも（11/19） */
  温度: '飴の温度。ラウンドの終わりに1段冷める（道具で上げ下げ）',
  大作: 'あたたかいうちに まぜて育て、冷えたら本気',
  大きさ: '大作の育ちぐあい（0〜9）。9で完成',
  完成: '大きさ9の大作。冷えたら本気（それまで×0.3）',
  固まる: '飴が冷えて、大作が本気になること（それまで×0.3）',
  /* みなも②（11/19） */
  れんさ: 'キャンディが続けて発動した数。素材や道具で0にもどる',
  ちいさなキャンディ: '小さな飴（1こ味パワー10）。れんさに数える',
  /* わかば（11/19） */
  くだもの: 'わかばの素材。ラウンドの終わりに 花→青い実→熟した実 と育つ',
  実: 'わかばの くだもの。ラウンドの終わりに 花→青い実→熟した実 と育つ',
  青い実: 'くだものの2段め。もう1回育つと熟した実',
  熟した実: 'くだものの3段め（いちばん強い）。★2のケーキにのせると★3',
  ジャム: '大きなびんに くだもの3つで生まれる★3',
  大きなびん: '飴ジャムの夜の場。くだものを3つ入れるとジャムになる',
};
