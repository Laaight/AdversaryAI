const fs = require('fs');
const path = require('path');

const srcJsPath = path.join(__dirname, '../frontend/dist/app/assets/index-V8_photoreal.js');
let js = fs.readFileSync(srcJsPath, 'utf8').replace(/\r\n/g, '\n');

console.log('Original JS size (V8):', js.length);

// 1. Replace LivingPortraitAvatar with the pristine framing & dynamic audio-reactive waveform engine
const oldLpStart = 'class LivingPortraitAvatar{';
const oldLpEnd = 'function createDebateAvatar(canvas,options={}){';

const oldLpIdx = js.indexOf(oldLpStart);
const oldLpEndIdx = js.indexOf(oldLpEnd);

if (oldLpIdx === -1 || oldLpEndIdx === -1) {
  throw new Error('LivingPortraitAvatar boundaries not found');
}

const newLivingPortrait = `class LivingPortraitAvatar{
  constructor(canvas,figureId,options={}){
    this.canvas=canvas;
    this.ctx=canvas.getContext("2d");
    this.figureId=figureId;
    this.options=options;
    this.disposed=false;
    this.img=new Image();
    this.loaded=false;
    this.speaking=false;
    this.audioDriven=false;
    this.audioCtx=null;
    this.analyser=null;
    this.freqData=null;
    this.raf=0;
    this.audioLevel=0;
    this.targetAudioLevel=0;
    this.headTilt=0;
    this.headDrift=0;
    this.startTime=performance.now();
    this.visemeTimer=null;
    this.bars=Array(20).fill(0);
    this.img.crossOrigin="anonymous";
    this.img.src=\`/img/figures/\${figureId}.jpg\`;
    this.img.onload=()=>{this.loaded=true;this.resize();};
    this.img.onerror=()=>{console.warn("[LivingPortraitAvatar] Portrait not found: "+figureId);};
    this.resize=()=>{
      if(this.disposed)return;
      const dpr=Math.min(window.devicePixelRatio||1,2);
      const w=this.canvas.clientWidth||340;
      const h=this.canvas.clientHeight||425;
      if(this.canvas.width!==Math.round(w*dpr)||this.canvas.height!==Math.round(h*dpr)){
        this.canvas.width=Math.round(w*dpr);
        this.canvas.height=Math.round(h*dpr);
      }
    };
    this.resizeObserver=new ResizeObserver(()=>this.resize());
    this.resizeObserver.observe(canvas);
    this.updateStatus=()=>{
      const dot=document.querySelector("#avatar-status-dot");
      const txt=document.querySelector("#avatar-status-text");
      if(dot&&txt){
        if(this.speaking){
          dot.className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse";
          txt.textContent="Speaking";
          txt.className="text-amber-300 font-semibold";
        }else{
          dot.className="w-1.5 h-1.5 rounded-full bg-emerald-400";
          txt.textContent="Listening";
          txt.className="text-emerald-300 font-medium";
        }
      }
    };
    this.loop=()=>{
      if(this.disposed)return;
      this.raf=requestAnimationFrame(this.loop);
      this.update();
      this.render();
    };
    this.loop();
  }
  setSpeaking(val){
    this.speaking=Boolean(val);
    if(!this.speaking){this.targetAudioLevel=0;}
    this.updateStatus();
  }
  pushViseme(visemeId){
    this.speaking=true;
    const v=Number(visemeId)||0;
    this.targetAudioLevel=v>0?(0.55+Math.random()*0.45):0;
    clearTimeout(this.visemeTimer);
    this.visemeTimer=setTimeout(()=>{this.targetAudioLevel=0;},120);
    this.updateStatus();
  }
  setSpeakingExact(p){
    this.speaking=true;
    this.targetAudioLevel=0.7;
    this.updateStatus();
  }
  setSpeakingFromAudio(audioEl){
    this.stopAudioDrive();
    try{
      if(!this.audioCtx){
        const AC=window.AudioContext||window.webkitAudioContext;
        this.audioCtx=new AC();
      }
      if(this.audioCtx.state==="running"){
        const src=this.audioCtx.createMediaElementSource(audioEl);
        const an=this.audioCtx.createAnalyser();
        an.fftSize=256;
        an.smoothingTimeConstant=0.35;
        src.connect(an);
        an.connect(this.audioCtx.destination);
        this.analyser=an;
        this.freqData=new Uint8Array(an.frequencyBinCount);
        this.audioDriven=true;
      }else{
        this.audioCtx.resume().catch(()=>{});
      }
    }catch(e){}
    this.speaking=true;
    this.updateStatus();
  }
  stopAudioDrive(){
    this.audioDriven=false;
    this.analyser=null;
    this.freqData=null;
    this.targetAudioLevel=0;
    this.updateStatus();
  }
  nod(){
    this.headTilt=2.2;
    setTimeout(()=>{this.headTilt=-1.2;},180);
    setTimeout(()=>{this.headTilt=0;},360);
  }
  stop(){
    this.setSpeaking(false);
    this.stopAudioDrive();
    this.updateStatus();
  }
  dispose(){
    this.disposed=true;
    cancelAnimationFrame(this.raf);
    this.resizeObserver?.disconnect();
    this.stopAudioDrive();
  }
  update(){
    const now=performance.now();
    const elapsed=(now-this.startTime)/1000;
    if(this.audioDriven&&this.analyser&&this.freqData){
      this.analyser.getByteFrequencyData(this.freqData);
      let sum=0;
      for(let i=1;i<21;i++){
        const norm=this.freqData[i]/255;
        this.bars[i-1]+=(norm-this.bars[i-1])*0.35;
        sum+=norm;
      }
      const avg=sum/20;
      this.targetAudioLevel=avg>0.08?avg*1.4:0;
    }else if(this.speaking){
      for(let i=0;i<20;i++){
        const wave=(Math.sin(elapsed*8+i*0.5)*0.5+0.5)*this.targetAudioLevel;
        this.bars[i]+=(wave-this.bars[i])*0.3;
      }
    }else{
      for(let i=0;i<20;i++){
        const idle=(Math.sin(elapsed*2+i*0.4)*0.08+0.08);
        this.bars[i]+=(idle-this.bars[i])*0.15;
      }
    }
    this.audioLevel+=(this.targetAudioLevel-this.audioLevel)*0.25;
    this.headDrift=Math.sin(elapsed*1.5)*0.8;
  }
  render(){
    const{ctx,canvas}=this;
    if(!ctx||!this.loaded)return;
    const w=canvas.width;
    const h=canvas.height;
    ctx.clearRect(0,0,w,h);
    ctx.fillStyle="#07080b";
    ctx.fillRect(0,0,w,h);
    const imgW=this.img.width;
    const imgH=this.img.height;
    const imgRatio=imgW/imgH;
    const canvasRatio=w/h;
    let renderW,renderH,offsetX,offsetY;
    if(canvasRatio>imgRatio){
      renderW=w;
      renderH=w/imgRatio;
      offsetX=0;
      offsetY=Math.max(h-renderH,Math.min(0,(h-renderH)*0.28));
    }else{
      renderH=h;
      renderW=h*imgRatio;
      offsetX=(w-renderW)/2;
      offsetY=0;
    }
    const breathScale=1.0+Math.sin(performance.now()*0.0016)*0.003+(this.speaking?this.audioLevel*0.005:0);
    const cx=w/2;
    const cy=h/2;
    ctx.save();
    ctx.translate(cx,cy+this.headDrift);
    ctx.scale(breathScale,breathScale);
    if(this.headTilt!==0){ctx.rotate((this.headTilt*Math.PI)/180);}
    ctx.translate(-cx,-cy);
    ctx.drawImage(this.img,offsetX,offsetY,renderW,renderH);
    ctx.restore();
    const grad=ctx.createRadialGradient(cx,cy,Math.min(w,h)*0.45,cx,cy,Math.max(w,h)*0.78);
    grad.addColorStop(0,"rgba(7,8,11,0)");
    grad.addColorStop(0.65,"rgba(7,8,11,0.35)");
    grad.addColorStop(1,"rgba(7,8,11,0.98)");
    ctx.fillStyle=grad;
    ctx.fillRect(0,0,w,h);
    if(this.speaking&&this.audioLevel>0.05){
      const glowAlpha=Math.min(0.28,this.audioLevel*0.3);
      const glowGrad=ctx.createRadialGradient(cx,cy*0.85,20,cx,cy,Math.max(w,h)*0.7);
      glowGrad.addColorStop(0,\`rgba(245,158,11,\${glowAlpha})\`);
      glowGrad.addColorStop(0.6,\`rgba(239,68,68,\${glowAlpha*0.4})\`);
      glowGrad.addColorStop(1,"rgba(0,0,0,0)");
      ctx.fillStyle=glowGrad;
      ctx.fillRect(0,0,w,h);
    }
    const barCount=this.bars.length;
    const maxBarH=h*0.16;
    const totalW=w*0.72;
    const barSpacing=totalW/barCount;
    const barW=Math.max(2.5,barSpacing*0.55);
    const startX=(w-totalW)/2;
    const baseY=h-(h*0.05);
    ctx.save();
    for(let i=0;i<barCount;i++){
      const val=Math.max(0.06,this.bars[i]);
      const barH=val*maxBarH;
      const x=startX+i*barSpacing;
      const y=baseY-barH;
      const barGrad=ctx.createLinearGradient(0,y,0,baseY);
      if(this.speaking){
        barGrad.addColorStop(0,"#fde68a");
        barGrad.addColorStop(0.6,"#f59e0b");
        barGrad.addColorStop(1,"rgba(245,158,11,0.2)");
      }else{
        barGrad.addColorStop(0,"#93c5fd");
        barGrad.addColorStop(1,"rgba(59,130,246,0.15)");
      }
      ctx.fillStyle=barGrad;
      ctx.beginPath();
      ctx.roundRect(x,y,barW,barH,[barW/2,barW/2,0,0]);
      ctx.fill();
    }
    ctx.restore();
  }
}
`;

