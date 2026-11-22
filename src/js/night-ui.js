/* ==== 夜のバトルの画面：舞台（ほのか・モンスター・鉄板の火力の光）・調理台（左にフィールドの「場」＋アイコンのタイル5つを1行・左から順）・仕入れ・下のボタン列
   生地のタイルには焼き加減のメーター（9段階・9でサイコー）
   バトル中の発動は、メダルと計算の札が舞台へ飛ぶ（11/18 16時・説明のパネルはやめた）
   カードはタップでえらぶ → 光る行き先をタップで置く・うごかす・まぜる（まぜる前に、できるカードを見せる）。えらんだカードをもう1回タップで大きく見る ==== */
const ORD = ['①', '②', '③', '④', '⑤'];

/* ---------- 演出 ---------- */
/* 鉄板の火力（1〜4）。フィールドがないと焼けないので、光らせない */
/* キャラのまわりの空気（11/22 しょーくん「火力や冷たさに応じて キャラの周りに火の粉や冷気を纏う」「連鎖はキラキラのオーロラ・パン生地は赤いオーラ」
   →「縁取りじゃなくて、周りを漂ってる霧」「わかばも緑の霧に、妖精の光を」）：
   ほのかの火力クッキー＝熱の霧と火の粉（火力 0〜4）・こね生地＝赤い霧（この夜にこねた回数）・みなもの大作＝冷気の霧と雪（ひえひえ＝強い・ひんやり＝弱い）・
   ちいさなキャンディ＝パステルの霧とキラキラ（れんさ）・わかば＝若葉の霧と妖精の光（いつも少し・熟した実が多いほど こく）。
   #caBack＝シェフのうしろに立ちのぼる霧 .cm（3つ）・#caFront＝足もとを横にただよう霧 .cw（2つ）と粒 .cp（AURA_N こ）と妖精 .cf（3つ）。
   強さ data-lv 1〜4 で見せる数と こさが変わる。絵は ART の fx-aura-*（霧）と粒の絵（AURA_ART）。動くのは transform と opacity だけ（style-battle.css の「キャラのまわりの空気」） */
const AURA_N = 12;
const AURA_ART = { fire: ['fx-aura-fire', 'fx-ember'], kone: ['fx-aura-kone', 'fx-aura-kone'], cold: ['fx-aura-cold', 'fx-snow'], candy: ['fx-aura-candy', 'fx-twinkle'], leaf: ['fx-aura-leaf', 'fx-leaf'] };
const auraBackHTML = () => '<i class="ca-back" id="caBack"><i class="cm cm1"></i><i class="cm cm2"></i><i class="cm cm3"></i></i>';
const auraFrontHTML = () => `<i class="ca-front" id="caFront"><i class="cw cw1"></i><i class="cw cw2"></i>${[1, 2, 3].map(n => `<i class="cf cf${n}"><i></i></i>`).join('')}${Array.from({ length: AURA_N }, (_, i) => `<i class="cp" style="--x:${((i * 37) % 100 / 100).toFixed(2)};--y:${((i * 53) % 100 / 100).toFixed(2)};--d:${(-((i * .61) % 2.4)).toFixed(2)}s;--t:${(1.7 + (i * 7 % 10) / 10).toFixed(1)}s;--s:${(.7 + (i * 3 % 5) / 10).toFixed(1)}"></i>`).join('')}</i>`;
const ripeNow = () => N.board.filter(c => { if (!c) return false; const d = cardDef(c.cid); return (d.fruit && d.stage === RIPE) || (d.fx && d.fx.fruitCake); }).length;
function auraSync(o = {}) {
  const b = $('caBack'), f = $('caFront'); if (!b || !f || !N) return;
  const c = chefArt(); let k = '', lv = 0;
  if (c === 'honoka') {
    if (heatOf().off) { k = 'kone'; const n = o.kone != null ? o.kone : (N.kone || 0); lv = n <= 0 ? 0 : n < 4 ? 1 : n < 8 ? 2 : n < 12 ? 3 : 4; }
    else { k = 'fire'; lv = Math.max(0, Math.min(4, o.heat != null ? o.heat : N.heat)); }
  } else if (c === 'minamo') {
    if (candyNight()) { k = 'candy'; const n = o.chain != null ? o.chain : chainNow; lv = n <= 0 ? 0 : n < 3 ? 1 : n < 5 ? 2 : n < 7 ? 3 : 4; }
    else { k = 'cold'; const tp = o.heat != null ? o.heat : N.heat; lv = tp <= 1 ? 4 : tp === 2 ? 2 : 0; }
  } else if (c === 'wakaba') { k = 'leaf'; lv = 1 + Math.min(3, ripeNow()); }
  if (b.dataset.k !== k) {   // 絵は種類が変わったときだけ入れる（絵がまだないときは、コードの光と粒＝data-art なし）
    const A = AURA_ART[k], ok = A && ART[A[0]] && ART[A[1]];
    for (const e of [b, f]) { e.dataset.art = ok ? '1' : ''; if (ok) { e.style.setProperty('--am', `url("${ART[A[0]]}")`); e.style.setProperty('--ap', `url("${ART[A[1]]}")`); } if (ok && k === 'leaf') e.style.setProperty('--af', `url("${ART['fx-fairy'] || ART[A[1]]}")`); }
  }
  for (const e of [b, f]) { if (e.dataset.k !== k) e.dataset.k = k; if (e.dataset.lv !== String(lv)) e.dataset.lv = lv; }
}
function setHeat(h) {
  const bar = $('heatBar'), lab = $('heatLabel'), st = $('stage'); if (!st) return;
  auraSync({ heat: h });
  const H = heatOf();   // ほのかの火力も みなもの飴の温度も、場がなくても効く（11/20 ほのかも）
  if (H.none) return;   // わかば（11/19）：メーターはない（くだものはカードの絵で育つ）
  if (bar && !H.off) {   // こね生地・ちいさなキャンディ（11/21 夜）はメーターなし（右上は こね・れんさ の数だけ）
    [...bar.children].forEach((c, i) => { c.className = i < h ? 'on h' + (i + 1) : ''; });
    lab.textContent = H.names[h];   // ほのかの0は「火なし」（字は灰色の h0）
    lab.className = 'heat-label h' + h;
  }
  if (chefArt() === 'minamo') { if (candyNight()) { st.dataset.t = 'c'; return; } st.dataset.t = h; return tempFx(h); }   // キャンディの夜は 飴の空気（data-t=c・雪や霜は出さない）   // 飴の温度（battle-fx.js）・舞台の空気 .aqua も data-t で変わる（キャンディの夜は ひんやり のまま）
  st.dataset.z = h;
  heatFx(h);   // 調理台の下の炎（battle-fx.js・火なしのときは出ない）
}
/* タイル1つを描きなおす（焼き加減・焦げ・大作の大きさと固まる） */
function updTile(i, cid, cook, ice) {
  const slot = document.querySelector(`.tslot[data-w="board"][data-i="${i}"]`); if (!slot) return null;
  slot.innerHTML = `<i class="ord">${i + 1}</i>${cardTile(cid, { cook, ice })}`;
  return slot.querySelector('.pc');
}
/* 掛け声（11/19 H-034・声は koe-irai・11/21〜 Gemini TTS：ほのか Leda・みなも Despina・わかば Achernar）：大きい攻撃（★2・★3・必殺技）はいつも・★1 は3回に1回くらい。大満足・だめだったときは night.js の nightEndSnd */
const KOE_ATK = { honoka: ['hono-ei', 'hono-ya', 'hono-sore', 'hono-taa', 'hono-tou', 'hono-sei'], minamo: ['mina-ha', 'mina-fu', 'mina-fun', 'mina-soko'], wakaba: ['waka-sore', 'waka-ei', 'waka-hoi', 'waka-eei'] };   // 11/21 PR #25 の本文の0（たぁっ・とうっ・せいっ／ふんっ・そこ／ほいっ・えーいっ）
const KOE_END = { honoka: ['hono-yatta', 'hono-achaa'], minamo: ['mina-yoshi', 'mina-n'], wakaba: ['waka-ufufu', 'waka-uun'] };   // 11/21 昼の PR #25：あらあら（waka-araara）をなくしたので、だめだった声は うーん
/* 考えている声「んー」（11/21 しょーくん「んーは夜のショップの考えているシーンに使うの」・waka-maa は使わない）：
   11/22 しょーくん「ショップ画面でキャラクターみんな、悩んでるボイスが流れてない気がする」→ 前は「8秒なにもしない」で、さわるたびに数えなおし・鳴ったら次のラウンドは休み＝ほとんど鳴らなかった。
   いまは ショップが出てから4秒で、毎ラウンド1回（つかんでいる・会話・大きく見ている・ヒントの声のあいだは少し待つ）。さわっても数えなおさない */
