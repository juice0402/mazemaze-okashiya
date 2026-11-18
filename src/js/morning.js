/* ==== 朝：仕入れ → 倉庫の素材を2つまぜて焼く → 棚へ（持ち主：昼のチャット【okashi-hiru】・11/18 作りなおし）
   操作は夜と同じ：つかんで動かす（行き先が光る・札に「はなすと どうなるか」）。11/18 しょーくん「デッキバトルのお店と場みたいに、倉庫から素材を二つ混ぜて焼ける感じ」
     倉庫の素材 → オーブンへ（2つ入ったらすぐ焼く）・ほかの素材の上へ（その2つをまぜてすぐ焼く）
     仕入れ（舞台にかぶさるお店）の素材 → 倉庫へ（買う）／できたお菓子 → 棚へ／オーブンの素材 → 倉庫へもどす
   タップはすぐ動く：倉庫の素材はオーブンへ・オーブンの素材は倉庫へ・できたお菓子は棚へ・仕入れの素材は1こ買う
   つなぎ目（リーダー）：flow.js の goMorning → startMorning()・画面は renderMorning()・ボタンは MORNING_ACTS・昼へは data-act="openShop"（goDay）
   朝のお菓子はカードにしない。数字は hiru.js・絵は day-scene.js・セリフは story.js ==== */

let mBusy = false, MD = null;
const BAKE_MS = 1500;   // 焼くのは演出だけ（約1.5秒）

/* ほっぺのすす（11/18 しょーくん）：はじめて焼く（1日目の「ちょっと焦げた」＝S.seen.mBaked）までは、
   すすなしの立ち絵（ART の <名前>-clean・いまは最初に出る6まい）を会話に出す。ない表情は今までどおり */
const mSusuOn = () => !(typeof S === 'object' && S && S.seen) || S.day > 1 || !!S.seen.mBaked;
for (const [f, k] of Object.entries(TALKERS.honoka.faces))
  Object.defineProperty(TALKERS.honoka.faces, f, { enumerable: true, get: () => (!mSusuOn() && ART[k + '-clean']) ? k + '-clean' : k });

/* 朝のはじめ（flow.js の goMorning から呼ぶ）：はじめは仕入れが開いている */
function startMorning() { S.morning = { shop: true, tab: 'mat', oven: [], made: null, fresh: false, talked: false }; }
function mState() { if (!S.morning || !Array.isArray(S.morning.oven)) startMorning(); return S.morning; }
const MAT_ORDER = () => [...Object.keys(HIRU_MATS), ...Object.keys(MATS).filter(isMonMat)];
const stockMats = () => MAT_ORDER().filter(m => (S.stock[m] || 0) > 0);
function matUnlocked(m) { const who = HIRU_MATS[m] && HIRU_MATS[m].who; return !who || !!S.seen[who] || (S.stock[m] || 0) > 0; }
const shopMats = () => Object.keys(HIRU_MATS).filter(matUnlocked);
const shelfMaxN = () => Math.min(SHELF_MAX, S.shelfMax || 6);
const shelfRoom = () => S.shelf.filter(s => s.n > 0).length + (S.morning && S.morning.made ? 1 : 0) < shelfMaxN();
const isNewRecipe = key => !(key in S.recipes);

