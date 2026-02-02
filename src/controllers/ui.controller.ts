import { EnvEditor } from "@src/utils/config/env-editor.ts";
import { PreviewStore } from "@src/utils/preview-store.ts";
import { WeixinPublisher } from "@src/modules/publishers/weixin.publisher.ts";
import { Logger } from "@zilla/logger";
import { ConfigManager } from "@src/utils/config/config-manager.ts";
import { DoocsMdRenderer } from "@src/modules/render/weixin/doocs-md.renderer.ts";
import { AISummarizer } from "@src/modules/summarizer/ai.summarizer.ts";

const logger = new Logger("ui-controller");

export async function getEnvConfig() {
  const editor = new EnvEditor();
  return await editor.readConfig();
}

export async function saveEnvConfig(params: Record<string, string>) {
  const editor = new EnvEditor();
  await editor.saveConfig(params);
  return { success: true };
}

export async function getArticlePreview() {
  const store = PreviewStore.getInstance();
  const preview = store.getPreview();
  if (!preview) return null;
  return preview;
}

export async function confirmPublish() {
  const store = PreviewStore.getInstance();
  const preview = store.getPreview();

  if (!preview) {
    throw new Error("没有待发布的预览内容");
  }

  logger.info(`[UI 发布] 开始正式发布文章: ${preview.title}`);

  const publisher = new WeixinPublisher();

  // 重新渲染，确保所有图片转换为微信可用 URL
  let finalHtml = preview.html;
  if (preview.articles && preview.articles.length > 0) {
    const templateData = [...preview.articles];
    const contentMode = preview.metadata?.contentMode;
    const template = preview.template || "default";

    const doocsMdRenderer = new DoocsMdRenderer({
      theme: (template as any) || "default",
      primaryColor: "#3f9cf5",
      fontSize: 16,
      showCitation: true,
    });
    
    // ✅ 这里是关键：发布时 skipImageProcessing 必须为 false
    // 这将触发 WeixinImageProcessor 对所有图片、SVG、图表的正式处理
    logger.info(`[UI 发布] 正在执行最终渲染与图片上传 (微信 CDN)...`);
    finalHtml = await doocsMdRenderer.render(templateData, {
      introduction: preview.introduction,
      contentMode: contentMode,
      skipImageProcessing: false, // 发布前必须处理图片
      footer: preview.footer, // 传入结语
    });
  }

  // 1. 上传封面图
  let mediaId = "";
  if (preview.coverImageUrl) {
    mediaId = await publisher.uploadImage(preview.coverImageUrl);
  }

  // 2. 正式发布到微信
  const result = await publisher.publish(
    finalHtml,
    preview.title,
    preview.title,
    mediaId,
  );

  // 3. 清理预览
  store.clear();

  logger.info(`[UI 发布] 发布成功: ${preview.title}`);
  return result;
}

