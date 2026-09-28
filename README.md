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
    photoreal.js      # Champion photoreal video opponent (LiveAvatar LITE sink for voice.js)
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

## Champion photoreal video (HeyGen LiveAvatar, LITE mode)

Champion users see a photoreal, lip-synced video opponent. We keep our own LLM and Azure TTS;
the browser sends each sentence's audio (24 kHz PCM) to LiveAvatar, which streams the video back
over WebRTC (`frontend/src/photoreal.js`, `/api/avatar/*` in the worker). If anything fails, the
session silently falls back to the 3D/portrait avatar with local audio.

Setup (one time):
1. Create an account at liveavatar.com and copy your API key.
2. `npx wrangler secret put LIVEAVATAR_API_KEY` (paste the key). Until this exists, photoreal
   stays off and the app says "rolling out".
3. Deploy, then as the owner open **Account → Admin: photoreal avatars → Load avatar catalog**,
   pick an avatar for each persona look / historical figure, and **Save**. Unmapped personas stay 3D.

Casting is automatic: every persona look gets a gender-matched stock actor (costume roles like
doctors/nurses are skipped). The owner can override any look in Account → Admin, or force it to 3D.

### HD voices for Champion video (optional, recommended)
Azure's HD ("DragonHD") voices sound far more human, but they aren't offered in `westus3`.
Create a second **Speech** resource in `westus2` or `eastus`, then:
1. Add a plain variable `AZURE_SPEECH_HD_REGION` = `westus2` (Cloudflare → adversaryai → Settings → Variables).
2. Add a secret `AZURE_SPEECH_HD_KEY` = that resource's key.
Champion photoreal sessions then use HD voices automatically; everything else keeps the
standard neural voices (which provide visemes for the 3D lip-sync).

Cost controls: `CHAMPION_VIDEO_MINUTES` (default 150/month per Champion, in `wrangler.jsonc`),
server-side metering via heartbeats, `max_session_duration` on every LiveAvatar session, and the
stream closes after 2 minutes without speech. Set `LIVEAVATAR_SANDBOX` to `"1"` to test without
spending credits. Usage lives in the `avatar_usage` / `avatar_sessions` D1 tables (auto-created).

## Other commands

```powershell
npm run tail                                   # live worker logs
npm run d1:query "SELECT * FROM users LIMIT 5;"
```
