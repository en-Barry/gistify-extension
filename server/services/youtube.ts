import { getSubtitles } from "youtube-captions-scraper";

/**
 * YouTube字幕取得サービス
 * YouTubeの字幕を取得し、テキストとして連結する機能を提供
 */
export class YouTubeService {
  /**
   * YouTube動画IDから字幕を取得し、テキストとして連結
   * @param videoId YouTube動画ID
   * @returns 連結された字幕テキスト
   * @throws 字幕取得に失敗した場合
   */
  async getSubtitlesText(videoId: string): Promise<string> {
    try {
      // まず日本語字幕を試す
      const subtitles = await getSubtitles({
        videoID: videoId,
        lang: "ja",
      });

      let subtitlesText = subtitles
        .map((item) => item.text)
        .join(" ")
        .trim();

      // 日本語字幕が取得できなかった場合は英語で再試行
      if (!subtitlesText) {
        const enSubtitles = await getSubtitles({
          videoID: videoId,
          lang: "en",
        });

        subtitlesText = enSubtitles
          .map((item) => item.text)
          .join(" ")
          .trim();
      }

      // それでも字幕が取得できなかった場合はエラー
      if (!subtitlesText) {
        throw new Error("字幕を取得できませんでした。動画IDを確認するか、自由入力モードをお試しください。");
      }

      return subtitlesText;
    } catch (error) {
      console.error("YouTube字幕取得エラー:", error);
      throw new Error("字幕の取得に失敗しました。動画IDを確認するか、自由入力モードをお試しください。");
    }
  }

  /**
   * YouTubeのURLから動画IDを抽出
   * @param url YouTube URL
   * @returns 動画ID、見つからない場合はnull
   */
  extractVideoId(url: string): string | null {
    const YOUTUBE_URL_REGEX = /https?:\/\/(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/;
    const match = url.match(YOUTUBE_URL_REGEX);
    return match ? match[1] : null;
  }
}

// モック用のYouTube字幕データ
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
export function getMockSubtitles() {
  return MOCK_YOUTUBE_SUBTITLES;
}

/**
 * モックの字幕テキストを取得する関数
 * @returns 連結された字幕テキスト
 */
export function getMockSubtitlesText(): string {
  return MOCK_YOUTUBE_SUBTITLES
    .map((item) => item.text)
    .join(" ")
    .trim();
}
