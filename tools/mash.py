"""連打ファジング（QA）：python3 -I tools/mash.py <出すフォルダ> [場面,場面..|all] [seed=1]   W=390 H=674 で画面の大きさ
場面：title talk morning day dn ichi night shop battle pause reload
本物のマウスで、見えているボタンを短い間隔で連打。見るもの：pageerror・console error・止まり・お金/コイン/日/ラウンドのおかしな値
"""
import sys, os, json, re, time, random, pathlib
from playwright.sync_api import sync_playwright
ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = pathlib.Path(sys.argv[1]); OUT.mkdir(parents=True, exist_ok=True)
WHICH = (sys.argv[2] if len(sys.argv) > 2 else 'all').split(',')
SEED = int(sys.argv[3]) if len(sys.argv) > 3 else 1
VW, VH = int(os.environ.get('W', 390)), int(os.environ.get('H', 674))
rnd = random.Random(SEED)
html = (ROOT / 'index.html').read_text().replace('<head>', f'<head><base href="file://{ROOT}/">', 1)
i = html.rfind('})();')
tmp = OUT / '_mash.html'
tmp.write_text(html[:i] + "window.__ev = s => eval(s);\n" + html[i:])
ERR, ISS = [], []
def issue(sc, *a): ISS.append(sc + ': ' + ' '.join(str(x) for x in a)[:300]); print('ISSUE', ISS[-1], flush=True)

INV = r"""(() => { const o = []; const t = document.body.innerText; const m = t.match(/undefined|NaN|\[object|Infinity/); if (m) o.push('text:' + t.slice(Math.max(0, m.index - 20), m.index + 20).replace(/\s+/g, ' '));
 if (!Number.isFinite(S.money) || S.money < 0) o.push('money=' + S.money);
 if (!Number.isInteger(S.day) || S.day < 1) o.push('day=' + S.day);
 if (S.kaiso > 10) o.push('kaiso=' + S.kaiso);
 if (S.phase === 'night' && S.night) { const n = S.night; if (!(n.coins >= 0)) o.push('coins=' + n.coins); if (!(n.round >= 1 && n.round <= 9)) o.push('round=' + n.round); if (n.board.length !== 5) o.push('board=' + n.board.length); if (!(n.picks >= 0)) o.push('picks=' + n.picks); if (n.ichi && n.ichi.length > 3) o.push('ichi=' + n.ichi.length); }
 return o; })()"""
CLICKABLES = r"""(() => { const out = []; for (const e of document.querySelectorAll('[data-act],.tk-win,.tk-skip,.vclose,#tipb,.ich-it,.pc')) { const r = e.getBoundingClientRect(); if (r.width > 4 && r.height > 4 && r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth && !e.disabled) out.push([e.dataset.act || e.className.toString().slice(0, 12), r.x + r.width / 2, r.y + r.height / 2]); } return out; })()"""

class G:
    def __init__(s, b, sc):
        s.sc = sc
        s.ctx = b.new_context(viewport={'width': VW, 'height': VH}, device_scale_factor=1, is_mobile=True, has_touch=True)
        s.p = s.ctx.new_page(); s.p.route(re.compile(r'https?://.*'), lambda r: r.abort())
        s.p.on('pageerror', lambda e: (ERR.append((sc, str(e)[:250])), print('PAGEERROR', sc, str(e)[:200], flush=True)))
        s.p.on('console', lambda m: m.type == 'error' and not re.search(r'bgm|mp3|ERR_FAILED|CORS|Failed to load resource|net::', m.text) and (ERR.append((sc, m.text[:250])), print('CONSOLE', sc, m.text[:200], flush=True)))
        s.boot()
    def boot(s):
        s.p.goto('file://' + str(tmp), wait_until='domcontentloaded')
        s.p.wait_for_function('typeof window.__ev === "function" && !!document.querySelector("[data-act]")', polling=100, timeout=20000); s.p.wait_for_timeout(400)
    def ev(s, c): return s.p.evaluate(f'() => window.__ev({json.dumps(c)})')
    def inv(s, tag=''):
        try:
            for x in s.ev(INV): issue(s.sc, tag, x)
        except Exception as e: issue(s.sc, tag, 'inv fail', e)
    def clicks(s): return s.p.evaluate(CLICKABLES)
    def mash(s, n=12, gap=15, only=None, avoid=()):
        for _ in range(n):
            L = [c for c in s.clicks() if (not only or c[0] in only) and c[0] not in avoid]
            if not L: break
            c = rnd.choice(L); s.p.mouse.click(c[1], c[2])
            if gap: s.p.wait_for_timeout(gap)
    def tap(s, act, n=10, gap=10):
        for _ in range(n):
            L = [c for c in s.clicks() if c[0] == act]
            if not L: return
            s.p.mouse.click(L[0][1], L[0][2])
            if gap: s.p.wait_for_timeout(gap)
    def buys(s, n=6):
        for _ in range(n): s.mash(4, 0, only=['card', 'buy', 'buy', 'buy', 'sell', 'close'])
    def settle(s, ms=1500): s.p.wait_for_timeout(ms)
    def stuck(s, what, ms=9000):
        t0 = time.time()
        while time.time() - t0 < ms / 1000:
            if s.clicks() and not s.p.evaluate('!!document.querySelector(".dsw")'): return False
            s.p.wait_for_timeout(300)
        issue(s.sc, 'STUCK', what, json.dumps(s.ev('({p:S.phase,st:S.night&&S.night.stage,b:busy,f:fighting,tk:!!TK})'))); s.p.screenshot(path=str(OUT / f'stuck-{s.sc}.png')); return True
    def close(s): s.ctx.close()

