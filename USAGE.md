# 使用手順（初めての方向け）

## 1. プロジェクトのセットアップ

### ステップ 1: 依存パッケージのインストール

PowerShell または コマンドプロンプトでプロジェクトフォルダに移動して実行：

```powershell
npm install
```

### ステップ 2: OpenAI API キーの取得

1. https://platform.openai.com/ にアクセス
2. アカウントにログイン（なければ作成）
3. 左メニュー「API keys」をクリック
4. 「Create new secret key」で新しい API キーを作成
5. キーをコピー（`sk-proj-` で始まる長い文字列）

### ステップ 3: 設定ファイルの作成

```powershell
# config フォルダに移動
cd config

# サンプルをコピー
copy config.yaml.example config.yaml

# メモ帳で開く
notepad config.yaml
```

**config.yaml の編集例:**

```yaml
security:
  openai_api_key: "sk-proj-あなたのAPIキーをここに貼り付け"

rag:
  vector_store_id: ""  # 今は空でOK

prompt:
  system: |
    あなたは親切な音声アシスタントです。
    簡潔で分かりやすい回答を心がけてください。
```

保存して閉じます。

### ステップ 4: プロジェクトルートに戻る

```powershell
cd ..
```

## 2. アプリケーションの起動

```powershell
npm run dev
```

以下のようなメッセージが表示されれば成功：

```
[INFO] サーバーが起動しました: http://localhost:3001
[INFO] config.yaml を読み込みました

  VITE v5.0.11  ready in XXX ms

  ➜  Local:   http://localhost:3000/
```

## 3. ブラウザでアクセス

1. Chrome または Edge で http://localhost:3000 を開く
2. マイクの使用を許可するかポップアップが出たら「許可」をクリック

## 4. チャットボットの使い方

### 基本操作

1. **モデルを選択**: 上部のドロップダウンから選択
   - **推奨**: `gpt-realtime-2025-08-28` (最新・高性能)
   - **コスト重視**: `gpt-realtime-mini-2025-10-06` (最新・軽量)
2. **ボイスを選択**: お好みの音声を選択（例: shimmer）
3. **「接続」ボタン**をクリック
4. ステータスが「接続中」になったら準備完了！

### テキストで会話

- 下部の入力欄にメッセージを入力
- 「送信」ボタンをクリック、または Enter キーを押す
- アシスタントが音声とテキストで返答します

### 音声で会話

- マイクボタン（🎤）を押すと話しかけることができます
- 普通に話しかけるだけで、アシスタントが自動で認識して返答します

### 応答を止めたい時

- 「停止」ボタンをクリック、または Esc キーを押す

## 5. RAG 機能について

⚠️ **重要なお知らせ**

OpenAI Realtime API は現時点で RAG（Retrieval-Augmented Generation / Vector Store）機能をサポートしていません。

### 現在の状況

- **サポート対象外**: `file_search` ツール（Vector Store）
- **サポート済み**: `function` ツール、`mcp` ツール
- **将来対応**: RAG機能は将来的にサポートされる予定です

### 代替手段

独自の文書を参照した回答が必要な場合は、以下の API をご利用ください：

1. **Chat Completions API** - Vector Store と file_search をサポート
2. **Assistants API** - 高度なRAG機能を提供

詳細: https://platform.openai.com/docs/

## 6. トラブルシューティング

### 🔧 問題診断ツール

接続に問題がある場合は、まずテストページで診断してください：

```
http://localhost:3000/public/test.html
```

このページで自動的に以下を確認できます：
- サーバー接続状態
- API エンドポイントの動作
- 設定ファイルの読み込み状態

---

### モデルとボイスが表示されない

→ ページを再読み込み（F5 キー）してください  
→ ブラウザのキャッシュをクリアしてください

### エラー: 「config.yaml が見つかりません」

→ `config/config.yaml` が正しく作成されているか確認してください

### エラー: 「OpenAI API error」

→ API キーが正しいか、OpenAI アカウントに残高があるか確認してください  
→ https://platform.openai.com/usage で残高を確認

### マイクが動作しない

→ ブラウザの設定でマイクの使用を許可してください  
→ Chrome の場合: 設定 → プライバシーとセキュリティ → サイトの設定 → マイク

### 音声が聞こえない

→ PC のスピーカー/ヘッドホンの音量を確認してください  
→ ブラウザのタブがミュートになっていないか確認してください

## 7. アプリケーションの終了

PowerShell で `Ctrl + C` を押して終了します。

---

## さらに詳しい情報

- **詳細な技術情報**: `README.md` をご覧ください
- **モデルとボイスの選び方**: `MODELS.md` をご覧ください
- **接続テストページ**: http://localhost:3000/public/test.html
- **クイックスタート**: `QUICK-START.md` をご覧ください

