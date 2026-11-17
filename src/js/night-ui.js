/* ==== 夜のバトルの画面：舞台（ほのか・モンスター・火力の光）・調理台（アイコンのタイル6つを1行・左から順）・その下の説明・仕入れ・下のボタン列
   カードをタップすると大きな紙のカードがひらく（説明はそこで読む。テキストボックスはなし） ==== */
const ORD = ['①', '②', '③', '④', '⑤', '⑥'];

/* ---------- 演出 ---------- */
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
/* 発動：タイルがコンと跳ね、タイル行の下の説明に効果とダメージを大きく出す */
function showEvent(e, run, q) {
  document.querySelectorAll('.tslot.now').forEach(s => s.classList.remove('now'));
  const slot = document.querySelector(`.tslot[data-i="${e.i}"]`);
  const card = slot && slot.querySelector('.pc');
  if (slot) slot.classList.add('now', 'done');
  if (card) replay(card, 'kon');
  const co = $('callout');
  if (co) { co.innerHTML = calloutHTML(e, q); replay(co, 'pop'); }
  setHeat(e.heat);
  if (e.burnt) { replay($('smoke'), 'on'); heroFor('oops', 1100); setTimeout(() => setHeat(e.after), STEP_MS / 2); }
  if (e.dmg > 0) { replay($('mon'), 'hit'); replay($('chef'), 'act'); floatAt($('floats'), fmt(e.dmg), 'big'); }
  $('score').textContent = fmt(N.score + run);
  $('qfill').style.width = Math.min(100, run / q * 100) + '%';
  $('qtext').textContent = `${fmt(run)} / ノルマ ${fmt(q)}`;
}
/* タイル行の下の説明：ふだんは使い方、焼いている間は発動したカード（名前・効果・火加減・ダメージ） */
function calloutIdle() {
  if (N.stage !== 'shop') return '';
  if (N.mixing) return `<p class="co-hint">光っているカードと まぜるよ<small>★1の食材どうし → ★2のお菓子・★2どうし → ★3のスペシャル</small></p>`;
  if (!N.board.some(Boolean)) return `<p class="co-hint">下の仕入れカードをタップして 調理台にならべよう</p>`;
  return `<p class="co-hint"><span>「焼く！」で <b>左から順に</b> 発動するよ</span><small>カードをタップで 大きく見る・ならびかえ・まぜる</small></p>`;
}
function calloutHTML(e, q) {
  const cid = N.board[e.i].cid, d = cardDef(cid), F = FIELDS[N.field], z = zoneOf(e.heat);
  const chips = cardChips(d).slice(0, 2).map(c => `<span>${c}</span>`).join('');
  const zone = e.burnt ? '<span class="co-z z3">焦げ！</span>' : `<span class="co-z z${z}">${ZONES[z]}${e.dmg > 0 ? ' ×' + F.mul[z] : ''}</span>`;
  const num = e.dmg > 0 ? `<b class="co-dmg${e.dmg >= q / 3 ? ' hot' : ''}">${fmt(e.dmg)}</b>`
    : e.burnt ? '<b class="co-dmg koge">焦げた…</b>' : `<b class="co-dmg soft">火力 ${e.after}</b>`;
  return `<div class="co-ev${e.burnt ? ' burnt' : ''}" style="--x:${(e.i + .5) / SLOTS * 100}%">
    <span class="co-ic pc k-${d.kind}">${artImg(cid)}</span>
    <div class="co-main"><p class="co-name">${e.again ? '<em>もう1回</em>' : ''}${esc(d.short)}</p><p class="co-chips">${chips}${zone}</p></div>${num}</div>`;
}
/* ★3 のカットイン：ななめの金の帯に、ほのかが左から・カードが右から・名前を大きく。かかる時間（ms）を返す */
function cutIn(cid, sub) {
  const d = cardDef(cid), h = heroPick('battle'), ms = REDUCED ? 600 : 1500;
  const el = document.createElement('div');
  el.className = 'cutin'; el.style.setProperty('--cd', ms + 'ms');
  el.innerHTML = `<i class="ci-flash"></i><div class="ci-band"><i class="ci-lines"></i><div class="ci-in">
    <img class="ci-hero${h.flip ? ' flip' : ''}" src="${h.src}" alt="">
    <div class="ci-card pc k-s s3">${artImg(cid)}<i class="pc-shine"></i></div>
    <p class="ci-title"><small>${sub}</small><span>${esc(d.name)}</span></p></div></div>`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), ms);
  return ms;
}

