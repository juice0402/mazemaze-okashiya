/* ==== カード（今どきの縦持ちカードゲームの形：絵が主役・大きな数字・★のきらめき） ====
   cardMini：調理台と手札（仕入れ）。絵がカードいっぱい、左上に効果の札1つ（手札はコストの丸）、右上に★、下に名前の帯、右下に大きなダメージの数字
   cardBig：タップでひらく大きなカード。説明はカードの下の紙（cardInfo）に出す。枠と光の色は style.css の .pc.k-* */

function cardTastes(d) { return [...new Set(d.mats.map(m => MATS[m].taste))]; }
function typeLine(d) {
  const t = cardTastes(d);
  return `${KIND_NAME[d.kind]}${d.star > 1 ? ' ★' + d.star : ''}${t.length ? '／' + t.join('・') : ''}`;
}
function cardDmg(d) { return d.fx.dmg ? Math.floor(d.fx.dmg * STAR_MUL[d.star] * 10) / 10 : 0; }
/* 効果の札（短いことば）。小さいカードには1つめだけ出す */
function cardChips(d) {
  const fx = d.fx, m = STAR_MUL[d.star], r = v => Math.floor(v * m * 10) / 10, out = [];
  if (fx.set != null) out.push(`火力を${fx.set}に`);
  if (fx.first) out.push(`先頭で火力+${(fx.heat || 0) + fx.first}`);
  else if (fx.heat) out.push(`火力${fx.heat > 0 ? '+' : '−'}${Math.abs(fx.heat)}`);
  if (fx.again) out.push(`右もう${fx.again}回`);
  if (fx.next) out.push(`つぎ×${fx.next}`);
  if (fx.nb) out.push(`となり+${r(fx.nb)}`);
  if (fx.hd) out.push(`＋火力×${r(fx.hd)}`);
  if (fx.kd) out.push(`＋焦げ×${r(fx.kd)}`);
  if (fx.proof) out.push('焦げOK');
  if (fx.shop) out.push(`仕入れ+${fx.shop}`);
  if (fx.coin) out.push(`コイン+${fx.coin}`);
  return out;
}
const artImg = cid => `<img${hiArt(cid) ? ' class="hi"' : ''} src="${cardIconURL(cid)}" alt="">`;
const starGems = d => d.star > 1 ? `<span class="pc-star">${'★'.repeat(d.star)}</span>` : '';

function cardMini(cid, opt = {}) {
  const d = cardDef(cid), dmg = cardDmg(d), tag = cardChips(d)[0];
  return `<div class="pc mini k-${d.kind} s${d.star}${dmg ? '' : ' np'}${opt.born ? ' born' : ''}">
    <div class="pc-art">${artImg(cid)}</div><i class="pc-shine"></i>
    ${opt.cost != null ? `<span class="pc-cost">${opt.cost}</span>` : tag ? `<span class="pc-tag">${tag}</span>` : ''}
    ${starGems(d)}
    <div class="pc-plate"><span>${esc(d.short)}</span></div>
    ${dmg ? `<b class="pc-pow">${dmg}</b>` : ''}
  </div>`;
}
function cardBig(cid) {
  const d = cardDef(cid), dmg = cardDmg(d);
  return `<div class="pc huge k-${d.kind} s${d.star}">
    <div class="pc-art">${artImg(cid)}</div><i class="pc-shine"></i>
    ${starGems(d)}
    <div class="pc-plate"><span>${esc(d.name)}</span></div>
    ${dmg ? `<b class="pc-pow">${dmg}</b>` : ''}
  </div>`;
}
/* 大きなカードの下の説明（紙のラベル） */
function cardInfo(cid) {
  const d = cardDef(cid);
  const flavor = d.kind === 'o' || d.kind === 's' ? FLAVOR[d.kind] : FLAVOR[cid.slice(2)];
  const recipe = d.kind === 'o' || d.kind === 's' ? `<p class="ci-recipe">材料：${d.mats.map(m => MATS[m].short).join('＋')}</p>` : '';
  return `<div class="cinfo k-${d.kind}">
    <p class="ci-type">${typeLine(d)}</p>
    <div class="ci-chips">${cardChips(d).map(c => `<span>${c}</span>`).join('')}</div>
    <p class="ci-fx">${fxText(d.fx, d.star)}</p>${recipe}
    <p class="ci-flavor">${esc(flavor || '')}</p>
  </div>`;
}
