import type {
  SummarizeRequest,
  SummarizeResponse,
} from '@shared/types.d.ts';
import { useState } from 'react';
import redaxios from 'redaxios';
import type { RedaxiosError } from 'redaxios';

import config from '../config.ts';

// redaxiosのエラーを判定する型ガード関数
function isRedaxiosError(
  error: unknown,
): error is RedaxiosError<{ error: string }> {
  return (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    typeof (error as RedaxiosError).response === 'object'
  );
}

export const useSummarize = () => {
  const [summary, setSummary] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);

  const summarize = async (
    mode: 'youtube' | 'manual',
    apiKey: string,
    content: { videoId?: string; text?: string },
    onApiKeyValid?: (key: string) => Promise<void>,
  ) => {
    setError('');
    setSummary('');
    setIsLoading(true);

    // ローディング進捗のシミュレーション
    setLoadingProgress(0);
    const progressInterval = setInterval(() => {
      setLoadingProgress((prev) => {
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
        return false;
      }

      // YouTubeモードで動画IDが入力されていない場合
      if (mode === 'youtube' && !content.videoId) {
        setError('YouTube動画IDを入力してください');
        setIsLoading(false);
        return false;
      }

      // 自由入力モードでテキストが入力されていない場合
      if (mode === 'manual' && !content.text) {
        setError('要約するテキストを入力してください');
        setIsLoading(false);
        return false;
      }

      // APIリクエスト
      const request: SummarizeRequest = mode === 'youtube'
        ? { mode: 'youtube', videoId: content.videoId!, apiKey }
        : { mode: 'manual', text: content.text!, apiKey };

      const response = await redaxios.post(
        `${config.apiUrl}/summarize`,
        request,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      const data = response.data as SummarizeResponse;

      // APIキーが有効な場合はコールバックを実行
      if (onApiKeyValid) {
        await onApiKeyValid(apiKey);
      }

      if (data.success) {
        setSummary(data.summary);
        return true;
      } else {
        setError(data.error);
        return false;
      }
    } catch (err: unknown) {
      console.error('要約エラー:', err);

      // redaxiosのエラーレスポンスを処理
      if (isRedaxiosError(err) && err.response?.data?.error) {
        // サーバーからのエラーメッセージがある場合
        setError(err.response.data.error);
      } else if (err instanceof Error) {
        // エラーメッセージがある場合
        setError(`エラー: ${err.message}`);
      } else {
        // その他のエラー
        setError(
          '要約処理中にエラーが発生しました。サーバーが起動しているか確認してください。',
        );
      }
      return false;
    } finally {
      clearInterval(progressInterval);
      setLoadingProgress(100);
      setIsLoading(false);
    }
  };

  return {
    summary,
    error,
    isLoading,
    loadingProgress,
    summarize,
    setSummary,
    setError,
  };
};
