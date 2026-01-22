import { FireCrawlScraper, quickScrape, smartExtract } from "../fireCrawl.scraper.ts";
import { ConfigManager } from "@src/utils/config/config-manager.ts";
import { Logger } from "@zilla/logger";

const logger = new Logger("firecrawl-test");

/**
 * FireCrawl v2 API 测试
 * 运行前请确保已配置 FIRE_CRAWL_API_KEY
 */

async function testSimpleScrape() {
  logger.info("=== 测试简单抓取 ===");
  
  try {
    const scraper = new FireCrawlScraper();
    const content = await scraper.scrapeSimple("https://news.ycombinator.com/");
    
    logger.info(`抓取成功，内容长度: ${content.length} 字符`);
    logger.info(`内容预览: ${content.slice(0, 500)}...`);
  } catch (error) {
    logger.error("简单抓取失败:", error);
  }
}

async function testFullScrape() {
  logger.info("=== 测试完整抓取（带 LLM 提取）===");
  
  try {
    const scraper = new FireCrawlScraper();
    const contents = await scraper.scrape("https://news.ycombinator.com/");
    
    logger.info(`获取到 ${contents.length} 条内容`);
    
    for (const content of contents.slice(0, 3)) {
      logger.info(`\n--- ${content.title} ---`);
      logger.info(`URL: ${content.url}`);
      logger.info(`日期: ${content.publishDate}`);
      logger.info(`内容: ${content.content.slice(0, 200)}...`);
    }
  } catch (error) {
    logger.error("完整抓取失败:", error);
  }
}

async function testQuickScrape() {
  logger.info("=== 测试快速抓取函数 ===");
  
  try {
    const markdown = await quickScrape("https://openai.com/blog/");
    logger.info(`快速抓取成功，内容长度: ${markdown.length}`);
    logger.info(`预览: ${markdown.slice(0, 300)}...`);
  } catch (error) {
    logger.error("快速抓取失败:", error);
  }
}

async function testSmartExtract() {
  logger.info("=== 测试智能提取 ===");
  
  try {
    const result = await smartExtract<{ title: string; items: string[] }>(
      "https://github.com/trending",
      `
        Extract the top 5 trending repositories from this page.
        Return JSON format: { "title": "Page title", "items": ["repo1", "repo2", ...] }
      `,
      {
        type: "object",
        properties: {
          title: { type: "string" },
          items: { type: "array", items: { type: "string" } },
        },
      },
    );
    
    logger.info("智能提取结果:", result);
  } catch (error) {
    logger.error("智能提取失败:", error);
  }
}

async function testMetadata() {
  logger.info("=== 测试元数据获取 ===");
  
  try {
    const scraper = new FireCrawlScraper();
    const metadata = await scraper.getMetadata("https://www.36kr.com/");
    
    logger.info("元数据:", metadata);
  } catch (error) {
    logger.error("元数据获取失败:", error);
  }
}

async function testBatchScrape() {
  logger.info("=== 测试批量抓取 ===");
  
  try {
    const scraper = new FireCrawlScraper();
    const urls = [
      "https://news.ycombinator.com/",
      "https://techcrunch.com/",
    ];
    
    const contents = await scraper.scrapeBatch(urls);
    logger.info(`批量抓取完成，共获取 ${contents.length} 条内容`);
    
    for (const content of contents.slice(0, 5)) {
      logger.info(`- ${content.title}`);
    }
  } catch (error) {
    logger.error("批量抓取失败:", error);
  }
}

async function testChineseSites() {
  logger.info("=== 测试中文网站抓取 ===");
  
  try {
    const scraper = new FireCrawlScraper();
    
    // 36氪
    logger.info("\n--- 36氪 ---");
    const kr36 = await scraper.scrape("https://www.36kr.com/newsflashes");
    logger.info(`36氪: 获取到 ${kr36.length} 条内容`);
    
    // 机器之心
    logger.info("\n--- 机器之心 ---");
    const jiqizhixin = await scraper.scrape("https://www.jiqizhixin.com/");
    logger.info(`机器之心: 获取到 ${jiqizhixin.length} 条内容`);
    
  } catch (error) {
    logger.error("中文网站抓取失败:", error);
  }
}

async function runAllTests() {
  logger.info("开始 FireCrawl v2 API 测试...\n");
  
  // 检查 API Key
  const configManager = ConfigManager.getInstance();
  await configManager.initDefaultConfigSources();
  
  const apiKey = await configManager.get("FIRE_CRAWL_API_KEY");
  if (!apiKey) {
    logger.error("❌ FIRE_CRAWL_API_KEY 未配置！");
    logger.info("请在 .env 文件中添加: FIRE_CRAWL_API_KEY=your-api-key");
    logger.info("获取 API Key: https://www.firecrawl.dev/");
    return;
  }
  
  logger.info("✓ API Key 已配置\n");
  
  try {
    // 运行测试
    await testSimpleScrape();
    console.log("\n");
    
    await testFullScrape();
    console.log("\n");
    
    await testQuickScrape();
    console.log("\n");
    
    await testMetadata();
    console.log("\n");
    
    // 可选测试（消耗更多 API 配额）
    // await testSmartExtract();
    // await testBatchScrape();
    // await testChineseSites();
    
    logger.info("✓ 所有测试完成！");
  } catch (error) {
    logger.error("测试执行失败:", error);
  }
}

// 运行测试
if (import.meta.main) {
  runAllTests().catch((error) => {
    logger.error("测试执行出错:", error);
    Deno.exit(1);
  });
}
