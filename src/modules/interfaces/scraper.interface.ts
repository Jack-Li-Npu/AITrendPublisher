export interface ContentScraper {
  // 抓取指定数据源的内容
  scrape(sourceId: string, options?: ScraperOptions): Promise<ScrapedContent[]>;
}

export interface ScraperOptions {
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  filters?: Record<string, any>;
}

export interface ScrapedContent {
  id: string;
  title: string;
  content: string;
  url: string;
  publishDate: string;
  media?: Media[];
  metadata: Record<string, any>;
}

export interface Media {
  url: string;
  type: string;
  size: Size;
}

export interface Size {
  width: number;
  height: number;
}
