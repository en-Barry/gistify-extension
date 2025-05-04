declare module 'redaxios' {
  export interface RedaxiosRequestConfig {
    url?: string;
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';
    baseURL?: string;
    headers?: Record<string, string>;
    params?: any;
    data?: any;
    timeout?: number;
    withCredentials?: boolean;
    auth?: {
      username: string;
      password: string;
    };
    responseType?: 'arraybuffer' | 'blob' | 'document' | 'json' | 'text' | 'stream';
    [key: string]: any;
  }

  export interface RedaxiosResponse<T = any> {
    data: T;
    status: number;
    statusText: string;
    headers: Record<string, string>;
    config: RedaxiosRequestConfig;
  }

  export interface RedaxiosError<T = any> extends Error {
    config: RedaxiosRequestConfig;
    code?: string;
    request?: any;
    response?: RedaxiosResponse<T>;
  }

  export interface RedaxiosInstance {
    (config: RedaxiosRequestConfig): Promise<RedaxiosResponse>;
    (url: string, config?: RedaxiosRequestConfig): Promise<RedaxiosResponse>;
    get<T = any>(url: string, config?: RedaxiosRequestConfig): Promise<RedaxiosResponse<T>>;
    delete<T = any>(url: string, config?: RedaxiosRequestConfig): Promise<RedaxiosResponse<T>>;
    head<T = any>(url: string, config?: RedaxiosRequestConfig): Promise<RedaxiosResponse<T>>;
    options<T = any>(url: string, config?: RedaxiosRequestConfig): Promise<RedaxiosResponse<T>>;
    post<T = any>(url: string, data?: any, config?: RedaxiosRequestConfig): Promise<RedaxiosResponse<T>>;
    put<T = any>(url: string, data?: any, config?: RedaxiosRequestConfig): Promise<RedaxiosResponse<T>>;
    patch<T = any>(url: string, data?: any, config?: RedaxiosRequestConfig): Promise<RedaxiosResponse<T>>;
  }

  const redaxios: RedaxiosInstance;
  export default redaxios;
}
