/* ==== 絵：すべてコードで描くドット絵（C）。材料4つ・クッキー・お客さんの絵は前の版から ==== */

/* ---------- 材料と道具のアイコン（10×10） ---------- */
const OL = '#3a2318';
const ICON_MAPS = {
  komugi: [['...oooo...', '..oWWWWo..', '...oWWo...', '..oWWWWo..', '.oWWWWWWo.', 'oWWWyyWWWo', 'oWWyWWyWWo', 'oWWWyyWWWo', 'oWWWWWWWWo', '.oooooooo.'], { o: '#7a6a58', W: '#f7f1e3', y: '#d9a84a' }],
  tamago: [['...oooo...', '..oWWWWo..', '.oWHWWWWo.', '.oWHWWWWo.', 'oWWWWWWWWo', 'oWWWWWWWWo', 'oWWWWWWWso', '.oWWWWWso.', '..osssso..', '...oooo...'], { o: '#a8743c', W: '#fbe7c6', H: '#ffffff', s: '#e8c79a' }],
  sato: [['..oooooo..', '..oppppo..', '.oPPPPPPo.', '.oPwPPwPo.', 'oPPPPPPPPo', 'oPPwPPPwPo', 'oPPPPwPPPo', 'oPwPPPPPPo', 'oPPPPPPPPo', '.oooooooo.'], { o: '#8a3a5a', p: '#e07aa0', P: '#f9c6d6', w: '#ffffff' }],
  bata: [['..........', '..........', '...oooooo.', '..oYYYYYyo', '.oYYYYYyyo', '.ooooooyyo', '.oyyyyyoyo', '.oyyyyyyo.', 'WooooooooW', '.WWWWWWWW.'], { o: '#a5761c', Y: '#fff3a8', y: '#f6d36b', W: '#b9cad6' }],
  choco: [['..........', '.oooooooo.', '.olbbolbo.', '.obbbobbo.', '.oooooooo.', '.olbbolbo.', '.obbbobbo.', '.oooooooo.', '.WWWWWWWW.', '..........'], { o: '#3a1e10', b: '#7a4424', l: '#a8643a', W: '#c9d0d8' }],
  zeri: [['..........', '..........', '..oooooo..', '.owwaaaao.', '.owaaaaao.', '.oaaaaaao.', '.oaaaaaao.', '.oAAAAAAo.', '..oooooo..', '..........'], { o: '#2f6b78', a: '#7fd6e0', A: '#4fb0c0', w: '#e6fbff' }],
  hoippu: [['....oo....', '...owwo...', '..owwgwo..', '.owwwwwgo.', '.oggwwwwo.', 'owwwwwgwwo', 'owggwwwwgo', 'oooooooooo', '.WWWWWWWW.', '..........'], { o: '#9a7a8a', w: '#ffffff', g: '#f0dde6', W: '#b9cad6' }],
  maki: [['..........', '..........', '.ooooooo..', 'oybbbbbbo.', '.ooooooooo', '.oybbbbbbo', 'ooooooooo.', 'oybbbbbbo.', '.ooooooo..', '..........'], { o: '#3a2318', y: '#e8c48a', b: '#8a5a3b' }],
  uchiwa: [['..oooooo..', '.orrrrrro.', 'orrwrrrrro', 'orrrrrwrro', 'orrrrrrrro', '.orrrrrro.', '..oooooo..', '....hh....', '....hh....', '....hh....'], { o: '#7a2a2a', r: '#f07a5a', w: '#ffd6c8', h: '#8a5a3b' }],
  mizu: [['....oo....', '...obbo...', '...obbo...', '..obbbbo..', '.obwbbbbo.', '.obwbbbbo.', '.obbbbbbo.', '.obbbbbbo.', '..obbbbo..', '...oooo...'], { o: '#2a4a7a', b: '#6fa8e0', w: '#dff0ff' }],
  kago: [['...oooo...', '..o....o..', '.o......o.', 'oooooooooo', 'obybybybyo', 'oybybybybo', '.obybybyo.', '.oybybybo.', '..oooooo..', '..........'], { o: '#7a4b2e', b: '#c98a4b', y: '#e4b273' }],
  chokin: [['..........', '....oo....', '..oookoo..', '.oPPPPPPo.', 'oPwPPPPPPo', 'oPkPPPPPPo', 'opPPPPPPPo', '.oPPPPPPo.', '.oo.oo.oo.', '..........'], { o: '#8a3a5a', P: '#f9a8c0', p: '#e07aa0', w: '#ffffff', k: '#3a1e2a' }],
  /* 生地（クッキーのビルド）・焦げ・新しい道具・フィールド（ハイグラの絵ができるまでの仮の絵） */
  dosshiri: [['..........', '..........', '.oooooooo.', 'oDDDDDDDDo', 'oDLDDDDDDo', 'oDDDDDDDDo', 'oDDDDDDDDo', 'osssssssso', '.oooooooo.', '..........'], { o: '#5a3418', D: '#c08a52', L: '#e0b07a', s: '#9a6a3a' }],
  hinoko: [['..r....r..', '...oooo.y.', '..oDDDDo..', '.oDLDDrDo.', '.oDDDDDDo.', 'oDDrDDDDDo', 'oDDDDDyDDo', '.oDDDDDDo.', '..oooooo..', '..........'], { o: '#7a3a18', D: '#f0b070', L: '#ffe0b0', r: '#f0402a', y: '#ffc94a' }],
  ichiban: [['....of....', '....offf..', '....o.....', '...oooo...', '..oDDDDo..', '.oDLDDDDo.', 'oDDDDDDDDo', 'oDDDDDDDDo', '.oooooooo.', '..........'], { o: '#7a5228', D: '#f6d39a', L: '#fff0d0', f: '#e0402a' }],
  shime: [['..........', '...oooo...', '..oDDDDo..', '.oDLDDDDo.', 'oppppppppo', 'oDDDDDDDDo', 'oDDDDDDDDo', '.oDDDDDDo.', '..oooooo..', '..........'], { o: '#7a5228', D: '#f6d39a', L: '#fff0d0', p: '#e8607a' }],
  horoniga: [['..........', '...oooo...', '..oDDDDo..', '.oDLDDDDo.', '.oDDDdDDo.', 'oDdDDDDDDo', 'oDDDDDdDDo', '.oDDDDDDo.', '..oooooo..', '..........'], { o: '#2a1408', D: '#7a4424', L: '#a8643a', d: '#4a2414' }],
  koge1: [['..........', '..oooooo..', '.olllbbbo.', 'olcllbbcbo', 'obllbbbbbo', 'obbbbcbbbo', 'ocbbbbbbbo', 'obbbcbbcbo', '.obbbbbbo.', '..oooooo..'], { o: '#1e120b', b: '#5a3a26', l: '#7a5034', c: '#1e120b' }],
  koge2: [['..oooooo..', '.obbcbbbo.', 'obbbbbcbbo', '.obbbbbbo.', '..oooooo..', '.obbbcbbo.', 'obcbbbbbbo', 'obbbbbcbbo', '.obbbbbbo.', '..oooooo..'], { o: '#120a06', b: '#3a2416', c: '#0a0604' }],
  koge3: [['...oooo...', '..obrbbo..', '.obbbbrbo.', 'obrbbbbbbo', 'obbbrrbbbo', 'obbbbbbrbo', 'obrbbbbbbo', '.obbbrbbo.', '..obbbbo..', '...oooo...'], { o: '#120a06', b: '#2a1a10', r: '#ff7a2a' }],
  yakigote: [['......oo..', '.....oRRo.', '....oRRRRo', '....oRRRRo', '.....oRRo.', '....oo....', '...oho....', '..oho.....', '.oho......', '.oo.......'], { o: '#3a1c08', R: '#f0502a', h: '#8a5a3b' }],
  yobirin: [['....oo....', '...oYYo...', '..oYwYYo..', '..oYYYYo..', '.oYYYYYYo.', '.oYYYYYYo.', 'oYYYYYYYYo', 'oooooooooo', '....oo....', '..........'], { o: '#7a5214', Y: '#f6c94c', w: '#fff6d0' }],
  teppan: [['..........', '..........', '..........', 'oooooooooo', 'oGGGGGGGGo', 'oGgGGGGgGo', 'oooooooooo', '.r.y.r.y..', 'ryryryryr.', '..........'], { o: '#2a1a12', G: '#5a4a42', g: '#7a6a62', r: '#f0502a', y: '#ffc94a' }],
  ishigama: [['...oooo...', '..oSSSSo..', '.oSSsSSSo.', 'oSSSSSSsSo', 'oSoooooSSo', 'oSoryroSSo', 'oSoyyyoSSo', 'oSSSSSSSSo', 'oooooooooo', '..........'], { o: '#3a2a22', S: '#a89080', s: '#c8b0a0', r: '#f0502a', y: '#ffc94a' }],
  mitsu: [['...oooo...', '..oWWWWo..', '..oooooo..', '.oYYYYYYo.', 'oYYwYYYYYo', 'oYwYYYYYYo', 'oYYYYYYYYo', 'oYYYYYYYYo', '.oooooooo.', '..........'], { o: '#7a4a14', Y: '#f2b33a', w: '#ffe08a', W: '#e8d0a0' }],
  hiokoshi: [['....o.....', '...oro....', '...orro.o.', '..orrrooro', '..orryrrro', '.orryyyrro', '.oryyyyyro', '.oryywyyro', '..oryyyro.', '...ooooo..'], { o: '#7a1e10', r: '#f0502a', y: '#ffc94a', w: '#fff6d0' }],
};
const ICON = {};
for (const k in ICON_MAPS) ICON[k] = fromMap(ICON_MAPS[k][0], ICON_MAPS[k][1]);

