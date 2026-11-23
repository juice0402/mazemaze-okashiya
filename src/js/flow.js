/* ==== 1日の流れ（持ち主：リーダー【okashi】・11/18 H-001）
   はじめだけ プロローグ → 朝 → 昼 → 夕方〜夜（おもてなし）→ 1日のまとめ → 次の日の朝
   画面の切りかえの幕は main.js（ボタンで S.phase が変わると wipe）と talk.js（会話のあとで変わったとき）
   朝と昼の画面は morning.js・day.js（昼のチャット）。夜は night.js ==== */
function goPrologue() { S.phase = 'prologue'; save(); render(); }
/* 朝：きのうの記録を S.yesterday に残して、今日の記録 S.today を作る（H-008） */
function goMorning() {
  if (!S.today || S.today.day !== S.day) { S.yesterday = S.today; S.today = newDay(S.day); }
  S.phase = 'morning'; startMorning(); save(); render();
}
function goDay() { S.phase = 'day'; startDay(); save(); render(); imgReady(ART['dn-disc']); }   // 切りかえの円盤は 昼のうちに読む
/* 昼をおえて夕方へ（昼の画面の「閉店」から）。夜の画面が来店の会話 → おもてなし → お礼の会話 → まとめへ */
function goEvening() {
  dnSwitch(true, () => {
    stopDay();
    const b = BUILDS[S.build] ? S.build : 'cookie', cf = (CHEFS[BUILDS[b].chef] || {}).art || 'honoka';
    let ichi = false; try { ichi = S.day > 1 && ichiStock().items.length > 0; } catch (e) { /* 夜市なし */ }
    nightWarm(b, false);
    return [bgmFetch(ichi ? 'ichi' : bgmUrl('raiten') ? 'raiten' : bgmNight(b)), curtainLoad(), ...(ichi ? ['ichi-bg', 'dwarf', 'ichi-counter'] : ['bg-night-' + cf, cf + '-battle']).map(k => imgReady(ART[k]))];   // 幕の絵も待つ（来店は幕の前・11/23）   // 夜市のない夜は 来店（幕の前）の曲から（11/23）
  }, () => startNight());
}
function goResult() { S.phase = 'result'; save(); render(); imgReady(ART['dn-disc']); }
function nextDay() {
  dnSwitch(false, () => [bgmFetch('asa'), ...['bg-morning', 'bg-zakka'].map(k => imgReady(ART[k]))], () => { S.day++; goMorning(); });
}

/* ---------- 昼↔夜の切りかえ画面（11/23 しょーくん「お店を閉めて、いきなり夜が始まるのが違和感」「☀️○🌃 がクルッと回って切り替わる」「ロード画面に」「夜→朝は逆」）
   えらぶ質問で：円盤は描き下ろし（art-irai の dn-disc・届くまでは CSS の仮の円盤）・字は出さない・最低1.5秒（読みこみが長いと回りつづける・6秒まで）・空の色もかわる。
   toNight＝昼→夜（太陽が上 → 月が上）／false＝夜→朝（月が上 → 太陽が上）。prep()＝先に読むものの列（Promise）・go()＝円盤のうしろで画面を切りかえる ---------- */
const DN_MIN = 1500, DN_MAX = 6000, DN_SPIN = 1250, DN_LOOP = 1200;   // 半回り（はじめ）・もう1回り（読みこみ待ち）のミリ秒
let dnOn = false;
function imgReady(u) {
  if (!u || typeof u !== 'string') return Promise.resolve();
  return new Promise(res => { const im = new Image(); im.decoding = 'async'; im.onload = im.onerror = () => res(); im.src = u; if (im.decode) im.decode().then(res, res); });
}
function dnSwitch(toNight, prep, go) {
  if (dnOn) return;
  dnOn = true;
  const disc = ART['dn-disc'], el = document.createElement('div');
  el.className = 'dsw ' + (toNight ? 'to-night' : 'to-day'); el.setAttribute('aria-hidden', 'true');
  el.innerHTML = `<i class="dsw-sky dsw-a"></i><i class="dsw-sky dsw-b"></i><div class="dsw-disc${disc ? ' art' : ''}"${disc ? ` style="background-image:url('${disc}')"` : ''}>${disc ? '' : '<i class="dsw-sun"></i><i class="dsw-moon"></i>'}</div>`;
  document.body.appendChild(el);
  const t0 = Date.now(), d = el.querySelector('.dsw-disc');
  let waits = []; try { waits = (prep && prep()) || []; } catch (e) { /* 読めなくても切りかえる */ }
  let ready = false;
  Promise.race([Promise.all(waits.map(p => Promise.resolve(p).catch(() => {}))), new Promise(r => setTimeout(r, DN_MAX))]).then(() => { ready = true; });
  let ang = toNight ? 0 : 180;
  d.style.transform = `rotate(${ang}deg)`;
  const turn = deg => new Promise(res => {
    sePlay('kuru');   // くるくるくるん（11/23 しょーくん）
    if (REDUCED || !d.animate) { ang += deg; d.style.transform = `rotate(${ang}deg)`; return setTimeout(res, 300); }
    const a = d.animate([{ transform: `rotate(${ang}deg)` }, { transform: `rotate(${ang + deg}deg)` }], { duration: deg > 180 ? DN_LOOP : DN_SPIN, easing: 'cubic-bezier(.65,0,.3,1)', fill: 'forwards' });
    ang += deg; a.onfinish = () => { d.style.transform = `rotate(${ang}deg)`; res(); };
  });
  const finish = () => {
    try { go(); } catch (e) { console.error(e); }
    setTimeout(() => { el.classList.add('off'); setTimeout(() => { el.remove(); dnOn = false; }, 380); }, 120);
  };
  const loop = () => (ready && Date.now() - t0 >= DN_MIN - 80) ? finish() : turn(360).then(loop);   // 読みこみが長いときは、もう1回り（同じ面が上で止まる）
  requestAnimationFrame(() => { el.classList.add('on'); setTimeout(() => { el.classList.add('flip'); turn(180).then(loop); }, 280); });
}

