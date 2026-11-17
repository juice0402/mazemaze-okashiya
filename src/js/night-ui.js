/* ==== 夜のバトルの画面：舞台（ほのか・モンスター・鉄板の火力の光）・調理台（左にフィールドの「場」＋アイコンのタイル5つを1行・左から順）・仕入れ・下のボタン列
   生地のタイルには焼き加減のメーター（9段階・9でサイコー）
   バトル中は、タイル行のすぐ下に発動したカードの説明を出す（手札の上にかぶせる）
   カードはタップでえらぶ → 光る行き先をタップで置く・うごかす・まぜる（まぜる前に、できるカードを見せる）。えらんだカードをもう1回タップで大きく見る ==== */
const ORD = ['①', '②', '③', '④', '⑤'];

/* ---------- 演出 ---------- */
/* 鉄板の火力（1〜4）。フィールドがないと焼けないので、光らせない */
function setHeat(h) {
  scn.heat = h;
  const bar = $('heatBar'), lab = $('heatLabel'); if (!bar) return;
  [...bar.children].forEach((c, i) => { c.className = i < h ? 'on h' + (i + 1) : ''; });
  lab.textContent = N.field ? HEAT[h] : `${HEAT[h]}（場なし）`;
  lab.className = 'heat-label h' + (N.field ? h : 0);
  const st = $('stage'); if (st) st.dataset.z = N.field ? h : 0;
}
/* タイル1つを描きなおす（焼き加減・焦げ） */
function updTile(i, cid, cook) {
  const slot = document.querySelector(`.tslot[data-w="board"][data-i="${i}"]`); if (!slot) return null;
  slot.innerHTML = `<i class="ord">${i + 1}</i>${cardTile(cid, { cook })}`;
  return slot.querySelector('.pc');
}
function burntFx(slot) { replay($('smoke'), 'on'); heroFor('oops', 1100); if (slot) floatAt(slot, '焦げた', 'koge'); }
function floatAt(el, text, cls = '') {
  if (!el) return;
  const f = document.createElement('span');
  f.className = 'float ' + cls; f.textContent = text;
  el.appendChild(f); setTimeout(() => f.remove(), 1000);
}
function replay(el, cls) { if (!el) return; el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); }
/* 数字をかぞえ上げる（ms のあいだ） */
function countUp(el, from, to, ms, f = fmt) {
  if (!el) return;
  if (REDUCED || ms < 60 || from === to) { el.textContent = f(to); return; }
  const t0 = performance.now();
  const tick = now => { const t = Math.min(1, (now - t0) / ms), v = from + (to - from) * (1 - Math.pow(1 - t, 3)); el.textContent = f(Math.floor(v)); if (t < 1) requestAnimationFrame(tick); };
  requestAnimationFrame(tick);
}
/* バトルの一撃：ほのかの手から火の玉 → モンスターに当たって光の輪と火花 → 大きな数字。ノルマにくらべて大きいほど派手に（big・huge） */
function hitFx(dmg, q) {
  const st = $('stage'), fl = $('floats'), mon = $('mon'), chef = $('chef');
  replay(chef, 'act');
  const size = dmg >= q * 0.6 ? 'huge' : dmg >= q * 0.2 ? 'big' : '', fly = T(300);
  const land = () => { replay(mon, 'hit'); floatAt(fl, fmt(dmg), 'dmg ' + size); if (size) replay(st, size === 'huge' ? 'quake2' : 'quake'); decoReact(size ? 'jump' : 'hop', size ? 800 : 500); if (size) decoChibi('cheer', 1400); };
  if (REDUCED || !st || !fl || !mon || !chef || !st.animate) return land();
  const S = st.getBoundingClientRect(), c = chef.getBoundingClientRect(), m = mon.getBoundingClientRect();
  const x0 = c.right - S.left - c.width * 0.18, y0 = c.top - S.top + c.height * 0.32, x1 = m.left - S.left + m.width * 0.45, y1 = m.top - S.top + m.height * 0.5;
  const add = (cls, x, y) => { const e = document.createElement('i'); e.className = cls; e.style.left = x + 'px'; e.style.top = y + 'px'; fl.appendChild(e); return e; };
  const ball = add('fx-ball' + (size ? ' big' : ''), x0, y0), ang = Math.atan2(y1 - y0, x1 - x0) * 180 / Math.PI;
  ball.animate([{ transform: `translate(0,0) rotate(${ang}deg) scale(.5)` }, { transform: `translate(${(x1 - x0) / 2}px,${(y1 - y0) / 2 - 22}px) rotate(${ang}deg) scale(1.15)`, offset: .5 }, { transform: `translate(${x1 - x0}px,${y1 - y0}px) rotate(${ang}deg) scale(1.3)` }],
    { duration: fly, easing: 'ease-in', fill: 'forwards' });
  setTimeout(() => {
    ball.remove(); land();
    const h = add('fx-hit' + (size ? ' big' : ''), x1, y1); setTimeout(() => h.remove(), 460);
    for (let i = 0, n = size ? 16 : 9; i < n; i++) {
      const sp = add('fx-spark', x1, y1), a = Math.random() * Math.PI * 2, r = 30 + Math.random() * (size ? 74 : 42);
      sp.animate([{ transform: 'translate(0,0) rotate(45deg)', opacity: 1 }, { transform: `translate(${Math.cos(a) * r}px,${Math.sin(a) * r + 14}px) rotate(225deg) scale(.3)`, opacity: 0 }],
        { duration: 380 + Math.random() * 200, easing: 'cubic-bezier(.15,.8,.3,1)', fill: 'forwards' });
      setTimeout(() => sp.remove(), 620);
    }
  }, fly);
}

