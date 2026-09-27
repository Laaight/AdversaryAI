const fs = require('fs');
const path = require('path');

const srcJsPath = path.join(__dirname, '../frontend/dist/app/assets/index-V10_perfect.js');
let js = fs.readFileSync(srcJsPath, 'utf8').replace(/\r\n/g, '\n');

console.log('Original JS size (V10):', js.length);

// 1. Upgrade nx(i) to reliably fetch /api/debates/:id when not cached, restoring all metadata
const oldNxStart = 'async function nx(i){';
const oldNxEnd = 'function ix(i,e,t){';

const nxStartIdx = js.indexOf(oldNxStart);
const nxEndIdx = js.indexOf(oldNxEnd);

if (nxStartIdx === -1 || nxEndIdx === -1) {
  throw new Error('nx boundaries not found');
}

const newNx = `async function nx(i){
  try{
    const e=sessionStorage.getItem(\`adversaryai:session:\${i}\`);
    if(e){
      const parsed=JSON.parse(e);
      if(parsed.figureId||parsed.modeId!=="historical")return parsed;
    }
  }catch{}
  try{
    const res=await Ut(\`/api/debates/\${encodeURIComponent(i)}\`);
    const n=res.debate;
    if(!n)return null;
    let s=n.mode||"debate",r="";
    try{
      const o=(await fa()).find(c=>c.id===n.mode);
      o&&(s=o.name,r=o.icon);
    }catch{}
    const _nSetup=n.setup_json?(typeof n.setup_json==="string"?JSON.parse(n.setup_json):n.setup_json):{};
    const _figId=n.figureId||_nSetup.figureId||(s==="historical"?n.personality:void 0);
    let personaLabel=n.personaLabel;
    if(!personaLabel){
      if(s==="historical"&&_figId){
        personaLabel=_figId.replace(/_/g," ").replace(/\\b\\w/g,c=>c.toUpperCase());
      }else{
        personaLabel=s;
      }
    }
    const sessionObj={
      modeId:n.mode||"debate",
      modeName:s,
      modeIcon:r,
      topic:n.topic,
      personaLabel:personaLabel||s,
      judgeEnabled:n.judgeEnabled===!0||_nSetup.judge==="1",
      personaVisual:n.personaVisual||_nSetup.personaVisual||void 0,
      targetRounds:n.targetRounds||parseInt(_nSetup.targetRounds||"0",10)||0,
      firstSpeaker:n.firstSpeaker||_nSetup.firstSpeaker||"user",
      resolvedFirstSpeaker:n.resolvedFirstSpeaker||_nSetup.resolvedFirstSpeaker||"user",
      debateStyle:n.debateStyle||_nSetup.debateStyle||"oxford",
      figureId:_figId||void 0,
      ended_at:n.ended_at||null,
      verdict:res.verdict||null
    };
    try{
      sessionStorage.setItem(\`adversaryai:session:\${i}\`,JSON.stringify(sessionObj));
    }catch{}
    return sessionObj;
  }catch(err){
    console.error("Failed to load session metadata",err);
    return null;
  }
}
`;

js = js.slice(0, nxStartIdx) + newNx + js.slice(nxEndIdx);
console.log('1. Upgraded nx(i) to fetch debate details on demand.');

// 2. In ix(s, e, r): if session is already ended/scored, show concluded banner
const turnLoadTarget = `if(_resSpeaker==="opponent"&&_loadedTurns.length===0){setTimeout(()=>q("open"),400);}}catch(err){console.error("Failed to load session turns",err);}})();`;
const turnLoadReplace = `if(_resSpeaker==="opponent"&&_loadedTurns.length===0){setTimeout(()=>q("open"),400);}if(I.debate?.ended_at||t.ended_at){const _concl=document.createElement("div");_concl.className="mb-3 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-200 text-xs flex items-center justify-between";_concl.innerHTML='<span>✓ This session has concluded and was scored.</span><button type="button" id="concl-scorecard-btn" class="underline font-bold ml-2 cursor-pointer whitespace-nowrap">View Scorecard →</button>';const _tsLot=i.querySelector("#quota-slot");if(_tsLot&&_tsLot.parentNode)_tsLot.parentNode.insertBefore(_concl,_tsLot);const _scb=i.querySelector("#concl-scorecard-btn");if(_scb)_scb.onclick=()=>sx(i,n,t,e,g,I.verdict?.scores);if(r){r.disabled=!0;r.placeholder="This session has been scored and concluded.";}if(a)a.disabled=!0;if(o)o.disabled=!0;if(u){u.textContent="View Scorecard";u.onclick=()=>sx(i,n,t,e,g,I.verdict?.scores);}}}catch(err){console.error("Failed to load session turns",err);}})();`;

