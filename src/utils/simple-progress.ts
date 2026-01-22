import { Logger } from "@zilla/logger";

const logger = new Logger("progress");

/**
 * 简单进度条 - Windows 兼容版本
 * 使用日志输出代替终端控制字符
 */
export class SimpleProgress {
  private title: string;
  private total: number;
  private current: number = 0;
  private startTime: number;
  private lastLogTime: number = 0;
  private logInterval: number = 5000; // 每 5 秒输出一次进度

  constructor(options: { title: string; total: number }) {
    this.title = options.title;
    this.total = options.total;
    this.startTime = Date.now();
    logger.info(`[${this.title}] 开始处理，共 ${this.total} 项`);
  }

  async render(completed: number, options?: { title?: string }): Promise<void> {
    this.current = completed;
    const now = Date.now();

    // 更新标题
    if (options?.title) {
      this.title = options.title;
    }

    // 完成时或每隔一段时间输出进度
    if (completed >= this.total || now - this.lastLogTime >= this.logInterval) {
      const percent = Math.round((completed / this.total) * 100);
      const elapsed = ((now - this.startTime) / 1000).toFixed(1);
      logger.info(`[${this.title}] ${completed}/${this.total} (${percent}%) - 耗时: ${elapsed}s`);
      this.lastLogTime = now;
    }
  }

  finish(): void {
    const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(1);
    logger.info(`[${this.title}] 完成，共处理 ${this.current} 项，总耗时: ${elapsed}s`);
  }
}

