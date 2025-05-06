import React from 'react';

type LoadingIndicatorProps = {
  progress: number;
};

export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({ progress }) => {
  return (
    <div className='loading-container'>
      <div className='loading-bar-background'>
        <div
          className='loading-bar-progress'
          style={{ width: `${progress}%` }}
        >
        </div>
      </div>
      <div className='loading-text'>{progress}% 完了</div>
    </div>
  );
};
