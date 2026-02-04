import { join } from "jsr:@std/path";
import { getDataSources} from "../data-sources/getDataSources.ts";
import {
  ContentScraper,
  ScrapedContent,
  ScraperOptions,
} from "@src/modules/interfaces/scraper.interface.ts";
import { BarkNotifier } from "@src/modules/notify/bark.notify.ts";
import { WeixinPublisher } from "@src/modules/publishers/weixin.publisher.ts";
import { WeixinTemplate } from "../modules/render/weixin/interfaces/article.type.ts";
import { FireCrawlScraper } from "@src/modules/scrapers/fireCrawl.scraper.ts";
import { GitHubTrendingScraper } from "@src/modules/scrapers/github-trending.scraper.ts";
import { AINewsScraper } from "@src/modules/scrapers/ai-news.scraper.ts";
import { AISummarizer } from "@src/modules/summarizer/ai.summarizer.ts";
import { LLMFactory } from "@src/providers/llm/llm-factory.ts";
import { ImageGeneratorFactory } from "@src/providers/image-gen/image-generator-factory.ts";
import { ConfigManager } from "@src/utils/config/config-manager.ts";
import {
  WorkflowEntrypoint,
  WorkflowEnv,
  WorkflowEvent,
  WorkflowStep,
} from "@src/works/workflow.ts";
import { WorkflowTerminateError } from "@src/works/workflow-error.ts";
import { Logger } from "@zilla/logger";
import { SimpleProgress } from "@src/utils/simple-progress.ts";
import { ImageGeneratorType } from "@src/providers/interfaces/image-gen.interface.ts";
import { VectorService } from "@src/services/vector-service.ts";
import { EmbeddingProvider } from "@src/providers/interfaces/embedding.interface.ts";
import { EmbeddingFactory } from "@src/providers/embedding/embedding-factory.ts";
import { EmbeddingProviderType } from "@src/providers/interfaces/embedding.interface.ts";
import { VectorSimilarityUtil } from "@src/utils/VectorSimilarityUtil.ts";
import { ImageFillerService } from "@src/services/image-filler.service.ts";
import { ScrapedDataStorage } from "@src/utils/scraped-data-storage.ts";
import { ArticleStorage } from "@src/utils/article-storage.ts";
import { UrlRegistry } from "@src/utils/url-registry.ts";
import { PreviewStore } from "@src/utils/preview-store.ts";
const logger = new Logger("weixin-article-workflow");

interface WeixinWorkflowEnv {
  name: string;
}

/**
 * 内容模式类型
 * - TECH_NEWS: 科技新闻模式（默认）
 * - GITHUB_TRENDING: GitHub 热门项目模式
 * - SINGLE_URL: 指定 URL 爬取模式
 * - TOPIC_SEARCH: 指定主题搜索模式
 * - AI_NEWS_SITE: AI 新闻网站模式（artificialintelligence-news.com）
 */
export type ContentMode = "TECH_NEWS" | "GITHUB_TRENDING" | "SINGLE_URL" | "TOPIC_SEARCH" | "AI_NEWS_SITE";

// 工作流参数类型定义
interface WeixinWorkflowParams {
  sourceType?: "all" | "firecrawl";
  /** 内容模式 */
  contentMode?: ContentMode;
  /** 指定 URL (SINGLE_URL 模式使用) */
  url?: string;
  /** 搜索主题 (TOPIC_SEARCH 模式使用) */
  topic?: string;
  maxArticles?: number;
  forcePublish?: boolean;
  /** 使用的模板: default, modern, tech, mianpro, qbit */
  template?: string;
  /** 是否仅生成预览（不正式发布） */
  previewOnly?: boolean;
  /** 自定义结语 */
  customFooter?: string;
  /** 最小字数限制 */
  minWords?: number;
  /** 最大字数限制 */
  maxWords?: number;
}

