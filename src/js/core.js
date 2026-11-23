/* ==== 土台：小さな道具・ドット絵・セーブ・お知らせ ==== */
const KEY = 'mazemaze-okashiya', VER = 5;   // v:3 までは前の経営シミュレーション（読まずに新しく始める）。v:4（夜→朝→昼）は sanitize で v:5 の朝にする
const $ = id => document.getElementById(id);
const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
const rand = n => Math.floor(Math.random() * n);
const pick = a => a[rand(a.length)];
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = rand(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const REDUCED = (() => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } })();
/* アプリ（iOS の ios-kobo は index.html を file:// で開く）：fetch がファイルを読めないとき、XMLHttpRequest で読みなおす（11/22 リリース前の点検）。
   曲・効果音・声は fetch → decodeAudioData なので、読めないと音が出ない。http(s) のページ（ゲーム工房・ためしのページ）では何もしない */
if (location.protocol === 'file:' && window.XMLHttpRequest) {
  const nf = window.fetch ? window.fetch.bind(window) : null;
  const xhr = u => new Promise((ok, ng) => {
    const x = new XMLHttpRequest(); x.open('GET', String(u)); x.responseType = 'arraybuffer';
    x.onload = () => (x.status === 200 || x.status === 0) && x.response && x.response.byteLength ? ok({ ok: true, status: 200, arrayBuffer: () => Promise.resolve(x.response) }) : ng(new Error('xhr ' + x.status));
    x.onerror = () => ng(new Error('xhr')); x.send();
  });
  window.fetch = (u, o) => (nf ? nf(u, o).then(r => r.ok ? r : Promise.reject(new Error(r.status))) : Promise.reject(new Error('no fetch'))).catch(() => xhr(u));
}

/* 絵（11/19〜）：ART は 名前 → assets/art/<ファイル>?v=… の表（tools/build.mjs）。絵はページに埋めこまず、使うときにブラウザが読む。
   起動のときは、どの画面にも出る UI の絵（ui-*）とタイトルの絵（title-*）だけ先に読んでおく（待つのは長くて1.5秒） */
/* 起動で待つのはタイトルの絵（title-*）とタイトルのボタンの皮（.big＝ui-btn-red・.sub＝ui-btn-wood）だけ（11/19 H-031 しょーくん「描写までの表示を爆速に」）。
   ほかの ui-*（夜の札・カードのふち・紋章など約80まい）は、タイトルが出てから ひまなときに読む（artWarm） */
const ART_FIRST = /^(title-|ui-btn-(red|wood)$|ui-pill-cream$|ui-strip$)/;   // ui-pill-cream＝タイトルの「せってい」（11/23）・ui-strip＝「よみこみ中…」の札の皮（11/23 夜）。この4まいの ui は ためしのページでも まとめに入れない（tools/build.mjs の TITLE_UI）
/* ためしのページの まとめファイル（art-pack2＝朝昼の絵・art-pack3＝まぜた先のカードの絵）を読んで、1まいずつ blob の URL にする。
   11/21 夜（しょーくん「軽量化と最適化」）：art-pack2 は起動の絵が出てから（タイトルと同時に読むと起動がおそい）・art-pack3 は夜の先読みのとき */
