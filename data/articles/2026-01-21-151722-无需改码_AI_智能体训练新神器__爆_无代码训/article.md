# 无需改码！AI 智能体训练新神器！ 爆！无代码训

`Agent Lightning⚡` 让你无需改动代码就能训练任何 AI 智能体，效率激增。
`Go2RTC` 是一款功能强大的全能型应用，轻松搞定所有摄像机流媒体转发。
`Awesome Remote Job` 汇集了海量精选资源，助你轻松找到理想的远程工作机会。
`try:` 通过即时模糊搜索，彻底终结你混乱无序的实验目录管理难题。

---

## Agent Lightning⚡：无需修改代码即可训练任意 AI 智能体 (⭐ 10.9k)

Agent Lightning 是一个轻量级工具，旨在将现有 AI 智能体转化为可优化、可训练的实体。该项目支持主流的智能体框架，通过引入强化学习、自动提示优化等算法，实现了智能体性能的持续提升。

---

### 项目简介

Agent Lightning 允许开发者在**无需修改现有代码**的情况下，对任意 AI 智能体进行优化训练。项目支持 LangChain、AutoGen、CrewAI 等多种框架，或直接使用 Python OpenAI API。它引入了强化学习（RL）、监督微调（SFT）等高级算法，实现了对特定智能体或多智能体系统中的单个智能体进行选择性优化。该工具旨在简化 AI 智能体的训练流程，加速性能迭代。

---

### Agent Lightning 技术解析

Agent Lightning 的核心设计理念是最小化对现有智能体代码的侵入性。它通过引入轻量级的 `agl.emit_xxx()` 辅助函数，或利用 Tracer 自动收集提示、工具调用和奖励等信息。这些事件被结构化为 Spans，流向 **LightningStore**。LightningStore 负责同步任务、资源和追踪数据。

优化算法（如 RL 算法）从 Store 中读取 Spans 进行学习，并将更新后的资源（如精炼的提示模板或新的策略权重）发布回 Store。Trainer 组件负责协调数据流、算法与推理引擎之间的资源同步，确保改进后的模型能够无缝集成到原始智能体中。这种架构实现了从初次部署到持续改进的清晰路径，无需重写或锁定。

