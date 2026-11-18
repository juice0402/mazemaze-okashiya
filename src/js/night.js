/* ==== 夜：来店した食材モンスターを9ラウンドでおもてなしする（ゼンゼロのオバケ屋敷の形が土台・仕様は claude/okashi-battle-spec.md） ====
   流れ（11/18 H-001）：来店の会話（stage arrive）→ ラウンド1〜9 → お礼の会話（thanks）→ 結果（end）→ 1日のまとめ。味パワーの合計で満足が決まり、素材とコインをくれる
   1ラウンド：ショップ（舞台にかぶせる。毎回3枚・有料の入れかえ・コインで買う・うる）＋ 調理台で並べる・まぜる → バトル（ショップがとじて舞台でバトル）
   買ったカードは調理台へ（手札はない・11/18）。調理台がいっぱいなら、まぜるか先にうる。お金とコインはショップの中だけに出す（11/17 しょーくん「ゼンゼロのようにショップを挟む」）
   バトル：はじめに「焼き」（フィールドがあれば、鉄板の生地がいっせいに火力のぶん焼ける）→ 左から順に発動
   生地は場に残り、ラウンドをまたいで焼けていく（9でサイコー・サイコーのまま焼かれると焦げる）
   鉄板の火力（N.heat 1〜4）はラウンドをまたいで残る。火力カードが発動すると変わり、次のラウンドの焼きに効く
   フィールドも仕入れから。買うと調理台の左の「場」に入る（1つだけ・置きかえOK）。ラウンド1だけ、5まいから3まい えらんで無料
   調理台5マス。画面は night-ui.js */
const SLOTS = 5, ROUND1_SHOW = 5, ROUND1_PICKS = 3, SHOP_N = 3, INCOME = 5, QUOTA_BONUS = 2, REROLL = 1;
const SELL = [0, 1, 3, 8];      // うると戻るコイン（★ごと）
const START_HEAT = 2;           // 夜のはじめの鉄板（中火）
/* バトルの速さ（11/18 しょーくん「一瞬すぎて何が起きているかわからない」）：ふつうはゆっくり見せて、はやおくり ×2 も選べる（この端末に覚える） */
let bSpeed = (() => { try { return +localStorage.getItem('mazemaze-okashiya-spd') === 2 ? 2 : 1; } catch (e) { return 1; } })();
const T = ms => REDUCED ? Math.min(ms, 200) : ms / bSpeed;
function toggleSpd(el) {
  bSpeed = bSpeed === 1 ? 2 : 1;
  try { localStorage.setItem('mazemaze-okashiya-spd', bSpeed); } catch (e) { /* なくてよい */ }
  if (el) { el.innerHTML = spdLabel(); el.classList.toggle('on', bSpeed > 1); }
}
const spdLabel = () => bSpeed > 1 ? 'はやおくり中 <small>×2</small>' : 'はやおくり <small>×2</small>';
let dealAnim = true, resultAnim = false;   // ショップのカードを配る・ラウンドの結果をかぞえる（その1回だけ）
let N = null;          // S.night（夜のあいだの状態）
let busy = false;      // バトルとまぜる演出の間は操作しない
let fighting = false;  // バトルの間（ショップをとじて、舞台でバトルを見せる）

