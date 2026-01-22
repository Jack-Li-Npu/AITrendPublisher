# 视频转 GIF 功能实现计划

## 功能概述
从文章中提取视频链接，对于时长小于 1 分钟的视频，自动转换为 GIF 并插入到原文中。

## 技术方案

### 1. 视频链接提取
- **支持格式**：
  - HTML `<video>` 标签：`<video src="url">`
  - iframe 嵌入：YouTube、Vimeo 等
  - 直接视频链接：MP4、WebM、MOV 等
  - Markdown 中的视频链接

### 2. 视频时长检测
- **方法 1**：使用 `ffprobe`（FFmpeg 工具）获取视频元数据
- **方法 2**：对于 YouTube/Vimeo，使用 `youtube-dl`/`yt-dlp` 获取时长
- **方法 3**：下载视频头部，解析元数据（部分格式支持）

### 3. 视频下载
- **直接链接**：HTTP GET 下载
- **YouTube/Vimeo**：使用 `youtube-dl` 或 `yt-dlp` 下载
- **临时存储**：下载到临时目录，转换后删除

### 4. 视频转 GIF
- **工具**：FFmpeg
- **参数**：
  - 帧率：10-15 fps（降低文件大小）
  - 最大宽度：500-800px
  - 颜色数量：256 色（优化文件大小）
  - 时长：完整视频或前 60 秒

### 5. GIF 上传
- 使用现有的 `WeixinPublisher.uploadContentImage()` 方法
- 上传到微信 CDN

### 6. 内容替换
- 将原视频链接/标签替换为 GIF 图片
- 保留原视频链接作为备用（可选）

## 实现文件

### 新建文件
1. `src/utils/video/video-processor.ts` - 视频处理核心类
2. `src/utils/video/video-to-gif-converter.ts` - 视频转 GIF 转换器

### 修改文件
1. `src/services/weixin-article.workflow.ts` - 在 `processContent` 方法中添加视频处理逻辑
2. `src/modules/scrapers/fireCrawl.scraper.ts` - 增强视频链接提取（如果 FireCrawl 未提取）

## 依赖要求

### 系统依赖
- **FFmpeg**：用于视频转 GIF（必需）
- **youtube-dl 或 yt-dlp**：用于下载 YouTube/Vimeo 视频（可选，仅当需要支持这些平台时）

### Deno 依赖
- 可能需要调用系统命令（`Deno.Command`）
- 文件系统操作（临时文件管理）

## 实现步骤

### 阶段 1：视频链接提取
1. 创建 `extractVideoLinks()` 方法
2. 支持多种视频格式识别
3. 提取视频 URL

### 阶段 2：视频时长检测
1. 实现 `getVideoDuration()` 方法
2. 支持多种视频来源
3. 错误处理和超时控制

### 阶段 3：视频下载
1. 实现 `downloadVideo()` 方法
2. 支持直接链接和平台链接
3. 临时文件管理

### 阶段 4：视频转 GIF
1. 实现 `convertVideoToGif()` 方法
2. FFmpeg 命令构建
3. 参数优化（文件大小控制）

### 阶段 5：集成到工作流
1. 在 `processContent` 中调用视频处理
2. GIF 上传到微信 CDN
3. 内容替换逻辑

## 注意事项

1. **性能考虑**：
   - 视频下载和转换耗时较长，需要异步处理
   - 考虑添加超时控制（如 2 分钟）
   - 对于批量处理，可能需要队列机制

2. **文件大小控制**：
   - GIF 文件通常较大，需要优化参数
   - 考虑限制 GIF 最大尺寸（如 5MB）

3. **错误处理**：
   - FFmpeg 不可用时，跳过视频处理
   - 视频下载失败时，保留原视频链接
   - 转换失败时，记录日志但不中断流程

4. **缓存机制**：
   - 相同视频 URL 的转换结果可以缓存
   - 避免重复转换

5. **版权和法律**：
   - 确保视频内容可合法使用
   - 遵守各平台的 ToS

## 测试建议

1. 测试直接视频链接（MP4）
2. 测试 YouTube 链接（如果支持）
3. 测试不同时长的视频（< 1 分钟和 > 1 分钟）
4. 测试 FFmpeg 不可用的情况
5. 测试大文件视频的处理性能
