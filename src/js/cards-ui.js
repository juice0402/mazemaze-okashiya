/* ==== カード（11/17 夜「カードがこのゲームのキモ」）：ふちはレア度の金属（★1 銅・★2 銀・★3 金と虹の箔）・中は絵の窓・名前のリボン・属性の帯・短い効果の紙
   左上に炎のダメージの紋章・右上に★。生地は紙の左に焼き加減の炎（色と数字）。文字の大きさはカードの幅で決まる（style.css の cqw）
   cardMini：手札・ドラッグ・演出　cardTile：調理台（絵と数字・焼き加減の炎とメーター）　cardBig：タップで大きく見る ==== */
/* いまのダメージ（生地は焼き加減の倍率こみ） */
function cardDmg(d, cook, plus = 0) { return d.fx.dmg ? Math.floor((d.fx.dmg * STAR_MUL[d.star] * (d.dough ? cookMul(cook || 0) : d.grow ? sizeMul(cook || 0, d.fx) : 1) + plus) * 10) / 10 : 0; }   // plus＝もりのシフォンの育った実の分（わかば）
/* 効果のことば（短く） */
function cardChips(d) { return d.cat === 'field' ? FIELDS[d.cid.slice(2)].chips.slice() : fxList(d.fx, d.star); }
const artImg = cid => `<img${hiArt(cid) ? ' class="hi"' : ''} src="${cardIconURL(cid)}" alt="">`;
const starGems = d => d.star > 1 ? `<span class="pc-star" aria-label="★${d.star}">${'<i></i>'.repeat(d.star)}</span>` : '';   // 星は描き下ろしの絵（ui-star）

/* 属性の帯（ゼンゼロの形・11/18 しょーくん）：左が役目・右が種類。色で見分ける */
const ATTR_C = { 主役: 'atk', 支援: 'sup', 火力: 'fire', 温度: 'temp', 仕入れ: 'buy', 生地: 'dough', 飴細工: 'ame', キャンディ: 'ame', ケーキ: 'dough', ジャム: 'ame', 素材: 'mat', くだもの: 'mat', 道具: 'tool', 焦げ: 'koge', フィールド: 'field' };
function attrBar(d) {
  const a = d.cat === 'field' ? ['フィールド'] : [d.role, CAT_NAME[d.cat]].filter(Boolean);
  return `<p class="pc-attr">${a.map(t => `<span class="at-${ATTR_C[t] || 'etc'}">${t}</span>`).join('')}</p>`;
}
/* 効果のない★1の紙（役目だけ） */
const plainLine = d => d.role === '主役' ? '味パワーを出す' : attrsOf(d).join('・');
/* ことば（KW）を黄色に。tap なら、タップで説明が出る（大きく見る画面だけ） */
const kwTag = (w, tap, show = w) => `<b class="kw"${tap ? ` data-act="kw" data-kw="${w}"` : ''}>${show}</b>`;
const KW_SHORT = /スタート|アンカー|サイコー|火力|焦げ|パン種|こね|温度|熟した実/g;   // カードの紙（パン種・こね は こね生地のビルド）
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
/* みなもの大作の大きさ（11/19）：飴のしずく（上向き）。小さい＝水色・育つほど はちみつ色・完成＝金に光る・固まる＝霜。中の数字が大きさ */
const sizeIcon = (size, ice) => `<i class="ck am c${cookStage(size)}${ice ? ' ice' : ''}" title="大きさ ${size}"><b>${size}</b></i>`;
const meterIcon = (d, c, ice) => d.grow ? sizeIcon(c || 0, ice) : cookIcon(c || 0);
/* 紙の字の大きさ：1行に収まるように（数字や記号は細いので少なく数える） */
const textW = t => [...t].reduce((a, c) => a + (/[0-9.]/.test(c) ? .62 : /[+\-]/.test(c) ? .7 : /[×−]/.test(c) ? .85 : 1), 0);
const fitFs = (t, w) => Math.min(9, Math.floor(w / textW(t) * 10) / 10);
/* 名前の字の大きさ（11/19 しょーくん「名前を中央に」）：8文字でもリボンからはみ出さないように（…で切らない） */
const nameFs = t => Math.min(9.4, Math.floor(66 / textW(t) * 10) / 10);

