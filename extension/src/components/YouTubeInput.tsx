import React from 'react';

type YouTubeInputProps = {
  videoId: string;
  setVideoId: (videoId: string) => void;
};

export const YouTubeInput: React.FC<YouTubeInputProps> = ({ videoId, setVideoId }) => {
  return (
    <div className='form-group'>
      <label htmlFor='videoId'>YouTube動画ID:</label>
      <input
        type='text'
        id='videoId'
        value={videoId}
        onChange={(e) => setVideoId(e.target.value)}
        placeholder='例: dQw4w9WgXcQ または完全なURL'
        className='text-input'
      />
    </div>
  );
};
