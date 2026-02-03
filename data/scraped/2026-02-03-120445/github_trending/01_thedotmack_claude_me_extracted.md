# Claude-Mem

为 [Claude Code](https://claude.com/claude-code) 构建的持久性内存压缩系统。

Claude-Mem 通过自动捕获工具使用情况的观察结果、生成语义摘要，并使其可用于未来的会话，从而无缝地在会话之间保持上下文。这使 Claude 即使在会话结束或重新连接后，也能保持对项目知识的连续性。

---

## 快速开始

在终端中启动一个新的 Claude Code 会话，并输入以下命令：

```
> /plugin marketplace add thedotmack/claude-mem

> /plugin install claude-mem
```

重启 Claude Code。先前会话的上下文将自动出现在新的会话中。

**主要特点：**

- 🧠 **持久性内存** - 上下文在会话之间保持不变
- 📊 **渐进式披露** - 分层内存检索，具有 Token 成本可见性
- 🔍 **基于技能的搜索** - 使用 mem-search 技能查询您的项目历史记录
- 🖥️ **Web Viewer UI** - 实时内存流，地址为 http://localhost:37777
- 💻 **Claude Desktop Skill** - 从 Claude Desktop 对话中搜索内存
- 🔒 **隐私控制** - 使用 `<private>` 标签从存储中排除敏感内容
- ⚙️ **上下文配置** - 对注入哪些上下文进行细粒度控制
- 🤖 **自动操作** - 无需手动干预
- 🔗 **引用** - 使用 ID 引用过去的观察结果（通过 http://localhost:37777/api/observation/{id} 访问，或在 Web Viewer 中查看所有内容，地址为 http://localhost:37777）
- 🧪 **Beta 频道** - 通过版本切换尝试实验性功能，如 Endless Mode

---

## 工作原理

**核心组件：**

1. **5 个生命周期钩子** - SessionStart、UserPromptSubmit、PostToolUse、Stop、SessionEnd（6 个钩子脚本）
2. **智能安装** - 缓存的依赖项检查器（预钩子脚本，不是生命周期钩子）
3. **Worker Service** - 端口 37777 上的 HTTP API，带有 Web Viewer UI 和 10 个搜索端点，由 Bun 管理
4. **SQLite 数据库** - 存储会话、观察结果、摘要
5. **mem-search 技能** - 具有渐进式披露的自然语言查询
6. **Chroma 向量数据库** - 用于智能上下文检索的混合语义 + 关键字搜索

---

## MCP 搜索工具

Claude-Mem 通过 **4 个 MCP 工具**提供智能内存搜索，遵循 Token 高效的 **3 层工作流模式**：

**3 层工作流：**

1. **`search`** - 获取带有 ID 的紧凑索引（约 50-100 个 Token/结果）
2. **`timeline`** - 获取有趣结果周围的时间顺序上下文
3. **`get_observations`** - 仅获取已过滤 ID 的完整详细信息（约 500-1,000 个 Token/结果）

**工作原理：**
- Claude 使用 MCP 工具搜索您的内存
- 从 `search` 开始，获取结果索引
- 使用 `timeline` 查看特定观察结果周围发生的事情
- 使用 `get_observations` 获取相关 ID 的完整详细信息
- 通过在获取详细信息之前进行过滤，**节省约 10 倍的 Token**

**可用的 MCP 工具：**

1. **`search`** - 使用全文查询搜索内存索引，按类型/日期/项目过滤
2. **`timeline`** - 获取特定观察结果或查询周围的时间顺序上下文
3. **`get_observations`** - 按 ID 获取完整的观察结果详细信息（始终批量处理多个 ID）
4. **`__IMPORTANT`** - 工作流文档（始终对 Claude 可见）

**用法示例：**

```typescript
// 步骤 1：搜索索引
search(query="authentication bug", type="bugfix", limit=10)

// 步骤 2：查看索引，识别相关 ID（例如，#123，#456）

// 步骤 3：获取完整详细信息
get_observations(ids=[123, 456])
```

---

## Beta 功能

Claude-Mem 提供了一个 **beta 频道**，其中包含实验性功能，如 **Endless Mode**（用于扩展会话的仿生内存架构）。从 Web Viewer UI（地址为 http://localhost:37777 → 设置）在稳定版本和 beta 版本之间切换。

---

## 系统要求

- **Node.js**：18.0.0 或更高版本
- **Claude Code**：具有插件支持的最新版本
- **Bun**：JavaScript 运行时和进程管理器（如果缺少，则自动安装）
- **uv**：用于向量搜索的 Python 包管理器（如果缺少，则自动安装）
- **SQLite 3**：用于持久存储（已捆绑）

---

## 配置

设置在 `~/.claude-mem/settings.json` 中管理（首次运行时使用默认值自动创建）。配置 AI 模型、Worker 端口、数据目录、日志级别和上下文注入设置。

---

## 开发

---

## 故障排除

如果遇到问题，请向 Claude 描述问题，故障排除技能将自动诊断并提供修复。

---

## Bug 报告

使用自动生成器创建全面的 Bug 报告：

```bash
cd ~/.claude/plugins/marketplaces/thedotmack
npm run bug-report
```