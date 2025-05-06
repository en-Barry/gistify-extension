import { appConfig } from "./config/index.js";
import { initializeRouter } from "./routes/index.js";

// グローバル変数
let app: any;

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
  fetch: (request: Request, env: any, ctx: any) => {
    if (!app) {
      return new Response("Server is starting...", { status: 503 });
    }
    return app.fetch(request, env, ctx);
  },
};
