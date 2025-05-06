declare module 'redaxios' {
  export interface RedaxiosRequestConfig {
    url?: string;
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';
    baseURL?: string;
    headers?: Record<string, string>;
    params?: Record<string, unknown>;
    data?: unknown;
    timeout?: number;
    withCredentials?: boolean;
    auth?: {
      username: string;
      password: string;
    };
    responseType?:
      | 'arraybuffer'
      | 'blob'
      | 'document'
      | 'json'
      | 'text'
      | 'stream';
    [key: string]: unknown;
  }

  export interface RedaxiosResponse<T = unknown> {
    data: T;
    status: number;
    statusText: string;
    headers: Record<string, string>;
    config: RedaxiosRequestConfig;
  }

  export interface RedaxiosError<T = unknown> extends Error {
    config: RedaxiosRequestConfig;
    code?: string;
    request?: unknown;
    response?: RedaxiosResponse<T>;
  }

  export interface RedaxiosInstance {
    (config: RedaxiosRequestConfig): Promise<RedaxiosResponse>;
    (url: string, config?: RedaxiosRequestConfig): Promise<RedaxiosResponse>;
    get<T = unknown>(
      url: string,
      config?: RedaxiosRequestConfig,
    ): Promise<RedaxiosResponse<T>>;
    delete<T = unknown>(
      url: string,
      config?: RedaxiosRequestConfig,
    ): Promise<RedaxiosResponse<T>>;
    head<T = unknown>(
      url: string,
      config?: RedaxiosRequestConfig,
    ): Promise<RedaxiosResponse<T>>;
    options<T = unknown>(
      url: string,
      config?: RedaxiosRequestConfig,
    ): Promise<RedaxiosResponse<T>>;
    post<T = unknown>(
      url: string,
      data?: unknown,
      config?: RedaxiosRequestConfig,
    ): Promise<RedaxiosResponse<T>>;
    put<T = unknown>(
      url: string,
      data?: unknown,
      config?: RedaxiosRequestConfig,
    ): Promise<RedaxiosResponse<T>>;
    patch<T = unknown>(
      url: string,
      data?: unknown,
      config?: RedaxiosRequestConfig,
    ): Promise<RedaxiosResponse<T>>;
  }

  const redaxios: RedaxiosInstance;
  export default redaxios;
}
