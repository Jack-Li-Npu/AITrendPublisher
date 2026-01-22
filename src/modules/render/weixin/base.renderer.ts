import ejs from "npm:ejs";
import { ConfigManager } from "@src/utils/config/config-manager.ts";
import { join } from "node:path";
import { Logger } from "@zilla/logger";

const logger = new Logger("base-template-renderer");

/**
 * 基础模板渲染器类
 */
export abstract class BaseTemplateRenderer<T extends ejs.Data> {
  protected templates: { [key: string]: string } = {};
  protected configManager: ConfigManager;
  protected availableTemplates: string[] = [];
  protected templatePrefix: string;

  constructor(templatePrefix: string) {
    this.templatePrefix = templatePrefix;
    this.configManager = ConfigManager.getInstance();
    // 初始化时异步加载模板
    this.initializeTemplates();
  }

  /**
   * 初始化并加载模板
   */
  public async initializeTemplates(): Promise<void> {
    try {
      await this.loadTemplates();
    } catch (error) {
      logger.error("模板加载失败:", error);
      throw error;
    }
  }

  /**
   * 获取模板文件内容
   * @param templatePath 模板文件路径
   * @returns 模板内容
   */
  protected async getTemplateContent(templatePath: string): Promise<string> {
    const decoder = new TextDecoder("utf-8");

    // 1. 首先尝试从exe内部资源加载
    try {
      // 使用 Deno.stat 检查资源是否存在
      logger.info("import.meta.dirname", import.meta.dirname);
      const stat = await Deno.stat(import.meta.dirname + templatePath);
      if (stat.isFile) {
        const bundledTemplate = await Deno.readFile(
          import.meta.dirname + templatePath,
        );
        return decoder.decode(bundledTemplate);
      }
    } catch (error) {
      logger.error("从exe内部加载模板文件失败，尝试其他方式:", error);
    }

    // 2. 尝试使用相对于当前工作目录的路径（开发时使用）
    try {
      const absolutePath = join(Deno.cwd(), templatePath);
      const fileContent = Deno.readFileSync(absolutePath);
      if (fileContent) {
        return decoder.decode(fileContent);
      }
    } catch (error) {
      logger.error("从工作目录加载模板文件失败:", error);
    }

    // 3. 最后尝试从可执行文件目录加载
    try {
      const execPath = Deno.execPath();
      const execDir = execPath.substring(
        0,
        execPath.lastIndexOf(Deno.build.os === "windows" ? "\\" : "/"),
      );
      const resourcePath = join(execDir, templatePath);
      const fileContent = Deno.readFileSync(resourcePath);
      if (fileContent) {
        return decoder.decode(fileContent);
      }
    } catch (error2) {
      logger.error("从可执行文件目录加载失败:", error2);
    }

    // 如果所有尝试都失败，抛出错误
    throw new Error(
      `无法加载模板文件: ${templatePath}，请确保模板文件存在且路径正确。
请检查以下路径：
1. ${templatePath} (exe内部)
2. ${join(Deno.cwd(), templatePath)} (工作目录)
3. ${join(Deno.execPath(), "..", templatePath)} (可执行文件目录)`,
    );
  }

  /**
   * 加载模板文件
   */
  protected abstract loadTemplates(): Promise<void>;

  /**
   * 从配置中获取模板类型
   * @returns 配置的模板类型或默认值
   */
  protected async getTemplateTypeFromConfig(): Promise<string> {
    try {
      const configKey = `${this.templatePrefix.toUpperCase()}_TEMPLATE_TYPE`;
      const configValue = await this.configManager.get<string>(configKey);

      if (configValue === "random") {
        return this.getRandomTemplateType();
      }
      return configValue;
    } catch (error: any) {
      logger.error(`未找到${this.templatePrefix}模板配置，使用默认模板`, error);
      return this.availableTemplates[0];
    }
  }

  /**
   * 随机选择一个模板类型
   * @returns 随机选择的模板类型
   */
  protected getRandomTemplateType(): string {
    const randomIndex = Math.floor(
      Math.random() * this.availableTemplates.length,
    );
    return this.availableTemplates[randomIndex];
  }

  protected abstract doRender(data: T, template: string): Promise<string>;

  /**
   * 渲染模板
   * @param data 渲染数据
   * @param templateType 模板类型，或者 'config'（从配置获取）或 'random'（随机选择）
   * @returns 渲染后的 HTML
   */
  public async render(
    data: T,
    templateType?: string,
  ): Promise<string> {
    try {
      let finalTemplateType: string;

      // 如果没有传templateType，从配置获取
      if (!templateType) {
        finalTemplateType = await this.getTemplateTypeFromConfig();
      } else if (templateType === "random") {
        // 如果指定random，随机选择模板
        finalTemplateType = this.getRandomTemplateType();
      } else {
        // 检查指定的模板是否存在
        if (!this.availableTemplates.includes(templateType)) {
          throw new Error(
            `Template type '${templateType}' not found for ${this.templatePrefix}`,
          );
        }
        finalTemplateType = templateType;
      }

      logger.info(`使用${this.templatePrefix}模板: ${finalTemplateType}`);

      const template = this.templates[finalTemplateType];
      if (!template) {
        throw new Error(
          `Template '${finalTemplateType}' not found for ${this.templatePrefix}`,
        );
      }

      // 使用 EJS 渲染模板
      return await this.doRender(data, template);
    } catch (error) {
      logger.error("模板渲染失败:", error);
      throw error;
    }
  }
}
