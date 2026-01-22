export interface Workflow {
  /**
   * 执行工作流的主要处理逻辑
   */
  process(): Promise<void>;
}
