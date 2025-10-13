# WebChatBot Teikyo

OpenAI Realtime API を使用した音声＋テキスト対応 ChatBot Webアプリケーション

## 特徴

- ✅ **音声会話**: WebRTC で低遅延のリアルタイム音声対話
- ✅ **テキスト入力**: キーボードからもメッセージ送信可能
- ✅ **モデル選択**: UI から GPT Realtime / Mini を選択（最新2025年版対応）
- ✅ **ボイス選択**: 8種類の音声から選択可能
- ✅ **RAG 機能**: Function calling + Vector Store Search で引用・出典付き回答
- ✅ **音声モード切替**: マイク入力とAI音声出力を個別にON/OFF可能
- ✅ **セキュア**: API キーはサーバー側のみで保持、フロントに露出しない

## 必要要件

- **Node.js**: 18.x 以上
- **ブラウザ**: 最新の Google Chrome / Edge（WebRTC 対応）
- **OpenAI API キー**: https://platform.openai.com/api-keys

## セットアップ手順

### ⚠️ 初めてこのプロジェクトをクローンした方へ

**このプロジェクトをGitHubからクローンした場合、以下の手順が必須です：**

1. ✅ `install.bat` を実行してセットアップを完了させる
2. ✅ `config/config.yaml` に **あなた自身の** OpenAI API キーを設定する
3. ✅ `start.bat` または `quick-start.bat` で起動する

> **重要**: `config/config.yaml` はセキュリティのためGitに含まれていません。
> 必ず上記の手順でセットアップを完了させてください。

---

### 🚀 簡単セットアップ（推奨）

**Windows ユーザー向け**: ダブルクリックで自動セットアップ！

```powershell
# install.bat をダブルクリック
# または PowerShell で実行
.\install.bat
```

このスクリプトが以下を自動で行います：
- Node.js のバージョン確認
- 依存パッケージのインストール
- 設定ファイルの作成（config.yaml）
- メモ帳で config.yaml を自動的に開く（APIキー設定用）

---

### 手動セットアップ

#### 1. 依存パッケージのインストール

```bash
npm install
```

### 2. 設定ファイルの作成

```bash
# サンプルファイルをコピー
cp config/config.yaml.example config/config.yaml

# エディタで開いて API キーを設定
notepad config/config.yaml  # Windows
# または
nano config/config.yaml     # Mac/Linux
```

**config/config.yaml の例:**

```yaml
security:
  openai_api_key: "sk-proj-あなたのAPIキーをここに入力"

rag:
  vector_store_id: ""  # RAG を使う場合は Vector Store ID を入力

prompt:
  system: |
    あなたは親切な音声アシスタントです。
    簡潔で分かりやすい回答を心がけてください。
```

### 3. 開発サーバーの起動

#### 🚀 簡単起動（推奨）

**方法 1: バッチファイル（Windows）**

```powershell
# start.bat をダブルクリック
# または PowerShell で実行
.\start.bat
```

**方法 2: PowerShell スクリプト（自動ブラウザ起動）**

```powershell
# start.ps1 をダブルクリック
# または PowerShell で実行
.\start.ps1
```

**方法 3: クイックスタート（最速）**

```powershell
# quick-start.bat をダブルクリック
# ブラウザが自動で開きます
.\quick-start.bat
```

#### 手動起動

```bash
npm run dev
```

以下のように起動します：
- フロントエンド: http://localhost:3000
- バックエンド API: http://localhost:3001

### 4. ブラウザでアクセス

http://localhost:3000 を開いて以下の手順で利用：

1. **モデルを選択**（例: **gpt-realtime-2025-08-28** - 最新モデル推奨）
2. **ボイスを選択**（例: shimmer - 軽快で明るい声）
3. **（オプション）RAG をON**（Vector Store IDを設定している場合）
4. **「接続」ボタン**をクリック
5. マイクの使用を許可
6. テキスト入力またはマイクボタンで会話開始！

> 💡 **ヒント**: 初めての方は `gpt-realtime-mini-2025-10-06` がコストを抑えられるのでおすすめです。

> 📚 **RAG機能**: 知識ベースを参照した回答が必要な場合は、[RAG_SETUP.md](RAG_SETUP.md) を参照してVector Storeを設定してください。

#### 🔧 接続テストページ

もし接続に問題がある場合は、テストページで診断できます：  
http://localhost:3000/public/test.html

このページでは以下を確認できます：
- サーバー接続状態
- API エンドポイントの動作
- 設定ファイルの読み込み状態

## 使い方

### テキストで会話

- 下部の入力欄にメッセージを入力して「送信」または Enter キー
- アシスタントの返答がテキストで表示されます（音声モードOFFの場合）

### 音声で会話

1. **音声モードをON**: マイクボタン（🎤）をクリック
2. **話しかける**: マイクが有効になり、AIが音声で応答します
3. **音声モードをOFF**: 再度マイクボタンをクリック

> 💡 **ヒント**: 音声モードOFFでもテキスト入力は可能です。用途に応じて使い分けてください。

### RAG（知識ベース検索）を使う

1. **Vector Store を作成**: [RAG_SETUP.md](RAG_SETUP.md) の手順に従う
2. **config.yaml に設定**: `rag.vector_store_id` に ID を設定
3. **RAG トグルをON**: UI でトグルを有効化
4. **質問する**: AI が知識ベースを検索して、引用と出典付きで回答

**例**:
```
ユーザー: 「製品の仕様は？」
AI: 「製品の仕様は以下です。"最大処理速度100MB/s" [出典: spec.pdf p.3]」
```

## プロジェクト構成

