const fs = require('fs');
const path = require('path');

const srcJsPath = path.join(__dirname, '../frontend/dist/app/assets/index-V7_structure.js');
let js = fs.readFileSync(srcJsPath, 'utf8').replace(/\r\n/g, '\n');

console.log('Original JS size (V7):', js.length);

// 1. Setup figure card with authentic portrait, gold badge, and Real Likeness indicator
const origYh = `function yh(i){return\`
    <div class="figure-card persona-card text-left rounded-2xl border border-ink-700 bg-ink-900 p-5 cursor-pointer hover:border-slate-500 transition-all"
      data-figure-id="\${dt(i.id)}" role="button" tabindex="0" aria-pressed="false">
      <div class="flex items-baseline justify-between gap-2 mb-1">
        <div class="font-semibold text-white">\${dt(i.name)}</div>
        <div class="text-xs text-slate-500 shrink-0">\${dt(i.era)}</div>
      </div>
      <p class="text-sm text-slate-400 leading-relaxed mb-3">\${dt(i.bio)}</p>
      <button type="button" data-suggest="\${dt(i.id)}"
        class="text-xs px-3 py-1.5 rounded-lg border border-ink-700 text-accent-400 hover:border-accent-500/60 hover:bg-accent-500/10">
        Use suggested topic
      </button>
    </div>\`}`;

const newYh = `function yh(i){return\`
    <div class="figure-card persona-card text-left rounded-2xl border border-ink-700 bg-ink-900 p-5 cursor-pointer hover:border-slate-500 transition-all flex flex-col justify-between"
      data-figure-id="\${dt(i.id)}" role="button" tabindex="0" aria-pressed="false">
      <div>
        <div class="flex items-center gap-3.5 mb-3">
          <div class="relative shrink-0 w-14 h-14 rounded-full overflow-hidden border-2 border-amber-500/50 shadow-md shadow-amber-500/10 bg-ink-950">
            <img src="/img/figures/\${dt(i.id)}.jpg" alt="\${dt(i.name)}" class="w-full h-full object-cover object-top" onerror="this.style.display='none'" />
            <span class="absolute bottom-0 inset-x-0 bg-black/80 text-[8px] font-black text-amber-300 text-center tracking-tighter uppercase py-0.5">REAL</span>
          </div>
          <div class="min-w-0">
            <div class="font-semibold text-white text-base leading-tight truncate">\${dt(i.name)}</div>
            <div class="text-xs text-amber-400/90 font-medium mt-0.5 leading-snug">\${dt(i.era)}</div>
          </div>
        </div>
        <p class="text-sm text-slate-400 leading-relaxed mb-3">\${dt(i.bio)}</p>
      </div>
      <div class="pt-2 flex items-center justify-between border-t border-ink-800/80 gap-2">
        <span class="text-[11px] font-medium text-emerald-400 flex items-center gap-1.5 shrink-0">
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          Real Likeness HD
        </span>
        <button type="button" data-suggest="\${dt(i.id)}"
          class="text-xs px-2.5 py-1 rounded-lg border border-ink-700 text-accent-400 hover:border-accent-500/60 hover:bg-accent-500/10 transition-colors">
          Suggested topic &rarr;
        </button>
      </div>
    </div>\`}`;

if (!js.includes(origYh)) throw new Error('origYh not found');
js = js.replace(origYh, newYh);
console.log('1. Setup figure cards with portraits patched.');

// 2. Setup start button: preserve figureId in bh session metadata
const origBhCall = `bh(V,{modeId:s.id,modeName:s.name,modeIcon:s.icon,topic:O,personaLabel:C,judgeEnabled:q,personaVisual:y.model,targetRounds:_selRounds,firstSpeaker:_selSpeaker,resolvedFirstSpeaker:_startRes.resolvedFirstSpeaker||_selSpeaker,debateStyle:_startRes.debateStyle||_selStyle})`;

