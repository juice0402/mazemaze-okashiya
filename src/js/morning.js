/* ==== 朝：材料だなの素材を2つまぜて焼く → 棚へ自動で並ぶ（持ち主：昼のチャット【okashi-hiru】・11/18 作りなおし）
   操作は夜と同じ：つかんで動かす（行き先が光る・札に「はなすと どうなるか」）。11/18 しょーくん「デッキバトルのお店と場みたいに、倉庫から素材を二つ混ぜて焼ける感じ」
   11/18 しょーくん「仕入れ→料理→陳列がわかりにくい・直感操作で」→ 案A：仕入れの画面をなくし、焼けたら棚へ自動で飛ぶ
     下の材料だな：基本素材はいつも並ぶ（持っていれば数・なければ値札）。モンスター素材は倉庫にある分だけ
     材料 → オーブンへ（2つ入ったらすぐ焼く）・ほかの材料の上へ（その2つをまぜてすぐ焼く）。持っていない分は、その場で買う
     オーブンの素材 → 材料だなへもどす（倉庫に入る）。雑貨屋（グッズだけ）は下のボタンから
   タップはすぐ動く：材料はオーブンへ・オーブンの素材はもどす
   つなぎ目（リーダー）：flow.js の goMorning → startMorning()・画面は renderMorning()・ボタンは MORNING_ACTS・昼へは data-act="openShop"（goDay）
   朝のお菓子はカードにしない。数字は hiru.js・絵は day-scene.js・セリフは story.js ==== */

let mBusy = false, MD = null, mSpent = 0;
const BAKE_MS = 1500;   // 焼くのは演出だけ（約1.5秒）

/* ほっぺのすす（11/18 しょーくん）：はじめて焼く（1日目の「ちょっと焦げた」＝S.seen.mBaked）までは、
   すすなしの立ち絵（ART の <名前>-clean・いまは最初に出る6まい）を会話に出す。ない表情は今までどおり */
const mSusuOn = () => !(typeof S === 'object' && S && S.seen) || S.day > 1 || !!S.seen.mBaked;
for (const [f, k] of Object.entries(TALKERS.honoka.faces))
  Object.defineProperty(TALKERS.honoka.faces, f, { enumerable: true, get: () => (!mSusuOn() && ART[k + '-clean']) ? k + '-clean' : k });

/* 朝のはじめ（flow.js の goMorning から呼ぶ）：すぐキッチン（shop＝雑貨屋が開いているか） */
function startMorning() { S.morning = { shop: false, oven: [], made: null, fresh: false, talked: false }; }
function mState() { if (!S.morning || !Array.isArray(S.morning.oven)) startMorning(); return S.morning; }
function matUnlocked(m) { const who = HIRU_MATS[m] && HIRU_MATS[m].who; return !who || !!S.seen[who] || (S.stock[m] || 0) > 0; }
const shopMats = () => Object.keys(HIRU_MATS).filter(matUnlocked);
const shelfMaxN = () => Math.min(SHELF_MAX, S.shelfMax || 6);
const shelfRoom = () => S.shelf.filter(s => s.n > 0).length + (S.morning && S.morning.made ? 1 : 0) < shelfMaxN();
const isNewRecipe = key => !(key in S.recipes);
/* 下の材料だなに出す素材：基本素材（仲間の素材は来てから）＋倉庫にあるモンスター素材 */
const trayMats = () => [...shopMats(), ...Object.keys(MATS).filter(m => isMonMat(m) && (S.stock[m] || 0) > 0)];
const mNeed = list => list.reduce((o, m) => (o[m] = (o[m] || 0) + 1, o), {});
/* list の素材を使うのに足りない分の代金（買えない素材が足りなければ null） */
function mCost(list) {
  let c = 0;
  for (const [m, n] of Object.entries(mNeed(list))) {
    const lack = n - (S.stock[m] || 0); if (lack <= 0) continue;
    if (!HIRU_MATS[m] || !matUnlocked(m)) return null;
    c += lack * HIRU_MATS[m].price;
  }
  return c;
}
const mOk = list => { const c = mCost(list); return c != null && c <= S.money; };

