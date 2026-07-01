@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo.
echo ╔══════════════════════════════════════════════════════════╗
echo ║                                                          ║
echo ║        🔄 LoopMaster - Chrome Installation              ║
echo ║                                                          ║
echo ╚══════════════════════════════════════════════════════════╝
echo.

echo [1/3] Building TypeScript...
echo.
call npm run build
if errorlevel 1 (
    echo.
    echo ❌ Build failed! Please fix errors and try again.
    echo.
    pause
    exit /b 1
)
echo.
echo ✅ Build successful!
echo.

echo [2/3] Creating Chrome package...
echo.
if exist loopmaster-chrome.zip del loopmaster-chrome.zip
powershell -Command "Compress-Archive -Path dist, icons, manifest.json, popup.html -DestinationPath loopmaster-chrome.zip -Force"
echo ✅ Package created: loopmaster-chrome.zip
echo.

echo [3/3] Installing to Chrome...
echo.
echo ════════════════════════════════════════════════════════════
echo  🔴 MANUAL STEP REQUIRED
echo ════════════════════════════════════════════════════════════
echo.
echo  1. Open Chrome and go to:  chrome://extensions/
echo.
echo  2. Turn ON "Developer mode"  (top-right corner)
echo.
echo  3. Click "Load unpacked"
echo.
echo  4. Select this folder:
echo     %cd%
echo.
echo  5. Click "Select Folder"
echo.
echo ════════════════════════════════════════════════════════════
echo.
echo  ⚠️  IMPORTANT: DO NOT select the ZIP file!
echo     Select the folder itself!
echo.
echo  📝 After loading, you can delete loopmaster-chrome.zip
echo.
pause