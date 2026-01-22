// src/utils/image/image-processor.ts
import { Logger } from "@zilla/logger";

// 动态导入图片处理库，避免启动时下载
let imagescriptModule: { decode: any; Image: any } | null = null;
let sharpModule: any = null;

async function getImagescript() {
  if (!imagescriptModule) {
    imagescriptModule = await import(
      "https://deno.land/x/imagescript@1.2.17/mod.ts"
    );
  }
  return imagescriptModule;
}

async function getSharp() {
  if (!sharpModule) {
    sharpModule = await import("npm:sharp@^0.33.0");
  }
  return sharpModule.default || sharpModule;
}

const logger = new Logger("image-processor");

interface ImageValidationResult {
  isValid: boolean;
  contentType?: string;
  error?: string;
}

interface ImageProcessResult {
  originalUrl: string;
  newUrl?: string;
  error?: string;
}

interface ImageDimensions {
  width: number;
  height: number;
  format?: string;
}

export class WeixinImageProcessor {
  private static readonly MAX_IMAGE_SIZE = 1024 * 1024; // 1MB
  private static readonly STANDARD_MAX_WIDTH = 1080; // 微信公众号推荐标准最大宽度
  private static readonly VALID_MIME_TYPES = [
    "image/jpeg",
    "image/png",
    "image/gif",
  ];
  // 高质量图片尺寸阈值
  private static readonly MIN_WIDTH = 200;
  private static readonly MIN_HEIGHT = 100;

  private weixinPublisher: any;

  constructor(weixinPublisher: any) {
    this.weixinPublisher = weixinPublisher;
  }

