#!/usr/bin/env -S deno run -A --env-file=.env

/**
 * LLM 提供者配置测试脚本
 * 用于验证 DeepSeek、Qwen、Gemini 等 LLM 提供者的配置是否正确
 * 
 * 使用方法:
 *   deno run -A --env-file=.env test-llm-providers.ts [provider]
 * 
 * 参数:
 *   provider - 要测试的提供者，可选值: deepseek, qwen, gemini, all
 *              不提供参数时测试 DEFAULT_LLM_PROVIDER
 */

import { LLMFactory } from "./src/providers/llm/llm-factory.ts";
import { ConfigManager } from "./src/utils/config/config-manager.ts";

const testMessage = [
  {
    role: "user" as const,
    content: "请用一句话介绍 DeepSeek，不超过 30 字。",
  },
];

/**
 * 测试单个 LLM 提供者
 */
async function testProvider(providerConfig: string, providerName: string) {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`🧪 测试 ${providerName} (${providerConfig})`);
  console.log("=".repeat(60));

  try {
    const factory = LLMFactory.getInstance();
    const provider = await factory.getLLMProvider(providerConfig);

    console.log(`✅ 提供者初始化成功`);
    console.log(`📦 当前模型: ${provider.getModel()}`);
    
    if (provider.getAvailableModels) {
      console.log(`📋 可用模型: ${provider.getAvailableModels().join(", ")}`);
    }

    // 测试 API 调用
    console.log(`\n🚀 发送测试请求...`);
    const startTime = Date.now();
    
    const response = await provider.createChatCompletion(testMessage, {
      max_tokens: 100,
      temperature: 0.7,
    });

    const duration = Date.now() - startTime;
    const content = response.choices?.[0]?.message?.content || 
                   response.content || 
                   JSON.stringify(response);

    console.log(`⏱️  响应耗时: ${duration}ms`);
    console.log(`📝 响应内容: ${content.substring(0, 200)}`);
    console.log(`\n✨ ${providerName} 测试通过！\n`);

    return true;
  } catch (error) {
    console.error(`\n❌ ${providerName} 测试失败:`);
    console.error(`   错误信息: ${error instanceof Error ? error.message : String(error)}`);
    
    // 提供配置建议
    const configPrefix = providerConfig.split(":")[0];
    console.error(`\n💡 请检查以下配置项:`);
    console.error(`   - ${configPrefix}_BASE_URL`);
    console.error(`   - ${configPrefix}_API_KEY`);
    console.error(`   - ${configPrefix}_MODEL`);
    console.error(`\n   参考: docs/deepseek-qwen-setup-guide.md\n`);

    return false;
  }
}

/**
 * 获取当前配置的提供者列表
 */
async function getConfiguredProviders(): Promise<string[]> {
  const providers: string[] = [];

  // 检查各个提供者的配置（直接从环境变量读取，更可靠）
  const providerConfigs = [
    { name: "DEEPSEEK", key: "DEEPSEEK_API_KEY" },
    { name: "QWEN", key: "QWEN_API_KEY" },
    { name: "GEMINI", key: "GEMINI_API_KEY" },
    { name: "OPENAI", key: "OPENAI_API_KEY" },
    { name: "CLAUDE", key: "CLAUDE_API_KEY" },
  ];

  for (const config of providerConfigs) {
    try {
      // 直接从 Deno.env 读取
      const apiKey = Deno.env.get(config.key);
      // 检查 API Key 是否有效（不为空，不是占位符，长度合理）
      if (apiKey && 
          apiKey.length > 10 && 
          !apiKey.includes('your_api_key') &&
          !apiKey.includes('xxxxxx')) {
        providers.push(config.name);
      }
    } catch {
      // 配置不存在，跳过
    }
  }

  return providers;
}

/**
 * 主函数
 */
async function main() {
  console.log("\n🔧 LLM 提供者配置测试工具");
  console.log("━".repeat(60));

  const args = Deno.args;
  const targetProvider = args[0]?.toLowerCase();

  try {
    // 获取已配置的提供者
    const configuredProviders = await getConfiguredProviders();
    console.log(`\n📋 检测到已配置的提供者: ${configuredProviders.join(", ") || "无"}`);

    if (configuredProviders.length === 0) {
      console.log("\n⚠️  警告: 未检测到任何已配置的 LLM 提供者");
      console.log("   请先配置 .env 文件，参考: docs/deepseek-qwen-setup-guide.md");
      Deno.exit(1);
    }

    // 获取默认提供者
    let defaultProvider = Deno.env.get("DEFAULT_LLM_PROVIDER") || "GEMINI";
    console.log(`⚙️  当前默认提供者: ${defaultProvider}`);

    let testsToRun: Array<{ config: string; name: string }> = [];

    if (!targetProvider) {
      // 未指定参数，测试默认提供者
      testsToRun = [{ config: defaultProvider, name: `默认提供者 (${defaultProvider})` }];
    } else if (targetProvider === "all") {
      // 测试所有已配置的提供者
      testsToRun = configuredProviders.map(p => ({
        config: p,
        name: p,
      }));
    } else {
      // 测试指定的提供者
      const providerMap: Record<string, string> = {
        deepseek: "DEEPSEEK",
        qwen: "QWEN",
        gemini: "GEMINI",
        openai: "OPENAI",
        claude: "CLAUDE",
      };

      const providerConfig = providerMap[targetProvider];
      if (!providerConfig) {
        console.error(`\n❌ 不支持的提供者: ${targetProvider}`);
        console.error(`   支持的提供者: deepseek, qwen, gemini, openai, claude, all`);
        Deno.exit(1);
      }

      if (!configuredProviders.includes(providerConfig)) {
        console.error(`\n❌ 提供者 ${providerConfig} 未配置`);
        console.error(`   请先在 .env 中配置 ${providerConfig}_API_KEY`);
        Deno.exit(1);
      }

      testsToRun = [{ config: providerConfig, name: providerConfig }];
    }

    // 运行测试
    console.log(`\n🎯 准备测试 ${testsToRun.length} 个提供者...\n`);

    const results: Array<{ name: string; success: boolean }> = [];

    for (const test of testsToRun) {
      const success = await testProvider(test.config, test.name);
      results.push({ name: test.name, success });
    }

    // 输出测试总结
    console.log("\n" + "=".repeat(60));
    console.log("📊 测试总结");
    console.log("=".repeat(60));

    const passedCount = results.filter(r => r.success).length;
    const totalCount = results.length;

    results.forEach(result => {
      const icon = result.success ? "✅" : "❌";
      console.log(`${icon} ${result.name}: ${result.success ? "通过" : "失败"}`);
    });

    console.log(`\n总计: ${passedCount}/${totalCount} 通过`);

    if (passedCount === totalCount) {
      console.log("\n🎉 所有测试通过！您的 LLM 配置完全正常。");
      console.log("\n下一步:");
      console.log("  - 运行 'deno task start' 启动应用");
      console.log("  - 访问 http://localhost:8000 使用 UI 界面");
    } else {
      console.log("\n⚠️  部分测试失败，请检查失败提供者的配置。");
      console.log("   参考文档: docs/deepseek-qwen-setup-guide.md");
      Deno.exit(1);
    }

  } catch (error) {
    console.error("\n❌ 测试过程出错:", error);
    if (error instanceof Error) {
      console.error("错误详情:", error.message);
    }
    Deno.exit(1);
  }
}

// 运行主函数
if (import.meta.main) {
  await main();
}
