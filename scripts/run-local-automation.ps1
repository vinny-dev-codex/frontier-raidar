[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$workspace = Split-Path -Parent $PSScriptRoot
$logRoot = "E:\AI\Codex\FrontierRadar\logs"
$null = New-Item -ItemType Directory -Path $logRoot -Force
Get-ChildItem -LiteralPath $logRoot -File -Filter "*.log" -ErrorAction SilentlyContinue |
  Where-Object LastWriteTime -lt (Get-Date).AddDays(-30) |
  ForEach-Object { Remove-Item -LiteralPath $_.FullName -Force }

$logPath = Join-Path $logRoot ("daily-{0}.log" -f (Get-Date -Format "yyyyMMdd-HHmmss"))
$mutex = [Threading.Mutex]::new($false, "Local\FrontierRadarDailyAutomation")
$hasLock = $false

try {
  $hasLock = $mutex.WaitOne(0)
  if (-not $hasLock) {
    Write-Host "Frontier Radar automation is already running."
    exit 0
  }

  Start-Transcript -LiteralPath $logPath -Force
  Push-Location -LiteralPath $workspace
  try {
    $npm = (Get-Command npm.cmd -ErrorAction Stop).Source

    & $npm run sources:sync
    if ($LASTEXITCODE -ne 0) { throw "Source synchronization failed with exit code $LASTEXITCODE." }

    & $npm run automate
    if ($LASTEXITCODE -ne 0) { throw "Daily automation failed with exit code $LASTEXITCODE." }

    & $npm run capacity:audit
    if ($LASTEXITCODE -ne 0) { throw "Capacity audit failed with exit code $LASTEXITCODE." }
  } finally {
    Pop-Location
  }
} catch {
  Write-Error $_
  exit 1
} finally {
  try { Stop-Transcript | Out-Null } catch {}
  if ($hasLock) { $mutex.ReleaseMutex() }
  $mutex.Dispose()
}
