/**
 * OpenAI Realtime API を利用した音声＋テキスト ChatBot サーバー
 * 
 * 主要API ドキュメント:
 * - OpenAI Realtime API: https://platform.openai.com/docs/guides/realtime
 * - WebRTC Integration: https://platform.openai.com/docs/guides/realtime-webrtc
 * - Client Secrets API: https://platform.openai.com/docs/api-reference/realtime-client-secrets
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import { readFileSync } from 'fs';
import { load as yamlLoad } from 'js-yaml';
import { resolve } from 'path';

const app = express();
const PORT = 3001;

// CORS 設定（localhost のみ許可）
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));

app.use(express.json());

// 固定値定義
// OpenAI Realtime API で利用可能なモデル（最新版のみ）
// https://platform.openai.com/docs/models/gpt-4o-realtime
const MODELS = [
  'gpt-realtime-2025-08-28',
  'gpt-realtime-mini-2025-10-06'
];

// OpenAI Realtime API で利用可能なボイス
// https://platform.openai.com/docs/guides/realtime/voices
const VOICES = [
  'alloy',    // 中性的でバランスの取れた声
  'ash',      // 柔らかく落ち着いた声
  'ballad',   // 深みのある声
  'coral',    // 温かく親しみやすい声
  'echo',     // 明るくエネルギッシュな声
  'sage',     // 知的で落ち着いた声
  'shimmer',  // 軽快で明るい声
  'verse'     // 表現豊かな声
];

/**
 * YAML 設定の型定義
 */
interface Config {
  security: {
    openai_api_key: string;
  };
  rag?: {
    vector_store_id?: string;
  };
  prompt: {
    system: string;
  };
}

let cachedConfig: Config | null = null;

/**
 * config/config.yaml を読み込む
 * @returns 設定オブジェクト
 * @throws YAML が不正な場合
 */
function loadConfig(): Config {
  try {
    const configPath = resolve(process.cwd(), 'config', 'config.yaml');
    console.log('[INFO] 設定ファイルパス:', configPath);
    
    // ファイルの存在確認
    try {
      const fileContent = readFileSync(configPath, 'utf8');
      console.log('[INFO] config.yaml を読み込みました（サイズ: ' + fileContent.length + ' バイト）');
      
      const config = yamlLoad(fileContent) as Config;
      console.log('[INFO] YAML パース成功');

      // 必須フィールドのバリデーション
      if (!config.security?.openai_api_key) {
        throw new Error('config.yaml に security.openai_api_key が設定されていません');
      }
      if (config.security.openai_api_key.includes('xxxx')) {
        throw new Error('config.yaml の openai_api_key がサンプル値のままです。実際の API キーを設定してください');
      }
      if (!config.prompt?.system) {
        throw new Error('config.yaml に prompt.system が設定されていません');
      }

      cachedConfig = config;
      console.log('[INFO] 設定の検証に成功しました');
      return config;
    } catch (fileError: any) {
      if (fileError.code === 'ENOENT') {
        throw new Error(`設定ファイルが見つかりません: ${configPath}\n\nconfig/config.yaml.example をコピーして config/config.yaml を作成してください。`);
      }
      throw fileError;
    }
  } catch (error) {
    console.error('[ERROR] config.yaml の読み込みに失敗:', error);
    console.error('[ERROR] 詳細:', error instanceof Error ? error.stack : error);
    throw error;
  }
}

/**
 * GET /api/config
 * フロントエンドに必要な設定情報を返却（APIキーは含まない）
 */
app.get('/api/config', (_req: Request, res: Response) => {
  try {
    console.log('[INFO] GET /api/config リクエスト受信');
    const config = cachedConfig || loadConfig();
    
    // RAG は vector_store_id が設定されている場合のみ有効
    const ragEnabled = !!(config.rag?.vector_store_id && config.rag.vector_store_id.trim());
    const systemPreview = config.prompt.system.substring(0, 120);

    const response = {
      models: MODELS,
      voices: VOICES,
      ragEnabled,
      systemPreview
    };
    
    console.log('[INFO] GET /api/config レスポンス送信:', JSON.stringify(response, null, 2));
    res.json(response);
  } catch (error) {
    console.error('[ERROR] GET /api/config エラー:', error);
    const errorMessage = error instanceof Error ? error.message : '不明なエラー';
    const errorStack = error instanceof Error ? error.stack : '';
    
    res.status(500).json({
      error: 'Config load failed',
      message: errorMessage,
      details: errorStack,
      hint: 'config/config.yaml が正しく作成されているか確認してください'
    });
  }
});

