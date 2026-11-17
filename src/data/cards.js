/* ==== データ：材料・道具・フィールド・シェフ・レシピ ====
   fx（カードの動き）：dmg ダメージ／heat 火力を足す／first いちばん左のときだけ火力をさらに足す／set 火力をその数にする
   hd 火力×hd をダメージに足す／kd その夜に焦げた回数×kd をダメージに足す／nb となりの食材のダメージに足す
   next つぎにダメージを出すカードを×next／again 右どなりがもう1回うごく／proof 焦げてもダメージが出る（×6）
   shop 仕入れが+shop枚／coin ラウンドのおわりにコイン+coin
   ★：食材と道具は★1。食材★1＋★1をまぜると★2のお菓子、★2＋★2で★3のスペシャル（STAR_MUL 倍） */

/* 材料：ぜんぶモンスター食材（11/17 しょーくん。お金で食材は買わない）。夜は食材カード、朝はレシピの材料
   name はくわしい所で出すフルの名前、short はカードに出す短い名前。taste は昼のお客さんの好み、adj・noun はお菓子の名前、nr は名前の主役になる強さ */
const MATS = {
  komugi: { name: 'リーフフェアリーの粉', short: 'フェアリー粉', taste: 'さくさく', adj: 'さくさく', noun: 'クッキー', nr: 3, value: 20, col: '#e4c58a', fx: { dmg: 4 } },
  bata:   { name: 'ゴーゴーヤギのバター', short: 'ヤギバター', taste: 'こくまろ', adj: 'バター', noun: 'サブレ', nr: 2, value: 20, col: '#f6d36b', fx: { dmg: 2, nb: 3 } },
  sato:   { name: 'こんぺいトカゲの砂糖', short: 'トカゲ砂糖', taste: 'あまい', adj: 'あまあま', noun: 'キャンディ', nr: 1, value: 15, col: '#f28cab', fx: { dmg: 2, heat: 2 } },
  tamago: { name: 'ほのお鳥のたまご', short: 'ほのおたまご', taste: 'ふわふわ', adj: 'ふわふわ', noun: 'カステラ', nr: 4, value: 20, col: '#ffd75e', fx: { dmg: 3, next: 2 } },
  choco:  { name: 'カカオゴーレムのかけら', short: 'ゴーレムチョコ', taste: 'とろーり', adj: 'チョコ', noun: 'ブラウニー', nr: 5, value: 25, col: '#7a4424', fx: { dmg: 1, hd: 1 } },
  koge:   { name: '焦げクッキー', taste: 'こんがり', adj: 'こんがり', noun: 'クッキー', nr: 3, value: 10, col: '#4a2c1c', fx: { dmg: 3, proof: 1, kd: 3 } },
  /* ふしぎな材料（食材モンスターが落とす） */
  zeri:   { name: 'ぷるぷるスライムのゼリー', short: 'スライムゼリー', fushigi: true, taste: 'ぷるぷる', adj: 'ぷるぷる', noun: 'ゼリー', nr: 6, value: 60, col: '#7fd6e0', fx: { dmg: 3, again: 1 } },
  hoippu: { name: 'くもひつじのホイップ', short: 'ひつじホイップ', fushigi: true, taste: 'ふわふわ', adj: 'ふわっと', noun: 'シュークリーム', nr: 6, value: 60, col: '#fff4f8', fx: { dmg: 3, set: 5 } },
};

/* 道具：火力や仕入れを動かすカード（まぜられない） */
const TOOLS = {
  maki:     { name: 'おばけ樹木のまき', short: 'おばけまき', fx: { heat: 3 } },
  uchiwa:   { name: 'ハネコウモリのうちわ', short: 'コウモリうちわ', fx: { heat: 1, again: 1 } },
  mizu:     { name: 'しずくクラゲの水', short: 'クラゲの水', fx: { heat: -4 } },
  hiokoshi: { name: 'ひだねサラマンダーの火種', short: '火種', fx: { heat: 1, first: 5 } },
  kago:     { name: 'つるオバケのかご', short: 'つるかご', fx: { shop: 1 } },
  chokin:   { name: 'コインガエルのちょきん箱', short: 'カエルちょきん', fx: { coin: 2 } },
};

/* 火力：0〜3 弱火・4〜7 中火・8〜10 強火・11〜 焦げ（ダメージ0、火力は4にもどる） */
const ZONES = ['弱火', '中火', '強火', '焦げ'];
const zoneOf = h => h <= 3 ? 0 : h <= 7 ? 1 : h <= 10 ? 2 : 3;

/* フィールド：夜のはじめに1つえらぶ（シェフごとにちがう） */
const FIELDS = {
  chubi: { name: '中火キープ', start: 4, cap: 7, mul: [1, 6, 6], text: '火力4からはじまり、7より上がらない（焦げない）。中火が×6' },
  max:   { name: '火力マックス', start: 6, mul: [1, 2, 6], text: '火力6からはじまる。強火が×6。そのかわり焦げやすい' },
  maze:  { name: '自動まぜまぜ機', start: 4, mul: [1, 2, 4], mix: 1, boost: 1.5, text: '火力4からはじまる。★2・★3のダメージ×1.5、まぜるたびにコイン+1' },
};

