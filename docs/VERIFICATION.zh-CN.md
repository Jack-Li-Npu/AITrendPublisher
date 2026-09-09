# 验证记录

[English](VERIFICATION.md) | **简体中文** · [全部文档](README.md) · [项目介绍](../README.zh-CN.md)

2026-09-09 的验证环境为 macOS ARM64、Deno 2.6.4、V8 14.2 和 TypeScript 5.9.2。

## 已通过的检查

```bash
deno task --config demo.json test
deno check --no-config scripts/demo.ts scripts/demo_test.ts
deno lint scripts/demo.ts scripts/demo_test.ts
deno fmt --check scripts/demo.ts scripts/demo_test.ts
```

独立演示也在全新的 `DENO_DIR` 下通过测试，无需下载生产依赖。

两个演示测试覆盖初始空状态、按模式加载样稿、内存 Markdown 更新、禁止 AI 调用与配置保存及真实发布、HTML 转义、拒绝跨域请求，以及禁止读取 `.env`、文章数据和源码文件。测试直接调用处理函数，不需要网络或文件权限。

浏览器验证使用 `deno task --config demo.json demo` 提供的真实控制面板，检查了样稿预览、打开 Markdown 编辑器、修改文字、保存后更新预览、重新打开后保留修改，以及尝试微信上传时明确拒绝。截图使用人工编写的样稿和演示渲染器。

文档 SVG 已通过解析检查，相对链接和图片路径在提交前检查。`scripts/generate-doc-assets.py` 用于重新生成文档插图。

## 主应用原有问题

上一次介绍和演示更新前后，`deno check src/index.ts` 均报告 **70 个错误**。本次双语文档更新没有修改主应用代码，也不表示主应用已经通过类型检查。

原有问题示例：

- `refineContent` 处理 `sectionType: "full"` 和 `currentContent`，但输入类型中缺少对应声明。
- 部分 catch 分支直接读取 `unknown` 类型值的 `.message`。
- 图片处理路径中存在 Buffer 与 Blob 的类型兼容问题。
- 生产模块中还存在渲染器、服务适配器和工作流相关的类型问题。

这些问题需要结合相应集成样例，另行整理生产代码；它们不影响独立演示通过类型检查并运行。

## 本次双语文档检查

英文与中文指南均提供同主题语言切换。检查范围包括文档链接、页内锚点、图片路径、中文 SVG 解析，以及两种语言中关键命令和配置键的一致性。界面按钮保留实际中文标签，并为英文读者提供对应解释。

## 未验证的范围

- 收费文本或图片模型调用、实时网站采集、微信令牌校验、图片上传和草稿创建。
- MySQL、向量和重排服务、每日定时运行，以及 Windows/Linux 安装脚本。
- 多用户或公网部署；真实服务默认只监听本机。

演示不读取用户已有 `.env` 或文章数据。此前演示没有向微信发送或上传真实文章。
