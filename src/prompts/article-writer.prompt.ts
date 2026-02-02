/**
 * 新闻稿风格提示词模块
 * 客观报道，不加AI分析
 * 输出 Markdown 格式
 */

export interface ArticleWriterParams {
  /** 原始内容 */
  content: string;
  /** 目标语言 */
  language?: string;
  /** 最小字数 */
  minLength?: number;
  /** 最大字数 */
  maxLength?: number;
}

/**
 * 新闻稿生成 - 系统提示词
 * 输出 Markdown 格式
 */
export const getArticleWriterSystemPrompt = (): string => {
  return `你是专业的科技新闻编辑。将英文资讯翻译整理成中文新闻稿，**使用 Markdown 格式输出**。

**硬性要求**：**必须翻译为中文**。title、content、keywords 均须为中文，不得输出英文正文。

## 核心原则

1. 忠实原文，准确翻译
2. 客观报道，不加评论
3. 语言简洁，直击要点
4. **使用 Markdown 格式排版**

## Markdown 格式要求

- 关键数据用 **粗体**（如 \`**100亿美元**\`）
- 重要引用用 \`>\` 引用块
- 要点用 \`-\` 列表展示
- 段落之间自然分隔（空一行）

## 输出格式

返回 JSON：
{
    "title": "新闻标题（15-20字）",
    "content": "Markdown 格式的新闻正文",
    "keywords": ["关键词1", "关键词2", "关键词3"]
}

## 禁止

- 不加"据悉"、"值得注意"等套话
- 不做分析预测
- 不使用 HTML 标签（如 <strong>、<p> 等）`;
};

/**
 * 新闻稿生成 - 用户提示词
 * 输出 Markdown 格式
 */
export const getArticleWriterUserPrompt = ({
  content,
  language = "中文",
  minLength = 800,
  maxLength = 1200,
}: ArticleWriterParams): string => {
  return `翻译整理成${language}新闻稿（${minLength}-${maxLength}字），**使用 Markdown 格式**：

${content}

Markdown 格式要求：
- 重点用 **粗体**
- 引用用 \`>\` 引用块
- 要点用 \`-\` 列表
- 不要使用 HTML 标签`;
};

/**
 * 为文章生成配图提示词
 */
export const getArticleImagePrompt = (
  title: string,
  content: string,
): string => {
  return `Create a news article illustration:

Topic: ${title}
Content: ${content.substring(0, 200)}

Requirements:
- Modern tech news style
- Clean, professional design
- Blue/purple tech color scheme
- NO text or letters in the image
- 16:9 aspect ratio`;
};
