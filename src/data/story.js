/* ==== セリフと日記（持ち主：昼のチャット【okashi-hiru】・11/18 H-005）
   文のもとは claude/okashi-scenario.md。はじめの形はリーダーが①④と1日目の日記・ふだんの日記を写して入れた（ここからは昼のチャットが直す）
   1行の書き方（会話の部品 talk.js が読む）：
     「ほのか：セリフ」・「ほのか【びっくり】：セリフ」（表情は talk.js の TALKERS の faces）・「（地の文）」・「→ …」は読まない
   リーダーの画面が呼ぶもの：
     STORY.prologue … ゲームのはじめに1回（プロローグの画面）
     STORY.evening(rec) … 夕方：モンスターが来たときの会話（夜の画面のはじめ・ショップの前）
     STORY.thanks(rec) … おもてなしのあと：満足したモンスターがお礼をくれるときの会話
     STORY.diary(rec) … 1日のまとめの日記。文字を2つ返す（名前は入れない）
     STORY.morning(rec, yest) … 朝のひとり言（朝の画面＝昼のチャットが呼ぶ）
   rec は S.today（その日の記録）・yest は S.yesterday。中身は docs/MAP.md の「データの形」 ==== */
const STORY = {
  prologue: [
    '（森のはずれ、こもれび町。朝。小さなお店の前）',
    'ほのか【わくわく】：ここが……わたしのお店！',
    'ほのか【うれしい】：まぜまぜおかし屋、今日から開店です！',
    'ほのか【感動】：見習いのころから、ずーっと夢だったんだよね',
    'ほのか【不安】：……町からはちょっと遠いけど。森、すぐそこだけど',
    'ほのか【やる気】：だいじょうぶ！おいしいお菓子があれば、お客さんは来てくれる！',
    'ほのか【やる気】：よーし、さっそく仕込みだ！',
  ],
  evening(rec) {
    if (rec.day === 1) return [
      '（夕方。カラン、とドアの音）',
      'ほのか【考える】：あれ？もう閉店なのに……お客さん？',
      '（ぷるぷるスライムが入ってくる）',
      'ほのか【びっくり】：も、モンスター！？',
      'スライム：ぷるる……（クンクン）',
      'ほのか【考える】：……もしかして、クッキーの匂いにつられて来たの？',
      'ほのか【やる気】：よーし、それなら、おもてなしだ！',
      'ほのか【ドヤ】：とびっきりのクッキー、ふるまってあげる！',
    ];
    return [];
  },
  thanks(rec) {
    if (rec.day === 1) return [
      '（おなかいっぱいのスライム）',
      'スライム：ぷるん♪',
      '（ゼリーとコインを置いていく）',
      'ほのか【びっくり】：これ……スライムのゼリー？',
      'ほのか【うっとり】：ぷるぷるしてる……新しいレシピに使えるかも！',
      'ほのか【わくわく】：なんだか、明日が楽しみになってきた！',
    ];
    return [];
  },
  morning(rec, yest) { return []; },
  diary(rec) {
    if (rec.day === 1) return ['お店をひらいた日。お客さんは' + rec.visitors + '人。', '夜にスライムが来た。ゼリー、何に使おうかな？'];
    const L1 = '今日のお客さんは' + rec.visitors + '人。';   // 多い・少ないの目安は昼の数字が決まってから
    const mon = rec.mon ? MONSTERS.find(m => m.id === rec.mon) : null, gift = Object.keys(rec.gifts || {})[0];
    let L2;
    if (mon && rec.newMon) L2 = '夜に' + mon.name + 'が来た。' + (gift ? MATS[gift].short + 'をくれた！' : '');
    else if (rec.flashes.length) L2 = recipeOf(rec.flashes[0]).name + 'をひらめいた！';
    else if (rec.kanbanSoldOut && rec.kanban) L2 = '看板の' + recipeOf(rec.kanban).name + '、売り切れ！';
    else if (mon && rec.mood >= 3) L2 = mon.name + '、おなかいっぱいで帰っていった。';
    else L2 = pick(['今日もオーブンはごきげんだった。', '焦がしたのは2回だけ。えらい！']);
    return [L1, L2];
  },
};
