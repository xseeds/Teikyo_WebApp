@echo off
chcp 65001 >nul 2>&1
cls

echo ========================================
echo   Kill Server Process
echo ========================================
echo.

echo [INFO] Checking processes using ports 3000 and 3001...
echo.

echo --- Port 3000 ---
netstat -ano | findstr :3000
echo.

echo --- Port 3001 ---
netstat -ano | findstr :3001
echo.

echo ========================================
echo Kill all Node.js processes?
echo ========================================
echo.
pause

echo.
echo [INFO] Killing Node.js processes...
taskkill /IM node.exe /F 2>nul

if %ERRORLEVEL% EQU 0 (
    echo [SUCCESS] Node.js processes killed
) else (
    echo [INFO] No running Node.js processes found
)

echo.
echo ========================================
echo Done
echo ========================================
echo.
echo To start the server again:
echo   npm run dev
echo or
echo   .\quick-start.bat
echo.
pause
