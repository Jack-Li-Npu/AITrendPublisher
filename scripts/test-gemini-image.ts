#!/usr/bin/env -S deno run --allow-net --allow-env

/**
 * Gemini Imagen 3 图片生成测试脚本
 * 
 * 用途：测试通过自定义代理调用 Gemini Imagen 3 图片生成模型
 */

// 配置
const GOOGLE_GEMINI_BASE_URL = "https://api.jacklihome.com";
const GEMINI_API_KEY = "sk-fa13627c5052be8524e6cb4a1ffea0ca3890ccfda7a6e89adb7c8d26358f7ebc";
const IMAGE_MODEL = "gemini-3-pro-preview"; // 用户提供的测试模型名称

console.log("========================================");
console.log("🎨 Gemini 图片生成测试 (Imagen 3)");
console.log("========================================\n");

console.log("📋 配置信息：");
console.log(`   Base URL: ${GOOGLE_GEMINI_BASE_URL}`);
console.log(`   Model: ${IMAGE_MODEL}`);
console.log(`   API Key: ${GEMINI_API_KEY.substring(0, 20)}...`);
console.log("");

// 构建请求 URL
const endpoint = `${GOOGLE_GEMINI_BASE_URL}/v1beta/models/${IMAGE_MODEL}:generateContent`;

console.log(`🔗 请求地址: ${endpoint}\n`);

// 构建请求体 (根据 Gemini 3 Pro Image API 规范)
const requestBody = {
  contents: [
    {
      parts: [
        {
          text: "Create a professional tech-style infographic about AI development trends in 2026. Futuristic colors, clean design, 16:9 ratio."
        }
      ]
    }
  ],
  generationConfig: {
    responseModalities: ["TEXT", "IMAGE"]
  }
};

console.log("📤 发送图片生成请求 (可能需要 10-30 秒)...\n");

try {
  const startTime = Date.now();
  
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": GEMINI_API_KEY,
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

  // 提取图片数据
  if (data.candidates && data.candidates.length > 0) {
    const parts = data.candidates[0].content?.parts;
    let foundImage = false;

    if (parts) {
      for (const part of parts) {
        if (part.inlineData && part.inlineData.mimeType.startsWith("image/")) {
          const mimeType = part.inlineData.mimeType;
          const base64Data = part.inlineData.data;
          console.log(`🖼️  成功提取到图片！`);
          console.log(`   类型: ${mimeType}`);
          console.log(`   数据长度: ${Math.round(base64Data.length / 1024)} KB`);
          
          // 保存到本地文件进行预览
          const fileName = `test-generated-image.${mimeType.split("/")[1]}`;
          const buffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
          await Deno.writeFile(fileName, buffer);
          
          console.log(`\n💾 图片已保存至: ${fileName}`);
          foundImage = true;
          break;
        }
      }
    }

    if (!foundImage) {
      console.log("⚠️  响应中没有找到图片数据。");
      console.log("📄 完整响应数据:");
      console.log(JSON.stringify(data, null, 2));
      // 检查是否有文本（可能包含拒绝生成的原因）
      if (parts) {
        for (const part of parts) {
          if (part.text) {
            console.log("📝 模型返回文本:", part.text);
          }
        }
      }
    }
  } else {
    console.log("⚠️  没有找到候选响应。");
    console.log(JSON.stringify(data, null, 2));
  }

  console.log("\n========================================");
  console.log("🎉 测试完成！");
  console.log("========================================");

} catch (error) {
  console.error("\n❌ 测试失败！");
  console.error("错误信息：", error.message);
  Deno.exit(1);
}
