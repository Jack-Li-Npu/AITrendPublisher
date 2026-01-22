import { ScrapedContent } from "@src/modules/interfaces/scraper.interface.ts";
import { LLMProviderType } from "@src/providers/interfaces/llm.interface.ts";

export interface RankResult {
  id: string;
  score: number;
}

export interface ContentRankerConfig {
  provider?: LLMProviderType;
  modelName?: string;
  temperature?: number;
  maxRetries?: number;
  baseDelay?: number;
}

export interface ContentRanker {
  /**
   * 对内容列表进行评分排名
   * @param contents 需要评分的内容列表
   * @returns 评分结果列表
   */
  rankContents(contents: ScrapedContent[]): Promise<RankResult[]>;

  /**
   * 批量对内容进行评分排名
   * @param contents 需要评分的内容列表
   * @param batchSize 每批处理的内容数量
   * @returns 评分结果列表
   */
  rankContentsBatch(
    contents: ScrapedContent[],
    batchSize?: number,
  ): Promise<RankResult[]>;
}
