/* ==== 朝と昼の数字・素材・レシピ（持ち主：昼のチャット【okashi-hiru】・11/18 しょーくん「全部おすすめで」）
   夜と昼をまたぐ数字（はじめのお金 START_MONEY・モンスター素材の中身 MATS・お礼のコイン）はリーダー（src/data/cards.js・world.js）
   お金は円。リーダーの「現実の値段っぽく」（world.js）に合わせて、昼のチャットの仮の数字を20倍にした（はじめのお財布 50→1000円） ==== */

/* 朝昼の素材：町のやさしい食材5つ（朝にお金で仕入れる）と、仲間が来たら出る素材。モンスター素材は MATS の fushigi（夜にもらう）
   price＝仕入れ1こ（円）・form＝モンスター素材とまぜたときのお菓子の形・col は仮の絵の色・who は仕入れに出てくる仲間 */
const HIRU_MATS = {
  mugi:       { name: 'こもれび小麦',   short: '小麦',     price: 80,  form: 'クッキー', col: '#e9c27a', col2: '#b8863c' },
  hachimitsu: { name: '森のはちみつ',   short: 'はちみつ', price: 120, form: 'ケーキ',   col: '#f2a93b', col2: '#b86a14' },
  milk:       { name: 'まきばミルク',   short: 'ミルク',   price: 100, form: 'アイス',   col: '#fffaf0', col2: '#d9c9b0' },
  egg:        { name: 'こもれびたまご', short: 'たまご',   price: 100, form: 'プリン',   col: '#ffe08a', col2: '#e8a93a' },
  ichigo:     { name: '野いちご',       short: '野いちご', price: 140, form: 'タルト',   col: '#e8475f', col2: '#9e2238' },
  mizuame:    { name: '水あめ',         short: '水あめ',   price: 160, form: 'あめ',     col: '#ffd9a0', col2: '#e0a050', who: 'minamo' },
  herb:       { name: 'ハーブ',         short: 'ハーブ',   price: 160, form: 'ゼリー',   col: '#7cc576', col2: '#3f8a45', who: 'wakaba' },
};
const BASE_IDS = ['mugi', 'hachimitsu', 'milk', 'egg', 'ichigo'];
const MON_PRICE = 400;   // モンスター素材は1こ400円として数える（売値の計算だけ。仕入れはできない）
const MON_PRICE_RARE = 450;   // レアモンスターの素材（にじいろ水あめ・きらきらミント）。お菓子1こが600円までになるように（11/18 しょーくん）

/* レシピ表：材料2つ（順番は関係なし・同じ素材2つもOK）で1つのお菓子。名前は8文字まで */
const HIRU_RECIPES = {};
[
  ['mugi', 'mugi', 'かりかりラスク'], ['mugi', 'hachimitsu', 'はちみつクッキー'], ['mugi', 'milk', 'ミルクスコーン'], ['mugi', 'egg', 'マドレーヌ'], ['mugi', 'ichigo', 'いちごタルト'],
  ['hachimitsu', 'hachimitsu', 'はちみつ飴'], ['hachimitsu', 'milk', 'ミルクキャラメル'], ['hachimitsu', 'egg', 'はちみつカステラ'], ['hachimitsu', 'ichigo', '野いちごジャム'],
  ['milk', 'milk', 'ミルクアイス'], ['milk', 'egg', 'カスタードプリン'], ['milk', 'ichigo', 'いちごババロア'],
  ['egg', 'egg', 'たまごボーロ'], ['egg', 'ichigo', 'いちごスフレ'], ['ichigo', 'ichigo', 'いちごソルベ'],
  ['mizuame', 'mugi', 'ステンドクッキー'], ['mizuame', 'hachimitsu', 'こはく糖'], ['mizuame', 'milk', 'ミルク飴'], ['mizuame', 'egg', 'マシュマロ'], ['mizuame', 'ichigo', 'いちごドロップ'], ['mizuame', 'mizuame', 'しずくキャンディ'],
  ['herb', 'mugi', 'ハーブサブレ'], ['herb', 'hachimitsu', 'ハーブのど飴'], ['herb', 'milk', 'ハーブムース'], ['herb', 'egg', 'ハーブシフォン'], ['herb', 'ichigo', 'ハーブゼリー'], ['herb', 'herb', 'ハーブティー'], ['herb', 'mizuame', 'ハーブキャンディ'],
].forEach(([a, b, name]) => { HIRU_RECIPES[recipeKey(a, b)] = name; });

/* モンスター素材の「ことば」（11/18 しょーくん）。モンスター素材＋ほかの素材＝ことば＋形。モンスター素材どうし＝まぜまぜパフェ
   hoshi・karamel・kanten は、モブ3体がお客さんになったときの素材（H-016・cards.js の MATS にリーダーが足すまでは出てこない） */
