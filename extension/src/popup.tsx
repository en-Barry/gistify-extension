import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';

// コンポーネントのインポート
import { ApiKeyInput } from './components/ApiKeyInput.tsx';
import { ErrorMessage } from './components/ErrorMessage.tsx';
import { LoadingIndicator } from './components/LoadingIndicator.tsx';
import { ModeSelector } from './components/ModeSelector.tsx';
import { SummaryResult } from './components/SummaryResult.tsx';
import { TextInput } from './components/TextInput.tsx';
import { YouTubeInput } from './components/YouTubeInput.tsx';
import config from './config.ts';
import { useApiKey } from './hooks/useApiKey.ts';
import { useSummarize } from './hooks/useSummarize.ts';
import { useYouTubeVideoId } from './hooks/useYouTubeVideoId.ts';

import './popup.css';

const App: React.FC = () => {
  // APIキー管理フック
  const {
    apiKey,
    setApiKey,
    hasStoredApiKey,
    showApiKeyInput,
    saveApiKey,
    resetApiKey,
  } = useApiKey();

  // YouTube動画ID管理フック
  const {
    mode,
    setMode,
    videoId,
    setVideoId,
  } = useYouTubeVideoId();

  // 要約処理フック
  const {
    summary,
    error,
    isLoading,
    loadingProgress,
    summarize,
  } = useSummarize();

  // その他状態管理
  const [text, setText] = useState('');

  // 要約処理
  const handleSummarize = async () => {
    // APIキーが有効な場合に実行するコールバック
    const onApiKeyValid = !hasStoredApiKey ? saveApiKey : undefined;

    await summarize(
      mode,
      apiKey,
      {
        videoId: mode === 'youtube' ? videoId : undefined,
        text: mode === 'manual' ? text : undefined,
      },
      onApiKeyValid
    );
  };

  return (
    <div className='container'>
      <h1>動画より文字派！</h1>
      <p className='subtitle'>YouTube字幕・テキスト要約ツール</p>

      {/* モード選択 */}
      <ModeSelector mode={mode} setMode={setMode} />

      {/* YouTube動画ID入力 */}
      {mode === 'youtube' && (
        <YouTubeInput videoId={videoId} setVideoId={setVideoId} />
      )}

      {/* 自由入力テキスト */}
      {mode === 'manual' && (
        <TextInput text={text} setText={setText} />
      )}

      {/* APIキー入力 */}
      {(showApiKeyInput || !hasStoredApiKey) && (
        <ApiKeyInput apiKey={apiKey} setApiKey={setApiKey} />
      )}

      {/* ボタン */}
      <div className='button-group'>
        <button
          type='button'
          onClick={handleSummarize}
          disabled={isLoading}
          className='primary-button'
        >
          {isLoading ? '要約中...' : '要約する'}
        </button>

        {hasStoredApiKey && (
          <button
            type='button'
            onClick={resetApiKey}
            className='secondary-button'
          >
            APIキーを再設定
          </button>
        )}
      </div>

      {/* ローディングインジケーター */}
      {isLoading && <LoadingIndicator progress={loadingProgress} />}

      {/* エラーメッセージ */}
      <ErrorMessage message={error} />

      {/* 要約結果 */}
      {summary && <SummaryResult summary={summary} />}

      <footer>
        <p>© 2025 動画より文字派！ - OpenAI API を使用</p>
        <p className='version'>v{config.version}</p>
      </footer>
    </div>
  );
};

// Reactコンポーネントをレンダリング
const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}
