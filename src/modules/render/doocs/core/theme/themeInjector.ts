/**
 * 样式注入器（前端预览专用）
 */
export class ThemeInjector {
  private styleElement: HTMLStyleElement | null = null;

  inject(cssContent: string): void {
    if (typeof document === 'undefined') return;

    if (!this.styleElement) {
      this.styleElement = document.createElement('style');
      this.styleElement.id = 'md-theme-variables';
      document.head.appendChild(this.styleElement);
    }
    this.styleElement.textContent = cssContent;
  }
}

let instance: ThemeInjector | null = null;

export function getThemeInjector(): ThemeInjector {
  if (!instance) {
    instance = new ThemeInjector();
  }
  return instance;
}
