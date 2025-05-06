import React from 'react';

type ModeSelectorProps = {
  mode: 'youtube' | 'manual';
  setMode: (mode: 'youtube' | 'manual') => void;
};

export const ModeSelector: React.FC<ModeSelectorProps> = ({ mode, setMode }) => {
  return (
    <div className='form-group'>
      <label htmlFor='mode'>モード選択:</label>
      <select
        id='mode'
        value={mode}
        onChange={(e) => setMode(e.target.value as 'youtube' | 'manual')}
        className='select-input'
      >
        <option value='youtube'>YouTube字幕</option>
        <option value='manual'>自由入力</option>
      </select>
    </div>
  );
};
