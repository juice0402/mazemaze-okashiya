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

/* 属性の帯（ゼンゼロの形・11/18 しょーくん）：左が役目・右が種類。色で見分ける */
const ATTR_C = { 攻撃: 'atk', 支援: 'sup', 火力: 'fire', 仕入れ: 'buy', 生地: 'dough', 素材: 'mat', 道具: 'tool', 焦げ: 'koge', フィールド: 'field' };
function attrBar(d) {
  const a = d.cat === 'field' ? ['フィールド'] : [d.role, CAT_NAME[d.cat]].filter(Boolean);
  return `<p class="pc-attr">${a.map(t => `<span class="at-${ATTR_C[t] || 'etc'}">${t}</span>`).join('')}</p>`;
}
/* 効果のない★1の紙（役目だけ） */
const plainLine = d => d.role === '攻撃' ? 'ダメージを出す' : attrsOf(d).join('・');
/* ことば（KW）を黄色に。tap なら、タップで説明が出る（大きく見る画面だけ） */
const kwTag = (w, tap, show = w) => `<b class="kw"${tap ? ` data-act="kw" data-kw="${w}"` : ''}>${show}</b>`;
const KW_SHORT = /スタート|アンカー|サイコー|火力|焦げ/g;   // カードの紙（「」なし）
const KW_LONG = new RegExp(`「(${Object.keys(KW).join('|')})」`, 'g');   // 効果の文（「」つき）
const kwShort = (t, tap) => esc(t).replace(KW_SHORT, w => kwTag(w, tap));
const kwLong = (t, tap) => esc(t).replace(KW_LONG, (s, w) => kwTag(w, tap, s));
/* ことばの説明の吹き出し（もう一度タップ・ほかの所をタップでとじる） */
function showKw(el) {
  const box = el.closest('.vbox') || $('screen'), w = el.dataset.kw, old = box.querySelector('.kwtip');
  if (old) { old.remove(); if (old.dataset.kw === w) return; }
  const t = document.createElement('div');
  t.className = 'kwtip'; t.dataset.kw = w; t.dataset.act = 'noop';
  t.innerHTML = `<b>${esc(w)}</b><p>${esc(KW[w] || '')}</p>`;
  box.appendChild(t);
  const B = box.getBoundingClientRect(), r = el.getBoundingClientRect(), h = t.offsetHeight;
  const below = r.bottom + 8 + h < B.bottom || r.top - B.top < h + 8;
  t.style.top = (below ? r.bottom - B.top + 8 : r.top - B.top - h - 8) + 'px';
  t.classList.add(below ? 'dn' : 'up');
  const left = (B.width - t.offsetWidth) / 2;
  t.style.setProperty('--ax', Math.max(16, Math.min(t.offsetWidth - 16, r.left + r.width / 2 - B.left - left)) + 'px');
}
function hideKw() { for (const t of document.querySelectorAll('.kwtip')) t.remove(); }

/* ダメージの紋章（けた数で文字を小さく） */
function powBadge(dmg) { const t = fmt(Math.floor(dmg)); return `<b class="pc-pow l${Math.min(t.length, 5)}">${t}</b>`; }
/* カードの形（mini と huge は同じ形で大きさだけちがう） */
function cardFace(cid, cls, opt = {}) {
  const d = cardDef(cid), dmg = cardDmg(d, opt.cook), text = cardChips(d).slice(0, 2).join('・');   // 紙には大事な2つまで
  const cost = opt.cost != null ? `<span class="pc-cost${typeof opt.cost === 'string' ? ' txt' : ''}">${opt.cost}</span>` : '';
  return `<div class="pc ${cls} k-${d.kind} s${d.star}${dmg ? '' : ' np'}${opt.born ? ' born' : ''}">
    <div class="pc-win"><div class="pc-art">${artImg(cid)}</div><i class="pc-shine"></i></div>
    <div class="pc-name"><span>${esc(d.short)}</span></div>${attrBar(d)}
    <p class="pc-text${text ? '' : ' none'}"><span>${text ? kwShort(text, opt.tap) : esc(plainLine(d))}</span></p>
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
function cardBig(cid, cook) { return cardFace(cid, 'huge', { cook, tap: true }); }
/* 大きなカードの下（ゼンゼロの形・11/18 しょーくん）：名前と属性はカードに出ているので書かない
   効果の文（1つずつ・「」のことばは黄色でタップすると説明）→ ダメージ・焼き加減 → 材料 */
function cardInfo(cid, cook) {
  const d = cardDef(cid);
  let lines = d.cat === 'field' ? [FIELDS[d.cid.slice(2)].text] : fxLong(d.fx, d.star);
  if (!lines.length) lines = [plainLine(d)];
  const fx = `<ul class="ci-fx">${lines.map(t => `<li>${kwLong(t, true)}</li>`).join('')}</ul>`;
  const dm = Math.floor(cardDmg(d, cook)), c = cook || 0;   // 炎の紋章の数字＝ダメージ
  const st = (dm ? `<span class="ci-dmg"><i></i>ダメージ <b>${fmt(dm)}</b></span>` : '')
    + (d.dough ? `<span class="ci-cook">${kwTag('焼き加減', true)} <b>${c}</b>/${COOK_MAX}・${cookName(c)} ×${fmtMul(cookMul(c))}</span>` : '');
  const mats = d.kind === 'o' || d.kind === 's' ? `<p class="ci-recipe">材料：${d.mats.map(m => MATS[m].short).join('＋')}</p>` : '';
  return `<div class="cinfo k-${d.kind}">${fx}${st ? `<p class="ci-stat">${st}</p>` : ''}${mats}</div>`;
}
