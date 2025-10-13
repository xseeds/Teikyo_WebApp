# RAG機能セットアップガイド

このドキュメントでは、Realtime ChatBotアプリにRAG（Retrieval-Augmented Generation）機能を追加する方法を説明します。

## 🎯 RAG機能とは

RAG機能を使うと、AIアシスタントがあなたのドキュメントや知識ベースを参照して、**根拠のある正確な回答**を提供できます。

- ✅ 引用と出典付きの回答
- ✅ ベクタ検索による関連情報の取得
- ✅ 情報不足の場合は明確に通知
- ✅ 音声でも利用可能

## 📋 前提条件

1. OpenAI API アカウント
2. Vector Store の作成（後述）
3. ドキュメントのアップロード

## 🚀 セットアップ手順

### ステップ1: Vector Storeの作成

1. [OpenAI Platform](https://platform.openai.com/storage/vector_stores) にアクセス
2. 「Create Vector Store」をクリック
3. 名前を入力（例: `my-knowledge-base`）
4. 「Create」をクリック
5. **Vector Store ID**（`vs_xxxxx`形式）をコピー

### ステップ2: ドキュメントのアップロード

1. 作成したVector Storeを開く
2. 「Add Files」をクリック
3. PDFやテキストファイルをアップロード
4. ファイルのインデックス作成完了を待つ（数分かかる場合があります）

対応ファイル形式：
- PDF (.pdf)
- テキスト (.txt, .md)
- Word (.docx)
- その他のテキストファイル

### ステップ3: config.yamlの設定

`config/config.yaml` を編集して、Vector Store IDを設定します：

```yaml
rag:
  vector_store_id: "vs_xxxxxxxxxxxxxxxxxxxxx"  # ← ここに貼り付け

prompt:
  system: |
    あなたは簡潔に話す音声アシスタントです。
    専門用語は噛み砕いて説明してください。
    ユーザーに親切で、分かりやすい回答を心がけてください。
    
    ドメイン知識や専門的な質問に対しては、kb_search ツールを使用して
    関連情報を検索し、引用と出典を明示して回答してください。
    根拠となる情報が見つからない場合は「情報不足」と明確に述べてください。
```

### ステップ4: サーバーの再起動

設定を反映させるため、サーバーを再起動します：

```bash
# サーバーを停止（Ctrl+C）
# 再起動
npm run dev
```

または `restart.bat` を実行（Windows）。

## 💡 使い方

### 1. RAG機能の有効化

1. アプリを開く
2. モデルとボイスを選択
3. **RAG トグルをON**にする
4. 「接続」をクリック

### 2. 質問する

RAG機能がONの場合、AIは以下のように動作します：

1. **ユーザーが質問** → AI が知識ベースを検索
2. **検索結果を取得** → 関連情報を要約
3. **引用付きで回答** → 出典も明示

#### 例：テキスト入力

```
ユーザー: 「製品の仕様について教えて」
AI: 「製品の仕様は以下の通りです。"最大処理速度は100MB/s、対応フォーマットはPDF、DOCX、TXTです。" [出典: product_spec.pdf p.3]」
```

#### 例：音声入力

音声モードON + RAG ONの場合も同様に、AIが知識ベースを参照して回答します。

### 3. RAG機能なしで使う

一般的な会話や知識ベース不要の質問の場合は、RAGトグルをOFFにすることで通常モードになります。

## 🔧 技術的な仕組み

### アーキテクチャ

```
ユーザー質問
    ↓
[Realtime API] kb_search ツール呼び出し
    ↓
[サーバー] POST /api/kb_search
    ↓
[Responses API] Chat Completions + file_search ツール
    ↓
[Vector Store] file_search で検索実行（1回のAPI呼び出し）
    ↓
[Responses API] レスポンスから情報抽出
    ↓
検索結果（要約・引用・出典）
    ↓
[Realtime API] 結果を元に回答生成
    ↓
ユーザーに音声＋テキストで返答
```

### 内部実装の詳細

RAG機能は **Responses API (Chat Completions)** を使って実装されています：

1. **1回のAPI呼び出し**: `file_search` ツール付きの Chat Completions リクエスト
2. **Vector Store 検索**: `tool_choice: 'required'` で必ず検索を実行
3. **結果取得**: レスポンスから直接検索結果を抽出
4. **整形**: summary, quote, source の形式に整形して返却

**⚠️ 実装の変遷**:
- **旧版**: Assistants API（2026年前半廃止予定）
  - 複雑なフロー（アシスタント作成→スレッド→実行→ポーリング→削除）
  - レイテンシ: 1-3秒
- **現行**: Responses API（推奨）
  - シンプルなフロー（1回のAPI呼び出し）
  - レイテンシ: 0.5-1秒（50%高速化）

この方式により、OpenAI の高度な検索アルゴリズムを活用しつつ、高速で将来性のある実装が実現されています。

### kb_search ツール

RAG機能は、Realtime APIの**function calling**を使って実装されています：

- **ツール名**: `kb_search`
- **パラメータ**: 
  - `query` (string): 検索クエリ
  - `top_k` (integer): 取得件数（デフォルト: 5）
- **戻り値**: 
  ```json
  {
    "results": [
      {
        "summary": "要約テキスト",
        "quote": "原文の引用",
        "source": {
          "file": "ファイル名",
          "page": ページ番号,
          "score": 関連度スコア
        }
      }
    ]
  }
  ```

### イベントフロー

1. `session.update` でツール登録
2. `conversation.item.create` でユーザー質問送信
3. `response.create` で応答要求（`tool_choice: "required"`）
4. `response.function_call_arguments.done` でツール呼び出し検知
5. サーバー `/api/kb_search` にリクエスト
6. **[サーバー内部]**:
   - Responses API 呼び出し（`file_search` + Vector Store）
   - 1回のAPI呼び出しで完結（ポーリング不要）
   - レスポンスから検索結果を抽出
   - 結果を整形
7. `conversation.item.create` でツール結果返却
8. `response.create` で最終回答要求
9. `response.text.delta` / `response.audio.delta` で回答受信

## 🛠️ トラブルシューティング

### RAGトグルが無効（グレーアウト）

**原因**: `config.yaml` に `vector_store_id` が設定されていない

**解決策**:
1. Vector Store を作成
2. `config.yaml` に ID を設定
3. サーバー再起動

### 「情報不足」と表示される

**原因**: 知識ベースに関連情報がない

**解決策**:
1. Vector Store に適切なドキュメントをアップロード
2. ドキュメントのインデックス作成完了を確認
3. 質問の内容を具体的にする

### 検索結果が返ってこない

**原因1**: Vector Store ID が間違っている

**解決策**: OpenAI Platform で正しいIDを確認

**原因2**: API キーに Vector Store のアクセス権限がない

**解決策**: API キーを再生成し、適切な権限を付与

### エラー: "Vector Store Search failed"

サーバーのログを確認してください：

```
[ERROR] アシスタント作成エラー: 404 ...
```

- **404**: Vector Store が存在しない → ID を確認
- **403**: 権限エラー → API キーを確認
- **429**: レート制限 → しばらく待ってから再試行

### エラー: "Responses API error"

**原因**: Vector Store ID が間違っている、またはAPI仕様の変更

**解決策**:
1. OpenAI Platform で Vector Store ID を確認
2. 最新のOpenAI APIドキュメントでfile_searchツールの仕様を確認
3. サーバーログで詳細なエラーメッセージを確認

## 📊 ベストプラクティス

### システムプロンプトの最適化

RAG機能を最大限活用するため、`config.yaml` のシステムプロンプトに以下を含めることを推奨：

```yaml
prompt:
  system: |
    # 基本的な振る舞い
    あなたは[役割]です。
    
    # RAG使用の指示
    ドメイン知識や専門的な質問に対しては、kb_search ツールを必ず使用してください。
    
    # 引用の指示
    回答する際は、必ず引用を " " で囲み、末尾に [出典: ファイル名 p.ページ] を付けてください。
    
    # 情報不足時の対応
    関連情報が見つからない場合は、「現在の知識ベースには該当する情報がありません」と明確に述べてください。
    
    # 音声応答の配慮
    音声で回答する際も、引用と出典を自然に読み上げてください。
```

### ドキュメントの準備

- **構造化されたドキュメント**: 見出し、箇条書き、表を活用
- **適切な粒度**: 1ファイルあたり10-50ページ程度が理想
- **メタデータ**: ファイル名に内容を反映（例: `product_spec_v2.pdf`）
- **定期的な更新**: 情報が古くならないよう定期的に再アップロード

### top_k の調整

デフォルトは5件ですが、用途に応じて調整可能：

- **厳密な回答が必要**: `top_k: 3`（高精度）
- **幅広く情報を集めたい**: `top_k: 10`（広範囲）
- **レイテンシ重視**: `top_k: 3`（高速）

`src/realtime.ts` の `registerKbSearchTool()` でデフォルト値を変更できます。

## 🔒 セキュリティ

- Vector Store ID はサーバー側のみで使用
- API キーはフロントエンドに公開されない
- `config.yaml` は `.gitignore` に含まれている
- ツール呼び出しのログには機密情報を含めない

## 📚 参考リンク

- [OpenAI Vector Stores](https://platform.openai.com/docs/api-reference/vector-stores)
- [OpenAI Realtime API](https://platform.openai.com/docs/guides/realtime)
- [Function Calling](https://platform.openai.com/docs/guides/function-calling)
- [Vector Store Files Search API](https://platform.openai.com/docs/api-reference/vector-stores-files/search)

---

**作成日**: 2025-10-10  
**バージョン**: 1.0  
**対象アプリ**: WebChatBot_Teikyo