/* シェフ：固有のデッキプールとフィールド。水の飴細工職人・草のパティシエは、あとで常連さんから仲間になる */
const CHEFS = {
  honoka: {
    name: 'ほのか', job: '炎のシェフ',
    pool: ['m:komugi', 'm:bata', 'm:sato', 'm:tamago', 'm:choco', 'm:koge', 't:maki', 't:uchiwa', 't:mizu', 't:hiokoshi', 't:kago', 't:chokin'],
    fields: ['chubi', 'max', 'maze'],
  },
};

const STAR_MUL = [0, 1, 1.5, 3];   // ★1・★2・★3 の強さの倍率（まぜるほど倍々）

/* ---------- レシピ ---------- */
const recipeKey = (a, b) => [a, b].sort().join('+');
function recipeOf(key) {
  const [a, b] = key.split('+'), A = MATS[a], B = MATS[b];
  const main = B.nr > A.nr ? B : A, other = main === A ? B : A;
  return {
    key, mats: [a, b],
    name: a === b ? A.adj + A.noun : other.adj + main.noun, noun: main.noun,
    tastes: [...new Set([A.taste, B.taste])],
    price: A.value + B.value,
    needs: [a, b].filter(m => MATS[m].fushigi),
  };
}
function mergeFx(a, b) {
  const o = {};
  for (const k of ['dmg', 'heat', 'nb', 'hd', 'kd', 'first']) { const v = (a[k] || 0) + (b[k] || 0); if (v) o[k] = v; }
  const nx = (a.next || 1) * (b.next || 1); if (nx > 1) o.next = Math.min(4, nx);
  const ag = (a.again || 0) + (b.again || 0); if (ag) o.again = Math.min(2, ag);
  if (a.set != null || b.set != null) o.set = a.set != null ? a.set : b.set;
  if (a.proof || b.proof) o.proof = 1;
  return o;
}

/* ---------- カード（'m:材料'・'t:道具'・'o:材料+材料'＝★2・'s:お菓子|お菓子'＝★3） ---------- */
function specialName(r1, r2) { return r1.noun === r2.noun ? `特製${r1.noun}タワー` : `特製${r1.noun}＆${r2.noun}`; }
const DEFS = new Map();
function cardDef(cid) {
  if (DEFS.has(cid)) return DEFS.get(cid);
  const k = cid[0], id = cid.slice(2);
  let d;
  const pairFx = r => mergeFx(MATS[r.mats[0]].fx, MATS[r.mats[1]].fx);
  if (k === 'm') { const m = MATS[id]; d = { kind: m.fushigi ? 'f' : 'm', star: 1, food: true, name: m.name, fx: m.fx, mats: [id], cost: m.fushigi ? 4 : 3 }; }
  else if (k === 't') { const t = TOOLS[id]; d = { kind: 't', star: 1, food: false, name: t.name, fx: t.fx, mats: [], cost: 3 }; }
  else if (k === 'o') { const r = recipeOf(id); d = { kind: 'o', star: 2, food: true, name: r.name, fx: pairFx(r), mats: r.mats, cost: 6 }; }
  else { const [r1, r2] = id.split('|').map(recipeOf); const fx = mergeFx(pairFx(r1), pairFx(r2)); fx.proof = 1; d = { kind: 's', star: 3, food: true, name: specialName(r1, r2), fx, mats: [...r1.mats, ...r2.mats], keys: [r1.key, r2.key], cost: 0 }; }
  d.cid = cid;
  d.short = (k === 'm' ? MATS[id].short : k === 't' ? TOOLS[id].short : null) || d.name;
  DEFS.set(cid, d);
  return d;
}
const KIND_NAME = { m: '食材', f: 'ふしぎな食材', t: '道具', o: 'お菓子', s: 'スペシャル' };

function fxText(fx, star = 1) {
  const m = STAR_MUL[star] || 1, p = [];
  if (fx.set != null) p.push(`火力を${fx.set}にする`);
  if (fx.first) p.push(`火力+${fx.heat || 0}（いちばん左なら+${(fx.heat || 0) + fx.first}）`);
  else if (fx.heat) p.push(`火力${fx.heat > 0 ? '+' : '−'}${Math.abs(fx.heat)}`);
  if (fx.dmg || fx.hd || fx.kd) {
    const f = v => Math.floor(v * m * 10) / 10;
    let s = `ダメージ${f(fx.dmg || 0)}`;
    if (fx.hd) s += `＋火力×${f(fx.hd)}`;
    if (fx.kd) s += `＋焦げた回数×${f(fx.kd)}`;
    p.push(s);
  }
  if (fx.nb) p.push(`となりの食材のダメージ+${Math.floor(fx.nb * m * 10) / 10}`);
  if (fx.next) p.push(`つぎにダメージを出すカードを×${fx.next}`);
  if (fx.again) p.push(`右どなりがもう${fx.again}回うごく`);
  if (fx.proof) p.push('焦げても平気（焦げると×6）');
  if (fx.shop) p.push(`仕入れが+${fx.shop}枚`);
  if (fx.coin) p.push(`ラウンドのおわりにコイン+${fx.coin}`);
  return p.join('。');
}
