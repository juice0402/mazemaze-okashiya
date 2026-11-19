// アーティファクトに絵を出すときの files の表を出す（11/19〜 絵はページに埋めこまない）
// node tools/art_files.mjs            … assets/art の絵ぜんぶ（はじめての出しなおし・250ずつ区切る）
// node tools/art_files.mjs <コミット>  … そのコミットから足した・変えた絵だけ（ふだんはこれ。前に出したときのコミットを書く）
// 使い方：Artifact の publish に root "/home/claude/mazemaze-okashiya/assets/art"（clone した場所の assets/art）と、出てきた files の配列をそのまま渡す。
// 出さなかった絵は前のまま残る（消した絵は null で消す）。ページは node tools/build.mjs --artifact <ファイル> で作る
import { readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const since = process.argv[2];
let names;
if (since) {
  const out = execFileSync('git', ['-C', root, 'diff', '--name-only', '--diff-filter=AM', since, '--', 'assets/art'], { encoding: 'utf8' });
  names = out.split('\n').filter(l => /^assets\/art\/[^/]+\.(webp|png)$/.test(l)).map(l => l.slice(11));
} else {
  names = readdirSync(join(root, 'assets/art')).filter(f => /\.(webp|png)$/.test(f)).sort();
}
if (!names.length) console.log('出す絵はない（ページだけ出しなおす）');
for (let i = 0; i < names.length; i += 250) console.log(JSON.stringify(names.slice(i, i + 250).map(path => ({ path }))));
