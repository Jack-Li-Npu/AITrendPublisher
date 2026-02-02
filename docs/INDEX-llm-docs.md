# LLM 配置文档索引

本文档提供 LLM 配置相关所有文档的快速索引。

## 🎯 我应该看哪个文档?

### 🆕 刚接触系统？

👉 **[LLM 配置完整答案](./ANSWER-deepseek-qwen-usage.md)**

- ✅ 直接回答所有常见问题
- ✅ 2 分钟快速配置
- ✅ 完整代码示例
- ✅ 最容易理解

**适合**: 第一次配置 LLM 的用户

---

### 📝 需要快速配置？

👉 **[LLM 配置快速入门](./llm-configuration-quickstart.md)**

- ✅ 3 分钟配置步骤
- ✅ 提供者对比表
- ✅ 验证方法

**适合**: 想快速上手的用户

---

### 📚 想了解所有细节？

👉 **[DeepSeek & Qwen 完整配置指南](./deepseek-qwen-setup-guide.md)**

- ✅ 详细配置步骤
- ✅ 性能对比数据
- ✅ 常见问题解答
- ✅ 最佳实践

**适合**: 想深入了解的用户

---

### 🔄 从 Gemini 迁移？

👉 **[从 Gemini 迁移指南](./llm-migration-guide.md)**

- ✅ 迁移原因分析
- ✅ 3 种迁移方案
- ✅ 成本对比
- ✅ 平滑过渡策略

**适合**: 当前使用 Gemini 的用户

---

### 📋 需要配置模板？

👉 **[配置模板目录](./env-templates/)**

包含以下模板：
- `deepseek.env.template` - 纯 DeepSeek 配置
- `qwen.env.template` - 纯 Qwen 配置
- `mixed.env.template` - 混合配置（推荐）

**适合**: 想直接复制配置的用户

---

### 🔍 想查看完整总结？

👉 **[LLM 配置完整总结](./llm-config-summary.md)**

- ✅ 所有文档汇总
- ✅ 代码实现位置
- ✅ 快速行动指南
- ✅ 常见问题速查

**适合**: 需要全局视图的用户

---

## 📂 完整文档列表

### 核心文档

| 文档 | 说明 | 推荐度 |
|------|------|--------|
| [ANSWER-deepseek-qwen-usage.md](./ANSWER-deepseek-qwen-usage.md) | **最重要**，直接回答所有问题 | ⭐⭐⭐⭐⭐ |
| [llm-configuration-quickstart.md](./llm-configuration-quickstart.md) | 3 分钟快速入门 | ⭐⭐⭐⭐ |
| [deepseek-qwen-setup-guide.md](./deepseek-qwen-setup-guide.md) | 完整配置指南 | ⭐⭐⭐⭐ |
| [llm-migration-guide.md](./llm-migration-guide.md) | Gemini 迁移指南 | ⭐⭐⭐ |
| [llm-config-summary.md](./llm-config-summary.md) | 完整总结汇总 | ⭐⭐⭐ |

### 配置模板

| 模板 | 说明 | 推荐度 |
|------|------|--------|
| [env-templates/deepseek.env.template](./env-templates/deepseek.env.template) | DeepSeek 配置模板 | ⭐⭐⭐⭐ |
| [env-templates/qwen.env.template](./env-templates/qwen.env.template) | Qwen 配置模板 | ⭐⭐⭐ |
| [env-templates/mixed.env.template](./env-templates/mixed.env.template) | 混合配置模板（推荐） | ⭐⭐⭐⭐⭐ |
| [env-templates/README.md](./env-templates/README.md) | 模板使用说明 | ⭐⭐⭐ |

### 工具脚本

| 脚本 | 说明 | 用途 |
|------|------|------|
| [../test-llm-providers.ts](../test-llm-providers.ts) | LLM 配置测试脚本 | 验证配置是否正确 |

## 🚀 推荐阅读路径

### 路径 A: 最快上手（10 分钟）

1. 阅读 [ANSWER-deepseek-qwen-usage.md](./ANSWER-deepseek-qwen-usage.md)（5 分钟）
2. 选择一个模板 [env-templates/](./env-templates/)（2 分钟）
3. 配置并测试（3 分钟）

✅ **10 分钟完成配置并开始使用！**

### 路径 B: 全面了解（30 分钟）

1. [ANSWER-deepseek-qwen-usage.md](./ANSWER-deepseek-qwen-usage.md)（5 分钟）
2. [llm-configuration-quickstart.md](./llm-configuration-quickstart.md)（3 分钟）
3. [deepseek-qwen-setup-guide.md](./deepseek-qwen-setup-guide.md)（15 分钟）
4. [llm-config-summary.md](./llm-config-summary.md)（5 分钟）
5. 配置并测试（2 分钟）

✅ **全面掌握 LLM 配置的方方面面！**

### 路径 C: 从 Gemini 迁移（15 分钟）

1. [llm-migration-guide.md](./llm-migration-guide.md)（10 分钟）
2. 选择迁移方案并配置（3 分钟）
3. 测试验证（2 分钟）

✅ **平滑迁移，告别限流！**

## 💡 快速问题查找

### "我应该用哪个 LLM？"

👉 查看 [llm-configuration-quickstart.md # 提供者对比](./llm-configuration-quickstart.md)

### "怎么配置 DeepSeek？"

👉 查看 [ANSWER-deepseek-qwen-usage.md # 2 分钟快速配置](./ANSWER-deepseek-qwen-usage.md)

### "Gemini 老是限流，怎么办？"

👉 查看 [llm-migration-guide.md](./llm-migration-guide.md)

### "怎么获取 API Key？"

👉 查看 [deepseek-qwen-setup-guide.md # 获取 API Key](./deepseek-qwen-setup-guide.md)

### "配置后怎么验证？"

👉 运行 `test-llm-providers.ts` 脚本

### "能同时用多个 LLM 吗？"

👉 查看 [env-templates/mixed.env.template](./env-templates/mixed.env.template)

### "哪个 LLM 最便宜？"

👉 DeepSeek（¥0.001/千tokens），查看 [llm-configuration-quickstart.md # 对比表](./llm-configuration-quickstart.md)

### "哪个 LLM 质量最好？"

👉 Qwen Max，查看 [deepseek-qwen-setup-guide.md # 性能对比](./deepseek-qwen-setup-guide.md)

## 🔗 相关链接

### 项目文档

- [主 README](../README.md)
- [快速开始指南](./quick-start-guide.md)
- [UI 控制面板指南](./ui-dashboard-guide.md)
- [完整使用指南](../完整使用指南.md)

### 外部资源

- [DeepSeek 官网](https://platform.deepseek.com/)
- [Qwen (阿里云百炼)](https://dashscope.aliyun.com/)
- [Gemini API](https://makersuite.google.com/app/apikey)
- [OpenAI Platform](https://platform.openai.com/)
- [Claude (Anthropic)](https://console.anthropic.com/)

### 社区

- QQ 交流群: https://qm.qq.com/q/ZSOmGi01S8
- 示例公众号: **AISPACE科技空间**

## 📊 文档统计

- **核心文档**: 5 个
- **配置模板**: 4 个
- **工具脚本**: 1 个
- **总文档数**: 10+ 个
- **最后更新**: 2026-01-23

---

**提示**: 如果您不确定从哪里开始，直接阅读 [ANSWER-deepseek-qwen-usage.md](./ANSWER-deepseek-qwen-usage.md) 即可！
