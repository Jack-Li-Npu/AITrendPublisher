# LLM 配置完整总结

本文档汇总了所有 LLM 配置相关的文件和信息。

## 📋 核心答案

### ✅ 您的问题答案

1. **系统是否支持 DeepSeek 和 Qwen？**
   - ✅ **完全支持！** 已内置在 `src/providers/llm/llm-factory.ts` 中

2. **只配置 .env 中的 URL 和 API Key 是否就能用？**
   - ✅ **是的！** 只需配置以下内容即可：
     ```bash
     DEEPSEEK_BASE_URL="https://api.deepseek.com/v1"
     DEEPSEEK_API_KEY="sk-你的密钥"
     DEEPSEEK_MODEL="deepseek-chat"
     DEFAULT_LLM_PROVIDER="DEEPSEEK"
     ```

3. **能否使用其他模型进行与 Gemini 相同的流程操作？**
   - ✅ **完全可以！** 所有功能完全兼容，只需切换配置即可

## 📚 文档索引

### 新手必读（按阅读顺序）

1. **[快速答案](./ANSWER-deepseek-qwen-usage.md)** ⭐️ 最重要
   - 直接回答您的所有问题
   - 2 分钟快速配置指南
   - 完整配置示例

2. **[LLM 配置快速入门](./llm-configuration-quickstart.md)**
   - 3 分钟配置步骤
   - 提供者对比表
   - 验证方法

3. **[配置模板](./env-templates/)**
   - `deepseek.env.template` - DeepSeek 配置模板
   - `qwen.env.template` - Qwen 配置模板
   - `mixed.env.template` - 混合配置模板（推荐）
   - `README.md` - 模板使用说明

### 进阶文档

4. **[DeepSeek & Qwen 完整配置指南](./deepseek-qwen-setup-guide.md)**
   - 详细配置步骤
   - 获取 API Key 教程
   - 推荐配置方案
   - 常见问题解答
   - 性能对比数据

5. **[从 Gemini 迁移指南](./llm-migration-guide.md)**
   - 为什么要迁移？
   - 3 种迁移方案
   - 成本对比
   - 验证步骤

## 🔧 相关工具

### 测试脚本

**文件**: `test-llm-providers.ts`

**用途**: 测试 LLM 提供者配置是否正确

**使用方法**:
```bash
# 测试当前默认提供者
deno run -A --env-file=.env test-llm-providers.ts

# 测试 DeepSeek
deno run -A --env-file=.env test-llm-providers.ts deepseek

# 测试 Qwen
deno run -A --env-file=.env test-llm-providers.ts qwen

# 测试所有已配置的提供者
deno run -A --env-file=.env test-llm-providers.ts all
```

## 💡 推荐配置（基于您的当前状态）

### 您当前的配置

```bash
GEMINI_BASE_URL=https://generativelanguage.googleapis.com/v1beta
GEMINI_API_KEY=AIzaSyDwmM-dK3orNSfvPgblEY_mAHfEZZBshzk
GEMINI_MODEL=gemini-flash-lite-latest
DEFAULT_LLM_PROVIDER=GEMINI
AI_CONTENT_RANKER_LLM_PROVIDER=GEMINI
AI_SUMMARIZER_LLM_PROVIDER=GEMINI
```

### 推荐更改为（DeepSeek）

```bash
# 添加 DeepSeek 配置
DEEPSEEK_BASE_URL="https://api.deepseek.com/v1"
DEEPSEEK_API_KEY="sk-你的API密钥"  # ⚠️ 必须替换
DEEPSEEK_MODEL="deepseek-chat"

# 修改默认提供者
DEFAULT_LLM_PROVIDER="DEEPSEEK"
AI_CONTENT_RANKER_LLM_PROVIDER="DEEPSEEK"
AI_SUMMARIZER_LLM_PROVIDER="DEEPSEEK"

# 保留 Gemini 作为备用（可选）
GEMINI_BASE_URL="https://generativelanguage.googleapis.com/v1beta"
GEMINI_API_KEY="AIzaSyDwmM-dK3orNSfvPgblEY_mAHfEZZBshzk"
GEMINI_MODEL="gemini-flash-lite-latest"
```

**优势**:
- ✅ 告别限流烦恼
- ✅ 成本极低（¥10 能用几个月）
- ✅ 速度和质量不输 Gemini
- ✅ 保留 Gemini 作为备用

## 🎯 快速行动指南

### 第 1 步: 获取 DeepSeek API Key

1. 访问 https://platform.deepseek.com/
2. 注册并登录
3. 点击左侧"API Keys"
4. 点击"Create API Key"
5. 复制生成的 Key（格式：`sk-...`）
6. 充值 ¥10

