"""おくれて出る絵と音の点検（11/23 夜 総デバッグ・しょーくん「ロードとか、読み込み関連や表示スピードに関する総合的なデバッグ」）。
回線をしぼって（帯域をみんなで分けあう＋往復の待ち）、タイトル → 朝 → 昼 → 切りかえ → 夜市 → 来店 → えらぶ → バトル（本物）→ お礼 → まとめ → 次の朝 を何日か通す。
使い方：python3 -I tools/late.py . <出すフォルダ> [artifact|index] [日数=3] [Mbps=6] [rtt_ms=200]
  artifact＝build.mjs --artifact のフォルダ（環境変数 A=<フォルダ>）をためしのページの形で／index＝index.html を工房の形（http・絵は1まいずつ）で
見るもの（<出すフォルダ>/late-<形>.json と標準出力のまとめ）：
  - 絵：画面に見えたとき まだ届いていなかった（届くのが見えてから 40ms より後）・見えてから読みに行った（先読みされていない）。場面ごと
  - 404（まとめの中の絵を 1まいのファイルとして読みに行った など）
  - 効果音・声：鳴らすときに まだ読みこんでいなかった（鳴るまでの おくれ ms）／曲：画面が変わってから鳴りはじめるまで
  - 2日目の来店（幕）と 2日目のラウンド2で 読みなおして「つづきから」
"""
import sys, os, json, re, time, pathlib, mimetypes, asyncio, collections
from playwright.async_api import async_playwright

ROOT = pathlib.Path(sys.argv[1]).resolve()
OUT = pathlib.Path(sys.argv[2]); OUT.mkdir(parents=True, exist_ok=True)
MODE = sys.argv[3] if len(sys.argv) > 3 else 'artifact'
DAYS = int(sys.argv[4]) if len(sys.argv) > 4 else 3
MB = float(sys.argv[5]) if len(sys.argv) > 5 else 6
RTT = float(sys.argv[6]) / 1000 if len(sys.argv) > 6 else 0.2
A = pathlib.Path(os.environ.get('A', '/tmp/claude-0/art')).resolve()
SEED = 1
HOOK = f"window.__ev = s => eval(s); Math.random = (() => {{ let s = {SEED} * 2654435761 >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }})();\n"

