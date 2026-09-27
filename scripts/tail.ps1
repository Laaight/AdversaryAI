$ErrorActionPreference = "Stop"

$cfToken = [System.Environment]::GetEnvironmentVariable("cloudflarkey", "User")
if (-not $cfToken) { $cfToken = $env:cloudflarkey }
$env:CLOUDFLARE_API_TOKEN = $cfToken

npx wrangler tail adversaryai
