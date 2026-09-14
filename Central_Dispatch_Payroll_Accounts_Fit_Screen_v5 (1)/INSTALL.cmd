@echo off
setlocal
PowerShell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0INSTALL.ps1"
if errorlevel 1 (
  echo.
  echo Installation did not complete.
  pause
)
