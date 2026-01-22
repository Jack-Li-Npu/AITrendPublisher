# 📡 数据源配置指南

本指南详细说明如何配置和管理 TrendPublish 的内容抓取源。

## 📋 目录

- [快速启用项目](#快速启用项目)
- [数据源类型](#数据源类型)
- [推荐优质数据源](#推荐优质数据源)
- [配置方法](#配置方法)
- [高级用法](#高级用法)

---

## 🚀 快速启用项目

### 步骤 1: 基础配置（必需）

创建 `.env` 文件，最小配置如下：

```bash
# === LLM 配置（必需）===
# 免费获取: https://aistudio.google.com/
GEMINI_API_KEY="your-gemini-api-key"
GEMINI_MODEL="gemini-2.0-flash-exp"

# 设置默认模型
DEFAULT_LLM_PROVIDER="GEMINI"
AI_SUMMARIZER_LLM_PROVIDER="GEMINI"
AI_CONTENT_RANKER_LLM_PROVIDER="GEMINI"
```

### 步骤 2: 运行测试

```bash
# 测试 Gemini 是否正常工作
deno task test:gemini

# 运行完整测试
deno task test
```

### 步骤 3: 启动服务

```bash
# 启动主服务（包含定时任务）
deno task start
```

**默认情况下**，项目会使用内置的数据源（Hacker News 和 OpenAI Twitter）。

---

## 📊 数据源类型

TrendPublish 支持多种数据抓取方式：

### 1. 🔥 FireCrawl（网页抓取）

**适用场景**: 抓取任何网站内容

**优点**:
- 智能提取正文内容
- 自动处理动态加载
- 支持 JavaScript 渲染

**配置**:
```bash
FIRE_CRAWL_API_KEY="your-firecrawl-key"
```

**获取 API Key**: https://www.firecrawl.dev/

### 2. 🐦 Twitter/X（社交媒体）

**适用场景**: 抓取 Twitter 用户推文

**优点**:
- 实时性强
- 覆盖面广
- 信息密度高

**配置**:
```bash
X_API_BEARER_TOKEN="your-twitter-token"
```

**获取 API Key**: https://twitterapi.io/

### 3. 📰 RSSHub（RSS 聚合）

**适用场景**: 聚合各种网站的 RSS 订阅

**优点**:
- 免费无需 API Key
- 支持海量网站
- 内容结构化

**无需配置**，直接使用！

### 4. 🔍 Jina Reader（智能抓取）

**适用场景**: 智能提取网页内容

**优点**:
- AI 驱动的内容提取
- 支持复杂页面
- 高质量输出

**配置**:
```bash
JINA_API_KEY="your-jina-key"
```

**获取 API Key**: https://jina.ai/

### 5. 🔎 Jina DeepSearch（深度搜索）

**适用场景**: 深度网络搜索

**优点**:
- AI 理解搜索意图
- 深度内容分析
- 相关性强

**配置**: 同 Jina Reader

---

## 🌟 推荐优质数据源

### 🎯 AI/科技类

#### **国外源**

##### Twitter/X 账号
```typescript
// 在 src/data-sources/getDataSources.ts 中配置
twitter: [
  { identifier: "https://x.com/OpenAI" },        // OpenAI 官方
  { identifier: "https://x.com/AnthropicAI" },   // Anthropic Claude
  { identifier: "https://x.com/GoogleAI" },      // Google AI
  { identifier: "https://x.com/DeepMind" },      // DeepMind
  { identifier: "https://x.com/sama" },          // Sam Altman
  { identifier: "https://x.com/karpathy" },      // Andrej Karpathy
  { identifier: "https://x.com/ylecun" },        // Yann LeCun
  { identifier: "https://x.com/goodfellow_ian" }, // Ian Goodfellow
  { identifier: "https://x.com/GaryMarcus" },    // Gary Marcus
  { identifier: "https://x.com/bindureddy" },    // Aravind Srinivas (Perplexity)
]
```

##### 网站源（使用 FireCrawl）
```typescript
firecrawl: [
  { identifier: "https://news.ycombinator.com/" },           // Hacker News
  { identifier: "https://techcrunch.com/" },                 // TechCrunch
  { identifier: "https://www.theverge.com/" },               // The Verge
  { identifier: "https://arstechnica.com/" },                // Ars Technica
  { identifier: "https://www.technologyreview.com/" },       // MIT Tech Review
  { identifier: "https://venturebeat.com/" },                // VentureBeat
  { identifier: "https://www.wired.com/" },                  // Wired
  { identifier: "https://blog.google/technology/ai/" },      // Google AI Blog
  { identifier: "https://openai.com/blog/" },                // OpenAI Blog
  { identifier: "https://www.anthropic.com/news" },          // Anthropic News
]
```

##### RSSHub 路径（免费）
```typescript
// RSSHub 支持海量网站，无需 API Key
rsshub: [
  "/github/trending/daily",                      // GitHub 每日趋势
  "/github/trending/daily/typescript",           // TypeScript 趋势
  "/producthunt/today",                          // Product Hunt 今日产品
  "/reddit/best/technology",                     // Reddit 科技板块
  "/hackernews/best",                            // Hacker News 最佳
  "/medium/tag/artificial-intelligence",         // Medium AI 标签
  "/techcrunch",                                 // TechCrunch
  "/arxiv/cs.AI",                                // arXiv AI 论文
  "/twitter/user/OpenAI",                        // Twitter (通过 RSSHub)
]
```

#### **国内源**

##### 网站源
```typescript
firecrawl: [
  { identifier: "https://www.36kr.com/newsflashes" },        // 36氪快讯
  { identifier: "https://www.geekpark.net/" },               // 极客公园
  { identifier: "https://www.ifanr.com/" },                  // 爱范儿
  { identifier: "https://www.jiqizhixin.com/" },             // 机器之心
  { identifier: "https://www.leiphone.com/" },               // 雷锋网
  { identifier: "https://www.infoq.cn/ai" },                 // InfoQ AI
  { identifier: "https://www.ithome.com/" },                 // IT之家
]
```

##### RSSHub 路径（国内站点）
```typescript
rsshub: [
  "/36kr/news/latest",                           // 36氪最新
  "/zhihu/daily",                                // 知乎日报
  "/juejin/trending/all/weekly",                 // 掘金周榜
  "/sspai/series",                               // 少数派
  "/weibo/keyword/人工智能",                      // 微博关键词
  "/bilibili/ranking/0/3/1",                     // B站科技区日榜
  "/weixin/articles/jiqizhixin",                 // 机器之心公众号
  "/github/repos/openai",                        // OpenAI GitHub
]
```

### 📈 金融/商业类

```typescript
// Twitter 财经大V
twitter: [
  { identifier: "https://x.com/elonmusk" },      // Elon Musk
  { identifier: "https://x.com/chamath" },       // Chamath Palihapitiya
  { identifier: "https://x.com/paulg" },         // Paul Graham (YC)
]

// 财经网站
firecrawl: [
  { identifier: "https://www.bloomberg.com/technology" }, // Bloomberg 科技
  { identifier: "https://www.cnbc.com/technology/" },     // CNBC 科技
  { identifier: "https://finance.yahoo.com/" },           // Yahoo Finance
]

// RSSHub
rsshub: [
  "/bloomberg/technology",                       // Bloomberg
  "/wsj/tech",                                  // WSJ 科技
  "/ft/news/companies/technology",              // 金融时报科技
]
```

### 🎓 学术/研究类

```typescript
// 学术网站
firecrawl: [
  { identifier: "https://arxiv.org/list/cs.AI/recent" },  // arXiv AI
  { identifier: "https://distill.pub/" },                 // Distill (可视化)
  { identifier: "https://paperswithcode.com/" },          // Papers with Code
]

// RSSHub
rsshub: [
  "/arxiv/cs.AI",                               // arXiv AI 论文
  "/arxiv/cs.LG",                               // 机器学习论文
  "/nature/subjects/machine-learning",          // Nature ML
  "/sciencemag/current/ai",                     // Science AI
]
```

### 🎮 产品/设计类

```typescript
// Twitter
twitter: [
  { identifier: "https://x.com/levelsio" },      // Indie Hacker
  { identifier: "https://x.com/dhh" },           // DHH (Ruby创始人)
]

// 网站
firecrawl: [
  { identifier: "https://www.producthunt.com/" },         // Product Hunt
  { identifier: "https://www.indiehackers.com/" },        // Indie Hackers
  { identifier: "https://betalist.com/" },                // Beta List
]

// RSSHub
rsshub: [
  "/producthunt/today",                         // Product Hunt 今日
  "/dribbble/popular",                          // Dribbble 热门
  "/behance/featured",                          // Behance 精选
]
```

---

## 🔧 配置方法

### 方法 1: 代码配置（推荐入门）

编辑 `src/data-sources/getDataSources.ts`:

```typescript
export const sourceConfigs: SourceConfig = {
  firecrawl: [
    { identifier: "https://news.ycombinator.com/" },
    { identifier: "https://techcrunch.com/" },           // 新增
    { identifier: "https://www.36kr.com/newsflashes" },  // 新增
  ],
  twitter: [
    { identifier: "https://x.com/OpenAI" },
    { identifier: "https://x.com/AnthropicAI" },         // 新增
    { identifier: "https://x.com/GoogleAI" },            // 新增
  ],
} as const;
```

### 方法 2: 数据库配置（推荐生产环境）

#### 步骤 1: 启用数据库

在 `.env` 文件中配置：

```bash
ENABLE_DB=true
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your-password
DB_DATABASE=trendfinder
```

#### 步骤 2: 初始化数据库

```bash
# 运行数据库迁移
deno run -A node_modules/.bin/drizzle-kit push:mysql
```

#### 步骤 3: 添加数据源

通过数据库直接插入：

```sql
-- 添加网站源
INSERT INTO data_sources (identifier, platform, created_at, updated_at)
VALUES 
  ('https://techcrunch.com/', 'firecrawl', NOW(), NOW()),
  ('https://www.36kr.com/newsflashes', 'firecrawl', NOW(), NOW());

-- 添加 Twitter 源
INSERT INTO data_sources (identifier, platform, created_at, updated_at)
VALUES 
  ('https://x.com/GoogleAI', 'twitter', NOW(), NOW()),
  ('https://x.com/DeepMind', 'twitter', NOW(), NOW());
```

或通过 API（TODO: 待实现管理界面）。

---

## 🎯 高级用法

### 1. 使用 RSSHub（免费，推荐）

RSSHub 是一个开源 RSS 生成器，支持数千个网站，**完全免费无需 API Key**！

#### 安装 RSSHub（可选）

```bash
# Docker 方式
docker run -d -p 1200:1200 diygod/rsshub

# 或使用公共实例
# 无需安装，直接使用: https://rsshub.app
```

#### 在项目中使用

```typescript
import { RsshubScraper } from "@src/modules/scrapers/rsshub.scraper.ts";

const rsshub = new RsshubScraper();

// 抓取 GitHub 趋势
const githubTrending = await rsshub.scrape("/github/trending/daily");

// 抓取知乎日报
const zhihuDaily = await rsshub.scrape("/zhihu/daily");

// 抓取 36氪快讯
const kr36News = await rsshub.scrape("/36kr/news/latest");
```

#### RSSHub 路由大全

访问 [RSSHub 文档](https://docs.rsshub.app/) 查看所有支持的网站。

**热门路由**:

| 类别 | 路由 | 说明 |
|------|------|------|
| GitHub | `/github/trending/daily` | 每日趋势 |
| GitHub | `/github/repos/{user}` | 用户仓库 |
| 知乎 | `/zhihu/daily` | 知乎日报 |
| 微博 | `/weibo/keyword/{keyword}` | 关键词搜索 |
| B站 | `/bilibili/ranking/0/3/1` | 科技区日榜 |
| 36氪 | `/36kr/news/latest` | 最新快讯 |
| 掘金 | `/juejin/trending/all/weekly` | 周榜 |
| Product Hunt | `/producthunt/today` | 今日产品 |
| Hacker News | `/hackernews/best` | 最佳内容 |
| arXiv | `/arxiv/cs.AI` | AI 论文 |

### 2. 使用 Jina DeepSearch（AI 驱动）

Jina DeepSearch 提供 AI 驱动的深度搜索能力。

```typescript
import { JinaDeepSearchScraper } from "@src/modules/scrapers/jina/jina.deepsearch.scraper.ts";

const jina = new JinaDeepSearchScraper();

// 搜索最新的 AI 新闻
const aiNews = await jina.scrape("Latest AI breakthroughs in 2026");

// 搜索特定主题
const llmNews = await jina.scrape("Large Language Model developments");
```

**配置**:
```bash
JINA_API_KEY="your-jina-key"
```

### 3. 批量添加数据源脚本

创建 `scripts/add-sources.ts`:

```typescript
import db from "@src/db/db.ts";
import { dataSources } from "@src/db/schema.ts";

const sources = [
  { identifier: "https://techcrunch.com/", platform: "firecrawl" },
  { identifier: "https://x.com/GoogleAI", platform: "twitter" },
  // ... 更多源
];

for (const source of sources) {
  await db.insert(dataSources).values({
    ...source,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

console.log(`✓ 已添加 ${sources.length} 个数据源`);
```

运行：
```bash
deno run -A scripts/add-sources.ts
```

---

## 📊 数据源性能对比

| 类型 | 速度 | 质量 | 成本 | 推荐度 |
|------|------|------|------|--------|
| **RSSHub** | ⚡⚡⚡ | ⭐⭐⭐⭐ | 💰 免费 | ⭐⭐⭐⭐⭐ |
| **Jina Reader** | ⚡⚡ | ⭐⭐⭐⭐⭐ | 💰💰 低 | ⭐⭐⭐⭐ |
| **FireCrawl** | ⚡⚡ | ⭐⭐⭐⭐ | 💰💰💰 中 | ⭐⭐⭐⭐ |
| **Twitter API** | ⚡⚡⚡ | ⭐⭐⭐⭐ | 💰💰 低 | ⭐⭐⭐⭐ |
| **Jina DeepSearch** | ⚡ | ⭐⭐⭐⭐⭐ | 💰💰💰 高 | ⭐⭐⭐ |

**结论**: 
- **入门推荐**: RSSHub（免费 + 简单）
- **进阶推荐**: RSSHub + Jina Reader（平衡性能和成本）
- **专业推荐**: 全部组合使用（最佳效果）

---

## 🎯 最佳实践

### 1. 数据源选择策略

```typescript
// 🌟 推荐配置（成本低，效果好）
const recommendedConfig = {
  // 使用 RSSHub（免费）获取主要内容
  rsshub: [
    "/github/trending/daily",
    "/zhihu/daily",
    "/36kr/news/latest",
    "/hackernews/best",
  ],
  
  // 使用 Twitter（低成本）获取实时动态
  twitter: [
    "https://x.com/OpenAI",
    "https://x.com/AnthropicAI",
  ],
  
  // 关键站点使用 Jina Reader（高质量）
  jina: [
    "https://openai.com/blog/",
    "https://www.anthropic.com/news",
  ],
};
```

### 2. 避免重复抓取

项目内置了去重机制，但建议：
- 不要配置内容重复度高的源
- 使用不同类型的源互补

### 3. 控制抓取频率

在 `src/controllers/cron.ts` 中调整定时任务：

```typescript
// 每天凌晨 3 点执行
cron.schedule("0 3 * * *", ...)

// 改为每天早上 9 点
cron.schedule("0 9 * * *", ...)

// 改为每 6 小时执行一次
cron.schedule("0 */6 * * *", ...)
```

### 4. 监控数据质量

```typescript
// 查看工作流统计
const stats = workflow.getWorkflowStats(eventId);
console.log(`
  数据源: ${stats.sources}
  成功: ${stats.success}
  失败: ${stats.failed}
  内容: ${stats.contents}
  重复: ${stats.duplicates}
`);
```

---

## 🆘 常见问题

### Q1: 如何快速测试数据源是否可用？

```bash
# 运行测试脚本
deno run -A src/modules/scrapers/tests/fireCrawl.scraper.test.ts
deno run -A src/modules/scrapers/tests/rsshub.scraper.test.ts
deno run -A src/modules/scrapers/tests/twitter.scraper.test.ts
```

### Q2: RSSHub 如何自建实例？

```bash
# Docker 方式（推荐）
docker run -d \
  -p 1200:1200 \
  -e CACHE_TYPE=memory \
  --name rsshub \
  diygod/rsshub

# 配置项目使用自建实例
# 在 src/modules/scrapers/rsshub.scraper.ts 中修改 baseURL
```

### Q3: 数据源太多会影响性能吗？

**答**: 会的。建议：
- 入门: 5-10 个源
- 进阶: 10-20 个源
- 专业: 20+ 个源（需要优化并发控制）

### Q4: 如何添加不支持的网站？

1. **优先考虑 RSSHub** - 查看是否已有路由
2. **使用 Jina Reader** - 支持任何网站
3. **使用 FireCrawl** - 更精确的控制
4. **自定义 Scraper** - 实现 `ContentScraper` 接口

---

## 📖 相关资源

- [RSSHub 官方文档](https://docs.rsshub.app/)
- [Jina AI 文档](https://docs.jina.ai/)
- [FireCrawl 文档](https://docs.firecrawl.dev/)
- [Twitter API 文档](https://developer.twitter.com/en/docs)
- [快速开始指南](./quick-start-guide.md)

---

**文档版本**: v2.1.0  
**最后更新**: 2026-01-03  
**维护者**: TrendPublish Team

