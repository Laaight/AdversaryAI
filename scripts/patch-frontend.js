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

// 9. Add Stripe Auto-Setup card to Admin Account view
const oldAdminEnd = `            }finally{
              _ab.disabled=false;_ab.textContent="Grant VIP";
            }
          });
        }
      },0);
    }`;

const newAdminEnd = `            }finally{
              _ab.disabled=false;_ab.textContent="Grant VIP";
            }
          });
        }
      },0);

      const _adminStripe=document.createElement("div");
      _adminStripe.className="card p-6 border-indigo-500/40 bg-indigo-950/20 shadow-glow mb-6";
      _adminStripe.innerHTML=\`
        <div class="flex items-center gap-2 mb-2">
          <span class="text-xl">💳</span>
          <h2 class="font-display text-lg text-indigo-300 font-semibold">Admin: Stripe Auto-Setup</h2>
        </div>
        <p class="text-slate-300 text-body-sm mb-4">Auto-create all 7 Products &amp; Prices in Stripe (Debater $12, Coach $29, Champion $49, Packs $9/$19/$39, Edu Seat $6) via the Stripe REST API and wire them up immediately.</p>
        <div id="stripe-status-box" class="mb-4 text-xs font-mono p-3 rounded-xl bg-ink-900 border border-ink-700 text-slate-300 leading-relaxed">Checking Stripe connection…</div>
        <button type="button" id="admin-sync-stripe-btn" class="px-5 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-sm flex items-center gap-2">
          <span>⚡</span><span>Auto-Create All 7 Stripe Prices</span>
        </button>
        <div id="stripe-sync-feedback" class="hidden mt-3 text-sm p-3 rounded-xl"></div>\`;
      _adminVip.parentNode.insertBefore(_adminStripe, _adminVip.nextSibling);

      setTimeout(()=>{
        const sBox = _adminStripe.querySelector("#stripe-status-box");
        const sBtn = _adminStripe.querySelector("#admin-sync-stripe-btn");
        const sFeed = _adminStripe.querySelector("#stripe-sync-feedback");

        async function refreshStripeStatus() {
          try {
            const r = await fetch("/api/account/admin/stripe-status");
            const d = await r.json();
            if (r.ok && d.ok) {
              const p = d.priceIds || {};
              const formatRow = (name, key) => p[key] ? \`<span class="text-emerald-400">✓ \${name}: \${p[key]}</span>\` : \`<span class="text-amber-400">⚠️ \${name}: Not configured</span>\`;
              sBox.innerHTML = [
                \`<strong>Stripe API Secret:</strong> \${d.hasSecret ? '<span class="text-emerald-400">Connected</span>' : '<span class="text-red-400">Missing</span>'}\`,
                formatRow('Debater ($12/mo)', 'debater'),
                formatRow('Coach ($29/mo)', 'coach'),
                formatRow('Champion ($49/mo)', 'champion'),
                formatRow('100 Rounds ($9)', 'pack10'),
                formatRow('250 Rounds ($19)', 'pack25'),
                formatRow('600 Rounds ($39)', 'pack60'),
                formatRow('Edu Seat ($6/mo)', 'eduSeat')
              ].join('<br>');
            } else {
              sBox.innerHTML = '<span class="text-red-400">Could not read Stripe status</span>';
            }
          } catch {
            sBox.innerHTML = '<span class="text-red-400">Network error checking Stripe</span>';
          }
        }

        refreshStripeStatus();

        if (sBtn) {
          sBtn.addEventListener("click", async () => {
            if (!confirm("This will connect to your Stripe account, create any missing products/prices, and save them to your app database. Proceed?")) return;
            sBtn.disabled = true;
            sBtn.innerHTML = '<span class="spinner" aria-hidden="true"></span><span>Creating Stripe Prices…</span>';
            sFeed.className = "hidden mt-3 text-sm p-3 rounded-xl";
            try {
              const res = await fetch("/api/account/admin/setup-stripe", { method: "POST" });
              const data = await res.json();
              if (res.ok && data.ok) {
                sFeed.className = "mt-3 text-sm p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-200 block";
                sFeed.textContent = data.message;
                await refreshStripeStatus();
              } else {
                sFeed.className = "mt-3 text-sm p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-200 block";
                sFeed.textContent = data.error || "Failed to setup Stripe prices.";
              }
            } catch {
              sFeed.className = "mt-3 text-sm p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-200 block";
              sFeed.textContent = "Network error connecting to Stripe API.";
            } finally {
              sBtn.disabled = false;
              sBtn.innerHTML = '<span>⚡</span><span>Auto-Create All 7 Stripe Prices</span>';
            }
          });
        }
      }, 0);
    }`;

if (code.includes(oldAdminEnd)) {
  code = code.replace(oldAdminEnd, newAdminEnd);
} else {
  const oldAdminEndCrLf = oldAdminEnd.replace(/\n/g, '\r\n');
  if (code.includes(oldAdminEndCrLf)) {
    code = code.replace(oldAdminEndCrLf, newAdminEnd.replace(/\n/g, '\r\n'));
  }
}

// Save updated bundle
fs.writeFileSync(bundlePath, code, 'utf8');

// Also write to new hashed bundle name to bust browser cache completely
const newBundlePath = path.join(__dirname, '../frontend/dist/app/assets/index-DF9_arena.js');
fs.writeFileSync(newBundlePath, code, 'utf8');

console.log('Successfully patched index-CIu_KwmT.js and created index-DF9_arena.js');
