/* ==== はじまり：画面の切りかえ・タイトル・タップのうけつけ ==== */
const PHASE_NAME = { prologue: '', morning: '朝', day: '昼', night: '夜', result: 'まとめ' };
let resetArm = false;

function renderTop() {
  $('dayLabel').textContent = S.phase === 'title' ? '' : `${S.day}日目　${PHASE_NAME[S.phase] || ''}`;
  $('money').textContent = S.phase === 'title' ? '' : fmt(S.money) + '円';
}
/* タイトルで見せる せってい：セーブがあればその opt・なければ まだ遊んでいない人のキー（core.js の save） */
function titleOpt() {
  const d = newState().opt, sv = load(); if (sv && sv.opt) return { ...d, ...sv.opt };
  try { return { ...d, ...(JSON.parse(localStorage.getItem(KEY + '-opt') || 'null') || {}) }; } catch (e) { return d; }
}
function renderTitle() {
  const saved = load();
  $('screen').innerHTML = lgTitleHTML(saved, resetArm) + '<button class="pill opt-btn" data-act="opt">せってい</button>';   // せっていはタイトルの右上（11/19 しょーくん「タイトルとまとめの画面だけ」）
}
/* ==== せってい（11/19 H-034）：BGM と効果音（声・ジングルもふくむ）を べつべつに オン／オフ・クレジット。タイトルとまとめの画面の「せってい」から
   画面は描きなおさず（タイトルの動きが はじめからにならないように）、上に窓を重ねて、その中だけ書きかえる ==== */
const OPT_ROWS = [['bgm', 'BGM'], ['se', '効果音・声']];
function optHTML() {
  const row = ([k, name]) => `<div class="opt-row"><span class="opt-nm">${name}</span><span class="opt-tabs">${[[1, 'オン'], [0, 'オフ']].map(([v, t]) => `<button class="tab${!!v === (S.opt[k] !== false) ? ' on' : ''}" data-act="optSet" data-k="${k}" data-v="${v}">${t}</button>`).join('')}</span></div>`;
  /* はじめから（11/23 しょーくん「タイトルの最初からを設定の中に・連打して誤タップする人もいるかも」→ タイトルのせっていだけ・セーブがあるとき） */
  const sv = S.phase === 'title' && load(), reset = sv && sv.phase !== 'title' ? `<div class="opt-reset">${resetArm
    ? `<p class="opt-warn">${sv.day}日目までの記録が消えて、1日目からになります</p><div class="opt-tabs"><button class="tab" data-act="resetNo">やめる</button><button class="tab" data-act="reset">はじめからにする</button></div>`
    : '<div class="opt-row"><span class="opt-nm">データ</span><span class="opt-tabs"><button class="tab" data-act="reset">はじめから</button></span></div>'}</div>` : '';
  return `<div class="panel opt" data-act="noop"><button class="vclose" data-act="optX" aria-label="とじる">×</button><h3 class="opt-ttl">せってい</h3>${OPT_ROWS.map(row).join('')}${reset}
    <div class="opt-cr"><b>クレジット</b><p>楽器の音：FluidR3_GM<span class="nw">（Frank Wen・MIT ライセンス）</span></p><p class="en">効果音："Oculus Audio Pack 01" by Oculus VR, LLC (<span class="url">https://developers.meta.com/vr/downloads/package/oculus-audio-pack-1/</span>), licensed under CC BY 4.0</p></div></div>`;
}
function optOpen() {
  let v = $('optv');
  if (!v) { v = document.createElement('div'); v.id = 'optv'; v.className = 'optv'; v.dataset.act = 'optX'; $('screen').appendChild(v); }
  v.innerHTML = optHTML();
}
function optClose() { const v = $('optv'); if (v) v.remove(); resetArm = false; }
function optSet(el) {
  S.opt[el.dataset.k] = el.dataset.v === '1'; save();
  optOpen();
  if (el.dataset.k === 'se' && S.opt.se) sePlay('tap');
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
  bgmSync();   // 昼の曲・夜の曲（sound.js）
}

