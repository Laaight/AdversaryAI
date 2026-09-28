const fs = require('fs');
const path = require('path');

const jsPath = path.join(__dirname, '../frontend/dist/app/assets/index-V6_arena.js');
let js = fs.readFileSync(jsPath, 'utf8').replace(/\r\n/g, '\n');

console.log('Original JS size (LF):', js.length);

// 1. Setup HTML: Add Who Speaks First and Debate Format & Style selectors
const roundGridEnd = `<button type="button" data-rounds="0" class="round-chip px-3 py-2.5 rounded-xl border text-xs font-semibold text-left border-ink-700 bg-ink-900 text-slate-300 hover:border-slate-500 transition-all">
            <span class="block text-sm text-white font-bold">♾️ Open</span>
            <span class="text-[10px] text-slate-400">Freestyle</span>
          </button>
        </div>
      </div>`;

const setupSelectorsHtml = `<button type="button" data-rounds="0" class="round-chip px-3 py-2.5 rounded-xl border text-xs font-semibold text-left border-ink-700 bg-ink-900 text-slate-300 hover:border-slate-500 transition-all">
            <span class="block text-sm text-white font-bold">♾️ Open</span>
            <span class="text-[10px] text-slate-400">Freestyle</span>
          </button>
        </div>
      </div>

      <div class="mt-5 mb-2">
        <label class="block text-sm font-semibold text-slate-200 mb-2">Who Speaks First?</label>
        <div class="grid grid-cols-3 gap-2.5" id="speaker-select-grid">
          <button type="button" data-speaker="cointoss" class="speaker-chip px-3 py-2.5 rounded-xl border text-xs font-semibold text-left border-accent-500 bg-accent-500/10 text-white transition-all">
            <span class="block text-sm text-accent-300 font-bold">🪙 Coin Toss</span>
            <span class="text-[10px] text-slate-300">Fair 50/50 flip</span>
          </button>
          <button type="button" data-speaker="user" class="speaker-chip px-3 py-2.5 rounded-xl border text-xs font-semibold text-left border-ink-700 bg-ink-900 text-slate-300 hover:border-slate-500 transition-all">
            <span class="block text-sm text-white font-bold">👤 You Open</span>
            <span class="text-[10px] text-slate-400">Opening statement</span>
          </button>
          <button type="button" data-speaker="opponent" class="speaker-chip px-3 py-2.5 rounded-xl border text-xs font-semibold text-left border-ink-700 bg-ink-900 text-slate-300 hover:border-slate-500 transition-all">
            <span class="block text-sm text-white font-bold">🤖 Opponent</span>
            <span class="text-[10px] text-slate-400">AI takes floor</span>
          </button>
        </div>
      </div>

      <div class="mt-5 mb-2 \${s.id==='debate'||s.id==='historical'||s.id==='thesis'||s.id==='sparring'?'':'hidden'}" id="style-select-section">
        <label class="block text-sm font-semibold text-slate-200 mb-2">Debate Format &amp; Style</label>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5" id="style-select-grid">
          <button type="button" data-style="oxford" class="style-chip px-3 py-2.5 rounded-xl border text-xs font-semibold text-left border-accent-500 bg-accent-500/10 text-white transition-all">
            <span class="block text-sm text-accent-300 font-bold">🏛️ Oxford</span>
            <span class="text-[10px] text-slate-300">Constructives &amp; Rebuttals</span>
          </button>
          <button type="button" data-style="lincoln_douglas" class="style-chip px-3 py-2.5 rounded-xl border text-xs font-semibold text-left border-ink-700 bg-ink-900 text-slate-300 hover:border-slate-500 transition-all">
            <span class="block text-sm text-white font-bold">⚖️ L-D</span>
            <span class="text-[10px] text-slate-400">Moral &amp; Value Clash</span>
          </button>
          <button type="button" data-style="rapid" class="style-chip px-3 py-2.5 rounded-xl border text-xs font-semibold text-left border-ink-700 bg-ink-900 text-slate-300 hover:border-slate-500 transition-all">
            <span class="block text-sm text-white font-bold">⚡ Rapid</span>
            <span class="text-[10px] text-slate-400">Punchy &lt;70 Words</span>
          </button>
          <button type="button" data-style="freeform" class="style-chip px-3 py-2.5 rounded-xl border text-xs font-semibold text-left border-ink-700 bg-ink-900 text-slate-300 hover:border-slate-500 transition-all">
            <span class="block text-sm text-white font-bold">🥊 Open</span>
            <span class="text-[10px] text-slate-400">Freeform Sparring</span>
          </button>
        </div>
      </div>`;

