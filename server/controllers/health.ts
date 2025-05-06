import { Context } from "hono";

import { isMockMode, isDevelopment } from "../config/index.js";

/**
 * ヘルスチェックコントローラー
 * APIサーバーの状態確認用エンドポイントを提供
 */
export class HealthController {
  /**
   * ヘルスチェックハンドラー
   * @param c Honoコンテキスト
   * @returns ヘルスチェック結果
   */
  async handleHealthCheck(c: Context): Promise<Response> {
    return c.json({
      status: "ok",
      message: "動画より文字派！ API Server is running",
      mode: isMockMode ? "mock" : "production",
      env: isDevelopment ? "development" : "production",
    });
  }
}

// コントローラーのインスタンスを作成
export const healthController = new HealthController();
