#!/usr/bin/env -S deno run -A --env-file=.env

/**
 * 环境变量加载调试脚本
 * 直接读取 Deno.env 和手动解析 .env 文件进行对比
 */

console.log("🔍 环境变量加载调试\n");
console.log("=".repeat(60));

// 1. 直接从 Deno.env 读取（--env-file 加载后的结果）
console.log("\n📦 方法1: Deno.env.get() 读取（--env-file 加载后）");
console.log("-".repeat(60));

const keysToCheck = [
  "DASHSCOPE_API_KEY",
  "QWEN_API_KEY", 
  "QWEN_BASE_URL",
  "QWEN_MODEL",
  "DASHSCOPE_REGION",
  "AI_SUMMARIZER_LLM_PROVIDER",
];

for (const key of keysToCheck) {
  const value = Deno.env.get(key);
  if (value) {
    const displayValue = value.length > 30 
      ? value.substring(0, 20) + "..." + value.substring(value.length - 5)
      : value;
    console.log(`✅ ${key}: ${displayValue}`);
  } else {
    console.log(`❌ ${key}: 未设置`);
  }
}

// 2. 手动解析 .env 文件
console.log("\n📄 方法2: 手动解析 .env 文件内容");
console.log("-".repeat(60));

try {
  const envContent = await Deno.readTextFile(".env");
  const lines = envContent.split("\n");
  
  console.log(`总行数: ${lines.length}`);
  
  let foundKeys = 0;
  let errorLines: string[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // 跳过空行和注释
    if (!line || line.startsWith("#")) continue;
    
    // 尝试匹配 KEY=VALUE 格式
    const match = line.match(/^([A-Z_]+)=(.*)$/);
    
    if (match) {
      const key = match[1];
      let value = match[2];
      
      // 移除外层引号
      if ((value.startsWith('"') && value.endsWith('"')) || 
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.substring(1, value.length - 1);
      }
      
      if (keysToCheck.includes(key)) {
        foundKeys++;
        const displayValue = value.length > 30 
          ? value.substring(0, 20) + "..." + value.substring(value.length - 5)
          : value;
        console.log(`第 ${i + 1} 行 - ${key}: ${displayValue}`);
      }
    } else if (line.length > 0) {
      // 记录无法识别的行
      errorLines.push(`第 ${i + 1} 行: ${line.substring(0, 50)}${line.length > 50 ? "..." : ""}`);
    }
  }
  
  console.log(`\n✅ 手动解析找到 ${foundKeys} 个目标配置项`);
  
  if (errorLines.length > 0) {
    console.log("\n⚠️  发现可能有问题的行（格式不标准）:");
    errorLines.forEach(err => console.log(`   ${err}`));
  }
  
} catch (error) {
  console.error("❌ 读取 .env 文件失败:", error);
}

// 3. 结论
console.log("\n" + "=".repeat(60));
console.log("📊 结论:");
console.log("=".repeat(60));

const denoEnvHasKey = Deno.env.get("DASHSCOPE_API_KEY");
if (denoEnvHasKey) {
  console.log("✅ Deno 成功加载了 DASHSCOPE_API_KEY");
  console.log("   后续调用可以正常使用");
} else {
  console.log("❌ Deno 未能加载 DASHSCOPE_API_KEY");
  console.log("   这表示 .env 文件存在格式错误，导致 Deno 的");
  console.log("   --env-file 解析器放弃了加载");
  console.log("\n💡 解决方案：");
  console.log("   请检查上面列出的'可能有问题的行'");
  console.log("   确保每一行都是标准的 KEY=\"VALUE\" 格式");
  console.log("   特别注意不要有嵌套的引号或等号");
}
