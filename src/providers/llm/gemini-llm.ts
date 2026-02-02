import { ConfigManager } from "@src/utils/config/config-manager.ts";
import { HttpClient } from "@src/utils/http/http-client.ts";
import {
  ChatCompletionOptions,
  ChatMessage,
  LLMProvider,
} from "@src/providers/interfaces/llm.interface.ts";
import { Logger } from "@zilla/logger";

const logger = new Logger("gemini-llm");

/**
 * Gemini 思考级别配置
 */
// ✅ 正确
export type ThinkingLevel = "NONE" | "LOW" | "MEDIUM" | "HIGH";

/**
 * Gemini 扩展选项
 */
export interface GeminiOptions extends ChatCompletionOptions {
  /** 思考级别（Gemini 3 Pro 支持） */
  thinkingLevel?: ThinkingLevel;
}

/**
 * Google Gemini API 提供者实现
 * 支持 Gemini 3 Pro Preview、Gemini 2.0 Flash、Gemini 1.5 Pro 等模型
 * API 文档: https://ai.google.dev/gemini-api/docs
 */
export class GeminiLLM implements LLMProvider {
  private baseURL!: string;
  private apiKey!: string;
  private defaultModel!: string;
  private availableModels: string[] = [];
  private httpClient: HttpClient;
  private configManager: ConfigManager;
  private defaultThinkingLevel: ThinkingLevel = "HIGH";

  constructor(private specifiedModel?: string) {
    this.httpClient = HttpClient.getInstance();
    this.configManager = ConfigManager.getInstance();
  }

  async initialize(): Promise<void> {
    await this.refresh();
  }

  async refresh(): Promise<void> {
    // 检查是否启用中转模式
    const apiSourceType = await this.configManager.get<string>("API_SOURCE_TYPE").catch(() => "official");
    const isProxy = apiSourceType === "proxy";

    if (isProxy) {
      // 【中转模式】使用 PROXY_ 配置
      let proxyBaseUrl = (await this.configManager.get("PROXY_BASE_URL")) || 
                         "https://api.jacklihome.com";
      
      // 确保包含 /v1beta 路径（Gemini 原生协议需要）
      if (!proxyBaseUrl.includes('/v1beta')) {
        proxyBaseUrl = proxyBaseUrl.replace(/\/$/, '') + '/v1beta';
      }
      
      this.baseURL = proxyBaseUrl;
      this.apiKey = await this.configManager.get<string>("PROXY_API_KEY").catch(() => "");
      console.log(`[GeminiLLM] 🔄 中转模式: 使用 ${this.baseURL}`);
    } else {
      // 【官方模式】使用 GEMINI_ 配置
      // 优先读取 GOOGLE_GEMINI_BASE_URL（用户自定义代理），然后是 GEMINI_BASE_URL
      // 使用 try-catch 避免配置项缺失抛出错误
      try {
        this.baseURL =
          (await this.configManager.get<string>("GOOGLE_GEMINI_BASE_URL").catch(() => "")) ||
          (await this.configManager.get<string>("GEMINI_BASE_URL").catch(() => "")) ||
          "https://generativelanguage.googleapis.com/v1beta";
        this.apiKey = await this.configManager.get<string>("GEMINI_API_KEY").catch(() => "");
      } catch (e) {
        // 忽略错误，由下方的 !this.apiKey 判断统一处理
      }
    }

    // 支持多模型配置 "gemini-2.0-flash-exp|gemini-1.5-pro"
    const modelConfig =
      (await this.configManager.get<string>("GEMINI_MODEL").catch(() => "")) || "gemini-3-flash-preview";
    this.availableModels = (modelConfig as string)
      .split("|")
      .map((model: string) => model.trim());

    // 使用指定模型或第一个可用模型
    this.defaultModel = this.specifiedModel || this.availableModels[0];

    if (!this.apiKey) {
      throw new Error("GEMINI_API_KEY 未配置");
    }

    console.log(
      `✓ Gemini LLM 初始化成功 - 模型: ${this.defaultModel}, 可用模型: ${this.availableModels.join(", ")}`,
    );
  }

  /**
   * 设置使用的模型
   */
  public setModel(model: string): void {
    if (this.availableModels.includes(model)) {
      this.defaultModel = model;
    } else {
      console.warn(
        `警告: 模型 ${model} 不在可用模型列表中，将使用默认模型 ${this.defaultModel}`,
      );
    }
  }

  /**
   * 获取当前使用的模型
   */
  public getModel(): string {
    return this.defaultModel;
  }

  /**
   * 获取所有可用的模型
   */
  public getAvailableModels(): string[] {
    return [...this.availableModels];
  }

  /**
   * 将 OpenAI 格式的消息转换为 Gemini 格式
   */
  private convertMessagesToGeminiFormat(messages: ChatMessage[]): any {
    const systemInstructions: string[] = [];
    const contents: any[] = [];

    for (const msg of messages) {
      if (msg.role === "system") {
        // Gemini 将 system 消息作为 systemInstruction
        systemInstructions.push(msg.content);
      } else {
        // 转换 user 和 assistant 消息
        contents.push({
          role: msg.role === "assistant" ? "model" : "user",
          parts: [{ text: msg.content }],
        });
      }
    }

    return {
      systemInstruction: systemInstructions.length > 0
        ? { parts: [{ text: systemInstructions.join("\n\n") }] }
        : undefined,
      contents,
    };
  }

