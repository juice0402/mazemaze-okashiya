/* ==== 朝：キッチン（まぜて焼く）→ 商品を並べる（陳列）→ お店を開ける。雑貨屋は別の画面（持ち主：昼のチャット【okashi-hiru】・11/18 作りなおし）
   操作は夜と同じ：つかんで動かす（行き先が光る・札に「はなすと どうなるか」）。11/18 しょーくん「デッキバトルのお店と場みたいに、倉庫から素材を二つ混ぜて焼ける感じ」
   11/18 しょーくん「仕入れ→料理→陳列がわかりにくい・直感操作で」→ 案A（仕入れの画面なし）
   11/18 15:00 しょーくん「料理の段階では陳列棚は不要・雑貨屋は別ページ・お店を開けるだと陳列せずに開店しちゃう → 商品を並べる をフル画面で・最後にお店を開ける」
   S.morning.view：kitchen（キッチン）・display（商品を並べる）・zakka（雑貨屋）
     キッチン：下の材料だな（基本素材はいつも並ぶ・持っていれば数・なければ値札）→ オーブンへ（2つ入ったらすぐ焼く）・材料どうしを重ねる（まぜてすぐ焼く）。
       持っていない分は、その場で買う。焼けたお菓子は作業台の天板へ（S.morning.baked・まだ棚ではない）。焼ける数は棚のマスまで
     商品を並べる：天板のお菓子 → 棚のマスへ（まんなかは看板の枠 S.morning.kanban）。棚のお菓子どうしで入れかえ・天板へもどす・タップで看板に
       お店を開ける → 並べていないお菓子は空いたマスへ → goDay → すぐ営業（看板は S.morning.kanban を day.js の startDay が使う）
   つなぎ目（リーダー）：flow.js の goMorning → startMorning()・画面は renderMorning()・ボタンは MORNING_ACTS・昼へは goDay()
   朝のお菓子はカードにしない。数字は hiru.js・絵は day-scene.js・セリフは story.js ==== */

let mBusy = false, MD = null, mSpent = 0;
const BAKE_MS = 1500;   // 焼くのは演出だけ（約1.5秒）
/* 音（11/19・se.js）：効果音 mSe・掛け声 mKoe・ジングル mJg。se.js がビルドに入っていないときは鳴らさない（day.js も使う） */
const mSe = (n, o) => { if (typeof sePlay === 'function') sePlay(n, o); };
const mKoe = id => { if (typeof koePlay === 'function') koePlay(id); };
const mJg = n => { if (typeof jgPlay === 'function') jgPlay(n); };
const mSoroiN = () => soroiRows(dSlots().slots).length;
/* 昼のパズル（11/21）：いまの棚の 相性の結び目＋シリーズの列 の数（ふえたら いい音）・はじめて見つけた相性を相性帳へ（S.seen の ai:<id>＝その日） */
const mPzN = () => { const P = puzzleOf(dSlots().slots); return P.links.length + P.series.length; };
function mPzFind() {
  const P = puzzleOf(dSlots().slots), neu = [];
  for (const L of P.links) if (!S.seen['ai:' + L.p.id]) { S.seen['ai:' + L.p.id] = S.day; neu.push(L.p); }
  if (neu.length) { save(); toast(`相性を見つけた！「${neu.map(p => p.name).join('」「')}」`); }
  if (P.series.length && !S.seen.series && !talking()) { S.seen.series = S.day; save(); talk(STORY.seriesFirst(KATA[P.series[0].kata]), () => {}); }
}
const mPlaceSe = (so0, pz0, kan) => mSe(mSoroiN() > so0 || mPzN() > pz0 ? 'soroi' : kan ? 'kanban' : 'place');

/* ほっぺのすす（11/18 しょーくん）：はじめて焼く（1日目の「ちょっと焦げた」＝S.seen.mBaked）までは、
   すすなしの立ち絵（ART の <名前>-clean・いまは最初に出る6まい）を会話に出す。ない表情は今までどおり */
const mSusuOn = () => !(typeof S === 'object' && S && S.seen) || S.day > 1 || !!S.seen.mBaked;
for (const [f, k] of Object.entries(TALKERS.honoka.faces))
  Object.defineProperty(TALKERS.honoka.faces, f, { enumerable: true, get: () => (!mSusuOn() && ART[k + '-clean']) ? k + '-clean' : k });

/* 朝のはじめ（flow.js の goMorning から呼ぶ）：baked＝焼けて天板にあるお菓子・kanban＝看板の枠のお菓子の key */
function startMorning() { S.morning = { view: 'kitchen', oven: [], baked: [], kanban: null, talked: false }; }
function mState() {
  if (!S.morning || !Array.isArray(S.morning.oven)) startMorning();
  const M = S.morning;
  if (!Array.isArray(M.baked)) M.baked = [];
  if (!M.view) M.view = 'kitchen';
  if (M.made) { M.baked.push({ key: M.made, n: BATCH }); M.made = null; }   // 前の形のセーブ（できたお菓子が待っていた）
  return M;
}
function matUnlocked(m) { const who = HIRU_MATS[m] && HIRU_MATS[m].who; return !who || STORY.mate(who) || !!S.seen[who] || (S.stock[m] || 0) > 0; }   // 仲間になった次の日から（11/19）
const shopMats = () => Object.keys(HIRU_MATS).filter(matUnlocked);
const shelfMaxN = () => Math.min(SHELF_MAX, S.shelfMax || 6);
const placedN = () => S.shelf.filter(s => s.n > 0).length;
const mRoomN = () => shelfMaxN() + BACK_N - placedN() - mState().baked.length;   // あと何回焼けるか（棚のマス＋天板のおかわり − 棚にある − 天板にある・11/21 おかわり BACK_N）
const shelfRoom = () => mRoomN() > 0;
const isNewRecipe = key => !(key in S.recipes);
/* 下の材料だなに出す素材：倉庫にあるモンスター素材（だいじなので先頭）＋基本素材（仲間の素材は来てから） */
const trayMats = () => [...Object.keys(MATS).filter(m => isMonMat(m) && (S.stock[m] || 0) > 0), ...shopMats()];
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

