/* ==== 朝と昼の絵（持ち主：昼のチャット【okashi-hiru】・11/18 カウンター越しの舞台に作りなおし）
   ハイグラの絵（リーダーが art-irai にたのむ・H-002）が届くまでは、コードで描いた仮の絵。届いたら ART の名前で出す：
   昼の舞台 bg-day・お客さん cust-<id>（ふつう）・cust-<id>-happy・cust-<id>-sad（id は world.js の CUSTOMERS） ==== */

/* ---------- 素材とお菓子のアイコン（基本素材と仲間の素材は仮の SVG・モンスター素材は MATS の絵） ---------- */
const HIRU_SVG = {
  mugi: '<path d="M16 30V9" stroke="#8a5a20" stroke-width="2.2" stroke-linecap="round" fill="none"/><g fill="#e9c27a" stroke="#8a5a20" stroke-width="1.3"><ellipse cx="16" cy="6.5" rx="3" ry="4.6"/><ellipse cx="11.6" cy="12.5" rx="3" ry="4.6" transform="rotate(-32 11.6 12.5)"/><ellipse cx="20.4" cy="12.5" rx="3" ry="4.6" transform="rotate(32 20.4 12.5)"/><ellipse cx="11.6" cy="19.5" rx="3" ry="4.6" transform="rotate(-32 11.6 19.5)"/><ellipse cx="20.4" cy="19.5" rx="3" ry="4.6" transform="rotate(32 20.4 19.5)"/></g>',
  hachimitsu: '<path d="M7.5 12.5h17l-1.3 13.2a3.2 3.2 0 0 1-3.2 2.8h-8a3.2 3.2 0 0 1-3.2-2.8z" fill="#d08a3c" stroke="#5a3010" stroke-width="1.4"/><rect x="6.5" y="9" width="19" height="4.5" rx="2" fill="#a8622a" stroke="#5a3010" stroke-width="1.4"/><path d="M10 13.5v3.2a1.8 1.8 0 0 0 3.6 0v-1.4a1.6 1.6 0 0 1 3.2 0v4a1.8 1.8 0 0 0 3.6 0v-5.8" fill="#f6b440" stroke="none"/><rect x="11.5" y="19.5" width="9" height="5" rx="1.5" fill="#fff3d0" stroke="#5a3010" stroke-width="1"/>',
  milk: '<path d="M12 6.5h8V10l3.2 4.2v12.6a2.2 2.2 0 0 1-2.2 2.2H11a2.2 2.2 0 0 1-2.2-2.2V14.2L12 10z" fill="#fffaf0" stroke="#6a4a30" stroke-width="1.4"/><rect x="11.2" y="3.5" width="9.6" height="4" rx="1.2" fill="#e8607a" stroke="#6a4a30" stroke-width="1.2"/><rect x="8.8" y="17" width="14.4" height="6.5" fill="#f4c24e" stroke="#6a4a30" stroke-width="1"/>',
  egg: '<ellipse cx="16" cy="17.5" rx="8.6" ry="11" fill="#fff3d6" stroke="#8a6a40" stroke-width="1.5"/><ellipse cx="12.8" cy="13" rx="2" ry="3.2" fill="#fff" opacity=".9"/>',
  ichigo: '<path d="M16 28.5c-6-3.2-9.8-8.6-9.8-13.2 0-3.6 2.8-5.6 5.4-5.6 1.9 0 3.4.9 4.4 2 1-1.1 2.5-2 4.4-2 2.6 0 5.4 2 5.4 5.6 0 4.6-3.8 10-9.8 13.2z" fill="#e8475f" stroke="#7a1a2a" stroke-width="1.4"/><path d="M16 11.5l-4.4-4.6 3.2.6L16 4l1.2 3.5 3.2-.6z" fill="#5fb05a" stroke="#2f6a2a" stroke-width="1.1" stroke-linejoin="round"/><g fill="#ffe4a0"><circle cx="12" cy="16" r=".9"/><circle cx="16" cy="18.5" r=".9"/><circle cx="20" cy="16" r=".9"/><circle cx="14" cy="22.5" r=".9"/><circle cx="18" cy="22.5" r=".9"/></g>',
  mizuame: '<path d="M16 3.5S7 14.6 7 20.6a9 9 0 0 0 18 0C25 14.6 16 3.5 16 3.5z" fill="#ffd9a0" stroke="#a0642a" stroke-width="1.4"/><path d="M12 19.5a4.5 4.5 0 0 0 3 5" stroke="#fff" stroke-width="2" stroke-linecap="round" fill="none" opacity=".85"/>',
  herb: '<path d="M16 29V12" stroke="#2f6a2a" stroke-width="2" stroke-linecap="round" fill="none"/><path d="M16 17C9 17 6 12 6.5 7.5 11 7.5 16 10 16 17zM16 13c0-5.5 3.8-9 9.5-9.2C25.8 9 22 13 16 13zM16 23c5.5 0 9.4-3.2 9.6-7.8-4.6-.4-9.6 2.4-9.6 7.8z" fill="#7cc576" stroke="#2f6a2a" stroke-width="1.2"/>',
};
const ICON_CACHE = new Map();
function matIcon(m) {
  const hi = ART['mat-' + m]; if (hi) return `<img class="hico" src="${hi}" alt="">`;   // 描き下ろしの素材の絵（H-027・届いたら自動で出る）
  if (HIRU_SVG[m]) return `<svg class="hico" viewBox="0 0 32 32" aria-hidden="true">${HIRU_SVG[m]}</svg>`;
  return MATS[m] ? `<img class="hico" src="${matURL(m)}" alt="">` : '';
}
/* お菓子の形（名前から）→ 仮の絵 */
const CANDY_SHAPES = [
  ['parfait', /パフェ/], ['tea', /ティー/], ['tart', /タルト/], ['ice', /アイス|ソルベ/], ['pudding', /プリン|ババロア|ムース/],
  ['jelly', /ゼリー|ジャム/], ['candy', /飴|あめ|キャンディ|ドロップ|キャラメル|こはく糖|マシュマロ/], ['cake', /ケーキ|カステラ|シフォン|スフレ/],
];
const matCol = (m, k = 'col') => (HIRU_MATS[m] && HIRU_MATS[m][k]) || (MATS[m] && MATS[m].col) || '#e9c27a';
function candySVG(key) {
  const c = candyOf(key), [a, b] = c.mats, ha = isHiruMat(a);
  const c1 = matCol(ha ? a : b), c2 = matCol(ha ? b : a), dk = '#5a3010';
  const shape = (CANDY_SHAPES.find(([, re]) => re.test(c.name)) || ['cookie'])[0];
  const S_ = {
    cookie: `<circle cx="16" cy="17" r="11" fill="${c1}" stroke="${dk}" stroke-width="1.5"/><g fill="${c2}" stroke="${dk}" stroke-width=".8"><circle cx="12" cy="14" r="2"/><circle cx="19.5" cy="13" r="1.7"/><circle cx="17" cy="20.5" r="2"/><circle cx="11" cy="21" r="1.4"/></g>`,
    cake: `<path d="M5 15l20-6v15H5z" fill="${c1}" stroke="${dk}" stroke-width="1.5" stroke-linejoin="round"/><path d="M5 15l20-6v4L5 19z" fill="${c2}" stroke="${dk}" stroke-width="1.2" stroke-linejoin="round"/><circle cx="20" cy="8" r="2.4" fill="#e8475f" stroke="${dk}" stroke-width="1"/>`,
    pudding: `<ellipse cx="16" cy="26.5" rx="12" ry="2.6" fill="#fff6e8" stroke="${dk}" stroke-width="1.2"/><path d="M8.5 25l2.5-14h10l2.5 14z" fill="${c1}" stroke="${dk}" stroke-width="1.5" stroke-linejoin="round"/><path d="M11 11h10l.6 3.4H10.4z" fill="${c2}" stroke="${dk}" stroke-width="1.1"/>`,
    ice: `<path d="M10.5 15l5.5 14 5.5-14z" fill="#e0a85a" stroke="${dk}" stroke-width="1.4" stroke-linejoin="round"/><circle cx="16" cy="11.5" r="7" fill="${c1}" stroke="${dk}" stroke-width="1.5"/><path d="M10 13c2 2 3-1 5 1s4-1 7 0" stroke="${c2}" stroke-width="2.2" fill="none" stroke-linecap="round"/>`,
    tart: `<path d="M4 18h24l-2.5 7H6.5z" fill="#d89a4a" stroke="${dk}" stroke-width="1.5" stroke-linejoin="round"/><ellipse cx="16" cy="18" rx="12" ry="3.5" fill="${c1}" stroke="${dk}" stroke-width="1.3"/><g fill="${c2}" stroke="${dk}" stroke-width="1"><circle cx="11" cy="15.5" r="2.6"/><circle cx="16.5" cy="14" r="2.6"/><circle cx="21.5" cy="16" r="2.4"/></g>`,
    candy: `<path d="M9 16L3.5 11v10zM23 16l5.5-5v10z" fill="${c2}" stroke="${dk}" stroke-width="1.2" stroke-linejoin="round"/><circle cx="16" cy="16" r="7.5" fill="${c1}" stroke="${dk}" stroke-width="1.5"/><path d="M12.5 13a4.5 4.5 0 0 1 3.5-2" stroke="#fff" stroke-width="1.8" stroke-linecap="round" fill="none" opacity=".85"/>`,
    jelly: `<ellipse cx="16" cy="26.5" rx="12" ry="2.6" fill="#fff6e8" stroke="${dk}" stroke-width="1.2"/><path d="M6 25c0-9 4.5-15 10-15s10 6 10 15z" fill="${c1}" stroke="${dk}" stroke-width="1.5" opacity=".95"/><circle cx="16" cy="18" r="3.4" fill="${c2}" stroke="${dk}" stroke-width="1"/><path d="M10 19c0-3 1.2-5 3-6" stroke="#fff" stroke-width="1.8" stroke-linecap="round" fill="none" opacity=".7"/>`,
    parfait: `<path d="M9 5h14l-3 16h-8z" fill="#fff6e8" stroke="${dk}" stroke-width="1.4" stroke-linejoin="round"/><path d="M9.6 8h12.8l-1 5H10.6z" fill="${c1}"/><path d="M10.8 14h10.4l-.9 4.6h-8.6z" fill="${c2}"/><path d="M16 21v6M11 28h10" stroke="${dk}" stroke-width="1.6" stroke-linecap="round"/><circle cx="16" cy="4.5" r="2.4" fill="#e8475f" stroke="${dk}" stroke-width="1"/>`,
    tea: `<path d="M6 12h17v7a7 7 0 0 1-7 7h-3a7 7 0 0 1-7-7z" fill="#fff6e8" stroke="${dk}" stroke-width="1.5"/><path d="M23 14h2.5a3 3 0 0 1 0 6H22" stroke="${dk}" stroke-width="1.5" fill="none"/><path d="M7.5 14h14v4a5.5 5.5 0 0 1-5.5 5.5h-3A5.5 5.5 0 0 1 7.5 18z" fill="${c1}"/><path d="M12 9c-1-2 1-3 0-5M17 9c-1-2 1-3 0-5" stroke="${c2}" stroke-width="1.5" stroke-linecap="round" fill="none"/>`,
  };
  return `<svg class="hico" viewBox="0 0 32 32" aria-hidden="true">${S_[shape]}</svg>`;
}
function candyIcon(key) {
  if (ICON_CACHE.has(key)) return ICON_CACHE.get(key);
  const c = candyOf(key);
  /* 描き下ろしのお菓子の絵（H-027）：sweet-<a>-<b>（名前の順にならべた素材の id）・モンスター素材どうしは sweet-parfait */
  const hi = !c.old && ART[c.name === 'まぜまぜパフェ' && !c.mats.some(isHiruMat) ? 'sweet-parfait' : 'sweet-' + c.mats.slice().sort().join('-')];
  if (hi) { const h = `<img class="hico" src="${hi}" alt="">`; ICON_CACHE.set(key, h); return h; }
  const h = c.old || (!c.mats.some(isHiruMat) && c.name !== 'まぜまぜパフェ') ? `<img class="hico" src="${candyURL(key)}" alt="">` : candySVG(key);
  ICON_CACHE.set(key, h); return h;
}

