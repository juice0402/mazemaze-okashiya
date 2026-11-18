/* ==== バトルの演出（11/18 しょーくんの感想・Version 33）
   1. 発動したカードが跳ねる：★1 ぽん・★2 大きく・★3 は高く跳ねて縦にくるっと1回転 → ズドン（シャドバのように派手に）
   2. ほかのカードにかかる効果は、そのカードから相手のカードへオーラを飛ばす。相手のマスには札（×2・+30・もう1回）が残り、効くときに吸いこまれる
   3. 舞台の賑やかし（ペパマリの戦闘・ゼンゼロのように）：木の額縁・手前の草・デフォルメのほのかと食材モンスターのモブがぴょこぴょこ
   4. ほのかの炎（Version 38）：鉄板が火力で燃える・舞台に火の粉・炎の柱・火花・画面いっぱいの炎・モンスターのもにもに ==== */

/* ---------- 1. 跳ねる ---------- */
const tslot = i => document.querySelector(`.tslot[data-w="board"][data-i="${i}"]`);
/* 発動したタイルを★で跳ねさせる。計算の札を出しはじめるまでの ms（ふつうの速さ）を返す */
function actBounce(card, star) {
  const dur = star >= 3 ? 1150 : star === 2 ? 600 : 440;
  card.style.setProperty('--ad', T(dur) + 'ms');
  replay(card, 'pon' + Math.min(3, star));
  const slot = card.parentNode;
  if (star >= 3) {
    if (slot) slot.classList.add('lift');
    setTimeout(() => { slamFx(card); if (slot) slot.classList.remove('lift'); }, T(dur * .78));
    return 1250;
  }
  setTimeout(() => { if (star === 2) ringAt(card, 'r-gold'); sparkBurst(card, star === 2 ? 14 : 8, 'up', star === 2 ? 1.1 : .75); }, T(dur * .3));
  return star === 2 ? 560 : 400;
}
/* ★3 がズドンと落ちたとき：画面と調理台がゆれて、衝撃の輪・木くず・「ズドン！」 */
function slamFx(card) {
  replay($('stage'), 'quake2'); replay(document.querySelector('.tiles'), 'tquake');
  replay(card, 'slam');
  ringAt(card, 'r-slam');
  const p = spot(card); if (!p || REDUCED || !document.body.animate) return;
  const L = fxLayer();
  for (let n = 0; n < 14; n++) {
    const s = document.createElement('i'); s.className = 'debris' + (n % 3 ? '' : ' gold');
    s.style.left = p.x + 'px'; s.style.top = (p.y + p.h * .35) + 'px'; L.appendChild(s);
    const a = Math.PI + Math.random() * Math.PI, r = 40 + Math.random() * 70;
    s.animate([{ transform: 'translate(0,0) rotate(0)', opacity: 1 },
      { transform: `translate(${Math.cos(a) * r}px,${Math.sin(a) * r * .8}px) rotate(${200 + Math.random() * 300}deg)`, opacity: 1, offset: .55 },
      { transform: `translate(${Math.cos(a) * r * 1.2}px,${Math.sin(a) * r * .3 + 40}px) rotate(540deg)`, opacity: 0 }],
      { duration: T(700), easing: 'cubic-bezier(.2,.7,.4,1)', fill: 'forwards' });
    setTimeout(() => s.remove(), T(720));
  }
  const t = document.createElement('b'); t.className = 'zudon'; t.textContent = 'ズドン！';
  t.style.left = p.x + 'px'; t.style.top = (p.y - p.h * .9) + 'px'; L.appendChild(t);
  setTimeout(() => t.remove(), T(900));
  sparkBurst(p, 26, 'up', 1.8); fireWall();
  decoReact('jump', 600);
}

