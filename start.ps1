# WebChatBot Teikyo - PowerShell 起動スクリプト

# コンソールの設定
$Host.UI.RawUI.WindowTitle = "WebChatBot Teikyo"
Clear-Host

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  WebChatBot Teikyo - 起動スクリプト" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 設定ファイルの確認
if (-not (Test-Path "config\config.yaml")) {
    Write-Host "[エラー] config\config.yaml が見つかりません。" -ForegroundColor Red
    Write-Host ""
    Write-Host "以下の手順で設定ファイルを作成してください："
    Write-Host "1. config\config.yaml.example をコピー"
    Write-Host "2. config\config.yaml にリネーム"
    Write-Host "3. OpenAI API キーを設定"
    Write-Host ""
    Read-Host "Enterキーを押して終了"
    exit 1
}

Write-Host "[✓] 設定ファイルを確認しました" -ForegroundColor Green
Write-Host ""

# node_modules の確認
if (-not (Test-Path "node_modules")) {
    Write-Host "[情報] 依存パッケージをインストールしています..." -ForegroundColor Yellow
    Write-Host ""
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[エラー] npm install に失敗しました。" -ForegroundColor Red
        Read-Host "Enterキーを押して終了"
        exit 1
    }
    Write-Host ""
    Write-Host "[✓] インストールが完了しました" -ForegroundColor Green
    Write-Host ""
}

Write-Host "[情報] アプリケーションを起動しています..." -ForegroundColor Yellow
Write-Host ""
Write-Host "サーバー: " -NoNewline
Write-Host "http://localhost:3001" -ForegroundColor Cyan
Write-Host "フロント: " -NoNewline
Write-Host "http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "ブラウザで " -NoNewline
Write-Host "http://localhost:3000" -ForegroundColor Cyan -NoNewline
Write-Host " を開いてください。"
Write-Host "終了するには " -NoNewline
Write-Host "Ctrl+C" -ForegroundColor Yellow -NoNewline
Write-Host " を押してください。"
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 5秒後に自動でブラウザを開く
Start-Sleep -Seconds 2
Start-Process "http://localhost:3000"

# アプリケーション起動
npm run dev

