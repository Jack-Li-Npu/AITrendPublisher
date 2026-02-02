# TrendPublish

基于 Deno
开发的趋势发现和内容发布系统，支持多源数据采集、智能总结和自动发布到微信公众号。

> 🌰 示例公众号：**AISPACE科技空间**


点击链接加入群聊【TrendPublish-2】：https://qm.qq.com/q/ZSOmGi01S8


> 即刻关注，体验 AI 智能创作的内容～

## 🛠 开发环境

- **运行环境**: [Deno](https://deno.land/) v2.0.0 或更高版本
- **开发语言**: TypeScript
- **操作系统**: Windows/Linux/MacOS

## 🚀 快速开始

### 方式一：UI 控制面板（推荐，v2.0 新增）

**零配置，双击即用：**

1. **下载可执行文件**：
   - Windows: `TrendPublish.exe`
   - macOS: `TrendPublish-mac-x64` 或 `TrendPublish-mac-arm64`
   - Linux: `TrendPublish-linux-x64`

2. **双击运行**：
   - 程序自动启动后端服务
   - 自动打开浏览器访问控制面板

3. **在 UI 中配置**：
   - 点击右上角齿轮图标进入配置中心
   - 填写 API Key（Gemini、微信等）
   - 点击保存（自动写入 .env 文件）

4. **运行任务**：
   - 选择运行模式（科技新闻/GitHub Trending/单链接/主题搜索）
   - 设置字数范围和采集数量
   - 点击"开始运行任务"
   - 实时查看日志输出
   - 预览文章并确认发布

📖 **详细文档**: [UI 控制面板使用指南](docs/ui-dashboard-guide.md)

**或自行编译**：
```bash
# 编译 Windows 版本
deno task build:win

# 编译 macOS 版本
deno task build:mac-x64    # Intel 芯片
deno task build:mac-arm64  # Apple Silicon

# 编译 Linux 版本
deno task build:linux-x64
```

### 方式二：命令行模式

感谢 https://github.com/233cy 提供的入门教程 https://mp.weixin.qq.com/s/cpfNsezIA3OOvxHLdcdmkg

### 1. 安装 Deno

Windows (PowerShell):

```powershell
irm https://deno.land/install.ps1 | iex
```

MacOS/Linux:

```bash
curl -fsSL https://deno.land/install.sh | sh
```

### 2. 克隆项目

```bash
git clone https://github.com/OpenAISpace/ai-trend-publish
cd ai-trend-publish
```

### 3. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env 文件配置必要的环境变量
# Key environment variables include API keys for various AI services.
# For Jina AI functionalities (scraping, search, embeddings, reranking),
# ensure JINA_API_KEY is set. See the .env.example file and the
# Jina Integration Guide for more details.
```

### 4. 开发和运行

```bash
# 开发模式（支持热重载）
deno task start

# 测试运行
deno task test

# 编译Windows版本
deno task build:win

# 编译Mac版本
deno task build:mac-x64    # Intel芯片
deno task build:mac-arm64  # M系列芯片

# 编译Linux版本
deno task build:linux-x64   # x64架构
deno task build:linux-arm64 # ARM架构

# 编译所有平台版本
deno task build:all
```

## 🌟 主要功能

- 🎨 **图形化控制面板**（v2.0 新增）
  - 集成 UI 界面，无需命令行操作
  - 在界面中直接配置环境变量（.env）
  - 实时日志监控终端
  - 文章预览与手动确认发布
  - 单文件打包，双击即用

- 🤖 多源数据采集
  - Twitter/X 内容抓取
  - 网站内容抓取 (基于 FireCrawl)
  - GitHub Trending 项目自动抓取
  - 支持自定义数据源配置
  - Advanced scraping and search via Jina AI

- 🧠 AI 智能处理
  - 多模型支持：DeepSeek, OpenAI, Gemini 2.0, 千问, 讯飞等
  - 智能内容总结与关键信息提取
  - AI 驱动的标题生成
  - 内容质量评分与排序
  - 向量嵌入与语义检索（Jina AI）
  - 智能缓存机制，减少 API 调用成本
  - 字数范围可控（minWords/maxWords）

- 📢 自动发布
  - 微信公众号文章发布
  - 自定义文章模板（5+ 种风格）
  - 定时发布任务
  - 预览后确认发布机制

- 📱 通知系统
  - Bark 通知集成
  - 钉钉通知集成
  - 飞书通知集成
  - 任务执行状态通知
  - 错误告警

## 📝 文章模板

TrendPublish 提供了多种精美的文章模板。查看
[模板展示页面](https://openaispace.github.io/ai-trend-publish/templates.html)
了解更多详情。

## ✨ 最新更新

### v2.0.0 (2026-01-23) 🎉
- [x] ✅ **集成 UI 控制面板** - 图形化界面，双击即用
- [x] ✅ **环境变量可视化配置** - 无需手动编辑 .env 文件
- [x] ✅ **实时日志监控** - SSE 推送终端输出到 UI
- [x] ✅ **文章预览与确认发布** - 预览满意后再发布
- [x] ✅ **单文件打包** - 无需安装任何依赖即可运行
- [x] ✅ **字数范围控制** - 支持 UI 动态调整文章长度

### v2.1.0 (2026-01)
- [x] ✅ **新增 Google Gemini 2.0 支持** - 集成最新的 Gemini 2.0 Flash 和 Gemini 1.5 Pro
- [x] ✅ **智能缓存系统** - LLM 响应缓存，显著降低 API 调用成本
- [x] ✅ **性能监控工具** - 实时监控各模块性能，优化执行效率
- [x] ✅ **模块化 LLM 配置** - 为不同功能模块配置专用模型（如摘要用 Gemini，排序用 DeepSeek）

### 已完成功能
- [x] 微信公众号文章自动发布
- [x] 大模型每周排行榜
- [x] 热门 AI 仓库推荐
- [x] 多 LLM 提供商支持（OpenAI, DeepSeek, Gemini, 千问, 讯飞）
- [x] 支持多模型配置（如 `DEEPSEEK_MODEL="deepseek-chat|deepseek-reasoner"`）
- [x] 支持指定特定模型（如 `AI_CONTENT_RANKER_LLM_PROVIDER="DEEPSEEK:deepseek-reasoner"`）
- [x] **提供 exe 可视化界面** ✨ v2.0 完成

## 规划中
- [ ] 热门 AI 相关论文推荐
- [ ] 热门 AI 相关工具推荐
- [ ] FireCrawl 自动注册免费续期

## 🛠 技术栈

- **运行环境**: Deno 2.0+ TypeScript
- **AI 服务**: 
  - LLM: DeepSeek, OpenAI GPT-4, Google Gemini 2.0, 通义千问, 讯飞星火
  - 嵌入: Jina AI, OpenAI Embeddings
  - 搜索: Jina DeepSearch
- **数据源**:
  - Twitter/X API
  - FireCrawl 网页抓取
  - RSSHub 订阅源
  - Jina AI 智能搜索
- **数据库**: MySQL + Drizzle ORM
- **性能优化**: 
  - 智能缓存系统
  - 并发限制器
  - 重试机制

## 🤝 贡献指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 提交 Pull Request

## ❤️ 特别感谢

感谢以下贡献者对项目的支持：

<a href="https://github.com/kilimro">
  <img src="https://avatars.githubusercontent.com/u/52153481?v=4" width="50" height="50" alt="kilimro">
</a>

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=OpenAISpace/ai-trend-publish&type=Date)](https://star-history.com/#OpenAISpace/ai-trend-publish&Date)

## 📄 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件

### JSON-RPC API

提供了基于 JSON-RPC 2.0 协议的 API，支持手动触发工作流。

- 端点: `/api/workflow`
- 支持方法: `triggerWorkflow`
- 详细文档: [JSON-RPC API 文档](https://openaispace.github.io/ai-trend-publish/json-rpc-api.html )

![](https://oss.liuyaowen.cn/image/202504242031044.png)
