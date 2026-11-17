/* ==== 昼：棚1つでお菓子を売る（持ち主：昼のチャット【okashi-hiru】。昼に来るのは flow.js の goDay → startDay・まとめへは goResult。数字は src/data/hiru.js） ====
   お客さんはすきな味が2つ。棚にすきな味のお菓子があれば2倍の値段で買ってハート（3つで常連さん）
   なければ6わりの人がほかのお菓子を買う */
let dayTimer = 0;

/* 昼のはじめ（flow.js の goDay から呼ぶ）：S.dayRun を用意する */
function startDay() {
  S.dayRun = { i: 0, total: CUST_BASE + Math.min(4, S.day - 1), log: [], done: false };
  scn.cust = []; scn.speed = 1;
}
/* 昼をおえる（flow.js の goResult から呼ぶ） */
function stopDay() { clearTimeout(dayTimer); }
function addLog(text, cls = '') {
  S.dayRun.log.push([text, cls]);
  const ol = $('dayLog');
  if (ol) { const li = document.createElement('li'); li.className = cls; li.textContent = text; ol.prepend(li); }
}
function serve(c) {
  const items = S.shelf.filter(s => s.n > 0), T = S.today;
  T.visitors++;
  if (!items.length) { addLog(`${c.name}：売り切れで帰っちゃった`, 'no'); return 'none'; }
  const liked = items.filter(s => recipeOf(s.key).tastes.some(t => likesOf(c).includes(t)));
  let s = null, p = 0, love = false;
  if (liked.length) { s = liked.sort((a, b) => recipeOf(b.key).price - recipeOf(a.key).price)[0]; p = recipeOf(s.key).price * LIKE_MUL; love = true; }
  else if (Math.random() < OTHER_BUY) { s = pick(items); p = recipeOf(s.key).price; }
  if (!s) { addLog(`${c.name}：すきな味（${likesOf(c).join('・')}）がなかった`, 'no'); return 'none'; }
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
/* 昼の画面のボタン（data-act）。main.js の ACTS に入る */
const DAY_ACTS = {
  fast: () => toggleFast(),
};
