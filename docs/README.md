# 📚 TrendPublish 文档中心

欢迎来到 TrendPublish 的文档中心！这里包含了所有您需要的文档和指南。

## 🚀 新手入门

### [快速开始指南](./quick-start-guide.md)
10 分钟快速启动项目，最简配置即可运行。

**适合人群**: 首次使用者

**包含内容**:
- ✅ Deno 安装
- ✅ 项目配置
- ✅ 运行测试
- ✅ 常见问题

---

## 🔧 配置指南

### [环境配置说明](../ENV_CONFIGURATION.md)
详细的环境变量配置说明。

**适合人群**: 需要深度配置项目的用户

**包含内容**:
- 所有 LLM 提供商配置
- 数据库配置
- 微信公众号配置
- 通知服务配置

---

## 🌟 功能集成

### [Gemini 集成指南](./gemini-integration-guide.md) ⭐ 推荐
Google Gemini 2.0 API 的完整集成指南。

**适合人群**: 想要使用 Gemini API 的用户

**包含内容**:
- ✅ API Key 获取
- ✅ 模型选择建议
- ✅ 最佳实践
- ✅ 性能对比
- ✅ 常见问题

### [Jina AI 集成指南](./jina_integration_guide.md)
Jina AI 的搜索、嵌入、重排序功能集成。

**适合人群**: 需要高级搜索和语义理解的用户

---

## 🔔 通知服务

### [钉钉 Webhook 指南](./dingtalk-webhook-guide.html)
配置钉钉机器人通知。

### [飞书通知集成](../src/modules/notify/tests/feishu.notify.test.ts)
配置飞书机器人通知。

---

## 🎨 模板开发

### [模板展示页面](https://openaispace.github.io/ai-trend-publish/templates.html)
查看所有可用的文章模板。

**包含模板**:
- 大模型排行榜
- HelloGitHub 推荐
- AI 资讯总结
- 自定义模板

---

## 📊 项目更新

### [改进总结 (2026-01)](./improvements-2026-01.md)
最新版本的所有改进和新功能。

**亮点**:
- ✨ Gemini 2.0 集成
- 💾 智能缓存系统
- 📊 性能监控工具
- 🎯 模块化 LLM 配置

---

## 🛠️ API 文档

### [JSON-RPC API 文档](https://openaispace.github.io/ai-trend-publish/json-rpc-api.html)
手动触发工作流的 API 接口。

**端点**: `/api/workflow`

**支持方法**: `triggerWorkflow`

---

## 📖 完整文档

### [项目 README](../README.md)
项目主文档，包含完整的功能介绍和使用说明。

### [更新日志](../CHANGELOG.md)
查看项目的版本历史和更新记录。

---

## 🎓 教程和示例

### 代码示例

#### [Embedding 示例](../examples/embedding-example.ts)
向量嵌入和语义搜索示例。

#### [LLM 测试](../src/providers/llm/tests/)
各种 LLM 提供商的测试代码。

### 工作流示例

#### [示例工作流](../src/works/example-workflow.ts)
如何创建自定义工作流。

#### [测试工作流](../src/works/tests/test-workflow.ts)
工作流测试示例。

---

## 🔍 常用资源

### 外部链接

- [Deno 官方文档](https://deno.land/manual)
- [Google AI Studio](https://aistudio.google.com/)
- [DeepSeek 平台](https://platform.deepseek.com/)
- [微信公众平台](https://mp.weixin.qq.com/)

### 社区支持

- [GitHub 仓库](https://github.com/OpenAISpace/ai-trend-publish)
- [问题反馈](https://github.com/OpenAISpace/ai-trend-publish/issues)
- [QQ 交流群](https://qm.qq.com/q/ZSOmGi01S8)

---

## 📋 文档索引

### 按主题分类

#### 入门相关
- [快速开始指南](./quick-start-guide.md)
- [环境配置说明](../ENV_CONFIGURATION.md)
- [项目 README](../README.md)

#### LLM 集成
- [Gemini 集成指南](./gemini-integration-guide.md) ⭐
- [Jina AI 集成指南](./jina_integration_guide.md)
- [LLM 工厂模式](../src/providers/llm/llm-factory.ts)

#### 功能模块
- [内容抓取](../src/modules/scrapers/)
- [AI 摘要](../src/modules/summarizer/)
- [内容排名](../src/modules/content-rank/)
- [文章渲染](../src/modules/render/)
- [自动发布](../src/modules/publishers/)

#### 工具和优化
- [性能监控](../src/utils/performance-monitor.ts)
- [LLM 缓存](../src/utils/llm-cache.ts)
- [HTTP 客户端](../src/utils/http/http-client.ts)
- [重试工具](../src/utils/retry.util.ts)

#### 通知服务
- [Bark 通知](../src/modules/notify/bark.notify.ts)
- [钉钉通知](../src/modules/notify/dingding.notify.ts)
- [飞书通知](../src/modules/notify/feishu.notify.ts)

---

## 🆘 获取帮助

### 遇到问题？

1. **查看文档**: 首先查看相关文档和常见问题
2. **搜索 Issues**: 在 [GitHub Issues](https://github.com/OpenAISpace/ai-trend-publish/issues) 中搜索
3. **提问**: 
   - 加入 [QQ 群](https://qm.qq.com/q/ZSOmGi01S8) 讨论
   - 在 GitHub 提交新 Issue
4. **贡献**: 欢迎提交 PR 改进项目

### 如何提问

好的问题包含：
- ✅ 清晰的问题描述
- ✅ 完整的错误信息
- ✅ 重现步骤
- ✅ 环境信息（OS、Deno 版本等）
- ✅ 相关配置（脱敏后）

---

## 🤝 贡献文档

文档也是开源的！

### 如何贡献

1. Fork 项目
2. 编辑 Markdown 文件
3. 提交 Pull Request

### 文档规范

- 使用简体中文
- 代码示例要完整可运行
- 添加必要的说明和注释
- 更新相关的索引

---

## 📝 文档更新记录

| 日期 | 更新内容 | 作者 |
|------|---------|------|
| 2026-01-03 | 添加 Gemini 集成指南和改进总结 | TrendPublish Team |
| 2026-01-03 | 创建快速开始指南 | TrendPublish Team |
| 2026-01-03 | 创建文档中心索引 | TrendPublish Team |

---

## 📄 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](../LICENSE) 文件

---

**文档版本**: v2.1.0  
**最后更新**: 2026-01-03  
**维护者**: [OpenAISpace](https://github.com/OpenAISpace)

---

<div align="center">

### 🌟 如果这个项目对您有帮助，请给我们一个 Star！

[![Star History Chart](https://api.star-history.com/svg?repos=OpenAISpace/ai-trend-publish&type=Date)](https://star-history.com/#OpenAISpace/ai-trend-publish&Date)

</div>

