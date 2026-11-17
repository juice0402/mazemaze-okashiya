/* ==== 夜：食材モンスターの襲撃を9ラウンドで撃退する（ゼンゼロのオバケ屋敷の形が土台・仕様は claude/okashi-battle-spec.md） ====
   1ラウンド：ショップ（舞台にかぶせる。毎回3枚・有料の入れかえ・コインで買う・うる）＋ 手札と調理台で並べる・まぜる → バトル（ショップがとじて舞台でバトル）
   買ったカードは手札へ（5まいまで）。お金とコインはショップの中だけに出す（11/17 しょーくん「ゼンゼロのようにショップを挟む」）
   バトル：はじめに「焼き」（フィールドがあれば、鉄板の生地がいっせいに火力のぶん焼ける）→ 左から順に発動
   生地は場に残り、ラウンドをまたいで焼けていく（9でサイコー・サイコーのまま焼かれると焦げる）
   鉄板の火力（N.heat 1〜4）はラウンドをまたいで残る。火力カードが発動すると変わり、次のラウンドの焼きに効く
   フィールドも仕入れから。買うと調理台の左の「場」に入る（1つだけ・置きかえOK）。ラウンド1だけ、5まいから3まい えらんで無料
   調理台5マス。画面は night-ui.js */
const SLOTS = 5, HELD_MAX = 5, ROUND1_SHOW = 5, ROUND1_PICKS = 3, SHOP_N = 3, INCOME = 5, QUOTA_BONUS = 2, REROLL = 1;
const SELL = [0, 1, 3, 8];      // うると戻るコイン（★ごと）
const START_HEAT = 2;           // 夜のはじめの鉄板（中火）
const STEP_MS = REDUCED ? 200 : 620;
let N = null;          // S.night（夜のあいだの状態）
let busy = false;      // バトルとまぜる演出の間は操作しない
let fighting = false;  // バトルの間（ショップをとじて、舞台でバトルを見せる）

function startNight() {
  S.phase = 'night';
  S.today = { day: S.day, score: 0, beaten: false, drop: null, drops: 0, flashes: [], made: [], sales: 0, served: 0, visitors: 0, newRegulars: [] };
  S.night = {
    mon: (S.day - 1) % MONSTERS.length, field: null, heat: START_HEAT, call: false, stage: 'shop', round: 1, coins: 0, picks: ROUND1_PICKS,
    board: Array(SLOTS).fill(null), shop: [], score: 0, met: 0, burnt: 0,
    flashes: [], held: [], sel: null, view: false, last: null,
  };
  scn.flee = 0; scn.heat = START_HEAT;
  N = S.night; rollShop();
  save(); render();
}
/* 前の形のセーブ（6マス・前のカード）は、その夜をはじめからにする */
function nightOk(n) {
  try {
    if (!n || n.board.length !== SLOTS || !Number.isFinite(n.heat)) return false;
    if (!Array.isArray(n.held)) n.held = [];
    for (const c of [...n.board, ...n.shop, ...n.held]) if (c) cardDef(typeof c === 'string' ? c : c.cid);
    if (n.field && !FIELDS[n.field]) return false;
    return true;
  } catch (e) { return false; }
}

