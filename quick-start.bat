@echo off
chcp 65001 >nul 2>&1

REM Quick start without verbose output
if not exist "config\config.yaml" (
    echo ERROR: config\config.yaml not found
    echo Please run install.bat first
    pause
    exit /b 1
)

REM Start application
start /B npm run dev

REM Wait for server to start
timeout /t 5 /nobreak >nul

REM Open browser
start http://localhost:3000
