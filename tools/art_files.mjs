// アーティファクト（試しのページ）を出しなおすときの files の表を出す（11/19〜 絵と曲はページに埋めこまない・ページは小さな骨で CSS と JS は app.css・app.js）
// node tools/art_files.mjs <コミット> <ページのフォルダ>  … ふだんはこれ。app.css・app.js（ページのフォルダから）と、そのコミットから足した・変えた絵と曲だけ
// node tools/art_files.mjs                           … assets/art の絵ぜんぶ（はじめて出すとき・250ずつ区切る。app.css・app.js・bgm/ は別に足す）
// 使い方：node tools/build.mjs --artifact <ページのフォルダ>/okashi.html → Artifact の publish に file_path <ページのフォルダ>/okashi.html・
//   root "/home/claude/mazemaze-okashiya/assets/art"（clone した場所の assets/art）・files に出てきた表をそのまま渡す。出さなかった絵は前のまま残る（消した絵は null で消す）
import { readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const [since, pageDir] = process.argv.slice(2);
if (since) {
  const out = execFileSync('git', ['-C', root, 'diff', '--name-only', '--diff-filter=AM', since, '--', 'assets/art', 'assets/bgm'], { encoding: 'utf8' });
  const map = {};
  if (pageDir) for (const f of ['app.css', 'app.js']) map[f] = { from: resolve(pageDir, f), contentType: f.endsWith('.css') ? 'text/css' : 'text/javascript' };
  for (const l of out.split('\n')) {
    if (/^assets\/art\/[^/]+\.(webp|png)$/.test(l)) map[l.slice(11)] = l.slice(11);
    else if (/^assets\/bgm\/[^/]+\.mp3$/.test(l)) map['bgm/' + l.slice(11)] = { from: join(root, l), contentType: 'audio/mpeg' };
  }
  if (!pageDir) console.log('ページのフォルダがない（app.css・app.js が入らない）');
  console.log(JSON.stringify(map));
} else {
  const names = readdirSync(join(root, 'assets/art')).filter(f => /\.(webp|png)$/.test(f)).sort();
  for (let i = 0; i < names.length; i += 250) console.log(JSON.stringify(names.slice(i, i + 250).map(path => ({ path }))));
}
