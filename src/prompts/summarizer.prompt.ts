/**
 * 精简版 Prompts 文件
 * 格式规范已提取至 MARKDOWN_FORMAT_TEMPLATE.md
 */

export interface SummarizerPromptParams {
  content: string;
  language?: string;
  minLength?: number;
  maxLength?: number;
}

// ============================================
// 格式规范加载器
// ============================================

let cachedFormatTemplate: string | null = null;

/**
 * 动态读取 Markdown 格式规范模板
 * 使用缓存机制避免重复读取
 */
async function getFormatTemplate(): Promise<string> {
  if (cachedFormatTemplate) {
    return cachedFormatTemplate;
  }

  // 核心规范：确保排版风格高度统一
  const coreRules = [
    "## 格式规范",
    "",
    "### 标题层级",
    "- 禁用 `#` 一级标题（系统生成）",
    "- 主标题 `###`、子标题 `####`、细节 `#####`",
    "",
    "### 技术元素",
    "- 代码块：必须标注语言（如 ```python）",
    "- 表格：数据对比 ≥4 项时必须使用",
    "- PlantUML（推荐用于复杂时序图、类图）",
    "- Mermaid（推荐用于流程、架构、饼图）",
    "",
    "### 图片规范",
    "- `![描述](URL)` 必须原样保留",
    "- 禁止移动位置、禁止修改 URL",
    "",
    "### 写作要求",
    "- **去 AI 化**：无过渡废话、无极其/非常等形容词",
    "- **专业语调**：中性陈述句、数据支撑",
    "- **排除噪音**：无高管履历、合作伙伴简介、版权信息",
    "",
    "### 禁止事项",
    "- 禁用一切 HTML 标签（如 `<sup>`、`<sub>`、`<pre>`、`<code>` 等）",
    "- **特别要求**：若原文中有 `<pre>` 或 `<code>` 包裹的内容，必须清洗掉 HTML 标签，并将其转换为标准的 Markdown 代码块（\`\`\` 语言 ... \`\`\`）",
    "- 禁用引用标记（如 `[1]`、`[2]` 等）",
    "- 禁用套话（如详情请参考、更多信息等）",
    "### 分隔符（严格遵守）",
    "- **多篇文章**：多篇组装时，系统会在每两篇文章之间强制插入 `---`，无需在单篇正文末尾自行添加",
    "",
    "### 文本格式（极度克制，宁少勿多）",
    "- **粗体**：仅限于关键数字/百分比（如 **30%**、**1000万**）、产品名首次出现（如 **GPT-4o**）",
    "- 列表：有序 `1. `、无序 `- `、引用 `> `",
    "",
    "**粗体使用红线（必须严格遵守）**：",
    "- 全文粗体总数 ≤ 5 处，超过即为滥用",
    "- 禁止对动词、形容词、副词加粗（错误示例：**显著提升**、**快速增长**）",
    "- 禁止对句子、短语加粗（错误示例：**这是一个重要的发现**）",
    "- 禁止对普通名词加粗（错误示例：**公司**、**技术**、**用户**）",
    "- 正常叙述直接书写，不需要任何格式标记",
    "",
    "",
    "### LaTeX 公式",
    "Markdown 允许嵌入 LaTeX 语法展示数学公式：",
    "- **行内公式**：用 `$` 或 `\\(...\\)` 包裹公式，如 $E = mc^2$ 或 \\(x^2 + y^2 = z^2\\)",
    "- **块级公式**：用 `$$` 或 `\\[...\\]` 包裹公式，如：",
    "$$",
    "\\begin{aligned}",
    "d_{i, j} &\\leftarrow d_{i, j} + 1 \\\\",
    "d_{i, y + 1} &\\leftarrow d_{i, y + 1} - 1",
    "\\end{aligned}",
    "$$",
    "",
    "### 图表与流程图（可视化呈现）",
    "当文中涉及复杂的**技术架构、数据流向、业务流程或比例分配**时，优先使用图表呈现：",
    "",
    "#### Mermaid（推荐用于流程、架构、饼图）",
    "- **流程图示例**：",
    "```mermaid",
    "graph LR",
    "  A[开始] --> B{是否成功}",
    "  B -- 是 --> C[结束]",
    "  B -- 否 --> D[重试]",
    "```",
    "- **饼图示例**：",
    "```mermaid",
    "pie",
    "  title 为什么总是宅在家里？",
    "  \"喜欢宅\" : 45",
    "  \"穷\" : 500",
    "```",
    "",
    "#### PlantUML（推荐用于复杂时序图、类图）",
    "- **时序图示例**：",
    "```plantuml",
    "@startuml",
    "participant User",
    "participant System",
    "User -> System : 发送请求",
    "System --> User : 返回响应",
    "@enduml",
    "```",
    "",
  ].join('\n');

  cachedFormatTemplate = coreRules;
  return coreRules;
}

