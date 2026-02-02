/**
 * CSS 主题加载逻辑 (Deno 环境适配版)
 */

const currentDir = new URL('.', import.meta.url).pathname;

async function loadCSS(filename: string) {
  return await Deno.readTextFile(`${currentDir}${filename}`);
}

export const themeFiles = {
  default: 'default.css',
  elegant: 'elegant.css',
  simple: 'simple.css',
};

export type ThemeName = keyof typeof themeFiles;

export async function getThemeCSS(name: ThemeName): Promise<string> {
  const filename = themeFiles[name] || themeFiles.default;
  return await loadCSS(filename);
}
