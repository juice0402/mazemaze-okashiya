/* ==== はじまり：画面の切りかえ・タイトル・タップのうけつけ ==== */
const PHASE_NAME = { night: '夜', morning: '朝', day: '昼', result: 'まとめ' };
let resetArm = false;

function renderTop() {
  $('dayLabel').textContent = S.phase === 'title' ? '' : `${S.day}日目　${PHASE_NAME[S.phase] || ''}`;
  $('money').textContent = S.phase === 'title' ? '' : fmt(S.money) + '円';
}
function renderTitle() {
  const saved = load();
  const chef = ART.honoka || big(CHEF_SPR[0], 5), mon = ART['mon-slime'] || big(MON_SPR.slime, 3);
  $('screen').innerHTML = `<section class="title">
    <h1>まぜまぜ<br>おかし屋</h1>
    <div class="hero"><img src="${chef}" alt="炎のシェフ ほのか"><img src="${mon}" alt="ぷるぷるスライム"></div>
    <p>炎のシェフ ほのか（仮）の小さなおかし屋さん。<br>夜になると、食材モンスターがお店をおそいにくる！</p>
    <ul class="howto"><li><b>夜</b>　カードを調理台に並べて、9ラウンドで撃退。食材★1どうしをまぜると★2のお菓子になって、レシピがひらめく</li>
      <li><b>朝</b>　ひらめいたレシピでお菓子づくり。カードにするか、売るか</li>
      <li><b>昼</b>　棚に並べて販売。すきな味だとお客さんが常連さんに</li></ul>
    ${saved && saved.phase !== 'title' ? `<button class="big" data-act="continue">つづきから（${saved.day}日目）</button>
      <button class="sub" data-act="reset">${resetArm ? 'ほんとうに はじめから？（もう一度タップ）' : 'はじめから'}</button>` : '<button class="big" data-act="start">はじめる</button>'}
  </section>`;
}
function render() {
  renderTop();
  if (S.phase === 'night') renderNight();
  else if (S.phase === 'morning') renderMorning();
  else if (S.phase === 'day') renderDay();
  else if (S.phase === 'result') renderResult();
  else renderTitle();
  $('screen').scrollTop = 0;
}

const ACTS = {
  start: () => { S = newState(); startNight(); },
  continue: () => { const s = load(); if (s) { S = s; if (S.phase === 'night' && S.night && S.night.stage === 'roundEnd') busy = false; render(); } },
  reset: () => { if (!resetArm) { resetArm = true; return renderTitle(); } resetArm = false; S = newState(); startNight(); },
  field: el => chooseField(el.dataset.id),
  card: el => tapCard(el.dataset.w, +el.dataset.i),
  shop: el => tapShop(+el.dataset.i),
  buy: el => buy(+el.dataset.i),
  sell: () => sell(),
  mix: () => startMix(),
  cancelMix: () => { N.mixing = false; renderNight(); },
  reroll: () => reroll(),
  bake: () => bake(),
  next: () => nextRound(),
  toMorning: () => goMorning(),
  bakeRecipe: el => bakeRecipe(el.dataset.key),
  toCard: () => toCard(),
  toShelf: () => toShelf(),
  openShop: () => goDay(),
  fast: () => toggleFast(),
  toResult: () => goResult(),
  nextDay: () => nextDay(),
};
function boot(data) {
  const s = data && data.S ? sanitize(data.S) : null;
  S = s || newState();
  if (!s) S.phase = 'title';
  $('screen').addEventListener('click', e => {
    const el = e.target.closest('[data-act]');
    if (!el || el.disabled) return;
    const f = ACTS[el.dataset.act]; if (f) f(el);
    renderTop();
  });
  render();
}
/* アーティファクトを開いたまま更新されたとき、遊んでいる所から続ける */
try { if (window.claude && window.claude.hot) window.claude.hot.snapshot(() => ({ S })); } catch (e) { /* なくてよい */ }
const H = window.claude && window.claude.hot;
if (H && H.ready) H.ready(boot); else boot(H && H.data ? H.data : {});
