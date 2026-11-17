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
  shime:    { cat: 'dough', name: 'しめくくりクッキー生地', short: 'しめくくり生地', taste: 'さくさく', adj: 'しめの', noun: 'クッキー', nr: 9, value: 20, col: '#e8a0b0', fx: { dmg: 20, sai: 2 } },
  horoniga: { cat: 'dough', name: 'ほろにがココア生地', short: 'ほろにが生地', taste: 'こんがり', adj: 'ほろにが', noun: 'クッキー', nr: 9, value: 20, col: '#6b3a1e', fx: { dmg: 30, bitter: 1 } },
  /* ほのかの素材（支援・ほのかのビルドどうしで共通） */
  bata:   { cat: 'mat', name: 'ゴーゴーヤギのバター', short: 'ヤギバター', taste: 'こくまろ', adj: 'バター', noun: 'サブレ', nr: 2, value: 20, col: '#f6d36b', fx: { nb: 30 } },
  sato:   { cat: 'mat', name: 'こんぺいトカゲの砂糖', short: 'トカゲ砂糖', taste: 'あまい', adj: 'あまあま', noun: 'キャンディ', nr: 1, value: 15, col: '#f28cab', fx: { next: 2 } },
  tamago: { cat: 'mat', name: 'ほのお鳥のたまご', short: 'ほのおたまご', taste: 'ふわふわ', adj: 'ふわふわ', noun: 'カステラ', nr: 4, value: 20, col: '#ffd75e', fx: { fin: 1.5 } },
  choco:  { cat: 'mat', name: 'カカオゴーレムのかけら', short: 'ゴーレムチョコ', twin: 'ガトーショコラ', taste: 'とろーり', adj: 'チョコ', noun: 'ブラウニー', nr: 5, value: 25, col: '#7a4424', fx: { rally: 20 } },
  mitsu:  { cat: 'mat', name: 'ハチドラゴンのはちみつ', short: 'はちみつ', taste: 'あまい', adj: 'はちみつ', noun: 'キャンディ', nr: 1, value: 20, col: '#f2b33a', fx: { again: 1 } },
  /* ふしぎな材料（食材モンスターが落とす素材） */
  zeri:   { cat: 'mat', name: 'ぷるぷるスライムのゼリー', short: 'スライムゼリー', fushigi: true, taste: 'ぷるぷる', adj: 'ぷるぷる', noun: 'ゼリー', nr: 6, value: 60, col: '#7fd6e0', fx: { again: 1, nb: 20 } },
  hoippu: { cat: 'mat', name: 'くもひつじのホイップ', short: 'ひつじホイップ', fushigi: true, taste: 'ふわふわ', adj: 'ふわっと', noun: 'シュークリーム', nr: 6, value: 60, col: '#fff4f8', fx: { next: 3 } },
};

/* ほのかの道具（ほのかのビルドどうしで共通） */
const TOOLS = {
  maki:     { name: 'おばけ樹木のまき', short: 'おばけまき', mini: 'まき', role: '火力', fx: { heat: 1 } },
  hiokoshi: { name: 'ひだねサラマンダーの火種', short: '火種', mini: '火種', role: '火力', fx: { heat: 2 } },
  mizu:     { name: 'しずくクラゲの水', short: 'クラゲの水', mini: '水', role: '火力', fx: { heat: -2 } },
  yakigote: { name: 'サラマンダーのやきごて', short: 'やきごて', mini: 'こて', role: '火力', fx: { sear: 3 } },
  yobirin:  { name: 'かまど職人のよびりん', short: 'よびりん', mini: 'よびりん', role: '仕入れ', fx: { call: 1 } },
};

/* 焼きすぎでできるカード（仕入れには出ない）。焦げどうしでまぜて育てる */
const BURNT = [null,
  { name: '焦げクッキー', fx: { dmg: 20 } },
  { name: '焦げ焦げクッキー', fx: { dmg: 60 } },
  { name: 'すみびクッキー', fx: { dmg: 300, stop: 1 } },
];

