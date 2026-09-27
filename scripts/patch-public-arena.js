const fs = require('fs');
const path = require('path');

const bundlePath = path.join(__dirname, '..', 'frontend', 'dist', 'app', 'assets', 'index-CIu_KwmT.js');
let code = fs.readFileSync(bundlePath, 'utf8');

// 1. Update fx navbar to include Arena
const oldNav = '<a href="#/" class="px-3 py-1.5 rounded-lg hover:bg-ink-800 text-slate-300 hover:text-white">Practice</a>\n        <a href="#/history"';
const newNav = '<a href="#/" class="px-3 py-1.5 rounded-lg hover:bg-ink-800 text-slate-300 hover:text-white">Practice</a>\n        <a href="#/arena" class="px-3 py-1.5 rounded-lg hover:bg-ink-800 text-accent-400 hover:text-accent-300 font-medium flex items-center gap-1"><span>🔥</span> Arena</a>\n        <a href="#/history"';

if (code.includes(oldNav)) {
  code = code.replace(oldNav, newNav);
}

// Update mobile nav
const oldMobileNav = '<a href="#/" class="block px-3 py-2.5 rounded-lg text-slate-300 hover:text-white hover:bg-ink-800">Practice</a>\n      <a href="#/history"';
const newMobileNav = '<a href="#/" class="block px-3 py-2.5 rounded-lg text-slate-300 hover:text-white hover:bg-ink-800">Practice</a>\n      <a href="#/arena" class="block px-3 py-2.5 rounded-lg text-accent-400 hover:text-accent-300 font-semibold hover:bg-ink-800">🔥 Community Arena & Voting</a>\n      <a href="#/history"';

if (code.includes(oldMobileNav)) {
  code = code.replace(oldMobileNav, newMobileNav);
}

// 2. Add Community Arena & Voting Card in Scorecard UI
const oldScorecardEnd = '<div class="flex flex-col sm:flex-row gap-3">\n        <a href="#/setup/${encodeURIComponent(t.modeId)}" class="flex-1 text-center px-5 py-3 rounded-xl bg-accent-500 hover:bg-accent-400 text-[#fff] font-semibold">Practice again</a>';

const arenaSharePanelHtml = `
      <div class="rounded-2xl border border-accent-500/35 bg-ink-900 p-5 sm:p-6 mb-6" id="arena-share-panel">
        <div class="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div class="flex items-center gap-3">
            <span class="text-2xl">🌐</span>
            <div>
              <div class="text-white font-semibold text-sm">Community Arena & Voting</div>
              <p class="text-xs text-slate-400">Share this match with spectators to vote on who won and rate arguments.</p>
            </div>
          </div>
          <button type="button" id="arena-toggle-btn" class="px-3.5 py-1.5 rounded-lg text-xs font-semibold border border-accent-500/50 text-accent-300 bg-accent-500/10 hover:bg-accent-500/20 transition-all cursor-pointer">
            Publish to Arena
          </button>
        </div>
        <div id="arena-share-tray" class="hidden pt-3 border-t border-ink-700">
          <div class="text-xs text-slate-400 mb-2 font-medium">Public Spectator Link (no account required to watch & vote):</div>
          <div class="flex flex-wrap items-center gap-2 mb-2">
            <input type="text" readonly id="arena-share-link" class="flex-1 min-w-[220px] bg-ink-950 border border-ink-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 select-all font-mono" />
            <button type="button" id="arena-copy-btn" class="px-3 py-1.5 rounded-lg bg-accent-500 hover:bg-accent-400 text-white text-xs font-semibold">Copy</button>
            <a id="arena-share-x" target="_blank" rel="noopener" class="px-3 py-1.5 rounded-lg bg-black hover:bg-ink-800 border border-ink-700 text-xs text-white font-semibold flex items-center gap-1">𝕏 Share</a>
            <a id="arena-share-reddit" target="_blank" rel="noopener" class="px-3 py-1.5 rounded-lg bg-[#ff4500]/20 hover:bg-[#ff4500]/30 border border-[#ff4500]/40 text-xs text-orange-200 font-semibold flex items-center gap-1">Reddit</a>
          </div>
        </div>
      </div>
`;

if (code.includes(oldScorecardEnd) && !code.includes('id="arena-share-panel"')) {
  code = code.replace(oldScorecardEnd, arenaSharePanelHtml + oldScorecardEnd);
}