function artPackLoad(P, flag, after) {
  if (!P || artBlobs[flag]) return; artBlobs[flag] = 1;
  fetch(P.url).then(r => { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); }).then(a => {
    for (const [k, [o, l, t]] of Object.entries(P.items)) ART[k] = URL.createObjectURL(new Blob([a.slice(o, o + l)], { type: t }));
    if (after) after();
  }).catch(() => { artBlobs[flag] = 0; });
}
const artPack2 = () => artPackLoad(typeof ART_PACK2 !== 'undefined' && ART_PACK2, 'pk2', () => {   // 届いたら いまの画面を描きなおす
  if (typeof S !== 'undefined' && S && ['morning', 'day', 'result'].includes(S.phase) && typeof render === 'function' && !(typeof talking === 'function' && talking())) render();
});
const artPack3 = () => artPackLoad(typeof ART_PACK3 !== 'undefined' && ART_PACK3, 'pk3', () => {   // 夜のショップなら描きなおす（バトル中・会話中はそのまま＝次に描くときに出る）
  if (typeof S !== 'undefined' && S && S.phase === 'night' && typeof N !== 'undefined' && N && N.stage === 'shop' && !(typeof fighting !== 'undefined' && fighting) && !(typeof curtainT !== 'undefined' && curtainT) && !(typeof busy !== 'undefined' && busy) && !(typeof talking === 'function' && talking()) && typeof render === 'function') render();
});
/* ためしのページ（アーティファクト）は、ui-*・fx-* の絵が1つのファイル art-pack.webp（11/19・1つの版に511ファイルまで・2.9MB）。
   11/23 総デバッグ（しょーくん「ロード時間の短縮」）：起動はこれを待たない。タイトルは ART_FIRST（タイトルの絵と ui 3まい＝まとめの外）だけで出し、
   まとめと音（snd-pack）はタイトルが出てから読む（回線を取りあわない）。届くまで「つづきから」「はじめから」は待つ（artPackWait・main.js の ACTS） */
const artPackOn = () => typeof ART_PACK !== 'undefined' && !!ART_PACK;
/* その絵がもう使えるか：ためしのページで まとめ（art-pack・2・3）の中の絵は、届いて blob の URL になるまで使えない（1まいずつのファイルは出していない＝読みに行くと 404）。
   先読み（dPreload・nightWarm）と CSS の変数（uiVars）は、使えない絵をとばす（11/23 総デバッグ） */
const artReady = k => {
  const u = ART[k]; if (!u) return false; if (String(u).startsWith('blob:')) return true;
  for (const P of [typeof ART_PACK !== 'undefined' && ART_PACK, typeof ART_PACK2 !== 'undefined' && ART_PACK2, typeof ART_PACK3 !== 'undefined' && ART_PACK3]) if (P && P.items[k]) return false;
  return true;
};
function artPackWait(fn) {   // まとめが届いたら（読めなくても8秒で）fn。連打しても1回だけ。遊ぶ人の index.html は UI の絵（ui-*）がそろうまで（11/23 夜）
  if (artPackOn() ? artBlobs.pkOk : (!artBlobs.uiP || artBlobs.uiOk)) return fn();
  artPackWait.fn = fn; toast('よみこみ中…', 8000);   // 押したのが分かるように（届いたら消す）
}
function artPackDone() {
  if (artBlobs.pkOk) return; artBlobs.pkOk = 1; uiVars();
  const f = artPackWait.fn; artPackWait.fn = null; if (f) { const el = $('toast'); if (el) el.hidden = true; f(); }
}
function artBlobs(done) {
  let fin = false, left = 0; const later = [];
  const nightBoot = () => { if (typeof nightWarm === 'function') nightWarm((typeof S !== 'undefined' && S && S.build) || 'cookie'); };   // 夜の絵も、タイトルのあと ひまなときに先読み（11/20）
  const end = () => {
    if (fin) return; fin = true; uiVars();
    if (!artPackOn()) {   // 遊ぶ人の index.html（絵は1まいずつのファイル）：UI の絵を読んで、そろうまで「つづきから」は待つ（11/23 夜 総デバッグ：つづきから 夜にもどると UI の皮が1〜2秒おくれて出ていた）
      done(); setTimeout(artPack2, 400);
      if (typeof seRaw === 'function') for (const n of ['tap', 'wipe']) { const p = seRaw('se', n); if (p) p.catch(() => {}); }   // はじめのタップの音（se.js）
      const ok = () => { if (artBlobs.uiOk) return; artBlobs.uiOk = 1; const f = artPackWait.fn; artPackWait.fn = null; if (f) { const el = $('toast'); if (el) el.hidden = true; f(); } };
      const ld = u => new Promise(r => { const im = new Image(); im.onload = im.onerror = () => r(); im.src = u; });   // 読むだけ（ほどくのは出すとき・アプリの起動を重くしない）
      artBlobs.uiP = Promise.all(later.map(k => ld(ART[k]))); artBlobs.uiP.then(ok); setTimeout(ok, 8000);
      artBlobs.nb = () => { if (artBlobs.nbOn) return; artBlobs.nbOn = 1; nightBoot(); };   // 夜の絵（約10MB）は 朝の絵と曲のあと＝昼になったら（flow.js の goDay）か 25秒あと
      setTimeout(artBlobs.nb, 25000); return;
    }
    setTimeout(() => { try { done(); } catch (e) { console.error(e); } }, 0);   // タイトルを描く（下の まとめの読みはじめのあと・こけても まとめは読む）
    fetch(ART_PACK.url).then(r => { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); }).then(a => {
      for (const [k, [o, l, t]] of Object.entries(ART_PACK.items)) ART[k] = URL.createObjectURL(new Blob([a.slice(o, o + l)], { type: t }));
      if (artBlobs.pkOk) uiVars(); else artPackDone();   // 待ちきれずに始めていたら、あとから皮を入れなおす
      artWarm(Object.keys(ART_PACK.items).filter(k => k.startsWith('ui-')));
    }).catch(() => artPackDone()).finally(() => {   // 音のまとめ（sound.js）・朝昼のまとめ・夜の先読みは そのあと（「つづきから」を待たせるのは UI のまとめだけ）
      const next = () => { setTimeout(artPack2, 100); setTimeout(nightBoot, 2000); };   // 回線を分けあわないように1つずつ：UI → 音 → 朝昼の絵 → 夜の先読み
      if (typeof sndPackLoad === 'function') sndPackLoad(next); else next();
    });
    setTimeout(artPackDone, 8000);   // 読めなくても始める
  };
  try {
    for (const k of Object.keys(ART)) {
      if (ART_FIRST.test(k)) { left++; const im = new Image(); im.onload = im.onerror = () => { if (--left <= 0) end(); }; im.src = ART[k]; }
      else if (k.startsWith('ui-')) later.push(k);
    }
  } catch (e) { /* 読めなくても始める */ }
  if (!left) end(); else setTimeout(end, 1500);
}
function artWarm(names) {
  const go = () => { for (const k of names) { try { const im = new Image(); im.decoding = 'async'; im.src = ART[k]; } catch (e) { /* 読めなくてもよい */ } } };
  if (window.requestIdleCallback) requestIdleCallback(go, { timeout: 1500 }); else setTimeout(go, 200);
}