/* ---------- 動き ---------- */
function takeStock(m, n = 1) { S.stock[m] = (S.stock[m] || 0) - n; if (S.stock[m] <= 0) delete S.stock[m]; }
/* 足りない分をその場で買ってから使う（使えたら true） */
function mUse(list) {
  const c = mCost(list);
  if (c == null) return false;
  if (S.money < c) { toast('お財布がたりない……'); return false; }
  for (const [m, n] of Object.entries(mNeed(list))) { const lack = n - (S.stock[m] || 0); if (lack > 0) S.stock[m] = (S.stock[m] || 0) + lack; }
  S.money -= c; mSpent += c;
  list.forEach(m => takeStock(m));
  return true;
}
function bakeNg() {
  if (mBusy) return 'busy';
  if (!shelfRoom()) return '棚がいっぱい！お店をあけに行こう';
  return '';
}
function toOven(m) {
  const M = mState(), ng = bakeNg();
  if (ng) return ng !== 'busy' && toast(ng);
  if (M.oven.length >= 2 || !mUse([m])) return;
  M.oven.push(m); save();
  if (M.oven.length === 2) return bake();
  renderMorning();
}
function fromOven(i) {
  const M = mState(); if (mBusy) return;
  const m = M.oven.splice(i, 1)[0]; if (!m) return;
  S.stock[m] = (S.stock[m] || 0) + 1; save(); renderMorning();
}
/* 材料 a を、材料 b の上へ：その2つをまぜて焼く（オーブンに入っていた素材は倉庫へもどす） */
function mixTwo(a, b) {
  const M = mState(), ng = bakeNg();
  if (ng) return ng !== 'busy' && toast(ng);
  for (const m of M.oven.splice(0)) S.stock[m] = (S.stock[m] || 0) + 1;
  if (!mUse([a, b])) { save(); return renderMorning(); }
  M.oven = [a, b]; save();
  bake();
}
/* 焼けたら、棚の空いたマスへ自動で並ぶ（オーブンの上にぽん → 棚へ飛ぶ） */
function bake() {
  const M = mState(); if (mBusy || M.oven.length < 2) return;
  const key = recipeKey(M.oven[0], M.oven[1]), fresh = isNewRecipe(key);
  const run = () => {
    mBusy = true; renderMorning();
    setTimeout(() => {
      mBusy = false; M.oven = [];
      if (fresh) { S.recipes[key] = S.day; S.today.flashes.push(key); }
      S.today.made.push(key); S.shelf.push({ key, n: BATCH }); save();
      renderMorning(); const t = mFly(key, fresh);
      if (S.day === 1 && !S.seen.mBaked) { S.seen.mBaked = 1; save(); setTimeout(() => talk([...STORY.mTut.baked, ...STORY.mTut.shelf], () => {}, { dim: false }), t); }
    }, REDUCED ? 300 : BAKE_MS);
  };
  if (S.day === 1 && !S.seen.mBake) { S.seen.mBake = 1; save(); talk(STORY.mTut.bake, run, { dim: false }); }
  else run();
}
/* できたお菓子の札が、オーブンの上にぽんと出て、棚のマスへ飛ぶ（transform と opacity だけ）。かかる時間を返す */
function mFly(key, fresh) {
  const ov = document.querySelector('.m-oven'), sl = document.querySelectorAll('.mshelf .dslot:not(.empty)'), to = sl[sl.length - 1];
  if (!ov || !to || !document.body.animate) return 0;
  const f = document.createElement('div');
  f.className = 'm-fly';
  f.innerHTML = `${candyIcon(key)}<span class="mm-nm">${esc(candyOf(key).name)}</span>${fresh ? '<span class="mm-flash">レシピ ひらめき！</span>' : ''}`;
  document.body.appendChild(f);
  const a = ov.getBoundingClientRect(), b = to.getBoundingClientRect(), w = f.offsetWidth, h = f.offsetHeight;
  f.style.left = (a.left + a.width / 2 - w / 2) + 'px'; f.style.top = (a.top + a.height * 0.3 - h / 2) + 'px';
  const dx = b.left + b.width / 2 - (a.left + a.width / 2), dy = b.top + b.height / 2 - (a.top + a.height * 0.3);
  const pop = REDUCED ? 80 : 380, hold = REDUCED ? 120 : fresh ? 1000 : 450, go = REDUCED ? 160 : 480;
  to.classList.add('m-wait');
  f.animate([{ transform: 'scale(.2)', opacity: 0 }, { transform: 'scale(1.1)', opacity: 1, offset: .7 }, { transform: 'scale(1)', opacity: 1 }], { duration: pop, easing: 'ease-out', fill: 'forwards' });
  setTimeout(() => {
    const go1 = f.animate([{ transform: 'translate(0,0) scale(1)', opacity: 1 }, { transform: `translate(${dx}px,${dy}px) scale(.45)`, opacity: .2 }], { duration: go, easing: 'cubic-bezier(.5,0,.7,1)', fill: 'forwards' });
    go1.onfinish = () => {
      f.remove();
      const s2 = document.querySelectorAll('.mshelf .dslot:not(.empty)'), last = s2[s2.length - 1];
      document.querySelectorAll('.mshelf .m-wait').forEach(x => x.classList.remove('m-wait'));
      if (last) last.classList.add('pop');
    };
  }, pop + hold);
  return pop + hold + go;
}
/* 前の形のセーブ（できたお菓子がオーブンの上で待っていた）：そのまま棚へ */
function placeMade() {
  const M = mState(); if (!M.made || mBusy) return;
  S.shelf.push({ key: M.made, n: BATCH }); M.made = null; M.fresh = false; save();
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
  const [k, a] = src.split(':');
  if (k === 'mat') return v => shelfRoom() && (v === 'oven' || v.startsWith('slot:') ? mOk([a]) : v.startsWith('mat:') && mOk([a, v.slice(4)]));
  if (k === 'oven') return v => v === 'tray';
  return () => false;
}
const mPay = list => { const c = mCost(list); return c ? `・${fmt(c)}円で買う` : ''; };
function bakeTip(a, b) {
  const key = recipeKey(a, b);
  return isNewRecipe(key) ? 'まぜて焼く：？？？（はじめて）' : `まぜて焼く：${candyOf(key).name}`;
}
function mTipText(src, v) {
  const [k, a] = src.split(':'), M = mState();
  if (k === 'mat') {
    if (v === 'oven' || v.startsWith('slot:')) return (M.oven.length ? bakeTip(M.oven[0], a) : 'オーブンへ') + mPay([a]);
    return bakeTip(a, v.slice(4)) + mPay([a, v.slice(4)]);
  }
  if (k === 'oven') return '材料だなへもどす';
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
}
function mDrop(src, v) {
  const [k, a] = src.split(':');
  if (k === 'mat') return v.startsWith('mat:') ? mixTwo(a, v.slice(4)) : toOven(a);
  if (k === 'oven') return fromOven(+a);
}

