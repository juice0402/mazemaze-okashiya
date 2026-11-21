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
  dScene = null; clearTimeout(dRegT);
}
/* 昼をおえる（flow.js の goEvening から呼ぶ）：売れのこりは今日でおしまい（11/19 しょーくん「単純にロストでいい。売らないと損になるし、看板とか集客を買う意味も出てくる」）→ 毎朝、棚はからっぽ */
function stopDay() {
  clearTimeout(dayTick); dayTick = 0;
  dScene = null; clearTimeout(dRegT);
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
/* 昼のパズル（11/21・hiru.js の puzzleOf）：となりの相性の結び目（左か上のマスの中に置き、マスのさかいに出す）と、たての列のシリーズのリボン（列のいちばん上のマス）。
   はじめて出たものだけ、ぽんと出る。売れたときは data-l・data-c で見つけて光らせる（showMore） */
let dPzLast = new Set();
function dPuzzleDeco(slots) {
  const P = puzzleOf(slots), now = new Set(), out = {}, add = (i, h) => { out[i] = (out[i] || '') + h; };
  for (const L of P.links) {
    const k = L.i + '-' + L.j + ':' + L.p.id; now.add(k);
    add(L.i, `<span class="d-aisho ${L.dir}${L.out ? ' out' : ''}${dPzLast.has(k) || REDUCED ? '' : ' pop'}" data-l="${L.i}-${L.j}" aria-label="相性：${esc(L.p.name)}"></span>`);
  }
  for (const x of P.series) {
    const k = 'c' + x.c + ':' + x.kata; now.add(k);
    add(x.c, `<span class="d-series${x.out ? ' out' : ''}${dPzLast.has(k) || REDUCED ? '' : ' pop'}" data-c="${x.c}" aria-label="シリーズ：${KATA[x.kata]}"><b>${KATA[x.kata]}</b></span>`);
  }
  dPzLast = now;
  return out;
}
/* おそろいのリボンと、パズルの結び目・リボンを1つの表に（マスの番号 → 中に入れる HTML） */
function dCaseDeco(slots) {
  const a = dSoroiRibs(slots), b = dPuzzleDeco(slots), out = { ...a };
  for (const k of Object.keys(b)) out[k] = (out[k] || '') + b[k];
  return out;
}
/* 7文字より長い名前は字をつめる（11/19：商品を並べるの棚で「ミルクキャラメル」「はちみつクッキー」の最後が切れていた） */
const dNmLong = nm => nm.length >= 7 ? ' dnl' : '';   // 「lg」はロゴの箱の名前なので使わない（11/19 しょーくん「文字数多いときの表示、絶対変」＝ロゴの箱の大きさがついていた）
function slotHTML(o, idx, ks, pre, rib = '') {
  const kan = idx === ks ? ' kan' : '', kl = kan ? '<span class="d-kl">看板</span>' : '';
  if (!o) return `<div class="dslot empty${kan}">${kl}</div>`;
  const c = candyOf(o.s.key), out = o.s.n <= 0, tag = pre ? 'button' : 'div';
  return `<${tag} class="dslot${kan}${out ? ' out' : ''}"${pre ? ` data-act="d-pick" data-i="${o.i}"` : ''} data-key="${esc(o.s.key)}">${kl}${candyIcon(o.s.key)}<span class="d-nm${dNmLong(c.name)}">${esc(c.name)}</span><span class="d-dots">${'<i></i>'.repeat(Math.max(0, Math.min(6, o.s.n)))}</span>${out ? '<span class="d-out">うり<br>きれ</span>' : ''}${rib}</${tag}>`;
}
function caseHTML(pre) {
  const { slots, ks } = shelfSlots(), rib = dCaseDeco(slots);
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
    <div class="dstage${pre ? ' pre' : ''}${(dEv(R) || {}).cls ? ' ' + dEv(R).cls : ''}${ART['ui-garland'] ? ' has-garland' : ''}" id="dstage" style="--sp:${daySpeed};--p:${R.done ? 1 : Math.min(1, (R.t || 0) / dLen(R)).toFixed(3)}">
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
  dLight(R);
  if (pre && !empty && S.day === 1 && !S.seen.dayPre && !talking()) talk(STORY.dayPre, () => { S.seen.dayPre = 1; save(); });
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
    const fx = dRegDue(), first = (E && E.first) || [], n = Math.max(2, custCount() + ((E && E.add) || 0));   // 常連さん（11/19）：来る日は2人目か、できごとのお客さんのあと
    R.plan = custPlan(n, R.kanban, R.soroi, first, fx && { ...fx, i: Math.min(n - 1, Math.max(first.length, 1)) });
    R.len = Math.max(DAY_MS, R.plan.length * D_SLOT);
    dPreload(R.plan.flatMap(x => { const b = 'cust-' + x.c + (x.vr > 1 ? '-' + x.vr : ''); return [b, b + '-happy', b + '-sad', ...(x.duo ? ['cust-' + x.duo] : [])]; }));   // 今日のお客さんの顔を先に読む
    R.lk = {}; R.got = {}; R.miss = {};
    S.today.kanban = R.kanban; S.today.kanbanSoldOut = false;
    save(); renderDay();
    setTimeout(() => { const E = dEv(R); E ? dSayRun(STORY.pickE(STORY.ev[E.id].open)) : dSay('open'); }, 700);
  };
  if (S.day === 1 && !S.seen.dayOpen) { S.seen.dayOpen = 1; save(); talk(STORY.dayOpen, go); }
  else go();
}

