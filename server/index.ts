import { Hono } from "hono";
import { cors } from "hono/cors";
import { ContentfulStatusCode } from "hono/utils/http-status";
import OpenAI from "openai";
import { getSubtitles } from "youtube-captions-scraper";

import type { SummarizeRequest, SummarizeResponse } from "../shared/types.d.ts";

import { appConfig, isDevelopment, isMockMode } from "./config.ts";
import { getMockSummary, MockKv } from "./mock.ts";

// APIエラー用の型定義
interface ApiErrorWithStatus extends Error {
  status?: number;
  code?: string;
}

// エラーがステータスコードを持つかチェックする型ガード
function hasStatusCode(error: unknown): error is ApiErrorWithStatus {
  return (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    typeof (error as ApiErrorWithStatus).status === "number"
  );
}

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

// Deno KVと環境変数の初期化をasync IIFEで行う
interface KvStore {
  get(key: string): Promise<{ value: string | null }>;
  set(key: string, value: string): Promise<void>;
  delete(key: string): Promise<void>;
}

let kv: KvStore;
let SLACK_BOT_TOKEN: string;
(async () => {
  if (process.env.NODE_ENV === 'development') {
    kv = new MockKv();
    SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN || '';
  } else {
    // Denoのグローバルオブジェクトはbunでは存在しないため、動作環境で条件分岐
    // @ts-expect-error Deno Deploy環境でのみ存在するグローバルオブジェクトのため
    kv = await Deno.openKv();
    // @ts-expect-error Deno Deploy環境でのみ存在するグローバルオブジェクトのため
    SLACK_BOT_TOKEN = Deno.env.get('SLACK_BOT_TOKEN') || '';
  }
})();

// YouTubeリンク抽出用正規表現
const YOUTUBE_URL_REGEX =
  /https?:\/\/(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/;

// Slackイベント受信エンドポイント
app.post("/slack/events", async (c) => {
  try {
    const body = await c.req.json();

    // URL検証用challengeパラメータがあればそのまま返す
    if (body.challenge) {
      return c.text(body.challenge);
    }

    const event = body.event;

    // botメッセージなどsubtypeがあれば無視
    if (event.subtype) {
      return c.text("subtype message ignored");
    }

    // メンションテキストが@動画より文字派！で始まるかチェック
    if (!event.text || !event.text.startsWith("@動画より文字派！")) {
      return c.text("not target mention");
    }

    // YouTubeリンク抽出
    const match = event.text.match(YOUTUBE_URL_REGEX);
    if (!match) {
      return c.text("YouTubeリンクが見つかりません");
    }

    const videoId = match[1];

    // ユーザーIDからAPIキーをDeno KVから取得
    const userKey = `user:${event.user}`;
    const kvResult = await kv.get(userKey);
    if (!kvResult.value) {
      return c.text(
        "APIキーが未登録です。まず `/setapikey` で登録してください",
      );
    }

    // Base64デコードしてAPIキー取得
    const apiKey = atob(kvResult.value);

    // ここで字幕取得、要約、Slack返信の処理を続ける

    // 字幕取得
    let subtitlesText = "";
    try {
      const subtitles = await getSubtitles({
        videoID: videoId,
        lang: "ja",
      });
      subtitlesText = subtitles.map((item) => item.text).join(" ").trim();
      if (!subtitlesText) {
        const enSubtitles = await getSubtitles({
          videoID: videoId,
          lang: "en",
        });
        subtitlesText = enSubtitles.map((item) => item.text).join(" ").trim();
      }
      if (!subtitlesText) {
        await c.text("字幕を取得できませんでした");
        return;
      }
    } catch (e) {
      console.error("字幕取得エラー:", e);
      await c.text("字幕を取得できませんでした");
      return;
    }

    // OpenAI APIで要約
    let summary = "";
    try {
      const openai = new OpenAI({
        apiKey: apiKey,
      });
      const response = await openai.chat.completions.create({
        model: "gpt-4.1-nano-2025-04-14",
        messages: [
          {
            role: "system",
            content:
              `以下は動画の文字起こしです。出演者が本当に伝えたいことが伝わるように、内容をわかりやすくまとめてください\n` +
              `- 単なる要約ではなく、構造的に整理し、伝えたい主張が明確になるようにしてください\n` +
              `- ポイントごとに見出しをつけてください。見出しの冒頭に絵文字を付けて、見やすさを向上させてください\n` +
              `- 最後に出演者の「一番伝えたかったメッセージ」を一文でまとめてください\n`,
          },
          {
            role: "user",
            content:
              `以下が動画の文字起こし全文です。要約をお願いします：\n\n${subtitlesText}`,
          },
        ],
        temperature: 0.5,
        max_tokens: 1500,
      });
      summary = response.choices[0]?.message.content ||
        "要約を生成できませんでした。";
    } catch (apiError: unknown) {
      console.error("OpenAI API呼び出しエラー:", apiError);
      if (hasStatusCode(apiError)) {
        const status = apiError.status;
        if (status === 401) {
          await c.text(
            "OpenAI APIキーが無効です。正しいAPIキーを入力してください。",
          );
          return;
        } else if (status === 429) {
          await c.text(
            "OpenAI APIのクォータ制限に達しました。APIキーの利用制限を確認してください。",
          );
          return;
        }
      }
      await c.text("要約処理に失敗しました");
      return;
    }

    // Slack chat.postMessageでスレッド返信
    try {
      const threadTs = event.thread_ts || event.ts;
      const postBody = {
        channel: event.channel,
        text: summary,
        thread_ts: threadTs,
      };
      const res = await fetch("https://slack.com/api/chat.postMessage", {
        method: "POST",
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          Authorization: `Bearer ${SLACK_BOT_TOKEN}`,
        },
        body: JSON.stringify(postBody),
      });
      const resJson = await res.json();
      if (!resJson.ok) {
        console.error("Slack chat.postMessageエラー:", resJson);
      }
    } catch (e) {
      console.error("Slack chat.postMessage送信エラー:", e);
    }

    return c.text("イベント処理完了");
  } catch (error) {
    console.error("Slackイベント処理エラー:", error);
    return c.text("要約処理に失敗しました", 500);
  }
});

