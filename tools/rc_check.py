"""リリース前の点検（QA・11/23）：せってい・つづきから（全場面でリロード）・幕。ゲームのコードは直さない。
使い方：W=390 H=674 python3 -I tools/rc_check.py <出すフォルダ> [場面,場面..|all]
場面：opt（せっていの保存）・reset（はじめから）・reload（全場面で リロード→つづきから）・curtain（夜の幕）
見るもの：pageerror・console error・止まり（8秒 押せるものが出ない）・日/お金/場面のずれ・タイトルにもどる・幕の残り・ショップの二重
画面幅：W=360 H=640 でも。ISSUE の行と、さいごの ISSUES の数を見る
"""
import sys, os, json, re, time, pathlib
from playwright.sync_api import sync_playwright
ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = pathlib.Path(sys.argv[1]); OUT.mkdir(parents=True, exist_ok=True)
WHICH = (sys.argv[2] if len(sys.argv) > 2 else 'all').split(',')
VW, VH = int(os.environ.get('W', 390)), int(os.environ.get('H', 674))
html = (ROOT / 'index.html').read_text().replace('<head>', f'<head><base href="file://{ROOT}/">', 1)
i = html.rfind('})();')
tmp = OUT / '_rc.html'
tmp.write_text(html[:i] + "window.__ev = s => eval(s);\n" + html[i:])
ERR, ISS = [], []
def issue(sc, *a): ISS.append(sc + ': ' + ' '.join(str(x) for x in a)[:300]); print('ISSUE', ISS[-1], flush=True)

CLICKABLES = r"""(() => { const out = []; for (const e of document.querySelectorAll('[data-act],.tk-win,.tk-skip,.vclose,#tipb,.ich-it,.pc')) { const r = e.getBoundingClientRect(); if (r.width > 4 && r.height > 4 && r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth && !e.disabled) out.push([e.dataset.act || e.className.toString().slice(0, 12), r.x + r.width / 2, r.y + r.height / 2]); } return out; })()"""
FIT = r"""(() => { const o = []; const de = document.documentElement; if (de.scrollWidth > innerWidth + 1) o.push('hscroll ' + de.scrollWidth + '>' + innerWidth);
 for (const e of document.querySelectorAll('[data-act]')) { if (e.dataset.act === 'noop' || e.dataset.act === 'optX' && e.classList.contains('optv')) continue; const r = e.getBoundingClientRect(); if (r.width < 4 || r.height < 4) continue; const cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden') continue;
   if (e.tagName === 'BUTTON' && (r.right > innerWidth + 2 || r.left < -2 || r.bottom > innerHeight + 2 && !e.closest('.opt,.scroll,.panel,#screen'))) o.push('offscreen ' + e.dataset.act + ' ' + Math.round(r.left) + ',' + Math.round(r.right) + ',' + Math.round(r.bottom)); }
 return o.slice(0, 4); })()"""
INV = r"""(() => { const o = []; const t = document.body.innerText; const m = t.match(/undefined|NaN|\[object|Infinity/); if (m) o.push('text:' + t.slice(Math.max(0, m.index - 20), m.index + 20).replace(/\s+/g, ' '));
 if (!Number.isFinite(S.money) || S.money < 0) o.push('money=' + S.money); if (!Number.isInteger(S.day) || S.day < 1) o.push('day=' + S.day);
 if (S.phase === 'night' && S.night) { const n = S.night; if (!(n.coins >= 0)) o.push('coins=' + n.coins); if (!(n.round >= 1 && n.round <= 9)) o.push('round=' + n.round); if (n.board.length !== 5) o.push('board=' + n.board.length); }
 return o; })()"""
STATE = "({p:S.phase,d:S.day,m:S.money,st:S.night&&S.phase==='night'?S.night.stage:null,r:S.night&&S.phase==='night'?S.night.round:0,tk:!!TK})"

