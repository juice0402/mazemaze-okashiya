/* ==== 紙のカード：TCG のような構成（名前と★・絵・種類・効果とフレーバー・ステータス） ====
   小さいカード（cardMini）は調理台と仕入れ、大きいカード（cardBig）はタップでひらく。枠の色は種類ごと（style.css の .pc.k-*） */

function cardTastes(d) { return [...new Set(d.mats.map(m => MATS[m].taste))]; }
function typeLine(d) {
  const t = cardTastes(d);
  return `${KIND_NAME[d.kind]}${d.star > 1 ? ' ★' + d.star : ''}${t.length ? '／' + t.join('・') : ''}`;
}
/* ステータス：ダメージの数字と、短い効果の札 */
function cardDmg(d) { return d.fx.dmg ? Math.floor(d.fx.dmg * STAR_MUL[d.star] * 10) / 10 : 0; }
function cardChips(d) {
  const fx = d.fx, m = STAR_MUL[d.star], r = v => Math.floor(v * m * 10) / 10, out = [];
  if (fx.set != null) out.push(`火力を${fx.set}に`);
  if (fx.first) out.push(`火力+${fx.heat || 0}（先頭+${(fx.heat || 0) + fx.first}）`);
  else if (fx.heat) out.push(`火力${fx.heat > 0 ? '+' : '−'}${Math.abs(fx.heat)}`);
  if (fx.hd) out.push(`＋火力×${r(fx.hd)}`);
  if (fx.kd) out.push(`＋焦げ×${r(fx.kd)}`);
  if (fx.nb) out.push(`となり+${r(fx.nb)}`);
  if (fx.next) out.push(`つぎ×${fx.next}`);
  if (fx.again) out.push(`右もう${fx.again}回`);
  if (fx.proof) out.push('焦げOK');
  if (fx.shop) out.push(`仕入れ+${fx.shop}`);
  if (fx.coin) out.push(`コイン+${fx.coin}`);
  return out;
}
const starsHTML = d => d.star > 1 ? `<i class="pc-st">${'★'.repeat(d.star)}</i>` : '';
const artImg = cid => `<img${hiArt(cid) ? ' class="hi"' : ''} src="${cardIconURL(cid)}" alt="">`;

function cardMini(cid, opt = {}) {
  const d = cardDef(cid), dmg = cardDmg(d), ch = cardChips(d).slice(0, opt.chips == null ? 2 : opt.chips);
  return `<div class="pc mini k-${d.kind}${opt.born ? ' born' : ''}">
    <div class="pc-name"><span>${esc(d.short)}</span>${starsHTML(d)}</div>
    <div class="pc-art">${artImg(cid)}</div>
    ${opt.cost != null ? `<div class="pc-cost">${opt.cost}</div>` : `<div class="pc-foot">${ch.map(c => `<span class="chip">${c}</span>`).join('')}${dmg ? `<b class="pc-atk">${dmg}</b>` : ''}</div>`}
  </div>`;
}
function cardBig(cid) {
  const d = cardDef(cid), dmg = cardDmg(d);
  const flavor = d.kind === 'o' || d.kind === 's' ? FLAVOR[d.kind] : FLAVOR[cid.slice(2)];
  const recipe = d.kind === 'o' || d.kind === 's' ? `<p class="pc-recipe">材料：${d.mats.map(m => MATS[m].name).join('＋')}</p>` : '';
  return `<div class="pc big k-${d.kind}">
    <div class="pc-name"><span>${esc(d.name)}</span>${starsHTML(d)}</div>
    <div class="pc-art">${artImg(cid)}</div>
    <div class="pc-type">【${typeLine(d)}】</div>
    <div class="pc-text"><p class="pc-fx">${fxText(d.fx, d.star)}</p>${recipe}<p class="pc-flavor">${esc(flavor || '')}</p></div>
    <div class="pc-foot">${cardChips(d).map(c => `<span class="chip">${c}</span>`).join('')}${dmg ? `<b class="pc-atk">${dmg}</b>` : ''}</div>
  </div>`;
}
