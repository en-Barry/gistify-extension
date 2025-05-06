// Chrome拡張API用の型定義
interface Chrome {
  storage: {
    local: {
      get: (keys: string | string[] | object | null, callback: (items: { [key: string]: unknown }) => void) => void;
      set: (items: object, callback?: () => void) => void;
      remove: (keys: string | string[], callback?: () => void) => void;
    };
  };
  tabs: {
    query: (queryInfo: {
      active?: boolean;
      currentWindow?: boolean;
      [key: string]: unknown;
    }, callback: (tabs: {
      id?: number;
      url?: string;
      title?: string;
      [key: string]: unknown;
    }[]) => void) => void;
  };
}

declare const chrome: Chrome;
