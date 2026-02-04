import {
  ContentSummarizer,
  Summary,
} from "@src/modules/interfaces/summarizer.interface.ts";
import {
  getSummarizerSystemPrompt,
  getSummarizerUserPrompt,
  getTitleSystemPrompt,
  getTitleUserPrompt,
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
  getRefineSystemPrompt,
  getRefineUserPrompt,
  RefinePromptParams,
  getGithubExtractionSystemPrompt,
  getGithubExtractionUserPrompt,
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
  /** 预提取使用的 LLM 提供者（正文/图片提取） */
  AI_PRE_EXTRACT_LLM_PROVIDER = "AI_PRE_EXTRACT_LLM_PROVIDER",
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
   * 根据模型提供商获取推荐的 temperature
   * 国内模型（DeepSeek/Qwen）使用更低的温度以提高输出稳定性
   * @param providerConfig 格式：PROVIDER:MODEL 或 PROVIDER
   * @param defaultTemp 默认温度
   */
  private getRecommendedTemperature(providerConfig: string, defaultTemp: number): number {
    const provider = providerConfig.split(':')[0].toUpperCase();
    // 国内模型使用更低的温度（0.1-0.2）以避免异常输出
    if (provider === 'DEEPSEEK' || provider === 'QWEN') {
      // 如果默认温度已经很低，保持不变；否则降低到 0.1-0.2
      return Math.min(defaultTemp, 0.2);
    }
    return defaultTemp;
  }

  /**
   * 修复 LLM 输出的转义文本（如 \\n、\\t、\\uXXXX、\\- 等）
   */
  /**
   * 修复 LLM 输出的转义文本（特别是 Qwen 在 JSON 模式下的双重转义问题）
   * 
   * 问题背景：
   * - 当 LLM 被要求输出 JSON 格式时，Markdown 内容会作为 JSON 字符串的值
   * - Qwen 等模型可能会"过度转义"，导致 `##` → `\\#\\#`、`**` → `\\*\\*` 等
   * - 而直接输出 Markdown（如润色模式）则不会有此问题
   * 
   * 修复策略：
   * - 先处理双重转义（\\n\\n → \n\n）
   * - 再处理单次转义（\n → 换行）
   * - 保留必要的转义（如 JSON 中的 \"）
   */
  /**
   * 清理异常的字符级格式化（如每个字符之间都有星号）
   * 例如：*P*i*n*t*e*r*e*s*t* → Pinterest
   * 例如：*#* *M*a*r*k* → # Mark
   */
  private cleanCharLevelFormatting(text: string): string {
    if (!text) return text;

    // 统计"非空白非星号字符后紧跟星号"的数量
    const starAfterCharCount = (text.match(/[^\s*]\*/g) || []).length;
    const charCount = text.length;

    // 如果超过10%的字符后面紧跟星号，认为是异常格式（降低阈值以更敏感地检测）
    if (starAfterCharCount > charCount * 0.1) {
      logger.warn(`[格式清理] 检测到异常的字符级格式化 (${starAfterCharCount}/${charCount} = ${(starAfterCharCount/charCount*100).toFixed(1)}%)，正在清理...`);

      let cleaned = text;

      // 策略0：首先处理 *X* 模式（单个字符被星号包围）
      // 这是最常见的异常模式：*M*a*r*k* → Mark
      // 多次迭代直到没有变化
      let iterations = 0;
      let prevText = '';
      while (prevText !== cleaned && iterations < 20) {
        prevText = cleaned;
        iterations++;

        // 移除包围单个字符的星号：*X* → X（但保留 **X** 加粗语法）
        cleaned = cleaned.replace(/(?<!\*)\*([^\s*])\*(?!\*)/g, '$1');

        // 移除字符之间的星号：X*Y → XY
        cleaned = cleaned.replace(/([^\s*])\*([^\s*])/g, '$1$2');

        // 移除空格后的单个星号：" *X" → " X"
        cleaned = cleaned.replace(/(\s)\*([^\s*])/g, '$1$2');

        // 移除单个星号后的空格："X* " → "X "
        cleaned = cleaned.replace(/([^\s*])\*(\s)/g, '$1$2');
      }

      // 策略1：清理开头和结尾的孤立星号
      cleaned = cleaned.replace(/^\*+\s*/gm, '');  // 每行开头的星号
      cleaned = cleaned.replace(/\s*\*+$/gm, '');  // 每行结尾的星号

      // 策略2：清理多个连续星号（保留最多2个用于 Markdown 加粗）
      cleaned = cleaned.replace(/\*{3,}/g, '**');

      // 策略3：清理孤立的单个星号（不是成对的加粗标记）
      // 匹配：空格/行首 + 单个星号 + 非星号字符
      cleaned = cleaned.replace(/(^|\s)\*([^*\s])/gm, '$1$2');
      // 匹配：非星号字符 + 单个星号 + 空格/行尾
      cleaned = cleaned.replace(/([^*\s])\*(\s|$)/gm, '$1$2');

      // 策略4：恢复 Markdown 标题语法
      cleaned = cleaned.replace(/^(#+)\s*/gm, (match, hashes) => hashes + ' ');

      // 策略5：清理可能残留的多余空格
      cleaned = cleaned.replace(/  +/g, ' ');

      logger.info(`[格式清理] 清理完成 (${iterations}次迭代)，原长度: ${text.length}, 新长度: ${cleaned.length}`);
      return cleaned;
    }

    return text;
  }

  private normalizeEscapedText(text: string): string {
    if (!text) return text;
    let normalized = text;
    
    // 首先清理异常的字符级格式化
    normalized = this.cleanCharLevelFormatting(normalized);

    // 仅在存在明显转义序列时处理
    if (!normalized.includes("\\")) {
      return normalized;
    }

    // 第一轮：处理双重转义（JSON 字符串中被二次转义的情况）
    // 例如：\\n\\n## → \n\n##
    normalized = normalized
      .replace(/\\\\r\\\\n/g, "\n")    // 双重转义的 Windows 换行
      .replace(/\\\\n/g, "\n")         // 双重转义的 Unix 换行
      .replace(/\\\\t/g, "\t")         // 双重转义的制表符
      .replace(/\\\\r/g, "\r")         // 双重转义的回车
      .replace(/\\\\#/g, "#")          // 双重转义的井号（标题）
      .replace(/\\\\\*/g, "*")         // 双重转义的星号（加粗/列表）
      .replace(/\\\\-/g, "-")          // 双重转义的短横线（列表）
      .replace(/\\\\>/g, ">")          // 双重转义的大于号（引用）
      .replace(/\\\\</g, "<")          // 双重转义的小于号
      .replace(/\\\\`/g, "`")          // 双重转义的反引号（代码）
      .replace(/\\\\"/g, "\"")         // 双重转义的双引号
      .replace(/\\\\'/g, "'")          // 双重转义的单引号
      .replace(/\\\\\\\\/g, "\\");     // 四重反斜杠 → 单个反斜杠

    // 第二轮：处理单次转义（标准 JSON 转义）
    // 注意：在第一轮之后再处理，避免重复替换
    if (normalized.includes("\\")) {
      normalized = normalized
        .replace(/\\r\\n/g, "\n")      // Windows 换行
        .replace(/\\n/g, "\n")         // Unix 换行
        .replace(/\\t/g, "\t")         // 制表符
        .replace(/\\r/g, "\r")         // 回车
        .replace(/\\"/g, "\"")         // 双引号
        .replace(/\\'/g, "'")          // 单引号
        .replace(/\\\\/g, "\\")        // 反斜杠本身
        .replace(/\\#/g, "#")          // 井号
        .replace(/\\*/g, "*")          // 星号
        .replace(/\\-/g, "-")          // 短横线
        .replace(/\\>/g, ">")          // 大于号
        .replace(/\\</g, "<")          // 小于号
        .replace(/\\`/g, "`")          // 反引号
        .replace(/\\u([0-9a-fA-F]{4})/g, (_match, code) => {
          try {
            return String.fromCharCode(parseInt(code, 16));
          } catch {
            return _match;
          }
        });
    }

    // 严格移除 LaTeX 公式（不允许出现 $$...$$ 或 $...$ 等）
    normalized = this.stripLatex(normalized);
    return normalized;
  }

  /**
   * 严格移除 LaTeX 公式内容（包含 $...$, $$...$$, \( \), \[ \]）
   */
  private stripLatex(text: string): string {
    if (!text) return text;
    // 为了支持 LaTeX 渲染，暂时放开限制
    return text;
  }

  /**
   * 生成深度文章摘要
   */
  async summarize(
    content: string,
    options?: { minWords?: number; maxWords?: number; language?: string },
  ): Promise<ExtendedSummary> {
    if (!content) {
      throw new Error("Content is required for summarization");
    }

    // 优先使用 options 中的字数，否则从配置获取默认值
    const rawMin = options?.minWords || await this.configInstance.get(SummarizarSetting.ARTICLE_MIN_LENGTH);
    const rawMax = options?.maxWords || await this.configInstance.get(SummarizarSetting.ARTICLE_MAX_LENGTH);
    const minLength = (typeof rawMin === "number" ? rawMin : Number(rawMin)) || 2000;
    const maxLength = (typeof rawMax === "number" ? rawMax : Number(rawMax)) || 3000;

    return RetryUtil.retryOperation(async () => {
      const preExtractProvider =
        await this.configInstance.get(
          SummarizarSetting.AI_PRE_EXTRACT_LLM_PROVIDER,
        );
      const summarizerProvider =
        await this.configInstance.get(
          SummarizarSetting.AI_SUMMARIZER_LLM_PROVIDER,
        );
      const providerConfig =
        preExtractProvider || summarizerProvider || "GEMINI";
      const llm = await this.llmFactory.getLLMProvider(providerConfig);

      const response = await llm.createChatCompletion([
        {
          role: "system",
          content: await getSummarizerSystemPrompt(),
        },
        {
          role: "user",
          content: getSummarizerUserPrompt({
            content,
            language: options?.language || "中文",
            minLength,
            maxLength,
          }),
        },
      ], {
        temperature: this.getRecommendedTemperature(providerConfig, 0.3),
        max_tokens: 8192,
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

        summary.content = this.normalizeEscapedText(String(summary.content));
        if (summary.summary) {
          summary.summary = this.normalizeEscapedText(String(summary.summary));
        }

        if (!summary.readTime) {
          summary.readTime = Math.ceil(summary.content.length / 500);
        }
        
        logger.info(`文章生成成功: ${summary.title}, 目标: ${minLength}-${maxLength}字, 实际: ${summary.content.length}字`);
        return summary;
      } catch (error) {
        throw new Error(`解析摘要结果失败: ${error instanceof Error ? error.message : "未知错误"}`);
      }
    });
  }

  // summarizeGitHubProject 已删除 - GitHub Trending 模式现在直接使用 README 内容

  /**
   * GitHub README 清理、翻译与提取
   */
  async extractGithubReadme(
    content: string,
  ): Promise<{ mainContent: string; imageUrls: string[] }> {
    if (!content) {
      throw new Error("README content is required for extraction");
    }

    return RetryUtil.retryOperation(async () => {
      const providerConfig = await this.configInstance.get(
        SummarizarSetting.AI_SUMMARIZER_LLM_PROVIDER,
      );
      const llm = await this.llmFactory.getLLMProvider(providerConfig);

      const response = await llm.createChatCompletion([
        {
          role: "system",
          content: getGithubExtractionSystemPrompt(),
        },
        {
          role: "user",
          content: getGithubExtractionUserPrompt(content),
        },
      ], {
        temperature: this.getRecommendedTemperature(providerConfig, 0.3),
        max_tokens: 8000, // DeepSeek 最大限制 8192，设置为 8000 以策安全
        response_format: { type: "json_object" },
        thinkingLevel: "none",
      });

      const completion = response.choices[0]?.message?.content;
      if (!completion) throw new Error("未获取到提取结果");

      const parsed = parseJsonFromLLM<{ mainContent?: string; imageUrls?: string[] }>(completion);
      const mainContent = parsed.mainContent && this.normalizeEscapedText(String(parsed.mainContent)).trim();
      if (!mainContent) throw new Error("提取的内容为空");

      logger.info(`GitHub README 提取与翻译完成，正文长度: ${mainContent.length}, 图片数: ${parsed.imageUrls?.length || 0}`);
      return { mainContent, imageUrls: parsed.imageUrls || [] };
    });
  }

  /**
   * SINGLE_URL 转载模式：仅翻译 + 精辟扩充 + 作者提取 + 标题提取与翻译
   */
  async translateAndLightExpandForRepost(content: string, options?: { maxWords?: number }): Promise<{ 
    author: string; 
    content: string;
    originalTitle: string;
    translatedTitle: string;
  }> {
    const provider = (await this.configInstance.get(SummarizarSetting.SINGLE_URL_LLM_PROVIDER)) || "GEMINI";
    const model = (await this.configInstance.get(SummarizarSetting.SINGLE_URL_LLM_MODEL)) || "gemini-2.0-flash-exp";

    // 获取最大字数限制
    const maxLen = options?.maxWords || Number(await this.configInstance.get("ARTICLE_MAX_LENGTH")) || 2000;

    return RetryUtil.retryOperation(async () => {
      const llm = await this.llmFactory.getLLMProvider(`${provider}:${model}`);
      
      const estimatedInputTokens = Math.ceil(Math.min(content.length, 10000) / 3);
      const safeMaxTokens = Math.max(4096, Math.min(estimatedInputTokens * 1.5, 8192));
      
      logger.info(`[SINGLE_URL 翻译] 目标字数: ${maxLen}, 输入长度: ${content.length} 字符`);
      
      const providerConfig = `${provider}:${model}`;
      const response = await llm.createChatCompletion(
        [
          { role: "system", content: await getSingleUrlRepostSystemPrompt() },
          { role: "user", content: getSingleUrlRepostUserPrompt(content, maxLen) },
        ],
        {
          model,
          temperature: this.getRecommendedTemperature(providerConfig, 0.3),
          max_tokens: safeMaxTokens,
          response_format: { type: "json_object" },
          thinkingLevel: "none",
        },
      );

      const completion = response.choices[0]?.message?.content;
      const finishReason = response.choices[0]?.finish_reason;
      
      if (!completion) throw new Error("SINGLE_URL 转载：未获取到有效结果");
      
      if (finishReason === "length" || finishReason === "max_tokens") {
        logger.warn(`[SINGLE_URL 翻译] ⚠️ LLM 输出被截断 (finishReason: ${finishReason})`);
      }

      const parsed = parseJsonFromLLM<{ 
        author?: string; 
        content?: string;
        originalTitle?: string;
        translatedTitle?: string;
      }>(completion);
      
      const author = (parsed.author && String(parsed.author).trim()) || "";
      const text = parsed.content && this.normalizeEscapedText(String(parsed.content)).trim();
      const originalTitle = (parsed.originalTitle && String(parsed.originalTitle).trim()) || "";
      const translatedTitle = (parsed.translatedTitle && String(parsed.translatedTitle).trim()) || "";
      
      if (!text) throw new Error("SINGLE_URL 转载：content 为空");

      logger.info(`SINGLE_URL 转载处理完成, author: ${author || "未识别"}, 目标上限: ${maxLen}, 实际: ${text.length} 字符`);
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
      const providerConfig = await this.configInstance.get(
        SummarizarSetting.AI_SUMMARIZER_LLM_PROVIDER,
      );
      const llm = await this.llmFactory.getLLMProvider(providerConfig);
      const contentMode = options?.contentMode;
      
      const response = await llm.createChatCompletion([
        {
          role: "system",
          content: getTitleSystemPrompt(contentMode),
        },
        {
          role: "user",
          content: getTitleUserPrompt({
            content,
            language: options?.language,
            contentMode,
          }),
        },
      ], {
        temperature: this.getRecommendedTemperature(providerConfig, 0.7),
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
   * 生成文章引入内容
   */
  async generateIntroduction(params: {
    articleTitles: string[];
    articleCount: number;
    contentMode?: "TECH_NEWS" | "GITHUB_TRENDING" | "SINGLE_URL" | "TOPIC_SEARCH" | "AI_NEWS_SITE";
  }): Promise<string> {
    return RetryUtil.retryOperation(async () => {
      const providerConfig = await this.configInstance.get(
        SummarizarSetting.AI_SUMMARIZER_LLM_PROVIDER,
      );
      const llm = await this.llmFactory.getLLMProvider(providerConfig);

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
        temperature: this.getRecommendedTemperature(providerConfig, 0.7),
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
      
      // 修复 Qwen 等模型输出的双重转义字符
      cleanedIntroduction = this.normalizeEscapedText(cleanedIntroduction);
      
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
      const providerConfig = await this.configInstance.get(
        SummarizarSetting.AI_SUMMARIZER_LLM_PROVIDER,
      );
      const llm = await this.llmFactory.getLLMProvider(providerConfig);

      const response = await llm.createChatCompletion([
        {
          role: "system",
          content: await getAINewsSiteSystemPrompt(),
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
        temperature: this.getRecommendedTemperature(providerConfig, 0.5),
        max_tokens: 4096,
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

        summary.content = this.normalizeEscapedText(String(summary.content));
        if (summary.summary) {
          summary.summary = this.normalizeEscapedText(String(summary.summary));
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
   * @param content 网页 Markdown 内容
   * @param baseUrl 基础 URL
   * @param usedUrls 已使用的 URL 列表（LLM 会跳过这些 URL）
   */
  async extractLinks(
    content: string,
    baseUrl: string,
    usedUrls?: string[],
  ): Promise<{ title: string; url: string }[]> {
    if (!content) {
      return [];
    }

    return RetryUtil.retryOperation(async () => {
      const providerConfig = await this.configInstance.get(
        SummarizarSetting.AI_SUMMARIZER_LLM_PROVIDER,
      );
      const llm = await this.llmFactory.getLLMProvider(providerConfig);

      const response = await llm.createChatCompletion([
        {
          role: "system",
          content: getLinkExtractionSystemPrompt(),
        },
        {
          role: "user",
          content: getLinkExtractionUserPrompt(content, baseUrl, usedUrls),
        },
      ], {
        temperature: this.getRecommendedTemperature(providerConfig, 0.1),
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
      const providerConfig = await this.configInstance.get(
        SummarizarSetting.AI_SUMMARIZER_LLM_PROVIDER,
      );
      const llm = await this.llmFactory.getLLMProvider(providerConfig);

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
        temperature: this.getRecommendedTemperature(providerConfig, 0.3), // 提取任务使用低温度以保证稳定性
        max_tokens: safeMaxTokens,
        response_format: { type: "json_object" },
        thinkingLevel: "none",
      });

      const completion = response.choices[0]?.message?.content;
      if (!completion) throw new Error("未获取到提取结果");

      const parsed = parseJsonFromLLM<{ mainContent?: string; imageUrls?: string[] }>(completion);
      const mainContent = parsed.mainContent && this.normalizeEscapedText(String(parsed.mainContent)).trim();
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
      const providerConfig = `${provider}:${model}`;
      const llm = await this.llmFactory.getLLMProvider(providerConfig);

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
        temperature: this.getRecommendedTemperature(providerConfig, 0.2),
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
        // 确保 mainContent 是字符串类型
        const mainContent = typeof result.mainContent === 'string'
          ? result.mainContent
          : (result.mainContent ? String(result.mainContent) : '');

        if (!mainContent) {
          throw new Error("提取结果中缺少 mainContent");
        }

        logger.info(`LLM 内容提取成功，正文长度: ${mainContent.length}, 图片数量: ${result.imageUrls?.length || 0}`);
        return {
          mainContent: this.normalizeEscapedText(mainContent),
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

  /**
   * 内容打磨：根据用户指令和指定模型重新生成内容
   * @param params 打磨参数，包含当前内容、用户指令、段落类型
   * @param options 可选参数，包含指定的 LLM 提供者
   * @returns 打磨后的内容（纯 Markdown 文本）
   */
  async refineContent(
    params: RefinePromptParams,
    options?: { 
      llmProvider?: string; // 格式：PROVIDER:MODEL 或 PROVIDER
      temperature?: number;
    }
  ): Promise<string> {
    return RetryUtil.retryOperation(async () => {
      // 如果指定了 LLM 提供者，使用指定的；否则使用默认的 Summarizer LLM
      const providerConfig = options?.llmProvider ||
        await this.configInstance.get(SummarizarSetting.AI_SUMMARIZER_LLM_PROVIDER);

      logger.info(`[内容打磨] 开始打磨内容，使用模型: ${providerConfig}, 段落类型: ${params.sectionType || "未指定"}`);

      const llm = await this.llmFactory.getLLMProvider(providerConfig);

      // 使用推荐的温度，国内模型使用更低的温度
      const temperature = options?.temperature ?? this.getRecommendedTemperature(providerConfig, 0.5);

      const response = await llm.createChatCompletion([
        {
          role: "system",
          content: await getRefineSystemPrompt(),
        },
        {
          role: "user",
          content: getRefineUserPrompt(params),
        },
      ], {
        temperature,
        max_tokens: 8192,
        thinkingLevel: "MEDIUM",
      });

      const refined = response.choices[0]?.message?.content;
      if (!refined || refined.trim() === "") {
        throw new Error("打磨结果为空");
      }
      
      // 清理可能的代码块标记
      let cleanedContent = refined.trim();
      if (cleanedContent.startsWith("```markdown")) {
        cleanedContent = cleanedContent.replace(/^```markdown\n?/, "").replace(/\n?```$/, "");
      } else if (cleanedContent.startsWith("```")) {
        cleanedContent = cleanedContent.replace(/^```\n?/, "").replace(/\n?```$/, "");
      }
      
      // 修复 Qwen 等模型输出的双重转义字符（如 \\n\\n## → \n\n##）
      cleanedContent = this.normalizeEscapedText(cleanedContent);
      
      logger.info(`[内容打磨] 打磨完成，原长度: ${params.currentContent.length}, 新长度: ${cleanedContent.length}`);
      return cleanedContent.trim();
    });
  }
}