/* ---------- 外の明るさ（11/19 しょーくん「フレームレート向上・描写を爆速に」）
   前は 0.1秒ごとに .dstage の --p を変えていた → 1秒に約25回、舞台ぜんぶの計算と窓の4まい（型ぬき・重ね方つき）の描きなおし。
   いまは窓・夕方の色・夕日の opacity を、営業の長さの動き（Web Animations）にして、GPU にまかせる。数字の形は style-hiru.css の --p の式と同じ。
   会話のあいだは止める・はやおくりは playbackRate・ずれたときだけ合わせる（dLightSync） ---------- */
const D_LIGHT = [
  ['.ds-m1', '', [{ opacity: 0, offset: 0 }, { opacity: 0, offset: .15 }, { opacity: .62, offset: .593 }, { opacity: .62, offset: 1 }]],
  ['.ds-m2', '', [{ opacity: 0, offset: 0 }, { opacity: 0, offset: .5 }, { opacity: 1, offset: 1 }]],
  ['.ds-dusk', '', [{ opacity: 0, offset: 0 }, { opacity: 0, offset: .25 }, { opacity: .72, offset: .97 }, { opacity: .72, offset: 1 }]],
  ['.ds-front', '::after', [{ opacity: 0, offset: 0 }, { opacity: 0, offset: .25 }, { opacity: .72, offset: .97 }, { opacity: .72, offset: 1 }]],
  ['.ds-glow', '', [{ opacity: .08 }, { opacity: .38 }]],
];
let dLightA = [];
const dLightT = R => R.done ? dLen(R) : R.open ? Math.min(dLen(R), R.t || 0) : 0;
function dLight(R) {
  for (const a of dLightA) a.cancel();
  dLightA = [];
  dLightLast = { run: null, sp: 0, at: 0 };
  const st = $('dstage'); if (!st || !st.animate) return;
  const len = dLen(R), t = dLightT(R);
  try {
    for (const [sel, pe, kf] of D_LIGHT) for (const el of st.querySelectorAll(sel)) {
      const a = el.animate(kf, pe ? { duration: len, fill: 'both', pseudoElement: pe } : { duration: len, fill: 'both' });
      a.pause(); a.currentTime = t; a.playbackRate = daySpeed; dLightA.push(a);
    }
  } catch (e) { for (const a of dLightA) a.cancel(); dLightA = []; }   // 動かせないブラウザは前のやり方（--p）
}
let dLightLast = { run: null, sp: 0, at: 0 };
function dLightSync(R, run) {
  if (!dLightA.length) return;
  const now = performance.now();   // 動いているあいだは、止める・速さ・2秒ごとのずれ合わせのときだけ（毎回さわると計算がふえる）
  if (run === dLightLast.run && daySpeed === dLightLast.sp && now - dLightLast.at < 2000) return;
  dLightLast = { run, sp: daySpeed, at: now };
  const t = dLightT(R);
  for (const a of dLightA) {
    if (a.playbackRate !== daySpeed) a.playbackRate = daySpeed;
    if (Math.abs((a.currentTime || 0) - t) > 400) a.currentTime = t;
    if (run && a.playState !== 'running' && t < dLen(R)) a.play();
    else if (!run && a.playState === 'running') a.pause();
  }
}