const MON_WORD = { zeri: 'ぷるぷる', hoippu: 'ふわもこ', niji: 'にじいろ', minto: 'ミント', hoshi: 'ほしぞら', karamel: 'こんがり', kanten: 'ひんやり' };
const isHiruMat = m => !!HIRU_MATS[m];
const isMonMat = m => !!(MATS[m] && MATS[m].fushigi);
const matShort = m => HIRU_MATS[m] ? HIRU_MATS[m].short : MATS[m] ? MATS[m].short : m;
/* 材料だなのマスに出す名前（11/21 リーダー：アプリの中は字が 8px より小さくならない → 7文字の名前がマスからはみ出す・しょーくん「マスでは短い名前」）
   マスの中は約50px＝6文字まで（5文字をこえると横にちぢめる・6文字で 8.3px）。ほかの所（セリフ・レシピ帳・吹き出し）は matShort のまま */
const M_TILE_NM = { zeri: 'ゼリー', hoippu: 'ホイップ', niji: 'にじ水あめ', minto: 'ミント', hoshi: 'ほしくず', karamel: 'カラメル' };
const mTileNm = m => M_TILE_NM[m] || matShort(m);
const matName = m => HIRU_MATS[m] ? HIRU_MATS[m].name : MATS[m] ? MATS[m].name : m;
const matPrice = m => HIRU_MATS[m] ? HIRU_MATS[m].price : isMonMat(m) ? (MATS[m].rare ? MON_PRICE_RARE : MON_PRICE) : MATS[m] ? MATS[m].value * YEN_PER_VALUE : 0;

/* 朝昼のお菓子（レシピの key＝'a+b'）：名前・材料・1この値段（材料2つの値段の合計）。前の形の key（夜のカードの材料どうし）は cards.js の recipeOf で */
function candyOf(key) {
  const mats = String(key).split('+'), [a, b] = mats;
  if (!(isHiruMat(a) || isHiruMat(b))) {
    if (isMonMat(a) && isMonMat(b)) return { key, mats, name: 'まぜまぜパフェ', price: matPrice(a) + matPrice(b), mon: mats };
    const r = recipeOf(key); return { key, mats, name: r.name, price: r.price, mon: r.needs, old: true };
  }
  const mon = mats.filter(isMonMat);
  let name = HIRU_RECIPES[recipeKey(a, b)];
  if (!name) { const m = mon[0], other = mats.find(x => isHiruMat(x)); name = (MON_WORD[m] || (MATS[m] && MATS[m].adj) || '') + HIRU_MATS[other].form; }
  return { key, mats, name, price: matPrice(a) + matPrice(b), mon };
}
const candyHas = (key, m) => String(key).split('+').includes(m);

/* ---------- 棚 ---------- */
const BATCH = 3;          // 1回焼くと同じお菓子3こ＝棚の1マス
const SHELF_COLS = 3;     // 棚は3列。看板の枠は、まんなかの列の上から（行の数のまんなか）
const kanbanSlot = n => SHELF_COLS * Math.floor((Math.ceil(n / SHELF_COLS) - 1) / 2) + 1;
/* おそろいの段（11/19 しょーくん）：横1段の3マスのお菓子が、同じ素材を1つずつふくむ（看板のマスも数える・空きがあるとならない）
   slots は day.js の shelfSlots の slots（{ s: 棚のお菓子, i }）。段ごとに [{ r＝段, mats＝そろった素材, out＝売り切れがある }] */
function soroiRows(slots) {
  const rows = [];
  for (let r = 0; (r + 1) * SHELF_COLS <= slots.length; r++) {
    const row = slots.slice(r * SHELF_COLS, (r + 1) * SHELF_COLS);
    if (row.some(o => !o)) continue;
    const sets = row.map(o => new Set(String(o.s.key).split('+')));
    const mats = [...sets[0]].filter(m => sets.every(x => x.has(m)));
    if (mats.length) rows.push({ r, mats, out: row.some(o => o.s.n <= 0) });
  }
  return rows;
}

/* ---------- 昼のパズル（11/21 しょーくん「お昼を夜レベルに面白く」「陳列を楽しむパズルビルド」→ えらぶ質問で「となりの相性」「たての列のシリーズ」・相性は「2つセットで売れる」）
   となりの相性：横か たてにとなりあう2マスのお菓子に、相性のいい素材の組み合わせ（AISHO）が入っていると、あいだに結び目（ui-aisho）。
     どちらかを買ったお客さんは、相手のお菓子もいっしょに買う（day.js の dServeMore）。見つけた組み合わせは相性帳（S.seen の ai:<id>＝見つけた日）
   たての列のシリーズ：たての列のマスがぜんぶ埋まって、ぜんぶ同じなかま（KATA）だと、列の上からリボン（ui-series）。その列から買ったお客さんは、同じ列からもう1こ
   画面に数字は出さない（結び目とリボンと、売れたときのキラキラで見せる） ---------- */
