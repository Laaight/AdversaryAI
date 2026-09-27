const fs = require('fs');
const filePath = 'frontend/dist/app/assets/index-CIu_KwmT.js';
let content = fs.readFileSync(filePath, 'utf8');

// Target 1: Desktop navbar slot
const targetDesktop = '<span id="theme-toggle-slot" class="ml-1"></span>';
const replaceDesktop = '<span id="theme-toggle-slot" class="ml-1"></span><span id="admin-mode-slot" class="ml-1.5"></span>';

if (!content.includes(targetDesktop)) {
  console.error('targetDesktop not found');
  process.exit(1);
}
content = content.replace(targetDesktop, replaceDesktop);

// Target 2: Mobile navbar slot
const targetMobile = '<button id="logout-btn-mobile" class="mt-1 w-full text-left px-3 py-2.5 rounded-lg border border-ink-700 text-slate-400 hover:text-white hover:border-slate-500">Log out</button>';
const replaceMobile = '<div id="admin-mode-slot-mobile" class="mt-1"></div>' + targetMobile;

if (!content.includes(targetMobile)) {
  console.error('targetMobile not found');
  process.exit(1);
}
content = content.replace(targetMobile, replaceMobile);

// Target 3: Event handler setup in fx(i)
const targetAttach = 'e.querySelector("#theme-toggle-slot").appendChild(vr()),e.querySelector("#theme-toggle-slot-mobile").appendChild(vr());';
const codeAttach = targetAttach + `(function(){const isAdm=i&&(i.email==="matthewmhuston@gmail.com"||i.isOwner||i.plan==="owner");if(!isAdm)return;function mk(mob){const b=document.createElement("button");b.type="button";b.className=mob?"w-full text-left px-3 py-2 rounded-lg border text-xs font-semibold flex items-center justify-between mb-1.5":"px-2.5 py-1 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all";function sc(){const m=((document.cookie.match(/adversaryai_admin_mode=([^;]+)/)?.[1])||localStorage.getItem("adversaryai_admin_mode")||"premium").toLowerCase();if(m==="regular"){b.style.cssText="border-color:rgba(56,189,248,0.5);background:rgba(56,189,248,0.12);color:#7dd3fc;cursor:pointer;";b.innerHTML=mob?'<span>👑 Admin Mode:</span><span class=\"font-bold text-cyan-300\">⚡ Regular (Flash)</span>':'<span style=\"color:#fbbf24\">👑</span><span>⚡ Regular (Flash)</span>'}else{b.style.cssText="border-color:rgba(251,191,36,0.5);background:rgba(251,191,36,0.12);color:#fde68a;cursor:pointer;";b.innerHTML=mob?'<span>👑 Admin Mode:</span><span class=\"font-bold text-amber-300\">✦ Premium (Pro)</span>':'<span style=\"color:#fbbf24\">👑</span><span>✦ Premium (Pro)</span>'}}sc();b.addEventListener("click",async()=>{const cur=((document.cookie.match(/adversaryai_admin_mode=([^;]+)/)?.[1])||localStorage.getItem("adversaryai_admin_mode")||"premium").toLowerCase();const nxt=cur==="regular"?"premium":"regular";document.cookie="adversaryai_admin_mode="+nxt+";path=/;max-age=31536000;SameSite=Lax;Secure";localStorage.setItem("adversaryai_admin_mode",nxt);try{await fetch("/api/account/admin-mode",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({mode:nxt})})}catch{}document.querySelectorAll("[data-adm-btn]").forEach(x=>x.__sc&&x.__sc());alert("Switched to "+(nxt==="regular"?"Regular Mode (DeepSeek-V4-Flash)":"Premium Mode (DeepSeek-V4-Pro)"));});b.setAttribute("data-adm-btn","1");b.__sc=sc;return b}const sd=e.querySelector("#admin-mode-slot"),sm=e.querySelector("#admin-mode-slot-mobile");if(sd)sd.appendChild(mk(false));if(sm)sm.appendChild(mk(true));})();`;

if (!content.includes(targetAttach)) {
  console.error('targetAttach not found');
  process.exit(1);
}
content = content.replace(targetAttach, codeAttach);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully patched navbar with Admin Mode Switcher!');