/* ---------- 動き ---------- */
function takeStock(m, n = 1) { S.stock[m] = (S.stock[m] || 0) - n; if (S.stock[m] <= 0) delete S.stock[m]; }
function bakeNg() {
  const M = mState();
  if (mBusy) return 'busy';
  if (M.made) return 'できたお菓子を、先に棚へ';
  if (!shelfRoom()) return '棚がいっぱい！';
  return '';
}
function toOven(m) {
  const M = mState(), ng = bakeNg();
  if (ng) return ng !== 'busy' && toast(ng);
  if ((S.stock[m] || 0) <= 0 || M.oven.length >= 2) return;
  takeStock(m); M.oven.push(m); save();
  if (M.oven.length === 2) return bake();
  renderMorning();
}
function fromOven(i) {
  const M = mState(); if (mBusy) return;
  const m = M.oven.splice(i, 1)[0]; if (!m) return;
  S.stock[m] = (S.stock[m] || 0) + 1; save(); renderMorning();
}
/* 倉庫の素材 a を、素材 b の上へ：その2つをまぜて焼く（オーブンに入っていた素材は倉庫へもどす） */
function mixTwo(a, b) {
  const M = mState(), ng = bakeNg();
  if (ng) return ng !== 'busy' && toast(ng);
  for (const m of M.oven.splice(0)) S.stock[m] = (S.stock[m] || 0) + 1;
  if (a === b ? (S.stock[a] || 0) < 2 : !(S.stock[a] > 0 && S.stock[b] > 0)) { save(); return renderMorning(); }
  takeStock(a); takeStock(b); M.oven = [a, b]; save();
  bake();
}
function bake() {
  const M = mState(); if (mBusy || M.oven.length < 2) return;
  const key = recipeKey(M.oven[0], M.oven[1]), fresh = isNewRecipe(key);
  const run = () => {
    mBusy = true; renderMorning();
    setTimeout(() => {
      mBusy = false; M.oven = []; M.made = key; M.fresh = fresh;
      if (fresh) { S.recipes[key] = S.day; S.today.flashes.push(key); }
      S.today.made.push(key); save(); renderMorning(true);
      if (S.day === 1 && !S.seen.mBaked) { S.seen.mBaked = 1; save(); talk([...STORY.mTut.baked, ...STORY.mTut.shelf], () => {}, { dim: false }); }
    }, REDUCED ? 300 : BAKE_MS);
  };
  if (S.day === 1 && !S.seen.mBake) { S.seen.mBake = 1; save(); talk(STORY.mTut.bake, run, { dim: false }); }
  else run();
}
function placeMade() {
  const M = mState(); if (!M.made || mBusy) return;
  S.shelf.push({ key: M.made, n: BATCH }); M.made = null; M.fresh = false;
  save(); renderMorning();
  const sl = document.querySelectorAll('.mshelf .dslot:not(.empty)'), last = sl[sl.length - 1];
  if (last) last.classList.add('pop');
}
function buyMat(m) {
  const H = HIRU_MATS[m]; if (!H || mBusy) return;
  if (S.money < H.price) return toast('お財布がたりない……');
  S.money -= H.price; S.stock[m] = (S.stock[m] || 0) + 1; save(); renderMorning();
  const el = document.querySelector(`[data-mdrag="buy:${m}"]`); if (el) el.classList.add('got');
}
function goodNext(id) {
  if (id === 'tatekanban') { const lv = S.goods.tatekanban || 0; return lv < GOODS.tatekanban.price.length ? GOODS.tatekanban.price[lv] : null; }
  if (id === 'showcase') { const lv = S.goods.showcase || 0; return lv < GOODS.showcase.price.length && shelfMaxN() < SHELF_MAX ? GOODS.showcase.price[lv] : null; }
  const k = GOODS.kazari.find(x => x.id === id); return k && !S.goods[id] ? k.price : null;
}
function buyGood(id) {
  const p = goodNext(id); if (p == null || mBusy) return;
  if (S.money < p) return toast('お財布がたりない……');
  S.money -= p;
  if (id === 'showcase') { S.goods.showcase = (S.goods.showcase || 0) + 1; S.shelfMax = Math.min(SHELF_MAX, shelfMaxN() + GOODS.showcase.add); toast('棚のマスがふえた！'); }
  else if (id === 'tatekanban') { S.goods.tatekanban = (S.goods.tatekanban || 0) + 1; toast('立て看板を置いた！お客さんがふえるよ'); }
  else { S.goods[id] = 1; toast('お店にかざった！'); }
  save(); renderMorning();
}

