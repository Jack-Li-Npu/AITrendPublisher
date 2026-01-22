# SINGLE_URL 转载模式优化 & 模板系统扩展

## 📋 更新概览

本次更新针对 SINGLE_URL 转载模式进行了全面优化，并扩展了模板系统，主要包括：

1. ✅ **保留预抓取并优化**：为 SINGLE_URL 创建专用的轻量级提取流程
2. ✅ **强化翻译能力**：确保英文内容完整翻译为中文
3. ✅ **单篇文章排版**：标题层级自动提升，移除多篇汇总元素
4. ✅ **新增 4 个模板**：极简、卡片、学术、未来科技风格
5. ✅ **LaTeX 数学公式支持**：全面启用数学公式渲染

---

## 🔧 SINGLE_URL 模式核心改进

### 1. 双阶段 LLM 处理

**阶段一：轻量级预提取**（`extractContentForSingleUrl`）
- **目标**：保留更多原文，只删除广告、导航、页脚
- **模型**：固定使用 `SINGLE_URL_LLM_PROVIDER` + `SINGLE_URL_LLM_MODEL`（默认 Gemini Flash）
- **输出**：接近完整的英文正文（Markdown 格式）

**阶段二：完整翻译 + 精辟扩充**（`translateAndLightExpandForRepost`）
- **目标**：将英文完整翻译为中文，做极少量术语解释
- **字数控制**：严格限制在 `ARTICLE_MAX_LENGTH`（默认 2000 字）
- **输出**：中文 Markdown + 作者信息

### 2. 单篇文章排版优化

**移除的元素**：
- ❌ 不生成引入内容（`generateIntroduction`）
- ❌ 不生成整体介绍图（`generateOverviewImage`）
- ❌ 不添加 `## 文章标题` 层级

**标题层级提升**：
```markdown
# 转载某某人（作者）              ← 主标题（系统生成）
  [正文内容直接开始]
  ## 第一章节                     ← 原文的 ## 或 ### 提升为 ##
  ### 子章节                      ← 原文的 ### 或 #### 提升为 ###
```

### 3. Prompt 强化

**系统 Prompt**（`getSingleUrlRepostSystemPrompt`）：
- 明确"将输入的英文内容完整翻译为中文"
- 强调"所有英文内容必须翻译，严禁保留英文原文"
- 单篇文章标题层级规则

**用户 Prompt**（`getSingleUrlRepostUserPrompt`）：
- 显示"目标语言：中文（必须将所有英文翻译为中文）"
- 传入 `maxLength` 参数（来自 `ARTICLE_MAX_LENGTH` 配置）

---

## 🎨 新增模板系统

### 新增 4 个模板

| 模板文件 | 配置值 | 特点 | 适用场景 |
|---------|--------|------|---------|
| `article.minimal.ejs` | `minimal` | 极简主义，最大化内容，最小化装饰 | 单篇精读（SINGLE_URL 推荐） |
| `article.card.ejs` | `card` | 渐变卡片风格，每篇文章独立卡片 | 多篇快览，视觉冲击 |
| `article.academic.ejs` | `academic` | 学术论文风格，衬线字体，带 Contents 目录 | 研究论文、深度技术分析 |
| `article.future.ejs` | `future` | 未来科技感，全息效果，深色渐变 | 前沿科技、AI 主题 |

### 已有模板

| 模板文件 | 配置值 | 特点 |
|---------|--------|------|
| `article.ejs` | `default` | 简洁实用，信息密度高 |
| `article.modern.ejs` | `modern` | 清新现代，带目录导航 |
| `article.tech.ejs` | `tech` | 蓝色主题，科技感强 |
| `article.qbit.ejs` | `qbit` | 量子位/机器之心风格，专业媒体 |
| `article.mianpro.ejs` | `mianpro` | 温馨柔和，绿色主题 |

### 使用方法

在 `.env` 中配置：
```bash
# 固定使用某个模板
ARTICLE_TEMPLATE_TYPE=minimal

# 或随机选择
ARTICLE_TEMPLATE_TYPE=random
```

### 推荐搭配

- **SINGLE_URL 转载**：`minimal` 或 `academic`（适合单篇精读）
- **GITHUB_TRENDING**：`card` 或 `future`（适合多项目展示）
- **TECH_NEWS**：`modern` 或 `qbit`（适合新闻汇总）
- **AI_NEWS_SITE**：`tech` 或 `future`（适合 AI 资讯）

