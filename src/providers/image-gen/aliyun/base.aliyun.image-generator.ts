import { BaseImageGenerator } from "@src/providers/image-gen/base.image-generator.ts";
import axios from "npm:axios";
import { Logger } from "@zilla/logger";

const logger = new Logger("aliyun");

/**
 * 阿里云基础任务响应接口
 */
export interface AliTaskResponse {
  request_id: string;
  output: {
    task_status: "PENDING" | "RUNNING" | "SUCCEEDED" | "FAILED";
    task_id: string;
  };
}

/**
 * 阿里云基础任务状态响应接口
 */
export interface AliTaskStatusResponse {
  request_id: string;
  // deno-lint-ignore no-explicit-any
  output: any;
}

/**
 * 阿里云图像生成器基类
 * 提供阿里云服务通用的配置和方法
 */
export abstract class BaseAliyunImageGenerator extends BaseImageGenerator {
  protected apiKey!: string;
  protected baseUrl!: string;
  protected model!: string;

  /**
   * 刷新配置
   * 从配置管理器中获取最新的API密钥
   */
  async refresh(): Promise<void> {
    const apiKey = await this.configManager.get<string>("DASHSCOPE_API_KEY");
    if (!apiKey) {
      throw new Error("DASHSCOPE_API_KEY environment variable is not set");
    }
    this.apiKey = apiKey;
  }

  /**
   * 生成随机种子
   * @returns 1到4294967290之间的随机整数
   */
  protected generateSeed(): number {
    return Math.floor(Math.random() * 4294967290) + 1;
  }
  /**
   * 提交任务到阿里云服务
   */
  protected async submitTask<T extends AliTaskResponse>(
    payload: any,
  ): Promise<T> {
    try {
      logger.debug(`提交任务到阿里云服务: ${this.baseUrl}`, {
        model: this.model,
        ...payload,
      });
      const response = await axios.post<T>(
        this.baseUrl,
        {
          model: this.model,
          ...payload,
        },
        {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${this.apiKey}`,
            "X-DashScope-Async": "enable",
          },
        },
      );
      logger.debug(`阿里云API调用成功: ${response.data.request_id}`, {
        model: this.model,
        response: response.data,
      });
      return response.data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          `阿里云API调用失败: ${
            error.response?.data?.message || error.message
          }`,
        );
      }
      throw error;
    }
  }

  /**
   * 检查任务状态
   */
  protected async checkTaskStatus(
    taskId: string,
  ): Promise<AliTaskStatusResponse["output"]> {
    try {
      const response = await axios.get<AliTaskStatusResponse>(
        `https://dashscope.aliyuncs.com/api/v1/tasks/${taskId}`,
        {
          headers: {
            "Authorization": `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
        },
      );
      return response.data.output;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          `任务状态检查失败: ${error.response?.data?.message || error.message}`,
        );
      }
      throw error;
    }
  }
  /**
   * 获取结果
   */
  protected abstract getResult(output: AliTaskStatusResponse["output"]): string;

  /**
   * 等待任务完成
   */
  protected async waitForCompletion(
    taskId: string,
    maxAttempts: number = 30,
    interval: number = 2000,
  ): Promise<string> {
    let attempts = 0;

    while (attempts < maxAttempts) {
      const status = await this.checkTaskStatus(taskId);

      if (status.task_status === "SUCCEEDED") {
        return await this.getResult(status);
      }

      if (status.task_status === "FAILED") {
        throw new Error("图片生成任务失败");
      }

      await new Promise((resolve) => setTimeout(resolve, interval));
      attempts++;
    }

    throw new Error("等待图片生成超时");
  }

  /**
   * 数值范围限制工具方法
   */
  protected clampValue(
    value: number | undefined,
    min: number,
    max: number,
    defaultValue: number,
  ): number {
    if (value === undefined) return defaultValue;
    return Math.min(Math.max(value, min), max);
  }
}
