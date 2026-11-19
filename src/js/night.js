/* ==== 夜：来店した食材モンスターを9ラウンドでおもてなしする（ゼンゼロのオバケ屋敷の形が土台・仕様は claude/okashi-battle-spec.md） ====
   流れ（11/18 H-001）：来店の会話（stage arrive）→ ラウンド1〜9 → お礼の会話（thanks）→ 結果（end）→ 1日のまとめ。味パワーの合計で満足が決まり、素材とコインをくれる
   1ラウンド：ショップ（舞台にかぶせる。毎回3枚・有料の入れかえ・コインで買う・うる）＋ 調理台で並べる・まぜる → バトル（ショップがとじて舞台でバトル）
   買ったカードは調理台へ（手札はない・11/18）。調理台がいっぱいなら、まぜるか先にうる。お金とコインはショップの中だけに出す（11/17 しょーくん「ゼンゼロのようにショップを挟む」）
   バトル：はじめに「焼き」（フィールドがあれば、鉄板の生地がいっせいに火力のぶん焼ける）→ 左から順に発動
   生地は場に残り、ラウンドをまたいで焼けていく（9でサイコー・サイコーのまま焼かれると焦げる）
   鉄板の火力（N.heat 1〜4）はラウンドをまたいで残る。火力カードが発動すると変わり、次のラウンドの焼きに効く
   フィールドも仕入れから。買うと調理台の左の「場」に入る（1つだけ・置きかえOK）。ラウンド1だけ、5まいから3まい えらんで無料
   調理台5マス。画面は night-ui.js */
const SLOTS = 5, ROUND1_SHOW = 5, ROUND1_PICKS = 3, SHOP_N = 3, INCOME = 5, REROLL = 1;
/* おなかの段階（11/19 しょーくん）：左はしが ぺこぺこ。半分まで＝コイン+1・満タン（まんぞく！）＝コイン+3 */
const TIER_COIN = [0, 1, 3], tierOf = (t, q) => t >= q ? 2 : t >= q / 2 ? 1 : 0;
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
  Object.assign(S.today, { mon: id, newMon: !S.seenMon.includes(id) });
  const open = openBuilds();
  S.night = {
    mon, field: null, heat: START_HEAT, call: false, stage: open.length > 1 ? 'pick' : 'arrive', round: 1, coins: 0, picks: ROUND1_PICKS,
    board: Array(SLOTS).fill(null), shop: [], score: 0, met: 0, burnt: 0,
    sel: null, view: false, last: null,
    build: open.includes(S.build) ? S.build : open[0], kone: 0,   // build＝今夜のビルド（11/18）・kone＝この夜にこねた回数（こね生地）
  };
  S.today.belly = nightHP(S.day, S.night.build);   // おなかはビルドで変わる（11/19・world.js の quota）
  N = S.night; nightPrep(); rollShop(); dealAnim = true;   // 夜のはじめ：ほのかは中火・みなもは あたたか（11/19）・わかばの飴ジャムは場が大きなびん
  save(); render();
}
/* 夕方のシェフ・ビルドえらび（11/18 しょーくん：毎晩・前の夜のビルドがえらばれている。使えるのが1つのうちは出さない） */
function pickBuild(id) { if (N.stage !== 'pick' || !BUILDS[id] || !openBuilds().includes(id)) return; N.build = id; nightPrep(); save(); renderNight(); }
function pickGo() {
  if (N.stage !== 'pick') return;
  S.build = N.build; S.today.belly = nightHP(S.day, N.build); nightPrep(); N.stage = 'arrive'; rollShop(); dealAnim = true;
  save(); renderNight();
}
const curBuild = () => BUILDS[(N && N.build) || 'cookie'];
/* 今夜のビルドに合わせた夜のはじめ（11/19 わかば：飴ジャムの夜は場がいつも大きなびん・bin＝びんの中の実・jamN＝この夜に作ったジャムの数） */
function nightPrep() { N.heat = heatOf().start; N.field = curBuild().bin || null; N.bin = []; N.jamN = 0; N.fert = false; N.basket = 0; }
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
    if (!Array.isArray(n.bin)) n.bin = []; n.bin = n.bin.filter(m => MATS[m] && MATS[m].fruit);
    if (!Number.isFinite(n.jamN)) n.jamN = 0;
    if (BUILDS[n.build].bin) n.field = BUILDS[n.build].bin;
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
  if (N.call) {   // よびりん：フィールドをかならず1枚（飴ジャムの夜の畑のベルは、フィールドがないので熟した実を1枚・11/19）
    const f = B.fields.filter(id => id !== N.field);
    if (B.bin) out.push('m:' + pick(FRUIT_IDS) + RIPE);
    else if (f.length) out.push('b:' + pick(f));
    N.call = false;
  }
  for (; N.basket > 0; N.basket--) out.push('m:' + pick(FRUIT_IDS) + '0');   // 収穫かご：くだもの（花）が多く出る
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
    if (fixedField()) return toast('今夜の場は大きなびん（入れかえられない）');
    if (N.field) toast('フィールドを入れかえた');
    N.field = cid.slice(2); if (FIELDS[N.field].start) N.heat = FIELDS[N.field].start;   // わかばの肥料は温度も火力も変えない
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
/* ---------- わかば②飴ジャム（11/19 しょーくん）：場はいつも大きなびん。くだものをドラッグで入れる（入れた段のまま）。3つで★3のジャムが調理台に生まれ、びんは空に
   ジャムの行き先は、調理台から入れた実の空いたマス → 左の空き。とろとろジャムが調理台にあると、熟した実は2つ分 ---------- */
