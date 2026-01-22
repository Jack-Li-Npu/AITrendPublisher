import {
  ContentScraper,
  ScrapedContent,
  ScraperOptions,
} from "@src/modules/interfaces/scraper.interface.ts";
import { FireCrawlScraper } from "./fireCrawl.scraper.ts";
import { AINewsRegistry } from "@src/utils/ai-news-registry.ts";
import { AISummarizer } from "@src/modules/summarizer/ai.summarizer.ts";
import { formatDate } from "@src/utils/common.ts";
import { Logger } from "@zilla/logger";

const logger = new Logger("ai-news-scraper");

/**
 * 从首页解析出的文章项
 */
interface HomePageArticleItem {
  title: string;
  url: string;
  imageUrl?: string;
}

/**
 * AI 新闻网站专用爬取器
 * 用于爬取 artificialintelligence-news.com
 */
export class AINewsScraper implements ContentScraper {
  private fireCrawlScraper: FireCrawlScraper;
  private registry: AINewsRegistry;
  private summarizer: AISummarizer;
  private readonly HOMEPAGE_URL = "https://www.artificialintelligence-news.com/artificial-intelligence-news/";

  constructor() {
    this.fireCrawlScraper = new FireCrawlScraper();
    this.registry = new AINewsRegistry();
    this.summarizer = new AISummarizer();
  }

