import { ConfigManager } from "@src/utils/config/config-manager.ts";
import { Logger } from "@zilla/logger";

const logger = new Logger("http-client");

// 自定义错误类型
export class HttpError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: Response,
    public url?: string,
    public method?: string,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export class TimeoutError extends HttpError {
  constructor(url: string, timeout: number) {
    super(`请求超时 (${timeout}ms): ${url}`);
    this.name = "TimeoutError";
  }
}

export class NetworkError extends HttpError {
  constructor(url: string, originalError: Error) {
    super(`网络错误: ${originalError.message}`, undefined, undefined, url);
    this.name = "NetworkError";
  }
}

interface RequestOptions extends RequestInit {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

export class HttpClient {
  private static instance: HttpClient;
  private configManager: ConfigManager;

  private constructor() {
    this.configManager = ConfigManager.getInstance();
  }

  public static getInstance(): HttpClient {
    if (!HttpClient.instance) {
      HttpClient.instance = new HttpClient();
    }
    return HttpClient.instance;
  }

  private async fetchWithTimeout(
    url: string,
    options: RequestOptions = {},
  ): Promise<Response> {
    const { timeout = 30000, ...fetchOptions } = options;

    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
      });
      clearTimeout(id);
      return response;
    } catch (error) {
      clearTimeout(id);
      if (error instanceof Error && error.name === "AbortError") {
        throw new TimeoutError(url, timeout);
      }
      throw new NetworkError(url, error as Error);
    }
  }

  private async retryFetch(
    url: string,
    options: RequestOptions = {},
  ): Promise<Response> {
    const { retries = 3, retryDelay = 1000, ...fetchOptions } = options;

    let lastError: HttpError | null = null;

    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const response = await this.fetchWithTimeout(url, fetchOptions);

        if (!response.ok) {
          // 读取错误响应体
          const errorBody = await response.text();
          let parsedError = errorBody;
          try {
            parsedError = JSON.stringify(JSON.parse(errorBody), null, 2);
          } catch { /* 保持原文本 */ }

          const errorMessage = `HTTP ${response.status} - ${response.statusText}`;
          
          // 只有在非最后一次尝试时才记录警告，或者对于关键错误直接记录
          logger.warn(`请求返回错误状态: ${errorMessage}`, {
            url,
            method: fetchOptions.method || "GET",
            status: response.status,
            responseBody: parsedError
          });

          throw new HttpError(
            errorMessage,
            response.status,
            response,
            url,
            fetchOptions.method || "GET",
          );
        }

        return response;
      } catch (error) {
        lastError = error instanceof HttpError ? error : new HttpError(
          (error as Error).message,
          undefined,
          undefined,
          url,
          fetchOptions.method || "GET",
        );

        const remainingAttempts = retries - attempt - 1;
        logger.warn(
          `请求失败 (${lastError.name}): ${lastError.message} - 剩余重试次数: ${remainingAttempts}`,
          {
            url,
            method: fetchOptions.method || "GET",
            attempt: attempt + 1,
            maxAttempts: retries,
            error: lastError,
          },
        );

        if (remainingAttempts > 0) {
          await new Promise((resolve) => setTimeout(resolve, retryDelay));
        }
      }
    }

    throw lastError || new HttpError("未知错误");
  }

  public async request<T>(
    url: string,
    options: RequestOptions = {},
  ): Promise<T> {
    try {
      const response = await this.retryFetch(url, options);
      const data = await response.json();
      return data as T;
    } catch (error) {
      if (error instanceof HttpError) {
        throw error;
      }
      throw new HttpError(
        `请求处理失败: ${(error as Error).message}`,
        undefined,
        undefined,
        url,
        options.method || "GET",
      );
    }
  }

  public async healthCheck(url: string): Promise<boolean> {
    try {
      await this.fetchWithTimeout(url, {
        method: "HEAD",
        timeout: 15000, // 增加到 15 秒，适应网络波动
      });
      return true;
    } catch (error) {
      logger.warn(`健康检查失败（可忽略）: ${url}`, {
        error: error instanceof HttpError
          ? error
          : new HttpError((error as Error).message),
        url,
        timestamp: new Date().toISOString(),
      });
      return false;
    }
  }
}