function startNight() {
  S.phase = 'night';
  if (!S.today) S.today = newDay(S.day);
  const mon = nightMonster(), id = MONSTERS[mon].id;
  Object.assign(S.today, { mon: id, newMon: !S.seenMon.includes(id), belly: nightHP(S.day) });
  const open = openBuilds();
  S.night = {
    mon, field: null, heat: START_HEAT, call: false, stage: open.length > 1 ? 'pick' : 'arrive', round: 1, coins: 0, picks: ROUND1_PICKS,
    board: Array(SLOTS).fill(null), shop: [], score: 0, met: 0, burnt: 0,
    sel: null, view: false, last: null,
    build: open.includes(S.build) ? S.build : open[0], kone: 0,   // build＝今夜のビルド（11/18）・kone＝この夜にこねた回数（こね生地）
  };
  N = S.night; N.heat = heatOf().start; rollShop(); dealAnim = true;   // 夜のはじめ：ほのかは中火・みなもは あたたか（11/19）
  save(); render();
}
/* 夕方のシェフ・ビルドえらび（11/18 しょーくん：毎晩・前の夜のビルドがえらばれている。使えるのが1つのうちは出さない） */
function pickBuild(id) { if (N.stage !== 'pick' || !BUILDS[id] || !openBuilds().includes(id)) return; N.build = id; N.heat = heatOf().start; save(); renderNight(); }
function pickGo() {
  if (N.stage !== 'pick') return;
  S.build = N.build; N.heat = heatOf().start; N.stage = 'arrive'; rollShop(); dealAnim = true;
  save(); renderNight();
}
const curBuild = () => BUILDS[(N && N.build) || 'cookie'];
/* 来店とお礼の会話（会話の部品 talk.js・文は story.js）。会話がない日はすぐ次へ */
function nightTalk() {
  if (talking()) return;
  if (N.stage === 'arrive') talk(STORY.evening(S.today), () => { N.stage = 'shop'; dealAnim = true; save(); renderNight(); });
  else if (N.stage === 'thanks') talk(STORY.thanks(S.today), () => { N.stage = 'end'; save(); renderNight(); });
}
/* 前の形のセーブ（6マス・前のカード）は、その夜をはじめからにする */
function nightOk(n) {
  try {
    if (!n || n.board.length !== SLOTS || !Number.isFinite(n.heat)) return false;
    for (const c of [...n.board, ...n.shop, ...(n.held || [])]) if (c) cardDef(typeof c === 'string' ? c : c.cid);
    if (n.held) { for (const c of n.held) { const k = n.board.indexOf(null); if (k >= 0) n.board[k] = c; } delete n.held; }   // 11/18 手札をなくした：前のセーブの手札は調理台の空きへ
    if (n.field && !FIELDS[n.field]) return false;
    if (!BUILDS[n.build]) n.build = 'cookie';
    if (!Number.isFinite(n.kone)) n.kone = 0;
    return true;
  } catch (e) { return false; }
}

/* ---------- 仕入れ ---------- */
function poolList() {
  const B = curBuild(), C = CHEFS[B.chef], L = [];
  for (const cid of B.doughs) L.push([cid, 3]);
  for (const cid of C.common) L.push([cid, 2]);
  for (const id of B.fields) if (id !== N.field) L.push(['b:' + id, 1.5]);
  const dr = MONSTERS[N.mon].drop;
  if ((N.round >= 3 || N.met > 0) && MATS[dr].fx) L.push(['m:' + dr, 2]);   // モンスターのふしぎな素材（レアの素材は夜のカードにしない）
  return L;
}
function draw1(L) {
  let tot = 0; for (const [, w] of L) tot += w;
  let x = Math.random() * tot;
  for (const [c, w] of L) if ((x -= w) < 0) return c;
  return L[0][0];
}
function rollShop() {
  const B = curBuild(), L = poolList(), out = [];
  if (N.call) {   // よびりん：フィールドをかならず1枚
    const f = B.fields.filter(id => id !== N.field);
    if (f.length) out.push('b:' + pick(f));
    N.call = false;
  }
  if (N.round === 1) {
    while (out.filter(c => B.doughs.includes(c)).length < 2) out.push(pick(B.doughs));
  }
  while (out.length < (N.round === 1 ? ROUND1_SHOW : SHOP_N)) {
    let c = draw1(L);
    for (let t = 0; t < 9 && c[0] === 'b' && out.includes(c); t++) c = draw1(L);   // 同じフィールドは1回に1枚まで
    out.push(c);
  }
  N.shop = shuffle(out);
}
/* 大きく見る画面をとじる */
function unsel() { N.sel = null; N.view = false; }
function place(cid, at) {
  const j = at != null && !N.board[at] ? at : N.board.indexOf(null); if (j < 0) return null;
  N.board[j] = asCard(cid); return { where: 'board', i: j };
}
/* 1ラウンド目は無料の枠・2ラウンド目からはコイン。n まい・cost コインはらえないわけ（はらえるなら空） */
function payNg(n, cost) {
  if (!n) return '';
  if (N.round === 1) return N.picks >= n ? '' : N.picks ? `無料はあと${N.picks}まい` : '3まい えらんだよ。おもてなししてみよう';
  return N.coins >= cost ? '' : 'コインがたりない';
}
function pay(n, cost) { if (!n) return; if (N.round === 1) N.picks -= n; else N.coins -= cost; }
/* ショップのカードを買う。to が調理台のマスならそこへ、ほかは左から空いているマスへ（フィールドは「場」へ）。11/18 しょーくん：手札はなくした（ショップ→調理台で完結） */
const freeSlot = () => N.board.indexOf(null);
const BOARD_FULL = '調理台がいっぱい。先にショップへうるか、まぜてから買おう';
function buy(i, to) {
  const cid = N.shop[i]; if (!cid || busy || N.stage !== 'shop') return;
  const d = cardDef(cid), ng = payNg(1, d.cost);
  if (ng) return toast(ng);
  if (d.cat === 'field') {
    if (N.field) toast('フィールドを入れかえた');
    N.field = cid.slice(2); N.heat = FIELDS[N.field].start;
  } else {
    const at = to && to.where === 'board' ? to.i : freeSlot();
    if (at < 0) return toast(BOARD_FULL);
    if (!place(cid, at)) return;
  }
  pay(1, d.cost); N.shop[i] = null; unsel(); tipEv('buy');
  const born = d.fx.taneSpawn ? spawnTane(d.fx.taneSpawn, []) : 0;   // パン種のびん：置いたとき、パン種が生まれる
  save(); renderNight();
  if (born) taneFx(born);
}
/* ---------- こね生地（11/18 H-012）：パン生地どうしをまぜると「こねる」。こねるたびに、空いているマスにパン種が生まれる（まぜて空いたマス → 左の空き。満杯なら生まれない）
   こねた回数 N.kone はこの夜のあいだ残る。パン種どうしのときは、多く生まれる分（クリームパン・軽量めん棒）はつかない（11/18 ぽぽちの仮：無限にこねられないように） */
