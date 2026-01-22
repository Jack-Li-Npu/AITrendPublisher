# 零代码改造AI！微软Agent训练新框架 终极流媒体

`Agent Lightning` 让你无需代码就能快速训练和改造任何复杂的 AI 智能体。
`go2rtc` 是一个轻量级、无依赖的流媒体网关，实现终极的跨平台实时音视频转发。
`Awesome Remote Job` 聚合了海量高价值的远程工作信息，助力职场人灵活就业。
`try` 帮助开发者和研究人员系统地管理每一次实验和灵感，避免信息丢失。

---

## Agent Lightning：零代码改造训练任意 AI Agent (⭐ 10.9k)

Agent Lightning 是微软推出的一个训练框架，旨在将现有 AI Agent 转化为可优化的模型。该工具集成了强化学习、自动提示优化和监督微调等算法，用于提升 Agent 性能。

---

### 项目简介

Agent Lightning 作为一个 AI Agent 的训练加速器，允许开发者在**无需修改现有 Agent 代码**（或仅修改极少部分）的情况下，对 Agent 进行优化。它兼容 LangChain、AutoGen、CrewAI 等主流框架，甚至支持不依赖特定框架的纯 Python OpenAI Agent。核心优势在于提供统一的优化路径，支持多种先进算法对 Agent 进行迭代改进，显著提升 Agent 的稳定性和效率。

---

### Agent Lightning 技术解析

Agent Lightning 的核心设计理念是最小化对现有 Agent 架构的侵入性。它通过引入轻量级的 `agl.emit_xxx()` 辅助函数或使用 Tracer 机制，捕获 Agent 运行过程中的所有关键事件，如提示、工具调用和奖励信号。这些事件被结构化为 Spans，并同步到 **LightningStore**。

LightningStore 作为一个中心枢纽，同步管理任务、资源和追踪数据。优化算法从 Store 中读取 Spans 数据，学习并生成更新后的资源（如精炼的提示模板或新的策略权重）。**Trainer** 负责协调数据集流向 Runner，并在改进落地后更新推理引擎，形成一个持续迭代的优化闭环。

> 这种架构确保了 Agent 持续运行，开发者可以专注于创意实现，而非底层管道的复杂性。

