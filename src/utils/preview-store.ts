export interface ArticlePreview {
  id: string;
  title: string;
  html: string;
  markdown: string;
  coverImageUrl?: string;
  articles?: any[];
  introduction?: string;
  footer?: string;
  template?: string;
  metadata?: any;
  localPath?: string; // 保存本地文件路径
}

/**
 * 预览存储器 - 临时存放等待发布的内容
 */
export class PreviewStore {
  private static instance: PreviewStore;
  private currentPreview: ArticlePreview | null = null;

  private constructor() {}

  public static getInstance(): PreviewStore {
    if (!PreviewStore.instance) {
      PreviewStore.instance = new PreviewStore();
    }
    return PreviewStore.instance;
  }

  public setPreview(preview: ArticlePreview) {
    this.currentPreview = preview;
  }

  public getPreview(): ArticlePreview | null {
    return this.currentPreview;
  }

  public clear() {
    this.currentPreview = null;
  }
}
