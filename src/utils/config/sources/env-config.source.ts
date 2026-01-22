import { IConfigSource } from "@src/utils/config/interfaces/config-source.interface.ts";

/**
 * 环境变量配置源
 * 使用 Deno.env 读取环境变量（配合 deno run --env 自动加载 .env 文件）
 */
export class EnvConfigSource implements IConfigSource {
  constructor(public priority: number = 100) {
    // Deno 2.0+ 使用 --env 标志自动加载 .env 文件
    // 无需手动调用 dotenv.config()
  }

  async get<T>(key: string): Promise<T | null> {
    // 使用 Deno.env.get() 读取环境变量
    const value = Deno.env.get(key);
    if (value === undefined) {
      return null;
    }

    try {
      // 尝试解析JSON格式的值
      return JSON.parse(value) as T;
    } catch {
      // 如果不是JSON格式，直接返回字符串值
      return value as unknown as T;
    }
  }
}
