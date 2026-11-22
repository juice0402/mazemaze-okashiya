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
function goDay() { S.phase = 'day'; startDay(); save(); render(); }
/* 昼をおえて夕方へ（昼の画面の「閉店」から）。夜の画面が来店の会話 → おもてなし → お礼の会話 → まとめへ */
function goEvening() { stopDay(); startNight(); }
function goResult() { S.phase = 'result'; save(); render(); }
function nextDay() { S.day++; goMorning(); }

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
