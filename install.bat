@echo off
REM UTF-8 BOM with chcp to handle Japanese characters properly
chcp 65001 >nul 2>&1
cls

echo ========================================
echo   WebChatBot Teikyo - Setup
echo ========================================
echo.

REM Check Node.js version
echo [1/3] Checking Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed.
    echo Please download from https://nodejs.org/
    pause
    exit /b 1
)
node --version
echo [OK] Node.js found
echo.

REM Install dependencies
echo [2/3] Installing dependencies...
call npm install
if errorlevel 1 (
    echo [ERROR] npm install failed.
    pause
    exit /b 1
)
echo [OK] Installation completed
echo.

REM Check or create config file
echo [3/3] Checking config file...
if exist "config\config.yaml" (
    echo [OK] config\config.yaml found
) else (
    if exist "config\config.yaml.example" (
        echo Creating config\config.yaml from config.yaml.example...
        copy "config\config.yaml.example" "config\config.yaml" >nul
        echo [OK] config\config.yaml created
        echo.
        echo [IMPORTANT] Please set your OpenAI API key in config\config.yaml
        timeout /t 3 /nobreak >nul
        notepad "config\config.yaml"
    ) else (
        echo [WARNING] config.yaml.example not found
    )
)
echo.

echo ========================================
echo   Setup completed!
echo ========================================
echo.
echo To start the application:
echo   - Double-click start.bat
echo   - Or run: npm run dev
echo.
echo Please set your OpenAI API key in config\config.yaml before starting.
echo.
pause

