# Maestro

> Maestro 将分散的注意力磨练成专注的意图。

Maestro 是一个跨平台的桌面应用程序，用于协调您的 AI 代理和项目。对于并行处理多个项目的黑客来说，它是一个高速解决方案。专为键盘操作且很少使用鼠标的高级用户而设计。

与 AI 协作创建详细的规范文档，然后让 Auto Run 自动执行它们，每个任务都在具有干净上下文的全新会话中进行。允许长时间无人值守的会话，我目前的记录是近 24 小时的连续运行时间。

以 Linear/Superhuman 级别的响应式界面并行运行多个代理。目前支持 **Claude Code**、**OpenAI Codex** 和 **OpenCode**，并计划根据用户需求添加其他代理编码工具（Aider、Gemini CLI、Qwen3 Coder）。

<div align="center">
  <a href="https://youtu.be/fmwwTOg7cyA?si=dJ89K54tGflKa5G4">
    <img src="https://github.com/user-attachments/assets/deaf601d-1898-4ede-bf5a-42e46874ebb3"
         alt="Maestro Video Thumbnail"
         width="650" />
  </a>

  <div>
    <a href="https://youtu.be/fmwwTOg7cyA?si=VOkjO6oYjCSQvM0A">~27 分钟的演练和演示</a>
    &nbsp;|&nbsp;
    <a href="https://youtu.be/3wX5Q1I0sgI?si=oJkJDxgAWUvBXX4D">~6 分钟的入门演示</a>
  </div>
</div>

## 功能

### 强大功能

