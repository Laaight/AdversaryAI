# AdversaryAI (getadversaryai.com)

AdversaryAI is an AI debate-sparring web app at [getadversaryai.com](https://getadversaryai.com). Users pick a practice mode, choose an AI opponent persona with a 3D avatar and neural voice, spar via text/voice with a lip-synced 3D avatar responding in real time, and receive coaching scores from an AI judge.

## Stack

- **Edge / API**: Cloudflare Workers (Hono framework) + D1 SQLite (`adversaryai-db`)
- **Frontend**: SPA served from `/app/` + static landing page at root (`frontend/dist`)
- **Debate Brain**: Azure AI Foundry DeepSeek V4:
  - Base tiers: `DeepSeek-V4-Flash`
  - Champion tier: `DeepSeek-V4-Pro`
- **Voice / Lip-sync**: Azure Speech Neural TTS (`westus3`) driving viseme & word-boundary events for 3D avatar lip synchronization
- **Billing**: Stripe (live mode: Debater $12/mo, Coach $29/mo, Champion $49/mo, Edu seats $6/seat/mo, Session Packs)

## Project Structure

```
adversaryai/
├── worker/
│   └── src/
│       └── index.js           # Cloudflare Worker API & routing
├── frontend/
│   └── dist/
│       ├── index.html         # Landing page
│       ├── landing.css        # Landing stylesheet
│       ├── landing.js         # Landing interactivity & Three.js canvas
│       ├── models/personas/   # 3D GLB avatars (man-pro, older-man, etc.)
│       └── app/               # AdversaryAI SPA application
├── scripts/
│   ├── deploy.ps1             # Deploys worker & assets using $env:cloudflarkey
│   ├── d1-query.ps1           # Runs direct SQL queries on remote D1 database
│   └── tail.ps1               # Live worker log streaming
├── wrangler.jsonc             # Cloudflare configuration & bindings
└── package.json               # Local npm scripts
```

## Commands

All scripts use the local `cloudflarkey` environment variable automatically.

### Deploy to Cloudflare
```powershell
npm run deploy
# or
powershell -ExecutionPolicy Bypass -File ./scripts/deploy.ps1
```

### Query Production D1 Database
```powershell
powershell -ExecutionPolicy Bypass -File ./scripts/d1-query.ps1 "SELECT * FROM users LIMIT 5;"
```

### Stream Live Worker Logs
```powershell
npm run tail
```