const KATA = { yaki: '焼き菓子', hiya: 'ひんやり', ame: 'あめ', fuwa: 'ふわふわ' };
const KATA_OF = {};
[
  ['yaki', [['mugi', 'mugi'], ['mugi', 'hachimitsu'], ['mugi', 'milk'], ['mugi', 'egg'], ['mugi', 'ichigo'], ['egg', 'egg'], ['mizuame', 'mugi'], ['herb', 'mugi']]],
  ['hiya', [['milk', 'milk'], ['milk', 'egg'], ['ichigo', 'ichigo'], ['herb', 'ichigo'], ['herb', 'herb']]],
  ['ame', [['hachimitsu', 'hachimitsu'], ['hachimitsu', 'milk'], ['hachimitsu', 'ichigo'], ['mizuame', 'hachimitsu'], ['mizuame', 'milk'], ['mizuame', 'ichigo'], ['mizuame', 'mizuame'], ['herb', 'hachimitsu'], ['herb', 'mizuame']]],
  ['fuwa', [['hachimitsu', 'egg'], ['milk', 'ichigo'], ['egg', 'ichigo'], ['mizuame', 'egg'], ['herb', 'milk'], ['herb', 'egg']]],
].forEach(([k, L]) => L.forEach(([a, b]) => { KATA_OF[recipeKey(a, b)] = k; }));
const KATA_ICON = { yaki: 'hachimitsu+mugi', hiya: 'milk+milk', ame: 'hachimitsu+hachimitsu', fuwa: 'egg+ichigo' };   // 相性帳のなかまの行の絵（そのなかまのお菓子1つ）
const KATA_FORM = { mugi: 'yaki', ichigo: 'yaki', hachimitsu: 'fuwa', milk: 'hiya', egg: 'hiya', herb: 'hiya', mizuame: 'ame' };   // モンスター素材のお菓子は、もう1つの素材の形（クッキー・タルト・ケーキ…）で
function candyKata(key) {
  const mats = String(key).split('+'), k = KATA_OF[recipeKey(mats[0], mats[1])];
  if (k) return k;
  const mon = mats.filter(isMonMat);
  if (mon.length === 2) return 'hiya';   // まぜまぜパフェ
  const o = mats.find(isHiruMat);
  return mon.length && o ? KATA_FORM[o] || null : null;
}
const AISHO = [
  ['ichigo', 'milk', 'いちごミルク'], ['hoshi', 'milk', 'ミルキーウェイ'], ['hachimitsu', 'zeri', 'はちみつゼリー'],   // 基本の素材だけの相性は いちごミルクだけ（多いと、置くだけでぜんぶつながる・11/21）
  ['ichigo', 'mizuame', 'いちご飴'], ['hachimitsu', 'herb', 'はちみつハーブティー'], ['herb', 'milk', 'ハーブミルクティー'],
  ['hoippu', 'ichigo', 'いちごのショートケーキ'], ['egg', 'karamel', 'カラメルプリン'], ['ichigo', 'zeri', 'いちごゼリー'],
  ['kanten', 'minto', 'ひんやりミント'], ['hoshi', 'mizuame', '星くずキャンディ'], ['hachimitsu', 'kanten', 'はちみつ寒天'],
  ['hoippu', 'karamel', 'キャラメルホイップ'], ['minto', 'niji', 'にじいろソーダ'],
].map(([a, b, name]) => ({ id: recipeKey(a, b), a, b, name }));
const AISHO_BY = Object.fromEntries(AISHO.map(x => [x.id, x]));
/* 2つのお菓子の相性（同じお菓子どうしはなし）。2つの中で、ちがう素材どうしの組み合わせが AISHO にあれば */
function aishoOf(k1, k2) {
  if (k1 === k2) return null;
  const A = String(k1).split('+'), B = String(k2).split('+');
  for (const x of A) for (const y of B) if (x !== y) { const p = AISHO_BY[recipeKey(x, y)]; if (p) return p; }
  return null;
}
/* 棚のマス（shelfSlots の slots）の、となりの相性（links：i が左か上・dir r＝横 d＝たて）と、たての列のシリーズ（series：列 c・なかま kata） */
function puzzleOf(slots) {
  const n = slots.length, rows = Math.ceil(n / SHELF_COLS), links = [], series = [];
  for (let i = 0; i < n; i++) {
    const o = slots[i]; if (!o) continue;
    for (const [j, dir] of [[i + 1, 'r'], [i + SHELF_COLS, 'd']]) {
      if (j >= n || (dir === 'r' && j % SHELF_COLS === 0)) continue;
      const q = slots[j], p = q && aishoOf(o.s.key, q.s.key);
      if (p) links.push({ i, j, dir, p, out: o.s.n <= 0 || q.s.n <= 0 });
    }
  }
  if (rows >= 2) for (let c = 0; c < SHELF_COLS; c++) {
    const col = []; for (let r = 0; r < rows; r++) col.push(slots[r * SHELF_COLS + c]);
    if (col.some(o => !o)) continue;
    const k = candyKata(col[0].s.key);
    if (k && col.every(o => candyKata(o.s.key) === k)) series.push({ c, kata: k, out: col.every(o => o.s.n <= 0) });
  }
  return { links, series };
}

