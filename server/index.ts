import { Hono, type ExecutionContext } from "hono";

import { appConfig } from "./config/index.ts";
import { initializeRouter } from "./routes/index.ts";

// グローバル変数
let app: Hono;

/**
 * サーバー起動関数
 */
async function startServer() {
  try {
    // ルーターの初期化
    app = await initializeRouter();

    // サーバー起動
    const port = appConfig.port;
    console.log(`動画より文字派！ API Server starting on port ${port}...`);
  } catch (error) {
    console.error("サーバー起動エラー:", error);
    process.exit(1);
  }
}

// サーバー起動
startServer().catch(console.error);

// Deno/Bun用のエクスポート
export default {
  port: appConfig.port,
  fetch: (request: Request, env?: Record<string, unknown>, ctx?: unknown) => {
    if (!app) {
      return new Response("Server is starting...", { status: 503 });
    }
    return app.fetch(request, env, ctx as ExecutionContext);
  },
};
