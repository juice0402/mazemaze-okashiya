/* ==== 夜：食材モンスターの襲撃を9ラウンドで撃退する（ゼンゼロのオバケ屋敷の形が土台・仕様は claude/okashi-battle-spec.md） ====
   1ラウンド：仕入れ（毎回3枚・入れかえ・コインで買う）→ 並べる・まぜる → バトル
   バトル：はじめに「焼き」（フィールドがあれば、鉄板の生地がいっせいに火力のぶん焼ける）→ 左から順に発動
   生地は場に残り、ラウンドをまたいで焼けていく（9でサイコー・サイコーのまま焼かれると焦げる）
   鉄板の火力（N.heat 1〜4）はラウンドをまたいで残る。火力カードが発動すると変わり、次のラウンドの焼きに効く
   フィールドも仕入れから。買うと調理台の左の「場」に入る（1つだけ・置きかえOK）。ラウンド1だけ、5まいから3まい えらんで無料
   調理台5マス。画面は night-ui.js */
const SLOTS = 5, ROUND1_SHOW = 5, ROUND1_PICKS = 3, SHOP_N = 3, INCOME = 5, QUOTA_BONUS = 2, REROLL = 1;
const SELL = [0, 1, 3, 8];      // うると戻るコイン（★ごと）
const START_HEAT = 2;           // 夜のはじめの鉄板（中火）
const STEP_MS = REDUCED ? 200 : 620;
let N = null;          // S.night（夜のあいだの状態）
let busy = false;      // バトルの間は操作しない

function startNight() {
  S.phase = 'night';
  S.today = { day: S.day, score: 0, beaten: false, drop: null, drops: 0, flashes: [], made: [], sales: 0, served: 0, visitors: 0, newRegulars: [] };
  S.night = {
    mon: (S.day - 1) % MONSTERS.length, field: null, heat: START_HEAT, call: false, stage: 'shop', round: 1, coins: 0, picks: ROUND1_PICKS,
    board: Array(SLOTS).fill(null), shop: [], score: 0, met: 0, burnt: 0,
    flashes: [], sel: null, mixing: false, last: null,
  };
  scn.flee = 0; scn.heat = START_HEAT;
  N = S.night; rollShop();
  save(); render();
}
/* 前の形のセーブ（6マス・前のカード）は、その夜をはじめからにする */
function nightOk(n) {
  try {
    if (!n || n.board.length !== SLOTS || !Number.isFinite(n.heat)) return false;
    for (const c of [...n.board, ...n.shop]) if (c) cardDef(typeof c === 'string' ? c : c.cid);
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
function place(cid) {
  const j = N.board.indexOf(null); if (j < 0) return null;
  N.board[j] = cardDef(cid).dough ? { cid, cook: 0 } : { cid }; return { where: 'board', i: j };
}
function buy(i) {
  const cid = N.shop[i]; if (!cid || busy || N.stage !== 'shop') return;
  const d = cardDef(cid), free = N.round === 1;
  if (free && N.picks <= 0) return toast('3まい えらんだよ。バトルしてみよう');
  if (!free && N.coins < d.cost) return toast('コインがたりない');
  if (d.cat === 'field') {
    if (N.field) toast('フィールドを入れかえた');
    N.field = cid.slice(2); N.heat = FIELDS[N.field].start;
  } else if (!place(cid)) return toast('調理台がいっぱい。うるか、まぜてから買おう');
  if (free) N.picks--; else N.coins -= d.cost;
  N.shop[i] = null; N.sel = null; N.mixing = false;
  save(); renderNight();
}
const selCard = () => N.sel && N.sel.where === 'board' ? N.board[N.sel.i] : null;
function sell() {
  if (busy || N.stage !== 'shop' || !N.sel) return;
  if (N.sel.where === 'field') {
    if (!N.field) return;
    if (N.round === 1) N.picks = Math.min(ROUND1_PICKS, N.picks + 1); else N.coins += SELL[1];
    N.field = null; N.sel = null;
    return save(), renderNight();
  }
  const c = selCard(); if (!c) return;
  const d = cardDef(c.cid);
  if (N.round === 1 && d.star === 1 && d.cat !== 'burnt') N.picks = Math.min(ROUND1_PICKS, N.picks + 1);
  else N.coins += SELL[d.star];
  N.board[N.sel.i] = null; N.sel = null; N.mixing = false;
  save(); renderNight();
}
function reroll() {
  if (busy || N.stage !== 'shop' || N.round === 1) return;
  if (N.coins < REROLL) return toast('コインがたりない');
  N.coins -= REROLL; rollShop(); N.sel = null; N.mixing = false; save(); renderNight();
}

/* ---------- まぜる：同じ★で、属性の合うものどうし（cards.js の mixable） ---------- */
const canMix = (a, b) => mixable(cardDef(a.cid), cardDef(b.cid));
function partners() {
  const c = selCard(); if (!c) return [];
  const out = [];
  N.board.forEach((x, i) => { if (x && i !== N.sel.i && canMix(c, x)) out.push(i); });
  return out;
}
function startMix() {
  if (busy || N.stage !== 'shop' || !selCard()) return;
  if (!partners().length) return toast('まぜられる相手がいない（同じ★の 生地・素材どうし／道具どうし／焦げどうし）');
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
  const a = N.board[N.sel.i], b = N.board[to.i];
  const cid = mixCid(a.cid, b.cid), d = cardDef(cid);
  const cooks = [a, b].filter(x => x.cook != null).map(x => x.cook);   // 焼き加減は、低いほうを引きつぐ
  N.board[to.i] = d.dough ? { cid, cook: cooks.length ? Math.min(...cooks) : 0, born: true } : { cid, born: true };
  N.board[N.sel.i] = null;
  N.mixing = false; N.sel = { where: 'board', i: to.i };
  if (d.star === 2 && d.food) {
    const key = cid.slice(2);
    if (S.recipes[key] == null) { S.recipes[key] = S.day; N.flashes.push(key); toast('ひらめき！ ' + d.name); }
    else toast(d.name + 'ができた');
  } else if (d.star === 2) toast(d.name + 'ができた');
  save(); renderNight();
  delete N.board[to.i].born;
  if (d.star === 3) cutIn(cid, 'スペシャルができた！');
}
/* タップ：カードを大きくひらく。まぜる相手をえらんでいるときは、光っているカードでまぜる */
function tapCard(where, i) {
  if (busy || N.stage !== 'shop') return;
  if (N.mixing) {
    const here = N.board[i];
    if (where === 'board' && here && i !== N.sel.i && canMix(selCard(), here)) return doMix({ where: 'board', i });
    N.mixing = false; N.sel = null; toast('光っているカードをえらんでね');
    return renderNight();
  }
  if (where === 'field') { if (N.field) { N.sel = { where, i: 0 }; renderNight(); } return; }
  const list = where === 'board' ? N.board : N.shop;
  if (!list[i]) return;
  N.sel = { where, i }; renderNight();
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
  busy = true; N.sel = null; N.mixing = false; renderNight();
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
  N.stage = 'roundEnd'; busy = false;
  save(); renderNight();
}
function nextRound() {
  if (N.stage !== 'roundEnd') return;
  if (N.round >= ROUNDS) return endNight();
  N.coins += INCOME + (N.last.ok ? QUOTA_BONUS : 0);
  N.round++; N.stage = 'shop'; N.sel = null; N.mixing = false;
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
