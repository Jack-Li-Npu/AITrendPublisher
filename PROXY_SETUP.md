# Gemini 中转模式配置 - 简化版

## 🎯 核心逻辑

**中转模式 = 只是替换 Base URL 和 API Key，其他完全一样！**

```
官方模式: GEMINI_BASE_URL + GEMINI_API_KEY
中转模式: PROXY_BASE_URL + PROXY_API_KEY
```

## 📝 配置方法

### 1. 在 `.env` 文件配置

```bash
# 官方模式配置
GEMINI_BASE_URL=https://generativelanguage.googleapis.com/v1beta
GEMINI_API_KEY="你的官方API密钥"

# 中转模式配置
PROXY_BASE_URL="https://api.jacklihome.com"
PROXY_API_KEY="sk-fa13627c5052be8524e6cb4a1ffea0ca3890ccfda7a6e89adb7c8d26358f7ebc"

# 选择模式（切换这一行即可）
API_SOURCE_TYPE="proxy"   # 中转模式
# API_SOURCE_TYPE="official"  # 官方模式

# 模型选择
AI_SUMMARIZER_LLM_PROVIDER="GEMINI:gemini-2.0-flash"
```

### 2. 或在前端配置中心

1. 打开 `http://localhost:8000`
2. 点击「⚙️ 配置中心」
3. 选择标签：
   - 「🏢 官方 API」→ 使用 `GEMINI_BASE_URL`
   - 「🔄 中转服务」→ 使用 `PROXY_BASE_URL`
4. 保存

## 🔍 实现原理

### gemini-llm.ts 的 refresh() 方法

```typescript
async refresh(): Promise<void> {
  const apiSourceType = await this.configManager.get("API_SOURCE_TYPE");
  
  if (apiSourceType === "proxy") {
    // 中转模式：使用 PROXY_ 配置
    this.baseURL = await this.configManager.get("PROXY_BASE_URL");
    this.apiKey = await this.configManager.get("PROXY_API_KEY");
  } else {
    // 官方模式：使用 GEMINI_ 配置
    this.baseURL = await this.configManager.get("GEMINI_BASE_URL");
    this.apiKey = await this.configManager.get("GEMINI_API_KEY");
  }
  
  // 剩下的流程完全一样！
}
```

就这么简单！✨

## ✅ 验证

启动应用后查看日志：

**中转模式：**
```
[GeminiLLM] 🔄 中转模式: 使用 https://api.jacklihome.com
```

**官方模式：**
```
（没有特殊日志，直接使用官方 API）
```

## 🚀 测试

```bash
# 1. 测试代理连接
deno run --allow-net --allow-env scripts/test-gemini-proxy.ts

# 2. 启动应用
deno task start

# 3. 运行工作流测试
```

就这么简单！不需要复杂的逻辑。🎉
