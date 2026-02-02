import { triggerWorkflow } from "./controllers/workflow.controller.ts";
import { WorkflowType } from "./controllers/cron.ts";
import { ConfigManager } from "@src/utils/config/config-manager.ts";
import { LogCollector } from "@src/utils/log-collector.ts";
import { getEnvConfig, saveEnvConfig, getArticlePreview, confirmPublish, updatePreview, refineContent, renderMarkdown, updateMarkdownContent, updateFullMarkdown } from "./controllers/ui.controller.ts";
import { join } from "jsr:@std/path";

export interface JSONRPCRequest {
  jsonrpc: string;
  method: string;
  params: Record<string, any>;
  id: string | number;
}

export interface JSONRPCResponse {
  jsonrpc: string;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
  id: string | number;
}

export class JSONRPCServer {
  private routes: Record<string, (params: Record<string, any>) => Promise<any>>;

  constructor() {
    this.routes = {};
  }

  registerRoute(method: string, handler: (params: Record<string, any>) => Promise<any>) {
    this.routes[method] = handler;
  }

  async handleRequest(request: Request): Promise<Response> {
    try {
      if (request.method !== "POST") {
        throw new Error("只支持 POST 请求");
      }

      const body = await request.json() as JSONRPCRequest;

      if (!body.jsonrpc || body.jsonrpc !== "2.0") {
        throw new Error("无效的 JSON-RPC 请求");
      }

      if (!body.method) {
        throw new Error("请求缺少方法名");
      }

      const handler = this.routes[body.method];
      if (!handler) {
        throw new Error(`方法 ${body.method} 不存在`);
      }

      const result = await handler(body.params || {});
      
      return new Response(
        JSON.stringify({
          jsonrpc: "2.0",
          result,
          id: body.id,
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    } catch (error) {
      const isClientError = error instanceof Error && (
        error.message.includes("无效的") ||
        error.message.includes("不存在") ||
        error.message.includes("缺少")
      );

      return new Response(
        JSON.stringify({
          jsonrpc: "2.0",
          error: {
            code: isClientError ? -32600 : -32603,
            message: isClientError ? error.message : "内部服务器错误",
            data: {
              error: error instanceof Error ? error.message : String(error),
            },
          },
          id: "unknown",
        }),
        {
          status: isClientError ? 400 : 500,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }
  }
}

// 创建 JSON-RPC 服务器实例
const rpcServer = new JSONRPCServer();
rpcServer.registerRoute("triggerWorkflow", triggerWorkflow);
rpcServer.registerRoute("getEnvConfig", getEnvConfig);
rpcServer.registerRoute("saveEnvConfig", saveEnvConfig);
rpcServer.registerRoute("getArticlePreview", getArticlePreview);
rpcServer.registerRoute("confirmPublish", confirmPublish);
rpcServer.registerRoute("updatePreview", updatePreview);
rpcServer.registerRoute("refineContent", refineContent);
rpcServer.registerRoute("renderMarkdown", renderMarkdown);
rpcServer.registerRoute("updateMarkdownContent", updateMarkdownContent);
rpcServer.registerRoute("updateFullMarkdown", updateFullMarkdown);

// 请求处理器
const handler = async (req: Request): Promise<Response> => {
  try {
    const url = new URL(req.url);
    const normalizedPath = url.pathname.replace(/^\/+|\/+$/g, "");

    // 1. SSE 日志接口
    if (normalizedPath === "api/logs") {
      const stream = new ReadableStream({
        start(controller) {
          const collector = LogCollector.getInstance();
          const encoder = new TextEncoder();
          const callback = (log: string) => {
            try {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(log)}\n\n`));
            } catch (e) {
              collector.removeListener(callback);
            }
          };
          collector.addListener(callback);
          
          req.signal.addEventListener("abort", () => {
            collector.removeListener(callback);
            controller.close();
          });
        }
      });

      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
        }
      });
    }

    // 2. JSON-RPC 接口（支持带 Token 或本地访问）
    if (normalizedPath === "api/workflow") {
      // 本地请求跳过 Token 校验（为了简化 UI 交互）
      const isLocal = url.hostname === "localhost" || url.hostname === "127.0.0.1";
      if (!isLocal) {
        const configManager = ConfigManager.getInstance();
        const API_KEY = await configManager.get("SERVER_API_KEY");
        const authHeader = req.headers.get("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ") || authHeader.split(" ")[1] !== API_KEY) {
          return new Response(JSON.stringify({ error: "未授权" }), { status: 401 });
        }
      }
      return await rpcServer.handleRequest(req);
    }

    // 3. 静态 UI 服务
    if (normalizedPath === "" || normalizedPath === "index.html") {
      try {
        const content = await Deno.readTextFile("./public/index.html");
        return new Response(content, { headers: { "Content-Type": "text/html" } });
      } catch (e) {
        return new Response("UI 资源未找到，请确认 public/index.html 存在", { status: 404 });
      }
    }

    // 处理其他静态资源 (如 .js, .css)
    if (normalizedPath.startsWith("public/")) {
      try {
        const content = await Deno.readFile(`./${normalizedPath}`);
        const type = normalizedPath.endsWith(".js") ? "application/javascript" : "text/css";
        return new Response(content, { headers: { "Content-Type": type } });
      } catch (e) {
        return new Response("Not Found", { status: 404 });
      }
    }

    // 4. 处理 data 目录下的资源（用于预览本地图片）
    if (normalizedPath.startsWith("data/")) {
      try {
        // 解码 URL 中的特殊字符（如中文）
        const decodedPath = decodeURIComponent(normalizedPath);
        const filePath = `./${decodedPath}`;
        const content = await Deno.readFile(filePath);
        
        // 简单的 MIME 类型检测
        let type = "application/octet-stream";
        if (filePath.endsWith(".png")) type = "image/png";
        else if (filePath.endsWith(".jpg") || filePath.endsWith(".jpeg")) type = "image/jpeg";
        else if (filePath.endsWith(".gif")) type = "image/gif";
        else if (filePath.endsWith(".webp")) type = "image/webp";
        else if (filePath.endsWith(".svg")) type = "image/svg+xml";
        else if (filePath.endsWith(".json")) type = "application/json";
        
        return new Response(content, { headers: { "Content-Type": type } });
      } catch (e) {
        return new Response("Not Found", { status: 404 });
      }
    }

    return new Response("Not Found", { status: 404 });
  } catch (error) {
    console.error("请求处理错误:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
};

export default function startServer(port = 8000) {
  Deno.serve({ port }, handler);
  console.log(`TrendPublish UI 控制面板已运行: http://localhost:${port}`);
  console.log("双击 TrendPublish.exe 即可直接在此界面配置和运行");
}
