import { ScrapedContent } from "@src/modules/interfaces/scraper.interface.ts";
import { Logger } from "@zilla/logger";
import { join } from "jsr:@std/path";

const logger = new Logger("scraped-data-storage");

/**
 * 爬取数据存储工具
 * 按日期时间戳创建文件夹保存爬取的数据
 */
export class ScrapedDataStorage {
  private baseDir: string;

  constructor(baseDir: string = "./data/scraped") {
    this.baseDir = baseDir;
  }

  /**
   * 生成日期时间戳文件夹名称
   * 格式: YYYY-MM-DD-HHMMSS
   */
  private generateTimestampFolder(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");
    
    return `${year}-${month}-${day}-${hours}${minutes}${seconds}`;
  }

  /**
   * 保存爬取的数据到本地文件（按网址分别保存）
   * @param contentsBySource 按数据源分组的爬取内容列表
   * @returns 保存的文件夹路径映射（source identifier -> folder path）
   */
  async saveScrapedDataBySource(contentsBySource: Map<string, ScrapedContent[]>): Promise<Map<string, string>> {
    const savedFolders = new Map<string, string>();
    const timestampFolder = this.generateTimestampFolder();
    
    for (const [sourceIdentifier, contents] of contentsBySource.entries()) {
      if (contents.length === 0) {
        continue;
      }
      
      try {
        // 生成安全的文件夹名称（基于URL的hostname）
        const folderName = this.generateSourceFolderName(sourceIdentifier);
        const saveDir = join(this.baseDir, timestampFolder, folderName);
        
        // 确保目录存在
        try {
          await Deno.mkdir(saveDir, { recursive: true });
          logger.info(`[数据存储] 创建保存目录: ${saveDir}`);
        } catch (error) {
          try {
            const stat = await Deno.stat(saveDir);
            if (!stat.isDirectory) {
              throw new Error(`${saveDir} 存在但不是目录`);
            }
            logger.info(`[数据存储] 目录已存在: ${saveDir}`);
          } catch {
            throw error;
          }
        }

        // 保存元数据文件
        const metadata = {
          timestamp: new Date().toISOString(),
          timestampFolder: timestampFolder,
          sourceIdentifier: sourceIdentifier,
          totalCount: contents.length,
          sources: this.extractSources(contents),
        };
        
        const metadataPath = join(saveDir, "metadata.json");
        await Deno.writeTextFile(
          metadataPath,
          JSON.stringify(metadata, null, 2),
        );
        logger.info(`[数据存储] 保存元数据: ${metadataPath}`);

        // 保存爬取的数据（JSON 格式）
        const dataPath = join(saveDir, "scraped-data.json");
        await Deno.writeTextFile(
          dataPath,
          JSON.stringify(contents, null, 2),
        );
        logger.info(`[数据存储] 保存爬取数据: ${dataPath}, 共 ${contents.length} 条`);

        // --- 新增：保存每一篇文章的原始和提取后的 Markdown 供检查 ---
        for (let i = 0; i < contents.length; i++) {
          const content = contents[i];
          const safeTitle = content.title.replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, "_").substring(0, 20);
          const articlePrefix = `${String(i + 1).padStart(2, "0")}_${safeTitle}`;
          
          // 如果有原始 Markdown，保存它
          if (content.metadata?.rawMarkdown) {
            const rawMdPath = join(saveDir, `${articlePrefix}_raw.md`);
            await Deno.writeTextFile(rawMdPath, content.metadata.rawMarkdown);
            logger.debug(`[数据存储] 保存原始 Markdown: ${rawMdPath}`);
          }
          
          // 保存提取后的 Markdown
          const extractedMdPath = join(saveDir, `${articlePrefix}_extracted.md`);
          await Deno.writeTextFile(extractedMdPath, content.content);
          logger.debug(`[数据存储] 保存提取后的 Markdown: ${extractedMdPath}`);
        }

        // 为 GitHub Trending 数据创建索引（便于查找）
        if (sourceIdentifier === "github_trending" || sourceIdentifier.includes("github")) {
          const index = this.createGitHubProjectIndex(contents);
          const indexPath = join(saveDir, "project-index.json");
          await Deno.writeTextFile(
            indexPath,
            JSON.stringify(index, null, 2),
          );
          logger.info(`[数据存储] 保存项目索引: ${indexPath}, 共 ${index.projects.length} 个项目`);
        }

        // 保存摘要文件
        const summaryPath = join(saveDir, "summary.txt");
        const summary = this.generateSummary(contents, metadata);
        await Deno.writeTextFile(summaryPath, summary);
        logger.info(`[数据存储] 保存摘要: ${summaryPath}`);

        savedFolders.set(sourceIdentifier, saveDir);
      } catch (error) {
        logger.error(`[数据存储] 保存数据源 ${sourceIdentifier} 失败:`, error);
      }
    }
    