/* ---------- 2. オーラ ---------- */
function fxLayer() { let l = $('fxl'); if (!l) { l = document.createElement('div'); l.id = 'fxl'; document.body.appendChild(l); } return l; }
/* マスの番号・'heat'（火力のメーター）・'score'・要素 → 画面の中の場所 */
function spot(x) {
  const el = typeof x === 'number' ? (tslot(x) && (tslot(x).querySelector('.pc') || tslot(x))) : x === 'heat' ? $('heatBar') : x === 'score' ? $('score') : x;
  if (!el || !el.getBoundingClientRect) return null;
  const r = el.getBoundingClientRect();
  return { el, x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height };
}
function ringAt(el, cls) {
  const p = spot(el); if (!p || REDUCED) return;
  const r = document.createElement('i'); r.className = 'aring ' + cls; r.style.left = p.x + 'px'; r.style.top = p.y + 'px';
  fxLayer().appendChild(r); setTimeout(() => r.remove(), 700);
}
/* from のカードから to へ、光の玉とその尾を弧をえがいて飛ばす。着いたら光って done(着いた要素)。かかる ms を返す */
function aura(from, to, kind, done) {
  const a = spot(from), b = spot(to), ms = T(460);
  const land = () => { if (b) { ringAt(b.el, 'a-' + kind); if (b.el.classList) replay(b.el, 'ahit'); } if (done) done(b && b.el); };
  if (!a || !b || REDUCED || !document.body.animate) { setTimeout(land, Math.min(ms, 120)); return ms; }
  const L = fxLayer(), dx = b.x - a.x, dy = b.y - a.y, lift = Math.min(90, 28 + Math.hypot(dx, dy) * .3), pts = [];
  for (let k = 0; k <= 14; k++) { const t = k / 14; pts.push({ transform: `translate(${dx * t}px,${dy * t - 4 * lift * t * (1 - t)}px) scale(${1 + .6 * Math.sin(Math.PI * t)})` }); }
  ringAt(a.el, 'a-' + kind);
  for (let n = 0; n < 7; n++) {
    const o = document.createElement('i'); o.className = `aura a-${kind}${n ? ' tr' : ''}`;
    o.style.left = a.x + 'px'; o.style.top = a.y + 'px'; if (n) o.style.setProperty('--s', (1 - n * .11).toFixed(2));
    L.appendChild(o);
    o.animate(pts, { duration: ms, delay: n * T(26), easing: 'cubic-bezier(.45,0,.35,1)', fill: 'both' });
    setTimeout(() => o.remove(), ms + n * T(26) + 30);
  }
  setTimeout(land, ms);
  return ms;
}
/* 相手のマスに残す札（効くときに吸いこまれる） */
function addBuff(i, kind, txt, from) {
  const s = tslot(i); if (!s) return;
  let box = s.querySelector('.buffs'); if (!box) { box = document.createElement('span'); box.className = 'buffs'; s.appendChild(box); }
  const b = document.createElement('i'); b.className = 'buff b-' + kind; b.dataset.from = from; b.dataset.k = kind; b.textContent = txt;
  box.appendChild(b);
}
function takeBuff(i, from, kind) {
  const s = tslot(i), b = s && s.querySelector(`.buff[data-from="${from}"][data-k="${kind}"]`);
  if (!b) return false;
  b.classList.add('absorb'); setTimeout(() => b.remove(), T(420));
  return true;
}
const BUFF_TXT = { next: o => '×' + fmtMul(o.v), rally: o => '+' + fmt(o.v), nb: o => '+' + fmt(o.v), again: () => 'もう1回' };
/* 計算の札の元のカード → このカードへ（札が残っていれば吸いこむ・なければ元のマスから飛んでくる） */
function auraIn(e, srcs, kind) {
  for (const s of srcs) if (s !== e.i && !takeBuff(e.i, s, kind)) aura(s, e.i, kind);
}
/* このカードから相手へ（着いたら札・火力・焼き・スコア） */
function auraOut(e, o) {
  const tos = Array.isArray(o.to) ? o.to : [o.to];
  tos.forEach((to, n) => setTimeout(() => aura(e.i, to, o.k, () => {
    if (BUFF_TXT[o.k]) addBuff(to, o.k, BUFF_TXT[o.k](o), e.i);
    if (o.k === 'heat') { setHeat(e.heat[1]); replay($('heatBar'), 'ahit'); }
    if (o.k === 'fin') replay($('score'), 'tick');
    if (o.k === 'sear' && e.sear) {
      const c2 = updTile(e.sear.i, e.sear.cid, e.sear.burnt ? undefined : e.sear.to);
      if (c2) replay(c2, 'sear');
      if (e.sear.burnt) burntFx(c2 && c2.parentNode); else floatAt(c2 && c2.parentNode, e.sear.to >= COOK_MAX ? 'サイコー！' : `焼き+${e.sear.to - e.sear.from}`, e.sear.to >= COOK_MAX ? 'best' : 'cookup');
    }
  }), T(n * 90)));
}