const BIN_MAX = 3;
const fixedField = () => !!(N.field && FIELDS[N.field] && FIELDS[N.field].fixed);
const binWeight = m => MATS[m].stage === RIPE && N.board.some(c => c && cardDef(c.cid).fx.toro) ? 2 : 1;
const binCount = () => N.bin.reduce((t, m) => t + binWeight(m), 0);
function binPlan(p, d) {
  const jam = binCount() + binWeight(d.mats[0]) >= BIN_MAX, n = p.where === 'shop' ? 1 : 0, cost = n ? d.cost : 0;
  const ng = jam && p.where !== 'board' && freeSlot() < 0 ? 'ジャムを置くマスがない。調理台を1つあけよう' : payNg(n, cost);
  return { kind: 'bin', n, cost, jam, ng };
}
function binIn(p) {
  const a = cardAt(p); if (!a || busy || N.stage !== 'shop' || !fixedField()) return;
  const d = cardDef(a.cid); if (!d.fruit || d.star !== 1) return;
  const P = binPlan(p, d); if (P.ng) return toast(P.ng);
  pay(P.n, P.cost);
  if (p.where === 'shop') N.shop[p.i] = null; else N.board[p.i] = null;
  N.bin.push(d.mats[0]); unsel(); tipEv('buy');
  let made = null;
  if (binCount() >= BIN_MAX) {
    made = 'j:' + N.bin.slice().sort().join('+');
    N.board[p.where === 'board' ? p.i : freeSlot()] = { cid: made, born: 1 }; N.bin = []; N.jamN++;
  }
  save(); renderNight(); binFx(made);
}
/* うる・もどす（1ラウンド目の★1は「もどす」＝無料の枠がもどる） */
function sellValue(d) { return d.tane || (N.round === 1 && d.star === 1 && d.cat !== 'burnt') ? 0 : SELL[d.star]; }
function sellAt(p) {
  if (busy || N.stage !== 'shop' || !p) return;
  if (p.where === 'field' && fixedField()) return toast('大きなびんは うれない');
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
  const plus = (a.plus || 0) + (b.plus || 0);   // もりのシフォン：育った実でふえた味パワーは、まぜても引きつぐ（11/19）
  return D.dough ? { cid, cook: cooks.length ? Math.min(...cooks) : 0 } : plus && D.fx.perGrow ? { cid, plus } : { cid };
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
  if (d.cat === 'field') return fixedField() && d.cid === 'b:' + N.field ? 'くだものを入れて、3つでジャム' : 'フィールドは まぜられない';
  if (d.star >= 3) return '★3は完成。もう まぜられない';
  if (d.fruit) return binNight() ? '場の大きなびんへ（3つでジャム）' : d.stage === RIPE ? '★2のケーキにはなすと★3' : 'まぜずに育てる（熟すと★2のケーキへ）';   // わかば（11/19）
  const C = chefNow(), main = ['ame', 'candy', 'cake', 'jam'].includes(d.cat) ? CAT_NAME[d.cat] : candyNight() ? 'キャンディ' : binNight() ? 'ジャム' : C === CHEFS.minamo ? '飴細工' : C === CHEFS.wakaba ? 'ケーキ' : '生地';
  return `${d.cat === 'tool' ? '道具' : d.cat === 'burnt' ? '焦げ' : main + 'か素材'}の★${d.star}と まぜる${d.cat === 'cake' && d.star === 2 ? '・熟した実で★3' : ''}`;
}
/* p のカードを q へ落としたら何が起きるか（ドラッグの光と案内・指をはなしたとき）。kind：mix・buy・place・move・sell */
function dropPlan(p, q) {
  const a = p.where === 'field' ? (N.field && !fixedField() ? { cid: 'b:' + N.field } : null) : cardAt(p);   // 大きなびんは うごかせない
  if (!a || !q || (q.where === p.where && q.i === p.i)) return null;
  const d = cardDef(a.cid);
  if (q.where === 'sell') return p.where === 'shop' ? null : { kind: 'sell', v: sellValue(d) };
  if (d.cat === 'field') return q.where === 'field' && p.where === 'shop' ? { kind: 'buy', ng: payNg(1, d.cost), cost: d.cost } : null;
  if (q.where === 'field') return fixedField() && d.fruit && d.star === 1 ? binPlan(p, d) : null;   // わかば②：くだものを大きなびんへ
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
  else if (P.kind === 'bin') binIn(p);
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
/* 昼のハート（11/19 H-029 しょーくん「昼パートをしっかりやらないと夜の火力が伸びない連動」・えらぶ質問で「ハート1こにつき+5%」）：その日の昼のハート（仲間の来店の1こもふくむ）で、夜の味パワーが上がる */
const HEART_UP = 0.05;
const dayHearts = () => Math.max(0, (S.today && S.today.hearts) || 0);
const heartMul = () => 1 + HEART_UP * dayHearts();
function resolveRound() {
  const F = N.field ? FIELDS[N.field] : null, ev = [];
  const board = N.board.map(c => c && Object.assign({ cid: c.cid, cook: c.cook }, c.ice ? { ice: 1 } : {}, c.plus ? { plus: c.plus } : {}));
  let heat = N.heat, burnt = 0, call = false, fert = false, basket = 0;
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
  // 1c. くだもの（わかば・11/19）：スタートのロール生地で、バトル開始時に くだものぜんぶ1段育つ
  {
    const f0 = board.findIndex(Boolean);
    if (f0 >= 0 && cardDef(board[f0].cid).fx.rollGrow) { const list = fruitGrow(board, 1); if (list.length) ev.push({ type: 'fgrow', by: f0, list }); }
  }
  // 2. 発動：左から順に
  const idx = board.map((c, i) => c ? i : -1).filter(i => i >= 0);
  const first = idx[0], last = idx[idx.length - 1];
  const doneN = () => idx.filter(j => board[j] && cardDef(board[j].cid).grow && board[j].cook >= SIZE_MAX).length;   // 完成した大作の数（そのときの）
  const extra = Array(SLOTS).fill(0);
  let pend = 1, total = 0, rally = 0, pendEv = [], kone = N.kone || 0, panRally = 0;
  const HM = heartMul();   // 昼のハートで味パワーアップ（11/19 H-029）
  /* みなも②（11/19）：chain＝れんさ（キャンディが続けて発動した数・素材や道具が発動すると0）・candyMul＝いちばんドロップの「キャンディぜんぶ×」 */
  let chain = (F && F.chain0) || 0, candyMul = 1;
  const petitN = (F && F.petit) || 0, isCandy = j => !!board[j] && cardDef(board[j].cid).candy;
  /* わかば（11/19）：くだものの効果は のびのび肥料×2・となりのかかし×1.5（fxAt）。jamMul＝いちばんジャムの「ジャムぜんぶ×」 */
  let jamMul = 1;
  const isJam = j => !!board[j] && cardDef(board[j].cid).cat === 'jam', isFruit = j => !!board[j] && cardDef(board[j].cid).fruit;
  const scareOf = j => board[j] ? cardDef(board[j].cid).fx.scare || 1 : 1;
  const fieldMul = d => !F || !F.fruitMul ? 1 : d.stage === RIPE && F.ripeMul ? F.ripeMul : F.fruitMul;   // のびのび肥料：×2・熟した実は×3
  const fxAt = j => { const d = cardDef(board[j].cid); return d.fruit ? scaleFx(d.fx, fieldMul(d) * Math.max(scareOf(j - 1), scareOf(j + 1))) : d.fx; };   // kone＝こねた回数（バトル中もシナモンロールでふえる）・panRally＝いちばんあんパンの「パン生地ぜんぶ+」
  /* ほかのカードにかかる効果は、バトルの画面でオーラを飛ばすので、どこからどこへかを残す（11/18 しょーくん）
     e.out＝このカードから飛ばす [{k, to, v}]（to はマスの番号の列・'heat'・'score'）。parts の4つめ＝かかった元のマス */
  const dmgAt = j => board[j] && cardDef(board[j].cid).fx.dmg;
  for (const i of idx) {
    const cold = cardDef(board[i].cid).fx.coldAgain && heat <= 2 ? 1 : 0;   // ひえひえミント飴：ひんやり以下なら もう1回
    const fa = cardDef(board[i].cid).fx.fruitAgain && isFruit(i + 1) ? 1 : 0;   // はちみつロール：右どなりがくだものなら もう1回
    const times = 1 + Math.min(3, extra[i]) + cold + fa;
    for (let t = 0; t < times; t++) {
      const c = board[i], d = cardDef(c.cid), fx = fxAt(i), sm = STAR_MUL[d.star];
      const e = { type: 'act', i, cid: c.cid, again: t > 0, dmg: 0, cook: c.cook, out: [] };
      if (d.candy) {   // れんさ+1（つなぎペロキャン：両どなりがキャンディなら さらに+）
        const lk = fx.link && isCandy(i - 1) && isCandy(i + 1) ? fx.link : 0;
        chain += 1 + lk; e.chain = chain; if (lk) e.link = lk;
      } else if (fx.chainUp && candyNight()) { chain += fx.chainUp; e.chain = chain; e.chainUp = fx.chainUp; }   // 飴ばさみは れんさを切らない
      else if (chain) { e.chainBreak = chain; chain = 0; }
      if (i === first && t === 0 && fx.candyLead) {   // いちばんドロップ：このラウンドのキャンディぜんぶ×（自分も・ちいさなキャンディも）
        candyMul *= fx.candyLead; e.clead = fx.candyLead;
        e.out.push({ k: 'clead', to: idx.filter(j => j > i && isCandy(j)), v: fx.candyLead });
      }
      if (i === first && t === 0 && fx.jamLead) {   // いちばんジャム：このラウンドのジャムぜんぶ×（自分も）
        jamMul *= fx.jamLead; e.clead = fx.jamLead;
        e.out.push({ k: 'clead', to: idx.filter(j => j > i && isJam(j)), v: fx.jamLead });
      }
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
      if (fx.water && isFruit(i + 1)) { const L = fruitGrow(board, fx.water, i + 1); if (L.length) { e.water = L[0]; e.out.push({ k: 'water', to: [i + 1] }); } }   // じょうろ
      if (fx.fert) { fert = true; e.fert = true; }                       // ひりょう：このラウンドの終わりに もう1段
      if (fx.basket) { basket += fx.basket; e.basket = fx.basket; }      // 収穫かご
      if (fx.shine && isJam(i + 1)) e.out.push({ k: 'shine', to: [i + 1], v: fx.shine });   // きらきら水あめ
      let dmg = 0;
      if (fx.dmg) {
        /* 計算の中身を parts に残す（バトルの画面で、数字が1つずつかかっていくのを見せる） */
        const parts = [];
        let base = fx.dmg * sm;
        if (fx.perKone && kone) { const v = fx.perKone * sm * kone; base += v; parts.push(['+', v, `こね${kone}回`]); }
        if (fx.perChain && chain) { const v = fx.perChain * sm * chain; base += v; parts.push(['+', v, `れんさ${chain}`]); }
        if (c.plus) { base += c.plus; parts.push(['+', c.plus, '育った実']); }   // もりのシフォン
        if (fx.binNow && N.bin.length) { const v = fx.binNow * sm * N.bin.length; base += v; parts.push(['+', v, `びんの実${N.bin.length}`]); }
        if (fx.perJam && N.jamN) { const v = fx.perJam * sm * N.jamN; base += v; parts.push(['+', v, `ジャム${N.jamN}`]); }
        if (d.dough) {
          const cm = cookMul(c.cook || 0); base *= cm; if (cm !== 1) parts.push(['×', cm, '焼き加減']);
          if (F && F.best && c.cook >= COOK_MAX) { base *= F.best; parts.push(['×', F.best, 'フィールド']); }
        }
        if (d.grow) { const gm = sizeMul(c.cook || 0, fx); base *= gm; if (gm !== 1) parts.push(['×', gm, c.cook >= SIZE_MAX ? '完成' : '大きさ']); }
        if (d.candy) {   // キャンディは冷えるほど強い・いちばんドロップ
          const cm = COLD_MUL[heat] || 1; if (cm !== 1) { base *= cm; parts.push(['×', cm, heatOf().names[heat]]); }
          if (candyMul !== 1) { base *= candyMul; parts.push(['×', candyMul, 'いちばん', [first]]); }
        }
        if (d.cat === 'cake' && fx.tartFruit && (isFruit(i - 1) || isFruit(i + 1))) { base *= fx.tartFruit; parts.push(['×', fx.tartFruit, 'となりの実']); }   // わかば①：タルト（となりが実）
        if (d.cat === 'jam') {   // わかば②：いちばんジャム・きらきら水あめ（左どなり）
          if (jamMul !== 1) { base *= jamMul; parts.push(['×', jamMul, 'いちばん', [first]]); }
          const sh = board[i - 1] && cardDef(board[i - 1].cid).fx.shine; if (sh) { base *= sh; parts.push(['×', sh, 'きらきら', [i - 1]]); }
        }
        if (fx.lead && i === first) { base *= fx.lead; e.lead = true; parts.push(['×', fx.lead, 'スタート']); }
        if (fx.sai && i === last) {
          const best = idx.filter(j => cardDef(board[j].cid).dough && board[j].cook >= COOK_MAX), n = best.length, v = Math.pow(fx.sai + 0.5 * (d.star - 1), n);
          base *= v; e.sai = n; if (n) parts.push(['×', v, `サイコー${n}枚`, best.filter(j => j !== i)]);
        }
        if (fx.ripeFin && i === last) {   // しめのデコ生地：熟した実1つにつき×
          const rp = idx.filter(j => (isFruit(j) && cardDef(board[j].cid).stage === RIPE) || cardDef(board[j].cid).fx.fruitCake), n = rp.length, v = Math.pow(ripeFinOf(fx, d.star), n);   // ケーキにのせた実も数える
          base *= v; if (n) parts.push(['×', v, `熟した実${n}`, rp]);
        }
        let nb = 0; const nbs = [];
        for (const j of [i - 1, i + 1]) { const o = board[j]; if (o) { const od = cardDef(o.cid), ofx = fxAt(j); if (ofx.nb) { nb += ofx.nb * STAR_MUL[od.star]; nbs.push(j); } } }
        if (nb) { base += nb; parts.push(['+', nb, 'となり', nbs]); }
        if (rally) { base += rally; parts.push(['+', rally, 'スタート', [first]]); }
        if (panRally && d.pan) { base += panRally; parts.push(['+', panRally, 'スタート', i === first ? undefined : [first]]); }   // いちばんあんパン自身にも効く
        if (pend !== 1) {
          base *= pend; parts.push(['×', pend, '次の主役', [...new Set(pendEv.map(p => p.i))]]);
          for (const p of pendEv) p.out.push({ k: 'next', to: [i], v: p.next });
        }
        pend = 1; pendEv = [];
        dmg = Math.min(DMG_CAP, Math.floor(base * HM));
        e.base = fx.dmg * sm; e.parts = parts;
      }
      if (fx.next) { pend *= fx.next; e.next = fx.next; pendEv.push(e); }
      total += dmg;
      const pet = [];   // はじけキャンディ：ちいさなキャンディが1こずつ飛ぶ（れんさ+1ずつ・冷えるほど強い・いちばんドロップも効く）
      if (fx.petit) {
        const n = fx.petit + petitN, pm = (COLD_MUL[heat] || 1) * candyMul;
        for (let k = 0; k < n; k++) { chain++; const pd = Math.min(DMG_CAP, Math.floor(PETIT_DMG * sm * pm * HM)); total += pd; pet.push({ type: 'petit', i, cid: c.cid, k, n, dmg: pd, chain }); }
      }
      if (d.cat === 'cake' && dmg > 0 && F && F.decoHits) {   // デコレーション台：そのケーキの1割が5連撃（熟した実の★3は10連撃）・11/19 しょーくん
        const n = F.decoHits[fx.fruitCake ? 1 : 0], pd = Math.max(1, Math.floor(dmg * F.decoRate));
        for (let k = 0; k < n; k++) { total += pd; pet.push({ type: 'deco', i, cid: c.cid, k, n, dmg: pd }); }
      }
      const fin = i === last ? (fx.fin || 1) * (fx.koneFin ? 1 + koneFinOf(fx, d.star) * kone : 1)   // しめのコロネ：×(1＋0.5×こねた回数)
        * (fx.doneFin ? 1 + doneFinOf(fx, d.star) * doneN() : 1)
        * (fx.chainFin ? 1 + chainFinOf(fx, d.star) * chain : 1)
        * (fx.jamFin ? 1 + jamFinOf(fx, d.star) * (N.jamN || 0) : 1) : 1;                             // しめのジャム：×(1＋0.5×この夜に作ったジャムの数)（11/19）                                  // キャンディのびん：×(1＋0.25×れんさ)（11/19）                               // しあげのつや：×(1＋0.5×完成した大作の数)（11/19）
      if (fin > 1) { const add = Math.min(DMG_CAP, Math.floor(total * (fin - 1))); dmg += add; total += add; e.fin = [Math.round(fin * 100) / 100, add]; e.out.push({ k: 'fin', to: 'score' }); }
      total = Math.min(DMG_CAP, total);
      if (fx.again && t === 0 && i + 1 < SLOTS) { extra[i + 1] += fx.again; if (board[i + 1]) e.out.push({ k: 'again', to: [i + 1] }); }
      if (fx.call) { call = true; e.call = true; }
      e.dmg = dmg;
      ev.push(e, ...pet);
    }
  }
  return { ev, total, burnt, board, heat, call, kone, fert, basket };
}
/* おもてなし！（11/18 名前を bake から omotenashi に：朝の morning.js の bake と同じ名前で、あとに読まれる朝のほうが勝ち、おもてなし！が動かなかった）：ショップがあがる → ラウンドの帯 → 焼き → 左から1枚ずつ（計算を見せる）→ 結果。時間は T()（はやおくりで半分） */
/* 調理台に置けるカードが、いまショップで買えるか（フィールドは調理台のカードではないので数えない） */
const canPlace = () => N.shop.some(c => c && cardDef(c).cat !== 'field' && !payNg(1, cardDef(c).cost));
function omotenashi() {
  if (busy || N.stage !== 'shop') return;
  if (!N.board.some(Boolean) && canPlace()) return toast('調理台にカードを置いてから おもてなししよう');   // 置けるカードがないとき（コイン0で調理台が空）は、空のままでも進める（11/19 点検：買う→うるをくり返すと先へ進めなくなっていた）
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
  const q = quota(N.round, S.day), tier = tierOf(res.total, q), ok = tier === 2;
  N.board = res.board; N.heat = res.heat; N.kone = res.kone; if (res.call) N.call = true;
  if (res.fert) N.fert = true; if (res.basket) N.basket = (N.basket || 0) + res.basket;   // ひりょう・収穫かご（わかば）
  N.score += res.total; N.burnt += res.burnt;
  if (ok) N.met++;
  N.last = { round: N.round, total: res.total, q, ok, tier };
  N.stage = 'roundEnd'; busy = false; fighting = false; resultAnim = true;
  save(); renderNight();
}
function nextRound() {
  if (N.stage !== 'roundEnd') return;
  tipEv('next');
  if (N.round >= ROUNDS) return endNight();
  N.coins += INCOME + TIER_COIN[N.last.tier != null ? N.last.tier : N.last.ok ? 2 : 0];
  const cooled = coolDown(), grown = fruitEnd();
  N.round++; N.stage = 'shop'; unsel(); dealAnim = true;
  rollShop(); save(); renderNight();
  if (cooled) coolFx(cooled);
  if (grown.length) fruitFx(grown);
}
/* わかばのくだもの（11/19 しょーくん）：ラウンドの終わりに1段育つ。すくすく肥料は2段（1ターンはやく熟す）・のびのび肥料は2ラウンドに1回・ひりょうで もう1段 */
function fruitEnd() {
  const F = (N.field && FIELDS[N.field]) || {}, n = (F.slowGrow && N.round % 2 === 1 ? 0 : 1 + (F.growAdd || 0)) + (N.fert ? 1 : 0);
  N.fert = false;
  return n ? fruitGrow(N.board, n) : [];
}
/* くだものを n 段育てる（熟した実はそのまま・only＝そのマスだけ）。育った段の数だけ、もりのシフォンの味パワーが この夜ずっと+（board の plus）。[{i, from, to, cid}] */
function fruitGrow(board, n, only) {
  const list = []; let steps = 0;
  board.forEach((c, i) => {
    if (!c || (only != null && i !== only)) return;
    const d = cardDef(c.cid); if (!d.fruit || d.stage >= RIPE) return;
    const to = Math.min(RIPE, d.stage + n); steps += to - d.stage;
    c.cid = 'm:' + MATS[d.mats[0]].fruit + to; list.push({ i, from: d.stage, to, cid: c.cid });
  });
  if (steps) board.forEach(c => { if (c) { const d = cardDef(c.cid); if (d.fx.perGrow) c.plus = (c.plus || 0) + d.fx.perGrow * STAR_MUL[d.star] * steps; } });
  return list;
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
