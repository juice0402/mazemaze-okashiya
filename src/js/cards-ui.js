/* ==== カード（今どきの縦持ちカードゲームの形：絵が主役・大きな数字・★のきらめき） ====
   cardMini：調理台と手札（仕入れ）。絵がカードいっぱい、左上に効果の札1つ（手札はコストの丸）、右上に★、下に名前の帯、右下に大きなダメージの数字
   cardBig：タップでひらく大きなカード。説明はカードの下の紙（cardInfo）に出す。枠と光の色は style.css の .pc.k-* */

function cardTastes(d) { return [...new Set(d.mats.map(m => MATS[m].taste))]; }
/* 属性（種類・役目）と★と味 */
function typeLine(d) {
  const t = cardTastes(d);
  return `${attrsOf(d).join('・')}${d.star > 1 ? ' ★' + d.star : ''}${t.length ? '／' + t.join('・') : ''}`;
}
/* いまのダメージ（生地は焼き加減の倍率こみ） */
function cardDmg(d, cook) { return d.fx.dmg ? Math.floor(d.fx.dmg * STAR_MUL[d.star] * (d.dough ? cookMul(cook || 0) : 1) * 10) / 10 : 0; }
/* 効果の札（短いことば）。小さいカードには1つめだけ出す */
function cardChips(d) {
  if (d.cat === 'field') return FIELDS[d.cid.slice(2)].chips.slice();
  const fx = d.fx, m = STAR_MUL[d.star], r = v => Math.floor(v * m * 10) / 10, out = [];
  if (fx.heat) out.push(`火力${fx.heat > 0 ? '+' : '−'}${Math.abs(fx.heat)}段`);
  if (fx.sear) out.push(`右を焼く+${fx.sear}`);
  if (fx.spd) out.push(fx.spd > 0 ? 'はやく焼ける' : 'ゆっくり焼ける');
  if (fx.lead) out.push(`先頭で×${fx.lead}`);
  if (fx.sai) out.push(`最後でサイコー1枚×${fx.sai + 0.5 * (d.star - 1)}`);
  if (fx.bitter) out.push('焦げると焦げ焦げ');
  if (fx.nb) out.push(`となり+${r(fx.nb)}`);
  if (fx.next) out.push(`つぎ×${fx.next}`);
  if (fx.fin) out.push(`最後で合計×${fx.fin}`);
  if (fx.rally) out.push(`先頭で攻撃ぜんぶ+${r(fx.rally)}`);
  if (fx.again) out.push(`右もう${fx.again}回`);
  if (fx.call) out.push('フィールドをよぶ');
  if (fx.noburn) out.push('焦げない');
  if (fx.stop) out.push('生地がサイコーで止まる');
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
/* 調理台のタイル（アイコンだけ）：地の色・絵・★・右下に小さなダメージ */
/* 生地のタイルには焼き加減のメーター（9段階。サイコーは金に光る） */
function cardTile(cid, opt = {}) {
  const d = cardDef(cid), cook = d.dough ? opt.cook || 0 : null, dmg = cardDmg(d, cook);
  return `<div class="pc tile k-${d.kind} s${d.star}${opt.born ? ' born' : ''}${cook >= COOK_MAX ? ' best' : ''}">
    <div class="pc-art">${artImg(cid)}</div><i class="pc-shine"></i>
    ${d.star > 1 ? `<span class="tl-star">${'★'.repeat(d.star)}</span>` : ''}${dmg ? `<b class="tl-pow">${Math.floor(dmg)}</b>` : ''}
    ${cook != null ? `<i class="cook c${cookStage(cook)}" style="--c:${cook}"></i>` : ''}</div>`;
}
function cardBig(cid, cook) {
  const d = cardDef(cid), dmg = cardDmg(d, cook);
  return `<div class="pc huge k-${d.kind} s${d.star}">
    <div class="pc-art">${artImg(cid)}</div><i class="pc-shine"></i>
    ${starGems(d)}
    <div class="pc-plate"><span>${esc(d.name)}</span></div>
    ${dmg ? `<b class="pc-pow">${dmg}</b>` : ''}
  </div>`;
}
/* 大きなカードの下の説明（紙のラベル） */
function cardInfo(cid, cook) {
  const d = cardDef(cid);
  const flavor = d.kind === 'o' || d.kind === 's' || d.kind === 'k' ? FLAVOR[d.kind] : d.cat === 'tool' && d.star > 1 ? FLAVOR.u : FLAVOR[cid.slice(2)];
  const recipe = d.kind === 'o' || d.kind === 's' ? `<p class="ci-recipe">材料：${d.mats.map(m => MATS[m].short).join('＋')}</p>` : '';
  return `<div class="cinfo k-${d.kind}">
    <p class="ci-type">${typeLine(d)}</p>
    <div class="ci-chips">${cardChips(d).map(c => `<span>${c}</span>`).join('')}</div>
    <p class="ci-fx">${d.cat === 'field' ? FIELDS[cid.slice(2)].text + '。調理台の左の「場」に置く' : fxText(d.fx, d.star)}</p>${recipe}
    ${d.dough ? `<p class="ci-cook">焼き加減 <b>${cook || 0}</b>/${COOK_MAX}（${cookName(cook || 0)}・ダメージ×${fmtMul(cookMul(cook || 0))}）${d.fx.noburn ? '' : '　サイコーのまま焼かれると焦げる'}</p>` : ''}
    <p class="ci-flavor">${esc(flavor || '')}</p>
  </div>`;
}
