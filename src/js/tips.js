/* ==== 夜のヒント（チュートリアル・11/18 しょーくん：ゆるく・数字はふつう／11/21：3つだけ・指と暗さなし）
   ショップはふつうのまま・何でもできる。はじめて○○できるときに1回だけ、舞台のデフォルメのほのかが吹き出しで話す（遊びは止めない）
   見たヒントは S.seen['t:<id>']（セーブ）。文は STORY.tips[id]（昼のチャットの story.js）があればそちら。1行は24文字まで・2行まで・{ことば} は黄色
   出す：renderNight のおわりに tipSync()。とじる：吹き出しをタップ・そのヒントの操作（tipEv）・場面が変わる・条件がなくなる */
const TIP_GAP = 700;   // 画面が落ち着いてから出す（ショップのカードが配られるあいだは待つ）
/* id＝名前・at＝出す場面・on＝とじる操作・text＝文・when＝出す条件。上ほど先
   11/21 しょーくん「くどい・テンポが悪い」：1日目の3つだけ（ドラッグ・おもてなし！・まぜる）。指とうしろの暗さはなし（遊びを止めない） */
const TIPS = [
  { id: 'shop1', at: 'shop', on: ['buy', 'mix'], text: ['カードを 下の調理台へ ドラッグ！', '今夜は 3まい 無料だよ'],
    when: () => N.round === 1 && !N.field && !N.board.some(Boolean) && tipBuy() >= 0 },
  { id: 'bake', at: 'shop', on: ['bake'], text: ['準備ができたら', 'おもてなし！を おしてね'],
    when: () => N.board.some(Boolean) && (N.round > 1 || N.picks === 0 || !N.shop.some(Boolean)) },
  { id: 'mix', at: 'shop', on: ['mix'], text: ['まぜ の札がついたカードは', 'かさねると まぜまぜ！★が上がるよ'],
    when: () => !!tipMix() },
];
let TIP = null, tipT = 0;

/* ---------- 出す条件 ---------- */
const tipOkPlan = (p, q, kind) => { const P = dropPlan(p, q); return !!P && P.kind === kind && !P.ng; };
/* 調理台へ買えるショップのカード */
function tipBuy() {
  const j = freeSlot(); if (j < 0) return -1;
  return N.shop.findIndex((c, i) => c && cardDef(c).cat !== 'field' && tipOkPlan({ where: 'shop', i }, { where: 'board', i: j }, 'buy'));
}
/* まぜられる2まいがあるか（ショップ→調理台・調理台どうし） */
function tipMix() {
  for (let i = 0; i < N.shop.length; i++) for (let j = 0; j < SLOTS; j++)
    if (N.shop[i] && N.board[j] && tipOkPlan({ where: 'shop', i }, { where: 'board', i: j }, 'mix')) return true;
  for (let i = 0; i < SLOTS; i++) for (let j = 0; j < SLOTS; j++)
    if (i !== j && N.board[i] && N.board[j] && tipOkPlan({ where: 'board', i }, { where: 'board', i: j }, 'mix')) return true;
  return false;
}

/* ---------- 出す・とじる ---------- */
const tipLines = t => (typeof STORY === 'object' && STORY.tips && STORY.tips[t.id]) || t.text;
const tipNow = () => S.phase === 'night' && N && !busy && !fighting && !talking();
/* renderNight のおわりに呼ぶ：出ているヒントを描きなおす・なければ、しばらくして次をさがす */
function tipSync() {
  clearTimeout(tipT);
  if (TIP && (S.phase !== 'night' || !N || TIP.t.at !== N.stage || !TIP.t.when())) TIP = null;
  if (TIP) { if (tipNow() && !N.view) requestAnimationFrame(tipDraw); return; }
  tipT = setTimeout(tipNext, TIP_GAP);
}
function tipNext() {
  if (TIP || !tipNow() || N.view) return;
  const t = TIPS.find(t => !S.seen['t:' + t.id] && t.at === N.stage && t.when());
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
function tipClear() { const el = $('tipb'); if (el) el.remove(); const sc = document.querySelector('.shopov .sh-cards'); if (sc) sc.style.paddingBottom = ''; }
/* 低い画面（iPad の横ならびなど）で吹き出しがショップのカードの字にかぶるときは、カードの列の下をあけて小さくする（11/19 点検・高さ600で2段目にかぶっていた） */
function tipRoom(b) {
  const sc = document.querySelector('.shopov .sh-cards'); if (!sc) return;
  sc.style.paddingBottom = '';
  const cr = sc.getBoundingClientRect();   // カードは配るアニメのとちゅうなので、列の箱で見る（カードはまんなかにそろうので、下があけばよける）
  /* 吹き出しは出てくるアニメ（scale .55 から）のとちゅうなので、getBoundingClientRect ではなく、置いた場所（style の top・left）と大きさで見る（11/21 レイアウトの総デバッグ：カードの下の行に 19px かぶっていた） */
  const top = parseFloat(b.style.top), left = parseFloat(b.style.left), right = left + b.offsetWidth;
  if (top < cr.bottom - 2 && right > cr.left && left < cr.right) sc.style.paddingBottom = Math.round(cr.bottom - top + 14) + 'px';
}
/* ---------- 描く：吹き出しはほのかの右上 ---------- */
const tipKw = s => s.replace(/\{([^}]+)\}/g, '<b class="kw">$1</b>');
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
  tipRoom(b);
  TIP.fresh = false;
}
addEventListener('resize', () => { if (TIP) requestAnimationFrame(tipDraw); });