/* ---------- 昼のお客さん ---------- */
const DAY_MS = 40000;     // 営業は約40秒（はやおくりで約20秒）
const DAY_FAST = 2;       // はやおくりの速さ
const CUST_DAY1 = 3;      // 1日目は3人（シナリオ③）
const CUST_BASE = 4;      // 2日目から：4人＋評判のびんの数＋立て看板
const REP_JAR = 10;       // ハート10こで評判のびん1つ → 次の日からお客さん+1人（まとめのびんは flow.js の jarHTML がこれを使う）
const LIKE_W = 3;         // お客さんごとの出やすい味（下）は3倍出やすい
const KANBAN_W = 2;       // 看板のお菓子の素材がすきなお客さんは2倍来やすい
const SOROI_W = 1.5;      // おそろいの段1つごとに、その素材がすきなお客さんが1.5倍来やすい（看板とかけ算・開店のときの並びで決まる・11/19 仮）
const OTHER_BUY = 0.5;    // すきな味のお菓子がないとき、ほかのお菓子を1こ買う人の割合（ハートなし）
const MORE_P = 0.22;      // 買った人が「これもおいしそう」ともう1こ買う割合（11/19 しょーくん「たまには2、3こ」）
const MORE3_P = 0.25;     // もう1こ買った人が、さらにもう1こ（3こ買い＝約5％・「3個買いはたまーにね」）
/* すきな味の出やすさ（お客さんの名前と見た目は world.js の CUSTOMERS・リーダー）
   お客さん（11/18 16時 しょーくん：ファンタジーに・id はそのまま）：kodomo＝妖精の子・gakusei＝けもみみの子（ねこ耳の男の子・14さいくらい）・otona＝冒険者（20代のお兄さん）・obaachan＝魔女のおばあちゃん
   モンスター素材も1つずつ割りあて（11/18 しょーくん）：妖精の子＝ゼリー・にじいろ水あめ／けもみみの子＝ミント・ほしくずシュガー／冒険者＝ホイップ・ほのおカラメル／魔女のおばあちゃん＝しずく寒天。まだ倉庫に入ったことのない素材は、すきな味にならない（seenMats） */
const CUST_LIKES = {
  kodomo: ['ichigo', 'hachimitsu', 'zeri', 'niji'],
  gakusei: ['milk', 'ichigo', 'minto', 'hoshi'],
  otona: ['mugi', 'egg', 'herb', 'hoippu', 'karamel'],
  obaachan: ['hachimitsu', 'egg', 'mizuame', 'kanten'],
  elf: ['hachimitsu', 'herb', 'minto', 'kanten'],
  vamp: ['ichigo', 'mizuame', 'niji', 'hoippu'],
  tanuki: ['mugi', 'egg', 'hoshi', 'karamel'],
};
/* 新しいお客さん（11/21 しょーくん「常連さん大量に増やす」→ えらぶ質問で新しい種族3つ）：名前と、絵がないときの仮の色。world.js の CUSTOMERS のうしろに足す
   その日から来る（CUST_DAY）・絵 cust-<id> が来てから（それまでは来ない）。見た目3人：1・2 は常連さん（REG_WHO）・3 はふつう。設定は claude/okashi-story.md */
const CUST_NEW = [
  { id: 'elf', name: 'エルフのうたうたい', h: 19, skin: '#f7dcc4', hair: '#e8d08a', shirt: '#8fc3e8', arm: '#6fa6cf', pants: '#e9dcc4' },
  { id: 'vamp', name: '吸血鬼のお嬢さま', h: 18, skin: '#f4e6ea', hair: '#e8b8c8', shirt: '#2a1d24', arm: '#3a2630', pants: '#b8243c' },
  { id: 'tanuki', name: '行商のたぬき', h: 17, skin: '#a8784e', hair: '#5a3c24', shirt: '#d9822b', arm: '#b8691f', pants: '#6b4a2e' },
];
for (const c of CUST_NEW) if (!CUST[c.id]) { CUSTOMERS.push(c); CUST[c.id] = c; }
const CUST_DAY = { elf: 4, vamp: 7, tanuki: 10 };
const custOpen = (c, d = S.day) => d >= (CUST_DAY[c] || 0) && (!CUST_DAY[c] || !!ART['cust-' + c]);
/* 常連さん（11/19・仮）：段ごとに [その日から, その種類のお客さんからのハートの合計, 条件]。条件 minamo＝みなもが仲間・trip＝ガルドが旅のあいだ（日にちは見ない）
   その日にあてはまる常連さんがいれば、その日はかならず来る（1日1場面・仲間が来る日と物語の場面の日はなし）。来るのは1まいめの見た目。セリフは story.js の STORY.reg */