/* ダメージの紋章（けた数で文字を小さく） */
/* ★2・★3のきらめき（11/18 軽量化）：光の帯は transform で動かす（色をぬりなおさない）。★1には出さない
   pc-shine＝絵の窓の上・pc-gl＝ふちの上（いちばん最後に置いて、前の .pc::after と同じ重なり） */
const shineI = d => d.star > 1 ? '<i class="pc-shine"></i>' : '';
const glossI = d => d.star > 1 ? '<i class="pc-gl"></i>' : '';
/* 味パワーの紋章：炎はほのかだけ。みなも・わかばは描き下ろしの紋章 ui-pow-<シェフ>（届くまでは pw-code のコードの丸）（11/19 しょーくん） */
function powBadge(dmg) {
  const t = fmt(Math.floor(dmg)), c = chefArt(), pw = c === 'honoka' ? '' : ` pw-${c}${ART['ui-pow-' + c] ? '' : ' pw-code'}`;
  return `<b class="pc-pow l${Math.min(t.length, 5)}${pw}">${t}</b>`;
}
/* カードの形（mini と huge は同じ形で大きさだけちがう）。紙は1つの効果を1行で、上から大事な2つまで */
/* カードの効果の文（11/19 しょーくん「ゼンゼロみたいに1つの文」）：紙に出す文と、大きく見たときの文は同じ。フィールドは短い札の文（FIELDS の chips）。
   返すのは [{ t: 長さを数える字, h: HTML }]。効果のない★1は役目だけ（plain） */
