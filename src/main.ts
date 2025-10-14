/**
 * メインエントリーポイント
 * UI イベントの制御とサーバー API との通信
 */

import { RealtimeClient } from './realtime';

// DOM 要素の取得
const modelSelect = document.getElementById('modelSelect') as HTMLSelectElement;
const voiceSelect = document.getElementById('voiceSelect') as HTMLSelectElement;
const ragToggle = document.getElementById('ragToggle') as HTMLDivElement;
const connectBtn = document.getElementById('connectBtn') as HTMLButtonElement;
const disconnectBtn = document.getElementById('disconnectBtn') as HTMLButtonElement;
const statusDot = document.getElementById('statusDot') as HTMLDivElement;
const statusText = document.getElementById('statusText') as HTMLSpanElement;
const conversation = document.getElementById('conversation') as HTMLDivElement;
const textInput = document.getElementById('textInput') as HTMLInputElement;
const sendBtn = document.getElementById('sendBtn') as HTMLButtonElement;
const micBtn = document.getElementById('micBtn') as HTMLButtonElement;

let realtimeClient: RealtimeClient | null = null;
let ragAvailable = false; // RAG機能が利用可能かどうか（vector_store_idが設定されているか）
let ragEnabled = false; // RAGを実際に使用するかどうか（ユーザーの選択）
let messageIdCounter = 0;
let currentAssistantMessageId: string | null = null;
let currentUserMessageId: string | null = null;
let voiceModeEnabled = false; // 音声モードのオン/オフ

/**
 * ステータス表示を更新
 */
function updateStatus(status: 'disconnected' | 'connecting' | 'connected' | 'error', text: string) {
  statusDot.className = `status-dot ${status === 'disconnected' ? '' : status}`;
  statusText.textContent = text;
}

/**
 * 会話バブルを追加（固有IDを付与）
 */
