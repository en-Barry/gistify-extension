/**
 * モック関連の機能を提供するモジュール
 * 開発時にOpenAI APIを呼び出さずにテストするためのモックデータを提供
 */

// モック用の要約結果
export const MOCK_SUMMARY = `
# 要約結果（モックモード）

## 主なポイント
- これはモックモードでの要約結果です
- 実際のOpenAI APIは呼び出されていません
- 開発・テスト時にAPIキーのクォータを消費しません

## 詳細
このモードでは、OpenAI APIを実際に呼び出す代わりに、あらかじめ用意された要約結果を返します。
これにより、APIキーのクォータ制限に達した場合でも、アプリケーションの機能をテストできます。

## 一番伝えたかったメッセージ
「モックモードを使用することで、開発効率を向上させつつ、APIコストを削減できます」
`;

// YouTube字幕のモックデータ
export const MOCK_YOUTUBE_SUBTITLES = [
  { text: 'こんにちは、今日は人工知能について話します。', start: 0, dur: 5 },
  { text: 'AIは私たちの生活を大きく変えつつあります。', start: 5, dur: 5 },
  {
    text: '特に自然言語処理の進歩は目覚ましいものがあります。',
    start: 10,
    dur: 5,
  },
  { text: 'ChatGPTやClaudeなどの大規模言語モデルは、', start: 15, dur: 5 },
  { text: '人間のような文章を生成することができます。', start: 20, dur: 5 },
  { text: 'これらのモデルは様々な用途に活用されています。', start: 25, dur: 5 },
  { text: '例えば、文章要約、翻訳、質問応答などです。', start: 30, dur: 5 },
  { text: '今後もAI技術はさらに発展していくでしょう。', start: 35, dur: 5 },
  { text: 'ご視聴ありがとうございました。', start: 40, dur: 5 },
];

/**
 * モックの字幕データを取得する関数
 * @returns 字幕データの配列
 */
export const getMockSubtitles = () => {
  return MOCK_YOUTUBE_SUBTITLES;
};

/**
 * モックの要約を取得する関数
 * @param text 要約するテキスト（モックモードでは使用されない）
 * @returns モックの要約結果
 */
export const getMockSummary = (text?: string) => {
  console.log('モックモードで要約を生成: 実際のOpenAI APIは呼び出されません');

  // テキストの内容に応じて異なるモック応答を返すこともできる
  if (text && text.length < 100) {
    return `
# 短いテキストの要約（モックモード）

入力されたテキストが短すぎるため、十分な要約ができません。
より詳細なテキストを入力してください。
`;
  }

  return MOCK_SUMMARY;
};