/* ---------- バトルの流れ（11/18 しょーくん「一瞬すぎて味気ない」「ショップ→戦闘の移行をかっこよく」・ぜんぶのせシップの切りかえを参考に） ---------- */
/* 1. バトル！を押すと、ショップのカードが上へはけて、ショップがのれんのように上がる */
function shopOut(done) {
  const ov = document.querySelector('.shopov');
  if (!ov || REDUCED) return done();
  ov.classList.add('out');
  setTimeout(done, 560);
}
/* 2. ラウンドの帯：ななめの帯が走って「ラウンド 3/9」「バトル！」「ノルマ」。モンスターがほえる */
function battleIntro(q, done) {
  const st = $('stage');
  if (!st || REDUCED) return done();
  const ms = T(1450), el = document.createElement('div');
  el.className = 'bintro'; el.style.setProperty('--bd', ms + 'ms');
  el.innerHTML = `<i class="bi-band"></i><p class="bi-r">ラウンド <b>${N.round}</b> / ${ROUNDS}</p><p class="bi-t">バトル！</p><p class="bi-q">ノルマ <b>${fmt(q)}</b></p>`;
  st.appendChild(el);
  replay($('mon'), 'roar'); decoReact('scare', 600); setTimeout(() => replay($('chef'), 'act'), T(300));
  setTimeout(() => { el.remove(); done(); }, ms);
}
/* 3〜4. バトルの1こま。演出にかかる時間（ふつうの速さの ms）を返す
   焼き：生地のタイルが左から順にジュッ（+火力のぶん・サイコー・焦げ）
   発動：タイルがコンと跳ね、下のパネルにカードと計算（もとの数字 → ×焼き加減 → ×スタート… → ダメージ）を1つずつ出してから、火の玉 */
