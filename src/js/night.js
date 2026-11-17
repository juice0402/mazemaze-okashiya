/* ==== 夜：食材モンスターの襲撃を9ラウンドで撃退する（ゼンゼロのオバケ屋敷の形が土台） ====
   1ラウンド：仕入れ（毎回3枚・入れかえ・コインで買う）→ 並べる・まぜる → 焼く（調理台の左から順にうごく）
   ラウンド1だけ、5まいから3まい えらんで無料。食材★1＋★1をまぜると★2のお菓子（レシピがひらめく）、★2＋★2で★3スペシャル
   調理台6マスのカードだけがうごく。冷蔵庫3マスは、まぜる相手をとっておく場所 */
const SLOTS = 6, FRIDGE = 3, ROUND1_SHOW = 5, ROUND1_PICKS = 3, SHOP_N = 3, SHOP_MAX = 5, INCOME = 5, QUOTA_BONUS = 2, REROLL = 1;
const SELL = [0, 1, 3, 8];      // うると戻るコイン（★ごと）
const STEP_MS = REDUCED ? 140 : 420;
let N = null;          // S.night（夜のあいだの状態）
let busy = false;      // 焼いている間は操作しない

function startNight() {
  S.phase = 'night';
  S.today = { day: S.day, score: 0, beaten: false, drop: null, drops: 0, flashes: [], made: [], sales: 0, served: 0, visitors: 0, newRegulars: [] };
  S.night = {
    mon: (S.day - 1) % MONSTERS.length, field: null, stage: 'field', round: 1, coins: 0, picks: ROUND1_PICKS,
    board: Array(SLOTS).fill(null), fridge: Array(FRIDGE).fill(null), shop: [], score: 0, met: 0, burnt: 0,
    flashes: [], sel: null, mixing: false, last: null,
  };
  scn.flee = 0; scn.heat = 2;
  save(); render();
}

