/* ==== 効果音・ジングル・掛け声（11/19 昼のチャット【okashi-hiru】・しょーくん「音楽とSEは完璧」） ====
   - 音のファイル：効果音 assets/se/<名前>.mp3・ジングル assets/bgm/jg-*.mp3（11/21〜 無料の効果音集から、しょーくんが聞きくらべでえらんだ28こ＝koe-irai の sfx/picks/okashi。
       buy だけは前のコードの音〔tools/se/make_se.py〕・ジングルの前の曲は tools/bgm/make_bgm_hiru.py。どちらの道具も消さずに残す）
   - 残響（11/21 しょーくんが「たっぷり」をえらんだ）：効果音とジングルにかける・声にはかけない。聞きくらべのページと同じ数（SE_WET・SE_DRY・seRev）
     ・掛け声 assets/koe/<id>.mp3（声の依頼箱 koe-irai の out/okashi/kakegoe-gemini・11/21〜 Gemini TTS：ほのか Leda・みなも Despina・わかば Achernar。
       1本にまとめた声を tools/koe/split2.py で切り分け・1ことばの声は tools/koe/trim.py・大きさは tools/koe/level.sh で平均 -24dB に）
   - 鳴らす：sePlay(名前, { rate, vol })・jgPlay(名前)（鳴っているあいだ曲を少し下げる）・koePlay(id)
     昼のチャットの画面は morning.js の mSe・mKoe・mJg から（se.js がビルドに入っていないときは何もしない）
   - AudioContext は sound.js の bgm.ctx をいっしょに使う（はじめのタップで bgmUnlock が作る）
   - 表：ビルドの SE_SRC・KOE_SRC があればそれ・なければ BGM_SRC の場所（assets/bgm/ か bgm/）から se/・koe/ を作る
   - 消すボタン：S.opt.se === false で効果音・ジングル・声を止める（ボタンとセーブはリーダー） */
const SE_VOL = 0.8, KOE_VOL = 0.95, JG_VOL = 0.8, JG_DUCK = 0.3;
const SE_GAP = 0.06, KOE_GAP = 0.5;   // 同じ効果音・声が続けて重ならないように（秒）
const SE_WET = 0.45, SE_DRY = 0.82, SE_REV_SEC = 1.7;   // 残響「たっぷり」（すこし＝0.22・0.92）
const seA = { out: null, dry: null, rev: null, buf: {}, last: {}, koeAt: -9, koeEnd: 0, koePr: 0, koeTok: 0, koeSrc: null, lastSrc: null, duckTo: 0, pre: false };

function seOn() { return !(typeof S !== 'undefined' && S && S.opt && S.opt.se === false); }
function seCtx() {
  if (typeof bgm === 'undefined' || !bgm.ctx) return null;
  if (!seA.out) { seA.out = bgm.ctx.createGain(); seA.out.gain.value = 1; seA.out.connect(bgm.ctx.destination); }
  return bgm.ctx;
}
/* 残響：インパルス応答はその場で作る（1.7秒・ステレオのノイズを (1−t)^3.2 で減らす・頭の12ミリ秒は0から上げる）。
   効果音とジングルは dry（0.82）と残響（0.45）の両方へ。作れないブラウザは残響なし（dry も 1 のまま） */
function seRev(ctx) {
  if (seA.dry) return seA.dry;
  seA.dry = ctx.createGain(); seA.dry.connect(seA.out);
  try {
    const sr = ctx.sampleRate, n = Math.floor(sr * SE_REV_SEC), up = sr * 0.012, b = ctx.createBuffer(2, n, sr);
    for (let ch = 0; ch < 2; ch++) { const d = b.getChannelData(ch); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 3.2) * (i < up ? i / up : 1); }
    const cv = ctx.createConvolver(), wet = ctx.createGain();
    cv.buffer = b; wet.gain.value = SE_WET; cv.connect(wet); wet.connect(seA.out);
    seA.rev = cv; seA.dry.gain.value = SE_DRY;
  } catch (e) { seA.rev = null; seA.dry.gain.value = 1; }
  return seA.dry;
}
function seSrc(dir, name) {
  const T = dir === 'se' ? (typeof SE_SRC !== 'undefined' ? SE_SRC : null) : dir === 'koe' ? (typeof KOE_SRC !== 'undefined' ? KOE_SRC : null) : (typeof BGM_SRC !== 'undefined' ? BGM_SRC : null);
  if (T && T[name]) return T[name];
  const base = typeof BGM_SRC !== 'undefined' && BGM_SRC.hiru;
  return base ? base.replace(/bgm\/[^/?]*(\?.*)?$/, `${dir}/${name}.mp3`) : null;
}
/* 音を先に読む（11/23 夜 総デバッグ：遊ぶ人の index.html では はじめて鳴らすときに読みに行き 0.2〜2秒おくれていた）。
   音が使えるようになったら（はじめのタップ・sound.js の bgmUnlock）と 音のまとめが届いたら（sndPackLoad）：効果音ぜんぶ（約30こ）→ ほのかの声。夜なら そのシェフの声も（nightWarm） */
