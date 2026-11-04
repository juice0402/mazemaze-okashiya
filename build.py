import sys, pathlib
src = pathlib.Path('src/game.html').read_text(encoding='utf-8')
cut = src.index('<div id="app">')
head, body = src[:cut].strip(), src[cut:].strip()
page = f'''<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="description" content="棚にお菓子を並べて値段を決めると、お客さんが好みで買っていくドット絵のお店ゲーム。">
<meta name="theme-color" content="#2b1a12">
<style>:root{{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}}[hidden]{{display:none!important}}</style>
{head}
</head>
<body>
{body}
</body>
</html>
'''
pathlib.Path('index.html').write_text(page, encoding='utf-8')
print('index.html', len(page))
