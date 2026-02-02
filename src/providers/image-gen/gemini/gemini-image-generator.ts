import { BaseImageGenerator } from "@src/providers/image-gen/base.image-generator.ts";
import { Logger } from "@zilla/logger";

const logger = new Logger("gemini-image");

/**
 * Gemini 图片生成选项
 */
export interface GeminiImageOptions {
  /** 生成提示词 */
  prompt: string;
  /** 宽高比: 1:1, 9:16, 16:9, 3:4, 4:3, 2.35:1 */
  aspectRatio?: "1:1" | "9:16" | "16:9" | "3:4" | "4:3" | "2.35:1";
  /** 图片尺寸: 1K, 2K */
  imageSize?: "1K" | "2K";
  /** 是否启用 Google 搜索增强 */
  enableSearch?: boolean;
}

/**
 * Gemini 3 Pro 图片生成器
 * 
 * 使用 gemini-3-pro-image-preview 模型生成高质量图片
 * API 文档: https://ai.google.dev/gemini-api/docs/image-generation
 * 
 * 支持功能：
 * - 文本到图片生成
 * - Google 搜索增强
 * - 自定义宽高比和图片尺寸
 */
export class GeminiImageGenerator extends BaseImageGenerator {
  private apiKey!: string;
  private baseURL!: string;

  // Gemini 3 Pro 图片生成模型
  private static readonly IMAGE_MODEL = "gemini-3-pro-image-preview";

  /**
   * 刷新配置
   */
  async refresh(): Promise<void> {
    // 检查是否启用中转模式
    const apiSourceType = await this.configManager.get<string>("API_SOURCE_TYPE");
    const isProxy = apiSourceType === "proxy";

    if (isProxy) {
      // 【中转模式】使用 PROXY_ 配置
      let proxyBaseUrl = (await this.configManager.get<string>("PROXY_BASE_URL")) || 
                         "https://api.jacklihome.com";
      
      // 确保包含 /v1beta 路径（Gemini 原生协议需要）
      if (!proxyBaseUrl.includes('/v1beta')) {
        proxyBaseUrl = proxyBaseUrl.replace(/\/$/, '') + '/v1beta';
      }
      
      this.baseURL = proxyBaseUrl;
      this.apiKey = await this.configManager.get<string>("PROXY_API_KEY") || "";
      logger.info(`[GeminiImage] 🔄 中转模式: 使用 ${this.baseURL}`);
    } else {
      // 【官方模式】使用 GEMINI_ 配置
      this.apiKey = await this.configManager.get<string>("GEMINI_API_KEY") || "";
      this.baseURL = await this.configManager.get<string>("GEMINI_BASE_URL") ||
        "https://generativelanguage.googleapis.com/v1beta";
    }

    if (!this.apiKey) {
      throw new Error("Gemini API Key 未设置，请在配置中心设置");
    }
  }