// 3. Hook arena share wiring in ax(i,e,t)
const hookAxTarget = 'function ax(i,e,t){const n=i.querySelector("#verdict-btn");';
const hookAxCode = `function ax(i,e,t){
  const _shBtn=i.querySelector("#arena-toggle-btn"),_shTray=i.querySelector("#arena-share-tray"),_shLink=i.querySelector("#arena-share-link"),_shCopy=i.querySelector("#arena-copy-btn"),_shX=i.querySelector("#arena-share-x"),_shRed=i.querySelector("#arena-share-reddit");
  if(_shBtn&&_shTray&&_shLink){
    const _pubUrl=\`\${location.origin}/debate/\${e}\`;
    _shLink.value=_pubUrl;
    let _isPub=false;
    const _applyPubUI=(pub)=>{
      _isPub=pub;
      if(pub){
        _shBtn.className="px-3.5 py-1.5 rounded-lg text-xs font-semibold border border-emerald-500/50 text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 transition-all cursor-pointer";
        _shBtn.innerHTML="✓ Public in Arena";
        _shTray.classList.remove("hidden");
      }else{
        _shBtn.className="px-3.5 py-1.5 rounded-lg text-xs font-semibold border border-accent-500/50 text-accent-300 bg-accent-500/10 hover:bg-accent-500/20 transition-all cursor-pointer";
        _shBtn.innerHTML="Publish to Arena";
        _shTray.classList.add("hidden");
      }
      const _top=t.topic?('"' + t.topic + '"'):"this debate";
      _shX.href="https://twitter.com/intent/tweet?text="+encodeURIComponent("Who won this debate? Watch me spar against " + (t.personaLabel||"AI") + " on " + _top + " and cast your vote on AdversaryAI: " + _pubUrl);
      _shRed.href="https://reddit.com/submit?url="+encodeURIComponent(_pubUrl)+"&title="+encodeURIComponent("Who won this debate? Sparring against " + (t.personaLabel||"AI") + " on " + _top);
    };
    Ut("/api/debates/"+encodeURIComponent(e)).then(res=>{if(res&&res.debate)_applyPubUI(Boolean(res.debate.is_public||res.debate.isPublic));}).catch(()=>{});
    _shBtn.addEventListener("click",async()=>{
      _shBtn.disabled=true;
      try{
        const nxt=!_isPub;
        await zt("/api/debate/toggle-public",{debateId:e,isPublic:nxt});
        _applyPubUI(nxt);
      }catch{alert("Could not update public status. Please try again.");}
      finally{_shBtn.disabled=false;}
    });
    if(_shCopy){
      _shCopy.addEventListener("click",async()=>{
        try{await navigator.clipboard.writeText(_pubUrl);_shCopy.textContent="Copied!";setTimeout(()=>{_shCopy.textContent="Copy";},2000);}
        catch{prompt("Copy share link:",_pubUrl);}
      });
    }
  }
  const n=i.querySelector("#verdict-btn");`;

if (code.includes(hookAxTarget) && !code.includes('_applyPubUI')) {
  code = code.replace(hookAxTarget, hookAxCode);
}

// 4. In dx (history): add Arena link button in transcript detail drawer
const historyOldBlock = `          <div class="space-y-3 max-h-[60vh] overflow-y-auto transcript-scroll pr-1">\${u||'<p class="text-slate-500 text-sm">No turns recorded.</p>'}</div>
        </div>\`,r.querySelector("#close-detail").addEventListener("click",()=>r.classList.add("hidden"))`;

const historyNewBlock = `          <div class="space-y-3 max-h-[60vh] overflow-y-auto transcript-scroll pr-1">\${u||'<p class="text-slate-500 text-sm">No turns recorded.</p>'}</div>
        </div>\`;
        const _hshBtn = r.querySelector("#history-arena-share-btn");
        if(_hshBtn){
          _hshBtn.addEventListener("click",async()=>{
            _hshBtn.disabled=true;
            try{
              const isP=Boolean(l.is_public||l.isPublic);
              if(!isP){
                await zt("/api/debate/toggle-public",{debateId:o,isPublic:true});
                l.is_public=1;
              }
              const u=\`\${location.origin}/debate/\${o}\`;
              try{await navigator.clipboard.writeText(u);alert("Debate published to Arena and link copied:\\n" + u);}
              catch{prompt("Arena Link:",u);}
            }catch{alert("Could not publish debate.");}
            finally{_hshBtn.disabled=false;}
          });
        }
        r.querySelector("#close-detail").addEventListener("click",()=>r.classList.add("hidden"))`;

// Also replace the button in header
const historyButtonOld = '<button id="close-detail" class="shrink-0 text-slate-500 hover:text-white text-xl leading-none px-2" aria-label="Close transcript">×</button>';
const historyButtonNew = '<div class="flex items-center gap-2"><button type="button" id="history-arena-share-btn" class="text-xs px-2.5 py-1 rounded-lg border border-accent-500/40 text-accent-300 bg-accent-500/10 hover:bg-accent-500/20 font-medium">🌐 Arena Link</button><button id="close-detail" class="shrink-0 text-slate-500 hover:text-white text-xl leading-none px-2" aria-label="Close transcript">×</button></div>';

if (code.includes(historyButtonOld) && !code.includes('history-arena-share-btn')) {
  code = code.replace(historyButtonOld, historyButtonNew);
}

if (code.includes(historyOldBlock) && !code.includes('_hshBtn')) {
  code = code.replace(historyOldBlock, historyNewBlock);
}