def night_setup(g, day=5, money=3000):
    g.ev(f"localStorage.clear(); S = newState(); S.day = {day}; S.money = {money}; S.seenMon = MONSTERS.filter(m => !m.rare).map(m => m.id); S.today = newDay({day}); S.phase = 'night'; bSpeed = 3; startNight(); render(); 0")
    g.settle(600)

def to_shop(g, day=5, money=3000):
    night_setup(g, day, money)
    for _ in range(20):
        st = g.ev('S.night.stage')
        if st == 'shop' and not g.ev('!!TK'): break
        if g.ev('!!TK'): g.ev('talkClose(); 0')
        elif st == 'ichi': g.ev('ichiGo(); 0')
        elif st == 'pick': g.ev('pickGo(); 0')
        g.settle(400)
    g.settle(1500)
    for _ in range(30):   # 幕とスタートの帯のあいだは ショップをさわれない（11/23 夜・battle-fx.js の curtainBusy）
        if not g.ev('typeof curtainBusy === "function" && curtainBusy()'): break
        g.settle(200)

def sc_title(b):
    g = G(b, 'title'); g.ev("S = newState(); S.day=3; S.phase='morning'; startMorning(); save(); 0"); g.boot()
    g.tap('continue', 12, 8); g.settle(1500); g.inv('continue')
    ph = g.ev('S.phase'); d = g.ev('S.day')
    if (ph, d) != ('morning', 3): issue('title', 'continue spam changed state', ph, d)
    g.ev("TK&&talkClose(true); 0")
    g.boot()
    for _ in range(30): g.mash(3, 5, only=['opt', 'optX', 'optSet', 'reset', 'resetNo'])
    g.inv('settings')
    g.boot(); g.tap('opt', 1)
    for _ in range(25): g.mash(1, 0, only=['reset', 'resetNo', 'optX'])
    g.settle(1500); g.inv('reset')
    g.ev("S.day=7; S.phase='morning'; save(); 0"); g.boot()
    g.tap('opt', 1, 0); g.tap('reset', 1, 0); g.tap('reset', 4, 0)
    g.settle(1500); g.inv('reset2'); print('after reset spam phase', g.ev('S.phase'), 'day', g.ev('S.day'), 'talk', g.ev('!!TK')); g.close()

