import { useState, useEffect } from 'react';

import type { AppSettings } from '../../../shared/types.d.ts';

// Chrome StorageからAPIキーを取得する関数
const getStoredSettings = (): Promise<AppSettings> => {
  return new Promise((resolve) => {
    chrome.storage.local.get(['apiKey'], (result: Record<string, unknown>) => {
      resolve({
        apiKey: (result.apiKey as string) || '',
      });
    });
  });
};

// Chrome StorageにAPIキーを保存する関数
const saveSettings = (settings: AppSettings): Promise<void> => {
  return new Promise((resolve) => {
    chrome.storage.local.set(settings, () => {
      resolve();
    });
  });
};

// APIキー管理用カスタムフック
export const useApiKey = () => {
  const [apiKey, setApiKey] = useState('');
  const [hasStoredApiKey, setHasStoredApiKey] = useState(false);
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      const settings = await getStoredSettings();
      if (settings.apiKey) {
        setApiKey(settings.apiKey);
        setHasStoredApiKey(true);
      } else {
        setShowApiKeyInput(true);
      }
    };
    initialize();
  }, []);

  const saveApiKey = async (key: string) => {
    await saveSettings({ apiKey: key });
    setHasStoredApiKey(true);
    setShowApiKeyInput(false);
  };

  const resetApiKey = async () => {
    setApiKey('');
    setHasStoredApiKey(false);
    setShowApiKeyInput(true);
    await saveSettings({ apiKey: '' });
  };

  return {
    apiKey,
    setApiKey,
    hasStoredApiKey,
    showApiKeyInput,
    saveApiKey,
    resetApiKey,
  };
};
