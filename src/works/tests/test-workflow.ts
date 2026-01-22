import { DataProcessingWorkflow } from "@src/works/example-workflow.ts";
import { Logger } from "@zilla/logger";

const logger = new Logger("test-workflow");

const workflow = new DataProcessingWorkflow({
  id: "test-workflow",
  env: {
    API_KEY: "your-api-key",
    DATABASE_URL: "your-database-url",
  },
});

Deno.test("执行工作流并获取统计信息", async () => {
  // 执行工作流
  await workflow.execute({
    payload: {
      userId: "user123",
      taskType: "data-processing",
      metadata: { source: "api" },
    },
    id: "workflow-123",
    timestamp: Date.now(),
  });

  // 获取特定工作流的统计信息
  const stats = workflow.getWorkflowStats("workflow-123");

  logger.info("Workflow stats:", stats);

  // 获取所有工作流的统计信息
  const allStats = workflow.getAllWorkflowStats();
  logger.info("All workflow stats:", allStats);
});
