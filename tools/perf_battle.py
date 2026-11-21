"""夜のバトルの重さをはかる（tools/perf.py は昼のチャットの場面ごとの点検）（11/21 夜 しょーくん「軽量化と最適化」）：ためしのページ（--artifact で作ったフォルダ）をスマホのまねで開く
使い方：node tools/build.mjs --artifact <フォルダ>/okashi.html → python3 -I tools/perf_battle.py <フォルダ> [ビルド=cookie] [名前=now]
- CPU 4倍おそく・390×674・DPR 3。起動の絵が出るまでの秒・起動6秒で読んだ量／夜（20日目）に★2・★3を置いて おもてなし！1回：
  fps・50/100ms をこえたこま・長い処理・スタイルの再計算・JS のメモリ・DOM・アニメの数・プロファイルの重い関数。<フォルダ>/perf-<ビルド>-<名前>.json
"""
import pathlib, mimetypes, json, time, sys, collections
from playwright.sync_api import sync_playwright
ROOT=pathlib.Path(__file__).resolve().parent.parent
A=pathlib.Path(sys.argv[1]).resolve(); SP=str(A)+'/'   # build.mjs --artifact <フォルダ>/okashi.html のフォルダ
R=ROOT/'assets'/'art'; BG=ROOT/'assets'
BUILD=sys.argv[2] if len(sys.argv)>2 else 'cookie'; TAG=sys.argv[3] if len(sys.argv)>3 else 'now'
stat=collections.Counter(); bytes_=collections.Counter()
def handle(route):
    url=route.request.url
    if 'fonts.g' in url: return route.abort()
    u=url.split('://x.test/')[-1].split('?')[0]
    f=A/'okashi.html' if u=='' else (A/u if (A/u).exists() else (R/u if (R/u).exists() else BG/u))
    if not f.exists(): stat['404']+=1; return route.fulfill(status=404, body='')
    body=f.read_bytes()
    if f.name=='okashi.html':
        h=f.read_text(); body=('<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'+h).encode()
    if f.name=='app.js':
        t=body.decode(); i=t.rfind('})();'); body=(t[:i]+"\nwindow.__ev = s => eval(s);\n"+t[i:]).encode()
    kind='pack' if 'pack' in f.name else f.suffix
    stat[kind]+=1; bytes_[kind]+=len(body)
    route.fulfill(status=200, body=body, content_type=mimetypes.guess_type(f.name)[0] or 'application/octet-stream')
