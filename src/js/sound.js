/* ==== 音：BGM（11/19 司令塔の見本2曲・11/21〜 昼と夜は Lyria の曲） ====
   - 曲は assets/bgm/。ビルドが名前→場所の表 BGM_SRC を入れる
   - Web Audio のループで鳴らす（<audio loop> はつなぎ目でプツッとなることがある）
   - スマホはさわる前に鳴らせないので、はじめのタップのあとで鳴らしはじめる
   - タイトルとプロローグ＝title・朝＝asa・まとめ＝matome（コードで作った曲・11/19 H-034）
   - 昼のお店＝hiru／hiru-2、夜＝yoru-<シェフ>（-2）（11/21 司令塔・koe-irai の Lyria:lyria-3.5 のループ版・しょーくん「音楽全て完璧すぎ」）。
     2本ある曲は日ごとに交代（偶数の日が -2）。夜はその夜のシェフの曲（ほのか＝A・みなも＝C・わかば＝B）。わかばの2本めも しょーくんが聞いて OK（11/21）
   - 夜市のページ＝ichi（11/23 しょーくん「ベルタのシーンは専用の音楽」→ ランタンの夜市の A・koe-irai の requests/okashi/bgm-ichi.yml。B は koe-irai の kept/） */
const BGM_LOOP = {   // 1ループの秒（Lyria は manifest.json の loop.samples ÷ 44100）
  title: 28.8, asa: 32.0, matome: 26.6667,
  hiru: 2540164 / 44100, 'hiru-2': 2540165 / 44100,
  'yoru-honoka': 2540159 / 44100, 'yoru-honoka-2': 2822399 / 44100,
  'yoru-minamo': 4671514 / 44100, 'yoru-minamo-2': 2419195 / 44100,
  'yoru-wakaba': 2419195 / 44100, 'yoru-wakaba-2': 3189724 / 44100,
  ichi: 2540154 / 44100,
  raiten: 2963517 / 44100,   // 来店（閉じた幕の前）＝夜市でえらばなかった B（11/23 しょーくん「夜市の使わなかったBを使いまわせないかな？」）
};
const BGM_VOL = 0.22;   // 11/22 しょーくん「BGMが大きすぎてセリフが聞き取れなかった・今の半分くらい」（前は 0.45）
const BGM_FADE = 0.6;
const bgm = { ctx: null, master: null, raw: {}, buf: {}, fail: {}, want: '', cur: '', src: null, gain: null };
/* 曲の場所：ためしのページの大きい曲は BGM_BIG（まとめ snd-pack.mp3 に入れない・build.mjs）。BGM_SRC に入れないのは、se.js が BGM_SRC.hiru の場所から se/・koe/ をさがすため */
const bgmUrl = n => BGM_SRC[n] || (typeof BGM_BIG !== 'undefined' && BGM_BIG[n]) || '';

