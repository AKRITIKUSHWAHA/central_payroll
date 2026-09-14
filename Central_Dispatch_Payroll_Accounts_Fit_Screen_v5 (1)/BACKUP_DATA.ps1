$ErrorActionPreference = "Stop"
$Root = Join-Path $env:LOCALAPPDATA "CentralDispatchPayroll"
$ProfileDir = Join-Path $Root "UserData"
$BackupDir = Join-Path $Root "Backups"

if (-not (Test-Path $ProfileDir)) {
  throw "Central Dispatch Payroll data folder was not found. Install and use the app first."
}

$stamp = Get-Date -Format "yyyy-MM-dd_HHmmss"
$dest = Join-Path $BackupDir "PayrollData_$stamp"
New-Item -ItemType Directory -Force -Path $dest | Out-Null

Write-Host "Close Central Dispatch Payroll before backing up." -ForegroundColor Yellow
Start-Sleep -Seconds 2
Copy-Item $ProfileDir (Join-Path $dest "UserData") -Recurse -Force
Copy-Item (Join-Path $Root "App") (Join-Path $dest "App") -Recurse -Force

Write-Host ""
Write-Host "Backup completed:" -ForegroundColor Green
Write-Host $dest
Read-Host "Press Enter to finish"
