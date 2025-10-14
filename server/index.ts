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
import { readFileSync, existsSync } from 'fs';
import { load as yamlLoad } from 'js-yaml';
import { resolve } from 'path';

const app = express();
const PORT = Number(process.env.PORT) || 3001;

// CORS 設定（本番は Replit の任意ドメインになるため許可を緩める）
app.use(cors({ origin: true, credentials: true }));

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

    let fileConfig: Partial<Config> = {};

    // ファイルが存在する場合のみ読む（存在しなくても環境変数だけで動作可能にする）
    try {
      const fileContent = readFileSync(configPath, 'utf8');
      console.log('[INFO] config.yaml を読み込みました（サイズ: ' + fileContent.length + ' バイト）');
      fileConfig = (yamlLoad(fileContent) as Config) || {};
      console.log('[INFO] YAML パース成功');
    } catch (fileError: any) {
      if (fileError.code === 'ENOENT') {
        console.warn('[WARN] config.yaml が見つかりません。環境変数のみで起動を試みます');
      } else {
        throw fileError;
      }
    }

    // 環境変数を優先して構成
    const mergedConfig: Config = {
      security: {
        openai_api_key: process.env.OPENAI_API_KEY || fileConfig.security?.openai_api_key || ''
      },
      rag: {
        vector_store_id: process.env.VECTOR_STORE_ID || fileConfig.rag?.vector_store_id || ''
      },
      prompt: {
        system: process.env.SYSTEM_PROMPT || fileConfig.prompt?.system || ''
      }
    };

    // 必須フィールドのバリデーション
    if (!mergedConfig.security?.openai_api_key) {
      throw new Error('OPENAI_API_KEY（環境変数）または config.yaml の security.openai_api_key が未設定です');
    }
    if (!mergedConfig.prompt?.system) {
      throw new Error('SYSTEM_PROMPT（環境変数）または config.yaml の prompt.system が未設定です');
    }

    cachedConfig = mergedConfig;
    console.log('[INFO] 設定の検証に成功しました（env優先でマージ）');
    return mergedConfig;
  } catch (error) {
    console.error('[ERROR] 設定ロードに失敗:', error);
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
    console.log('[INFO] Responses API でベクタ検索＆要約を実行中...');

    // Responses API を使用（file_search + AI要約のハイブリッド）
    // ベストプラクティス: Responses APIで検索と要約を同時実行し、
    // Realtime APIには簡潔な要約のみを返すことで低遅延と高品質を両立
    // https://platform.openai.com/docs/guides/tools-file-search
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        input: query,
        model: 'gpt-4o-mini',
        instructions: `あなたは知識ベース検索の要約エキスパートです。
以下のルールに従って、検索結果を簡潔に要約してください：
1. 2-3文程度で簡潔に回答（最大150文字）
2. 重要な情報のみを抽出
3. 引用元のファイル名には言及しない（内部処理のため）
4. 「検索しました」「ファイルを確認しました」などのメタ情報は不要
5. ユーザーの質問に直接答える形式で記述`,
        tools: [
          {
            type: 'file_search',
            vector_store_ids: [vectorStoreId],
            max_num_results: Math.min(top_k || 3, 5)  // 最大5件に制限してレイテンシ改善
          }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[ERROR] Responses API エラー:', response.status, errorText);
      
      return res.status(response.status).json({
        error: 'Responses API error',
        details: errorText,
        message: 'ベクタ検索に失敗しました。Vector Store ID を確認してください。'
      });
    }

    const data = await response.json();
    console.log('[INFO] Responses API レスポンス取得完了');
    console.log('[DEBUG] Response structure:', {
      outputCount: data.output?.length,
      outputTypes: data.output?.map((o: any) => o.type)
    });

    // Responses API のレスポンス構造から要約テキストを抽出
    const outputs = data.output || [];
    const results: any[] = [];

    // message 型の output から要約済みテキストを抽出
    for (const output of outputs) {
      if (output.type === 'message' && output.content) {
        for (const contentItem of output.content) {
          if (contentItem.type === 'output_text' && contentItem.text) {
            const text = contentItem.text.trim();
            const annotations = contentItem.annotations || [];
            
            // ファイル情報を取得（annotationsから）
            const sourceFiles = annotations
              .filter((a: any) => a.type === 'file_citation')
              .map((a: any) => a.filename || a.file_id)
              .filter(Boolean);
            
            const fileName = sourceFiles.length > 0 ? sourceFiles[0] : 'knowledge_base';
            
            // Responses APIが既に要約済みなので、そのまま使用
            // ただし、長すぎる場合（200文字超）はトリミング
            let summary = text;
            let quote = '';
            
            if (text.length > 200) {
              // 長い場合は前半を要約、後半を引用として分割
              const sentences = text.split(/[。．.!！?？\n]/).filter((s: string) => s.trim());
              const midPoint = Math.ceil(sentences.length / 2);
              summary = sentences.slice(0, midPoint).join('。') + '。';
              quote = sentences.slice(midPoint).join('。') + '。';
            } else {
              // 短い場合はすべて要約として扱う
              summary = text;
              quote = '';
            }
            
            results.push({
              summary: summary,
              quote: quote,
              source: {
                file: fileName,
                page: null,
                url: null,
                score: 0.95,  // Responses APIの要約は高品質
                citationCount: annotations.length
              }
            });
            
            console.log('[SUCCESS] 要約を抽出:', {
              summaryLength: summary.length,
              quoteLength: quote.length,
              sourceFiles: sourceFiles.length,
              annotations: annotations.length
            });
            
            // 最初の1つの要約のみを使用（複数のmessageがある場合）
            break;
          }
        }
        
        if (results.length > 0) break;
      }
    }

    // もし結果が空の場合は、適切な応答を返す
    if (results.length === 0) {
      console.warn('[WARN] Responses APIから要約を抽出できませんでした');
      console.warn('[DEBUG] 生レスポンス（最初の500文字）:', JSON.stringify(data).substring(0, 500));
      
      results.push({
        summary: '申し訳ございませんが、知識ベースから関連する情報が見つかりませんでした。',
        quote: '',
        source: {
          file: 'no_results',
          page: null,
          url: null,
          score: 0.0,
          citationCount: 0
        }
      });
    }

    console.log('[INFO] ✅ RAG検索完了 - 要約を返却:', {
      resultCount: results.length,
      summaryLength: results[0]?.summary?.length || 0,
      sourceCitations: results[0]?.source?.citationCount || 0
    });
    
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

// 本番ビルドの静的ファイルを配信（存在する場合）
const distPath = resolve(process.cwd(), 'dist');
if (existsSync(distPath)) {
  app.use(express.static(distPath));
}

// SPA ルーティング: API 以外のパスは index.html を返す
app.get('*', (_req: Request, res: Response, next) => {
  if (_req.path.startsWith('/api')) return next();
  try {
    const indexHtml = resolve(distPath, 'index.html');
    const html = readFileSync(indexHtml, 'utf8');
    res.send(html);
  } catch {
    next();
  }
});

// サーバー起動
app.listen(PORT, () => {
  console.log(`[INFO] サーバーが起動しました: 0.0.0.0:${PORT}`);
  
  // 起動時に設定を読み込む
  try {
    loadConfig();
  } catch (error) {
    console.warn('[WARN] 初期設定の読み込みに失敗しました。config/config.yaml を確認してください。');
  }
});

