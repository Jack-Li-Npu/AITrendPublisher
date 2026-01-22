# LLM 环境变量配置示例

将以下配置添加到项目根目录的 `.env` 文件中。

## 🎯 默认 LLM 提供商配置

```bash
# 设置默认使用的 LLM 提供商
# 格式：PROVIDER 或 PROVIDER:model
DEFAULT_LLM_PROVIDER=GEMINI:gemini-2.0-flash-exp
```

**支持的格式**：
- `PROVIDER` - 仅指定提供商，使用默认模型
- `PROVIDER:model` - 指定提供商和具体模型

**示例**：
- `DEFAULT_LLM_PROVIDER=OPENAI` - 使用 OpenAI，默认模型
- `DEFAULT_LLM_PROVIDER=OPENAI:gpt-4` - 使用 OpenAI GPT-4
- `DEFAULT_LLM_PROVIDER=DEEPSEEK:deepseek-chat` - 使用 DeepSeek Chat

---

## 📋 各提供商配置

### 1. OpenAI

```bash
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_API_KEY=sk-your-openai-api-key
OPENAI_MODEL=gpt-4|gpt-3.5-turbo|gpt-4-turbo

# 使用 OpenAI 作为默认提供商
DEFAULT_LLM_PROVIDER=OPENAI:gpt-4
```

**获取 API 密钥**: https://platform.openai.com/api-keys

---

### 2. DeepSeek

```bash
DEEPSEEK_BASE_URL=https://api.deepseek.com/v1
DEEPSEEK_API_KEY=sk-your-deepseek-api-key
DEEPSEEK_MODEL=deepseek-chat|deepseek-reasoner|deepseek-coder

# 使用 DeepSeek 作为默认提供商
DEFAULT_LLM_PROVIDER=DEEPSEEK:deepseek-chat
```

**支持的模型**：
- `deepseek-chat` - 通用对话模型（推荐）
- `deepseek-reasoner` - 推理专用模型
- `deepseek-coder` - 代码专用模型

**获取 API 密钥**: https://platform.deepseek.com/

---

### 3. Claude (Anthropic) 🆕

```bash
CLAUDE_BASE_URL=https://api.anthropic.com/v1
CLAUDE_API_KEY=sk-ant-your-claude-api-key
CLAUDE_MODEL=claude-3-7-sonnet-20250219|claude-opus-4-20250514|claude-sonnet-4-20250514

# 使用 Claude 作为默认提供商
DEFAULT_LLM_PROVIDER=CLAUDE:claude-3-7-sonnet-20250219
```

**支持的模型**：
- `claude-opus-4-20250514` - Claude Opus 4（最强大）
- `claude-sonnet-4-20250514` - Claude Sonnet 4
- `claude-3-7-sonnet-20250219` - Claude 3.7 Sonnet（推荐，性价比高）
- `claude-3-5-sonnet-20241022` - Claude 3.5 Sonnet（稳定版）

**获取 API 密钥**: https://console.anthropic.com/

---

### 4. 讯飞星火

```bash
XUNFEI_API_KEY=your-xunfei-api-key

# 使用讯飞星火作为默认提供商
DEFAULT_LLM_PROVIDER=XUNFEI
```

**注意**：
- 讯飞不支持在配置中指定模型
- 模型版本由 API 密钥权限决定

**获取 API 密钥**: https://www.xfyun.cn/

---

### 5. 通义千问

```bash
QWEN_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
QWEN_API_KEY=sk-your-qwen-api-key
QWEN_MODEL=qwen-turbo|qwen-plus|qwen-max

# 使用通义千问作为默认提供商
DEFAULT_LLM_PROVIDER=QWEN:qwen-plus
```

**支持的模型**：
- `qwen-turbo` - 速度最快（低成本）
- `qwen-plus` - 平衡性能（推荐）
- `qwen-max` - 最高质量

**获取 API 密钥**: https://dashscope.aliyun.com/

---

### 6. Google Gemini

```bash
GEMINI_BASE_URL=https://generativelanguage.googleapis.com/v1beta
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-2.0-flash-exp|gemini-1.5-pro|gemini-3-flash-preview

# 使用 Gemini 作为默认提供商
DEFAULT_LLM_PROVIDER=GEMINI:gemini-2.0-flash-exp
```

**支持的模型**：
- `gemini-2.0-flash-exp` - 最新实验版（推荐，速度快）
- `gemini-1.5-pro` - 稳定版
- `gemini-3-flash-preview` - 预览版

**获取 API 密钥**: https://ai.google.dev/

---

### 7. 自定义 OpenAI 兼容 API

```bash
CUSTOM_LLM_BASE_URL=https://your-custom-api.com/v1
CUSTOM_LLM_API_KEY=your-custom-api-key
CUSTOM_LLM_MODEL=your-model-name

# 使用自定义 API 作为默认提供商
DEFAULT_LLM_PROVIDER=CUSTOM:your-model-name
```

---

## 🎨 模块功能配置

为不同功能模块指定使用的 LLM 提供者：

```bash
# 内容排名模块使用的 LLM 提供者
# 推荐使用推理能力强的模型
AI_CONTENT_RANKER_LLM_PROVIDER=DEEPSEEK:deepseek-reasoner

# 内容摘要模块使用的 LLM 提供者
# 推荐使用速度快的模型
AI_SUMMARIZER_LLM_PROVIDER=GEMINI:gemini-2.0-flash-exp
```

