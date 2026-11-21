/* ==== 効果音・ジングル・掛け声（11/19 昼のチャット【okashi-hiru】・しょーくん「音楽とSEは完璧」） ====
   - 音のファイル：効果音 assets/se/<名前>.mp3（tools/se/make_se.py）・ジングル assets/bgm/jg-*.mp3（tools/bgm/make_bgm_hiru.py）
     ・掛け声 assets/koe/<id>.mp3（声の依頼箱 koe-irai の out/okashi/kakegoe-gemini・11/21〜 Gemini TTS：ほのか Leda・みなも Despina・わかば Achernar。
       1本にまとめた声を tools/koe/split2.py で切り分け・1ことばの声は tools/koe/trim.py・大きさは tools/koe/level.sh で平均 -24dB に）
   - 鳴らす：sePlay(名前, { rate, vol })・jgPlay(名前)（鳴っているあいだ曲を少し下げる）・koePlay(id)
     昼のチャットの画面は morning.js の mSe・mKoe・mJg から（se.js がビルドに入っていないときは何もしない）
   - AudioContext は sound.js の bgm.ctx をいっしょに使う（はじめのタップで bgmUnlock が作る）
   - 表：ビルドの SE_SRC・KOE_SRC があればそれ・なければ BGM_SRC の場所（assets/bgm/ か bgm/）から se/・koe/ を作る
   - 消すボタン：S.opt.se === false で効果音・ジングル・声を止める（ボタンとセーブはリーダー） */
const SE_VOL = 0.8, KOE_VOL = 0.95, JG_VOL = 0.8, JG_DUCK = 0.3;
const SE_GAP = 0.06, KOE_GAP = 0.5;   // 同じ効果音・声が続けて重ならないように（秒）
const seA = { out: null, buf: {}, last: {}, koeAt: -9, duckTo: 0, pre: false };

function seOn() { return !(typeof S !== 'undefined' && S && S.opt && S.opt.se === false); }
function seCtx() {
  if (typeof bgm === 'undefined' || !bgm.ctx) return null;
  if (!seA.out) { seA.out = bgm.ctx.createGain(); seA.out.gain.value = 1; seA.out.connect(bgm.ctx.destination); }
  return bgm.ctx;
}
function seSrc(dir, name) {
  const T = dir === 'se' ? (typeof SE_SRC !== 'undefined' ? SE_SRC : null) : dir === 'koe' ? (typeof KOE_SRC !== 'undefined' ? KOE_SRC : null) : (typeof BGM_SRC !== 'undefined' ? BGM_SRC : null);
  if (T && T[name]) return T[name];
  const base = typeof BGM_SRC !== 'undefined' && BGM_SRC.hiru;
  return base ? base.replace(/bgm\/[^/?]*(\?.*)?$/, `${dir}/${name}.mp3`) : null;
}
function seLoad(dir, name) {
  const k = dir + '/' + name;
  if (seA.buf[k]) return seA.buf[k];
  const url = seSrc(dir, name), ctx = seCtx();
  if (!url || !ctx) return Promise.reject(new Error('no audio'));
  seA.buf[k] = fetch(url).then(r => { if (!r.ok) throw new Error(url); return r.arrayBuffer(); })
    .then(a => new Promise((ok, ng) => ctx.decodeAudioData(a, ok, ng)))
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
function seStart(b, vol, rate) {
  const ctx = seCtx(); if (!ctx) return 0;
  const s = ctx.createBufferSource(), g = ctx.createGain();
  s.buffer = b; s.playbackRate.value = rate || 1; g.gain.value = vol;
  s.connect(g); g.connect(seA.out); s.start(0, seLead(b));
  return (b.duration - seLead(b)) / (rate || 1);
}
function sePlay(name, o = {}) {
  const ctx = seCtx(); if (!ctx || !seOn()) return;
  const t = ctx.currentTime; if (t - (seA.last[name] || -9) < SE_GAP) return;
  seA.last[name] = t;
  seLoad('se', name).then(b => seStart(b, SE_VOL * (o.vol == null ? 1 : o.vol), o.rate)).catch(() => {});
}
function koePlay(id, o = {}) {
  const ctx = seCtx(); if (!ctx || !seOn()) return;
  const t = ctx.currentTime; if (t - seA.koeAt < KOE_GAP) return;   // 声は重ねない
  seA.koeAt = t;
  seLoad('koe', id).then(b => seStart(b, KOE_VOL * (o.vol == null ? 1 : o.vol), 1)).catch(() => {});
}
/* ジングル：鳴っているあいだ、曲（bgm.master）を少し下げて、おわったら戻す */
function jgPlay(name) {
  const ctx = seCtx(); if (!ctx || !seOn()) return;
  seLoad('bgm', name).then(b => {
    const dur = seStart(b, JG_VOL, 1), m = bgm.master; if (!m || !dur) return;
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
