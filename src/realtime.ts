/**
 * OpenAI Realtime API (WebRTC) クライアント
 * 
 * 参考ドキュメント:
 * - WebRTC Integration: https://platform.openai.com/docs/guides/realtime-webrtc
 * - Realtime API Events: https://platform.openai.com/docs/api-reference/realtime-client-events
 */

export interface RealtimeCallbacks {
  onConnected: () => void;
  onDisconnected: () => void;
  onError: (error: string) => void;
  onResponseStarted: () => void;
  onMessage: (text: string) => void;
  onMessageDelta: (text: string) => void;
  onAudioTranscript: (transcript: string, isPlaceholder?: boolean) => void;
  onToolCall?: (toolName: string, args: any) => void;
}

/**
 * OpenAI Realtime API クライアント（WebRTC 実装）
 */
export class RealtimeClient {
  private peerConnection: RTCPeerConnection | null = null;
  private dataChannel: RTCDataChannel | null = null;
  private clientSecret: string;
  private model: string;
  private voice: string;
  private useRag: boolean;
  private callbacks: RealtimeCallbacks;
  private currentResponseText: string = '';
  private audioElement: HTMLAudioElement | null = null;
  private pendingUserTranscript: boolean = false;
  private responseQueue: Array<() => void> = [];
  private localStream: MediaStream | null = null;
  private audioTracks: MediaStreamTrack[] = [];
  private currentToolCallId: string | null = null;
  private toolCallArgs: string = '';

  constructor(clientSecret: string, model: string, voice: string, useRag: boolean, callbacks: RealtimeCallbacks) {
    this.clientSecret = clientSecret;
    this.model = model;
    this.voice = voice;
    this.useRag = useRag;
    this.callbacks = callbacks;
    this.audioElement = document.getElementById('audioPlayer') as HTMLAudioElement;
  }

