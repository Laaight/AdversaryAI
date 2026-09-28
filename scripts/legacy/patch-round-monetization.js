const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'frontend', 'dist', 'app', 'assets', 'index-CIu_KwmT.js');
let code = fs.readFileSync(filePath, 'utf8');

// 1. In Mh: add match length selector
const fieldListTarget = '<div class="space-y-5" id="field-list">\n        ${p.map(T=>`<div>${vh(T)}</div>`).join("")}\n      </div>';
const roundSelectorHtml = `
      <div class="mt-6 mb-2">
        <label class="block text-sm font-semibold text-slate-200 mb-2">Match Length</label>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5" id="round-select-grid">
          <button type="button" data-rounds="3" class="round-chip px-3 py-2.5 rounded-xl border text-xs font-semibold text-left border-ink-700 bg-ink-900 text-slate-300 hover:border-slate-500 transition-all">
            <span class="block text-sm text-white font-bold">⚡ 3 Rounds</span>
            <span class="text-[10px] text-slate-400">Quick Spar</span>
          </button>
          <button type="button" data-rounds="6" class="round-chip px-3 py-2.5 rounded-xl border text-xs font-semibold text-left border-accent-500 bg-accent-500/10 text-white transition-all">
            <span class="block text-sm text-accent-300 font-bold">🥊 6 Rounds</span>
            <span class="text-[10px] text-slate-300">Standard Bout</span>
          </button>
          <button type="button" data-rounds="10" class="round-chip px-3 py-2.5 rounded-xl border text-xs font-semibold text-left border-ink-700 bg-ink-900 text-slate-300 hover:border-slate-500 transition-all">
            <span class="block text-sm text-white font-bold">🏛️ 10 Rounds</span>
            <span class="text-[10px] text-slate-400">Full Debate</span>
          </button>
          <button type="button" data-rounds="0" class="round-chip px-3 py-2.5 rounded-xl border text-xs font-semibold text-left border-ink-700 bg-ink-900 text-slate-300 hover:border-slate-500 transition-all">
            <span class="block text-sm text-white font-bold">♾️ Open</span>
            <span class="text-[10px] text-slate-400">Freestyle</span>
          </button>
        </div>
      </div>`;

if (!code.includes('id="round-select-grid"')) {
  code = code.replace(fieldListTarget, fieldListTarget + roundSelectorHtml);
}

// Wire up round chip clicks in Mh
const hookChipTarget = 'const S=t.querySelector("#start-btn"),x=t.querySelector("#setup-error"),R=t.querySelector("#quota-slot");';
const hookChipCode = `const _rg=t.querySelector("#round-select-grid");if(_rg){_rg.querySelectorAll(".round-chip").forEach(ch=>{ch.addEventListener("click",()=>{_rg.querySelectorAll(".round-chip").forEach(o=>{o.classList.remove("border-accent-500","bg-accent-500/10","text-white");o.classList.add("border-ink-700","bg-ink-900","text-slate-300");});ch.classList.remove("border-ink-700","bg-ink-900","text-slate-300");ch.classList.add("border-accent-500","bg-accent-500/10","text-white");})});}`;
if (!code.includes('_rg=t.querySelector("#round-select-grid")')) {
  code = code.replace(hookChipTarget, hookChipCode + hookChipTarget);
}

// Pass targetRounds in start call
const startCallTarget = 'const{debateId:V}=await zt("/api/debate/start",{mode:s.id,persona:L,topic:O,setup:T,judge:q});';
const startCallReplace = 'const _selRounds=Number(t.querySelector("#round-select-grid .border-accent-500")?.getAttribute("data-rounds")??6);const{debateId:V}=await zt("/api/debate/start",{mode:s.id,persona:L,topic:O,setup:T,judge:q,targetRounds:_selRounds});';
if (code.includes(startCallTarget)) {
  code = code.replace(startCallTarget, startCallReplace);
}

const bhCallTarget = 'bh(V,{modeId:s.id,modeName:s.name,modeIcon:s.icon,topic:O,personaLabel:C,judgeEnabled:q,personaVisual:y.model})';
const bhCallReplace = 'bh(V,{modeId:s.id,modeName:s.name,modeIcon:s.icon,topic:O,personaLabel:C,judgeEnabled:q,personaVisual:y.model,targetRounds:_selRounds})';
if (code.includes(bhCallTarget)) {
  code = code.replace(bhCallTarget, bhCallReplace);
}