/* UI の絵（ui-* の名前の絵）を CSS の変数 --ui-<名前> に入れる。style.css の「UI の絵」が border-image に使う（昼の画面も同じ変数） */
function uiVars() {
  const st = document.documentElement.style;
  for (const k of Object.keys(ART)) if (k.startsWith('ui-') && artReady(k)) st.setProperty('--' + k, `url("${ART[k]}")`);
}

/* 大きな数字：10万からは「万・億・兆・京」 */
function fmt(n) {
  n = Math.floor(n);
  if (n < 1e5) return n.toLocaleString('ja-JP');
  const units = [[1e16, '京'], [1e12, '兆'], [1e8, '億'], [1e4, '万']];
  for (const [u, s] of units) if (n >= u) {
    const v = n / u;
    return (v >= 1000 ? Math.floor(v).toLocaleString('ja-JP') : v >= 100 ? Math.floor(v) : v >= 10 ? (Math.floor(v * 10) / 10) : (Math.floor(v * 100) / 100)) + s;
  }
  return String(n);
}

/* ---------- ドット絵（前の版から） ---------- */
function fromMap(map, pal) {
  const h = map.length, w = Math.max(...map.map(r => r.length)), c = mk(w, h), x = c.getContext('2d');
  for (let j = 0; j < h; j++) for (let i = 0; i < map[j].length; i++) {
    const k = map[j][i];
    if (k === '.' || !pal[k]) continue;
    x.fillStyle = pal[k]; x.fillRect(i, j, 1, 1);
  }
  return c;
}
function outline(src, col) {
  const w = src.width, h = src.height, d = src.getContext('2d').getImageData(0, 0, w, h).data;
  const a = (i, j) => (i < 0 || j < 0 || i >= w || j >= h) ? 0 : d[(j * w + i) * 4 + 3];
  const c = mk(w, h), x = c.getContext('2d');
  x.fillStyle = col;
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    if (a(i, j)) continue;
    if (a(i - 1, j) || a(i + 1, j) || a(i, j - 1) || a(i, j + 1)) x.fillRect(i, j, 1, 1);
  }
  x.drawImage(src, 0, 0);
  return c;
}
function big(src, s) {
  const c = mk(src.width * s, src.height * s), x = c.getContext('2d');
  x.imageSmoothingEnabled = false; x.drawImage(src, 0, 0, c.width, c.height);
  return c.toDataURL();
}