def sc_talk(b):
    g = G(b, 'talk'); g.ev("localStorage.clear(); S = newState(); 0"); g.boot()
    g.ev("window.__done = 0; talk(['ほのか：いち','ほのか：に','ほのか：さん','ほのか：よん','ほのか：ご'], () => { window.__done++; }); 0")
    seen = []
    for _ in range(60):
        g.p.mouse.click(VW / 2, VH - 80); g.p.wait_for_timeout(rnd.choice([0, 5, 30, 80]))
        t = g.ev("(document.querySelector('#talk .tk-text')||{}).textContent")
        if t and (not seen or seen[-1] != t): seen.append(t)
    g.settle(800); print('talk lines seen', seen[:8], 'done', g.ev('window.__done'))
    if g.ev('window.__done') != 1: issue('talk', 'done count', g.ev('window.__done'))
    g.ev("window.__d2 = 0; talk(['ほのか：a','ほのか：b'], () => { window.__d2++; }); talk(['ほのか：c','ほのか：d'], () => { window.__d2 += 10; }); 0")
    for _ in range(30): g.p.mouse.click(VW / 2, VH - 80); g.p.wait_for_timeout(10)
    g.settle(800); print('talk overlap d2 (11 expected if first cancelled w/o done =10)', g.ev('window.__d2'))
    g.ev("window.__d3 = 0; talk(['ほのか：a','ほのか：b','ほのか：c'], () => { window.__d3++; }); 0")
    g.p.evaluate("() => { const k = document.querySelector('.tk-skip'); for (let i = 0; i < 5; i++) k.click(); }")
    g.settle(800)
    if g.ev('window.__d3') != 1: issue('talk', 'skip x5 done count', g.ev('window.__d3'))
    g.inv('talk'); g.close()

def sc_morning(b):
    g = G(b, 'morning'); g.ev("localStorage.clear(); S = newState(); S.day = 6; S.money = 3000; S.seen.kaisoFirst = 1; S.seen.kaisoDone=1; S.today = newDay(6); S.phase='morning'; startMorning(); save(); render(); 0"); g.settle(600)
    g.ev("TK&&talkClose(true); 0"); g.tap('m-zakka', 1); g.settle(400)
    m0 = g.ev('S.money'); k0 = g.ev('S.kaiso|0')
    g.tap('m-kaiso', 15, 5); g.settle(500)
    m1, k1 = g.ev('S.money'), g.ev('S.kaiso|0'); print('kaiso', k0, '->', k1, 'money', m0, '->', m1)
    if k1 - k0 > 1: issue('morning', 'kaiso jumped', k0, k1)
    g.ev("S.money = 100000; render(); 0")
    for _ in range(20): g.tap('m-kaiso', 6, 0); g.tap('m-good', 4, 0); g.p.wait_for_timeout(30)
    g.ev('TK&&talkClose(true); 0'); print('kaiso final', g.ev('S.kaiso'), 'money', g.ev('S.money')); g.inv('rich')
    g.ev("S.money = 50; render(); 0"); g.tap('m-kaiso', 10, 0); g.mash(30, 5, only=['m-good', 'm-kaiso', 'm-deco']); g.inv('poor buy')
    for k in ('m-kitchen', 'm-zakka', 'm-disp', 'm-book', 'm-aisho'): g.mash(8, 5, only=[k, 'm-kitchen', 'm-zakka', 'm-disp'])
    g.mash(60, 8, avoid=('m-open',)); g.ev('TK&&talkClose(true); 0'); g.inv('morning mash')
    g.ev("S.money = 300; S.phase='morning'; startMorning(); render(); 0"); g.tap('m-kitchen', 1)
    g.mash(40, 5, only=['m-auto', 'm-arr', 'card', 'toShelf']); g.inv('bake'); g.close()

def sc_day(b):
    g = G(b, 'day'); g.ev("localStorage.clear(); S = newState(); S.day = 6; S.money = 3000; S.today = newDay(6); S.phase='morning'; startMorning(); save(); render(); 0"); g.settle(500)
    g.ev("TK&&talkClose(true); 0")
    g.ev("(() => { const a = shopMats(); mixTwo(a[0], a[1]); return 0; })()")
    for _ in range(40):
        if not g.ev('mBusy'): break
        g.settle(300)
    g.ev("(() => { mAutoArrange(); const M = mState(); if (!M.kanban) { const s = S.shelf.find(x => x.n > 0) || M.baked[0]; if (s) M.kanban = s.key; } render(); return 0; })()")
    print('baked', g.ev('mState().baked.length'), 'shelf', g.ev('S.shelf.length'), 'kanban', g.ev('mState().kanban'))
    g.settle(800); g.tap('m-open', 8, 5); g.settle(800)
    print('after m-open spam phase', g.ev('S.phase')); g.ev("TK&&talkClose(true); 0")
    g.mash(25, 10, avoid=('toEvening', 'toResult'))
    g.ev("window.__st = 0; (() => { const o = stopDay; stopDay = function () { window.__st++; return o.apply(this, arguments); }; return 0; })()")
    g.ev('daySpeed = 40; 0'); g.settle(1500)
    for _ in range(30): g.tap('toEvening', 1, 0); g.p.mouse.click(VW / 2, VH - 60); g.p.wait_for_timeout(20)
    g.settle(4500); print('stopDay count', g.ev('window.__st'), 'phase', g.ev('S.phase'), 'stage', g.ev('S.night&&S.night.stage'))
    if g.ev('window.__st') > 1: issue('day', 'stopDay ran', g.ev('window.__st'))
    g.inv('day'); g.stuck('after evening'); g.close()

