/* ==== タイトルロゴ（昼のチャット・11/18）==== */
/* logoHTML() をタイトル画面の見出しの場所に置く。見本はしょーくんのOKの Design「まぜまぜ ロゴ案」（Version 6）
   動き（約3秒）：生地のうずまき → まぜまぜが残像をひいて飛び出す（-7度）・光がすべる → おかし屋が1文字ずつトン → 小さく「さん」・お菓子が散ってふわふわ
   文字は Mochiy Pop One で描いた絵（assets/art の logo-*・ネットなしでも出る）。大きさは横幅に合わせる（390 の座標を --u でのばす）
   動くのは起動して最初に出たときだけ。2回目からは、できあがった形（お菓子のふわふわ・キラキラだけ動く） */
let lgPlayed = false;
const LG_SW1 = 'M156 150 157 151 157.9 152.2 158.5 153.7 158.9 155.4 158.9 157.3 158.6 159.3 157.9 161.3 156.8 163.2 155.3 165.1 153.4 166.8 151.1 168.2 148.6 169.3 145.7 170 142.7 170.2 139.4 170 136.2 169.3 132.9 168 129.7 166.2 126.7 163.8 124 161 121.7 157.6 119.8 153.8 118.5 149.6 117.7 145.2 117.6 140.5 118.2 135.7 119.5 130.9 121.6 126.2 124.4 121.7 127.8 117.6 132 113.9 136.7 110.7 142 108.2 147.8 106.3 153.8 105.3 160.1 105.2 166.6 106 173 107.7 179.2 110.3 185.1 113.9 190.6 118.3 195.5 123.6 199.7 129.7 203.1 136.4 205.5 143.6 207 151.3 207.4 159.3 206.6 167.3 204.7 175.4 201.7 183.2 197.5 190.7 192.2 197.6 186 203.9 178.7 209.3 170.7 213.7 162 217 152.8 219.2 143.2 220 133.4 219.5 123.7 217.6 114.1 214.3 105 209.7 96.5 203.8 88.8 196.7 82 188.4 76.4 179.2 72 169.1 69 158.4 67.5 147.2 67.6 135.7 69.3 124.3 72.5 113 77.4 102.2 83.8 91.9 91.6 82.6 100.8 74.3 111.1 67.3 122.4 61.7 134.6 57.7 147.3 55.3 160.4 54.7 173.6 56 186.6 59 199.3 63.9 211.2 70.6 222.3 78.9 232.2 88.8 240.8 100.1 247.8 112.6 253.1 126 256.5 140.2 257.9 154.9 257.3 169.8 254.7 184.7 249.9 199.1 243.2 213 234.6 225.8 224.1 237.5 212 247.8 198.6 256.3 183.9 263 168.3 267.7 152.1 270.2 135.5 270.5 118.9 268.4 102.6 264.1 86.8 257.5 72.1 248.7 58.5 237.9 46.4 225.2';
const LG_SW2 = 'M146 150 145.1 149.3 144.4 148.4 143.8 147.3 143.5 146 143.4 144.6 143.6 143.1 144.1 141.5 144.9 140 146 138.5 147.4 137.2 149.1 136 151.1 135.1 153.3 134.5 155.7 134.3 158.2 134.4 160.8 134.9 163.4 135.9 165.9 137.3 168.3 139.1 170.4 141.4 172.3 144 173.8 147 174.9 150.3 175.5 153.8 175.6 157.5 175.2 161.3 174.2 165.2 172.6 168.9 170.4 172.5 167.7 175.8 164.4 178.8 160.6 181.4 156.4 183.4 151.8 184.9 146.9 185.7 141.9 185.8 136.7 185.2 131.6 183.9 126.6 181.8 121.9 178.9 117.5 175.4 113.5 171.2 110.1 166.3 107.4 160.9 105.4 155.1 104.2 149 103.9 142.6 104.4 136.1 106 129.6 108.4 123.3 111.7 117.2 116 111.6 121 106.6 126.8 102.2 133.3 98.6 140.3 95.9 147.8 94.2 155.5 93.5 163.4 93.9 171.2 95.4 178.9 98.1 186.3 101.8 193.2 106.6 199.5 112.3 204.9 119 209.5 126.4 213.1 134.6 215.5 143.2 216.7 152.3 216.6 161.5 215.3 170.8 212.7 179.9 208.8 188.7 203.6 197 197.3 204.6 189.9 211.3 181.5 217 172.3 221.5 162.5 224.8 152.2 226.7 141.6 227.2 130.9 226.2 120.3 223.7 110.1 219.7 100.4 214.4 91.4 207.6 83.3 199.6 76.4 190.5 70.7 180.4 66.4 169.4 63.6 157.9 62.5 146 62.9 133.9 65.1 121.9 68.9 110.1 74.4 98.9 81.4 88.4 89.8 79 99.6 70.6 110.6 63.7 122.5 58.2 135.1 54.4 148.3 52.4 161.8 52.2 175.3 53.8 188.5 57.3 201.3 62.7 213.3 69.8 224.3 78.6 234.1 88.9';
/* 散るお菓子（仮の絵・H-011 のアイコンが来たら差しかえ）：[絵, 左, 上, 大きさ, かたむき, 出る時間, ふわふわの時間] */
const LG_SWEETS = [
  ['cookie', 12, -4, 44, -14, 2.4, 3.3], ['cake', 334, -8, 44, 10, 2.43, 3.5], ['macaron', 8, 92, 44, -8, 2.45, 3.7],
  ['donut', 338, 76, 44, 16, 2.47, 3.4], ['berry', 62, 126, 44, -18, 2.49, 3.6], ['cupcake', 296, 140, 44, 8, 2.51, 3.8],
  ['candy', 180, -14, 44, -6, 2.42, 3.45], ['chip', 196, 146, 36, 12, 2.53, 3.55],
];
const LG_SPARKS = [[52, 48, 2.6], [334, 46, 2.85], [120, 2, 3.1], [262, 0, 3.35], [128, 150, 3.6], [252, 150, 3.85]];
const LG_SVG = {
  cookie: '<circle cx="22" cy="22" r="19" fill="#d99a4e" stroke="#7a3e14" stroke-width="2.5"/><circle cx="20" cy="19" r="13" fill="#eab86d" opacity=".55"/><circle cx="15" cy="17" r="2.7" fill="#4a2410"/><circle cx="27" cy="13" r="2.2" fill="#4a2410"/><circle cx="29" cy="27" r="2.9" fill="#4a2410"/><circle cx="17" cy="29" r="2.3" fill="#4a2410"/><circle cx="23" cy="21" r="1.7" fill="#4a2410"/>',
  cake: '<rect x="8" y="18" width="28" height="19" rx="3" fill="#f7d58e" stroke="#7a3e14" stroke-width="2"/><rect x="9" y="25" width="26" height="3.5" fill="#f05a6e"/><path d="M7 20 q4 -6 7.5 0 q3.5 -6 7.5 0 q3.5 -6 7.5 0 q3.5 -6 7.5 0 v1.5 h-30 z" fill="#fffaf2" stroke="#7a3e14" stroke-width="2" stroke-linejoin="round"/><path d="M22 3 c5 0 7 4 6 7 c-1 3.5 -4 5.5 -6 6.5 c-2 -1 -5 -3 -6 -6.5 c-1 -3 1 -7 6 -7 z" fill="#e8344c" stroke="#7a1426" stroke-width="1.5"/><path d="M18 4.5 l4 2.2 l4 -2.2" stroke="#3f8a3a" stroke-width="2.2" fill="none" stroke-linecap="round"/>',
  macaron: '<ellipse cx="22" cy="29" rx="16" ry="8" fill="#ff9fb8" stroke="#a13a5a" stroke-width="2"/><rect x="7" y="20" width="30" height="7" rx="3.5" fill="#fff4e2" stroke="#a13a5a" stroke-width="2"/><ellipse cx="22" cy="17" rx="16" ry="8" fill="#ff9fb8" stroke="#a13a5a" stroke-width="2"/><ellipse cx="16" cy="14.5" rx="5" ry="2" fill="#ffd6e2"/>',
  donut: '<circle cx="22" cy="22" r="18" fill="#e0a25a" stroke="#7a3e14" stroke-width="2"/><path d="M22 6.5 c9 0 15.5 6.5 15.5 14.5 c0 3 -2 2 -3 4 c-1.5 3 -4 1 -6 3 c-2 2 -5 0 -7 1.2 c-3 1 -5 -2 -8 -1 c-3 0 -6.5 -3 -6.5 -6.5 c0 -9 6 -15.2 15 -15.2 z" fill="#ff8fab" stroke="#a13a5a" stroke-width="1.5"/><circle cx="22" cy="21" r="5.5" fill="#2a1206" stroke="#7a3e14" stroke-width="1.5"/><rect x="13" y="12" width="5" height="2" rx="1" fill="#fff3c4" transform="rotate(-30 15 13)"/><rect x="28" y="12" width="5" height="2" rx="1" fill="#fff" transform="rotate(35 30 13)"/><rect x="12" y="23" width="5" height="2" rx="1" fill="#fff3c4" transform="rotate(20 14 24)"/><rect x="29" y="22" width="5" height="2" rx="1" fill="#9be3b4" transform="rotate(-25 31 23)"/><rect x="20" y="10" width="5" height="2" rx="1" fill="#9be3b4" transform="rotate(10 22 11)"/>',
  berry: '<path d="M22 41 C10 35 5 25 8 17 C11 10 18 11 22 13 C26 11 33 10 36 17 C39 25 34 35 22 41 Z" fill="#e8344c" stroke="#7a1426" stroke-width="2"/><ellipse cx="16" cy="21" rx="1.2" ry="1.8" fill="#ffe08a"/><ellipse cx="25" cy="20" rx="1.2" ry="1.8" fill="#ffe08a"/><ellipse cx="20" cy="28" rx="1.2" ry="1.8" fill="#ffe08a"/><ellipse cx="29" cy="27" rx="1.2" ry="1.8" fill="#ffe08a"/><ellipse cx="23" cy="34" rx="1.2" ry="1.8" fill="#ffe08a"/><path d="M12 13 L18 10 L22 4.5 L26 10 L32 13 L26 14 L22 12 L18 14 Z" fill="#4f9a40" stroke="#2d5e24" stroke-width="1.5" stroke-linejoin="round"/>',
  cupcake: '<path d="M10 24 L34 24 L31 41 L13 41 Z" fill="#f05a6e" stroke="#7a1426" stroke-width="2" stroke-linejoin="round"/><path d="M17 25 L18 40 M22 25 L22 40 M27 25 L26 40" stroke="#ff9fb0" stroke-width="2"/><path d="M8 25 c-2 -5 3 -8.5 6 -7.5 c0 -6 6 -9 9 -6 c3 -4 10 -2 9.5 4 c4.5 0 6.5 5.5 2.5 9.5 z" fill="#fff4e2" stroke="#7a3e14" stroke-width="2" stroke-linejoin="round"/><circle cx="24" cy="8" r="4" fill="#e8344c" stroke="#7a1426" stroke-width="1.5"/>',
  candy: '<path d="M3 13 L13 20 L3 31 Z" fill="#ffd27a" stroke="#7a3e14" stroke-width="1.8" stroke-linejoin="round"/><path d="M41 13 L31 20 L41 31 Z" fill="#ffd27a" stroke="#7a3e14" stroke-width="1.8" stroke-linejoin="round"/><ellipse cx="22" cy="22" rx="11" ry="9" fill="#ffd27a" stroke="#7a3e14" stroke-width="2"/><path d="M16 15.5 L20 29 M22.5 13.5 L26.5 29.5" stroke="#ff8fab" stroke-width="3" stroke-linecap="round"/>',
  chip: '<circle cx="22" cy="22" r="19" fill="#c98544" stroke="#7a3e14" stroke-width="2.5"/><circle cx="15" cy="18" r="2.6" fill="#4a2410"/><circle cx="27" cy="15" r="2.2" fill="#4a2410"/><circle cx="28" cy="28" r="2.8" fill="#4a2410"/><circle cx="17" cy="28" r="2.2" fill="#4a2410"/>',
};
const LG_SPARK = '<svg class="lg-sp" viewBox="0 0 20 20" style="--x:{x};--y:{y};animation-delay:{d}s"><path d="M10 0 C11 7 13 9 20 10 C13 11 11 13 10 20 C9 13 7 11 0 10 C7 9 9 7 10 0 Z" fill="#fff3c4"/></svg>';
/* うずまきの中心（お菓子が飛び出す所） */
const LG_CX = 200, LG_CY = 66;
/* まぜまぜ：[文字, 飛び出す前の位置, まわる角度, 出る時間, 光がすべる時間] */
const LG_MZ = [['ma', 87, 320, .5, 1.15], ['ze', 29, 270, .55, 1.22], ['ma', -29, 220, .6, 1.29], ['ze', -87, 170, .65, 1.36]];
const LG_DP = [['o', 1.4], ['ka', 1.56], ['shi', 1.72], ['ya', 1.88]];

