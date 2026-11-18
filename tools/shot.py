"""見た目の確かめ：index.html をスマホの大きさで開いて、えらんだ場面を撮り、横に並べた1まいにする（トークンの節約：撮るのは1まいだけ）
使い方：python3 -I tools/shot.py <出す PNG> [場面…] [--h 高さ]
  場面：title・prologue・evening・shop・board・battle・panel・end・morning・day・result、または js:<ゲームの中で動かす JS>
  例：python3 -I tools/shot.py /tmp/a.png shop board panel --h 667
ふつうは index.html を作りなおしてから（node tools/build.mjs）。Google Fonts は読まないので、文字は代わりの書体になる
"""
import sys, json, re, io, pathlib
from playwright.sync_api import sync_playwright
from PIL import Image

args = sys.argv[1:]
out = args.pop(0)
H = int(args[args.index('--h') + 1]) if '--h' in args else 844
if '--h' in args: k = args.index('--h'); del args[k:k + 2]
steps = args or ['shop']
ROOT = pathlib.Path(__file__).resolve().parent.parent
BOARD = ("N.picks = 0; N.field = 'teppan'; N.heat = 3; N.board = [{ cid: 'm:ichiban', cook: 9 }, { cid: 'o:komugi+bata', cook: 5 }, "
         "{ cid: 's:komugi+komugi|komugi+komugi', cook: 0 }, { cid: 't:maki', cook: 0 }, { cid: 'm:tamago', cook: 0 }]; "
         "renderNight()")
PANEL = ("const e = { type: 'act', cid: 'm:shime', i: 4, cook: 9, dmg: 3030, base: 180, parts: [['×', 3, '焼き加減'], ['×', 2, '次の主役', [2]]], fin: [2.25], out: [{ k: 'fin', v: 2.25 }] }; "
         "fighting = true; renderNight(); const co = $('callout'); co.innerHTML = actPanel(e, 2000); fitPanel(co); "
         "co.querySelectorAll('.f-chip').forEach(c => c.classList.add('in')); const n = co.querySelector('.bp-dmg'); n.classList.add('in', 'fin'); n.querySelector('b').textContent = fmt(e.dmg)")
PRE = {
    'title': ("S = newState(); S.phase = 'title'; render()", 800),
    'prologue': ("localStorage.clear(); S = newState(); goPrologue()", 1600),
    'evening': ("localStorage.clear(); S = newState(); S.today = newDay(1); startNight()", 2400),
    'shop': ("talkClose(true); localStorage.clear(); S = newState(); S.day = 2; S.today = newDay(2); startNight()", 1800),
    'board': (BOARD, 1500),
    'battle': (BOARD + "; omotenashi()", 5200),
    'panel': (PANEL, 900),
    'end': ("talkClose(true); N.score = Math.round(nightHP(S.day) * 0.7); endNight()", 2200),
    'morning': ("goMorning(); render()", 1000),
    'day': ("goDay(); render()", 1500),
    'result': ("talkClose(true); goResult()", 1400),
}
html = (ROOT / 'index.html').read_text()
i = html.rfind('})();')
tmp = pathlib.Path('/tmp/_okashi_shot.html')
tmp.write_text(html[:i] + "window.__ev = s => eval(s);\n" + html[i:])
shots, errs = [], []
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
    page = b.new_context(viewport={'width': 390, 'height': H}, device_scale_factor=2, is_mobile=True, has_touch=True).new_page()
    page.route(re.compile(r'https?://.*'), lambda r: r.abort())
    page.on('pageerror', lambda e: errs.append(str(e)[:200]))
    page.goto('file://' + str(tmp), wait_until='domcontentloaded')
    page.wait_for_function('typeof window.__ev === "function"', polling=100)
    page.wait_for_timeout(600)
    for st in steps:
        code, wait = (st[3:], 900) if st.startswith('js:') else PRE[st]
        try: page.evaluate(f'() => window.__ev({json.dumps("(() => { " + code + "; return 0; })()")})')
        except Exception as e: errs.append(f'{st}: {str(e)[:200]}')
        page.wait_for_timeout(wait)
        shots.append(Image.open(io.BytesIO(page.screenshot())))
    b.close()
w, h = shots[0].size
c = Image.new('RGB', (w * len(shots), h), 'white')
for k, s in enumerate(shots): c.paste(s, (k * w, 0))
c.resize((c.width // 2, c.height // 2)).save(out)
print(out, 'errors:', errs or 'なし')