/* ---------- 状態とセーブ ---------- */
let S = null;
function newState() {
  return {
    v: VER, day: 1, phase: 'title', money: START_MONEY, chef: 'honoka', build: 'cookie',   // build＝前の夜にえらんだビルド（BUILDS・11/18）
    recipes: { 'komugi+sato': 0 }, // 知っているレシピ（値は朝にひらめいた日。0 は最初から）
    stock: {},                     // 倉庫：素材の id → 数（モンスター素材も、朝に仕入れた基本素材も。使うとへる）
    shelf: [], shelfMax: 6,        // 棚のお菓子 [{ key, n }]・棚のマスの数（ショーケースでふえる）
    goods: {},                     // お店のグッズの持ち物：グッズの id → 数（看板・ショーケース・かざり。中身は昼のチャットの hiru.js）
    rep: 0,                        // お店の評判（昼のハートでたまる。まとめのハートのびん）
    hearts: {}, regulars: [],      // お客さんのハートと常連さん（前の昼の形）
    seenMon: [],                   // 来たことのあるモンスター（はじめて来た日は newMon）
    seen: {},                      // 見た物語の場面（prologue など）
    kaiso: 0, best: {},            // お店の改装の段（0〜10・world.js の KAISO）・ビルドごとの自己ベスト（11/22）
    night: null, morning: null, dayRun: null,
    today: null, yesterday: null,  // 1日の記録（newDay）と、きのうの記録
    opt: { bgm: true, se: true },  // せってい（11/19 H-034・しょーくん「タイトルとまとめの画面だけ」）：BGM・効果音（声とジングルもふくむ）
  };
}
/* 1日の記録（H-008）：朝のはじめに作る。朝のひとり言（昼のチャット）とまとめの日記で使う */
function newDay(day) {
  return {
    day,
    visitors: 0, served: 0, sales: 0,       // 昼：来たお客さん・買った人・売上（円）
    flashes: [], made: [],                  // 朝：ひらめいたレシピ・作ったお菓子（レシピの key）
    kanban: null, kanbanSoldOut: false,     // 昼：看板のお菓子（レシピの key）・売り切れたか
    hearts: 0, newRegulars: [],             // 昼：もらったハート
    mon: null, newMon: false,               // 夜：来たモンスターの id・はじめて来たか
    score: 0, belly: 0, mood: 0,            // 夜：味パワーの合計・おなかいっぱいの量・満足（0 まだ・1 ちょっと満足・2 満足・3 大満足）
    gifts: {}, coins: 0,                    // 夜：もらった素材（id → 数）・お礼のコイン（円）
  };
}
function sanitize(o) {
  if (!o || typeof o !== 'object') return null;
  if (o.v === 4) o = fromV4(o);
  if (o.v !== VER) return null;
  const d = newState();
  for (const k in d) if (o[k] === undefined) o[k] = d[k];
  for (const k of ['shelf', 'seenMon', 'regulars']) if (!Array.isArray(o[k])) o[k] = [];
  for (const k of ['stock', 'goods', 'seen', 'hearts', 'recipes', 'best']) if (!o[k] || typeof o[k] !== 'object') o[k] = {};
  if (!Number.isFinite(o.day) || o.day < 1) o.day = 1;
  for (const k of ['money', 'rep', 'shelfMax']) if (!Number.isFinite(o[k])) o[k] = d[k];
  o.kaiso = Number.isFinite(o.kaiso) ? Math.max(0, Math.min(10, Math.floor(o.kaiso))) : 0;
  if (!BUILDS[o.build]) o.build = 'cookie';
  if (!o.opt || typeof o.opt !== 'object') o.opt = {};
  for (const k of ['bgm', 'se']) o.opt[k] = o.opt[k] !== false;
  /* レシピと棚はいまの材料だけ。倉庫は数が正しい物だけ（基本素材の id は昼のチャットの hiru.js なので、名前ではけさない） */
  const okMat = m => MATS[m] || (typeof HIRU_MATS !== 'undefined' && HIRU_MATS[m]);   // 夜の素材と朝昼の素材（H-010）
  const okKey = k => typeof k === 'string' && k.split('+').length === 2 && k.split('+').every(okMat);
  for (const k in o.recipes) if (!okKey(k)) delete o.recipes[k];
  if (!Object.keys(o.recipes).length) o.recipes = { 'komugi+sato': 0 };
  o.shelf = o.shelf.filter(s => s && okKey(s.key));
  for (const m in o.stock) if (!Number.isFinite(o.stock[m]) || o.stock[m] <= 0) delete o.stock[m];
  for (const k of ['today', 'yesterday']) if (o[k]) {
    o[k] = Object.assign(newDay(o[k].day || o.day), o[k]);
    o[k].flashes = (o[k].flashes || []).filter(okKey); o[k].made = (o[k].made || []).filter(okKey);
  }
  if (o.phase !== 'title' && !o.today) o.today = newDay(o.day);
  if (o.morning && o.morning.cur && !okKey(o.morning.cur)) o.morning.cur = null;
  return o;
}
/* v:4（1日が 夜→朝→昼→まとめ）のセーブ：お金・レシピ・倉庫・棚・ハートはそのまま、その日の朝からはじめる */
function fromV4(o) {
  const n = Object.assign(newState(), {
    day: o.day || 1, money: Number.isFinite(o.money) ? o.money : START_MONEY, recipes: o.recipes || {}, stock: o.stock || {},
    shelf: o.shelf || [], hearts: o.hearts || {}, regulars: o.regulars || [], seen: { prologue: 1 },
  });
  n.phase = 'morning'; n.today = newDay(n.day);
  return n;
}
/* タイトルの形（phase 'title'）のセーブは、ないのと同じ（11/23 総デバッグ：前はタイトルの「せってい」でオンオフすると、
   タイトルの空の状態がセーブの上に書かれて、つづきからを押してもタイトルにもどり・はじめからも出なくなった） */