![Agent Lightning Architecture Diagram](https://microsoft.github.io/agent-lightning/assets/architecture.png)

---

### 部署与应用

#### 安装

推荐使用稳定版安装：

```bash
pip install agentlightning
```

若需安装最新的夜间构建版本（包含前沿特性），可从 Test PyPI 安装：

```bash
pip install --upgrade --index-url https://test.pypi.org/simple/ --extra-index-url https://pypi.org/simple/ --pre agentlightning
```

详细的安装指南请参考：https://microsoft.github.io/agent-lightning/stable/tutorials/installation/

开始使用 Agent-lightning，请查看文档：https://microsoft.github.io/agent-lightning/ 和示例：https://github.com/microsoft/agent-lightning/blob/main/examples。

---

### CI 状态

项目的持续集成状态通过多个工作流进行监控，确保稳定性和兼容性。

| Workflow | Status |
| --- | --- |
| CPU Tests | [![tests workflow status](https://github.com/microsoft/agent-lightning/actions/workflows/tests.yml/badge.svg)](https://github.com/microsoft/agent-lightning/actions/workflows/tests.yml) |
| Full Tests | [![tests summary workflow status](https://github.com/microsoft/agent-lightning/actions/workflows/badge-unit.yml/badge.svg)](https://github.com/microsoft/agent-lightning/actions/workflows/badge-unit.yml) |
| UI Tests | [![UI Tests](https://github.com/microsoft/agent-lightning/actions/workflows/dashboard.yml/badge.svg)](https://github.github.com/agent-lightning/actions/workflows/dashboard.yml) |
| Examples Integration | [![examples summary workflow status](https://github.com/microsoft/agent-lightning/actions/workflows/badge-examples.yml/badge.svg)](https://github.com/microsoft/agent-lightning/actions/workflows/badge-examples.yml) |
| Latest Dependency Compatibility | [![latest summary workflow status](https://github.com/microsoft/agent-lightning/actions/workflows/badge-latest.yml/badge.svg)](https://github.com/microsoft/agent-lightning/actions/workflows/badge-latest.yml) |
| Legacy Examples Compatibility | [![compat summary workflow status](https://github.com/microsoft/agent-lightning/actions/workflows/badge-compat.yml/badge.svg)](https://github.com/microsoft/agent-lightning/actions/workflows/badge-compat.yml) |

---

### 社区与研究成果

Agent Lightning 已被多个社区项目采用，并在学术研究中得到验证。例如，[DeepWerewolf](https://github.com/af-74413592/DeepWerewolf) 使用 AgentScope 和 Agent Lightning 实现了中文狼人杀游戏的 RL 训练。斯坦福大学的 [AgentFlow](https://agentflow.stanford.edu/) 框架结合了 Flow-GRPO 算法来解决长程、稀疏奖励任务。

腾讯云 ADP 的 [Youtu-Agent](https://github.com/TencentCloudADP/Youtu-agent) 项目基于 Agent Lightning 的修改分支，成功验证了在数学、代码和搜索能力上达到 **128 GPU** 的稳定收敛 RL 训练。

该项目已发表 arXiv 论文：Agent Lightning: Train ANY AI Agents with Reinforcement Learning (https://arxiv.org/abs/2508.03680)。

---

### 贡献与引用

欢迎贡献。请参考贡献指南了解环境设置和流程：https://github.com/microsoft/agent-lightning/blob/main/docs/community/contributing.md。所有贡献需同意 CLA（https://cla.opensource.microsoft.com）。

若在研究或项目中使用 Agent Lightning，请引用以下论文：

```bibtex
@misc{luo2025agentlightningtrainai,
      title={Agent Lightning: Train ANY AI Agents with Reinforcement Learning},
      author={Xufang Luo and Yuge Zhang and Zhiyuan He and Zilong Wang and Siyun Zhao and Dongsheng Li and Luna K. Qiu and Yuqing Yang},
      year={2025},
      eprint={2508.03680},
      archivePrefix={arXiv},
      primaryClass={cs.AI},
      url={https://arxiv.org/abs/2508.03680},
}
```


---

## Go2RTC：全能型摄像机流媒体应用 (⭐ 11.6k)

AlexxIT/go2rtc 是一个专注于摄像机流媒体的开源应用，它提供了对多种协议（如 RTSP、WebRTC、HomeKit、RTMP 等）的全面支持。该项目旨在提供低延迟、零依赖的流媒体解决方案，适用于各种操作系统。

---

**项目简介**

go2rtc 是一款终极摄像机流媒体应用，支持 RTSP、WebRTC、HomeKit、FFmpeg、RTMP 等协议。该项目的主要亮点包括：

1.  **零依赖与零配置**：提供适用于 Windows、macOS、Linux 和 ARM 系统的轻量级二进制文件。
2.  **超低延迟**：对许多支持的协议实现零延迟流媒体。
3.  **广泛的输入源支持**：支持 RTSP、RTMP、DVRIP、HTTP (FLV/MJPEG/JPEG/TS)、USB 摄像头，以及所有 FFmpeg 支持的源。
4.  **多样化的输出协议**：可输出为 RTSP、WebRTC、MSE/MP4、HomeKit、HLS 或 MJPEG。
5.  **领先的兼容性**：世界首个支持从 HomeKit 摄像头流媒体的项目。

相较于传统的流媒体服务器，go2rtc 强调其轻量化和协议转换能力，特别是在处理不同设备和平台之间的媒体流互操作性方面表现突出。

---

**go2rtc 技术解析**

go2rtc 作为一个流媒体转发和协议转换工具，其核心优势在于深度集成 FFmpeg 进行格式转换，并实现了对大量私有和公共流媒体协议的解析与转发能力。它能够接收来自各种来源的视频流，并将其转换为客户端需要的格式和协议，以实现跨平台和跨生态系统的无缝集成。

![go2rtc](http://mmbiz.qpic.cn/mmbiz_png/kTOdS6KibSktT8nXHMISps3u6a2bv3cOcdib2cw0V1aQxd4TfvqpRYDAIQ3BkopmUMe2chS3Mm8FjOMJ7ns691WQ/0?from=appmsg)

该应用支持的格式和协议范围广泛，涵盖了设备接口、文件格式、公共网络协议以及大量私有/独占协议（如 HomeKit、Tapo、Wyze 等）。

**支持的格式**：包括 `alsa` (Linux 音频)、`v4l2` (Linux 视频)、文件格式如 `h264`、`mp4`、`hls`，以及网络格式如 `rtsp`、`webrtc` 等。

**支持的协议**：公共协议如 `http`、`rtsp`、`webrtc`；私有协议如 `homekit`、`tapo`、`wyze` 等。

**关键特性对比**

| 特性 | go2rtc | 传统流媒体服务器 | 优势描述 |
| :--- | :--- | :--- | :--- |
| 依赖性 | 零依赖（二进制文件） | 通常依赖复杂环境/库 | 易于部署和维护 |
| 延迟 | 零延迟（特定协议） | 存在一定延迟 | 适用于对实时性要求高的场景 |
| 协议支持广度 | 极广（包含大量私有协议） | 通常仅支持标准协议 | 覆盖更多物联网设备 |
| FFmpeg集成 | 原生支持，用于转码 | 需外部配置或脚本 | 流媒体处理能力强 |
| HomeKit支持 | 世界首创支持流出/流入 | 缺乏原生支持 | 深度集成 Apple 生态 |

> go2rtc 的设计目标是成为一个多功能的流媒体中枢，能够桥接不同厂商和标准的设备。

---

**部署与应用**

go2rtc 提供了多种部署方式，包括直接运行二进制文件、使用 Docker 容器，以及作为 Home Assistant 的插件或集成。

#### go2rtc: Binary

项目提供了针对所有操作系统的零依赖、零配置小应用（二进制文件）。

#### go2rtc: Docker

可以通过 Docker 部署，以下是获取最新稳定版本的 Docker 拉取命令：

```bash
docker pull alexxit/go2rtc
```

#### go2rtc: Home Assistant Add-on

提供了 Home Assistant 插件，便于在 HA 环境中集成。

#### go2rtc: Home Assistant Integration

支持直接作为 Home Assistant 集成使用。

#### go2rtc: Dev version

可以从 GitHub Actions artifacts 下载开发版本。

---

**Configuration**

go2rtc 的配置通过 YAML 文件完成，可以定义流媒体源（Source）、输出流（Stream）以及模块设置。

#### Module: Streams

`streams` 模块是配置所有输入源和输出流的核心部分。

#### Two way audio

支持部分摄像头实现双向音频功能。

#### Source: RTSP

配置 RTSP 源的示例。

#### Source: RTMP

配置 RTMP 源的示例。

#### Source: HTTP

支持 HTTP 协议的流媒体输入，如 FLV、MJPEG、JPEG 或 TS 格式。

#### Source: ONVIF

支持 ONVIF 协议的设备接入。

#### Source: FFmpeg

允许使用 FFmpeg 管道来处理复杂或不支持的输入源。

#### Source: FFmpeg Device

用于直接从 USB 摄像头等设备捕获流。

#### Source: Exec

允许执行外部命令并捕获其输出流。

#### Source: Echo

一个用于测试目的的源。

#### Source: Expr

基于表达式的流处理。

#### Source: HomeKit

支持从 HomeKit 摄像头接收流。

#### Source: Bubble

特定私有协议支持。

#### Source: DVRIP

支持 DVRIP 协议。

#### Source: Tapo

支持 TP-Link Tapo 系列设备。

#### Source: Kasa

支持 TP-Link Kasa 设备。

#### Source: Multitrans

支持 TP-Link Multitrans。

#### Source: Tuya

支持涂鸦（Tuya）设备。

#### Source: Xiaomi

支持小米（Mi Home）设备。

#### Source: Wyze

支持 Wyze 摄像头。

#### Source: GoPro

支持 GoPro 设备。

#### Source: Ivideon

支持 Ivideon 平台流。

详细的配置文档和示例，读者可参考官方文档：https://github.com/AlexxIT/go2rtc


---

## 精选远程工作资源汇总：Awesome Remote Job (⭐ 42.7k)

这份资源列表聚合了关于远程工作的关键信息，涵盖了文章、书籍、招聘渠道、社区和技术工具。

--- 

### 项目简介

Awesome Remote Job 是一个经过精心策划的远程工作资源集合，旨在提供全面的指导和信息。该项目在 GitHub 上获得了超过 **42,735** 个 Star，是远程工作者和希望建立分布式团队的公司的重要参考资料。它汇集了实战经验分享、招聘板、社区资源以及支持远程协作的工具。

--- 

### Awesome Remote Job 技术解析

该项目本身是一个纯粹的 Markdown 列表集合，结构清晰，便于快速检索。其核心价值在于内容的策展和分类，而非复杂的软件架构。通过系统的目录结构，用户可以快速定位到所需的远程工作相关信息，例如招聘、工具或经验分享。

--- 

### 文章与帖子

精选文章提供了关于远程工作实践、技巧和经验教训的深入见解。这些资源侧重于提高个人效率、团队沟通和招聘策略。

#### 实践经验与效率提升

- **错误规避**：[3 mistakes to avoid if you want to get hired remotely](https://x-team.com/blog/mistakes-remote-developers)
- **工作技巧**：[5 Tricks to Get More Done While Working Remotely](https://rdutel.medium.com/working-remotely-getting-things-done-38dcd0413733)
- **健康建议**：[8 tips that will make you a more active, healthier remote developer](https://x-team.com/blog/how-to-be-healthy-remote)
- **自动化经验**：[10 Lessons from 4 Years Working Remotely at Automattic](https://whenihavetime.com/2014/07/08/10-lessons-from-4-years-working-remotely/)

#### 团队协作与文化

- **沟通策略**：[30 Tips for Successful Communication as a Remote Worker](https://www.hanselman.com/blog/30-tips-for-successful-communication-as-a-remote-worker)
- **分布式设计**：[Distributed Design: How Stack Overflow builds strong remote teams](https://www.tedgoas.com/blog/distributed-design/)
- **远程宣言**：[GitLab's Remote Manifesto](https://about.gitlab.com/blog/2015/04/08/the-remote-manifesto/)

#### 招聘与统计

- **隐藏职位搜索**：[Find "Hidden" Remote Jobs with Google Search](https://medium.com/ft-remote-job/how-to-find-hidden-remote-jobs-using-google-search-12ebaa2ea8ea?source=friends_link&sk=3bc251fed25dddd4c1a024ae4dd58e30)
- **分布式公司规模**：[How many companies are 100% distributed? (Research Summary)](https://scottberkun.com/2013/how-many-companies-are-100-distributed/)
- **统计数据**：[Latest Telecommuting Statistics | Global Workplace Analytics](https://globalworkplaceanalytics.com/telecommuting-statistics)

--- 

### 视频、书籍与幽默

该部分收录了关于远程工作主题的视频、专业书籍以及相关的幽默内容。

- **视频**：提供了与远程工作相关的视频内容链接。
- **书籍**：列出了推荐的远程工作主题书籍。
- **幽默**：包含远程工作主题的幽默资源。

--- 

### 招聘渠道与公司信息

提供了专门用于寻找远程职位的渠道和已知实行远程办公的公司列表。

#### 招聘板与聚合器

- **Job boards**：专门的远程工作招聘网站。
- **Job boards aggregators**：聚合了多个远程招聘信息的平台。

#### 拥有“远程 DNA”的公司

- **Companies with "remote DNA"**：该列表展示了那些从一开始就构建为分布式团队的公司，这些公司通常在远程管理和文化方面积累了丰富的经验。

--- 

### 居住、搬迁与面试

#### 住房与搬迁激励

- **Housing**：与远程工作者住房相关的资源。
- **Relocation Incentives**：收集了提供搬迁激励以吸引人才的地区或项目信息。

#### 面试策略

- **Interviewing**：关于如何进行远程面试或作为远程候选人进行面试的指南。

--- 

### 社区、活动与新闻

- **Events**：与远程工作相关的线上或线下活动信息。
- **Newsletters**：定期推送远程工作相关资讯的邮件列表。
- **Podcasts**：远程工作主题的播客资源。
- **Communities**：供远程工作者交流和获取支持的在线社区。
- **Conferences**：专门针对远程工作或分布式团队的会议信息。

--- 

### 工具支持

工具部分细化了支持远程团队日常运营的软件类别。

#### 核心协作工具

- **HR**：人力资源管理工具，支持远程招聘、入职和薪酬管理。
- **Communication**：即时通讯、视频会议等沟通工具。
- **Project Management**：项目和任务跟踪工具。

| 类别 | 示例功能 |
| :--- | :--- |
| HR | 远程入职与合规 |
| Communication | 异步消息传递 |
| Project Management | 任务看板与进度跟踪 |


- **Others**：其他辅助远程工作效率的工具。

--- 

### 法律与财务支持

- **Law & Finance**：涉及远程工作税务、合同、国际雇佣法等方面的资源。

--- 

### 其他资源

- **Others**：收录了未分类但对远程工作有价值的其他链接。

--- 

### 贡献与许可

> 贡献指南：要为该列表贡献内容，用户需要遵循 [the contributions guidelines](https://github.com/lukasz-madon/awesome-remote-job/blob/master/CONTRIBUTING.md) 并提交 Pull Request。

该列表遵循 [License] 许可。


---

## try: 告别混乱的实验目录，实现即时模糊搜索 (⭐ 2.98k)

为你的临时实验项目提供一个专属、可快速检索的家。

--- 

**项目简介**

`try` 是一个单 Ruby 文件构建的 CLI 工具，旨在解决开发者在创建大量临时实验目录时产生的混乱问题。它通过智能模糊搜索、时间感知排序和零配置安装，将散落在系统各处的实验快速聚合并变得可被即时访问。核心亮点包括：**即时模糊搜索**、**最近使用优先排序**、**自动日期前缀命名**，以及**零依赖**的快速部署。

--- 

## try 技术解析

`try` 是一个纯 Ruby 实现的命令行工具，专注于提供一个统一的、可快速导航的实验目录管理方案。其核心在于一个 Ruby 脚本，通过 Shell 集成实现环境的快速切换和目录的智能创建。

### 核心功能与架构

`try` 避免了传统文件管理中目录名混乱的问题，将所有实验集中在 `TRY_PATH`（默认 `~/src/tries`）下。它通过 Shell 包装函数与 Ruby 脚本交互，提供以下功能：

1. **智能模糊搜索**：不仅是简单的子串匹配，它会根据最近使用频率和名称长度进行加权评分，确保最相关的实验浮现。
2. **时间感知**：显示目录的上次访问时间，帮助用户快速回忆上下文。
3. **自动日期前缀**：新创建的目录自动添加 `YYYY-MM-DD-` 格式的前缀，如 `2025-08-17-redis-experiment`。

> _“Your experiments deserve a home.”_ 这种设计哲学确保了代码片段和临时想法不会丢失在 `/tmp` 或分散的文件系统中。

### 关键操作示例

通过简单的命令即可在实验间穿梭或创建新实验：

```bash
try                                          # 浏览所有实验
try redis                                    # 跳转到 redis 实验或创建新实验
try new api                                  # 以 "2025-08-17-new-api" 格式开始
try . [name]                                   # 为当前 Git 仓库创建带日期的 worktree 目录
try clone https://github.com/user/repo.git  # 克隆 Git 仓库到日期前缀目录
try --help                                   # 查看所有选项
```

搜索效果展示：

```
$ try pool
→ 2025-08-14-redis-connection-pool    2h, 18.5
  2025-08-03-thread-pool              3d, 12.1
  2025-07-22-db-pooling               2w, 8.3
  + Create new: pool
```

### Git 仓库克隆

`try` 支持直接克隆 Git 仓库到结构化的实验目录中。它会自动处理 URL 后缀并生成合适的目录名：

```bash
# 克隆并使用自动生成的目录名
try clone https://github.com/tobi/try.git
# 创建: 2025-08-27-tobi-try

# 简写语法
try https://github.com/tobi/try.git
# 创建: 2025-08-27-tobi-try
```

### 键盘快捷键

在交互式搜索界面中，提供了高效的导航方式：

- `↑/↓` 或 `Ctrl-P/N/J/K` \- 导航
- `Enter` \- 选择或创建
- `Ctrl-D` \- 删除目录（需确认）
- 直接输入字符进行过滤

--- 

## 部署与应用

### Installation

推荐使用 RubyGems 进行安装，因为 `try` 是一个 Ruby 项目，macOS 等系统内置 Ruby 环境。

#### RubyGems (Recommended)

```bash
gem install try-cli
```

安装完成后，需要将初始化命令添加到 Shell 配置文件中：

```bash
# Bash/Zsh - 添加到 .zshrc 或 .bashrc
eval "$(try init)"

# Fish - 添加到 config.fish
eval (try init | string collect)
```

#### Quick Start (Manual)

如果不想使用 Gem，可以通过 `curl` 下载单文件并手动配置：

```bash
curl -sL https://raw.githubusercontent.com/tobi/try/refs/heads/main/try.rb > ~/.local/try.rb

# 使 "try" 可执行
chmod +x ~/.local/try.rb

# 添加到 shell (bash/zsh)
echo 'eval "$(ruby ~/.local/try.rb init ~/src/tries)"' >> ~/.zshrc

# for fish shell users
echo 'eval (~/.local/try.rb init ~/src/tries | string collect)' >> ~/.config/fish/config.fish
```

### Configuration

可以通过设置环境变量 `TRY_PATH` 来改变实验目录的存储位置。默认路径为 `~/src/tries`。

```bash
export TRY_PATH=~/code/sketches
```

### Nix

#### Quick start

```bash
nix run github:tobi/try
nix run github:tobi/try -- --help
nix run github:tobi/try init ~/my-tries
```

#### Home Manager

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

### Homebrew

#### Quick start

```bash
brew tap tobi/try https://github.com/tobi/try
brew install try
```

安装后需要将初始化命令添加到 Shell 配置文件：

- Bash/Zsh:

```bash
# default is ~/src/tries
eval "$(try init)"
# or pick a path
eval "$(try init ~/src/tries)"
```

- Fish:

```bash
eval "(try init | string collect)"
# or pick a path
eval "(try init ~/src/tries | string collect)"
```

--- 

## 技术选型考量

**为什么选择 Ruby？**

- **单文件，无依赖**：保证了工具的便携性。
- **跨平台**：大多数系统（如 macOS）内置 Ruby 环境。
- **性能**：对于管理数千个目录的场景，性能表现足够。

### 对比传统方法

| 场景 | `cd` / `ls` 组合 | `fzf` 配合文件搜索 | `try` 工具 | 
| :--- | :--- | :--- | :--- |
| 目录定位速度 | 慢，依赖记忆 | 中等，需要精确输入 | 快，智能模糊匹配 | 
| 目录命名规范 | 混乱，用户决定 | 依赖用户习惯 | 自动日期前缀，强制规范 | 
| 上下文追踪 | 困难 | 困难 | 内置时间感知排序 | 
| 目录创建 | 手动 `mkdir` | 手动 `mkdir` | 一键创建，带命名建议 | 

--- 

## 总结与哲学

`try` 旨在拥抱开发者在探索和实验过程中的“有组织的混乱”。它提供了一个统一的、高效率的入口，将临时代码和想法系统化管理，确保了 2am 的灵感不会因目录查找困难而丢失。

详细文档请参考：https://github.com/tobi/try


