import {
  ContentScraper,
  ScrapedContent,
  ScraperOptions,
} from "@src/modules/interfaces/scraper.interface.ts";
import { Logger } from "@zilla/logger";
import { ConfigManager } from "@src/utils/config/config-manager.ts";
import { HttpClient } from "@src/utils/http/http-client.ts";
import { GitHubProjectRegistry } from "@src/utils/github-project-registry.ts";
import * as cheerio from "cheerio";

const logger = new Logger("github-trending-scraper");

/**
 * GitHub Trending 项目信息
 */
export interface GitHubTrendingProject {
  /** 项目完整名称 (owner/repo) */
  fullName: string;
  /** 项目 URL */
  url: string;
  /** 项目描述 (可选) */
  description?: string;
  /** 星数 */
  stars?: string;
}

/**
 * GitHub Trending 抓取器
 * 直接抓取 GitHub Trending 页面并解析项目列表
 */
export class GitHubTrendingScraper implements ContentScraper {
  private configManager: ConfigManager;
  private httpClient: HttpClient;
  private readonly TRENDING_URL = "https://github.com/trending";

  constructor() {
    this.configManager = ConfigManager.getInstance();
    this.httpClient = HttpClient.getInstance();
    logger.debug("GitHub Trending 抓取器初始化完成");
  }