// 2. In ix: update session header with Round Counter and live Wallet indicator
const sessionHeaderTarget = `<div class="mb-4">
          <p class="text-accent-400 text-xs font-semibold uppercase tracking-widest">\${xt(t.modeName)}</p>
          <h1 class="font-display text-xl sm:text-2xl text-white mt-1">\${xt(t.topic||"Live session")}</h1>
        </div>`;

const sessionHeaderReplace = `<div class="mb-4">
          <div class="flex items-center justify-between flex-wrap gap-2">
            <p class="text-accent-400 text-xs font-semibold uppercase tracking-widest">\${xt(t.modeName)}</p>
            <div class="flex items-center gap-2">
              <span id="spar-round-badge" class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-accent-500/15 border border-accent-500/30 text-accent-300">🥊 Round <span id="spar-cur-round">1</span>\${t.targetRounds ? " / " + t.targetRounds : " (Freestyle)"}</span>
              <span id="spar-wallet-badge" class="px-2 py-0.5 rounded-full text-[11px] font-medium bg-ink-800 border border-ink-700 text-slate-400"></span>
            </div>
          </div>
          <h1 class="font-display text-xl sm:text-2xl text-white mt-1">\${xt(t.topic||"Live session")}</h1>
          <div id="spar-target-reached-banner" class="hidden mt-2 p-2.5 rounded-xl bg-accent-500/15 border border-accent-500/30 text-accent-300 text-xs flex items-center justify-between">
            <span>🎯 Target rounds completed! Ready for your verdict, or keep sparring freely.</span>
            <button type="button" id="banner-score-btn" class="underline font-bold ml-2 cursor-pointer">Get Scorecard →</button>
          </div>
        </div>`;

if (code.includes(sessionHeaderTarget)) {
  code = code.replace(sessionHeaderTarget, sessionHeaderReplace);
}

// Update End session button text to End & Grade Match
code = code.replace(
  '<button id="end-btn" class="flex-1 px-3 py-2 rounded-xl bg-red-900/60 border border-red-800 text-sm text-red-200 hover:bg-red-900">End session</button>',
  '<button id="end-btn" class="flex-1 px-3 py-2 rounded-xl bg-red-900/60 border border-red-800 text-sm text-red-200 hover:bg-red-900 font-semibold">End &amp; Grade</button>'
);

// Round increment hook in ix
const roundInitTarget = 'const g=[];let _=null;';
const roundInitReplace = 'let _sparCurRound=1;const g=[];let _=null;';
if (!code.includes('_sparCurRound=1') && code.includes(roundInitTarget)) {
  code = code.replace(roundInitTarget, roundInitReplace);
}

const doneHookTarget = 'ie=!0,Ae||B.remove(),ne.textContent=Q,A();';
const doneHookReplace = `ie=!0,Ae||B.remove(),ne.textContent=Q,A();
_sparCurRound++;
const _crEl=i.querySelector("#spar-cur-round");if(_crEl)_crEl.textContent=_sparCurRound;
const _wbEl=i.querySelector("#spar-wallet-badge");if(_wbEl&&ce.remainingRounds!==undefined){_wbEl.textContent=ce.remainingRounds>=999999?"Unlimited rounds":ce.remainingRounds+" rds left";}
if(t.targetRounds&&_sparCurRound>t.targetRounds){const _trb=i.querySelector("#spar-target-reached-banner");if(_trb)_trb.classList.remove("hidden");const _bsb=i.querySelector("#banner-score-btn");if(_bsb)_bsb.onclick=()=>u.click();}`;

if (code.includes(doneHookTarget) && !code.includes('_sparCurRound++')) {
  code = code.replace(doneHookTarget, doneHookReplace);
}

// 3. Update Account page to display rounds & add Promo Code / VIP Panel
const oldUsageCard = `<div class="card card-lift p-6">
      <div class="eyebrow mb-2">Usage this month</div>
      \${t.usage.quota<0?\`<div class="text-white font-semibold text-display-sm">Unlimited <span class="text-slate-500 text-body-md font-normal">sessions</span></div>
           <p class="text-body-sm text-slate-400 mt-2">Owner access — no limits, nothing is billed.</p>\`:\`<div class="text-white font-semibold text-display-sm">\${t.usage.debates_used}<span class="text-slate-500 text-body-md font-normal"> / \${t.usage.quota} sessions</span></div>
      <div class="h-2.5 rounded-full bg-ink-800 overflow-hidden mt-3" role="progressbar" aria-valuenow="\${Math.round(r)}" aria-valuemin="0" aria-valuemax="100" aria-label="Monthly session usage">
        <div class="score-fill h-full rounded-full bg-gradient-to-r from-accent-600 to-accent-400" style="width:\${r}%"></div>
      </div>\`}
      <div class="grid grid-cols-2 gap-3 mt-5 text-sm">
        <div class="rounded-xl bg-ink-800/60 border border-ink-700/60 p-3">
          <div class="eyebrow !text-[0.65rem]">Credit balance</div>
          <div class="text-white font-semibold mt-1">\${t.creditBalance} credits</div>
        </div>
        <div class="rounded-xl bg-ink-800/60 border border-ink-700/60 p-3">
          <div class="eyebrow !text-[0.65rem]">Free trial</div>
          <div class="text-white font-semibold mt-1">\${t.trialUsed?"Used":"Available"}</div>
        </div>
      </div>
    </div>`;