/* ---------- お菓子のアイコン：名前の主役（noun）で形、もう1つの材料（adj）で色 ---------- */
const CANDY_MAPS = {
  'クッキー': ['..........', '..oooooo..', '.olllbbbo.', 'olallbbabo', 'obllbbbbbo', 'obbbbabbbo', 'oabbbbbbbo', 'obbbabbabo', '.obbbbbbo.', '..oooooo..'],
  'サブレ': ['..........', '.oo.oo.oo.', 'olllllbbbo', 'olabllbbao', '.obbbbbbo.', 'obbbabbbbo', 'oabbbbbbbo', '.obbbbabo.', '.oo.oo.oo.', '..........'],
  'キャンディ': ['..........', '..........', 'o.oooooo.o', 'ooawaaaaoo', 'oaaaawaaao', 'ooaaaaaaoo', 'o.oooooo.o', '..........', '..........', '..........'],
  'カステラ': ['..........', '..........', 'oooooooooo', 'occcccccco', 'oyyyyyyyyo', 'oyyayyyyyo', 'oyyyyyyayo', 'oyyyyyyyyo', 'oooooooooo', '..........'],
  'ブラウニー': ['..........', '..........', '.oooooooo.', '.oaawaaao.', '.obbbbbbo.', '.obdbbdbo.', '.obbbdbbo.', '.obbbbbbo.', '.oooooooo.', '..........'],
  'ゼリー': ['..........', '...oooo...', '..oaaaao..', '.oawaaaao.', '.oaaaaaao.', '.oaaaaaao.', 'oaaaaaaaao', 'oooooooooo', '.WWWWWWWW.', '..........'],
  'シュークリーム': ['..........', '..oooooo..', '.obbllbbo.', 'obbbbbbbbo', 'oooooooooo', 'owwwawwwwo', 'oooooooooo', '.obbbbbbo.', '..oooooo..', '..........'],
};
function candyCanvas(key) {
  const r = recipeOf(key), [a, b] = r.mats, A = MATS[a], B = MATS[b];
  const main = B.nr > A.nr ? B : A, other = main === A ? B : A;
  const acc = a === b ? '#ffffff' : other.col;
  const pal = { o: OL, b: '#c98a4b', l: '#e4b273', a: acc, w: '#fff6ea', c: '#9a5a2a', y: '#f6d36b', d: '#4a2414', W: '#b9cad6' };
  if (main.noun === 'ブラウニー') pal.b = '#6b3a1e';
  if (main.noun === 'クッキー') pal.b = main.col;   // 生地の色のクッキー
  if (main.noun === 'キャンディ' || main.noun === 'ゼリー') pal.a = a === b ? main.col : (other.col === '#fff4f8' ? main.col : other.col);
  return fromMap(CANDY_MAPS[main.noun], pal);
}

