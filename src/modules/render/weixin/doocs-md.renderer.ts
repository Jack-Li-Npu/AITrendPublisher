/**
 * DoocsMd 渲染器 - 直接使用 @doocs/md 核心渲染引擎
 * 
 * 优势：
 * - 无需启动浏览器，渲染速度快（<100ms）
 * - 完全复用 @doocs/md 的美观样式和微信兼容性
 * - 支持所有主题（default、grace、simple）
 * - 自动处理 Markdown 扩展（数学公式、图表等）
 */

import { WeixinTemplate } from "@src/modules/render/weixin/interfaces/article.type.ts";
// 动态导入图片处理模块（避免启动时加载 imagescript）
// import { WeixinImageProcessor } from "@src/utils/image/image-processor.ts";
// import { WeixinPublisher } from "@src/modules/publishers/weixin.publisher.ts";

// 为 Deno 环境提供 window 对象模拟（juice 和 marked 可能需要）
if (typeof window === "undefined" && typeof globalThis !== "undefined") {
  // @ts-ignore - 为 Deno 环境添加 window 对象
  globalThis.window = globalThis;
}

// 为 Deno 环境提供 MathJax 模拟（由真正的 MathJax 驱动）
// 我们使用 mathjax-full 实现后端渲染为 SVG
if (typeof window !== "undefined" && !window.MathJax) {
  // 动态导入 MathJax 组件
  const { TeX } = await import("npm:mathjax-full/js/input/tex.js");
  const { SVG } = await import("npm:mathjax-full/js/output/svg.js");
  const { liteAdaptor } = await import("npm:mathjax-full/js/adaptors/liteAdaptor.js");
  const { RegisterHTMLHandler } = await import("npm:mathjax-full/js/handlers/html.js");
  const { mathjax } = await import("npm:mathjax-full/js/mathjax.js");
  const { AllPackages } = await import("npm:mathjax-full/js/input/tex/AllPackages.js");

  const adaptor = liteAdaptor();
  RegisterHTMLHandler(adaptor);

  const tex = new TeX({ packages: AllPackages });
  const svg = new SVG({ fontCache: 'none' });
  const html = mathjax.document('', { InputJax: tex, OutputJax: svg });

  // @ts-ignore
  window.MathJax = {
    texReset: () => {},
    tex2svg: (text: string, options: { display?: boolean }) => {
      const node = html.convert(text, {
        display: options?.display ?? false,
        em: 16,
        ex: 8,
        containerWidth: 80 * 16
      });
      // 获取 SVG 元素
      const svgNode = adaptor.firstChild(node);
      // 为 SVG 添加基础样式以便内联
      adaptor.setStyle(svgNode, "vertical-align", "middle");
      if (options?.display) {
        adaptor.setStyle(svgNode, "display", "block");
        adaptor.setStyle(svgNode, "margin", "1em auto");
      }
      
      return {
        firstChild: {
          outerHTML: adaptor.outerHTML(svgNode),
          style: {
            setProperty: (k: string, v: string) => adaptor.setStyle(svgNode, k, v)
          },
          getAttribute: (a: string) => adaptor.getAttribute(svgNode, a),
          removeAttribute: (a: string) => adaptor.removeAttribute(svgNode, a)
        }
      };
    }
  };
}

// 使用本地提取的 Doocs 渲染逻辑
const { initRenderer } = await import("../doocs/core/index.ts");

// marked 需要从 npm 包直接导入
import { marked } from "npm:marked";
// juice 用于将 CSS 内联到 HTML 元素中（微信公众号只支持内联样式）
import juice from "npm:juice";

// 导入主题加载逻辑
import { getThemeCSS } from "../doocs/shared/index.ts";

const DEFAULT_THEME_CSS = await Deno.readTextFile(
  new URL("../doocs/shared/configs/theme-css/default.css", import.meta.url).pathname
);

/**
 * DoocsMd 渲染器配置
 */
export interface DoocsMdRendererOptions {
  /** 主题名称：default（经典）、grace（优雅）、simple（简约）、elegant（细腻） */
  theme?: "default" | "grace" | "simple" | "elegant";
  /** 主题色（默认：#3f9cf5） */
  primaryColor?: string;
  /** 字体大小（默认：16px） */
  fontSize?: number;
  /** 代码块背景色（默认：#282c34，深色主题） */
  codeBackgroundColor?: string;
  /** 代码块文字颜色（默认：#abb2bf，浅灰色） */
  codeTextColor?: string;
  /** 行内代码背景色（默认：rgba(27, 31, 35, 0.05)） */
  inlineCodeBackgroundColor?: string;
  /** 行内代码文字颜色（默认：#d14） */
  inlineCodeTextColor?: string;
  /** 是否显示行号 */
  showLineNumber?: boolean;
  /** 是否显示引用链接 */
  showCitation?: boolean;
  /** 是否显示字数统计 */
  showWordCount?: boolean;
}

