# ✅ セットアップチェックリスト

## GitHubからクローンした後に必ず確認してください

このドキュメントは、別のPCでこのプロジェクトをセットアップする際のチェックリストです。

---

## 📋 セットアップ手順

### ステップ 1: リポジトリのクローン

```bash
git clone <あなたのリポジトリURL>
cd Teikyo_WebApp
```

---

### ステップ 2: 必須ファイルの確認

以下のファイルが存在することを確認してください：

- ✅ `config/config.yaml.example` - 設定ファイルのサンプル
- ✅ `install.bat` - セットアップスクリプト
- ✅ `package.json` - 依存関係の定義

**注意**: `config/config.yaml` は存在しません（セキュリティのため）。
次のステップで作成します。

---

### ステップ 3: セットアップの実行

#### Windows の場合:

1. **`install.bat` をダブルクリック**

または、PowerShell で実行：

```powershell
.\install.bat
```

#### Mac / Linux の場合:

```bash
# Node.js のバージョン確認
node --version

# 依存パッケージのインストール
npm install

# 設定ファイルの作成
cp config/config.yaml.example config/config.yaml

# エディタで開く
nano config/config.yaml  # または vim, code など
```

---

### ステップ 4: API キーの設定

`config/config.yaml` を開いて、以下を設定：

```yaml
security:
  # あなた自身の OpenAI API キーを設定
  openai_api_key: "sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"

rag:
  # RAG を使う場合のみ設定（オプション）
  vector_store_id: ""

prompt:
  # システムプロンプトは自由にカスタマイズ可能
  system: |
    あなたは簡潔に話す音声アシスタントです。
    専門用語は噛み砕いて説明してください。
    ユーザーに親切で、分かりやすい回答を心がけてください。
```

#### OpenAI API キーの取得方法:

1. https://platform.openai.com/api-keys にアクセス
2. ログインまたはアカウント作成
3. 「Create new secret key」をクリック
4. キーをコピーして `config/config.yaml` に貼り付け

**⚠️ 重要**: API キーは絶対にGitにコミットしないでください！

---

### ステップ 5: 起動確認

#### Windows の場合:

**方法 A: クイックスタート（推奨）**
```powershell
.\quick-start.bat
```
→ 自動でブラウザが開きます

**方法 B: 標準起動**
```powershell
.\start.bat
```
→ http://localhost:3000 を手動で開く

#### Mac / Linux の場合:

```bash
npm run dev
```

→ ブラウザで http://localhost:3000 を開く

---

### ステップ 6: 動作確認

1. ブラウザで http://localhost:3000 が開く
2. モデルを選択（例: `gpt-realtime-2025-08-28`）
3. ボイスを選択（例: `shimmer`）
4. 「接続」ボタンをクリック
5. マイクの使用を許可
6. テキスト入力または音声で会話開始！

---

## 🔍 トラブルシューティング

### ❌ 「config.yaml が見つかりません」

→ `install.bat` を実行したか確認してください

```powershell
# 手動で作成する場合
copy config\config.yaml.example config\config.yaml
notepad config\config.yaml
```

---

### ❌ 「Node.js がインストールされていません」

→ https://nodejs.org/ からダウンロードしてインストール

必要なバージョン: **Node.js 18.x 以上**

---

### ❌ 「ポートが使用中です」

→ 他のアプリケーションが 3000 または 3001 番ポートを使用している可能性

```powershell
# ポートを使用中のプロセスを確認
netstat -ano | findstr :3000
netstat -ano | findstr :3001

# プロセスを終了する場合
taskkill /PID <プロセスID> /F
```

---

### ❌ 「接続エラー」が発生する

以下を確認してください：

1. ✅ `config/config.yaml` に正しい API キーが設定されているか
2. ✅ OpenAI API の利用制限や残高を確認（https://platform.openai.com/usage）
3. ✅ インターネット接続を確認
4. ✅ API キーに Realtime API へのアクセス権があるか

---

### ❌ マイクが動作しない

1. ✅ ブラウザでマイクの使用を許可しているか確認
2. ✅ HTTPS またはローカルホスト（localhost）でアクセスしているか確認
3. ✅ Chrome の設定 → プライバシーとセキュリティ → サイトの設定 → マイク

---

## 📚 参考ドキュメント

- **基本的な使い方**: `README.md`
- **クイックスタート**: `QUICK-START.md`
- **RAG機能の設定**: `RAG_SETUP.md`
- **詳細な使用方法**: `USAGE.md`

---

## ✅ チェックリスト（コピペ用）

セットアップ完了を確認するためのチェックリスト：

```
□ リポジトリをクローンした
□ install.bat を実行した（または npm install を実行）
□ config/config.yaml を作成した
□ OpenAI API キーを config/config.yaml に設定した
□ start.bat または npm run dev で起動した
□ ブラウザで http://localhost:3000 が開いた
□ モデルとボイスを選択できた
□ 「接続」ボタンが動作した
□ マイクの使用を許可した
□ テキストまたは音声で会話できた
```

すべてにチェックが入ったら、セットアップ完了です！🎉

---

**問題が解決しない場合**: GitHub の Issues で質問してください。

