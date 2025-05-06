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
    // パターンを拡張して複数の形式に対応
    const YOUTUBE_URL_PATTERNS = [
      /https?:\/\/(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
      /https?:\/\/youtu\.be\/([a-zA-Z0-9_-]{11})/,
      /https?:\/\/(?:www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
      /https?:\/\/(?:www\.)?youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
      /https?:\/\/(?:www\.)?youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/
    ];

    // すべてのパターンで順番にマッチを試みる
    for (const pattern of YOUTUBE_URL_PATTERNS) {
      const match = text.match(pattern);
      if (match) {
        console.log(`YouTubeリンク検出: パターン ${pattern} でマッチしました`);
        return match[1];
      }
    }

    console.log(`YouTubeリンク検出失敗: "${text}"`);
    return null;
  }

  /**
   * Slackイベントがボットメンションかどうかを判定
   * @param event Slackイベント
   * @param botMentionPrefix ボットメンションの接頭辞
   * @returns ボットメンションかどうか
   */
  isBotMention(event: { subtype?: string; text?: string }, botMentionPrefix: string): boolean {
    // デバッグ用ログ
    console.log(`isBotMention checking: event=${JSON.stringify(event)}, botMentionPrefix=${botMentionPrefix}`);

    // botメッセージなどsubtypeがあれば無視
    if (event.subtype) {
      console.log(`isBotMention: subtype ${event.subtype} のため無視`);
      return false;
    }

    // メンションテキストが指定の接頭辞で始まるかチェック
    if (!event.text) {
      console.log(`isBotMention: event.text がないため無視`);
      return false;
    }

    // より柔軟なメンション検出（startsWith だけでなく includes も使用）
    const hasMention = event.text.startsWith(botMentionPrefix) || event.text.includes(botMentionPrefix);
    console.log(`isBotMention: text="${event.text}", 検出結果=${hasMention}`);

    return hasMention;
  }
}