/* 2本ある曲は日ごとに交代 */
const bgmTake = n => (S && S.day % 2 === 0 && bgmUrl(n + '-2')) ? n + '-2' : n;
/* 夜の曲：その夜のシェフ（夕方にえらぶまでは きのうまでのビルド S.build） */
function bgmNight(build) {
  let c = 'honoka';
  try { c = (CHEFS[BUILDS[build || (N && N.build) || S.build || 'cookie'].chef] || {}).art || 'honoka'; } catch (e) { /* ほのか */ }
  return bgmTake('yoru-' + c);
}
/* 曲えらび：せっていで BGM を消したら ''（止める） */
function bgmName() {
  if (!S || (S.opt && S.opt.bgm === false)) return '';
  const ph = S.phase; return ph === 'night' ? (N && N.stage === 'ichi' && bgmUrl('ichi') ? 'ichi' : N && (N.stage === 'arrive' || N.stage === 'pick') && bgmUrl('raiten') ? 'raiten' : bgmNight()) : ph === 'morning' ? 'asa' : ph === 'day' ? bgmTake('hiru') : ph === 'result' ? 'matome' : 'title';
}
/* 次に鳴る曲（裏で先に読んでおく・code-rules の C）：朝 → 昼のお店・昼 → 夜 */
function bgmNext() {
  const ph = S && S.phase, ichi = () => { try { return S.day > 1 && ichiStock().items.length > 0; } catch (e) { return false; } };   // 夜市に寄る夜は 夜市の曲から
  const raiten = b => bgmUrl('raiten') ? 'raiten' : bgmNight(b);   // 来店（幕の前）の曲 → おもてなしだ！のあと 夜の曲（11/23）
  const st = ph === 'night' && N ? N.stage : '';
  return ph === 'morning' ? bgmTake('hiru') : ph === 'day' ? (ichi() ? 'ichi' : raiten(S.build)) : st === 'ichi' ? raiten() : st === 'arrive' || st === 'pick' ? bgmNight() : '';
}
function bgmUnlock() {
  if (bgm.ctx) { if (bgm.ctx.state === 'suspended' && !document.hidden) bgm.ctx.resume(); return; }
  const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
  try { bgm.ctx = new AC(); } catch (e) { return; }
  bgm.master = bgm.ctx.createGain(); bgm.master.gain.value = BGM_VOL; bgm.master.connect(bgm.ctx.destination);
  if (bgm.ctx.state === 'suspended') bgm.ctx.resume();
  bgmSync();
  setTimeout(() => { if (typeof sndWarm === 'function') sndWarm(); }, 1200);   // 効果音と声を先に読む（11/23 夜）
}
/* ファイルを読む（まだ鳴らさない）。夜の曲は 0.6〜1.3MB あるので、前の場面のうちに読んでおく（battle-fx.js の nightWarm からも） */
function bgmFetch(name) {
  if (!name || !bgmUrl(name)) return null;
  if (!bgm.raw[name]) bgm.raw[name] = fetch(bgmUrl(name)).then(r => { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); })
    .catch(e => { delete bgm.raw[name]; throw e; });
  return bgm.raw[name];
}
function bgmWarm(name) { const P = bgmFetch(name); if (P) P.catch(() => {}); }
/* 読みこめなかったら、10秒たつまで読みなおさない（11/19 点検：読めない所ではタップのたびに読みに行き、夜1回で179回になっていた）。
   ほどいた曲（1分で約20MB）は、いま鳴っている曲と、これから鳴らす曲だけ持つ */
