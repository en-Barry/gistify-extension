/**
 * KVストアのインターフェース
 * Deno KVとモックKVの両方に対応
 */
export interface KvStore {
  get(key: string): Promise<{ value: string | null }>;
  set(key: string, value: string): Promise<void>;
  delete(key: string): Promise<void>;
}

/**
 * モックのKVストア実装
 * 開発環境で使用するインメモリのKVストア
 */
export class MockKv implements KvStore {
  private store = new Map<string, string>();

  async get(key: string): Promise<{ value: string | null }> {
    const value = this.store.get(key) ?? null;
    return { value };
  }

  async set(key: string, value: string): Promise<void> {
    this.store.set(key, value);
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }
}

/**
 * KVストアのファクトリ関数
 * 環境に応じて適切なKVストアインスタンスを返す
 */
export async function createKvStore(): Promise<KvStore> {
  if (process.env.NODE_ENV === 'development') {
    return new MockKv();
  } else {
    try {
      // Denoのグローバルオブジェクトはbunでは存在しないため、動作環境で条件分岐
      // @ts-expect-error Deno Deploy環境でのみ存在するグローバルオブジェクトのため
      return await Deno.openKv();
    } catch (error) {
      console.error('Deno KVの初期化に失敗しました:', error);
      // フォールバックとしてモックKVを返す
      return new MockKv();
    }
  }
}

/**
 * ユーザーのAPIキーを保存・取得するためのヘルパー関数
 */
export class UserApiKeyManager {
  constructor(private kvStore: KvStore) {}

  /**
   * ユーザーIDからKVストアのキーを生成
   */
  private getUserKey(userId: string): string {
    return `user:${userId}`;
  }

  /**
   * ユーザーのAPIキーを取得
   * @param userId ユーザーID
   * @returns APIキー（Base64デコード済み）またはnull
   */
  async getApiKey(userId: string): Promise<string | null> {
    const userKey = this.getUserKey(userId);
    const result = await this.kvStore.get(userKey);

    if (!result.value) {
      return null;
    }

    // Base64デコードしてAPIキー取得
    return atob(result.value);
  }

  /**
   * ユーザーのAPIキーを保存
   * @param userId ユーザーID
   * @param apiKey APIキー（自動的にBase64エンコードされる）
   */
  async setApiKey(userId: string, apiKey: string): Promise<void> {
    const userKey = this.getUserKey(userId);
    // APIキーをBase64エンコード
    const encodedKey = btoa(apiKey);
    await this.kvStore.set(userKey, encodedKey);
  }

  /**
   * ユーザーのAPIキーを削除
   * @param userId ユーザーID
   */
  async deleteApiKey(userId: string): Promise<void> {
    const userKey = this.getUserKey(userId);
    await this.kvStore.delete(userKey);
  }
}