/* ---------- 3. 舞台の賑やかし ---------- */
/* [絵の名前, 絵がまだないときの仮の絵, 置き場所のクラス]。絵は Codex（art-irai の requests/okashi/mobs-chibi.md） */
const DECO_MOBS = [
  ['mob-slime', 'mon-slime', 'm-slime'], ['mob-hitsuji', 'mon-hitsuji', 'm-hitsuji'],
  ['mob-tokage', null, 'm-tokage'], ['mob-hiyoko', null, 'm-hiyoko'], ['mob-kurage', null, 'm-kurage'],
];
/* ほのかのデフォルメ：ショップ＝考える・バトル＝すわってにこにこ・大きな一撃と勝ったとき＝応援（art-irai の requests/okashi/honoka-chibi.md） */
const chibiSrc = pose => ART['chibi-' + pose] || ART['chibi-cheer'] || ART.honoka || '';
let grassCache = '';
function grassSVG() {
  if (grassCache) return grassCache;
  let r = 11; const rnd = () => (r = (r * 9301 + 49297) % 233280) / 233280;
  const blades = (h0, h1, step) => {
    let d = '', x = -4;
    while (x < 404) {
      const w = 4 + rnd() * 5, h = h0 + rnd() * (h1 - h0), lean = (rnd() - .5) * 9;
      d += `M${x.toFixed(1)} 40Q${(x + w * .25 + lean * .4).toFixed(1)} ${(40 - h * .55).toFixed(1)} ${(x + w * .5 + lean).toFixed(1)} ${(40 - h).toFixed(1)}Q${(x + w * .75 + lean * .3).toFixed(1)} ${(40 - h * .5).toFixed(1)} ${(x + w).toFixed(1)} 40Z`;
      x += w * step;
    }
    return d;
  };
  let fl = '';
  for (let k = 0; k < 9; k++) {
    const x = 18 + k * 44 + rnd() * 18, y = 18 + rnd() * 10, c = ['#ff9ec0', '#ffe27a', '#fff4f0', '#ffb36a'][k % 4];
    fl += `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)})"><circle r="3.2" fill="${c}"/><circle r="1.3" fill="#c8641e"/></g>`;
  }
  return (grassCache = `<svg class="dc-grass" viewBox="0 0 400 40" preserveAspectRatio="none">
    <path d="${blades(16, 30, .62)}" fill="#3f7a2e"/><path d="${blades(10, 22, .58)}" fill="#5ea33c"/><path d="${blades(6, 14, .55)}" fill="#86c652"/>${fl}</svg>`);
}
function decoHTML(mode) {
  const mobs = DECO_MOBS.map(([n, alt, cls], k) => {
    const src = ART[n] || (alt && ART[alt]);
    return src ? `<img class="dc dc-mob ${cls}${ART[n] ? '' : ' tmp'}" style="--k:${k}" src="${src}" alt="">` : '';
  }).join('');
  const pose = mode === 'shop' ? 'think' : mode === 'win' ? 'cheer' : 'sit';
  return `<div class="deco ${mode}" id="deco" aria-hidden="true">
    <i class="dc-ledge"></i>${grassSVG()}
    <i class="dc-frame"></i><i class="dc-medal"></i>
    <img class="dc dc-chibi${ART['chibi-' + pose] ? '' : ' tmp'}" id="dcChibi" style="--k:9" src="${chibiSrc(pose)}" alt="">${mobs}</div>`;
}
/* ほのかのデフォルメのポーズをしばらく変える（ms のあと、すわってにこにこへ） */
let chibiT = 0;
function decoChibi(pose, ms) {
  const el = $('dcChibi'); if (!el || !ART['chibi-' + pose]) return;
  el.src = chibiSrc(pose); clearTimeout(chibiT);
  if (ms) chibiT = setTimeout(() => { if (el.isConnected) el.src = chibiSrc('sit'); }, ms);
}
/* みんなで反応：hop（小さく）・jump（大よろこび）・scare（びくっ） */
let decoT = 0;
function decoReact(kind, ms = 700) {
  const d = $('deco'); if (!d || REDUCED) return;
  d.classList.remove('hop', 'jump', 'scare'); void d.offsetWidth; d.classList.add(kind);
  clearTimeout(decoT); decoT = setTimeout(() => d.classList.remove(kind), ms);
}

