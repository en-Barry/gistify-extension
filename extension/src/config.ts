/**
 * フロントエンド用の設定ファイル
 * 環境変数やアプリケーション設定を一元管理
 */

// 環境変数の型定義
interface AppConfig {
  apiUrl: string;
  isDevelopment: boolean;
  version: string;
}

// Viteの環境変数を安全に取得する関数
const getEnvVar = (key: string, defaultValue: string): string => {
  // Viteの環境変数にアクセス
  const value = (import.meta.env as Record<string, unknown>)[key];
  return value !== undefined ? String(value) : defaultValue;
};

// 環境変数から値を取得
const isDev = getEnvVar('MODE', 'development') === 'development';
const apiUrl = getEnvVar('VITE_API_URL', 'http://localhost:3000');
const appVersion = getEnvVar('VITE_APP_VERSION', '1.0.0');

// アプリケーション設定
export const config: AppConfig = {
  // APIサーバーのURL（環境変数から取得、デフォルトはローカルホスト）
  apiUrl: apiUrl,

  // 開発モードかどうか
  isDevelopment: isDev,

  // アプリケーションバージョン
  version: appVersion
};

// 設定情報をログ出力（開発モードのみ）
if (config.isDevelopment) {
  console.log('アプリケーション設定:', config);
}

// 設定をエクスポート
export default config;