def sc_dn(b):
    g = G(b, 'dn'); g.ev("localStorage.clear(); S = newState(); S.day = 6; S.money = 3000; S.today = newDay(6); S.phase='result'; save(); render(); 0"); g.settle(800)
    g.ev("TK&&talkClose(true); 0")
    g.ev("window.__nd = 0; (() => { const o = goMorning; goMorning = function () { window.__nd++; return o.apply(this, arguments); }; return 0; })()")
    for _ in range(40):
        g.p.mouse.click(rnd.randint(5, VW - 5), rnd.randint(5, VH - 5)); g.tap('nextDay', 1, 0); g.p.wait_for_timeout(rnd.choice([5, 40, 120]))
    g.settle(5000); print('nextDay -> day', g.ev('S.day'), 'phase', g.ev('S.phase'), 'goMorning calls', g.ev('window.__nd'), 'dsw', g.ev("!!document.querySelector('.dsw')"))
    if g.ev('S.day') != 7: issue('dn', 'day after spam', g.ev('S.day'))
    if g.ev("!!document.querySelector('.dsw')"): issue('dn', 'overlay stuck')
    g.inv('dn'); g.close()

def sc_ichi(b):
    g = G(b, 'ichi'); night_setup(g, 12, 20000)
    g.ev('TK&&talkClose(true); 0'); g.settle(300)
    st = g.ev('S.night.stage'); print('stage after startNight', st)
    if st != 'ichi': print('no ichi'); g.close(); return
    ids = dict(g.ev("ichiStock().items.map(i => [i.id, i.price])")); print('ichi items', ids)
    m0 = g.ev('S.money')
    for _ in range(5):
        g.tap('ichiV', 1, 0); g.tap('ichiBuy', 12, 0); g.tap('ichiClose', 1, 0)
    paid = sum(ids[i] for i in g.ev('S.night.ichi')); n = g.ev('S.night.ichi.length')
    print('basket', n, 'spent', m0 - g.ev('S.money'), 'expected', paid)
    if n > 3: issue('ichi', 'basket', n)
    if m0 - g.ev('S.money') != paid: issue('ichi', 'money mismatch', m0 - g.ev('S.money'), paid)
    g.mash(80, 5, avoid=('ichiGo',)); g.inv('ichi mash')
    paid = sum(ids[i] for i in g.ev('S.night.ichi'))
    if m0 - g.ev('S.money') != paid: issue('ichi', 'money mismatch after mash', m0 - g.ev('S.money'), paid)
    g.ev('S.money = 5; render(); 0'); g.ev('S.night.ichi=[]; S.night.ichiPaid={}; 0'); g.tap('ichiV', 1, 0); g.tap('ichiBuy', 10, 0); g.inv('poor')
    g.ev("window.__gs = 0; (() => { const o = rollShop; rollShop = function () { window.__gs++; return o.apply(this, arguments); }; return 0; })()")
    for _ in range(15): g.tap('ichiGo', 1, 0); g.p.mouse.click(VW / 2, VH - 70); g.p.wait_for_timeout(15)
    g.settle(1500); print('rollShop calls', g.ev('window.__gs'), 'stage', g.ev('S.night.stage'))
    g.inv('ichiGo'); g.close()

def sc_night(b):
    g = G(b, 'night'); night_setup(g, 5)
    print('stage', g.ev('S.night.stage'))
    for _ in range(3): g.mash(30, 5, only=['pickB', 'pickC', 'pickBack', 'pickNext', 'pkPage'])
    g.inv('pick')
    for _ in range(12): g.tap('pickGo', 1, 0)
    g.settle(1200); print('after pickGo', g.ev('S.night.stage'))
    for _ in range(40): g.p.mouse.click(VW / 2, VH - 80); g.p.wait_for_timeout(8)
    g.settle(1500); print('stage', g.ev('S.night.stage'), 'tk', g.ev('!!TK')); g.inv('arrive'); g.close()

