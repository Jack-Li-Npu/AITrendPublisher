## Maestro

> Maestro 将分散的注意力转化为专注的意图。

Maestro 是一款跨平台的桌面应用程序，用于协调您的 AI 代理和项目。它是一个高效率的解决方案，适用于同时处理多个项目的黑客。专为键盘操作为主的高级用户设计。

与 AI 协作创建详细的规范文档，然后让 Auto Run 自动执行它们，每个任务在新的会话中以干净的上下文运行。支持长时间无人值守的会话，目前最长记录是近24小时的连续运行时间。

并行运行多个代理，并提供线性/超人级别的响应界面。当前支持 **Claude Code**、**OpenAI Codex** 和 **OpenCode**，并计划根据用户需求添加更多代理编码工具（如 Aider、Gemini CLI、Qwen3 Coder）。

### 功能

#### 强大功能

- 🌳 **Git Worktrees** - 在隔离的分支上并行运行 AI 代理。从 Git 分支菜单创建工作树子代理，每个子代理在其自己的目录中操作。在主仓库中进行交互式工作，而子代理独立处理任务—然后一键创建 PR。真正的并行开发，无冲突。
- 🤖 **Auto Run & Playbooks** - 基于文件系统的任务运行器，通过 AI 代理批量处理 Markdown 检查列表。创建可重复的工作流程剧本，循环运行，并跟踪带有完整历史记录的进度。每个任务都有自己的 AI 会话，以保持清晰的对话上下文。
- 💬 **Group Chat** - 在单个对话中协调多个 AI 代理。一个调节 AI 负责讨论，将问题路由到正确的代理，并综合他们的回答，以便跨项目的问题和架构讨论。
- 🌐 **Mobile Remote Control** - 内置 Web 服务器，支持二维码访问。从手机监控和控制所有代理。支持本地网络访问和通过 Cloudflare 进行远程隧道访问，可以从任何地方访问。
- 💻 **Command Line Interface** - 完整的命令行接口 (`maestro-cli`) 用于无头操作。列出代理/组，从 cron 作业或 CI/CD 管道运行剧本，支持人类可读或 JSONL 输出，便于脚本编写。
- 🚀 **多代理管理** - 并行运行无限数量的代理和终端会话。每个代理都有自己的工作空间、对话历史和隔离的上下文。
- 📬 **消息队列** - 当 AI 忙碌时，排队消息；当代理准备好时，自动发送消息。永远不会丢失想法。

#### 核心功能

- 🔄 **双模式会话** - 每个代理都有 AI 终端和命令终端。使用 `Cmd+J` 在 AI 对话和 shell 命令之间无缝切换。
- ⌨️ **键盘优先设计** - 全键盘控制，可自定义快捷键和掌握跟踪，奖励您提升技能。`Cmd+K` 快速操作、快速代理切换和焦点管理，专为流畅状态设计。
- 📋 **会话发现** - 自动发现并导入来自所有支持提供商的现有会话，包括在安装 Maestro 之前的所有对话。浏览、搜索、收藏、重命名和恢复任何会话。
- 🔀 **Git 集成** - 自动仓库检测、分支显示、差异查看器、提交日志和 Git 感知文件补全。无需离开应用程序即可使用 Git。
- 📁 **文件浏览器** - 浏览项目文件，支持语法高亮、Markdown 预览和图像查看。在提示中引用文件，使用 `@` 提及。
- 🔍 **强大的输出过滤** - 使用包含/排除模式、正则表达式支持和每条回复的本地过滤器搜索和过滤 AI 输出。
- ⚡ **斜杠命令** - 可扩展的命令系统，支持自动补全。使用模板变量为您的工作流创建自定义命令。
- 💾 **草稿自动保存** - 永远不会丢失工作。草稿会自动保存并在按会话恢复。
- 🔊 **可说的通知** - 任务完成时，带有文本转语音公告的音频提醒。
- 🎨 **美观的主题** - 12种主题，包括 Dracula、Monokai、Nord、Tokyo Night、GitHub Light 等。
- 💰 **成本跟踪** - 实时令牌使用和成本跟踪，按会话和全局统计。
- 🏆 **成就** - 根据累积的 Auto Run 时间从学徒升级到指挥棒泰坦。11个指挥主题等级待解锁。

### 分析与可视化