/* ---------- キッチン ---------- */
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
  if (!shelfRoom()) return '棚がいっぱい！商品を並べよう';
  return '';
}
function toOven(m) {
  const M = mState(), ng = bakeNg();
  if (ng) return ng !== 'busy' && toast(ng);
  const m0 = S.money;
  if (M.oven.length >= 2 || !mUse([m])) return;
  M.oven.push(m); save(); mSe('drop'); if (S.money < m0) mSe('buy', { vol: 0.7 });
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
  const m0 = S.money;
  if (!mUse([a, b])) { save(); return renderMorning(); }
  M.oven = [a, b]; save(); mSe('drop'); if (S.money < m0) mSe('buy', { vol: 0.7 });
  bake();
}
/* 焼けたら、作業台の天板へ（オーブンの上にぽん → 天板へ飛ぶ） */
function bake() {
  const M = mState(); if (mBusy || M.oven.length < 2) return;
  const key = recipeKey(M.oven[0], M.oven[1]), fresh = isNewRecipe(key);
  const run = () => {
    mBusy = true; renderMorning(); mSe('bake'); mKoe(Math.random() < 0.5 ? 'hono-ei' : 'hono-sore');
    setTimeout(() => {
      mBusy = false; M.oven = [];
      if (fresh) { S.recipes[key] = S.day; S.today.flashes.push(key); }
      S.today.made.push(key); M.baked.push({ key, n: BATCH }); save();
      renderMorning(); const t = mFly(key, fresh);
      mSe('done'); if (fresh) { mJg('jg-hirameki'); setTimeout(() => mKoe('hono-yatta'), 250); }
      if (S.day === 1 && !S.seen.mBaked) { S.seen.mBaked = 1; save(); setTimeout(() => talk([...STORY.mTut.baked, ...STORY.mTut.shelf], () => {}), t); }
    }, REDUCED ? 300 : BAKE_MS);
  };
  if (S.day === 1 && !S.seen.mBake) { S.seen.mBake = 1; save(); talk(STORY.mTut.bake, run); }
  else run();
}
/* できたお菓子の札が、オーブンの上にぽんと出て、天板の最後のお菓子へ飛ぶ（transform と opacity だけ）。かかる時間を返す */
function mFly(key, fresh) {
  const ov = document.querySelector('.m-oven'), to = document.querySelector('.mb-row .mb-item:last-child');
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
    const go1 = f.animate([{ transform: 'translate(0,0) scale(1)', opacity: 1 }, { transform: `translate(${dx}px,${dy}px) scale(.35)`, opacity: .2 }], { duration: go, easing: 'cubic-bezier(.5,0,.7,1)', fill: 'forwards' });
    go1.onfinish = () => {
      f.remove();
      document.querySelectorAll('.m-wait').forEach(x => x.classList.remove('m-wait'));
      const last = document.querySelector('.mb-row .mb-item:last-child'); if (last) last.classList.add('pop');
    };
  }, pop + hold);
  return pop + hold + go;
}

/* ---------- 商品を並べる（陳列）：天板のお菓子 → 棚のマスへ。まんなかは看板の枠 ---------- */
const dSlots = () => shelfSlots(mState().kanban);
function dFixKan() { const M = mState(); if (M.kanban && !S.shelf.some(s => s.key === M.kanban && s.n > 0)) M.kanban = null; }
/* 同じお菓子が2マスあるとき、看板にしたほうを先に（shelfSlots は同じお菓子の1つ目を看板の枠に入れる・11/19） */
function dFront(s) {
  const i = S.shelf.indexOf(s), j = S.shelf.findIndex(x => x.key === s.key);
  if (j >= 0 && i > j) { S.shelf[i] = S.shelf[j]; S.shelf[j] = s; }
}
function dPop(item) {
  const i = S.shelf.indexOf(item), el = i >= 0 && document.querySelector(`.md-case [data-mdrag="ds:${i}"]`);
  if (el) el.classList.add('pop');
}
/* 天板の wi 番目を、棚の idx のマスへ（idx なし＝空いたマスへ）。入っていたお菓子は天板へもどす */
function dPut(wi, idx) {
  const M = mState(), b = M.baked[wi]; if (!b) return;
  const { slots, ks } = dSlots();
  if (idx == null) {
    idx = slots.findIndex((o, j) => !o && j !== ks);
    if (idx < 0) idx = slots[ks] ? -1 : ks;
    if (idx < 0) return toast('棚がいっぱい！');
  }
  const o = slots[idx], so0 = mSoroiN(), pz0 = mPzN();
  M.baked.splice(wi, 1);
  if (o) M.baked.push(S.shelf.splice(o.i, 1, b)[0]);
  else S.shelf.push(b);
  if (idx === ks) { M.kanban = b.key; dFront(b); }
  dFixKan(); save(); renderMorning(); dPop(b);
  mPlaceSe(so0, pz0, idx === ks); mPzFind();
}
/* 棚の si 番目を、棚の idx のマスへ（看板の枠へ・入れかえ・空いたマスへ） */
function dMove(si, idx) {
  const M = mState(), s = S.shelf[si]; if (!s) return;
  const { slots, ks } = dSlots(), o = slots[idx], fromKan = !!slots[ks] && slots[ks].i === si;
  if (o && o.i === si) return;
  const so0 = mSoroiN(), pz0 = mPzN();
  if (idx === ks) { M.kanban = s.key; dFront(s); }
  else if (fromKan) M.kanban = o ? S.shelf[o.i].key : null;
  else if (o) { S.shelf[si] = S.shelf[o.i]; S.shelf[o.i] = s; }
  else { S.shelf.splice(si, 1); S.shelf.push(s); }
  save(); renderMorning(); dPop(s);
  mPlaceSe(so0, pz0, idx === ks); mPzFind();
}
function dOff(si) {
  const M = mState(), s = S.shelf.splice(si, 1)[0]; if (!s) return;
  M.baked.push(s); dFixKan(); save(); renderMorning(); mSe('place', { rate: 0.9 });
}
/* 棚のお菓子をタップ：看板にする（看板ならはずす） */
function dKan(si) {
  const M = mState(), s = S.shelf[si]; if (!s) return;
  const { slots, ks } = dSlots();
  M.kanban = slots[ks] && slots[ks].i === si ? null : s.key;
  if (M.kanban) dFront(s);
  save(); renderMorning(); dPop(s); mSe(M.kanban ? 'kanban' : 'place');
}
/* お店を開ける：並べていないお菓子は空いたマスへ → 昼へ（すぐ営業） */
function mOpen() {
  const M = mState(); if (mBusy) return;
  if (placedN() + M.baked.length > 0 && !M.kanban) return toast('看板にするお菓子を、まんなかに置いてね');
  while (M.baked.length && S.shelf.length < shelfMaxN()) S.shelf.push(M.baked.shift());   // 棚に入らないぶんは天板でおかわり（営業中に補充・11/21）
  S.seen.dayPre = 1; save();
  mSe('door'); mKoe('hono-yoshi');
  goDay();
  if (S.dayRun && S.dayRun.kanban) openDay();
}

