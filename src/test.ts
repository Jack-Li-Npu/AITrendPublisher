// deno-lint-ignore-file no-unused-vars
import { WeixinArticleWorkflow } from "@src/services/weixin-article.workflow.ts";
import { ConfigManager } from "@src/utils/config/config-manager.ts";
import { Logger, LogLevel } from "@zilla/logger";

const logger = new Logger("test");
Logger.level = LogLevel.DEBUG;

async function bootstrap() {
  const configManager = ConfigManager.getInstance();
  await configManager.initDefaultConfigSources();

  // 解析命令行参数: --mode=XXX --url=XXX --topic=XXX --limit=X 或 --mode XXX
  const args = Deno.args;
  const params: Record<string, string> = {};
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith("-")) {
      // 处理 --key=value 或 -key=value
      if (arg.includes("=")) {
        const prefixLen = arg.startsWith("--") ? 2 : 1;
        const parts = arg.slice(prefixLen).split("=");
        const key = parts[0];
        const value = parts.slice(1).join("=");
        params[key] = value;
      } else {
        // 处理 --key value 或 -key value
        const prefixLen = arg.startsWith("--") ? 2 : 1;
        const key = arg.slice(prefixLen);
        const value = args[i + 1];
        if (value && !value.startsWith("-")) {
          params[key] = value;
          i++; // 跳过下一个参数
        }
      }
    }
  }

  const contentMode = (params.mode || await configManager.get<string>("CONTENT_MODE").catch(() => "TECH_NEWS")) as any;
  const url = params.url;
  const topic = params.topic;
  const limit = params.limit ? parseInt(params.limit) : undefined;

  logger.info(`启动测试: 模式=${contentMode}, URL=${url || '未指定'}, 主题=${topic || '未指定'}, 限制=${limit || '默认'}`);

  const weixinWorkflow = new WeixinArticleWorkflow({
    id: "test-workflow",
    env: {
      name: "test-workflow",
    },
  });

  await weixinWorkflow.execute({
    payload: {
      contentMode,
      url,
      topic,
      maxArticles: limit,
    },
    id: "manual-action",
    timestamp: Date.now(),
  });

  const stats = weixinWorkflow.getWorkflowStats("manual-action");
  logger.debug("工作流执行完成, 统计信息:", stats);
}

bootstrap().catch(console.error);