/* ---------- 営業：100ms ごとに進める（会話のあいだは止まる・昼の画面でないときは止まる） ---------- */
function dayLoop() {
  clearTimeout(dayTick); dayTick = 0;
  const R = S.dayRun;
  if (S.phase !== 'day' || !R || !R.open || R.done || !$('dstage')) return;
  const now = performance.now(), dt = dayPrev ? Math.min(250, now - dayPrev) : 0;
  dayPrev = now;
  const run = !talking() && !dScene;   // 常連さんの場面のあいだも、営業の時計は止める
  if (run) dayStep(R, dt * daySpeed);
  if (!R.done) { dLightSync(R, run); dayTick = setTimeout(dayLoop, 100); }
}
function dayStep(R, dt) {
  R.t += dt;
  if (!dLightA.length) { const st = $('dstage'); if (st) st.style.setProperty('--p', Math.min(1, R.t / dLen(R)).toFixed(3)); }   // 外の明るさ：ふだんは dLight の動きにおまかせ（動かせないブラウザだけ、ここで --p）
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
  if (p.reg) { R.cur.reg = p.reg; if (p.duo) R.cur.duo = p.duo; }
  else if (p.c === 'gakusei' && (p.vr || 1) === 1 && !R.koge && S.seen['rg:gakusei'] && S.night && S.night.burnt > 0) { R.koge = 1; R.cur.reg = 'koge'; }   // 小ネタ「……こげくさい」
  S.today.visitors++; save();
  showCust(R.cur, false); mSe('door', { vol: 0.45 });
}
function visitStep(R, dt) {
  const v = R.cur; v.t += dt;
  if (v.reg && v.sc !== 2 && v.t >= V_ARRIVE) { if (!dScene) dRegRun(v); return; }   // 常連さん：来たら、すきな味の前に掛け合い
  if (v.step === 0 && v.t >= V_ARRIVE) {
    v.step = 1; showBubble(v);
    if (S.day === 1 && !S.seen.dayBubble) { S.seen.dayBubble = 1; save(); talk(STORY.dayBubble, () => {}); }
  } else if (v.step === 1 && v.t >= V_ASK) {
    v.step = 2; v.res = serve(v); save(); showResult(v, false);
    if (v.res.kind !== 'none') mSe(v.res.kind === 'love' ? 'heart' : 'sale');   // 音（11/19・se.js）
    const r = v.res, out = r.key && dLeft(r.key) <= 0, nm = r.key ? candyOf(r.key).name : '';   // 同じお菓子が2マスあるときは、ぜんぶ売れてから「売り切れ」（11/19）
    if (R.lk && v.like) { R.lk[v.like] = (R.lk[v.like] || 0) + 1; const b = r.kind === 'love' ? R.got : R.miss; b[v.like] = (b[v.like] || 0) + 1; }   // ふり返り（dSum）
    setTimeout(() => { if (out) { mSe('soldout'); dSay(r.key === S.today.kanban ? 'kanban' : 'sold', nm, true); } else dSay(r.kind); }, 700);
  } else if (v.step === 2 && (v.mk || 0) < (v.res.more || 0) && v.t >= V_ASK + V_MORE * ((v.mk || 0) + 1)) {
    const m = dServeMore(v);   // 「これもおいしそう！」もう1こ（11/19）・相性の相手・シリーズの列（11/21）
    if (!m) { v.res.more = v.mk || 0; return; }
    v.mk = (v.mk || 0) + 1; v.last = m; save(); showMore(v, m, false); mSe('sale', { rate: 1.06 });
    if (dLeft(m.key) <= 0) setTimeout(() => { mSe('soldout'); dSay(m.key === S.today.kanban ? 'kanban' : 'sold', candyOf(m.key).name, true); }, 700);
  } else if (v.step === 2 && v.t >= V_LEAVE + V_MORE * (v.mk || 0)) {
    v.step = 3; dCustEls().forEach(el => el.classList.add('leave'));
  } else if (v.step === 3 && v.t >= V_END) {
    R.cur = null; dCustEls().forEach(el => el.remove()); save();
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
  dCaseUpdate(); mSe('door');
  talk(STORY.mateVisit[m.id](), () => { save(); renderDay(); mJg('jg-nakama'); });   // 仲間になったジングル（11/19）
}
/* ---------- 常連さん（11/19 16:41 しょーくんOK）：昼の小さな場面。段の数字は hiru.js の REG_STEPS・セリフは story.js の STORY.reg
   開店のとき（openDay）にその日の常連さんを決めて、お客さんの順番（custPlan）の2人目に入れる。来たら、すきな味の吹き出しの前に掛け合い（dRegRun）
   場面のあいだは営業の時計を止める（dayLoop の dScene）。すんだら S.seen の rg:<id>（段の数）・rgd:<id>（その日）、2人の場面は rg:pair ---------- */
let dScene = null, dRegT = 0;
function dRegDue() {
  if (S.day <= 1 || S.seen.scDay === S.day || dMateDue()) return null;   // 仲間が来る日・物語の場面の日はなし
  const g = c => S.seen['rg:' + c] || 0, gd = c => S.seen['rgd:' + c] || 0, h = c => S.seen['rh:' + c] || 0, trip = regTrip();
  if (trip && S.day >= gd('otona') + REG_TRIP && g('obaachan') >= 3 && gd('obaachan') < S.day) return { c: 'otona', duo: 'obaachan', reg: 'pair' };
  const ok = Object.keys(REG_STEPS).filter(k => {
    const st = REG_STEPS[k][g(k)], w = regWho(k); if (!st || gd(k) >= S.day || (k === 'otona' && trip) || !custOpen(w.c)) return false;
    const [day, hearts, need] = st;
    if (S.day < day || h(w.c) < hearts) return false;   // ハートはお客さんの種類ごと（新しい常連さん2人は同じ種類のハートを見る）
    if (need === 'minamo' && !STORY.mate('minamo')) return false;
    if (need === 'trip' && !(trip && gd('otona') < S.day)) return false;
    if (need && need.startsWith('after:')) { const a = need.slice(6); if (!g(a) || gd(a) >= S.day) return false; }   // 1人目の段1のあと（同じ日はなし）
    return true;
  });
  if (!ok.length) return null;
  const k = pick(ok), w = regWho(k);
  return { c: w.c, vr: w.vr, reg: k + ':' + g(k) };
}
const regKey = v => v.reg === 'pair' ? 'otona' : v.reg === 'koge' ? 'gakusei' : v.reg.split(':')[0];   // 場面の常連さん（名前は STORY.reg[regKey].name）
const dRegLines = reg => reg === 'pair' ? STORY.regPair : reg === 'koge' ? STORY.regKoge : (() => { const [c, k] = reg.split(':'); return ((STORY.reg[c] || {}).st || [])[+k]; })();
function dRegRun(v) {
  const L = dRegLines(v.reg);
  if (!L || !L.length) { v.sc = 2; return; }
  dScene = v; v.sc = 1; dSkip = Infinity;   // お店のひとことの割りこみを止める
  const nm = { [STORY.reg[regKey(v)].name]: 'dBub', ...(v.duo ? { [STORY.reg[v.duo].name]: 'dBub2' } : {}) };
  let i = 0;
  const step = () => {
    if (dScene !== v || S.phase !== 'day') return;
    if (i >= L.length) return dRegEnd(v);
    const line = L[i++], m = line.match(/^([^【：]+)(?:【[^】]+】)?：(.*)$/), id = m && nm[m[1]];
    if (id) {
      for (const k of ['dBub', 'dBub2']) { const b = $(k); if (b && k !== id) b.className = 'cu-bub'; }   // しゃべっていない子の吹き出しはしまう
      const b = $(id); if (b) { b.className = 'cu-bub say'; b.innerHTML = `<b class="cu-rn">${esc(m[1])}</b><span>${esc(m[2])}</span>`; void b.offsetWidth; b.classList.add('show'); }
    } else dSayRun([line]);
    dRegT = setTimeout(step, (id ? 2300 : 2600) / Math.sqrt(daySpeed));
  };
  step();
}
function dRegEnd(v) {
  dScene = null; dSkip = 0; v.sc = 2;
  for (const k of ['dBub', 'dBub2']) { const b = $(k); if (b) b.className = 'cu-bub'; }
  if (v.reg === 'pair') S.seen['rg:pair'] = S.day;
  else if (v.reg !== 'koge') { const [c, k] = v.reg.split(':'); S.seen['rg:' + c] = +k + 1; S.seen['rgd:' + c] = S.day; }
  save();
}
/* そのお菓子が棚にあと何こ（同じお菓子が2マス以上あってもぜんぶ数える） */
const dLeft = key => S.shelf.reduce((a, s) => a + (s.key === key ? s.n : 0), 0);
/* 買う：すきな素材が入ったお菓子（看板が先・なければ高いほう）→ ハート。なければ OTHER_BUY の人がほかのを1こ */
function serve(v) {
  const T = S.today, R = S.dayRun, items = S.shelf.filter(s => s.n > 0);
  const liked = items.filter(s => candyHas(s.key, v.like));
  let s = null, love = false;
  if (liked.length) { love = true; s = liked.find(x => x.key === R.kanban) || liked.sort((a, b) => candyOf(b.key).price - candyOf(a.key).price)[0]; }
  else if (items.length && ((v.reg && v.reg !== 'koge') || Math.random() < OTHER_BUY)) s = pick(items);   // 常連さんの場面の日は、かならず何か買う
  if (!s) return { kind: 'none', say: STORY.custSay(v.c, 'none') };
  const price = decoPrice(s.key);   // かざりのセット効果で値段+1割（11/21）
  s.n--; S.money += price; T.sales += price; T.served++;
  if (s.key === T.kanban && dLeft(T.kanban) <= 0) T.kanbanSoldOut = true;
  if (love) { S.rep += 1 + decoRepAdd(s.key); T.hearts++; S.seen['rh:' + v.c] = (S.seen['rh:' + v.c] || 0) + decoRegMul(v.c); }   // 常連さんの段は、種類ごとのハートの合計で（かざり5つで2倍）
  dDecoSold(s);
  const more = Math.random() < MORE_P * decoMoreMul(v.c) ? (Math.random() < MORE3_P ? 2 : 1) : 0;   // たまに2こ・たまーに3こ（11/19 しょーくん）・かざり3つで2倍
  /* 昼のパズル（11/21）：となりの相性があれば相手もいっしょに・シリーズの列なら同じ列からもう1こ → そのあとに、たまのもう1こ（ぜんぶで3こまで） */
  const got = [s.key], ex = [];
  if (dPairFor(s, got)) ex.push('pair');
  if (dSeriesFor(s, got, v.like)) ex.push('series');
  for (let k = 0; k < more && ex.length < 3; k++) ex.push('more');
  return { kind: love ? 'love' : 'other', key: s.key, say: STORY.custSay(v.c, love ? 'love' : 'other'), more: ex.length, ex, got };
}
/* 昼のパズル（11/21）：買ったお菓子 s のマスの、となりの相性の相手（まだあって、まだ買っていないもの）・シリーズの列のほかのお菓子 */
function dSlotOf(s) { const { slots } = shelfSlots(); return { slots, i: slots.findIndex(o => o && o.s === s) }; }
function dPairFor(s, got) {
  const { slots, i } = dSlotOf(s); if (i < 0) return null;
  for (const L of puzzleOf(slots).links) {
    const j = L.i === i ? L.j : L.j === i ? L.i : -1; if (j < 0) continue;
    const q = slots[j].s; if (q.n > 0 && !got.includes(q.key)) return { s: q, p: L.p, l: L.i + '-' + L.j };
  }
  return null;
}
function dSeriesFor(s, got, like) {
  const { slots, i } = dSlotOf(s); if (i < 0) return null;
  const c = i % SHELF_COLS, se = puzzleOf(slots).series.find(x => x.c === c); if (!se) return null;
  const col = slots.filter((o, j) => o && j % SHELF_COLS === c && o.s.n > 0 && !got.includes(o.s.key)).map(o => o.s);
  if (!col.length) return null;
  const lk = col.filter(x => candyHas(x.key, like));
  return { s: pick(lk.length ? lk : col), c };
}
/* もう1こ買う：v.res.ex の順に（pair＝相性の相手・series＝同じ列・more＝まだ買っていないお菓子からすきな味が先）。ハートは1人1つのまま（お金と売れ行きだけ）。
   相手が売り切れていたら次へ。棚にないときは買わずに帰る */
function dServeMore(v) {
  const T = S.today, got = v.res.got || [], ex = v.res.ex || [];
  const base = S.shelf.find(x => x.key === v.res.key) || S.shelf.find(x => got.includes(x.key));
  let s = null, kind = 'more', tag = null;
  while ((v.mk || 0) < ex.length && !s) {
    kind = ex[v.mk || 0];
    if (kind === 'pair') { const r = base && dPairFor(base, got); if (r) { s = r.s; tag = { l: r.l, p: r.p }; } }
    else if (kind === 'series') { const r = base && dSeriesFor(base, got, v.like); if (r) { s = r.s; tag = { c: r.c }; } }
    else {
      const items = S.shelf.filter(x => x.n > 0); if (!items.length) return null;
      const fresh = items.filter(x => !got.includes(x.key)), pool = fresh.length ? fresh : items, liked = pool.filter(x => candyHas(x.key, v.like));
      s = pick(liked.length ? liked : pool);
    }
    if (!s) v.mk = (v.mk || 0) + 1;   // 相手がもうない：次の買い方へ
  }
  if (!s) return null;
  const price = decoPrice(s.key);
  s.n--; S.money += price; T.sales += price; dDecoSold(s);
  if (s.key === T.kanban && dLeft(T.kanban) <= 0) T.kanbanSoldOut = true;
  v.res.got = [...got, s.key];
  if (kind === 'pair') { T.pairs = (T.pairs || 0) + 1; S.seen['ai:' + tag.p.id] = S.seen['ai:' + tag.p.id] || S.day; }
  if (kind === 'series') T.series = (T.series || 0) + 1;
  const say = kind === 'pair' ? pick(STORY.pairSay) : kind === 'series' ? pick(STORY.seriesSay) : STORY.custSay(v.c, (v.mk || 0) >= 1 ? 'more3' : 'more');
  return { key: s.key, say, kind, ...(tag || {}) };
}
/* かざり5つのセット効果：そのお菓子が売り切れたらハート（11/21） */
function dDecoSold(s) { if (s.n <= 0 && decoSoldHeart(s.key)) { S.rep++; S.today.hearts++; } }
function closeDay(msg) {
  const R = S.dayRun; R.done = true; R.cur = null;
  clearTimeout(dayTick); dayTick = 0;
  const loss = S.shelf.some(s => s.n > 0) && !S.seen.loss ? (S.seen.loss = S.day, STORY.lossFirst) : [];   // 売れのこりは今日でおしまい（はじめての日だけ ほのかが言う）
  save(); if (msg) toast(msg);
  renderDay(); mSe('close');
  setTimeout(() => dPreload(D_PRE_MORNING()), 4000);   // 夜のあいだに、あしたの朝の絵を先に読んでおく（夜の絵が読みおわってから）
  setTimeout(() => {
    const sd = dSum(R), E = dEv(R);
    const lines = [...loss, ...(E ? STORY.pickE(STORY.ev[E.id].close) : []), ...(sd ? STORY.fill(STORY.pickE(STORY.sum[sd.k]), sd) : [])];
    lines.length ? dSayRun(lines.slice(0, 3)) : dSay('close', '', true);
  }, 500);
  if (S.day === 1 && !S.seen.dayClose) { S.seen.dayClose = 1; save(); talk([...STORY.dayClose(S.today), ...loss], () => {}); }
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
    const img = ART[(T.faces && (T.faces[m[2]] || T.faces['ふつう'])) || who] || '', ch = dChibi(who, m[2] || '', m[3]);
    el.dataset.who = who;
    el.classList.toggle('chibi', !!ch);
    el.innerHTML = ch ? `<img class="ds-chibi" src="${ch}" alt=""><span class="ds-bub"><b>${esc(m[1])}</b><span>${esc(m[3])}</span></span>`
      : `<i class="ds-av"${img ? ` style="--av:url('${img}')"` : ''}></i><b>${esc(m[1])}</b><span>${esc(m[3])}</span>`;
    dSayPlace(el);
    el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
    dSayT = setTimeout(step, 2600 / Math.sqrt(daySpeed));
  };
  step();
}
/* 舞台の外（昼の画面の section）に置いて、舞台の左下のふちに立たせる（11/19 しょーくん「ほのかの顔が潰れちゃってるくらい小さい」
   「戦闘のフレームにいるチビほのかとか、そのまま使えない？枠から飛び出してもいい」「右向きでキャラを設置して、それが喋ってるみたいな」） */
