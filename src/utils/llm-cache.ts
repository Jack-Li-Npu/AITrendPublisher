import { Logger } from "@zilla/logger";
import { ChatMessage } from "@src/providers/interfaces/llm.interface.ts";

const logger = new Logger("llm-cache");

/**
 * 缓存项
 */
interface CacheItem<T> {
  /** 缓存的数据 */
  data: T;
  /** 创建时间 */
  timestamp: number;
  /** 访问次数 */
  hitCount: number;
  /** 最后访问时间 */
  lastAccess: number;
}

/**
 * 缓存配置
 */
export interface CacheOptions {
  /** 最大缓存条目数 */
  maxSize?: number;
  /** 缓存过期时间（毫秒），默认1小时 */
  ttl?: number;
  /** 是否启用缓存 */
  enabled?: boolean;
}

/**
 * LLM 响应缓存系统
 * 用于缓存相同问题的 LLM 响应，减少 API 调用
 */
export class LLMCache {
  private static instance: LLMCache;
  private cache: Map<string, CacheItem<any>> = new Map();
  private maxSize: number;
  private ttl: number;
  private enabled: boolean;
  private stats = {
    hits: 0,
    misses: 0,
    evictions: 0,
  };

  private constructor(options: CacheOptions = {}) {
    this.maxSize = options.maxSize ?? 1000;
    this.ttl = options.ttl ?? 3600000; // 默认1小时
    this.enabled = options.enabled ?? true;

    logger.info(
      `LLM 缓存初始化: maxSize=${this.maxSize}, ttl=${this.ttl}ms, enabled=${this.enabled}`,
    );
  }

  public static getInstance(options?: CacheOptions): LLMCache {
    if (!LLMCache.instance) {
      LLMCache.instance = new LLMCache(options);
    }
    return LLMCache.instance;
  }

  /**
   * 生成缓存键
   * @param messages 消息数组
   * @param model 模型名称
   * @param temperature 温度参数
   * @returns 缓存键
   */
  private generateKey(
    messages: ChatMessage[],
    model: string,
    temperature?: number,
  ): string {
    const content = JSON.stringify({
      messages,
      model,
      temperature: temperature ?? 0.7,
    });

    // 使用简单的哈希函数生成缓存键
    return this.simpleHash(content);
  }

  /**
   * 简单的字符串哈希函数
   */
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return `cache_${Math.abs(hash).toString(36)}`;
  }

  /**
   * 获取缓存
   * @param messages 消息数组
   * @param model 模型名称
   * @param temperature 温度参数
   * @returns 缓存的数据，如果不存在或过期则返回 null
   */
  public get<T>(
    messages: ChatMessage[],
    model: string,
    temperature?: number,
  ): T | null {
    if (!this.enabled) {
      return null;
    }

    const key = this.generateKey(messages, model, temperature);
    const item = this.cache.get(key);

    if (!item) {
      this.stats.misses++;
      return null;
    }

    // 检查是否过期
    const now = Date.now();
    if (now - item.timestamp > this.ttl) {
      this.cache.delete(key);
      this.stats.misses++;
      logger.debug(`缓存过期: ${key}`);
      return null;
    }

    // 更新访问统计
    item.hitCount++;
    item.lastAccess = now;
    this.stats.hits++;

    logger.debug(
      `缓存命中: ${key}, 命中次数: ${item.hitCount}`,
    );
    return item.data as T;
  }

  /**
   * 设置缓存
   * @param messages 消息数组
   * @param model 模型名称
   * @param data 要缓存的数据
   * @param temperature 温度参数
   */
  public set<T>(
    messages: ChatMessage[],
    model: string,
    data: T,
    temperature?: number,
  ): void {
    if (!this.enabled) {
      return;
    }

    const key = this.generateKey(messages, model, temperature);
    const now = Date.now();

    // 如果缓存已满，移除最少使用的条目
    if (this.cache.size >= this.maxSize) {
      this.evictLRU();
    }

    this.cache.set(key, {
      data,
      timestamp: now,
      hitCount: 0,
      lastAccess: now,
    });

    logger.debug(`缓存设置: ${key}`);
  }

  /**
   * 移除最少使用的缓存条目（LRU策略）
   */
  private evictLRU(): void {
    let lruKey: string | null = null;
    let lruScore = Infinity;

    // 计算 LRU 分数（结合访问次数和最后访问时间）
    for (const [key, item] of this.cache.entries()) {
      const score = item.lastAccess - (item.hitCount * 10000);
      if (score < lruScore) {
        lruScore = score;
        lruKey = key;
      }
    }

    if (lruKey) {
      this.cache.delete(lruKey);
      this.stats.evictions++;
      logger.debug(`LRU 驱逐: ${lruKey}`);
    }
  }

  /**
   * 清除所有缓存
   */
  public clear(): void {
    this.cache.clear();
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
    };
    logger.info("缓存已清除");
  }

  /**
   * 获取缓存统计信息
   */
  public getStats() {
    const totalRequests = this.stats.hits + this.stats.misses;
    const hitRate = totalRequests > 0
      ? (this.stats.hits / totalRequests * 100).toFixed(2)
      : "0.00";

    return {
      ...this.stats,
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: `${hitRate}%`,
      enabled: this.enabled,
    };
  }

  /**
   * 打印缓存统计报告
   */
  public printStats(): void {
    const stats = this.getStats();
    logger.info("\n=== LLM 缓存统计 ===");
    logger.info(`状态: ${stats.enabled ? "启用" : "禁用"}`);
    logger.info(`缓存大小: ${stats.size} / ${stats.maxSize}`);
    logger.info(`缓存命中: ${stats.hits}`);
    logger.info(`缓存未命中: ${stats.misses}`);
    logger.info(`命中率: ${stats.hitRate}`);
    logger.info(`驱逐次数: ${stats.evictions}`);
  }

  /**
   * 启用或禁用缓存
   */
  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    logger.info(`LLM 缓存已${enabled ? "启用" : "禁用"}`);
  }

  /**
   * 获取缓存是否启用
   */
  public isEnabled(): boolean {
    return this.enabled;
  }
}

/**
 * 带缓存的 LLM 调用包装器
 * @param llmCall LLM 调用函数
 * @param messages 消息数组
 * @param model 模型名称
 * @param temperature 温度参数
 * @returns LLM 响应
 */
export async function cachedLLMCall<T>(
  llmCall: () => Promise<T>,
  messages: ChatMessage[],
  model: string,
  temperature?: number,
): Promise<T> {
  const cache = LLMCache.getInstance();

  // 尝试从缓存获取
  const cached = cache.get<T>(messages, model, temperature);
  if (cached) {
    return cached;
  }

  // 执行实际的 LLM 调用
  const result = await llmCall();

  // 缓存结果
  cache.set(messages, model, result, temperature);

  return result;
}

