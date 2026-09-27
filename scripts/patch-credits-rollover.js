const fs = require('fs');
const path = require('path');

const bundleFiles = [
  path.join(__dirname, '../frontend/dist/app/assets/index-V3_figures.js'),
  path.join(__dirname, '../frontend/dist/app/assets/index-DF9_arena.js'),
  path.join(__dirname, '../frontend/dist/app/assets/index-CIu_KwmT.js')
];

for (const filePath of bundleFiles) {
  if (!fs.existsSync(filePath)) continue;
  let code = fs.readFileSync(filePath, 'utf8');

  // 1. Subscription subheading
  code = code.replace(
    '<p class="text-slate-400 text-body-sm mb-5">Subscriptions renew monthly and include a fresh round quota.</p>',
    '<p class="text-slate-400 text-body-sm mb-5">Subscriptions renew monthly with fresh rounds, and unused credits roll over month-to-month.</p>'
  );

  // 2. Round packs subheading
  code = code.replace(
    '<p class="text-slate-400 text-body-sm mb-5">One-time top-ups. Credits never expire and are spent when your plan quota runs out.</p>',
    '<p class="text-slate-400 text-body-sm mb-5">One-time top-ups. Credits roll over and never expire — spent automatically when your plan quota runs out.</p>'
  );

  // 3. Plan card quota line
  code = code.replace(
    '<p class="text-body-sm text-accent-400 font-semibold mb-2">${(x.rounds || x.debates).toLocaleString()} sparring rounds per month</p>',
    '<p class="text-body-sm text-accent-400 font-semibold mb-2">${(x.rounds || x.debates).toLocaleString()} sparring rounds per month · Credits roll over</p>'
  );

  // 4. Pack card line (handle unicode or ascii)
  code = code.replace(
    /\$\{\(x\.rounds \|\| x\.credits\)\.toLocaleString\(\)\} sparring rounds [^\s<]+ credits never expire/g,
    '${(x.rounds || x.credits).toLocaleString()} sparring rounds · Credits roll over & never expire'
  );

  // 5. Free rounds exhausted prompt
  code = code.replace(
    /to keep practicing [^\s<]+ packs never expire\./g,
    'to keep practicing — credits roll over and never expire.'
  );

  fs.writeFileSync(filePath, code, 'utf8');
  console.log(`Updated bundle: ${path.basename(filePath)}`);
}

// Update landing.js
const landingJsPath = path.join(__dirname, '../frontend/dist/landing.js');
if (fs.existsSync(landingJsPath)) {
  let landingJs = fs.readFileSync(landingJsPath, 'utf8');
  landingJs = landingJs.replace(
    "packsNote: 'One-time purchase. Rounds in wallet never expire.'",
    "packsNote: 'One-time purchase. Credits roll over and never expire.'"
  );
  fs.writeFileSync(landingJsPath, landingJs, 'utf8');
  console.log('Updated landing.js');
}

// Update index.html
const indexHtmlPath = path.join(__dirname, '../frontend/dist/index.html');
if (fs.existsSync(indexHtmlPath)) {
  let html = fs.readFileSync(indexHtmlPath, 'utf8');
  html = html.replace(
    "<p class=\"section-lede\">Start free. Upgrade when you're hooked. One-time round packs never expire.</p>",
    "<p class=\"section-lede\">Start free. Upgrade when you're hooked. Credits roll over and never expire.</p>"
  );
  html = html.replace(
    '<p class="packs-note">One-time purchase. Rounds in wallet never expire. Stack them with any plan.</p>',
    '<p class="packs-note">One-time purchase. Credits roll over and never expire. Stack them with any plan.</p>'
  );
  html = html.replace(
    'and pack rounds never expire.',
    'and credits roll over and never expire.'
  );
  html = html.replace(
    'Any unused rounds in your wallet stay on your account - they never expire.',
    'Any unused rounds in your wallet stay on your account — credits roll over and never expire.'
  );
  fs.writeFileSync(indexHtmlPath, html, 'utf8');
  console.log('Updated index.html');
}

console.log('Credit rollover copy update complete.');
