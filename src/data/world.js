/* ==== データ：食材モンスター・お礼・お金・お客さん・おなか（ノルマ） ==== */

/* 夕方にお店へ来る食材モンスター（日ごとに順番に来る）。drop は満足するとくれるモンスター素材（倉庫 S.stock に入る） */
const MONSTERS = [
  { id: 'slime', name: 'ぷるぷるスライム', drop: 'zeri', text: 'ゼリーでできたスライム。お店の砂糖をねらってきた' },
  { id: 'hitsuji', name: 'くもひつじ', drop: 'hoippu', text: 'ホイップの毛のひつじ。ふわふわ食べ歩き中' },
];

/* お金（11/18 しょーくん「現実の値段っぽく。売値・原価・モンスターのお金のバランスが崩れないように」）
   お菓子1こ：ふつう200〜300円・モンスター素材入り400〜600円（cards.js の recipeOf の price＝材料の value×YEN_PER_VALUE）
   基本素材の仕入れ（原価）は売値の3割くらい＝1回分（3こ）で材料1つ 80〜150円（中身と値段は昼のチャットの hiru.js）
   序盤の1日の売上は1,500円くらい。モンスターのお礼のコインは、その1〜5割 */
const START_MONEY = 1000;    // はじめのお金（プロローグ「お財布、さみしい」）
const YEN_PER_VALUE = 7;
/* おもてなしの満足（味パワーの合計が、おなかいっぱいの量 nightHP のどれだけか）→ お礼。いつも少しはくれる */
const MOODS = [
  null,
  { name: 'ちょっと満足', mats: 1, coins: 200 },
  { name: '満足', mats: 2, coins: 400 },
  { name: '大満足', mats: 3, coins: 800 },
];
const moodOf = (score, belly) => score >= belly ? 3 : score >= belly * 0.5 ? 2 : 1;

/* ラウンドごとのおなか（ノルマ。まんぞくさせると夜のコイン+2）。日がたつほど大きくなる */
const ROUNDS = 9;
const quota = (r, day) => Math.round(160 * Math.pow(1.9, r - 1) * (1 + 0.6 * (day - 1)));   // 11/17 夕方：生地を焼くバトル（5マス）に合わせた
function nightHP(day) { let s = 0; for (let r = 1; r <= ROUNDS; r++) s += quota(r, day); return s; }

/* お昼のお客さん：すきな味が1つでも入ったお菓子は2倍の値段で買ってハート。ハート3つで常連さん（あとで仲間に） */
/* お客さん：名前・見た目（キャラなのでリーダー）。すきな味は src/data/hiru.js の CUST_LIKES（昼のチャット） */
const CUSTOMERS = [
  { id: 'kodomo', name: 'こども', h: 15, small: true, skin: '#f6cfae', hair: '#5a3418', hat: '#e0484f', hatDk: '#a8302f', shirt: '#f7c843', arm: '#d9a72a', pants: '#3f6fb5' },
  { id: 'gakusei', name: '学生さん', h: 19, skin: '#f3c9a5', hair: '#2a1d1a', shirt: '#2f3f6b', arm: '#253256', pants: '#2f3f6b', collar: '#ffffff' },
  { id: 'otona', name: 'おとなの人', h: 20, skin: '#eab88f', hair: '#6b4426', shirt: '#5f8f6a', arm: '#4a7354', pants: '#3b3b46' },
  { id: 'obaachan', name: 'おばあちゃん', h: 18, skin: '#f1c7a6', hair: '#cfcad6', bun: true, shirt: '#8d6bb3', arm: '#735596', pants: '#5b4a6e' },
];
const CUST = Object.fromEntries(CUSTOMERS.map(c => [c.id, c]));
const HEARTS_REGULAR = 3;
