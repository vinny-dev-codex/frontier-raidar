[CmdletBinding()]
param(
  [string]$ProbeTaskName = "Frontier Radar Scheduler Probe",
  [int]$TimeoutSeconds = 300
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$workspace = Split-Path -Parent $PSScriptRoot
$runner = Join-Path $PSScriptRoot "run-local-automation.ps1"
$powerShell = Join-Path $env:SystemRoot "System32\WindowsPowerShell\v1.0\powershell.exe"
$statusRoot = "E:\AI\Codex\FrontierRadar\status"
$reportPath = Join-Path $statusRoot "scheduler-probe.json"
$identity = [Security.Principal.WindowsIdentity]::GetCurrent()
$userId = $identity.Name
$startedAt = Get-Date

$null = New-Item -ItemType Directory -Path $statusRoot -Force
$arguments = '-NoLogo -NoProfile -NonInteractive -WindowStyle Hidden -ExecutionPolicy Bypass -File "{0}" -HealthCheckOnly' -f $runner
$action = New-ScheduledTaskAction -Execute $powerShell -Argument $arguments -WorkingDirectory $workspace
$trigger = New-ScheduledTaskTrigger -Once -At ((Get-Date).AddHours(1))
$principal = New-ScheduledTaskPrincipal -UserId $userId -LogonType S4U -RunLevel Limited
$settings = New-ScheduledTaskSettingsSet `
  -Compatibility Win8 `
  -AllowStartIfOnBatteries `
  -DontStopIfGoingOnBatteries `
  -ExecutionTimeLimit (New-TimeSpan -Minutes 20) `
  -MultipleInstances IgnoreNew

try {
  $probe = New-ScheduledTask -Action $action -Trigger $trigger -Principal $principal -Settings $settings -Description "Temporary Frontier Radar non-interactive scheduler probe."
  $null = Register-ScheduledTask -TaskName $ProbeTaskName -InputObject $probe -Force -ErrorAction Stop
  Start-ScheduledTask -TaskName $ProbeTaskName -ErrorAction Stop

  $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
  do {
    Start-Sleep -Seconds 2
    $task = Get-ScheduledTask -TaskName $ProbeTaskName -ErrorAction Stop
    $info = $task | Get-ScheduledTaskInfo -ErrorAction Stop
    $hasRun = $info.LastRunTime -ge $startedAt.AddSeconds(-5)
    $finished = $hasRun -and $task.State -ne "Running"
  } until ($finished -or (Get-Date) -ge $deadline)

  if (-not $finished) {
    throw "Scheduler probe did not finish within $TimeoutSeconds seconds."
  }

  $status = if (Test-Path -LiteralPath (Join-Path $statusRoot "latest.json")) {
    Get-Content -LiteralPath (Join-Path $statusRoot "latest.json") -Raw | ConvertFrom-Json
  } else {
    $null
  }
  $report = [ordered]@{
    verifiedAt = (Get-Date).ToString("o")
    taskResult = $info.LastTaskResult
    taskState = [string]$task.State
    runStatus = if ($null -ne $status) { $status.status } else { $null }
    runMode = if ($null -ne $status) { $status.mode } else { $null }
    logPath = if ($null -ne $status) { $status.logPath } else { $null }
  }
  $report | ConvertTo-Json | Set-Content -LiteralPath $reportPath -Encoding UTF8

  if ($info.LastTaskResult -ne 0 -or $null -eq $status -or $status.status -ne "succeeded" -or $status.mode -ne "health_check") {
    throw "Scheduler probe failed. See $reportPath and the referenced log."
  }

  [pscustomobject]$report
} finally {
  $existingProbe = Get-ScheduledTask -TaskName $ProbeTaskName -ErrorAction SilentlyContinue
  if ($null -ne $existingProbe) {
    Unregister-ScheduledTask -TaskName $ProbeTaskName -Confirm:$false -ErrorAction SilentlyContinue
  }
}