const newBhCall = `bh(V,{modeId:s.id,modeName:s.name,modeIcon:s.icon,topic:O,personaLabel:C,judgeEnabled:q,personaVisual:y.model,targetRounds:_selRounds,firstSpeaker:_selSpeaker,resolvedFirstSpeaker:_startRes.resolvedFirstSpeaker||_selSpeaker,debateStyle:_startRes.debateStyle||_selStyle,figureId:(s.id==="historical"?(c||T.figureId):void 0)})`;

if (!js.includes(origBhCall)) throw new Error('origBhCall not found');
js = js.replace(origBhCall, newBhCall);
console.log('2. bh figureId persistence patched.');

// 3. nx(i) update: read figureId
const origNx = `return{modeId:n.mode||"debate",modeName:s,modeIcon:r,topic:n.topic,personaLabel:n.personaLabel||s,judgeEnabled:n.judgeEnabled===!0,personaVisual:n.personaVisual||void 0,targetRounds:n.targetRounds||0,firstSpeaker:n.firstSpeaker||"user",resolvedFirstSpeaker:n.resolvedFirstSpeaker||"user",debateStyle:n.debateStyle||"oxford"}`;

const newNx = `const _nSetup=n.setup_json?(typeof n.setup_json==="string"?JSON.parse(n.setup_json):n.setup_json):{};const _figId=n.figureId||_nSetup.figureId||(s==="historical"?n.personality:void 0);return{modeId:n.mode||"debate",modeName:s,modeIcon:r,topic:n.topic,personaLabel:n.personaLabel||s,judgeEnabled:n.judgeEnabled===!0,personaVisual:n.personaVisual||void 0,targetRounds:n.targetRounds||0,firstSpeaker:n.firstSpeaker||"user",resolvedFirstSpeaker:n.resolvedFirstSpeaker||"user",debateStyle:n.debateStyle||"oxford",figureId:_figId||void 0}`;

if (!js.includes(origNx)) throw new Error('origNx not found');
js = js.replace(origNx, newNx);
console.log('3. nx(i) session loader patched with figureId.');

// 4. Avatar frame badges in ix: Show Real Likeness HD for historical, Photoreal HD for others
const origFrameBadge = `<span class="text-xs font-semibold px-2.5 py-1 rounded-full bg-ink-950/70 border border-ink-700 text-slate-200">\${t.modeIcon?xt(t.modeIcon)+" ":""}\${xt(t.personaLabel)}</span>`;

const newFrameBadge = `<span class="text-xs font-semibold px-2.5 py-1 rounded-full bg-ink-950/80 border border-ink-700 text-slate-200 shadow-md backdrop-blur-sm">\${t.modeIcon?xt(t.modeIcon)+" ":""}\${xt(t.personaLabel)}</span>\${t.figureId?\`<span class="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 shadow-sm flex items-center gap-1.5 backdrop-blur-sm"><span class="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>👑 Real Likeness HD</span>\`:\`<span class="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 shadow-sm flex items-center gap-1.5 backdrop-blur-sm"><span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>💎 Photoreal HD</span>\`}`;

if (!js.includes(origFrameBadge)) throw new Error('origFrameBadge not found');
js = js.replace(origFrameBadge, newFrameBadge);
console.log('4. Avatar frame badges patched.');