def sc_shop(b):
    g = G(b, 'shop'); to_shop(g, 5)
    print('stage', g.ev('S.night.stage'), 'round', g.ev('S.night.round'), 'coins', g.ev('S.night.coins'), 'picks', g.ev('S.night.picks'), 'rolls', g.ev('S.night.rolls'))
    for _ in range(40): g.tap('reroll', 1, 0)
    g.inv('reroll r1'); print('r1 rolls', g.ev('S.night.rolls'))
    g.buys(12)
    g.inv('buy r1'); print('board', g.ev('S.night.board.map(c=>c&&c.cid)'), 'picks', g.ev('S.night.picks'))
    g.ev("S.night.round = 3; S.night.coins = 7; S.night.picks=0; rollShop(); renderNight(); 0")
    for _ in range(20): g.tap('reroll', 1, 0)
    print('coins after paid rerolls', g.ev('S.night.coins')); g.inv('paid reroll')
    g.ev("S.night.coins = 50; S.night.board = Array(5).fill(null); rollShop(); renderNight(); 0")
    c0 = g.ev('S.night.coins')
    g.buys(25)
    g.inv('buy spam'); print('coins', c0, '->', g.ev('S.night.coins'), 'board', g.ev('S.night.board.map(c=>c&&c.cid)'))
    n0 = g.ev('S.night.coins'); b0 = g.ev('S.night.board.filter(Boolean).length')
    g.tap('card', 1, 0); g.p.wait_for_timeout(300)
    for _ in range(12): g.tap('sell', 1, 0)
    print('sell: coins', n0, '->', g.ev('S.night.coins'), 'cards', b0, '->', g.ev('S.night.board.filter(Boolean).length'))
    g.mash(60, 6, avoid=('bake',)); g.inv('mash shop')
    for _ in range(8):
        pr = json.loads(g.ev("JSON.stringify([...document.querySelectorAll('[data-drag]')].map(e=>{const r=e.getBoundingClientRect();return [r.x+r.width/2,r.y+r.height/2]}))"))
        ds = json.loads(g.ev("JSON.stringify([...document.querySelectorAll('[data-drop]')].map(e=>{const r=e.getBoundingClientRect();return [r.x+r.width/2,r.y+r.height/2]}))"))
        if not pr or not ds: break
        a, d = rnd.choice(pr), rnd.choice(ds)
        g.p.mouse.move(*a); g.p.mouse.down(); g.p.mouse.move(*d, steps=2); g.p.mouse.up(); g.p.mouse.click(*d)
    g.p.wait_for_timeout(800); g.inv('drag'); g.close()

def sc_battle(b):
    g = G(b, 'battle'); to_shop(g, 5)
    g.ev("S.night.picks = 0; S.night.coins = 30; 0")
    rounds = []; t0 = time.time(); stuck_t = time.time(); last = None; s = {'ph': ''}
    g.ev("window.__om = 0; (() => { const o = finishRound; finishRound = function () { window.__om++; return o.apply(this, arguments); }; return 0; })()")
    while time.time() - t0 < 240:
        s = json.loads(g.ev("JSON.stringify({ph:S.phase,st:S.night&&S.night.stage,r:S.night&&S.night.round,busy:busy,f:fighting,tk:!!TK,c:S.night&&S.night.coins,fr:window.__om})"))
        if s['ph'] != 'night': print('left night ->', s['ph']); break
        key = json.dumps(s)
        if key != last: last = key; stuck_t = time.time()
        elif time.time() - stuck_t > 20: issue('battle', 'STUCK', key); g.p.screenshot(path=str(OUT / 'stuck-battle.png')); break
        if not rounds or rounds[-1] != s['r']:
            if rounds and s['r'] != rounds[-1] + 1: issue('battle', 'round jump', rounds[-1], s['r'])
            rounds.append(s['r']); print('round', s['r'], 'coins', s['c'], 'finishRound calls', s['fr'], flush=True)
        if s['tk']: g.p.mouse.click(VW / 2, VH - 80); g.p.wait_for_timeout(60); continue
        if s['st'] == 'shop' and not s['busy'] and not s['f']:
            g.buys(3)
            if not g.ev('S.night.board.some(Boolean)'): g.ev("(() => { for (let i=0;i<N.shop.length;i++) buy(i); return 0; })()")
            for _ in range(rnd.randint(6, 15)): g.tap('bake', 1, 0)
            g.p.wait_for_timeout(100); continue
        if s['f'] or s['busy']:
            g.mash(rnd.randint(3, 8), 10); g.p.wait_for_timeout(120); g.inv('mid battle'); continue
        if s['st'] == 'roundEnd':
            for _ in range(rnd.randint(3, 10)): g.tap('next', 1, 0)
            g.p.wait_for_timeout(300); continue
        if s['st'] in ('thanks', 'end'):
            g.p.wait_for_timeout(500)
            for _ in range(10): g.tap('toResult', 1, 0)
            continue
        g.p.wait_for_timeout(200)
    print('rounds', rounds, 'finishRound calls', g.ev('window.__om')); g.inv('battle end')
    if s['ph'] == 'result':
        d0 = g.ev('S.day'); g.settle(800)
        for _ in range(20): g.tap('nextDay', 1, 0); g.p.wait_for_timeout(30)
        g.settle(5000); print('day', d0, '->', g.ev('S.day'), g.ev('S.phase'))
        if g.ev('S.day') != d0 + 1: issue('battle', 'day after result spam', d0, g.ev('S.day'))
    g.close()

