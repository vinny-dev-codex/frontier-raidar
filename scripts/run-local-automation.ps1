[CmdletBinding()]
param(
  [switch]$HealthCheckOnly
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$workspace = Split-Path -Parent $PSScriptRoot
$dataRoot = "E:\AI\Codex\FrontierRadar"
$logRoot = Join-Path $dataRoot "logs"
$statusRoot = Join-Path $dataRoot "status"
$statusPath = Join-Path $statusRoot "latest.json"
$null = New-Item -ItemType Directory -Path $logRoot -Force
$null = New-Item -ItemType Directory -Path $statusRoot -Force

Get-ChildItem -LiteralPath $logRoot -File -Filter "*.log" -ErrorAction SilentlyContinue |
  Where-Object LastWriteTime -lt (Get-Date).AddDays(-30) |
  ForEach-Object { Remove-Item -LiteralPath $_.FullName -Force }

$logPath = Join-Path $logRoot ("daily-{0}.log" -f (Get-Date -Format "yyyyMMdd-HHmmss"))
$runMode = if ($HealthCheckOnly) { "health_check" } else { "production" }
$mutex = [Threading.Mutex]::new($false, "Local\FrontierRadarDailyAutomation")
$hasLock = $false
$transcriptStarted = $false
$exitCode = 0

function Write-RunStatus {
  param(
    [Parameter(Mandatory = $true)][string]$Status,
    [Parameter(Mandatory = $true)][string]$Detail
  )

  $payload = [ordered]@{
    status = $Status
    detail = $Detail
    mode = $runMode
    updatedAt = (Get-Date).ToString("o")
    logPath = $logPath
    machine = $env:COMPUTERNAME
    processId = $PID
  }
  $temporaryPath = "$statusPath.$PID.tmp"
  $payload | ConvertTo-Json | Set-Content -LiteralPath $temporaryPath -Encoding UTF8
  Move-Item -LiteralPath $temporaryPath -Destination $statusPath -Force
}

function Write-Phase {
  param([Parameter(Mandatory = $true)][string]$Message)
  Write-Host ("[{0}] {1}" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss zzz"), $Message)
}

try {
  $hasLock = $mutex.WaitOne(0)
  if (-not $hasLock) {
    Write-Host "Frontier Radar automation is already running."
    exit 0
  }

  Write-RunStatus -Status "running" -Detail "Automation process started."
  Start-Transcript -LiteralPath $logPath -Force
  $transcriptStarted = $true
  Write-Phase "Frontier Radar $runMode started."

  Push-Location -LiteralPath $workspace
  try {
    $knownNpm = "C:\Program Files\nodejs\npm.cmd"
    $npm = if (Test-Path -LiteralPath $knownNpm) {
      $knownNpm
    } else {
      (Get-Command npm.cmd -ErrorAction Stop).Source
    }
    Write-Phase "Using npm at $npm."

    $maxAttempts = if ($HealthCheckOnly) { 1 } else { 4 }
    for ($attempt = 1; $attempt -le $maxAttempts; $attempt++) {
      try {
        Write-Phase "Starting attempt $attempt of $maxAttempts."
        if ($HealthCheckOnly) {
          Write-Phase "Checking automation environment."
          & $npm run automation:check
          if ($LASTEXITCODE -ne 0) { throw "Automation environment check failed with exit code $LASTEXITCODE." }

          Write-Phase "Checking Supabase connectivity without treating the API key as a JWT."
          & $npm run supabase:check
          if ($LASTEXITCODE -ne 0) { throw "Supabase connectivity check failed with exit code $LASTEXITCODE." }
        } else {
          Write-Phase "Synchronizing the 29-source registry."
          & $npm run sources:sync
          if ($LASTEXITCODE -ne 0) { throw "Source synchronization failed with exit code $LASTEXITCODE." }

          Write-Phase "Running daily card automation."
          & $npm run automate
          if ($LASTEXITCODE -ne 0) { throw "Daily automation failed with exit code $LASTEXITCODE." }
        }

        Write-Phase "Auditing platform capacity."
        & $npm run capacity:audit
        if ($LASTEXITCODE -ne 0) { throw "Capacity audit failed with exit code $LASTEXITCODE." }
        break
      } catch {
        if ($attempt -ge $maxAttempts) { throw }
        $retryDetail = "Attempt $attempt failed: $($_.Exception.Message). Retrying in 10 minutes."
        Write-RunStatus -Status "retrying" -Detail $retryDetail
        Write-Phase $retryDetail
        Start-Sleep -Seconds 600
      }
    }
  } finally {
    Pop-Location
  }

  Write-RunStatus -Status "succeeded" -Detail "All $runMode phases completed successfully."
  Write-Phase "Frontier Radar $runMode completed successfully."
} catch {
  $exitCode = 1
  Write-RunStatus -Status "failed" -Detail $_.Exception.Message
  Write-Error $_
} finally {
  if ($transcriptStarted) {
    try { Stop-Transcript | Out-Null } catch {}
  }
  if ($hasLock) { $mutex.ReleaseMutex() }
  $mutex.Dispose()
}

exit $exitCode
