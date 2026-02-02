import hljs from 'npm:highlight.js'
import type { LanguageFn } from 'npm:highlight.js'
import bash from 'npm:highlight.js/lib/languages/bash'
import c from 'npm:highlight.js/lib/languages/c'
import cpp from 'npm:highlight.js/lib/languages/cpp'
import csharp from 'npm:highlight.js/lib/languages/csharp'
import css from 'npm:highlight.js/lib/languages/css'
import diff from 'npm:highlight.js/lib/languages/diff'
import go from 'npm:highlight.js/lib/languages/go'
import graphql from 'npm:highlight.js/lib/languages/graphql'
import ini from 'npm:highlight.js/lib/languages/ini'
import java from 'npm:highlight.js/lib/languages/java'
import javascript from 'npm:highlight.js/lib/languages/javascript'
import json from 'npm:highlight.js/lib/languages/json'
import kotlin from 'npm:highlight.js/lib/languages/kotlin'
import less from 'npm:highlight.js/lib/languages/less'
import lua from 'npm:highlight.js/lib/languages/lua'
import makefile from 'npm:highlight.js/lib/languages/makefile'
import markdown from 'npm:highlight.js/lib/languages/markdown'
import objectivec from 'npm:highlight.js/lib/languages/objectivec'
import perl from 'npm:highlight.js/lib/languages/perl'
import php from 'npm:highlight.js/lib/languages/php'
import phpTemplate from 'npm:highlight.js/lib/languages/php-template'
import plaintext from 'npm:highlight.js/lib/languages/plaintext'
import python from 'npm:highlight.js/lib/languages/python'
import pythonRepl from 'npm:highlight.js/lib/languages/python-repl'
import r from 'npm:highlight.js/lib/languages/r'
import ruby from 'npm:highlight.js/lib/languages/ruby'
import rust from 'npm:highlight.js/lib/languages/rust'
import scss from 'npm:highlight.js/lib/languages/scss'
import shell from 'npm:highlight.js/lib/languages/shell'
import sql from 'npm:highlight.js/lib/languages/sql'
import swift from 'npm:highlight.js/lib/languages/swift'
import typescript from 'npm:highlight.js/lib/languages/typescript'
import vbnet from 'npm:highlight.js/lib/languages/vbnet'
import wasm from 'npm:highlight.js/lib/languages/wasm'
import xml from 'npm:highlight.js/lib/languages/xml'
import yaml from 'npm:highlight.js/lib/languages/yaml'

export const COMMON_LANGUAGES: Record<string, LanguageFn> = {
  bash,
  c,
  cpp,
  csharp,
  css,
  diff,
  go,
  graphql,
  ini,
  java,
  javascript,
  json,
  kotlin,
  less,
  lua,
  makefile,
  markdown,
  objectivec,
  perl,
  php,
  'php-template': phpTemplate,
  plaintext,
  python,
  'python-repl': pythonRepl,
  r,
  ruby,
  rust,
  scss,
  shell,
  sql,
  swift,
  typescript,
  vbnet,
  wasm,
  xml,
  yaml,
}

/**
 * 格式化高亮后的代码，处理空格和制表符
 */
function formatHighlightedCode(html: string, preserveNewlines = false): string {
  let formatted = html
  // 将 span 之间的空格移到 span 内部
  formatted = formatted.replace(/(<span[^>]*>[^<]*<\/span>)(\s+)(<span[^>]*>[^<]*<\/span>)/g, (_: string, span1: string, spaces: string, span2: string) => span1 + span2.replace(/^(<span[^>]*>)/, `$1${spaces}`))
  formatted = formatted.replace(/(\s+)(<span[^>]*>)/g, (_: string, spaces: string, span: string) => span.replace(/^(<span[^>]*>)/, `$1${spaces}`))
  // 替换制表符为4个空格
  formatted = formatted.replace(/\t/g, `    `)

  if (preserveNewlines) {
    // 替换换行符为 <br/>，并将空格转换为 &nbsp;
    formatted = formatted.replace(/\r\n/g, `<br/>`).replace(/\n/g, `<br/>`).replace(/(>[^<]+)|(^[^<]+)/g, (str: string) => str.replace(/\s/g, `&nbsp;`))
  }
  else {
    // 只将空格转换为 &nbsp;
    formatted = formatted.replace(/(>[^<]+)|(^[^<]+)/g, (str: string) => str.replace(/\s/g, `&nbsp;`))
  }

  return formatted
}

/**
 * 高亮代码并格式化（支持行号）
 */
export function highlightAndFormatCode(text: string, language: string, hljsInstance: any, showLineNumber: boolean): string {
  let highlighted = ``

  if (showLineNumber) {
    const rawLines = text.replace(/\r\n/g, `\n`).split(`\n`)

    const highlightedLines = rawLines.map((lineRaw) => {
      const lineHtml = hljsInstance.highlight(lineRaw, { language }).value
      const formatted = formatHighlightedCode(lineHtml, false)
      return formatted === `` ? `&nbsp;` : formatted
    })

    const lineNumbersHtml = highlightedLines.map((_, idx) => `<section style="padding:0 10px 0 0;line-height:1.75">${idx + 1}</section>`).join(``)
    const codeInnerHtml = highlightedLines.join(`<br/>`)
    const codeLinesHtml = `<div style="white-space:pre;min-width:max-content;line-height:1.75">${codeInnerHtml}</div>`
    const lineNumberColumnStyles = `text-align:right;padding:8px 0;border-right:1px solid rgba(0,0,0,0.04);user-select:none;background:var(--code-bg,transparent);`

    highlighted = `
      <section style="display:flex;align-items:flex-start;overflow-x:hidden;overflow-y:auto;width:100%;max-width:100%;padding:0;box-sizing:border-box">
        <section class="line-numbers" style="${lineNumberColumnStyles}">${lineNumbersHtml}</section>
        <section class="code-scroll" style="flex:1 1 auto;overflow-x:auto;overflow-y:visible;padding:8px;min-width:0;box-sizing:border-box">${codeLinesHtml}</section>
      </section>
    `
  }
  else {
    const rawHighlighted = hljsInstance.highlight(text, { language }).value
    highlighted = formatHighlightedCode(rawHighlighted, true)
  }

  return highlighted
}
