/* ==== 夜のヒント（チュートリアル・11/18 しょーくん：ゆるく・吹き出し＋指・数字はふつう）
   ショップはふつうのまま・何でもできる。はじめて○○できるときに1回だけ、舞台のデフォルメのほのかが吹き出しで話し、指のアニメで操作を見せる
   見たヒントは S.seen['t:<id>']（セーブ）。文は仮：STORY.tips[id]（昼のチャットの story.js）があればそちら。1行は24文字まで・2行まで・{ことば} は黄色
   出す：renderNight のおわりに tipSync()。とじる：吹き出しをタップ・そのヒントの操作（tipEv）・場面が変わる・条件がなくなる
   ずっと動くのは指だけ（transform と opacity・Web Animations） */
const TIP_GAP = 700;   // 画面が落ち着いてから出す（ショップのカードが配られるあいだは待つ）
const TIP_TOOLS = d => d.cat === 'tool' && (d.fx.heat || d.fx.sear);
const TIP_PLACE = d => !!(d.fx.lead || d.fx.sai || d.fx.fin || d.fx.rally);
/* id＝名前・at＝出す場面・on＝とじる操作（* はどれでも）・text＝文・when＝出す条件・hand＝指（[from, to] でドラッグ・[el] でタップ・null でなし）。上ほど先 */
const TIPS = [
  { id: 'shop1', at: 'shop', on: ['buy', 'mix'], text: ['カードを 下の調理台へ ドラッグ！', '今夜は 3まい 無料だよ'],
    when: () => N.round === 1 && !N.field && !N.board.some(Boolean) && tipBuy() >= 0,
    hand: () => [tipShopEl(tipBuy()), tipSlotEl(freeSlot())] },
  { id: 'field', at: 'shop', on: ['buy', 'mix', 'bake'], text: ['フィールドは {場}へ 置こう', '{場}があると、生地が焼けるんだ'],
    when: () => !N.field && tipField() >= 0, hand: () => [tipShopEl(tipField()), document.querySelector('.fslot')] },
  { id: 'bake', at: 'shop', on: ['bake'], text: ['準備ができたら', 'おもてなし！を おしてね'],
    when: () => N.board.some(Boolean) && (N.round > 1 || N.picks === 0 || !N.shop.some(Boolean)), hand: () => [document.querySelector('.bake')] },
  { id: 'goal', at: 'roundEnd', on: ['next'], text: ['味パワーが おなかをこえたら まんぞく！', '9ラウンドの合計で お礼が決まるよ'],
    when: () => true, hand: () => null },
  { id: 'mix', at: 'shop', on: ['mix'], text: ['まぜ の札がついたカードは', 'かさねると まぜまぜ！★が上がるよ'],
    when: () => !!tipMix(), hand: () => { const m = tipMix(); return m && [tipEl(m[0]), tipEl(m[1])]; } },
  { id: 'reroll', at: 'shop', on: ['reroll', 'buy', 'mix', 'bake'], text: ['ここからは コインで買うよ', '入れかえで 新しいカードも出せる'],
    when: () => N.round >= 2 && N.coins >= REROLL, hand: () => [document.querySelector('.sh-roll')] },
  { id: 'full', at: 'shop', on: ['sell', 'mix'], text: ['調理台が いっぱい！', 'まぜるか、ショップへ持っていって うろう'],
    when: () => N.board.every(Boolean) && N.shop.some(Boolean), hand: () => [tipSlotEl(0), document.querySelector('.sh-cards')] },
  { id: 'cooked', at: 'shop', on: ['*'], text: ['生地が焼けてきた！', '{焼き加減}9で {サイコー}。焼きすぎ注意！'],
    when: () => tipBoard(c => cardDef(c.cid).dough && c.cook > 0) >= 0, hand: () => [tipSlotEl(tipBoard(c => cardDef(c.cid).dough && c.cook > 0))] },
  { id: 'heat', at: 'shop', on: ['*'], text: ['まきや火種で {火力}が上がるよ', '火が強いと、生地が早く焼けるんだ'],
    when: () => tipAny(TIP_TOOLS), hand: () => [tipAnyEl(TIP_TOOLS)] },
  { id: 'place', at: 'shop', on: ['*'], text: ['いちばん左が {スタート}、右が {アンカー}', '並べかえは、おもてなしの前に いつでも'],
    when: () => tipAny(TIP_PLACE), hand: () => [tipAnyEl(TIP_PLACE)] },
  { id: 'fushigi', at: 'shop', on: ['*'], text: ['今夜のお客さんの ふしぎな素材！', 'ショップに出るのは、今夜だけだよ'],
    when: () => N.shop.indexOf('m:' + MONSTERS[N.mon].drop) >= 0, hand: () => [tipShopEl(N.shop.indexOf('m:' + MONSTERS[N.mon].drop))] },
  { id: 'burnt', at: 'shop', on: ['*'], text: ['あっ、{焦げ}ちゃった…', '{焦げ}どうしを まぜると、すごいことに？'],
    when: () => tipBoard(c => cardDef(c.cid).cat === 'burnt') >= 0, hand: () => [tipSlotEl(tipBoard(c => cardDef(c.cid).cat === 'burnt'))] },
  { id: 'view', at: 'shop', on: ['*'], text: ['カードを タップすると', 'くわしい効果が 見られるよ'],
    when: () => N.round >= 3 && N.shop.some(Boolean), hand: () => [tipShopEl(N.shop.findIndex(Boolean))] },
];
let TIP = null, tipT = 0;