/* ---------- 4. ほのかの炎（11/18 しょーくん「火力をビジュアルでもわかりやすく」「火の粉とか盛りだくさん」「演出が枠を飛び出してド派手に」）
   鉄板（調理台）はいつも火力で燃える（.tiles の data-z：0＝場なし（種火）・1 弱火〜4 火力マックス）。舞台にはいつも火の粉
   火力が上がると炎の柱（場を置くとボッ！）・下がると湯気。発動と焼きは火花。火の玉と数字は額縁の外へ。大きな一撃と★3は画面いっぱいの炎
   ずっと動く物は CSS（transform と opacity だけ）。一回きりの物は #fxl（画面の上の層）に出して消す ---------- */
const prng = seed => () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
let fireCache = '', emberCache = '';
/* 鉄板の炎：マスのすきまとふちから上がる（マスのうしろ）。火の粉は強火から */
function boardFireHTML() {
  if (fireCache) return fireCache;
  const r = prng(7); let f = '', s = '';
  for (let k = 0; k < 14; k++) {
    const x = Math.floor(k / 2) / 6 * 100 + (k % 2 ? 2.4 : -2.4);   // 7つのすきま（左右のふち・マスのあいだ）に2本ずつ
    f += `<i class="tf${k % 3 === 1 ? ' x' : ''}" style="--x:${Math.max(1, Math.min(99, x)).toFixed(1)}%;--d:${(.8 + r() * .6).toFixed(2)}s;--k:${r().toFixed(2)};--w:${(24 + r() * 18).toFixed(0)}px"></i>`;
  }
  for (let k = 0; k < 8; k++) s += `<i class="tsp" style="--x:${(5 + r() * 90).toFixed(1)}%;--d:${(1.3 + r() * 1.1).toFixed(2)}s;--k:${r().toFixed(2)};--sx:${((r() - .5) * 44).toFixed(0)}px"></i>`;
  return (fireCache = `<i class="tglow" aria-hidden="true"></i><span class="tfire" aria-hidden="true">${f}</span><span class="tsparks" aria-hidden="true">${s}</span>`);
}
/* 舞台の火の粉：下から舞い上がる（数は火力で CSS が決める・ショップのあいだは止める） */
function embersHTML() {
  if (emberCache) return emberCache;
  const r = prng(23); let e = '';
  for (let k = 0; k < 14; k++) e += `<i style="--x:${(4 + r() * 92).toFixed(1)}%;--d:${(2.4 + r() * 2.2).toFixed(2)}s;--k:${r().toFixed(2)};--sx:${((r() - .5) * 70).toFixed(0)}px;--s:${(.6 + r() * .9).toFixed(2)}"></i>`;
  return (emberCache = `<span class="embers" aria-hidden="true">${e}</span>`);
}
/* 鉄板の火力が変わったとき：上がる＝炎の柱（0 から＝場を置いた＝ボッ！）・下がる＝湯気。夜が変わったら演出なし */
let heatWas = null;
function heatFx(z) {
  const t = document.querySelector('.tiles'); if (!t) return;
  const was = heatWas && heatWas.day === S.day ? heatWas.z : null;
  heatWas = { day: S.day, z }; t.dataset.z = z;
  if (was == null || z === was || REDUCED) return;
  if (z > was) { replay(t, 'heatup'); pillars(t, was === 0 ? 6 : Math.min(6, (z - was) * 2 + 1), was === 0); }
  else { replay(t, 'heatdn'); steam(t); }
}
function pillars(t, n, boom) {
  if (!document.body.animate) return;
  const L = fxLayer(), slots = [...t.querySelectorAll('.tslot')], ks = [...slots.keys()].sort(() => Math.random() - .5).slice(0, n);
  ks.forEach((k, j) => setTimeout(() => {
    const s = slots[k].getBoundingClientRect(), p = document.createElement('i');
    p.className = 'pillar' + (boom ? ' boom' : '');
    p.style.left = s.left + s.width / 2 + 'px'; p.style.top = s.bottom + 'px';
    p.style.setProperty('--pw', s.width * 1.15 + 'px'); p.style.setProperty('--ph', Math.min(innerHeight * .5, s.height * (1.8 + Math.random() * .9) + (boom ? 50 : 0)) + 'px');
    L.appendChild(p); setTimeout(() => p.remove(), 950);
  }, T(j * 55)));
  sparkBurst(t, boom ? 26 : 14, 'up', boom ? 1.6 : 1.2);
  if (boom) {
    const r = t.getBoundingClientRect(), b = document.createElement('b');
    b.className = 'zudon boh'; b.textContent = 'ボッ！'; b.style.left = r.left + r.width / 2 + 'px'; b.style.top = r.top - 30 + 'px';
    L.appendChild(b); setTimeout(() => b.remove(), 900);
  }
}
function steam(t) {
  const L = fxLayer(), r = t.getBoundingClientRect();
  for (let k = 0; k < 7; k++) {
    const s = document.createElement('i'); s.className = 'steam';
    s.style.left = r.left + r.width * (.1 + k * .13) + 'px'; s.style.top = r.top + r.height * .35 + 'px'; s.style.animationDelay = k * 45 + 'ms';
    L.appendChild(s); setTimeout(() => s.remove(), 1300);
  }
}
/* 火花：要素か点 {x,y,w} から飛び散る。up＝上へ噴き上がる・all＝まわりへ。spread で遠くまで */
function sparkBurst(at, n, mode, spread = 1) {
  const p = at && at.getBoundingClientRect ? spot(at) : at;
  if (!p || REDUCED || !document.body.animate) return;
  const L = fxLayer();
  for (let k = 0; k < n; k++) {
    const s = document.createElement('i'); s.className = 'fspark' + (k % 3 ? '' : ' w');
    s.style.left = p.x + (Math.random() - .5) * (p.w || 30) * .8 + 'px'; s.style.top = p.y + 'px';
    L.appendChild(s);
    const a = mode === 'up' ? -Math.PI / 2 + (Math.random() - .5) * 1.5 : Math.random() * Math.PI * 2, d = (36 + Math.random() * 80) * spread;
    const dx = Math.cos(a) * d, dy = Math.sin(a) * d, ms = T(480 + Math.random() * 420);
    s.animate([{ transform: 'translate(0,0) scale(1)', opacity: 1 }, { transform: `translate(${dx * .75}px,${dy * .75}px) scale(.9)`, opacity: 1, offset: .5 },
      { transform: `translate(${dx}px,${dy + 34}px) scale(.2)`, opacity: 0 }], { duration: ms, easing: 'cubic-bezier(.15,.8,.35,1)', fill: 'forwards' });
    setTimeout(() => s.remove(), ms + 30);
  }
}
/* 画面いっぱいの炎：大技（ノルマの6割をこえる一撃と★3のズドン）だけ。下から炎の舌が調理台や下のパネルまでおおって、画面ごとゆれる
   （大きさのクラスは s-big・s-huge。.big はボタンの名前なので使わない） */
