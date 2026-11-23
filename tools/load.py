"""起動の重さ（11/23 総デバッグ）：回線をしぼって（帯域をみんなで分けあう）index.html（工房の形・http）とアーティファクトを開く・CPU 4倍おそく
使い方：python3 -I tools/load.py . <build.mjs --artifact のフォルダ> [Mbps=9] [rtt_ms=60] [index,artifact] [順番の数]"""
import sys, time, pathlib, mimetypes, collections, asyncio
from playwright.async_api import async_playwright
ROOT=pathlib.Path(sys.argv[1]); A=pathlib.Path(sys.argv[2]); MB=float(sys.argv[3]) if len(sys.argv)>3 else 9; RTT=float(sys.argv[4]) if len(sys.argv)>4 else 60
MODES=sys.argv[5].split(',') if len(sys.argv)>5 else ['index','artifact']; NSHOW=int(sys.argv[6]) if len(sys.argv)>6 else 0
async def run(mode):
    got=[]; t0=time.time(); active=[]; BW=MB*1e6/8
    async def link():
        last=time.time()
        while True:
            await asyncio.sleep(0.01); now=time.time(); dt=now-last; last=now
            ready=[x for x in active if now>=x['start']]
            if ready:
                share=BW*dt/len(ready)
                for x in ready: x['left']-=share
            for x in [x for x in active if x['left']<=0]:
                active.remove(x); x['fut'].set_result(True)
    lt=asyncio.create_task(link())
    async def handle(route):
        url=route.request.url
        if 'fonts.g' in url: return await route.abort()
        u=url.split('://x.test/')[-1].split('?')[0]
        if mode=='index': f=ROOT/'index.html' if u=='' else ROOT/u
        else: f=A/'okashi.html' if u=='' else (A/u if (A/u).exists() else (ROOT/'assets'/'art'/u if (ROOT/'assets'/'art'/u).exists() else ROOT/'assets'/u))
        if not f.exists(): return await route.fulfill(status=404, body='')
        body=f.read_bytes()
        if f.name=='okashi.html': body=('<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'+body.decode()).encode()
        fut=asyncio.get_event_loop().create_future(); tr=time.time()-t0
        active.append({'left':len(body),'start':time.time()+RTT/1000,'fut':fut}); await fut
        got.append((tr, time.time()-t0, f.name, len(body)))
        await route.fulfill(status=200, body=body, content_type=mimetypes.guess_type(f.name)[0] or 'application/octet-stream')
    async with async_playwright() as p:
        b=await p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required']); ctx=await b.new_context(viewport={'width':390,'height':674}, device_scale_factor=3)
        pg=await ctx.new_page(); errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        cdp=await ctx.new_cdp_session(pg); await cdp.send('Emulation.setCPUThrottlingRate',{'rate':4})
        await pg.route('**/*', handle)
        t0=time.time(); await pg.goto('http://x.test/')
        await pg.wait_for_function('!!document.querySelector("#screen [data-act=continue], #screen [data-act=start]")', timeout=90000, polling=50)
        t_title=time.time()-t0
        await pg.wait_for_function('[...document.querySelectorAll("#screen img")].every(i => i.complete && i.naturalWidth)', timeout=90000, polling=50)
        t_img=time.time()-t0
        b_title=sum(x[3] for x in got if x[1]<=t_img)
        # 「つづきから」を押せるまで（ためしのページは UI のまとめ）
        try: await pg.wait_for_function('typeof artBlobs === "undefined" || true', timeout=1000)
        except Exception: pass
        await pg.wait_for_timeout(12000)
        tot=sum(x[3] for x in got); big=collections.Counter()
        for _,_,n,l in got: big[n]+=l
        if NSHOW: print('   順番:', ' | '.join(f'{a:.1f}→{c:.1f} {n}' for a,c,n,l in sorted(got)[:NSHOW]))
        pk=[c for a,c,n,l in got if n=='art-pack.webp']
        await b.close()
    lt.cancel()
    print(f"{mode}: タイトル {t_title:.2f}s・絵まで {t_img:.2f}s・それまで {b_title/1e6:.2f}MB・ui のまとめ {pk[0] if pk else 0:.2f}s／12秒で {tot/1e6:.2f}MB {len(got)}こ・err {errs[:2]}")
    print('   大きい:', ', '.join(f"{n} {l/1e6:.2f}" for n,l in big.most_common(5)))
async def main():
    for m in MODES: await run(m)
asyncio.run(main())