---

## 💡 LLM 选择建议

### 按场景选择

| 场景 | 推荐配置 |
|-----|---------|
| **高质量内容生成** | `DEFAULT_LLM_PROVIDER=OPENAI:gpt-4`<br/>或 `CLAUDE:claude-opus-4-20250514` |
| **性价比内容生成** | `DEFAULT_LLM_PROVIDER=DEEPSEEK:deepseek-chat`<br/>或 `CLAUDE:claude-3-7-sonnet-20250219` |
| **代码生成** | `DEFAULT_LLM_PROVIDER=DEEPSEEK:deepseek-coder`<br/>或 `OPENAI:gpt-4` |
| **中文处理** | `DEFAULT_LLM_PROVIDER=XUNFEI`<br/>或 `QWEN:qwen-plus` |
| **快速响应** | `DEFAULT_LLM_PROVIDER=GEMINI:gemini-2.0-flash-exp`<br/>或 `OPENAI:gpt-3.5-turbo` |
| **复杂推理** | `DEFAULT_LLM_PROVIDER=DEEPSEEK:deepseek-reasoner`<br/>或 `OPENAI:gpt-4` |

### 按成本选择

| 成本等级 | 推荐配置 |
|---------|---------|
| 💰 **低成本** | `DEEPSEEK:deepseek-chat`<br/>`XUNFEI`<br/>`QWEN:qwen-turbo` |
| 💰💰 **中等成本** | `CLAUDE:claude-3-7-sonnet-20250219`<br/>`GEMINI:gemini-2.0-flash-exp`<br/>`OPENAI:gpt-3.5-turbo`<br/>`QWEN:qwen-plus` |
| 💰💰💰 **高质量** | `CLAUDE:claude-opus-4-20250514`<br/>`OPENAI:gpt-4`<br/>`QWEN:qwen-max` |

---

## 🔄 切换 LLM 提供商

只需修改 `.env` 文件中的 `DEFAULT_LLM_PROVIDER`，无需修改代码：

```bash
# 从 Gemini 切换到 DeepSeek
DEFAULT_LLM_PROVIDER=DEEPSEEK:deepseek-chat

# 从 DeepSeek 切换到 Claude
DEFAULT_LLM_PROVIDER=CLAUDE:claude-3-7-sonnet-20250219

# 从 Claude 切换到 OpenAI
DEFAULT_LLM_PROVIDER=OPENAI:gpt-4
```

---

## 📝 完整配置示例

以下是一个完整的 `.env` 配置示例（配置所有提供商）：

```bash
# ==================== 
# 默认 LLM 提供商
# ====================
DEFAULT_LLM_PROVIDER=CLAUDE:claude-3-7-sonnet-20250219

# ==================== 
# OpenAI
# ====================
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_API_KEY=sk-your-openai-api-key
OPENAI_MODEL=gpt-4|gpt-3.5-turbo

# ==================== 
# DeepSeek
# ====================
DEEPSEEK_BASE_URL=https://api.deepseek.com/v1
DEEPSEEK_API_KEY=sk-your-deepseek-api-key
DEEPSEEK_MODEL=deepseek-chat|deepseek-reasoner|deepseek-coder

# ==================== 
# Claude
# ====================
CLAUDE_BASE_URL=https://api.anthropic.com/v1
CLAUDE_API_KEY=sk-ant-your-claude-api-key
CLAUDE_MODEL=claude-3-7-sonnet-20250219|claude-opus-4-20250514

# ==================== 
# 讯飞星火
# ====================
XUNFEI_API_KEY=your-xunfei-api-key

# ==================== 
# 通义千问
# ====================
QWEN_BASE_URL=https://dashscope.aliyun.com/compatible-mode/v1
QWEN_API_KEY=sk-your-qwen-api-key
QWEN_MODEL=qwen-turbo|qwen-plus|qwen-max

# ==================== 
# Gemini
# ====================
GEMINI_BASE_URL=https://generativelanguage.googleapis.com/v1beta
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-2.0-flash-exp|gemini-1.5-pro

# ==================== 
# 模块功能配置
# ====================
AI_CONTENT_RANKER_LLM_PROVIDER=DEEPSEEK:deepseek-reasoner
AI_SUMMARIZER_LLM_PROVIDER=GEMINI:gemini-2.0-flash-exp
```

---

## 🚀 快速开始

1. **创建 `.env` 文件**（如果不存在）：
   ```bash
   touch .env
   ```

2. **添加最小配置**（使用 Gemini，有免费额度）：
   ```bash
   GEMINI_API_KEY=your-gemini-api-key
   GEMINI_MODEL=gemini-2.0-flash-exp
   DEFAULT_LLM_PROVIDER=GEMINI:gemini-2.0-flash-exp
   ```

3. **运行项目**：
   ```bash
   deno task start
   ```

---

## 🔍 验证配置

运行测试命令验证 LLM 配置是否正确：

```bash
deno task test
```

或测试特定提供商：

```typescript
// 测试 Claude
const claude = await LLMFactory.getInstance().getLLMProvider("CLAUDE:claude-3-7-sonnet-20250219");
const response = await claude.createChatCompletion([
  { role: "user", content: "Hello!" }
]);
console.log(response.choices[0].message.content);
```

---

## 📚 更多信息

- 查看 [完整使用指南.md](../完整使用指南.md) 了解更多配置选项
- 查看各提供商的官方文档了解 API 限制和定价