/**
 * DoocsMd 渲染器
 */
export class DoocsMdRenderer {
  private options: Required<DoocsMdRendererOptions>;

  constructor(options: DoocsMdRendererOptions = {}) {
    this.options = {
      theme: options.theme || "default",
      primaryColor: options.primaryColor || "#3f9cf5",
      fontSize: options.fontSize || 16,
      codeBackgroundColor: options.codeBackgroundColor || "#282c34", // 深色代码块背景（VS Code Dark 风格）
      codeTextColor: options.codeTextColor || "#abb2bf", // 浅灰色代码文字
      inlineCodeBackgroundColor: options.inlineCodeBackgroundColor || "rgba(27, 31, 35, 0.05)",
      inlineCodeTextColor: options.inlineCodeTextColor || "#d14",
      showLineNumber: options.showLineNumber ?? false,
      showCitation: options.showCitation ?? true,
      showWordCount: options.showWordCount ?? false,
    };
  }

  /**
   * 检测内容是否已经是 Markdown 格式
   * 通过检测常见的 Markdown 语法标记
   */
  private isMarkdownContent(content: string): boolean {
    // 检测常见的 Markdown 语法
    const markdownPatterns = [
      /^#{1,6}\s+/m,           // 标题 # ## ###
      /\*\*[^*]+\*\*/,         // 粗体 **text**
      /^>\s+/m,                // 引用 >
      /^-\s+/m,                // 无序列表 -
      /^\d+\.\s+/m,            // 有序列表 1.
      /^---$/m,                // 分割线
      /\[.+\]\(.+\)/,          // 链接 [text](url)
      /```[\s\S]*```/,         // 代码块
    ];

    // 如果匹配到 3 个或以上的 Markdown 模式，认为是 Markdown 格式
    let matchCount = 0;
    for (const pattern of markdownPatterns) {
      if (pattern.test(content)) {
        matchCount++;
        if (matchCount >= 2) return true;
      }
    }
    return false;
  }

