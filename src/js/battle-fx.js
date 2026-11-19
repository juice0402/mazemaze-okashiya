/* ==== バトルの演出（11/18 しょーくんの感想・Version 33）
   1. 発動したカードが跳ねる：★1 ぽん・★2 大きく・★3 は高く跳ねて縦にくるっと1回転 → ズドン（シャドバのように派手に）
   2. ほかのカードにかかる効果は、そのカードから相手のカードへオーラを飛ばす。相手のマスには札（×2・+30・もう1回）が残り、効くときに吸いこまれる
   3. 舞台の賑やかし（ペパマリの戦闘・ゼンゼロのように）：木の額縁・手前の草・デフォルメのほのかと食材モンスターのモブがぴょこぴょこ
   4. ほのかの炎（Version 38）：鉄板が火力で燃える・舞台に火の粉・炎の柱・火花・画面いっぱいの炎・モンスターのもにもに
   5. 発動（11/18 16時）：メダルと計算の札が舞台へ飛び、数字がモンスターへバーン（説明のパネルはやめた） ==== */

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
const BUFF_TXT = { next: o => '×' + fmtMul(o.v), clead: o => '×' + fmtMul(o.v), shine: o => '×' + fmtMul(o.v), rally: o => '+' + fmt(o.v), nb: o => '+' + fmt(o.v), again: () => 'もう1回' };
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
    if (o.k === 'grow' && e.grow) {   // のばし飴・飴ばさみ：右どなりの大作が育つ（11/19）
      const c2 = updTile(e.grow.i, e.grow.cid, e.grow.to);
      if (c2) { replay(c2, 'sear'); sparkBurst(c2, 6, 'up', .6); }
      floatAt(c2 && c2.parentNode, e.grow.to >= SIZE_MAX ? '完成！' : `大きさ+${e.grow.to - e.grow.from}`, e.grow.to >= SIZE_MAX ? 'best' : 'cookup');
    }
    if (o.k === 'water' && e.water) {   // じょうろ：右どなりのくだものが育つ（わかば・11/19）
      const c2 = updTile(e.water.i, e.water.cid);
      if (c2) { replay(c2, 'sear'); sparkBurst(c2, 6, 'up', .6); }
      sproutFx(c2 && c2.parentNode, e.water.to >= RIPE);
      floatAt(c2 && c2.parentNode, e.water.to >= RIPE ? '熟した！' : '育った', e.water.to >= RIPE ? 'best' : 'cookup');
    }
  }), T(n * 90)));
}

