param(
  [Parameter(Mandatory=$true, Position=0)]
  [string]$Sql
)

$ErrorActionPreference = "Stop"
$cfToken = [System.Environment]::GetEnvironmentVariable("cloudflarkey", "User")
if (-not $cfToken) { $cfToken = $env:cloudflarkey }

$body = @{ sql = $Sql } | ConvertTo-Json
$res = Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/accounts/c7c994f6f420b6b429084f0e9c915ded/d1/database/a2763f97-fa6a-46c7-b3e9-349c50ad16ff/query" -Method Post -Headers @{
  Authorization = "Bearer $cfToken"
  "Content-Type" = "application/json"
} -Body $body

if ($res.result[0].results.Count -gt 0) {
  $res.result[0].results | Format-List
} else {
  Write-Host "No rows returned."
}

