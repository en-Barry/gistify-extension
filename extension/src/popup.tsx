import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { SummarizeRequest, SummarizeResponse, AppSettings } from '../../shared/types.js';
import redaxios from 'redaxios';
import config from './config.js';
import './popup.css';

// Chrome Storageからデータを取得する関数
const getStoredSettings = (): Promise<AppSettings> => {
  return new Promise((resolve) => {
    chrome.storage.local.get(['apiKey'], (result) => {
      resolve({
        apiKey: result.apiKey || '',
      });
    });
  });
};

// Chrome Storageにデータを保存する関数
const saveSettings = (settings: AppSettings): Promise<void> => {
  return new Promise((resolve) => {
    chrome.storage.local.set(settings, () => {
      resolve();
    });
  });
};

// 現在のYouTube動画IDを取得する関数
const getCurrentYouTubeVideoId = async (): Promise<string | null> => {
  return new Promise((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const url = tabs[0]?.url || '';
      const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/);
      resolve(match ? match[1] : null);
    });
  });
};

const App: React.FC = () => {
  // 状態管理
  const [mode, setMode] = useState<'youtube' | 'manual'>('manual'); // デフォルトは自由入力モード
  const [videoId, setVideoId] = useState('');
  const [text, setText] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [summary, setSummary] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0); // ローディング進捗状態
  const [hasStoredApiKey, setHasStoredApiKey] = useState(false);
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false); // コピー成功状態

  // 初期化処理
  useEffect(() => {
    const initialize = async () => {
      // 保存されたAPIキーを取得
      const settings = await getStoredSettings();
      if (settings.apiKey) {
        setApiKey(settings.apiKey);
        setHasStoredApiKey(true);
      } else {
        setShowApiKeyInput(true);
      }

      // 現在のYouTube動画IDを取得（YouTubeページを開いている場合）
      const currentVideoId = await getCurrentYouTubeVideoId();
      if (currentVideoId) {
        // YouTubeページを開いている場合は、YouTubeモードをデフォルトに設定
        setMode('youtube');
        setVideoId(currentVideoId);
      } else {
        // YouTubeページ以外では自由入力モードをデフォルトに設定
        setMode('manual');
      }
    };

    initialize();
  }, []);

  // APIキーを再設定
  const resetApiKey = () => {
    setApiKey('');
    setHasStoredApiKey(false);
    setShowApiKeyInput(true);
    saveSettings({ apiKey: '' });
  };

  // 要約処理
  const handleSummarize = async () => {
    setError('');
    setSummary('');
    setIsLoading(true);
    setCopySuccess(false);

    // ローディング進捗のシミュレーション
    setLoadingProgress(0);
    const progressInterval = setInterval(() => {
      setLoadingProgress(prev => {
        // 95%までしか進まないようにする（完了は別で処理）
        if (prev >= 95) {
          clearInterval(progressInterval);
          return 95;
        }
        return prev + Math.floor(Math.random() * 10) + 1;
      });
    }, 500);

    try {
      // APIキーが入力されていない場合
      if (!apiKey) {
        setError('OpenAI APIキーを入力してください');
        setIsLoading(false);
        return;
      }

      // YouTubeモードで動画IDが入力されていない場合
      if (mode === 'youtube' && !videoId) {
        setError('YouTube動画IDを入力してください');
        setIsLoading(false);
        return;
      }

      // 自由入力モードでテキストが入力されていない場合
      if (mode === 'manual' && !text) {
        setError('要約するテキストを入力してください');
        setIsLoading(false);
        return;
      }

      // APIリクエスト
      const request: SummarizeRequest = mode === 'youtube'
        ? { mode: 'youtube', videoId, apiKey }
        : { mode: 'manual', text, apiKey };

      const response = await redaxios.post(`${config.apiUrl}/summarize`, request, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = response.data as SummarizeResponse;

      // APIキーが有効な場合は保存
      if (!hasStoredApiKey && apiKey) {
        await saveSettings({ apiKey });
        setHasStoredApiKey(true);
        setShowApiKeyInput(false);
      }

      if (data.success) {
        setSummary(data.summary);
      } else {
        setError(data.error);
      }
    } catch (err: any) {
      console.error('要約エラー:', err);

      // redaxiosのエラーレスポンスを処理
      if (err.response && err.response.data && err.response.data.error) {
        // サーバーからのエラーメッセージがある場合
        setError(err.response.data.error);
      } else if (err.message) {
        // エラーメッセージがある場合
        setError(`エラー: ${err.message}`);
      } else {
        // その他のエラー
        setError('要約処理中にエラーが発生しました。サーバーが起動しているか確認してください。');
      }
    } finally {
      clearInterval(progressInterval);
      setLoadingProgress(100);
      setIsLoading(false);
    }
  };

  // クリップボードにコピー
  const copyToClipboard = () => {
    navigator.clipboard.writeText(summary).then(() => {
      // コピー成功状態を設定
      setCopySuccess(true);
      // 3秒後に成功表示を消す
      setTimeout(() => {
        setCopySuccess(false);
      }, 3000);
    });
  };

  return (
    <div className="container">
      <h1>Gistify</h1>
      <p className="subtitle">YouTube字幕・テキスト要約ツール</p>

      {/* モード選択 */}
      <div className="form-group">
        <label htmlFor="mode">モード選択:</label>
        <select
          id="mode"
          value={mode}
          onChange={(e) => setMode(e.target.value as 'youtube' | 'manual')}
          className="select-input"
        >
          <option value="youtube">YouTube字幕</option>
          <option value="manual">自由入力</option>
        </select>
      </div>

      {/* YouTube動画ID入力 */}
      {mode === 'youtube' && (
        <div className="form-group">
          <label htmlFor="videoId">YouTube動画ID:</label>
          <input
            type="text"
            id="videoId"
            value={videoId}
            onChange={(e) => setVideoId(e.target.value)}
            placeholder="例: dQw4w9WgXcQ または完全なURL"
            className="text-input"
          />
        </div>
      )}

      {/* 自由入力テキスト */}
      {mode === 'manual' && (
        <div className="form-group">
          <label htmlFor="text">要約するテキスト:</label>
          <textarea
            id="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="要約したいテキストを入力してください"
            rows={5}
            className="textarea-input"
          />
        </div>
      )}

      {/* APIキー入力 */}
      {(showApiKeyInput || !hasStoredApiKey) && (
        <div className="form-group">
          <label htmlFor="apiKey">OpenAI APIキー:</label>
          <input
            type="password"
            id="apiKey"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-..."
            className="text-input"
          />
          <p className="hint">※APIキーは端末内に保存されます</p>
        </div>
      )}

      {/* ボタン */}
      <div className="button-group">
        <button
          onClick={handleSummarize}
          disabled={isLoading}
          className="primary-button"
        >
          {isLoading ? '要約中...' : '要約する'}
        </button>

        {hasStoredApiKey && (
          <button onClick={resetApiKey} className="secondary-button">
            APIキーを再設定
          </button>
        )}
      </div>

      {/* ローディングインジケーター */}
      {isLoading && (
        <div className="loading-container">
          <div className="loading-bar-background">
            <div
              className="loading-bar-progress"
              style={{ width: `${loadingProgress}%` }}
            ></div>
          </div>
          <div className="loading-text">{loadingProgress}% 完了</div>
        </div>
      )}

      {/* エラーメッセージ */}
      {error && <div className="error-message">{error}</div>}

      {/* 要約結果 */}
      {summary && (
        <div className="result-container">
          <div className="result-header">
            <h2>要約結果</h2>
            <button
              onClick={copyToClipboard}
              className={`copy-button ${copySuccess ? 'copy-success' : ''}`}
            >
              {copySuccess ? 'コピーしました！' : 'コピー'}
            </button>
          </div>
          <pre className="summary-text">{summary}</pre>
        </div>
      )}

      <footer>
        <p>© 2025 Gistify - OpenAI API を使用</p>
        <p className="version">v{config.version}</p>
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