export async function updatePreview(params: { template?: string; customFooter?: string }) {
  const store = PreviewStore.getInstance();
  const preview = store.getPreview();

  if (!preview || !preview.articles) {
    throw new Error("没有待预览的内容，请先运行任务");
  }

  const { template, customFooter } = params;
  logger.info(`[UI 预览更新] 开始更新预览，模板: ${template || "未指定"}, 结语: ${customFooter ? "已自定义" : "保持原样"}`);

  // 1. 准备数据
  const templateData = [...preview.articles];
  const contentMode = preview.metadata?.contentMode;

  // 2. 更新结语（如果提供了新的结语）
  // 结语现在通过 footer 参数传递给渲染器，不再添加到文章内容中
  const finalFooter = customFooter || preview.footer;

  // 3. 执行渲染
  let renderedTemplate: string;
  const doocsMdRenderer = new DoocsMdRenderer({
    theme: (template as any) || "default",
    primaryColor: "#3f9cf5",
    fontSize: 16,
    showCitation: true,
  });
  renderedTemplate = await doocsMdRenderer.render(templateData, {
    introduction: preview.introduction,
    contentMode: contentMode,
    skipImageProcessing: true,
    footer: finalFooter, // 传入结语
  });

  // 4. 更新存储并返回
  const updatedPreview = {
    ...preview,
    html: renderedTemplate,
    footer: finalFooter,
    template: template || preview.template,
  };

  // 同步更新 full markdown
  // 这里我们调用 render 逻辑中相同的 articlesToMarkdown 逻辑
  // 简单起见，如果需要 full markdown 同步，可以在此处组装
  let fullMarkdown = `# ${preview.title}\n\n`;
  if (preview.introduction) fullMarkdown += `${preview.introduction}\n\n---\n\n`;
  templateData.forEach((art, idx) => {
    fullMarkdown += `## ${art.title}\n\n${art.content}\n\n`;
    if (idx < templateData.length - 1) fullMarkdown += `---\n\n`;
  });
  if (finalFooter) fullMarkdown += `\n---\n\n${finalFooter}`;
  updatedPreview.markdown = fullMarkdown;

  store.setPreview(updatedPreview);
  return updatedPreview;
}

