"""ボタンの点検（11/18・UI の絵を取りこんだら毎回）：python3 -I tools/audit.py [高さ]。画面ごとに、見えているボタンの面の絵・字の色（面とのコントラスト）・高さ・となりとのすき間を出す"""
import sys, json, re, pathlib
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
FACE = {  # 面のだいたいの色（字とのコントラストを見る）
    'ui-btn-red': (214, 58, 48), 'ui-btn-wood': (160, 96, 52), 'ui-pill-cream': (248, 226, 186),
    'ui-pill-choco': (112, 52, 28), 'ui-tab-on': (214, 82, 78), 'ui-tab-off': (226, 196, 150), 'ui-round': (248, 226, 186),
}
JS_COLLECT = r"""() => {
  const out = [];
  for (const b of document.querySelectorAll('button')) {
    const r = b.getBoundingClientRect(); if (r.width < 2 || r.height < 2) continue;
    const cs = getComputedStyle(b); if (cs.visibility === 'hidden' || cs.display === 'none') continue;
    let op = 1; for (let e = b; e; e = e.parentElement) op *= +getComputedStyle(e).opacity;
    if (op < 0.05) continue;
    const src = (cs.borderImageSource + ' ' + cs.backgroundImage);
    out.push({ cls: b.className, txt: b.textContent.trim().slice(0, 14), x: r.x, y: r.y, w: r.width, h: r.height,
      color: cs.color, stroke: cs.webkitTextStrokeColor, strokeW: cs.webkitTextStrokeWidth, fs: cs.fontSize,
      img: src.includes('blob:') || src.includes('data:') ? b.className : '', bis: cs.borderImageSource.slice(0, 40), parent: b.parentElement.className, dis: b.disabled });
  }
  return out;
}"""

def rgb(s):
    m = re.findall(r'[\d.]+', s); return tuple(float(v) for v in m[:3]) if m else (0, 0, 0)

def lum(c):
    def f(v):
        v /= 255; return v / 12.92 if v <= 0.03928 else ((v + 0.055) / 1.055) ** 2.4
    r, g, b = c; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)

def contrast(a, b):
    la, lb = sorted([lum(a), lum(b)], reverse=True); return (la + 0.05) / (lb + 0.05)

def face_of(cls, bis):
    c = ' ' + cls + ' '
    if ' round ' in c: return 'ui-round'
    if ' tab ' in c: return 'ui-tab-on' if ' on ' in c else 'ui-tab-off'
    if ' pill ' in c:
        if ' go2 ' in c: return 'ui-btn-red'
        if ' sub ' in c: return 'ui-btn-red' if ' on ' in c else 'ui-pill-choco'
        if ' on ' in c: return 'ui-pill-choco'
        return 'ui-pill-cream'
    if ' big ' in c or ' bake ' in c or ' go2 ' in c: return 'ui-btn-red'
    if ' sub ' in c: return 'ui-btn-wood'
    return None

STEPS = [
    ('title', "localStorage.clear(); S = newState(); S.phase = 'title'; render()", 700),
    ('title-saved', "S = newState(); S.phase = 'morning'; S.day = 3; save(); S.phase = 'title'; render()", 700),
    ('prologue', "localStorage.clear(); S = newState(); goPrologue()", 1500),
    ('shop1', "talkClose(true); localStorage.clear(); S = newState(); S.day = 2; S.today = newDay(2); startNight()", 1800),
    ('shop2', "talkClose(true); N.picks = 0; N.coins = 6; renderNight()", 800),
    ('viewer', "tapCard('shop', 0)", 600),
    ('battle', "N.view = null; N.board = [{ cid: 'm:ichiban', cook: 3 }, null, null, null, null]; renderNight(); omotenashi()", 2600),
    ('morning', "talkClose(true); fighting = false; goMorning(); render()", 1200),
    ('m-shop', "talkClose(true); document.querySelector('[data-act=\"m-shop\"][data-o=\"1\"]')?.click()", 700),
    ('m-goods', "document.querySelector('[data-act=\"m-tab\"][data-t=\"goods\"]')?.click()", 600),
    ('day-pre', "talkClose(true); goDay(); render()", 1200),
    ('result', "talkClose(true); S.today = S.today || newDay(S.day); goResult()", 1400),
]

H = int(sys.argv[1]) if len(sys.argv) > 1 else 760
html = (ROOT / 'index.html').read_text()
i = html.rfind('})();')
tmp = pathlib.Path('/tmp/_okashi_audit.html')
tmp.write_text(html[:i] + "window.__ev = s => eval(s);\n" + html[i:])
errs = []
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
    page = b.new_context(viewport={'width': 390, 'height': H}, device_scale_factor=1, is_mobile=True, has_touch=True).new_page()
    page.route(re.compile(r'https?://.*'), lambda r: r.abort())
    page.on('pageerror', lambda e: errs.append(str(e)[:160]))
    page.goto('file://' + str(tmp), wait_until='domcontentloaded')
    page.wait_for_function('typeof window.__ev === "function"', polling=100)
    page.wait_for_timeout(600)
    for name, code, wait in STEPS:
        try: page.evaluate(f'() => window.__ev({json.dumps("(() => { " + code + "; return 0; })()")})')
        except Exception as e: errs.append(f'{name}: {str(e)[:160]}')
        page.wait_for_timeout(wait)
        bs = page.evaluate(JS_COLLECT)
        print(f'== {name}')
        for x in bs:
            f = face_of(x['cls'], x['bis'])
            cr = contrast(rgb(x['color']), FACE[f]) if f else None
            flag = ' <<字が読みにくい' if cr is not None and cr < 3 else ''
            print(f"  [{x['cls'][:26]:26}] {x['txt']:14} h={x['h']:.0f} w={x['w']:.0f} y={x['y']:.0f} x={x['x']:.0f} fs={x['fs']} face={f} 字={x['color']} c={cr and round(cr,1)}{flag}{' disabled' if x['dis'] else ''}")
        # 同じ行（縦が重なる）でとなりあうボタンの高さとすき間
        bs2 = sorted(bs, key=lambda q: (round(q['y'] + q['h'] / 2), q['x']))
        for a in bs2:
            for c in bs2:
                if c is a or c['x'] <= a['x']: continue
                if abs((a['y'] + a['h'] / 2) - (c['y'] + c['h'] / 2)) < max(a['h'], c['h']) / 2 and c['x'] - (a['x'] + a['w']) < 60:
                    gap = c['x'] - (a['x'] + a['w'])
                    if gap >= -1:
                        print(f"    行：{a['txt'][:8]}(h{a['h']:.0f}) ↔ {c['txt'][:8]}(h{c['h']:.0f}) すき間 {gap:.0f}px 高さの差 {abs(a['h']-c['h']):.0f}px 中心の差 {abs((a['y']+a['h']/2)-(c['y']+c['h']/2)):.0f}px")
                    break
    b.close()
print('errors:', errs or 'なし')
