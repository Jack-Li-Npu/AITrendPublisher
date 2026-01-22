import { Logger } from "@zilla/logger";
import { join } from "jsr:@std/path";
import { ensureDir } from "jsr:@std/fs";

const logger = new Logger("github-project-registry");

/**
 * GitHub 项目信息
 */
export interface GitHubProjectInfo {
  /** 项目完整名称 (owner/repo) */
  fullName: string;
  /** 项目 URL */
  url: string;
  /** 首次爬取时间 */
  firstScrapedAt: string;
  /** 最后爬取时间 */
  lastScrapedAt: string;
  /** 爬取次数 */
  scrapeCount: number;
  /** 项目 Stars 数量（最后记录） */
  stars?: number;
  /** 项目描述（最后记录） */
  description?: string;
}

/**
 * GitHub 项目名称库管理器
 * 维护已爬取的 GitHub 项目列表，避免重复爬取
 */
export class GitHubProjectRegistry {
  private registryPath: string;
  private registry: Map<string, GitHubProjectInfo>;

  constructor(registryPath: string = "./data/github-project-registry.json") {
    this.registryPath = registryPath;
    this.registry = new Map();
  }

  /**
   * 加载项目名称库
   */
  async load(): Promise<void> {
    try {
      const registryDir = join(this.registryPath, "..");
      await ensureDir(registryDir);

      try {
        const content = await Deno.readTextFile(this.registryPath);
        const data = JSON.parse(content);
        
        // 将数组转换为 Map（便于查找）
        if (Array.isArray(data.projects)) {
          for (const project of data.projects) {
            this.registry.set(project.fullName.toLowerCase(), project);
          }
        } else if (typeof data === "object") {
          // 兼容旧格式（如果是对象格式）
          for (const [key, project] of Object.entries(data)) {
            if (typeof project === "object" && project !== null) {
              const projectInfo = project as GitHubProjectInfo;
              this.registry.set(projectInfo.fullName.toLowerCase(), projectInfo);
            }
          }
        }
        
        logger.info(`[项目库] 加载完成，共 ${this.registry.size} 个项目`);
      } catch (error) {
        if (error instanceof Deno.errors.NotFound) {
          logger.info(`[项目库] 项目库文件不存在，将创建新库`);
        } else {
          throw error;
        }
      }
    } catch (error) {
      logger.error(`[项目库] 加载失败:`, error);
      throw error;
    }
  }

  /**
   * 保存项目名称库
   */
  async save(): Promise<void> {
    try {
      const registryDir = join(this.registryPath, "..");
      await ensureDir(registryDir);

      // 转换为数组格式（便于阅读和编辑）
      const projects = Array.from(this.registry.values());
      
      // 按项目名称排序
      projects.sort((a, b) => a.fullName.localeCompare(b.fullName));

      const data = {
        version: "1.0",
        updatedAt: new Date().toISOString(),
        totalCount: projects.length,
        projects: projects,
      };

      await Deno.writeTextFile(
        this.registryPath,
        JSON.stringify(data, null, 2),
      );
      
      logger.info(`[项目库] 保存完成，共 ${projects.length} 个项目`);
    } catch (error) {
      logger.error(`[项目库] 保存失败:`, error);
      throw error;
    }
  }

  /**
   * 检查项目是否已爬取
   */
  isScraped(fullName: string): boolean {
    return this.registry.has(fullName.toLowerCase());
  }

  /**
   * 获取项目信息
   */
  getProject(fullName: string): GitHubProjectInfo | undefined {
    return this.registry.get(fullName.toLowerCase());
  }

  /**
   * 注册项目（首次爬取）
   */
  registerProject(
    fullName: string,
    url: string,
    stars?: number,
    description?: string,
  ): void {
    const key = fullName.toLowerCase();
    const now = new Date().toISOString();
    
    if (this.registry.has(key)) {
      // 更新现有项目
      const existing = this.registry.get(key)!;
      existing.lastScrapedAt = now;
      existing.scrapeCount += 1;
      if (stars !== undefined) existing.stars = stars;
      if (description !== undefined) existing.description = description;
      logger.debug(`[项目库] 更新项目: ${fullName} (第 ${existing.scrapeCount} 次爬取)`);
    } else {
      // 注册新项目
      const projectInfo: GitHubProjectInfo = {
        fullName: fullName,
        url: url,
        firstScrapedAt: now,
        lastScrapedAt: now,
        scrapeCount: 1,
        stars: stars,
        description: description,
      };
      this.registry.set(key, projectInfo);
      logger.info(`[项目库] 注册新项目: ${fullName}`);
    }
  }

  /**
   * 批量注册项目
   */
  registerProjects(
    projects: Array<{
      fullName: string;
      url: string;
      stars?: number;
      description?: string;
    }>,
  ): void {
    for (const project of projects) {
      this.registerProject(
        project.fullName,
        project.url,
        project.stars,
        project.description,
      );
    }
  }

  /**
   * 过滤未爬取的项目
   */
  filterUnscrapedProjects(
    projects: Array<{ fullName: string; url: string }>,
  ): Array<{ fullName: string; url: string }> {
    return projects.filter(
      (project) => !this.isScraped(project.fullName),
    );
  }

  /**
   * 获取所有已爬取的项目列表
   */
  getAllProjects(): GitHubProjectInfo[] {
    return Array.from(this.registry.values()).sort((a, b) =>
      a.fullName.localeCompare(b.fullName)
    );
  }

  /**
   * 获取统计信息
   */
  getStats(): {
    totalCount: number;
    recentlyScraped: number; // 最近7天爬取的项目数
  } {
    const now = Date.now();
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
    
    const recentlyScraped = Array.from(this.registry.values()).filter(
      (project) => new Date(project.lastScrapedAt).getTime() > sevenDaysAgo,
    ).length;

    return {
      totalCount: this.registry.size,
      recentlyScraped,
    };
  }
}