/* カードのフレーバーテキスト（大きなカードの下に出す） */
const FLAVOR = {
  teppan: 'ほのか愛用の、使いこんだ鉄板。5つの生地をいっぺんに焼ける。',
  ishigama: '石を積んだ大きなかまど。熱がこもって、焼きあがりがひと味ちがう。',
  komugi: '葉っぱの妖精の粉でこねた、基本のクッキー生地。',
  dosshiri: 'ゴーレムの粉でこねた、ずっしり重い生地。焼けるのに時間がかかる。',
  hinoko: 'サラマンダーの火の粉をまぜた生地。あっという間に焼ける。',
  ichiban: 'いちばん最初に焼くと、いちばんおいしい。',
  shime: '最後に焼くと、サイコーに焼けたクッキーの香りをぜんぶ吸いこむ。',
  horoniga: 'もともと少しにがい生地。焦げると、とても焦げる。',
  bata: '走りまわるゴーゴーヤギのミルクから。となりのカードを元気にする。',
  sato: 'しっぽが金平糖のトカゲが落としていく、あまい結晶。つぎの一撃をあまくする。',
  tamago: 'ほんのりあったかい、ほのお鳥のたまご。最後にぬると、ぜんぶがつやつや。',
  choco: 'チョコでできたゴーレムのかけら。いちばん最初にとかすと、みんなに行きわたる。',
  mitsu: 'ハチドラゴンの巣からとれた、とろとろのはちみつ。右どなりがもう一度。',
  zeri: '夜にあらわれたスライムのゼリー。ぷるんとはねて、となりをもう一度。',
  hoippu: '雲のようなひつじの毛のホイップ。つぎの一撃をふわっと大きく。',
  maki: 'おばけ樹木の枝。くべると、鉄板がひとつ熱くなる。',
  hiokoshi: 'サラマンダーの火種。鉄板が一気にふたつ熱くなる。',
  mizu: 'しずくクラゲに分けてもらった水。熱すぎたら、これ。',
  yakigote: '真っ赤に焼けたこて。右どなりの生地を、じゅっと焼く。',
  yobirin: 'かまど職人を呼ぶ鈴。つぎの仕入れで、フィールドを持ってきてくれる。',
  k: 'ほのかがまた焦がしたクッキー。焦げどうしをまぜると、なにかが起きる。',
  o: 'ほのかがまぜて作ったお菓子。朝にはレシピとしてお店にも並ぶ。',
  s: 'ほのか特製のスペシャル。ひと口で、お店じゅうが元気になる。',
  u: 'ふたつの道具をひとつにした、ほのかの工夫。',
};

/* 火力：ほのかの固有特性。場がまるごと鉄板で、5マス共通の火力。バトルのはじめの焼きで、生地の焼き加減が段階のぶん進む */
const HEAT = ['', '弱火', '中火', '強火', '火力マックス'];
const HEAT_MAX = 4;
const zoneOf = h => h <= 1 ? 0 : h === 2 ? 1 : 2;   // scene.js の古いドットの火（3段階）用
/* 焼き加減：9段階。9で焼き加減サイコー。サイコーのまま次に焼かれると焦げる */
const COOK_MAX = 9;
const cookMul = c => c >= COOK_MAX ? 5 : 1 + c / 3;
const cookName = c => c >= COOK_MAX ? 'サイコー' : c >= 6 ? 'こんがり' : c >= 3 ? '半焼け' : '生';

/* フィールド：手札（仕入れ）にまざって出てくる。買うと調理台の左の「場」に入り、鉄板の火力が start になる。
   フィールドがないと、バトルのはじめの焼きはない（やきごてなら焼ける） */