// ヘルスチェック用エンドポイント
app.get("/", (c) => {
  return c.json({
    status: "ok",
    message: "動画より文字派！ API Server is running",
    mode: isMockMode ? "mock" : "production",
    env: isDevelopment ? "development" : "production",
  });
});

// 要約APIエンドポイント
app.post("/summarize", async (c) => {
  try {
    const body = await c.req.json() as SummarizeRequest;
    const { apiKey } = body;

    // OpenAI APIクライアントの初期化
    const openai = new OpenAI({
      apiKey: apiKey,
    });

    let textToSummarize: string;

    // モードに応じて処理を分岐
    if (body.mode === "youtube") {
      // YouTube字幕を取得
      try {
        const subtitles = await getSubtitles({
          videoID: body.videoId,
          lang: "ja", // デフォルトは日本語
        });

        // 字幕テキストを連結
        textToSummarize = subtitles
          .map((item) => item.text)
          .join(" ")
          .trim();

        // 字幕が取得できなかった場合は英語で再試行
        if (!textToSummarize) {
          const enSubtitles = await getSubtitles({
            videoID: body.videoId,
            lang: "en",
          });

          textToSummarize = enSubtitles
            .map((item) => item.text)
            .join(" ")
            .trim();
        }

        if (!textToSummarize) {
          return c.json({
            success: false,
            error:
              "字幕を取得できませんでした。動画IDを確認するか、自由入力モードをお試しください。",
          } as SummarizeResponse, 400);
        }
      } catch (error) {
        console.error("YouTube字幕取得エラー:", error);
        return c.json({
          success: false,
          error:
            "字幕の取得に失敗しました。動画IDを確認するか、自由入力モードをお試しください。",
        } as SummarizeResponse, 400);
      }
    } else if (body.mode === "manual") {
      // 自由入力モードの場合はそのままテキストを使用
      textToSummarize = body.text;

      if (!textToSummarize || textToSummarize.trim().length === 0) {
        return c.json({
          success: false,
          error: "要約するテキストを入力してください。",
        } as SummarizeResponse, 400);
      }
    } else {
      return c.json({
        success: false,
        error: "不正なモードが指定されました。",
      } as SummarizeResponse, 400);
    }

    let summary = "";

    // モックモードの場合は、OpenAI APIを呼び出さずにモック結果を返す
    if (isMockMode) {
      summary = getMockSummary(textToSummarize);
    } else {
      // 本番モード: OpenAI APIを使用して要約を生成
      try {
        const response = await openai.chat.completions.create({
          model: "gpt-4.1-nano-2025-04-14",
          messages: [
            {
              role: "system",
              content:
                `以下は動画の文字起こしです。出演者が本当に伝えたいことが伝わるように、内容をわかりやすくまとめてください\n
                        - 単なる要約ではなく、構造的に整理し、伝えたい主張が明確になるようにしてください\n
                        - ポイントごとに見出しをつけてください。見出しの冒頭に絵文字を付けて、見やすさを向上させてください\n
                        - 最後に出演者の「一番伝えたかったメッセージ」を一文でまとめてください\n`,
            },
            {
              role: "user",
              content:
                `以下が動画の文字起こし全文です。要約をお願いします：\n\n${textToSummarize}`,
            },
          ],
          temperature: 0.5,
          max_tokens: 1500,
        });

        summary = response.choices[0]?.message.content ||
          "要約を生成できませんでした。";
      } catch (apiError: unknown) {
        console.error("OpenAI API呼び出しエラー:", apiError);

        // 開発モードの場合は、エラー時にもモック結果を返す
        if (isDevelopment) {
          console.log("開発モード: エラー時にモック結果を返します");
          summary = getMockSummary(textToSummarize);
        } else {
          // 本番モードではエラーを上位に伝播
          throw apiError;
        }
      }
    }

    // 要約結果を返す
    return c.json({
      success: true,
      summary,
    } as SummarizeResponse);
  } catch (error: unknown) {
    console.error("要約処理エラー:", error);

    // OpenAI APIのエラーをより詳細に処理
    let errorMessage = "要約処理中にエラーが発生しました。";

    if (hasStatusCode(error)) {
      if (error.status === 429) {
        errorMessage =
          "OpenAI APIのクォータ制限に達しました。APIキーの利用制限を確認してください。";
      } else if (error.status === 401) {
        errorMessage =
          "OpenAI APIキーが無効です。正しいAPIキーを入力してください。";
      } else if (error.code === "insufficient_quota") {
        errorMessage =
          "OpenAI APIの利用枠を超えました。請求情報を確認してください。";
      }
    }

    // ステータスコードを安全に取得
    const statusCode = hasStatusCode(error) ? error.status : 500;

    return c.json({
      success: false,
      error: errorMessage,
    } as SummarizeResponse, statusCode as unknown as ContentfulStatusCode);
  }
});

// スラッシュコマンド用エンドポイント
app.post("/slack/command", async (c) => {
  try {
    const formData = await c.req.formData();
    const command = formData.get("command")?.toString() || "";
    const text = formData.get("text")?.toString() || "";
    const userId = formData.get("user_id")?.toString() || "";

    if (!userId) {
      return c.text("ユーザーIDが取得できませんでした", 400);
    }

    if (command === "/setapikey") {
      // APIキーをBase64エンコードしてDeno KVに保存
      const encodedKey = btoa(text);
      await kv.set(`user:${userId}`, encodedKey);
      return c.text("APIキーを登録しました");
    } else if (command === "/deleteapikey") {
      // Deno KVから削除
      await kv.delete(`user:${userId}`);
      return c.text("APIキーを削除しました");
    } else {
      return c.text("不明なコマンドです", 400);
    }
  } catch (error) {
    console.error("スラッシュコマンド処理エラー:", error);
    return c.text("コマンド処理に失敗しました", 500);
  }
});

// サーバー起動
const port = appConfig.port;
console.log(`動画より文字派！ API Server starting on port ${port}...`);

export default {
  port,
  fetch: app.fetch,
};