/* ---------- 昼の舞台：カウンターの奥から見たお店の中（絵 bg-day が来るまでは仮の形） ---------- */
/* 宙をただようキラキラ（11/18 しょーくん「空気感とか、キラキラが宙をほんの少し飛んだり」）：[横%・縦%・1回の秒・ずらす秒・大きさ] */
const DS_MOTES = [[18, 58, 9, 1, 1], [27, 40, 11, 4, .8], [35, 66, 8, 6, 1.2], [44, 30, 12, 2, .7], [52, 55, 10, 7, 1], [61, 38, 9, 3, .9], [69, 62, 11, 5, 1.1], [77, 44, 8, 0, .8], [84, 58, 12, 8, 1], [24, 24, 10, 9, .7]];
function dayStageBg(sign) {
  const bg = ART['bg-day'];
  /* 時間は外の明るさで（11/18 しょーくん）：窓の外（ART['bg-day-mado'] の型）を夕焼けに・お店の中もだんだん夕方の色に・窓のまわりに光がにじむ（bg-day-mado-glow）・宙にキラキラ。強さは .dstage の --p（0〜1・day.js） */
  const mado = ART['bg-day-mado'], glow = ART['bg-day-mado-glow'];
  const m = mado ? `<i class="ds-mado ds-m1" style="--mado:url('${mado}')"></i><i class="ds-mado ds-m2" style="--mado:url('${mado}')"></i><i class="ds-mado ds-out" style="--mado:url('${mado}')"><i class="ds-rain"></i></i>` : '';   // ds-out＝窓の外の生きもの・雨（day.js の dAmbient）
  const gl = glow ? `<i class="ds-mado ds-glow" style="--mado:url('${glow}')"></i>` : '';
  const motes = DS_MOTES.map(([x, y, d, dl, s]) => `<i class="ds-mote" style="--x:${x}%;--y:${y}%;--d:${d}s;--dl:-${dl}s;--s:${s}"></i>`).join('');
  if (bg) return `<div class="ds-bg art" style="--bgimg:url('${bg}')">${m}<i class="ds-dusk"></i>${gl}${motes}<span class="ds-sign on-art">${sign}</span></div>`;   // 絵：まんなかがドア・下がカウンター
  return `<div class="ds-bg" aria-hidden="true">
    <i class="ds-win"><i class="ds-tree a"></i><i class="ds-tree b"></i><i class="ds-pane"></i></i>
    <i class="ds-rack"><i class="ds-jar a"></i><i class="ds-jar b"></i><i class="ds-jar c"></i></i>
    <i class="ds-door"><i class="ds-dwin"></i><i class="ds-knob"></i></i>
    <span class="ds-sign">${sign}</span>
    <i class="ds-lamp"></i><i class="ds-wains"></i>
  </div>`;
}
/* 手前のカウンター（お客さんの胸から下をかくす）：絵があるときは、同じ絵のカウンターの所だけを上に重ねる */
function dayStageFront() {
  const bg = ART['bg-day'];
  return bg ? `<i class="ds-front" style="--bgimg:url('${bg}')"></i>` : '<i class="ds-counter"></i>';
}
/* お客さん（正面・胸から上）。face：'' ふつう・'happy' うれしい・'sad' ざんねん */
/* お客さんの見た目ちがい（11/18 しょーくん「服も何もかも同じ人が再度来店すると、また戻ってきたのかなって思っちゃう」）：
   絵 cust-<id>-<n>（n＝2・3…・表情は cust-<id>-<n>-happy / -sad）があれば、別の人として出す。1 は cust-<id> */
