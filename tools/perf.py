"""軽さの点検（11/21 しょーくん「ゲームもどんどん重くなってきてるから、軽量化と最適化のデバッグ」）
使い方：python3 -I tools/perf.py <出すフォルダ> [--cpu 4] [--only 場面,…]
  - index.html（遊ぶ人の形）を CPU を4倍おそくしたスマホの大きさ（390×844・2倍）で開き、場面ごとに4秒はかって report.json に。まとめを1行ずつ出す
  - boot：開いてからタイトルが出るまでの秒
  - fps（こま数/秒）・worst（いちばん長いこまの間 ms）・long（50ms をこえた仕事の数と合計 ms）
  - anim：動いているアニメの数（infinite のもの）・bad：transform と opacity 以外を動かしているアニメ（スマホが毎こまぬりなおす）
  - dom：要素の数・heap：JS のメモリ（MB）
  - img：画面に出ている絵の数・ほどいた大きさ（MP）・big：出す大きさ（2倍）の3倍より大きい絵（むだにメモリを使う）
  場面：title・kitchen・display・day（営業中）・zakka・night（夜のバトル・くらべる用）
"""
import sys, json, re, pathlib, time
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
args = sys.argv[1:]
CPU = 4
only = None
if '--cpu' in args: k = args.index('--cpu'); CPU = float(args[k + 1]); del args[k:k + 2]
if '--only' in args: k = args.index('--only'); only = set(args[k + 1].split(',')); del args[k:k + 2]
out = pathlib.Path(args[0] if args else '/tmp/perf'); out.mkdir(parents=True, exist_ok=True)

MEASURE = r"""async (ms) => {
  const lt = []; let po = null;
  try { po = new PerformanceObserver(l => { for (const e of l.getEntries()) lt.push(e.duration); }); po.observe({ type: 'longtask' }); } catch (e) {}
  let n = 0, last = performance.now(), worst = 0, run = true; const t0 = last;
  const f = t => { n++; if (n > 1) worst = Math.max(worst, t - last); last = t; if (run) requestAnimationFrame(f); };
  requestAnimationFrame(f);
  await new Promise(r => setTimeout(r, ms)); run = false; if (po) po.disconnect();
  const dur = (performance.now() - t0) / 1000;
  const OK = new Set(['offset', 'easing', 'composite', 'computedOffset', 'transform', 'opacity', 'translate', 'scale', 'rotate']);
  const anims = document.getAnimations().filter(a => a.playState === 'running');
  const inf = anims.filter(a => { try { return a.effect.getTiming().iterations === Infinity; } catch (e) { return false; } });
  const bad = {};
  for (const a of anims) {
    let kf = []; try { kf = a.effect.getKeyframes(); } catch (e) {}
    const props = new Set(); for (const k of kf) for (const p of Object.keys(k)) if (!OK.has(p)) props.add(p);
    if (!props.size) continue;
    const t = a.effect && a.effect.target; const who = (a.animationName || 'js') + ' @' + (t ? (t.className && t.className.baseVal === undefined ? String(t.className) : t.tagName).split(' ').slice(0, 2).join('.') : '?');
    const key = who + ' [' + [...props].join(',') + ']' + (inf.includes(a) ? ' ∞' : '');
    bad[key] = (bad[key] || 0) + 1;
  }
  /* 画面に出ている絵：img と 背景・border-image の url() */
  const urls = new Map();
  const vis = el => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.bottom > 0 && r.right > 0 && r.top < innerHeight && r.left < innerWidth ? r : null; };
  for (const el of document.querySelectorAll('*')) {
    const r = vis(el); if (!r) continue;
    const cs = getComputedStyle(el); if (cs.display === 'none' || cs.visibility === 'hidden') continue;
    const add = (u, w, h) => { if (!u || u.startsWith('data:')) return; const o = urls.get(u) || { w: 0, h: 0 }; o.w = Math.max(o.w, w); o.h = Math.max(o.h, h); urls.set(u, o); };
    if (el.tagName === 'IMG' && el.currentSrc) add(el.currentSrc, r.width, r.height);
    for (const v of [cs.backgroundImage, cs.borderImageSource]) for (const m of (v || '').matchAll(/url\("?([^")]+)"?\)/g)) add(m[1], r.width, r.height);
  }
  const imgs = await Promise.all([...urls].map(([u, s]) => new Promise(res => { const im = new Image(); im.onload = () => res({ u, nw: im.naturalWidth, nh: im.naturalHeight, ...s }); im.onerror = () => res({ u, nw: 0, nh: 0, ...s }); im.src = u; })));
  const name = u => decodeURIComponent(u.split('/').pop().split('?')[0]);
  const mp = imgs.reduce((a, x) => a + x.nw * x.nh, 0) / 1e6;
  const big = imgs.filter(x => x.nw * x.nh > 2e5 && x.nw * x.nh > 3 * (x.w * 2) * (x.h * 2))
    .map(x => ({ n: name(x.u), nat: x.nw + 'x' + x.nh, shown: Math.round(x.w) + 'x' + Math.round(x.h), x: +(x.nw * x.nh / Math.max(1, x.w * x.h * 4)).toFixed(1) }))
    .sort((a, b) => b.x - a.x);
  return { fps: +(n / dur).toFixed(1), worst: Math.round(worst), long: lt.length, longms: Math.round(lt.reduce((a, b) => a + b, 0)),
    anim: inf.length, running: anims.length, bad, dom: document.getElementsByTagName('*').length,
    heap: performance.memory ? +(performance.memory.usedJSHeapSize / 1048576).toFixed(1) : null,
    img: imgs.length, mp: +mp.toFixed(1), big: big.slice(0, 8) };
}"""