/* 11/22 しょーくん「考え中の読み上げバリエーションを増やそう・キャラの性格に合わせて3種類くらい」：んー に3つずつ足して、毎回ちがう声（すぐ前と同じ声は続けない・ファイルのない声は使わない） */
const KOE_THINK = { honoka: ['hono-uun', 'hono-think1', 'hono-think2', 'hono-think3'], minamo: ['mina-uun', 'mina-think1', 'mina-think2', 'mina-think3'], wakaba: ['waka-uun', 'waka-think1', 'waka-think3'] };   // waka-think2（あらあら、迷っちゃうわぁ）は しょーくんが「使わない」
function thinkKoe() {
  const L = (KOE_THINK[chefArt()] || []).filter(koeHas), c = L.filter(n => n !== thinkKoe.last);
  const n = (c.length ? c : L)[Math.floor(Math.random() * (c.length || L.length))]; if (!n) return;
  thinkKoe.last = n; koePlay(n);
}
const THINK_MS = 4000;
let thinkT = 0, thinkKey = '', thinkDone = '';
function thinkArm() {
  if (!N || N.stage !== 'shop' || fighting) return;
  const key = S.day + ':' + N.round;
  if (thinkDone === key || thinkKey === key) return;   // このラウンドは もう鳴らした／もう数えている
  clearTimeout(thinkT); thinkKey = key;
  thinkT = setTimeout(function go() {
    if (S.phase !== 'night' || !N || N.stage !== 'shop' || fighting || S.day + ':' + N.round !== key) { thinkKey = ''; return; }
    if (busy || talking() || N.view || document.querySelector('.night.dragging') || (typeof TIP !== 'undefined' && TIP && Date.now() - (TIP.at || 0) < 4000)) { thinkT = setTimeout(go, 1500); return; }
    thinkDone = key; thinkKoe();
  }, THINK_MS);
}
/* 場面の声（11/21 しょーくん「大作ができたときの ほのか『できた！』みなも『完成。』わかば『できた』とか色々」・えらぶ質問で4つ）：
   star3＝★3ができた（まぜて★3・大作の完成・ジャム。バトルの発動では鳴らさない）・full＝ラウンドでおなか満タン・sp＝必殺技の一撃・show＝ビルドの見せ場（焦げた・冷えた・熟した＝1ラウンドに1回）。
   音のファイルがないときは鳴らさない（koe-irai の kakegoe-night2 から えらんで assets/koe へ） */
const KOE_MORE = {
  star3: { honoka: 'hono-dekita', minamo: 'mina-kansei', wakaba: 'waka-dekita' },
  full: { honoka: 'hono-yattane', minamo: 'mina-joudeki', wakaba: 'waka-iikao' },
  sp: { honoka: 'hono-ikke', minamo: 'mina-korede', wakaba: 'waka-soree' },
  show: { honoka: 'hono-achi', minamo: ['mina-hieta', 'mina-iikanji'], wakaba: 'waka-jukushita' },   // 11/22 しょーくん「みなもの凍ったときの いい感じ」：冷えた。と かわりばんこ
  max: { honoka: 'hono-max' },   // 11/22 しょーくん「ほのかの火力マックス」：バトルで火力がマックスになったとき（1ラウンドに1回）
  /* 11/22 しょーくん（夜でまだ声がない場面を4つとも）：tane＝こね生地でパン種が生まれた・chain＝キャンディのれんさが4に（どちらも1ラウンドに1回）・
     go＝おもてなし！を押した・wow＝1万こえの一撃とオーバーラン・pick＝今夜のビルドをえらんだ（これにする！） */
  tane: { honoka: ['hono-tane1', 'hono-tane2'] },
  chain: { minamo: ['mina-chain1', 'mina-chain2'] },
  go: { honoka: ['hono-go1', 'hono-go2'], minamo: ['mina-go1', 'mina-go2'], wakaba: ['waka-go1', 'waka-go2'] },
  wow: { honoka: ['hono-wow1', 'hono-wow2'], minamo: ['mina-wow1', 'mina-wow2'], wakaba: ['waka-wow1', 'waka-wow2'] },
  pick: { honoka: 'hono-pick', minamo: 'mina-pick', wakaba: 'waka-pick' },
};
const koeHas = id => !!id && typeof KOE_SRC !== 'undefined' && !!KOE_SRC[id];
function koeMore(k, perRound) {
  let id = (KOE_MORE[k] || {})[chefArt()];
  if (Array.isArray(id)) { const L = id.filter(koeHas), c = L.filter(n => n !== koeMore.prev); id = (c.length ? c : L)[Math.floor(Math.random() * (c.length || L.length))]; }   // 候補がいくつかあるときは すぐ前と同じ声にしない
  if (!koeHas(id)) return false;
  if (perRound) { const key = S.day + ':' + (N ? N.round : 0) + ':' + k; if (koeMore.last === key) return false; koeMore.last = key; }
  koeMore.prev = id; koePlay(id); return true;
}
function atkKoe(pose) {
  if (pose === 'special' && koeMore('sp')) return;   // 必殺技は「いっけー！」など
  const L = KOE_ATK[chefArt()]; if (!L || (pose === 'atk1' && Math.random() > .34)) return;
  const C = L.filter(n => n !== atkKoe.last), n = C[Math.floor(Math.random() * C.length)];   // すぐ前と同じ声は続けない（飽きにくく）
  atkKoe.last = n; koePlay(n);
}
function burntFx(slot) { sePlay('burnt'); replay($('smoke'), 'on'); heroPose('burnt', 1100); koeMore('show', true); if (slot) floatAt(slot, '焦げた', 'koge'); }
function floatAt(el, text, cls = '') {
  if (!el) return;
  const f = document.createElement('span');
  f.className = 'float ' + cls; f.textContent = text;
  el.appendChild(f); setTimeout(() => f.remove(), 1000);
}
function replay(el, cls) { if (!el) return; el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); }
/* ---------- こね生地（11/18）：こねた回数の札（ショップの上と、バトル中は火力のメーターのとなり）・こねたときの演出 ---------- */
const koneOn = () => N && N.build === 'kone';
const koneBadge = () => koneOn() ? `<span class="kone-n" aria-label="こねた回数 ${N.kone}">こね <b>${N.kone}</b></span>` : '';   // 字はラウンドの札と同じ（11/21 夜 しょーくん「ラウンド表記と同じく文字の大きさや中央揃えも」）
/* ちいさなキャンディ（11/21 夜 しょーくん「温度ゲージがあった所に れんさの回数」）：バトル中の れんさ（ラウンドのはじめは場の chain0・キャンディの発動で のびて、素材や道具で0） */
let chainNow = 0;
const chainBadge = () => candyNight() ? `<span class="kone-n chain-n" aria-label="れんさ ${chainNow}">れんさ <b>${chainNow}</b></span>` : '';
function setChain(n) { if (n === chainNow) return; if (n > chainNow) candyRain(n); if (n >= 4 && chainNow < 4) koeMore('chain', true); chainNow = n; auraSync({ chain: n }); document.querySelectorAll('.chain-n').forEach(el => { el.querySelector('b').textContent = n; el.setAttribute('aria-label', 'れんさ ' + n); replay(el, 'bump'); }); }
function setKone(n) { auraSync({ kone: n }); document.querySelectorAll('.kone-n').forEach(el => { el.querySelector('b').textContent = n; replay(el, 'bump'); }); }
function kneadFx(i, add, born) {
  const slot = tslot(i); if (slot) floatAt(slot, `こね+${add}`, 'cookup');
  setKone(N.kone); heroFor('joy', 900);
  if (born) koeMore('tane', true);   // パン種できた！（11/22）
  document.querySelectorAll('.tslot .pc.born').forEach(c => floatAt(c.parentNode, 'パン種', 'best'));
  if (!born) toast('調理台がいっぱいで、パン種は生まれなかった');
}
/* ---------- わかば（11/19）：ジャムの数の札・大きなびんに入れた／ジャムができた・ラウンドの終わりに くだものが育った ---------- */
const jamBadge = () => binNight() ? `<span class="kone-n jam-n" aria-label="作ったジャム ${N.jamN}">ジャム <b>${N.jamN}</b></span>` : '';
function binFx(made) {
  const fs = document.querySelector('.fslot');
  if (!made) { floatAt(fs, 'びんに入れた', 'cookup'); heroFor('joy', 700); return; }
  floatAt(fs, 'ジャム！', 'best'); heroPose('support', 900); document.querySelectorAll('.jam-n').forEach(el => replay(el, 'bump'));   // 右上・ショップの上の「ジャム」も ぷるっと（11/21 夜）
  const k = N.board.findIndex(c => c && c.cid === made), t = tslot(k); if (t) floatAt(t, 'ジャムができた', 'best');
  setTimeout(() => cutIn(made, 'ジャムができた！'), 200);
}
function fruitFx(list) {
  setTimeout(() => list.forEach((x, n) => setTimeout(() => {
    const t = tslot(x.i), c = t && t.querySelector('.pc'); if (c) replay(c, 'kon'); sproutFx(t, x.to >= RIPE);
    floatAt(t, x.to >= RIPE ? '熟した！' : '育った', x.to >= RIPE ? 'best' : 'cookup');
    auraSync();   // わかばの霧と妖精は、熟した実が多いほど こく
  }, n * 160)), 650);
}
/* 大きなびん（場）の中の実：入っている実の絵と、あといくつ（3つでジャム） */
/* 場のカードの特色（11/19 しょーくん「戦闘画面はこんなに大きくなくていい・カードの直下に スタート・アンカー・焦げ などの特色だけでも」）：
   調理台のすぐ下に、マスごとに効果のことばを2つまで（描き下ろしの札 ui-chip-*）。スタート・アンカーは、いま その場所（いちばん左・いちばん右のカード）にいるときだけ光る */