js = js.slice(0, oldLpIdx) + newLivingPortrait + js.slice(oldLpEndIdx);
console.log('1. Replaced LivingPortraitAvatar with audio visualizer & proper portrait framing.');

// 2. Overhaul ix HTML template: move opponent header ABOVE avatar, set proper aspect ratio, fix buttons and badges
const oldIxTmplStart = 'function ix(i,e,t){i.innerHTML=`';
const oldIxTmplEnd = ';const n=createDebateAvatar(';

const ixStartIdx = js.indexOf(oldIxTmplStart);
const ixEndIdx = js.indexOf(oldIxTmplEnd);

if (ixStartIdx === -1 || ixEndIdx === -1) {
  throw new Error('ix template boundaries not found');
}

const newIxTemplate = `function ix(i,e,t){i.innerHTML=\`
    <div class="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-4 sm:gap-6">
      <div class="lg:sticky lg:top-20 self-start">
        <div class="flex items-center justify-between gap-2 mb-2 px-1">
          <div class="flex items-center gap-2 min-w-0">
            <span class="text-sm sm:text-base font-bold text-white truncate">\${t.modeIcon?xt(t.modeIcon)+" ":""}\${xt(t.personaLabel)}</span>
            <span class="text-[10px] text-slate-400 uppercase font-semibold tracking-wider shrink-0">\${xt(t.modeName)}</span>
          </div>
          \${t.figureId?\`<span class="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 shadow-sm flex items-center gap-1.5 shrink-0 whitespace-nowrap"><span class="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>Real Likeness HD</span>\`:\`<span class="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 shadow-sm flex items-center gap-1.5 shrink-0 whitespace-nowrap"><span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>Photoreal HD</span>\`}
        </div>

        <div class="relative rounded-2xl border border-ink-700 bg-gradient-to-b from-ink-800 to-ink-900 overflow-hidden shadow-xl">
          <div class="aspect-[4/5] max-h-[300px] sm:max-h-[380px] lg:max-h-none lg:aspect-[4/5] w-full">
            <canvas id="avatar-canvas" class="avatar-canvas w-full h-full block"></canvas>
          </div>
          <div id="avatar-status-pill" class="absolute bottom-2.5 right-2.5 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/75 backdrop-blur-md border border-white/10 text-[10px] font-semibold text-slate-300 pointer-events-none">
            <span id="avatar-status-dot" class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span id="avatar-status-text">Ready</span>
          </div>
          <div id="voice-note" class="hidden absolute bottom-2.5 left-2.5 right-24 text-[11px] text-center text-slate-300 bg-black/80 backdrop-blur-md border border-ink-700 rounded-lg px-2 py-1">
            Text only for this reply.
          </div>
        </div>

        <div class="grid grid-cols-3 gap-2 mt-3">
          <button id="replay-btn" disabled class="h-10 px-2 rounded-xl border border-ink-700 bg-ink-900 text-xs sm:text-sm font-semibold text-slate-300 hover:border-slate-500 hover:text-white disabled:opacity-40 disabled:hover:border-ink-700 transition-all flex items-center justify-center gap-1">
            ↻ Replay
          </button>
          <button id="stop-btn" disabled class="h-10 px-2 rounded-xl border border-ink-700 bg-ink-900 text-xs sm:text-sm font-semibold text-slate-300 hover:border-slate-500 hover:text-white disabled:opacity-40 disabled:hover:border-ink-700 transition-all flex items-center justify-center gap-1">
            ■ Stop
          </button>
          <button id="end-btn" class="h-10 px-2 rounded-xl bg-red-900/50 border border-red-800/80 text-xs sm:text-sm text-red-200 hover:bg-red-800 hover:text-white font-semibold shadow-sm transition-all flex items-center justify-center gap-1 whitespace-nowrap">
            End &amp; Grade
          </button>
        </div>
      </div>

      <div class="flex flex-col lg:min-h-[60vh]">
        <div class="mb-3 sm:mb-4">
          <div class="flex items-center justify-between flex-wrap gap-2 mb-1.5">
            <p class="text-accent-400 text-xs font-semibold uppercase tracking-widest">\${xt(t.modeName)}</p>
            <div class="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <span id="spar-phase-badge" class="whitespace-nowrap inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/15 border border-blue-500/30 text-blue-300 shrink-0">🎙️ Phase 1: Opening</span>
              <span id="spar-round-badge" class="whitespace-nowrap inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-accent-500/15 border border-accent-500/30 text-accent-300 shrink-0">🥊 Round <span id="spar-cur-round">1</span>\${t.targetRounds ? " / " + t.targetRounds : " (Freestyle)"}</span>
              <span id="spar-wallet-badge" class="whitespace-nowrap inline-flex items-center px-2 py-1 rounded-full text-[11px] font-medium bg-ink-800 border border-ink-700 text-slate-400 shrink-0"></span>
            </div>
          </div>
          <h1 class="font-display text-lg sm:text-2xl text-white font-bold leading-snug">\${xt(t.topic||"Live session")}</h1>
          <div id="spar-target-reached-banner" class="hidden mt-2 p-2.5 rounded-xl bg-accent-500/15 border border-accent-500/30 text-accent-300 text-xs flex items-center justify-between">
            <span>🎯 Target rounds completed! Ready for your verdict, or keep sparring freely.</span>
            <button type="button" id="banner-score-btn" class="underline font-bold ml-2 cursor-pointer whitespace-nowrap">Get Scorecard →</button>
          </div>
        </div>
        <div id="transcript" class="transcript-scroll flex-1 overflow-y-auto space-y-3 pr-1 max-h-[46vh] lg:max-h-[52vh] min-h-0 lg:min-h-[200px]"></div>
        <div id="quota-slot"></div>
        <div class="mt-4">
          <div class="flex gap-2">
            <textarea id="msg-input" rows="2" placeholder="\${xt(t.modeId==="debate"||t.modeId==="historical"?"Deliver your opening constructive statement…":t.modeId==="thesis"?"Deliver your opening defense statement…":"Type your opening point or tap the mic…")}"
              class="flex-1 px-4 py-3 rounded-xl bg-ink-900 border border-ink-700 text-white placeholder-slate-500 focus:outline-none focus:border-accent-500 text-sm resize-none"></textarea>
            <button id="mic-btn" title="Speak your response" aria-label="Speak your response" class="hidden shrink-0 w-11 h-11 self-end items-center justify-center rounded-xl border border-ink-700 hover:border-slate-500 text-slate-300 transition-colors [&>svg]:w-5 [&>svg]:h-5">
              \${it.mic}
            </button>
            <button id="send-btn" class="shrink-0 px-5 rounded-xl bg-accent-500 hover:bg-accent-400 text-[#fff] font-semibold disabled:opacity-60">Send</button>
          </div>
          <p id="mic-hint" class="hidden text-xs text-slate-500 mt-2">Listening… speak now, then tap the mic again to stop.</p>
        </div>
      </div>
    </div>\``;