PROBE = r"""
try { performance.setResourceTimingBufferSize(50000); } catch (e) {}
window.__late = { shown: {}, img: {} };
const urlsOf = v => { const out = []; if (!v || v === 'none') return out; const re = /url\("?([^")]+)"?\)/g; let m; while ((m = re.exec(v))) out.push(m[1]); return out; };
window.__sceneOf = () => { try { return window.__ev("S.phase + (S.phase === 'night' && S.night ? '/' + S.night.stage : '') + (typeof fighting !== 'undefined' && fighting ? '/fight' : '') + (talking() ? '/talk' : '') + (document.querySelector('.dsw') ? '/dsw' : '') + (S.phase === 'morning' && S.morning ? '/' + S.morning.view : '')"); } catch (e) { return 'boot'; } };
setInterval(() => {
  const now = performance.now(), vh = innerHeight, vw = innerWidth; let sc = null;
  const seen = (u, el) => {
    if (!u || u.startsWith('data:') || window.__late.shown[u]) return;
    sc = sc || window.__sceneOf();
    window.__late.shown[u] = { t: Math.round(now), sc, done: el ? (el.complete && el.naturalWidth > 0) : null, cls: el ? '' : '' };
  };
  for (const el of document.querySelectorAll('body *')) {
    const r = el.getBoundingClientRect(); if (r.width < 2 || r.height < 2 || r.bottom < 0 || r.right < 0 || r.top > vh || r.left > vw) continue;
    const cs = getComputedStyle(el); if (cs.visibility === 'hidden' || cs.display === 'none' || +cs.opacity === 0) continue;
    if (el.tagName === 'IMG' && el.currentSrc) seen(el.currentSrc, el);
    for (const u of urlsOf(cs.backgroundImage)) seen(u);
    for (const u of urlsOf(cs.borderImageSource)) seen(u);
    for (const ps of ['::before', '::after']) { const p = getComputedStyle(el, ps); if (p.content && p.content !== 'none') { for (const u of urlsOf(p.backgroundImage)) seen(u); for (const u of urlsOf(p.borderImageSource)) seen(u); } }
  }
}, 120);
"""
SND = r"""(() => {
  if (window.__sndOn) return 'on'; window.__sndOn = 1; window.__snd = [];
  const ok = new Set(), sc = () => window.__sceneOf();
  const L = seLoad; seLoad = function (d, n) { const p = L(d, n); p.then(() => ok.add(d + '/' + n), () => {}); return p; };
  const wrap = (dir, f) => function (name, o) {
    const k = dir + '/' + name, ready = ok.has(k), t = performance.now(), had = !!seA.buf[k];
    const r = f(name, o);
    if (!ready && seA.buf[k]) seA.buf[k].then(() => window.__snd.push([dir, name, sc(), Math.round(performance.now() - t), had ? 'loading' : 'cold']), () => window.__snd.push([dir, name, sc(), 'fail']));
    return r;
  };
  sePlay = wrap('se', sePlay); koePlay = wrap('koe', koePlay);
  const chk = u => { if (!u) return 'none'; if (String(u).startsWith('blob:')) return 'ok'; return performance.getEntriesByName(new URL(u, location.href).href).length ? 'ok' : 'まだ'; };
  const CO = curtainOpen; curtainOpen = function (done) {   // 幕が開くとき、うしろ（背景・シェフの構え・曲）が そろっていたか
    try { let h = null; try { h = heroPick('battle'); } catch (e) {} const nm = bgmNight((N && N.build) || S.build);
      window.__snd.push(['curtain', 'open', sc(), '背景 ' + chk(NBG()), '構え ' + chk(h && h.src), '曲 ' + (bgm.buf[nm] ? 'ok' : bgm.raw[nm] ? '読みこみ中か済' : 'まだ')]); } catch (e) {}
    return CO(done); };
  const want = {}; const BL = bgmLoad; bgmLoad = function (name, done) { if (!want[name]) want[name] = [performance.now(), sc()]; return BL(name, done); };
  const BS = bgmStart; bgmStart = function (name, b) { if (bgm.want === name && bgm.cur !== name && want[name]) { window.__snd.push(['bgm', name, want[name][1], Math.round(performance.now() - want[name][0])]); delete want[name]; } return BS(name, b); };
  return 'ok';
})()"""
ST = r"""({ phase: S.phase, day: S.day, money: S.money, talk: talking(), busy: typeof busy !== 'undefined' && busy, fighting: typeof fighting !== 'undefined' && fighting,
  stage: S.night && S.phase === 'night' ? S.night.stage : null, round: S.night ? S.night.round : 0, open: openBuilds(), mBusy: typeof mBusy !== 'undefined' && mBusy,
  run: S.dayRun ? { open: S.dayRun.open, done: S.dayRun.done } : null, cur: typeof curtainBusy === 'function' && curtainBusy() })"""
BAKE = r"""(() => { if (mBusy) return 'busy'; if (!shelfRoom()) return 'full';
  const mon = Object.keys(S.stock).filter(m => isMonMat(m) && S.stock[m] > 0), basic = shopMats();
  const r = L => L[Math.floor(Math.random() * L.length)];
  const a = mon[0] || r(basic), b = mon[1] || r(basic), c = mCost([a, b]);
  if (c == null || c > S.money) return 'poor';
  mixTwo(a, b); return 'bake:' + a + '+' + b; })()"""
OPEN = r"""(() => { mAutoArrange(); const M = mState(); if (!M.kanban) { const s = S.shelf.find(x => x.n > 0) || M.baked[0]; if (s) M.kanban = s.key; } mOpen(); return S.phase; })()"""
BUY = r"""(() => { if (N.stage !== 'shop' || busy) return 'wait';
  for (let g = 0; g < 12; g++) { let did = false;
    for (let i = 0; i < N.shop.length; i++) {
      if (!N.shop[i] || N.board.every(Boolean) && !cardDef(N.shop[i]).field) continue;
      const k = JSON.stringify([N.board, N.coins, N.picks, N.field]); buy(i);
      if (JSON.stringify([N.board, N.coins, N.picks, N.field]) !== k) did = true;
    } if (!did) break; }
  return 'ok'; })()"""

