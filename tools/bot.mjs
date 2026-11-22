// 夜のおもてなしのボット（数字合わせ用・11/19）：ゲームの src をそのまま読み、画面の関数は空にして、9ラウンドを何回も遊ぶ
// node tools/bot.mjs [回数=60] [ビルド=ぜんぶ] [日=1]
//   IDEAL=1：夜の合計（ほぼ★3で固めた夜のまんなか＝理想の最終スコア）
//   R1=1：ラウンド1だけ（★2 がスタートかアンカーにある夜の味パワーと、おなかの半分に届く割合）
//   smart＝すこし賢い（まぜる・買う・入れかえを、その場の味パワーが上がる順に・並びも入れかえて一番いい形に）
//   weak ＝ビルドを組めない人（買えるものを順に置くだけ・まぜるのは目の前でできるときだけ・並べかえない）
// 出るもの：ラウンドごとの味パワー（smart の 25/50/75/90% と weak の 50/90%）と、いまの quota（world.js）で 半分・満タンに届いた割合
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const FILES = ['src/js/core.js', 'src/data/cards.js', 'src/data/world.js', 'src/data/hiru.js', 'src/data/story.js', 'src/js/night.js'];
const HEARTS = +(process.env.HEARTS || 0);   // 昼のハート（HEARTS=10 node tools/bot.mjs …）
const RUNS = +(process.argv[2] || 60), ONLY = process.argv[3] && process.argv[3] !== 'all' ? process.argv[3].split(',') : null, DAY = +(process.argv[4] || 1);
// 画面と演出の関数（ボットでは何もしない）
const STUB = { renderNight: '()=>{}', toast: '()=>{}', save: '()=>{}', cutIn: '()=>0', tipEv: '()=>{}', tipClear: '()=>{}', kneadFx: '()=>{}', taneFx: '()=>{}', coolFx: '()=>{}', fruitFx: '()=>{}', binFx: '()=>{}',
  shopOut: 'f=>f&&f()', hideKw: '()=>{}', battleIntro: '(q,f)=>f&&f()', showEvent: '()=>0', mixFx: '(a,b,c,d,e,cb)=>cb&&cb(true)', replay: '()=>{}', floatAt: '()=>{}', heroPose: '()=>{}', heroFor: '()=>{}',
  talkOpen: '()=>{}', talkClose: '()=>{}', talkStart: '()=>{}', sfx: '()=>{}', render: '()=>{}', renderMorning: '()=>{}', openDay: '()=>{}',
  cardSpot: '()=>null', busy: 'false', fighting: 'false', dealAnim: 'false', resultAnim: 'false', bSpeed: '1' };
const DOM = { getElementById: () => null, querySelector: () => null, querySelectorAll: () => [], createElement: () => ({ style: {}, classList: { add() {}, remove() {}, toggle() {} }, appendChild() {} }), documentElement: { style: { setProperty() {} } }, body: { dataset: {}, appendChild() {} } };
// やりなおすたびに新しい箱（同じ箱で2回読むと const が「もうある」でこわれる・11/22）
const newCtx = () => vm.createContext({ console, Math, JSON, Date, setTimeout: f => 0, clearTimeout() {}, document: DOM, window: {}, location: { protocol: 'https:', href: '', search: '', hash: '' }, localStorage: { getItem: () => null, setItem() {}, removeItem() {} }, matchMedia: () => ({ matches: false }), requestAnimationFrame: () => 0, navigator: {} });
let ctx = newCtx();
let src = 'var ART = {}, TRIAL = true;\n';   // ビルドが入れる ART と TRIAL（ボットはぜんぶのビルドを使える）
for (const f of FILES) src += readFileSync(join(root, f), 'utf8') + '\n';
// 画面の関数：src にあれば上書き、なければ var で作る
const UI = Object.entries(STUB).map(([k, v]) => `${k} = ${v};`).join('\n');   // 宣言があれば上書き・なければ（ゆるいモードなので）グローバルに入る
let tries = 0, extra = '';
for (;;) {
  try { vm.runInContext(src + '\n' + UI + '\n' + extra, ctx, { filename: 'game.js' }); break; }
  catch (e) { const m = /^(\w+) is not defined/.exec(e.message); if (!m || ++tries > 30) throw e; extra += `var ${m[1]} = () => {};\n`; console.log('（空にした：' + m[1] + '）'); ctx = newCtx(); }
}

