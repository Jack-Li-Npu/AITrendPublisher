<div align="center">

<img src="docs/assets/hero.svg" alt="AITrendPublisher：从技术线索到一篇可编辑的公众号文章" width="100%">

# AITrendPublisher

**把 AI 资讯和 GitHub 项目，整理成你愿意发出去的文章。**

[English](README.md) · [演示步骤](docs/DEMO.md) · [配置指南](docs/GETTING_STARTED.md) · [架构说明](docs/ARCHITECTURE.md)

</div>

看到一个有意思的项目之后，往往还要读原文、整理笔记、翻译、排版、处理图片，再复制到公众号。AITrendPublisher 把这些工作放进同一个本地控制面板：**选择素材 → 整理文章 → 修改 Markdown → 检查排版 → 上传微信草稿箱。**

界面中的名称是 **TrendPublish**，仓库名称是 **AITrendPublisher**，旧的本地目录可能叫 **WX_Publisher**。

> 当前“发布”功能实际创建的是**公众号草稿**，不会直接向订阅者群发。请在微信后台检查并完成发送。

## 先看一遍，再决定怎么用

![从采集、整理、编辑到微信草稿箱的工作流](docs/assets/workflow.svg)

| 你要做什么 | 在项目中怎么做 |
| --- | --- |
| 写科技资讯 | 选择“科技新闻”，配置采集数量与内容长度 |
| 介绍开源项目 | 选择 GitHub Trending，当前界面每次处理一个项目 |
| 调整文章口吻 | 在“再改改”中修改全文 Markdown；真实模式也支持 AI 润色 |
| 检查排版 | 预览文章，切换模板，查看文字、图片和段落结构 |
| 交付到公众号 | 点击“上传至微信草稿箱”，再到微信后台完成发送 |

![真实控制面板的演示模式](docs/assets/dashboard.png)

![Markdown 编辑器与文章预览](docs/assets/markdown-editor.png)

*截图来自真实前端与演示后端。文稿为人工编写的样例，排版使用简化渲染器，不代表实时抓取、模型输出或真实微信上传结果。*

## 不填密钥，先体验

安装 [Deno 2](https://docs.deno.com/runtime/getting_started/installation/)，在项目目录运行：

```bash
deno task --config demo.json demo
```

打开 **http://127.0.0.1:8001**，点击 **开始运行任务 → 再改改 → 保存修改**。演示不读取 `.env`，不安装后端依赖，不调用 AI，不保存配置，不上传微信。编辑内容只保存在内存中；界面的 CDN 样式和图标仍需要网络。

## 连接真实服务

```bash
cp .env.example .env
deno install --allow-scripts
# 编辑 .env，填写模型、采集和微信配置
deno task start
```

Windows PowerShell 用 `Copy-Item .env.example .env`。也可使用仓库已有的一键安装、启动脚本。

真实控制面板在 **http://127.0.0.1:8000**。科技新闻模式依赖 Firecrawl；模型、封面生成和微信需要各自配置。当前真实工作流在预览阶段也会校验微信访问权限，并可能上传封面，不能把 `previewOnly` 当作完全离线模式。

定时任务默认关闭，只有设置 `ENABLE_CRON=true` 才会开启每天北京时间 03:00 的工作流。定时运行不经过界面的人工确认步骤，可能直接创建微信草稿。

## 忘记框架了？从这里恢复记忆

这是 **Deno + TypeScript 后端，加原生 HTML/JavaScript 前端**，没有 React / Next.js 构建流程。

- `public/index.html`：控制面板、Markdown 编辑器、预览和配置表单。
- `src/server.ts`：HTTP 服务、JSON-RPC 接口、SSE 日志。
- `src/services/weixin-article.workflow.ts`：串起采集、去重、文章整理、渲染与草稿上传。
- `src/modules/`：采集器、文章处理、渲染器、微信发布和通知。
- `src/providers/`：文本模型、向量、重排和图片服务适配。
- `src/utils/` / `src/db/`：本地存储、缓存、配置，以及可选 MySQL/Drizzle。

后端还实现了 `AI_NEWS_SITE`、`SINGLE_URL` 和 `TOPIC_SEARCH` 分支；当前可见界面主要开放科技新闻和 GitHub Trending，不应把所有后端模式都当作已开放的界面功能。

完整操作说明见 [配置指南](docs/GETTING_STARTED.md)，修改代码入口见 [架构说明](docs/ARCHITECTURE.md)。主应用仍存在原有的 TypeScript 检查错误，详见 [验证记录](docs/VERIFICATION.md)。

[MIT License](LICENSE) · 排版模块包含来自 [Doocs MD](https://github.com/doocs/md) 的代码。