function lgImg(n) { return `<img src="${ART['logo-' + n] || ''}" alt="" draggable="false">`; }
function logoHTML() {
  const play = !lgPlayed;
  lgPlayed = true;
  const sweets = LG_SWEETS.map(([k, x, y, w, rt, d, bob]) => {
    const sx = LG_CX - (x + w / 2), sy = LG_CY - (y + w / 2);
    return `<span class="lg-bs" style="--x:${x};--y:${y};--w:${w};--sx:${sx};--sy:${sy};--rt:${rt};animation-delay:${d}s"><span class="lg-bb" style="animation-delay:${bob}s"><svg viewBox="0 0 44 44">${LG_SVG[k]}</svg></span></span>`;
  }).join('') + LG_SPARKS.map(([x, y, d]) => LG_SPARK.replace('{x}', x).replace('{y}', y).replace('{d}', d)).join('');
  const mz = LG_MZ.map(([n, dx, a, d, sh]) => {
    const v = `--dx:${dx};--a0:${-a}deg;--a1:${a}deg`;
    return `<span class="lg-slot"><span class="lg-gh" style="${v};animation-delay:${(d + .04).toFixed(2)}s">${lgImg(n + '-g')}</span><span class="lg-gh" style="${v};animation-delay:${(d + .08).toFixed(2)}s">${lgImg(n + '-g')}</span>`
      + `<span class="lg-c lg-mz" style="${v};animation-delay:${d}s">${lgImg(n)}<span class="lg-sh" style="-webkit-mask-image:url(${ART['logo-' + n + '-g'] || ''});mask-image:url(${ART['logo-' + n + '-g'] || ''})"><i style="animation-delay:${sh}s"></i></span></span></span>`;
  }).join('');
  const dp = LG_DP.map(([n, d]) => `<span class="lg-c lg-dp" style="animation-delay:${d}s">${lgImg(n)}</span>`).join('')
    + LG_DP.map(([, d], i) => `<span class="lg-pf" style="--x:${2 + i * 54};animation-delay:${(d + .29).toFixed(2)}s"></span>`).join('')
    + `<span class="lg-c lg-sn">${lgImg('san')}</span>`;
  return `<div class="lg ${play ? 'lg-play' : 'lg-still'}" role="img" aria-label="まぜまぜおかし屋さん">
    <div class="lg-fx" aria-hidden="true">${sweets}</div>
    <div class="lg-th" aria-hidden="true">
      <div class="lg-fl"></div>
      <svg class="lg-sw" viewBox="0 0 300 300"><g class="lg-swg">
        <path class="lg-swp" pathLength="1" d="${LG_SW1}" stroke="#7a3e14" stroke-width="15"/>
        <path class="lg-swp" pathLength="1" d="${LG_SW1}" stroke="#fff1d2" stroke-width="9"/>
        <path class="lg-swp" pathLength="1" d="${LG_SW2}" stroke="#e8577a" stroke-width="6" style="animation-delay:.06s"/>
      </g><circle class="lg-cf" cx="150" cy="150" r="46" fill="#fff6dc"/></svg>
      <div class="lg-r1">${mz}</div>
      <div class="lg-r2">${dp}</div>
    </div>
  </div>`;
}

