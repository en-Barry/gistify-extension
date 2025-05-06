import DOMPurify from 'dompurify';
import React, { useState } from 'react';

type SummaryResultProps = {
  summary: string;
};

export const SummaryResult: React.FC<SummaryResultProps> = ({ summary }) => {
  const [copySuccess, setCopySuccess] = useState(false);

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
    <div className='result-container'>
      <div className='result-header'>
        <h2>要約結果</h2>
        <button
          type='button'
          onClick={copyToClipboard}
          className={`copy-button ${copySuccess ? 'copy-success' : ''}`}
        >
          {copySuccess ? 'コピーしました！' : 'コピー'}
        </button>
      </div>
      <pre className='summary-text'>{DOMPurify.sanitize(summary)}</pre>
    </div>
  );
};
