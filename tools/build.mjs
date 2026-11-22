// まぜまぜおかし屋のビルド（Node の標準だけ）。node tools/build.mjs
// src/shell.html の <!--STYLE--> に src/style.css、<!--SCRIPT--> に JS を順に入れて index.html を作る
// --artifact <ファイル> をつけると、アーティファクト用（小さな骨のページ＋同じフォルダの app.css・app.js）も書く
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const rd = p => readFileSync(join(root, p), 'utf8');
// 見た目：style.css（もとの皮）のあとに、バトルの演出と舞台の賑やかし（11/18）
const STYLES = ['src/style.css', 'src/style-battle.css', 'src/style-ichi.css', 'src/style-talk.css', 'src/style-hiru.css'];
const ORDER = [
  'src/js/core.js', 'src/data/cards.js', 'src/data/world.js', 'src/data/feet.js', 'src/data/hiru.js', 'src/data/story.js',
  'src/js/art.js', 'src/js/cards-ui.js', 'src/js/day-scene.js', 'src/js/night.js', 'src/js/night-ui.js', 'src/js/ichi.js', 'src/js/battle-fx.js', 'src/js/drag.js', 'src/js/tips.js', 'src/js/talk.js', 'src/js/morning.js', 'src/js/day.js', 'src/js/flow.js', 'src/js/logo.js', 'src/js/sound.js', 'src/js/se.js', 'src/js/main.js',
];
// 絵（11/19 しょーくん「重すぎてアーティファクトが開けない」）：埋めこまず、名前→ assets/art/<ファイル>?v=<中身の短いハッシュ> の表だけ入れる。
// 絵は使うときにブラウザが1まいずつ読む（アーティファクトは files で assets/art を同じパスに出す・tools/art_files.mjs）
const artDir = join(root, 'assets/art');
// フォント（assets/font/*.woff2 → @font-face「mz-<名前>」・11/18 H-024 ロゴの字）
let FONTS = ''; try { for (const f of readdirSync(join(root, 'assets/font')).sort()) { const m = f.match(/^(.+)\.woff2$/); if (m) FONTS += `@font-face{font-family:"mz-${m[1]}";src:url(data:font/woff2;base64,${readFileSync(join(root, 'assets/font', f)).toString('base64')}) format("woff2");font-display:block}\n`; } } catch (e) {}
const ART = {};
for (const f of readdirSync(artDir).sort()) {
  const m = f.match(/^(.+)\.(webp|png)$/); if (!m) continue;
  ART[m[1]] = `__ARTDIR__${f}?v=` + createHash('md5').update(readFileSync(join(artDir, f))).digest('hex').slice(0, 8);
}
// BGM（11/19 司令塔の見本2曲）：assets/bgm/*.mp3 → 名前→場所の表 BGM_SRC（埋めこまない・遊ぶ人は assets/bgm/・アーティファクトは bgm/）
// 効果音と掛け声（11/19 H-034 昼のチャット）：assets/se・assets/koe → SE_SRC・KOE_SRC（BGM と同じ形・遊ぶ人は assets/se/・アーティファクトは se/）
const SND_SRC = sub => { const T = {}; try { for (const f of readdirSync(join(root, 'assets', sub)).sort()) { const m = f.match(/^(.+)\.mp3$/); if (m) T[m[1]] = `__${sub.toUpperCase()}DIR__${f}?v=` + createHash('md5').update(readFileSync(join(root, 'assets', sub, f))).digest('hex').slice(0, 8); } } catch (e) { /* ない */ } return T; };
const SE_SRC = SND_SRC('se'), KOE_SRC = SND_SRC('koe');
const PACK2 = /^(cust-|sweet-|deco-|fc-)/, PACK3 = /^mix/;   // ためしのページで2つめのまとめに入れる絵（11/21 夜 まぜた先の絵 mix・mix3 も）（tools/art_files.mjs も同じ）
const BIG_BGM = 400000;   // これより大きい曲は、ためしのページでも まとめ（snd-pack.mp3）に入れない（tools/art_files.mjs も同じ数）
const BGM_SRC = {}; try { for (const f of readdirSync(join(root, 'assets/bgm')).sort()) { const m = f.match(/^(.+)\.mp3$/); if (m) BGM_SRC[m[1]] = `__BGMDIR__${f}?v=` + createHash('md5').update(readFileSync(join(root, 'assets/bgm', f))).digest('hex').slice(0, 8); } } catch (e) { /* 曲がない */ }
// 小さくする（11/18 軽量化）：遊ぶ人の index.html には、コメントと行の頭の空白を入れない（src はそのまま読みやすく）
// CSS：/* */ を消して空白をつめる。JS：1行まるごとのコメント（// と /* */）と行の頭の空白だけ消す（文字列やテンプレートの中には書かない決まり）
const minCss = t => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s*\n\s*/g, '\n').replace(/\n+/g, '\n').trim();
const minJs = t => t.replace(/^[ \t]*\/\*(?:(?!\*\/)[\s\S])*\*\/[ \t]*$/gm, '').replace(/^[ \t]*\/\/.*$/gm, '').replace(/^[ \t]+/gm, '').replace(/\n{2,}/g, '\n');
// TRIAL：ためしのページ（--artifact）だけ true（こね生地などを日にちを待たずに ためせる）。遊ぶ人の index.html は false
const js = "(() => {\n'use strict';\nconst ART = " + JSON.stringify(ART) + ";\nconst BGM_SRC = " + JSON.stringify(BGM_SRC) + ";\nconst BGM_BIG = {};\nconst SE_SRC = " + JSON.stringify(SE_SRC) + ";\nconst KOE_SRC = " + JSON.stringify(KOE_SRC) + ";\nconst SND_PACK = __SNDPACK__;\nconst ART_PACK = __ARTPACK__;\nconst ART_PACK2 = __ARTPACK2__;\nconst ART_PACK3 = __ARTPACK3__;\nconst TRIAL = __TRIAL__;\n" + ORDER.map(p => `/* ${p} */\n` + minJs(rd(p))).join('\n') + '\n})();';
// 絵の場所：遊ぶ人の index.html は assets/art/・アーティファクトは絵をページと同じ所に出す（files を短くするため・tools/art_files.mjs）
const fragOf = (trial, dir = 'assets/art/') => rd('src/shell.html')
  .replace('<!--STYLE-->', () => '<style>\n' + FONTS + minCss(STYLES.map(rd).join('\n')) + '</style>')
  .replace('<!--SCRIPT-->', () => '<script>\n' + js.replace('__TRIAL__', trial).replace('__SNDPACK__', 'null').replace('__ARTPACK__', 'null').replace('__ARTPACK2__', 'null').replace('__ARTPACK3__', 'null').replaceAll('__ARTDIR__', dir).replaceAll('__BGMDIR__', dir ? 'assets/bgm/' : 'bgm/').replaceAll('__SEDIR__', dir ? 'assets/se/' : 'se/').replaceAll('__KOEDIR__', dir ? 'assets/koe/' : 'koe/') + '\n</script>');
