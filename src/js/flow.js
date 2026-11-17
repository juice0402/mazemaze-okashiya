/* ==== 1日の流れ（夜→朝→昼→まとめ）・1日のまとめの画面・朝から呼ぶデッキの入口（持ち主：リーダー【okashi】）
   画面の切りかえの幕は main.js（S.phase が変わると wipe）。朝と昼の画面は morning.js・day.js（昼のチャット） ==== */
function goMorning() { S.phase = 'morning'; startMorning(); save(); render(); }
function goDay() { S.phase = 'day'; startDay(); save(); render(); }
function goResult() { stopDay(); S.phase = 'result'; save(); render(); }
function nextDay() { S.day++; startNight(); }
/* 朝に作ったお菓子をカードにする入口（デッキのしくみはリーダー）。いまは夜のショップに出てくるカードの山 S.pool に足すだけ */
function deckAddCandy(key) { S.pool.push('o:' + key); }

/* ---------- 1日のまとめ ---------- */
function renderResult() {
  const T = S.today, mon = MONSTERS[(T.day - 1) % MONSTERS.length];
  const hearts = CUSTOMERS.map(c => `<li><span>${c.name}</span><span class="hearts">${HEART.repeat(Math.min(HEARTS_REGULAR, S.hearts[c.id] || 0))}<i>${HEART.repeat(Math.max(0, HEARTS_REGULAR - (S.hearts[c.id] || 0)))}</i></span>${S.regulars.includes(c.id) ? '<em>常連さん</em>' : ''}</li>`).join('');
  $('screen').innerHTML = `<section class="result">
    <div class="panel"><h2>${T.day}日目のまとめ</h2>
      <dl>
        <dt>夜</dt><dd>${esc(mon.name)}　スコア ${fmt(T.score)}　${T.beaten ? '撃退！' : 'にげられた'}</dd>
        <dt>材料</dt><dd>${T.drop ? `${MATS[T.drop].name} ×${T.drops}` : 'なし'}</dd>
        <dt>ひらめき</dt><dd>${T.flashes.length ? T.flashes.map(k => esc(recipeOf(k).name)).join('、') : 'なし'}</dd>
        <dt>仕込み</dt><dd>${T.made.length ? T.made.map(k => esc(recipeOf(k).name)).join('、') : 'なし'}</dd>
        <dt>お昼</dt><dd>売上 ${fmt(T.sales)}円（${T.served}/${T.visitors}人が買った）</dd>
        <dt>お金</dt><dd class="gold">${fmt(S.money)}円</dd>
      </dl></div>
    <div class="panel"><h2>お客さんのハート</h2><ul class="heartlist">${hearts}</ul>
      <p class="muted">常連さんは、これから仲間になって夜にいっしょに戦えるようになる予定</p></div>
    <button class="big" data-act="nextDay">${S.day + 1}日目の夜へ</button>
  </section>`;
}
