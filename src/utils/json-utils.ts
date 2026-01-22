/**
 * JSON 工具函数
 * 用于处理 LLM 返回的可能包含 Markdown 代码块的 JSON 内容
 */

/**
 * 修复 JSON 字符串中的转义问题
 * 处理 LaTeX 公式、换行符、控制字符、Markdown 行末反斜杠等
 * 
 * 使用正则表达式在字符串值内部修复转义问题
 */
function fixJsonEscaping(jsonString: string): string {
  let result = jsonString;
  
  // 0. 预处理：修复 Markdown 行末反斜杠问题（如 "_\7" 变成 "_\\7"）
  // 匹配模式：反斜杠后面跟着数字或字母（但不是有效的 JSON 转义字符）
  result = result.replace(/"([^"]*)":/g, (match) => match); // 保持 key 不变
  result = result.replace(/:\s*"([^"]*)"/g, (match, value) => {
    // 只处理值部分
    const fixed = value.replace(/\\([0-9A-Za-z])/g, (m: string, next: string) => {
      // 检查是否是有效的 JSON 转义字符
      if (['n', 'r', 't', 'b', 'f', 'u'].includes(next)) {
        return m; // 保留有效转义
      }
      // 无效转义，添加额外的反斜杠
      return `\\\\${next}`;
    });
    return `: "${fixed}"`;
  });
  
  // 1. 修复字符串值内部未转义的反斜杠（LaTeX 公式中的 \mathcal 等）
  // 匹配：在双引号内的内容，查找未转义的反斜杠（后面不是有效转义字符）
  result = result.replace(/"([^"\\]|\\.)*"/g, (match) => {
    // 跳过开头的 " 和结尾的 "
    let content = match.slice(1, -1);
    let fixed = '"';
    let i = 0;
    
    while (i < content.length) {
      const char = content[i];
      
      if (char === '\\') {
        const nextChar = content[i + 1];
        // 检查是否是有效的转义序列
        if (nextChar && ['"', '\\', '/', 'b', 'f', 'n', 'r', 't'].includes(nextChar)) {
          // 有效转义序列，保留
          fixed += char + nextChar;
          i += 2;
        } else if (nextChar === 'u' && /^[0-9a-fA-F]{4}/.test(content.substring(i + 2, i + 6))) {
          // Unicode 转义序列
          fixed += content.substring(i, i + 6);
          i += 6;
        } else {
          // 无效的转义序列（LaTeX 公式中的单个反斜杠），转义它
          fixed += '\\\\';
          i += 1;
        }
      } else if (char === '\n') {
        fixed += '\\n';
        i += 1;
      } else if (char === '\r') {
        fixed += '\\r';
        i += 1;
      } else if (char === '\t') {
        fixed += '\\t';
        i += 1;
      } else if (char === '\b') {
        fixed += '\\b';
        i += 1;
      } else if (char === '\f') {
        fixed += '\\f';
        i += 1;
      } else if (char.charCodeAt(0) < 0x20) {
        // 其他控制字符
        fixed += `\\u${char.charCodeAt(0).toString(16).padStart(4, '0')}`;
        i += 1;
      } else {
        fixed += char;
        i += 1;
      }
    }
    
    fixed += '"';
    return fixed;
  });
  
  return result;
}

/**
 * 清理并解析 JSON 字符串
 * 处理 LLM 返回的可能包含 markdown 代码块标记的 JSON
 * 
 * @param content 可能包含 markdown 代码块的 JSON 字符串
 * @returns 解析后的对象
 */
export function parseJsonFromLLM<T = any>(content: string): T {
  if (!content) {
    throw new Error("内容为空");
  }

  // 清理内容
  let cleanedContent = content.trim();

  // 移除 markdown 代码块标记
  // 匹配 ```json ... ``` 或 ``` ... ```
  const codeBlockRegex = /^```(?:json)?\s*\n?([\s\S]*?)\n?```$/;
  const match = cleanedContent.match(codeBlockRegex);
  if (match) {
    cleanedContent = match[1].trim();
  }

  // 也处理只有开头的 ```json 情况
  if (cleanedContent.startsWith("```json")) {
    cleanedContent = cleanedContent.slice(7);
  } else if (cleanedContent.startsWith("```")) {
    cleanedContent = cleanedContent.slice(3);
  }

  // 移除结尾的 ```
  if (cleanedContent.endsWith("```")) {
    cleanedContent = cleanedContent.slice(0, -3);
  }

  cleanedContent = cleanedContent.trim();

  // 尝试解析 JSON
  try {
    return JSON.parse(cleanedContent) as T;
  } catch (error) {
    // 如果是转义字符错误，尝试修复：转义字符串值中的未转义字符
    if (error instanceof SyntaxError && (
      error.message.includes("escaped") || 
      error.message.includes("Bad escaped") ||
      error.message.includes("Bad control character") ||
      error.message.includes("Unexpected token")
    )) {
      try {
        // 智能修复 JSON 字符串中的转义问题
        let fixedContent = fixJsonEscaping(cleanedContent);
        
        return JSON.parse(fixedContent) as T;
      } catch (fixError) {
        // 修复失败，继续原有的错误处理逻辑
      }
    }
    // 如果还是失败，尝试提取第一个完整的 JSON 对象或数组
    const jsonObjectMatch = cleanedContent.match(/\{[\s\S]*\}/);
    if (jsonObjectMatch) {
      try {
        return JSON.parse(jsonObjectMatch[0]) as T;
      } catch {
        // 继续尝试数组
      }
    }

    const jsonArrayMatch = cleanedContent.match(/\[[\s\S]*\]/);
    if (jsonArrayMatch) {
      try {
        return JSON.parse(jsonArrayMatch[0]) as T;
      } catch {
        // 都失败了
      }
    }

    // 提取错误位置信息（如果有）
    let errorPosition = "";
    if (error instanceof SyntaxError && error.message.includes("position")) {
      const positionMatch = error.message.match(/position (\d+)/);
      if (positionMatch) {
        const pos = parseInt(positionMatch[1]);
        const start = Math.max(0, pos - 100);
        const end = Math.min(cleanedContent.length, pos + 100);
        errorPosition = `\n错误位置附近的内容: ...${cleanedContent.substring(start, end)}...`;
      }
    }
    
    throw new Error(
      `JSON 解析失败: ${error instanceof Error ? error.message : "未知错误"}\n原始内容（前200字符）: ${content.substring(0, 200)}...${errorPosition}`
    );
  }
}

/**
 * 安全地解析 JSON，失败时返回默认值
 * 
 * @param content JSON 字符串
 * @param defaultValue 解析失败时返回的默认值
 * @returns 解析后的对象或默认值
 */
export function safeParseJsonFromLLM<T>(content: string, defaultValue: T): T {
  try {
    return parseJsonFromLLM<T>(content);
  } catch {
    return defaultValue;
  }
}

