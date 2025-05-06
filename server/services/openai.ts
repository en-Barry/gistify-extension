import OpenAI from "openai";

import { isMockMode, isDevelopment } from "../config/index.js";

// モック用の要約結果
export const MOCK_SUMMARY = `
# 要約結果（モックモード）

## 主なポイント
- これはモックモードでの要約結果です
- 実際のOpenAI APIは呼び出されていません
- 開発・テスト時にAPIキーのクォータを消費しません

## 詳細
このモードでは、OpenAI APIを実際に呼び出す代わりに、あらかじめ用意された要約結果を返します。
これにより、APIキーのクォータ制限に達した場合でも、アプリケーションの機能をテストできます。

## 一番伝えたかったメッセージ
「モックモードを使用することで、開発効率を向上させつつ、APIコストを削減できます」
`;

/**
 * OpenAI APIサービス
 * テキスト要約機能を提供
 */
export class OpenAIService {
  private openai: OpenAI | null = null;

  /**
   * コンストラクタ
   * @param apiKey OpenAI APIキー
   */
  constructor(apiKey?: string) {
    if (apiKey) {
      this.openai = new OpenAI({
        apiKey,
      });
    }
  }

  /**
   * テキストを要約する
   * @param text 要約するテキスト
   * @returns 要約結果
   * @throws OpenAI API呼び出しエラー
   */
  async summarizeText(text: string): Promise<string> {
    // モックモードの場合はモック結果を返す
    if (isMockMode) {
      console.log('モックモードで要約を生成: 実際のOpenAI APIは呼び出されません');
      return this.getMockSummary(text);
    }

    // OpenAIクライアントが初期化されていない場合はエラー
    if (!this.openai) {
      throw new Error("OpenAI APIクライアントが初期化されていません。APIキーを確認してください。");
    }

    try {
      const response = await this.openai.chat.completions.create({
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
              `以下が動画の文字起こし全文です。要約をお願いします：\n\n${text}`,
          },
        ],
        temperature: 0.5,
        max_tokens: 1500,
      });

      return response.choices[0]?.message.content || "要約を生成できませんでした。";
    } catch (error) {
      console.error("OpenAI API呼び出しエラー:", error);

      // 開発モードの場合は、エラー時にもモック結果を返す
      if (isDevelopment) {
        console.log("開発モード: エラー時にモック結果を返します");
        return this.getMockSummary(text);
      }

      // エラーを上位に伝播
      throw error;
    }
  }

  /**
   * モックの要約を取得する
   * @param text 要約するテキスト（モックモードでは使用されない）
   * @returns モックの要約結果
   */
  private getMockSummary(text?: string): string {
    // テキストの内容に応じて異なるモック応答を返すこともできる
    if (text && text.length < 100) {
      return `
# 短いテキストの要約（モックモード）

入力されたテキストが短すぎるため、十分な要約ができません。
より詳細なテキストを入力してください。
`;
    }

    return MOCK_SUMMARY;
  }
}
