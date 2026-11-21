// アーティファクト（試しのページ）を出しなおすときの files の表を出す（11/19〜 絵と曲はページに埋めこまない・ページは小さな骨で CSS と JS は app.css・app.js）
// node tools/art_files.mjs <コミット> <ページのフォルダ>  … ふだんはこれ。app.css・app.js（ページのフォルダから）と、そのコミットから足した・変えた絵と曲だけ
// node tools/art_files.mjs                           … assets/art の絵ぜんぶ（はじめて出すとき・250ずつ区切る。app.css・app.js・bgm/・se/・koe/ は別に足す）
// 使い方：node tools/build.mjs --artifact <ページのフォルダ>/okashi.html → Artifact の publish に file_path <ページのフォルダ>/okashi.html・
//   root "/home/claude/mazemaze-okashiya/assets/art"（clone した場所の assets/art）・files に出てきた表をそのまま渡す。出さなかった絵は前のまま残る（消した絵は null で消す）
import { readdirSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const [since, pageDir] = process.argv.slice(2);
if (since) {
  const out = execFileSync('git', ['-C', root, 'diff', '--name-only', '--diff-filter=AM', since, '--', 'assets/art', 'assets/bgm', 'assets/se', 'assets/koe'], { encoding: 'utf8' });
  const map = {};
  if (pageDir) for (const f of ['app.css', 'app.js']) map[f] = { from: resolve(pageDir, f), contentType: f.endsWith('.css') ? 'text/css' : 'text/javascript' };
  for (const l of out.split('\n')) {
    if (/^assets\/art\/(ui|fx)-[^/]+\.(webp|png)$/.test(l) && pageDir) map['art-pack.webp'] = { from: resolve(pageDir, 'art-pack.webp'), contentType: 'image/webp' };
    else if (/^assets\/art\/(cust|sweet|deco|fc)-[^/]+\.(webp|png)$/.test(l) && pageDir) map['art-pack2.webp'] = { from: resolve(pageDir, 'art-pack2.webp'), contentType: 'image/webp' };   // 朝昼の絵は2つめのまとめ（11/21・build.mjs の PACK2）   // ui-*・fx-* は1つにまとめた art-pack.webp（11/19）
    else if (/^assets\/art\/[^/]+\.(webp|png)$/.test(l)) map[l.slice(11)] = l.slice(11);
    else if (/^assets\/bgm\/[^/]+\.mp3$/.test(l) && statSync(join(root, l)).size > 400000) map[l.slice(7)] = { from: join(root, l), contentType: 'audio/mpeg' };   // 大きい曲（Lyria・11/21）は bgm/<名前>.mp3 のまま（build.mjs の BIG_BGM と同じ数）
    else if (/^assets\/(bgm|se|koe)\/[^/]+\.mp3$/.test(l) && pageDir) map['snd-pack.mp3'] = { from: resolve(pageDir, 'snd-pack.mp3'), contentType: 'audio/mpeg' };   // 曲・効果音・掛け声は1つにまとめた snd-pack.mp3（11/19・アーティファクトは511ファイルまで）
  }
  /* 曲・効果音・声を足した・変えた・消したら、まとめ snd-pack.mp3 も出しなおす（11/21：小さい曲が大きい曲になる・消すと、まとめの中身と app.js の表が変わる） */
  const snd = execFileSync('git', ['-C', root, 'diff', '--name-only', since, '--', 'assets/bgm', 'assets/se', 'assets/koe'], { encoding: 'utf8' }).trim();
  if (snd && pageDir) map['snd-pack.mp3'] = { from: resolve(pageDir, 'snd-pack.mp3'), contentType: 'audio/mpeg' };
  if (!pageDir) console.log('ページのフォルダがない（app.css・app.js が入らない）');
  console.log(JSON.stringify(map));
} else {
  const names = readdirSync(join(root, 'assets/art')).filter(f => /\.(webp|png)$/.test(f)).sort();
  for (let i = 0; i < names.length; i += 250) console.log(JSON.stringify(names.slice(i, i + 250).map(path => ({ path }))));
}
