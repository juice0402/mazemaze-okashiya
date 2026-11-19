"""見た目の総点検（11/19 しょーくん「全ての枠・ボタン・背景が描き下ろしか」「文字がかぶっていないか・見えなくなっていないか」）

使い方：python3 -I tools/audit_ui.py <出すフォルダ> [高さ…] [--fonts <@fontsource の node_modules>] [--only 場面,…]
  例：python3 -I tools/audit_ui.py /tmp/au 844 600 --fonts /tmp/fonts/node_modules
  - 場面ごとに PNG と、見つけたものを report.json に。まとめを1行ずつ出す
  - css：絵（url）を使わずに CSS で塗った面（色・グラデ・線）。コードのままでよい物（れんさの字・メーターの色・影など）は自分の目で見てはずす
  - clip：字が親の箱（overflow）や画面からはみ出して切れている／ellipsis：「…」で切っている（わざとの所もある）
  - cover：字の上に、ほかの絵や面や字がかぶっている
  - フォントは本番と同じ Dela Gothic One・Zen Maru Gothic を --fonts で読む（npm i @fontsource/dela-gothic-one @fontsource/zen-maru-gothic）。ないと字の幅がちがう
"""
import sys, json, re, pathlib
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
args = sys.argv[1:]
fonts = only = None
if '--fonts' in args: k = args.index('--fonts'); fonts = pathlib.Path(args[k + 1]); del args[k:k + 2]
if '--only' in args: k = args.index('--only'); only = set(args[k + 1].split(',')); del args[k:k + 2]
out = pathlib.Path(args[0]); out.mkdir(parents=True, exist_ok=True)
HS = [int(a) for a in args[1:]] or [844]

TIPS_SEEN = "for (const k of Object.keys(STORY.tips || {})) S.seen['t:' + k] = 1"
FRESH = "talkClose(true); document.querySelectorAll('.talk').forEach(e => e.remove()); localStorage.clear(); S = newState(); "
BOARD = ("N.round = 2; N.coins = 6; N.picks = 0; N.field = 'teppan'; N.heat = 3; N.board = [{ cid: 'm:ichiban', cook: 9 }, { cid: 'o:komugi+bata', cook: 5 }, "
         "{ cid: 's:komugi+komugi|komugi+komugi', cook: 0 }, { cid: 't:maki', cook: 0 }, { cid: 'm:tamago', cook: 0 }]; rollShop(); N.stage = 'shop'; renderNight()")
PANEL = ("const e = { type: 'act', cid: 'm:shime', i: 4, cook: 9, dmg: 3030, base: 180, parts: [['×', 3, '焼き加減'], ['×', 2, '次の主役', [2]]], fin: [2.25], out: [{ k: 'fin', v: 2.25 }] }; "
         "fighting = true; renderNight(); showEvent(e, 3030, 2000)")
NIGHT = lambda day, seen, build: (FRESH + f"S.day = {day}; {seen} S.today = newDay({day}); {TIPS_SEEN}; startNight(); talkClose(true); "
                                  f"if (N.stage === 'pick') {{ pickBuild('{build}'); pickGo(); talkClose(true); }} N.round = 2; N.coins = 6; rollShop(); N.stage = 'shop'; renderNight()")
MATES = "S.seen['mate:minamo'] = 5; S.seen['mate:wakaba'] = 10; S.seen.m9 = 8;"
SCENES = [
    ('title', "S = newState(); S.phase = 'title'; render()", 1000),
    ('prologue', FRESH + "goPrologue()", 1800),
    ('n-arrive', FRESH + "S.today = newDay(1); startNight()", 2400),
    ('n-shop1', "talkClose(true); N.stage = 'shop'; renderNight()", 1400),
    ('n-viewer', "document.querySelectorAll('.tip,.tipdim').forEach(e => e.remove()); N.sel = { where: 'shop', i: 0 }; N.view = true; renderNight()", 900),
    ('n-shop2', FRESH + f"S.day = 2; S.today = newDay(2); {TIPS_SEEN}; startNight(); talkClose(true); " + BOARD, 1500),
    ('n-viewer2', "N.sel = { where: 'board', i: 0 }; N.view = true; renderNight()", 900),
    ('n-battle', "unsel(); N.stage = 'shop'; renderNight(); omotenashi()", 5200),
    ('n-event', PANEL, 1500),
    ('n-round', "fighting = false; finishRound(resolveRound())", 1600),
    ('n-thanks', "talkClose(true); N.score = Math.round(nightHP(S.day) * 0.2); endNight()", 2200),
    ('n-end', "talkClose(true); N.stage = 'end'; renderNight()", 1600),
    ('diary', "talkClose(true); goResult()", 1600),
    ('m-talk', "talkClose(true); nextDay()", 1600),
    ('m-kitchen', "talkClose(true); document.querySelectorAll('.talk').forEach(e => e.remove()); render()", 1000),
    ('m-book', "S.morning.view = 'book'; render()", 1000),
    ('m-zakka', "S.morning.view = 'zakka'; render()", 1000),
    ('m-display', "S.shelf = [{ key: 'mugi+milk', n: 2 }, { key: 'hachimitsu+ichigo', n: 3 }]; S.morning.view = 'display'; render()", 1000),
    ('day', "talkClose(true); goDay(); render()", 1600),
    ('day-cust', "talkClose(true); showCust({ c: 'gakusei', step: 1 }, true)", 1300),
    ('pick', FRESH + "S.day = 20; " + MATES + " S.today = newDay(20); startNight(); talkClose(true)", 1600),
    ('taisaku', NIGHT(6, "S.seen['mate:minamo'] = 5;", 'taisaku'), 1600),
    ('candy', NIGHT(15, "S.seen['mate:minamo'] = 5;", 'candy'), 1600),
    ('kone', NIGHT(20, MATES, 'kone'), 1600),
    ('fruitcake', NIGHT(20, MATES, 'fruitcake'), 1600),
    ('jam', NIGHT(20, MATES, 'jam'), 1600),
]
if only: SCENES = [s for s in SCENES if s[0] in only]

