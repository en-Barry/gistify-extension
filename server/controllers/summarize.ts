import { Context } from "hono";
import { ContentfulStatusCode } from "hono/utils/http-status";

import type { SummarizeRequest, SummarizeResponse } from "../../shared/types.d.ts";
import { OpenAIService } from "../services/openai.js";
import { YouTubeService } from "../services/youtube.js";
import { handleOpenAIError } from "../utils/error.js";

/**
 * 要約APIコントローラー
 * テキスト要約機能を提供
 */
export class SummarizeController {
  private youtubeService: YouTubeService;

  constructor() {
    this.youtubeService = new YouTubeService();
  }

  /**
   * 要約APIハンドラー
   * @param c Honoコンテキスト
   * @returns 要約結果
   */
  async handleSummarize(c: Context): Promise<Response> {
    try {
      const body = await c.req.json() as SummarizeRequest;
      const { apiKey } = body;

      // OpenAI APIサービスの初期化
      const openaiService = new OpenAIService(apiKey);

      let textToSummarize: string;

      // モードに応じて処理を分岐
      if (body.mode === "youtube") {
        // YouTube字幕を取得
        try {
          textToSummarize = await this.youtubeService.getSubtitlesText(body.videoId);
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

      // テキストを要約
      try {
        const summary = await openaiService.summarizeText(textToSummarize);

        // 要約結果を返す
        return c.json({
          success: true,
          summary,
        } as SummarizeResponse);
      } catch (error) {
        console.error("要約処理エラー:", error);

        // OpenAI APIのエラーをより詳細に処理
        const { message: errorMessage, statusCode } = handleOpenAIError(error);

        return c.json({
          success: false,
          error: errorMessage,
        } as SummarizeResponse, statusCode as unknown as ContentfulStatusCode);
      }
    } catch (error: unknown) {
      console.error("要約処理エラー:", error);
      return c.json({
        success: false,
        error: "要約処理中にエラーが発生しました。",
      } as SummarizeResponse, 500);
    }
  }
}

// コントローラーのインスタンスを作成
export const summarizeController = new SummarizeController();
