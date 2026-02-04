# TrendPublish

AI 趋势发现和内容发布系统，支持多源数据采集、智能总结和自动发布到微信公众号。

## 快速开始

### 一键配置环境

**Windows (PowerShell):**
```powershell
.\setup.ps1
```
或双击 `setup.bat`

**macOS / Linux:**
```bash
./setup.sh
```

### 一键启动

**Windows:**
```cmd
start.bat
```
或双击 `start.bat`

**macOS / Linux:**
```bash
./start.sh
```

**或使用 Deno 命令:**
```bash
deno task start
```

启动后自动打开浏览器访问控制面板: http://localhost:8000

---

## 手动安装

如果一键脚本无法使用，可手动安装：

### 1. 安装 Deno

**Windows (PowerShell):**
```powershell
irm https://deno.land/install.ps1 | iex
```

**macOS / Linux:**
```bash
curl -fsSL https://deno.land/install.sh | sh
```

### 2. 安装依赖

```bash
deno install --allow-scripts
```

### 3. 配置环境变量

```bash
cp .env.template .env
# 编辑 .env 文件，填入你的 API 密钥
```

### 4. 启动

```bash
deno task start
```

---

## 配置说明

编辑 `.env` 文件配置以下内容：

| 配置项 | 说明 | 示例 |
|--------|------|------|
| `DEFAULT_LLM_PROVIDER` | 默认 AI 模型 | `DEEPSEEK` |
| `DEEPSEEK_API_KEY` | DeepSeek API 密钥 | `sk-xxx` |
| `WEIXIN_APP_ID` | 微信公众号 AppID | `wx123456` |
| `WEIXIN_APP_SECRET` | 微信公众号密钥 | `xxxxx` |
| `CONTENT_MODE` | 内容模式 | `AI_NEWS_SITE` |

详细配置参考 `.env.template` 文件。

---

## 功能特性

- 多源数据采集 (AI 新闻、GitHub Trending、网页抓取)
- 多 AI 模型支持 (DeepSeek, Gemini, OpenAI, 通义千问)
- 智能内容总结与排序
- 微信公众号自动发布
- 图形化控制面板
- 实时日志监控

---

## 许可证

MIT License
