/**
 * UI 测试台脚本
 * 
 * 功能：
 * 1. 启动一个独立的测试服务器 (端口 8001)
 * 2. 自动加载本地最新文章数据
 * 3. 提供一个修改版的 UI，直接跳过爬虫，进入预览和打磨阶段
 * 4. 完全不修改项目源码
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { join, fromFileUrl } from "https://deno.land/std@0.190.0/path/mod.ts";
import { AISummarizer } from "../src/modules/summarizer/ai.summarizer.ts";
import { DoocsMdRenderer } from "../src/modules/render/weixin/doocs-md.renderer.ts";
import { PreviewStore } from "../src/utils/preview-store.ts";
import { ConfigManager } from "../src/utils/config/config-manager.ts";

const PORT = 8001;
const projectRoot = fromFileUrl(new URL("..", import.meta.url));

console.log("🚀 启动 UI 测试台...");
console.log(`📂 项目根目录: ${projectRoot}`);

// 初始化配置源
await ConfigManager.getInstance().initDefaultConfigSources();

// 1. 加载最新的本地文章数据
async function findLatestArticle() {
  const baseDir = join(projectRoot, "data/articles");
  let latestDir = "";
  let latestTime = 0;

  try {
    for await (const entry of Deno.readDir(baseDir)) {
      if (!entry.isDirectory) continue;
      const dirPath = join(baseDir, entry.name);
      const metaPath = join(dirPath, "metadata.json");
      try {
        const meta = JSON.parse(await Deno.readTextFile(metaPath));
        const time = meta.saveTime ? Date.parse(meta.saveTime) : 0;
        if (time > latestTime) {
          latestTime = time;
          latestDir = dirPath;
        }
      } catch { /* ignore */ }
    }
  } catch (e) {
    console.error("读取目录失败:", e.message);
  }
  return latestDir;
}