    return savedFolders;
  }

  /**
   * 保存爬取的数据到本地文件（兼容旧接口）
   * @param contents 爬取的内容列表
   * @returns 保存的文件路径
   */
  async saveScrapedData(contents: ScrapedContent[]): Promise<string> {
    try {
      // 生成日期时间戳文件夹
      const timestampFolder = this.generateTimestampFolder();
      const saveDir = join(this.baseDir, timestampFolder);
      
      // 确保目录存在
      try {
        await Deno.mkdir(saveDir, { recursive: true });
        logger.info(`[数据存储] 创建保存目录: ${saveDir}`);
      } catch (error) {
        // 目录可能已存在，检查一下
        try {
          const stat = await Deno.stat(saveDir);
          if (!stat.isDirectory) {
            throw new Error(`${saveDir} 存在但不是目录`);
          }
          logger.info(`[数据存储] 目录已存在: ${saveDir}`);
        } catch {
          throw error;
        }
      }

      // 保存元数据文件（包含爬取信息）
      const metadata = {
        timestamp: new Date().toISOString(),
        timestampFolder: timestampFolder,
        totalCount: contents.length,
        sources: this.extractSources(contents),
      };
      
      const metadataPath = join(saveDir, "metadata.json");
      await Deno.writeTextFile(
        metadataPath,
        JSON.stringify(metadata, null, 2),
      );
      logger.info(`[数据存储] 保存元数据: ${metadataPath}`);

      // 保存爬取的数据（JSON 格式）
      const dataPath = join(saveDir, "scraped-data.json");
      await Deno.writeTextFile(
        dataPath,
        JSON.stringify(contents, null, 2),
      );
      logger.info(`[数据存储] 保存爬取数据: ${dataPath}, 共 ${contents.length} 条`);

      // 保存摘要文件（便于查看）
      const summaryPath = join(saveDir, "summary.txt");
      const summary = this.generateSummary(contents, metadata);
      await Deno.writeTextFile(summaryPath, summary);
      logger.info(`[数据存储] 保存摘要: ${summaryPath}`);

      return saveDir;
    } catch (error) {
      logger.error("[数据存储] 保存数据失败:", error);
      throw error;
    }
  }

  /**
   * 从本地文件读取爬取的数据
   * @param folderPath 文件夹路径（可以是相对路径或绝对路径）
   * @returns 爬取的内容列表
   */
  async loadScrapedData(folderPath: string): Promise<ScrapedContent[]> {
    try {
      const dataPath = join(folderPath, "scraped-data.json");
      
      // 检查文件是否存在
      try {
        const stat = await Deno.stat(dataPath);
        if (!stat.isFile) {
          throw new Error(`${dataPath} 存在但不是文件`);
        }
      } catch (error) {
        if (error instanceof Deno.errors.NotFound) {
          throw new Error(`数据文件不存在: ${dataPath}`);
        }
        throw error;
      }

      // 读取文件内容
      const fileContent = await Deno.readTextFile(dataPath);
      const contents: ScrapedContent[] = JSON.parse(fileContent);
      
      logger.info(`[数据读取] 从 ${dataPath} 读取数据，共 ${contents.length} 条`);
      return contents;
    } catch (error) {
      logger.error("[数据读取] 读取数据失败:", error);
      throw error;
    }
  }

  /**
   * 获取最新的爬取数据文件夹
   * @returns 最新文件夹路径，如果没有则返回 null
   */
  async getLatestFolder(): Promise<string | null> {
    try {
      // 检查基础目录是否存在
      try {
        const stat = await Deno.stat(this.baseDir);
        if (!stat.isDirectory) {
          return null;
        }
      } catch (error) {
        if (error instanceof Deno.errors.NotFound) {
          return null;
        }
        throw error;
      }

      // 读取所有文件夹，按名称排序（最新的在前）
      const folders: string[] = [];
      for await (const entry of Deno.readDir(this.baseDir)) {
        if (entry.isDirectory) {
          folders.push(entry.name);
        }
      }

      if (folders.length === 0) {
        return null;
      }

      // 按名称排序（时间戳格式可以直接字符串排序）
      folders.sort().reverse();
      
      const latestFolder = join(this.baseDir, folders[0]);
      logger.info(`[数据读取] 找到最新文件夹: ${latestFolder}`);
      return latestFolder;
    } catch (error) {
      logger.error("[数据读取] 查找最新文件夹失败:", error);
      return null;
    }
  }

  /**
   * 从最新文件夹读取爬取的数据
   * @returns 爬取的内容列表，如果没有则返回空数组
   */
  async loadLatestScrapedData(): Promise<ScrapedContent[]> {
    const latestFolder = await this.getLatestFolder();
    if (!latestFolder) {
      logger.warn("[数据读取] 未找到最新文件夹");
      return [];
    }
    return await this.loadScrapedData(latestFolder);
  }

  /**
   * 从最新时间戳文件夹下的所有子文件夹读取数据
   * @returns 按数据源分组的爬取内容列表
   */
  async loadLatestScrapedDataBySource(): Promise<Map<string, ScrapedContent[]>> {
    const latestFolder = await this.getLatestFolder();
    if (!latestFolder) {
      logger.warn("[数据读取] 未找到最新文件夹");
      return new Map();
    }

    const contentsBySource = new Map<string, ScrapedContent[]>();
    
    try {
      // 读取最新文件夹下的所有子文件夹
      for await (const entry of Deno.readDir(latestFolder)) {
        if (entry.isDirectory) {
          const sourceFolder = join(latestFolder, entry.name);
          try {
            const contents = await this.loadScrapedData(sourceFolder);
            // 从文件夹名称或元数据中提取源标识符
            const sourceIdentifier = await this.extractSourceIdentifierFromFolder(sourceFolder);
            contentsBySource.set(sourceIdentifier, contents);
            logger.info(`[数据读取] 从 ${sourceFolder} 读取 ${contents.length} 条数据`);
          } catch (error) {
            logger.warn(`[数据读取] 读取文件夹 ${sourceFolder} 失败:`, error);
          }
        }
      }
    } catch (error) {
      logger.error("[数据读取] 读取数据源文件夹失败:", error);
    }

    return contentsBySource;
  }

  /**
   * 从每个数据源文件夹随机挑选文章，最终组成指定数量的文章
   * @param targetCount 目标文章数量（默认5篇）
   * @returns 随机挑选的文章列表
   */
  async loadRandomArticlesFromSources(targetCount: number = 5): Promise<ScrapedContent[]> {
    const contentsBySource = await this.loadLatestScrapedDataBySource();
    
    if (contentsBySource.size === 0) {
      logger.warn("[数据读取] 未找到任何数据源文件夹");
      return [];
    }

    // 计算每个数据源应该挑选的文章数量
    const sources = Array.from(contentsBySource.keys());
    const articlesPerSource = Math.ceil(targetCount / sources.length);
    
    const selectedArticles: ScrapedContent[] = [];
    
    for (const [sourceIdentifier, contents] of contentsBySource.entries()) {
      if (contents.length === 0) {
        continue;
      }
      
      // 随机打乱并选择指定数量的文章
      const shuffled = [...contents].sort(() => Math.random() - 0.5);
      const selected = shuffled.slice(0, Math.min(articlesPerSource, contents.length));
      selectedArticles.push(...selected);
      
      logger.info(`[数据读取] 从 ${sourceIdentifier} 随机挑选 ${selected.length} 篇文章`);
    }

    // 如果总数超过目标数量，再次随机打乱并截取
    if (selectedArticles.length > targetCount) {
      const shuffled = selectedArticles.sort(() => Math.random() - 0.5);
      const finalArticles = shuffled.slice(0, targetCount);
      logger.info(`[数据读取] 从 ${selectedArticles.length} 篇文章中随机选择 ${targetCount} 篇`);
      return finalArticles;
    }

    logger.info(`[数据读取] 总共挑选 ${selectedArticles.length} 篇文章`);
    return selectedArticles;
  }

  /**
   * 生成基于URL的文件夹名称
   */
  private generateSourceFolderName(sourceIdentifier: string): string {
    try {
      const url = new URL(sourceIdentifier);
      // 使用 hostname 作为文件夹名称，替换特殊字符
      return url.hostname.replace(/\./g, "_").replace(/[^a-zA-Z0-9_]/g, "_");
    } catch {
      // 如果URL解析失败，使用标识符的简化版本
      return sourceIdentifier.replace(/[^a-zA-Z0-9_]/g, "_").substring(0, 50);
    }
  }

  /**
   * 从文件夹的元数据中提取源标识符
   */
  private async extractSourceIdentifierFromFolder(folderPath: string): Promise<string> {
    try {
      const metadataPath = join(folderPath, "metadata.json");
      const metadataContent = await Deno.readTextFile(metadataPath);
      const metadata = JSON.parse(metadataContent);
      return metadata.sourceIdentifier || folderPath;
    } catch {
      // 如果读取元数据失败，使用文件夹名称
      return folderPath.split("/").pop() || folderPath;
    }
  }

  /**
   * 提取数据源信息
   */
  private extractSources(contents: ScrapedContent[]): string[] {
    const sources = new Set<string>();
    contents.forEach((content) => {
      if (content.url) {
        try {
          const url = new URL(content.url);
          sources.add(url.hostname);
        } catch {
          // 忽略无效 URL
        }
      }
    });
    return Array.from(sources);
  }

  /**
   * 生成摘要信息
   */
  private generateSummary(contents: ScrapedContent[], metadata: any): string {
    let summary = `爬取数据摘要\n`;
    summary += `==================\n\n`;
    summary += `时间戳: ${metadata.timestamp}\n`;
    summary += `文件夹: ${metadata.timestampFolder}\n`;
    summary += `总数量: ${metadata.totalCount} 条\n`;
    summary += `数据源: ${metadata.sources.join(", ")}\n\n`;
    
    summary += `文章列表:\n`;
    summary += `------------------\n`;
    contents.forEach((content, index) => {
      summary += `${index + 1}. ${content.title}\n`;
      summary += `   来源: ${content.url}\n`;
      summary += `   发布时间: ${content.publishDate || "未知"}\n`;
      summary += `   内容长度: ${content.content.length} 字符\n`;
      summary += `   图片数量: ${content.media?.length || 0}\n\n`;
    });

    return summary;
  }

  /**
   * 为 GitHub 项目创建索引（便于查找）
   */
  private createGitHubProjectIndex(contents: ScrapedContent[]): {
    version: string;
    createdAt: string;
    totalCount: number;
    projects: Array<{
      fullName: string;
      url: string;
      title: string;
      stars?: number;
      description?: string;
      scrapedAt: string;
      contentId: string;
      imageCount: number;
    }>;
    indexByFullName: Record<string, number>; // fullName -> index in projects array
    indexByUrl: Record<string, number>; // url -> index in projects array
  } {
    const projects = contents.map((content, index) => {
      const fullName = (content.metadata as any)?.fullName || "";
      const stars = (content.metadata as any)?.stars;
      const description = (content.metadata as any)?.description || "";
      
      return {
        fullName: fullName,
        url: content.url,
        title: content.title,
        stars: stars,
        description: description,
        scrapedAt: content.publishDate || new Date().toISOString().split("T")[0],
        contentId: content.id,
        imageCount: content.media?.length || 0,
      };
    });

    // 创建索引映射
    const indexByFullName: Record<string, number> = {};
    const indexByUrl: Record<string, number> = {};
    
    projects.forEach((project, index) => {
      if (project.fullName) {
        indexByFullName[project.fullName.toLowerCase()] = index;
      }
      if (project.url) {
        indexByUrl[project.url] = index;
      }
    });

    return {
      version: "1.0",
      createdAt: new Date().toISOString(),
      totalCount: projects.length,
      projects: projects,
      indexByFullName: indexByFullName,
      indexByUrl: indexByUrl,
    };
  }
}
