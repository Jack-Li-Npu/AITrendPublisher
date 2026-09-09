# Five-minute project walkthrough

[Back to the introduction](../README.md)

The demo runs **the real `public/index.html` interface** against a separate fixture backend. It demonstrates selection, preview, and editing with hand-authored Chinese sample text. It does not scrape websites, generate text or images, save secrets, or contact WeChat. The demo's small HTML renderer supports headings, paragraphs, blockquotes, and separators; it is not the production Doocs renderer.

## Start

```bash
deno task --config demo.json demo
```

Open `http://127.0.0.1:8001`. The dark **DEMO / 演示模式** banner identifies this session. Do not enter real keys. The backend reads only the UI file and holds edits in memory; it has no environment or file-write permissions.

## Walk through the product

| Step | Action | What to notice |
| --- | --- | --- |
| 1. Select | Choose 科技新闻 | Article count and length controls describe the news workflow |
| 2. Run | Click 开始运行任务; scroll the left panel if needed | A sample preview appears after the UI's polling interval |
| 3. Read | Inspect the article | The sample explains collection, preparation, review, and draft delivery |
| 4. Edit | Click 再改改 | Markdown source and its preview appear side by side |
| 5. Save | Change a sentence, click 保存修改 | The preview updates; close and reopen the editor to verify the edit remains |
| 6. Try layout | Select the Elegant preview template | The demo changes the heading accent; production uses fuller Doocs themes |
| 7. Understand delivery | Click 上传至微信草稿箱 | An explicit demo message explains that no upload occurs |
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