/* ---------- 雑貨屋（お店のグッズ） ---------- */
function goodNext(id) {
  if (id.startsWith('t-')) { const t = M_TOOLS.find(x => 't-' + x.id === id); return t && mToolOpen(t.id) && !mToolHas(t.id) ? t.price : null; }
  if (id === 'tatekanban') { const lv = S.goods.tatekanban || 0; return lv < GOODS.tatekanban.price.length ? GOODS.tatekanban.price[lv] : null; }
  if (id === 'showcase') { const lv = S.goods.showcase || 0; return lv < GOODS.showcase.price.length && shelfMaxN() < SHELF_MAX ? GOODS.showcase.price[lv] : null; }
  const d = decoById(id); return d && decoOpen(d) && !S.goods[id] ? d.price : null;   // お店のかざり（11/21・hiru.js の DECO_LIST）
}
function buyGood(id) {
  const p = goodNext(id); if (p == null || mBusy) return;
  if (S.money < p) return toast('お財布がたりない……');
  S.money -= p;
  if (id === 'showcase') { S.goods.showcase = (S.goods.showcase || 0) + 1; S.shelfMax = Math.min(SHELF_MAX, shelfMaxN() + GOODS.showcase.add); toast('棚のマスがふえた！'); }
  else if (id === 'tatekanban') { S.goods.tatekanban = (S.goods.tatekanban || 0) + 1; toast('立て看板を置いた！お客さんがふえるよ'); }
  else if (id.startsWith('t-')) { S.goods[id] = 1; toast((M_TOOLS.find(x => 't-' + x.id === id) || {}).name + 'が、お店にきた！'); }
  else { const d = decoById(id); S.goods[id] = 1; S.goods['at:' + d.spot] = d.n; toast(`${d.name}を、${mDecoSpot(d.spot)}にかざった！`); }
  save(); renderMorning(); mSe('buy'); mDecoSet();
}

/* ---------- つかんで動かす（夜の drag.js と同じ考え方：はなした所で決まる・行き先が光る・札） ----------
   mat:<素材>（材料だな）・oven:<i>（オーブンの丸）・wait:<i>（陳列の天板）・ds:<i>（陳列の棚のお菓子＝S.shelf の i 番目）
   行き先：oven・slot:<i>（オーブン）・mat:<素材>・tray（材料だな）・ds:<マス>（棚のマス）・wait（陳列の天板） */
