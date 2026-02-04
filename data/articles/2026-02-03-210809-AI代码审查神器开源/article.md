# AI代码审查神器开源

开源项目 `masoncl/review-prompts` 提供了精选的 AI 代码审查提示词，旨在帮助开发者更高效地利用大模型提升代码质量。

---

## masoncl/review-prompts (⭐ 217)

# AI 辅助代码审查提示词

用于 Linux 内核和 systemd 开发的 AI 辅助代码审查提示词。适用于 Claude Code 及其他 AI 工具。

## 快速开始

### 仅安装内核提示词

```bash
cd kernel/scripts
./claude-setup.sh
```

### 仅安装 systemd 提示词

```bash
cd systemd/scripts
./claude-setup.sh
```

### 同时安装两者

```bash
cd kernel/scripts && ./claude-setup.sh
cd ../systemd/scripts && ./claude-setup.sh
```

## 可用命令

| 项目 | 审查 | 调试 | 验证 |
|---------|--------|-------|--------|
| 内核 | `/kreview` | `/kdebug` | `/kverify` |
| systemd | `/systemd-review` | `/systemd-debug` | `/systemd-verify` |

## 工作原理

每个项目包含：
- **技能文件** - 在项目目录树中工作时自动加载上下文
- **斜杠命令** - 快速访问审查、调试和验证工作流
- **子系统文件** - 按需加载的领域特定知识

技能会检测您的工作目录并加载相应的上下文：
- 在内核源码树中：自动加载内核技能
- 在 systemd 源码树中：自动加载 systemd 技能

## 项目结构

```
review-prompts/
├── kernel/                    # Linux 内核提示词
│   ├── skills/               # 技能模板
│   ├── slash-commands/       # /kreview, /kdebug, /kverify
│   ├── scripts/              # 安装脚本和实用工具
│   ├── patterns/             # 错误模式文档
│   └── *.md                  # 子系统和协议文件
│
├── systemd/                   # systemd 提示词
│   ├── skills/               # 技能模板
│   ├── slash-commands/       # /systemd-review, /systemd-debug, /systemd-verify
│   ├── scripts/              # 安装脚本
│   ├── patterns/             # 错误模式文档
│   └── *.md                  # 子系统和协议文件
│
└── README.md                  # 本文件
```

## Semcode 集成

这些提示词与 [semcode](https://github.com/facebookexperimental/semcode) 配合使用效果最佳，可实现快速的代码导航和语义搜索。

> 🔗 **项目地址**：[https://github.com/masoncl/review-prompts](https://github.com/masoncl/review-prompts)


---



## 结语

感谢您的阅读，我们将继续为您捕捉人工智能领域的每一个创新瞬间。

💬 你对本期哪个内容最感兴趣？欢迎在评论区交流心得！
⭐ 觉得文章不错？点个「在看」分享给同样热爱技术的伙伴们！

<center>
    <img src="https://fastly.jsdelivr.net/gh/bucketio/img18@main/2026/01/06/1767672738369-47fc1fed-2c8b-49d2-ae30-f8a45edc41bb.png" style="width: 100px;">
</center>