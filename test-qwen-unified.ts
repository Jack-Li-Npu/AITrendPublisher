#!/usr/bin/env -S deno run -A --env-file=.env

/**
 * Qwen/DashScope 统一配置验证脚本
 * 用于测试：
 * 1. DASHSCOPE_API_KEY 是否能作为 Qwen 的 API Key
 * 2. DASHSCOPE_REGION 是否能正确联动 BaseURL
 * 3. 实时刷新机制
 */

import { LLMFactory } from "./src/providers/llm/llm-factory.ts";
import { ConfigManager } from "./src/utils/config/config-manager.ts";

async function runTest() {
  console.log("🚀 开始 Qwen 统一配置测试...");
  console.log("━".repeat(50));

  // 初始化 ConfigManager
  const configManager = ConfigManager.getInstance();
  await configManager.initDefaultConfigSources();
  
  // 1. 检查环境变量加载情况（直接从 Deno.env 读取更可靠）
  const dashKey = Deno.env.get("DASHSCOPE_API_KEY");
  const qwenKey = Deno.env.get("QWEN_API_KEY");
  const region = Deno.env.get("DASHSCOPE_REGION") || "cn";

  console.log(`环境变量检查:`);
  console.log(`- DASHSCOPE_API_KEY: ${dashKey ? (dashKey.substring(0, 8) + "********") : "未设置"}`);
  console.log(`- QWEN_API_KEY: ${qwenKey ? (qwenKey.substring(0, 8) + "********") : "未设置 (将使用 DashScope Key)"}`);
  console.log(`- DASHSCOPE_REGION: ${region}`);

  if (!dashKey && !qwenKey) {
    console.error("❌ 错误: 未检测到任何阿里云相关的 API Key，请检查 .env 文件");
    return;
  }

  // 2. 初始化 Qwen 提供者
  try {
    const factory = LLMFactory.getInstance();
    // 强制刷新配置，模拟 UI 保存后的行为
    await factory.refreshAllProviders();
    
    const provider = await factory.getLLMProvider("QWEN:qwen-plus");
    
    // 强制访问私有属性进行验证 (Deno 允许这种黑科技进行调试)
    const anyProvider = provider as any;
    console.log(`\n内部状态验证:`);
    console.log(`- Base URL: ${anyProvider.baseURL}`);
    console.log(`- Token: ${anyProvider.token ? (anyProvider.token.substring(0, 8) + "********") : "为空"}`);
    console.log(`- Model: ${anyProvider.defaultModel}`);

    // 检查联动逻辑
    const expectedDomain = region === "intl" ? "dashscope-intl.aliyuncs.com" : "dashscope.aliyuncs.com";
    if (anyProvider.baseURL.includes(expectedDomain)) {
      console.log(`✅ URL 区域联动逻辑正确 (${expectedDomain})`);
    } else {
      console.error(`❌ URL 区域联动逻辑错误！期望包含 ${expectedDomain}`);
    }

    // 3. 发起真实调用
    console.log(`\n📡 正在向阿里云发送测试请求...`);
    const startTime = Date.now();
    
    const response = await provider.createChatCompletion([
      { role: "user", content: "你好，请回复'配置测试通过'。" }
    ], { max_tokens: 20 });

    const duration = Date.now() - startTime;
    const content = response.choices?.[0]?.message?.content;

    console.log(`✅ 调用成功！`);
    console.log(`⏱️  耗时: ${duration}ms`);
    console.log(`📝 响应: ${content}`);
    console.log(`\n✨ 测试通过！你的 Qwen 配置已完全跑通。`);

  } catch (error) {
    console.error(`\n❌ 测试失败:`);
    console.error(`错误详情: ${error instanceof Error ? error.message : String(error)}`);
    
    if (error.message.includes("401")) {
      console.log("\n💡 建议: HTTP 401 表示 Key 无效。请确认你的 Key 是国内版还是国际版，并与 Region 设置匹配。");
    } else if (error.message.includes("Model not exist")) {
      console.log("\n💡 建议: 该模型在当前 Region 不可用。请尝试切换 DASHSCOPE_REGION 或更换模型名称（如 qwen-plus）。");
    }
  }
}

runTest();