rep = {'mode': MODE, 'net': f'{MB}Mbps rtt{int(RTT*1000)}ms', 'errors': [], 'issues': [], 'http_err': [], 'late_img': [], 'cold_img': [], 'snd': [], 'bgm': [], 'curtain': []}

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])
        ctx = await b.new_context(viewport={'width': 390, 'height': 674}, device_scale_factor=1, is_mobile=True, has_touch=True)
        BW = MB * 1e6 / 8; active = []
        async def link():
            last = time.time()
            while True:
                await asyncio.sleep(0.01); now = time.time(); dt = now - last; last = now
                ready = [x for x in active if now >= x['start']]
                if ready:
                    share = BW * dt / len(ready)
                    for x in ready: x['left'] -= share
                for x in [x for x in active if x['left'] <= 0]:
                    active.remove(x); x['fut'].set_result(True)
        lt = asyncio.create_task(link())
        async def handle(route):
            url = route.request.url
            if 'x.test' not in url: return await route.abort()
            u = url.split('://x.test/')[-1].split('?')[0]
            if MODE == 'index': f = ROOT / 'index.html' if u == '' else ROOT / u
            else: f = A / 'okashi.html' if u == '' else (A / u if (A / u).exists() else (ROOT / 'assets' / 'art' / u if (ROOT / 'assets' / 'art' / u).exists() else ROOT / 'assets' / u))
            if not f.exists() or not f.is_file():
                await asyncio.sleep(RTT); return await route.fulfill(status=404, body='')
            body = f.read_bytes()
            fut = asyncio.get_event_loop().create_future(); active.append({'left': len(body), 'start': time.time() + RTT / 2, 'fut': fut}); await fut
            await asyncio.sleep(RTT / 2)
            ct = mimetypes.guess_type(str(f))[0] or 'application/octet-stream'
            if MODE == 'artifact' and u == '':
                body = b'<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1"></head><body>' + body + b'</body></html>'; ct = 'text/html'
            if (MODE == 'artifact' and u == 'app.js') or (MODE == 'index' and u == ''):
                t = body.decode(); i = t.rfind('})();'); body = (t[:i] + HOOK + t[i:]).encode()
                if MODE == 'index': ct = 'text/html'
            await route.fulfill(status=200, body=body, headers={'content-type': ct})
        await ctx.route('**/*', handle)
        page = await ctx.new_page(); await page.add_init_script(PROBE)
        page.on('pageerror', lambda e: rep['errors'].append(str(e)[:300]))
        page.on('response', lambda r: r.status >= 400 and 'x.test' in r.url and rep['http_err'].append([r.status, r.url.split('x.test/')[-1][:80]]))
        async def ev(code): return await page.evaluate(f'() => window.__ev({json.dumps(code)})')
        async def click(sel):
            el = await page.query_selector(sel)
            try:
                if el and await el.is_visible(): await el.click(force=True, timeout=2000); return True
            except Exception: return False
            return False
        async def boot():
            await page.goto('http://x.test/', wait_until='domcontentloaded')
            await page.wait_for_function('typeof window.__ev === "function" && !!document.querySelector("[data-act]")', polling=100, timeout=30000)
        async def harvest(tag):   # 読みなおしの前に 集める（ページがかわると消える）
            d = await page.evaluate("""() => { const sh = window.__late ? window.__late.shown : {};
              const rt = {}; for (const e of performance.getEntriesByType('resource')) if (!rt[e.name]) rt[e.name] = [Math.round(e.startTime), Math.round(e.responseEnd), e.responseStatus || 0];
              let art = {}; try { art = window.__ev('(() => { const o = {}; for (const [k, v] of Object.entries(ART)) o[v] = k; for (const T of [typeof SE_SRC !== "undefined" ? SE_SRC : {}, typeof KOE_SRC !== "undefined" ? KOE_SRC : {}, typeof BGM_SRC !== "undefined" ? BGM_SRC : {}]) for (const [k, v] of Object.entries(T)) o[v] = "snd:" + k; return o; })()'); } catch (e) {}
              return { sh, rt, art, snd: window.__snd || [] }; }""")
            for u, s in d['sh'].items():
                key = d['art'].get(u) or d['art'].get(u.split('x.test/')[-1]) or re.sub(r'^.*/', '', u.split('?')[0])
                if u.startswith('blob:'): continue
                r = d['rt'].get(u)
                if not r: continue
                st, end, code = r
                if code >= 400: rep['issues'].append(f'{tag} 404 の絵が見えた {key} @ {s["sc"]}'); continue
                gap = end - s['t']
                if gap > 40: rep['late_img'].append({'k': key, 'sc': s['sc'], 'late_ms': gap, 'req_after_show': st >= s['t'] - 150, 'run': tag})
                elif st >= s['t'] - 150: rep['cold_img'].append({'k': key, 'sc': s['sc'], 'run': tag})
            for x in d['snd']:
                (rep['bgm'] if x[0] == 'bgm' else rep['curtain'] if x[0] == 'curtain' else rep['snd']).append(x + [tag])
        async def snd(): return await ev(SND)

        await boot(); await ev('(localStorage.clear(), 0)'); await boot(); await snd()
        t_title = await page.evaluate('performance.now()')
        await page.wait_for_timeout(2500)
        if not await click('[data-act=start]'): await click('[data-act=continue]')
        run, t0, last_sig, last_change = 1, time.time(), '', time.time()
        reloaded = set(); spd_on = False
        while True:
            try: st = await ev(ST)
            except Exception as e: await page.wait_for_timeout(300); continue
            sig = json.dumps([st['phase'], st['day'], st['stage'], st['round'], st['talk'], st['fighting'], st['run']])
            if sig != last_sig: last_sig, last_change = sig, time.time()
            elif time.time() - last_change > 30:
                rep['issues'].append('止まり ' + sig[:200]); await page.screenshot(path=str(OUT / f'late-stuck-{MODE}.png')); break
            if time.time() - t0 > 60 * 25: rep['issues'].append('時間切れ'); break
            if st['talk'] and st['phase'] == 'night' and st['stage'] == 'arrive' and st['day'] == 2 and ('arrive', 2) not in reloaded:   # 来店の会話のとちゅうで 読みなおす（幕）
                reloaded.add(('arrive', 2)); await page.wait_for_timeout(800); await harvest(f'run{run}'); run += 1; await boot(); await snd(); await page.wait_for_timeout(300); await click('[data-act=continue]'); await page.wait_for_timeout(1500); continue
            if st['talk']:
                await page.wait_for_timeout(700)   # 会話の絵が見えるように少し待つ
                if not await click('.talk .tk-skip'): await page.mouse.click(195, 600)
                await page.wait_for_timeout(300); continue
            ph = st['phase']
            if ph == 'title': await click('[data-act=start]') or await click('[data-act=continue]')
            elif ph == 'prologue': pass
            elif ph == 'morning':
                if st['mBusy']: await page.wait_for_timeout(300); continue
                r = await ev(BAKE)
                if r.startswith('bake'): await page.wait_for_timeout(300); continue
                await ev("S.morning.view = 'zakka'; render()"); await page.wait_for_timeout(900)
                await ev("S.morning.view = 'display'; render()"); await page.wait_for_timeout(900)
                await ev(OPEN); await page.wait_for_timeout(600)
            elif ph == 'day':
                rn = st['run'] or {}
                if not rn.get('open') and not rn.get('done'):
                    if not await click('[data-act=d-open]'):
                        if not await click('[data-act=d-pick]'): await ev('openDay()')
                    await page.wait_for_timeout(400); continue
                if rn.get('open') and not rn.get('done'): await page.wait_for_timeout(2500); await ev('daySpeed = 40'); await page.wait_for_timeout(500); continue
                await page.wait_for_timeout(1000)
                if not await click('[data-act=toEvening]'): await ev('goEvening()')
                await page.wait_for_timeout(800)
            elif ph == 'night':
                sg = st['stage']
                if sg == 'ichi':
                    await page.wait_for_timeout(900)
                    if await click('.ich-it'): await page.wait_for_timeout(500); await click('.vbtns [data-act=ichiBuy]'); await page.wait_for_timeout(400)
                    if not await click('[data-act=ichiGo]'): await ev('ichiGo()')
                    await page.wait_for_timeout(600)
                elif sg == 'arrive':
                    if st['day'] == 2 and ('arrive', 2) not in reloaded:
                        reloaded.add(('arrive', 2)); await harvest(f'run{run}'); run += 1; await boot(); await snd(); await page.wait_for_timeout(300); await click('[data-act=continue]'); await page.wait_for_timeout(1500); continue
                    await page.wait_for_timeout(400)
                elif sg == 'pick':
                    await page.wait_for_timeout(800)
                    L = st['open']; bd = L[(st['day'] - 1) * 2 % len(L)]
                    await ev(f'pickBuild({json.dumps(bd)})'); await page.wait_for_timeout(800); await ev('pickGo()'); await page.wait_for_timeout(600)
                elif sg == 'shop':
                    if st['busy'] or st['fighting'] or st['cur']: await page.wait_for_timeout(300); continue
                    if st['day'] == 2 and st['round'] == 2 and ('shop', 2) not in reloaded:
                        reloaded.add(('shop', 2)); await harvest(f'run{run}'); run += 1; await boot(); await snd(); await page.wait_for_timeout(300); await click('[data-act=continue]'); await page.wait_for_timeout(1500); continue
                    await page.wait_for_timeout(500); await ev(BUY); await page.wait_for_timeout(400)
                    if not await click('[data-act=bake]'): await ev('bake()')
                    await page.wait_for_timeout(600)
                    if not spd_on and await click('[data-act=spd]'): spd_on = True
                elif sg == 'roundEnd':
                    await page.wait_for_timeout(500)
                    if not await click('[data-act=next]'): await ev('nextRound()')
                    await page.wait_for_timeout(400)
                elif sg in ('thanks', 'end'):
                    await page.wait_for_timeout(900)
                    if not await ev('talking()'): await click('[data-act=toResult]')
                else: await page.wait_for_timeout(300)
            elif ph == 'result':
                await page.wait_for_timeout(900)
                if st['day'] >= DAYS: break
                spd_on = False
                if not await click('[data-act=nextDay]'): await ev('nextDay()')
                await page.wait_for_timeout(800)
            else: await page.wait_for_timeout(400)
            await page.wait_for_timeout(100)
        await harvest(f'run{run}')
        lt.cancel(); await b.close()

