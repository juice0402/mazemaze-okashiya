/* ==== データ：食材モンスター・お礼・お金・お客さん・おなか（ノルマ） ==== */

/* 夕方にお店へ来る食材モンスター（日ごとに順番に来る）。drop は満足するとくれるモンスター素材（倉庫 S.stock に入る） */
const MONSTERS = [
  { id: 'slime', name: 'ぷるぷるスライム', drop: 'zeri', text: 'ゼリーでできたスライム。お店の砂糖をねらってきた' },
  { id: 'hitsuji', name: 'くもひつじ', drop: 'hoippu', text: 'ホイップの毛のひつじ。ふわふわ食べ歩き中' },
  /* レアモンスター（11/18 H-009）：rare の日から、前の夜が大満足なら次の夕方に来る（1回だけ）。alt は絵が届くまでの仮の絵 */
  { id: 'nijikurage', name: 'にじいろクラゲ', drop: 'niji', rare: 5, alt: 'mob-kurage', text: 'しずくクラゲのめずらしい仲間。にじいろにきらきら光る' },
  { id: 'mintousagi', name: 'ミントうさぎ', drop: 'minto', rare: 11, text: '葉っぱの耳のうさぎ。ふつうは人になつかない' },
  /* モブ3体も夜のお客さんに（11/18 H-016 しょーくん）：from の日にはじめて来て、次からスライム・くもひつじと順番に。
     しずくクラゲが先（にじいろクラゲの前ふり）。おなかとお礼はみんな同じ。セーブの S.night.mon は番号なので、新しい子はうしろに足す */
  { id: 'kurage', name: 'しずくクラゲ', drop: 'kanten', from: 3, alt: 'mob-kurage', text: 'しずくでできた小さなクラゲ。ひんやりした夜風といっしょに来る' },
  { id: 'tokage', name: 'こんぺいトカゲ', drop: 'hoshi', from: 6, alt: 'mob-tokage', text: 'しっぽが金平糖のトカゲ。星くずみたいな砂糖をこぼして歩く' },
  { id: 'hiyoko', name: 'ほのお鳥のひよこ', drop: 'karamel', from: 9, alt: 'mob-hiyoko', text: 'ほのお鳥のひよこ。ぽかぽかの羽で、さわるとあったかい' },
];
/* その日の夕方に来るモンスター（MONSTERS の番号）：ふだんは rare のない子を順番に（from の日から入る）。
   レアは前の夜（S.yesterday）が大満足のときだけ。from の日をすぎて、まだ来ていない子は先に来る */
function nightMonster() {
  const r = MONSTERS.findIndex(m => m.rare && S.day >= m.rare && !S.seenMon.includes(m.id));
  if (r >= 0 && S.yesterday && S.yesterday.mood >= 3) return r;
  const nw = MONSTERS.findIndex(m => m.from && S.day >= m.from && !S.seenMon.includes(m.id));
  if (nw >= 0) return nw;
  const reg = MONSTERS.filter(m => !m.rare && (m.from || 1) <= S.day);
  const y = S.yesterday ? reg.findIndex(m => m.id === S.yesterday.mon) : -1;   // きのうの子の次（同じ子が続かない）
  return MONSTERS.indexOf(reg[y >= 0 ? (y + 1) % reg.length : (S.day - 1) % reg.length]);
}

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
/* おなか（11/19 しょーくん「引きが良ければ2ラウンド目から満タンを狙える・ビルドを組めないと最後まで満たせない」「日がたっても変動なし（キャラに成長がないので）」）。
   ボット（tools/bot.mjs）の火力クッキー・大作・くだものケーキで決めた：r1〜2 は運のいい4人に1人が満タン・後半はちゃんと組めた夜（まんなかくらい）で満タン・組めないと半分にも届かない */
const QUOTA = [450, 1500, 3800, 7500, 15000, 27000, 42000, 63000, 90000];
/* ビルドごとのおなか（11/19 しょーくん「引きやビルドが悪ければ最後まで全然だめな感じで、うまく噛み合ったらラウンド9は完璧」）：
   おなか ＝ QUOTA ÷（bal[0] × bal[1]^(ラウンド−1)）を2けたに丸める。bal は cards.js の BUILDS（はじめの強さ・ラウンドごとの伸び）。
   ビルドごとに味パワーの伸び方がちがう（こね生地は序盤に強く後半ゆるやか・キャンディは後半に爆発）ので、おなかの方をそのシェフに合わせる（味パワーの計算と画面の数字はそのまま）。
   合わせ方は tools/bot.mjs の SUM=1（ねらい：うまい人の満タンが ラウンド2で4人に1人・ラウンド9で半分・組めない人は最後まで3割にも届かない）
   ラウンド1（11/20 しょーくん「どのビルドも一番最初は、引きが良ければコイン+1まで」「スタートやアンカーに★2を初手から置ければギリギリ+1」「昼の頑張りなし」）：
   昼のハート0で ★2 をスタートかアンカーに置いた夜の まんなかの味パワー ＝ おなかの半分。式で合わないビルドは BUILDS の r1（ラウンド1のおなか）で決める。はかり方は tools/bot.mjs の R1=1 */
const round2 = v => { const p = Math.pow(10, Math.max(0, Math.floor(Math.log10(v)) - 1)); return Math.round(v / p) * p; };
function quota(r, day, build) {
  const q = QUOTA[Math.max(0, Math.min(QUOTA.length - 1, r - 1))];
  let b = build; if (!b) try { b = N && N.build; } catch (e) { b = null; }
  const B = b && BUILDS[b] && BUILDS[b].bal;
  if (r === 1 && b && BUILDS[b] && BUILDS[b].r1) return BUILDS[b].r1;
  return B ? round2(q / (B[0] * Math.pow(B[1], r - 1))) : q;
}
function nightHP(day, build) { let s = 0; for (let r = 1; r <= ROUNDS; r++) s += quota(r, day, build); return s; }

/* お昼のお客さん：すきな味が1つでも入ったお菓子は2倍の値段で買ってハート。ハート3つで常連さん（あとで仲間に） */
/* お客さん：名前・見た目（キャラなのでリーダー）。すきな味は src/data/hiru.js の CUST_LIKES（昼のチャット） */
const CUSTOMERS = [
  { id: 'kodomo', name: '妖精の子', h: 15, small: true, skin: '#f6cfae', hair: '#5a3418', hat: '#e0484f', hatDk: '#a8302f', shirt: '#f7c843', arm: '#d9a72a', pants: '#3f6fb5' },
  { id: 'gakusei', name: 'けもみみの子', h: 19, skin: '#f3c9a5', hair: '#2a1d1a', shirt: '#2f3f6b', arm: '#253256', pants: '#2f3f6b', collar: '#ffffff' },
  { id: 'otona', name: '冒険者', h: 20, skin: '#eab88f', hair: '#6b4426', shirt: '#5f8f6a', arm: '#4a7354', pants: '#3b3b46' },
  { id: 'obaachan', name: '魔女のおばあちゃん', h: 18, skin: '#f1c7a6', hair: '#cfcad6', bun: true, shirt: '#8d6bb3', arm: '#735596', pants: '#5b4a6e' },
];
const CUST = Object.fromEntries(CUSTOMERS.map(c => [c.id, c]));
const HEARTS_REGULAR = 3;