/* ---------- 仕入れ ---------- */
function poolList() {
  const C = CHEFS[S.chef], L = [];
  for (const cid of C.doughs) L.push([cid, 3]);
  for (const cid of C.common) L.push([cid, 2]);
  for (const id of C.fields) if (id !== N.field) L.push(['b:' + id, 1.5]);
  if (N.round >= 3 || N.met > 0) L.push(['m:' + MONSTERS[N.mon].drop, 2]);
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
  const C = CHEFS[S.chef], L = poolList(), out = [];
  if (N.call) {   // よびりん：フィールドをかならず1枚
    const f = C.fields.filter(id => id !== N.field);
    if (f.length) out.push('b:' + pick(f));
    N.call = false;
  }
  if (N.round === 1) {
    const ok = shuffle(S.pool.slice());
    while (out.length < 1 && ok.length) out.push(ok.pop());
    while (out.filter(c => cardDef(c).dough).length < 2) out.push(pick(C.doughs));
  }
  while (out.length < (N.round === 1 ? ROUND1_SHOW : SHOP_N)) {
    let c = draw1(L);
    for (let t = 0; t < 9 && c[0] === 'b' && out.includes(c); t++) c = draw1(L);   // 同じフィールドは1回に1枚まで
    out.push(c);
  }
  N.shop = shuffle(out);
}
/* 大きく見る画面をとじる */
function unsel() { N.sel = null; N.view = false; }
function place(cid, at) {
  const j = at != null && !N.board[at] ? at : N.board.indexOf(null); if (j < 0) return null;
  N.board[j] = cardDef(cid).dough ? { cid, cook: 0 } : { cid }; return { where: 'board', i: j };
}
/* 1ラウンド目は無料の枠・2ラウンド目からはコイン。n まい・cost コインはらえないわけ（はらえるなら空） */
function payNg(n, cost) {
  if (!n) return '';
  if (N.round === 1) return N.picks >= n ? '' : N.picks ? `無料はあと${N.picks}まい` : '3まい えらんだよ。バトルしてみよう';
  return N.coins >= cost ? '' : 'コインがたりない';
}
function pay(n, cost) { if (!n) return; if (N.round === 1) N.picks -= n; else N.coins -= cost; }
/* ショップのカードを買う。to が調理台のマスならそこへ、ほかは手札へ（フィールドは「場」へ） */
const handFull = () => N.held.length >= HELD_MAX;
const HAND_FULL = `手札がいっぱい（${HELD_MAX}まいまで）。うるか、まぜてから買おう`;
function buy(i, to) {
  const cid = N.shop[i]; if (!cid || busy || N.stage !== 'shop') return;
  const d = cardDef(cid), ng = payNg(1, d.cost);
  if (ng) return toast(ng);
  if (d.cat === 'field') {
    if (N.field) toast('フィールドを入れかえた');
    N.field = cid.slice(2); N.heat = FIELDS[N.field].start;
  } else if (to && to.where === 'board') { if (!place(cid, to.i)) return; }
  else if (handFull()) return toast(HAND_FULL);
  else N.held.push(asCard(cid));
  pay(1, d.cost); N.shop[i] = null; unsel();
  save(); renderNight();
}
/* 調理台のカードを手札にもどす */
function takeBack(i) {
  if (!N.board[i] || handFull()) return;
  N.held.push(N.board[i]); N.board[i] = null; unsel(); save(); renderNight();
}
/* 手札にあるカード（まぜてできた・自分のもの）を調理台へ */
function placeHeld(h, at) {
  const c = N.held[h]; if (!c || N.board[at]) return;
  N.board[at] = c; N.held.splice(h, 1); unsel();
  save(); renderNight();
  const t = document.querySelector(`.tslot[data-w="board"][data-i="${at}"] .pc`); if (t) replay(t, 'born');
}
/* うる・もどす（1ラウンド目の★1は「もどす」＝無料の枠がもどる） */
function sellValue(d) { return N.round === 1 && d.star === 1 && d.cat !== 'burnt' ? 0 : SELL[d.star]; }
function sellAt(p) {
  if (busy || N.stage !== 'shop' || !p) return;
  const c = p.where === 'field' ? (N.field ? { cid: 'b:' + N.field } : null) : cardAt(p); if (!c || p.where === 'shop') return;
  const d = cardDef(c.cid), v = sellValue(d);
  if (v) N.coins += v; else N.picks = Math.min(ROUND1_PICKS, N.picks + 1);
  if (p.where === 'field') N.field = null; else if (p.where === 'held') N.held.splice(p.i, 1); else N.board[p.i] = null;
  unsel(); save(); renderNight();
}
function sell() { sellAt(N.sel); }
function reroll() {
  if (busy || N.stage !== 'shop' || N.round === 1) return;
  if (N.coins < REROLL) return toast('コインがたりない');
  N.coins -= REROLL; rollShop(); unsel(); save(); renderNight();
}

