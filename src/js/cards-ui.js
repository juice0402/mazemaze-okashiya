/* ==== カード（11/17 夜「カードがこのゲームのキモ」）：ふちはレア度の金属（★1 銅・★2 銀・★3 金と虹の箔）・中は絵の窓・名前のリボン・属性の帯・短い効果の紙
   左上に炎のダメージの紋章・右上に★。生地は紙の左に焼き加減の炎（色と数字）。文字の大きさはカードの幅で決まる（style.css の cqw）
   cardMini：手札・ドラッグ・演出　cardTile：調理台（絵と数字・焼き加減の炎とメーター）　cardBig：タップで大きく見る ==== */
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
const KW_SHORT = /スタート|アンカー|サイコー|火力|焦げ/g;   // カードの紙
const kwShort = (t, tap) => esc(t).replace(KW_SHORT, w => kwTag(w, tap));
const kwLong = (t, tap) => esc(t).replace(/\{([^}]+)\}/g, (s, w) => kwTag(w, tap));   // 効果の文の {ことば}
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

/* 焼き加減の炎（ほのかだけ・11/18 しょーくん「攻撃の下に、炎の色が変わる」）：生＝白・半焼け＝黄・こんがり＝オレンジ・サイコー＝金に光る。中の数字が焼き加減 */
const cookIcon = cook => `<i class="ck c${cookStage(cook)}" title="焼き加減 ${cook}"><b>${cook}</b></i>`;
/* 紙の字の大きさ：1行に収まるように（数字や記号は細いので少なく数える） */
const textW = t => [...t].reduce((a, c) => a + (/[0-9.+\-]/.test(c) ? .6 : /[×−]/.test(c) ? .8 : 1), 0);
const fitFs = (t, w) => Math.min(9, Math.floor(w / textW(t) * 10) / 10);

/* ダメージの紋章（けた数で文字を小さく） */
/* ★2・★3のきらめき（11/18 軽量化）：光の帯は transform で動かす（色をぬりなおさない）。★1には出さない
   pc-shine＝絵の窓の上・pc-gl＝ふちの上（いちばん最後に置いて、前の .pc::after と同じ重なり） */
const shineI = d => d.star > 1 ? '<i class="pc-shine"></i>' : '';
const glossI = d => d.star > 1 ? '<i class="pc-gl"></i>' : '';
function powBadge(dmg) { const t = fmt(Math.floor(dmg)); return `<b class="pc-pow l${Math.min(t.length, 5)}">${t}</b>`; }
/* カードの形（mini と huge は同じ形で大きさだけちがう）。紙は1つの効果を1行で、上から大事な2つまで */
function cardFace(cid, cls, opt = {}) {
  const d = cardDef(cid), dmg = cardDmg(d, opt.cook), lines = cardChips(d).slice(0, 2);
  const ck = d.dough ? cookIcon(opt.cook || 0) : '', w = ck ? 64 : 82;   // 紙の字の幅（cqw）
  const txt = lines.length ? lines.map(t => `<span class="ln" style="font-size:${fitFs(t, w)}cqw">${kwShort(t, opt.tap)}</span>`).join('')
    : `<span class="ln plain">${esc(plainLine(d))}</span>`;
  const cost = opt.cost != null ? `<span class="pc-cost${typeof opt.cost === 'string' ? ' txt' : ''}">${opt.cost}</span>` : '';
  return `<div class="pc ${cls} k-${d.kind} s${d.star}${dmg ? '' : ' np'}${opt.born ? ' born' : ''}">
    <div class="pc-win"><div class="pc-art">${artImg(cid)}</div>${shineI(d)}</div>
    <div class="pc-name"><span>${esc(d.short)}</span></div>${attrBar(d)}
    <div class="pc-text${ck ? ' has-ck' : ''}">${ck}<span class="pl">${txt}</span></div>
    ${cost}${starGems(d)}${dmg ? powBadge(dmg) : ''}${glossI(d)}
  </div>`;
}
function cardMini(cid, opt = {}) { return cardFace(cid, 'mini', opt); }
/* 調理台のタイル：同じふちと絵の窓。数字は右上の紋章、★は左上の下、生地は左下に焼き加減の炎と、となりにメーター（9段階。サイコーは金に光る） */
function cardTile(cid, opt = {}) {
  const d = cardDef(cid), cook = d.dough ? opt.cook || 0 : null, dmg = cardDmg(d, cook);
  return `<div class="pc tile k-${d.kind} s${d.star}${dmg ? '' : ' np'}${opt.born ? ' born' : ''}${cook >= COOK_MAX ? ' best' : ''}">
    <div class="pc-win"><div class="pc-art">${artImg(cid)}</div>${shineI(d)}</div>
    ${starGems(d)}${dmg ? powBadge(dmg) : ''}
    ${cook != null ? `${cookIcon(cook)}<i class="cook c${cookStage(cook)}" style="--c:${cook}"></i>` : ''}${glossI(d)}</div>`;
}
function cardBig(cid, cook) { return cardFace(cid, 'huge', { cook, tap: true }); }
/* 大きなカードの下（ゼンゼロの形・11/18 しょーくん）：名前・属性・焼き加減はカードに出ているので書かない。材料も出さない
   効果を1行ずつ [いつ] なにが起きる。いつの札とことばはタップで説明 */
function cardInfo(cid) {
  const d = cardDef(cid);
  let rows = d.cat === 'field' ? FIELDS[d.cid.slice(2)].long : fxLong(d.fx, d.star);
  if (!rows.length) rows = [['発動時', d.role === '攻撃' ? 'モンスターにダメージを出す' : plainLine(d)]];
  return `<div class="cinfo k-${d.kind}"><div class="ci-fx">${rows.map(([t, x]) =>
    `<b class="tg${t === 'スタート' || t === 'アンカー' ? ' pos' : ''}" data-act="kw" data-kw="${t}">${t}</b><p>${kwLong(x, true)}</p>`).join('')}</div></div>`;
}
