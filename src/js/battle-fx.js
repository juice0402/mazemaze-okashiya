/* ==== バトルの演出（11/18 しょーくんの感想・Version 33）
   1. 発動したカードが跳ねる：★1 ぽん・★2 大きく・★3 は高く跳ねて縦にくるっと1回転 → ズドン（シャドバのように派手に）
   2. ほかのカードにかかる効果は、そのカードから相手のカードへオーラを飛ばす。相手のマスには札（×2・+30・もう1回）が残り、効くときに吸いこまれる
   3. 舞台の賑やかし（ペパマリの戦闘・ゼンゼロのように）：木の額縁・手前の草・デフォルメのほのかと食材モンスターのモブがぴょこぴょこ ==== */

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
  if (star === 2) setTimeout(() => ringAt(card, 'r-gold'), T(dur * .3));
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
  decoReact('jump', 600);
}

/* ---------- 2. オーラ ---------- */
function fxLayer() { let l = $('fxl'); if (!l) { l = document.createElement('div'); l.id = 'fxl'; document.body.appendChild(l); } return l; }
/* マスの番号・'heat'（火力のメーター）・'score'・要素 → 画面の中の場所 */
function spot(x) {
  const el = typeof x === 'number' ? (tslot(x) && (tslot(x).querySelector('.pc') || tslot(x))) : x === 'heat' ? $('heatBar') : x === 'score' ? $('score') : x;
  if (!el || !el.getBoundingClientRect) return null;
  const r = el.getBoundingClientRect();
  return { el, x: r.left + r.width / 2, y: r.top + r.height / 2, h: r.height };
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
    <i class="dc-frame"></i><i class="dc-line"></i><i class="fc tl"></i><i class="fc tr"></i><i class="fc bl"></i><i class="fc br"></i><i class="fc-crest"></i>
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
