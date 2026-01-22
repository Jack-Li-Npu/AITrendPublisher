import { DingdingNotify } from "../dingding.notify.ts";
import { ConfigManager } from "@src/utils/config/config-manager.ts";
import { Logger } from "@zilla/logger";
import { assertEquals } from "@std/assert";

const logger = new Logger("test-notify");

// 创建测试实例和配置管理器
const configManager = ConfigManager.getInstance();

// 在测试开始前设置配置
const setupConfig = async () => {
  // 设置钉钉通知的配置
  await configManager.initDefaultConfigSources();
};

Deno.test("测试钉钉通知初始化", async () => {
  await setupConfig();
  const dingdingNotify = new DingdingNotify();
  await dingdingNotify.refresh();
  logger.info("钉钉通知初始化完成");
});

Deno.test("测试发送文本通知", async () => {
  await setupConfig();
  const dingdingNotify = new DingdingNotify();
  const result = await dingdingNotify.notify(
    "测试通知",
    "这是一条来自 TrendFinder 的测试消息",
  );
  assertEquals(result, true);
  logger.info("成功发送文本通知");
});

Deno.test("测试发送成功通知", async () => {
  await setupConfig();
  const dingdingNotify = new DingdingNotify();
  const result = await dingdingNotify.success("操作成功", "数据处理已完成");
  assertEquals(result, true);
  logger.info("成功发送成功通知");
});

Deno.test("测试发送错误通知（@所有人）", async () => {
  await setupConfig();
  const dingdingNotify = new DingdingNotify();
  const result = await dingdingNotify.error("系统错误", "服务器连接失败");
  assertEquals(result, true);
  logger.info("成功发送错误通知");
});

Deno.test("测试发送警告通知（@所有人）", async () => {
  await setupConfig();
  const dingdingNotify = new DingdingNotify();
  const result = await dingdingNotify.warning("系统警告", "CPU使用率超过90%");
  assertEquals(result, true);
  logger.info("成功发送警告通知");
});

Deno.test("测试发送带链接的通知", async () => {
  await setupConfig();
  const dingdingNotify = new DingdingNotify();
  const result = await dingdingNotify.notify(
    "新任务通知",
    "发现新的数据处理任务",
    {
      url: "https://example.com/tasks/123",
      level: "active",
    },
  );
  assertEquals(result, true);
  logger.info("成功发送带链接的通知");
});
