// Chrome拡張API用の型定義
interface Chrome {
  storage: {
    local: {
      get: (keys: string | string[] | object | null, callback: (items: { [key: string]: any }) => void) => void;
      set: (items: object, callback?: () => void) => void;
      remove: (keys: string | string[], callback?: () => void) => void;
    };
  };
  tabs: {
    query: (queryInfo: {
      active?: boolean;
      currentWindow?: boolean;
      [key: string]: any;
    }, callback: (tabs: {
      id?: number;
      url?: string;
      title?: string;
      [key: string]: any;
    }[]) => void) => void;
  };
}

declare const chrome: Chrome;
