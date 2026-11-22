"""何日も続けて遊ぶ点検（11/21 総デバッグ・リーダー）：タイトル → プロローグ → 朝 → 昼 → 夜 → まとめ → 次の日 を、何日も通しで。
使い方：W=390 H=674 python3 -I tools/days.py . <出すフォルダ> [日数=22] [たね=1] > <出すフォルダ>/days.json
  - 会話はスキップのボタンで進める（さいごまで読んだのと同じ done が呼ばれる）
  - 朝：モンスター素材を先に、材料を2つずつ まぜて焼く（mixTwo）→ 棚に並べる（mAutoArrange）→ 開店（mOpen）。お金があれば雑貨屋の立て看板・ショーケースも買う
  - 昼：はやおくり（daySpeed）で閉店まで → 夕方へ（data-act="toEvening"）
  - 夜：使えるビルドを順番にえらぶ → ラウンドは演出なしで計算（買えるカードを左から置くだけ → resolveRound → finishRound → nextRound）。
    4日目からは 9ラウンドめのあとに おなかいっぱいにして「大満足」にする（レアのお客さん → 仲間の来店 → 新しいビルド の流れを見るため）。
    夜の演出とドラッグの点検は tools/play.py
  - ときどき ページを読みなおして「つづきから」（3・9・15日目は夜のラウンド4・6日目は朝に焼いたあと・12日目は昼の開店前）
  - 見るもの：JS のエラー・画面の字の undefined／NaN・お金と倉庫の数・日がすすむか・止まり（20秒なにも変わらない）・ビルドがひらく日・仲間が来た日
  - お金をはかる（11/22 夜・夜市の値段合わせ）：PRE='<JS>'＝はじめにその状態から（例：40日目・家具ぜんぶ・評判400 → 企画メモ）／GOOD=1＝予報のお客さんのすきな味と人気の素材をねらって焼く／
    ICHI3=1＝毎晩 安い順に3まい買う（その日の rec の ichi＝[まい数, 払った円]）／NOICHI=1＝夜市で買わない。1日のかせぎ＝sales −（きのうの money − きょうの money0）
  - 出るもの：標準出力に JSON（errors・issues・days）と、5日ごとのまとめのスクショ
"""
import sys, os, json, re, time, random, pathlib
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(sys.argv[1]).resolve()
OUT = pathlib.Path(sys.argv[2]); OUT.mkdir(parents=True, exist_ok=True)
DAYS = int(sys.argv[3]) if len(sys.argv) > 3 else 22
SEED = int(sys.argv[4]) if len(sys.argv) > 4 else 1
VW, VH = int(os.environ.get('W', 390)), int(os.environ.get('H', 674))
FORCE_FROM = 4                                   # この日から 夜を大満足に
RELOAD_NIGHT = {3, 9, 15}; RELOAD_MORNING = {6}; RELOAD_DAY = {12}

html = (ROOT / 'index.html').read_text()
html = html.replace('<head>', f'<head><base href="file://{ROOT}/">', 1)
i = html.rfind('})();')
tmp = OUT / '_days.html'
tmp.write_text(html[:i] + f"window.__ev = s => eval(s); Math.random = (() => {{ let s = {SEED} * 2654435761 >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }})();\n" + html[i:])

ST = r"""({ phase: S.phase, day: S.day, money: S.money, talk: talking(), busy: typeof busy !== 'undefined' && busy,
  stage: S.night && S.phase === 'night' ? S.night.stage : null, round: S.night ? S.night.round : 0, build: S.night ? S.night.build : null,
  open: openBuilds(), mBusy: typeof mBusy !== 'undefined' && mBusy,
  run: S.dayRun ? { open: S.dayRun.open, done: S.dayRun.done, kan: S.dayRun.kanban } : null,
  mates: Object.keys(S.seen || {}).filter(k => k.startsWith('mate:')).map(k => k.slice(5) + '@' + S.seen[k]),
  stock: S.stock, shelf: (S.shelf || []).filter(s => s.n > 0).length })"""
BAD = r"""(() => { const t = document.body.innerText; const m = t.match(/undefined|NaN|\[object|Infinity/);
  const out = []; if (m) out.push('字:' + m[0] + ' @ ' + t.slice(Math.max(0, m.index - 30), m.index + 30).replace(/\s+/g, ' '));
  if (!Number.isFinite(S.money) || S.money < 0) out.push('お金:' + S.money);
  for (const [k, v] of Object.entries(S.stock || {})) if (!Number.isInteger(v) || v <= 0) out.push('倉庫:' + k + '=' + v);
  return out; })()"""
BAKE = r"""(() => { if (mBusy) return 'busy'; if (!shelfRoom()) return 'full';
  const mon = Object.keys(S.stock).filter(m => isMonMat(m) && S.stock[m] > 0), basic = shopMats();
  const r = L => L[Math.floor(Math.random() * L.length)];
  const a = mon[0] || r(basic), b = mon[1] || r(basic), c = mCost([a, b]);
  if (c == null || c > S.money) return 'poor';
  mixTwo(a, b); return 'bake:' + a + '+' + b; })()"""
