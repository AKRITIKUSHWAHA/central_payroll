$ErrorActionPreference = "Stop"
$Root = Join-Path $env:LOCALAPPDATA "CentralDispatchPayroll"
$AppDir = Join-Path $Root "App"
$TargetHtml = Join-Path $AppDir "Central_Dispatch_Payroll_App.html"

Write-Host "This updates the APP FILE while preserving the dedicated payroll data profile." -ForegroundColor Cyan
Write-Host "Close Central Dispatch Payroll before continuing." -ForegroundColor Yellow

$NewFile = Read-Host "Enter the full path to the new Central_Dispatch_Payroll_App.html"
if (-not (Test-Path $NewFile)) {
  throw "The file was not found: $NewFile"
}

Copy-Item $NewFile $TargetHtml -Force
$SourceDir = Split-Path $NewFile -Parent
foreach ($Asset in @("Accounting_App.css", "Accounting_App.js", "Accounting_Imported_Data.js")) {
  $SourceAsset = Join-Path $SourceDir $Asset
  if (Test-Path $SourceAsset) { Copy-Item $SourceAsset (Join-Path $AppDir $Asset) -Force }
}
Write-Host "Application updated. Your installed data profile was left in place." -ForegroundColor Green
Read-Host "Press Enter to finish"
