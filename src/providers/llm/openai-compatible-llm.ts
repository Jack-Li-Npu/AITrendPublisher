import { ConfigManager } from "@src/utils/config/config-manager.ts";
import { HttpClient } from "@src/utils/http/http-client.ts";
import {
  ChatCompletionOptions,
  ChatMessage,
  LLMProvider,
} from "@src/providers/interfaces/llm.interface.ts";

export class OpenAICompatibleLLM implements LLMProvider {
  private baseURL!: string;
  private token!: string;
  private defaultModel!: string;
  private availableModels: string[] = [];
  private httpClient: HttpClient;

  constructor(
    private configKeyPrefix: string = "",
    private configManager: ConfigManager = ConfigManager.getInstance(),
    private specifiedModel?: string,
  ) {
    this.httpClient = HttpClient.getInstance();
  }

  async initialize(): Promise<void> {
    await this.refresh();
  }

  async refresh(): Promise<void> {
    const configManager = ConfigManager.getInstance();
    
    // 1. 获取基础配置（使用 try-catch 避免找不到配置时直接中断）
    try {
      this.baseURL = await configManager.get(`${this.configKeyPrefix}BASE_URL`);
    } catch {
      this.baseURL = ""; // 如果找不到，设为空字符串，后续特殊逻辑会处理
    }
    
    try {
      this.token = await configManager.get(`${this.configKeyPrefix}API_KEY`);
    } catch {
      this.token = ""; // 如果找不到，设为空字符串，后续特殊逻辑会处理
    }

    // 2. 特殊处理：如果是 QWEN，且没有设置特定的 API_KEY，则尝试使用通用的 DASHSCOPE_API_KEY
    if (this.configKeyPrefix === "QWEN_") {
      if (!this.token) {
        try {
          this.token = await configManager.get("DASHSCOPE_API_KEY");
        } catch {
          // DASHSCOPE_API_KEY 也没有，最后会在后面统一报错
        }
      }
      
      // 如果没有设置 BASE_URL，根据区域自动生成
      if (!this.baseURL) {
        const region = await configManager.get<string>("DASHSCOPE_REGION").catch(() => "cn");
        const isIntl = region.toLowerCase() === "intl" || region.toLowerCase() === "singapore";
        this.baseURL = isIntl 
          ? "https://dashscope-intl.aliyuncs.com/compatible-mode/v1"
          : "https://dashscope.aliyuncs.com/compatible-mode/v1";
      }
    }

    // 3. 获取模型配置，支持多模型格式 "model1|model2|model3"
    let modelConfig: string;
    try {
      // 如果是 PROXY_ 模式，默认模型配置可能为空，此时我们不抛错，直接使用 specifiedModel
      modelConfig = await configManager.get(`${this.configKeyPrefix}MODEL`) || "";
      if (!modelConfig && this.specifiedModel) {
        modelConfig = this.specifiedModel;
      }
      if (!modelConfig) {
        if (this.configKeyPrefix === "QWEN_") {
          modelConfig = "qwen-plus";
        } else if (this.configKeyPrefix === "DEEPSEEK_") {
          modelConfig = "deepseek-chat";
        } else {
          modelConfig = "gpt-3.5-turbo";
        }
      }
    } catch {
      // 如果找不到模型配置，为不同的提供者设置合理的默认值
      if (this.configKeyPrefix === "QWEN_") {
        modelConfig = "qwen-plus"; // Qwen 默认使用 qwen-plus
      } else if (this.configKeyPrefix === "DEEPSEEK_") {
        modelConfig = "deepseek-chat";
      } else {
        modelConfig = "gpt-3.5-turbo";
      }
    }
    
    this.availableModels = (modelConfig as string).split("|").map((
      model: string,
    ) => model.trim());

    // 如果指定了特定模型，使用指定的模型，否则使用第一个可用模型
    this.defaultModel = this.specifiedModel || this.availableModels[0];

    if (!this.baseURL) {
      throw new Error(`${this.configKeyPrefix}BASE_URL is not set`);
    }
    if (!this.token) {
      throw new Error(`${this.configKeyPrefix}API_KEY is not set`);
    }

    // 检查API服务是否可用
    const isHealthy = await this.httpClient.healthCheck(this.baseURL);
    if (!isHealthy) {
      console.warn(
        `警告: LLM服务 ${this.baseURL} 健康检查失败，可能无法正常访问`,
      );
    }
  }

  /**
   * 设置使用的模型
   * @param model 模型名称
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
   * @returns 当前模型名称
   */
  public getModel(): string {
    return this.defaultModel;
  }

  /**
   * 获取所有可用的模型
   * @returns 可用模型列表
   */
  public getAvailableModels(): string[] {
    return [...this.availableModels];
  }

  async createChatCompletion(
    messages: ChatMessage[],
    options: ChatCompletionOptions = {},
  ): Promise<any> {
    try {
      // 简单拼接路径，不做任何智能判断，完全由用户控制 baseURL
      const baseUrl = this.baseURL.endsWith('/') ? this.baseURL.slice(0, -1) : this.baseURL;
      const endpoint = `${baseUrl}/chat/completions`;

      console.log(`[LLM请求] 目标地址: ${endpoint}, 模型: ${options.model || this.defaultModel}`);

      // 构建请求体
      const body: any = {
        model: options.model || this.defaultModel,
        messages,
        temperature: options.temperature ?? 0.7,
        // top_p: options.top_p ?? 1, // 移除 top_p，使用模型默认值，避免部分模型 400 错误
        max_tokens: options.max_tokens ?? 2000,
        stream: options.stream ?? false,
      };

      // 仅针对 OpenAI 官方 API 发送 response_format
      // DeepSeek、Qwen、Moonshot 等兼容接口虽然宣称支持，但经常因版本或参数组合报 400
      // 我们的 Prompt 已经包含了明确的 JSON 输出指令，依赖 Prompt 即可
      if (baseUrl.includes("api.openai.com")) {
        body.response_format = options.response_format;
      }

      // 使用HttpClient进行请求
      return await this.httpClient.request(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.token}`,
        },
        body: JSON.stringify(body),
        timeout: 60000, // 60秒超时
        retries: 3, // 最多重试3次
        retryDelay: 1000, // 重试间隔1秒
      });
    } catch (error) {
      throw new Error(`创建聊天完成失败: ${(error as Error).message}`);
    }
  }
}