const SND_FIRST = ['se/tap', 'se/wipe', 'se/door', 'se/maku', 'se/bell', 'se/kuru', 'se/card', 'koe/hono-ei', 'koe/hono-sore', 'koe/hono-yatta', 'koe/hono-yoshi'];   // すぐ鳴る音（タップ・会話・幕・スタートのベル・切りかえ・朝に焼く声）を先に
function sndWarm() {
  const ctx = seCtx(); if (!ctx) return;
  const se = Object.keys(typeof SE_SRC !== 'undefined' ? SE_SRC : {}), koe = Object.keys(typeof KOE_SRC !== 'undefined' ? KOE_SRC : {}).filter(n => n.startsWith('hono-'));
  const all = [...se.map(n => 'se/' + n), ...koe.map(n => 'koe/' + n)];
  const L = [...SND_FIRST.filter(k => all.includes(k)), ...all.filter(k => !SND_FIRST.includes(k))].filter(k => !seA.buf[k]).map(k => k.split('/'));
  const nFirst = L.filter(([d, n]) => SND_FIRST.includes(d + '/' + n)).length;
  let i = 0; const next = () => {
    if (i >= L.length) return;
    if (i >= nFirst && typeof nwHot !== 'undefined' && nwHot) return setTimeout(next, 400);   // 夜に入って 背景と曲を読んでいるあいだは待つ（battle-fx.js の nightWarm）・すぐ鳴る音は待たない
    const [d, n] = L[i++]; seLoad(d, n).catch(() => {}).finally(next);
  };
  for (let k = 0; k < 3; k++) next();   // 3本ずつ（絵の読みこみと回線を取りあいすぎない）
}
/* 遊ぶ人の index.html：音はタップのあとでないと ほどけないので、はじめのタップの音だけ 先にファイルを読んでおく（11/23 夜・タイトルの「つづきから」の音が0.6秒おくれた） */
const seRawP = {};
function seRaw(dir, name) {
  const k = dir + '/' + name; if (seRawP[k]) return seRawP[k];
  const url = seSrc(dir, name); if (!url) return null;
  seRawP[k] = fetch(url).then(r => { if (!r.ok) throw new Error(url); return r.arrayBuffer(); });
  seRawP[k].catch(() => { delete seRawP[k]; });
  return seRawP[k];
}
function seLoad(dir, name) {
  const k = dir + '/' + name;
  if (seA.buf[k]) return seA.buf[k];
  const url = seSrc(dir, name), ctx = seCtx();
  if (!url || !ctx) return Promise.reject(new Error('no audio'));
  seA.buf[k] = (seRawP[k] || fetch(url).then(r => { if (!r.ok) throw new Error(url); return r.arrayBuffer(); }))
    .then(a => new Promise((ok, ng) => ctx.decodeAudioData(a.slice(0), ok, ng)))
    .catch(e => { delete seA.buf[k]; throw e; });
  return seA.buf[k];
}
/* mp3 の頭のすき間（ブラウザによって残る）だけ飛ばす：音が出はじめる少し前から鳴らす */
function seLead(b) {
  if (b._lead != null) return b._lead;
  const d = b.getChannelData(0), n = Math.min(d.length, 4000); let i = 0;
  while (i < n && Math.abs(d[i]) < 0.002) i++;
  return (b._lead = i >= n ? 0 : Math.max(0, i - 64) / b.sampleRate);
}
function seStart(b, vol, rate, rev) {
  const ctx = seCtx(); if (!ctx) return 0;
  const s = ctx.createBufferSource(), g = ctx.createGain();
  s.buffer = b; s.playbackRate.value = rate || 1; g.gain.value = vol;
  s.connect(g);
  if (rev) { g.connect(seRev(ctx)); if (seA.rev) g.connect(seA.rev); } else g.connect(seA.out);   // 声は残響なし
  s.start(0, seLead(b)); seA.lastSrc = s;
  return (b.duration - seLead(b)) / (rate || 1);
}
function sePlay(name, o = {}) {
  const ctx = seCtx(); if (!ctx || !seOn()) return;
  const t = ctx.currentTime; if (t - (seA.last[name] || -9) < SE_GAP) return;
  seA.last[name] = t;
  seLoad('se', name).then(b => seStart(b, SE_VOL * (o.vol == null ? 1 : o.vol), o.rate, true)).catch(() => {});
}
/* 声は重ねない（11/22 しょーくん「チュートリアルの読み上げセリフと、ショップのセリフが被ってしまっていた」）：
   前の声が鳴りおわるまで 次の声は鳴らさない。ヒントの声（prio 2）は 前の声を止めて読む。声のあいだは曲を少し小さく（bgmDuck） */