function mCan(src) {
  const [k, a] = src.split(':');
  if (k === 'mat') return v => shelfRoom() && (v === 'oven' || v.startsWith('slot:') ? mOk([a]) : v.startsWith('mat:') && mOk([a, v.slice(4)]));
  if (k === 'oven') return v => v === 'tray';
  if (k === 'wait') return v => v.startsWith('ds:');
  if (k === 'ds') return v => v === 'wait' || (v.startsWith('ds:') && (dSlots().slots[+v.slice(3)] || {}).i !== +a);
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
  if (v === 'wait') return '天板にもどす';
  const { slots, ks } = dSlots(), j = +v.slice(3);
  if (j === ks) return '看板にする';
  return slots[j] ? 'いれかえる' : k === 'wait' ? '棚に並べる' : 'ここへ動かす';
}
function mDown(e) {
  if (e.button > 0 || mBusy || talking() || MD) return;
  const el = e.target.closest('[data-mdrag]'); if (!el) return;
  e.preventDefault();
  const tray = el.closest('.mt-row');
  MD = { el, src: el.dataset.mdrag, id: e.pointerId, x0: e.clientX, y0: e.clientY, moved: false, g: null, over: null, can: null, tip: null, tray, sl0: tray ? tray.scrollLeft : 0, scroll: false };
  window.addEventListener('pointermove', mMove);
  window.addEventListener('pointerup', mUp);
  window.addEventListener('pointercancel', mEnd);
}
function mGrab() {
  MD.moved = true; MD.can = mCan(MD.src); mSe('pick');
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
  /* トレーが横にはみ出しているとき、横にすべらせたらスクロール（上へ動かしたら、つかむ） */
  if (MD.scroll) { MD.tray.scrollLeft = MD.sl0 - dx; return; }
  if (!MD.moved) {
    if (Math.hypot(dx, dy) < 8) return;
    if (MD.tray && MD.tray.scrollWidth > MD.tray.clientWidth + 2 && Math.abs(dx) > Math.abs(dy) * 1.2) { MD.scroll = true; return; }
    mGrab();
  }
  MD.g.style.transform = `translate(${dx}px,${dy}px) scale(1.08)`;
  const hit = document.elementFromPoint(e.clientX, e.clientY), t = hit && hit.closest('[data-mdrop]');
  const ok = t && MD.can(t.dataset.mdrop) ? t : null;
  if (ok !== MD.over) {
    if (MD.over) MD.over.classList.remove('hot');
    MD.over = ok; if (ok) ok.classList.add('hot');
    MD.tip.hidden = !ok; if (ok) MD.tip.textContent = mTipText(MD.src, ok.dataset.mdrop);
  }
  /* 札は指から遠いほう：指が下半分なら上の舞台（棚）の上、上半分なら下の材料だな（天板）の上 */
  if (ok) {
    const st = document.querySelector('#mstage, .md-room'), tr = document.querySelector('.mtray, .md-wait');
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
  const { src, moved, over, scroll } = MD; mEnd();
  if (scroll) return;
  if (!moved) return mTap(src);
  if (over) mDrop(src, over.dataset.mdrop);
}
/* タップはすぐ動く：材料はオーブンへ・オーブンの素材はもどす・天板のお菓子は空いたマスへ・棚のお菓子は看板に */
function mTap(src) {
  const [k, a] = src.split(':');
  if (k === 'mat') toOven(a);
  else if (k === 'oven') fromOven(+a);
  else if (k === 'wait') dPut(+a);
  else if (k === 'ds') dKan(+a);
}
function mDrop(src, v) {
  const [k, a] = src.split(':');
  if (k === 'mat') return v.startsWith('mat:') ? mixTwo(a, v.slice(4)) : toOven(a);
  if (k === 'oven') return fromOven(+a);
  if (k === 'wait') return dPut(+a, +v.slice(3));
  if (k === 'ds') return v === 'wait' ? dOff(+a) : dMove(+a, +v.slice(3));
}

/* ---------- 画面 ---------- */
/* 材料だなの1つ：基本素材は値札（お財布がたりなくて持っていなければ灰色）・持っていれば数（赤い丸）。モンスター素材は「とくべつ」 */
function mTile(m) {
  const n = S.stock[m] || 0, H = HIRU_MATS[m];
  const tag = H ? `<span class="mt-pr">${fmt(H.price)}円</span>` : '<span class="mt-pr sp">とくべつ</span>';
  return `<div class="mt${isMonMat(m) ? ' mmat' : ''}${!n && H && H.price > S.money ? ' poor' : ''}" data-mdrag="mat:${m}" data-mdrop="mat:${m}">${matIcon(m)}<span class="mt-nm" style="--n:${[...mTileNm(m)].length}">${esc(mTileNm(m))}</span>${tag}${n ? `<em class="mt-n">${n}</em>` : ''}</div>`;
}
/* オーブンの上の札：つぎにすること */
function mHint(M) {
  if (mBusy) return '焼いてるよ……';
  if (!shelfRoom()) return '棚がいっぱい！商品を並べよう';
  return M.oven.length ? 'あと1つ！' : '材料を2つ入れてね';
}
function kitchenHTML(M) {
  const bg = ART['bg-morning'], room = mRoomN();
  const ovenSlots = [0, 1].map(i => {
    const m = M.oven[i];
    return m ? `<span class="mo-slot full" data-mdrag="oven:${i}" data-mdrop="slot:${i}">${matIcon(m)}</span>` : `<span class="mo-slot" data-mdrop="slot:${i}"></span>`;
  }).join('<i class="mo-plus">+</i>');
  const spent = mSpent ? `<i class="m-spent">−${fmt(mSpent)}円</i>` : ''; mSpent = 0;
  const wait = !mBusy && M.oven.length < 2 && shelfRoom();
  const baked = M.baked.map(b => `<span class="mb-item">${candyIcon(b.key)}</span>`).join('');
  return `<section class="morning mkitchen fit${mBusy ? ' busy' : ''}" id="msec">
    <div class="mstage${mBusy ? ' baking' : ''}${bg ? '' : ' noart'}" id="mstage"${bg ? ` style="--bgimg:url('${bg}')"` : ''}>
      <span class="m-wallet">お財布 <b>${fmt(S.money)}</b>円${spent}</span>
      ${fcChipHTML()}
      <div class="m-tools">${mAutoBakeOk() ? `<button class="pill sub" data-act="m-auto"${mBusy ? ' disabled' : ''}>きのうと同じに焼く</button>` : ''}<button class="round m-bookb" data-act="m-book" aria-label="レシピ帳">${ART['ui-book'] ? `<img class="m-bookimg" src="${ART['ui-book']}" alt="">` : M_BOOK_SVG}</button></div>
      <div class="m-oven${wait ? ' wait' : ''}" data-mdrop="oven"><i class="mo-glow"></i><i class="mo-steam"></i><span class="mo-row"><span class="mo-hint">${mHint(M)}</span><span class="mo-slots">${ovenSlots}</span></span></div>
      <div class="m-baked"><span class="mb-lbl">焼けたお菓子<em>${room > 0 ? `あと${room}つ焼ける` : '棚がいっぱい'}</em></span><span class="mb-row">${baked || '<i class="mb-none">焼けたら、ここにならぶよ</i>'}</span></div>
    </div>
    <div class="mtray gingham" data-mdrop="tray"><span class="mt-lbl">材料だな</span><div class="mt-row">${trayMats().map(mTile).join('')}</div></div>
    <div class="m-bar"><button class="sub" data-act="m-zakka">雑貨屋</button><button class="big" data-act="m-disp"${mBusy ? ' disabled' : ''}>商品を並べる</button></div>
  </section>`;
}
function mSlotHTML(o, idx, ks, rib = '') {
  const kan = idx === ks ? ' kan' : '', kl = kan ? '<span class="d-kl">看板</span>' : '';
  if (!o) return `<div class="dslot empty${kan}" data-mdrop="ds:${idx}">${kl}</div>`;
  return `<div class="dslot${kan}" data-mdrag="ds:${o.i}" data-mdrop="ds:${idx}">${kl}${candyIcon(o.s.key)}<span class="d-nm${dNmLong(candyOf(o.s.key).name)}">${esc(candyOf(o.s.key).name)}</span><span class="d-dots">${'<i></i>'.repeat(Math.max(0, Math.min(6, o.s.n)))}</span>${rib}</div>`;
}
function displayHTML(M) {
  const bg = ART['bg-day'], { slots, ks } = dSlots();
  const full = slots.every((o, j) => o || j === ks) && !!slots[ks];
  const tip = M.baked.length && full ? 'のこりは天板に。売り切れたら補充！' : M.baked.length ? 'お菓子を棚へ。まんなかは今日の看板！' : M.kanban ? `今日の看板は ${candyOf(M.kanban).name}` : placedN() ? '看板にするお菓子を、まんなかへ' : '棚がからっぽ……キッチンで焼こう';
  const wait = M.baked.map((b, i) => `<div class="mw" data-mdrag="wait:${i}">${candyIcon(b.key)}<span class="mw-nm">${mNmBr(candyOf(b.key).name)}</span></div>`).join('');
  return `<section class="morning mdisp fit" id="msec">
    <div class="md-room${bg ? '' : ' noart'}"${bg ? ` style="--bgimg:url('${bg}')"` : ''}>
      <p class="md-tip">${esc(tip)}</p>${mToolHas('doll') && (M.baked.length || placedN()) ? '<button class="pill sub md-autob" data-act="m-arr">おまかせで並べる</button>' : ''}
      <button class="round md-aishob" data-act="m-aisho" aria-label="相性帳">${ART['ui-aisho-book'] ? `<img src="${ART['ui-aisho-book']}" alt="">` : '<b>相性</b>'}</button>
      <div class="dcase md-case" style="--rows:${Math.ceil(slots.length / SHELF_COLS)}">${(rib => slots.map((o, i) => mSlotHTML(o, i, ks, rib[i])).join(''))(dCaseDeco(slots))}</div>
    </div>
    <div class="md-wait gingham" data-mdrop="wait"><span class="mw-lbl">天板</span><div class="mt-row">${wait || '<p class="mw-empty">焼けたお菓子は、ぜんぶ並べたよ</p>'}</div></div>
    <div class="m-bar"><button class="sub" data-act="m-kitchen">キッチンへ</button><button class="big" data-act="m-open">お店を開ける</button></div>
  </section>`;
}
function zakkaHTML() {
  const body = `<div class="ms-goods">${['tatekanban', 'showcase'].map(id => {
    const G = GOODS[id] || GOODS.kazari.find(k => k.id === id), p = goodNext(id);
    const lv = id === 'tatekanban' ? S.goods.tatekanban || 0 : id === 'showcase' ? S.goods.showcase || 0 : 0;
    const tx = GOODS[id] ? G.text : '見た目だけ';
    const done = id === 'tatekanban' || id === 'showcase' ? 'これ以上は置けない' : 'かざった';
    return `<div class="ms-good${mGoodIco('good-' + id) ? ' hasico' : ''}">${mGoodIco('good-' + id)}<span class="msg-nm">${esc(G.name)}${lv ? `<em>${lv}こ</em>` : ''}</span><span class="msg-tx">${tx}</span>${p == null ? `<span class="msg-done">${done}</span>` : `<button class="sub" data-act="m-good" data-id="${id}"${S.money < p ? ' disabled' : ''}>${fmt(p)}円</button>`}</div>`;
  }).join('')}${mToolRows()}${mDecoRows()}</div>`;
  const sbg = ART['bg-zakka'];
  return `<section class="morning mzakka fit" id="msec">
    <div class="mz-wrap"><div class="shopov mshop${sbg ? ' ms-bg' : ''}"${sbg ? ` style="--msbg:url('${sbg}')"` : ''}>
      <div class="ms-top"><span class="ms-ttl">雑貨屋</span></div>
      ${body}
    </div></div>
    <div class="mz-foot gingham"><span class="mz-wallet">お財布 <b>${fmt(S.money)}</b>円</span><p class="mz-hint">立て看板とショーケースは、つぎの日からずっと効くよ</p></div>
    <div class="m-bar"><button class="big" data-act="m-kitchen">キッチンへもどる</button></div>
  </section>`;
}
function renderMorning() {
  const M = mState(), v = M.view;
  $('screen').innerHTML = v === 'display' ? displayHTML(M) : v === 'zakka' ? zakkaHTML() : v === 'book' ? bookHTML() : v === 'aisho' ? aishoBookHTML() : kitchenHTML(M);
  $('msec').addEventListener('pointerdown', mDown);
  /* トレーの右にまだあるときは、右はしに「›」（すべるのは中の .mt-row・ふちの外枠はすべらない） */
  document.querySelectorAll('#msec .mt-row').forEach(el => {
    const f = () => el.parentElement.classList.toggle('more', el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
    f(); el.addEventListener('scroll', f, { passive: true });
  });
  if (v === 'kitchen' && !M.talked && !talking()) {
    M.talked = true;
    const tut = S.day === 1 && !S.seen.mOven ? (S.seen.mOven = 1, STORY.mTut.oven) : [];
    const lines = [...STORY.morning(S.today, S.yesterday), ...tut];
    save();
    if (lines.length) talk(lines, () => {});
  }
  if (v === 'display' && S.day === 1 && !S.seen.dayPre && !talking() && placedN() + M.baked.length) { S.seen.dayPre = 1; save(); talk(STORY.dayPre, () => {}); }
  /* はじめて おそろいの段ができたとき1回だけ、ほのかのひとこと（11/19） */
  if (v === 'display' && !S.seen.soroi && !talking()) {
    const so = soroiRows(dSlots().slots);
    if (so.length) { S.seen.soroi = S.day; save(); talk(STORY.soroiFirst(so[0].mats[0]), () => {}); }
  }
  if (v === 'kitchen' && M.oven.length === 2 && !mBusy) setTimeout(bake, 0);   // 焼いているとちゅうで閉じたとき
  dPreload(v === 'display' ? D_PRE_DAY() : D_PRE_MORNING());   // つぎの画面の絵を先に読む（11/19・2回は読まない）
}
function mView(v) { const M = mState(); M.view = v; save(); renderMorning(); }

/* ---------- べんり道具（11/19・hiru.js の M_TOOLS）：雑貨屋の行・おまかせオーブン・からくり陳列人形 ---------- */
/* 雑貨屋のグッズとべんり道具の絵（H-027：good-<id>・tool-<id>。届くまでは字だけ） */
const mGoodIco = n => ART[n] ? `<img class="msg-ico" src="${ART[n]}" alt="">` : '';
/* お店のかざり（11/21・hiru.js の DECO_LIST）：テーマごとに見出し（いくつかざっているか・効果）→ 5か所のかざり。買うとその場所にかざる・持っているものは「かざる」でえらびなおす */
const mDecoSpot = sp => (DECO_SPOTS.find(x => x[0] === sp) || [])[1] || '';
function mDecoRows() {
  const P = decoPts();
  let h = '<p class="ms-sec ms-sec2">お店のかざり<em>場所ごとに1つ・同じテーマを3つ・5つでセット効果</em></p>';
  for (const th of Object.keys(DECO_TH)) {
    const L = DECO_LIST.filter(d => d.th === th && (decoOpen(d) || S.goods[d.id])); if (!L.length) continue;
    const [t1, t2] = decoFxText(th), n = P[th] || 0;
    h += `<div class="ms-dth${n >= 3 ? ' on' : ''}"><span class="mdt-nm">${esc(DECO_TH[th].name)}${th === 'kihon' ? '' : `<em>${n}/5</em>`}</span><span class="mdt-fx">${esc(t1)}${t2 ? `<br>${esc(t2)}` : ''}</span></div>`;
    h += L.map(d => {
      const own = !!S.goods[d.id], at = decoAt(d.spot) === d, p = goodNext(d.id);
      const btn = at ? `<button class="sub" data-act="m-deco" data-id="${d.id}" data-off="1">はずす</button>`
        : own ? `<button class="sub" data-act="m-deco" data-id="${d.id}">かざる</button>`
        : p == null ? '<span class="msg-done">まだ</span>' : `<button class="sub" data-act="m-good" data-id="${d.id}"${S.money < p ? ' disabled' : ''}>${fmt(p)}円</button>`;
      const ico = mGoodIco(d.art);
      return `<div class="ms-good${ico ? ' hasico' : ''}${at ? ' at' : ''}">${ico}<span class="msg-nm">${esc(d.name)}<em>${mDecoSpot(d.spot)}</em></span><span class="msg-tx">${at ? 'かざってる' : own ? '持ってる' : ''}</span>${btn}</div>`;
    }).join('');
  }
  return h;
}
function mDeco(id, off) {
  const d = decoById(id); if (!d || !S.goods[id] || mBusy) return;
  S.goods['at:' + d.spot] = off ? 0 : d.n;
  if (!off) toast(`${d.name}を、${mDecoSpot(d.spot)}にかざった！`);
  save(); renderMorning(); mSe(off ? 'tap' : 'place'); if (!off) mDecoSet();
}
/* はじめて同じテーマを3つそろえたとき、ひとこと（1回だけ・STORY.decoSet） */
function mDecoSet() {
  const P = decoPts(), th = Object.keys(P).find(k => P[k] >= 3 && !S.seen['ds:' + k]);
  if (!th || talking() || !(STORY.decoSet || {})[th]) return;
  S.seen['ds:' + th] = S.day; save(); talk(STORY.decoSet[th], () => {});
}
function mToolRows() {
  const open = M_TOOLS.filter(t => mToolOpen(t.id)); if (!open.length) return '';
  return `<p class="ms-sec">べんり道具</p>` + open.map(t => {
    const id = 't-' + t.id, p = goodNext(id);
    return `<div class="ms-good${mGoodIco('tool-' + t.id) ? ' hasico' : ''}">${mGoodIco('tool-' + t.id)}<span class="msg-nm">${esc(t.name)}</span><span class="msg-tx">${esc(t.text)}</span>${p == null ? '<span class="msg-done">お店にある</span>' : `<button class="sub" data-act="m-good" data-id="${id}"${S.money < p ? ' disabled' : ''}>${fmt(p)}円</button>`}</div>`;
  }).join('');
}
/* おまかせオーブン：きのう作ったお菓子（S.yesterday.made の順）を、棚のあきと お財布のぶんだけ まとめて焼く */
const mAutoList = () => ((S.yesterday && S.yesterday.made) || []).filter(k => String(k).split('+').every(m => HIRU_MATS[m] || isMonMat(m)));
const mAutoBakeOk = () => mToolHas('oven') && mAutoList().length > 0 && shelfRoom();
function mAutoBake() {
  const M = mState(); if (mBusy || !mAutoBakeOk()) return;
  for (const m of M.oven.splice(0)) S.stock[m] = (S.stock[m] || 0) + 1;
  let made = 0, skip = 0;
  for (const key of mAutoList()) {
    if (!shelfRoom()) break;
    const mats = key.split('+');
    if (!mOk(mats)) { skip++; continue; }
    mUse(mats); S.today.made.push(key); M.baked.push({ key, n: BATCH }); made++;
  }
  save();
  mBusy = true; renderMorning();
  setTimeout(() => {
    mBusy = false; renderMorning();
    toast(made ? `${made}つ焼けた！` + (skip ? `（${skip}つは材料が足りなかった）` : '') : 'お財布か材料が足りなかった……');
  }, REDUCED ? 300 : BAKE_MS);
}
/* からくり陳列人形：棚と天板のお菓子を、看板（きまっていなければ いちばん高いお菓子）とおそろいの段を考えて並べなおす */
function mAutoArrange() {
  const M = mState(); if (mBusy) return;
  const n = shelfMaxN(), ks = kanbanSlot(n), rows = n / SHELF_COLS;
  const pool = [...S.shelf.filter(x => x.n > 0), ...M.baked];
  if (!pool.length) return;
  const price = o => candyOf(o.key).price;
  pool.sort((a, b) => price(b) - price(a));
  const slots = Array(n).fill(null);
  const kan = (M.kanban && pool.find(o => o.key === M.kanban)) || pool[0];
  slots[ks] = kan; pool.splice(pool.indexOf(kan), 1);
  /* 段ごとに、のこりのお菓子に いちばん多くふくまれる素材でそろえる（看板の段は看板の素材から） */
  const order = [Math.floor(ks / SHELF_COLS), ...Array.from({ length: rows }, (_, r) => r).filter(r => r !== Math.floor(ks / SHELF_COLS))];
  for (const r of order) {
    const idx = Array.from({ length: SHELF_COLS }, (_, c) => r * SHELF_COLS + c), free = idx.filter(i => !slots[i]);
    const fixed = idx.filter(i => slots[i]).map(i => slots[i]);
    const cand = [...new Set(pool.flatMap(o => o.key.split('+')))].filter(m => fixed.every(o => candyHas(o.key, m)));
    let best = null, bc = 0;
    for (const m of cand) { const c = pool.filter(o => candyHas(o.key, m)).length; if (c >= free.length && c > bc) { best = m; bc = c; } }
    if (!best) continue;
    for (const i of free) { const o = pool.find(x => candyHas(x.key, best)); slots[i] = o; pool.splice(pool.indexOf(o), 1); }
  }
  for (let i = 0; i < n && pool.length; i++) if (!slots[i]) slots[i] = pool.shift();
  /* shelfSlots は看板を ks に置き、のこりを前からつめる → 看板いがいの並びがそのまま段になるよう、ks をとばした順で */
  S.shelf = [slots[ks], ...slots.filter((o, i) => o && i !== ks)];
  M.baked = pool; M.kanban = kan.key;
  save(); renderMorning(); toast('からくり人形が、並べてくれた！');
}

/* ---------- レシピ帳（11/19 しょーくん「作り込みとほのかの一言をクスッとくるように」）：ひらめいたお菓子と、ほのかのひとこと（STORY.note） ---------- */
/* レシピ帳の本（ui-book）・まだのお菓子のふた（ui-mada）は描き下ろしが届いたら自動で出る（11/19 しょーくん「レシピ帳のアイコンが描き下ろされてなかった」→ H-033） */
/* 天板の名前の2行：ことばの切れ目だけで折る（11/19 しょーくん「天板の文字改行がやっぱり気になる」＝かりかりラス／ク になっていた）
   かたかなのかたまりの前後で切る（野いちご・のど飴はひとまとまり）。かたかなだけの長い名前は、お菓子の形の名前の前で切る（カスタード／プリン） */
const M_NM_TAIL = ['キャラメル', 'キャンディ', 'クッキー', 'シフォン', 'スコーン', 'ババロア', 'カステラ', 'ドロップ', 'ケーキ', 'アイス', 'プリン', 'タルト', 'ゼリー', 'サブレ', 'ムース', 'ティー', 'パフェ', 'ボーロ', 'スフレ', 'ソルベ', 'ジャム', 'ラスク'];
function mNmBr(nm) {
  const out = [];
  for (const s of String(nm).match(/[ァ-ヶー]+|[^ァ-ヶー]+/g) || [String(nm)]) {
    const t = /^[ァ-ヶー]{6,}$/.test(s) && M_NM_TAIL.find(w => s.endsWith(w) && s.length - w.length >= 2);
    if (t) out.push(s.slice(0, -t.length), t); else out.push(s);
  }
  return out.map(esc).join('<wbr>');
}
const M_BOOK_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5.5c2.6-1 5.2-1 8 .6 2.8-1.6 5.4-1.6 8-.6v13c-2.6-1-5.2-1-8 .6-2.8-1.6-5.4-1.6-8-.6z" fill="#fff4e4" stroke="#5a3418" stroke-width="1.6" stroke-linejoin="round"/><path d="M12 6.1v13" stroke="#5a3418" stroke-width="1.4"/><path d="M6.5 9h3.5M6.5 12h3.5M14 9h3.5M14 12h3.5" stroke="#e8607a" stroke-width="1.2" stroke-linecap="round"/></svg>';
const M_FORMS = ['mugi', 'hachimitsu', 'milk', 'egg', 'ichigo', 'mizuame', 'herb'];
function mBookSecs() {
  const base = Object.keys(HIRU_RECIPES), known = k => S.recipes && S.recipes[k] != null;
  const secs = [
    { ttl: 'きほんのお菓子', keys: base.filter(k => !k.includes('mizuame') && !k.includes('herb')) },
    { ttl: 'みなもの水あめ', keys: base.filter(k => k.includes('mizuame') && !k.includes('herb')), show: matUnlocked('mizuame') },
    { ttl: 'わかばのハーブ', keys: base.filter(k => k.includes('herb')), show: matUnlocked('herb') },
  ];
  const seen = new Set(typeof seenMats === 'function' ? seenMats() : []);
  for (const m of Object.keys(MON_WORD)) secs.push({ ttl: (MON_WORD[m]) + '（' + matShort(m) + '）', keys: M_FORMS.map(f => recipeKey(m, f)), mon: m, show: seen.has(m) || Object.keys(S.recipes || {}).some(k => k.split('+').includes(m)) });
  const par = Object.keys(S.recipes || {}).find(k => { const [a, b] = k.split('+'); return isMonMat(a) && isMonMat(b); });
  secs.push({ ttl: 'とくべつ', keys: [par || 'parfait'], par: true, show: !!par || Object.keys(MON_WORD).filter(m => seen.has(m)).length >= 2 });
  for (const x of secs) x.known = x.keys.filter(k => known(k));
  return secs;
}
/* 相性帳（11/21）：見つけた となりの相性（hiru.js の AISHO）。見つけていないものは「？？？」と素材1つのヒント（その素材を見たことがあるときだけ） */
function aishoBookHTML() {
  const seen = new Set(seenMats()), got = AISHO.filter(p => S.seen['ai:' + p.id]).length;
  const rows = AISHO.map(p => {
    if (S.seen['ai:' + p.id]) return `<div class="ms-good bk-rec ai-rec"><span class="bk-ico ai-ico">${matIcon(p.a)}${matIcon(p.b)}</span><span class="bk-body"><span class="bk-nm">${esc(p.name)}<em>${esc(matShort(p.a))}×${esc(matShort(p.b))}</em></span><span class="bk-note">${esc(STORY.aishoNote(p))}</span></span></div>`;
    const h = seen.has(p.a) ? matShort(p.a) + '×？' : seen.has(p.b) ? matShort(p.b) + '×？' : '？×？';
    return `<div class="ms-good bk-rec un"><span class="bk-ico${ART['ui-mada'] ? ' art' : ''}">${ART['ui-mada'] ? `<img src="${ART['ui-mada']}" alt="">` : ''}<b>？</b></span><span class="bk-body"><span class="bk-nm">？？？<em>${esc(h)}</em></span><span class="bk-note">となりに並べると、見つかるかも</span></span></div>`;
  }).join('');
  const sbg = ART['bg-zakka'];
  return `<section class="morning mzakka mbook fit" id="msec">
    <div class="mz-wrap"><div class="shopov mshop${sbg ? ' ms-bg' : ''}"${sbg ? ` style="--msbg:url('${sbg}')"` : ''}>
      <div class="ms-top"><span class="ms-ttl">相性帳</span><span class="bk-cnt">${got} / ${AISHO.length}</span></div>
      <div class="ms-goods"><p class="ms-sec">となりの相性<em>どちらかが売れると、いっしょに売れる</em></p>${rows}
        <p class="ms-sec">たての列のシリーズ<em>たての列を同じなかまでそろえる</em></p>${Object.keys(KATA).map(k => `<div class="ms-good bk-rec ai-kata"><span class="bk-body"><span class="bk-nm">${KATA[k]}</span><span class="bk-note">${esc(STORY.kataNote[k])}</span></span></div>`).join('')}</div>
    </div></div>
    <div class="mz-foot gingham"><p class="mz-hint bk-top"><b>ほのか</b>${esc(STORY.aishoTop(got))}</p></div>
    <div class="m-bar"><button class="big" data-act="m-disp">棚にもどる</button></div>
  </section>`;
}
function bookHTML() {
  const secs = mBookSecs();
  STORY.bookAll = 15 + 6 + 7 + Object.keys(MON_WORD).length * 7 + 1;
  const got = secs.reduce((a, x) => a + x.known.length, 0);
  const note = (k, x) => x.par ? STORY.parfait : x.mon ? (STORY.monNote[x.mon] || [''])[M_FORMS.indexOf(k.split('+').find(m => m !== x.mon) || x.mon) % (STORY.monNote[x.mon] || ['']).length] : (STORY.note[k] || '');
  const row = (k, x) => {
    if (S.recipes && S.recipes[k] != null) {
      const c = candyOf(k);
      return `<div class="ms-good bk-rec"><span class="bk-ico">${candyIcon(k)}</span><span class="bk-body"><span class="bk-nm">${esc(c.name)}<em>${c.mats.map(matShort).join('＋')}</em></span><span class="bk-note">${esc(note(k, x))}</span></span></div>`;
    }
    const hint = x.par ? '？＋？' : (x.mon ? matShort(x.mon) : matShort(k.split('+')[0])) + '＋？';
    return `<div class="ms-good bk-rec un"><span class="bk-ico${ART['ui-mada'] ? ' art' : ''}">${ART['ui-mada'] ? `<img src="${ART['ui-mada']}" alt="">` : ''}<b>？</b></span><span class="bk-body"><span class="bk-nm">？？？<em>${esc(hint)}</em></span><span class="bk-note">まだ、ひらめいていない</span></span></div>`;
  };
  const body = secs.filter(x => x.show !== false).map(x => `<p class="ms-sec">${esc(x.ttl)}<em>${x.known.length}/${x.keys.length}</em></p>${x.keys.map(k => row(k, x)).join('')}`).join('');
  const sbg = ART['bg-zakka'];
  return `<section class="morning mzakka mbook fit" id="msec">
    <div class="mz-wrap"><div class="shopov mshop${sbg ? ' ms-bg' : ''}"${sbg ? ` style="--msbg:url('${sbg}')"` : ''}>
      <div class="ms-top"><span class="ms-ttl">レシピ帳</span><span class="bk-cnt">${got} / ${STORY.bookAll}</span></div>
      <div class="ms-goods">${body}</div>
    </div></div>
    <div class="mz-foot gingham"><p class="mz-hint bk-top"><b>ほのか</b>${esc(STORY.bookTop(got))}</p></div>
    <div class="m-bar"><button class="big" data-act="m-kitchen">キッチンへもどる</button></div>
  </section>`;
}

/* 朝の画面のボタン（data-act）。main.js の ACTS に入る */
const MORNING_ACTS = {
  'm-zakka': () => mView('zakka'),
  'm-disp': () => { if (!mBusy) mView('display'); },
  'm-kitchen': () => mView('kitchen'),
  'm-open': () => mOpen(),
  'm-shop': el => mView(el.dataset.o === '1' ? 'zakka' : 'kitchen'),   // 前の名前（tools/audit.py の m-shop）
  'm-good': el => buyGood(el.dataset.id),
  'm-deco': el => mDeco(el.dataset.id, el.dataset.off === '1'),
  'm-book': () => { if (!mBusy) mView('book'); },
  'm-aisho': () => mView('aisho'),
  'm-auto': () => mAutoBake(),
  'm-arr': () => mAutoArrange(),
  toShelf: () => renderMorning(),   // 前の形のボタン（main.js の toCard もここへ）
};