if (!js.includes(roundGridEnd)) {
  throw new Error('roundGridEnd target not found in JS');
}
js = js.replace(roundGridEnd, setupSelectorsHtml);
console.log('1. Setup HTML patched successfully.');

// 2. Setup JS: Add click handlers for speaker-chips and style-chips
const roundGridHandler = `const _rg=t.querySelector("#round-select-grid");if(_rg){_rg.querySelectorAll(".round-chip").forEach(ch=>{ch.addEventListener("click",()=>{_rg.querySelectorAll(".round-chip").forEach(o=>{o.classList.remove("border-accent-500","bg-accent-500/10","text-white");o.classList.add("border-ink-700","bg-ink-900","text-slate-300");});ch.classList.remove("border-ink-700","bg-ink-900","text-slate-300");ch.classList.add("border-accent-500","bg-accent-500/10","text-white");})});}`;

const chipsHandlers = `const _rg=t.querySelector("#round-select-grid");if(_rg){_rg.querySelectorAll(".round-chip").forEach(ch=>{ch.addEventListener("click",()=>{_rg.querySelectorAll(".round-chip").forEach(o=>{o.classList.remove("border-accent-500","bg-accent-500/10","text-white");o.classList.add("border-ink-700","bg-ink-900","text-slate-300");const sp1=o.querySelector("span:first-child");if(sp1){sp1.classList.remove("text-accent-300");sp1.classList.add("text-white");}});ch.classList.remove("border-ink-700","bg-ink-900","text-slate-300");ch.classList.add("border-accent-500","bg-accent-500/10","text-white");const sp1=ch.querySelector("span:first-child");if(sp1){sp1.classList.remove("text-white");sp1.classList.add("text-accent-300");}})});};const _sg=t.querySelector("#speaker-select-grid");if(_sg){_sg.querySelectorAll(".speaker-chip").forEach(ch=>{ch.addEventListener("click",()=>{_sg.querySelectorAll(".speaker-chip").forEach(o=>{o.classList.remove("border-accent-500","bg-accent-500/10","text-white");o.classList.add("border-ink-700","bg-ink-900","text-slate-300");const sp1=o.querySelector("span:first-child");if(sp1){sp1.classList.remove("text-accent-300");sp1.classList.add("text-white");}});ch.classList.remove("border-ink-700","bg-ink-900","text-slate-300");ch.classList.add("border-accent-500","bg-accent-500/10","text-white");const sp1=ch.querySelector("span:first-child");if(sp1){sp1.classList.remove("text-white");sp1.classList.add("text-accent-300");}})});};const _stg=t.querySelector("#style-select-grid");if(_stg){_stg.querySelectorAll(".style-chip").forEach(ch=>{ch.addEventListener("click",()=>{_stg.querySelectorAll(".style-chip").forEach(o=>{o.classList.remove("border-accent-500","bg-accent-500/10","text-white");o.classList.add("border-ink-700","bg-ink-900","text-slate-300");const sp1=o.querySelector("span:first-child");if(sp1){sp1.classList.remove("text-accent-300");sp1.classList.add("text-white");}});ch.classList.remove("border-ink-700","bg-ink-900","text-slate-300");ch.classList.add("border-accent-500","bg-accent-500/10","text-white");const sp1=ch.querySelector("span:first-child");if(sp1){sp1.classList.remove("text-white");sp1.classList.add("text-accent-300");}})});};const showCoinTossModal=async(prm,oppName)=>{return new Promise((res,rej)=>{const m=document.createElement("div");m.className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in";m.innerHTML=\`<div class="relative w-full max-w-sm rounded-3xl border border-ink-700 bg-ink-900/95 p-7 text-center shadow-2xl overflow-hidden"><div class="absolute -top-20 -left-20 w-44 h-44 bg-amber-500/15 rounded-full blur-3xl pointer-events-none"></div><div class="absolute -bottom-20 -right-20 w-44 h-44 bg-accent-500/15 rounded-full blur-3xl pointer-events-none"></div><p class="text-xs font-bold uppercase tracking-widest text-amber-400 mb-5">🪙 First Speaker Coin Toss</p><div class="coin-container flex justify-center my-6"><div class="coin-3d coin-flipping" id="toss-coin"><div class="coin-side coin-side-front"><span class="text-3xl">👤</span><span class="text-[11px] font-black tracking-wider uppercase mt-1">YOU</span></div><div class="coin-side coin-side-back"><span class="text-3xl">🤖</span><span class="text-[11px] font-black tracking-wider uppercase mt-1">AI</span></div></div></div><div id="toss-status" class="text-base font-semibold text-white mb-1.5">Flipping coin…</div><p id="toss-sub" class="text-xs text-slate-400">Heads: You open · Tails: Opponent opens</p><div id="toss-action" class="mt-6 hidden"><button type="button" id="toss-proceed-btn" class="w-full py-3 rounded-xl bg-accent-500 hover:bg-accent-400 text-white font-bold text-sm shadow-lg shadow-accent-500/25 transition-all">Enter Debate Floor &rarr;</button></div></div>\`;document.body.appendChild(m);const coin=m.querySelector("#toss-coin"),status=m.querySelector("#toss-status"),sub=m.querySelector("#toss-sub"),action=m.querySelector("#toss-action"),proceedBtn=m.querySelector("#toss-proceed-btn");prm.then(data=>{setTimeout(()=>{coin.classList.remove("coin-flipping");const userWon=(data.resolvedFirstSpeaker==="user");if(userWon){coin.classList.add("coin-land-heads");status.innerHTML='<span class="text-emerald-400 font-bold">Heads — You won the toss!</span>';sub.textContent="You take the floor to deliver the opening statement.";}else{coin.classList.add("coin-land-tails");status.innerHTML=\`<span class="text-amber-400 font-bold">Tails — \${xt(oppName)} opens!</span>\`;sub.textContent=\`\${xt(oppName)} takes the floor for their opening constructive.\`;}action.classList.remove("hidden");proceedBtn.focus();let tm=setTimeout(()=>{m.remove();res(data);},1800);proceedBtn.onclick=()=>{clearTimeout(tm);m.remove();res(data);};},1300);}).catch(err=>{m.remove();rej(err);});});};`;

