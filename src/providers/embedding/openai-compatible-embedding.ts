import { ConfigManager } from "@src/utils/config/config-manager.ts";
import { EmbeddingProvider, EmbeddingOptions, EmbeddingResult } from "@src/providers/interfaces/embedding.interface.ts";
import OpenAI from "npm:openai";
import { Logger } from "@zilla/logger";

const logger = new Logger("EmbeddingProvider")

/**
 * OpenAI 兼容的 Embedding Provider 实现
 * 支持所有兼容 OpenAI API 的服务，如阿里云百炼等
 */
export class OpenAICompatibleEmbedding implements EmbeddingProvider {
  private baseURL!: string;
  private apiKey!: string;
  private defaultModel!: string;
  private availableModels: string[] = [];
  private client!: OpenAI;

  constructor(
    private configKeyPrefix: string = "",
    private configManager: ConfigManager = ConfigManager.getInstance(),
    private specifiedModel?: string
  ) {
    this.configManager = ConfigManager.getInstance();
  }

  async initialize(): Promise<void> {
    await this.refresh();
  }

  async refresh(): Promise<void> {
    // 获取基础配置
    this.baseURL = await this.configManager.get(`${this.configKeyPrefix}EMBEDDING_BASE_URL`);
    this.apiKey = await this.configManager.get(`${this.configKeyPrefix}EMBEDDING_API_KEY`);

    logger.info(`${this.configKeyPrefix}EMBEDDING_API_KEY`)

    logger.info("dashscope",this.apiKey)

    // 获取模型配置，支持多模型格式 "model1|model2|model3"
    const modelConfig = await this.configManager.get(`${this.configKeyPrefix}EMBEDDING_MODEL`);
    
    this.availableModels = (modelConfig as string).split("|").map(model => model.trim());

    // 如果指定了特定模型，使用指定的模型，否则使用第一个可用模型
    this.defaultModel = this.specifiedModel || this.availableModels[0];

    // 初始化 OpenAI 客户端
    this.client = new OpenAI({
      apiKey: this.apiKey,
      baseURL: this.baseURL
    });
  }

  /**
   * 设置 base URL
   * @param url API 基础 URL
   */
  setBaseURL(url: string): void {
    this.baseURL = url;
  }

  /**
   * 设置默认模型
   * @param model 模型名称
   */
  setModel(model: string): void {
    if (this.availableModels.includes(model)) {
      this.defaultModel = model;
    } else {
      console.warn(`警告: 模型 ${model} 不在可用模型列表中，将使用默认模型 ${this.defaultModel}`);
    }
  }

  /**
   * 获取当前使用的模型
   */
  getModel(): string {
    return this.defaultModel;
  }

  /**
   * 获取所有可用的模型
   */
  getAvailableModels(): string[] {
    return [...this.availableModels];
  }

  async createEmbedding(text: string, options?: EmbeddingOptions): Promise<EmbeddingResult> {
    const model = options?.model || this.defaultModel;
    const dimensions = options?.dimensions || 1024;
    const encoding_format = options?.encoding_format || "float";

    try {
      const response = await this.client.embeddings.create({
        model,
        input: text,
        dimensions,
        encoding_format
      });

      if (!response.data?.[0]?.embedding) {
        throw new Error("Invalid response from API");
      }

      return {
        embedding: response.data[0].embedding,
        model: response.model,
        dimensions: dimensions
      };
    } catch (error) {
      throw new Error(`Failed to create embedding: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}