import type { MarkedExtension } from 'npm:marked'
import { deflateSync } from 'npm:fflate'
import { simpleHash } from '../utils/basicHelpers.ts'

export interface PlantUMLOptions {
  serverUrl?: string
  format?: 'svg' | 'png'
  inlineSvg?: boolean
  className?: string
}

/**
 * PlantUML 专用 6-bit 编码映射
 */
function encode6bit(b: number): string {
  if (b < 10) return String.fromCharCode(48 + b) // 0-9
  b -= 10
  if (b < 26) return String.fromCharCode(65 + b) // A-Z
  b -= 26
  if (b < 26) return String.fromCharCode(97 + b) // a-z
  b -= 26
  if (b === 0) return '-'
  if (b === 1) return '_'
  return '?'
}

function append3bytes(b1: number, b2: number, b3: number): string {
  const c1 = b1 >> 2
  const c2 = ((b1 & 0x3) << 4) | (b2 >> 4)
  const c3 = ((b2 & 0xf) << 2) | (b3 >> 6)
  const c4 = b3 & 0x3f
  return encode6bit(c1 & 0x3f) +
         encode6bit(c2 & 0x3f) +
         encode6bit(c3 & 0x3f) +
         encode6bit(c4 & 0x3f)
}

/**
 * PlantUML 专用 Base64 编码实现
 */
function encode64(data: Uint8Array): string {
  let r = ''
  for (let i = 0; i < data.length; i += 3) {
    if (i + 2 < data.length) {
      r += append3bytes(data[i], data[i + 1], data[i + 2])
    } else if (i + 1 < data.length) {
      r += append3bytes(data[i], data[i + 1], 0)
    } else {
      r += append3bytes(data[i], 0, 0)
    }
  }
  return r
}

/**
 * 将 PlantUML 代码编码为 URL 安全格式
 */
export function encodePlantUML(plantumlCode: string): string {
  // 自动补全 @startuml/@enduml
  let puml = plantumlCode.trim()
  if (!puml.startsWith('@start')) {
    puml = `@startuml\n${puml}\n@enduml`
  }

  const data = new TextEncoder().encode(puml)
  // Deflate 压缩 (fflate 库, level: 9)
  const compressed = deflateSync(data, { level: 9 })
  return encode64(compressed)
}

/**
 * PlantUML 扩展插件
 */
export function markedPlantuml(options: PlantUMLOptions = {}): MarkedExtension {
  const {
    serverUrl = 'https://www.plantuml.com/plantuml',
    format = 'svg',
    inlineSvg = true,
    className = 'plantuml-diagram'
  } = options

  return {
    extensions: [
      {
        name: 'plantuml',
        level: 'block' as const,
        start(src: string) {
          return src.match(/^```plantuml/m)?.index
        },
        tokenizer(src: string) {
          const match = /^```plantuml\r?\n([\s\S]*?)\r?\n```/.exec(src)
          if (match) {
            return {
              type: 'plantuml',
              raw: match[0],
              text: match[1].trim()
            }
          }
        },
        renderer(token: any) {
          const code = token.text
          const cacheKey = simpleHash(code)
          const encoded = encodePlantUML(code)
          const imageUrl = `${serverUrl}/${format}/${encoded}`
          const id = `plantuml-${cacheKey}`

          // 返回带有占位符的 HTML，由前端异步处理
          return `<div id="${id}" class="${className}" data-plantuml-code="${encodeURIComponent(code)}" data-plantuml-url="${imageUrl}" data-plantuml-inline="${inlineSvg}">
            <img src="${imageUrl}" alt="PlantUML Diagram" style="max-width: 100%;" />
          </div>`
        }
      }
    ]
  }
}