class G:
    def __init__(s, b, sc):
        s.sc = sc
        s.ctx = b.new_context(viewport={'width': VW, 'height': VH}, device_scale_factor=1, is_mobile=True, has_touch=True)
        s.p = s.ctx.new_page(); s.p.route(re.compile(r'https?://.*'), lambda r: r.abort())
        s.p.on('pageerror', lambda e: (ERR.append((sc, str(e)[:250])), print('PAGEERROR', sc, str(e)[:200], flush=True), issue(sc, 'PAGEERROR', str(e)[:200])))
        s.p.on('console', lambda m: m.type == 'error' and not re.search(r'bgm|mp3|ERR_FAILED|CORS|Failed to load resource|net::', m.text) and (ERR.append((sc, m.text[:250])), issue(sc, 'CONSOLE', m.text[:200])))
        s.boot()
    def boot(s, reload=False):
        if reload: s.p.reload(wait_until='domcontentloaded')
        else: s.p.goto('file://' + str(tmp), wait_until='domcontentloaded')
        s.p.wait_for_function('typeof window.__ev === "function" && !!document.querySelector("[data-act]")', polling=100, timeout=40000); s.p.wait_for_timeout(500)
    def ev(s, c): return s.p.evaluate(f'() => window.__ev({json.dumps(c)})')
    def clicks(s): return s.p.evaluate(CLICKABLES)
    def tap(s, act, n=1, gap=20):
        k = 0
        for _ in range(n):
            L = [c for c in s.clicks() if c[0] == act]
            if not L: break
            s.p.mouse.click(L[0][1], L[0][2]); k += 1
            if gap: s.p.wait_for_timeout(gap)
        return k
    def has(s, act): return any(c[0] == act for c in s.clicks())
    def settle(s, ms=1000): s.p.wait_for_timeout(ms)
    def inv(s, tag=''):
        try:
            for x in s.ev(INV): issue(s.sc, tag, x)
            for x in s.p.evaluate(FIT): issue(s.sc, tag, 'FIT', x)
        except Exception as e: issue(s.sc, tag, 'inv fail', repr(e)[:100])
    def skip_talk(s, maxn=40):
        for _ in range(maxn):
            if not s.ev('!!TK'): return
            s.p.evaluate("() => { const k = document.querySelector('.tk-skip'); if (k) k.click(); else { const w = document.querySelector('.tk-win'); w && w.click(); } }")
            s.p.wait_for_timeout(120)
    def actionable(s, ms=8000):
        t0 = time.time()
        while time.time() - t0 < ms / 1000:
            if s.clicks() and not s.p.evaluate('!!document.querySelector(".dsw")'): return True
            s.p.wait_for_timeout(250)
        return False
    def shot(s, name): s.p.screenshot(path=str(OUT / f'{name}.png'))
    def close(s): s.ctx.close()

def setup_morning(g, day=6, money=3000):
    g.ev(f"localStorage.clear(); S = newState(); S.day = {day}; S.money = {money}; S.seen.kaisoFirst = 1; S.seen.kaisoDone = 1; S.today = newDay({day}); S.phase = 'morning'; startMorning(); save(); render(); 0"); g.settle(500); g.skip_talk()
def setup_night(g, day=5, money=3000, pick=False, fast=True, newmon=False):
    extra = "S.seen['mate:minamo'] = 5; S.seen.m9 = 8; " if pick else ''
    g.ev(f"localStorage.clear(); S = newState(); S.day = {day}; S.money = {money}; {extra}S.seenMon = {'[]' if newmon else 'MONSTERS.filter(m => !m.rare).map(m => m.id)'}; S.today = newDay({day}); S.phase = 'night'; bSpeed = {3 if fast else 1}; startNight(); render(); 0"); g.settle(600)
def buys(g, n=4):
    for _ in range(n):
        if g.tap('card', 1): g.settle(120); g.tap('buy', 1); g.settle(120); g.tap('close', 1); g.settle(120)

def leave_ichi(g):
    g.skip_talk()
    if not g.tap('ichiGo', 1): g.ev('ichiGo(); 0')

def drive_to(g, stage):
    """夜を stage まで UI の関数で進める（ichi → pick → arrive → shop）"""
    for _ in range(30):
        st = g.ev('S.night.stage')
        if st == stage and not g.ev('!!TK'): return True
        if g.ev('!!TK'): g.skip_talk(3)
        elif st == 'ichi': leave_ichi(g)
        elif st == 'pick':
            g.tap('pickNext', 1); g.tap('pickB', 1); g.ev('pickGo(); 0')
        elif st == 'arrive': pass
        g.settle(450)
        if stage == 'shop' and g.ev("S.night.stage") == 'shop': g.settle(1400); return True
    return g.ev('S.night.stage') == stage

