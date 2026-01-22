/**
 * 图片补充服务
 * 实现混合图片获取策略：优先使用爬取的图片，不足时用 AI 生成
 * 生成的图片会立即上传到微信，避免 base64 数据导致内容过大
 */

import { Media, ScrapedContent } from "@src/modules/interfaces/scraper.interface.ts";
import { GeminiImageGenerator } from "@src/providers/image-gen/gemini/gemini-image-generator.ts";
import { WeixinPublisher } from "@src/modules/publishers/weixin.publisher.ts";
import { ConfigManager } from "@src/utils/config/config-manager.ts";
import { Logger } from "@zilla/logger";

const logger = new Logger("image-filler");

/**
 * 图片填充选项
 */
export interface ImageFillerOptions {
  /** 每篇文章最少需要的图片数量 */
  minImagesPerArticle?: number;
  /** 每篇文章最多图片数量 */
  maxImagesPerArticle?: number;
  /** 是否为封面生成 AI 图片 */
  generateCoverImage?: boolean;
  /** 封面图片宽高比 */
  coverAspectRatio?: "16:9" | "1:1" | "4:3";
}

/**
 * 章节信息（用于生成配图）
 */
export interface SectionInfo {
  title: string;
  content: string;
  index: number;
}

/**
 * 图片补充服务
 */
export class ImageFillerService {
  private configManager: ConfigManager;
  private imageGenerator: GeminiImageGenerator | null = null;
  private weixinPublisher: WeixinPublisher | null = null;

  constructor() {
    this.configManager = ConfigManager.getInstance();
  }

  /**
   * 初始化图片生成器
   */
  private async ensureImageGenerator(): Promise<GeminiImageGenerator> {
    if (!this.imageGenerator) {
      this.imageGenerator = new GeminiImageGenerator();
      await this.imageGenerator.initialize();
    }
    return this.imageGenerator;
  }

  /**
   * 初始化微信发布器
   */
  private async ensureWeixinPublisher(): Promise<WeixinPublisher> {
    if (!this.weixinPublisher) {
      this.weixinPublisher = new WeixinPublisher();
      await this.weixinPublisher.refresh();
    }
    return this.weixinPublisher;
  }

  /**
   * 将 base64 图片上传到微信，返回微信图片 URL
   */
  private async uploadBase64ToWeixin(base64DataUrl: string): Promise<string> {
    const publisher = await this.ensureWeixinPublisher();

    // 解析 base64
    const match = base64DataUrl.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/);
    if (!match) {
      throw new Error("无效的 base64 图片格式");
    }

    const base64Data = match[2];
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    logger.debug(`上传 base64 图片到微信，大小: ${(bytes.length / 1024).toFixed(2)}KB`);

