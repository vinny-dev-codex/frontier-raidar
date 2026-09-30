[CmdletBinding()]
param(
  [string]$TaskName = "Frontier Radar Daily Automation",
  [TimeSpan]$At = "14:00:00"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$workspace = Split-Path -Parent $PSScriptRoot
$runner = Join-Path $PSScriptRoot "run-local-automation.ps1"
$powerShell = Join-Path $env:SystemRoot "System32\WindowsPowerShell\v1.0\powershell.exe"

if (-not (Test-Path -LiteralPath $runner)) {
  throw "Automation runner not found: $runner"
}

$identity = [Security.Principal.WindowsIdentity]::GetCurrent()
$userId = $identity.Name
$arguments = '-NoLogo -NoProfile -NonInteractive -WindowStyle Hidden -ExecutionPolicy Bypass -File "{0}"' -f $runner
$action = New-ScheduledTaskAction -Execute $powerShell -Argument $arguments -WorkingDirectory $workspace
$trigger = New-ScheduledTaskTrigger -Daily -At ((Get-Date).Date.Add($At))
$principal = New-ScheduledTaskPrincipal -UserId $userId -LogonType S4U -RunLevel Limited
$settings = New-ScheduledTaskSettingsSet `
  -Compatibility Win8 `
  -StartWhenAvailable `
  -WakeToRun `
  -AllowStartIfOnBatteries `
  -DontStopIfGoingOnBatteries `
  -DontStopOnIdleEnd `
  -ExecutionTimeLimit (New-TimeSpan -Hours 4) `
  -MultipleInstances IgnoreNew `
  -RestartCount 3 `
  -RestartInterval (New-TimeSpan -Minutes 10)

$expectedStartTime = $At.ToString("hh\:mm\:ss")
$description = "Frontier Radar production automation: daily at $expectedStartTime local time; up to two cards; no audio transcription; no email delivery."
$task = New-ScheduledTask -Action $action -Trigger $trigger -Principal $principal -Settings $settings -Description $description
$registeredTask = Register-ScheduledTask -TaskName $TaskName -InputObject $task -Force -ErrorAction Stop
$taskInfo = $registeredTask | Get-ScheduledTaskInfo -ErrorAction Stop
$installedTrigger = $registeredTask.Triggers | Select-Object -First 1

if ($registeredTask.Principal.LogonType -ne "S4U") {
  throw "Scheduled task was registered with unexpected logon type: $($registeredTask.Principal.LogonType)"
}
if ($installedTrigger.StartBoundary -notmatch "T$([regex]::Escape($expectedStartTime))") {
  throw "Scheduled task was registered with unexpected start boundary: $($installedTrigger.StartBoundary)"
}

[pscustomobject]@{
  TaskName = $registeredTask.TaskName
  State = $registeredTask.State
  LogonType = $registeredTask.Principal.LogonType
  StartBoundary = $installedTrigger.StartBoundary
  LastRunTime = $taskInfo.LastRunTime
  LastTaskResult = $taskInfo.LastTaskResult
  NextRunTime = $taskInfo.NextRunTime
  NumberOfMissedRuns = $taskInfo.NumberOfMissedRuns
}
