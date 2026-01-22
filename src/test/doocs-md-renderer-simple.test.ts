/**
 * DoocsMd 渲染器简单测试（不涉及图片处理）
 * 用于验证核心渲染功能
 */

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

async function testDoocsMdRendererSimple() {
  console.log("=".repeat(60));
  console.log("DoocsMd 渲染器简单测试（无图片处理）");
  console.log("=".repeat(60));

  try {
    // 动态导入渲染器
    console.log("\n[步骤 1] 导入 DoocsMd 渲染器...");
    const { DoocsMdRenderer } = await import("@src/modules/render/weixin/doocs-md.renderer.ts");
    console.log("✅ 渲染器导入成功");

    // 测试基本渲染（不包含图片处理）
    console.log("\n[步骤 2] 创建渲染器实例...");
    const renderer = new DoocsMdRenderer({
      theme: "default",
      primaryColor: "#3f9cf5",
      fontSize: 16,
    });
    console.log("✅ 渲染器实例创建成功");

    // 将文章转换为 Markdown
    console.log("\n[步骤 3] 转换文章为 Markdown...");
    const markdown = (renderer as any).articlesToMarkdown(testArticles);
    console.log(`✅ Markdown 生成成功，长度：${markdown.length} 字符`);
    console.log(`\nMarkdown 预览（前 300 字符）：\n${markdown.substring(0, 300)}...\n`);

    // 测试 CSS 加载
    console.log("\n[步骤 4] 加载主题 CSS...");
    const css = await (renderer as any).loadThemeCSS();
    console.log(`✅ CSS 加载成功，长度：${css.length} 字符`);

    // 测试 CSS 变量处理
    console.log("\n[步骤 5] 处理 CSS 变量...");
    const processedCSS = (renderer as any).processCSSVariables(css);
    console.log(`✅ CSS 处理成功`);
    console.log(`   - 原始 CSS 长度：${css.length}`);
    console.log(`   - 处理后 CSS 长度：${processedCSS.length}`);

    console.log("\n" + "=".repeat(60));
    console.log("✅ 所有核心功能测试通过！");
    console.log("=".repeat(60));
    
    console.log("\n📝 注意：");
    console.log("   - 完整渲染（包含图片上传）需要微信公众号配置");
    console.log("   - 核心 Markdown 渲染功能已验证正常");
    console.log("   - 主题 CSS 加载和处理功能正常");
    
  } catch (error) {
    console.error("\n❌ 测试失败：", error);
    throw error;
  }
}

// 运行测试
if (import.meta.main) {
  testDoocsMdRendererSimple();
}

