/* ==== 場面の絵：夜のお店（バトル）と昼のお店（販売）。幅96×高さ48を画面の幅いっぱいにのばす ==== */
const SW = 96, SH = 48, FLOOR = 41;
const scn = { mode: 'night', heat: 2, hit: 0, smoke: 0, flee: 0, cust: [], speed: 1, bg: {}, cv: null, raf: 0, last: 0 };
const CANDY_CV = new Map();
const candyCv = key => { if (!CANDY_CV.has(key)) CANDY_CV.set(key, candyCanvas(key)); return CANDY_CV.get(key); };

function mountScene(mode) {
  scn.cv = $('scene'); scn.mode = mode;
  if (!scn.cv) return;
  scn.cv.width = SW; scn.cv.height = SH;
  if (!scn.raf) scn.raf = requestAnimationFrame(sceneLoop);
}
function sceneLoop(ts) {
  scn.raf = requestAnimationFrame(sceneLoop);
  const cv = scn.cv;
  const dt = Math.min(0.1, (ts - (scn.last || ts)) / 1000); scn.last = ts;
  if (!cv || !cv.isConnected) return;
  const g = cv.getContext('2d'); g.imageSmoothingEnabled = false;
  if (scn.mode === 'night') drawNight(g, ts / 1000, dt); else drawDay(g, ts / 1000, dt);
}
function painter(g) { return (col, x, y, w = 1, h = 1) => { g.fillStyle = col; g.fillRect(x, y, w, h); }; }

/* ---------- 夜：窓に月、こわれた扉からモンスター、ほのかとコンロの火 ---------- */
function nightBg() {
  if (scn.bg.night) return scn.bg.night;
  const c = mk(SW, SH), r = painter(c.getContext('2d'));
  r('#241b3d', 0, 0, SW, SH);
  for (let y = 3; y < FLOOR; y += 6) r('#2a2046', 0, y, SW, 1);
  r('#4c3f74', 4, 4, 30, 22); r('#120e26', 6, 6, 26, 18); r('#4c3f74', 18, 6, 2, 18); r('#4c3f74', 6, 14, 26, 2);
  r('#fff3c4', 9, 8, 4, 5); r('#fff3c4', 8, 9, 1, 3); r('#120e26', 11, 8, 2, 3);
  for (const [x, y] of [[25, 8], [29, 18], [9, 21], [23, 21], [14, 17]]) r('#c8b9d9', x, y);
  r('#4c3f74', 74, 6, 20, FLOOR - 6); r('#0c0a18', 76, 8, 16, FLOOR - 8); r('#6b5a3a', 92, 8, 2, FLOOR - 8);
  r('#3a2a2a', 0, FLOOR, SW, SH - FLOOR); r('#4a3434', 0, FLOOR, SW, 1);
  for (let x = 4; x < SW; x += 8) r('#332424', x, FLOOR + 3, 1, SH - FLOOR - 3);
  r('#5a6370', 25, 35, 12, FLOOR - 35); r('#9aa3ad', 26, 34, 10, 1); r('#3a3f48', 25, FLOOR - 1, 12, 1);
  return (scn.bg.night = c);
}
function drawNight(g, t, dt) {
  const r = painter(g);
  g.drawImage(nightBg(), 0, 0);
  const z = zoneOf(scn.heat), fh = [2, 4, 7][z];
  for (let i = 0; i < 8; i++) {
    const h = fh + (Math.sin(t * 13 + i * 1.9) > 0.2 ? 1 : 0);
    r(z === 3 ? '#5a3a26' : '#f0502a', 27 + i, 34 - h, 1, h);
    if (z < 3 && h > 2) r(z === 2 ? '#fff6d0' : '#ffc94a', 27 + i, 34 - Math.ceil(h / 2), 1, Math.ceil(h / 2));
  }
  if (scn.smoke > 0 || z === 3) {
    const k = 1 - Math.max(0, scn.smoke);
    for (let i = 0; i < 3; i++) r('#8a8494', 28 + i * 3 + Math.round(Math.sin(t * 3 + i) * 1), 26 - i * 3 - Math.round(k * 4), 3, 2);
  }
  const hop = scn.hit > 0.15 ? -1 : 0;
  g.drawImage(CHEF_SPR[0], 12, FLOOR - CHEF_SPR[0].height + 1 + hop);
  const N0 = S.night, mon = N0 ? MONSTERS[N0.mon] : MONSTERS[0];
  const M = MON_SPR[mon.id];
  let sx = 50, sy = FLOOR - 32 + Math.round(Math.sin(t * 2.5));
  if (scn.hit > 0) sx += (Math.floor(t * 30) % 2) ? 2 : -2;
  if (scn.flee) sx += Math.min(60, (t - scn.flee) * 40);
  g.drawImage(M, 0, 0, M.width, M.height, sx, sy, M.width * 2, M.height * 2);
  if (scn.hit > 0) {
    const cx = sx + 18, cy = sy + 12;
    for (const [dx, dy] of [[0, -6], [0, 6], [-6, 0], [6, 0], [-4, -4], [4, 4], [4, -4], [-4, 4]]) r('#fff6d0', cx + dx, cy + dy, 2, 2);
  }
  scn.hit = Math.max(0, scn.hit - dt);
  scn.smoke = Math.max(0, scn.smoke - dt * 0.8);
}