/* ==== タイトル画面（昼のチャット・11/18 17時 しょーくん「本格的なゲームのスタート画面に・全パーツ描き下ろし」）====
   えらぶ質問で：夜のお店の前・ほのか／みなも／わかば＋モンスター5体・キラキラと光・灯りのゆらぎ・キャラが少し動く
   main.js の renderTitle が lgTitleHTML(saved, resetArm) を置く。描き下ろしの絵（title-bg・title-honoka・title-minamo・title-wakaba・title-mon-<id>・title-fore）が
   来るまでは、op-shop-night・立ち絵・夜のモンスターの絵で仮。ない絵の人は出さない
   背景は .tt-scene（絵と同じ縦横比で画面をおおう）の中に置き、灯り・光の筋は絵の中の %（絵が変わったら LG_BG の数字を合わせる）
   ずっと動くものは transform と opacity だけ（docs/PARTS.md の「軽く描く」）。画面を出たら DOM ごと消えるので止まる */
/* 背景の絵ごとの置き方：ar＝横÷縦・fx/fy＝はみ出すとき見せる所（0〜1）・z＝おおったうえで、さらに大きくする（仮の絵の看板をロゴのうしろにかくす）・lt＝灯り [x%, y%, 大きさ(絵の横の%), win＝窓（ゆっくり）/ lamp＝ランプ（ゆらゆら）/ pool＝地面の光 / moon]
   ray＝光の筋 [x%, y%, はば%, 長さ%, かたむき] */