function load() {
  try { const t = localStorage.getItem(KEY), o = t ? JSON.parse(t) : null; return o && o.phase !== 'title' ? sanitize(o) : null; } catch (e) { return null; }
}
function save() {
  try {
    if (S.phase === 'title') {   // タイトルでは あそんでいる記録を書きかえない。せってい（BGM・効果音）だけ、いまのセーブに入れる
      const t = localStorage.getItem(KEY), o = t ? JSON.parse(t) : null;
      if (o && o.phase !== 'title') { o.opt = { ...(o.opt || {}), ...S.opt }; localStorage.setItem(KEY, JSON.stringify(o)); }
      else localStorage.setItem(KEY + '-opt', JSON.stringify(S.opt));   // まだ遊んでいない人のせっていは べつのキーに（はじめるで引きつぐ・11/23 仕上げの点検）
      return;
    }
    localStorage.setItem(KEY, JSON.stringify(S));
  } catch (e) { /* 保存できない環境ではそのまま遊ぶ */ }
}

/* ---------- お知らせ ---------- */
let toastT = 0;
function toast(msg, ms = 1900) {
  const el = $('toast'); if (!el) return;
  el.textContent = msg; el.hidden = false;
  el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
  clearTimeout(toastT); toastT = setTimeout(() => { el.hidden = true; }, ms);
}
const HEART = '\u2665\uFE0E';   // ハートは絵文字にならないように文字の形で（昼の画面とまとめで使う）