// 5. LivingPortraitAvatar Class & createDebateAvatar Factory definition
const livingPortraitCode = `
class LivingPortraitAvatar{
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
    this.jawOpen=0;
    this.targetJaw=0;
    this.mouthStretch=0;
    this.targetStretch=0;
    this.blinkProgress=0;
    this.isBlinking=false;
    this.lastBlinkAt=performance.now();
    this.nextBlinkDelay=3200+Math.random()*2500;
    this.headTilt=0;
    this.headDrift=0;
    this.startTime=performance.now();
    this.visemeTimer=null;
    this.img.crossOrigin="anonymous";
    this.img.src=\`/img/figures/\${figureId}.jpg\`;
    this.img.onload=()=>{this.loaded=true;this.resize();};
    this.img.onerror=()=>{console.warn("[LivingPortraitAvatar] Portrait image not loaded for "+figureId);};
    this.resize=()=>{
      if(this.disposed)return;
      const dpr=Math.min(window.devicePixelRatio||1,2);
      const w=this.canvas.clientWidth||360;
      const h=this.canvas.clientHeight||450;
      if(this.canvas.width!==w*dpr||this.canvas.height!==h*dpr){
        this.canvas.width=w*dpr;
        this.canvas.height=h*dpr;
      }
    };
    this.resizeObserver=new ResizeObserver(()=>this.resize());
    this.resizeObserver.observe(canvas);
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
    if(!this.speaking){this.targetJaw=0;this.targetStretch=0;}
  }
  pushViseme(visemeId){
    this.speaking=true;
    const v=Number(visemeId)||0;
    if(v===0){
      this.targetJaw=0;this.targetStretch=0;
    }else if(v===1||v===2||v===3){
      this.targetJaw=20;this.targetStretch=3;
    }else if(v===4||v===5||v===6){
      this.targetJaw=14;this.targetStretch=-6;
    }else if(v===7||v===8){
      this.targetJaw=10;this.targetStretch=5;
    }else if(v===9||v===10){
      this.targetJaw=12;this.targetStretch=9;
    }else if(v===17||v===18){
      this.targetJaw=1;this.targetStretch=2;
    }else{
      this.targetJaw=8+(v%7);this.targetStretch=(v%5)-2;
    }
    clearTimeout(this.visemeTimer);
    this.visemeTimer=setTimeout(()=>{this.targetJaw=0;this.targetStretch=0;},130);
  }
  setSpeakingExact(p){this.speaking=true;}
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
        an.fftSize=512;
        an.smoothingTimeConstant=0.35;
        src.connect(an);
        an.connect(this.audioCtx.destination);
        this.analyser=an;
        this.freqData=new Uint8Array(an.frequencyBinCount);
        this.audioDriven=true;
      }else{
        this.audioCtx.resume().catch(()=>{});
      }
    }catch(err){}
    this.speaking=true;
  }
  stopAudioDrive(){
    this.audioDriven=false;
    this.analyser=null;
    this.freqData=null;
  }
  nod(){
    this.headTilt=4;
    setTimeout(()=>{this.headTilt=-2;},180);
    setTimeout(()=>{this.headTilt=0;},360);
  }
  stop(){
    this.setSpeaking(false);
    this.stopAudioDrive();
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
      let lowEnergy=0;
      for(let i=2;i<22;i++)lowEnergy+=this.freqData[i];
      lowEnergy=lowEnergy/20;
      if(lowEnergy>24){
        this.targetJaw=Math.min(22,(lowEnergy-24)*0.18);
        this.targetStretch=Math.sin(now*0.014)*5;
      }else{
        this.targetJaw=0;
        this.targetStretch=0;
      }
    }
    this.jawOpen+=(this.targetJaw-this.jawOpen)*0.28;
    this.mouthStretch+=(this.targetStretch-this.mouthStretch)*0.25;
    if(!this.isBlinking&&now-this.lastBlinkAt>this.nextBlinkDelay){
      this.isBlinking=true;
      this.blinkProgress=0;
      this.lastBlinkAt=now;
      this.nextBlinkDelay=3200+Math.random()*2600;
    }
    if(this.isBlinking){
      this.blinkProgress+=0.14;
      if(this.blinkProgress>=1){this.isBlinking=false;this.blinkProgress=0;}
    }
    this.headDrift=Math.sin(elapsed*1.6)*1.2;
  }
  render(){
    const{ctx,canvas}=this;
    if(!ctx||!this.loaded)return;
    const w=canvas.width;
    const h=canvas.height;
    ctx.clearRect(0,0,w,h);
    ctx.fillStyle="#090a0f";
    ctx.fillRect(0,0,w,h);
    const imgRatio=this.img.width/this.img.height;
    const canvasRatio=w/h;
    let renderW,renderH,offsetX,offsetY;
    if(canvasRatio>imgRatio){
      renderW=w;renderH=w/imgRatio;offsetX=0;offsetY=(h-renderH)/2;
    }else{
      renderH=h;renderW=h*imgRatio;offsetX=(w-renderW)/2;offsetY=0;
    }
    const breathScale=1.0+Math.sin(performance.now()*0.0016)*0.003;
    const cx=w/2;
    const cy=h/2;
    ctx.save();
    ctx.translate(cx,cy+this.headDrift);
    ctx.scale(breathScale,breathScale);
    if(this.headTilt!==0){ctx.rotate((this.headTilt*Math.PI)/180);}
    ctx.translate(-cx,-cy);
    ctx.drawImage(this.img,offsetX,offsetY,renderW,renderH);
    if(this.jawOpen>0.4){
      const mouthY=offsetY+renderH*0.65;
      const mouthX=offsetX+renderW*0.35;
      const mouthW=renderW*0.3;
      const mouthH=renderH*0.28;
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(cx,mouthY+mouthH*0.45,mouthW*0.54,mouthH*0.5,0,0,Math.PI*2);
      ctx.clip();
      ctx.fillStyle="rgba(15,12,12,0.85)";
      ctx.beginPath();
      ctx.ellipse(cx,mouthY+renderH*0.04+this.jawOpen*0.4,mouthW*0.34+this.mouthStretch*0.5,this.jawOpen*0.55,0,0,Math.PI*2);
      ctx.fill();
      const jawShift=this.jawOpen*(renderH/500);
      ctx.drawImage(this.img,0,this.img.height*0.66,this.img.width,this.img.height*0.34,offsetX,mouthY+jawShift,renderW,renderH*0.34);
      ctx.restore();
    }
    if(this.isBlinking&&this.blinkProgress>0){
      const blinkFactor=Math.sin(this.blinkProgress*Math.PI);
      const eyesY=offsetY+renderH*0.39;
      const eyeL_X=offsetX+renderW*0.39;
      const eyeR_X=offsetX+renderW*0.61;
      const eyeRadiusX=renderW*0.055;
      const eyeRadiusY=renderH*0.024*blinkFactor;
      ctx.save();
      ctx.fillStyle="rgba(42,35,32,0.92)";
      ctx.beginPath();
      ctx.ellipse(eyeL_X,eyesY,eyeRadiusX,eyeRadiusY,0,0,Math.PI*2);
      ctx.ellipse(eyeR_X,eyesY,eyeRadiusX,eyeRadiusY,0,0,Math.PI*2);
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
    const grad=ctx.createRadialGradient(cx,cy,Math.min(w,h)*0.45,cx,cy,Math.max(w,h)*0.75);
    grad.addColorStop(0,"rgba(7,8,11,0)");
    grad.addColorStop(0.7,"rgba(7,8,11,0.38)");
    grad.addColorStop(1,"rgba(7,8,11,0.95)");
    ctx.fillStyle=grad;
    ctx.fillRect(0,0,w,h);
    if(this.speaking&&this.jawOpen>1){
      const rimAlpha=Math.min(0.2,this.jawOpen*0.015);
      const rimGrad=ctx.createLinearGradient(0,0,0,h);
      rimGrad.addColorStop(0,\`rgba(245,158,11,\${rimAlpha})\`);
      rimGrad.addColorStop(0.5,"rgba(245,158,11,0)");
      rimGrad.addColorStop(1,\`rgba(239,68,68,\${rimAlpha*0.6})\`);
      ctx.fillStyle=rimGrad;
      ctx.fillRect(0,0,w,h);
    }
  }
}
function createDebateAvatar(canvas,options={}){
  if(options.figureId){
    return new LivingPortraitAvatar(canvas,options.figureId,options);
  }
  return new K0(canvas,options.personaVisual||void 0);
}
`;