  /**
   * 主抓取方法
   */
  async scrape(
    _sourceId: string,
    options?: ScraperOptions,
  ): Promise<ScrapedContent[]> {
    try {
      // 加载标题库
      await this.registry.load();
      const stats = this.registry.getStats();
      logger.info(`[AI新闻爬取] 标题库统计: 总计 ${stats.totalCount} 篇，最近7天 ${stats.recentlyScraped} 篇`);

      // 第一步：抓取首页
      logger.info(`[AI新闻爬取] 第一步：抓取首页 ${this.HOMEPAGE_URL}`);
      const homepageResponse = await this.fireCrawlScraper.v2Scrape(this.HOMEPAGE_URL);
      
      if (!homepageResponse.success || !homepageResponse.data?.markdown) {
        throw new Error(`首页抓取失败: ${homepageResponse.error || '未知错误'}`);
      }

      // 第二步：解析首页 Markdown，提取文章项
      const homepageMarkdown = homepageResponse.data.markdown;
      logger.info(`[AI新闻爬取] 首页 Markdown 长度: ${homepageMarkdown.length} 字符`);
      
      const articleItems = this.parseHomePageMarkdown(homepageMarkdown);
      logger.info(`[AI新闻爬取] 从首页解析出 ${articleItems.length} 篇文章`);

      // 第三步：使用 Registry 过滤已爬取的文章
      const unscrapedItems = this.registry.filterUnscrapedArticles(
        articleItems.map(item => ({ title: item.title, url: item.url }))
      );
      logger.info(`[AI新闻爬取] 过滤后，未爬取文章: ${unscrapedItems.length} 篇`);

      if (unscrapedItems.length === 0) {
        logger.warn(`[AI新闻爬取] 所有文章都已爬取过，返回空结果`);
        return [];
      }

      // 第四步：为未爬取的文章抓取详情页
      const contents: ScrapedContent[] = [];
      const registeredArticles: Array<{ title: string; url: string }> = [];

      // 限制爬取数量（避免过多请求）
      const maxArticles = options?.limit || 20; // 默认最多爬取20篇
      const itemsToScrape = unscrapedItems.slice(0, maxArticles);

      for (const item of itemsToScrape) {
        try {
          // 查找对应的图片URL
          const fullItem = articleItems.find(a => a.url === item.url);
          const imageUrl = fullItem?.imageUrl;

          logger.debug(`[AI新闻爬取] 抓取详情页: ${item.title} (${item.url})`);
          
          // 抓取详情页
          const detailResponse = await this.fireCrawlScraper.v2Scrape(item.url);
          
          if (!detailResponse.success || !detailResponse.data?.markdown) {
            logger.warn(`[AI新闻爬取] 详情页抓取失败: ${item.url} - ${detailResponse.error || '未知错误'}`);
            continue;
          }

          const rawMarkdown = detailResponse.data.markdown;
          const metadata = detailResponse.data.metadata || {};

          // 构建初始媒体数组（仅首页封面图，其余由工作流 LLM 提取）
          const media = [];
          if (imageUrl) {
            media.push({
              url: imageUrl,
              type: this.getImageMimeType(imageUrl),
              size: { width: 1200, height: 630 },
            });
          }

          const content: ScrapedContent = {
            id: this.generateId(item.url),
            title: item.title,
            content: rawMarkdown, // 先返回原始 Markdown，由工作流统一进行 LLM 提取
            url: item.url,
            publishDate: formatDate(metadata.datePosted || new Date().toISOString()),
            media: media,
            metadata: {
              source: "ai-news-site",
              originalUrl: item.url,
              sourceId: this.HOMEPAGE_URL,
              imageCount: media.length,
            },
          };

          contents.push(content);
          registeredArticles.push({ title: item.title, url: item.url });
          
          logger.info(`[AI新闻爬取] ✅ 成功抓取原始内容: ${item.title}`);
        } catch (error) {
          logger.warn(`[AI新闻爬取] 抓取文章失败 [${item.url}]:`, error);
          // 继续处理下一篇文章
        }

        // 避免请求过快
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // 批量注册所有成功爬取的文章
      if (registeredArticles.length > 0) {
        this.registry.registerArticles(registeredArticles);
        await this.registry.save();
        logger.info(`[AI新闻爬取] 已注册 ${registeredArticles.length} 篇文章到标题库`);
      }

      logger.info(`[AI新闻爬取] 抓取完成，共获取 ${contents.length} 篇文章`);
      return contents;
    } catch (error) {
      logger.error("[AI新闻爬取] 抓取失败:", error);
      throw error;
    }
  }

  /**
   * 解析首页 Markdown，提取文章标题、链接和图片
   * 
   * 首页格式示例：
   * [![图片描述](图片URL)](链接URL)
   * 
   * # [标题](链接URL)
   * 
   * 日期
   */
  private parseHomePageMarkdown(markdown: string): HomePageArticleItem[] {
    const items: HomePageArticleItem[] = [];
    const lines = markdown.split('\n');
    
    let currentItem: Partial<HomePageArticleItem> | null = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // 匹配可点击图片格式：[![alt](imageUrl)](linkUrl)
      const clickableImageRegex = /\[!\[([^\]]*)\]\(([^)]+)\)\]\(([^)]+)\)/;
      const imageMatch = line.match(clickableImageRegex);
      
      if (imageMatch) {
        const imageUrl = imageMatch[2];
        const linkUrl = imageMatch[3];
        
        // 保存图片URL，等待后续匹配标题
        currentItem = { url: linkUrl, imageUrl: imageUrl };
        continue;
      }

      // 匹配标题格式：# [标题](链接)
      const titleRegex = /^#\s+\[([^\]]+)\]\(([^)]+)\)/;
      const titleMatch = line.match(titleRegex);
      
      if (titleMatch) {
        const title = titleMatch[1].trim();
        const url = titleMatch[2].trim();

        // 如果有当前项且URL匹配，使用保存的图片URL
        if (currentItem && currentItem.url === url) {
          items.push({
            title: title,
            url: url,
            imageUrl: currentItem.imageUrl,
          });
        } else {
          // 否则创建新项
          items.push({
            title: title,
            url: url,
          });
        }
        
        currentItem = null; // 重置
        continue;
      }

      // 如果不是日期行，重置 currentItem（避免跨文章匹配）
      if (line && !/^\w+ \d{1,2}, \d{4}$/.test(line)) {
        currentItem = null;
      }
    }

    return items;
  }

  /**
   * 生成唯一 ID
   */
  private generateId(url: string): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    const urlHash = url.split("").reduce((acc, char) => {
      return ((acc << 5) - acc + char.charCodeAt(0)) | 0;
    }, 0);
    return `ai_news_${timestamp}_${random}_${Math.abs(urlHash)}`;
  }

  /**
   * 根据 URL 推断图片 MIME 类型
   */
  private getImageMimeType(url: string): string {
    const lowerUrl = url.toLowerCase();
    if (lowerUrl.includes(".png")) return "image/png";
    if (lowerUrl.includes(".webp")) return "image/webp";
    if (lowerUrl.includes(".avif")) return "image/avif";
    if (lowerUrl.includes(".gif")) return "image/gif";
    if (lowerUrl.includes(".jpg") || lowerUrl.includes(".jpeg")) return "image/jpeg";
    return "image/jpeg";
  }
}