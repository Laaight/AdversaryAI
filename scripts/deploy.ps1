$ErrorActionPreference = "Stop"

$cfToken = [System.Environment]::GetEnvironmentVariable("cloudflarkey", "User")
if (-not $cfToken) {
  $cfToken = $env:cloudflarkey
}
if (-not $cfToken) {
  Write-Error "Environment variable 'cloudflarkey' is not set."
  exit 1
}

$env:CLOUDFLARE_API_TOKEN = $cfToken
Write-Host "Deploying AdversaryAI to Cloudflare..." -ForegroundColor Cyan
npx wrangler deploy