---

## 📐 LaTeX 数学公式支持

### 已启用功能

✅ **DoocsMd 渲染器自动支持 LaTeX**：
- 行内公式：`$E=mc^2$` → $E=mc^2$
- 块级公式：
  ```latex
  $$
  \int_{0}^{\infty} e^{-x^2} dx = \frac{\sqrt{\pi}}{2}
  $$
  ```

✅ **所有 Prompt 已移除 LaTeX 限制**：
- `getSummarizerSystemPrompt`：改为支持并鼓励使用
- `getGitHubProjectSystemPrompt`：同上
- `getAINewsSiteSystemPrompt`：同上
- `getSingleUrlRepostSystemPrompt`：同上

### 渲染机制

**DoocsMd 渲染器**（`doocs-md.renderer.ts`）：
- 在 Deno 环境中模拟 `window.MathJax.tex2svg()`
- LaTeX 公式自动转换为 SVG（或格式化文本）
- 微信公众号完美兼容

---

## 🚀 使用示例

### SINGLE_URL 转载完整流程

```bash
# 1. 配置 .env
SINGLE_URL_LLM_PROVIDER=GEMINI
SINGLE_URL_LLM_MODEL=gemini-2.0-flash-exp
ARTICLE_MAX_LENGTH=2000
ARTICLE_TEMPLATE_TYPE=minimal

GEMINI_API_KEY=your_api_key
GEMINI_BASE_URL=https://generativelanguage.googleapis.com/v1beta

# 2. 运行命令
deno task test --mode SINGLE_URL --url https://example.com/article

# 3. 输出效果
# - 标题：转载某某人（作者）
# - 内容：完整中文翻译，约 2000 字以内
# - 排版：极简模板，标题层级提升
```

### 流程说明

```
FireCrawl 抓取原始 Markdown
         ↓
轻量级 LLM 预提取（extractContentForSingleUrl）
  - 使用 Gemini Flash
  - 只删广告/导航/页脚，保留主体
  - 输出：接近完整的英文正文
         ↓
完整翻译 + 精辟扩充（translateAndLightExpandForRepost）
  - 使用 Gemini Flash
  - 完整翻译为中文
  - 极少量术语解释
  - 提取作者信息
  - 字数限制：≤ 2000
         ↓
单篇组装（不添加多篇汇总元素）
  - 标题：转载{作者}（作者）
  - 内容：直接输出，标题层级提升
  - 模板：推荐 minimal 或 academic
         ↓
微信发布
```

---

## ⚙️ 配置说明

### 新增配置项（`.env.example`）

```bash
# ===== Gemini API（SINGLE_URL 默认使用） =====
GEMINI_BASE_URL="https://generativelanguage.googleapis.com/v1beta"
GEMINI_API_KEY="your_api_key"
GEMINI_MODEL="gemini-2.0-flash-exp"

# ===== 文章字数控制 =====
ARTICLE_MIN_LENGTH=2000  # 最小字数（用于 TECH_NEWS、AI_NEWS_SITE 等）
ARTICLE_MAX_LENGTH=3000  # 最大字数（SINGLE_URL 严格限制）

# ===== SINGLE_URL 转载模式专用 =====
SINGLE_URL_LLM_PROVIDER=GEMINI
SINGLE_URL_LLM_MODEL=gemini-2.0-flash-exp

# ===== 模板选择 =====
ARTICLE_TEMPLATE_TYPE=minimal
# 可选值: default | modern | tech | mianpro | qbit | minimal | card | academic | future | random
```

---

## 🎯 关键代码路径

### Prompts
- `src/prompts/summarizer.prompt.ts`
  - `getSingleUrlLightExtractionSystemPrompt()` - 轻量级提取 prompt
  - `getSingleUrlRepostSystemPrompt()` - 完整翻译 prompt（已强化）

### Summarizer
- `src/modules/summarizer/ai.summarizer.ts`
  - `extractContentForSingleUrl()` - SINGLE_URL 专用轻量提取
  - `translateAndLightExpandForRepost()` - 完整翻译（已添加字数限制）

