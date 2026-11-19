/* ==== 昼：カウンター越しのお店（持ち主：昼のチャット【okashi-hiru】・11/18 作りなおし）
   流れ：開店前（棚のまんなかの看板の枠に、今日の看板のお菓子を1つ）→ 開店（約40秒。お客さんが正面のカウンターに来て、頭の上の吹き出しにすきな素材）→ 閉店 → 夕方へ
   すきな素材が入ったお菓子が棚にあれば1こ買ってハート（評判）。なければ半分くらいの人がほかのお菓子を1こ買う。1マスの3こが売れたら売り切れ
   昼はお金を見せない（まとめで初めてわかる）。見せるのは「売れた！」とハートだけ
   つなぎ目（リーダー）：flow.js の goDay → startDay()・閉店のボタン data-act="toEvening" → goEvening → stopDay()・画面は render() → renderDay()・ボタンは DAY_ACTS
   数字は src/data/hiru.js・絵は day-scene.js・セリフは story.js ==== */

let dayTick = 0, dayPrev = 0, daySpeed = 1;
/* お客さん1人の流れ（ms・ふつうの速さ）：入ってくる → 吹き出しにすきな素材 → 買う（ハート）か帰る → 出ていく
   11/19 しょーくん「吹き出しが消えるのが早すぎて、何が起きたかよくわからなかった」→ すきな味 1.7秒・買ったあと 2.4秒（前は 1.3秒ずつ）
   もう1こ買う人（「これも買っていこうかな」・MORE_P）は、1こごとに V_MORE だけ長くいる */
const V_ARRIVE = 900, V_ASK = 2600, V_LEAVE = 5000, V_END = 5600, V_MORE = 1700;
/* 営業の長さ：ふだんは DAY_MS。お客さんが多い日は、1人ずつ吹き出しが読めるように少しのばす（外の明るさもこれに合わせる） */
const D_SLOT = 6000;
const dLen = R => (R && R.len) || DAY_MS;