// 5. Append renderGuestNav, renderPublicWatch, and renderArenaFeed functions
const guestNavAndArenaCode = `
function renderGuestNav(child){
  const e=document.createElement("header");
  e.className="border-b border-ink-700 bg-ink-900/80 backdrop-blur sticky top-0 z-20";
  e.innerHTML=\`<div class="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-2">
    <a href="#/" class="flex items-center gap-2 shrink-0">
      <svg width="28" height="28" viewBox="0 0 512 512" aria-hidden="true" class="shrink-0"><rect width="512" height="512" rx="112" fill="#0d0f14"/><polygon points="256,104 400,392 112,392" fill="none" stroke="#e8392e" stroke-width="34" stroke-linejoin="round"/><g fill="#e8392e"><rect x="165" y="264" width="22" height="44" rx="11"/><rect x="193" y="244" width="22" height="84" rx="11"/><rect x="221" y="226" width="22" height="120" rx="11"/><rect x="249" y="212" width="22" height="148" rx="11"/><rect x="277" y="230" width="22" height="112" rx="11"/><rect x="305" y="248" width="22" height="76" rx="11"/><rect x="333" y="266" width="22" height="40" rx="11"/></g></svg>
      <span class="font-display text-lg tracking-tight">Adversary<span class="text-accent-500">AI</span></span>
    </a>
    <nav class="flex items-center gap-2 text-sm">
      <a href="#/arena" class="px-3 py-1.5 rounded-lg text-accent-400 hover:text-accent-300 font-semibold flex items-center gap-1.5"><span class="text-base">🔥</span> Community Arena</a>
      <a href="#/login" class="px-3 py-1.5 rounded-lg hover:bg-ink-800 text-slate-300 hover:text-white">Log in</a>
      <a href="#/signup" class="px-3.5 py-1.5 rounded-lg bg-accent-500 hover:bg-accent-400 text-white font-semibold text-xs">Start Free Trial</a>
    </nav>
  </div>\`;
  Yi.innerHTML="";
  Yi.appendChild(e);
  const r=document.createElement("main");
  r.className="flex-1 w-full";
  r.appendChild(child);
  Yi.appendChild(r);
}

async function renderPublicWatch(container, debateId){
  container.innerHTML=\`<div class="max-w-4xl mx-auto px-4 py-8 text-center text-slate-400">
    <div class="inline-block animate-spin text-2xl mb-3">⚡</div>
    <p>Loading spectator match…</p>
  </div>\`;
  let data;
  try{
    data = await Ut("/api/public/debate/" + encodeURIComponent(debateId));
  }catch(err){
    container.innerHTML=\`<div class="max-w-xl mx-auto px-4 py-16 text-center">
      <div class="text-4xl mb-3">🔒</div>
      <h1 class="text-2xl font-bold text-white mb-2">Debate Not Available</h1>
      <p class="text-sm text-slate-400 mb-6">This debate may be private or has been removed by the author.</p>
      <a href="#/arena" class="px-5 py-2.5 rounded-xl bg-accent-500 hover:bg-accent-400 text-white font-semibold text-sm">Browse Public Arena</a>
    </div>\`;
    return;
  }

  const { debate, turns, verdict, votes: initialVotes, userVote: initialUserVote, reactions: initialReactions, userReactions: initialUserReactions } = data;
  let currentVotes = initialVotes || { you: 0, opponent: 0, draw: 0, total: 0 };
  let currentUserVote = initialUserVote;
  let currentReactions = initialReactions || {};
  let currentUserReactions = new Set(initialUserReactions || []);

  const personaName = debate.personaLabel || debate.personality || "AI Sparring Partner";
  const shareUrl = \`\${location.origin}/debate/\${debate.id}\`;

  function buildHtml(){
    const totalVotes = currentVotes.total || 0;
    const userPct = totalVotes > 0 ? Math.round((currentVotes.you / totalVotes) * 100) : 50;
    const oppPct = totalVotes > 0 ? (100 - userPct) : 50;

    const reactionList = [
      { key: "fire", emoji: "🔥", label: "Brilliant" },
      { key: "skull", emoji: "💀", label: "Savage" },
      { key: "brain", emoji: "🧠", label: "High IQ" },
      { key: "flag", emoji: "🚩", label: "Fallacy" },
      { key: "clap", emoji: "👏", label: "Respect" }
    ];

    return \`
    <div class="max-w-4xl mx-auto px-4 py-6 sm:py-10">
      <div class="flex items-center justify-between gap-3 mb-6">
        <a href="#/arena" class="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors">
          <span>←</span> Back to Community Arena
        </a>
        <div class="flex items-center gap-2">
          <span class="text-xs text-slate-500 font-mono">👁️ \${debate.views || 1} views</span>
          <button type="button" id="copy-watch-btn" class="px-2.5 py-1 rounded-lg border border-ink-700 bg-ink-800 text-slate-300 hover:text-white text-xs font-semibold">Copy Link</button>
        </div>
      </div>

      <div class="rounded-3xl border border-ink-700 bg-gradient-to-b from-ink-800/90 to-ink-900/90 p-6 sm:p-8 mb-6 shadow-xl">
        <div class="flex flex-wrap items-center gap-2 mb-3">
          <span class="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-accent-500/15 text-accent-300 border border-accent-500/30">
            \${Vi(debate.mode || "Debate")} Arena
          </span>
          <span class="text-xs text-slate-500">Match held on \${Vi(Yl(debate.createdAt))}</span>
        </div>
        <h1 class="font-display text-2xl sm:text-3xl text-white font-bold mb-4 leading-tight">\${Vi(debate.topic)}</h1>
        <div class="flex items-center gap-3 text-sm text-slate-300">
          <div class="flex items-center gap-2">
            <span class="w-8 h-8 rounded-full bg-accent-500/20 text-accent-400 font-bold flex items-center justify-center text-xs border border-accent-500/40">YOU</span>
            <span class="font-semibold text-white">Human Debater</span>
          </div>
          <span class="text-slate-500 font-bold">VS</span>
          <div class="flex items-center gap-2">
            <span class="w-8 h-8 rounded-full bg-ink-700 text-slate-200 font-bold flex items-center justify-center text-xs border border-ink-600">AI</span>
            <span class="font-semibold text-accent-300">\${Vi(personaName)}</span>
          </div>
        </div>
      </div>

      <div class="rounded-2xl border border-accent-500/40 bg-ink-900 p-6 sm:p-7 mb-6 shadow-lg relative overflow-hidden" id="voting-card">
        <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <div class="text-xs font-bold uppercase tracking-wider text-accent-400 flex items-center gap-1.5">
              <span>🗳️</span> Community Spectator Verdict
            </div>
            <h2 class="text-lg sm:text-xl font-bold text-white mt-0.5">Who won this debate?</h2>
          </div>
          <div class="text-xs text-slate-400 font-mono">
            <span id="vote-count-label" class="font-bold text-white">\${totalVotes}</span> spectator vote\${totalVotes === 1 ? "" : "s"} cast
          </div>
        </div>

        <div class="mb-4">
          <div class="flex justify-between text-xs font-bold mb-1.5">
            <span class="text-emerald-400 flex items-center gap-1">Human Debater (\${userPct}%)</span>
            <span class="text-rose-400 flex items-center gap-1">(\${oppPct}%) \${Vi(personaName)}</span>
          </div>
          <div class="w-full h-3 rounded-full bg-ink-950 overflow-hidden flex border border-ink-700">
            <div id="user-vote-bar" class="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500" style="width:\${userPct}%"></div>
            <div id="opp-vote-bar" class="h-full bg-gradient-to-r from-rose-500 to-red-600 transition-all duration-500" style="width:\${oppPct}%"></div>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-5" id="vote-buttons-grid">
          <button type="button" data-vote="you" class="vote-action-btn px-4 py-3 rounded-xl border text-sm font-semibold text-left transition-all \${currentUserVote === "you" ? "border-emerald-500 bg-emerald-500/20 text-emerald-200 ring-2 ring-emerald-500/50" : "border-ink-700 bg-ink-800 text-slate-200 hover:border-slate-500"}">
            <span class="block text-xs uppercase tracking-wider text-emerald-400 font-bold mb-0.5">Vote For</span>
            <span>🏆 Human Debater</span>
          </button>
          <button type="button" data-vote="opponent" class="vote-action-btn px-4 py-3 rounded-xl border text-sm font-semibold text-left transition-all \${currentUserVote === "opponent" ? "border-rose-500 bg-rose-500/20 text-rose-200 ring-2 ring-rose-500/50" : "border-ink-700 bg-ink-800 text-slate-200 hover:border-slate-500"}">
            <span class="block text-xs uppercase tracking-wider text-rose-400 font-bold mb-0.5">Vote For</span>
            <span>🤖 \${Vi(personaName)}</span>
          </button>
          <button type="button" data-vote="draw" class="vote-action-btn px-4 py-3 rounded-xl border text-sm font-semibold text-left transition-all \${currentUserVote === "draw" ? "border-amber-500 bg-amber-500/20 text-amber-200 ring-2 ring-amber-500/50" : "border-ink-700 bg-ink-800 text-slate-200 hover:border-slate-500"}">
            <span class="block text-xs uppercase tracking-wider text-amber-400 font-bold mb-0.5">Vote For</span>
            <span>⚖️ Dead Even Draw</span>
          </button>
        </div>

        <div class="pt-4 border-t border-ink-800 flex flex-wrap items-center justify-between gap-3">
          <div class="text-xs text-slate-400 font-medium">React to match quality:</div>
          <div class="flex flex-wrap items-center gap-1.5" id="reactions-tray">
            \${reactionList.map(r => \`
              <button type="button" data-react="\${r.key}" class="react-pill-btn px-3 py-1.5 rounded-full border text-xs font-semibold flex items-center gap-1.5 transition-all \${currentUserReactions.has(r.key) ? "border-accent-500 bg-accent-500/25 text-white ring-1 ring-accent-500" : "border-ink-700 bg-ink-800/80 text-slate-300 hover:border-slate-500"}">
                <span>\${r.emoji}</span>
                <span>\${r.label}</span>
                <span class="text-[10px] text-slate-400 font-mono ml-0.5" data-react-count="\${r.key}">\${currentReactions[r.key] || 0}</span>
              </button>
            \`).join("")}
          </div>
        </div>
      </div>

      \${verdict ? \`
      <div class="rounded-2xl border border-ink-700 bg-ink-900 p-6 sm:p-8 mb-6">
        <div class="flex items-center gap-3 mb-4">
          <span class="text-accent-400 text-2xl">⚖️</span>
          <div>
            <div class="text-white font-semibold text-lg">Official AI Judge Verdict</div>
            <p class="text-xs text-slate-500">Impartial evaluation — both sides scored by the identical 4-dimension rubric.</p>
          </div>
        </div>
        
        <div class="rounded-xl border \${ox(verdict).tone} px-5 py-4 mb-6 text-center">
          <div class="mb-2 flex justify-center opacity-90">\${ox(verdict).icon}</div>
          <div class="font-display text-2xl font-semibold">\${Vi(ox(verdict).title)}</div>
          <p class="text-sm opacity-80 mt-1">\${Vi(ox(verdict).sub)}</p>
        </div>

        <div class="grid sm:grid-cols-2 gap-x-8 gap-y-6 mb-6">
          <div>
            <div class="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">Human Debater</div>
            <div class="space-y-4">
              \${rx.map(([k, lbl]) => $u(lbl, verdict.you?.[k] ?? null)).join("")}
            </div>
          </div>
          <div>
            <div class="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">\${Vi(personaName)}</div>
            <div class="space-y-4">
              \${rx.map(([k, lbl]) => $u(lbl, verdict.opponent?.[k] ?? null)).join("")}
            </div>
          </div>
        </div>

        <div class="rounded-xl bg-ink-800/60 border border-ink-700 p-5 mb-4">
          <div class="text-sm font-semibold text-slate-300 mb-2">The judge's reasoning</div>
          <p class="text-sm text-slate-400 leading-relaxed whitespace-pre-wrap">\${Vi(verdict.reasoning || "Scoring rendered.")}</p>
        </div>

        \${verdict.turningPoint ? \`
        <div class="rounded-xl border border-accent-500/30 bg-accent-500/5 p-5">
          <div class="text-sm font-semibold text-accent-300 mb-2">Decisive turning point</div>
          <p class="text-sm text-slate-400 leading-relaxed whitespace-pre-wrap">\${Vi(verdict.turningPoint)}</p>
        </div>\` : ""}
      </div>
      \` : ""}

      <div class="rounded-2xl border border-ink-700 bg-ink-900 p-6 mb-6">
        <div class="flex items-center justify-between gap-3 mb-5 pb-4 border-b border-ink-700">
          <div>
            <h2 class="text-white font-semibold text-lg">Full Sparring Replay</h2>
            <p class="text-xs text-slate-400 mt-0.5">\${turns.length} exchange\${turns.length === 1 ? "" : "s"} recorded</p>
          </div>
        </div>
        <div class="space-y-4" id="turns-container">
          \${turns.map(h => {
            const isUser = h.role === "user" || h.role === "you";
            return \`
            <div class="flex \${isUser ? "justify-end" : "justify-start"}">
              <div class="max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed \${isUser ? "bg-accent-500/15 border border-accent-500/30 text-slate-100 rounded-br-md" : "bg-ink-800 border border-ink-700 text-slate-200 rounded-bl-md"}">
                <div class="flex items-center justify-between gap-3 mb-1.5">
                  <span class="text-[11px] font-semibold uppercase tracking-wide \${isUser ? "text-accent-400" : "text-slate-400"}">
                    \${isUser ? "Human Debater" : Vi(personaName)}
                  </span>
                  \${!isUser ? \`<button type="button" data-play-text="\${encodeURIComponent(h.text)}" class="speak-turn-btn text-[11px] text-accent-400 hover:text-accent-300 font-semibold flex items-center gap-1 cursor-pointer">🔊 Listen</button>\` : ""}
                </div>
                <div class="whitespace-pre-wrap">\${Vi(h.text)}</div>
              </div>
            </div>\`;
          }).join("")}
        </div>
      </div>

      <div class="rounded-3xl border border-accent-500/40 bg-gradient-to-r from-accent-500/20 via-ink-900 to-ink-900 p-6 sm:p-8 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-6 shadow-2xl">
        <div>
          <span class="text-xs font-bold uppercase tracking-wider text-accent-400">Step Into The Arena</span>
          <h2 class="text-xl sm:text-2xl font-bold text-white mt-1">Think you have better arguments?</h2>
          <p class="text-sm text-slate-300 mt-1 max-w-lg">Spar directly against \${Vi(personaName)} or any of our 10 practice modes. Real-time 3D voice lip-sync and instant coaching scores.</p>
        </div>
        <div class="flex flex-col sm:flex-row items-center gap-3 shrink-0 w-full sm:w-auto">
          <a href="#/setup/\${encodeURIComponent(debate.mode || "debate")}" class="w-full sm:w-auto text-center px-6 py-3 rounded-xl bg-accent-500 hover:bg-accent-400 text-white font-bold text-sm shadow-lg shadow-accent-500/20">
            Spar \${Vi(personaName)} Free
          </a>
          <a href="#/signup" class="w-full sm:w-auto text-center px-5 py-3 rounded-xl border border-ink-700 bg-ink-800 hover:border-slate-500 text-slate-200 text-sm font-semibold">
            Claim 15 Free Rounds
          </a>
        </div>
      </div>
    </div>\`;
  }

  container.innerHTML = buildHtml();

  const copyBtn = container.querySelector("#copy-watch-btn");
  if (copyBtn) {
    copyBtn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(shareUrl);
        copyBtn.textContent = "Copied!";
        setTimeout(() => { copyBtn.textContent = "Copy Link"; }, 2000);
      } catch {
        prompt("Share link:", shareUrl);
      }
    });
  }

  container.querySelectorAll(".speak-turn-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const text = decodeURIComponent(btn.getAttribute("data-play-text") || "");
      if (!text) return;
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.rate = 1.05;
        u.pitch = 0.95;
        btn.textContent = "🔊 Speaking…";
        u.onend = () => { btn.textContent = "🔊 Listen"; };
        u.onerror = () => { btn.textContent = "🔊 Listen"; };
        window.speechSynthesis.speak(u);
      } else {
        alert("Speech synthesis is not supported on this browser.");
      }
    });
  });

  const voteGrid = container.querySelector("#vote-buttons-grid");
  if (voteGrid) {
    voteGrid.querySelectorAll(".vote-action-btn").forEach(btn => {
      btn.addEventListener("click", async () => {
        const selVote = btn.getAttribute("data-vote");
        if (!selVote) return;
        voteGrid.querySelectorAll(".vote-action-btn").forEach(b => { b.disabled = true; });
        try {
          const res = await zt("/api/public/debate/" + encodeURIComponent(debate.id) + "/vote", { vote: selVote });
          if (res.ok && res.votes) {
            currentVotes = res.votes;
            currentUserVote = res.vote;
            const tVotes = currentVotes.total || 0;
            const uPct = tVotes > 0 ? Math.round((currentVotes.you / tVotes) * 100) : 50;
            const oPct = tVotes > 0 ? (100 - uPct) : 50;
            
            const uBar = container.querySelector("#user-vote-bar");
            const oBar = container.querySelector("#opp-vote-bar");
            const vLabel = container.querySelector("#vote-count-label");
            if (uBar) uBar.style.width = uPct + "%";
            if (oBar) oBar.style.width = oPct + "%";
            if (vLabel) vLabel.textContent = String(tVotes);

            voteGrid.querySelectorAll(".vote-action-btn").forEach(b => {
              const bVote = b.getAttribute("data-vote");
              if (bVote === currentUserVote) {
                b.className = "vote-action-btn px-4 py-3 rounded-xl border text-sm font-semibold text-left transition-all border-accent-500 bg-accent-500/20 text-white ring-2 ring-accent-500/50";
              } else {
                b.className = "vote-action-btn px-4 py-3 rounded-xl border text-sm font-semibold text-left transition-all border-ink-700 bg-ink-800 text-slate-200 hover:border-slate-500";
              }
            });
          }
        } catch {
          alert("Could not register vote. Please try again.");
        } finally {
          voteGrid.querySelectorAll(".vote-action-btn").forEach(b => { b.disabled = false; });
        }
      });
    });
  }

  const reactionsTray = container.querySelector("#reactions-tray");
  if (reactionsTray) {
    reactionsTray.querySelectorAll(".react-pill-btn").forEach(btn => {
      btn.addEventListener("click", async () => {
        const reactKey = btn.getAttribute("data-react");
        if (!reactKey) return;
        try {
          const res = await zt("/api/public/debate/" + encodeURIComponent(debate.id) + "/react", { reaction: reactKey });
          if (res.ok && res.reactions) {
            currentReactions = res.reactions;
            if (res.active) currentUserReactions.add(reactKey);
            else currentUserReactions.delete(reactKey);

            reactionsTray.querySelectorAll("[data-react-count]").forEach(span => {
              const k = span.getAttribute("data-react-count");
              if (k && currentReactions[k] !== undefined) span.textContent = String(currentReactions[k]);
            });

            if (res.active) {
              btn.className = "react-pill-btn px-3 py-1.5 rounded-full border text-xs font-semibold flex items-center gap-1.5 transition-all border-accent-500 bg-accent-500/25 text-white ring-1 ring-accent-500";
            } else {
              btn.className = "react-pill-btn px-3 py-1.5 rounded-full border text-xs font-semibold flex items-center gap-1.5 transition-all border-ink-700 bg-ink-800/80 text-slate-300 hover:border-slate-500";
            }
          }
        } catch {
          // ignore
        }
      });
    });
  }
}

async function renderArenaFeed(container){
  container.innerHTML = \`<div class="max-w-6xl mx-auto px-4 py-8 text-center text-slate-400">
    <div class="inline-block animate-spin text-2xl mb-3">⚡</div>
    <p>Loading Community Arena…</p>
  </div>\`;

  let feed = [];
  try {
    const res = await Ut("/api/public/debates");
    feed = Array.isArray(res) ? res : res.debates || [];
  } catch (err) {
    container.innerHTML = \`<div class="max-w-xl mx-auto px-4 py-16 text-center">
      <h1 class="text-2xl font-bold text-white mb-2">Couldn't Load Arena</h1>
      <p class="text-sm text-slate-400 mb-6">Check your internet connection and try again.</p>
      <button onclick="location.reload()" class="px-5 py-2.5 rounded-xl bg-accent-500 hover:bg-accent-400 text-white font-semibold text-sm">Reload Arena</button>
    </div>\`;
    return;
  }

  function renderGrid(debatesList) {
    if (debatesList.length === 0) {
      return \`
      <div class="text-center py-20 rounded-3xl border border-ink-700 bg-ink-900 p-8">
        <div class="text-4xl mb-3">🏛️</div>
        <h3 class="text-xl font-bold text-white mb-2">No Public Matches in this Category Yet</h3>
        <p class="text-sm text-slate-400 mb-6 max-w-md mx-auto">Be the first to step into the arena and publish your sparring session for the community to watch and vote on.</p>
        <a href="#/" class="px-6 py-3 rounded-xl bg-accent-500 hover:bg-accent-400 text-white font-bold text-sm">Start Your Match</a>
      </div>\`;
    }

    return \`
    <div class="grid md:grid-cols-2 gap-5">
      \${debatesList.map(d => {
        const totalVotes = d.votes?.total || 0;
        const userPct = totalVotes > 0 ? Math.round(((d.votes.you || 0) / totalVotes) * 100) : 50;
        const oppPct = totalVotes > 0 ? (100 - userPct) : 50;
        const persona = d.personaLabel || d.personality || "AI Partner";
        
        let winnerBadge = '<span class="text-xs px-2.5 py-0.5 rounded-full border border-ink-700 text-slate-400 bg-ink-800">Scored</span>';
        if (d.winner === "you") {
          winnerBadge = '<span class="text-xs px-2.5 py-0.5 rounded-full border border-emerald-500/40 text-emerald-300 bg-emerald-500/10 font-semibold">🏆 Human Won</span>';
        } else if (d.winner === "opponent") {
          winnerBadge = '<span class="text-xs px-2.5 py-0.5 rounded-full border border-rose-500/40 text-rose-300 bg-rose-500/10 font-semibold">🤖 ' + Vi(persona) + ' Won</span>';
        } else if (d.winner === "draw") {
          winnerBadge = '<span class="text-xs px-2.5 py-0.5 rounded-full border border-amber-500/40 text-amber-300 bg-amber-500/10 font-semibold">⚖️ Draw</span>';
        }

        return \`
        <div class="rounded-2xl border border-ink-700 bg-ink-900 p-6 flex flex-col justify-between hover:border-slate-500 transition-all shadow-md">
          <div>
            <div class="flex items-center justify-between gap-2 mb-3">
              <span class="text-[11px] font-bold uppercase tracking-wider text-accent-400">\${Vi(d.mode || "Debate")}</span>
              \${winnerBadge}
            </div>
            <a href="#/watch/\${encodeURIComponent(d.id)}" class="block group">
              <h3 class="text-lg font-bold text-white group-hover:text-accent-300 transition-colors line-clamp-2 mb-2 leading-snug">\${Vi(d.topic)}</h3>
            </a>
            <div class="flex items-center gap-2 text-xs text-slate-400 mb-4">
              <span>Human</span>
              <span class="text-slate-600 font-bold">VS</span>
              <span class="font-semibold text-slate-200">\${Vi(persona)}</span>
              <span class="text-slate-600">·</span>
              <span>\${Vi(Yl(d.createdAt))}</span>
            </div>
          </div>

          <div>
            <div class="rounded-xl bg-ink-800/80 border border-ink-700/60 p-3 mb-4">
              <div class="flex justify-between text-[11px] font-semibold mb-1 text-slate-300">
                <span class="text-emerald-400">Human (\${userPct}%)</span>
                <span class="text-xs text-slate-400 font-mono">\${totalVotes} vote\${totalVotes === 1 ? "" : "s"}</span>
                <span class="text-rose-400">\${Vi(persona)} (\${oppPct}%)</span>
              </div>
              <div class="w-full h-2 rounded-full bg-ink-950 overflow-hidden flex border border-ink-700">
                <div class="h-full bg-emerald-500" style="width:\${userPct}%"></div>
                <div class="h-full bg-rose-500" style="width:\${oppPct}%"></div>
              </div>
            </div>

            <div class="flex items-center justify-between gap-3 pt-2">
              <span class="text-xs text-slate-500 font-mono">👁️ \${d.views || 0} views</span>
              <div class="flex items-center gap-2">
                <a href="#/setup/\${encodeURIComponent(d.mode || "debate")}?topic=\${encodeURIComponent(d.topic)}" class="px-3 py-1.5 rounded-lg border border-ink-700 bg-ink-800 hover:border-slate-500 text-xs font-semibold text-slate-300">
                  Spar Topic
                </a>
                <a href="#/watch/\${encodeURIComponent(d.id)}" class="px-3.5 py-1.5 rounded-lg bg-accent-500 hover:bg-accent-400 text-white text-xs font-bold">
                  Watch & Vote →
                </a>
              </div>
            </div>
          </div>
        </div>\`;
      }).join("")}
    </div>\`;
  }

  container.innerHTML = \`
  <div class="max-w-6xl mx-auto px-4 py-6 sm:py-10">
    <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
      <div>
        <p class="text-xs font-bold uppercase tracking-wider text-accent-400 mb-1">SPECTATOR FEED & COMMUNITY RATINGS</p>
        <h1 class="font-display text-3xl sm:text-4xl text-white font-bold">🔥 The Community Arena</h1>
        <p class="text-sm text-slate-400 mt-2 max-w-xl">
          Watch real human debaters spar against relentless AI archetypes, see the AI judge's official scoring, and vote on who made the winning arguments.
        </p>
      </div>
      <a href="#/" class="px-5 py-2.5 rounded-xl bg-accent-500 hover:bg-accent-400 text-white font-bold text-sm shrink-0 self-start md:self-auto shadow-lg shadow-accent-500/20">
        + Spar a Topic Yourself
      </a>
    </div>

    <div class="flex flex-wrap items-center gap-2 mb-6" id="arena-filter-bar">
      <button type="button" data-filter="all" class="px-3.5 py-1.5 rounded-xl text-xs font-bold border border-accent-500 bg-accent-500/10 text-white">All Matches (\${feed.length})</button>
      <button type="button" data-filter="debate" class="px-3.5 py-1.5 rounded-xl text-xs font-bold border border-ink-700 bg-ink-900 text-slate-300 hover:border-slate-500">Debate & Worldviews</button>
      <button type="button" data-filter="historical" class="px-3.5 py-1.5 rounded-xl text-xs font-bold border border-ink-700 bg-ink-900 text-slate-300 hover:border-slate-500">Historical Figures</button>
      <button type="button" data-filter="sales" class="px-3.5 py-1.5 rounded-xl text-xs font-bold border border-ink-700 bg-ink-900 text-slate-300 hover:border-slate-500">Negotiation & Sales</button>
    </div>

    <div id="arena-feed-grid">
      \${renderGrid(feed)}
    </div>
  </div>\`;

  const filterBar = container.querySelector("#arena-filter-bar");
  const feedGrid = container.querySelector("#arena-feed-grid");
  if (filterBar && feedGrid) {
    filterBar.querySelectorAll("button").forEach(b => {
      b.addEventListener("click", () => {
        filterBar.querySelectorAll("button").forEach(o => {
          o.className = "px-3.5 py-1.5 rounded-xl text-xs font-bold border border-ink-700 bg-ink-900 text-slate-300 hover:border-slate-500";
        });
        b.className = "px-3.5 py-1.5 rounded-xl text-xs font-bold border border-accent-500 bg-accent-500/10 text-white";
        const f = b.getAttribute("data-filter");
        let filtered = feed;
        if (f !== "all") {
          filtered = feed.filter(d => d.mode === f);
        }
        feedGrid.innerHTML = renderGrid(filtered);
      });
    });
  }
}
`;