  /**
   * 设置默认思考级别（Gemini 3 Pro 功能）
   */
  public setThinkingLevel(level: ThinkingLevel): void {
    this.defaultThinkingLevel = level;
  }

  /**
   * 创建聊天完成
   */
  async createChatCompletion(
    messages: ChatMessage[],
    options: GeminiOptions = {},
  ): Promise<any> {
    try {
      const model = options.model || this.defaultModel;
      const geminiMessages = this.convertMessagesToGeminiFormat(messages);

      // 构建生成配置
      const generationConfig: any = {
        temperature: options.temperature ?? 0.7,
        topP: options.top_p ?? 0.95,
        maxOutputTokens: options.max_tokens ?? 2048,
      };

      // 添加 thinkingConfig（Gemini 3 Pro 或 2.0 思考模型支持）
      const thinkingLevel = options.thinkingLevel || this.defaultThinkingLevel;
      if (model.includes("gemini-3") || model.includes("thinking") || model.includes("flash-lite")) {
        if (thinkingLevel === "NONE" || thinkingLevel === "none") {
          // 明确禁用思考功能或设置预算为 0
          generationConfig.thinking_config = {
            include_thoughts: false,
          };
          logger.debug(`已禁用 ${model} 思考功能`);
        } else {
          // 启用思考功能
          // 注意：不同模型可能对 thinking_config 的字段要求不同
          // 按照用户提供的示例，使用 thinkingBudget
          generationConfig.thinking_config = {
            include_thoughts: true,
            // 如果是 flash-lite，根据用户示例使用 0 预算，或者根据级别调整
            thinking_budget: (model.includes("flash-lite")) ? 0 : 32000, 
          };
          logger.debug(`${model} 思考配置已启用`);
        }
      }

      // 构建 Gemini API 请求体
      const requestBody: any = {
        contents: geminiMessages.contents,
        generationConfig,
      };

      // 添加 system instruction（如果有）
      if (geminiMessages.systemInstruction) {
        requestBody.systemInstruction = geminiMessages.systemInstruction;
      }

      // Gemini API 端点（使用 header 认证更安全）
      const endpoint = `${this.baseURL}/models/${model}:generateContent`;

      // 发送请求，使用 x-goog-api-key 头部认证
      const response = await this.httpClient.request(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": this.apiKey,
        },
        body: JSON.stringify(requestBody),
        timeout: 120000, // Gemini 3 Pro 可能需要更长时间（思考功能）
        retries: 3,
        retryDelay: 2000,
      });

      // 转换 Gemini 响应为 OpenAI 兼容格式
      return this.convertGeminiResponseToOpenAIFormat(response, model);
    } catch (error) {
      throw new Error(
        `Gemini API 调用失败: ${(error as Error).message}`,
      );
    }
  }

  /**
   * 将 Gemini 响应转换为 OpenAI 兼容格式
   */
  private convertGeminiResponseToOpenAIFormat(
    geminiResponse: any,
    model: string,
  ): any {
    if (!geminiResponse.candidates || geminiResponse.candidates.length === 0) {
      throw new Error("Gemini API 返回了空的候选结果");
    }

    const candidate = geminiResponse.candidates[0];
    const parts = candidate.content?.parts || [];

    // 调试日志
    logger.debug(`Gemini 响应: ${parts.length} 个 parts, finishReason: ${candidate.finishReason}`);

    // 提取所有文本内容（Gemini 3 Pro 可能有多个 parts，包括思考过程）
    // 只获取非思考部分的文本内容
    let content = "";
    for (const part of parts) {
      if (part.text) {
        // 如果有 thought 标记，跳过思考内容
        if (part.thought === true) {
          logger.debug(`跳过思考内容: ${part.text.substring(0, 50)}...`);
          continue;
        }
        content += part.text;
      }
    }

    // 如果没有找到内容，尝试获取任何可用的文本
    if (!content && parts.length > 0) {
      logger.warn(`未找到正常内容，尝试从 ${parts.length} 个 parts 中获取`);
      for (const part of parts) {
        if (part.text) {
          content += part.text;
        }
      }
    }

    // 清理可能的前后空白
    content = content.trim();

    if (!content) {
      logger.error(`Gemini 响应内容为空，原始响应: ${JSON.stringify(geminiResponse).substring(0, 500)}`);
    }

    // 转换为 OpenAI 格式
    return {
      id: `gemini-${Date.now()}`,
      object: "chat.completion",
      created: Math.floor(Date.now() / 1000),
      model: model,
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content: content,
          },
          finish_reason: this.mapFinishReason(candidate.finishReason),
        },
      ],
      usage: {
        prompt_tokens: geminiResponse.usageMetadata?.promptTokenCount || 0,
        completion_tokens:
          geminiResponse.usageMetadata?.candidatesTokenCount || 0,
        total_tokens: geminiResponse.usageMetadata?.totalTokenCount || 0,
      },
    };
  }

  /**
   * 映射 Gemini 的 finishReason 到 OpenAI 格式
   */
  private mapFinishReason(geminiReason?: string): string {
    const reasonMap: Record<string, string> = {
      "STOP": "stop",
      "MAX_TOKENS": "length",
      "SAFETY": "content_filter",
      "RECITATION": "content_filter",
      "OTHER": "stop",
    };
    return reasonMap[geminiReason || "STOP"] || "stop";
  }
}

