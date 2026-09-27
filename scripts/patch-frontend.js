const fs = require('fs');
const path = require('path');

const bundlePath = path.join(__dirname, '../frontend/dist/app/assets/index-CIu_KwmT.js');
let code = fs.readFileSync(bundlePath, 'utf8');

// 1. Fix "Your free sessions are used up"
code = code.replace(
  'Your free sessions are used up. Upgrade your plan or grab a one-time pack',
  'Your free rounds are used up. Upgrade your plan or grab a one-time pack'
);

// 2. Fix session quota in Upgrade heading
code = code.replace(
  'Subscriptions renew monthly and include a fresh session quota.',
  'Subscriptions renew monthly and include a fresh round quota.'
);

// 3. Fix "Session packs" heading
code = code.replace(
  '<h2 class="font-display text-display-md text-white mb-1">Session packs</h2>',
  '<h2 class="font-display text-display-md text-white mb-1">Round packs</h2>'
);

// 4. Fix tier card quota and blurb rendering
// Current:
// <p class="text-body-sm text-slate-400 mb-1">${x.rounds || x.debates} sparring rounds per month</p>
// ${x.description?`<p class="text-body-sm text-slate-500 mb-4">${Lt(xs(x.description))}</p>`:'<div class="mb-4"></div>'}
const oldTierHtml = `<p class="text-body-sm text-slate-400 mb-1">\${x.rounds || x.debates} sparring rounds per month</p>
      \${x.description?\`<p class="text-body-sm text-slate-500 mb-4">\${Lt(xs(x.description))}</p>\`:'<div class="mb-4"></div>'}`;

const newTierHtml = `<p class="text-body-sm text-accent-400 font-semibold mb-2">\${(x.rounds || x.debates).toLocaleString()} sparring rounds per month</p>
      \${x.description?\`<p class="text-body-sm text-slate-400 mb-4">\${Lt(x.description)}</p>\`:'<div class="mb-4"></div>'}`;

// Notice: In the bundle, newlines might be \r\n
if (code.includes(oldTierHtml)) {
  code = code.replace(oldTierHtml, newTierHtml);
} else {
  const oldTierCrLf = oldTierHtml.replace(/\n/g, '\r\n');
  if (code.includes(oldTierCrLf)) {
    code = code.replace(oldTierCrLf, newTierHtml.replace(/\n/g, '\r\n'));
  } else {
    console.warn('Warning: oldTierHtml not found directly, checking regex fallback');
    code = code.replace(
      /<p class="text-body-sm text-slate-400 mb-1">\$\{x\.rounds \|\| x\.debates\} sparring rounds per month<\/p>\s*\$\{x\.description\?`<p class="text-body-sm text-slate-500 mb-4">\$\{Lt\(xs\(x\.description\)\)\}<\/p>`:'<div class="mb-4"><\/div>'}/,
      newTierHtml
    );
  }
}

// 5. Fix pack card rendering and empty state
code = code.replace(
  /<p class="text-body-sm text-slate-400 mb-1">\$\{x\.rounds \|\| x\.credits\} rounds · credits never expire<\/p>\s*\$\{x\.description\?`<p class="text-body-sm text-slate-500 mb-4">\$\{Lt\(xs\(x\.description\)\)\}<\/p>`:'<div class="mb-4"><\/div>'}/,
  `<p class="text-body-sm text-slate-300 mb-3">\${(x.rounds || x.credits).toLocaleString()} sparring rounds · credits never expire</p>`
);

code = code.replace(
  'No session packs are available right now.',
  'No round packs are available right now.'
);

// 6. Add Arena to desktop navbar in fx(i)
const oldDesktopNav = `<a href="#/" class="px-3 py-1.5 rounded-lg hover:bg-ink-800 text-slate-300 hover:text-white">Practice</a>
        <a href="#/history" class="px-3 py-1.5 rounded-lg hover:bg-ink-800 text-slate-300 hover:text-white">History</a>`;

const newDesktopNav = `<a href="#/" class="px-3 py-1.5 rounded-lg hover:bg-ink-800 text-slate-300 hover:text-white">Practice</a>
        <a href="#/arena" class="px-3 py-1.5 rounded-lg hover:bg-ink-800 text-slate-300 hover:text-white font-medium flex items-center gap-1"><span class="text-amber-400">🔥</span> Arena</a>
        <a href="#/history" class="px-3 py-1.5 rounded-lg hover:bg-ink-800 text-slate-300 hover:text-white">History</a>`;

if (code.includes(oldDesktopNav)) {
  code = code.replace(oldDesktopNav, newDesktopNav);
} else {
  const oldDesktopNavCrLf = oldDesktopNav.replace(/\n/g, '\r\n');
  if (code.includes(oldDesktopNavCrLf)) {
    code = code.replace(oldDesktopNavCrLf, newDesktopNav.replace(/\n/g, '\r\n'));
  }
}

// 7. Add Arena to mobile menu in fx(i)
const oldMobileNav = `<a href="#/" class="block px-3 py-2.5 rounded-lg text-slate-300 hover:text-white hover:bg-ink-800">Practice</a>
      <a href="#/history" class="block px-3 py-2.5 rounded-lg text-slate-300 hover:text-white hover:bg-ink-800">History</a>`;

const newMobileNav = `<a href="#/" class="block px-3 py-2.5 rounded-lg text-slate-300 hover:text-white hover:bg-ink-800">Practice</a>
      <a href="#/arena" class="block px-3 py-2.5 rounded-lg text-slate-300 hover:text-white hover:bg-ink-800 font-medium">🔥 Community Arena</a>
      <a href="#/history" class="block px-3 py-2.5 rounded-lg text-slate-300 hover:text-white hover:bg-ink-800">History</a>`;

if (code.includes(oldMobileNav)) {
  code = code.replace(oldMobileNav, newMobileNav);
} else {
  const oldMobileNavCrLf = oldMobileNav.replace(/\n/g, '\r\n');
  if (code.includes(oldMobileNavCrLf)) {
    code = code.replace(oldMobileNavCrLf, newMobileNav.replace(/\n/g, '\r\n'));
  }
}

// 8. Fix router Yu() to normalize query strings/slashes and add arena route in fallback map
code = code.replace(
  'const a={"/":()=>lh(r),"/history":()=>dx(r),"/account":()=>qu(r)}',
  'const a={"/":()=>lh(r),"/history":()=>dx(r),"/account":()=>qu(r),"/arena":()=>renderArenaFeed(r)}'
);

code = code.replace(
  'const i=location.hash.replace(/^#/,"")||"/",e=i.startsWith("/")?i:"/"+i',
  'const _raw=location.hash.replace(/^#/,"")||"/",i=_raw.startsWith("/")?_raw:"/"+_raw,e=i.split("?")[0].replace(/\\/+$/,"")||"/"'
);

// Save updated bundle
fs.writeFileSync(bundlePath, code, 'utf8');

// Also write to new hashed bundle name to bust browser cache completely
const newBundlePath = path.join(__dirname, '../frontend/dist/app/assets/index-DF9_arena.js');
fs.writeFileSync(newBundlePath, code, 'utf8');

console.log('Successfully patched index-CIu_KwmT.js and created index-DF9_arena.js');
