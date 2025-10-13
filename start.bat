@echo off
chcp 65001 >nul
cls

echo ========================================
echo   WebChatBot Teikyo - 起動スクリプト
echo ========================================
echo.

REM 設定ファイルの確認
if not exist "config\config.yaml" (
    echo [エラー] config\config.yaml が見つかりません。
    echo.
    echo 以下の手順で設定ファイルを作成してください：
    echo 1. config\config.yaml.example をコピー
    echo 2. config\config.yaml にリネーム
    echo 3. OpenAI API キーを設定
    echo.
    pause
    exit /b 1
)

REM node_modules の確認
if not exist "node_modules" (
    echo [情報] 依存パッケージをインストールしています...
    echo.
    call npm install
    if errorlevel 1 (
        echo [エラー] npm install に失敗しました。
        pause
        exit /b 1
    )
    echo.
)

echo [情報] アプリケーションを起動しています...
echo.
echo サーバー: http://localhost:3001
echo フロント: http://localhost:3000
echo.
echo ブラウザで http://localhost:3000 を開いてください。
echo 終了するには Ctrl+C を押してください。
echo.
echo ========================================
echo.

REM アプリケーション起動
call npm run dev