def reload_check(g, label, expect_same=True, fresh_ok=(), step=True):
    """保存 → ページを読みなおし → つづきから → エラーなし・止まりなし・タイトルにもどらない・次の一歩"""
    sc = g.sc
    n0 = len(ERR)
    pre = g.ev(STATE); g.settle(150)
    g.boot(reload=True)
    st_title = g.ev("S.phase")
    if not g.tap('continue', 3, 30):
        issue(sc, label, 'つづきからが出ていない', json.dumps(g.ev(STATE))); g.shot(f'nocont-{sc}-{label}'); return None
    g.settle(1500)
    post = g.ev(STATE)
    if post['p'] == 'title': issue(sc, label, 'つづきから後もタイトル', pre, post)
    if post['p'] != pre['p'] and not (pre['p'], post['p']) in fresh_ok: issue(sc, label, '場面が変わった', pre, post)
    if post['d'] != pre['d']: issue(sc, label, '日が変わった', pre['d'], post['d'])
    if post['m'] != pre['m']: issue(sc, label, 'お金が変わった', pre['m'], post['m'])
    if pre['st'] and post['st'] != pre['st'] and (pre['st'], post['st']) not in (('roundEnd', 'shop'),): issue(sc, label, '夜の段階が変わった', pre['st'], post['st'])
    if not g.actionable(8000):
        issue(sc, label, 'STUCK 8秒 押せるものがない', json.dumps(g.ev(STATE))); g.shot(f'stuck-{sc}-{label}')
        return post
    g.inv(label)
    if not step:
        if len(ERR) > n0: issue(sc, label, 'エラー', ERR[n0:][:2])
        return post
    # 次の一歩
    g.skip_talk(30); g.settle(300)
    for act in ('nextDay', 'toEvening', 'm-open', 'toResult', 'ichiGo', 'pickGo', 'next', 'bake', 'toShelf'):
        if g.tap(act, 1): break
    g.settle(1200)
    if not g.actionable(8000): issue(sc, label, '次の一歩のあと STUCK', json.dumps(g.ev(STATE))); g.shot(f'stuck2-{sc}-{label}')
    g.inv(label + ' step')
    if len(ERR) > n0: issue(sc, label, 'エラー', ERR[n0:][:2])
    return post

# ---------------------------------------------------------------- 1. せってい
def opt_toggle_all(g, sc):
    g.tap('opt', 1); g.settle(200)
    if not g.p.evaluate("!!document.getElementById('optv')"): issue(sc, 'せっていの窓が出ない'); return
    for k, v in (('bgm', 0), ('se', 0), ('bgm', 1), ('se', 1), ('bgm', 0)):
        g.p.evaluate(f"() => document.querySelector('[data-act=optSet][data-k={k}][data-v=\"{v}\"]').click()"); g.p.wait_for_timeout(80)
    g.inv('opt open')
    r = g.p.evaluate("(() => { const e = document.querySelector('#optv .vclose'); if (!e) return null; const r = e.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; })()")
    if r: g.p.mouse.click(r[0], r[1])
    g.settle(250)
    if g.p.evaluate("!!document.getElementById('optv')"): issue(sc, '×で窓が閉じない')
