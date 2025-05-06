import { appConfig } from "../config/index.ts";

/**
 * Slack連携サービス
 * Slackへのメッセージ送信機能を提供
 */
export class SlackService {
  private botToken: string;

  /**
   * コンストラクタ
   * @param botToken Slack Bot Token
   */
  constructor(botToken?: string) {
    this.botToken = botToken || appConfig.slackBotToken;
  }

  /**
   * Slackにメッセージを送信する
   * @param channel チャンネルID
   * @param text 送信するテキスト
   * @param threadTs スレッドのタイムスタンプ（スレッド返信の場合）
   * @returns 送信結果
   */
  async postMessage(channel: string, text: string, threadTs?: string): Promise<{ ok: boolean; error?: string }> {
    try {
      const postBody = {
        channel,
        text,
        ...(threadTs && { thread_ts: threadTs }),
      };

      const res = await fetch("https://slack.com/api/chat.postMessage", {
        method: "POST",
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          Authorization: `Bearer ${this.botToken}`,
        },
        body: JSON.stringify(postBody),
      });

      const resJson = await res.json();

      if (!resJson.ok) {
        console.error("Slack chat.postMessageエラー:", resJson);
      }

      return resJson;
    } catch (error) {
      console.error("Slack chat.postMessage送信エラー:", error);
      return { ok: false, error: "メッセージ送信に失敗しました" };
    }
  }

  /**
   * YouTubeリンクから動画IDを抽出
   * @param text テキスト
   * @returns 動画ID、見つからない場合はnull
   */
  extractYouTubeVideoId(text: string): string | null {
    const YOUTUBE_URL_REGEX = /https?:\/\/(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/;
    const match = text.match(YOUTUBE_URL_REGEX);
    return match ? match[1] : null;
  }

  /**
   * Slackイベントがボットメンションかどうかを判定
   * @param event Slackイベント
   * @param botMentionPrefix ボットメンションの接頭辞
   * @returns ボットメンションかどうか
   */
  isBotMention(event: { subtype?: string; text?: string }, botMentionPrefix: string): boolean {
    // botメッセージなどsubtypeがあれば無視
    if (event.subtype) {
      return false;
    }

    // メンションテキストが指定の接頭辞で始まるかチェック
    if (!event.text || !event.text.startsWith(botMentionPrefix)) {
      return false;
    }

    return true;
  }
}