out={}
with sync_playwright() as p:
    b=p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required']); ctx=b.new_context(viewport={'width':390,'height':674}, device_scale_factor=3)
    pg=ctx.new_page(); errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
    cdp=ctx.new_cdp_session(pg); cdp.send('Emulation.setCPUThrottlingRate',{'rate':4}); cdp.send('Performance.enable')
    pg.route('**/*', handle)
    t0=time.time(); pg.goto('http://x.test/')
    pg.wait_for_function('document.querySelector("#screen") && document.querySelector("#screen").children.length > 0', timeout=60000)
    out['startup_render_s']=round(time.time()-t0,2)
    pg.wait_for_function('typeof window.__ev === "function"')
    ev=lambda c: pg.evaluate('s => window.__ev(s)', '(() => { '+c+' })()')
    pg.wait_for_timeout(6000)
    out['startup_bytes']={k:round(v/1e6,2) for k,v in bytes_.items()}; out['startup_files']=dict(stat)
    m=lambda: {x['name']:x['value'] for x in cdp.send('Performance.getMetrics')['metrics']}
    m0=m(); out['heap_after_start_MB']=round(m0['JSHeapUsedSize']/1e6,1)
    # 夜へ
    ev(f"localStorage.clear(); S = newState(); S.day = 20; S.today = newDay(20); startNight()"); pg.wait_for_timeout(2500)
    ev(f"talkClose(true); if (N.stage === 'pick') {{ pickBuild('{BUILD}'); pickGo(); }}"); pg.wait_for_timeout(2500)
    ev("""talkClose(true); document.querySelectorAll('.talk').forEach(e=>e.remove());
      const B = BUILDS[N.build], C = CHEFS[B.chef], ones = [...new Set([...B.doughs, ...C.common])];
      const T2 = []; for (const a of ones) for (const b of ones) { try { if (mixable(cardDef(a), cardDef(b))) T2.push(mixCid(a, b)); } catch (e) {} }
      const doughs = T2.filter(c => { try { return cardDef(c).dough; } catch (e) { return false; } });
      const S3 = []; for (const a of doughs) for (const b of doughs) { try { if (mixable(cardDef(a), cardDef(b))) { S3.push(mixCid(a, b)); if (S3.length > 3) break; } } catch (e) {} }
      const pick = [...S3.slice(0, 2), ...T2.slice(0, 3)];
      N.board = pick.slice(0, 5).map(cid => ({ cid, cook: 3 })); N.picks = 0; N.stage = 'shop'; renderNight();""")
    pg.wait_for_timeout(2000)
    ev("""window.__fr = []; let last = performance.now(); const loop = t => { window.__fr.push(t - last); last = t; if (window.__frOn) requestAnimationFrame(loop); }; window.__frOn = true; requestAnimationFrame(loop);
      window.__lt = []; try { new PerformanceObserver(l => l.getEntries().forEach(e => window.__lt.push(e.duration))).observe({ entryTypes: ['longtask'] }); } catch (e) {}""")
    cdp.send('Profiler.enable'); cdp.send('Profiler.setSamplingInterval',{'interval':500}); cdp.send('Profiler.start')
    m1=m(); t1=time.time()
    ev("omotenashi()")
    maxdom=0; maxanim=0
    for k in range(400):
        pg.wait_for_timeout(250)
        st=ev("return [N.stage, fighting, document.getElementsByTagName('*').length, document.getAnimations().length]")
        maxdom=max(maxdom,st[2]); maxanim=max(maxanim,st[3])
        if not st[1] and time.time()-t1>3: break
    prof=cdp.send('Profiler.stop')['profile']; m2=m()
    dur=time.time()-t1
    fr=ev("window.__frOn = false; return window.__fr"); lt=ev("return window.__lt")
    out['battle_s']=round(dur,1); out['frames']=len(fr); out['fps_avg']=round(len(fr)/dur,1)
    out['frames_over_50ms']=sum(1 for x in fr if x>50); out['frames_over_100ms']=sum(1 for x in fr if x>100); out['worst_frame_ms']=round(max(fr),0)
    out['longtasks']=len(lt); out['longtask_total_ms']=round(sum(lt))
    for k in ('LayoutCount','RecalcStyleCount','LayoutDuration','RecalcStyleDuration','ScriptDuration','TaskDuration'):
        out['d_'+k]=round(m2[k]-m1[k],2)
    out['heap_MB']=round(m2['JSHeapUsedSize']/1e6,1); out['max_dom']=maxdom; out['max_anims']=maxanim; out['errors']=errs[:3]
    # プロファイル：自分の時間の多い関数
    nodes={n['id']:n for n in prof['nodes']}; self_t=collections.Counter()
    ts=prof['timeDeltas']
    for sid,dt in zip(prof['samples'],ts):
        n=nodes[sid]; cf=n['callFrame']; self_t[(cf['functionName'] or '(anon)')+':'+str(cf['lineNumber'])]+=dt
    tot=sum(self_t.values())
    out['hot']=[(k,round(v/1000)) for k,v in self_t.most_common(14)]
    out['prof_total_ms']=round(tot/1000)
    b.close()
json.dump(out,open(SP+f'perf-{BUILD}-{TAG}.json','w'),ensure_ascii=False,indent=0)
print(json.dumps(out,ensure_ascii=False))