function fireWall() {
  const nt = document.querySelector('.night'); if (!nt || REDUCED) return;
  replay(nt, 'quake2');
  const r = nt.getBoundingClientRect(), w = document.createElement('div'), n = 11;
  w.className = 'fwall';
  Object.assign(w.style, { left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px' });
  let h = '<i class="fw-flash"></i>';
  for (let k = 0; k < n; k++) h += `<i class="fw-t" style="--x:${((k + .5) / n * 100 + (Math.random() - .5) * 6).toFixed(1)}%;--h:${(46 + Math.random() * 34).toFixed(0)}%;--dl:${Math.round(Math.random() * 140)}ms"></i>`;
  w.innerHTML = h; fxLayer().appendChild(w);
  setTimeout(() => w.remove(), 1150);
}
/* モンスター：ずっともにもに（CSS の --idle）。当たるとぐにゃっ・ほえる（もにもにはそのまま続く） */
const MON_IDLE = { hitsuji: 'fluff' };
const monIdle = id => MON_IDLE[id] || 'jelly';
function monReact(cls) {
  const m = $('mon'); if (!m) return;
  m.classList.remove('hit', 'hitbig', 'roar'); void m.offsetWidth; m.classList.add(cls);
  clearTimeout(m._rt); m._rt = setTimeout(() => m.classList.remove(cls), 800);
}
/* ダメージの数字：額縁の外へはみ出してよい（画面の中には収める） */
function dmgNum(dmg, size, p) {
  const nt = document.querySelector('.night'), R = nt ? nt.getBoundingClientRect() : { left: 0, width: innerWidth, top: 0 };
  const e = document.createElement('b'); e.className = 'fx-dmg' + (size ? ' s-' + size : ''); e.textContent = fmt(dmg);
  fxLayer().appendChild(e);
  const w = e.offsetWidth, x = p ? p.x : R.left + R.width / 2;
  e.style.left = Math.max(R.left + w / 2 + 6, Math.min(R.left + R.width - w / 2 - 6, x)) + 'px';
  e.style.top = Math.max(R.top + 30, (p ? p.y : R.top + 120) - (size ? 46 : 34)) + 'px';
  setTimeout(() => e.remove(), 1100);
}