def sc_opt(b):
    g = G(b, 'opt')
    # 1a タイトル（セーブあり）
    g.ev("localStorage.clear(); S = newState(); S.day = 3; S.money = 1234; S.today = newDay(3); S.phase = 'morning'; startMorning(); save(); 0"); g.boot(reload=True)
    opt_toggle_all(g, 'opt')
    sv = json.loads(g.ev("localStorage.getItem('mazemaze-okashiya')") or 'null')
    if not sv or (sv['phase'], sv['day'], sv['money']) != ('morning', 3, 1234): issue('opt', 'タイトルのせっていでセーブが変わった', sv and (sv.get('phase'), sv.get('day'), sv.get('money')))
    elif sv.get('opt') != {'bgm': False, 'se': True}: issue('opt', 'せっていが保存されない', sv.get('opt'))
    g.boot(reload=True); g.tap('continue', 3)
    g.settle(1200); print('title→continue', g.ev(STATE), g.ev('S.opt'))
    if g.ev('[S.phase,S.day,S.money]') != ['morning', 3, 1234]: issue('opt', 'つづきから後の状態', g.ev('[S.phase,S.day,S.money]'))
    if g.ev('S.opt.bgm') is not False: issue('opt', 'つづきから後 BGMオフが戻った', g.ev('S.opt'))
    g.inv('continue')
    # 続けて遊べる・その後のセーブでもオフのまま
    g.skip_talk(); g.tap('m-zakka', 1); g.settle(300); g.tap('m-kitchen', 1); g.settle(300)
    g.boot(reload=True); g.tap('continue', 3); g.settle(1000)
    if g.ev('S.opt.bgm') is not False or g.ev('S.day') != 3: issue('opt', '遊んだあとも保存されない', g.ev('[S.day,S.opt]'))
    # 1b セーブなしのタイトル → はじめる：せっていが引きつがれるか
    g.ev("localStorage.clear(); 0"); g.boot(reload=True); opt_toggle_all(g, 'opt-nosave')
    g.tap('start', 1); g.settle(1500)
    print('nosave: toggle then start -> opt', g.ev('S.opt'), 'phase', g.ev('S.phase'))
    if g.ev('S.opt.bgm') is not False: issue('opt', 'セーブなしでBGMオフ→はじめる で、せっていが消えた', g.ev('S.opt'))
    g.close()
    # 1c まとめ画面
    g = G(b, 'opt-result')
    g.ev("localStorage.clear(); S = newState(); S.day = 6; S.money = 3000; S.today = newDay(6); S.phase = 'result'; save(); render(); 0"); g.settle(800); g.skip_talk()
    if not g.has('opt'): issue('opt-result', 'まとめにせっていが出ない')
    else:
        opt_toggle_all(g, 'opt-result')
        if g.ev('[S.phase,S.day,S.money]') != ['result', 6, 3000]: issue('opt-result', '状態が変わった', g.ev('[S.phase,S.day,S.money]'))
        g.tap('nextDay', 1); g.settle(5500); g.skip_talk()
        print('result→', g.ev(STATE), g.ev('S.opt'))
        if g.ev('[S.phase,S.day]') != ['morning', 7]: issue('opt-result', '次の日にならない', g.ev('[S.phase,S.day]'))
        g.boot(reload=True); g.tap('continue', 3); g.settle(1200)
        if g.ev('S.opt.bgm') is not False or g.ev('S.day') != 7: issue('opt-result', '保存されない', g.ev('[S.day,S.opt]'))
    # 1d ほかの画面に せってい があるか
    seen = {}
    for ph, js in (('morning', "S.phase='morning'; startMorning(); render()"), ('day', None), ('night', "startNight(); render()")):
        if js: g.ev(f"S.day=6; S.today = newDay(6); {js}; 0"); g.settle(600); g.skip_talk(); seen[ph] = g.has('opt')
    print('opt button elsewhere', seen)
    g.close()

def sc_reset(b):
    g = G(b, 'reset')
    g.ev("localStorage.clear(); S = newState(); S.day = 9; S.money = 7777; S.today = newDay(9); S.phase = 'morning'; startMorning(); save(); 0"); g.boot(reload=True)
    g.tap('opt', 1); g.settle(200); g.tap('reset', 1); g.settle(200)
    if not g.has('resetNo'): issue('reset', '1回目で確認が出ない')
    g.tap('resetNo', 1); g.settle(200)
    if g.ev('[S.phase]') != ['title']: issue('reset', 'やめる で場面が変わった')
    g.boot(reload=True); g.tap('continue', 1); g.settle(800)
    if g.ev('[S.day,S.money]') != [9, 7777]: issue('reset', 'やめる のあとセーブが変わった', g.ev('[S.day,S.money]'))
    g.boot(reload=True)
    g.tap('opt', 1); g.settle(200); g.tap('reset', 1); g.settle(200); g.tap('reset', 1); g.settle(2500)
    st = g.ev(STATE); print('reset ->', st)
    if (st['p'], st['d']) != ('prologue', 1): issue('reset', 'はじめから で1日目プロローグにならない', st)
    g.inv('reset'); g.close()