function showEvent(e, run, q) {
  document.querySelectorAll('.tslot.now').forEach(s => s.classList.remove('now'));
  const co = $('callout');
  if (e.type === 'bake') {
    if (co) { co.innerHTML = bakePanel(e); replay(co, 'pop'); }
    replay($('stage'), 'sizzle'); replay(document.querySelector('.tiles'), 'bakefx');   // 鉄板の下から炎がゆらっと上がる
    const t0 = 420, gap = 260;
    e.list.forEach((x, n) => setTimeout(() => {
      const card = updTile(x.i, x.cid, x.burnt ? undefined : x.to), slot = card && card.parentNode;
      if (card) replay(card, 'sear');
      if (x.burnt) burntFx(slot);
      else floatAt(slot, x.to >= COOK_MAX ? 'サイコー！' : `焼き+${x.to - x.from}`, x.to >= COOK_MAX ? 'best' : 'cookup');
    }, T(t0 + n * gap)));
    /* すみびクッキー：ほかの生地へ「焦げない」のオーラ */
    const stops = e.stop == null ? [] : e.list.filter(x => x.i !== e.stop);
    if (stops.length) setTimeout(() => stops.forEach((x, n) => setTimeout(() => aura(e.stop, x.i, 'stop'), T(n * 90))), T(t0 + e.list.length * gap));
    return 1050 + e.list.length * gap + (stops.length ? 600 : 0);
  }
  const d = cardDef(e.cid), slot = tslot(e.i), card = slot && slot.querySelector('.pc');
  if (slot) slot.classList.add('now', 'done');
  if (e.again) takeBuff(e.i, e.i - 1, 'again');
  /* 1. 発動したカードが跳ねる（★1 ぽん・★2 大きく・★3 縦にくるっと1回転してズドン） */
  const lead = card ? actBounce(card, d.star) : 300;
  if (co) {
    co.innerHTML = actPanel(e, q); replay(co, 'pop');
    const bc = co.querySelector('.bp-card .pc'); if (bc) { bc.style.setProperty('--ad', T(d.star >= 3 ? 700 : 480) + 'ms'); replay(bc, 'bpon'); }
  }
  /* 2. 計算と効果の札を1つずつ、ぽんと出す。いま効いている札が光り、右の数字がその札の分だけ変わる。ほかのカードとの効果はオーラが飛ぶ */
  const chips = co ? [...co.querySelectorAll('.f-chip')] : [], num = co && co.querySelector('.bp-dmg');
  let t = lead;
  chips.forEach((ch, n) => {
    setTimeout(() => chipStep(e, ch, chips[n - 1], num), T(t));
    t += ch.dataset.out != null || ch.dataset.src ? 480 : 380;
  });
  if (e.dmg > 0) {
    t += 120;
    setTimeout(() => { if (num) { num.classList.add('in', 'fin'); num.querySelector('b').textContent = fmt(e.dmg); replay(num, 'bump'); } }, T(t));
    t += 320;
    setTimeout(() => {
      hitFx(e.dmg, q);
      const sc = $('score'), before = N.score + run - e.dmg;
      countUp(sc, before, N.score + run, T(460)); replay(sc, 'tick');
      $('qfill').style.width = Math.min(100, run / q * 100) + '%';
      $('qtext').textContent = `${fmt(run)} / ノルマ ${fmt(q)}`;
      if (run >= q && run - e.dmg < q) setTimeout(() => replay(document.querySelector('.quota'), 'reach'), T(200));
    }, T(t));
    t += 760;
  } else t += 420;
  return t;
}
/* 札を1つ出す：ぽんと跳ねて光る（前の札は光が消える）・数字が変わる・オーラ */
function chipStep(e, ch, prev, num) {
  if (prev) prev.classList.remove('cur');
  ch.style.setProperty('--ad', T(360) + 'ms');
  ch.classList.add('in', 'cur');
  if (ch.dataset.v != null && num) {
    const b = num.querySelector('b'), v = +ch.dataset.v;
    if (!num.classList.contains('in')) { num.classList.add('in'); b.textContent = fmt(Math.floor(v)); }
    else countUp(b, Math.floor(+ch.dataset.p || 0), Math.floor(v), T(260));
    replay(num, 'bump');
  }
  if (ch.dataset.src) auraIn(e, ch.dataset.src.split(',').map(Number), ch.dataset.k);
  if (ch.dataset.out != null) auraOut(e, e.out[+ch.dataset.out]);
}
/* 下のパネル（手札の所にかぶせる）：左にカード・名前・計算の札・右に大きなダメージ。--x は指す場所（「場」が0） */
const tileX = j => `--x:${(j + .5) / (SLOTS + 1) * 100}%`;
const fchip = (op, v, label, cls = '', data = '') => `<span class="f-chip ${cls}"${data}><b>${op}${fmtMul(v)}</b><small>${label}</small></span>`;
/* 札のデータ：v＝この札のあとの数字・p＝前の数字・src＝効果の元のマス（k は種類）・out＝飛ばす先（e.out の番号） */
const chipData = o => Object.entries(o).filter(([, v]) => v != null && v !== '').map(([k, v]) => ` data-${k}="${v}"`).join('');
const PART_K = l => l === '次の攻撃' ? 'next' : l === 'となり' ? 'nb' : l === 'スタート' ? 'rally' : l.startsWith('サイコー') ? 'best' : '';
function bakePanel(e) {
  const F = FIELDS[N.field], nb = e.list.filter(x => x.burnt).length, best = e.list.filter(x => !x.burnt && x.to >= COOK_MAX).length;
  const ch = [`<span class="f-chip in h${e.heat}"><b>${HEAT[e.heat]}</b><small>焼き+${e.heat}</small></span>`];
  if (best) ch.push(`<span class="f-chip in best"><b>サイコー</b><small>${best}枚</small></span>`);
  if (nb) ch.push(`<span class="f-chip in koge"><b>焦げ</b><small>${nb}枚</small></span>`);
  return `<div class="bp" style="${tileX(0)}"><div class="bp-card">${cardMini('b:' + N.field)}</div>
    <div class="bp-main"><p class="bp-name">${esc(F.name)}で焼く！</p><p class="bp-sub">バトル開始時・調理台の生地がいっせいに焼ける</p><div class="bp-f">${ch.join('')}</div></div><b class="bp-dmg soft in"><b>ジュッ</b></b></div>`;
}
function actPanel(e, q) {
  const d = cardDef(e.cid), ch = [], out = k => { const n = (e.out || []).findIndex(o => o.k === k); return n < 0 ? null : n; };
  let v = 0;
  if (e.dmg > 0 && e.base) { v = e.base; ch.push(`<span class="f-chip base calc"${chipData({ v })}><b>${fmt(e.base)}</b><small>ダメージ</small></span>`); }
  for (const [op, x, label, src] of e.parts || []) {
    const p = v; v = op === '×' ? v * x : v + x;
    ch.push(fchip(op, x, label, 'calc ' + (label === 'スタート' ? 'pos' : label.startsWith('サイコー') ? 'best' : label === '次の攻撃' ? 'next' : ''), chipData({ v, p, src: src && src.join(','), k: src && PART_K(label) })));
  }
  if (e.fin) ch.push(fchip('×', e.fin[0], 'アンカー：合計', 'calc pos', chipData({ v: e.dmg, p: v, out: out('fin') })));
  const rl = out('rally'); if (rl != null) ch.push(fchip('+', e.out[rl].v, '攻撃ぜんぶへ', 'pos', chipData({ out: rl })));
  const nb = out('nb'); if (nb != null) ch.push(fchip('+', e.out[nb].v, 'となりへ', 'pos', chipData({ out: nb })));
  if (e.heat) ch.push(`<span class="f-chip h${e.heat[1]}"${chipData({ out: out('heat') })}><b>${HEAT[e.heat[0]]}→${HEAT[e.heat[1]]}</b><small>火力</small></span>`);
  if (e.sear) ch.push(e.sear.burnt ? `<span class="f-chip koge"${chipData({ out: out('sear') })}><b>焦げた</b><small>右の生地</small></span>` : `<span class="f-chip c${cookStage(e.sear.to)}"${chipData({ out: out('sear') })}><b>焼き+${e.sear.to - e.sear.from}</b><small>右の生地</small></span>`);
  if (e.next) ch.push(fchip('×', e.next, '次の攻撃へ', 'next', chipData({ out: out('next') })));
  if (fxOn(d, 'again') && !e.again) ch.push(`<span class="f-chip"${chipData({ out: out('again') })}><b>もう1回</b><small>右どなり</small></span>`);
  if (e.call) ch.push('<span class="f-chip"><b>フィールド</b><small>次のショップ</small></span>');
  const dmg = e.dmg > 0 ? `<b class="bp-dmg${e.dmg >= q / 3 ? ' hot' : ''}"><b>0</b></b>` : '';
  return `<div class="bp" style="${tileX(e.i + 1)}"><div class="bp-card">${cardMini(e.cid, { cook: e.cook })}</div>
    <div class="bp-main"><p class="bp-name">${e.again ? '<em>もう1回</em>' : ''}${esc(d.short)}</p><div class="bp-f">${ch.join('')}</div></div>${dmg}</div>`;
}
const fxOn = (d, k) => !!d.fx[k];
const cookStage = c => (c || 0) >= COOK_MAX ? 3 : (c || 0) >= 6 ? 2 : (c || 0) >= 3 ? 1 : 0;
const fmtMul = v => Math.round(v * 100) / 100;
/* ★3 のカットイン：ななめの金の帯に、ほのかが左から・カードが右から・名前を大きく。かかる時間（ms）を返す */
function cutIn(cid, sub) {
  const d = cardDef(cid), h = heroPick('battle'), ms = T(1500);
  const el = document.createElement('div');
  el.className = 'cutin'; el.style.setProperty('--cd', ms + 'ms');
  el.innerHTML = `<i class="ci-flash"></i><div class="ci-band"><i class="ci-lines"></i><div class="ci-in">
    <img class="ci-hero${h.flip ? ' flip' : ''}" src="${h.src}" alt="">
    <div class="ci-card pc k-s s3">${artImg(cid)}<i class="pc-shine"></i></div>
    <p class="ci-title"><small>${sub}</small><span>${esc(d.short)}</span></p></div></div>`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), ms);
  return ms;
}

