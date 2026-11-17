/* ==== 夜のバトルの画面：舞台（ほのか・モンスター・鉄板の火力の光）・調理台（左にフィールドの「場」＋アイコンのタイル5つを1行・左から順）・仕入れ・下のボタン列
   生地のタイルには焼き加減のメーター（9段階・9でサイコー）
   バトル中は、タイル行のすぐ下に発動したカードの説明を出す（手札の上にかぶせる）
   カードをタップすると大きな紙のカードがひらく（説明はそこで読む。テキストボックスはなし） ==== */
const ORD = ['①', '②', '③', '④', '⑤'];

/* ---------- 演出 ---------- */
/* 鉄板の火力（1〜4）。フィールドがないと焼けないので、光らせない */
function setHeat(h) {
  scn.heat = h;
  const bar = $('heatBar'), lab = $('heatLabel'); if (!bar) return;
  [...bar.children].forEach((c, i) => { c.className = i < h ? 'on h' + (i + 1) : ''; });
  lab.textContent = N.field ? HEAT[h] : `${HEAT[h]}（場なし）`;
  lab.className = 'heat-label h' + (N.field ? h : 0);
  const st = $('stage'); if (st) st.dataset.z = N.field ? h : 0;
}
/* タイル1つを描きなおす（焼き加減・焦げ） */
function updTile(i, cid, cook) {
  const slot = document.querySelector(`.tslot[data-w="board"][data-i="${i}"]`); if (!slot) return null;
  slot.innerHTML = `<i class="ord">${i + 1}</i>${cardTile(cid, { cook })}`;
  return slot.querySelector('.pc');
}
function burntFx(slot) { replay($('smoke'), 'on'); heroFor('oops', 1100); if (slot) floatAt(slot, '焦げた', 'koge'); }
function floatAt(el, text, cls = '') {
  if (!el) return;
  const f = document.createElement('span');
  f.className = 'float ' + cls; f.textContent = text;
  el.appendChild(f); setTimeout(() => f.remove(), 1000);
}
function replay(el, cls) { if (!el) return; el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); }
/* バトルの演出：はじめの「焼き」は生地のタイルがいっせいにジュッ。発動はタイルがコンと跳ね、タイル行の下の説明に効果とダメージを大きく出す */
function showEvent(e, run, q) {
  document.querySelectorAll('.tslot.now').forEach(s => s.classList.remove('now'));
  const co = $('callout');
  if (co) { co.innerHTML = e.type === 'bake' ? bakeCallout(e) : calloutHTML(e, q); replay(co, 'pop'); }
  if (e.type === 'bake') {
    replay($('stage'), 'sizzle');
    for (const x of e.list) {
      const card = updTile(x.i, x.cid, x.burnt ? undefined : x.to);
      if (card) replay(card, 'sear');
      if (x.burnt) burntFx(card && card.parentNode);
    }
    return;
  }
  const slot = document.querySelector(`.tslot[data-w="board"][data-i="${e.i}"]`);
  const card = slot && slot.querySelector('.pc');
  if (slot) slot.classList.add('now', 'done');
  if (card) replay(card, 'kon');
  if (e.heat) setHeat(e.heat[1]);
  if (e.sear) {
    const c2 = updTile(e.sear.i, e.sear.cid, e.sear.burnt ? undefined : e.sear.to);
    if (c2) replay(c2, 'sear');
    if (e.sear.burnt) burntFx(c2 && c2.parentNode);
  }
  if (e.dmg > 0) { replay($('mon'), 'hit'); replay($('chef'), 'act'); floatAt($('floats'), fmt(e.dmg), 'dmg'); }
  $('score').textContent = fmt(N.score + run);
  $('qfill').style.width = Math.min(100, run / q * 100) + '%';
  $('qtext').textContent = `${fmt(run)} / ノルマ ${fmt(q)}`;
}
/* バトルの間だけ、タイル行のすぐ下（手札の上にかぶせる）に出す説明。--x は指す場所（「場」が0） */
const tileX = j => `--x:${(j + .5) / (SLOTS + 1) * 100}%`;
function bakeCallout(e) {
  const F = FIELDS[N.field], nb = e.list.filter(x => x.burnt).length, best = e.list.filter(x => !x.burnt && x.to >= COOK_MAX).length;
  return `<div class="co-ev co-bake" style="${tileX(0)}"><span class="co-ic pc k-b">${artImg('b:' + N.field)}</span>
    <div class="co-main"><p class="co-name">${esc(F.name)}で焼く！</p><p class="co-chips"><span class="co-z h${e.heat}">${HEAT[e.heat]} +${e.heat}</span>${best ? `<span class="co-z best">サイコー×${best}</span>` : ''}${nb ? `<span class="co-z koge">焦げ×${nb}</span>` : ''}</p></div><b class="co-dmg soft">ジュッ</b></div>`;
}
function calloutHTML(e, q) {
  const d = cardDef(e.cid), tags = [];
  if (d.dough) tags.push(`<span class="co-z c${cookStage(e.cook)}">${cookName(e.cook || 0)} ×${fmtMul(cookMul(e.cook || 0))}</span>`);
  if (e.lead) tags.push('<span class="co-z">先頭！</span>');
  if (e.sai) tags.push(`<span class="co-z best">サイコー${e.sai}枚 ×${fmtMul(Math.pow(d.fx.sai + 0.5 * (d.star - 1), e.sai))}</span>`);
  if (e.fin) tags.push('<span class="co-z">しめくくり！</span>');
  if (e.rally) tags.push('<span class="co-z">攻撃ぜんぶ+</span>');
  if (e.heat) tags.push(`<span class="co-z h${e.heat[1]}">${HEAT[e.heat[0]]}→${HEAT[e.heat[1]]}</span>`);
  if (e.sear) tags.push(e.sear.burnt ? '<span class="co-z koge">右の生地が焦げた</span>' : `<span class="co-z c${cookStage(e.sear.to)}">右の生地 ${cookName(e.sear.to)}</span>`);
  if (e.call) tags.push('<span class="co-z">つぎの仕入れにフィールド</span>');
  const chips = tags.concat(cardChips(d).map(c => `<span>${c}</span>`)).slice(0, 3).join('');
  const num = e.dmg > 0 ? `<b class="co-dmg${e.dmg >= q / 3 ? ' hot' : ''}">${fmt(e.dmg)}</b>`
    : e.heat ? `<b class="co-dmg soft">${HEAT[e.heat[1]]}</b>` : e.sear ? '<b class="co-dmg soft">ジュッ</b>' : '';
  return `<div class="co-ev" style="${tileX(e.i + 1)}">
    <span class="co-ic pc k-${d.kind}">${artImg(e.cid)}</span>
    <div class="co-main"><p class="co-name">${e.again ? '<em>もう1回</em>' : ''}${esc(d.short)}</p><p class="co-chips">${chips}</p></div>${num}</div>`;
}
const cookStage = c => (c || 0) >= COOK_MAX ? 3 : (c || 0) >= 6 ? 2 : (c || 0) >= 3 ? 1 : 0;
const fmtMul = v => Math.round(v * 10) / 10;
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
function heatCells() { return Array.from({ length: HEAT_MAX }, () => '<i></i>').join(''); }