![Architecture Diagram](https://microsoft.github.io/agent-lightning/assets/architecture.png)

---

### 部署与应用

#### Installation

通过 pip 安装 Agent Lightning 稳定版本：

```bash
pip install agentlightning
```

#### Nightly Build 安装

若需使用最新的、包含前沿特性的版本，可从 Test PyPI 安装：

```bash
pip install --upgrade --index-url https://test.pypi.org/simple/ --extra-index-url https://pypi.org/simple/ --pre agentlightning
```

详细安装指南请参考：https://microsoft.github.io/agent-lightning/stable/tutorials/installation/

要开始使用 Agent-lightning，请查阅文档：https://microsoft.github.io/agent-lightning/ 和示例：https://github.com/microsoft/agent-lightning/blob/main/examples。

---

### CI 状态

项目维护了严格的持续集成流程，确保代码质量和兼容性。

| Workflow | Status |
| :--- | :--- |
| CPU Tests | [![tests workflow status](https://github.com/microsoft/agent-lightning/actions/workflows/tests.yml/badge.svg)](https://github.com/microsoft/agent-lightning/actions/workflows/tests.yml) |
| Full Tests | [![tests summary workflow status](https://github.com/microsoft/agent-lightning/actions/workflows/badge-unit.yml/badge.svg)](https://github.com/microsoft/agent-lightning/actions/workflows/badge-unit.yml) |
| UI Tests | [![UI Tests](https://github.com/microsoft/agent-lightning/actions/workflows/dashboard.yml/badge.svg)](https://github.com/microsoft/agent-lightning/actions/workflows/dashboard.yml) |
| Examples Integration | [![examples summary workflow status](https://github.com/microsoft/agent-lightning/actions/workflows/badge-examples.yml/badge.svg)](https://github.com/microsoft/agent-lightning/actions/workflows/badge-examples.yml) |
| Latest Dependency Compatibility | [![latest summary workflow status](https://github.com/microsoft/agent-lightning/actions/workflows/badge-latest.yml/badge.svg)](https://github.com/microsoft/agent-lightning/actions/workflows/badge-latest.yml) |
| Legacy Examples Compatibility | [![compat summary workflow status](https://github.com/microsoft/agent-lightning/actions/workflows/badge-compat.yml/badge.svg)](https://github.com/microsoft/agent-lightning/actions/workflows/badge-compat.yml) |

---

### 社区与生态

Agent Lightning 已被多个社区项目采纳并用于实际场景，例如：

*   **DeepWerewolf**: 使用 AgentScope 和 Agent Lightning 训练中文“狼人杀”游戏的 RL Agent。
*   **AgentFlow**: 一个模块化的多智能体框架，结合了 Flow-GRPO 算法来处理长周期、稀疏奖励任务。
*   **Youtu-Agent**: 基于 Agent Lightning 贡献分支构建，已验证在数学/代码和搜索能力上支持高达 **128 块 GPU** 的 RL 训练，并实现了稳定的收敛。

---

### 贡献指南

项目欢迎贡献和建议。贡献者需遵循 [Contributing Guide](https://github.com/microsoft/agent-lightning/blob/main/docs/community/contributing.md) 中的规范。大多数贡献要求同意贡献者许可协议（CLA），具体流程由 CLA bot 在提交 PR 时自动处理。该项目遵循 [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/)。


---

## go2rtc：终极跨平台、零依赖的实时流媒体网关 (⭐ 11.7k)

go2rtc 是一个功能强大的开源项目，专为处理实时流媒体（如 RTSP、WebRTC、HomeKit 等）设计。它提供了一个统一的解决方案，用于聚合、转码和分发来自不同源的视频流，同时实现极低的延迟。

--- 

**项目简介**

go2rtc 作为一个终极摄像头流媒体应用，支持 RTSP、WebRTC、HomeKit、FFmpeg、RTMP 等多种协议。该项目拥有超过 **11.6k** 的 GitHub Star。其核心优势在于提供**零依赖、零配置**的二进制文件，支持 Windows、macOS、Linux 和 ARM 等所有主流操作系统。它实现了许多协议的**零延迟**流媒体传输，并能通过 FFmpeg 进行**实时转码**，解决了不同设备间流媒体兼容性的难题。

--- 

**go2rtc 技术解析**

go2rtc 的核心在于其对多种流媒体协议的深度支持和高效的流处理能力。它将不同的输入源（如 RTSP、HTTP、USB 摄像头）统一抽象，并通过内部引擎将其转换为客户端支持的输出格式（如 RTSP、WebRTC、HLS）。项目的一大亮点是对 FFmpeg 的集成，允许对不支持的编解码器进行**即时转码**。

该应用支持双向音频通信，并具备智能的**编解码器协商**机制，能够自动匹配客户端支持的编解码器，甚至混合来自不同源的音轨到单个流中。

### 关键技术与支持

go2rtc 定义了丰富的媒体格式和传输协议。

#### 支持的格式

支持的媒体格式包括 `adts`, `flv`, `h264`, `hevc`, `hls`, `mjpeg`, `mpegts`, `mp4`, `wav` 等文件格式，以及 `onvif`, `rtsp`, `webrtc` 等网络格式。

#### 支持的协议

传输协议覆盖了公共协议如 `http`, `rtsp`, `webrtc`, `ws` (WebSocket)，以及私有协议如 `cs2` (PPPP), `hap` (HomeKit), `tutk` (P2P) 等。

#### 独特功能

*   **HomeKit 摄像头流支持**：全球首个支持从 HomeKit 摄像头流媒体的项目。
*   **FFmpeg 集成**：通过 FFmpeg 源实现对几乎所有源（包括 USB 摄像头）的接入和实时转码。
*   **API 集成**：可作为独立应用运行，或通过 API 集成到任何智能家居平台。

以下是 go2rtc 支持的设备、文件、网络和 WebRTC 相关格式的概览：

| 类型 | 格式示例 |
| :--- | :--- |
| 设备 (Linux) | `alsa`, `v4l2` |
| 文件 | `flv`, `h264`, `mp4`, `mpegts` |
| 网络 (公共) | `rtmp`, `rtsp`, `webrtc` |
| 网络 (私有) | `homekit`, `dvrip`, `tapo`, `xiaomi` |
| WebRTC 相关 | `whep`, `whip`, `creality` |

--- 

**部署与应用**

go2rtc 支持多种部署方式，包括直接运行二进制文件、Docker 容器或作为 Home Assistant 插件。

#### go2rtc: Binary

作为零依赖的轻量级应用，可以直接下载对应操作系统的二进制文件运行。

#### go2rtc: Docker

使用 Docker 部署可快速启动服务。

```bash
docker pull alexxit/go2rtc
```

#### go2rtc: Home Assistant Add-on

Home Assistant 用户可以直接安装 Add-on。

#### go2rtc: Home Assistant Integration

项目提供了 Home Assistant 集成。

#### go2rtc: Dev version

开发者可以通过源码构建开发版本。

--- 

**配置示例**

go2rtc 的配置通过 YAML 文件定义，允许用户指定流的输入源和输出端口。

#### Module: Streams

流模块是配置的核心，定义了所有输入和输出。

#### Two way audio

该功能允许在部分摄像头上实现双向音频通信。

#### Source: RTSP

配置 RTSP 源示例。

```yaml
streams:
  my_camera:
    - rtsp://user:pass@192.168.1.100/stream1
```

#### Source: RTMP

配置 RTMP 源。

```yaml
streams:
  my_rtmp:
    - rtmp://server/app/stream
```

#### Source: HTTP

支持 FLV/MJPEG/JPEG/TS 格式的 HTTP 流。

```yaml
streams:
  my_http:
    - http://example.com/mjpeg.mjpg
```

#### Source: FFmpeg

通过 FFmpeg 接入外部源或进行复杂处理。

```yaml
streams:
  my_ffmpeg:
    - ffmpeg: -f v4l2 -input_format yuyv422 -framerate 30 -video_size 640x480 -i /dev/video0
```

#### Source: FFmpeg Device

专门用于 USB 摄像头设备。

```yaml
streams:
  my_usb_cam:
    - ffmpeg: -f v4l2 -input_format mjpeg -framerate 30 -video_size 1280x720 -i /dev/video0
```

#### Source: HomeKit

接入 HomeKit 摄像头。

```yaml
streams:
  my_hk_cam:
    - homekit://XXXXXX
```

#### Source: Tapo

TP-Link Tapo 设备的接入配置。

```yaml
streams:
  my_tapo:
    - tapo://IP:PORT username:password
```

#### Source: Wyze

Wyze 设备的接入配置。

```yaml
streams:
  my_wyze:
    - wyze://IP:PORT token
```

> go2rtc 提供了强大的配置灵活性，允许用户组合不同的源和协议，以构建复杂的流媒体拓扑结构。


---

## 精选远程工作资源汇总：Awesome Remote Job (⭐ 42.7k)

这个精选列表汇集了关于远程工作的各类资源，涵盖了文章、书籍、工具、招聘信息等多个维度，旨在帮助个人和团队更高效地实践和管理远程工作模式。

--- 

### 项目简介

Awesome Remote Job 是一个由社区维护的精选资源列表，专注于远程工作（Telecommuting）。该项目在 GitHub 上获得了 **42,746** 个 Star，是远程工作领域最具影响力的资源集合之一。它提供了从招聘信息到团队协作工具的全面指南，是寻求远程机会或优化远程管理实践的开发者和团队的宝贵参考。

--- 

### Awesome Remote Job 技术解析

该列表的核心价值在于其**广泛的资源覆盖面**和**社区驱动的更新机制**。它通过结构化的目录，系统性地整理了远程工作的各个方面，包括实践指南、招聘渠道、以及专门为分布式团队设计的工具集。这种策展方式避免了信息过载，直接指向高质量、经过验证的资源。

--- 

### 文章与帖子 (Articles & Posts)

该部分精选了关于远程工作实践、效率提升和团队管理的深度文章。这些资源提供了具体的经验和技巧，以应对分布式工作环境中的挑战。

**精选文章示例：**

- 讨论远程招聘中应避免的错误：https://x-team.com/blog/mistakes-remote-developers
- GitLab 关于远程工作的核心理念：https://about.gitlab.com/blog/2015/04/08/the-remote-manifesto/
- 远程团队的沟通栈和实践经验：https://marsbased.com/blog/2015/12/07/how-to-handle-client-work-remotely-our-communication-stack

这些文章共同构建了一个关于远程工作文化和操作的知识库。

--- 

### 招聘信息 (Job boards)

该部分直接列出了专门发布远程职位的招聘网站，是远程工作者寻找机会的主要入口。

--- 

### 聚合招聘信息 (Job boards aggregators)

聚合器网站收集了来自多个来源的远程工作列表，提高了搜索效率。

--- 

### 工具 (Tools)

工具部分细化了支持远程协作的不同职能领域，是构建高效远程工作环境的技术基础。

#### 人力资源 (HR)

专注于远程招聘和人员管理相关的工具。

#### 沟通 (Communication)

提供支持跨时区、异步和同步沟通的解决方案。

#### 项目管理 (Project Management)

列出了用于管理分布式项目进度的软件和方法。

#### 其他 (Others)

涵盖了远程工作生态中其他关键领域的支持工具。

--- 

### 部署与应用

本项目本身是一个资源列表（Awesome List），无需传统意义上的部署或安装过程。其应用方式是通过克隆或直接访问其 GitHub 仓库来获取和利用其中整理的外部链接资源。

**获取方法：**

1. **克隆仓库：**

```bash
git clone https://github.com/lukasz-madon/awesome-remote-job.git
```

2. **访问资源：** 直接浏览 `README.md` 文件，点击所需类目下的外部链接，如招聘网站、文章或工具官网。

--- 

### 贡献指南

社区贡献是维护此列表质量的关键。贡献者应遵循特定的流程来提交新的资源或修正现有条目。

> 要贡献内容，请点击 README.md 文件，然后点击铅笔图标。进行修改后，点击“Propose file change”按钮以提交拉取请求。确保遵循 [贡献指南](https://github.com/lukasz-madon/awesome-remote-job/blob/master/CONTRIBUTING.md)。

--- 

### 关键资源类别概览

下表总结了该列表中包含的主要资源类型，展示了其覆盖的广度：

| 资源类别 | 描述 | 示例链接（概念） |
| :--- | :--- | :--- |
| **Articles & Posts** | 实践经验、效率技巧 | 远程开发者的经验教训 |
| **Job boards** | 专门的远程职位发布平台 | 远程工作招聘网站 |
| **Tools** | HR, Communication, PM 等支持工具 | 异步沟通软件 |
| **Communities** | 远程工作者交流的在线社群 | 在线论坛和群组 |
| **Relocation Incentives** | 鼓励搬迁到特定地点的激励措施 | 地方政府提供的搬家奖励 |

--- 

### 许可证

该项目遵循 MIT 许可证。


---

## try：为每一次灵感创建专属目录的实验管理工具 (⭐ 2.9k)

技术博客作者常有大量临时性代码片段或小型项目，这些实验性代码容易散落在系统的不同角落，导致难以追踪和管理。try 项目旨在解决这一痛点，提供一个快速、有序的方式来管理这些临时性工作目录。

---

### 项目简介

try 是一个基于 Ruby 编写的命令行工具，用于高效管理临时实验目录。它通过模糊搜索、智能排序和自动日期前缀，帮助开发者组织散乱的测试代码。该工具仅需一个 Ruby 文件，无需外部依赖，实现了零配置的快速上手。它替代了传统上在 `/tmp` 或分散的 `test` 目录中创建临时文件的混乱工作流。

---

### try 技术解析

try 的核心在于其优化的用户体验和目录管理策略。它通过智能算法对目录进行排序，确保最近访问或修改的实验总能优先显示。

#### 核心功能点

*   **智能模糊搜索 (Fuzzy Search)**：支持非精确匹配，例如输入 `rds` 可以匹配到 `redis-server`。
*   **时间感知 (Time-Aware)**：显示目录的最后访问时间，并根据新近度进行排序。
*   **自动日期前缀**：创建目录时自动添加日期，格式如 `YYYY-MM-DD-project-name`。
*   **最小化配置**：默认配置在 `~/src/tries`，只需简单初始化即可使用。

![Fuzzy Search Demo](https://github.com/tobi/try/raw/main/assets/try-fuzzy-search-demo.gif)

> 这种设计将“有组织的混乱”带入开发者的临时工作空间。

---

### 部署与应用

#### Installation

**RubyGems (Recommended)**

```bash
gem install try-cli
```

安装后，需要将初始化命令添加到 Shell 配置文件中：

```bash
# Bash/Zsh - add to .zshrc or .bashrc
eval "$(try init)"

# Fish - add to config.fish
eval (try init | string collect)
```

**Quick Start (Manual)**

如果不想使用 RubyGems，可以通过 cURL 下载单个文件：

```bash
curl -sL https://raw.githubusercontent.com/tobi/try/refs/heads/main/try.rb > ~/.local/try.rb

# Make "try" executable so it can be run directly
chmod +x ~/.local/try.rb

# Add to your shell (bash/zsh)
echo 'eval "$(ruby ~/.local/try.rb init ~/src/tries)"' >> ~/.zshrc

# for fish shell users
echo 'eval (~/.local/try.rb init ~/src/tries | string collect)' >> ~/.config/fish/config.fish
```

#### Features

##### 🎯 Smart Fuzzy Search

搜索算法考虑了匹配程度、项目新近度和名称长度。例如，`connpool` 可以匹配 `connection-pool`。

##### ⏰ Time-Aware

工具会显示每个项目上次操作的时间间隔，确保最需要关注的工作位于列表顶部。

##### 📁 Organized Chaos

所有实验目录默认存储在 `~/src/tries`（可通过 `TRY_PATH` 环境变量修改）。新目录自动使用当前日期作为前缀。

#### Usage

`try` 命令提供了多种操作模式：

```bash
try                                          # Browse all experiments
try redis                                    # Jump to redis experiment or create new
try new api                                  # Start with "2025-08-17-new-api"
try . [name]                                   # Create a dated worktree dir for current repo
try ./path/to/repo [name]                      # Use another repo as the worktree source
try worktree dir [name]                        # Same as above, explicit CLI form
try clone https://github.com/user/repo.git  # Clone repo into date-prefixed directory
try https://github.com/user/repo.git        # Shorthand for clone (same as above)
try --help                                   # See all options
```

当使用 `try pool` 时，输出示例展示了智能排序效果：

```
$ try pool
→ 2025-08-14-redis-connection-pool    2h, 18.5
  2025-08-03-thread-pool              3d, 12.1
  2025-07-22-db-pooling               2w, 8.3
  + Create new: pool
```

##### Git Repository Cloning

`try` 支持直接克隆 Git 仓库到实验目录中，并自动处理命名：

```bash
# Clone with auto-generated directory name
try clone https://github.com/tobi/try.git
# Creates: 2025-08-27-tobi-try

# Clone with custom name
try clone https://github.com/tobi/try.git my-fork
# Creates: my-fork
```

##### Keyboard Shortcuts

在交互式浏览界面中，支持以下快捷键：

*   `↑/↓` 或 `Ctrl-P/N/J/K` - 导航
*   `Enter` - 选择或创建
*   `Ctrl-D` - 删除目录（需确认）
*   `ESC` - 取消

#### Configuration

默认存储路径为 `~/src/tries`。用户可以通过设置环境变量覆盖此路径：

```bash
export TRY_PATH=~/code/sketches
```

#### Nix

对于使用 Nix 的用户，提供了快速运行和 Home Manager 集成选项。

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

安装后，需将初始化脚本添加到 Shell 配置文件中（Bash/Zsh 示例）：

```bash
# de
```

