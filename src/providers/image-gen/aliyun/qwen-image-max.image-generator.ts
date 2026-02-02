import { BaseAliyunImageGenerator } from "./base.aliyun.image-generator.ts";
import axios from "npm:axios";
import { Logger } from "@zilla/logger";

const logger = new Logger("qwen-image-max");

/**
 * Qwen Image Max 响应接口
 */
interface QwenImageMaxResponse {
  request_id: string;
  output: {
    results: Array<{
      url: string;
    }>;
  };
}

/**
 * Qwen Image Max 图片生成器
 * 使用阿里云通义千问 Image Max 模型生成高质量图片
 */
export class QwenImageMaxGenerator extends BaseAliyunImageGenerator {
  protected model = "qwen-image-max";
  protected baseUrl!: string;

  /**
   * 刷新配置
   */
  async refresh(): Promise<void> {
    await super.refresh();
    // 根据区域配置选择国内/国际端点
    // 优先级：DASHSCOPE_REGION > DASHSCOPE_BASE_URL 中的关键词
    const region = await this.configManager.get<string>("DASHSCOPE_REGION").catch(() => "");
    const dashscopeBaseUrl = await this.configManager.get<string>("DASHSCOPE_BASE_URL").catch(() => "");

    // 判断是否为国际版：
    // 1. DASHSCOPE_REGION 明确为 intl/singapore
    // 2. 或 DASHSCOPE_BASE_URL 包含 "intl" 关键词
    // 注意：国内版 URL 是 dashscope.aliyuncs.com（不含 intl）
    const isInternational =
      region.toLowerCase() === "intl" ||
      region.toLowerCase() === "singapore" ||
      (dashscopeBaseUrl && dashscopeBaseUrl.includes("-intl"));

    // 正确的 API 端点（不含 -max）
    // 北京地域：https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation
    // 新加坡地域：https://dashscope-intl.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation
    this.baseUrl = isInternational
      ? "https://dashscope-intl.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation"
      : "https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation";

    logger.info(`[Qwen Image Max] 区域检测 - REGION: "${region}", BASE_URL: "${dashscopeBaseUrl}", 是否国际版: ${isInternational}`);
    logger.info(`[Qwen Image Max] 使用 endpoint: ${this.baseUrl}`);
  }

  /**
   * 生成图片
   */
  async generate(options: {
    prompt: string;
    negative_prompt?: string;
    size?: string;
    prompt_extend?: boolean;
  }): Promise<string> {
    await this.ensureInitialized();

    try {
      logger.info(`[Qwen Image Max] 开始生成图片, prompt: ${options.prompt.substring(0, 50)}...`);

      const payload = {
        model: this.model,
        input: {
          messages: [
            {
              role: "user",
              content: [
                {
                  text: options.prompt,
                },
              ],
            },
          ],
        },
        parameters: {
          negative_prompt: options.negative_prompt || 
            "低分辨率，低画质，肢体畸形，手指畸形，画面过饱和，蜡像感，人脸无细节，过度光滑，画面具有AI感。构图混乱。文字模糊，扭曲。",
          prompt_extend: options.prompt_extend !== undefined ? options.prompt_extend : true,
          watermark: false,
          size: options.size || "1664*928", // 默认宽屏尺寸
        },
      };

      const response = await axios.post<QwenImageMaxResponse>(
        this.baseUrl,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${this.apiKey}`,
          },
          timeout: 60000, // 60 秒超时
        },
      );

      const choiceImage = (response.data.output as any)?.choices?.[0]?.message?.content?.[0]?.image;
      const imageUrl =
        choiceImage ||
        response.data.output?.results?.[0]?.url ||
        (response.data.output as any)?.images?.[0]?.url ||
        (response.data.output as any)?.images?.[0] ||
        (response.data.output as any)?.image_url ||
        (response.data.output as any)?.image?.url;

      if (!imageUrl) {
        logger.error("[Qwen Image Max] 响应未包含图片 URL", {
          response: response.data,
        });
        throw new Error("API 响应中没有找到图片 URL");
      }
      logger.info(`[Qwen Image Max] 图片生成成功: ${imageUrl}`);
      
      return imageUrl;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const errorMsg = error.response?.data?.message || error.message;
        logger.error(`[Qwen Image Max] 生成失败: ${errorMsg}`);
        throw new Error(`Qwen Image Max 生成失败: ${errorMsg}`);
      }
      throw error;
    }
  }

  /**
   * 生成海报（复用 generate 方法）
   */
  async generatePoster(options: {
    title: string;
    sub_title?: string;
    prompt_text_zh: string;
    aspectRatio?: string;
  }): Promise<string> {
    // 将海报参数转换为图片生成参数
    const fullPrompt = `${options.prompt_text_zh}\n标题: ${options.title}${
      options.sub_title ? `\n副标题: ${options.sub_title}` : ""
    }`;

    // 根据 aspectRatio 设置尺寸
    let size = "1664*928"; // 默认宽屏
    if (options.aspectRatio === "16:9") {
      size = "1664*936";
    } else if (options.aspectRatio === "1:1") {
      size = "1024*1024";
    } else if (options.aspectRatio === "9:16") {
      size = "936*1664";
    }

    return await this.generate({
      prompt: fullPrompt,
      size: size,
      prompt_extend: true,
    });
  }

  /**
   * 获取结果（为了兼容基类接口，但 Qwen Image Max 是同步的，不需要此方法）
   */
  protected getResult(output: any): string {
    return output.results?.[0]?.url || "";
  }
}
