/**
 * 簡易ユニットテスト
 * YAML ロードと API リクエストボディの組み立てをテスト
 */

import { describe, it, expect } from 'vitest';
import { load as yamlLoad } from 'js-yaml';

/**
 * YAML パーステスト
 */
describe('YAML Configuration', () => {
  it('正常な YAML をパースできる', () => {
    const yamlContent = `
security:
  openai_api_key: "sk-test-key"
rag:
  vector_store_id: "vs_test"
prompt:
  system: |
    テストプロンプト
`;
    
    const config: any = yamlLoad(yamlContent);
    
    expect(config.security.openai_api_key).toBe('sk-test-key');
    expect(config.rag.vector_store_id).toBe('vs_test');
    expect(config.prompt.system).toContain('テストプロンプト');
  });

  it('必須フィールドの検証', () => {
    const yamlContent = `
security:
  openai_api_key: ""
prompt:
  system: ""
`;
    
    const config: any = yamlLoad(yamlContent);
    
    expect(config.security).toBeDefined();
    expect(config.prompt).toBeDefined();
  });
});

/**
 * API リクエストボディ組み立てテスト
 */
describe('API Request Body Builder', () => {
  /**
   * セッション作成リクエストボディを組み立てる
   */
  function buildSessionRequestBody(
    model: string,
    voice: string,
    instructions: string,
    useRag: boolean,
    vectorStoreId?: string
  ) {
    const body: any = {
      model,
      voice,
      instructions
    };

    if (useRag && vectorStoreId) {
      body.tools = [{ type: 'file_search' }];
      body.tool_choice = 'auto';
    }

    return body;
  }

  it('RAG なしのリクエストボディ', () => {
    const body = buildSessionRequestBody(
      'gpt-4o-realtime-preview-2024-12-17',
      'shimmer',
      'テストプロンプト',
      false
    );

    expect(body.model).toBe('gpt-4o-realtime-preview-2024-12-17');
    expect(body.voice).toBe('shimmer');
    expect(body.instructions).toBe('テストプロンプト');
    expect(body.tools).toBeUndefined();
    expect(body.tool_choice).toBeUndefined();
  });

  it('RAG ありのリクエストボディ', () => {
    const body = buildSessionRequestBody(
      'gpt-4o-realtime-preview-2024-12-17',
      'alloy',
      'RAG テスト',
      true,
      'vs_test123'
    );

    expect(body.model).toBe('gpt-4o-realtime-preview-2024-12-17');
    expect(body.voice).toBe('alloy');
    expect(body.instructions).toBe('RAG テスト');
    expect(body.tools).toEqual([{ type: 'file_search' }]);
    expect(body.tool_choice).toBe('auto');
  });

  it('RAG フラグが true でも vector_store_id がない場合', () => {
    const body = buildSessionRequestBody(
      'gpt-4o-realtime-preview-2024-12-17',
      'echo',
      'テスト',
      true,
      undefined
    );

    expect(body.tools).toBeUndefined();
    expect(body.tool_choice).toBeUndefined();
  });
});

/**
 * DataChannel イベント構築テスト
 */
describe('DataChannel Event Builder', () => {
  /**
   * conversation.item.create イベントを構築
   */
  function buildConversationItemEvent(text: string) {
    return {
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'user',
        content: [
          {
            type: 'input_text',
            text: text
          }
        ]
      }
    };
  }

  /**
   * response.create イベントを構築
   */
  function buildResponseCreateEvent() {
    return {
      type: 'response.create',
      response: {
        modalities: ['text', 'audio']
      }
    };
  }

  /**
   * response.cancel イベントを構築
   */
  function buildResponseCancelEvent() {
    return {
      type: 'response.cancel'
    };
  }

  it('会話アイテム作成イベント', () => {
    const event = buildConversationItemEvent('こんにちは');

    expect(event.type).toBe('conversation.item.create');
    expect(event.item.role).toBe('user');
    expect(event.item.content[0].type).toBe('input_text');
    expect(event.item.content[0].text).toBe('こんにちは');
  });

  it('応答作成イベント', () => {
    const event = buildResponseCreateEvent();

    expect(event.type).toBe('response.create');
    expect(event.response.modalities).toEqual(['text', 'audio']);
  });

  it('応答キャンセルイベント', () => {
    const event = buildResponseCancelEvent();

    expect(event.type).toBe('response.cancel');
  });

  it('JSON シリアライズ可能', () => {
    const event = buildConversationItemEvent('テスト');
    const json = JSON.stringify(event);
    const parsed = JSON.parse(json);

    expect(parsed.type).toBe('conversation.item.create');
    expect(parsed.item.content[0].text).toBe('テスト');
  });
});

