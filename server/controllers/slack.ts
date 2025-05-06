import { Context } from "hono";

import { appConfig } from "../config/index.ts";
import { UserApiKeyManager } from "../services/kv-store.ts";
import { OpenAIService } from "../services/openai.ts";
import { SlackService } from "../services/slack.ts";
import { YouTubeService } from "../services/youtube.ts";

/**
 * Slack連携コントローラー
 * Slackイベント処理とスラッシュコマンド処理を提供
 */
export class SlackController {
  private slackService: SlackService;
  private youtubeService: YouTubeService;
  private kvStore: UserApiKeyManager;
  // 重複イベント処理を防止するためのキャッシュ
  private static eventIdCache = new Set<string>();
  private static readonly MAX_CACHE_SIZE = 100;

  /**
   * コンストラクタ
   * @param kvStore KVストア
   */
  constructor(kvStore: UserApiKeyManager) {
    this.slackService = new SlackService();
    this.youtubeService = new YouTubeService();
    this.kvStore = kvStore;
  }

  /**
   * Slackイベント処理ハンドラー
   * @param c Honoコンテキスト
   * @returns レスポンス
   */
  async handleEvents(c: Context): Promise<Response> {
    try {
      const body = await c.req.json();

      // URL検証用challengeパラメータがあればそのまま返す
      if (body.challenge) {
        return c.text(body.challenge);
      }

      const event = body.event;

      // 重複イベント処理を防止（Slackからの再試行対応）
      if (body.event_id && body.event_time) {
        // キャッシュがMAX_CACHE_SIZEを超えたら古いものから削除
        if (SlackController.eventIdCache.size >= SlackController.MAX_CACHE_SIZE) {
          const firstItem = SlackController.eventIdCache.values().next().value;
          if (firstItem) {
            SlackController.eventIdCache.delete(firstItem);
          }
        }

        // 既に処理済みのイベントであれば無視
        if (SlackController.eventIdCache.has(body.event_id)) {
          console.log(`重複イベント検出：${body.event_id}をスキップします`);
          return c.text("duplicate event");
        }

        // 新しいイベントIDをキャッシュに追加
        SlackController.eventIdCache.add(body.event_id);
      }

      // ボットメンションかどうかをチェック
      if (!this.slackService.isBotMention(event, appConfig.slackBotMemberId!)) {
        return c.text("not target mention");
      }

      // YouTubeリンク抽出
      const videoId = this.slackService.extractYouTubeVideoId(event.text);
      if (!videoId) {
        return c.text("YouTubeリンクが見つかりません");
      }

      // ユーザーIDからAPIキーを取得
      const apiKey = await this.kvStore.getApiKey(event.user);
      if (!apiKey) {
        return c.text(
          "APIキーが未登録です。まず `/setapikey` で登録してください",
        );
      }

      // 字幕取得
      let subtitlesText: string;
      try {
        subtitlesText = await this.youtubeService.getSubtitlesText(videoId);
      } catch (e) {
        console.error("字幕取得エラー:", e);
        return c.text("字幕を取得できませんでした");
      }

      // OpenAI APIで要約
      let summary: string;
      try {
        const openaiService = new OpenAIService(apiKey);
        summary = await openaiService.summarizeText(subtitlesText);
      } catch (apiError: unknown) {
        console.error("OpenAI API呼び出しエラー:", apiError);

        if (apiError instanceof Error) {
          if ('status' in apiError && apiError.status === 401) {
            return c.text(
              "OpenAI APIキーが無効です。正しいAPIキーを入力してください。",
            );
          } else if ('status' in apiError && apiError.status === 429) {
            return c.text(
              "OpenAI APIのクォータ制限に達しました。APIキーの利用制限を確認してください。",
            );
          }
        }

        return c.text("要約処理に失敗しました");
      }

      // Slack chat.postMessageでスレッド返信
      try {
        const threadTs = event.thread_ts || event.ts;
        await this.slackService.postMessage(event.channel, summary, threadTs);
      } catch (e) {
        console.error("Slack chat.postMessage送信エラー:", e);
      }

      return c.text("イベント処理完了");
    } catch (error) {
      console.error("Slackイベント処理エラー:", error);
      return c.text("要約処理に失敗しました", 500);
    }
  }

  /**
   * スラッシュコマンド処理ハンドラー
   * @param c Honoコンテキスト
   * @returns レスポンス
   */
  async handleCommands(c: Context): Promise<Response> {
    try {
      const formData = await c.req.formData();
      const command = formData.get("command")?.toString() || "";
      const text = formData.get("text")?.toString() || "";
      const userId = formData.get("user_id")?.toString() || "";

      if (!userId) {
        return c.text("ユーザーIDが取得できませんでした", 400);
      }

      if (command === "/setapikey") {
        // APIキーを保存
        await this.kvStore.setApiKey(userId, text);
        return c.text("APIキーを登録しました");
      } else if (command === "/deleteapikey") {
        // APIキーを削除
        await this.kvStore.deleteApiKey(userId);
        return c.text("APIキーを削除しました");
      } else {
        return c.text("不明なコマンドです", 400);
      }
    } catch (error) {
      console.error("スラッシュコマンド処理エラー:", error);
      return c.text("コマンド処理に失敗しました", 500);
    }
  }
}
