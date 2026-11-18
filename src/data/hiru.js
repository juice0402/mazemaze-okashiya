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

/* ---------- 昼のお客さん ---------- */
const DAY_MS = 40000;     // 営業は約40秒（はやおくりで約20秒）
const DAY_FAST = 2;       // はやおくりの速さ
const CUST_DAY1 = 3;      // 1日目は3人（シナリオ③）
const CUST_BASE = 4;      // 2日目から：4人＋評判のびんの数＋立て看板
const REP_JAR = 10;       // ハート10こで評判のびん1つ → 次の日からお客さん+1人（まとめのびんは flow.js の jarHTML がこれを使う）
const LIKE_W = 3;         // お客さんごとの出やすい味（下）は3倍出やすい
const KANBAN_W = 2;       // 看板のお菓子の素材がすきなお客さんは2倍来やすい
const OTHER_BUY = 0.5;    // すきな味のお菓子がないとき、ほかのお菓子を1こ買う人の割合（ハートなし）
/* すきな味の出やすさ（お客さんの名前と見た目は world.js の CUSTOMERS・リーダー）
   お客さん（11/18 16時 しょーくん：ファンタジーに・id はそのまま）：kodomo＝妖精の子・gakusei＝けもみみの子（ねこ耳の男の子・14さいくらい）・otona＝冒険者（20代のお兄さん）・obaachan＝魔女のおばあちゃん
   モンスター素材も1つずつ割りあて（11/18 しょーくん）：妖精の子＝ゼリー・にじいろ水あめ／けもみみの子＝ミント・ほしくずシュガー／冒険者＝ホイップ・ほのおカラメル／魔女のおばあちゃん＝しずく寒天。まだ倉庫に入ったことのない素材は、すきな味にならない（seenMats） */
const CUST_LIKES = {
  kodomo: ['ichigo', 'hachimitsu', 'zeri', 'niji'],
  gakusei: ['milk', 'ichigo', 'minto', 'hoshi'],
  otona: ['mugi', 'egg', 'herb', 'hoippu', 'karamel'],
  obaachan: ['hachimitsu', 'egg', 'mizuame', 'kanten'],
};
function custCount() {
  if (S.day <= 1) return CUST_DAY1;
  return CUST_BASE + Math.floor(S.rep / REP_JAR) + (S.goods.tatekanban || 0);
}
/* すきな味になれる素材：その日までに倉庫に入ったことのある素材（倉庫・知っているレシピ・棚から） */
function seenMats() {
  const set = new Set(Object.keys(S.stock));
  for (const k of Object.keys(S.recipes)) k.split('+').forEach(m => set.add(m));
  for (const s of S.shelf) s.key.split('+').forEach(m => set.add(m));
  const out = [...set].filter(m => HIRU_MATS[m] || MATS[m]);
  return out.length ? out : BASE_IDS.slice();
}
function wpick(items, w) {
  let sum = 0; for (const x of items) sum += w(x);
  let r = Math.random() * sum;
  for (const x of items) { r -= w(x); if (r < 0) return x; }
  return items[items.length - 1];
}
/* その日のお客さん（開店のときに決める）：[{ c: お客さんの id, like: すきな素材 }] */
function custPlan(n, kanbanKey) {
  const pool = seenMats(), km = kanbanKey ? kanbanKey.split('+') : [];
  return Array.from({ length: n }, () => {
    const c = pick(CUSTOMERS).id, pref = CUST_LIKES[c] || [];
    const like = wpick(pool, m => (pref.includes(m) ? LIKE_W : 1) * (km.includes(m) ? KANBAN_W : 1));
    return { c, like };
  });
}

/* ---------- お店のグッズ（朝の「お店」のタブ・お金で買うだけ） ---------- */
const GOODS = {
  tatekanban: { name: '立て看板', text: 'お客さんがふえる', price: [1600, 4000, 9000] },        // 1つ目から順に お客さん+1・+2・+3
  showcase:   { name: 'ショーケース', text: '棚のマスが3つふえる', price: [3000, 8000], add: 3 }, // いちばん多くて12マス
  kazari: [   // 見た目だけ
    { id: 'hana', name: 'お花', price: 600 },
    { id: 'cushion', name: 'クッション', price: 900 },
    { id: 'lamp', name: 'ランプ', price: 1200 },
    { id: 'garland', name: 'ガーランド', price: 1500 },
    { id: 'plant', name: '観葉植物', price: 2000 },
  ],
};
const SHELF_MAX = 12;
