/* ==== 会話の部品（持ち主：リーダー【okashi】・11/18 H-005）：立ち絵＋名前＋セリフの窓。タップで次
   使い方：talk(lines, done, opt)
   - lines：セリフの文字の並び（src/data/story.js＝昼のチャットの持ち物）
       「ほのか：ここが……わたしのお店！」 … 名前：セリフ（表情はそのままか、さいしょはふつう）
       「ほのか【びっくり】：も、モンスター！？」 … 【】で表情（TALKERS の faces の名前）
       「（カラン、とドアの音）」 … 名前なしの地の文（かっこは出さない）
       「→ 材料2つをオーブンへ」 … 読まない（チュートリアルの印）
   - done：さいごまで読んだら（スキップしても）呼ぶ。中で S.phase を変えると幕（wipe）が出る
   - opt.dim：うしろを暗くするか（ふつうは暗くする。プロローグのように場面を見せるときは false）
   文字は1文字ずつ出る。タップで全部出す → もう1回タップで次。右上のスキップで最後まで飛ばす
   話す人の名前・立ち絵は下の TALKERS（新しい人・表情は、昼のチャットが「リーダーへのお願い」で） ==== */
const TALKERS = {
  /* 常連さんの妖精の子 ルル（11/22 H-035・物語⑬で顔を出す）：お客さんの絵 cust-kodomo の1まいめ */
  lulu: { name: 'ルル', side: 'r', faces: { ふつう: 'cust-kodomo', うれしい: 'cust-kodomo-happy', しょんぼり: 'cust-kodomo-sad' } },
  /* 夜市の行商人（11/22 夜・ドワーフの女の子・ランタンの夜商人）：名前は STORY.ichiName（昼のチャット）。表情の絵は art-irai の dwarf・dwarf-face */
  dwarf: { name: (typeof STORY === 'object' && STORY.ichiName) || '行商人', side: 'r', faces: { ふつう: 'dwarf', にっこり: 'dwarf-joy', おどろき: 'dwarf-wow', ウインク: 'dwarf-wink', こまり: 'dwarf-komari' } },
  honoka: { name: 'ほのか', side: 'l', flip: true, faces: {
    ふつう: 'honoka', うれしい: 'honoka-joy', びっくり: 'honoka-surprise', しょんぼり: 'honoka-oops',
    やる気: 'honoka-yaruki', あちゃー: 'honoka-achaa', 不安: 'honoka-fuan', くやしい: 'honoka-kuyashii', わくわく: 'honoka-wakuwaku',
    うっとり: 'honoka-uttori', 考える: 'honoka-kangaeru', 感動: 'honoka-kandou', ドヤ: 'honoka-doya',
  } },
  minamo: { name: 'みなも', side: 'r', faces: {
    ふつう: 'minamo', すまし: 'minamo-sumashi', ジト目: 'minamo-jito', ためいき: 'minamo-tameiki', 照れ: 'minamo-tere', 真剣: 'minamo-shinken',
    びっくり: 'minamo-bikkuri', そっぽ: 'minamo-soppo', 考える: 'minamo-kangae', しょんぼり: 'minamo-shonbori',
  } },
  wakaba: { name: 'わかば', side: 'r', faces: {
    ふつう: 'wakaba', あらあら: 'wakaba-ara', うふふ: 'wakaba-ufufu', おどろき: 'wakaba-odoroki', こまり顔: 'wakaba-komari', わくわく: 'wakaba-wakuwaku',
    まかせて: 'wakaba-makasete', しんみり: 'wakaba-shinmiri', よろこび: 'wakaba-yorokobi', ないしょ: 'wakaba-naisho',
  } },
  kodomo: { name: '妖精の子', side: 'r', faces: {} },
  slime: { name: 'スライム', side: 'r', mon: 'slime' },
  hitsuji: { name: 'くもひつじ', side: 'r', mon: 'hitsuji' },
  nijikurage: { name: 'にじいろクラゲ', side: 'r', mon: 'nijikurage' },
  mintousagi: { name: 'ミントうさぎ', side: 'r', mon: 'mintousagi' },
  kurage: { name: 'しずくクラゲ', side: 'r', mon: 'kurage' },   // H-022
  tokage: { name: 'こんぺいトカゲ', side: 'r', mon: 'tokage' },
  hiyoko: { name: 'ほのお鳥のひよこ', side: 'r', mon: 'hiyoko' },
  mogura: { name: 'チョコもぐら', side: 'r', mon: 'mogura' },   // 11/22 新しい夜のお客さん4体
  pengin: { name: 'プリンペンギン', side: 'r', mon: 'pengin' },
  kaeru: { name: 'まっちゃガエル', side: 'r', mon: 'kaeru' },
  risu: { name: 'ポップコーンりす', side: 'r', mon: 'risu' },
};
const TALKER_ID = Object.assign({ ぷるぷるスライム: 'slime', ひつじ: 'hitsuji', クラゲ: 'kurage', トカゲ: 'tokage', ひよこ: 'hiyoko', もぐら: 'mogura', ペンギン: 'pengin', カエル: 'kaeru', りす: 'risu' },
  ...Object.entries(TALKERS).map(([id, t]) => ({ [t.name]: id })));
