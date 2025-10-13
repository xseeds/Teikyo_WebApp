@echo off
chcp 65001 >nul 2>&1
cls

echo ========================================
echo   Setup Verification
echo ========================================
echo.
echo Verifying that setup is complete...
echo.

set ERROR_COUNT=0

REM Check Node.js
echo [1/5] Checking Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo [X] Node.js not found
    echo     Download from https://nodejs.org/
    set /a ERROR_COUNT+=1
) else (
    node --version
    echo [OK] Node.js found
)
echo.

REM Check node_modules
echo [2/5] Checking dependencies...
if exist "node_modules\" (
    echo [OK] node_modules exists
) else (
    echo [X] node_modules not found
    echo     Run install.bat or: npm install
    set /a ERROR_COUNT+=1
)
echo.

REM Check config.yaml
echo [3/5] Checking config file...
if exist "config\config.yaml" (
    echo [OK] config\config.yaml exists
    
    REM Check if API key is set
    findstr /C:"sk-proj-" "config\config.yaml" >nul 2>&1
    if errorlevel 1 (
        findstr /C:"sk-" "config\config.yaml" >nul 2>&1
        if errorlevel 1 (
            echo [X] OpenAI API key not set
            echo     Open config\config.yaml and set your API key
            set /a ERROR_COUNT+=1
        ) else (
            echo [OK] API key is set
        )
    ) else (
        echo [OK] API key is set
    )
    
    REM Check for placeholder
    findstr /C:"xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" "config\config.yaml" >nul 2>&1
    if not errorlevel 1 (
        echo [!] API key is still a placeholder
        echo     Set your actual OpenAI API key
        set /a ERROR_COUNT+=1
    )
) else (
    echo [X] config\config.yaml not found
    echo     Run install.bat
    set /a ERROR_COUNT+=1
)
echo.

REM Check package.json
echo [4/5] Checking project files...
if exist "package.json" (
    echo [OK] package.json exists
) else (
    echo [X] package.json not found
    echo     Run from project root directory
    set /a ERROR_COUNT+=1
)
echo.

REM Check start scripts
echo [5/5] Checking start scripts...
if exist "start.bat" (
    echo [OK] start.bat exists
) else (
    echo [!] start.bat not found
)
if exist "quick-start.bat" (
    echo [OK] quick-start.bat exists
) else (
    echo [!] quick-start.bat not found
)
echo.

echo ========================================
echo   Verification Result
echo ========================================
echo.

if %ERROR_COUNT% EQU 0 (
    echo [OK] All checks passed!
    echo.
    echo Setup is complete.
    echo.
    echo To start:
    echo   - Double-click quick-start.bat (recommended)
    echo   - Or double-click start.bat
    echo   - Or run: npm run dev
    echo.
) else (
    echo [X] %ERROR_COUNT% error(s) found
    echo.
    echo Please fix the errors above and run this script again.
    echo.
    echo See SETUP_CHECKLIST.md or README.md for details.
    echo.
)

echo ========================================
pause