/* まぜる演出（約1.5秒）：まわりが暗く → 2枚がシュッと飛び出して、まんなかで止まって（ヒットストップ）ガキーン → 火花・光 → できたカードがくるっと出て名前の札 → マスへ。終わったら done */
function cardSpot(p) {
  const el = document.querySelector(p.where === 'board' ? `.tslot[data-w="board"][data-i="${p.i}"] .pc` : `.handcard[data-w="${p.where}"][data-i="${p.i}"] .pc`);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: el.offsetWidth };
}
const SPARK = ['#fff6d8', '#ffd45a', '#ff9a3c', '#ffe9a8', '#8fe0c0', '#ff8f6a'];
function mixFx(from, ca, cb, cr, to, done, isNew) {
  const tile = document.querySelector(to.where === 'board' ? `.tslot[data-w="board"][data-i="${to.i}"]` : `.handcard[data-w="held"][data-i="${to.i}"]`), tc = tile && tile.querySelector('.pc');
  const end = skip => { if (tc) { tc.style.visibility = ''; replay(tc, 'born'); } done(skip); };   // skip＝演出なしで終わった
  if (REDUCED || !from[0] || !from[1] || !tc || !tc.animate) return end(true);
  tc.style.visibility = 'hidden';
  const d = cardDef(cr), star = d.star || 2;
  const W = innerWidth, H = innerHeight, cx = W / 2, cy = H * 0.42, S = Math.min(W * 0.3, 128), RW = S * 1.4;
  const FLY = 440, STOP = 90, HOLD = 720, LAND = 280, HIT = FLY + STOP;
  const ov = document.createElement('div');
  ov.className = 'mixfx r' + star; ov.style.setProperty('--cy', cy + 'px'); ov.style.setProperty('--rh', RW * 1.4 + 'px');
  const tw = [[-.62, -.5], [.6, -.36], [-.58, .42], [.64, .5]].map(([a, b], i) =>
    `<i class="mf-tw" style="left:${cx + a * RW}px;top:${cy + b * RW * 1.4}px;animation-delay:${.25 + i * .12}s"></i>`).join('');
  ov.innerHTML = `<i class="mf-dim"></i><i class="mf-lines"></i><i class="mf-burst"></i><i class="mf-flash"></i><i class="mf-ring"></i><i class="mf-ring b"></i>${tw}
    <b class="mf-sfx">ガキーン！</b><p class="mf-name">${isNew ? '<b>レシピ ひらめき！</b>' : ''}<small>${'★'.repeat(star)}</small><span>${esc(d.short)}</span></p>`;
  document.body.appendChild(ov);
  const card = (cid, f, w, cls = '') => {
    const c = document.createElement('div');
    c.className = 'mf-card ' + cls; c.innerHTML = cardMini(cid);
    Object.assign(c.style, { width: w + 'px', left: f.x - w / 2 + 'px', top: f.y - w * 0.7 + 'px' });
    ov.appendChild(c); return c;
  };
  /* 火花：x,y から n こ、まわりに飛びちる（少し下に落ちる） */
  const sparks = (x, y, n, far) => {
    for (let i = 0; i < n; i++) {
      const e = document.createElement('i'), a = Math.PI * 2 * i / n + Math.random() * .6, r = far * (.5 + Math.random() * .7), z = 5 + Math.random() * 10;
      e.className = 'mf-spark' + (i % 3 ? '' : ' st');
      Object.assign(e.style, { left: x + 'px', top: y + 'px', width: z + 'px', height: z + 'px', background: SPARK[i % SPARK.length] });
      ov.appendChild(e);
      e.animate([{ transform: 'translate(-50%,-50%) scale(1.2) rotate(45deg)', opacity: 1 },
        { transform: `translate(calc(-50% + ${Math.cos(a) * r}px),calc(-50% + ${Math.sin(a) * r + far * .3}px)) scale(.2) rotate(${200 + Math.random() * 400}deg)`, opacity: 0 }],
        { duration: 550 + Math.random() * 400, easing: 'cubic-bezier(.12,.8,.3,1)', fill: 'forwards' });
    }
  };
  /* 1. うしろに引いて → 2. 加速してまんなかへ → 3. ぶつかって止まる（残像が2枚ついてくる） */
  const left = from[0].x <= from[1].x ? -1 : 1, moving = [];
  [[ca, from[0], left], [cb, from[1], -left]].forEach(([cid, f, side]) => {
    const k = S / f.w, ty = cy - f.y;
    const keys = [
      { transform: 'translate(0,0) scale(1) rotate(0deg)', easing: 'cubic-bezier(.2,1.6,.4,1)' },
      { transform: `translate(${side * 12}px,-34px) scale(1.18) rotate(${side * 10}deg)`, offset: .3, easing: 'cubic-bezier(.7,0,1,.5)' },
      { transform: `translate(${cx + side * S * 0.95 - f.x}px,${ty}px) scale(${k}) rotate(${side * 16}deg)`, offset: .84 },
      { transform: `translate(${cx + side * S * 0.2 - f.x}px,${ty}px) scale(${k * 1.08},${k * .94}) rotate(${side * 3}deg)` },
    ];
    [2, 1, 0].forEach(g => {
      const el = card(cid, f, f.w, g ? 'ghost g' + g : '');
      el.animate(keys, { duration: FLY, delay: g * 45, fill: 'both' });
      moving.push(el);
    });
  });
  setTimeout(() => ov.classList.add('touch'), FLY);   // ぶつかった所で光って止まる（ヒットストップ）
  /* ガキーン：白く光って、大きくゆれて、光の輪と線と火花。できたカードがくるっと出て、名前の札 */
  let R;
  setTimeout(() => {
    ov.classList.add('hit');
    replay(document.querySelector('.night'), 'quake2');
    heroFor('joy', HOLD + LAND + 300);
    moving.forEach(el => el.animate([{ opacity: el.classList.contains('ghost') ? .4 : 1 }, { opacity: 0 }], { duration: 120, fill: 'forwards' }));
    sparks(cx, cy, star === 3 ? 28 : 20, S * 1.7);
    R = card(cr, { x: cx, y: cy }, RW, 'mf-res');
    R.insertAdjacentHTML('beforeend', '<i class="mf-shine"></i>');
    R.animate([{ transform: 'perspective(700px) rotateY(-110deg) scale(.4)', opacity: 0 },
      { transform: 'perspective(700px) rotateY(14deg) scale(1.2)', opacity: 1, offset: .6 },
      { transform: 'perspective(700px) rotateY(0deg) scale(1)', opacity: 1 }], { duration: 460, easing: 'ease-out', fill: 'forwards' });
  }, HIT);
  /* できたカードが、調理台のマスへ飛んでいく → ついたら小さい火花 */
  setTimeout(() => {
    ov.classList.add('land');
    const t = tc.getBoundingClientRect(), k = tc.offsetWidth / RW;
    R.animate([{ transform: 'translate(0,0) scale(1)' }, { transform: `translate(${t.left + t.width / 2 - cx}px,${t.top + t.height / 2 - cy}px) scale(${k}) rotate(-6deg)`, opacity: .9 }],
      { duration: LAND, easing: 'cubic-bezier(.5,0,.9,.5)', fill: 'forwards' });
  }, HIT + HOLD);
  setTimeout(() => {
    const t = tc.getBoundingClientRect();
    R.remove(); end(); sparks(t.left + t.width / 2, t.top + t.height / 2, 10, 46);
    setTimeout(() => ov.remove(), 950);
  }, HIT + HOLD + LAND);
}