if (!js.includes(roundGridHandler)) {
  throw new Error('roundGridHandler target not found in JS');
}
js = js.replace(roundGridHandler, chipsHandlers);
console.log('2. Chips handlers and Coin Toss modal added successfully.');

// 3. Start button listener: Collect speaker and style, call start with them, trigger toss animation if cointoss
const origStartCall = `const _selRounds=Number(t.querySelector("#round-select-grid .border-accent-500")?.getAttribute("data-rounds")??6);const{debateId:V}=await zt("/api/debate/start",{mode:s.id,persona:L,topic:O,setup:T,judge:q,targetRounds:_selRounds});bh(V,{modeId:s.id,modeName:s.name,modeIcon:s.icon,topic:O,personaLabel:C,judgeEnabled:q,personaVisual:y.model,targetRounds:_selRounds}),location.hash=\`#/session/\${encodeURIComponent(V)}\``;

const newStartCall = `const _selRounds=Number(t.querySelector("#round-select-grid .border-accent-500")?.getAttribute("data-rounds")??6);const _selSpeaker=t.querySelector("#speaker-select-grid .border-accent-500")?.getAttribute("data-speaker")??"cointoss";const _selStyle=t.querySelector("#style-select-grid .border-accent-500")?.getAttribute("data-style")??"oxford";const _startPromise=zt("/api/debate/start",{mode:s.id,persona:L,topic:O,setup:T,judge:q,targetRounds:_selRounds,firstSpeaker:_selSpeaker,debateStyle:_selStyle});let _startRes;if(_selSpeaker==="cointoss"){_startRes=await showCoinTossModal(_startPromise,C);}else{_startRes=await _startPromise;}const V=_startRes.debateId;bh(V,{modeId:s.id,modeName:s.name,modeIcon:s.icon,topic:O,personaLabel:C,judgeEnabled:q,personaVisual:y.model,targetRounds:_selRounds,firstSpeaker:_selSpeaker,resolvedFirstSpeaker:_startRes.resolvedFirstSpeaker||_selSpeaker,debateStyle:_startRes.debateStyle||_selStyle}),location.hash=\`#/session/\${encodeURIComponent(V)}\``;

