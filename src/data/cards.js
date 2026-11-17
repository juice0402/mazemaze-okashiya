/* ==== データ：材料・道具・フィールド・シェフ・レシピ ====
   fx（カードの動き）：dmg ダメージ／heat 火力を足す／first いちばん左のときだけ火力をさらに足す／set 火力をその数にする
   hd 火力×hd をダメージに足す／kd その夜に焦げた回数×kd をダメージに足す／nb となりの食材のダメージに足す
   next つぎにダメージを出すカードを×next／again 右どなりがもう1回うごく／proof 焦げてもダメージが出る（×6） */

/* 材料：夜は食材カード、朝はレシピの材料。taste は昼のお客さんの好み、adj・noun はお菓子の名前、nr は名前の主役になる強さ */
const MATS = {
  komugi: { name: '小麦粉', taste: 'さくさく', adj: 'さくさく', noun: 'クッキー', nr: 3, value: 20, col: '#e4c58a', fx: { dmg: 4 } },
  bata:   { name: 'バター', taste: 'こくまろ', adj: 'バター', noun: 'サブレ', nr: 2, value: 20, col: '#f6d36b', fx: { dmg: 2, nb: 3 } },
  sato:   { name: '砂糖', taste: 'あまい', adj: 'あまあま', noun: 'キャンディ', nr: 1, value: 15, col: '#f28cab', fx: { dmg: 2, heat: 2 } },
  tamago: { name: 'たまご', taste: 'ふわふわ', adj: 'ふわふわ', noun: 'カステラ', nr: 4, value: 20, col: '#ffd75e', fx: { dmg: 3, next: 2 } },
  choco:  { name: 'チョコ', taste: 'とろーり', adj: 'チョコ', noun: 'ブラウニー', nr: 5, value: 25, col: '#7a4424', fx: { dmg: 1, hd: 1 } },
  koge:   { name: '焦げクッキー', taste: 'こんがり', adj: 'こんがり', noun: 'クッキー', nr: 3, value: 10, col: '#4a2c1c', fx: { dmg: 3, proof: 1, kd: 3 } },
  /* ふしぎな材料（食材モンスターが落とす） */
  zeri:   { name: 'ゼリー', fushigi: true, taste: 'ぷるぷる', adj: 'ぷるぷる', noun: 'ゼリー', nr: 6, value: 60, col: '#7fd6e0', fx: { dmg: 3, again: 1 } },
  hoippu: { name: 'ホイップ', fushigi: true, taste: 'ふわふわ', adj: 'ふわっと', noun: 'シュークリーム', nr: 6, value: 60, col: '#fff4f8', fx: { dmg: 3, set: 5 } },
};

/* 道具：火力を動かすカード（まざらない） */
const TOOLS = {
  maki:     { name: 'まき', fx: { heat: 3 } },
  uchiwa:   { name: 'うちわ', fx: { heat: 1, again: 1 } },
  mizu:     { name: '水さし', fx: { heat: -4 } },
  hiokoshi: { name: '火おこし', fx: { heat: 1, first: 5 } },
};

/* 火力：0〜3 弱火・4〜7 中火・8〜10 強火・11〜 焦げ（ダメージ0、火力は4にもどる） */
const ZONES = ['弱火', '中火', '強火', '焦げ'];
const zoneOf = h => h <= 3 ? 0 : h <= 7 ? 1 : h <= 10 ? 2 : 3;

/* フィールド：夜のはじめに1つえらぶ（シェフごとにちがう） */
const FIELDS = {
  chubi: { name: '中火キープ', start: 4, cap: 7, mul: [1, 3, 4], text: '火力4からはじまり、7より上がらない（焦げない）。中火が×3' },
  max:   { name: '火力マックス', start: 6, mul: [1, 2, 6], text: '火力6からはじまる。強火が×6。そのかわり焦げやすい' },
  maze:  { name: '自動まぜまぜ機', start: 4, mul: [1, 2, 4], mix: 1, text: '火力4からはじまる。食材がまざったときのボーナスが2倍' },
};

/* シェフ：固有のデッキプールとフィールド。水の飴細工職人・草のパティシエは、あとで常連さんから仲間になる */
const CHEFS = {
  honoka: {
    name: 'ほのか', job: '炎のシェフ',
    pool: ['m:komugi', 'm:bata', 'm:sato', 'm:tamago', 'm:choco', 'm:koge', 't:maki', 't:uchiwa', 't:mizu', 't:hiokoshi'],
    fields: ['chubi', 'max', 'maze'],
  },
};

const RANK_MUL = [0, 1, 2, 4];   // ★1・★2・★3（同じカードを買うとランクアップ）

/* ---------- レシピ ---------- */
const recipeKey = (a, b) => [a, b].sort().join('+');
function recipeOf(key) {
  const [a, b] = key.split('+'), A = MATS[a], B = MATS[b];
  const main = B.nr > A.nr ? B : A, other = main === A ? B : A;
  return {
    key, mats: [a, b],
    name: a === b ? A.adj + A.noun : other.adj + main.noun,
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

/* ---------- カード（'m:材料'・'t:道具'・'o:材料+材料'） ---------- */
const DEFS = new Map();
function cardDef(cid) {
  if (DEFS.has(cid)) return DEFS.get(cid);
  const k = cid[0], id = cid.slice(2);
  let d;
  if (k === 'm') { const m = MATS[id]; d = { kind: m.fushigi ? 'f' : 'm', food: true, name: m.name, fx: m.fx, mats: [id], cost: m.fushigi ? 4 : 3 }; }
  else if (k === 't') { const t = TOOLS[id]; d = { kind: 't', food: false, name: t.name, fx: t.fx, mats: [], cost: 3 }; }
  else { const r = recipeOf(id); d = { kind: 'o', food: true, name: r.name, fx: mergeFx(MATS[r.mats[0]].fx, MATS[r.mats[1]].fx), mats: r.mats, cost: 4 }; }
  d.cid = cid;
  DEFS.set(cid, d);
  return d;
}
const KIND_NAME = { m: '食材', f: 'ふしぎな食材', t: '道具', o: 'お菓子' };

function fxText(fx, rank = 1) {
  const m = RANK_MUL[rank] || 1, p = [];
  if (fx.set != null) p.push(`火力を${fx.set}にする`);
  if (fx.first) p.push(`火力+${fx.heat || 0}（いちばん左なら+${(fx.heat || 0) + fx.first}）`);
  else if (fx.heat) p.push(`火力${fx.heat > 0 ? '+' : '−'}${Math.abs(fx.heat)}`);
  if (fx.dmg || fx.hd || fx.kd) {
    let s = `ダメージ${(fx.dmg || 0) * m}`;
    if (fx.hd) s += `＋火力×${fx.hd * m}`;
    if (fx.kd) s += `＋焦げた回数×${fx.kd * m}`;
    p.push(s);
  }
  if (fx.nb) p.push(`となりの食材のダメージ+${fx.nb * m}`);
  if (fx.next) p.push(`つぎにダメージを出すカードを×${fx.next}`);
  if (fx.again) p.push(`右どなりがもう${fx.again}回うごく`);
  if (fx.proof) p.push('焦げても平気（焦げると×6）');
  return p.join('。');
}
