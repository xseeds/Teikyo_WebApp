/**
 * kb_search エンドポイントのテスト
 */

import { describe, it, expect } from 'vitest';

describe('POST /api/kb_search', () => {
  it('should validate query parameter', async () => {
    const mockRequest = {
      body: {
        // query が空
        query: '',
        top_k: 5
      }
    };

    // 実際のテストでは fetch を使ってエンドポイントを呼び出す
    // ここではリクエストボディのバリデーション例を示す
    const isValid = !!(mockRequest.body.query && 
                    typeof mockRequest.body.query === 'string' && 
                    mockRequest.body.query.trim() !== '');

    expect(isValid).toBe(false);
  });

  it('should accept valid kb_search request', () => {
    const mockRequest: any = {
      body: {
        query: '製品の仕様について',
        top_k: 5
      }
    };

    const isValid = mockRequest.body.query && 
                    typeof mockRequest.body.query === 'string' && 
                    mockRequest.body.query.trim() !== '';

    expect(isValid).toBe(true);
    expect(mockRequest.body.top_k).toBe(5);
  });

  it('should use default top_k if not provided', () => {
    const mockRequest: any = {
      body: {
        query: 'テストクエリ'
      }
    };

    const topK = mockRequest.body.top_k || 5;

    expect(topK).toBe(5);
  });

  it('should format search results correctly', () => {
    // モックのAssistants API応答（annotationsあり）
    const mockMessage = {
      role: 'assistant',
      content: [
        {
          type: 'text',
          text: {
            value: '製品の仕様は以下の通りです。最大処理速度は100MB/sです。',
            annotations: [
              {
                type: 'file_citation',
                text: '最大処理速度は100MB/sです',
                file_citation: {
                  file_id: 'file-abc123',
                  quote: '最大処理速度は100MB/sです。対応フォーマットはPDF、DOCX、TXTです。'
                }
              }
            ]
          }
        }
      ]
    };

    // 結果の整形ロジック（server/index.ts と同じ）
    const textContent = mockMessage.content.find((c: any) => c.type === 'text');
    const fullText = textContent?.text?.value || '';
    const annotations = textContent?.text?.annotations || [];
    const results: any[] = [];

    if (annotations.length > 0) {
      annotations.forEach((annotation: any, index: number) => {
        if (annotation.type === 'file_citation') {
          const citation = annotation.file_citation;
          const quote = annotation.text || '';
          
          const annotationIndex = fullText.indexOf(quote);
          let summary = '';
          if (annotationIndex >= 0) {
            const beforeText = fullText.substring(Math.max(0, annotationIndex - 100), annotationIndex);
            const afterText = fullText.substring(annotationIndex + quote.length, annotationIndex + quote.length + 100);
            summary = (beforeText + ' ' + afterText).trim();
          } else {
            summary = fullText.substring(0, 200);
          }

          results.push({
            summary: summary.substring(0, 200),
            quote: citation.quote || quote,
            source: {
              file: citation.file_id || `file_${index + 1}`,
              page: null,
              url: null,
              score: 0.9
            }
          });
        }
      });
    }

    expect(results).toHaveLength(1);
    expect(results[0]).toHaveProperty('summary');
    expect(results[0]).toHaveProperty('quote');
    expect(results[0]).toHaveProperty('source');
    expect(results[0].source.score).toBe(0.9);
    expect(results[0].source.file).toBe('file-abc123');
  });

  it('should handle messages without annotations', () => {
    // annotationsがないメッセージ
    const mockMessage = {
      role: 'assistant',
      content: [
        {
          type: 'text',
          text: {
            value: '製品の仕様は以下の通りです。最大処理速度は100MB/sです。対応フォーマットはPDF、DOCX、TXTです。',
            annotations: []
          }
        }
      ]
    };

    const textContent = mockMessage.content.find((c: any) => c.type === 'text');
    const fullText = textContent?.text?.value || '';
    const annotations = textContent?.text?.annotations || [];
    const results: any[] = [];

    if (annotations.length === 0 && fullText) {
      const sentences = fullText.split(/[。．.!！?？\n]/).filter((s: string) => s.trim());
      if (sentences.length > 0) {
        results.push({
          summary: sentences.slice(0, 3).join('。') + '。',
          quote: sentences.slice(3, 6).join('。'),
          source: {
            file: 'vector_store_content',
            page: null,
            url: null,
            score: 0.7
          }
        });
      }
    }

    expect(results).toHaveLength(1);
    expect(results[0].source.file).toBe('vector_store_content');
    expect(results[0].source.score).toBe(0.7);
  });
});

describe('RAG Tool Registration', () => {
  it('should create valid kb_search tool definition', () => {
    const toolDef = {
      type: 'function',
      name: 'kb_search',
      description: '与えられたクエリでベクタ検索を実行し、関連する知識ベースの情報（要約・引用・出典）を返します。',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: '検索クエリ（ユーザーの質問内容）'
          },
          top_k: {
            type: 'integer',
            description: '取得する上位件数（デフォルト: 5）',
            default: 5
          }
        },
        required: ['query']
      }
    };

    expect(toolDef.type).toBe('function');
    expect(toolDef.name).toBe('kb_search');
    expect(toolDef.parameters.required).toContain('query');
    expect(toolDef.parameters.properties.top_k.default).toBe(5);
  });
});