const PANE = 'm:panetane';
function spawnTane(n, prefer) {
  let k = 0;
  for (const j of [...prefer, ...N.board.keys()]) { if (k >= n) break; if (j >= 0 && !N.board[j]) { N.board[j] = { cid: PANE, cook: 0, born: 1 }; k++; } }
  return k;
}
const isKnead = (A, B) => A.pan && B.pan;
function kneadPlan(A, B) {
  const F = N.field ? FIELDS[N.field] : {}, both = A.tane && B.tane;
  return { kone: F.kone || 1, tane: 1 + (both ? 0 : (A.fx.tane2 || 0) + (B.fx.tane2 || 0) + (F.tane || 0)) };
}
/* うる・もどす（1ラウンド目の★1は「もどす」＝無料の枠がもどる） */
function sellValue(d) { return d.tane || (N.round === 1 && d.star === 1 && d.cat !== 'burnt') ? 0 : SELL[d.star]; }
function sellAt(p) {
  if (busy || N.stage !== 'shop' || !p) return;
  const c = p.where === 'field' ? (N.field ? { cid: 'b:' + N.field } : null) : cardAt(p); if (!c || p.where === 'shop') return;
  const d = cardDef(c.cid), v = sellValue(d);
  if (v) N.coins += v; else if (!d.tane) N.picks = Math.min(ROUND1_PICKS, N.picks + 1);   // パン種は0コイン（無料の枠ももどらない）
  if (p.where === 'field') N.field = null; else N.board[p.i] = null;
  unsel(); tipEv('sell'); save(); renderNight();
}
function sell() { sellAt(N.sel); }
function reroll() {
  if (busy || N.stage !== 'shop' || N.round === 1) return;
  if (N.coins < REROLL) return toast('コインがたりない');
  N.coins -= REROLL; rollShop(); unsel(); tipEv('reroll'); save(); renderNight();
}