const TRAIT_C = { スタート: 'gold', アンカー: 'gold', 焦げ: 'koge', 焦げ無効: 'koge', 火力: 'ember', サイコー: 'ember', 温度: 'mint', 熟した実: 'pink', こね: 'pink', パン種: 'pink' };
function cardTraits(cid) {
  const d = cardDef(cid), out = d.cat === 'burnt' ? ['焦げ'] : [];
  for (const t of cardChips(d)) {
    const m = /^(スタート|アンカー)/.exec(t), w = m ? m[1] : /焦げ無効/.test(t) ? '焦げ無効' : (t.match(KW_SHORT) || [])[0];
    if (w && !out.includes(w)) out.push(w);
  }
  return out.slice(0, 2);
}
function traitRowHTML() {
  if (N.stage === 'pick') return '';   // シェフえらびの2×2 は舞台を大きいまま使う
  const idx = N.board.map((c, i) => c ? i : -1).filter(i => i >= 0), first = idx[0], last = idx[idx.length - 1];
  const cell = (c, i) => c ? cardTraits(c.cid).map(w => `<b class="tk c-${TRAIT_C[w] || 'pink'}${(w === 'スタート' && i !== first) || (w === 'アンカー' && i !== last) ? ' off' : ''}">${w}</b>`).join('') : '';
  return `<div class="tkws" aria-hidden="true"><i class="tkw"></i>${N.board.map((c, i) => `<i class="tkw">${cell(c, i)}</i>`).join('')}</div>`;
}
function binHTML() {
  if (!fixedField()) return '';
  const left = Math.max(0, BIN_MAX - binCount()), dots = N.bin.map(m => `<img src="${cardIconURL('m:' + m)}" alt="">`).join('') + '<i></i>'.repeat(left);
  return `<span class="bin-in" aria-label="びんの実 ${N.bin.length}">${dots}</span>`;
}
function taneFx() { document.querySelectorAll('.tslot .pc.born').forEach(c => floatAt(c.parentNode, 'パン種', 'best')); }
/* 数字をかぞえ上げる（ms のあいだ） */
function countUp(el, from, to, ms, f = fmt) {
  if (!el) return;
  if (REDUCED || ms < 60 || from === to) { el.textContent = f(to); return; }
  const t0 = performance.now();
  let last = 0;   // 11/19 書きかえは30こま/秒まで・同じ字なら書かない（字を変えるたびに舞台ぜんぶの計算がはしる）
  const tick = now => {
    const t = Math.min(1, (now - t0) / ms);
    if (t >= 1 || now - last >= 32) { last = now; const s = f(Math.floor(from + (to - from) * (1 - Math.pow(1 - t, 3)))); if (el.textContent !== s) el.textContent = s; }
    if (t < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
/* バトルの一撃：ほのかの手から火の玉（火の粉の尾）→ モンスターに当たってぐにゃっ・光の輪と火花 → 大きな数字
   ぜんぶ画面の上の層 #fxl に出す（額縁の外へはみ出す）。ノルマにくらべて大きいほど派手に（big＝舞台がゆれる・huge＝画面いっぱいの炎） */
/* 1万をこえる一撃（11/21 夜 しょーくん「ヒットストップして、大ダメージを与えてる感覚に・一瞬スローになって、次の瞬間に爆撃音」）：
   数字が飛んでいくとちゅうから スロー（ほかの動きも 1/5 の速さ・画面のまわりが暗く・曲が小さく・吸いこむ音）→ 当たる直前で止まる（ヒットストップ）→ ドーン（boom・白い光・二重の衝撃波・大きなゆれ） */
const MEGA_HIT = 10000, MEGA_SLOW = 900;   // MEGA_SLOW＝ふつうの一撃より長くなる ms（はやおくり前）
function hitFx(dmg, q, proj, mega) {   // proj＝舞台に飛んできた数字（battle-fx.js の flyHub）。あればそれがモンスターへ飛ぶ（なければ ほのかの手から火の玉）
  const chef = $('chef'), a = spot(proj || chef), b = spot($('mon'));
  if (!chef || !chef.dataset.pose) replay(chef, 'act');   // 戦闘ポーズ中は heroPose の動きにまかせる
  const size = dmg >= q * 0.6 ? 'huge' : dmg >= q * 0.2 ? 'big' : '', fly = T(size ? 520 : 440);
  const land = p => {
    if (proj) proj.remove();
    monReact(size ? 'hitbig' : 'hit'); dmgNum(dmg, size, p);
    decoReact(size ? 'jump' : 'hop', size ? 800 : 500);
    if (size) decoChibi('cheer', 1400);
    impactFx(p, size);   // 11/19 しょーくん「攻撃の迫力が見たい」「枠外にも演出」：画面いっぱいの光・額縁をこえる衝撃波・斬撃・ゆれ
    if (size === 'huge') fireWall();
  };
  if (REDUCED || !a || !b || !document.body.animate) return land(b);
  const L = fxLayer(), x0 = proj ? a.x : a.x + a.w * .32, y0 = proj ? a.y : a.y - a.h * .18, x1 = b.x - b.w * .05, y1 = b.y;
  const at = t => { const u = t * t; return { x: x0 + (x1 - x0) * u, y: y0 + (y1 - y0) * u - (proj ? 40 : 88) * u * (1 - u) }; };   // ゆっくり出て速くなる・少し弧をえがく
  const ball = proj || document.createElement('i'), ang = proj ? 0 : Math.atan2(y1 - y0, x1 - x0) * 180 / Math.PI;
  if (proj) proj.classList.add('shot');
  else { ball.className = 'fx-ball' + (size ? ' s-' + size : ''); ball.style.left = x0 + 'px'; ball.style.top = y0 + 'px'; L.appendChild(ball); }
  const kf = t => { const p = at(t); return { transform: `translate(${p.x - x0}px,${p.y - y0}px) rotate(${ang}deg) scale(${proj ? 1 + .5 * t : .55 + .85 * t})` }; };
  if (mega) return megaHit(ball, kf, at, x1, y1, fly, land, size);
  ball.animate([...Array(9)].map((_, k) => kf(k / 8)), { duration: fly, fill: 'forwards' });
  for (let k = 1; k < 8; k++) setTimeout(() => sparkBurst({ ...at(k / 8), w: 8 }, size ? 3 : 2, 'all', .35), fly * k / 8);
  setTimeout(() => {
    if (!REDUCED) ball.animate([{ transform: ball.style.transform || 'none' }], { duration: 1 });   // ヒットストップ：当たった所で一瞬止まる
  }, fly - 2);
  setTimeout(() => {
    ball.remove(); land({ x: x1, y: y1 });
    const h = document.createElement('i'); h.className = 'fx-hit' + (size ? ' s-' + size : ''); h.style.left = x1 + 'px'; h.style.top = y1 + 'px';
    L.appendChild(h); setTimeout(() => h.remove(), 520);
    sparkBurst({ x: x1, y: y1, w: 20 }, size === 'huge' ? 34 : size ? 24 : 14, 'all', size === 'huge' ? 2.3 : size ? 1.7 : 1.15);
  }, fly + T(90));   // 90ms 止まってから はじける
}

/* 1万こえの一撃：ふつうの速さ（道の6割）→ スロー（道の6割→9割6分）→ 止まる → ドーン。合わせて ふつうの一撃より MEGA_SLOW ぶん長い */
function megaHit(ball, kf, at, x1, y1, fly, land, size) {
  const t1 = Math.round(fly * .5), t2 = T(Math.round(MEGA_SLOW * .62)), t3 = T(Math.round(MEGA_SLOW * .26)), all = t1 + t2 + t3, o1 = t1 / all, o2 = (t1 + t2) / all;
  const K = [];
  for (let k = 0; k <= 4; k++) K.push({ ...kf(.6 * k / 4), offset: o1 * k / 4 });
  for (let k = 1; k <= 6; k++) K.push({ ...kf(.6 + .36 * k / 6), offset: o1 + (o2 - o1) * k / 6, easing: 'linear' });
  K.push({ ...kf(.96), offset: 1 });
  const anim = ball.animate(K, { duration: all, fill: 'forwards' });
  for (let k = 1; k < 5; k++) setTimeout(() => sparkBurst({ ...at(.6 * k / 5), w: 8 }, 3, 'all', .35), t1 * k / 5);
  const app = $('app'); let slowed = [];
  setTimeout(() => sePlay('slowin', { vol: .7, rate: 1000 / Math.max(1, T(1000)) }), Math.max(0, all - T(1050)));   // 吸いこむ音が止まった所（1.05秒）でドーン。はやおくりは音も速く
  setTimeout(() => {   // スロー：ほかの動き（モブ・シェフ・光）も 1/5 の速さに
    slowed = document.getAnimations().filter(a => a !== anim && a.playState === 'running');   // 先にあつめる（暗くする幕の出るアニメはおそくしない）
    slowed.forEach(a => { try { a.playbackRate = .2; } catch (e) { /* もう終わった */ } });
    if (app) app.classList.add('slowmo');
    if (typeof bgmDuck === 'function') bgmDuck(t2 + t3 + 200);
  }, t1);
  setTimeout(() => {   // ヒットストップ：ぜんぶ止める
    if (app) app.classList.add('hitstop');
    slowed.forEach(a => { try { a.playbackRate = 0; } catch (e) { /* もう終わった */ } });
  }, t1 + t2);
  setTimeout(() => {   // ドーン
    slowed.forEach(a => { try { a.playbackRate = 1; } catch (e) { /* もう終わった */ } });
    if (app) app.classList.remove('slowmo', 'hitstop');
    sePlay('boom', { vol: .9 }); setTimeout(() => koeMore('wow'), 350);   // すっごーい！（11/22）
    ball.remove(); land({ x: x1, y: y1 }); megaBoom({ x: x1, y: y1 });
    const L = fxLayer(), h = document.createElement('i'); h.className = 'fx-hit s-huge'; h.style.left = x1 + 'px'; h.style.top = y1 + 'px';
    L.appendChild(h); setTimeout(() => h.remove(), 520);
    sparkBurst({ x: x1, y: y1, w: 20 }, 44, 'all', 2.8);
  }, all);
}

/* ---------- バトルの流れ（11/18 しょーくん「一瞬すぎて味気ない」「ショップ→戦闘の移行をかっこよく」・ぜんぶのせシップの切りかえを参考に） ---------- */
/* 1. バトル！を押すと、ショップのカードが上へはけて、ショップがのれんのように上がる */
function shopOut(done) {
  const ov = document.querySelector('.shopov');
  if (!ov || REDUCED) return done();
  ov.classList.add('out'); const st = $('stage'); if (st) st.classList.add('st-out');   // .st-shop.st-out＝ショップがのれんのように上がるところ（CSS で :has を使わない＝軽い・11/21 夜）
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
    chipPop(fs, { b: HEAT[e.heat], s: `焼き+${e.heat}`, c: 'ember' }); heroPose('field', 1000);   // 鉄板に手をかざして焼く
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
  if (e.type === 'grow') {   // みなもの大作が育つ（11/19）：場のマスの上に温度の札 → 大作のタイルが左から順にきらっ（+大きさ・完成！・固まった）
    const fs = document.querySelector('.fslot'), H = heatOf(), cold = e.heat <= 1;
    chipPop(fs, { b: H.names[e.heat], s: cold ? '冷えた' : `大きさ+${GROW[e.heat]}`, c: e.heat <= 2 ? 'mint' : 'gold' }); heroPose('field', 1000);   // 飴の台に手をかざす
    const t0 = 420, gap = 260, done = e.list.filter(x => x.to >= SIZE_MAX && x.from < SIZE_MAX);
    e.list.forEach((x, n) => setTimeout(() => {
      const card = updTile(x.i, x.cid, x.to, !!x.ice), slot = card && card.parentNode;
      if (card) { replay(card, x.ice ? 'freeze' : 'sear'); if (!x.ice) sparkBurst(card, 6, 'up', .6); }
      floatAt(slot, x.ice ? (x.ice === 'on' ? '冷えた！' : '冷えたまま') : x.melt && x.to === x.from ? 'とけた' : x.to >= SIZE_MAX ? '完成！' : `${x.melt ? 'とけた・' : ''}大きさ+${x.to - x.from}`, x.ice ? 'ice' : x.to >= SIZE_MAX ? 'best' : 'cookup');
    }, T(t0 + n * gap)));
    let t = t0 + e.list.length * gap + 400;
    if (done.length) { setTimeout(() => cutIn(done[0].cid, '大作 完成！'), T(t)); t += 1500; }
    return t + 250;
  }
  if (e.type === 'petit') return petitFx(e, run, q);   // みなも②：ちいさなキャンディが1こ飛ぶ（battle-fx.js）
  if (e.type === 'deco') return decoFx(e, run, q);     // わかば①：デコレーション台の連撃（battle-fx.js）
  if (e.type === 'fgrow') {   // わかば：スタートのロール生地で、くだものぜんぶ育つ（11/19）
    chipPop(tslot(e.by), { b: '育つ', s: 'くだものぜんぶ', c: 'mint' }); heroPose('support', 1000);
    const t0 = 420, gap = 240;
    e.list.forEach((x, n) => setTimeout(() => {
      const card = updTile(x.i, x.cid); if (card) { replay(card, 'sear'); sproutFx(card.parentNode, x.to >= RIPE); }
      floatAt(card && card.parentNode, x.to >= RIPE ? '熟した！' : '育った', x.to >= RIPE ? 'best' : 'cookup');
    }, T(t0 + n * gap)));
    return t0 + e.list.length * gap + 500;
  }
  const d = cardDef(e.cid), slot = tslot(e.i), card = slot && slot.querySelector('.pc');
  if (slot) slot.classList.add('now', 'done');
  if (candyNight()) { if (e.chain != null) setChain(e.chain); else if (e.chainBreak) setChain(0); }   // 右上の れんさ（11/21 夜）
  if (e.chain >= 2) chainPop(e.chain);   // 2れんさから大きく（11/19 しょーくん）
  else if (e.chainBreak >= 2) floatAt(slot, 'れんさ おわり', 'ice');
  if (e.again) takeBuff(e.i, e.i - 1, 'again');
  /* 1. 発動したカードが跳ねる（★1 ぽん・★2 大きく・★3 縦にくるっと1回転してズドン） */
  sePlay('serve');   // おもてなしの発動（11/19 H-034）
  let t = card ? actBounce(card, d.star) : 300;
  const C = actChips(e), H = {};
  /* ほのかの戦闘ポーズ：ダメージのあるカードは チャージ → 攻撃（★で3段・おなかの6割をこえる一撃は必殺技）、ないカードは役目のポーズ */
  if (e.dmg > 0) heroPose('charge');
  else heroPose(e.heat ? (e.heat[1] > e.heat[0] ? 'heatup' : 'heatdown') : e.kone ? 'knead' : e.sear ? 'heatup' : e.grow || e.water ? 'field' : 'support', 1100);
  /* 2. ダメージのあるカード：メダルが舞台へ → 計算の札が飛んできて数字が変わる */
  if (e.dmg > 0) {
    setTimeout(() => { Object.assign(H, flyHub(e, e.dmg >= q / 3)); edgeGlow('soft'); }, T(t)); t += 560;
    const ck = C.calc.length > 4 ? 2400 / C.calc.length / 560 : 1;   // 札が多いときは間をつめて、1攻撃 5秒くらいに（11/19 しょーくん「もっとゆっくり豪華に」）
    C.calc.forEach(c => { setTimeout(() => chipFly(e, c, H), T(t)); t += Math.round((c.src && c.src.length ? 600 : 560) * ck); });
    t += 300;
  }
  /* 3. ほかのカードへの効果：タイルの上に札がぽん・オーラが相手へ */
  C.outs.forEach(c => {
    setTimeout(() => { chipPop(slot, c); if (c.out != null) auraOut(e, e.out[c.out]); if (c.kone) setKone(c.kone); }, T(t));
    t += c.out != null ? 600 : 520;
  });
  /* 4. 数字がモンスターへバーン */
  if (e.dmg > 0) {
    /* ため（11/19）：数字がふるえて光が集まる・画面のふちが暗くなる → 金色に決まる → シェフが攻撃 */
    setTimeout(() => numTame(H), T(t)); t += 480;
    setTimeout(() => hubFin(H, e.dmg), T(t));
    const atk = e.dmg >= q * 0.6 ? 'special' : 'atk' + Math.min(3, d.star || 1), mega = e.dmg >= MEGA_HIT && !REDUCED, slow = mega ? MEGA_SLOW : 0;
    setTimeout(() => { heroPose(atk, 1100); atkKoe(atk); }, T(t + 120));   // 数字が飛ぶのに合わせて、ほのかが攻撃（掛け声も）
    t += 420;
    const tk = t;
    setTimeout(() => {
      if (!$('qfill')) return;   // 夜の画面からはなれたあと（11/19）
      hitFx(e.dmg, q, H.el, mega); if (!mega) sePlay('hit', { rate: Math.min(2, Math.pow(1.12, (H.mk || 0) + 1)) });
      setTimeout(() => { if ($('qfill')) { orbsToBelly(e.dmg, q); setTimeout(() => { if ($('qfill')) scoreTick(e.dmg, run, q); }, T(620)); } }, T(560 + slow));   // 味の光の玉が モンスターから おなかの帯へ（額縁の外）
    }, T(tk));
    t += 1700 + slow;   // 一撃 → 光の玉が おなかへ → 帯がのびる まで（1万をこえる一撃は スローとヒットストップのぶん長い）
  } else t += 620;
  return t;
}
/* おなかの帯を、この一撃のぶん進める（ちいさなキャンディも使う・味パワーの合計の札は 11/19 にやめた） */
function scoreTick(dmg, run, q) {
  if (!$('qfill')) return;
  $('qfill').style.width = Math.min(100, run / q * 100) + '%'; qGain(dmg, run, q); qCount(run - dmg, run);
  const over = run >= q && run - dmg < q * .5;   // オーバーラン：+1 の前から 一気に+3 をこえた（11/22 しょーくん「+3のゲージを破壊して、枠まで貫通する衝撃波・枠が少し壊れる」）
  for (const [f, c, k] of QMK) if (run >= q * f && run - dmg < q * f) { if (over && k === 'm3') continue; setTimeout(() => qCollect(k, c), T(over ? 300 : 650)); }   // 半分＝コイン+1・満タン＝+3（+の数が消えかけてから）
  if (over) setTimeout(() => qOverrun(), T(430));   // +3 は こわれたあとに もどる（battle-fx.js）
  if (run >= q && run - dmg < q) { setTimeout(() => replay(document.querySelector('.quota'), 'reach'), T(200)); setTimeout(() => heroPose('win', 900), T(900)); }
}
/* 計算の札のデータ：calc＝数字にすいこまれる札（v＝この札のあとの数字・p＝前の数字・src＝効果の元のマス・k＝マスに残った札の種類）
   outs＝ほかのカードへの効果（out＝e.out の番号）。c＝札の色（gold・ember・pink・mint・koge） */
const PART_K = l => l === '次の主役' ? 'next' : l === 'となり' ? 'nb' : l === 'スタート' ? 'rally' : l === 'いちばん' ? 'clead' : l === 'きらきら' ? 'shine' : l.startsWith('サイコー') ? 'best' : '';
const PART_C = l => l === '次の主役' || l === 'いちばん' || l === 'きらきら' ? 'pink' : l === 'となり' || l === '大きさ' || l === 'ひえひえ' || l === 'ひんやり' || l === 'となりの実' || l === '育った実' || l.startsWith('熟した実') || l.startsWith('びんの実') ? 'mint' : l === '焼き加減' || l === 'フィールド' || l.startsWith('サイコー') ? 'ember' : 'gold';
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
  const nb = out('nb'); if (nb != null) outs.push({ b: '+' + fmt(e.out[nb].v), s: '右2枚へ', c: 'mint', out: nb });
  if (e.heat) { const H = heatOf(); outs.push({ b: `${H.names[e.heat[0]]}→${H.names[e.heat[1]]}`, s: H.word, c: H.cool && e.heat[1] < e.heat[0] ? 'mint' : 'ember', out: out('heat') }); }
  if (e.sear) outs.push(e.sear.burnt ? { b: '焦げた', s: '右の生地', c: 'koge', out: out('sear') } : { b: `焼き+${e.sear.to - e.sear.from}`, s: '右の生地', c: 'ember', out: out('sear') });
  if (e.grow) outs.push({ b: e.grow.to >= SIZE_MAX ? '完成！' : `大きさ+${e.grow.to - e.grow.from}`, s: '右の大作', c: 'mint', out: out('grow') });
  if (e.next) outs.push({ b: '×' + fmtMul(e.next), s: '次の主役へ', c: 'pink', out: out('next') });
  if (e.clead) outs.push({ b: '×' + fmtMul(e.clead), s: d.cat === 'jam' ? 'ジャムぜんぶへ' : 'キャンディぜんぶへ', c: 'pink', out: out('clead') });
  if (e.water) outs.push({ b: e.water.to >= RIPE ? '熟した！' : '育った', s: '右の実', c: 'mint', out: out('water') });   // わかば（11/19）
  const sh = out('shine'); if (sh != null) outs.push({ b: '×' + fmtMul(e.out[sh].v), s: '右のジャムへ', c: 'pink', out: sh });
  if (e.fert) outs.push({ b: 'もう1段', s: '実ぜんぶ', c: 'mint' });
  if (e.basket) outs.push({ b: `実${e.basket}枚`, s: '次のショップ', c: 'mint' });
  if (e.link) outs.push({ b: `れんさ+${e.link}`, s: 'つなぎ', c: 'gold' });
  if (e.chainUp) outs.push({ b: `れんさ+${e.chainUp}`, s: 'つなげる', c: 'gold' });
  if (fxOn(d, 'again') && !e.again) outs.push({ b: 'もう1回', s: '右どなり', c: 'mint', out: out('again') });
  if (e.call) outs.push({ b: binNight() ? '熟した実' : 'フィールド', s: '次のショップ', c: 'mint' });
  if (e.kone) outs.push({ b: `こね+${e.kone[1] - e.kone[0]}`, s: 'こねた回数', c: 'gold', kone: e.kone[1] });
  return { calc, outs };
}
const fxOn = (d, k) => !!d.fx[k];
const cookStage = c => (c || 0) >= COOK_MAX ? 3 : (c || 0) >= 6 ? 2 : (c || 0) >= 3 ? 1 : 0;
const fmtMul = v => Math.round(v * 100) / 100;
/* ★3 のカットイン：ななめの金の帯に、ほのかが左から・カードが右から・名前を大きく。かかる時間（ms）を返す
   made＝★3ができたとき（まぜた・大作の完成・ジャム）だけ声（できたっ。・完成。・できたわぁ）。バトルの「スペシャル発動！」は false（11/21 しょーくん） */
function cutIn(cid, sub, made = true) {
  const d = cardDef(cid), h = heroPick('battle'), ms = T(1500);
  if (made) setTimeout(() => koeMore('star3'), T(260));
  const el = document.createElement('div');
  el.className = 'cutin'; el.style.setProperty('--cd', ms + 'ms');
  const band = ART['fx-cutin-' + chefArt()];   // 描き下ろしの帯（11/19・シェフごと：炎・水・若葉）
  el.innerHTML = `<i class="ci-flash"></i><div class="ci-band${band ? ' art' : ''}"${band ? ` style="background-image:url('${band}')"` : ''}><i class="ci-lines"></i><div class="ci-in">
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
  /* 字の「ガキーン」はやめて、絵と光で豪華に（11/20 しょーくん「文字を入れないかわりに演出を豪華に」）：
     集まる光（mf-gather）→ ぶつかる瞬間にシェフの衝撃の絵（fx-burst）・画面の外まで広がる衝撃波（mf-wave）・画面のふちの光・★3は光の柱と星のシャワー・できたカードのまわりを回る光 */
  const chef = chefArt(), burst = ART['fx-burst-' + chef];
  const gather = Array.from({ length: 12 }, (_, i) => { const a = Math.PI * 2 * i / 12, r = S * (1.5 + (i % 3) * .3); return `<i class="mf-gather" style="left:${cx + Math.cos(a) * r}px;top:${cy + Math.sin(a) * r}px;--gx:${-Math.cos(a) * r}px;--gy:${-Math.sin(a) * r}px;animation-delay:${(i % 4) * 40}ms"></i>`; }).join('');
  const orbit = Array.from({ length: star === 3 ? 6 : 4 }, (_, i) => `<i class="mf-orbit" style="--oa:${i * (360 / (star === 3 ? 6 : 4))}deg;--or:${RW * .78}px"></i>`).join('');
  const rain = star === 3 ? Array.from({ length: 16 }, (_, i) => `<i class="mf-star" style="left:${(i * 61 % 100)}%;animation-delay:${.15 + (i * 37 % 60) / 100}s;--sz:${10 + i * 7 % 12}px"></i>`).join('') : '';
  ov.innerHTML = `<i class="mf-dim"></i><i class="mf-lines"></i>${gather}<i class="mf-core"></i><i class="mf-burst"></i>${star === 3 ? '<i class="mf-pillar"></i>' : ''}<i class="mf-flash"></i><i class="mf-ring"></i><i class="mf-ring b"></i><i class="mf-wave"></i><i class="mf-wave b"></i>${tw}${rain}
    ${burst ? `<img class="mf-art" src="${burst}" alt="">` : ''}<div class="mf-orbits" style="top:${cy}px">${orbit}</div><p class="mf-name"><small>${'★'.repeat(star)}</small><span>${esc(d.short)}</span></p>`;
  document.body.appendChild(ov);
  const card = (cid, f, w, cls = '') => {
    const c = document.createElement('div');
    c.className = 'mf-card ' + cls; c.innerHTML = cls.includes('ghost') ? `<div class="mf-gh">${artImg(cid)}</div>` : cardTile(cid);   // 残像は絵だけ・飛ぶカードとできたカードも字のない調理台の形（11/20 しょーくん「文字は不要・軽く」）
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
    ov.classList.add('hit'); sePlay('star');   // ★アップ（11/19 H-034）
    if (typeof edgeGlow === 'function') edgeGlow(star === 3 ? 'big' : 'pulse');   // 画面のふちも光る（11/20・白い光は演出の板の mf-flash だけ）
    if (star === 3) setTimeout(() => sePlay('fire', { vol: .6 }), 60);
    // ゆれは演出の板（.mixfx.hit）で：夜の画面ぜんぶをゆらすと、ショップのカードが毎こま描きなおされて重かった（11/19 しょーくん「まぜまぜの瞬間が激重」）
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

/* 今夜のシェフの立ち絵：バトルは右向きのかまえ。ほのかの表情の絵は左向きなので左右反転して右向きにする（みなもの絵は右向き・正面なのでそのまま・11/19） */
const HEROES = {
  honoka: { battle: ['honoka-battle', false], joy: ['honoka-joy', true], surprise: ['honoka-surprise', true], oops: ['honoka-oops', true] },
  minamo: { battle: ['minamo-battle', false], joy: ['minamo-win', false], surprise: ['minamo-bikkuri', false], oops: ['minamo-shonbori', false] },
  wakaba: { battle: ['wakaba-battle', false], joy: ['wakaba-win', false], surprise: ['wakaba-odoroki', false], oops: ['wakaba-komari', false] },
};
const chefArt = () => chefNow().art || 'honoka';
function heroPick(k) { const H = HEROES[chefArt()] || HEROES.honoka, [n, flip] = H[k], a = chefArt(); return ART[n] ? { src: ART[n], flip, n } : { src: ART[a] || ART.honoka || big(CHEF_SPR[0], 8), flip: a === 'honoka' && !!ART.honoka, n: '' }; }
/* 足もと（11/19 しょーくん「描写されてるものの位置で足元を合わせて」・影も）：src/data/feet.js（tools/feet.py）の表で、
   どのポーズでも描かれた足が同じ高さに立つように下げる（--fp）。影 .chef-sh は足もとのまんなか（--fx）に。#stage に置いてシェフと影の両方が使う */
function heroVars(n, flip) { const f = FEET[n] || [0, .45, .8, .23]; return `--fp:${f[0]};--fx:${flip ? 1 - f[1] : f[1]};--ca:${f[2]};--sw:${f[3]}`; }
function heroSetVars(n, flip) { const st = $('stage'); if (st) for (const kv of heroVars(n, flip).split(';')) { const [k, v] = kv.split(':'); st.style.setProperty(k, v); } }
function heroImg(k) { const h = heroPick(k), C = chefNow(); return `<img class="chef${ART[chefArt()] ? ' hi' : ''}${h.flip ? ' flip' : ''}" id="chef" data-chef="${chefArt()}" src="${h.src}" alt="${esc(C.job + ' ' + C.name)}">`; }
/* 絵と足もと（--fp・影）は いっしょに変える（11/21 しょーくん「新しい立ち絵の影と脚の位置関係がおかしい」）：
   src を変えても、新しい絵がほどけるまで前の絵が出たままなのに --fp だけ先に変わり、足が床にしずむ・浮く一瞬があった
   （追加の攻撃ポーズは足の下のすき間が大きい＝minamo-atk2 は 0.17）。新しい絵を先に decode してから、絵と足もとを同じときに変える */
let heroWant = '';
function heroShow(el, h, then) {
  heroWant = h.src;
  const go = () => {
    if (heroWant !== h.src || !el.isConnected) return;   // あとから別のポーズになった・描きなおした
    if (el.getAttribute('src') !== h.src) el.src = h.src;
    el.classList.toggle('flip', h.flip); heroSetVars(h.n, h.flip); if (then) then();
  };
  if (el.getAttribute('src') === h.src) return go();
  const im = new Image(); im.src = h.src;
  (im.decode ? im.decode() : Promise.resolve()).then(go, go);
}
let heroT = 0;
function heroFor(k, ms) {
  const el = $('chef'); if (!el) return;
  const set = kk => heroShow(el, heroPick(kk), () => { delete el.dataset.pose; const st = $('stage'); if (st) delete st.dataset.pose; });
  set(k); clearTimeout(heroT); heroT = setTimeout(() => set('battle'), ms);
}
/* ほのかの戦闘ポーズ（11/18 しょーくん「チャージや攻撃必殺技とか、いつまで見てても飽きない戦闘シーンにしたい」）
   絵（art-irai の honoka-battle2・3）が来るまでは、[絵の名前, 代わりの HERO]。動きは CSS の .chef[data-pose]（translate・scale・rotate の transition） */
const POSE = {
  stance: ['honoka-battle', 'battle'], charge: ['honoka-charge', 'battle'], atk1: ['honoka-atk1', 'battle'], atk2: ['honoka-atk2', 'battle'], atk3: ['honoka-atk3', 'battle'],
  special: ['honoka-special', 'battle'], win: ['honoka-win', 'joy'], support: ['honoka-support', 'battle'], heatup: ['honoka-heatup', 'battle'],
  heatdown: ['honoka-heatdown', 'battle'], knead: ['honoka-knead', 'battle'], field: ['honoka-field', 'battle'], burnt: ['honoka-burnt', 'oops'],
};
/* みなもの戦闘ポーズは6まい（11/19）：攻撃は★のちがいなく1まい・温度の上げ下げと台に手をかざすのは支援のポーズ */
const POSE_MINAMO = {
  stance: 'minamo-battle', charge: 'minamo-charge', atk1: 'minamo-atk', atk2: 'minamo-atk2', atk3: 'minamo-atk3', special: 'minamo-special', win: 'minamo-win',
  support: 'minamo-support', heatup: 'minamo-heatup', heatdown: 'minamo-heatdown', knead: 'minamo-support', field: 'minamo-support', burnt: 'minamo-shonbori',
};
/* わかばも6まい（11/19・みなもと同じ形）。焦げはないので、こまり顔 */
const POSE_WAKABA = Object.fromEntries(Object.entries(POSE_MINAMO).map(([k, v]) => [k, k === 'burnt' ? 'wakaba-komari' : v.replace('minamo', 'wakaba')]));
Object.assign(POSE_WAKABA, { heatup: 'wakaba-support', heatdown: 'wakaba-support', field: 'wakaba-grow' });
/* 追加のポーズ（11/21 しょーくん「既存戦闘シーンのバリエーション増加」）の絵がまだないときの かわり */
const POSE_ALT = { 'minamo-atk2': 'minamo-atk', 'minamo-atk3': 'minamo-atk', 'minamo-heatup': 'minamo-support', 'minamo-heatdown': 'minamo-support', 'wakaba-atk2': 'wakaba-atk', 'wakaba-atk3': 'wakaba-atk', 'wakaba-grow': 'wakaba-support', 'wakaba-jar': 'wakaba-support' };
const poseKey = k => ART[k] ? k : POSE_ALT[k] || k;
const POSE_SIX = { minamo: POSE_MINAMO, wakaba: POSE_WAKABA };
let poseT = 0;
function heroPose(p, ms) {
  const el = $('chef'); if (!el || !POSE[p]) return;
  const six = POSE_SIX[chefArt()], sk = six && poseKey(p === 'support' && chefArt() === 'wakaba' && binNight() ? 'wakaba-jar' : six[p]), mi = sk && ART[sk];   // 飴ジャムの夜の支援は びんに入れるポーズ
  const [n, alt] = POSE[p], h = mi ? { src: mi, flip: false, n: sk } : chefArt() === 'honoka' && ART[n] ? { src: ART[n], flip: false, n } : heroPick(alt);
  heroShow(el, h, () => {
    el.dataset.pose = p;
    const st = $('stage'); if (st) st.dataset.pose = p;   // 影と足もとの光は #stage の data-pose で（:has を使わない＝軽い・11/19）
  });
  clearTimeout(poseT); if (ms) poseT = setTimeout(() => heroPose('stance'), ms);
}
/* おなかの帯：1枚ずつ味パワーがたまる（+の数字が帯の先からぽん・帯が光る） */
/* おなかゲージ（11/20 ゼンゼロの形）：真ちゅうの帯・左はしの丸の下に いまの味の力の合計（さかいの数と同じ字）・半分（+1）と満タン（+3）にコインの印とその数。
   とどいたらコインがとれて チェックに変わる。舞台の中の、ラウンドとビルドのゲージの下（11/20 しょーくん「舞台を縦にのばしたい」） */
const QMK = [[.5, 1, 'm1'], [1, 3, 'm3']];
function quotaHTML(q, run) {
  const mk = QMK.map(([f, c, k]) => `<b class="qmk ${k}${run >= q * f ? ' qok' : ''}" style="left:${f * 100}%"><i class="qc"><em>+${c}</em></i><small>${fmt(Math.ceil(q * f))}</small></b>`).join('');
  return `<div class="quota"><div class="qwrap"><div class="qbar"><i id="qfill" style="width:${Math.min(100, run / q * 100)}%"></i></div><div class="qmks"><b class="qmk q0" style="left:0%"><i class="qc qd"></i><small id="qtext">${fmt(run)}</small></b>${mk}</div></div></div>`;
}
/* 左の数：前の数から いまの数へ かぞえ上げる（字だけ・はばは きまっている） */
function qCount(from, to) {
  const el = $('qtext'); if (!el) return;
  const t0 = performance.now(), ms = REDUCED ? 0 : T(420);
  replay(el.parentNode, 'bump');
  const step = now => { const k = ms ? Math.min(1, (now - t0) / ms) : 1; el.textContent = fmt(from + (to - from) * (1 - (1 - k) * (1 - k))); if (k < 1) requestAnimationFrame(step); };
  requestAnimationFrame(step);
}
/* とどいた：コインがはねて 上へとんで消え、印は チェックに */
function qCollect(k, c) {
  const m = document.querySelector('.quota .qmk.' + k); if (!m || m.classList.contains('qok')) return;
  const fly = document.createElement('i'); fly.className = 'qfly'; fly.innerHTML = `<em>コイン+${c}</em>`; m.appendChild(fly);
  m.classList.add('qok'); replay(m, 'qpop'); sePlay('coin', { vol: .8 }); sePlay('star', { vol: .45 });
  setTimeout(() => fly.remove(), T(1300));
}
function qGain(dmg, run, q) {
  const qw = document.querySelector('.quota .qwrap'); if (!qw || !dmg) return;
  const g = document.createElement('b'); g.className = 'qgain'; g.textContent = '+' + fmt(dmg);
  const bar = qw.querySelector('.qbar'); g.style.left = Math.round(bar.offsetLeft + 9 + (bar.offsetWidth - 18) * Math.min(1, run / q)) + 'px';
  qw.appendChild(g); replay(qw.parentNode, 'gain'); setTimeout(() => g.remove(), T(1100));
}
const MON_URL = {};
/* 夜の舞台の背景：シェフごと（bg-night-minamo・bg-night-wakaba・11/21 しょーくん）。絵がなければ ほのかの bg-night */
const NBG = () => ART['bg-night-' + chefArt()] || ART['bg-night'];
const monURL = id => MON_URL[id] || (MON_URL[id] = ART['mon-' + id] || ART[(MONSTERS.find(m => m.id === id) || {}).alt] || big(MON_SPR[id] || MON_SPR.slime, 8));
const monIsArt = id => !!ART['mon-' + id];
function heatCells() { return Array.from({ length: HEAT_MAX }, () => '<i></i>').join(''); }

/* ---------- タップで大きく見る画面（カード＋説明＋ボタン）とラウンドの結果 ---------- */
function viewerHTML() {
  if (N.stage === 'roundEnd') {
    const L = N.last, gain = [];
    const tier = L.tier != null ? L.tier : L.ok ? 2 : 0;
    if (TIER_COIN[tier]) gain.push(`コイン+${TIER_COIN[tier]}`);
    return `<div class="viewer soft"><div class="vbox result ${['', 'half', 'ok'][tier]}" data-act="noop">
      <p class="r-round">ラウンド ${L.round}</p><p class="r-num">${fmt(L.total)}</p><p class="r-q">おなか ${fmt(L.q)}</p>
      <p class="r-msg">${['まだ ぺこぺこ…', 'はんぶん まんぞく', 'まんぞく！'][tier]}</p>${gain.length ? `<p class="r-gain">${gain.join('　')}</p>` : ''}
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
      d.cat === 'field' ? 'ドラッグで「場」へ' : '左の空きマスへ・ドラッグで好きなマスへ・かさねて まぜる');   // 11/21 1行に（小さい画面で2行めが下のボタンにかかっていた）
  }
  if (s.where === 'field') return N.field ? (fixedField() ? box('b:' + N.field, null, '', `くだものをドラッグで入れる（入れた段のまま）・あと${Math.max(0, BIN_MAX - binCount())}つでジャム`)
    : box('b:' + N.field, null, sellBtn(), '新しいのを買うと入れかわる')) : '';
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
  if (N.stage === 'pick') return N.pickChef ? '<button class="bake" data-act="pickGo">これにする！</button>' : '<button class="bake" data-act="pickNext">つぎへ</button>';
  if (fighting) return `<button class="pill sub spd${bSpeed > 1 ? ' on' : ''}" data-act="spd">${spdLabel()}</button>`;   // バトル中は、はやおくり
  return `<button class="bake" data-act="bake" ${busy || N.stage !== 'shop' ? 'disabled' : ''}>おもてなし！</button>`;
}
/* ショップ：準備のあいだ、舞台にかぶせる（バトルのときはとじる）。3まい（1ラウンド目は無料の5まい）・コイン・有料の入れかえ・うる
   カードはドラッグで調理台へ（かさねると買いながら まぜる）。調理台のカードをショップへ持ってくると うる */