  /**
   * 压缩图片并转换为 JPEG
   * 优先使用 sharp（支持 WebP），失败时回退到 imagescript
   */
  private async compressImage(
    imageBuffer: Uint8Array,
    maxSizeInMB: number = 1,
  ): Promise<Uint8Array> {
    const originalSize = imageBuffer.byteLength / (1024 * 1024);
    
    // 尝试使用 sharp（支持 WebP 等多种格式）
    try {
      const sharp = await getSharp();
      logger.debug(`使用 sharp 处理图片，原始大小: ${originalSize.toFixed(2)}MB`);
      
      // 检测图片格式
      const isWebP = imageBuffer[0] === 0x52 && imageBuffer[1] === 0x49 && 
                     imageBuffer[2] === 0x46 && imageBuffer[3] === 0x46 &&
                     imageBuffer[8] === 0x57 && imageBuffer[9] === 0x45 && 
                     imageBuffer[10] === 0x42 && imageBuffer[11] === 0x50;
      
      if (isWebP) {
        logger.debug("检测到 WebP 格式，使用 sharp 转换");
      }
      
      // 计算质量参数
      let quality: number;
      let scale = 1;

      if (originalSize > 5) {
        quality = 30;
        scale = 0.5;
      } else if (originalSize > 3) {
        quality = 40;
        scale = 0.6;
      } else if (originalSize > 2) {
        quality = 50;
        scale = 0.7;
      } else if (originalSize > 1) {
        quality = 60;
        scale = 0.8;
      } else {
        quality = 80;
        scale = 1;
      }

      // 使用 sharp 处理图片
      let sharpInstance = sharp(imageBuffer);
      
      // 获取原始尺寸
      const metadata = await sharpInstance.metadata();
      const originalWidth = metadata.width || 1920;
      const originalHeight = metadata.height || 1080;
      
      // 计算自适应尺寸：优先保证宽度不超过标准宽度
      let targetWidth = originalWidth;
      let targetHeight = originalHeight;

      if (originalWidth > WeixinImageProcessor.STANDARD_MAX_WIDTH) {
        targetWidth = WeixinImageProcessor.STANDARD_MAX_WIDTH;
        targetHeight = Math.round(originalHeight * (WeixinImageProcessor.STANDARD_MAX_WIDTH / originalWidth));
      }

      // 根据文件大小进行二次缩放
      if (scale < 1) {
        targetWidth = Math.round(targetWidth * scale);
        targetHeight = Math.round(targetHeight * scale);
      }
      
      // 执行调整尺寸
      sharpInstance = sharpInstance.resize(targetWidth, targetHeight, {
        fit: 'inside',
        withoutEnlargement: true,
      });
      
      // 转换为 JPEG
      let output = await sharpInstance
        .jpeg({ quality, mozjpeg: true })
        .toBuffer();
      
      // 如果还是太大，进一步压缩
      if (output.length > maxSizeInMB * 1024 * 1024) {
        logger.debug(`图片仍然过大 (${(output.length / 1024 / 1024).toFixed(2)}MB)，进一步压缩`);
        const finalWidth = Math.round(targetWidth * 0.7);
        const finalHeight = Math.round(targetHeight * 0.7);
        const lowerQuality = Math.max(quality - 20, 30);
        
        output = await sharp(imageBuffer)
          .resize(finalWidth, finalHeight, {
            fit: 'inside',
            withoutEnlargement: true,
          })
          .jpeg({ quality: lowerQuality, mozjpeg: true })
          .toBuffer();
      }
      
      logger.debug(`sharp 处理完成，输出大小: ${(output.length / 1024 / 1024).toFixed(2)}MB`);
      return new Uint8Array(output);
      
    } catch (sharpError) {
      logger.warn(`sharp 处理失败，回退到 imagescript: ${sharpError}`);
      
      // 回退到 imagescript
      try {
        const { decode, Image } = await getImagescript();
        
        // 尝试解码图片
        let image: typeof Image;
        try {
          image = (await decode(imageBuffer)) as typeof Image;
        } catch (decodeError) {
          // 如果解码失败，可能是格式不支持（如 WebP）
          logger.error(`图片解码失败: ${decodeError}`);
          throw new Error(`Unsupported image type: ${decodeError instanceof Error ? decodeError.message : String(decodeError)}`);
        }
        
        let quality: number;
        let scale = 1;

        if (originalSize > 5) {
          quality = 30;
          scale = 0.5;
        } else if (originalSize > 3) {
          quality = 40;
          scale = 0.6;
        } else if (originalSize > 2) {
          quality = 50;
          scale = 0.7;
        } else if (originalSize > 1) {
          quality = 60;
          scale = 0.8;
        } else {
          quality = 80;
          scale = 1;
        }

        // 调整尺寸：优先保证宽度不超过标准宽度
        let targetWidth = image.width;
        let targetHeight = image.height;

        if (image.width > WeixinImageProcessor.STANDARD_MAX_WIDTH) {
          targetWidth = WeixinImageProcessor.STANDARD_MAX_WIDTH;
          targetHeight = Math.round(image.height * (WeixinImageProcessor.STANDARD_MAX_WIDTH / image.width));
        }

        if (scale < 1) {
          targetWidth = Math.round(targetWidth * scale);
          targetHeight = Math.round(targetHeight * scale);
        }

        if (targetWidth !== image.width) {
          image.resize(targetWidth, targetHeight);
        }

        // 编码为 JPEG
        const output = await image.encodeJPEG(quality);

        // 如果还是太大，再次压缩
        if (output.length > maxSizeInMB * 1024 * 1024) {
          const finalWidth = Math.round(targetWidth * 0.7);
          const finalHeight = Math.round(targetHeight * 0.7);
          image.resize(finalWidth, finalHeight);
          return await image.encodeJPEG(Math.max(quality - 20, 30));
        }

        return output;
      } catch (imagescriptError) {
        logger.error("图片压缩失败（sharp 和 imagescript 都失败）:", imagescriptError);
        throw new Error(`图片处理失败: ${imagescriptError instanceof Error ? imagescriptError.message : String(imagescriptError)}`);
      }
    }
  }