  /**
   * 抓取 GitHub Trending 项目
   * 直接抓取首页解析列表，获取 README 内容
   * @param _sourceId 忽略此参数
   * @param options 抓取选项
   */
  async scrape(
    _sourceId: string = "trending",
    options?: ScraperOptions,
  ): Promise<ScrapedContent[]> {
    const startTime = Date.now();
    const limit = options?.limit || 5; // 默认获取 5 个项目

    logger.info(`[GitHub Trending] 开始抓取趋势项目, 限制: ${limit}`);

    // 加载项目名称库
    const projectRegistry = new GitHubProjectRegistry();
    await projectRegistry.load();
    const stats = projectRegistry.getStats();
    logger.info(`[GitHub Trending] 项目库统计: 总计 ${stats.totalCount} 个，最近7天 ${stats.recentlyScraped} 个`);

    try {
      // 1. 直接抓取 GitHub Trending 列表
      const allProjects = await this.fetchTrendingList();
      logger.info(`[GitHub Trending] 解析到 ${allProjects.length} 个项目`);
      
      // 2. 过滤已爬取的项目，只保留未爬取的项目
      const unscrapedProjects = projectRegistry.filterUnscrapedProjects(allProjects);
      logger.info(`[GitHub Trending] 过滤后，未爬取项目: ${unscrapedProjects.length} 个`);
      
      // 如果未爬取的项目不足，记录警告
      if (unscrapedProjects.length < limit) {
        logger.warn(`[GitHub Trending] 未爬取项目数量 (${unscrapedProjects.length}) 少于限制 (${limit})，将爬取所有未爬取项目`);
      }
      
      // 限制爬取数量
      const projectsToScrape = unscrapedProjects.slice(0, limit);
      logger.info(`[GitHub Trending] 将爬取 ${projectsToScrape.length} 个新项目`);
      
      // 3. 逐个获取项目详情 (README)
      const contents: ScrapedContent[] = [];
      const registeredProjects: Array<{
        fullName: string;
        url: string;
        stars?: number;
        description?: string;
      }> = [];
      
      for (const project of projectsToScrape) {
        try {
          logger.debug(`[GitHub Trending] 抓取项目详情: ${project.fullName} (${project.url})`);
          
          // 获取项目的 README
          const markdown = await this.fetchRepoReadme(project.fullName);
          
          if (markdown) {
            // 获取项目的 stars 数量
            const starsCount = await this.fetchStarsCount(project.fullName);
            logger.debug(`[GitHub Trending] 项目 ${project.fullName} 有 ${starsCount} stars`);
            
            // 过滤内容
            const filteredMarkdown = this.filterContentAfterNavigation(markdown);
            const extractedImages = this.extractImagesFromMarkdown(filteredMarkdown);
            
            // 每个项目最多展示 3 张
            const allMedia = extractedImages.slice(0, 3);
            
            logger.info(`[GitHub Trending] 项目 ${project.fullName} 提取到 ${extractedImages.length} 张符合条件的图片，最终展示 ${allMedia.length} 张`);
          
            const content: ScrapedContent = {
              id: `github_${project.fullName.replace(/\s?\/\s?/g, "_")}_${Date.now()}`,
              title: project.fullName,
              content: filteredMarkdown,
              url: project.url,
              publishDate: new Date().toISOString().split("T")[0],
              media: allMedia,
              metadata: {
                source: "github-trending",
                fullName: project.fullName,
                originalUrl: project.url,
                description: project.description || "",
                stars: starsCount,
              },
            };
          
            contents.push(content);
            
            // 注册到项目库
            registeredProjects.push({
              fullName: project.fullName,
              url: project.url,
              stars: starsCount,
              description: project.description || "",
            });
            
            logger.info(`[GitHub Trending] ✅ 成功获取详情: ${project.fullName} (⭐ ${starsCount}, 图片: ${allMedia.length})`);
          } else {
            logger.warn(`[GitHub Trending] 项目 ${project.fullName} 未找到有效 README`);
          }
        } catch (error) {
          logger.warn(`[GitHub Trending] 抓取项目 ${project.fullName} 详情失败:`, error);
        }
        
        // 避免请求过快
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // 批量注册所有成功爬取的项目
      if (registeredProjects.length > 0) {
        projectRegistry.registerProjects(registeredProjects);
        await projectRegistry.save();
        logger.info(`[GitHub Trending] 已注册 ${registeredProjects.length} 个项目到项目库`);
      }

      const duration = Date.now() - startTime;
      logger.info(`[GitHub Trending] 抓取完成, 获取 ${contents.length} 个项目, 耗时: ${duration}ms`);
      
      return contents;
    } catch (error) {
      logger.error("[GitHub Trending] 抓取失败:", error);
      throw error;
    }
  }

  /**
   * 直接抓取 GitHub Trending 页面并解析项目列表
   */
  private async fetchTrendingList(): Promise<GitHubTrendingProject[]> {
    try {
      const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      };

      const response = await fetch(this.TRENDING_URL, { headers });
      if (!response.ok) {
        throw new Error(`无法访问 GitHub Trending: ${response.statusText}`);
      }

      const html = await response.text();
      const $ = cheerio.load(html);
      const repos: GitHubTrendingProject[] = [];

      $('article.Box-row').each((_, article) => {
        const $article = $(article);
        const $link = $article.find('h2 a');
        if (!$link.length) return;

        const href = $link.attr('href') || '';
        const fullName = href.trim().replace(/^\//, '');
        const url = `https://github.com${href}`;
        
        const description = $article.find('p').text().trim();
        const stars = $article.find('a[href$="/stargazers"]').text().trim().replace(/,/g, '');

        repos.push({
          fullName,
          url,
          description,
          stars
        });
      });

      return repos;
    } catch (error) {
      logger.error(`[GitHub Trending] 解析列表失败:`, error);
      throw error;
    }
  }

  /**
   * 获取项目的 README 内容
   */
  private async fetchRepoReadme(fullName: string): Promise<string> {
    try {
      const cleanName = fullName.replace(/\s+/g, "");
      // 尝试通过 API 获取（带 Accept: application/vnd.github.v3.raw 可以直接拿内容）
      const apiUrl = `https://api.github.com/repos/${cleanName}/readme`;
      const response = await fetch(apiUrl, {
        headers: {
          "Accept": "application/vnd.github.v3.raw",
          "User-Agent": "Mozilla/5.0",
        }
      });

      if (response.ok) {
        return await response.text();
      }

      // 如果 API 失败（可能是速率限制），尝试 raw.githubusercontent.com
      const branches = ['main', 'master'];
      for (const branch of branches) {
        const rawUrl = `https://raw.githubusercontent.com/${cleanName}/${branch}/README.md`;
        const rawRes = await fetch(rawUrl);
        if (rawRes.ok) {
          return await rawRes.text();
        }
      }

      return "";
    } catch (error) {
      logger.warn(`[GitHub Trending] 获取 README 失败 (${fullName}):`, error);
      return "";
    }
  }

  /**
   * 从 GitHub API 获取项目的 stars 数量
   */
  private async fetchStarsCount(fullName: string): Promise<number> {
    try {
      const cleanName = fullName.replace(/\s+/g, "");
      const apiUrl = `https://api.github.com/repos/${cleanName}`;
      // 这里仍然使用 httpClient 因为它处理了 JSON 解析和可能的 API Token
      const response = await this.httpClient.request<any>(apiUrl, {
        method: "GET",
        headers: {
          "Accept": "application/vnd.github.v3+json",
          "User-Agent": "Mozilla/5.0",
        },
        timeout: 5000,
      });

      return response.stargazers_count || 0;
    } catch (error) {
      logger.warn(`[GitHub Trending] 获取 stars 失败 (${fullName}):`, error);
      return 0;
    }
  }

  /**
   * 过滤 Markdown 内容，只保留核心正文部分
   * 移除导航和贡献者等噪音
   */
  private filterContentAfterNavigation(markdown: string): string {
    // 尝试寻找 README 的主体部分
    const navigationMarkers = [
      "## Repository files navigation",
      "## Table of Contents",
      "## Introduction",
      "## Getting Started"
    ];
    
    let filtered = markdown;
    for (const marker of navigationMarkers) {
      const markerIndex = markdown.indexOf(marker);
      if (markerIndex !== -1) {
        filtered = markdown.substring(markerIndex);
        break;
      }
    }
    
    // 移除 Contributors 部分
    filtered = this.removeContributorsSection(filtered);
    
    return filtered.trim();
  }

  /**
   * 移除 Contributors 相关内容
   */
  private removeContributorsSection(markdown: string): string {
    const contributorsRegex = /^##\s*(?:\[)?Contributors[^\n]*$/gmi;
    const matches = Array.from(markdown.matchAll(contributorsRegex));
    
    if (matches.length === 0) {
      return markdown;
    }
    
    let result = markdown;
    for (let i = matches.length - 1; i >= 0; i--) {
      const match = matches[i];
      const startIndex = match.index!;
      
      const nextHeaderRegex = /^##\s+/gm;
      nextHeaderRegex.lastIndex = startIndex + match[0].length;
      const nextMatch = nextHeaderRegex.exec(result);
      
      let endIndex = nextMatch ? nextMatch.index! : result.length;
      result = result.substring(0, startIndex) + result.substring(endIndex);
    }
    
    return result.trim();
  }

  /**
   * 从 Markdown 中提取图片链接
   */
  private extractImagesFromMarkdown(markdown: string): ScrapedContent["media"] {
    const images: ScrapedContent["media"] = [];
    const seenUrls = new Set<string>();
    const MAX_IMAGES = 3;
    
    // 1. 匹配可点击图片
    const clickableImageRegex = /\[!\[([^\]]*)\]\(([^)]+)\)\]\(([^)]+)\)/g;
    let match;
    while ((match = clickableImageRegex.exec(markdown)) !== null && images.length < MAX_IMAGES) {
      const imageUrl = match[2];
      if (this.isValidImage(imageUrl) && !seenUrls.has(imageUrl)) {
        images.push({
          url: imageUrl,
          type: this.getImageType(imageUrl),
          alt: match[1] || "项目图片",
        });
        seenUrls.add(imageUrl);
      }
    }
    
    // 2. 匹配普通图片
    const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
    while ((match = imageRegex.exec(markdown)) !== null && images.length < MAX_IMAGES) {
      const url = match[2];
      if (this.isValidImage(url) && !seenUrls.has(url)) {
        images.push({
          url: url,
          type: this.getImageType(url),
          alt: match[1] || "项目图片",
        });
        seenUrls.add(url);
      }
    }
    
    // 3. 提取标题前的图片
    const headingImages = this.extractImagesBeforeHeadings(markdown);
    for (const img of headingImages) {
      if (images.length >= MAX_IMAGES) break;
      if (!seenUrls.has(img.url)) {
        images.push(img);
        seenUrls.add(img.url);
      }
    }
    
    return images;
  }

  private extractImagesBeforeHeadings(markdown: string): ScrapedContent["media"] {
    const images: ScrapedContent["media"] = [];
    const lines = markdown.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.match(/^#{2,3}\s+/)) {
        for (let j = Math.max(0, i - 5); j < i; j++) {
          const prevLine = lines[j];
          const mdMatch = prevLine.match(/!\[([^\]]*)\]\(([^)]+)\)/);
          if (mdMatch && this.isValidImage(mdMatch[2])) {
            images.push({
              url: mdMatch[2],
              type: this.getImageType(mdMatch[2]),
              alt: mdMatch[1] || "标题配图",
            });
            break;
          }
          const htmlMatch = prevLine.match(/<img[^>]+src=["']([^"']+)["'][^>]*>/);
          if (htmlMatch && this.isValidImage(htmlMatch[1])) {
            images.push({
              url: htmlMatch[1],
              type: this.getImageType(htmlMatch[1]),
              alt: "标题配图",
            });
            break;
          }
        }
      }
    }
    return images;
  }

  private isValidImage(url: string): boolean {
    const lowerUrl = url.toLowerCase();
    if (url.startsWith('https://camo.githubusercontent.com/')) return true;
    
    const imageExtensions = ['.png', '.webp', '.jpg', '.jpeg', '.gif', '.svg', '.avif'];
    const hasImageExtension = imageExtensions.some(ext => url.endsWith(ext));
    
    return url.startsWith('http') &&
      lowerUrl.includes('github') &&
      hasImageExtension &&
      !lowerUrl.includes('shields.io') &&
      !lowerUrl.includes('badge');
  }

  private getImageType(url: string): string {
    const lowerUrl = url.toLowerCase();
    if (lowerUrl.includes('.png')) return 'image/png';
    if (lowerUrl.includes('.jpg') || lowerUrl.includes('.jpeg')) return 'image/jpeg';
    if (lowerUrl.includes('.webp')) return 'image/webp';
    if (lowerUrl.includes('.svg')) return 'image/svg+xml';
    if (lowerUrl.includes('.gif')) return 'image/gif';
    return 'image/png';
  }
}