const frag = fragOf('false');

const cut = frag.indexOf('<div id="app">');
const head = frag.slice(0, cut).trim(), body = frag.slice(cut).trim();
const page = `<!doctype html>
<!-- 自動で作るファイル・手で直さない（直すのは src/。node tools/build.mjs で作る） -->
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="description" content="夜は食材モンスターをカードで撃退、朝はひらめいたレシピでお菓子づくり、昼はお店で販売。ドット絵のお菓子屋さんゲーム。">
<meta name="theme-color" content="#1b1530">
<style>:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}[hidden]{display:none!important}</style>
${head}
</head>
<body>
${body}
</body>
</html>
`;
writeFileSync(join(root, 'index.html'), page);
console.log('index.html', page.length, 'art', Object.keys(ART).length);
// 大きさの点検（11/19 しょーくん「ファイルを開くのが重い」）：まだ軽くしていない絵と、いちばん大きい絵を出す。index.html が BUDGET をこえたら知らせる
{
  const BUDGET = 1e6;   // 11/19〜 絵は外のファイル。ページだけで 1MB をこえたら、どこかで絵や大きなデータを埋めこんでいないか見る
  let slim = {}; try { slim = JSON.parse(readFileSync(join(root, 'assets/slim.json'), 'utf8')); } catch (e) { /* 表がない */ }
  const files = readdirSync(artDir).filter(f => /\.(webp|png)$/.test(f)).map(f => ({ n: f.replace(/\.\w+$/, ''), f, b: statSync(join(artDir, f)).size }));
  const raw = files.filter(x => slim[x.n] !== x.b);
  if (raw.length) console.log(`まだ軽くしていない絵 ${raw.length}まい（python3 -I tools/slim_art.py をかけてね）：` + raw.slice(0, 8).map(x => x.n).join(' '));
  if (page.length > BUDGET) console.log(`index.html が ${(page.length / 1e6).toFixed(1)}MB（めやす ${BUDGET / 1e6}MB）`);
  const big = files.filter(x => x.b > (/^(honoka|minamo|wakaba)(-|$)/.test(x.n) && !/chibi/.test(x.n) ? 300e3 : 150e3));   // キャラの大きい絵はもとの大きさ（H-032）なので 300KB まで if (big.length) console.log('150KB をこえる絵：' + big.map(x => `${x.n} ${Math.round(x.b / 1e3)}KB`).join('・'));
}
// アーティファクトは ?v= をつけない（出した絵のパスそのまま）
// 11/19〜 ページは小さな骨だけにして、CSS と JS は同じ所の app.css・app.js（新しい会話は出しなおす前に今のページをぜんぶ読む決まり。0.5MB のページは読みきれなかった）
// → <ファイル> と同じフォルダに app.css・app.js も書く。publish の files に app.css・app.js（とふえた絵・曲）をわたす
const ai = process.argv.indexOf('--artifact');
if (ai > 0 && process.argv[ai + 1]) {
  const out = process.argv[ai + 1], dir = dirname(out), h8 = s => createHash('md5').update(s).digest('hex').slice(0, 8);
  const css = FONTS + minCss(STYLES.map(rd).join('\n'));
  /* 音は1つのファイル snd-pack.mp3 にまとめる（11/19：アーティファクトは1つの版に511ファイルまで。効果音と声の44こが入らなかった）。
     曲・効果音・声の mp3 をつなげて、どこからどこまでかの表 SND_PACK をわたす（sound.js が切り分けて blob の URL を表に入れる）。遊ぶ人の index.html は今までどおり1こずつ */
  const parts = [], items = {}; let off = 0;
  /* 大きい曲（Lyria の昼と夜・0.6〜1.3MB・11/21）はまとめに入れず bgm/<名前>.mp3 のまま出す（まとめに入れると、開いたときに効果音より先に6MBを読むことになる）。art_files.mjs も同じ大きさで分ける */
  const bigBgm = {}; try { for (const f of readdirSync(join(root, 'assets/bgm')).filter(f => f.endsWith('.mp3')).sort()) if (statSync(join(root, 'assets/bgm', f)).size > BIG_BGM) bigBgm[f.slice(0, -4)] = 'bgm/' + f; } catch (e) { /* ない */ }
  for (const sub of ['bgm', 'se', 'koe']) { let fs = []; try { fs = readdirSync(join(root, 'assets', sub)).filter(f => f.endsWith('.mp3') && !(sub === 'bgm' && bigBgm[f.slice(0, -4)])).sort(); } catch (e) { /* ない */ }
    for (const f of fs) { const b = readFileSync(join(root, 'assets', sub, f)); items[sub + '/' + f.slice(0, -4)] = [off, b.length]; parts.push(b); off += b.length; } }
  const pack = Buffer.concat(parts); writeFileSync(join(dir, 'snd-pack.mp3'), pack);
  /* UI と演出の絵（ui-*・fx-* の116まい）も1つのファイル art-pack.webp にまとめる（11/19：絵がふえて511ファイルをこえた）。core.js の artBlobs が読んで blob の URL にする */
  const aparts = [], aitems = {}; let aoff = 0;
  for (const k of Object.keys(ART).filter(k => /^(ui-|fx-)/.test(k)).sort()) {
    const f = ART[k].replace('__ARTDIR__', '').replace(/\?v=.*$/, ''), b = readFileSync(join(artDir, f));
    aitems[k] = [aoff, b.length, f.endsWith('.png') ? 'image/png' : 'image/webp']; aparts.push(b); aoff += b.length;
  }
  const apack = Buffer.concat(aparts); writeFileSync(join(dir, 'art-pack.webp'), apack);
  /* 朝昼の絵（cust-*・sweet-*・deco-*・fc-* の約190まい）も2つめのまとめ art-pack2.webp に（11/21：ファイルが 512 をこえた）。こちらは起動を待たせずに裏で読む（core.js の artBlobs） */
  const bparts = [], bitems = {}; let boff = 0;
  for (const k of Object.keys(ART).filter(k => PACK2.test(k)).sort()) {
    const f = ART[k].replace('__ARTDIR__', '').replace(/\?v=.*$/, ''), b = readFileSync(join(artDir, f));
    bitems[k] = [boff, b.length, f.endsWith('.png') ? 'image/png' : 'image/webp']; bparts.push(b); boff += b.length;
  }
  const bpack = Buffer.concat(bparts); writeFileSync(join(dir, 'art-pack2.webp'), bpack);
  /* まぜた先のカードの絵（mix・mix3・mixc…・11/21 夜）は3つめのまとめ art-pack3.webp に。夜にしか使わないので、夜の先読み（nightWarm）のときに読む（起動を軽く） */
  const cparts = [], citems = {}; let coff = 0;
  for (const k of Object.keys(ART).filter(k => PACK3.test(k)).sort()) {
    const f = ART[k].replace('__ARTDIR__', '').replace(/\?v=.*$/, ''), b = readFileSync(join(artDir, f));
    citems[k] = [coff, b.length, f.endsWith('.png') ? 'image/png' : 'image/webp']; cparts.push(b); coff += b.length;
  }
  const cpack = Buffer.concat(cparts); writeFileSync(join(dir, 'art-pack3.webp'), cpack);
  const aj = js.replace(/const (BGM_SRC|SE_SRC|KOE_SRC) = \{[^\n]*\};/g, 'const $1 = {};').replace('const BGM_BIG = {};', () => 'const BGM_BIG = ' + JSON.stringify(bigBgm) + ';').replace('__SNDPACK__', () => JSON.stringify({ url: 'snd-pack.mp3?v=' + h8(pack), items })).replace('__ARTPACK__', () => JSON.stringify({ url: 'art-pack.webp?v=' + h8(apack), items: aitems })).replace('__ARTPACK2__', () => JSON.stringify({ url: 'art-pack2.webp?v=' + h8(bpack), items: bitems })).replace('__ARTPACK3__', () => JSON.stringify({ url: 'art-pack3.webp?v=' + h8(cpack), items: citems })).replace('__TRIAL__', 'true').replaceAll('__ARTDIR__', '').replaceAll('__BGMDIR__', 'bgm/').replaceAll('__SEDIR__', 'se/').replaceAll('__KOEDIR__', 'koe/').replace(/\.(webp|png|mp3)\?v=[0-9a-f]{8}"/g, '.$1"');
  writeFileSync(join(dir, 'app.css'), css); writeFileSync(join(dir, 'app.js'), aj);
  const af = rd('src/shell.html').replace('<!--STYLE-->', `<link rel="stylesheet" href="app.css?v=${h8(css)}">`).replace('<!--SCRIPT-->', `<script src="app.js?v=${h8(aj)}"></script>`);
  writeFileSync(out, af); console.log('artifact', af.length, 'app.js', aj.length, 'app.css', css.length);
}