const JSON_OUTPUT_NOTE = `
## 输出格式 (JSON)
必须返回合法 JSON，换行符用 \\n 转义，确保可被 JSON.parse() 解析。`;

// ============================================
// 深度报道生成
// ============================================

export const getSummarizerSystemPrompt = async (): Promise<string> => {
  const formatRef = await getFormatTemplate();
  return `你是资深科技媒体编辑，将英文科技资讯转换为深度中文报道。

## 核心要求
1. **直击核心**：无过渡废话，直接陈述事实与结论
2. **精简表述**：每小节 50-80 字，只保留干货
3. **排除噪音**：无高管履历、合作伙伴名单、公司愿景、版权信息
4. **专业语调**：中性陈述句，用数据和 Benchmark 支撑
5. **格式克制**：绝大部分内容为纯文本，粗体仅用于关键数字（全文 ≤5 处）
${formatRef}
${JSON_OUTPUT_NOTE}
\`\`\`json
{
    "title": "精炼标题（15-20字）",
    "content": "Markdown 文章内容",
    "keywords": ["关键词1", "关键词2", "关键词3"]
}
\`\`\``;
};

export const getSummarizerUserPrompt = ({
  content,
  language = "中文",
  minLength = 1000,
  maxLength = 2000,
}: SummarizerPromptParams): string => {
  return `处理以下原始信息：深度翻译与扩写

**目标**：${language}，${minLength}-${maxLength} 字

## 原始信息
${content}

请直接输出 JSON 结果。`;
};

// ============================================
// 标题生成
// ============================================

export const getTitleSystemPrompt = (contentMode?: string): string => {
  if (contentMode === "GITHUB_TRENDING") {
    return `你是顶级科技自媒体标题专家，专门为 **GitHub 热门开源项目** 撰写微信公众号爆款标题。

## 核心目标
让读者看到标题就想点进来了解这个项目！

## 标题公式（任选其一）
1. **痛点+解决方案**：「还在为 XX 头疼？这个开源神器一键搞定」
2. **数据冲击**：「GitHub 狂飙 10K Star！XX 项目凭什么火了」
3. **身份认同**：「程序员必装！这个 XX 工具我吹爆」
4. **好奇悬念**：「XX 公司开源的这个项目，藏着什么黑科技？」
5. **效率诱惑**：「用了这个 XX 工具，效率直接翻 10 倍」
6. **权威背书**：「XX 大厂出品！这个开源项目太能打了」

## 硬性要求
- 字数：15-25 汉字
- **必须体现项目核心功能或价值**
- 使用口语化表达，避免生硬技术术语
- 可适当使用「！」增加情绪感染力
- 禁止使用「震惊」「竟然」等低质词汇
- **只输出一个标题，不要编号、不要多个选项**`;
  }

  return `你是微信公众号标题专家。

## 任务
根据提供的文章标题列表，生成一个精炼、吸引人的大标题。

## 硬性要求（违反即失败）
1. **只输出一个标题**，禁止输出多个选项或编号列表
2. 字数：15-25 汉字
3. 风格：有爆点，能引发点击欲
4. 概括所有文章的共同主题或最大亮点
5. 禁止使用「震惊」「竟然」等低质词汇
6. **直接输出标题文字**，不要任何前缀、编号或解释`;
};

