import { join } from "jsr:@std/path";
import { ensureDir } from "jsr:@std/fs";
import { decodeBase64 } from "jsr:@std/encoding/base64";
import { Logger } from "@zilla/logger";

const logger = new Logger("article-storage");

export interface ArticleSaveOptions {
  title: string;
  markdown: string;
  html?: string;
  coverImageUrl?: string;
  metadata?: Record<string, any>;
  baseDir?: string;
}

/**
 * 最终生成的文章存储工具
 */
export class ArticleStorage {
  private baseDir: string;

  constructor(baseDir: string = "./data/articles") {
    this.baseDir = baseDir;
  }

  /**
   * 生成目录名称：YYYY-MM-DD-HHMMSS-标题
   */
  private generateFolderName(title: string): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");
    
    const safeTitle = title.replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, "_").substring(0, 30);
    return `${year}-${month}-${day}-${hours}${minutes}${seconds}-${safeTitle}`;
  }

  /**
   * 保存文章到本地
   */
  async saveArticle(options: ArticleSaveOptions): Promise<string> {
    const folderName = this.generateFolderName(options.title);
    const saveDir = join(options.baseDir || this.baseDir, folderName);

    try {
      await ensureDir(saveDir);
      logger.info(`[文章存储] 创建目录: ${saveDir}`);

      // 1. 保存 Markdown 文件
      const mdPath = join(saveDir, "article.md");
      await Deno.writeTextFile(mdPath, options.markdown);
      logger.info(`[文章存储] 保存 Markdown: ${mdPath}`);

      // 2. 保存 HTML 文件（如果提供）
      if (options.html) {
        const htmlPath = join(saveDir, "article.html");
        await Deno.writeTextFile(htmlPath, options.html);
        logger.info(`[文章存储] 保存 HTML: ${htmlPath}`);
      }

      // 3. 保存封面图
      if (options.coverImageUrl) {
        try {
          let imageBuffer: Uint8Array;
          let extension = "png";

          if (options.coverImageUrl.startsWith("data:image/")) {
            // 处理 base64
            const match = options.coverImageUrl.match(/^data:image\/(\w+);base64,(.+)$/);
            if (match) {
              extension = match[1];
              const base64Data = match[2];
              imageBuffer = decodeBase64(base64Data);
            } else {
              throw new Error("无效的 base64 图片格式");
            }
          } else {
            // 处理远程 URL
            const response = await fetch(options.coverImageUrl);
            if (!response.ok) throw new Error(`下载封面失败: ${response.statusText}`);
            imageBuffer = new Uint8Array(await response.arrayBuffer());
            
            // 尝试从 URL 探测扩展名
            const urlLower = options.coverImageUrl.toLowerCase();
            if (urlLower.includes(".jpg") || urlLower.includes(".jpeg")) extension = "jpg";
            else if (urlLower.includes(".webp")) extension = "webp";
            else if (urlLower.includes(".gif")) extension = "gif";
          }

          const imagePath = join(saveDir, `cover.${extension}`);
          await Deno.writeFile(imagePath, imageBuffer);
          logger.info(`[文章存储] 保存封面图: ${imagePath}`);
        } catch (imgError) {
          logger.error(`[文章存储] 保存封面图失败: ${imgError instanceof Error ? imgError.message : String(imgError)}`);
        }
      }

      // 4. 保存元数据
      const metadata = {
        title: options.title,
        saveTime: new Date().toISOString(),
        ...(options.metadata || {}),
      };
      const metadataPath = join(saveDir, "metadata.json");
      await Deno.writeTextFile(metadataPath, JSON.stringify(metadata, null, 2));
      logger.info(`[文章存储] 保存元数据: ${metadataPath}`);

      return saveDir;
    } catch (error) {
      logger.error(`[文章存储] 保存文章失败: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
}