- 📊 **使用仪表板** - 全面分析所有会话中的 AI 使用模式。查看聚合统计数据，支持多种时间范围（天、周、月、年、全部时间），比较代理性能，分析用户与 Auto Run 活动分布，并探索活动热图。包括 CSV 导出、实时更新和可配置的色盲友好调色板。通过 `Opt+Cmd+U` (macOS) / `Alt+Ctrl+U` (Windows/Linux) 或 Command K 菜单访问。
- 🕸️ **文档图** - 可视化知识图谱，展示您的 Markdown 文档。自动发现内部 `[[wiki-links]]` 和 `[markdown](links)`，以交互节点和边的形式可视化文档关系。在力导向和分层布局之间切换，搜索/过滤文档，通过键盘导航，并跟踪外部链接引用。包括迷你地图、图例和分页，适用于大型目录。通过文件浏览器上下文菜单或 Command K 菜单访问。

#### 分析功能的键盘快捷键

**使用仪表板** (`Opt+Cmd+U` / `Alt+Ctrl+U`):
| 操作 | 键 |
|--------|-----|
| 导航视图标签 | 左/右/上/下箭头 |
| 在部分之间移动 | Tab / Shift+Tab |
| 跳到第一个/最后一个部分 | Home / End |
| 关闭仪表板 | Escape |

**文档图** (Command K → "Document Graph"):
| 操作 | 键 |
|--------|-----|
| 导航到连接的节点 | 上/下/左/右箭头 |
| 循环遍历连接 | Tab |
| 打开选定的文档/链接 | Enter |
| 关闭图 | Escape |
| 搜索文档 | 聚焦搜索输入，输入查询 |

其他交互：拖动节点重新定位，滚动缩放，使用迷你地图概览。

> **注意**：Maestro 支持 Claude Code、OpenAI Codex 和 OpenCode。未来版本可能会根据社区需求添加对其他代理（如 Aider、Gemini CLI、Qwen3 Coder）的支持。

## 快速开始

### 安装

从 [Releases 页面](https://github.com/pedramamini/Maestro/releases) 下载最新版本。

或者从源代码构建：

```bash
git clone https://github.com/pedramamini/Maestro.git
cd Maestro
npm install
npm run dev
```

### 要求

- 至少安装并认证一个支持的 AI 编码代理：
  - [Claude Code] - Anthropic 的 AI 编码助手
  - [OpenAI Codex] - OpenAI 的编码代理
  - [OpenCode] - 开源 AI 编码助手
- Git（可选，用于 Git 感知功能）

### 必要的键盘快捷键

| 操作 | macOS | Windows/Linux |
|--------|-------|---------------|
| 快速操作 | `Cmd+K` | `Ctrl+K` |
| 新建代理 | `Cmd+N` | `Ctrl+N` |
| 切换 AI/终端 | `Cmd+J` | `Ctrl+J` |
| 上一个/下一个代理 | `Cmd+[` / `Cmd+]` | `Ctrl+[` / `Ctrl+]` |
| 切换侧边栏 | `Cmd+B` | `Ctrl+B` |
| 新建标签页 | `Cmd+T` | `Ctrl+T` |
| 使用仪表板 | `Opt+Cmd+U` | `Alt+Ctrl+U` |
| 所有快捷键 | `Cmd+/` | `Ctrl+/` |

[完整的键盘快捷键参考](https://docs.runmaestro.ai/keyboard-shortcuts)

## 截图

<p align="center">
  <img src="https://raw.githubusercontent.com/pedramamini/Maestro/main/docs/screenshots/main-screen.png" alt="Maestro 主屏幕" width="800">
</p>

*主屏幕，显示多个代理和对话*

<p align="center">
  <img src="https://raw.githubusercontent.com/pedramamini/Maestro/main/docs/screenshots/group-chat.png" alt="群聊" width="800">
</p>

*群聊在一个对话中协调多个 AI 代理*

<p align="center">
  <img src="https://raw.githubusercontent.com/pedramamini/Maestro/main/docs/screenshots/cmd-k-1.png" alt="命令面板" width="800">
</p>

*快速操作面板，用于快速导航 (CTRL/CMD + K)*

<p align="center">
  <img src="https://raw.githubusercontent.com/pedramamini/Maestro/main/docs/screenshots/git-diff.png" alt="Git 差异查看器" width="800">
</p>

*Git 差异查看器，带语法高亮*

[查看更多...](docs/screenshots/)