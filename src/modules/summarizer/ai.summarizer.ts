import {
  ContentSummarizer,
  Summary,
} from "@src/modules/interfaces/summarizer.interface.ts";
import {
  getSummarizerSystemPrompt,
  getSummarizerUserPrompt,
  getTitleSystemPrompt,
  getTitleUserPrompt,
  getGitHubProjectSystemPrompt,
  getGitHubProjectUserPrompt,
  getFooterSystemPrompt,
  getFooterUserPrompt,
  getAINewsSiteSystemPrompt,
  getAINewsSiteUserPrompt,
  getArticleExtractionSystemPrompt,
  getArticleExtractionUserPrompt,
  getLinkExtractionSystemPrompt,
  getLinkExtractionUserPrompt,
  getSingleUrlRepostSystemPrompt,
  getSingleUrlRepostUserPrompt,
  getSingleUrlLightExtractionSystemPrompt,
  getSingleUrlLightExtractionUserPrompt,
  FooterPromptParams,
} from "@src/prompts/summarizer.prompt.ts";
import {
  getArticleWriterSystemPrompt,
  getArticleWriterUserPrompt,
  ArticleWriterParams,
} from "@src/prompts/article-writer.prompt.ts";
import { LLMFactory } from "@src/providers/llm/llm-factory.ts";
import { ConfigManager } from "@src/utils/config/config-manager.ts";
import { RetryUtil } from "@src/utils/retry.util.ts";
import { parseJsonFromLLM } from "@src/utils/json-utils.ts";
import { Logger } from "@zilla/logger";

enum SummarizarSetting {
  AI_SUMMARIZER_LLM_PROVIDER = "AI_SUMMARIZER_LLM_PROVIDER",
  /** 文章最小字数 */
  ARTICLE_MIN_LENGTH = "ARTICLE_MIN_LENGTH",
  /** 文章最大字数 */
  ARTICLE_MAX_LENGTH = "ARTICLE_MAX_LENGTH",
  /** SINGLE_URL 转载模式使用的 LLM 提供者，默认 GEMINI */
  SINGLE_URL_LLM_PROVIDER = "SINGLE_URL_LLM_PROVIDER",
  /** SINGLE_URL 转载模式使用的轻量模型，默认 gemini-2.0-flash-exp */
  SINGLE_URL_LLM_MODEL = "SINGLE_URL_LLM_MODEL",
}

const logger = new Logger("ai-summarizer");

/**
 * 扩展的摘要结果，包含更多字段
 */
export interface ExtendedSummary extends Summary {
  subtitle?: string;
  summary?: string;
  readTime?: number;
}

/**
 * GitHub 项目信息
 */
export interface GitHubProjectInfo {
  name: string;
  url: string;
  stars?: number;
  readme: string;
}

export class AISummarizer implements ContentSummarizer {
  private llmFactory: LLMFactory;
  private configInstance: ConfigManager;

  constructor() {
    this.llmFactory = LLMFactory.getInstance();
    this.configInstance = ConfigManager.getInstance();
    this.configInstance.get(SummarizarSetting.AI_SUMMARIZER_LLM_PROVIDER).then(
      (provider) => {
        logger.info(`Summarizer当前使用的LLM模型: ${provider}`);
      },
    );
  }

