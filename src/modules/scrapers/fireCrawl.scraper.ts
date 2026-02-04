import {
  ContentScraper,
  ScrapedContent,
  ScraperOptions,
} from "@src/modules/interfaces/scraper.interface.ts";
import { ConfigManager } from "@src/utils/config/config-manager.ts";
import { formatDate } from "@src/utils/common.ts";
import { HttpClient } from "@src/utils/http/http-client.ts";
import { AISummarizer } from "@src/modules/summarizer/ai.summarizer.ts";
import { UrlRegistry } from "@src/utils/url-registry.ts";
import { Logger } from "@zilla/logger";

const logger = new Logger("fireCrawl-scraper");

/**
 * FireCrawl v2 API 响应类型
 */
interface FireCrawlV2Response {
  success: boolean;
  data?: {
    markdown?: string;
    html?: string;
    rawHtml?: string;
    screenshot?: string;
    links?: string[];
    metadata?: {
      title?: string;
      description?: string;
      language?: string;
      keywords?: string;
      robots?: string;
      ogTitle?: string;
      ogDescription?: string;
      ogUrl?: string;
      ogImage?: string;
      ogLocaleAlternate?: string[];
      ogSiteName?: string;
      sourceURL?: string;
      statusCode?: number;
    };
    llm_extraction?: any;
    warning?: string;
  };
  error?: string;
}

/**
 * FireCrawl v2 Search 响应类型
 */
interface FireCrawlV2SearchResponse {
  success: boolean;
  data?: Array<{
    markdown?: string;
    html?: string;
    metadata?: any;
    url: string;
  }>;
  error?: string;
}

/**
 * 提取的图片信息
 */
interface ExtractedImage {
  url: string;
  alt?: string;
  width?: number;
  height?: number;
  isValid: boolean;
}

/**
 * FireCrawl 抓取配置
 */
interface FireCrawlScrapeConfig {
  /** 要抓取的 URL */
  url: string;
  /** 输出格式：markdown, html, rawHtml, links, screenshot, extract */
  formats?: ("markdown" | "html" | "rawHtml" | "links" | "screenshot" | "extract")[];
  /** 只获取主要内容，排除导航、页脚等 */
  onlyMainContent?: boolean;
  /** 包含指定的 CSS 选择器内容 */
  includeTags?: string[];
  /** 排除指定的 CSS 选择器内容 */
  excludeTags?: string[];
  /** 等待页面加载的时间（毫秒） */
  waitFor?: number;
  /** 超时时间（毫秒） */
  timeout?: number;
  /** LLM 提取配置 */
  extract?: {
    /** 提取提示词 */
    prompt?: string;
    /** 提取的数据模式（JSON Schema） */
    schema?: any;
    /** 系统提示词 */
    systemPrompt?: string;
  };
  /** 自定义请求头 */
  headers?: Record<string, string>;
  /** 移动端模式 */
  mobile?: boolean;
  /** 跳过 TLS 证书验证 */
  skipTlsVerification?: boolean;
}

/**
 * FireCrawl 递归爬取配置
 */
interface FireCrawlCrawlConfig {
  /** 起始 URL */
  url: string;
  /** 爬取深度（0 = 只爬起始页，1 = 爬起始页+直接链接，以此类推） */
  maxDepth?: number;
  /** 最多爬取的页面数 */
  limit?: number;
  /** 只爬取匹配这些模式的 URL（正则表达式数组） */
  includePaths?: string[];
  /** 排除匹配这些模式的 URL（正则表达式数组） */
  excludePaths?: string[];
  /** 输出格式 */
  formats?: ("markdown" | "html" | "rawHtml" | "links" | "screenshot" | "extract")[];
  /** LLM 提取配置 */
  extract?: {
    prompt?: string;
    schema?: any;
    systemPrompt?: string;
  };
  /** 超时时间（毫秒） */
  timeout?: number;
}

/**
 * FireCrawl 递归爬取响应
 */
interface FireCrawlCrawlResponse {
  success: boolean;
  jobId?: string;
  data?: {
    jobId: string;
    status: "running" | "completed" | "failed";
    totalPages?: number;
    pages?: Array<{
      url: string;
      markdown?: string;
      html?: string;
      metadata?: any;
      llm_extraction?: any;
    }>;
  };
  error?: string;
}

/**
 * 提取的故事结构
 */
interface ExtractedStory {
  headline: string;
  content: string;
  link: string;
  date_posted: string;
}

/**
 * FireCrawl v2 Scraper
 * 使用 FireCrawl v2 API 进行网页内容抓取
 * API 文档: https://docs.firecrawl.dev/api-reference/endpoint/scrape
 */
