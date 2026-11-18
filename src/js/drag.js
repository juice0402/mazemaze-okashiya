/* ==== ドラッグ：ショップ・調理台・「場」のカードを指でつかんで、はなした所で決まる（決まりは night.js の dropPlan・dropCard）
   置く・うごかす（バトルを押すまでいつでも）・まぜる（カードどうしをかさねる）・うる（下の「ここで うる」）
   指が少ししか動かなければタップ（大きく見る）。つかんでいるあいだ、行き先が光り、上の札に「はなすと どうなるか」を出す ==== */
let DRAG = null, dragEnd = 0;
const DRAG_MIN = 8;

function dragInit(root) {
  root.addEventListener('dragstart', e => e.preventDefault());   // 絵をつかんだときの、ブラウザのドラッグをとめる
  root.addEventListener('pointerdown', e => {
    const el = e.target.closest('[data-drag]');
    if (!el || DRAG || busy || !N || S.phase !== 'night' || N.stage !== 'shop' || (e.pointerType === 'mouse' && e.button !== 0)) return;
    DRAG = { p: { where: el.dataset.w, i: +el.dataset.i }, el, x0: e.clientX, y0: e.clientY, id: e.pointerId, on: false };
  });
  addEventListener('pointermove', e => {
    const D = DRAG; if (!D || e.pointerId !== D.id) return;
    if (!D.on) {
      if (Math.hypot(e.clientX - D.x0, e.clientY - D.y0) < DRAG_MIN) return;
      if (busy || N.stage !== 'shop') { DRAG = null; return; }
      dragBegin(D);
    }
    e.preventDefault();
    dragMove(D, e.clientX, e.clientY);
  }, { passive: false });
  addEventListener('pointerup', e => {
    const D = DRAG; if (!D || e.pointerId !== D.id) return;
    DRAG = null; if (D.on) dragFinish(D);
  });
  addEventListener('pointercancel', e => {
    const D = DRAG; if (!D || e.pointerId !== D.id) return;
    DRAG = null; if (D.on) { dragClean(D); dragEnd = Date.now(); }
  });
}

function dragBegin(D) {
  D.on = true;
  const p = D.p, pc = D.el.querySelector('.pc'), r = pc.getBoundingClientRect();
  D.cid = p.where === 'field' ? 'b:' + N.field : cardAt(p).cid;
  D.w = Math.max(r.width, 78); D.h = D.w * 1.4;
  D.home = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  const g = document.createElement('div');
  g.className = 'dragghost'; g.innerHTML = cardMini(D.cid, { cook: p.where === 'field' ? 0 : cardAt(p).cook }); g.style.width = D.w + 'px';
  document.body.appendChild(g); D.g = g;
  const tip = document.createElement('div');
  tip.className = 'dragtip'; document.body.appendChild(tip); D.tip = tip;
  /* 札の置き場（11/18 しょーくん「上に出るとショップのカードやコインが見えない」）：指がショップ（舞台）の上なら下のボタンの所、
     調理台の上ならおなかの帯の所（舞台の下はし）。指の所や行き先をかくさない */
  const rb = s => { const e = document.querySelector(s); return e && e.getBoundingClientRect().bottom; };
  D.stageB = rb('#stage') || innerHeight / 2; D.upY = rb('.night .quota') || D.stageB; D.downY = rb('.night .bar') || innerHeight - 8; D.dock = null;
  D.el.classList.add('lifted');
  const sec = document.querySelector('.night');
  if (sec) { sec.classList.add('dragging'); if (p.where !== 'shop') sec.classList.add('drag-own'); }
  /* 行き先を光らせる：put（置く・うごかす）・swap（入れかえ）・can（まぜる）・cant（まぜられるけど、お金や調理台の空きがたりない） */
  D.zones = [...document.querySelectorAll('[data-drop]')].map(z => {
    const q = { where: z.dataset.w, i: +z.dataset.i }, P = dropPlan(p, q);
    if (P) z.classList.add(P.kind === 'mix' ? (P.ng ? 'cant' : 'can') : P.kind === 'sell' ? 'sellok' : P.kind === 'move' && P.swap ? 'swap' : 'put');
    return { z, q, P };
  });
  const v = sellValue(cardDef(D.cid)), sv = $('sellv');
  const tn = cardDef(D.cid).tane;   // パン種は0コイン（無料の枠ももどらない）
  if (sv) { sv.textContent = v ? `コイン+${v}` : tn ? '（0コイン）' : '（無料の枠がもどる）'; sv.previousElementSibling.textContent = v || tn ? 'はなすと うる' : 'はなすと もどす'; }
  /* 調理台の上では、つかんだカードを調理台のマスと同じ大きさに（調理台が見えるように） */
  const tl = document.querySelector('.tiles'), sl = document.querySelector('.tslot');
  D.tiles = tl && tl.getBoundingClientRect(); D.small = sl ? sl.offsetWidth / D.w : 1; D.k = 1;
  D.over = undefined;
}