/* ★3 スペシャル：お菓子の絵に金のふちと、きらきら */
function specialCanvas(id) {
  const [k1, k2] = id.split('|'), c = mk(14, 14), x = c.getContext('2d');
  x.drawImage(candyCanvas(k2), 4, 1); x.drawImage(candyCanvas(k1), 0, 4);
  const o = outline(c, '#f6c94c'), g = o.getContext('2d');
  g.fillStyle = '#fff6d0'; for (const [a, b] of [[12, 0], [13, 1], [11, 1], [12, 2], [1, 1]]) g.fillRect(a, b, 1, 1);
  return o;
}

/* ---------- ハイグラの絵：ART はビルドが assets/art/*.webp から作る（名前→dataURL）。まだない絵はドット絵の仮の絵 ---------- */
const NOUN_ID = { 'クッキー': 'cookie', 'サブレ': 'sable', 'キャンディ': 'candy', 'カステラ': 'castella', 'ブラウニー': 'brownie', 'ゼリー': 'jelly', 'シュークリーム': 'puff' };
function hiArt(cid) {
  const k = cid[0], id = cid.slice(2);
  if (k === 'm' || k === 't') return ART['card-' + id] || null;
  if (k === 'u' || k === 'w') return ART['card-' + id.split(/[+|]/)[0]] || null;   // 道具の★2・★3は、1つめの道具の絵
  if (k === 'o') {   // 形（noun）ともう1つの材料で絵をさがす（candy-cookie-bata など）。なければ形だけの絵
    const r = recipeOf(id), nid = NOUN_ID[r.noun], other = r.mats.find(m => MATS[m].noun !== r.noun);
    return ART[`candy-${nid}-${other}`] || ART['candy-' + nid] || null;
  }
  if (k === 's') {   // ★3：同じ形どうしは「特製○○タワー」の絵
    const [r1, r2] = id.split('|').map(recipeOf);
    return r1.noun === r2.noun ? ART[`special-${NOUN_ID[r1.noun]}-tower`] || null : null;
  }
  return null;
}

