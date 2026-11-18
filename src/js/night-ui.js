/* ==== 夜のバトルの画面：舞台（ほのか・モンスター・鉄板の火力の光）・調理台（左にフィールドの「場」＋アイコンのタイル5つを1行・左から順）・仕入れ・下のボタン列
   生地のタイルには焼き加減のメーター（9段階・9でサイコー）
   バトル中の発動は、メダルと計算の札が舞台へ飛ぶ（11/18 16時・説明のパネルはやめた）
   カードはタップでえらぶ → 光る行き先をタップで置く・うごかす・まぜる（まぜる前に、できるカードを見せる）。えらんだカードをもう1回タップで大きく見る ==== */
const ORD = ['①', '②', '③', '④', '⑤'];

/* ---------- 演出 ---------- */
/* 鉄板の火力（1〜4）。フィールドがないと焼けないので、光らせない */
function setHeat(h) {
  const bar = $('heatBar'), lab = $('heatLabel'); if (!bar) return;
  [...bar.children].forEach((c, i) => { c.className = i < h ? 'on h' + (i + 1) : ''; });
  lab.textContent = N.field ? HEAT[h] : `${HEAT[h]}（場なし）`;
  lab.className = 'heat-label h' + (N.field ? h : 0);
  const st = $('stage'); if (st) st.dataset.z = N.field ? h : 0;
  heatFx(N.field ? h : 0);   // 鉄板の炎（battle-fx.js）
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
/* ---------- こね生地（11/18）：こねた回数の札（ショップの上と、バトル中は火力のメーターのとなり）・こねたときの演出 ---------- */
const koneOn = () => N && N.build === 'kone';
const koneBadge = () => koneOn() ? `<span class="kone-n" aria-label="こねた回数 ${N.kone}"><small>こね</small><b>${N.kone}</b></span>` : '';
function setKone(n) { document.querySelectorAll('.kone-n').forEach(el => { el.querySelector('b').textContent = n; replay(el, 'bump'); }); }
function kneadFx(i, add, born) {
  const slot = tslot(i); if (slot) floatAt(slot, `こね+${add}`, 'cookup');
  setKone(N.kone); heroFor('joy', 900);
  document.querySelectorAll('.tslot .pc.born').forEach(c => floatAt(c.parentNode, 'パン種', 'best'));
  if (!born) toast('調理台がいっぱいで、パン種は生まれなかった');
}
function taneFx() { document.querySelectorAll('.tslot .pc.born').forEach(c => floatAt(c.parentNode, 'パン種', 'best')); }
/* 数字をかぞえ上げる（ms のあいだ） */
function countUp(el, from, to, ms, f = fmt) {
  if (!el) return;
  if (REDUCED || ms < 60 || from === to) { el.textContent = f(to); return; }
  const t0 = performance.now();
  const tick = now => { const t = Math.min(1, (now - t0) / ms), v = from + (to - from) * (1 - Math.pow(1 - t, 3)); el.textContent = f(Math.floor(v)); if (t < 1) requestAnimationFrame(tick); };
  requestAnimationFrame(tick);
}
/* バトルの一撃：ほのかの手から火の玉（火の粉の尾）→ モンスターに当たってぐにゃっ・光の輪と火花 → 大きな数字
   ぜんぶ画面の上の層 #fxl に出す（額縁の外へはみ出す）。ノルマにくらべて大きいほど派手に（big＝舞台がゆれる・huge＝画面いっぱいの炎） */
function hitFx(dmg, q, proj) {   // proj＝舞台に飛んできた数字（battle-fx.js の flyHub）。あればそれがモンスターへ飛ぶ（なければ ほのかの手から火の玉）
  const chef = $('chef'), a = spot(proj || chef), b = spot($('mon'));
  replay(chef, 'act');
  const size = dmg >= q * 0.6 ? 'huge' : dmg >= q * 0.2 ? 'big' : '', fly = T(size ? 380 : 320);
  const land = p => {
    if (proj) proj.remove();
    monReact(size ? 'hitbig' : 'hit'); dmgNum(dmg, size, p);
    decoReact(size ? 'jump' : 'hop', size ? 800 : 500);
    if (size) decoChibi('cheer', 1400);
    if (size === 'huge') fireWall(); else if (size) replay($('stage'), 'quake');
  };
  if (REDUCED || !a || !b || !document.body.animate) return land(b);
  const L = fxLayer(), x0 = proj ? a.x : a.x + a.w * .32, y0 = proj ? a.y : a.y - a.h * .18, x1 = b.x - b.w * .05, y1 = b.y;
  const at = t => { const u = t * t; return { x: x0 + (x1 - x0) * u, y: y0 + (y1 - y0) * u - (proj ? 40 : 88) * u * (1 - u) }; };   // ゆっくり出て速くなる・少し弧をえがく
  const ball = proj || document.createElement('i'), ang = proj ? 0 : Math.atan2(y1 - y0, x1 - x0) * 180 / Math.PI;
  if (proj) proj.classList.add('shot');
  else { ball.className = 'fx-ball' + (size ? ' s-' + size : ''); ball.style.left = x0 + 'px'; ball.style.top = y0 + 'px'; L.appendChild(ball); }
  ball.animate([...Array(9)].map((_, k) => { const t = k / 8, p = at(t); return { transform: `translate(${p.x - x0}px,${p.y - y0}px) rotate(${ang}deg) scale(${proj ? 1 + .5 * t : .55 + .85 * t})` }; }), { duration: fly, fill: 'forwards' });
  for (let k = 1; k < 8; k++) setTimeout(() => sparkBurst({ ...at(k / 8), w: 8 }, size ? 3 : 2, 'all', .35), fly * k / 8);
  setTimeout(() => {
    ball.remove(); land({ x: x1, y: y1 });
    const h = document.createElement('i'); h.className = 'fx-hit' + (size ? ' s-' + size : ''); h.style.left = x1 + 'px'; h.style.top = y1 + 'px';
    L.appendChild(h); setTimeout(() => h.remove(), 520);
    sparkBurst({ x: x1, y: y1, w: 20 }, size === 'huge' ? 34 : size ? 24 : 14, 'all', size === 'huge' ? 2.3 : size ? 1.7 : 1.15);
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
  el.innerHTML = `<i class="bi-band"></i><p class="bi-r">ラウンド <b>${N.round}</b> / ${ROUNDS}</p><p class="bi-t">おもてなし！</p><p class="bi-q">おなか <b>${fmt(q)}</b></p>`;
  st.appendChild(el);
  monReact('roar'); decoReact('scare', 600); setTimeout(() => replay($('chef'), 'act'), T(300));
  setTimeout(() => { el.remove(); done(); }, ms);
}
/* 3〜4. バトルの1こま。演出にかかる時間（ふつうの速さの ms）を返す
   11/18 16時 しょーくん「せっかくの戦闘シーンが、効果発動の吹き出しで見えない」→ 説明のパネルをやめた（舞台はいつも見える）
   焼き：場のマスの上に火力の札がぽん → 生地のタイルが左から順にジュッ（+火力のぶん・サイコー・焦げ）
   発動：タイルが★で跳ねる → カードのメダルが舞台へヒュッ → 計算の札が1まいずつ飛んできて数字にすいこまれる → 数字がモンスターへバーン（battle-fx.js の 5）
   ほかのカードへの効果の札（となりへ・火力・次の主役へ…）は、そのタイルの上にぽんと出て、オーラが相手へ飛ぶ */
function showEvent(e, run, q) {
  document.querySelectorAll('.tslot.now').forEach(s => s.classList.remove('now'));
  if (e.type === 'bake') {
    const fs = document.querySelector('.fslot'), best = e.list.filter(x => !x.burnt && x.to >= COOK_MAX).length, nb = e.list.filter(x => x.burnt).length;
    chipPop(fs, { b: HEAT[e.heat], s: `焼き+${e.heat}`, c: 'ember' });
    replay($('stage'), 'sizzle'); replay(document.querySelector('.tiles'), 'bakefx');   // 鉄板の下から炎がゆらっと上がる
    const t0 = 420, gap = 260;
    e.list.forEach((x, n) => setTimeout(() => {
      const card = updTile(x.i, x.cid, x.burnt ? undefined : x.to), slot = card && card.parentNode;
      if (card) { replay(card, 'sear'); sparkBurst(card, 6, 'up', .6); }
      if (x.burnt) burntFx(slot);
      else floatAt(slot, x.to >= COOK_MAX ? 'サイコー！' : `焼き+${x.to - x.from}`, x.to >= COOK_MAX ? 'best' : 'cookup');
    }, T(t0 + n * gap)));
    if (best || nb) setTimeout(() => chipPop(fs, nb ? { b: '焦げ', s: `${nb}枚`, c: 'koge' } : { b: 'サイコー', s: `${best}枚`, c: 'gold' }), T(t0 + e.list.length * gap));
    /* すみびクッキー：ほかの生地へ「焦げない」のオーラ */
    const stops = e.stop == null ? [] : e.list.filter(x => x.i !== e.stop);
    if (stops.length) setTimeout(() => stops.forEach((x, n) => setTimeout(() => aura(e.stop, x.i, 'stop'), T(n * 90))), T(t0 + e.list.length * gap));
    return 1050 + e.list.length * gap + (stops.length ? 600 : 0);
  }
  const d = cardDef(e.cid), slot = tslot(e.i), card = slot && slot.querySelector('.pc');
  if (slot) slot.classList.add('now', 'done');
  if (e.again) takeBuff(e.i, e.i - 1, 'again');
  /* 1. 発動したカードが跳ねる（★1 ぽん・★2 大きく・★3 縦にくるっと1回転してズドン） */
  let t = card ? actBounce(card, d.star) : 300;
  const C = actChips(e), H = {};
  /* 2. ダメージのあるカード：メダルが舞台へ → 計算の札が飛んできて数字が変わる */
  if (e.dmg > 0) {
    setTimeout(() => Object.assign(H, flyHub(e, e.dmg >= q / 3)), T(t)); t += 360;
    C.calc.forEach(c => { setTimeout(() => chipFly(e, c, H), T(t)); t += c.src && c.src.length ? 340 : 300; });
    t += 260;
  }
  /* 3. ほかのカードへの効果：タイルの上に札がぽん・オーラが相手へ */
  C.outs.forEach(c => {
    setTimeout(() => { chipPop(slot, c); if (c.out != null) auraOut(e, e.out[c.out]); if (c.kone) setKone(c.kone); }, T(t));
    t += c.out != null ? 460 : 380;
  });
  /* 4. 数字がモンスターへバーン */
  if (e.dmg > 0) {
    setTimeout(() => hubFin(H, e.dmg), T(t));
    t += 300;
    setTimeout(() => {
      hitFx(e.dmg, q, H.el);
      const sc = $('score'), before = N.score + run - e.dmg;
      countUp(sc, before, N.score + run, T(460)); replay(sc, 'tick');
      $('qfill').style.width = Math.min(100, run / q * 100) + '%';
      $('qtext').textContent = `${fmt(run)} / おなか ${fmt(q)}`;
      if (run >= q && run - e.dmg < q) setTimeout(() => replay(document.querySelector('.quota'), 'reach'), T(200));
    }, T(t));
    t += 760;
  } else t += 420;
  return t;
}
/* 計算の札のデータ：calc＝数字にすいこまれる札（v＝この札のあとの数字・p＝前の数字・src＝効果の元のマス・k＝マスに残った札の種類）
   outs＝ほかのカードへの効果（out＝e.out の番号）。c＝札の色（gold・ember・pink・mint・koge） */
const PART_K = l => l === '次の主役' ? 'next' : l === 'となり' ? 'nb' : l === 'スタート' ? 'rally' : l.startsWith('サイコー') ? 'best' : '';
const PART_C = l => l === '次の主役' ? 'pink' : l === 'となり' ? 'mint' : l === '焼き加減' || l === 'フィールド' || l.startsWith('サイコー') ? 'ember' : 'gold';
function actChips(e) {
  const d = cardDef(e.cid), calc = [], outs = [], out = k => { const n = (e.out || []).findIndex(o => o.k === k); return n < 0 ? null : n; };
  let v = 0;
  if (e.dmg > 0 && e.base) { v = e.base; calc.push({ b: fmt(e.base), s: '味パワー', c: 'gold', v }); }
  for (const [op, x, label, src] of e.parts || []) {
    const p = v; v = op === '×' ? v * x : v + x;
    calc.push({ b: op + fmtMul(x), s: label, c: PART_C(label), v, p, src: src && src.filter(j => j !== e.i), k: src && PART_K(label) });
  }
  if (e.fin) calc.push({ b: '×' + fmtMul(e.fin[0]), s: 'アンカー：合計', c: 'gold', v: e.dmg, p: v, out: out('fin') });
  const rl = out('rally'); if (rl != null) outs.push({ b: '+' + fmt(e.out[rl].v), s: d.fx.koneRally ? 'パンぜんぶへ' : '主役ぜんぶへ', c: 'mint', out: rl });
  const nb = out('nb'); if (nb != null) outs.push({ b: '+' + fmt(e.out[nb].v), s: 'となりへ', c: 'mint', out: nb });
  if (e.heat) outs.push({ b: `${HEAT[e.heat[0]]}→${HEAT[e.heat[1]]}`, s: '火力', c: 'ember', out: out('heat') });
  if (e.sear) outs.push(e.sear.burnt ? { b: '焦げた', s: '右の生地', c: 'koge', out: out('sear') } : { b: `焼き+${e.sear.to - e.sear.from}`, s: '右の生地', c: 'ember', out: out('sear') });
  if (e.next) outs.push({ b: '×' + fmtMul(e.next), s: '次の主役へ', c: 'pink', out: out('next') });
  if (fxOn(d, 'again') && !e.again) outs.push({ b: 'もう1回', s: '右どなり', c: 'mint', out: out('again') });
  if (e.call) outs.push({ b: 'フィールド', s: '次のショップ', c: 'mint' });
  if (e.kone) outs.push({ b: `こね+${e.kone[1] - e.kone[0]}`, s: 'こねた回数', c: 'gold', kone: e.kone[1] });
  return { calc, outs };
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
    <div class="ci-card pc k-s s3">${artImg(cid)}<i class="pc-shine"></i><i class="pc-gl"></i></div>
    <p class="ci-title"><small>${sub}</small><span>${esc(d.short)}</span></p></div></div>`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), ms);
  return ms;
}

/* まぜる演出（約1.5秒）：まわりが暗く → 2枚がシュッと飛び出して、まんなかで止まって（ヒットストップ）ガキーン → 火花・光 → できたカードがくるっと出て名前の札 → マスへ。終わったら done */
function cardSpot(p) {
  const el = document.querySelector(`[data-w="${p.where}"][data-i="${p.i}"] .pc`);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: el.offsetWidth };
}
const SPARK = ['#fff6d8', '#ffd45a', '#ff9a3c', '#ffe9a8', '#8fe0c0', '#ff8f6a'];
function mixFx(from, ca, cb, cr, to, done) {
  const tile = document.querySelector(`.tslot[data-w="board"][data-i="${to.i}"]`), tc = tile && tile.querySelector('.pc');
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
    <b class="mf-sfx">ガキーン！</b><p class="mf-name"><small>${'★'.repeat(star)}</small><span>${esc(d.short)}</span></p>`;
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
const monURL = id => MON_URL[id] || (MON_URL[id] = ART['mon-' + id] || ART[(MONSTERS.find(m => m.id === id) || {}).alt] || big(MON_SPR[id] || MON_SPR.slime, 8));
const monIsArt = id => !!ART['mon-' + id];
function heatCells() { return Array.from({ length: HEAT_MAX }, () => '<i></i>').join(''); }

/* ---------- タップで大きく見る画面（カード＋説明＋ボタン）とラウンドの結果 ---------- */
function viewerHTML() {
  if (N.stage === 'roundEnd') {
    const L = N.last, gain = [];
    if (L.ok) gain.push(`コイン+${QUOTA_BONUS}`);
    return `<div class="viewer soft"><div class="vbox result ${L.ok ? 'ok' : ''}" data-act="noop">
      <p class="r-round">ラウンド ${L.round}</p><p class="r-num">${fmt(L.total)}</p><p class="r-q">おなか ${fmt(L.q)}</p>
      <p class="r-msg">${L.ok ? 'まんぞく！' : 'まだ たりない…'}</p>${gain.length ? `<p class="r-gain">${gain.join('　')}</p>` : ''}
      <button class="big" data-act="next">${L.round >= ROUNDS ? 'おもてなしの結果へ' : '次のラウンドへ'}</button></div></div>`;
  }
  const s = N.sel;
  if (!s || !N.view || N.stage !== 'shop') return '';
  const box = (cid, cook, btns, hint) => `<div class="viewer" data-act="close"><div class="vbox" data-act="noop"><button class="vclose" data-act="close" aria-label="とじる">×</button>${cardBig(cid, cook)}${cardInfo(cid, cook)}
    <div class="vbtns"><button class="pill sub" data-act="close">とじる</button>${btns}</div><p class="vhint">${hint}</p></div></div>`;
  if (s.where === 'shop') {
    const cid = N.shop[s.i]; if (!cid) return '';
    const d = cardDef(cid), free = N.round === 1;
    return box(cid, null, `<button class="pill go2" data-act="buy" data-i="${s.i}" ${!free && N.coins < d.cost ? 'disabled' : ''}>${free ? 'もらう' : `買う <small>コイン${d.cost}</small>`}</button>`,
      d.cat === 'field' ? 'ドラッグで「場」へ' : '買うと左の空いているマスへ・ドラッグで好きなマスへ・かさねて まぜる');
  }
  if (s.where === 'field') return N.field ? box('b:' + N.field, null, sellBtn(), '新しいのを買うと入れかわる') : '';
  const c = cardAt(s); if (!c) return '';
  return box(c.cid, c.cook, sellBtn(), `${ORD[s.i]}番め・${mixRule(cardDef(c.cid))}`);
}
/* うる（1ラウンド目の★1は「もどす」＝無料の枠がもどる） */
function sellLabel(d) { const v = sellValue(d); return v ? `うる <small>+${v}</small>` : d.tane ? 'うる <small>+0</small>' : 'もどす'; }
function sellBtn() {
  const s = N.sel, c = s.where === 'field' ? { cid: 'b:' + N.field } : cardAt(s);
  return `<button class="pill sub" data-act="sell">${sellLabel(cardDef(c.cid))}</button>`;
}
function barHTML() {
  if (N.stage === 'pick') return '<button class="bake" data-act="pickGo">これにする！</button>';
  if (fighting) return `<button class="pill sub spd${bSpeed > 1 ? ' on' : ''}" data-act="spd">${spdLabel()}</button>`;   // バトル中は、はやおくり
  return `<button class="bake" data-act="bake" ${busy || N.stage !== 'shop' ? 'disabled' : ''}>おもてなし！</button>`;
}
/* ショップ：準備のあいだ、舞台にかぶせる（バトルのときはとじる）。3まい（1ラウンド目は無料の5まい）・コイン・有料の入れかえ・うる
   カードはドラッグで調理台へ（かさねると買いながら まぜる）。調理台のカードをショップへ持ってくると うる */
function shopHTML() {
  const r1 = N.round === 1, list = N.shop;
  const head = r1 ? `<span class="sh-free">むりょうで あと<b>${N.picks}</b>まい</span>`
    : `<span class="sh-coin" aria-label="コイン ${N.coins}"><i></i><b>${N.coins}</b></span><button class="pill sub sh-roll" data-act="reroll" ${N.coins < REROLL ? 'disabled' : ''}>入れかえ <small><i class="cn"></i>${REROLL}</small></button>`;   // 11/18「2けたで改行される」→ コインは絵と数字だけ
  const deal = dealAnim && !REDUCED; dealAnim = false;   // 新しいラウンドだけ、ショップが下りてカードが配られる
  return `<div class="shopov${list.length > 3 ? ' many' : ''}${deal ? ' deal' : ''}" data-drop data-w="sell" data-i="0">
    <div class="sh-top"><b class="sh-ttl">ショップ</b>${koneBadge()}${head}</div>
    <div class="sh-cards">${list.map((cid, i) => cid
      ? `<button class="shcard" style="--k:${i}" data-act="card" data-drag data-drop data-w="shop" data-i="${i}">${cardMini(cid)}${r1 ? '' : `<span class="sh-price${N.coins < cardDef(cid).cost ? ' ng' : ''}"><i></i>${cardDef(cid).cost}</span>`}${mixesWithBoard(cid) ? '<i class="mixmark">まぜ</i>' : ''}</button>`
      : '<span class="shcard sold"></span>').join('')}</div>
    <div class="sh-sell"><b>はなすと うる</b><span id="sellv"></span></div></div>`;
}

/* 夕方のシェフ・ビルドえらび（11/18 しょーくん：カードを並べる・毎晩・前の夜のビルドがえらばれている）。カードはシェフの絵・ビルドの名前・特性・代表のカード3まい・ひとこと */
function pickHTML() {
  const list = openBuilds().map(id => {
    const B = BUILDS[id], C = CHEFS[B.chef], on = id === N.build, pic = ART[B.pic] || ART.honoka;
    return `<button class="pk-card${on ? ' on' : ''}" data-act="pickB" data-id="${id}" aria-pressed="${on}">
      <span class="pk-pic">${pic ? `<img src="${pic}" alt="">` : ''}</span>
      <span class="pk-body"><b class="pk-name">${esc(B.name)}</b><span class="pk-chef">${esc(C.name)}・特性 ${esc(C.trait)}</span>
      <span class="pk-cards">${B.show.map(cid => `<span class="pk-mini">${cardMini(cid)}</span>`).join('')}</span>
      <span class="pk-text">${esc(B.text)}</span></span>${on ? '<i class="pk-on">えらんでいる</i>' : ''}</button>`;
  }).join('');
  return `<div class="pickov"><p class="pk-ttl">今夜の おもてなし</p><div class="pk-list">${list}</div>
    ${TRIAL ? '<p class="pk-trial">ためしのページ：こね生地は、本番では8日目から</p>' : ''}</div>`;
}

/* ---------- 夜の画面 ---------- */
function renderNight() {
  if (!nightOk(S.night)) return startNight();   // 前の形のセーブは、その夜をはじめから
  N = S.night;
  const mon = MONSTERS[N.mon], F = N.field ? FIELDS[N.field] : null;
  let body = '';
  const rec = S.today, after = N.stage === 'end' || N.stage === 'thanks', happy = after && rec.mood >= 2;
  if (N.stage === 'end') {
    const R = MOODS[rec.mood] || MOODS[1];
    body = `<div class="panel end m${rec.mood}${happy ? ' win' : ''}"><h2>${rec.mood >= 3 ? 'おなかいっぱい！' : R.name + '！'}</h2>
        <p class="bignum">${fmt(rec.score)}</p><p>${esc(mon.name)}が おなかいっぱいになるのは ${fmt(rec.belly)}</p>
        <p class="end-mood"><b>${R.name}</b>のお礼</p>
        <div class="gotrow"><div class="got"><img src="${matURL(mon.drop)}" alt=""><span>${esc(MATS[mon.drop].short)} ×${R.mats}</span></div><div class="got coin"><span>コイン ${fmt(R.coins)}円</span></div></div>
      </div><button class="big" data-act="toResult">1日のまとめへ</button>`;
  } else {
    const shop = N.stage === 'shop';
    body = `<div class="tiles" data-z="${N.field ? N.heat : 0}">${boardFireHTML()}<button class="tslot fslot" data-act="card" ${shop && N.field ? 'data-drag' : ''} data-drop data-w="field" data-i="0" aria-label="フィールド"><i class="ord">場</i>${N.field ? cardTile('b:' + N.field) : ''}</button>${N.board.map((c, i) =>
        `<button class="tslot" data-act="card" ${shop && c ? 'data-drag' : ''} data-drop data-w="board" data-i="${i}" aria-label="調理台${i + 1}"><i class="ord">${i + 1}</i>${c ? cardTile(c.cid, { born: c.born, cook: c.cook }) : ''}${c && shop && mixesWithBoard(c.cid, i) ? '<i class="mx-dot">+</i>' : ''}</button>`).join('')}</div>
      <div class="bar">${barHTML()}</div>
      ${viewerHTML()}`;
  }
  const q = quota(Math.min(N.round, ROUNDS), S.day), lastRun = N.stage === 'roundEnd' ? N.last.total : 0;
  $('screen').innerHTML = `<section class="night fit${busy ? ' busy' : ''}">
    <div class="stage${ART['bg-night'] ? ' hasbg' : ''}" id="stage" data-z="0"${ART['bg-night'] ? ` style="--bgimg:url('${ART['bg-night']}')"` : ''}>${ART['bg-night'] ? '' : '<i class="st-lamp"></i><i class="st-win"></i><i class="st-shelf"></i><i class="st-floor"></i>'}<i class="glow"></i>
      ${heroImg(after ? (happy ? 'joy' : 'oops') : 'battle')}
      <img class="mon${monIsArt(mon.id) ? ' hi' : ''}${N.stage === 'end' ? ' flee' : ''}" id="mon" data-idle="${monIdle(mon.id)}" src="${monURL(mon.id)}" alt="${esc(mon.name)}">
      ${embersHTML()}<i class="smoke" id="smoke"></i>${decoHTML(after ? (happy ? 'win' : 'battle') : (N.stage === 'shop' || N.stage === 'arrive' || N.stage === 'pick') && !fighting ? 'shop' : 'battle')}<div id="floats"></div>
      <div class="ov-top"><span>ラウンド <b>${Math.min(N.round, ROUNDS)}</b>/${ROUNDS}${F ? `　<em>${F.name}</em>` : ''}</span><span class="score">味パワー <b id="score">${fmt(N.score)}</b></span></div>
      <div class="ov-heat"><span class="heat-label" id="heatLabel"></span><div class="heat-bar" id="heatBar">${heatCells()}</div>${koneBadge()}</div>
      ${N.stage === 'shop' && !fighting ? shopHTML() : ''}${N.stage === 'pick' ? pickHTML() : ''}</div>
    <div class="quota"><div class="qbar"><i id="qfill" style="width:${Math.min(100, lastRun / q * 100)}%"></i></div><span id="qtext">${N.stage === 'roundEnd' ? fmt(lastRun) + ' / ' : ''}おなか ${fmt(q)}</span></div>
    ${body}</section>`;
  setHeat(N.heat);
  for (const c of N.board) if (c) delete c.born;
  /* ラウンドの結果：合計をかぞえ上げてから、たっせいのハンコ */
  if (resultAnim && N.stage === 'roundEnd') { resultAnim = false; const r = document.querySelector('.r-num'); if (r) countUp(r, 0, N.last.total, T(700)); }
  /* 来店とお礼の会話（night.js の nightTalk） */
  if ((N.stage === 'arrive' || N.stage === 'thanks') && !talking()) setTimeout(nightTalk, N.stage === 'thanks' ? 700 : 300);
  tipSync();   // 夜のヒント（tips.js）
}