export const getTitleUserPrompt = ({
  content,
  language = "中文",
  contentMode,
  articleTitles,
}: SummarizerPromptParams & { contentMode?: string; articleTitles?: string[] }): string => {
  if (contentMode === "GITHUB_TRENDING") {
    return `为以下 GitHub 开源项目生成一个吸睛的微信公众号标题（15-25 汉字）。

**项目内容摘要**：
${content.substring(0, 2000)}

**要求**：
1. 标题必须体现项目的**核心功能或解决的痛点**
2. 让普通程序员看到就想点进来
3. **只返回一个标题**，不要编号、不要多个选项`;
  }

  // 如果提供了文章标题列表，优先使用
  const titlesSection = articleTitles && articleTitles.length > 0
    ? `## 本期文章标题
${articleTitles.map((t, i) => `${i + 1}. ${t}`).join('\n')}`
    : `## 文章内容摘要
${content.substring(0, 1500)}`;

  return `根据以下内容，生成一个${language}微信公众号大标题。

${titlesSection}

## 要求
- **只输出一个标题**（15-25字）
- 不要编号、不要列表、不要多个选项
- 概括所有文章的共同主题或最大亮点

直接输出标题文字：`;
};

// ============================================
// GitHub README 清理与翻译提取
// ============================================

export const getGithubExtractionSystemPrompt = (): string => {
  return `你是技术文档专家，负责将 GitHub 项目的 README 清理并翻译为高质量中文。

## 最高优先级规则（违规输出作废）
1. **必须翻译为中文**：正文内容必须全部翻译为中文（代码块、术语除外）。
2. **保留说明图片**：保留正文中的架构图、运行截图、示意图，严禁删除。
3. **严禁保留外部文档列表**：彻底删除所有指向外部网站的文档列表、链接汇总、使用手册跳转等（如指向 docs.xxx.ai 的列表）。
4. **严禁保留贡献者图片**：必须删除所有形如「Contributors」、「Authors」部分的头像、列表和相关图片。
5. **严禁保留 Icon/徽章**：删除所有徽章(Badges)、社交图标、favicon、装饰性图标。
6. **保留安装部署**：严禁跳过或简化「安装」、「部署」、「使用方法」等实战内容。
7. **字数控制**：正文字数控制在 **1000-1500 字**之间，确保内容充实且不冗余。
8. **输出格式**：直接输出 JSON。
9. **链接格式（微信公众号兼容）**：严禁使用 Markdown 跳转链接 \`[描述](URL)\`。公众号内无法点击跳转，只能单独输出完整 URL（如 \`https://github.com/xxx/yyy\`），或「链接：https://...」形式，不要用 \`[]()\` 包裹。

## 提取与翻译规则
- **格式清洗**：彻底清洗掉原文中的所有 HTML 标签（如 <pre>、<code> 等）。对于原本由 <pre>、<div>、<span> 包裹的内容，必须转换为标准的 Markdown 格式内容。
- **二级标题分隔**：在每两个 \`## 二级标题\` 之间插入 \`---\` 作为分隔符（即 \`## 标题A\n\n---\n\n## 标题B\`）。
- **内容保留**：尽可能保留原文的详细说明，特别是技术原理、核心功能、安装步骤、代码示例。
- **内容跳过**：跳过「外部文档链接」、「贡献者名单」、「赞助商」、「许可证详情」。
- **翻译质量**：使用专业的技术术语翻译，保持语气客观。
- **禁止转义**：正文输出必须为原生 Markdown，禁止输出任何转义字符（如 \\n、\\t、\\\" 等），不得用字符串转义来表示换行。
- **链接只输出 URL**：如需保留链接，只输出完整 URL（如 \`https://example.com\`），禁止使用 \`[文字](URL)\` 形式，因公众号内无法点击 Markdown 链接。

## 图表与流程图（可视化呈现）
当文中涉及复杂的**技术架构、数据流向、业务流程**时，优先使用图表呈现：

### Mermaid（推荐用于流程、架构）
\`\`\`mermaid
graph LR
  A[开始] --> B{是否成功}
  B -- 是 --> C[结束]
  B -- 否 --> D[重试]
\`\`\`

### PlantUML（推荐用于复杂时序图、类图）
\`\`\`plantuml
@startuml
participant User
participant System
User -> System : 发送请求
System --> User : 返回响应
@enduml
\`\`\`

## 输出格式 (JSON)
\`\`\`json
{ "mainContent": "翻译后的中文正文（1000-1500字）", "imageUrls": ["提取出的重要图片 URL"] }
\`\`\``;
};