⏱️ **预计耗时**: 5 分钟

### 第 2 步: 修改配置

**方式 A: 通过 UI（推荐）**

1. 运行 `deno task start`
2. 访问 http://localhost:8000
3. 点击右上角齿轮图标
4. 找到以下配置项并填写：
   - `DEEPSEEK_BASE_URL` = `https://api.deepseek.com/v1`
   - `DEEPSEEK_API_KEY` = 您的 API Key
   - `DEEPSEEK_MODEL` = `deepseek-chat`
   - `DEFAULT_LLM_PROVIDER` = `DEEPSEEK`
5. 点击"保存配置"
6. 刷新页面

⏱️ **预计耗时**: 2 分钟

**方式 B: 手动编辑 .env**

1. 打开项目根目录的 `.env` 文件
2. 添加 DeepSeek 配置（参考上方"推荐更改为"部分）
3. 保存文件
4. 重启服务（`Ctrl+C` 停止，`deno task start` 启动）

⏱️ **预计耗时**: 2 分钟

### 第 3 步: 验证配置（可选）

```bash
deno run -A --env-file=.env test-llm-providers.ts deepseek
```

⏱️ **预计耗时**: 30 秒

### 总耗时

**7-10 分钟**，即可完成从 Gemini 到 DeepSeek 的迁移！

## 📊 代码实现位置

### LLM Factory (核心)

**文件**: `src/providers/llm/llm-factory.ts`

**关键代码**:

```typescript:src/providers/llm/llm-factory.ts
switch (config.providerType) {
  case "OPENAI":
    provider = new OpenAICompatibleLLM("OPENAI_", undefined, config.model);
    break;
  case "DEEPSEEK":
    provider = new OpenAICompatibleLLM(
      "DEEPSEEK_",
      undefined,
      config.model,
    );
    break;
  case "QWEN":
    provider = new OpenAICompatibleLLM("QWEN_", undefined, config.model);
    break;
  case "GEMINI":
    provider = new GeminiLLM(config.model);
    break;
  case "CLAUDE":
    provider = new ClaudeLLM(undefined, config.model);
    break;
  // ...
}
```

### OpenAI 兼容实现

**文件**: `src/providers/llm/openai-compatible-llm.ts`

**说明**: DeepSeek 和 Qwen 都使用 OpenAI 兼容接口，通过不同的 `configKeyPrefix` 读取对应的配置：

- DeepSeek: `DEEPSEEK_BASE_URL`, `DEEPSEEK_API_KEY`, `DEEPSEEK_MODEL`
- Qwen: `QWEN_BASE_URL`, `QWEN_API_KEY`, `QWEN_MODEL`

## ❓ 常见问题速查

| 问题 | 答案 |
|------|------|
| 支持哪些 LLM？ | DeepSeek, Qwen, Gemini, OpenAI, Claude, 讯飞, 自定义 |
| 需要修改代码吗？ | ❌ 不需要，只需配置 .env |
| 可以同时配置多个吗？ | ✅ 可以，支持多提供者并存 |
| 切换后功能会变吗？ | ❌ 不会，所有功能完全一致 |
| DeepSeek 贵吗？ | ❌ 极便宜，0.001元/千tokens |
| Qwen 和 DeepSeek 哪个好？ | DeepSeek 性价比高，Qwen 质量高 |
| 配置后立即生效吗？ | ⚠️ 需要重启服务 |
| 怎么验证配置？ | 运行 `test-llm-providers.ts` 脚本 |

## 🔗 快速链接

### 外部链接

- [DeepSeek 开放平台](https://platform.deepseek.com/)
- [Qwen (阿里云百炼)](https://dashscope.aliyun.com/)
- [Gemini API](https://makersuite.google.com/app/apikey)

### 项目内链接

- [主 README](../README.md)
- [快速开始指南](./quick-start-guide.md)
- [UI 控制面板指南](./ui-dashboard-guide.md)
- [完整使用指南](../完整使用指南.md)

## 🎓 最佳实践

1. **开发测试**: 使用 Gemini（免费）
2. **日常发布**: 使用 DeepSeek Chat（便宜）
3. **重要文章**: 使用 Qwen Max（质量高）
4. **复杂分析**: 使用 DeepSeek Reasoner（推理强）

## 📞 获取帮助

如果遇到问题：

1. 先查看 [ANSWER 文档](./ANSWER-deepseek-qwen-usage.md)
2. 再查看 [完整指南](./deepseek-qwen-setup-guide.md)
3. 运行测试脚本诊断问题
4. 加入 QQ 群交流: https://qm.qq.com/q/ZSOmGi01S8

---

**最后更新**: 2026-01-23  
**文档版本**: v1.0  
**维护者**: TrendPublish 团队
