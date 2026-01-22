import { IConfigSource } from "./interfaces/config-source.interface.ts";
import { DbConfigSource } from "./sources/db-config.source.ts";
import { EnvConfigSource } from "./sources/env-config.source.ts";
import { Logger } from "@zilla/logger";

const logger = new Logger("ConfigManager");

export class ConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConfigurationError";
  }
}

interface RetryOptions {
  maxAttempts: number;
  delayMs: number;
}

export class ConfigManager {
  private static instance: ConfigManager;
  private configSources: IConfigSource[] = [];
  private defaultRetryOptions: RetryOptions = {
    maxAttempts: 3,
    delayMs: 1000,
  };

  private constructor() {}

  public static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  /**
   * 添加配置源
   * @param source 配置源实例
   */
  public addSource(source: IConfigSource): void {
    this.configSources.push(source);
    // 按优先级排序（升序，数字越小优先级越高）
    this.configSources.sort((a, b) => a.priority - b.priority);
  }

  private async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async getWithRetry<T>(
    source: IConfigSource,
    key: string,
    options: RetryOptions,
  ): Promise<T | null> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= options.maxAttempts; attempt++) {
      try {
        const value = await source.get<T>(key);
        return value;
      } catch (error) {
        lastError = error as Error;
        if (attempt < options.maxAttempts) {
          await this.delay(options.delayMs);
        }
      }
    }

    console.warn(
      `Failed to get config "${key}" after ${options.maxAttempts} attempts. Last error: ${lastError?.message}`,
    );
    return null;
  }
  public async initDefaultConfigSources(): Promise<void> {
    // 环境变量
    this.addSource(new EnvConfigSource());
    // Database
    if (await this.get<boolean>("ENABLE_DB")) {
      logger.info("DB enabled");
      this.addSource(new DbConfigSource());
    }
  }

  /**
   * 获取配置值
   * @param key 配置键
   * @param retryOptions 重试选项，可选
   * @throws {ConfigurationError} 当所有配置源都无法获取值时抛出
   */
  public async get<T>(
    key: string,
    retryOptions?: Partial<RetryOptions>,
  ): Promise<T> {
    const options = { ...this.defaultRetryOptions, ...retryOptions };

    for (const source of this.configSources) {
      const value = await this.getWithRetry<T>(source, key, options);
      if (value !== null) {
        return value;
      }
    }

    throw new ConfigurationError(
      `Configuration key "${key}" not found in any source after ${options.maxAttempts} attempts`,
    );
  }

  /**
   * 获取所有已注册的配置源
   */
  public getSources(): IConfigSource[] {
    return [...this.configSources];
  }

  /**
   * 清除所有配置源
   */
  public clearSources(): void {
    this.configSources = [];
  }
}
