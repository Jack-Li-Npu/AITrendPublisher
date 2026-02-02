// 1. 初始化日志收集器（必须在所有其他 import 之前，以拦截 console 方法）
import { LogCollector } from "@src/utils/log-collector.ts";
LogCollector.getInstance();

// 2. 其他模块导入
import { startCronJobs } from "@src/controllers/cron.ts";
import { ConfigManager } from "@src/utils/config/config-manager.ts";
import { Logger, LogLevel } from "@zilla/logger";
import startServer from "@src/server.ts";

async function bootstrap() {

  const configManager = ConfigManager.getInstance();
  await configManager.initDefaultConfigSources();

  Logger.level = LogLevel.INFO;

  // 2. 启动服务
  startCronJobs();
  startServer(8000);

  // 3. 自动打开浏览器 (仅在非 CI 环境下)
  if (!Deno.env.get("CI")) {
    const url = "http://localhost:8000";
    console.log(`[系统] 正在为您打开控制面板: ${url}`);
    
    let command: string;
    let args: string[] = [];

    switch (Deno.build.os) {
      case "windows":
        command = "cmd";
        args = ["/c", "start", url];
        break;
      case "darwin":
        command = "open";
        args = [url];
        break;
      default:
        command = "xdg-open";
        args = [url];
    }

    try {
      const process = new Deno.Command(command, { args });
      await process.spawn();
    } catch (e) {
      console.warn(`[系统] 无法自动打开浏览器，请手动访问: ${url}`);
    }
  }
}

bootstrap().catch(console.error);