/* ほのかの立ち絵：バトルは右向きのかまえ。表情の絵は左向きなので左右反転して右向きにする */
const HERO = { battle: ['honoka-battle', false], joy: ['honoka-joy', true], surprise: ['honoka-surprise', true], oops: ['honoka-oops', true] };
function heroPick(k) { const [n, flip] = HERO[k]; return ART[n] ? { src: ART[n], flip } : { src: ART.honoka || big(CHEF_SPR[0], 8), flip: !!ART.honoka }; }
function heroImg(k) { const h = heroPick(k); return `<img class="chef${ART.honoka ? ' hi' : ''}${h.flip ? ' flip' : ''}" id="chef" src="${h.src}" alt="炎のシェフ ほのか">`; }
let heroT = 0;
function heroFor(k, ms) {
  const el = $('chef'); if (!el) return;
  const set = kk => { const h = heroPick(kk); el.src = h.src; el.classList.toggle('flip', h.flip); };
  set(k); clearTimeout(heroT); heroT = setTimeout(() => set('battle'), ms);
}
const MON_URL = {};
const monURL = id => MON_URL[id] || (MON_URL[id] = ART['mon-' + id] || big(MON_SPR[id], 8));
const monIsArt = id => !!ART['mon-' + id];
function heatCells() { return Array.from({ length: HEAT_MAX }, () => '<i></i>').join(''); }