if (!js.includes(origStartCall)) {
  throw new Error('origStartCall target not found in JS');
}
js = js.replace(origStartCall, newStartCall);
console.log('3. Start session logic patched successfully.');

// 4. nx(i) update: Preserve firstSpeaker, resolvedFirstSpeaker, debateStyle in session object
const origNxReturn = `return{modeId:n.mode||"debate",modeName:s,modeIcon:r,topic:n.topic,personaLabel:n.personaLabel||s,judgeEnabled:n.judgeEnabled===!0,personaVisual:n.personaVisual||void 0}`;

const newNxReturn = `return{modeId:n.mode||"debate",modeName:s,modeIcon:r,topic:n.topic,personaLabel:n.personaLabel||s,judgeEnabled:n.judgeEnabled===!0,personaVisual:n.personaVisual||void 0,targetRounds:n.targetRounds||0,firstSpeaker:n.firstSpeaker||"user",resolvedFirstSpeaker:n.resolvedFirstSpeaker||"user",debateStyle:n.debateStyle||"oxford"}`;

if (!js.includes(origNxReturn)) {
  throw new Error('origNxReturn target not found in JS');
}
js = js.replace(origNxReturn, newNxReturn);
console.log('4. nx(i) session loader patched successfully.');

// 5. Spar session template: Add Phase Badge beside round badge
const origBadges = `<span id="spar-round-badge" class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-accent-500/15 border border-accent-500/30 text-accent-300">🥊 Round <span id="spar-cur-round">1</span>\${t.targetRounds ? " / " + t.targetRounds : " (Freestyle)"}</span>`;

const newBadges = `<span id="spar-phase-badge" class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/15 border border-blue-500/30 text-blue-300">🎙️ Phase 1: Opening</span><span id="spar-round-badge" class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-accent-500/15 border border-accent-500/30 text-accent-300">🥊 Round <span id="spar-cur-round">1</span>\${t.targetRounds ? " / " + t.targetRounds : " (Freestyle)"}</span>`;

if (!js.includes(origBadges)) {
  throw new Error('origBadges target not found in JS');
}
js = js.replace(origBadges, newBadges);
console.log('5. Spar session Phase badge added to template.');

// 6. Spar session logic: updateRoundAndPhase helper AND showUnlimitedEndModal helper
const origRoundInit = `let _sparCurRound=1;const g=[];`;

