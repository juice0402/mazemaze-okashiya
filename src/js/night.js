/* ==== 夜：食材モンスターの襲撃を9ラウンドで撃退する（ゼンゼロのオバケ屋敷の形が土台） ====
   1ラウンド：仕入れ（カードを買って調理台6マスに置く）→ 焼く（左から順にうごいてダメージ）
   ラウンド1だけ、5まいから3まい えらんで無料で置く。同じカードを買うと★が上がる（★2で×2、★3で×4）
   となりあう食材はまざってボーナス。材料どうしがまざると、レシピがひらめく */
const SLOTS = 6, ROUND1_SHOW = 5, ROUND1_PICKS = 3, SHOP_N = 4, INCOME = 5, QUOTA_BONUS = 2, REROLL = 1;
const STEP_MS = REDUCED ? 140 : 420;
let N = null;          // S.night（夜のあいだの状態）
let busy = false;      // 焼いている間は操作しない

function startNight() {
  S.phase = 'night';
  S.today = { day: S.day, score: 0, beaten: false, drop: null, drops: 0, flashes: [], made: [], sales: 0, served: 0, visitors: 0, newRegulars: [] };
  S.night = {
    mon: (S.day - 1) % MONSTERS.length, field: null, stage: 'field', round: 1, coins: 0, picks: ROUND1_PICKS,
    board: Array(SLOTS).fill(null), shop: [], score: 0, met: 0, burnt: 0, flashes: [], sel: null, last: null,
  };
  scn.flee = 0; scn.heat = 2;
  save(); render();
}

/* ---------- 仕入れ ---------- */
function poolList() {
  const L = [];
  for (const cid of CHEFS[S.chef].pool) L.push([cid, cid[0] === 'm' ? 3 : 2]);
  if (N.round >= 3 || N.met > 0) L.push(['m:' + MONSTERS[N.mon].drop, 3]);
  for (const cid of S.pool) L.push([cid, 2]);
  for (const b of N.board) if (b && b.rank < 3) L.push([b.cid, 2]);   // 置いているカードは出やすい（★を上げやすく）
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
    while (out.length < 2 && ok.length) out.push(ok.pop());
    const foods = CHEFS[S.chef].pool.filter(c => c[0] === 'm');
    while (out.filter(c => cardDef(c).food).length < 2) out.push(pick(foods));
  }
  while (out.length < (N.round === 1 ? ROUND1_SHOW : SHOP_N)) out.push(draw1(L));
  N.shop = shuffle(out);
}
function chooseField(id) {
  if (!FIELDS[id]) return;
  N.field = id; N.stage = 'shop'; scn.heat = FIELDS[id].start;
  rollShop(); save(); renderNight();
}
function buy(i) {
  const cid = N.shop[i]; if (!cid || busy || N.stage !== 'shop') return;
  const d = cardDef(cid), free = N.round === 1;
  if (free && N.picks <= 0) return toast('3まい えらんだよ。焼いてみよう');
  if (!free && N.coins < d.cost) return toast('コインがたりない');
  let j = N.board.findIndex(b => b && b.cid === cid && b.rank < 3);
  if (j >= 0) { N.board[j].rank++; toast(`${d.name} が ★${N.board[j].rank} になった`); }
  else {
    j = N.board.indexOf(null);
    if (j < 0) return toast('調理台がいっぱい。カードをうってから買おう');
    N.board[j] = { cid, rank: 1 };
  }
  if (free) N.picks--; else N.coins -= d.cost;
  N.shop[i] = null;
  N.sel = { where: 'board', i: j };
  save(); renderNight();
}
function sell(j) {
  const b = N.board[j]; if (!b || busy || N.stage !== 'shop') return;
  if (N.round === 1) N.picks = Math.min(ROUND1_PICKS, N.picks + b.rank);
  else N.coins += 2 * b.rank;
  N.board[j] = null; N.sel = null;
  save(); renderNight();
}
function reroll() {
  if (busy || N.stage !== 'shop' || N.round === 1) return;
  if (N.coins < REROLL) return toast('コインがたりない');
  N.coins -= REROLL; rollShop(); N.sel = null; save(); renderNight();
}
function tapSlot(j) {
  if (busy || N.stage !== 'shop') return;
  const s = N.sel;
  if (s && s.where === 'board' && s.i !== j) {
    [N.board[j], N.board[s.i]] = [N.board[s.i], N.board[j]];
    N.sel = N.board[j] ? { where: 'board', i: j } : null;
    save(); return renderNight();
  }
  N.sel = N.board[j] && !(s && s.where === 'board' && s.i === j) ? { where: 'board', i: j } : null;
  renderNight();
}
function tapShop(i) {
  if (busy || N.stage !== 'shop' || !N.shop[i]) return;
  const s = N.sel;
  N.sel = s && s.where === 'shop' && s.i === i ? null : { where: 'shop', i };
  renderNight();
}

