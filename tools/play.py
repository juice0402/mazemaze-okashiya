"""夜の自動プレイ点検（11/19 リーダー）：本物のドラッグとタップで、えらんだビルドの夜を9ラウンド遊び、エラー・止まり・おかしな表示を集める
使い方：python3 -I tools/play.py . <出すフォルダ> <ビルド[,ビルド]> [日=20] [たね=1] [はやさ=2]
  画面の大きさは W=390 H=674 python3 -I tools/play.py …（ふつうは 390×844）
  - 買う・まぜる・うごかす・うる（ドラッグ）・入れかえ・カードを大きく見る・ヒントをとじる・会話（1文ずつ／スキップ）・おもてなし！・次のラウンドへ・まとめへ
  - バトル中に はやおくりを連打・タイルをタップ、ラウンド3のバトル中にページを読みなおして「つづきから」（調理台とラウンドが前のままか）
  - 見るもの：JS のエラー・止まり（25秒〔バトル中40秒〕なにも変わらない）・画面の字の undefined／NaN・調理台5マス・コインと味パワーの数・dropPlan どおりに動いたか・部品の数（たまっていないか）
  - 出るもの：ビルドごとの JSON（errors・issues・stats・log）と、ラウンド1・5・9 のショップ、5のバトル、9の結果、まとめのスクショ
  - ふつうは index.html を作りなおしてから（node tools/build.mjs）。BGM は file:// では読めないので、そのエラーは数えない
  - 「UNEXPECTED」：dropPlan が null なのに変わった（調理台→ショップのカードの上＝うる は正しい動きなので数えない）。「DRAG NOOP」：まぜられるショップのカードの上でコインが足りないときは、うらずに「足りない」が正しい
"""
import sys, json, re, io, time, random, pathlib
from playwright.sync_api import sync_playwright
from PIL import Image

ROOT = pathlib.Path(sys.argv[1]).resolve()
OUT = pathlib.Path(sys.argv[2]); OUT.mkdir(parents=True, exist_ok=True)
BUILDS = sys.argv[3].split(',')
DAY = int(sys.argv[4]) if len(sys.argv) > 4 else 20
SEED = int(sys.argv[5]) if len(sys.argv) > 5 else 1
SPD = int(sys.argv[6]) if len(sys.argv) > 6 else 2
import os
VW, VH = int(os.environ.get('W', 390)), int(os.environ.get('H', 844))   # 画面の大きさ（11/21 しょーくんの画面 W=390 H=674・W=384 H=605）
rnd = random.Random(SEED)

html = (ROOT / 'index.html').read_text()
html = html.replace('<head>', f'<head><base href="file://{ROOT}/">', 1)
i = html.rfind('})();')
tmp = OUT / '_play.html'   # 絵は assets/art の外のファイルなので base を入れる
tmp.write_text(html[:i] + "window.__ev = s => eval(s);\n" + html[i:])

SNAP = r"""(() => { const night = document.querySelector('.night'); const txt = night ? night.innerText : '';
  let bad = []; try { (N.board || []).forEach(c => { if (c) cardDef(c.cid); }); (N.shop || []).forEach(c => { if (c) cardDef(c); }); } catch (e) { bad.push('cardDef:' + e.message); }
  const m = txt.match(/undefined|NaN|\[object|null|Infinity/); if (m) bad.push('text:' + m[0] + ' @ ' + txt.slice(Math.max(0, m.index - 30), m.index + 30).replace(/\s+/g, ' '));
  if (N && N.board && N.board.length !== 5) bad.push('board.length=' + N.board.length);
  if (N && !(isFinite(N.coins) && N.coins >= 0)) bad.push('coins=' + N.coins);
  if (N && !isFinite(N.score)) bad.push('score=' + N.score);
  return JSON.stringify({ ph: S.phase, st: N && N.stage, busy, fighting, round: N && N.round, talk: !!TK, tip: !!document.getElementById('tipb'),
    view: !!(N && N.view && N.sel), picks: N && N.picks, coins: N && N.coins, score: N && N.score, met: N && N.met,
    nodes: document.getElementsByTagName('*').length, fxl: ($('fxl') ? $('fxl').children.length : 0), body: document.body.children.length, board: N && N.board.map(c => c && c.cid), shop: N && N.shop, field: N && N.field, heat: N && N.heat, bad }); })()"""