const newUsageCard = `<div class="card card-lift p-6">
      <div class="eyebrow mb-2">Usage this month</div>
      \${t.usage.quota<0?\`<div class="text-white font-semibold text-display-sm">Unlimited <span class="text-slate-500 text-body-md font-normal">rounds</span></div>
           <p class="text-body-sm text-slate-400 mt-2">Owner / VIP access — unlimited sparring rounds.</p>\`:\`<div class="text-white font-semibold text-display-sm">\${t.usage.debates_used}<span class="text-slate-500 text-body-md font-normal"> / \${t.usage.quota} rounds</span></div>
      <div class="h-2.5 rounded-full bg-ink-800 overflow-hidden mt-3" role="progressbar" aria-valuenow="\${Math.round(r)}" aria-valuemin="0" aria-valuemax="100" aria-label="Monthly round usage">
        <div class="score-fill h-full rounded-full bg-gradient-to-r from-accent-600 to-accent-400" style="width:\${r}%"></div>
      </div>\`}
      <div class="grid grid-cols-2 gap-3 mt-5 text-sm">
        <div class="rounded-xl bg-ink-800/60 border border-ink-700/60 p-3">
          <div class="eyebrow !text-[0.65rem]">Round Wallet</div>
          <div class="text-white font-semibold mt-1">\${t.creditBalance} rounds</div>
        </div>
        <div class="rounded-xl bg-ink-800/60 border border-ink-700/60 p-3">
          <div class="eyebrow !text-[0.65rem]">Free trial</div>
          <div class="text-white font-semibold mt-1">\${t.trialUsed>=15?"Used":((15-t.trialUsed)+" rds left")}</div>
        </div>
      </div>
    </div>`;

if (code.includes(oldUsageCard)) {
  code = code.replace(oldUsageCard, newUsageCard);
}