const newRoundInit = `let _sparCurRound=1;const g=[];const updateRoundAndPhase=()=>{const _crEl=i.querySelector("#spar-cur-round");if(_crEl)_crEl.textContent=_sparCurRound;const _phEl=i.querySelector("#spar-phase-badge");const isDeb=t.modeId==="debate"||t.modeId==="historical"||t.modeId==="thesis"||t.modeId==="sparring";if(_phEl){if(_sparCurRound<=1){_phEl.className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/15 border border-blue-500/30 text-blue-300";_phEl.textContent=isDeb?"🎙️ Phase 1: Opening Statements":"🎙️ Phase 1: Opening";}else if(t.targetRounds&&_sparCurRound>=t.targetRounds){_phEl.className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/15 border border-purple-500/30 text-purple-300";_phEl.textContent=isDeb?"🏛️ Phase 3: Final Closing Arguments":"🏛️ Phase 3: Closing";}else{_phEl.className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-500/15 border border-red-500/30 text-red-300";_phEl.textContent=isDeb?"⚔️ Phase 2: Rebuttal & Cross-Exam":\`🥊 Round \${_sparCurRound} Clash\`;}}if(r){if(_sparCurRound<=1){r.placeholder=isDeb?(g.length===0?"Deliver your opening constructive — state your resolution, definitions, and main arguments…":"Deliver your opening counter-statement — challenge their thesis and state your case…"):"Type your opening statement or tap the mic…";}else if(t.targetRounds&&_sparCurRound>=t.targetRounds){r.placeholder=isDeb?"Deliver your final closing argument — crystalize your key voting issues for the judge…":"Deliver your final closing point…";}else{r.placeholder=isDeb?"Attack their weak premises, challenge evidence, or counter-examine…":"Type your response or tap the mic…";}}};const showUnlimitedEndModal=()=>{return new Promise(resolve=>{const modal=document.createElement("div");modal.className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in";modal.innerHTML=\`<div class="relative w-full max-w-md rounded-3xl border border-ink-700 bg-ink-900/95 p-6 sm:p-7 shadow-2xl"><h3 class="font-display text-xl text-white font-bold mb-2">Conclude Unlimited Sparring?</h3><p class="text-sm text-slate-300 leading-relaxed mb-6">You’ve completed \${_sparCurRound} rounds of open sparring. Before scoring, would you like to deliver a final closing argument, or have the AI Judge score your session right now?</p><div class="space-y-3"><button type="button" id="modal-closing-btn" class="w-full py-3 px-4 rounded-xl bg-purple-600/20 border border-purple-500/40 text-purple-200 hover:bg-purple-600/30 font-semibold text-sm flex items-center justify-between transition-all"><span>🏛️ Deliver Final Closing Statement</span><span class="text-xs text-purple-300 opacity-80">1 final round</span></button><button type="button" id="modal-score-now-btn" class="w-full py-3 px-4 rounded-xl bg-accent-500 hover:bg-accent-400 text-white font-bold text-sm shadow-lg shadow-accent-500/20 flex items-center justify-between transition-all"><span>⚖️ Grade Session Now</span><span class="text-xs text-white/80">Immediate verdict</span></button><button type="button" id="modal-cancel-btn" class="w-full py-2.5 px-4 rounded-xl border border-ink-700 text-slate-400 hover:text-white hover:border-slate-500 font-medium text-xs transition-all">Keep Sparring Freely</button></div></div>\`;document.body.appendChild(modal);modal.querySelector("#modal-closing-btn").onclick=()=>{modal.remove();resolve("closing");};modal.querySelector("#modal-score-now-btn").onclick=()=>{modal.remove();resolve("score");};modal.querySelector("#modal-cancel-btn").onclick=()=>{modal.remove();resolve("cancel");};});};`;

if (!js.includes(origRoundInit)) {
  throw new Error('origRoundInit target not found in JS');
}
js = js.replace(origRoundInit, newRoundInit);
console.log('6. updateRoundAndPhase and showUnlimitedEndModal defined.');

// 7. Initial session load: fetch turns, update round, check if opponent opens
const origTurnsLoad = `(async()=>{try{const I=await Ut(\`/api/debates/\${encodeURIComponent(e)}\`);for(const G of I.turns??[])G.role==="user"?L("you",G.text):G.role==="assistant"&&L("opponent",G.text)}catch{}})();`;

const newTurnsLoad = `(async()=>{try{const I=await Ut(\`/api/debates/\${encodeURIComponent(e)}\`);const _loadedTurns=I.turns??[];for(const G of _loadedTurns)G.role==="user"?L("you",G.text):G.role==="assistant"&&L("opponent",G.text);_sparCurRound=Math.max(1,Math.floor(_loadedTurns.length/2)+1);updateRoundAndPhase();const _resSpeaker=t.resolvedFirstSpeaker||I.debate?.resolvedFirstSpeaker||(I.debate?.setup_json?JSON.parse(I.debate.setup_json).resolvedFirstSpeaker:null);if(_resSpeaker==="opponent"&&_loadedTurns.length===0){setTimeout(()=>q("open"),400);}}catch(err){console.error("Failed to load session turns",err);}})();`;

if (!js.includes(origTurnsLoad)) {
  throw new Error('origTurnsLoad target not found in JS');
}
js = js.replace(origTurnsLoad, newTurnsLoad);
console.log('7. Initial turns loader with opponent opening trigger patched.');