/* ほのかの立ち絵：バトルは右向きのかまえ。表情の絵は左向きなので左右反転して右向きにする */
const HERO = { battle: ['honoka-battle', false], joy: ['honoka-joy', true], surprise: ['honoka-surprise', true], oops: ['honoka-oops', true] };
function heroPick(k) { const [n, flip] = HERO[k]; return ART[n] ? { src: ART[n], flip } : { src: ART.honoka || big(CHEF_SPR[0], 8), flip: !!ART.honoka }; }
function heroImg(k) { const h = heroPick(k); return `<img class="chef${ART.honoka ? ' hi' : ''}${h.flip ? ' flip' : ''}" id="chef" src="${h.src}" alt="炎のシェフ ほのか">`; }
let heroT = 0;
function heroFor(k, ms) {
  const el = $('chef'); if (!el) return;
  const set = kk => { const h = heroPick(kk); el.src = h.src; el.classList.toggle('flip', h.flip); };
  set(k); clearTimeout(heroT); heroT = setTimeout(() => set('battle'), ms);
}
const MON_URL = {};
const monURL = id => MON_URL[id] || (MON_URL[id] = ART['mon-' + id] || big(MON_SPR[id], 8));
const monIsArt = id => !!ART['mon-' + id];
function heatCells() { return Array.from({ length: 12 }, () => '<i></i>').join(''); }

/* ---------- タップで大きく見る画面（カード＋説明＋ボタン）とラウンドの結果 ---------- */
function viewerHTML() {
  if (N.stage === 'roundEnd') {
    const L = N.last, drop = MATS[MONSTERS[N.mon].drop].short, gain = [];
    if (L.ok) gain.push(`コイン+${QUOTA_BONUS}`, `${drop}を1つ`);
    if (L.coin) gain.push(`ちょきん箱 コイン+${L.coin}`);
    return `<div class="viewer soft"><div class="vbox result ${L.ok ? 'ok' : ''}" data-act="noop">
      <p class="r-round">ラウンド ${L.round}</p><p class="r-num">${fmt(L.total)}</p>
      <p class="r-msg">${L.ok ? 'ノルマ たっせい！' : 'ノルマに とどかなかった…'}</p>${gain.length ? `<p class="r-gain">${gain.join('　')}</p>` : ''}
      <button class="big" data-act="next">${L.round >= ROUNDS ? '撃退の結果へ' : 'つぎのラウンドへ'}</button></div></div>`;
  }
  const s = N.sel;
  if (!s || N.mixing || N.stage !== 'shop') return '';
  if (s.where === 'shop') {
    const cid = N.shop[s.i]; if (!cid) return '';
    const d = cardDef(cid), free = N.round === 1;
    return `<div class="viewer" data-act="close"><div class="vbox" data-act="noop"><button class="vclose" data-act="close" aria-label="とじる">×</button>${cardBig(cid)}${cardInfo(cid)}
      <div class="vbtns"><button class="pill sub" data-act="close">とじる</button><button class="pill go2" data-act="buy" data-i="${s.i}" ${!free && N.coins < d.cost ? 'disabled' : ''}>${free ? 'えらぶ' : `買う <small>コイン${d.cost}</small>`}</button></div></div></div>`;
  }
  const b = N.board[s.i]; if (!b) return '';
  const d = cardDef(b.cid), canM = d.food && d.star < 3;
  return `<div class="viewer" data-act="close"><div class="vbox" data-act="noop"><button class="vclose" data-act="close" aria-label="とじる">×</button>${cardBig(b.cid)}${cardInfo(b.cid)}
    <div class="vbtns">
      <button class="pill sub sq" data-act="move" data-d="-1" ${s.i === 0 ? 'disabled' : ''} aria-label="ひとつ前へ">←</button>
      <button class="pill sub" data-act="sell">${N.round === 1 && d.star === 1 ? 'もどす' : `うる <small>+${SELL[d.star]}</small>`}</button>
      ${canM ? `<button class="pill go2" data-act="mix" ${partners().length ? '' : 'disabled'}>まぜる</button>` : ''}
      <button class="pill sub sq" data-act="move" data-d="1" ${s.i === SLOTS - 1 ? 'disabled' : ''} aria-label="ひとつ後へ">→</button>
    </div><p class="vhint">${ORD[s.i]}番めにうごく・まわりをタップでとじる</p></div></div>`;
}
/* 手札（仕入れ）：残っているカードだけを扇形に並べる */
function handHTML() {
  const left = N.shop.map((c, i) => [c, i]).filter(([c]) => c);
  return `<div class="hand" style="--n:${left.length}"><span class="hand-lbl">仕入れ</span>${left.map(([c, i], k) => `<button class="handcard${N.sel && N.sel.where === 'shop' && N.sel.i === i ? ' sel' : ''}" style="--k:${k}" data-act="card" data-w="shop" data-i="${i}">${cardMini(c, { cost: N.round === 1 ? '無料' : cardDef(c).cost })}</button>`).join('')}</div>`;
}
function barHTML() {
  if (N.mixing) return `<span class="bar-hint">光っているカードをタップすると まぜるよ</span><button class="pill sub" data-act="cancelMix">やめる</button>`;
  return `<span class="orb" title="${N.round === 1 ? '無料でえらべる数' : 'コイン'}"><i>${N.round === 1 ? '無料' : 'コイン'}</i><b>${N.round === 1 ? N.picks : N.coins}</b></span>
    ${N.round === 1 ? '<span class="bar-hint">5まいから3まい えらぼう</span>' : `<button class="pill sub" data-act="reroll" ${N.coins < REROLL ? 'disabled' : ''}>入れかえ <small>${REROLL}</small></button>`}
    <button class="bake" data-act="bake" ${busy || N.stage !== 'shop' ? 'disabled' : ''}>焼く！</button>`;
}