    // 上传到微信
    const weixinUrl = await publisher.uploadContentImage("ai_generated.jpg", bytes);
    return weixinUrl;
  }

  /**
   * 为文章补充图片
   * @param article 文章内容
   * @param options 补充选项
   * @returns 补充后的文章
   */
  async fillImages(
    article: ScrapedContent,
    options: ImageFillerOptions = {},
  ): Promise<ScrapedContent> {
    const {
      minImagesPerArticle = 1,
      maxImagesPerArticle = 3,
      generateCoverImage = false,
    } = options;

    const existingImages = article.media || [];
    const neededImages = Math.max(0, minImagesPerArticle - existingImages.length);

    logger.debug(
      `[图片补充] 文章 "${article.title}" 现有 ${existingImages.length} 张图片，需要补充 ${neededImages} 张`,
    );

    // 如果图片已经足够，直接返回
    if (neededImages === 0 && !generateCoverImage) {
      return article;
    }

    const generator = await this.ensureImageGenerator();
    const newMedia: Media[] = [...existingImages];

    try {
      // 1. 生成封面图片（如果需要）
      if (generateCoverImage) {
        logger.info(`[图片补充] 为 "${article.title}" 生成封面图片`);
        try {
          const coverBase64 = await generator.generatePoster({
            title: article.title,
            prompt_text_zh: article.metadata?.keywords?.join("、") || article.title,
          });

          // 立即上传到微信
          const coverUrl = await this.uploadBase64ToWeixin(coverBase64);

          // 封面图片放在最前面
          newMedia.unshift({
            url: coverUrl,
            type: "image/jpeg",
            size: { width: 1200, height: 675 },
          });

          logger.info(`[图片补充] 封面图片上传成功: ${coverUrl.substring(0, 80)}...`);
        } catch (error) {
          logger.error(`[图片补充] 封面图片生成/上传失败:`, error);
        }
      }

      // 2. 补充内容配图（如果需要）
      if (neededImages > 0) {
        const sections = this.extractSections(article.content);
        const imagesToGenerate = Math.min(
          neededImages,
          sections.length,
          maxImagesPerArticle - newMedia.length,
        );

        logger.info(`[图片补充] 为 "${article.title}" 生成 ${imagesToGenerate} 张内容配图`);

        for (let i = 0; i < imagesToGenerate; i++) {
          const section = sections[i % sections.length];
          try {
            const imageBase64 = await generator.generateArticleImage(
              section.content,
              section.title,
            );

            // 立即上传到微信
            const imageUrl = await this.uploadBase64ToWeixin(imageBase64);

            newMedia.push({
              url: imageUrl,
              type: "image/jpeg",
              size: { width: 800, height: 800 },
            });

            logger.debug(`[图片补充] 章节 "${section.title}" 配图上传成功`);
          } catch (error) {
            logger.warn(`[图片补充] 章节配图生成/上传失败:`, error);
          }
        }
      }
    } catch (error) {
      logger.error(`[图片补充] 图片生成失败:`, error);
    }

    // 限制最大图片数量
    const finalMedia = newMedia.slice(0, maxImagesPerArticle);

    return {
      ...article,
      media: finalMedia,
      metadata: {
        ...article.metadata,
        imageCount: finalMedia.length,
        hasAiGeneratedImages: finalMedia.length > existingImages.length,
      },
    };
  }

  /**
   * 批量为文章补充图片
   */
  async fillImagesForArticles(
    articles: ScrapedContent[],
    options: ImageFillerOptions = {},
  ): Promise<ScrapedContent[]> {
    const results: ScrapedContent[] = [];

    for (const article of articles) {
      try {
        const filled = await this.fillImages(article, options);
        results.push(filled);
      } catch (error) {
        logger.error(`[图片补充] 处理文章 "${article.title}" 失败:`, error);
        results.push(article);
      }
    }

    return results;
  }

  /**
   * 从文章内容中提取章节
   */
  private extractSections(content: string): SectionInfo[] {
    const sections: SectionInfo[] = [];

    // 匹配 <section title="...">...</section> 格式
    const sectionRegex = /<section\s+title="([^"]+)">([\s\S]*?)<\/section>/gi;
    let match;
    let index = 0;

    while ((match = sectionRegex.exec(content)) !== null) {
      sections.push({
        title: match[1],
        content: match[2].replace(/<[^>]+>/g, "").trim(),
        index: index++,
      });
    }

    // 如果没有找到 section 标签，按段落分割
    if (sections.length === 0) {
      const paragraphs = content.split(/<next_paragraph\s*\/?>/i).filter(p => p.trim());
      paragraphs.forEach((p, i) => {
        const cleanText = p.replace(/<[^>]+>/g, "").trim();
        // 降低门槛到 50 字符，确保能提取到段落
        if (cleanText.length > 50) {
          sections.push({
            title: `段落 ${i + 1}`,
            content: cleanText,
            index: i,
          });
        }
      });
    }

    // 如果还是没有段落，使用整个内容
    if (sections.length === 0 && content.trim().length > 0) {
      sections.push({
        title: "文章内容",
        content: content.replace(/<[^>]+>/g, "").trim().substring(0, 500),
        index: 0,
      });
    }

    logger.debug(`[图片补充] 提取到 ${sections.length} 个章节`);
    return sections;
  }

  /**
   * 验证图片 URL 是否可访问
   */
  async validateImageUrl(url: string): Promise<boolean> {
    if (url.startsWith("data:image/")) {
      return true;
    }

    try {
      const response = await fetch(url, {
        method: "HEAD",
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      });

      if (!response.ok) {
        return false;
      }

      const contentType = response.headers.get("content-type");
      return contentType ? contentType.startsWith("image/") : false;
    } catch {
      return false;
    }
  }

  /**
   * 过滤无效图片
   */
  async filterValidImages(media: Media[]): Promise<Media[]> {
    const validMedia: Media[] = [];

    for (const m of media) {
      if (await this.validateImageUrl(m.url)) {
        validMedia.push(m);
      } else {
        logger.debug(`[图片补充] 图片无效，已移除: ${m.url.substring(0, 50)}...`);
      }
    }

    return validMedia;
  }
}

/**
 * 单例获取器
 */
let instance: ImageFillerService | null = null;

export function getImageFillerService(): ImageFillerService {
  if (!instance) {
    instance = new ImageFillerService();
  }
  return instance;
}