if (!js.includes(turnLoadTarget)) {
  throw new Error('turnLoadTarget not found');
}
js = js.replace(turnLoadTarget, turnLoadReplace);
console.log('2. Handled already-ended session state in ix().');

// 3. Overhaul dx(i) - Session History:
// - Direct resume on in-progress click & "Resume Sparring" button
// - Close & Grade action
// - Delete action
const oldDxStart = 'async function dx(i){';
const oldDxEnd = 'function Lt(i){';

const dxStartIdx = js.indexOf(oldDxStart);
const dxEndIdx = js.indexOf(oldDxEnd);

if (dxStartIdx === -1 || dxEndIdx === -1) {
  throw new Error('dx boundaries not found');
}

const newDx = `async function dx(i){
  i.innerHTML=\`<div class="max-w-4xl mx-auto px-4 py-6 sm:py-10" id="history-root">
    <div class="text-center py-16 text-slate-500">Loading your sessions…</div>
  </div>\`;
  const e=i.querySelector("#history-root");
  let t,n=new Map;
  try{
    const o=await Ut("/api/debates");
    t=Array.isArray(o)?o:o.debates;
    try{n=new Map((await fa()).map(c=>[c.id,c]));}catch{}
  }catch(o){
    e.innerHTML=\`<div class="text-center py-16 text-slate-400">
      <p class="text-white font-semibold mb-2">Couldn’t load your history</p>
      <p class="text-sm">\${o instanceof Bt?\`Error \${o.status}\`:"Check your connection and try again."}</p>
    </div>\`;
    return;
  }
  if(t.length===0){
    e.innerHTML=\`
      <div class="text-center mb-8">
        <h1 class="font-display text-3xl text-white">Session history</h1>
      </div>
      <div class="text-center py-16 rounded-2xl border border-ink-700 bg-ink-900">
        <div class="mb-4 flex justify-center text-slate-500 [&>svg]:w-10 [&>svg]:h-10">\${it.mic}</div>
        <p class="text-white font-semibold mb-1">No sessions yet</p>
        <p class="text-sm text-slate-400 mb-6">Your finished sessions and full transcripts will live here.</p>
        <a href="#/" class="inline-block px-5 py-2.5 rounded-xl bg-accent-500 hover:bg-accent-400 text-[#fff] font-semibold text-sm">Start your first session</a>
      </div>\`;
    return;
  }
  e.innerHTML=\`
    <div class="mb-8 flex items-center justify-between gap-4 flex-wrap">
      <div>
        <h1 class="font-display text-3xl text-white">Session history</h1>
        <p class="text-slate-400 text-sm mt-1" id="history-counter">\${t.length} session\${t.length===1?"":"s"} · tap to resume active sparring or view transcripts</p>
      </div>
      <a href="#/" class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-accent-500 hover:bg-accent-400 text-white font-semibold text-xs sm:text-sm shadow-md shadow-accent-500/20 transition-all">
        + New Session
      </a>
    </div>
    <div class="space-y-3.5" id="debate-list"></div>
    <div id="debate-detail" class="hidden mt-8"></div>\`;

  const s=e.querySelector("#debate-list"),
        r=e.querySelector("#debate-detail");

  function renderDebateList(){
    s.innerHTML="";
    for(const o of t){
      const isEnded=Boolean(o.ended_at);
      const c=document.createElement("div");
      c.className="w-full rounded-2xl border border-ink-700 bg-ink-900 p-4 sm:p-5 transition-all shadow-sm hover:border-slate-500";
      c.setAttribute("data-debate-id",o.id);
      c.innerHTML=\`
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0 flex-1 cursor-pointer" data-role="card-header">
            <div class="text-white font-semibold text-base sm:text-lg truncate hover:text-accent-300 transition-colors">\${Vi(o.topic)}</div>
            <div class="text-xs sm:text-sm text-slate-400 mt-1 flex items-center gap-2 flex-wrap">
              <span>\${po(o.mode,n)}</span>
              <span>•</span>
              <span>\${Vi(Yl(o.created_at))}</span>
              \${o.targetRounds?\`<span class="px-2 py-0.5 rounded-full text-[10px] font-medium bg-ink-800 border border-ink-700 text-slate-300">\${o.targetRounds} Rounds</span>\`:""}
            </div>
          </div>
          <div class="flex items-center gap-2 shrink-0">
            <span class="text-xs px-2.5 py-1 rounded-full border \${isEnded?"border-emerald-800 text-emerald-300 bg-emerald-950/50":"border-amber-500/40 text-amber-300 bg-amber-500/10 animate-pulse"} font-medium">
              \${isEnded?"✓ Scored":"● In progress"}
            </span>
            <button type="button" data-action="delete" title="Delete session" class="p-1.5 sm:px-2.5 sm:py-1 rounded-lg border border-ink-700 bg-ink-800 hover:bg-red-950 hover:border-red-800 hover:text-red-300 text-slate-400 transition-colors text-xs flex items-center gap-1">
              <span>🗑️</span><span class="hidden sm:inline text-[11px]">Delete</span>
            </button>
          </div>
        </div>
        <div class="mt-3 pt-3 border-t border-ink-700/60 flex items-center justify-between gap-2 flex-wrap">
          \${!isEnded?\`
            <div class="flex items-center gap-2 flex-wrap">
              <button type="button" data-action="resume" class="px-3.5 py-1.5 rounded-xl bg-accent-500 hover:bg-accent-400 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-accent-500/20 transition-all">
                ▶ Resume Sparring
              </button>
              <button type="button" data-action="closeout" class="px-3 py-1.5 rounded-xl bg-purple-600/20 border border-purple-500/40 hover:bg-purple-600/30 text-purple-200 font-semibold text-xs flex items-center gap-1 transition-all">
                ⚖️ Close &amp; Grade
              </button>
              <button type="button" data-action="transcript" class="px-3 py-1.5 rounded-xl border border-ink-700 bg-ink-800 hover:border-slate-500 text-slate-300 text-xs transition-all">
                📜 Transcript
              </button>
            </div>
          \`:\`
            <div class="flex items-center gap-2">
              <button type="button" data-action="transcript" class="px-3.5 py-1.5 rounded-xl border border-ink-700 bg-ink-800 hover:border-slate-500 text-slate-200 font-medium text-xs flex items-center gap-1.5 transition-all">
                📜 View Transcript &amp; Scores
              </button>
            </div>
          \`}
        </div>\`;

      const cardHeader=c.querySelector('[data-role="card-header"]');
      cardHeader.addEventListener("click",()=>{
        if(!isEnded){
          location.hash=\`#/session/\${encodeURIComponent(o.id)}\`;
        }else{
          void showDetail(o.id);
        }
      });

      const resumeBtn=c.querySelector('[data-action="resume"]');
      if(resumeBtn){
        resumeBtn.addEventListener("click",(ev)=>{
          ev.stopPropagation();
          location.hash=\`#/session/\${encodeURIComponent(o.id)}\`;
        });
      }

      const transBtn=c.querySelector('[data-action="transcript"]');
      if(transBtn){
        transBtn.addEventListener("click",(ev)=>{
          ev.stopPropagation();
          void showDetail(o.id);
        });
      }

      const closeBtn=c.querySelector('[data-action="closeout"]');
      if(closeBtn){
        closeBtn.addEventListener("click",async(ev)=>{
          ev.stopPropagation();
          if(!confirm("Close out this debate now and have the AI Judge score it?"))return;
          closeBtn.disabled=true;
          closeBtn.textContent="Scoring…";
          try{
            await zt("/api/debate/end",{debateId:o.id});
            o.ended_at=new Date().toISOString();
            renderDebateList();
            void showDetail(o.id);
          }catch(err){
            alert("Could not close out session: "+(err.message||"Try again."));
            closeBtn.disabled=false;
            closeBtn.textContent="⚖️ Close & Grade";
          }
        });
      }

      const delBtn=c.querySelector('[data-action="delete"]');
      if(delBtn){
        delBtn.addEventListener("click",async(ev)=>{
          ev.stopPropagation();
          if(!confirm(\`Delete "\${o.topic||"this session"}"? This will permanently remove all turns and scores.\`))return;
          delBtn.disabled=true;
          try{
            const delRes=await fetch(\`/api/debates/\${encodeURIComponent(o.id)}\`,{method:"DELETE"});
            if(!delRes.ok)throw new Error("Failed to delete session");
            t=t.filter(x=>x.id!==o.id);
            c.style.opacity="0";
            c.style.transform="scale(0.95)";
            setTimeout(()=>{
              c.remove();
              const cntEl=e.querySelector("#history-counter");
              if(cntEl)cntEl.textContent=\`\${t.length} session\${t.length===1?"":"s"} · tap to resume active sparring or view transcripts\`;
              if(t.length===0){
                dx(i);
              }
            },200);
          }catch(err){
            alert("Could not delete session: "+err.message);
            delBtn.disabled=false;
          }
        });
      }

      s.appendChild(c);
    }
  }

  renderDebateList();

  async function showDetail(o){
    r.classList.remove("hidden");
    r.innerHTML='<div class="rounded-2xl border border-ink-700 bg-ink-900 p-6 text-slate-500 text-sm">Loading transcript…</div>';
    r.scrollIntoView({behavior:"smooth",block:"start"});
    try{
      const c=await Ut(\`/api/debates/\${encodeURIComponent(o)}\`),
            l=c.debate,
            isDebEnded=Boolean(l.ended_at),
            d=l.mode&&l.mode!=="debate"?po(l.mode,n):lx[l.personality]??l.personality,
            u=c.turns.map(h=>{
              const p=h.role==="user"||h.role==="you";
              return\`
                <div class="flex \${p?"justify-end":"justify-start"}">
                  <div class="max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed \${p?"bg-accent-500/15 border border-accent-500/30 text-slate-100 rounded-br-md":"bg-ink-800 border border-ink-700 text-slate-200 rounded-bl-md"}">
                    <div class="text-[11px] font-semibold uppercase tracking-wide mb-1 \${p?"text-accent-400":"text-slate-500"}">
                      \${p?"You":d}
                    </div>
                    <div class="whitespace-pre-wrap">\${Vi(h.text)}</div>
                  </div>
                </div>\`;
            }).join("");

      r.innerHTML=\`
        <div class="rounded-2xl border border-ink-700 bg-ink-900 p-6">
          <div class="flex items-start justify-between gap-3 mb-5 pb-5 border-b border-ink-700 flex-wrap">
            <div class="min-w-0">
              <h2 class="text-white font-semibold text-lg sm:text-xl">\${Vi(l.topic)}</h2>
              <p class="text-sm text-slate-400 mt-1">\${po(l.mode,n)} · \${Vi(Yl(l.created_at))}</p>
            </div>
            <div class="flex items-center gap-2 flex-wrap">
              \${!isDebEnded?\`
                <button type="button" id="detail-resume-btn" class="text-xs px-3.5 py-1.5 rounded-xl bg-accent-500 hover:bg-accent-400 text-white font-bold flex items-center gap-1 shadow-md shadow-accent-500/20 transition-all">
                  ▶ Resume
                </button>
                <button type="button" id="detail-closeout-btn" class="text-xs px-3 py-1.5 rounded-xl bg-purple-600/20 border border-purple-500/40 text-purple-200 hover:bg-purple-600/30 font-semibold transition-all">
                  ⚖️ Close &amp; Grade
                </button>
              \`:""}
              <button type="button" id="detail-delete-btn" class="text-xs px-2.5 py-1.5 rounded-xl border border-ink-700 bg-ink-800 hover:bg-red-950 hover:border-red-800 hover:text-red-300 text-slate-400 transition-colors">
                🗑️ Delete
              </button>
              <button id="close-detail" class="shrink-0 text-slate-400 hover:text-white text-xl leading-none px-2" aria-label="Close transcript">×</button>
            </div>
          </div>
          <div class="space-y-3 max-h-[60vh] overflow-y-auto transcript-scroll pr-1">\${u||'<p class="text-slate-500 text-sm">No turns recorded.</p>'}</div>
        </div>\`;

      r.querySelector("#close-detail").addEventListener("click",()=>r.classList.add("hidden"));

      const dResBtn=r.querySelector("#detail-resume-btn");
      if(dResBtn){
        dResBtn.onclick=()=>{location.hash=\`#/session/\${encodeURIComponent(l.id)}\`;};
      }

      const dCloseBtn=r.querySelector("#detail-closeout-btn");
      if(dCloseBtn){
        dCloseBtn.onclick=async()=>{
          if(!confirm("Close out this debate now and have the AI Judge score it?"))return;
          dCloseBtn.disabled=true;
          dCloseBtn.textContent="Scoring…";
          try{
            await zt("/api/debate/end",{debateId:l.id});
            const item=t.find(x=>x.id===l.id);
            if(item)item.ended_at=new Date().toISOString();
            renderDebateList();
            void showDetail(l.id);
          }catch(err){
            alert("Could not close session: "+err.message);
            dCloseBtn.disabled=false;
            dCloseBtn.textContent="⚖️ Close & Grade";
          }
        };
      }

      const dDelBtn=r.querySelector("#detail-delete-btn");
      if(dDelBtn){
        dDelBtn.onclick=async()=>{
          if(!confirm(\`Delete "\${l.topic||"this session"}"?\`))return;
          dDelBtn.disabled=true;
          try{
            await fetch(\`/api/debates/\${encodeURIComponent(l.id)}\`,{method:"DELETE"});
            t=t.filter(x=>x.id!==l.id);
            renderDebateList();
            r.classList.add("hidden");
          }catch(err){
            alert("Could not delete session: "+err.message);
            dDelBtn.disabled=false;
          }
        };
      }
    }catch{
      r.innerHTML='<div class="rounded-2xl border border-red-900 bg-red-950/40 p-6 text-sm text-red-300">Couldn’t load that transcript. Try again.</div>';
    }
  }
}
`;