# ドラッグできるものと置ける所をさがし、dropPlan で何が起きるかも出す
PAIRS = r"""(() => { const vis = e => { const r = e.getBoundingClientRect(); return r.width > 4 && r.height > 4 && r.bottom > 0 && r.top < innerHeight ? r : null; };
  const src = [...document.querySelectorAll('[data-drag]')].map(e => ({ e, r: vis(e) })).filter(o => o.r);
  const dst = [...document.querySelectorAll('[data-drop]')].map(e => ({ e, r: vis(e) })).filter(o => o.r);
  const out = [];
  for (const a of src) for (const b of dst) { const p = { where: a.e.dataset.w, i: +a.e.dataset.i }, q = { where: b.e.dataset.w, i: +b.e.dataset.i };
    let P = null; try { P = dropPlan(p, q); } catch (err) { P = { kind: 'ERR', err: err.message }; }
    out.push({ p, q, kind: P ? P.kind : null, ng: P ? (P.ng || '') : '', ax: a.r.x + a.r.width / 2, ay: a.r.y + a.r.height / 2, bx: b.r.x + b.r.width / 2, by: q.where === 'sell' ? b.r.bottom - 14 : b.r.y + b.r.height / 2 }); }   // うる所はショップの下のはし（11/19 ショップのカードが大きくなって、まんなかはカードの上＝まぜになった）
  return JSON.stringify(out); })()"""

def ev(page, code):
    return page.evaluate(f'() => window.__ev({json.dumps(code)})')

def snap(page):
    return json.loads(ev(page, SNAP))

def btn(page, act, sel=''):
    for loc in page.locator(f'{sel}[data-act="{act}"]').all():
        try:
            if loc.is_visible():
                if loc.is_disabled(): return False
                bb = loc.bounding_box(); page.mouse.click(bb['x'] + bb['width'] / 2, bb['y'] + bb['height'] / 2); return True
        except Exception: pass
    return False

def drag(page, a, b):
    page.mouse.move(a[0], a[1]); page.mouse.down()
    for k in range(1, 9):
        page.mouse.move(a[0] + (b[0] - a[0]) * k / 8, a[1] + (b[1] - a[1]) * k / 8); page.wait_for_timeout(16)
    page.wait_for_timeout(60); page.mouse.up()

def shot(page, name):
    page.screenshot(path=str(OUT / name))