/* ---------- まぜる：同じ★で、属性の合うものどうし（cards.js の mixable）。調理台・ショップのどれどうしでも、まぜられる（ショップのカードは買いながら） ---------- */
const canMix = (a, b) => mixable(cardDef(a.cid), cardDef(b.cid));
const asCard = cid => cardDef(cid).meter ? { cid, cook: 0 } : { cid };   // 仕入れの生地は生（焼き加減0）・大作は大きさ0
/* その場所のカード（shop＝ショップは買う前の形・board＝調理台） */
function cardAt(p) {
  if (!p) return null;
  if (p.where === 'shop') return N.shop[p.i] ? asCard(N.shop[p.i]) : null;
  return p.where === 'board' ? N.board[p.i] : null;
}
/* まぜてできるカード。焼き加減は、低いほうを引きつぐ */
function mixResult(a, b) {
  const cid = mixCid(a.cid, b.cid), cooks = [a, b].filter(x => x.cook != null).map(x => x.cook), D = cardDef(cid);
  if (D.grow) {   // みなもの大作：大きいほうの大きさを引きつぐ（完成は完成のまま・11/19 しょーくん）。固まっているかも、そのカードから
    const s = [a, b].filter(x => x.cook != null && cardDef(x.cid).grow).sort((x, y) => y.cook - x.cook)[0];
    return s ? Object.assign({ cid, cook: s.cook }, s.ice ? { ice: 1 } : {}) : { cid, cook: 0 };
  }
  return D.dough ? { cid, cook: cooks.length ? Math.min(...cooks) : 0 } : { cid };
}
/* まぜるときの代金（ショップのカードの分）と、できたカードの行き先。調理台のカードとまぜたらそのマス・ショップどうしなら左から空いているマス */
function mixPlan(p, q) {
  const shop = [p, q].filter(x => x.where === 'shop'), cost = shop.reduce((t, x) => t + cardDef(N.shop[x.i]).cost, 0);
  const bd = [q, p].find(x => x.where === 'board');
  const to = { where: 'board', i: bd ? bd.i : freeSlot() };
  return { n: shop.length, cost, to };
}
function mixNg(P) { return P.to.i < 0 ? BOARD_FULL : payNg(P.n, P.cost); }
/* 調理台のほかのカードとまぜられるか（ショップとタイルの「まぜ」の目じるし） */
const mixesWithBoard = (cid, skip) => N.board.some((x, i) => x && i !== skip && mixable(cardDef(cid), cardDef(x.cid)));
/* まぜられる相手の決まり（ドラッグの案内・大きく見る画面） */
function mixRule(d) {
  if (d.cat === 'field') return 'フィールドは まぜられない';
  if (d.star >= 3) return '★3は完成。もう まぜられない';
  return `${d.cat === 'tool' ? '道具' : d.cat === 'burnt' ? '焦げ' : chefNow() === CHEFS.minamo ? '飴細工か素材' : '生地か素材'}の★${d.star}と まぜる`;
}
/* p のカードを q へ落としたら何が起きるか（ドラッグの光と案内・指をはなしたとき）。kind：mix・buy・place・move・sell */
function dropPlan(p, q) {
  const a = p.where === 'field' ? (N.field ? { cid: 'b:' + N.field } : null) : cardAt(p);
  if (!a || !q || (q.where === p.where && q.i === p.i)) return null;
  const d = cardDef(a.cid);
  if (q.where === 'sell') return p.where === 'shop' ? null : { kind: 'sell', v: sellValue(d) };
  if (d.cat === 'field') return q.where === 'field' && p.where === 'shop' ? { kind: 'buy', ng: payNg(1, d.cost), cost: d.cost } : null;
  if (q.where === 'field') return null;
  const b = cardAt(q);
  if (b && canMix(a, b)) { const P = mixPlan(p, q), A = cardDef(a.cid), B = cardDef(b.cid); return { kind: 'mix', P, ng: mixNg(P), r: mixResult(a, b), kn: isKnead(A, B) ? kneadPlan(A, B) : null }; }
  if (q.where !== 'board') return null;
  if (p.where === 'board') return { kind: 'move', swap: !!b };
  if (b) return null;
  return p.where === 'shop' ? { kind: 'buy', ng: payNg(1, d.cost), cost: d.cost } : null;
}
/* 指をはなした所で決める */
function dropCard(p, q, from) {
  const P = dropPlan(p, q); if (!P || busy || N.stage !== 'shop') return false;
  if (P.ng) { toast(P.ng); return false; }
  if (P.kind === 'mix') doMix(p, q, from);
  else if (P.kind === 'buy') buy(p.i, q.where === 'board' ? q : null);
  else if (P.kind === 'move') moveTo(p.i, q.i);
  else if (P.kind === 'sell') sellAt(p);
  return true;
}
/* まぜる。2枚がシュッと飛び出してガキーン（mixFx）→ できたカードが調理台へ */
function doMix(p, q, from) {
  const a = cardAt(p), b = cardAt(q);
  if (busy || !a || !b || !canMix(a, b)) return;
  const P = mixPlan(p, q), ng = mixNg(P); if (ng) return toast(ng);
  from = from || [cardSpot(p), cardSpot(q)];   // 演出のために、動く前の場所をおぼえる
  pay(P.n, P.cost);
  const r = mixResult(a, b), d = cardDef(r.cid), A = cardDef(a.cid), B = cardDef(b.cid);
  const kn = isKnead(A, B) ? kneadPlan(A, B) : null;
  for (const x of [p, q]) { if (x.where === 'shop') N.shop[x.i] = null; if (x.where === 'board') N.board[x.i] = null; }
  N.board[P.to.i] = r;
  if (kn) N.kone += kn.kone;
  const freed = [p, q].filter(x => x.where === 'board' && x.i !== P.to.i).map(x => x.i);
  unsel(); tipEv('mix');
  const msg = d.star === 2 ? d.name + 'ができた' : '';   // できたカードの名前は演出の札で見せる（演出なしのときだけ toast）。レシピのひらめきは朝に（11/18 H-001）
  save(); renderNight();
  busy = true;
  mixFx(from, a.cid, b.cid, r.cid, P.to, skip => {
    busy = false;
    if (kn) { const n = spawnTane(kn.tane, freed); save(); renderNight(); kneadFx(P.to.i, kn.kone, n); }
    if (msg && skip) toast(msg);
    if (d.star === 3) cutIn(r.cid, 'スペシャルができた！');
  });
}
/* 調理台のカードを、べつのマスへうごかす（カードがあれば入れかえ）。バトルを押すまで、いつでも */
function moveTo(i, j) {
  if (busy || !N.board[i]) return;
  [N.board[j], N.board[i]] = [N.board[i], N.board[j]];
  unsel(); tipEv('move'); save(); renderNight();
  const t = document.querySelector(`.tslot[data-w="board"][data-i="${j}"] .pc`); if (t) replay(t, 'kon');
}
function closeView() { unsel(); renderNight(); }
/* タップ：カードを大きく見る（説明・買う・うる）。置く・うごかす・まぜる・うるは、ドラッグで（drag.js） */
function tapCard(where, i) {
  if (busy || N.stage !== 'shop') return;
  if (where === 'field' ? !N.field : !cardAt({ where, i })) return;
  N.sel = { where, i }; N.view = true; renderNight();
}