/* ---------- カードの絵（dataURL にして使いまわす） ---------- */
const URLS = new Map();
function cardIconURL(cid) {
  const hi = hiArt(cid); if (hi) return hi;
  if (URLS.has(cid)) return URLS.get(cid);
  const k = cid[0], id = cid.slice(2);
  const src = k === 'o' ? candyCanvas(id) : k === 's' ? specialCanvas(id) : k === 'k' ? ICON['koge' + id] : k === 'u' || k === 'w' ? ICON[id.split(/[+|]/)[0]] : ICON[id];
  const u = big(src, k === 's' ? 3 : 4);
  URLS.set(cid, u);
  return u;
}
const candyURL = key => cardIconURL('o:' + key);
const matURL = id => cardIconURL('m:' + id);

/* ---------- 人（前の版から）：お客さんと、炎のシェフ ほのか ---------- */
function personSprite(t, frame) {
  const top = 3, legH = t.small ? 2 : 3, bodyH = t.h - 7 - legH;
  const c = mk(12, top + t.h + 1), x = c.getContext('2d');
  const r = (col, X, Y, w = 1, h = 1) => { x.fillStyle = col; x.fillRect(X, Y, w, h); };
  const y = top;
  if (t.chef) { r('#ffffff', 4, y - 3, 4); r('#ffffff', 3, y - 2, 6, 2); r('#ffffff', 2, y, 8); r('#e6e1e8', 2, y + 1, 8); r(t.hair, 2, y + 2, 2); r(t.skin, 4, y + 2, 5); r(t.hair, 9, y + 2); }
  else if (t.hat) { r(t.hat, 3, y, 6); r(t.hat, 2, y + 1, 8); r(t.hatDk, 2, y + 2, 9); }
  else { r(t.hair, 3, y, 6); r(t.hair, 2, y + 1, 8); r(t.hair, 2, y + 2, 2); r(t.skin, 4, y + 2, 5); r(t.hair, 9, y + 2); }
  if (t.bun) { r(t.hair, 5, y - 2, 2); r(t.hair, 4, y - 1, 4); }
  if (t.hat) r(t.skin, 3, y + 2, 6);
  r(t.hair, 2, y + 3); r(t.skin, 3, y + 3, 6); r(t.hair, 9, y + 3);
  r(t.skin, 2, y + 4, 8); r(t.skin, 2, y + 5, 8); r(t.skin, 3, y + 6, 6);
  if (t.pony) { r(t.hair, 10, y + 2, 1, 4); r(t.hair, 11, y + 3, 1, 4); r('#ffc94a', 10, y + 2); }
  r('#2b1a12', 4, y + 4); r('#2b1a12', 7, y + 4);
  r('#f08a9a', 3, y + 5); r('#f08a9a', 8, y + 5);
  const bw = t.small ? 6 : 8, bx = t.small ? 3 : 2, yb = y + 7;
  r(t.shirt, bx, yb, bw, bodyH);
  if (t.collar) r(t.collar, 5, yb, 2);
  if (t.apron) { r(t.apron, bx + 1, yb + 2, bw - 2, bodyH - 2); r(t.apron, 4, yb, 1, 2); r(t.apron, 7, yb, 1, 2); }
  r(t.arm, bx - 1, yb, 1, bodyH - 1); r(t.arm, bx + bw, yb, 1, bodyH - 1);
  r(t.skin, bx - 1, yb + bodyH - 1); r(t.skin, bx + bw, yb + bodyH - 1);
  const yl = yb + bodyH, lx = bx + 1, rx = bx + bw - 3;
  const lh = frame === 1 ? legH - 1 : legH, rh = frame === 2 ? legH - 1 : legH;
  r(t.pants, lx, yl, 2, lh - 1); r('#3a2318', lx, yl + lh - 1, 2);
  r(t.pants, rx, yl, 2, rh - 1); r('#3a2318', rx, yl + rh - 1, 2);
  return outline(c, '#2b1a12');
}
const HONOKA = { h: 19, chef: true, pony: true, skin: '#f6cfae', hair: '#e8502a', shirt: '#ffffff', arm: '#e6e1e8', pants: '#3b3b46', apron: '#e0402a' };
const CHEF_SPR = [0, 1, 2].map(f => personSprite(HONOKA, f));
const CUST_SPR = {};
for (const c of CUSTOMERS) CUST_SPR[c.id] = [0, 1, 2].map(f => personSprite(c, f));

