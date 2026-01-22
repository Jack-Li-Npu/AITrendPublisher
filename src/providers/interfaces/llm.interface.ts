export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatCompletionOptions {
  model?: string;
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
  stream?: boolean;
  response_format?: any;
}

export interface LLMProvider {
  /**
   * 初始化LLM提供者
   */
  initialize(): Promise<void>;

  /**
   * 刷新配置
   */
  refresh(): Promise<void>;

  /**
   * 设置模型
   */
  setModel(model: string): void;

  /**
   * 创建聊天完成
   * @param messages 消息数组
   * @param options 可选参数
   */
  createChatCompletion(
    messages: ChatMessage[],
    options?: ChatCompletionOptions,
  ): Promise<any>;
}

/**
 * LLM提供者类型
 */
export type LLMProviderType =
  | "OPENAI"
  | "DEEPSEEK"
  | "XUNFEI"
  | "CLAUDE"
  | "CUSTOM"
  | "QWEN"
  | "GEMINI";

/**
 * LLM提供者类型映射
 */
export interface LLMProviderTypeMap {
  "OPENAI": import("../llm/openai-compatible-llm.ts").OpenAICompatibleLLM;
  "DEEPSEEK": import("../llm/openai-compatible-llm.ts").OpenAICompatibleLLM;
  "XUNFEI": import("../llm/xunfei-llm.ts").XunfeiLLM;
  "CLAUDE": import("../llm/claude-llm.ts").ClaudeLLM;
  "QWEN": import("../llm/openai-compatible-llm.ts").OpenAICompatibleLLM;
  "GEMINI": import("../llm/gemini-llm.ts").GeminiLLM;
  "CUSTOM": import("../llm/openai-compatible-llm.ts").OpenAICompatibleLLM;
}
