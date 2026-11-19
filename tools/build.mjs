// まぜまぜおかし屋のビルド（Node の標準だけ）。node tools/build.mjs
// src/shell.html の <!--STYLE--> に src/style.css、<!--SCRIPT--> に JS を順に入れて index.html を作る
// --artifact <ファイル> をつけると、アーティファクト用（doctype などなし）も書く
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const rd = p => readFileSync(join(root, p), 'utf8');
// 見た目：style.css（もとの皮）のあとに、バトルの演出と舞台の賑やかし（11/18）
const STYLES = ['src/style.css', 'src/style-battle.css', 'src/style-talk.css', 'src/style-hiru.css'];
const ORDER = [
  'src/js/core.js', 'src/data/cards.js', 'src/data/world.js', 'src/data/feet.js', 'src/data/hiru.js', 'src/data/story.js',
  'src/js/art.js', 'src/js/cards-ui.js', 'src/js/day-scene.js', 'src/js/night.js', 'src/js/night-ui.js', 'src/js/battle-fx.js', 'src/js/drag.js', 'src/js/tips.js', 'src/js/talk.js', 'src/js/morning.js', 'src/js/day.js', 'src/js/flow.js', 'src/js/logo.js', 'src/js/sound.js', 'src/js/main.js',
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
const BGM_SRC = {}; try { for (const f of readdirSync(join(root, 'assets/bgm')).sort()) { const m = f.match(/^(.+)\.mp3$/); if (m) BGM_SRC[m[1]] = `__BGMDIR__${f}?v=` + createHash('md5').update(readFileSync(join(root, 'assets/bgm', f))).digest('hex').slice(0, 8); } } catch (e) { /* 曲がない */ }
// 小さくする（11/18 軽量化）：遊ぶ人の index.html には、コメントと行の頭の空白を入れない（src はそのまま読みやすく）
// CSS：/* */ を消して空白をつめる。JS：1行まるごとのコメント（// と /* */）と行の頭の空白だけ消す（文字列やテンプレートの中には書かない決まり）
const minCss = t => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s*\n\s*/g, '\n').replace(/\n+/g, '\n').trim();
const minJs = t => t.replace(/^[ \t]*\/\*(?:(?!\*\/)[\s\S])*\*\/[ \t]*$/gm, '').replace(/^[ \t]*\/\/.*$/gm, '').replace(/^[ \t]+/gm, '').replace(/\n{2,}/g, '\n');
// TRIAL：ためしのページ（--artifact）だけ true（こね生地などを日にちを待たずに ためせる）。遊ぶ人の index.html は false
const js = "(() => {\n'use strict';\nconst ART = " + JSON.stringify(ART) + ";\nconst BGM_SRC = " + JSON.stringify(BGM_SRC) + ";\nconst TRIAL = __TRIAL__;\n" + ORDER.map(p => `/* ${p} */\n` + minJs(rd(p))).join('\n') + '\n})();';
// 絵の場所：遊ぶ人の index.html は assets/art/・アーティファクトは絵をページと同じ所に出す（files を短くするため・tools/art_files.mjs）
const fragOf = (trial, dir = 'assets/art/') => rd('src/shell.html')
  .replace('<!--STYLE-->', () => '<style>\n' + FONTS + minCss(STYLES.map(rd).join('\n')) + '</style>')
  .replace('<!--SCRIPT-->', () => '<script>\n' + js.replace('__TRIAL__', trial).replaceAll('__ARTDIR__', dir).replaceAll('__BGMDIR__', dir ? 'assets/bgm/' : 'bgm/') + '\n</script>');
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
  const big = files.filter(x => x.b > 150e3); if (big.length) console.log('150KB をこえる絵：' + big.map(x => `${x.n} ${Math.round(x.b / 1e3)}KB`).join('・'));
}
// アーティファクトは ?v= をつけない（出した絵のパスそのまま）
const ai = process.argv.indexOf('--artifact');
if (ai > 0 && process.argv[ai + 1]) { const af = fragOf('true', '').replace(/\.(webp|png|mp3)\?v=[0-9a-f]{8}"/g, '.$1"'); writeFileSync(process.argv[ai + 1], af); console.log('artifact', af.length); }
