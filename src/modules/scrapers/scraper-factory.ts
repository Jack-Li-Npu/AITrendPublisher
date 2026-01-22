import { ContentScraper, ScraperOptions } from "@src/modules/interfaces/scraper.interface.ts";
import { ConfigManager } from "@src/utils/config/config-manager.ts";

// Import available scrapers
import { FireCrawlScraper } from "./fireCrawl.scraper.ts";

/**
 * Scraper Provider Type Enum
 */
export enum ScraperType {
  FIRECRAWL = "FIRECRAWL",
}

/**
 * Scraper Provider Type Map
 */
export interface ScraperTypeMap {
  [ScraperType.FIRECRAWL]: FireCrawlScraper;
}

/**
 * Scraper Factory Class
 */
export class ScraperFactory {
  private static instance: ScraperFactory;
  private scrapers: Map<string, ContentScraper> = new Map();

  private constructor() {
  }

  public static getInstance(): ScraperFactory {
    if (!ScraperFactory.instance) {
      ScraperFactory.instance = new ScraperFactory();
    }
    return ScraperFactory.instance;
  }

  public getScraper(type: ScraperType): ContentScraper {
    if (this.scrapers.has(type)) {
      return this.scrapers.get(type)!;
    }

    let scraper: ContentScraper;
    switch (type) {
      case ScraperType.FIRECRAWL:
        scraper = new FireCrawlScraper();
        break;
      default:
        throw new Error(`Unsupported ScraperType: ${type}`);
    }

    this.scrapers.set(type, scraper);
    return scraper;
  }
}

// Example Usage (optional, for testing or demonstration within this file)
/*
async function mainFactoryTest() {
  // This requires environment variables for Jina, Firecrawl etc. to be set
  // to fully test the underlying scrapers' functionality.
  // Here we are just testing the factory instantiation.

  try {
    const factory = ScraperFactory.getInstance();

    console.log("Attempting to get JINA_READER scraper...");
    const jinaReader = factory.getScraper(ScraperType.JINA_READER);
    console.log("JINA_READER scraper instance:", jinaReader instanceof JinaScraper ? "OK" : "Failed");
    // await jinaReader.scrape("https://example.com"); // Requires JINA_API_KEY

    console.log("\nAttempting to get JINA_DEEPSEARCH scraper...");
    const jinaDeepSearch = factory.getScraper(ScraperType.JINA_DEEPSEARCH);
    console.log("JINA_DEEPSEARCH scraper instance:", jinaDeepSearch instanceof JinaDeepSearchScraper ? "OK" : "Failed");
    // await jinaDeepSearch.scrape("What is Deno?"); // Requires JINA_API_KEY

    console.log("\nAttempting to get FIRECRAWL scraper...");
    const firecrawlScraper = factory.getScraper(ScraperType.FIRECRAWL);
    console.log("FIRECRAWL scraper instance:", firecrawlScraper instanceof FireCrawlScraper ? "OK" : "Failed");
    // await firecrawlScraper.scrape("https://deno.land"); // Requires FIRECRAWL_API_KEY

    console.log("\nAttempting to get RSSHUB scraper...");
    const rsshubScraper = factory.getScraper(ScraperType.RSSHUB);
    console.log("RSSHUB scraper instance:", rsshubScraper instanceof RsshubScraper ? "OK" : "Failed");
    // await rsshubScraper.scrape("/github/trending/daily/javascript"); // Example RSSHub path

    console.log("\nAttempting to get HELLOGITHUB scraper...");
    const helloGithubScraper = factory.getScraper(ScraperType.HELLOGITHUB);
    console.log("HELLOGITHUB scraper instance:", helloGithubScraper instanceof HellogithubScraper ? "OK" : "Failed");
     // await helloGithubScraper.scrape("some_source_id_if_needed");

    console.log("\nAttempting to get TWITTER scraper...");
    const twitterScraper = factory.getScraper(ScraperType.TWITTER);
    console.log("TWITTER scraper instance:", twitterScraper instanceof TwitterScraper ? "OK" : "Failed");
     // await twitterScraper.scrape("elonmusk"); // Example Twitter username

  } catch (error) {
    console.error("\nError during ScraperFactory test:", error.message);
  }
}

// To run this example:
// 1. Ensure necessary API keys (JINA_API_KEY, etc.) are set if you uncomment scrape calls.
// 2. Uncomment the following line and run: `deno run -A src/modules/scrapers/scraper-factory.ts`
// mainFactoryTest();
*/
