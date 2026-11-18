/* ==== 昼：カウンター越しのお店（持ち主：昼のチャット【okashi-hiru】・11/18 作りなおし）
   流れ：開店前（棚のまんなかの看板の枠に、今日の看板のお菓子を1つ）→ 開店（約40秒。お客さんが正面のカウンターに来て、頭の上の吹き出しにすきな素材）→ 閉店 → 夕方へ
   すきな素材が入ったお菓子が棚にあれば1こ買ってハート（評判）。なければ半分くらいの人がほかのお菓子を1こ買う。1マスの3こが売れたら売り切れ
   昼はお金を見せない（まとめで初めてわかる）。見せるのは「売れた！」とハートだけ
   つなぎ目（リーダー）：flow.js の goDay → startDay()・閉店のボタン data-act="toEvening" → goEvening → stopDay()・画面は render() → renderDay()・ボタンは DAY_ACTS
   数字は src/data/hiru.js・絵は day-scene.js・セリフは story.js ==== */

let dayTick = 0, dayPrev = 0, daySpeed = 1;
/* お客さん1人の流れ（ms・ふつうの速さ）：入ってくる → 吹き出しにすきな素材 → 買う（ハート）か帰る → 出ていく */
const V_ARRIVE = 900, V_ASK = 2200, V_LEAVE = 3500, V_END = 4200;

/* 昼のはじめ（flow.js の goDay から呼ぶ） */
/* 看板は朝の「商品を並べる」で決めたもの（S.morning.kanban）。朝の「お店を開ける」から来たら、すぐ営業（morning.js の mOpen が openDay を呼ぶ） */
function startDay() {
  const k = S.morning && S.morning.kanban, kan = k && S.shelf.some(s => s.key === k && s.n > 0) ? k : null;
  S.dayRun = { open: false, done: false, kanban: kan, t: 0, plan: [], i: 0, cur: null };
}
/* 昼をおえる（flow.js の goEvening から呼ぶ）：売り切れのマスを棚からはずす（売れのこりは次の日も棚に） */
function stopDay() {
  clearTimeout(dayTick); dayTick = 0;
  S.shelf = S.shelf.filter(s => s.n > 0);
}

/* ---------- 棚：3列・看板の枠はまんなか（hiru.js の kanbanSlot） ---------- */
/* kan＝看板の枠に入れるお菓子の key（朝の画面は null） */
function shelfSlots(kan = S.dayRun && S.dayRun.kanban) {
  const n = Math.max(1, Math.min(SHELF_MAX, S.shelfMax || 6)), ks = kanbanSlot(n);
  const slots = Array(n).fill(null), items = S.shelf.map((s, i) => ({ s, i }));
  const k = kan ? items.findIndex(o => o.s.key === kan) : -1;
  if (k >= 0) slots[ks] = items.splice(k, 1)[0];
  let j = 0;
  for (const o of items) {
    while (j < n && (slots[j] || j === ks)) j++;
    if (j >= n) break;
    slots[j++] = o;
  }
  return { slots, ks };
}
function slotHTML(o, idx, ks, pre) {
  const kan = idx === ks ? ' kan' : '', kl = kan ? '<span class="d-kl">看板</span>' : '';
  if (!o) return `<div class="dslot empty${kan}">${kl}</div>`;
  const c = candyOf(o.s.key), out = o.s.n <= 0, tag = pre ? 'button' : 'div';
  return `<${tag} class="dslot${kan}${out ? ' out' : ''}"${pre ? ` data-act="d-pick" data-i="${o.i}"` : ''} data-key="${esc(o.s.key)}">${kl}${candyIcon(o.s.key)}<span class="d-nm">${esc(c.name)}</span><span class="d-dots">${'<i></i>'.repeat(Math.max(0, Math.min(6, o.s.n)))}</span>${out ? '<span class="d-out">うりきれ</span>' : ''}</${tag}>`;
}
function caseHTML(pre) {
  const { slots, ks } = shelfSlots();
  return slots.map((o, i) => slotHTML(o, i, ks, pre)).join('');
}

