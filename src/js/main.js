/* ==== はじまり：画面の切りかえ・タイトル・タップのうけつけ ==== */
const PHASE_NAME = { prologue: '', morning: '朝', day: '昼', night: '夜', result: 'まとめ' };
let resetArm = false;

function renderTop() {
  $('dayLabel').textContent = S.phase === 'title' ? '' : `${S.day}日目　${PHASE_NAME[S.phase] || ''}`;
  $('money').textContent = S.phase === 'title' ? '' : fmt(S.money) + '円';
}
function renderTitle() {
  const saved = load();
  const chef = ART.honoka || big(CHEF_SPR[0], 5), mon = ART['mon-slime'] || big(MON_SPR.slime, 3);
  const bg = ART['bg-night'];
  $('screen').innerHTML = `<section class="title${bg ? ' hasbg' : ''}"${bg ? ` style="--bgimg:url('${bg}')"` : ''}>
    <div class="t-logo">${logoHTML()}</div>
    <div class="hero"><img src="${chef}" alt="炎のシェフ ほのか"><img src="${mon}" alt="ぷるぷるスライム"></div>
    ${saved && saved.phase !== 'title' ? `<button class="big" data-act="continue">つづきから（${saved.day}日目）</button>
      <button class="sub" data-act="reset">${resetArm ? 'ほんとうに はじめから？（もう一度タップ）' : 'はじめから'}</button>` : '<button class="big" data-act="start">はじめる</button>'}
  </section>`;
}
function render() {
  renderTop();
  if (S.phase === 'night') renderNight();
  else if (S.phase === 'prologue') renderPrologue();
  else if (S.phase === 'morning') renderMorning();
  else if (S.phase === 'day') renderDay();
  else if (S.phase === 'result') renderResult();
  else renderTitle();
  $('screen').scrollTop = 0;
}

const ACTS = {
  start: () => { S = newState(); goPrologue(); },
  continue: () => { const s = load(); if (s) { S = s; resume(); render(); } },
  reset: () => { if (!resetArm) { resetArm = true; return renderTitle(); } resetArm = false; S = newState(); goPrologue(); },
  card: el => tapCard(el.dataset.w, +el.dataset.i),
  close: () => closeView(),
  kw: el => showKw(el),
  spd: el => toggleSpd(el),
  noop: () => {},
  buy: el => buy(+el.dataset.i),
  sell: () => sell(),
  reroll: () => reroll(),
  bake: () => omotenashi(),
  next: () => nextRound(),
  openShop: () => goDay(),
  toEvening: () => goEvening(),
  toResult: () => (S.phase === 'day' ? goEvening() : goResult()),   // 昼の「閉店」（前の昼の画面のボタン名のまま）は夕方へ
  nextDay: () => nextDay(),
  ...MORNING_ACTS, ...DAY_ACTS,   // 朝と昼の画面のボタン（morning.js・day.js＝昼のチャット）
  toCard: el => MORNING_ACTS.toShelf(el),   // 11/18 朝のお菓子はカードにしない（昼のチャットが朝の画面を作りなおすまで、棚に入れる）
};
/* 前のセーブのつづき：とちゅうの画面の用意がないときは作る */
function resume() {
  if (S.phase === 'night' && S.night && S.night.stage === 'roundEnd') busy = false;
  if (S.phase === 'morning' && !S.morning) startMorning();
  if (S.phase === 'day' && !S.dayRun) startDay();
}
function boot(data) {
  if (!boot.art) { boot.art = 1; return artBlobs(() => boot(data)); }   // 先に絵を blob URL に（core.js）
  const s = data && data.S ? sanitize(data.S) : null;
  S = s || newState();
  if (!s) S.phase = 'title'; else resume();
  $('screen').addEventListener('click', e => {
    if (Date.now() - dragEnd < 350) return;   // ドラッグのあとのクリックは無視
    const el = e.target.closest('[data-act]');
    if (!el || el.dataset.act !== 'kw') hideKw();   // ことばの説明は、ほかの所をタップでとじる
    if (!el || el.disabled) return;
    const f = ACTS[el.dataset.act]; if (!f) return;
    if (el.tagName === 'BUTTON' && el.dataset.act !== 'noop') pressFx(el);   // 押したときの光（ぜんぶのせシップの形）
    const ph = S.phase;
    f(el);
    if (S.phase !== ph) wipe();   // 夜・朝・昼・まとめの切りかえは、タイルの幕でさっと
    renderTop();
  });
  dragInit($('screen'));
  render();
}
/* 押したときの光（ぜんぶのせシップの fxBuy の形）：ボタンの形の白い輪が広がって消える。画面を描きなおしても残るよう body に出す */
function pressFx(el) {
  if (REDUCED || !el.matches('.big,.bake,.pill,.go2,.sub,.vclose')) return;
  const r = el.getBoundingClientRect(), fx = document.createElement('i');
  fx.className = 'pressfx';
  Object.assign(fx.style, { left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px', borderRadius: getComputedStyle(el).borderRadius });
  document.body.appendChild(fx); setTimeout(() => fx.remove(), 500);
}
/* 画面の切りかえ（ぜんぶのせシップの pixWipe を、お菓子屋さんの形に）：ギンガムのタイルが左上から右下へ順に小さくなって、新しい画面が見える */
let wipeRaf = 0;
function wipe(ms = 620) {
  if (REDUCED) return;
  let cv = document.getElementById('wipe');
  if (!cv) { cv = document.createElement('canvas'); cv.id = 'wipe'; cv.setAttribute('aria-hidden', 'true'); document.body.appendChild(cv); }
  const dpr = Math.min(2, devicePixelRatio || 1), W = innerWidth, H = innerHeight, B = 36;
  cv.width = W * dpr; cv.height = H * dpr; cv.style.display = 'block';
  const g = cv.getContext('2d'), cols = Math.ceil(W / B), rows = Math.ceil(H / B), span = Math.max(1, cols + rows - 2), t0 = performance.now();
  cancelAnimationFrame(wipeRaf);
  const step = () => {
    const t = (performance.now() - t0) / ms;
    g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H);
    if (t >= 1) { cv.style.display = 'none'; return; }
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const p = Math.min(1, Math.max(0, (t - (c + r) / span * .55) / .45));
      if (p >= 1) continue;
      const sz = (1 - p) * (B + 1), o = (B - sz) / 2;
      g.fillStyle = p > .06 && p < .4 ? '#f4c24e' : (r + c) % 2 ? '#4a2618' : r % 2 ? '#e8607a' : '#f6e4c8';   // 小さくなりはじめは金に光る
      g.beginPath(); if (g.roundRect) g.roundRect(c * B + o, r * B + o, sz, sz, sz * .24); else g.rect(c * B + o, r * B + o, sz, sz); g.fill();
    }
    wipeRaf = requestAnimationFrame(step);
  };
  step();
}
/* アーティファクトを開いたまま更新されたとき、遊んでいる所から続ける */
try { if (window.claude && window.claude.hot) window.claude.hot.snapshot(() => ({ S })); } catch (e) { /* なくてよい */ }
const H = window.claude && window.claude.hot;
if (H && H.ready) H.ready(boot); else boot(H && H.data ? H.data : {});
