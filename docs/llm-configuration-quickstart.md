# LLM 配置快速入门

## 🎯 一句话总结

**系统已完全支持 DeepSeek、Qwen、Gemini、OpenAI、Claude 等多种 LLM，只需在 `.env` 配置 API Key 即可使用，所有功能完全兼容，无需修改代码。**

## 📊 LLM 提供者对比

| 提供者 | 成本 | 速度 | 质量 | 稳定性 | 推荐场景 |
|--------|------|------|------|--------|----------|
| **DeepSeek** ⭐️ | 极低（¥0.001/千tokens） | 快 | 高 | 稳定 | 个人使用、高频发布 |
| **Qwen** | 中等 | 中等 | 很高 | 很稳定 | 追求质量、重要文章 |
| **Gemini** | 免费（限额） | 很快 | 高 | 中等（限流） | 测试、轻量任务 |
| **OpenAI** | 高 | 很快 | 很高 | 稳定 | 企业级应用 |
| **Claude** | 高 | 快 | 很高 | 稳定 | 复杂分析任务 |

## 🚀 3 分钟配置

### 方式 1: 编辑 .env 文件

选择一个提供者，在 `.env` 中添加配置：

#### DeepSeek（推荐）

```bash
DEEPSEEK_BASE_URL="https://api.deepseek.com/v1"
DEEPSEEK_API_KEY="sk-你的API密钥"
DEEPSEEK_MODEL="deepseek-chat"
DEFAULT_LLM_PROVIDER="DEEPSEEK"
```

#### Qwen

```bash
QWEN_BASE_URL="https://dashscope.aliyuncs.com/compatible-mode/v1"
QWEN_API_KEY="sk-你的API密钥"
QWEN_MODEL="qwen-max"
DEFAULT_LLM_PROVIDER="QWEN"
```

### 方式 2: 通过 UI 界面（更简单）

1. 运行 `deno task start`
2. 访问 http://localhost:8000
3. 点击右上角齿轮图标
4. 填写相应的配置项
5. 点击"保存配置"

## 📚 详细文档

- **新手必读**: [DeepSeek & Qwen 使用答案](./ANSWER-deepseek-qwen-usage.md)
- **完整指南**: [DeepSeek & Qwen 配置指南](./deepseek-qwen-setup-guide.md)
- **迁移指南**: [从 Gemini 迁移](./llm-migration-guide.md)
- **配置模板**: [环境变量模板](./env-templates/)

## 🔑 获取 API Key

| 提供者 | 官网 | 注册步骤 |
|--------|------|----------|
| DeepSeek | https://platform.deepseek.com/ | 注册 → API Keys → 充值 ¥10 |
| Qwen | https://dashscope.aliyun.com/ | 开通灵积 → API-KEY 管理 |
| Gemini | https://makersuite.google.com/app/apikey | 登录 Google → 创建 API Key |

## ✅ 验证配置

```bash
# 测试 DeepSeek 配置
deno run -A --env-file=.env test-llm-providers.ts deepseek

# 测试所有提供者
deno run -A --env-file=.env test-llm-providers.ts all
```

---

**推荐**: 立即配置 DeepSeek，告别 Gemini 限流烦恼！
