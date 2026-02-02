/**
 * 图片生成器接口
 */
import { Buffer } from "node:buffer";
export interface ImageGenerator {
  /**
   * 初始化生成器
   */
  initialize(): Promise<void>;

  /**
   * 刷新配置
   */
  refresh(): Promise<void>;

  /**
   * 生成图片
   * @param options 生成选项
   * @returns 生成结果（可能是Buffer或URL）
   */
  generate(options: any): Promise<Buffer | string>;

  /**
   * 将生成的图片保存到文件
   * @param options 生成选项
   * @param outputPath 输出路径
   */
  saveToFile(options: any, outputPath: string): Promise<void>;
}

/**
 * 图片生成器类型
 */
export enum ImageGeneratorType {
  TEXT_LOGO = "TEXT_LOGO",
  PDD920_LOGO = "PDD920_LOGO",
  QWEN_IMAGE_MAX = "QWEN_IMAGE_MAX",
  GEMINI = "GEMINI",
  GEMINI_PRO = "GEMINI_PRO",
}

/**
 * 图片生成器类型映射
 */
export interface ImageGeneratorTypeMap {
  [ImageGeneratorType.TEXT_LOGO]:
    import("@src/providers/image-gen/text-logo.ts").TextLogoGenerator;
  [ImageGeneratorType.PDD920_LOGO]:
    import("@src/providers/image-gen/pdd920-logo.ts").PDD920LogoGenerator;
  [ImageGeneratorType.QWEN_IMAGE_MAX]:
    import("@src/providers/image-gen/aliyun/qwen-image-max.image-generator.ts").QwenImageMaxGenerator;
  [ImageGeneratorType.GEMINI]:
    import("@src/providers/image-gen/gemini/gemini-image-generator.ts").GeminiImageGenerator;
  [ImageGeneratorType.GEMINI_PRO]:
    import("@src/providers/image-gen/gemini/gemini-image-generator.ts").GeminiImageGenerator;
}