  /**
   * 生成图片
   * @param options 生成选项
   * @returns 图片 URL 或 base64 数据
   */
  async generate(options: GeminiImageOptions): Promise<string> {
    await this.refresh();

    const model = GeminiImageGenerator.IMAGE_MODEL;
    logger.info(`使用 Gemini 3 Pro 图片模型: ${model}`);

    const endpoint = `${this.baseURL}/models/${model}:generateContent`;

    // 构建请求体 - 根据 Gemini 3 Pro Image API 文档
    // curl -s -X POST \
    //   "https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent" \
    //   -H "x-goog-api-key: $GEMINI_API_KEY" \
    //   -H "Content-Type: application/json" \
    //   -d '{
    //     "contents": [{"parts": [{"text": "prompt"}]}],
    //     "tools": [{"google_search": {}}],
    //     "generationConfig": {
    //       "responseModalities": ["TEXT", "IMAGE"],
    //       "imageConfig": {"aspectRatio": "1:1", "imageSize": "1K"}
    //     }
    //   }'
    const requestBody: Record<string, unknown> = {
      contents: [
        {
          parts: [
            {
              text: options.prompt,
            },
          ],
        },
      ],
      generationConfig: {
        responseModalities: ["TEXT", "IMAGE"],
        imageConfig: {
          aspectRatio: options.aspectRatio || "16:9",
          imageSize: options.imageSize || "1K",
        },
      },
    };

    // 可选：启用 Google 搜索增强
    if (options.enableSearch) {
      requestBody.tools = [{ google_search: {} }];
    }

    try {
      logger.debug("发送图片生成请求:", {
        model,
        endpoint,
        aspectRatio: options.aspectRatio || "16:9",
        imageSize: options.imageSize || "1K",
        enableSearch: options.enableSearch || false,
        prompt: options.prompt.substring(0, 100) + "...",
      });

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": this.apiKey,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error(`Gemini API 返回错误: ${response.status}`, errorText);
        throw new Error(`Gemini API 错误: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      logger.debug("Gemini API 响应:", JSON.stringify(result).substring(0, 500));

      // 提取图片数据
      const candidates = result.candidates;
      if (!candidates || candidates.length === 0) {
        logger.error("Gemini API 返回空 candidates:", result);
        throw new Error("Gemini API 没有返回有效的响应");
      }

      const parts = candidates[0].content?.parts;
      if (!parts) {
        logger.error("响应中没有 parts:", candidates[0]);
        throw new Error("响应中没有 parts 数据");
      }

      // 查找图片部分
      for (const part of parts) {
        if (part.inlineData?.mimeType?.startsWith("image/")) {
          const base64Data = part.inlineData.data;
          const mimeType = part.inlineData.mimeType;

          // 返回 data URL 格式
          const dataUrl = `data:${mimeType};base64,${base64Data}`;
          logger.info(`图片生成成功, 类型: ${mimeType}, 数据长度: ${base64Data.length}`);
          return dataUrl;
        }
      }

      // 如果没有找到图片，检查是否有文本响应（可能是错误或模型返回了说明）
      for (const part of parts) {
        if (part.text) {
          logger.warn("Gemini 返回了文本而非图片:", part.text);
        }
      }

      throw new Error("响应中没有找到图片数据");
    } catch (error) {
      logger.error("Gemini 图片生成失败:", error);
      throw error;
    }
  }

  /**
   * 生成文章封面图片
   * @param options 封面选项
   * @returns 图片 data URL
   */
  async generatePoster(options: {
    title: string;
    sub_title?: string;
    prompt_text_zh?: string;
    aspectRatio?: "1:1" | "9:16" | "16:9" | "3:4" | "4:3" | "2.35:1";
  }): Promise<string> {
    // 使用传入的自定义 prompt，如果没有则使用默认逻辑
    const customPrompt = options.prompt_text_zh;
    
    // 构建专业信息图封面提示词
    const prompt = customPrompt || `Create a professional infographic-style cover image:

主题: ${options.title}
${options.sub_title ? `副标题: ${options.sub_title}` : ""}

设计要求:
- 信息图表风格，逻辑严谨，结构清晰
- 左侧区域：显示标题文字"${options.title}"，使用大号、醒目的字体
- 右侧区域：展示相关的使用实例、应用场景或关键信息点
- 生成的内容要集中在图片的中间部份，不要离边缘太近
- 使用扁平化或等距设计风格，不要过于复杂
- 配色专业现代（蓝色、紫色、青色系为主）
- 避免抽象装饰，专注于信息传达
- 16:9 横向构图，适合作为文章封面
- 整体风格：简洁、专业、信息丰富`;

    // 如果指定了 aspectRatio，使用指定的；否则默认 16:9
    // 注意：2.35:1 不在 Gemini 支持列表中，会回退到 16:9，但在 prompt 中说明比例要求
    const finalAspectRatio = options.aspectRatio || "16:9";
    const adjustedPrompt = finalAspectRatio === "2.35:1" 
      ? prompt + "\n\n重要：图片宽高比必须是 2.35:1（非常宽的比例，类似电影屏幕）"
      : prompt;
    
    return this.generate({
      prompt: adjustedPrompt,
      aspectRatio: finalAspectRatio === "2.35:1" ? "16:9" : finalAspectRatio, // Gemini 不支持 2.35:1，使用最接近的 16:9
      imageSize: "1K",
      enableSearch: false, // 封面图不需要搜索增强
    });
  }

  /**
   * 根据文章内容生成配图
   * @param content 文章段落内容
   * @param context 上下文描述
   * @returns 图片 data URL
   */
  async generateArticleImage(content: string, context?: string): Promise<string> {
    const prompt = `Create a logical, well-structured infographic illustration for a tech article:

内容概述: ${content.substring(0, 300)}
${context ? `上下文: ${context}` : ""}

设计要求:
- 信息图表风格，逻辑严谨，内部结构清晰但不复杂
- 根据文字内容生成对应的信息图，展示关键概念、流程或关系
- 使用扁平化设计或等距风格
- 配色专业、现代（蓝色、紫色、青色系）
- 不要包含任何文字或标签
- 专注于视觉化表达文章内容的核心信息
- 1:1 方形构图

Note: Create a clean, professional infographic that visually represents the key concepts from the text content. The design should be logical and well-structured, but not overly complex.`;

    return this.generate({
      prompt,
      aspectRatio: "4:3",
      imageSize: "1K",
      enableSearch: true, // 配图可以使用搜索增强获取更准确的视觉参考
    });
  }

  /**
   * 生成整体介绍图（用于文章合集开头）
   * @param articleTitles 文章标题数组
   * @returns 图片 data URL
   */
  async generateOverviewImage(articleTitles: string[]): Promise<string> {
    // 格式化标题列表
    const allTitles = articleTitles.map((title, index) => {
      return `${index + 1}. ${title}`;
    }).join("\n");

    const articleCount = articleTitles.length;

    // 构建整体介绍图的提示词
    const overviewPrompt = `生成一张专业的科技新闻概览信息图表，用于介绍以下${articleCount}篇AI科技新闻：

文章标题列表：
${allTitles}

设计要求：
1. **整体布局**：采用现代化的信息图表风格，将所有标题以清晰、有序的方式展示
2. **视觉层次**：使用卡片式布局或网格布局，每个标题占据一个独立区域，层次分明
3. **配色方案**：使用专业现代的配色（蓝色、紫色、青色系为主），营造科技感
4. **文字排版**：
   - 标题使用醒目的字体，易于阅读
   - 使用数字编号（1、2、3...）清晰标识每篇文章
   - 文字大小适中，确保在1K分辨率下清晰可见
5. **设计元素**：
   - 使用简洁的图标或装饰元素增强视觉效果
   - 添加渐变背景或纹理，但不要过于复杂
   - 使用连接线或分隔线组织内容，保持整体统一性
6. **信息传达**：
   - 整体呈现科技新闻的专业性和前沿性
   - 传达AI技术领域的多样性和创新性
   - 保持信息图表的信息密度，既丰富又不过于拥挤
7. **技术规格**：
   - 1K分辨率（1024x576），16:9横向构图
   - 所有文字和元素都要集中在画面中间区域，避免靠近边缘
   - 确保整体设计适合作为文章合集介绍图使用

请生成一张高质量的信息图表，能够清晰地展示所有文章标题，同时保持视觉美观和专业性。`;

    logger.info(`[整体介绍图] 生成整体介绍图，包含 ${articleCount} 篇文章标题`);
    logger.debug(`[整体介绍图] 标题列表:\n${allTitles}`);

    return this.generate({
      prompt: overviewPrompt,
      aspectRatio: "16:9",
      imageSize: "1K", // 1K分辨率（降低内容大小，避免超出微信限制）
      enableSearch: false, // 不需要搜索增强
    });
  }
}