js = js.slice(0, dxStartIdx) + newDx + js.slice(dxEndIdx);
console.log('3. Overhauled dx(i) with Resume, Close & Grade, and Delete actions.');

// Write index-V11_actions.js and sync backwards
const outV11JsPath = path.join(__dirname, '../frontend/dist/app/assets/index-V11_actions.js');
const outV10JsPath = path.join(__dirname, '../frontend/dist/app/assets/index-V10_perfect.js');
const outV9JsPath = path.join(__dirname, '../frontend/dist/app/assets/index-V9_flawless.js');
const outV8JsPath = path.join(__dirname, '../frontend/dist/app/assets/index-V8_photoreal.js');
const outV7JsPath = path.join(__dirname, '../frontend/dist/app/assets/index-V7_structure.js');
const outV6JsPath = path.join(__dirname, '../frontend/dist/app/assets/index-V6_arena.js');

fs.writeFileSync(outV11JsPath, js, 'utf8');
fs.writeFileSync(outV10JsPath, js, 'utf8');
fs.writeFileSync(outV9JsPath, js, 'utf8');
fs.writeFileSync(outV8JsPath, js, 'utf8');
fs.writeFileSync(outV7JsPath, js, 'utf8');
fs.writeFileSync(outV6JsPath, js, 'utf8');
console.log('Wrote index-V11_actions.js and synced previous JS bundles.');