/* 昼のはじめ（flow.js の goDay から呼ぶ） */
/* 看板は朝の「商品を並べる」で決めたもの（S.morning.kanban）。朝の「お店を開ける」から来たら、すぐ営業（morning.js の mOpen が openDay を呼ぶ） */
function startDay() {
  const k = S.morning && S.morning.kanban, kan = k && S.shelf.some(s => s.key === k && s.n > 0) ? k : null;
  S.dayRun = { open: false, done: false, kanban: kan, t: 0, plan: [], i: 0, cur: null };
}
/* 昼をおえる（flow.js の goEvening から呼ぶ）：売れのこりは今日でおしまい（11/19 しょーくん「単純にロストでいい。売らないと損になるし、看板とか集客を買う意味も出てくる」）→ 毎朝、棚はからっぽ */
function stopDay() {
  clearTimeout(dayTick); dayTick = 0;
  S.shelf = [];
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
/* おそろいの段のリボン（段のいちばん左のマスの中に置き、段のまんなかの棚板の上に出す）。はじめて出る段だけ、ぽんと出る */
let dSoroiLast = new Set();
function dSoroiRibs(slots) {
  const now = new Set(), out = {};
  for (const x of soroiRows(slots)) {
    const k = x.r + ':' + x.mats.join('+'); now.add(k);
    out[x.r * SHELF_COLS] = `<span class="d-soroi${x.out ? ' out' : ''}${dSoroiLast.has(k) || REDUCED ? '' : ' pop'}" aria-label="おそろい">${x.mats.map(matIcon).join('')}<b>おそろい</b></span>`;
  }
  dSoroiLast = now;
  return out;
}
/* 7文字より長い名前は字をつめる（11/19：商品を並べるの棚で「ミルクキャラメル」「はちみつクッキー」の最後が切れていた） */
const dNmLong = nm => nm.length >= 7 ? ' lg' : '';
function slotHTML(o, idx, ks, pre, rib = '') {
  const kan = idx === ks ? ' kan' : '', kl = kan ? '<span class="d-kl">看板</span>' : '';
  if (!o) return `<div class="dslot empty${kan}">${kl}</div>`;
  const c = candyOf(o.s.key), out = o.s.n <= 0, tag = pre ? 'button' : 'div';
  return `<${tag} class="dslot${kan}${out ? ' out' : ''}"${pre ? ` data-act="d-pick" data-i="${o.i}"` : ''} data-key="${esc(o.s.key)}">${kl}${candyIcon(o.s.key)}<span class="d-nm${dNmLong(c.name)}">${esc(c.name)}</span><span class="d-dots">${'<i></i>'.repeat(Math.max(0, Math.min(6, o.s.n)))}</span>${out ? '<span class="d-out">うりきれ</span>' : ''}${rib}</${tag}>`;
}
function caseHTML(pre) {
  const { slots, ks } = shelfSlots(), rib = dSoroiRibs(slots);
  return slots.map((o, i) => slotHTML(o, i, ks, pre, rib[i])).join('');
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
  else bar = `<div class="d-bar"><span class="d-lbl">えいぎょう中</span>${mToolHas('bell') ? '<button class="sub" data-act="d-bell">ひるねの鐘</button>' : ''}<button class="sub" data-act="d-fast">${dSpeedLbl()}</button></div>`;
  const tip = !pre ? '' : empty ? '棚がからっぽ……今日はお休みかな' : R.kanban ? `今日の看板は ${candyOf(R.kanban).name}` : '看板にするお菓子を、タップしてえらんでね';
  const rows = Math.ceil(Math.min(SHELF_MAX, S.shelfMax || 6) / SHELF_COLS);
  $('screen').innerHTML = `<section class="day fit">
    <div class="dstage${pre ? ' pre' : ''}${(dEv(R) || {}).cls ? ' ' + dEv(R).cls : ''}" id="dstage" style="--sp:${daySpeed};--p:${R.done ? 1 : Math.min(1, (R.t || 0) / dLen(R)).toFixed(3)}">
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
  if (R.open && !R.done) { dayPrev = 0; dayLoop(); dAmbT = setTimeout(dAmbient, 1500); }
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
    R.soroi = soroiRows(shelfSlots().slots).flatMap(x => x.mats);   // おそろいの段は開店のときの並びで
    if (!R.ev && S.day >= 3 && Math.random() < EVENT_P) R.ev = pick(DAY_EVENTS).id;   // 昼のできごと（11/19）
    const E = dEv(R);
    R.plan = custPlan(Math.max(2, custCount() + ((E && E.add) || 0)), R.kanban, R.soroi, (E && E.first) || []);
    R.len = Math.max(DAY_MS, R.plan.length * D_SLOT);
    R.lk = {}; R.got = {}; R.miss = {};
    S.today.kanban = R.kanban; S.today.kanbanSoldOut = false;
    save(); renderDay();
    setTimeout(() => { const E = dEv(R); E ? dSayRun(STORY.pickE(STORY.ev[E.id].open)) : dSay('open'); }, 700);
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
  const st = $('dstage'); if (st) st.style.setProperty('--p', Math.min(1, R.t / dLen(R)).toFixed(3));   // 外の明るさ（ゲージのかわり）
  if (R.cur) return visitStep(R, dt);
  if (!S.shelf.some(s => s.n > 0)) return closeDay('ぜんぶ売り切れ！');
  if (R.i >= 1 && !R.mated) { const m = dMateDue(); if (m) return dMateVisit(R, m); }
  /* お客さんのいない間のひとこと（営業の3割・6.5割のところで1回ずつ） */
  for (const at of [.3, .5, .72]) if (!(R.idle || {})[at] && R.t >= at * dLen(R)) {
    (R.idle = R.idle || {})[at] = 1;
    const E = dEv(R);
    if (at === .5) { if (E) dSayRun(STORY.pickE(STORY.ev[E.id].mid)); }
    else dSay('idle');
  }
  if (R.i < R.plan.length) { if (R.t >= (R.i + 0.5) * dLen(R) / R.plan.length) startVisit(R); }
  else if (R.t >= dLen(R)) closeDay();
}
function startVisit(R) {
  const p = R.plan[R.i++];
  R.cur = { c: p.c, vr: p.vr || 1, like: p.like, t: 0, step: 0, res: null };
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
    const r = v.res, out = r.key && dLeft(r.key) <= 0, nm = r.key ? candyOf(r.key).name : '';   // 同じお菓子が2マスあるときは、ぜんぶ売れてから「売り切れ」（11/19）
    if (R.lk && v.like) { R.lk[v.like] = (R.lk[v.like] || 0) + 1; const b = r.kind === 'love' ? R.got : R.miss; b[v.like] = (b[v.like] || 0) + 1; }   // ふり返り（dSum）
    setTimeout(() => out ? dSay(r.key === S.today.kanban ? 'kanban' : 'sold', nm, true) : dSay(r.kind), 700);
  } else if (v.step === 2 && (v.mk || 0) < (v.res.more || 0) && v.t >= V_ASK + V_MORE * ((v.mk || 0) + 1)) {
    const m = dServeMore(v);   // 「これもおいしそう！」もう1こ（11/19）
    if (!m) { v.res.more = v.mk || 0; return; }
    v.mk = (v.mk || 0) + 1; v.last = m; save(); showMore(v, m, false);
    if (dLeft(m.key) <= 0) setTimeout(() => dSay(m.key === S.today.kanban ? 'kanban' : 'sold', candyOf(m.key).name, true), 700);
  } else if (v.step === 2 && v.t >= V_LEAVE + V_MORE * (v.mk || 0)) {
    v.step = 3; const el = custEl(); if (el) el.classList.add('leave');
  } else if (v.step === 3 && v.t >= V_END) {
    R.cur = null; const el = custEl(); if (el) el.remove(); save();
  }
}
/* ---------- ⑧⑫ 仲間の来店（11/19）：レアの素材のお菓子が棚にあると、1人目のお客さんのあとに来る（1日に1人まで）
   会話のあいだは営業も止まる（dayLoop は talking() のあいだ進めない）。来たらそのお菓子を1こ買ってハート・S.seen['mate:<id>'] に その日
   昼の舞台に2人の絵は出さない（会話の窓の立ち絵だけ・カウンターに3人ならぶのは絵が来てから） */
const D_MATES = [['minamo', 'niji'], ['wakaba', 'minto']];
function dMateDue() {
  for (const [id, mat] of D_MATES) {
    if (STORY.mateDay(id)) continue;
    const it = S.shelf.find(s => s.n > 0 && candyHas(s.key, mat));
    if (it) return { id, key: it.key };
  }
  return null;
}
function dMateVisit(R, m) {
  R.mated = 1;
  const T = S.today, it = S.shelf.find(s => s.key === m.key && s.n > 0), price = candyOf(m.key).price;   // 売り切れのマスをえらばない（11/19：同じお菓子が2マスのとき n がマイナスになった）
  it.n--; S.money += price; T.sales += price; T.visitors++; T.served++; S.rep++; T.hearts++;
  if (it.key === T.kanban && dLeft(T.kanban) <= 0) T.kanbanSoldOut = true;
  S.seen['mate:' + m.id] = S.day; save();
  const cs = $('dCase'); if (cs) cs.innerHTML = caseHTML(false);
  talk(STORY.mateVisit[m.id](), () => { save(); renderDay(); });
}
/* そのお菓子が棚にあと何こ（同じお菓子が2マス以上あってもぜんぶ数える） */
const dLeft = key => S.shelf.reduce((a, s) => a + (s.key === key ? s.n : 0), 0);
/* 買う：すきな素材が入ったお菓子（看板が先・なければ高いほう）→ ハート。なければ OTHER_BUY の人がほかのを1こ */
function serve(v) {
  const T = S.today, R = S.dayRun, items = S.shelf.filter(s => s.n > 0);
  const liked = items.filter(s => candyHas(s.key, v.like));
  let s = null, love = false;
  if (liked.length) { love = true; s = liked.find(x => x.key === R.kanban) || liked.sort((a, b) => candyOf(b.key).price - candyOf(a.key).price)[0]; }
  else if (items.length && Math.random() < OTHER_BUY) s = pick(items);
  if (!s) return { kind: 'none', say: STORY.custSay(v.c, 'none') };
  const price = candyOf(s.key).price;
  s.n--; S.money += price; T.sales += price; T.served++;
  if (s.key === T.kanban && dLeft(T.kanban) <= 0) T.kanbanSoldOut = true;
  if (love) { S.rep++; T.hearts++; }
  const more = Math.random() < MORE_P ? (Math.random() < MORE3_P ? 2 : 1) : 0;   // たまに2こ・たまーに3こ（11/19 しょーくん）
  return { kind: love ? 'love' : 'other', key: s.key, say: STORY.custSay(v.c, love ? 'love' : 'other'), more, got: [s.key] };
}
/* もう1こ買う：まだ買っていないお菓子から（すきな味が先）。ハートは1人1つのまま（お金と売れ行きだけ）。棚にないときは買わずに帰る */
function dServeMore(v) {
  const T = S.today, items = S.shelf.filter(s => s.n > 0); if (!items.length) return null;
  const got = v.res.got || [], fresh = items.filter(s => !got.includes(s.key)), pool = fresh.length ? fresh : items;
  const liked = pool.filter(s => candyHas(s.key, v.like)), s = pick(liked.length ? liked : pool), price = candyOf(s.key).price;
  s.n--; S.money += price; T.sales += price;
  if (s.key === T.kanban && dLeft(T.kanban) <= 0) T.kanbanSoldOut = true;
  v.res.got = [...got, s.key];
  return { key: s.key, say: STORY.custSay(v.c, (v.mk || 0) >= 1 ? 'more3' : 'more') };
}
function closeDay(msg) {
  const R = S.dayRun; R.done = true; R.cur = null;
  clearTimeout(dayTick); dayTick = 0;
  const loss = S.shelf.some(s => s.n > 0) && !S.seen.loss ? (S.seen.loss = S.day, STORY.lossFirst) : [];   // 売れのこりは今日でおしまい（はじめての日だけ ほのかが言う）
  save(); if (msg) toast(msg);
  renderDay();
  setTimeout(() => {
    const sd = dSum(R), E = dEv(R);
    const lines = [...loss, ...(E ? STORY.pickE(STORY.ev[E.id].close) : []), ...(sd ? STORY.fill(STORY.pickE(STORY.sum[sd.k]), sd) : [])];
    lines.length ? dSayRun(lines.slice(0, 3)) : dSay('close', '', true);
  }, 500);
  if (S.day === 1 && !S.seen.dayClose) { S.seen.dayClose = 1; save(); talk([...STORY.dayClose(S.today), ...loss], () => {}, { dim: false }); }
}

/* ---------- 昼のお店のひとこと（11/19）：文は STORY.daySay。舞台の下に小さく出して消える（会話の窓にしない＝営業は止めない）
   1日目（チュートリアルの会話がある）・会話のあいだは出さない。force＝売り切れなど（前のを消して出す） ---------- */
let dSayT = 0, dSayAt = 0, dSayLast = '', dSkip = 0;
function dSay(kind, c = '', force = false) {
  const P = STORY.daySay && STORY.daySay[kind], st = $('dstage');
  if (!P || !st || S.day <= 1 || talking() || performance.now() < dSkip) return;
  const now = performance.now();
  if (!force && (now - dSayAt < 4500 || Math.random() > (STORY.daySayP[kind] ?? .4))) return;
  const mi = STORY.mate('minamo'), wa = STORY.mate('wakaba');
  const ok = P.map(e => typeof e === 'string' ? { s: [e] } : e).filter(e => (!e.mi || mi) && (!e.wa || wa) && e.s.join() !== dSayLast);
  if (!ok.length) return;
  const e = pick(ok);
  dSayLast = e.s.join();
  dSayRun(e.s.map(l => l.replace(/\{c\}/g, c)));
}
/* 文の並びを順に出す（できごと・ふり返りは、ここを直接よぶ） */
function dSayRun(lines) {
  if (!lines || !lines.length || !$('dstage') || S.day <= 1 || talking()) return;
  dSayAt = performance.now(); clearTimeout(dSayT);
  let i = 0;
  const step = () => {
    const el = dSayEl(); if (!el) return;
    if (i >= lines.length) { el.classList.remove('show'); return; }
    const m = lines[i++].match(/^([^【：]+)(?:【([^】]+)】)?：(.*)$/); if (!m) return step();
    const who = Object.keys(TALKERS).find(k => TALKERS[k].name === m[1]) || 'honoka', T = TALKERS[who];
    const img = ART[(T.faces && (T.faces[m[2]] || T.faces['ふつう'])) || who] || '';
    el.dataset.who = who;
    el.innerHTML = `<i class="ds-av"${img ? ` style="--av:url('${img}')"` : ''}></i><b>${esc(m[1])}</b><span>${esc(m[3])}</span>`;
    el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
    dSayT = setTimeout(step, 2600 / Math.sqrt(daySpeed));
  };
  step();
}
function dSayEl() {
  const st = $('dstage'); if (!st) return null;
  let el = $('dSay');
  if (!el) { el = document.createElement('p'); el.id = 'dSay'; el.className = 'd-say'; el.setAttribute('role', 'status'); st.appendChild(el); }
  return el;
}

/* ---------- ふり返り（11/19 しょーくん）：その日のお客さんの すきな味 と 買えたか から、いちばん言いたいことを1つ
   R.lk＝すきな味ごとの人数・R.got＝ハートで買えた・R.miss＝買えなかった（ほかを買った・なにも買わなかった）。仲間の来店は数えない ---------- */
function dSum(R) {
  if (!R || !R.lk) return null;
  const sum = o => Object.values(o || {}).reduce((a, b) => a + b, 0), tot = sum(R.lk), love = sum(R.got);
  if (tot < 2) return null;
  const m = Object.keys(R.lk).sort((a, b) => R.lk[b] - R.lk[a])[0], n = R.lk[m], g = (R.got || {})[m] || 0;
  if (love === tot && tot >= 3) return { k: 'all', m, n };
  if ((R.soroi || []).includes(m) && g >= 2) return { k: 'soroi', m, n };
  if (R.kanban && candyHas(R.kanban, m) && g >= 2) return { k: 'kanban', m, n, c: candyOf(R.kanban).name };
  if (((R.miss || {})[m] || 0) >= 2) return { k: 'miss', m, n };
  if (g >= 2) return { k: 'hit', m, n };
  return null;
}
const dEv = R => (R && R.ev && DAY_EVENTS.find(e => e.id === R.ev)) || null;

/* ひるねの鐘（べんり道具）：のこりのお昼を一気に進める（絵とひとことは とばす・仲間の来店の会話が出たら そこで止まる） */
function dBell() {
  const R = S.dayRun; if (!R || !R.open || R.done || talking()) return;
  dSkip = performance.now() + 2500; toast('リーン……すやすや……');
  let g = 0;
  while (!R.done && !talking() && g++ < 3000) dayStep(R, 250);
  if (!R.done && !talking()) renderDay();
}

/* ---------- 窓の外の生きもの（11/19 しょーくん「窓の外に鳥が飛ぶとか、飽きない工夫」）：窓のガラスの型（bg-day-mado）の中だけに見える
   鳥の群れ・葉っぱ・ちょうちょ がときどき横切る（transform と opacity だけ・終わったら消す）。できごとで出やすさが変わる ---------- */
let dAmbT = 0;
const D_BIRD = '<svg viewBox="0 0 20 10"><path d="M1 6 Q5 1 10 6 Q15 1 19 6" fill="none" stroke="#3a2a22" stroke-width="2.2" stroke-linecap="round"/></svg>';
const D_LEAF = c => `<svg viewBox="0 0 12 12"><path d="M2 10 C2 4 6 1 11 1 C11 6 8 10 2 10Z" fill="${c}"/><path d="M2 10 L9 3" stroke="rgba(60,30,10,.5)" stroke-width=".8"/></svg>`;
const D_BUTTERFLY = '<svg viewBox="0 0 16 12"><ellipse cx="5" cy="5" rx="4" ry="4" fill="#ffd9a0"/><ellipse cx="11" cy="5" rx="4" ry="4" fill="#ffd9a0"/><ellipse cx="5.5" cy="9.5" rx="2.6" ry="2" fill="#f6b8c8"/><ellipse cx="10.5" cy="9.5" rx="2.6" ry="2" fill="#f6b8c8"/><rect x="7.4" y="3" width="1.2" height="8" rx=".6" fill="#5a3418"/></svg>';
function dAmbient() {
  clearTimeout(dAmbT);
  const R = S.dayRun, lay = document.querySelector('#dstage .ds-out');
  if (!lay || !R || !R.open || R.done || S.phase !== 'day') return;
  const ev = R.ev, kind = ev === 'kotori' ? (Math.random() < .8 ? 'bird' : 'fly') : ev === 'kaze' ? (Math.random() < .75 ? 'leaf' : 'bird') : ev === 'rain' ? 'none' : pick(['bird', 'bird', 'leaf', 'fly']);
  if (kind !== 'none' && !REDUCED) {
    const dir = Math.random() < .5 ? 1 : -1, n = kind === 'bird' ? 1 + Math.floor(Math.random() * 3) : 1;
    for (let i = 0; i < n; i++) {
      const el = document.createElement('i');
      el.className = 'amb ' + kind + (dir < 0 ? ' rev' : '');
      el.style.cssText = `--y:${(kind === 'leaf' ? 8 : 14) + Math.random() * 30}%;--d:${(kind === 'bird' ? 6 : 9) + Math.random() * 4}s;--dl:${i * .35}s;--s:${.8 + Math.random() * .5}`;
      el.innerHTML = `<i>${kind === 'bird' ? D_BIRD : kind === 'leaf' ? D_LEAF(pick(['#e8a040', '#d9733a', '#9fbf5a'])) : D_BUTTERFLY}</i>`;
      el.addEventListener('animationend', e => { if (e.target === el) el.remove(); });
      lay.appendChild(el);
    }
  }
  const gap = ev === 'kotori' || ev === 'kaze' ? 2500 + Math.random() * 2500 : 6500 + Math.random() * 6500;
  dAmbT = setTimeout(dAmbient, gap / Math.sqrt(daySpeed));
}

/* ---------- お客さんの見た目（絵は day-scene.js の custHTML） ---------- */
const custEl = () => document.querySelector('#dCust .cu');
const faceOf = v => (v.step >= 2 && v.res ? (v.res.kind === 'love' ? 'happy' : v.res.kind === 'none' ? 'sad' : '') : '');
function showCust(v, now) {
  const box = $('dCust'); if (!box) return;
  const face = faceOf(v);
  box.innerHTML = `<div class="cu cu-${v.c}${face ? ' ' + face : ''}${now ? ' at still' : ''}${v.step >= 3 ? ' leave' : ''}">${custHTML(v.c, face, v.vr)}<div class="cu-bub" id="dBub"></div></div>`;
  if (!now) { const el = custEl(); requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('at'))); }
  if (v.step === 1) showBubble(v);
  if (v.step === 2) v.mk && v.last ? showMore(v, v.last, true) : showResult(v, true);
}
function showBubble(v) {
  const b = $('dBub'); if (!b) return;
  /* すきな味は「思っている」吹き出し（しゃべる吹き出しとは別・11/18 しょーくん「喋ってるのと同じだと『たまご』って言ってるみたい」） */
  b.className = 'cu-bub show ask think';
  b.innerHTML = `${matIcon(v.like)}<span>${esc(matShort(v.like))}</span>`;
}
function showResult(v, now) {
  const b = $('dBub'), el = custEl(), r = v.res; if (!b || !el || !r) return;
  const face = faceOf(v);
  el.classList.remove('happy', 'sad'); if (face) el.classList.add(face);
  const fig = el.querySelector('.cu-fig'); if (fig && fig.classList.contains('art')) fig.outerHTML = custHTML(v.c, face, v.vr);
  b.className = 'cu-bub show res ' + r.kind;
  b.innerHTML = r.kind === 'love' ? `<b class="bh">${HEART}</b><span>${esc(r.say)}</span>`
    : r.kind === 'other' ? `${candyIcon(r.key)}<span>${esc(r.say)}</span>` : `<span>${esc(r.say)}</span>`;
  if (now) return;
  if (r.key) soldFx(r.key);
  if (r.kind === 'love') heartFx(b);
}
/* もう1こ：吹き出しをお菓子と「これも！」に変えて、もう一度ぽんと出す */
function showMore(v, m, now) {
  const b = $('dBub'); if (!b) return;
  b.className = 'cu-bub res other more';
  b.innerHTML = `${candyIcon(m.key)}<span>${esc(m.say)}</span>`;
  if (now) { b.classList.add('show'); return; }
  void b.offsetWidth; b.classList.add('show');
  soldFx(m.key);
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
/* はやおくり：ふつう → ×2（いつでも）→ ×4（超はやおくりの砂時計があるとき）→ ふつう。ボタンの字は、つぎに押したときの速さ */
const dSpeedNext = () => daySpeed === 1 ? DAY_FAST : daySpeed === DAY_FAST && mToolHas('sand') ? DAY_SUPER : 1;
const dSpeedLbl = () => ({ [DAY_FAST]: 'はやおくり', [DAY_SUPER]: '超はやおくり', 1: 'ふつうの速さ' })[dSpeedNext()];
function toggleDayFast(el) {
  daySpeed = dSpeedNext();
  const st = $('dstage'); if (st) st.style.setProperty('--sp', daySpeed);
  if (el) el.textContent = dSpeedLbl();
}

/* 昼の画面のボタン（data-act）。main.js の ACTS に入る */
const DAY_ACTS = {
  'd-pick': el => pickKanban(el.dataset.i),
  'd-open': () => openDay(),
  'd-fast': el => toggleDayFast(el),
  'd-bell': () => dBell(),
};