/* ---------- つかんで動かす（夜の drag.js と同じ考え方：はなした所で決まる・行き先が光る・札） ---------- */
function mCan(src) {
  const [k, a] = src.split(':'), M = mState();
  if (k === 'mat') return v => !M.made && (v === 'oven' || v.startsWith('slot:') || (v.startsWith('mat:') && (v.slice(4) !== a || (S.stock[a] || 0) >= 2)));
  if (k === 'oven') return v => v === 'tray';
  if (k === 'made') return v => v === 'shelf';
  if (k === 'buy') return v => v === 'tray' || v.startsWith('mat:');
  return () => false;
}
function bakeTip(a, b) {
  if (!shelfRoom()) return '棚がいっぱい';
  const key = recipeKey(a, b);
  return isNewRecipe(key) ? 'まぜて焼く：？？？（はじめての組み合わせ）' : `まぜて焼く：${candyOf(key).name}`;
}
function mTipText(src, v) {
  const [k, a] = src.split(':'), M = mState();
  if (k === 'mat') {
    if (v === 'oven' || v.startsWith('slot:')) return M.oven.length ? bakeTip(M.oven[0], a) : 'オーブンへ';
    return bakeTip(a, v.slice(4));
  }
  if (k === 'oven') return '倉庫へもどす';
  if (k === 'made') return '棚に並べる';
  if (k === 'buy') return `${fmt(HIRU_MATS[a].price)}円で買う`;
  return '';
}
function mDown(e) {
  if (e.button > 0 || mBusy || talking() || MD) return;
  const el = e.target.closest('[data-mdrag]'); if (!el) return;
  e.preventDefault();
  MD = { el, src: el.dataset.mdrag, id: e.pointerId, x0: e.clientX, y0: e.clientY, moved: false, g: null, over: null, can: null, tip: null };
  window.addEventListener('pointermove', mMove);
  window.addEventListener('pointerup', mUp);
  window.addEventListener('pointercancel', mEnd);
}
function mGrab() {
  MD.moved = true; MD.can = mCan(MD.src);
  const r = MD.el.getBoundingClientRect(), g = MD.el.cloneNode(true);
  g.removeAttribute('data-mdrag'); g.removeAttribute('data-mdrop'); g.removeAttribute('id');
  g.className += ' mghost';
  Object.assign(g.style, { left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px' });
  document.body.appendChild(g); MD.g = g;
  MD.el.classList.add('lift');
  document.querySelectorAll('#screen [data-mdrop]').forEach(t => { if (MD.can(t.dataset.mdrop)) t.classList.add('can'); });
  const tip = document.createElement('div'); tip.className = 'mtip'; tip.hidden = true;
  document.body.appendChild(tip); MD.tip = tip;
}
function mMove(e) {
  if (!MD || e.pointerId !== MD.id) return;
  const dx = e.clientX - MD.x0, dy = e.clientY - MD.y0;
  if (!MD.moved) { if (Math.hypot(dx, dy) < 8) return; mGrab(); }
  MD.g.style.transform = `translate(${dx}px,${dy}px) scale(1.08)`;
  const hit = document.elementFromPoint(e.clientX, e.clientY), t = hit && hit.closest('[data-mdrop]');
  const ok = t && MD.can(t.dataset.mdrop) ? t : null;
  if (ok !== MD.over) {
    if (MD.over) MD.over.classList.remove('hot');
    MD.over = ok; if (ok) ok.classList.add('hot');
    MD.tip.hidden = !ok; if (ok) MD.tip.textContent = mTipText(MD.src, ok.dataset.mdrop);
  }
  /* 札は指から遠いほう：指が下半分なら舞台の上、上半分なら倉庫の上 */
  if (ok) {
    const st = $('mstage'), tr = document.querySelector('.mtray');
    const y = e.clientY > innerHeight * 0.5 ? (st ? st.getBoundingClientRect().top + 10 : 10) : (tr ? tr.getBoundingClientRect().top - 40 : innerHeight - 120);
    MD.tip.style.transform = `translate(-50%,${Math.round(y)}px)`;
  }
}
function mEnd() {
  window.removeEventListener('pointermove', mMove);
  window.removeEventListener('pointerup', mUp);
  window.removeEventListener('pointercancel', mEnd);
  if (!MD) return;
  if (MD.g) MD.g.remove();
  if (MD.tip) MD.tip.remove();
  MD.el.classList.remove('lift');
  document.querySelectorAll('#screen .can, #screen .hot').forEach(t => t.classList.remove('can', 'hot'));
  MD = null;
}
function mUp(e) {
  if (!MD || e.pointerId !== MD.id) return;
  const { src, moved, over } = MD; mEnd();
  if (!moved) return mTap(src);
  if (over) mDrop(src, over.dataset.mdrop);
}
function mTap(src) {
  const [k, a] = src.split(':');
  if (k === 'mat') toOven(a);
  else if (k === 'oven') fromOven(+a);
  else if (k === 'made') placeMade();
  else if (k === 'buy') buyMat(a);
}
function mDrop(src, v) {
  const [k, a] = src.split(':');
  if (k === 'mat') return v.startsWith('mat:') ? mixTwo(a, v.slice(4)) : toOven(a);
  if (k === 'oven') return fromOven(+a);
  if (k === 'made') return placeMade();
  if (k === 'buy') return buyMat(a);
}

/* ---------- 画面 ---------- */
function mTile(m) {
  return `<div class="mt${isMonMat(m) ? ' mmat' : ''}" data-mdrag="mat:${m}" data-mdrop="mat:${m}">${matIcon(m)}<span class="mt-nm">${esc(matShort(m))}</span><em class="mt-n">${S.stock[m]}</em></div>`;
}
function shopHTMLm() {
  const M = mState(), mat = M.tab !== 'goods';
  const body = mat
    ? `<div class="ms-grid">${shopMats().map(m => `<div class="ms-item" data-mdrag="buy:${m}">${matIcon(m)}<span class="ms-nm">${esc(HIRU_MATS[m].short)}</span><span class="ms-pr">${fmt(HIRU_MATS[m].price)}円</span>${S.stock[m] ? `<em class="ms-have">${S.stock[m]}</em>` : ''}</div>`).join('')}</div>`
    : `<div class="ms-goods">${['tatekanban', 'showcase', ...GOODS.kazari.map(k => k.id)].map(id => {
        const G = GOODS[id] || GOODS.kazari.find(k => k.id === id), p = goodNext(id);
        const lv = id === 'tatekanban' ? S.goods.tatekanban || 0 : id === 'showcase' ? S.goods.showcase || 0 : 0;
        const tx = GOODS[id] ? G.text : '見た目だけ';
        const done = id === 'tatekanban' || id === 'showcase' ? 'これ以上は置けない' : 'かざった';
        return `<div class="ms-good"><span class="msg-nm">${esc(G.name)}${lv ? `<em>${lv}こ</em>` : ''}</span><span class="msg-tx">${tx}</span>${p == null ? `<span class="msg-done">${done}</span>` : `<button class="sub" data-act="m-good" data-id="${id}"${S.money < p ? ' disabled' : ''}>${fmt(p)}円</button>`}</div>`;
      }).join('')}</div>`;
  const sbg = ART[mat ? 'bg-market' : 'bg-zakka'];
  return `<div class="shopov mshop${sbg ? ' ms-bg' : ''}"${sbg ? ` style="--msbg:url('${sbg}')"` : ''}>
    <div class="ms-top"><span class="ms-tabs"><button class="tab${mat ? ' on' : ''}" data-act="m-tab" data-t="mat">市場</button><button class="tab${mat ? '' : ' on'}" data-act="m-tab" data-t="goods">雑貨屋</button></span><span class="ms-wallet">お財布 <b>${fmt(S.money)}</b>円</span></div>
    ${body}
    <p class="ms-hint">${mat ? 'タップで1こ買う・下の倉庫へドラッグしても買えるよ' : '立て看板とショーケースは、つぎの日からずっと効くよ'}</p>
    <button class="go2 ms-close" data-act="m-shop" data-o="0">仕入れおわり</button>
  </div>`;
}
function renderMorning(pop) {
  const M = mState(), bg = ART['bg-morning'], mats = stockMats();
  const ovenSlots = [0, 1].map(i => {
    const m = M.oven[i];
    return m ? `<span class="mo-slot full" data-mdrag="oven:${i}" data-mdrop="slot:${i}">${matIcon(m)}</span>` : `<span class="mo-slot" data-mdrop="slot:${i}"></span>`;
  }).join('<i class="mo-plus">+</i>');
  const made = M.made ? `<div class="m-made${pop ? ' pop' : ''}" data-mdrag="made">${candyIcon(M.made)}<span class="mm-nm">${esc(candyOf(M.made).name)}</span>${M.fresh ? '<span class="mm-flash">レシピ ひらめき！</span>' : ''}</div>` : '';
  const { slots, ks } = shelfSlots(null);
  $('screen').innerHTML = `<section class="morning fit${mBusy ? ' busy' : ''}${M.shop ? ' shopping' : ''}" id="msec">
    <div class="mstage${mBusy ? ' baking' : ''}${bg ? '' : ' noart'}" id="mstage"${bg ? ` style="--bgimg:url('${bg}')"` : ''}>
      <div class="m-oven${M.made ? ' done' : ''}" data-mdrop="oven"><i class="mo-glow"></i><i class="mo-steam"></i><span class="mo-row">${ovenSlots}</span></div>
      ${made}
      ${M.shop ? shopHTMLm() : ''}
    </div>
    <div class="mshelf" data-mdrop="shelf" style="--rows:${Math.ceil(slots.length / SHELF_COLS)}">${slots.map((o, i) => slotHTML(o, i, ks, false)).join('')}</div>
    <div class="mtray gingham" data-mdrop="tray">${mats.length ? mats.map(mTile).join('') : '<p class="mt-empty">倉庫はからっぽ。仕入れで素材を買ってね</p>'}</div>
    <div class="m-bar"><button class="sub" data-act="m-shop" data-o="1">仕入れ</button>${M.made ? `<button class="big" data-act="toShelf"${mBusy ? ' disabled' : ''}>お菓子を棚へ</button>` : `<button class="big" data-act="openShop"${mBusy ? ' disabled' : ''}>お店をあけに行く</button>`}</div>
  </section>`;
  $('msec').addEventListener('pointerdown', mDown);
  if (!M.talked && !talking()) {
    M.talked = true; save();
    const lines = STORY.morning(S.today, S.yesterday);
    if (lines.length) talk(lines, () => {}, { dim: false });
  }
  if (M.oven.length === 2 && !mBusy) setTimeout(bake, 0);   // 焼いているとちゅうで閉じたとき
}
function setShop(open) {
  const M = mState(); M.shop = open; save(); renderMorning();
  if (!open && S.day === 1 && !S.seen.mOven && !talking()) { S.seen.mOven = 1; save(); talk(STORY.mTut.oven, () => {}, { dim: false }); }
}

/* 朝の画面のボタン（data-act）。main.js の ACTS に入る */
const MORNING_ACTS = {
  'm-shop': el => setShop(el.dataset.o === '1'),
  'm-tab': el => { mState().tab = el.dataset.t; save(); renderMorning(); },
  'm-good': el => buyGood(el.dataset.id),
  toShelf: () => placeMade(),
};
