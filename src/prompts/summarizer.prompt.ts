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
    "- 主标题 `##`、子标题 `###`、细节 `####`",
    "",
    "### 文本格式（极度克制，宁少勿多）",
    "- **粗体**：仅限于关键数字/百分比（如 **30%**、**1000万**）、产品名首次出现（如 **GPT-4o**）",
    "- 列表：有序 `1. `、无序 `- `、引用 `> `",
    "- 分隔：板块间用 `---`",
    "",
    "**粗体使用红线（必须严格遵守）**：",
    "- 全文粗体总数 ≤ 5 处，超过即为滥用",
    "- 禁止对动词、形容词、副词加粗（错误示例：**显著提升**、**快速增长**）",
    "- 禁止对句子、短语加粗（错误示例：**这是一个重要的发现**）",
    "- 禁止对普通名词加粗（错误示例：**公司**、**技术**、**用户**）",
    "- 正常叙述直接书写，不需要任何格式标记",
    "",
    "**严重禁止（违反将导致输出无效）**：",
    "- 禁止在每个字符之间插入星号（如 *P*i*n*t*e*r*e*s*t* 是错误的）",
    "- 禁止对单个字符应用格式标记",
    "- 正常文本示例：Pinterest高管变动背后的AI战略",
    "- 错误文本示例：*P*i*n*t*e*r*e*s*t*高*管*变*动*",
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
    "### 技术元素",
    "- 代码块：必须标注语言（如 ```python）",
    "- 表格：数据对比 ≥4 项时必须使用",
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
    "- 禁用套话（如详情请参考、更多信息等）"
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

export const getTitleSystemPrompt = (): string => {
  return `你是科技新闻标题编辑，撰写微信公众号标题。

**要求**：
- 字数：≤20 汉字（≤64 字节）
- 风格：有爆点，能引发点击欲
- 包含核心关键词`;
};

export const getTitleUserPrompt = ({
  content,
  language = "中文",
}: SummarizerPromptParams): string => {
  return `为以下内容生成${language}新闻标题（≤20 汉字），只返回标题：

${content}`;
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
7. **字数控制**：正文字数控制在 1000-1500 字之间，确保内容充实且不冗余。
8. **输出格式**：直接输出 JSON。

## 提取与翻译规则
- **格式清洗**：彻底清洗掉原文中的所有 HTML 标签（如 <pre>、<code> 等）。对于原本由 <pre>、<div>、<span> 包裹的内容，必须转换为标准的 Markdown 格式内容。
- **内容保留**：尽可能保留原文的详细说明，特别是技术原理、核心功能、安装步骤、代码示例。
- **内容跳过**：跳过「外部文档链接」、「贡献者名单」、「赞助商」、「许可证详情」。
- **翻译质量**：使用专业的技术术语翻译，保持语气客观。
- **禁止转义**：正文输出必须为原生 Markdown，禁止输出任何转义字符（如 \\n、\\t、\\\" 等），不得用字符串转义来表示换行。

## 输出格式 (JSON)
\`\`\`json
{ "mainContent": "翻译后的中文正文", "imageUrls": ["提取出的重要图片 URL"] }
\`\`\``;
};

export const getGithubExtractionUserPrompt = (content: string): string => {
  return `请对以下 GitHub README 进行清理和翻译提取：

${content.substring(0, 12000)}

**严格要求（红线）**：
1. **翻译为中文**：正文必须全部翻译为中文。
2. **清洗 HTML**：彻底删除所有 HTML 标签，将 <pre> 内容转换为 Markdown 代码块。
3. **删除文档链接**：彻底删除所有指向 docs.xxx.ai 等外部文档的链接列表和跳转。
4. **删除贡献者**：彻底删除所有贡献者名单、头像图片、作者列表。
5. **删除图标**：删除所有徽章、小图标、Icon。
6. **保留安装部署**：必须保留完整的安装说明和部署步骤。
7. **直接输出 JSON**。`;
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
- 吸引读者（悬念、数据、趋势）
- 概括主题，突出 AI 动态
- 自然引导阅读
- 150-250 字，专业但亲和
- 无标题/列表，纯段落文本`;
};

export const getIntroductionUserPrompt = ({
  articleTitles,
  articleCount,
  contentMode = "TECH_NEWS",
}: IntroductionPromptParams): string => {
  const titlesText = articleTitles.map((t, i) => `${i + 1}. ${t}`).join("\n");
  
  if (contentMode === "GITHUB_TRENDING") {
    return `为 ${articleCount} 个 GitHub 热门项目生成引入（≤100字）：

${titlesText}

**要求**：每个项目一句话（15-25字），项目名用 \`\` 包裹，不用列表符号。

直接输出文本。`;
  }
  
  return `为 ${articleCount} 篇 AI 科技新闻生成引入（≤100字）：

${titlesText}

直接输出文本。`;
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
${JSON_OUTPUT_NOTE}
\`\`\`json
{
    "links": [
        { "title": "文章标题", "url": "链接" }
    ]
}
\`\`\``;
};

export const getLinkExtractionUserPrompt = (content: string, baseUrl: string): string => {
  return `从 ${baseUrl} 的 Markdown 中提取新闻链接：

${content.substring(0, 10000)}

请直接输出 JSON result。`;
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

## 特殊要求
- **图片链接**：必须原样保留所有图片 URL 和 Markdown 格式
- **链接引用**：保留原文中的所有超链接
- **代码块**：如有代码示例，保持格式不变
- **禁止输出结语**：文章末尾的结语/致谢/互动引导由系统自动生成，请**不要**在润色结果中包含任何结语、总结段落或求关注的话术。如果原文包含此类内容，请直接删除。

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