  /**
   * 生成深度文章摘要
   * 默认生成 1500-3000 字的长文章
   */
  async summarize(
    content: string,
    options?: Record<string, any>,
  ): Promise<ExtendedSummary> {
    if (!content) {
      throw new Error("Content is required for summarization");
    }

    // 从配置获取默认字数限制（.env 的 ARTICLE_MIN_LENGTH / ARTICLE_MAX_LENGTH，未设置时 2000-3000 字）
    const rawMin = await this.configInstance.get(SummarizarSetting.ARTICLE_MIN_LENGTH);
    const rawMax = await this.configInstance.get(SummarizarSetting.ARTICLE_MAX_LENGTH);
    const defaultMinLength = (typeof rawMin === "number" ? rawMin : Number(rawMin)) || 2000;
    const defaultMaxLength = (typeof rawMax === "number" ? rawMax : Number(rawMax)) || 3000;

    return RetryUtil.retryOperation(async () => {
      const llm = await this.llmFactory.getLLMProvider(
        await this.configInstance.get(
          SummarizarSetting.AI_SUMMARIZER_LLM_PROVIDER,
        ),
      );
      
      const response = await llm.createChatCompletion([
        {
          role: "system",
          content: getSummarizerSystemPrompt(),
        },
        {
          role: "user",
          content: getSummarizerUserPrompt({
            content,
            language: options?.language || "中文",
            minLength: options?.minLength || defaultMinLength,
            maxLength: options?.maxLength || defaultMaxLength,
          }),
        },
      ], {
        temperature: 0.7,
        max_tokens: 8192, // 增加到 8192 以支持更长的文章输出
        response_format: { type: "json_object" },
        thinkingLevel: "MEDIUM",
      });

      const completion = response.choices[0]?.message?.content;
      if (!completion) {
        throw new Error("未获取到有效的摘要结果");
      }

      try {
        const summary = parseJsonFromLLM<ExtendedSummary>(completion);
        if (!summary.title || !summary.content) {
          throw new Error("摘要结果格式不正确");
        }
        
        // 计算预估阅读时间（如果没有返回）
        if (!summary.readTime) {
          summary.readTime = Math.ceil(summary.content.length / 500); // 假设每分钟阅读 500 字
        }
        
        logger.info(`文章生成成功: ${summary.title}, 字数: ${summary.content.length}, 预计阅读: ${summary.readTime}分钟`);
        return summary;
      } catch (error) {
        throw new Error(
          `解析摘要结果失败: ${
            error instanceof Error ? error.message : "未知错误"
          }`,
        );
      }
    });
  }

  /**
   * 使用 ArticleWriter 提示词生成更专业的文章
   */
  async writeArticle(params: ArticleWriterParams): Promise<ExtendedSummary> {
    if (!params.content) {
      throw new Error("Content is required for article writing");
    }

    return RetryUtil.retryOperation(async () => {
      const llm = await this.llmFactory.getLLMProvider(
        await this.configInstance.get(
          SummarizarSetting.AI_SUMMARIZER_LLM_PROVIDER,
        ),
      );
      
      const response = await llm.createChatCompletion([
        {
          role: "system",
          content: getArticleWriterSystemPrompt(),
        },
        {
          role: "user",
          content: getArticleWriterUserPrompt(params),
        },
      ], {
        temperature: 0.7,
        max_tokens: 8192,
        response_format: { type: "json_object" },
        thinkingLevel: "none",
      });

      const completion = response.choices[0]?.message?.content;
      if (!completion) {
        throw new Error("未获取到有效的文章内容");
      }

      try {
        const article = parseJsonFromLLM<ExtendedSummary>(completion);
        if (!article.title || !article.content) {
          throw new Error("文章格式不正确");
        }
        
        logger.info(`专业文章生成成功: ${article.title}, 字数: ${article.content.length}`);
        return article;
      } catch (error) {
        throw new Error(
          `解析文章结果失败: ${
            error instanceof Error ? error.message : "未知错误"
          }`,
        );
      }
    });
  }