function bgmLoad(name, done) {
  if (bgm.buf[name]) return done(bgm.buf[name]);
  if (!bgmUrl(name)) return;   // ためしのページで、音のまとめ（snd-pack.mp3）をまだ読んでいる
  if (bgm.buf[name] === 0) return;   // 読みこみ中
  if (Date.now() - (bgm.fail[name] || 0) < 10000) return;
  bgm.buf[name] = 0;
  bgmFetch(name).then(a => new Promise((ok, ng) => bgm.ctx.decodeAudioData(a.slice(0), ok, ng)))
    .then(b => { for (const k of Object.keys(bgm.buf)) if (k !== bgm.cur && k !== name && bgm.buf[k]) delete bgm.buf[k]; bgm.buf[name] = b; if (bgm.want === name) done(b); })
    .catch(() => { delete bgm.buf[name]; bgm.fail[name] = Date.now(); if (bgm.want === name) bgm.want = ''; });
}
/* mp3 の頭のすき間（エンコーダーの 1105 サンプル・44.1kHz）が残っているブラウザ（Safari など）では、そこを外してループする。Chrome は外して読む */
function bgmStart(name, b) {
  if (bgm.want !== name || bgm.cur === name) return;
  bgmFadeOut();
  const t = bgm.ctx.currentTime, L = BGM_LOOP[name] || b.duration;
  const src = bgm.ctx.createBufferSource(), g = bgm.ctx.createGain();
  src.buffer = b; src.loop = true;
  const lead = b.duration - L > 0.02 ? 1105 / 44100 : 0;
  src.loopStart = lead; src.loopEnd = Math.min(b.duration, lead + L);
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(1, t + BGM_FADE);
  src.connect(g); g.connect(bgm.master); src.start(t, lead);
  bgm.src = src; bgm.gain = g; bgm.cur = name;
}
/* 大きい一撃のスロー（11/21 夜）：曲を少しのあいだ小さく → ドーンのあとで ゆっくりもどす */
function bgmDuck(ms, to = 0.25) {
  if (!bgm.ctx || !bgm.master) return;
  const g = bgm.master.gain, t = bgm.ctx.currentTime;
  g.cancelScheduledValues(t); g.setValueAtTime(g.value, t); g.linearRampToValueAtTime(BGM_VOL * to, t + 0.25);
  g.setValueAtTime(BGM_VOL * to, t + ms / 1000); g.linearRampToValueAtTime(BGM_VOL, t + ms / 1000 + 1.4);
}
function bgmFadeOut() {
  if (!bgm.src) return;
  const t = bgm.ctx.currentTime, s = bgm.src, g = bgm.gain;
  g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(g.gain.value, t); g.gain.linearRampToValueAtTime(0, t + BGM_FADE);
  try { s.stop(t + BGM_FADE + 0.05); } catch (e) { /* もう止まっている */ }
  bgm.src = null; bgm.gain = null; bgm.cur = '';
}
/* 画面が変わったら呼ぶ（main.js の render とタップのあと）。同じ曲ならなにもしない */
function bgmSync() {
  if (typeof BGM_SRC === 'undefined') return;
  bgmWarm(bgmNext());
  if (!bgm.ctx) return;
  const name = bgmName();
  if (!name) { bgm.want = ''; bgmFadeOut(); return; }
  if (bgm.want === name && (bgm.cur === name || bgm.buf[name] === 0)) return;
  bgm.want = name;
  bgmLoad(name, b => bgmStart(name, b));
}
/* ためしのページ（アーティファクト）は、曲・効果音・声を1つのファイル snd-pack.mp3（mp3 をつなげたもの）にまとめて出す（11/19：1つの版に511ファイルまでで入らなかった・tools/build.mjs）。
   1つずつ blob の URL にして BGM_SRC・SE_SRC・KOE_SRC に入れる（se.js はその表を見る）。遊ぶ人の index.html は SND_PACK が null。
   11/23 総デバッグ：読みはじめは タイトルの絵が出てから（core.js の artBlobs の end・タイトルの絵と回線を取りあわない）。届いたら bgmSync で鳴りはじめる */
function sndPackLoad(after) {   // after＝読みおわったら（読めなくても）
  if (!(typeof SND_PACK !== 'undefined' && SND_PACK) || sndPackLoad.on) return after && after(); sndPackLoad.on = 1;
  fetch(SND_PACK.url).then(r => { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); }).then(a => {
    const T = { bgm: BGM_SRC, se: typeof SE_SRC !== 'undefined' ? SE_SRC : {}, koe: typeof KOE_SRC !== 'undefined' ? KOE_SRC : {} };
    for (const [k, [o, l]] of Object.entries(SND_PACK.items)) { const [d, n] = k.split('/'); if (T[d]) T[d][n] = URL.createObjectURL(new Blob([a.slice(o, o + l)], { type: 'audio/mpeg' })); }
    bgm.fail = {}; bgm.want = ''; bgmSync(); if (typeof sndWarm === 'function') sndWarm();
  }).catch(() => {}).finally(() => { if (after) after(); });
}
document.addEventListener('pointerdown', bgmUnlock, true);
document.addEventListener('visibilitychange', () => {
  if (!bgm.ctx) return;
  if (document.hidden) bgm.ctx.suspend(); else bgm.ctx.resume();
});