// Add Promo Code & Admin VIP sections to Account page
const appendAccountTarget = 'e.appendChild(c);const l=document.createElement("section");';
const promoAndVipSection = `
    const _promoBox=document.createElement("div");
    _promoBox.className="card card-lift p-6 mb-10";
    _promoBox.innerHTML=\`
      <div class="flex items-center justify-between mb-2">
        <div class="flex items-center gap-2">
          <span class="text-xl">🎟️</span>
          <h2 class="font-display text-lg text-white font-semibold">Have a Promo or VIP Code?</h2>
        </div>
        \${t.isLifetime?'<span class="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300">👑 Lifetime VIP Active</span>':''}
      </div>
      <p class="text-slate-400 text-body-sm mb-4">Enter your Friends &amp; Family code for free lifetime Champion access or bonus sparring rounds.</p>
      <form id="promo-redeem-form" class="flex flex-wrap gap-2 max-w-md">
        <input type="text" id="promo-code-input" placeholder="e.g. FAMILYVIP" class="field flex-1 uppercase tracking-wider font-mono text-sm px-4 py-2.5 rounded-xl bg-ink-900 border border-ink-700 text-white focus:outline-none focus:border-accent-400" />
        <button type="submit" id="promo-redeem-btn" class="btn-primary px-5 py-2.5 rounded-xl font-semibold text-sm">Redeem</button>
      </form>
      <div id="promo-feedback" class="hidden mt-3 text-sm p-3 rounded-xl"></div>\`;
    e.appendChild(_promoBox);

    setTimeout(()=>{
      const _pf=_promoBox.querySelector("#promo-redeem-form");
      const _pi=_promoBox.querySelector("#promo-code-input");
      const _pb=_promoBox.querySelector("#promo-redeem-btn");
      const _pmsg=_promoBox.querySelector("#promo-feedback");
      if(_pf){
        _pf.addEventListener("submit",async(ev)=>{
          ev.preventDefault();
          const cd=(_pi.value||"").trim().toUpperCase();
          if(!cd)return;
          _pb.disabled=true;_pb.textContent="Checking…";
          _pmsg.className="hidden mt-3 text-sm p-3 rounded-xl";
          try{
            const res=await fetch("/api/account/promo/redeem",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({code:cd})});
            const data=await res.json();
            if(res.ok&&data.ok){
              _pmsg.className="mt-3 text-sm p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-200 block";
              _pmsg.textContent=data.message;
              _pi.value="";
              setTimeout(()=>qu(i),2000);
            }else{
              _pmsg.className="mt-3 text-sm p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-200 block";
              _pmsg.textContent=data.error||"Invalid code.";
            }
          }catch(err){
            _pmsg.className="mt-3 text-sm p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-200 block";
            _pmsg.textContent="Network error. Try again.";
          }finally{
            _pb.disabled=false;_pb.textContent="Redeem";
          }
        });
      }
    },0);

    if(t.isOwner){
      const _adminVip=document.createElement("div");
      _adminVip.className="card card-lift p-6 mb-10 border border-amber-500/30 bg-amber-500/5";
      _adminVip.innerHTML=\`
        <div class="flex items-center gap-2 mb-2">
          <span class="text-xl">👑</span>
          <h2 class="font-display text-lg text-amber-300 font-semibold">Admin: Grant Lifetime VIP</h2>
        </div>
        <p class="text-slate-300 text-body-sm mb-4">Instantly upgrade any registered email to Lifetime Champion VIP with 100,000 rounds.</p>
        <form id="admin-grant-form" class="flex flex-wrap gap-2 max-w-md">
          <input type="email" id="admin-grant-email" placeholder="family@gmail.com" class="field flex-1 text-sm px-4 py-2.5 rounded-xl bg-ink-900 border border-ink-700 text-white focus:outline-none focus:border-accent-400" />
          <button type="submit" id="admin-grant-btn" class="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm">Grant VIP</button>
        </form>
        <div id="admin-grant-feedback" class="hidden mt-3 text-sm p-3 rounded-xl"></div>\`;
      e.appendChild(_adminVip);

      setTimeout(()=>{
        const _af=_adminVip.querySelector("#admin-grant-form");
        const _ai=_adminVip.querySelector("#admin-grant-email");
        const _ab=_adminVip.querySelector("#admin-grant-btn");
        const _amsg=_adminVip.querySelector("#admin-grant-feedback");
        if(_af){
          _af.addEventListener("submit",async(ev)=>{
            ev.preventDefault();
            const em=(_ai.value||"").trim();
            if(!em)return;
            _ab.disabled=true;_ab.textContent="Granting…";
            _amsg.className="hidden mt-3 text-sm p-3 rounded-xl";
            try{
              const res=await fetch("/api/account/admin/grant-vip",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:em})});
              const data=await res.json();
              if(res.ok&&data.ok){
                _amsg.className="mt-3 text-sm p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-200 block";
                _amsg.textContent=data.message;
                _ai.value="";
              }else{
                _amsg.className="mt-3 text-sm p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-200 block";
                _amsg.textContent=data.error||"Could not grant VIP.";
              }
            }catch(err){
              _amsg.className="mt-3 text-sm p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-200 block";
              _amsg.textContent="Network error. Try again.";
            }finally{
              _ab.disabled=false;_ab.textContent="Grant VIP";
            }
          });
        }
      },0);
    }
`;

if (!code.includes('_promoBox=document.createElement')) {
  code = code.replace(appendAccountTarget, 'e.appendChild(c);' + promoAndVipSection + 'const l=document.createElement("section");');
}

// Update tier and pack copy in pricing cards
code = code.replace('${x.debates} sessions per month', '${x.rounds || x.debates} sparring rounds per month');
code = code.replace('${x.credits} sessions · credits never expire', '${x.rounds || x.credits} rounds · credits never expire');

// Update school per-seat copy in school page
code = code.replace('30/mo', '300 rds/mo');
code = code.replace('$6 per seat per month. Each seat adds 30 shared sessions per month.', '$6 per seat per month. Each seat adds 300 shared sparring rounds per month.');
code = code.replace('sessionsPool: m.org.seat_count * EDU.sessionsPerSeat', 'sessionsPool: m.org.seat_count * 300');

fs.writeFileSync(filePath, code, 'utf8');
console.log('Successfully patched index-CIu_KwmT.js for round monetization and promo codes!');
