/* ==== 音：BGM（11/19 司令塔の見本2曲・しょーくん「このまま採用できるレベル」） ====
   - 曲は assets/bgm/（作り方は tools/bgm/README.md）。ビルドが名前→場所の表 BGM_SRC を入れる
   - Web Audio のループで鳴らす（<audio loop> はつなぎ目でプツッとなることがある）
   - スマホはさわる前に鳴らせないので、はじめのタップのあとで鳴らしはじめる
   - 昼の曲（hiru）：タイトル・プロローグ・朝・昼・まとめ／夜の曲（yoru）：夜（夕方の会話・ショップ・バトル） */
const BGM_LOOP = { hiru: 38.4, yoru: 25.6 };   // 1ループの秒（100BPM・150BPM の16小節）
const BGM_VOL = 0.45;
const BGM_FADE = 0.6;
const bgm = { ctx: null, master: null, buf: {}, fail: {}, want: '', cur: '', src: null, gain: null };

function bgmName() { return S && S.phase === 'night' ? 'yoru' : 'hiru'; }
function bgmUnlock() {
  if (bgm.ctx) { if (bgm.ctx.state === 'suspended' && !document.hidden) bgm.ctx.resume(); return; }
  const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
  try { bgm.ctx = new AC(); } catch (e) { return; }
  bgm.master = bgm.ctx.createGain(); bgm.master.gain.value = BGM_VOL; bgm.master.connect(bgm.ctx.destination);
  if (bgm.ctx.state === 'suspended') bgm.ctx.resume();
  bgmSync();
}
/* 読みこめなかったら、10秒たつまで読みなおさない（11/19 点検：読めない所ではタップのたびに読みに行き、夜1回で179回になっていた） */
function bgmLoad(name, done) {
  if (bgm.buf[name]) return done(bgm.buf[name]);
  if (bgm.buf[name] === 0) return;   // 読みこみ中
  if (Date.now() - (bgm.fail[name] || 0) < 10000) return;
  bgm.buf[name] = 0;
  fetch(BGM_SRC[name]).then(r => { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); })
    .then(a => new Promise((ok, ng) => bgm.ctx.decodeAudioData(a, ok, ng)))
    .then(b => { bgm.buf[name] = b; if (bgm.want === name) done(b); })
    .catch(() => { delete bgm.buf[name]; bgm.fail[name] = Date.now(); if (bgm.want === name) bgm.want = ''; });
}
/* mp3 の頭のすき間（エンコーダーの 1105 サンプル）が残っているブラウザでは、そこを外してループする */
function bgmStart(name, b) {
  if (bgm.want !== name || bgm.cur === name) return;
  bgmFadeOut();
  const t = bgm.ctx.currentTime, L = BGM_LOOP[name] || b.duration;
  const src = bgm.ctx.createBufferSource(), g = bgm.ctx.createGain();
  src.buffer = b; src.loop = true;
  const lead = b.duration - L > 0.02 ? 1105 / b.sampleRate : 0;
  src.loopStart = lead; src.loopEnd = Math.min(b.duration, lead + L);
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(1, t + BGM_FADE);
  src.connect(g); g.connect(bgm.master); src.start(t, lead);
  bgm.src = src; bgm.gain = g; bgm.cur = name;
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
  if (!bgm.ctx || typeof BGM_SRC === 'undefined') return;
  const name = bgmName();
  if (bgm.want === name && (bgm.cur === name || bgm.buf[name] === 0)) return;
  bgm.want = name;
  bgmLoad(name, b => bgmStart(name, b));
}
document.addEventListener('pointerdown', bgmUnlock, true);
document.addEventListener('visibilitychange', () => {
  if (!bgm.ctx) return;
  if (document.hidden) bgm.ctx.suspend(); else bgm.ctx.resume();
});