  /**
   * 生成 GitHub 项目介绍文章
   * 字数受 .env 的 ARTICLE_MIN_LENGTH / ARTICLE_MAX_LENGTH 控制
   */
  async summarizeGitHubProject(project: GitHubProjectInfo): Promise<ExtendedSummary> {
    return RetryUtil.retryOperation(async () => {
      const rawMin = await this.configInstance.get(SummarizarSetting.ARTICLE_MIN_LENGTH);
      const rawMax = await this.configInstance.get(SummarizarSetting.ARTICLE_MAX_LENGTH);
      const minLength = (typeof rawMin === "number" ? rawMin : Number(rawMin)) || 800;
      const maxLength = (typeof rawMax === "number" ? rawMax : Number(rawMax)) || 1200;

      const llm = await this.llmFactory.getLLMProvider(
        await this.configInstance.get(
          SummarizarSetting.AI_SUMMARIZER_LLM_PROVIDER,
        ),
      );
      
      const response = await llm.createChatCompletion([
        {
          role: "system",
          content: getGitHubProjectSystemPrompt(),
        },
        {
          role: "user",
          content: getGitHubProjectUserPrompt({ ...project, minLength, maxLength }),
        },
      ], {
        temperature: 0.7,
        max_tokens: 8192, // 增加 token 数以支持更长的内容
        response_format: { type: "json_object" },
        thinkingLevel: "MEDIUM",
      });

      const completion = response.choices[0]?.message?.content;
      if (!completion) {
        throw new Error("未获取到有效的项目介绍");
      }

      try {
        const summary = parseJsonFromLLM<ExtendedSummary>(completion);
        if (!summary.title || !summary.content) {
          throw new Error("项目介绍格式不正确");
        }
        
        logger.info(`GitHub 项目介绍生成成功: ${summary.title}`);
        return summary;
      } catch (error) {
        throw new Error(
          `解析项目介绍失败: ${
            error instanceof Error ? error.message : "未知错误"
          }`,
        );
      }
    });
  }

  /**
   * SINGLE_URL 转载模式：仅翻译 + 精辟扩充 + 作者提取 + 标题提取与翻译
   * 固定使用轻量模型（Gemini Flash），可配置 SINGLE_URL_LLM_PROVIDER、SINGLE_URL_LLM_MODEL
   */
  async translateAndLightExpandForRepost(content: string): Promise<{ 
    author: string; 
    content: string;
    originalTitle: string;
    translatedTitle: string;
  }> {
    const provider = (await this.configInstance.get(SummarizarSetting.SINGLE_URL_LLM_PROVIDER)) || "GEMINI";
    const model = (await this.configInstance.get(SummarizarSetting.SINGLE_URL_LLM_MODEL)) || "gemini-2.0-flash-exp";

    // 获取最大字数限制
    const maxLen = Number(await this.configInstance.get("ARTICLE_MAX_LENGTH")) || 2000;

    return RetryUtil.retryOperation(async () => {
      // 使用 "PROVIDER:MODEL" 格式传递完整配置
      const llm = await this.llmFactory.getLLMProvider(`${provider}:${model}`);
      
      // 动态计算 max_tokens：输入内容越长，需要的输出 tokens 越多
      // 估算：中文翻译后长度约为英文的 1.2-1.5 倍（考虑 JSON 格式开销）
      // 使用 4 倍输入 tokens，最大 100k，确保超长文章也能完整翻译
      const estimatedInputTokens = Math.ceil(content.length / 3);
      const safeMaxTokens = Math.max(32768, Math.min(estimatedInputTokens * 4, 100000));
      
      logger.info(`[SINGLE_URL 翻译] 输入长度: ${content.length} 字符, 预估 tokens: ${estimatedInputTokens}, 设置 max_tokens: ${safeMaxTokens}`);
      
      const response = await llm.createChatCompletion(
        [
          { role: "system", content: getSingleUrlRepostSystemPrompt() },
          { role: "user", content: getSingleUrlRepostUserPrompt(content, maxLen) },
        ],
        {
          model,
          temperature: 0.3,
          max_tokens: safeMaxTokens,
          response_format: { type: "json_object" },
          thinkingLevel: "none",
        },
      );

      const completion = response.choices[0]?.message?.content;
      const finishReason = response.choices[0]?.finish_reason;
      
      if (!completion) throw new Error("SINGLE_URL 转载：未获取到有效结果");
      
      // 检查是否被截断
      if (finishReason === "length" || finishReason === "max_tokens") {
        logger.warn(`[SINGLE_URL 翻译] ⚠️ LLM 输出被截断 (finishReason: ${finishReason})，尝试解析部分结果...`);
      }

      const parsed = parseJsonFromLLM<{ 
        author?: string; 
        content?: string;
        originalTitle?: string;
        translatedTitle?: string;
      }>(completion);
      
      const author = (parsed.author && String(parsed.author).trim()) || "";
      const text = parsed.content && String(parsed.content).trim();
      const originalTitle = (parsed.originalTitle && String(parsed.originalTitle).trim()) || "";
      const translatedTitle = (parsed.translatedTitle && String(parsed.translatedTitle).trim()) || "";
      
      if (!text) throw new Error("SINGLE_URL 转载：content 为空");
      if (!translatedTitle) {
        logger.warn("SINGLE_URL 转载：未获取到翻译后的标题，使用原文标题");
      }

      logger.info(`SINGLE_URL 转载处理完成, author: ${author || "未识别"}, 原文标题: ${originalTitle}, 翻译标题: ${translatedTitle}, 翻译后长度: ${text.length} 字符`);
      return { author, content: text, originalTitle, translatedTitle };
    });
  }