function shopHTML() {
  const r1 = N.round === 1, list = N.shop;
  const head = r1 ? `<span class="sh-ttl sh-rd sh-free">無料 <b>${N.picks}</b>まい</span>`   // 11/20 しょーくん「入れかえと同じ枠に・無料3枚みたいなカウント」
    : `<span class="sh-coin" aria-label="コイン ${N.coins}"><i></i><b>${N.coins}</b></span><button class="pill sub sh-roll" data-act="reroll" ${N.coins < REROLL ? 'disabled' : ''}>入れかえ <small><i class="cn"></i>${REROLL}</small></button>`;   // 11/18「2けたで改行される」→ コインは絵と数字だけ
  const deal = dealAnim && !REDUCED; dealAnim = false;   // 新しいラウンドだけ、ショップが下りてカードが配られる
  return `<div class="shopov${list.length > 3 ? ' many' : ''}${deal ? ' deal' : ''}" data-drop data-w="sell" data-i="0">
    <div class="sh-top"><span class="sh-l"><span class="sh-ttl sh-rd">ラウンド <b>${Math.min(N.round, ROUNDS)}</b>/${ROUNDS}</span>${koneBadge()}${jamBadge()}</span><span class="sh-r">${head}</span></div>
    <div class="sh-cards">${list.map((cid, i) => cid
      ? `<button class="shcard${!r1 && N.coins < cardDef(cid).cost ? ' poor' : ''}" style="--k:${i}" data-act="card" data-drag data-drop data-w="shop" data-i="${i}">${cardMini(cid, { tall: list.length > 3 ? 38 : 31 })}${r1 ? '' : `<span class="sh-price${N.coins < cardDef(cid).cost ? ' ng' : ''}"><i></i>${cardDef(cid).cost}</span>`}${mixesWithBoard(cid) ? '<i class="mixmark">まぜ</i>' : ''}</button>`
      : '<span class="shcard sold"></span>').map((h, i) => i === 3 ? '<i class="sh-br"></i>' + h : h).join('')}</div>
    <div class="sh-sell"><b>はなすと うる</b><span id="sellv"></span></div></div>`;
}

