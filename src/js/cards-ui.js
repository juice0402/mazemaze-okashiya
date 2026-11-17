/* ==== カード（11/17 夜「カードがこのゲームのキモ」）：ふちはレア度の金属（★1 銅・★2 銀・★3 金と虹の箔）・中は絵の窓・名前のリボン・短い効果の紙
   左上にコストの宝石（仕入れだけ）・絵の右下に炎のダメージの紋章・右上に★。文字の大きさはカードの幅で決まる（style.css の cqw）
   cardMini：手札・ドラッグ・演出　cardTile：調理台（絵と数字だけ・焼き加減のメーター）　cardBig：タップで大きく見る ==== */
function cardTastes(d) { return [...new Set(d.mats.map(m => MATS[m].taste))]; }
/* 属性（種類・役目）と★と味 */
function typeLine(d) {
  const t = cardTastes(d);
  return `${attrsOf(d).join('・')}${d.star > 1 ? ' ★' + d.star : ''}${t.length ? '／' + t.join('・') : ''}`;
}
/* いまのダメージ（生地は焼き加減の倍率こみ） */
function cardDmg(d, cook) { return d.fx.dmg ? Math.floor(d.fx.dmg * STAR_MUL[d.star] * (d.dough ? cookMul(cook || 0) : 1) * 10) / 10 : 0; }
/* 効果のことば（短く） */
function cardChips(d) { return d.cat === 'field' ? FIELDS[d.cid.slice(2)].chips.slice() : fxList(d.fx, d.star); }
const artImg = cid => `<img${hiArt(cid) ? ' class="hi"' : ''} src="${cardIconURL(cid)}" alt="">`;
const starGems = d => d.star > 1 ? `<span class="pc-star">${'★'.repeat(d.star)}</span>` : '';

/* ダメージの紋章（けた数で文字を小さく） */
function powBadge(dmg) { const t = fmt(Math.floor(dmg)); return `<b class="pc-pow l${Math.min(t.length, 5)}">${t}</b>`; }
/* カードの形（mini と huge は同じ形で大きさだけちがう） */
function cardFace(cid, cls, opt = {}) {
  const d = cardDef(cid), dmg = cardDmg(d, opt.cook), text = cardChips(d).slice(0, 2).join('・');   // 紙には大事な2つまで
  const cost = opt.cost != null ? `<span class="pc-cost${typeof opt.cost === 'string' ? ' txt' : ''}">${opt.cost}</span>` : '';
  return `<div class="pc ${cls} k-${d.kind} s${d.star}${dmg ? '' : ' np'}${opt.born ? ' born' : ''}">
    <div class="pc-win"><div class="pc-art">${artImg(cid)}</div><i class="pc-shine"></i></div>
    <div class="pc-name"><span>${esc(d.short)}</span></div>
    <p class="pc-text${text ? '' : ' none'}"><span>${esc(text || attrsOf(d).join('・'))}</span></p>
    ${cost}${starGems(d)}${dmg ? powBadge(dmg) : ''}
  </div>`;
}
function cardMini(cid, opt = {}) { return cardFace(cid, 'mini', opt); }
/* 調理台のタイル：同じふちと絵の窓。数字は右上の紋章、★は左下、生地は下に焼き加減のメーター（9段階。サイコーは金に光る） */
function cardTile(cid, opt = {}) {
  const d = cardDef(cid), cook = d.dough ? opt.cook || 0 : null, dmg = cardDmg(d, cook);
  return `<div class="pc tile k-${d.kind} s${d.star}${dmg ? '' : ' np'}${opt.born ? ' born' : ''}${cook >= COOK_MAX ? ' best' : ''}">
    <div class="pc-win"><div class="pc-art">${artImg(cid)}</div><i class="pc-shine"></i></div>
    ${starGems(d)}${dmg ? powBadge(dmg) : ''}
    ${cook != null ? `<i class="cook c${cookStage(cook)}" style="--c:${cook}"></i>` : ''}</div>`;
}
function cardBig(cid, cook) { return cardFace(cid, 'huge', { cook }); }
/* 大きなカードの下：種類と、生地は焼き加減・お菓子は材料だけ（効果はカードに書いてある） */
function cardInfo(cid, cook) {
  const d = cardDef(cid);
  /* カードの名前（8文字まで）→ 種類 → 効果ぜんぶ（1つずつ札で）→ ダメージ・焼き加減 → 材料。★1の長い名前は、どんな材料かの小さな説明に */
  const sub = d.name !== d.short ? `<p class="ci-sub">${esc(d.name)}</p>` : '';
  const fx = cardChips(d), fl = fx.length ? `<p class="ci-chips">${fx.map(t => `<span>${esc(t)}</span>`).join('')}</p>` : '';
  const ck = d.dough ? `<p class="ci-cook">焼き加減 <b>${cook || 0}</b>/${COOK_MAX}　${cookName(cook || 0)}・×${fmtMul(cookMul(cook || 0))}</p>` : '';
  const dm = Math.floor(cardDmg(d, cook)), dl = dm ? `<p class="ci-dmg"><i></i>ダメージ <b>${fmt(dm)}</b></p>` : '';   // 炎の紋章の数字＝ダメージ
  const mats = d.kind === 'o' || d.kind === 's' ? `<p class="ci-recipe">材料：${d.mats.map(m => MATS[m].short).join('＋')}</p>` : '';
  return `<div class="cinfo k-${d.kind}"><p class="ci-name">${esc(d.short)}</p>${sub}<p class="ci-type">${attrsOf(d).join('・')}</p>${fl}${dl}${ck}${mats}</div>`;
}