const TK_SPEED = 38;   // 1文字の ms

function talkParse(s) {
  s = String(s || '').trim();
  if (!s || s[0] === '→') return null;
  /* 物語の一枚絵（11/21）：「［絵:cg-open］」で出す・「［絵:なし］」でしまう（会話がおわるとしまう）。絵の名前は ART の cg-* */
  const cg = s.match(/^［絵[:：]\s*(.+?)］$/); if (cg) return { cg: cg[1].trim() === 'なし' ? '' : cg[1].trim() };
  if (s[0] === '（' || s[0] === '(') return { nar: true, t: s.replace(/^[（(]/, '').replace(/[）)]$/, '') };
  const m = s.match(/^([^：:【（(]{1,12})(?:【([^】]+)】)?[：:](.+)$/);
  if (!m) return { nar: true, t: s };
  const name = m[1].trim();
  return { who: TALKER_ID[name] || null, name, face: m[2] ? m[2].trim() : null, t: m[3].trim() };
}
function talkImg(who, face) {
  const T = TALKERS[who]; if (!T) return null;
  if (T.mon) return { src: monURL(T.mon), mon: true };
  const k = (face && T.faces[face] && ART[T.faces[face]]) ? T.faces[face] : T.faces.ふつう;
  return k && ART[k] ? { src: ART[k], flip: !!T.flip } : null;
}

/* 会話を始めるときに、その会話で出る表情の絵をぜんぶ先に読む（11/19 H-032：キャラの絵がもとの大きさになったので、表情が変わったときに一瞬おくれないように） */
const TALK_PRE = new Set();
function talkPreload(L) {
  for (const l of L) if (l.cg && ART[l.cg] && !TALK_PRE.has(ART[l.cg])) { TALK_PRE.add(ART[l.cg]); const pre = new Image(); pre.src = ART[l.cg]; }
  for (const l of L) for (const f of l.who ? [l.face, null] : []) {
    const im = talkImg(l.who, f); if (!im || TALK_PRE.has(im.src)) continue;
    TALK_PRE.add(im.src); const pre = new Image(); pre.decoding = 'async'; pre.src = im.src;
    if (pre.decode) pre.decode().catch(() => {});
  }
}

let TK = null;   // 開いている会話
const talking = () => !!TK;
function talk(lines, done, opt = {}) {
  const L = (lines || []).map(talkParse).filter(Boolean);
  if (TK) talkClose(true);
  if (!L.length) { if (done) setTimeout(() => talkEnd(done), 0); return; }
  talkPreload(L);
  const el = document.createElement('div');
  el.id = 'talk'; el.className = 'talk' + (opt.dim === false ? '' : ' dim');
  el.innerHTML = `<div class="tk-stage"><span class="tk-p l"></span><span class="tk-p r"></span><div class="tk-cg" hidden><img alt=""></div></div>
    <button class="pill tk-skip" type="button">スキップ</button>
    <div class="tk-win"><span class="tk-name"></span><p class="tk-text"></p><i class="tk-next"></i></div>`;
  $('app').appendChild(el);
  TK = { el, L, i: -1, done, face: {}, timer: 0, full: true };
  el.addEventListener('click', e => {
    if (!TK || TK.el !== el) return;   // 会話をとじたあと（消えていくあいだ）の 早いタップは何もしない（11/22 リリース前の点検：TK が null でエラー）
    if (e.target.closest('.tk-skip')) { pressFx(e.target.closest('.tk-skip')); return talkClose(); }
    if (!TK.full) { talkFinish(); return; }
    talkNext();
  });
  talkNext();
}
function talkNext() {
  if (!TK) return;
  TK.i++;
  if (TK.i >= TK.L.length) return talkClose();
  const l = TK.L[TK.i], el = TK.el, win = el.querySelector('.tk-win');
  if (l.cg !== undefined) { talkCg(l.cg); return talkNext(); }   // 一枚絵の行は、絵を出して次の行へ
  if (l.who) TK.face[l.who] = l.face || TK.face[l.who] || null;
  win.classList.toggle('nar', !!l.nar);
  win.dataset.who = l.who && TALKERS[l.who].mon ? 'mon' : (l.who || '');
  const nm = el.querySelector('.tk-name');
  nm.textContent = l.nar ? '' : l.name; nm.hidden = !!l.nar;
  if (l.who) talkPortrait(l.who);
  for (const p of el.querySelectorAll('.tk-p')) p.classList.toggle('on', !!l.who && p.dataset.who === l.who);
  const tx = el.querySelector('.tk-text');
  clearInterval(TK.timer);
  if (REDUCED) { tx.textContent = l.t; TK.full = true; win.classList.add('full'); return; }
  let n = 0; TK.full = false; win.classList.remove('full'); tx.textContent = '';
  const chars = Array.from(l.t);
  TK.timer = setInterval(() => {
    n++; tx.textContent = chars.slice(0, n).join('');
    if (n >= chars.length) talkFinish();
  }, TK_SPEED);
}
function talkFinish() {
  if (!TK) return;
  clearInterval(TK.timer); TK.full = true;
  const l = TK.L[TK.i]; if (l) TK.el.querySelector('.tk-text').textContent = l.t;
  TK.el.querySelector('.tk-win').classList.add('full');
}
/* 物語の一枚絵：立ち絵の上・窓の上に、木の額縁で大きく（絵がないときは何もしない） */
function talkCg(k) {
  const box = TK.el.querySelector('.tk-cg'), u = k && ART[k];
  if (!u) { box.hidden = true; TK.el.classList.remove('has-cg'); return; }
  const im = box.firstElementChild; if (im.getAttribute('src') !== u) im.src = u;
  box.hidden = false; TK.el.classList.add('has-cg');
  box.classList.remove('pop'); void box.offsetWidth; box.classList.add('pop');
}
/* 立ち絵：左（ほのか）と右（相手）に1人ずつ。同じ側に別の人が出たら入れかわる。話していない人は少し下がってうすく */
function talkPortrait(who) {
  const T = TALKERS[who], side = T.side === 'l' ? 'l' : 'r';
  const box = TK.el.querySelector('.tk-p.' + side), im = talkImg(who, TK.face[who]);
  if (!im) { if (box.dataset.who === who) box.innerHTML = ''; return; }
  const key = who + '|' + im.src;
  if (box.dataset.key === key) return;
  const swap = box.dataset.who !== who;
  box.dataset.who = who; box.dataset.key = key;
  box.className = 'tk-p ' + side + (im.mon ? ' mon' : '') + (im.flip ? ' flip' : '');
  box.innerHTML = `<img src="${im.src}" alt="${esc(T.name)}">`;
  box.classList.remove('pop'); void box.offsetWidth; box.classList.add(swap ? 'pop' : 'hop');
}
function talkClose(quiet) {
  if (!TK) return;
  const { el, done } = TK;
  clearInterval(TK.timer); TK = null;
  if (quiet || REDUCED) el.remove();
  else { el.classList.add('out'); setTimeout(() => el.remove(), 230); }
  if (!quiet && done) talkEnd(done);
}
function talkEnd(done) {
  const ph = S.phase;
  done();
  if (S.phase !== ph) wipe();
  renderTop();
}