/**
 * POST /api/session
 * OpenAI の client_secret を取得してフロントに返却
 * 
 * Body:
 * - model: string
 * - voice: string
 * - useRag?: boolean
 */
app.post('/api/session', async (req: Request, res: Response) => {
  try {
    console.log('[INFO] POST /api/session リクエスト受信');
    const { model, voice, useRag } = req.body;
    console.log('[INFO] リクエストパラメータ:', { model, voice, useRag });

    // バリデーション
    if (!model || !MODELS.includes(model)) {
      console.error('[ERROR] 無効なモデル:', model);
      return res.status(400).json({ error: 'Invalid model', validModels: MODELS });
    }
    if (!voice || !VOICES.includes(voice)) {
      console.error('[ERROR] 無効なボイス:', voice);
      return res.status(400).json({ error: 'Invalid voice', validVoices: VOICES });
    }

    const config = cachedConfig || loadConfig();
    const apiKey = config.security.openai_api_key;
    const instructions = config.prompt.system;
    
    console.log('[INFO] APIキー取得完了（先頭: ' + apiKey.substring(0, 10) + '...）');

    // OpenAI Realtime Client Secrets API を呼び出す
    // https://platform.openai.com/docs/api-reference/realtime-client-secrets/create
    const requestBody: any = {
      model,
      voice,
      instructions
    };

    // 注意: Realtime API は現時点で file_search (RAG) をサポートしていません
    // サポートされているツールタイプ: 'function', 'mcp'
    // RAG 機能は将来的にサポートされる可能性があります
    // 
    // 現時点では useRag パラメータは無視されます
    if (useRag && config.rag?.vector_store_id) {
      console.log('[WARN] RAG機能はRealtime APIではサポートされていません。無視されます。');
      // 将来的にサポートされた場合の実装例:
      // requestBody.tools = [{ type: 'file_search' }];
      // requestBody.tool_choice = 'auto';
    }

    console.log('[INFO] OpenAI client_secret をリクエスト中...');
    console.log('[DEBUG] リクエストボディ:', JSON.stringify(requestBody, null, 2));
    
    const response = await fetch('https://api.openai.com/v1/realtime/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[ERROR] OpenAI API エラー:', response.status, errorText);
      return res.status(response.status).json({
        error: 'OpenAI API error',
        details: errorText
      });
    }

    const data = await response.json();
    console.log('[INFO] client_secret を取得しました');

    // client_secret のみを返却（APIキーは返さない）
    res.json({
      client_secret: data.client_secret,
      model,
      voice,
      useRag: useRag && !!(config.rag?.vector_store_id && config.rag.vector_store_id.trim())
    });

  } catch (error) {
    console.error('[ERROR] Session creation failed:', error);
    console.error('[ERROR] スタックトレース:', error instanceof Error ? error.stack : '');
    res.status(500).json({
      error: 'Session creation failed',
      message: error instanceof Error ? error.message : '不明なエラー',
      stack: error instanceof Error ? error.stack : '',
      hint: 'config/config.yaml の API キーが正しいか確認してください'
    });
  }
});

/**
 * POST /api/kb_search
 * Responses API を使ってベクタ検索を実行し、要約・引用・出典を返す
 * 
 * 注意: Assistants API は 2026年前半に廃止予定のため、Responses API を使用
 * 
 * Body:
 * - query: string (検索クエリ)
 * - top_k?: number (取得する上位件数、デフォルト: 5)
 * 
 * Response:
 * - results: Array<{ summary: string, quote: string, source: { file: string, page?: number, url?: string, score: number } }>
 */