const LG_BG = {
  'title-bg': { ar: 9 / 16, fx: .5, fy: .5, lt: [], ray: [] },
  'op-shop-night': { ar: 16 / 9, fx: .55, fy: 1, z: 1.12,
    lt: [[44, 55, 26, 'win'], [43, 44, 8, 'lamp'], [52, 44, 8, 'lamp'], [65, 48, 11, 'win'], [73, 44, 10, 'lamp'], [78, 49, 8, 'win'], [52, 86, 62, 'pool'], [11, 16, 12, 'moon']],
    ray: [[44, 62, 20, 32, -4], [65, 56, 9, 30, 6]] },
};
/* キャラ：[名前, 絵の候補, 左%, 高さ(画面の高さの%), 前後, 出る時間] */
const LG_CAST = [
  ['minamo', ['title-minamo'], 23, 40, 1, .9], ['wakaba', ['title-wakaba'], 77, 40, 1, 1.0],
  ['honoka', ['title-honoka', 'honoka'], 50, 50, 2, .75],
];
/* モンスター：[id, 左%, 下%, 高さ(画面の高さの%), 反転, 動き, 出る時間] */
const LG_MONS = [
  ['slime', 12, 0, 8.5, 1, 'hop', 1.35], ['hitsuji', 31, 1, 8.5, 1, 'bob', 1.45], ['hiyoko', 70, 0, 7.5, 0, 'hop2', 1.55],
  ['tokage', 87, 0, 8, 0, 'bob', 1.65], ['kurage', 81, 34, 8, 0, 'float', 1.75],
];
/* キラキラ：舞いあがる光の粒 [左%, 下%, 大きさpx, 秒, 遅れ, 横にゆれる px]・またたく星 [左%, 上%, 大きさpx, 秒, 遅れ] */
const LG_MOTES = [[8, 8, 6, 9, 0, 14], [18, 30, 4, 11, 3, -10], [27, 12, 5, 8, 6, 12], [36, 40, 4, 10, 1.5, -14], [45, 18, 6, 12, 7, 10], [55, 5, 5, 9, 4, -12],
  [63, 34, 4, 11, 2, 16], [72, 14, 6, 10, 8, -10], [81, 26, 5, 8, 5, 12], [90, 10, 4, 12, 0.5, -16], [50, 48, 4, 9, 9, 8], [15, 52, 5, 10, 4.5, -8],
  [4, 24, 4, 11, 6.5, 10], [96, 44, 5, 9, 3.5, -12], [40, 2, 5, 10, 2.5, 14], [86, 58, 4, 12, 7.5, -10]];
