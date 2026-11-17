/* ==== 夜：食材モンスターの襲撃を9ラウンドで撃退する（ゼンゼロのオバケ屋敷の形が土台） ====
   1ラウンド：仕入れ（毎回3枚・入れかえ・コインで買う）→ 並べる・まぜる → 焼く（調理台の左から順にうごく）
   ラウンド1だけ、5まいから3まい えらんで無料。食材★1＋★1をまぜると★2のお菓子（レシピがひらめく）、★2＋★2で★3スペシャル
   調理台6マス（①〜⑥の順にうごく）。冷蔵庫はなし（11/17 しょーくん）。画面は night-ui.js */
const SLOTS = 6, ROUND1_SHOW = 5, ROUND1_PICKS = 3, SHOP_N = 3, SHOP_MAX = 5, INCOME = 5, QUOTA_BONUS = 2, REROLL = 1;
const SELL = [0, 1, 3, 8];      // うると戻るコイン（★ごと）
const STEP_MS = REDUCED ? 200 : 620;
let N = null;          // S.night（夜のあいだの状態）
let busy = false;      // 焼いている間は操作しない

function startNight() {
  S.phase = 'night';
  S.today = { day: S.day, score: 0, beaten: false, drop: null, drops: 0, flashes: [], made: [], sales: 0, served: 0, visitors: 0, newRegulars: [] };
  S.night = {
    mon: (S.day - 1) % MONSTERS.length, field: null, stage: 'field', round: 1, coins: 0, picks: ROUND1_PICKS,
    board: Array(SLOTS).fill(null), shop: [], score: 0, met: 0, burnt: 0,
    flashes: [], sel: null, mixing: false, last: null,
  };
  scn.flee = 0; scn.heat = 2;
  save(); render();
}

/* ---------- 仕入れ ---------- */
const area = () => N.board;
const boardFx = k => N.board.reduce((a, b) => a + (b ? (cardDef(b.cid).fx[k] || 0) : 0), 0);
const shopSize = () => N.round === 1 ? ROUND1_SHOW : Math.min(SHOP_MAX, SHOP_N + boardFx('shop'));
function poolList() {
  const L = [];
  for (const cid of CHEFS[S.chef].pool) L.push([cid, cid[0] === 'm' ? 3 : 2]);
  if (N.round >= 3 || N.met > 0) L.push(['m:' + MONSTERS[N.mon].drop, 3]);
  for (const cid of S.pool) L.push([cid, 2]);
  return L;
}
function draw1(L) {
  let tot = 0; for (const [, w] of L) tot += w;
  let x = Math.random() * tot;
  for (const [c, w] of L) if ((x -= w) < 0) return c;
  return L[0][0];
}
function rollShop() {
  const L = poolList(), out = [];
  if (N.round === 1) {
    const ok = shuffle(S.pool.slice());
    while (out.length < 1 && ok.length) out.push(ok.pop());
    const foods = CHEFS[S.chef].pool.filter(c => c[0] === 'm');
    while (out.filter(c => cardDef(c).food).length < 3) out.push(pick(foods));
  }
  while (out.length < shopSize()) out.push(draw1(L));
  N.shop = shuffle(out);
}
function chooseField(id) {
  if (!FIELDS[id]) return;
  N.field = id; N.stage = 'shop'; scn.heat = FIELDS[id].start;
  rollShop(); save(); renderNight();
}
function place(cid) {
  const j = N.board.indexOf(null); if (j < 0) return null;
  N.board[j] = { cid }; return { where: 'board', i: j };
}
function buy(i) {
  const cid = N.shop[i]; if (!cid || busy || N.stage !== 'shop') return;
  const d = cardDef(cid), free = N.round === 1;
  if (free && N.picks <= 0) return toast('3まい えらんだよ。焼いてみよう');
  if (!free && N.coins < d.cost) return toast('コインがたりない');
  const at = place(cid);
  if (!at) return toast('調理台がいっぱい。うるか、まぜてから買おう');
  if (free) N.picks--; else N.coins -= d.cost;
  N.shop[i] = null; N.sel = null; N.mixing = false;
  save(); renderNight();
}
const selCard = () => N.sel && N.sel.where !== 'shop' ? area(N.sel.where)[N.sel.i] : null;
function sell() {
  const c = selCard(); if (!c || busy || N.stage !== 'shop') return;
  const d = cardDef(c.cid);
  if (N.round === 1 && d.star === 1) N.picks = Math.min(ROUND1_PICKS, N.picks + 1);
  else N.coins += SELL[d.star];
  area(N.sel.where)[N.sel.i] = null; N.sel = null; N.mixing = false;
  save(); renderNight();
}
function reroll() {
  if (busy || N.stage !== 'shop' || N.round === 1) return;
  if (N.coins < REROLL) return toast('コインがたりない');
  N.coins -= REROLL; rollShop(); N.sel = null; N.mixing = false; save(); renderNight();
}

