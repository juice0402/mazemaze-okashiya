/* ==== 朝と昼の数字（持ち主：昼のチャット【okashi-hiru】）====
   夜と昼をまたぐ数字（お金・材料・レシピの値段と味・常連さんになるハートの数 HEARTS_REGULAR）はリーダー（src/data/cards.js・world.js） */
const OVENS = 3, BATCH = 3;                        // 朝に焼けるのは3回。1回で3こ（売るとき）
const CUST_BASE = 6, LIKE_MUL = 2, OTHER_BUY = 0.6; // 1日のお客さんの数のもと・すきな味は2倍の値段・すきな味がないとき買う人の割合
/* お客さんのすきな味（お客さんの名前と見た目は world.js の CUSTOMERS） */
const CUST_LIKES = {
  kodomo: ['あまい', 'ぷるぷる'],
  gakusei: ['さくさく', 'とろーり'],
  otona: ['こくまろ', 'こんがり'],
  obaachan: ['ふわふわ', 'こくまろ'],
};
const likesOf = c => CUST_LIKES[c.id] || [];
