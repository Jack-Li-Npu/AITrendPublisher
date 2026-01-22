import { Logger } from "@zilla/logger";
import { join } from "jsr:@std/path";
import { ensureDir } from "jsr:@std/fs";

const logger = new Logger("ai-news-registry");

/**
 * AI 新闻文章信息
 */
export interface AINewsArticleInfo {
  /** 文章标题 */
  title: string;
  /** 文章 URL */
  url: string;
  /** 首次爬取时间 */
  firstScrapedAt: string;
  /** 最后爬取时间 */
  lastScrapedAt: string;
  /** 爬取次数 */
  scrapeCount: number;
}

/**
 * AI 新闻标题库管理器
 * 维护已爬取的文章标题列表，避免重复爬取
 */
export class AINewsRegistry {
  private registryPath: string;
  private registry: Map<string, AINewsArticleInfo>;

  constructor(registryPath: string = "./data/ai-news-registry.json") {
    this.registryPath = registryPath;
    this.registry = new Map();
  }

  /**
   * 加载标题库
   */
  async load(): Promise<void> {
    try {
      const registryDir = join(this.registryPath, "..");
      await ensureDir(registryDir);

      try {
        const content = await Deno.readTextFile(this.registryPath);
        const data = JSON.parse(content);
        
        // 将数组转换为 Map（便于查找）
        if (Array.isArray(data.articles)) {
          for (const article of data.articles) {
            this.registry.set(this.normalizeTitle(article.title), article);
          }
        } else if (typeof data === "object") {
          // 兼容旧格式（如果是对象格式）
          for (const [key, article] of Object.entries(data)) {
            if (typeof article === "object" && article !== null) {
              const articleInfo = article as AINewsArticleInfo;
              this.registry.set(this.normalizeTitle(articleInfo.title), articleInfo);
            }
          }
        }
        
        logger.info(`[AI新闻库] 加载完成，共 ${this.registry.size} 篇文章`);
      } catch (error) {
        if (error instanceof Deno.errors.NotFound) {
          logger.info(`[AI新闻库] 标题库文件不存在，将创建新库`);
        } else {
          throw error;
        }
      }
    } catch (error) {
      logger.error(`[AI新闻库] 加载失败:`, error);
      throw error;
    }
  }

  /**
   * 保存标题库
   */
  async save(): Promise<void> {
    try {
      const registryDir = join(this.registryPath, "..");
      await ensureDir(registryDir);

      // 转换为数组格式（便于阅读和编辑）
      const articles = Array.from(this.registry.values());
      
      // 按标题排序
      articles.sort((a, b) => a.title.localeCompare(b.title));

      const data = {
        version: "1.0",
        updatedAt: new Date().toISOString(),
        totalCount: articles.length,
        articles: articles,
      };

      await Deno.writeTextFile(
        this.registryPath,
        JSON.stringify(data, null, 2),
      );
      
      logger.info(`[AI新闻库] 保存完成，共 ${articles.length} 篇文章`);
    } catch (error) {
      logger.error(`[AI新闻库] 保存失败:`, error);
      throw error;
    }
  }

  /**
   * 规范化标题（用于去重比较）
   */
  private normalizeTitle(title: string): string {
    // 移除前后空格，转为小写，移除特殊符号
    return title.trim().toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ');
  }

  /**
   * 检查标题是否已爬取
   */
  isScraped(title: string): boolean {
    return this.registry.has(this.normalizeTitle(title));
  }

  /**
   * 获取文章信息
   */
  getArticle(title: string): AINewsArticleInfo | undefined {
    return this.registry.get(this.normalizeTitle(title));
  }

  /**
   * 注册文章（首次爬取）
   */
  register(title: string, url: string): void {
    const normalizedTitle = this.normalizeTitle(title);
    const now = new Date().toISOString();
    
    if (this.registry.has(normalizedTitle)) {
      // 更新现有文章
      const existing = this.registry.get(normalizedTitle)!;
      existing.lastScrapedAt = now;
      existing.scrapeCount += 1;
      existing.url = url; // 更新 URL（可能相同）
      logger.debug(`[AI新闻库] 更新文章: ${title} (第 ${existing.scrapeCount} 次爬取)`);
    } else {
      // 注册新文章
      const articleInfo: AINewsArticleInfo = {
        title: title,
        url: url,
        firstScrapedAt: now,
        lastScrapedAt: now,
        scrapeCount: 1,
      };
      this.registry.set(normalizedTitle, articleInfo);
      logger.info(`[AI新闻库] 注册新文章: ${title}`);
    }
  }

  /**
   * 批量注册文章
   */
  registerArticles(articles: Array<{ title: string; url: string }>): void {
    for (const article of articles) {
      this.register(article.title, article.url);
    }
  }

  /**
   * 过滤未爬取的文章
   */
  filterUnscrapedArticles(
    articles: Array<{ title: string; url: string }>,
  ): Array<{ title: string; url: string }> {
    return articles.filter(
      (article) => !this.isScraped(article.title),
    );
  }

  /**
   * 获取所有已爬取的文章列表
   */
  getAllArticles(): AINewsArticleInfo[] {
    return Array.from(this.registry.values()).sort((a, b) =>
      a.title.localeCompare(b.title)
    );
  }

  /**
   * 获取统计信息
   */
  getStats(): {
    totalCount: number;
    recentlyScraped: number; // 最近7天爬取的文章数
  } {
    const now = Date.now();
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
    
    const recentlyScraped = Array.from(this.registry.values()).filter(
      (article) => new Date(article.lastScrapedAt).getTime() > sevenDaysAgo,
    ).length;

    return {
      totalCount: this.registry.size,
      recentlyScraped,
    };
  }
}