if os.environ.get('GOOD'):   # 上手なお店：予報のお客さんのすきな味と人気の素材をねらって焼く
    BAKE = r"""(() => { if (mBusy) return 'busy'; if (!shelfRoom()) return 'full';
  const fc = S.seen['fc:' + S.day] || {}, basic = shopMats(), mon = Object.keys(S.stock).filter(m => isMonMat(m) && S.stock[m] > 0);
  const want = [fc.m, ...(CUST_LIKES[fc.c] || [])].filter(m => m && basic.includes(m));
  const r = L => L[Math.floor(Math.random() * L.length)];
  for (let k = 0; k < 12; k++) {
    const a = mon[0] || r(want.length && k < 8 ? want : basic), b = mon[1] || r(basic), c = mCost([a, b]);
    if (c == null) continue; if (c > S.money) return 'poor';
    mixTwo(a, b); return 'bake:' + a + '+' + b;
  }
  return 'poor'; })()"""
GOODS_BUY = r"""(() => { const got = [];
  for (const id of ['showcase', 'tatekanban']) { const p = goodNext(id); if (p != null && S.money - p >= 1500) { buyGood(id); got.push(id); } }
  return got; })()"""
OPEN = r"""(() => { mAutoArrange(); const M = mState(); if (!M.kanban) { const s = S.shelf.find(x => x.n > 0) || M.baked[0]; if (s) M.kanban = s.key; } mOpen(); return S.phase; })()"""
ROUND = r"""(() => { if (N.stage !== 'shop' || busy) return 'wait';
  for (let g = 0; g < 12; g++) {
    let did = false;
    for (let i = 0; i < N.shop.length; i++) {
      if (!N.shop[i] || N.board.every(Boolean) && !cardDef(N.shop[i]).field) continue;
      const k = JSON.stringify([N.board, N.coins, N.picks, N.field]); buy(i);
      if (JSON.stringify([N.board, N.coins, N.picks, N.field]) !== k) did = true;
    }
    if (!did) break;
  }
  const res = resolveRound(); finishRound(res); return 'r' + N.round + ':' + res.total; })()"""

report = {'errors': [], 'issues': [], 'days': [], 'size': f'{VW}x{VH}', 'seed': SEED}
def issue(*a): report['issues'].append(' '.join(str(x) for x in a)[:300])

