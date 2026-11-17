/* ==== 昼の場面の絵（持ち主：昼のチャット【okashi-hiru】）。幅96×高さ48。動かすのは scene.js の mountScene・sceneLoop（リーダー） ==== */
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
