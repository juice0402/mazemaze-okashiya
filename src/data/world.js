/* ==== データ：食材モンスター・お客さん・ノルマ ==== */

/* 夜にお店を襲撃する食材モンスター（日ごとに順番に来る）。drop は落とすふしぎな材料 */
const MONSTERS = [
  { id: 'slime', name: 'ぷるぷるスライム', drop: 'zeri', text: 'ゼリーでできたスライム。お店の砂糖をねらってきた' },
  { id: 'hitsuji', name: 'くもひつじ', drop: 'hoippu', text: 'ホイップの毛のひつじ。ふわふわ食べ歩き中' },
];

/* ラウンドごとのノルマ（たっせいするとコイン+2と、ふしぎな材料1つ）。日がたつほど強くなる */
const ROUNDS = 9;
const quota = (r, day) => Math.round(15 * Math.pow(1.6, r - 1) * (1 + 0.6 * (day - 1)));
function nightHP(day) { let s = 0; for (let r = 1; r <= ROUNDS; r++) s += quota(r, day); return s; }

/* お昼のお客さん：すきな味が1つでも入ったお菓子は2倍の値段で買ってハート。ハート3つで常連さん（あとで仲間に） */
const CUSTOMERS = [
  { id: 'kodomo', name: 'こども', likes: ['あまい', 'ぷるぷる'], h: 15, small: true, skin: '#f6cfae', hair: '#5a3418', hat: '#e0484f', hatDk: '#a8302f', shirt: '#f7c843', arm: '#d9a72a', pants: '#3f6fb5' },
  { id: 'gakusei', name: '学生さん', likes: ['さくさく', 'とろーり'], h: 19, skin: '#f3c9a5', hair: '#2a1d1a', shirt: '#2f3f6b', arm: '#253256', pants: '#2f3f6b', collar: '#ffffff' },
  { id: 'otona', name: 'おとなの人', likes: ['こくまろ', 'こんがり'], h: 20, skin: '#eab88f', hair: '#6b4426', shirt: '#5f8f6a', arm: '#4a7354', pants: '#3b3b46' },
  { id: 'obaachan', name: 'おばあちゃん', likes: ['ふわふわ', 'こくまろ'], h: 18, skin: '#f1c7a6', hair: '#cfcad6', bun: true, shirt: '#8d6bb3', arm: '#735596', pants: '#5b4a6e' },
];
const CUST = Object.fromEntries(CUSTOMERS.map(c => [c.id, c]));
const HEARTS_REGULAR = 3;