AUDIT = r"""() => {
  const st = document.createElement('style'); st.textContent = '*,*::before,*::after{pointer-events:auto!important}'; document.head.appendChild(st);
  const vw = innerWidth, vh = innerHeight, R = { css: [], clip: [], ellipsis: [], cover: [] };
  const nm = e => { const c = typeof e.className === 'string' ? e.className.trim().split(/\s+/).filter(Boolean).slice(0, 2).join('.') : ''; return (e.id ? '#' + e.id : '') + (c ? '.' + c : '') || e.tagName.toLowerCase(); };
  const path = e => { const a = []; for (let x = e; x && x !== document.body && a.length < 3; x = x.parentElement) a.unshift(nm(x)); return a.join(' > '); };
  const shown = e => { for (let x = e; x && x.nodeType === 1; x = x.parentElement) { const c = getComputedStyle(x); if (c.display === 'none' || c.visibility === 'hidden' || +c.opacity < .05) return false; } return true; };
  const alpha = c => { const v = (c.match(/[\d.]+/g) || []).map(Number); return v.length === 3 ? 1 : v.length === 4 ? v[3] : 0; };
  const own = e => [...e.childNodes].filter(n => n.nodeType === 3 && n.textContent.trim()).map(n => n.textContent.trim()).join('').slice(0, 16);
  const surf = (cs) => {   // CSS で塗った面か（絵を使っていない）
    if (/url\(/.test(cs.backgroundImage) || /url\(/.test(cs.borderImageSource) || /url\(/.test(cs.maskImage || '') || /url\(/.test(cs.webkitMaskImage || '')) return '';
    const why = [];
    if (alpha(cs.backgroundColor) > .25) why.push('色 ' + cs.backgroundColor);
    if (/gradient/.test(cs.backgroundImage)) why.push('グラデ');
    const bw = ['Top', 'Right', 'Bottom', 'Left'].filter(s => parseFloat(cs['border' + s + 'Width']) > .5 && cs['border' + s + 'Style'] !== 'none' && alpha(cs['border' + s + 'Color']) > .25);
    if (bw.length >= 2) why.push('線');
    if (cs.boxShadow !== 'none' && /\d+px \d+px \d+px [1-9]|0px 0px 0px [1-9]/.test(cs.boxShadow)) why.push('ふちの影');
    return why.join('・');
  };
  for (const e of document.body.querySelectorAll('*')) {
    if (/^(SCRIPT|STYLE|IMG|BR|svg|path|LINK|META)$/i.test(e.tagName) || !shown(e)) continue;
    const r = e.getBoundingClientRect();
    if (r.width < 1 || r.height < 1 || r.right < 0 || r.bottom < 0 || r.left > vw || r.top > vh) continue;
    const cs = getComputedStyle(e);
    if (r.width >= 14 && r.height >= 10) { const w = surf(cs); if (w) R.css.push({ at: path(e), size: Math.round(r.width) + '×' + Math.round(r.height), txt: own(e), why: w }); }
    for (const p of ['::before', '::after']) {
      const ps = getComputedStyle(e, p); if (ps.content === 'none' || ps.content === 'normal' || ps.display === 'none') continue;
      const w = parseFloat(ps.width) || 0, h = parseFloat(ps.height) || 0; if (w && w < 14 || h && h < 10) continue;
      const why = surf(ps); if (why) R.css.push({ at: path(e) + p, size: (Math.round(w) || '?') + '×' + (Math.round(h) || '?'), txt: ps.content.replace(/^"|"$/g, '').slice(0, 10), why });
    }
  }
  const paints = (x) => {
    if (x.tagName === 'IMG' || x.tagName === 'CANVAS' || x.tagName.toLowerCase() === 'svg') return 'img';
    const c = getComputedStyle(x);
    if (/url\(/.test(c.backgroundImage) || /url\(/.test(c.borderImageSource)) return 'art';
    if (alpha(c.backgroundColor) > .7) return 'color';
    if (/gradient/.test(c.backgroundImage)) return 'grad';
    if (own(x)) return 'text';
    return '';
  };
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n; (n = walker.nextNode());) {
    const t = n.textContent.trim(), e = n.parentElement; if (!t || !e || /^(SCRIPT|STYLE)$/.test(e.tagName) || !shown(e)) continue;
    const rg = document.createRange(); rg.selectNodeContents(n);
    const rects = [...rg.getClientRects()].filter(q => q.width > 1 && q.height > 1); if (!rects.length) continue;
    const u = rects.reduce((a, q) => ({ l: Math.min(a.l, q.left), t: Math.min(a.t, q.top), r: Math.max(a.r, q.right), b: Math.max(a.b, q.bottom) }), { l: 1e9, t: 1e9, r: -1e9, b: -1e9 });
    if (u.r < 0 || u.b < 0 || u.l > vw || u.t > vh) continue;
    const at = path(e), txt = t.slice(0, 16), cs = getComputedStyle(e);
    if (cs.textOverflow === 'ellipsis' && e.scrollWidth > e.clientWidth + 1 || (cs.webkitLineClamp && cs.webkitLineClamp !== 'none' && e.scrollHeight > e.clientHeight + 1)) R.ellipsis.push({ at, txt });
    const off = Math.max(-u.l, -u.t, u.r - vw, u.b - vh);
    if (off > 1.5) R.clip.push({ at, txt, by: '画面', px: Math.round(off) });
    else for (let x = e; x && x !== document.documentElement; x = x.parentElement) {
      const c = getComputedStyle(x); if (c.overflowX === 'visible' && c.overflowY === 'visible' && c.overflow !== 'clip') continue;
      const b = x.getBoundingClientRect(), dh = Math.max(b.left - u.l, u.r - b.right), dv = Math.max(b.top - u.t, u.b - b.bottom);
      // 横は1.5px から。たては字の箱（行の高さより大きい）がはみ出すだけのことが多いので 4px から
      if ((dh > 1.5 || dv > 4) && !(cs.textOverflow === 'ellipsis' && x === e)) { R.clip.push({ at, txt, by: nm(x), px: Math.round(dh > 1.5 ? dh : dv), dir: dh > 1.5 ? '横' : 'たて' }); break; }
    }
    const hits = new Map();
    for (const q of rects) for (const fx of [.12, .5, .88]) {
      const px = q.left + q.width * fx, py = q.top + q.height / 2; if (px < 0 || py < 0 || px > vw || py > vh) continue;
      for (const el of document.elementsFromPoint(px, py)) {
        if (el === e || e.contains(el) || el.contains(e)) break;
        if (!shown(el)) continue;
        const k = paints(el); if (!k) continue;
        if (k === 'text') { const rr = document.createRange(); let hit = false; for (const tn of el.childNodes) if (tn.nodeType === 3 && tn.textContent.trim()) { rr.selectNodeContents(tn); for (const z of rr.getClientRects()) if (px >= z.left && px <= z.right && py >= z.top && py <= z.bottom) hit = true; } if (!hit) continue; }
        hits.set(path(el), k); break;
      }
    }
    for (const [by, k] of hits) R.cover.push({ at, txt, by, k });
  }
  st.remove();
  return R;
}"""