function koeBusy() { const ctx = seCtx(); return !!ctx && ctx.currentTime < seA.koeEnd - 0.05; }
function koePlay(id, o = {}) {
  const ctx = seCtx(); if (!ctx || !seOn()) return;
  const t = ctx.currentTime, pr = o.prio || 1;
  if (t - seA.koeAt < KOE_GAP && pr <= seA.koePr) return;
  if (t < seA.koeEnd - 0.05) {
    if (pr <= seA.koePr) {   // 同じ大事さの声が鳴っている：queue なら そのあとに続けて読む（ヒント「ドラッグ！」→「準備ができたら…」・11/22）
      if (o.queue) { const q = { ...o, queue: false }; setTimeout(() => koePlay(id, q), (seA.koeEnd - t) * 1000 + 200); }
      return;
    }
    try { if (seA.koeSrc) seA.koeSrc.stop(); } catch (e) { /* もう止まっている */ }
  }
  const tok = ++seA.koeTok; seA.koeAt = t; seA.koePr = pr; seA.koeEnd = t + 2;   // 読みこむあいだも ほかの声を待たせる
  seLoad('koe', id).then(b => {
    if (tok !== seA.koeTok) return;   // 読んでいるあいだに もっと大事な声が来た
    const dur = seStart(b, KOE_VOL * (o.vol == null ? 1 : o.vol), 1);
    seA.koeSrc = seA.lastSrc; seA.koeEnd = ctx.currentTime + dur;
    if (dur > 0.6 && typeof bgmDuck === 'function') bgmDuck(dur * 1000, 0.55);
  }).catch(() => { if (tok === seA.koeTok) seA.koeEnd = 0; });
}
/* ジングル：鳴っているあいだ、曲（bgm.master）を少し下げて、おわったら戻す */
function jgPlay(name) {
  const ctx = seCtx(); if (!ctx || !seOn()) return;
  seLoad('bgm', name).then(b => {
    const dur = seStart(b, JG_VOL, 1, true), m = bgm.master; if (!m || !dur) return;
    const g = m.gain, t = ctx.currentTime, base = seA.duckTo > t ? BGM_VOL : g.value;
    g.cancelScheduledValues(t); g.setValueAtTime(g.value, t);
    g.linearRampToValueAtTime(base * JG_DUCK, t + 0.15);
    g.setValueAtTime(base * JG_DUCK, t + Math.max(0.2, dur - 0.6));
    g.linearRampToValueAtTime(base, t + dur);
    seA.duckTo = t + dur;
  }).catch(() => {});
}
/* はじめてさわったあと（AudioContext ができたら）、効果音と声を先に読んでおく（ぜんぶで約0.4MB） */
const SE_PRE = ['tap', 'wipe', 'pick', 'drop', 'buy', 'bake', 'done', 'place', 'kanban', 'soroi', 'door', 'heart', 'sale', 'soldout', 'close'];
document.addEventListener('pointerdown', () => {
  if (seA.pre || !seCtx()) return;
  seA.pre = true;
  setTimeout(() => { SE_PRE.forEach(n => seLoad('se', n).catch(() => {})); seLoad('bgm', 'jg-hirameki').catch(() => {}); }, 300);
}, true);