const DRIVER = String.raw`
var HEARTS_ = 0;
const RIPE_ = typeof RIPE !== 'undefined' ? RIPE : 2;
const snap = () => JSON.stringify(N), back = t => { N = JSON.parse(t); S.night = N; };
/* 大作の夜（11/19 現実の飴細工に合わせた）：その場の味パワーだけでは「温めて育てて、あとで冷やして固める」が選べないので、作戦を足す。
   TK ラウンドめまで＝あたたかく保って まぜて育てる（大作の育ちぐあいを高く見る・バトルのあと とろとろ になる手を少し高く）・TK から＝温める道具を売って冷やす（バトルのあと ひんやり以下になる手を高く） */
var TK_ = 6;
const taiNight = () => N.build === 'taisaku';
function taiQuality() { let q = 0; N.board.forEach(c => { if (!c) return; const d = cardDef(c.cid); if (d.grow) q += d.fx.dmg * STAR_MUL[d.star] * sizeMul(c.cook || 0, d.fx); }); return q; }
function taiValue() {
  const t = snap(); let v = 0, h = N.heat; try { const r = resolveRound(); v = r.total; h = r.heat; } catch (e) { v = 0; } back(t);
  const q = taiQuality();
  return N.round >= TK_ ? v + (h <= 2 ? v * 0.3 + q * 0.5 : 0) : v + q * 2 + (h >= 4 ? q * 0.5 : 0);
}
function taiSell() {   // 作戦に合わない温度の道具を売る（前半は冷やす道具・後半は温める道具）
  N.board.forEach((c, i) => { if (!c) return; const d = cardDef(c.cid), h = d.fx.heat || 0; if ((N.round >= TK_ && h > 0) || (N.round < TK_ && h < 0)) sellAt({ where: 'board', i }); });
}
function evalTotal() { if (taiNight()) return taiValue(); const t = snap(); let v = 0; try { v = resolveRound().total; } catch (e) { v = 0; } back(t); return v; }
// 並び：となりどうしを入れかえて上がるかぎり続ける（山のぼり）
function arrange() {
  let best = evalTotal(), better = true, n = 0;
  while (better && n++ < 6) {
    better = false;
    for (let i = 0; i < SLOTS; i++) for (let j = i + 1; j < SLOTS; j++) {
      if (!N.board[i] && !N.board[j]) continue;
      [N.board[i], N.board[j]] = [N.board[j], N.board[i]];
      const v = evalTotal(); if (v > best + 1e-9) { best = v; better = true; } else [N.board[i], N.board[j]] = [N.board[j], N.board[i]];
    }
  }
  return best;
}
function actions() {
  const out = [], sh = N.shop.map((c, i) => c ? { where: 'shop', i } : null).filter(Boolean), bd = N.board.map((c, i) => c ? { where: 'board', i } : null).filter(Boolean);
  for (const p of sh) {
    for (let j = 0; j < SLOTS; j++) { const P = dropPlan(p, { where: 'board', i: j }); if (P && !P.ng && (P.kind === 'mix' || P.kind === 'buy')) out.push([p, { where: 'board', i: j }]); }
    const F = dropPlan(p, { where: 'field' }); if (F && !F.ng) out.push([p, { where: 'field' }]);
  }
  for (const p of bd) for (const q of bd) if (p.i < q.i) { const P = dropPlan(p, q); if (P && P.kind === 'mix' && !P.ng) out.push([p, q]); }
  if (binNight()) for (const p of bd) { const F = dropPlan(p, { where: 'field' }); if (F && !F.ng) out.push([p, { where: 'field' }]); }
  return out;
}
function act(a) { return dropCard(a[0], a[1]); }
function smartShop() {
  let rolls = 0;
  if (taiNight()) taiSell();
  for (let step = 0; step < 40; step++) {
    const base = arrange(), list = actions(); let best = null, bv = -1;
    for (const a of list) {
      const t = snap(); if (!act(a)) { back(t); continue; }
      const v = arrange() + (a[1].where === 'field' ? base * 0.15 : 0) + N.board.filter(Boolean).length * 0.01;   // フィールドは次のラウンドから効く分を少し見こむ
      back(t); if (v > bv) { bv = v; best = a; }
    }
    if (best && bv > base * 0.98) { act(best); continue; }
    if (N.round > 1 && N.coins >= REROLL + 3 && rolls < 3) { reroll(); rolls++; continue; }
    if (best && N.round === 1 && N.picks > 0) { act(best); continue; }   // 1ラウンド目の無料はつかいきる
    break;
  }
  return arrange();
}
function weakShop() {
  for (let step = 0; step < 20; step++) {
    const list = actions(); if (!list.length) break;
    const mix = list.find(a => a[0].where === 'shop' && dropPlan(a[0], a[1]).kind === 'mix');
    const buy = list.find(a => a[0].where === 'shop' && dropPlan(a[0], a[1]).kind === 'buy');
    const a = mix || buy; if (!a) break; act(a);
  }
  return evalTotal();
}
function sim(build, day, smart) {
  S = newState(); S.day = day; S.today = newDay(day); S.seen = S.seen || {}; S.seen['mate:minamo'] = 1; S.seen['mate:wakaba'] = 1; S.seen.m9 = 1;
  S.today.hearts = HEARTS_;
  startNight(); N = S.night; N.stage = 'pick'; pickBuild(build); pickGo(); N = S.night; N.stage = 'shop';
  const out = [];
  for (let r = 1; r <= ROUNDS; r++) {
    N.stage = 'shop';
    const tot = smart ? smartShop() : weakShop();
    if (r === 1) {   // R1=1 用：★2 がスタートかアンカーにある（1）・まんなかだけ（2）・ない（0）
      const idx = N.board.map((c, i) => c ? i : -1).filter(i => i >= 0), st = i => i >= 0 && N.board[i] ? cardDef(N.board[i].cid).star : 0;
      out.s2 = (st(idx[0]) >= 2 || st(idx[idx.length - 1]) >= 2) ? 1 : N.board.some(c => c && cardDef(c.cid).star >= 2) ? 2 : 0;
    }
    if (r === ROUNDS) out.s3 = N.board.filter(c => c && cardDef(c.cid).star >= 3).length;   // IDEAL=1 用：最後のラウンドの★3の数
    const res = resolveRound(); out.push(res.total);
    finishRound(res); if (r < ROUNDS) nextRound();
  }
  return out;
}
`;
vm.runInContext(DRIVER, ctx, { filename: 'driver.js' });
vm.runInContext(`HEARTS_ = ${HEARTS};`, ctx);
if (process.env.TK) vm.runInContext(`TK_ = ${+process.env.TK};`, ctx);
// BAL=kone:0.7:1.1,cookie:1:1.05 … で、ビルドの強さの曲線（BUILDS の bal）をためしに変える
if (process.env.JS) vm.runInContext(process.env.JS, ctx);   // JS='MATS.candybin.fx.chainFin = 0.02' など：ためしに数字を変えてはかる（11/21 夜）
if (process.env.BAL) for (const t of process.env.BAL.split(',')) { const [b, a, g] = t.split(':'); vm.runInContext(`BUILDS[${JSON.stringify(b)}].bal = [${+a}, ${+g}];`, ctx); }
const builds = ONLY || ['cookie', 'kone', 'taisaku', 'candy', 'fruitcake', 'jam'];
const pct = (a, p) => { const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(p * s.length))]; };
const f = n => n >= 1e4 ? (n / 1e4).toFixed(n >= 1e5 ? 0 : 1) + '万' : String(Math.round(n));
for (const b of builds) {
  const sm = [], wk = [];
  const run = smart => { for (let t = 0; ; t++) { try { return vm.runInContext(`sim(${JSON.stringify(b)}, ${DAY}, ${smart})`, ctx); } catch (e) { const m = /^(\w+) is not defined/.exec(e.message); if (!m || t > 30) throw e; vm.runInContext(`${m[1]} = () => 0;`, ctx); console.log('（空にした：' + m[1] + '）'); } } };
  for (let k = 0; k < RUNS; k++) { sm.push(run(true)); wk.push(run(false)); }
  if (process.env.R1) {   // R1=1：ラウンド1だけ（11/20 ねらい：昼のハート0で ★2 をスタートかアンカーに置いた夜の まんなか ≒ おなかの半分）
    const q = vm.runInContext(`quota(1, ${DAY}, ${JSON.stringify(b)})`, ctx), e = sm.filter(x => x.s2 === 1).map(x => x[0]);
    const hit = a => Math.round(a.filter(v => v >= q / 2).length / Math.max(1, a.length) * 100);
    console.log(`${b.padEnd(9)} おなか ${q}（半分 ${q / 2}）｜ ★2がはしの夜 ${Math.round(e.length / sm.length * 100)}% 味パワー 25/50/75% ${[.25, .5, .75].map(p => f(pct(e, p))).join('/')} 半分に届く ${hit(e)}% ｜ 全部の夜 smart ${hit(sm.map(x => x[0]))}% weak ${hit(wk.map(x => x[0]))}%`);
    continue;
  }
  if (process.env.IDEAL) {   // IDEAL=1（11/21 夜 しょーくん「昼を完璧に・ビルドも完璧に運用して、ほぼ★3で固めたときの最終スコアが どのビルドも50万くらい」）：夜の合計（9ラウンド）
    const tot = x => x.reduce((u, v) => u + v, 0), all = sm.map(tot), s3 = sm.filter(x => x.s3 >= 4).map(tot), s3b = sm.filter(x => x.s3 >= 3).map(tot);
    console.log(`${b.padEnd(9)} 夜の合計 smart 50/75/90/最大 ${[.5, .75, .9].map(p => f(pct(all, p))).join('/')}/${f(Math.max(...all))} ｜ ★3が4まい以上の夜 ${Math.round(s3.length / sm.length * 100)}% まんなか ${s3.length ? f(pct(s3, .5)) : '-'} ｜ 3まい以上 ${Math.round(s3b.length / sm.length * 100)}% まんなか ${s3b.length ? f(pct(s3b, .5)) : '-'} ｜ おなか ${f(vm.runInContext(`nightHP(${DAY})`, ctx))}`);
    continue;
  }
  if (process.env.SUM) {   // 1行まとめ（SUM=1）：満タン率 r2・r5・r9 ｜ r9 の 25/50/90%（おなかの何倍）｜ weak r9 の 90%（何倍）｜ 夜の満足（ちょっと／満足／大満足 の%）
    const q9 = vm.runInContext(`quota(9, ${DAY})`, ctx), fr = (a, r) => Math.round(a.filter(x => x[r] >= vm.runInContext(`quota(${r + 1}, ${DAY})`, ctx)).length / a.length * 100);
    const r9 = sm.map(x => x[8]), belly = vm.runInContext(`nightHP(${DAY})`, ctx);
    const moods = a => { const c = [0, 0, 0, 0]; a.forEach(x => c[vm.runInContext(`moodOf(${x.reduce((u, v) => u + v, 0)}, ${belly})`, ctx)]++); return c.slice(1).map(n => Math.round(n / a.length * 100)).join('/'); };
    const k = v => (v / q9).toFixed(2);
    // ねらい（r2 で25％・r9 で50％が満タン）に合わせる bal の目安：いまの bal の倍率 × いまのおなか ÷ そのラウンドの味パワー（r2 は上から25％の所・r9 はまんなか）。bal はおなかを割る数
    const bal = vm.runInContext(`JSON.stringify(BUILDS[${JSON.stringify(b)}].bal || [1, 1])`, ctx), [a0, g0] = JSON.parse(bal), cur = r => a0 * Math.pow(g0, r - 1);
    const m2 = vm.runInContext('quota(2, 1)', ctx) / Math.max(1, pct(sm.map(x => x[1]), .75)) * cur(2), m9 = q9 / Math.max(1, pct(r9, .5)) * cur(9);
    const g = Math.pow(m9 / m2, 1 / 7), a = m2 / g;
    console.log(`${b.padEnd(9)} 満タン r2 ${String(fr(sm, 1)).padStart(3)}% r5 ${String(fr(sm, 4)).padStart(3)}% r9 ${String(fr(sm, 8)).padStart(3)}% ｜ r9 ${k(pct(r9, .25))}/${k(pct(r9, .5))}/${k(pct(r9, .9))} ｜ weak r9 90% ${k(pct(wk.map(x => x[8]), .9))} ｜ 満足 smart ${moods(sm)} weak ${moods(wk)} ｜ bal ${bal} → 目安 [${a.toFixed(2)}, ${g.toFixed(3)}]`);
    continue;
  }
  console.log(`\n== ${b}（日${DAY}・ハート${HEARTS}・${RUNS}回）  r: smart 25/50/75/90% ｜ weak 50/90% ｜ いまの quota・smart 満タン率・weak 満タン率`);
  for (let r = 0; r < 9; r++) {
    const s = sm.map(x => x[r]), w = wk.map(x => x[r]), q = vm.runInContext(`quota(${r + 1}, ${DAY})`, ctx);
    const full = a => Math.round(a.filter(v => v >= q).length / a.length * 100) + '%';
    console.log(`r${r + 1}: ${[.25, .5, .75, .9].map(p => f(pct(s, p))).join(' / ')} ｜ ${f(pct(w, .5))} / ${f(pct(w, .9))} ｜ q ${f(q)}  ${full(s)} ${full(w)}`);
  }
}
