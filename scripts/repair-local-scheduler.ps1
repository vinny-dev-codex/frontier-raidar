[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$statusRoot = "E:\AI\Codex\FrontierRadar\status"
$transcriptPath = Join-Path $statusRoot "scheduler-repair.log"
$null = New-Item -ItemType Directory -Path $statusRoot -Force

try {
  Start-Transcript -LiteralPath $transcriptPath -Force
  & (Join-Path $PSScriptRoot "install-local-scheduled-task.ps1")

  & (Join-Path $env:SystemRoot "System32\wevtutil.exe") sl "Microsoft-Windows-TaskScheduler/Operational" /e:true
  if ($LASTEXITCODE -ne 0) {
    throw "Could not enable Task Scheduler operational history (exit code $LASTEXITCODE)."
  }

  & (Join-Path $PSScriptRoot "verify-local-scheduled-task.ps1")
  Write-Host "Frontier Radar scheduler repair and verification completed."
} finally {
  try { Stop-Transcript | Out-Null } catch {}
}