  /**
   * 将 SVG 转换为 PNG
   * @param svgBuffer SVG 图片的二进制数据
   * @returns PNG 格式的二进制数据
   */
  private async convertSvgToPng(svgBuffer: Uint8Array): Promise<Uint8Array> {
    try {
      // 使用 sharp 将 SVG 转换为 PNG
      const svgString = new TextDecoder().decode(svgBuffer);
      const sharp = await getSharp();
      const pngBuffer = await sharp(Buffer.from(svgString), {
        density: 300, // 提高 SVG 渲染分辨率
      })
        .resize(WeixinImageProcessor.STANDARD_MAX_WIDTH, null, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .png({ quality: 90 })
        .toBuffer();
      
      logger.info(`SVG 转换为 PNG 成功，大小: ${(pngBuffer.length / 1024).toFixed(2)}KB`);
      
      // 如果 PNG 仍然太大，进行压缩
      if (pngBuffer.length > 2 * 1024 * 1024) {
        logger.debug(`PNG 仍然过大，进行二次压缩`);
        return await this.compressImage(pngBuffer);
      }
      
      return new Uint8Array(pngBuffer);
    } catch (error) {
      logger.error("SVG 转换失败:", error);
      throw new Error(`SVG 转换失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 处理文章内容中的所有图片
   */
  async processContent(content: string): Promise<{
    content: string;
    results: ImageProcessResult[];
  }> {
    const imageUrls = this.extractImageUrls(content);
    const results: ImageProcessResult[] = [];
    let processedContent = content;

    logger.info(`发现 ${imageUrls.length} 张图片需要处理`);

    for (const imageUrl of imageUrls) {
      try {
        // 跳过已经是微信 CDN 的图片
        if (imageUrl.includes('mmbiz.qpic.cn')) {
          logger.debug(`跳过微信 CDN 图片: ${imageUrl.substring(0, 50)}...`);
          continue;
        }

        // 处理 base64 图片
        if (this.isBase64Image(imageUrl)) {
          const result = await this.processBase64Image(imageUrl);
          results.push(result);
          if (result.newUrl) {
            processedContent = this.replaceImageUrl(
              processedContent,
              imageUrl,
              result.newUrl,
            );
          }
          continue;
        }

        // 处理 Next.js 优化的图片 URL
        let realImageUrl = imageUrl;
        if (imageUrl.includes('/_next/image?url=')) {
          const urlMatch = imageUrl.match(/[?&]url=([^&]+)/);
          if (urlMatch) {
            realImageUrl = decodeURIComponent(urlMatch[1]);
            logger.info(`解析 Next.js 图片: ${realImageUrl.substring(0, 80)}...`);
          }
        }

        // 处理普通 URL 图片
        const validationResult = await this.validateImage(realImageUrl);
        if (!validationResult.isValid) {
          // 如果需要转换的格式（WebP、SVG、AVIF、BMP、TIFF），尝试下载并转换
          const convertFormats = ['webp', 'svg', 'avif', 'bmp', 'tiff', 'tif'];
          const format = validationResult.error;
          if (format && convertFormats.includes(format)) {
            logger.info(`检测到 ${format.toUpperCase()} 格式，尝试下载转换: ${realImageUrl.substring(0, 50)}...`);
            try {
              const response = await fetch(realImageUrl);
              if (!response.ok) {
                throw new Error(`下载失败: ${response.status} ${response.statusText}`);
              }
              
              const imageBuffer = new Uint8Array(await response.arrayBuffer());
              
              // 检查图片大小
              if (imageBuffer.length === 0) {
                throw new Error("下载的图片数据为空");
              }
              
              logger.debug(`${format.toUpperCase()} 图片下载成功，大小: ${(imageBuffer.length / 1024).toFixed(2)}KB`);
              
              // 使用 sharp 转换图片格式
              // SVG 转换为 PNG，其他格式转换为 JPEG
              let processedImage: Uint8Array;
              try {
                if (format === 'svg') {
                  // SVG 转换为 PNG
                  processedImage = await this.convertSvgToPng(imageBuffer);
                } else {
                  // 其他格式转换为 JPEG
                  processedImage = await this.compressImage(imageBuffer);
                }
                logger.info(`${format.toUpperCase()} 转换成功，转换后大小: ${(processedImage.length / 1024).toFixed(2)}KB`);
              } catch (compressError) {
                // 如果转换失败，记录错误并跳过
                logger.error(`${format.toUpperCase()} 转换失败: ${compressError}`);
                processedContent = this.removeImage(processedContent, imageUrl);
                results.push({
                  originalUrl: imageUrl.substring(0, 100) + "...",
                  error: `${format.toUpperCase()} 转换失败: ${compressError instanceof Error ? compressError.message : String(compressError)}`,
                });
                continue;
              }
              
              // 验证转换后的图片格式
              if (!processedImage || processedImage.length === 0) {
                throw new Error("转换后的图片数据为空");
              }
              
              // 上传到微信
              const newUrl = await this.weixinPublisher.uploadContentImage(
                realImageUrl,
                processedImage,
              );
              
              results.push({
                originalUrl: imageUrl.substring(0, 100),
                newUrl,
              });
              
              processedContent = this.replaceImageUrl(
                processedContent,
                imageUrl,
                newUrl,
              );
              logger.info(`WebP 图片处理成功: ${newUrl.substring(0, 50)}...`);
              continue;
            } catch (convertError) {
              logger.error(`WebP 转换失败: ${convertError}`);
              processedContent = this.removeImage(processedContent, imageUrl);
              results.push({
                originalUrl: imageUrl.substring(0, 100) + "...",
                error: `WebP 转换失败: ${convertError instanceof Error ? convertError.message : String(convertError)}`,
              });
              continue;
            }
          }
          
          // 其他无效格式，直接移除
          results.push({
            originalUrl: imageUrl.substring(0, 100) + "...",
            error: validationResult.error,
          });
          processedContent = this.removeImage(processedContent, imageUrl);
          continue;
        }

        // 下载图片（使用解析后的真实 URL）
        const response = await fetch(realImageUrl);
        if (!response.ok) {
          throw new Error(`下载失败: ${response.status} ${response.statusText}`);
        }
        
        const imageBuffer = new Uint8Array(await response.arrayBuffer());
        if (imageBuffer.length === 0) {
          throw new Error("下载的图片数据为空");
        }

        let processedImage: Uint8Array;
        // 统一处理所有图片：无论大小，都进行压缩和格式标准化，确保所有图片都经过相同处理
        // 这样可以保证图片大小、格式、质量的一致性
        const imageSizeMB = imageBuffer.byteLength / 1024 / 1024;
        logger.info(
          `处理图片，原始大小: ${imageSizeMB.toFixed(2)}MB`,
        );
        
        try {
          // 对所有图片进行压缩处理（即使小于1MB也处理，确保格式统一和优化）
          processedImage = await this.compressImage(imageBuffer, 0.8);
          logger.info(
            `压缩后大小: ${(processedImage.length / 1024 / 1024).toFixed(2)}MB`,
          );
          
          // 验证压缩后的图片
          if (!processedImage || processedImage.length === 0) {
            throw new Error("压缩后的图片数据为空");
          }
        } catch (compressError) {
          logger.error(`图片压缩失败: ${compressError}`);
          // 压缩失败，如果原图小于限制，尝试直接上传
          if (imageBuffer.byteLength <= WeixinImageProcessor.MAX_IMAGE_SIZE * 2) {
            logger.warn("压缩失败，尝试直接上传原图");
            processedImage = imageBuffer;
          } else {
            throw compressError;
          }
        }

        // 验证图片格式（确保是有效的 JPEG/PNG）
        // 检查文件头：JPEG 以 FF D8 开头，PNG 以 89 50 4E 47 开头
        const isValidImage = 
          (processedImage[0] === 0xFF && processedImage[1] === 0xD8) || // JPEG
          (processedImage[0] === 0x89 && processedImage[1] === 0x50 && 
           processedImage[2] === 0x4E && processedImage[3] === 0x47); // PNG
        
        if (!isValidImage) {
          logger.warn(`图片格式可能无效，文件头: ${Array.from(processedImage.slice(0, 4)).map(b => b.toString(16).padStart(2, '0')).join(' ')}`);
          // 如果不是有效的 JPEG/PNG，尝试重新压缩
          try {
            processedImage = await this.compressImage(imageBuffer);
            logger.info("重新压缩后格式已修复");
          } catch {
            throw new Error("图片格式无效且无法修复");
          }
        }

        // 上传图片到微信
        const newUrl = await this.weixinPublisher.uploadContentImage(
          realImageUrl,
          processedImage,
        );

        results.push({
          originalUrl: imageUrl.substring(0, 100),
          newUrl,
        });

        processedContent = this.replaceImageUrl(
          processedContent,
          imageUrl,
          newUrl,
        );
      } catch (error) {
        logger.error(`处理图片失败: ${imageUrl.substring(0, 50)}...`, error);
        results.push({
          originalUrl: imageUrl.substring(0, 100) + "...",
          error: error instanceof Error ? error.message : "未知错误",
        });
        // 移除处理失败的图片
        processedContent = this.removeImage(processedContent, imageUrl);
      }
    }

    return {
      content: processedContent,
      results,
    };
  }

  /**
   * 处理 base64 图片
   */
  private async processBase64Image(base64Url: string): Promise<ImageProcessResult> {
    try {
      const parsed = this.parseBase64Image(base64Url);
      if (!parsed) {
        return {
          originalUrl: "base64 image",
          error: "无法解析 base64 图片",
        };
      }

      logger.info(`处理 base64 图片，原始大小: ${(parsed.buffer.byteLength / 1024).toFixed(2)}KB`);

      // 转换为 JPEG 并压缩
      let processedImage: Uint8Array;
      try {
        processedImage = await this.compressImage(parsed.buffer, 0.8);
        logger.info(`转换后大小: ${(processedImage.length / 1024).toFixed(2)}KB`);
      } catch {
        // 如果压缩失败，直接使用原始数据
        processedImage = parsed.buffer;
      }

      // 上传到微信
      const newUrl = await this.weixinPublisher.uploadContentImage(
        "generated_image.jpg",
        processedImage,
      );

      return {
        originalUrl: "base64 image",
        newUrl,
      };
    } catch (error) {
      return {
        originalUrl: "base64 image",
        error: error instanceof Error ? error.message : "处理失败",
      };
    }
  }

  /**
   * 从文章内容中提取所有图片URL（包括 base64）
   */
  private extractImageUrls(content: string): string[] {
    const urls = new Set<string>();
    
    // Markdown 图片
    const mdPattern = /!\[[^\]]*\]\(([^)]+)\)/g;
    let match;
    while ((match = mdPattern.exec(content)) !== null) {
      urls.add(match[1]);
    }

    // HTML img 标签
    const imgPattern = /<img[^>]+src=["']([^"']+)["'][^>]*>/g;
    while ((match = imgPattern.exec(content)) !== null) {
      urls.add(match[1]);
    }

    // 纯 URL（支持更多格式）
    const urlPattern = /(https?:\/\/[^\s<>"]+?\.(jpg|jpeg|png|gif|webp|svg|avif|bmp|tiff|tif))/gi;
    while ((match = urlPattern.exec(content)) !== null) {
      urls.add(match[1]);
    }

    return Array.from(urls);
  }

  /**
   * 判断是否为 base64 图片
   */
  private isBase64Image(url: string): boolean {
    return url.startsWith("data:image/");
  }

  /**
   * 从 base64 字符串解析图片数据
   */
  private parseBase64Image(base64Url: string): {
    mimeType: string;
    buffer: Uint8Array;
  } | null {
    try {
      const match = base64Url.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/);
      if (!match) return null;

      const mimeType = `image/${match[1]}`;
      const base64Data = match[2];

      // 解码 base64
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      return { mimeType, buffer: bytes };
    } catch (error) {
      logger.error("解析 base64 图片失败:", error);
      return null;
    }
  }

  /**
   * 验证图片URL是否有效
   */
  private async validateImage(url: string): Promise<ImageValidationResult> {
    try {
      // 跳过 base64 和微信 CDN 图片
      if (this.isBase64Image(url) || url.includes('mmbiz.qpic.cn')) {
        return { isValid: true };
      }

      const urlObj = new URL(url);
      const extension = urlObj.pathname.toLowerCase().split(".").pop();

      // 支持的图片格式
      const validExtensions = ["jpg", "jpeg", "png", "gif", "webp", "svg", "avif", "bmp", "tiff", "tif"];
      const hasValidExtension = extension && validExtensions.includes(extension);

      // 需要转换的格式（WebP、SVG、AVIF、BMP、TIFF）
      const convertFormats = ["webp", "svg", "avif", "bmp", "tiff", "tif"];
      if (hasValidExtension && convertFormats.includes(extension)) {
        return {
          isValid: false,
          error: extension, // 特殊标记，触发转换逻辑
        };
      }

      // HEAD 请求验证（设置超时避免卡住）
      // 对于没有扩展名的 URL（如 GitHub 图片），必须通过 Content-Type 判断
      try {
        const response = await fetch(url, { 
          method: "HEAD",
          signal: AbortSignal.timeout(5000),
        });
        const contentType = response.headers.get("content-type");

        if (!contentType || !contentType.startsWith("image/")) {
          return {
            isValid: false,
            error: `无效的 Content-Type: ${contentType}`,
          };
        }

        // 如果 Content-Type 是 WebP，标记需要转换
        if (contentType.includes("webp")) {
          return {
            isValid: false,
            error: `webp`, // 触发 WebP 转换逻辑
          };
        }

        // 如果有扩展名但不在支持列表中，且 Content-Type 也不是图片，拒绝
        if (!hasValidExtension && contentType && !WeixinImageProcessor.VALID_MIME_TYPES.includes(contentType)) {
          return {
            isValid: false,
            error: `不支持的图片格式: Content-Type=${contentType}, 扩展名=${extension}`,
          };
        }

        return {
          isValid: true,
          contentType,
        };
      } catch (fetchError) {
        // HEAD 请求失败，如果有有效扩展名，可以继续尝试（后续会下载）
        if (hasValidExtension) {
          logger.warn(`HEAD 请求失败，但扩展名有效，继续尝试: ${url.substring(0, 50)}...`);
          return { isValid: true };
        }
        throw fetchError;
      }
    } catch (error) {
      return {
        isValid: false,
        error: error instanceof Error ? error.message : "验证失败",
      };
    }
  }

  /**
   * 获取图片尺寸（下载并使用 sharp 检查）
   * @param url 图片 URL
   * @returns 图片尺寸信息，如果无法获取则返回 null
   */
  async getImageDimensions(url: string): Promise<ImageDimensions | null> {
    try {
      // 跳过 base64 和微信 CDN 图片的尺寸检查
      if (this.isBase64Image(url) || url.includes('mmbiz.qpic.cn')) {
        logger.debug(`跳过尺寸检查: ${url.substring(0, 50)}...`);
        return null;
      }

      logger.debug(`检查图片尺寸: ${url.substring(0, 80)}...`);

      // 下载图片
      const response = await fetch(url, {
        signal: AbortSignal.timeout(10000), // 10秒超时
      });
      
      if (!response.ok) {
        logger.warn(`下载图片失败 (${response.status}): ${url.substring(0, 50)}...`);
        return null;
      }

      const imageBuffer = new Uint8Array(await response.arrayBuffer());
      
      if (imageBuffer.length === 0) {
        logger.warn(`图片数据为空: ${url.substring(0, 50)}...`);
        return null;
      }

      // 使用 sharp 获取元数据
      const sharp = await getSharp();
      const metadata = await sharp(imageBuffer).metadata();

      if (!metadata.width || !metadata.height) {
        logger.warn(`无法获取图片尺寸: ${url.substring(0, 50)}...`);
        return null;
      }

      return {
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
      };
    } catch (error) {
      logger.warn(`获取图片尺寸失败: ${url.substring(0, 50)}... - ${error instanceof Error ? error.message : String(error)}`);
      return null;
    }
  }

  /**
   * 检查图片是否符合尺寸要求（高质量图片）
   * @param url 图片 URL
   * @returns true 表示符合要求（宽 > 300px 且 高 > 200px），false 表示不符合
   */
  async isHighQualityImage(url: string): Promise<boolean> {
    const dimensions = await this.getImageDimensions(url);
    
    if (!dimensions) {
      // 如果无法获取尺寸，默认保留（可能是微信 CDN 或 base64）
      return true;
    }

    const isQualified = dimensions.width >= WeixinImageProcessor.MIN_WIDTH && 
                        dimensions.height >= WeixinImageProcessor.MIN_HEIGHT;
    
    if (!isQualified) {
      logger.info(
        `图片尺寸不符合要求 (${dimensions.width}x${dimensions.height}): ${url.substring(0, 50)}...`
      );
    }

    return isQualified;
  }

  /**
   * 替换文章中的图片URL
   */
  private replaceImageUrl(
    content: string,
    oldUrl: string,
    newUrl: string,
  ): string {
    const escapedOldUrl = this.escapeRegExp(oldUrl);
    return content
      .replace(
        new RegExp(`!\\[([^\\]]*)\\]\\(${escapedOldUrl}\\)`, "g"),
        `![$1](${newUrl})`,
      )
      .replace(
        new RegExp(`<img([^>]*)src=["']${escapedOldUrl}["']([^>]*)>`, "g"),
        `<img$1src="${newUrl}"$2>`,
      )
      .replace(new RegExp(escapedOldUrl, "g"), newUrl);
  }

  /**
   * 移除文章中的图片
   */
  private removeImage(content: string, imageUrl: string): string {
    const escapedUrl = this.escapeRegExp(imageUrl);
    return content
      .replace(new RegExp(`!\\[[^\\]]*\\]\\(${escapedUrl}\\)`, "g"), "")
      .replace(new RegExp(`<img[^>]*src=["']${escapedUrl}["'][^>]*>`, "g"), "");
  }

  /**
   * 转义正则表达式特殊字符
   */
  private escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
}
