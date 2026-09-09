import { createDemoHandler, renderDemoMarkdown } from "./demo.ts";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function rpc(
  handler: (request: Request) => Promise<Response>,
  method: string,
  params = {},
) {
  return handler(
    new Request("http://127.0.0.1:8001/api/workflow", {
      method: "POST",
      body: JSON.stringify({ jsonrpc: "2.0", id: 7, method, params }),
    }),
  ).then((response) => response.json());
}

Deno.test("demo edits persist in memory and publishing/config/AI remain blocked", async () => {
  const handler = createDemoHandler("<body></body>");
  assert(
    (await rpc(handler, "getArticlePreview")).result === null,
    "starts empty",
  );
  await rpc(handler, "triggerWorkflow", { contentMode: "GITHUB_TRENDING" });
  const loaded = (await rpc(handler, "getArticlePreview")).result;
  assert(
    loaded.metadata.demo && loaded.title.includes("开源"),
    "GitHub sample loaded",
  );
  const edited = await rpc(handler, "updateFullMarkdown", {
    markdown: "# Edited\n\nMy draft",
  });
  assert(edited.result.html.includes("My draft"), "edited text rendered");
  assert(
    (await rpc(handler, "getArticlePreview")).result.markdown ===
      "# Edited\n\nMy draft",
    "edits retained",
  );
  for (const method of ["confirmPublish", "saveEnvConfig", "refineContent"]) {
    const response = await rpc(handler, method);
    assert(
      response.error && !response.result,
      `${method} must not claim success`,
    );
    assert(response.id === 7, "response preserves request id");
  }
});

Deno.test("demo escapes user HTML and does not serve local secrets or arbitrary files", async () => {
  const html = renderDemoMarkdown(
    '# <img src=x onerror="alert(1)">\n\n<script>alert(1)</script>',
  );
  assert(
    !html.includes("<img") && !html.includes("<script>"),
    "markup must be escaped",
  );
  const handler = createDemoHandler("<body>Control panel</body>");
  for (const path of ["/.env", "/data/articles.json", "/src/index.ts"]) {
    assert(
      (await handler(new Request(`http://127.0.0.1:8001${path}`))).status ===
        404,
      `${path} not exposed`,
    );
  }
  const response = await handler(
    new Request("http://127.0.0.1:8001/api/workflow", {
      method: "POST",
      headers: { origin: "https://example.com" },
      body: "{}",
    }),
  );
  assert(response.status === 403, "cross-origin request rejected");
  const page = await (await handler(new Request("http://127.0.0.1:8001/")))
    .text();
  assert(
    page.includes("演示模式") && page.includes("Control panel"),
    "real UI labeled as demo",
  );
});
