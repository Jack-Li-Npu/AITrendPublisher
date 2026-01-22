/**
 * DoocsMd 渲染器测试
 * 用于验证新的渲染器是否正常工作
 */

import { DoocsMdRenderer } from "@src/modules/render/weixin/doocs-md.renderer.ts";
import type { WeixinTemplate } from "@src/modules/render/weixin/interfaces/article.type.ts";

// 测试数据
const testArticles: WeixinTemplate[] = [
  {
    id: "test-1",
    title: "测试文章 1：AI 技术突破",
    content:
      `人工智能领域取得了重大突破。<next_paragraph />研究人员开发了一种新的算法，能够更高效地处理自然语言。<next_paragraph />这项技术将应用于智能助手和翻译系统中。`,
    url: "https://example.com/article1",
    publishDate: "2026-01-06",
    metadata: {
      source: "测试来源",
      keywords: ["AI", "技术", "突破"],
    },
    keywords: ["AI", "技术", "突破"],
    media: [],
  },
  {
    id: "test-2",
    title: "测试文章 2：开源社区动态",
    content:
      `开源社区发布了新版本的开发工具。<next_paragraph />这个版本包含了许多新功能和性能改进。<next_paragraph />开发者们对此表示热烈欢迎。`,
    url: "https://example.com/article2",
    publishDate: "2026-01-06",
    metadata: {
      source: "测试来源",
      keywords: ["开源", "社区", "工具"],
    },
    keywords: ["开源", "社区", "工具"],
    media: [],
  },
];

async function testDoocsMdRenderer() {
  console.log("=".repeat(60));
  console.log("DoocsMd 渲染器测试");
  console.log("=".repeat(60));

  try {
    // 测试 1: 默认配置
    console.log("\n[测试 1] 使用默认配置渲染");
    const renderer1 = new DoocsMdRenderer();
    const html1 = await renderer1.render(testArticles);
    console.log(`✅ 成功渲染，HTML 长度：${html1.length} 字符`);
    console.log(`HTML 预览（前 500 字符）：\n${html1.substring(0, 500)}...\n`);

    // 测试 2: 自定义配置
    console.log("\n[测试 2] 使用自定义配置（grace 主题）");
    const renderer2 = new DoocsMdRenderer({
      theme: "grace",
      primaryColor: "#ff6b6b",
      fontSize: 18,
      showCitation: false,
      showLineNumber: true,
    });
    const html2 = await renderer2.render(testArticles);
    console.log(`✅ 成功渲染，HTML 长度：${html2.length} 字符`);

    // 测试 3: 快速渲染
    console.log("\n[测试 3] 使用快速渲染方法");
    const html3 = await DoocsMdRenderer.quickRender(testArticles);
    console.log(`✅ 成功渲染，HTML 长度：${html3.length} 字符`);

    // 将渲染结果保存到文件
    console.log("\n[保存] 将渲染结果保存到文件");
    await Deno.writeTextFile(
      "./test-doocs-md-output.html",
      html1,
    );
    console.log("✅ 已保存到 test-doocs-md-output.html");

    console.log("\n" + "=".repeat(60));
    console.log("所有测试通过 ✅");
    console.log("=".repeat(60));
  } catch (error) {
    console.error("\n❌ 测试失败：", error);
    throw error;
  }
}

// 运行测试
if (import.meta.main) {
  testDoocsMdRenderer();
}

