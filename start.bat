@echo off
chcp 65001 >nul 2>&1
cls

echo ========================================
echo   WebChatBot Teikyo - Start
echo ========================================
echo.

REM Check config file
if not exist "config\config.yaml" (
    echo [ERROR] config\config.yaml not found.
    echo.
    echo Please follow these steps:
    echo 1. Copy config\config.yaml.example
    echo 2. Rename to config\config.yaml
    echo 3. Set your OpenAI API key
    echo.
    pause
    exit /b 1
)

REM Check node_modules
if not exist "node_modules" (
    echo [INFO] Installing dependencies...
    echo.
    call npm install
    if errorlevel 1 (
        echo [ERROR] npm install failed.
        pause
        exit /b 1
    )
    echo.
)

echo [INFO] Starting application...
echo.
echo Server: http://localhost:3001
echo Frontend: http://localhost:3000
echo.
echo Open http://localhost:3000 in your browser.
echo Press Ctrl+C to stop.
echo.
echo ========================================
echo.

REM Start application
call npm run dev
