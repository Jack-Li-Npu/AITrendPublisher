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

// 为 Deno 环境提供 MathJax 模拟（MDKatex 扩展需要）
// 
// md 项目中的 LaTeX 渲染机制：
// 1. 浏览器环境：通过 <script> 标签加载 MathJax 库
// 2. katex.ts 扩展调用 window.MathJax.tex2svg() 将 LaTeX 转换为 SVG
// 3. Deno 环境：我们提供一个模拟实现，LaTeX 公式将显示为格式化文本
//
// 注意：这是一个简化实现，不进行真正的数学公式渲染
// 对于微信公众号，LaTeX 公式通常以纯文本形式显示已足够
if (typeof window !== "undefined" && !window.MathJax) {
  // @ts-ignore - 提供 MathJax 模拟实现
  window.MathJax = {
    // 重置 MathJax 状态（空实现）
    texReset: () => {
      // MathJax 会维护内部状态，这里不需要实现
    },
    // 将 LaTeX 文本转换为 SVG
    // 原始实现：返回包含 SVG DOM 节点的容器对象
    tex2svg: (text: string, options: { display?: boolean }) => {
      // 转义 HTML 特殊字符
      const escapedText = text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
      
      // 创建一个格式化的 SVG，显示原始 LaTeX 文本
      // 注意：这不是真正的数学公式渲染，只是格式化显示
      const displayMode = options?.display ?? false;
      const svgHtml = displayMode
        ? `<svg xmlns="http://www.w3.org/2000/svg" width="100%" style="display: block; margin: 1em 0;">
            <text x="0" y="20" font-family="monospace" font-size="14px" fill="currentColor">
              ${escapedText}
            </text>
          </svg>`
        : `<svg xmlns="http://www.w3.org/2000/svg" width="auto" height="auto" style="display: inline-block; vertical-align: middle;">
            <text x="0" y="15" font-family="monospace" font-size="14px" fill="currentColor">
              ${escapedText}
            </text>
          </svg>`;
      
      // 模拟 MathJax 返回的容器对象结构
      // katex.ts 中的代码会访问：
      // - container.firstChild (svg 元素)
      // - svg.style
      // - svg.getAttribute('width')
      // - svg.removeAttribute('width')
      // - svg.outerHTML
      
      const styleObj: any = {
        display: displayMode ? "initial" : "inline-block",
        "min-width": displayMode ? "100%" : "auto",
        width: displayMode ? "100%" : "auto",
        setProperty: function(key: string, value: string, priority?: string) {
          this[key] = value;
        },
      };
      
      // 创建 svg 对象（firstChild），模拟真实的 DOM 元素
      const svgObj: any = {
        outerHTML: svgHtml,
        style: styleObj,
        getAttribute: function(attr: string) {
          // 返回属性值，如果不存在返回 null
          if (attr === "width") {
            return displayMode ? "100%" : "auto";
          }
          // 从 outerHTML 中提取属性值（简化实现）
          const match = svgHtml.match(new RegExp(`${attr}=["']([^"']+)["']`));
          return match ? match[1] : null;
        },
        removeAttribute: function(attr: string) {
          // 空实现，只是为了避免报错
          // 在实际的 DOM 中，这会移除属性，但我们的模拟对象不需要真正移除
        },
      };
      
      return {
        firstChild: svgObj,
      };
    },
  };
}

// 使用相对路径导入 md 项目的模块（从当前文件位置计算）
// 当前文件: src/modules/render/weixin/doocs-md.renderer.ts
// 目标文件: md/packages/core/src/renderer/renderer-impl.ts
// 相对路径: ../../../../md/packages/core/src/renderer/renderer-impl.ts
const { initRenderer } = await import("../../../../md/packages/core/src/renderer/renderer-impl.ts");

// marked 需要从 npm 包直接导入
import { marked } from "marked";
// juice 用于将 CSS 内联到 HTML 元素中（微信公众号只支持内联样式）
import juice from "juice";

// 导入主题 CSS 文件（使用相对路径）
const projectRoot = new URL("../../../../", import.meta.url).pathname;
const DEFAULT_THEME_CSS = await Deno.readTextFile(
  `${projectRoot}md/packages/shared/src/configs/theme-css/default.css`,
);
const BASE_THEME_CSS = await Deno.readTextFile(
  `${projectRoot}md/packages/shared/src/configs/theme-css/base.css`,
);

/**
 * DoocsMd 渲染器配置
 */
export interface DoocsMdRendererOptions {
  /** 主题名称：default（经典）、grace（优雅）、simple（简约） */
  theme?: "default" | "grace" | "simple";
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
   * 生成文章图片的 Markdown
   * 将 media 数组中的图片转换为 Markdown 图片语法
   */
  private generateImagesMarkdown(media: WeixinTemplate["media"]): string {
    if (!media || media.length === 0) {
      return "";
    }

    let imagesMarkdown = "";
    
    // 最多显示 3 张图片
    const imagesToShow = media.slice(0, 3);
    
    imagesToShow.forEach((m, i) => {
      if (m.url) {
        // 使用 Markdown 图片语法
        imagesMarkdown += `![配图${i + 1}](${m.url})\n\n`;
      }
    });

    return imagesMarkdown;
  }

