import React from 'react';

type TextInputProps = {
  text: string;
  setText: (text: string) => void;
};

export const TextInput: React.FC<TextInputProps> = ({ text, setText }) => {
  return (
    <div className='form-group'>
      <label htmlFor='text'>要約するテキスト:</label>
      <textarea
        id='text'
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder='要約したいテキストを入力してください'
        rows={5}
        className='textarea-input'
      />
    </div>
  );
};