const REG_STEPS = {
  kodomo:   [[2, 1], [5, 3], [8, 6, 'minamo']],
  gakusei:  [[3, 1], [6, 3], [9, 6], [12, 10]],
  otona:    [[2, 1], [5, 3], [9, 6]],
  obaachan: [[2, 1], [6, 3], [0, 6, 'trip']],
  /* 11/21 新しい常連さん：はじめて来る日（CUST_DAY）に段1。2人目は1人目の段1のあと（after:<1人目>）。ハートはその種類のお客さんの合計 */
  serena:   [[4, 0], [8, 3], [12, 6]],
  pio:      [[6, 1, 'after:serena'], [10, 4], [14, 8]],
  rozetta:  [[7, 0], [10, 3], [14, 6]],
  gilbert:  [[9, 1, 'after:rozetta'], [13, 4], [16, 8]],
  ponkichi: [[10, 0], [13, 3], [16, 6], [19, 9]],
  ponta:    [[12, 1, 'after:ponkichi'], [15, 4], [18, 8]],
};
/* 常連さん → お客さんの種類と見た目（はじめの4人は種類の名前がそのまま常連さんの名前・見た目1） */
const REG_WHO = { serena: ['elf', 1], pio: ['elf', 2], rozetta: ['vamp', 1], gilbert: ['vamp', 2], ponkichi: ['tanuki', 1], ponta: ['tanuki', 2] };
const regWho = k => { const w = REG_WHO[k]; return w ? { c: w[0], vr: w[1] } : { c: k, vr: 1 }; };
const REG_TRIP = 3;   // ガルドの旅：段3のあと、この日数は来ない（1まいめの見た目を出さない）。帰るのは、そのあとマーサの段3がすんでから
const regTrip = () => (S.seen['rg:otona'] || 0) >= 3 && !S.seen['rg:pair'];
function custCount() {
  if (S.day <= 1) return CUST_DAY1;
  return CUST_BASE + Math.floor(S.rep / REP_JAR) + (S.goods.tatekanban || 0);
}
/* すきな味になれる素材：その日までに倉庫に入ったことのある素材（倉庫・知っているレシピ・棚から） */
function seenMats() {
  const set = new Set(Object.keys(S.stock));
  for (const k of Object.keys(S.recipes)) k.split('+').forEach(m => set.add(m));
  for (const s of S.shelf) s.key.split('+').forEach(m => set.add(m));
  const out = [...set].filter(m => HIRU_MATS[m] || isMonMat(m));   // 夜のデッキだけの素材（はじめから知っている komugi+sato のトカゲ砂糖など）は朝に作れないので、すきな味にしない（11/19）
  return out.length ? out : BASE_IDS.slice();
}
function wpick(items, w) {
  let sum = 0; for (const x of items) sum += w(x);
  let r = Math.random() * sum;
  for (const x of items) { r -= w(x); if (r < 0) return x; }
  return items[items.length - 1];
}
/* その日のお客さん（開店のときに決める）：[{ c: お客さんの id, like: すきな素材 }] */
/* その日のお客さんの順番：同じ種類のお客さんは続けて来ない。見た目ちがいの絵（day-scene.js の custVariants）があれば、その日まだ来ていない見た目から（vr） */
function custPlan(n, kanbanKey, soroi = [], first = [], fix = null, fc = null) {   // fc＝その日の予報（fcGet・11/21）：多めのお客さん×FC_W・人気の味×FC_LIKE_W   // soroi＝おそろいの段の素材（段の数だけ）・first＝はじめに来るお客さん（昼のできごと）・fix＝{ i, c, reg, duo }：その日に来る常連さん（1まいめの見た目）
  const pool = seenMats(), km = kanbanKey ? kanbanKey.split('+') : [], used = new Set(fix ? [fix.c + (fix.vr || 1)] : []);
  const sw = m => Math.pow(SOROI_W, soroi.filter(x => x === m).length);
  const likeOf = c => { const pref = CUST_LIKES[c] || []; return wpick(pool, m => (pref.includes(m) ? LIKE_W : 1) * (km.includes(m) ? KANBAN_W : 1) * sw(m) * decoLikeW(m) * (fc && m === fc.m ? FC_LIKE_W : 1)); };
  const away = regTrip() ? ['otona'] : [];   // 旅に出ている常連さんは、1まいめの見た目で来ない
  let prev = null;
  return Array.from({ length: n }, (_, i) => {
    if (fix && i === fix.i) { prev = fix.c; return { c: fix.c, vr: fix.vr || 1, like: (fix.c === 'kodomo' || /^rozetta/.test(fix.reg)) && pool.includes('ichigo') ? 'ichigo' : likeOf(fix.c), reg: fix.reg, duo: fix.duo }; }   // ルルとロゼッタはいちごが大すき
    const c = first[i] || wpick(CUSTOMERS.map(x => x.id).filter(id => custOpen(id) && id !== prev && !(fix && i + 1 === fix.i && id === fix.c)), id => decoCustW(id) * (fc && id === fc.c ? FC_W : 1)); prev = c;   // 新しいお客さんは CUST_DAY から   // かざりのテーマで来やすさが変わる（11/21）
    const all = custVariants(c), vs = away.includes(c) && all.length > 1 ? all.filter(x => x !== 1) : all;
    const fresh = vs.filter(x => !used.has(c + x)), vr = pick(fresh.length ? fresh : vs);
    used.add(c + vr);
    return { c, vr, like: likeOf(c) };
  });
}

