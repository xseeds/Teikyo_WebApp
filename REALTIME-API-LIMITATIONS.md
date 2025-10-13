# OpenAI Realtime API - 制限事項と注意点

## ⚠️ 現在の制限事項

### 1. RAG機能（Vector Store）は未サポート

OpenAI Realtime API は現時点で以下の機能をサポートしていません：

- ❌ `file_search` ツール
- ❌ Vector Store との統合
- ❌ RAG（Retrieval-Augmented Generation）

**エラー例:**
```json
{
  "error": {
    "message": "Invalid value: 'file_search'. Supported values are: 'function' and 'mcp'.",
    "type": "invalid_request_error",
    "param": "tools[0].type",
    "code": "invalid_value"
  }
}
```

### 2. サポートされているツール

現在、Realtime API でサポートされているツールタイプ：

- ✅ `function` - カスタム関数の呼び出し
- ✅ `mcp` - Model Context Protocol

### 3. 将来の対応予定

OpenAI は将来的に以下の機能を追加する可能性があります：

- 📅 Vector Store / file_search のサポート
- 📅 より高度な RAG 機能
- 📅 追加のツールタイプ

---

## 🔄 RAG機能の実装方法

### ✅ このアプリの実装（推奨）: ハイブリッドアプローチ

このアプリでは、Realtime APIとResponses APIを組み合わせてRAG機能を実現しています：

1. **Realtime API**: `function` タイプのカスタムツール (`kb_search`) を登録
2. **Responses API**: サーバー側で `file_search` ツールを使ってVector Storeを検索
3. **結果の統合**: Realtime APIに検索結果を返して音声＋テキストで回答

```javascript
// クライアント側: Realtime APIにカスタムツール登録
session.update({
  tools: [{
    type: 'function',
    name: 'kb_search',
    description: 'ベクタ検索を実行',
    parameters: { query: 'string' }
  }]
});

// サーバー側: Responses API でVector Store検索
const response = await fetch('https://api.openai.com/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: query }],
    tools: [{ type: 'file_search' }],
    tool_choice: 'required',
    store: vectorStoreId
  })
});
```

### ⚠️ 非推奨: Assistants API（2026年廃止予定）

従来はAssistants APIを使用していましたが、2026年前半に廃止予定のため、Responses APIへ移行済みです。

詳細は [RAG_SETUP.md](RAG_SETUP.md) をご覧ください。

---

## 📚 参考リンク

- [OpenAI Realtime API Docs](https://platform.openai.com/docs/guides/realtime)
- [Chat Completions API](https://platform.openai.com/docs/guides/chat-completions)
- [Assistants API](https://platform.openai.com/docs/assistants)
- [Vector Stores](https://platform.openai.com/docs/assistants/tools/file-search)

---

## 🔔 最新情報の確認

Realtime API の最新情報は以下で確認できます：

- OpenAI 公式ドキュメント: https://platform.openai.com/docs/
- OpenAI Community Forum: https://community.openai.com/
- OpenAI Changelog: https://platform.openai.com/docs/changelog

---

**最終更新**: 2025-10-13  
**ステータス**: RAG機能は未サポート（ハイブリッドアプローチで実装済み）

