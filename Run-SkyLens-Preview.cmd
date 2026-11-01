@echo off
rem Double-click to open the SkyLens browser preview. Close this window to stop it.
cd /d "%~dp0"
if not exist ".build-wasm\skybridge.wasm" (
  echo The preview engine has not been built yet. See "Browser preview" in README.md.
  pause
  exit /b 1
)
start "" http://localhost:5173
node Tools\web-preview\server.mjs 5173
pause