export class FireCrawlScraper implements ContentScraper {
  private apiKey!: string;
  private baseUrl: string = "https://api.firecrawl.dev/v1";
  private httpClient: HttpClient;
  private configManager: ConfigManager;
  private summarizer: AISummarizer;

  constructor() {
    this.httpClient = HttpClient.getInstance();
    this.configManager = ConfigManager.getInstance();
    this.summarizer = new AISummarizer();
  }

  /**
   * 刷新配置
   */
  async refresh(): Promise<void> {
    const startTime = Date.now();
    this.apiKey = await this.configManager.get("FIRE_CRAWL_API_KEY");
    
    // 支持自定义 API 端点
    const customBaseUrl = await this.configManager.get("FIRE_CRAWL_BASE_URL");
    if (customBaseUrl) {
      this.baseUrl = customBaseUrl;
    }

    if (!this.apiKey) {
      throw new Error("FIRE_CRAWL_API_KEY 未配置");
    }

    logger.debug(`FireCrawl 初始化完成, 耗时: ${Date.now() - startTime}ms`);
  }

  /**
   * 生成唯一 ID
   */
  /**
   * 从 Markdown 中智能提取主要内容，过滤元数据
   */
  private extractMainContentFromMarkdown(markdown: string): string {
    // 1. 按行分割
    const lines = markdown.split('\n');
    const contentLines: string[] = [];
    
    // 要过滤的关键词（元数据、导航、联系方式等）
    const filterKeywords = [
      'press@', 'support@', 'mailto:', 
      'Download press kit', '媒体资源', '媒体垂询', '非媒体垂询',
      'Contact', 'Email', 'Phone', 'Address',
      'Subscribe', 'Newsletter', 'Follow us',
      'Terms', 'Privacy', 'Cookie', 'Legal',
      'Navigation', 'Menu', 'Search',
      '联系方式', '联系我们', '关于我们', '隐私政策',
    ];
    
    // 2. 过滤每一行
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // 跳过空行
      if (!line) continue;
      
      // 跳过包含过滤关键词的行
      const shouldFilter = filterKeywords.some(keyword => 
        line.toLowerCase().includes(keyword.toLowerCase())
      );
      if (shouldFilter) continue;
      
      // 跳过纯链接行
      if (line.match(/^\[.*\]\(.*\)$/) || line.match(/^https?:\/\//)) continue;
      
      // 跳过单字符或过短的行（可能是图标、按钮文本）
      if (line.length < 10 && !line.match(/^#{1,6}\s/)) continue;
      
      contentLines.push(line);
    }
    
    // 3. 重新组合，保留段落结构
    let cleanedContent = contentLines.join('\n');
    
    // 4. 移除多余的空行
    cleanedContent = cleanedContent.replace(/\n{3,}/g, '\n\n');
    
    // 5. 如果内容太长，取前 3000 字符（给 LLM 足够的上下文）
    if (cleanedContent.length > 8000) {
      cleanedContent = cleanedContent.substring(0, 8000) + '...';
    }
    
    return cleanedContent.trim();
  }

  private generateId(url: string): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    const urlHash = url.split("").reduce((acc, char) => {
      return ((acc << 5) - acc + char.charCodeAt(0)) | 0;
    }, 0);
    return `fc_${timestamp}_${random}_${Math.abs(urlHash)}`;
  }

  /**
   * 调用 FireCrawl v2 API 抓取网页
   */
  private async scrapeUrl(config: FireCrawlScrapeConfig): Promise<FireCrawlV2Response> {
    const endpoint = `${this.baseUrl}/scrape`;

    // 构建符合 v2 规范的请求体
    const body: any = {
      url: config.url,
      formats: config.formats || ["markdown"],
      onlyMainContent: config.onlyMainContent ?? true,
    };

    // 只有在提供了 extract 配置时才添加相关参数
    if (config.extract) {
      body.extract = config.extract;
      // 确保 formats 中包含 extract
      if (!body.formats.includes("extract")) {
        body.formats.push("extract");
      }
    }

    // 添加可选参数，但要确保不发送 null/undefined
    if (config.waitFor) body.waitFor = config.waitFor;
    if (config.timeout) body.timeout = config.timeout;
    if (config.headers) body.headers = config.headers;
    if (config.mobile) body.mobile = config.mobile;

    try {
      const response = await this.httpClient.request<FireCrawlV2Response>(endpoint, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        timeout: 60000,
        retries: 2,
        retryDelay: 2000,
      });

      return response;
    } catch (error) {
      logger.error(`FireCrawl API 调用失败: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * 递归爬取多个链接（使用 FireCrawl /crawl 端点）
   */
  private async crawlUrls(config: FireCrawlCrawlConfig): Promise<FireCrawlCrawlResponse> {
    const endpoint = `${this.baseUrl}/crawl`;

    try {
      const response = await this.httpClient.request<FireCrawlCrawlResponse>(endpoint, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: config.url,
          maxDepth: config.maxDepth ?? 1,
          limit: config.limit ?? 10,
          includePaths: config.includePaths,
          excludePaths: config.excludePaths,
          formats: config.formats || ["markdown", "extract"],
          extract: config.extract,
          timeout: config.timeout || 60000,
        }),
        timeout: 300000, // 5 分钟超时（递归爬取需要更长时间）
        retries: 1,
        retryDelay: 5000,
      });

      return response;
    } catch (error) {
      logger.error(`FireCrawl 递归爬取失败: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * 构建 LLM 提取提示词
   */
  private buildExtractionPrompt(sourceId: string, currentDate: string): string {
    return `
        Analyze this webpage and extract AI/LLM related news articles or posts.
        
        Requirements:
        1. Only include articles from today (${currentDate}) or very recent
        2. Focus on AI, Machine Learning, LLM, and technology news
        3. Each article should have: headline, content summary, link, and date
        
        Return JSON format:
        {
          "stories": [
            {
              "headline": "Article title",
              "content": "Summary of the article in about 200-500 words, capturing the main points",
              "link": "Full URL to the article",
              "date_posted": "YYYY-MM-DD HH:mm:ss"
            }
          ]
        }
        
        Rules:
        - If a link is relative, prepend "${sourceId}" to make it absolute
        - Translate all content to Chinese (简体中文)
        - Return empty array if no relevant articles found: {"stories": []}
        - Return ONLY valid JSON, no markdown or extra text
      `;
  }

  /**
   * 构建 LLM 提取的 JSON Schema
   */
  private buildExtractionSchema(): any {
    return {
      type: "object",
      properties: {
        stories: {
          type: "array",
          items: {
            type: "object",
            properties: {
              headline: { type: "string", description: "Article headline/title" },
              content: { type: "string", description: "Article content summary" },
              link: { type: "string", description: "URL to the article" },
              date_posted: { type: "string", description: "Publication date in YYYY-MM-DD HH:mm:ss format" },
            },
            required: ["headline", "content", "link", "date_posted"],
          },
        },
      },
      required: ["stories"],
    };
  }

  /**
   * 从首页提取链接并逐个抓取详情页
   */
  private async scrapeWithRecursiveLinks(
    sourceId: string,
    extractionPrompt: string,
    extractionSchema: any,
    maxLinks: number = 10,
  ): Promise<ScrapedContent[]> {
    logger.info(`[FireCrawl] 开始递归爬取: ${sourceId}，最多抓取 ${maxLinks} 个链接`);

    // 1. 先抓取首页，获取链接列表
    const homepageResponse = await this.scrapeUrl({
      url: sourceId,
      formats: ["links", "markdown", "html"],
      onlyMainContent: true,
      timeout: 45000,
    });

    if (!homepageResponse.success || !homepageResponse.data) {
      throw new Error(homepageResponse.error || "首页抓取失败");
    }

    // 2. 使用 LLM 提取高质量新闻链接
    const homepageMarkdown = homepageResponse.data.markdown || "";
    logger.info(`[FireCrawl] 调用 LLM 从首页提取高质量链接...`);

    // 获取已使用的 URL 列表，让 LLM 跳过这些 URL
    const urlRegistry = UrlRegistry.getInstance();
    const usedUrls = urlRegistry.getAllRecords().map(r => r.url);
    logger.info(`[FireCrawl] 已使用 URL 数量: ${usedUrls.length}，将传递给 LLM 进行排除`);

    let extractedLinks = await this.summarizer.extractLinks(homepageMarkdown, sourceId, usedUrls).catch(err => {
      logger.error(`[FireCrawl] LLM 链接提取失败，回退到普通 HTML 链接提取: ${err.message}`);
      return null;
    });

    let articleLinks: string[] = [];

    if (extractedLinks && extractedLinks.length > 0) {
      logger.info(`[FireCrawl] LLM 成功提取到 ${extractedLinks.length} 个高质量链接`);
      articleLinks = extractedLinks.map(l => {
        // 处理相对路径
        try {
          return new URL(l.url, sourceId).href;
        } catch {
          return l.url;
        }
      });
    } else {
      // 3. 回退：提取所有 HTML 链接并过滤
      const rawLinks = homepageResponse.data.links || [];
      logger.info(`[FireCrawl] 从首页提取到 ${rawLinks.length} 个原始 HTML 链接`);
      
      articleLinks = rawLinks.filter(link => {
        try {
          const linkUrl = new URL(link);
          const sourceUrl = new URL(sourceId);
          return linkUrl.origin === sourceUrl.origin;
        } catch {
          return false;
        }
      });
    }

    // 4. 限制链接数量并截取
    articleLinks = articleLinks.slice(0, maxLinks);
    logger.info(`[FireCrawl] 最终进入抓取流程的有效链接共 ${articleLinks.length} 个`);

    // 5. 逐个抓取详情页
    const allContents: ScrapedContent[] = [];
    for (let i = 0; i < articleLinks.length; i++) {
      const link = articleLinks[i];
      try {
        logger.debug(`[FireCrawl] 抓取详情页 ${i + 1}/${articleLinks.length}: ${link}`);
        
        const detailResponse = await this.scrapeUrl({
          url: link,
          formats: ["extract", "markdown", "html"],
          onlyMainContent: true,
          extract: {
            prompt: extractionPrompt,
            schema: extractionSchema,
          },
          timeout: 45000,
        });

        if (detailResponse.success && detailResponse.data) {
          // 解析单个文章
          let story: ExtractedStory | null = null;

          if (detailResponse.data.llm_extraction?.stories?.[0]) {
            story = detailResponse.data.llm_extraction.stories[0];
          } else if (detailResponse.data.llm_extraction) {
            // 尝试其他格式
            const possibleStory = detailResponse.data.llm_extraction as any;
            if (possibleStory.headline || possibleStory.title) {
              story = {
                headline: possibleStory.headline || possibleStory.title,
                content: possibleStory.content || possibleStory.summary || "",
                link: link,
                date_posted: possibleStory.date_posted || new Date().toISOString().replace("T", " ").slice(0, 19),
              };
            }
          }

          if (!story && detailResponse.data.markdown) {
            // 回退到 Markdown 解析
            const cleanedContent = this.extractMainContentFromMarkdown(detailResponse.data.markdown);
            if (cleanedContent.length >= 200) {
              story = {
                headline: detailResponse.data.metadata?.title || detailResponse.data.metadata?.ogTitle || "未知标题",
                content: cleanedContent,
                link: link,
                date_posted: new Date().toISOString().replace("T", " ").slice(0, 19),
              };
            }
          }

          if (story) {
            // 提取图片
            const markdown = detailResponse.data.markdown || "";
            const html = detailResponse.data.html || "";
            const images = this.extractImagesFromContent(markdown + html, link);
            const ogImage = detailResponse.data.metadata?.ogImage;

            const content: ScrapedContent = {
              id: this.generateId(story.link),
              title: story.headline,
              content: story.content,
              url: story.link,
              publishDate: formatDate(story.date_posted),
              score: 0,
              media: images.slice(0, 5).map(img => ({
                url: img.url,
                type: this.getImageMimeType(img.url),
                size: { width: img.width || 800, height: img.height || 600 },
              })),
              metadata: {
                source: "fireCrawl",
                originalUrl: story.link,
                datePosted: story.date_posted,
                sourceId: sourceId,
                imageCount: images.length,
              },
            };

            allContents.push(content);
            logger.debug(`[FireCrawl] ✅ 成功抓取: ${story.headline}`);
          }
        }
      } catch (error) {
        logger.warn(`[FireCrawl] 抓取链接失败 [${link}]:`, error);
        // 继续处理下一个链接
      }

      // 避免请求过快
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    logger.info(`[FireCrawl] 递归爬取完成，共获取 ${allContents.length} 篇文章`);
    return allContents;
  }

  /**
   * 简单抓取 - 获取网页的 Markdown 内容
   */
  async scrapeSimple(url: string): Promise<string> {
    await this.refresh();

    const response = await this.scrapeUrl({
      url,
      formats: ["markdown"],
      onlyMainContent: true,
    });

    if (!response.success || !response.data?.markdown) {
      throw new Error(response.error || "抓取失败：未获取到内容");
    }

    return response.data.markdown;
  }

  /**
   * 智能提取 - 使用 LLM 提取结构化内容
   */
  async scrapeWithExtraction(
    url: string,
    prompt: string,
    schema?: any,
  ): Promise<any> {
    await this.refresh();

    const response = await this.scrapeUrl({
      url,
      formats: ["extract"],
      extract: {
        prompt,
        schema,
      },
    });

    if (!response.success) {
      throw new Error(response.error || "提取失败");
    }

    return response.data?.llm_extraction || response.data;
  }

  /**
   * 调用 FireCrawl v2 API 抓取单网页 (v2/scrape)
   */
  async v2Scrape(url: string): Promise<FireCrawlV2Response> {
    await this.refresh();
    const endpoint = 'https://api.firecrawl.dev/v2/scrape';

    try {
      const response = await this.httpClient.request<FireCrawlV2Response>(endpoint, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          "url": url,
          "onlyMainContent": false,
          "maxAge": 172800000,
          "parsers": ["pdf"],
          "formats": ["markdown"]
        }),
        timeout: 60000,
      });

      return response;
    } catch (error) {
      logger.error(`FireCrawl v2 API 调用失败 [${url}]: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * 调用 FireCrawl v2 API 搜索主题 (v2/search)
   */
  async v2Search(topic: string, limit: number = 10): Promise<FireCrawlV2SearchResponse> {
    await this.refresh();
    const endpoint = 'https://api.firecrawl.dev/v2/search';

    try {
      const response = await this.httpClient.request<FireCrawlV2SearchResponse>(endpoint, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          "query": topic,
          "sources": ["web"],
          "categories": [],
          "limit": limit,
          "scrapeOptions": {
            "onlyMainContent": false,
            "maxAge": 172800000,
            "parsers": ["pdf"],
            "formats": ["markdown"]
          }
        }),
        timeout: 120000, // 搜索可能需要更长时间
      });

      return response;
    } catch (error) {
      logger.error(`FireCrawl v2 Search API 调用失败 [${topic}]: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * 主抓取方法 - 实现 ContentScraper 接口
   */
  async scrape(
    sourceId: string,
    options?: ScraperOptions,
  ): Promise<ScrapedContent[]> {
    try {
      await this.refresh();
      const startTime = Date.now();
      const currentDate = new Date().toLocaleDateString();

      // 检查是否启用递归爬取
      const enableRecursive = options?.filters?.enableRecursive === true;
      const maxRecursiveLinks = options?.filters?.maxRecursiveLinks as number || 10;

      if (enableRecursive) {
        logger.info(`[FireCrawl] 启用递归爬取模式，最多抓取 ${maxRecursiveLinks} 个链接`);
        return await this.scrapeWithRecursiveLinks(
          sourceId,
          this.buildExtractionPrompt(sourceId, currentDate),
          this.buildExtractionSchema(),
          maxRecursiveLinks,
        );
      }

      // 构建提取提示词和 schema
      const extractionPrompt = this.buildExtractionPrompt(sourceId, currentDate);
      const extractionSchema = this.buildExtractionSchema();

      // 调用 FireCrawl API - 同时获取 HTML 用于提取图片
      const response = await this.scrapeUrl({
        url: sourceId,
        formats: ["extract", "markdown", "html", "links"],
        onlyMainContent: true,
        extract: {
          prompt: extractionPrompt,
          schema: extractionSchema,
        },
        timeout: 45000,
      });

      if (!response.success) {
        throw new Error(response.error || "抓取失败");
      }

      // 调试：记录 LLM 提取的响应
      logger.debug(`[FireCrawl] LLM 提取响应检查:`, {
        hasData: !!response.data,
        hasLlmExtraction: !!response.data?.llm_extraction,
        llmExtractionType: typeof response.data?.llm_extraction,
        llmExtractionKeys: response.data?.llm_extraction ? Object.keys(response.data.llm_extraction) : [],
        hasStories: !!response.data?.llm_extraction?.stories,
        storiesLength: response.data?.llm_extraction?.stories?.length,
        warning: response.data?.warning,
      });

      // 解析提取的数据
      let stories: ExtractedStory[] = [];

      if (response.data?.llm_extraction?.stories) {
        stories = response.data.llm_extraction.stories;
        logger.info(`[FireCrawl] LLM 提取成功，获取到 ${stories.length} 篇文章`);
      } else if (response.data?.llm_extraction) {
        // LLM 提取有返回，但格式可能不同
        logger.warn(`[FireCrawl] LLM 提取返回了数据，但格式不符合预期，类型: ${typeof response.data.llm_extraction}, 是否为数组: ${Array.isArray(response.data.llm_extraction)}`);
        // 尝试直接使用 llm_extraction 作为 stories
        if (Array.isArray(response.data.llm_extraction)) {
          stories = response.data.llm_extraction;
        } else if (typeof response.data.llm_extraction === 'object') {
          // 尝试查找 stories 字段（可能在不同层级）
          const possibleStories = (response.data.llm_extraction as any).stories || 
                                  (response.data.llm_extraction as any).data?.stories ||
                                  (response.data.llm_extraction as any).articles;
          if (Array.isArray(possibleStories)) {
            stories = possibleStories;
            logger.info(`[FireCrawl] 从 LLM 提取结果中找到 ${stories.length} 篇文章`);
          }
        }
      }
      
      if (stories.length === 0 && response.data?.markdown) {
        // 如果 LLM 提取失败，智能解析 Markdown 提取真实内容
        logger.warn(`[FireCrawl] LLM 提取未返回结果，使用智能 Markdown 解析`);
        
        const markdown = response.data.markdown;
        const metadata = response.data.metadata;
        
        // 清理 Markdown：移除导航、页脚、联系方式等元数据
        const cleanedContent = this.extractMainContentFromMarkdown(markdown);
        
        // 如果清理后的内容太短，说明这个页面主要是导航页，不适合作为内容源
        if (cleanedContent.length < 500) {
          logger.warn(`[FireCrawl] ${sourceId} 内容太短（${cleanedContent.length}字符），可能是导航页`);
          stories = [];
        } else {
          stories = [{
            headline: metadata?.title || metadata?.ogTitle || "未知标题",
            content: cleanedContent,
            link: sourceId,
            date_posted: new Date().toISOString().replace("T", " ").slice(0, 19),
          }];
        }
      }

      // 提取图片
      const markdown = response.data?.markdown || "";
      const html = response.data?.html || "";
      const images = this.extractImagesFromContent(markdown + html, sourceId);
      const ogImage = response.data?.metadata?.ogImage;
      
      logger.debug(`[FireCrawl] 从 ${sourceId} 提取到 ${images.length} 张图片`);

      // 转换为 ScrapedContent 格式
      const contents: ScrapedContent[] = stories.map((story) => {
        // 为每个故事准备图片
        const storyImages = [...images];
        
        // 优先使用 OG 图片作为封面
        if (ogImage && !storyImages.find(img => img.url === ogImage)) {
          storyImages.unshift({
            url: ogImage,
            alt: story.headline,
            width: 1200,
            height: 630,
            isValid: true,
          });
        }

        return {
          id: this.generateId(story.link || sourceId),
          title: story.headline,
          content: story.content,
          url: story.link || sourceId,
          publishDate: formatDate(story.date_posted),
          score: 0,
          media: storyImages.slice(0, 5).map(img => ({
            url: img.url,
            type: this.getImageMimeType(img.url),
            size: { width: img.width || 800, height: img.height || 600 },
          })),
          metadata: {
            source: "fireCrawl",
            originalUrl: story.link || sourceId,
            datePosted: story.date_posted,
            sourceId: sourceId,
            imageCount: storyImages.length,
          },
        };
      });

      logger.info(
        `[FireCrawl] 从 ${sourceId} 获取到 ${contents.length} 条内容, 图片: ${images.length}, 耗时: ${Date.now() - startTime}ms`,
      );

      return contents;
    } catch (error) {
      logger.error(`FireCrawl 抓取失败 [${sourceId}]:`, error);
      throw error;
    }
  }

  /**
   * 批量抓取多个 URL
   */
  async scrapeBatch(urls: string[], options?: ScraperOptions): Promise<ScrapedContent[]> {
    const results: ScrapedContent[] = [];

    for (const url of urls) {
      try {
        const contents = await this.scrape(url, options);
        results.push(...contents);
      } catch (error) {
        logger.error(`批量抓取失败 [${url}]:`, error);
        // 继续处理其他 URL
      }
    }

    return results;
  }

  /**
   * 获取网页元数据
   */
  async getMetadata(url: string): Promise<Record<string, any>> {
    await this.refresh();

    const response = await this.scrapeUrl({
      url,
      formats: ["markdown"],
      onlyMainContent: false,
    });

    if (!response.success) {
      throw new Error(response.error || "获取元数据失败");
    }

    return response.data?.metadata || {};
  }

  /**
   * 截图功能
   */
  async screenshot(url: string): Promise<string> {
    await this.refresh();

    const response = await this.scrapeUrl({
      url,
      formats: ["screenshot"],
    });

    if (!response.success || !response.data?.screenshot) {
      throw new Error(response.error || "截图失败");
    }

    return response.data.screenshot;
  }

  /**
   * 从 Markdown 或 HTML 中提取图片
   * @param content Markdown 或 HTML 内容
   * @param baseUrl 基础 URL，用于处理相对路径
   */
  extractImagesFromContent(content: string, baseUrl: string): ExtractedImage[] {
    const images: ExtractedImage[] = [];
    const seenUrls = new Set<string>();

    // 从 Markdown 中提取: ![alt](url) 或 ![alt](url "title")
    const mdImageRegex = /!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
    let match;
    
    while ((match = mdImageRegex.exec(content)) !== null) {
      const [, alt, url] = match;
      const absoluteUrl = this.resolveUrl(url, baseUrl);
      if (!seenUrls.has(absoluteUrl)) {
        seenUrls.add(absoluteUrl);
        images.push({
          url: absoluteUrl,
          alt: alt || undefined,
          isValid: this.isValidImageUrl(absoluteUrl),
        });
      }
    }

    // 从 HTML 中提取: <img src="url" alt="..." width="..." height="...">
    const htmlImageRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
    while ((match = htmlImageRegex.exec(content)) !== null) {
      const imgTag = match[0];
      const url = match[1];
      const absoluteUrl = this.resolveUrl(url, baseUrl);
      
      if (!seenUrls.has(absoluteUrl)) {
        seenUrls.add(absoluteUrl);
        
        // 提取 alt 属性
        const altMatch = imgTag.match(/alt=["']([^"']*)["']/i);
        const alt = altMatch ? altMatch[1] : undefined;
        
        // 提取 width 和 height
        const widthMatch = imgTag.match(/width=["']?(\d+)["']?/i);
        const heightMatch = imgTag.match(/height=["']?(\d+)["']?/i);
        
        images.push({
          url: absoluteUrl,
          alt,
          width: widthMatch ? parseInt(widthMatch[1]) : undefined,
          height: heightMatch ? parseInt(heightMatch[1]) : undefined,
          isValid: this.isValidImageUrl(absoluteUrl),
        });
      }
    }

    // 提取标题前的图片
    const headingImages = this.extractImagesBeforeHeadings(content, baseUrl);
    for (const img of headingImages) {
      if (!seenUrls.has(img.url)) {
        seenUrls.add(img.url);
        images.push(img);
      }
    }

    // 过滤并返回有效图片
    return images.filter(img => img.isValid);
  }

  /**
   * 提取每个标题前的图片
   * 标题格式：## 或 ###
   */
  private extractImagesBeforeHeadings(content: string, baseUrl: string): ExtractedImage[] {
    const images: ExtractedImage[] = [];
    const lines = content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      // 检测标题：## 或 ###
      if (line.match(/^#{2,3}\s+/)) {
        // 向前查找，找到第一个图片（最多向前查找5行）
        for (let j = Math.max(0, i - 5); j < i; j++) {
          const prevLine = lines[j];
          // 匹配 Markdown 图片
          const mdMatch = prevLine.match(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/);
          if (mdMatch) {
            const url = this.resolveUrl(mdMatch[2], baseUrl);
            const alt = mdMatch[1] || "标题配图";
            if (this.isValidImageUrl(url)) {
              images.push({
                url: url,
                alt: alt,
                isValid: true,
              });
              break; // 只取第一个图片
            }
          }
          // 匹配 HTML img 标签
          const htmlMatch = prevLine.match(/<img[^>]+src=["']([^"']+)["'][^>]*>/);
          if (htmlMatch) {
            const url = this.resolveUrl(htmlMatch[1], baseUrl);
            if (this.isValidImageUrl(url)) {
              images.push({
                url: url,
                alt: "标题配图",
                isValid: true,
              });
              break;
            }
          }
        }
      }
    }
    
    return images;
  }

  /**
   * 解析相对 URL 为绝对 URL
   */
  private resolveUrl(url: string, baseUrl: string): string {
    if (!url) return "";
    
    // 已经是绝对 URL
    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url;
    }
    
    // 协议相对 URL
    if (url.startsWith("//")) {
      return "https:" + url;
    }
    
    // 数据 URL，直接返回
    if (url.startsWith("data:")) {
      return url;
    }

    try {
      const base = new URL(baseUrl);
      
      // 绝对路径
      if (url.startsWith("/")) {
        return `${base.protocol}//${base.host}${url}`;
      }
      
      // 相对路径
      const basePath = base.pathname.substring(0, base.pathname.lastIndexOf("/") + 1);
      return `${base.protocol}//${base.host}${basePath}${url}`;
    } catch {
      return url;
    }
  }

  /**
   * 判断是否为有效的图片 URL
   * 过滤掉图标、广告、追踪像素等
   */
  private isValidImageUrl(url: string): boolean {
    if (!url) return false;
    
    // 数据 URL 通常是有效的
    if (url.startsWith("data:image/")) {
      return true;
    }

    const lowerUrl = url.toLowerCase();
    
    // 排除的关键词（图标、追踪、广告等）
    const excludePatterns = [
      /favicon/i,
      /icon[s]?\//i,
      /logo.*\.(ico|svg)/i,
      /pixel/i,
      /tracking/i,
      /analytics/i,
      /beacon/i,
      /spacer/i,
      /blank/i,
      /1x1/i,
      /ad[s]?\//i,
      /banner[s]?\//i,
      /button/i,
      /badge/i,
      /sprite/i,
      /avatar/i,
      /profile.*small/i,
      /thumb.*small/i,
      /emoji/i,
      /\.gif$/i, // 通常 GIF 是动图或小图
    ];

    for (const pattern of excludePatterns) {
      if (pattern.test(lowerUrl)) {
        return false;
      }
    }

    // 必须是图片格式
    const imageExtensions = [".jpg", ".jpeg", ".png", ".webp", ".avif", ".svg", ".bmp", ".tiff", ".tif", ".gif"];
    const hasImageExtension = imageExtensions.some(ext => 
      lowerUrl.includes(ext) || lowerUrl.includes(ext + "?")
    );
    
    // 如果 URL 中包含图片相关的路径或参数，也认为有效
    const imageIndicators = ["/image", "/photo", "/picture", "/media", "/upload", "/assets"];
    const hasImageIndicator = imageIndicators.some(indicator => lowerUrl.includes(indicator));

    return hasImageExtension || hasImageIndicator;
  }

  /**
   * 增强抓取 - 同时获取内容和图片
   */
  async scrapeWithImages(
    sourceId: string,
    options?: ScraperOptions,
  ): Promise<ScrapedContent[]> {
    try {
      await this.refresh();
      const startTime = Date.now();

      // 获取 HTML 和 Markdown，以便提取图片
      const response = await this.scrapeUrl({
        url: sourceId,
        formats: ["markdown", "html"],
        onlyMainContent: true,
        timeout: 45000,
      });

      if (!response.success) {
        throw new Error(response.error || "抓取失败");
      }

      const markdown = response.data?.markdown || "";
      const html = response.data?.html || "";
      const metadata = response.data?.metadata || {};

      // 提取图片
      const images = this.extractImagesFromContent(markdown + html, sourceId);
      logger.debug(`[FireCrawl] 从 ${sourceId} 提取到 ${images.length} 张有效图片`);

      // 添加 OG 图片
      if (metadata.ogImage && !images.find(img => img.url === metadata.ogImage)) {
        images.unshift({
          url: metadata.ogImage,
          alt: metadata.ogTitle || metadata.title,
          isValid: true,
        });
      }

      // 转换图片为 Media 格式
      const media = images.slice(0, 10).map(img => ({
        url: img.url,
        type: this.getImageMimeType(img.url),
        size: {
          width: img.width || 800,
          height: img.height || 600,
        },
      }));

      // 创建内容
      const content: ScrapedContent = {
        id: this.generateId(sourceId),
        title: metadata.title || metadata.ogTitle || "未知标题",
        content: markdown,
        url: sourceId,
        publishDate: formatDate(new Date().toISOString()),
        media,
        metadata: {
          source: "fireCrawl",
          originalUrl: sourceId,
          description: metadata.description || metadata.ogDescription,
          imageCount: media.length,
        },
      };

      logger.info(
        `[FireCrawl] 增强抓取完成 ${sourceId}, 图片: ${media.length}, 耗时: ${Date.now() - startTime}ms`,
      );

      return [content];
    } catch (error) {
      logger.error(`FireCrawl 增强抓取失败 [${sourceId}]:`, error);
      throw error;
    }
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
    if (lowerUrl.includes(".svg")) return "image/svg+xml";
    if (lowerUrl.includes(".bmp")) return "image/bmp";
    if (lowerUrl.includes(".tiff") || lowerUrl.includes(".tif")) return "image/tiff";
    if (lowerUrl.includes(".jpg") || lowerUrl.includes(".jpeg")) return "image/jpeg";
    return "image/jpeg";
  }
}

/**
 * 快速抓取函数 - 用于简单场景
 */
export async function quickScrape(url: string): Promise<string> {
  const scraper = new FireCrawlScraper();
  return await scraper.scrapeSimple(url);
}

/**
 * 智能提取函数 - 用于结构化数据提取
 */
export async function smartExtract<T>(
  url: string,
  prompt: string,
  schema?: any,
): Promise<T> {
  const scraper = new FireCrawlScraper();
  return await scraper.scrapeWithExtraction(url, prompt, schema);
}