/* ---------- 夜の画面 ---------- */
function renderNight() {
  N = S.night;
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
    body = `<div class="tiles">${N.board.map((c, i) => {
        const on = N.sel && N.sel.where === 'board' && N.sel.i === i;
        return `<button class="tslot${on ? ' sel' : ''}${mx.includes(i) ? ' can' : ''}" data-act="card" data-w="board" data-i="${i}" aria-label="調理台${i + 1}"><i class="ord">${i + 1}</i>${c ? cardTile(c.cid, { born: c.born }) : ''}</button>`;
      }).join('')}</div>
      <div class="callout" id="callout">${calloutIdle()}</div>
      ${N.stage === 'shop' ? handHTML() : '<div class="hand"></div>'}
      <div class="bar">${barHTML()}</div>
      ${viewerHTML()}`;
  }
  const q = quota(Math.min(N.round, ROUNDS), S.day), lastRun = N.stage === 'roundEnd' ? N.last.total : 0;
  $('screen').innerHTML = `<section class="night fit">
    <div class="stage" id="stage" data-z="0"><i class="st-lamp"></i><i class="st-win"></i><i class="st-shelf"></i><i class="st-floor"></i><i class="glow"></i>
      ${heroImg(N.stage === 'end' ? (S.today.beaten ? 'joy' : 'surprise') : 'battle')}
      <img class="mon${monIsArt(mon.id) ? ' hi' : ''}${N.stage === 'end' && S.today.beaten ? ' flee' : ''}" id="mon" src="${monURL(mon.id)}" alt="${esc(mon.name)}">
      <i class="smoke" id="smoke"></i><div id="floats"></div>
      <div class="ov-top"><span>ラウンド <b>${Math.min(N.round, ROUNDS)}</b>/${ROUNDS}${F ? `　<em>${F.name}</em>` : ''}</span><span class="score">スコア <b id="score">${fmt(N.score)}</b></span></div>
      <div class="ov-heat"><span class="heat-label" id="heatLabel"></span><div class="heat-bar" id="heatBar">${heatCells()}</div></div></div>
    <div class="quota"><div class="qbar"><i id="qfill" style="width:${Math.min(100, lastRun / q * 100)}%"></i></div><span id="qtext">${N.stage === 'roundEnd' ? fmt(lastRun) + ' / ' : ''}ノルマ ${fmt(q)}</span></div>
    ${body}</section>`;
  setHeat(N.field ? (N.stage === 'shop' ? FIELDS[N.field].start : scn.heat) : 2);
  for (const c of N.board) if (c) delete c.born;
}
