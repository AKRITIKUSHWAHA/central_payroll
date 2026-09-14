$ErrorActionPreference = "Stop"
$Root = Join-Path $env:LOCALAPPDATA "CentralDispatchPayroll"
$ProfileDir = Join-Path $Root "UserData"
$BackupDir = Join-Path $Root "Backups"

$latest = Get-ChildItem $BackupDir -Directory -Filter "PayrollData_*" |
  Sort-Object LastWriteTime -Descending |
  Select-Object -First 1

if (-not $latest) {
  throw "No Central Dispatch Payroll backup was found."
}

Write-Host "IMPORTANT: Close Central Dispatch Payroll before restoring." -ForegroundColor Yellow
Write-Host "Restoring from: $($latest.FullName)"
$confirm = Read-Host "Type RESTORE to continue"
if ($confirm -ne "RESTORE") {
  Write-Host "Restore cancelled."
  exit
}

if (Test-Path $ProfileDir) {
  Remove-Item $ProfileDir -Recurse -Force
}
Copy-Item (Join-Path $latest.FullName "UserData") $ProfileDir -Recurse -Force

Write-Host "Restore completed." -ForegroundColor Green
Read-Host "Press Enter to finish"
