export interface ContentSummarizer {
  summarize(content: string, options?: Record<string, any>): Promise<Summary>;
  generateTitle(
    content: string,
    options?: Record<string, any>,
  ): Promise<string>;
}

export interface Summary {
  title: string;
  content: string;
  keywords?: string[];
}
