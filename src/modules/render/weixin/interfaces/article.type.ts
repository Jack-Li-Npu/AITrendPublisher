import { Media } from "@src/modules/interfaces/scraper.interface.ts";

export interface GeneratedTemplate {
  id: string;
  title: string;
  content: string;
  url: string;
  publishDate: string;
  metadata: Record<string, any>;
}

export interface WeixinTemplate extends GeneratedTemplate {
  keywords: string[];
  media?: Media[];
}