/* ショップのカードの文が紙に入らないとき（スマホの字は 8px より小さくならない・11/20 しょーくんの写真）、うしろの文から紙にかくす。
   かくした文は、タップで大きく見ると出る。はかるのは描いたあと1回だけ */
let shopRO = null;
function shopFit() {
  const sc = document.querySelector('.shopov .sh-cards'); if (!sc) return;
  const fit = () => {
    /* 名前と【属性】：アプリの中では字が 8px より小さくならないので、小さなカードでは はみ出す（11/21 レイアウトの総デバッグ）。
       はみ出すときだけ、見た目を transform で小さくする（transform は 8px のきまりに かからない・場所はそのまま）。名前は8文字まで ぜんぶ出す（…にしない） */
    for (const c of sc.querySelectorAll('.pc.mini')) {
      const a = c.querySelector('.pc-attr'), t = c.querySelector('.pc-text');
      if (a && t) { a.style.transform = ''; const room = t.offsetLeft + t.offsetWidth - a.offsetLeft - 1, w = a.offsetWidth; if (room > 0 && w > room + .5) { a.style.transformOrigin = 'left center'; a.style.transform = `scale(${(room / w).toFixed(3)})`; } }
      const n = c.querySelector('.pc-name'), sp = n && n.querySelector('span');
      if (sp) {
        sp.style.cssText = ''; const cs = getComputedStyle(n), room = n.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
        sp.style.cssText = 'flex:none;max-width:none;overflow:visible;text-overflow:clip'; const w = sp.offsetWidth;
        if (room > 0 && w > room + .5) { sp.style.transformOrigin = cs.justifyContent === 'flex-start' ? 'left center' : 'center'; sp.style.transform = `scale(${(room / w).toFixed(3)})`; } else sp.style.cssText = '';
      }
    }
    for (const t of sc.querySelectorAll('.pc-text')) {
      const sp = t.firstElementChild, ss = [...t.querySelectorAll('.sn')]; if (!sp) continue;
      ss.forEach(e => e.classList.remove('cut'));
      for (let k = ss.length - 1; k > 0 && sp.offsetHeight > t.clientHeight + 1; k--) ss[k].classList.add('cut');
      const f = ss[0]; if (!f) continue;   // 1つの文でも入らない小さな画面は、入る行まで
      f.style.maxHeight = ''; f.classList.remove('clamp');
      if (sp.offsetHeight > t.clientHeight + 1) { const cs = getComputedStyle(f), lh = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.2; f.classList.add('clamp'); f.style.maxHeight = Math.max(1, Math.floor(t.clientHeight / lh)) * lh + 'px'; }   // 入る行までで切る（ことばが2行に折れていても行で数える）
    }
  };
  fit();
  if (shopRO) shopRO.disconnect();   // ヒントが列の下をあけたとき・画面の大きさが変わったときも はかりなおす
  if (window.ResizeObserver) { shopRO = new ResizeObserver(fit); shopRO.observe(sc); }
  if (document.fonts && document.fonts.status !== 'loaded') document.fonts.ready.then(() => sc.isConnected && fit());   // 字の読みこみのあとも はかりなおす
}

