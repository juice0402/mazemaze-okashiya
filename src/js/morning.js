/* ==== 朝：ひらめいたレシピとふしぎな材料でお菓子を作る → カードにするか、お昼に売るか ==== */
const OVENS = 3, BATCH = 3;   // 朝に焼けるのは3回。1回で3こ（売るとき）

function goMorning() {
  S.phase = 'morning'; S.morning = { ovens: OVENS, cur: null };
  save(); render();
}
function canBake(key) {
  const need = {};
  for (const m of recipeOf(key).needs) need[m] = (need[m] || 0) + 1;
  return Object.keys(need).every(m => (S.stock[m] || 0) >= need[m]);
}
function bakeRecipe(key) {
  const M = S.morning;
  if (!S.recipes[key] && S.recipes[key] !== 0) return;
  if (M.cur) return toast('できたお菓子を先にえらんでね');
  if (M.ovens <= 0) return toast('オーブンはもう使いきったよ');
  if (!canBake(key)) return toast('ふしぎな材料がたりない');
  for (const m of recipeOf(key).needs) S.stock[m]--;
  M.ovens--; M.cur = key; S.today.made.push(key);
  save(); renderMorning();
}
function toCard() {
  const M = S.morning; if (!M.cur) return;
  S.pool.push('o:' + M.cur);
  toast(`${recipeOf(M.cur).name}をカードにした。夜の仕入れに出てくるよ`);
  M.cur = null; save(); renderMorning();
}
function toShelf() {
  const M = S.morning; if (!M.cur) return;
  const s = S.shelf.find(x => x.key === M.cur);
  if (s) s.n += BATCH; else S.shelf.push({ key: M.cur, n: BATCH });
  toast(`${recipeOf(M.cur).name}を棚に並べた`);
  M.cur = null; save(); renderMorning();
}
function tasteTags(r) { return r.tastes.map(t => `<span class="tag">${t}</span>`).join(''); }
function renderMorning() {
  const M = S.morning;
  const keys = Object.keys(S.recipes).sort((a, b) => (S.recipes[b] - S.recipes[a]) || a.localeCompare(b));
  const fus = Object.keys(MATS).filter(m => MATS[m].fushigi && S.stock[m] > 0);
  let cur = '';
  if (M.cur) {
    const r = recipeOf(M.cur), d = cardDef('o:' + M.cur);
    cur = `<div class="panel made"><img class="candy" src="${candyURL(M.cur)}" alt="">
      <div><h2>${esc(r.name)}ができた！</h2><div class="tags">${tasteTags(r)}</div>
      <p>カードにすると：${fxText(d.fx)}</p><p>売ると：1こ ${r.price}円（すきな味のお客さんには倍）</p></div></div>
      <div class="row two"><button data-act="toCard">カードにする</button><button data-act="toShelf">お昼に売る（${BATCH}こ）</button></div>`;
  }
  $('screen').innerHTML = `<section class="morning fit">
    <div class="panel tight"><h2>朝の仕込み</h2><p>ひらめいたレシピでお菓子を作ろう。カードにすると夜の仕入れに出てきて、売るとお金になるよ</p></div>
    <div class="stockline"><span>オーブン あと<b>${M.ovens}</b>回</span>
      <span class="fus">${fus.length ? fus.map(m => `<img src="${matURL(m)}" alt="">${MATS[m].name}×${S.stock[m]}`).join(' ') : 'ふしぎな材料はなし'}</span></div>
    ${fus.some(m => !keys.some(k => recipeOf(k).needs.includes(m))) ? `<p class="muted">${fus.filter(m => !keys.some(k => recipeOf(k).needs.includes(m))).map(m => MATS[m].name).join('・')}のレシピは、夜にそのカードを食材のとなりに置くとひらめくよ</p>` : ''}
    ${cur}
    <div class="recipes">${keys.map(k => {
      const r = recipeOf(k), ok = canBake(k) && M.ovens > 0 && !M.cur;
      return `<button class="recipe" data-act="bakeRecipe" data-key="${k}" ${ok ? '' : 'disabled'}>
        <img class="candy" src="${candyURL(k)}" alt="">
        <span class="rbody"><span class="rn">${esc(r.name)}${S.recipes[k] === S.day ? '<em>NEW</em>' : ''}</span>
        <span class="rm">${r.mats.map(m => `<img src="${matURL(m)}" alt="${MATS[m].name}">`).join('+')} ${tasteTags(r)}</span>
        ${r.needs.length ? `<span class="rneed">${r.needs.map(m => MATS[m].name).join('と')}を使う</span>` : ''}</span></button>`;
    }).join('')}</div>
    <button class="big" data-act="openShop" ${M.cur ? 'disabled' : ''}>お店をあける</button>
  </section>`;
}
