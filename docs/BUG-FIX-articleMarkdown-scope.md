# Bug 修复：articleMarkdown 作用域错误

## 🐛 问题描述

**错误信息**:
```
[ERROR] Step generate-article failed: articleMarkdown is not defined
ReferenceError: articleMarkdown is not defined
```

**出现位置**: `src/services/weixin-article.workflow.ts` line 598

**错误原因**: 

`articleMarkdown` 变量在 `try` 块内部定义（line 858），但在 `try` 块外部（line 910, 925）被使用，导致作用域错误。

```typescript
// ❌ 错误的代码结构
try {
  let articleMarkdown = `# ${generatedTitle}\n\n`;
  // ... 构建 Markdown 内容 ...
} catch (e) {
  // ...
}

// 这里访问 articleMarkdown 会报错！
previewStore.setPreview({
  markdown: articleMarkdown, // ❌ 作用域外访问
});

return {
  fullMarkdown: articleMarkdown, // ❌ 作用域外访问
};
```

## ✅ 解决方案

将 `articleMarkdown` 变量的定义和内容构建移到 `try` 块外部，确保它在所有需要使用的地方都可见。

```typescript
// ✅ 正确的代码结构

// 1. 在外部作用域定义变量
let articleMarkdown = `# ${generatedTitle}\n\n`;

// 2. 构建 Markdown 内容（也在外部）
if (contentMode === "SINGLE_URL" && processedContents.length > 0) {
  articleMarkdown += processedContents[0].content + "\n\n";
} else {
  if (introduction) {
    articleMarkdown += `${introduction}\n\n---\n\n`;
  }
  
  processedContents.forEach((content, index) => {
    articleMarkdown += `## ${content.title}\n\n${content.content}\n\n`;
    if (index < processedContents.length - 1) {
      articleMarkdown += `\n---\n\n`;
    }
  });
}

// 3. 然后在 try 块中使用（保存文章）
try {
  const articleStorage = new ArticleStorage();
  const savedPath = await articleStorage.saveArticle({
    title: generatedTitle,
    markdown: articleMarkdown, // ✅ 可以访问
    // ...
  });
} catch (storageError) {
  // ...
}

// 4. 在后续代码中使用（预览和返回）
previewStore.setPreview({
  markdown: articleMarkdown, // ✅ 可以访问
});

return {
  fullMarkdown: articleMarkdown, // ✅ 可以访问
};
```

## 📝 修改的文件

- `src/services/weixin-article.workflow.ts`
  - Line 852-876: 将 `articleMarkdown` 定义和内容构建移到 try 块外部

## 🧪 验证步骤

修复后，重新运行工作流：

```bash
# 1. 重启服务（应用修复）
# Ctrl+C 停止，然后：
deno task start

# 2. 在 UI 界面运行任务
# 访问 http://localhost:8000
# 选择任意模式（科技新闻/GitHub Trending/单链接）
# 点击"开始运行任务"

# 3. 检查日志
# 应该看到：
# [INFO] [文章存储] 文章已成功保存到本地: data/articles/...
# [INFO] [预览] 文章已缓存至预览存储器，用户可在 UI 界面查看
# ✅ 不再出现 "articleMarkdown is not defined" 错误
```

## 🎯 影响范围

**影响的功能**:
- ✅ 文章生成流程
- ✅ 文章本地存储
- ✅ 预览功能
- ✅ 返回 fullMarkdown 字段

**不影响的功能**:
- ✅ 数据爬取
- ✅ 内容排序
- ✅ AI 总结
- ✅ 图片处理
- ✅ 微信发布

## 📊 修复前后对比

| 项目 | 修复前 | 修复后 |
|------|--------|--------|
| `articleMarkdown` 定义位置 | try 块内部（line 858） | try 块外部（line 853） |
| 内容构建位置 | try 块内部 | try 块外部 |
| 作用域范围 | 仅 try 块内 | 整个步骤函数 |
| 错误状态 | ❌ ReferenceError | ✅ 正常运行 |
| 预览功能 | ❌ 失败 | ✅ 正常 |
| 文章存储 | ❌ 可能失败 | ✅ 正常 |

## 🔍 根本原因分析

这是一个典型的 **JavaScript/TypeScript 作用域问题**：

1. **块级作用域**: `let` 声明的变量是块级作用域，只在声明它的块（`{}`）内可见
2. **try-catch 块**: `try { }` 也是一个块，内部的 `let` 声明不会泄漏到外部
3. **变量提升**: `var` 会提升到函数作用域顶部，但 `let` 不会

## 💡 最佳实践

为了避免类似问题：

1. **提前声明**: 如果变量需要在多个块中使用，在最外层作用域声明
2. **最小化 try 块**: try 块只包含可能抛出异常的代码，其他逻辑移到外部
3. **使用 const**: 如果变量不需要重新赋值，优先使用 `const`
4. **代码审查**: 注意 `let`/`const` 的作用域范围

## 📚 相关资源

- [MDN: let](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/let)
- [MDN: Block scope](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/block)
- [MDN: try...catch](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/try...catch)

---

**修复日期**: 2026-01-23  
**修复版本**: v2.1.1  
**严重程度**: 🔴 高（阻塞核心功能）  
**状态**: ✅ 已修复
