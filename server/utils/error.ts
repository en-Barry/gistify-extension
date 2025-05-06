/**
 * APIエラー用の型定義
 */
export interface ApiErrorWithStatus extends Error {
  status?: number;
  code?: string;
}

/**
 * エラーがステータスコードを持つかチェックする型ガード
 * @param error チェック対象のエラー
 * @returns ステータスコードを持つエラーかどうか
 */
export function hasStatusCode(error: unknown): error is ApiErrorWithStatus {
  return (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    typeof (error as ApiErrorWithStatus).status === "number"
  );
}

/**
 * OpenAIのAPIエラーを処理し、ユーザーフレンドリーなエラーメッセージを返す
 * @param error 発生したエラー
 * @returns ユーザーフレンドリーなエラーメッセージとステータスコード
 */
export function handleOpenAIError(error: unknown): { message: string; statusCode: number } {
  let errorMessage = "要約処理中にエラーが発生しました。";
  let statusCode = 500;

  if (hasStatusCode(error)) {
    statusCode = error.status || 500;

    if (error.status === 429) {
      errorMessage = "OpenAI APIのクォータ制限に達しました。APIキーの利用制限を確認してください。";
    } else if (error.status === 401) {
      errorMessage = "OpenAI APIキーが無効です。正しいAPIキーを入力してください。";
    } else if (error.code === "insufficient_quota") {
      errorMessage = "OpenAI APIの利用枠を超えました。請求情報を確認してください。";
    }
  }

  return { message: errorMessage, statusCode };
}