/* 夕方のシェフ・ビルドえらび（11/18 しょーくん：カードを並べる・毎晩・前の夜のビルドがえらばれている）。カードはシェフの絵・ビルドの名前・特性・代表のカード3まい・ひとこと */
/* ビルドの名前の折り目：かたかなのかたまりの前後だけ（11/19 点検：「くだものケ／ーキ」「火力クッキ／ー」と ことばのとちゅうで折れていた。CSS は keep-all） */
const pkBr = nm => (String(nm).match(/[ァ-ヶー]+|[^ァ-ヶー]+/g) || [String(nm)]).map(esc).join('<wbr>').replace(/の(?!<wbr>|$)/g, 'の<wbr>');   // 「の」のあとでも折れる（11/21：大作の飴細工が「飴細／工」で折れていた）
/* 11/22 しょーくん「後々キャラもビルドも追加していく予定だから、キャラ選択→ビルド選択に」「レシピ帳みたいなレイアウトで横長・縦に列挙・左にキャラの姿・ビルドの特徴やキーカード3枚」「1ページに3〜4人・3〜4ビルド」：
   N.pickChef がないとき＝シェフの一覧（さわると そのシェフのビルドへ）・あるとき＝そのシェフのビルドの一覧（さわって えらぶ → これにする！）。
   シェフが1人だけの夜は、はじめからビルドの一覧。行は紙の行（.ms-good と同じ ui-strip の皮）。多いときはページ（PK_PER こずつ） */