### Workflow
- `src/services/weixin-article.workflow.ts`
  - `performGlobalLlmExtraction()` - 根据 mode 选择提取方法
  - `generate-article` 步骤 - SINGLE_URL 单篇组装逻辑

### 模板
- `src/modules/render/weixin/templates/`
  - `article.minimal.ejs` - 极简 ✨
  - `article.card.ejs` - 卡片 ✨
  - `article.academic.ejs` - 学术 ✨
  - `article.future.ejs` - 未来科技 ✨

### 渲染器
- `src/modules/render/weixin/doocs-md.renderer.ts` - LaTeX 支持
- `src/modules/render/weixin/article.renderer.ts` - 模板加载

---

## 🧪 测试建议

### 1. SINGLE_URL 翻译测试
```bash
deno task test --mode SINGLE_URL --url https://openai.com/index/introducing-sora/
```
**验证点**：
- ✅ 内容是中文，无英文残留
- ✅ 字数 ≤ 2000
- ✅ 标题：转载{作者}（作者）
- ✅ 排版：标题层级提升

### 2. 模板测试
```bash
# 极简模板（推荐 SINGLE_URL）
ARTICLE_TEMPLATE_TYPE=minimal deno task test --mode SINGLE_URL --url <url>

# 卡片模板（推荐 GITHUB_TRENDING）
ARTICLE_TEMPLATE_TYPE=card deno task test --mode GITHUB_TRENDING

# 学术模板（适合论文）
ARTICLE_TEMPLATE_TYPE=academic deno task test --mode TECH_NEWS

# 随机模板
ARTICLE_TEMPLATE_TYPE=random deno task test --mode TECH_NEWS
```

### 3. LaTeX 公式测试
创建包含数学公式的 Markdown 测试内容，验证渲染效果。

---

## 📝 注意事项

1. **SINGLE_URL 模型配置**：
   - 预提取和翻译都使用 `SINGLE_URL_LLM_PROVIDER` + `SINGLE_URL_LLM_MODEL`
   - 默认 Gemini Flash，速度快成本低
   - 如需更高质量，可改用 `QWEN:qwen-max` 或 `DEEPSEEK:deepseek-chat`

2. **字数控制**：
   - `ARTICLE_MAX_LENGTH` 严格限制 SINGLE_URL 输出字数
   - 如需更长内容，调整该值（如 3000、5000）

3. **模板兼容性**：
   - 所有模板均支持 LaTeX 公式渲染
   - 微信公众号 HTML/CSS 限制已在模板中处理

4. **LaTeX 渲染**：
   - 使用 DoocsMd 渲染器时自动启用
   - 行内公式：`$公式$`
   - 块级公式：`$$公式$$`

---

## 🔄 与旧版本的对比

| 项目 | 旧版本 | 新版本 |
|-----|--------|--------|
| **预提取** | 跳过 SINGLE_URL | 使用专用轻量提取 |
| **翻译质量** | 未明确强调翻译 | 强制完整翻译，多重检查 |
| **字数控制** | 无限制 | 严格 ≤ 2000 字 |
| **排版** | 多篇模式 | 单篇模式，标题提升 |
| **模板数量** | 5 个 | 9 个 |
| **LaTeX** | 禁止 | 全面支持 |

---

## 🎓 最佳实践

### SINGLE_URL 推荐配置

```bash
# .env
SINGLE_URL_LLM_PROVIDER=GEMINI
SINGLE_URL_LLM_MODEL=gemini-2.0-flash-exp
ARTICLE_MAX_LENGTH=2000
ARTICLE_TEMPLATE_TYPE=minimal  # 或 academic

GEMINI_API_KEY=your_actual_key
```

### 多模板组合策略

- **日常使用**：设置 `ARTICLE_TEMPLATE_TYPE=random`，自动变换风格
- **特定场景**：根据内容类型选择固定模板
  - 论文类 → `academic`
  - 产品类 → `card`
  - 新闻类 → `modern` 或 `qbit`
  - 转载类 → `minimal`

---

## 📚 相关文档

- [MODE_GUIDE.md](../MODE_GUIDE.md) - 所有模式详细说明
- [完整使用指南.md](../完整使用指南.md) - 部署和配置指南
- [doocs-md-renderer-guide.md](./doocs-md-renderer-guide.md) - 渲染器使用说明