function addMessage(role: 'user' | 'assistant', text: string): string {
  const messageId = `msg-${messageIdCounter++}`;
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${role}`;
  messageDiv.setAttribute('data-message-id', messageId);
  
  const bubble = document.createElement('div');
  bubble.className = 'message-bubble';
  bubble.textContent = text;
  
  messageDiv.appendChild(bubble);
  conversation.appendChild(messageDiv);
  conversation.scrollTop = conversation.scrollHeight;
  
  console.log(`[INFO] メッセージ追加: ${messageId} (${role}): ${text.substring(0, 30)}...`);
  
  return messageId;
}

/**
 * 特定のメッセージを更新（IDで指定）
 */
function updateMessage(messageId: string, text: string) {
  const messageDiv = conversation.querySelector(`[data-message-id="${messageId}"]`);
  if (messageDiv) {
    const bubble = messageDiv.querySelector('.message-bubble');
    if (bubble) {
      bubble.textContent = text;
      conversation.scrollTop = conversation.scrollHeight;
      console.log(`[INFO] メッセージ更新: ${messageId}: ${text.substring(0, 30)}...`);
    }
  } else {
    console.warn(`[WARN] メッセージID ${messageId} が見つかりません`);
  }
}

/**
 * 空のアシスタントメッセージを追加して、そのIDを保存
 */
function createNewAssistantMessage(): string {
  const messageId = addMessage('assistant', '');
  currentAssistantMessageId = messageId;
  console.log(`[INFO] 新しいAIメッセージ作成: ${messageId}`);
  return messageId;
}

/**
 * 初期化: サーバーから設定を取得
 */
async function initialize() {
  try {
    console.log('[INFO] 初期化を開始します...');
    const response = await fetch('/api/config');
    console.log('[INFO] /api/config のレスポンス:', response.status);
    
    if (!response.ok) {
      throw new Error(`設定の取得に失敗しました (status: ${response.status})`);
    }
    
    const config = await response.json();
    console.log('[INFO] 取得した設定:', config);
    
    // HTMLに既にオプションが入っているので、サーバーからの設定は
    // RAG の状態確認のみに使用
    
    // RAG トグルの初期状態
    ragAvailable = config.ragEnabled || false;
    if (ragAvailable) {
      // RAG機能が利用可能な場合、トグルを有効化（デフォルトはOFF）
      ragToggle.style.opacity = '1';
      ragToggle.style.cursor = 'pointer';
      ragEnabled = false; // 初期状態はOFF
      ragToggle.classList.remove('active');
      console.log('[INFO] RAG機能が利用可能です（初期状態: OFF）');
    } else {
      // RAGが利用できない場合はトグルを無効化
      ragToggle.style.opacity = '0.5';
      ragToggle.style.cursor = 'not-allowed';
      ragEnabled = false;
      ragToggle.classList.remove('active');
      console.log('[INFO] RAG機能は利用できません（vector_store_id未設定）');
    }
    
    // RAGに関する注意メッセージ
    if (config.ragNote) {
      console.warn('[WARN]', config.ragNote);
    }
    
    console.log('[INFO] 初期化完了 - RAG利用可能:', ragAvailable, '/ RAG有効:', ragEnabled);
    updateStatus('disconnected', '未接続');
  } catch (error) {
    console.error('[ERROR] 初期化エラー:', error);
    console.warn('[WARN] サーバーから設定を取得できませんでしたが、デフォルト値を使用します');
    // エラーが発生してもデフォルト値（HTML内）で動作可能
    updateStatus('disconnected', '未接続（オフラインモード）');
  }
}

/**
 * 接続処理
 */
async function handleConnect() {
  const model = modelSelect.value;
  const voice = voiceSelect.value;
  
  if (!model || !voice) {
    alert('モデルとボイスを選択してください');
    return;
  }
  
  try {
    updateStatus('connecting', '接続中...');
    connectBtn.disabled = true;
    
    // client_secret を取得
    const response = await fetch('/api/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, voice, useRag: ragEnabled })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'セッション作成に失敗しました');
    }
    
    const sessionData = await response.json();
    const actualUseRag = sessionData.useRag || false;
    
    console.log('[INFO] セッションデータ:', { model, voice, useRag: actualUseRag });
    
    // RealtimeClient を作成して接続
    realtimeClient = new RealtimeClient(
      sessionData.client_secret.value,
      model,
      voice,
      actualUseRag,
      {
        onConnected: () => {
          updateStatus('connected', '接続中');
          disconnectBtn.disabled = false;
          textInput.disabled = false;
          sendBtn.disabled = false;
          micBtn.disabled = false;
          modelSelect.disabled = true;
          voiceSelect.disabled = true;
        },
        onDisconnected: () => {
          updateStatus('disconnected', '切断されました');
          handleDisconnect();
        },
        onError: (error) => {
          updateStatus('error', `エラー: ${error}`);
          console.error('[ERROR]', error);
        },
        onResponseStarted: () => {
          // 応答開始時に新しい空のアシスタントバブルを作成
          createNewAssistantMessage();
        },
        onMessage: (text) => {
          // 現在のアシスタントメッセージを確定
          if (currentAssistantMessageId) {
            updateMessage(currentAssistantMessageId, text);
            currentAssistantMessageId = null; // 確定したのでクリア
          }
        },
        onMessageDelta: (text) => {
          // 現在のアシスタントメッセージをストリーミング更新
          if (currentAssistantMessageId) {
            updateMessage(currentAssistantMessageId, text);
          }
        },
        onAudioTranscript: (transcript, isPlaceholder = false) => {
          // 音声入力の文字起こしをログに追加
          if (transcript && transcript.trim()) {
            if (isPlaceholder) {
              // プレースホルダーの場合、新しいユーザーメッセージを作成
              const messageId = addMessage('user', transcript);
              currentUserMessageId = messageId;
              console.log('[INFO] ユーザー音声プレースホルダー作成:', messageId);
            } else if (currentUserMessageId) {
              // 文字起こし完了：現在のユーザーメッセージを更新
              updateMessage(currentUserMessageId, transcript);
              currentUserMessageId = null; // 更新完了したのでクリア
            } else {
              // プレースホルダーがない場合（稀なケース）は新規追加
              console.log('[INFO] ユーザー音声入力を新規追加:', transcript);
              addMessage('user', transcript);
            }
          }
        }
      }
    );
    
    await realtimeClient.connect();
    
  } catch (error) {
    console.error('[ERROR] 接続エラー:', error);
    updateStatus('error', '接続に失敗しました');
    connectBtn.disabled = false;
  }
}

/**
 * 切断処理
 */
function handleDisconnect() {
  if (realtimeClient) {
    realtimeClient.disconnect();
    realtimeClient = null;
  }
  
  updateStatus('disconnected', '未接続');
  connectBtn.disabled = false;
  disconnectBtn.disabled = true;
  textInput.disabled = true;
  sendBtn.disabled = true;
  micBtn.disabled = true;
  micBtn.classList.remove('recording');
  micBtn.title = '音声モード: OFF（クリックでON）';
  voiceModeEnabled = false;
  modelSelect.disabled = false;
  voiceSelect.disabled = false;
}

/**
 * テキスト送信
 */
function handleSendText() {
  const text = textInput.value.trim();
  if (!text || !realtimeClient) return;
  
  // テキスト入力は即座に確定（プレースホルダー不要）
  addMessage('user', text);
  realtimeClient.sendText(text);
  textInput.value = '';
}

// イベントリスナーの設定
connectBtn.addEventListener('click', handleConnect);
disconnectBtn.addEventListener('click', handleDisconnect);
sendBtn.addEventListener('click', handleSendText);

// RAG トグル
ragToggle.addEventListener('click', () => {
  // RAGが利用不可の場合（vector_store_idが未設定）
  if (!ragAvailable) {
    alert('⚠️ RAG機能を使用するには、config.yaml に vector_store_id を設定してください。\n\nVector Store は OpenAI Platform で作成できます。');
    return;
  }
  // RAG機能が利用可能な場合、トグルをオン/オフ
  ragEnabled = !ragEnabled;
  ragToggle.classList.toggle('active', ragEnabled);
  console.log('[INFO] RAG トグル:', ragEnabled ? 'ON' : 'OFF');
});

// テキスト入力のキーボードショートカット
textInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    handleSendText();
  }
});

// マイクボタン（音声モードのトグル）
micBtn.addEventListener('click', () => {
  if (!realtimeClient) return;
  
  voiceModeEnabled = !voiceModeEnabled;
  
  if (voiceModeEnabled) {
    // 音声モード ON
    micBtn.classList.add('recording');
    micBtn.title = '音声モード: ON（クリックでOFF）';
    realtimeClient.enableVoiceMode();
    console.log('[INFO] 音声モード: ON');
  } else {
    // 音声モード OFF
    micBtn.classList.remove('recording');
    micBtn.title = '音声モード: OFF（クリックでON）';
    realtimeClient.disableVoiceMode();
    console.log('[INFO] 音声モード: OFF');
  }
});

// 初期化実行
initialize();