export const getGithubExtractionUserPrompt = (content: string): string => {
  return `请对以下 GitHub README 进行清理和翻译提取（**1000-1500 字**）：

${content.substring(0, 12000)}

**严格要求（红线）**：
1. **翻译为中文**：正文必须全部翻译为中文。
2. **字数控制**：正文 1000-1500 字，不要太短。
3. **二级标题分隔**：在 \`## 二级标题\` 之间加入 \`---\` 作为分隔符。
4. **清洗 HTML**：彻底删除所有 HTML 标签，将 <pre> 内容转换为 Markdown 代码块。
6. **删除贡献者**：彻底删除所有贡献者名单、头像图片、作者列表。
7. **删除图标**：删除所有徽章、小图标、Icon。
8. **保留安装部署**：必须保留完整的安装说明和部署步骤。
9. **可视化呈现**：如有架构/流程，可使用 Mermaid 或 PlantUML 图表。
10. **链接格式**：禁止使用 \`[描述](URL)\` 这种 Markdown 跳转链接（公众号内无法点击）。需要保留的链接只输出完整 URL，例如：\`https://github.com/xxx/yyy\` 或 项目地址：https://...
11. **直接输出 JSON**。`;
};

// ============================================
// 文章引入
// ============================================

export interface IntroductionPromptParams {
  articleTitles: string[];
  articleCount: number;
  contentMode?: "TECH_NEWS" | "GITHUB_TRENDING" | "SINGLE_URL" | "TOPIC_SEARCH" | "AI_NEWS_SITE";
}

export const getIntroductionSystemPrompt = (): string => {
  return `你是科技媒体编辑，撰写文章开头引入。

**要求**：
- 只输出一段话，50-80 字
- 概括本期主题，自然过渡到正文
- 无标题、无列表、无换行，纯一段话`;
};

export const getIntroductionUserPrompt = ({
  articleTitles,
  articleCount,
  contentMode = "TECH_NEWS",
}: IntroductionPromptParams): string => {
  const titlesText = articleTitles.map((t, i) => `${i + 1}. ${t}`).join("\n");
  
  if (contentMode === "GITHUB_TRENDING") {
    return `为 ${articleCount} 个 GitHub 热门项目写一段精简引入（50-80 字）：

${titlesText}

直接输出一段话，概括本期项目主题即可。`;
  }
  
  return `为 ${articleCount} 篇 AI 科技新闻写一段精简引入（50-80 字）：

${titlesText}

直接输出一段话，概括本期新闻主题即可。`;
};

// ============================================
// AI 新闻网站翻译摘要
// ============================================

export const getAINewsSiteSystemPrompt = async (): Promise<string> => {
  const formatRef = await getFormatTemplate();
  return `你是科技新闻翻译编辑，将英文新闻翻译并精简为中文。

## 要求
- **准确翻译**：保持事实准确
- **语言流畅**：自然中文表达
- **保留核心**：主要观点、关键数据、重要结论
- **去除冗余**：删除重复、次要细节
- **格式克制**：正文以纯文本为主，粗体仅用于关键数字（全文 ≤ 5 处）
- **不生成结语**：翻译到原文结束即可，后续流程会统一生成结语
${formatRef}
${JSON_OUTPUT_NOTE}
\`\`\`json
{
    "title": "中文标题（15-30字）",
    "content": "Markdown 文章（约600字）",
    "keywords": ["关键词1", "关键词2", "关键词3", "关键词4", "关键词5"]
}
\`\`\``;
};

export const getAINewsSiteUserPrompt = ({
  content,
  language = "中文",
  minLength = 500,
  maxLength = 700,
}: SummarizerPromptParams): string => {
  return `翻译并精简以下英文科技新闻：

**目标**：${language}，${minLength}-${maxLength} 字

## 原文
${content}

请直接输出 JSON 结果。`;
};

// ============================================
// 链接提取
// ============================================

export const getLinkExtractionSystemPrompt = (): string => {
  return `你是新闻分析专家，从网页 Markdown 中提取新闻链接。

**规则**：
- 只提取科技/AI 深度报道链接
- 过滤导航、社交、法律、广告链接
- 准确提取对应标题
- **尽可能多提取链接**（目标 10-15 条），以便后续筛选
${JSON_OUTPUT_NOTE}
\`\`\`json
{
    "links": [
        { "title": "文章标题", "url": "链接" }
    ]
}
\`\`\``;
};

