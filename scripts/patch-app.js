const fs = require('fs');
const path = 'frontend/dist/app/assets/index-CIu_KwmT.js';
let content = fs.readFileSync(path, 'utf8');

// 1. Patch dh
const targetDh = 'function dh(i){return i&&Cc[i]||Cc["default-masc"]}';
const replaceDh = 'function dh(i){try{const p=localStorage.getItem("adversaryai-preferred-avatar");if(p&&p!=="auto"&&Cc[p])return Cc[p]}catch{}return i&&Cc[i]||Cc["default-masc"]}';

if (!content.includes(targetDh)) {
  console.error('dh target not found');
  process.exit(1);
}
content = content.replace(targetDh, replaceDh);

// 2. Patch Account page
const targetAppend = 'e.appendChild(l);const d=l.querySelector("[data-orgs]");';
const addition = 'const _av=document.createElement("section");_av.className="mb-10";_av.innerHTML=`<h2 class="font-display text-display-md text-white mb-1">Avatar &amp; Visual Presentation</h2><p class="text-slate-400 text-body-sm mb-5">Choose your preferred 3D sparring opponent avatar and visual fidelity mode. Works across all practice modes, personal accounts, and school orgs.</p><div class="card card-lift p-6 space-y-5"><div><label class="block text-sm font-semibold text-white mb-2" for="pref-avatar-select">Default Opponent Avatar</label><select id="pref-avatar-select" class="w-full px-4 py-3 rounded-xl bg-ink-900 border border-ink-700 text-white focus:outline-none focus:border-accent-400"><option value="auto">Adaptive (Automatically matches scenario &amp; persona)</option><option value="man-pro">Professional Man (Davis)</option><option value="woman-pro">Professional Woman (Ava)</option><option value="older-man">Older Gentleman (Brian)</option><option value="older-woman">Older Woman (Jenny)</option><option value="man-casual">Casual Man (Guy)</option><option value="woman-casual">Casual Woman (Jenny)</option><option value="teen-boy">Teenage Boy (Tony)</option><option value="teen-girl">Teenage Girl (Aria)</option><option value="default-masc">Classic Opponent (M)</option><option value="default-fem">Classic Opponent (F)</option></select></div><div><label class="block text-sm font-semibold text-white mb-2" for="pref-fidelity-select">Visual Fidelity &amp; Studio Lighting</label><select id="pref-fidelity-select" class="w-full px-4 py-3 rounded-xl bg-ink-900 border border-ink-700 text-white focus:outline-none focus:border-accent-400"><option value="ultra">✨ Ultra Photorealistic (Studio lighting, micro-saccades, wet eye specular, organic spine)</option><option value="standard">⚡ Standard Performance (Optimized battery-saver)</option></select></div><p id="pref-saved-msg" class="text-xs text-emerald-400 hidden">✓ Visual preferences saved for all future sparring sessions.</p></div>`;e.appendChild(_av);setTimeout(()=>{const s1=_av.querySelector("#pref-avatar-select"),s2=_av.querySelector("#pref-fidelity-select"),msg=_av.querySelector("#pref-saved-msg");if(s1){s1.value=localStorage.getItem("adversaryai-preferred-avatar")||"auto";s1.addEventListener("change",()=>{localStorage.setItem("adversaryai-preferred-avatar",s1.value);if(msg){msg.classList.remove("hidden");setTimeout(()=>msg.classList.add("hidden"),2500)}})}if(s2){s2.value=localStorage.getItem("adversaryai-avatar-fidelity")||"ultra";s2.addEventListener("change",()=>{localStorage.setItem("adversaryai-avatar-fidelity",s2.value);if(msg){msg.classList.remove("hidden");setTimeout(()=>msg.classList.add("hidden"),2500)}})}},0);';

if (!content.includes(targetAppend)) {
  console.error('targetAppend not found');
  process.exit(1);
}
content = content.replace(targetAppend, targetAppend + addition);

fs.writeFileSync(path, content, 'utf8');
console.log('Successfully patched dh and Account page avatar selector in index-CIu_KwmT.js');