/* ---------- 焼く：左から順にうごく ---------- */
function resolveRound() {
  const F = FIELDS[N.field], ev = [], extra = Array(SLOTS).fill(0), first = Array(SLOTS).fill(0);
  let heat = F.start, pend = 1, total = 0, burnt = N.burnt;
  for (let i = 0; i < SLOTS; i++) {
    const b = N.board[i]; if (!b) continue;
    const d = cardDef(b.cid), fx = d.fx, rm = RANK_MUL[b.rank];
    const times = 1 + Math.min(3, extra[i]);
    for (let t = 0; t < times; t++) {
      if (fx.set != null) heat = fx.set;
      heat += (fx.heat || 0) + (i === 0 && fx.first ? fx.first : 0);
      if (heat < 0) heat = 0;
      if (F.cap != null && heat > F.cap) heat = F.cap;
      let base = ((fx.dmg || 0) + (fx.hd || 0) * heat + (fx.kd || 0) * burnt) * rm;
      if (d.food) for (const j of [i - 1, i + 1]) {
        const o = j >= 0 && j < SLOTS ? N.board[j] : null;
        if (o && cardDef(o.cid).fx.nb) base += cardDef(o.cid).fx.nb * RANK_MUL[o.rank];
      }
      let dmg = base;
      if (base > 0) { dmg = base * pend; pend = 1; }
      if (fx.next) pend *= fx.next;
      const z = zoneOf(heat);
      let isBurnt = false;
      if (z === 3) { isBurnt = true; burnt++; dmg = fx.proof ? dmg * 6 : 0; heat = 4; }
      else dmg *= F.mul[z];
      dmg = Math.floor(dmg);
      let mix = 0, flash = null;
      const L = i > 0 ? N.board[i - 1] : null;
      if (t === 0 && d.food && L && cardDef(L.cid).food) {
        mix = Math.floor((first[i - 1] + dmg) * (F.mix ? 1 : 0.5));
        const ld = cardDef(L.cid);
        if (ld.kind !== 'o' && d.kind !== 'o') {
          const key = recipeKey(ld.mats[0], d.mats[0]);
          if (S.recipes[key] == null) { S.recipes[key] = S.day; N.flashes.push(key); flash = key; }
        }
      }
      if (t === 0) first[i] = dmg;
      total += dmg + mix;
      if (fx.again && i + 1 < SLOTS && t === 0) extra[i + 1] += fx.again;
      ev.push({ i, again: t > 0, heat: isBurnt ? 11 : heat, after: heat, dmg, mix, flash, burnt: isBurnt });
    }
  }
  return { ev, total, burnt, start: F.start };
}
function bake() {
  if (busy || N.stage !== 'shop') return;
  if (!N.board.some(Boolean)) return toast('カードを置いてから焼こう');
  if (N.round === 1 && N.picks > 0 && N.shop.some(Boolean)) return toast(`あと${N.picks}まい えらべるよ`);
  const res = resolveRound();
  busy = true; N.sel = null; renderNight();
  setHeat(res.start);
  const q = quota(N.round, S.day);
  let k = 0, run = 0;
  const step = () => {
    if (k >= res.ev.length) return setTimeout(() => finishRound(res), STEP_MS);
    const e = res.ev[k++];
    run += e.dmg + e.mix;
    showEvent(e, run, q);
    setTimeout(step, STEP_MS);
  };
  setTimeout(step, 200);
}
function setHeat(h) {
  scn.heat = h;
  const bar = $('heatBar'), lab = $('heatLabel'); if (!bar) return;
  const z = zoneOf(h);
  [...bar.children].forEach((c, i) => { c.className = i <= Math.min(11, h) && h > 0 ? 'on z' + zoneOf(i) : ''; });
  lab.textContent = `${ZONES[z]} ${Math.min(h, 99)}`;
  lab.className = 'heat-label z' + z;
}
function floatAt(el, text, cls = '') {
  if (!el) return;
  const f = document.createElement('span');
  f.className = 'float ' + cls; f.textContent = text;
  el.appendChild(f); setTimeout(() => f.remove(), 1000);
}
function showEvent(e, run, q) {
  const slot = document.querySelector(`[data-act="slot"][data-i="${e.i}"]`);
  const card = slot && slot.querySelector('.card');
  if (card) { card.classList.remove('fire'); void card.offsetWidth; card.classList.add('fire'); }
  setHeat(e.heat);
  if (e.burnt) { scn.smoke = 1; floatAt(slot, '焦げた', 'koge'); setTimeout(() => setHeat(e.after), STEP_MS / 2); }
  if (e.dmg > 0) { floatAt(slot, (e.again ? 'もう1回 ' : '') + fmt(e.dmg)); scn.hit = 0.3; floatAt($('floats'), fmt(e.dmg), 'big'); }
  if (e.mix > 0) setTimeout(() => floatAt(slot, 'まざった +' + fmt(e.mix), 'mix'), STEP_MS / 3);
  if (e.flash) toast('ひらめき！ ' + recipeOf(e.flash).name);
  $('score').textContent = fmt(N.score + run);
  $('qfill').style.width = Math.min(100, run / q * 100) + '%';
  $('qtext').textContent = `${fmt(run)} / ノルマ ${fmt(q)}`;
}
function finishRound(res) {
  const q = quota(N.round, S.day), ok = res.total >= q;
  N.score += res.total; N.burnt = res.burnt;
  if (ok) N.met++;
  N.last = { round: N.round, total: res.total, q, ok };
  N.stage = 'roundEnd'; busy = false;
  save(); renderNight();
}
function nextRound() {
  if (N.stage !== 'roundEnd') return;
  if (N.round >= ROUNDS) return endNight();
  N.coins += INCOME + (N.last.ok ? QUOTA_BONUS : 0);
  N.round++; N.stage = 'shop'; N.sel = null;
  scn.heat = FIELDS[N.field].start;
  rollShop(); save(); renderNight();
}
function endNight() {
  const hp = nightHP(S.day), beaten = N.score >= hp, drop = MONSTERS[N.mon].drop;
  const drops = N.met + (beaten ? 2 : 0);
  S.stock[drop] = (S.stock[drop] || 0) + drops;
  Object.assign(S.today, { score: N.score, beaten, drop, drops, flashes: N.flashes.slice() });
  N.stage = 'end';
  if (beaten) scn.flee = performance.now() / 1000;
  save(); renderNight();
}