  /**
   * WebRTC 接続を確立
   */
  async connect(): Promise<void> {
    try {
      console.log('[INFO] WebRTC 接続を開始します...');

      // RTCPeerConnection を作成
      this.peerConnection = new RTCPeerConnection();

      // マイク音声ストリームを取得して追加
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.localStream = stream;
      
      stream.getTracks().forEach((track) => {
        // 最初は無効化（デフォルトは音声モードOFF）
        track.enabled = false;
        this.audioTracks.push(track);
        this.peerConnection!.addTrack(track, stream);
      });
      console.log('[INFO] マイクトラックを追加しました（初期状態: 無効）');

      // 受信音声トラックの処理
      this.peerConnection.ontrack = (event) => {
        console.log('[INFO] 音声トラックを受信しました', {
          trackId: event.track.id,
          trackKind: event.track.kind,
          streamId: event.streams[0]?.id
        });
        
        // 既に同じストリームが設定されている場合はスキップ
        if (this.audioElement && event.streams[0]) {
          const newStream = event.streams[0];
          const currentStream = this.audioElement.srcObject as MediaStream | null;
          
          if (currentStream && currentStream.id === newStream.id) {
            console.log('[INFO] 既に同じストリームが設定されているためスキップ');
            return;
          }
          
          this.audioElement.srcObject = newStream;
          // 最初はミュート（デフォルトは音声モードOFF）
          this.audioElement.muted = true;
          console.log('[INFO] 音声出力を初期化（ミュート: ON）', { streamId: newStream.id });
        }
      };

      // DataChannel を作成（JSON イベント送受信用）
      this.dataChannel = this.peerConnection.createDataChannel('oai-events');
      this.setupDataChannel();

      // SDP Offer を作成
      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);
      console.log('[INFO] SDP Offer を作成しました');

      // OpenAI Realtime エンドポイントに SDP を送信
      // https://platform.openai.com/docs/guides/realtime-webrtc
      const baseUrl = 'https://api.openai.com/v1/realtime';
      const url = `${baseUrl}?model=${encodeURIComponent(this.model)}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.clientSecret}`,
          'Content-Type': 'application/sdp'
        },
        body: offer.sdp
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenAI WebRTC 接続失敗: ${response.status} ${errorText}`);
      }

      // 受信した SDP Answer を設定
      const answerSdp = await response.text();
      await this.peerConnection.setRemoteDescription({
        type: 'answer',
        sdp: answerSdp
      });
      console.log('[INFO] SDP Answer を設定しました');

      // 音声入力の文字起こしを有効化とツール登録
      if (this.dataChannel && this.dataChannel.readyState === 'open') {
        this.enableAudioTranscription();
        if (this.useRag) {
          this.registerKbSearchTool();
        }
      } else {
        // DataChannel が開いたら音声文字起こしを有効化とツール登録
        const originalOnOpen = this.dataChannel!.onopen;
        this.dataChannel!.onopen = () => {
          if (originalOnOpen) originalOnOpen.call(this.dataChannel);
          this.enableAudioTranscription();
          if (this.useRag) {
            this.registerKbSearchTool();
          }
        };
      }

      // 接続完了を通知
      this.callbacks.onConnected();

    } catch (error) {
      console.error('[ERROR] WebRTC 接続エラー:', error);
      this.callbacks.onError(error instanceof Error ? error.message : '不明なエラー');
      this.disconnect();
      throw error;
    }
  }

  /**
   * DataChannel の設定
   */
  private setupDataChannel(): void {
    if (!this.dataChannel) return;

    this.dataChannel.onopen = () => {
      console.log('[INFO] DataChannel が開きました');
    };

    this.dataChannel.onclose = () => {
      console.log('[INFO] DataChannel が閉じました');
      this.callbacks.onDisconnected();
    };

    this.dataChannel.onerror = (error) => {
      console.error('[ERROR] DataChannel エラー:', error);
      this.callbacks.onError('DataChannel エラーが発生しました');
    };

    this.dataChannel.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        this.handleServerEvent(message);
      } catch (error) {
        console.error('[ERROR] メッセージパースエラー:', error);
      }
    };
  }

  /**
   * サーバーからのイベントを処理
   * https://platform.openai.com/docs/api-reference/realtime-server-events
   */
  private handleServerEvent(event: any): void {
    console.log('[DEBUG] Server Event:', event.type);

    switch (event.type) {
      case 'session.created':
        console.log('[INFO] セッションが作成されました:', event.session);
        break;

      case 'session.updated':
        console.log('[INFO] セッションが更新されました');
        break;

      case 'conversation.item.created':
        console.log('[INFO] 会話アイテムが作成されました');
        // ユーザーの音声入力の場合
        if (event.item?.role === 'user') {
          // 音声入力がある場合、文字起こし待ちフラグを立てる
          if (event.item?.content) {
            for (const content of event.item.content) {
              if (content.type === 'input_audio') {
                console.log('[INFO] 音声入力検出 - プレースホルダー作成');
                this.pendingUserTranscript = true;
                // プレースホルダーとして新しいユーザーメッセージを作成（isPlaceholder: true）
                this.callbacks.onAudioTranscript('🎤 音声入力中...', true);
              }
            }
          }
        }
        break;

      case 'conversation.item.input_audio_transcription.completed':
        // 音声入力の文字起こし完了
        if (event.transcript) {
          console.log('[INFO] 音声文字起こし完了:', event.transcript);
          this.pendingUserTranscript = false;
          // プレースホルダーを実際のテキストで更新（isPlaceholder: false）
          this.callbacks.onAudioTranscript(event.transcript, false);
          
          // キューに溜まっていたAI応答を実行
          this.processResponseQueue();
        }
        break;

      case 'response.created':
        // 応答が開始された
        console.log('[INFO] 応答が開始されました');
        
        // ユーザーの文字起こし待ちの場合、AI応答をキューに入れる
        if (this.pendingUserTranscript) {
          console.log('[INFO] ユーザー文字起こし待ちのため、AI応答をキューに追加');
          this.responseQueue.push(() => {
            this.callbacks.onResponseStarted();
          });
        } else {
          // すぐにAI応答バブルを追加
          this.callbacks.onResponseStarted();
        }
        break;

      case 'response.text.delta':
        // テキストの差分受信
        if (event.delta) {
          this.currentResponseText += event.delta;
          
          // ユーザーの文字起こし待ちの場合、デルタ更新もキューに入れる
          if (this.pendingUserTranscript) {
            const currentText = this.currentResponseText;
            this.responseQueue.push(() => {
              this.callbacks.onMessageDelta(currentText);
            });
          } else {
            this.callbacks.onMessageDelta(this.currentResponseText);
          }
        }
        break;

      case 'response.text.done':
        // テキスト応答完了
        if (event.text) {
          // ユーザーの文字起こし待ちの場合、完了処理もキューに入れる
          if (this.pendingUserTranscript) {
            const finalText = event.text;
            this.responseQueue.push(() => {
              this.callbacks.onMessage(finalText);
            });
          } else {
            this.callbacks.onMessage(event.text);
          }
        }
        this.currentResponseText = '';
        break;

      case 'response.output_item.added':
        // 応答アイテムが追加された
        console.log('[INFO] 応答アイテム追加:', event.item);
        break;

      case 'response.content_part.added':
        // コンテンツパートが追加された
        console.log('[INFO] コンテンツパート追加');
        break;

      case 'response.audio_transcript.delta':
        // AI応答の音声文字起こし差分
        if (event.delta) {
          this.currentResponseText += event.delta;
          
          // ユーザーの文字起こし待ちの場合、デルタ更新もキューに入れる
          if (this.pendingUserTranscript) {
            const currentText = this.currentResponseText;
            this.responseQueue.push(() => {
              this.callbacks.onMessageDelta(currentText);
            });
          } else {
            this.callbacks.onMessageDelta(this.currentResponseText);
          }
        }
        break;

      case 'response.audio_transcript.done':
        // AI応答の音声文字起こし完了
        if (event.transcript) {
          // ユーザーの文字起こし待ちの場合、完了処理もキューに入れる
          if (this.pendingUserTranscript) {
            const finalText = event.transcript;
            this.responseQueue.push(() => {
              this.callbacks.onMessage(finalText);
            });
          } else {
            this.callbacks.onMessage(event.transcript);
          }
        }
        this.currentResponseText = '';
        break;

      case 'response.done':
        console.log('[INFO] 応答が完了しました');
        break;

      case 'response.audio.delta':
        // 音声は自動再生されるので、特に処理不要
        break;

      case 'response.audio.done':
        console.log('[INFO] 音声応答が完了しました');
        break;

      case 'response.function_call_arguments.delta':
        // ツール呼び出しの引数を蓄積
        if (event.delta) {
          this.toolCallArgs += event.delta;
          console.log('[DEBUG] ツール引数デルタ:', event.delta);
        }
        break;

      case 'response.function_call_arguments.done':
        // ツール呼び出しの引数が完了
        console.log('[INFO] ツール呼び出し引数完了:', this.toolCallArgs);
        if (event.call_id && event.name) {
          this.currentToolCallId = event.call_id;
          this.handleToolCall(event.name, this.toolCallArgs, event.call_id);
        }
        this.toolCallArgs = '';
        break;

      case 'error':
        console.error('[ERROR] サーバーエラー:', event.error);
        this.callbacks.onError(event.error.message || 'サーバーエラー');
        break;

      default:
        // その他のイベントはログのみ
        console.log('[DEBUG] 未処理イベント:', event.type);
    }
  }

  /**
   * ツール呼び出しを処理（サーバへ委譲）
   */
  private async handleToolCall(toolName: string, argsJson: string, callId: string): Promise<void> {
    console.log('[INFO] ツール呼び出しを処理:', { toolName, callId, argsJson });

    try {
      // kb_search の場合のみ処理
      if (toolName !== 'kb_search') {
        console.warn('[WARN] 未知のツール:', toolName);
        this.sendToolResult(callId, { error: '未対応のツールです' });
        return;
      }

      // 引数をパース
      const args = JSON.parse(argsJson);
      console.log('[INFO] パースされた引数:', args);

      // コールバックで通知（UIに表示する場合）
      if (this.callbacks.onToolCall) {
        this.callbacks.onToolCall(toolName, args);
      }

      // サーバの /api/kb_search に委譲
      const response = await fetch('/api/kb_search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: args.query,
          top_k: args.top_k || 5
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'ベクタ検索に失敗しました');
      }

      const searchResult = await response.json();
      console.log('[INFO] ベクタ検索結果:', searchResult);

      // ツール結果をモデルに返却
      this.sendToolResult(callId, searchResult);

    } catch (error) {
      console.error('[ERROR] ツール呼び出しエラー:', error);
      this.sendToolResult(callId, { 
        error: error instanceof Error ? error.message : '不明なエラー',
        results: []
      });
    }
  }

  /**
   * ツール結果をモデルに返却
   */
  private sendToolResult(callId: string, result: any): void {
    if (!this.dataChannel || this.dataChannel.readyState !== 'open') {
      console.warn('[WARN] DataChannel が開いていません');
      return;
    }

    try {
      const resultEvent = {
        type: 'conversation.item.create',
        item: {
          type: 'function_call_output',
          call_id: callId,
          output: JSON.stringify(result)
        }
      };
      
      this.dataChannel.send(JSON.stringify(resultEvent));
      console.log('[INFO] ツール結果を送信しました:', callId);

      // 応答の続きを要求
      const responseCreateEvent = {
        type: 'response.create'
      };
      this.dataChannel.send(JSON.stringify(responseCreateEvent));
      console.log('[INFO] 応答の続きを要求しました');

    } catch (error) {
      console.error('[ERROR] ツール結果送信エラー:', error);
    }
  }

  /**
   * キューに溜まったAI応答を処理
   */
  private processResponseQueue(): void {
    console.log('[INFO] AI応答キューを処理:', this.responseQueue.length, '個');
    while (this.responseQueue.length > 0) {
      const callback = this.responseQueue.shift();
      if (callback) {
        callback();
      }
    }
  }

  /**
   * 音声入力の文字起こしを有効化
   */
  private enableAudioTranscription(): void {
    if (!this.dataChannel || this.dataChannel.readyState !== 'open') {
      return;
    }

    try {
      const updateEvent = {
        type: 'session.update',
        session: {
          input_audio_transcription: {
            model: 'whisper-1'
          }
        }
      };
      this.dataChannel.send(JSON.stringify(updateEvent));
      console.log('[INFO] 音声入力の文字起こしを有効化しました');
    } catch (error) {
      console.error('[ERROR] 文字起こし有効化エラー:', error);
    }
  }

  /**
   * kb_search ツールをセッションに登録
   */
  private registerKbSearchTool(): void {
    if (!this.dataChannel || this.dataChannel.readyState !== 'open') {
      return;
    }

    try {
      const updateEvent = {
        type: 'session.update',
        session: {
          tools: [
            {
              type: 'function',
              name: 'kb_search',
              description: '知識ベース（Vector Store）からAI要約された情報を取得します。医療教育、救急シナリオ、専門的な質問に対して使用してください。このツールは検索と要約を同時に実行し、簡潔な回答を返します。',
              parameters: {
                type: 'object',
                properties: {
                  query: {
                    type: 'string',
                    description: '検索クエリ（ユーザーの質問を明確に表現したキーワードまたは文）'
                  },
                  top_k: {
                    type: 'integer',
                    description: '検索する上位件数（1-5を推奨、デフォルト: 3）',
                    default: 3
                  }
                },
                required: ['query']
              }
            }
          ],
          tool_choice: 'auto'
        }
      };
      this.dataChannel.send(JSON.stringify(updateEvent));
      console.log('[INFO] kb_search ツールを登録しました');
    } catch (error) {
      console.error('[ERROR] ツール登録エラー:', error);
    }
  }

  /**
   * テキストメッセージを送信
   * https://platform.openai.com/docs/api-reference/realtime-client-events/conversation-item-create
   */
  sendText(text: string): void {
    if (!this.dataChannel || this.dataChannel.readyState !== 'open') {
      console.warn('[WARN] DataChannel が開いていません');
      return;
    }

    try {
      // 1. 会話アイテムを作成
      const createItemEvent = {
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
      this.dataChannel.send(JSON.stringify(createItemEvent));
      console.log('[INFO] テキストメッセージを送信しました:', text);

      // 2. 応答を要求
      const responseCreateEvent: any = {
        type: 'response.create',
        response: {
          modalities: ['text', 'audio']
        }
      };
      
      // RAG モードの場合、tool_choice を required に設定
      if (this.useRag) {
        responseCreateEvent.response.tool_choice = 'required';
        responseCreateEvent.response.instructions = `回答する前に必ず kb_search ツールで知識ベースを検索してください。
検索結果（summary）は既に要約済みなので、それをそのまま自然な言葉で伝えてください。
追加の推測や説明は不要です。検索結果が見つからない場合は、素直にその旨を伝えてください。`;
        console.log('[INFO] RAG モード有効: tool_choice=required');
      }
      
      this.dataChannel.send(JSON.stringify(responseCreateEvent));
      console.log('[INFO] 応答を要求しました');

      // 返答テキストバッファをリセット
      this.currentResponseText = '';

    } catch (error) {
      console.error('[ERROR] メッセージ送信エラー:', error);
      this.callbacks.onError('メッセージの送信に失敗しました');
    }
  }

  /**
   * 音声モードを有効化
   */
  enableVoiceMode(): void {
    console.log('[INFO] 音声モードを有効化します');
    
    // マイクトラックを有効化
    this.audioTracks.forEach(track => {
      track.enabled = true;
    });
    
    // オーディオ再生のミュートを解除
    if (this.audioElement) {
      this.audioElement.muted = false;
    }
    
    // セッション更新: 音声モーダリティを有効化（voice設定も含める）
    if (this.dataChannel && this.dataChannel.readyState === 'open') {
      try {
        const updateEvent = {
          type: 'session.update',
          session: {
            modalities: ['text', 'audio'],
            voice: this.voice // voice設定を維持
          }
        };
        this.dataChannel.send(JSON.stringify(updateEvent));
        console.log('[INFO] セッション更新: 音声モード有効', { voice: this.voice });
      } catch (error) {
        console.error('[ERROR] セッション更新エラー:', error);
      }
    }
  }

  /**
   * 音声モードを無効化
   */
  disableVoiceMode(): void {
    console.log('[INFO] 音声モードを無効化します');
    
    // マイクトラックを無効化
    this.audioTracks.forEach(track => {
      track.enabled = false;
    });
    
    // オーディオ再生をミュート
    if (this.audioElement) {
      this.audioElement.muted = true;
    }
    
    // セッション更新: テキストモーダリティのみ（voice設定は維持）
    if (this.dataChannel && this.dataChannel.readyState === 'open') {
      try {
        const updateEvent = {
          type: 'session.update',
          session: {
            modalities: ['text'],
            voice: this.voice // voice設定を維持
          }
        };
        this.dataChannel.send(JSON.stringify(updateEvent));
        console.log('[INFO] セッション更新: テキストモードのみ', { voice: this.voice });
      } catch (error) {
        console.error('[ERROR] セッション更新エラー:', error);
      }
    }
  }

  /**
   * 接続を切断
   */
  disconnect(): void {
    console.log('[INFO] 接続を切断します...');

    // ローカルストリームのトラックを停止
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    if (this.dataChannel) {
      this.dataChannel.close();
      this.dataChannel = null;
    }

    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    if (this.audioElement) {
      this.audioElement.srcObject = null;
    }

    this.currentResponseText = '';
    this.pendingUserTranscript = false;
    this.responseQueue = [];
    this.audioTracks = [];
  }
}

