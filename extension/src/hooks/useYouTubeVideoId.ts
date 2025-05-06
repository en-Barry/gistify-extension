import { useState, useEffect } from 'react';

// 現在のYouTube動画IDを取得する関数
const getCurrentYouTubeVideoId = (): Promise<string | null> => {
  return new Promise((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const url = tabs[0]?.url || '';
      const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/);
      resolve(match ? match[1] : null);
    });
  });
};

export const useYouTubeVideoId = () => {
  const [mode, setMode] = useState<'youtube' | 'manual'>('manual');
  const [videoId, setVideoId] = useState<string>('');

  useEffect(() => {
    const initialize = async () => {
      const currentVideoId = await getCurrentYouTubeVideoId();
      if (currentVideoId) {
        setMode('youtube');
        setVideoId(currentVideoId);
      } else {
        setMode('manual');
      }
    };
    initialize();
  }, []);

  return { mode, setMode, videoId, setVideoId };
};