/* ---------- まぜる：同じ★で、属性の合うものどうし（cards.js の mixable）。調理台・手札（仕入れ・手持ち）のどれどうしでも、まぜられる（仕入れのカードは買いながら） ---------- */
const canMix = (a, b) => mixable(cardDef(a.cid), cardDef(b.cid));
const asCard = cid => cardDef(cid).dough ? { cid, cook: 0 } : { cid };   // 仕入れの生地は生（焼き加減0）
/* その場所のカード（shop＝仕入れは買う前の形・held＝手持ち・board＝調理台） */
function cardAt(p) {
  if (!p) return null;
  if (p.where === 'shop') return N.shop[p.i] ? asCard(N.shop[p.i]) : null;
  if (p.where === 'held') return N.held[p.i] || null;
  return p.where === 'board' ? N.board[p.i] : null;
}
/* まぜてできるカード。焼き加減は、低いほうを引きつぐ */
function mixResult(a, b) {
  const cid = mixCid(a.cid, b.cid), cooks = [a, b].filter(x => x.cook != null).map(x => x.cook);
  return cardDef(cid).dough ? { cid, cook: cooks.length ? Math.min(...cooks) : 0 } : { cid };
}
/* まぜるときの代金（仕入れのカードの分）と、できたカードの行き先。調理台のカードとまぜたら調理台・手札どうしなら手札（手持ちになる） */
function mixPlan(p, q) {
  const shop = [p, q].filter(x => x.where === 'shop'), cost = shop.reduce((t, x) => t + cardDef(N.shop[x.i]).cost, 0);
  const bd = [q, p].find(x => x.where === 'board'), hd = [p, q].filter(x => x.where === 'held').map(x => x.i);
  const to = bd ? { where: 'board', i: bd.i } : hd.length ? { where: 'held', i: Math.min(...hd) } : { where: 'held', i: N.held.length < HELD_MAX ? N.held.length : -1 };
  return { n: shop.length, cost, to };
}
function mixNg(P) { return P.to.i < 0 ? `手札がいっぱい（${HELD_MAX}まいまで）` : payNg(P.n, P.cost); }
/* 調理台のほかのカードとまぜられるか（手札とタイルの「まぜ」の目じるし） */
const mixesWithBoard = (cid, skip) => N.board.some((x, i) => x && i !== skip && mixable(cardDef(cid), cardDef(x.cid)));
/* まぜられる相手の決まり（ドラッグの案内・大きく見る画面） */
function mixRule(d) {
  if (d.cat === 'field') return 'フィールドは まぜられない';
  if (d.star >= 3) return '★3は完成。もう まぜられない';
  return `${d.cat === 'tool' ? '道具' : d.cat === 'burnt' ? '焦げ' : '生地か素材'}の★${d.star}と まぜる`;
}
/* p のカードを q へ落としたら何が起きるか（ドラッグの光と案内・指をはなしたとき）。kind：mix・buy・place・move・sell */
function dropPlan(p, q) {
  const a = p.where === 'field' ? (N.field ? { cid: 'b:' + N.field } : null) : cardAt(p);
  if (!a || !q || (q.where === p.where && q.i === p.i)) return null;
  const d = cardDef(a.cid);
  if (q.where === 'sell') return p.where === 'shop' ? null : { kind: 'sell', v: sellValue(d) };
  if (d.cat === 'field') return q.where === 'field' && p.where === 'shop' ? { kind: 'buy', ng: payNg(1, d.cost), cost: d.cost } : null;
  if (q.where === 'field') return null;
  if (q.where === 'hand') {   // 手札の空いている所：ショップのカードは買って手札へ・調理台のカードは手札にもどす
    if (p.where === 'held') return null;
    const full = handFull() ? HAND_FULL : '';
    return p.where === 'shop' ? { kind: 'buy', ng: full || payNg(1, d.cost), cost: d.cost } : { kind: 'take', ng: full };
  }
  const b = cardAt(q);
  if (b && canMix(a, b)) { const P = mixPlan(p, q); return { kind: 'mix', P, ng: mixNg(P), r: mixResult(a, b) }; }
  if (q.where !== 'board') return null;
  if (p.where === 'board') return { kind: 'move', swap: !!b };
  if (b) return null;
  return p.where === 'shop' ? { kind: 'buy', ng: payNg(1, d.cost), cost: d.cost } : { kind: 'place' };
}
/* 指をはなした所で決める */
function dropCard(p, q, from) {
  const P = dropPlan(p, q); if (!P || busy || N.stage !== 'shop') return false;
  if (P.ng) { toast(P.ng); return false; }
  if (P.kind === 'mix') doMix(p, q, from);
  else if (P.kind === 'buy') buy(p.i, q.where === 'board' ? q : null);
  else if (P.kind === 'take') takeBack(p.i);
  else if (P.kind === 'place') placeHeld(p.i, q.i);
  else if (P.kind === 'move') moveTo(p.i, q.i);
  else if (P.kind === 'sell') sellAt(p);
  return true;
}
/* まぜる。2枚がシュッと飛び出してガキーン（mixFx）→ できたカードが調理台か手札へ */
function doMix(p, q, from) {
  const a = cardAt(p), b = cardAt(q);
  if (busy || !a || !b || !canMix(a, b)) return;
  const P = mixPlan(p, q), ng = mixNg(P); if (ng) return toast(ng);
  from = from || [cardSpot(p), cardSpot(q)];   // 演出のために、動く前の場所をおぼえる
  pay(P.n, P.cost);
  const r = mixResult(a, b), d = cardDef(r.cid);
  for (const x of [p, q]) { if (x.where === 'shop') N.shop[x.i] = null; if (x.where === 'board') N.board[x.i] = null; }
  if (P.to.where === 'board') {
    N.board[P.to.i] = r;
    [p, q].filter(x => x.where === 'held').forEach(x => N.held.splice(x.i, 1));
  } else {
    const hs = [p, q].filter(x => x.where === 'held').map(x => x.i).sort((x, y) => y - x);
    hs.slice(0, -1).forEach(h => N.held.splice(h, 1));   // 手持ちどうしなら、大きい番号のほうを消す
    N.held[P.to.i] = r;
  }
  unsel();
  let msg = '', isNew = false;   // できたカードの名前とひらめきは演出の札で見せる（演出なしのときだけ toast）
  if (d.star === 2 && d.food) {
    const key = r.cid.slice(2);
    if (S.recipes[key] == null) { S.recipes[key] = S.day; N.flashes.push(key); isNew = true; msg = 'ひらめき！ ' + d.name; }
    else msg = d.name + 'ができた';
  } else if (d.star === 2) msg = d.name + 'ができた';
  save(); renderNight();
  busy = true;
  mixFx(from, a.cid, b.cid, r.cid, P.to, skip => {
    busy = false;
    if (msg && skip) toast(msg);
    if (d.star === 3) cutIn(r.cid, 'スペシャルができた！');
  }, isNew);
}
/* 調理台のカードを、べつのマスへうごかす（カードがあれば入れかえ）。バトルを押すまで、いつでも */
function moveTo(i, j) {
  if (busy || !N.board[i]) return;
  [N.board[j], N.board[i]] = [N.board[i], N.board[j]];
  unsel(); save(); renderNight();
  const t = document.querySelector(`.tslot[data-w="board"][data-i="${j}"] .pc`); if (t) replay(t, 'kon');
}
function closeView() { unsel(); renderNight(); }
/* タップ：カードを大きく見る（説明・買う・うる）。置く・うごかす・まぜる・うるは、ドラッグで（drag.js） */
function tapCard(where, i) {
  if (busy || N.stage !== 'shop') return;
  if (where === 'field' ? !N.field : !cardAt({ where, i })) return;
  N.sel = { where, i }; N.view = true; renderNight();
}

