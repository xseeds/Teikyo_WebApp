# WebChatBot Teikyo

OpenAI Realtime API を使用した**音声＋テキスト対応 ChatBot** Webアプリケーション

---

## 🚀 クイックスタート（4ステップで起動）

### 1️⃣ リポジトリをクローン

```bash
git clone <このリポジトリのURL>
cd Teikyo_WebApp
```

### 2️⃣ 環境をセットアップ

**`install.bat`** をダブルクリック

これで以下が自動実行されます：
- Node.js のバージョン確認
- 依存パッケージのインストール
- 設定ファイル（`config/config.yaml`）の自動作成
- メモ帳で設定ファイルが自動的に開く

### 3️⃣ APIキーを設定

メモ帳で開いた `config/config.yaml` の8行目を編集：

```yaml
# 変更前
openai_api_key: "sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"

# 変更後（あなたのAPIキーを貼り付け）
openai_api_key: "sk-proj-あなたの実際のAPIキーをここに"
```

> 💡 **APIキーの取得**: https://platform.openai.com/api-keys

保存して閉じる（`Ctrl + S` → `Alt + F4`）

### 4️⃣ アプリを起動

**`quick-start.bat`** をダブルクリック

→ ブラウザが自動的に開きます（http://localhost:3000）

---

## ✅ これで完了！

ブラウザで以下を操作：
1. **モデル**を選択（例: `gpt-4o-realtime-preview-2024-12-17`）
2. **ボイス**を選択（例: `shimmer`）
3. **「接続」**ボタンをクリック
4. マイクの使用を許可
5. 会話開始！🎉

---

## 📋 必要要件

- **Node.js**: 18.x 以上（[ダウンロード](https://nodejs.org/)）
- **ブラウザ**: 最新の Google Chrome / Edge（WebRTC 対応）
- **OpenAI API キー**: [取得はこちら](https://platform.openai.com/api-keys)

---

## 💡 主な機能

- ✅ **リアルタイム音声会話** - WebRTCで低遅延対話
- ✅ **テキスト入力対応** - キーボードからもメッセージ送信可能
- ✅ **モデル選択** - GPT Realtime / Mini を選択可能
- ✅ **8種類のボイス** - 好みの音声を選択
- ✅ **RAG機能** - Vector Store検索で引用・出典付き回答（Responses API使用）
- ✅ **セキュア** - APIキーはサーバー側のみで保持

---

## 🛠️ その他の起動方法

### 標準起動
```powershell
.\start.bat
```
→ 手動でブラウザを開く: http://localhost:3000

### 手動起動（コマンドライン）
```powershell
npm run dev
```

---

## 🔧 トラブルシューティング

### セットアップがうまくいかない場合

**検証スクリプトを実行**：
```powershell
.\verify-setup.bat
```
→ 何が問題か自動診断してくれます

### よくある問題

| 問題 | 解決方法 |
|-----|---------|
| **Node.jsがない** | https://nodejs.org/ からインストール |
| **config.yamlがない** | `install.bat` を実行 |
| **APIキーのエラー** | `config/config.yaml` を開いて実際のキーを設定 |
| **ポートが使用中** | `.\kill-server.bat` を実行してプロセスを終了 |

---

## 📚 詳細ドキュメント

- **[QUICK-START.md](QUICK-START.md)** - クイックスタートガイド
- **[SETUP_CHECKLIST.md](SETUP_CHECKLIST.md)** - 詳細なセットアップ手順
- **[SECURITY.md](SECURITY.md)** - セキュリティとAPIキー管理
- **[RAG_SETUP.md](RAG_SETUP.md)** - RAG機能の設定方法
- **[USAGE.md](USAGE.md)** - 詳しい使い方

---

## 🔒 セキュリティ

- ✅ APIキーは `config/config.yaml` に保存（Gitに含めない）
- ✅ サーバー側でのみAPIキーを使用
- ✅ `.gitignore` で機密情報を自動除外

⚠️ **重要**: APIキーは絶対にGitにコミットしないでください

---

## 📁 プロジェクト構成

```
Teikyo_WebApp/
├── config/
│   ├── config.yaml          # 実際の設定（Gitに含めない）
│   └── config.yaml.example  # 設定サンプル（Gitに含める）
├── server/
│   └── index.ts             # バックエンドサーバー
├── src/
│   ├── main.ts              # フロントエンド
│   └── realtime.ts          # WebRTC処理
├── public/
│   └── index.html           # UI
├── install.bat              # セットアップスクリプト
├── quick-start.bat          # 高速起動スクリプト
└── verify-setup.bat         # 検証スクリプト
```

---

## 🎓 使い方の詳細

### テキストで会話
- 下部の入力欄にメッセージを入力して「送信」または Enter

### 音声で会話
1. マイクボタン（🎤）をクリック
2. 話しかける
3. AIが音声で応答

### RAG機能を使う
1. [RAG_SETUP.md](RAG_SETUP.md) を参照してVector Storeを作成
2. `config.yaml` の `vector_store_id` に設定
3. UIでRAGトグルをON

---

## 🆘 サポート

問題が解決しない場合：
1. **[SETUP_CHECKLIST.md](SETUP_CHECKLIST.md)** の詳細手順を確認
2. **`verify-setup.bat`** で問題を診断
3. GitHub Issuesで質問

---

**開発**: 帝京大学  
**更新日**: 2025-10-13

---

## 🔗 参考リンク

- [OpenAI Realtime API Documentation](https://platform.openai.com/docs/guides/realtime)
- [WebRTC Integration Guide](https://platform.openai.com/docs/guides/realtime-webrtc)

---

## ⚡ まとめ

```powershell
# たったこれだけ！
git clone <URL>
cd Teikyo_WebApp
.\install.bat      # セットアップ（APIキーを設定）
.\quick-start.bat  # 起動
```

**これで完了です！簡単でしょ？** 🎉