function dSayEl() {
  const st = $('dstage'); if (!st) return null;
  let el = $('dSay');
  if (el && el.parentElement !== st.parentElement) { el.remove(); el = null; }
  if (!el) { el = document.createElement('p'); el.id = 'dSay'; el.className = 'd-say'; el.setAttribute('role', 'status'); st.parentElement.appendChild(el); }
  return el;
}
function dSayPlace(el) {
  const st = $('dstage'); if (st) el.style.top = (st.offsetTop + st.offsetHeight) + 'px';
}
/* しゃべる人のデフォルメ（夜の舞台と同じ chibi-*・minamo-chibi-*・wakaba-chibi-*）：考える・すわって にこにこ・応援（！）を、表情と文で */
function dChibi(who, face, text) {
  const pose = /考|かんがえ|こまり|ふあん|不安|しょんぼり|ジト|じと|ため息|あちゃ|なやみ/.test(face) || /[？?]|……$/.test(text) ? 'think'
    : /！|!/.test(text) || /うれし|わくわく|やるき|ドヤ|どや|びっくり|よろこ|感動/.test(face) ? 'cheer' : 'sit';
  const pre = who === 'honoka' ? '' : who + '-';
  return ART[pre + 'chibi-' + pose] || ART[pre + 'chibi-cheer'] || '';
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
/* 生きものの絵（11/19 しょーくん「描き下ろしじゃない所も一緒に制作」→ H-033）：葉っぱは夜の fx-leaf・fx-petal を使いまわす。
   鳥 fx-bird・ちょうちょ fx-butterfly は届いたら自動で出る（ないときは今のコードの絵） */
function dAmbArt(kind) {
  const n = kind === 'bird' ? 'fx-bird' : kind === 'fly' ? 'fx-butterfly' : pick(['fx-leaf', 'fx-leaf', 'fx-petal']);
  return ART[n] ? `<img class="amb-art" src="${ART[n]}" alt="">` : '';
}
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
      el.innerHTML = `<i>${dAmbArt(kind) || (kind === 'bird' ? D_BIRD : kind === 'leaf' ? D_LEAF(pick(['#e8a040', '#d9733a', '#9fbf5a'])) : D_BUTTERFLY)}</i>`;
      el.addEventListener('animationend', e => { if (e.target === el) el.remove(); });
      lay.appendChild(el);
    }
  }
  const gap = ev === 'kotori' || ev === 'kaze' ? 2500 + Math.random() * 2500 : 6500 + Math.random() * 6500;
  dAmbT = setTimeout(dAmbient, gap / Math.sqrt(daySpeed));
}

