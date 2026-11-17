// まぜまぜおかし屋のビルド（Node の標準だけ）。node tools/build.mjs
// src/shell.html の <!--STYLE--> に src/style.css、<!--SCRIPT--> に JS を順に入れて index.html を作る
// --artifact <ファイル> をつけると、アーティファクト用（doctype などなし）も書く
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const rd = p => readFileSync(join(root, p), 'utf8');
const ORDER = [
  'src/js/core.js', 'src/data/cards.js', 'src/data/world.js',
  'src/js/art.js', 'src/js/cards-ui.js', 'src/js/scene.js', 'src/js/night.js', 'src/js/night-ui.js', 'src/js/drag.js', 'src/js/morning.js', 'src/js/day.js', 'src/js/main.js',
];
// 絵：assets/art/*.webp（と png）を名前→dataURL にして埋めこむ（ソースには base64 を書かない）
const artDir = join(root, 'assets/art');
const ART = {};
for (const f of readdirSync(artDir).sort()) {
  const m = f.match(/^(.+)\.(webp|png)$/); if (!m) continue;
  ART[m[1]] = `data:image/${m[2]};base64,` + readFileSync(join(artDir, f)).toString('base64');
}
const js = "(() => {\n'use strict';\nconst ART = " + JSON.stringify(ART) + ";\n" + ORDER.map(p => `/* ---- ${p} ---- */\n` + rd(p)).join('\n') + '\n})();';
const frag = rd('src/shell.html')
  .replace('<!--STYLE-->', () => '<style>\n' + rd('src/style.css') + '</style>')
  .replace('<!--SCRIPT-->', () => '<script>\n' + js + '\n</script>');

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
const ai = process.argv.indexOf('--artifact');
if (ai > 0 && process.argv[ai + 1]) { writeFileSync(process.argv[ai + 1], frag); console.log('artifact', frag.length); }