// 8. q function: support openAction === "open"
const origQTop = `async function q(){try{const{warmAudio:ce}=await gr(async()=>{const{warmAudio:ye}=await Promise.resolve().then(()=>fo);return{warmAudio:ye}},void 0);ce()}catch{}const I=r.value.trim();if(!I||S)return;S=!0,a.disabled=!0,r.value="",y(),++x,R=null;const G=x;L("you",I);const B=M(),ne=L("opponent","");`;

const newQTop = `async function q(openAction){try{const{warmAudio:ce}=await gr(async()=>{const{warmAudio:ye}=await Promise.resolve().then(()=>fo);return{warmAudio:ye}},void 0);ce()}catch{}const isOpening=(openAction==="open");const I=r.value.trim();if((!I&&!isOpening)||S)return;S=!0,a.disabled=!0;if(!isOpening){r.value="";y();++x;R=null;L("you",I);}else{y();++x;R=null;}const G=x;const B=M(),ne=L("opponent","");`;

if (!js.includes(origQTop)) {
  throw new Error('origQTop target not found in JS');
}
js = js.replace(origQTop, newQTop);
console.log('8. q function opening mode support patched.');

// 9. q fetch body: send text: isOpening ? "" : I, action: isOpening ? "open" : void 0
const origStreamFetch = `const ce=await fetch("/api/debate/turn-stream",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({debateId:e,text:I})})`;

const newStreamFetch = `const ce=await fetch("/api/debate/turn-stream",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({debateId:e,text:isOpening?"":I,action:isOpening?"open":void 0})})`;

if (!js.includes(origStreamFetch)) {
  throw new Error('origStreamFetch target not found in JS');
}
js = js.replace(origStreamFetch, newStreamFetch);
console.log('9. Stream fetch body patched.');

// 10. q turn done handler: update round and phase
const origTurnDone = `_sparCurRound++;
const _crEl=i.querySelector("#spar-cur-round");if(_crEl)_crEl.textContent=_sparCurRound;
const _wbEl=i.querySelector("#spar-wallet-badge");if(_wbEl&&ce.remainingRounds!==undefined){_wbEl.textContent=ce.remainingRounds>=999999?"Unlimited rounds":ce.remainingRounds+" rds left";}
if(t.targetRounds&&_sparCurRound>t.targetRounds){const _trb=i.querySelector("#spar-target-reached-banner");if(_trb)_trb.classList.remove("hidden");const _bsb=i.querySelector("#banner-score-btn");if(_bsb)_bsb.onclick=()=>u.click();}`;

const newTurnDone = `_sparCurRound=Math.max(_sparCurRound,Math.floor(g.length/2)+1);
updateRoundAndPhase();
const _wbEl=i.querySelector("#spar-wallet-badge");if(_wbEl&&ce.remainingRounds!==undefined){_wbEl.textContent=ce.remainingRounds>=999999?"Unlimited rounds":ce.remainingRounds+" rds left";}
if(t.targetRounds&&_sparCurRound>t.targetRounds){const _trb=i.querySelector("#spar-target-reached-banner");if(_trb)_trb.classList.remove("hidden");const _bsb=i.querySelector("#banner-score-btn");if(_bsb)_bsb.onclick=()=>u.click();}`;

if (!js.includes(origTurnDone)) {
  throw new Error('origTurnDone target not found in JS');
}
js = js.replace(origTurnDone, newTurnDone);
console.log('10. Turn done round and phase updater patched.');

// 11. End button listener: Support Unlimited round closing argument option
const origEndListener = `u.addEventListener("click",async()=>{if(confirm("End this session and get your scores?")){u.disabled=!0,u.textContent="Scoring…",y();try{const{scores:I}=await zt("/api/debate/end",{debateId:e});sx(i,n,t,e,g,I)}catch{u.disabled=!1,u.textContent="End session";const I=document.createElement("p");I.className="text-sm text-red-300",I.textContent="Could not fetch scores. Try again.",s.appendChild(I)}}});`;