/* ---------- プロローグ（開業）：お店の外の場面に、会話の部品で ---------- */
function renderPrologue() {
  const tall = ART['bg-shop-out-tall'], bg = tall || ART['bg-shop-out'];   // 朝のたて長の外観（11/22 昼の PR #35・しょーくん「看板の文字が大きくズレた」「すごくアップに見える」→ たて長で合格）
  /* 絵は .pr-art（16:9）を画面の高さいっぱいにして、お店がまんなかに来るようにずらす。看板の字は絵の無地の看板の上に重ねる（絵に字を焼きこまない） */
  $('screen').innerHTML = `<section class="prologue fit${bg ? ' hasbg' : ''}">
    ${bg ? `<div class="pr-art${tall ? ' tall' : ''}"><img src="${bg}" alt=""><p class="pr-sign">まぜまぜ<br>おかし屋</p></div>`
    : '<div class="pr-scene" aria-hidden="true"><i class="pr-tree a"></i><i class="pr-tree b"></i><i class="pr-shop"><i class="pr-awn"></i><i class="pr-door"></i><i class="pr-win"></i></i></div><p class="pr-sign">まぜまぜ<br>おかし屋</p>'}</section>`;
  if (!talking()) talk(STORY.prologue, () => { S.seen.prologue = 1; goMorning(); }, { dim: false });
}

/* ---------- 1日のまとめ：ほのかの日記・お金・もらった素材・評判のハートのびん ---------- */
const repFull = () => (typeof REP_JAR === 'number' ? REP_JAR : 10);   // びんがいっぱいになるハートの数（昼のチャットが hiru.js に REP_JAR を置くとそれを使う）
function jarHTML() {
  const full = repFull(), p = Math.max(0, Math.min(1, (S.rep % full) / full)), n = Math.floor(S.rep / full);
  return `<div class="jar" style="--p:${p.toFixed(3)}" aria-label="お店の評判"><i class="jar-in"><i class="jar-fill"></i></i><i class="jar-gloss"></i><span class="jar-h">${HEART}</span>${n ? `<em>${'★'.repeat(Math.min(5, n))}</em>` : ''}</div>`;
}
function renderResult() {
  const T = S.today, mon = MONSTERS.find(m => m.id === T.mon), mood = MOODS[T.mood];
  const diary = STORY.diary(T) || [];
  const gifts = Object.entries(T.gifts || {}).map(([m, n]) => `<span class="gift"><img src="${matURL(m)}" alt="">${esc(MATS[m].short)}×${n}</span>`).join('');
  $('screen').innerHTML = `<section class="result fit">
    <div class="diary"><h2>${T.day}日目のにっき</h2>${diary.map(l => `<p>${esc(l)}</p>`).join('')}${ART['chibi-cheer'] ? `<img class="d-stk" src="${ART['chibi-cheer']}" alt="">` : ''}</div>
    ${typeof fcCardHTML === 'function' ? fcCardHTML(S.day + 1) : ''}
    <div class="panel tight sum">
      <div class="sum-row"><dl>
        <dt>お昼の売上</dt><dd>${fmt(T.sales)}円</dd>
        <dt>おもてなし</dt><dd class="sum-om">${mon ? `<span>${esc(mon.name)}</span>${mood ? `<span>${mood.name}</span>` : ''}` : 'なし'}</dd>
        <dt>もらった素材</dt><dd>${gifts || 'なし'}</dd>
      </dl>${jarHTML()}</div>
      <p class="sum-money">お財布 <b>${fmt(S.money)}</b>円</p>
    </div>
    <div class="r-bar"><button class="sub" data-act="opt">せってい</button><button class="big" data-act="nextDay">${S.day + 1}日目の朝へ</button></div>
  </section>`;
}
