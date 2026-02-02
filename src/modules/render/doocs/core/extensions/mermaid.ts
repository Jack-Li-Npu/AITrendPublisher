import type { MarkedExtension } from 'npm:marked'
import { simpleHash } from '../utils/basicHelpers.ts'

/**
 * Mermaid 扩展插件
 */
export function markedMermaid(): MarkedExtension {
  return {
    extensions: [
      {
        name: 'mermaid',
        level: 'block' as const,
        start(src: string) {
          return src.match(/^```mermaid/m)?.index
        },
        tokenizer(src: string) {
          const match = /^```mermaid\r?\n([\s\S]*?)\r?\n```/.exec(src)
          if (match) {
            return {
              type: 'mermaid',
              raw: match[0],
              text: match[1].trim(),
            }
          }
        },
        renderer(token: any) {
          const code = token.text
          const cacheKey = simpleHash(code)
          const id = `mermaid-${cacheKey}`

          // 核心逻辑：返回带有特殊标记的占位符
          // <!--mermaid-start--> 和 <!--mermaid-end--> 用于在预览时被识别并异步渲染
          return `<!--mermaid-start--><div id="${id}" class="mermaid-diagram" data-mermaid-code="${encodeURIComponent(code)}">
            <pre class="mermaid">${code}</pre>
          </div><!--mermaid-end-->`
        },
      },
    ],
  }
}