const ACTS = {
  start: () => artPackWait(() => { if (S.phase !== 'title') return; const o = S.opt; S = newState(); S.opt = { ...S.opt, ...o }; goPrologue(); }),   // ためしのページは UI の絵のまとめが届いてから（core.js・11/23）・タイトルのせっていを引きつぐ
  continue: () => artPackWait(() => { if (S.phase !== 'title') return; const s = load(); if (s) { S = s; resume(); render(); } }),
  reset: () => { if (!resetArm) { resetArm = true; return optOpen(); } resetArm = false; optClose(); artPackWait(() => { if (S.phase !== 'title') return; const o = S.opt; S = newState(); S.opt = { ...S.opt, ...o }; goPrologue(); }); },   // せっていの中（11/23）：1回目は たしかめる
  resetNo: () => { resetArm = false; optOpen(); },
  card: el => tapCard(el.dataset.w, +el.dataset.i),
  close: () => closeView(),
  kw: el => showKw(el),
  spd: el => toggleSpd(el),
  noop: () => {},
  buy: el => buy(+el.dataset.i),
  sell: () => sell(),
  reroll: () => reroll(),
  bake: () => omotenashi(),
  pickB: el => pickBuild(el.dataset.id),   // 夕方のシェフ・ビルドえらび（11/18）
  pickGo: () => pickGo(),
  pickC: el => pickChef(el.dataset.id),   // シェフ → ビルド（11/22）
  ichiV: el => ichiView(el.dataset.id),   // 夜市（11/22 夜・ichi.js）：タップで大きく見る → 買う・やめる → もどる
  ichiBuy: el => ichiPick(el.dataset.id),
  ichiClose: () => ichiView(null),
  ichiGo: () => ichiGo(),
  pickBack: () => pickBack(),
  pickNext: () => pickNext(),
  pkPage: el => pickPageGo(+el.dataset.d),
  next: () => nextRound(),
  openShop: () => goDay(),
  toEvening: () => goEvening(),
  toResult: () => (S.phase === 'day' ? goEvening() : goResult()),   // 昼の「閉店」（前の昼の画面のボタン名のまま）は夕方へ
  nextDay: () => nextDay(),
  opt: () => optOpen(), optX: () => optClose(), optSet: el => optSet(el),
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
  if (!boot.art) { boot.art = 1; return artBlobs(() => boot(data)); }   // 先に UI とタイトルの絵を読む（core.js）
  const s = data && data.S ? sanitize(data.S) : null;
  S = s || newState();
  if (!s) { S.phase = 'title'; S.opt = titleOpt(); }   // タイトルの せっていは セーブ（なければ べつのキー）のオンオフを見せる（11/23）
  else resume();
  $('screen').addEventListener('click', e => {
    if (Date.now() - dragEnd < 350) return;   // ドラッグのあとのクリックは無視
    const el = e.target.closest('[data-act]');
    if (!el || el.dataset.act !== 'kw') hideKw();   // ことばの説明は、ほかの所をタップでとじる
    if (!el || el.disabled) return;
    const f = ACTS[el.dataset.act]; if (!f) return;
    if (el.tagName === 'BUTTON' && el.dataset.act !== 'noop') { pressFx(el); if (!NO_TAP[el.dataset.act]) sePlay('tap'); }   // 押したときの光（ぜんぶのせシップの形）と音（11/19 H-034）
    const ph = S.phase;
    f(el);
    if (S.phase !== ph) wipe();   // 夜・朝・昼・まとめの切りかえは、タイルの幕でさっと
    renderTop(); bgmSync();
  });
  dragInit($('screen'));
  render();
}
/* 自分の音を鳴らすボタンは tap を重ねない（買う・入れかえ・せっていのオンオフ） */
const NO_TAP = { buy: 1, reroll: 1, optSet: 1, ichiBuy: 1, ichiGo: 1 };   // 夜市の買う・もどるの音は ichiPick・ichiGo
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
  sePlay('wipe');   // 幕の音（11/19 H-034）
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