/* ---------- お店のグッズ（朝の「お店」のタブ・お金で買うだけ） ---------- */
const GOODS = {
  tatekanban: { name: '立て看板', text: 'お客さんがふえる', price: [1600, 4000, 9000] },        // 1つ目から順に お客さん+1・+2・+3
  showcase:   { name: 'ショーケース', text: '棚のマスが3つふえる', price: [3000, 8000], add: 3 }, // いちばん多くて12マス
  // かざり（前の kazari）は下の DECO_LIST へ（11/21・はじめのかざり）
};
const SHELF_MAX = 12;
/* ---------- お店のかざり（11/21 しょーくん「お店の飾りはたくさん作っちゃって」「家具も組み合わせやセット効果で効く傾向が変わるビルドが組めるように」）
   昼のお店の5か所（窓べ・天井・壁・床・カウンター）に1つずつかざる（場所ごとに1つえらぶ）。テーマ8つ×5か所＋はじめのかざり5つ
   1つかざるごとに少し効く・同じテーマを3つ・5つそろえるとセット効果。混ぜて組むと、いくつかの効果をいっしょに（3＋2 など）
   持ち物は S.goods[id] = 1・かざっている所は S.goods['at:<場所>'] = 番号（下の表の n・変えない）
   絵は deco-<テーマ>-<場所>（art-irai の requests/okashi/deco-<テーマ>.md）・はじめのかざりは good-<id>。絵がないあいだは、お店には出ない（雑貨屋には字で出る） ---------- */