// 6. Integrate router Yu to handle /watch/:id and /arena
const routerStartTarget = 'async function Yu(){const i=location.hash.replace(/^#/,"")||"/",e=i.startsWith("/")?i:"/"+i,n=await da()!==null,s=e.match(/^\\/join\\/([A-Za-z0-9]+)$/);if(s){const d=document.createElement("div");Jl(d),await hx(d,s[1].toUpperCase());return}';

const routerStartReplace = `
async function Yu(){
  const i=location.hash.replace(/^#/,"")||"/",e=i.startsWith("/")?i:"/"+i,n=await da()!==null,s=e.match(/^\\/join\\/([A-Za-z0-9]+)$/);
  if(s){const d=document.createElement("div");Jl(d),await hx(d,s[1].toUpperCase());return;}
  const _isW = e.match(/^\\/watch\\/([A-Za-z0-9_-]+)$/);
  const _isA = (e === "/arena");
  if(_isW){
    const d=document.createElement("div");
    if(n){ fx(d); } else { renderGuestNav(d); }
    await renderPublicWatch(d,_isW[1]);
    return;
  }
  if(_isA){
    const d=document.createElement("div");
    if(n){ fx(d); } else { renderGuestNav(d); }
    await renderArenaFeed(d);
    return;
  }
`;

if (code.includes(routerStartTarget) && !code.includes('_isW')) {
  code = code.replace(routerStartTarget, guestNavAndArenaCode + routerStartReplace);
}

fs.writeFileSync(bundlePath, code, 'utf8');
console.log('Successfully patched index-CIu_KwmT.js with Public Arena & Community Voting!');
