import { ConfigManager } from "@src/utils/config/config-manager.ts";
import db from "@src/db/db.ts";
import { dataSources } from "@src/db/schema.ts";
import { Logger } from "@zilla/logger";

const logger = new Logger("getDataSources");

/**
 * 数据源平台类型
 */
export type NewsPlatform = "firecrawl" | "github";

/**
 * 内容模式类型
 */
export type ContentMode = "TECH_NEWS" | "GITHUB_TRENDING" | "SINGLE_URL" | "TOPIC_SEARCH" | "AI_NEWS_SITE";

interface SourceItem {
  identifier: string;
  /** 数据源名称（可选） */
  name?: string;
  /** 数据源类别（可选） */
  category?: string;
  /** 递归爬取的文章数量（可选，默认为1） */
  maxRecursiveLinks?: number;
}

type SourceConfig = Record<NewsPlatform, SourceItem[]>;

/**
 * 科技新闻模式数据源配置
 * 包含多个优质科技新闻网站 - 聚焦最新、最有爆点、最吸引人的内容
 */
export const techNewsSourceConfigs: SourceConfig = {
  firecrawl: [
    // AI Business - AI 商业新闻
    { identifier: "https://aibusiness.com/latest-news#close-modal", name: "AI Business", category: "ai-news", maxRecursiveLinks: 3 },
    
    // The Robot Report - 机器人新闻
    { identifier: "http://therobotreport.com/category/financial/", name: "The Robot Report", category: "robotics-news", maxRecursiveLinks: 3 },
    
    // // AI Magazine - AI 杂志（爬取1篇）
     { identifier: "https://aimagazine.com/news", name: "AI Magazine", category: "ai-news", maxRecursiveLinks: 3 },
     
    // AI News (TechForge) - AI 行业资讯
    { identifier: "https://www.artificialintelligence-news.com/artificial-intelligence-news/", name: "AI News", category: "ai-news", maxRecursiveLinks: 3 },
    
     
  ],
  github: [],
};

/**
 * GitHub Trending 模式数据源配置
 */
export const gitHubSourceConfigs: SourceConfig = {
  firecrawl: [],
  github: [
    { identifier: "trending", name: "GitHub Trending", category: "trending" },
  ],
};


interface DbSource {
  identifier: string;
  platform: NewsPlatform;
}

/**
 * 获取数据源配置
 * @param mode 内容模式，默认为 TECH_NEWS
 * @param maxArticles 最大文章数（用于动态设置每个源的抓取数量）
 */
export const getDataSources = async (mode?: ContentMode, maxArticles?: number): Promise<SourceConfig> => {
  const configManager = ConfigManager.getInstance();
  
  try {
    // 读取配置的内容模式
    const configMode = mode || await configManager.get<ContentMode>("CONTENT_MODE") || "TECH_NEWS";
    
    // 获取最大文章数
    const articleLimit = maxArticles || await configManager.get("ARTICLE_NUM") || 5;
    
    // 根据模式选择基础配置
    let baseSources: SourceConfig;
    if (configMode === "GITHUB_TRENDING") {
      baseSources = JSON.parse(JSON.stringify(gitHubSourceConfigs));
      logger.info("使用 GitHub Trending 模式数据源");
    } else if (configMode === "SINGLE_URL" || configMode === "TOPIC_SEARCH" || configMode === "AI_NEWS_SITE") {
      baseSources = { firecrawl: [], github: [] };
      logger.info(`使用 ${configMode} 模式，无需基础数据源`);
    } else {
      baseSources = JSON.parse(JSON.stringify(techNewsSourceConfigs));
      logger.info("使用科技新闻模式数据源");
      
      // 动态设置每个源的抓取数量
      // 保留源配置中已设置的 maxRecursiveLinks，仅为未配置的源设置默认值
      if (baseSources.firecrawl && baseSources.firecrawl.length > 0) {
        const sourceCount = baseSources.firecrawl.length;
        const defaultLinksPerSource = Math.max(3, Math.ceil(articleLimit / sourceCount)); // 至少 3 篇
        baseSources.firecrawl.forEach(source => {
          // 如果源已配置了 maxRecursiveLinks，保留它；否则使用计算值
          if (!source.maxRecursiveLinks) {
            source.maxRecursiveLinks = defaultLinksPerSource;
          }
        });
        const actualLinksPerSource = baseSources.firecrawl[0].maxRecursiveLinks || defaultLinksPerSource;
        logger.info(`每个数据源将抓取 ${actualLinksPerSource} 篇文章（共 ${sourceCount} 个源）`);
      }
    }

    // 尝试从数据库获取额外配置
    const dbEnabled = await configManager.get("ENABLE_DB");
    if (dbEnabled) {
      logger.info("开始从数据库获取数据源");
      const dbResults = await db.select({
        identifier: dataSources.identifier,
        platform: dataSources.platform,
      }).from(dataSources);

      // 合并数据库结果
      dbResults.forEach((item) => {
        const { platform, identifier } = item;
        if (
          identifier !== null &&
          platform !== null &&
          platform in baseSources
        ) {
          const exists = baseSources[platform as NewsPlatform].some(
            (source) => source.identifier === identifier,
          );
          if (!exists) {
            baseSources[platform as NewsPlatform].push({ identifier });
          }
        }
      });
    }

    // 记录数据源数量
    const totalSources = Object.values(baseSources).reduce(
      (sum, sources) => sum + sources.length,
      0,
    );
    logger.info(`数据源配置完成，共 ${totalSources} 个源`);

    return baseSources;
  } catch (error) {
    logger.error("获取数据源失败:", error);
    // 返回默认配置（科技新闻模式）
    return JSON.parse(JSON.stringify(techNewsSourceConfigs));
  }
};

/**
 * 获取 GitHub Trending 数据源
 */
export const getGitHubDataSources = async (): Promise<SourceConfig> => {
  return getDataSources("GITHUB_TRENDING");
};




