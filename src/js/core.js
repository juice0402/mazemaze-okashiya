/* ==== 土台：小さな道具・ドット絵・セーブ・お知らせ ==== */
const KEY = 'mazemaze-okashiya', VER = 5;   // v:3 までは前の経営シミュレーション（読まずに新しく始める）。v:4（夜→朝→昼）は sanitize で v:5 の朝にする
const $ = id => document.getElementById(id);
const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
const rand = n => Math.floor(Math.random() * n);
const pick = a => a[rand(a.length)];
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = rand(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const REDUCED = (() => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } })();

/* 絵を軽く渡す（11/18 軽量化）：ART の dataURL（1まい数十KB）を画面の文字に入れると、描きなおすたびに何百KBの文字を作って読みなおす。
   起動のときに一度だけ blob URL（短い名前）にかえる。blob の絵が出せない所では dataURL のまま。かえおわってから done() */
function artBlobs(done) {
  const keys = Object.keys(ART);
  let fin = false; const end = () => { if (!fin) { fin = true; uiVars(); done(); } };
  try {
    if (!keys.length || !URL.createObjectURL) return end();
    const blob = d => {
      const c = d.indexOf(','), bin = atob(d.slice(c + 1)), u = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
      return URL.createObjectURL(new Blob([u], { type: d.slice(5, d.indexOf(';')) }));
    };
    const img = new Image();
    img.onload = () => { try { for (const k of keys) if (ART[k].startsWith('data:')) ART[k] = blob(ART[k]); } catch (e) { /* dataURL のまま */ } end(); };
    img.onerror = end;
    img.src = blob(ART[keys[0]]);
    setTimeout(end, 400);   // 待ちすぎない（そのときは dataURL のまま）
  } catch (e) { end(); }
}

/* UI の絵（ui-* の名前の絵）を CSS の変数 --ui-<名前> に入れる。style.css の「UI の絵」が border-image に使う（昼の画面も同じ変数） */
function uiVars() {
  const st = document.documentElement.style;
  for (const k of Object.keys(ART)) if (k.startsWith('ui-')) st.setProperty('--' + k, `url("${ART[k]}")`);
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
    night: null, morning: null, dayRun: null,
    today: null, yesterday: null,  // 1日の記録（newDay）と、きのうの記録
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
  for (const k of ['stock', 'goods', 'seen', 'hearts', 'recipes']) if (!o[k] || typeof o[k] !== 'object') o[k] = {};
  if (!Number.isFinite(o.day) || o.day < 1) o.day = 1;
  for (const k of ['money', 'rep', 'shelfMax']) if (!Number.isFinite(o[k])) o[k] = d[k];
  if (!BUILDS[o.build]) o.build = 'cookie';
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
function load() {
  try { const t = localStorage.getItem(KEY); return t ? sanitize(JSON.parse(t)) : null; } catch (e) { return null; }
}
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* 保存できない環境ではそのまま遊ぶ */ }
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
