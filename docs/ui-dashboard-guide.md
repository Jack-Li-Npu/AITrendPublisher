# TrendPublish UI 控制面板使用指南

## 快速开始

### 方式一：开发/测试模式

直接运行，系统会自动打开浏览器 UI 界面：

```bash
deno task start
```

### 方式二：单文件执行程序

#### 1. 打包为 EXE

```bash
# Windows 64位
deno task build:win

# macOS Intel
deno task build:mac-x64

# macOS Apple Silicon
deno task build:mac-arm64

# Linux 64位
deno task build:linux-x64

# 一次性编译所有平台
deno task build:all
```

#### 2. 运行程序

双击生成的 `TrendPublish.exe`（Windows）或对应平台的可执行文件，系统会：
1. 自动启动后端服务（监听 8000 端口）
2. 自动打开系统默认浏览器
3. 显示控制面板界面

## UI 功能说明

### 1. 配置中心（右上角齿轮图标）

点击进入配置界面，可以直接在 UI 中编辑所有环境变量：

**AI 服务密钥**：
- `GEMINI_API_KEY` - Google Gemini API 密钥
- `DEEPSEEK_API_KEY` - DeepSeek API 密钥
- `FIRE_CRAWL_API_KEY` - FireCrawl 网页抓取 API 密钥

**微信与通知**：
- `WEIXIN_APP_ID` - 微信公众号 AppID
- `WEIXIN_APP_SECRET` - 微信公众号 AppSecret
- `BARK_URL` - Bark 通知服务 URL

**系统设置**：
- `DEFAULT_LLM_PROVIDER` - 默认 LLM 模型（如 `GEMINI:gemini-2.0-flash-exp`）
- `AUTHOR` - 微信文章作者名称

点击"保存并应用配置"后，修改会立即写入本地 `.env` 文件。

### 2. 运行模式选择

左侧面板提供四种运行模式：

#### 🗞️ 科技新闻（TECH_NEWS）
- 爬取多源 AI 科技新闻
- 自动翻译、总结和排版
- 适合每日科技资讯推送

#### 🐙 GitHub Trending
- 自动抓取 GitHub 热门项目
- 解析 README 并生成深度技术文章
- 包含项目介绍、技术分析和使用指南

#### 🔗 单链接爬取（SINGLE_URL）
- 指定任意技术文章 URL
- 深度翻译并适度扩充
- 适合转载优质技术博客

#### 🔍 主题搜索（TOPIC_SEARCH）
- 根据关键词全网搜索
- 智能筛选优质内容
- 自动生成专题文章

### 3. 参数配置

**内容长度（字数）**：
- 左侧滑块：最小字数（500-5000）
- 右侧滑块：最大字数（1000-10000）
- 实时显示当前范围

**最大采集篇数**：
- 选择 1/3/5/8 篇文章
- 控制单次采集的内容数量

### 4. 实时运行日志

页面中央的黑色终端窗口会实时显示：
- 工作流执行进度
- 内容抓取状态
- AI 处理信息
- 图片上传进度
- 错误和警告信息

日志类型：
- 🟢 绿色：普通信息
- 🟡 黄色：警告信息
- 🔴 红色：错误信息

### 5. 预览与发布

任务完成后，页面右侧会自动滑出预览窗口，显示：
- 完整的文章内容（微信公众号样式）
- 文章标题和封面
- 所有图片和排版效果

操作按钮：
- **再改改**：关闭预览，返回日志界面
- **确认发布到公众号**：将文章上传至微信公众号草稿箱

## 使用流程示例

### 场景一：发布 GitHub 热门项目

1. 点击"GitHub Trending"模式
2. 设置字数范围：800-1200 字
3. 选择最大采集篇数：5 篇
4. 点击"开始运行任务"
5. 观察实时日志，等待处理完成
6. 在预览窗口查看文章效果
7. 点击"确认发布到公众号"

### 场景二：转载优质技术博客

