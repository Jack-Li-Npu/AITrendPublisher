# TrendPublish v2.0 - UI 控制面板更新

## 概述

TrendPublish 现在提供了完整的图形化用户界面 (UI)，可以通过双击 `.exe` 文件直接启动并在浏览器中管理所有功能。

## 新功能

### 1. 集成 UI 控制面板
- 🎨 现代化设计，基于 Tailwind CSS
- ⚙️ 直接在 UI 中配置环境变量（.env）
- 📊 实时日志监控（黑色终端风格）
- 👁️ 文章预览功能
- ✅ 手动确认发布机制

### 2. 单文件可执行程序
- 📦 使用 `deno compile` 打包为单文件
- 🚀 双击即可运行，无需安装任何依赖
- 🌐 自动打开浏览器访问控制面板
- 💾 所有 UI 资源嵌入在 EXE 中

### 3. 工作流增强
- 📝 支持字数范围控制（minWords/maxWords）
- ⏸️ 预览模式：生成后暂停，等待用户确认
- 🎯 四种运行模式可选

## 使用方式

### 开发模式
```bash
deno task start
```
自动打开 `http://localhost:8000`

### 打包为 EXE
```bash
# Windows
deno task build:win

# macOS
deno task build:mac-x64
deno task build:mac-arm64

# Linux
deno task build:linux-x64
```

生成文件：
- `TrendPublish.exe` (Windows)
- `TrendPublish-mac-x64` (macOS Intel)
- `TrendPublish-mac-arm64` (macOS Apple Silicon)
- `TrendPublish-linux-x64` (Linux)

### 双击运行
1. 双击可执行文件
2. 等待后端启动（约 2-3 秒）
3. 浏览器自动打开控制面板
4. 在 UI 中配置 API Key 等参数
5. 选择模式并运行任务
6. 预览文章并确认发布

## 技术实现

### 核心技术
- **后端**: Deno Runtime（内置 TypeScript 支持）
- **前端**: 原生 HTML5 + Tailwind CSS + JavaScript
- **通信**: JSON-RPC 2.0 + Server-Sent Events (SSE)
- **打包**: Deno Compile（单文件二进制）

### 新增文件
```
src/
├── utils/
│   ├── config/
│   │   └── env-editor.ts          # .env 文件读写
│   ├── log-collector.ts            # 日志拦截器
│   └── preview-store.ts            # 预览内容缓存
├── controllers/
│   └── ui.controller.ts            # UI 接口控制器
public/
└── index.html                      # 控制面板界面
```

### 修改文件
- `src/index.ts` - 添加自动打开浏览器
- `src/server.ts` - 集成静态服务、SSE、新 RPC 接口
- `src/services/weixin-article.workflow.ts` - 支持预览模式和字数参数
- `src/modules/summarizer/ai.summarizer.ts` - 支持字数参数传递
- `deno.json` - 更新编译命令

## API 接口

### JSON-RPC 方法

| 方法 | 说明 |
|------|------|
| `triggerWorkflow` | 触发工作流（支持所有参数） |
| `getEnvConfig` | 获取当前环境配置 |
| `saveEnvConfig` | 保存配置到 .env 文件 |
| `getArticlePreview` | 获取待发布的预览内容 |
| `confirmPublish` | 确认发布到微信公众号 |

### SSE 端点
- `GET /api/logs` - 实时日志流

### 静态资源
- `GET /` - UI 控制面板首页
- `GET /public/*` - 其他静态资源

## 配置说明

### 必需配置
在 UI 界面的"配置中心"（右上角齿轮）中填写：

1. **AI 服务**（至少配置一个）
   - `GEMINI_API_KEY` - Google Gemini（推荐）
   - `DEEPSEEK_API_KEY` - DeepSeek（高性价比）

2. **微信公众号**
   - `WEIXIN_APP_ID`
   - `WEIXIN_APP_SECRET`

3. **其他可选**
   - `FIRE_CRAWL_API_KEY` - 网页抓取
   - `BARK_URL` - 通知服务

### 可选配置
- `DEFAULT_LLM_PROVIDER` - 默认模型
- `AUTHOR` - 文章作者名称
- `ARTICLE_MIN_LENGTH` - 文章最小字数
- `ARTICLE_MAX_LENGTH` - 文章最大字数

## 注意事项

⚠️ **首次使用**：
- 必须先在 UI 配置 API Key
- 保存配置后会自动写入 `.env` 文件
- 部分配置可能需要重启程序生效

⚠️ **打包注意**：
- 确保 `public/index.html` 存在
- 编译时会自动包含 UI 资源
- 首次编译可能需要下载依赖（较慢）

⚠️ **网络要求**：
- 需要访问外部 API（Gemini、微信等）
- 建议配置稳定的网络连接

## 详细文档

- [UI 控制面板使用指南](./ui-dashboard-guide.md)
- [完整使用指南](../完整使用指南.md)

---

**版本**: v2.0  
**更新日期**: 2026-01-23  
**作者**: TrendPublish Team
