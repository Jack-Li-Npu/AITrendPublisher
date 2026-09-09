# 快速上手

[English](GETTING_STARTED.md) | **简体中文** · [全部文档](README.md) · [项目介绍](../README.zh-CN.md)

## 选择首次运行方式

| 你的目的 | 命令 | 需要准备什么 |
| --- | --- | --- |
| 了解界面和流程 | `deno task --config demo.json demo` | Deno 2；浏览器能访问界面使用的公共 CDN |
| 采集并整理真实文章 | `deno task start` | 依赖、`.env`、模型服务、数据源及微信配置 |
| 检查演示后端 | `deno task --config demo.json test` | Deno 2；无需外部服务 |

独立的 `demo.json` 避免在首次体验时解析生产依赖。安装项目依赖后，也可以使用简写 `deno task demo` 和 `deno task test:demo`。

演示地址为 `http://127.0.0.1:8001`，真实应用地址为 `http://127.0.0.1:8000`。两者都只监听本机，用 Ctrl+C 停止。

## 安装

1. 按照 [Deno 官方安装指南](https://docs.deno.com/runtime/getting_started/installation/)安装 Deno 2，用 `deno --version` 检查。
2. 运行 `git clone https://github.com/Jack-Li-Npu/AITrendPublisher.git`，然后 `cd AITrendPublisher`。
3. 只体验演示时，直接运行 `deno task --config demo.json demo`。它使用独立入口，不加载生产后端或 `.env`。
4. 使用真实服务时，安装依赖并创建配置文件：

```bash
deno install --allow-scripts
cp .env.example .env
```

Windows PowerShell 将复制命令改为：

```powershell
Copy-Item .env.example .env
```

不要覆盖已有 `.env`。安装脚本会保留现有配置：macOS/Linux 使用 `bash setup.sh`，Windows 使用 `./setup.ps1` 或 `setup.bat`。脚本会在缺少 Deno 时安装它，解析依赖，并在没有配置文件时复制示例配置。

## 配置真实运行

启动前编辑 `.env`。示例配置选择 DeepSeek 处理文本、Qwen Image Max 生成封面，所有密钥均为空。这些只是配置示例，不保证模型仍对所有账号可用；请选择你的服务商账号实际开通的模型。

| 配置项 | 用途 / 使用条件 |
| --- | --- |
| `DEFAULT_LLM_PROVIDER=DEEPSEEK` | 默认文本模型服务商 |
| `DEEPSEEK_API_KEY`、`DEEPSEEK_BASE_URL`、`DEEPSEEK_MODEL` | 对应服务商的密钥、接口地址和模型 |
| `AI_SUMMARIZER_LLM_PROVIDER=DEEPSEEK` | 主要文章整理模型；也支持 `PROVIDER:model` 格式 |
| `AI_PRE_EXTRACT_LLM_PROVIDER=DEEPSEEK` | 预提取模型 |
| `WEIXIN_APP_ID`、`WEIXIN_APP_SECRET` | 公众号凭据；当前真实工作流会在开始时校验 |
| `AUTHOR` | 文章作者名称 |
| `FIRE_CRAWL_API_KEY`、`FIRE_CRAWL_BASE_URL` | 科技新闻采集，以及依赖 Firecrawl 的链接和搜索分支 |
| `IMAGE_GENERATOR_TYPE=QWEN_IMAGE_MAX` | 主工作流的封面生成器 |
| `DASHSCOPE_API_KEY`、`DASHSCOPE_REGION=cn` | Qwen 图片服务的中国区配置；请按账号实际区域选择凭据 |
| `DEFAULT_COVER_IMAGE_URL` | 图片生成失败时，可选的备用封面地址 |
| `ENABLE_DB=false` | 首次运行暂不启用 MySQL |
| `ENABLE_DEDUPLICATION=false` | 首次运行暂不要求可选向量服务配置 |
| `ENABLE_BARK=false` | 未配置 Bark 时关闭通知 |
| `ENABLE_CRON=false` | 配置过程中关闭定时运行 |

Gemini 封面使用 `GEMINI` 或 `GEMINI_PRO`，并填写相应 Gemini 配置。虽然服务工厂中存在 `TEXT_LOGO`，主工作流的封面分支没有处理它，因此示例改用 `QWEN_IMAGE_MAX`。备用封面也必须适合微信上传；不能把缺失或占位的封面 ID 当作可靠的发布配置。

配置中心可修改模型和微信设置，并将密钥写入 `.env`，请仅在可信的本机使用。界面菜单里的部分模型名称可能过时，需要其他支持的模型时可直接编辑 `.env`。

## 界面与语言

文档提供英文和简体中文版本，当前控制面板与示例文章为中文。英文读者可以参考[界面标签对照表](DEMO.md#find-your-way-around-the-chinese-interface)。这里的微信公众号是用于发布内容的账号，仅有个人微信登录并不等于已完成下述接口配置。演示不需要任何微信账号。

现有文章提示词主要面向中文写作。改变生成文章的语言需要另外调整提示词或配置，不由文档语言切换控制。

## 完成第一篇真实文章

1. 确认公众号能够调用所需图片、素材和草稿接口，将当前机器的出口 IP 加入公众号 IP 白名单。
2. 在项目根目录运行 `deno task start`。程序会尝试自动打开浏览器；设置 `CI=true` 可关闭自动打开。
3. 打开 `http://127.0.0.1:8000`，选择界面中可见的内容模式。建议先处理一篇文章；GitHub Trending 在当前界面已经固定为一个项目。
4. 点击 **开始运行任务**，查看实时日志。接口成功接收任务，不代表文章已经生成完毕。
5. 阅读预览，点击 **再改改**，手动编辑 Markdown 或使用 AI 润色，然后点击 **保存修改**。
6. 确认内容后点击 **上传至微信草稿箱**。在微信公众平台后台检查草稿，并在那里完成发送。

`previewOnly=true` 只跳过最后的草稿创建步骤，不代表真实工作流没有外部操作。当前流程在返回预览前仍会校验微信访问权限，并可能上传已生成的封面。需要完全不调用模型或发布接口的体验时，请使用 `deno task --config demo.json demo`。

## 内容模式与接口

前端通过 `POST /api/workflow` 发送 JSON-RPC 请求，通过 `GET /api/logs` 接收日志。

| `contentMode` | 输入来源 | 界面状态 |
| --- | --- | --- |
| `TECH_NEWS` | `src/data-sources/getDataSources.ts` 中的来源列表 | 可见 |
| `GITHUB_TRENDING` | GitHub Trending 和项目 README | 可见 |
| `AI_NEWS_SITE` | 直接抓取 AI 新闻网站 | 后端分支；没有可见选择入口 |
| `SINGLE_URL` | `url` 参数 | 控件已被注释 |
| `TOPIC_SEARCH` | `topic` 参数 | 控件已被注释 |

以下请求用于已配置的真实服务，预览一个 GitHub 项目。它可能调用收费模型服务，并执行前文所述的微信校验或封面上传：

```bash
curl http://127.0.0.1:8000/api/workflow \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"triggerWorkflow","params":{"workflowType":"weixin-article-workflow","contentMode":"GITHUB_TRENDING","maxArticles":1,"template":"default","previewOnly":true}}'
```

不要将真实服务直接开放到公网。配置和文件访问接口按本地使用设计，基于主机名的认证检查不适合作为可靠的远程访问边界。

## 定时运行

定时任务**默认关闭**，旧 `.env` 中未填写 `ENABLE_CRON` 时也不会开启。确认手动运行成功后，设置 `ENABLE_CRON=true` 并重启。

当前计划为 `Asia/Shanghai` 时区的 `0 3 * * *`，即每天北京时间 03:00。`WorkflowConfigService` 读取 `1_of_week_workflow` 到 `7_of_week_workflow`，缺省时使用微信工作流。定时入口传入空参数，因此可能不经过界面确认就创建草稿。内容模式回退到 `CONTENT_MODE`，示例为 `AI_NEWS_SITE`。定时功能要求进程持续运行，界面尚未提供计划编辑器。

## 常见问题

| 现象 | 检查方法 |
| --- | --- |
| 找不到 `.env.template` | 仓库实际文件为 `.env.example`，请使用上面的命令 |
| 端口被占用 | 停止已有进程；演示和真实服务分别使用 8001、8000 |
| 页面没有样式或图标 | 检查是否能访问 `public/index.html` 使用的 Tailwind、Font Awesome、Mermaid 和字体 CDN |
| 还没开始采集就失败 | 检查微信凭据、接口权限和出口 IP 白名单 |
| 模型报错或不存在 | 检查服务商前缀、端点、密钥、模型和账号区域 |
| 封面生成或上传失败 | 检查图片服务配置，或提供有效的 `DEFAULT_COVER_IMAGE_URL` |
| 没有新文章 | 检查来源可用性及本地去重记录 |
| 重启后预览消失 | 当前预览存放在进程内存中；已保存的本地文章需另行查看 |
| `deno check src/index.ts` 失败 | 查看[验证记录](VERIFICATION.zh-CN.md)中的原有错误；独立演示有自己的检查 |

## 本地文件

生成文章、采集数据、图片和记录由存储工具写入 `data/`。`.env`、`data/`、依赖目录和提交产物已加入忽略规则，但规则不会移除仓库中已经跟踪的文件。提交修改前应检查实际文件清单。