js = js.slice(0, ixStartIdx) + newIxTemplate + js.slice(ixEndIdx);
console.log('2. Overhauled ix template with clean responsive layout and no overlapping badges.');

// 3. Update updateRoundAndPhase to keep badges concise and whitespace-nowrap
const oldUpdateFn = `const updateRoundAndPhase=()=>{const _crEl=i.querySelector("#spar-cur-round");if(_crEl)_crEl.textContent=_sparCurRound;const _phEl=i.querySelector("#spar-phase-badge");const isDeb=t.modeId==="debate"||t.modeId==="historical"||t.modeId==="thesis"||t.modeId==="sparring";if(_phEl){if(_sparCurRound<=1){_phEl.className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/15 border border-blue-500/30 text-blue-300";_phEl.textContent=isDeb?"🎙️ Phase 1: Opening Statements":"🎙️ Phase 1: Opening";}else if(t.targetRounds&&_sparCurRound>=t.targetRounds){_phEl.className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/15 border border-purple-500/30 text-purple-300";_phEl.textContent=isDeb?"🏛️ Phase 3: Final Closing Arguments":"🏛️ Phase 3: Closing";}else{_phEl.className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-500/15 border border-red-500/30 text-red-300";_phEl.textContent=isDeb?"⚔️ Phase 2: Rebuttal & Cross-Exam":\`🥊 Round \${_sparCurRound} Clash\`;}}if(r){if(_sparCurRound<=1){r.placeholder=isDeb?(g.length===0?"Deliver your opening constructive — state your resolution, definitions, and main arguments…":"Deliver your opening counter-statement — challenge their thesis and state your case…"):"Type your opening statement or tap the mic…";}else if(t.targetRounds&&_sparCurRound>=t.targetRounds){r.placeholder=isDeb?"Deliver your final closing argument — crystalize your key voting issues for the judge…":"Deliver your final closing point…";}else{r.placeholder=isDeb?"Attack their weak premises, challenge evidence, or counter-examine…":"Type your response or tap the mic…";}}};`;

