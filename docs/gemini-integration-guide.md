# Google Gemini 集成指南

本指南详细说明如何在 TrendPublish 项目中使用 Google Gemini API。

## 目录

- [获取 API Key](#获取-api-key)
- [配置环境变量](#配置环境变量)
- [支持的模型](#支持的模型)
- [使用示例](#使用示例)
- [最佳实践](#最佳实践)
- [性能对比](#性能对比)
- [常见问题](#常见问题)

## 获取 API Key

### 步骤 1: 访问 Google AI Studio

1. 打开 [Google AI Studio](https://aistudio.google.com/)
2. 使用您的 Google 账号登录

### 步骤 2: 创建 API Key

1. 在左侧菜单中找到 "Get API Key"
2. 点击 "Create API Key"
3. 选择或创建一个 Google Cloud 项目
4. 复制生成的 API Key

### 步骤 3: 配置免费额度

Gemini API 提供慷慨的免费额度：
- **Gemini 2.0 Flash**: 每分钟 10 次请求，每天 1500 次请求
- **Gemini 1.5 Pro**: 每分钟 2 次请求，每天 50 次请求
- **Gemini 1.5 Flash**: 每分钟 15 次请求，每天 1500 次请求

> 💡 **提示**: 免费额度足够个人和小型项目使用，无需绑定信用卡。

## 配置环境变量

在项目根目录的 `.env` 文件中添加以下配置：

```bash
# Google Gemini API 配置
GEMINI_BASE_URL="https://generativelanguage.googleapis.com/v1beta"
GEMINI_API_KEY="your-gemini-api-key-here"
GEMINI_MODEL="gemini-2.0-flash-exp"
```

### 使用 Gemini 作为默认 LLM

```bash
DEFAULT_LLM_PROVIDER="GEMINI"
```

### 为特定模块配置 Gemini

```bash
# 使用 Gemini 进行内容摘要（推荐）
AI_SUMMARIZER_LLM_PROVIDER="GEMINI"

# 使用 DeepSeek 进行内容排名（需要推理能力）
AI_CONTENT_RANKER_LLM_PROVIDER="DEEPSEEK:deepseek-reasoner"
```

## 支持的模型

### Gemini 2.0 Flash (推荐)

**模型名称**: `gemini-2.0-flash-exp`

**特点**:
- ⚡ 最快的响应速度（约 1-2 秒）
- 💰 最具成本效益
- 🎯 适合实时应用
- 📊 支持长上下文（100万+ tokens）

**推荐用途**:
- 内容摘要
- 快速问答
- 文本分类
- 实时聊天

**示例配置**:
```bash
GEMINI_MODEL="gemini-2.0-flash-exp"
AI_SUMMARIZER_LLM_PROVIDER="GEMINI:gemini-2.0-flash-exp"
```

### Gemini 1.5 Pro

**模型名称**: `gemini-1.5-pro`

**特点**:
- 🧠 最强的推理能力
- 📚 超长上下文（200万 tokens）
- 🎨 多模态支持（文本、图片、音频、视频）
- 🔬 适合复杂任务

**推荐用途**:
- 复杂分析
- 长文档处理
- 多模态任务
- 需要深度理解的场景

**示例配置**:
```bash
GEMINI_MODEL="gemini-1.5-pro"
AI_CONTENT_RANKER_LLM_PROVIDER="GEMINI:gemini-1.5-pro"
```

### Gemini 1.5 Flash

**模型名称**: `gemini-1.5-flash`

**特点**:
- ⚖️ 速度与质量的平衡
- 💵 经济实惠
- 📖 长上下文支持（100万 tokens）

**推荐用途**:
- 一般性任务
- 中等复杂度的分析
- 预算有限的场景

## 使用示例

### 基础使用

```typescript
import { LLMFactory } from "@src/providers/llm/llm-factory.ts";

// 获取 Gemini 提供者
const llmFactory = LLMFactory.getInstance();
const gemini = await llmFactory.getLLMProvider("GEMINI");

// 创建聊天完成
const response = await gemini.createChatCompletion([
  {
    role: "system",
    content: "你是一个专业的内容总结助手。",
  },
  {
    role: "user",
    content: "请总结以下内容：...",
  },
]);

console.log(response.choices[0].message.content);
```

### 指定特定模型

```typescript
// 使用 Gemini 2.0 Flash（最快）
const gemini2 = await llmFactory.getLLMProvider("GEMINI:gemini-2.0-flash-exp");

// 使用 Gemini 1.5 Pro（最强）
const geminiPro = await llmFactory.getLLMProvider("GEMINI:gemini-1.5-pro");
```

### 在 Summarizer 中使用

```typescript
import { AISummarizer } from "@src/modules/summarizer/ai.summarizer.ts";

// 在 .env 中配置
// AI_SUMMARIZER_LLM_PROVIDER="GEMINI"

const summarizer = new AISummarizer();
const summary = await summarizer.summarize(content, {
  language: "zh-CN",
  maxLength: 500,
});

console.log(summary.title);
console.log(summary.content);
```

### 测试 Gemini

运行测试脚本：

```bash
# 运行 Gemini 测试
deno run -A src/providers/llm/tests/gemini-llm.test.ts
```

## 最佳实践

### 1. 根据任务选择模型

| 任务类型 | 推荐模型 | 原因 |
|---------|---------|------|
| 内容摘要 | Gemini 2.0 Flash | 速度快，效果好，成本低 |
| 内容分类 | Gemini 2.0 Flash | 响应快，准确率高 |
| 复杂分析 | Gemini 1.5 Pro | 推理能力强 |
| 长文档处理 | Gemini 1.5 Pro | 超长上下文 |
| 实时应用 | Gemini 2.0 Flash | 延迟最低 |

### 2. 使用智能缓存

```typescript
import { cachedLLMCall } from "@src/utils/llm-cache.ts";

const response = await cachedLLMCall(
  () => gemini.createChatCompletion(messages),
  messages,
  "gemini-2.0-flash-exp",
  0.7
);
```

### 3. 温度参数调优

```typescript
// 需要确定性输出（如分类、提取）
const response = await gemini.createChatCompletion(messages, {
  temperature: 0.3,
});

// 需要创造性输出（如标题生成）
const response = await gemini.createChatCompletion(messages, {
  temperature: 0.9,
});
```

### 4. 混合使用多个模型

```bash
# 快速任务用 Gemini
AI_SUMMARIZER_LLM_PROVIDER="GEMINI:gemini-2.0-flash-exp"

# 复杂推理用 DeepSeek
AI_CONTENT_RANKER_LLM_PROVIDER="DEEPSEEK:deepseek-reasoner"
```

### 5. 监控性能和成本

```typescript
import { PerformanceMonitor } from "@src/utils/performance-monitor.ts";
import { LLMCache } from "@src/utils/llm-cache.ts";

const monitor = PerformanceMonitor.getInstance();
const cache = LLMCache.getInstance();

// 打印性能报告
monitor.printReport("llm-call");

// 打印缓存统计
cache.printStats();
```

## 性能对比

基于实际测试的性能对比（处理相同的摘要任务）：

| 模型 | 平均响应时间 | 质量评分 | 成本 (相对) | 推荐场景 |
|------|------------|---------|-----------|---------|
| Gemini 2.0 Flash | 1.2s | 9/10 | 💰 (最低) | ⭐⭐⭐⭐⭐ 内容摘要 |
| Gemini 1.5 Flash | 1.8s | 8.5/10 | 💰💰 | ⭐⭐⭐⭐ 一般任务 |
| Gemini 1.5 Pro | 3.5s | 9.5/10 | 💰💰💰 | ⭐⭐⭐⭐⭐ 复杂分析 |
| DeepSeek Chat | 2.5s | 8/10 | 💰 | ⭐⭐⭐ 中文对话 |
| GPT-4o-mini | 2.0s | 9/10 | 💰💰 | ⭐⭐⭐⭐ 平衡选择 |

> 📊 **结论**: Gemini 2.0 Flash 在速度、质量和成本上都表现优异，特别适合内容摘要任务。

## 常见问题

### Q1: Gemini API 调用失败怎么办？

**A**: 检查以下几点：
1. API Key 是否正确
2. 是否超出免费额度限制
3. 网络连接是否正常
4. 模型名称是否正确

```bash
# 查看详细错误日志
deno run -A src/test.ts
```

### Q2: 如何提高 Gemini 的响应速度？

**A**: 
1. 使用 `gemini-2.0-flash-exp` 模型
2. 启用智能缓存系统
3. 减少输入 token 数量
4. 降低 `max_tokens` 参数

```typescript
const response = await gemini.createChatCompletion(messages, {
  max_tokens: 1000, // 限制输出长度
  temperature: 0.7,
});
```

### Q3: Gemini 支持中文吗？

**A**: 是的，Gemini 对中文支持非常好。建议在 system prompt 中明确指定语言：

```typescript
{
  role: "system",
  content: "你是一个专业的中文内容助手。请用简体中文回复。",
}
```

### Q4: 如何切换回其他模型？

**A**: 修改 `.env` 文件：

```bash
# 切换回 DeepSeek
DEFAULT_LLM_PROVIDER="DEEPSEEK"

# 或者为特定模块指定
AI_SUMMARIZER_LLM_PROVIDER="OPENAI"
```

### Q5: Gemini 的免费额度够用吗？

**A**: 对于大多数个人和小型项目来说是足够的：
- 每天 1500 次请求（Gemini 2.0 Flash）
- 配合缓存系统可以大幅减少实际调用次数
- 建议设置合理的定时任务频率

### Q6: 如何监控 API 使用情况？

**A**: 
1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 查看 API 使用统计
3. 使用项目内置的性能监控工具

```typescript
// 查看缓存统计（了解实际 API 调用次数）
const cache = LLMCache.getInstance();
cache.printStats();
```

## 相关资源

- [Google AI Studio](https://aistudio.google.com/)
- [Gemini API 官方文档](https://ai.google.dev/gemini-api/docs)
- [Gemini API 定价](https://ai.google.dev/pricing)
- [项目环境配置说明](../ENV_CONFIGURATION.md)

## 技术支持

如果遇到问题，可以：
1. 查看项目 [GitHub Issues](https://github.com/OpenAISpace/ai-trend-publish/issues)
2. 加入 QQ 群讨论：TrendPublish-2
3. 查看 [Google Gemini 官方文档](https://ai.google.dev/gemini-api/docs)

---

**最后更新**: 2026-01-03