// 2. 模拟 RPC 处理器
const handleRpc = async (method: string, params: any) => {
  try {
    const store = PreviewStore.getInstance();
    const preview = store.getPreview();

    switch (method) {
      case "loadTestData": {
        const latestDir = await findLatestArticle();
        if (!latestDir) throw new Error("未找到本地文章数据");
        
        console.log(`📦 加载测试数据: ${latestDir}`);
        const rawMarkdown = await Deno.readTextFile(join(latestDir, "article.md"));
        let meta: any = {};
        try {
          meta = JSON.parse(await Deno.readTextFile(join(latestDir, "metadata.json")));
        } catch {
          console.warn("未能加载 metadata.json，将使用默认值");
        }
        
        // 简单拆分标题
        const lines = rawMarkdown.split("\n");
        const title = lines[0].startsWith("# ") ? lines[0].replace("# ", "").trim() : (meta.title || "未命名文章");
        // 不再剔除第一行标题，由渲染器处理
        const content = rawMarkdown;

        const articles = [{ title, content, url: meta.sourceUrls?.[0] || "" }];
        
        // 初始渲染
        const renderer = new DoocsMdRenderer();
        const html = await renderer.render(articles as any, { skipImageProcessing: true });

        const testPreview = {
          id: "test-" + Date.now(),
          title,
          html,
          markdown: rawMarkdown,
          articles,
          template: "default",
          metadata: { contentMode: meta.contentMode || "TECH_NEWS" },
          localPath: join(latestDir, "article.md")
        };
        
        store.setPreview(testPreview as any);
        return testPreview;
      }

      case "refineContent": {
        const summarizer = new AISummarizer();
        const { sectionType, sectionIndex, userInstruction, llmProvider, currentContent: currentContentParam } = params;
        
        let currentText = "";
        if (sectionType === "full") {
          currentText = currentContentParam || (preview as any).markdown || "";
        } else if (sectionType === "article") {
          currentText = preview?.articles?.[sectionIndex || 0]?.content || "";
        } else {
          currentText = (preview as any)?.[sectionType] || "";
        }

        const refined = await summarizer.refineContent({
          currentContent: currentText,
          userInstruction,
          sectionType: sectionType === "full" ? "article" : sectionType // 桥接
        }, { llmProvider });

        // 更新存储
        const updatedPreview = { ...preview };
        if (sectionType === "full") {
          (updatedPreview as any).markdown = refined;
          // 同时更新 articles 数组以支持模板切换
          const lines = refined.split('\n');
          const title = lines[0].startsWith('# ') ? lines[0].replace(/^# /, '').trim() : (preview as any).title;
          const content = refined;
          (updatedPreview as any).articles = [{
            title,
            content,
            url: (preview as any).articles?.[0]?.url || "",
            publishTime: "",
            description: "",
            thumbnail: "",
          }];
        } else if (sectionType === "article") {
          (updatedPreview as any).articles[sectionIndex || 0].content = refined;
        } else {
          (updatedPreview as any)[sectionType] = refined;
        }

        // 重新渲染
        const renderer = new DoocsMdRenderer({ theme: (preview as any).template });
        updatedPreview.html = await renderer.render((updatedPreview as any).articles, {
          skipImageProcessing: true,
          introduction: (updatedPreview as any).introduction
        });

        store.setPreview(updatedPreview as any);
        return updatedPreview;
      }

      case "updatePreview": {
          const { template } = params;
          const renderer = new DoocsMdRenderer({ theme: template });
          const html = await renderer.render((preview as any).articles, {
              skipImageProcessing: true,
              introduction: (preview as any).introduction
          });
          const updated = { ...preview, html, template };
          store.setPreview(updated as any);
          return updated;
      }
      
      case "renderMarkdown": {
          const { markdown, template } = params;
          const renderer = new DoocsMdRenderer({ theme: (template as any) || "default" });
          const html = await renderer.render([{ title: "", content: markdown }] as any, { skipImageProcessing: true });
          return { html };
      }

      case "updateFullMarkdown": {
          const { markdown } = params;
          const renderer = new DoocsMdRenderer();
          
          const lines = markdown.split('\n');
          const title = lines[0].startsWith('# ') ? lines[0].replace(/^# /, '').trim() : (preview as any).title;
          const content = markdown;

          // 1. 模拟保存到本地
          if (preview?.localPath) {
              await Deno.writeTextFile(preview.localPath, markdown);
              console.log(`[测试台] 已保存到本地: ${preview.localPath}`);
          }

          // 重新渲染
          const html = await renderer.render([{ title, content }] as any, { skipImageProcessing: true });
          const updated = { ...preview, html, markdown, articles: [{ title, content }] };
          store.setPreview(updated as any);
          return updated;
      }

      case "loadLatestLocalPreview": {
          return await handleRpc("loadTestData", {});
      }

      case "confirmPublish": {
          console.log("模拟发布中...");
          await new Promise(resolve => setTimeout(resolve, 2000));
          console.log("✅ 模拟发布成功");
          return { success: true };
      }

      case "getArticlePreview": {
          return store.getPreview();
      }

      case "getEnvConfig": {
          return await ConfigManager.getInstance().getEnvConfig();
      }

      case "saveEnvConfig": {
          await ConfigManager.getInstance().saveEnvConfig(params);
          return { success: true };
      }

      default:
        throw new Error(`未实现的测试 RPC: ${method}`);
    }
  } catch (e) {
    console.error(`❌ RPC [${method}] 失败:`, e.message);
    throw e;
  }
};

// 3. 启动测试服务器
serve(async (req) => {
  const url = new URL(req.url);

  // 处理 RPC
  if (url.pathname === "/api/workflow" && req.method === "POST") {
    const body = await req.json();
    try {
      const result = await handleRpc(body.method, body.params);
      return new Response(JSON.stringify({ jsonrpc: "2.0", result, id: body.id }), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (e) {
      return new Response(JSON.stringify({ jsonrpc: "2.0", error: { message: e.message }, id: body.id }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  // 服务静态文件，但对 index.html 进行测试化修改
  if (url.pathname === "/" || url.pathname === "/index.html") {
    let html = await Deno.readTextFile(join(projectRoot, "public/index.html"));
    
    // 注入测试台特有的逻辑：自动点击加载
    html = html.replace("</body>", `
      <script>
        // 测试台专用：自动进入预览模式
        window.addEventListener('load', async () => {
          console.log("🛠️ 进入测试台模式...");
          const runBtn = document.getElementById('run-btn');
          runBtn.innerHTML = "✨ 测试台：点击加载本地文章";
          runBtn.onclick = async () => {
            runBtn.disabled = true;
            runBtn.innerHTML = "⏳ 正在加载...";
            try {
              const preview = await rpc('loadTestData');
              showPreview(preview);
              showToast("测试数据已加载", "success");
            } catch(e) {
              showToast("加载失败: " + e.message, "error");
            } finally {
              runBtn.disabled = false;
              runBtn.innerHTML = "✨ 测试台：重新加载本地文章";
            }
          };
        });
      </script>
      </body>
    `);
    return new Response(html, { headers: { "Content-Type": "text/html" } });
  }

  // 其他静态资源直接透传
  try {
    const filePath = join(projectRoot, "public", url.pathname);
    const content = await Deno.readFile(filePath);
    return new Response(content);
  } catch {
    return new Response("Not Found", { status: 404 });
  }
}, { port: PORT });

console.log(`✅ 测试服务器运行在: http://localhost:${PORT}`);
console.log("💡 注意：此模式下点击'运行任务'将直接加载本地最新文章，不消耗爬虫 API。");