const newUpdateFn = `const updateRoundAndPhase=()=>{const _crEl=i.querySelector("#spar-cur-round");if(_crEl)_crEl.textContent=_sparCurRound;const _phEl=i.querySelector("#spar-phase-badge");const isDeb=t.modeId==="debate"||t.modeId==="historical"||t.modeId==="thesis"||t.modeId==="sparring";if(_phEl){if(_sparCurRound<=1){_phEl.className="whitespace-nowrap inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/15 border border-blue-500/30 text-blue-300 shrink-0";_phEl.textContent=isDeb?"🎙️ Phase 1: Opening":"🎙️ Opening";}else if(t.targetRounds&&_sparCurRound>=t.targetRounds){_phEl.className="whitespace-nowrap inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/15 border border-purple-500/30 text-purple-300 shrink-0";_phEl.textContent=isDeb?"🏛️ Phase 3: Closing":"🏛️ Closing";}else{_phEl.className="whitespace-nowrap inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/15 border border-red-500/30 text-red-300 shrink-0";_phEl.textContent=isDeb?"⚔️ Phase 2: Rebuttal":\`🥊 Round \${_sparCurRound}\`;}}if(r){if(_sparCurRound<=1){r.placeholder=isDeb?(g.length===0?"Deliver your opening constructive — state your resolution, definitions, and main arguments…":"Deliver your opening counter-statement — challenge their thesis and state your case…"):"Type your opening statement or tap the mic…";}else if(t.targetRounds&&_sparCurRound>=t.targetRounds){r.placeholder=isDeb?"Deliver your final closing argument — crystalize your key voting issues for the judge…":"Deliver your final closing point…";}else{r.placeholder=isDeb?"Attack their weak premises, challenge evidence, or counter-examine…":"Type your response or tap the mic…";}}};`;

