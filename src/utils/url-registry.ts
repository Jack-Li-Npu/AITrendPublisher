import { Logger } from "@zilla/logger";
import { join } from "jsr:@std/path";
import { ensureDir } from "jsr:@std/fs";

const logger = new Logger("url-registry");

export interface UrlRecord {
  url: string;
  title: string;
  processedAt: string;
  mode?: string;
}

/**
 * 全局 URL 注册表，用于防止内容重复发布
 */
export class UrlRegistry {
  private registryPath: string;
  private records: Map<string, UrlRecord>;
  private static instance: UrlRegistry;

  private constructor(registryPath: string = "./data/url-registry.json") {
    this.registryPath = registryPath;
    this.records = new Map();
  }

  public static getInstance(): UrlRegistry {
    if (!UrlRegistry.instance) {
      UrlRegistry.instance = new UrlRegistry();
    }
    return UrlRegistry.instance;
  }

  /**
   * 加载注册表
   */
  async load(): Promise<void> {
    try {
      const dir = join(this.registryPath, "..");
      await ensureDir(dir);

      try {
        const content = await Deno.readTextFile(this.registryPath);
        const data = JSON.parse(content) as UrlRecord[];
        this.records = new Map(data.map(r => [this.normalizeUrl(r.url), r]));
        logger.info(`[UrlRegistry] 已加载 ${this.records.size} 条记录`);
      } catch (error) {
        if (error instanceof Deno.errors.NotFound) {
          logger.info("[UrlRegistry] 注册表文件不存在，将创建新文件");
          this.records = new Map();
        } else {
          throw error;
        }
      }
    } catch (error) {
      logger.error("[UrlRegistry] 加载失败:", error);
    }
  }

  /**
   * 保存注册表
   */
  async save(): Promise<void> {
    try {
      const data = Array.from(this.records.values());
      await Deno.writeTextFile(this.registryPath, JSON.stringify(data, null, 2));
      logger.debug(`[UrlRegistry] 已保存 ${this.records.size} 条记录`);
    } catch (error) {
      logger.error("[UrlRegistry] 保存失败:", error);
    }
  }

  /**
   * 检查 URL 是否已处理
   */
  isProcessed(url: string): boolean {
    return this.records.has(this.normalizeUrl(url));
  }

  /**
   * 注册 URL
   */
  register(url: string, title: string, mode?: string): void {
    const normalized = this.normalizeUrl(url);
    this.records.set(normalized, {
      url,
      title,
      processedAt: new Date().toISOString(),
      mode,
    });
  }

  /**
   * URL 归一化（去除末尾斜杠、查询参数等）
   */
  private normalizeUrl(url: string): string {
    try {
      const u = new URL(url);
      return (u.origin + u.pathname).replace(/\/$/, "").toLowerCase();
    } catch {
      return url.toLowerCase();
    }
  }

  /**
   * 获取所有记录
   */
  getAllRecords(): UrlRecord[] {
    return Array.from(this.records.values());
  }
}
