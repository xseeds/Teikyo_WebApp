@echo off
chcp 65001 >nul
title WebChatBot Teikyo - 起動中...

REM 設定ファイルチェック
if not exist "config\config.yaml" (
    echo config\config.yaml が見つかりません！
    echo config\config.yaml.example をコピーして設定してください。
    pause
    exit /b 1
)

REM 初回のみ npm install
if not exist "node_modules" (
    echo 初回セットアップ中...
    call npm install
)

REM バックグラウンドでブラウザ起動スクリプトを実行
start /min cmd /c start-browser.bat

REM アプリ起動
call npm run dev