/* ---------- 仕入れ ---------- */
const area = w => w === 'board' ? N.board : N.fridge;
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
  for (const w of ['board', 'fridge']) { const a = area(w), j = a.indexOf(null); if (j >= 0) { a[j] = { cid }; return { where: w, i: j }; } }
  return null;
}
function buy(i) {
  const cid = N.shop[i]; if (!cid || busy || N.stage !== 'shop') return;
  const d = cardDef(cid), free = N.round === 1;
  if (free && N.picks <= 0) return toast('3まい えらんだよ。焼いてみよう');
  if (!free && N.coins < d.cost) return toast('コインがたりない');
  const at = place(cid);
  if (!at) return toast('調理台も冷蔵庫もいっぱい。うるか、まぜてから買おう');
  if (free) N.picks--; else N.coins -= d.cost;
  N.shop[i] = null; N.sel = at; N.mixing = false;
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
  for (const w of ['board', 'fridge']) area(w).forEach((x, i) => { if (x && !(w === N.sel.where && i === N.sel.i) && canMix(c, x)) out.push(w + i); });
  return out;
}
function startMix() {
  if (busy || N.stage !== 'shop' || !selCard()) return;
  if (!partners().length) return toast('まぜられる相手がいない（同じ★の食材どうし）');
  N.mixing = true; renderNight();
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
  } else toast('スペシャル！ ' + d.name);
  save(); renderNight();
  delete area(to.where)[to.i].born;
}
function tapCard(where, i) {
  if (busy || N.stage !== 'shop') return;
  const s = N.sel, here = area(where)[i], same = s && s.where === where && s.i === i;
  if (N.mixing) {
    if (here && !same && canMix(selCard(), here)) return doMix({ where, i });
    N.mixing = false;
    if (!same) toast('同じ★の食材どうしをえらんでね');
    return renderNight();
  }
  if (s && s.where !== 'shop' && !same) {
    const a = area(s.where), b = area(where);
    [a[s.i], b[i]] = [b[i], a[s.i]];
    N.sel = b[i] ? { where, i } : null;
    save(); return renderNight();
  }
  N.sel = here && !same ? { where, i } : null;
  renderNight();
}
function tapShop(i) {
  if (busy || N.stage !== 'shop' || !N.shop[i]) return;
  const s = N.sel;
  N.mixing = false;
  N.sel = s && s.where === 'shop' && s.i === i ? null : { where: 'shop', i };
  renderNight();
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
    const e = res.ev[k++];
    run += e.dmg;
    showEvent(e, run, q);
    setTimeout(step, STEP_MS);
  };
  setTimeout(step, 200);
}
function setHeat(h) {
  scn.heat = h;
  const bar = $('heatBar'), lab = $('heatLabel'); if (!bar) return;
  const z = zoneOf(h);
  [...bar.children].forEach((c, i) => { c.className = i < Math.min(12, h) ? 'on z' + zoneOf(i + 1) : ''; });
  lab.textContent = `${ZONES[z]} ${Math.min(h, 99)}`;
  lab.className = 'heat-label z' + z;
  const st = $('stage'); if (st) st.dataset.z = z;
}
function floatAt(el, text, cls = '') {
  if (!el) return;
  const f = document.createElement('span');
  f.className = 'float ' + cls; f.textContent = text;
  el.appendChild(f); setTimeout(() => f.remove(), 1000);
}
function replay(el, cls) { if (!el) return; el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); }
function showEvent(e, run, q) {
  const slot = document.querySelector(`[data-act="card"][data-w="board"][data-i="${e.i}"]`);
  const card = slot && slot.querySelector('.card');
  if (card) { card.classList.remove('fire'); void card.offsetWidth; card.classList.add('fire'); }
  setHeat(e.heat);
  if (e.burnt) { replay($('smoke'), 'on'); heroFor('oops', 1100); floatAt(slot, '焦げた', 'koge'); setTimeout(() => setHeat(e.after), STEP_MS / 2); }
  if (e.dmg > 0) { floatAt(slot, (e.again ? 'もう1回 ' : '') + fmt(e.dmg)); replay($('mon'), 'hit'); replay($('hero'), 'act'); floatAt($('floats'), fmt(e.dmg), 'big'); }
  $('score').textContent = fmt(N.score + run);
  $('qfill').style.width = Math.min(100, run / q * 100) + '%';
  $('qtext').textContent = `${fmt(run)} / ノルマ ${fmt(q)}`;
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

/* ---------- 画面（スマホ1画面に収める） ---------- */
function cardHTML(cid, extra = '') {
  const d = cardDef(cid);
  return `<div class="card k-${d.kind}${extra}"><i class="band"></i><img${hiArt(cid) ? ' class="hi"' : ''} src="${cardIconURL(cid)}" alt="">${d.star > 1 ? `<span class="rk">${'★'.repeat(d.star)}</span>` : ''}<span class="nm">${esc(d.short)}</span></div>`;
}
function cellHTML(w, i, c, mixable) {
  const s = N.sel, on = s && s.where === w && s.i === i;
  const cls = (on ? ' sel' : '') + (mixable ? ' can' : '');
  return `<button class="slot${cls}" data-act="card" data-w="${w}" data-i="${i}" aria-label="${w === 'board' ? '調理台' : '冷蔵庫'}${i + 1}">${c ? cardHTML(c.cid, c.born ? ' born' : '') : ''}</button>`;
}
function actionHTML() {
  if (N.stage === 'roundEnd') {
    const L = N.last, drop = MATS[MONSTERS[N.mon].drop].short, gain = [];
    if (L.ok) gain.push(`コイン+${QUOTA_BONUS}`, `${drop}1つ`);
    if (L.coin) gain.push(`ちょきん箱+${L.coin}`);
    return `<div class="info"><b class="ttl">ラウンド${L.round}　${fmt(L.total)}</b><p>${L.ok ? 'ノルマたっせい！' : 'ノルマにとどかなかった'}${gain.length ? '　' + gain.join('・') : ''}</p></div>
      <button class="go" data-act="next">${L.round >= ROUNDS ? '結果へ' : 'つぎへ'}</button>`;
  }
  const bakeBtn = `<button class="go" data-act="bake" ${busy ? 'disabled' : ''}>焼く！</button>`;
  if (N.mixing) return `<div class="info"><b class="ttl">まぜる相手をタップ</b><p>光っているカード（同じ★の食材）とまぜるよ</p><div class="btns"><button class="sub sm" data-act="cancelMix">やめる</button></div></div>${bakeBtn}`;
  const s = N.sel;
  if (s && s.where === 'shop' && N.shop[s.i]) {
    const d = cardDef(N.shop[s.i]), free = N.round === 1;
    return `<div class="info"><b class="ttl">${esc(d.name)} <small>${KIND_NAME[d.kind]}${d.star > 1 ? ' ★' + d.star : ''}</small></b><p>${fxText(d.fx, d.star)}</p>
      <div class="btns"><button class="sm" data-act="buy" data-i="${s.i}" ${!free && N.coins < d.cost ? 'disabled' : ''}>${free ? 'えらぶ' : `買う（${d.cost}）`}</button></div></div>${bakeBtn}`;
  }
  const c = selCard();
  if (c) {
    const d = cardDef(c.cid), canM = d.food && d.star < 3;
    return `<div class="info"><b class="ttl">${esc(d.name)} <small>${KIND_NAME[d.kind]}${d.star > 1 ? ' ★' + d.star : ''}</small></b><p>${fxText(d.fx, d.star)}</p>
      <div class="btns">${canM ? `<button class="sm" data-act="mix" ${partners().length ? '' : 'disabled'}>まぜる</button>` : ''}<button class="sub sm" data-act="sell">${N.round === 1 && d.star === 1 ? 'もどす' : `うる（+${SELL[d.star]}）`}</button><span class="hint">ほかのマスで入れかえ</span></div></div>${bakeBtn}`;
  }
  const hint = N.round === 1 ? `5まいから<b>3まい</b>えらぼう（あと${N.picks}）。同じ★の食材どうしは、まぜると強くなるよ` : '調理台のカードが左からうごくよ。食材★1＋★1で★2、★2＋★2で★3';
  return `<div class="info"><p>${hint}</p></div>${bakeBtn}`;
}
/* ほのかの立ち絵：バトルは右向きのかまえ。表情の絵は左向きなので左右反転して右向きにする */
const HERO = { battle: ['honoka-battle', false], joy: ['honoka-joy', true], surprise: ['honoka-surprise', true], oops: ['honoka-oops', true] };
function heroPick(k) { const [n, flip] = HERO[k]; return ART[n] ? { src: ART[n], flip } : { src: ART.honoka || big(CHEF_SPR[0], 8), flip: !!ART.honoka }; }
function heroImg(k) { const h = heroPick(k); return `<img class="chef${ART.honoka ? ' hi' : ''}${h.flip ? ' flip' : ''}" id="hero" src="${h.src}" alt="炎のシェフ ほのか">`; }
let heroT = 0;
function heroFor(k, ms) {
  const el = $('hero'); if (!el) return;
  const set = kk => { const h = heroPick(kk); el.src = h.src; el.classList.toggle('flip', h.flip); };
  set(k); clearTimeout(heroT); heroT = setTimeout(() => set('battle'), ms);
}
const MON_URL = {};
const monURL = id => MON_URL[id] || (MON_URL[id] = ART['mon-' + id] || big(MON_SPR[id], 8));
function heatCells() { return Array.from({ length: 12 }, () => '<i></i>').join(''); }
function renderNight() {
  N = S.night;
  if (!N.fridge) N.fridge = Array(FRIDGE).fill(null);
  const mon = MONSTERS[N.mon], F = N.field ? FIELDS[N.field] : null;
  let body = '';
  if (N.stage === 'field') {
    const chef = CHEFS[S.chef];
    body = `<div class="panel tight"><h2>${esc(mon.name)}がやってきた！</h2><p>${esc(mon.text)}。${chef.job} ${chef.name}のフィールドを1つえらぼう</p></div>
      <div class="fields">${chef.fields.map(id => `<button class="field" data-act="field" data-id="${id}"><b>${FIELDS[id].name}</b><span>${FIELDS[id].text}</span></button>`).join('')}</div>`;
  } else if (N.stage === 'end') {
    const T = S.today, hp = nightHP(S.day), m = MATS[T.drop];
    body = `<div class="panel end ${T.beaten ? 'win' : ''}"><h2>${T.beaten ? '撃退せいこう！' : 'にげられちゃった…'}</h2>
        <p class="bignum">${fmt(T.score)}</p><p>${esc(mon.name)}のたいりょく ${fmt(hp)}</p>
        <div class="got"><img src="${matURL(T.drop)}" alt=""><span>${m.name} ×${T.drops}</span></div>
        <p>${T.flashes.length ? 'ひらめいたレシピ：' + T.flashes.map(k => esc(recipeOf(k).name)).join('、') : 'ひらめいたレシピはなかった（食材★1どうしをまぜるとひらめくよ）'}</p>
      </div><button class="big" data-act="toMorning">朝の仕込みへ</button>`;
  } else {
    const mx = N.mixing ? partners() : [];
    const n = N.shop.length;
    body = `<div class="board">${N.board.map((c, i) => cellHTML('board', i, c, mx.includes('board' + i))).join('')}</div>
      <div class="fridge"><span class="lbl">冷蔵庫</span>${N.fridge.map((c, i) => cellHTML('fridge', i, c, mx.includes('fridge' + i))).join('')}
        <div class="wallet"><span class="fieldchip">${F.name}</span><span>${N.round === 1 ? `無料 あと<b>${N.picks}</b>` : `コイン <b>${N.coins}</b>`}</span></div></div>
      ${N.stage === 'shop' ? `<div class="shoprow"><div class="shop" style="--n:${n}">${N.shop.map((c, i) => c ? `<button class="shopcard${N.sel && N.sel.where === 'shop' && N.sel.i === i ? ' sel' : ''}" data-act="shop" data-i="${i}">${cardHTML(c)}<span class="cost">${N.round === 1 ? '無料' : cardDef(c).cost}</span></button>` : '<span class="soldout"></span>').join('')}</div>
        ${N.round === 1 ? '' : `<button class="sub reroll" data-act="reroll" ${N.coins < REROLL ? 'disabled' : ''}>入れ<br>かえ<small>${REROLL}</small></button>`}</div>` : '<div class="shoprow"></div>'}
      <div class="action">${actionHTML()}</div>`;
  }
  const q = quota(Math.min(N.round, ROUNDS), S.day), lastRun = N.stage === 'roundEnd' ? N.last.total : 0;
  $('screen').innerHTML = `<section class="night fit">
    <div class="stage" id="stage" data-z="0"><i class="st-win"></i><i class="st-floor"></i><i class="glow"></i>
      ${heroImg(N.stage === 'end' ? (S.today.beaten ? 'joy' : 'surprise') : 'battle')}
      <img class="mon${N.stage === 'end' && S.today.beaten ? ' flee' : ''}" id="mon" src="${monURL(mon.id)}" alt="${esc(mon.name)}">
      <i class="smoke" id="smoke"></i><div id="floats"></div>
      <div class="ov-top"><span>ラウンド <b>${Math.min(N.round, ROUNDS)}</b>/${ROUNDS}</span><span class="score">スコア <b id="score">${fmt(N.score)}</b></span></div>
      <div class="ov-heat"><span class="heat-label" id="heatLabel"></span><div class="heat-bar" id="heatBar">${heatCells()}</div></div></div>
    <div class="quota"><div class="qbar"><i id="qfill" style="width:${Math.min(100, lastRun / q * 100)}%"></i></div><span id="qtext">${N.stage === 'roundEnd' ? fmt(lastRun) + ' / ' : ''}ノルマ ${fmt(q)}</span></div>
    ${body}</section>`;
  setHeat(N.field ? (N.stage === 'shop' ? FIELDS[N.field].start : scn.heat) : 2);
}