/* ---------- 画面 ---------- */
/* 材料だなの1つ：持っていれば数（赤い丸）・なければ値札（お財布がたりなければ灰色） */
function mTile(m) {
  const n = S.stock[m] || 0, p = HIRU_MATS[m] ? HIRU_MATS[m].price : 0;
  return `<div class="mt${isMonMat(m) ? ' mmat' : ''}${!n && p > S.money ? ' poor' : ''}" data-mdrag="mat:${m}" data-mdrop="mat:${m}">${matIcon(m)}<span class="mt-nm">${esc(matShort(m))}</span>${n ? `<em class="mt-n">${n}</em>` : `<span class="mt-pr">${fmt(p)}円</span>`}</div>`;
}
/* 雑貨屋（お店のグッズ）：夜のショップ .shopov の形で舞台にかぶさる。背景は店の中 bg-zakka */
function shopHTMLm() {
  const body = `<div class="ms-goods">${['tatekanban', 'showcase', ...GOODS.kazari.map(k => k.id)].map(id => {
        const G = GOODS[id] || GOODS.kazari.find(k => k.id === id), p = goodNext(id);
        const lv = id === 'tatekanban' ? S.goods.tatekanban || 0 : id === 'showcase' ? S.goods.showcase || 0 : 0;
        const tx = GOODS[id] ? G.text : '見た目だけ';
        const done = id === 'tatekanban' || id === 'showcase' ? 'これ以上は置けない' : 'かざった';
        return `<div class="ms-good"><span class="msg-nm">${esc(G.name)}${lv ? `<em>${lv}こ</em>` : ''}</span><span class="msg-tx">${tx}</span>${p == null ? `<span class="msg-done">${done}</span>` : `<button class="sub" data-act="m-good" data-id="${id}"${S.money < p ? ' disabled' : ''}>${fmt(p)}円</button>`}</div>`;
      }).join('')}</div>`;
  const sbg = ART['bg-zakka'];
  return `<div class="shopov mshop${sbg ? ' ms-bg' : ''}"${sbg ? ` style="--msbg:url('${sbg}')"` : ''}>
    <div class="ms-top"><span class="ms-ttl">雑貨屋</span><span class="ms-wallet">お財布 <b>${fmt(S.money)}</b>円</span></div>
    ${body}
    <p class="ms-hint">立て看板とショーケースは、つぎの日からずっと効くよ</p>
    <button class="go2 ms-close" data-act="m-shop" data-o="0">キッチンへもどる</button>
  </div>`;
}
/* オーブンの上の札：つぎにすること */
function mHint(M) {
  if (mBusy) return '焼いてるよ……';
  if (!shelfRoom()) return '棚がいっぱい！お店をあけに行こう';
  return M.oven.length ? 'あと1つ！' : '材料を2つ入れてね';
}
function renderMorning() {
  const M = mState(), bg = ART['bg-morning'];
  if (M.made) placeMade();
  const ovenSlots = [0, 1].map(i => {
    const m = M.oven[i];
    return m ? `<span class="mo-slot full" data-mdrag="oven:${i}" data-mdrop="slot:${i}">${matIcon(m)}</span>` : `<span class="mo-slot" data-mdrop="slot:${i}"></span>`;
  }).join('<i class="mo-plus">+</i>');
  const spent = mSpent ? `<i class="m-spent">−${fmt(mSpent)}円</i>` : ''; mSpent = 0;
  const wait = !mBusy && M.oven.length < 2 && shelfRoom();
  const { slots, ks } = shelfSlots(null);
  $('screen').innerHTML = `<section class="morning fit${mBusy ? ' busy' : ''}${M.shop ? ' shopping' : ''}" id="msec">
    <div class="mstage${mBusy ? ' baking' : ''}${bg ? '' : ' noart'}" id="mstage"${bg ? ` style="--bgimg:url('${bg}')"` : ''}>
      <span class="m-wallet">お財布 <b>${fmt(S.money)}</b>円${spent}</span>
      <div class="m-oven${wait ? ' wait' : ''}" data-mdrop="oven"><i class="mo-glow"></i><i class="mo-steam"></i><span class="mo-row"><span class="mo-hint">${mHint(M)}</span><span class="mo-slots">${ovenSlots}</span></span></div>
      ${M.shop ? shopHTMLm() : ''}
    </div>
    <div class="mshelf" data-mdrop="shelf" style="--rows:${Math.ceil(slots.length / SHELF_COLS)}">${slots.map((o, i) => slotHTML(o, i, ks, false)).join('')}</div>
    <div class="mtray gingham" data-mdrop="tray">${trayMats().map(mTile).join('')}</div>
    <div class="m-bar"><button class="sub" data-act="m-shop" data-o="1">雑貨屋</button><button class="big" data-act="openShop"${mBusy ? ' disabled' : ''}>お店をあけに行く</button></div>
  </section>`;
  $('msec').addEventListener('pointerdown', mDown);
  if (!M.talked && !talking()) {
    M.talked = true;
    const tut = S.day === 1 && !S.seen.mOven ? (S.seen.mOven = 1, STORY.mTut.oven) : [];
    const lines = [...STORY.morning(S.today, S.yesterday), ...tut];
    save();
    if (lines.length) talk(lines, () => {}, { dim: false });
  }
  if (M.oven.length === 2 && !mBusy) setTimeout(bake, 0);   // 焼いているとちゅうで閉じたとき
}
function setShop(open) { const M = mState(); M.shop = open; save(); renderMorning(); }

/* 朝の画面のボタン（data-act）。main.js の ACTS に入る */
const MORNING_ACTS = {
  'm-shop': el => setShop(el.dataset.o === '1'),
  'm-good': el => buyGood(el.dataset.id),
  toShelf: () => { placeMade(); renderMorning(); },   // 前の形のボタン（main.js の toCard もここへ）
};
