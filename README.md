# AdversaryAI (getadversaryai.com)

AI sparring partner: users pick a practice mode (debate, historical figures, interview prep, sales,
negotiation, thesis defense, …), argue by voice or text against a lip-synced opponent, and get a
coaching scorecard plus an impartial judge's verdict at the end.

## Stack

- **API**: Cloudflare Worker (Hono) — `worker/src/index.js`, D1 SQLite (`adversaryai-db`)
- **Brain**: Azure AI Foundry DeepSeek V4 — Flash for base tiers, Pro for Champion
- **Voice**: Azure Neural TTS. The browser synthesizes each sentence with the Azure Speech SDK
  (token from `/api/speech/token`) and gets real **viseme** timings for lip-sync. If the SDK is
  unavailable the server synthesizes instead (`/api/speech/turn-audio`) — never both.
- **App**: vanilla JS SPA in `frontend/src` → built to `frontend/dist/app`
- **Landing page**: static `frontend/dist/index.html`, `landing.css`, `landing.js`
- **Billing**: Stripe (Debater $12, Coach $29, Champion $49, packs, $6/seat schools)

## Project structure

```
frontend/
  src/
    app.js            # the whole SPA (routes, setup, session, scorecard, history, account, arena)
    voice.js          # the ONLY audio player: queue, stop/replay, viseme track on the audio clock
    app.css           # Tailwind entry + design tokens + components (.btn-primary, .opt-chip, …)
  tailwind.config.cjs # theme (ink/accent/slate CSS-variable colors, type scale)
  dist/               # deployed as static assets (built files land in dist/app/assets)
worker/src/index.js   # API
scripts/build.mjs     # Tailwind + esbuild + hashed filenames + sw.js version + Speech SDK vendoring
scripts/legacy/       # old string-patch scripts — do not run, kept for reference only
```

## Workflow

```powershell
npm install          # first time (esbuild, tailwind, Azure Speech SDK, wrangler)
npm run build        # compile frontend/src → frontend/dist/app
npm run deploy       # build + wrangler deploy
```

**Edit `frontend/src`, never the files in `frontend/dist/app/assets`.** Those are generated,
content-hashed and replaced on every build (the service-worker cache version updates automatically).

### Rules that keep things working
- Any Tailwind class used in `frontend/src/*.js` is compiled automatically — no hand-written utilities.
- All opponent audio goes through `voice.js` (`voice.begin()`, `voice.stop()`, `voice.replay()`).
  Don't create `<audio>` elements or other AudioContexts for opponent speech.
- Mode options live in two mirrored tables: `MODE_UI` (frontend) and `MODE_RULES` (worker).

## Other commands

```powershell
npm run tail                                   # live worker logs
npm run d1:query "SELECT * FROM users LIMIT 5;"
```
