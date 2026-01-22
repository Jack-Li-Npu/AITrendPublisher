# 图片提取功能改进说明

## 更新日期
2026-01-21

## 概述
本次更新扩展了图片提取功能，支持更多图片格式，并新增了标题前图片提取功能。

## 主要改进

### 1. 扩展图片格式支持

#### 新增支持的格式
- **SVG** (`image/svg+xml`) - 矢量图，将转换为 PNG
- **AVIF** (`image/avif`) - 现代图片格式，将转换为 JPEG
- **BMP** (`image/bmp`) - 位图格式，将转换为 JPEG
- **TIFF** (`image/tiff`) - 标签图像文件格式，将转换为 JPEG

#### 原有支持的格式
- PNG (`image/png`)
- JPEG/JPG (`image/jpeg`)
- WebP (`image/webp`)
- GIF (`image/gif`)

### 2. 标题前图片提取功能

#### 功能说明
自动提取每个标题（`##` 或 `###`）前出现的图片，这些图片通常与标题内容相关。

#### 提取规则
- **检测范围**：标题前最多 5 行
- **提取优先级**：第一个匹配的图片
- **支持格式**：
  - Markdown 格式：`![alt](url)`
  - HTML 格式：`<img src="url">`

#### 使用场景
- 技术文档中的架构图、流程图
- 文章中的配图
- GitHub README 中的项目截图

## 技术实现

### 修改的文件

1. **`src/modules/scrapers/github-trending.scraper.ts`**
   - 扩展 `isValidImage()` 方法支持新格式
   - 扩展 `getImageType()` 方法识别新格式的 MIME 类型
   - 增强 `extractImagesFromMarkdown()` 方法提取标题前图片

2. **`src/modules/scrapers/fireCrawl.scraper.ts`**
   - 扩展 `isValidImageUrl()` 方法支持新格式
   - 扩展 `getImageMimeType()` 方法
   - 增强 `extractImagesFromContent()` 方法提取标题前图片

3. **`src/services/weixin-article.workflow.ts`**
   - 增强 `extractImageUrls()` 方法支持新格式
   - 新增 `extractImagesBeforeHeadings()` 方法提取标题前图片

4. **`src/modules/summarizer/ai.summarizer.ts`**
   - 更新 `extractImageUrlsFromMarkdown()` 方法支持新格式

5. **`src/utils/image/image-processor.ts`**
   - 添加 SVG 转 PNG 的处理逻辑
   - 添加 AVIF、BMP、TIFF 转 JPEG 的处理逻辑
   - 确保所有转换后的图片符合微信公众号尺寸要求（最大宽度 1080px）

6. **`src/prompts/summarizer.prompt.ts`**
   - 更新 `getArticleExtractionSystemPrompt()` 添加标题前图片提取说明

## 图片处理流程

### 格式转换策略
1. **无需转换**：PNG、JPEG、WebP（直接使用）
2. **转换为 PNG**：SVG（使用 sharp 或 imagescript）
3. **转换为 JPEG**：AVIF、BMP、TIFF（使用 sharp）

### 尺寸处理
- 所有图片统一调整到最大宽度 1080px
- 保持原始宽高比
- 如果转换后仍超过大小限制，进行二次压缩

### 过滤规则
以下类型的图片会被自动过滤：
- 图标文件（`.ico`、小尺寸 SVG 图标）
- 徽章图片（shields.io、badge 等）
- 追踪像素（1x1、spacer 等）
- 广告图片
- 人物肖像照（紧随人名/头衔出现的照片）

## 使用示例

### Markdown 内容示例
```markdown
![项目架构图](https://example.com/architecture.svg)

## 项目介绍

这是一个优秀的开源项目...

![功能演示](https://example.com/demo.png)

### 核心特性

项目具有以下特性...
```

### 提取结果
- 提取到 `architecture.svg`（标题前的图片）
- 提取到 `demo.png`（标题前的图片）
- SVG 自动转换为 PNG 格式
- 所有图片上传到微信 CDN 并替换原始 URL

## 注意事项

1. **SVG 转换**：如果 SVG 转换失败，会记录警告并跳过该图片，不影响主流程
2. **性能考虑**：标题前图片提取最多向前查找 5 行，避免性能问题
3. **去重机制**：所有提取的图片 URL 会自动去重，避免重复处理
4. **错误处理**：所有图片处理错误都不会中断主流程，只会记录日志

## 后续优化方向

1. 支持更多现代图片格式（如 HEIC）
2. 智能识别图片质量，优先提取高质量图片
3. 支持图片压缩质量的自定义配置
4. 添加图片缓存机制，避免重复下载和转换
