import axios from "npm:axios";
import {
  AliTaskResponse,
  AliTaskStatusResponse,
  BaseAliyunImageGenerator,
} from "@src/providers/image-gen/aliyun/base.aliyun.image-generator.ts";

export interface AliWanX21Options {
  prompt: string;
  size?: string;
}

export class AliWanX21ImageGenerator extends BaseAliyunImageGenerator {
  constructor() {
    super();
    this.model = "wanx2.1-t2i-turbo";
  }
  
  /**
   * 刷新配置，设置区域对应的 endpoint
   */
  async refresh(): Promise<void> {
    await super.refresh();
    
    // 根据 taskQueryBaseUrl 推断区域，设置对应的图像合成 endpoint
    const isInternational = this.taskQueryBaseUrl.includes("dashscope-intl");
    this.baseUrl = isInternational
      ? "https://dashscope-intl.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis"
      : "https://dashscope.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis";
  }

  /**
   * 生成图片
   * @param options 生成选项
   * @returns 图片URL数组
   */
  async generate(options: AliWanX21Options): Promise<string> {
    const { prompt, size = "1024*1024" } = options;
    try {
      const response = await this.submitTask<AliTaskResponse>({
        input: {
          prompt,
        },
        parameters: {
          size,
          n: 1,
        },
      });

      const taskId = response.output.task_id;
      return this.waitForCompletion(taskId);
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          `图片生成失败: ${error.response?.data?.message || error.message}`,
        );
      }
      throw error;
    }
  }

  getResult(output: AliTaskStatusResponse["output"]): string {
    if (output.results && output.results.length > 0) {
      return output.results[0].url;
    }
    throw new Error("任务成功但未获取到图片URL");
  }
}