/* ---------- バトル（関数の名前は bake のまま） ---------- */
const burntOf = d => 'k:' + (d.star >= 2 || d.fx.bitter ? 2 : 1);
/* 生地を add だけ焼く。サイコー（9）のまま焼かれると焦げる（safe なら焦げずにサイコーで止まる） */
function cookStep(c, add, safe) {
  const d = cardDef(c.cid), from = c.cook || 0;
  if (from >= COOK_MAX && !safe) return { from, to: from, burnt: true, cid: burntOf(d) };
  c.cook = Math.min(COOK_MAX, from + Math.max(1, add));
  return { from, to: c.cook, burnt: false, cid: c.cid };
}
/* みなもの大作を、飴の温度 t で育てる（11/19）。完成（9）はもう変わらない。ひえひえで固まり（c.ice）、ひんやりでは固まったまま、あたたか以上でとけて育つ
   育つ数は GROW[t]＋育つはやさ（1より少なくはならない）。変わらないときは null */
function growStep(c, t, spd = 0) {
  const from = c.cook || 0;
  if (from >= SIZE_MAX) return null;
  if (t <= 1 || (t === 2 && c.ice)) { const was = !!c.ice; c.ice = 1; return { from, to: from, ice: was ? 'stay' : 'on', cid: c.cid }; }
  const melt = !!c.ice; delete c.ice;
  c.cook = Math.min(SIZE_MAX, from + Math.max(1, GROW[t] + spd));
  return { from, to: c.cook, melt, cid: c.cid };
}
/* 1ラウンドの計算（画面より先に、ぜんぶ決める）。board と heat は finishRound で N に入れる */
function resolveRound() {
  const F = N.field ? FIELDS[N.field] : null, ev = [];
  const board = N.board.map(c => c && Object.assign({ cid: c.cid, cook: c.cook }, c.ice ? { ice: 1 } : {}));
  let heat = N.heat, burnt = 0, call = false;
  const stop = () => board.some(c => c && cardDef(c.cid).fx.stop);
  const burn = (i, r) => { if (r.burnt) { board[i] = { cid: r.cid }; burnt++; } };
  // 1. 焼き：バトルのはじめに、鉄板の生地がいっせいに焼ける
  if (F) {
    const list = [], safeAll = stop();
    const stopAt = board.findIndex(c => c && cardDef(c.cid).fx.stop);
    board.forEach((c, i) => {
      if (!c) return; const d = cardDef(c.cid); if (!d.dough) return;
      const r = cookStep(c, heat + (d.fx.spd || 0), safeAll || d.fx.noburn);
      burn(i, r); list.push({ i, ...r });
    });
    if (list.length) ev.push({ type: 'bake', heat, list, stop: stopAt >= 0 ? stopAt : null });
  }
  // 1b. 育つ（みなもの大作・11/19）：バトルのはじめに、飴の温度で大作の大きさがいっせいに育つ（場がなくても）
  {
    const list = [];
    board.forEach((c, i) => { if (!c || !cardDef(c.cid).grow) return; const r = growStep(c, heat, cardDef(c.cid).fx.spd || 0); if (r) list.push({ i, ...r }); });
    if (list.length) ev.push({ type: 'grow', heat, list });
  }
  // 2. 発動：左から順に
  const idx = board.map((c, i) => c ? i : -1).filter(i => i >= 0);
  const first = idx[0], last = idx[idx.length - 1];
  const doneN = () => idx.filter(j => board[j] && cardDef(board[j].cid).grow && board[j].cook >= SIZE_MAX).length;   // 完成した大作の数（そのときの）
  const extra = Array(SLOTS).fill(0);
  let pend = 1, total = 0, rally = 0, pendEv = [], kone = N.kone || 0, panRally = 0;   // kone＝こねた回数（バトル中もシナモンロールでふえる）・panRally＝いちばんあんパンの「パン生地ぜんぶ+」
  /* ほかのカードにかかる効果は、バトルの画面でオーラを飛ばすので、どこからどこへかを残す（11/18 しょーくん）
     e.out＝このカードから飛ばす [{k, to, v}]（to はマスの番号の列・'heat'・'score'）。parts の4つめ＝かかった元のマス */
  const dmgAt = j => board[j] && cardDef(board[j].cid).fx.dmg;
  for (const i of idx) {
    const times = 1 + Math.min(3, extra[i]);
    for (let t = 0; t < times; t++) {
      const c = board[i], d = cardDef(c.cid), fx = d.fx, sm = STAR_MUL[d.star];
      const e = { type: 'act', i, cid: c.cid, again: t > 0, dmg: 0, cook: c.cook, out: [] };
      if (i === first && t === 0 && fx.rally) {
        rally += fx.rally * sm; e.rally = true;
        e.out.push({ k: 'rally', to: idx.filter(j => j > i && dmgAt(j)), v: fx.rally * sm });
      }
      if (i === first && t === 0 && fx.koneRally && kone) {
        const v = fx.koneRally * sm * kone; panRally += v; e.rally = true;
        e.out.push({ k: 'rally', to: idx.filter(j => j > i && dmgAt(j) && cardDef(board[j].cid).pan), v });
      }
      if (i === first && t === 0 && fx.doneRally && doneN()) {   // あめの花かご：完成した大作があれば、主役ぜんぶ+
        rally += fx.doneRally * sm; e.rally = true;
        e.out.push({ k: 'rally', to: idx.filter(j => j > i && dmgAt(j)), v: fx.doneRally * sm });
      }
      if (fx.nb && dmgAt(i + 1)) e.out.push({ k: 'nb', to: [i + 1], v: fx.nb * sm });
      if (fx.koneUp) { e.kone = [kone, kone + fx.koneUp]; kone += fx.koneUp; }
      if (fx.heat) { const h0 = heat; heat = Math.max(1, Math.min(HEAT_MAX, heat + fx.heat)); e.heat = [h0, heat]; e.out.push({ k: 'heat', to: 'heat' }); }
      if (fx.sear && board[i + 1] && cardDef(board[i + 1].cid).dough) {
        const o = board[i + 1], r = cookStep(o, fx.sear, stop() || cardDef(o.cid).fx.noburn);
        burn(i + 1, r); e.sear = { i: i + 1, ...r }; e.out.push({ k: 'sear', to: [i + 1] });
      }
      if (fx.grow && board[i + 1] && cardDef(board[i + 1].cid).grow && board[i + 1].cook < SIZE_MAX) {   // のばし飴・飴ばさみ：右どなりの大作が育つ（固まっていても、とける）
        const o = board[i + 1], from = o.cook || 0; o.cook = Math.min(SIZE_MAX, from + fx.grow); delete o.ice;
        e.grow = { i: i + 1, cid: o.cid, from, to: o.cook }; e.out.push({ k: 'grow', to: [i + 1] });
      }
      let dmg = 0;
      if (fx.dmg) {
        /* 計算の中身を parts に残す（バトルの画面で、数字が1つずつかかっていくのを見せる） */
        const parts = [];
        let base = fx.dmg * sm;
        if (fx.perKone && kone) { const v = fx.perKone * sm * kone; base += v; parts.push(['+', v, `こね${kone}回`]); }
        if (d.dough) {
          const cm = cookMul(c.cook || 0); base *= cm; if (cm !== 1) parts.push(['×', cm, '焼き加減']);
          if (F && F.best && c.cook >= COOK_MAX) { base *= F.best; parts.push(['×', F.best, 'フィールド']); }
        }
        if (d.grow) { const gm = sizeMul(c.cook || 0, fx); base *= gm; if (gm !== 1) parts.push(['×', gm, c.cook >= SIZE_MAX ? '完成' : '大きさ']); }
        if (fx.lead && i === first) { base *= fx.lead; e.lead = true; parts.push(['×', fx.lead, 'スタート']); }
        if (fx.sai && i === last) {
          const best = idx.filter(j => cardDef(board[j].cid).dough && board[j].cook >= COOK_MAX), n = best.length, v = Math.pow(fx.sai + 0.5 * (d.star - 1), n);
          base *= v; e.sai = n; if (n) parts.push(['×', v, `サイコー${n}枚`, best.filter(j => j !== i)]);
        }
        let nb = 0; const nbs = [];
        for (const j of [i - 1, i + 1]) { const o = board[j]; if (o) { const od = cardDef(o.cid); if (od.fx.nb) { nb += od.fx.nb * STAR_MUL[od.star]; nbs.push(j); } } }
        if (nb) { base += nb; parts.push(['+', nb, 'となり', nbs]); }
        if (rally) { base += rally; parts.push(['+', rally, 'スタート', [first]]); }
        if (panRally && d.pan) { base += panRally; parts.push(['+', panRally, 'スタート', i === first ? undefined : [first]]); }   // いちばんあんパン自身にも効く
        if (pend !== 1) {
          base *= pend; parts.push(['×', pend, '次の主役', [...new Set(pendEv.map(p => p.i))]]);
          for (const p of pendEv) p.out.push({ k: 'next', to: [i], v: p.next });
        }
        pend = 1; pendEv = [];
        dmg = Math.min(DMG_CAP, Math.floor(base));
        e.base = fx.dmg * sm; e.parts = parts;
      }
      if (fx.next) { pend *= fx.next; e.next = fx.next; pendEv.push(e); }
      total += dmg;
      const fin = i === last ? (fx.fin || 1) * (fx.koneFin ? 1 + koneFinOf(fx, d.star) * kone : 1)   // しめのコロネ：×(1＋0.5×こねた回数)
        * (fx.doneFin ? 1 + doneFinOf(fx, d.star) * doneN() : 1) : 1;                               // しあげのつや：×(1＋0.5×完成した大作の数)（11/19）
      if (fin > 1) { const add = Math.min(DMG_CAP, Math.floor(total * (fin - 1))); dmg += add; total += add; e.fin = [Math.round(fin * 100) / 100, add]; e.out.push({ k: 'fin', to: 'score' }); }
      total = Math.min(DMG_CAP, total);
      if (fx.again && t === 0 && i + 1 < SLOTS) { extra[i + 1] += fx.again; if (board[i + 1]) e.out.push({ k: 'again', to: [i + 1] }); }
      if (fx.call) { call = true; e.call = true; }
      e.dmg = dmg;
      ev.push(e);
    }
  }
  return { ev, total, burnt, board, heat, call, kone };
}
/* おもてなし！（11/18 名前を bake から omotenashi に：朝の morning.js の bake と同じ名前で、あとに読まれる朝のほうが勝ち、おもてなし！が動かなかった）：ショップがあがる → ラウンドの帯 → 焼き → 左から1枚ずつ（計算を見せる）→ 結果。時間は T()（はやおくりで半分） */
function omotenashi() {
  if (busy || N.stage !== 'shop') return;
  if (!N.board.some(Boolean)) return toast('調理台にカードを置いてから おもてなししよう');
  if (N.round === 1 && N.picks > 0 && N.shop.some(Boolean)) return toast(`あと${N.picks}まい えらべるよ`);
  const res = resolveRound(), q = quota(N.round, S.day);
  busy = true; unsel(); hideKw(); tipEv('bake'); tipClear();
  shopOut(() => {
    fighting = true; renderNight();
    battleIntro(q, () => {
      let k = 0, run = 0;
      const step = () => {
        if (k >= res.ev.length) return setTimeout(() => finishRound(res), T(950));
        const e = res.ev[k];
        if (e.type === 'act' && !e.again && !e.cut && cardDef(e.cid).star === 3) { e.cut = true; return setTimeout(step, cutIn(e.cid, 'スペシャル発動！')); }
        k++; run += e.dmg || 0;
        setTimeout(step, T(showEvent(e, run, q)));
      };
      step();
    });
  });
}
function finishRound(res) {
  const q = quota(N.round, S.day), ok = res.total >= q;
  N.board = res.board; N.heat = res.heat; N.kone = res.kone; if (res.call) N.call = true;
  N.score += res.total; N.burnt += res.burnt;
  if (ok) N.met++;
  N.last = { round: N.round, total: res.total, q, ok };
  N.stage = 'roundEnd'; busy = false; fighting = false; resultAnim = true;
  save(); renderNight();
}
function nextRound() {
  if (N.stage !== 'roundEnd') return;
  tipEv('next');
  if (N.round >= ROUNDS) return endNight();
  N.coins += INCOME + (N.last.ok ? QUOTA_BONUS : 0);
  const cooled = coolDown();
  N.round++; N.stage = 'shop'; unsel(); dealAnim = true;
  rollShop(); save(); renderNight();
  if (cooled) coolFx(cooled);
}
/* みなもの飴は、ラウンドの終わりに1段冷める（11/19 しょーくん）。ガラスの工房は2ラウンドに1回。冷めたら [前, あと] */
function coolDown() {
  const H = heatOf(), F = N.field ? FIELDS[N.field] : null;
  if (!H.cool || (F && F.slow && N.round % 2 === 1)) return null;
  const h0 = N.heat; N.heat = Math.max(1, N.heat - H.cool);
  return N.heat !== h0 ? [h0, N.heat] : null;
}
/* おもてなしの結果：満足（MOODS）で、モンスター素材（倉庫へ・次の朝から使える）とお礼のコイン（お店のお金）をくれる */
function endNight() {
  const M = MONSTERS[N.mon], belly = nightHP(S.day), mood = moodOf(N.score, belly), R = MOODS[mood];
  S.stock[M.drop] = (S.stock[M.drop] || 0) + R.mats;
  S.money += R.coins;
  if (!S.seenMon.includes(M.id)) S.seenMon.push(M.id);
  Object.assign(S.today, { score: N.score, belly, mood, gifts: { [M.drop]: R.mats }, coins: R.coins });
  N.stage = 'thanks';
  save(); renderNight();
}
