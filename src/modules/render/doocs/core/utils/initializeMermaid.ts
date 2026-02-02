/**
 * Mermaid 初始化工具
 */

export async function initializeMermaid() {
  if (typeof window !== 'undefined' && (window as any).mermaid) {
    const mermaid = (window as any).mermaid
    mermaid.initialize({ 
      startOnLoad: false,
      theme: 'default',
      securityLevel: 'loose',
    })
    return mermaid
  } else {
    // Deno 环境下，由于 Mermaid 强依赖浏览器 DOM，
    // 后端渲染通常返回占位符，由前端或后续流程处理。
    return null
  }
}