// Insert livingPortraitCode right before class K0
const k0Target = `class K0{constructor(e,t=Y0){`;
if (!js.includes(k0Target)) throw new Error('k0Target not found');
js = js.replace(k0Target, livingPortraitCode + '\n' + k0Target);
console.log('5. LivingPortraitAvatar and createDebateAvatar defined.');

// 6. Three.js studio lights & filmic tone mapping in K0
const origLights = `buildLights(){this.scene.add(new Fu(3817290,.85));const e=new gc(16773600,2.2);e.position.set(2.2,3.2,4),this.scene.add(e);const t=new Ds(16723519,40,25,1.8);t.position.set(-3.2,2.2,-2.4),this.scene.add(t);const n=new Ds(4878245,14,22,1.8);n.position.set(3.2,.4,2.6),this.scene.add(n);try{const s=new ra(this.renderer);this.scene.environment=s.fromScene(new j0,.04).texture,s.dispose()}catch{}}`;

const newLights = `buildLights(){this.renderer.toneMapping=Oo;this.renderer.toneMappingExposure=1.15;this.scene.add(new Fu(2303803,.75));const e=new gc(16774634,2.8);e.position.set(2.2,3,3.6),this.scene.add(e);const t=new Ds(9353445,40,25,1.4);t.position.set(-2.8,1.8,2.2),this.scene.add(t);const n=new Ds(16316668,30,22,3.2);n.position.set(0,3.5,-2.8),this.scene.add(n);try{const s=new ra(this.renderer);this.scene.environment=s.fromScene(new j0,.04).texture,s.dispose()}catch{}}`;

