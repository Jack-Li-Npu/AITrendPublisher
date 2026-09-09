# Five-minute project walkthrough

**English** | [简体中文](DEMO.zh-CN.md) · [All guides](README.md) · [Project introduction](../README.md)

The demo runs **the real `public/index.html` interface** against a separate fixture backend. It demonstrates selection, preview, and editing with hand-authored Chinese sample text. It does not scrape websites, generate text or images, save secrets, or contact WeChat. The demo's small HTML renderer supports headings, paragraphs, blockquotes, and separators; it is not the production Doocs renderer.

## Find your way around the Chinese interface

The interface has not yet been translated into English. Use these exact labels to follow the screenshots; choosing English documentation does not change the application's language.

| Label in the app | English meaning | What to do |
| --- | --- | --- |
| 演示模式 | Demo mode | Confirms the session uses sample data |
| 科技新闻 | Technology news | Select news-source mode |
| 内容长度（字数） | Content length | Sets a Chinese character-count target, not an English word-count guarantee |
| 最大采集篇数 | Maximum articles | Choose how many news items to collect |
| 文章模板 | Article template | Choose the layout |
| 自定义结语 | Custom closing paragraph | Supply an ending in the live app; edit Markdown in the demo |
| 开始运行任务 | Run task | Start preparing an article |
| 实时运行日志 | Live logs | Follow workflow progress |
| 文章预览 | Article preview | Review the assembled article |
| 再改改 | Edit / refine | Open the full Markdown editor |
| 保存修改 | Save changes | Apply edits to the preview |
| AI 润色 | AI rewrite | Request model-assisted revision in the live app |
| 上传至微信草稿箱 | Upload to WeChat drafts | Create a draft; it does not send to subscribers |
| 配置中心 | Settings | Configure providers; accessible through the gear icon |
| 关闭 | Close | Return to the previous panel |

## What the sample article says

The title means **“From a technology lead to an article worth reading.”** Its four sections describe discovering material, organizing it into an article, editing before delivery, and sending it to the WeChat draft box. The green note explicitly labels the article as a hand-written example, not current news or model output. You can replace the text with English Markdown to try the editor; that does not exercise the live writing prompts.

## Start

From the repository root (clone instructions are in the [setup guide](GETTING_STARTED.md)):

```bash
deno task --config demo.json demo
```

Open `http://127.0.0.1:8001`. The dark **DEMO / 演示模式** banner identifies this session. Do not enter real keys. The backend reads only the UI file and holds edits in memory; it has no environment or file-write permissions.

## Walk through the product

| Step | Action | What to notice |
| --- | --- | --- |
| 1. Select | Choose 科技新闻 (Technology news) | Article count and length controls describe the news workflow |
| 2. Run | Click 开始运行任务 (Run task); scroll the left panel if needed | A sample preview appears after the UI's polling interval |
| 3. Read | Inspect the article | The sample explains collection, preparation, review, and draft delivery |
| 4. Edit | Click 再改改 (Edit / refine) | Markdown source and its preview appear side by side |
| 5. Save | Change a sentence, click 保存修改 (Save changes) | The preview updates; close and reopen the editor to verify the edit remains |
| 6. Try layout | Select the Elegant preview template | The demo changes the heading accent; production uses fuller Doocs themes |
| 7. Understand delivery | Click 上传至微信草稿箱 (Upload to WeChat drafts) | An explicit demo message explains that no upload occurs |
| 8. Compare modes | Close the preview, choose GitHub Trending, run again | A different sample title loads; news length/count controls disappear |

AI 润色 and saving configuration intentionally return explanatory errors in this demo. They do not simulate successful AI calls or claim to persist settings. Custom footer changes should be made in the Markdown editor for the demo.

![Sample article preview](assets/article-preview.png)

![Markdown editor](assets/markdown-editor.png)

## Suggested demonstration narration

“This is a local article workbench for AI news and open-source projects. I choose the subject source here, prepare an article, and review it in a WeChat-style layout. If the structure or voice needs work, I edit the Markdown in this panel. In a configured live run, AI can help revise it. When I am satisfied, the app uploads a draft to WeChat; I make the final sending decision in the Official Account backend.”

Always introduce this as a sample-data demonstration. Do not describe its text as current news or its instant preview as real model latency.

## Refresh the screenshots

Use a clean demo session. Capture the dashboard before running, the sample article after preview loads, and the Markdown editor with its first section visible. Keep the demo banner visible where the panel allows it; caption all images as sample data. Save PNG files under `docs/assets/` with the existing filenames. Do not capture a real configuration session or credentials.

The server's in-memory preview is shared by demo tabs. Restart the server for a completely fresh backend; running again replaces the sample article. Ctrl+C stops the demo.
