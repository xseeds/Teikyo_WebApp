@echo off
chcp 65001 >nul
cls

echo ========================================
echo   サーバーデバッグモード
echo ========================================
echo.

echo [チェック1] Node.js バージョン
node --version
echo.

echo [チェック2] 現在のディレクトリ
cd
echo.

echo [チェック3] config.yaml の存在確認
if exist "config\config.yaml" (
    echo ✅ config\config.yaml が見つかりました
    echo.
    echo [内容プレビュー]
    type config\config.yaml
) else (
    echo ❌ config\config.yaml が見つかりません！
    echo.
    if exist "config\config.yaml.example" (
        echo config\config.yaml.example は存在します。
        echo 以下のコマンドでコピーしてください：
        echo   copy config\config.yaml.example config\config.yaml
    )
)
echo.

echo [チェック4] node_modules の確認
if exist "node_modules" (
    echo ✅ node_modules が見つかりました
) else (
    echo ❌ node_modules が見つかりません
    echo npm install を実行してください
)
echo.

echo ========================================
echo サーバーを起動します（デバッグログ有効）
echo ========================================
echo.

set DEBUG=*
npm run server:dev