KITCHEN = ("talkClose(true); localStorage.clear(); S = newState(); S.day = 6; S.money = 3000; "
           "S.stock = { zeri: 3, hoippu: 2, niji: 1, mugi: 4, hachimitsu: 4, milk: 4, egg: 4, ichigo: 4 }; S.seen.mBaked = 1; "
           "goMorning(); talkClose(true); S.morning.talked = true; render()")
BAKE = ("(() => { if (mBusy) return 'busy'; if (!shelfRoom()) return 'full'; const L = ['mugi', 'hachimitsu', 'milk', 'egg', 'ichigo']; "
        "const a = L[Math.floor(Math.random() * 5)], b = L[Math.floor(Math.random() * 5)]; mixTwo(a, b); return 'ok'; })()")
OPEN = ("mAutoArrange(); const M = mState(); if (!M.kanban) { const s = S.shelf.find(x => x.n > 0) || M.baked[0]; if (s) M.kanban = s.key; } mOpen()")
NIGHT = ("talkClose(true); localStorage.clear(); S = newState(); S.day = 2; S.today = newDay(2); startNight()")
BOARD = ("talkClose(true); N.picks = 0; N.field = 'teppan'; N.heat = 3; N.board = [{ cid: 'm:ichiban', cook: 9 }, { cid: 'o:komugi+bata', cook: 5 }, "
         "{ cid: 's:komugi+komugi|komugi+komugi', cook: 0 }, { cid: 't:maki', cook: 0 }, { cid: 'm:tamago', cook: 0 }]; renderNight(); omotenashi()")

html = (ROOT / 'index.html').read_text()
html = html.replace('<head>', f'<head><base href="file://{ROOT}/">', 1)
i = html.rfind('})();')
tmp = pathlib.Path('/tmp/_okashi_perf.html')
tmp.write_text(html[:i] + "window.__ev = s => eval(s);\n" + html[i:])
rep, errs = {}, []
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox', '--enable-precise-memory-info'])
    ctx = b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, is_mobile=True, has_touch=True)
    page = ctx.new_page()
    page.route(re.compile(r'https?://.*'), lambda r: r.abort())
    page.on('pageerror', lambda e: errs.append(str(e)[:200]))
    cdp = ctx.new_cdp_session(page)
    cdp.send('Emulation.setCPUThrottlingRate', {'rate': CPU})
    ev = lambda code: page.evaluate(f'() => window.__ev({json.dumps("(() => { " + code + "; return 0; })()")})')
    t0 = time.time()
    page.goto('file://' + str(tmp), wait_until='domcontentloaded')
    page.wait_for_function('document.querySelector(".tt-scene")', polling=50, timeout=30000)
    rep['boot'] = round(time.time() - t0, 2)
    def meas(nm, setup=None, wait=1500, ms=4000):
        if only and nm not in only: return
        try:
            if setup: setup()
            page.wait_for_timeout(wait)
            rep[nm] = page.evaluate(MEASURE, ms)
            page.screenshot(path=str(out / f'{nm}.png'))
        except Exception as e: errs.append(f'{nm}: {str(e)[:200]}')
    meas('title', None, 1500)
    meas('kitchen', lambda: ev(KITCHEN))
    def disp():
        ev(KITCHEN)
        for _ in range(4):
            page.evaluate(f'() => window.__ev({json.dumps(BAKE)})'); page.wait_for_timeout(2600)
        ev("S.morning.view = 'display'; render()")
    meas('display', disp)
    def zakka(): ev("S.morning.view = 'zakka'; render()")
    meas('zakka', zakka)
    def day():
        ev("S.morning.view = 'display'; render()"); page.wait_for_timeout(300)
        ev(OPEN); page.wait_for_timeout(1200)
        ev("talkClose(true); openDay()")
    meas('day', day, 2500, 5000)
    def night():
        ev(NIGHT); page.wait_for_timeout(1800); ev(BOARD)
    meas('night', night, 2500)
    b.close()
(out / 'report.json').write_text(json.dumps({'cpu': CPU, 'rep': rep, 'errors': errs}, ensure_ascii=False, indent=1))
print('boot', rep.get('boot'), '秒（CPU', CPU, '倍おそく）')
for k, v in rep.items():
    if k == 'boot': continue
    print(f"{k}: fps {v['fps']} worst {v['worst']}ms long {v['long']}/{v['longms']}ms anim {v['anim']}/{v['running']} bad {len(v['bad'])} dom {v['dom']} heap {v['heap']}MB img {v['img']}/{v['mp']}MP big {len(v['big'])}")
print('errors:', errs or 'なし')