const pkPer = () => (innerHeight >= 740 ? 4 : 3);
const pkChefs = () => [...new Set(openBuilds().map(id => BUILDS[id].chef))];
function pkPage(items) {
  const per = pkPer(), pages = Math.max(1, Math.ceil(items.length / per)), pg = Math.min(pages - 1, Math.max(0, N.pkPage || 0));
  return { list: items.slice(pg * per, pg * per + per), pager: pages > 1 ? `<div class="pk-pager"><button class="pill sub" data-act="pkPage" data-d="-1" ${pg ? '' : 'disabled'} aria-label="まえのページ">◀</button><span>${pg + 1} / ${pages}</span><button class="pill sub" data-act="pkPage" data-d="1" ${pg < pages - 1 ? '' : 'disabled'} aria-label="つぎのページ">▶</button></div>` : '' };
}
function pickHTML() {
  const chefs = pkChefs(), cur = BUILDS[N.build] ? BUILDS[N.build].chef : chefs[0], prev = BUILDS[S.build] ? BUILDS[S.build].chef : '';   // cur＝いま えらんでいる・prev＝前の夜のシェフ
  const trial = TRIAL ? '<p class="pk-trial">ためしのページ：本番では、こね生地は⑨のあと・みなもと わかばは仲間になった次の夜から</p>' : '';
  if (!N.pickChef) {
    const { list, pager } = pkPage(chefs);
    const rows = list.map(c => {
      const C = CHEFS[c], bs = openBuilds().filter(id => BUILDS[id].chef === c), pic = ART[C.art] || '';
      return `<button class="pk-row pkc${c === cur ? ' on' : ''}" data-act="pickC" data-id="${c}">
        <span class="pk-fig">${pic ? `<img src="${pic}" alt="">` : ''}</span>
        <span class="pk-body"><b class="pk-name">${esc(C.name)}<small>${esc(C.job)}</small></b>
        <span class="pk-tags">${bs.map(id => `<i>${pkBr(BUILDS[id].name)}</i>`).join('')}</span></span>
        <i class="pk-go" aria-hidden="true"></i>${c === prev ? '<i class="pk-on">前の夜</i>' : ''}</button>`;
    }).join('');
    return `<div class="pickov"><p class="pk-ttl">今夜の シェフ</p><div class="pk-rows">${rows}</div>${pager}${trial}</div>`;
  }
  const C = CHEFS[N.pickChef], { list, pager } = pkPage(openBuilds().filter(id => BUILDS[id].chef === N.pickChef));
  const rows = list.map(id => {
    const B = BUILDS[id], on = id === N.build, pic = ART[B.pic] || ART[C.art] || '';
    return `<button class="pk-row${on ? ' on' : ''}" data-act="pickB" data-id="${id}" aria-pressed="${on}">
      <span class="pk-fig">${pic ? `<img src="${pic}" alt="">` : ''}</span>
      <span class="pk-body"><b class="pk-name">${pkBr(B.name)}</b><span class="pk-sub"><i>特性 ${esc(B.trait || C.trait)}</i></span>
      <span class="pk-text">${esc(B.text)}</span>
      <span class="pk-cards">${B.show.map(cid => `<span class="pk-mini">${cardMini(cid)}</span>`).join('')}</span></span>${on ? '<i class="pk-on">えらんでいる</i>' : ''}</button>`;
  }).join('');
  const back = chefs.length > 1 ? '<button class="pill sub pk-back" data-act="pickBack" aria-label="シェフをえらびなおす">◀ シェフ</button>' : '';
  return `<div class="pickov"><div class="pk-head">${back}<p class="pk-ttl">${esc(C.name)}の ビルド</p></div><div class="pk-rows">${rows}</div>${pager}${trial}</div>`;
}

