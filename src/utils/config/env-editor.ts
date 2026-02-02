import { Logger } from "@zilla/logger";

const logger = new Logger("env-editor");

export interface EnvConfig {
  [key: string]: string;
}

/**
 * 环境变量编辑器 - 专门用于读写磁盘上的 .env 文件
 * 能够保留原有注释和空行
 */
export class EnvEditor {
  private envPath: string;

  constructor(envPath: string = ".env") {
    this.envPath = envPath;
  }

  /**
   * 读取 .env 文件并解析为键值对
   */
  async readConfig(): Promise<EnvConfig> {
    try {
      const content = await Deno.readTextFile(this.envPath);
      return this.parse(content);
    } catch (error) {
      if (error instanceof Deno.errors.NotFound) {
        logger.warn(`.env 文件不存在: ${this.envPath}，将返回空配置`);
        return {};
      }
      throw error;
    }
  }

  /**
   * 将新配置合并并保存到 .env 文件，保留注释和格式
   */
  async saveConfig(newConfig: EnvConfig): Promise<void> {
    let content = "";
    try {
      content = await Deno.readTextFile(this.envPath);
    } catch (error) {
      if (!(error instanceof Deno.errors.NotFound)) {
        throw error;
      }
    }

    const lines = content.split("\n");
    const updatedLines: string[] = [];
    const processedKeys = new Set<string>();

    // 1. 遍历现有行，更新已有的键
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) {
        updatedLines.push(line);
        continue;
      }

      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        if (newConfig[key] !== undefined) {
          updatedLines.push(`${key}="${newConfig[key]}"`);
          processedKeys.add(key);
        } else {
          updatedLines.push(line);
        }
      } else {
        updatedLines.push(line);
      }
    }

    // 2. 添加文件中不存在的新键
    for (const [key, value] of Object.entries(newConfig)) {
      if (!processedKeys.has(key)) {
        updatedLines.push(`${key}="${value}"`);
      }
    }

    await Deno.writeTextFile(this.envPath, updatedLines.join("\n"));
    logger.info(`已成功保存配置到 ${this.envPath}`);

    // 3. 同步更新 Deno.env 内存中的值
    for (const [key, value] of Object.entries(newConfig)) {
      Deno.env.set(key, value);
    }
  }

  /**
   * 简单的 .env 解析逻辑
   */
  private parse(content: string): EnvConfig {
    const config: EnvConfig = {};
    const lines = content.split("\n");

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;

      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        let value = match[2] || "";
        // 移除引号
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.substring(1, value.length - 1);
        } else if (value.startsWith("'") && value.endsWith("'")) {
          value = value.substring(1, value.length - 1);
        }
        config[match[1]] = value.trim();
      }
    }

    return config;
  }
}
