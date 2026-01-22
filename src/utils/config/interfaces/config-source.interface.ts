export interface IConfigSource {
  /**
   * 配置源的优先级，数字越小优先级越高
   */
  priority: number;

  /**
   * 获取配置值
   * @param key 配置键
   * @returns 配置值的Promise，如果未找到返回null
   */
  get<T>(key: string): Promise<T | null>;
}
