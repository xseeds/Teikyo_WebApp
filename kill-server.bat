@echo off
chcp 65001 >nul
cls

echo ========================================
echo   サーバープロセス終了ツール
echo ========================================
echo.

echo [INFO] ポート 3000 と 3001 を使用しているプロセスを確認中...
echo.

echo --- ポート 3000 ---
netstat -ano | findstr :3000
echo.

echo --- ポート 3001 ---
netstat -ano | findstr :3001
echo.

echo ========================================
echo すべての Node.js プロセスを終了しますか？
echo ========================================
echo.
pause

echo.
echo [INFO] Node.js プロセスを終了しています...
taskkill /IM node.exe /F 2>nul

if %ERRORLEVEL% EQU 0 (
    echo [SUCCESS] ✅ Node.js プロセスを終了しました
) else (
    echo [INFO] 実行中の Node.js プロセスはありませんでした
)

echo.
echo ========================================
echo 完了しました
echo ========================================
echo.
echo 次のコマンドでサーバーを起動してください：
echo   npm run dev
echo または
echo   .\quick-start.bat
echo.
pause

