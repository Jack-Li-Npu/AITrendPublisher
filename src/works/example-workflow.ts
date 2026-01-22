import {
  WorkflowEntrypoint,
  WorkflowEnv,
  WorkflowEvent,
  WorkflowStep,
} from "./workflow.ts";
import { Logger } from "@zilla/logger";

const logger = new Logger("example-workflow");

// 环境变量类型定义
type Env = {
  API_KEY: string;
  DATABASE_URL: string;
};

// 工作流参数类型定义
type WorkflowParams = {
  userId: string;
  taskType: string;
  metadata: Record<string, any>;
};

export class DataProcessingWorkflow
  extends WorkflowEntrypoint<Env, WorkflowParams> {
  // 获取工作流统计信息
  getWorkflowStats(eventId: string) {
    return this.metricsCollector.getWorkflowEventMetrics(this.env.id, eventId);
  }

  // 获取所有工作流统计信息
  getAllWorkflowStats() {
    return this.metricsCollector.getAllWorkflowEventMetrics(this.env.id);
  }

  async run(
    event: WorkflowEvent<WorkflowParams>,
    step: WorkflowStep,
  ): Promise<void> {
    logger.info(
      `Starting data processing workflow for user ${event.payload.userId}`,
    );

    // 第一步：数据获取
    const userData = await step.do("fetch-user-data", async () => {
      await step.sleep("fetching-user-data", "5 second");

      return await Promise.resolve("results");
    });

    // 第二步：数据处理（使用重试机制）
    const processedData = await step.do(
      "process-data",
      {
        retries: {
          limit: 3,
          delay: "10 second",
          backoff: "exponential",
        },
        timeout: "1 minute",
      },
      async () => {
        // 模拟数据处理
        const result = await this.processData(userData, event.payload.taskType);
        return result;
      },
    );

    // 等待一段时间
    await step.sleep("cooling-period", "10 second");

    // 第三步：保存结果（使用重试机制）
    await step.do(
      "save-results",
      {
        retries: {
          limit: 5,
          delay: "5 second",
          backoff: "linear",
        },
        timeout: "2 minute",
      },
      async () => {
        // 模拟保存数据
        await this.saveResults(processedData, event.payload.metadata);
      },
    );
  }

  private async processData(data: any, taskType: string): Promise<any> {
    // 模拟数据处理逻辑
    return {
      ...data,
      processed: true,
      taskType,
      timestamp: new Date().toISOString(),
    };
  }

  private async saveResults(
    data: any,
    metadata: Record<string, any>,
  ): Promise<void> {
    // 模拟保存数据的逻辑
    const response = await Promise.resolve({ ok: true });

    if (!response.ok) {
      throw new Error(`Failed to save results: ${response}`);
    }
  }
}
