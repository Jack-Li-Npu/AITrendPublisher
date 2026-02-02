/**
 * Markdown 处理辅助工具
 */

/**
 * 在进行 XSS 过滤或进一步处理 HTML 前，保护 Mermaid 等特殊内容
 */
export function protectSpecialContents(html: string): { html: string, protectedContents: string[] } {
  const protectedContents: string[] = []
  
  // 保护 Mermaid 内容
  const newHtml = html.replace(
    /<!--mermaid-start-->[\s\S]*?<!--mermaid-end-->/g,
    (match) => {
      protectedContents.push(match)
      return `<span data-md-protected="${protectedContents.length - 1}"></span>`
    }
  )
  
  return { html: newHtml, protectedContents }
}

/**
 * 还原被保护的内容
 */
export function restoreSpecialContents(html: string, protectedContents: string[]): string {
  return html.replace(
    /<span data-md-protected="(\d+)"><\/span>/g,
    (_, index) => {
      return protectedContents[parseInt(index)] || ''
    }
  )
}
