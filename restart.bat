@echo off
chcp 65001 >nul
cls

echo ========================================
echo   サーバー再起動ツール
echo ========================================
echo.

echo [STEP 1] 既存のプロセスを終了中...
taskkill /IM node.exe /F 2>nul

if %ERRORLEVEL% EQU 0 (
    echo ✅ 既存のプロセスを終了しました
) else (
    echo ℹ️ 実行中のプロセスはありませんでした
)

echo.
echo [STEP 2] 3秒待機中...
timeout /t 3 /nobreak >nul

echo.
echo [STEP 3] サーバーを起動中...
echo.
echo ========================================
echo  サーバー起動中
echo  終了するには Ctrl+C を押してください
echo ========================================
echo.

call npm run dev