/* ---------- 昼：明るいお店、棚のお菓子、歩いてくるお客さん ---------- */
function dayBg() {
  if (scn.bg.day) return scn.bg.day;
  const c = mk(SW, SH), r = painter(c.getContext('2d'));
  r('#fbe3d4', 0, 0, SW, SH);
  for (let y = 3; y < FLOOR; y += 6) r('#f6d3c4', 0, y, SW, 1);
  r('#d9a07a', 3, 4, 26, 18); r('#9fd4f0', 5, 6, 22, 14); r('#d9a07a', 15, 6, 2, 14);
  r('#ffe27a', 7, 8, 4, 4); r('#ffffff', 19, 9, 6, 2); r('#ffffff', 20, 8, 3, 1);
  r('#c98a4b', 34, 10, 34, 24); r('#8a5a3b', 33, 21, 36, 2); r('#8a5a3b', 33, 32, 36, 2); r('#a8703e', 35, 11, 32, 1);
  r('#8a5a3b', 78, 8, 16, FLOOR - 8); r('#bfe3f0', 81, 11, 10, 8); r('#ffd75e', 89, 24, 2, 2);
  r('#d9b48a', 0, FLOOR, SW, SH - FLOOR); r('#c49a6c', 0, FLOOR, SW, 1);
  for (let x = 6; x < SW; x += 10) r('#c49a6c', x, FLOOR + 3, 1, SH - FLOOR - 3);
  return (scn.bg.day = c);
}
function drawDay(g, t, dt) {
  const r = painter(g);
  g.drawImage(dayBg(), 0, 0);
  const items = S.shelf.filter(s => s.n > 0).slice(0, 6);
  items.forEach((s, i) => g.drawImage(candyCv(s.key), 36 + (i % 3) * 11, i < 3 ? 11 : 22));
  g.drawImage(CHEF_SPR[0], 8, FLOOR - CHEF_SPR[0].height + 1);
  for (const c of scn.cust) {
    const sp = 34 * scn.speed;
    if (c.x !== c.tx) { const d = c.tx - c.x; c.x += Math.sign(d) * Math.min(Math.abs(d), sp * dt); }
    const walking = c.x !== c.tx, spr = CUST_SPR[c.id][walking ? 1 + (Math.floor(t * 6) % 2) : 0];
    const x = Math.round(c.x), y = FLOOR - spr.height + 1;
    g.drawImage(spr, x, y);
    if (c.bub) {
      r('#ffffff', x - 1, y - 14, 14, 12); r('#3a2318', x - 1, y - 14, 14, 1); r('#3a2318', x - 1, y - 3, 14, 1);
      r('#3a2318', x - 2, y - 13, 1, 10); r('#3a2318', x + 13, y - 13, 1, 10); r('#ffffff', x + 4, y - 2, 3, 1);
      if (c.bub === 'heart') { for (const [dx, dy, w] of [[2, 2, 3], [7, 2, 3], [1, 3, 10], [2, 6, 8], [3, 7, 6], [4, 8, 4], [5, 9, 2]]) r('#e0507a', x - 1 + dx, y - 14 + dy - 0, w, dy === 3 ? 3 : 1); }
      else if (c.bub === 'none') { r('#7a5a4a', x + 2, y - 9, 8, 2); }
      else g.drawImage(candyCv(c.bub), x + 1, y - 13);
    }
  }
  scn.cust = scn.cust.filter(c => !(c.gone && c.x === c.tx));
}