/* ---------- タップで大きく見る画面（カード＋説明＋ボタン）とラウンドの結果 ---------- */
function viewerHTML() {
  if (N.stage === 'roundEnd') {
    const L = N.last, drop = MATS[MONSTERS[N.mon].drop].short, gain = [];
    if (L.ok) gain.push(`コイン+${QUOTA_BONUS}`, `${drop}を1つ`);
    return `<div class="viewer soft"><div class="vbox result ${L.ok ? 'ok' : ''}" data-act="noop">
      <p class="r-round">ラウンド ${L.round}</p><p class="r-num">${fmt(L.total)}</p><p class="r-q">ノルマ ${fmt(L.q)}</p>
      <p class="r-msg">${L.ok ? 'ノルマ たっせい！' : 'ノルマに とどかなかった…'}</p>${gain.length ? `<p class="r-gain">${gain.join('　')}</p>` : ''}
      <button class="big" data-act="next">${L.round >= ROUNDS ? '撃退の結果へ' : '次のラウンドへ'}</button></div></div>`;
  }
  const s = N.sel;
  if (!s || !N.view || N.stage !== 'shop') return '';
  const box = (cid, cook, btns, hint) => `<div class="viewer" data-act="close"><div class="vbox" data-act="noop"><button class="vclose" data-act="close" aria-label="とじる">×</button>${cardBig(cid, cook)}${cardInfo(cid, cook)}
    <div class="vbtns"><button class="pill sub" data-act="close">とじる</button>${btns}</div><p class="vhint">${hint}</p></div></div>`;
  if (s.where === 'shop') {
    const cid = N.shop[s.i]; if (!cid) return '';
    const d = cardDef(cid), free = N.round === 1;
    return box(cid, null, `<button class="pill go2" data-act="buy" data-i="${s.i}" ${!free && N.coins < d.cost ? 'disabled' : ''}>${free ? 'もらう' : `買う <small>コイン${d.cost}</small>`}</button>`,
      d.cat === 'field' ? 'ドラッグで「場」へ' : '買うと手札へ・ドラッグで調理台へ・かさねて まぜる');
  }
  if (s.where === 'field') return N.field ? box('b:' + N.field, null, sellBtn(), '新しいのを買うと入れかわる') : '';
  const c = cardAt(s); if (!c) return '';
  return box(c.cid, c.cook, sellBtn(), s.where === 'held' ? `手持ち・${mixRule(cardDef(c.cid))}` : `${ORD[s.i]}番め・${mixRule(cardDef(c.cid))}`);
}
/* うる（1ラウンド目の★1は「もどす」＝無料の枠がもどる） */
function sellLabel(d) { const v = sellValue(d); return v ? `うる <small>+${v}</small>` : 'もどす'; }
function sellBtn() {
  const s = N.sel, c = s.where === 'field' ? { cid: 'b:' + N.field } : cardAt(s);
  return `<button class="pill sub" data-act="sell">${sellLabel(cardDef(c.cid))}</button>`;
}
/* 手札：自分のカード（買った・まぜた。5まいまで）を扇形に。手札の空いている所は「手札へ」の行き先（data-w="hand"） */
const mixesWithMine = (cid, skip) => mixesWithBoard(cid) || N.held.some((x, i) => i !== skip && mixable(cardDef(cid), cardDef(x.cid)));
function handHTML() {
  const n = N.held.length;
  return `<div class="hand${n ? '' : ' empty'}" data-drop data-w="hand" data-i="0" style="--n:${Math.max(n, 3)};--ov:${n >= 5 ? .14 : .08}">${n ? N.held.map((c, i) => `<button class="handcard" style="--k:${i + (3 - Math.min(n, 3)) / 2}" data-act="card" data-drag data-drop data-w="held" data-i="${i}">${cardMini(c.cid, { cook: c.cook })}${mixesWithMine(c.cid, i) ? '<i class="mixmark">まぜ</i>' : ''}</button>`).join('')
    : '<p class="hand-empty">ショップで買ったカードが ここに入るよ</p>'}<span class="hand-n">手札 ${n}/${HELD_MAX}</span></div>`;
}
function barHTML() {
  if (fighting) return `<button class="pill sub spd${bSpeed > 1 ? ' on' : ''}" data-act="spd">${spdLabel()}</button>`;   // バトル中は、はやおくり
  return `<button class="bake" data-act="bake" ${busy || N.stage !== 'shop' ? 'disabled' : ''}>バトル！</button>`;
}
/* ショップ：準備のあいだ、舞台にかぶせる（バトルのときはとじる）。3まい（1ラウンド目は無料の5まい）・コイン・有料の入れかえ・うる
   カードはドラッグで手札・調理台へ（かさねると買いながら まぜる）。自分のカードをショップへ持ってくると うる */
