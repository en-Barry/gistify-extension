import { Hono } from "hono";
import { cors } from "hono/cors";

import { healthController } from "../controllers/health.js";
import { SlackController } from "../controllers/slack.js";
import { summarizeController } from "../controllers/summarize.js";
import { createKvStore, UserApiKeyManager } from "../services/kv-store.js";

/**
 * アプリケーションルーターの初期化
 * @returns 初期化されたHonoアプリケーション
 */
export async function initializeRouter(): Promise<Hono> {
  const app = new Hono();

  // CORSを有効化（Chrome拡張からのリクエストを許可）
  app.use(
    "*",
    cors({
      origin: "*",
      allowMethods: ["POST", "GET", "OPTIONS"],
      allowHeaders: ["Content-Type"],
      exposeHeaders: ["Content-Length"],
      maxAge: 86400,
    }),
  );

  // KVストアの初期化
  const kvStore = await createKvStore();
  const userApiKeyManager = new UserApiKeyManager(kvStore);

  // Slackコントローラーの初期化
  const slackController = new SlackController(userApiKeyManager);

  // ヘルスチェック用エンドポイント
  app.get("/", (c) => healthController.handleHealthCheck(c));

  // 要約APIエンドポイント
  app.post("/summarize", (c) => summarizeController.handleSummarize(c));

  // Slackイベント受信エンドポイント
  app.post("/slack/events", (c) => slackController.handleEvents(c));

  // スラッシュコマンド用エンドポイント
  app.post("/slack/command", (c) => slackController.handleCommands(c));

  return app;
}