  /**
   * 将文章数组转换为 Markdown 格式
   * 如果 LLM 已经输出 Markdown 格式，则直接使用
   * 否则进行格式转换
   * 注意：不再额外插入 media 数组中的图片，图片应由 LLM 提取时直接保留在正文中
   */
  private articlesToMarkdown(
    articles: WeixinTemplate[],
    options?: {
      introduction?: string;
      contentMode?: "TECH_NEWS" | "GITHUB_TRENDING" | "SINGLE_URL" | "TOPIC_SEARCH" | "AI_NEWS_SITE";
      footer?: string;
    }
  ): string {
    let markdown = "";

    // 在文章开头插入引入内容
    if (options?.introduction) {
      if (options.introduction) {
        markdown += `${options.introduction}\n\n`;
        console.log(`[DoocsMdRenderer] 在开头插入引入内容，长度: ${options.introduction.length} 字符`);
      }

      // 添加分隔线
      markdown += `---\n\n`;
    }

    articles.forEach((article, index) => {
      const content = article.content || "";
      
      // 检测内容是否已经是 Markdown 格式
      if (this.isMarkdownContent(content)) {
        // LLM 已经输出 Markdown 格式，直接使用
        console.log(`[DoocsMdRenderer] 文章 ${index + 1} 已是 Markdown 格式，直接使用`);
        
        // 仅在多篇文章模式下添加序号标题
        if (articles.length > 1) {
          markdown += `## ${String(index + 1).padStart(2, "0")}. ${article.title}\n\n`;
        }
        
        // 检测结语部分（以 ## 结语 开头）
        const footerMatch = content.match(/^([\s\S]*?)(\n## 结语[\s\S]*)$/);
        let mainContent = content;
        let footerContent = "";
        
        if (footerMatch) {
          mainContent = footerMatch[1];
          footerContent = footerMatch[2];
        }
        
        // 确保内容中的 ** 符号正确（移除可能的转义）
        const cleanedMainContent = mainContent.replace(/\\\*\*/g, '**');
        
        // 添加正文内容
        markdown += cleanedMainContent + "\n\n";
        
        // 添加来源链接（SINGLE_URL 模式不添加）
        if (article.url && options?.contentMode !== "SINGLE_URL") {
          const linkLabel = (options?.contentMode === "GITHUB_TRENDING") ? "项目地址" : "文章链接";
          markdown += `> 🔗 **${linkLabel}**：[${article.url}](${article.url})\n\n`;
        }
        
        // 最后添加结语部分
        if (footerContent) {
          markdown += footerContent + "\n\n";
        }
      } else {
        // 旧格式（HTML 标签），进行转换
        console.log(`[DoocsMdRenderer] 文章 ${index + 1} 是旧格式，进行转换`);
        
        // 仅在多篇文章模式下添加序号标题
        if (articles.length > 1) {
          markdown += `## ${String(index + 1).padStart(2, "0")}. ${article.title}\n\n`;
        }

        // 检测结语部分
        const footerMarker = "## 结语";
        const footerIndex = content.indexOf(footerMarker);
        let mainContent = content;
        let footerContent = "";
        
        if (footerIndex !== -1) {
          const beforeFooter = content.substring(0, footerIndex);
          const afterFooter = content.substring(footerIndex);
          const paragraphMarker = "<next_paragraph />";
          if (beforeFooter.endsWith(paragraphMarker)) {
            mainContent = beforeFooter.substring(0, beforeFooter.length - paragraphMarker.length);
            footerContent = afterFooter;
          } else {
            mainContent = beforeFooter;
            footerContent = afterFooter;
          }
        }
        
        // 处理正文部分
        const paragraphs = mainContent.split("<next_paragraph />");
        paragraphs.forEach((para) => {
          let cleanPara = para
            .trim()
            .replace(/<strong>([^<]+)<\/strong>/gi, "**$1**")
            .replace(/<em>([^<]+)<\/em>/gi, "*$1*")
            .replace(/<code>([^<]+)<\/code>/gi, "`$1`")
            .replace(/blockquote>([^<]+)<\/blockquote>/gi, "> $1")
            .replace(/<(?!\/?(a|img|div|span|p|br)\b)[^>]*>/gi, "");

          if (cleanPara.length > 0) {
            markdown += `${cleanPara}\n\n`;
          }
        });
        
        // 添加来源链接（SINGLE_URL 模式不添加）
        if (article.url && options?.contentMode !== "SINGLE_URL") {
          const linkLabel = (options?.contentMode === "GITHUB_TRENDING") ? "项目地址" : "文章链接";
          markdown += `> 🔗 **${linkLabel}**：[${article.url}](${article.url})\n\n`;
        }
        
        if (footerContent) {
          const footerParagraphs = footerContent.split("<next_paragraph />");
          footerParagraphs.forEach((para) => {
            let cleanPara = para
              .trim()
              .replace(/<strong>([^<]+)<\/strong>/gi, "**$1**")
              .replace(/<em>([^<]+)<\/em>/gi, "*$1*")
              .replace(/<code>([^<]+)<\/code>/gi, "`$1`")
              .replace(/blockquote>([^<]+)<\/blockquote>/gi, "> $1")
              .replace(/<(?!\/?(a|img|div|span|p|br)\b)[^>]*>/gi, "");
            cleanPara = cleanPara.replace(/\\\*\*/g, '**');
            if (cleanPara.length > 0) {
              markdown += `${cleanPara}\n\n`;
            }
          });
        }
      }

      // 文章之间添加分隔线
      if (index < articles.length - 1) {
        markdown += `---\n\n`;
      }
    });

    // 添加结语（如果有）
    // 注意：仅当文章内容中没有检测到结语时才添加 options.footer
    // 避免重复添加结语
    const hasFooterInContent = markdown.includes("\n## 结语");
    if (options?.footer && !hasFooterInContent) {
      markdown += `\n---\n\n${options.footer}\n\n`;
      console.log(`[DoocsMdRenderer] 在末尾添加结语，长度: ${options.footer.length} 字符`);
    } else if (hasFooterInContent) {
      console.log(`[DoocsMdRenderer] 文章内容中已有结语，跳过 footer 参数`);
    }

    // 最后统一修复标题层级：确保除了文章主标题（带编号的 ##）和结语标题（## 结语）外，
    // 所有其他内容中的 ## 都被转换为 ###，以保持正确的层级结构
    // 使用正则表达式匹配行首的 ##，但排除：
    // 1. 带编号的文章主标题（## 01. 或 ## 02. 等，格式：## XX. 标题）
    // 2. 结语标题（## 结语）
    const fixedMarkdown = markdown.replace(/^##\s+(?!\d{2}\.\s+|结语\s*$)/gm, '### ');
    console.log(`[DoocsMdRenderer] 标题层级修复完成，已将所有内容中的 ## 转换为 ###（保留文章主标题和结语标题）`);

    return fixedMarkdown;
  }

  /**
   * 加载主题 CSS
   */
  private async loadThemeCSS(): Promise<string> {
    if (this.options.theme === "default") {
      return DEFAULT_THEME_CSS;
    }
    
    try {
      return await getThemeCSS(this.options.theme as any);
    } catch (error) {
      console.warn(
        `无法加载主题 ${this.options.theme}，回退到默认主题`,
        error,
      );
      return DEFAULT_THEME_CSS;
    }
  }

  /**
   * 将 CSS 变量替换为实际值（微信不支持 CSS 变量）
   */
  private processCSSVariables(css: string): string {
    let processed = css;

    // 替换主题色变量
    processed = processed.replace(
      /var\(--md-primary-color\)/g,
      this.options.primaryColor,
    );

    // 替换字体大小变量
    processed = processed.replace(
      /var\(--md-font-size\)/g,
      `${this.options.fontSize}px`,
    );

    // 替换代码块背景色（如果 CSS 中有定义）
    processed = processed.replace(
      /var\(--code-background\)/g,
      this.options.codeBackgroundColor,
    );

    // 替换代码块文字颜色（如果 CSS 中有定义）
    if (this.options.codeTextColor) {
      processed = processed.replace(
        /var\(--code-text-color\)/g,
        this.options.codeTextColor,
      );
    }

    // 替换行内代码背景色
    processed = processed.replace(
      /rgba\(27,\s*31,\s*35,\s*0\.05\)/g,
      this.options.inlineCodeBackgroundColor,
    );

    // 替换行内代码文字颜色
    processed = processed.replace(
      /#d14/g,
      this.options.inlineCodeTextColor,
    );

    // 替换其他常用变量
    const variables: Record<string, string> = {
      "--foreground": "0 0% 20%", // 深灰色文字
      "--blockquote-background": "#f8f8f8", // 引用块背景
    };

    Object.entries(variables).forEach(([varName, value]) => {
      const regex = new RegExp(`var\\(${varName}\\)`, "g");
      processed = processed.replace(regex, value);
    });

    // 处理 hsl() 颜色函数
    processed = processed.replace(
      /hsl\((\d+)\s+(\d+)%\s+(\d+)%\)/g,
      (_, h, s, l) => {
        // 简单转换 hsl 到近似 rgb
        return `hsl(${h}, ${s}%, ${l}%)`;
      },
    );

    return processed;
  }

  /**
   * 将 CSS 内联到 HTML 标签中
   * 微信公众号只支持内联样式，不支持 <style> 标签
   * 使用 juice 库将 CSS 规则内联到每个 HTML 元素的 style 属性中
   */
  private inlineStyles(html: string, css: string): string {
    // 构建完整的 HTML 文档供 juice 处理
    const fullHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>${css}</style>
      </head>
      <body>${html}</body>
      </html>
    `;

    // 使用 juice 将 CSS 内联到 HTML 元素中
    const inlinedHtml = juice(fullHtml, {
      // 保留 !important 声明
      preserveImportant: true,
      // 移除 <style> 标签（微信不支持）
      removeStyleTags: true,
      // 保留媒体查询（虽然微信可能不支持，但保留以防万一）
      preserveMediaQueries: false,
      // 保留字体相关样式
      preserveFontFaces: false,
      // 应用宽度属性
      applyWidthAttributes: true,
      // 应用高度属性
      applyHeightAttributes: true,
      // 应用表格属性
      applyAttributesTableElements: true,
    });

    // 从完整 HTML 中提取 body 内容
    const bodyMatch = inlinedHtml.match(/<body[^>]*>([\s\S]*)<\/body>/i);
    if (bodyMatch && bodyMatch[1]) {
      return bodyMatch[1].trim();
    }

    // 如果提取失败，返回原始内联结果
    return inlinedHtml;
  }

  /**
   * 渲染文章数组为微信公众号 HTML
   * @param articles 文章列表
   * @param options 可选参数：引入内容、内容模式、结语
   */
  async render(
    articles: WeixinTemplate[],
    options?: {
      introduction?: string;
      contentMode?: "TECH_NEWS" | "GITHUB_TRENDING" | "SINGLE_URL" | "TOPIC_SEARCH" | "AI_NEWS_SITE";
      skipImageProcessing?: boolean;
      footer?: string;
    }
  ): Promise<string> {
    console.log(`[DoocsMdRenderer] 开始渲染 ${articles.length} 篇文章`);

    // 1. 转换为 Markdown（包含引入内容）
    const markdown = this.articlesToMarkdown(articles, options);
    console.log(`[DoocsMdRenderer] 生成 Markdown，长度：${markdown.length} 字符`);

    // 2. 初始化渲染器
    const renderer = initRenderer({
      citeStatus: this.options.showCitation,
      isShowLineNumber: this.options.showLineNumber,
      countStatus: this.options.showWordCount,
      legend: "", // 图片描述模式
    });

    // 3. 配置 marked 选项
    marked.setOptions({
      gfm: true,
      breaks: false,
      pedantic: false,
      silent: false,
    });

    // 4. 解析 front-matter 并渲染
    const { markdownContent } = renderer.parseFrontMatterAndContent(markdown);

    // 5. 渲染 Markdown (核心库会自动调用 window.MathJax 处理公式)
    const cleanedMarkdown = markdownContent.replace(/\\\*\*/g, '**');
    let htmlBody = marked.parse(cleanedMarkdown) as string;

    const footnotes = renderer.buildFootnotes();
    const container = renderer.createContainer(htmlBody + footnotes);

    // 5. 加载 CSS 
    // 始终加载默认主题作为基础
    const defaultCSS = DEFAULT_THEME_CSS;
    // 如果选择了其他主题，则加载并追加
    let themeCSS = "";
    if (this.options.theme !== "default") {
      themeCSS = await this.loadThemeCSS();
    }
    
    // 代码块样式
    const codeBlockCSS = `
      pre.code__pre, .hljs.code__pre {
        background-color: ${this.options.codeBackgroundColor} !important;
        color: ${this.options.codeTextColor} !important;
      }
      pre.code__pre > code, .hljs.code__pre > code {
        background-color: transparent !important;
        color: ${this.options.codeTextColor} !important;
      }
    `;
    
    // 组合 CSS：默认基础 + 主题覆盖 + 代码块
    const combinedCSS = `
      /* KaTeX 基础样式 */
      @import url("https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css");
      .katex-block { margin: 1em 0; overflow-x: auto; text-align: center; }
      .katex { font-size: 1.1em; line-height: 1.2; }
    ` + defaultCSS + "\n" + themeCSS + "\n" + codeBlockCSS;
    const processedCSS = this.processCSSVariables(combinedCSS);

    // 6. 内联样式并返回
    console.log(`[DoocsMdRenderer] 使用 juice 内联 CSS 样式...`);
    let renderedHtml = this.inlineStyles(container, processedCSS);

    console.log(`[DoocsMdRenderer] 渲染完成，HTML 长度：${renderedHtml.length}`);
    console.log(`[DoocsMdRenderer] ✅ CSS 已内联到 HTML 元素中（微信兼容）`);

    // 9. 处理图片：上传到微信服务器（动态导入以避免启动时加载依赖）
    if (options?.skipImageProcessing) {
      console.log(`[DoocsMdRenderer] 跳过图片处理（预览模式）`);
      return renderedHtml;
    }
    try {
      console.log(`[DoocsMdRenderer] 开始处理图片...`);
      const { WeixinImageProcessor } = await import("@src/utils/image/image-processor.ts");
      const { WeixinPublisher } = await import("@src/modules/publishers/weixin.publisher.ts");
      
      const imageProcessor = new WeixinImageProcessor(new WeixinPublisher());
      const { content: processedHtml } = await imageProcessor.processContent(
        renderedHtml,
      );
      
      console.log(`[DoocsMdRenderer] 图片处理完成`);
      return processedHtml;
    } catch (error) {
      console.warn(`[DoocsMdRenderer] 图片处理失败，返回原始 HTML:`, error instanceof Error ? error.message : String(error));
      return renderedHtml;
    }
  }

  /**
   * 静态方法：快速渲染（使用默认配置）
   */
  static async quickRender(
    articles: WeixinTemplate[],
    options?: {
      introduction?: string;
      contentMode?: "TECH_NEWS" | "GITHUB_TRENDING" | "SINGLE_URL" | "TOPIC_SEARCH" | "AI_NEWS_SITE";
      skipImageProcessing?: boolean;
      footer?: string;
    }
  ): Promise<string> {
    const renderer = new DoocsMdRenderer();
    return await renderer.render(articles, options);
  }
}

