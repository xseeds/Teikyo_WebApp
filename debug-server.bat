@echo off
chcp 65001 >nul 2>&1
cls

echo ========================================
echo   Server Debug Mode
echo ========================================
echo.

echo [Check 1] Node.js Version
node --version
echo.

echo [Check 2] Current Directory
cd
echo.

echo [Check 3] Check config.yaml
if exist "config\config.yaml" (
    echo [OK] config\config.yaml found
    echo.
    echo [Content Preview]
    type config\config.yaml
) else (
    echo [X] config\config.yaml not found!
    echo.
    if exist "config\config.yaml.example" (
        echo config\config.yaml.example exists.
        echo Copy it with the following command:
        echo   copy config\config.yaml.example config\config.yaml
    )
)
echo.

echo [Check 4] Check node_modules
if exist "node_modules" (
    echo [OK] node_modules found
) else (
    echo [X] node_modules not found
    echo Please run: npm install
)
echo.

echo ========================================
echo Starting server (debug logs enabled)
echo ========================================
echo.

set DEBUG=*
npm run server:dev