report, errs = {}, []
html = (ROOT / 'index.html').read_text()
head = f'<head><base href="file://{ROOT}/">'
if fonts:
    for css in ['@fontsource/dela-gothic-one/400.css', '@fontsource/zen-maru-gothic/500.css', '@fontsource/zen-maru-gothic/700.css']:
        head += f'<link rel="stylesheet" href="file://{fonts / css}">'
html = html.replace('<head>', head, 1)
i = html.rfind('})();')
tmp = pathlib.Path('/tmp/_okashi_audit.html')
tmp.write_text(html[:i] + "window.__ev = s => eval(s);\n" + html[i:])
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox', '--allow-file-access-from-files'])
    for H in HS:
        page = b.new_context(viewport={'width': 390, 'height': H}, device_scale_factor=1, is_mobile=True, has_touch=True).new_page()
        page.route(re.compile(r'https?://.*'), lambda r: r.abort())
        page.on('pageerror', lambda e, H=H: errs.append(f'{H}: {str(e)[:160]}'))
        page.goto('file://' + str(tmp), wait_until='domcontentloaded')
        page.wait_for_function('typeof window.__ev === "function"', polling=100)
        page.evaluate('document.fonts.ready'); page.wait_for_timeout(800)
        for name, code, wait in SCENES:
            try: page.evaluate(f'() => window.__ev({json.dumps("(() => { " + code + "; return 0; })()")})')
            except Exception as e: errs.append(f'{H} {name}: {str(e)[:160]}')
            page.wait_for_timeout(wait)
            key = f'{H}-{name}'
            page.screenshot(path=str(out / f'{key}.png'))
            try: report[key] = page.evaluate(AUDIT)
            except Exception as e: errs.append(f'{key} audit: {str(e)[:160]}')
        page.context.close()
    b.close()
(out / 'report.json').write_text(json.dumps(report, ensure_ascii=False, indent=1))
for k, R in report.items():
    print(k, ' '.join(f'{t}:{len(R[t])}' for t in ('css', 'clip', 'ellipsis', 'cover')))
print('errors:', errs or 'なし')