const DECO_SPOTS = [['mado', '窓べ'], ['tenjo', '天井'], ['kabe', '壁'], ['yuka', '床'], ['counter', 'カウンター']];
/* テーマ：c＝来やすくなるお客さん・mats＝すきな味になりやすい素材・mon＝モンスター素材・mate＝その仲間が来てから雑貨屋に出る */
const DECO_TH = {
  kihon:  { name: 'はじめのかざり' },
  fairy:  { name: '妖精のお花畑', c: 'kodomo' },
  fuwa:   { name: 'ふわもこ', c: 'gakusei' },
  bouken: { name: '冒険者の山小屋', c: 'otona' },
  majo:   { name: '魔女のアンティーク', c: 'obaachan' },
  ame:    { name: '飴細工のきらきら', mats: ['mizuame'], mate: 'minamo' },
  herb:   { name: 'ハーブガーデン', mats: ['herb'], mate: 'wakaba' },
  pan:    { name: 'ほかほかベーカリー', mats: ['mugi'] },
  mon:    { name: 'モンスターのなかま', mon: 1 },
};
/* 数字（仮・遊びながら直す）：1つにつき お客さん×1.25・すきな味×1.3／3つ：2こ買い×2・値段×1.1・評判+1／5つ：常連さんのハート×2・売り切れでハート・評判+2 */
const DECO_FX = { cust: .25, like: .3, more3: 2, price3: 1.1, regMul5: 2 };
/* [n, テーマ, 場所, 名前, 値段, いるもの（モンスター素材を見たことがある）]。はじめのかざりは前からの id（hana など）をそのまま */
const DECO_LIST = [
  [1, 'kihon', 'mado', 'お花', 600, 0, 'hana'], [2, 'kihon', 'mado', 'クッション', 900, 0, 'cushion'], [3, 'kihon', 'counter', 'ランプ', 1200, 0, 'lamp'],
  [4, 'kihon', 'tenjo', 'ガーランド', 1500, 0, 'garland'], [5, 'kihon', 'yuka', '観葉植物', 2000, 0, 'plant'],
  [11, 'fairy', 'mado', 'お花の鉢', 1500], [12, 'fairy', 'tenjo', 'お花のつる', 2500], [13, 'fairy', 'kabe', '押し花の額', 2000], [14, 'fairy', 'yuka', 'きのこのいす', 3500], [15, 'fairy', 'counter', '花びらのびん', 1800],
  [21, 'fuwa', 'mado', 'ねこのぬいぐるみ', 1500], [22, 'fuwa', 'tenjo', 'ポンポンかざり', 2500], [23, 'fuwa', 'kabe', '毛糸のタペストリー', 2000], [24, 'fuwa', 'yuka', 'ふわふわクッション', 3500], [25, 'fuwa', 'counter', '毛糸玉のかご', 1800],
  [31, 'bouken', 'mado', '望遠鏡', 1500], [32, 'bouken', 'tenjo', '鉄のランタン', 2500], [33, 'bouken', 'kabe', '宝の地図', 2000], [34, 'bouken', 'yuka', '木のたる', 3500], [35, 'bouken', 'counter', 'コンパス', 1800],
  [41, 'majo', 'mado', '薬のびん', 1500], [42, 'majo', 'tenjo', '星と月のモビール', 2500], [43, 'majo', 'kabe', 'ふり子時計', 2000], [44, 'majo', 'yuka', '魔女のほうき', 3500], [45, 'majo', 'counter', '水晶玉', 1800],
  [51, 'ame', 'mado', 'ガラスの白鳥', 2200], [52, 'ame', 'tenjo', 'しずくのモビール', 3800], [53, 'ame', 'kabe', 'ステンドグラス', 3000], [54, 'ame', 'yuka', '飴色の花びん', 5200], [55, 'ame', 'counter', 'キャンディポット', 2700],
  [61, 'herb', 'mado', 'ハーブの鉢', 2200], [62, 'herb', 'tenjo', 'ドライハーブ', 3800], [63, 'herb', 'kabe', 'スプーンかけ', 3000], [64, 'herb', 'yuka', '畑のかご', 5200], [65, 'herb', 'counter', 'ハーブティー', 2700],
  [71, 'pan', 'mado', 'パンのかご', 2200], [72, 'pan', 'tenjo', 'おなべかけ', 3800], [73, 'pan', 'kabe', '黒板メニュー', 3000], [74, 'pan', 'yuka', '小麦のふくろ', 5200], [75, 'pan', 'counter', 'ケーキスタンド', 2700],
  [81, 'mon', 'mado', 'スライムのぬいぐるみ', 4500, 'zeri'], [82, 'mon', 'tenjo', 'クラゲのモビール', 7500, 'kanten'], [83, 'mon', 'kabe', 'ひつじのリース', 6000, 'hoippu'],
  [84, 'mon', 'yuka', 'トカゲのクッション', 10500, 'hoshi'], [85, 'mon', 'counter', 'ひよこのランプ', 5400, 'karamel'],
].map(([n, th, spot, name, price, need, id]) => ({ n, th, spot, name, price, need: need || null, id: id || `d-${th}-${spot}`, art: id ? 'good-' + id : `deco-${th}-${spot}` }));
const decoById = id => DECO_LIST.find(d => d.id === id);
/* かざっている所：場所 → かざり（なければ null）。前に はじめのかざりを買った人は、えらんでいなくても その場所に出す */
function decoAt(spot) {
  const n = S.goods['at:' + spot];
  if (n === 0) return null;   // 0＝はずした
  const d = n && DECO_LIST.find(x => x.n === n && S.goods[x.id]);
  return d || DECO_LIST.find(x => x.th === 'kihon' && x.spot === spot && S.goods[x.id]) || null;
}
/* テーマごとの数（かざっている所だけ） */
function decoPts() {
  const P = {};
  for (const [sp] of DECO_SPOTS) { const d = decoAt(sp); if (d && d.th !== 'kihon') P[d.th] = (P[d.th] || 0) + 1; }
  return P;
}
/* 雑貨屋に出すか：仲間・モンスター素材 */
function decoOpen(d) {
  const T = DECO_TH[d.th];
  if (T.mate && !STORY.mate(T.mate)) return false;
  if (d.need && !seenMats().includes(d.need)) return false;
  return true;
}
/* 効果の説明（雑貨屋の見出しの下・2行まで） */
function decoFxText(th) {
  const T = DECO_TH[th]; if (th === 'kihon') return ['見た目だけ', ''];
  if (T.c) { const c = (CUSTOMERS.find(x => x.id === T.c) || {}).name || ''; return [`${c}が来やすくなる`, '3つで2こ買いやすく・5つで常連さんと早く仲よし']; }
  if (T.mon) return ['モンスター素材のお菓子が、すきな味になりやすい', '3つで評判+1・5つで評判+2（その味で買ったとき）'];
  return [`${T.mats.map(m => HIRU_MATS[m].short).join('・')}のお菓子が、すきな味になりやすい`, '3つで値段+1割・5つで売り切れるとハート'];
}
/* 効果：お客さんの来やすさ・すきな味の出やすさ・2こ買い・値段・評判・常連さん・売り切れ */
const decoThOfCust = c => Object.keys(DECO_TH).find(k => DECO_TH[k].c === c);
const decoHasMat = (th, key) => { const T = DECO_TH[th]; return T.mon ? candyOf(key).mats.some(isMonMat) : !!(T.mats && T.mats.some(m => candyHas(key, m))); };
function decoCustW(c) { const th = decoThOfCust(c); return 1 + DECO_FX.cust * ((th && decoPts()[th]) || 0); }
function decoLikeW(m) {
  const P = decoPts(); let w = 1;
  for (const th in P) { const T = DECO_TH[th]; if ((T.mats && T.mats.includes(m)) || (T.mon && isMonMat(m))) w *= 1 + DECO_FX.like * P[th]; }
  return w;
}
function decoMoreMul(c) { const th = decoThOfCust(c); return th && (decoPts()[th] || 0) >= 3 ? DECO_FX.more3 : 1; }
function decoRegMul(c) { const th = decoThOfCust(c); return th && (decoPts()[th] || 0) >= 5 ? DECO_FX.regMul5 : 1; }
function decoPrice(key) {
  const P = decoPts(); let mul = 1;
  for (const th of ['ame', 'herb', 'pan']) if ((P[th] || 0) >= 3 && decoHasMat(th, key)) mul = DECO_FX.price3;
  return Math.round(candyOf(key).price * mul);
}
function decoRepAdd(key) { const p = decoPts().mon || 0; return p >= 3 && decoHasMat('mon', key) ? (p >= 5 ? 2 : 1) : 0; }
function decoSoldHeart(key) { const P = decoPts(); return ['ame', 'herb', 'pan'].some(th => (P[th] || 0) >= 5 && decoHasMat(th, key)); }
/* ---------- べんり道具（11/19 しょーくん「自動化とお金をかけ合わせる」・雑貨屋で買う）
   はじめは雑貨屋に出ない。仲間が「前のお店で使ってた」などと朝に紹介した日から並ぶ（STORY.toolTalk・S.seen['u:<id>']）
   by＝紹介する仲間・after＝仲間になった次の朝から何日あと・買ったら S.goods['t-<id>'] = 1
   自動化は「ボタン1つできのうと同じ」まで（しょーくん：朝をまるごとおまかせにはしない） ---------- */