if (!js.includes(origLights)) throw new Error('origLights not found');
js = js.replace(origLights, newLights);
console.log('6. K0 studio lighting and ACES tone mapping patched.');

// 7. In ix: Replace new K0(...) with createDebateAvatar(...)
const origK0New = `const n=new K0(i.querySelector("#avatar-canvas"),t.personaVisual||void 0);`;

const newK0New = `const n=createDebateAvatar(i.querySelector("#avatar-canvas"),{figureId:t.figureId,personaVisual:t.personaVisual,modeId:t.modeId,personaLabel:t.personaLabel});`;

if (!js.includes(origK0New)) throw new Error('origK0New not found');
js = js.replace(origK0New, newK0New);
console.log('7. ix avatar instantiation patched to use createDebateAvatar.');

// Write index-V8_photoreal.js and update index-V7_structure.js & index-V6_arena.js
const outV8JsPath = path.join(__dirname, '../frontend/dist/app/assets/index-V8_photoreal.js');
const outV7JsPath = path.join(__dirname, '../frontend/dist/app/assets/index-V7_structure.js');
const outV6JsPath = path.join(__dirname, '../frontend/dist/app/assets/index-V6_arena.js');

fs.writeFileSync(outV8JsPath, js, 'utf8');
fs.writeFileSync(outV7JsPath, js, 'utf8');
fs.writeFileSync(outV6JsPath, js, 'utf8');
console.log('Wrote index-V8_photoreal.js and synced V7/V6 JS.');

// CSS sync
const srcCssPath = path.join(__dirname, '../frontend/dist/app/assets/index-V7_structure.css');
const css = fs.readFileSync(srcCssPath, 'utf8');
const outV8CssPath = path.join(__dirname, '../frontend/dist/app/assets/index-V8_photoreal.css');
fs.writeFileSync(outV8CssPath, css, 'utf8');
console.log('Wrote index-V8_photoreal.css.');

// Update index.html
const htmlPath = path.join(__dirname, '../frontend/dist/app/index.html');
let html = fs.readFileSync(htmlPath, 'utf8');
html = html.replace(/index-V[0-9]_[a-zA-Z0-9_-]+\.js/g, 'index-V8_photoreal.js');
html = html.replace(/index-V[0-9]_[a-zA-Z0-9_-]+\.css/g, 'index-V8_photoreal.css');
fs.writeFileSync(htmlPath, html, 'utf8');
console.log('Updated index.html to index-V8_photoreal.');

// Bump service worker version to adversaryai-v9
const swPath = path.join(__dirname, '../frontend/dist/sw.js');
let sw = fs.readFileSync(swPath, 'utf8');
sw = sw.replace(/adversaryai-v[0-9]+/g, 'adversaryai-v9');
fs.writeFileSync(swPath, sw, 'utf8');
console.log('Bumped service worker to adversaryai-v9.');

console.log('ALL PHOTOREAL PATCHES COMPLETED SUCCESSFULLY!');
