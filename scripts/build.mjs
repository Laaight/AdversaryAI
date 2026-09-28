#!/usr/bin/env node
/**
 * Builds the app SPA:  frontend/src  →  frontend/dist/app
 *
 *   npm run build      (runs automatically before `npm run deploy`)
 *
 *  1. Tailwind compiles frontend/src/app.css against every class used in frontend/src/*.js
 *     (so a class you add in JS always exists in the CSS — the old "missing utility" bug).
 *  2. esbuild bundles + minifies frontend/src/app.js (+ voice.js).
 *  3. Files are content-hashed (app-<hash>.js / .css), index.html and sw.js are rewritten,
 *     and stale bundles are removed. No more manual V11/V12 renaming.
 *  4. The Azure Speech SDK browser bundle is copied to /app/vendor/ for real visemes.
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(ROOT, "frontend/src");
const APP = path.join(ROOT, "frontend/dist/app");
const ASSETS = path.join(APP, "assets");

// Resolve build tools from the project's node_modules; BUILD_NODE_PATH can add extra
// lookup roots (used in CI/sandboxes that have the tools installed elsewhere).
const roots = [ROOT, ...(process.env.BUILD_NODE_PATH || "").split(path.delimiter).filter(Boolean)];
function load(name) {
  for (const r of roots) {
    try {
      return createRequire(path.join(r, "noop.js"))(name);
    } catch {}
  }
  throw new Error(`Missing build dependency "${name}". Run: npm install`);
}
function resolveFile(rel) {
  for (const r of roots) {
    for (const base of [path.join(r, "node_modules"), r]) {
      const p = path.join(base, rel);
      if (fs.existsSync(p)) return p;
    }
  }
  return null;
}
const hash = (buf) => crypto.createHash("sha256").update(buf).digest("hex").slice(0, 10);

const esbuild = load("esbuild");
const postcss = load("postcss");
const tailwind = load("tailwindcss");

// ---- CSS
const cssIn = fs.readFileSync(path.join(SRC, "app.css"), "utf8");
const twConfig = createRequire(import.meta.url)(path.join(ROOT, "frontend/tailwind.config.cjs"));
twConfig.content = [path.join(SRC, "**/*.js").replace(/\\/g, "/")];
const cssOut = await postcss([tailwind(twConfig)]).process(cssIn, { from: path.join(SRC, "app.css") });
const cssMin = (await esbuild.transform(cssOut.css, { loader: "css", minify: true, target: ["chrome90", "safari15", "firefox90"] })).code;

// ---- JS
const js = await esbuild.build({
  entryPoints: [path.join(SRC, "app.js")],
  bundle: true,
  format: "esm",
  minify: true,
  target: ["es2020", "safari15"],
  write: false,
  legalComments: "none",
  logLevel: "warning",
});
const jsCode = js.outputFiles[0].contents;

// ---- write hashed assets, remove stale bundles
fs.mkdirSync(ASSETS, { recursive: true });
const jsName = `app-${hash(jsCode)}.js`;
const cssName = `app-${hash(cssMin)}.css`;
for (const f of fs.readdirSync(ASSETS)) {
  if (/^(index|app)-.*\.(js|css)$/.test(f) && f !== jsName && f !== cssName) fs.rmSync(path.join(ASSETS, f));
}
fs.writeFileSync(path.join(ASSETS, jsName), jsCode);
fs.writeFileSync(path.join(ASSETS, cssName), cssMin);

// ---- Azure Speech SDK (browser bundle) for viseme lip-sync
const sdk = resolveFile("microsoft-cognitiveservices-speech-sdk/distrib/browser/microsoft.cognitiveservices.speech.sdk.bundle-min.js");
if (sdk) {
  fs.mkdirSync(path.join(APP, "vendor"), { recursive: true });
  fs.copyFileSync(sdk, path.join(APP, "vendor/speech-sdk.min.js"));
} else if (!fs.existsSync(path.join(APP, "vendor/speech-sdk.min.js"))) {
  console.warn("⚠  Azure Speech SDK not found — run `npm install`. Voice will fall back to server audio (no visemes).");
}

// ---- LiveKit client (WebRTC transport for Champion photoreal video)
const lk = resolveFile("livekit-client/dist/livekit-client.umd.js");
if (lk) {
  fs.mkdirSync(path.join(APP, "vendor"), { recursive: true });
  fs.copyFileSync(lk, path.join(APP, "vendor/livekit-client.umd.js"));
}

// ---- index.html + service worker
const idxPath = path.join(APP, "index.html");
let html = fs.readFileSync(idxPath, "utf8");
html = html
  .replace(/<script type="module" crossorigin src="\/app\/assets\/[^"]+"><\/script>/, `<script type="module" crossorigin src="/app/assets/${jsName}"></script>`)
  .replace(/<link rel="stylesheet" crossorigin href="\/app\/assets\/[^"]+">/, `<link rel="stylesheet" crossorigin href="/app/assets/${cssName}">`);
fs.writeFileSync(idxPath, html);
const swPath = path.join(ROOT, "frontend/dist/sw.js");
const sw = fs.readFileSync(swPath, "utf8").replace(/const VERSION = '[^']*';/, `const VERSION = 'adversaryai-${hash(jsCode + cssMin)}';`);
fs.writeFileSync(swPath, sw);

const kb = (b) => (b.length / 1024).toFixed(0) + " KB";
console.log(`✓ built ${jsName} (${kb(jsCode)}), ${cssName} (${kb(Buffer.from(cssMin))})${sdk ? ", speech SDK vendored" : ""}${lk ? ", LiveKit vendored" : ""}`);
