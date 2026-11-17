/* ==== 土台：小さな道具・ドット絵・セーブ・お知らせ ==== */
const KEY = 'mazemaze-okashiya', VER = 4;   // v:3 までは前の経営シミュレーション（読まずに新しく始める）
const $ = id => document.getElementById(id);
const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
const rand = n => Math.floor(Math.random() * n);
const pick = a => a[rand(a.length)];
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = rand(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const REDUCED = (() => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } })();

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
    v: VER, day: 1, phase: 'title', money: 0, chef: 'honoka',
    pool: [],                      // お菓子のカード（'o:材料+材料'）。夜の仕入れに出てくる
    recipes: { 'komugi+sato': 0 }, // 知っているレシピ（値はひらめいた日。0 は最初から）
    stock: {},                     // ふしぎな材料の数
    shelf: [],                     // 棚のお菓子 [{ key, n }]
    hearts: {}, regulars: [],      // お客さんのハートと常連さん
    night: null, morning: null, dayRun: null, today: null,
  };
}
function sanitize(o) {
  if (!o || typeof o !== 'object' || o.v !== VER) return null;
  const d = newState();
  for (const k in d) if (o[k] === undefined) o[k] = d[k];
  if (!Array.isArray(o.pool)) o.pool = [];
  if (!Array.isArray(o.shelf)) o.shelf = [];
  if (!Number.isFinite(o.day) || o.day < 1) o.day = 1;
  if (!Number.isFinite(o.money)) o.money = 0;
  /* カードやレシピの形が変わっても読めるように、いまはないカード・材料を落とす（11/17 夕方 バトルの作りかえ） */
  const okKey = k => typeof k === 'string' && k.split('+').length === 2 && k.split('+').every(m => MATS[m]);
  const okCard = c => { try { cardDef(c); return true; } catch (e) { return false; } };
  o.pool = o.pool.filter(okCard);
  for (const k in o.recipes) if (!okKey(k)) delete o.recipes[k];
  if (!Object.keys(o.recipes).length) o.recipes = { 'komugi+sato': 0 };
  o.shelf = o.shelf.filter(s => s && okKey(s.key));
  for (const m in o.stock) if (!MATS[m]) delete o.stock[m];
  if (o.today) for (const k of ['flashes', 'made']) if (Array.isArray(o.today[k])) o.today[k] = o.today[k].filter(okKey);
  if (o.morning && o.morning.cur && !okKey(o.morning.cur)) o.morning.cur = null;
  return o;
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
