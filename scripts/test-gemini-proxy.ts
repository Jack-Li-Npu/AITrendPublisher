#!/usr/bin/env -S deno run --allow-net --allow-env

/**
 * Gemini API 代理测试脚本
 * 
 * 用途：测试通过自定义代理访问 Gemini API
 * 
 * 使用方法：
 * 1. 直接运行：deno run --allow-net --allow-env scripts/test-gemini-proxy.ts
 * 2. 或者给脚本执行权限后直接运行：./scripts/test-gemini-proxy.ts
 */

// 配置
const GOOGLE_GEMINI_BASE_URL = "https://api.jacklihome.com";
const GEMINI_API_KEY = "sk-fa13627c5052be8524e6cb4a1ffea0ca3890ccfda7a6e89adb7c8d26358f7ebc";
const GEMINI_MODEL = "gemini-2.0-flash";

console.log("========================================");
console.log("🧪 Gemini API 代理测试");
console.log("========================================\n");

console.log("📋 配置信息：");
console.log(`   Base URL: ${GOOGLE_GEMINI_BASE_URL}`);
console.log(`   Model: ${GEMINI_MODEL}`);
console.log(`   API Key: ${GEMINI_API_KEY.substring(0, 20)}...`);
console.log("");

// 构建请求 URL（Gemini 原生协议）
const endpoint = `${GOOGLE_GEMINI_BASE_URL}/v1beta/models/${GEMINI_MODEL}:generateContent`;

console.log(`🔗 请求地址: ${endpoint}\n`);

// 构建请求体（Gemini 原生格式）
const requestBody = {
  contents: [
    {
      parts: [
        {
          text: "你好！请用一句话介绍 AI 技术的发展趋势。"
        }
      ]
    }
  ],
  generationConfig: {
    temperature: 0.7,
    maxOutputTokens: 200
  }
};

console.log("📤 发送请求...\n");

try {
  const startTime = Date.now();
  
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": GEMINI_API_KEY, // Gemini 原生协议使用 x-goog-api-key
    },
    body: JSON.stringify(requestBody),
  });

  const elapsed = Date.now() - startTime;

  console.log(`⏱️  响应时间: ${elapsed}ms`);
  console.log(`📊 HTTP 状态: ${response.status} ${response.statusText}\n`);

  if (!response.ok) {
    const errorText = await response.text();
    console.error("❌ 请求失败！");
    console.error("错误详情：");
    console.error(errorText);
    Deno.exit(1);
  }

  const data = await response.json();

  console.log("✅ 请求成功！\n");
  console.log("========================================");
  console.log("📝 响应内容：");
  console.log("========================================\n");

  // 提取并打印 Gemini 响应内容
  if (data.candidates && data.candidates.length > 0) {
    const firstCandidate = data.candidates[0];
    if (firstCandidate.content && firstCandidate.content.parts) {
      const text = firstCandidate.content.parts
        .map((part: any) => part.text)
        .join("");
      console.log(text);
    } else {
      console.log("⚠️  响应格式不包含文本内容");
      console.log(JSON.stringify(data, null, 2));
    }
  } else {
    console.log("⚠️  没有找到候选响应");
    console.log(JSON.stringify(data, null, 2));
  }

  console.log("\n========================================");
  console.log("🎉 测试完成！代理配置正常工作");
  console.log("========================================");

} catch (error) {
  console.error("\n❌ 测试失败！");
  console.error("错误信息：", error.message);
  
  if (error instanceof TypeError && error.message.includes("fetch")) {
    console.error("\n💡 提示：可能是网络连接问题或代理地址不正确");
  }
  
  Deno.exit(1);
}
