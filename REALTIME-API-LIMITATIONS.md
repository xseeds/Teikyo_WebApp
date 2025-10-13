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

## 🔄 RAG機能が必要な場合の代替案

### オプション 1: Chat Completions API を使用

```javascript
// Chat Completions API は file_search をサポート
const response = await fetch('https://api.openai.com/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: 'gpt-4o',
    messages: [
      { role: 'user', content: 'あなたの質問' }
    ],
    tools: [{ type: 'file_search' }],
    tool_choice: 'auto'
  })
});
```

### オプション 2: Assistants API を使用

```javascript
// Assistants API は Vector Store を完全サポート
const assistant = await openai.beta.assistants.create({
  model: 'gpt-4o',
  tools: [{ type: 'file_search' }]
});

const thread = await openai.beta.threads.create({
  messages: [
    {
      role: 'user',
      content: 'あなたの質問',
      attachments: [
        { vector_store_id: 'vs_xxx' }
      ]
    }
  ]
});
```

### オプション 3: ハイブリッドアプローチ

1. テキストベースの質問 → Chat Completions API（RAG使用）
2. 音声での会話 → Realtime API
3. 必要に応じて切り替え

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

**最終更新**: 2025-10-10  
**ステータス**: RAG機能は未サポート（将来対応予定）

