// A fixture backend for the real control panel. No production modules or secrets.
interface DemoPreview {
  id: string;
  title: string;
  html: string;
  markdown: string;
  template: string;
  introduction: string;
  footer: string;
  articles: { title: string; content: string }[];
  metadata: { contentMode: string; demo: boolean };
}

const sampleMarkdown = `# 从技术线索到一篇值得阅读的文章

> 演示样稿 · 人工编写的示例，不代表实时新闻或模型输出。

## 01 / 发现值得写的内容

每天打开很多网页，真正困难的是决定哪些内容值得介绍。TrendPublish 将科技资讯和 GitHub 热门项目放进同一个采编流程。

## 02 / 把素材整理成文章

在真实工作流中，采集器读取网页或项目 README，模型按内容模式整理、翻译或扩写。编辑可以检查原文、修改标题，并删去缺少证据的判断。

## 03 / 在发送前认真编辑

在“再改改”中直接修改 Markdown，右侧查看排版效果。试着把这段话改成你自己的开场白，然后保存修改。

## 04 / 交付到微信草稿箱

真实版本会在确认后处理图片并创建公众号草稿。正式群发由你在微信后台完成。

---

让 AI 帮你整理素材，把最后的判断留给编辑。
`;

function escapeHtml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;").replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

// Deliberately small, escaped renderer for the demo; production uses Doocs MD.
export function renderDemoMarkdown(
  markdown: string,
  template = "default",
): string {
  const color = template === "elegant" ? "#6b5b95" : "#0f766e";
  const blocks = markdown.split(/\n\s*\n/).map((block) => {
    const text = escapeHtml(block.trim());
    if (text.startsWith("# ")) {
      return `<h1 style="font-size:30px;line-height:1.45;font-weight:800;margin:0 0 24px">${
        text.slice(2)
      }</h1>`;
    }
    if (text.startsWith("## ")) {
      return `<h2 style="font-size:20px;font-weight:700;color:${color};border-left:4px solid ${color};padding-left:12px;margin:28px 0 14px">${
        text.slice(3)
      }</h2>`;
    }
    if (text.startsWith("&gt; ")) {
      return `<blockquote style="background:#f0fdfa;padding:14px 18px;color:#475569;border-radius:8px;font-size:13px">${
        text.slice(5)
      }</blockquote>`;
    }
    if (text === "---") {
      return '<hr style="margin:28px 0;border-top:1px solid #e2e8f0">';
    }
    return `<p style="margin:14px 0">${text.replaceAll("\n", "<br>")}</p>`;
  });
  return `<article style="font-size:16px;line-height:1.9;color:#334155">${
    blocks.join("")
  }</article>`;
}

function createPreview(mode: string, template: string): DemoPreview {
  const markdown = mode === "GITHUB_TRENDING"
    ? sampleMarkdown.replace(
      "从技术线索到一篇值得阅读的文章",
      "把一个开源项目讲清楚",
    )
    : sampleMarkdown;
  return {
    id: "demo-preview",
    title: markdown.split("\n")[0].slice(2),
    html: renderDemoMarkdown(markdown, template),
    markdown,
    template,
    introduction: "",
    footer: "",
    articles: [{ title: "演示样稿", content: markdown }],
    metadata: { contentMode: mode, demo: true },
  };
}

export function createDemoHandler(
  ui: string,
): (request: Request) => Promise<Response> {
  let preview: DemoPreview | null = null;
  const banner =
    `<div style="background:#0f172a;color:#ccfbf1;padding:10px 24px;font:13px system-ui;flex-shrink:0">
    <strong>DEMO / 演示模式</strong> · 示例文章与简化排版 · 无需密钥 · 不调用 AI、不保存配置、不上传微信
  </div>`;
  const page = ui.replace(/(<body[^>]*>)/, `$1${banner}`);

  return async function handleDemo(request: Request): Promise<Response> {
    const url = new URL(request.url);
    if (request.method === "GET" && url.pathname === "/") {
      return new Response(page, {
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
    if (request.method === "GET" && url.pathname === "/api/logs") {
      const encoder = new TextEncoder();
      let heartbeat: ReturnType<typeof setInterval> | undefined;
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(
            encoder.encode(
              'data: "[DEMO] 示例服务已就绪。选择模式，点击开始运行任务，体验预览与 Markdown 编辑。"\n\n',
            ),
          );
          heartbeat = setInterval(
            () => controller.enqueue(encoder.encode(": keepalive\n\n")),
            15000,
          );
        },
        cancel() {
          clearInterval(heartbeat);
        },
      });
      return new Response(stream, {
        headers: {
          "content-type": "text/event-stream",
          "cache-control": "no-cache",
        },
      });
    }
    if (url.pathname !== "/api/workflow" || request.method !== "POST") {
      return new Response("Not found", { status: 404 });
    }
    // This server only supports the control panel on its own loopback origin.
    const origin = request.headers.get("origin");
    if (origin && origin !== url.origin) {
      return new Response("Forbidden", { status: 403 });
    }
    let id: string | number | null = null;
    try {
      const body = await request.json();
      id = body.id ?? null;
      if (body.jsonrpc !== "2.0") throw new Error("Invalid JSON-RPC version");
      const params = body.params ?? {};
      let result: unknown;
      switch (body.method) {
        case "getEnvConfig":
          result = {
            DASHSCOPE_REGION: "cn",
            AI_SUMMARIZER_LLM_PROVIDER: "DEEPSEEK:deepseek-chat",
          };
          break;
        case "triggerWorkflow":
          preview = createPreview(
            String(params.contentMode ?? "TECH_NEWS"),
            String(params.template ?? "default"),
          );
          result = { demo: true };
          break;
        case "getArticlePreview":
          result = preview;
          break;
        case "renderMarkdown":
          result = {
            html: renderDemoMarkdown(
              String(params.markdown ?? ""),
              String(params.template ?? "default"),
            ),
          };
          break;
        case "updateFullMarkdown":
        case "updatePreview":
          if (!preview) throw new Error("请先运行演示任务");
          if (body.method === "updateFullMarkdown") {
            preview.markdown = String(params.markdown ?? "");
            preview.articles = [{
              title: "演示样稿",
              content: preview.markdown,
            }];
          } else if (params.customFooter) {
            throw new Error("演示模式请在 Markdown 编辑器修改结语");
          }
          preview.template = String(params.template ?? preview.template);
          preview.html = renderDemoMarkdown(preview.markdown, preview.template);
          result = preview;
          break;
        case "confirmPublish":
          throw new Error(
            "演示模式不会上传微信。真实版本将文章上传至草稿箱，由你在微信后台完成群发。",
          );
        case "saveEnvConfig":
          throw new Error("演示模式不保存配置，请勿输入真实密钥。");
        case "refineContent":
          throw new Error(
            "演示模式不调用 AI。你可以直接编辑 Markdown，再点击保存修改。",
          );
        default:
          throw new Error("演示模式不支持此操作");
      }
      return Response.json({ jsonrpc: "2.0", id, result });
    } catch (error) {
      return Response.json({
        jsonrpc: "2.0",
        id,
        error: {
          code: -32603,
          message: error instanceof Error ? error.message : "Invalid request",
        },
      });
    }
  };
}

if (import.meta.main) {
  const ui = await Deno.readTextFile(
    new URL("../public/index.html", import.meta.url),
  );
  Deno.serve({ hostname: "127.0.0.1", port: 8001 }, createDemoHandler(ui));
  console.log(
    "Demo ready: http://127.0.0.1:8001 — sample content; no API keys or publishing.",
  );
}