```
WebChatBot_Teikyo/
├── config/
│   ├── config.yaml          # 実際の設定（.gitignore に含む）
│   └── config.yaml.example  # 設定ファイルのサンプル
├── server/
│   └── index.ts             # Express サーバー + RAG エンドポイント
├── src/
│   ├── main.ts              # フロントエンド メイン
│   └── realtime.ts          # WebRTC クライアント + ツール処理
├── public/
│   └── index.html           # UI
├── tests/
│   └── config.test.ts       # ユニットテスト
├── package.json
├── tsconfig.json
├── vite.config.ts
├── README.md
└── RAG_SETUP.md             # RAG機能セットアップガイド
```

## API エンドポイント

### GET /api/config

UI 初期化用の設定を取得

**レスポンス:**
```json
{
  "models": ["gpt-4o-realtime-preview-2024-12-17", "..."],
  "voices": ["alloy", "ash", "ballad", "..."],
  "ragEnabled": true,
  "systemPreview": "あなたは親切な音声アシスタントです..."
}
```

### POST /api/session

WebRTC 接続用の client_secret を取得

**リクエスト:**
```json
{
  "model": "gpt-4o-realtime-preview-2024-12-17",
  "voice": "shimmer",
  "useRag": true
}
```

**レスポンス:**
```json
{
  "client_secret": {
    "value": "cs_xxxxx",
    "expires_at": 1234567890
  },
  "model": "gpt-4o-realtime-preview-2024-12-17",
  "voice": "shimmer",
  "useRag": true
}
```

### POST /api/kb_search

Vector Store を検索して関連情報を取得（RAG機能）

**リクエスト:**
```json
{
  "query": "製品の仕様について",
  "top_k": 5
}
```

**レスポンス:**
```json
{
  "results": [
    {
      "summary": "製品の基本仕様について説明します。",
      "quote": "最大処理速度は100MB/sです。",
      "source": {
        "file": "product_spec.pdf",
        "page": 3,
        "url": null,
        "score": 0.87
      }
    }
  ]
}
```

## テスト実行

```bash
npm test
```

## 本番ビルド

```bash
npm run build
npm start
```

## トラブルシューティング

### 🔍 まず最初に試すこと

**テストページで診断**: http://localhost:3000/public/test.html  
このページで問題を自動診断できます。

### モデルとボイスが選択肢に表示されない

- ページを再読み込み（F5 または Ctrl+R）
- ブラウザのキャッシュをクリア
- 開発者ツール（F12）のコンソールでエラーを確認
- サーバーが起動しているか確認

### マイクが動作しない

- ブラウザでマイクの使用を許可しているか確認
- HTTPS またはローカルホスト（localhost）でアクセスしているか確認
- Chrome の設定 → プライバシーとセキュリティ → サイトの設定 → マイク

### 接続エラー

- `config/config.yaml` に正しい API キーが設定されているか確認
- OpenAI API の利用制限や残高を確認（https://platform.openai.com/usage）
- ネットワーク接続を確認
- API キーに Realtime API へのアクセス権があるか確認

### RAG 機能について

⚠️ **重要**: OpenAI Realtime API は現時点で RAG（Vector Store / file_search）機能をサポートしていません。

- サポートされているツール: `function`, `mcp`
- `file_search` ツールは現在利用不可
- 将来的にサポートされる予定です

RAG機能が必要な場合は、Chat Completions API または Assistants API をご利用ください。

### サーバーが起動しない

- Node.js がインストールされているか確認（`node --version`）
- `npm install` を実行したか確認
- ポート 3000 と 3001 が他のアプリで使用されていないか確認

## セキュリティ

### 🔒 API キーの管理

- ✅ API キーは `config/config.yaml` に保存（Git に含めない）
- ✅ サーバー側でのみ API キーを使用
- ✅ client_secret はセッションごとに一時的に発行
- ✅ CORS は localhost のみ許可

### ⚠️ 重要な注意事項

1. **絶対に API キーをGitにコミットしないでください**
   - `config/config.yaml` は `.gitignore` に含まれています
   - 誤ってコミットした場合は、すぐに OpenAI でキーを無効化してください

2. **API キーが漏洩した場合の対処**
   - https://platform.openai.com/api-keys にアクセス
   - 漏洩したキーを無効化（Revoke）
   - 新しいキーを生成して `config/config.yaml` に設定

3. **GitHub にプッシュする前の確認**
   ```bash
   # config.yaml がコミット対象に含まれていないことを確認
   git status
   
   # .gitignore が正しく機能しているか確認
   git check-ignore config/config.yaml
   # 出力: config/config.yaml （正常）
   ```

## 📚 ドキュメント

### 📖 プロジェクト関連

- **[SETUP_CHECKLIST.md](SETUP_CHECKLIST.md)** - 初回セットアップの詳細手順とチェックリスト
- **[SECURITY.md](SECURITY.md)** - API キーの安全な管理方法
- **[QUICK-START.md](QUICK-START.md)** - 1分で起動する方法
- **[USAGE.md](USAGE.md)** - 詳細な使用方法
- **[RAG_SETUP.md](RAG_SETUP.md)** - RAG機能のセットアップ
- **verify-setup.bat** - セットアップ検証スクリプト（実行して確認）

### 🔗 外部リンク

- [OpenAI Realtime API Documentation](https://platform.openai.com/docs/guides/realtime)
- [WebRTC Integration Guide](https://platform.openai.com/docs/guides/realtime-webrtc)
- [Realtime API Reference](https://platform.openai.com/docs/api-reference/realtime)

## ライセンス

MIT License

---

**開発**: Teikyo University  
**更新日**: 2025-10-10

