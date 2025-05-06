import React from 'react';

type ApiKeyInputProps = {
  apiKey: string;
  setApiKey: (apiKey: string) => void;
  showHint?: boolean;
};

export const ApiKeyInput: React.FC<ApiKeyInputProps> = ({
  apiKey,
  setApiKey,
  showHint = true
}) => {
  return (
    <div className='form-group'>
      <label htmlFor='apiKey'>OpenAI APIキー:</label>
      <input
        type='password'
        id='apiKey'
        value={apiKey}
        onChange={(e) => setApiKey(e.target.value)}
        placeholder='sk-...'
        className='text-input'
      />
      {showHint && <p className='hint'>※APIキーは端末内に保存されます</p>}
    </div>
  );
};
