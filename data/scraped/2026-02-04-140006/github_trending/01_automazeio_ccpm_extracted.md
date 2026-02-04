# Claude Code PM

使用规范驱动开发、GitHub issues、Git worktree 和并行运行的多个 AI 代理，更快、**更好**地交付 Claude 代码工作流。

**[中文文档 (Chinese Documentation)](zh-docs/README_ZH.md)**

停止丢失上下文。停止任务阻塞。停止发布错误。这个经过实战检验的系统将 PRD 转化为 Epic，Epic 转化为 GitHub issue，issue 转化为生产代码——每一步都具有完整的可追溯性。

![Claude Code PM](https://raw.githubusercontent.com/automazeio/ccpm/main/screenshot.webp)

## 目录

- [背景](#background)
- [工作流](#the-workflow)
- [有何不同？](#what-makes-this-different)
- [为什么使用 GitHub Issues？](#why-github-issues)
- [核心原则：拒绝随性编码](#core-principle-no-vibe-coding)
- [系统架构](#system-architecture)
- [工作流阶段](#workflow-phases)
- [命令参考](#command-reference)
- [并行执行系统](#the-parallel-execution-system)
- [主要特性 & 优势](#key-features--benefits)
- [经验证的结果](#proven-results)
- [示例流程](#example-flow)
- [立即开始](#get-started-now)
- [本地 vs 远程](#local-vs-remote)
- [技术说明](#technical-notes)
- [支持本项目](#support-this-project)

## 背景

每个团队都面临着相同的问题：
- **上下文在会话之间消失**，迫使不断重新发现
- 当多个开发人员接触同一代码时，**并行工作会产生冲突**
- **需求漂移**，因为口头决定会覆盖书面规范
- **进度变得不可见**，直到最后

该系统解决了所有这些问题。

## 工作流

```mermaid
graph LR
    A[PRD 创建] --> B[Epic 规划]
    B --> C[任务分解]
    C --> D[GitHub 同步]
    D --> E[并行执行]
```

### 实际演示（60 秒）

```bash
# 通过引导式头脑风暴创建一个全面的 PRD
/pm:prd-new memory-system

# 将 PRD 转换为具有任务分解的技术 Epic
/pm:prd-parse memory-system

# 推送到 GitHub 并启动并行执行
/pm:epic-oneshot memory-system
/pm:issue-start 1235
```

## 有何不同？

| 传统开发 | Claude Code PM 系统 |
|---|---|
| 会话之间上下文丢失 | **持久上下文**贯穿所有工作 |
| 串行任务执行 | 独立任务上的**并行代理** |
| 从记忆中“随性编码” | **规范驱动**，具有完整的可追溯性 |
| 进度隐藏在分支中 | GitHub 中**透明的审计跟踪** |
| 手动任务协调 | 使用 `/pm:next` 进行**智能优先级排序** |

## 为什么使用 GitHub Issues？

大多数 Claude Code 工作流都是孤立运行的——单个开发人员在他们的本地环境中与 AI 合作。这产生了一个根本问题：**AI 辅助开发变成了一个孤岛**。

通过使用 GitHub Issues 作为我们的数据库，我们解锁了一些强大的功能：

### 🤝 **真正的团队协作**
- 多个 Claude 实例可以同时处理同一个项目
- 人类开发人员通过 issue 评论实时查看 AI 进度
- 团队成员可以随时加入——上下文始终可见
- 管理者无需中断流程即可获得透明度

### 🔄 **无缝的人机交接**
- AI 可以启动一个任务，人类可以完成它（反之亦然）
- 进度更新对每个人都可见，而不是困在聊天记录中
- 代码审查通过 PR 评论自然发生
- 没有“AI 做了什么？”会议

### 📈 **可扩展到单人工作之外**
- 添加团队成员，无需摩擦
- 多个 AI 代理并行处理不同的 issue
- 分布式团队自动保持同步
- 适用于现有的 GitHub 工作流和工具

### 🎯 **单一事实来源**
- 没有单独的数据库或项目管理工具
- Issue 状态就是项目状态
- 评论是审计跟踪
- 标签提供组织

这不仅仅是一个项目管理系统——它是一个**协作协议**，允许人类和 AI 代理大规模地协同工作，使用您的团队已经信任的基础设施。

## 核心原则：拒绝随性编码

> **每一行代码都必须追溯到规范。**

我们遵循严格的 5 阶段纪律：

1. **🧠 头脑风暴** - 比舒适区更深入地思考
2. **📝 记录** - 编写不留任何解释余地的规范
3. **📐 计划** - 使用明确的技术决策进行架构设计
4. **⚡ 执行** - 完全按照指定的构建
5. **📊 跟踪** - 在每个步骤保持透明的进度

没有捷径。没有假设。没有遗憾。

## 系统架构

```
.claude/
├── CLAUDE.md          # 始终在线的指令（将内容复制到项目的 CLAUDE.md 文件中）
├── agents/            # 面向任务的代理（用于上下文保存）
├── commands/          # 命令定义
│   ├── context/       # 创建、更新和启动上下文
│   ├── pm/            # ← 项目管理命令（此系统）
│   └── testing/       # 启动和执行测试（编辑此文件）
├── context/           # 项目范围的上下文文件
├── epics/             # ← PM 的本地工作区（放置在 .gitignore 中）
│   └── [epic-name]/   # Epic 和相关任务
│       ├── epic.md    # 实施计划
│       ├── [#].md     # 单个任务文件
│       └── updates/   # 正在进行的工作更新
├── prds/              # ← PM 的 PRD 文件
├── rules/             # 在此处放置您想要引用的任何规则文件
└── scripts/           # 在此处放置您想要使用的任何脚本文件
```

## 工作流阶段

### 1. 产品规划阶段

```bash
/pm:prd-new feature-name
```

启动全面的头脑风暴，以创建产品需求文档，捕获愿景、用户故事、成功标准和约束。

**输出：** `.claude/prds/feature-name.md`

### 2. 实施规划阶段

```bash
/pm:prd-parse feature-name
```

将 PRD 转换为技术实施计划，包括架构决策、技术方法和依赖关系映射。

**输出：** `.claude/epics/feature-name/epic.md`

### 3. 任务分解阶段

```bash
/pm:epic-decompose feature-name
```

将 Epic 分解为具体的、可操作的任务，包括验收标准、工作量估算和并行化标志。

**输出：** `.claude/epics/feature-name/[task].md`

### 4. GitHub 同步

```bash
/pm:epic-sync feature-name
# 或者对于有信心的工作流：
/pm:epic-oneshot feature-name
```

将 Epic 和任务作为带有适当标签和关系的 issue 推送到 GitHub。

### 5. 执行阶段

```bash
/pm:issue-start 1234  # 启动专用代理
/pm:issue-sync 1234   # 推送进度更新
/pm:next             # 获取下一个优先级任务
```

专用代理实施任务，同时维护进度更新和审计跟踪。

## 命令参考

> [!TIP]
> 键入 `/pm:help` 以获取简洁的命令摘要

### 初始设置
- `/pm:init` - 安装依赖项并配置 GitHub

### PRD 命令
- `/pm:prd-new` - 启动新产品需求的头脑风暴
- `/pm:prd-parse` - 将 PRD 转换为实施 Epic
- `/pm:prd-list` - 列出所有 PRD
- `/pm:prd-edit` - 编辑现有 PRD
- `/pm:prd-status` - 显示 PRD 实施状态

### Epic 命令
- `/pm:epic-decompose` - 将 Epic 分解为任务文件
- `/pm:epic-sync` - 将 Epic 和任务推送到 GitHub
- `/pm:epic-oneshot` - 在一个命令中分解和同步
- `/pm:epic-list` - 列出所有 Epic
- `/pm:epic-show` - 显示 Epic 及其任务
- `/pm:epic-close` - 将 Epic 标记为完成
- `/pm:epic-edit` - 编辑 Epic 详细信息
- `/pm:epic-refresh` - 从任务更新 Epic 进度

### Issue 命令
- `/pm:issue-show` - 显示 issue 和子 issue
- `/pm:issue-status` - 检查 issue 状态
- `/pm:issue-start` - 开始使用专用代理工作
- `/pm:issue-sync` - 将更新推送到 GitHub
- `/pm:issue-close` - 将 issue 标记为完成
- `/pm:issue-reopen` - 重新打开已关闭的 issue
- `/pm:issue-edit` - 编辑 issue 详细信息

### 工作流命令
- `/pm:next` - 显示具有 Epic 上下文的下一个优先级 issue
- `/pm:status` - 总体项目仪表板
- `/pm:standup` - 每日站立报告
- `/pm:blocked` - 显示被阻止的任务
- `/pm:in-progress` - 列出正在进行的工作

### 同步命令
- `/pm:sync` - 与 GitHub 的完全双向同步
- `/pm:import` - 导入现有的 GitHub issue

### 维护命令
- `/pm:validate` - 检查系统完整性
- `/pm:clean` - 存档已完成的工作
- `/pm:search` - 搜索所有内容

## 并行执行系统

### Issue 不是原子的

传统思维：一个 issue = 一个开发人员 = 一个任务

**现实：一个 issue = 多个并行工作流**

单个“实施用户身份验证”issue 不是一个任务。它是...

- **代理 1**：数据库表和迁移
- **代理 2**：服务层和业务逻辑
- **代理 3**：API 端点和中间件
- **代理 4**：UI 组件和表单
- **代理 5**：测试套件和文档

全部**同时**在同一个工作树中运行。

### 速度的数学

**传统方法：**
- 包含 3 个 issue 的 Epic
- 顺序执行

**此系统：**
- 相同的 Epic 包含 3 个 issue
- 每个 issue 分成约 4 个并行流
- **12 个代理同时工作**

我们不是将代理分配给 issue。我们正在**利用多个代理**来更快地交付。

### 上下文优化

**传统的单线程方法：**
- 主对话包含所有实施细节
- 上下文窗口填充数据库模式、API 代码、UI 组件
- 最终达到上下文限制并失去连贯性

**并行代理方法：**
- 主线程保持干净和战略性
- 每个代理在隔离状态下处理自己的上下文
- 实施细节永远不会污染主对话
- 主线程保持监督，而不会淹没在代码中

您的主对话成为指挥，而不是管弦乐队。

### GitHub vs 本地：完美分离

**GitHub 看到的内容：**
- 干净、简单的 issue
- 进度更新
- 完成状态

**本地实际发生的情况：**
- Issue #1234 爆炸成 5 个并行代理
- 代理通过 Git 提交进行协调
- 复杂的编排隐藏起来

GitHub 不需要知道工作是如何完成的——只需要知道它已经完成。

### 命令流

```bash
# 分析可以并行化的内容
/pm:issue-analyze 1234

# 启动 swarm
/pm:epic-start memory-system

# 观看奇迹
# 12 个代理在 3 个 issue 上工作
# 全部位于：../epic-memory-system/

# 完成后进行一次干净的合并
/pm:epic-merge memory-system
```

## 主要特性 & 优势

### 🧠 **上下文保存**
永远不会再丢失项目状态。每个 Epic 维护自己的上下文，代理从 `.claude/context/` 读取，并在同步之前在本地更新。

### ⚡ **并行执行**
通过多个代理同时工作更快地交付。标记为 `parallel: true` 的任务可以实现无冲突的并发开发。

### 🔗 **GitHub 原生**
适用于您的团队已经使用的工具。Issue 是事实来源，评论提供历史记录，并且不依赖于 Projects API。

### 🤖 **代理专业化**
为每个作业提供合适的工具。不同的代理