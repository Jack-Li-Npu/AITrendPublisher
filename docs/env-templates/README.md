# 环境变量配置模板

本目录包含不同 LLM 提供者的配置模板，方便快速配置。

## 📁 模板列表

| 模板文件 | 说明 | 适用场景 |
|---------|------|----------|
| `deepseek.env.template` | 纯 DeepSeek 配置 | 个人使用、高频发布、追求性价比 |
| `qwen.env.template` | 纯 Qwen 配置 | 追求质量、需要稳定性 |
| `mixed.env.template` | 混合配置（推荐） | 各取所长、效果最优 |

## 🚀 使用方法

### 方法 1: 复制粘贴（推荐）

1. 选择合适的模板文件
2. 复制模板内容到项目根目录的 `.env` 文件
3. 替换 API Key（标记为 `⚠️ 替换` 的部分）
4. 运行 `deno task start` 启动应用

### 方法 2: 通过 UI 配置

1. 启动应用：`deno task start`
2. 访问 http://localhost:8000
3. 在"环境变量配置"标签页中直接编辑配置
4. 点击"保存配置"

## 📊 配置对比

### DeepSeek 配置

**优点**：
- ✅ 成本极低（0.001 元/千 tokens）
- ✅ 速度快
- ✅ 质量高

**缺点**：
- ⚠️ 需要注册 DeepSeek 账号
- ⚠️ 需要充值（但消耗很慢）

**适合**：
- 个人博客日常更新
- 高频发布场景
- 预算有限的用户

### Qwen 配置

**优点**：
- ✅ 质量很高（尤其 qwen-max）
- ✅ 中文优化好
- ✅ 国内访问稳定

**缺点**：
- ⚠️ 成本比 DeepSeek 高
- ⚠️ 速度略慢

**适合**：
- 追求文章质量
- 需要稳定性
- 企业级应用

### 混合配置（推荐）

**优点**：
- ✅ 各取所长
- ✅ 效果最优
- ✅ 成本可控

**缺点**：
- ⚠️ 需要配置多个 API
- ⚠️ 配置稍复杂

**适合**：
- 追求最佳效果
- 预算充足
- 专业用户

## 🔑 获取 API Key

### DeepSeek

1. 访问 [DeepSeek 开放平台](https://platform.deepseek.com/)
2. 注册并登录
3. 在"API Keys"页面创建新的 API Key
4. 充值（建议先充值 ¥10 测试）

### Qwen

1. 访问 [阿里云百炼平台](https://dashscope.aliyun.com/)
2. 开通灵积模型服务
3. 在"API-KEY 管理"页面创建 API Key
4. 确保账号有余额

### Gemini

1. 访问 [Google AI Studio](https://makersuite.google.com/app/apikey)
2. 登录 Google 账号
3. 创建 API Key
4. 免费使用（有配额限制）

## ✅ 验证配置

配置完成后，运行测试脚本验证：

```bash
# 测试当前默认提供者
deno run -A --env-file=.env test-llm-providers.ts

# 测试 DeepSeek
deno run -A --env-file=.env test-llm-providers.ts deepseek

# 测试 Qwen
deno run -A --env-file=.env test-llm-providers.ts qwen

# 测试所有配置的提供者
deno run -A --env-file=.env test-llm-providers.ts all
```

## 📖 相关文档

- [DeepSeek & Qwen 配置完整指南](../deepseek-qwen-setup-guide.md)
- [LLM 配置示例](../llm-env-config-example.md)
- [快速开始指南](../quick-start-guide.md)

---

**提示**: 配置完成后，建议先运行测试脚本验证配置是否正确，再启动完整应用。