if (!js.includes(oldUpdateFn)) {
  throw new Error('oldUpdateFn not found');
}
js = js.replace(oldUpdateFn, newUpdateFn);
console.log('3. updateRoundAndPhase updated with clean responsive badge text.');

// Write index-V9_flawless.js and update fallbacks
const outV9JsPath = path.join(__dirname, '../frontend/dist/app/assets/index-V9_flawless.js');
const outV8JsPath = path.join(__dirname, '../frontend/dist/app/assets/index-V8_photoreal.js');
const outV7JsPath = path.join(__dirname, '../frontend/dist/app/assets/index-V7_structure.js');
const outV6JsPath = path.join(__dirname, '../frontend/dist/app/assets/index-V6_arena.js');

fs.writeFileSync(outV9JsPath, js, 'utf8');
fs.writeFileSync(outV8JsPath, js, 'utf8');
fs.writeFileSync(outV7JsPath, js, 'utf8');
fs.writeFileSync(outV6JsPath, js, 'utf8');
console.log('Wrote index-V9_flawless.js and synced V8/V7/V6 JS.');

// CSS sync
const srcCssPath = path.join(__dirname, '../frontend/dist/app/assets/index-V8_photoreal.css');
const css = fs.readFileSync(srcCssPath, 'utf8');
const outV9CssPath = path.join(__dirname, '../frontend/dist/app/assets/index-V9_flawless.css');
fs.writeFileSync(outV9CssPath, css, 'utf8');
console.log('Wrote index-V9_flawless.css.');

// Update index.html
const htmlPath = path.join(__dirname, '../frontend/dist/app/index.html');
let html = fs.readFileSync(htmlPath, 'utf8');
html = html.replace(/index-V[0-9]_[a-zA-Z0-9_-]+\.js/g, 'index-V9_flawless.js');
html = html.replace(/index-V[0-9]_[a-zA-Z0-9_-]+\.css/g, 'index-V9_flawless.css');
fs.writeFileSync(htmlPath, html, 'utf8');
console.log('Updated index.html to index-V9_flawless.');

// Bump service worker version to adversaryai-v10
const swPath = path.join(__dirname, '../frontend/dist/sw.js');
let sw = fs.readFileSync(swPath, 'utf8');
sw = sw.replace(/adversaryai-v[0-9]+/g, 'adversaryai-v10');
fs.writeFileSync(swPath, sw, 'utf8');
console.log('Bumped service worker to adversaryai-v10.');

console.log('ALL FLAWLESS LAYOUT PATCHES COMPLETED SUCCESSFULLY!');