/* ---------- まぜる：同じ★の食材どうし ---------- */
function canMix(a, b) { const A = cardDef(a.cid), B = cardDef(b.cid); return A.food && B.food && A.star === B.star && A.star < 3; }
function mixResult(a, b) {
  const A = cardDef(a), B = cardDef(b);
  return A.star === 1 ? 'o:' + recipeKey(A.mats[0], B.mats[0]) : 's:' + [a.slice(2), b.slice(2)].sort().join('|');
}
function partners() {
  const c = selCard(); if (!c) return [];
  const out = [];
  N.board.forEach((x, i) => { if (x && i !== N.sel.i && canMix(c, x)) out.push(i); });
  return out;
}
function startMix() {
  if (busy || N.stage !== 'shop' || !selCard()) return;
  if (!partners().length) return toast('まぜられる相手がいない（同じ★の食材どうし）');
  N.mixing = true; renderNight();
}
function closeView() { N.sel = null; N.mixing = false; renderNight(); }
function moveSel(d) {
  const s = N.sel; if (!s || s.where !== 'board' || busy) return;
  const j = s.i + d; if (j < 0 || j >= SLOTS) return;
  [N.board[j], N.board[s.i]] = [N.board[s.i], N.board[j]];
  N.sel = { where: 'board', i: j }; save(); renderNight();
}
function doMix(to) {
  const from = N.sel, a = area(from.where)[from.i], b = area(to.where)[to.i];
  const cid = mixResult(a.cid, b.cid), d = cardDef(cid);
  area(to.where)[to.i] = { cid, born: true }; area(from.where)[from.i] = null;
  N.mixing = false; N.sel = { where: to.where, i: to.i };
  if (FIELDS[N.field].mix) N.coins += FIELDS[N.field].mix;
  if (d.star === 2) {
    const key = cid.slice(2);
    if (S.recipes[key] == null) { S.recipes[key] = S.day; N.flashes.push(key); toast('ひらめき！ ' + d.name); }
    else toast(d.name + 'ができた');
  }
  save(); renderNight();
  delete area(to.where)[to.i].born;
  if (d.star === 3) cutIn(cid, 'スペシャルができた！');
}
/* タップ：カードを大きくひらく。まぜる相手をえらんでいるときは、光っているカードでまぜる */
function tapCard(where, i) {
  if (busy || N.stage !== 'shop') return;
  if (N.mixing) {
    const here = N.board[i];
    if (where === 'board' && here && i !== N.sel.i && canMix(selCard(), here)) return doMix({ where: 'board', i });
    N.mixing = false; N.sel = null; toast('同じ★の食材どうしをえらんでね');
    return renderNight();
  }
  const list = where === 'board' ? N.board : N.shop;
  if (!list[i]) return;
  N.sel = { where, i }; renderNight();
}