/* ---------- 3. 舞台の賑やかし ---------- */
/* [絵の名前, 絵がまだないときの仮の絵, 置き場所のクラス]。絵は Codex（art-irai の requests/okashi/mobs-chibi.md） */
const DECO_MOBS = [
  ['mob-slime', 'mon-slime', 'm-slime'], ['mob-hitsuji', 'mon-hitsuji', 'm-hitsuji'],
  ['mob-tokage', null, 'm-tokage'], ['mob-hiyoko', null, 'm-hiyoko'], ['mob-kurage', null, 'm-kurage'],
];
/* 今夜のシェフのデフォルメ：ショップ＝考える・バトル＝すわってにこにこ・大きな一撃と勝ったとき＝応援（ほのか chibi-*・みなも minamo-chibi-*・11/19） */
const chibiName = pose => (chefArt() === 'honoka' ? '' : chefArt() + '-') + 'chibi-' + pose;
const chibiSrc = pose => ART[chibiName(pose)] || ART['chibi-' + pose] || ART['chibi-cheer'] || ART.honoka || '';
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
  /* 今夜のお客さん（とその仮の絵の子）は、応援のモブからはずす（H-016） */
  const g = N && MONSTERS[N.mon];
  const mobs = DECO_MOBS.filter(([n]) => !g || (n !== 'mob-' + g.id && n !== g.alt)).map(([n, alt, cls], k) => {
    const src = ART[n] || (alt && ART[alt]);
    return src ? `<img class="dc dc-mob ${cls}${ART[n] ? '' : ' tmp'}" style="--k:${k}" src="${src}" alt="">` : '';
  }).join('');
  const pose = mode === 'shop' ? 'think' : mode === 'win' ? 'cheer' : 'sit';
  return `<div class="deco ${mode}" id="deco" aria-hidden="true">
    <i class="dc-ledge"></i>${grassSVG()}
    <i class="dc-frame"></i><i class="dc-medal"></i>
    <img class="dc dc-chibi${ART[chibiName(pose)] ? '' : ' tmp'}" id="dcChibi" style="--k:9" src="${chibiSrc(pose)}" alt="">${mobs}</div>`;
}
/* ほのかのデフォルメのポーズをしばらく変える（ms のあと、すわってにこにこへ） */
let chibiT = 0;
function decoChibi(pose, ms) {
  const el = $('dcChibi'); if (!el || !ART[chibiName(pose)]) return;
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
/* 鉄板の炎：マスの下のふちの手前で小さくゆらめく（11/18 16時 しょーくん「炎がカードよりも後ろにあるのが、カードが浮いてるみたいに見える」）。火の粉は強火から */
function boardFireHTML() {
  if (fireCache) return fireCache;
  const r = prng(7); let f = '', s = '';
  for (let k = 0; k < 18; k++) {
    const x = (Math.floor(k / 3) + .5) / 6 * 100 + (k % 3 - 1) * 4.2;   // 6つのマスの下のふちに3本ずつ（まんなかの1本は強火から）・11/18 16時 マスの手前へ小さく
    f += `<i class="tf${k % 3 === 1 ? ' x' : ''}" style="--x:${x.toFixed(1)}%;--d:${(.8 + r() * .6).toFixed(2)}s;--k:${r().toFixed(2)};--w:${(16 + r() * 10).toFixed(0)}px"></i>`;
  }
  for (let k = 0; k < 8; k++) s += `<i class="tsp" style="--x:${(5 + r() * 90).toFixed(1)}%;--d:${(1.3 + r() * 1.1).toFixed(2)}s;--k:${r().toFixed(2)};--sx:${((r() - .5) * 44).toFixed(0)}px"></i>`;
  return (fireCache = `<i class="tglow" aria-hidden="true"></i><span class="tfire" aria-hidden="true">${f}</span><span class="tsparks" aria-hidden="true">${s}</span>`);
}
/* わかばの調理台（11/19 しょーくん「ほのかは場に炎。わかばは植物が下からニョキニョキ」）：マスの下のふちに若葉（fx-leafband・ゆっくりそよぐ）。
   くだものが育つと sproutFx：マスの下からつると葉がのびて（fx-sprout・熟したら花つきの fx-sprout-bloom）、葉と花びら（fx-leaf・fx-petal）が舞う。絵が届くまではコードの葉 */
let vineCache = '';
function vineHTML() {
  if (vineCache || !ART['fx-leafband']) return vineCache;
  let v = ''; for (let k = 0; k < 6; k++) v += `<i class="tvn" style="--x:${((k + .5) / 6 * 100).toFixed(1)}%;--k:${(k * .37 % 1).toFixed(2)};background-image:url('${ART['fx-leafband']}')"></i>`;
  return (vineCache = `<span class="tvine" aria-hidden="true">${v}</span>`);
}
function sproutFx(t, ripe) {
  if (!t) return;
  const u = ART[ripe ? 'fx-sprout-bloom' : 'fx-sprout'] || ART['fx-sprout'], e = document.createElement('i');
  e.className = 'fx-sprout' + (u ? '' : ' code'); e.innerHTML = u ? `<img src="${u}" alt="">` : '<b></b><b></b><b></b><b></b>';
  t.appendChild(e); setTimeout(() => e.remove(), 1500);
  for (let k = 0; k < 6; k++) {
    const pu = ART[ripe ? (k % 2 ? 'fx-flower' : 'fx-petal') : 'fx-leaf'];   // 熟したら花びらと小さな花
    const p = document.createElement('i'); p.className = 'fx-leafp' + (pu ? '' : ripe ? ' code ripe' : ' code');
    p.style.cssText = `--x:${(15 + k * 14).toFixed(0)}%;--dx:${((k - 2.5) * 9).toFixed(0)}px;--dy:${-(46 + (k * 17) % 30)}px;--r:${(k % 2 ? 1 : -1) * (90 + k * 40)}deg;--dl:${280 + k * 50}ms` + (pu ? `;background-image:url('${pu}')` : '');
    t.appendChild(p); setTimeout(() => p.remove(), 1800);
  }
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
  if (z > was) { replay(t, 'heatup'); pillars(t, was === 0 ? 4 : Math.min(4, z - was + 1), was === 0); t.querySelectorAll('.pc.tile.dough').forEach(c => replay(c, 'heatflash')); }
  else { replay(t, 'heatdn'); steam(t); }
}
/* ---------- みなもの飴の台（11/19）：鉄板の炎のかわりに、温度で台の色が変わる（ひえひえ＝霜・ひんやり＝水色・あたたか＝はちみつ色・とろとろ＝湯気がゆらゆら）
   ずっと動く物は CSS（transform と opacity だけ）。絵が届くまでのコードの仮 ---------- */
let tempCache = '';
function tempHTML() {
  if (tempCache) return tempCache;
  const r = prng(31); let s = '';
  for (let k = 0; k < 10; k++) s += `<i class="tst" style="--x:${(4 + r() * 92).toFixed(1)}%;--d:${(2 + r() * 1.6).toFixed(2)}s;--k:${r().toFixed(2)};--sx:${((r() - .5) * 30).toFixed(0)}px"></i>`;
  return (tempCache = `<i class="tcold" aria-hidden="true"></i><span class="tsteam" aria-hidden="true">${s}</span>`);
}
let tempWas = null;
function tempFx(h) {
  const t = document.querySelector('.tiles'); if (!t) return;
  const was = tempWas && tempWas.day === S.day ? tempWas.h : null;
  tempWas = { day: S.day, h }; t.dataset.t = h;
  if (was == null || h === was || REDUCED) return;
  if (h > was) { replay(t, 'heatup'); sparkBurst(t, 9, 'up', .8); } else { replay(t, 'heatdn'); steam(t); }
}
/* ラウンドの終わりに飴が冷めたとき：メーターの所に札 */
function coolFx([a, b]) {
  const H = heatOf(), el = $('heatLabel'); if (!el) return;
  floatAt(el.parentNode, `${H.names[a]}→${H.names[b]}`, 'ice');
}
function pillars(t, n, boom) {
  if (!document.body.animate) return;
  const L = fxLayer(), slots = [...t.querySelectorAll('.tslot')], ks = [...slots.keys()].sort(() => Math.random() - .5).slice(0, n);
  ks.forEach((k, j) => setTimeout(() => {
    const s = slots[k].getBoundingClientRect(), p = document.createElement('i');
    p.className = 'pillar' + (boom ? ' boom' : '');
    p.style.left = s.left + s.width / 2 + 'px'; p.style.top = s.bottom + 'px';
    p.style.setProperty('--pw', s.width * 1.15 + 'px'); p.style.setProperty('--ph', Math.min(innerHeight * .3, s.height * (.9 + Math.random() * .4) + (boom ? 24 : 0)) + 'px');   // 11/18 16時 しょーくん「少し炎の演出を弱めて」
    L.appendChild(p); setTimeout(() => p.remove(), 950);
  }, T(j * 55)));
  sparkBurst(t, boom ? 18 : 9, 'up', boom ? 1.3 : 1);
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
  if (cls !== 'roar') monFace(m, 'eat', 650);   // 味パワーを受けると、ぱくっと食べる顔（絵があるときだけ）
}
/* モンスターの顔の絵（mon-<id>-eat・-happy）に一時だけ入れかえる。絵がなければ何もしない */
function monFace(m, face, ms) {
  const u = m.dataset.mid && ART[`mon-${m.dataset.mid}-${face}`]; if (!u) return;
  if (!m._base) m._base = m.getAttribute('src');
  if (m.getAttribute('src') !== u) m.src = u;
  clearTimeout(m._ft); m._ft = setTimeout(() => { if (m.isConnected) m.src = m._base; }, ms);
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

/* ---------- 5. 発動の演出（11/18 16時 しょーくん「せっかくの戦闘シーンが、効果発動の吹き出しで見えない」「吹き出しなしで、発動のアイコンだけ、戦闘画面の上にヒュ、ヒュって飛んできて、ダメージが敵にバーンとあたる」）
   発動したカードのメダルが舞台へ飛ぶ → 計算の札（×3 焼き加減など）が1まいずつ飛んできて数字にすいこまれる → 数字がモンスターへバーン（night-ui.js の hitFx）
   ほかのカードへの効果の札は、そのタイルの上にぽんと出て上へ消える。札とメダルの面は描き下ろしの絵が来たら差しかえる（art-irai の ui-chips）
   動かすのは transform と opacity だけ（Web Animations）。ぜんぶ #fxl に出して消す ---------- */
const hubPoint = () => { const st = $('stage'); if (!st) return null; const r = st.getBoundingClientRect(); return { x: r.left + r.width * .5, y: r.top + r.height * .34 }; };
const chipHTML = c => `<b>${esc(c.b)}</b><small>${esc(c.s)}</small>`;
function fxEl(cls, p, html) {
  const el = document.createElement('div'); el.className = cls; el.style.left = p.x + 'px'; el.style.top = p.y + 'px'; el.innerHTML = html;
  fxLayer().appendChild(el); return el;
}
/* 置いた場所から見て f → t（どちらも {x,y} のずれ）へ、弧をえがいて飛ぶ。scale は s0 → s1。着いたら done */
function arcFly(el, f, t, ms, lift, s0, s1, done) {
  if (REDUCED || !el.animate) { el.style.transform = `translate(${t.x}px,${t.y}px) scale(${s1})`; setTimeout(done, 30); return; }
  const k = [];
  for (let n = 0; n <= 10; n++) { const u = n / 10; k.push({ transform: `translate(${f.x + (t.x - f.x) * u}px,${f.y + (t.y - f.y) * u - 4 * lift * u * (1 - u)}px) scale(${s0 + (s1 - s0) * u})` }); }
  el.animate(k, { duration: ms, easing: 'cubic-bezier(.4,0,.3,1)', fill: 'forwards' });
  setTimeout(done, ms);
}
/* 1. メダルが舞台へ：タイルから舞台のまんなかの上へヒュッ。返すのは {el, num}（数字は最初の札が着いたら出る） */
function flyHub(e, hot) {
  const b = hubPoint(); if (!b) return {};
  const a = spot(e.i) || b, el = fxEl('flyhub' + (hot ? ' hot' : ''), b, `<span class="fh-ico">${artImg(e.cid)}</span><b class="fh-num"><b>0</b></b>`);
  const H = { el, num: el.querySelector('.fh-num'), shown: false };
  arcFly(el, { x: a.x - b.x, y: a.y - b.y }, { x: 0, y: 0 }, T(330), 46, .45, 1, () => { el.classList.add('land'); ringAt(el.firstElementChild, 'r-gold'); sparkBurst(el.firstElementChild, 6, 'all', .6); });
  return H;
}
/* 2. 計算の札が飛んできて、数字にすいこまれる（効果の元のカードがあれば、そのマスから。マスに残った札があればすいこむ） */
function chipFly(e, c, H) {
  let from = e.i;
  if (c.src && c.src.length) { const got = c.src.map(s => takeBuff(e.i, s, c.k)); if (!got.some(Boolean)) from = c.src[0]; }
  const a = spot(from), tgt = H.num ? spot(H.num.firstElementChild) : null, b = tgt || hubPoint();
  const land = () => {
    if (H.num) {
      const n = H.num.firstElementChild;
      if (c.v != null) { if (!H.shown) { H.shown = true; H.num.classList.add('in'); n.textContent = fmt(Math.floor(c.v)); } else countUp(n, Math.floor(c.p || 0), Math.floor(c.v), T(240)); }
      replay(H.num, 'bump');
    }
    if (b) sparkBurst({ x: b.x, y: b.y, w: 16 }, 4, 'all', .5);
    if (c.out != null) auraOut(e, e.out[c.out]);
  };
  if (!a || !b) return land();
  const p = { x: a.x, y: a.y - a.h * .3 }, ch = fxEl(`fchip c-${c.c}`, p, chipHTML(c));
  arcFly(ch, { x: 0, y: 0 }, { x: b.x - p.x, y: b.y - p.y }, T(300), 34, 1.15, .8, () => { ch.classList.add('gone'); setTimeout(() => ch.remove(), 240); land(); });
}
/* 3. 数字が決まる（金色にはねる） */
function hubFin(H, dmg) {
  if (!H.num) return;
  const n = H.num.firstElementChild; H.shown = true;
  H.num.classList.add('in', 'fin'); n.textContent = fmt(dmg); replay(H.num, 'bump');
  ringAt(n, 'r-gold');
}
/* ほかのカードへの効果の札：タイル（か要素）の上にぽんと出て、上へ消える */
function chipPop(at, c) {
  const a = typeof at === 'number' ? spot(at) : at ? spot(at) : null; if (!a) return;
  const ch = fxEl(`fchip pop c-${c.c}`, { x: a.x, y: a.y - a.h * .5 }, chipHTML(c));
  ch.style.setProperty('--pd', T(1000) + 'ms');
  setTimeout(() => ch.remove(), T(1020));
}

/* ---------- 6. みなも②ちいさなキャンディ（11/19）：れんさの数・ちいさなキャンディ。動かすのは transform と opacity だけ ---------- */
/* 舞台の右上に「Nれんさ！」。数がふえるほど字が大きく・5から金色（2れんさから・11/19 しょーくん） */
function chainPop(n, word = 'れんさ！') {
  const st = $('stage'); if (!st) return;
  const r = st.getBoundingClientRect(), p = { x: r.left + r.width * .74, y: r.top + r.height * .2 };
  document.querySelectorAll('.chainpop').forEach(el => el.remove());
  const el = fxEl('chainpop' + (n >= 5 ? ' gold' : ''), p, `<b>${n}</b><small>${word}</small>`);
  el.style.setProperty('--cs', Math.min(1.7, .9 + n * .08).toFixed(2));
  if (!REDUCED && el.animate) el.animate([{ transform: 'translate(-50%,-50%) scale(.3) rotate(-12deg)', opacity: 0 }, { transform: 'translate(-50%,-50%) scale(1.18) rotate(-6deg)', opacity: 1, offset: .25 },
    { transform: 'translate(-50%,-50%) scale(1) rotate(-6deg)', opacity: 1, offset: .4 }, { transform: 'translate(-50%,-58%) scale(1) rotate(-6deg)', opacity: 0 }], { duration: T(1100), easing: 'ease-out', fill: 'forwards' });
  setTimeout(() => el.remove(), T(1150));
}
/* わかば①デコレーション台の連撃（11/19 しょーくん「連続で大量にヒットする爽快感」）：ケーキのタイルから、色とりどりのデコがつぎつぎ飛んで当たる・「N連撃！」
   1こずつ待たずに、0.1秒ごとに追いかけて飛ぶ（さいごの1こだけ当たるまで待つ） */
const DECO_COL = ['#ff8fb0', '#ffd45a', '#8fe0c0', '#a8c8ff', '#ffb070', '#e0a8ff'];
function decoFx(e, run, q) {
  const a = spot(e.i), b = spot($('mon'));
  const land = () => {
    monReact('hit'); if (b) { dmgNum(e.dmg, '', b); sparkBurst({ x: b.x, y: b.y, w: 10 }, 5, 'all', .6); }
    chainPop(e.k + 1, '連撃！'); scoreTick(e.dmg, run, q);
  };
  if (e.k === 0) { const slot = tslot(e.i), card = slot && slot.querySelector('.pc'); if (card) replay(card, 'kon'); heroPose('support', 900); }
  if (!a || !b || REDUCED || !document.body.animate) { setTimeout(land, T(60)); return 120; }
  const el = fxEl('fx-deco', a, '<i></i>'), ms = T(360), side = (e.k % 2 ? 1 : -1) * (10 + (e.k % 4) * 7);
  el.style.setProperty('--dc', DECO_COL[e.k % DECO_COL.length]); el.style.setProperty('--pr', (e.k * 53 % 360) + 'deg');
  arcFly(el, { x: side * .3, y: -a.h * .25 }, { x: b.x - a.x, y: b.y - a.y }, ms, 50 + (e.k % 3) * 18, .5, .9, () => { el.remove(); land(); });
  return 110 + (e.k === e.n - 1 ? 480 : 0);
}
/* ちいさなキャンディ：はじけキャンディのタイルから、小さな飴がぽんと はじけてモンスターへ。当たったら数字と、れんさ */
function petitFx(e, run, q) {
  const a = spot(e.i), b = spot($('mon'));
  const land = () => {
    monReact('hit'); if (b) { dmgNum(e.dmg, '', b); sparkBurst({ x: b.x, y: b.y, w: 12 }, 8, 'all', .8); }
    if (e.chain >= 2) chainPop(e.chain);
    scoreTick(e.dmg, run, q);
  };
  if (e.k === 0) { const slot = tslot(e.i), card = slot && slot.querySelector('.pc'); if (card) replay(card, 'kon'); }
  if (!a || !b || REDUCED || !document.body.animate) { setTimeout(land, T(120)); return 260; }
  const el = fxEl('fx-petit', a, artImg(e.cid)), ms = T(420), side = (e.k % 2 ? 1 : -1) * (14 + e.k * 6);
  el.style.setProperty('--pr', (e.k * 47 % 360) + 'deg');
  arcFly(el, { x: side * .3, y: -a.h * .2 }, { x: b.x - a.x, y: b.y - a.y }, ms, 70 + e.k * 12, .5, .9, () => { el.remove(); land(); });
  return 370 + (e.k === e.n - 1 ? 520 : 0);   // 次の飴は とちゅうで追いかける・さいごの1こは当たるまで待つ
}
