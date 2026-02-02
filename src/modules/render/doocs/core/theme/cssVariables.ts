export interface CSSVariableConfig {
  primaryColor: string;
  fontFamily: string;
  fontSize: string;
}

/**
 * 生成 CSS 变量字符串
 */
export function generateCSSVariables(config: CSSVariableConfig): string {
  return `
:root {
  --md-primary-color: ${config.primaryColor};
  --md-font-family: ${config.fontFamily};
  --md-font-size: ${config.fontSize};
}
  `;
}
