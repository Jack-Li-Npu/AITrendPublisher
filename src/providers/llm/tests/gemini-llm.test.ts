import { GeminiLLM } from "../gemini-llm.ts";
import { ConfigManager } from "@src/utils/config/config-manager.ts";
import { Logger } from "@zilla/logger";

const logger = new Logger("gemini-test");

/**
 * Gemini LLM 测试文件
 * 测试前请确保已配置 GEMINI_API_KEY
 */

async function testBasicCompletion() {
  logger.info("=== 测试基础对话完成 ===");

  const gemini = new GeminiLLM();
  await gemini.initialize();

  const response = await gemini.createChatCompletion([
    {
      role: "system",
      content: "你是一个专业的AI助手，擅长技术解答。",
    },
    {
      role: "user",
      content: "用一句话解释什么是大语言模型？",
    },
  ]);

  logger.info("响应:", response);
  logger.info("内容:", response.choices[0].message.content);
  logger.info("Token使用:", response.usage);
}

async function testMultiTurnConversation() {
  logger.info("=== 测试多轮对话 ===");

  const gemini = new GeminiLLM();
  await gemini.initialize();

  const response = await gemini.createChatCompletion([
    {
      role: "system",
      content: "你是一个友好的助手。",
    },
    {
      role: "user",
      content: "你好，我想了解 TypeScript 的类型系统。",
    },
    {
      role: "assistant",
      content: "你好！TypeScript 的类型系统是其核心特性，它为 JavaScript 提供了静态类型检查。",
    },
    {
      role: "user",
      content: "能举个简单的例子吗？",
    },
  ]);

  logger.info("多轮对话响应:", response.choices[0].message.content);
}

async function testJSONOutput() {
  logger.info("=== 测试 JSON 输出 ===");

  const gemini = new GeminiLLM();
  await gemini.initialize();

  const response = await gemini.createChatCompletion([
    {
      role: "system",
      content:
        "你是一个数据分析助手，总是返回结构化的 JSON 格式数据。",
    },
    {
      role: "user",
      content:
        '请分析"AI技术正在改变世界"这句话，返回JSON格式: { "sentiment": "积极/中性/消极", "keywords": ["关键词数组"], "summary": "总结" }',
    },
  ]);

  const content = response.choices[0].message.content;
  logger.info("JSON响应:", content);

  try {
    const parsed = JSON.parse(content);
    logger.info("解析后的JSON:", parsed);
  } catch (error) {
    logger.error("JSON解析失败:", error);
  }
}

async function testModelSelection() {
  logger.info("=== 测试模型选择 ===");

  // 测试指定特定模型
  const gemini = new GeminiLLM("gemini-1.5-flash");
  await gemini.initialize();

  logger.info("当前模型:", gemini.getModel());
  logger.info("可用模型:", gemini.getAvailableModels());

  // 动态切换模型
  gemini.setModel("gemini-2.0-flash-exp");
  logger.info("切换后的模型:", gemini.getModel());
}

async function testTemperatureControl() {
  logger.info("=== 测试温度参数控制 ===");

  const gemini = new GeminiLLM();
  await gemini.initialize();

  // 低温度 - 更确定性的输出
  logger.info("--- 低温度 (0.3) ---");
  const lowTempResponse = await gemini.createChatCompletion([
    {
      role: "user",
      content: "生成一个创意的产品名称",
    },
  ], { temperature: 0.3 });
  logger.info("低温度输出:", lowTempResponse.choices[0].message.content);

  // 高温度 - 更有创造性的输出
  logger.info("--- 高温度 (1.0) ---");
  const highTempResponse = await gemini.createChatCompletion([
    {
      role: "user",
      content: "生成一个创意的产品名称",
    },
  ], { temperature: 1.0 });
  logger.info("高温度输出:", highTempResponse.choices[0].message.content);
}

async function testErrorHandling() {
  logger.info("=== 测试错误处理 ===");

  try {
    // 测试无效的 API Key
    const configManager = ConfigManager.getInstance();
    const originalKey = await configManager.get("GEMINI_API_KEY");

    // 暂时设置无效的 key
    await configManager.set("GEMINI_API_KEY", "invalid-key");

    const gemini = new GeminiLLM();
    await gemini.initialize();

    await gemini.createChatCompletion([
      {
        role: "user",
        content: "测试",
      },
    ]);
  } catch (error) {
    logger.error("预期的错误被捕获:", (error as Error).message);
  }
}

async function runAllTests() {
  try {
    logger.info("开始 Gemini LLM 测试...\n");

    // 初始化配置管理器（必须在所有测试之前）
    const configManager = ConfigManager.getInstance();
    await configManager.initDefaultConfigSources();
    logger.info("✓ 配置管理器初始化完成\n");

    await testBasicCompletion();
    logger.info("\n");

    await testMultiTurnConversation();
    logger.info("\n");

    await testJSONOutput();
    logger.info("\n");

    await testModelSelection();
    logger.info("\n");

    await testTemperatureControl();
    logger.info("\n");

    // 错误处理测试会破坏配置，放在最后
    // await testErrorHandling();

    logger.info("✓ 所有测试完成！");
  } catch (error) {
    logger.error("测试失败:", error);
    throw error;
  }
}

// 运行测试
if (import.meta.main) {
  runAllTests().catch((error) => {
    logger.error("测试执行失败:", error);
    Deno.exit(1);
  });
}

