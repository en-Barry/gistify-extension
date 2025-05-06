/**
 * 要約リクエスト型定義
 * - YouTubeモード: 動画IDを指定して字幕を取得・要約
 * - 自由入力モード: ユーザーが入力したテキストを要約
 */
export type SummarizeRequest =
  | { mode: 'youtube'; videoId: string; apiKey: string }
  | { mode: 'manual'; text: string; apiKey: string };

/**
 * 要約レスポンス型定義
 * - 成功時: 要約テキストを返す
 * - 失敗時: エラーメッセージを返す
 */
export type SummarizeResponse =
  | { success: true; summary: string }
  | { success: false; error: string };

/**
 * Chrome Storage用の設定型定義
 */
export interface AppSettings {
  apiKey?: string;
}
