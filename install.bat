@echo off
chcp 65001 >nul
cls

echo ========================================
echo   WebChatBot Teikyo - セットアップ
echo ========================================
echo.

REM Node.js のバージョン確認
echo [1/3] Node.js のバージョンを確認しています...
node --version >nul 2>&1
if errorlevel 1 (
    echo [エラー] Node.js がインストールされていません。
    echo https://nodejs.org/ からダウンロードしてください。
    pause
    exit /b 1
)
node --version
echo [✓] Node.js が見つかりました
echo.

REM 依存パッケージのインストール
echo [2/3] 依存パッケージをインストールしています...
call npm install
if errorlevel 1 (
    echo [エラー] npm install に失敗しました。
    pause
    exit /b 1
)
echo [✓] インストールが完了しました
echo.

REM 設定ファイルの確認・作成
echo [3/3] 設定ファイルを確認しています...
if exist "config\config.yaml" (
    echo [✓] config\config.yaml が見つかりました
) else (
    if exist "config\config.yaml.example" (
        echo config\config.yaml.example から config\config.yaml を作成します...
        copy "config\config.yaml.example" "config\config.yaml" >nul
        echo [✓] config\config.yaml を作成しました
        echo.
        echo [重要] config\config.yaml を開いて OpenAI API キーを設定してください！
        timeout /t 3 /nobreak >nul
        notepad "config\config.yaml"
    ) else (
        echo [警告] 設定ファイルのサンプルが見つかりません
    )
)
echo.

echo ========================================
echo   セットアップが完了しました！
echo ========================================
echo.
echo 起動方法：
echo   - start.bat をダブルクリック
echo   - または: npm run dev
echo.
echo config\config.yaml に OpenAI API キーを設定してから起動してください。
echo.
pause

