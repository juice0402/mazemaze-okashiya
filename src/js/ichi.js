/* ==== 夜市（11/22 夜 しょーくん「夜市をもっと専用のページに・背景とか売り場を描き下ろしで・ドワーフの女の子の行商人が仕入れたモンスター素材・値段はランダムで値上げも値引きも」）
   えらぶ質問で「来店の前に寄る」「品ごと＋たまに大安売り」「毎晩4品だけ」「ランタンの夜商人」。
   流れ：夕方 startNight → N.stage 'ichi'（このページ）→ ichiGo → えらぶ画面 'pick'（ビルドが2つ以上）か 来店 'arrive'。並ぶ品がない夜（1日目など）は出さない
   品と値段はその夜の仕入れ ichiStock（world.js・日にちで決まる）。タップで大きく見る → 買う・やめる（night.js の ichiPick・このページのあいだは お金がもどる）。3まいまで（ICHI_N）
   買った素材は その夜のデッキに入る（night.js の poolList）
   絵：ichi-bg（背景）・dwarf（行商人）・ichi-counter（屋台のカウンター）・ichi-tag／ichi-tag-sale（値札）・ichi-banner（大安売りの旗）。絵がないあいだは CSS の仮の見た目
   行商人の名前とセリフは STORY.ichiName・STORY.ichi（昼のチャット）。ないあいだは下の ICHI_SAY（ぽぽちの仮） ==== */
let ichiSel = null, ichiLine = '';   // 大きく見ている品・行商人のひとこと（'' はあいさつ）
const ICHI_SAY = {
  hello: ['いらっしゃい！ 森の奥で見つけた素材、そろってるよ', 'こんばんは！ 今夜もいいのが入ったよ', 'ランタンのあかりで、ゆっくり見ていってね'],
  sale: ['今夜は大安売り！ ぜんぶ半額だよ'],
  buy: ['ありがと！ おいしいおもてなしになるといいね'],
  back: ['はーい、もどしておくね'],
  full: ['今夜はここまで。持ちきれないでしょ？'],
  poor: ['あれれ、お財布がちょっと足りないみたい'],
};
const ICHI_TAG = { down: 'お買い得', up: 'ちょっと高い' };
const ICHI_FACE = { sale: 'wow', buy: 'wink', back: 'joy', full: 'komari', poor: 'komari' };   // ひとことに合わせた行商人の顔（絵 dwarf-<顔>・ないあいだは dwarf）
function ichiSay(k) {
  const L = (typeof STORY === 'object' && STORY.ichi && STORY.ichi[k]) || ICHI_SAY[k] || ICHI_SAY.hello;
  return typeof L === 'function' ? L() : L[S.day % L.length];
}
function ichiView(id) {
  if (!N || N.stage !== 'ichi') return;
  ichiSel = id && ichiStock().items.some(x => x.id === id) ? id : null;
  if (ichiSel) sePlay('tap');
  ichiRender();
}
function ichiRender() {
  const st = ichiStock(), on = N.ichi || [], left = ICHI_N - on.length;
  const k = ichiLine || (st.sale ? 'sale' : 'hello'), face = ICHI_FACE[k];
  const bg = ART['ichi-bg'], girl = (face && ART['dwarf-' + face]) || ART['dwarf'], name = (typeof STORY === 'object' && STORY.ichiName) || '行商人';
  const art = n => ART[n] ? ` style="background-image:url('${ART[n]}')"` : '';
  const items = st.items.map(it => {
    const b = on.includes(it.id), poor = !b && (S.money < it.price || left <= 0);
    return `<button class="ich-it${b ? ' on' : ''}${poor ? ' poor' : ''}" data-act="ichiV" data-id="${esc(it.id)}" aria-label="${esc(MATS[it.id].short)} ${fmt(it.price)}円">
      <i class="ich-tag ${it.tag}${ART[it.tag === 'down' || it.tag === 'sale' ? 'ichi-tag-sale' : 'ichi-tag'] ? ' art' : ''}"${art(it.tag === 'down' || it.tag === 'sale' ? 'ichi-tag-sale' : 'ichi-tag')}><b>${fmt(it.price)}<small>円</small></b>${ICHI_TAG[it.tag] ? `<em>${ICHI_TAG[it.tag]}</em>` : ''}</i>
      <span class="ich-card">${cardTile('m:' + it.id)}</span><span class="ich-nm">${esc(MATS[it.id].short)}</span>${b ? '<i class="ich-got">買った</i>' : ''}</button>`;
  }).join('');
  $('screen').innerHTML = `<section class="ichi fit${bg ? ' hasbg' : ''}">
    <div class="ich-stage" style="--ichbg:url('${bg || ART['bg-shop-out-tall'] || ''}')">
      <div class="ich-top"><span class="ich-ttl">夜市</span></div>
      ${st.sale ? `<div class="ich-banner${ART['ichi-banner'] ? ' art' : ''}"${art('ichi-banner')}><b>大安売り</b><small>ぜんぶ半額</small></div>` : ''}
      ${girl ? `<img class="ich-girl" src="${girl}" alt="${esc(name)}">` : ''}
      <p class="ich-say${st.sale ? ' low' : ''}"><b>${esc(name)}</b>${esc(ichiSay(k))}</p>
      <div class="ich-counter${ART['ichi-counter'] ? ' art' : ''}"${art('ichi-counter')}><div class="ich-row">${items}</div></div>
    </div>
    <p class="ich-info">${left > 0 ? `かごに あと <b>${left}</b>つ` : 'かごは いっぱい'}</p>
    <div class="bar"><button class="bake" data-act="ichiGo">${on.length ? 'これで お店へ' : '買わずに お店へ'}</button></div>
    ${ichiViewerHTML(st)}</section>`;
  renderTop();
  /* はじめての夜市は、はじめましての会話（STORY.ichiFirst・昼のチャット。ないあいだは出さない） */
  if (!S.seen.ichi && typeof STORY === 'object' && typeof STORY.ichiFirst === 'function' && !talking()) { S.seen.ichi = S.day; save(); talk(STORY.ichiFirst(), () => {}); }
}
function ichiViewerHTML(st) {
  const it = ichiSel && st.items.find(x => x.id === ichiSel); if (!it) return '';
  const b = (N.ichi || []).includes(it.id), cid = 'm:' + it.id;
  const btn = b ? `<button class="pill sub" data-act="ichiBuy" data-id="${esc(it.id)}">やめる <small>+${fmt((N.ichiPaid || {})[it.id] || it.price)}円</small></button>`
    : `<button class="pill go2" data-act="ichiBuy" data-id="${esc(it.id)}">買う <small>${fmt(it.price)}円</small></button>`;
  return `<div class="viewer" data-act="ichiClose"><div class="vbox" data-act="noop"><button class="vclose" data-act="ichiClose" aria-label="とじる">×</button>${cardBig(cid)}${cardInfo(cid)}
    <div class="vbtns"><button class="pill sub" data-act="ichiClose">とじる</button>${btn}</div><p class="vhint">${ICHI_TAG[it.tag] ? ICHI_TAG[it.tag] + '・' : it.tag === 'sale' ? '大安売り・' : ''}買うと 今夜だけ ショップに出る</p></div></div>`;
}