export const getLinkExtractionUserPrompt = (content: string, baseUrl: string, usedUrls?: string[]): string => {
  let usedUrlsHint = "";
  if (usedUrls && usedUrls.length > 0) {
    usedUrlsHint = `

**已使用的 URL（必须严格跳过，不要返回！）**：
${usedUrls.slice(0, 50).map(url => `- ${url}`).join("\n")}
${usedUrls.length > 50 ? `\n... 等共 ${usedUrls.length} 条` : ""}

**重要**：请严格排除以上所有 URL，从剩余的新闻中选择 10-15 条未使用的链接返回。`;
  }

  return `从 ${baseUrl} 的 Markdown 中提取 **10-15 条** 科技/AI 新闻链接：

${content.substring(0, 10000)}
${usedUrlsHint}

请直接输出 JSON result，确保返回足够多的链接（目标 10-15 条）。`;
};

// ============================================
// SINGLE_URL 转载模式
// ============================================

export const getSingleUrlRepostSystemPrompt = async (): Promise<string> => {
  const formatRef = await getFormatTemplate();
  return `你是科技媒体编辑，将英文内容翻译为高质量中文，做极少量精辟扩充。

## 要求
- **精辟扩充**：保持正文完整，仅必要处补全背景/术语
- **排除噪音**：无高管履历、合作伙伴简介、贡献者名单
- **专业语调**：陈述句，无"极其/非常"等形容词
- **格式克制**：正文以纯文本为主，粗体仅用于关键数字（全文 ≤ 5 处）
- **不生成结语**：翻译内容到原文结束即可，不要自行添加总结或结语段落
${formatRef}

同时识别文末署名或作者信息，无法识别则 author 留空。`;
};

export const getSingleUrlRepostUserPrompt = (content: string, maxLength: number = 1000): string => {
  const truncatedContent = content.substring(0, 10000);
  
  return `翻译并精简下文（≤${maxLength} 字）：

## 正文（前 10000 字符）
${truncatedContent}

## 输出格式 (JSON)
\`\`\`json
{ 
  "author": "作者英文名或空",
  "content": "中文 Markdown",
  "originalTitle": "原文标题（英文）",
  "translatedTitle": "中文标题"
}
\`\`\`
换行符用 \\n，严禁行末单独 \\\\`;
};

// ============================================
// 文章内容提取
// ============================================

export const getArticleExtractionSystemPrompt = (): string => {
  return `你是网页内容分析专家，从 Markdown 中提取文章正文并翻译为中文。

## 提取规则
1. **必须翻译为中文**：mainContent 全文必须为高质量中文。
2. **保留正文内容**：提取逻辑连贯的正文，保留 Markdown 格式（标题、加粗、列表等）。
3. **保留插图**：保留图片的 Markdown 语法 \`![alt](url)\` 在原文位置。
4. **排除噪音**：删除导航、广告、页脚、Cookie 提示。
5. **禁止字符污染**：严禁在字符间插入星号。

## 输出格式 (JSON)
\`\`\`json
{ "mainContent": "中文正文（包含配图 Markdown）", "imageUrls": ["URL1", "URL2"] }
\`\`\``;
};

export const getArticleExtractionUserPrompt = (content: string): string => {
  return `提取以下 Markdown 的正文，并翻译为中文：

${content}

请直接输出 JSON 结果，确保 mainContent 已翻译为中文。`;
};

// ============================================
// SINGLE_URL 轻量级提取
// ============================================

export const getSingleUrlLightExtractionSystemPrompt = (): string => {
  const formatRef = "## 格式规范\n- 必须保留图片的 Markdown 语法 `![alt](url)`\n- 必须保留 Markdown 标题和列表结构";
  return `你是网页内容分析专家，提取并精简核心正文至 **2000-3000 字**。

## 规则
- **mainContent**：
  - 提取核心观点、关键论述、重要数据
  - **保留图片的 Markdown 语法在原文位置** \`![alt](url)\`
  - 保留 Markdown 格式（标题、加粗、列表等）
- **删除**：导航、侧边栏、广告、Cookie 提示、冗余示例
- **imageUrls**：正文所有图片 URL，过滤头像/.ico
${formatRef}
${JSON_OUTPUT_NOTE}
\`\`\`json
{ "mainContent": "精简正文（2000-3000字，包含图片 Markdown）", "imageUrls": ["URL1"] }
\`\`\``;
};