/* ---------- 条件と、指でさす所 ---------- */
const tipEl = p => p.where === 'shop' ? tipShopEl(p.i) : tipSlotEl(p.i);
const tipShopEl = i => i >= 0 ? document.querySelector(`.shcard[data-i="${i}"]`) : null;
const tipSlotEl = i => i >= 0 ? document.querySelector(`.tslot[data-w="board"][data-i="${i}"]`) : null;
const tipBoard = f => N.board.findIndex(c => c && f(c));
const tipOkPlan = (p, q, kind) => { const P = dropPlan(p, q); return !!P && P.kind === kind && !P.ng; };
/* 調理台へ買えるショップのカード（生地を先に） */
function tipBuy() {
  const j = freeSlot(); if (j < 0) return -1;
  const ok = i => N.shop[i] && cardDef(N.shop[i]).cat !== 'field' && tipOkPlan({ where: 'shop', i }, { where: 'board', i: j }, 'buy');
  const L = N.shop.map((c, i) => i).filter(ok);
  return L.find(i => cardDef(N.shop[i]).dough) ?? (L.length ? L[0] : -1);
}
function tipField() { return N.shop.findIndex((c, i) => c && cardDef(c).cat === 'field' && tipOkPlan({ where: 'shop', i }, { where: 'field', i: 0 }, 'buy')); }
/* まぜられる2まい（ショップ→調理台を先に・つぎに調理台どうし） */
function tipMix() {
  for (let i = 0; i < N.shop.length; i++) for (let j = 0; j < SLOTS; j++)
    if (N.shop[i] && N.board[j] && tipOkPlan({ where: 'shop', i }, { where: 'board', i: j }, 'mix')) return [{ where: 'shop', i }, { where: 'board', i: j }];
  for (let i = 0; i < SLOTS; i++) for (let j = 0; j < SLOTS; j++)
    if (i !== j && N.board[i] && N.board[j] && tipOkPlan({ where: 'board', i }, { where: 'board', i: j }, 'mix')) return [{ where: 'board', i }, { where: 'board', i: j }];
  return null;
}
const tipAny = f => N.shop.some(c => c && f(cardDef(c))) || N.board.some(c => c && f(cardDef(c.cid)));
function tipAnyEl(f) {
  const i = N.shop.findIndex(c => c && f(cardDef(c)));
  return i >= 0 ? tipShopEl(i) : tipSlotEl(tipBoard(c => f(cardDef(c.cid))));
}