const LG_TWINK = [[9, 6, 20, 3.2, 0], [86, 9, 16, 2.8, 1.2], [24, 22, 13, 3.6, 2.1], [72, 26, 18, 3.1, .6], [94, 40, 13, 2.9, 1.8], [5, 38, 16, 3.4, 2.6],
  [40, 4, 12, 2.6, 1.5], [62, 3, 14, 3.8, .3], [33, 58, 16, 3.3, 2.9], [68, 62, 15, 3.0, 1.1], [16, 70, 13, 3.5, .9], [90, 74, 14, 2.7, 2.3]];
const LG_STAR = '<svg viewBox="0 0 20 20"><path d="M10 0 C11 7 13 9 20 10 C13 11 11 13 10 20 C9 13 7 11 0 10 C7 9 9 7 10 0 Z" fill="#fff3c4"/></svg>';
function lgArt(c) { for (const k of c) if (ART[k]) return ART[k]; return ''; }
function lgTitleHTML(saved, arm) {
  const play = !lgPlayed, logo = logoHTML();
  const bk = ART['title-bg'] ? 'title-bg' : 'op-shop-night', B = LG_BG[bk], bg = ART[bk] || ART['bg-night'] || '';
  const lt = B.lt.map(([x, y, s, k], i) => `<i class="tt-lt ${k}" style="--x:${x};--y:${y};--s:${s};animation-delay:${(-i * 1.37).toFixed(2)}s"></i>`).join('');
  const ray = B.ray.map(([x, y, w, h, r], i) => `<i class="tt-ray" style="--x:${x};--y:${y};--w:${w};--h:${h};--r:${r}deg;animation-delay:${(-i * 2.1).toFixed(1)}s"></i>`).join('');
  const motes = LG_MOTES.map(([x, b, s, t, d, dx]) => `<i class="tt-mote" style="left:${x}%;bottom:${b}%;--s:${s}px;--dx:${dx}px;animation-duration:${t}s;animation-delay:${-d}s"></i>`).join('');
  const twink = LG_TWINK.map(([x, y, s, t, d]) => `<i class="tt-tw" style="left:${x}%;top:${y}%;--s:${s}px;animation-duration:${t}s;animation-delay:${d}s">${LG_STAR}</i>`).join('');
  const cast = LG_CAST.map(([id, c, x, h, z, d], i) => { const src = lgArt(c); return src
    ? `<span class="tt-ch tt-${id}" style="--x:${x};--h:${h};z-index:${z}"><span class="tt-in" style="animation-delay:${d}s"><span class="tt-br" style="animation-delay:${(-i * 1.1).toFixed(1)}s"><img src="${src}" alt="" draggable="false"></span></span></span>` : ''; }).join('');
  const mons = LG_MONS.map(([id, x, b, h, fl, mv, d], i) => { const src = lgArt(['title-mon-' + id, 'mon-' + id]); return src
    ? `<span class="tt-ch tt-mon" style="--x:${x};--b:${b};--h:${h};z-index:3"><span class="tt-in" style="animation-delay:${d}s"><span class="tt-mv ${mv}" style="animation-delay:${(-i * .7).toFixed(1)}s"><img src="${src}" alt=""${fl ? ' class="fl"' : ''} draggable="false"></span></span></span>` : ''; }).join('');
  const fore = ART['title-fore'] ? `<img class="tt-fore" src="${ART['title-fore']}" alt="" draggable="false">` : '';
  const btn = saved && saved.phase !== 'title'
    ? `<button class="big" data-act="continue">つづきから（${saved.day}日目）</button><button class="sub" data-act="reset">${arm ? 'ほんとうに はじめから？（もう一度タップ）' : 'はじめから'}</button>`
    : '<button class="big" data-act="start">はじめる</button>';
  if (play) setTimeout(() => { const l = document.querySelector('.tt .lg-play'); if (l) l.className = 'lg lg-still'; }, 4300);   // ロゴが動きおわったら、光がすべるのをくりかえす形に
  return `<section class="title tt${play ? ' tt-play' : ''}">
    <div class="tt-scene" style="--ar:${B.ar};--fx:${B.fx};--fy:${B.fy};--z:${B.z || 1}" aria-hidden="true"><div class="tt-zoom"><img class="tt-bgi" src="${bg}" alt="" draggable="false">${lt}${ray}</div></div>
    <div class="tt-veil" aria-hidden="true"></div>
    <div class="tt-sky" aria-hidden="true">${twink}</div>
    <div class="t-logo tt-logo">${logo}</div>
    <div class="tt-stage" aria-hidden="true">${cast}${mons}</div>
    ${fore}<div class="tt-fx" aria-hidden="true">${motes}</div>
    <div class="tt-btns">${btn}</div>
  </section>`;
}