function shopHTML() {
  const r1 = N.round === 1, list = N.shop;
  const head = r1 ? `<span class="sh-free">むりょうで あと<b>${N.picks}</b>まい</span>`
    : `<span class="sh-coin" aria-label="コイン ${N.coins}"><i></i><b>${N.coins}</b></span><button class="pill sub sh-roll" data-act="reroll" ${N.coins < REROLL ? 'disabled' : ''}>入れかえ <small><i class="cn"></i>${REROLL}</small></button>`;   // 11/18「2けたで改行される」→ コインは絵と数字だけ
  const deal = dealAnim && !REDUCED; dealAnim = false;   // 新しいラウンドだけ、ショップが下りてカードが配られる
  return `<div class="shopov${list.length > 3 ? ' many' : ''}${deal ? ' deal' : ''}" data-drop data-w="sell" data-i="0">
    <div class="sh-top"><b class="sh-ttl">ショップ</b>${head}</div>
    <div class="sh-cards">${list.map((cid, i) => cid
      ? `<button class="shcard" style="--k:${i}" data-act="card" data-drag data-drop data-w="shop" data-i="${i}">${cardMini(cid)}${r1 ? '' : `<span class="sh-price${N.coins < cardDef(cid).cost ? ' ng' : ''}"><i></i>${cardDef(cid).cost}</span>`}${mixesWithMine(cid) ? '<i class="mixmark">まぜ</i>' : ''}</button>`
      : '<span class="shcard sold"></span>').join('')}</div>
    <div class="sh-sell"><b>はなすと うる</b><span id="sellv"></span></div></div>`;
}