- 🌳 **[Git Worktrees](https://docs.runmaestro.ai/git-worktrees)** - 在隔离的分支上并行运行 AI 代理。从 git 分支菜单创建 worktree 子代理，每个代理都在自己的目录中运行。在主存储库中进行交互式工作，而子代理独立处理任务，然后一键创建 PR。真正的并行开发，没有冲突。
- 🤖 **[Auto Run & Playbooks](https://docs.runmaestro.ai/autorun-playbooks)** - 基于文件系统的任务运行器，通过 AI 代理批量处理 markdown 检查表。创建用于可重复工作流程的剧本，循环运行，并通过完整的历史记录跟踪进度。每个任务都有自己的 AI 会话，以获得干净的对话上下文。
- 💬 **[群聊](https://docs.runmaestro.ai/group-chat)** - 在单个对话中协调多个 AI 代理。主持人 AI 协调讨论，将问题路由到正确的代理，并综合他们的回答，以解决跨项目问题和架构讨论。
- 🌐 **[移动远程控制](https://docs.runmaestro.ai/remote-access)** - 内置 Web 服务器，可通过 QR 码访问。通过手机监控和控制所有代理。支持本地网络访问和通过 Cloudflare 进行的远程隧道，以便从任何地方进行访问。
- 💻 **[命令行界面](https://docs.runmaestro.ai/cli)** - 完整的 CLI (`maestro-cli`) 用于无头操作。列出代理/组，从 cron 作业或 CI/CD 管道运行剧本，并提供人类可读或 JSONL 输出以进行脚本编写。
- 🚀 **多代理管理** - 并行运行无限数量的代理和终端会话。每个代理都有自己的工作区、对话历史记录和隔离的上下文。
- 📬 **消息队列** - 在 AI 繁忙时对消息进行排队；当代理准备就绪时，它们会自动发送。永远不会丢失想法。

### 核心功能

- 🔄 **双模式会话** - 每个代理都有一个 AI 终端和一个命令终端。使用 `Cmd+J` 在 AI 对话和 shell 命令之间无缝切换。
- ⌨️ **[键盘优先设计](https://docs.runmaestro.ai/keyboard-shortcuts)** - 通过可自定义的快捷键和 [精通跟踪](https://docs.runmaestro.ai/keyboard-shortcuts#keyboard-mastery) 实现完全键盘控制，奖励您的升级。`Cmd+K` 快速操作、快速代理切换和焦点管理专为流畅状态而设计。
- 📋 **会话发现** - 自动发现并导入来自所有受支持提供商的现有会话，包括在安装 Maestro 之前进行的对话。浏览、搜索、收藏、重命名和恢复任何会话。
- 🔀 **Git 集成** - 自动存储库检测、分支显示、差异查看器、提交日志和 git 感知文件完成。无需离开应用程序即可使用 git。
- 📁 **[文件资源管理器](https://docs.runmaestro.ai/general-usage#file-explorer-and-preview)** - 浏览具有语法突出显示、markdown 预览和图像查看的项目文件。使用 `@` 提及在提示中引用文件。
- 🔍 **[强大的输出过滤](https://docs.runmaestro.ai/general-usage#output-filtering)** - 使用包含/排除模式、正则表达式支持和每个响应的本地过滤器搜索和过滤 AI 输出。
- ⚡ **[斜杠命令](https://docs.runmaestro.ai/slash-commands)** - 具有自动完成功能的可扩展命令系统。使用模板变量为您的工作流程创建自定义命令。
- 💾 **草稿自动保存** - 永远不会丢失工作。草稿会自动保存并按会话恢复。
- 🔊 **可语音通知** - 当代理完成任务时，带有文本到语音公告的音频警报。
- 🎨 **[精美主题](THEMES.md)** - 12 个主题，包括 Dracula、Monokai、Nord、Tokyo Night、GitHub Light 等。
- 💰 **成本跟踪** - 实时跟踪每个会话和全局的令牌使用情况和成本。
- 🏆 **[成就](https://docs.runmaestro.ai/achievements)** - 根据累积的 Auto Run 时间，从学徒升级到指挥棒泰坦。11 个以指挥家为主题的等级可供解锁。

### 分析与可视化

- 📊 **使用情况仪表板** - 全面的分析，用于跟踪所有会话中的 AI 使用模式。查看具有多个时间范围（日、周、月、年、所有时间）的聚合统计信息，比较代理性能，分析用户与 Auto Run 活动分布，并探索活动热图。包括 CSV 导出、实时更新和可配置的色盲友好调色板。通过 `Opt+Cmd+U` (macOS) / `Alt+Ctrl+U` (Windows/Linux) 或 Command K 菜单访问。
- 🕸️ **文档图** - markdown 文档的可视化知识图。自动发现内部 `[[wiki-links]]` 和 `[markdown](links)`，使用交互式节点和边可视化文档关系。在力导向和分层布局之间切换，搜索/过滤文档，通过键盘导航，并跟踪外部链接引用。包括小地图、图例和大型目录的分页。从文件资源管理器上下文菜单或 Command K 菜单访问。

#### 分析功能的键盘快捷键

**使用情况仪表板** (`Opt+Cmd+U` / `Alt+Ctrl+U`):
| 操作 | 键 |
|--------|-----|
| 导航视图选项卡 | 向左/向右/向上/向下箭头 |
| 在各部分之间移动 | Tab / Shift+Tab |
| 跳转到第一/最后一部分 | Home / End |
| 关闭仪表板 | Escape |

**文档图** (Command K → "Document Graph"):
| 操作 | 键 |
|--------|-----|
| 导航到连接的节点 | 向上/向下/向左/向右箭头 |
| 循环浏览连接 | Tab |
| 打开选定的文档/链接 | Enter |
| 关闭图 | Escape |
| 搜索文档 | 聚焦搜索输入，键入查询 |

其他交互：拖动节点以重新定位，滚动以缩放，使用小地图进行概览。

> **注意**: Maestro 支持 Claude Code、OpenAI Codex 和 OpenCode。未来版本可能会根据社区需求添加对其他代理（Aider、Gemini CLI、Qwen3 Coder）的支持。

## 快速开始

### 安装

从 [Releases page](https://github.com/pedramamini/Maestro/releases) 下载适用于您平台的最新版本。

或者从源代码构建：

```bash
git clone https://github.com/pedramamini/Maestro.git
cd Maestro
npm install
npm run dev
```

### 要求

- 至少安装并验证了一个受支持的 AI 编码代理：
  - [Claude Code](https://docs.anthropic.com/en/docs/claude-code) - Anthropic 的 AI 编码助手
  - [OpenAI Codex](https://github.com/openai/codex) - OpenAI 的编码代理
  - [OpenCode](https://github.com/sst/opencode) - 开源 AI 编码助手
- Git（可选，用于 git 感知功能）

### 常用键盘快捷键

| 操作 | macOS | Windows/Linux |
|--------|-------|---------------|
| 快速操作 | `Cmd+K` | `Ctrl+K` |
| 新建代理 | `Cmd+N` | `Ctrl+N` |
| 切换 AI/终端 | `Cmd+J` | `Ctrl+J` |
| 上一个/下一个代理 | `Cmd+[` / `Cmd+]` | `Ctrl+[` / `Ctrl+]` |
| 切换侧边栏 | `Cmd+B` | `Ctrl+B` |
| 新建标签页 | `Cmd+T` | `Ctrl+T` |
| 使用情况仪表板 | `Opt+Cmd+U` | `Alt+Ctrl+U` |
| 所有快捷键 | `Cmd+/` | `Ctrl+/` |

[完整的键盘快捷键参考](https://docs.runmaestro.ai/keyboard-shortcuts)

## 截图

<p align="center">
  <img src="https://raw.githubusercontent.com/pedramamini/Maestro/main/docs/screenshots/main-screen.png" alt="Maestro Main Screen" width="800">
</p>

*具有多个代理和对话的主屏幕*

<p align="center">
  <img src="https://raw.githubusercontent.com/pedramamini/Maestro/main/docs/screenshots/group-chat.png" alt="Group Chat" width="800">
</p>

*群聊在单个对话中协调多个 AI 代理*

<p align="center">
  <img src="https://raw.githubusercontent.com/pedramamini/Maestro/main/docs/screenshots/cmd-k-1.png" alt="Command Palette" width="800">
</p>

*用于快速导航的快速操作面板 (CTRL/CMD + K)*

<p align="center">
  <img src="https://raw.githubusercontent.com/pedramamini/Maestro/main/docs/screenshots/git-diff.png" alt="Git Diff Viewer" width="800">
</p>

*具有语法突出显示的 Git 差异查看器*

[查看更多...](docs/screenshots/)

## 文档

完整的文档和使用指南可在 **[docs.runmaestro.ai](https://docs.runmaestro.ai)** 上找到

- [安装](https://docs.runmaestro.ai/installation)
- [入门](https://docs.runmaestro.ai/getting-started)
- [功能概述](https://docs.runmaestro.ai/features)
- [Auto Run + Playbooks](https://docs.runmaestro.ai/autorun-playbooks)
- [Git Worktrees](https://docs.runmaestro.ai/git-worktrees)
- [键盘快捷键](https://docs.runmaestro.ai/keyboard-shortcuts)
- [上下文管理](https://docs.runmaestro.ai/context-management)
- [MCP 服务器](https://docs.runmaestro.ai/mcp-server) - 将 AI 应用程序连接到 Maestro 文档
- [故障排除](https://docs.runmaestro.ai/troubleshooting)

## 社区

- **Discord**: [加入我们](https://runmaestro.ai/discord)
- **GitHub Issues**: [报告错误并请求功能](https://github.com/pedramamini/Maestro/issues)

## 贡献

有关开发设置、架构详细信息和贡献指南，请参阅 [CONTRIBUTING.md](CONTRIBUTING.md)。

## 许可证

[AGPL-3.0 License](LICENSE)