/* ---------- 夜の画面 ---------- */
function renderNight() {
  if (!nightOk(S.night)) return startNight();   // 前の形のセーブは、その夜をはじめから
  N = S.night;
  document.body.dataset.chef = chefArt();   // シェフごとの見た目（紋章・一撃の色）。fx の層は body の下なので body につける（11/19）
  document.body.dataset.candy = candyNight() ? '1' : '';   // ちいさなキャンディの夜は 氷ではなく 飴の演出（11/22 しょーくん「冷気関係なくなったから 氷のエフェクトじゃなくて」）
  const mon = MONSTERS[N.mon];   // 上の札はラウンドだけ（場の名前は 11/19 にやめた・しょーくん「ビルド表記もいらない。ウェーブだけでOK」）
  let body = '';
  const rec = S.today, after = N.stage === 'end' || N.stage === 'thanks', happy = after && rec.mood >= 2;
  if (N.stage === 'end') {
    const R = MOODS[rec.mood] || MOODS[1];
    body = `<div class="panel end m${rec.mood}${happy ? ' win' : ''}"><h2>${rec.mood >= 3 ? 'おなかいっぱい！' : R.name + '！'}</h2>
        <p class="bignum">${fmt(rec.score)}</p><p>${esc(mon.name)}が おなかいっぱいになるのは ${fmt(rec.belly)}</p>
        <p class="end-mood"><b>${R.name}</b>のお礼</p>
        <div class="gotrow"><div class="got"><img src="${matURL(mon.drop)}" alt=""><span>${esc(MATS[mon.drop].short)} ×${R.mats}</span></div><div class="got coin"><span><i class="cn"></i>コイン ${fmt(R.coins)}円</span></div></div>
      </div><button class="big" data-act="toResult">1日のまとめへ</button>`;
  } else {
    const shop = N.stage === 'shop';
    const H = heatOf();
    const ca = chefArt();
    body = `<div class="tiles${N.stage === 'pick' ? ' pk-hide' : ''}" data-chef="${ca}" data-z="${ca === 'honoka' ? N.heat : 0}" data-t="${ca === 'minamo' ? (candyNight() ? 'c' : N.heat) : 0}">${ca === 'minamo' ? tempHTML() : ca === 'wakaba' ? vineHTML() : boardFireHTML()}<button class="tslot fslot${fixedField() ? ' bin' : ''}" data-act="card" ${shop && N.field && !fixedField() ? 'data-drag' : ''} data-drop data-w="field" data-i="0" aria-label="フィールド"><i class="ord">場</i>${N.field ? cardTile('b:' + N.field) : ''}${binHTML()}</button>${N.board.map((c, i) =>
        `<button class="tslot" data-act="card" ${shop && c ? 'data-drag' : ''} data-drop data-w="board" data-i="${i}" aria-label="調理台${i + 1}"><i class="ord">${i + 1}</i>${c ? cardTile(c.cid, { born: c.born, cook: c.cook, ice: c.ice, plus: c.plus }) : ''}${c && shop && mixesWithBoard(c.cid, i) ? '<i class="mx-dot">+</i>' : ''}</button>`).join('')}</div>${traitRowHTML()}
      <div class="bar">${barHTML()}</div>
      ${viewerHTML()}`;
  }
  const q = quota(Math.min(N.round, ROUNDS), S.day), lastRun = N.stage === 'roundEnd' ? N.last.total : 0;
  const hk = after ? (happy ? 'joy' : 'oops') : 'battle', hp = heroPick(hk);
  $('screen').innerHTML = `<section class="night fit${busy ? ' busy' : ''}" data-chef="${chefArt()}">
    <div class="stage${NBG() ? ' hasbg' : ''}${N.stage === 'shop' && !fighting ? ' st-shop' : ''}${N.stage === 'pick' ? ' st-pick' : ''}" id="stage" data-z="0" style="${NBG() ? `--bgimg:url('${NBG()}');` : ''}${heroVars(hp.n, hp.flip)}">${NBG() ? '' : '<i class="st-lamp"></i><i class="st-win"></i><i class="st-shelf"></i><i class="st-floor"></i>'}<i class="glow"></i>
      ${auraBackHTML()}<i class="chef-sh"></i>${heroImg(hk)}${auraFrontHTML()}
      <img class="mon${monIsArt(mon.id) ? ' hi' : ''}${N.stage === 'end' ? ' flee' : ''}" id="mon" data-mid="${mon.id}" data-idle="${monIdle(mon.id)}" src="${((after && happy) || (N.stage === 'roundEnd' && N.last && N.last.ok)) && ART[`mon-${mon.id}-happy`] || ((after && !happy) || (N.stage === 'roundEnd' && N.last && !N.last.tier)) && ART[`mon-${mon.id}-sad`] || monURL(mon.id)}" alt="${esc(mon.name)}">${monIsArt(mon.id) ? '<i class="mon-sh"></i>' : ''}
      ${chefArt() === 'minamo' ? aquaHTML() : embersHTML()}<i class="smoke" id="smoke"></i>${decoHTML(after ? (happy ? 'win' : 'battle') : (N.stage === 'shop' || N.stage === 'arrive' || N.stage === 'pick') && !fighting ? 'shop' : 'battle')}<div id="floats"></div>
      <div class="ov-top"><span>ラウンド <b>${Math.min(N.round, ROUNDS)}</b>/${ROUNDS}</span></div>
      <div class="ov-heat${heatOf().off || heatOf().none ? ' only' : ''}">${heatOf().off || heatOf().none ? '' : `<span class="heat-label" id="heatLabel"></span><div class="heat-bar" id="heatBar">${heatCells()}</div>`}${koneBadge()}${chainBadge()}${jamBadge()}</div>
      ${quotaHTML(q, lastRun)}
      ${N.stage === 'shop' && !fighting ? shopHTML() : ''}${N.stage === 'pick' ? pickHTML() : ''}</div>
    ${body}</section>`;
  setHeat(N.heat);
  for (const c of N.board) if (c) delete c.born;
  /* ラウンドの結果：合計をかぞえ上げてから、たっせいのハンコ */
  if (resultAnim && N.stage === 'roundEnd') { resultAnim = false; const r = document.querySelector('.r-num'); if (r) countUp(r, 0, N.last.total, T(700)); }
  /* 来店とお礼の会話（night.js の nightTalk） */
  if ((N.stage === 'arrive' || N.stage === 'thanks') && !talking()) setTimeout(nightTalk, N.stage === 'thanks' ? 700 : 300);
  if (N.stage === 'shop' && !fighting) shopFit();
  tipSync();   // 夜のヒント（tips.js）
  thinkArm();   // 考えている声
}
