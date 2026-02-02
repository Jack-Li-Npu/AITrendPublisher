import { existsSync } from "node:fs";
import { join } from "jsr:@std/path";
import { AISummarizer } from "@src/modules/summarizer/ai.summarizer.ts";
import { DoocsMdRenderer } from "@src/modules/render/weixin/doocs-md.renderer.ts";
import { ImageGeneratorFactory } from "@src/providers/image-gen/image-generator-factory.ts";
import { ConfigManager } from "@src/utils/config/config-manager.ts";

type ArticleMeta = {
  title?: string;
  saveTime?: string;
  contentMode?: string;
  sourceUrls?: string[];
};

const args = new Set(Deno.args);
const llmProviderArg = getArgValue("--llm");
const refineInstruction = getArgValue("--refine");
const templatesArg = getArgValue("--templates") || "default,grace,simple";
const shouldGenerateImage = !args.has("--no-image");
const shouldRefine = !!refineInstruction;
const templates = templatesArg.split(",").map((t) => t.trim()).filter(Boolean);

const baseDir = new URL("../data/articles", import.meta.url).pathname;
const latestDir = await findLatestArticleDir(baseDir);

if (!latestDir) {
  console.error("未找到 data/articles 下的文章目录");
  Deno.exit(1);
}

const metadataPath = join(latestDir, "metadata.json");
const articleMdPath = join(latestDir, "article.md");

if (!existsSync(articleMdPath)) {
  console.error(`未找到文章 Markdown: ${articleMdPath}`);
  Deno.exit(1);
}

const metadata = existsSync(metadataPath)
  ? (JSON.parse(await Deno.readTextFile(metadataPath)) as ArticleMeta)
  : {};

const rawMarkdown = await Deno.readTextFile(articleMdPath);
const { title, content } = splitTitleFromMarkdown(rawMarkdown, metadata.title);

console.log("=== 本地测试脚本 ===");
console.log(`文章目录: ${latestDir}`);
console.log(`标题: ${title}`);
console.log(`模板: ${templates.join(", ")}`);
console.log(`润色: ${shouldRefine ? "是" : "否"}`);
console.log(`图片生成: ${shouldGenerateImage ? "是" : "否"}`);

// 1) 构建文章对象
const article = {
  title,
  content,
  url: metadata.sourceUrls?.[0] || "",
  publishTime: "",
  description: "",
  thumbnail: "",
};

// 2) 可选：润色
let refinedContent = content;
if (shouldRefine) {
  console.log("开始润色内容...");
  const summarizer = new AISummarizer();
  refinedContent = await summarizer.refineContent(
    {
      currentContent: content,
      userInstruction: refineInstruction || "优化表达，保持事实不变",
      sectionType: "article",
    },
    {
      llmProvider: llmProviderArg || undefined,
      temperature: 0.6,
    },
  );
  console.log("润色完成");
}

// 3) 可选：封面图生成
let coverImageUrl = "";
if (shouldGenerateImage) {
  console.log("开始生成封面图...");
  try {
    const imageGen = await ImageGeneratorFactory.getInstance().getGenerator(
      "QWEN_IMAGE_MAX",
    );
    coverImageUrl = await imageGen.generate({
      prompt:
        `生成信息图表风格的科技封面图：以"${title}"为主题，展示相关的技术概念、应用场景和创新元素。要求：专业、现代、科技感，横版布局。不要包含时间、日期或“AI速递”字样。`,
      size: "1664*928",
      prompt_extend: true,
    });
    console.log(`封面图生成成功: ${coverImageUrl}`);
  } catch (error) {
    console.warn(`封面图生成失败: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// 4) 模板渲染输出
const outputDir = join(
  baseDir,
  "../test-output",
  new Date().toISOString().replace(/[:.]/g, "-"),
);
await Deno.mkdir(outputDir, { recursive: true });

for (const template of templates) {
  console.log(`渲染模板: ${template}`);
  const renderer = new DoocsMdRenderer({
    theme: template as any,
    primaryColor: "#3f9cf5",
    fontSize: 16,
    showCitation: true,
  });
  const html = await renderer.render(
    [
      {
        ...article,
        content: refinedContent,
      },
    ],
    {
      introduction: "",
      overviewImageUrl: "",
      contentMode: metadata.contentMode as any,
      skipImageProcessing: false,
    },
  );
  await Deno.writeTextFile(
    join(outputDir, `preview-${template}.html`),
    html,
  );
}

// 5) 保存润色后的 Markdown
await Deno.writeTextFile(
  join(outputDir, "refined.md"),
  refinedContent,
);

// 6) 保存封面图 URL
if (coverImageUrl) {
  await Deno.writeTextFile(join(outputDir, "cover-image-url.txt"), coverImageUrl);
}

console.log(`测试输出目录: ${outputDir}`);
console.log("完成 ✅");

function splitTitleFromMarkdown(markdown: string, fallbackTitle?: string) {
  const lines = markdown.split("\n");
  if (lines[0]?.startsWith("# ")) {
    const title = lines[0].replace(/^#\s+/, "").trim();
    const rest = lines.slice(1).join("\n").replace(/^\n+/, "");
    return {
      title,
      content: rest,
    };
  }
  return {
    title: fallbackTitle || "未命名文章",
    content: markdown,
  };
}

async function findLatestArticleDir(root: string): Promise<string | null> {
  let latestDir: string | null = null;
  let latestTime = 0;

  for await (const entry of Deno.readDir(root)) {
    if (!entry.isDirectory) continue;
    const dirPath = join(root, entry.name);
    const metaPath = join(dirPath, "metadata.json");
    if (!existsSync(metaPath)) continue;
    try {
      const meta = JSON.parse(await Deno.readTextFile(metaPath)) as ArticleMeta;
      const time = meta.saveTime ? Date.parse(meta.saveTime) : 0;
      const ts = Number.isFinite(time) ? time : 0;
      if (ts > latestTime) {
        latestTime = ts;
        latestDir = dirPath;
      }
    } catch {
      continue;
    }
  }

  return latestDir;
}

function getArgValue(key: string): string | undefined {
  const arg = Deno.args.find((a) => a.startsWith(`${key}=`));
  return arg ? arg.slice(key.length + 1) : undefined;
}