/* ---------- 出す・とじる ---------- */
const tipLines = t => (typeof STORY === 'object' && STORY.tips && STORY.tips[t.id]) || t.text;
const tipNow = () => S.phase === 'night' && N && !busy && !fighting && !talking();
/* renderNight のおわりに呼ぶ：出ているヒントを描きなおす・なければ、しばらくして次をさがす */
/* ほのかの夜だけのヒント（焼く・火力・焦げ）。みなもの夜には出さない（11/19） */
const HONOKA_TIPS = ['field', 'cooked', 'heat', 'burnt'];
function tipSync() {
  clearTimeout(tipT);
  if (TIP && (S.phase !== 'night' || !N || TIP.t.at !== N.stage || !TIP.t.when())) TIP = null;
  if (TIP) { if (tipNow() && !N.view) requestAnimationFrame(tipDraw); return; }
  tipT = setTimeout(tipNext, TIP_GAP);
}
function tipNext() {
  if (TIP || !tipNow() || N.view) return;
  const t = TIPS.find(t => !S.seen['t:' + t.id] && t.at === N.stage && (chefArt() === 'honoka' || !HONOKA_TIPS.includes(t.id)) && t.when());
  if (!t) return;
  TIP = { t, fresh: true };
  S.seen['t:' + t.id] = 1; save();
  tipDraw(); decoReact('hop', 500);
}
/* 操作をしたら呼ぶ（buy・mix・sell・move・reroll・bake・next）。そのヒントの操作なら、とじる */
function tipEv(kind) {
  if (TIP && (TIP.t.on.includes(kind) || TIP.t.on.includes('*'))) { TIP = null; tipClear(); }
}
function tipClose() { TIP = null; tipClear(); }
function tipClear() { for (const id of ['tipb', 'tipf', 'tipd']) { const el = $(id); if (el) el.remove(); } const sc = document.querySelector('.shopov .sh-cards'); if (sc) sc.style.paddingBottom = ''; }
/* うしろを少し暗く（11/19 しょーくん・えらぶ質問「暗くする」＝朝昼の会話とそろえる）。指がさす調理台が見えるよう、朝昼より少しうすく。さわれるように pointer-events なし */
function tipDim(scr, before) {
  const d = document.createElement('div'); d.id = 'tipd'; d.className = 'tipd';
  scr.insertBefore(d, before);
}

