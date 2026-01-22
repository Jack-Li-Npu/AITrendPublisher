import { Logger } from "@zilla/logger";

const logger = new Logger("performance-monitor");

/**
 * 性能监控指标
 */
export interface PerformanceMetrics {
  /** 操作名称 */
  operation: string;
  /** 开始时间 */
  startTime: number;
  /** 结束时间 */
  endTime?: number;
  /** 持续时间（毫秒） */
  duration?: number;
  /** 是否成功 */
  success?: boolean;
  /** 错误信息 */
  error?: string;
  /** 额外的元数据 */
  metadata?: Record<string, any>;
}

/**
 * 性能统计信息
 */
export interface PerformanceStats {
  /** 总调用次数 */
  totalCalls: number;
  /** 成功次数 */
  successCalls: number;
  /** 失败次数 */
  failedCalls: number;
  /** 平均持续时间（毫秒） */
  avgDuration: number;
  /** 最小持续时间（毫秒） */
  minDuration: number;
  /** 最大持续时间（毫秒） */
  maxDuration: number;
  /** 总持续时间（毫秒） */
  totalDuration: number;
}

/**
 * 性能监控工具类
 * 用于监控和记录应用中各种操作的性能指标
 */
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, PerformanceMetrics[]> = new Map();
  private activeOperations: Map<string, number> = new Map();

  private constructor() {}

  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * 开始监控一个操作
   * @param operationId 操作的唯一标识符
   * @param operationName 操作名称
   * @param metadata 额外的元数据
   */
  public startOperation(
    operationId: string,
    operationName: string,
    metadata?: Record<string, any>,
  ): void {
    const startTime = performance.now();
    this.activeOperations.set(operationId, startTime);

    if (!this.metrics.has(operationName)) {
      this.metrics.set(operationName, []);
    }

    this.metrics.get(operationName)!.push({
      operation: operationName,
      startTime,
      metadata,
    });
  }

  /**
   * 结束监控一个操作
   * @param operationId 操作的唯一标识符
   * @param operationName 操作名称
   * @param success 操作是否成功
   * @param error 错误信息（如果失败）
   */
  public endOperation(
    operationId: string,
    operationName: string,
    success: boolean = true,
    error?: string,
  ): number {
    const startTime = this.activeOperations.get(operationId);
    if (!startTime) {
      logger.warn(`未找到操作 ${operationId} 的开始时间`);
      return 0;
    }

    const endTime = performance.now();
    const duration = endTime - startTime;

    this.activeOperations.delete(operationId);

    const operationMetrics = this.metrics.get(operationName);
    if (operationMetrics) {
      const lastMetric = operationMetrics[operationMetrics.length - 1];
      lastMetric.endTime = endTime;
      lastMetric.duration = duration;
      lastMetric.success = success;
      lastMetric.error = error;
    }

    logger.debug(
      `操作 [${operationName}] 完成: ${duration.toFixed(2)}ms, 状态: ${success ? "成功" : "失败"}`,
    );

    return duration;
  }

  /**
   * 包装一个异步函数，自动监控其性能
   * @param operationName 操作名称
   * @param fn 要执行的异步函数
   * @param metadata 额外的元数据
   * @returns 包装后的函数结果
   */
  public async measureAsync<T>(
    operationName: string,
    fn: () => Promise<T>,
    metadata?: Record<string, any>,
  ): Promise<T> {
    const operationId = `${operationName}-${Date.now()}-${Math.random()}`;
    this.startOperation(operationId, operationName, metadata);

    try {
      const result = await fn();
      this.endOperation(operationId, operationName, true);
      return result;
    } catch (error) {
      this.endOperation(
        operationId,
        operationName,
        false,
        (error as Error).message,
      );
      throw error;
    }
  }

  /**
   * 包装一个同步函数，自动监控其性能
   * @param operationName 操作名称
   * @param fn 要执行的同步函数
   * @param metadata 额外的元数据
   * @returns 包装后的函数结果
   */
  public measure<T>(
    operationName: string,
    fn: () => T,
    metadata?: Record<string, any>,
  ): T {
    const operationId = `${operationName}-${Date.now()}-${Math.random()}`;
    this.startOperation(operationId, operationName, metadata);

    try {
      const result = fn();
      this.endOperation(operationId, operationName, true);
      return result;
    } catch (error) {
      this.endOperation(
        operationId,
        operationName,
        false,
        (error as Error).message,
      );
      throw error;
    }
  }

  /**
   * 获取指定操作的统计信息
   * @param operationName 操作名称
   * @returns 性能统计信息
   */
  public getStats(operationName: string): PerformanceStats | null {
    const operationMetrics = this.metrics.get(operationName);
    if (!operationMetrics || operationMetrics.length === 0) {
      return null;
    }

    const completedMetrics = operationMetrics.filter((m) => m.duration);
    if (completedMetrics.length === 0) {
      return null;
    }

    const durations = completedMetrics.map((m) => m.duration!);
    const successCount = completedMetrics.filter((m) => m.success).length;
    const totalDuration = durations.reduce((sum, d) => sum + d, 0);

    return {
      totalCalls: completedMetrics.length,
      successCalls: successCount,
      failedCalls: completedMetrics.length - successCount,
      avgDuration: totalDuration / completedMetrics.length,
      minDuration: Math.min(...durations),
      maxDuration: Math.max(...durations),
      totalDuration,
    };
  }

  /**
   * 获取所有操作的统计信息
   * @returns 所有操作的性能统计
   */
  public getAllStats(): Map<string, PerformanceStats> {
    const allStats = new Map<string, PerformanceStats>();

    for (const [operationName] of this.metrics) {
      const stats = this.getStats(operationName);
      if (stats) {
        allStats.set(operationName, stats);
      }
    }

    return allStats;
  }

  /**
   * 打印性能报告
   * @param operationName 可选，指定操作名称。不指定则打印所有操作
   */
  public printReport(operationName?: string): void {
    if (operationName) {
      const stats = this.getStats(operationName);
      if (stats) {
        logger.info(`\n=== 性能报告: ${operationName} ===`);
        this.printStatsTable(operationName, stats);
      } else {
        logger.warn(`未找到操作 ${operationName} 的统计信息`);
      }
    } else {
      logger.info("\n=== 所有操作性能报告 ===");
      const allStats = this.getAllStats();
      for (const [name, stats] of allStats) {
        this.printStatsTable(name, stats);
        logger.info("");
      }
    }
  }

  private printStatsTable(name: string, stats: PerformanceStats): void {
    logger.info(`操作: ${name}`);
    logger.info(`  总调用次数: ${stats.totalCalls}`);
    logger.info(`  成功: ${stats.successCalls} | 失败: ${stats.failedCalls}`);
    logger.info(`  平均耗时: ${stats.avgDuration.toFixed(2)}ms`);
    logger.info(`  最小耗时: ${stats.minDuration.toFixed(2)}ms`);
    logger.info(`  最大耗时: ${stats.maxDuration.toFixed(2)}ms`);
    logger.info(`  总耗时: ${stats.totalDuration.toFixed(2)}ms`);
  }

  /**
   * 清除指定操作的指标数据
   * @param operationName 操作名称。不指定则清除所有数据
   */
  public clear(operationName?: string): void {
    if (operationName) {
      this.metrics.delete(operationName);
    } else {
      this.metrics.clear();
      this.activeOperations.clear();
    }
  }

  /**
   * 导出指标数据为 JSON
   * @param operationName 可选，指定操作名称
   * @returns JSON 字符串
   */
  public exportJSON(operationName?: string): string {
    if (operationName) {
      const stats = this.getStats(operationName);
      return JSON.stringify({ [operationName]: stats }, null, 2);
    } else {
      const allStats: Record<string, PerformanceStats | null> = {};
      for (const [name] of this.metrics) {
        allStats[name] = this.getStats(name);
      }
      return JSON.stringify(allStats, null, 2);
    }
  }
}

/**
 * 性能监控装饰器（用于类方法）
 * @param operationName 操作名称，默认使用方法名
 */
export function Monitor(operationName?: string) {
  return function (
    _target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;
    const opName = operationName || propertyKey;

    descriptor.value = async function (...args: any[]) {
      const monitor = PerformanceMonitor.getInstance();
      return await monitor.measureAsync(
        opName,
        () => originalMethod.apply(this, args),
        { method: propertyKey },
      );
    };

    return descriptor;
  };
}