report = []
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
    for build in BUILDS:
        errs, issues, log = [], [], []
        ctx = b.new_context(viewport={'width': VW, 'height': VH}, device_scale_factor=1, is_mobile=True, has_touch=True)
        page = ctx.new_page()
        page.route(re.compile(r'https?://.*'), lambda r: r.abort())
        page.on('pageerror', lambda e: errs.append(('pageerror', str(e)[:300])))
        page.on('console', lambda m: m.type == 'error' and not re.search(r'bgm|ERR_FAILED|CORS', m.text) and errs.append(('console', m.text[:300])))
        page.goto('file://' + str(tmp), wait_until='domcontentloaded')
        page.wait_for_function('typeof window.__ev === "function"', polling=100)
        page.wait_for_timeout(500)
        setup = (f"localStorage.clear(); S = newState(); S.day = {DAY}; S.seen['mate:minamo'] = 5; S.seen['mate:wakaba'] = 10; S.seen.m9 = 8; "
                 f"S.today = newDay({DAY}); S.today.hearts = {rnd.randint(0, 10)}; S.phase = 'night'; bSpeed = {SPD}; startNight(); render(); 0") if DAY > 1 else \
                (f"localStorage.clear(); S = newState(); S.day = 1; S.today = newDay(1); S.phase = 'night'; bSpeed = {SPD}; startNight(); render(); 0")
        try: ev(page, setup)
        except Exception as e: errs.append(('setup', str(e)[:300]))
        t0 = time.time(); last_change = time.time(); prev = None; reloaded = False; acts = 0; shots = set(); round_seen = 0
        stats = {'drag': 0, 'drag_ok': 0, 'drag_noop_expected': 0, 'drag_fail': 0, 'reroll': 0, 'view': 0, 'tipclose': 0}
        while time.time() - t0 < 900:
            s = snap(page)
            for x in s['bad']:
                if x not in issues: issues.append(x); log.append(f"r{s['round']} {s['st']}: BAD {x}")
            sig = json.dumps([s['ph'], s['st'], s['round'], s['board'], s['shop'], s['coins'], s['talk'], s['busy'], s['fighting'], s['score']])
            if sig != prev: prev = sig; last_change = time.time()
            elif time.time() - last_change > (40 if s['fighting'] else 25):
                issues.append(f"STUCK r{s['round']} st={s['st']} busy={s['busy']} fighting={s['fighting']} talk={s['talk']}"); shot(page, f'{build}-stuck.png'); break
            if s['ph'] != 'night':
                log.append(f"phase -> {s['ph']}"); shot(page, f'{build}-after.png'); break
            if s['talk']:
                if rnd.random() < 0.15: page.locator('#talk .tk-skip').click(timeout=1500)
                else: page.locator('#talk .tk-win').click(timeout=1500)
                page.wait_for_timeout(120); continue
            if s['view']:
                k = rnd.random()
                try:
                    if k < 0.4: page.locator('.vclose').first.click(timeout=1500)
                    elif k < 0.8: page.locator('.vbtns [data-act="close"]').first.click(timeout=1500)
                    else: page.mouse.click(12, 12)
                except Exception as e: log.append('close fail ' + str(e)[:80])
                page.wait_for_timeout(250); continue
            st = s['st']
            if st == 'pick':
                ev(page, f"pickBuild('{build}'); 0"); page.wait_for_timeout(200)
                if not btn(page, 'pickGo'): ev(page, 'pickGo(); 0')
                page.wait_for_timeout(600); continue
            if st == 'shop' and not s['busy'] and not s['fighting']:
                if s['round'] != round_seen:
                    round_seen = s['round']; acts = 0; goal = rnd.randint(3, 9)
                    if s['round'] in (1, 5, 9) and f"shop{s['round']}" not in shots: shots.add(f"shop{s['round']}"); page.wait_for_timeout(700); shot(page, f"{build}-r{s['round']}-shop.png")
                if s['tip'] and rnd.random() < 0.3:
                    try: page.locator('#tipb').click(timeout=1000); stats['tipclose'] += 1
                    except Exception: pass
                if acts < goal:
                    acts += 1
                    r = rnd.random()
                    if r < 0.08:
                        if btn(page, 'reroll'): stats['reroll'] += 1
                        page.wait_for_timeout(500); continue
                    if r < 0.14:
                        loc = page.locator('[data-act="card"]').nth(rnd.randint(0, 4))
                        try: loc.click(timeout=1000); stats['view'] += 1
                        except Exception: pass
                        page.wait_for_timeout(400); continue
                    pairs = json.loads(ev(page, PAIRS))
                    errp = [x for x in pairs if x['kind'] == 'ERR']
                    for x in errp: issues.append(f"dropPlan ERR {x}")
                    good = [x for x in pairs if x['kind'] and not x['ng']]
                    pick = rnd.choice(good) if good and rnd.random() < 0.85 else (rnd.choice(pairs) if pairs else None)
                    if not pick: continue
                    before = snap(page)
                    drag(page, (pick['ax'], pick['ay']), (pick['bx'], pick['by']))
                    page.wait_for_timeout(1500 if pick['kind'] == 'mix' else 450)
                    for _ in range(20):
                        if not snap(page)['busy']: break
                        page.wait_for_timeout(250)
                    after = snap(page); stats['drag'] += 1
                    changed = json.dumps([before['board'], before['shop'], before['coins'], before['field']]) != json.dumps([after['board'], after['shop'], after['coins'], after['field']])
                    if pick['kind'] and not pick['ng']:
                        if changed: stats['drag_ok'] += 1
                        else:
                            stats['drag_fail'] += 1
                            if stats['drag_fail'] <= 6: log.append(f"r{s['round']} DRAG NOOP {pick['kind']} {pick['p']}->{pick['q']} tip={before['tip']}")
                    else:
                        stats['drag_noop_expected'] += 1
                        if changed and not (pick['p']['where'] in ('board', 'field') and pick['q']['where'] in ('shop', 'sell') and after['coins'] >= before['coins'] and (None in after['board'] or after['field'] is None)): issues.append(f"UNEXPECTED change r{s['round']} {pick['kind']} ng={pick['ng']} {pick['p']}->{pick['q']}")
                    continue
                # おもてなし！
                if not any(s['board']):
                    pairs = json.loads(ev(page, PAIRS)); buys = [x for x in pairs if x['kind'] == 'buy' and not x['ng']]
                    if buys: x = buys[0]; drag(page, (x['ax'], x['ay']), (x['bx'], x['by'])); page.wait_for_timeout(500); continue
                if not btn(page, 'bake'): log.append(f"r{s['round']} no bake button"); page.wait_for_timeout(500)
                page.wait_for_timeout(300)
                s2 = snap(page)
                if s2['st'] == 'shop' and not s2['busy']:   # 「あと N まい えらべるよ」など
                    goal = acts + 2
                continue
            if s['fighting'] and s['round'] == 3 and not reloaded:
                reloaded = True; page.wait_for_timeout(rnd.randint(800, 4000)); pre = snap(page)
                page.reload(wait_until='domcontentloaded'); page.wait_for_function('typeof window.__ev === "function"', polling=100); page.wait_for_timeout(800)
                ev(page, f'bSpeed = {SPD}; 0')
                for _ in range(20):
                    btn(page, 'continue'); page.wait_for_timeout(500)
                    if ev(page, 'S.phase') == 'night': break
                else: log.append('reload: continue did not reach night')
                page.wait_for_timeout(1000); post = snap(page)
                log.append(f"reload mid-battle r{pre['round']}: after ph={post['ph']} st={post['st']} r={post['round']} board_same={post['board'] == pre['board']} coins {pre['coins']}->{post['coins']}")
                if post['round'] != pre['round'] or post['board'] != pre['board']: issues.append(f"RELOAD changed round/board {pre['round']}->{post['round']} {pre['board']} -> {post['board']}")
                last_change = time.time(); continue
            if s['fighting'] and rnd.random() < 0.12:
                btn(page, 'spd'); stats['spd'] = stats.get('spd', 0) + 1
            if s['fighting'] and rnd.random() < 0.06:
                try: page.locator('.tslot').nth(rnd.randint(0, 4)).click(timeout=500, force=True)
                except Exception: pass
            if s['fighting'] or s['busy']:
                if s['round'] == 5 and 'battle5' not in shots: shots.add('battle5'); page.wait_for_timeout(1800); shot(page, f'{build}-r5-battle.png')
                page.wait_for_timeout(300); continue
            if st == 'roundEnd':
                page.wait_for_timeout(600)
                if s['round'] == 9 and 'end9' not in shots: shots.add('end9'); shot(page, f'{build}-r9-end.png')
                log.append(f"r{s['round']} score={s['score']} met={s['met']} coins={s['coins']} nodes={s['nodes']} fxl={s['fxl']} body={s['body']}")
                if not btn(page, 'next'): ev(page, 'nextRound(); 0')
                page.wait_for_timeout(500); continue
            if st == 'thanks':
                page.wait_for_timeout(400); continue
            if st == 'end':
                if 'thanks' not in shots: shots.add('thanks'); page.wait_for_timeout(600); shot(page, f'{build}-end.png')
                if not btn(page, 'toResult'): log.append('no toResult button')
                page.wait_for_timeout(800); continue
            page.wait_for_timeout(300)
        report.append({'build': build, 'secs': round(time.time() - t0), 'errors': errs[:12], 'n_err': len(errs), 'issues': issues[:20], 'stats': stats, 'log': log[-16:]})
        ctx.close()
    b.close()
print(json.dumps(report, ensure_ascii=False, indent=1))