const newEndListener = `u.addEventListener("click",async()=>{let wantScore=false;if((!t.targetRounds||t.targetRounds===0)&&_sparCurRound>=2){const choice=await showUnlimitedEndModal();if(choice==="closing"){const _phEl=i.querySelector("#spar-phase-badge");if(_phEl){_phEl.className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/15 border border-purple-500/30 text-purple-300";_phEl.textContent="🏛️ Phase 3: Final Closing Arguments";}if(r){r.placeholder="Deliver your final closing argument — summarize your key winning points for the judge…";r.focus();}return;}else if(choice==="score"){wantScore=true;}else{return;}}else{if(confirm("End this session and get your scores?"))wantScore=true;}if(wantScore){u.disabled=!0,u.textContent="Scoring…",y();try{const{scores:I}=await zt("/api/debate/end",{debateId:e});sx(i,n,t,e,g,I);}catch{u.disabled=!1,u.textContent="End session";const I=document.createElement("p");I.className="text-sm text-red-300",I.textContent="Could not fetch scores. Try again.",s.appendChild(I);}}});`;

if (!js.includes(origEndListener)) {
  throw new Error('origEndListener target not found in JS');
}
js = js.replace(origEndListener, newEndListener);
console.log('11. End button with unlimited closing argument modal patched.');

// Output files:
const outV7JsPath = path.join(__dirname, '../frontend/dist/app/assets/index-V7_structure.js');
fs.writeFileSync(outV7JsPath, js, 'utf8');
fs.writeFileSync(jsPath, js, 'utf8'); // Also update V6 for fallback
console.log('Wrote index-V7_structure.js and updated index-V6_arena.js');

// 12. CSS Patch
const cssPath = path.join(__dirname, '../frontend/dist/app/assets/index-V6_arena.css');
let css = fs.readFileSync(cssPath, 'utf8');

const extraCss = `
/* 3D Coin Toss & Flip Animation */
.coin-container{perspective:1000px;display:flex;justify-content:center;align-items:center}
.coin-3d{width:92px;height:92px;position:relative;transform-style:preserve-3d;border-radius:50%;box-shadow:0 10px 25px -5px rgba(245,158,11,0.4),0 0 15px rgba(251,191,36,0.3)}
.coin-flipping{animation:coinSpinContinuous 0.6s linear infinite}
.coin-land-heads{transform:rotateY(1800deg);transition:transform 1.2s cubic-bezier(0.15,0.9,0.25,1)}
.coin-land-tails{transform:rotateY(1980deg);transition:transform 1.2s cubic-bezier(0.15,0.9,0.25,1)}
@keyframes coinSpinContinuous{0%{transform:rotateY(0deg)}100%{transform:rotateY(360deg)}}
.coin-side{position:absolute;inset:0;border-radius:50%;backface-visibility:hidden;-webkit-backface-visibility:hidden;display:flex;flex-direction:column;align-items:center;justify-content:center;border:4px solid #f59e0b;background:radial-gradient(circle at 35% 30%,#fef08a 0%,#f59e0b 60%,#b45309 100%);color:#78350f;box-shadow:inset 0 2px 4px rgba(255,255,255,0.7),inset 0 -2px 4px rgba(0,0,0,0.3)}
.coin-side-front{transform:rotateY(0deg)}
.coin-side-back{transform:rotateY(180deg)}
`;

css += extraCss;
const outV7CssPath = path.join(__dirname, '../frontend/dist/app/assets/index-V7_structure.css');
fs.writeFileSync(outV7CssPath, css, 'utf8');
fs.writeFileSync(cssPath, css, 'utf8'); // Also update V6 for fallback
console.log('Wrote index-V7_structure.css and updated index-V6_arena.css');

// 13. Update index.html
const htmlPath = path.join(__dirname, '../frontend/dist/app/index.html');
let html = fs.readFileSync(htmlPath, 'utf8');
html = html.replace(/index-V6_arena\.js/g, 'index-V7_structure.js');
html = html.replace(/index-V6_arena\.css/g, 'index-V7_structure.css');
fs.writeFileSync(htmlPath, html, 'utf8');
console.log('Updated frontend/dist/app/index.html');

// 14. Update Service Worker version
const swPath = path.join(__dirname, '../frontend/dist/sw.js');
let sw = fs.readFileSync(swPath, 'utf8');
sw = sw.replace(/adversaryai-v7/g, 'adversaryai-v8');
fs.writeFileSync(swPath, sw, 'utf8');
console.log('Bumped service worker to adversaryai-v8');

console.log('ALL PATCHES APPLIED SUCCESSFULLY!');
