import process from 'node:process';

import { config } from 'dotenv';

// .envファイルを読み込む
config();

// 環境変数の型定義
export interface AppConfig {
  nodeEnv: string;
  mockMode: boolean;
  port: number;
  openaiApiKey?: string;
  slackBotToken: string;
  slackBotName: string;
}

// 環境変数を取得し、デフォルト値を設定
export const appConfig: AppConfig = {
  nodeEnv: process.env.NODE_ENV || 'development',
  mockMode: process.env.NODE_ENV === 'production'
    ? false
    : process.env.MOCK_MODE === 'true',
  port: parseInt(process.env.PORT || '3000', 10),
  openaiApiKey: process.env.OPENAI_API_KEY,
  slackBotToken: process.env.SLACK_BOT_TOKEN || '',
  slackBotName: process.env.SLACK_BOT_NAME || '@動画より文字派',
};

// 開発モードかどうかを判定
export const isDevelopment = appConfig.nodeEnv === 'development';

// モックモードかどうかを判定
export const isMockMode = appConfig.mockMode;

// 設定情報をログ出力（本番環境では最小限に、機密情報は除く）
if (isDevelopment) {
  console.log('アプリケーション設定:');
  console.log(`- 環境: ${appConfig.nodeEnv}`);
  console.log(`- モックモード: ${appConfig.mockMode}`);
  console.log(`- ポート: ${appConfig.port}`);
} else {
  console.log(`動画より文字派！ API Server (${appConfig.nodeEnv})`);
}
