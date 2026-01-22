import {
  ContentScraper,
  ScrapedContent,
  ScraperOptions,
} from "@src/modules/interfaces/scraper.interface.ts";
import { Logger } from "@zilla/logger";
import { ConfigManager } from "@src/utils/config/config-manager.ts";
import { FireCrawlScraper } from "./fireCrawl.scraper.ts";
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
  private fireCrawlScraper: FireCrawlScraper;
  private readonly TRENDING_URL = "https://github.com/trending";

  constructor() {
    this.configManager = ConfigManager.getInstance();
    this.httpClient = HttpClient.getInstance();
    this.fireCrawlScraper = new FireCrawlScraper();
    logger.debug("GitHub Trending 抓取器初始化完成");
  }

  /**
   * 抓取 GitHub Trending 项目
   * 直接抓取首页解析列表，使用 FireCrawl v2 获取详情
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
      
      // 3. 使用 FireCrawl v2 逐个获取项目详情
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
          const fcResponse = await this.fireCrawlScraper.v2Scrape(project.url);
          
          if (fcResponse.success && fcResponse.data?.markdown) {
            // 获取项目的 stars 数量
            const starsCount = await this.fetchStarsCount(project.fullName);
            logger.debug(`[GitHub Trending] 项目 ${project.fullName} 有 ${starsCount} stars`);
            
            // 从 Markdown 中提取图片（参考 Tech News 的流程）
            let markdown = fcResponse.data.markdown;
            
            // 只保留 "## Repository files navigation" 之后的内容
            markdown = this.filterContentAfterNavigation(markdown);
            
            const extractedImages = this.extractImagesFromMarkdown(markdown);
            
            // 只使用提取的符合条件的图片（.png/.webp 或 camo URL）
            // 每个项目最多展示 3 张
            const allMedia = extractedImages.slice(0, 3);
            
            logger.info(`[GitHub Trending] 项目 ${project.fullName} 提取到 ${extractedImages.length} 张符合条件的图片（.png/.webp 或 camo URL），最终展示 ${allMedia.length} 张`);
          
          const content: ScrapedContent = {
              id: `github_${project.fullName.replace(/\s?\/\s?/g, "_")}_${Date.now()}`,
              title: fcResponse.data.metadata?.title || project.fullName,
              content: markdown,
            url: project.url,
              publishDate: new Date().toISOString().split("T")[0],
              media: allMedia,
            metadata: {
              source: "github-trending",
              fullName: project.fullName,
                originalUrl: project.url,
                description: fcResponse.data.metadata?.description || "",
                stars: starsCount,
            },
          };
          
          contents.push(content);
            
            // 注册到项目库
            registeredProjects.push({
              fullName: project.fullName,
              url: project.url,
              stars: starsCount,
              description: fcResponse.data.metadata?.description || "",
            });
            
            logger.info(`[GitHub Trending] ✅ 成功获取详情: ${project.fullName} (⭐ ${starsCount}, 图片: ${allMedia.length})`);
          }
        } catch (error) {
          logger.warn(`[GitHub Trending] 抓取项目 ${project.fullName} 详情失败:`, error);
        }
        
        // 避免请求过快
        await new Promise(resolve => setTimeout(resolve, 1000));
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
   * 从 GitHub API 获取项目的 stars 数量
   */
  private async fetchStarsCount(fullName: string): Promise<number> {
    try {
      const apiUrl = `https://api.github.com/repos/${fullName.replace(/\s+/g, "")}`;
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
      return 0; // 失败时返回 0
    }
  }

  /**
   * 过滤 Markdown 内容，只保留 "## Repository files navigation" 之后的内容
   * 同时移除 Contributors 相关内容
   */
  private filterContentAfterNavigation(markdown: string): string {
    const navigationMarker = "## Repository files navigation";
    const markerIndex = markdown.indexOf(navigationMarker);
    
    if (markerIndex === -1) {
      // 如果没有找到标记，返回原始内容（向后兼容）
      logger.warn(`[GitHub Trending] 未找到 "${navigationMarker}" 标记，返回原始内容`);
      return this.removeContributorsSection(markdown);
    }
    
    // 找到标记之后的内容
    const afterMarker = markdown.substring(markerIndex + navigationMarker.length);
    
    // 移除开头的空白字符，保留后续内容
    let filtered = afterMarker.trim();
    
    // 移除 Contributors 部分
    filtered = this.removeContributorsSection(filtered);
    
    logger.info(`[GitHub Trending] 内容过滤完成: 原始长度 ${markdown.length}，过滤后长度 ${filtered.length}`);
    
    return filtered;
  }

  /**
   * 移除 Contributors 相关内容
   * 匹配模式：## Contributors 或 ## [Contributors ...] 开头的部分，直到下一个二级标题或文档结尾
   */
  private removeContributorsSection(markdown: string): string {
    // 匹配 "## Contributors" 或 "## [Contributors ..." 开头的章节
    // 从该标题开始，到下一个 ## 标题或文档结尾
    const contributorsRegex = /^##\s*(?:\[)?Contributors[^\n]*$/gmi;
    
    // 找到所有 Contributors 标题的位置
    const matches = Array.from(markdown.matchAll(contributorsRegex));
    
    if (matches.length === 0) {
      return markdown;
    }
    
    // 从后向前删除，避免索引错位
    let result = markdown;
    for (let i = matches.length - 1; i >= 0; i--) {
      const match = matches[i];
      const startIndex = match.index!;
      
      // 查找下一个 ## 标题的位置
      const nextHeaderRegex = /^##\s+/gm;
      nextHeaderRegex.lastIndex = startIndex + match[0].length;
      const nextMatch = nextHeaderRegex.exec(result);
      
      let endIndex: number;
      if (nextMatch) {
        // 如果找到下一个标题，删除到该标题之前
        endIndex = nextMatch.index!;
      } else {
        // 否则删除到文档结尾
        endIndex = result.length;
      }
      
      // 删除这一段
      result = result.substring(0, startIndex) + result.substring(endIndex);
    }
    
    logger.debug(`[GitHub Trending] 已移除 Contributors 部分`);
    return result.trim();
  }

  /**
   * 从 Markdown 中提取图片链接
   * 提取符合条件的图片，每个项目最多 3 张
   * 支持：
   * 1. GitHub 的 .png 或 .webp 图片（URL 包含 github 且以 .png 或 .webp 结尾）
   * 2. https://camo.githubusercontent.com/ 开头的图片（GitHub 图片代理）
   * 支持多种格式：
   * 1. 普通图片：![alt](url)
   * 2. 可点击图片：[![alt](image_url)](link_url)
   */
  private extractImagesFromMarkdown(markdown: string): ScrapedContent["media"] {
    const images: ScrapedContent["media"] = [];
    const seenUrls = new Set<string>(); // 去重
    const MAX_IMAGES = 3; // 每个项目最多 3 张图片
    
    // 1. 先匹配可点击图片格式：[![alt](image_url)](link_url)
    const clickableImageRegex = /\[!\[([^\]]*)\]\(([^)]+)\)\]\(([^)]+)\)/g;
    let match;
    let clickableCount = 0;
    
    while ((match = clickableImageRegex.exec(markdown)) !== null && images.length < MAX_IMAGES) {
      const imageUrl = match[2];
      const alt = match[1] || "项目图片";
      clickableCount++;
      
      if (this.isValidImage(imageUrl)) {
        if (!seenUrls.has(imageUrl)) {
          images.push({
            url: imageUrl,
            type: this.getImageType(imageUrl), // 使用推断的图片类型
            alt: alt,
          });
          seenUrls.add(imageUrl);
        }
      }
    }
    
    // 2. 再匹配普通图片格式：![alt](url)
    const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
    let normalCount = 0;
    
    while ((match = imageRegex.exec(markdown)) !== null && images.length < MAX_IMAGES) {
      const url = match[2];
      const alt = match[1] || "项目图片";
      normalCount++;
      
      if (this.isValidImage(url)) {
        if (!seenUrls.has(url)) {
          images.push({
            url: url,
            type: this.getImageType(url), // 使用推断的图片类型
            alt: alt,
          });
          seenUrls.add(url);
        }
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
    
    logger.info(`[GitHub Trending] 图片提取完成: 共找到 ${clickableCount + normalCount} 张，有效 ${images.length} 张（限制最多 ${MAX_IMAGES} 张）`);
    return images;
  }

  /**
   * 提取每个标题前的图片
   * 标题格式：## 或 ###
   */
  private extractImagesBeforeHeadings(markdown: string): ScrapedContent["media"] {
    const images: ScrapedContent["media"] = [];
    const lines = markdown.split('\n');
    
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
            const url = mdMatch[2];
            const alt = mdMatch[1] || "标题配图";
            if (this.isValidImage(url)) {
              images.push({
                url: url,
                type: this.getImageType(url),
                alt: alt,
              });
              break; // 只取第一个图片
            }
          }
          // 匹配 HTML img 标签
          const htmlMatch = prevLine.match(/<img[^>]+src=["']([^"']+)["'][^>]*>/);
          if (htmlMatch) {
            const url = htmlMatch[1];
            if (this.isValidImage(url)) {
              images.push({
                url: url,
                type: this.getImageType(url),
                alt: "标题配图",
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
   * 验证图片 URL 是否有效
   * 支持：
   * 1. 包含 "github" 且以图片格式结尾的图片（.png, .webp, .jpg, .jpeg, .gif, .svg, .avif, .bmp, .tiff）
   * 2. https://camo.githubusercontent.com/ 开头的图片（GitHub 图片代理）
   */
  private isValidImage(url: string): boolean {
    const lowerUrl = url.toLowerCase();
    
    // 条件 1: 支持 camo.githubusercontent.com 图片（GitHub 图片代理）
    if (url.startsWith('https://camo.githubusercontent.com/')) {
      return true; // camo URL 都是图片，直接接受
    }
    
    // 支持的图片格式
    const imageExtensions = ['.png', '.webp', '.jpg', '.jpeg', '.gif', '.svg', '.avif', '.bmp', '.tiff'];
    const hasImageExtension = imageExtensions.some(ext => url.endsWith(ext));
    
    // 条件 2: 必须满足以下条件：
    // 1. 以 http 开头
    // 2. URL 中包含 "github"
    // 3. 以支持的图片格式结尾
    // 4. 过滤掉常见的徽章图片和小尺寸 SVG 图标
    return url.startsWith('http') &&
      lowerUrl.includes('github') &&
      hasImageExtension &&
      !lowerUrl.includes('shields.io') &&
      !lowerUrl.includes('badge') &&
      !lowerUrl.includes('travis-ci') &&
      !lowerUrl.includes('coveralls.io') &&
      !lowerUrl.includes('codecov.io') &&
      !lowerUrl.includes('img.shields.io') &&
      !lowerUrl.includes('badgen.net') &&
      !(url.endsWith('.svg') && (lowerUrl.includes('/icon') || lowerUrl.includes('/logo') || lowerUrl.includes('icon.svg')));
  }

  /**
   * 根据 URL 推断图片类型
   */
  private getImageType(url: string): string {
    // camo URL 通常都是图片，根据 URL 中的编码或默认返回 png
    if (url.startsWith('https://camo.githubusercontent.com/')) {
      // 检查 URL 中是否包含图片类型提示（通常在路径中）
      // 如果没有，默认为 PNG（GitHub camo 最常用）
      const lowerUrl = url.toLowerCase();
      if (lowerUrl.includes('.png') || lowerUrl.includes('png')) {
        return 'image/png';
      }
      if (lowerUrl.includes('.jpg') || lowerUrl.includes('.jpeg') || lowerUrl.includes('jpg') || lowerUrl.includes('jpeg')) {
        return 'image/jpeg';
      }
      if (lowerUrl.includes('.gif') || lowerUrl.includes('gif')) {
        return 'image/gif';
      }
      if (lowerUrl.includes('.webp') || lowerUrl.includes('webp')) {
        return 'image/webp';
      }
      if (lowerUrl.includes('.svg') || lowerUrl.includes('svg')) {
        return 'image/svg+xml';
      }
      if (lowerUrl.includes('.avif') || lowerUrl.includes('avif')) {
        return 'image/avif';
      }
      if (lowerUrl.includes('.bmp') || lowerUrl.includes('bmp')) {
        return 'image/bmp';
      }
      if (lowerUrl.includes('.tiff') || lowerUrl.includes('.tif') || lowerUrl.includes('tiff') || lowerUrl.includes('tif')) {
        return 'image/tiff';
      }
      // 默认返回 PNG（GitHub camo 最常用）
      return 'image/png';
    }
    
    // 普通 URL 根据扩展名判断
    if (url.endsWith('.png')) return 'image/png';
    if (url.endsWith('.jpg') || url.endsWith('.jpeg')) return 'image/jpeg';
    if (url.endsWith('.gif')) return 'image/gif';
    if (url.endsWith('.webp')) return 'image/webp';
    if (url.endsWith('.svg')) return 'image/svg+xml';
    if (url.endsWith('.avif')) return 'image/avif';
    if (url.endsWith('.bmp')) return 'image/bmp';
    if (url.endsWith('.tiff') || url.endsWith('.tif')) return 'image/tiff';
    return 'image/png'; // 默认
  }
}

  /**
   * 获取项目相关图片 (OpenGraph 封面)
   */
  private getProjectImages(fullName: string): ScrapedContent["media"] {
    const urlPath = fullName.replace(/\s+/g, "");
    return [
      {
        url: `https://opengraph.githubassets.com/1/${urlPath}`,
        type: "image/png",
        size: { width: 1200, height: 600 },
      }
    ];
  }

  /**
   * 从 GitHub API 获取项目的 stars 数量
   */
  private async fetchStarsCount(fullName: string): Promise<number> {
    try {
      const apiUrl = `https://api.github.com/repos/${fullName.replace(/\s+/g, "")}`;
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
      return 0; // 失败时返回 0
    }
  }

  /**
   * 过滤 Markdown 内容，只保留 "## Repository files navigation" 之后的内容
   * 同时移除 Contributors 相关内容
   */
  private filterContentAfterNavigation(markdown: string): string {
    const navigationMarker = "## Repository files navigation";
    const markerIndex = markdown.indexOf(navigationMarker);
    
    if (markerIndex === -1) {
      // 如果没有找到标记，返回原始内容（向后兼容）
      logger.warn(`[GitHub Trending] 未找到 "${navigationMarker}" 标记，返回原始内容`);
      return this.removeContributorsSection(markdown);
    }
    
    // 找到标记之后的内容
    const afterMarker = markdown.substring(markerIndex + navigationMarker.length);
    
    // 移除开头的空白字符，保留后续内容
    let filtered = afterMarker.trim();
    
    // 移除 Contributors 部分
    filtered = this.removeContributorsSection(filtered);
    
    logger.info(`[GitHub Trending] 内容过滤完成: 原始长度 ${markdown.length}，过滤后长度 ${filtered.length}`);
    
    return filtered;
  }

  /**
   * 移除 Contributors 相关内容
   * 匹配模式：## Contributors 或 ## [Contributors ...] 开头的部分，直到下一个二级标题或文档结尾
   */
  private removeContributorsSection(markdown: string): string {
    // 匹配 "## Contributors" 或 "## [Contributors ..." 开头的章节
    // 从该标题开始，到下一个 ## 标题或文档结尾
    const contributorsRegex = /^##\s*(?:\[)?Contributors[^\n]*$/gmi;
    
    // 找到所有 Contributors 标题的位置
    const matches = Array.from(markdown.matchAll(contributorsRegex));
    
    if (matches.length === 0) {
      return markdown;
    }
    
    // 从后向前删除，避免索引错位
    let result = markdown;
    for (let i = matches.length - 1; i >= 0; i--) {
      const match = matches[i];
      const startIndex = match.index!;
      
      // 查找下一个 ## 标题的位置
      const nextHeaderRegex = /^##\s+/gm;
      nextHeaderRegex.lastIndex = startIndex + match[0].length;
      const nextMatch = nextHeaderRegex.exec(result);
      
      let endIndex: number;
      if (nextMatch) {
        // 如果找到下一个标题，删除到该标题之前
        endIndex = nextMatch.index!;
      } else {
        // 否则删除到文档结尾
        endIndex = result.length;
      }
      
      // 删除这一段
      result = result.substring(0, startIndex) + result.substring(endIndex);
    }
    
    logger.debug(`[GitHub Trending] 已移除 Contributors 部分`);
    return result.trim();
  }

  /**
   * 从 Markdown 中提取图片链接
   * 提取符合条件的图片，每个项目最多 3 张
   * 支持：
   * 1. GitHub 的 .png 或 .webp 图片（URL 包含 github 且以 .png 或 .webp 结尾）
   * 2. https://camo.githubusercontent.com/ 开头的图片（GitHub 图片代理）
   * 支持多种格式：
   * 1. 普通图片：![alt](url)
   * 2. 可点击图片：[![alt](image_url)](link_url)
   */
  private extractImagesFromMarkdown(markdown: string): ScrapedContent["media"] {
    const images: ScrapedContent["media"] = [];
    const seenUrls = new Set<string>(); // 去重
    const MAX_IMAGES = 3; // 每个项目最多 3 张图片
    
    // 1. 先匹配可点击图片格式：[![alt](image_url)](link_url)
    const clickableImageRegex = /\[!\[([^\]]*)\]\(([^)]+)\)\]\(([^)]+)\)/g;
    let match;
    let clickableCount = 0;
    
    while ((match = clickableImageRegex.exec(markdown)) !== null && images.length < MAX_IMAGES) {
      const imageUrl = match[2];
      const alt = match[1] || "项目图片";
      clickableCount++;
      
      if (this.isValidImage(imageUrl)) {
        if (!seenUrls.has(imageUrl)) {
          images.push({
            url: imageUrl,
            type: this.getImageType(imageUrl), // 使用推断的图片类型
            alt: alt,
          });
          seenUrls.add(imageUrl);
        }
      }
    }
    
    // 2. 再匹配普通图片格式：![alt](url)
    const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
    let normalCount = 0;
    
    while ((match = imageRegex.exec(markdown)) !== null && images.length < MAX_IMAGES) {
      const url = match[2];
      const alt = match[1] || "项目图片";
      normalCount++;
      
      if (this.isValidImage(url)) {
        if (!seenUrls.has(url)) {
          images.push({
            url: url,
            type: this.getImageType(url), // 使用推断的图片类型
            alt: alt,
          });
          seenUrls.add(url);
        }
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
    
    logger.info(`[GitHub Trending] 图片提取完成: 共找到 ${clickableCount + normalCount} 张，有效 ${images.length} 张（限制最多 ${MAX_IMAGES} 张）`);
    return images;
  }

  /**
   * 提取每个标题前的图片
   * 标题格式：## 或 ###
   */
  private extractImagesBeforeHeadings(markdown: string): ScrapedContent["media"] {
    const images: ScrapedContent["media"] = [];
    const lines = markdown.split('\n');
    
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
            const url = mdMatch[2];
            const alt = mdMatch[1] || "标题配图";
            if (this.isValidImage(url)) {
              images.push({
                url: url,
                type: this.getImageType(url),
                alt: alt,
              });
              break; // 只取第一个图片
            }
          }
          // 匹配 HTML img 标签
          const htmlMatch = prevLine.match(/<img[^>]+src=["']([^"']+)["'][^>]*>/);
          if (htmlMatch) {
            const url = htmlMatch[1];
            if (this.isValidImage(url)) {
              images.push({
                url: url,
                type: this.getImageType(url),
                alt: "标题配图",
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
   * 验证图片 URL 是否有效
   * 支持：
   * 1. 包含 "github" 且以图片格式结尾的图片（.png, .webp, .jpg, .jpeg, .gif, .svg, .avif, .bmp, .tiff）
   * 2. https://camo.githubusercontent.com/ 开头的图片（GitHub 图片代理）
   */
  private isValidImage(url: string): boolean {
    const lowerUrl = url.toLowerCase();
    
    // 条件 1: 支持 camo.githubusercontent.com 图片（GitHub 图片代理）
    if (url.startsWith('https://camo.githubusercontent.com/')) {
      return true; // camo URL 都是图片，直接接受
    }
    
    // 支持的图片格式
    const imageExtensions = ['.png', '.webp', '.jpg', '.jpeg', '.gif', '.svg', '.avif', '.bmp', '.tiff'];
    const hasImageExtension = imageExtensions.some(ext => url.endsWith(ext));
    
    // 条件 2: 必须满足以下条件：
    // 1. 以 http 开头
    // 2. URL 中包含 "github"
    // 3. 以支持的图片格式结尾
    // 4. 过滤掉常见的徽章图片和小尺寸 SVG 图标
    return url.startsWith('http') &&
      lowerUrl.includes('github') &&
      hasImageExtension &&
      !lowerUrl.includes('shields.io') &&
      !lowerUrl.includes('badge') &&
      !lowerUrl.includes('travis-ci') &&
      !lowerUrl.includes('coveralls.io') &&
      !lowerUrl.includes('codecov.io') &&
      !lowerUrl.includes('img.shields.io') &&
      !lowerUrl.includes('badgen.net') &&
      !(url.endsWith('.svg') && (lowerUrl.includes('/icon') || lowerUrl.includes('/logo') || lowerUrl.includes('icon.svg')));
  }

  /**
   * 根据 URL 推断图片类型
   */
  private getImageType(url: string): string {
    // camo URL 通常都是图片，根据 URL 中的编码或默认返回 png
    if (url.startsWith('https://camo.githubusercontent.com/')) {
      // 检查 URL 中是否包含图片类型提示（通常在路径中）
      // 如果没有，默认为 PNG（GitHub camo 最常用）
      const lowerUrl = url.toLowerCase();
      if (lowerUrl.includes('.png') || lowerUrl.includes('png')) {
        return 'image/png';
      }
      if (lowerUrl.includes('.jpg') || lowerUrl.includes('.jpeg') || lowerUrl.includes('jpg') || lowerUrl.includes('jpeg')) {
        return 'image/jpeg';
      }
      if (lowerUrl.includes('.gif') || lowerUrl.includes('gif')) {
        return 'image/gif';
      }
      if (lowerUrl.includes('.webp') || lowerUrl.includes('webp')) {
        return 'image/webp';
      }
      if (lowerUrl.includes('.svg') || lowerUrl.includes('svg')) {
        return 'image/svg+xml';
      }
      if (lowerUrl.includes('.avif') || lowerUrl.includes('avif')) {
        return 'image/avif';
      }
      if (lowerUrl.includes('.bmp') || lowerUrl.includes('bmp')) {
        return 'image/bmp';
      }
      if (lowerUrl.includes('.tiff') || lowerUrl.includes('.tif') || lowerUrl.includes('tiff') || lowerUrl.includes('tif')) {
        return 'image/tiff';
      }
      // 默认返回 PNG（GitHub camo 最常用）
      return 'image/png';
    }
    
    // 普通 URL 根据扩展名判断
    if (url.endsWith('.png')) return 'image/png';
    if (url.endsWith('.jpg') || url.endsWith('.jpeg')) return 'image/jpeg';
    if (url.endsWith('.gif')) return 'image/gif';
    if (url.endsWith('.webp')) return 'image/webp';
    if (url.endsWith('.svg')) return 'image/svg+xml';
    if (url.endsWith('.avif')) return 'image/avif';
    if (url.endsWith('.bmp')) return 'image/bmp';
    if (url.endsWith('.tiff') || url.endsWith('.tif')) return 'image/tiff';
    return 'image/png'; // 默认
  }
}