# ---------------------------------------------------------------- 2. 全場面リロード
def sc_reload(b):
    sc = 'reload'
    def mk(): return G(b, sc)
    # プロローグ
    g = mk(); g.ev("localStorage.clear(); 0"); g.boot(reload=True); g.tap('start', 1); g.settle(2500)
    for _ in range(3): g.p.mouse.click(VW / 2, VH - 90); g.p.wait_for_timeout(200)
    print('prologue', g.ev(STATE)); reload_check(g, 'prologue-mid'); g.close()
    # 朝
    for v, act in (('kitchen', None), ('display', 'm-disp'), ('zakka', 'm-zakka')):
        g = mk(); setup_morning(g)
        if act: g.tap(act, 1); g.settle(400)
        print('morning', v, g.ev('mState().view')); reload_check(g, 'morning-' + v)
        if g.ev('mState().view') != v: issue(sc, 'morning-' + v, '見ていた画面が戻らない', g.ev('mState().view'))
        g.close()
    # 昼
    g = mk(); setup_morning(g)
    g.ev("(() => { const a = shopMats(); mixTwo(a[0], a[1]); return 0; })()")
    for _ in range(40):
        if not g.ev('mBusy'): break
        g.settle(300)
    g.ev("(() => { mAutoArrange(); const M = mState(); if (!M.kanban) { const s = S.shelf.find(x => x.n > 0) || M.baked[0]; if (s) M.kanban = s.key; } save(); render(); return 0; })()")
    reload_check(g, 'morning-baked')
    g.tap('m-disp', 1); g.settle(300); g.tap('m-open', 1, 40); g.settle(1500); g.skip_talk()
    print('day', g.ev(STATE), 'dayRun', g.ev('JSON.stringify(S.dayRun&&{o:S.dayRun.open,d:S.dayRun.done})'))
    reload_check(g, 'day-start', step=False)
    g.ev('daySpeed = 3; 0'); g.settle(2500)
    reload_check(g, 'day-mid', step=False)
    g.ev('daySpeed = 40; 0')
    for _ in range(30):
        if g.has('toEvening'): break
        g.settle(500)
    reload_check(g, 'day-closed', step=False)
    if g.has('toEvening') or g.ev('S.phase') == 'day':
        g.boot(reload=True); g.tap('continue', 3); g.settle(1200); g.skip_talk(); g.ev('daySpeed = 40; 0')
        for _ in range(30):
            if g.has('toEvening'): break
            g.settle(500)
        g.tap('toEvening', 1); g.settle(700); print('during d→n disc', g.ev(STATE), g.p.evaluate('!!document.querySelector(".dsw")'))
        reload_check(g, 'dn-disc-day→night', fresh_ok=(('day', 'night'),))
    g.close()
    # 夜：ichi
    g = mk(); setup_night(g, 12, 20000); g.skip_talk(); print('ichi', g.ev('S.night.stage'))
    if g.ev('S.night.stage') == 'ichi':
        g.tap('ichiV', 1); g.tap('ichiBuy', 1); g.settle(300); reload_check(g, 'night-ichi')
    else: issue(sc, 'ichi', '夜市が出なかった（day12）')
    g.close()
    # arrive（ビルドは1つ＝day5）
    g = mk(); setup_night(g, 5, 3000, fast=False, newmon=True)
    for _ in range(80):
        if g.ev('S.night.stage') == 'ichi': leave_ichi(g)
        if g.ev('S.night.stage') == 'arrive': break
        g.p.wait_for_timeout(100)
    g.p.wait_for_timeout(600)
    print('arrive?', g.ev(STATE)); reload_check(g, 'night-arrive'); g.close()
    # pick
    g = mk(); setup_night(g, 12, 20000, pick=True); g.skip_talk()
    for _ in range(6):
        if g.ev('S.night.stage') == 'ichi': leave_ichi(g); g.settle(500)
        if g.ev('S.night.stage') == 'arrive': g.skip_talk(6); g.settle(500)
        if g.ev('S.night.stage') == 'pick': break
    print('pick?', g.ev(STATE), g.ev('openBuilds().length'))
    if g.ev('S.night.stage') == 'pick': reload_check(g, 'night-pick')
    else: issue(sc, 'pick', '選ぶ画面に行けない', g.ev(STATE))
    g.close()
    # shop r1 / r5 / battle / roundEnd / thanks / end
    g = mk(); setup_night(g, 5); drive_to(g, 'shop'); g.ev("S.night.picks = 0; S.night.coins = 30; save(); 0")
    print('shop', g.ev(STATE)); reload_check(g, 'shop-r1')
    g.ev("S.night.round = 5; S.night.coins = 20; S.night.picks = 0; rollShop(); save(); renderNight(); 0"); g.settle(500); g.skip_talk()
    reload_check(g, 'shop-r5')
    g.skip_talk(); g.ev("bSpeed=3; 0"); buys(g, 4)
    print('board', g.ev('S.night.board.filter(Boolean).length'), 'coins', g.ev('S.night.coins'))
    if not g.ev('S.night.board.some(Boolean)'): g.ev("(() => { for (let i = 0; i < N.shop.length; i++) buy(i); return 0; })()"); g.ev('save(); 0')
    g.ev('bSpeed = 1; 0'); g.tap('bake', 1)
    for _ in range(30):
        if g.ev('fighting') or g.ev('busy'): break
        g.p.wait_for_timeout(100)
    g.settle(400); print('battle', g.ev(STATE), g.ev('fighting'), g.ev('busy'))
    reload_check(g, 'battle-mid', step=False)
    g.ev('bSpeed=3; 0')
    for _ in range(60):
        if g.ev('S.phase') == 'night' and g.ev('S.night.stage') == 'roundEnd': break
        if g.ev('!!TK'): g.skip_talk(3)
        elif g.ev('S.night.stage') == 'shop' and not g.ev('fighting') and not g.ev('busy'): buys(g, 2); g.tap('bake', 1)
        g.settle(500)
    print('roundEnd?', g.ev(STATE))
    if g.ev('S.night.stage') == 'roundEnd': reload_check(g, 'roundEnd')
    g.close()
    for stg in ('thanks', 'end'):
        g = mk(); setup_night(g, 5); drive_to(g, 'shop')
        g.ev(f"S.night.round = 9; S.night.stage = '{stg}'; S.today.satisfied = true; save(); renderNight(); 0"); g.settle(800)
        print(stg, g.ev(STATE)); reload_check(g, stg); g.close()
    # result / 夜→朝の円盤
    g = mk(); g.ev("localStorage.clear(); S = newState(); S.day = 6; S.money = 3000; S.today = newDay(6); S.phase = 'result'; save(); render(); 0"); g.settle(800); g.skip_talk()
    reload_check(g, 'result')
    g.skip_talk(); g.tap('nextDay', 1); g.settle(700); print('n→m disc', g.ev(STATE), g.p.evaluate('!!document.querySelector(".dsw")'))
    reload_check(g, 'dn-disc-night→morning', fresh_ok=(('result', 'morning'), ('morning', 'result')))
    g.close()

