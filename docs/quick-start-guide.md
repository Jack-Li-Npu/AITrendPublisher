# 🚀 TrendPublish 快速开始指南

本指南将帮助您在 **10 分钟内**快速启动 TrendPublish 项目。

## 📋 前置要求

- Windows 10+ / macOS / Linux
- 基本的命令行使用知识
- 一个文本编辑器（推荐 VS Code）

## 步骤 1: 安装 Deno (2 分钟)

### Windows (PowerShell)

打开 PowerShell（以管理员身份），运行：

```powershell
irm https://deno.land/install.ps1 | iex
```

### macOS / Linux

打开终端，运行：

```bash
curl -fsSL https://deno.land/install.sh | sh
```

### 验证安装

```bash
deno --version
```

如果看到版本号（如 `deno 2.x.x`），说明安装成功！

## 步骤 2: 下载项目 (1 分钟)

```bash
git clone https://github.com/OpenAISpace/ai-trend-publish.git
cd ai-trend-publish
```

## 步骤 3: 配置环境变量 (5 分钟)

### 3.1 创建配置文件

创建一个名为 `.env` 的文件（在项目根目录）：

### 3.2 最小配置（仅使用 Gemini）

这是最简单的配置，只需一个免费的 Gemini API Key：

```bash
# === 基础配置 ===
# 获取免费 API Key: https://aistudio.google.com/
GEMINI_API_KEY="your-gemini-api-key-here"
GEMINI_MODEL="gemini-2.0-flash-exp"

# 设置 Gemini 为默认模型
DEFAULT_LLM_PROVIDER="GEMINI"
AI_SUMMARIZER_LLM_PROVIDER="GEMINI"
AI_CONTENT_RANKER_LLM_PROVIDER="GEMINI"

# === 可选：通知配置 ===
ENABLE_BARK=false
```

### 3.3 完整配置（推荐）

如果您想使用更多功能，参考以下配置：

```bash
# === LLM 配置 ===
# Gemini（推荐，免费额度高）
GEMINI_API_KEY="your-gemini-api-key"
GEMINI_MODEL="gemini-2.0-flash-exp"

# DeepSeek（可选，推理能力强）
DEEPSEEK_API_KEY="your-deepseek-api-key"
DEEPSEEK_MODEL="deepseek-chat"

# === 模块配置 ===
DEFAULT_LLM_PROVIDER="GEMINI"
AI_SUMMARIZER_LLM_PROVIDER="GEMINI"
AI_CONTENT_RANKER_LLM_PROVIDER="GEMINI"

# === 微信公众号配置（可选）===
WEIXIN_APP_ID="your-app-id"
WEIXIN_APP_SECRET="your-app-secret"
AUTHOR="AI科技空间"

# === 数据抓取配置（可选）===
FIRE_CRAWL_API_KEY="your-firecrawl-key"
X_API_BEARER_TOKEN="your-twitter-key"

# === 数据库配置（可选）===
ENABLE_DB=false

# === 通知配置（可选）===
ENABLE_BARK=false
```

### 3.4 获取 API Keys

#### 🆓 Gemini API Key（免费，推荐）

1. 访问 [Google AI Studio](https://aistudio.google.com/)
2. 登录 Google 账号
3. 点击 "Get API Key" → "Create API Key"
4. 复制 API Key 到 `.env` 文件

**免费额度**:
- 每天 1500 次请求
- 每分钟 10 次请求
- 无需信用卡

#### 💎 DeepSeek API Key（可选）

1. 访问 [DeepSeek 官网](https://platform.deepseek.com/)
2. 注册账号
3. 获取 API Key

## 步骤 4: 运行项目 (2 分钟)

### 4.1 测试运行

```bash
deno task test
```

如果一切正常，您将看到项目开始执行测试工作流。

### 4.2 启动服务

```bash
deno task start
```

这将启动：
- ✅ 定时任务（每天凌晨 3 点执行）
- ✅ API 服务器（端口 3000）
- ✅ 工作流系统

### 4.3 测试 Gemini

```bash
deno task test:gemini
```

## 📖 常用命令

```bash
# 启动服务
deno task start

# 运行测试
deno task test

# 测试 Gemini
deno task test:gemini

# 编译可执行文件（Windows）
deno task build:win

# 编译可执行文件（macOS Intel）
deno task build:mac-x64

# 编译可执行文件（macOS Apple Silicon）
deno task build:mac-arm64

# 编译可执行文件（Linux）
deno task build:linux-x64

# 编译所有平台
deno task build:all
```

## 🎯 下一步

### 基础使用

1. **查看日志**：观察项目运行情况
2. **调整定时任务**：修改 `src/controllers/cron.ts` 中的执行时间
3. **自定义配置**：根据需求调整 `.env` 文件

### 进阶配置

1. **配置微信公众号**：
   - 参考 [微信公众号配置](https://openaispace.github.io/ai-trend-publish/help.html)
   - 设置 IP 白名单

2. **配置多个 LLM**：
   - 为不同模块使用不同的模型
   - 参考 [Gemini 集成指南](./gemini-integration-guide.md)

3. **自定义工作流**：
   - 查看 `src/services/` 目录
   - 创建自己的工作流

### 学习资源

- 📚 [完整文档](../README.md)
- 🔧 [环境配置说明](../ENV_CONFIGURATION.md)
- 🌟 [Gemini 集成指南](./gemini-integration-guide.md)
- 📊 [改进总结](./improvements-2026-01.md)
- 💬 [加入 QQ 群](https://qm.qq.com/q/ZSOmGi01S8)

## ❓ 常见问题

### Q1: 安装 Deno 时提示权限错误？

**A**: 
- Windows: 以管理员身份运行 PowerShell
- macOS/Linux: 使用 `sudo` 或手动下载安装

### Q2: 项目运行时报错 "GEMINI_API_KEY is not set"？

**A**: 
- 确保 `.env` 文件在项目根目录
- 检查文件名是否正确（不是 `.env.txt`）
- 确认 API Key 已正确配置

### Q3: 如何修改定时任务时间？

**A**: 编辑 `src/controllers/cron.ts` 文件：

```typescript
// 原配置：每天凌晨 3 点
cron.schedule("0 3 * * *", ...)

// 改为：每天上午 9 点
cron.schedule("0 9 * * *", ...)

// 改为：每小时执行一次
cron.schedule("0 * * * *", ...)
```

Cron 表达式格式：`分钟 小时 日 月 星期`

### Q4: 如何查看 API 使用情况？

**A**: 
```typescript
// 在代码中添加
import { LLMCache } from "@src/utils/llm-cache.ts";
const cache = LLMCache.getInstance();
cache.printStats();
```

### Q5: 项目可以离线运行吗？

**A**: 
- 需要网络连接调用 LLM API
- 可以使用缓存减少网络请求
- 考虑部署本地 LLM（如 Ollama）

## 🆘 获取帮助

遇到问题？

1. 查看 [GitHub Issues](https://github.com/OpenAISpace/ai-trend-publish/issues)
2. 加入 [QQ 交流群](https://qm.qq.com/q/ZSOmGi01S8)
3. 查看 [详细文档](../README.md)

## 🎉 恭喜！

您已经成功启动了 TrendPublish 项目！

现在可以：
- ✅ 开始使用 AI 自动发现和发布内容
- ✅ 体验多种 LLM 模型的能力
- ✅ 自定义您的工作流

祝您使用愉快！ 🚀

---

**文档版本**: v2.1.0  
**最后更新**: 2026-01-03

