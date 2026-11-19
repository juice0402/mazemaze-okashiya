#!/usr/bin/env python3
"""まぜまぜおかし屋の BGM を作る（11/19 司令塔が見本の2曲を作った）。
楽譜（下の hiru・yoru）→ MIDI → FluidSynth と FluidR3_GM（楽器の音・MIT）で鳴らす
→ 2回まわした2回目から1ループぶんを切り出す → 音量をそろえて mp3（モノラル・64kbps）。
使い方：python3 tools/bgm/make_bgm.py   （assets/bgm/hiru.mp3・yoru.mp3 を作りなおす）
準備：apt-get install -y fluidsynth fluid-soundfont-gm ／ pip install --break-system-packages midiutil
くわしくは tools/bgm/README.md
"""
import os, random, subprocess, sys, tempfile, re
from midiutil import MIDIFile

ROOT=os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT=os.path.join(ROOT,'assets','bgm')
SF='/usr/share/sounds/sf2/FluidR3_GM.sf2'
TMP=tempfile.mkdtemp(prefix='bgm-')
KBPS=64
# 曲：名前・テンポ・1ループの小節（4拍子）
SONGS={'hiru':(100,16),'yoru':(150,16)}

N={'C':0,'C#':1,'Db':1,'D':2,'D#':3,'Eb':3,'E':4,'F':5,'F#':6,'G':7,'G#':8,'Ab':8,'A':9,'Bb':10,'B':11}
def p(s):
    if s=='r': return None
    name=s[:-1]; o=int(s[-1]); return 12*(o+1)+N[name]
def add_seq(m,tr,ch,start,seq,vel,oct=0):
    t=start
    for note,d in seq:
        n=p(note)
        if n is not None: m.addNote(tr,ch,n+12*oct,t,d*0.95,max(1,min(127,vel+random.randint(-6,6))))
        t+=d
    return t
def chord(root,kind):
    r=p(root); iv={'M':[0,4,7],'m':[0,3,7],'7':[0,4,7,10],'m7':[0,3,7,10]}[kind]; return [r+i for i in iv]

