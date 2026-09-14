$ErrorActionPreference = "Stop"

$AppName = "Central Dispatch Payroll"
$Root = Join-Path $env:LOCALAPPDATA "CentralDispatchPayroll"
$AppDir = Join-Path $Root "App"
$ProfileDir = Join-Path $Root "UserData"
$BackupDir = Join-Path $Root "Backups"

New-Item -ItemType Directory -Force -Path $AppDir, $ProfileDir, $BackupDir | Out-Null

$SourceHtml = Join-Path $PSScriptRoot "Central_Dispatch_Payroll_App.html"
$TargetHtml = Join-Path $AppDir "Central_Dispatch_Payroll_App.html"
Copy-Item $SourceHtml $TargetHtml -Force
Copy-Item (Join-Path $PSScriptRoot "Accounting_App.css") (Join-Path $AppDir "Accounting_App.css") -Force
Copy-Item (Join-Path $PSScriptRoot "Accounting_App.js") (Join-Path $AppDir "Accounting_App.js") -Force
Copy-Item (Join-Path $PSScriptRoot "Accounting_Imported_Data.js") (Join-Path $AppDir "Accounting_Imported_Data.js") -Force

$EdgeCandidates = @(
  "$env:ProgramFiles(x86)\Microsoft\Edge\Application\msedge.exe",
  "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe",
  "$env:LOCALAPPDATA\Microsoft\Edge\Application\msedge.exe"
)
$Browser = $EdgeCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1

if (-not $Browser) {
  $ChromeCandidates = @(
    "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
    "$env:ProgramFiles(x86)\Google\Chrome\Application\chrome.exe",
    "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe"
  )
  $Browser = $ChromeCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1
}

if (-not $Browser) {
  throw "Microsoft Edge or Google Chrome was not found on this computer."
}

$FileUri = "file:///" + ($TargetHtml -replace "\\","/")
$Arguments = "--app=`"$FileUri`" --user-data-dir=`"$ProfileDir`" --no-first-run"

$WshShell = New-Object -ComObject WScript.Shell

function New-AppShortcut($Path) {
  $Shortcut = $WshShell.CreateShortcut($Path)
  $Shortcut.TargetPath = $Browser
  $Shortcut.Arguments = $Arguments
  $Shortcut.WorkingDirectory = $AppDir
  $Shortcut.Description = "Central Dispatch Payroll"
  $Shortcut.IconLocation = "$Browser,0"
  $Shortcut.Save()
}

$DesktopShortcut = Join-Path ([Environment]::GetFolderPath("Desktop")) "$AppName.lnk"
New-AppShortcut $DesktopShortcut

$StartMenuDir = Join-Path $env:APPDATA "Microsoft\Windows\Start Menu\Programs\Central Dispatch"
New-Item -ItemType Directory -Force -Path $StartMenuDir | Out-Null
$StartMenuShortcut = Join-Path $StartMenuDir "$AppName.lnk"
New-AppShortcut $StartMenuShortcut

# Copy management scripts beside installed application.
Copy-Item (Join-Path $PSScriptRoot "BACKUP_DATA.ps1") (Join-Path $Root "BACKUP_DATA.ps1") -Force
Copy-Item (Join-Path $PSScriptRoot "RESTORE_LATEST_BACKUP.ps1") (Join-Path $Root "RESTORE_LATEST_BACKUP.ps1") -Force
Copy-Item (Join-Path $PSScriptRoot "UPDATE_APP.ps1") (Join-Path $Root "UPDATE_APP.ps1") -Force

Write-Host ""
Write-Host "Central Dispatch Payroll is installed." -ForegroundColor Green
Write-Host "Desktop shortcut: $DesktopShortcut"
Write-Host "Application data: $Root"
Write-Host ""
Write-Host "Use the Central Dispatch Payroll shortcut from now on."
Write-Host "Do not run the HTML file directly from Downloads."
Write-Host ""
Read-Host "Press Enter to finish"
