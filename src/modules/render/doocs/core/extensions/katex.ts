import type { MarkedExtension } from 'npm:marked'

export interface MarkedKatexOptions {
  nonStandard?: boolean
}

const inlineRule = /^(\${1,2})(?!\$)((?:\\.|[^\\\n])*?(?:\\.|[^\\\n$]))\1(?=[\s?!.,:？！。，：]|$)/
const inlineRuleNonStandard = /^(\${1,2})(?!\$)((?:\\.|[^\\\n])*?(?:\\.|[^\\\n$]))\1/ // Non-standard, even if there are no spaces before and after $ or $$, try to parse

const blockRule = /^\s{0,3}(\${1,2})[ \t]*\n([\s\S]+?)\n\s{0,3}\1[ \t]*(?:\n|$)/

// LaTeX style rules for \( ... \) and \[ ... \]
const inlineLatexRule = /^\\\(([^\\]*(?:\\.[^\\]*)*?)\\\)/
const blockLatexRule = /^\\\[([^\\]*(?:\\.[^\\]*)*?)\\\]/

function createRenderer(display: boolean, withStyle: boolean = true) {
  return (token: any) => {
    // @ts-expect-error MathJax is a global variable
    if (typeof window !== 'undefined' && window.MathJax) {
      window.MathJax.texReset()
      const mjxContainer = window.MathJax.tex2svg(token.text, { display })
      const svg = mjxContainer.firstChild
      const width = svg.style[`min-width`] || svg.getAttribute(`width`)
      svg.removeAttribute(`width`)

      if (withStyle) {
        svg.style.display = `initial`
        svg.style.setProperty(`max-width`, `300vw`, `important`)
        svg.style.flexShrink = `0`
        svg.style.width = width
      }

      if (!display) {
        return `<span class="katex-inline">${svg.outerHTML}</span>`
      }

      return `<section class="katex-block">${svg.outerHTML}</section>`
    }
    return token.raw;
  }
}

function inlineKatex(options: MarkedKatexOptions | undefined, renderer: any) {
  const nonStandard = options && options.nonStandard
  const ruleReg = nonStandard ? inlineRuleNonStandard : inlineRule
  return {
    name: `inlineKatex`,
    level: `inline` as const,
    start(src: string) {
      let index
      let indexSrc = src

      while (indexSrc) {
        index = indexSrc.indexOf(`$`)
        if (index === -1) {
          return
        }
        const f = nonStandard ? index > -1 : index === 0 || indexSrc.charAt(index - 1) === ` `
        if (f) {
          const possibleKatex = indexSrc.substring(index)

          if (possibleKatex.match(ruleReg)) {
            return index
          }
        }

        indexSrc = indexSrc.substring(index + 1).replace(/^\$+/, ``)
      }
    },
    tokenizer(src: string) {
      const match = src.match(ruleReg)
      if (match) {
        return {
          type: `inlineKatex`,
          raw: match[0],
          text: match[2].trim(),
          displayMode: match[1].length === 2,
        }
      }
    },
    renderer,
  }
}

function blockKatex(_options: MarkedKatexOptions | undefined, renderer: any) {
  return {
    name: `blockKatex`,
    level: `block` as const,
    tokenizer(src: string) {
      const match = src.match(blockRule)
      if (match) {
        return {
          type: `blockKatex`,
          raw: match[0],
          text: match[2].trim(),
          displayMode: match[1].length === 2,
        }
      }
    },
    renderer,
  }
}

function inlineLatexKatex(_options: MarkedKatexOptions | undefined, renderer: any) {
  return {
    name: `inlineLatexKatex`,
    level: `inline` as const,
    start(src: string) {
      const index = src.indexOf(`\\(`)
      return index !== -1 ? index : undefined
    },
    tokenizer(src: string) {
      const match = src.match(inlineLatexRule)
      if (match) {
        return {
          type: `inlineLatexKatex`,
          raw: match[0],
          text: match[1].trim(),
          displayMode: false,
        }
      }
    },
    renderer,
  }
}

function blockLatexKatex(_options: MarkedKatexOptions | undefined, renderer: any) {
  return {
    name: `blockLatexKatex`,
    level: `block` as const,
    start(src: string) {
      const index = src.indexOf(`\\[`)
      return index !== -1 ? index : undefined
    },
    tokenizer(src: string) {
      const match = src.match(blockLatexRule)
      if (match) {
        return {
          type: `blockLatexKatex`,
          raw: match[0],
          text: match[1].trim(),
          displayMode: true,
        }
      }
    },
    renderer,
  }
}

export function MDKatex(options: MarkedKatexOptions | undefined, withStyle: boolean = true): MarkedExtension {
  return {
    extensions: [
      inlineKatex(options, createRenderer(false, withStyle)),
      blockKatex(options, createRenderer(true, withStyle)),
      inlineLatexKatex(options, createRenderer(false, withStyle)),
      blockLatexKatex(options, createRenderer(true, withStyle)),
    ],
  }
}
