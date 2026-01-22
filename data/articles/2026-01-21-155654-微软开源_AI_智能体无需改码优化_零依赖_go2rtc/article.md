# 微软开源！AI 智能体无需改码优化 零依赖！go2rtc

`Agent Lightning` 让你无需改动代码就能实现 AI 智能体的性能飞跃。
`go2rtc` 以零依赖和低延迟，构建起全能型音视频流媒体转发中枢。
`Awesome Remote Job` 汇集了全球最前沿、最实用的远程工作机会与资源。
`try` 是一个精妙的工具，让你轻松管理和追踪那些难以驾驭的实验目录。

---

## Agent Lightning：无需修改代码即可优化 AI 智能体 (⭐ 10.9k)

Agent Lightning 是一个由微软推出的项目，旨在为 AI 智能体提供一个轻量级的训练框架，使用强化学习、自动提示优化等算法对现有智能体进行优化。

---

### 项目简介

Agent Lightning 作为一个 AI 智能体训练框架，支持在**无需修改核心代码**的情况下，集成到现有的智能体系统中。它能兼容 LangChain、AutoGen、CrewAI 等主流框架，或直接用于纯 Python 的 OpenAI 调用。该工具的核心优势在于提供了一种**选择性优化**（Selectively optimize）机制，能够将强化学习等高级算法应用于智能体，实现性能提升。

---

### Agent Lightning 技术解析

Agent Lightning 的架构设计最小化了组件间的耦合，允许开发者专注于核心逻辑而非底层实现。系统通过轻量级的 `agl.emit_xxx()` 辅助函数或自动追踪（tracer）收集智能体的交互数据（提示、工具调用、奖励），并将这些事件结构化为跨度（spans）。这些跨度汇集到 `LightningStore`，作为任务、资源和追踪数据的中心枢纽。算法模块从 Store 读取数据进行学习，并将优化后的资源（如改进的提示模板或策略权重）写入 Store。`Trainer` 负责协调数据集流、资源同步以及推理引擎的更新。

