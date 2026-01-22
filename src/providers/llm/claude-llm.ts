import { ConfigManager } from "@src/utils/config/config-manager.ts";
import { HttpClient } from "@src/utils/http/http-client.ts";
import {
  ChatCompletionOptions,
  ChatMessage,
  LLMProvider,
} from "@src/providers/interfaces/llm.interface.ts";

interface ClaudeMessage {
  role: "user" | "assistant";
  content: string;
}

interface ClaudeResponse {
  id: string;
  type: "message";
  role: "assistant";
  content: Array<{
    type: "text";
    text: string;
  }>;
  model: string;
  stop_reason: string;
  stop_sequence: string | null;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

/**
 * Anthropic Claude LLM Provider
 * 
 * Supports Claude models including:
 * - claude-opus-4-20250514 (Claude Opus 4)
 * - claude-sonnet-4-20250514 (Claude Sonnet 4)
 * - claude-3-7-sonnet-20250219 (Claude 3.7 Sonnet)
 * - claude-3-5-sonnet-20241022 (Claude 3.5 Sonnet)
 * 
 * API Documentation: https://docs.anthropic.com/claude/reference/messages_post
 */
export class ClaudeLLM implements LLMProvider {
  private baseURL = "https://api.anthropic.com/v1";
  private apiKey!: string;
  private defaultModel!: string;
  private availableModels: string[] = [];
  private httpClient: HttpClient;
  private apiVersion = "2023-06-01"; // Claude API version

  constructor(
    private configManager: ConfigManager = ConfigManager.getInstance(),
    private specifiedModel?: string,
  ) {
    this.httpClient = HttpClient.getInstance();
  }

  async initialize(): Promise<void> {
    await this.refresh();
  }

  async refresh(): Promise<void> {
    this.apiKey = await this.configManager.get("CLAUDE_API_KEY");
    if (!this.apiKey) {
      throw new Error("CLAUDE_API_KEY is not set");
    }

    // 获取自定义 BASE_URL（如果有）
    const customBaseURL = await this.configManager.get("CLAUDE_BASE_URL");
    if (customBaseURL) {
      this.baseURL = customBaseURL as string;
    }

    // 获取模型配置，支持多模型格式 "model1|model2|model3"
    const modelConfig =
      await this.configManager.get("CLAUDE_MODEL") ||
      "claude-3-7-sonnet-20250219";
    this.availableModels = (modelConfig as string).split("|").map((
      model: string,
    ) => model.trim());

    // 如果指定了特定模型，使用指定的模型，否则使用第一个可用模型
    this.defaultModel = this.specifiedModel || this.availableModels[0];

    // 检查API服务是否可用
    const isHealthy = await this.httpClient.healthCheck(this.baseURL);
    if (!isHealthy) {
      console.warn(
        `警告: Claude API 服务健康检查失败，可能无法正常访问`,
      );
    }
  }

  /**
   * 设置使用的模型
   * @param model 模型名称
   */
  setModel(model: string): void {
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
   * @returns 当前模型名称
   */
  getModel(): string {
    return this.defaultModel;
  }

  /**
   * 获取所有可用的模型
   * @returns 可用模型列表
   */
  getAvailableModels(): string[] {
    return [...this.availableModels];
  }

  /**
   * 创建聊天完成
   * @param messages 消息数组
   * @param options 可选参数
   * @returns 聊天完成响应
   */
  async createChatCompletion(
    messages: ChatMessage[],
    options: ChatCompletionOptions = {},
  ): Promise<any> {
    try {
      // 提取系统消息
      let systemMessage = "";
      const claudeMessages: ClaudeMessage[] = [];

      for (const msg of messages) {
        if (msg.role === "system") {
          // Claude 的系统消息是单独的参数
          systemMessage = msg.content;
        } else {
          claudeMessages.push({
            role: msg.role as "user" | "assistant",
            content: msg.content,
          });
        }
      }

      // 构建请求体
      const requestBody: Record<string, unknown> = {
        model: options.model || this.defaultModel,
        messages: claudeMessages,
        max_tokens: options.max_tokens ?? 4096,
      };

      // 添加系统消息（如果有）
      if (systemMessage) {
        requestBody.system = systemMessage;
      }

      // 添加可选参数
      if (options.temperature !== undefined) {
        requestBody.temperature = options.temperature;
      }
      if (options.top_p !== undefined) {
        requestBody.top_p = options.top_p;
      }

      const response = await this.httpClient.request<ClaudeResponse>(
        `${this.baseURL}/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": this.apiKey,
            "anthropic-version": this.apiVersion,
          },
          body: JSON.stringify(requestBody),
          timeout: 90000, // 90秒超时（Claude 响应可能较慢）
          retries: 3,
          retryDelay: 2000,
        },
      );

      // 转换为标准格式返回（兼容 OpenAI 格式）
      return {
        id: response.id,
        object: "chat.completion",
        created: Date.now(),
        model: response.model,
        choices: [
          {
            index: 0,
            message: {
              role: "assistant",
              content: response.content[0]?.text || "",
            },
            finish_reason: response.stop_reason,
          },
        ],
        usage: {
          prompt_tokens: response.usage.input_tokens,
          completion_tokens: response.usage.output_tokens,
          total_tokens:
            response.usage.input_tokens + response.usage.output_tokens,
        },
      };
    } catch (error) {
      throw new Error(`Claude API 调用失败: ${(error as Error).message}`);
    }
  }

  /**
   * 发送单条消息并获取响应（便捷方法）
   * @param content 消息内容
   * @param systemPrompt 可选的系统提示
   * @returns 助手的响应文本
   */
  async sendMessage(
    content: string,
    systemPrompt?: string,
  ): Promise<string> {
    const messages: ChatMessage[] = [];

    if (systemPrompt) {
      messages.push({
        role: "system",
        content: systemPrompt,
      });
    }

    messages.push({
      role: "user",
      content,
    });

    const response = await this.createChatCompletion(messages);
    return response.choices[0].message.content;
  }
}