/* ---------- お客さんの見た目（絵は day-scene.js の custHTML） ---------- */
const custEl = () => document.querySelector('#dCust .cu:not(.duo2)');
const dCustEls = () => document.querySelectorAll('#dCust .cu');   // 2人の場面（常連さん）はマーサもいっしょに
const faceOf = v => (v.step >= 2 && v.res ? (v.res.kind === 'love' ? 'happy' : v.res.kind === 'none' ? 'sad' : '') : '');
function showCust(v, now) {
  const box = $('dCust'); if (!box) return;
  const face = faceOf(v), at = (now ? ' at still' : '') + (v.step >= 3 ? ' leave' : '');
  const duo = v.duo ? `<div class="cu cu-${v.duo} duo2${at}">${custHTML(v.duo, '', 1)}<div class="cu-bub" id="dBub2"></div></div>` : '';   // 2人の場面：マーサは左うしろ
  box.classList.toggle('duo', !!v.duo);
  box.innerHTML = duo + `<div class="cu cu-${v.c}${face ? ' ' + face : ''}${at}">${custHTML(v.c, face, v.vr)}<div class="cu-bub" id="dBub"></div></div>`;
  if (!now) { const els = dCustEls(); requestAnimationFrame(() => requestAnimationFrame(() => els.forEach(el => el.classList.add('at')))); }
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
  /* 相性の結び目・シリーズのリボンを光らせる（11/21） */
  const cs = $('dCase'), el = cs && (m.l ? cs.querySelector(`.d-aisho[data-l="${m.l}"]`) : m.c != null ? cs.querySelector(`.d-series[data-c="${m.c}"]`) : null);
  if (el) { el.classList.remove('hit'); void el.offsetWidth; el.classList.add('hit'); }
}
/* 棚を描きなおす：変わったマスだけ入れかえる（11/19：前は売れるたびに棚ぜんぶを作りなおしていた） */
function dCaseUpdate() {
  const cs = $('dCase'); if (!cs) return null;
  const tmp = document.createElement('div'); tmp.innerHTML = caseHTML(false);
  const olds = [...cs.children], news = [...tmp.children];
  if (olds.length !== news.length) cs.replaceChildren(...news);
  else news.forEach((n, i) => { if (n.outerHTML !== olds[i].outerHTML) olds[i].replaceWith(n); });
  return cs;
}
/* 売れた：棚を描きなおして、そのマスに「売れた！」 */
function soldFx(key) {
  const cs = dCaseUpdate(); if (!cs) return;
  const sl = cs.querySelector(`.dslot[data-key="${CSS.escape(key)}"]`); if (!sl) return;
  sl.classList.add('pop');
  sl.insertAdjacentHTML('beforeend', `<span class="d-sold${ART['ui-sold'] ? ' art' : ''}">売れた！</span>`);   // 札の絵 ui-sold は届いたら（H-033）
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
  const R = S.dayRun; if (R) dLightSync(R, R.open && !R.done && !talking());
}

/* 昼の画面のボタン（data-act）。main.js の ACTS に入る */
const DAY_ACTS = {
  'd-pick': el => pickKanban(el.dataset.i),
  'd-open': () => openDay(),
  'd-fast': el => toggleDayFast(el),
  'd-bell': () => dBell(),
};