asyncio.run(main())
(OUT / f'late-{MODE}.json').write_text(json.dumps(rep, ensure_ascii=False, indent=1))
# まとめ
print('形', MODE, rep['net'], 'エラー', len(rep['errors']), rep['errors'][:3])
print('404', len(rep['http_err']), collections.Counter(x[1] for x in rep['http_err']).most_common(8))
print('ことがら', rep['issues'][:10])
by = collections.defaultdict(list)
for x in rep['late_img']: by[x['sc'].split('/')[0] + '/' + (x['sc'].split('/')[1] if '/' in x['sc'] else '') + ' ' + x['run']].append(x)
print('おくれて見えた絵', len(rep['late_img']))
for sc, L in sorted(by.items()):
    L.sort(key=lambda x: -x['late_ms'])
    print(' ', sc, len(L), '|', ', '.join(f"{x['k']} {x['late_ms']}ms{'*' if x['req_after_show'] else ''}" for x in L[:12]))
print('見えてから読んだが 間にあった絵', len(rep['cold_img']))
print('幕が開いたとき', *rep['curtain'], sep='\n  ')
sl = [x for x in rep['snd'] if x[3] == 'fail' or x[3] > 60]
print('おくれた効果音・声（60ms より）', len(sl))
for x in sorted(sl, key=lambda x: -(x[3] if isinstance(x[3], int) else 9999))[:25]: print(' ', x)
print('曲がはじまるまで')
for x in rep['bgm']: print(' ', x)