/* ---------- タップで大きく見る画面（カード＋説明＋ボタン）とラウンドの結果 ---------- */
function viewerHTML() {
  if (N.stage === 'roundEnd') {
    const L = N.last, drop = MATS[MONSTERS[N.mon].drop].short, gain = [];
    if (L.ok) gain.push(`コイン+${QUOTA_BONUS}`, `${drop}を1つ`);
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
  if (s.where === 'field') {
    if (!N.field) return '';
    const cid = 'b:' + N.field;
    return `<div class="viewer" data-act="close"><div class="vbox" data-act="noop"><button class="vclose" data-act="close" aria-label="とじる">×</button>${cardBig(cid)}${cardInfo(cid)}
      <div class="vbtns"><button class="pill sub" data-act="close">とじる</button><button class="pill sub" data-act="sell">${N.round === 1 ? 'もどす' : `うる <small>+${SELL[1]}</small>`}</button></div>
      <p class="vhint">いつでも効いている・あたらしいフィールドを買うと入れかわる</p></div></div>`;
  }
  const b = N.board[s.i]; if (!b) return '';
  const d = cardDef(b.cid), canM = d.star < 3;
  return `<div class="viewer" data-act="close"><div class="vbox" data-act="noop"><button class="vclose" data-act="close" aria-label="とじる">×</button>${cardBig(b.cid, b.cook)}${cardInfo(b.cid, b.cook)}
    <div class="vbtns">
      <button class="pill sub sq" data-act="move" data-d="-1" ${s.i === 0 ? 'disabled' : ''} aria-label="ひとつ前へ">←</button>
      <button class="pill sub" data-act="sell">${N.round === 1 && d.star === 1 && d.cat !== 'burnt' ? 'もどす' : `うる <small>+${SELL[d.star]}</small>`}</button>
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
    <button class="bake" data-act="bake" ${busy || N.stage !== 'shop' ? 'disabled' : ''}>バトル！</button>`;
}

/* ---------- 夜の画面 ---------- */
function renderNight() {
  if (!nightOk(S.night)) return startNight();   // 前の形のセーブは、その夜をはじめから
  N = S.night;
  const mon = MONSTERS[N.mon], F = N.field ? FIELDS[N.field] : null;
  let body = '';
  if (N.stage === 'end') {
    const T = S.today, hp = nightHP(S.day), m = MATS[T.drop];
    body = `<div class="panel end ${T.beaten ? 'win' : ''}"><h2>${T.beaten ? '撃退せいこう！' : 'にげられちゃった…'}</h2>
        <p class="bignum">${fmt(T.score)}</p><p>${esc(mon.name)}のたいりょく ${fmt(hp)}</p>
        <div class="got"><img src="${matURL(T.drop)}" alt=""><span>${m.name} ×${T.drops}</span></div>
        <p>${T.flashes.length ? 'ひらめいたレシピ：' + T.flashes.map(k => esc(recipeOf(k).name)).join('、') : 'ひらめいたレシピはなかった（生地や素材の★1どうしをまぜるとひらめくよ）'}</p>
      </div><button class="big" data-act="toMorning">朝の仕込みへ</button>`;
  } else {
    const mx = N.mixing ? partners() : [];
    const fOn = N.sel && N.sel.where === 'field';
    body = `<div class="tiles"><button class="tslot fslot${fOn ? ' sel' : ''}" data-act="card" data-w="field" data-i="0" aria-label="フィールド"><i class="ord">場</i>${N.field ? cardTile('b:' + N.field) : ''}</button>${N.board.map((c, i) => {
        const on = N.sel && N.sel.where === 'board' && N.sel.i === i;
        return `<button class="tslot${on ? ' sel' : ''}${mx.includes(i) ? ' can' : ''}" data-act="card" data-w="board" data-i="${i}" aria-label="調理台${i + 1}"><i class="ord">${i + 1}</i>${c ? cardTile(c.cid, { born: c.born, cook: c.cook }) : ''}</button>`;
      }).join('')}</div>
      <div class="handwrap"><div class="callout" id="callout"></div>${N.stage === 'shop' ? handHTML() : '<div class="hand"></div>'}</div>
      <div class="bar">${barHTML()}</div>
      ${viewerHTML()}`;
  }
  const q = quota(Math.min(N.round, ROUNDS), S.day), lastRun = N.stage === 'roundEnd' ? N.last.total : 0;
  $('screen').innerHTML = `<section class="night fit${busy ? ' busy' : ''}">
    <div class="stage" id="stage" data-z="0"><i class="st-lamp"></i><i class="st-win"></i><i class="st-shelf"></i><i class="st-floor"></i><i class="glow"></i>
      ${heroImg(N.stage === 'end' ? (S.today.beaten ? 'joy' : 'surprise') : 'battle')}
      <img class="mon${monIsArt(mon.id) ? ' hi' : ''}${N.stage === 'end' && S.today.beaten ? ' flee' : ''}" id="mon" src="${monURL(mon.id)}" alt="${esc(mon.name)}">
      <i class="smoke" id="smoke"></i><div id="floats"></div>
      <div class="ov-top"><span>ラウンド <b>${Math.min(N.round, ROUNDS)}</b>/${ROUNDS}${F ? `　<em>${F.name}</em>` : ''}</span><span class="score">スコア <b id="score">${fmt(N.score)}</b></span></div>
      <div class="ov-heat"><span class="heat-label" id="heatLabel"></span><div class="heat-bar" id="heatBar">${heatCells()}</div></div></div>
    <div class="quota"><div class="qbar"><i id="qfill" style="width:${Math.min(100, lastRun / q * 100)}%"></i></div><span id="qtext">${N.stage === 'roundEnd' ? fmt(lastRun) + ' / ' : ''}ノルマ ${fmt(q)}</span></div>
    ${body}</section>`;
  setHeat(N.heat);
  for (const c of N.board) if (c) delete c.born;
}