function cardSents(d, tap) {
  if (d.cat === 'field') return FIELDS[d.cid.slice(2)].chips.map(t => ({ t, h: chunkHTML(t, c => kwShort(c, tap)) }));
  const rows = fxLong(d.fx, d.star);
  if (!rows.length) return [{ t: plainLine(d), h: chunkHTML(plainLine(d), esc), plain: true }];
  /* カードの紙は2文まで（11/19 しょーくん「メロンパンコロネの説明が長すぎて大変なことに」）：スタート・アンカーの文を先に。3つめからは見開き（cardInfo）へ */
  const ord = rows.map((r, k) => [r, r[0] ? 0 : 1, k]).sort((a, b) => a[1] - b[1] || a[2] - b[2]).map(x => x[0]);
  return ord.map(([w, x], k) => { const t = w ? `{${w}}：${x}` : x; return { t, h: chunkHTML(t, c => kwLong(c, tap)), more: k >= FACE_MAX }; });
}
const FACE_MAX = 2;
/* 文のかたまり：半角スペースと「：」のあとだけで折り返す（「味パ｜ワー」のように ことばの とちゅうで切れないように） */
const sentChunks = t => t.replace(/：/g, '：\n').split(/ |\n/).filter(Boolean);
function chunkHTML(t, f) {
  const out = []; let buf = '';
  for (const ch of t) { if (ch === ' ') { if (buf) out.push(buf); out.push(' '); buf = ''; } else { buf += ch; if (ch === '：') { out.push(buf); buf = ''; } } }
  if (buf) out.push(buf);
  return out.map(c => c === ' ' ? ' ' : `<span class="cw">${f(c)}</span>`).join('');
}
/* 紙の文の字の大きさ：紙の内側（幅64cqw・高さ21.5cqw）に、折り返して入る いちばん大きい字（9cqw まで）。黄色いことばは ふちの分だけ広く数える */
function faceFs(S, H = 21.5) {   // H＝紙の字の高さ（cqw）。ショップのたて長のカードは 31
  const sents = S.map(x => sentChunks(x.t).map(c => textW(c.replace(/[{}]/g, '')) + (c.match(/\{/g) || []).length * .5));
  for (let fs = 9; fs > 4.5; fs -= .25) {
    let lines = 0, ok = true;
    for (const cs of sents) {
      let x = 0; lines++;
      for (const w of cs) { const px = w * fs; if (px > 64) { ok = false; break; } const need = x ? x + .4 * fs + px : px; if (need > 64) { lines++; x = px; } else x = need; }
      if (!ok) break;
    }
    if (ok && lines * 1.2 * fs <= H) return fs;
  }
  return 4.5;
}
function cardFace(cid, cls, opt = {}) {
  const d = cardDef(cid), dmg = cardDmg(d, opt.cook), lines = cardChips(d).slice(0, 2);
  const ck = d.meter ? meterIcon(d, opt.cook, opt.ice) : '', w = 64;   // 紙の字の幅（cqw・ふちの絵の紙の内側）。11/19 しょーくん「カードが切れてる」：実機の字はテストより太いので70→64・黄色いことばは1つ4つめる。焼き加減・大きさは右上へ（11/19 しょーくん「文字が見えない」）
  const S = cardSents(d, opt.tap).filter(x => !x.more), txt = S.map(x => `<span class="sn${x.plain ? ' plain' : ''}">${x.h}</span>`).join('');   // 1つの文（折り返して2行まで・11/19）
  const cost = opt.cost != null ? `<span class="pc-cost${typeof opt.cost === 'string' ? ' txt' : ''}">${opt.cost}</span>` : '';
  return `<div class="pc ${cls} k-${d.kind} s${d.star}${dmg ? '' : ' np'}${opt.born ? ' born' : ''}${opt.tall ? ' tall' : ''}">
    <div class="pc-win"><div class="pc-art">${artImg(cid)}</div>${shineI(d)}</div>
    <div class="pc-name"><span style="font-size:${nameFs(d.short)}cqw">${esc(d.short)}</span></div>${attrBar(d)}
    <div class="pc-text"><span class="pl sents" style="font-size:max(8px,${faceFs(S, opt.tall || 21.5)}cqw)">${txt}</span></div>${ck ? `<span class="pc-ck">${ck}</span>` : ''}
    ${cost}${starGems(d)}${dmg ? powBadge(dmg) : ''}${glossI(d)}
  </div>`;
}
function cardMini(cid, opt = {}) { return cardFace(cid, 'mini', opt); }
/* 調理台のタイル：同じふちと絵の窓。数字は右上の紋章、★は左上の下、生地は左下に焼き加減の炎と、となりにメーター（9段階。サイコーは金に光る） */
function cardTile(cid, opt = {}) {
  const d = cardDef(cid), cook = d.meter ? opt.cook || 0 : null, dmg = cardDmg(d, cook, opt.plus);
  return `<div class="pc tile k-${d.kind} s${d.star}${dmg ? '' : ' np'}${opt.born ? ' born' : ''}${cook >= COOK_MAX ? ' best' : ''}${opt.ice ? ' ice' : ''}${cook != null ? ` ${d.grow ? 'ame' : 'dough'}" style="--ck:${cook}` : ''}">
    <div class="pc-win"><div class="pc-art">${artImg(cid)}</div>${shineI(d)}</div>
    ${starGems(d)}${dmg ? powBadge(dmg) : ''}
    ${cook != null ? `${meterIcon(d, cook, opt.ice)}<i class="cook${d.grow ? ' am' : ''} c${cookStage(cook)}" style="--c:${cook}"></i>` : ''}${glossI(d)}</div>`;
}
function cardBig(cid, cook) { return cardFace(cid, 'huge', { cook, tap: true }); }
/* 大きなカードの下の「見開き」（11/19 しょーくん「一応、見開きとして残そう。基本は見たらわかるレベルに」）：
   カードの文はカードに出ているのでくり返さない。文に出てくる黄色いことばの説明だけを並べる（ことばがなければ窓は出さない） */
function cardInfo(cid) {
  const d = cardDef(cid), words = [], all = cardSents(d, true), more = all.filter(x => x.more);
  for (const x of all) for (const m of x.t.matchAll(/\{([^}]+)\}|スタート|アンカー|サイコー|火力|焦げ|パン種|こね|温度|熟した実/g)) { const w = m[1] || m[0]; if (KW[w] && !words.includes(w)) words.push(w); }
  if (!words.length && !more.length) return '';
  return `<div class="cinfo k-${d.kind}"><div class="ci-fx">${more.map(x => `<p class="wide more">${x.h}</p>`).join('')}${words.map(w => `<b class="tg${w === 'スタート' || w === 'アンカー' ? ' pos' : ''}" data-act="kw" data-kw="${w}">${w}</b><p>${esc(KW[w])}</p>`).join('')}</div></div>`;
}