# ---- 1: 昼のお店（F major, 100 BPM）----
def hiru():
    m=MIDIFile(6, deinterleave=False); bpm=100
    for t in range(6): m.addTempo(t,0,bpm)
    prog=[('F3','M'),('D3','m'),('Bb2','M'),('C3','M'),('F3','M'),('A2','m'),('Bb2','M'),('C3','7'),
          ('D3','m'),('A2','m'),('Bb2','M'),('F3','M'),('G2','m'),('C3','M'),('F3','M'),('C3','7')]
    mel=[[('C5',1),('A4',.5),('C5',.5),('F5',1.5),('E5',.5)],[('D5',1),('A4',1),('F4',1.5),('G4',.5)],
         [('A4',1),('Bb4',.5),('A4',.5),('G4',1),('F4',1)],[('E4',1),('G4',1),('C5',2)],
         [('C5',1),('A4',.5),('C5',.5),('F5',1.5),('G5',.5)],[('E5',1),('C5',1),('A4',1.5),('C5',.5)],
         [('D5',1),('Bb4',.5),('D5',.5),('F5',1),('D5',1)],[('C5',1.5),('Bb4',.5),('G4',1),('E4',1)],
         [('F4',1),('A4',1),('D5',1.5),('C5',.5)],[('C5',1),('A4',1),('E4',2)],
         [('F4',1),('Bb4',1),('D5',1),('F5',1)],[('E5',1.5),('D5',.5),('C5',2)],
         [('Bb4',1),('D5',1),('G5',1.5),('F5',.5)],[('E5',1),('G5',1),('C5',1),('E5',1)],
         [('F5',1.5),('E5',.5),('D5',.5),('C5',.5),('A4',1)],[('G4',1),('A4',.5),('Bb4',.5),('G4',1),('r',1)]]
    # ch0 オルゴール / ch1 フルート / ch2 ピチカート / ch3 ベース / ch4 ピアノ / ch9 打楽器
    m.addProgramChange(0,0,0,10); m.addProgramChange(1,1,0,73); m.addProgramChange(2,2,0,45)
    m.addProgramChange(3,3,0,32); m.addProgramChange(4,4,0,0)
    loops=2
    for L in range(loops):
        base=L*64
        for b in range(16):
            t=base+b*4
            if b<8 or L==1: add_seq(m,0,0,t,mel[b],78 if b<8 else 52,oct=(0 if b<8 else 1))
            if b>=8: add_seq(m,1,1,t,mel[b],82)
            r,k=prog[b]; c=chord(r,k)
            for beat in (1,3):
                for n in c: m.addNote(2,2,n+12,t+beat,.4,50+random.randint(-5,5))
            root=c[0]-12; fifth=root+7
            m.addNote(3,3,root,t,.9,80); m.addNote(3,3,fifth if b%2==0 else root+12,t+2,.9,72)
            if b>=8 or L==1:
                arp=[c[0],c[1],c[2],c[1]+12 if len(c)<4 else c[3],c[2]+12,c[1]+12,c[2],c[1]]
                for i,n in enumerate(arp): m.addNote(4,4,n+12,t+i*.5,.45,40+random.randint(-4,4))
            for i in range(8): m.addNote(5,9,70,t+i*.5,.2,(38 if i%2 else 30)+random.randint(-4,4))
            m.addNote(5,9,75,t+3,.2,40)
    end=loops*64
    for n in chord('F3','M'): m.addNote(2,2,n+12,end,2,55)
    m.addNote(3,3,p('F2'),end,3,80); m.addNote(0,0,p('F5'),end,3,80); m.addNote(1,1,p('F5'),end,3,70)
    m.addNote(4,4,p('F4'),end,3,50); m.addNote(4,4,p('A4'),end,3,45); m.addNote(4,4,p('C5'),end,3,45)
    with open(os.path.join(TMP,'hiru.mid'),'wb') as f: m.writeFile(f)

# ---- 2: 夜のバトル（A minor, 150 BPM）----
def yoru():
    m=MIDIFile(6, deinterleave=False); bpm=150
    for t in range(6): m.addTempo(t,0,bpm)
    prog=[('A2','m'),('F2','M'),('G2','M'),('E2','M'),('A2','m'),('F2','M'),('G2','M'),('E2','M'),
          ('D2','m'),('A2','m'),('F2','M'),('E2','M'),('D2','m'),('A2','m'),('E2','M'),('A2','m')]
    b1=[('A4',.5),('C5',.5),('E5',.5),('A5',1),('G5',.5),('E5',1)]
    mel=[b1,[('F5',.5),('E5',.5),('C5',.5),('A4',1),('C5',.5),('F5',1)],
         [('G5',.75),('F5',.25),('E5',.5),('D5',.5),('B4',1),('D5',1)],[('E5',1.5),('G#4',.5),('B4',1),('E5',1)],
         b1,[('F5',.5),('G5',.5),('A5',1),('G5',.5),('F5',.5),('E5',1)],
         [('D5',.5),('E5',.5),('G5',1),('B5',1),('A5',.5),('G5',.5)],[('G#5',1),('E5',1),('B4',1),('G#4',1)],
         [('D5',1),('F5',1),('A5',1.5),('G5',.5)],[('E5',1),('C5',1),('A4',2)],
         [('C5',.5),('D5',.5),('F5',1),('A5',1),('F5',1)],[('G#5',2),('B5',2)],
         [('A5',.5),('G5',.5),('F5',.5),('E5',.5),('D5',1),('F5',1)],[('E5',.5),('D5',.5),('C5',.5),('B4',.5),('A4',1),('C5',1)],
         [('B4',.5),('C5',.5),('D5',.5),('E5',.5),('G#5',1),('B5',1)],[('A5',2),('r',2)]]
    # ch0 リード / ch1 ブラス / ch2 ストリングス / ch3 ベース / ch4 シロフォン / ch9 ドラム
    m.addProgramChange(0,0,0,80); m.addProgramChange(1,1,0,61); m.addProgramChange(2,2,0,48)
    m.addProgramChange(3,3,0,33); m.addProgramChange(4,4,0,13)
    loops=2
    for L in range(loops):
        base=L*64
        for b in range(16):
            t=base+b*4
            add_seq(m,0,0,t,mel[b],70)
            if b>=8: add_seq(m,1,1,t,mel[b],72,oct=-1)
            if L==1 and b<8: add_seq(m,4,4,t,mel[b],60,oct=1)
            r,k=prog[b]; c=chord(r,k)
            for n in c: m.addNote(2,2,n+12,t,4,48)
            for i in range(8): m.addNote(3,3,c[0]+(12 if i%2 else 0),t+i*.5,.42,92+random.randint(-5,5))
            if b>=8:
                for n in c: m.addNote(1,1,n+12,t+1.5,.3,70); m.addNote(1,1,n+12,t+3,.3,75)
            for i in range(8): m.addNote(5,9,42,t+i*.5,.2,(58 if i%2 else 72)+random.randint(-5,5))
            for k_ in (0,2,2.5): m.addNote(5,9,36,t+k_,.3,100)
            for s in (1,3): m.addNote(5,9,38,t+s,.3,95)
            if b in (0,8): m.addNote(5,9,49,t,1,95)
            if b in (7,15):
                for i,d in enumerate((45,45,43,43)): m.addNote(5,9,d,t+2+i*.5,.3,90)
    end=loops*64
    for n in chord('A2','m'): m.addNote(2,2,n+12,end,3,60); m.addNote(1,1,n+12,end,2,80)
    m.addNote(3,3,p('A1'),end,2,100); m.addNote(0,0,p('A5'),end,2,80)
    m.addNote(5,9,49,end,2,100); m.addNote(5,9,36,end,.5,110)
    with open(os.path.join(TMP,'yoru.mid'),'wb') as f: m.writeFile(f)


