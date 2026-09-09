<p align="center"><a href="README.md">English</a> | <strong>简体中文</strong></p>

<div align="center">

<img src="docs/assets/hero.zh-CN.svg" alt="AITrendPublisher：从技术线索到一篇可编辑的公众号文章" width="100%">

# AITrendPublisher

**把 AI 资讯和 GitHub 项目，整理成你愿意发出去的文章。**

Deno · TypeScript · Markdown · 微信公众号

[文档导航 / Documentation](docs/README.md) · [体验演示](#不填密钥先体验) · [配置指南](docs/GETTING_STARTED.zh-CN.md) · [架构说明](docs/ARCHITECTURE.zh-CN.md)

</div>

看到一个有意思的项目之后，往往还要读原文、整理笔记、翻译、排版、处理图片，再复制到公众号。**AITrendPublisher 把这些工作放进同一个本地采编工作台。** 选择素材，整理文章，修改 Markdown，检查排版，最后上传到微信草稿箱。

界面中的名称是 **TrendPublish**，仓库名称是 **AITrendPublisher**，旧的本地目录可能叫 **WX_Publisher**。

> **“发布”具体指什么？** 当前微信发布模块创建的是**公众号草稿**，不会直接向订阅者群发。请在微信公众平台后台检查并完成发送。

## 适合谁使用？

适合希望把科技素材整理成文章的编辑、开发者和内容创作者。当前发布目标是微信公众号草稿箱：演示模式不需要微信账号，真实工作流目前需要具备相应接口权限的公众号。

**语言支持：** 项目介绍和使用指南提供英文与简体中文版本。当前应用界面、演示文章以及现有写作提示词主要面向中文；切换文档语言不会切换应用界面或自动改变文章输出语言。英文读者可使用[界面标签对照表](docs/DEMO.md#find-your-way-around-the-chinese-interface)理解截图与操作。

## 看一遍完整流程

<img src="docs/assets/workflow.zh-CN.svg" alt="从新闻或 GitHub README 出发，经过采集、文章整理、Markdown 编辑和人工检查，再上传微信草稿箱" width="100%">

### 1. 选择要写的内容

在科技新闻和 GitHub Trending 之间切换。新闻模式可设置采集篇数和内容长度，并通过实时日志观察进度。当前界面的 GitHub 模式每次聚焦一个项目。

![真实控制面板的演示模式](docs/assets/dashboard.png)

### 2. 按文章的样子阅读

预览整理后的文章，切换模板，检查结构。演示会加载明确标注的样稿，让你无需配置服务也能了解流程。

![标注了示例内容的文章预览](docs/assets/article-preview.png)

### 3. 改成你自己的表达

点击 **再改改**，在 Markdown 全文旁查看预览。真实应用也提供模型辅助润色；演示支持手动编辑，不会调用 AI。

![全文 Markdown 编辑器与右侧预览](docs/assets/markdown-editor.png)

*截图来自真实前端与演示后端。文稿为人工编写的样例，排版使用简化渲染器，不代表实时抓取、模型输出或真实微信上传结果。*

## 不填密钥，先体验

安装 [Deno 2](https://docs.deno.com/runtime/getting_started/installation/)，然后克隆公开仓库并运行：

```bash
git clone https://github.com/Jack-Li-Npu/AITrendPublisher.git
cd AITrendPublisher
deno task --config demo.json demo
```

打开 **http://127.0.0.1:8001**，选择模式 → **开始运行任务** → **再改改** → 修改 Markdown → **保存修改**。

- 无需 `.env`、API 密钥、数据库或后端依赖安装。
- 修改只保存在内存中，停止演示服务后会消失。
- 保存配置、AI 润色和微信上传会返回明确的演示模式提示。
- 当前界面从公共 CDN 加载样式、图标和 Mermaid，浏览器仍需联网。

[跟着五分钟演示操作 →](docs/DEMO.zh-CN.md)

## 连接你自己的数据源与模型

```bash
git clone https://github.com/Jack-Li-Npu/AITrendPublisher.git
cd AITrendPublisher
cp .env.example .env
deno install --allow-scripts
# 编辑 .env，填写模型、采集和微信配置
deno task start
```

如果已经克隆仓库，直接在现有目录继续。Windows PowerShell 用 `Copy-Item .env.example .env`。仓库也提供 `setup.ps1`、`setup.bat`、`setup.sh`、`start.bat` 和 `start.sh`。

真实控制面板在 **http://127.0.0.1:8000**。如果只想了解项目，先体验演示。真实运行需要模型配置；当前工作流即使设置 `previewOnly`，也会校验微信凭据与 IP 权限。科技新闻模式还依赖 Firecrawl，封面生成需要对应图片服务配置。

**首次运行默认值：** 服务只监听本机，数据库可选，定时任务默认关闭。只有设置 `ENABLE_CRON=true` 才会启用定时运行；旧配置如果需要保留每日任务，也必须显式开启。

[服务配置、运行前提、排错和定时任务 →](docs/GETTING_STARTED.zh-CN.md)

## 当前实现了哪些功能？

| 功能 | 当前行为 |
| --- | --- |
| 科技新闻 | 通过 Firecrawl 获取多个已配置数据源；界面可选择 |
| GitHub Trending | 发现热门项目并读取 README；界面可选择；部分处理直接保留 README 内容 |
| AI 新闻网站 | 直接抓取新闻站点；后端模式为 `AI_NEWS_SITE` |
| 单链接 / 主题搜索 | 后端存在 `SINGLE_URL` / `TOPIC_SEARCH` 分支；界面控件目前被注释 |
| 文章整理 | 根据模式完成翻译、摘要、标题、引入和图片处理 |
| 模型适配 | 已有 DeepSeek、Gemini、OpenAI 兼容服务、Qwen、Claude 和讯飞适配器；可用性取决于端点、模型和账号配置 |
| 编辑排版 | 全文 Markdown 编辑、实时预览、AI 润色，以及基于 Doocs 的渲染 |
| 内容交付 | 上传图片并创建微信草稿；最终群发在微信后台完成 |
| 存储 | 本地文章、采集文件与记录；可选 MySQL、Drizzle 和向量支持 |
| 定时运行 | 显式开启后，每天北京时间 03:00 运行；可能不经过界面确认直接创建草稿 |

## 项目是怎么搭建的？

这是一个**单进程 Deno 应用，前端使用原生 HTML/JavaScript**。没有 React 或 Next.js 构建步骤。页面通过 JSON-RPC 调用 Deno HTTP 服务，并通过 Server-Sent Events（SSE）接收日志。

```text
public/index.html               控制面板、Markdown 编辑器、预览
        │ JSON-RPC + SSE
src/server.ts                   HTTP 路由与日志流
        │
src/controllers/                界面操作、工作流触发、定时任务
        │
src/services/weixin-article.workflow.ts
        ├── modules/scrapers/   新闻、GitHub、Firecrawl
        ├── providers/llm/      文本模型适配
        ├── modules/render/    Markdown → 文章 HTML
        └── modules/publishers/ 微信图片与草稿上传
```

[查看架构图和代码修改入口 →](docs/ARCHITECTURE.zh-CN.md)

## 项目状态

这是一个仍在开发中的本地采编工具。演示已有自动检查，覆盖编辑、HTML 转义、禁止外部操作和文件访问边界。主应用仍存在原有 TypeScript 错误，详见[验证记录](docs/VERIFICATION.zh-CN.md)。截图制作时没有调用真实模型服务，也没有创建微信草稿。

当前预览存放在内存中，源网站可能变化，应用面向单个可信的本地操作者。真实服务应保留本机监听；配置接口会处理密钥。生成内容和 `.env` 的新增文件已由忽略规则排除，但已提交文件不会因此自动移出 Git。

## 许可证与致谢

[MIT License](LICENSE)。文章渲染模块包含来自 [Doocs MD](https://github.com/doocs/md) 的代码，其他开源依赖见 [deno.json](deno.json)。