/* ---------- 焼く：調理台の左から順にうごく ---------- */
function resolveRound() {
  const F = FIELDS[N.field], ev = [], extra = Array(SLOTS).fill(0);
  let heat = F.start, pend = 1, total = 0, burnt = N.burnt;
  for (let i = 0; i < SLOTS; i++) {
    const b = N.board[i]; if (!b) continue;
    const d = cardDef(b.cid), fx = d.fx, sm = STAR_MUL[d.star];
    const times = 1 + Math.min(3, extra[i]);
    for (let t = 0; t < times; t++) {
      if (fx.set != null) heat = fx.set;
      heat += (fx.heat || 0) + (i === 0 && fx.first ? fx.first : 0);
      if (heat < 0) heat = 0;
      if (F.cap != null && heat > F.cap) heat = F.cap;
      let base = ((fx.dmg || 0) + (fx.hd || 0) * heat + (fx.kd || 0) * burnt) * sm;
      if (d.food) for (const j of [i - 1, i + 1]) {
        const o = j >= 0 && j < SLOTS ? N.board[j] : null;
        if (o) { const od = cardDef(o.cid); if (od.fx.nb) base += od.fx.nb * STAR_MUL[od.star]; }
      }
      let dmg = base;
      if (base > 0) { dmg = base * pend; pend = 1; }
      if (fx.next) pend *= fx.next;
      const z = zoneOf(heat);
      let isBurnt = false;
      if (z === 3) { isBurnt = true; burnt++; dmg = fx.proof ? dmg * 6 : 0; heat = 4; }
      else dmg *= F.mul[z];
      if (F.boost && d.star >= 2) dmg *= F.boost;
      dmg = Math.floor(dmg);
      total += dmg;
      if (fx.again && i + 1 < SLOTS && t === 0) extra[i + 1] += fx.again;
      ev.push({ i, again: t > 0, heat: isBurnt ? 11 : heat, after: heat, dmg, burnt: isBurnt });
    }
  }
  return { ev, total, burnt, start: F.start };
}
function bake() {
  if (busy || N.stage !== 'shop') return;
  if (!N.board.some(Boolean)) return toast('調理台にカードを置いてから焼こう');
  if (N.round === 1 && N.picks > 0 && N.shop.some(Boolean)) return toast(`あと${N.picks}まい えらべるよ`);
  const res = resolveRound();
  busy = true; N.sel = null; N.mixing = false; renderNight();
  setHeat(res.start);
  const q = quota(N.round, S.day);
  let k = 0, run = 0;
  const step = () => {
    if (k >= res.ev.length) return setTimeout(() => finishRound(res), STEP_MS);
    const e = res.ev[k], cid = N.board[e.i].cid;
    if (!e.again && !e.cut && cardDef(cid).star === 3) { e.cut = true; return setTimeout(step, cutIn(cid, 'スペシャル発動！')); }
    k++; run += e.dmg;
    showEvent(e, run, q);
    setTimeout(step, STEP_MS);
  };
  setTimeout(step, 200);
}
function finishRound(res) {
  const q = quota(N.round, S.day), ok = res.total >= q;
  N.score += res.total; N.burnt = res.burnt;
  if (ok) N.met++;
  N.last = { round: N.round, total: res.total, q, ok, coin: boardFx('coin') };
  N.stage = 'roundEnd'; busy = false;
  save(); renderNight();
}
function nextRound() {
  if (N.stage !== 'roundEnd') return;
  if (N.round >= ROUNDS) return endNight();
  N.coins += INCOME + (N.last.ok ? QUOTA_BONUS : 0) + N.last.coin;
  N.round++; N.stage = 'shop'; N.sel = null; N.mixing = false;
  scn.heat = FIELDS[N.field].start;
  rollShop(); save(); renderNight();
}
function endNight() {
  const hp = nightHP(S.day), beaten = N.score >= hp, drop = MONSTERS[N.mon].drop;
  const drops = N.met + (beaten ? 2 : 0);
  S.stock[drop] = (S.stock[drop] || 0) + drops;
  Object.assign(S.today, { score: N.score, beaten, drop, drops, flashes: N.flashes.slice() });
  N.stage = 'end';
  save(); renderNight();
}