# ---------------------------------------------------------------- 3. 幕
def sc_curtain(b):
    sc = 'curtain'
    for pick, day in ((False, 5), (True, 12)):
        tag = 'pick' if pick else 'nopick'
        g = G(b, sc + '-' + tag); setup_night(g, day, 20000, pick=pick, fast=False, newmon=True)
        for _ in range(6):
            if g.ev('S.night.stage') == 'ichi': leave_ichi(g); g.settle(500)
        for _ in range(80):
            if g.ev('S.night.stage') in ('arrive', 'pick'): break
            g.p.wait_for_timeout(60)
        g.p.wait_for_timeout(200)
        st = g.ev('S.night.stage'); print(tag, 'stage', st)
        def check_curtain(where):
            c = g.p.evaluate("!!document.getElementById('curtain') && !!document.querySelector('#stage.curt, #stage .curtain')"); bn = g.ev('bgmName()')
            if not c: issue(sc, tag, where, '幕がない', json.dumps(g.ev(STATE)))
            if bn != 'raiten': issue(sc, tag, where, 'bgmName=', bn, '（raiten のはず）')
            if g.p.evaluate("!!document.querySelector('.shopov')"): issue(sc, tag, where, '幕の前にショップが出ている')
        check_curtain(st)
        if pick and st == 'arrive':   # まず来店の会話を終えて pick へ
            g.skip_talk(30); g.settle(1500); st = g.ev('S.night.stage'); print('→', st)
        if st == 'pick':
            check_curtain('pick')
            for _ in range(4): g.tap('pickNext', 1); g.tap('pickB', 1); g.settle(100)
            g.ev('pickGo(); 0'); g.settle(300)
            if g.ev('S.night.stage') == 'pick': g.ev('pickGo(); 0'); g.settle(500)
        g.settle(500)
        if g.ev('S.night.stage') != 'arrive': issue(sc, tag, 'arrive に入れない', g.ev(STATE)); g.close(); continue
        check_curtain('arrive-after-pick' if pick else 'arrive')
        # 会話をさいごまで → 幕が開く
        g.p.evaluate("() => { window.__shopN = 0; new MutationObserver(() => { const n = document.querySelectorAll('.shopov').length; if (n > window.__shopN) window.__shopN = n; }).observe(document.body, { childList: true, subtree: true }); }")
        n0 = len(ERR)
        for _ in range(40):
            if not g.ev('!!TK'): break
            g.p.evaluate("() => { const k = document.querySelector('.tk-skip'); k && k.click(); }"); g.p.wait_for_timeout(100)
        t0 = time.time()
        # 幕が開くあいだ：あちこちを連打
        for k in range(30):
            g.p.mouse.click(30 + (k * 53) % (VW - 60), 40 + (k * 97) % (VH - 80)); g.p.wait_for_timeout(25)
        gone = None
        for _ in range(60):
            if not g.p.evaluate("!!document.getElementById('curtain')"): gone = time.time() - t0; break
            g.p.wait_for_timeout(100)
        print(tag, 'curtain gone after', gone)
        if gone is None or gone > 2.5: issue(sc, tag, '幕が2秒たっても消えない', gone); g.shot(f'curtain-{tag}')
        g.settle(1500)
        n_sh = g.p.evaluate("document.querySelectorAll('.shopov').length")
        if n_sh != 1: issue(sc, tag, 'shopov の数', n_sh, 'max', g.p.evaluate('window.__shopN'))
        bn = g.ev('bgmName()')
        if not str(bn).startswith('yoru-'): issue(sc, tag, '幕のあとの曲', bn)
        if g.ev('S.night.stage') != 'shop' or g.ev('curtainT'): issue(sc, tag, '幕のあと', g.ev(STATE), 'curtainT', g.ev('curtainT'))
        g.inv('after curtain')
        if len(ERR) > n0: issue(sc, tag, 'エラー', ERR[n0:][:2])
        g.close()
    # 開くとちゅうでリロード
    g = G(b, sc + '-reload'); setup_night(g, 5, 3000, fast=False)
    for _ in range(6):
        if g.ev('S.night.stage') == 'ichi': leave_ichi(g); g.settle(500)
    g.settle(500)
    for _ in range(40):
        if not g.ev('!!TK'): break
        g.p.evaluate("() => { const k = document.querySelector('.tk-skip'); k && k.click(); }"); g.p.wait_for_timeout(100)
    for _ in range(60):
        if g.ev('curtainT') or g.ev('S.night.stage') == 'shop': break
        g.p.evaluate("() => { const k = document.querySelector('.tk-skip'); k && k.click(); }"); g.p.wait_for_timeout(30)
    print('reload during opening: curtainT', g.ev('curtainT'), g.ev(STATE))
    g.p.wait_for_timeout(250)
    reload_check(g, 'curtain-opening')
    g.settle(1500)
    if not g.p.evaluate("!!document.querySelector('.shopov')"): issue(sc, 'reload-opening', '再開後ショップが出ない', g.ev(STATE))
    if g.p.evaluate("!!document.getElementById('curtain')"): issue(sc, 'reload-opening', '再開後も幕が残る')
    g.close()

SC = dict(opt=sc_opt, reset=sc_reset, reload=sc_reload, curtain=sc_curtain)
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
    for k in (SC if WHICH == ['all'] else WHICH):
        print('=== ', k, VW, VH, flush=True)
        try: SC[k](b)
        except Exception as e: issue(k, 'HARNESS EXC', repr(e)[:250])
    b.close()
print('ERRORS', json.dumps(ERR, ensure_ascii=False)); print('ISSUES', len(ISS))