/* ---------- バトル（関数の名前は bake のまま） ---------- */
const burntOf = d => 'k:' + (d.star >= 2 || d.fx.bitter ? 2 : 1);
/* 生地を add だけ焼く。サイコー（9）のまま焼かれると焦げる（safe なら焦げずにサイコーで止まる） */
function cookStep(c, add, safe) {
  const d = cardDef(c.cid), from = c.cook || 0;
  if (from >= COOK_MAX && !safe) return { from, to: from, burnt: true, cid: burntOf(d) };
  c.cook = Math.min(COOK_MAX, from + Math.max(1, add));
  return { from, to: c.cook, burnt: false, cid: c.cid };
}
/* 1ラウンドの計算（画面より先に、ぜんぶ決める）。board と heat は finishRound で N に入れる */
function resolveRound() {
  const F = N.field ? FIELDS[N.field] : null, ev = [];
  const board = N.board.map(c => c && { cid: c.cid, cook: c.cook });
  let heat = N.heat, burnt = 0, call = false;
  const stop = () => board.some(c => c && cardDef(c.cid).fx.stop);
  const burn = (i, r) => { if (r.burnt) { board[i] = { cid: r.cid }; burnt++; } };
  // 1. 焼き：バトルのはじめに、鉄板の生地がいっせいに焼ける
  if (F) {
    const list = [], safeAll = stop();
    board.forEach((c, i) => {
      if (!c) return; const d = cardDef(c.cid); if (!d.dough) return;
      const r = cookStep(c, heat + (d.fx.spd || 0), safeAll || d.fx.noburn);
      burn(i, r); list.push({ i, ...r });
    });
    if (list.length) ev.push({ type: 'bake', heat, list });
  }
  // 2. 発動：左から順に
  const idx = board.map((c, i) => c ? i : -1).filter(i => i >= 0);
  const first = idx[0], last = idx[idx.length - 1];
  const extra = Array(SLOTS).fill(0);
  let pend = 1, total = 0, rally = 0;
  for (const i of idx) {
    const times = 1 + Math.min(3, extra[i]);
    for (let t = 0; t < times; t++) {
      const c = board[i], d = cardDef(c.cid), fx = d.fx, sm = STAR_MUL[d.star];
      const e = { type: 'act', i, cid: c.cid, again: t > 0, dmg: 0, cook: c.cook };
      if (i === first && t === 0 && fx.rally) { rally += fx.rally * sm; e.rally = true; }
      if (fx.heat) { const h0 = heat; heat = Math.max(1, Math.min(HEAT_MAX, heat + fx.heat)); e.heat = [h0, heat]; }
      if (fx.sear && board[i + 1] && cardDef(board[i + 1].cid).dough) {
        const o = board[i + 1], r = cookStep(o, fx.sear, stop() || cardDef(o.cid).fx.noburn);
        burn(i + 1, r); e.sear = { i: i + 1, ...r };
      }
      let dmg = 0;
      if (fx.dmg) {
        let base = fx.dmg * sm;
        if (d.dough) { base *= cookMul(c.cook || 0); if (F && F.best && c.cook >= COOK_MAX) base *= F.best; }
        if (fx.lead && i === first) { base *= fx.lead; e.lead = true; }
        if (fx.sai && i === last) { const n = board.filter(o => o && cardDef(o.cid).dough && o.cook >= COOK_MAX).length; base *= Math.pow(fx.sai + 0.5 * (d.star - 1), n); e.sai = n; }
        for (const j of [i - 1, i + 1]) { const o = board[j]; if (o) { const od = cardDef(o.cid); if (od.fx.nb) base += od.fx.nb * STAR_MUL[od.star]; } }
        base += rally;
        base *= pend; pend = 1;
        dmg = Math.min(DMG_CAP, Math.floor(base));
      }
      if (fx.next) pend *= fx.next;
      total += dmg;
      if (fx.fin && i === last) { const add = Math.floor(total * (fx.fin - 1)); dmg += add; total += add; e.fin = true; }
      total = Math.min(DMG_CAP, total);
      if (fx.again && t === 0 && i + 1 < SLOTS) extra[i + 1] += fx.again;
      if (fx.call) { call = true; e.call = true; }
      e.dmg = dmg;
      ev.push(e);
    }
  }
  return { ev, total, burnt, board, heat, call };
}
function bake() {
  if (busy || N.stage !== 'shop') return;
  if (!N.board.some(Boolean)) return toast('調理台にカードを置いてからバトルしよう');
  if (N.round === 1 && N.picks > 0 && N.shop.some(Boolean)) return toast(`あと${N.picks}まい えらべるよ`);
  const res = resolveRound();
  busy = true; fighting = true; unsel(); renderNight();
  const q = quota(N.round, S.day);
  let k = 0, run = 0;
  const step = () => {
    if (k >= res.ev.length) return setTimeout(() => finishRound(res), STEP_MS);
    const e = res.ev[k];
    if (e.type === 'act' && !e.again && !e.cut && cardDef(e.cid).star === 3) { e.cut = true; return setTimeout(step, cutIn(e.cid, 'スペシャル発動！')); }
    k++; run += e.dmg || 0;
    showEvent(e, run, q);
    setTimeout(step, e.type === 'bake' ? STEP_MS * 1.6 : STEP_MS);
  };
  setTimeout(step, 200);
}
function finishRound(res) {
  const q = quota(N.round, S.day), ok = res.total >= q;
  N.board = res.board; N.heat = res.heat; if (res.call) N.call = true;
  N.score += res.total; N.burnt += res.burnt;
  if (ok) N.met++;
  N.last = { round: N.round, total: res.total, q, ok };
  N.stage = 'roundEnd'; busy = false; fighting = false;
  save(); renderNight();
}
function nextRound() {
  if (N.stage !== 'roundEnd') return;
  if (N.round >= ROUNDS) return endNight();
  N.coins += INCOME + (N.last.ok ? QUOTA_BONUS : 0);
  N.round++; N.stage = 'shop'; unsel();
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