/* ---------- 食材モンスター（20×16・2倍で描く） ---------- */
const MON_MAPS = {
  slime: [['.......oooooo.......', '.....ooaaaaaaoo.....', '....oaawwaaaaaao....', '...oawwaaaaaaaaao...', '...oaaaaaaaaaaaao...', '..oaaaakaaaakaaaao..', '..oaaaakaaaakaaaao..', '.oaaaaaaaaaaaaaaaao.', '.oaaaapaaaaaapaaaao.', '.oaaaaaaakkaaaaaaao.', 'oaaaaaaaaaaaaaaaaaao', 'oaaaaaaaaaaaaaaaaaao', 'oAaaaaaaaaaaaaaaaaAo', 'oAAaaaaaaaaaaaaaaAAo', '.oAAAAAAAAAAAAAAAAo.', '..oooooooooooooooo..'],
    { o: '#2f6b78', a: '#7fd6e0', A: '#4fb0c0', w: '#e6fbff', k: '#1e3a40', p: '#f08aa0' }],
  hitsuji: [['....oo..oo..oo......', '...owwoowwoowwo.....', '..owwwwwwwwwwwwoo...', '.owwwwwwwwwwwwwwwo..', 'owwwwwwwwwwwwwwwwwo.', 'owwwwwoffffffowwwwwo', 'owwwwwofkffkfowwwwwo', 'owwwwwofpffpfowwwwwo', 'owwwwwoffkkffowwwwwo', 'owwwwwwoffffowwwwwwo', 'owwwwwwwwwwwwwwwwwwo', '.owwwwwwwwwwwwwwwwo.', '..oowwwwwwwwwwwwoo..', '....oooooooooooo....', '....oko....oko......', '....oo......oo......'],
    { o: '#7a6a8a', w: '#ffffff', f: '#4a3b5a', k: '#1e1428', p: '#f08aa0' }],
};
const MON_SPR = {};
for (const k in MON_MAPS) MON_SPR[k] = fromMap(MON_MAPS[k][0], MON_MAPS[k][1]);