const M_TOOLS = [
  { id: 'oven', name: 'おまかせオーブン', text: 'きのう焼いたお菓子を、ボタン1つでまとめて焼く（材料代はかかる）', price: 5000, by: 'minamo', after: 0 },
  { id: 'sand', name: '超はやおくりの砂時計', text: 'お昼を4倍の速さで進められる', price: 4000, by: 'minamo', after: 4 },
  { id: 'doll', name: 'からくり陳列人形', text: '天板のお菓子を、看板とおそろいを考えて並べてくれる', price: 6000, by: 'wakaba', after: 0 },
  { id: 'bell', name: 'ひるねの鐘', text: '鳴らすと、お昼がすーっと閉店まで進む', price: 12000, by: 'wakaba', after: 4 },
];
const mToolHas = id => !!(S.goods && S.goods['t-' + id]);
const mToolOpen = id => (typeof TRIAL !== 'undefined' && TRIAL) || !!(S.seen && S.seen['u:' + id]);   // 試しのページ（TRIAL）は、はじめから雑貨屋に並ぶ（紹介の朝はふつうに出る）
const DAY_SUPER = 4;      // 超はやおくりの速さ（砂時計）

/* ---------- 昼のできごと（11/19 しょーくん「ランダムイベントとか、飽きない工夫をたくさん」）
   3日目から、お店をあけるときに ときどき1つ（EVENT_P）。お金やごほうびが運で増えるしくみにはしない（お客さんの数と顔ぶれだけ・claude/game-art-rule.md）
   add＝お客さんの数に足す・first＝はじめに続けて来るお客さん・cls＝舞台につける見た目 ---------- */
const EVENT_P = .4;
/* あしたの予報（11/21 しょーくん「明日はイベントだから妖精がたくさんくる、みたいなお気に入り予想を立てて戦略が練れる」→ えらぶ質問で「あしたの予報」）
   その日のできごと（ev・なしは ''）・多めに来るお客さん（c）・人気の味（m）を前の日の閉店（day.js の closeDay）で決めて S.seen['fc:<日>'] に置く。
   その日の昼は、できごとをそのまま起こし、c を FC_W 倍・m を FC_LIKE_W 倍 来やすく（custPlan）。見せるのは日記の3行目・朝のキッチンの札・まとめの札（fcCardHTML） */
const FC_W = 3, FC_LIKE_W = 2;
/* 営業中も少しさわれる（11/21 えらぶ質問で「少しさわれる」）：呼びこみのベルは1日 CALL_N 回（すきな味がなくて帰りそうなお客さんに看板をすすめる・いなければお客さんが1人ふえる）
   天板のおかわりは BACK_N こまで（棚のマスより多く焼ける・のこりは天板で待って、売り切れたマスに補充できる・閉店で消える） */
const CALL_N = 3, BACK_N = 3;
function fcMake(day) {
  const ev = day >= 3 && Math.random() < EVENT_P ? pick(DAY_EVENTS).id : '', E = DAY_EVENTS.find(e => e.id === ev);
  const open = CUSTOMERS.map(x => x.id).filter(id => custOpen(id, day));
  const c = (E && E.first && E.first[0]) || pick(open.length ? open : ['kodomo']);
  const pool = seenMats(), pref = (CUST_LIKES[c] || []).filter(m => pool.includes(m));
  return { ev, c, m: pick(pref.length ? pref : pool) };
}
function fcGet(day) {
  const k = 'fc:' + day;
  if (!S.seen[k] || typeof S.seen[k] !== 'object') S.seen[k] = fcMake(day);
  delete S.seen['fc:' + (day - 2)];   // 古い予報はすてる
  return S.seen[k];
}
const FC_EV_NM = { '': '晴れ', rain: '雨', matsuri: '町のお祭り', ensoku: '妖精の遠足', kotori: '小鳥がいっぱい', kaze: '森の風', majo: '魔女の口コミ' };
const fcIconName = ev => 'fc-' + (ev || 'hare');
const DAY_EVENTS = [
  { id: 'rain', add: -1, cls: 'ev-rain' },
  { id: 'matsuri', add: 2, cls: 'ev-matsuri' },
  { id: 'ensoku', first: ['kodomo', 'kodomo', 'kodomo'], cls: '' },
  { id: 'kotori', add: 0, cls: 'ev-kotori' },
  { id: 'kaze', add: 0, cls: 'ev-kaze' },
  { id: 'majo', first: ['obaachan'], add: 1, cls: '' },
];