  /**
   * 将文章数组转换为 Markdown 格式
   * 如果 LLM 已经输出 Markdown 格式，则直接使用
   * 否则进行格式转换
   * 同时将 media 数组中的图片嵌入到内容中
   */
  private articlesToMarkdown(
    articles: WeixinTemplate[],
    options?: {
      introduction?: string;
      overviewImageUrl?: string;
    }
  ): string {
    let markdown = "";

    // 在文章开头插入引入内容和整体介绍图
    if (options?.introduction || options?.overviewImageUrl) {
      // 先插入引入内容
      if (options.introduction) {
        markdown += `${options.introduction}\n\n`;
        console.log(`[DoocsMdRenderer] 在开头插入引入内容，长度: ${options.introduction.length} 字符`);
      }
      
      // 再插入整体介绍图
      if (options.overviewImageUrl) {
        markdown += `![文章概览](${options.overviewImageUrl})\n\n`;
        console.log(`[DoocsMdRenderer] 在开头插入整体介绍图`);
      }
      
      // 添加分隔线
      markdown += `---\n\n`;
    }

    articles.forEach((article, index) => {
      const content = article.content || "";
      const media = article.media;

      // 检测内容中是否已经包含图片（Markdown 格式 或 HTML 格式）
      const hasImagesInContent = /!\[.*?\]\(.*?\)|<img.*?>/i.test(content);
      
      // 检测内容是否已经是 Markdown 格式
      if (this.isMarkdownContent(content)) {
        // LLM 已经输出 Markdown 格式，直接使用
        console.log(`[DoocsMdRenderer] 文章 ${index + 1} 已是 Markdown 格式，直接使用 (正文已有图片: ${hasImagesInContent})`);
        
        // 添加文章序号和标题
        markdown += `## ${String(index + 1).padStart(2, "0")}. ${article.title}\n\n`;
        
        // 在标题后插入第一张图片（仅当内容中完全没有图片且 media 中有图片时）
        if (media && media.length > 0 && !hasImagesInContent) {
          markdown += `![${article.title}](${media[0].url})\n\n`;
          console.log(`[DoocsMdRenderer] 文章 ${index + 1} 插入首图: ${media[0].url.substring(0, 50)}...`);
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
        
        // 先添加正文内容
        markdown += cleanedMainContent + "\n\n";

        // 在正文内容后插入剩余图片（仅当内容中完全没有图片且 media 中有剩余图片，且不在结语部分）
        if (media && media.length > 1 && !hasImagesInContent && !footerContent) {
          const remainingImages = media.slice(1, 3);
          remainingImages.forEach((m, i) => {
            markdown += `![配图${i + 2}](${m.url})\n\n`;
          });
          console.log(`[DoocsMdRenderer] 文章 ${index + 1} 插入 ${remainingImages.length} 张额外图片`);
        }
        
        // 添加来源（放在结语之前）
        // SINGLE_URL 模式不添加项目地址链接
        if (article.url && options?.contentMode !== "SINGLE_URL") {
          markdown += `> 🔗 **项目地址**：[${article.url}](${article.url})\n\n`;
        }
        
        // 最后添加结语部分
        if (footerContent) {
          markdown += footerContent + "\n\n";
        }
      } else {
        // 旧格式（HTML 标签），进行转换
        console.log(`[DoocsMdRenderer] 文章 ${index + 1} 是旧格式，进行转换 (正文已有图片: ${hasImagesInContent})`);
        
        // 添加文章序号和标题
        markdown += `## ${String(index + 1).padStart(2, "0")}. ${article.title}\n\n`;

        // 在标题后插入第一张图片（仅当内容中没有图片时）
        if (media && media.length > 0 && !hasImagesInContent) {
          markdown += `![${article.title}](${media[0].url})\n\n`;
          console.log(`[DoocsMdRenderer] 文章 ${index + 1} 插入首图: ${media[0].url.substring(0, 50)}...`);
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
        paragraphs.forEach((para, paraIndex) => {
          let cleanPara = para
            .trim()
            .replace(/<strong>([^<]+)<\/strong>/gi, "**$1**")
            .replace(/<em>([^<]+)<\/em>/gi, "*$1*")
            .replace(/<code>([^<]+)<\/code>/gi, "`$1`")
            .replace(/blockquote>([^<]+)<\/blockquote>/gi, "> $1")
            .replace(/<(?!\/?(a|img)\b)[^>]*>/gi, "");

          if (cleanPara.length > 0) {
            markdown += `${cleanPara}\n\n`;
            
            // 在第二段后插入第二张图片（仅当正文没有图片时）
            if (paraIndex === 1 && media && media.length > 1 && !hasImagesInContent && !footerContent) {
              markdown += `![配图2](${media[1].url})\n\n`;
            }
          }
        });

        // 在正文内容末尾插入第三张图片（仅当正文没有图片时）
        if (media && media.length > 2 && !hasImagesInContent && !footerContent) {
          markdown += `![配图3](${media[2].url})\n\n`;
        }
        
        // SINGLE_URL 模式不添加项目地址链接
        if (article.url && options?.contentMode !== "SINGLE_URL") {
          markdown += `> 🔗 **项目地址**：[${article.url}](${article.url})\n\n`;
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
              .replace(/<(?!\/?(a|img)\b)[^>]*>/gi, "");
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
    let themeCSS = "";

    // 根据选择的主题加载对应的 CSS 文件
    if (this.options.theme !== "default") {
      try {
        const projectRoot = new URL("../../../../", import.meta.url).pathname;
        const themePath = `${projectRoot}md/packages/shared/src/configs/theme-css/${this.options.theme}.css`;
        themeCSS = await Deno.readTextFile(themePath);
      } catch (error) {
        console.warn(
          `无法加载主题 ${this.options.theme}，回退到默认主题`,
          error,
        );
        themeCSS = DEFAULT_THEME_CSS;
      }
    } else {
      themeCSS = DEFAULT_THEME_CSS;
    }

    return themeCSS;
  }

  /**
   * 将 CSS 变量替换为实际值（微信不支持 CSS 变量）
   */
  private processCSSVariables(css: string): string {
    // 替换主题色变量
    let processed = css.replace(
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
   * @param options 可选参数：引入内容、整体介绍图和内容模式
   */
  async render(
    articles: WeixinTemplate[],
    options?: {
      introduction?: string;
      overviewImageUrl?: string;
      contentMode?: string; // 新增：内容模式（用于控制项目地址链接等）
    }
  ): Promise<string> {
    console.log(`[DoocsMdRenderer] 开始渲染 ${articles.length} 篇文章`);

    // 1. 转换为 Markdown（包含引入内容和整体介绍图）
    const markdown = this.articlesToMarkdown(articles, options);
    console.log(`[DoocsMdRenderer] 生成 Markdown，长度：${markdown.length} 字符`);

    // 2. 初始化渲染器
    const renderer = initRenderer({
      citeStatus: this.options.showCitation,
      isShowLineNumber: this.options.showLineNumber,
      countStatus: this.options.showWordCount,
      legend: "", // 图片描述模式
    });

    // 3. 配置 marked 选项（确保正确解析粗体等格式）
    marked.setOptions({
      gfm: true, // GitHub Flavored Markdown
      breaks: false, // 不将单个换行符转换为 <br>
      pedantic: false, // 不使用原始 Markdown.pl 行为
      silent: false, // 不在解析错误时抛出异常
      mangle: false, // 不混淆邮箱地址
    });

    // 4. 解析 front-matter 并渲染
    const { markdownContent } = renderer.parseFrontMatterAndContent(markdown);

    // 5. 预处理 Markdown：确保 ** 符号正确（移除可能的转义）
    // 将转义的 \*\* 还原为 **
    const cleanedMarkdown = markdownContent.replace(/\\\*\*/g, '**');

    // 6. 使用 @doocs/md 内置的 marked 渲染 Markdown 为 HTML
    const htmlBody = marked.parse(cleanedMarkdown) as string;

    // 5. 添加脚注（如果有）
    const footnotes = renderer.buildFootnotes();

    // 6. 创建容器
    const container = renderer.createContainer(htmlBody + footnotes);

    // 7. 加载并处理主题 CSS
    const themeCSS = await this.loadThemeCSS();
    
    // 添加代码块样式规则（确保代码块应用深色主题）
    const codeBlockCSS = `
      /* 代码块深色主题样式 */
      pre.code__pre,
      .hljs.code__pre {
        background-color: ${this.options.codeBackgroundColor} !important;
        color: ${this.options.codeTextColor} !important;
      }
      pre.code__pre > code,
      .hljs.code__pre > code {
        background-color: transparent !important;
        color: ${this.options.codeTextColor} !important;
      }
    `;
    
    const processedCSS = this.processCSSVariables(
      BASE_THEME_CSS + "\n" + themeCSS + "\n" + codeBlockCSS,
    );

    // 8. 将样式和内容组合（使用 juice 内联 CSS）
    console.log(`[DoocsMdRenderer] 使用 juice 内联 CSS 样式...`);
    let renderedHtml = this.inlineStyles(container, processedCSS);

    console.log(`[DoocsMdRenderer] 渲染完成，HTML 长度：${renderedHtml.length}`);
    console.log(`[DoocsMdRenderer] ✅ CSS 已内联到 HTML 元素中（微信兼容）`);

    // 9. 处理图片：上传到微信服务器（动态导入以避免启动时加载依赖）
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
      console.warn(`[DoocsMdRenderer] 图片处理失败，返回原始 HTML:`, error.message);
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
      overviewImageUrl?: string;
    }
  ): Promise<string> {
    const renderer = new DoocsMdRenderer();
    return await renderer.render(articles, options);
  }
}