with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
    ctx = b.new_context(viewport={'width': VW, 'height': VH}, device_scale_factor=1, is_mobile=True, has_touch=True)
    page = ctx.new_page()
    page.route(re.compile(r'https?://.*'), lambda r: r.abort())
    page.on('pageerror', lambda e: report['errors'].append(f'd{cur["day"]} {cur["phase"]}: ' + str(e)[:300]))
    page.on('console', lambda m: m.type == 'error' and not re.search(r'mp3|bgm|snd|Failed to load resource|net::|CORS policy', m.text) and report['errors'].append(f'd{cur["day"]} console: ' + m.text[:200]))
    cur = {'day': 0, 'phase': 'boot'}
    def ev(code): return page.evaluate(f'() => window.__ev({json.dumps(code)})')
    def boot():
        page.goto('file://' + str(tmp), wait_until='domcontentloaded')
        page.wait_for_function('typeof window.__ev === "function" && !!document.querySelector("[data-act]")', polling=100, timeout=20000)
        page.wait_for_timeout(500)
    def click(sel):
        el = page.query_selector(sel)
        if el and el.is_visible(): el.click(force=True); return True
        return False
    def reload(where):
        before = ev('JSON.stringify({ p: S.phase, d: S.day, r: S.night && S.night.round, b: S.night && S.night.board, m: S.money })')
        boot()
        if not click('[data-act=continue]'): issue('つづきから のボタンがない', where); return
        page.wait_for_timeout(900)
        after = ev('JSON.stringify({ p: S.phase, d: S.day, r: S.night && S.night.round, b: S.night && S.night.board, m: S.money })')
        if before != after: issue('読みなおしで かわった', where, before[:160], '→', after[:160])
    boot(); localst = ev('(localStorage.clear(), 0)'); boot()
    if os.environ.get('PRE'): print('PRE', ev(os.environ['PRE'] + '; JSON.stringify([S.day, S.phase])'), file=sys.stderr, flush=True); page.wait_for_timeout(800)
    else: click('[data-act=start]')
    done_day, baked_day, opened_day, night_reload, morning_reload, day_reload = 0, 0, 0, set(), set(), set()
    last_sig, last_change, t0 = '', time.time(), time.time()
    rec = None
    while True:
        st = ev(ST); cur.update(day=st['day'], phase=st['phase'])
        sig = json.dumps([st['phase'], st['day'], st['stage'], st['round'], st['talk'], st['run'], st['shelf'], st['money']])
        if sig != last_sig: last_sig, last_change = sig, time.time()
        elif time.time() - last_change > 20:
            issue('止まり', json.dumps(st, ensure_ascii=False)[:250]); page.screenshot(path=str(OUT / f'stuck-d{st["day"]}.png'))
            if st['phase'] == 'night' and st['stage'] == 'thanks' and not st['talk']: ev('goResult()')
            elif st['phase'] == 'day': ev('goEvening()')
            else: break
            last_change = time.time()
        if time.time() - t0 > 60 * 45: issue('時間切れ'); break
        for x in ev(BAD): issue(f'd{st["day"]} {st["phase"]}', x)
        if st['talk']:
            if not click('.talk .tk-skip'): page.mouse.click(VW / 2, VH * .85)
            page.wait_for_timeout(450); continue
        ph = st['phase']
        if ph == 'title': click('[data-act=start]')
        elif ph == 'prologue': pass
        elif ph == 'morning':
            if st['mBusy']: page.wait_for_timeout(300); continue
            if baked_day != st['day']:
                r = ev(BAKE)
                if r.startswith('bake'): page.wait_for_timeout(200); continue
                baked_day = st['day']; rec = {'day': st['day'], 'money0': st['money'], 'goods': ev(GOODS_BUY)}
                if st['day'] in RELOAD_MORNING and st['day'] not in morning_reload: morning_reload.add(st['day']); reload(f'd{st["day"]} 朝')
                continue
            ev(OPEN); page.wait_for_timeout(600)
        elif ph == 'day':
            run = st['run'] or {}
            if not run.get('open') and not run.get('done'):
                if st['day'] in RELOAD_DAY and st['day'] not in day_reload: day_reload.add(st['day']); reload(f'd{st["day"]} 昼'); continue
                if not click('[data-act=d-open]'):
                    if not click('[data-act=d-pick]'): ev('openDay()')
                page.wait_for_timeout(400); continue
            if run.get('open') and not run.get('done'): ev('daySpeed = 40'); page.wait_for_timeout(500); continue
            page.wait_for_timeout(1200)
            if not click('[data-act=toEvening]'): ev('goEvening()')
            page.wait_for_timeout(800)
        elif ph == 'night':
            sg = st['stage']
            if sg == 'ichi':   # 夜市（11/22 夜）：1日おきに1まい目を大きく見て買う → お店へ
                if os.environ.get('ICHI3'): rec['ichi'] = ev("(() => { const m0 = S.money; for (const it of ichiStock().items.slice().sort((a, b) => a.price - b.price).slice(0, 3)) ichiPick(it.id); return [N.ichi.length, m0 - S.money]; })()")
                elif not os.environ.get('NOICHI') and st['day'] % 2 == 0 and click('.ich-it'):
                    page.wait_for_timeout(300); click('.vbtns [data-act=ichiBuy]'); page.wait_for_timeout(300)
                if not click('[data-act=ichiGo]'): ev('ichiGo()')
                page.wait_for_timeout(600)
            elif sg == 'pick':
                L = st['open']; bd = L[st['day'] % len(L)]
                ev(f'pickBuild({json.dumps(bd)}); pickGo()'); page.wait_for_timeout(600)
            elif sg == 'arrive': page.wait_for_timeout(400)
            elif sg == 'shop':
                if st['busy']: page.wait_for_timeout(300); continue
                if st['round'] == 4 and st['day'] in RELOAD_NIGHT and st['day'] not in night_reload:
                    night_reload.add(st['day']); reload(f'd{st["day"]} 夜 r4'); continue
                ev(ROUND); page.wait_for_timeout(150)
            elif sg == 'roundEnd':
                if st['round'] == 9 and st['day'] >= FORCE_FROM: ev('N.score = Math.max(N.score, nightHP(S.day))')
                ev('nextRound()'); page.wait_for_timeout(250)
            elif sg in ('thanks', 'end'):
                page.wait_for_timeout(900)
                if not ev('talking()'): click('[data-act=toResult]')
        elif ph == 'result':
            if done_day != st['day']:
                done_day = st['day']
                t = ev('JSON.stringify({ mon: S.today.mon, build: S.night && S.night.build, score: S.today.score, belly: S.today.belly, mood: S.today.mood, sales: S.today.sales, hearts: S.today.hearts, coins: S.today.coins, money: S.money, rep: S.rep })')
                r2 = dict(rec or {'day': st['day']}); r2.update(json.loads(t)); r2.update(open=st['open'], mates=st['mates'])
                report['days'].append(r2)
                if st['day'] % 5 == 0: page.screenshot(path=str(OUT / f'result-d{st["day"]}.png'))
                if st['day'] >= DAYS: break
            page.wait_for_timeout(500)
            if not click('[data-act=nextDay]'): ev('nextDay()')
            page.wait_for_timeout(800)
        else:
            issue('知らない画面', ph); page.wait_for_timeout(500)
        page.wait_for_timeout(120)
    b.close()
print(json.dumps(report, ensure_ascii=False, indent=1))