/* 低い画面（iPad の横ならびなど）で吹き出しがショップのカードの字にかぶるときは、カードの列の下をあけて小さくする（11/19 点検・高さ600で2段目にかぶっていた） */
function tipRoom(b) {
  const sc = document.querySelector('.shopov .sh-cards'); if (!sc) return;
  sc.style.paddingBottom = '';
  const cr = sc.getBoundingClientRect();   // カードは配るアニメのとちゅうなので、列の箱で見る（カードはまんなかにそろうので、下があけばよける）
  /* 吹き出しは出てくるアニメ（scale .55 から）のとちゅうなので、getBoundingClientRect ではなく、置いた場所（style の top・left）と大きさで見る（11/21 レイアウトの総デバッグ：カードの下の行に 19px かぶっていた） */
  const top = parseFloat(b.style.top), left = parseFloat(b.style.left), right = left + b.offsetWidth;
  if (top < cr.bottom - 2 && right > cr.left && left < cr.right) sc.style.paddingBottom = Math.round(cr.bottom - top + 14) + 'px';
}
/* ---------- 描く：吹き出しはほのかの右上・指は fixed で、さす所の上へ ---------- */
const tipKw = s => s.replace(/\{([^}]+)\}/g, '<b class="kw">$1</b>');
const tipMid = el => { const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; };
function tipDraw() {
  tipClear();
  const scr = $('screen'), st = $('stage');
  if (!TIP || !scr || !st || !tipNow() || N.view) return;
  const b = document.createElement('div');
  b.id = 'tipb'; b.className = 'tipb' + (TIP.fresh && !REDUCED ? ' pop' : '');
  b.setAttribute('role', 'status');
  b.innerHTML = tipLines(TIP.t).map(l => `<p>${tipKw(esc(l))}</p>`).join('') + '<i class="tip-x" aria-label="とじる">×</i>';
  b.addEventListener('click', e => { e.stopPropagation(); tipClose(); });
  scr.appendChild(b);
  /* ほのかの場所は offset で（ぴょこぴょこの transform に左右されない） */
  const sr = st.getBoundingClientRect(), ch = $('dcChibi'), base = ch && ch.offsetParent ? ch.offsetParent.getBoundingClientRect() : null;
  const has = base && ch.offsetWidth;
  const left = has ? base.left + ch.offsetLeft + ch.offsetWidth - 4 : sr.left + 10, foot = has ? base.top + ch.offsetTop + ch.offsetHeight * .72 : sr.bottom - 40;
  b.style.left = Math.round(left) + 'px';
  b.style.maxWidth = Math.round(Math.max(150, sr.right - left - 8)) + 'px';
  b.style.top = Math.round(Math.max(sr.top + 6, foot - b.offsetHeight)) + 'px';   // 幅が決まってから高さで合わせなおす
  /* ラウンドの結果が出ているときは、結果の窓の上に（11/18 16時 しょーくん「チュートリアルの吹き出しがモーダルに被ってた」） */
  const box = document.querySelector('.vbox.result');
  if (box) {
    const r = box.getBoundingClientRect(), W = scr.getBoundingClientRect();
    b.classList.add('down'); b.style.maxWidth = Math.round(W.width - 16) + 'px';
    b.style.left = Math.round(Math.max(W.left + 8, Math.min(W.right - 8 - b.offsetWidth, r.left + r.width / 2 - b.offsetWidth / 2))) + 'px';
    b.style.top = Math.round(Math.max(6, r.top - b.offsetHeight - 14)) + 'px';
  }
  else tipRoom(b);
  TIP.fresh = false;
  const h = TIP.t.hand();
  tipDim(scr, b);
  if (!h || !h[0] || (h.length > 1 && !h[1])) return;
  const f = document.createElement('div');
  f.id = 'tipf'; f.className = 'tipf';
  f.innerHTML = '<i class="tipf-ring"></i>';   // 指は描き下ろしの絵（ui-finger・左上を指す。指先は左上のすみ）
  scr.appendChild(f);
  const A = tipMid(h[0]), B = h[1] ? tipMid(h[1]) : null;
  const at = (p, k) => `translate(${Math.round(p.x - 2)}px, ${Math.round(p.y - 2)}px) scale(${k})`;
  const ring = f.firstElementChild;
  if (REDUCED || !f.animate) { f.style.transform = at(B || A, 1); return; }
  if (B) {
    f.animate([
      { transform: at(A, 1), opacity: 0 }, { transform: at(A, 1), opacity: 1, offset: .12 }, { transform: at(A, .86), opacity: 1, offset: .24 },
      { transform: at(B, .86), opacity: 1, offset: .66 }, { transform: at(B, 1), opacity: 1, offset: .76 }, { transform: at(B, 1), opacity: 0 },
    ], { duration: 2100, iterations: Infinity, easing: 'ease-in-out' });
    ring.animate([{ opacity: 0, transform: 'scale(.4)' }, { opacity: 0, transform: 'scale(.4)', offset: .18 }, { opacity: .9, transform: 'scale(1)', offset: .26 },
      { opacity: .9, transform: 'scale(1)', offset: .66 }, { opacity: 0, transform: 'scale(1.4)', offset: .78 }, { opacity: 0, transform: 'scale(1.4)' }], { duration: 2100, iterations: Infinity });
  } else {
    f.animate([{ transform: at(A, 1) }, { transform: at(A, .84), offset: .3 }, { transform: at(A, 1), offset: .5 }, { transform: at(A, 1) }], { duration: 1300, iterations: Infinity, easing: 'ease-in-out' });
    ring.animate([{ opacity: 0, transform: 'scale(.3)' }, { opacity: .95, transform: 'scale(.5)', offset: .3 }, { opacity: 0, transform: 'scale(1.7)', offset: .85 }, { opacity: 0, transform: 'scale(1.7)' }], { duration: 1300, iterations: Infinity });
  }
}
addEventListener('resize', () => { if (TIP) requestAnimationFrame(tipDraw); });