![Agent-lightning Architecture](https://github.com/microsoft/agent-lightning/raw/main/docs/assets/readme-architecture.svg)

> 这种设计路径清晰，实现了从首次部署到持续改进的平滑过渡，避免了重写和锁定。

---

### ⚡ 核心特性

Agent Lightning 提供了一套高效的智能体优化能力：

- **零代码修改优化**：将智能体转变为可优化的实体，仅需极少的代码改动。
- **框架兼容性强**：支持 LangChain, OpenAI Agent SDK, AutoGen, CrewAI 等几乎所有主流或自建的智能体框架。
- **选择性优化**：允许在多智能体系统中精确选择一个或多个智能体进行优化。
- **算法支持**：内置强化学习（RL）、自动提示优化（Automatic Prompt Optimization）、监督微调（SFT）等算法。

[![Agent-Lightning Core Quickstart](https://github.com/microsoft/agent-lightning/raw/main/docs/assets/readme-diff.svg)](https://github.com/microsoft/agent-lightning/blob/main/docs/assets/readme-diff.svg)

---

### ⚡ 安装

安装 Agent-lightning 非常直接，通过 pip 即可完成：

```bash
pip install agentlightning
```

若需获取最新的、包含前沿特性的版本（nightly build），可从 Test PyPI 安装：

```bash
pip install --upgrade --index-url https://test.pypi.org/simple/ --extra-index-url https://pypi.org/simple/ --pre agentlightning
```

更多部署细节请参考 [installation guide](https://microsoft.github.io/agent-lightning/stable/tutorials/installation/)。

要开始使用 Agent-lightning，请查阅 [documentation](https://microsoft.github.io/agent-lightning/) 和 [examples](https://github.com/microsoft/agent-lightning/blob/main/examples)。

---

### ⚡ 社区项目

Agent Lightning 已被多个社区项目采纳和扩展：

- **DeepWerewolf**：一个使用 AgentScope 和 Agent Lightning 构建的中文狼人杀游戏 RL 训练案例。
- **AgentFlow**：一个模块化的多智能体框架，结合 Flow-GRPO 算法来处理长程、稀疏奖励任务。
- **Youtu-Agent**：基于 Agent Lightning 修改分支构建的智能体训练工具，已验证在数学/代码和搜索任务上支持高达 **128 块 GPU** 的 RL 训练，收敛稳定。相关技术分享请参考其博客 [_Stop Wrestling with Your Agent RL: How Youtu-Agent Achieved Stable, 128-GPU Scaling Without Breaking a Sweat_](https://spotted-coconut-df8.notion.site/Stop-Wrestling-with-Your-Agent-RL-How-Youtu-Agent-Achieved-Stable-128-GPU-Scaling-Without-Breaking-2ca5e8f089ba80539a98c582b65e0233)。

---

### ⚡ 官方文章与资源

社区和微软研究院发布了多篇关于 Agent Lightning 的技术文章和项目介绍：

- 微软研究院项目页面：[Agent Lightning - Microsoft Research](https://www.microsoft.com/en-us/research/project/agent-lightning/)
- arXiv 论文：[Agent Lightning: Train ANY AI Agents with Reinforcement Learning](https://arxiv.org/abs/2508.03680)
- 社区讨论：[Reddit 讨论](https://www.reddit.com/r/LocalLLaMA/comments/1m9m670/we_discovered_an_approach_to_train_any_ai_agent_with_rl_with_almost_zero_code_changes/)
- 技术博客：涉及使用 Tinker 调优、RL 训练 SQL 编写和自我修正等主题，详情请参考 [Agent-lightning blog](https://agent-lightning.github.io/posts/trajectory_level_aggregation/)、[Medium](https://medium.com/@yugez/tuning-any-ai-agent-with-tinker-agent-lightning-part-1-1d8c9a397f0e) 和 [vLLM blog](https://blog.vllm.ai/2025/10/22/agent-lightning.html)。

---

### ⚡ CI 状态

| Workflow | Status |
| :--- | :--- |
| Unit Tests | [![Unit Tests](https://github.com/microsoft/agent-lightning/actions/workflows/badge-unit.yml/badge.svg)](https://github.com/microsoft/agent-lightning/actions/workflows/badge-unit.yml) |
| Documentation | [![Documentation](https://camo.githubusercontent.com/fdd579453d6bec9bc192bdc482196edaa66d5cb029f92a2c48a4aa922467d0f6/68747470733a2f2f696d672e736869656c64732e696f2f62616467652f47697448756225323050616765732d446f63756d656e746174696f6e2d626c7565)](https://microsoft.github.io/agent-lightning/) |
| PyPI Version | [![PyPI version](https://camo.githubusercontent.com/580ded366a83d7e78a7eeb7e3ff17d381e024565edc396f5e1956b09c63e1e2d/68747470733a2f2f62616467652e667572792e696f2f70792f6167656e746c696768746e696e672e737667)](https://badge.fury.io/py/agentlightning) |
| License | [![License](https://camo.githubusercontent.com/7013272bd27ece47364536a221edb554cd69683b68a46fc0ee96881174c4214c/68747470733a2f2f696d672e736869656c64732e696f2f62616467652f6c6963656e73652d4d49542d626c75652e737667)](https://github.com/microsoft/agent-lightning/blob/main/LICENSE) |
| Ask DeepWiki | [![Ask DeepWiki](https://camo.githubusercontent.com/0f5ae213ac378635adeb5d7f13cef055ad2f7d9a47b36de7b1c67dbe09f609ca/68747470733a2f2f6465657077696b692e636f6d2f62616467652e737667)](https://deepwiki.com/microsoft/agent-lightning) |
| Discord | [![Discord](https://camo.githubusercontent.com/397741123d69503a0a224452a3629154669e9a870686f0c21c68527c7d8faa07/68747470733a2f2f696d672e736869656c64732e696f2f62616467652f446973636f72642d4a6f696e2d3538363546323f6c6f676f3d646973636f7264266c6f676f436f6c6f723d7768697465)](https://discord.gg/RYk7CdvDR7) |

欢迎加入 [Discord 社区](https://discord.gg/RYk7CdvDR7) 与开发者和贡献者交流。


---

## 全能型流媒体应用：go2rtc 打造低延迟、零依赖的音视频转发 (⭐ 11.6k)

go2rtc 是一个终极的摄像机流媒体应用，支持 RTSP、WebRTC、HomeKit、FFmpeg、RTMP 等多种协议。该项目旨在提供最小的延迟和最大的兼容性。

![go2rtc](https://github.com/AlexxIT/go2rtc/raw/master/assets/logo.gif)

---

## 项目简介

go2rtc 作为一个零依赖、零配置的小型应用，可在 Windows、macOS、Linux 和 ARM 等所有操作系统上运行。它在支持的协议上实现了**零延迟**（最低可能的流媒体延迟）。该工具能够摄取多种来源（如 RTSP、RTMP、DVRIP、HTTP、USB 摄像头，以及所有 FFmpeg 支持的源），并输出到 RTSP、WebRTC、MSE/MP4、HomeKit、HLS 或 MJPEG 等多种目标。

| 特性 | go2rtc 优势 | 传统方案对比 |
| :--- | :--- | :--- |
| 依赖性 | 零依赖，单个二进制文件 | 通常需要安装复杂的编解码器和库 |
| 延迟 | 许多协议支持零延迟 | 常见延迟较高 |
| 兼容性 | 支持 FFmpeg 生态，集成多种私有协议 | 仅支持标准协议或需定制开发 |
| 部署 | 跨平台支持，提供 Docker 和 HA 插件 | 部署环境要求高 |

---

## go2rtc 技术解析

go2rtc 的核心在于其强大的流媒体处理能力和广泛的协议支持。它利用 Go 语言的并发特性，实现了高效的媒体流传输和协议转换。项目集成了 FFmpeg 进行动态转码，以处理不支持的编解码器。此外，它支持客户端与源之间的**编解码器协商**，能自动匹配客户端支持的编解码，并支持部分摄像机的**双向音频**。

> go2rtc 是世界上第一个支持从 HomeKit 摄像机流式传输的项目。

支持的媒体格式包括 `h264`, `hevc`, `mp4`, `hls`, `mpegts` 等文件格式，以及网络协议如 `rtsp`, `webrtc`, `rtmp` 等。

支持的网络私有协议种类繁多，涵盖了智能家居生态，如 `homekit`, `tapo`, `wyze`, `xiaomi`, `gopro` 等。

---

## 部署与应用

go2rtc 提供了多种部署方式，包括直接使用二进制文件、Docker 容器，以及集成到 Home Assistant 中。

### go2rtc: Binary

这是最基础的部署方式，适用于所有操作系统。下载对应的二进制文件即可运行。

### go2rtc: Docker

使用 Docker 部署可以快速启动服务，避免环境依赖问题。

```bash
docker pull alexxit/go2rtc
```

### go2rtc: Home Assistant Add-on

对于使用 Home Assistant 的用户，可以直接安装插件进行集成。

### go2rtc: Home Assistant Integration

#### Configuration

go2rtc 的配置通过 `config.yaml` 文件实现，该文件定义了媒体流的输入源和输出目标。

#### Module: Streams

流的定义是配置的核心。可以定义输入源，并为其分配一个别名，供其他模块调用。

#### Source: RTSP

RTSP 源的配置示例。

```yaml
streams:
  camera1:
    rtsp://user:password@192.168.1.100:554/stream1
```

#### Source: FFmpeg

通过 FFmpeg 驱动输入，可以处理更复杂的源，例如 USB 摄像头。

```yaml
streams:
  usb_cam:
    ffmpeg: -f v4l2 -input_format yuyv422 -video_size 640x480 -i /dev/video0
```

#### Source: HomeKit

支持从 HomeKit 摄像机拉流。

```yaml
streams:
  hk_cam:
    homekit: C123456789012345
```

#### Source: Tapo

直接集成 TP-Link Tapo 摄像机。

```yaml
streams:
  tapo_cam:
    tapo: 192.168.1.101:20000 "user" "password"
```

#### Module: API

go2rtc 提供了 API 接口，允许将其集成到任何智能家居平台中进行管理和控制。

---

**Supported Formats** 描述了通信 API 结构，包括授权、加密和媒体包结构。支持的格式包括设备（如 `alsa`, `v4l2`）、文件（如 `flv`, `h264`, `mp4`）以及网络协议（如 `rtmp`, `webrtc`）。

**Supported Protocols** 描述了数据传输的通道，包括公共协议（如 `http`, `rtsp`, `webrtc`）和私有协议（如 `hap`, `tutk`）。

> go2rtc 借鉴了多个优秀的开源项目设计理念，包括 GStreamer 的管道思想和 MediaSoup 的路由思想，同时集成了 Pion 团队的 WebRTC 库。


---

## 精选远程工作资源汇总：Awesome Remote Job (⭐ 42.7k)

这个精选列表汇集了关于远程工作（Telecommuting）的各类资源，包括文章、书籍、工具和招聘信息。它为希望了解或实践远程办公的专业人士提供了一站式信息源。

--- 

### 项目简介

该项目在 GitHub 上收获了超过 **42,752** 个 Star，是目前最全面的远程工作资源集合之一。它涵盖了从远程工作方法论、团队管理、招聘技巧到必备工具的方方面面，有效解决了传统集中办公模式在地域限制和效率管理上的痛点。

--- 

### Awesome Remote Job 技术解析

该列表通过结构化的 Markdown 形式组织内容，确保信息易于检索和访问。它将资源划分为文章、书籍、工具、招聘板等多个维度，便于用户快速定位所需信息。

#### 资源结构

列表的核心价值在于其分类的广度和深度。以下是主要内容板块的概览：

| 类别 | 描述 |
| :--- | :--- |
| Articles & Posts | 远程工作经验、技巧和最佳实践 |
| Job boards | 专门的远程职位发布平台 |
| Tools | 提升远程协作效率的软件列表 |
| Companies with "remote DNA" | 具有原生远程工作文化的组织案例 |
| Relocation Incentives | 鼓励员工搬迁到特定地点的激励政策 | 

--- 

### Articles & Posts

以下是部分精选的远程工作相关文章链接，内容涉及如何避免远程招聘误区、提升远程开发效率以及分布式团队管理经验。

01. [3 mistakes to avoid if you want to get hired remotely](https://x-team.com/blog/mistakes-remote-developers)
02. [5 Things I've Learned From Working Remotely](https://www.donedone.com/blog/five-things-ive-learned-working-remotely)
03. [5 Tricks to Get More Done While Working Remotely](https://rdutel.medium.com/working-remotely-getting-things-done-38dcd0413733)
04. [8 tips that will make you a more active, healthier remote developer](https://x-team.com/blog/how-to-be-healthy-remote)
05. [10 Lessons from 4 Years Working Remotely at Automattic](https://whenihavetime.com/2014/07/08/10-lessons-from-4-years-working-remotely/)
06. [10 Secrets to Becoming a Great Remote Developer](https://x-team.com/blog/10-secrets-to-becoming-a-great-remote-developer)
07. [21 tools that will help your remote team work better together](https://thenextweb.com/news/tools-remote-teams)
08. [30 Tips for Successful Communication as a Remote Worker](https://www.hanselman.com/blog/30-tips-for-successful-communication-as-a-remote-worker)
09. [Acceptance of Telecommuting Project Management Grows](https://www.amanet.org/articles/acceptance-of-telecommuting-project-management-grows/)
10. [Andreessen-Incubated Teleport Aims To Make Location Irrelevant For Mobile Workers](https://techcrunch.com/2014/05/19/teleport/)
11. [Bosses without borders: Essential tools for managing remote workers](https://www.pcworld.com/article/453170/bosses-without-borders-essential-tools-for-managing-remote-workers.html)
12. [Communication for Distributed Teams](https://www.lullabot.com/articles/communication-for-distributed-teams)
13. [Currents: The Remote Developer Experience (July 2019)](https://www.digitalocean.com/blog/currents-july2019)
14. [Datadog Engineering: 9 ways to make working remote work for you](https://www.datadoghq.com/blog/pup-culture/9-ways-to-make-working-remote-work-for-you/)
15. [Death of the office and rise of the telecommuter](https://www.zdnet.com/article/death-of-the-office-and-rise-of-the-telecommuter/)
16. [Distributed Design: How Stack Overflow builds strong remote teams](https://www.tedgoas.com/blog/distributed-design/)
17. [Find "Hidden" Remote Jobs with Google Search](https://medium.com/ft-remote-job/how-to-find-hidden-remote-jobs-using-google-search-12ebaa2ea8ea?source=friends_link&sk=3bc251fed25dddd4c1a024ae4dd58e30)
18. [GitLab's Remote Manifesto](https://about.gitlab.com/blog/2015/04/08/the-remote-manifesto/)
19. [Give people the freedom of where to work](https://www.virgin.com/branson-family/richard-branson-blog)
20. [Hiring Secrets Of A Distributed Company](https://www.lullabot.com/articles/hiring-secrets-of-a-distributed-company)
21. [How GitHub Works](https://zachholman.com/posts/how-github-works/)
22. [How many companies are 100% distributed? (Research Summary)](https://scottberkun.com/2013/how-many-companies-are-100-distributed/)
23. [How many people really work from home? (research summary)](https://scottberkun.com/2013/how-many-people-really-work-from-home-research-summary/)
24. [How to focus when working remotely](https://x-team.com/blog/focus-working-remotely)
25. [How to Handle Client Work Remotely: Our Communication Stack](https://marsbased.com/blog/2015/12/07/how-to-handle-client-work-remotely-our-communication-stack)
26. [How to Make Remote Working Work for You](https://www.toptal.com/remote/how-to-make-remote-working-work-for-you)
27. [How to run a team of people who never see each other](https://qz.com/230998/how-to-run-a-team-of-people-who-never-see-each-other)
28. [How to suggest improvements remotely](https://x-team.com/blog/suggest-improvements-remotely)
29. [How Working at Home Works (For Us)](https://www.lullabot.com/articles/how-working-at-home-works-for-us)
30. [It’s Unclearly Defined, but Telecommuting Is Fast on the Rise](https://www.nytimes.com/2014/03/08/your-money/when-working-in-your-pajamas-is-more-productive.html?_r=0)
31. [Latest Telecommuting Statistics | Global Workplace Analytics](https://globalworkplaceanalytics.com/telecommuting-statistics)
32. [Learning From Distributed Companies](https://www.lullabot.com/articles/learning-from-distributed-companies)
33. [Managing a Geographically Dispersed Team: Achieving Your Goals Together, While Apart](https://www.mindtools.com/awe2ycs/managing-a-geographically-dispersed-team)
34. [My Ideal Day as


---

## try：管理混乱实验目录的利器 (⭐ 2.9k)

技术博客作者经常需要创建大量临时项目来测试想法或概念。这些实验性目录散落在文件系统的不同角落，例如 `/tmp` 或桌面，随着时间推移，管理和查找变得困难。

--- 

### 项目简介

`try` 是一个零配置的 Ruby 脚本工具，专门用于管理和快速导航散落在各处的实验性目录。它通过智能模糊搜索、时间排序和自动日期前缀，将混乱的项目空间组织起来。核心亮点包括：**即时模糊搜索**、**基于使用频率的智能排序**、**自动日期命名**（如 `2025-08-17-redis-experiment`），以及**零依赖**的单文件设计。相比于手动管理，`try` 大幅提升了实验性代码的查找和切换效率。

--- 

### try 技术解析

`try` 的核心在于提供一个统一的界面来管理所有实验目录，默认集中在 `~/src/tries` 路径下。它通过在 Shell 启动时注入一个包装函数，实现了交互式的 TUI（文本用户界面）。该界面支持实时的模糊匹配，并根据最近使用时间对结果进行排序。

**核心功能点：**

1.  **智能模糊搜索**：不仅仅是子串匹配，它能理解缩写（如 `rds` 匹配 `redis-server`），并优先展示最近使用或名称更短的项目。
2.  **时间感知**：显示上次访问时间，最近使用的目录在搜索结果中自动置顶。
3.  **日期前缀**：新创建的目录自动添加当前日期，保证唯一性和时间顺序。

![Fuzzy Search Demo](https://github.com/tobi/try/raw/main/assets/try-fuzzy-search-demo.gif)

_[View interactive version on asciinema](https://asciinema.org/a/ve8AXBaPhkKz40YbqPTlVjqgs)_

--- 

### 部署与应用

#### Installation

**RubyGems (Recommended)**

```bash
gem install try-cli
```

安装后需要将其初始化命令添加到 Shell 配置文件中：

```bash
# Bash/Zsh - add to .zshrc or .bashrc
eval "$(try init)"

# Fish - add to config.fish
eval (try init | string collect)
```

**Quick Start (Manual)**

下载 `try.rb` 文件并配置 Shell 环境变量：

```bash
curl -sL https://raw.githubusercontent.com/tobi/try/refs/heads/main/try.rb > ~/.local/try.rb

# Make "try" executable so it can be run directly
chmod +x ~/.local/try.rb

# Add to your shell (bash/zsh)
echo 'eval "$(ruby ~/.local/try.rb init ~/src/tries)"' >> ~/.zshrc

# for fish shell users
echo 'eval (~/.local/try.rb init ~/src/tries | string collect)' >> ~/.config/fish/config.fish
```

#### Shell Integration

集成到 Shell 依赖于 `try init` 命令的输出，该命令生成一个包装函数，用于启动 TUI 或执行特定操作。

**Bash/Zsh:**

```bash
# default is ~/src/tries
eval "$(~/.local/try.rb init)"
# or pick a path
eval "$(~/.local/try.rb init ~/src/tries)"
```

**Fish:**

```bash
eval (~/.local/try.rb init | string collect)
# or pick a path
eval (~/.local/try.rb init ~/src/tries | string collect)
```

#### Usage

`try` 的主要操作是交互式导航或直接跳转/创建目录。

| 命令 | 描述 |
| :--- | :--- |
| `try` | 浏览所有实验目录 |
| `try redis` | 跳转到 redis 实验或创建新目录 |
| `try new api` | 以 `2025-08-17-new-api` 格式创建并跳转 |
| `try . [name]` | 为当前 Git 仓库创建带日期的 worktree 目录 |
| `try clone <url>` | 克隆 Git 仓库到日期前缀目录 |

**Git Repository Cloning**

`try` 支持自动克隆 Git 仓库并清理目录名中的 `.git` 后缀。

```bash
# Clone with auto-generated directory name
try clone https://github.com/tobi/try.git
# Creates: 2025-08-27-tobi-try

# Clone with custom name
try clone https://github.com/tobi/try.git my-fork
# Creates: my-fork

# Shorthand syntax (no need to type 'clone')
try https://github.com/tobi/try.git
# Creates: 2025-08-27-tobi-try
```

#### Keyboard Shortcuts

在 TUI 界面中，用户可以使用以下快捷键进行操作：

*   `↑/↓` 或 `Ctrl-P/N/J/K`：导航列表
*   `Enter`：选择或创建
*   `Backspace`：删除字符
*   `Ctrl-D`：删除目录（需确认）
*   `ESC`：取消
*   直接输入：过滤列表

#### Configuration

默认实验目录是 `~/src/tries`。可以通过设置环境变量 `TRY_PATH` 进行修改。

```bash
export TRY_PATH=~/code/sketches
```

#### Nix

**Quick start**

```bash
nix run github:tobi/try
nix run github:tobi/try -- --help
nix run github:tobi/try init ~/my-tries
```

**Home Manager**

```bash
{
  inputs.try.url = "github:tobi/try";

  imports = [ inputs.try.homeManagerModules.default ];

  programs.try = {
    enable = true;
    path = "~/experiments";  # optional, defaults to ~/src/tries
  };
}
```

#### Homebrew

**Quick start**

```bash
brew tap tobi/try https://github.com/tobi/try
brew install try
```

安装后，Bash/Zsh 用户需在配置文件中添加：

```bash
# de
```