def sc_pause(b):
    g = G(b, 'pause'); to_shop(g, 5); g.ev("S.night.picks = 0; S.night.coins = 30; 0"); g.buys(4); g.p.wait_for_timeout(200)
    g.tap('bake', 1, 0)
    for k in range(12):
        g.p.wait_for_timeout(rnd.choice([100, 400, 900])); g.mash(6, 8, only=['opt', 'optX', 'optSet', 'spd'])
    g.settle(3000); print('pause: phase', g.ev('S.phase'), 'stage', g.ev('S.night.stage'), 'fighting', g.ev('fighting'), 'busy', g.ev('busy')); g.inv('pause')
    g.stuck('pause'); g.close()

def sc_reload(b):
    g = G(b, 'reload')
    def cont():
        g.boot(); g.tap('continue', 4, 20); g.settle(1200); g.ev('TK&&talkClose(true); 0')
    g.ev("localStorage.clear(); S = newState(); S.day = 6; S.money = 3000; S.today = newDay(6); S.phase='result'; save(); render(); 0"); g.settle(600)
    g.ev("TK&&talkClose(true); 0"); g.tap('nextDay', 1); g.p.wait_for_timeout(700)
    cont(); print('reload mid dn(result->morning):', g.ev('[S.phase,S.day]'))
    if g.ev('S.phase') not in ('result', 'morning'): issue('reload', 'bad phase', g.ev('[S.phase,S.day]'))
    g.inv('r1')
    night_setup(g, 12, 5000); g.tap('ichiV', 1); g.tap('ichiBuy', 1); g.settle(400)
    pre = g.ev('JSON.stringify([S.money, S.night.ichi, S.night.stage])'); cont(); post = g.ev('JSON.stringify([S.money, S.night.ichi, S.night.stage])'); print('ichi reload', pre, post)
    if pre != post: issue('reload', 'ichi changed', pre, post)
    to_shop(g, 5); g.ev("S.night.picks=0; S.night.coins=30; 0"); g.buys(4); g.p.wait_for_timeout(200); g.tap('bake', 1)
    g.p.wait_for_timeout(1500); pre = g.ev('JSON.stringify([S.night.round, S.night.board, S.night.coins])'); cont()
    post = g.ev('JSON.stringify([S.phase, S.night&&S.night.stage, S.night.round, S.night.board, S.night.coins])'); print('battle reload', pre, post)
    g.ev('bSpeed=3; 0'); g.settle(300); g.mash(10, 20); g.inv('after reload'); g.stuck('reload battle'); g.close()

SC = dict(title=sc_title, talk=sc_talk, morning=sc_morning, day=sc_day, dn=sc_dn, ichi=sc_ichi, night=sc_night, shop=sc_shop, battle=sc_battle, pause=sc_pause, reload=sc_reload)
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
    for k in (SC if WHICH == ['all'] else WHICH):
        print('=== ', k, flush=True)
        try: SC[k](b)
        except Exception as e: issue(k, 'HARNESS EXC', repr(e)[:250])
    b.close()
print('ERRORS', json.dumps(ERR, ensure_ascii=False)); print('ISSUES', len(ISS))