export class WeixinArticleWorkflow
  extends WorkflowEntrypoint<WeixinWorkflowEnv, WeixinWorkflowParams> {
  private scraper: Map<string, ContentScraper>;
  private summarizer: AISummarizer;
  private publisher: WeixinPublisher;
  private notifier: BarkNotifier;
  private vectorService: VectorService;
  private imageFillerService: ImageFillerService;
  private scrapedDataStorage: ScrapedDataStorage;
  private urlRegistry: UrlRegistry;
  private embeddingModel!: EmbeddingProvider;
  private existingVectors: { vector: number[]; content: string | null }[] = [];
  private stats = {
    success: 0,
    failed: 0,
    contents: 0,
    duplicates: 0,
  };

  constructor(env: WorkflowEnv<WeixinWorkflowEnv>) {
    super(env);
    this.scraper = new Map<string, ContentScraper>();
    this.scraper.set("fireCrawl", new FireCrawlScraper());
    this.scraper.set("github-trending", new GitHubTrendingScraper());
    this.scraper.set("ai-news", new AINewsScraper());
    this.summarizer = new AISummarizer();
    this.publisher = new WeixinPublisher();
    this.notifier = new BarkNotifier();
    this.vectorService = new VectorService();
    this.imageFillerService = new ImageFillerService();
    this.scrapedDataStorage = new ScrapedDataStorage();
    this.urlRegistry = UrlRegistry.getInstance();
  }

  public getWorkflowStats(eventId: string) {
    return this.metricsCollector.getWorkflowEventMetrics(this.env.id, eventId);
  }

  async run(
    event: WorkflowEvent<WeixinWorkflowParams>,
    step: WorkflowStep,
  ): Promise<void> {
    try {
      logger.info(
        `[工作流开始] 开始执行微信工作流, 当前工作流实例ID: ${this.env.id} 触发事件ID: ${event.id}`,
      );

      // 0. 刷新所有 LLM 提供者配置，确保前端保存的设置即时生效
      await LLMFactory.getInstance().refreshAllProviders();
      await ImageGeneratorFactory.getInstance().refreshAllGenerators();

      const configManager = ConfigManager.getInstance();
      const contentMode = event.payload.contentMode || 
        await configManager.get<ContentMode>("CONTENT_MODE").catch(() => "TECH_NEWS" as ContentMode);
      
      logger.info(`[工作流] 当前内容模式: ${contentMode}`);

      // 加载 URL 注册表
      await this.urlRegistry.load();

      // 验证IP白名单
      await step.do("validate-ip-whitelist", {
        retries: { limit: 3, delay: "10 second", backoff: "exponential" },
        timeout: "10 minutes",
      }, async () => {
        const isWhitelisted = await this.publisher.validateIpWhitelist();
        if (typeof isWhitelisted === "string") {
          this.notifier.warning(
            "IP白名单验证失败",
            `当前服务器IP(${isWhitelisted})不在微信公众号IP白名单中，请在微信公众平台添加此IP地址`,
          );
          throw new WorkflowTerminateError(
            `当前服务器IP(${isWhitelisted})不在微信公众号IP白名单中，请在微信公众平台添加此IP地址`,
          );
        }
        return isWhitelisted;
      });
      await this.notifier.info("工作流开始", "开始执行内容抓取和处理");

      // 获取数据源
      const sourceConfigs = await step.do("fetch-sources", async () => {
        const maxArticles = event.payload.maxArticles || await ConfigManager.getInstance().get("ARTICLE_NUM") || 5;
        const configs = await getDataSources(contentMode as any, maxArticles);
        // 如果是 GITHUB_TRENDING，configs.firecrawl 可能是空的，这没关系
        if (contentMode === "TECH_NEWS" && (!configs.firecrawl || configs.firecrawl.length === 0)) {
          throw new WorkflowTerminateError("未找到科技新闻 FireCrawl 数据源配置");
        }
        return configs;
      });

      const totalSources = sourceConfigs.firecrawl.length;

      if (contentMode === "TECH_NEWS" && totalSources === 0) {
        throw new WorkflowTerminateError("未配置任何科技新闻数据源");
      }

      if (contentMode === "TECH_NEWS") {
        logger.info(`[数据源] 发现 ${totalSources} 个 FireCrawl 数据源`);
      }

      // 3. 抓取内容
      const allContents = await step.do("scrape-contents", {
        retries: { limit: 3, delay: "10 second", backoff: "exponential" },
        timeout: "15 minutes",
      }, async () => {
        let contents: ScrapedContent[] = [];
        const contentsBySource = new Map<string, ScrapedContent[]>();

        if (contentMode === "GITHUB_TRENDING") {
          // GitHub Trending 模式：固定只抓取 1 个项目，直接使用 README 内容（不经过 summary 处理）
          logger.info("[工作流] 切换到 GitHub Trending 抓取流程（简化模式：1 个项目，直接使用 README）");
          const githubScraper = this.scraper.get("github-trending");
          if (!githubScraper) throw new Error("GitHubTrendingScraper not found");
          contents = await githubScraper.scrape("trending", { limit: 1 }); // 固定 1 个
          contentsBySource.set("github-trending", contents);
        } else if (contentMode === "SINGLE_URL") {
          const url = event.payload.url;
          if (!url) throw new Error("SINGLE_URL 模式下必须提供 url 参数");
          const fcScraper = this.scraper.get("fireCrawl") as FireCrawlScraper;
          const response = await fcScraper.v2Scrape(url);
          if (!response.success || !response.data) throw new Error(`抓取失败: ${response.error || '未知错误'}`);
          contents = [{
            id: `single_${Date.now()}`,
            title: response.data.metadata?.title || "未知标题",
            content: response.data.markdown || "",
            url: url,
            publishDate: new Date().toISOString().split("T")[0],
            media: [],
            metadata: { source: "fireCrawl", originalUrl: url, description: response.data.metadata?.description },
          }];
          contentsBySource.set("single-url", contents);
        } else if (contentMode === "TOPIC_SEARCH") {
          const topic = event.payload.topic;
          const limit = event.payload.maxArticles || 5;
          if (!topic) throw new Error("TOPIC_SEARCH 模式下必须提供 topic 参数");
          const fcScraper = this.scraper.get("fireCrawl") as FireCrawlScraper;
          const response = await fcScraper.v2Search(topic, limit);
          if (!response.success || !response.data) throw new Error(`搜索失败: ${response.error || '未知错误'}`);
          contents = response.data.map((item, index) => ({
            id: `search_${Date.now()}_${index}`,
            title: item.metadata?.title || item.url,
            content: item.markdown || "",
            url: item.url,
            publishDate: new Date().toISOString().split("T")[0],
            media: [],
            metadata: { source: "fireCrawl", originalUrl: item.url, description: item.metadata?.description },
          }));
          contentsBySource.set("topic-search", contents);
        } else if (contentMode === "AI_NEWS_SITE") {
          const aiNewsScraper = this.scraper.get("ai-news");
          if (!aiNewsScraper) throw new Error("AINewsScraper not found");
          const aiNewsLimit = event.payload.maxArticles || await ConfigManager.getInstance().get("ARTICLE_NUM") || 5;
          contents = await aiNewsScraper.scrape("ai-news-site", { limit: aiNewsLimit });
          contentsBySource.set("ai-news-site", contents);
          logger.info(`[AI_NEWS_SITE] 将抓取 ${aiNewsLimit} 篇文章`);
        } else {
          // 默认 TECH_NEWS 逻辑
          const fireCrawlScraper = this.scraper.get("fireCrawl");
          if (!fireCrawlScraper) throw new Error("FireCrawlScraper not found");
          const scrapeProgress = new SimpleProgress({ title: "内容抓取进度", total: totalSources });
          let scrapeCompleted = 0;
          let totalArticles = 0;

          for (const source of sourceConfigs.firecrawl) {
            const maxRecursiveLinks = (source as any).maxRecursiveLinks || 3; // 默认每个 URL 最多抓取 3 个链接
            const sourceContents = await this.scrapeSource("FireCrawl", source, fireCrawlScraper, {
              filters: { enableRecursive: true, maxRecursiveLinks: maxRecursiveLinks }
            });
            contents.push(...sourceContents);
            contentsBySource.set(source.identifier, sourceContents);
            totalArticles += sourceContents.length;
            await scrapeProgress.render(++scrapeCompleted, {
              title: `抓取 FireCrawl: ${source.identifier} | 已获取文章: ${totalArticles}篇`,
            });
          }
        }

        // 过滤掉超过一周的新闻
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        
        const recentContents = contents.filter((content) => {
          if (!content.publishDate) {
            // 如果没有发布日期，保留（可能是实时新闻）
            return true;
          }
          
          try {
            const publishDate = new Date(content.publishDate);
            if (isNaN(publishDate.getTime())) {
              // 日期格式无效，保留
              return true;
            }
            
            const isRecent = publishDate >= oneWeekAgo;
            if (!isRecent) {
              logger.debug(`[时间过滤] 过滤掉过期内容: ${content.title} (发布日期: ${content.publishDate})`);
            }
            return isRecent;
          } catch (error) {
            // 解析日期失败，保留
            logger.warn(`[时间过滤] 无法解析日期: ${content.publishDate}`, error);
            return true;
          }
        });
        
        const filteredCount = contents.length - recentContents.length;
        if (filteredCount > 0) {
          logger.info(`[时间过滤] 过滤掉 ${filteredCount} 篇超过一周的旧新闻`);
        }
        
        // --- 统一对所有抓取的内容进行 URL 去重（GitHub 项目除外） ---
        const filteredContents = recentContents.filter(content => {
          // GitHub 项目只使用 github-project-registry.json 去重，不使用 url-registry.json
          if (contentMode === "GITHUB_TRENDING") {
            return true;
          }
          
          if (this.urlRegistry.isProcessed(content.url)) {
            logger.info(`[去重] URL 已存在，跳过: ${content.title} (${content.url})`);
            return false;
          }
          return true;
        });

        const dedupedCount = recentContents.length - filteredContents.length;
        if (dedupedCount > 0) {
          logger.info(`[去重] 基于 URL 过滤掉 ${dedupedCount} 篇已发布过的文章`);
        }

        this.stats.contents = filteredContents.length;
        if (this.stats.contents === 0) {
          throw new WorkflowTerminateError("所有获取到的内容都已发布过，流程终止");
        }

        // --- 新增：对所有内容执行 LLM 预提取 ---
        // SINGLE_URL 模式使用专用的轻量级提取（保留更多原文）
        await this.performGlobalLlmExtraction(filteredContents, contentMode);

        // 按数据源分组过滤后的内容
        const recentContentsBySource = new Map<string, ScrapedContent[]>();
        for (const [sourceIdentifier, sourceContents] of contentsBySource.entries()) {
          const recentSourceContents = sourceContents.filter((content) => {
            // GitHub 项目只使用 github-project-registry.json 去重，不使用 url-registry.json
            if (contentMode === "GITHUB_TRENDING") {
              if (!content.publishDate) {
                return true;
              }
              try {
                const publishDate = new Date(content.publishDate);
                if (isNaN(publishDate.getTime())) {
                  return true;
                }
                return publishDate >= oneWeekAgo;
              } catch {
                return true;
              }
            }
            
            // 其他模式：同时应用时间过滤和 URL 过滤
            if (!content.publishDate) {
              return !this.urlRegistry.isProcessed(content.url);
            }
            try {
              const publishDate = new Date(content.publishDate);
              if (isNaN(publishDate.getTime())) {
                return !this.urlRegistry.isProcessed(content.url);
              }
              return publishDate >= oneWeekAgo && !this.urlRegistry.isProcessed(content.url);
            } catch {
              return !this.urlRegistry.isProcessed(content.url);
            }
          });
          if (recentSourceContents.length > 0) {
            recentContentsBySource.set(sourceIdentifier, recentSourceContents);
          }
        }

        // 保存爬取的数据到本地文件（按数据源分别保存）
        logger.info(`[数据存储] 开始按数据源保存爬取的数据到本地`);
        try {
          const savedFolders = await this.scrapedDataStorage.saveScrapedDataBySource(recentContentsBySource);
          logger.info(`[数据存储] 爬取数据已保存到 ${savedFolders.size} 个文件夹`);
          for (const [sourceIdentifier, folderPath] of savedFolders.entries()) {
            logger.info(`[数据存储] ${sourceIdentifier} -> ${folderPath}`);
          }
        } catch (error) {
          logger.error("[数据存储] 保存爬取数据失败:", error);
          // 保存失败不影响后续流程，继续使用内存中的数据
        }

        return filteredContents;
      });

      // 4. 从本地读取爬取的数据（针对模式做不同处理）
      // 先获取期望的文章数量
      const expectedArticles = event.payload.maxArticles ||
        await ConfigManager.getInstance().get("ARTICLE_NUM") || 5;

      const localContents = await step.do("load-local-data", {
        retries: { limit: 1, delay: "2 second", backoff: "linear" },
        timeout: "2 minutes",
      }, async () => {
        if (contentMode === "GITHUB_TRENDING" || contentMode === "SINGLE_URL" || contentMode === "TOPIC_SEARCH" || contentMode === "AI_NEWS_SITE") {
          logger.info(`[数据读取] ${contentMode} 模式，使用本次抓取的全部内容 (${allContents.length} 篇)`);
          return allContents;
        }

        // ✅ 使用期望的文章数量，而不是固定的 4
        logger.info(`[数据读取] 从本地文件读取爬取的数据，期望 ${expectedArticles} 篇`);
        const contents = await this.scrapedDataStorage.loadRandomArticlesFromSources(expectedArticles);
        if (contents.length === 0) {
          logger.warn("[数据读取] 本地文件为空，使用内存中的爬取数据");
          // 如果本地没有数据，从内存数据中选择
          const shuffled = [...allContents].sort(() => Math.random() - 0.5);
          return shuffled.slice(0, Math.min(expectedArticles, shuffled.length));
        }
        logger.info(`[数据读取] 从本地文件随机挑选到 ${contents.length} 条数据`);
        return contents;
      });

      // 5. 内容去重
      const uniqueContents = await step.do("dedup-contents", {
        retries: { limit: 2, delay: "5 second", backoff: "exponential" },
        timeout: "15 minutes",
      }, async () => {
        // 这些模式跳过去重，保留抓到的所有内容
        if (contentMode === "GITHUB_TRENDING" || contentMode === "SINGLE_URL" || contentMode === "TOPIC_SEARCH") {
          return localContents;
        }

        const ENABLE_DEDUPLICATION = await ConfigManager.getInstance().get(
          "ENABLE_DEDUPLICATION",
        );

        if (!ENABLE_DEDUPLICATION) {
          return localContents;
        }

        // 初始化 embedding 模型
        this.embeddingModel = await EmbeddingFactory.getInstance().getProvider({
          providerType: EmbeddingProviderType.DASHSCOPE,
          model: "text-embedding-v3",
        });

        // 获取所有已存在的向量
        const existingVectors = await this.vectorService.getByType("article");
        this.existingVectors = existingVectors.map((v) => ({
          vector: v.vector,
          content: v.content,
        }));

        // 预先计算所有内容的embedding
        const contentEmbeddings = new Map<string, number[]>();
        const newVectors: {
          content: string;
          vector: number[];
          vectorDim: number;
          vectorType: string;
        }[] = [];

        logger.info("[向量计算] 开始批量计算内容向量");
        const embedProgress = new SimpleProgress({
          title: "向量计算进度",
          total: localContents.length,
        });
        let embedCompleted = 0;

        // 并行计算所有内容的embedding
        await Promise.all(
          localContents.map(async (content) => {
            try {
              const embedding = await this.embeddingModel.createEmbedding(
                content.content,
              );
              contentEmbeddings.set(content.id, embedding.embedding);
              newVectors.push({
                content: content.content,
                vector: embedding.embedding,
                vectorDim: embedding.embedding.length,
                vectorType: "article",
              });
            } catch (error) {
              logger.error(
                `[向量计算] 计算内容 ${content.id} 的向量失败:`,
                error,
              );
            }
            await embedProgress.render(++embedCompleted);
          }),
        );

        logger.info(
          `[向量计算] 完成 ${contentEmbeddings.size} 个内容的向量计算`,
        );

        // 过滤掉重复内容
        const deduplicatedContents: ScrapedContent[] = [];

        for (const content of localContents) {
          const contentVector = contentEmbeddings.get(content.id);
          if (!contentVector) continue;

          // 检查是否与已处理的内容重复
          const isDuplicate = await this.checkDuplicateWithVector(
            content,
            contentVector,
          );

          if (!isDuplicate) {
            deduplicatedContents.push(content);
          }
        }

        // 批量保存新的向量到数据库
        if (newVectors.length > 0) {
          logger.info(`[向量存储] 开始批量保存 ${newVectors.length} 个新向量`);
          await this.vectorService.createBatch(newVectors);
          logger.info("[向量存储] 向量保存完成");
        }

        logger.info(
          `[去重] 完成内容去重，原始内容 ${localContents.length} 篇，去重后 ${deduplicatedContents.length} 篇，重复 ${this.stats.duplicates} 篇`,
        );

        return deduplicatedContents;
      });

      // 6. 直接使用去重后的内容（不再排序）
      const rankedContents = uniqueContents.map((content, index) => ({
        id: content.id,
        score: 100 - index, // 保持原有顺序
        reason: "保持原始顺序",
      }));
      logger.info(`[内容流程追踪] 抓取: ${allContents.length} 篇 -> 本地加载: ${localContents.length} 篇 -> 去重后: ${uniqueContents.length} 篇 -> 准备处理: ${rankedContents.length} 篇`);
      logger.info(`[内容处理] 使用 ${rankedContents.length} 条内容`);

      // 7. 处理内容
      const processedContents = await step.do("process-contents", {
        retries: { limit: 2, delay: "5 second", backoff: "exponential" },
        timeout: "15 minutes",
      }, async () => {
        let maxArticles = event.payload.maxArticles ||
          await ConfigManager.getInstance().get("ARTICLE_NUM") || 5;

        // 这些模式使用全部内容（不限制数量）
        if (contentMode === "GITHUB_TRENDING" || contentMode === "SINGLE_URL" || contentMode === "TOPIC_SEARCH") {
          maxArticles = rankedContents.length;
        }

        // ✅ 增强日志：打印配置和实际使用的 maxArticles
        logger.info(`[内容处理] maxArticles 配置: payload=${event.payload.maxArticles || "未设置"}, 配置文件=${await ConfigManager.getInstance().get("ARTICLE_NUM") || "未设置"}, 最终使用=${maxArticles}`);
        logger.info(`[内容处理] 模式=${contentMode}, 可用内容=${rankedContents.length} 篇, 将处理=${Math.min(maxArticles, rankedContents.length)} 篇`);

        // 取前maxArticles篇文章
        const topContents: ScrapedContent[] = [];

        for (const ranked of rankedContents.slice(0, maxArticles)) {
          const content = uniqueContents.find((c) => c.id === ranked.id);
          if (content) {
            content.metadata.score = ranked.score;
            content.metadata.wordCount = content.content.length;
            content.metadata.readTime = Math.ceil(
              content.metadata.wordCount / 275,
            );
            topContents.push(content);
          }
        }

        // 如果文章数量不足，记录警告
        if (topContents.length < maxArticles) {
          logger.warn(
            `[内容处理] 文章数量不足，期望 ${maxArticles} 篇，实际 ${topContents.length} 篇`,
          );
          await this.notifier.warning(
            "内容数量不足",
            `仅获取到 ${topContents.length} 篇文章，少于预期的 ${maxArticles} 篇`,
          );
        }

        logger.debug(
          `[内容处理] 开始处理文章，共 ${topContents.length} 篇: ${topContents.map(c => c.title).join(", ")}`,
        );

        // 处理内容（润色等）
        const processProgress = new SimpleProgress({
          title: "内容处理进度",
          total: topContents.length,
        });
        let processCompleted = 0;


//         把每一个 content（内容）变成了每一个 Promise（任务）。
//       结果就是把“内容数组”映射成了“任务数组”
// Promise.all 汇总 (The Collector)
// map 执行完后，它返回了一个数组：[任务A的Promise, 任务B的Promise, 任务C的Promise]。

// Promise.all 把这三个“小取餐器”捆在一起，变成一个“大取餐器”。

        await Promise.all(topContents.map(async (content) => {
          await this.processContent(content, contentMode, {
            minWords: event.payload.minWords,
            maxWords: event.payload.maxWords
          });
          await processProgress.render(++processCompleted, {
            title: `已处理: ${content.title?.slice(0, 5) || "无标题"}...`,
          });
        }));

        return topContents;
      });

      // 8. 生成文章
      const { summaryTitle, mediaId, renderedTemplate, introduction, fullMarkdown, coverImageUrl } = await step.do(
        "generate-article",
        {
          retries: { limit: 2, delay: "5 second", backoff: "exponential" },
          timeout: "10 minutes",
        },
        async () => {
          // ... (现有生成逻辑保持不变，只需收集结果)
          // [省略中间代码以匹配 StrReplace 要求，实际执行时会保留原逻辑]
          // 8.1 生成引入内容（使用所有文章标题）
          // SINGLE_URL 单篇转载模式不需要引入
          logger.info("[引入内容] 开始生成文章开头引入内容");
          let introduction: string = "";
          
          if (contentMode !== "SINGLE_URL") {
            try {
              const articleTitles = processedContents.map(c => c.title);
              introduction = await this.summarizer.generateIntroduction({
                articleTitles: articleTitles,
                articleCount: processedContents.length,
                contentMode: contentMode,
              });
              logger.info(`[引入内容] 引入内容生成成功 (${contentMode} 模式)，长度: ${introduction.length} 字符`);
            } catch (error) {
              logger.error("[引入内容] 生成引入内容失败:", error);
              // 失败时使用默认引入（根据模式使用不同的默认文本）
              const articleTitles = processedContents.map(c => c.title);
              if (contentMode === "GITHUB_TRENDING") {
                introduction = `本期精选 ${processedContents.length} 个 GitHub 热门项目：${articleTitles.slice(0, 2).map(t => t.split("(")[0].trim()).join("，")}等。`;
              } else {
                introduction = `今天为大家带来${processedContents.length}篇精选AI科技新闻，涵盖${articleTitles.slice(0, 3).join("、")}等前沿话题。让我们一起探索人工智能领域的最新动态和技术突破。`;
              }
            }
          } else {
            logger.info("[引入内容] SINGLE_URL 单篇转载模式，跳过引入内容生成");
          }

          // 准备模板数据
          const templateData: WeixinTemplate[] = processedContents.map(
            (content) => ({
              id: content.id,
              title: content.title,
              content: content.content,
              url: content.url,
              publishDate: content.publishDate,
              metadata: content.metadata,
              keywords: content.metadata.keywords,
              media: content.media,
            }),
          );

          // 直接使用默认结语（不再生成）
          const footer = `\n\n## 结语\n\n感谢您的阅读，我们将继续为您捕捉人工智能领域的每一个创新瞬间。\n\n💬 你对本期哪个内容最感兴趣？欢迎在评论区交流心得！\n⭐ 觉得文章不错？点个「在看」分享给同样热爱技术的伙伴们！\n\n<center>\n    <img src="https://fastly.jsdelivr.net/gh/bucketio/img18@main/2026/01/06/1767672738369-47fc1fed-2c8b-49d2-ae30-f8a45edc41bb.png" style="width: 100px;">\n</center>`;

          // 渲染文章（包含引入内容）
          logger.info("[渲染] 使用 DoocsMd 渲染器（文章渲染，包含引入内容）");
          const { DoocsMdRenderer } = await import("@src/modules/render/weixin/doocs-md.renderer.ts");
          
          // 获取配置的模板风格，默认为 default
          const templateTheme = event.payload.template || await ConfigManager.getInstance().get<string>("WEIXIN_ARTICLE_TEMPLATE_TYPE") || "default";
          
          const doocsMdRenderer = new DoocsMdRenderer({
            theme: templateTheme as any,
            primaryColor: "#3f9cf5",
            fontSize: 16,
            codeBackgroundColor: "#282c34",        // 深色代码块背景（VS Code Dark 风格）
            codeTextColor: "#abb2bf",              // 浅灰色代码文字
            inlineCodeBackgroundColor: "rgba(27, 31, 35, 0.05)",
            inlineCodeTextColor: "#d14",
            showCitation: true,
          });
          
          // 传递引入内容和内容模式到渲染器
          // 注意：初次渲染时跳过图片处理（上传），以便显示本地/原始 URL
          const renderedTemplate = await doocsMdRenderer.render(templateData, {
            introduction: introduction,
            contentMode: contentMode, // 传递内容模式，用于控制项目地址链接显示
            skipImageProcessing: true, // 预览阶段跳过
            footer: footer, // 传入结语
          });

          logger.info(`[渲染] 文章渲染完成，HTML 长度：${renderedTemplate.length} 字符`);

          // 等待文章生成完毕后确定主标题
          logger.info("[标题生成] 文章生成完毕，开始确定主标题");

          let generatedTitle = "";
          // SINGLE_URL 转载模式：直接使用文章标题
          if (contentMode === "SINGLE_URL" && processedContents.length > 0) {
            generatedTitle = processedContents[0].title;
            logger.info(`[标题生成] SINGLE_URL 转载模式，使用标题: ${generatedTitle}`);
          } else if (processedContents.length > 0) {
            // 使用 LLM 生成标题（基于第一篇文章内容）
            try {
              const firstArticle = processedContents[0];
              // 取第一篇文章的前2000字符作为生成标题的依据
              const contentForTitle = firstArticle.content.substring(0, 2000);
              generatedTitle = await this.summarizer.generateTitle(contentForTitle, { contentMode });
              logger.info(`[标题生成] LLM 生成标题成功: ${generatedTitle}`);
            } catch (titleError) {
              // LLM 生成失败时，回退到从文章中提取标题
              logger.warn(`[标题生成] LLM 生成标题失败，回退到提取模式: ${titleError instanceof Error ? titleError.message : String(titleError)}`);
              const firstArticle = processedContents[0];
              const headingMatch = firstArticle.content.match(/^###\s+(.+)$/m);
              if (headingMatch && headingMatch[1]) {
                generatedTitle = headingMatch[1].trim();
              } else {
                generatedTitle = firstArticle.title;
              }
              logger.info(`[标题生成] 回退后使用标题: ${generatedTitle}`);
            }
          } else {
            generatedTitle = "AI 科技速递";
            logger.warn(`[标题生成] 没有文章内容，使用默认标题: ${generatedTitle}`);
          }
          
          // 验证字节数（微信公众号限制：64字节）
          const getByteLength = (str: string): number => {
            return new TextEncoder().encode(str).length;
          };
          
          const maxBytes = 64; // 微信公众号标题最大64字节，必须严格遵守
          const titleBytes = getByteLength(generatedTitle);
          
          if (titleBytes > maxBytes) {
            logger.warn(`[标题验证] 标题字节数 ${titleBytes} 超过限制 ${maxBytes}，进行截断`);
            
            // 按字节截断
            let truncated = "";
            let byteCount = 0;
            for (const char of generatedTitle) {
              const charBytes = getByteLength(char);
              if (byteCount + charBytes > maxBytes) {
                break;
              }
              truncated += char;
              byteCount += charBytes;
            }
            
            generatedTitle = truncated;
            logger.info(`[标题验证] 截断后标题: ${generatedTitle} (${getByteLength(generatedTitle)} 字节)`);
          } else {
            logger.info(`[标题验证] 标题长度符合要求: ${generatedTitle} (${titleBytes} 字节)`);
          }
          
          logger.info(`[标题生成] 最终标题: ${generatedTitle}`);

          // 生成封面图片（使用新生成的标题）
          const imageGeneratorType = await ConfigManager.getInstance().get<string>("IMAGE_GENERATOR_TYPE") || "QWEN_IMAGE_MAX";
          const imageGenerator = await ImageGeneratorFactory.getInstance()
            .getGenerator(imageGeneratorType as ImageGeneratorType);
          
          let coverImageUrl: string;
          try {
            if (imageGeneratorType === "QWEN_IMAGE_MAX") {
              // Qwen Image Max 图片生成器 - 高质量文生图
              coverImageUrl = await imageGenerator.generate({
                prompt: `生成信息图表风格的科技封面图：以"${generatedTitle}"为主题，展示相关的技术概念、应用场景和创新元素。要求：专业、现代、充满科技感，使用蓝色和紫色为主色调，横版布局。不要包含时间、日期或"AI速递"等字样。`,
                size: "1664*928", // 宽屏尺寸，适合公众号封面
                prompt_extend: true, // 启用提示词增强
              });
            } else if (imageGeneratorType === "GEMINI" || imageGeneratorType === "GEMINI_PRO") {
              // Gemini 图片生成器 - 左侧标题文字，右侧使用实例，强制2.35:1比例
              const geminiGenerator = imageGenerator as any;
              coverImageUrl = await geminiGenerator.generatePoster({
                title: generatedTitle,
                sub_title: undefined, // 不使用副标题
                prompt_text_zh: `生成信息图表风格的封面图：左侧显示标题文字"${generatedTitle}"，右侧展示相关的使用实例和应用场景。要求：专业、现代、信息图表风格，不要包含时间、日期或"AI速递"等字样。`,
                aspectRatio: "2.35:1", // 强制2.35:1比例
              });
            } else {
              throw new Error(`不支持的图片生成器类型: ${imageGeneratorType}`);
            }
          } catch (imageError) {
            logger.error(`[封面图片] 生成失败，尝试使用默认封面: ${imageError instanceof Error ? imageError.message : String(imageError)}`);
            // 如果生成失败，使用一个默认图片 URL
            try {
              const defaultUrl = await ConfigManager.getInstance().get<string>("DEFAULT_COVER_IMAGE_URL");
              coverImageUrl = defaultUrl || "https://fastly.jsdelivr.net/gh/bucketio/img18@main/2026/01/06/1767672738369-47fc1fed-2c8b-49d2-ae30-f8a45edc41bb.png";
            } catch {
              // 如果配置项不存在，使用硬编码的默认图片
              coverImageUrl = "https://fastly.jsdelivr.net/gh/bucketio/img18@main/2026/01/06/1767672738369-47fc1fed-2c8b-49d2-ae30-f8a45edc41bb.png";
            }
            logger.info(`[封面图片] 使用默认封面: ${coverImageUrl}`);
          }

          // 上传封面图片
          const media = await this.publisher.uploadImage(coverImageUrl);
          
          logger.info(`[封面图片] 封面图片已生成并上传，mediaId: ${media}`);

          // 构建完整 Markdown 内容（在 try 块外部定义，确保作用域正确）
          let articleMarkdown = `# ${generatedTitle}\n\n`;
          
          // SINGLE_URL 单篇转载模式：不添加引入、不添加文章标题层、直接使用内容
          if (contentMode === "SINGLE_URL" && processedContents.length > 0) {
            logger.info("[Markdown组装] SINGLE_URL 单篇模式，直接使用翻译后的内容");
            articleMarkdown += processedContents[0].content + "\n\n";
          } else {
            // 多篇文章模式：添加引入、为每篇文章添加 ## 标题
            if (introduction) {
              articleMarkdown += `${introduction}\n\n---\n\n`;
            }
            
            processedContents.forEach((content, index) => {
              articleMarkdown += `## ${content.title}\n\n${content.content}\n\n`;
              if (index < processedContents.length - 1) {
                articleMarkdown += `\n---\n\n`;
              }
            });
          }

          // --- 缓存到预览存储器 ---
          const previewStore = PreviewStore.getInstance();
          
          // 准备最终路径
          const articleStorage = new ArticleStorage();
          // @ts-ignore - 访问私有方法用于生成一致的文件夹名
          const folderName = articleStorage.generateFolderName(generatedTitle);
          const saveDir = join("./data/articles", folderName);
          await (import("jsr:@std/fs")).then(m => m.ensureDir(saveDir));

          // ✅ 本地化所有内容中的图片，以便预览和修改
          logger.info(`[本地化] 开始本地化文章内容中的图片到: ${saveDir}`);
          
          // 本地化各个子文章内容
          for (const art of templateData) {
            art.content = await this.localizeImages(art.content, saveDir);
          }
          
          // 本地化引入内容
          let localIntroduction = introduction;
          if (localIntroduction) {
            localIntroduction = await this.localizeImages(localIntroduction, saveDir);
          }
          
          // 重新组装本地化后的完整 Markdown（包含 media 中的图片）
          let finalLocalMarkdown = `# ${generatedTitle}\n\n`;
          if (contentMode === "SINGLE_URL" && templateData.length > 0) {
            finalLocalMarkdown += templateData[0].content + "\n\n";
          } else {
            if (localIntroduction) finalLocalMarkdown += `${localIntroduction}\n\n---\n\n`;
            templateData.forEach((art, idx) => {
              const articleContent = art.content || "";
              finalLocalMarkdown += `## ${art.title}\n\n${articleContent}\n\n`;
              if (idx < templateData.length - 1) finalLocalMarkdown += `---\n\n`;
            });
          }
          if (footer) finalLocalMarkdown += `\n---\n\n${footer}`;

          // 重新渲染本地化后的 HTML（包含结语）
          const finalLocalHtml = await doocsMdRenderer.render(templateData, {
            introduction: localIntroduction,
            contentMode: contentMode,
            skipImageProcessing: true,
            footer: footer, // 传入结语以便渲染
          });

          // 保存本地文章
          const savedPath = await articleStorage.saveArticle({
            title: generatedTitle,
            markdown: finalLocalMarkdown,
            html: finalLocalHtml,
            coverImageUrl: coverImageUrl,
            baseDir: "./data/articles", // 使用确定的目录
          });

          previewStore.setPreview({
            id: `preview_${Date.now()}`,
            title: generatedTitle,
            html: finalLocalHtml,
            markdown: finalLocalMarkdown,
            coverImageUrl: coverImageUrl,
            articles: templateData,
            introduction: localIntroduction,
            footer: footer,
            localPath: join(savedPath, "article.md"), // 记录本地路径供修改
            metadata: {
              contentMode,
              articleCount: processedContents.length,
            }
          });
          logger.info("[预览] 文章已缓存至预览存储器，所有图片已本地化");

          return {
            summaryTitle: generatedTitle,
            mediaId: media,
            renderedTemplate: finalLocalHtml,
            introduction: localIntroduction,
            fullMarkdown: finalLocalMarkdown,
            coverImageUrl: coverImageUrl,
          };
        },
      );

      // 9. 发布文章
      if (event.payload.previewOnly) {
        logger.info("[工作流] previewOnly 模式，跳过发布步骤。请通过 UI 面板确认后正式发布。");
        await this.notifier.info("预览生成完成", `文章《${summaryTitle}》预览已就绪，请在控制面板确认发布。`);
      } else {
        await step.do("publish-article", {
          retries: { limit: 3, delay: "10 second", backoff: "exponential" },
          timeout: "5 minutes",
        }, async () => {
          logger.info("[发布] 发布到微信公众号");
          return await this.publisher.publish(
            renderedTemplate,
            summaryTitle,
            summaryTitle,
            mediaId,
          );
        });
      }

      // 10. 注册已发布的文章 URL 到去重表（GitHub 项目除外）
      // GitHub 项目只使用 github-project-registry.json 去重，不使用 url-registry.json
      if (processedContents && processedContents.length > 0 && contentMode !== "GITHUB_TRENDING") {
        logger.info(`[去重] 正在将 ${processedContents.length} 个 URL 注册到全局去重表`);
        for (const content of processedContents) {
          this.urlRegistry.register(content.url, content.title, contentMode);
        }
        await this.urlRegistry.save();
      }

      // 11. 完成报告
      const summary = `
        工作流执行完成
        - 数据源: ${totalSources} 个
        - 成功: ${this.stats.success} 个
        - 失败: ${this.stats.failed} 个
        - 内容: ${this.stats.contents} 条
        - 重复: ${this.stats.duplicates} 条
        - 发布: 成功`.trim();

      logger.info(`[工作流完成] ${summary}`);

      if (this.stats.failed > 0) {
        await this.notifier.warning("工作流完成(部分失败)", summary);
      } else {
        await this.notifier.success("工作流完成", summary);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      // 如果是终止错误，发送通知后直接抛出
      if (error instanceof WorkflowTerminateError) {
        await this.notifier.warning("工作流终止", message);
        throw error;
      }

      logger.error("[工作流] 执行失败:", message);
      await this.notifier.error("工作流失败", message);
      throw error;
    }
  }

  private async scrapeSource(
    type: string,
    source: { identifier: string },
    scraper: ContentScraper,
    options?: ScraperOptions,
  ): Promise<ScrapedContent[]> {
    try {
      logger.debug(`[${type}] 抓取: ${source.identifier}`);
      const contents = await scraper.scrape(source.identifier, options);
      this.stats.success++;
      return contents;
    } catch (error) {
      this.stats.failed++;
      const message = error instanceof Error ? error.message : String(error);
      logger.error(`[${type}] ${source.identifier} 抓取失败:`, message);
      await this.notifier.warning(
        `${type}抓取失败`,
        `源: ${source.identifier}\n错误: ${message}`,
      );
      return [];
    }
  }

  /**
   * 预处理图片：提取、过滤、上传并建立映射
   * @param content 待处理的内容
   * @returns 原始URL -> 微信CDN URL 的映射表
   */
  private async preProcessImages(content: ScrapedContent): Promise<Map<string, string>> {
    const mapping = new Map<string, string>();
    
    try {
      // 1. 提取所有图片 URL（包括 Markdown 和 HTML）
      const imageUrls = this.extractImageUrls(content.content);
      
      if (imageUrls.length === 0) {
        logger.debug(`[图片预处理] ${content.id} 未发现图片`);
        return mapping;
      }
      
      logger.info(`[图片预处理] ${content.id} 发现 ${imageUrls.length} 张图片`);
      
      // 2. 使用 WeixinImageProcessor 检查尺寸并过滤
      // 注意：需要导入 WeixinImageProcessor 并实例化
      const { WeixinImageProcessor } = await import("@src/utils/image/image-processor.ts");
      const imageProcessor = new WeixinImageProcessor(this.publisher);
      const qualifiedImages: string[] = [];
      
      for (const url of imageUrls) {
        // 跳过已经是微信 CDN 的图片
        if (url.includes('mmbiz.qpic.cn')) {
          logger.debug(`[图片预处理] 跳过微信CDN图片: ${url.substring(0, 50)}...`);
          continue;
        }
        
        // 检查尺寸
        const isQualified = await imageProcessor.isHighQualityImage(url);
        
        if (isQualified) {
          qualifiedImages.push(url);
        }
      }
      
      logger.info(`[图片预处理] ${content.id} 筛选出 ${qualifiedImages.length} 张符合尺寸要求的图片`);
      
      // 3. 处理并上传符合要求的图片
      for (const url of qualifiedImages) {
        try {
          // 下载图片
          const response = await fetch(url);
          if (!response.ok) {
            logger.warn(`[图片预处理] 下载失败: ${url.substring(0, 50)}...`);
            continue;
          }

          // 若 Content-Type 明确为 HTML/XML，直接跳过，避免把错误页当图片上传
          const contentType = (response.headers.get("content-type") || "").toLowerCase();
          if (contentType.includes("text/html") || contentType.includes("application/xml") || contentType.includes("text/xml")) {
            logger.warn(`[图片预处理] URL 返回 HTML/XML 而非图片，已跳过: ${url.substring(0, 50)}...`);
            continue;
          }

          const imageBuffer = new Uint8Array(await response.arrayBuffer());
          if (imageBuffer.length === 0) {
            logger.warn(`[图片预处理] 图片数据为空: ${url.substring(0, 50)}...`);
            continue;
          }

          // 检查文件头：拒绝 HTML/XML（<?xm、<!DO、<htm），只接受 JPEG/PNG
          const isJPEG = imageBuffer[0] === 0xFF && imageBuffer[1] === 0xD8;
          const isPNG = imageBuffer[0] === 0x89 && imageBuffer[1] === 0x50 && imageBuffer[2] === 0x4E && imageBuffer[3] === 0x47;
          const looksLikeXml = (imageBuffer[0] === 0x3c && imageBuffer[1] === 0x3f) || (imageBuffer[0] === 0x3c && imageBuffer[1] === 0x21) || (imageBuffer[0] === 0x3c && imageBuffer[1] === 0x68);

          if (looksLikeXml) {
            logger.warn(`[图片预处理] 返回内容为 HTML/XML 而非图片(文件头 3c...)，已跳过: ${url.substring(0, 50)}...`);
            continue;
          }
          if (!isJPEG && !isPNG) {
            const hex = Array.from(imageBuffer.slice(0, 4)).map((b) => b.toString(16).padStart(2, "0")).join(" ");
            logger.warn(`[图片预处理] 格式非 JPEG/PNG(文件头: ${hex})，已跳过: ${url.substring(0, 50)}...`);
            continue;
          }

          // 使用 processContent 中的 uploadContentImage 方法上传
          const weixinUrl = await this.publisher.uploadContentImage(url, imageBuffer);
          
          mapping.set(url, weixinUrl);
          logger.info(`[图片预处理] 上传成功: ${url.substring(0, 30)}... -> ${weixinUrl.substring(0, 50)}...`);
        } catch (error) {
          logger.warn(`[图片预处理] 处理图片失败: ${url.substring(0, 50)}... - ${error instanceof Error ? error.message : String(error)}`);
        }
      }
      
      logger.info(`[图片预处理] ${content.id} 完成，成功上传 ${mapping.size} 张图片`);
      
    } catch (error) {
      logger.error(`[图片预处理] ${content.id} 预处理失败:`, error);
    }
    
    return mapping;
  }
  
  /**
   * 从内容中提取所有有效的图片 URL
   * @param content Markdown 或 HTML 内容
   * @returns 图片 URL 数组
   */
  private extractImageUrls(content: string): string[] {
    const urls = new Set<string>();
    
    // 基础过滤函数：排除相对路径和常见垃圾 URL
    const isValid = (url: string) => {
      if (!url || !url.startsWith('http')) return false;
      const lower = url.toLowerCase();
      // 排除常见的徽章、图标、追踪像素等
      return !lower.includes('badge') && 
             !lower.includes('shields.io') && 
             !lower.includes('travis-ci') && 
             !lower.includes('coveralls.io') && 
             !lower.includes('codecov.io') &&
             !lower.includes('favicon') &&
             !lower.includes('pixel');
    };

    // 1. Markdown 图片: ![alt](url)
    const mdPattern = /!\[[^\]]*\]\(([^)]+)\)/g;
    let match;
    while ((match = mdPattern.exec(content)) !== null) {
      if (isValid(match[1])) urls.add(match[1]);
    }
    
    // 2. HTML img 标签: <img src="url" />
    const imgPattern = /<img[^>]+src=["']([^"']+)["'][^>]*>/g;
    while ((match = imgPattern.exec(content)) !== null) {
      if (isValid(match[1])) urls.add(match[1]);
    }
    
    // 3. 提取标题前的图片
    const headingImageUrls = this.extractImagesBeforeHeadings(content);
    headingImageUrls.forEach(url => {
      if (isValid(url)) urls.add(url);
    });
    
    return Array.from(urls);
  }

  /**
   * 提取每个标题前的图片
   * 标题格式：## 或 ###
   */
  private extractImagesBeforeHeadings(content: string): string[] {
    const urls: string[] = [];
    const lines = content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      // 检测标题：## 或 ###
      if (line.match(/^#{2,3}\s+/)) {
        // 向前查找，找到第一个图片（最多向前查找5行）
        for (let j = Math.max(0, i - 5); j < i; j++) {
          const prevLine = lines[j];
          // 匹配 Markdown 图片
          const mdMatch = prevLine.match(/!\[([^\]]*)\]\(([^)]+)\)/);
          if (mdMatch) {
            urls.push(mdMatch[2]);
            break; // 只取第一个图片
          }
          // 匹配 HTML img 标签
          const htmlMatch = prevLine.match(/<img[^>]+src=["']([^"']+)["'][^>]*>/);
          if (htmlMatch) {
            urls.push(htmlMatch[1]);
            break;
          }
        }
      }
    }
    
    return urls;
  }

  /**
   * 将 media 数组中的图片插入到文章正文中
   * 策略：在文章开头（第一个段落后）插入第一张图片
   * @param content 文章正文
   * @param media 图片数组
   * @returns 插入图片后的正文
   */
  private insertMediaImagesToContent(content: string, media: Array<{ url: string; type?: string; size?: { width: number; height: number } }>): string {
    if (!media || media.length === 0) return content;

    // 过滤有效的图片 URL
    const validImages = media.filter(m => m.url && m.url.startsWith('http'));
    if (validImages.length === 0) return content;

    // 取第一张图片插入到文章中
    const firstImage = validImages[0];
    const imageMarkdown = `\n\n![配图](${firstImage.url})\n\n`;

    // 找到第一个段落结束的位置（第一个空行或第一个标题之前）
    const lines = content.split('\n');
    let insertIndex = -1;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      // 跳过开头的标题
      if (i === 0 && line.startsWith('#')) continue;
      // 找到第一个非空段落后的空行
      if (line === '' && i > 0 && lines[i - 1].trim() !== '') {
        insertIndex = i;
        break;
      }
      // 或者找到第一个二级/三级标题
      if (line.startsWith('## ') || line.startsWith('### ')) {
        insertIndex = i;
        break;
      }
    }

    // 如果没找到合适位置，在文章末尾插入
    if (insertIndex === -1) {
      return content + imageMarkdown;
    }

    // 在找到的位置插入图片
    lines.splice(insertIndex, 0, imageMarkdown.trim());
    const result = lines.join('\n');

    logger.info(`[图片插入] 已将图片插入到正文第 ${insertIndex} 行: ${firstImage.url.substring(0, 50)}...`);
    return result;
  }

  /**
   * 替换内容中的图片 URL
   * @param content 原始内容
   * @param mapping 原始URL -> 微信CDN URL 的映射表
   * @returns 替换后的内容
   */
  private replaceImageUrls(content: string, mapping: Map<string, string>): string {
    let replacedContent = content;
    
    for (const [originalUrl, weixinUrl] of mapping.entries()) {
      // 转义特殊字符
      const escapedOriginalUrl = originalUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      
      // 替换 Markdown 格式: ![alt](originalUrl)
      replacedContent = replacedContent.replace(
        new RegExp(`!\\[([^\\]]*)\\]\\(${escapedOriginalUrl}\\)`, 'g'),
        `![$1](${weixinUrl})`
      );
      
      // 替换 HTML 格式: <img src="originalUrl" />
      replacedContent = replacedContent.replace(
        new RegExp(`<img([^>]*)src=["']${escapedOriginalUrl}["']([^>]*)>`, 'g'),
        `<img$1src="${weixinUrl}"$2>`
      );
    }
    
    return replacedContent;
  }

  /**
   * 将内容中的图片下载到本地，并替换为本地路径（用于预览）
   * @param content 待处理的内容
   * @param saveDir 本地保存目录
   * @returns 替换后的内容
   */
  private async localizeImages(content: string, saveDir: string): Promise<string> {
    let localizedContent = content;
    const imageUrls = this.extractImageUrls(content);
    
    if (imageUrls.length === 0) return content;

    const { ensureDir } = await import("jsr:@std/fs");
    const imagesDir = join(saveDir, "images");
    await ensureDir(imagesDir);

    let successCount = 0;
    let failCount = 0;

    for (const url of imageUrls) {
      try {
        // 跳过已经是本地路径的
        if (url.startsWith('data/')) continue;
        
        // 1. 下载图片（增加超时）
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30秒超时
        
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          logger.warn(`[图片本地化] 下载失败 (${response.status}): ${url.substring(0, 50)}...`);
          failCount++;
          continue; // 保留原始 URL，不删除图片
        }
        
        const buffer = new Uint8Array(await response.arrayBuffer());
        
        // 2. 确定文件名
        const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(url));
        const hashHex = Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 16);
        
        let ext = "jpg";
        const contentType = response.headers.get("content-type") || "";
        if (contentType.includes("png")) ext = "png";
        else if (contentType.includes("gif")) ext = "gif";
        else if (contentType.includes("webp")) ext = "webp";
        else if (contentType.includes("svg")) ext = "svg";
        
        const fileName = `${hashHex}.${ext}`;
        const filePath = join(imagesDir, fileName);
        
        // 3. 保存到本地
        await Deno.writeFile(filePath, buffer);
        
        // 4. 替换内容中的 URL 为可供 Deno Server 访问的路径
        // 注意：Deno Server 根目录是工作区根目录，所以路径应该是 data/articles/...
        const relativePath = filePath.replace(/\\/g, '/'); // 确保在 Windows 上也是正斜杠
        const serverPath = relativePath.startsWith("./") ? relativePath.substring(2) : relativePath;
        
        const escapedUrl = url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        localizedContent = localizedContent
          .replace(new RegExp(`!\\[([^\\]]*)\\]\\(${escapedUrl}\\)`, 'g'), `![$1](${serverPath})`)
          .replace(new RegExp(`<img([^>]*)src=["']${escapedUrl}["']([^>]*)>`, 'g'), `<img$1src="${serverPath}"$2>`);
          
        logger.debug(`[图片本地化] ${url.substring(0, 30)}... -> ${serverPath}`);
        successCount++;
      } catch (error) {
        // 网络失败时保留原始 URL，让用户至少可以看到图片来源
        logger.warn(`[图片本地化] 失败（保留原始URL）: ${url.substring(0, 50)}...`, error);
        failCount++;
      }
    }
    
    logger.info(`[图片本地化] 完成：成功 ${successCount}，失败 ${failCount}（失败的图片保留原始URL）`);
    return localizedContent;
  }

  private async processContent(content: ScrapedContent, mode: ContentMode, options?: { minWords?: number; maxWords?: number }): Promise<void> {
    try {
      // 0. 预处理图片：提取、过滤、上传并建立映射
      // 注意：为了支持本地修改和预览，我们不再在初始处理阶段上传到微信 CDN
      // 我们仅记录图片 URL，待用户点击“发布”时才执行最终转换
      // const imageUrlMapping = await this.preProcessImages(content);
      // logger.info(`[内容处理] ${content.id} 预处理图片完成，建立 ${imageUrlMapping.size} 个URL映射`);

      // 1. 生成摘要（LLM 会保留原始图片 URL）
      let summary: { title: string; content: string; keywords?: string[] } | null = null;
      if (mode === "GITHUB_TRENDING" && content.metadata.source === "github-trending") {
        // GitHub Trending 简化模式：直接使用 README 内容，不经过 summary 处理
        logger.info(`[内容处理] GitHub 简化模式: 直接使用 README 内容 (${content.id})`);
        const stars = content.metadata.stars;
        const starsStr = stars ? ` (⭐ ${stars >= 1000 ? (stars / 1000).toFixed(1) + 'k' : stars})` : '';
        summary = {
          title: `${content.metadata.fullName || content.title}${starsStr}`,
          content: content.content, // 直接使用 README 内容
          keywords: content.metadata.topics || [],
        };
      } else if (mode === "AI_NEWS_SITE" && content.metadata.source === "ai-news-site") {
        logger.info(`[内容处理] 采用 AI 新闻网站翻译模式处理: ${content.id}`);
        summary = await this.summarizer.summarizeAINewsSite(content.content);
      } else if (mode === "SINGLE_URL") {
        logger.info(`[内容处理] 采用 SINGLE_URL 转载模式：仅翻译+精辟扩充，轻量模型: ${content.id}`);
        const res = await this.summarizer.translateAndLightExpandForRepost(content.content, {
          maxWords: options?.maxWords
        });
        // 使用翻译后的标题，而不是固定的"转载{作者}（作者）"
        content.title = res.translatedTitle || res.originalTitle || "无标题";
        // 在内容开头添加一级标题（使用翻译后的标题）
        content.content = `# ${content.title}\n\n${res.content}`;
        content.metadata.keywords = [];
        // 保存原文标题和作者信息到 metadata，供后续使用
        content.metadata.originalTitle = res.originalTitle;
        content.metadata.author = res.author;
        summary = { title: content.title, content: content.content, keywords: [] };
        logger.info(`[内容处理] SINGLE_URL 标题设置为: ${content.title}, 已在内容开头添加一级标题`);
      }
      if (!summary) {
        summary = await this.summarizer.summarize(JSON.stringify(content), {
          minWords: options?.minWords,
          maxWords: options?.maxWords
        });
      }

      if (summary && mode !== "SINGLE_URL") {
        content.title = summary.title;
        content.content = summary.content;
        content.metadata.keywords = summary.keywords ?? [];
      }

      // 1.5. 替换图片 URL（不再执行，保留原 URL 供预览）
      // if (imageUrlMapping.size > 0) {
      //   content.content = this.replaceImageUrls(content.content, imageUrlMapping);
      //   logger.info(`[内容处理] ${content.id} 完成图片URL替换`);
      // }
      
      // 2. 清理 LLM 可能生成的引用标记（如 [1]、[2] 等）
      if (mode === "GITHUB_TRENDING") {
        // 移除文章末尾的引用列表（如：[1] 项目主页: https://...）
        content.content = content.content.replace(/\n*\[\d+\]\s*项目(主页|地址|链接)[：:]\s*https?:\/\/[^\s\n]+\s*/g, '');
        content.content = content.content.replace(/\n*\[\d+\]\s*[^\n]*https?:\/\/github\.com[^\s\n]+\s*/g, '');
        // 移除末尾多余的空行
        content.content = content.content.replace(/\n{3,}$/g, '\n\n');
        logger.debug(`[内容处理] ${content.id} 清理引用标记`);
      }
      
      // 3. 优先使用爬取的图片，必要时AI补充（仅 Tech News 模式）
      if (mode !== "GITHUB_TRENDING") {
        try {
          // 检查是否有现有图片（包括 media 数组和正文内容中）
          const mediaImageCount = content.media?.length || 0;
          const contentHasImages = /!\[.*?\]\(.*?\)|<img.*?>/i.test(content.content);

          logger.info(`[内容处理] ${content.id} 现有 media 图片: ${mediaImageCount}, 正文已有图片: ${contentHasImages}`);

          // 策略：优先使用网上获取或正文已有的图片，只有在完全没有图片时才调用AI补充
          if (mediaImageCount >= 1 || contentHasImages) {
            logger.info(`[内容处理] ${content.id} 已有图片，无需额外补充`);

            // ✅ 关键修复：如果 media 数组有图片但正文中没有，需要将图片插入到正文中
            if (mediaImageCount > 0 && !contentHasImages) {
              logger.info(`[内容处理] ${content.id} 正文无图片引用，将 media 数组中的 ${mediaImageCount} 张图片插入正文`);
              content.content = this.insertMediaImagesToContent(content.content, content.media || []);
            }
          } else {
            logger.info(`[内容处理] ${content.id} 完全没有图片，调用AI生成一张图片`);
            const filledContent = await this.imageFillerService.fillImages(content, {
              minImagesPerArticle: 1, // 没有图片时生成1张
              maxImagesPerArticle: 1, // 最多生成1张
              generateCoverImage: false, // 不生成封面，只生成内容配图
            });
            content.media = filledContent.media;
            const aiGeneratedCount = (filledContent.media?.length || 0) - mediaImageCount;
            logger.info(
              `[内容处理] ${content.id} 图片补充完成，共 ${content.media?.length || 0} 张（AI生成${aiGeneratedCount}张）`
            );

            // AI 生成的图片也需要插入到正文
            if (content.media && content.media.length > 0) {
              content.content = this.insertMediaImagesToContent(content.content, content.media);
            }
          }
        } catch (imageError) {
          logger.warn(`[内容处理] ${content.id} 图片补充失败:`, imageError);
          // 图片补充失败不影响主流程
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error(`[内容处理] ${content.id} 处理失败:`, message);
      await this.notifier.warning(
        "内容处理失败",
        `ID: ${content.id}\n保留原始内容`,
      );
      content.title = content.title || "无标题";
      content.content = content.content || "内容处理失败";
      content.metadata.keywords = content.metadata.keywords || [];
    }
  }

  private async checkDuplicateWithVector(
    content: ScrapedContent,
    contentVector: number[],
  ): Promise<boolean> {
    try {
      // 在内存中计算相似度
      for (const existingVector of this.existingVectors) {
        if (!existingVector.vector || !contentVector) {
          continue;
        }
        const similarity = VectorSimilarityUtil.cosineSimilarity(
          contentVector,
          existingVector.vector,
        );
        if (similarity >= 0.85) {
          logger.info(
            `[去重] 发现重复内容: ${content.id}, 相似度: ${similarity}, 原内容: ${
              existingVector.content?.slice(0, 50)
            }...`,
          );
          this.stats.duplicates++;
          return true;
        }
      }
      return false;
    } catch (error) {
      logger.error(`[去重] 检查重复失败: ${error}`);
      return false;
    }
  }

  /**
   * 使用 LLM 统一提取所有内容的真正正文和插图
   * - GITHUB_TRENDING 模式执行清理式翻译提取
   * - SINGLE_URL 模式使用轻量级提取（保留更多原文）
   * - 其他模式使用标准提取
   */
  private async performGlobalLlmExtraction(contents: ScrapedContent[], mode?: string): Promise<void> {
    if (contents.length === 0) return;

    const isSingleUrl = mode === "SINGLE_URL";
    const isGithub = mode === "GITHUB_TRENDING";
    
    let extractionMode = "标准提取";
    if (isSingleUrl) extractionMode = "轻量级提取（保留更多原文）";
    if (isGithub) extractionMode = "清理式翻译提取";
    
    logger.info(`[LLM预提取] 开始对 ${contents.length} 篇文章进行正文和插图提取 (${extractionMode})...`);
    
    const extractionProgress = new SimpleProgress({
      title: "LLM 提取进度",
      total: contents.length,
    });
    let completed = 0;

    await Promise.all(contents.map(async (content) => {
      try {
        const rawMarkdown = content.content;
        
        let result;
        if (isSingleUrl) {
          result = await this.summarizer.extractContentForSingleUrl(rawMarkdown);
        } else if (isGithub) {
          result = await this.summarizer.extractGithubReadme(rawMarkdown);
        } else {
          result = await this.summarizer.extractArticleContent(rawMarkdown);
        }
        
        // 保存原始 Markdown 到元数据，供存储使用
        content.metadata.rawMarkdown = rawMarkdown;
        // 更新正文为提取后的内容
        content.content = result.mainContent;
        content.metadata.hasLlmExtraction = true;

        // 合并提取出的图片 URL 到 media 数组
        if (result.imageUrls && result.imageUrls.length > 0) {
          const existingUrls = new Set(content.media?.map(m => m.url) || []);
          content.media = content.media || [];
          
          for (const url of result.imageUrls) {
            if (!existingUrls.has(url)) {
              content.media.push({
                url: url,
                type: "image/jpeg", // 默认
                size: { width: 1200, height: 630 },
              });
              existingUrls.add(url);
            }
          }
          content.metadata.imageCount = content.media.length;
        }

        logger.debug(`[LLM预提取] ✅ 完成: ${content.title?.slice(0, 20)}... (提取到 ${result.imageUrls?.length || 0} 张图)`);
      } catch (error) {
        logger.error(`[LLM预提取] ❌ 失败: ${content.title?.slice(0, 20)}... - ${error instanceof Error ? error.message : String(error)}`);
        // 失败则保留原样，不更新 metadata.rawMarkdown
      } finally {
        await extractionProgress.render(++completed);
      }
    }));

    logger.info(`[LLM预提取] 所有内容提取处理完成`);
  }
}
