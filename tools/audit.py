"""ボタンとパネルの点検（11/18・UI の絵を取りこんだら毎回）：python3 -I tools/audit.py [高さ]。画面ごとに、見えているボタンの面の絵・字の色（面とのコントラスト。使えないボタンは -off の面）・高さ・となりとのすき間と、クリーム色の紙のパネルの中の字のコントラストを出す"""
import sys, json, re, pathlib
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
FACE = {  # 面のだいたいの色（字とのコントラストを見る）
    'ui-btn-red': (214, 58, 48), 'ui-btn-wood': (160, 96, 52), 'ui-pill-cream': (248, 226, 186),
    'ui-pill-choco': (112, 52, 28), 'ui-tab-on': (214, 82, 78), 'ui-tab-off': (226, 196, 150), 'ui-round': (248, 226, 186),
    # 使えない形（ui-buttons2 の2段目・面のまんなかの平均）
    'ui-btn-red-off': (181, 148, 134), 'ui-btn-wood-off': (169, 139, 122), 'ui-pill-cream-off': (214, 185, 165), 'ui-pill-choco-off': (160, 131, 117),
    'ui-tab-on-off': (175, 142, 126), 'ui-tab-off-off': (200, 168, 147), 'ui-round-off': (214, 184, 165),
}
PAPER = (253, 229, 191)   # ui-panel・ui-window・ui-diary のまんなか（クリーム色の紙）
PANELS = '.vbox.result, .panel.end, .cinfo, .tk-win, .diary'
JS_TEXT = r"""(sel) => {
  const out = [];
  for (const box of document.querySelectorAll(sel)) {
    if (box.getBoundingClientRect().width < 2) continue;
    for (const e of box.querySelectorAll('*')) {
      if (e.closest('button') || ![...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())) continue;
      const cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity < .05) continue;
      const bg = cs.backgroundColor.match(/[\d.]+/g) || [];
      if (cs.backgroundImage !== 'none' || cs.borderImageSource !== 'none' || (bg.length === 4 ? +bg[3] > 0 : bg.length === 3)) continue;   // 自分の地の色や絵がある札（名前の札・コインの札など）は飛ばす
      out.push({ box: box.className.split(' ').slice(0, 2).join('.'), tag: e.tagName.toLowerCase() + (e.className ? '.' + String(e.className).split(' ')[0] : ''), txt: e.textContent.trim().slice(0, 12), color: cs.color, stroke: parseFloat(cs.webkitTextStrokeWidth) || 0 });
    }
  }
  return out;
}"""
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
    ('round-end', "fighting = false; N.view = null; N.stage = 'roundEnd'; N.last = { round: 3, total: 12345, q: 9000, ok: true }; renderNight()", 900),
    ('night-end', "N.score = Math.round(nightHP(S.day) * 0.7); endNight()", 2400),
    ('talk', "talkClose(true); talk(['ほのか【yaruki】：いらっしゃいませ！'], () => {})", 900),
    ('morning', "talkClose(true); fighting = false; goMorning(); render()", 1200),
    ('m-shop', "talkClose(true); document.querySelector('[data-act=\"m-zakka\"]')?.click()", 700),   # 11/18 H-019：雑貨屋はグッズだけの別の画面
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
            if f and x['dis']: f += '-off'
            cr = contrast(rgb(x['color']), FACE[f]) if f else None
            flag = ' <<字が読みにくい' if cr is not None and cr < 3 else ''
            print(f"  [{x['cls'][:26]:26}] {x['txt']:14} h={x['h']:.0f} w={x['w']:.0f} y={x['y']:.0f} x={x['x']:.0f} fs={x['fs']} face={f} 字={x['color']} c={cr and round(cr,1)}{flag}{' disabled' if x['dis'] else ''}")
        for t in page.evaluate(JS_TEXT, PANELS):
            cr = contrast(rgb(t['color']), PAPER)
            if t['stroke'] >= 2: continue   # ふちどりのある大きな字（見出し・大きな数字）は飛ばす
            print(f"  ［紙の上の字］{t['box']:14} {t['tag']:14} {t['txt']:12} 字={t['color']} c={cr:.1f}{' <<字が読みにくい' if cr < 3 else ''}")
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