1. 点击"单链接爬取"模式
2. 在"文章 URL"输入框粘贴链接
3. 设置字数上限：2000 字
4. 点击"开始运行任务"
5. 等待翻译和处理
6. 预览并发布

## 常见问题

### Q1: 浏览器没有自动打开？
手动访问 `http://localhost:8000`

### Q2: 配置修改后没有生效？
部分配置（如模型选择）可能需要重启程序才能生效。保存配置后，关闭程序重新运行。

### Q3: 任务执行失败？
检查实时日志中的错误信息，常见原因：
- API Key 未配置或无效
- 网络连接问题
- 目标网站无法访问

### Q4: 预览窗口没有弹出？
检查日志是否有错误，可能原因：
- 内容生成失败
- 图片处理超时
- LLM API 调用失败

## 技术细节

### 架构设计

```
┌─────────────────┐
│  Browser UI     │ ← 用户交互界面
└────────┬────────┘
         │ HTTP/SSE/JSON-RPC
┌────────▼────────┐
│  Deno Server    │ ← 后端服务（集成在 EXE 中）
│  - Static Files │
│  - Log Stream   │
│  - RPC API      │
└────────┬────────┘
         │
┌────────▼────────┐
│  Workflow       │ ← 工作流引擎
│  - Scraper      │
│  - AI Processor │
│  - Publisher    │
└─────────────────┘
```

### 日志系统

使用 Server-Sent Events (SSE) 实时推送日志：
- 后端通过 `LogCollector` 拦截所有 console 输出
- 前端通过 `/api/logs` 接口建立 SSE 连接
- 实时接收并显示在终端窗口

### 预览机制

工作流在 `previewOnly` 模式下：
1. 正常执行到文章生成步骤
2. 将 HTML 缓存到 `PreviewStore`
3. 跳过微信发布步骤
4. 前端轮询 `getArticlePreview` 接口
5. 收到预览数据后展示
6. 用户确认后调用 `confirmPublish` 完成发布

### 数据持久化

配置修改会立即写入 `.env` 文件：
- 保留原有注释和格式
- 更新已存在的键值对
- 追加新的配置项
- 同步更新内存中的 `Deno.env`

## 高级功能

### API 接口

UI 界面基于 JSON-RPC 2.0 协议与后端通信，支持的方法：

| 方法 | 参数 | 说明 |
|------|------|------|
| `triggerWorkflow` | workflowType, contentMode, maxArticles, minWords, maxWords, previewOnly | 触发工作流 |
| `getEnvConfig` | - | 获取当前环境配置 |
| `saveEnvConfig` | 键值对对象 | 保存配置到 .env |
| `getArticlePreview` | - | 获取预览内容 |
| `confirmPublish` | - | 确认发布到微信 |

### 自定义开发

如果需要修改 UI 界面：
1. 编辑 `public/index.html`
2. 重新运行或打包
3. 所有修改会自动包含在 EXE 中

## 注意事项

⚠️ **首次使用必须配置**：
- 至少配置一个 LLM API Key（推荐 Gemini）
- 配置微信公众号 AppID 和 AppSecret
- 确保服务器 IP 已添加到微信白名单

⚠️ **打包注意事项**：
- 确保 `public/` 目录存在且包含 `index.html`
- 使用 `--include public` 参数将 UI 资源打包进 EXE
- 首次打包可能需要较长时间（下载依赖）

⚠️ **网络要求**：
- 需要访问外部 API（Gemini、微信等）
- 部分功能需要稳定的网络连接
- 建议配置代理（如需要）

## 更新日志

**v2.0 - 2026-01-23**
- 新增集成 UI 控制面板
- 支持在界面中配置环境变量
- 实时日志显示
- 文章预览与确认发布
- 单文件打包功能
- 自动打开浏览器

---

**技术支持**: GitHub Issues - https://github.com/OpenAISpace/ai-trend-publish/issues