export async function refineContent(params: {
  sectionType: "introduction" | "article" | "footer";
  sectionIndex?: number; // article 模式下的文章索引（0-based）
  userInstruction: string;
  llmProvider?: string; // 可选，格式：PROVIDER:MODEL 或 PROVIDER
}) {
  const store = PreviewStore.getInstance();
  const preview = store.getPreview();

  if (!preview || !preview.articles) {
    throw new Error("没有待打磨的内容，请先运行任务生成预览");
  }

  const { sectionType, sectionIndex, userInstruction, llmProvider } = params;
  
  logger.info(`[内容打磨] 开始打磨 ${sectionType}${sectionIndex !== undefined ? ` (索引 ${sectionIndex})` : ""}, 使用模型: ${llmProvider || "默认"}`);

  // 1. 提取当前内容
  let currentContent: string;
  
  switch (sectionType) {
    case "full":
      currentContent = params.currentContent || preview.markdown || "";
      break;
    
    case "introduction":
      currentContent = preview.introduction || "";
      if (!currentContent) {
        throw new Error("当前预览没有引入内容");
      }
      break;
    
    case "footer":
      currentContent = preview.footer || "";
      if (!currentContent) {
        throw new Error("当前预览没有结语内容");
      }
      break;
    
    case "article":
      if (sectionIndex === undefined || sectionIndex < 0 || sectionIndex >= preview.articles.length) {
        throw new Error(`无效的文章索引: ${sectionIndex}`);
      }
      const article = preview.articles[sectionIndex];
      currentContent = article.content || "";
      if (!currentContent) {
        throw new Error(`文章索引 ${sectionIndex} 的内容为空`);
      }
      break;
    
    default:
      throw new Error(`不支持的段落类型: ${sectionType}`);
  }

  // 2. 调用 AISummarizer 进行打磨
  const summarizer = new AISummarizer();
  const refinedContent = await summarizer.refineContent({
    currentContent,
    userInstruction,
    sectionType,
  }, {
    llmProvider,
    temperature: 0.7,
  });

  logger.info(`[内容打磨] 打磨完成，原长度: ${currentContent.length}, 新长度: ${refinedContent.length}`);

  // 3. 更新 PreviewStore 中的对应内容
  const updatedPreview = { ...preview };
  
  switch (sectionType) {
    case "full":
      updatedPreview.markdown = refinedContent;
      // 注意：全量打磨可能会导致分段信息丢失，但在分段模式下，用户通常会选择特定区域打磨
      // 如果用户坚持使用全量打磨，我们保留原有的 collapse 逻辑，但界面上会引导使用分段
      const lines = refinedContent.split('\n');
      const title = lines[0].startsWith('# ') ? lines[0].replace(/^# /, '').trim() : preview.title;
      updatedPreview.articles = [{
        title,
        content: refinedContent,
        url: preview.articles?.[0]?.url || "",
        publishTime: "",
        description: "",
        thumbnail: "",
      }];
      break;

    case "introduction":
      updatedPreview.introduction = refinedContent;
      break;
    
    case "footer":
      updatedPreview.footer = refinedContent;
      break;
    
    case "article":
      if (sectionIndex !== undefined) {
        const updatedArticles = [...preview.articles];
        updatedArticles[sectionIndex] = {
          ...updatedArticles[sectionIndex],
          content: refinedContent,
        };
        updatedPreview.articles = updatedArticles;
      }
      break;
  }

  // 4. 保存更新后的预览（但尚未重新渲染）
  store.setPreview(updatedPreview);

  // 5. 自动触发重新渲染
  logger.info(`[内容打磨] 开始重新渲染整篇文章并同步本地文件...`);
  const finalPreview = await updatePreview({ template: undefined, customFooter: undefined });

  // 同步到本地文件（如果有路径）
  if (finalPreview.localPath && finalPreview.markdown) {
    try {
      await Deno.writeTextFile(finalPreview.localPath, finalPreview.markdown);
      logger.info(`[内容打磨] 已将打磨后的内容同步到本地文件: ${finalPreview.localPath}`);
    } catch (error) {
      logger.warn(`[内容打磨] 同步本地文件失败: ${error.message}`);
    }
  }

  logger.info(`[内容打磨] 打磨与渲染完成`);
  return finalPreview;
}

export async function updateFullMarkdown(params: { markdown: string }) {
  const store = PreviewStore.getInstance();
  const preview = store.getPreview();

  if (!preview) {
    throw new Error("没有待更新的内容，请先运行任务");
  }

  const { markdown } = params;
  logger.info(`[全文更新] 开始更新全文，长度: ${markdown.length}`);

  // 1. 如果有本地路径，则覆盖写本地文件
  if (preview.localPath) {
    try {
      await Deno.writeTextFile(preview.localPath, markdown);
      logger.info(`[全文更新] 已覆盖保存到本地: ${preview.localPath}`);
    } catch (error) {
      logger.warn(`[全文更新] 保存本地文件失败: ${error.message}`);
    }
  }

  // 更新 PreviewStore 中的全文 Markdown
  const updatedPreview = { ...preview, markdown };
  
  // 同时更新 articles 数组，将全文作为一个整体，以便模板切换功能依然可用
  // 我们提取第一行作为标题，其余作为内容
  // 注意：在全文模式下，我们保留内容中的标题，由渲染器决定是否额外添加序号标题
  const lines = markdown.split('\n');
  const title = lines[0].startsWith('# ') ? lines[0].replace(/^# /, '').trim() : preview.title;
  // 不再剔除第一行，保留完整 Markdown 源码
  const content = markdown;
  
  updatedPreview.articles = [{
    title,
    content,
    url: preview.articles?.[0]?.url || "",
    publishTime: "",
    description: "",
    thumbnail: "",
  }];
  
  // 重新渲染 HTML
  const { DoocsMdRenderer } = await import("@src/modules/render/weixin/doocs-md.renderer.ts");
  const doocsMdRenderer = new DoocsMdRenderer({
    theme: (preview.template as any) || "default",
    primaryColor: "#3f9cf5",
    fontSize: 16,
    showCitation: true,
  });

  // 创建一个伪文章列表用于渲染全文
  // DoocsMdRenderer.render 实际上是在调用 articlesToMarkdown，
  // 我们这里直接跳过 articlesToMarkdown，直接用 marked 渲染
  // 但为了保持样式一致，我们最好还是调用 renderMarkdown 逻辑
  const result = await renderMarkdown({ markdown });
  const renderedTemplate = result.html;

  const finalPreview = {
    ...updatedPreview,
    html: renderedTemplate,
  };
  
  store.setPreview(finalPreview);
  logger.info(`[全文更新] 更新完成`);
  return finalPreview;
}

export async function renderMarkdown(params: { markdown: string; template?: string }) {
  const { markdown, template } = params;
  
  if (!markdown || !markdown.trim()) {
    return { html: '<p class="text-gray-400 text-center">内容为空</p>' };
  }

  logger.info(`[Markdown 渲染] 开始渲染 Markdown，长度: ${markdown.length}, 模板: ${template || "default"}`);

  try {
    const doocsMdRenderer = new DoocsMdRenderer({
      theme: (template as any) || "default",
      primaryColor: "#3f9cf5",
      fontSize: 16,
      codeBackgroundColor: "#282c34",
      codeTextColor: "#abb2bf",
      inlineCodeBackgroundColor: "rgba(27, 31, 35, 0.05)",
      inlineCodeTextColor: "#d14",
      showCitation: true,
    });

    // 将 Markdown 渲染为简单的 HTML（不包含完整文章结构）
    const templateData = [{
      title: "",
      content: markdown,
      url: "",
      publishTime: "",
      description: "",
      thumbnail: "",
    }];

    const rendered = await doocsMdRenderer.render(templateData, {
      skipImageProcessing: true, // 预览时跳过图片处理
    });

    logger.info(`[Markdown 渲染] 渲染完成`);
    return { html: rendered };
  } catch (error) {
    logger.error(`[Markdown 渲染] 渲染失败:`, error);
    throw new Error(`Markdown 渲染失败: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function updateMarkdownContent(params: {
  sectionType: "introduction" | "article" | "footer";
  sectionIndex?: number;
  markdown: string;
}) {
  const store = PreviewStore.getInstance();
  const preview = store.getPreview();

  if (!preview || !preview.articles) {
    throw new Error("没有待更新的内容，请先运行任务");
  }

  const { sectionType, sectionIndex, markdown } = params;
  
  logger.info(`[Markdown 更新] 开始更新 ${sectionType}${sectionIndex !== undefined ? ` (索引 ${sectionIndex})` : ""}`);

  // 更新对应的内容
  const updatedPreview = { ...preview };
  
  switch (sectionType) {
    case "introduction":
      updatedPreview.introduction = markdown;
      break;
    
    case "footer":
      updatedPreview.footer = markdown;
      break;
    
    case "article":
      if (sectionIndex === undefined || sectionIndex < 0 || sectionIndex >= preview.articles.length) {
        throw new Error(`无效的文章索引: ${sectionIndex}`);
      }
      
      // 从 Markdown 中提取标题和内容
      const lines = markdown.split('\n');
      let title = '';
      let content = markdown;
      
      // 如果第一行是 ## 标题，提取它
      if (lines[0] && lines[0].startsWith('## ')) {
        title = lines[0].replace(/^## /, '').trim();
        content = lines.slice(1).join('\n').trim();
      }
      
      const updatedArticles = [...preview.articles];
      updatedArticles[sectionIndex] = {
        ...updatedArticles[sectionIndex],
        title: title || updatedArticles[sectionIndex].title,
        content: content,
      };
      updatedPreview.articles = updatedArticles;
      break;
    
    default:
      throw new Error(`不支持的段落类型: ${sectionType}`);
  }

  // 保存并重新渲染
  store.setPreview(updatedPreview);
  
  logger.info(`[Markdown 更新] 开始重新渲染并同步本地文件...`);
  const finalPreview = await updatePreview({ template: undefined, customFooter: undefined });

  // 同步到本地文件（如果有路径）
  if (finalPreview.localPath && finalPreview.markdown) {
    try {
      await Deno.writeTextFile(finalPreview.localPath, finalPreview.markdown);
      logger.info(`[Markdown 更新] 已同步到本地文件: ${finalPreview.localPath}`);
    } catch (error) {
      logger.warn(`[Markdown 更新] 同步本地文件失败: ${error.message}`);
    }
  }

  logger.info(`[Markdown 更新] 更新完成`);
  return finalPreview;
}