// CSS sync
const srcCssPath = path.join(__dirname, '../frontend/dist/app/assets/index-V10_perfect.css');
const css = fs.readFileSync(srcCssPath, 'utf8');
const outV11CssPath = path.join(__dirname, '../frontend/dist/app/assets/index-V11_actions.css');
fs.writeFileSync(outV11CssPath, css, 'utf8');
console.log('Wrote index-V11_actions.css.');

// Update index.html
const htmlPath = path.join(__dirname, '../frontend/dist/app/index.html');
let html = fs.readFileSync(htmlPath, 'utf8');
html = html.replace(/index-V[0-9]+_[a-zA-Z0-9_-]+\.js/g, 'index-V11_actions.js');
html = html.replace(/index-V[0-9]+_[a-zA-Z0-9_-]+\.css/g, 'index-V11_actions.css');
fs.writeFileSync(htmlPath, html, 'utf8');
console.log('Updated index.html to index-V11_actions.');

// Bump service worker version to adversaryai-v12
const swPath = path.join(__dirname, '../frontend/dist/sw.js');
let sw = fs.readFileSync(swPath, 'utf8');
sw = sw.replace(/adversaryai-v[0-9]+/g, 'adversaryai-v12');
fs.writeFileSync(swPath, sw, 'utf8');
console.log('Bumped service worker to adversaryai-v12.');

console.log('ALL SESSION RESUME, DELETE, AND CLOSEOUT PATCHES COMPLETED!');