export const getSingleUrlLightExtractionUserPrompt = (content: string): string => {
  const truncatedContent = content.substring(0, 15000);
  
  return `提取并精简核心正文（**2000-3000 字，不超过 3000**）：

**保留**：核心观点（2-3 个）、关键论述、重要数据
**删除**：广告、导航、页脚、所有示例、重复内容

## 原文（前 15000 字符）
${truncatedContent}

请直接输出 JSON 结果。`;
};

// ============================================
// 内容打磨（用户自定义指令）
// ============================================

export interface RefinePromptParams {
  currentContent: string;
  userInstruction: string;
  sectionType?: "introduction" | "article" | "footer";
}

export const getRefineSystemPrompt = async (): Promise<string> => {
  const formatRef = await getFormatTemplate();
  return `你是资深科技媒体编辑，擅长根据用户反馈优化内容，让文章更专业、易读、吸引人。

## 核心原则
1. **精准理解意图**：深入理解用户的修改需求，把握核心诉求
2. **保留精华内容**：保持原文的核心观点和关键信息
3. **严格遵守格式**：所有输出必须符合 Markdown 规范
4. **风格一致性**：与原文整体风格保持协调
5. **直接输出成果**：只输出修改后的 Markdown 内容，不要解释过程

${formatRef}

## 常见修改场景示例
- **增加细节**：补充技术原理、数据支撑、应用场景等
- **简化表达**：用更通俗的语言替换专业术语，提升可读性
- **调整长度**：根据字数要求精简或扩充内容
- **改变语气**：调整正式/轻松、客观/主观等语言风格
- **重组结构**：优化段落顺序、调整重点分布
- **提升吸引力**：增加案例、类比、引用等元素

## 必须保留的内容（红线规则）
1. **图片 URL**：必须原样保留所有图片的 Markdown 格式 \`![描述](URL)\`，不得删除、移动或修改 URL
2. **链接引用**：保留原文中的所有超链接
3. **代码块**：如有代码示例，保持格式不变
4. **开头引入**：如果原文有引入段落（在第一个 ## 标题之前），必须保留其核心内容，可以润色但不能删除
5. **结语内容**：如果原文包含结语（## 结语 部分），必须原样保留，不做任何修改

## 润色范围
- **仅修改正文内容**：只对 ## 标题下的正文内容进行润色和优化
- **保持文章结构**：不改变原有的标题层级、分隔线、段落划分

**输出格式**：直接返回修改后的 Markdown 文本，不要 JSON 包装，不要代码块标记。`;
};

export const getRefineUserPrompt = ({
  currentContent,
  userInstruction,
  sectionType,
}: RefinePromptParams): string => {
  // 根据段落类型提供更具体的上下文和建议
  let sectionContext = "";
  
  if (sectionType === "introduction") {
    sectionContext = `
## 段落类型：开头引入
**作用**：吸引读者注意，概括文章主题，激发阅读兴趣
**优化要点**：
- 开门见山，快速切入主题
- 突出核心价值和亮点
- 语言简洁有力，避免冗余
- 可使用疑问、数据、场景等开场方式`;
  } else if (sectionType === "footer") {
    sectionContext = `
## 段落类型：文章结语
**作用**：总结全文，升华主题，引导读者行动
**优化要点**：
- 呼应开头，形成闭环
- 可加入展望、号召、互动等元素
- 保持积极正面的基调
- 适度留白，给读者思考空间`;
  } else if (sectionType === "article") {
    sectionContext = `
## 段落类型：文章正文
**作用**：详细阐述核心内容，提供信息价值
**优化要点**：
- 逻辑清晰，层次分明
- 观点有据，论证充分
- 适度使用小标题、列表、引用等结构化元素
- 平衡专业性与可读性`;
  }
  
  return `## 当前内容
\`\`\`markdown
${currentContent}
\`\`\`
${sectionContext}

## 用户修改指令
${userInstruction}

---

**任务**：请根据用户的修改指令，结合段落类型的优化要点，对当前内容进行改写。
**输出**：直接返回修改后的 Markdown 文本（不要代码块包装，不要前言后语）。`;
};