/* ---------- 画面 ---------- */
function renderDay() {
  if (!S.dayRun) startDay();
  const R = S.dayRun, pre = !R.open && !R.done, empty = !S.shelf.some(s => s.n > 0);
  const sign = pre ? 'じゅんび中' : R.done ? 'へいてん' : 'えいぎょう中';
  let bar;
  if (pre && empty) bar = '<button class="big" data-act="toEvening">今日はお休みして夕方へ</button>';
  else if (pre) bar = '<button class="big" data-act="d-open">お店をあける</button>';
  else if (R.done) bar = '<button class="big" data-act="toEvening">閉店して夕方へ</button>';
  else bar = `<div class="d-bar"><span class="d-lbl">えいぎょう中</span><button class="sub" data-act="d-fast">${daySpeed > 1 ? 'ふつうの速さ' : 'はやおくり'}</button></div>`;
  const tip = !pre ? '' : empty ? '棚がからっぽ……今日はお休みかな' : R.kanban ? `今日の看板は ${candyOf(R.kanban).name}` : '看板にするお菓子を、タップしてえらんでね';
  const rows = Math.ceil(Math.min(SHELF_MAX, S.shelfMax || 6) / SHELF_COLS);
  $('screen').innerHTML = `<section class="day fit">
    <div class="dstage${pre ? ' pre' : ''}" id="dstage" style="--sp:${daySpeed};--p:${R.done ? 1 : Math.min(1, (R.t || 0) / DAY_MS).toFixed(3)}">
      ${dayStageBg(sign)}
      <div class="d-cust" id="dCust"></div>
      ${dayStageFront()}
      <div class="d-jar" id="dJar">${jarHTML()}</div>
      ${tip ? `<p class="d-tip">${esc(tip)}</p>` : ''}
    </div>
    <div class="dcase${pre ? ' pre' : ''}" id="dCase" style="--rows:${rows}">${caseHTML(pre)}</div>
    ${bar}
  </section>`;
  if (R.cur) showCust(R.cur, true);
  if (pre && !empty && S.day === 1 && !S.seen.dayPre && !talking()) talk(STORY.dayPre, () => { S.seen.dayPre = 1; save(); }, { dim: false });
  if (R.open && !R.done) { dayPrev = 0; dayLoop(); }
}

/* 開店前：棚のお菓子をタップすると看板の枠へ（もう一度で外す） */
function pickKanban(i) {
  const R = S.dayRun, s = S.shelf[+i];
  if (!R || R.open || !s) return;
  R.kanban = R.kanban === s.key ? null : s.key;
  save(); renderDay();
}
function openDay() {
  const R = S.dayRun; if (!R || R.open || R.done) return;
  if (!R.kanban) return toast('看板にするお菓子を、えらんでね');
  const go = () => {
    R.open = true; R.t = 0; R.i = 0; R.cur = null;
    R.plan = custPlan(custCount(), R.kanban);
    S.today.kanban = R.kanban; S.today.kanbanSoldOut = false;
    save(); renderDay();
  };
  if (S.day === 1 && !S.seen.dayOpen) { S.seen.dayOpen = 1; save(); talk(STORY.dayOpen, go, { dim: false }); }
  else go();
}

/* ---------- 営業：100ms ごとに進める（会話のあいだは止まる・昼の画面でないときは止まる） ---------- */
function dayLoop() {
  clearTimeout(dayTick); dayTick = 0;
  const R = S.dayRun;
  if (S.phase !== 'day' || !R || !R.open || R.done || !$('dstage')) return;
  const now = performance.now(), dt = dayPrev ? Math.min(250, now - dayPrev) : 0;
  dayPrev = now;
  if (!talking()) dayStep(R, dt * daySpeed);
  if (!R.done) dayTick = setTimeout(dayLoop, 100);
}
function dayStep(R, dt) {
  R.t += dt;
  const st = $('dstage'); if (st) st.style.setProperty('--p', Math.min(1, R.t / DAY_MS).toFixed(3));   // 外の明るさ（ゲージのかわり）
  if (R.cur) return visitStep(R, dt);
  if (!S.shelf.some(s => s.n > 0)) return closeDay('ぜんぶ売り切れ！');
  if (R.i < R.plan.length) { if (R.t >= (R.i + 0.5) * DAY_MS / R.plan.length) startVisit(R); }
  else if (R.t >= DAY_MS) closeDay();
}
function startVisit(R) {
  const p = R.plan[R.i++];
  R.cur = { c: p.c, like: p.like, t: 0, step: 0, res: null };
  S.today.visitors++; save();
  showCust(R.cur, false);
}
function visitStep(R, dt) {
  const v = R.cur; v.t += dt;
  if (v.step === 0 && v.t >= V_ARRIVE) {
    v.step = 1; showBubble(v);
    if (S.day === 1 && !S.seen.dayBubble) { S.seen.dayBubble = 1; save(); talk(STORY.dayBubble, () => {}, { dim: false }); }
  } else if (v.step === 1 && v.t >= V_ASK) {
    v.step = 2; v.res = serve(v); save(); showResult(v, false);
  } else if (v.step === 2 && v.t >= V_LEAVE) {
    v.step = 3; const el = custEl(); if (el) el.classList.add('leave');
  } else if (v.step === 3 && v.t >= V_END) {
    R.cur = null; const el = custEl(); if (el) el.remove(); save();
  }
}
/* 買う：すきな素材が入ったお菓子（看板が先・なければ高いほう）→ ハート。なければ OTHER_BUY の人がほかのを1こ */
function serve(v) {
  const T = S.today, R = S.dayRun, items = S.shelf.filter(s => s.n > 0);
  const liked = items.filter(s => candyHas(s.key, v.like));
  let s = null, love = false;
  if (liked.length) { love = true; s = liked.find(x => x.key === R.kanban) || liked.sort((a, b) => candyOf(b.key).price - candyOf(a.key).price)[0]; }
  else if (items.length && Math.random() < OTHER_BUY) s = pick(items);
  if (!s) return { kind: 'none', say: pick(STORY.cust.none) };
  const price = candyOf(s.key).price;
  s.n--; S.money += price; T.sales += price; T.served++;
  if (s.n <= 0 && s.key === T.kanban) T.kanbanSoldOut = true;
  if (love) { S.rep++; T.hearts++; }
  return { kind: love ? 'love' : 'other', key: s.key, say: pick(STORY.cust[love ? 'love' : 'other']) };
}
function closeDay(msg) {
  const R = S.dayRun; R.done = true; R.cur = null;
  clearTimeout(dayTick); dayTick = 0;
  save(); if (msg) toast(msg);
  renderDay();
  if (S.day === 1 && !S.seen.dayClose) { S.seen.dayClose = 1; save(); talk(STORY.dayClose(S.today), () => {}, { dim: false }); }
}