  /**
   * 生成文章标题
   */
  async generateTitle(
    content: string,
    options?: Record<string, any>,
  ): Promise<string> {
    return RetryUtil.retryOperation(async () => {
      const llm = await this.llmFactory.getLLMProvider(
        await this.configInstance.get(
          SummarizarSetting.AI_SUMMARIZER_LLM_PROVIDER,
        ),
      );
      const response = await llm.createChatCompletion([
        {
          role: "system",
          content: getTitleSystemPrompt(),
        },
        {
          role: "user",
          content: getTitleUserPrompt({
            content,
            language: options?.language,
          }),
        },
      ], {
        temperature: 0.7,
        max_tokens: 500,
        thinkingLevel: "none",
      });

      const title = response.choices[0]?.message?.content;
      if (!title || title.trim() === "") {
        logger.warn("标题生成返回空内容，原始响应:", JSON.stringify(response).substring(0, 300));
        throw new Error("未获取到有效的标题");
      }
      // 清理标题中可能的引号和多余空白
      return title.trim().replace(/^["']|["']$/g, "");
    });
  }

  /**
   * 生成文章结语
   */
  async generateFooter(params: FooterPromptParams): Promise<string> {
    return RetryUtil.retryOperation(async () => {
      const llm = await this.llmFactory.getLLMProvider(
        await this.configInstance.get(
          SummarizarSetting.AI_SUMMARIZER_LLM_PROVIDER,
        ),
      );
      
      const response = await llm.createChatCompletion([
        {
          role: "system",
          content: getFooterSystemPrompt(),
        },
        {
          role: "user",
          content: getFooterUserPrompt(params),
        },
      ], {
        temperature: 0.8,
        max_tokens: 1000,
        thinkingLevel: "none",
      });

      const footer = response.choices[0]?.message?.content;
      if (!footer || footer.trim() === "") {
        logger.warn("结语生成返回空内容，使用默认结语");
        return this.getDefaultFooter(params.footerImageUrl);
      }
      
      // 清理可能的代码块标记
      let cleanedFooter = footer.trim();
      if (cleanedFooter.startsWith("```markdown")) {
        cleanedFooter = cleanedFooter.replace(/^```markdown\n?/, "").replace(/\n?```$/, "");
      } else if (cleanedFooter.startsWith("```")) {
        cleanedFooter = cleanedFooter.replace(/^```\n?/, "").replace(/\n?```$/, "");
      }
      
      logger.info(`结语生成成功，长度: ${cleanedFooter.length} 字符`);
      return cleanedFooter.trim();
    });
  }

  /**
   * 默认结语（当 LLM 生成失败时使用）
   */
  private getDefaultFooter(imageUrl?: string): string {
    const defaultImageUrl = imageUrl || "https://fastly.jsdelivr.net/gh/bucketio/img18@main/2026/01/06/1767672738369-47fc1fed-2c8b-49d2-ae30-f8a45edc41bb.png";
    
    return `## 结语

感谢阅读今日的 AI 速递！我们持续关注人工智能领域的最新动态，为您带来最前沿的技术资讯。

💬 你用过哪些 AI 工具？欢迎评论区分享你的体验！
⭐ 觉得有用？点个「在看」让更多开发者看到这篇内容！

<center>
    <img src="${defaultImageUrl}" style="width: 100px;">
</center>`;
  }

  /**
   * 生成文章引入内容
   */
  async generateIntroduction(params: {
    articleTitles: string[];
    articleCount: number;
    contentMode?: "TECH_NEWS" | "GITHUB_TRENDING";
  }): Promise<string> {
    return RetryUtil.retryOperation(async () => {
      const llm = await this.llmFactory.getLLMProvider(
        await this.configInstance.get(
          SummarizarSetting.AI_SUMMARIZER_LLM_PROVIDER,
        ),
      );
      
      const { getIntroductionSystemPrompt, getIntroductionUserPrompt } = await import("@src/prompts/summarizer.prompt.ts");
      
      const response = await llm.createChatCompletion([
        {
          role: "system",
          content: getIntroductionSystemPrompt(),
        },
        {
          role: "user",
          content: getIntroductionUserPrompt({
            articleTitles: params.articleTitles,
            articleCount: params.articleCount,
            contentMode: params.contentMode,
          }),
        },
      ], {
        temperature: 0.8,
        max_tokens: 500,
        thinkingLevel: "none",
      });

      const introduction = response.choices[0]?.message?.content;
      if (!introduction || introduction.trim() === "") {
        logger.warn("引入内容生成返回空内容，使用默认引入");
        return this.getDefaultIntroduction(params.articleTitles);
      }
      
      // 清理可能的代码块标记
      let cleanedIntroduction = introduction.trim();
      if (cleanedIntroduction.startsWith("```markdown")) {
        cleanedIntroduction = cleanedIntroduction.replace(/^```markdown\n?/, "").replace(/\n?```$/, "");
      } else if (cleanedIntroduction.startsWith("```")) {
        cleanedIntroduction = cleanedIntroduction.replace(/^```\n?/, "").replace(/\n?```$/, "");
      }
      
      logger.info(`引入内容生成成功 (${params.contentMode || "TECH_NEWS"} 模式)，长度: ${cleanedIntroduction.length} 字符`);
      return cleanedIntroduction.trim();
    });
  }

  /**
   * 默认引入内容（当 LLM 生成失败时使用）
   */
  private getDefaultIntroduction(articleTitles: string[]): string {
    const titlesPreview = articleTitles.slice(0, 3).join("、");
    return `今天为大家带来${articleTitles.length}篇精选AI科技新闻，涵盖${titlesPreview}等前沿话题。让我们一起探索人工智能领域的最新动态和技术突破。`;
  }

  /**
   * AI 新闻网站翻译与摘要
   * 字数受 .env 的 ARTICLE_MIN_LENGTH / ARTICLE_MAX_LENGTH 控制，未设置时约 500-700 字
   */
  async summarizeAINewsSite(
    content: string,
    options?: Record<string, any>,
  ): Promise<ExtendedSummary> {
    if (!content) {
      throw new Error("Content is required for AI news site summarization");
    }

    const rawMin = await this.configInstance.get(SummarizarSetting.ARTICLE_MIN_LENGTH);
    const rawMax = await this.configInstance.get(SummarizarSetting.ARTICLE_MAX_LENGTH);
    const minLength = (typeof rawMin === "number" ? rawMin : Number(rawMin)) || 500;
    const maxLength = (typeof rawMax === "number" ? rawMax : Number(rawMax)) || 700;

    return RetryUtil.retryOperation(async () => {
      const llm = await this.llmFactory.getLLMProvider(
        await this.configInstance.get(
          SummarizarSetting.AI_SUMMARIZER_LLM_PROVIDER,
        ),
      );
      
      const response = await llm.createChatCompletion([
        {
          role: "system",
          content: getAINewsSiteSystemPrompt(),
        },
        {
          role: "user",
          content: getAINewsSiteUserPrompt({
            content,
            language: options?.language || "中文",
            minLength,
            maxLength,
          }),
        },
      ], {
        temperature: 0.7,
        max_tokens: 4096, // 600字左右的文章约需要2000-3000 tokens
        response_format: { type: "json_object" },
        thinkingLevel: "MEDIUM",
      });

      const completion = response.choices[0]?.message?.content;
      if (!completion) {
        throw new Error("未获取到有效的翻译与摘要结果");
      }

      try {
        const summary = parseJsonFromLLM<ExtendedSummary>(completion);
        if (!summary.title || !summary.content) {
          throw new Error("翻译与摘要结果格式不正确");
        }
        
        // 计算预估阅读时间
        if (!summary.readTime) {
          summary.readTime = Math.ceil(summary.content.length / 500);
        }
        
        logger.info(`AI新闻网站文章生成成功: ${summary.title}, 字数: ${summary.content.length}, 预计阅读: ${summary.readTime}分钟`);
        return summary;
      } catch (error) {
        throw new Error(
          `解析翻译与摘要结果失败: ${
            error instanceof Error ? error.message : "未知错误"
          }`,
        );
      }
    });
  }

  /**
   * 从网页内容中提取新闻链接
   */
  async extractLinks(
    content: string,
    baseUrl: string,
  ): Promise<{ title: string; url: string }[]> {
    if (!content) {
      return [];
    }

    return RetryUtil.retryOperation(async () => {
      const llm = await this.llmFactory.getLLMProvider(
        await this.configInstance.get(
          SummarizarSetting.AI_SUMMARIZER_LLM_PROVIDER,
        ),
      );
      
      const response = await llm.createChatCompletion([
        {
          role: "system",
          content: getLinkExtractionSystemPrompt(),
        },
        {
          role: "user",
          content: getLinkExtractionUserPrompt(content, baseUrl),
        },
      ], {
        temperature: 0.1,
        max_tokens: 4096,
        response_format: { type: "json_object" },
        thinkingLevel: "none",
      });

      const completion = response.choices[0]?.message?.content;
      if (!completion) {
        throw new Error("未获取到有效的链接提取结果");
      }

      try {
        const result = parseJsonFromLLM<{ links: { title: string; url: string }[] }>(completion);
        return result.links || [];
      } catch (error) {
        throw new Error(
          `解析链接提取结果失败: ${
            error instanceof Error ? error.message : "未知错误"
          }`,
        );
      }
    });
  }

  /**
   * AI 新闻网站内容与图片提取
   */
  async extractArticleContent(
    content: string,
  ): Promise<{ mainContent: string; imageUrls: string[] }> {
    if (!content) {
      throw new Error("Content is required for extraction");
    }

    return RetryUtil.retryOperation(async () => {
      const llm = await this.llmFactory.getLLMProvider(
        await this.configInstance.get(
          SummarizarSetting.AI_SUMMARIZER_LLM_PROVIDER,
        ),
      );
      
      // 动态计算 max_tokens：根据输入长度，确保输出有足够空间
      // 输入 token 数约为字符数的 1/4（英文）到 1/2（中文）
      const estimatedInputTokens = Math.ceil(content.length / 3);
      const safeMaxTokens = Math.max(8192, Math.min(estimatedInputTokens * 1.2, 16384));
      
      const response = await llm.createChatCompletion([
        {
          role: "system",
          content: getArticleExtractionSystemPrompt(),
        },
        {
          role: "user",
          content: getArticleExtractionUserPrompt(content),
        },
      ], {
        temperature: 0.3, // 提取任务使用低温度以保证稳定性
        max_tokens: safeMaxTokens,
        response_format: { type: "json_object" },
        thinkingLevel: "none",
      });

      const completion = response.choices[0]?.message?.content;
      if (!completion) throw new Error("未获取到提取结果");

      const parsed = parseJsonFromLLM<{ mainContent?: string; imageUrls?: string[] }>(completion);
      const mainContent = parsed.mainContent && String(parsed.mainContent).trim();
      if (!mainContent) throw new Error("提取的正文为空");

      logger.info(`内容提取完成，正文长度: ${mainContent.length}, 图片数: ${parsed.imageUrls?.length || 0}`);
      return { mainContent, imageUrls: parsed.imageUrls || [] };
    });
  }

  /**
   * SINGLE_URL 专用：轻量级正文提取（保留更多原文）
   * 固定使用 Gemini Flash 模型，提取速度快且成本低
   */
  async extractContentForSingleUrl(
    content: string,
  ): Promise<{ mainContent: string; imageUrls: string[] }> {
    if (!content) {
      throw new Error("Content is required for extraction");
    }

    const provider = (await this.configInstance.get(SummarizarSetting.SINGLE_URL_LLM_PROVIDER)) || "GEMINI";
    const model = (await this.configInstance.get(SummarizarSetting.SINGLE_URL_LLM_MODEL)) || "gemini-2.0-flash-exp";

    return RetryUtil.retryOperation(async () => {
      // 使用 "PROVIDER:MODEL" 格式传递完整配置
      const llm = await this.llmFactory.getLLMProvider(`${provider}:${model}`);
      
      // SINGLE_URL 转载：提取并压缩内容，确保能完整翻译
      const estimatedInputTokens = Math.ceil(content.length / 3);
      const safeMaxTokens = Math.max(16384, Math.min(estimatedInputTokens * 0.8, 24576));
      
      const response = await llm.createChatCompletion([
        {
          role: "system",
          content: getSingleUrlLightExtractionSystemPrompt(),
        },
        {
          role: "user",
          content: getSingleUrlLightExtractionUserPrompt(content),
        },
      ], {
        model,
        temperature: 0.2,
        max_tokens: safeMaxTokens,
        response_format: { type: "json_object" },
        thinkingLevel: "none",
      });

      const completion = response.choices[0]?.message?.content;
      const finishReason = response.choices[0]?.finish_reason;
      
      if (!completion) {
        throw new Error("未获取到有效的提取结果");
      }

      // 检查是否因为 token 限制被截断
      if (finishReason === "length" || finishReason === "max_tokens") {
        logger.warn(`LLM 输出被截断 (finishReason: ${finishReason})，将使用原始内容作为 fallback`);
        // 返回原始内容作为 fallback
        return {
          mainContent: content,
          imageUrls: this.extractImageUrlsFromMarkdown(content),
        };
      }

      try {
        const result = parseJsonFromLLM<{ mainContent: string; imageUrls: string[] }>(completion);
        if (!result.mainContent) {
          throw new Error("提取结果中缺少 mainContent");
        }
        
        logger.info(`LLM 内容提取成功，正文长度: ${result.mainContent.length}, 图片数量: ${result.imageUrls?.length || 0}`);
        return {
          mainContent: result.mainContent,
          imageUrls: result.imageUrls || [],
        };
      } catch (error) {
        // JSON 解析失败时，使用原始内容作为 fallback
        logger.warn(`JSON 解析失败，使用原始内容作为 fallback: ${error instanceof Error ? error.message : String(error)}`);
        return {
          mainContent: content,
          imageUrls: this.extractImageUrlsFromMarkdown(content),
        };
      }
    });
  }

  /**
   * 从 Markdown 中提取图片 URL（fallback 方法）
   */
  private extractImageUrlsFromMarkdown(markdown: string): string[] {
    const imageUrls: string[] = [];
    // 匹配 Markdown 图片语法: ![alt](url)
    const mdImageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
    let match;
    while ((match = mdImageRegex.exec(markdown)) !== null) {
      imageUrls.push(match[2]);
    }
    // 匹配 HTML img 标签: <img src="url">
    const htmlImageRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/g;
    while ((match = htmlImageRegex.exec(markdown)) !== null) {
      imageUrls.push(match[1]);
    }
    return imageUrls;
  }
}
