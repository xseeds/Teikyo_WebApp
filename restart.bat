@echo off
chcp 65001 >nul 2>&1
cls

echo ========================================
echo   Server Restart Tool
echo ========================================
echo.

echo [STEP 1] Killing existing processes...
taskkill /IM node.exe /F 2>nul

if %ERRORLEVEL% EQU 0 (
    echo [OK] Existing processes killed
) else (
    echo [INFO] No running processes found
)

echo.
echo [STEP 2] Waiting 3 seconds...
timeout /t 3 /nobreak >nul

echo.
echo [STEP 3] Starting server...
echo.
echo ========================================
echo  Server Starting
echo  Press Ctrl+C to stop
echo ========================================
echo.

call npm run dev
