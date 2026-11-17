/* ==== 昼：棚1つでお菓子を売る → 1日のまとめ ====
   お客さんはすきな味が2つ。棚にすきな味のお菓子があれば2倍の値段で買ってハート（3つで常連さん）
   なければ6わりの人がほかのお菓子を買う */
const HEART = '\u2665\uFE0E';   // 絵文字にならないように文字の形で
const CUST_BASE = 6, LIKE_MUL = 2, OTHER_BUY = 0.6;
let dayTimer = 0;

function goDay() {
  S.phase = 'day';
  S.dayRun = { i: 0, total: CUST_BASE + Math.min(4, S.day - 1), log: [], done: false };
  scn.cust = []; scn.speed = 1;
  save(); render();
}
function addLog(text, cls = '') {
  S.dayRun.log.push([text, cls]);
  const ol = $('dayLog');
  if (ol) { const li = document.createElement('li'); li.className = cls; li.textContent = text; ol.prepend(li); }
}
function serve(c) {
  const items = S.shelf.filter(s => s.n > 0), T = S.today;
  T.visitors++;
  if (!items.length) { addLog(`${c.name}：売り切れで帰っちゃった`, 'no'); return 'none'; }
  const liked = items.filter(s => recipeOf(s.key).tastes.some(t => c.likes.includes(t)));
  let s = null, p = 0, love = false;
  if (liked.length) { s = liked.sort((a, b) => recipeOf(b.key).price - recipeOf(a.key).price)[0]; p = recipeOf(s.key).price * LIKE_MUL; love = true; }
  else if (Math.random() < OTHER_BUY) { s = pick(items); p = recipeOf(s.key).price; }
  if (!s) { addLog(`${c.name}：すきな味（${c.likes.join('・')}）がなかった`, 'no'); return 'none'; }
  s.n--; S.shelf = S.shelf.filter(x => x.n > 0);
  S.money += p; T.sales += p; T.served++;
  const name = recipeOf(s.key).name;
  if (love) {
    S.hearts[c.id] = (S.hearts[c.id] || 0) + 1;
    addLog(`${c.name}が${name}を気に入って買った ${p}円 ${HEART}`, 'love');
    if (S.hearts[c.id] === HEARTS_REGULAR && !S.regulars.includes(c.id)) {
      S.regulars.push(c.id); T.newRegulars.push(c.id);
      setTimeout(() => toast(`${c.name}が常連さんになった！`), 300);
    }
  } else addLog(`${c.name}が${name}を買った ${p}円`);
  return love ? 'heart' : s.key;
}
function runCustomers() {
  clearTimeout(dayTimer);
  const R = S.dayRun; if (!R || R.done || S.phase !== 'day') return;
  if (R.i >= R.total) { R.done = true; save(); return renderDay(); }
  const c = pick(CUSTOMERS), sp = () => scn.speed;
  const who = { id: c.id, x: 100, tx: 72 - rand(10), bub: null };
  scn.cust.push(who);
  dayTimer = setTimeout(() => {
    const res = serve(c);
    who.bub = res;
    R.i++; save(); updateDayInfo();
    dayTimer = setTimeout(() => {
      who.bub = null; who.tx = 104; who.gone = true;
      dayTimer = setTimeout(runCustomers, 350 / sp());
    }, 900 / sp());
  }, 1100 / sp());
}
function updateDayInfo() {
  const R = S.dayRun, el = $('dayInfo'); if (!el) return;
  el.innerHTML = `お客さん <b>${R.i}</b>/${R.total}　売上 <b>${fmt(S.today.sales)}</b>円`;
  const sh = $('shelfList');
  if (sh) sh.innerHTML = shelfHTML();
  const m = $('money'); if (m) m.textContent = fmt(S.money) + '円';
}
function shelfHTML() {
  return S.shelf.length ? S.shelf.map(s => `<span class="item"><img src="${candyURL(s.key)}" alt="">${esc(recipeOf(s.key).name)} ×${s.n}</span>`).join('') : '<span class="muted">棚はからっぽ</span>';
}
function toggleFast() {
  scn.speed = scn.speed === 1 ? 3 : 1;
  const b = document.querySelector('[data-act="fast"]'); if (b) b.textContent = scn.speed === 1 ? 'はやおくり' : 'ふつうの速さ';
}
function renderDay() {
  const R = S.dayRun;
  $('screen').innerHTML = `<section class="day fit">
    <div class="scene-wrap"><canvas id="scene" width="${SW}" height="${SH}"></canvas></div>
    <div class="panel tight"><h2>お昼の販売</h2><p id="dayInfo"></p></div>
    <div class="shelf"><span class="lbl">棚</span><div id="shelfList"></div></div>
    <ol class="log" id="dayLog">${R.log.slice().reverse().map(([t, c]) => `<li class="${c}">${esc(t)}</li>`).join('')}</ol>
    ${R.done ? '<button class="big" data-act="toResult">1日のまとめへ</button>' : `<div class="row"><button class="sub" data-act="fast">${scn.speed === 1 ? 'はやおくり' : 'ふつうの速さ'}</button></div>`}
  </section>`;
  mountScene('day'); updateDayInfo();
  if (!R.done && !scn.cust.length) runCustomers();
}

/* ---------- 1日のまとめ ---------- */
function goResult() { clearTimeout(dayTimer); S.phase = 'result'; save(); render(); }
function nextDay() { S.day++; startNight(); }
function renderResult() {
  const T = S.today, mon = MONSTERS[(T.day - 1) % MONSTERS.length];
  const hearts = CUSTOMERS.map(c => `<li><span>${c.name}</span><span class="hearts">${HEART.repeat(Math.min(HEARTS_REGULAR, S.hearts[c.id] || 0))}<i>${HEART.repeat(Math.max(0, HEARTS_REGULAR - (S.hearts[c.id] || 0)))}</i></span>${S.regulars.includes(c.id) ? '<em>常連さん</em>' : ''}</li>`).join('');
  $('screen').innerHTML = `<section class="result">
    <div class="panel"><h2>${T.day}日目のまとめ</h2>
      <dl>
        <dt>夜</dt><dd>${esc(mon.name)}　スコア ${fmt(T.score)}　${T.beaten ? '撃退！' : 'にげられた'}</dd>
        <dt>材料</dt><dd>${T.drop ? `${MATS[T.drop].name} ×${T.drops}` : 'なし'}</dd>
        <dt>ひらめき</dt><dd>${T.flashes.length ? T.flashes.map(k => esc(recipeOf(k).name)).join('、') : 'なし'}</dd>
        <dt>仕込み</dt><dd>${T.made.length ? T.made.map(k => esc(recipeOf(k).name)).join('、') : 'なし'}</dd>
        <dt>お昼</dt><dd>売上 ${fmt(T.sales)}円（${T.served}/${T.visitors}人が買った）</dd>
        <dt>お金</dt><dd class="gold">${fmt(S.money)}円</dd>
      </dl></div>
    <div class="panel"><h2>お客さんのハート</h2><ul class="heartlist">${hearts}</ul>
      <p class="muted">常連さんは、これから仲間になって夜にいっしょに戦えるようになる予定</p></div>
    <button class="big" data-act="nextDay">${S.day + 1}日目の夜へ</button>
  </section>`;
}