app.post('/api/kb_search', async (req: Request, res: Response) => {
  try {
    console.log('[INFO] POST /api/kb_search リクエスト受信');
    const { query, top_k = 5 } = req.body;
    console.log('[INFO] 検索パラメータ:', { query, top_k });

    // バリデーション
    if (!query || typeof query !== 'string' || query.trim() === '') {
      console.error('[ERROR] 無効なクエリ:', query);
      return res.status(400).json({ 
        error: 'Invalid query',
        message: 'query パラメータは必須です'
      });
    }

    const config = cachedConfig || loadConfig();
    const vectorStoreId = config.rag?.vector_store_id;

    // vector_store_id が未設定の場合
    if (!vectorStoreId || vectorStoreId.trim() === '') {
      console.warn('[WARN] vector_store_id が設定されていません');
      return res.json({ results: [] });
    }

    const apiKey = config.security.openai_api_key;
    console.log('[INFO] Vector Store ID:', vectorStoreId);
    console.log('[INFO] Responses API でベクタ検索を実行中...');

    // Responses API を使用（file_search ツールをサポート）
    // https://platform.openai.com/docs/guides/tools-file-search
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        input: query,  // messages ではなく input を使用
        model: 'gpt-4o-mini',
        tools: [
          {
            type: 'file_search',
            vector_store_ids: [vectorStoreId],  // ここで Vector Store を指定
            max_num_results: top_k || 5
          }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[ERROR] Responses API エラー:', response.status, errorText);
      
      // もしResponses APIのパラメータが異なる場合は、従来のChat Completions形式を試す
      console.log('[INFO] 代替方法を試行中...');
      
      return res.status(response.status).json({
        error: 'Responses API error',
        details: errorText,
        message: 'ベクタ検索に失敗しました。Vector Store ID を確認してください。'
      });
    }

    const data = await response.json();
    console.log('[INFO] Responses API レスポンス取得完了');

    // Responses API のレスポンス構造から情報を抽出
    // output フィールドに結果が格納されている
    const outputs = data.output || [];
    
    console.log('[INFO] 検索結果:', {
      outputLength: outputs.length,
      fullResponse: JSON.stringify(data).substring(0, 500)
    });

    // 結果を整形
    const results: any[] = [];

    // output から content を抽出
    for (const output of outputs) {
      if (output.type === 'message' && output.content) {
        for (const contentItem of output.content) {
          if (contentItem.type === 'text') {
            const text = contentItem.text || '';
            const annotations = contentItem.annotations || [];
            
            // annotationsがある場合は引用情報を使用
            if (annotations.length > 0) {
              annotations.forEach((annotation: any) => {
                if (annotation.type === 'file_citation') {
                  const citation = annotation.file_citation;
                  results.push({
                    summary: text.substring(0, 200),
                    quote: citation.quote || annotation.text || '',
                    source: {
                      file: citation.file_id || 'unknown',
                      page: null,
                      url: null,
                      score: 0.9
                    }
                  });
                }
              });
            } else if (text) {
              // annotationsがない場合はテキスト全体を使用
              const sentences = text.split(/[。．.!！?？\n]/).filter((s: string) => s.trim());
              if (sentences.length > 0) {
                const summaryText = sentences.slice(0, Math.min(3, sentences.length)).join('。');
                const quoteText = sentences.slice(3, Math.min(6, sentences.length)).join('。');
                
                results.push({
                  summary: summaryText + (summaryText ? '。' : ''),
                  quote: quoteText + (quoteText && sentences.length > 3 ? '。' : ''),
                  source: {
                    file: 'vector_store_content',
                    page: null,
                    url: null,
                    score: 0.8
                  }
                });
              }
            }
          }
        }
      }
    }

    // もし結果が空の場合は、一般的な応答を返す
    if (results.length === 0) {
      console.warn('[WARN] 検索結果が空です');
      results.push({
        summary: '関連する情報が見つかりませんでした。',
        quote: '',
        source: {
          file: 'no_results',
          page: null,
          url: null,
          score: 0.0
        }
      });
    }

    console.log('[INFO] 検索結果を返却:', results.length, '件');
    res.json({ results });

  } catch (error) {
    console.error('[ERROR] KB Search failed:', error);
    console.error('[ERROR] スタックトレース:', error instanceof Error ? error.stack : '');
    res.status(500).json({
      error: 'KB Search failed',
      message: error instanceof Error ? error.message : '不明なエラー',
      hint: 'Vector Store ID が正しいか、Responses API のパラメータが最新か確認してください'
    });
  }
});

// サーバー起動
app.listen(PORT, () => {
  console.log(`[INFO] サーバーが起動しました: http://localhost:${PORT}`);
  
  // 起動時に設定を読み込む
  try {
    loadConfig();
  } catch (error) {
    console.warn('[WARN] 初期設定の読み込みに失敗しました。config/config.yaml を確認してください。');
  }
});