const custVariants = id => [1, ...[2, 3, 4, 5].filter(n => ART['cust-' + id + '-' + n])];
function custHTML(id, face = '', vr = 1) {
  const c = CUST[id] || CUSTOMERS[0], b = 'cust-' + id + (vr > 1 && ART['cust-' + id + '-' + vr] ? '-' + vr : '');
  const img = ART[b + (face ? '-' + face : '')] || ART[b] || ART['cust-' + id + (face ? '-' + face : '')] || ART['cust-' + id];
  if (img) return `<div class="cu-fig art"><img src="${img}" alt=""></div>`;
  const acc = id === 'kodomo' ? '<i class="cu-ribbon"></i>' : id === 'obaachan' ? '<i class="cu-bun"></i>' : id === 'gakusei' ? '<i class="cu-cap"></i>' : '';
  return `<div class="cu-fig" style="--skin:${c.skin};--hair:${c.hair};--shirt:${c.shirt};--arm:${c.arm};--acc:${c.hat || c.collar || c.pants}">
    <i class="cu-torso">${id === 'gakusei' ? '<i class="cu-collar"></i>' : ''}</i>
    <i class="cu-head">${acc}<i class="cu-hair"></i><i class="cu-eye l"></i><i class="cu-eye r"></i><i class="cu-cheek l"></i><i class="cu-cheek r"></i><i class="cu-mouth"></i></i>
  </div>`;
}