/* ---------- お客さんの見た目（絵は day-scene.js の custHTML） ---------- */
const custEl = () => document.querySelector('#dCust .cu');
const faceOf = v => (v.step >= 2 && v.res ? (v.res.kind === 'love' ? 'happy' : v.res.kind === 'none' ? 'sad' : '') : '');
function showCust(v, now) {
  const box = $('dCust'); if (!box) return;
  const face = faceOf(v);
  box.innerHTML = `<div class="cu cu-${v.c}${face ? ' ' + face : ''}${now ? ' at still' : ''}${v.step >= 3 ? ' leave' : ''}">${custHTML(v.c, face)}<div class="cu-bub" id="dBub"></div></div>`;
  if (!now) { const el = custEl(); requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('at'))); }
  if (v.step === 1) showBubble(v);
  if (v.step === 2) showResult(v, true);
}
function showBubble(v) {
  const b = $('dBub'); if (!b) return;
  b.className = 'cu-bub show ask';
  b.innerHTML = `${matIcon(v.like)}<span>${esc(matShort(v.like))}</span>`;
}
function showResult(v, now) {
  const b = $('dBub'), el = custEl(), r = v.res; if (!b || !el || !r) return;
  const face = faceOf(v);
  el.classList.remove('happy', 'sad'); if (face) el.classList.add(face);
  const fig = el.querySelector('.cu-fig'); if (fig && fig.classList.contains('art')) fig.outerHTML = custHTML(v.c, face);
  b.className = 'cu-bub show res ' + r.kind;
  b.innerHTML = r.kind === 'love' ? `<b class="bh">${HEART}</b><span>${esc(r.say)}</span>`
    : r.kind === 'other' ? `${candyIcon(r.key)}<span>${esc(r.say)}</span>` : `<span>${esc(r.say)}</span>`;
  if (now) return;
  if (r.key) soldFx(r.key);
  if (r.kind === 'love') heartFx(b);
}
/* 売れた：棚を描きなおして、そのマスに「売れた！」 */
function soldFx(key) {
  const cs = $('dCase'); if (!cs) return;
  cs.innerHTML = caseHTML(false);
  const sl = cs.querySelector(`.dslot[data-key="${CSS.escape(key)}"]`); if (!sl) return;
  sl.classList.add('pop');
  sl.insertAdjacentHTML('beforeend', '<span class="d-sold">売れた！</span>');
}
/* ハート：吹き出しから評判のびんへ飛んで、びんがたまる */
function heartFx(from) {
  const st = $('dstage'), jar = document.querySelector('#dJar .jar'); if (!st || !jar) return;
  const a = from.getBoundingClientRect(), b = jar.getBoundingClientRect(), o = st.getBoundingClientRect();
  const h = document.createElement('i');
  h.className = 'd-fly'; h.textContent = HEART;
  h.style.left = (a.left + a.width / 2 - o.left) + 'px'; h.style.top = (a.top - o.top) + 'px';
  h.style.setProperty('--dx', (b.left + b.width / 2 - a.left - a.width / 2) + 'px');
  h.style.setProperty('--dy', (b.top + b.height / 2 - a.top) + 'px');
  st.appendChild(h);
  setTimeout(() => {
    h.remove();
    const jb = $('dJar'); if (!jb) return;
    if (S.rep % REP_JAR === 0) jb.innerHTML = jarHTML();   // いっぱいになった：びんを新しく（★がふえる）
    else { const j = jb.querySelector('.jar'); if (j) j.style.setProperty('--p', ((S.rep % REP_JAR) / REP_JAR).toFixed(3)); }
    jb.classList.remove('bump'); void jb.offsetWidth; jb.classList.add('bump');
  }, 750 / daySpeed);
}
function toggleDayFast(el) {
  daySpeed = daySpeed > 1 ? 1 : DAY_FAST;
  const st = $('dstage'); if (st) st.style.setProperty('--sp', daySpeed);
  if (el) el.textContent = daySpeed > 1 ? 'ふつうの速さ' : 'はやおくり';
}

/* 昼の画面のボタン（data-act）。main.js の ACTS に入る */
const DAY_ACTS = {
  'd-pick': el => pickKanban(el.dataset.i),
  'd-open': () => openDay(),
  'd-fast': el => toggleDayFast(el),
};