function dragMove(D, x, y) {
  D.x = x; D.y = y;
  /* 位置は translate・大きさは scale（指の所を中心に小さくなるだけ。transform に translate を書くと scale で位置までずれる） */
  D.g.style.translate = `${x - D.w / 2}px ${y - D.h * 0.8}px`;   // まっすぐ持つ（11/17 しょーくん）
  const k = D.tiles && y > D.tiles.top - 30 && y < D.tiles.bottom + 30 ? D.small : 1.06;
  if (k !== D.k) { D.k = k; D.g.style.scale = k; }
  const dock = y > D.stageB + 12 ? 'up' : y < D.stageB - 12 ? 'down' : D.dock || (y > D.stageB ? 'up' : 'down');   // さかい目でゆれないように
  if (dock !== D.dock) { D.dock = dock; D.tip.style.top = (dock === 'up' ? D.upY : D.downY) + 'px'; }
  const hit = document.elementFromPoint(x, y), z = hit && hit.closest('[data-drop]');
  const Z = D.zones.find(o => o.z === z && o.P) || null;
  if (Z === D.over) return;
  if (D.over) D.over.z.classList.remove('over');
  D.over = Z; if (Z) Z.z.classList.add('over');
  D.tip.innerHTML = tipHTML(D.cid, Z && Z.P);
  D.g.classList.toggle('hot', !!(Z && Z.P.kind === 'mix' && !Z.P.ng));
}

/* つかんでいるあいだの札：まぜるならできるカードと効果、ほかは「はなすと どうなるか」 */
function tipHTML(cid, P) {
  const d = cardDef(cid);
  if (P && P.kind === 'mix') {
    const r = cardDef(P.r.cid), kn = !P.ng && P.kn;   // 11/18 夜のまぜまぜではレシピはひらめかない（朝に）。こね生地は「こねる」
    const price = P.P.n ? `（${N.round === 1 ? `無料${P.P.n}まい` : `コイン${P.P.cost}`}）` : '';
    return `<span class="dt-card">${cardMini(P.r.cid)}</span><div class="dt-body"><p class="dt-main">${'★'.repeat(r.star)} ${esc(r.name)}</p>
      <p class="dt-sub">${P.ng ? `<em>${esc(P.ng)}</em>` : `はなすと まぜる${price}`}</p>
      <p class="dt-fx">${kwShort(fxText(r.fx, r.star))}</p>${kn ? `<p class="dt-flash">こねる！ こね+${kn.kone}・パン種+${kn.tane}</p>` : ''}</div>`;
  }
  const t = !P ? (d.cat === 'field' ? '左の「場」へ' : mixRule(d))
    : P.kind === 'buy' ? (P.ng ? `<em>${esc(P.ng)}</em>` : `はなすと ${N.round === 1 ? 'えらぶ（無料）' : `買う（コイン${P.cost}）`}`)
    : P.kind === 'bin' ? (P.ng ? `<em>${esc(P.ng)}</em>` : `はなすと びんに入れる${P.n ? (N.round === 1 ? '（無料）' : `（コイン${P.cost}）`) : ''}${P.jam ? '・ジャムができる！' : ''}`)
    : P.kind === 'place' ? 'はなすと 置く'
    : P.kind === 'move' ? (P.swap ? 'はなすと 入れかえ' : 'はなすと うごかす')
    : P.v ? `はなすと うる（+${P.v}）` : 'はなすと もどす（無料の枠がもどる）';
  return `<span class="dt-card">${cardMini(cid)}</span><div class="dt-body"><p class="dt-main">${esc(d.short)}</p><p class="dt-sub">${t}</p></div>`;
}

function dragFinish(D) {
  const Z = D.over;
  dragEnd = Date.now();
  if (!Z || !Z.P) {   // 行き先がなければ、もとの場所へもどる
    const g = D.g; D.g = null; dragClean(D);
    if (g && D.x != null && g.animate) {
      g.animate([{ translate: g.style.translate, scale: String(D.k) }, { translate: `${D.home.x - D.w / 2}px ${D.home.y - D.h * 0.8}px`, scale: '1', opacity: .4 }], { duration: 160, easing: 'ease-in', fill: 'forwards' });
      setTimeout(() => g.remove(), 170);
    } else if (g) g.remove();
    return;
  }
  const gr = D.g.getBoundingClientRect();
  const from = [{ x: gr.left + gr.width / 2, y: gr.top + gr.height / 2, w: D.w * D.k }, cardSpot(Z.q)];
  dragClean(D);
  if (dropCard(D.p, Z.q, from) && Z.P.kind === 'buy') {
    const t = document.querySelector(Z.q.where === 'board' ? `.tslot[data-w="board"][data-i="${Z.q.i}"] .pc` : '.fslot .pc');
    if (t) replay(t, 'born');
  }
}

function dragClean(D) {
  if (D.g) D.g.remove();
  if (D.tip) D.tip.remove();
  D.el.classList.remove('lifted');
  const sec = document.querySelector('.night'); if (sec) sec.classList.remove('dragging', 'drag-own');
  (D.zones || []).forEach(o => o.z.classList.remove('can', 'cant', 'put', 'swap', 'sellok', 'over'));
}