/* ---------- 夜の画面 ---------- */
function renderNight() {
  if (!nightOk(S.night)) return startNight();   // 前の形のセーブは、その夜をはじめから
  N = S.night; N.held = N.held || [];
  const mon = MONSTERS[N.mon], F = N.field ? FIELDS[N.field] : null;
  let body = '';
  if (N.stage === 'end') {
    const T = S.today, hp = nightHP(S.day), m = MATS[T.drop];
    body = `<div class="panel end ${T.beaten ? 'win' : ''}"><h2>${T.beaten ? '撃退せいこう！' : 'にげられちゃった…'}</h2>
        <p class="bignum">${fmt(T.score)}</p><p>${esc(mon.name)}のたいりょく ${fmt(hp)}</p>
        <div class="got"><img src="${matURL(T.drop)}" alt=""><span>${m.name} ×${T.drops}</span></div>
        <p>${T.flashes.length ? 'ひらめいたレシピ：' + T.flashes.map(k => esc(recipeOf(k).name)).join('、') : 'ひらめいたレシピはなかった（生地や素材の★1どうしをまぜるとひらめくよ）'}</p>
      </div><button class="big" data-act="toMorning">朝の仕込みへ</button>`;
  } else {
    const shop = N.stage === 'shop';
    body = `<div class="tiles"><button class="tslot fslot" data-act="card" ${shop && N.field ? 'data-drag' : ''} data-drop data-w="field" data-i="0" aria-label="フィールド"><i class="ord">場</i>${N.field ? cardTile('b:' + N.field) : ''}</button>${N.board.map((c, i) =>
        `<button class="tslot" data-act="card" ${shop && c ? 'data-drag' : ''} data-drop data-w="board" data-i="${i}" aria-label="調理台${i + 1}"><i class="ord">${i + 1}</i>${c ? cardTile(c.cid, { born: c.born, cook: c.cook }) : ''}${c && shop && mixesWithBoard(c.cid, i) ? '<i class="mx-dot">+</i>' : ''}</button>`).join('')}</div>
      <div class="handwrap"><div class="callout" id="callout"></div>${N.stage === 'shop' ? handHTML() : '<div class="hand"></div>'}</div>
      <div class="bar">${barHTML()}</div>
      ${viewerHTML()}`;
  }
  const q = quota(Math.min(N.round, ROUNDS), S.day), lastRun = N.stage === 'roundEnd' ? N.last.total : 0;
  $('screen').innerHTML = `<section class="night fit${busy ? ' busy' : ''}">
    <div class="stage${ART['bg-night'] ? ' hasbg' : ''}" id="stage" data-z="0"${ART['bg-night'] ? ` style="--bgimg:url('${ART['bg-night']}')"` : ''}>${ART['bg-night'] ? '' : '<i class="st-lamp"></i><i class="st-win"></i><i class="st-shelf"></i><i class="st-floor"></i>'}<i class="glow"></i>
      ${heroImg(N.stage === 'end' ? (S.today.beaten ? 'joy' : 'surprise') : 'battle')}
      <img class="mon${monIsArt(mon.id) ? ' hi' : ''}${N.stage === 'end' && S.today.beaten ? ' flee' : ''}" id="mon" src="${monURL(mon.id)}" alt="${esc(mon.name)}">
      <i class="smoke" id="smoke"></i>${decoHTML(N.stage === 'end' ? (S.today.beaten ? 'win' : 'battle') : N.stage === 'shop' && !fighting ? 'shop' : 'battle')}<div id="floats"></div>
      <div class="ov-top"><span>ラウンド <b>${Math.min(N.round, ROUNDS)}</b>/${ROUNDS}${F ? `　<em>${F.name}</em>` : ''}</span><span class="score">スコア <b id="score">${fmt(N.score)}</b></span></div>
      <div class="ov-heat"><span class="heat-label" id="heatLabel"></span><div class="heat-bar" id="heatBar">${heatCells()}</div></div>
      ${N.stage === 'shop' && !fighting ? shopHTML() : ''}</div>
    <div class="quota"><div class="qbar"><i id="qfill" style="width:${Math.min(100, lastRun / q * 100)}%"></i></div><span id="qtext">${N.stage === 'roundEnd' ? fmt(lastRun) + ' / ' : ''}ノルマ ${fmt(q)}</span></div>
    ${body}</section>`;
  setHeat(N.heat);
  for (const c of N.board) if (c) delete c.born;
  /* ラウンドの結果：合計をかぞえ上げてから、たっせいのハンコ */
  if (resultAnim && N.stage === 'roundEnd') { resultAnim = false; const r = document.querySelector('.r-num'); if (r) countUp(r, 0, N.last.total, T(700)); }
}
