# 🚀 クイックスタートガイド

## 1分で起動する方法

### ステップ 1: セットアップ

1. **`install.bat` をダブルクリック**
   - 自動で依存パッケージをインストール
   - 設定ファイル（config.yaml）を自動作成
   - メモ帳が開くので、OpenAI API キーを貼り付け

2. **API キーの設定**
   ```yaml
   security:
     openai_api_key: "sk-proj-あなたのAPIキーをここに貼り付け"
   ```
   保存して閉じる

### ステップ 2: 起動

**以下のいずれかを実行：**

#### 方法 A: クイックスタート（最速・推奨）
- **`quick-start.bat`** をダブルクリック
- → 自動でブラウザが開きます

#### 方法 B: 標準起動
- **`start.bat`** をダブルクリック
- → 手動でブラウザから http://localhost:3000 を開く

#### 方法 C: PowerShell（詳細表示）
- **`start.ps1`** をダブルクリック
- → カラフルな表示＋自動ブラウザ起動

### ステップ 3: 使い方

1. **モデルを選択**
   - 推奨: `gpt-realtime-2025-08-28` (最新)
   - または: `gpt-realtime-mini-2025-10-06` (軽量・低コスト)
2. **ボイスを選択**（例: shimmer）
3. **「接続」ボタン**をクリック
4. マイクの使用を許可
5. 話しかける、またはテキスト入力！

---

## バッチファイル一覧

| ファイル | 用途 | 特徴 |
|---------|------|------|
| `install.bat` | 初回セットアップ | Node.js確認、npm install、設定作成 |
| `quick-start.bat` | 最速起動 | ブラウザ自動起動、最小限の表示 |
| `start.bat` | 標準起動 | 詳細なメッセージ表示 |
| `start.ps1` | PowerShell版 | カラー表示、自動ブラウザ起動 |

---

## トラブルシューティング

### 「Node.js がインストールされていません」

→ https://nodejs.org/ からダウンロードしてインストール

### 「config.yaml が見つかりません」

→ `install.bat` を実行するか、手動で作成：
```powershell
copy config\config.yaml.example config\config.yaml
notepad config\config.yaml
```

### 「ポートが使用中です」

→ 他のアプリが 3000 または 3001 番ポートを使っている可能性
```powershell
# ポートを使用中のプロセスを確認
netstat -ano | findstr :3000
netstat -ano | findstr :3001
```

### テストページでの診断

問題がある場合は、テストページで診断できます：  
http://localhost:3000/public/test.html

### マイクが動作しない

→ ブラウザのマイク権限を確認
- Chrome: アドレスバーの🔒マーク → サイトの設定 → マイク

---

## 終了方法

起動したコマンドプロンプトで **`Ctrl + C`** を押す

---

**詳しい情報は `README.md` または `USAGE.md` をご覧ください。**