def run(cmd):
    r=subprocess.run(cmd,capture_output=True,text=True)
    if r.returncode!=0: sys.exit(f"失敗：{' '.join(cmd[:2])}\n{r.stderr[-400:]}")
    return r

def render(name):
    bpm,bars=SONGS[name]
    loop=bars*4*60/bpm
    mid=os.path.join(TMP,name+'.mid'); wav=os.path.join(TMP,name+'.wav'); cut=os.path.join(TMP,name+'_loop.wav')
    run(['fluidsynth','-ni','-q','-g','0.6','-r','44100','-F',wav,SF,mid])
    # 2回目のループ（はじめに1回目の余韻が入る＝くり返してもつながる）を、モノラルで切り出す
    run(['ffmpeg','-y','-loglevel','error','-i',wav,'-ss',str(loop),'-t',str(loop),'-ac','1','-ar','44100',cut])
    vd=run(['ffmpeg','-i',cut,'-af','volumedetect','-f','null','-'])
    mx=float(re.search(r'max_volume: ([-0-9.]+)',vd.stderr).group(1))
    gain=round(-1.5-mx,2)  # 山を -1.5dB に（音量は一定のまま上げる＝つなぎ目がずれない）
    out=os.path.join(OUT,name+'.mp3')
    run(['ffmpeg','-y','-loglevel','error','-i',cut,'-af',f'volume={gain}dB,afade=t=in:d=0.003,afade=t=out:st={loop-0.003}:d=0.003',
         '-codec:a','libmp3lame','-b:a',f'{KBPS}k',out])
    print(f'{name}: {loop:.1f}秒・{os.path.getsize(out)//1024}KB → {os.path.relpath(out,ROOT)}')

if __name__=='__main__':
    if not os.path.exists(SF): sys.exit('楽器の音がない：apt-get install -y fluidsynth fluid-soundfont-gm')
    os.makedirs(OUT,exist_ok=True)
    random.seed(7)  # 同じ音の強さのゆらぎで作りなおせるように（hiru → yoru の順で作る）
    hiru(); yoru()
    for n in SONGS: render(n)