/* ---------- 画面 ---------- */
function cardHTML(cid, rank = 1) {
  const d = cardDef(cid);
  return `<div class="card k-${d.kind}"><i class="band"></i><img src="${cardIconURL(cid)}" alt="">${rank > 1 ? `<span class="rk">★${rank}</span>` : ''}<span class="nm">${esc(d.name)}</span></div>`;
}
function detailHTML() {
  const s = N.sel;
  if (N.stage === 'roundEnd') {
    const L = N.last, drop = MATS[MONSTERS[N.mon].drop].name;
    return `<h3>ラウンド${L.round}　${fmt(L.total)}</h3>
      <p>${L.ok ? `ノルマ ${fmt(L.q)} たっせい！ コイン+${QUOTA_BONUS}・${drop}を1つ手に入れた` : `ノルマ ${fmt(L.q)} にとどかなかった`}</p>
      <div class="row"><button class="big" data-act="next">${L.round >= ROUNDS ? '撃退の結果を見る' : 'つぎのラウンドへ'}</button></div>`;
  }
  if (s && s.where === 'shop' && N.shop[s.i]) {
    const d = cardDef(N.shop[s.i]), free = N.round === 1;
    return `<h3>${esc(d.name)} <small>${KIND_NAME[d.kind]}</small></h3><p>${fxText(d.fx)}</p>
      <div class="row"><button data-act="buy" data-i="${s.i}" ${!free && N.coins < d.cost ? 'disabled' : ''}>${free ? 'えらぶ' : `買う（${d.cost}コイン）`}</button></div>`;
  }
  if (s && s.where === 'board' && N.board[s.i]) {
    const b = N.board[s.i], d = cardDef(b.cid);
    return `<h3>${esc(d.name)}${b.rank > 1 ? ' ★' + b.rank : ''} <small>${KIND_NAME[d.kind]}</small></h3><p>${fxText(d.fx, b.rank)}</p>
      <div class="row"><button class="sub" data-act="sell" data-i="${s.i}">${N.round === 1 ? 'もどす' : `うる（+${2 * b.rank}コイン）`}</button><span class="hint">ほかのマスをタップで入れかえ</span></div>`;
  }
  if (N.round === 1) return `<p>山札から5まい。<b>3まい えらんで</b>調理台に置こう（あと${N.picks}まい）。となりあう食材はまざって、レシピがひらめくよ</p>`;
  return '<p>カードをタップして買おう。同じカードを買うと★が上がる。並べる順番も大事（左からうごく）</p>';
}
function heatCells() { return Array.from({ length: 12 }, () => '<i></i>').join(''); }
function renderNight() {
  N = S.night;
  const mon = MONSTERS[N.mon], F = N.field ? FIELDS[N.field] : null;
  const scr = $('screen');
  let body = '';
  if (N.stage === 'field') {
    const chef = CHEFS[S.chef];
    body = `<div class="panel"><h2>${esc(mon.name)}がやってきた！</h2><p>${esc(mon.text)}。${chef.job} ${chef.name}のフィールドを1つえらぼう</p></div>
      <div class="fields">${chef.fields.map(id => `<button class="field" data-act="field" data-id="${id}"><b>${FIELDS[id].name}</b><span>${FIELDS[id].text}</span></button>`).join('')}</div>`;
  } else if (N.stage === 'end') {
    const T = S.today, hp = nightHP(S.day), m = MATS[T.drop];
    body = `<div class="panel end ${T.beaten ? 'win' : ''}"><h2>${T.beaten ? '撃退せいこう！' : 'にげられちゃった…'}</h2>
        <p class="bignum">${fmt(T.score)}</p><p>${esc(mon.name)}のたいりょく ${fmt(hp)}</p>
        <div class="got"><img src="${matURL(T.drop)}" alt=""><span>${m.name} ×${T.drops}</span></div>
        ${T.flashes.length ? `<p>ひらめいたレシピ：${T.flashes.map(k => esc(recipeOf(k).name)).join('、')}</p>` : '<p>ひらめいたレシピはなかった（となりに食材を並べるとまざるよ）</p>'}
      </div><button class="big" data-act="toMorning">朝の仕込みへ</button>`;
  } else {
    const n = N.round === 1 ? ROUND1_SHOW : SHOP_N;
    body = `<div class="fieldchip">フィールド：${F.name}</div>
      <div class="board">${N.board.map((b, j) => `<button class="slot${N.sel && N.sel.where === 'board' && N.sel.i === j ? ' sel' : ''}" data-act="slot" data-i="${j}" aria-label="調理台${j + 1}">${b ? cardHTML(b.cid, b.rank) : '<span class="empty">空き</span>'}</button>`).join('')}</div>
      ${N.stage === 'shop' ? `<div class="shopbar"><span>${N.round === 1 ? `無料で あと${N.picks}まい` : `コイン <b>${N.coins}</b>`}</span>${N.round === 1 ? '' : `<button class="sub" data-act="reroll" ${N.coins < REROLL ? 'disabled' : ''}>入れかえ（${REROLL}）</button>`}</div>
      <div class="shop" style="--n:${n}">${N.shop.map((c, i) => c ? `<button class="shopcard${N.sel && N.sel.where === 'shop' && N.sel.i === i ? ' sel' : ''}" data-act="shop" data-i="${i}">${cardHTML(c)}<span class="cost">${N.round === 1 ? '無料' : cardDef(c).cost + 'コイン'}</span></button>` : '<span class="soldout"></span>').join('')}</div>` : ''}
      <div class="detail">${detailHTML()}</div>
      ${N.stage === 'shop' ? `<button class="big" data-act="bake" ${busy ? 'disabled' : ''}>焼く！</button>` : ''}`;
  }
  const q = quota(N.round, S.day), lastRun = N.stage === 'roundEnd' ? N.last.total : 0;
  scr.innerHTML = `<section class="night">
    <div class="scene-wrap"><canvas id="scene" width="${SW}" height="${SH}"></canvas><div id="floats"></div></div>
    <div class="heat"><span class="heat-name">火力</span><div class="heat-bar" id="heatBar">${heatCells()}</div><span class="heat-label" id="heatLabel"></span></div>
    <div class="scoreline"><span>ラウンド <b>${Math.min(N.round, ROUNDS)}</b>/${ROUNDS}</span><span class="score">スコア <b id="score">${fmt(N.score)}</b></span></div>
    <div class="quota"><div class="qbar"><i id="qfill" style="width:${Math.min(100, lastRun / q * 100)}%"></i></div><span id="qtext">${N.stage === 'roundEnd' ? fmt(lastRun) + ' / ' : ''}ノルマ ${fmt(q)}</span></div>
    ${body}</section>`;
  mountScene('night');
  setHeat(N.field ? (N.stage === 'shop' ? FIELDS[N.field].start : scn.heat) : 2);
}