const FIELDS = {
  teppan:   { name: 'ほのかの鉄板', start: 2, chips: ['中火で焼く'], text: '置くと、鉄板の「火力」が中火になる。バトルのはじめに、調理台の生地を焼く' },
  ishigama: { name: 'ごうごう石窯', start: 3, best: 1.5, chips: ['強火で焼く', 'サイコー×1.5'], text: '置くと、鉄板の「火力」が強火になる。バトルのはじめに、調理台の生地を焼く。「サイコー」の生地のダメージ×1.5' },
};

/* シェフ：固有のデッキプールとフィールド。水の飴細工職人・草のパティシエは、あとで常連さんから仲間になる（素材も道具も別） */
const CHEFS = {
  honoka: {
    name: 'ほのか', job: '炎のシェフ',
    doughs: ['m:komugi', 'm:dosshiri', 'm:hinoko', 'm:ichiban', 'm:shime', 'm:horoniga'],   // クッキーのビルド
    common: ['m:bata', 'm:sato', 'm:tamago', 'm:choco', 'm:mitsu', 't:maki', 't:hiokoshi', 't:mizu', 't:yakigote', 't:yobirin'],   // ほのか共通
    fields: ['teppan', 'ishigama'],
  },
};

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
function recipeOf(key) {
  const [a, b] = key.split('+'), A = MATS[a], B = MATS[b];
  const main = B.nr > A.nr ? B : A, other = main === A ? B : A;
  return {
    key, mats: [a, b],
    name: a === b ? A.twin || A.adj + nounName(A.noun) : other.adj + nounName(main.noun), noun: main.noun, nr: main.nr,
    tastes: [...new Set([A.taste, B.taste])],
    price: A.value + B.value,
    needs: [a, b].filter(m => MATS[m].fushigi),
  };
}
/* まぜた効果：数は合計、倍率はかけ算（上限あり）、しるしはどちらかにあれば */
function mergeFx(a, b) {
  const o = {};
  for (const k of ['dmg', 'spd', 'nb', 'rally', 'heat', 'sear']) { const v = (a[k] || 0) + (b[k] || 0); if (v) o[k] = v; }
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
const CAT_NAME = { dough: '生地', mat: '素材', tool: '道具', burnt: '焦げ', field: 'フィールド' };
const ROLE = { dough: '攻撃', mat: '支援', burnt: '攻撃' };
const foodCat = mats => mats.some(m => MATS[m].cat === 'dough') ? 'dough' : 'mat';
/* ★3：同じ形どうしは「○○タワー」、ちがう形どうしは2つの形をつなげる（主役の形をうしろに） */
function specialName(r1, r2) {
  if (r1.noun === r2.noun) return nounName(r1.noun) + 'タワー';
  const [x, y] = r1.nr > r2.nr || (r1.nr === r2.nr && r1.noun > r2.noun) ? [r2, r1] : [r1, r2];
  return nounName(x.noun) + nounName(y.noun);
}
function toolSetName(a, b) { return a === b ? 'ダブル' + TOOLS[a].short : TOOLS[a].mini + '＆' + TOOLS[b].mini; }
const DEFS = new Map();
function cardDef(cid) {
  if (DEFS.has(cid)) return DEFS.get(cid);
  const k = cid[0], id = cid.slice(2);
  let d;
  const pairFx = r => mergeFx(MATS[r.mats[0]].fx, MATS[r.mats[1]].fx);
  if (k === 'm') { const m = MATS[id]; d = { kind: m.cat === 'dough' ? 'd' : m.fushigi ? 'f' : 'm', cat: m.cat, star: 1, name: m.name, short: m.short, fx: m.fx, mats: [id], cost: m.fushigi ? 4 : 3 }; }
  else if (k === 't') { const t = TOOLS[id]; d = { kind: 't', cat: 'tool', role: t.role, star: 1, name: t.name, short: t.short, fx: t.fx, mats: [], parts: [id], cost: 3 }; }
  else if (k === 'b') { const f = FIELDS[id]; d = { kind: 'b', cat: 'field', star: 1, name: f.name, fx: {}, mats: [], cost: 5 }; }
  else if (k === 'k') { const n = +id; d = { kind: 'k', cat: 'burnt', star: n, name: BURNT[n].name, fx: BURNT[n].fx, mats: [], cost: 0 }; }
  else if (k === 'o') { const r = recipeOf(id); d = { kind: 'o', cat: foodCat(r.mats), star: 2, name: r.name, fx: pairFx(r), mats: r.mats, cost: 6 }; }
  else if (k === 's') {
    const [r1, r2] = id.split('|').map(recipeOf), mats = [...r1.mats, ...r2.mats], cat = foodCat(mats);
    const fx = mergeFx(pairFx(r1), pairFx(r2)); if (cat === 'dough') fx.noburn = 1;
    d = { kind: 's', cat, star: 3, name: specialName(r1, r2), fx, mats, keys: [r1.key, r2.key], cost: 0 };
  }
  else if (k === 'u') { const [a, b] = id.split('+'); d = { kind: 't', cat: 'tool', role: TOOLS[a].role, star: 2, name: toolSetName(a, b), fx: mergeFx(TOOLS[a].fx, TOOLS[b].fx), mats: [], parts: [a, b], cost: 0 }; }
  else { const [p, q] = id.split('|').map(x => cardDef('u:' + x)); d = { kind: 't', cat: 'tool', role: p.role, star: 3, name: '特製道具セット', fx: mergeFx(p.fx, q.fx), mats: [], parts: [...p.parts, ...q.parts], cost: 0 }; }
  d.cid = cid;
  d.role = d.role || ROLE[d.cat] || '';
  d.food = d.cat === 'dough' || d.cat === 'mat';
  d.dough = d.cat === 'dough';
  d.short = d.short || d.name;
  DEFS.set(cid, d);
  return d;
}
/* カードの属性（最大2つ）：種類・役目 */
const attrsOf = d => d.cat === 'field' ? ['フィールド'] : [CAT_NAME[d.cat], d.role].filter(Boolean);

/* まぜられる組み合わせ（属性で決まる）：生地＋生地・生地＋素材・素材＋素材・道具＋道具・焦げ＋焦げ。同じ★どうしで、★3はまぜられない */
const MIX_OK = { 'dough+dough': 1, 'dough+mat': 1, 'mat+mat': 1, 'tool+tool': 1, 'burnt+burnt': 1 };
function mixable(A, B) { return A.star === B.star && A.star < 3 && !!MIX_OK[[A.cat, B.cat].sort().join('+')]; }
function mixCid(a, b) {
  const A = cardDef(a), B = cardDef(b), ids = [a.slice(2), b.slice(2)].sort();
  if (A.cat === 'burnt') return 'k:' + (A.star + 1);
  if (A.cat === 'tool') return A.star === 1 ? 'u:' + ids.join('+') : 'w:' + ids.join('|');
  return A.star === 1 ? 'o:' + recipeKey(A.mats[0], B.mats[0]) : 's:' + ids.join('|');
}

/* カードの効果のことば（短く。生地は焼ける・道具は発動で効く、などビルドの前提は書かない）。ダメージはカードの数字で見せる */
/* 大事な順（カードの紙には先頭の2つだけ。ぜんぶは大きく見る画面で）。焦げない★3には「焦げると」は出さない */
function fxList(fx, star = 1) {
  const m = STAR_MUL[star] || 1, f = v => Math.floor(v * m * 10) / 10, p = [];
  if (fx.lead) p.push(`スタートで×${fx.lead}`);
  if (fx.sai) p.push(`アンカー：サイコー1枚×${fx.sai + 0.5 * (star - 1)}`);
  if (fx.fin) p.push(`アンカー：合計×${fx.fin}`);
  if (fx.rally) p.push(`スタート：攻撃ぜんぶ+${f(fx.rally)}`);
  if (fx.next) p.push(`つぎ×${fx.next}`);
  if (fx.nb) p.push(`となり+${f(fx.nb)}`);
  if (fx.again) p.push(`右がもう${fx.again}回`);
  if (fx.stop) p.push('ほかの生地はサイコーで止まる');
  if (fx.noburn) p.push('焦げない');
  if (fx.sear) p.push(`右の生地を焼く+${fx.sear}`);
  if (fx.heat) p.push(`火力${fx.heat > 0 ? '+' : '−'}${Math.abs(fx.heat)}`);
  if (fx.call) p.push('次にフィールドが出る');
  if (fx.bitter && !fx.noburn) p.push('焦げると★2');
  if (fx.spd) p.push(fx.spd > 0 ? '早く焼ける' : 'ゆっくり焼ける');
  return p;
}
function fxText(fx, star = 1) { return fxList(fx, star).join('・'); }

/* 大きく見る画面の効果の文（ゼンゼロの形・11/18 しょーくん）。「」のことばは黄色で、タップすると KW の説明が出る */
function fxLong(fx, star = 1) {
  const m = STAR_MUL[star] || 1, f = v => Math.floor(v * m * 10) / 10, p = [];
  if (fx.lead) p.push(`「スタート」に置くと、ダメージ×${fx.lead}`);
  if (fx.sai) p.push(`「アンカー」に置くと、焼き加減「サイコー」の生地1枚につき ダメージ×${fx.sai + 0.5 * (star - 1)}`);
  if (fx.fin) p.push(`「アンカー」に置くと、このラウンドのダメージ合計×${fx.fin}`);
  if (fx.rally) p.push(`「スタート」に置くと、このラウンドの攻撃カードぜんぶ ダメージ+${f(fx.rally)}`);
  if (fx.next) p.push(`つぎにダメージを出すカードのダメージ×${fx.next}`);
  if (fx.nb) p.push(`となり（左右）のカードのダメージ+${f(fx.nb)}`);
  if (fx.again) p.push(`右どなりのカードが、もう${fx.again}回 発動する`);
  if (fx.stop) p.push('置いているあいだ、ほかの生地は「サイコー」で止まる（「焦げ」ない）');
  if (fx.noburn) p.push('焼きすぎても「焦げ」ない');
  if (fx.sear) p.push(`発動すると、右どなりの生地の「焼き加減」+${fx.sear}（「場」がなくても焼ける）`);
  if (fx.heat) p.push(`発動すると、鉄板の「火力」${fx.heat > 0 ? '+' : '−'}${Math.abs(fx.heat)}段`);
  if (fx.call) p.push('つぎのショップに、「場」のカードが かならず1枚出る');
  if (fx.bitter && !fx.noburn) p.push('「焦げ」ると、焦げ焦げクッキー★2になる');
  if (fx.spd) p.push(fx.spd > 0 ? `焼けるのが${fx.spd}段はやい` : `焼けるのが${-fx.spd}段おそい`);
  return p;
}
/* ことばの説明（カードの黄色いことばをタップすると出る） */
const KW = {
  スタート: '調理台に置いたカードのうち、いちばん左のカード。バトルで いちばん先に発動する',
  アンカー: '調理台に置いたカードのうち、いちばん右のカード。バトルで いちばん最後に発動する',
  サイコー: '焼き加減9（ゲージがいっぱい）。生地のダメージ×5。このまま もう一度焼かれると焦げる',
  焦げ: 'サイコーの生地が、また焼かれると焦げクッキーになって弱くなる。焦げどうしは まぜられる',
  焼き加減: '生地の焼け具合（0〜9）。焼けるほどダメージが上がる：生×1・3で×2・6で×3・サイコー（9）で×5',
  火力: '鉄板の強さ（弱火・中火・強火・火力マックス）。バトルのはじめに、生地の焼き加減が +1・+2・+3・+4 すすむ',
  場: '調理台のいちばん左の、フィールドのカードを置く所。場にカードがあると、バトルのはじめに生地が焼ける',
};
